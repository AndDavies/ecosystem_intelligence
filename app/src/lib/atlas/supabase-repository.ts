import { boundedMap } from "../research/bounded-map";
import { collectPagedRows } from "../supabase/pagination";
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import { organizationLogoUrl, selectPublishedOrganizationLogo } from "@/lib/atlas/organization-logos";
import { publicProfileData } from "@/lib/atlas/public-profile-data";
import type {
  AtlasCapability,
  AtlasCitation,
  AtlasCluster,
  AtlasConfidence,
  AtlasCoverageSummary,
  AtlasDemandIndexSnapshot,
  AtlasDemandMatch,
  AtlasDemandRequirement,
  AtlasDemandSource,
  AtlasDossierMediaAsset,
  AtlasDiscoverySnapshot,
  AtlasEntityKind,
  AtlasLocation,
  AtlasMissionArea,
  AtlasMissionMatch,
  AtlasMissionRecordConnection,
  AtlasOrganization,
  AtlasOrganizationEditorialProfile,
  AtlasOrganizationRelationship,
  AtlasProgramExternalIdentifier,
  AtlasProgramLifecycleStage,
  AtlasProgramParticipation,
  AtlasSnapshot,
  AtlasTechnicalDomain
} from "@/types/atlas";

type Row = Record<string, unknown>;

const atlasColumns = {
  organizations: "id, slug, name, legal_name, description, website_url, entity_kind, organization_categories, source_confidence, freshness_status, last_reviewed_at, founded_year, employee_range, company_stage, ownership, commercial_status, disclosed_financing_summary, defence_posture, dual_use_posture, profile_data",
  locations: "id, name, city, province_territory, country_code, latitude, longitude, geographic_confidence",
  organizationLocations: "organization_id, location_id, is_primary",
  capabilities: "id, organization_id, slug, name, summary, capability_type, core_features, technology_readiness_level, maturity, commercial_availability, defence_applications, novelty, technical_tags, source_confidence, last_reviewed_at",
  technicalDomains: "id, slug, name, summary",
  capabilityDomains: "capability_id, technical_domain_id",
  missionAreas: "id, slug, name, summary, source_confidence",
  missionMatches: "id, capability_id, mission_area_id, alignment_summary, match_type, confidence",
  clusters: "id, slug, name, summary, region_slug, cluster_basis",
  capabilityClusters: "ecosystem_cluster_id, capability_id",
  demandSources: "id, source_id, slug, title, publisher, published_on, classification_label, summary, source_kind, commitment_level, source_evidence_snippet_id, source_verified_at, source_verified_by",
  demandRequirements: "id, demand_source_id, slug, title, problem_statement, desired_end_state, public_caveat, display_order",
  demandMatches: "id, capability_id, demand_requirement_id, alignment_summary, match_type, confidence",
  programs: "id, slug, name, program_type",
  participations: "id, organization_id, program_id, participation_type, cohort_label",
  fundingEvents: "id, organization_id, event_type, announced_on, amount_value, amount_currency, disclosed_summary",
  mediaAssets: "id, organization_id, asset_type, storage_path, source_url, source_visibility, attribution_text, approval_status, publication_status, created_at",
  sources: "id, title, canonical_url, publisher, source_type, published_at",
  evidence: "id, source_id, excerpt, source_locator",
  citations: "id, entity_type, entity_id, field_name, evidence_snippet_id"
} as const;

const atlasDiscoveryColumns = {
  organizations: "id, slug, name, description, entity_kind, organization_categories, source_confidence, freshness_status, last_reviewed_at, company_stage",
  locations: atlasColumns.locations,
  organizationLocations: atlasColumns.organizationLocations,
  capabilities: "id, organization_id, slug, name, summary, capability_type, core_features, defence_applications, technical_tags, source_confidence, last_reviewed_at",
  technicalDomains: atlasColumns.technicalDomains,
  capabilityDomains: atlasColumns.capabilityDomains,
  missionAreas: atlasColumns.missionAreas,
  missionMatches: atlasColumns.missionMatches,
  clusters: atlasColumns.clusters,
  capabilityClusters: atlasColumns.capabilityClusters,
  demandSources: "id, source_verified_at, source_verified_by",
  demandRequirements: "id, demand_source_id, slug, title",
  demandMatches: atlasColumns.demandMatches,
  programs: atlasColumns.programs,
  participations: atlasColumns.participations
} as const;

const atlasDossierNestedColumns = [
  "locations",
  "capabilities",
  "capability_domains",
  "mission_matches",
  "demand_matches",
  "programs",
  "funding_events",
  "relationships",
  "media_assets"
].join(", ");

const atlasDossierColumnsWithoutExecutiveRelevance = `${atlasColumns.organizations}, editorial_profile_version, current_activity, current_activity_as_of, operating_context, canadian_footprint, reviewed_questions, ${atlasDossierNestedColumns}`;
const atlasDossierColumns = `${atlasColumns.organizations}, editorial_profile_version, current_activity, current_activity_as_of, operating_context, canadian_footprint, executive_relevance_summary, reviewed_questions, ${atlasDossierNestedColumns}`;

export type AtlasSnapshotScope = {
  organizationIds?: string[];
  capabilityIds?: string[];
  demandRequirementIds?: string[];
  includeOrganizationLogos?: boolean;
};

