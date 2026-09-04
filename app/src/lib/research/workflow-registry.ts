export interface ResearchWorkflowModeConfiguration {
  name: "discovery-batch" | "deep-dossier" | "dossier-enrichment" | "corpus-refresh" | "canonical-repair" | "refresh-batch" | "bootstrap";
  candidateMinimum: number;
  candidateTarget: number;
  candidateMaximum: number;
  prospectMinimum: number;
  prospectMaximum: number;
  sourceLaneMinimum: number;
  namedTargetMinimum: number;
  namedTargetMaximum: number;
  typedDispositionMayReplaceCandidate: boolean;
}

export const researchWorkflowModeConfigurations = [
  {
    name: "discovery-batch",
    candidateMinimum: 8,
    candidateTarget: 10,
    candidateMaximum: 10,
    prospectMinimum: 40,
    prospectMaximum: 75,
    sourceLaneMinimum: 6,
    namedTargetMinimum: 0,
    namedTargetMaximum: 0,
    typedDispositionMayReplaceCandidate: false
  },
  {
    name: "deep-dossier",
    candidateMinimum: 0,
    candidateTarget: 5,
    candidateMaximum: 5,
    prospectMinimum: 1,
    prospectMaximum: 5,
    sourceLaneMinimum: 3,
    namedTargetMinimum: 1,
    namedTargetMaximum: 5,
    typedDispositionMayReplaceCandidate: true
  },
  {
    name: "dossier-enrichment",
    candidateMinimum: 0,
    candidateTarget: 50,
    candidateMaximum: 50,
    prospectMinimum: 1,
    prospectMaximum: 50,
    sourceLaneMinimum: 3,
    namedTargetMinimum: 1,
    namedTargetMaximum: 50,
    typedDispositionMayReplaceCandidate: true
  },
  {
    name: "corpus-refresh",
    candidateMinimum: 0,
    candidateTarget: 50,
    candidateMaximum: 50,
    prospectMinimum: 1,
    prospectMaximum: 50,
    sourceLaneMinimum: 3,
    namedTargetMinimum: 1,
    namedTargetMaximum: 50,
    typedDispositionMayReplaceCandidate: true
  },
  {
    name: "canonical-repair",
    candidateMinimum: 0,
    candidateTarget: 25,
    candidateMaximum: 25,
    prospectMinimum: 1,
    prospectMaximum: 25,
    sourceLaneMinimum: 2,
    namedTargetMinimum: 1,
    namedTargetMaximum: 25,
    typedDispositionMayReplaceCandidate: true
  },
  {
    name: "refresh-batch",
    candidateMinimum: 0,
    candidateTarget: 50,
    candidateMaximum: 50,
    prospectMinimum: 0,
    prospectMaximum: 50,
    sourceLaneMinimum: 4,
    namedTargetMinimum: 0,
    namedTargetMaximum: 50,
    typedDispositionMayReplaceCandidate: true
  },
  {
    name: "bootstrap",
    candidateMinimum: 4,
    candidateTarget: 10,
    candidateMaximum: 10,
    prospectMinimum: 4,
    prospectMaximum: 75,
    sourceLaneMinimum: 6,
    namedTargetMinimum: 0,
    namedTargetMaximum: 0,
    typedDispositionMayReplaceCandidate: false
  }
] as const satisfies readonly ResearchWorkflowModeConfiguration[];

export type ResearchWorkflowCliMode = (typeof researchWorkflowModeConfigurations)[number]["name"];
export type CurrentResearchRunMode = "bootstrap" | "discovery_batch" | "deep_dossier" | "dossier_enrichment" | "corpus_refresh" | "canonical_repair" | "refresh_batch";

export const researchWorkflowCliModeValues = researchWorkflowModeConfigurations.map((mode) => mode.name);

const runModeByCliMode = {
  "discovery-batch": "discovery_batch",
  "deep-dossier": "deep_dossier",
  "dossier-enrichment": "dossier_enrichment",
  "corpus-refresh": "corpus_refresh",
  "canonical-repair": "canonical_repair",
  "refresh-batch": "refresh_batch",
  bootstrap: "bootstrap"
} as const satisfies Record<ResearchWorkflowCliMode, CurrentResearchRunMode>;

export function researchWorkflowModeConfiguration(value: string) {
  return researchWorkflowModeConfigurations.find((mode) => mode.name === value);
}

export function researchWorkflowRunMode(value: ResearchWorkflowCliMode) {
  return runModeByCliMode[value];
}

export function researchWorkflowModeForRunMode(value: string) {
  const entry = Object.entries(runModeByCliMode).find(([, runMode]) => runMode === value);
  return entry ? researchWorkflowModeConfiguration(entry[0]) : undefined;
}

export function researchWorkflowRegistryParityIssues(value: unknown) {
  if (!Array.isArray(value)) return ["Research workflow registry modes must be an array."];
  if (JSON.stringify(value) === JSON.stringify(researchWorkflowModeConfigurations)) return [];
  return ["Research workflow registry modes do not exactly match the executable runtime mode configuration."];
}
