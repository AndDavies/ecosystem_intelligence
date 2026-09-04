import type { ResearchCandidateBatchV2, ResearchRun } from "./pipeline-schema";

export type ResearchFinalizeMode = "check-only" | "file-only" | "apply";

export interface ResearchFinalizeStep {
  id: "validate" | "logos" | "validate-after-logos" | "smoke" | "review" | "stage" | "import" | "reconcile";
  script: string;
  args: string[];
  effect: "none" | "local" | "admin-review";
}

function artifactPaths(runPath: string, run: ResearchRun) {
  const outputs = run.outputs;
  return [
    runPath,
    outputs.collectionPlan,
    outputs.claimLedger,
    outputs.canonicalRepairSnapshot,
    outputs.prospectInventory,
    outputs.signalBatch,
    outputs.sourceLeadBatch,
    outputs.candidateBatch
  ].filter((value): value is string => Boolean(value));
}

function smokeArgs(runPath: string, run: ResearchRun, candidatePath: string) {
  const args = ["--run", runPath];
  const append = (flag: string, value: string | null | undefined) => {
    if (value) args.push(flag, value);
  };
  append("--collection-plan", run.outputs.collectionPlan);
  append("--claims", run.outputs.claimLedger);
  append("--canonical-snapshot", run.outputs.canonicalRepairSnapshot);
  append("--prospects", run.outputs.prospectInventory);
  append("--signals", run.outputs.signalBatch);
  append("--leads", run.outputs.sourceLeadBatch);
  args.push("--candidates", candidatePath, "--check-only");
  return args;
}

export function buildResearchFinalizePlan(options: {
  runPath: string;
  run: ResearchRun;
  candidatePath: string;
  batch: ResearchCandidateBatchV2;
  mode: ResearchFinalizeMode;
  logoConcurrency?: number;
}) {
  const { runPath, run, candidatePath, batch, mode } = options;
  if (run.runId !== batch.runId) throw new Error(`Run ${run.runId} does not match candidate batch ${batch.runId}.`);
  if (run.status !== "completed") throw new Error(`Research finalization requires a completed run; ${run.runId} is ${run.status}.`);
  if (run.outputs.candidateBatch !== candidatePath) {
    throw new Error(`Run candidateBatch output '${run.outputs.candidateBatch ?? "missing"}' does not match '${candidatePath}'.`);
  }

  const steps: ResearchFinalizeStep[] = [{
    id: "validate",
    script: "research:validate",
    args: artifactPaths(runPath, run),
    effect: "none"
  }];
  const missingLogoCount = batch.candidates.filter((candidate) =>
    candidate.candidateKind === "organization_bundle" && !candidate.candidateLogo
  ).length;
  if (missingLogoCount > 0 && mode !== "check-only") {
    steps.push({
      id: "logos",
      script: "research:logos",
      args: ["--run", run.runId, "--candidates", candidatePath, "--concurrency", String(options.logoConcurrency ?? 4), "--apply"],
      effect: "local"
    }, {
      id: "validate-after-logos",
      script: "research:validate",
      args: artifactPaths(runPath, run),
      effect: "none"
    });
  }
  steps.push({ id: "smoke", script: "research:smoke", args: smokeArgs(runPath, run, candidatePath), effect: "none" });

  if (batch.candidates.length === 0) return { runId: run.runId, candidateCount: 0, missingLogoCount, zeroCandidateDisposition: true, steps };
  if (mode === "check-only") return { runId: run.runId, candidateCount: batch.candidates.length, missingLogoCount, zeroCandidateDisposition: false, steps };

  steps.push(
    { id: "review", script: "research:review", args: [candidatePath], effect: "local" },
    { id: "stage", script: "research:stage", args: ["--run", runPath, "--candidates", candidatePath], effect: "local" }
  );
  if (mode === "apply") {
    const stagingPath = run.outputs.stagingExport ?? `research/ingestion/staging/${run.runId}.json`;
    steps.push(
      { id: "import", script: "research:import", args: ["--staging", stagingPath], effect: "admin-review" },
      { id: "reconcile", script: "research:reconcile", args: ["--run", runPath, "--candidates", candidatePath], effect: "none" }
    );
  }
  return { runId: run.runId, candidateCount: batch.candidates.length, missingLogoCount, zeroCandidateDisposition: false, steps };
}