function asRows(value: unknown): Row[] {
  return Array.isArray(value) ? (value as Row[]) : [];
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown) {
  return typeof value === "string" && value.length ? value : null;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function asObject(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asObjectArray(value: unknown): Row[] {
  return Array.isArray(value)
    ? value.filter((item): item is Row => item !== null && typeof item === "object" && !Array.isArray(item))
    : [];
}

function emptyEditorialProfile(): AtlasOrganizationEditorialProfile {
  return {
    version: null,
    currentActivity: null,
    currentActivityAsOf: null,
    operatingContext: null,
    canadianFootprint: null,
    executiveRelevanceSummary: null,
    reviewedQuestions: []
  };
}

function asEditorialProfile(row: Row): AtlasOrganizationEditorialProfile {
  const reviewedQuestions = asObjectArray(row.reviewed_questions)
    .map((question) => {
      const confidence = asString(question.confidence);
      if (
        !asString(question.id)
        || !asString(question.question)
        || !asString(question.context)
        || (confidence !== "high" && confidence !== "moderate")
      ) return null;
      return {
        id: asString(question.id),
        question: asString(question.question),
        context: asString(question.context),
        confidence: confidence as "high" | "moderate"
      };
    })
    .filter((question): question is NonNullable<typeof question> => Boolean(question));
  return {
    version: row.editorial_profile_version === "organization_editorial_profile_v1"
      ? "organization_editorial_profile_v1"
      : null,
    currentActivity: asNullableString(row.current_activity),
    currentActivityAsOf: asNullableString(row.current_activity_as_of),
    operatingContext: asNullableString(row.operating_context),
    canadianFootprint: asNullableString(row.canadian_footprint),
    executiveRelevanceSummary: asNullableString(row.executive_relevance_summary),
    reviewedQuestions
  };
}

function asProgramLifecycleStage(value: unknown): AtlasProgramLifecycleStage | null {
  const stage = asString(value);
  return [
    "announced", "selected", "funded", "awarded", "contracted", "testing",
    "evaluating", "delivering", "operational", "completed", "cancelled"
  ].includes(stage) ? stage as AtlasProgramLifecycleStage : null;
}

function asProgramExternalIdentifiers(value: unknown): AtlasProgramExternalIdentifier[] {
  return asObjectArray(value).flatMap((identifier) => {
    const kind = asString(identifier.kind);
    const identifierValue = asString(identifier.value);
    if (
      !identifierValue
      || !["contract", "notice", "challenge", "project", "award", "other"].includes(kind)
    ) return [];
    return [{ kind: kind as AtlasProgramExternalIdentifier["kind"], value: identifierValue }];
  });
}

function mapProgramParticipation(
  participation: Row,
  program: Row,
  citations: AtlasCitation[] = [],
  programCitations: AtlasCitation[] = []
): AtlasProgramParticipation {
  return {
    id: asString(participation.id),
    programSlug: asString(program.slug),
    programName: asString(program.name),
    programType: asString(program.program_type),
    programSummary: asNullableString(program.summary),
    programOperatorName: asNullableString(program.operator_name),
    programUrl: asNullableString(program.website_url),
    participationType: asString(participation.participation_type),
    cohortLabel: asNullableString(participation.cohort_label),
    publicSummary: asNullableString(participation.public_summary),
    lifecycleStage: asProgramLifecycleStage(participation.lifecycle_stage),
    announcedOn: asNullableString(participation.announced_on),
    startedOn: asNullableString(participation.started_on),
    endedOn: asNullableString(participation.ended_on),
    externalIdentifiers: asProgramExternalIdentifiers(participation.external_identifiers),
    citations,
    programCitations
  };
}

function asEntityKind(value: unknown): AtlasEntityKind {
  const kind = asString(value);
  if (
    kind === "company" ||
    kind === "accelerator" ||
    kind === "incubator" ||
    kind === "research_test_centre" ||
    kind === "investor_funder" ||
    kind === "ecosystem_organization" ||
    kind === "government_innovation_office"
  ) {
    return kind;
  }
  return "company";
}

function asConfidence(value: unknown): AtlasConfidence {
  return value === "high" || value === "moderate" ? value : "needs_review";
}

function regionSlugForProvince(value: string | null) {
  if (["Newfoundland and Labrador", "Nova Scotia", "New Brunswick", "Prince Edward Island"].includes(value ?? "")) {
    return "atlantic-canada";
  }
  if (value === "Quebec") return "quebec";
  if (value === "Ontario") return "ontario";
  if (["Manitoba", "Saskatchewan", "Alberta"].includes(value ?? "")) return "prairies";
  if (value === "British Columbia") return "british-columbia";
  if (["Yukon", "Northwest Territories", "Nunavut"].includes(value ?? "")) return "north";
  return "canada";
}

function byId(rows: Row[]) {
  return new Map(rows.map((row) => [asString(row.id), row]));
}

function groupBy(rows: Row[], key: string) {
  const groups = new Map<string, Row[]>();
  rows.forEach((row) => {
    const value = asString(row[key]);
    const current = groups.get(value) ?? [];
    current.push(row);
    groups.set(value, current);
  });
  return groups;
}

function assertQuery(result: { error: { message?: string } | null }, label: string) {
  if (result.error) {
    throw new Error(`Failed to load ${label}: ${result.error.message ?? "unknown database error"}`);
  }
}

type PublicPageResult = { data: unknown; error: { message?: string } | null };
const publicDiscoveryPageSize = 1_000;

export type AtlasDiscoveryTable =
  | "organizations"
  | "locations"
  | "organization_locations"
  | "capabilities"
  | "technical_domains"
  | "capability_domains"
  | "mission_areas"
  | "capability_mission_matches"
  | "ecosystem_clusters"
  | "capability_clusters"
  | "demand_sources"
  | "demand_requirements"
  | "capability_demand_matches"
  | "programs"
  | "program_participations";

export type AtlasDiscoveryPageLoader = (
  table: AtlasDiscoveryTable,
  from: number,
  to: number
) => PromiseLike<PublicPageResult>;

export function loadAtlasDiscoveryTablePageFromSupabase(
  table: AtlasDiscoveryTable,
  from: number,
  to: number
): PromiseLike<PublicPageResult> {
  const supabase = createPublicClient();
  switch (table) {
    case "organizations":
      return supabase.from("organizations").select(atlasDiscoveryColumns.organizations).eq("publication_status", "published").order("id").range(from, to);
    case "locations":
      return supabase.from("locations").select(atlasDiscoveryColumns.locations).order("id").range(from, to);
    case "organization_locations":
      return supabase.from("organization_locations").select(atlasDiscoveryColumns.organizationLocations).eq("publication_status", "published").order("organization_id").order("location_id").range(from, to);
    case "capabilities":
      return supabase.from("capabilities").select(atlasDiscoveryColumns.capabilities).eq("publication_status", "published").order("id").range(from, to);
    case "technical_domains":
      return supabase.from("technical_domains").select(atlasDiscoveryColumns.technicalDomains).eq("publication_status", "published").order("id").range(from, to);
    case "capability_domains":
      return supabase.from("capability_domains").select(atlasDiscoveryColumns.capabilityDomains).eq("publication_status", "published").order("capability_id").order("technical_domain_id").range(from, to);
    case "mission_areas":
      return supabase.from("mission_areas").select(atlasDiscoveryColumns.missionAreas).eq("publication_status", "published").order("id").range(from, to);
    case "capability_mission_matches":
      return supabase.from("capability_mission_matches").select(atlasDiscoveryColumns.missionMatches).eq("review_status", "approved").eq("publication_status", "published").order("id").range(from, to);
    case "ecosystem_clusters":
      return supabase.from("ecosystem_clusters").select(atlasDiscoveryColumns.clusters).eq("publication_status", "published").order("id").range(from, to);
    case "capability_clusters":
      return supabase.from("capability_clusters").select(atlasDiscoveryColumns.capabilityClusters).eq("publication_status", "published").order("ecosystem_cluster_id").order("capability_id").range(from, to);
    case "demand_sources":
      return supabase.from("demand_sources").select(atlasDiscoveryColumns.demandSources).eq("publication_status", "published").order("id").range(from, to);
    case "demand_requirements":
      return supabase.from("demand_requirements").select(atlasDiscoveryColumns.demandRequirements).eq("publication_status", "published").order("id").range(from, to);
    case "capability_demand_matches":
      return supabase.from("capability_demand_matches").select(atlasDiscoveryColumns.demandMatches).eq("review_status", "approved").eq("publication_status", "published").order("id").range(from, to);
    case "programs":
      return supabase.from("programs").select(atlasDiscoveryColumns.programs).eq("publication_status", "published").order("id").range(from, to);
    case "program_participations":
      return supabase.from("program_participations").select(atlasDiscoveryColumns.participations).eq("publication_status", "published").order("id").range(from, to);
  }
}

export async function collectPagedPublicRows(
  loadPage: (from: number, to: number) => PromiseLike<PublicPageResult>,
  label: string,
  pageSize = publicDiscoveryPageSize
): Promise<{ data: Row[]; error: null }> {
  const data = await collectPagedRows(async (from,to) => {
    const result=await loadPage(from,to);
    return {data:asRows(result.data),error:result.error};
  },label,pageSize);
  return {data,error:null};
}

/**
 * Load only the fields needed to search, filter, cluster, and render the
 * national map. Detailed evidence remains on the bounded organization,
 * capability, and demand loaders.
 */
export async function loadAtlasDiscoverySnapshotFromSupabase(
  loadPage: AtlasDiscoveryPageLoader = loadAtlasDiscoveryTablePageFromSupabase
): Promise<Omit<AtlasDiscoverySnapshot, "regions">> {
  const [
    organizationsResult,
    locationsResult,
    organizationLocationsResult,
    capabilitiesResult,
    technicalDomainsResult,
    capabilityDomainsResult,
    missionAreasResult,
    missionMatchesResult,
    clustersResult,
    capabilityClustersResult,
    demandSourcesResult,
    demandRequirementsResult,
    demandMatchesResult,
    programsResult,
    participationsResult
  ] = await Promise.all([
    collectPagedPublicRows(
      (from, to) => loadPage("organizations", from, to),
      "published discovery organizations"
    ),
    collectPagedPublicRows(
      (from, to) => loadPage("locations", from, to),
      "discovery locations"
    ),
    collectPagedPublicRows(
      (from, to) => loadPage("organization_locations", from, to),
      "discovery organization locations"
    ),
    collectPagedPublicRows(
      (from, to) => loadPage("capabilities", from, to),
      "published discovery capabilities"
    ),
    collectPagedPublicRows(
      (from, to) => loadPage("technical_domains", from, to),
      "discovery technical domains"
    ),
    collectPagedPublicRows(
      (from, to) => loadPage("capability_domains", from, to),
      "discovery capability domains"
    ),
    collectPagedPublicRows(
      (from, to) => loadPage("mission_areas", from, to),
      "discovery mission areas"
    ),
    collectPagedPublicRows(
      (from, to) => loadPage("capability_mission_matches", from, to),
      "discovery mission matches"
    ),
    collectPagedPublicRows(
      (from, to) => loadPage("ecosystem_clusters", from, to),
      "discovery clusters"
    ),
    collectPagedPublicRows(
      (from, to) => loadPage("capability_clusters", from, to),
      "discovery capability cluster links"
    ),
    collectPagedPublicRows(
      (from, to) => loadPage("demand_sources", from, to),
      "verified discovery demand sources"
    ),
    collectPagedPublicRows(
      (from, to) => loadPage("demand_requirements", from, to),
      "discovery demand requirements"
    ),
    collectPagedPublicRows(
      (from, to) => loadPage("capability_demand_matches", from, to),
      "discovery demand matches"
    ),
    collectPagedPublicRows(
      (from, to) => loadPage("programs", from, to),
      "discovery programs"
    ),
    collectPagedPublicRows(
      (from, to) => loadPage("program_participations", from, to),
      "discovery program participation"
    )
  ]);

  [
    [organizationsResult, "published discovery organizations"],
    [locationsResult, "discovery locations"],
    [organizationLocationsResult, "discovery organization locations"],
    [capabilitiesResult, "published discovery capabilities"],
    [technicalDomainsResult, "discovery technical domains"],
    [capabilityDomainsResult, "discovery capability domains"],
    [missionAreasResult, "discovery mission areas"],
    [missionMatchesResult, "discovery mission matches"],
    [clustersResult, "discovery clusters"],
    [capabilityClustersResult, "discovery capability cluster links"],
    [demandSourcesResult, "verified discovery demand sources"],
    [demandRequirementsResult, "discovery demand requirements"],
    [demandMatchesResult, "discovery demand matches"],
    [programsResult, "discovery programs"],
    [participationsResult, "discovery program participation"]
  ].forEach(([result, label]) => assertQuery(result as { error: { message?: string } | null }, String(label)));

  const locationById = byId(asRows(locationsResult.data));
  const locationLinksByOrganization = groupBy(asRows(organizationLocationsResult.data), "organization_id");
  const capabilitiesByOrganization = groupBy(asRows(capabilitiesResult.data), "organization_id");
  const technicalDomainRows = asRows(technicalDomainsResult.data);
  const technicalDomainById = byId(technicalDomainRows);
  const capabilityDomainsByCapability = groupBy(asRows(capabilityDomainsResult.data), "capability_id");
  const missionAreaRows = asRows(missionAreasResult.data);
  const missionAreaById = byId(missionAreaRows);
  const missionMatchesByCapability = groupBy(asRows(missionMatchesResult.data), "capability_id");
  const verifiedDemandSourceIds = new Set(
    asRows(demandSourcesResult.data)
      .filter((row) => asNullableString(row.source_verified_at) && asNullableString(row.source_verified_by))
      .map((row) => asString(row.id))
  );
  const demandRequirementRows = asRows(demandRequirementsResult.data)
    .filter((row) => verifiedDemandSourceIds.has(asString(row.demand_source_id)));
  const demandRequirementById = byId(demandRequirementRows);
  const demandMatchesByCapability = groupBy(asRows(demandMatchesResult.data), "capability_id");
  const programById = byId(asRows(programsResult.data));
  const participationsByOrganization = groupBy(asRows(participationsResult.data), "organization_id");
  const capabilityClustersByCluster = groupBy(asRows(capabilityClustersResult.data), "ecosystem_cluster_id");

  const mapLocation = (row: Row): AtlasLocation => {
    const provinceTerritory = asNullableString(row.province_territory);
    return {
      id: asString(row.id),
      name: asString(row.name),
      city: asNullableString(row.city),
      provinceTerritory,
      countryCode: asString(row.country_code, "CA"),
      latitude: asNumber(row.latitude),
      longitude: asNumber(row.longitude),
      geographicConfidence: ["exact", "city_centroid", "regional"].includes(asString(row.geographic_confidence))
        ? (asString(row.geographic_confidence) as AtlasLocation["geographicConfidence"])
        : "unverified",
      regionSlug: regionSlugForProvince(provinceTerritory)
    };
  };

  const technicalDomains: AtlasTechnicalDomain[] = technicalDomainRows.map((row) => ({
    id: asString(row.id),
    slug: asString(row.slug),
    name: asString(row.name),
    summary: asString(row.summary)
  }));

  const missionAreas: AtlasMissionArea[] = missionAreaRows.map((row) => ({
    id: asString(row.id),
    slug: asString(row.slug),
    name: asString(row.name),
    summary: asString(row.summary),
    sourceConfidence: asConfidence(row.source_confidence)
  }));

  const capabilities = asRows(capabilitiesResult.data).map((row): AtlasCapability => {
    const id = asString(row.id);
    const technicalDomainsForCapability = (capabilityDomainsByCapability.get(id) ?? [])
      .map((link) => technicalDomainById.get(asString(link.technical_domain_id)))
      .filter((value): value is Row => Boolean(value))
      .map((domain) => ({
        id: asString(domain.id),
        slug: asString(domain.slug),
        name: asString(domain.name),
        summary: asString(domain.summary)
      }));
    const missionMatches = (missionMatchesByCapability.get(id) ?? [])
      .map((match): AtlasMissionMatch | null => {
        const mission = missionAreaById.get(asString(match.mission_area_id));
        if (!mission) return null;
        return {
          id: asString(match.id),
          missionArea: {
            id: asString(mission.id),
            slug: asString(mission.slug),
            name: asString(mission.name),
            summary: asString(mission.summary),
            sourceConfidence: asConfidence(mission.source_confidence)
          },
          alignmentSummary: asString(match.alignment_summary),
          matchType: match.match_type === "public_source_alignment" ? "public_source_alignment" : "derived",
          confidence: asConfidence(match.confidence),
          citations: []
        };
      })
      .filter((value): value is AtlasMissionMatch => Boolean(value));
    const demandMatches = (demandMatchesByCapability.get(id) ?? [])
      .map((match): AtlasDemandMatch | null => {
        const requirement = demandRequirementById.get(asString(match.demand_requirement_id));
        if (!requirement) return null;
        return {
          id: asString(match.id),
          demandRequirementId: asString(requirement.id),
          demandSlug: asString(requirement.slug),
          demandTitle: asString(requirement.title),
          alignmentSummary: asString(match.alignment_summary),
          matchType: match.match_type === "public_source_alignment" ? "public_source_alignment" : "derived",
          confidence: asConfidence(match.confidence),
          citations: []
        };
      })
      .filter((value): value is AtlasDemandMatch => Boolean(value));

    return {
      id,
      organizationId: asString(row.organization_id),
      slug: asString(row.slug),
      name: asString(row.name),
      summary: asString(row.summary),
      capabilityType: asNullableString(row.capability_type),
      coreFeatures: asStringArray(row.core_features),
      technologyReadinessLevel: null,
      maturity: null,
      commercialAvailability: null,
      defenceApplications: asStringArray(row.defence_applications),
      novelty: [],
      technicalTags: asStringArray(row.technical_tags),
      technicalDomains: technicalDomainsForCapability,
      missionMatches,
      demandMatches,
      sourceConfidence: asConfidence(row.source_confidence),
      lastReviewedAt: asNullableString(row.last_reviewed_at),
      citations: []
    };
  });
  const capabilityById = new Map(capabilities.map((capability) => [capability.id, capability]));

  const organizations: AtlasOrganization[] = asRows(organizationsResult.data).map((row) => {
    const id = asString(row.id);
    const mappedLocations = (locationLinksByOrganization.get(id) ?? [])
      .map((link) => {
        const location = locationById.get(asString(link.location_id));
        return location ? { link, location: mapLocation(location) } : null;
      })
      .filter((value): value is { link: Row; location: AtlasLocation } => Boolean(value));
    const primaryLocation = mappedLocations.find((value) => Boolean(value.link.is_primary))?.location
      ?? mappedLocations[0]?.location
      ?? null;
    const organizationCapabilities = (capabilitiesByOrganization.get(id) ?? [])
      .map((capability) => capabilityById.get(asString(capability.id)))
      .filter((value): value is AtlasCapability => Boolean(value));
    const programs: AtlasProgramParticipation[] = (participationsByOrganization.get(id) ?? [])
      .map((participation): AtlasProgramParticipation | null => {
        const program = programById.get(asString(participation.program_id));
        if (!program) return null;
        return mapProgramParticipation(participation, program);
      })
      .filter((value): value is AtlasProgramParticipation => Boolean(value));

    return {
      id,
      slug: asString(row.slug),
      name: asString(row.name),
      legalName: null,
      description: asString(row.description),
      websiteUrl: null,
      entityKind: asEntityKind(row.entity_kind),
      categories: asStringArray(row.organization_categories),
      sourceConfidence: asConfidence(row.source_confidence),
      freshnessStatus: ["current", "review_due", "stale"].includes(asString(row.freshness_status))
        ? (asString(row.freshness_status) as AtlasOrganization["freshnessStatus"])
        : "review_due",
      lastReviewedAt: asNullableString(row.last_reviewed_at),
      primaryLocation,
      locations: mappedLocations.map((value) => value.location),
      foundedYear: null,
      employeeRange: null,
      companyStage: asNullableString(row.company_stage),
      ownership: null,
      commercialStatus: null,
      disclosedFinancingSummary: null,
      defencePosture: null,
      dualUsePosture: null,
      profileData: {},
      editorialProfile: emptyEditorialProfile(),
      logo: null,
      mediaAssets: [],
      capabilities: organizationCapabilities,
      programs,
      fundingEvents: [],
      relationships: [],
      citations: []
    };
  });

  return {
    organizations,
    demandRequirements: demandRequirementRows.map((row) => ({
      id: asString(row.id),
      slug: asString(row.slug),
      title: asString(row.title)
    })),
    technicalDomains,
    missionAreas,
    clusters: asRows(clustersResult.data).map((row) => ({
      id: asString(row.id),
      slug: asString(row.slug),
      name: asString(row.name),
      summary: asString(row.summary),
      regionSlug: asNullableString(row.region_slug),
      clusterBasis: ["program", "geographic", "technical"].includes(asString(row.cluster_basis))
        ? (asString(row.cluster_basis) as AtlasCluster["clusterBasis"])
        : "editorial",
      capabilityIds: (capabilityClustersByCluster.get(asString(row.id)) ?? []).map((link) =>
        asString(link.capability_id)
      )
    })),
    generatedAt: new Date().toISOString(),
    dataSource: "supabase"
  };
}

/**
 * Load only the public-need fields required by the collection page. This
 * intentionally excludes organizations, capabilities, funding, programs, and
 * the broader citation graph.
 */
export async function loadAtlasDemandIndexFromSupabase(): Promise<AtlasDemandIndexSnapshot> {
  const supabase = createPublicClient();
  const readRows=publicTableReader(supabase);
  const [demandSourcesResult,demandRequirementsResult,demandMatchesResult]=await Promise.all([
    readRows("demand_sources",atlasColumns.demandSources),
    readRows("demand_requirements",atlasColumns.demandRequirements),
    readRows("capability_demand_matches","id, demand_requirement_id",undefined,"id",["id"],[["review_status","approved"],["publication_status","published"]])
  ]);

  [
    [demandSourcesResult, "published demand index sources"],
    [demandRequirementsResult, "published demand index requirements"],
    [demandMatchesResult, "published demand index matches"]
  ].forEach(([result, label]) =>
    assertQuery(result as { error: { message?: string } | null }, String(label))
  );

  const demandSourceRows = asRows(demandSourcesResult.data);
  const sourceGraph = await loadPublicCitationGraph([], demandSourceRows);
  const publicSourceById = byId(sourceGraph.sources);
  const publicEvidenceById = byId(sourceGraph.evidence);
  const verifiedSourceById = new Map<string, {
    id: string;
    publisher: string;
    sourceKind: string | null;
    commitmentLevel: string | null;
  }>();

  demandSourceRows.forEach((row) => {
    const publicSource = publicSourceById.get(asString(row.source_id));
    const sourceEvidence = publicEvidenceById.get(asString(row.source_evidence_snippet_id));
    const sourceUrl = publicSource ? asNullableString(publicSource.canonical_url) : null;
    const isVerified = Boolean(
      sourceUrl
      && sourceEvidence
      && asString(sourceEvidence.source_id) === asString(row.source_id)
      && asNullableString(row.source_verified_at)
      && asNullableString(row.source_verified_by)
    );
    if (!isVerified) return;
    verifiedSourceById.set(asString(row.id), {
      id: asString(row.id),
      publisher: asString(row.publisher),
      sourceKind: asNullableString(row.source_kind),
      commitmentLevel: asNullableString(row.commitment_level)
    });
  });

  const matchCountByRequirement = new Map<string, number>();
  asRows(demandMatchesResult.data).forEach((row) => {
    const requirementId = asString(row.demand_requirement_id);
    matchCountByRequirement.set(requirementId, (matchCountByRequirement.get(requirementId) ?? 0) + 1);
  });

  const demands = asRows(demandRequirementsResult.data)
    .map((row) => {
      const source = verifiedSourceById.get(asString(row.demand_source_id));
      if (!source) return null;
      const id = asString(row.id);
      return {
        id,
        slug: asString(row.slug),
        title: asString(row.title),
        problemStatement: asString(row.problem_statement),
        displayOrder: asNumber(row.display_order) ?? 0,
        matchCount: matchCountByRequirement.get(id) ?? 0,
        source
      };
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value))
    .sort((left, right) => left.displayOrder - right.displayOrder || left.title.localeCompare(right.title));

  return {
    demands,
    sourceCount: new Set(demands.map((demand) => demand.source.id)).size,
    matchCount: demands.reduce((sum, demand) => sum + demand.matchCount, 0),
    generatedAt: new Date().toISOString()
  };
}

export async function loadAtlasCoverageSummaryFromSupabase(): Promise<AtlasCoverageSummary> {
  const supabase = createPublicClient();
  const [organizationsResult, capabilitiesResult, sourcesResult] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact", head: true }).eq("publication_status", "published"),
    supabase.from("capabilities").select("id", { count: "exact", head: true }).eq("publication_status", "published"),
    supabase.from("sources").select("id", { count: "exact", head: true }).eq("visibility", "public").eq("public_approved", true)
  ]);
  [
    [organizationsResult, "published organization count"],
    [capabilitiesResult, "published capability count"],
    [sourcesResult, "approved public source count"]
  ].forEach(([result, label]) => assertQuery(result as { error: { message?: string } | null }, String(label)));

  return {
    organizations: organizationsResult.count ?? 0,
    capabilities: capabilitiesResult.count ?? 0,
    sources: sourcesResult.count ?? 0,
    generatedAt: new Date().toISOString()
  };
}

