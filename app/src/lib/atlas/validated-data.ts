import type {
  AtlasCapability,
  AtlasCitation,
  AtlasCluster,
  AtlasDemandRequirement,
  AtlasDemandSource,
  AtlasLocation,
  AtlasMissionArea,
  AtlasOrganization,
  AtlasTechnicalDomain
} from "@/types/atlas";

const reviewedAt = "2026-04-24T00:00:00.000Z";

export const atlasTechnicalDomains: AtlasTechnicalDomain[] = [
  {
    id: "80000000-0000-4000-8000-000000000001",
    slug: "sensing-and-isr",
    name: "Sensing and ISR",
    summary: "Sensors and collection systems that contribute to detection, characterization, and situational awareness."
  },
  {
    id: "80000000-0000-4000-8000-000000000002",
    slug: "autonomous-systems",
    name: "Autonomous Systems",
    summary: "Uncrewed and autonomous platforms for persistent operation in maritime, undersea, air, or land environments."
  },
  {
    id: "80000000-0000-4000-8000-000000000003",
    slug: "mission-software-and-data",
    name: "Mission Software and Data",
    summary: "Software for mission visualization, geospatial awareness, sensor integration, and operator decision support."
  },
  {
    id: "80000000-0000-4000-8000-000000000004",
    slug: "space-and-earth-observation",
    name: "Space and Earth Observation",
    summary: "Space systems and Earth-observation services that provide persistent, wide-area context."
  }
];

export const atlasMissionAreas: AtlasMissionArea[] = [
  {
    id: "81000000-0000-4000-8000-000000000001",
    slug: "arctic-domain-awareness",
    name: "Arctic Domain Awareness",
    summary: "Persistent sensing, monitoring, and data integration for awareness across Canada's northern and maritime approaches.",
    sourceConfidence: "moderate"
  },
  {
    id: "81000000-0000-4000-8000-000000000002",
    slug: "underwater-isr",
    name: "Underwater ISR",
    summary: "Detection, survey, characterization, and persistent awareness for undersea environments and infrastructure.",
    sourceConfidence: "moderate"
  },
  {
    id: "81000000-0000-4000-8000-000000000003",
    slug: "autonomous-patrol-and-monitoring",
    name: "Autonomous Patrol and Monitoring",
    summary: "Uncrewed systems and operator tools that extend persistent monitoring with reduced personnel exposure.",
    sourceConfidence: "moderate"
  },
  {
    id: "81000000-0000-4000-8000-000000000004",
    slug: "edge-data-processing",
    name: "Edge Data Processing",
    summary: "Local processing, visualization, and integration that supports decisions when bandwidth or connectivity is constrained.",
    sourceConfidence: "moderate"
  }
];

const domainsBySlug = new Map(atlasTechnicalDomains.map((domain) => [domain.slug, domain]));
const missionsBySlug = new Map(atlasMissionAreas.map((mission) => [mission.slug, mission]));

function citation(input: Omit<AtlasCitation, "publishedAt"> & { publishedAt?: string | null }): AtlasCitation {
  return {
    ...input,
    publishedAt: input.publishedAt ?? null
  };
}

const krakenCompanyCitation = citation({
  id: "60000000-0000-4000-8000-000000000001",
  fieldName: "description",
  sourceTitle: "Kraken Robotics Announces Orders For Synthetic Aperture Sonar And Subsea Batteries",
  sourceUrl:
    "https://www.krakenrobotics.com/news-releases/kraken-robotics-announces-12-million-in-orders-for-synthetic-aperture-sonar-and-subsea-batteries/",
  publisher: "Kraken Robotics",
  sourceType: "company_news",
  excerpt: "Kraken describes a Canadian subsea intelligence portfolio spanning sonar, underwater imaging, subsea power, and robotic systems.",
  publishedAt: "2025-12-02T00:00:00.000Z"
});

