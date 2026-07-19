import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  formatZodIssues,
  demandIssuerTypeValues,
  organizationKindValues,
  researchCandidateBatchV2Schema,
  researchRunSchema,
  sourceLeadBatchV2Schema,
  type ResearchCandidateBatchV2,
  type ResearchRun,
  type SourceLeadBatchV2
} from "../src/lib/research/pipeline-schema";
import {
  atlasDemandRequirements,
  atlasMissionAreas,
  atlasOrganizations,
  atlasTechnicalDomains
} from "../src/lib/atlas/validated-data";
import { loadScriptEnv } from "./load-env";

loadScriptEnv();

const workspaceRoot = path.resolve(process.cwd(), "..");
const researchRoot = path.join(workspaceRoot, "research");
const ingestionRoot = path.join(researchRoot, "ingestion");
const runDir = path.join(ingestionRoot, "runs");
const briefDir = path.join(ingestionRoot, "briefs");
const sourceLeadDir = path.join(ingestionRoot, "source-leads-v2");
const candidateDir = path.join(ingestionRoot, "candidate-batches-v2");
const reviewDir = path.join(ingestionRoot, "reviews-v2");
const stagingDir = path.join(ingestionRoot, "staging");

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
  demandRequirements: Array<{ slug: string; sourceSlug: string; matchCount: number }>;
  issuerCounts: Record<string, number>;
  candidateStatuses: Record<string, string>;
}