export type AtlasPublicHealthSnapshot = {
  organizations: number;
  capabilities: number;
  publicNeeds: number;
  missions: number;
};

/**
 * A deliberately uncached, count-only database probe for the health route.
 * Public page caches may soften a transient outage for visitors, but they must
 * not make an unavailable canonical database appear healthy to operations.
 */
export async function loadAtlasPublicHealthSnapshotFromSupabase(): Promise<AtlasPublicHealthSnapshot> {
  const supabase = createPublicClient();
  const [organizationsResult, capabilitiesResult, publicNeedsResult, missionsResult] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact", head: true }).eq("publication_status", "published"),
    supabase.from("capabilities").select("id", { count: "exact", head: true }).eq("publication_status", "published"),
    supabase.from("demand_requirements").select("id", { count: "exact", head: true }).eq("publication_status", "published"),
    supabase.from("mission_areas").select("id", { count: "exact", head: true }).eq("publication_status", "published")
  ]);
  [
    [organizationsResult, "health organization count"],
    [capabilitiesResult, "health capability count"],
    [publicNeedsResult, "health verified public-need count"],
    [missionsResult, "health mission-area count"]
  ].forEach(([result, label]) => assertQuery(result as { error: { message?: string } | null }, String(label)));

  return {
    organizations: organizationsResult.count ?? 0,
    capabilities: capabilitiesResult.count ?? 0,
    publicNeeds: publicNeedsResult.count ?? 0,
    missions: missionsResult.count ?? 0
  };
}

