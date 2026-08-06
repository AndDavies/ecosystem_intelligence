import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
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
  requiresResearchQualityContract,
  sourceLeadBatchV2Schema,
  type ResearchCandidateBatchV2,
  type ResearchClaimLedgerV1,
  type ResearchCollectionPlanV1,
  type ResearchRun,
  type ResearchSignalBatchV1,
} from "../src/lib/research/pipeline-schema";
import { buildDefaultResearchRunId } from "../src/lib/research/run-id";
import { parseSourceBookCsv, rankSourceBookRows } from "../src/lib/research/source-ranking";
import { assertDeployedResearchReviewContract, researchCandidateContractIssues, researchReviewContractVersion } from "../src/lib/research/deployment-contract";
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

interface ExistingIdentity {
  id: string;
  name: string;
  slug: string;
  websiteDomain: string | null;
  source: string;
}

interface ResearchCoverageOrganization extends ExistingIdentity {
  entityKind: (typeof organizationKindValues)[number];
  capabilityCount: number;
  missionAreaSlugs: string[];
  technicalDomainSlugs: string[];
  publishedAt: string | null;
}

interface ResearchCoverageSnapshot {
  organizations: ResearchCoverageOrganization[];
  missionAreas: Array<{ slug: string; name: string }>;
  technicalDomains: Array<{ slug: string; name: string }>;
  demandRequirements: Array<{ slug: string; sourceSlug: string; matchCount: number }>;
  issuerCounts: Record<string, number>;
  candidateStatuses: Record<string, string>;
}

