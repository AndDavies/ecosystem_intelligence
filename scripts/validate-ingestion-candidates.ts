import path from "node:path";
import {
  candidateBatchDir,
  formatCandidateValidationReport,
  loadCandidateBatch,
  loadCandidateBatches,
  validateCandidateBatch
} from "./ingestion-candidates";
import { loadScriptEnv } from "./load-env";
import { loadSeedData } from "./seed-utils";

loadScriptEnv();

async function main() {
  const seedData = await loadSeedData();
  const explicitFiles = process.argv.slice(2);
  const batches = explicitFiles.length
    ? await Promise.all(
        explicitFiles.map(async (filePath) => {
          const resolved = path.resolve(process.cwd(), filePath);
          return {
            filePath: resolved,
            batch: await loadCandidateBatch(resolved)
          };
        })
      )
    : await loadCandidateBatches(candidateBatchDir);

  const results = await Promise.all(
    batches.map(({ batch, filePath }) => validateCandidateBatch(batch, filePath, seedData))
  );

  console.log(formatCandidateValidationReport(results));

  if (results.some((result) => result.errors.length > 0)) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