const publicCitationBatchSize = 100;

function uniqueIds(rows: Row[], key = "id") {
  return Array.from(new Set(rows.map((row) => asString(row[key])).filter(Boolean)));
}

function chunks(values: string[], size = publicCitationBatchSize) {
  return Array.from({ length: Math.ceil(values.length / size) }, (_, index) =>
    values.slice(index * size, (index + 1) * size)
  );
}

async function loadPublicCitationGraph(
  targets: Array<{ entityType: string; ids: string[] }>,
  demandSourceRows: Row[]
) {
  // Every target ID comes from a row already admitted by the published-record
  // queries above. Hydrate only that evidence with the server-only client so
  // the field_citations RLS policy does not repeat its cross-table publication
  // checks for every citation and intermittently exceed the statement timeout.
  // The explicit ID and approval filters below remain the public boundary.
  const evidenceClient = hasSupabaseAdminEnv() ? createAdminClient() : createPublicClient();
  const citationBatches=targets.flatMap(({entityType,ids}) =>
    chunks(Array.from(new Set(ids.filter(Boolean)))).map(batch=>({entityType,batch}))
  );
  const citationResults=await boundedMap(citationBatches,3,({entityType,batch}) =>
    collectPagedPublicRows((from,to) => evidenceClient
      .from("field_citations")
      .select(atlasColumns.citations)
      .eq("entity_type", entityType)
      .in("entity_id", batch)
      .order("id").range(from,to),"scoped public citations")
  );
  citationResults.forEach((result) => assertQuery(result, "scoped public citations"));
  const citationRows = citationResults.flatMap((result) => asRows(result.data));

  const evidenceIds = Array.from(new Set([
    ...uniqueIds(citationRows, "evidence_snippet_id"),
    ...uniqueIds(demandSourceRows, "source_evidence_snippet_id")
  ]));
  const evidenceResults=await boundedMap(chunks(evidenceIds),3,async batch =>
    evidenceClient.from("evidence_snippets").select(atlasColumns.evidence)
      .in("id", batch).eq("visibility", "public").eq("public_approved", true)
  );
  evidenceResults.forEach((result) => assertQuery(result, "scoped public evidence"));
  const evidenceRows = evidenceResults.flatMap((result) => asRows(result.data));

  const sourceIds = Array.from(new Set([
    ...uniqueIds(evidenceRows, "source_id"),
    ...uniqueIds(demandSourceRows, "source_id")
  ]));
  const sourceResults=await boundedMap(chunks(sourceIds),3,async batch =>
    evidenceClient.from("sources").select(atlasColumns.sources)
      .in("id", batch).eq("visibility", "public").eq("public_approved", true)
  );
  sourceResults.forEach((result) => assertQuery(result, "scoped public sources"));

  return {
    citations: citationRows,
    evidence: evidenceRows,
    sources: sourceResults.flatMap((result) => asRows(result.data))
  };
}

type PublicCitationGraph = Awaited<ReturnType<typeof loadPublicCitationGraph>>;

/**
 * Collect only IDs from the already-admitted dossier row. This keeps public
 * evidence hydration bounded to the organization and child records returned
 * by the security-invoker dossier view.
 */
export function dossierCitationTargets(row: Row) {
  return [
    { entityType: "organization", ids: [asString(row.id)] },
    { entityType: "capability", ids: uniqueIds(asObjectArray(row.capabilities)) },
    {
      entityType: "capability_mission_match",
      ids: uniqueIds(asObjectArray(row.mission_matches).map((entry) => asObject(entry.match)))
    },
    {
      entityType: "capability_demand_match",
      ids: uniqueIds(asObjectArray(row.demand_matches).map((entry) => asObject(entry.match)))
    },
    { entityType: "program_participation", ids: uniqueIds(asObjectArray(row.programs)) },
    {
      entityType: "program",
      ids: uniqueIds(asObjectArray(row.programs).map((entry) => asObject(entry.program)))
    },
    { entityType: "funding_event", ids: uniqueIds(asObjectArray(row.funding_events)) },
    { entityType: "organization_relationship", ids: uniqueIds(asObjectArray(row.relationships)) },
    { entityType: "media_asset", ids: uniqueIds(asObjectArray(row.media_assets)) }
  ].filter((target) => target.ids.length > 0);
}

/** Convert the bounded public graph into the nested shape consumed by the
 * dossier mapper. Missing non-public evidence remains excluded, matching the
 * previous view contract; query failures throw before this helper is called.
 */
export function dossierCitationRows(graph: PublicCitationGraph) {
  const evidenceById = new Map(graph.evidence.map((row) => [asString(row.id), row]));
  const sourceById = new Map(graph.sources.map((row) => [asString(row.id), row]));

  return graph.citations.flatMap((citation) => {
    const evidence = evidenceById.get(asString(citation.evidence_snippet_id));
    const source = evidence ? sourceById.get(asString(evidence.source_id)) : undefined;
    return evidence && source ? [{ citation, evidence, source }] : [];
  });
}

function publicTableReader(supabase: ReturnType<typeof createPublicClient>) {
  return async (
    table: string, columns: string, ids?: string[], scopeColumn="id", order=["id"],
    filters: Array<[string,unknown]> = [["publication_status","published"]]
  ) => {
    const data: Row[]=[];
    for (const batch of ids === undefined ? [undefined] : chunks(Array.from(new Set(ids)))) {
      const result=await collectPagedPublicRows((from,to) => {
        let query=supabase.from(table).select(columns);
        for (const [column,value] of filters) query=query.eq(column,value);
        if (batch) query=query.in(scopeColumn,batch);
        for (const column of order) query=query.order(column);
        return query.range(from,to);
      },table);
      data.push(...result.data);
    }
    return {data,error:null};
  };
}

