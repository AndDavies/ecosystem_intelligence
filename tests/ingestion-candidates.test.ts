import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  type CandidateBatch,
  formatCandidateReviewPacket,
  formatCandidateRowsAsCsv,
  getCandidatePromotionTables,
  loadCandidateBatch,
  validateCandidateBatch
} from "../scripts/ingestion-candidates";
import { loadSeedData } from "../scripts/seed-utils";

const pilotPath = path.join(
  process.cwd(),
  "data",
  "ingestion",
  "candidate-batches",
  "arctic-domain-awareness-pilot.json"
);

describe("ingestion candidate validation", () => {
  it("accepts the Arctic real-data pilot as staged candidate data", async () => {
    const seedData = await loadSeedData();
    const batch = await loadCandidateBatch(pilotPath);
    const result = await validateCandidateBatch(batch, pilotPath, seedData);

    expect(result.errors).toEqual([]);
    expect(result.counts.companies).toBe(6);
    expect(result.counts.capabilities).toBe(6);
    expect(result.counts.mappings).toBe(8);
    expect(result.touchedUseCases).toEqual(["use-case-1", "use-case-3", "use-case-4", "use-case-5"]);
  });

  it("rejects non-portable citation tokens from research exports", async () => {
    const seedData = await loadSeedData();
    const batch = structuredClone(await loadCandidateBatch(pilotPath)) as CandidateBatch;
    batch.evidenceSnippets[0].excerpt = "Imported claim 【turn0search1】 from a browser trace.";

    const result = await validateCandidateBatch(batch, pilotPath, seedData);

    expect(result.errors).toContain(
      "Candidate batch contains non-portable citation tokens. Use canonical URLs and local citation ids instead."
    );
  });

  it("requires source-backed why-it-matters citations on mappings", async () => {
    const seedData = await loadSeedData();
    const batch = structuredClone(await loadCandidateBatch(pilotPath)) as CandidateBatch;
    batch.fieldCitations = batch.fieldCitations.filter(
      (citation) => citation.entity_id !== "pilot-cuc-mda-chorus-arctic-awareness"
    );

    const result = await validateCandidateBatch(batch, pilotPath, seedData);

    expect(result.errors).toContain(
      "Mapping pilot-cuc-mda-chorus-arctic-awareness needs a why_it_matters field citation."
    );
  });

  it("formats a review packet with the promotion command", async () => {
    const seedData = await loadSeedData();
    const batch = await loadCandidateBatch(pilotPath);
    const result = await validateCandidateBatch(batch, pilotPath, seedData);
    const packet = formatCandidateReviewPacket(batch, result);

    expect(packet).toContain("# Arctic Domain Awareness Real-Data Pilot");
    expect(packet).toContain("## Reviewer Checklist");
    expect(packet).toContain("pnpm ingest:promote data/ingestion/candidate-batches/arctic-domain-awareness-pilot.json");
  });

  it("serializes promotable rows with CSV escaping", () => {
    expect(
      formatCandidateRowsAsCsv(
        [
          {
            id: "row-1",
            title: "Needs, escaping",
            note: 'Contains "quoted" context'
          }
        ],
        ["id", "title", "note"]
      )
    ).toBe('row-1,"Needs, escaping","Contains ""quoted"" context"');
  });

  it("projects promotable rows to database columns", async () => {
    const batch = await loadCandidateBatch(pilotPath);
    const tables = getCandidatePromotionTables(batch);
    const companyRows = tables.find((table) => table.tableName === "companies")?.rows ?? [];
    const capabilityRows = tables.find((table) => table.tableName === "capabilities")?.rows ?? [];
    const mappingRows = tables.find((table) => table.tableName === "capability_use_cases")?.rows ?? [];

    expect(companyRows[0]).toHaveProperty("overview");
    expect(companyRows[0]).not.toHaveProperty("confidence");
    expect(companyRows[0]).not.toHaveProperty("research_rationale");
    expect(capabilityRows[0]).not.toHaveProperty("confidence");
    expect(capabilityRows[0]).not.toHaveProperty("research_rationale");
    expect(mappingRows[0]).not.toHaveProperty("confidence");
    expect(mappingRows[0]).not.toHaveProperty("research_rationale");
  });
});