interface ValidationReport {
  kind: "run" | "collection_plan" | "claim_ledger" | "prospect_inventory" | "source_leads" | "candidate_batch" | "signal_batch";
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
      candidateStatusesResult
    ] = await Promise.all([
      client.from("organizations").select("id, name, slug, website_url, entity_kind, published_at").eq("publication_status", "published"),
      client.from("capabilities").select("id, organization_id").eq("publication_status", "published"),
      client.from("mission_areas").select("id, slug, name").eq("publication_status", "published"),
      client.from("capability_mission_matches").select("capability_id, mission_area_id").eq("publication_status", "published"),
      client.from("technical_domains").select("id, slug, name").eq("publication_status", "published"),
      client.from("capability_domains").select("capability_id, technical_domain_id").eq("publication_status", "published"),
      client.from("demand_sources").select("id, slug").eq("publication_status", "published"),
      client.from("demand_requirements").select("id, slug, demand_source_id").eq("publication_status", "published"),
      client.from("capability_demand_matches").select("demand_requirement_id").eq("publication_status", "published"),
      client.from("demand_issuers").select("id, issuer_type").eq("publication_status", "published"),
      client.from("demand_source_issuers").select("demand_source_id, demand_issuer_id").eq("publication_status", "published"),
      adminClient
        ? adminClient.from("candidate_changes").select("client_candidate_id, status").not("client_candidate_id", "is", null)
        : Promise.resolve({ data: [], error: null })
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
      ["candidate statuses", candidateStatusesResult]
    ] as const;
    for (const [label, result] of results) {
      if (result.error) throw new Error(`Failed to load live ${label} for research coverage: ${result.error.message}`);
    }

    const organizations = (organizationsResult.data ?? []) as Array<{ id: string; name: string; slug: string; website_url: string | null; entity_kind: (typeof organizationKindValues)[number]; published_at: string | null }>;
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

    return {
      missionAreas: missionAreas.map(({ slug, name }) => ({ slug, name })),
      technicalDomains: technicalDomains.map(({ slug, name }) => ({ slug, name })),
      organizations: organizations.map((organization) => ({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        websiteDomain: urlDomain(organization.website_url),
        source: "published atlas",
        entityKind: organization.entity_kind,
        capabilityCount: capabilityCountByOrganization.get(organization.id) ?? 0,
        missionAreaSlugs: missionSlugsByOrganization.get(organization.id) ?? [],
        technicalDomainSlugs: domainSlugsByOrganization.get(organization.id) ?? [],
        publishedAt: organization.published_at
      })),
      demandRequirements: ((demandRequirementsResult.data ?? []) as Array<{ id: string; slug: string; demand_source_id: string }>).map((requirement) => ({
        slug: requirement.slug,
        sourceSlug: sourceSlugById.get(requirement.demand_source_id) ?? requirement.demand_source_id,
        matchCount: demandMatchCounts.get(requirement.id) ?? 0
      })),
      issuerCounts: Object.fromEntries(demandIssuerTypeValues.map((issuerType) => [issuerType, sourcesByIssuerType.get(issuerType)?.size ?? 0])),
      candidateStatuses: Object.fromEntries(
        ((candidateStatusesResult.data ?? []) as Array<{ client_candidate_id: string; status: string }>).map((candidate) => [candidate.client_candidate_id, candidate.status])
      )
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
  const bootstrap = requestedMode === "bootstrap";
  const deepDossier = requestedMode === "deep-dossier";
  const refreshBatch = requestedMode === "refresh-batch";
  if (!bootstrap && !deepDossier && !refreshBatch && !["discovery-batch", "gap-targeted"].includes(requestedMode)) {
    throw new Error("--mode must be discovery-batch, refresh-batch, deep-dossier, bootstrap, or gap-targeted.");
  }
  const startedAt = new Date().toISOString();
  const trigger = options.get("trigger") === "weekly" ? "weekly" : options.get("trigger") === "weekday" ? "weekday" : "manual";
  const runId = options.get("run-id") ?? buildDefaultResearchRunId({ trigger, bootstrap, startedAt });
  const runPath = path.join(runDir, `${runId}.json`);
  if (await fileExists(runPath)) throw new Error(`Run ${runId} already exists at ${relative(runPath)}.`);

  const coverage = await buildCoverage();
  let selectedGap = selectGap(coverage, bootstrap);
  const explicitOrganizationKinds = (options.get("organization-kinds") ?? options.get("organization-kind") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  for (const kind of explicitOrganizationKinds) {
    if (!organizationKindValues.includes(kind as (typeof organizationKindValues)[number])) throw new Error(`Unknown organization kind '${kind}'.`);
  }
  if (explicitOrganizationKinds.length > 0) {
    const kindLabel = explicitOrganizationKinds.join(", ").replaceAll("_", " ");
    selectedGap = {
      coverageView: explicitOrganizationKinds.every((kind) => kind === "company") ? "supply" : "ecosystem_support",
      dimension: `organization-kind:${explicitOrganizationKinds.join("+")}`,
      reason: `The operator explicitly scoped this run to increase reviewable Canadian ${kindLabel} coverage while preserving evidence and duplicate controls.`,
      score: 1000
    };
  }
  const organizationKinds = explicitOrganizationKinds.length > 0
    ? explicitOrganizationKinds as (typeof organizationKindValues)[number][]
    : bootstrap
    ? ["company", "accelerator", "incubator", "investor_funder"] as const
    : selectedGap.dimension.startsWith("organization-kind:")
      ? selectedGap.dimension.split(":")[1].split("+") as (typeof organizationKindValues)[number][]
      : [];
  const demandIssuerTypes = selectedGap.dimension.startsWith("demand-issuer-type:")
    ? [selectedGap.dimension.split(":")[1] as (typeof demandIssuerTypeValues)[number]]
    : [];
  const requestedTarget = Number(options.get("target-candidates") ?? (deepDossier ? 3 : bootstrap ? 4 : 10));
  const targetCandidates = Math.max(1, Math.min(deepDossier ? 5 : 10, Number.isFinite(requestedTarget) ? requestedTarget : 10));
  const minimumCandidates = refreshBatch ? 1 : deepDossier ? 1 : bootstrap ? 4 : Math.min(8, targetCandidates);
  const minimumProspects = refreshBatch ? 1 : deepDossier ? 1 : bootstrap ? 20 : 40;
  const minimumSourceLanes = refreshBatch ? 4 : deepDossier ? 3 : bootstrap ? 4 : 6;
  const collectionPlanPath = path.join(collectionPlanDir, `${runId}.json`);
  const claimLedgerPath = path.join(claimLedgerDir, `${runId}.json`);
  const collectionPlan: ResearchCollectionPlanV1 = researchCollectionPlanV1Schema.parse({
    schemaVersion: "research_collection_plan_v1",
    planId: `${runId}-collection-plan`,
    runId,
    createdAt: startedAt,
    status: "active",
    intelligenceRequirement: `Resolve the specific capabilities or public needs, Canadian relevance, technical and operational detail, proof and current activity, Mission Area or Public Need connection, material unknowns, and next reviewer action needed to address ${selectedGap.dimension}: ${selectedGap.reason}`,
    targetSubjects: [],
    priorityQuestions: [
      {
        questionId: "identity-canadian-presence",
        subjectType: "organization",
        question: "What is the canonical organization identity, ownership context, aliases, and evidence of an active Canadian operating presence?",
        targetFieldPaths: ["organization.name", "organization.aliases", "organization.primaryLocation", "organization.profileData"],
        evidenceThreshold: "one_anchor"
      },
      {
        questionId: "capability-definition",
        subjectType: "technology",
        question: "Which independently reviewable products, variants, subsystems, or operating functions exist, and what specifications, interfaces, dependencies, constraints, applications, and differentiators are publicly supportable?",
        targetFieldPaths: ["capabilities.*.summary", "capabilities.*.features", "capabilities.*.applications", "organization.profileData"],
        evidenceThreshold: "anchor_plus_independent_corroboration"
      },
      {
        questionId: "proof-and-current-state",
        subjectType: "signal",
        question: "Which trials, evaluations, deployments, contracts, procurement lifecycle events, public programs, customer activity, partnerships, and dated developments establish maturity or materially change the current record?",
        targetFieldPaths: ["programs.*.summary", "relationships.*.publicSummary", "demandSource.summary", "requirements.*.problemStatement"],
        evidenceThreshold: "anchor_plus_independent_corroboration"
      },
      {
        questionId: "mission-public-need-read",
        subjectType: "demand",
        question: "Which current Mission Area or exact published Public Need could this capability inform, what source-backed premises support each side, and what constraint prevents the relationship from being treated as proven fit?",
        targetFieldPaths: ["capabilities.*.missionMatches", "requirements.*.problemStatement", "requirements.*.desiredEndState", "reviewerRationale"],
        evidenceThreshold: "anchor_plus_independent_corroboration"
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
      queryPatterns: [
        `${selectedGap.dimension} Canada ${lane.replaceAll("_", " ")}`,
        `${selectedGap.dimension} Canada français ${lane.replaceAll("_", " ")}`,
        `${selectedGap.dimension} outcome constraint specification interface trial procurement Canada ${lane.replaceAll("_", " ")}`
      ],
      expectedClaims: ["identity or actor role", "specific capability, variant, interface, constraint, proof event, demand, program, contract, relationship, or current-activity detail", "decision-relevant unknown or verification path"]
    })),
    languagePlan: { languages: ["en", "fr"], frenchSearchRequired: true, exceptionReason: null },
    coverageDimensions: [...osintCoverageDimensionValues],
    stopConditions: [
      "Stop a subject only after the coverage vector records every dimension as covered, partial, not found, or not applicable with supporting claims or search attempts.",
      "Treat the dossier as saturated only when two additional complementary lanes produce low or zero new claims that would change the capability definition, proof or current state, Mission or Public Need read, material unknowns, or reviewer action.",
      "Do not stop on source count alone; every selected candidate needs a specific decision use, evidence basis, visible uncertainty, and bounded next reviewer action."
    ],
    prohibitedActions: ["social_interaction", "access_control_bypass", "personal_data_collection", "canonical_database_write", "candidate_approval_or_publication"]
  });
  const claimLedger: ResearchClaimLedgerV1 = researchClaimLedgerV1Schema.parse({
    schemaVersion: "research_claim_ledger_v1",
    ledgerId: `${runId}-claim-ledger`,
    runId,
    createdAt: startedAt,
    completedAt: null,
    status: "collecting",
    claims: [],
    subjects: [],
    warnings: []
  });
  const run: ResearchRun = {
    schemaVersion: "research_run_v1",
    runId,
    agentVersion: currentResearchPipelineVersion,
    trigger,
    mode: bootstrap ? "bootstrap" : deepDossier ? "deep_dossier" : refreshBatch ? "refresh_batch" : requestedMode === "gap-targeted" ? "gap_targeted" : "discovery_batch",
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
      totalMinutes: refreshBatch ? 45 : 90,
      sourceBookMinutes: refreshBatch ? 10 : 30,
      maxQualifiedLeads: 25,
      maxCandidates: deepDossier ? 5 : 10,
      maxSourceItems: refreshBatch ? 50 : undefined,
      minimumProspects,
      minimumSourceLanes,
      minimumCandidates,
      targetCandidates
    },
    sourceQueries: [],
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
      signalsExtracted: refreshBatch ? 0 : undefined,
      signalsDispositioned: refreshBatch ? 0 : undefined,
      sourceFamiliesSearched: refreshBatch ? 0 : undefined,
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
      prospectInventory: null,
      signalBatch: null,
      sourceLeadBatch: null,
      candidateBatch: null,
      reviewPacket: null,
      stagingExport: null
    }
  };

  const brief = [
    `# Research Run Brief - ${runId}`,
    "",
    `- Trigger: ${run.trigger}`,
    `- Mode: ${run.mode}`,
    `- Selected coverage view: ${selectedGap.coverageView}`,
    `- Selected gap: ${selectedGap.dimension}`,
    `- Reason: ${selectedGap.reason}`,
    `- Maximum qualified leads: ${run.limits.maxQualifiedLeads}`,
    `- Maximum candidates: ${run.limits.maxCandidates}`,
    `- Minimum prospects: ${run.limits.minimumProspects}`,
    `- Minimum source lanes: ${run.limits.minimumSourceLanes}`,
    `- Minimum completed candidates: ${run.limits.minimumCandidates}`,
    `- Target candidates: ${run.limits.targetCandidates}`,
    `- Collection plan: ${run.outputs.collectionPlan}`,
    `- Claim ledger: ${run.outputs.claimLedger}`,
    "",
    "## Required sequence",
    "",
    "1. Complete the generated intelligence-requirement collection plan before broad searching; add named subjects, aliases, identifiers, and target-specific query patterns as they become known.",
    refreshBatch ? "2. Apply $tnm-signal-refresh and build live published-record and public-demand watchlists before searching." : "2. Expand and rank the Source Book within the 30-minute sub-limit.",
    refreshBatch ? "3. Search at least four source families, inspect no more than 50 source items, extract atomic signals, and disposition every signal." : `3. Enumerate at least ${minimumProspects} unique prospects across at least ${minimumSourceLanes} productive source lanes in a prospect inventory.`,
    "4. Search entity-outward and problem-inward. Record atomic claims, canonical URLs, source-independence keys, temporal scope, conflicts, supersession, and candidate targets in the claim ledger while researching.",
    "5. Select prospects by coverage value, evidence recoverability, capability specificity, current trigger, Mission/Public Need relevance, actionability, and novelty. Create typed source leads from durable public sources using English and French aliases and queries where relevant.",
    "6. Use evidence recovery across at least three distinct lanes before deferring a plausible prospect for thin evidence.",
    "7. Complete every subject's coverage vector and decision-useful saturation assessment. Qualified leads continue automatically; do not pause for source-lead approval.",
    "8. Build enriched typed candidates in green or amber review tiers. Every rationale uses Coverage value, Evidence, Mission/Public Need read, Unknowns, and Reviewer action; amber candidates keep non-blocking gaps and claim conflicts as explicit reviewer warnings.",
    "9. If the batch remains below its minimum, record a specific underTargetReason and exhaustionEvidence before completion.",
    "10. Run `pnpm research:smoke -- --run <run> --collection-plan <collection-plan> --claims <claim-ledger> --prospects <prospects> --leads <leads> --candidates <candidates>`; refresh batches also pass `--signals <signals>`.",
    "11. Confirm candidates appear in Admin Review, then stop. Do not approve or publish.",
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
  await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`, "utf8");
  await writeFile(collectionPlanPath, `${JSON.stringify(collectionPlan, null, 2)}\n`, "utf8");
  await writeFile(claimLedgerPath, `${JSON.stringify(claimLedger, null, 2)}\n`, "utf8");
  await writeFile(path.join(briefDir, `${runId}.md`), `${brief}\n`, "utf8");
  console.log(`Created ${relative(runPath)}`);
  console.log(`Created ${relative(path.join(briefDir, `${runId}.md`))}`);
  console.log(`Created ${relative(collectionPlanPath)}`);
  console.log(`Created ${relative(claimLedgerPath)}`);
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
    const match = existing.find((identity) =>
      identity.slug === lead.duplicateFingerprint.stableSlug ||
      (domain !== null && identity.websiteDomain === domain) ||
      normalizeName(identity.name) === normalizeName(lead.organizationName)
    );
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
    if (candidate.candidateKind === "organization_refresh_bundle" || candidate.candidateKind === "demand_refresh_bundle") {
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
      const match = existing.find((identity) =>
        identity.slug === candidate.organization.slug ||
        identity.websiteDomain === urlDomain(candidate.organization.websiteUrl) ||
        normalizeName(identity.name) === normalizeName(candidate.organization.name)
      );
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
        ...(await listJsonFiles(prospectDir)),
        ...(await listJsonFiles(sourceLeadDir)),
        ...(await listJsonFiles(candidateDir)),
        ...(await listJsonFiles(signalDir))
      ];
  const reports: ValidationReport[] = [];
  for (const filePath of files) {
    const value = asRecord(await readJson<unknown>(filePath));
    if (value.schemaVersion === "research_run_v1") reports.push(await validateRunFile(filePath));
    else if (value.schemaVersion === "research_collection_plan_v1") reports.push(await validateCollectionPlanFile(filePath));
    else if (value.schemaVersion === "research_claim_ledger_v1") reports.push(await validateClaimLedgerFile(filePath));
    else if (value.schemaVersion === "research_prospect_inventory_v1") reports.push(await validateProspectFile(filePath));
    else if (value.schemaVersion === "source_lead_batch_v2") reports.push(await validateSourceLeadFile(filePath));
    else if (value.schemaVersion === "research_candidate_batch_v2") reports.push(await validateCandidateFile(filePath));
    else if (value.schemaVersion === "research_signal_batch_v1") reports.push(await validateSignalFile(filePath));
    else reports.push({ kind: "candidate_batch", filePath, id: path.basename(filePath), errors: ["Unknown research artifact schemaVersion."], warnings: [], counts: {} });
  }
  console.log(formatValidation(reports, { detailedWarnings: options.get("verbose") === "true" }));
  if (reports.some((report) => report.errors.length > 0)) process.exitCode = 1;
  return reports;
}

function formatCandidateReview(batch: ResearchCandidateBatchV2) {
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
      lines.push(`- Organization: **${candidate.organization.name}**`, `- Organization type: \`${candidate.organization.entityKind}\``, `- Categories: ${candidate.organization.categories.map((category) => `\`${category}\``).join(", ")}`, `- Capabilities: ${candidate.capabilities.map((capability) => capability.name).join(", ") || "none"}`, `- Derived Mission Area reads: ${missionReads.map((slug) => `\`${slug}\``).join(", ") || "none"}`, `- Programs: ${candidate.programs.map((program) => program.name).join(", ") || "none"}`);
    } else if (candidate.candidateKind === "demand_signal_bundle") {
      lines.push(`- Demand source: **${candidate.demandSource.title}**`, `- Issuers: ${candidate.issuers.map((issuer) => issuer.name).join(", ")}`, `- Requirements: ${candidate.requirements.map((requirement) => requirement.title).join("; ")}`);
    } else if (candidate.candidateKind === "organization_refresh_bundle" || candidate.candidateKind === "demand_refresh_bundle") {
      lines.push(`- Refresh target: **${candidate.targetMatch.slug}**`, `- Target ID: \`${candidate.targetMatch.entityId}\``, `- Operations: ${candidate.operations.length}`, `- Source channels: ${candidate.sourceChannels.join(", ")}`);
    } else {
      lines.push(`- Program: **${candidate.program.name}**`, `- Participations: ${candidate.participations.length}`);
    }
    lines.push(`- Sources: ${candidate.sources.map((source) => `[${source.title}](${source.url})`).join("; ")}`, "", "**Generated reviewer rationale**", "", candidate.reviewerRationale, "");
  }

  if (batch.deferred.length) {
    lines.push("## Deferred", "");
    for (const deferred of batch.deferred) lines.push(`- \`${deferred.leadId}\`: ${deferred.reason} Follow-up: ${deferred.followUp}`);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

async function writeReview(candidatePath: string) {
  const parsed = researchCandidateBatchV2Schema.parse(await readJson<unknown>(candidatePath));
  const reviewPath = path.join(reviewDir, `${parsed.batchId}.md`);
  await mkdir(reviewDir, { recursive: true });
  await writeFile(reviewPath, formatCandidateReview(parsed), "utf8");
  console.log(`Created ${relative(reviewPath)}`);
  return reviewPath;
}

async function writeStaging(runPath: string, candidatePath: string) {
  const run = researchRunSchema.parse(await readJson<unknown>(runPath));
  const batch = researchCandidateBatchV2Schema.parse(await readJson<unknown>(candidatePath));
  if (run.runId !== batch.runId) throw new Error(`Run ${run.runId} does not match candidate batch run ${batch.runId}.`);
  const stagingPath = path.join(stagingDir, `${run.runId}.json`);
  const contractCandidates = batch.candidates.map((candidate) => ({
    candidate_kind: candidate.candidateKind,
    schema_version: candidate.schemaVersion
  }));
  const contractIssues = researchCandidateContractIssues(contractCandidates);
  if (contractIssues.length) {
    throw new Error(`Candidate batch cannot enter Admin Review: ${contractIssues.join("; ")}`);
  }
  const exportValue = {
    schemaVersion: "research_staging_export_v1",
    requiredApplicationContract: researchReviewContractVersion,
    generatedAt: new Date().toISOString(),
    writePolicy: "private_candidate_changes_only",
    publicationAllowed: false,
    researchRun: {
      client_run_id: run.runId,
      run_type: run.trigger === "weekly" ? "weekly_gap" : run.trigger === "weekday" ? "targeted" : "manual",
      scope: run.scope,
      selected_gap: run.selectedGap,
      status: "completed",
      started_at: run.startedAt,
      completed_at: run.completedAt,
      agent_version: run.agentVersion,
      source_queries: run.sourceQueries,
      counters: run.counters,
      validation_results: run.validation,
      stop_reason: run.stopReason
    },
    candidateChanges: batch.candidates.map((candidate) => {
      const targetEntityType = candidate.candidateKind === "organization_bundle"
        ? "organization"
        : candidate.candidateKind === "demand_signal_bundle"
          ? "demand_source"
          : candidate.candidateKind === "organization_refresh_bundle"
            ? "organization"
            : candidate.candidateKind === "demand_refresh_bundle"
              ? "demand_source"
          : "program";
      const isRefresh = candidate.candidateKind === "organization_refresh_bundle" || candidate.candidateKind === "demand_refresh_bundle";
      return {
        client_candidate_id: candidate.candidateId,
        research_run_ref: run.runId,
        candidate_kind: candidate.candidateKind,
        schema_version: candidate.schemaVersion,
        source_lead_ids: candidate.sourceLeadIds,
        target_entity_type: targetEntityType,
        target_entity_id: isRefresh ? candidate.targetMatch.entityId : null,
        proposed_record: candidate,
        before_record: isRefresh ? candidate.beforeRecord : null,
        field_evidence: candidate.fieldEvidence,
        duplicate_check: candidate.duplicateCheck,
        reviewer_rationale: candidate.reviewerRationale,
        confidence: candidate.confidence,
        status: "pending",
        staged_at: new Date().toISOString()
      };
    })
  };
  await mkdir(stagingDir, { recursive: true });
  await writeFile(stagingPath, `${JSON.stringify(exportValue, null, 2)}\n`, "utf8");
  console.log(`Created ${relative(stagingPath)}`);
  return stagingPath;
}

async function importStaging(stagingPath: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service-role credentials are required to put research candidates into Review. Use --file-only only when intentionally validating artifacts without admin intake.");
  }

  const staging = asRecord(await readJson<unknown>(stagingPath));
  if (staging.schemaVersion !== "research_staging_export_v1" || staging.publicationAllowed !== false) {
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
  await assertDeployedResearchReviewContract(candidateChanges);

  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
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

async function smoke(args: string[]) {
  const { options } = parseOptions(args);
  const runPath = path.resolve(workspaceRoot, options.get("run") ?? "");
  const collectionPlanPathOption = options.get("collection-plan");
  const collectionPlanPath = collectionPlanPathOption ? path.resolve(workspaceRoot, collectionPlanPathOption) : null;
  const claimLedgerPathOption = options.get("claims");
  const claimLedgerPath = claimLedgerPathOption ? path.resolve(workspaceRoot, claimLedgerPathOption) : null;
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
  const leadReport = await validateSourceLeadFile(leadPath);
  const candidateReport = await validateCandidateFile(candidatePath);
  const prospectReport = prospectPath ? await validateProspectFile(prospectPath) : null;
  const signalReport = signalPath ? await validateSignalFile(signalPath) : null;
  const reports = [
    runReport,
    ...(collectionPlanReport ? [collectionPlanReport] : []),
    ...(claimLedgerReport ? [claimLedgerReport] : []),
    ...(prospectReport ? [prospectReport] : []),
    ...(signalReport ? [signalReport] : []),
    leadReport,
    candidateReport
  ];
  const run = researchRunSchema.safeParse(await readJson<unknown>(runPath));
  const collectionPlan = collectionPlanPath ? researchCollectionPlanV1Schema.safeParse(await readJson<unknown>(collectionPlanPath)) : null;
  const claimLedger = claimLedgerPath ? researchClaimLedgerV1Schema.safeParse(await readJson<unknown>(claimLedgerPath)) : null;
  const batch = researchCandidateBatchV2Schema.safeParse(await readJson<unknown>(candidatePath));
  const prospects = prospectPath ? researchProspectInventoryV1Schema.safeParse(await readJson<unknown>(prospectPath)) : null;
  const signals = signalPath ? researchSignalBatchV1Schema.safeParse(await readJson<unknown>(signalPath)) : null;
  if (run.success && run.data.status !== "completed") runReport.errors.push("Smoke-test run must have status completed.");
  if (run.success && run.data.osintArtifactsRequired && !collectionPlanPath) runReport.errors.push("OSINT-enabled smoke test requires --collection-plan.");
  if (run.success && run.data.osintArtifactsRequired && !claimLedgerPath) runReport.errors.push("OSINT-enabled smoke test requires --claims.");
  if (run.success && run.data.mode === "discovery_batch" && !prospectPath) runReport.errors.push("Discovery-batch smoke test requires --prospects.");
  if (run.success && run.data.mode === "refresh_batch" && !signalPath) runReport.errors.push("Refresh-batch smoke test requires --signals.");
  if (batch.success && batch.data.candidates.length < 1) candidateReport.errors.push("Smoke test must create at least one review-ready candidate.");
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
  if (batch.success && claimLedger?.success) {
    const candidateIds = new Set(batch.data.candidates.map((candidate) => candidate.candidateId));
    for (const claim of claimLedger.data.claims) {
      for (const target of claim.candidateTargets) {
        if (!candidateIds.has(target.candidateId)) claimLedgerReport?.errors.push(`Claim ${claim.claimId} targets unknown candidate ${target.candidateId}.`);
      }
    }
    for (const candidate of batch.data.candidates) {
      if (!claimLedger.data.subjects.some((subject) => subject.candidateIds.includes(candidate.candidateId))) {
        claimLedgerReport?.errors.push(`Candidate ${candidate.candidateId} has no dossier coverage subject.`);
      }
      for (const evidence of candidate.fieldEvidence.filter((item) => item.claimClass === "source_backed")) {
        const mapped = claimLedger.data.claims.some((claim) =>
          claim.source.sourceId === evidence.sourceId
          && claim.candidateTargets.some((target) => target.candidateId === candidate.candidateId && target.fieldPath === evidence.fieldPath)
        );
        if (!mapped) claimLedgerReport?.errors.push(`Candidate ${candidate.candidateId} evidence ${evidence.id} is not mapped through the claim ledger.`);
      }
    }
    if (run.success && requiresResearchQualityContract(run.data.agentVersion)) {
      claimLedgerReport?.errors.push(...researchClaimLedgerQualityIssues(claimLedger.data));
      for (const candidate of batch.data.candidates) candidateReport.errors.push(...researchCandidateQualityIssues(candidate));
    }
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

  console.log(formatValidation(reports, { detailedWarnings: true }));
  if (reports.some((report) => report.errors.length > 0)) {
    process.exitCode = 1;
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
  if (command === "prepare") return prepareRun(args);
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
  if (command === "smoke") return smoke(args);
  throw new Error(`Unknown autonomous research command '${command}'.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