export async function loadAtlasSnapshotFromSupabase(scope?: AtlasSnapshotScope): Promise<Omit<AtlasSnapshot, "regions">> {
  const supabase = createPublicClient();

  const readRows = publicTableReader(supabase);
  const [capabilitiesResult,organizationLocationsResult] = await Promise.all([
    readRows("capabilities",atlasColumns.capabilities,scope?.capabilityIds ?? scope?.organizationIds,scope?.capabilityIds ? "id":"organization_id"),
    readRows("organization_locations",atlasColumns.organizationLocations,scope?.organizationIds,"organization_id",["organization_id","location_id"])
  ]);
  // Child links inherit the admitted capability scope even when the caller
  // selected organizations only. This avoids hydrating unrelated evidence.
  const capabilityIds=scope?.capabilityIds ?? (scope?.organizationIds ? uniqueIds(capabilitiesResult.data):undefined);
  const approvedMatches: Array<[string,unknown]>=[["review_status","approved"],["publication_status","published"]];
  const [
    organizationsResult, locationsResult, technicalDomainsResult, capabilityDomainsResult,
    missionAreasResult, missionMatchesResult, clustersResult, capabilityClustersResult,
    demandSourcesResult, demandRequirementsResult, demandMatchesResult, programsResult,
    participationsResult, fundingEventsResult, mediaAssetsResult
  ] = await Promise.all([
    readRows("organizations",atlasColumns.organizations,scope?.organizationIds),
    readRows("locations",atlasColumns.locations,scope?.organizationIds ? uniqueIds(organizationLocationsResult.data,"location_id"):undefined,"id",["id"],[]),
    readRows("technical_domains",atlasColumns.technicalDomains),
    readRows("capability_domains",atlasColumns.capabilityDomains,capabilityIds,"capability_id",["capability_id","technical_domain_id"]),
    readRows("mission_areas",atlasColumns.missionAreas),
    readRows("capability_mission_matches",atlasColumns.missionMatches,capabilityIds,"capability_id",["id"],approvedMatches),
    readRows("ecosystem_clusters",atlasColumns.clusters),
    readRows("capability_clusters",atlasColumns.capabilityClusters,capabilityIds,"capability_id",["ecosystem_cluster_id","capability_id"]),
    readRows("demand_sources",atlasColumns.demandSources),
    readRows("demand_requirements",atlasColumns.demandRequirements,scope?.demandRequirementIds),
    readRows("capability_demand_matches",atlasColumns.demandMatches,capabilityIds ?? scope?.demandRequirementIds,capabilityIds ? "capability_id":"demand_requirement_id",["id"],approvedMatches),
    readRows("programs",atlasColumns.programs),
    readRows("program_participations",atlasColumns.participations,scope?.organizationIds,"organization_id"),
    readRows("funding_events",atlasColumns.fundingEvents,scope?.organizationIds,"organization_id"),
    scope?.includeOrganizationLogos
      ? readRows("media_assets",atlasColumns.mediaAssets,scope.organizationIds,"organization_id",["id"],[["asset_type","logo"],["approval_status","approved"],["publication_status","published"]])
      : Promise.resolve({data:[],error:null})
  ]);

  const organizationRows = asRows(organizationsResult.data);
  const locationById = byId(asRows(locationsResult.data));
  const locationLinksByOrganization = groupBy(asRows(organizationLocationsResult.data), "organization_id");
  const capabilityRows = asRows(capabilitiesResult.data);
  const capabilitiesByOrganization = groupBy(capabilityRows, "organization_id");
  const technicalDomainRows = asRows(technicalDomainsResult.data);
  const technicalDomainById = byId(technicalDomainRows);
  const capabilityDomainsByCapability = groupBy(asRows(capabilityDomainsResult.data), "capability_id");
  const missionAreaRows = asRows(missionAreasResult.data);
  const missionAreaById = byId(missionAreaRows);
  const missionMatchesByCapability = groupBy(asRows(missionMatchesResult.data), "capability_id");
  const demandSourceRows = asRows(demandSourcesResult.data);
  const demandRequirementRows = asRows(demandRequirementsResult.data);
  const demandMatchRows = asRows(demandMatchesResult.data);
  const fundingEventRows = asRows(fundingEventsResult.data);
  const citationGraph = await loadPublicCitationGraph(
    [
      { entityType: "organization", ids: uniqueIds(organizationRows) },
      { entityType: "capability", ids: uniqueIds(capabilityRows) },
      { entityType: "capability_mission_match", ids: uniqueIds(asRows(missionMatchesResult.data)) },
      { entityType: "capability_demand_match", ids: uniqueIds(demandMatchRows) },
      { entityType: "funding_event", ids: uniqueIds(fundingEventRows) },
      { entityType: "demand_requirement", ids: uniqueIds(demandRequirementRows) }
    ],
    demandSourceRows
  );
  const demandRequirementById = byId(demandRequirementRows);
  const demandMatchesByCapability = groupBy(asRows(demandMatchesResult.data), "capability_id");
  const programById = byId(asRows(programsResult.data));
  const participationsByOrganization = groupBy(asRows(participationsResult.data), "organization_id");
  const fundingByOrganization = groupBy(fundingEventRows, "organization_id");
  const mediaByOrganization = groupBy(asRows(mediaAssetsResult.data), "organization_id");
  const sourceById = byId(citationGraph.sources);
  const evidenceById = byId(citationGraph.evidence);
  const citationsByEntity = new Map<string, Row[]>();

  citationGraph.citations.forEach((row) => {
    const key = `${asString(row.entity_type)}:${asString(row.entity_id)}`;
    const current = citationsByEntity.get(key) ?? [];
    current.push(row);
    citationsByEntity.set(key, current);
  });

  const getCitations = (entityType: string, entityId: string): AtlasCitation[] =>
    (citationsByEntity.get(`${entityType}:${entityId}`) ?? [])
      .map((row): AtlasCitation | null => {
        const evidence = evidenceById.get(asString(row.evidence_snippet_id));
        const source = evidence ? sourceById.get(asString(evidence.source_id)) : null;
        const sourceUrl = source ? asNullableString(source.canonical_url) : null;
        if (!evidence || !source || !sourceUrl) return null;
        return {
          id: asString(row.id),
          fieldName: asString(row.field_name),
          sourceTitle: asString(source.title),
          sourceUrl,
          publisher: asString(source.publisher),
          sourceType: asString(source.source_type),
          excerpt: asString(evidence.excerpt),
          publishedAt: asNullableString(source.published_at)
        };
      })
      .filter((value): value is AtlasCitation => Boolean(value));

  const technicalDomains: AtlasTechnicalDomain[] = technicalDomainRows.map((row) => ({
    id: asString(row.id),
    slug: asString(row.slug),
    name: asString(row.name),
    summary: asString(row.summary)
  }));

  const missionAreas: AtlasMissionArea[] = missionAreaRows.map((row) => ({
    id: asString(row.id),
    slug: asString(row.slug),
    name: asString(row.name),
    summary: asString(row.summary),
    sourceConfidence: asConfidence(row.source_confidence)
  }));

  const mapLocation = (row: Row): AtlasLocation => {
    const provinceTerritory = asNullableString(row.province_territory);
    return {
      id: asString(row.id),
      name: asString(row.name),
      city: asNullableString(row.city),
      provinceTerritory,
      countryCode: asString(row.country_code, "CA"),
      latitude: asNumber(row.latitude),
      longitude: asNumber(row.longitude),
      geographicConfidence: ["exact", "city_centroid", "regional"].includes(asString(row.geographic_confidence))
        ? (asString(row.geographic_confidence) as AtlasLocation["geographicConfidence"])
        : "unverified",
      regionSlug: regionSlugForProvince(provinceTerritory)
    };
  };

  const mapMissionMatch = (row: Row): AtlasMissionMatch | null => {
    const mission = missionAreaById.get(asString(row.mission_area_id));
    if (!mission) return null;
    return {
      id: asString(row.id),
      missionArea: {
        id: asString(mission.id),
        slug: asString(mission.slug),
        name: asString(mission.name),
        summary: asString(mission.summary),
        sourceConfidence: asConfidence(mission.source_confidence)
      },
      alignmentSummary: asString(row.alignment_summary),
      matchType: row.match_type === "public_source_alignment" ? "public_source_alignment" : "derived",
      confidence: asConfidence(row.confidence),
      citations: getCitations("capability_mission_match", asString(row.id))
    };
  };

  const mapDemandMatch = (row: Row): AtlasDemandMatch | null => {
    const requirement = demandRequirementById.get(asString(row.demand_requirement_id));
    if (!requirement) return null;
    return {
      id: asString(row.id),
      demandRequirementId: asString(requirement.id),
      demandSlug: asString(requirement.slug),
      demandTitle: asString(requirement.title),
      alignmentSummary: asString(row.alignment_summary),
      matchType: row.match_type === "public_source_alignment" ? "public_source_alignment" : "derived",
      confidence: asConfidence(row.confidence),
      citations: getCitations("capability_demand_match", asString(row.id))
    };
  };

  const capabilityById = new Map<string, AtlasCapability>();
  capabilityRows.forEach((row) => {
    const id = asString(row.id);
    const domains = (capabilityDomainsByCapability.get(id) ?? [])
      .map((link) => technicalDomainById.get(asString(link.technical_domain_id)))
      .filter((value): value is Row => Boolean(value))
      .map((domain) => ({
        id: asString(domain.id),
        slug: asString(domain.slug),
        name: asString(domain.name),
        summary: asString(domain.summary)
      }));
    const missionMatches = (missionMatchesByCapability.get(id) ?? [])
      .map(mapMissionMatch)
      .filter((value): value is AtlasMissionMatch => Boolean(value));
    const demandMatches = (demandMatchesByCapability.get(id) ?? [])
      .map(mapDemandMatch)
      .filter((value): value is AtlasDemandMatch => Boolean(value));

    capabilityById.set(id, {
      id,
      organizationId: asString(row.organization_id),
      slug: asString(row.slug),
      name: asString(row.name),
      summary: asString(row.summary),
      capabilityType: asNullableString(row.capability_type),
      coreFeatures: asStringArray(row.core_features),
      technologyReadinessLevel: asNumber(row.technology_readiness_level),
      maturity: asNullableString(row.maturity),
      commercialAvailability: asNullableString(row.commercial_availability),
      defenceApplications: asStringArray(row.defence_applications),
      novelty: asStringArray(row.novelty),
      technicalTags: asStringArray(row.technical_tags),
      technicalDomains: domains,
      missionMatches,
      demandMatches,
      sourceConfidence: asConfidence(row.source_confidence),
      lastReviewedAt: asNullableString(row.last_reviewed_at),
      citations: getCitations("capability", id)
    });
  });

  const organizations: AtlasOrganization[] = organizationRows.map((row) => {
    const id = asString(row.id);
    const locationLinks = locationLinksByOrganization.get(id) ?? [];
    const mappedLocations = locationLinks
      .map((link) => {
        const locationRow = locationById.get(asString(link.location_id));
        return locationRow ? { link, location: mapLocation(locationRow) } : null;
      })
      .filter((value): value is { link: Row; location: AtlasLocation } => Boolean(value));
    const primaryLocation =
      mappedLocations.find((value) => Boolean(value.link.is_primary))?.location ?? mappedLocations[0]?.location ?? null;
    const capabilities = (capabilitiesByOrganization.get(id) ?? [])
      .map((capability) => capabilityById.get(asString(capability.id)))
      .filter((value): value is AtlasCapability => Boolean(value));
    const programs: AtlasProgramParticipation[] = (participationsByOrganization.get(id) ?? [])
      .map((participation): AtlasProgramParticipation | null => {
        const program = programById.get(asString(participation.program_id));
        if (!program) return null;
        return mapProgramParticipation(
          participation,
          program,
          getCitations("program_participation", asString(participation.id)),
          getCitations("program", asString(program.id))
        );
      })
      .filter((value): value is AtlasProgramParticipation => Boolean(value));

    return {
      id,
      slug: asString(row.slug),
      name: asString(row.name),
      legalName: asNullableString(row.legal_name),
      description: asString(row.description),
      websiteUrl: asNullableString(row.website_url),
      entityKind: asEntityKind(row.entity_kind),
      categories: asStringArray(row.organization_categories),
      sourceConfidence: asConfidence(row.source_confidence),
      freshnessStatus: ["current", "review_due", "stale"].includes(asString(row.freshness_status))
        ? (asString(row.freshness_status) as AtlasOrganization["freshnessStatus"])
        : "review_due",
      lastReviewedAt: asNullableString(row.last_reviewed_at),
      primaryLocation,
      locations: mappedLocations.map((value) => value.location),
      foundedYear: asNumber(row.founded_year),
      employeeRange: asNullableString(row.employee_range),
      companyStage: asNullableString(row.company_stage),
      ownership: asNullableString(row.ownership),
      commercialStatus: asNullableString(row.commercial_status),
      disclosedFinancingSummary: asNullableString(row.disclosed_financing_summary),
      defencePosture: asNullableString(row.defence_posture),
      dualUsePosture: asNullableString(row.dual_use_posture),
      profileData: publicProfileData(row.profile_data, asEntityKind(row.entity_kind)),
      editorialProfile: asEditorialProfile(row),
      logo: selectPublishedOrganizationLogo(mediaByOrganization.get(id) ?? []),
      mediaAssets: [],
      capabilities,
      programs,
      fundingEvents: (fundingByOrganization.get(id) ?? []).map((funding) => ({
        id: asString(funding.id),
        eventType: asString(funding.event_type),
        announcedOn: asNullableString(funding.announced_on),
        amountValue: asNumber(funding.amount_value),
        amountCurrency: asNullableString(funding.amount_currency),
        disclosedSummary: asString(funding.disclosed_summary),
        citations: getCitations("funding_event", asString(funding.id))
      })),
      relationships: [],
      citations: getCitations("organization", id)
    };
  });

  const organizationById = new Map(organizations.map((organization) => [organization.id, organization]));
  const demandSourceMap = new Map<string, AtlasDemandSource>();
  demandSourceRows.forEach((row) => {
    const publicSource = sourceById.get(asString(row.source_id));
    const sourceUrl = publicSource ? asNullableString(publicSource.canonical_url) : null;
    const sourceEvidence = evidenceById.get(asString(row.source_evidence_snippet_id));
    const isSourceVerified = Boolean(
      sourceUrl
      && sourceEvidence
      && asString(sourceEvidence.source_id) === asString(row.source_id)
      && asNullableString(row.source_verified_at)
      && asNullableString(row.source_verified_by)
    );
    if (!sourceUrl || !sourceEvidence || !isSourceVerified) return;
    demandSourceMap.set(asString(row.id), {
      id: asString(row.id),
      slug: asString(row.slug),
      title: asString(row.title),
      publisher: asString(row.publisher),
      publishedOn: asNullableString(row.published_on),
      classificationLabel: asString(row.classification_label, "PUBLIC"),
      summary: asString(row.summary),
      sourceUrl,
      sourceKind: asNullableString(row.source_kind),
      commitmentLevel: asNullableString(row.commitment_level),
      sourceLocator: asNullableString(sourceEvidence.source_locator),
      sourceExcerpt: asString(sourceEvidence.excerpt),
      sourceVerifiedAt: asString(row.source_verified_at),
      isSourceVerified
    });
  });

  const demandMatches = demandMatchRows;
  const demandRequirements: AtlasDemandRequirement[] = demandRequirementRows
    .map((row): AtlasDemandRequirement | null => {
      const id = asString(row.id);
      const source = demandSourceMap.get(asString(row.demand_source_id));
      if (!source) return null;
      const matches = demandMatches
        .filter((match) => asString(match.demand_requirement_id) === id)
        .map((match) => {
          const capability = capabilityById.get(asString(match.capability_id));
          const organization = capability ? organizationById.get(capability.organizationId) : null;
          const mappedMatch = mapDemandMatch(match);
          if (!capability || !organization || !mappedMatch) return null;
          return {
            organization: {
              id: organization.id,
              slug: organization.slug,
              name: organization.name,
              sourceConfidence: organization.sourceConfidence
            },
            capability: {
              id: capability.id,
              slug: capability.slug,
              name: capability.name,
              summary: capability.summary
            },
            match: mappedMatch
          };
        })
        .filter((value): value is NonNullable<typeof value> => Boolean(value));

      return {
        id,
        slug: asString(row.slug),
        title: asString(row.title),
        problemStatement: asString(row.problem_statement),
        desiredEndState: asString(row.desired_end_state),
        publicCaveat: asString(row.public_caveat),
        displayOrder: asNumber(row.display_order) ?? 0,
        source,
        matches,
        citations: getCitations("demand_requirement", id)
      };
    })
    .filter((value): value is AtlasDemandRequirement => Boolean(value))
    .sort((left, right) => left.displayOrder - right.displayOrder);

  const capabilityClustersByCluster = groupBy(asRows(capabilityClustersResult.data), "ecosystem_cluster_id");
  const clusters: AtlasCluster[] = asRows(clustersResult.data).map((row) => ({
    id: asString(row.id),
    slug: asString(row.slug),
    name: asString(row.name),
    summary: asString(row.summary),
    regionSlug: asNullableString(row.region_slug),
    clusterBasis: ["program", "geographic", "technical"].includes(asString(row.cluster_basis))
      ? (asString(row.cluster_basis) as AtlasCluster["clusterBasis"])
      : "editorial",
    capabilityIds: (capabilityClustersByCluster.get(asString(row.id)) ?? []).map((link) => asString(link.capability_id))
  }));

  return {
    organizations,
    demandRequirements,
    technicalDomains,
    missionAreas,
    clusters,
    generatedAt: new Date().toISOString(),
    dataSource: "supabase"
  };
}

