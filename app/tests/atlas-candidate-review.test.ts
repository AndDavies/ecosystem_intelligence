import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseAtlasOrganizationCandidate } from "../src/lib/atlas/candidate-schema";

const batchPath = path.join(
  process.cwd(),
  "..",
  "research",
  "ingestion",
  "candidate-batches",
  "canadian-public-beta-expansion-2026-07-17.atlas.json"
);

describe("public atlas organization candidates", () => {
  it("keeps all twelve expansion dossiers valid and privately staged", async () => {
    const batch = JSON.parse(await readFile(batchPath, "utf8")) as {
      batchId: string;
      status: string;
      records: unknown[];
    };

    expect(batch.status).toBe("candidate");
    expect(batch.records).toHaveLength(12);
    for (const record of batch.records) {
      const result = parseAtlasOrganizationCandidate({
        schemaVersion: "organization_bundle_v1",
        batchId: batch.batchId,
        ...(record as Record<string, unknown>)
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects publication bundles without a durable public source", async () => {
    const batch = JSON.parse(await readFile(batchPath, "utf8")) as {
      batchId: string;
      records: Array<Record<string, unknown>>;
    };
    const record = structuredClone(batch.records[0]);
    record.source = { title: "Missing source", url: "", publisher: "", type: "company_website", excerpt: "" };

    expect(parseAtlasOrganizationCandidate({ schemaVersion: "organization_bundle_v1", batchId: batch.batchId, ...record }).success).toBe(false);
  });
});
