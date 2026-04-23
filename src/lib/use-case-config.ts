import type { Domain, UseCase } from "@/types/domain";

export interface UseCaseInsightCopy {
  deploymentReadyLabel: string;
  deploymentLabel: string;
  validationLabel: string;
  operatorLabel: string;
  architectureLabel: string;
}

interface UseCaseDetailConfig {
  overviewEyebrow: string;
  overviewBody: string;
  capabilityDefinition: string;
  quickStartSteps: string[];
  decisionGuideTitle: string;
  decisionGuideDescription: string;
  topTargetsTitle: string;
  topTargetsDescription: string;
  primaryFocusLabel: string;
  summaryTitle: string;
  summaryDescription: string;
  implicationsEyebrow: string;
  implicationsTitle: string;
  implicationsDescription: string;
  gapsTitle: string;
  gapsDescription: string;
  clustersTitle: string;
  clustersDescription: string;
  filtersTitle: string;
  filtersDescription: string;
  observationsTitle: string;
  observationsDescription: string;
}

export interface ResolvedUseCaseConfig {
  slug: string;
  featured: boolean;
  cardBadge: string;
  homeActionLabel: string;
  detail: UseCaseDetailConfig;
  insightCopy: UseCaseInsightCopy;
}

type UseCaseConfigOverrides = {
  featured?: boolean;
  cardBadge?: string;
  homeActionLabel?: string;
  detail?: Partial<UseCaseDetailConfig>;
  insightCopy?: Partial<UseCaseInsightCopy>;
};

const defaultInsightCopy: UseCaseInsightCopy = {
  deploymentReadyLabel: "deployment-ready",
  deploymentLabel: "deployment",
  validationLabel: "field or operator validation",
  operatorLabel: "operators",
  architectureLabel: "operating architecture"
};

const useCaseConfigOverrides: Record<string, UseCaseConfigOverrides> = {
  "arctic-domain-awareness": {
    featured: true,
    cardBadge: "Cold-weather monitoring",
    homeActionLabel: "Export Arctic Targets CSV",
    detail: {
      overviewEyebrow: "Operating lens",
      overviewBody:
        "This view shows sensing, autonomy, and analysis capabilities relevant to Arctic monitoring and response. Use clusters to understand the landscape, filters to refine results, and top targets to identify near-term engagement opportunities.",
      quickStartSteps: [
        "Start with sensing, relay, and autonomy clusters to understand the current Arctic operating stack.",
        "Use filters to narrow by pathway, geography, and defence relevance without losing the mission frame.",
        "Review top targets first, then open the strongest capabilities for evidence, signals, and company context.",
        "Use supporting observations to spot where Arctic operating depth is strong and where it still looks thin."
      ],
      topTargetsDescription:
        "Highest-priority capabilities for harsh-environment monitoring, response, and near-term engagement.",
      observationsDescription:
        "Curated notes that add Arctic operating context beyond the summary and gaps above."
    },
    insightCopy: {
      deploymentReadyLabel: "deployment-ready",
      deploymentLabel: "deployment",
      validationLabel: "Arctic field validation",
      operatorLabel: "Arctic operators",
      architectureLabel: "Arctic operating architecture"
    }
  },
  "distributed-sensor-networks": {
    cardBadge: "Networked monitoring",
    homeActionLabel: "Export Network Targets CSV",
    detail: {
      overviewEyebrow: "Network lens",
      overviewBody:
        "This view shows sensing, relay, and fusion capabilities relevant to distributed monitoring networks. Use clusters to understand the network stack, filters to narrow the landscape, and top targets to identify where coverage or resilience can improve first.",
      quickStartSteps: [
        "Start with cluster depth to understand how sensing, relay, and fusion are distributed across the network stack.",
        "Use filters to isolate the strongest rollout-ready or integration-ready records.",
        "Review priority network targets first, then open capabilities for evidence, signals, and company context.",
        "Use observations to spot whether the current network mix is stronger in endpoints, relay, or fused awareness."
      ],
      decisionGuideTitle: "Network Priorities",
      decisionGuideDescription:
        "Start here if you need to decide which capabilities most strengthen coverage, resilience, or the operating picture.",
      topTargetsTitle: "Priority Network Targets",
      topTargetsDescription:
        "Highest-priority capabilities for network coverage, relay resilience, and fused awareness.",
      summaryDescription:
        "A short read on how sensing, relay, and fusion depth combine in this Use Case today.",
      implicationsEyebrow: "Network implications",
      implicationsTitle: "What This Means For Network Buildout",
      implicationsDescription:
        "Turn the current landscape into next-step decisions for coverage, resilience, and integration.",
      gapsTitle: "Coverage Gaps",
      gapsDescription:
        "Short rule-based gaps derived from network depth, maturity, and the current capability mix.",
      clustersDescription:
        "Groupings that help you understand how the sensing and relay stack is distributed.",
      filtersTitle: "Filtered network exploration",
      filtersDescription:
        "Use structured filters to narrow the network landscape without losing the Use Case frame.",
      observationsTitle: "Network observations",
      observationsDescription:
        "Curated notes that add network-planning context beyond the summary and gaps above."
    },
    insightCopy: {
      deploymentReadyLabel: "rollout-ready",
      deploymentLabel: "rollout",
      validationLabel: "integration validation",
      operatorLabel: "network operators",
      architectureLabel: "monitoring architecture"
    }
  }
};

