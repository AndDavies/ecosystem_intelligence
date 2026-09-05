import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { assertHistoricalSignalsEdition, assertNewDailySignalsPacketVersion, dailySignalsPacketSchema, dailySignalsRunOutcomeSchema, getSignalsExecutiveSummary, parseSignalsJson, SIGNALS_PACKET_MAX_BYTES } from "../src/lib/signals/contract";
import { getSignalsEditorialIssues } from "../src/lib/signals/editorial-voice";
import { signalEvidenceSnapshot, signalsPublicationHash, mergeSignalsReport } from "../src/lib/signals/publisher";
import { verifySignalsRuntime } from "../src/lib/signals/runtime-preflight";
import { signalsV3Fixture } from "./fixtures/daily-signals-v3";

describe("Signals v3 editorial contract", () => {
  it.each([1, 7, 8, 9, 30])("accepts %i supported developments without a quota", (count) => {
    const packet = signalsV3Fixture(count);
    expect(packet.items).toHaveLength(count);
    expect(packet.sourceFamilyCount).toBe(1);
    expect(packet.heroImage).toBeNull(); expect(packet.socialDrafts).toEqual([]);
    expect(() => assertNewDailySignalsPacketVersion(packet)).not.toThrow();
  });
  it("accepts substantial and brief prose and leaves lexical judgment out of publication", () => {
    const packet = signalsV3Fixture();
    packet.items[0].executiveSummary = "The company could change production. ".repeat(400);
    packet.items[0].nextStep = "Request the technical annex.";
    expect(dailySignalsPacketSchema.safeParse(packet).success).toBe(true);
    expect(getSignalsEditorialIssues(packet)).toEqual([]);
    expect(getSignalsExecutiveSummary(packet)).toBe(`${packet.summary.opening}\n\n${packet.summary.takeaway}`);
  });
  it("requires nonempty actual content, honest event identity and contiguous positions", () => {
    const packet = signalsV3Fixture();
    expect(dailySignalsPacketSchema.safeParse({ ...packet, items: [] }).success).toBe(false);
    expect(dailySignalsPacketSchema.safeParse({ ...packet, items: packet.items.map((item) => ({ ...item, storyPosition: 1 })) }).success).toBe(false);
    expect(dailySignalsPacketSchema.safeParse({ ...packet, items: packet.items.map((item) => ({ ...item, eventFingerprint: "one-shared-event" })) }).success).toBe(false);
    expect(dailySignalsPacketSchema.safeParse({ ...packet, items: packet.items.map((item) => ({ ...item, sourceFact: " " })) }).success).toBe(false);
    expect(dailySignalsPacketSchema.safeParse({ ...packet, items: packet.items.map((item) => ({ ...item, materialUpdate: true })) }).success).toBe(false);
    expect(dailySignalsPacketSchema.safeParse({ ...packet, sourceFamilyCount: 99 }).data?.sourceFamilyCount).toBe(1);
  });
  it("snapshots each item's support even on a shared page", () => {
    const packet = signalsV3Fixture();
    const first = signalEvidenceSnapshot(packet.items[0].sources[0]);
    const second = signalEvidenceSnapshot(packet.items[1].sources[0]);
    expect(first.canonicalUrl).toBe(second.canonicalUrl);
    expect(first.evidenceExcerpt).not.toBe(second.evidenceExcerpt);
    expect(first.supportType).toBe("attributed_statement");
  });
  it("separates package repair from immutable public article identity", () => {
    const packet = signalsV3Fixture();
    expect(signalsPublicationHash({ ...packet, socialDrafts: [{ platform: "x", itemSlug: null, text: "A private social example for this edition." }] })).toBe(signalsPublicationHash(packet));
    expect(signalsPublicationHash({ ...packet, title: "A substantively changed edition title" })).not.toBe(signalsPublicationHash(packet));
  });
  it("retains historical packet validation while retiring new v1/v2 writes", async () => {
    for (const version of [1, 2]) {
      const packet = dailySignalsPacketSchema.parse(JSON.parse(await readFile(`tests/fixtures/daily-signals-packet-v${version}.json`, "utf8")));
      expect(getSignalsEditorialIssues(packet)).toEqual([]);
      expect(() => assertNewDailySignalsPacketVersion(packet)).toThrow(/historical-repair only/);
    }
  });
  it("blocks cross-version repair before legacy writes and preserves report lineage", () => {
    expect(() => assertHistoricalSignalsEdition({ packet_schema_version: "daily_signals_packet_v3" })).toThrow(/cannot repair a v3/);
    expect(() => assertHistoricalSignalsEdition({ packet_schema_version: null })).not.toThrow();
    expect(mergeSignalsReport({ payload_hash: "saved-hash", packaging: { socials: "pending" }, coverage_complete: true }, { hero_image_replaced: true })).toEqual({ payload_hash: "saved-hash", packaging: { socials: "pending" }, coverage_complete: true, hero_image_replaced: true });
    const packet = signalsV3Fixture();
    expect(signalsPublicationHash({ ...packet, items: [...packet.items].reverse() })).toBe(signalsPublicationHash(packet));
  });
  it("rejects overlarge bytes before JSON parsing including multibyte input", () => {
    expect(() => parseSignalsJson("x".repeat(SIGNALS_PACKET_MAX_BYTES + 1))).toThrow(/1 MiB/);
    expect(() => parseSignalsJson("é".repeat(SIGNALS_PACKET_MAX_BYTES / 2 + 1))).toThrow(/1 MiB/);
    expect(parseSignalsJson('{"ok":true}')).toEqual({ ok: true });
  });
  it("distinguishes editorial insufficiency from incomplete or failed work", () => {
    const outcome = { schemaVersion: "daily_signals_run_outcome_v2", runId: "signals-outcome-test", editionDate: "2026-09-05", inspectedCount: 20, qualifiedCount: 12, sourceFamilyCount: 1, coverageComplete: true, outcome: "no_publish", reason: "The relevant developments add no material change beyond previous coverage." };
    expect(dailySignalsRunOutcomeSchema.safeParse(outcome).success).toBe(true);
    expect(dailySignalsRunOutcomeSchema.safeParse({ ...outcome, coverageComplete: false }).success).toBe(false);
    expect(dailySignalsRunOutcomeSchema.safeParse({ ...outcome, outcome: "blocked", coverageComplete: false, resumable: true }).success).toBe(true);
    expect(dailySignalsRunOutcomeSchema.safeParse({ ...outcome, outcome: "failed", coverageComplete: false }).success).toBe(true);
  });
  it("requires the deployed runtime capabilities before apply", async () => {
    const request = async () => new Response(JSON.stringify({ schemaVersion: "daily_signals_runtime_v3", newPacketVersion: "daily_signals_packet_v3", finalizationFunction: "finalize_signal_edition", evidenceSnapshots: true, optionalHero: true }));
    await expect(verifySignalsRuntime("https://truenorthmap.ca", request)).resolves.toMatchObject({ newPacketVersion: "daily_signals_packet_v3" });
    await expect(verifySignalsRuntime("https://truenorthmap.ca", async () => new Response('{}'))).rejects.toThrow(/not compatible/);
    await expect(verifySignalsRuntime("https://truenorthmap.ca", async () => new Response('', { status: 503 }))).rejects.toThrow(/503/);
  });
});
