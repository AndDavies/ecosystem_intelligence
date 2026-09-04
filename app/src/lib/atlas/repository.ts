import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getAtlasMetroArea, inferAtlasMetroArea, organizationMatchesMetro } from "@/lib/atlas/geography";
import { organizationMatchesGuidedSearchFocus } from "@/lib/atlas/guided-search";
import {
  loadAtlasCapabilityBySlugFromSupabase,
  loadAtlasCoverageSummaryFromSupabase,
  loadAtlasDemandBySlugFromSupabase,
  loadAtlasDemandIndexFromSupabase,
  loadAtlasMissionLinksForCapabilitiesFromSupabase,
  loadAtlasDiscoverySnapshotFromSupabase,
  loadAtlasDiscoveryTablePageFromSupabase,
  loadAtlasOrganizationBySlugFromSupabase,
  loadPublishedOrganizationSuccessorSlugFromSupabase,
  loadPublishedOrganizationLogosFromSupabase,
  loadPublishedAtlasSlugsFromSupabase,
  loadAtlasRecordSummariesFromSupabase,
  loadAtlasSnapshotFromSupabase,
  type AtlasRecordSummary
} from "@/lib/atlas/supabase-repository";
import { deriveDossierReleaseProbeSecret, verifyDossierReleaseProbe } from "@/lib/launch/dossier-release-gate";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import type {
  AtlasBounds,
  AtlasCoverageSummary,
  AtlasDiscoverySnapshot,
  AtlasDiscoveryResult,
  AtlasDemandIndexSnapshot,
  AtlasMissionDetail,
  AtlasMissionIndexSnapshot,
  AtlasMissionRecordConnection,
  AtlasConfidence,
  AtlasOrganization,
  AtlasQuery,
  AtlasExplorerQueryResult,
  AtlasQueryResult,
  AtlasRegion,
  AtlasSnapshot
} from "@/types/atlas";
import { ATLAS_EXPLORER_MAX_PAGE_SIZE, mergeExplorerLogoUrls, projectAtlasExplorerResult } from "@/lib/atlas/explorer-projection";
import { withPublicReadRetry } from "@/lib/supabase/public-read";
import { atlasDiscoveryCacheTag, atlasOrganizationCacheTag, atlasOrganizationGlobalCacheTag } from "@/lib/atlas/cache-tags";

const regionDefinitions: Array<Omit<AtlasRegion, "organizationCount" | "capabilityCount" | "clusterCount">> = [
  {
    slug: "canada",
    name: "Canada",
    shortName: "Canada",
    description: "The national view across all published Canadian ecosystem records.",
    provincesTerritories: [
      "Newfoundland and Labrador",
      "Prince Edward Island",
      "Nova Scotia",
      "New Brunswick",
      "Quebec",
      "Ontario",
      "Manitoba",
      "Saskatchewan",
      "Alberta",
      "British Columbia",
      "Yukon",
      "Northwest Territories",
      "Nunavut"
    ]
  },
  {
    slug: "atlantic-canada",
    name: "Atlantic Canada",
    shortName: "Atlantic",
    description: "Published organizations across Newfoundland and Labrador, Nova Scotia, New Brunswick, and Prince Edward Island.",
    provincesTerritories: ["Newfoundland and Labrador", "Nova Scotia", "New Brunswick", "Prince Edward Island"]
  },
  {
    slug: "quebec",
    name: "Quebec",
    shortName: "Quebec",
    description: "Published Quebec ecosystem records and their current capability coverage.",
    provincesTerritories: ["Quebec"]
  },
  {
    slug: "ontario",
    name: "Ontario",
    shortName: "Ontario",
    description: "Published Ontario ecosystem records, including Ottawa and Southern Ontario.",
    provincesTerritories: ["Ontario"]
  },
  {
    slug: "prairies",
    name: "Prairies",
    shortName: "Prairies",
    description: "Published ecosystem records across Manitoba, Saskatchewan, and Alberta.",
    provincesTerritories: ["Manitoba", "Saskatchewan", "Alberta"]
  },
  {
    slug: "british-columbia",
    name: "British Columbia",
    shortName: "British Columbia",
    description: "Published British Columbia ecosystem records and Pacific operating capabilities.",
    provincesTerritories: ["British Columbia"]
  },
  {
    slug: "north",
    name: "Northern Canada",
    shortName: "North",
    description: "Published records across Yukon, the Northwest Territories, and Nunavut. Thin coverage remains visible rather than padded.",
    provincesTerritories: ["Yukon", "Northwest Territories", "Nunavut"]
  }
];

export function getAtlasRegionDefinitionBySlug(slug: string) {
  return regionDefinitions.find((region) => region.slug === slug) ?? null;
}

type AtlasQueryableSnapshot = Pick<
  AtlasDiscoverySnapshot,
  "organizations" | "demandRequirements" | "technicalDomains" | "missionAreas" | "clusters" | "regions"
>;

let lastSafePublicSnapshot: Omit<AtlasSnapshot, "regions"> | null = null;
let lastSafeDiscoverySnapshot: Omit<AtlasDiscoverySnapshot, "regions"> | null = null;
let pendingDiscoverySnapshot: Promise<Omit<AtlasDiscoverySnapshot, "regions">> | null = null;
let lastSafeCoverageSummary: AtlasCoverageSummary | null = null;
let lastSafeDemandIndex: AtlasDemandIndexSnapshot | null = null;