function buildDefaultDetailConfig(useCase: Pick<UseCase, "name">): UseCaseDetailConfig {
  return {
    overviewEyebrow: "Page overview",
    overviewBody: `This view shows capabilities relevant to ${useCase.name}, grouped by type and maturity. Use clusters to understand the landscape, filters to refine results, and top targets to identify priority engagement opportunities.`,
    capabilityDefinition:
      "A capability is a product, system, or technical solution that can be evaluated or deployed independently.",
    quickStartSteps: [
      "Start with capability clusters to understand the landscape.",
      "Use filters to narrow results.",
      "Review Top Engagement Targets for recommended actions.",
      "Click into capabilities for details and supporting evidence."
    ],
    decisionGuideTitle: "Recommended Actions",
    decisionGuideDescription: "Start here if you need to decide what to do first.",
    topTargetsTitle: "Top Engagement Targets",
    topTargetsDescription:
      "Highest-priority capabilities based on relevance, maturity, and recent activity.",
    primaryFocusLabel: "Primary Focus",
    summaryTitle: "Ecosystem Summary",
    summaryDescription: "A short read on what exists in this Use Case today.",
    implicationsEyebrow: "Action implications",
    implicationsTitle: "What This Means",
    implicationsDescription: "Turn the current landscape into next-step decisions.",
    gapsTitle: "Gaps",
    gapsDescription:
      "Short rule-based gaps derived from maturity, cluster depth, and current capability mix.",
    clustersTitle: "Capability Clusters",
    clustersDescription: "Groupings that help you understand the capability landscape by type.",
    filtersTitle: "Filtered capability exploration",
    filtersDescription: "Use structured filters to narrow the view without losing the Use Case frame.",
    observationsTitle: "Supporting observations",
    observationsDescription:
      "Curated notes that add supporting context beyond the summary and gaps above."
  };
}

export function resolveUseCaseConfig(
  useCase: Pick<UseCase, "slug" | "name">,
  domains: Array<Pick<Domain, "name">> = []
): ResolvedUseCaseConfig {
  const overrides = useCaseConfigOverrides[useCase.slug] ?? {};
  const defaultCardBadge = domains.length ? domains.map((domain) => domain.name).join(" · ") : "Strategic lens";

  return {
    slug: useCase.slug,
    featured: overrides.featured ?? false,
    cardBadge: overrides.cardBadge ?? defaultCardBadge,
    homeActionLabel: overrides.homeActionLabel ?? "Export Top Targets CSV",
    detail: {
      ...buildDefaultDetailConfig(useCase),
      ...overrides.detail
    },
    insightCopy: {
      ...defaultInsightCopy,
      ...overrides.insightCopy
    }
  };
}

export function getFeaturedUseCase<T extends Pick<UseCase, "slug" | "name">>(
  useCases: T[]
): { useCase: T; config: ResolvedUseCaseConfig } | null {
  if (!useCases.length) {
    return null;
  }

  const featured = useCases.find((useCase) => resolveUseCaseConfig(useCase).featured) ?? useCases[0];

  return {
    useCase: featured,
    config: resolveUseCaseConfig(featured)
  };
}