/**
 * Load approved organization marks for one bounded public collection page.
 * Logos stay out of the national discovery projection so the map/search
 * payload remains compact as the corpus grows.
 */
export async function loadPublishedOrganizationLogosFromSupabase(organizationIds: string[]) {
  const uniqueOrganizationIds = Array.from(new Set(organizationIds.filter(Boolean)));
  if (!uniqueOrganizationIds.length) return {};

  const supabase = createPublicClient();
  const result = await supabase
    .from("media_assets")
    .select(atlasColumns.mediaAssets)
    .eq("asset_type", "logo")
    .eq("approval_status", "approved")
    .eq("publication_status", "published")
    .in("organization_id", uniqueOrganizationIds);
  assertQuery(result, "published organization directory logos");

  const rowsByOrganization = groupBy(asRows(result.data), "organization_id");
  return Object.fromEntries(
    uniqueOrganizationIds.flatMap((organizationId) => {
      const logo = selectPublishedOrganizationLogo(rowsByOrganization.get(organizationId) ?? []);
      return logo ? [[organizationId, logo]] : [];
    })
  );
}

function dossierCitationGetter(value: unknown) {
  const byEntity = new Map<string, AtlasCitation[]>();
  asObjectArray(value).forEach((entry) => {
    const citation = asObject(entry.citation);
    const evidence = asObject(entry.evidence);
    const source = asObject(entry.source);
    const sourceUrl = asNullableString(source.canonical_url);
    const entityType = asString(citation.entity_type);
    const entityId = asString(citation.entity_id);
    if (!sourceUrl || !entityType || !entityId) return;
    const key = `${entityType}:${entityId}`;
    const current = byEntity.get(key) ?? [];
    current.push({
      id: asString(citation.id),
      fieldName: asString(citation.field_name),
      sourceTitle: asString(source.title),
      sourceUrl,
      publisher: asString(source.publisher),
      sourceType: asString(source.source_type),
      excerpt: asString(evidence.excerpt),
      publishedAt: asNullableString(source.published_at)
    });
    byEntity.set(key, current);
  });
  return (entityType: string, entityId: string) => byEntity.get(`${entityType}:${entityId}`) ?? [];
}

/**
 * Map one RLS-filtered organization_dossiers row. Keeping this mapper pure
 * makes the bounded public contract testable without widening the national
 * discovery projection or introducing candidate/reviewer fields.
 */