function buildRegions(snapshot: Pick<AtlasQueryableSnapshot, "organizations" | "clusters">): AtlasRegion[] {
  return regionDefinitions.map((definition) => {
    const organizations =
      definition.slug === "canada"
        ? snapshot.organizations
        : snapshot.organizations.filter(
            (organization) => organization.primaryLocation?.regionSlug === definition.slug
          );
    const capabilityIds = new Set(organizations.flatMap((organization) => organization.capabilities.map((item) => item.id)));
    const clusters = snapshot.clusters.filter(
      (cluster) => definition.slug === "canada" || cluster.regionSlug === definition.slug
    );

    return {
      ...definition,
      organizationCount: organizations.length,
      capabilityCount: capabilityIds.size,
      clusterCount: clusters.length
    };
  });
}

// Record caches are invalidated by their exact slug after reviewed edits.
// National discovery pages retain a stable five-minute snapshot so a batch
// publication cannot trigger a full-corpus rewarm and overload public reads.
const publicRecordCacheSeconds = 5 * 60;
const publicDiscoveryCacheSeconds = 5 * 60;

const getCachedAtlasDiscoveryTablePage = unstable_cache(
  (table: Parameters<typeof loadAtlasDiscoveryTablePageFromSupabase>[0], from: number, to: number) =>
    withPublicReadRetry(() => Promise.resolve(loadAtlasDiscoveryTablePageFromSupabase(table, from, to))),
  ["ecosystem-intelligence-atlas-discovery-table-page-v1"],
  { revalidate: publicDiscoveryCacheSeconds, tags: [atlasDiscoveryCacheTag] }
) as typeof loadAtlasDiscoveryTablePageFromSupabase;

async function loadWarmAtlasDiscoverySnapshot() {
  if (!pendingDiscoverySnapshot) {
    pendingDiscoverySnapshot = loadAtlasDiscoverySnapshotFromSupabase(getCachedAtlasDiscoveryTablePage)
      .then((snapshot) => {
        lastSafeDiscoverySnapshot = snapshot;
        return snapshot;
      })
      .finally(() => {
        pendingDiscoverySnapshot = null;
      });
  }
  return pendingDiscoverySnapshot;
}

const getCachedAtlasCoverageSummary = unstable_cache(
  () => withPublicReadRetry(loadAtlasCoverageSummaryFromSupabase),
  ["ecosystem-intelligence-atlas-coverage-summary-v3"],
  { revalidate: publicDiscoveryCacheSeconds, tags: ["atlas-public"] }
);

const getCachedAtlasDemandIndex = unstable_cache(
  () => withPublicReadRetry(loadAtlasDemandIndexFromSupabase),
  ["ecosystem-intelligence-demand-index-v2"],
  { revalidate: publicDiscoveryCacheSeconds, tags: ["atlas-public"] }
);

function getCachedAtlasOrganizationBySlug(slug: string) {
  return unstable_cache(
    () => withPublicReadRetry(() => loadAtlasOrganizationBySlugFromSupabase(slug)),
    ["ecosystem-intelligence-organization-detail-v5", slug],
    { revalidate: publicRecordCacheSeconds, tags: [atlasOrganizationCacheTag(slug), atlasOrganizationGlobalCacheTag] }
  )();
}

function getCachedAtlasOrganizationSuccessorSlug(slug: string) {
  return unstable_cache(
    () => withPublicReadRetry(() => loadPublishedOrganizationSuccessorSlugFromSupabase(slug)),
    ["ecosystem-intelligence-organization-successor-v1", slug],
    { revalidate: publicRecordCacheSeconds, tags: [atlasOrganizationCacheTag(slug), atlasOrganizationGlobalCacheTag] }
  )();
}

const getCachedPublishedOrganizationLogos = unstable_cache(
  (organizationIds: string) =>
    withPublicReadRetry(() => loadPublishedOrganizationLogosFromSupabase(organizationIds.split(",").filter(Boolean))),
  ["ecosystem-intelligence-organization-directory-logos-v1"],
  { revalidate: publicDiscoveryCacheSeconds, tags: ["atlas-public"] }
);

const getCachedAtlasCapabilityBySlug = unstable_cache(
  (slug: string) => withPublicReadRetry(() => loadAtlasCapabilityBySlugFromSupabase(slug)),
  ["ecosystem-intelligence-capability-detail-v1"],
  { revalidate: publicRecordCacheSeconds, tags: ["atlas-public"] }
);

const getCachedAtlasDemandBySlug = unstable_cache(
  (slug: string) => withPublicReadRetry(() => loadAtlasDemandBySlugFromSupabase(slug)),
  ["ecosystem-intelligence-demand-detail-v1"],
  { revalidate: publicRecordCacheSeconds, tags: ["atlas-public"] }
);

const getCachedAtlasMissionLinksForCapabilities = unstable_cache(
  (capabilityIds: string) => withPublicReadRetry(() =>
    loadAtlasMissionLinksForCapabilitiesFromSupabase(capabilityIds.split(",").filter(Boolean))
  ),
  ["ecosystem-intelligence-relationship-pilot-mission-links-v1"],
  { revalidate: publicRecordCacheSeconds, tags: ["atlas-public"] }
);

const getCachedPublishedAtlasSlugs = unstable_cache(
  () => withPublicReadRetry(loadPublishedAtlasSlugsFromSupabase),
  ["ecosystem-intelligence-published-atlas-slugs-v3"],
  { revalidate: publicDiscoveryCacheSeconds, tags: ["atlas-public"] }
);