const krakenCapabilityCitation = citation({
  id: "60000000-0000-4000-8000-000000000002",
  fieldName: "summary",
  sourceTitle: "KATFISH Towed SAS",
  sourceUrl: "https://www.krakenrobotics.com/products/katfish",
  publisher: "Kraken Robotics",
  sourceType: "company_website",
  excerpt: "The KATFISH page describes an actively stabilized towed synthetic aperture sonar system for high-resolution underwater data collection."
});

const mdaCompanyCitation = citation({
  id: "60000000-0000-4000-8000-000000000003",
  fieldName: "description",
  sourceTitle: "MDA CHORUS",
  sourceUrl: "https://mda.space/chorus/",
  publisher: "MDA Space",
  sourceType: "company_website",
  excerpt: "MDA presents Earth observation and radar satellite capability as part of its space mission systems portfolio."
});

const mdaCapabilityCitation = citation({
  id: "60000000-0000-4000-8000-000000000004",
  fieldName: "summary",
  sourceTitle: "MDA CHORUS",
  sourceUrl: "https://mda.space/chorus/",
  publisher: "MDA Space",
  sourceType: "company_website",
  excerpt: "The CHORUS page describes a next-generation Earth observation constellation using C-band and X-band synthetic aperture radar."
});

const cellulaCompanyCitation = citation({
  id: "60000000-0000-4000-8000-000000000005",
  fieldName: "description",
  sourceTitle: "Envoy AUV",
  sourceUrl: "https://cellula.com/envoy-auv/",
  publisher: "Cellula Robotics",
  sourceType: "company_website",
  excerpt: "Cellula presents underwater robotic vehicle capability through its Envoy autonomous underwater vehicle product page."
});

const cellulaCapabilityCitation = citation({
  id: "60000000-0000-4000-8000-000000000006",
  fieldName: "summary",
  sourceTitle: "Envoy AUV",
  sourceUrl: "https://cellula.com/envoy-auv/",
  publisher: "Cellula Robotics",
  sourceType: "company_website",
  excerpt: "The Envoy page describes a fuel-cell-powered underwater vehicle designed for long-endurance subsea operation."
});

const kongsbergCompanyCitation = citation({
  id: "60000000-0000-4000-8000-000000000007",
  fieldName: "description",
  sourceTitle: "IRIS Terminal",
  sourceUrl: "https://www.kongsberggeospatial.com/products/iris-terminal",
  publisher: "Kongsberg Geospatial",
  sourceType: "company_website",
  excerpt: "Kongsberg Geospatial positions IRIS Terminal around airspace visualization and support for uncrewed systems operations."
});

const kongsbergCapabilityCitation = citation({
  id: "60000000-0000-4000-8000-000000000008",
  fieldName: "summary",
  sourceTitle: "IRIS Terminal",
  sourceUrl: "https://www.kongsberggeospatial.com/products/iris-terminal",
  publisher: "Kongsberg Geospatial",
  sourceType: "company_website",
  excerpt: "IRIS Terminal is described as software combining sensor, feed, and telemetry inputs for professional drone and airspace managers."
});

const geospectrumCompanyCitation = citation({
  id: "60000000-0000-4000-8000-000000000009",
  fieldName: "description",
  sourceTitle: "TRAPS Towed Reelable Active Passive Sonar",
  sourceUrl:
    "https://geospectrum.ca/catalog/defence/surface-systems/traps-towed-reelable-active-passive-sonar/",
  publisher: "GeoSpectrum Technologies",
  sourceType: "company_website",
  excerpt: "GeoSpectrum presents underwater acoustic and sonar products for defence and surveillance surface-system applications."
});

const geospectrumCapabilityCitation = citation({
  id: "60000000-0000-4000-8000-000000000010",
  fieldName: "summary",
  sourceTitle: "TRAPS Towed Reelable Active Passive Sonar",
  sourceUrl:
    "https://geospectrum.ca/catalog/defence/surface-systems/traps-towed-reelable-active-passive-sonar/",
  publisher: "GeoSpectrum Technologies",
  sourceType: "company_website",
  excerpt: "TRAPS is described as an active-passive sonar system for detection, classification, tracking, and localization of underwater targets."
});

