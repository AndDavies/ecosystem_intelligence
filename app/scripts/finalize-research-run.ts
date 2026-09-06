import { withResearchWriterLock, researchWriterLockPath } from "../src/lib/research/single-writer-lock";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { buildResearchFinalizePlan, type ResearchFinalizeMode } from "../src/lib/research/finalize-plan";
import { runResearchCommand } from "./autonomous-research";
import { artifactDigest, canResumeIntake, saveFinalizeReceipt, type FinalizeReceipt } from "../src/lib/research/finalize-state";
import { researchCandidateBatchV2Schema, researchRunSchema } from "../src/lib/research/pipeline-schema";

const executeFile = promisify(execFile);
const appRoot = process.cwd();
const workspaceRoot = path.resolve(appRoot, "..");

function option(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function readJson(filePath: string) {
  return JSON.parse(await readFile(filePath, "utf8")) as unknown;
}

async function main() {
  const runOption = option("--run");
  if (!runOption) throw new Error("Usage: pnpm research:finalize -- --run <research-run-path> [--file-only | --apply | --plan]");
  if (process.argv.includes("--apply") && process.argv.includes("--file-only")) throw new Error("Choose only one of --apply or --file-only.");
  const mode: ResearchFinalizeMode = process.argv.includes("--apply")
    ? "apply"
    : process.argv.includes("--file-only") ? "file-only" : "check-only";
  const runPath = path.resolve(workspaceRoot, runOption);
  const run = researchRunSchema.parse(await readJson(runPath));
  if (!run.outputs.candidateBatch) throw new Error(`Run ${run.runId} does not name a candidate batch output.`);
  const candidatePath = path.resolve(workspaceRoot, run.outputs.candidateBatch);
  const batch = researchCandidateBatchV2Schema.parse(await readJson(candidatePath));
  const relativeRunPath = path.relative(workspaceRoot, runPath);
  const relativeCandidatePath = path.relative(workspaceRoot, candidatePath);
  const logoConcurrency = Number(option("--logo-concurrency") ?? 4);
  if (!Number.isInteger(logoConcurrency) || logoConcurrency < 1 || logoConcurrency > 8) {
    throw new Error("--logo-concurrency must be an integer from 1 to 8.");
  }
  const plan = buildResearchFinalizePlan({
    runPath: relativeRunPath,
    run,
    candidatePath: relativeCandidatePath,
    batch,
    mode,
    logoConcurrency
  });
  if (process.argv.includes("--plan")) {
    console.log(JSON.stringify({ mode, ...plan }, null, 2));
    return;
  }

  const inputs = [relativeRunPath, run.outputs.collectionPlan, run.outputs.claimLedger,
    run.outputs.canonicalRepairSnapshot, run.outputs.prospectInventory, run.outputs.signalBatch,
    run.outputs.sourceLeadBatch, relativeCandidatePath].filter((p): p is string => Boolean(p));
  const receiptPath = path.join(workspaceRoot, "research/ingestion/local", run.runId, "finalize-receipt.json");
  let digest = await artifactDigest(workspaceRoot, inputs);
  let prior: FinalizeReceipt | null = null;
  try { prior = JSON.parse(await readFile(receiptPath, "utf8")); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  if (mode === "file-only" && prior && ["intake_started", "intake_verified"].includes(prior.phase)) throw new Error("Preserve the existing intake receipt; use check-only or reconcile the exact run.");
  // A matching receipt never replaces a live read. Do not replay a successful or uncertain write.
  if (mode === "apply" && canResumeIntake(prior, digest)) {
    await runResearchCommand("validate", inputs);
    if (process.exitCode) throw new Error("Resume validation failed; intake was not repeated.");
    await runResearchCommand("reconcile", ["--run", relativeRunPath, "--candidates", relativeCandidatePath]);
    prior!.phase = "intake_verified";
    prior!.verifiedAt = new Date().toISOString();
    await saveFinalizeReceipt(receiptPath, prior!);
    console.log(JSON.stringify({ ok: true, mode, runId: run.runId, resumed: true, adminReviewWriteAttempted: false }));
    return;
  }
  if (mode === "apply" && prior && ["intake_started", "intake_verified"].includes(prior.phase)) throw new Error("An earlier intake exists with different artifacts. Reconcile the original payload; use a new run for revised research.");
  const receipt: FinalizeReceipt = {
    schemaVersion: "research_finalize_receipt_v1", runId: run.runId, inputDigest: digest,
    phase: "research_ready", startedAt: new Date().toISOString(), steps: []
  };
  for (const step of plan.steps) {
    console.log(`research:finalize ${run.runId}: ${step.id}`);
    const started = Date.now();
    if (step.id === "import") {
      receipt.phase = "intake_started";
      await saveFinalizeReceipt(receiptPath, receipt);
    }
    try {
      if (step.script === "research:logos") {
        const {stdout, stderr} = await executeFile("pnpm", [step.script, "--", ...step.args], {cwd: appRoot, maxBuffer: 16 * 1024 * 1024});
        if (stdout.trim()) process.stdout.write(stdout);
        if (stderr.trim()) process.stderr.write(stderr);
        digest = await artifactDigest(workspaceRoot, inputs);
        receipt.inputDigest = digest;
      } else {
        await runResearchCommand(step.script.replace("research:", ""), step.args);
        if (process.exitCode) throw new Error(`Research ${step.id} failed; no subsequent step was run.`);
      }
      receipt.steps.push({ id: step.id, startedAt: new Date(started).toISOString(), finishedAt: new Date().toISOString(), durationMs: Date.now() - started, ok: true });
      if (step.id === "validate") receipt.phase = "validated";
      if (step.id === "stage") receipt.phase = "files_ready";
      if (step.id === "reconcile") { receipt.phase = "intake_verified"; receipt.verifiedAt = new Date().toISOString(); }
      if (mode !== "check-only") await saveFinalizeReceipt(receiptPath, receipt);
    } catch (error) {
      receipt.steps.push({ id: step.id, startedAt: new Date(started).toISOString(), finishedAt: new Date().toISOString(), durationMs: Date.now() - started, ok: false });
      // Preserve uncertain intake for reconciliation; a failed read must never trigger a blind retry.
      if (receipt.phase !== "intake_started") receipt.phase = "failed";
      if (mode !== "check-only") await saveFinalizeReceipt(receiptPath, receipt);
      throw error;
    }
  }
  console.log(JSON.stringify({
    ok: true,
    mode,
    runId: plan.runId,
    candidateCount: plan.candidateCount,
    zeroCandidateDisposition: plan.zeroCandidateDisposition,
    executed: plan.steps.map((step) => step.id),
    adminReviewWriteAttempted: mode === "apply" && plan.candidateCount > 0
  }, null, 2));
}

withResearchWriterLock(workspaceRoot, "research-finalize", main, {lockPath: researchWriterLockPath(workspaceRoot) + "-finalize"}).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
