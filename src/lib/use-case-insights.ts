import type { UseCaseInsightCopy } from "@/lib/use-case-config";
import type { Pathway, SignalType } from "@/types/domain";
import type { CapabilityCardView, UseCaseView } from "@/types/view-models";

export interface UseCaseTargetRead {
  label: string;
  tone: "success" | "info" | "muted";
  whyPrioritize: string;
  priorityNow: string;
  whyNotOthers: string;
  strength: string;
  limitation: string;
  actionDirective: string;
  context: string;
}

export interface UseCaseInsightLayer {
  recommendedActions: Array<{
    verb: "Engage" | "Validate" | "Monitor";
    tone: "success" | "info" | "muted";
    entry: CapabilityCardView;
    directive: string;
    context: string;
  }>;
  ecosystemSummary: string[];
  whatThisMeans: string[];
  gaps: string[];
}

const defaultInsightCopy: UseCaseInsightCopy = {
  deploymentReadyLabel: "deployment-ready",
  deploymentLabel: "deployment",
  validationLabel: "field or operator validation",
  operatorLabel: "operators",
  architectureLabel: "operating architecture"
};

function resolveInsightCopy(overrides?: Partial<UseCaseInsightCopy>) {
  return {
    ...defaultInsightCopy,
    ...overrides
  };
}