const openOceanCompanyCitation = citation({
  id: "60000000-0000-4000-8000-000000000011",
  fieldName: "description",
  sourceTitle: "Open Ocean Robotics",
  sourceUrl: "https://www.openoceanrobotics.com/",
  publisher: "Open Ocean Robotics",
  sourceType: "company_website",
  excerpt: "Open Ocean Robotics describes autonomous uncrewed surface vessels for maritime security and ocean data collection."
});

const openOceanCapabilityCitation = citation({
  id: "60000000-0000-4000-8000-000000000012",
  fieldName: "summary",
  sourceTitle: "Open Ocean Robotics",
  sourceUrl: "https://www.openoceanrobotics.com/",
  publisher: "Open Ocean Robotics",
  sourceType: "company_website",
  excerpt: "The company frames its uncrewed vessels as persistent autonomous platforms for ocean monitoring and maritime awareness."
});

const locations: Record<string, AtlasLocation> = {
  kraken: {
    id: "30000000-0000-4000-8000-000000000001",
    name: "St. John's, Newfoundland and Labrador",
    city: "St. John's",
    provinceTerritory: "Newfoundland and Labrador",
    countryCode: "CA",
    latitude: 47.5615,
    longitude: -52.7126,
    geographicConfidence: "city_centroid",
    regionSlug: "atlantic-canada"
  },
  mda: {
    id: "30000000-0000-4000-8000-000000000002",
    name: "Brampton, Ontario",
    city: "Brampton",
    provinceTerritory: "Ontario",
    countryCode: "CA",
    latitude: 43.7315,
    longitude: -79.7624,
    geographicConfidence: "city_centroid",
    regionSlug: "ontario"
  },
  cellula: {
    id: "30000000-0000-4000-8000-000000000003",
    name: "Burnaby, British Columbia",
    city: "Burnaby",
    provinceTerritory: "British Columbia",
    countryCode: "CA",
    latitude: 49.2488,
    longitude: -122.9805,
    geographicConfidence: "city_centroid",
    regionSlug: "british-columbia"
  },
  kongsberg: {
    id: "30000000-0000-4000-8000-000000000004",
    name: "Ottawa, Ontario",
    city: "Ottawa",
    provinceTerritory: "Ontario",
    countryCode: "CA",
    latitude: 45.4215,
    longitude: -75.6972,
    geographicConfidence: "city_centroid",
    regionSlug: "ontario"
  },
  geospectrum: {
    id: "30000000-0000-4000-8000-000000000005",
    name: "Dartmouth, Nova Scotia",
    city: "Dartmouth",
    provinceTerritory: "Nova Scotia",
    countryCode: "CA",
    latitude: 44.6661,
    longitude: -63.5728,
    geographicConfidence: "city_centroid",
    regionSlug: "atlantic-canada"
  },
  openOcean: {
    id: "30000000-0000-4000-8000-000000000006",
    name: "Victoria, British Columbia",
    city: "Victoria",
    provinceTerritory: "British Columbia",
    countryCode: "CA",
    latitude: 48.4284,
    longitude: -123.3656,
    geographicConfidence: "city_centroid",
    regionSlug: "british-columbia"
  }
};

function missionMatch(
  id: string,
  missionSlug: string,
  alignmentSummary: string,
  confidence: "high" | "moderate",
  sourceCitation: AtlasCitation
) {
  const missionArea = missionsBySlug.get(missionSlug);

  if (!missionArea) {
    throw new Error(`Missing mission area ${missionSlug}`);
  }

  return {
    id,
    missionArea,
    alignmentSummary,
    matchType: "derived" as const,
    confidence,
    citations: [{ ...sourceCitation, fieldName: "alignmentSummary" }]
  };
}