export const getAtlasSnapshot = cache(async (): Promise<AtlasSnapshot> => {
  if (!hasSupabasePublicEnv()) {
    throw new Error(
      "The production database connection is not configured. True North Map does not fall back to bundled records."
    );
  }

  // The complete national discovery snapshot intentionally contains every
  // published map marker and can exceed Next.js's 2 MB data-cache item limit.
  // React cache still deduplicates the load within a request; record-level
  // routes use tag-invalidated caches below. Do not put the full corpus
  // back into one unstable_cache entry as coverage grows.
  let snapshot: Omit<AtlasSnapshot, "regions">;
  try {
    snapshot = await withPublicReadRetry(loadAtlasSnapshotFromSupabase);
    lastSafePublicSnapshot = snapshot;
  } catch (error) {
    if (!lastSafePublicSnapshot) throw error;
    snapshot = lastSafePublicSnapshot;
  }
  return {
    ...snapshot,
    regions: buildRegions(snapshot)
  };
});

export const getAtlasDiscoverySnapshot = cache(async (): Promise<AtlasDiscoverySnapshot> => {
  requireAtlasPublicEnvironment();
  let snapshot: Omit<AtlasDiscoverySnapshot, "regions">;
  try {
    // Assemble the uncapped national discovery object from independently
    // cached 1,000-row source pages. This keeps every cache item below the
    // platform's 2 MB ceiling while avoiding a complete database rebuild on
    // every cold function instance.
    snapshot = await loadWarmAtlasDiscoverySnapshot();
    lastSafeDiscoverySnapshot = snapshot;
  } catch (error) {
    if (!lastSafeDiscoverySnapshot) throw error;
    snapshot = lastSafeDiscoverySnapshot;
  }
  return {
    ...snapshot,
    regions: buildRegions(snapshot)
  };
});

export const getAtlasCoverageSummary = cache(async (): Promise<AtlasCoverageSummary> => {
  requireAtlasPublicEnvironment();
  try {
    const summary = await getCachedAtlasCoverageSummary();
    lastSafeCoverageSummary = summary;
    return summary;
  } catch (error) {
    if (!lastSafeCoverageSummary) throw error;
    return lastSafeCoverageSummary;
  }
});

export const getAtlasDemandIndex = cache(async (): Promise<AtlasDemandIndexSnapshot> => {
  requireAtlasPublicEnvironment();
  try {
    const snapshot = await getCachedAtlasDemandIndex();
    lastSafeDemandIndex = snapshot;
    return snapshot;
  } catch (error) {
    if (!lastSafeDemandIndex) throw error;
    return lastSafeDemandIndex;
  }
});

const missionConfidenceOrder: Record<AtlasConfidence, number> = {
  high: 0,
  moderate: 1,
  needs_review: 2
};

export function buildAtlasMissionIndex(snapshot: AtlasDiscoverySnapshot): AtlasMissionIndexSnapshot {
  const missions = snapshot.missionAreas.map((missionArea) => {
    const organizations = new Set<string>();
    const capabilities = new Set<string>();
    const publicNeeds = new Set<string>();
    const confidenceCounts: Record<AtlasConfidence, number> = { high: 0, moderate: 0, needs_review: 0 };

    for (const organization of snapshot.organizations) {
      for (const capability of organization.capabilities) {
        const match = capability.missionMatches.find((candidate) => candidate.missionArea.id === missionArea.id);
        if (!match) continue;
        organizations.add(organization.id);
        capabilities.add(capability.id);
        confidenceCounts[match.confidence] += 1;
        capability.demandMatches.forEach((demand) => publicNeeds.add(demand.demandRequirementId));
      }
    }

    return {
      missionArea,
      organizationCount: organizations.size,
      capabilityCount: capabilities.size,
      connectedPublicNeedCount: publicNeeds.size,
      confidenceCounts
    };
  }).sort((left, right) => right.organizationCount - left.organizationCount || left.missionArea.name.localeCompare(right.missionArea.name));

  return {
    missions,
    organizationCount: new Set(
      snapshot.organizations
        .filter((organization) => organization.capabilities.some((capability) => capability.missionMatches.length > 0))
        .map((organization) => organization.id)
    ).size,
    capabilityCount: new Set(
      snapshot.organizations.flatMap((organization) =>
        organization.capabilities.filter((capability) => capability.missionMatches.length > 0).map((capability) => capability.id)
      )
    ).size,
    generatedAt: snapshot.generatedAt
  };
}

