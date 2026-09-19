import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { z } from "zod";
import { catalogue, questions, relevanceMetrics, savedAssistantSnapshot } from "./lib/assistant-evaluation";
import { selectAssistantOrganizations } from "../src/lib/atlas/assistant";

// Offline lexical diagnostics only. The retired provider experiment cannot be activated by flags or environment variables.
const args = process.argv.slice(2);
const option = (name: string) => args.find(arg => arg.startsWith(`${name}=`))?.slice(name.length + 1);
async function main() {
  if (args.some(arg => arg !== "--offline" && !arg.startsWith("--judgments=") && !arg.startsWith("--out="))) throw new Error("Only --offline, --judgments and --out are supported. Paid comparisons have been retired.");
  const digest = createHash("sha256").update(JSON.stringify({ catalogue, questions })).digest("hex");
  const schema = z.object({ fixtureDigest: z.literal(digest), reviewer: z.string().min(1), reviewedAt: z.string().date(), completeCorpusJudgments: z.literal(true), grades: z.record(z.string(), z.record(z.string(), z.number().int().min(0).max(3))) });
  const humanPath = option("--judgments");
  const human = humanPath ? schema.parse(JSON.parse(await readFile(humanPath, "utf8"))) : null;
  const snapshot = savedAssistantSnapshot();
  const bySlug = new Map(snapshot.organizations.map(o => [o.slug, o.id]));
  const known = new Set(bySlug.values());
  const cases = new Set(questions.cases.map(q => q.id));
  if (human && (Object.keys(human.grades).length !== cases.size || Object.entries(human.grades).some(([id, grades]) => !cases.has(id) || Object.keys(grades).some(org => !known.has(org))))) throw new Error("Human judgments must cover the frozen questions and known organizations.");
  const rows = questions.cases.map(test => {
    const turns = (test.priorTurns ?? []).map(t => ({ query: t.query, organizationIds: t.organizationSlugs.map(slug => bySlug.get(slug)!) }));
    const selected = selectAssistantOrganizations(snapshot, test.query, turns);
    const grades = human?.grades[test.id] ?? Object.fromEntries(test.seedRelevantSlugs.map(slug => [bySlug.get(slug)!, 1]));
    return { id: test.id, split: test.split, organizationIds: selected.map(o => o.id), metrics: relevanceMetrics(selected.map(o => o.id), grades) };
  });
  const report = { mode: "offline-lexical", fixtureDigest: digest, acceptance: "not_assessed", humanJudgments: human ? { reviewer: human.reviewer, reviewedAt: human.reviewedAt } : null,
    caveat: "Draft labels are diagnostic, not human acceptance or current production evidence. No network or model calls.", rows };
  if (option("--out")) await writeFile(option("--out")!, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Offline evaluation failed"); process.exitCode = 1; });
