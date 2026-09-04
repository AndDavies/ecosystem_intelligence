import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  canonicalOrganizationRepairSnapshotV1Schema,
  formatZodIssues,
  currentResearchPipelineVersion,
  demandIssuerTypeValues,
  isSharedResearchBoundaryWarning,
  osintCollectionLaneValues,
  osintCoverageDimensionValues,
  organizationKindValues,
  researchClaimLedgerV1Schema,
  researchClaimLedgerQualityIssues,
  researchCandidateBatchV2Schema,
  researchCollectionPlanV1Schema,
  researchSignalBatchV1Schema,
  researchProspectInventoryV1Schema,
  reviewCandidateIntakeIssues,
  researchRunCompletionIssues,
  researchRunSchema,
  researchCandidateQualityIssues,
  researchRecordSpecificityIssues,
  researchReviewLineageIssues,
  requiresResearchQualityContract,
  requiresRecordSpecificResearchContract,
  sourceLeadBatchV2Schema,
  type ResearchCandidateBatchV2,
  type ResearchClaimLedgerV1,
  type ResearchCollectionPlanV1,
  type ResearchRun,
  type ResearchSignalBatchV1,
} from "../src/lib/research/pipeline-schema";
import { buildDefaultResearchRunId } from "../src/lib/research/run-id";
import { researchIdentityMatches } from "../src/lib/research/identity-match";
import {
  assessCandidateLinkability,
  formatCandidateLinkabilityReview,
  type LinkabilityCatalog,
  type LinkabilityProgram
} from "../src/lib/research/linkability-review";
import { parseSourceBookCsv, rankSourceBookRows } from "../src/lib/research/source-ranking";
import { buildStagingCandidateChange, buildStagingResearchRun, canonicalArtifactRunIssues, canonicalRepairSnapshotParityIssues, recordSpecificArtifactRequirements, stagingPayloadParityIssues } from "../src/lib/research/staging-integrity";
import { assertDeployedResearchReviewContract, researchCandidateContractIssues, researchReviewContractVersion } from "../src/lib/research/deployment-contract";
import {
  researchWorkflowCliModeValues,
  researchWorkflowModeConfiguration,
  researchWorkflowModeForRunMode,
  researchWorkflowRunMode
} from "../src/lib/research/workflow-registry";
import { withResearchWriterLock } from "../src/lib/research/single-writer-lock";
import { loadScriptEnv } from "./load-env";

loadScriptEnv();

const workspaceRoot = path.resolve(process.cwd(), "..");
const researchRoot = path.join(workspaceRoot, "research");
const ingestionRoot = path.join(researchRoot, "ingestion");
const runDir = path.join(ingestionRoot, "runs");
const briefDir = path.join(ingestionRoot, "briefs");
const sourceLeadDir = path.join(ingestionRoot, "source-leads-v2");
const prospectDir = path.join(ingestionRoot, "prospect-inventories-v1");
const candidateDir = path.join(ingestionRoot, "candidate-batches-v2");
const reviewDir = path.join(ingestionRoot, "reviews-v2");
const stagingDir = path.join(ingestionRoot, "staging");
const signalDir = path.join(ingestionRoot, "signal-batches-v1");
const collectionPlanDir = path.join(ingestionRoot, "collection-plans-v1");
const claimLedgerDir = path.join(ingestionRoot, "claim-ledgers-v1");
const canonicalRepairSnapshotDir = path.join(ingestionRoot, "local", "canonical-repair-snapshots-v1");

interface ExistingIdentity {
  id: string;
  name: string;
  slug: string;
  websiteDomain: string | null;
  source: string;
}

interface ResearchCoverageOrganization extends ExistingIdentity {
  legalName: string | null;
  websiteUrl: string | null;
  updatedAt: string | null;
  aliases: string[];
  entityKind: (typeof organizationKindValues)[number];
  capabilityCount: number;
  missionAreaSlugs: string[];
  technicalDomainSlugs: string[];
  publishedAt: string | null;
  editorialProfileVersion: string | null;
}

interface ResearchCoverageSnapshot {
  organizations: ResearchCoverageOrganization[];
  missionAreas: Array<{ slug: string; name: string }>;
  technicalDomains: Array<{ slug: string; name: string }>;
  demandRequirements: Array<{ slug: string; sourceSlug: string; matchCount: number }>;
  issuerCounts: Record<string, number>;
  candidateStatuses: Record<string, string>;
  activeReviewTargetIds: string[];
  reviewQueueReadAvailable: boolean;
  programs: LinkabilityProgram[];
  redirectSourceOrganizationIds: string[];
}

interface ValidationReport {
  kind: "run" | "collection_plan" | "claim_ledger" | "canonical_repair_snapshot" | "prospect_inventory" | "source_leads" | "candidate_batch" | "signal_batch";
  filePath: string;
  id: string;
  errors: string[];
  warnings: string[];
  counts: Record<string, number>;
}