export function buildAtlasMissionDetail(snapshot: AtlasDiscoverySnapshot, slug: string): AtlasMissionDetail | null {
  const missionArea = snapshot.missionAreas.find((mission) => mission.slug === slug);
  if (!missionArea) return null;
  const sourceCapabilityById = new Map(
    snapshot.organizations.flatMap((organization) => organization.capabilities.map((capability) => [capability.id, capability] as const))
  );

  const organizations = snapshot.organizations.flatMap((organization) => {
    const capabilities = organization.capabilities.flatMap((capability) => {
      const assessment = capability.missionMatches.find((match) => match.missionArea.id === missionArea.id);
      if (!assessment) return [];
      return [{
        id: capability.id,
        slug: capability.slug,
        name: capability.name,
        summary: capability.summary,
        sourceConfidence: capability.sourceConfidence,
        technicalDomains: capability.technicalDomains,
        assessment: {
          id: assessment.id,
          alignmentSummary: assessment.alignmentSummary,
          matchType: assessment.matchType,
          confidence: assessment.confidence
        }
      }];
    });
    if (!capabilities.length) return [];
    const strongestConfidence = capabilities
      .map((capability) => capability.assessment.confidence)
      .sort((left, right) => missionConfidenceOrder[left] - missionConfidenceOrder[right])[0];
    return [{
      organization: {
        id: organization.id,
        slug: organization.slug,
        name: organization.name,
        description: organization.description,
        entityKind: organization.entityKind,
        sourceConfidence: organization.sourceConfidence,
        freshnessStatus: organization.freshnessStatus,
        lastReviewedAt: organization.lastReviewedAt,
        primaryLocation: organization.primaryLocation
      },
      capabilities,
      strongestConfidence
    }];
  }).sort((left, right) =>
    missionConfidenceOrder[left.strongestConfidence] - missionConfidenceOrder[right.strongestConfidence]
      || left.organization.name.localeCompare(right.organization.name)
  );

  const publicNeedTechnologyCounts = new Map<string, Set<string>>();
  organizations.forEach((connection) => connection.capabilities.forEach((capability) => {
    const sourceCapability = sourceCapabilityById.get(capability.id);
    sourceCapability?.demandMatches.forEach((match) => {
      const ids = publicNeedTechnologyCounts.get(match.demandRequirementId) ?? new Set<string>();
      ids.add(capability.id);
      publicNeedTechnologyCounts.set(match.demandRequirementId, ids);
    });
  }));

  return {
    missionArea,
    organizations,
    publicNeeds: snapshot.demandRequirements
      .filter((demand) => publicNeedTechnologyCounts.has(demand.id))
      .map((demand) => {
        const capabilityIds = [...(publicNeedTechnologyCounts.get(demand.id) ?? [])];
        const connectingCapabilities = capabilityIds
          .flatMap((id) => {
            const capability = sourceCapabilityById.get(id);
            return capability ? [{ id: capability.id, slug: capability.slug, name: capability.name }] : [];
          })
          .sort((left, right) => left.name.localeCompare(right.name))
          .slice(0, 3);
        return { ...demand, technologyCount: capabilityIds.length, connectingCapabilities };
      })
      .sort((left, right) => right.technologyCount - left.technologyCount || left.title.localeCompare(right.title)),
    capabilityCount: new Set(organizations.flatMap((connection) => connection.capabilities.map((capability) => capability.id))).size,
    generatedAt: snapshot.generatedAt
  };
}

export const getAtlasMissionIndex = cache(async () => buildAtlasMissionIndex(await getAtlasDiscoverySnapshot()));

export const getAtlasMissionBySlug = cache(async (slug: string) =>
  buildAtlasMissionDetail(await getAtlasDiscoverySnapshot(), slug)
);

export function buildAtlasMissionLinksForRecords(
  snapshot: AtlasDiscoverySnapshot,
  records: Array<{ type: AtlasRecordSummary["type"]; id: string }>
): AtlasMissionRecordConnection[] {
  const organizationIds = new Set(records.filter((record) => record.type === "organization").map((record) => record.id));
  const capabilityIds = new Set(records.filter((record) => record.type === "capability").map((record) => record.id));
  const publicNeedIds = new Set(records.filter((record) => record.type === "demand_requirement").map((record) => record.id));
  const capabilitiesByMission = new Map<string, Set<string>>();
  const capabilityById = new Map(snapshot.organizations.flatMap((organization) => organization.capabilities.map((capability) => [capability.id, capability] as const)));

  for (const organization of snapshot.organizations) {
    for (const capability of organization.capabilities) {
      const recordTouchesCapability = organizationIds.has(organization.id)
        || capabilityIds.has(capability.id)
        || capability.demandMatches.some((match) => publicNeedIds.has(match.demandRequirementId));
      if (!recordTouchesCapability) continue;
      for (const match of capability.missionMatches) {
        const ids = capabilitiesByMission.get(match.missionArea.id) ?? new Set<string>();
        ids.add(capability.id);
        capabilitiesByMission.set(match.missionArea.id, ids);
      }
    }
  }

  return snapshot.missionAreas
    .flatMap((missionArea) => {
      const capabilities = capabilitiesByMission.get(missionArea.id);
      return capabilities?.size ? [{
        missionArea,
        capabilityCount: capabilities.size,
        connectingCapabilities: [...capabilities]
          .flatMap((id) => {
            const capability = capabilityById.get(id);
            return capability ? [{ id: capability.id, slug: capability.slug, name: capability.name }] : [];
          })
          .sort((left, right) => left.name.localeCompare(right.name))
          .slice(0, 3)
      }] : [];
    })
    .sort((left, right) => right.capabilityCount - left.capabilityCount || left.missionArea.name.localeCompare(right.missionArea.name));
}

export async function getAtlasMissionLinksForRecords(
  records: Array<{ type: AtlasRecordSummary["type"]; id: string }>
) {
  return buildAtlasMissionLinksForRecords(await getAtlasDiscoverySnapshot(), records);
}

function normalize(value: string) {
  return value.trim().toLowerCase().replaceAll("_", " ");
}

function includesText(value: string | null | undefined, query: string) {
  return Boolean(value && normalize(value).includes(query));
}

function inBounds(organization: AtlasOrganization, bounds: AtlasBounds) {
  const latitude = organization.primaryLocation?.latitude;
  const longitude = organization.primaryLocation?.longitude;

  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return false;
  }

  return (
    longitude >= bounds.west &&
    longitude <= bounds.east &&
    latitude >= bounds.south &&
    latitude <= bounds.north
  );
}

