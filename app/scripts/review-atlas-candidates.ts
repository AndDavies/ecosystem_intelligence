import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const recordSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  description: z.string().min(40),
  websiteUrl: z.string().url().startsWith("https://"),
  city: z.string().min(1), provinceTerritory: z.string().min(1),
  latitude: z.number().min(41).max(84), longitude: z.number().min(-142).max(-52),
  confidence: z.enum(["high", "moderate"]),
  capability: z.object({
    slug: z.string().min(1), name: z.string().min(1), summary: z.string().min(40), type: z.string().min(1),
    features: z.array(z.string()).min(1), applications: z.array(z.string()).min(1), tags: z.array(z.string()).min(1),
    technicalDomainSlug: z.string().min(1), clusterSlug: z.string().nullable().optional(), alignmentSummary: z.string().min(40)
  }),
  source: z.object({ title: z.string().min(1), url: z.string().url().startsWith("https://"), publisher: z.string().min(1), type: z.string().min(1), excerpt: z.string().min(30) })
});
const batchSchema = z.object({
  batchId: z.string().min(1), title: z.string().min(1), status: z.literal("approved"),
  createdAt: z.string().datetime(), approvedAt: z.string().datetime(), reviewedBy: z.string().min(1),
  missionAreaSlug: z.string().min(1), records: z.array(recordSchema).min(1)
});

const workspaceRoot = path.resolve(process.cwd(), "..");
const candidateDir = path.join(workspaceRoot, "research", "ingestion", "candidate-batches");
const reviewDir = path.join(workspaceRoot, "research", "ingestion", "reviews");

async function loadBatches() {
  const files = (await readdir(candidateDir)).filter((file) => file.endsWith(".atlas.json")).sort();
  return Promise.all(files.map(async (file) => {
    const filePath = path.join(candidateDir, file);
    return { filePath, batch: batchSchema.parse(JSON.parse(await readFile(filePath, "utf8"))) };
  }));
}

function findDuplicates(values: string[]) {
  const seen = new Set<string>();
  return [...new Set(values.filter((value) => seen.has(value) || !seen.add(value)))];
}

async function main() {
  const command = process.argv[2] ?? "validate";
  const batches = await loadBatches();
  if (!batches.length) throw new Error("No public-atlas candidate batches found.");
  for (const { filePath, batch } of batches) {
    const duplicateSlugs = findDuplicates(batch.records.flatMap((record) => [record.slug, record.capability.slug]));
    const duplicateSources = findDuplicates(batch.records.map((record) => record.source.url));
    if (duplicateSlugs.length || duplicateSources.length) throw new Error(`Duplicate values in ${filePath}: ${[...duplicateSlugs, ...duplicateSources].join(", ")}`);
    console.log(`Validated ${batch.batchId}: ${batch.records.length} organizations, ${batch.records.length} capabilities, ${batch.records.length} public sources.`);
    if (command === "review") {
      await mkdir(reviewDir, { recursive: true });
      const reviewPath = path.join(reviewDir, `${batch.batchId}.md`);
      const rows = batch.records.map((record) => `| ${record.name} | ${record.city}, ${record.provinceTerritory} | ${record.capability.name} | ${record.confidence} | [source](${record.source.url}) |`).join("\n");
      await writeFile(reviewPath, `# ${batch.title}\n\n- Status: ${batch.status}\n- Approved: ${batch.approvedAt}\n- Reviewer: ${batch.reviewedBy}\n- Mission area: ${batch.missionAreaSlug}\n- Records: ${batch.records.length}\n\n| Organization | Headquarters | Capability | Confidence | Evidence |\n| --- | --- | --- | --- | --- |\n${rows}\n\n## Promotion guardrails\n\n- Public claims are limited to the linked first-party source.\n- Mission alignment is a reviewed derived read, not procurement eligibility or endorsement.\n- Unknown maturity, financing, employment, and contact fields remain null.\n- Coordinates are labelled city centroids.\n`, "utf8");
      console.log(`Wrote ${reviewPath}`);
    }
  }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
