import type {
  CapabilityUseCase,
  DefenceRelevance,
  Pathway,
  RelevanceBand
} from "@/types/domain";

const relevanceScores: Record<RelevanceBand, number> = {
  high: 30,
  medium: 20,
  low: 10
};

const pathwayScores: Record<Pathway, number> = {
  scale: 20,
  validate: 12,
  build: 6
};

const defenceScores: Record<DefenceRelevance, number> = {
  high: 20,
  medium: 10,
  low: 0
};

const geographyScores = {
  canada: 10,
  nato: 6,
  global: 3
} as const;

export function calculateSignalRecencyScore(lastSignalAt: string | null) {
  if (!lastSignalAt) {
    return 0;
  }

  const days = Math.floor(
    (Date.now() - new Date(lastSignalAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (days <= 90) {
    return 10;
  }

  if (days <= 180) {
    return 6;
  }

  if (days <= 365) {
    return 3;
  }

  return 0;
}

export function calculateRankingScore(input: {
  relevanceBand: RelevanceBand;
  pathway: Pathway;
  defenceRelevance: DefenceRelevance;
  geography: keyof typeof geographyScores;
  lastSignalAt: string | null;
  evidenceStrength: number;
  actionabilityScore: number;
  reviewerOverrideDelta: number;
}) {
  return (
    relevanceScores[input.relevanceBand] +
    pathwayScores[input.pathway] +
    defenceScores[input.defenceRelevance] +
    geographyScores[input.geography] +
    calculateSignalRecencyScore(input.lastSignalAt) +
    input.evidenceStrength +
    input.actionabilityScore +
    input.reviewerOverrideDelta
  );
}

export function explainRankingDrivers(input: {
  relevanceBand: RelevanceBand;
  pathway: Pathway;
  defenceRelevance: DefenceRelevance;
  geography: keyof typeof geographyScores;
  lastSignalAt: string | null;
  evidenceStrength: number;
  actionabilityScore: number;
  reviewerOverrideDelta: number;
}) {
  const drivers = [
    `${input.relevanceBand} mission fit`,
    `${input.pathway} pathway`,
    `${input.defenceRelevance} defence fit`,
    `${formatGeographyDriver(input.geography)} geography`,
    calculateSignalRecencyScore(input.lastSignalAt) >= 6 ? "recent signal" : "limited recent signal",
    input.evidenceStrength >= 5 ? "stronger evidence" : input.evidenceStrength >= 3 ? "some evidence" : "thin evidence",
    input.actionabilityScore >= 5 ? "clear next step" : "needs action shaping"
  ];

  if (input.reviewerOverrideDelta) {
    drivers.push("reviewer adjustment");
  }

  return drivers;
}

export function hydrateRankingScore<
  T extends CapabilityUseCase & { company: { geography: "canada" | "nato" | "global" } }
>(record: T) {
  return {
    ...record,
    rankingScore: calculateRankingScore({
      relevanceBand: record.relevanceBand,
      pathway: record.pathway,
      defenceRelevance: record.defenceRelevance,
      geography: record.company.geography,
      lastSignalAt: record.lastSignalAt,
      evidenceStrength: record.evidenceStrength,
      actionabilityScore: record.actionabilityScore,
      reviewerOverrideDelta: record.reviewerOverrideDelta
    })
  };
}

function formatGeographyDriver(value: keyof typeof geographyScores) {
  if (value === "canada") {
    return "Canadian";
  }

  if (value === "nato") {
    return "NATO";
  }

  return "global";
}
