import { describe, expect, it } from "vitest";
import {
  DEFENCE_WIKI_PACKET_VERSION,
  compactWikiText,
  defenceSourcePacketV1Schema,
  safeWikiSourceUrl,
  stableWikiPacketHash
} from "@/lib/research/defence-wiki-contract";

describe("defence wiki source packet", () => {
  it("validates the cross-system contract", () => {
    const base = {
      schemaVersion: DEFENCE_WIKI_PACKET_VERSION,
      packetId: "true_north_map:source:1",
      sourceSystem: "true_north_map" as const,
      sourceRecordIds: ["source:1"],
      sourceKind: "official_report",
      title: "Public defence source",
      publisher: "Government of Canada",
      sourceFamily: "canada.ca",
      authorityTier: "primary" as const,
      canonicalUrl: "https://www.canada.ca/example",
      publishedAt: null,
      capturedAt: "2026-07-21T00:00:00.000Z",
      relevantExcerpt: "Reviewed public evidence.",
      summary: null,
      selectionReasons: ["published_evidence" as const],
      defenceRelevanceReason: "Supports a published True North Map record.",
      canadaRelevanceReason: "Canadian public source.",
      concepts: [],
      entities: [],
      geography: ["Canada"],
      labels: [],
      sourceConfidence: "high" as const,
      evidenceRole: "primary" as const,
      freshness: "current" as const,
      claimRisk: "mixed" as const,
      visibility: "public" as const,
      reusePolicy: "public_reference" as const,
      needsVerification: false,
      relatedTrueNorthIds: []
    };
    const packet = { ...base, contentHash: stableWikiPacketHash(base), generatedAt: new Date().toISOString() };
    expect(defenceSourcePacketV1Schema.parse(packet).schemaVersion).toBe(DEFENCE_WIKI_PACKET_VERSION);
  });

  it("requires HTTPS and bounds copied evidence", () => {
    expect(safeWikiSourceUrl("http://example.com/source")).toBeNull();
    expect(safeWikiSourceUrl("https://example.com/source#claim")).toBe("https://example.com/source");
    expect(compactWikiText("evidence ".repeat(500), 120).length).toBeLessThanOrEqual(120);
  });
});
