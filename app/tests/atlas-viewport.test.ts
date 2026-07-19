import { describe, expect, it } from "vitest";
import { isUsableAtlasBounds, organizationIdsInBounds } from "@/lib/atlas/viewport";
import type { AtlasOrganization } from "@/types/atlas";

const organizations: AtlasOrganization[] = [
  {
    id: "halifax-organization",
    slug: "halifax-organization",
    name: "Halifax Organization",
    legalName: null,
    description: "A test organization used only to verify viewport filtering.",
    websiteUrl: "https://example.test/halifax",
    entityKind: "company",
    categories: [],
    sourceConfidence: "high",
    freshnessStatus: "current",
    lastReviewedAt: null,
    primaryLocation: {
      id: "halifax-location",
      name: "Halifax",
      city: "Halifax",
      provinceTerritory: "Nova Scotia",
      countryCode: "CA",
      latitude: 44.6488,
      longitude: -63.5752,
      geographicConfidence: "city_centroid",
      regionSlug: "atlantic-canada"
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
    capabilities: [],
    programs: [],
    fundingEvents: [],
    citations: []
  }
];

describe("atlas viewport filtering", () => {
  it("returns only organizations inside the current visible bounds", () => {
    const ids = organizationIdsInBounds(organizations, {
      west: -64.0,
      south: 44.4,
      east: -63.2,
      north: 45.0
    });

    expect(ids).toEqual(["halifax-organization"]);
  });

  it("excludes organizations without usable coordinates", () => {
    const missingLocationOrganizations = [
      {
        ...organizations[0],
        id: "missing-location",
        primaryLocation: null
      }
    ];

    expect(
      organizationIdsInBounds(missingLocationOrganizations, { west: -141, south: 40, east: -50, north: 75 })
    ).toEqual([]);
  });

  it("rejects collapsed bounds emitted while a mobile map is hidden", () => {
    const collapsed = { west: -94.859, south: 67.374, east: -94.859, north: 67.374 };
    expect(isUsableAtlasBounds(collapsed)).toBe(false);
    expect(organizationIdsInBounds(organizations, collapsed)).toEqual([]);
  });
});