function domain(...slugs: string[]) {
  return slugs.map((slug) => {
    const value = domainsBySlug.get(slug);
    if (!value) {
      throw new Error(`Missing technical domain ${slug}`);
    }
    return value;
  });
}

const capabilities: Record<string, AtlasCapability> = {
  kraken: {
    id: "20000000-0000-4000-8000-000000000001",
    organizationId: "10000000-0000-4000-8000-000000000001",
    slug: "kraken-katfish-sas",
    name: "KATFISH Towed Synthetic Aperture Sonar",
    summary:
      "Actively stabilized towed synthetic aperture sonar system for high-resolution underwater survey, seabed imaging, and subsea object detection.",
    capabilityType: "Towed Synthetic Aperture Sonar",
    coreFeatures: ["High-resolution underwater survey", "Seabed imaging", "Subsea object detection"],
    technologyReadinessLevel: null,
    maturity: null,
    commercialAvailability: null,
    defenceApplications: ["Underwater ISR", "Route survey", "Subsea infrastructure awareness"],
    novelty: [],
    technicalTags: ["hardware", "underwater_sensing", "synthetic_aperture_sonar", "maritime"],
    technicalDomains: domain("sensing-and-isr"),
    missionMatches: [
      missionMatch(
        "82000000-0000-4000-8000-000000000001",
        "underwater-isr",
        "High-resolution towed synthetic aperture sonar can support undersea survey and seabed characterization where persistent underwater awareness is required.",
        "high",
        krakenCapabilityCitation
      ),
      missionMatch(
        "82000000-0000-4000-8000-000000000002",
        "arctic-domain-awareness",
        "The capability may contribute to northern maritime awareness when undersea survey and detection gaps are relevant; Arctic operating assumptions still require validation.",
        "moderate",
        krakenCapabilityCitation
      )
    ],
    demandMatches: [],
    sourceConfidence: "high",
    lastReviewedAt: reviewedAt,
    citations: [krakenCapabilityCitation]
  },
  mda: {
    id: "20000000-0000-4000-8000-000000000002",
    organizationId: "10000000-0000-4000-8000-000000000002",
    slug: "mda-chorus-sar",
    name: "MDA CHORUS Synthetic Aperture Radar Constellation",
    summary:
      "Next-generation C-band and X-band synthetic aperture radar constellation intended to provide all-weather day-night Earth observation data.",
    capabilityType: "Earth Observation SAR Constellation",
    coreFeatures: ["C-band synthetic aperture radar", "X-band synthetic aperture radar", "All-weather Earth observation"],
    technologyReadinessLevel: null,
    maturity: null,
    commercialAvailability: null,
    defenceApplications: ["Arctic domain awareness", "Maritime monitoring", "Distributed sensor fusion"],
    novelty: [],
    technicalTags: ["space", "earth_observation", "synthetic_aperture_radar", "maritime"],
    technicalDomains: domain("space-and-earth-observation", "sensing-and-isr"),
    missionMatches: [
      missionMatch(
        "82000000-0000-4000-8000-000000000003",
        "arctic-domain-awareness",
        "All-weather synthetic aperture radar can provide persistent overhead context where weather and distance limit other collection methods.",
        "high",
        mdaCapabilityCitation
      )
    ],
    demandMatches: [],
    sourceConfidence: "high",
    lastReviewedAt: reviewedAt,
    citations: [mdaCapabilityCitation]
  },
  cellula: {
    id: "20000000-0000-4000-8000-000000000003",
    organizationId: "10000000-0000-4000-8000-000000000003",
    slug: "cellula-envoy-auv",
    name: "Envoy Long-Endurance Autonomous Underwater Vehicle",
    summary:
      "Long-endurance fuel-cell autonomous underwater vehicle designed for persistent subsea missions and extended underwater operation.",
    capabilityType: "Autonomous Underwater Vehicle",
    coreFeatures: ["Fuel-cell propulsion", "Long-endurance subsea operation", "Autonomous underwater vehicle"],
    technologyReadinessLevel: null,
    maturity: null,
    commercialAvailability: null,
    defenceApplications: ["Undersea route reconnaissance", "Subsea infrastructure monitoring", "Extended underwater patrol validation"],
    novelty: [],
    technicalTags: ["hardware", "autonomous_systems", "auv", "undersea"],
    technicalDomains: domain("autonomous-systems"),
    missionMatches: [
      missionMatch(
        "82000000-0000-4000-8000-000000000004",
        "underwater-isr",
        "A long-endurance autonomous underwater vehicle can extend survey and patrol reach, subject to validation of payloads, recovery concepts, and operating conditions.",
        "moderate",
        cellulaCapabilityCitation
      )
    ],
    demandMatches: [],
    sourceConfidence: "moderate",
    lastReviewedAt: reviewedAt,
    citations: [cellulaCapabilityCitation]
  },
  kongsberg: {
    id: "20000000-0000-4000-8000-000000000004",
    organizationId: "10000000-0000-4000-8000-000000000004",
    slug: "kongsberg-iris-terminal",
    name: "IRIS Terminal Airspace Visualization",
    summary:
      "Airspace visualization and situational awareness software that combines sensor, telemetry, and air traffic inputs for uncrewed operations.",
    capabilityType: "Mission Visualization Software",
    coreFeatures: ["Sensor and telemetry fusion", "Airspace visualization", "Uncrewed operations awareness"],
    technologyReadinessLevel: null,
    maturity: null,
    commercialAvailability: null,
    defenceApplications: ["Uncrewed system deconfliction", "BVLOS test-range visualization", "Local mission visualization"],
    novelty: [],
    technicalTags: ["software", "geospatial", "mission_visualization", "uncrewed_systems"],
    technicalDomains: domain("mission-software-and-data"),
    missionMatches: [
      missionMatch(
        "82000000-0000-4000-8000-000000000005",
        "autonomous-patrol-and-monitoring",
        "Sensor, telemetry, and airspace visualization can support deconfliction and situational awareness for uncrewed patrol trials.",
        "high",
        kongsbergCapabilityCitation
      ),
      missionMatch(
        "82000000-0000-4000-8000-000000000006",
        "edge-data-processing",
        "A common local visualization layer can reduce operator burden when telemetry, sensor, and airspace context would otherwise be separated.",
        "moderate",
        kongsbergCapabilityCitation
      )
    ],
    demandMatches: [],
    sourceConfidence: "high",
    lastReviewedAt: reviewedAt,
    citations: [kongsbergCapabilityCitation]
  },
  geospectrum: {
    id: "20000000-0000-4000-8000-000000000005",
    organizationId: "10000000-0000-4000-8000-000000000005",
    slug: "geospectrum-traps-sonar",
    name: "TRAPS Towed Reelable Active Passive Sonar",
    summary:
      "Compact active-passive variable-depth sonar system for underwater target detection, classification, tracking, and localization.",
    capabilityType: "Active Passive Towed Sonar",
    coreFeatures: ["Active-passive sonar", "Variable-depth operation", "Underwater target localization"],
    technologyReadinessLevel: null,
    maturity: null,
    commercialAvailability: null,
    defenceApplications: ["Underwater surveillance", "Target detection and tracking", "Surface and uncrewed platform integration"],
    novelty: [],
    technicalTags: ["hardware", "sonar", "underwater_acoustics", "maritime"],
    technicalDomains: domain("sensing-and-isr"),
    missionMatches: [
      missionMatch(
        "82000000-0000-4000-8000-000000000007",
        "underwater-isr",
        "Compact active-passive sonar can add underwater target detection and tracking to surface or uncrewed platforms.",
        "high",
        geospectrumCapabilityCitation
      )
    ],
    demandMatches: [],
    sourceConfidence: "high",
    lastReviewedAt: reviewedAt,
    citations: [geospectrumCapabilityCitation]
  },
  openOcean: {
    id: "20000000-0000-4000-8000-000000000006",
    organizationId: "10000000-0000-4000-8000-000000000006",
    slug: "open-ocean-robotics-usv-maritime-awareness",
    name: "Autonomous USV Maritime Awareness Platform",
    summary:
      "Autonomous uncrewed surface vessel platform for persistent maritime security, ocean data collection, and remote maritime awareness.",
    capabilityType: "Autonomous Surface Vehicle",
    coreFeatures: ["Autonomous surface operation", "Persistent ocean monitoring", "Remote maritime data collection"],
    technologyReadinessLevel: null,
    maturity: null,
    commercialAvailability: null,
    defenceApplications: ["Persistent maritime awareness", "Ocean data collection", "Surface collection for distributed awareness"],
    novelty: [],
    technicalTags: ["hardware", "autonomous_systems", "usv", "maritime"],
    technicalDomains: domain("autonomous-systems", "sensing-and-isr"),
    missionMatches: [
      missionMatch(
        "82000000-0000-4000-8000-000000000008",
        "arctic-domain-awareness",
        "Persistent uncrewed surface collection may extend maritime awareness in sparse regions; Arctic-specific reliability and payload integration require validation.",
        "moderate",
        openOceanCapabilityCitation
      )
    ],
    demandMatches: [],
    sourceConfidence: "moderate",
    lastReviewedAt: reviewedAt,
    citations: [openOceanCapabilityCitation]
  }
};