const kindCoverageTargets: Record<(typeof organizationKindValues)[number], number> = {
  company: 100,
  accelerator: 12,
  incubator: 12,
  research_test_centre: 12,
  investor_funder: 12,
  ecosystem_organization: 12,
  government_innovation_office: 10
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalizeName(value: string) {
  return value.toLocaleLowerCase("en-CA").replace(/[^a-z0-9]+/g, " ").trim();
}

function selectBalancedCorpusTargets(organizations: ResearchCoverageOrganization[], limit: number) {
  const buckets = new Map(organizationKindValues.map((kind) => [
    kind,
    organizations.filter((organization) => organization.entityKind === kind).sort((left, right) => left.slug.localeCompare(right.slug))
  ]));
  const selected: ResearchCoverageOrganization[] = [];
  while (selected.length < limit) {
    let added = false;
    for (const kind of organizationKindValues) {
      const next = buckets.get(kind)?.shift();
      if (!next) continue;
      selected.push(next);
      added = true;
      if (selected.length === limit) break;
    }
    if (!added) break;
  }
  return selected;
}

function dossierResearchTerms(kind: ResearchCoverageOrganization["entityKind"]) {
  if (kind === "company") return "product platform technology specification interface deployment contract customer";
  if (kind === "investor_funder") return "investment thesis stage ticket portfolio fund eligibility application";
  if (kind === "research_test_centre") return "facility equipment test service qualification access security program customer";
  if (kind === "ecosystem_organization") return "membership committee program eligibility partner outcome application";
  return "program eligibility cohort service intake partner outcome application";
}

function urlDomain(value: string | null | undefined) {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function relative(filePath: string) {
  return path.relative(workspaceRoot, filePath);
}

function canonicalPlanTargetSlugs(plan: ResearchCollectionPlanV1) {
  return plan.targetSubjects.map((subject) =>
    subject.subjectId.startsWith("organization-") ? subject.subjectId.slice("organization-".length) : ""
  );
}

async function readCanonicalRepairSnapshot(runId: string, slugs: string[]) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Canonical repair snapshot capture requires production SUPABASE_SERVICE_ROLE_KEY credentials.");
  }
  const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await client.rpc("get_canonical_organization_repair_snapshot", {
    p_run_id: runId,
    p_slugs: slugs
  });
  if (error) throw new Error(`Could not capture the exact canonical-repair snapshot: ${error.message}`);
  const parsed = canonicalOrganizationRepairSnapshotV1Schema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Canonical-repair snapshot RPC returned an invalid artifact: ${formatZodIssues(parsed.error).join("; ")}`);
  }
  const expectedSlugs = [...slugs].sort((left, right) => left.localeCompare(right));
  if (parsed.data.runId !== runId
      || JSON.stringify(parsed.data.targets.map((target) => target.organization.slug)) !== JSON.stringify(expectedSlugs)) {
    throw new Error("Canonical-repair snapshot RPC did not return the exact resolved target set.");
  }
  return parsed.data;
}

function isActiveReviewCandidateStatus(status: string | undefined) {
  return status === "pending" || status === "approved";
}

let researchCoveragePromise: Promise<ResearchCoverageSnapshot> | null = null;

async function loadResearchCoverage(): Promise<ResearchCoverageSnapshot> {
  if (researchCoveragePromise) return researchCoveragePromise;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Production database credentials are required for research coverage and taxonomy validation.");
  }

  researchCoveragePromise = (async () => {
    const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const adminClient = serviceRoleKey
      ? createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
      : null;
    // Full-corpus validation is a credentialed operator workflow. Prefer its
    // service-role reader when available so repeated validation does not pay
    // the public RLS policy cost; retain the public client for local checks
    // where no operator credential is present.
    const coverageClient = adminClient ?? client;
    const [
      organizationsResult,
      capabilitiesResult,
      missionAreasResult,
      missionMatchesResult,
      technicalDomainsResult,
      capabilityDomainsResult,
      demandSourcesResult,
      demandRequirementsResult,
      demandMatchesResult,
      demandIssuersResult,
      demandSourceIssuersResult,
      candidateStatusesResult,
      activeCandidateTargetsResult,
      organizationAliasesResult,
      programsResult
    ] = await Promise.all([
      coverageClient.from("organizations").select("id, name, legal_name, slug, website_url, entity_kind, published_at, updated_at, editorial_profile_version").eq("publication_status", "published"),
      coverageClient.from("capabilities").select("id, organization_id").eq("publication_status", "published"),
      coverageClient.from("mission_areas").select("id, slug, name").eq("publication_status", "published"),
      coverageClient.from("capability_mission_matches").select("capability_id, mission_area_id").eq("publication_status", "published"),
      coverageClient.from("technical_domains").select("id, slug, name").eq("publication_status", "published"),
      coverageClient.from("capability_domains").select("capability_id, technical_domain_id").eq("publication_status", "published"),
      coverageClient.from("demand_sources").select("id, slug").eq("publication_status", "published"),
      coverageClient.from("demand_requirements").select("id, slug, demand_source_id").eq("publication_status", "published"),
      coverageClient.from("capability_demand_matches").select("demand_requirement_id").eq("publication_status", "published"),
      coverageClient.from("demand_issuers").select("id, issuer_type").eq("publication_status", "published"),
      coverageClient.from("demand_source_issuers").select("demand_source_id, demand_issuer_id").eq("publication_status", "published"),
      adminClient
        ? adminClient.from("candidate_changes").select("client_candidate_id, status").not("client_candidate_id", "is", null)
        : Promise.resolve({ data: [], error: null }),
      adminClient
        ? adminClient.from("candidate_changes").select("target_entity_id, candidate_kind, status").in("status", ["pending", "approved"])
        : Promise.resolve({ data: [], error: null }),
      coverageClient.from("organization_aliases").select("organization_id, alias").neq("publication_status", "archived"),
      coverageClient.from("programs").select("id, slug, name, program_type, operator_name, website_url, summary").eq("publication_status", "published")
    ]);

    const results = [
      ["organizations", organizationsResult],
      ["capabilities", capabilitiesResult],
      ["mission areas", missionAreasResult],
      ["mission matches", missionMatchesResult],
      ["technical domains", technicalDomainsResult],
      ["capability domains", capabilityDomainsResult],
      ["demand sources", demandSourcesResult],
      ["demand requirements", demandRequirementsResult],
      ["demand matches", demandMatchesResult],
      ["demand issuers", demandIssuersResult],
      ["demand source issuers", demandSourceIssuersResult],
      ["candidate statuses", candidateStatusesResult],
      ["active candidate targets", activeCandidateTargetsResult],
      ["organization aliases", organizationAliasesResult],
      ["programs", programsResult]
    ] as const;
    for (const [label, result] of results) {
      if (result.error) throw new Error(`Failed to load live ${label} for research coverage: ${result.error.message}`);
    }

    const organizations = (organizationsResult.data ?? []) as Array<{ id: string; name: string; legal_name: string | null; slug: string; website_url: string | null; entity_kind: (typeof organizationKindValues)[number]; published_at: string | null; updated_at: string | null; editorial_profile_version: string | null }>;
    const capabilities = (capabilitiesResult.data ?? []) as Array<{ id: string; organization_id: string }>;
    const capabilityOrganization = new Map(capabilities.map((capability) => [capability.id, capability.organization_id]));
    const missionAreas = (missionAreasResult.data ?? []) as Array<{ id: string; slug: string; name: string }>;
    const technicalDomains = (technicalDomainsResult.data ?? []) as Array<{ id: string; slug: string; name: string }>;
    const missionSlugById = new Map(missionAreas.map((mission) => [mission.id, mission.slug]));
    const domainSlugById = new Map(technicalDomains.map((domain) => [domain.id, domain.slug]));
    const missionSlugsByOrganization = new Map<string, string[]>();
    const domainSlugsByOrganization = new Map<string, string[]>();

    for (const match of (missionMatchesResult.data ?? []) as Array<{ capability_id: string; mission_area_id: string }>) {
      const organizationId = capabilityOrganization.get(match.capability_id);
      const slug = missionSlugById.get(match.mission_area_id);
      if (organizationId && slug) missionSlugsByOrganization.set(organizationId, [...(missionSlugsByOrganization.get(organizationId) ?? []), slug]);
    }
    for (const mapping of (capabilityDomainsResult.data ?? []) as Array<{ capability_id: string; technical_domain_id: string }>) {
      const organizationId = capabilityOrganization.get(mapping.capability_id);
      const slug = domainSlugById.get(mapping.technical_domain_id);
      if (organizationId && slug) domainSlugsByOrganization.set(organizationId, [...(domainSlugsByOrganization.get(organizationId) ?? []), slug]);
    }

    const capabilityCountByOrganization = new Map<string, number>();
    for (const capability of capabilities) capabilityCountByOrganization.set(capability.organization_id, (capabilityCountByOrganization.get(capability.organization_id) ?? 0) + 1);

    const aliasesByOrganization = new Map<string, string[]>();
    for (const alias of (organizationAliasesResult.data ?? []) as Array<{ organization_id: string; alias: string }>) {
      aliasesByOrganization.set(alias.organization_id, [...(aliasesByOrganization.get(alias.organization_id) ?? []), alias.alias]);
    }

    const sourceSlugById = new Map(((demandSourcesResult.data ?? []) as Array<{ id: string; slug: string }>).map((source) => [source.id, source.slug]));
    const demandMatchCounts = new Map<string, number>();
    for (const match of (demandMatchesResult.data ?? []) as Array<{ demand_requirement_id: string }>) {
      demandMatchCounts.set(match.demand_requirement_id, (demandMatchCounts.get(match.demand_requirement_id) ?? 0) + 1);
    }

    const issuerTypeById = new Map(((demandIssuersResult.data ?? []) as Array<{ id: string; issuer_type: string }>).map((issuer) => [issuer.id, issuer.issuer_type]));
    const sourcesByIssuerType = new Map<string, Set<string>>();
    for (const link of (demandSourceIssuersResult.data ?? []) as Array<{ demand_source_id: string; demand_issuer_id: string }>) {
      const issuerType = issuerTypeById.get(link.demand_issuer_id);
      if (!issuerType) continue;
      const sourceIds = sourcesByIssuerType.get(issuerType) ?? new Set<string>();
      sourceIds.add(link.demand_source_id);
      sourcesByIssuerType.set(issuerType, sourceIds);
    }

    let redirectSourceOrganizationIds: string[] = [];
    if (adminClient) {
      const { data: redirects, error: redirectsError } = await adminClient
        .from("organization_slug_redirects")
        .select("source_organization_id");
      // Older deployed contracts do not yet expose the canonical-repair table.
      // Canonical preparation is separately blocked by deployed-contract
      // preflight; ordinary research must remain usable during that interval.
      if (!redirectsError) {
        redirectSourceOrganizationIds = (redirects ?? []).map((row) => String(row.source_organization_id));
      }
    }

    return {
      missionAreas: missionAreas.map(({ slug, name }) => ({ slug, name })),
      technicalDomains: technicalDomains.map(({ slug, name }) => ({ slug, name })),
      organizations: organizations.map((organization) => ({
        id: organization.id,
        name: organization.name,
        legalName: organization.legal_name,
        websiteUrl: organization.website_url,
        updatedAt: organization.updated_at,
        slug: organization.slug,
        websiteDomain: urlDomain(organization.website_url),
        source: "published atlas",
        aliases: (aliasesByOrganization.get(organization.id) ?? []).sort((left, right) => left.localeCompare(right)),
        entityKind: organization.entity_kind,
        capabilityCount: capabilityCountByOrganization.get(organization.id) ?? 0,
        missionAreaSlugs: missionSlugsByOrganization.get(organization.id) ?? [],
        technicalDomainSlugs: domainSlugsByOrganization.get(organization.id) ?? [],
        publishedAt: organization.published_at,
        editorialProfileVersion: organization.editorial_profile_version
      })),
      demandRequirements: ((demandRequirementsResult.data ?? []) as Array<{ id: string; slug: string; demand_source_id: string }>).map((requirement) => ({
        slug: requirement.slug,
        sourceSlug: sourceSlugById.get(requirement.demand_source_id) ?? requirement.demand_source_id,
        matchCount: demandMatchCounts.get(requirement.id) ?? 0
      })),
      issuerCounts: Object.fromEntries(demandIssuerTypeValues.map((issuerType) => [issuerType, sourcesByIssuerType.get(issuerType)?.size ?? 0])),
      candidateStatuses: Object.fromEntries(
        ((candidateStatusesResult.data ?? []) as Array<{ client_candidate_id: string | null; status: string }>)
          .filter((candidate): candidate is { client_candidate_id: string; status: string } => Boolean(candidate.client_candidate_id))
          .map((candidate) => [candidate.client_candidate_id, candidate.status])
      ),
      activeReviewTargetIds: ((activeCandidateTargetsResult.data ?? []) as Array<{ target_entity_id: string | null; status: string }>)
        .filter((candidate) => candidate.target_entity_id && isActiveReviewCandidateStatus(candidate.status))
        .map((candidate) => candidate.target_entity_id as string),
      reviewQueueReadAvailable: Boolean(adminClient),
      redirectSourceOrganizationIds,
      programs: ((programsResult.data ?? []) as Array<{
        id: string;
        slug: string;
        name: string;
        program_type: string;
        operator_name: string | null;
        website_url: string | null;
        summary: string | null;
      }>).map((program) => ({
        id: program.id,
        slug: program.slug,
        name: program.name,
        programType: program.program_type,
        operatorName: program.operator_name,
        websiteUrl: program.website_url,
        summary: program.summary
      })).sort((left, right) => left.slug.localeCompare(right.slug))
    };
  })();

  return researchCoveragePromise;
}

function parseOptions(args: string[]) {
  const options = new Map<string, string>();
  const positional: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--") continue;
    if (value.startsWith("--")) {
      const next = args[index + 1];
      options.set(value.slice(2), next && !next.startsWith("--") ? next : "true");
      if (next && !next.startsWith("--")) index += 1;
    } else {
      positional.push(value);
    }
  }

  return { options, positional };
}

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function listJsonFiles(directory: string) {
  if (!(await fileExists(directory))) return [];
  return (await readdir(directory))
    .filter((entry) => entry.endsWith(".json"))
    .sort()
    .map((entry) => path.join(directory, entry));
}

async function collectExistingIdentities(options: { excludePath?: string; excludeRunId?: string } = {}) {
  const identities = new Map<string, ExistingIdentity>();
  const add = (identity: ExistingIdentity) => {
    const key = `${identity.slug}|${identity.websiteDomain ?? ""}|${normalizeName(identity.name)}`;
    identities.set(key, identity);
  };

  const coverage = await loadResearchCoverage();
  for (const organization of coverage.organizations) add(organization);

  for (const filePath of await listJsonFiles(candidateDir)) {
    if (filePath === options.excludePath) continue;
    const parsed = researchCandidateBatchV2Schema.safeParse(await readJson<unknown>(filePath));
    if (!parsed.success) continue;
    if (parsed.data.runId === options.excludeRunId) continue;
    for (const candidate of parsed.data.candidates) {
      if (candidate.candidateKind !== "organization_bundle") continue;
      if (!isActiveReviewCandidateStatus(coverage.candidateStatuses[candidate.candidateId])) continue;
      add({
        id: candidate.candidateId,
        name: candidate.organization.name,
        slug: candidate.organization.slug,
        websiteDomain: urlDomain(candidate.organization.websiteUrl),
        source: relative(filePath)
      });
    }
  }

  return [...identities.values()];
}

async function buildCoverage() {
  const atlas = await loadResearchCoverage();
  const publishedKinds = Object.fromEntries(organizationKindValues.map((kind) => [kind, 0])) as Record<string, number>;
  for (const organization of atlas.organizations) publishedKinds[organization.entityKind] += 1;

  const pendingKinds = Object.fromEntries(organizationKindValues.map((kind) => [kind, 0])) as Record<string, number>;
  const publishedMissionCounts = Object.fromEntries(atlas.missionAreas.map((mission) => [mission.slug, 0])) as Record<string, number>;
  const pendingMissionCounts = Object.fromEntries(atlas.missionAreas.map((mission) => [mission.slug, 0])) as Record<string, number>;
  const publishedDomainCounts = Object.fromEntries(atlas.technicalDomains.map((domain) => [domain.slug, 0])) as Record<string, number>;
  const pendingDomainCounts = Object.fromEntries(atlas.technicalDomains.map((domain) => [domain.slug, 0])) as Record<string, number>;
  const publishedIssuerCounts = Object.fromEntries(demandIssuerTypeValues.map((issuerType) => [issuerType, 0])) as Record<string, number>;
  const pendingIssuerCounts = Object.fromEntries(demandIssuerTypeValues.map((issuerType) => [issuerType, 0])) as Record<string, number>;

  for (const organization of atlas.organizations) {
    for (const missionSlug of organization.missionAreaSlugs) {
      if (missionSlug in publishedMissionCounts) publishedMissionCounts[missionSlug] += 1;
    }
    for (const domainSlug of organization.technicalDomainSlugs) {
      if (domainSlug in publishedDomainCounts) publishedDomainCounts[domainSlug] += 1;
    }
  }
  for (const issuerType of demandIssuerTypeValues) publishedIssuerCounts[issuerType] = atlas.issuerCounts[issuerType] ?? 0;

  const pendingDemandRequirements: string[] = [];
  const publishedOrganizationSlugs = new Set(atlas.organizations.map((organization) => organization.slug));
  const publishedDemandSourceSlugs = new Set(atlas.demandRequirements.map((requirement) => requirement.sourceSlug));
  for (const filePath of await listJsonFiles(candidateDir)) {
    const parsed = researchCandidateBatchV2Schema.safeParse(await readJson<unknown>(filePath));
    if (!parsed.success) continue;
    for (const candidate of parsed.data.candidates) {
      if (!isActiveReviewCandidateStatus(atlas.candidateStatuses[candidate.candidateId])) continue;
      if (candidate.candidateKind === "organization_bundle") {
        if (publishedOrganizationSlugs.has(candidate.organization.slug)) continue;
        pendingKinds[candidate.organization.entityKind] += 1;
        for (const capability of candidate.capabilities) {
          for (const missionMatch of capability.missionMatches) {
            if (missionMatch.missionAreaSlug in pendingMissionCounts) pendingMissionCounts[missionMatch.missionAreaSlug] += 1;
          }
          for (const domainSlug of capability.technicalDomainSlugs) {
            if (domainSlug in pendingDomainCounts) pendingDomainCounts[domainSlug] += 1;
          }
        }
      }
      if (candidate.candidateKind === "demand_signal_bundle") {
        if (publishedDemandSourceSlugs.has(candidate.demandSource.slug)) continue;
        const issuerTypes = new Set(candidate.issuers.map((issuer) => issuer.issuerType));
        for (const issuerType of issuerTypes) pendingIssuerCounts[issuerType] += 1;
        pendingDemandRequirements.push(...candidate.requirements.map((requirement) => requirement.slug));
      }
    }
  }

  const sourceBookPath = path.join(researchRoot, "source-book", "known-sources.csv");
  const sourceBook = parseSourceBookCsv(await readFile(sourceBookPath, "utf8"));
  const sourceBookRows = sourceBook.length;
  const sourceBookOperationalRows = sourceBook.filter((row) =>
    row.expected_organization_yield && row.geography && row.refresh_cadence && row.canonical_domain_owner
  ).length;
  const missingKinds = organizationKindValues.filter((kind) => publishedKinds[kind] + pendingKinds[kind] === 0);
  const missingMissionAreas = atlas.missionAreas
    .filter((mission) => publishedMissionCounts[mission.slug] + pendingMissionCounts[mission.slug] === 0)
    .map((mission) => mission.slug);
  const missingTechnicalDomains = atlas.technicalDomains
    .filter((domain) => publishedDomainCounts[domain.slug] + pendingDomainCounts[domain.slug] === 0)
    .map((domain) => domain.slug);
  const missingIssuerTypes = demandIssuerTypeValues.filter((issuerType) => publishedIssuerCounts[issuerType] + pendingIssuerCounts[issuerType] === 0);
  const unmatchedDemandRequirements = [...new Set([
    ...atlas.demandRequirements.filter((requirement) => requirement.matchCount === 0).map((requirement) => requirement.slug),
    ...pendingDemandRequirements
  ])];

  return {
    generatedAt: new Date().toISOString(),
    sourceBookRows,
    sourceBookOperationalRows,
    rankedSources: rankSourceBookRows(sourceBook),
    publishedOrganizations: atlas.organizations.length,
    publishedCapabilities: atlas.organizations.reduce((sum, organization) => sum + organization.capabilityCount, 0),
    publishedDemandRequirements: atlas.demandRequirements.length,
    publishedKinds,
    pendingKinds,
    missingKinds,
    publishedMissionCounts,
    pendingMissionCounts,
    missingMissionAreas,
    publishedDomainCounts,
    pendingDomainCounts,
    missingTechnicalDomains,
    publishedIssuerCounts,
    pendingIssuerCounts,
    missingIssuerTypes,
    unmatchedDemandRequirements,
    missionAreas: atlas.missionAreas,
    technicalDomains: atlas.technicalDomains
  };
}

function selectGap(coverage: Awaited<ReturnType<typeof buildCoverage>>, bootstrap: boolean) {
  if (bootstrap) {
    return {
      coverageView: "ecosystem_support" as const,
      dimension: "balanced-company-accelerator-incubator-investor-bootstrap",
      reason: "The bootstrap mode exercises company, accelerator, incubator, and investor or funder validation paths while keeping publication under explicit human control.",
      score: 1000
    };
  }

  const missionSlug = coverage.missingMissionAreas[0];
  if (missionSlug) {
    return {
      coverageView: "supply" as const,
      dimension: `mission-area:${missionSlug}`,
      reason: `No published or pending capability candidate currently maps to the active ${missionSlug.replaceAll("-", " ")} mission lane.`,
      score: 1000
    };
  }

  const domainSlug = coverage.missingTechnicalDomains[0];
  if (domainSlug) {
    return {
      coverageView: "supply" as const,
      dimension: `technical-domain:${domainSlug}`,
      reason: `No published or pending capability candidate currently covers the ${domainSlug.replaceAll("-", " ")} technical domain.`,
      score: 980
    };
  }

  const saturatedKindGap = organizationKindValues.map((kind) => {
    const count = coverage.publishedKinds[kind] + coverage.pendingKinds[kind];
    const target = kindCoverageTargets[kind];
    return { kind, count, target, deficit: Math.max(0, target - count) / target };
  }).sort((left, right) => right.deficit - left.deficit || left.count - right.count || left.kind.localeCompare(right.kind))[0];
  if (saturatedKindGap.deficit > 0) {
    return {
      coverageView: saturatedKindGap.kind === "company" ? "supply" as const : "ecosystem_support" as const,
      dimension: `organization-kind:${saturatedKindGap.kind}`,
      reason: `${saturatedKindGap.count} published or pending ${saturatedKindGap.kind.replaceAll("_", " ")} records cover only ${Math.round((saturatedKindGap.count / saturatedKindGap.target) * 100)}% of the working saturation target of ${saturatedKindGap.target}.`,
      score: Math.round(700 + saturatedKindGap.deficit * 250)
    };
  }

  const kind = coverage.missingKinds.find((candidate) => candidate !== "company");
  if (kind) {
    return {
      coverageView: "ecosystem_support" as const,
      dimension: `organization-kind:${kind}`,
      reason: `No published or pending ${kind.replaceAll("_", " ")} organization is represented in the local coverage view.`,
      score: 950
    };
  }

  const issuerType = coverage.missingIssuerTypes[0];
  if (issuerType) {
    return {
      coverageView: "demand" as const,
      dimension: `demand-issuer-type:${issuerType}`,
      reason: `No published or pending public demand source currently represents the ${issuerType.replaceAll("_", " ")} issuer lane.`,
      score: 925
    };
  }

  const unmatchedRequirement = coverage.unmatchedDemandRequirements[0];
  if (unmatchedRequirement) {
    return {
      coverageView: "demand" as const,
      dimension: `unmatched-demand:${unmatchedRequirement}`,
      reason: `The public ${unmatchedRequirement.replaceAll("-", " ")} demand requirement has no reviewed capability match in the local atlas.`,
      score: 850
    };
  }

  const lowestMission = [...coverage.missionAreas].sort((left, right) => {
    const leftCount = coverage.publishedMissionCounts[left.slug] + coverage.pendingMissionCounts[left.slug];
    const rightCount = coverage.publishedMissionCounts[right.slug] + coverage.pendingMissionCounts[right.slug];
    return leftCount - rightCount || left.slug.localeCompare(right.slug);
  })[0];

  return {
    coverageView: "supply" as const,
    dimension: `low-count-mission:${lowestMission.slug}`,
    reason: `All zero-coverage and issuer-type gaps are filled, so the lowest-count active mission lane is ${lowestMission.name}.`,
    score: 700
  };
}

function formatCoverage(coverage: Awaited<ReturnType<typeof buildCoverage>>) {
  const lines = [
    `# Autonomous Research Coverage - ${coverage.generatedAt.slice(0, 10)}`,
    "",
    `- Durable Source Book rows: ${coverage.sourceBookRows}`,
    `- Operationally ranked Source Book rows: ${coverage.sourceBookOperationalRows} (${Math.round((coverage.sourceBookOperationalRows / Math.max(coverage.sourceBookRows, 1)) * 100)}%)`,
    `- Published organizations in current atlas: ${coverage.publishedOrganizations}`,
    `- Published capabilities in current atlas: ${coverage.publishedCapabilities}`,
    `- Published demand requirements: ${coverage.publishedDemandRequirements}`,
    "",
    "| Organization kind | Published | Active review |",
    "| --- | ---: | ---: |",
    ...organizationKindValues.map((kind) => `| ${kind} | ${coverage.publishedKinds[kind]} | ${coverage.pendingKinds[kind]} |`),
    "",
    `Missing kinds: ${coverage.missingKinds.join(", ") || "none"}`,
    "",
    "| Supply mission lane | Published matches | Active-review matches |",
    "| --- | ---: | ---: |",
    ...coverage.missionAreas.map((mission) => `| ${mission.slug} | ${coverage.publishedMissionCounts[mission.slug]} | ${coverage.pendingMissionCounts[mission.slug]} |`),
    "",
    "| Technical domain | Published capabilities | Active-review capabilities |",
    "| --- | ---: | ---: |",
    ...coverage.technicalDomains.map((domain) => `| ${domain.slug} | ${coverage.publishedDomainCounts[domain.slug]} | ${coverage.pendingDomainCounts[domain.slug]} |`),
    "",
    "| Public-demand issuer type | Published sources | Active-review sources |",
    "| --- | ---: | ---: |",
    ...demandIssuerTypeValues.map((issuerType) => `| ${issuerType} | ${coverage.publishedIssuerCounts[issuerType]} | ${coverage.pendingIssuerCounts[issuerType]} |`),
    "",
    `Unmatched public-demand requirements: ${coverage.unmatchedDemandRequirements.join(", ") || "none"}`,
    "",
    "## Highest-ranked reusable sources",
    "",
    ...coverage.rankedSources.slice(0, 12).map((source, index) => `${index + 1}. [${source.name}](${source.url}) - score ${source.score}, expected yield ${source.yield}`),
    ""
  ];
  return lines.join("\n");
}

