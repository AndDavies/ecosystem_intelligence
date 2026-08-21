import { describe, expect, it } from "vitest";
import { getRelationshipPilotTreatment } from "@/lib/atlas/relationship-pilot";
import {
  countNormalizedPhraseHits,
  broaderDemandRelationshipAssessmentCopy,
  demandRelationshipAssessmentCopy,
  demandRelationshipAssessmentRole,
  orderDemandRelationships,
  orderMissionRelationships,
  relationshipPositionBand,
  relationshipResultMetadata,
  selectDemandMissionLenses,
  selectFeaturedDemandRelationships,
  selectFeaturedMissionRelationshipPresentations,
  selectFeaturedMissionRelationships,
  selectMissionPublicNeedsForPresentation,
  selectRelationshipSignals,
  shouldShowRelationshipTreatmentIntro
} from "@/lib/atlas/relationship-presentation";
import { normalizedPage, paginate } from "@/lib/pagination";
import type { AtlasDemandRequirement, AtlasMissionOrganizationConnection } from "@/types/atlas";

const treatment = getRelationshipPilotTreatment("public_need", "persistent-uncrewed-underwater-surveillance")!;

function citation(id: string, publishedAt = "2026-07-01") {
  return {
    id,
    fieldName: "alignment_summary",
    sourceTitle: `Source ${id}`,
    sourceUrl: `https://example.com/${id}`,
    publisher: "Public source",
    sourceType: "official_company",
    excerpt: "A public description of the capability.",
    publishedAt
  };
}

function demandEntry({
  id,
  organization,
  capability,
  summary,
  alignment = summary,
  citationCount = 2,
  confidence = "moderate",
  sourceConfidence = "moderate"
}: {
  id: string;
  organization: string;
  capability: string;
  summary: string;
  alignment?: string;
  citationCount?: number;
  confidence?: "high" | "moderate" | "needs_review";
  sourceConfidence?: "high" | "moderate" | "needs_review";
}): AtlasDemandRequirement["matches"][number] {
  return {
    organization: { id: `org-${id}`, slug: organization, name: organization, sourceConfidence },
    capability: { id: `cap-${id}`, slug: capability, name: capability, summary },
    match: {
      id,
      demandRequirementId: "persistent-uuv",
      demandSlug: treatment.slug,
      demandTitle: "Persistent underwater surveillance",
      alignmentSummary: alignment,
      matchType: "derived",
      confidence,
      citations: Array.from({ length: citationCount }, (_, index) => citation(`${id}-${index}`))
    }
  };
}

function missionConnection({
  slug,
  name = "Remote sensing radar",
  summary,
  alignment = summary,
  freshness = "current",
  reviewedAt = "2026-08-01",
  capabilityConfidence = "moderate",
  matchConfidence = "moderate",
  technicalDomains = []
}: {
  slug: string;
  name?: string;
  summary: string;
  alignment?: string;
  freshness?: "current" | "review_due" | "stale";
  reviewedAt?: string;
  capabilityConfidence?: "high" | "moderate" | "needs_review";
  matchConfidence?: "high" | "moderate" | "needs_review";
  technicalDomains?: Array<{ id: string; slug: string; name: string; summary: string }>;
}): AtlasMissionOrganizationConnection {
  return {
    organization: {
      id: `org-${slug}`,
      slug,
      name: slug,
      description: summary,
      entityKind: "company",
      sourceConfidence: "moderate",
      freshnessStatus: freshness,
      lastReviewedAt: reviewedAt,
      primaryLocation: null
    },
    capabilities: [{
      id: `cap-${slug}`,
      slug: `cap-${slug}`,
      name,
      summary,
      sourceConfidence: capabilityConfidence,
      technicalDomains,
      assessment: {
        id: `match-${slug}`,
        alignmentSummary: alignment,
        matchType: "derived",
        confidence: matchConfidence
      }
    }],
    strongestConfidence: matchConfidence
  };
}

