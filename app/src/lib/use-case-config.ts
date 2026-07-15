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
  orientation: UseCaseOrientationConfig;
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

interface UseCaseOrientationConfig {
  useThisWhen: string;
  decisionSupported: string;
  bestOutput: string;
  notFor: string;
  exampleQuestion: string;
  primaryDomains: string;
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
      orientation: {
        useThisWhen:
          "A user needs to understand who can improve awareness across Arctic and northern approaches.",
        decisionSupported:
          "Which sensing, autonomy, relay, and fusion capabilities should be validated first for persistent northern warning.",
        bestOutput:
          "A defensible target list for northern monitoring, response, and evidence-backed engagement.",
        notFor: "General Arctic policy research or classified NORAD/NATO target guidance.",
        exampleQuestion: "Who should we engage first for persistent Arctic monitoring and response?",
        primaryDomains: "Maritime Systems, ISR & Sensing, Autonomy & Robotics, Cyber & Data, Communications & Infrastructure"
      },
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
      orientation: {
        useThisWhen:
          "A user needs a resilient operating picture from dispersed sensors, relays, and local decision layers.",
        decisionSupported:
          "Which sensing, relay, and fusion combinations can produce resilient coverage in sparse or degraded environments.",
        bestOutput:
          "A ranked list of network capabilities that improve coverage, resilience, and integration.",
        notFor: "A generic IoT or sensor catalog disconnected from mission operations.",
        exampleQuestion: "Which networked sensing capabilities most improve remote operating picture resilience?",
        primaryDomains: "ISR & Sensing, Cyber & Data, Communications & Infrastructure"
      },
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
  },
  "underwater-isr": {
    cardBadge: "Subsea awareness",
    detail: {
      orientation: {
        useThisWhen:
          "A user needs subsea awareness options for Arctic maritime approaches or under-ice operating contexts.",
        decisionSupported:
          "Which subsea platforms, payloads, and relay layers merit field validation for undersea warning.",
        bestOutput:
          "A shortlist of subsea sensing and integration targets with evidence and validation gaps.",
        notFor: "Broad naval strategy or classified undersea surveillance requirements.",
        exampleQuestion: "Who should we validate first for persistent undersea awareness in Arctic approaches?",
        primaryDomains: "Maritime Systems, ISR & Sensing, Cyber & Data, Communications & Infrastructure"
      }
    },
    insightCopy: {
      validationLabel: "undersea field validation",
      operatorLabel: "maritime operators",
      architectureLabel: "undersea awareness architecture"
    }
  },
  "autonomous-patrol": {
    cardBadge: "Uncrewed patrol",
    detail: {
      orientation: {
        useThisWhen:
          "A user needs to compare uncrewed patrol systems for austere northern or allied field conditions.",
        decisionSupported:
          "Which autonomous patrol concepts should enter realistic trials before wider operational consideration.",
        bestOutput:
          "A validation-focused list of autonomous systems and enabling support layers.",
        notFor: "Treating autonomy as procurement-ready without field evidence.",
        exampleQuestion:
          "Which autonomous patrol capabilities are ready for realistic trials, and what support layers do they need?",
        primaryDomains: "Maritime Systems, Autonomy & Robotics, Cyber & Data, Communications & Infrastructure"
      }
    },
    insightCopy: {
      validationLabel: "field trial validation",
      operatorLabel: "patrol operators",
      architectureLabel: "autonomous patrol architecture"
    }
  },
  "edge-data-processing": {
    cardBadge: "Disconnected decisions",
    detail: {
      orientation: {
        useThisWhen:
          "A user needs local analytics, fusion, or decision support when cloud backhaul is weak or unavailable.",
        decisionSupported:
          "Which edge fusion and mission software layers can reduce analyst burden and preserve decision speed.",
        bestOutput:
          "A shortlist of edge software and local processing capabilities tied to mission decisions.",
        notFor: "Generic enterprise analytics modernization.",
        exampleQuestion: "Which edge data capabilities can keep remote teams deciding when connectivity degrades?",
        primaryDomains: "ISR & Sensing, Cyber & Data, Communications & Infrastructure"
      }
    },
    insightCopy: {
      validationLabel: "edge validation",
      operatorLabel: "remote teams",
      architectureLabel: "edge decision architecture"
    }
  },
  "expeditionary-communications-resilience": {
    cardBadge: "Remote connectivity",
    detail: {
      orientation: {
        useThisWhen:
          "A user needs remote teams to keep sensing, command, and local networking alive without fixed infrastructure.",
        decisionSupported:
          "Which relay, mesh, bandwidth, and local software layers sustain operations under degraded links.",
        bestOutput:
          "A working list of communications resilience targets for field validation.",
        notFor: "Enterprise communications procurement or office IT modernization.",
        exampleQuestion: "Which communications layers should we validate to keep remote operations connected?",
        primaryDomains: "ISR & Sensing, Cyber & Data, Communications & Infrastructure"
      }
    },
    insightCopy: {
      validationLabel: "communications field validation",
      operatorLabel: "remote mission teams",
      architectureLabel: "communications resilience architecture"
    }
  },
  "cyber-mission-assurance-remote-operations": {
    cardBadge: "Cyber resilience",
    detail: {
      orientation: {
        useThisWhen:
          "A user needs to understand cyber disruption risks to remote mission systems, suppliers, and critical services.",
        decisionSupported:
          "Which cyber assurance and resilient architecture capabilities deserve validation against operational impact.",
        bestOutput:
          "A shortlist of cyber assurance targets tied to mission continuity and evidence gaps.",
        notFor: "Classified cyber risk assessment or compliance-only checklisting.",
        exampleQuestion: "Which cyber assurance capabilities would most reduce remote mission interruption risk?",
        primaryDomains: "Cyber & Data, Communications & Infrastructure"
      }
    },
    insightCopy: {
      validationLabel: "mission assurance validation",
      operatorLabel: "remote mission owners",
      architectureLabel: "cyber resilience architecture"
    }
  },
  "northern-logistics-sustainment-readiness": {
    cardBadge: "Remote sustainment",
    detail: {
      orientation: {
        useThisWhen:
          "A user needs sustainment, power, support, and industrial readiness options for long northern operating windows.",
        decisionSupported:
          "Which sustainment and support layers reduce bottlenecks for remote force packages and capability delivery.",
        bestOutput:
          "A shortlist of logistics, power, relay, recovery, or supplier-readiness targets.",
        notFor: "A full logistics ERP, transport plan, or broad supply-chain management tool.",
        exampleQuestion: "Which sustainment capabilities keep northern mission systems available long enough to matter?",
        primaryDomains: "Maritime Systems, Cyber & Data, Communications & Infrastructure"
      }
    },
    insightCopy: {
      validationLabel: "sustainment validation",
      operatorLabel: "northern sustainment teams",
      architectureLabel: "remote sustainment architecture"
    }
  }
};

function buildDefaultDetailConfig(useCase: Pick<UseCase, "name">): UseCaseDetailConfig {
  return {
    overviewEyebrow: "Page overview",
    overviewBody: `This view shows capabilities relevant to ${useCase.name}, grouped by type and maturity. Use clusters to understand the landscape, filters to refine results, and top targets to identify priority engagement opportunities.`,
    capabilityDefinition:
      "A capability is a product, system, or technical solution that can be evaluated or deployed independently.",
    orientation: {
      useThisWhen:
        "A user needs to turn a mission or enabling problem into a defensible capability and engagement decision.",
      decisionSupported:
        `Which capabilities, companies, and evidence should be reviewed first for ${useCase.name}.`,
      bestOutput:
        "A ranked target list with rationale, evidence posture, gaps, and a lightweight working list for follow-up.",
      notFor: "A generic market scan, CRM pipeline, or classified requirement assessment.",
      exampleQuestion: `Who should we engage first for ${useCase.name}, and why now?`,
      primaryDomains: "Linked technical domains vary by the mapped capability data."
    },
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