async function prepareRun(args: string[]) {
  const { options } = parseOptions(args);
  const requestedMode = options.get("mode") ?? "discovery-batch";
  const workflowMode = researchWorkflowModeConfiguration(requestedMode);
  if (!workflowMode) {
    throw new Error(`--mode must be one of: ${researchWorkflowCliModeValues.join(", ")}. The historical gap-targeted value remains parseable only for existing run lineage.`);
  }
  const bootstrap = requestedMode === "bootstrap";
  const deepDossier = requestedMode === "deep-dossier";
  const dossierEnrichment = requestedMode === "dossier-enrichment";
  const corpusRefresh = requestedMode === "corpus-refresh";
  const canonicalRepair = requestedMode === "canonical-repair";
  const organizationDossierMode = dossierEnrichment || corpusRefresh;
  const organizationTargetMode = organizationDossierMode || canonicalRepair;
  const refreshBatch = requestedMode === "refresh-batch";
  await assertDeployedResearchReviewContract(canonicalRepair ? [{
    candidate_kind: "organization_canonical_repair_bundle",
    schema_version: "organization_canonical_repair_bundle_v1"
  }] : [], { requiredPipelineVersion: currentResearchPipelineVersion, phase: "preparation" });
  const startedAt = new Date().toISOString();
  const trigger = options.get("trigger") === "weekly" ? "weekly" : options.get("trigger") === "weekday" ? "weekday" : "manual";
  const runId = options.get("run-id") ?? buildDefaultResearchRunId({ trigger, bootstrap, startedAt });
  const runPath = path.join(runDir, `${runId}.json`);
  if (await fileExists(runPath)) throw new Error(`Run ${runId} already exists at ${relative(runPath)}.`);

  const coverage = await buildCoverage();
  const liveCoverage = await loadResearchCoverage();
  if (organizationTargetMode && !liveCoverage.reviewQueueReadAvailable) {
    throw new Error("Organization-targeted research requires SUPABASE_SERVICE_ROLE_KEY so active Admin Review targets can be checked fail-closed before preparation.");
  }
  if (organizationTargetMode) {
    const activeLocalRuns: string[] = [];
    for (const filePath of await listJsonFiles(runDir)) {
      const parsed = researchRunSchema.safeParse(await readJson<unknown>(filePath));
      if (parsed.success && ["dossier_enrichment", "corpus_refresh", "canonical_repair"].includes(parsed.data.mode) && parsed.data.status === "running") activeLocalRuns.push(parsed.data.runId);
    }
    if (activeLocalRuns.length > 0) throw new Error(`Organization-dossier research cannot prepare while local run(s) remain active: ${activeLocalRuns.join(", ")}.`);
  }
  const explicitOrganizationKinds = (options.get("organization-kinds") ?? options.get("organization-kind") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  for (const kind of explicitOrganizationKinds) {
    if (!organizationKindValues.includes(kind as (typeof organizationKindValues)[number])) throw new Error(`Unknown organization kind '${kind}'.`);
  }
  const requestedDossierSlugs = (options.get("target-slugs") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if ((dossierEnrichment || canonicalRepair) && requestedDossierSlugs.length === 0) {
    throw new Error(`${requestedMode} requires --target-slugs with exact published organization slugs.`);
  }
  if (corpusRefresh && requestedDossierSlugs.length > 0) {
    throw new Error("corpus-refresh selects the next eligible production records automatically; use dossier-enrichment for an explicit --target-slugs set.");
  }
  if (new Set(requestedDossierSlugs).size !== requestedDossierSlugs.length) {
    throw new Error("--target-slugs contains a duplicate organization slug.");
  }
  const dossierTargets = requestedDossierSlugs.map((slug) => liveCoverage.organizations.find((organization) => organization.slug === slug));
  const missingDossierSlugs = requestedDossierSlugs.filter((_, index) => !dossierTargets[index]);
  if (missingDossierSlugs.length > 0) throw new Error(`Unknown published organization slug(s): ${missingDossierSlugs.join(", ")}.`);
  const includeActivated = options.get("include-activated") === "true";
  if (corpusRefresh && includeActivated) throw new Error("corpus-refresh covers only published records that have not activated the editorial template.");
  const activeTargetIds = new Set(liveCoverage.activeReviewTargetIds);
  const requestedCorpusSize = Number(options.get("target-candidates") ?? workflowMode.candidateTarget);
  if (corpusRefresh && (!Number.isInteger(requestedCorpusSize)
      || requestedCorpusSize < workflowMode.namedTargetMinimum
      || requestedCorpusSize > workflowMode.namedTargetMaximum)) {
    throw new Error(`corpus-refresh requires --target-candidates between ${workflowMode.namedTargetMinimum} and ${workflowMode.namedTargetMaximum} when a segment size is specified.`);
  }
  const corpusEligibleTargets = liveCoverage.organizations.filter((target) =>
    target.editorialProfileVersion === null
    && !activeTargetIds.has(target.id)
    && (explicitOrganizationKinds.length === 0 || explicitOrganizationKinds.includes(target.entityKind))
  );
  const resolvedDossierTargets = corpusRefresh
    ? selectBalancedCorpusTargets(corpusEligibleTargets, requestedCorpusSize)
    : dossierTargets.filter((target): target is ResearchCoverageOrganization => Boolean(target));
  if (corpusRefresh && resolvedDossierTargets.length === 0) {
    throw new Error("corpus-refresh found no eligible published null-version organizations outside the active Review queue.");
  }
  const activatedTargets = resolvedDossierTargets.filter((target) => target.editorialProfileVersion === "organization_editorial_profile_v1");
  if (!canonicalRepair && activatedTargets.length > 0 && !includeActivated) {
    throw new Error(`Dossier target(s) already use the editorial template: ${activatedTargets.map((target) => target.slug).join(", ")}. Pass --include-activated true only for an explicitly approved refresh.`);
  }
  const overlappingTargets = resolvedDossierTargets.filter((target) => activeTargetIds.has(target.id));
  if (overlappingTargets.length > 0) throw new Error(`Dossier target(s) already have active Review candidates: ${overlappingTargets.map((target) => target.slug).join(", ")}.`);
  const canonicalRepairSnapshotPath = canonicalRepair
    ? path.join(canonicalRepairSnapshotDir, `${runId}.json`)
    : null;
  const canonicalRepairSnapshot = canonicalRepair
    ? await readCanonicalRepairSnapshot(runId, resolvedDossierTargets.map((target) => target.slug))
    : null;
  let selectedGap = selectGap(coverage, bootstrap);
  if (organizationTargetMode) {
    selectedGap = {
      coverageView: resolvedDossierTargets.every((target) => target.entityKind === "company") ? "supply" : "ecosystem_support",
      dimension: corpusRefresh ? "organization-editorial-profile:null" : canonicalRepair ? `canonical-repair-targets:${resolvedDossierTargets.length}` : `dossier-targets:${resolvedDossierTargets.length}`,
      reason: corpusRefresh
        ? `This production corpus segment selects ${resolvedDossierTargets.length} of ${corpusEligibleTargets.length} currently eligible published organizations for comprehensive, review-first editorial-profile refresh without automatic activation or publication.`
        : canonicalRepair
          ? `The owner selected ${resolvedDossierTargets.length} exact published organizations for evidence-backed canonical identity or lifecycle repair through individual Admin Review and separate Publish checkpoints.`
        : `The owner selected ${resolvedDossierTargets.length} exact published organizations for comprehensive, review-first organization-dossier enrichment without automatic activation or publication; the complete target identities are recorded in the collection plan.`,
      score: 1000
    };
  } else if (explicitOrganizationKinds.length > 0) {
    const kindLabel = explicitOrganizationKinds.join(", ").replaceAll("_", " ");
    selectedGap = {
      coverageView: explicitOrganizationKinds.every((kind) => kind === "company") ? "supply" : "ecosystem_support",
      dimension: `organization-kind:${explicitOrganizationKinds.join("+")}`,
      reason: `The operator explicitly scoped this run to increase reviewable Canadian ${kindLabel} coverage while preserving evidence and duplicate controls.`,
      score: 1000
    };
  }
  const organizationKinds = organizationTargetMode
    ? [...new Set(resolvedDossierTargets.map((target) => target.entityKind))]
    : explicitOrganizationKinds.length > 0
    ? explicitOrganizationKinds as (typeof organizationKindValues)[number][]
    : bootstrap
    ? ["company", "accelerator", "incubator", "investor_funder"] as const
    : selectedGap.dimension.startsWith("organization-kind:")
      ? selectedGap.dimension.split(":")[1].split("+") as (typeof organizationKindValues)[number][]
      : [];
  const demandIssuerTypes = selectedGap.dimension.startsWith("demand-issuer-type:")
    ? [selectedGap.dimension.split(":")[1] as (typeof demandIssuerTypeValues)[number]]
    : [];
  const requestedTarget = corpusRefresh
    ? resolvedDossierTargets.length
    : Number(options.get("target-candidates") ?? (organizationTargetMode ? resolvedDossierTargets.length : workflowMode.candidateTarget));
  const targetMinimum = workflowMode.namedTargetMinimum > 0
    ? workflowMode.namedTargetMinimum
    : Math.max(1, workflowMode.candidateMinimum);
  const targetMaximum = workflowMode.namedTargetMaximum > 0
    ? workflowMode.namedTargetMaximum
    : workflowMode.candidateMaximum;
  if (!Number.isInteger(requestedTarget) || requestedTarget < targetMinimum || requestedTarget > targetMaximum) {
    throw new Error(`${requestedMode} requires --target-candidates between ${targetMinimum} and ${targetMaximum}.`);
  }
  if ((dossierEnrichment || canonicalRepair) && requestedTarget !== requestedDossierSlugs.length) {
    throw new Error(`${requestedMode} --target-candidates (${requestedTarget}) must equal the ${requestedDossierSlugs.length} named --target-slugs.`);
  }
  const targetCandidates = requestedTarget;
  const minimumCandidates = workflowMode.candidateMinimum > 0 ? workflowMode.candidateMinimum : undefined;
  const minimumProspects = organizationTargetMode
    ? targetCandidates
    : workflowMode.prospectMinimum > 0 ? workflowMode.prospectMinimum : undefined;
  const minimumSourceLanes = workflowMode.sourceLaneMinimum;
  const collectionPlanPath = path.join(collectionPlanDir, `${runId}.json`);
  const claimLedgerPath = path.join(claimLedgerDir, `${runId}.json`);
  const collectionPlan: ResearchCollectionPlanV1 = researchCollectionPlanV1Schema.parse({
    schemaVersion: "research_collection_plan_v1",
    planId: `${runId}-collection-plan`,
    runId,
    createdAt: startedAt,
    status: "active",
    intelligenceRequirement: canonicalRepair
      ? `Resolve the exact published identity, Canadian nexus, lifecycle status, aliases, successor evidence, canonical child validity, protected dependencies, and collision risks needed to repair ${selectedGap.dimension} without hard deletion, claim transfer, or bypassing human Review and Publish.`
      : `Resolve the specific capabilities or public needs, Canadian relevance, technical and operational detail, proof and current activity, Mission Area or Public Need connection, material unknowns, and next reviewer action needed to address ${selectedGap.dimension}: ${selectedGap.reason}`,
    targetSubjects: organizationTargetMode ? resolvedDossierTargets.map((target) => ({
      subjectId: `organization-${target.slug}`,
      subjectType: "organization" as const,
      name: target.name,
      aliases: [...new Set([target.legalName, ...target.aliases]
        .filter((value): value is string => Boolean(value) && value !== target.name))],
      canonicalIdentifiers: [
        target.slug,
        target.id,
        `https://truenorthmap.ca/organizations/${target.slug}`,
        ...(target.websiteDomain ? [target.websiteDomain] : [])
      ]
    })) : [],
    priorityQuestions: canonicalRepair ? [
      {
        questionId: "canonical-identity",
        subjectType: "organization" as const,
        question: "What exact current or successor identity is established by durable corporate, registry, ownership, or official organization sources?",
        targetFieldPaths: ["organization.name", "organization.legalName", "organization.websiteUrl", "organization.aliases"],
        evidenceThreshold: "one_anchor" as const
      },
      {
        questionId: "canadian-nexus-and-role",
        subjectType: "organization" as const,
        question: "What durable evidence establishes the organization's current Canadian operating nexus and whether its canonical entity kind and categories are accurate?",
        targetFieldPaths: ["organization.entityKind", "organization.organizationCategories", "organization.profileData"],
        evidenceThreshold: "one_anchor" as const
      },
      {
        questionId: "lifecycle-and-successor",
        subjectType: "organization" as const,
        question: "Is the organization active, renamed, acquired, amalgamated, defunct, outside scope, or superseded, and is any successor exact and currently published?",
        targetFieldPaths: ["organization.publicationStatus", "organization.successor", "organization.aliases"],
        evidenceThreshold: "anchor_plus_independent_corroboration" as const
      },
      {
        questionId: "canonical-child-validity",
        subjectType: "technology" as const,
        question: "Do the organization's active capabilities and aliases belong to this canonical identity, or does durable evidence require a bounded soft archive?",
        targetFieldPaths: ["activeAliases", "activeCapabilities", "operations"],
        evidenceThreshold: "one_anchor" as const
      },
      {
        questionId: "dependencies-and-collisions",
        subjectType: "relationship" as const,
        question: "Which saved items, submissions, editorial links, relationships, names, legal names, aliases, slugs, or redirects block or constrain the proposed repair?",
        targetFieldPaths: ["dependencies", "duplicateCheck", "reviewWarnings"],
        evidenceThreshold: "one_anchor" as const
      }
    ] : [
      {
        questionId: "identity-canadian-presence",
        subjectType: "organization",
        question: "What is the canonical organization identity, ownership context, aliases, and evidence of an active Canadian operating presence?",
        targetFieldPaths: ["organization.name", "organization.aliases", "organization.primaryLocation", "organization.publicContact", "organization.canadianFootprint"],
        evidenceThreshold: "one_anchor"
      },
      ...(organizationKinds.some((kind) => kind === "company" || kind === "research_test_centre") ? [{
        questionId: "capability-definition",
        subjectType: "technology" as const,
        question: "Which independently reviewable products, facilities, test services, variants, subsystems, or operating functions exist, and what specifications, interfaces, maturity, dependencies, access constraints, applications, and differentiators are publicly supportable?",
        targetFieldPaths: ["capabilities.*.summary", "capabilities.*.features", "capabilities.*.applications", "capabilities.*.maturity", "capabilities.*.commercialAvailability", "organization.operatingContext"],
        evidenceThreshold: "anchor_plus_independent_corroboration" as const
      }] : []),
      ...(organizationKinds.some((kind) => ["accelerator", "incubator", "government_innovation_office", "ecosystem_organization"].includes(kind)) ? [{
        questionId: "program-access-definition",
        subjectType: "program" as const,
        question: "Which current programs, member or cohort pathways, committees, services, eligibility rules, geographic boundaries, application routes, delivery partners, and outcome claims define how a business can use or join this organization?",
        targetFieldPaths: ["organization.description", "organization.operatingContext", "organization.canadianFootprint", "organization.publicContact", "programParticipations.*.participation.publicSummary", "programParticipations.*.participation.lifecycleStage", "relationships.*.publicSummary"],
        evidenceThreshold: "one_anchor" as const
      }] : []),
      ...(organizationKinds.includes("investor_funder") ? [{
        questionId: "investment-access-definition",
        subjectType: "organization" as const,
        question: "What current thesis, stage, geography, ticket or instrument, fund status, portfolio proof, application route, and operating support define whether and how a company can engage this investor?",
        targetFieldPaths: ["organization.description", "organization.operatingContext", "organization.canadianFootprint", "organization.publicContact", "fundingEvents.*.disclosedSummary", "relationships.*.publicSummary"],
        evidenceThreshold: "one_anchor" as const
      }] : []),
      {
        questionId: "proof-and-current-state",
        subjectType: "signal",
        question: "Which trials, evaluations, deployments, contracts, procurement lifecycle events, public programs, customer activity, partnerships, and dated developments materially change the current record, and which consequential performance or outcome claims need an independent source before they are stated as proof?",
        targetFieldPaths: ["organization.currentActivity", "organization.currentActivityAsOf", "programParticipations.*.participation.publicSummary", "programParticipations.*.participation.lifecycleStage", "fundingEvents.*.disclosedSummary", "relationships.*.publicSummary", "demandSource.summary", "requirements.*.problemStatement"],
        evidenceThreshold: "one_anchor"
      },
      {
        questionId: "mission-public-need-read",
        subjectType: "demand",
        question: "Which current Mission Area or exact published Public Need could this capability inform, what source-backed premises support each side, and what constraint prevents the relationship from being treated as proven fit?",
        targetFieldPaths: ["capabilities.*.missionMatches", "requirements.*.problemStatement", "requirements.*.desiredEndState", "reviewerRationale"],
        evidenceThreshold: "anchor_plus_independent_corroboration"
      },
      {
        questionId: "editorial-profile-readiness",
        subjectType: "organization",
        question: "Does the evidence support an executive description, current activity, operating context, Canadian footprint, and at most four specific first-conversation questions without converting missing fields into public unknowns?",
        targetFieldPaths: ["organization.description", "organization.currentActivity", "organization.operatingContext", "organization.canadianFootprint", "organization.reviewedQuestions"],
        evidenceThreshold: "one_anchor"
      },
      {
        questionId: "unknowns-and-tradeoffs",
        subjectType: "signal",
        question: "Which material facts are not found, not publicly stated, conflicted, stale, superseded, constrained, or not applicable, and how does each gap affect the reviewer decision?",
        targetFieldPaths: ["reviewWarnings", "reviewerRationale"],
        evidenceThreshold: "one_anchor"
      },
      {
        questionId: "reviewer-action",
        subjectType: "signal",
        question: "What single bounded verification, comparison, review, Working List, or private demand-matching action should follow from the evidence without contacting, accepting, or publishing autonomously?",
        targetFieldPaths: ["reviewerRationale", "reviewWarnings"],
        evidenceThreshold: "one_anchor"
      }
    ],
    collectionLanes: osintCollectionLaneValues.map((lane) => ({
      lane,
      purpose: lane === "authenticated_discovery_feed"
        ? "Find named leads and recent activity in authenticated newsletters or targeted social pages, then resolve every material assertion to durable evidence."
        : `Collect durable ${lane.replaceAll("_", " ")} evidence or an independently attributable corroborating source for material claims.`,
      sourcePosture: lane === "authenticated_discovery_feed"
        ? "discovery_only"
        : ["industry_publication", "ecosystem_directory"].includes(lane)
          ? "strong_corroboration"
          : "evidence_anchor",
      queryPatterns: canonicalRepair
        ? resolvedDossierTargets.flatMap((target) => [
          `"${target.name}" legal name rename acquisition closure Canada`,
          `"${target.name}" ${target.websiteDomain ?? target.slug} identity successor ${lane.replaceAll("_", " ")}`
        ])
        : organizationTargetMode
        ? resolvedDossierTargets.flatMap((target) => [
          `"${target.name}" Canada ${lane.replaceAll("_", " ")}`,
          `"${target.name}" ${dossierResearchTerms(target.entityKind)} ${lane.replaceAll("_", " ")}`
        ])
        : [
          `${selectedGap.dimension} Canada ${lane.replaceAll("_", " ")}`,
          `${selectedGap.dimension} Canada français ${lane.replaceAll("_", " ")}`,
          `${selectedGap.dimension} outcome constraint specification interface trial procurement Canada ${lane.replaceAll("_", " ")}`
        ],
      expectedClaims: canonicalRepair
        ? ["exact identity or lifecycle status", "Canadian nexus, alias, successor, or child-record ownership", "dependency, collision, or explicit unresolved boundary"]
        : ["identity or actor role", "specific capability, variant, interface, constraint, proof event, demand, program, contract, relationship, or current-activity detail", "decision-relevant unknown or verification path"]
    })),
    languagePlan: { languages: ["en", "fr"], frenchSearchRequired: true, exceptionReason: null },
    coverageDimensions: [...osintCoverageDimensionValues],
    stopConditions: [
      "Stop a subject only after the coverage vector records every dimension as covered, partial, not found, or not applicable with supporting claims or search attempts.",
      canonicalRepair
        ? "Treat a canonical target as saturated only when at least two complementary lanes establish or fail to establish the exact identity, Canadian nexus, lifecycle, successor, child ownership, dependencies, and collision state needed for a bounded decision."
        : "Treat the dossier as saturated only when two additional complementary lanes produce low or zero new claims that would change the capability definition, proof or current state, Mission or Public Need read, material unknowns, or reviewer action.",
      "Do not stop on source count alone; every selected candidate needs a specific decision use, evidence basis, visible uncertainty, and bounded next reviewer action."
    ],
    prohibitedActions: ["social_interaction", "access_control_bypass", "personal_data_collection", "canonical_database_write", "candidate_approval_or_publication"]
  });
  const preparedClaimSubjects = organizationTargetMode ? resolvedDossierTargets.map((target) => ({
    subjectId: `organization-${target.slug}`,
    subjectType: "organization" as const,
    name: target.name,
    candidateIds: [],
    coverage: osintCoverageDimensionValues.map((dimension) => ({
      dimension,
      status: "not_assessed" as const,
      claimIds: [],
      attempts: [],
      note: `${target.name}'s ${dimension.replaceAll("_", " ")} evidence has not yet been assessed; replace this preparation scaffold during collection.`
    })),
    saturation: {
      additionalSearchYield: "high" as const,
      newClaimsFromLastTwoLanes: 0,
      stopReason: `${target.name}'s research collection has not started; do not treat this preparation scaffold as saturation evidence.`
    }
  })) : [];
  const claimLedger: ResearchClaimLedgerV1 = researchClaimLedgerV1Schema.parse({
    schemaVersion: "research_claim_ledger_v1",
    ledgerId: `${runId}-claim-ledger`,
    runId,
    createdAt: startedAt,
    completedAt: null,
    status: "collecting",
    claims: [],
    subjects: preparedClaimSubjects,
    warnings: []
  });
  const run: ResearchRun = {
    schemaVersion: "research_run_v1",
    runId,
    agentVersion: currentResearchPipelineVersion,
    trigger,
    mode: researchWorkflowRunMode(workflowMode.name),
    scope: {
      geography: "canada_first",
      organizationKinds: [...organizationKinds],
      missionAreaSlugs: coverage.missionAreas.map((mission) => mission.slug),
      technicalDomainSlugs: coverage.technicalDomains.map((domain) => domain.slug),
      demandIssuerTypes
    },
    selectedGap,
    status: "running",
    osintArtifactsRequired: true,
    startedAt,
    completedAt: null,
    limits: {
      totalMinutes: corpusRefresh ? 480 : canonicalRepair ? 120 : organizationTargetMode ? 240 : refreshBatch ? 180 : 90,
      sourceBookMinutes: refreshBatch ? 10 : canonicalRepair ? 15 : 30,
      maxQualifiedLeads: organizationTargetMode || refreshBatch ? 50 : 25,
      maxCandidates: organizationTargetMode ? targetCandidates : workflowMode.candidateMaximum,
      maxSourceItems: undefined,
      minimumProspects,
      minimumSourceLanes,
      minimumCandidates,
      targetCandidates
    },
    sourceQueries: organizationTargetMode ? resolvedDossierTargets.flatMap((target) => canonicalRepair ? [
      `"${target.name}" official legal name Canada`,
      `"${target.name}" rename OR acquisition OR amalgamation OR closure OR bankruptcy`,
      `"${target.name}" ${target.websiteDomain ?? target.slug} alias successor`
    ] : [
      `"${target.name}" official Canada`,
      `"${target.name}" contract OR award OR trial OR deployment`,
      `"${target.name}" ${dossierResearchTerms(target.entityKind)}`
    ]) : [],
    counters: {
      sourcesChecked: 0,
      leadsQualified: 0,
      leadsDeferred: 0,
      candidatesCreated: 0,
      duplicatesBlocked: 0,
      prospectsDiscovered: 0,
      uniqueProspects: 0,
      prospectsQueued: 0,
      recoveryAttempts: 0,
      sourceLanesSearched: 0,
      candidatesGreen: 0,
      candidatesAmber: 0,
      signalsExtracted: refreshBatch || organizationDossierMode ? 0 : undefined,
      signalsDispositioned: refreshBatch || organizationDossierMode ? 0 : undefined,
      sourceFamiliesSearched: refreshBatch || organizationDossierMode ? 0 : undefined,
      claimsCollected: 0,
      claimsConflicted: 0,
      coverageSubjects: 0
    },
    underTargetReason: null,
    exhaustionEvidence: null,
    validation: { passed: false, errors: [], warnings: [] },
    errors: [],
    stopReason: null,
    outputs: {
      collectionPlan: relative(collectionPlanPath),
      claimLedger: relative(claimLedgerPath),
      canonicalRepairSnapshot: canonicalRepairSnapshotPath ? relative(canonicalRepairSnapshotPath) : null,
      prospectInventory: null,
      signalBatch: null,
      sourceLeadBatch: null,
      candidateBatch: null,
      reviewPacket: null,
      stagingExport: null
    }
  };

  const smokeArguments = [
    `--run research/ingestion/runs/${runId}.json`,
    `--collection-plan research/ingestion/collection-plans-v1/${runId}.json`,
    `--claims research/ingestion/claim-ledgers-v1/${runId}.json`,
    ...(canonicalRepair ? [`--canonical-snapshot research/ingestion/local/canonical-repair-snapshots-v1/${runId}.json`] : []),
    ...(!refreshBatch && !deepDossier ? [`--prospects research/ingestion/prospect-inventories-v1/${runId}.json`] : []),
    ...(refreshBatch || organizationDossierMode ? [`--signals research/ingestion/signal-batches-v1/${runId}.json`] : []),
    `--leads research/ingestion/source-leads-v2/${runId}.json`,
    `--candidates research/ingestion/candidate-batches-v2/${runId}.json`,
    "--check-only"
  ].join(" ");

  const brief = [
    `# Research Run Brief - ${runId}`,
    "",
    `- Trigger: ${run.trigger}`,
    `- Mode: ${run.mode}`,
    `- Selected coverage view: ${selectedGap.coverageView}`,
    `- Selected gap: ${selectedGap.dimension}`,
    `- Reason: ${selectedGap.reason}`,
    `- Review-packet capacity: ${run.limits.maxCandidates} candidates; this is an operational envelope, not a discovery-yield or evidence threshold.`,
    `- Minimum prospects: ${run.limits.minimumProspects ?? "not fixed for this mode"}`,
    `- Minimum source lanes: ${run.limits.minimumSourceLanes}`,
    canonicalRepair
      ? "- Completion: one canonical-repair candidate, typed research_required disposition, or typed no_material_change disposition per named target; no repair is required merely to satisfy a count."
      : organizationTargetMode
        ? "- Completion: one consolidated refresh candidate or one typed disposition per named target; no candidate is required merely to satisfy a count."
      : workflowMode.typedDispositionMayReplaceCandidate
        ? "- Completion: supportable candidates or explicit structured dispositions; a zero-candidate result requires at least one typed disposition."
        : `- Minimum completed candidates: ${run.limits.minimumCandidates}`,
    `- Target candidates: ${run.limits.targetCandidates}`,
    `- Collection plan: ${run.outputs.collectionPlan}`,
    `- Claim ledger: ${run.outputs.claimLedger}`,
    ...(canonicalRepair ? [`- Exact canonical snapshot: ${run.outputs.canonicalRepairSnapshot}`] : []),
    "",
    "## Required sequence",
    "",
    "1. Complete the generated intelligence-requirement collection plan before broad searching; verify the prepared named subjects, aliases, identifiers, and target-specific query patterns.",
    canonicalRepair
      ? "2. Capture the exact live organization, alias, capability and dependency baselines before searching. Emit only canonical-repair v1 operations supported by durable evidence."
      : refreshBatch || organizationDossierMode ? "2. Apply $tnm-signal-refresh and build live published-record watchlists before searching. Emit only safe organization refresh v2 operations for organization-dossier work." : "2. Expand and rank the Source Book within the 30-minute sub-limit.",
    organizationTargetMode
      ? `3. Search at least ${minimumSourceLanes} complementary lanes per target and continue while a decision-useful question has a plausible unresolved evidence route. There is no dossier article or source-count target: unused, repeated, discovery-only, or syndicated material is padding, not depth.`
      : refreshBatch
        ? `3. Search at least ${minimumSourceLanes} complementary source lanes per target, continue while plausible material-change routes remain, extract atomic signals, and disposition every signal.`
        : `3. Enumerate at least ${minimumProspects} unique prospects across at least ${minimumSourceLanes} productive source lanes in a prospect inventory.`,
    "4. Search entity-outward and problem-inward. Record atomic claims, canonical URLs, source-independence keys, temporal scope, conflicts, supersession, and candidate targets in the claim ledger while researching. Treat a development as a signal only when durable evidence shows a dated change that could alter a reviewer decision; background context, undated profile enrichment, and record maintenance remain evidence but are not signals.",
    "5. Select prospects by coverage value, evidence recoverability, capability specificity, current trigger, Mission/Public Need relevance, actionability, and novelty. Create typed source leads from durable public sources using English and French aliases and queries where relevant.",
    canonicalRepair
      ? "6. Use at least two independent identity/lifecycle lanes before assigning research_required; use no_material_change when the suspected defect is disproven."
      : "6. Use evidence recovery across at least three distinct lanes before deferring a plausible prospect for thin evidence.",
    canonicalRepair
      ? "7. Complete the operation-level claim lineage and exact snapshot checks for every target. Qualified leads continue automatically; do not pause for source-lead approval."
      : "7. Complete every subject's coverage vector and decision-useful saturation assessment. Qualified leads continue automatically; do not pause for source-lead approval.",
    canonicalRepair
      ? "8. Build one organization_canonical_repair_bundle_v1 candidate, explicit research_required disposition, or explicit no_material_change disposition for every named target. Never infer a merge, successor, closure, Canadian nexus or entity kind from absence alone."
      : organizationDossierMode
      ? "8. Build one consolidated organization_refresh_bundle_v2 candidate or an explicit disposition for every named target. Record ready_for_editorial_v1, research_required, or no_material_change and never replace whole profile JSON."
      : "8. Build enriched typed candidates in green or amber review tiers. Every rationale uses Coverage value, Evidence, Mission/Public Need read, Unknowns, and Reviewer action; amber candidates keep non-blocking gaps and claim conflicts as explicit reviewer warnings.",
    workflowMode.typedDispositionMayReplaceCandidate
      ? "9. Do not manufacture a candidate to meet a count. A target with no supportable change ends in the appropriate typed disposition with its evidence and unresolved questions preserved."
      : "9. If the batch remains below its minimum, record a specific underTargetReason and exhaustionEvidence before completion.",
    `10. Preview the deterministic guarded sequence with \`pnpm research:finalize -- --run research/ingestion/runs/${runId}.json --plan\`. The plan derives this non-writing smoke gate internally: \`pnpm research:smoke -- ${smokeArguments}\`.`,
    `11. When the complete batch is final and private intake is authorized, run \`pnpm research:finalize -- --run research/ingestion/runs/${runId}.json --apply\`. It validates, prepares any missing private organization-logo dispositions, validates again, smoke-checks without writing, generates review/staging artifacts only when candidates exist, imports only through the tracked path, and reconciles the exact run in production. Use \`--file-only\` instead when Admin Review intake is unavailable but local review/staging artifacts are explicitly needed.`,
    `12. Stop after exact Admin Review reconciliation. An all-disposition zero-candidate batch stops after validation and smoke without an empty intake. Do not approve or publish.`,
    "",
    "## Live coverage snapshot",
    "",
    `- Published organizations: ${coverage.publishedOrganizations}`,
    `- Published capabilities: ${coverage.publishedCapabilities}`,
    `- Published demand requirements: ${coverage.publishedDemandRequirements}`,
    `- Source Book rows: ${coverage.sourceBookRows}`,
    "- Run `pnpm research:coverage` for the current full coverage table and ranked reusable sources.",
    ""
  ].join("\n");

  await mkdir(runDir, { recursive: true });
  await mkdir(briefDir, { recursive: true });
  await mkdir(collectionPlanDir, { recursive: true });
  await mkdir(claimLedgerDir, { recursive: true });
  if (canonicalRepairSnapshotPath && canonicalRepairSnapshot) {
    await mkdir(canonicalRepairSnapshotDir, { recursive: true });
    await writeFile(canonicalRepairSnapshotPath, `${JSON.stringify(canonicalRepairSnapshot, null, 2)}\n`, "utf8");
  }
  await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`, "utf8");
  await writeFile(collectionPlanPath, `${JSON.stringify(collectionPlan, null, 2)}\n`, "utf8");
  await writeFile(claimLedgerPath, `${JSON.stringify(claimLedger, null, 2)}\n`, "utf8");
  await writeFile(path.join(briefDir, `${runId}.md`), `${brief}\n`, "utf8");
  console.log(`Created ${relative(runPath)}`);
  console.log(`Created ${relative(path.join(briefDir, `${runId}.md`))}`);
  console.log(`Created ${relative(collectionPlanPath)}`);
  console.log(`Created ${relative(claimLedgerPath)}`);
  if (canonicalRepairSnapshotPath) console.log(`Created ${relative(canonicalRepairSnapshotPath)}`);
  console.log(`Selected gap: ${selectedGap.dimension}`);
}

async function validateSignalFile(filePath: string): Promise<ValidationReport> {
  const parsed = researchSignalBatchV1Schema.safeParse(await readJson<unknown>(filePath));
  if (!parsed.success) return { kind: "signal_batch", filePath, id: path.basename(filePath), errors: formatZodIssues(parsed.error), warnings: [], counts: {} };
  const batch: ResearchSignalBatchV1 = parsed.data;
  const fingerprints = batch.signals.map((signal) => signal.fingerprint);
  const errors: string[] = [];
  addDuplicateValueErrors(fingerprints, "Signal fingerprint", errors);
  const selected = batch.signals.filter((signal) => signal.disposition === "qualified");
  const discoveryFeedSelected = selected.filter((signal) => ["gmail_newsletter", "linkedin_chrome", "other_discovery"].includes(signal.sourceChannel)).length;
  if (selected.length > 1 && discoveryFeedSelected > selected.length / 2) errors.push("Discovery feeds provide more than half of selected signals.");
  return {
    kind: "signal_batch",
    filePath,
    id: batch.signalBatchId,
    errors,
    warnings: batch.warnings,
    counts: {
      signals: batch.signals.length,
      qualified: selected.length,
      deferred: batch.signals.filter((signal) => ["deferred", "unresolved"].includes(signal.disposition)).length,
      sourceFamilies: Object.values(batch.sourceFamilyCounters).filter((count) => count > 0).length
    }
  };
}

async function validateCollectionPlanFile(filePath: string): Promise<ValidationReport> {
  const parsed = researchCollectionPlanV1Schema.safeParse(await readJson<unknown>(filePath));
  if (!parsed.success) {
    return { kind: "collection_plan", filePath, id: path.basename(filePath), errors: formatZodIssues(parsed.error), warnings: [], counts: {} };
  }
  const plan = parsed.data;
  return {
    kind: "collection_plan",
    filePath,
    id: plan.planId,
    errors: [],
    warnings: plan.targetSubjects.length === 0 ? ["Collection plan has no named target subjects yet."] : [],
    counts: {
      subjects: plan.targetSubjects.length,
      questions: plan.priorityQuestions.length,
      lanes: plan.collectionLanes.length,
      dimensions: plan.coverageDimensions.length
    }
  };
}

async function validateClaimLedgerFile(filePath: string): Promise<ValidationReport> {
  const parsed = researchClaimLedgerV1Schema.safeParse(await readJson<unknown>(filePath));
  if (!parsed.success) {
    return { kind: "claim_ledger", filePath, id: path.basename(filePath), errors: formatZodIssues(parsed.error), warnings: [], counts: {} };
  }
  const ledger = parsed.data;
  return {
    kind: "claim_ledger",
    filePath,
    id: ledger.ledgerId,
    errors: [],
    warnings: [...ledger.warnings, ...researchClaimLedgerQualityIssues(ledger)],
    counts: {
      claims: ledger.claims.length,
      subjects: ledger.subjects.length,
      conflicts: ledger.claims.filter((claim) => claim.status === "conflicted").length,
      discoveryOnly: ledger.claims.filter((claim) => claim.status === "discovery_only").length,
      unresolved: ledger.claims.filter((claim) => claim.status === "unresolved").length
    }
  };
}

async function validateCanonicalRepairSnapshotFile(filePath: string): Promise<ValidationReport> {
  const parsed = canonicalOrganizationRepairSnapshotV1Schema.safeParse(await readJson<unknown>(filePath));
  if (!parsed.success) {
    return { kind: "canonical_repair_snapshot", filePath, id: path.basename(filePath), errors: formatZodIssues(parsed.error), warnings: [], counts: {} };
  }
  return {
    kind: "canonical_repair_snapshot",
    filePath,
    id: parsed.data.runId,
    errors: [],
    warnings: [],
    counts: {
      targets: parsed.data.targets.length,
      aliases: parsed.data.targets.reduce((count, target) => count + target.activeAliases.length, 0),
      capabilities: parsed.data.targets.reduce((count, target) => count + target.activeCapabilities.length, 0),
      blockers: parsed.data.targets.reduce((count, target) => count
        + Object.values(target.publicationBlockers).reduce((targetCount, identifiers) => targetCount + identifiers.length, 0), 0)
    }
  };
}

function addTaxonomyErrors(values: string[], allowed: Set<string>, label: string, errors: string[]) {
  for (const value of values) {
    if (!allowed.has(value)) errors.push(`${label} references unknown taxonomy slug '${value}'.`);
  }
}

function addDuplicateValueErrors(values: string[], label: string, errors: string[]) {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) errors.push(`${label} '${value}' is duplicated inside the artifact.`);
    seen.add(value);
  }
}

function artifactPredatesPublication(artifactCreatedAt: string, organization: ResearchCoverageOrganization | undefined) {
  if (!organization?.publishedAt) return false;
  return new Date(artifactCreatedAt).getTime() <= new Date(organization.publishedAt).getTime();
}

async function validateRunFile(filePath: string): Promise<ValidationReport> {
  const parsed = researchRunSchema.safeParse(await readJson<unknown>(filePath));
  const errors = parsed.success ? [] : formatZodIssues(parsed.error);
  const warnings: string[] = [];
  if (parsed.success) {
    const run = parsed.data;
    errors.push(...researchRunCompletionIssues(run));
  }
  return {
    kind: "run",
    filePath,
    id: parsed.success ? parsed.data.runId : path.basename(filePath),
    errors,
    warnings,
    counts: parsed.success ? { queries: parsed.data.sourceQueries.length, candidates: parsed.data.counters.candidatesCreated } : {}
  };
}

async function validateProspectFile(filePath: string): Promise<ValidationReport> {
  const parsed = researchProspectInventoryV1Schema.safeParse(await readJson<unknown>(filePath));
  if (!parsed.success) {
    return { kind: "prospect_inventory", filePath, id: path.basename(filePath), errors: formatZodIssues(parsed.error), warnings: [], counts: {} };
  }
  const inventory = parsed.data;
  const errors: string[] = [];
  const warnings: string[] = [];
  addDuplicateValueErrors(inventory.prospects.map((prospect) => normalizeName(prospect.name)), "Prospect normalized name", errors);
  const canonicalUrls = inventory.prospects.map((prospect) => prospect.canonicalUrl).filter((value): value is string => Boolean(value));
  addDuplicateValueErrors(canonicalUrls, "Prospect canonical URL", errors);
  const selected = inventory.prospects.filter((prospect) => prospect.disposition === "selected").length;
  if (selected === 0) warnings.push(`Prospect inventory ${inventory.inventoryId} has no selected prospects.`);
  return {
    kind: "prospect_inventory",
    filePath,
    id: inventory.inventoryId,
    errors,
    warnings,
    counts: {
      prospects: inventory.prospects.length,
      selected,
      queued: inventory.prospects.filter((prospect) => prospect.disposition === "queued").length,
      duplicates: inventory.prospects.filter((prospect) => prospect.disposition === "duplicate").length,
      rejected: inventory.prospects.filter((prospect) => prospect.disposition === "rejected").length,
      sourceLanes: new Set(inventory.prospects.map((prospect) => prospect.discoveryLane)).size
    }
  };
}

async function validateSourceLeadFile(filePath: string): Promise<ValidationReport> {
  const parsed = sourceLeadBatchV2Schema.safeParse(await readJson<unknown>(filePath));
  if (!parsed.success) {
    return { kind: "source_leads", filePath, id: path.basename(filePath), errors: formatZodIssues(parsed.error), warnings: [], counts: {} };
  }

  const batch = parsed.data;
  const errors: string[] = [];
  const warnings: string[] = [];
  const coverage = await loadResearchCoverage();
  const missionSlugs = new Set(coverage.missionAreas.map((mission) => mission.slug));
  const domainSlugs = new Set(coverage.technicalDomains.map((domain) => domain.slug));
  const existing = await collectExistingIdentities({ excludeRunId: batch.runId });
  const publishedLeadIds = new Set<string>();
  for (const candidatePath of await listJsonFiles(candidateDir)) {
    const candidateBatch = researchCandidateBatchV2Schema.safeParse(await readJson<unknown>(candidatePath));
    if (!candidateBatch.success || candidateBatch.data.runId !== batch.runId) continue;
    for (const candidate of candidateBatch.data.candidates) {
      const publishedOrganization = candidate.candidateKind === "organization_bundle"
        ? coverage.organizations.find((organization) => organization.slug === candidate.organization.slug)
        : undefined;
      const isPublishedArtifact = coverage.candidateStatuses[candidate.candidateId] === "published"
        || artifactPredatesPublication(candidateBatch.data.createdAt, publishedOrganization);
      if (isPublishedArtifact) {
        candidate.sourceLeadIds.forEach((leadId) => publishedLeadIds.add(leadId));
      }
    }
  }
  addDuplicateValueErrors(batch.leads.map((lead) => lead.id), "Lead id", errors);
  addDuplicateValueErrors(batch.leads.map((lead) => lead.source.url), "Source URL", errors);

  for (const lead of batch.leads) {
    addTaxonomyErrors(lead.possibleMissionAreaSlugs, missionSlugs, `Lead ${lead.id}`, errors);
    addTaxonomyErrors(lead.possibleTechnicalDomainSlugs, domainSlugs, `Lead ${lead.id}`, errors);
    if (new Date(lead.source.accessedAt).getTime() > Date.now()) errors.push(`Lead ${lead.id} has a future accessedAt.`);
    if (/turn\d+(?:search|view)\d+|【|†/.test(JSON.stringify(lead))) errors.push(`Lead ${lead.id} contains a non-portable citation token.`);
    if (lead.leadType !== "organization_lead") continue;
    const domain = urlDomain(lead.websiteUrl);
    const match = existing.find((identity) => researchIdentityMatches(identity, {
      slug: lead.duplicateFingerprint.stableSlug,
      name: lead.organizationName,
      websiteDomain: domain
    }));
    const publishedOrganization = coverage.organizations.find((organization) => organization.slug === lead.duplicateFingerprint.stableSlug);
    const isPublicationArtifact = publishedLeadIds.has(lead.id) || artifactPredatesPublication(batch.createdAt, publishedOrganization);
    if (match && lead.disposition === "qualified" && !isPublicationArtifact) {
      errors.push(`Qualified lead ${lead.id} duplicates ${match.name} in ${match.source}.`);
    } else if (match && !isPublicationArtifact) {
      warnings.push(`Lead ${lead.id} may duplicate ${match.name} in ${match.source}.`);
    }
  }

  return {
    kind: "source_leads",
    filePath,
    id: batch.leadBatchId,
    errors,
    warnings,
    counts: {
      leads: batch.leads.length,
      qualified: batch.leads.filter((lead) => lead.disposition === "qualified").length,
      deferred: batch.leads.filter((lead) => lead.disposition === "deferred").length,
      rejected: batch.leads.filter((lead) => lead.disposition === "rejected").length
    }
  };
}

function validateCandidateEvidence(batch: ResearchCandidateBatchV2, errors: string[]) {
  for (const candidate of batch.candidates) {
    const sourceIds = new Set(candidate.sources.map((source) => source.id));
    addDuplicateValueErrors(candidate.sources.map((source) => source.id), `Candidate ${candidate.candidateId} source id`, errors);
    addDuplicateValueErrors(candidate.fieldEvidence.map((evidence) => evidence.id), `Candidate ${candidate.candidateId} evidence id`, errors);
    for (const evidence of candidate.fieldEvidence) {
      if (!sourceIds.has(evidence.sourceId)) errors.push(`Candidate ${candidate.candidateId} evidence ${evidence.id} references missing source ${evidence.sourceId}.`);
    }

    const evidencePaths = new Set(candidate.fieldEvidence.map((evidence) => evidence.fieldPath));
    if (candidate.candidateKind === "organization_bundle") {
      if (!evidencePaths.has("organization.description")) errors.push(`Candidate ${candidate.candidateId} needs field evidence for organization.description.`);
      if (candidate.schemaVersion === "organization_bundle_v2") {
        for (const capability of candidate.capabilities) {
          if (!evidencePaths.has(`capabilities.${capability.slug}.summary`)) errors.push(`Candidate ${candidate.candidateId} needs field evidence for capability ${capability.slug}.`);
        }
        for (const program of candidate.programs) {
          if (!evidencePaths.has(`programs.${program.slug}.summary`)) errors.push(`Candidate ${candidate.candidateId} needs field evidence for program ${program.slug}.`);
        }
        candidate.relationships.forEach((relationship, index) => {
          if (!evidencePaths.has(`relationships.${index}.publicSummary`)) errors.push(`Candidate ${candidate.candidateId} needs field evidence for relationship ${index}.`);
        });
      }
    }
    if (candidate.candidateKind === "demand_signal_bundle") {
      if (!evidencePaths.has("demandSource.summary")) errors.push(`Candidate ${candidate.candidateId} needs field evidence for demandSource.summary.`);
      for (const requirement of candidate.requirements) {
        if (!evidencePaths.has(`requirements.${requirement.slug}.problemStatement`)) errors.push(`Candidate ${candidate.candidateId} needs evidence for requirement ${requirement.slug}.`);
      }
    }
    if (candidate.candidateKind === "program_relationship_bundle") {
      if (!evidencePaths.has("program.summary")) errors.push(`Candidate ${candidate.candidateId} needs field evidence for program.summary.`);
      candidate.participations.forEach((participation, index) => {
        if (!evidencePaths.has(`participations.${index}.publicSummary`)) errors.push(`Candidate ${candidate.candidateId} needs evidence for participation ${index}.`);
      });
    }
    if (candidate.candidateKind === "organization_refresh_bundle"
        || candidate.candidateKind === "organization_canonical_repair_bundle"
        || candidate.candidateKind === "demand_refresh_bundle") {
      const evidenceIds = new Set(candidate.fieldEvidence.map((evidence) => evidence.id));
      for (const operation of candidate.operations) {
        for (const evidenceId of operation.evidenceIds) if (!evidenceIds.has(evidenceId)) errors.push(`Candidate ${candidate.candidateId} operation ${operation.operationId} references missing evidence ${evidenceId}.`);
      }
    }
  }
}

async function validateCandidateFile(filePath: string): Promise<ValidationReport> {
  const parsed = researchCandidateBatchV2Schema.safeParse(await readJson<unknown>(filePath));
  if (!parsed.success) {
    return { kind: "candidate_batch", filePath, id: path.basename(filePath), errors: formatZodIssues(parsed.error), warnings: [], counts: {} };
  }

  const batch = parsed.data;
  const errors: string[] = [];
  const warnings: string[] = [];
  const coverage = await loadResearchCoverage();
  const missionSlugs = new Set(coverage.missionAreas.map((mission) => mission.slug));
  const domainSlugs = new Set(coverage.technicalDomains.map((domain) => domain.slug));
  const existing = await collectExistingIdentities({ excludePath: filePath });
  addDuplicateValueErrors(batch.candidates.map((candidate) => candidate.candidateId), "Candidate id", errors);
  validateCandidateEvidence(batch, errors);

  for (const candidate of batch.candidates) {
    errors.push(...reviewCandidateIntakeIssues(candidate));
    if (!candidate.reviewTier) warnings.push(`Candidate ${candidate.candidateId} predates green or amber review-tier metadata.`);
    if (candidate.reviewTier === "amber") warnings.push(`Candidate ${candidate.candidateId} is amber: ${(candidate.reviewWarnings ?? []).join("; ")}`);
    warnings.push(...researchCandidateQualityIssues(candidate));
    if (/turn\d+(?:search|view)\d+|【|†/.test(JSON.stringify(candidate))) errors.push(`Candidate ${candidate.candidateId} contains a non-portable citation token.`);
    if (candidate.candidateKind === "organization_bundle") {
      const match = existing.find((identity) => researchIdentityMatches(identity, {
        slug: candidate.organization.slug,
        name: candidate.organization.name,
        websiteDomain: urlDomain(candidate.organization.websiteUrl)
      }));
      const publishedOrganization = coverage.organizations.find((organization) => organization.slug === candidate.organization.slug);
      const isPublicationArtifact = coverage.candidateStatuses[candidate.candidateId] === "published"
        || artifactPredatesPublication(batch.createdAt, publishedOrganization);
      if (match && !isPublicationArtifact) {
        errors.push(`Candidate ${candidate.candidateId} duplicates ${match.name} in ${match.source}.`);
      }
      for (const capability of candidate.capabilities) {
        addTaxonomyErrors(capability.technicalDomainSlugs, domainSlugs, `Capability ${capability.slug}`, errors);
        addTaxonomyErrors(capability.missionMatches.map((matchItem) => matchItem.missionAreaSlug), missionSlugs, `Capability ${capability.slug}`, errors);
      }
    }
    if (candidate.candidateKind === "demand_signal_bundle") {
      for (const requirement of candidate.requirements) {
        addTaxonomyErrors(requirement.missionAreaSlugs, missionSlugs, `Demand requirement ${requirement.slug}`, errors);
        addTaxonomyErrors(requirement.technicalDomainSlugs, domainSlugs, `Demand requirement ${requirement.slug}`, errors);
      }
    }
  }

  const sourceLeadPath = path.resolve(workspaceRoot, batch.sourceLeadBatchPath);
  if (!(await fileExists(sourceLeadPath))) {
    errors.push(`sourceLeadBatchPath does not exist: ${batch.sourceLeadBatchPath}.`);
  } else {
    const leadParsed = sourceLeadBatchV2Schema.safeParse(await readJson<unknown>(sourceLeadPath));
    if (!leadParsed.success) {
      errors.push(`sourceLeadBatchPath is not a valid v2 source-lead batch.`);
    } else {
      const qualifiedLeadIds = new Set(leadParsed.data.leads.filter((lead) => lead.disposition === "qualified").map((lead) => lead.id));
      for (const candidate of batch.candidates) {
        for (const leadId of candidate.sourceLeadIds) {
          if (!qualifiedLeadIds.has(leadId)) errors.push(`Candidate ${candidate.candidateId} references lead ${leadId}, which is not qualified.`);
        }
      }
    }
  }

  return {
    kind: "candidate_batch",
    filePath,
    id: batch.batchId,
    errors,
    warnings,
    counts: {
      candidates: batch.candidates.length,
      organizations: batch.candidates.filter((candidate) => candidate.candidateKind === "organization_bundle").length,
      demandSignals: batch.candidates.filter((candidate) => candidate.candidateKind === "demand_signal_bundle").length,
      programRelationships: batch.candidates.filter((candidate) => candidate.candidateKind === "program_relationship_bundle").length,
      organizationRefreshes: batch.candidates.filter((candidate) => candidate.candidateKind === "organization_refresh_bundle").length,
      canonicalRepairs: batch.candidates.filter((candidate) => candidate.candidateKind === "organization_canonical_repair_bundle").length,
      demandRefreshes: batch.candidates.filter((candidate) => candidate.candidateKind === "demand_refresh_bundle").length,
      green: batch.candidates.filter((candidate) => candidate.reviewTier === "green").length,
      amber: batch.candidates.filter((candidate) => candidate.reviewTier === "amber").length,
      deferred: batch.deferred.length
    }
  };
}

function formatValidation(reports: ValidationReport[], options: { detailedWarnings?: boolean } = {}) {
  const errors = reports.reduce((sum, report) => sum + report.errors.length, 0);
  const warnings = reports.reduce((sum, report) => sum + report.warnings.length, 0);
  const lines = ["Autonomous research validation", `Artifacts: ${reports.length}`, `Errors: ${errors}`, `Warnings: ${warnings}`];
  if (!options.detailedWarnings) {
    for (const report of reports.filter((item) => item.errors.length > 0)) {
      lines.push("", `${report.kind}: ${report.id}`, `File: ${relative(report.filePath)}`);
      report.errors.forEach((error) => lines.push(`ERROR: ${error}`));
    }
    if (warnings > 0) lines.push("", "Run with --verbose true to inspect historical and advisory warnings.");
    return lines.join("\n");
  }
  for (const report of reports) {
    lines.push("", `${report.kind}: ${report.id}`, `File: ${relative(report.filePath)}`);
    for (const [label, count] of Object.entries(report.counts)) lines.push(`${label}: ${count}`);
    report.errors.forEach((error) => lines.push(`ERROR: ${error}`));
    if (report.warnings.length > 0) lines.push(`Warning count: ${report.warnings.length}`);
    if (options.detailedWarnings) report.warnings.forEach((warning) => lines.push(`WARN: ${warning}`));
  }
  return lines.join("\n");
}

async function validateArtifacts(args: string[]) {
  const { positional, options } = parseOptions(args);
  const files = positional.length
    ? positional.map((filePath) => path.resolve(workspaceRoot, filePath))
    : [
        ...(await listJsonFiles(runDir)),
        ...(await listJsonFiles(collectionPlanDir)),
        ...(await listJsonFiles(claimLedgerDir)),
        ...(await listJsonFiles(canonicalRepairSnapshotDir)),
        ...(await listJsonFiles(prospectDir)),
        ...(await listJsonFiles(sourceLeadDir)),
        ...(await listJsonFiles(candidateDir)),
        ...(await listJsonFiles(signalDir))
      ];
  const reports: ValidationReport[] = [];
  const artifacts: unknown[] = [];
  for (const filePath of files) {
    const value = asRecord(await readJson<unknown>(filePath));
    artifacts.push(value);
    if (value.schemaVersion === "research_run_v1") reports.push(await validateRunFile(filePath));
    else if (value.schemaVersion === "research_collection_plan_v1") reports.push(await validateCollectionPlanFile(filePath));
    else if (value.schemaVersion === "research_claim_ledger_v1") reports.push(await validateClaimLedgerFile(filePath));
    else if (value.schemaVersion === "canonical_organization_repair_snapshot_v1") reports.push(await validateCanonicalRepairSnapshotFile(filePath));
    else if (value.schemaVersion === "research_prospect_inventory_v1") reports.push(await validateProspectFile(filePath));
    else if (value.schemaVersion === "source_lead_batch_v2") reports.push(await validateSourceLeadFile(filePath));
    else if (value.schemaVersion === "research_candidate_batch_v2") reports.push(await validateCandidateFile(filePath));
    else if (value.schemaVersion === "research_signal_batch_v1") reports.push(await validateSignalFile(filePath));
    else reports.push({ kind: "candidate_batch", filePath, id: path.basename(filePath), errors: ["Unknown research artifact schemaVersion."], warnings: [], counts: {} });
  }
  for (const runValue of artifacts) {
    const run = researchRunSchema.safeParse(runValue);
    if (!run.success || !requiresRecordSpecificResearchContract(run.data.agentVersion) || run.data.status !== "completed") continue;
    const plan = artifacts.map((value) => researchCollectionPlanV1Schema.safeParse(value)).find((parsed) => parsed.success && parsed.data.runId === run.data.runId);
    const prospects = artifacts.map((value) => researchProspectInventoryV1Schema.safeParse(value)).find((parsed) => parsed.success && parsed.data.runId === run.data.runId);
    const signals = artifacts.map((value) => researchSignalBatchV1Schema.safeParse(value)).find((parsed) => parsed.success && parsed.data.runId === run.data.runId);
    const leads = artifacts.map((value) => sourceLeadBatchV2Schema.safeParse(value)).find((parsed) => parsed.success && parsed.data.runId === run.data.runId);
    const ledger = artifacts.map((value) => researchClaimLedgerV1Schema.safeParse(value)).find((parsed) => parsed.success && parsed.data.runId === run.data.runId);
    const batch = artifacts.map((value) => researchCandidateBatchV2Schema.safeParse(value)).find((parsed) => parsed.success && parsed.data.runId === run.data.runId);
    const canonicalSnapshot = artifacts.map((value) => canonicalOrganizationRepairSnapshotV1Schema.safeParse(value)).find((parsed) => parsed.success && parsed.data.runId === run.data.runId);
    const runReport = reports.find((report) => report.kind === "run" && report.id === run.data.runId);
    const canonicalSnapshotReport = reports.find((report) => report.kind === "canonical_repair_snapshot" && report.id === run.data.runId);
    const requirements = recordSpecificArtifactRequirements(run.data);
    const modeInputsMissing = (requirements.prospects && !prospects?.success)
      || (requirements.signals && !signals?.success)
      || (run.data.mode === "canonical_repair" && !canonicalSnapshot?.success);
    if (!plan?.success || !leads?.success || !ledger?.success || !batch?.success || modeInputsMissing) {
      runReport?.errors.push(`Pipeline 1.7 run ${run.data.runId} is missing the complete artifact set required for record-specific validation.`);
      continue;
    }
    if (run.data.mode === "canonical_repair"
        && run.data.outputs.canonicalRepairSnapshot !== relative(canonicalSnapshotReport?.filePath ?? "")) {
      runReport?.errors.push(`Canonical repair run ${run.data.runId} snapshot output does not match the validated artifact path.`);
    }
    if (plan.data.status !== "complete" || ledger.data.status !== "complete") {
      runReport?.errors.push(`Pipeline 1.7 run ${run.data.runId} requires a complete collection plan and claim ledger.`);
      continue;
    }
    runReport?.errors.push(...researchReviewLineageIssues({ run: run.data, leads: leads.data, signals: signals?.success ? signals.data : null, ledger: ledger.data, batch: batch.data }));
    runReport?.errors.push(...researchRecordSpecificityIssues({
      run: run.data,
      plan: plan.data,
      prospects: prospects?.success ? prospects.data : null,
      signals: signals?.success ? signals.data : null,
      leads: leads.data,
      ledger: ledger.data,
      batch: batch.data
    }));
    runReport?.errors.push(...canonicalRepairSnapshotParityIssues({
      run: run.data,
      batch: batch.data,
      snapshot: canonicalSnapshot?.success ? canonicalSnapshot.data : null,
      targetSlugs: canonicalPlanTargetSlugs(plan.data)
    }));
  }
  console.log(formatValidation(reports, { detailedWarnings: options.get("verbose") === "true" }));
  if (reports.some((report) => report.errors.length > 0)) process.exitCode = 1;
  return reports;
}

function buildLinkabilityCatalog(coverage: ResearchCoverageSnapshot): LinkabilityCatalog {
  return {
    organizations: coverage.organizations.map((organization) => ({
      id: organization.id,
      slug: organization.slug,
      name: organization.name,
      legalName: organization.legalName,
      websiteUrl: organization.websiteUrl,
      updatedAt: organization.updatedAt,
      aliases: organization.aliases
    })),
    programs: coverage.programs,
    redirectSourceOrganizationIds: coverage.redirectSourceOrganizationIds
  };
}

function assessCandidateBatchLinkability(
  candidates: readonly unknown[],
  coverage: ResearchCoverageSnapshot
) {
  const catalog = buildLinkabilityCatalog(coverage);
  const assessments = candidates.map((candidate) => assessCandidateLinkability(candidate, catalog));
  return {
    errors: [...new Set(assessments.flatMap((assessment) => assessment.errors))],
    warnings: [...new Set(assessments.flatMap((assessment) => assessment.warnings))]
  };
}

function assertCandidateBatchLinkability(
  candidates: readonly unknown[],
  coverage: ResearchCoverageSnapshot,
  context: string
) {
  const assessment = assessCandidateBatchLinkability(candidates, coverage);
  if (assessment.errors.length > 0) {
    throw new Error(`${context} stopped by exact linkability checks: ${assessment.errors.join("; ")}`);
  }
  return assessment;
}

function formatCandidateReview(batch: ResearchCandidateBatchV2, coverage: ResearchCoverageSnapshot) {
  const catalog = buildLinkabilityCatalog(coverage);
  const lines = [
    `# ${batch.title}`,
    "",
    `- Batch: \`${batch.batchId}\``,
    `- Run: \`${batch.runId}\``,
    `- Status: **Candidate pending human review**`,
    `- Selected gap: ${batch.selectedGap.dimension}`,
    `- Candidates: ${batch.candidates.length}`,
    `- Deferred: ${batch.deferred.length}`,
    "",
    "## Publication boundary",
    "",
    "This packet is private review material. Acceptance and publication remain separate human actions. No candidate in this packet is public.",
    "",
    "## Reviewer checklist",
    "",
    "- [ ] Resolve every possible duplicate before acceptance.",
    "- [ ] Confirm organization type and controlled categories.",
    "- [ ] Confirm each public claim against its field evidence and canonical source.",
    "- [ ] Keep derived mission or demand alignment separate from source-backed facts.",
    "- [ ] Confirm the rationale makes Coverage value, Evidence, Mission/Public Need read, Unknowns, and Reviewer action explicit.",
    "- [ ] Confirm any Public Need hypothesis identifies the exact published need and does not imply eligibility, endorsement, customer interest, or a published match.",
    "- [ ] Edit, merge, defer, reject, or accept with substantive rationale.",
    "- [ ] Use a separate explicit publication action after acceptance.",
    "",
    "## Candidates",
    ""
  ];

  for (const candidate of batch.candidates) {
    lines.push(`### ${candidate.candidateId}`, "", `- Kind: \`${candidate.candidateKind}\``, `- Review tier: \`${candidate.reviewTier ?? "legacy-unrated"}\``, `- Confidence: \`${candidate.confidence}\``, `- Inclusion score: ${candidate.inclusionScore ?? "not recorded"}`, `- Completeness score: ${candidate.completenessScore ?? "not recorded"}`, `- Duplicate status: \`${candidate.duplicateCheck.status}\``);
    const recordSpecificWarnings = (candidate.reviewWarnings ?? []).filter((warning) => !isSharedResearchBoundaryWarning(warning));
    if (recordSpecificWarnings.length > 0) lines.push(`- Reviewer warnings: ${recordSpecificWarnings.join("; ")}`);
    if (candidate.candidateKind === "organization_bundle") {
      const missionReads = [...new Set(candidate.capabilities.flatMap((capability) => capability.missionMatches.map((match) => match.missionAreaSlug)))];
      const programNames = candidate.schemaVersion === "organization_bundle_v3"
        ? candidate.programParticipations.map((item) => item.program.name)
        : candidate.programs.map((program) => program.name);
      lines.push(`- Organization: **${candidate.organization.name}**`, `- Organization type: \`${candidate.organization.entityKind}\``, `- Categories: ${candidate.organization.categories.map((category) => `\`${category}\``).join(", ")}`, `- Capabilities: ${candidate.capabilities.map((capability) => capability.name).join(", ") || "none"}`, `- Derived Mission Area reads: ${missionReads.map((slug) => `\`${slug}\``).join(", ") || "none"}`, `- Programs: ${programNames.join(", ") || "none"}`);
    } else if (candidate.candidateKind === "demand_signal_bundle") {
      lines.push(`- Demand source: **${candidate.demandSource.title}**`, `- Issuers: ${candidate.issuers.map((issuer) => issuer.name).join(", ")}`, `- Requirements: ${candidate.requirements.map((requirement) => requirement.title).join("; ")}`);
    } else if (candidate.candidateKind === "organization_refresh_bundle" || candidate.candidateKind === "demand_refresh_bundle") {
      lines.push(`- Refresh target: **${candidate.targetMatch.slug}**`, `- Target ID: \`${candidate.targetMatch.entityId}\``, `- Operations: ${candidate.operations.length}`, `- Source channels: ${candidate.sourceChannels.join(", ")}`);
    } else if (candidate.candidateKind === "organization_canonical_repair_bundle") {
      const archive = candidate.operations.find((operation) => operation.operation === "archive_organization");
      lines.push(
        `- Canonical repair target: **${candidate.targetMatch.slug}**`,
        `- Target ID: \`${candidate.targetMatch.entityId}\``,
        `- Operations: ${candidate.operations.map((operation) => operation.operation).join(", ")}`,
        `- Outcome: ${archive ? `archive${archive.successor ? ` with successor \`${archive.successor.slug}\`` : " without successor"}` : "preserve the stable slug and repair reviewed identity or child records"}`,
        "- Review boundary: individual acceptance and a separate single-record Publish action are required."
      );
    } else {
      lines.push(`- Program: **${candidate.program.name}**`, `- Participations: ${candidate.participations.length}`);
    }
    lines.push(
      `- Sources: ${candidate.sources.map((source) => `[${source.title}](${source.url})`).join("; ")}`,
      "",
      ...formatCandidateLinkabilityReview(candidate, catalog),
      "**Generated reviewer rationale**",
      "",
      candidate.reviewerRationale,
      ""
    );
  }

  if (batch.deferred.length) {
    lines.push("## Deferred", "");
    for (const deferred of batch.deferred) lines.push(`- \`${deferred.leadId}\`: ${deferred.reason} Follow-up: ${deferred.followUp}`);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

async function assertCanonicalRepairSnapshotArtifacts(
  run: ResearchRun,
  batch: ResearchCandidateBatchV2,
  context: string
) {
  if (run.mode !== "canonical_repair") return;
  const snapshotOutput = run.outputs.canonicalRepairSnapshot;
  const planOutput = run.outputs.collectionPlan;
  if (!snapshotOutput || !planOutput) {
    throw new Error(`${context} requires the canonical repair run's private snapshot and collection-plan outputs.`);
  }
  const resolvedSnapshotPath = path.resolve(workspaceRoot, snapshotOutput);
  const expectedSnapshotPath = path.join(canonicalRepairSnapshotDir, `${run.runId}.json`);
  if (resolvedSnapshotPath !== expectedSnapshotPath) {
    throw new Error(`${context} requires the run-scoped snapshot at ${relative(expectedSnapshotPath)}.`);
  }
  const [snapshotValue, planValue] = await Promise.all([
    readJson<unknown>(resolvedSnapshotPath),
    readJson<unknown>(path.resolve(workspaceRoot, planOutput))
  ]);
  const snapshot = canonicalOrganizationRepairSnapshotV1Schema.safeParse(snapshotValue);
  const plan = researchCollectionPlanV1Schema.safeParse(planValue);
  if (!snapshot.success || !plan.success) {
    throw new Error(`${context} requires schema-valid canonical repair snapshot and collection-plan artifacts.`);
  }
  const issues = canonicalRepairSnapshotParityIssues({
    run,
    batch,
    snapshot: snapshot.data,
    targetSlugs: canonicalPlanTargetSlugs(plan.data)
  });
  if (issues.length > 0) throw new Error(`${context} stopped by canonical repair snapshot checks: ${issues.join("; ")}`);
}

async function writeReview(candidatePath: string) {
  const parsed = researchCandidateBatchV2Schema.parse(await readJson<unknown>(candidatePath));
  const coverage = await loadResearchCoverage();
  assertCandidateBatchLinkability(parsed.candidates, coverage, "Review packet generation");
  const reviewPath = path.join(reviewDir, `${parsed.batchId}.md`);
  await mkdir(reviewDir, { recursive: true });
  await writeFile(reviewPath, formatCandidateReview(parsed, coverage), "utf8");
  console.log(`Created ${relative(reviewPath)}`);
  return reviewPath;
}

async function writeStaging(runPath: string, candidatePath: string) {
  const run = researchRunSchema.parse(await readJson<unknown>(runPath));
  const batch = researchCandidateBatchV2Schema.parse(await readJson<unknown>(candidatePath));
  if (run.runId !== batch.runId) throw new Error(`Run ${run.runId} does not match candidate batch run ${batch.runId}.`);
  await assertCanonicalRepairSnapshotArtifacts(run, batch, "Staging export generation");
  const coverage = await loadResearchCoverage();
  const linkabilityAssessment = assertCandidateBatchLinkability(batch.candidates, coverage, "Staging export generation");
  if (linkabilityAssessment.warnings.length > 0) {
    console.warn(`Staging export retains ${linkabilityAssessment.warnings.length} advisory linkability finding${linkabilityAssessment.warnings.length === 1 ? "" : "s"} for human Review.`);
  }
  const stagingPath = path.join(stagingDir, `${run.runId}.json`);
  const contractCandidates = batch.candidates.map((candidate) => ({
    candidate_kind: candidate.candidateKind,
    schema_version: candidate.schemaVersion
  }));
  const contractIssues = researchCandidateContractIssues(contractCandidates);
  if (contractIssues.length) {
    throw new Error(`Candidate batch cannot enter Admin Review: ${contractIssues.join("; ")}`);
  }
  const generatedAt = run.completedAt ?? run.startedAt;
  const exportValue = {
    schemaVersion: "research_staging_export_v1",
    requiredApplicationContract: researchReviewContractVersion,
    generatedAt,
    writePolicy: "private_candidate_changes_only",
    publicationAllowed: false,
    researchRun: buildStagingResearchRun(run),
    candidateChanges: batch.candidates.map((candidate) => ({
      ...buildStagingCandidateChange(run.runId, candidate),
      staged_at: generatedAt
    }))
  };
  await mkdir(stagingDir, { recursive: true });
  await writeFile(stagingPath, `${JSON.stringify(exportValue, null, 2)}\n`, "utf8");
  console.log(`Created ${relative(stagingPath)}`);
  return stagingPath;
}

async function assertRecordSpecificStaging(staging: Record<string, unknown>) {
  const stagedRun = asRecord(staging.researchRun);
  const runId = String(stagedRun.client_run_id ?? "");
  const [runValue, batchValue] = await Promise.all([
    readJson<unknown>(path.join(runDir, `${runId}.json`)),
    readJson<unknown>(path.join(candidateDir, `${runId}.json`))
  ]);
  const run = researchRunSchema.safeParse(runValue);
  const batch = researchCandidateBatchV2Schema.safeParse(batchValue);
  if (!run.success || !batch.success || run.data.runId !== batch.data.runId) {
    throw new Error(`Review intake for ${runId} requires matching, schema-valid canonical run and candidate-batch artifacts.`);
  }
  await assertCanonicalRepairSnapshotArtifacts(run.data, batch.data, `Review intake for ${runId}`);
  const parityIssues = stagingPayloadParityIssues({
    staging,
    run: run.data,
    batch: batch.data,
    requiredApplicationContract: researchReviewContractVersion
  });
  if (parityIssues.length > 0) throw new Error(`Review intake for ${runId} stopped: ${parityIssues.join("; ")}`);

  if (!requiresRecordSpecificResearchContract(run.data.agentVersion)) return;

  const prospectPath = path.join(prospectDir, `${runId}.json`);
  const signalPath = path.join(signalDir, `${runId}.json`);
  const [planValue, leadValue, ledgerValue, prospectValue, signalValue] = await Promise.all([
    readJson<unknown>(path.join(collectionPlanDir, `${runId}.json`)),
    readJson<unknown>(path.join(sourceLeadDir, `${runId}.json`)),
    readJson<unknown>(path.join(claimLedgerDir, `${runId}.json`)),
    fileExists(prospectPath).then((exists) => exists ? readJson<unknown>(prospectPath) : null),
    fileExists(signalPath).then((exists) => exists ? readJson<unknown>(signalPath) : null)
  ]);
  const plan = researchCollectionPlanV1Schema.safeParse(planValue);
  const leads = sourceLeadBatchV2Schema.safeParse(leadValue);
  const ledger = researchClaimLedgerV1Schema.safeParse(ledgerValue);
  const prospects = prospectValue === null ? null : researchProspectInventoryV1Schema.safeParse(prospectValue);
  const signals = signalValue === null ? null : researchSignalBatchV1Schema.safeParse(signalValue);
  const requirements = recordSpecificArtifactRequirements(run.data);
  const optionalArtifactInvalid = (prospects !== null && !prospects.success) || (signals !== null && !signals.success);
  if (!plan.success || !leads.success || !ledger.success || optionalArtifactInvalid
      || (requirements.prospects && !prospects?.success) || (requirements.signals && !signals?.success)) {
    throw new Error(`Current research review intake for ${runId} requires its mode-specific, schema-valid same-run artifact set.`);
  }
  const canonicalRunIssues = canonicalArtifactRunIssues(run.data, [
    { label: "Collection plan", runId: plan.data.runId, status: plan.data.status, requiredStatus: "complete" },
    { label: "Source lead batch", runId: leads.data.runId },
    { label: "Claim ledger", runId: ledger.data.runId, status: ledger.data.status, requiredStatus: "complete" },
    { label: "Candidate batch", runId: batch.data.runId },
    ...(prospects?.success ? [{ label: "Prospect inventory", runId: prospects.data.runId }] : []),
    ...(signals?.success ? [{ label: "Signal batch", runId: signals.data.runId }] : [])
  ]);
  if (canonicalRunIssues.length > 0) {
    throw new Error(`Current research review intake for ${runId} stopped: ${canonicalRunIssues.join("; ")}`);
  }
  const lineageIssues = researchReviewLineageIssues({ run: run.data, leads: leads.data, signals: signals?.success ? signals.data : null, ledger: ledger.data, batch: batch.data });
  if (lineageIssues.length > 0) {
    throw new Error(`Current research review intake for ${runId} stopped: ${lineageIssues.join("; ")}`);
  }
  const specificityIssues = researchRecordSpecificityIssues({
    run: run.data,
    plan: plan.data,
    prospects: prospects?.success ? prospects.data : null,
    signals: signals?.success ? signals.data : null,
    leads: leads.data,
    ledger: ledger.data,
    batch: batch.data
  });
  if (specificityIssues.length > 0) throw new Error(`Current research review intake stopped: ${specificityIssues.join("; ")}`);
}

async function importStagingUnlocked(stagingPath: string) {
  const staging = asRecord(await readJson<unknown>(stagingPath));
  if (staging.schemaVersion !== "research_staging_export_v1"
      || staging.publicationAllowed !== false
      || staging.writePolicy !== "private_candidate_changes_only") {
    throw new Error("Only a validated, non-publishable research staging export can be imported.");
  }
  const researchRun = asRecord(staging.researchRun);
  const candidateChanges = Array.isArray(staging.candidateChanges) ? staging.candidateChanges : [];
  if (!researchRun.client_run_id || candidateChanges.length < 1) {
    throw new Error("The staging export must contain one research run and at least one candidate.");
  }
  if (staging.requiredApplicationContract !== researchReviewContractVersion) {
    throw new Error(`Staging export requires '${String(staging.requiredApplicationContract || "missing")}', but this importer requires '${researchReviewContractVersion}'. Recreate the staging export with the current project.`);
  }
  const localContractIssues = researchCandidateContractIssues(candidateChanges);
  if (localContractIssues.length) {
    throw new Error(`Review intake stopped before database staging: ${localContractIssues.join("; ")}`);
  }
  await assertRecordSpecificStaging(staging);
  const coverage = await loadResearchCoverage();
  const linkabilityAssessment = assertCandidateBatchLinkability(
    candidateChanges.map((candidate) => asRecord(candidate).proposed_record),
    coverage,
    "Review intake"
  );
  if (linkabilityAssessment.warnings.length > 0) {
    console.warn(`Review intake retains ${linkabilityAssessment.warnings.length} advisory linkability finding${linkabilityAssessment.warnings.length === 1 ? "" : "s"} for human Review.`);
  }
  await assertDeployedResearchReviewContract(candidateChanges, { requiredPipelineVersion: String(researchRun.agent_version) });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service-role credentials are required to put research candidates into Review. Use --file-only only when intentionally validating artifacts without admin intake.");
  }

  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const incomingCandidateIds = new Set(candidateChanges.map((candidate) => String(asRecord(candidate).client_candidate_id ?? "")));
  const targetIds = [...new Set(candidateChanges
    .map((candidate) => String(asRecord(candidate).target_entity_id ?? ""))
    .filter(Boolean))];
  if (targetIds.length > 0) {
    const { data: activeTargets, error: activeTargetsError } = await client
      .from("candidate_changes")
      .select("client_candidate_id, target_entity_id, status")
      .in("target_entity_id", targetIds)
      .in("status", ["pending", "approved"]);
    if (activeTargetsError) throw new Error(`Review intake could not recheck active target overlap: ${activeTargetsError.message}`);
    const collision = (activeTargets ?? []).find((candidate) => !incomingCandidateIds.has(String(candidate.client_candidate_id ?? "")));
    if (collision) {
      throw new Error(`Review intake stopped because target ${collision.target_entity_id} gained a separate ${collision.status} candidate after preparation. Re-read Review state and rebuild the overlapping target.`);
    }
  }
  const { data, error } = await client.rpc("stage_research_candidates_for_review", {
    p_run: researchRun,
    p_candidates: candidateChanges
  });
  if (error) throw new Error(`Review intake failed: ${error.message}`);

  const result = Array.isArray(data) ? data[0] : data;
  const stagedCount = Number((result as { staged_count?: number } | null)?.staged_count ?? 0);
  const skippedCount = Number((result as { skipped_count?: number } | null)?.skipped_count ?? 0);
  console.log(`Review intake complete: ${stagedCount} candidate${stagedCount === 1 ? "" : "s"} available in Admin Review; ${skippedCount} unchanged.`);
  return { stagedCount, skippedCount };
}