function organization(input: {
  id: string;
  slug: string;
  name: string;
  description: string;
  websiteUrl: string;
  categories: string[];
  confidence: "high" | "moderate";
  location: AtlasLocation;
  capability: AtlasCapability;
  citation: AtlasCitation;
}): AtlasOrganization {
  return {
    id: input.id,
    slug: input.slug,
    name: input.name,
    legalName: null,
    description: input.description,
    websiteUrl: input.websiteUrl,
    entityKind: "company",
    categories: input.categories,
    sourceConfidence: input.confidence,
    freshnessStatus: "current",
    lastReviewedAt: reviewedAt,
    primaryLocation: input.location,
    locations: [input.location],
    foundedYear: null,
    employeeRange: null,
    companyStage: null,
    ownership: null,
    commercialStatus: null,
    disclosedFinancingSummary: null,
    defencePosture: null,
    dualUsePosture: null,
    profileData: {},
    capabilities: [input.capability],
    programs: [],
    fundingEvents: [],
    citations: [input.citation]
  };
}

export const atlasOrganizations: AtlasOrganization[] = [
  organization({
    id: "10000000-0000-4000-8000-000000000001",
    slug: "kraken-robotics",
    name: "Kraken Robotics",
    description:
      "Canadian subsea technology company with synthetic aperture sonar, underwater imaging, subsea power, and robotic systems relevant to underwater awareness and autonomous maritime operations.",
    websiteUrl: "https://www.krakenrobotics.com/",
    categories: ["commercial_company", "defence_supplier", "dual_use"],
    confidence: "high",
    location: locations.kraken,
    capability: capabilities.kraken,
    citation: krakenCompanyCitation
  }),
  organization({
    id: "10000000-0000-4000-8000-000000000002",
    slug: "mda-space",
    name: "MDA Space",
    description:
      "Canadian space and mission systems company with Earth observation, radar, space robotics, satellite operations, and maritime awareness capabilities.",
    websiteUrl: "https://mda.space/",
    categories: ["commercial_company", "space_company", "dual_use"],
    confidence: "high",
    location: locations.mda,
    capability: capabilities.mda,
    citation: mdaCompanyCitation
  }),
  organization({
    id: "10000000-0000-4000-8000-000000000003",
    slug: "cellula-robotics",
    name: "Cellula Robotics",
    description:
      "Canadian underwater robotics company developing long-endurance autonomous underwater vehicles and related subsea autonomy systems.",
    websiteUrl: "https://cellula.com/",
    categories: ["commercial_company", "autonomous_systems", "dual_use"],
    confidence: "moderate",
    location: locations.cellula,
    capability: capabilities.cellula,
    citation: cellulaCompanyCitation
  }),
  organization({
    id: "10000000-0000-4000-8000-000000000004",
    slug: "kongsberg-geospatial",
    name: "Kongsberg Geospatial",
    description:
      "Ottawa-based geospatial software company providing airspace visualization, uncrewed systems awareness, and mission display software for complex operations.",
    websiteUrl: "https://www.kongsberggeospatial.com/",
    categories: ["commercial_company", "software_company", "dual_use"],
    confidence: "high",
    location: locations.kongsberg,
    capability: capabilities.kongsberg,
    citation: kongsbergCompanyCitation
  }),
  organization({
    id: "10000000-0000-4000-8000-000000000005",
    slug: "geospectrum-technologies",
    name: "GeoSpectrum Technologies",
    description:
      "Nova Scotia underwater acoustics company offering sonar, acoustic sensors, and defence surveillance systems for surface and subsea applications.",
    websiteUrl: "https://geospectrum.ca/",
    categories: ["commercial_company", "defence_supplier", "dual_use"],
    confidence: "high",
    location: locations.geospectrum,
    capability: capabilities.geospectrum,
    citation: geospectrumCompanyCitation
  }),
  organization({
    id: "10000000-0000-4000-8000-000000000006",
    slug: "open-ocean-robotics",
    name: "Open Ocean Robotics",
    description:
      "Canadian marine robotics company developing autonomous uncrewed surface vehicles and maritime data services for persistent ocean monitoring.",
    websiteUrl: "https://www.openoceanrobotics.com/",
    categories: ["commercial_company", "autonomous_systems", "dual_use"],
    confidence: "moderate",
    location: locations.openOcean,
    capability: capabilities.openOcean,
    citation: openOceanCompanyCitation
  })
];