export function buildUseCaseInsight(
  view: UseCaseView,
  insightCopyOverrides?: Partial<UseCaseInsightCopy>
): UseCaseInsightLayer {
  const insightCopy = resolveInsightCopy(insightCopyOverrides);
  const totalCapabilities = view.allCapabilities.length;
  const pathwayCounts = {
    build: view.maturityDistribution.find((item) => item.pathway === "build")?.count ?? 0,
    validate: view.maturityDistribution.find((item) => item.pathway === "validate")?.count ?? 0,
    scale: view.maturityDistribution.find((item) => item.pathway === "scale")?.count ?? 0
  };
  const dominantPathway = (Object.entries(pathwayCounts).sort((left, right) => right[1] - left[1])[0]?.[0] ??
    "validate") as Pathway;
  const uniqueCompanyIds = new Set(view.allCapabilities.map((item) => item.company.id));
  const geographyRanking = buildGeographyRanking(view.allCapabilities);
  const leadingGeography = geographyRanking[0] ?? null;
  const clusterRanking = [...view.clusters].sort((left, right) => right.count - left.count);
  const dominantCluster = clusterRanking[0] ?? null;
  const thinnestCluster = clusterRanking.at(-1) ?? null;
  const scaleCount = pathwayCounts.scale;
  const validateCount = pathwayCounts.validate;
  const recommendedActions = buildRecommendedActions(view, insightCopy);

  const ecosystemSummary: string[] = [];

  if (dominantPathway === "validate") {
    ecosystemSummary.push(
      `Most capabilities sit in Validate (${validateCount} of ${totalCapabilities}), so the landscape is strongest in mid-stage systems rather than fully ${insightCopy.deploymentReadyLabel} options.`
    );
  } else if (dominantPathway === "scale") {
    ecosystemSummary.push(
      `Scale-ready capabilities are relatively prominent (${scaleCount} of ${totalCapabilities}), which gives this Use Case clearer near-term ${insightCopy.deploymentLabel} paths than a typical early ecosystem.`
    );
  } else {
    ecosystemSummary.push(
      `Build-stage capabilities still lead this landscape (${pathwayCounts.build} of ${totalCapabilities}), so the ecosystem remains early and exploratory overall.`
    );
  }

  if (scaleCount <= Math.max(3, Math.floor(totalCapabilities * 0.2))) {
    ecosystemSummary.push(
      `Only ${scaleCount} capabilities appear Scale-ready, leaving a small pool of immediate ${insightCopy.deploymentLabel}-oriented opportunities.`
    );
  } else {
    ecosystemSummary.push(
      `${scaleCount} capabilities are already in Scale, so there is meaningful depth for near-term ${insightCopy.deploymentLabel} beyond monitoring alone.`
    );
  }

  if (dominantCluster) {
    ecosystemSummary.push(
      `${dominantCluster.cluster.name} is the deepest cluster with ${dominantCluster.count} capabilities, making it the clearest concentration of current market depth.`
    );
  }

  if (leadingGeography && leadingGeography.share >= 0.55 && uniqueCompanyIds.size > 1) {
    ecosystemSummary.push(
      `${leadingGeography.label} suppliers account for ${leadingGeography.count} of ${uniqueCompanyIds.size} companies in view, so the landscape is concentrated in one geography.`
    );
  }

  const whatThisMeans: string[] = [];

  if (validateCount >= scaleCount) {
    whatThisMeans.push(
      `Implication: Focus engagement on validating the strongest mid-stage systems to close the ${insightCopy.deploymentLabel} gap.`
    );
  }

  if (scaleCount <= 3) {
    whatThisMeans.push(
      "Implication: Start with the small Scale-ready subset first, because those entries are the clearest near-term actions."
    );
  } else {
    whatThisMeans.push(
      "Implication: Separate the top Scale-stage capabilities from the broader list before spending time on lower-priority options."
    );
  }

  if (dominantCluster && thinnestCluster && dominantCluster.cluster.id !== thinnestCluster.cluster.id) {
    whatThisMeans.push(
      `Implication: Use engagement to bridge beyond ${dominantCluster.cluster.name.toLowerCase()}, especially where ${thinnestCluster.cluster.name.toLowerCase()} remains thin.`
    );
  }

  const gaps: string[] = [];

  if (scaleCount <= Math.max(3, Math.floor(totalCapabilities * 0.2))) {
    gaps.push(`Limited ${insightCopy.deploymentReadyLabel} capabilities for immediate engagement.`);
  }

  const clusterWithoutScale = view.clusters.find((entry) => {
    const clusterMembers = view.allCapabilities.filter((item) => item.cluster.id === entry.cluster.id);
    return clusterMembers.length > 0 && clusterMembers.every((item) => item.mapping.pathway !== "scale");
  });

  if (clusterWithoutScale) {
    gaps.push(
      `No Scale-stage depth in ${clusterWithoutScale.cluster.name.toLowerCase()}, leaving a thinner path to ${insightCopy.deploymentLabel} there.`
    );
  }

  if (leadingGeography && leadingGeography.share >= 0.7 && uniqueCompanyIds.size > 2) {
    gaps.push(
      `Supplier coverage is concentrated in ${leadingGeography.label.toLowerCase()}, which may limit comparison across geographies.`
    );
  }

  if (gaps.length < 2 && thinnestCluster) {
    gaps.push(
      `Thin representation in ${thinnestCluster.cluster.name.toLowerCase()} compared with the rest of the landscape.`
    );
  }

  return {
    recommendedActions,
    ecosystemSummary: ecosystemSummary.slice(0, 3),
    whatThisMeans: whatThisMeans.slice(0, 3),
    gaps: gaps.slice(0, 3)
  };
}

