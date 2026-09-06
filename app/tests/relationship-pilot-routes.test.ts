import { readFile } from "node:fs/promises";
import path from "node:path";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MissionOrganizationCard } from "@/components/atlas/mission-organization-card";
import { publicContentType } from "@/components/atlas/public-beta-insights";
import {
  getRelationshipPilotTreatment,
  isRelationshipPilotControl,
  missionRelationshipMetadataTitles,
  relationshipPilotCohort
} from "@/lib/atlas/relationship-pilot";
import type { AtlasMissionOrganizationConnection } from "@/types/atlas";

const read = (file: string) => readFile(path.resolve(file), "utf8");

const connection: AtlasMissionOrganizationConnection = {
  organization: {
    id: "org-1",
    slug: "sample-organization",
    name: "Sample Organization",
    description: "A published organization description.",
    entityKind: "company",
    sourceConfidence: "moderate",
    freshnessStatus: "current",
    lastReviewedAt: "2026-08-20",
    primaryLocation: null
  },
  capabilities: [{
    id: "cap-1",
    slug: "sample-capability",
    name: "Sample Capability",
    summary: "A published capability summary.",
    sourceConfidence: "moderate",
    technicalDomains: [],
    assessment: {
      id: "match-1",
      alignmentSummary: "A reviewed alignment summary.",
      matchType: "derived",
      confidence: "moderate"
    }
  }],
  strongestConfidence: "moderate"
};

