import type { AtlasEntityKind, AtlasOrganization, AtlasSnapshot } from "@/types/atlas";

const underwaterMission = {
  id: "mission-underwater-isr",
  slug: "underwater-isr",
  name: "Underwater ISR",
  summary: "Publicly evidenced underwater awareness and inspection needs.",
  sourceConfidence: "high" as const
};

const sensingDomain = {
  id: "domain-sensing",
  slug: "sensing-and-isr",
  name: "Sensing and ISR",
  summary: "Sensors and systems that support awareness and reconnaissance."
};

function organization(
  id: string,
  slug: string,
  name: string,
  entityKind: AtlasEntityKind,
  city: string,
  provinceTerritory: string,
  regionSlug: string,
  latitude: number,
  longitude: number,
  withUnderwaterCapability = false
): AtlasOrganization {
  return {
    id,
    slug,
    name,
    legalName: null,
    description: `${name} is a test-only organization fixture for discovery behavior.`,
    websiteUrl: `https://${slug}.example.test`,
    entityKind,
    categories: [],
    sourceConfidence: "high",
    freshnessStatus: "current",
    lastReviewedAt: "2026-07-19T00:00:00.000Z",
    primaryLocation: {
      id: `${id}-location`,
      name: city,
      city,
      provinceTerritory,
      countryCode: "CA",
      latitude,
      longitude,
      geographicConfidence: "city_centroid",
      regionSlug
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
    editorialProfile: {
      version: null,
      currentActivity: null,
      currentActivityAsOf: null,
      operatingContext: null,
      canadianFootprint: null,
      reviewedQuestions: []
    },
    logo: null,
    mediaAssets: [],
    capabilities: withUnderwaterCapability
      ? [{
          id: `${id}-capability`,
          organizationId: id,
          slug: `${slug}-underwater-system`,
          name: "Underwater sensing system",
          summary: "A test-only underwater sensing capability used for discovery behavior.",
          capabilityType: "Sensor",
          coreFeatures: ["Underwater sensing"],
          technologyReadinessLevel: null,
          maturity: null,
          commercialAvailability: null,
          defenceApplications: ["Underwater awareness"],
          novelty: [],
          technicalTags: ["underwater", "sensing"],
          technicalDomains: [sensingDomain],
          missionMatches: [{
            id: `${id}-mission-match`,
            missionArea: underwaterMission,
            alignmentSummary: "The test capability is explicitly associated with underwater awareness.",
            matchType: "public_source_alignment",
            confidence: "high",
            citations: []
          }],
          demandMatches: [],
          sourceConfidence: "high",
          lastReviewedAt: "2026-07-19T00:00:00.000Z",
          citations: []
        }]
      : [],
    programs: [],
    fundingEvents: [],
    relationships: [],
    citations: []
  };
}

export const atlasTestSnapshot: AtlasSnapshot = {
  organizations: [
    organization("10000000-0000-4000-8000-000000000005", "dartmouth-systems", "Dartmouth Systems", "company", "Dartmouth", "Nova Scotia", "atlantic-canada", 44.6661, -63.5674, true),
    organization("ontario-company", "ontario-company", "Ontario Company", "company", "Ottawa", "Ontario", "ontario", 45.4215, -75.6972),
    organization("canadian-investor", "canadian-investor", "Canadian Investor", "investor_funder", "Toronto", "Ontario", "ontario", 43.6532, -79.3832),
    organization("canadian-accelerator", "canadian-accelerator", "Canadian Accelerator", "accelerator", "Calgary", "Alberta", "prairies", 51.0447, -114.0719),
    organization("canadian-research-centre", "canadian-research-centre", "Canadian Research Centre", "research_test_centre", "Victoria", "British Columbia", "british-columbia", 48.4284, -123.3656),
    organization("canadian-ecosystem-organization", "canadian-ecosystem-organization", "Canadian Ecosystem Organization", "ecosystem_organization", "Montréal", "Quebec", "quebec", 45.5019, -73.5674)
  ],
  demandRequirements: [],
  technicalDomains: [sensingDomain],
  missionAreas: [underwaterMission],
  clusters: [],
  regions: [
    { slug: "canada", name: "Canada", shortName: "Canada", description: "Test national view.", provincesTerritories: [], organizationCount: 6, capabilityCount: 1, clusterCount: 0 },
    { slug: "atlantic-canada", name: "Atlantic Canada", shortName: "Atlantic", description: "Test Atlantic view.", provincesTerritories: ["Nova Scotia"], organizationCount: 1, capabilityCount: 1, clusterCount: 0 },
    { slug: "ontario", name: "Ontario", shortName: "Ontario", description: "Test Ontario view.", provincesTerritories: ["Ontario"], organizationCount: 2, capabilityCount: 0, clusterCount: 0 }
  ],
  generatedAt: "2026-07-19T00:00:00.000Z",
  dataSource: "supabase"
};
