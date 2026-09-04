import { researchCandidateContractIssues } from "@/lib/research/deployment-contract";

export type ResearchQueueCandidate = {
  id: string;
  research_run_id: string | null;
  candidate_kind: string;
  schema_version: string | null;
  duplicate_check: unknown;
  reviewer_rationale: string | null;
  created_at: string;
};

export type ResearchQueueRun = {
  id: string;
  run_type: string;
  scope: unknown;
  status: string;
  completed_at: string | null;
  resume_token: string | null;
};

export type ResearchQueueBatch = {
  key: string;
  runId: string | null;
  label: string;
  runType: string;
  runStatus: string;
  completedAt: string | null;
  firstStagedAt: string;
  pendingCount: number;
  organizationCount: number;
  demandCount: number;
  matchCount: number;
  refreshCount: number;
  repairCount: number;
  bulkReviewEligible: boolean;
  bulkReviewIssue: string | null;
};

const bulkReviewKinds = new Set([
  "organization_bundle",
  "demand_signal_bundle",
  "organization_refresh_bundle",
  "demand_refresh_bundle"
]);

function runLabel(run: ResearchQueueRun | undefined, runId: string | null) {
  if (!runId) return "Unassigned review items";
  if (run?.resume_token?.trim()) return run.resume_token.trim();
  const scope = run?.scope && typeof run.scope === "object" ? run.scope as Record<string, unknown> : null;
  const clientRunId = typeof scope?.client_run_id === "string" ? scope.client_run_id.trim() : "";
  return clientRunId || `Research run ${runId.slice(0, 8)}`;
}

function bulkReviewIssue(candidates: ResearchQueueCandidate[], run: ResearchQueueRun | undefined) {
  if (!run) return "This group is not linked to a research run.";
  if (run.status !== "completed") return "The research run is not complete.";
  if (candidates.length > 50) return "This run exceeds the 50-candidate atomic review limit.";
  if (candidates.some((candidate) => !bulkReviewKinds.has(candidate.candidate_kind))) {
    return "This run includes a candidate type that requires individual review.";
  }
  const contractIssues = researchCandidateContractIssues(candidates.map((candidate) => ({
    candidate_kind: candidate.candidate_kind,
    schema_version: candidate.schema_version
  })));
  if (contractIssues.length) return "One or more candidates use an unsupported review contract.";
  if (candidates.some((candidate) => {
    const duplicateStatus = (candidate.duplicate_check as { status?: string } | null)?.status;
    return !["clear", "merged"].includes(duplicateStatus ?? "");
  })) return "Resolve every possible duplicate before using batch acceptance.";
  if (candidates.some((candidate) => {
    const length = candidate.reviewer_rationale?.trim().length ?? 0;
    return length < 80 || length > 2000;
  })) return "Every candidate needs its complete AI-prepared reviewer rationale.";
  return null;
}

export function buildResearchQueueBatches(candidates: ResearchQueueCandidate[], runs: ResearchQueueRun[]) {
  const runsById = new Map(runs.map((run) => [run.id, run]));
  const grouped = new Map<string, ResearchQueueCandidate[]>();
  candidates.forEach((candidate) => {
    const key = candidate.research_run_id ?? "unassigned";
    grouped.set(key, [...(grouped.get(key) ?? []), candidate]);
  });

  return [...grouped.entries()].map(([key, batchCandidates]): ResearchQueueBatch => {
    const runId = key === "unassigned" ? null : key;
    const run = runId ? runsById.get(runId) : undefined;
    const issue = bulkReviewIssue(batchCandidates, run);
    return {
      key,
      runId,
      label: runLabel(run, runId),
      runType: run?.run_type ?? "unassigned",
      runStatus: run?.status ?? "unassigned",
      completedAt: run?.completed_at ?? null,
      firstStagedAt: batchCandidates.map((candidate) => candidate.created_at).sort()[0],
      pendingCount: batchCandidates.length,
      organizationCount: batchCandidates.filter((candidate) => candidate.candidate_kind === "organization_bundle").length,
      demandCount: batchCandidates.filter((candidate) => candidate.candidate_kind === "demand_signal_bundle").length,
      matchCount: batchCandidates.filter((candidate) => candidate.candidate_kind === "demand_match_bundle").length,
      refreshCount: batchCandidates.filter((candidate) => ["organization_refresh_bundle", "demand_refresh_bundle"].includes(candidate.candidate_kind)).length,
      repairCount: batchCandidates.filter((candidate) => candidate.candidate_kind === "organization_canonical_repair_bundle").length,
      bulkReviewEligible: issue === null,
      bulkReviewIssue: issue
    };
  }).sort((left, right) => left.firstStagedAt.localeCompare(right.firstStagedAt));
}

export function candidateTypeTotals(candidates: ResearchQueueCandidate[]) {
  return {
    organizations: candidates.filter((candidate) => candidate.candidate_kind === "organization_bundle").length,
    demands: candidates.filter((candidate) => candidate.candidate_kind === "demand_signal_bundle").length,
    matches: candidates.filter((candidate) => candidate.candidate_kind === "demand_match_bundle").length,
    refreshes: candidates.filter((candidate) => ["organization_refresh_bundle", "demand_refresh_bundle"].includes(candidate.candidate_kind)).length,
    repairs: candidates.filter((candidate) => candidate.candidate_kind === "organization_canonical_repair_bundle").length
  };
}
