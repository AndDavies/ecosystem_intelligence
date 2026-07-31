import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import { selectPublishedOrganizationLogo } from "@/lib/atlas/organization-logos";
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
  AtlasDiscoverySnapshot,
  AtlasEntityKind,
  AtlasLocation,
  AtlasMissionArea,
  AtlasMissionMatch,
  AtlasOrganization,
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

type AtlasSnapshotScope = {
  organizationIds?: string[];
  capabilityIds?: string[];
  demandRequirementIds?: string[];
  includeOrganizationLogos?: boolean;
};

const noMatchId = "00000000-0000-0000-0000-000000000000";

function scopedIds(values: string[] | undefined) {
  return values?.length ? values : [noMatchId];
}

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

export async function collectPagedPublicRows(
  loadPage: (from: number, to: number) => PromiseLike<PublicPageResult>,
  label: string,
  pageSize = publicDiscoveryPageSize
): Promise<{ data: Row[]; error: null }> {
  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    throw new Error(`Invalid page size for ${label}: ${pageSize}`);
  }
  const rows: Row[] = [];
  for (let from = 0; ; from += pageSize) {
    const result = await loadPage(from, from + pageSize - 1);
    assertQuery(result, label);
    const page = asRows(result.data);
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return { data: rows, error: null };
}

/**
 * Load only the fields needed to search, filter, cluster, and render the
 * national map. Detailed evidence remains on the bounded organization,
 * capability, and demand loaders.
 */
