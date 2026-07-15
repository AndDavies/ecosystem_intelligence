import { describe, expect, it } from "vitest";
import { buildUseCaseInsight, getTargetRead } from "@/lib/use-case-insights";
import { resolveUseCaseConfig } from "@/lib/use-case-config";
import type { UseCaseView } from "@/types/view-models";

function buildView(): UseCaseView {
  const domain = {
    id: "domain-1",
    name: "Sensing",
    slug: "sensing",
    description: null
  };

  const useCase = {
    id: "use-case-1",
    slug: "cold-weather-monitoring",
    name: "Cold Weather Monitoring",
    summary: "Monitor distributed operations in difficult environments.",
    active: true,
    domainIds: [domain.id],
    priorityTier: "p2" as const,
    useCaseKind: "mission" as const,
    partnerFrames: ["CAF/DND"],
    policyAnchors: ["Test policy anchor"],
    operationalOwner: "Test operators",
    missionContext: "Cold-weather remote monitoring.",
    requiredDecision: "Decide which systems can improve detection and tasking.",
    interoperabilityBoundary: "Test interoperability boundary.",
    missionOutcome: "Improve detection and warning decisions in remote environments.",
    procurementPathway: "Validate before procurement-facing engagement.",
    realismNote: "Public-source test fixture."
  };

  const clusters = [
    {
      id: "cluster-1",
      name: "Persistent Sensing",
      slug: "persistent-sensing",
      domainId: domain.id,
      summary: "Coverage and detection systems."
    },
    {
      id: "cluster-2",
      name: "Communications",
      slug: "communications",
      domainId: domain.id,
      summary: "Relay and network resilience."
    }
  ];

  const entries = [
    {
      capability: {
        id: "cap-1",
        companyId: "company-1",
        name: "Corridor Radar",
        slug: "corridor-radar",
        capabilityType: "Radar",
        domainId: domain.id,
        summary: "Persistent corridor monitoring.",
        companyFacingContext: null,
        lastUpdatedAt: "2026-04-10T00:00:00.000Z"
      },
      company: {
        id: "company-1",
        name: "Northwatch",
        slug: "northwatch",
        overview: "Sensing company.",
        geography: "nato" as const,
        headquarters: "Reykjavik, Iceland",
        marketContext: null,
        websiteUrl: null,
        publicContactEmail: null,
        publicContactPhone: null,
        lastUpdatedAt: "2026-04-10T00:00:00.000Z"
      },
      domain,
      mapping: {
        id: "mapping-1",
        capabilityId: "cap-1",
        useCaseId: useCase.id,
        clusterId: "cluster-1",
        pathway: "scale" as const,
        relevanceBand: "high" as const,
        defenceRelevance: "high" as const,
        suggestedActionType: "assess_procurement_relevance" as const,
        actionNote: null,
        whyItMatters: "Strong fit for operational coverage.",
        rankingScore: 95,
        reviewerOverrideDelta: 0,
        evidenceStrength: 5 as const,
        actionabilityScore: 5 as const,
        lastSignalAt: "2026-04-18T00:00:00.000Z",
        staleAfterDays: 180
      },
      cluster: clusters[0],
      citations: [],
      signals: [
        {
          id: "signal-1",
          capabilityId: "cap-1",
          signalType: "contract" as const,
          title: "Contract award",
          description: "Recent contract",
          observedAt: "2026-04-18T00:00:00.000Z"
        }
      ]
    },
    {
      capability: {
        id: "cap-2",
        companyId: "company-2",
        name: "Relay Mesh",
        slug: "relay-mesh",
        capabilityType: "Communications relay",
        domainId: domain.id,
        summary: "Distributed remote connectivity.",
        companyFacingContext: null,
        lastUpdatedAt: "2026-04-08T00:00:00.000Z"
      },
      company: {
        id: "company-2",
        name: "Mesh Systems",
        slug: "mesh-systems",
        overview: "Networking company.",
        geography: "global" as const,
        headquarters: "Austin, USA",
        marketContext: null,
        websiteUrl: null,
        publicContactEmail: null,
        publicContactPhone: null,
        lastUpdatedAt: "2026-04-08T00:00:00.000Z"
      },
      domain,
      mapping: {
        id: "mapping-2",
        capabilityId: "cap-2",
        useCaseId: useCase.id,
        clusterId: "cluster-2",
        pathway: "validate" as const,
        relevanceBand: "high" as const,
        defenceRelevance: "medium" as const,
        suggestedActionType: "explore_testbed_inclusion" as const,
        actionNote: null,
        whyItMatters: "Improves remote connectivity.",
        rankingScore: 84,
        reviewerOverrideDelta: 0,
        evidenceStrength: 3 as const,
        actionabilityScore: 5 as const,
        lastSignalAt: "2026-04-14T00:00:00.000Z",
        staleAfterDays: 180
      },
      cluster: clusters[1],
      citations: [],
      signals: [
        {
          id: "signal-2",
          capabilityId: "cap-2",
          signalType: "pilot" as const,
          title: "Field pilot",
          description: "Recent pilot",
          observedAt: "2026-04-14T00:00:00.000Z"
        }
      ]
    },
    {
      capability: {
        id: "cap-3",
        companyId: "company-3",
        name: "Fusion Lens",
        slug: "fusion-lens",
        capabilityType: "Analytics software",
        domainId: domain.id,
        summary: "Data fusion and prioritization.",
        companyFacingContext: null,
        lastUpdatedAt: "2026-04-06T00:00:00.000Z"
      },
      company: {
        id: "company-3",
        name: "Fusion Labs",
        slug: "fusion-labs",
        overview: "Analytics company.",
        geography: "global" as const,
        headquarters: "London, UK",
        marketContext: null,
        websiteUrl: null,
        publicContactEmail: null,
        publicContactPhone: null,
        lastUpdatedAt: "2026-04-06T00:00:00.000Z"
      },
      domain,
      mapping: {
        id: "mapping-3",
        capabilityId: "cap-3",
        useCaseId: useCase.id,
        clusterId: "cluster-1",
        pathway: "build" as const,
        relevanceBand: "medium" as const,
        defenceRelevance: "medium" as const,
        suggestedActionType: "monitor_for_later_stage_engagement" as const,
        actionNote: null,
        whyItMatters: "Promising analytics layer.",
        rankingScore: 70,
        reviewerOverrideDelta: 0,
        evidenceStrength: 1 as const,
        actionabilityScore: 0 as const,
        lastSignalAt: "2026-04-12T00:00:00.000Z",
        staleAfterDays: 180
      },
      cluster: clusters[0],
      citations: [],
      signals: [
        {
          id: "signal-3",
          capabilityId: "cap-3",
          signalType: "technical_milestone" as const,
          title: "Prototype milestone",
          description: "Recent milestone",
          observedAt: "2026-04-12T00:00:00.000Z"
        }
      ]
    }
  ];

  return {
    useCase,
    domains: [domain],
    citations: [],
    observations: [],
    topTargets: entries,
    allCapabilities: entries,
    clusters: [
      {
        cluster: clusters[0],
        count: 2,
        topCapability: entries[0]
      },
      {
        cluster: clusters[1],
        count: 1,
        topCapability: entries[1]
      }
    ],
    maturityDistribution: [
      { pathway: "build", count: 1 },
      { pathway: "validate", count: 1 },
      { pathway: "scale", count: 1 }
    ]
  };
}