const demandSource: AtlasDemandSource = {
  id: "70000000-0000-4000-8000-000000000001",
  slug: "nato-aggregated-demand-signal-2026",
  title: "NATO Aggregated Demand Signal to Industry and Innovation Ecosystems Across the Alliance",
  publisher: "NATO",
  publishedOn: "2026-07-01",
  classificationLabel: "NATO UNCLASSIFIED",
  summary:
    "A public, problem-led signal intended to inform industry and innovation ecosystems. It is not a procurement notice and does not establish eligibility or endorsement.",
  sourceUrl: "https://www.nato.int/en/work-with-us/business-and-project-opportunities/demand-signal"
};

function demandRequirement(input: {
  id: string;
  slug: string;
  title: string;
  problemStatement: string;
  desiredEndState: string;
  displayOrder: number;
  citationId: string;
}): AtlasDemandRequirement {
  return {
    id: input.id,
    slug: input.slug,
    title: input.title,
    problemStatement: input.problemStatement,
    desiredEndState: input.desiredEndState,
    publicCaveat:
      "Public-source alignment only. This is not procurement eligibility, NATO endorsement, or a classified requirement.",
    displayOrder: input.displayOrder,
    source: demandSource,
    matches: [],
    citations: [
      citation({
        id: input.citationId,
        fieldName: "title",
        sourceTitle: demandSource.title,
        sourceUrl: demandSource.sourceUrl,
        publisher: demandSource.publisher,
        sourceType: "government_policy",
        excerpt: input.title,
        publishedAt: demandSource.publishedOn
      })
    ]
  };
}

