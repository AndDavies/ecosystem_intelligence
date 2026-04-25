import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  candidateReviewDir,
  formatCandidateReviewPacket,
  formatCandidateValidationReport,
  getCandidateReviewPath,
  loadCandidateBatch,
  loadCandidateBatches,
  promoteCandidateBatch,
  validateCandidateBatch
} from "./ingestion-candidates";
import { loadScriptEnv } from "./load-env";
import { loadSeedData } from "./seed-utils";

loadScriptEnv();

type Mode = "review" | "promote";

interface ParsedArgs {
  mode: Mode;
  files: string[];
  reviewer: string | null;
  dryRun: boolean;
}

function parseArgs(): ParsedArgs {
  const [, , maybeMode, ...rest] = process.argv;
  const mode: Mode = maybeMode === "promote" ? "promote" : "review";
  const args = maybeMode === "review" || maybeMode === "promote" ? rest : [maybeMode, ...rest].filter(Boolean);
  const files: string[] = [];
  let reviewer: string | null = null;
  let dryRun = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--reviewer") {
      reviewer = args[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg.startsWith("--reviewer=")) {
      reviewer = arg.slice("--reviewer=".length);
      continue;
    }

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg.startsWith("--")) {
      throw new Error(`Unsupported option '${arg}'.`);
    }

    files.push(arg);
  }

  return {
    mode,
    files,
    reviewer,
    dryRun
  };
}

async function loadRequestedBatches(files: string[]) {
  if (!files.length) {
    return loadCandidateBatches();
  }

  return Promise.all(
    files.map(async (filePath) => {
      const resolved = path.resolve(process.cwd(), filePath);

      return {
        filePath: resolved,
        batch: await loadCandidateBatch(resolved)
      };
    })
  );
}

async function writeReviewPackets(files: string[]) {
  const seedData = await loadSeedData();
  const batches = await loadRequestedBatches(files);
  const results = [];

  await mkdir(candidateReviewDir, { recursive: true });

  for (const { batch, filePath } of batches) {
    const result = await validateCandidateBatch(batch, filePath, seedData);
    const reviewPath = getCandidateReviewPath(batch.batchId);
    const packet = formatCandidateReviewPacket(batch, result);

    await writeFile(reviewPath, packet, "utf8");
    results.push(result);
  }

  console.log(formatCandidateValidationReport(results));
  console.log("");
  results.forEach((result) => {
    console.log(`Review packet: ${path.relative(process.cwd(), getCandidateReviewPath(result.batchId))}`);
  });

  if (results.some((result) => result.errors.length > 0)) {
    process.exit(1);
  }
}

async function promoteBatches(files: string[], reviewer: string | null, dryRun: boolean) {
  if (!reviewer) {
    throw new Error('Promotion requires --reviewer "Reviewer Name".');
  }

  if (!files.length) {
    throw new Error("Promotion requires at least one candidate batch file.");
  }

  const seedData = await loadSeedData();
  const batches = await loadRequestedBatches(files);
  const promotionSummaries = [];

  for (const { batch, filePath } of batches) {
    const promotion = await promoteCandidateBatch({
      batch,
      filePath,
      reviewer,
      seedData,
      dryRun
    });

    promotionSummaries.push({
      result: promotion.result,
      promotionPath: promotion.promotionPath
    });
  }

  promotionSummaries.forEach(({ result, promotionPath }) => {
    console.log(`${dryRun ? "Would promote" : "Promoted"} ${result.title} (${result.batchId})`);
    console.log(`Promotion log: ${path.relative(process.cwd(), promotionPath)}`);
  });
}

async function main() {
  const args = parseArgs();

  if (args.mode === "promote") {
    await promoteBatches(args.files, args.reviewer, args.dryRun);
    return;
  }

  await writeReviewPackets(args.files);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