export function mapAtlasOrganizationDossierRow(row: Row): AtlasOrganization {
  const getCitations = dossierCitationGetter(row.citations);
  const id = asString(row.id);
  const locationEntries = asObjectArray(row.locations).map((locationRow) => ({
    isPrimary: Boolean(locationRow.is_primary),
    location: (() => {
      const provinceTerritory = asNullableString(locationRow.province_territory);
      return {
        id: asString(locationRow.id),
        name: asString(locationRow.name),
        city: asNullableString(locationRow.city),
        provinceTerritory,
        countryCode: asString(locationRow.country_code, "CA"),
        latitude: asNumber(locationRow.latitude),
        longitude: asNumber(locationRow.longitude),
        geographicConfidence: ["exact", "city_centroid", "regional"].includes(asString(locationRow.geographic_confidence))
          ? asString(locationRow.geographic_confidence) as AtlasLocation["geographicConfidence"]
          : "unverified" as const,
        regionSlug: regionSlugForProvince(provinceTerritory)
      } satisfies AtlasLocation;
    })()
  }));

  const domainRowsByCapability = new Map<string, Row[]>();
  asObjectArray(row.capability_domains).forEach((entry) => {
    const capabilityId = asString(entry.capability_id);
    const current = domainRowsByCapability.get(capabilityId) ?? [];
    current.push(entry);
    domainRowsByCapability.set(capabilityId, current);
  });
  const missionRowsByCapability = new Map<string, Row[]>();
  asObjectArray(row.mission_matches).forEach((entry) => {
    const capabilityId = asString(asObject(entry.match).capability_id);
    const current = missionRowsByCapability.get(capabilityId) ?? [];
    current.push(entry);
    missionRowsByCapability.set(capabilityId, current);
  });
  const demandRowsByCapability = new Map<string, Row[]>();
  asObjectArray(row.demand_matches).forEach((entry) => {
    const capabilityId = asString(asObject(entry.match).capability_id);
    const current = demandRowsByCapability.get(capabilityId) ?? [];
    current.push(entry);
    demandRowsByCapability.set(capabilityId, current);
  });

  const capabilities = asObjectArray(row.capabilities).map((capabilityRow): AtlasCapability => {
    const capabilityId = asString(capabilityRow.id);
    const technicalDomains = (domainRowsByCapability.get(capabilityId) ?? []).map((entry) => {
      const domain = asObject(entry.technical_domain);
      return {
        id: asString(domain.id),
        slug: asString(domain.slug),
        name: asString(domain.name),
        summary: asString(domain.summary)
      };
    });
    const missionMatches = (missionRowsByCapability.get(capabilityId) ?? []).map((entry): AtlasMissionMatch => {
      const match = asObject(entry.match);
      const mission = asObject(entry.mission_area);
      return {
        id: asString(match.id),
        missionArea: {
          id: asString(mission.id),
          slug: asString(mission.slug),
          name: asString(mission.name),
          summary: asString(mission.summary),
          sourceConfidence: asConfidence(mission.source_confidence)
        },
        alignmentSummary: asString(match.alignment_summary),
        matchType: match.match_type === "public_source_alignment" ? "public_source_alignment" : "derived",
        confidence: asConfidence(match.confidence),
        citations: getCitations("capability_mission_match", asString(match.id))
      };
    });
    const demandMatches = (demandRowsByCapability.get(capabilityId) ?? []).map((entry): AtlasDemandMatch => {
      const match = asObject(entry.match);
      const requirement = asObject(entry.requirement);
      return {
        id: asString(match.id),
        demandRequirementId: asString(requirement.id),
        demandSlug: asString(requirement.slug),
        demandTitle: asString(requirement.title),
        alignmentSummary: asString(match.alignment_summary),
        matchType: match.match_type === "public_source_alignment" ? "public_source_alignment" : "derived",
        confidence: asConfidence(match.confidence),
        citations: getCitations("capability_demand_match", asString(match.id))
      };
    });
    return {
      id: capabilityId,
      organizationId: asString(capabilityRow.organization_id, id),
      slug: asString(capabilityRow.slug),
      name: asString(capabilityRow.name),
      summary: asString(capabilityRow.summary),
      capabilityType: asNullableString(capabilityRow.capability_type),
      coreFeatures: asStringArray(capabilityRow.core_features),
      technologyReadinessLevel: asNumber(capabilityRow.technology_readiness_level),
      maturity: asNullableString(capabilityRow.maturity),
      commercialAvailability: asNullableString(capabilityRow.commercial_availability),
      defenceApplications: asStringArray(capabilityRow.defence_applications),
      novelty: asStringArray(capabilityRow.novelty),
      technicalTags: asStringArray(capabilityRow.technical_tags),
      technicalDomains,
      missionMatches,
      demandMatches,
      sourceConfidence: asConfidence(capabilityRow.source_confidence),
      lastReviewedAt: asNullableString(capabilityRow.last_reviewed_at),
      citations: getCitations("capability", capabilityId)
    };
  });

  const programs = asObjectArray(row.programs).flatMap((participation): AtlasProgramParticipation[] => {
    const program = asObject(participation.program);
    if (!asString(program.id)) return [];
    return [mapProgramParticipation(
      participation,
      program,
      getCitations("program_participation", asString(participation.id)),
      getCitations("program", asString(program.id))
    )];
  });
  const fundingEvents = asObjectArray(row.funding_events).map((funding) => ({
    id: asString(funding.id),
    eventType: asString(funding.event_type),
    announcedOn: asNullableString(funding.announced_on),
    amountValue: asNumber(funding.amount_value),
    amountCurrency: asNullableString(funding.amount_currency),
    disclosedSummary: asString(funding.disclosed_summary),
    citations: getCitations("funding_event", asString(funding.id))
  }));
  const relationships = asObjectArray(row.relationships).map((relationship): AtlasOrganizationRelationship => {
    const relatedOrganization = asObject(relationship.related_organization);
    return {
      id: asString(relationship.id),
      relationshipType: asString(relationship.relationship_type),
      publicSummary: asString(relationship.public_summary),
      relatedOrganizationId: asNullableString(relationship.related_organization_id),
      relatedOrganizationName: asNullableString(relationship.related_organization_name),
      relatedOrganization: asString(relatedOrganization.id) ? {
        id: asString(relatedOrganization.id),
        slug: asString(relatedOrganization.slug),
        name: asString(relatedOrganization.name),
        entityKind: asEntityKind(relatedOrganization.entity_kind)
      } : null,
      citations: getCitations("organization_relationship", asString(relationship.id))
    };
  });
  const mediaRows = asObjectArray(row.media_assets);
  const mediaAssets = mediaRows.flatMap((media): AtlasDossierMediaAsset[] => {
    const assetType = asString(media.asset_type);
    if (!["logo", "product_image", "facility_image", "other"].includes(assetType)) return [];
    const storagePath = asNullableString(media.storage_path);
    const sourceUrl = asNullableString(media.source_url);
    const displayRole = asString(media.display_role);
    return [{
      id: asString(media.id),
      organizationId: asNullableString(media.organization_id),
      capabilityId: asNullableString(media.capability_id),
      assetType: assetType as AtlasDossierMediaAsset["assetType"],
      publicUrl: storagePath ? organizationLogoUrl(storagePath) : sourceUrl,
      sourceUrl,
      attributionText: asNullableString(media.attribution_text),
      altText: asNullableString(media.alt_text),
      displayRole: ["profile_identity", "profile_context", "capability_context", "source_support"].includes(displayRole)
        ? displayRole as AtlasDossierMediaAsset["displayRole"]
        : null,
      citations: getCitations("media_asset", asString(media.id))
    }];
  });

  const primaryLocation = locationEntries.find((entry) => entry.isPrimary)?.location
    ?? locationEntries[0]?.location
    ?? null;
  return {
    id,
    slug: asString(row.slug),
    name: asString(row.name),
    legalName: asNullableString(row.legal_name),
    description: asString(row.description),
    websiteUrl: asNullableString(row.website_url),
    entityKind: asEntityKind(row.entity_kind),
    categories: asStringArray(row.organization_categories),
    sourceConfidence: asConfidence(row.source_confidence),
    freshnessStatus: ["current", "review_due", "stale"].includes(asString(row.freshness_status))
      ? asString(row.freshness_status) as AtlasOrganization["freshnessStatus"]
      : "review_due",
    lastReviewedAt: asNullableString(row.last_reviewed_at),
    primaryLocation,
    locations: locationEntries.map((entry) => entry.location),
    foundedYear: asNumber(row.founded_year),
    employeeRange: asNullableString(row.employee_range),
    companyStage: asNullableString(row.company_stage),
    ownership: asNullableString(row.ownership),
    commercialStatus: asNullableString(row.commercial_status),
    disclosedFinancingSummary: asNullableString(row.disclosed_financing_summary),
    defencePosture: asNullableString(row.defence_posture),
    dualUsePosture: asNullableString(row.dual_use_posture),
    profileData: publicProfileData(row.profile_data, asEntityKind(row.entity_kind)),
    editorialProfile: asEditorialProfile(row),
    logo: selectPublishedOrganizationLogo(mediaRows),
    mediaAssets,
    capabilities,
    programs,
    fundingEvents,
    relationships,
    citations: getCitations("organization", id)
  };
}

export async function loadAtlasOrganizationBySlugFromSupabase(slug: string) {
  const supabase = createPublicClient();
  const organizationResult = await supabase
    .from("organizations")
    .select("id, editorial_profile_version")
    .eq("slug", slug)
    .eq("publication_status", "published")
    .maybeSingle();
  assertQuery(organizationResult, "published organization identity and dossier version");
  if (!organizationResult.data) return null;

  const organizationId = String(organizationResult.data.id);
  if (organizationResult.data.editorial_profile_version !== "organization_editorial_profile_v1") {
    const capabilityResult = await supabase
      .from("capabilities")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("publication_status", "published");
    assertQuery(capabilityResult, "published organization capabilities");
    const capabilityIds = asRows(capabilityResult.data).map((row) => asString(row.id));
    const snapshot = await loadAtlasSnapshotFromSupabase({
      organizationIds: [organizationId],
      capabilityIds,
      includeOrganizationLogos: true
    });
    return snapshot.organizations.find((organization) => organization.id === organizationId) ?? null;
  }

  let dossierResult = await supabase
    .from("organization_dossiers")
    .select(atlasDossierColumns)
    .eq("id", organizationId)
    .eq("editorial_profile_version", "organization_editorial_profile_v1")
    .maybeSingle();
  if (missingExecutiveRelevanceColumn(dossierResult.error)) {
    // The application is intentionally safe to deploy before the separately
    // approved executive-relevance migration. Remove this compatibility read
    // only after the migration is applied and the rollback window is closed.
    dossierResult = await supabase
      .from("organization_dossiers")
      .select(atlasDossierColumnsWithoutExecutiveRelevance)
      .eq("id", organizationId)
      .eq("editorial_profile_version", "organization_editorial_profile_v1")
      .maybeSingle();
  }
  assertQuery(dossierResult, "bounded published organization dossier");
  if (!dossierResult.data) return null;

  const dossierRow = dossierResult.data as unknown as Row;
  const citationGraph = await loadPublicCitationGraph(dossierCitationTargets(dossierRow), []);
  return mapAtlasOrganizationDossierRow({
    ...dossierRow,
    citations: dossierCitationRows(citationGraph)
  });
}

/** Resolve a reviewed one-hop predecessor redirect. This loader is deliberately
 * separate from the canonical organization loader so API and release-probe
 * callers continue to treat archived slugs as missing. */
export async function loadPublishedOrganizationSuccessorSlugFromSupabase(sourceSlug: string) {
  // Redirect lineage includes an archived predecessor and private review IDs,
  // so it is intentionally not exposed through public table RLS. This
  // server-only lookup uses the existing service client and returns only the
  // current published successor slug.
  const supabase = createAdminClient();
  const redirectResult = await supabase
    .from("organization_slug_redirects")
    .select("destination_organization_id")
    .eq("source_slug", sourceSlug)
    .maybeSingle();
  assertQuery(redirectResult, "published organization successor redirect");
  if (!redirectResult.data?.destination_organization_id) return null;

  const destinationResult = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", String(redirectResult.data.destination_organization_id))
    .eq("publication_status", "published")
    .maybeSingle();
  assertQuery(destinationResult, "published organization successor identity");
  return destinationResult.data?.slug ? String(destinationResult.data.slug) : null;
}