interface ValidationReport {
  kind: "run" | "source_leads" | "candidate_batch";
  filePath: string;
  id: string;
  errors: string[];
  warnings: string[];
  counts: Record<string, number>;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

let researchCoveragePromise: Promise<ResearchCoverageSnapshot> | null = null;

function validatedSeedCoverage(): ResearchCoverageSnapshot {
  const issuerCounts = Object.fromEntries(demandIssuerTypeValues.map((issuerType) => [issuerType, 0])) as Record<string, number>;
  if (atlasDemandRequirements.length > 0) issuerCounts.alliance = 1;

  return {
    organizations: atlasOrganizations.map((organization) => ({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      websiteDomain: urlDomain(organization.websiteUrl),
      source: "validated atlas",
      entityKind: organization.entityKind,
      capabilityCount: organization.capabilities.length,
      missionAreaSlugs: organization.capabilities.flatMap((capability) => capability.missionMatches.map((match) => match.missionArea.slug)),
      technicalDomainSlugs: organization.capabilities.flatMap((capability) => capability.technicalDomains.map((domain) => domain.slug)),
      publishedAt: organization.lastReviewedAt
    })),
    demandRequirements: atlasDemandRequirements.map((requirement) => ({
      slug: requirement.slug,
      sourceSlug: requirement.source.slug,
      matchCount: requirement.matches.length
    })),
    issuerCounts,
    candidateStatuses: {}
  };
}

async function loadResearchCoverage(): Promise<ResearchCoverageSnapshot> {
  if (researchCoveragePromise) return researchCoveragePromise;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return validatedSeedCoverage();

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
      client.from("mission_areas").select("id, slug").eq("publication_status", "published"),
      client.from("capability_mission_matches").select("capability_id, mission_area_id").eq("publication_status", "published"),
      client.from("technical_domains").select("id, slug").eq("publication_status", "published"),
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
    const missionSlugById = new Map(((missionAreasResult.data ?? []) as Array<{ id: string; slug: string }>).map((mission) => [mission.id, mission.slug]));
    const domainSlugById = new Map(((technicalDomainsResult.data ?? []) as Array<{ id: string; slug: string }>).map((domain) => [domain.id, domain.slug]));
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

  for (const organization of (await loadResearchCoverage()).organizations) add(organization);

  const legacyDir = path.join(ingestionRoot, "candidate-batches");
  for (const filePath of await listJsonFiles(legacyDir)) {
    if (!filePath.endsWith(".atlas.json") || filePath === options.excludePath) continue;
    const batch = asRecord(await readJson<unknown>(filePath));
    const records = Array.isArray(batch.records) ? batch.records : [];
    for (const value of records) {
      const record = asRecord(value);
      const slug = asString(record.slug);
      const name = asString(record.name);
      if (!slug || !name) continue;
      add({
        id: `${path.basename(filePath)}:${slug}`,
        name,
        slug,
        websiteDomain: urlDomain(asString(record.websiteUrl)),
        source: relative(filePath)
      });
    }
  }

  for (const filePath of await listJsonFiles(candidateDir)) {
    if (filePath === options.excludePath) continue;
    const parsed = researchCandidateBatchV2Schema.safeParse(await readJson<unknown>(filePath));
    if (!parsed.success) continue;
    if (parsed.data.runId === options.excludeRunId) continue;
    for (const candidate of parsed.data.candidates) {
      if (candidate.candidateKind !== "organization_bundle") continue;
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
  const publishedMissionCounts = Object.fromEntries(atlasMissionAreas.map((mission) => [mission.slug, 0])) as Record<string, number>;
  const pendingMissionCounts = Object.fromEntries(atlasMissionAreas.map((mission) => [mission.slug, 0])) as Record<string, number>;
  const publishedDomainCounts = Object.fromEntries(atlasTechnicalDomains.map((domain) => [domain.slug, 0])) as Record<string, number>;
  const pendingDomainCounts = Object.fromEntries(atlasTechnicalDomains.map((domain) => [domain.slug, 0])) as Record<string, number>;
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
  const sourceBookRows = (await readFile(sourceBookPath, "utf8")).trim().split(/\r?\n/).length - 1;
  const missingKinds = organizationKindValues.filter((kind) => publishedKinds[kind] + pendingKinds[kind] === 0);
  const missingMissionAreas = atlasMissionAreas
    .filter((mission) => publishedMissionCounts[mission.slug] + pendingMissionCounts[mission.slug] === 0)
    .map((mission) => mission.slug);
  const missingTechnicalDomains = atlasTechnicalDomains
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
    unmatchedDemandRequirements
  };
}

function selectGap(coverage: Awaited<ReturnType<typeof buildCoverage>>, bootstrap: boolean) {
  if (bootstrap) {
    return {
      coverageView: "ecosystem_support" as const,
      dimension: "balanced-company-accelerator-incubator-investor-bootstrap",
      reason: "The first autonomous run must exercise company, accelerator, incubator, and investor or funder validation paths without expanding the frozen public corpus.",
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

  const lowestMission = [...atlasMissionAreas].sort((left, right) => {
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
    `- Published organizations in current atlas: ${coverage.publishedOrganizations}`,
    `- Published capabilities in current atlas: ${coverage.publishedCapabilities}`,
    `- Published demand requirements: ${coverage.publishedDemandRequirements}`,
    "",
    "| Organization kind | Published | Pending v2 |",
    "| --- | ---: | ---: |",
    ...organizationKindValues.map((kind) => `| ${kind} | ${coverage.publishedKinds[kind]} | ${coverage.pendingKinds[kind]} |`),
    "",
    `Missing kinds: ${coverage.missingKinds.join(", ") || "none"}`,
    "",
    "| Supply mission lane | Published matches | Pending matches |",
    "| --- | ---: | ---: |",
    ...atlasMissionAreas.map((mission) => `| ${mission.slug} | ${coverage.publishedMissionCounts[mission.slug]} | ${coverage.pendingMissionCounts[mission.slug]} |`),
    "",
    "| Technical domain | Published capabilities | Pending capabilities |",
    "| --- | ---: | ---: |",
    ...atlasTechnicalDomains.map((domain) => `| ${domain.slug} | ${coverage.publishedDomainCounts[domain.slug]} | ${coverage.pendingDomainCounts[domain.slug]} |`),
    "",
    "| Public-demand issuer type | Published sources | Pending sources |",
    "| --- | ---: | ---: |",
    ...demandIssuerTypeValues.map((issuerType) => `| ${issuerType} | ${coverage.publishedIssuerCounts[issuerType]} | ${coverage.pendingIssuerCounts[issuerType]} |`),
    "",
    `Unmatched public-demand requirements: ${coverage.unmatchedDemandRequirements.join(", ") || "none"}`,
    ""
  ];
  return lines.join("\n");
}

async function prepareRun(args: string[]) {
  const { options } = parseOptions(args);
  const bootstrap = options.get("mode") === "bootstrap";
  const date = new Date().toISOString().slice(0, 10);
  const runId = options.get("run-id") ?? `tnm-${bootstrap ? "bootstrap" : "weekly"}-${date}`;
  const runPath = path.join(runDir, `${runId}.json`);
  if (await fileExists(runPath)) throw new Error(`Run ${runId} already exists at ${relative(runPath)}.`);

  const coverage = await buildCoverage();
  const selectedGap = selectGap(coverage, bootstrap);
  const organizationKinds = bootstrap
    ? ["company", "accelerator", "incubator", "investor_funder"] as const
    : selectedGap.dimension.startsWith("organization-kind:")
      ? [selectedGap.dimension.split(":")[1] as (typeof organizationKindValues)[number]]
      : [];
  const demandIssuerTypes = selectedGap.dimension.startsWith("demand-issuer-type:")
    ? [selectedGap.dimension.split(":")[1] as (typeof demandIssuerTypeValues)[number]]
    : [];
  const startedAt = new Date().toISOString();
  const run: ResearchRun = {
    schemaVersion: "research_run_v1",
    runId,
    agentVersion: "tnm-research-pipeline/1.0.0",
    trigger: options.get("trigger") === "weekly" ? "weekly" : "manual",
    mode: bootstrap ? "bootstrap" : "gap_targeted",
    scope: {
      geography: "canada_first",
      organizationKinds: [...organizationKinds],
      missionAreaSlugs: atlasMissionAreas.map((mission) => mission.slug),
      technicalDomainSlugs: atlasTechnicalDomains.map((domain) => domain.slug),
      demandIssuerTypes
    },
    selectedGap,
    status: "running",
    startedAt,
    completedAt: null,
    limits: { totalMinutes: 90, sourceBookMinutes: 30, maxQualifiedLeads: 25, maxCandidates: 10 },
    sourceQueries: [],
    counters: { sourcesChecked: 0, leadsQualified: 0, leadsDeferred: 0, candidatesCreated: 0, duplicatesBlocked: 0 },
    validation: { passed: false, errors: [], warnings: [] },
    errors: [],
    stopReason: null,
    outputs: { sourceLeadBatch: null, candidateBatch: null, reviewPacket: null, stagingExport: null }
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
    "",
    "## Required sequence",
    "",
    "1. Expand the Source Book within the 30-minute sub-limit.",
    "2. Create typed source leads from durable public sources.",
    "3. Apply evidence and duplicate gates.",
    "4. Build typed candidates and defer ambiguous items.",
    "5. Run `pnpm research:smoke -- --run <run> --leads <leads> --candidates <candidates>`.",
    "6. Confirm candidates appear in Admin Review, then stop. Do not approve or publish.",
    "",
    formatCoverage(coverage)
  ].join("\n");

  await mkdir(runDir, { recursive: true });
  await mkdir(briefDir, { recursive: true });
  await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`, "utf8");
  await writeFile(path.join(briefDir, `${runId}.md`), `${brief}\n`, "utf8");
  console.log(`Created ${relative(runPath)}`);
  console.log(`Created ${relative(path.join(briefDir, `${runId}.md`))}`);
  console.log(`Selected gap: ${selectedGap.dimension}`);
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
  return {
    kind: "run",
    filePath,
    id: parsed.success ? parsed.data.runId : path.basename(filePath),
    errors: parsed.success ? [] : formatZodIssues(parsed.error),
    warnings: [],
    counts: parsed.success ? { queries: parsed.data.sourceQueries.length, candidates: parsed.data.counters.candidatesCreated } : {}
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
  const missionSlugs = new Set(atlasMissionAreas.map((mission) => mission.slug));
  const domainSlugs = new Set(atlasTechnicalDomains.map((domain) => domain.slug));
  const coverage = await loadResearchCoverage();
  const existing = await collectExistingIdentities({ excludeRunId: batch.runId });
  const publishedLeadIds = new Set<string>();
  for (const candidatePath of await listJsonFiles(candidateDir)) {
    const candidateBatch = researchCandidateBatchV2Schema.safeParse(await readJson<unknown>(candidatePath));
    if (!candidateBatch.success || candidateBatch.data.runId !== batch.runId) continue;
    for (const candidate of candidateBatch.data.candidates) {
      if (coverage.candidateStatuses[candidate.candidateId] === "published") {
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
  const missionSlugs = new Set(atlasMissionAreas.map((mission) => mission.slug));
  const domainSlugs = new Set(atlasTechnicalDomains.map((domain) => domain.slug));
  const coverage = await loadResearchCoverage();
  const existing = await collectExistingIdentities({ excludePath: filePath });
  addDuplicateValueErrors(batch.candidates.map((candidate) => candidate.candidateId), "Candidate id", errors);
  validateCandidateEvidence(batch, errors);

  for (const candidate of batch.candidates) {
    if (candidate.duplicateCheck.status !== "clear") errors.push(`Candidate ${candidate.candidateId} has unresolved duplicate status '${candidate.duplicateCheck.status}'.`);
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
      deferred: batch.deferred.length
    }
  };
}

function formatValidation(reports: ValidationReport[]) {
  const errors = reports.reduce((sum, report) => sum + report.errors.length, 0);
  const warnings = reports.reduce((sum, report) => sum + report.warnings.length, 0);
  const lines = ["Autonomous research validation", `Artifacts: ${reports.length}`, `Errors: ${errors}`, `Warnings: ${warnings}`];
  for (const report of reports) {
    lines.push("", `${report.kind}: ${report.id}`, `File: ${relative(report.filePath)}`);
    for (const [label, count] of Object.entries(report.counts)) lines.push(`${label}: ${count}`);
    report.errors.forEach((error) => lines.push(`ERROR: ${error}`));
    report.warnings.forEach((warning) => lines.push(`WARN: ${warning}`));
  }
  return lines.join("\n");
}

async function validateArtifacts(args: string[]) {
  const { positional } = parseOptions(args);
  const files = positional.length
    ? positional.map((filePath) => path.resolve(workspaceRoot, filePath))
    : [
        ...(await listJsonFiles(runDir)),
        ...(await listJsonFiles(sourceLeadDir)),
        ...(await listJsonFiles(candidateDir))
      ];
  const reports: ValidationReport[] = [];
  for (const filePath of files) {
    const value = asRecord(await readJson<unknown>(filePath));
    if (value.schemaVersion === "research_run_v1") reports.push(await validateRunFile(filePath));
    else if (value.schemaVersion === "source_lead_batch_v2") reports.push(await validateSourceLeadFile(filePath));
    else if (value.schemaVersion === "research_candidate_batch_v2") reports.push(await validateCandidateFile(filePath));
    else reports.push({ kind: "candidate_batch", filePath, id: path.basename(filePath), errors: ["Unknown research artifact schemaVersion."], warnings: [], counts: {} });
  }
  console.log(formatValidation(reports));
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
    "- [ ] Edit, merge, defer, reject, or accept with substantive rationale.",
    "- [ ] Use a separate explicit publication action after acceptance.",
    "",
    "## Candidates",
    ""
  ];

  for (const candidate of batch.candidates) {
    lines.push(`### ${candidate.candidateId}`, "", `- Kind: \`${candidate.candidateKind}\``, `- Confidence: \`${candidate.confidence}\``, `- Duplicate status: \`${candidate.duplicateCheck.status}\``);
    if (candidate.candidateKind === "organization_bundle") {
      lines.push(`- Organization: **${candidate.organization.name}**`, `- Organization type: \`${candidate.organization.entityKind}\``, `- Categories: ${candidate.organization.categories.map((category) => `\`${category}\``).join(", ")}`, `- Capabilities: ${candidate.capabilities.map((capability) => capability.name).join(", ") || "none"}`, `- Programs: ${candidate.programs.map((program) => program.name).join(", ") || "none"}`);
    } else if (candidate.candidateKind === "demand_signal_bundle") {
      lines.push(`- Demand source: **${candidate.demandSource.title}**`, `- Issuers: ${candidate.issuers.map((issuer) => issuer.name).join(", ")}`, `- Requirements: ${candidate.requirements.length}`);
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
  const exportValue = {
    schemaVersion: "research_staging_export_v1",
    generatedAt: new Date().toISOString(),
    writePolicy: "private_candidate_changes_only",
    publicationAllowed: false,
    researchRun: {
      client_run_id: run.runId,
      run_type: run.trigger === "weekly" ? "weekly_gap" : "manual",
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
          : "program";
      return {
        client_candidate_id: candidate.candidateId,
        research_run_ref: run.runId,
        candidate_kind: candidate.candidateKind,
        schema_version: candidate.schemaVersion,
        source_lead_ids: candidate.sourceLeadIds,
        target_entity_type: targetEntityType,
        target_entity_id: null,
        proposed_record: candidate,
        before_record: null,
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
  const leadPath = path.resolve(workspaceRoot, options.get("leads") ?? "");
  const candidatePath = path.resolve(workspaceRoot, options.get("candidates") ?? "");
  if (![runPath, leadPath, candidatePath].every((filePath) => filePath && filePath !== workspaceRoot)) {
    throw new Error("Smoke test requires --run, --leads, and --candidates paths.");
  }

  const reports = [await validateRunFile(runPath), await validateSourceLeadFile(leadPath), await validateCandidateFile(candidatePath)];
  const run = researchRunSchema.safeParse(await readJson<unknown>(runPath));
  const batch = researchCandidateBatchV2Schema.safeParse(await readJson<unknown>(candidatePath));
  if (run.success && run.data.status !== "completed") reports[0].errors.push("Smoke-test run must have status completed.");
  if (batch.success && batch.data.candidates.length < 1) reports[2].errors.push("Smoke test must create at least one review-ready candidate.");
  if (run.success && batch.success && run.data.counters.candidatesCreated !== batch.data.candidates.length) reports[0].errors.push("Run candidate counter does not match candidate batch size.");
  if (run.success && run.data.mode === "bootstrap" && batch.success) {
    const kinds = new Set(batch.data.candidates.filter((candidate) => candidate.candidateKind === "organization_bundle").map((candidate) => candidate.organization.entityKind));
    for (const kind of ["company", "accelerator", "incubator", "investor_funder"]) {
      if (!kinds.has(kind as never)) reports[2].errors.push(`Bootstrap smoke test is missing ${kind}.`);
    }
  }

  console.log(formatValidation(reports));
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
