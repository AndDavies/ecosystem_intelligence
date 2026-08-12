import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { buildResearchFinalizePlan, type ResearchFinalizeMode } from "../src/lib/research/finalize-plan";
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

  for (const step of plan.steps) {
    console.log(`research:finalize ${run.runId}: ${step.id}`);
    try {
      const { stdout, stderr } = await executeFile("pnpm", [step.script, "--", ...step.args], {
        cwd: appRoot,
        maxBuffer: 16 * 1024 * 1024
      });
      if (stdout.trim()) process.stdout.write(stdout);
      if (stderr.trim()) process.stderr.write(stderr);
    } catch (error) {
      const output = error && typeof error === "object" ? error as { stdout?: string; stderr?: string } : {};
      if (output.stdout?.trim()) process.stdout.write(output.stdout);
      if (output.stderr?.trim()) process.stderr.write(output.stderr);
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

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