function missingExecutiveRelevanceColumn(error: { code?: string; message?: string } | null) {
  if (!error || !error.message?.includes("executive_relevance_summary")) return false;
  return error.code === "42703" || error.code === "PGRST204" || error.message.includes("does not exist");
}

export async function loadAtlasCapabilityBySlugFromSupabase(slug: string) {
  const supabase = createPublicClient();
  const capabilityResult = await supabase
    .from("capabilities")
    .select("id, organization_id")
    .eq("slug", slug)
    .eq("publication_status", "published")
    .maybeSingle();
  assertQuery(capabilityResult, "published capability identity");
  if (!capabilityResult.data) return null;

  const capabilityId = String(capabilityResult.data.id);
  const organizationId = String(capabilityResult.data.organization_id);
  // Capability profiles show a compact organization identity card, so this
  // single-record read may include the published, approved logo.
  const snapshot = await loadAtlasSnapshotFromSupabase({
    organizationIds: [organizationId],
    capabilityIds: [capabilityId],
    includeOrganizationLogos: true
  });
  const organization = snapshot.organizations.find((item) => item.id === organizationId);
  const capability = organization?.capabilities.find((item) => item.id === capabilityId);
  return organization && capability ? { organization, capability } : null;
}

export async function loadAtlasDemandBySlugFromSupabase(slug: string) {
  const supabase = createPublicClient();
  const demandResult = await supabase
    .from("demand_requirements")
    .select("id")
    .eq("slug", slug)
    .eq("publication_status", "published")
    .maybeSingle();
  assertQuery(demandResult, "published demand identity");
  if (!demandResult.data) return null;

  const demandRequirementId = String(demandResult.data.id);
  const readRows=publicTableReader(supabase);
  const demandMatchesResult=await readRows("capability_demand_matches","capability_id",[demandRequirementId],"demand_requirement_id",["id"],[["review_status","approved"],["publication_status","published"]]);
  const capabilityIds=uniqueIds(demandMatchesResult.data,"capability_id");
  const capabilityResult=await readRows("capabilities","id, organization_id",capabilityIds);
  const organizationIds = Array.from(new Set(asRows(capabilityResult.data).map((row) => asString(row.organization_id))));
  const snapshot = await loadAtlasSnapshotFromSupabase({
    organizationIds,
    capabilityIds,
    demandRequirementIds: [demandRequirementId]
  });
  return snapshot.demandRequirements.find((demand) => demand.id === demandRequirementId) ?? null;
}

export function normalizeRelationshipCapabilityIds(capabilityIds: readonly string[]) {
  return Array.from(new Set(capabilityIds.map((id) => id.trim()).filter(Boolean))).sort();
}

export function buildAtlasMissionLinksForCapabilities(
  missionMatchRows: readonly Row[],
  missionAreaRows: readonly Row[],
  capabilityRows: readonly Row[]
): AtlasMissionRecordConnection[] {
  const capabilityIdsByMission = new Map<string, Set<string>>();
  missionMatchRows.forEach((row) => {
    const missionAreaId = asString(row.mission_area_id);
    const capabilityId = asString(row.capability_id);
    if (!missionAreaId || !capabilityId) return;
    const capabilityIds = capabilityIdsByMission.get(missionAreaId) ?? new Set<string>();
    capabilityIds.add(capabilityId);
    capabilityIdsByMission.set(missionAreaId, capabilityIds);
  });
  const capabilityById = new Map(capabilityRows.map((row) => [asString(row.id), {
    id: asString(row.id),
    slug: asString(row.slug),
    name: asString(row.name)
  }]));

  return missionAreaRows.flatMap((row) => {
    const capabilityIds = capabilityIdsByMission.get(asString(row.id));
    if (!capabilityIds?.size) return [];
    return [{
      missionArea: {
        id: asString(row.id),
        slug: asString(row.slug),
        name: asString(row.name),
        summary: asString(row.summary),
        sourceConfidence: asConfidence(row.source_confidence)
      },
      capabilityCount: capabilityIds.size,
      connectingCapabilities: [...capabilityIds]
        .flatMap((id) => {
          const capability = capabilityById.get(id);
          return capability?.slug && capability.name ? [capability] : [];
        })
        .sort((left, right) => left.name.localeCompare(right.name))
        .slice(0, 3)
    } satisfies AtlasMissionRecordConnection];
  }).sort((left, right) =>
    right.capabilityCount - left.capabilityCount
      || left.missionArea.name.localeCompare(right.missionArea.name)
  );
}

export async function loadAtlasMissionLinksForCapabilitiesFromSupabase(capabilityIds: readonly string[]) {
  const ids=normalizeRelationshipCapabilityIds(capabilityIds);
  if (!ids.length) return [];
  const readRows=publicTableReader(createPublicClient());
  const [missionMatchesResult,capabilitiesResult]=await Promise.all([
    readRows("capability_mission_matches","capability_id, mission_area_id",ids,"capability_id",["id"],[["review_status","approved"],["publication_status","published"]]),
    readRows("capabilities","id, slug, name",ids)
  ]);
  const missionAreaIds=uniqueIds(missionMatchesResult.data,"mission_area_id");
  if (!missionAreaIds.length) return [];
  const missionAreasResult=await readRows("mission_areas",atlasColumns.missionAreas,missionAreaIds);

  return buildAtlasMissionLinksForCapabilities(
    asRows(missionMatchesResult.data),
    asRows(missionAreasResult.data),
    asRows(capabilitiesResult.data)
  );
}

export type AtlasRecordSummary = {
  type: "organization" | "capability" | "demand_requirement";
  id: string;
  slug: string;
  name: string;
  detail: string;
  organizationName?: string;
};

export async function loadPublishedAtlasSlugsFromSupabase() {
  const supabase = createPublicClient();
  const [organizationsResult, capabilitiesResult, demandsResult, missionsResult] = await Promise.all([
    collectPagedPublicRows(
      (from, to) => supabase.from("organizations").select("slug, updated_at, last_reviewed_at").eq("publication_status", "published").order("slug").range(from, to),
      "published organization slugs"
    ),
    collectPagedPublicRows(
      (from, to) => supabase.from("capabilities").select("slug, updated_at, last_reviewed_at").eq("publication_status", "published").order("slug").range(from, to),
      "published capability slugs"
    ),
    collectPagedPublicRows(
      (from, to) => supabase.from("demand_requirements").select("slug, updated_at").eq("publication_status", "published").order("slug").range(from, to),
      "published demand slugs"
    ),
    collectPagedPublicRows(
      (from, to) => supabase.from("mission_areas").select("slug, updated_at").eq("publication_status", "published").order("slug").range(from, to),
      "published mission-area slugs"
    )
  ]);
  assertQuery(organizationsResult, "published organization slugs");
  assertQuery(capabilitiesResult, "published capability slugs");
  assertQuery(demandsResult, "published demand slugs");
  assertQuery(missionsResult, "published mission-area slugs");
  return {
    organizations: asRows(organizationsResult.data)
      .map((row) => ({ slug: asString(row.slug), updatedAt: asNullableString(row.updated_at) ?? asNullableString(row.last_reviewed_at) }))
      .filter((row) => row.slug),
    capabilities: asRows(capabilitiesResult.data)
      .map((row) => ({ slug: asString(row.slug), updatedAt: asNullableString(row.updated_at) ?? asNullableString(row.last_reviewed_at) }))
      .filter((row) => row.slug),
    demands: asRows(demandsResult.data)
      .map((row) => ({ slug: asString(row.slug), updatedAt: asNullableString(row.updated_at) }))
      .filter((row) => row.slug),
    missions: asRows(missionsResult.data)
      .map((row) => ({ slug: asString(row.slug), updatedAt: asNullableString(row.updated_at) }))
      .filter((row) => row.slug)
  };
}

export async function loadAtlasRecordSummariesFromSupabase(
  records: Array<{ type: AtlasRecordSummary["type"]; id: string }>
): Promise<AtlasRecordSummary[]> {
  const supabase = createPublicClient();
  const organizationIds = records.filter((record) => record.type === "organization").map((record) => record.id);
  const capabilityIds = records.filter((record) => record.type === "capability").map((record) => record.id);
  const demandIds = records.filter((record) => record.type === "demand_requirement").map((record) => record.id);
  const readRows=publicTableReader(supabase);
  const [capabilityResult,demandResult]=await Promise.all([
    readRows("capabilities","id, organization_id, slug, name, summary",capabilityIds),
    readRows("demand_requirements","id, slug, title, problem_statement",demandIds)
  ]);
  const capabilityRows = asRows(capabilityResult.data);
  const referencedOrganizationIds = Array.from(new Set([
    ...organizationIds,
    ...capabilityRows.map((row) => asString(row.organization_id))
  ]));
  const organizationResult=await readRows("organizations","id, slug, name, description",referencedOrganizationIds);
  const organizationRows = asRows(organizationResult.data);
  const organizationById = byId(organizationRows);

  return [
    ...organizationRows
      .filter((row) => organizationIds.includes(asString(row.id)))
      .map((row): AtlasRecordSummary => ({
        type: "organization",
        id: asString(row.id),
        slug: asString(row.slug),
        name: asString(row.name),
        detail: asString(row.description)
      })),
    ...capabilityRows.map((row): AtlasRecordSummary => ({
      type: "capability",
      id: asString(row.id),
      slug: asString(row.slug),
      name: asString(row.name),
      detail: asString(row.summary),
      organizationName: asString(organizationById.get(asString(row.organization_id))?.name)
    })),
    ...asRows(demandResult.data).map((row): AtlasRecordSummary => ({
      type: "demand_requirement",
      id: asString(row.id),
      slug: asString(row.slug),
      name: asString(row.title),
      detail: asString(row.problem_statement)
    }))
  ];
}