describe("use-case insights", () => {
  it("builds recommendation copy without Arctic-specific language", () => {
    const view = buildView();
    const insightLayer = buildUseCaseInsight(view);
    const targetRead = getTargetRead(view.topTargets[1], 1, view.topTargets, view);

    expect(insightLayer.recommendedActions.map((item) => item.verb)).toEqual([
      "Engage",
      "Validate",
      "Monitor"
    ]);
    expect(targetRead.priorityNow).not.toMatch(/arctic/i);
    expect(targetRead.actionDirective).not.toMatch(/arctic/i);
    expect(insightLayer.gaps.join(" ")).not.toMatch(/arctic/i);
  });

  it("keeps the scale-stage target framed as an immediate opportunity", () => {
    const view = buildView();
    const targetRead = getTargetRead(view.topTargets[0], 0, view.topTargets, view);

    expect(targetRead.label).toBe("Immediate Opportunity");
    expect(targetRead.tone).toBe("success");
    expect(targetRead.actionDirective).toContain("Corridor Radar");
  });

  it("supports use-case-specific phrasing through insight copy configuration", () => {
    const view = buildView();
    const config = resolveUseCaseConfig({
      slug: "distributed-sensor-networks",
      name: "Distributed Sensor Networks"
    });
    const insightLayer = buildUseCaseInsight(view, config.insightCopy);
    const targetRead = getTargetRead(view.topTargets[1], 1, view.topTargets, view, config.insightCopy);

    expect(insightLayer.gaps.join(" ")).toContain("rollout-ready");
    expect(targetRead.priorityNow).toContain("integration validation");
    expect(targetRead.context).toContain("rollout");
  });
});