export function getTargetRead(
  entry: CapabilityCardView,
  index: number,
  topTargets: CapabilityCardView[],
  view?: UseCaseView,
  insightCopyOverrides?: Partial<UseCaseInsightCopy>
): UseCaseTargetRead {
  const insightCopy = resolveInsightCopy(insightCopyOverrides);
  const scaleEntriesBefore = topTargets
    .slice(0, index + 1)
    .filter((item) => item.mapping.pathway === "scale").length;
  const scaleCount = view?.maturityDistribution.find((item) => item.pathway === "scale")?.count ?? 0;
  const clusterCount =
    view?.allCapabilities.filter((item) => item.cluster.id === entry.cluster.id).length ?? 0;
  const recentSignal = getMostRelevantSignal(entry.signals);
  const signalEvidence = recentSignal ? describeSignalEvidence(recentSignal.signalType) : null;
  const capabilityType = entry.capability.capabilityType.toLowerCase();

  if (entry.mapping.pathway === "scale") {
    const whyPrioritize =
      scaleCount <= 3
        ? "One of the few Scale-stage capabilities in this Use Case."
        : "Ranks among the strongest Scale-stage capabilities in the current shortlist.";

    return {
      label: "Immediate Opportunity",
      tone: "success",
      whyPrioritize,
      priorityNow: [
        `One of only ${scaleCount} Scale-stage capabilities in this Use Case.`,
        signalEvidence
          ? `Backed by ${signalEvidence}, so it is more actionable now than Validate-stage alternatives.`
          : "Ranks above Validate-stage alternatives because it can support near-term engagement without another validation cycle."
      ].join(" "),
      whyNotOthers: getWhyNotOthers(entry, capabilityType, insightCopy),
      strength: getStrength(entry, capabilityType),
      limitation: getLimitation(entry, capabilityType, insightCopy),
      actionDirective: getActionDirective(entry, capabilityType),
      context:
        scaleEntriesBefore <= 3
          ? "One of the clearest near-term engagement priorities in this Use Case."
          : `${capitalize(insightCopy.deploymentReadyLabel)} and worth evaluation, but not among the first immediate moves.`
    };
  }

  if (entry.mapping.pathway === "validate") {
    const whyPrioritize =
      index <= 2
        ? "Highest-ranked Validate-stage option for closing the deployment gap."
        : "Stronger near-term candidate than most other mid-stage capabilities in view.";

    return {
      label: "High Potential - Needs Validation",
      tone: "info",
      whyPrioritize,
      priorityNow:
        `Highest-ranked Validate-stage option in the shortlist and one of the clearest candidates to move into ${insightCopy.validationLabel} next.`,
      whyNotOthers:
        "Most competing mid-stage capabilities either solve narrower problems or have a less obvious next validation step.",
      strength: getStrength(entry, capabilityType),
      limitation: getLimitation(entry, capabilityType, insightCopy),
      actionDirective: getActionDirective(entry, capabilityType),
      context: `Relevant now, but it still needs ${insightCopy.validationLabel} before wider ${insightCopy.deploymentLabel}.`
    };
  }

  return {
    label: "Early Signal - Monitor",
    tone: "muted",
    whyPrioritize:
      clusterCount <= 4
        ? `One of the few early signals in ${entry.cluster.name.toLowerCase()}.`
        : `Strategically relevant, but earlier than the top ${insightCopy.deploymentLabel}-oriented options.`,
    priorityNow:
      `Strategically relevant to this Use Case, but still too early to justify near-term ${insightCopy.deploymentLabel} over stronger alternatives.`,
    whyNotOthers:
      `Higher-ranked options already have clearer validation or ${insightCopy.deploymentLabel} evidence, so this remains a monitor rather than an active priority.`,
    strength: getStrength(entry, capabilityType),
    limitation: getLimitation(entry, capabilityType, insightCopy),
    actionDirective: getActionDirective(entry, capabilityType),
    context: "Useful to track, but still too early to treat as a near-term engagement priority."
  };
}

function buildRecommendedActions(
  view: UseCaseView,
  insightCopyOverrides?: Partial<UseCaseInsightCopy>
) {
  return view.topTargets.slice(0, 3).map((entry, index) => {
    const verb = getActionVerb(entry.mapping.pathway);
    const targetRead = getTargetRead(entry, index, view.topTargets, view, insightCopyOverrides);

    return {
      verb,
      tone: (verb === "Engage" ? "success" : verb === "Validate" ? "info" : "muted") as
        | "success"
        | "info"
        | "muted",
      entry,
      directive: targetRead.actionDirective,
      context: targetRead.whyPrioritize
    };
  });
}

