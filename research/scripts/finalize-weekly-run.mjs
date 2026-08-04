#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const runId = "tnm-weekly-2026-08-03";
const runPath = path.join(root, "research/ingestion/runs", `${runId}.json`);
const run = JSON.parse(await fs.readFile(runPath, "utf8"));
run.outputs = {
  ...run.outputs,
  candidateLogoPacket: `research/ingestion/candidate-logo-packets-v1/candidate-batch-${runId}.json`,
  reviewPacket: `research/ingestion/reviews-v2/candidate-batch-${runId}.md`,
  stagingExport: `research/ingestion/staging/${runId}.json`
};
run.validation = {
  ...run.validation,
  warnings: [
    ...(run.validation?.warnings ?? []),
    "Candidate-logo pass: 8 ready, 1 review_required and 1 not_found; logo dispositions remain private reviewer inputs."
  ]
};
await fs.writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ runId, outputs: run.outputs }, null, 2));