export async function loadAtlasDiscoverySnapshotFromSupabase(): Promise<Omit<AtlasDiscoverySnapshot, "regions">> {
  const supabase = createPublicClient();
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
      (from, to) => supabase.from("organizations").select(atlasDiscoveryColumns.organizations).eq("publication_status", "published").order("id").range(from, to),
      "published discovery organizations"
    ),
    collectPagedPublicRows(
      (from, to) => supabase.from("locations").select(atlasDiscoveryColumns.locations).order("id").range(from, to),
      "discovery locations"
    ),
    collectPagedPublicRows(
      (from, to) => supabase.from("organization_locations").select(atlasDiscoveryColumns.organizationLocations).eq("publication_status", "published").order("organization_id").order("location_id").range(from, to),
      "discovery organization locations"
    ),
    collectPagedPublicRows(
      (from, to) => supabase.from("capabilities").select(atlasDiscoveryColumns.capabilities).eq("publication_status", "published").order("id").range(from, to),
      "published discovery capabilities"
    ),
    collectPagedPublicRows(
      (from, to) => supabase.from("technical_domains").select(atlasDiscoveryColumns.technicalDomains).eq("publication_status", "published").order("id").range(from, to),
      "discovery technical domains"
    ),
    collectPagedPublicRows(
      (from, to) => supabase.from("capability_domains").select(atlasDiscoveryColumns.capabilityDomains).eq("publication_status", "published").order("capability_id").order("technical_domain_id").range(from, to),
      "discovery capability domains"
    ),
    collectPagedPublicRows(
      (from, to) => supabase.from("mission_areas").select(atlasDiscoveryColumns.missionAreas).eq("publication_status", "published").order("id").range(from, to),
      "discovery mission areas"
    ),
    collectPagedPublicRows(
      (from, to) => supabase.from("capability_mission_matches").select(atlasDiscoveryColumns.missionMatches).eq("review_status", "approved").eq("publication_status", "published").order("id").range(from, to),
      "discovery mission matches"
    ),
    collectPagedPublicRows(
      (from, to) => supabase.from("ecosystem_clusters").select(atlasDiscoveryColumns.clusters).eq("publication_status", "published").order("id").range(from, to),
      "discovery clusters"
    ),
    collectPagedPublicRows(
      (from, to) => supabase.from("capability_clusters").select(atlasDiscoveryColumns.capabilityClusters).eq("publication_status", "published").order("ecosystem_cluster_id").order("capability_id").range(from, to),
      "discovery capability cluster links"
    ),
    collectPagedPublicRows(
      (from, to) => supabase.from("demand_sources").select(atlasDiscoveryColumns.demandSources).eq("publication_status", "published").order("id").range(from, to),
      "verified discovery demand sources"
    ),
    collectPagedPublicRows(
      (from, to) => supabase.from("demand_requirements").select(atlasDiscoveryColumns.demandRequirements).eq("publication_status", "published").order("id").range(from, to),
      "discovery demand requirements"
    ),
    collectPagedPublicRows(
      (from, to) => supabase.from("capability_demand_matches").select(atlasDiscoveryColumns.demandMatches).eq("review_status", "approved").eq("publication_status", "published").order("id").range(from, to),
      "discovery demand matches"
    ),
    collectPagedPublicRows(
      (from, to) => supabase.from("programs").select(atlasDiscoveryColumns.programs).eq("publication_status", "published").order("id").range(from, to),
      "discovery programs"
    ),
    collectPagedPublicRows(
      (from, to) => supabase.from("program_participations").select(atlasDiscoveryColumns.participations).eq("publication_status", "published").order("id").range(from, to),
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
        return {
          id: asString(participation.id),
          programSlug: asString(program.slug),
          programName: asString(program.name),
          programType: asString(program.program_type),
          participationType: asString(participation.participation_type),
          cohortLabel: asNullableString(participation.cohort_label)
        };
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
      logo: null,
      capabilities: organizationCapabilities,
      programs,
      fundingEvents: [],
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
  const [demandSourcesResult, demandRequirementsResult, demandMatchesResult] = await Promise.all([
    supabase
      .from("demand_sources")
      .select(atlasColumns.demandSources)
      .eq("publication_status", "published"),
    supabase
      .from("demand_requirements")
      .select(atlasColumns.demandRequirements)
      .eq("publication_status", "published"),
    supabase
      .from("capability_demand_matches")
      .select("id, demand_requirement_id")
      .eq("review_status", "approved")
      .eq("publication_status", "published")
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
  const citationResults = [];
  for (const { entityType, ids } of targets) {
    for (const batch of chunks(Array.from(new Set(ids.filter(Boolean))))) {
      citationResults.push(await evidenceClient
        .from("field_citations")
        .select(atlasColumns.citations)
        .eq("entity_type", entityType)
        .in("entity_id", batch));
    }
  }
  citationResults.forEach((result) => assertQuery(result, "scoped public citations"));
  const citationRows = citationResults.flatMap((result) => asRows(result.data));

  const evidenceIds = Array.from(new Set([
    ...uniqueIds(citationRows, "evidence_snippet_id"),
    ...uniqueIds(demandSourceRows, "source_evidence_snippet_id")
  ]));
  const evidenceResults = [];
  for (const batch of chunks(evidenceIds)) {
    evidenceResults.push(await evidenceClient
      .from("evidence_snippets")
      .select(atlasColumns.evidence)
      .in("id", batch)
      .eq("visibility", "public")
      .eq("public_approved", true));
  }
  evidenceResults.forEach((result) => assertQuery(result, "scoped public evidence"));
  const evidenceRows = evidenceResults.flatMap((result) => asRows(result.data));

  const sourceIds = Array.from(new Set([
    ...uniqueIds(evidenceRows, "source_id"),
    ...uniqueIds(demandSourceRows, "source_id")
  ]));
  const sourceResults = [];
  for (const batch of chunks(sourceIds)) {
    sourceResults.push(await evidenceClient
      .from("sources")
      .select(atlasColumns.sources)
      .in("id", batch)
      .eq("visibility", "public")
      .eq("public_approved", true));
  }
  sourceResults.forEach((result) => assertQuery(result, "scoped public sources"));

  return {
    citations: citationRows,
    evidence: evidenceRows,
    sources: sourceResults.flatMap((result) => asRows(result.data))
  };
}

export async function loadAtlasSnapshotFromSupabase(scope?: AtlasSnapshotScope): Promise<Omit<AtlasSnapshot, "regions">> {
  const supabase = createPublicClient();

  const organizationsQuery = supabase.from("organizations").select(atlasColumns.organizations).eq("publication_status", "published");
  const organizationLocationsQuery = supabase.from("organization_locations").select(atlasColumns.organizationLocations).eq("publication_status", "published");
  const capabilitiesQuery = supabase.from("capabilities").select(atlasColumns.capabilities).eq("publication_status", "published");
  const capabilityDomainsQuery = supabase.from("capability_domains").select(atlasColumns.capabilityDomains).eq("publication_status", "published");
  const missionMatchesQuery = supabase
    .from("capability_mission_matches")
    .select(atlasColumns.missionMatches)
    .eq("review_status", "approved")
    .eq("publication_status", "published");
  const capabilityClustersQuery = supabase.from("capability_clusters").select(atlasColumns.capabilityClusters).eq("publication_status", "published");
  const demandRequirementsQuery = supabase.from("demand_requirements").select(atlasColumns.demandRequirements).eq("publication_status", "published");
  const demandMatchesQuery = supabase
    .from("capability_demand_matches")
    .select(atlasColumns.demandMatches)
    .eq("review_status", "approved")
    .eq("publication_status", "published");
  const participationsQuery = supabase.from("program_participations").select(atlasColumns.participations).eq("publication_status", "published");
  const fundingEventsQuery = supabase.from("funding_events").select(atlasColumns.fundingEvents).eq("publication_status", "published");
  const mediaAssetsQuery = scope?.includeOrganizationLogos
    ? supabase
        .from("media_assets")
        .select(atlasColumns.mediaAssets)
        .eq("asset_type", "logo")
        .eq("approval_status", "approved")
        .eq("publication_status", "published")
        .in("organization_id", scopedIds(scope.organizationIds))
    : Promise.resolve({ data: [], error: null });

  if (scope?.organizationIds) {
    organizationsQuery.in("id", scopedIds(scope.organizationIds));
    organizationLocationsQuery.in("organization_id", scopedIds(scope.organizationIds));
    participationsQuery.in("organization_id", scopedIds(scope.organizationIds));
    fundingEventsQuery.in("organization_id", scopedIds(scope.organizationIds));
  }
  if (scope?.capabilityIds) {
    capabilitiesQuery.in("id", scopedIds(scope.capabilityIds));
    capabilityDomainsQuery.in("capability_id", scopedIds(scope.capabilityIds));
    missionMatchesQuery.in("capability_id", scopedIds(scope.capabilityIds));
    capabilityClustersQuery.in("capability_id", scopedIds(scope.capabilityIds));
    demandMatchesQuery.in("capability_id", scopedIds(scope.capabilityIds));
  } else if (scope?.organizationIds) {
    capabilitiesQuery.in("organization_id", scopedIds(scope.organizationIds));
  }
  if (scope?.demandRequirementIds) {
    demandRequirementsQuery.in("id", scopedIds(scope.demandRequirementIds));
    if (!scope.capabilityIds) demandMatchesQuery.in("demand_requirement_id", scopedIds(scope.demandRequirementIds));
  }

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
    participationsResult,
    fundingEventsResult,
    mediaAssetsResult
  ] = await Promise.all([
    organizationsQuery,
    supabase.from("locations").select(atlasColumns.locations),
    organizationLocationsQuery,
    capabilitiesQuery,
    supabase.from("technical_domains").select(atlasColumns.technicalDomains).eq("publication_status", "published"),
    capabilityDomainsQuery,
    supabase.from("mission_areas").select(atlasColumns.missionAreas).eq("publication_status", "published"),
    missionMatchesQuery,
    supabase.from("ecosystem_clusters").select(atlasColumns.clusters).eq("publication_status", "published"),
    capabilityClustersQuery,
    supabase.from("demand_sources").select(atlasColumns.demandSources).eq("publication_status", "published"),
    demandRequirementsQuery,
    demandMatchesQuery,
    supabase.from("programs").select(atlasColumns.programs).eq("publication_status", "published"),
    participationsQuery,
    fundingEventsQuery,
    mediaAssetsQuery
  ]);

  [
    [organizationsResult, "published organizations"],
    [locationsResult, "published locations"],
    [organizationLocationsResult, "organization location links"],
    [capabilitiesResult, "published capabilities"],
    [technicalDomainsResult, "technical domains"],
    [capabilityDomainsResult, "capability domain links"],
    [missionAreasResult, "mission areas"],
    [missionMatchesResult, "mission matches"],
    [clustersResult, "ecosystem clusters"],
    [capabilityClustersResult, "capability cluster links"],
    [demandSourcesResult, "demand sources"],
    [demandRequirementsResult, "demand requirements"],
    [demandMatchesResult, "demand matches"],
    [programsResult, "programs"],
    [participationsResult, "program participation"],
    [fundingEventsResult, "funding events"],
    [mediaAssetsResult, "published organization logos"]
  ].forEach(([result, label]) => assertQuery(result as { error: { message?: string } | null }, String(label)));

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
  const demandSourceById = byId(demandSourceRows);
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
        return {
          id: asString(participation.id),
          programSlug: asString(program.slug),
          programName: asString(program.name),
          programType: asString(program.program_type),
          participationType: asString(participation.participation_type),
          cohortLabel: asNullableString(participation.cohort_label)
        };
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
      profileData: asObject(row.profile_data),
      logo: selectPublishedOrganizationLogo(mediaByOrganization.get(id) ?? []),
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

export async function loadAtlasOrganizationBySlugFromSupabase(slug: string) {
  const supabase = createPublicClient();
  const organizationResult = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .eq("publication_status", "published")
    .maybeSingle();
  assertQuery(organizationResult, "published organization identity");
  if (!organizationResult.data) return null;

  const organizationId = String(organizationResult.data.id);
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
  const demandMatchesResult = await supabase
    .from("capability_demand_matches")
    .select("capability_id")
    .eq("demand_requirement_id", demandRequirementId)
    .eq("review_status", "approved")
    .eq("publication_status", "published");
  assertQuery(demandMatchesResult, "published demand matches");
  const capabilityIds = Array.from(new Set(asRows(demandMatchesResult.data).map((row) => asString(row.capability_id))));
  const capabilityResult = capabilityIds.length
    ? await supabase.from("capabilities").select("id, organization_id").in("id", capabilityIds).eq("publication_status", "published")
    : { data: [], error: null };
  assertQuery(capabilityResult, "published matched capabilities");
  const organizationIds = Array.from(new Set(asRows(capabilityResult.data).map((row) => asString(row.organization_id))));
  const snapshot = await loadAtlasSnapshotFromSupabase({
    organizationIds,
    capabilityIds,
    demandRequirementIds: [demandRequirementId]
  });
  return snapshot.demandRequirements.find((demand) => demand.id === demandRequirementId) ?? null;
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
  const [capabilityResult, demandResult] = await Promise.all([
    capabilityIds.length
      ? supabase.from("capabilities").select("id, organization_id, slug, name, summary").in("id", capabilityIds).eq("publication_status", "published")
      : Promise.resolve({ data: [], error: null }),
    demandIds.length
      ? supabase.from("demand_requirements").select("id, slug, title, problem_statement").in("id", demandIds).eq("publication_status", "published")
      : Promise.resolve({ data: [], error: null })
  ]);
  assertQuery(capabilityResult, "linked capability summaries");
  assertQuery(demandResult, "linked demand summaries");
  const capabilityRows = asRows(capabilityResult.data);
  const referencedOrganizationIds = Array.from(new Set([
    ...organizationIds,
    ...capabilityRows.map((row) => asString(row.organization_id))
  ]));
  const organizationResult = referencedOrganizationIds.length
    ? await supabase
        .from("organizations")
        .select("id, slug, name, description")
        .in("id", referencedOrganizationIds)
        .eq("publication_status", "published")
    : { data: [], error: null };
  assertQuery(organizationResult, "linked organization summaries");
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