describe("relationship presentation pilot routes", () => {
  it("locks the bounded treatment and control cohort without padding", () => {
    expect(relationshipPilotCohort).toMatchObject({
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
    });
    expect(getRelationshipPilotTreatment("mission", "underwater-isr")).toBeNull();
    expect(getRelationshipPilotTreatment("public_need", "future-submarine-operational-capability")).toBeNull();
    expect(isRelationshipPilotControl("mission", "underwater-isr")).toBe(true);
    expect(isRelationshipPilotControl("public_need", "canadian-submarine-sustainment-and-industrial-capacity")).toBe(true);
  });

  it("keeps the shared mission card default markup unchanged unless the treatment prop is present", () => {
    vi.stubGlobal("React", React);
    const legacy = renderToStaticMarkup(React.createElement(MissionOrganizationCard, { connection }));
    const control = renderToStaticMarkup(React.createElement(MissionOrganizationCard, {
      connection,
      relationshipContext: { targetSlug: "underwater-isr", positionBand: "1-3", variant: "control", placement: "complete" }
    }));
    const treatment = renderToStaticMarkup(React.createElement(MissionOrganizationCard, {
      connection,
      relationshipContext: { targetSlug: "arctic-domain-awareness", positionBand: "1-3", variant: "treatment", placement: "featured" }
    }));

    const withoutGraphAuditMarkers = (markup: string) => markup
      .replace(/ data-internal-link-role="[^"]+"/g, "")
      .replace(/ data-internal-link-module="[^"]+"/g, "");
    expect(withoutGraphAuditMarkers(control)).toBe(withoutGraphAuditMarkers(legacy));
    expect(control).toContain('data-internal-link-role="contextual"');
    expect(control).toContain("<h2");
    expect(control).not.toContain("<h3");
    expect(control).toContain('href="/organizations/sample-organization"');
    expect(control).toContain('href="/capabilities/sample-capability"');
    expect(treatment).toContain("<h3");
    expect(treatment).not.toContain("<h2");
  });

  it("preserves the legacy Mission social title on controls and defaults", () => {
    const defaultTitles = missionRelationshipMetadataTitles("Underwater ISR", null);
    const treatment = getRelationshipPilotTreatment("mission", "arctic-domain-awareness");

    expect(defaultTitles).toEqual({
      pageTitle: "Underwater ISR Mission Area",
      socialTitle: "Underwater ISR"
    });
    expect(missionRelationshipMetadataTitles("Arctic Domain Awareness", treatment).socialTitle)
      .toBe(treatment?.metadataTitle);
  });

  it("gates answer-first, Signals, reciprocal discovery and collapsed evidence to treatments", async () => {
    const [mission, demand, card, resultLink, repository, publicRepository] = await Promise.all([
      read("src/app/missions/[slug]/page.tsx"),
      read("src/app/demand/[slug]/page.tsx"),
      read("src/components/atlas/mission-organization-card.tsx"),
      read("src/components/atlas/relationship-result-link.tsx"),
      read("src/lib/atlas/repository.ts"),
      read("src/lib/atlas/supabase-repository.ts")
    ]);

    expect(mission).toContain('getRelationshipPilotTreatment("mission", slug)');
    expect(mission).toContain("treatment ? getPublishedSignals(30)");
    expect(mission).toContain("getPublishedDefenceBriefs()");
    expect(mission).not.toContain("treatment ? Promise.resolve([]) : getPublishedDefenceBriefs()");
    expect(mission).toContain("editorialIntelligenceRelationship(signal.explicitRecordLink)");
    expect(mission).toContain("editorialIntelligenceRelationship(false)");
    expect(mission).toContain("Derived discovery path through a reviewed record");
    expect(mission).toContain("direct or clearly labelled derived editorial paths");
    expect(mission).toContain("missionRelationshipMetadataTitles");
    expect(mission).toContain("socialMetadata({ title: socialTitle");
    expect(mission).toContain("showTreatmentIntro");
    expect(mission).toContain("selectFeaturedMissionRelationshipPresentations");
    expect(mission).toContain("selectMissionPublicNeedsForPresentation");
    expect(mission).toContain("itemListElement: presentationSequence.slice(0, 100)");
    expect(mission).toContain("featureReason: reason");
    expect(mission).toContain('variant: treatment ? "treatment" : "control"');
    expect(demand).toContain('getRelationshipPilotTreatment("public_need", demand.slug)');
    expect(demand).toContain("<LegacyDemandContent demand={demand} controlSlug={controlSlug} />");
    expect(demand).toContain("getAtlasMissionLinksForCapabilities(capabilityIds)");
    expect(demand).not.toContain("getAtlasMissionLinksForRecords");
    expect(demand).toContain('getPublishedDefenceBriefsForRecord("demand_requirement", demand.id, 3)');
    expect(demand).toContain("editorialIntelligenceRelationship(signal.explicitRecordLink)");
    expect(demand).toContain("Derived discovery path through a reviewed record");
    expect(demand).toContain("selectFeaturedDemandRelationships");
    expect(demand).toContain("remainingMatches");
    expect(demand).toContain('variant="control" placement="complete"');
    expect(demand).toContain("Review supporting public evidence");
    expect(demand).toContain("Source-backed capability");
    expect(demand).toContain("Our assessment ·");
    expect(demand).toContain("demandRelationshipAssessmentCopy(assessmentRole, match.alignmentSummary)");
    expect(demand).not.toContain("This broader connection warrants scrutiny");
    expect(demand).toContain("selectDemandMissionLenses(relatedMissions)");
    expect(demand).toContain("presentedMissions.map");
    expect(demand).toContain('mt-4 border border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] p-4');
    expect(demand).toContain('"@type": "WebPage"');
    expect(demand).toContain('"@type": "ItemList"');
    expect(demand).not.toContain("GovernmentService");
    expect(`${mission}\n${demand}`).not.toMatch(/fit tier|relationship score|supplier score/i);
    expect(card).toContain('relationshipContext?.variant === "treatment"');
    expect(card).toContain(") : (\n        <h2");
    expect(resultLink).toContain('trackBetaEvent("result_select"');
    expect(resultLink).toContain("relationshipResultMetadata");
    expect(repository).toContain("getCachedAtlasMissionLinksForCapabilities");
    expect(repository).toContain('"ecosystem-intelligence-relationship-pilot-mission-links-v1"');
    const boundedLoader = publicRepository.slice(
      publicRepository.indexOf("export async function loadAtlasMissionLinksForCapabilitiesFromSupabase"),
      publicRepository.indexOf("export type AtlasRecordSummary")
    );
    expect(boundedLoader).not.toContain("loadAtlasSnapshotFromSupabase");
  });

  it("classifies Mission detail views without changing existing route classes", () => {
    expect(publicContentType("/missions/arctic-domain-awareness")).toBe("mission_profile");
    expect(publicContentType("/demand/persistent-uncrewed-underwater-surveillance")).toBe("demand_profile");
    expect(publicContentType("/organizations/example")).toBe("organization_profile");
  });
});