async function importStaging(stagingPath: string) {
  return withResearchWriterLock(
    workspaceRoot,
    `research-import:${path.basename(stagingPath)}`,
    () => importStagingUnlocked(stagingPath)
  );
}

async function reconcileReview(runPath: string, candidatePath: string) {
  const run = researchRunSchema.parse(await readJson<unknown>(runPath));
  const batch = researchCandidateBatchV2Schema.parse(await readJson<unknown>(candidatePath));
  if (run.runId !== batch.runId) throw new Error(`Run ${run.runId} does not match candidate batch run ${batch.runId}.`);
  if (batch.candidates.length < 1) throw new Error("Admin Review reconciliation is not applicable to an all-disposition, zero-candidate run.");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service-role credentials are required to reconcile Admin Review intake.");
  const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: storedRun, error: storedRunError } = await client
    .from("research_runs")
    .select("id, resume_token, status")
    .eq("resume_token", run.runId)
    .maybeSingle();
  if (storedRunError) throw new Error(`Could not read the exact production research run: ${storedRunError.message}`);
  if (!storedRun) throw new Error(`Production research run ${run.runId} was not found after import.`);

  const expected = new Map(batch.candidates.map((candidate) => [candidate.candidateId, candidate]));
  const candidateIds = [...expected.keys()];
  const { data: rows, error: rowsError } = await client
    .from("candidate_changes")
    .select("research_run_id, client_candidate_id, candidate_kind, schema_version, target_entity_id, status, published_at")
    .in("client_candidate_id", candidateIds);
  if (rowsError) throw new Error(`Could not reconcile production candidate rows: ${rowsError.message}`);

  const issues: string[] = [];
  const storedRows = rows ?? [];
  if (storedRows.length !== candidateIds.length) issues.push(`Expected ${candidateIds.length} candidate rows but found ${storedRows.length}.`);
  const storedIds = new Set(storedRows.map((row) => String(row.client_candidate_id ?? "")));
  for (const candidateId of candidateIds) if (!storedIds.has(candidateId)) issues.push(`Candidate ${candidateId} is missing from production Review state.`);
  for (const row of storedRows) {
    const candidateId = String(row.client_candidate_id ?? "");
    const candidate = expected.get(candidateId);
    if (!candidate) {
      issues.push(`Unexpected candidate ${candidateId || "<missing>"} was returned by reconciliation.`);
      continue;
    }
    if (row.research_run_id !== storedRun.id) issues.push(`Candidate ${candidateId} is linked to a different research run.`);
    if (row.candidate_kind !== candidate.candidateKind) issues.push(`Candidate ${candidateId} kind drifted from ${candidate.candidateKind} to ${row.candidate_kind}.`);
    if (row.schema_version !== candidate.schemaVersion) issues.push(`Candidate ${candidateId} schema drifted from ${candidate.schemaVersion} to ${row.schema_version}.`);
  }

  const targetIds = [...new Set(storedRows.map((row) => String(row.target_entity_id ?? "")).filter(Boolean))];
  let crossRunPendingTargetOverlap = 0;
  if (targetIds.length > 0) {
    const { data: activeRows, error: activeRowsError } = await client
      .from("candidate_changes")
      .select("client_candidate_id, target_entity_id, status")
      .in("target_entity_id", targetIds)
      .in("status", ["pending", "approved"]);
    if (activeRowsError) throw new Error(`Could not reconcile active target overlap: ${activeRowsError.message}`);
    crossRunPendingTargetOverlap = (activeRows ?? []).filter((row) => !expected.has(String(row.client_candidate_id ?? ""))).length;
    if (crossRunPendingTargetOverlap > 0) issues.push(`${crossRunPendingTargetOverlap} active candidate target overlaps another run.`);
  }

  const statusCounts: Record<string, number> = {};
  for (const row of storedRows) statusCounts[String(row.status ?? "unknown")] = (statusCounts[String(row.status ?? "unknown")] ?? 0) + 1;
  const result = {
    ok: issues.length === 0,
    runId: run.runId,
    productionRunId: storedRun.id,
    productionRunStatus: storedRun.status,
    expectedCandidateCount: candidateIds.length,
    candidateCount: storedRows.length,
    distinctCandidateCount: storedIds.size,
    statuses: statusCounts,
    publicationMarkers: storedRows.filter((row) => Boolean(row.published_at)).length,
    crossRunPendingTargetOverlap,
    issues
  };
  console.log(JSON.stringify(result, null, 2));
  if (issues.length > 0) throw new Error(`Admin Review reconciliation failed: ${issues.join("; ")}`);
  return result;
}

