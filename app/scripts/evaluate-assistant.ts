import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { z } from "zod";
import { catalogue, questions, relevanceMetrics, savedAssistantSnapshot } from "./lib/assistant-evaluation";
import { rankJevCandidates, selectWithJev, JEV_BUDGET_USD, JEV_MODEL, JEV_RUBRIC, type JevJudgment, type JevMetrics } from "../src/lib/atlas/assistant-jev";
import { selectAssistantOrganizations } from "../src/lib/atlas/assistant";

const args = process.argv.slice(2);
const option = (name: string) => args.find((arg) => arg.startsWith(`${name}=`))?.slice(name.length + 1);
const digest = createHash("sha256").update(JSON.stringify({ catalogue, questions })).digest("hex");
const judgmentSchema = z.object({
  fixtureDigest: z.literal(digest), reviewer: z.string().trim().min(1), reviewedAt: z.string().date(),
  completeCorpusJudgments: z.literal(true),
  grades: z.record(z.string(), z.record(z.string(), z.number().int().min(0).max(3)))
});
const replaySchema = z.object({ fixtureDigest: z.literal(digest), model: z.literal(JEV_MODEL), rubric: z.literal(JEV_RUBRIC), rows: z.array(z.object({
  id: z.string(), judgments: z.array(z.object({ organizationId: z.string(), capabilityId: z.string().nullable(), score: z.number().min(0).max(3), constraints: z.array(z.enum(["supported", "contradicted", "not_established", "not_requested"])) }))
})) });

