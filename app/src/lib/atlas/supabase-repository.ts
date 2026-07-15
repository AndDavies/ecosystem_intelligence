import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  AtlasCapability,
  AtlasCitation,
  AtlasCluster,
  AtlasConfidence,
  AtlasDemandMatch,
  AtlasDemandRequirement,
  AtlasDemandSource,
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
    throw new Error(`Failed to load ${label}: ${result.error.message ?? "unknown Supabase error"}`);
  }
}

export async function loadAtlasSnapshotFromSupabase(): Promise<Omit<AtlasSnapshot, "regions">> {
  const supabase = await createClient();

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
    sourcesResult,
    evidenceResult,
    citationsResult
  ] = await Promise.all([
    supabase.from("organizations").select("*").eq("publication_status", "published"),
    supabase.from("locations").select("*"),
    supabase.from("organization_locations").select("*").eq("publication_status", "published"),
    supabase.from("capabilities").select("*").eq("publication_status", "published"),
    supabase.from("technical_domains").select("*").eq("publication_status", "published"),
    supabase.from("capability_domains").select("*").eq("publication_status", "published"),
    supabase.from("mission_areas").select("*").eq("publication_status", "published"),
    supabase
      .from("capability_mission_matches")
      .select("*")
      .eq("review_status", "approved")
      .eq("publication_status", "published"),
    supabase.from("ecosystem_clusters").select("*").eq("publication_status", "published"),
    supabase.from("capability_clusters").select("*").eq("publication_status", "published"),
    supabase.from("demand_sources").select("*").eq("publication_status", "published"),
    supabase.from("demand_requirements").select("*").eq("publication_status", "published"),
    supabase
      .from("capability_demand_matches")
      .select("*")
      .eq("review_status", "approved")
      .eq("publication_status", "published"),
    supabase.from("programs").select("*").eq("publication_status", "published"),
    supabase.from("program_participations").select("*").eq("publication_status", "published"),
    supabase.from("funding_events").select("*").eq("publication_status", "published"),
    supabase.from("sources").select("*").eq("visibility", "public").eq("public_approved", true),
    supabase.from("evidence_snippets").select("*").eq("visibility", "public").eq("public_approved", true),
    supabase.from("field_citations").select("*")
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
    [sourcesResult, "public sources"],
    [evidenceResult, "public evidence"],
    [citationsResult, "public citations"]
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
  const demandSourceById = byId(demandSourceRows);
  const demandRequirementRows = asRows(demandRequirementsResult.data);
  const demandRequirementById = byId(demandRequirementRows);
  const demandMatchesByCapability = groupBy(asRows(demandMatchesResult.data), "capability_id");
  const programById = byId(asRows(programsResult.data));
  const participationsByOrganization = groupBy(asRows(participationsResult.data), "organization_id");
  const fundingByOrganization = groupBy(asRows(fundingEventsResult.data), "organization_id");
  const sourceById = byId(asRows(sourcesResult.data));
  const evidenceById = byId(asRows(evidenceResult.data));
  const citationsByEntity = new Map<string, Row[]>();

  asRows(citationsResult.data).forEach((row) => {
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
      rationale: asString(row.rationale),
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
    if (!sourceUrl) return;
    demandSourceMap.set(asString(row.id), {
      id: asString(row.id),
      slug: asString(row.slug),
      title: asString(row.title),
      publisher: asString(row.publisher),
      publishedOn: asNullableString(row.published_on),
      classificationLabel: asString(row.classification_label, "PUBLIC"),
      summary: asString(row.summary),
      sourceUrl
    });
  });

  const demandMatches = asRows(demandMatchesResult.data);
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
