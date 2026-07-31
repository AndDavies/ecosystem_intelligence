import { performance } from "node:perf_hooks";
import { projectAtlasExplorerResult, ATLAS_EXPLORER_PAGE_SIZE } from "../src/lib/atlas/explorer-projection";
import { groupProjectedPointsByGrid } from "../src/lib/atlas/map-clustering";
import type { AtlasOrganization } from "../src/types/atlas";

const organizationCount = 5_000;
const maxProjectionMs = 300;
const maxSerializedBytes = 1_500_000;

function organization(index: number): AtlasOrganization {
  return {
    id: `scale-organization-${index}`,
    slug: `scale-organization-${index}`,
    name: `Scale Organization ${index}`,
    legalName: null,
    description: "Compact scale-validation record.",
    websiteUrl: null,
    entityKind: "company",
    categories: [],
    sourceConfidence: "moderate",
    freshnessStatus: "current",
    lastReviewedAt: "2026-07-31T00:00:00.000Z",
    primaryLocation: {
      id: `scale-location-${index}`,
      name: `Location ${index}`,
      city: "Ottawa",
      provinceTerritory: "Ontario",
      countryCode: "CA",
      latitude: 45.4215 + (index % 50) * 0.001,
      longitude: -75.6972 + (index % 50) * 0.001,
      geographicConfidence: "city_centroid",
      regionSlug: "ontario"
    },
    locations: [],
    foundedYear: null,
    employeeRange: null,
    companyStage: null,
    ownership: null,
    commercialStatus: null,
    disclosedFinancingSummary: null,
    defencePosture: null,
    dualUsePosture: null,
    profileData: {},
    logo: null,
    capabilities: [],
    programs: [],
    fundingEvents: [],
    citations: []
  };
}

const organizations = Array.from({ length: organizationCount }, (_, index) => organization(index));
const startedAt = performance.now();
const result = projectAtlasExplorerResult({
  organizations: organizations.slice(0, ATLAS_EXPLORER_PAGE_SIZE),
  total: organizations.length,
  page: 1,
  pageSize: ATLAS_EXPLORER_PAGE_SIZE,
  appliedFilters: [],
  facets: { regions: [], organizationTypes: [], technicalDomains: [], missionAreas: [], demandRequirements: [] }
}, {}, organizations);
const elapsedMs = performance.now() - startedAt;
const serializedBytes = Buffer.byteLength(JSON.stringify(result));
const clusteringStartedAt = performance.now();
const fallbackGroups = groupProjectedPointsByGrid(result.mapOrganizations.map((item, index) => ({
  item,
  projected: { x: index % 1_000, y: Math.floor(index / 1_000) * 70 }
})));
const clusteringElapsedMs = performance.now() - clusteringStartedAt;

const checks = {
  allMarkersPresent: result.mapOrganizations.length === organizationCount,
  richCardsBounded: result.organizations.length === ATLAS_EXPLORER_PAGE_SIZE,
  projectionWithinBudget: elapsedMs <= maxProjectionMs,
  payloadWithinBudget: serializedBytes <= maxSerializedBytes,
  fallbackClusteringComplete: fallbackGroups.flat().length === organizationCount,
  fallbackClusteringWithinBudget: clusteringElapsedMs <= maxProjectionMs
};

console.log(JSON.stringify({
  organizationCount,
  richCardCount: result.organizations.length,
  mapMarkerCount: result.mapOrganizations.length,
  elapsedMs: Number(elapsedMs.toFixed(2)),
  clusteringElapsedMs: Number(clusteringElapsedMs.toFixed(2)),
  serializedBytes,
  budgets: { maxProjectionMs, maxSerializedBytes },
  checks
}, null, 2));

if (Object.values(checks).some((check) => !check)) process.exitCode = 1;