function matchesQuery(organization: AtlasOrganization, rawQuery: string) {
  const query = normalize(rawQuery);
  if (!query) return true;

  const stopWords = new Set([
    "a",
    "all",
    "aligned",
    "and",
    "canada",
    "canadian",
    "capabilities",
    "companies",
    "company",
    "find",
    "for",
    "in",
    "me",
    "of",
    "organizations",
    "show",
    "the",
    "to",
    "with"
  ]);

  const searchable = [
    organization.name,
    organization.description,
    organization.primaryLocation?.name ?? "",
    organization.entityKind,
    ...organization.categories,
    ...organization.capabilities.flatMap((capability) => [
      capability.name,
      capability.summary,
      capability.capabilityType ?? "",
      ...capability.coreFeatures,
      ...capability.defenceApplications,
      ...capability.technicalTags,
      ...capability.technicalDomains.map((domain) => `${domain.name} ${domain.summary}`),
      ...capability.missionMatches.map(
        (match) => `${match.missionArea.name} ${match.missionArea.summary} ${match.alignmentSummary}`
      ),
      ...capability.demandMatches.map(
        (match) => `${match.demandTitle} ${match.alignmentSummary}`
      )
    ])
  ]
    .join(" ")
    .toLowerCase();

  return query
    .split(/\s+/)
    .filter((token) => token.length >= 2 && !stopWords.has(token))
    .every((token) => searchable.includes(token));
}