describe("relationship presentation", () => {
  it("moves direct underwater systems ahead of communications, shipbuilding, inspection ROV and launch-and-recovery adjacency", () => {
    const sample = [
      demandEntry({ id: "nortac", organization: "nortac-defence", capability: "satellite-communications", summary: "Satellite communications and remote telemetry for distributed operations." }),
      demandEntry({ id: "irving", organization: "irving-shipbuilding", capability: "ship-construction", summary: "Ship construction and sustainment for naval fleets." }),
      demandEntry({ id: "aquavision", organization: "aquavision", capability: "reservoir-rov", summary: "A short-duration ROV for potable-water reservoir inspection." }),
      demandEntry({ id: "oceanworks", organization: "oceanworks", capability: "launch-recovery", summary: "Launch and recovery equipment for autonomous underwater vehicles." }),
      demandEntry({ id: "ise", organization: "international-submarine-engineering", capability: "explorer-auv", summary: "A long-range AUV for autonomous underwater persistent surveillance and under-ice operations." }),
      demandEntry({ id: "geospectrum", organization: "geospectrum-technologies", capability: "traps-sonar", summary: "Active-passive towed sonar for subsurface detection and tracking." }),
      demandEntry({ id: "jasco", organization: "jasco-applied-sciences", capability: "acoustic-surveillance", summary: "Underwater acoustic surveillance using hydrophone sensing and analytics." }),
      demandEntry({ id: "dta", organization: "d-ta-systems", capability: "sonar-processing", summary: "Network-attached sonar processing for underwater target detection." }),
      demandEntry({ id: "devocean", organization: "devocean", capability: "recoverable-buoy", summary: "A recoverable acoustic buoy and acoustic gateway for deployable sensing." })
    ];

    const before = sample.map(({ capability }) => capability.slug);
    const after = orderDemandRelationships(sample, treatment).map(({ capability }) => capability.slug);

    expect(before.slice(0, 5)).toEqual(["satellite-communications", "ship-construction", "reservoir-rov", "launch-recovery", "explorer-auv"]);
    expect(after.slice(0, 5)).toEqual([
      "explorer-auv",
      "acoustic-surveillance",
      "traps-sonar",
      "sonar-processing",
      "recoverable-buoy"
    ]);
    expect(after.indexOf("explorer-auv")).toBeLessThan(after.indexOf("launch-recovery"));
    expect(after.indexOf("traps-sonar")).toBeLessThan(after.indexOf("satellite-communications"));
    expect(after.indexOf("recoverable-buoy")).toBeLessThan(after.indexOf("reservoir-rov"));
  });

  it("is deterministic with stable ties and does not reward unbounded source volume", () => {
    const alpha = demandEntry({ id: "alpha", organization: "alpha", capability: "same-system-a", summary: "Towed sonar for underwater surveillance.", citationCount: 2 });
    const zulu = demandEntry({ id: "zulu", organization: "zulu", capability: "same-system-z", summary: "Towed sonar for underwater surveillance.", citationCount: 20 });

    const first = orderDemandRelationships([zulu, alpha], treatment).map(({ organization }) => organization.slug);
    const second = orderDemandRelationships([alpha, zulu], treatment).map(({ organization }) => organization.slug);

    expect(first).toEqual(["alpha", "zulu"]);
    expect(second).toEqual(first);
  });

  it("does not let demand records gain from unavailable capability confidence or freshness", () => {
    const alpha = demandEntry({ id: "alpha-neutral", organization: "alpha", capability: "same-a", summary: "Towed sonar for underwater surveillance.", sourceConfidence: "needs_review" });
    const zulu = demandEntry({ id: "zulu-fabricated", organization: "zulu", capability: "same-z", summary: "Towed sonar for underwater surveillance.", sourceConfidence: "high" });

    expect(orderDemandRelationships([zulu, alpha], treatment).map((entry) => entry.organization.slug))
      .toEqual(["alpha", "zulu"]);
  });

  it("keeps material-gap matches behind direct functions even when the weaker match has more evidence", () => {
    const direct = demandEntry({ id: "direct", organization: "direct", capability: "auv", summary: "Long-endurance autonomous underwater vehicle for persistent underwater surveillance.", citationCount: 1, confidence: "moderate" });
    const gap = demandEntry({ id: "gap", organization: "gap", capability: "reservoir-rov", summary: "Potable-water reservoir inspection ROV.", citationCount: 12, confidence: "high", sourceConfidence: "high" });

    expect(orderDemandRelationships([gap, direct], treatment)[0]?.match.id).toBe("direct");
  });

  it("does not penalize a direct capability merely because it also names an adjacent function", () => {
    const directWithAdjacency = demandEntry({
      id: "direct-adjacent",
      organization: "direct-adjacent",
      capability: "auv-launch-recovery",
      summary: "Long-endurance autonomous underwater vehicle with launch and recovery support for persistent underwater surveillance."
    });
    const generic = demandEntry({
      id: "generic",
      organization: "generic",
      capability: "maritime-monitoring",
      summary: "Maritime monitoring technology for distributed operations."
    });

    expect(orderDemandRelationships([generic, directWithAdjacency], treatment)[0]?.match.id).toBe("direct-adjacent");
  });

  it("keeps a one-hit direct sonar record ahead of generic overlap even when it also names one adjacent function", () => {
    const directWithEqualAdjacency = demandEntry({
      id: "direct-equal-adjacent",
      organization: "direct-equal-adjacent",
      capability: "sonar-launch-recovery",
      summary: "Towed sonar with launch and recovery."
    });
    const generic = demandEntry({
      id: "generic-monitoring",
      organization: "generic-monitoring",
      capability: "maritime-monitoring",
      summary: "Maritime monitoring technology for distributed operations."
    });

    expect(orderDemandRelationships([generic, directWithEqualAdjacency], treatment)[0]?.match.id)
      .toBe("direct-equal-adjacent");
  });

  it("counts formatting aliases as one semantic phrase", () => {
    expect(countNormalizedPhraseHits(
      "Long-range AUV with active-passive sonar.",
      ["long-range auv", "long range auv", "active passive sonar", "active-passive sonar"]
    )).toBe(2);
  });

  it("features only direct, supported Public Need connections and never pads with adjacency", () => {
    const cyber = getRelationshipPilotTreatment("public_need", "major-event-and-critical-infrastructure-cyber-defence")!;
    const ordered = orderDemandRelationships([
      demandEntry({ id: "detection", organization: "detection", capability: "detection", summary: "Managed threat detection and security operations for critical infrastructure." }),
      demandEntry({ id: "response", organization: "response", capability: "response", summary: "Digital forensics and incident response for cyber defence." }),
      demandEntry({ id: "secure", organization: "secure", capability: "secure", summary: "Cyber monitoring with secure communications and threat intelligence for incident coordination." }),
      demandEntry({ id: "analytics", organization: "analytics", capability: "analytics", summary: "General software development and analytics." }),
      demandEntry({ id: "isr", organization: "isr", capability: "isr", summary: "Airborne C4ISR and special-mission aircraft integration." })
    ], cyber);

    expect(selectFeaturedDemandRelationships(ordered, cyber).map((entry) => entry.match.id))
      .toEqual(["detection", "response", "secure"]);
  });

  it("labels treatment contribution roles from the same private presentation components", () => {
    const cyber = getRelationshipPilotTreatment("public_need", "major-event-and-critical-infrastructure-cyber-defence")!;
    const direct = demandEntry({ id: "direct-cyber", organization: "direct", capability: "detection", summary: "Managed threat detection and security operations for critical infrastructure." });
    const enabling = demandEntry({ id: "enabling-cyber", organization: "enabling", capability: "identity", summary: "Identity and access controls for secure collaboration." });
    const jasco = demandEntry({ id: "jasco-cyber", organization: "jasco", capability: "acoustics", summary: "Underwater acoustic defence systems and hydrophone analytics." });
    const pal = demandEntry({ id: "pal-cyber", organization: "pal", capability: "c4isr", summary: "Airborne C4ISR and special-mission aircraft integration." });

    expect(demandRelationshipAssessmentRole(direct, cyber)).toBe("direct");
    expect(demandRelationshipAssessmentRole(enabling, cyber)).toBe("enabling");
    expect(demandRelationshipAssessmentRole(jasco, cyber)).toBe("broader");
    expect(demandRelationshipAssessmentRole(pal, cyber)).toBe("broader");
  });

  it("replaces a broader treatment overclaim while preserving direct assessment copy", () => {
    const cyber = getRelationshipPilotTreatment("public_need", "major-event-and-critical-infrastructure-cyber-defence")!;
    const broader = demandEntry({
      id: "jasco-cyber-copy",
      organization: "jasco",
      capability: "acoustics",
      summary: "Underwater acoustic defence systems and hydrophone analytics.",
      alignment: "Underwater acoustics may help cyber defence."
    });
    const direct = demandEntry({
      id: "direct-cyber-copy",
      organization: "direct",
      capability: "detection",
      summary: "Managed threat detection and security operations for critical infrastructure.",
      alignment: "Managed threat detection may help cyber-defence teams."
    });

    expect(demandRelationshipAssessmentCopy(demandRelationshipAssessmentRole(broader, cyber), broader.match.alignmentSummary))
      .toBe(broaderDemandRelationshipAssessmentCopy);
    expect(broaderDemandRelationshipAssessmentCopy).not.toContain("may help");
    expect(demandRelationshipAssessmentCopy(demandRelationshipAssessmentRole(direct, cyber), direct.match.alignmentSummary))
      .toBe(direct.match.alignmentSummary);
  });

  it("uses evidence confidence and freshness only after equivalent functional relevance", () => {
    const arctic = getRelationshipPilotTreatment("mission", "arctic-domain-awareness")!;
    const stale = missionConnection({ slug: "stale", summary: "Remote sensing radar for Arctic surveillance.", freshness: "stale", reviewedAt: "2024-01-01" });
    const current = missionConnection({ slug: "current", summary: "Remote sensing radar for Arctic surveillance.", freshness: "current", reviewedAt: "2026-08-01" });

    expect(orderMissionRelationships([stale, current], arctic)[0]?.organization.slug).toBe("current");
  });

  it("uses bounded Mission feature themes to preserve useful breadth without changing the full order", () => {
    const arctic = getRelationshipPilotTreatment("mission", "arctic-domain-awareness")!;
    const ordered = orderMissionRelationships([
      missionConnection({ slug: "radar", name: "Arctic surveillance radar", summary: "Persistent radar sensing for Arctic surveillance." }),
      missionConnection({ slug: "communications", name: "Satellite communications", summary: "Beyond line of sight communications and remote telemetry in northern operations." }),
      missionConnection({ slug: "autonomous", name: "Autonomous vessel", summary: "Autonomous uncrewed vessel for persistent sensing and Arctic monitoring." }),
      missionConnection({ slug: "fusion", name: "Sensor integration", summary: "Data fusion and edge processing for Arctic sensor integration." }),
      missionConnection({ slug: "consulting", name: "General consulting", summary: "General consulting for office software." })
    ], arctic);

    expect(selectFeaturedMissionRelationships(ordered, arctic).map((entry) => entry.organization.slug))
      .toEqual(["radar", "communications", "autonomous", "fusion"]);
  });

  it("selects the strongest current Arctic record for each visible theme", () => {
    const arctic = getRelationshipPilotTreatment("mission", "arctic-domain-awareness")!;
    const sensingDomain = [{ id: "domain-sensing", slug: "sensing-isr", name: "Sensing and ISR", summary: "Sensors and collection systems for situational awareness." }];
    const ordered = orderMissionRelationships([
      missionConnection({ slug: "sedna-rov-services", name: "Arctic Rapid-Deployment ROV Survey Operations", summary: "Mobilize locally crewed ROV, boat and sonar packages from Iqaluit for under-ice inspection and survey missions.", capabilityConfidence: "moderate", matchConfidence: "moderate", technicalDomains: sensingDomain }),
      missionConnection({ slug: "technalogix", name: "High-frequency radar power amplifiers", summary: "Canadian RF transmitters and high-power amplifiers described for radar, airspace and waterway monitoring.", capabilityConfidence: "high", matchConfidence: "moderate", technicalDomains: sensingDomain }),
      missionConnection({ slug: "mda-space", name: "MDA CHORUS Synthetic Aperture Radar Constellation", summary: "Collect day-night, all-weather Earth-observation data with a C- and X-band synthetic aperture radar constellation.", capabilityConfidence: "moderate", matchConfidence: "high", technicalDomains: sensingDomain }),
      missionConnection({ slug: "telesat", name: "Telesat Lightspeed secure Arctic connectivity", summary: "Secure low-Earth-orbit connectivity with integrated ground infrastructure and High Arctic coverage.", capabilityConfidence: "moderate", matchConfidence: "high" }),
      missionConnection({ slug: "open-ocean-robotics", name: "Autonomous USV Maritime Awareness Platform", summary: "Deploy the solar-powered, self-righting DataXplorer uncrewed surface vessel for long-endurance ocean monitoring, using modular sensor bays and cellular, satellite, or radio links to return data without a crew continuously at sea.", capabilityConfidence: "moderate", matchConfidence: "moderate" }),
      missionConnection({ slug: "lux-aerobot", name: "Stratospheric Earth-observation platform", summary: "Lux Aerobot integrates high-altitude balloon platforms, remote-sensing payloads, flight operations and geospatial analytics to collect and deliver persistent regional observations from the stratosphere.", capabilityConfidence: "high", matchConfidence: "moderate" }),
      missionConnection({ slug: "dominion-dynamics", name: "AuraNet integrated command and data fusion", summary: "A common-operating-picture platform for data fusion, edge processing and command-and-control integration.", capabilityConfidence: "high", matchConfidence: "high" }),
      missionConnection({ slug: "asl-environmental-sciences", name: "DeCAF Rapid Response Toolkit", summary: "Satellite imagery, machine learning and automated change detection support wide-area monitoring.", capabilityConfidence: "high", matchConfidence: "high", technicalDomains: sensingDomain }),
      missionConnection({ slug: "ven-tech-subsea", name: "Rapidly Deployable ROV Inspection Services", summary: "Portable ROVs with multibeam sonar for inshore, offshore and deepwater inspection.", capabilityConfidence: "high", matchConfidence: "moderate", technicalDomains: sensingDomain })
    ], arctic);

    expect(selectFeaturedMissionRelationshipPresentations(ordered, arctic).map(({ connection, reason }) => ({
      slug: connection.organization.slug,
      capability: connection.capabilities[0]?.name,
      reason
    }))).toEqual([
      { slug: "mda-space", capability: "MDA CHORUS Synthetic Aperture Radar Constellation", reason: "All-weather sensing" },
      { slug: "telesat", capability: "Telesat Lightspeed secure Arctic connectivity", reason: "Resilient Arctic connectivity" },
      { slug: "open-ocean-robotics", capability: "Autonomous USV Maritime Awareness Platform", reason: "Persistent autonomous platforms" },
      { slug: "dominion-dynamics", capability: "AuraNet integrated command and data fusion", reason: "Command and data integration" },
      { slug: "asl-environmental-sciences", capability: "DeCAF Rapid Response Toolkit", reason: "Wide-area change detection" }
    ]);
  });

  it("bounds Arctic reciprocal Public Needs to multi-technology, context-first discovery", () => {
    const arctic = getRelationshipPilotTreatment("mission", "arctic-domain-awareness")!;
    const publicNeeds = [
      { id: "submarine", slug: "future-submarine-operational-capability", title: "Future submarine operational capability", technologyCount: 6 },
      { id: "sovereign", slug: "sovereign-defence-capability-areas", title: "Sovereign defence capability areas", technologyCount: 5 },
      { id: "underwater", slug: "persistent-uncrewed-underwater-surveillance", title: "Persistent uncrewed underwater surveillance", technologyCount: 4 },
      { id: "land", slug: "land-formation-combat-effectiveness", title: "Enhancing the combat effectiveness of large land formations", technologyCount: 3 },
      { id: "northern", slug: "dual-use-northern-infrastructure-and-partnerships", title: "Dual-use northern infrastructure and partnerships", technologyCount: 2 },
      { id: "cyber", slug: "major-event-and-critical-infrastructure-cyber-defence", title: "Major-event and critical-infrastructure cyber defence", technologyCount: 2 },
      { id: "arctic-cyber", slug: "arctic-cyber-resilience-and-threat-warning", title: "Arctic cyber resilience and threat warning", technologyCount: 1 }
    ];

    expect(selectMissionPublicNeedsForPresentation(publicNeeds, arctic).map((entry) => entry.slug)).toEqual([
      "persistent-uncrewed-underwater-surveillance",
      "dual-use-northern-infrastructure-and-partnerships",
      "future-submarine-operational-capability",
      "sovereign-defence-capability-areas"
    ]);
  });

  it("omits one-off reciprocal Mission links before applying the treatment limit", () => {
    const missions = [
      { missionArea: { id: "mission-1", slug: "underwater-isr", name: "Underwater ISR", summary: "Underwater sensing.", sourceConfidence: "moderate" as const }, capabilityCount: 1 },
      { missionArea: { id: "mission-2", slug: "maritime-domain-awareness", name: "Maritime Domain Awareness", summary: "Maritime awareness.", sourceConfidence: "moderate" as const }, capabilityCount: 4 },
      { missionArea: { id: "mission-3", slug: "cyber-defence", name: "Cyber Defence", summary: "Cyber defence.", sourceConfidence: "moderate" as const }, capabilityCount: 2 },
      { missionArea: { id: "mission-4", slug: "arctic-domain-awareness", name: "Arctic Domain Awareness", summary: "Arctic awareness.", sourceConfidence: "moderate" as const }, capabilityCount: 3 },
      { missionArea: { id: "mission-5", slug: "joint-command", name: "Joint Command", summary: "Joint command.", sourceConfidence: "moderate" as const }, capabilityCount: 2 },
      { missionArea: { id: "mission-6", slug: "fifth-qualified", name: "Fifth Qualified", summary: "Fifth qualified lens.", sourceConfidence: "moderate" as const }, capabilityCount: 2 }
    ];

    expect(selectDemandMissionLenses(missions).map(({ missionArea }) => missionArea.slug)).toEqual([
      "maritime-domain-awareness",
      "cyber-defence",
      "arctic-domain-awareness",
      "joint-command"
    ]);
  });

  it("uses bounded position bands and selects only Signals with exact record links", () => {
    expect([0, 2, 3, 5, 6, 11, 12].map(relationshipPositionBand)).toEqual(["1-3", "1-3", "4-6", "4-6", "7-12", "7-12", "13+"]);
    const editions = [{
      id: "edition-1",
      slug: "edition-one",
      editionDate: "2026-08-20",
      title: "Edition one",
      executiveSummary: "Summary",
      disclosure: "Disclosure",
      authorName: "True North Map",
      publishedAt: "2026-08-20T12:00:00Z",
      amendedAt: null,
      updatedAt: "2026-08-20T12:00:00Z",
      heroImage: null,
      items: [{
        id: "item-1",
        slug: "item-one",
        position: 1,
        title: "Linked item",
        lane: "company_capability" as const,
        tags: [],
        bottomLine: "Bottom line",
        executiveSummary: "Item summary",
        sourceFact: "Source fact",
        automatedRead: "Assessment",
        unknowns: "Unknown",
        nextStep: "Next",
        confidence: "medium" as const,
        sources: [],
        links: [{ type: "capability" as const, id: "cap-1", label: "Capability", href: "/capabilities/cap-1" }]
      }]
    }];

    expect(selectRelationshipSignals(editions, new Set(["capability:cap-1"]))).toHaveLength(1);
    expect(selectRelationshipSignals(editions, new Set(["capability:other"]))).toEqual([]);
  });

  it("keeps relationship comparison metadata bounded and equivalent across variants", () => {
    const metadata = relationshipResultMetadata({
      variant: "control",
      placement: "complete",
      targetType: "mission",
      targetSlug: "underwater-isr",
      positionBand: "4-6",
      destinationType: "organization",
      destinationSlug: "sample"
    });

    expect(Object.keys(metadata)).toHaveLength(4);
    expect(metadata).toEqual(expect.objectContaining({
      presentation: "relationship_presentation_v1:control:complete",
      target: "mission:underwater-isr",
      destination: "organization:sample",
      position_band: "4-6"
    }));

    const attribution = { utm_source: "linkedin", utm_medium: "founder_social", utm_content: "topic_post", traffic_class: "qa" };
    const surviving = Object.fromEntries(Object.entries(metadata).slice(0, 8 - Object.keys(attribution).length));
    expect(surviving).toEqual(metadata);
  });

  it("shows the treatment intro from the clamped directory page", () => {
    const clampedSinglePage = paginate(Array.from({ length: 13 }, (_, index) => index), normalizedPage("2"), 13);
    const validSecondPage = paginate(Array.from({ length: 14 }, (_, index) => index), normalizedPage("2"), 13);

    expect(clampedSinglePage.page).toBe(1);
    expect(shouldShowRelationshipTreatmentIntro(true, clampedSinglePage.page)).toBe(true);
    expect(validSecondPage.page).toBe(2);
    expect(shouldShowRelationshipTreatmentIntro(true, validSecondPage.page)).toBe(false);
  });
});
