import { readFile } from "node:fs/promises";
import path from "node:path";
import { evaluateResearchOperationCases } from "../src/lib/research/operation-evals";

const fixturePath = path.join(process.cwd(), "tests/fixtures/research-operation-evals.json");

async function main() {
  const results = evaluateResearchOperationCases(JSON.parse(await readFile(fixturePath, "utf8")));
  console.log(JSON.stringify({
    schemaVersion: "research_operation_eval_results_v1",
    evaluatedAt: new Date().toISOString(),
    fixture: path.relative(process.cwd(), fixturePath),
    passed: results.filter((result) => result.passed).length,
    failed: results.filter((result) => !result.passed).length,
    results
  }, null, 2));
  if (results.some((result) => !result.passed)) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
