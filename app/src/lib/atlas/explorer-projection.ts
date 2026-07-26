import type {
  AtlasCapability,
  AtlasCitation,
  AtlasDemandMatch,
  AtlasExplorerCapability,
  AtlasExplorerOrganization,
  AtlasExplorerQueryResult,
  AtlasMapOrganization,
  AtlasMissionMatch,
  AtlasOrganization,
  AtlasQuery,
  AtlasQueryResult
} from "@/types/atlas";

// Rich evidence cards are deliberately paginated. Every matching organization
// still reaches the map through mapOrganizations, so this limit reduces the
// initial React payload without reducing national discovery coverage.
export const ATLAS_EXPLORER_PAGE_SIZE = 36;
export const ATLAS_EXPLORER_MAX_PAGE_SIZE = 200;

function matchingCapability(organization: AtlasOrganization, query: AtlasQuery) {
  return organization.capabilities.find((capability) => {
    if (query.domain && !capability.technicalDomains.some((domain) => domain.slug === query.domain)) return false;
    if (query.mission && !capability.missionMatches.some((match) => match.missionArea.slug === query.mission)) return false;
    if (query.demand && !capability.demandMatches.some((match) => match.demandSlug === query.demand)) return false;
    if (query.capability) {
      const needle = query.capability.toLowerCase();
      return [capability.name, capability.slug, capability.capabilityType ?? "", ...capability.technicalTags]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    }
    return true;
  }) ?? organization.capabilities[0] ?? null;
}

function projectCitation(citation: AtlasCitation) {
  return {
    id: citation.id,
    sourceTitle: citation.sourceTitle,
    sourceUrl: citation.sourceUrl,
    publisher: citation.publisher
  };
}

function limitedMissionMatches(matches: AtlasMissionMatch[], query: AtlasQuery) {
  const selected = query.mission
    ? matches.filter((match) => match.missionArea.slug === query.mission)
    : matches.slice(0, 1);
  return selected.slice(0, 1).map((match) => ({
    id: match.id,
    missionArea: {
      id: match.missionArea.id,
      slug: match.missionArea.slug,
      name: match.missionArea.name
    },
    alignmentSummary: match.alignmentSummary,
    matchType: match.matchType,
    confidence: match.confidence,
    citations: match.citations.slice(0, 2).map(projectCitation)
  }));
}

function limitedDemandMatches(matches: AtlasDemandMatch[], query: AtlasQuery) {
  const selected = query.demand
    ? matches.filter((match) => match.demandSlug === query.demand)
    : matches.slice(0, 1);
  return selected.slice(0, 1).map((match) => ({
    id: match.id,
    demandSlug: match.demandSlug,
    demandTitle: match.demandTitle,
    alignmentSummary: match.alignmentSummary,
    matchType: match.matchType,
    confidence: match.confidence,
    citations: match.citations.slice(0, 2).map(projectCitation)
  }));
}

function projectCapability(capability: AtlasCapability, query: AtlasQuery): AtlasExplorerCapability {
  return {
    id: capability.id,
    organizationId: capability.organizationId,
    slug: capability.slug,
    name: capability.name,
    summary: capability.summary,
    capabilityType: capability.capabilityType,
    defenceApplications: capability.defenceApplications.slice(0, 3),
    technicalTags: capability.technicalTags.slice(0, 5),
    technicalDomains: capability.technicalDomains.slice(0, 3).map((domain) => ({
      id: domain.id,
      slug: domain.slug,
      name: domain.name
    })),
    missionMatches: limitedMissionMatches(capability.missionMatches, query),
    demandMatches: limitedDemandMatches(capability.demandMatches, query),
    sourceConfidence: capability.sourceConfidence,
    lastReviewedAt: capability.lastReviewedAt,
    citations: capability.citations.slice(0, 3).map(projectCitation)
  };
}

export function projectAtlasExplorerOrganization(
  organization: AtlasOrganization,
  query: AtlasQuery = {}
): AtlasExplorerOrganization {
  const capability = matchingCapability(organization, query);
  return {
    id: organization.id,
    slug: organization.slug,
    name: organization.name,
    description: organization.description,
    entityKind: organization.entityKind,
    sourceConfidence: organization.sourceConfidence,
    freshnessStatus: organization.freshnessStatus,
    lastReviewedAt: organization.lastReviewedAt,
    primaryLocation: organization.primaryLocation,
    citations: organization.citations.slice(0, 3).map(projectCitation),
    capabilities: capability ? [projectCapability(capability, query)] : []
  };
}

export function projectAtlasMapOrganization(organization: AtlasOrganization): AtlasMapOrganization {
  return {
    id: organization.id,
    slug: organization.slug,
    name: organization.name,
    entityKind: organization.entityKind,
    primaryLocation: organization.primaryLocation
      ? {
          name: organization.primaryLocation.name,
          latitude: organization.primaryLocation.latitude,
          longitude: organization.primaryLocation.longitude
        }
      : null
  };
}

export function projectAtlasExplorerResult(
  result: AtlasQueryResult,
  query: AtlasQuery = {},
  mapOrganizations: AtlasOrganization[] = result.organizations
): AtlasExplorerQueryResult {
  const loadedThrough = result.page * result.pageSize;
  const hasMore = loadedThrough < result.total;
  return {
    ...result,
    organizations: result.organizations.map((organization) => projectAtlasExplorerOrganization(organization, query)),
    mapOrganizations: mapOrganizations.map(projectAtlasMapOrganization),
    hasMore,
    nextPage: hasMore ? result.page + 1 : null
  };
}