async function smoke(args: string[]) {
  const { options } = parseOptions(args);
  const runPath = path.resolve(workspaceRoot, options.get("run") ?? "");
  const collectionPlanPathOption = options.get("collection-plan");
  const collectionPlanPath = collectionPlanPathOption ? path.resolve(workspaceRoot, collectionPlanPathOption) : null;
  const claimLedgerPathOption = options.get("claims");
  const claimLedgerPath = claimLedgerPathOption ? path.resolve(workspaceRoot, claimLedgerPathOption) : null;
  const canonicalSnapshotPathOption = options.get("canonical-snapshot");
  const canonicalSnapshotPath = canonicalSnapshotPathOption ? path.resolve(workspaceRoot, canonicalSnapshotPathOption) : null;
  const prospectPathOption = options.get("prospects");
  const prospectPath = prospectPathOption ? path.resolve(workspaceRoot, prospectPathOption) : null;
  const signalPathOption = options.get("signals");
  const signalPath = signalPathOption ? path.resolve(workspaceRoot, signalPathOption) : null;
  const leadPath = path.resolve(workspaceRoot, options.get("leads") ?? "");
  const candidatePath = path.resolve(workspaceRoot, options.get("candidates") ?? "");
  if (![runPath, leadPath, candidatePath].every((filePath) => filePath && filePath !== workspaceRoot)) {
    throw new Error("Smoke test requires --run, --leads, and --candidates paths.");
  }

  const runReport = await validateRunFile(runPath);
  const collectionPlanReport = collectionPlanPath ? await validateCollectionPlanFile(collectionPlanPath) : null;
  const claimLedgerReport = claimLedgerPath ? await validateClaimLedgerFile(claimLedgerPath) : null;
  const canonicalSnapshotReport = canonicalSnapshotPath ? await validateCanonicalRepairSnapshotFile(canonicalSnapshotPath) : null;
  const leadReport = await validateSourceLeadFile(leadPath);
  const candidateReport = await validateCandidateFile(candidatePath);
  const prospectReport = prospectPath ? await validateProspectFile(prospectPath) : null;
  const signalReport = signalPath ? await validateSignalFile(signalPath) : null;
  const reports = [
    runReport,
    ...(collectionPlanReport ? [collectionPlanReport] : []),
    ...(claimLedgerReport ? [claimLedgerReport] : []),
    ...(canonicalSnapshotReport ? [canonicalSnapshotReport] : []),
    ...(prospectReport ? [prospectReport] : []),
    ...(signalReport ? [signalReport] : []),
    leadReport,
    candidateReport
  ];
  const run = researchRunSchema.safeParse(await readJson<unknown>(runPath));
  const collectionPlan = collectionPlanPath ? researchCollectionPlanV1Schema.safeParse(await readJson<unknown>(collectionPlanPath)) : null;
  const claimLedger = claimLedgerPath ? researchClaimLedgerV1Schema.safeParse(await readJson<unknown>(claimLedgerPath)) : null;
  const canonicalSnapshot = canonicalSnapshotPath ? canonicalOrganizationRepairSnapshotV1Schema.safeParse(await readJson<unknown>(canonicalSnapshotPath)) : null;
  const leadBatch = sourceLeadBatchV2Schema.safeParse(await readJson<unknown>(leadPath));
  const batch = researchCandidateBatchV2Schema.safeParse(await readJson<unknown>(candidatePath));
  const prospects = prospectPath ? researchProspectInventoryV1Schema.safeParse(await readJson<unknown>(prospectPath)) : null;
  const signals = signalPath ? researchSignalBatchV1Schema.safeParse(await readJson<unknown>(signalPath)) : null;
  if (run.success && run.data.status !== "completed") runReport.errors.push("Smoke-test run must have status completed.");
  const recordSpecificRequirements = run.success ? recordSpecificArtifactRequirements(run.data) : null;
  if (run.success && run.data.osintArtifactsRequired && !collectionPlanPath) runReport.errors.push("OSINT-enabled smoke test requires --collection-plan.");
  if (run.success && run.data.osintArtifactsRequired && !claimLedgerPath) runReport.errors.push("OSINT-enabled smoke test requires --claims.");
  if (run.success && run.data.mode === "canonical_repair" && !canonicalSnapshotPath) runReport.errors.push("Canonical-repair smoke test requires --canonical-snapshot.");
  if (recordSpecificRequirements?.prospects && !prospectPath) runReport.errors.push("This pipeline 1.7 run requires --prospects.");
  if (recordSpecificRequirements?.signals && !signalPath) runReport.errors.push("This pipeline 1.7 run requires --signals.");
  if (run.success && batch.success && batch.data.candidates.length < 1) {
    const workflowMode = researchWorkflowModeForRunMode(run.data.mode);
    if (!workflowMode?.typedDispositionMayReplaceCandidate) {
      candidateReport.errors.push("Smoke test must create at least one review-ready candidate for this workflow mode.");
    } else if (batch.data.deferred.length < 1 || batch.data.deferred.some((item) => !item.readinessDisposition)) {
      candidateReport.errors.push("A zero-candidate run requires at least one structured research_required or no_material_change disposition.");
    }
  }
  if (run.success && batch.success && run.data.counters.candidatesCreated !== batch.data.candidates.length) runReport.errors.push("Run candidate counter does not match candidate batch size.");
  if (run.success && collectionPlan?.success) {
    if (collectionPlan.data.runId !== run.data.runId) collectionPlanReport?.errors.push("Collection plan runId does not match the research run.");
    if (collectionPlan.data.status !== "complete") collectionPlanReport?.errors.push("Smoke-test collection plan must have status complete.");
    if (run.data.outputs.collectionPlan && relative(collectionPlanPath as string) !== run.data.outputs.collectionPlan) runReport.errors.push("Run collection-plan output does not match the smoke-test artifact.");
  }
  if (run.success && claimLedger?.success) {
    if (claimLedger.data.runId !== run.data.runId) claimLedgerReport?.errors.push("Claim ledger runId does not match the research run.");
    if (claimLedger.data.status !== "complete") claimLedgerReport?.errors.push("Smoke-test claim ledger must have status complete.");
    if (run.data.outputs.claimLedger && relative(claimLedgerPath as string) !== run.data.outputs.claimLedger) runReport.errors.push("Run claim-ledger output does not match the smoke-test artifact.");
    if ((run.data.counters.claimsCollected ?? 0) !== claimLedger.data.claims.length) runReport.errors.push("Run claim counter does not match claim ledger.");
    if ((run.data.counters.claimsConflicted ?? 0) !== claimLedger.data.claims.filter((claim) => claim.status === "conflicted").length) runReport.errors.push("Run conflicted-claim counter does not match claim ledger.");
    if ((run.data.counters.coverageSubjects ?? 0) !== claimLedger.data.subjects.length) runReport.errors.push("Run coverage-subject counter does not match claim ledger.");
  }
  if (run.success && run.data.mode === "canonical_repair" && canonicalSnapshot?.success && collectionPlan?.success && batch.success) {
    if (canonicalSnapshot.data.runId !== run.data.runId) canonicalSnapshotReport?.errors.push("Canonical repair snapshot runId does not match the research run.");
    if (run.data.outputs.canonicalRepairSnapshot !== relative(canonicalSnapshotPath as string)) runReport.errors.push("Run canonical-repair snapshot output does not match the smoke-test artifact.");
    canonicalSnapshotReport?.errors.push(...canonicalRepairSnapshotParityIssues({
      run: run.data,
      batch: batch.data,
      snapshot: canonicalSnapshot.data,
      targetSlugs: canonicalPlanTargetSlugs(collectionPlan.data)
    }));
  }
  if (batch.success && claimLedger?.success) {
    if (run.success && leadBatch.success && requiresRecordSpecificResearchContract(run.data.agentVersion)) {
      claimLedgerReport?.errors.push(...researchReviewLineageIssues({ run: run.data, leads: leadBatch.data, signals: signals?.success ? signals.data : null, ledger: claimLedger.data, batch: batch.data }));
    }
    if (run.success && requiresResearchQualityContract(run.data.agentVersion)) {
      claimLedgerReport?.errors.push(...researchClaimLedgerQualityIssues(claimLedger.data));
      for (const candidate of batch.data.candidates) candidateReport.errors.push(...researchCandidateQualityIssues(candidate));
    }
  }
  if (run.success && requiresRecordSpecificResearchContract(run.data.agentVersion) && collectionPlan?.success && claimLedger?.success && leadBatch.success && batch.success) {
    candidateReport.errors.push(...researchRecordSpecificityIssues({
      run: run.data,
      plan: collectionPlan.data,
      prospects: prospects?.success ? prospects.data : null,
      signals: signals?.success ? signals.data : null,
      leads: leadBatch.data,
      ledger: claimLedger.data,
      batch: batch.data
    }));
  }
  if (run.success && prospects?.success) {
    if (prospects.data.runId !== run.data.runId) prospectReport?.errors.push("Prospect inventory runId does not match the research run.");
    if ((run.data.counters.uniqueProspects ?? 0) !== prospects.data.prospects.length) runReport.errors.push("Run unique-prospect counter does not match prospect inventory size.");
    const lanes = new Set(prospects.data.prospects.map((prospect) => prospect.discoveryLane)).size;
    if ((run.data.counters.sourceLanesSearched ?? 0) !== lanes) runReport.errors.push("Run source-lane counter does not match prospect inventory.");
  }
  if (run.success && signals?.success) {
    if (signals.data.runId !== run.data.runId) signalReport?.errors.push("Signal batch runId does not match the research run.");
    if ((run.data.counters.signalsExtracted ?? 0) !== signals.data.signals.length) runReport.errors.push("Run signal counter does not match signal batch size.");
    const dispositioned = signals.data.signals.filter((signal) => signal.disposition !== undefined).length;
    if ((run.data.counters.signalsDispositioned ?? 0) !== dispositioned) runReport.errors.push("Run dispositioned-signal counter does not match signal batch.");
    const families = Object.values(signals.data.sourceFamilyCounters).filter((count) => count > 0).length;
    if ((run.data.counters.sourceFamiliesSearched ?? 0) !== families) runReport.errors.push("Run source-family counter does not match signal batch.");
  }
  if (run.success && run.data.mode === "bootstrap" && batch.success) {
    const kinds = new Set(batch.data.candidates.filter((candidate) => candidate.candidateKind === "organization_bundle").map((candidate) => candidate.organization.entityKind));
    for (const kind of ["company", "accelerator", "incubator", "investor_funder"]) {
      if (!kinds.has(kind as never)) candidateReport.errors.push(`Bootstrap smoke test is missing ${kind}.`);
    }
  }
  if (batch.success) {
    const coverage = await loadResearchCoverage();
    const linkabilityAssessment = assessCandidateBatchLinkability(batch.data.candidates, coverage);
    candidateReport.errors.push(...linkabilityAssessment.errors);
    candidateReport.warnings.push(...linkabilityAssessment.warnings);
  }

  console.log(formatValidation(reports, { detailedWarnings: true }));
  if (reports.some((report) => report.errors.length > 0)) {
    process.exitCode = 1;
    return;
  }
  if (options.get("check-only") === "true") {
    console.log(`Smoke check passed without writing review, staging, or database artifacts: ${batch.success ? batch.data.candidates.length : 0} candidates validated.`);
    return;
  }
  const reviewPath = await writeReview(candidatePath);
  const stagingPath = await writeStaging(runPath, candidatePath);
  if (options.get("file-only") !== "true") await importStaging(stagingPath);
  console.log(`Smoke test passed: ${batch.success ? batch.data.candidates.length : 0} candidates are ready for human review${options.get("file-only") === "true" ? " in the file-only staging export" : " in the admin Review workflow"}.`);
  console.log(`Review packet: ${relative(reviewPath)}`);
  console.log(`Staging export: ${relative(stagingPath)}`);
}

