import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  buildOrganizationCoverageReport,
  publicContactPresence,
  type OrganizationCoverageInput,
  type OrganizationCoverageTraffic
} from "../src/lib/research/organization-coverage-report";
import type { AtlasEntityKind, AtlasFreshness } from "../src/types/atlas";
import { loadScriptEnv } from "./load-env";

loadScriptEnv();

type Row = Record<string, unknown>;
type QueryResult = { data: unknown; error: { message?: string } | null };

const pageSize = 1000;
const organizationBaseColumns = "id, slug, name, entity_kind, profile_data, freshness_status, last_reviewed_at, current_activity, current_activity_as_of, operating_context, canadian_footprint";
const organizationExtendedColumns = `${organizationBaseColumns}, executive_relevance_summary`;
const entityKinds = new Set<AtlasEntityKind>([
  "company",
  "accelerator",
  "incubator",
  "research_test_centre",
  "investor_funder",
  "ecosystem_organization",
  "government_innovation_office"
]);
const excludedCohorts = new Set(["qa", "staff", "test", "internal", "tnm-qa", "tnm-staff", "tnm-test", "automation-test"]);

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for the read-only organization coverage report.`);
  return value;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function nullableString(value: unknown) {
  const normalized = stringValue(value).trim();
  return normalized || null;
}

function objectValue(value: unknown): Row {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Row : {};
}

function entityKind(value: unknown): AtlasEntityKind {
  return entityKinds.has(value as AtlasEntityKind) ? value as AtlasEntityKind : "ecosystem_organization";
}

function freshnessStatus(value: unknown): AtlasFreshness {
  return value === "review_due" || value === "stale" ? value : "current";
}

function positiveInteger(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

async function readAll<T extends Row>(load: (from: number, to: number) => PromiseLike<QueryResult>, label: string) {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const result = await load(from, from + pageSize - 1);
    if (result.error) throw new Error(`${label}: ${result.error.message ?? "query failed"}`);
    const page = Array.isArray(result.data) ? result.data as T[] : [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

async function readOrganizations(client: SupabaseClient) {
  try {
    const rows = await readAll<Row>(
      (from, to) => client.from("organizations").select(organizationExtendedColumns).eq("publication_status", "published").order("id").range(from, to),
      "published organizations"
    );
    return { rows, executiveRelevanceFieldAvailable: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("executive_relevance_summary")) throw error;
    const rows = await readAll<Row>(
      (from, to) => client.from("organizations").select(organizationBaseColumns).eq("publication_status", "published").order("id").range(from, to),
      "published organizations without executive relevance field"
    );
    return { rows, executiveRelevanceFieldAvailable: false };
  }
}

function increment(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function registerOwner(owners: Map<string, Set<string>>, entityType: string, entityId: unknown, organizationId: unknown) {
  const id = stringValue(entityId);
  const ownerId = stringValue(organizationId);
  if (!id || !ownerId) return;
  const key = `${entityType}:${id}`;
  const values = owners.get(key) ?? new Set<string>();
  values.add(ownerId);
  owners.set(key, values);
}

type TrafficFileRow = {
  organizationId?: unknown;
  slug?: unknown;
  searchImpressions?: unknown;
  searchClicks?: unknown;
};

async function trafficFromFile(filePath: string | null, organizations: Array<{ id: string; slug: string }>) {
  const traffic = new Map<string, OrganizationCoverageTraffic>();
  if (!filePath) return traffic;
  const parsed: unknown = JSON.parse(await readFile(path.resolve(filePath), "utf8"));
  if (!Array.isArray(parsed)) throw new Error("--traffic-file must contain a JSON array of organization IDs or slugs and aggregate counts.");
  const idBySlug = new Map(organizations.map((organization) => [organization.slug, organization.id]));
  const knownIds = new Set(organizations.map((organization) => organization.id));
  for (const value of parsed as TrafficFileRow[]) {
    if (!value || typeof value !== "object") continue;
    const requestedId = stringValue(value.organizationId);
    const organizationId = knownIds.has(requestedId) ? requestedId : idBySlug.get(stringValue(value.slug));
    if (!organizationId) continue;
    traffic.set(organizationId, {
      searchImpressions: positiveInteger(value.searchImpressions),
      searchClicks: positiveInteger(value.searchClicks)
    });
  }
  return traffic;
}

function isQaOrStaffEvent(event: Row) {
  const cohort = stringValue(event.cohort).trim().toLowerCase();
  const metadata = objectValue(event.metadata);
  return stringValue(event.context_path).startsWith("/dev/")
    || excludedCohorts.has(cohort)
    || metadata.traffic_class === "qa"
    || metadata.utm_source === "qa";
}

async function attributableEngagement(
  client: SupabaseClient | null,
  organizations: Array<{ id: string; slug: string }>,
  traffic: Map<string, OrganizationCoverageTraffic>
) {
  if (!client) return false;
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const events = await readAll<Row>(
    (from, to) => client.from("pilot_events")
      .select("event_name, context_path, cohort, metadata, created_at")
      .in("event_name", ["dossier_open", "profile_engagement"])
      .gte("created_at", since)
      .order("id")
      .range(from, to),
    "attributable profile engagement"
  );
  const knownIds = new Set(organizations.map((organization) => organization.id));
  const idBySlug = new Map(organizations.map((organization) => [organization.slug, organization.id]));
  for (const event of events) {
    if (isQaOrStaffEvent(event)) continue;
    const metadata = objectValue(event.metadata);
    let organizationId = stringValue(metadata.organization_id);
    if (!knownIds.has(organizationId) && event.event_name === "dossier_open") {
      const match = /^\/organizations\/([^/?#]+)/.exec(stringValue(event.context_path));
      organizationId = match ? idBySlug.get(match[1]) ?? "" : "";
    }
    if (!knownIds.has(organizationId)) continue;
    const prior = traffic.get(organizationId) ?? {};
    if (event.event_name === "profile_engagement") {
      prior.profileEngagements = (prior.profileEngagements ?? 0) + 1;
    } else if (event.event_name === "dossier_open") {
      prior.dossierOpens = (prior.dossierOpens ?? 0) + 1;
    }
    traffic.set(organizationId, prior);
  }
  return true;
}

function cliValue(args: string[], name: string) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value.`);
  return value;
}