function buildGeographyRanking(capabilities: CapabilityCardView[]) {
  const uniqueCompanies = new Map(
    capabilities.map((entry) => [entry.company.id, entry.company.geography])
  );

  const geographyCounts = Array.from(uniqueCompanies.values()).reduce<Record<string, number>>((acc, geography) => {
    acc[geography] = (acc[geography] ?? 0) + 1;
    return acc;
  }, {});

  const total = uniqueCompanies.size || 1;

  return Object.entries(geographyCounts)
    .map(([geography, count]) => ({
      geography,
      count,
      share: count / total,
      label: geography === "canada" ? "Canada-based" : geography === "nato" ? "NATO-aligned" : "Global"
    }))
    .sort((left, right) => right.count - left.count);
}

function getActionVerb(pathway: Pathway): "Engage" | "Validate" | "Monitor" {
  if (pathway === "scale") {
    return "Engage";
  }

  if (pathway === "validate") {
    return "Validate";
  }

  return "Monitor";
}

function getMostRelevantSignal(signals: CapabilityCardView["signals"]) {
  const signalPriority: Record<SignalType, number> = {
    contract: 6,
    partnership: 5,
    pilot: 4,
    technical_milestone: 3,
    accelerator: 2,
    funding: 1,
    strategic_hiring: 0
  };

  return [...signals].sort((left, right) => {
    const priorityDelta = signalPriority[right.signalType] - signalPriority[left.signalType];

    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return new Date(right.observedAt).getTime() - new Date(left.observedAt).getTime();
  })[0];
}

function describeSignalEvidence(signalType: SignalType) {
  if (signalType === "contract") {
    return "a recent contract or procurement-facing signal";
  }

  if (signalType === "partnership") {
    return "a recent integration or deployment partnership";
  }

  if (signalType === "pilot") {
    return "a recent field pilot or operational trial";
  }

  if (signalType === "technical_milestone") {
    return "a recent technical milestone that reduces execution risk";
  }

  if (signalType === "accelerator") {
    return "entry into a relevant field-testing or commercialization program";
  }

  if (signalType === "funding") {
    return "recent external funding support";
  }

  return "recent strategic hiring that signals delivery focus";
}

function getWhyNotOthers(
  entry: CapabilityCardView,
  capabilityType: string,
  insightCopy: UseCaseInsightCopy = defaultInsightCopy
) {
  if (
    capabilityType.includes("analytics") ||
    capabilityType.includes("software") ||
    capabilityType.includes("data")
  ) {
    return "Most competing analytics and fusion options remain in Validate stage or still depend on deeper workflow integration before frontline use.";
  }

  if (capabilityType.includes("radar")) {
    return "Most competing sensing options are either Validate-stage or rely on indirect analytics rather than delivering direct monitoring value.";
  }

  if (capabilityType.includes("satellite")) {
    return "Most competing route-awareness options either cover smaller areas or still need validation before recurring operational use.";
  }

  if (capabilityType.includes("rf")) {
    return "Most competing sensing options are more visible or less suited to constrained monitoring conditions.";
  }

  if (entry.mapping.pathway === "scale") {
    return `Most competing capabilities remain in Validate stage and still need ${insightCopy.operatorLabel.toLowerCase()} access before they can be treated as near-term ${insightCopy.deploymentLabel} candidates.`;
  }

  return `Higher-ranked alternatives have either stronger ${insightCopy.deploymentLabel} evidence or a clearer near-term use case than the rest of the field.`;
}