async function main() {
  const command = process.argv[2] ?? "validate";
  const args = process.argv.slice(3);
  if (command === "prepare") {
    return withResearchWriterLock(workspaceRoot, "research-prepare", () => prepareRun(args));
  }
  if (command === "coverage") return console.log(formatCoverage(await buildCoverage()));
  if (command === "validate") return validateArtifacts(args);
  if (command === "review") {
    const { positional } = parseOptions(args);
    if (positional.length !== 1) throw new Error("Review requires one candidate batch path.");
    return writeReview(path.resolve(workspaceRoot, positional[0]));
  }
  if (command === "stage") {
    const { options } = parseOptions(args);
    return writeStaging(
      path.resolve(workspaceRoot, options.get("run") ?? ""),
      path.resolve(workspaceRoot, options.get("candidates") ?? "")
    );
  }
  if (command === "import") {
    const { options, positional } = parseOptions(args);
    const stagingPath = options.get("staging") ?? positional[0];
    if (!stagingPath) throw new Error("Import requires --staging <research/ingestion/staging/file.json>.");
    return importStaging(path.resolve(workspaceRoot, stagingPath));
  }
  if (command === "reconcile") {
    const { options } = parseOptions(args);
    const runPath = options.get("run");
    const candidatePath = options.get("candidates");
    if (!runPath || !candidatePath) throw new Error("Reconcile requires --run <run-path> and --candidates <candidate-batch-path>.");
    return reconcileReview(path.resolve(workspaceRoot, runPath), path.resolve(workspaceRoot, candidatePath));
  }
  if (command === "smoke") return smoke(args);
  throw new Error(`Unknown autonomous research command '${command}'.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