function numericCliValue(args: string[], name: string, fallback: number) {
  const raw = cliValue(args, name);
  if (raw === null) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${name} must be a positive integer.`);
  return parsed;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    process.stdout.write([
      "Read-only organization dossier coverage report",
      "",
      "Usage: pnpm research:dossier-coverage [--output report.json] [--wave-size 50] [--limit 100]",
      "       [--traffic-file aggregate-traffic.json] [--include-engagement]",
      "",
      "The core report uses the public anon projection. Engagement is opt-in, aggregate-only,",
      "limited to attributable organization events from the last 30 days, and requires the local service key."
    ].join("\n") + "\n");
    return;
  }

  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
    ?? requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const publicClient = createClient(supabaseUrl, publicKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const includeEngagement = args.includes("--include-engagement");
  const engagementClient = includeEngagement
    ? createClient(supabaseUrl, requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), { auth: { autoRefreshToken: false, persistSession: false } })
    : null;
  const waveSize = numericCliValue(args, "--wave-size", 50);
  const outputPath = cliValue(args, "--output");
  const trafficPath = cliValue(args, "--traffic-file");
  const limit = args.includes("--limit") ? numericCliValue(args, "--limit", 0) : null;

  const organizationsResult = await readOrganizations(publicClient);
  const [capabilities, missionMatches, demandMatches, participations, fundingEvents, relationships, mediaAssets, citations] = await Promise.all([
    readAll<Row>((from, to) => publicClient.from("capabilities").select("id, organization_id").eq("publication_status", "published").order("id").range(from, to), "published capabilities"),
    readAll<Row>((from, to) => publicClient.from("capability_mission_matches").select("id, capability_id").eq("review_status", "approved").eq("publication_status", "published").order("id").range(from, to), "published Mission Area matches"),
    readAll<Row>((from, to) => publicClient.from("capability_demand_matches").select("id, capability_id").eq("review_status", "approved").eq("publication_status", "published").order("id").range(from, to), "published Public Need matches"),
    readAll<Row>((from, to) => publicClient.from("program_participations").select("id, organization_id, program_id").eq("publication_status", "published").order("id").range(from, to), "published program participations"),
    readAll<Row>((from, to) => publicClient.from("funding_events").select("id, organization_id").eq("publication_status", "published").order("id").range(from, to), "published funding events"),
    readAll<Row>((from, to) => publicClient.from("organization_relationships").select("id, organization_id").eq("publication_status", "published").order("id").range(from, to), "published organization relationships"),
    readAll<Row>((from, to) => publicClient.from("media_assets").select("id, organization_id, capability_id, asset_type").eq("approval_status", "approved").eq("publication_status", "published").order("id").range(from, to), "approved public media"),
    readAll<Row>((from, to) => publicClient.from("field_citations").select("id, entity_type, entity_id, evidence_snippets!inner(id, visibility, public_approved, sources!inner(id, visibility, public_approved))").eq("evidence_snippets.visibility", "public").eq("evidence_snippets.public_approved", true).eq("evidence_snippets.sources.visibility", "public").eq("evidence_snippets.sources.public_approved", true).order("id").range(from, to), "approved public field citations")
  ]);

  const owners = new Map<string, Set<string>>();
  const capabilityOwners = new Map<string, string>();
  const capabilityCounts = new Map<string, number>();
  const missionCounts = new Map<string, number>();
  const demandCounts = new Map<string, number>();
  const programCounts = new Map<string, number>();
  const relationshipCounts = new Map<string, number>();
  const fundingCounts = new Map<string, number>();
  const logoOwners = new Set<string>();
  for (const organization of organizationsResult.rows) registerOwner(owners, "organization", organization.id, organization.id);
  for (const capability of capabilities) {
    const organizationId = stringValue(capability.organization_id);
    capabilityOwners.set(stringValue(capability.id), organizationId);
    increment(capabilityCounts, organizationId);
    registerOwner(owners, "capability", capability.id, organizationId);
  }
  for (const match of missionMatches) {
    const organizationId = capabilityOwners.get(stringValue(match.capability_id)) ?? "";
    increment(missionCounts, organizationId);
    registerOwner(owners, "capability_mission_match", match.id, organizationId);
  }
  for (const match of demandMatches) {
    const organizationId = capabilityOwners.get(stringValue(match.capability_id)) ?? "";
    increment(demandCounts, organizationId);
    registerOwner(owners, "capability_demand_match", match.id, organizationId);
  }
  for (const participation of participations) {
    const organizationId = stringValue(participation.organization_id);
    increment(programCounts, organizationId);
    registerOwner(owners, "program_participation", participation.id, organizationId);
    registerOwner(owners, "program", participation.program_id, organizationId);
  }
  for (const event of fundingEvents) {
    const organizationId = stringValue(event.organization_id);
    increment(fundingCounts, organizationId);
    registerOwner(owners, "funding_event", event.id, organizationId);
  }
  for (const relationship of relationships) {
    const organizationId = stringValue(relationship.organization_id);
    increment(relationshipCounts, organizationId);
    registerOwner(owners, "organization_relationship", relationship.id, organizationId);
  }
  for (const media of mediaAssets) {
    const organizationId = stringValue(media.organization_id)
      || capabilityOwners.get(stringValue(media.capability_id))
      || "";
    registerOwner(owners, "media_asset", media.id, organizationId);
    if (media.asset_type === "logo" && organizationId) logoOwners.add(organizationId);
  }
  const citationCounts = new Map<string, number>();
  for (const citation of citations) {
    const key = `${stringValue(citation.entity_type)}:${stringValue(citation.entity_id)}`;
    for (const organizationId of owners.get(key) ?? []) increment(citationCounts, organizationId);
  }

  const identity = organizationsResult.rows.map((organization) => ({ id: stringValue(organization.id), slug: stringValue(organization.slug) }));
  const traffic = await trafficFromFile(trafficPath, identity);
  const engagementIncluded = await attributableEngagement(engagementClient, identity, traffic);
  const records: OrganizationCoverageInput[] = organizationsResult.rows.map((organization) => {
    const id = stringValue(organization.id);
    return {
      id,
      slug: stringValue(organization.slug),
      name: stringValue(organization.name),
      entityKind: entityKind(organization.entity_kind),
      freshnessStatus: freshnessStatus(organization.freshness_status),
      lastReviewedAt: nullableString(organization.last_reviewed_at),
      hasExecutiveRelevanceSummary: Boolean(nullableString(organization.executive_relevance_summary)),
      hasOperatingContext: Boolean(nullableString(organization.operating_context)),
      hasCanadianFootprint: Boolean(nullableString(organization.canadian_footprint)),
      hasCurrentActivity: Boolean(nullableString(organization.current_activity) && nullableString(organization.current_activity_as_of)),
      capabilityCount: capabilityCounts.get(id) ?? 0,
      missionMatchCount: missionCounts.get(id) ?? 0,
      demandMatchCount: demandCounts.get(id) ?? 0,
      programCount: programCounts.get(id) ?? 0,
      relationshipCount: relationshipCounts.get(id) ?? 0,
      fundingEventCount: fundingCounts.get(id) ?? 0,
      publicCitationCount: citationCounts.get(id) ?? 0,
      hasPublicContact: publicContactPresence(organization.profile_data),
      hasPublishedLogo: logoOwners.has(id),
      traffic: traffic.get(id)
    };
  });
  const report = buildOrganizationCoverageReport({
    records,
    generatedAt: new Date().toISOString(),
    waveSize,
    executiveRelevanceFieldAvailable: organizationsResult.executiveRelevanceFieldAvailable,
    searchTrafficIncluded: Boolean(trafficPath),
    attributableEngagementIncluded: engagementIncluded
  });
  const output = limit === null ? report : { ...report, rankedOrganizations: report.rankedOrganizations.slice(0, limit) };
  const serialized = `${JSON.stringify(output, null, 2)}\n`;
  if (outputPath) {
    const resolved = path.resolve(outputPath);
    await mkdir(path.dirname(resolved), { recursive: true });
    await writeFile(resolved, serialized, "utf8");
    process.stdout.write(`Organization coverage report written to ${resolved}\n`);
  } else {
    process.stdout.write(serialized);
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