export const atlasDemandRequirements: AtlasDemandRequirement[] = [
  demandRequirement({
    id: "71000000-0000-4000-8000-000000000001",
    slug: "land-formation-combat-effectiveness",
    title: "Enhancing the combat effectiveness of large land formations",
    problemStatement:
      "Allied land forces need greater lethality, mobility, protection, coordination, and precision across varied terrain, climate, visibility, and contested electromagnetic conditions.",
    desiredEndState:
      "Solutions should improve the speed, precision, persistence, survivability, and interoperability of land operations, including the integration of uncrewed systems.",
    displayOrder: 1,
    citationId: "60000000-0000-4000-8000-000000000013"
  }),
  demandRequirement({
    id: "71000000-0000-4000-8000-000000000002",
    slug: "air-and-missile-defence",
    title: "Defending against air and missile attacks",
    problemStatement:
      "Allied forces and critical infrastructure face increasingly diverse air and missile threats that must be detected, tracked, prioritized, and engaged under all-weather, high-readiness conditions.",
    desiredEndState:
      "Solutions should strengthen layered defence, resilient command and communications, real-time data exchange, mobility, magazine depth, and interoperability.",
    displayOrder: 2,
    citationId: "60000000-0000-4000-8000-000000000014"
  }),
  demandRequirement({
    id: "71000000-0000-4000-8000-000000000003",
    slug: "deep-strike",
    title: "Delivering effective deep strikes",
    problemStatement:
      "Heavily defended and dispersed high-value targets at extended range create precision, coordination, and survivability challenges in denied or degraded environments.",
    desiredEndState:
      "Solutions should support precise, rapid, and accurate effects at varying ranges while minimizing unintended impacts and maintaining interoperability.",
    displayOrder: 3,
    citationId: "60000000-0000-4000-8000-000000000015"
  }),
  demandRequirement({
    id: "71000000-0000-4000-8000-000000000004",
    slug: "medical-treatment-and-evacuation",
    title: "Providing rapid and scalable medical treatment and evacuation",
    problemStatement:
      "Allied forces need a connected medical architecture for casualty collection, patient flow, treatment, and protected evacuation across terrain, extreme weather, contested, and CBRN-affected environments.",
    desiredEndState:
      "Solutions should improve deployable, modular, scalable, adaptable, and interoperable evacuation, trauma care, intensive care, diagnostics, and CBRN treatment.",
    displayOrder: 4,
    citationId: "60000000-0000-4000-8000-000000000016"
  }),
  demandRequirement({
    id: "71000000-0000-4000-8000-000000000005",
    slug: "logistics-and-sustainment",
    title: "Efficient, reliable and adaptable logistics to sustain military operations",
    problemStatement:
      "Military operations require resilient logistics networks that can preserve resupply, mobility, readiness, and multinational interoperability when infrastructure and supply chains are contested or degraded.",
    desiredEndState:
      "Solutions should improve cost-effectiveness, delivery in austere and extreme-weather conditions, mobility, durability, scalability, and interoperability.",
    displayOrder: 5,
    citationId: "60000000-0000-4000-8000-000000000017"
  })
];

