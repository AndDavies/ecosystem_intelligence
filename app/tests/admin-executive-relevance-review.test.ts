import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Admin Review executive relevance preview", () => {
  it("shows the proposed assessment beside its evidence without weakening Review and Publish", async () => {
    const page = await readFile(path.resolve("src/app/admin/review/page.tsx"), "utf8");
    expect(page).toContain("Proposed decision snapshot · True North Map assessment");
    expect(page).toContain("organization.executiveRelevanceSummary");
    expect(page).toContain('operation.field === "executive_relevance_summary"');
    expect(page).toContain("executiveRelevanceEvidenceIds.has(item.id)");
    expect(page).toContain("Accepting advances this proposal to the separate Publication checkpoint. It does not publish the snapshot.");
    expect(page).toContain("source.publisher");
  });
});