function getStrength(entry: CapabilityCardView, capabilityType: string) {
  if (
    capabilityType.includes("analytics") ||
    capabilityType.includes("software") ||
    capabilityType.includes("data")
  ) {
    return "Turns fragmented source data into operator-ready decisions instead of another raw feed.";
  }

  if (capabilityType.includes("radar")) {
    return "Delivers persistent watch over constrained operating corridors and fixed approaches.";
  }

  if (capabilityType.includes("satellite")) {
    return "Provides wide-area route awareness across dispersed operating areas.";
  }

  if (capabilityType.includes("rf")) {
    return "Adds passive coverage in environments where active sensing would reveal the watch position.";
  }

  if (capabilityType.includes("relay") || capabilityType.includes("communications")) {
    return "Extends coverage into areas where fixed communications do not exist or remain sparse.";
  }

  if (capabilityType.includes("eo") || capabilityType.includes("ir")) {
    return "Stands up local watch quickly at austere or temporary positions.";
  }

  if (capabilityType.includes("power")) {
    return "Improves endurance for remote sensing and relay nodes in low-support environments.";
  }

  if (entry.cluster.id === "cluster-3") {
    return "Reaches operating environments where crewed or fixed systems cannot stay persistent.";
  }

  return "Directly addresses a known sensing, access, or integration constraint.";
}

function getLimitation(
  entry: CapabilityCardView,
  capabilityType: string,
  insightCopy: UseCaseInsightCopy = defaultInsightCopy
) {
  if (
    capabilityType.includes("analytics") ||
    capabilityType.includes("software") ||
    capabilityType.includes("data")
  ) {
    return "Depends on external sensors and integration into existing command or analyst workflows.";
  }

  if (capabilityType.includes("radar")) {
    return "Best for fixed corridors rather than broad distributed coverage.";
  }

  if (capabilityType.includes("satellite")) {
    return "Stronger for route monitoring than for local tactical watch.";
  }

  if (capabilityType.includes("rf")) {
    return "Emitter-based detection is weaker when targets remain silent.";
  }

  if (capabilityType.includes("relay") || capabilityType.includes("communications")) {
    return "Creates enabling infrastructure but is less valuable without mission systems attached.";
  }

  if (capabilityType.includes("eo") || capabilityType.includes("ir")) {
    return "Line-of-sight coverage is narrower than wide-area sensing options.";
  }

  if (capabilityType.includes("power")) {
    return "Improves endurance but is not itself a differentiated sensing capability.";
  }

  if (entry.cluster.id === "cluster-3") {
    return "Still depends on field validation and sustainment proof in harsh operating conditions.";
  }

  return `Needs integration into a broader ${insightCopy.architectureLabel} to deliver full value.`;
}

function getActionDirective(entry: CapabilityCardView, capabilityType: string) {
  if (entry.mapping.pathway === "scale") {
    if (
      capabilityType.includes("analytics") ||
      capabilityType.includes("software") ||
      capabilityType.includes("data")
    ) {
      return `Engage ${entry.capability.name} for near-term operator evaluation on live workflows or source feeds.`;
    }

    if (capabilityType.includes("radar")) {
      return `Engage ${entry.capability.name} for near-term deployment assessment at high-priority monitoring corridors.`;
    }

    if (capabilityType.includes("satellite")) {
      return `Engage ${entry.capability.name} for route-risk support with planning and operations teams.`;
    }

    if (capabilityType.includes("rf")) {
      return `Engage ${entry.capability.name} for contested-monitoring trials where passive sensing matters.`;
    }

    return `Engage ${entry.capability.name} for near-term deployment validation with operators.`;
  }

  if (entry.mapping.pathway === "validate") {
    if (capabilityType.includes("relay") || capabilityType.includes("communications")) {
      return `Validate ${entry.capability.name} through field trials that stress remote connectivity and sustainment.`;
    }

    if (capabilityType.includes("analytics") || capabilityType.includes("software")) {
      return `Validate ${entry.capability.name} with operators before treating it as a deployment-ready software layer.`;
    }

    if (entry.cluster.id === "cluster-3") {
      return `Validate ${entry.capability.name} in trials that test access, endurance, and low-support operations.`;
    }

    return `Validate ${entry.capability.name} through operator trials before committing near-term engagement.`;
  }

  return `Monitor ${entry.capability.name} while field evidence and deployment fit mature.`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