export const atlasClusters: AtlasCluster[] = [
  {
    id: "83000000-0000-4000-8000-000000000001",
    slug: "atlantic-ocean-sensing-and-autonomy",
    name: "Ocean Sensing and Autonomy",
    summary:
      "An editorial cluster of published Atlantic Canadian organizations working in ocean sensing, sonar, and autonomous maritime systems.",
    regionSlug: "atlantic-canada",
    clusterBasis: "editorial",
    capabilityIds: [capabilities.kraken.id, capabilities.geospectrum.id]
  },
  {
    id: "83000000-0000-4000-8000-000000000002",
    slug: "ontario-space-and-mission-systems",
    name: "Space and Mission Systems",
    summary:
      "An editorial cluster of published Ontario organizations contributing space-based awareness and mission visualization.",
    regionSlug: "ontario",
    clusterBasis: "editorial",
    capabilityIds: [capabilities.mda.id, capabilities.kongsberg.id]
  },
  {
    id: "83000000-0000-4000-8000-000000000003",
    slug: "british-columbia-marine-autonomy",
    name: "Marine Autonomy",
    summary:
      "An editorial cluster of published British Columbia organizations developing autonomous maritime and undersea platforms.",
    regionSlug: "british-columbia",
    clusterBasis: "editorial",
    capabilityIds: [capabilities.cellula.id, capabilities.openOcean.id]
  }
];