function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function countFacet(values: string[], labelLookup: (value: string) => string) {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, label: labelLookup(value), count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function buildAppliedFilters(snapshot: AtlasQueryableSnapshot, query: AtlasQuery) {
  const filters: AtlasQueryResult["appliedFilters"] = [];
  const add = (key: string, label: string, value?: string) => {
    if (value) filters.push({ key, label, value });
  };

  add("query", "Search", query.query);
  add("region", "Region", snapshot.regions.find((item) => item.slug === query.region)?.name ?? query.region);
  add("metro", "Metro area", getAtlasMetroArea(query.metro)?.name ?? query.metro);
  add("type", "Organization type", query.type ? titleCase(query.type) : undefined);
  add("capability", "Capability", query.capability);
  add("domain", "Technical domain", snapshot.technicalDomains.find((item) => item.slug === query.domain)?.name ?? query.domain);
  add("mission", "Mission Area", snapshot.missionAreas.find((item) => item.slug === query.mission)?.name ?? query.mission);
  add("demand", "Public Need", snapshot.demandRequirements.find((item) => item.slug === query.demand)?.title ?? query.demand);
  add("stage", "Stage", query.stage);
  add("program", "Program", query.program);
  add("cluster", "Cluster", snapshot.clusters.find((item) => item.slug === query.cluster)?.name ?? query.cluster);

  if (query.bounds) {
    filters.push({ key: "bounds", label: "Map area", value: "Visible map bounds" });
  }

  return filters;
}

function matchingAtlasOrganizations(snapshot: AtlasQueryableSnapshot, query: AtlasQuery = {}) {
  const clusterCapabilityIds = query.cluster
    ? new Set(snapshot.clusters.find((cluster) => cluster.slug === query.cluster)?.capabilityIds ?? [])
    : null;
  return snapshot.organizations
    .filter((organization) => !query.query || matchesQuery(organization, query.query))
    .filter((organization) => !query.focus?.length || organizationMatchesGuidedSearchFocus(organization, query.focus))
    .filter((organization) => !query.bounds || inBounds(organization, query.bounds))
    .filter(
      (organization) =>
        !query.region ||
        query.region === "canada" ||
        organization.primaryLocation?.regionSlug === query.region ||
        normalize(organization.primaryLocation?.provinceTerritory ?? "") === normalize(query.region)
    )
    .filter((organization) => !query.metro || organizationMatchesMetro(organization, query.metro))
    .filter(
      (organization) =>
        !query.type ||
        normalize(organization.entityKind) === normalize(query.type) ||
        organization.categories.some((category) => normalize(category) === normalize(query.type ?? ""))
    )
    .filter(
      (organization) =>
        !query.capability ||
        organization.capabilities.some((capability) => {
          const needle = normalize(query.capability ?? "");
          return (
            includesText(capability.name, needle) ||
            includesText(capability.slug, needle) ||
            includesText(capability.capabilityType, needle) ||
            capability.technicalTags.some((tag) => includesText(tag, needle))
          );
        })
    )
    .filter(
      (organization) =>
        !query.domain ||
        organization.capabilities.some((capability) =>
          capability.technicalDomains.some((domain) => domain.slug === query.domain)
        )
    )
    .filter(
      (organization) =>
        !query.mission ||
        organization.capabilities.some((capability) =>
          capability.missionMatches.some((match) => match.missionArea.slug === query.mission)
        )
    )
    .filter(
      (organization) =>
        !query.demand ||
        organization.capabilities.some((capability) =>
          capability.demandMatches.some((match) => match.demandSlug === query.demand)
        )
    )
    .filter(
      (organization) => !query.stage || normalize(organization.companyStage ?? "") === normalize(query.stage)
    )
    .filter(
      (organization) =>
        !query.program ||
        organization.programs.some(
          (program) => program.programSlug === query.program || includesText(program.programName, normalize(query.program ?? ""))
        )
    )
    .filter(
      (organization) =>
        !clusterCapabilityIds || organization.capabilities.some((capability) => clusterCapabilityIds.has(capability.id))
    )
    .sort((left, right) => {
      const confidenceOrder = { high: 0, moderate: 1, needs_review: 2 };
      return (
        confidenceOrder[left.sourceConfidence] - confidenceOrder[right.sourceConfidence] ||
        left.name.localeCompare(right.name)
      );
    });
}

function buildAtlasQueryResult(
  snapshot: AtlasQueryableSnapshot,
  query: AtlasQuery,
  filtered: AtlasOrganization[]
): AtlasQueryResult {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(1000, Math.max(1, query.pageSize ?? 25));

  const start = (page - 1) * pageSize;
  const regionValues = snapshot.organizations
    .map((organization) => organization.primaryLocation?.regionSlug)
    .filter((value): value is string => Boolean(value));
  const typeValues = snapshot.organizations.flatMap((organization) => [organization.entityKind, ...organization.categories]);
  const domainValues = snapshot.organizations.flatMap((organization) =>
    organization.capabilities.flatMap((capability) => capability.technicalDomains.map((domain) => domain.slug))
  );
  const missionValues = snapshot.organizations.flatMap((organization) =>
    organization.capabilities.flatMap((capability) =>
      capability.missionMatches.map((match) => match.missionArea.slug)
    )
  );
  const demandValues = snapshot.organizations.flatMap((organization) =>
    organization.capabilities.flatMap((capability) => capability.demandMatches.map((match) => match.demandSlug))
  );

  return {
    organizations: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
    appliedFilters: buildAppliedFilters(snapshot, query),
    facets: {
      regions: countFacet(
        regionValues,
        (value) => snapshot.regions.find((region) => region.slug === value)?.name ?? titleCase(value)
      ),
      organizationTypes: countFacet(typeValues, titleCase),
      technicalDomains: countFacet(
        domainValues,
        (value) => snapshot.technicalDomains.find((domain) => domain.slug === value)?.name ?? titleCase(value)
      ),
      missionAreas: countFacet(
        missionValues,
        (value) => snapshot.missionAreas.find((mission) => mission.slug === value)?.name ?? titleCase(value)
      ),
      demandRequirements: countFacet(
        demandValues,
        (value) => snapshot.demandRequirements.find((demand) => demand.slug === value)?.title ?? titleCase(value)
      )
    }
  };
}

export function queryAtlasSnapshot(snapshot: AtlasSnapshot, query: AtlasQuery = {}): AtlasQueryResult {
  return buildAtlasQueryResult(snapshot, query, matchingAtlasOrganizations(snapshot, query));
}

export async function queryAtlas(query: AtlasQuery = {}): Promise<AtlasQueryResult> {
  return queryAtlasSnapshot(await getAtlasSnapshot(), query);
}

export function queryAtlasExplorerSnapshot(
  snapshot: AtlasQueryableSnapshot,
  query: AtlasQuery = {}
): AtlasExplorerQueryResult {
  const pageSize = Math.min(ATLAS_EXPLORER_MAX_PAGE_SIZE, Math.max(1, query.pageSize ?? 25));
  const constrainedQuery = { ...query, pageSize };
  const matches = matchingAtlasOrganizations(snapshot, constrainedQuery);
  const clusterCapabilityIds = query.cluster
    ? new Set(snapshot.clusters.find((cluster) => cluster.slug === query.cluster)?.capabilityIds ?? [])
    : undefined;
  return projectAtlasExplorerResult(
    buildAtlasQueryResult(snapshot, constrainedQuery, matches),
    constrainedQuery,
    matches,
    clusterCapabilityIds
  );
}

export async function queryAtlasExplorer(query: AtlasQuery = {}): Promise<AtlasExplorerQueryResult> {
  return queryAtlasExplorerSnapshot(await getAtlasDiscoverySnapshot(), query);
}

/**
 * Attaches published logos to the current explorer result page with one
 * bounded, cached lookup. Rows stay capped at the explorer page size, so this
 * never fans out per organization or grows with the national corpus.
 */
export async function attachAtlasExplorerLogos(result: AtlasExplorerQueryResult): Promise<AtlasExplorerQueryResult> {
  const missingLogoIds = result.organizations.filter((organization) => !organization.logoUrl).map((organization) => organization.id);
  if (!missingLogoIds.length) return result;
  return mergeExplorerLogoUrls(result, await getAtlasOrganizationLogos(missingLogoIds));
}

function requireAtlasPublicEnvironment() {
  if (!hasSupabasePublicEnv()) {
    throw new Error(
      "The production database connection is not configured. True North Map does not fall back to bundled records."
    );
  }
}

export const getAtlasOrganizationBySlug = cache(async (slug: string) => {
  requireAtlasPublicEnvironment();
  return getCachedAtlasOrganizationBySlug(slug);
});

export const getAtlasOrganizationSuccessorSlug = cache(async (slug: string) => {
  requireAtlasPublicEnvironment();
  return getCachedAtlasOrganizationSuccessorSlug(slug);
});

declare const dossierReleaseProbeAuthorizationBrand: unique symbol;
type DossierReleaseProbeAuthorization = string & {
  readonly [dossierReleaseProbeAuthorizationBrand]: true;
};

export function authorizeAtlasOrganizationReleaseProbe(
  slug: string,
  deployment: string,
  signature: string,
  now = Date.now()
) {
  const expectedDeployment = process.env.VERCEL_GIT_COMMIT_SHA ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const secret = process.env.DOSSIER_RELEASE_PROBE_SECRET?.trim()
    || (serviceRoleKey ? deriveDossierReleaseProbeSecret(serviceRoleKey) : "");
  return verifyDossierReleaseProbe(deployment, slug, signature, expectedDeployment, secret, now)
    ? signature as DossierReleaseProbeAuthorization
    : null;
}

/** Exact-deployment release probe only. The HMAC-authenticated path deliberately
 * bypasses unstable_cache and the ordinary read-retry wrapper so the post-ready
 * gate measures a genuine database-backed cold read without creating a public,
 * attacker-controlled cache-bypass key.
 */
export const getAtlasOrganizationBySlugForReleaseProbe = cache(async (
  slug: string,
  _deployment: string,
  _authorization: DossierReleaseProbeAuthorization
) => {
  requireAtlasPublicEnvironment();
  return loadAtlasOrganizationBySlugFromSupabase(slug);
});

export async function getAtlasOrganizationLogos(organizationIds: string[]) {
  requireAtlasPublicEnvironment();
  const normalizedIds = Array.from(new Set(organizationIds.filter(Boolean))).sort();
  if (!normalizedIds.length) return {};
  try {
    return await getCachedPublishedOrganizationLogos(normalizedIds.join(","));
  } catch {
    // Logos are a progressive enhancement for the directory. Keep the
    // reviewed records available with their neutral fallback mark if the
    // media read is temporarily unavailable.
    return {};
  }
}

export const getAtlasCapabilityBySlug = cache(async (slug: string) => {
  requireAtlasPublicEnvironment();
  return getCachedAtlasCapabilityBySlug(slug);
});

export const getAtlasDemandBySlug = cache(async (slug: string) => {
  requireAtlasPublicEnvironment();
  return getCachedAtlasDemandBySlug(slug);
});

export async function getAtlasMissionLinksForCapabilities(capabilityIds: readonly string[]) {
  requireAtlasPublicEnvironment();
  const normalizedIds = Array.from(new Set(capabilityIds.filter(Boolean))).sort();
  if (!normalizedIds.length) return [];
  return getCachedAtlasMissionLinksForCapabilities(normalizedIds.join(","));
}

export async function getAtlasRecordSummaries(records: Array<{ type: AtlasRecordSummary["type"]; id: string }>) {
  requireAtlasPublicEnvironment();
  return loadAtlasRecordSummariesFromSupabase(records);
}

export async function getPublishedAtlasSlugs() {
  requireAtlasPublicEnvironment();
  return getCachedPublishedAtlasSlugs();
}

export async function getAtlasRegionBySlug(slug: string) {
  const snapshot = await getAtlasSnapshot();
  const region = snapshot.regions.find((item) => item.slug === slug);
  if (!region) return null;

  const organizations =
    slug === "canada"
      ? snapshot.organizations
      : snapshot.organizations.filter((organization) => organization.primaryLocation?.regionSlug === slug);
  const capabilityIds = new Set(organizations.flatMap((organization) => organization.capabilities.map((item) => item.id)));
  const clusters = snapshot.clusters.filter(
    (cluster) => (slug === "canada" || cluster.regionSlug === slug) && cluster.capabilityIds.some((id) => capabilityIds.has(id))
  );

  return { region, organizations, clusters };
}

/**
 * Evidence-light region data for public browsing. Rich evidence remains on
 * organization dossiers and the existing export loader above.
 */
export const getAtlasRegionDirectoryBySlug = cache(async (slug: string) => {
  const snapshot = await getAtlasDiscoverySnapshot();
  const region = snapshot.regions.find((item) => item.slug === slug);
  if (!region) return null;

  const organizations =
    slug === "canada"
      ? snapshot.organizations
      : snapshot.organizations.filter(
          (organization) => organization.primaryLocation?.regionSlug === slug
        );
  const capabilityIds = new Set(
    organizations.flatMap((organization) => organization.capabilities.map((item) => item.id))
  );
  const clusters = snapshot.clusters.filter(
    (cluster) =>
      (slug === "canada" || cluster.regionSlug === slug)
      && cluster.capabilityIds.some((id) => capabilityIds.has(id))
  );

  return { region, organizations, clusters, regions: snapshot.regions };
});

function uniqueEvidenceLinks(organizations: AtlasOrganization[]) {
  const links = new Map<string, { title: string; url: string; publisher: string }>();
  organizations
    .flatMap((organization) => [
      ...organization.citations,
      ...organization.capabilities.flatMap((capability) => [
        ...capability.citations,
        ...capability.missionMatches.flatMap((match) => match.citations),
        ...capability.demandMatches.flatMap((match) => match.citations)
      ])
    ])
    .forEach((item) => {
      links.set(item.sourceUrl, {
        title: item.sourceTitle,
        url: item.sourceUrl,
        publisher: item.publisher
      });
    });
  return Array.from(links.values());
}

function inferFilters(snapshot: AtlasSnapshot, rawQuery: string): AtlasQuery {
  const text = normalize(rawQuery);
  const filters: AtlasQuery = {};

  const organizationTypeAliases: Array<{ type: AtlasQuery["type"]; aliases: string[] }> = [
    { type: "investor_funder", aliases: ["venture capital", "venture capitalist", "vc", "investor", "investors", "funder", "funders"] },
    { type: "research_test_centre", aliases: ["research centre", "research centres", "research center", "research centers", "test centre", "test centres", "test center", "test centers", "testing centre", "testing centres", "testing center", "testing centers"] },
    { type: "government_innovation_office", aliases: ["government innovation office", "innovation office"] },
    { type: "ecosystem_organization", aliases: ["ecosystem organization", "ecosystem organizations", "ecosystem organisation", "ecosystem organisations", "industry association", "industry associations", "cluster organization", "cluster organizations", "cluster organisation", "cluster organisations"] },
    { type: "accelerator", aliases: ["accelerator", "accelerators"] },
    { type: "incubator", aliases: ["incubator", "incubators"] },
    { type: "company", aliases: ["company", "companies", "startup", "startups", "prime contractor", "prime contractors", "defence prime", "defense prime"] }
  ];
  const organizationType = organizationTypeAliases.find(({ aliases }) =>
    aliases.some((alias) => new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`).test(text))
  );
  if (organizationType?.type) filters.type = organizationType.type;

  const metro = inferAtlasMetroArea(rawQuery);
  if (metro) filters.metro = metro.slug;

  const region = snapshot.regions.find((item) => {
    if (item.slug === "canada") return false;
    return (
      text.includes(normalize(item.name)) ||
      text.includes(normalize(item.shortName)) ||
      item.provincesTerritories.some((province) => text.includes(normalize(province)))
    );
  });
  if (region) filters.region = region.slug;

  const domainAliases: Record<string, string[]> = {
    "sensing-and-isr": ["sensor", "sensing", "isr", "sonar", "radar", "surveillance"],
    "autonomous-systems": ["autonomous", "uncrewed", "robotic", "auv", "usv"],
    "mission-software-and-data": ["software", "geospatial", "visualization", "data fusion"],
    "space-and-earth-observation": ["space", "satellite", "earth observation", "sar"]
  };
  for (const [slug, aliases] of Object.entries(domainAliases)) {
    if (aliases.some((alias) => text.includes(alias))) {
      filters.domain = slug;
      break;
    }
  }

  const missionAliases: Record<string, string[]> = {
    "arctic-domain-awareness": ["arctic", "northern awareness", "maritime awareness"],
    "underwater-isr": ["underwater isr", "undersea", "subsea", "underwater"],
    "autonomous-patrol-and-monitoring": ["autonomous patrol", "uncrewed patrol"],
    "edge-data-processing": ["edge data", "disconnected", "degraded connectivity"]
  };
  for (const [slug, aliases] of Object.entries(missionAliases)) {
    if (aliases.some((alias) => text.includes(alias))) {
      filters.mission = slug;
      break;
    }
  }

  const demandAliases: Record<string, string[]> = {
    "land-formation-combat-effectiveness": ["land formation", "ground forces"],
    "air-and-missile-defence": ["air defence", "air defense", "missile defence", "missile defense"],
    "deep-strike": ["deep strike"],
    "medical-treatment-and-evacuation": ["medical evacuation", "medevac", "casualty evacuation", "medical treatment"],
    "logistics-and-sustainment": ["logistics", "sustainment", "resupply"]
  };
  for (const [slug, aliases] of Object.entries(demandAliases)) {
    if (aliases.some((alias) => text.includes(alias))) {
      filters.demand = slug;
      break;
    }
  }

  if (!filters.region && !filters.metro && !filters.type && !filters.domain && !filters.mission && !filters.demand) {
    filters.query = rawQuery;
  }

  return filters;
}

export function discoverAtlasSnapshot(snapshot: AtlasSnapshot, rawQuery: string): AtlasDiscoveryResult {
  const query = rawQuery.trim();

  if (!query) {
    return {
      query,
      interpretation: "ambiguous",
      filters: {},
      filterChips: [],
      organizationIds: [],
      capabilityIds: [],
      evidenceLinks: [],
      summary: null,
      suggestions: [
        "Try a region, such as Atlantic Canada",
        "Try a capability, such as underwater sensing",
        "Try a Mission Area, such as Arctic domain awareness"
      ]
    };
  }

  const filters = inferFilters(snapshot, query);
  const result = queryAtlasSnapshot(snapshot, { ...filters, pageSize: 100 });
  const capabilityIds = result.organizations.flatMap((organization) =>
    organization.capabilities
      .filter((capability) => {
        if (filters.domain && !capability.technicalDomains.some((domain) => domain.slug === filters.domain)) return false;
        if (filters.mission && !capability.missionMatches.some((match) => match.missionArea.slug === filters.mission)) return false;
        if (filters.demand && !capability.demandMatches.some((match) => match.demandSlug === filters.demand)) return false;
        return true;
      })
      .map((capability) => capability.id)
  );
  const hasConstrainedTaxonomy = Boolean(filters.region || filters.metro || filters.type || filters.domain || filters.mission || filters.demand);
  const interpretation = result.total > 0 ? "matched" : hasConstrainedTaxonomy ? "no_match" : "ambiguous";

  return {
    query,
    interpretation,
    filters,
    filterChips: result.appliedFilters,
    organizationIds: result.organizations.map((organization) => organization.id),
    capabilityIds,
    evidenceLinks: uniqueEvidenceLinks(result.organizations),
    summary:
      result.total > 0
        ? `${result.total} published ${result.total === 1 ? "organization" : "organizations"} match the visible filters. Open a row to inspect the public evidence and our current assessment.`
        : null,
    suggestions:
      result.total > 0
        ? []
        : [
            "Broaden the region to Canada",
            "Remove the Public Need filter and search by capability",
            "Review the published Public Need page for currently unmapped gaps"
          ]
  };
}

export async function discoverAtlas(rawQuery: string): Promise<AtlasDiscoveryResult> {
  return discoverAtlasSnapshot(await getAtlasSnapshot(), rawQuery);
}
