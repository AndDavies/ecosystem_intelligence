import { dailySignalsPacketSchema, type DailySignalsPacketV3 } from "../../src/lib/signals/contract";
export function signalsV3Fixture(count = 2): DailySignalsPacketV3 {
  return dailySignalsPacketSchema.parse({
    schemaVersion: "daily_signals_packet_v3", runId: "signals-v3-test-20260905", editionDate: "2026-09-05",
    slug: "industrial-capacity-changes-canadian-defence-delivery", title: "Industrial capacity changes Canadian defence delivery",
    summary: { opening: "Two industrial developments change delivery options.", takeaway: "The production commitment is the useful change.", limitation: null },
    disclosure: "True North Map provides a source-linked editorial assessment; review the cited public record and its limitations.", inspectedCount: count,
    items: Array.from({ length: count }, (_, index) => ({
      slug: `industrial-capacity-development-${index + 1}`, storyPosition: index + 1, title: `Industrial capacity development ${index + 1}`,
      lane: "funding_industrial_capacity", tags: ["production"], bottomLine: "A factory adds capacity.", executiveSummary: index === 0 ? "A new production line changes the delivery baseline." : "A separate manufacturing commitment changes supplier options.",
      sourceFact: "The company announced a production commitment.", automatedRead: null, unknowns: null, nextStep: null, confidence: "medium", eventFingerprint: `industrial-development-${index + 1}`, contentHash: `fixture-content-hash-${index + 1}`,
      sources: [{ canonicalUrl: "https://example.ca/industrial-developments", title: "Industrial developments", publisher: "Example Company", publishedAt: "2026-09-05T09:00:00.000Z", accessedAt: "2026-09-05T10:00:00.000Z", sourceFamily: "official_company", authority: "primary", evidenceLocator: `Development ${index + 1}`, evidenceExcerpt: `The company announced a distinct production development numbered ${index + 1}.`, contentHash: "fixture-source-content-hash", supportType: "attributed_statement" }], recordLinks: []
    }))
  }) as DailySignalsPacketV3;
}
