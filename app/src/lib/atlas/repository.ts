import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getAtlasMetroArea, inferAtlasMetroArea, organizationMatchesMetro } from "@/lib/atlas/geography";
import { loadAtlasSnapshotFromSupabase } from "@/lib/atlas/supabase-repository";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import type {
  AtlasBounds,
  AtlasDiscoveryResult,
  AtlasOrganization,
  AtlasQuery,
  AtlasExplorerQueryResult,
  AtlasQueryResult,
  AtlasRegion,
  AtlasSnapshot
} from "@/types/atlas";
import { ATLAS_EXPLORER_MAX_PAGE_SIZE, projectAtlasExplorerResult } from "@/lib/atlas/explorer-projection";

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

function buildRegions(snapshot: Omit<AtlasSnapshot, "regions">): AtlasRegion[] {
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

const getCachedSupabaseSnapshot = unstable_cache(
  async () => loadAtlasSnapshotFromSupabase(),
  ["ecosystem-intelligence-public-atlas-snapshot-v1"],
  { revalidate: 300, tags: ["atlas-public"] }
);

export const getAtlasSnapshot = cache(async (): Promise<AtlasSnapshot> => {
  if (!hasSupabasePublicEnv()) {
    throw new Error(
      "The production database connection is not configured. True North Map does not fall back to bundled records."
    );
  }

  const snapshot = await getCachedSupabaseSnapshot();
  return {
    ...snapshot,
    regions: buildRegions(snapshot)
  };
});

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
        (match) => `${match.demandTitle} ${match.alignmentSummary} ${match.rationale}`
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

function buildAppliedFilters(snapshot: AtlasSnapshot, query: AtlasQuery) {
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
  add("mission", "Mission area", snapshot.missionAreas.find((item) => item.slug === query.mission)?.name ?? query.mission);
  add("demand", "Demand", snapshot.demandRequirements.find((item) => item.slug === query.demand)?.title ?? query.demand);
  add("stage", "Stage", query.stage);
  add("program", "Program", query.program);

  if (query.bounds) {
    filters.push({ key: "bounds", label: "Map area", value: "Visible map bounds" });
  }

  return filters;
}

export function queryAtlasSnapshot(snapshot: AtlasSnapshot, query: AtlasQuery = {}): AtlasQueryResult {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(1000, Math.max(1, query.pageSize ?? 25));

  const filtered = snapshot.organizations
    .filter((organization) => !query.query || matchesQuery(organization, query.query))
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
    .sort((left, right) => {
      const confidenceOrder = { high: 0, moderate: 1, needs_review: 2 };
      return (
        confidenceOrder[left.sourceConfidence] - confidenceOrder[right.sourceConfidence] ||
        left.name.localeCompare(right.name)
      );
    });

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

export async function queryAtlas(query: AtlasQuery = {}): Promise<AtlasQueryResult> {
  return queryAtlasSnapshot(await getAtlasSnapshot(), query);
}

export function queryAtlasExplorerSnapshot(
  snapshot: AtlasSnapshot,
  query: AtlasQuery = {}
): AtlasExplorerQueryResult {
  const pageSize = Math.min(ATLAS_EXPLORER_MAX_PAGE_SIZE, Math.max(1, query.pageSize ?? 25));
  const constrainedQuery = { ...query, pageSize };
  return projectAtlasExplorerResult(queryAtlasSnapshot(snapshot, constrainedQuery), constrainedQuery);
}

export async function queryAtlasExplorer(query: AtlasQuery = {}): Promise<AtlasExplorerQueryResult> {
  return queryAtlasExplorerSnapshot(await getAtlasSnapshot(), query);
}

export async function getAtlasOrganizationBySlug(slug: string) {
  const snapshot = await getAtlasSnapshot();
  return snapshot.organizations.find((organization) => organization.slug === slug) ?? null;
}

export async function getAtlasCapabilityBySlug(slug: string) {
  const snapshot = await getAtlasSnapshot();
  for (const organization of snapshot.organizations) {
    const capability = organization.capabilities.find((item) => item.slug === slug);
    if (capability) return { organization, capability };
  }
  return null;
}

export async function getAtlasDemandBySlug(slug: string) {
  const snapshot = await getAtlasSnapshot();
  return snapshot.demandRequirements.find((demand) => demand.slug === slug) ?? null;
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
        "Try a mission area, such as Arctic domain awareness"
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
        ? `${result.total} published ${result.total === 1 ? "organization" : "organizations"} match the visible filters. Open a row to inspect the supporting evidence and derived alignment notes.`
        : null,
    suggestions:
      result.total > 0
        ? []
        : [
            "Broaden the region to Canada",
            "Remove the demand filter and search by capability",
            "Review the published demand page for currently unmapped gaps"
          ]
  };
}

export async function discoverAtlas(rawQuery: string): Promise<AtlasDiscoveryResult> {
  return discoverAtlasSnapshot(await getAtlasSnapshot(), rawQuery);
}
