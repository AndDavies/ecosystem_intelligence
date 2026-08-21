export const relationshipPresentationVersion = "relationship_presentation_v1" as const;

export type RelationshipPilotTargetType = "mission" | "public_need";

export type RelationshipPilotTreatment = {
  targetType: RelationshipPilotTargetType;
  slug: string;
  contributionSummary: string;
  metadataTitle: string;
  metadataDescription: string;
  directPhrases: readonly string[];
  enablingPhrases: readonly string[];
  adjacentPhrases: readonly string[];
  contextPhrases: readonly string[];
  featureThemes?: readonly {
    key: string;
    label: string;
    phrases: readonly string[];
  }[];
};

export const relationshipPilotCohort = {
  version: relationshipPresentationVersion,
  missions: {
    treatment: ["arctic-domain-awareness"],
    control: ["underwater-isr"]
  },
  publicNeeds: {
    treatment: [
      "persistent-uncrewed-underwater-surveillance",
      "major-event-and-critical-infrastructure-cyber-defence"
    ],
    control: [
      "future-submarine-operational-capability",
      "canadian-submarine-sustainment-and-industrial-capacity"
    ]
  }
} as const;

const treatments: readonly RelationshipPilotTreatment[] = [
  {
    targetType: "mission",
    slug: "arctic-domain-awareness",
    contributionSummary: "The reviewed records suggest that persistent sensing, resilient northern communications, autonomous platforms and analysis closer to the operating edge could contribute to this Mission Area.",
    metadataTitle: "Arctic Domain Awareness: Canadian capability connections",
    metadataDescription: "Inspect Canadian organizations and technologies reviewed against Arctic sensing, surveillance, communications and data-integration needs.",
    directPhrases: [
      "arctic surveillance",
      "domain awareness",
      "persistent sensing",
      "persistent monitoring",
      "under-ice",
      "radar",
      "sonar",
      "acoustic monitoring",
      "remote sensing"
    ],
    enablingPhrases: [
      "satellite communications",
      "beyond line of sight",
      "data fusion",
      "edge processing",
      "sensor integration",
      "remote telemetry"
    ],
    adjacentPhrases: ["general consulting", "office software", "training only"],
    contextPhrases: ["arctic", "northern", "polar", "maritime", "persistent", "surveillance", "sensing", "monitoring", "remote", "ice"],
    featureThemes: [
      {
        key: "all-weather-sensing",
        label: "All-weather sensing",
        phrases: ["synthetic aperture radar", "all weather", "radar", "remote sensing", "persistent sensing", "surveillance"]
      },
      {
        key: "resilient-connectivity",
        label: "Resilient Arctic connectivity",
        phrases: ["arctic connectivity", "high arctic coverage", "connectivity", "satellite communications", "satellite link", "network"]
      },
      {
        key: "persistent-autonomous-platforms",
        label: "Persistent autonomous platforms",
        phrases: ["stratospheric", "high altitude", "long endurance", "autonomous", "uncrewed", "balloon", "vehicle", "vessel"]
      },
      {
        key: "command-data-integration",
        label: "Command and data integration",
        phrases: ["common operating picture", "data fusion", "sensor integration", "edge processing", "command and control", "decision support", "mission data"]
      },
      {
        key: "wide-area-change-detection",
        label: "Wide-area change detection",
        phrases: ["change detection", "rapid response", "wide area monitoring", "earth observation", "geospatial analytics", "alerting"]
      }
    ]
  },
  {
    targetType: "public_need",
    slug: "persistent-uncrewed-underwater-surveillance",
    contributionSummary: "The reviewed records suggest a potential system stack: long-endurance AUVs and deployable sensors could collect; sonar and acoustic processing could detect and classify; communications, launch-and-recovery and integration systems may support sustained operations.",
    metadataTitle: "Persistent underwater surveillance: Canadian capability connections",
    metadataDescription: "Inspect reviewed Canadian AUV, sonar, acoustic-sensing and supporting-system connections to the released persistent underwater-surveillance need.",
    directPhrases: [
      "long-range auv",
      "long range auv",
      "long-endurance",
      "long endurance",
      "autonomous underwater",
      "underwater vehicle",
      "active passive sonar",
      "active-passive sonar",
      "towed sonar",
      "sonar processing",
      "acoustic processing",
      "acoustic sensor processing",
      "hydrophone",
      "underwater acoustic",
      "acoustic surveillance",
      "deployable sensor",
      "sensor buoy",
      "acoustic buoy",
      "recoverable buoy",
      "underwater target",
      "subsurface detection",
      "persistent underwater",
      "under-ice"
    ],
    enablingPhrases: [
      "acoustic gateway",
      "sensor processing",
      "surface host",
      "payload integration",
      "remote telemetry",
      "command and control",
      "seafloor sensing"
    ],
    adjacentPhrases: [
      "potable-water reservoir",
      "potable water reservoir",
      "reservoir inspection",
      "rov survey",
      "rov inspection",
      "rapid deployment rov",
      "rapid-deployment rov",
      "launch and recovery",
      "launch recovery",
      "hull inspection",
      "dock inspection",
      "ship construction",
      "short-duration rov"
    ],
    contextPhrases: ["underwater", "undersea", "subsurface", "autonomous", "uncrewed", "persistent", "covert", "detection", "tracking", "surveillance", "acoustic", "sonar", "arctic"]
  },
  {
    targetType: "public_need",
    slug: "major-event-and-critical-infrastructure-cyber-defence",
    contributionSummary: "The reviewed records suggest that managed threat detection and response, external cyber-threat intelligence and secure communications may contribute most directly. General analytics, ISR and radio software remain broader adjacent records that warrant more scrutiny.",
    metadataTitle: "Major-event cyber defence: Canadian capability connections",
    metadataDescription: "Inspect reviewed Canadian cyber-monitoring, incident-response and secure-coordination connections to this released public need.",
    directPhrases: [
      "incident response",
      "security operations",
      "cyber defence",
      "cyber monitoring",
      "threat monitoring",
      "threat detection",
      "vulnerability assessment",
      "critical infrastructure",
      "digital forensics",
      "endpoint security",
      "cyber threat intelligence",
      "external cyber threat intelligence"
    ],
    enablingPhrases: [
      "identity and access",
      "secure information sharing",
      "secure communications",
      "cyber exercise",
      "tabletop exercise",
      "threat intelligence",
      "zero trust"
    ],
    adjacentPhrases: [
      "general software development",
      "generic cloud hosting",
      "consumer security",
      "underwater acoustic",
      "hydrophone",
      "hyperspectral",
      "airborne c4isr",
      "special-mission aircraft"
    ],
    contextPhrases: ["cyber", "incident", "response", "monitoring", "threat", "vulnerability", "critical infrastructure", "event", "exercise", "secure", "coordination"]
  }
];

export function getRelationshipPilotTreatment(targetType: RelationshipPilotTargetType, slug: string) {
  return treatments.find((treatment) => treatment.targetType === targetType && treatment.slug === slug) ?? null;
}

export function isRelationshipPilotControl(targetType: RelationshipPilotTargetType, slug: string) {
  const controls = targetType === "mission" ? relationshipPilotCohort.missions.control : relationshipPilotCohort.publicNeeds.control;
  return (controls as readonly string[]).includes(slug);
}

export function missionRelationshipMetadataTitles(
  missionName: string,
  treatment: RelationshipPilotTreatment | null
) {
  return treatment
    ? { pageTitle: treatment.metadataTitle, socialTitle: treatment.metadataTitle }
    : { pageTitle: `${missionName} Mission Area`, socialTitle: missionName };
}