async function main() {
  if (args.includes("--live")) {
    if (!args.includes("--allow-paid") || !args.includes("--allow-production-read")) throw new Error("Live evaluation requires --allow-paid --allow-production-read.");
    await import("./evaluate-assistant-live"); return;
  }
  const paid = option("--provider") === "typesafe";
  if (option("--provider") && !paid) throw new Error("Only --provider=typesafe is supported. Omit it for offline mode.");
  const maxCost = Number(option("--max-cost-usd"));
  if (paid && (!args.includes("--allow-paid") || !Number.isFinite(maxCost) || maxCost <= 0 || maxCost > 5)) throw new Error("Paid evaluation requires --allow-paid and --max-cost-usd between 0 and 5; no production data is loaded.");
  if (paid && option("--replay")) throw new Error("Choose paid evaluation or offline replay, not both.");
  if (paid) {
    const { loadScriptEnv } = await import("./load-env"); loadScriptEnv();
    if (!process.env.TYPESAFE_API_KEY?.trim()) throw new Error("TYPESAFE_API_KEY is required; never pass the key as a CLI argument.");
  }
  const humanPath = option("--judgments");
  const human = humanPath ? judgmentSchema.parse(JSON.parse(await readFile(humanPath, "utf8"))) : null;
  const replayPath = option("--replay");
  const replay = replayPath ? replaySchema.parse(JSON.parse(await readFile(replayPath, "utf8"))) : null;
  const snapshot = savedAssistantSnapshot();
  const bySlug = new Map(snapshot.organizations.map((o) => [o.slug, o.id]));
  const known = new Set(bySlug.values());
  const caseIds = new Set(questions.cases.map((q) => q.id));
  if (human && (Object.keys(human.grades).length !== caseIds.size || Object.entries(human.grades).some(([id, grades]) => !caseIds.has(id) || Object.keys(grades).some((org) => !known.has(org))))) throw new Error("Human judgments must cover all 40 questions and use only frozen catalogue IDs; omitted organization grades mean judged irrelevant.");
  if (replay && (new Set(replay.rows.map((r) => r.id)).size !== replay.rows.length || replay.rows.some((r) => !caseIds.has(r.id)))) throw new Error("Replay has duplicate or unknown questions.");
  let reservedCostUsd = 0;
  const rows: Array<{
    id: string; split: string; category: string;
    arms: Record<string, ReturnType<typeof relevanceMetrics>>;
    judgments: JevJudgment[]; selection: JevMetrics | null;
    postConstraints: ReturnType<typeof relevanceMetrics> | null;
  }> = [];
  for (const test of questions.cases) {
    const priorTurns = (test.priorTurns ?? []).map((t) => ({ query: t.query, organizationIds: t.organizationSlugs.map((slug) => bySlug.get(slug)!) }));
    const baseline = selectAssistantOrganizations(snapshot, test.query, priorTurns, snapshot.organizations.length);
    const grades = human?.grades[test.id] ?? Object.fromEntries(test.seedRelevantSlugs.map((slug) => [bySlug.get(slug)!, 1]));
    let judgments: JevJudgment[] = replay?.rows.find((r) => r.id === test.id)?.judgments ?? [];
    let selection = null;
    if (paid) {
      if (Math.round((reservedCostUsd + JEV_BUDGET_USD) * 1_000_000) > Math.floor(maxCost * 1_000_000)) break;
      // Reserve the entire question ceiling, including uncertain/cancelled billing. Never recycle it.
      reservedCostUsd = Math.round((reservedCostUsd + JEV_BUDGET_USD) * 1_000_000) / 1_000_000;
      selection = await selectWithJev({ snapshot, query: test.query, priorTurns, baseline });
      judgments = selection.judgments;
    }
    if (judgments.length && (judgments.length !== known.size || new Set(judgments.map((j) => j.organizationId)).size !== known.size || judgments.some((j) => !known.has(j.organizationId) || (j.capabilityId !== null && !snapshot.organizations.find((o) => o.id === j.organizationId)!.capabilities.some((c) => c.id === j.capabilityId))))) throw new Error(`Incomplete or wrong-entity judgments for ${test.id}`);
    const arms: Record<string, ReturnType<typeof relevanceMetrics>> = { lexical16: relevanceMetrics(baseline.slice(0, 16).map((o) => o.id), grades) };
    if (judgments.length) for (const [name, count] of [["rerankExisting16", 16], ["widerLexical32", 32], ["fullCatalogue", baseline.length]] as const) {
      const pool = baseline.slice(0, count); const ids = new Set(pool.map((o) => o.id));
      const ranked = rankJevCandidates(judgments.filter((j) => ids.has(j.organizationId)).map((j) => ({ ...j, constraints: [] })), pool, test.query, priorTurns);
      arms[name] = relevanceMetrics(ranked.map((o) => o.id), grades, [...ids]);
    }
    rows.push({ id: test.id, split: test.split, category: test.category, arms, judgments, selection: selection?.metrics ?? null,
      postConstraints: selection ? relevanceMetrics(selection.organizations.map((o) => o.id), grades, baseline.map((o) => o.id)) : null });
  }
  const mean = (values: Array<number | null | undefined>) => {
    const valid = values.filter((v): v is number => typeof v === "number");
    return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
  };
  const summary = Object.fromEntries(["development", "held-out"].map((split) => {
    const cohort = rows.filter((r) => r.split === split);
    return [split, Object.fromEntries(["lexical16", "rerankExisting16", "widerLexical32", "fullCatalogue"].map((arm) => [arm, {
      evaluatedQuestions: cohort.filter((r) => r.arms[arm]).length,
      meanRecall16: mean(cohort.map((r) => r.arms[arm]?.recall16)),
      semanticRecall16: mean(cohort.filter((r) => r.category === "semantic").map((r) => r.arms[arm]?.recall16)),
      meanNdcg5: mean(cohort.map((r) => r.arms[arm]?.ndcg5))
    }]))];
  }));
  const measured = rows.flatMap((r) => r.selection ? [r.selection] : []);
  const report = {
    fixtureDigest: digest, model: JEV_MODEL, rubric: JEV_RUBRIC, mode: paid ? "paid-saved-corpus" : replay ? "offline-replay" : "offline-baseline",
    humanJudgments: human ? { reviewer: human.reviewer, reviewedAt: human.reviewedAt } : null,
    acceptance: "not_assessed", // Human answer review and deployment-like latency remain separate gates.
    caveats: ["Draft seed relevance is diagnostic only until human judgments are supplied.", "Counterfactual arms reuse full-pass Score judgments, without Choice; not independent narrow-context API trials.", "No answering-model calls: answer usefulness, unsupported claims and complete deployed catalogue latency remain unmeasured.", "Saved records omit unavailable locations/citations; no current publication or eligibility claim."],
    summary,
    measuredSelection: measured.length ? {
      completedPassRate: measured.filter((m) => m.fallbackReason === null).length / measured.length,
      maximumLatencyMs: Math.max(...measured.map((m) => m.latencyMs)),
      totalReportedInputTokens: measured.reduce((n, m) => n + m.inputTokens, 0),
      totalReportedCostUsd: measured.reduce((n, m) => n + m.estimatedCostUsd, 0),
      usageComplete: measured.every((m) => m.usageComplete)
    } : null,
    catalogueCount: snapshot.organizations.length, questionsCompleted: rows.length, reservedEvaluationCostUsd: reservedCostUsd, rows
  };
  if (option("--out")) await writeFile(option("--out")!, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ ...report, rows: rows.map(({ judgments: _judgments, ...row }) => row) }, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Assistant evaluation failed"); process.exitCode = 1; });
