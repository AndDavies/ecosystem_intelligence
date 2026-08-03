import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { dailySignalsPacketSchema } from "../src/lib/signals/contract";
import { getSignalsEditorialIssues } from "../src/lib/signals/editorial-voice";

const source = { canonicalUrl: "https://example.gc.ca/defence/program", title: "Official defence program update", publisher: "Government of Canada", publishedAt: "2026-08-03T10:00:00.000Z", sourceFamily: "government_program", authority: "official" as const, evidenceLocator: "Program update, paragraph 4", evidenceExcerpt: "The program update identifies a concrete public requirement and a dated next step.", contentHash: "1234567890abcdef" };
const editionSummary = "Several public developments now give Canadian defence and strategic-technology teams a clearer basis for deciding what to inspect next. Released needs, testing activity and industrial capacity are starting to connect.\n\nTaken together, the changes expose where evidence, relationships and qualification work need to begin before a formal opportunity appears. They narrow the questions that suppliers and program teams should ask.\n\nImportant questions about timing, eligibility, funding and customer intent remain open. The linked original sources establish the movement, not a contract forecast.";
const itemOpenings = ["A released public need", "Operational testing now exposes", "A supplier milestone creates", "New industrial capacity gives", "An allied benchmark establishes"];
const itemSummary = (index: number) => `${itemOpenings[index - 1]} a clearer route from a visible requirement to a reviewable Canadian capability conversation. It lets teams compare organizations, identify evidence gaps and decide which partner or program relationships deserve attention.\n\nUse the signal to test whether the development strengthens an existing Canadian cluster or exposes a dependency that still needs to be addressed. Timing, evidence and next steps can now be considered together without treating procurement status, supplier eligibility, customer interest or later adoption as established.`;
const item = (index: number) => ({ slug: `source-linked-signal-item-${index}`, storyPosition: index, title: `Source-linked signal item ${index}`, lane: "public_need_procurement" as const, tags: ["public_need", "procurement"] as const, bottomLine: "A concrete public development changes what Canadian teams should inspect next.", executiveSummary: itemSummary(index), sourceFact: "The official source publishes a dated change and describes the public requirement in direct terms.", automatedRead: "This may alter the timing or relevance of Canadian capability already visible in the ecosystem.", unknowns: "Eligibility, procurement timing, and buyer interest remain unverified.", nextStep: "Open the original source and compare it with the linked public records before acting.", confidence: "high" as const, eventFingerprint: `government-program-${index}`, contentHash: `abcdef123456789${index}`, materialUpdate: false, sources: [source], recordLinks: [] });

describe("daily Signals contract", () => {
  it("accepts a bounded, descriptive, source-linked edition", () => {
    const parsed = dailySignalsPacketSchema.parse({ schemaVersion: "daily_signals_packet_v1", runId: "signals-20260803", editionDate: "2026-08-03", slug: "canada-accelerates-testing-for-autonomous-defence-systems", title: "Canada accelerates testing for autonomous defence systems", executiveSummary: editionSummary, disclosure: "An automated, source-bounded read prepared from durable public sources. Review the linked evidence before acting.", inspectedCount: 24, sourceFamilyCount: 4, items: [1, 2, 3, 4, 5].map(item), socialDrafts: [] });
    expect(parsed.items).toHaveLength(5);
  });

  it("enforces the repeatable executive field-guide voice before publication", () => {
    const packet = dailySignalsPacketSchema.parse({ schemaVersion: "daily_signals_packet_v1", runId: "signals-voice-20260803", editionDate: "2026-08-03", slug: "canada-connects-testing-production-and-allied-market-access", title: "Canada connects testing, production and allied market access", executiveSummary: editionSummary, disclosure: "An automated, source-bounded read prepared from durable public sources. Review the linked evidence before acting.", inspectedCount: 24, sourceFamilyCount: 4, items: [1, 2, 3, 4, 5].map(item), socialDrafts: [] });
    expect(getSignalsEditorialIssues(packet)).toEqual([]);
    expect(getSignalsEditorialIssues({ ...packet, executiveSummary: packet.executiveSummary.replace(/\n\n/g, " ") })).toContain("Edition executive summary must use three short paragraphs: movement, meaning, and boundary.");
    expect(dailySignalsPacketSchema.safeParse({ ...packet, items: packet.items.map((entry) => ({ ...entry, storyPosition: 1 })) }).success).toBe(false);
  });

  it("keeps the production packet fixture compliant with the editorial gate", async () => {
    const fixture = dailySignalsPacketSchema.parse(JSON.parse(await readFile(path.resolve("tests/fixtures/daily-signals-packet-v1.json"), "utf8")));
    expect(getSignalsEditorialIssues(fixture)).toEqual([]);
  });

  it("rejects a date URL, too few items, and duplicate events", () => {
    const result = dailySignalsPacketSchema.safeParse({ schemaVersion: "daily_signals_packet_v1", runId: "signals-20260803", editionDate: "2026-08-03", slug: "2026-08-03", title: "Daily update for Canadian defence", executiveSummary: "A summary long enough to pass the basic field length while still failing the structural contract.", disclosure: "An automated, source-bounded read prepared from durable public sources.", inspectedCount: 4, sourceFamilyCount: 2, items: [item(1), item(1)], socialDrafts: [] });
    expect(result.success).toBe(false);
  });

  it("keeps RLS, stable slugs, admin correction, public routes and private social drafts explicit", async () => {
    const [migration, rlsFix, archive, detail, admin, publisher, header, sitemap] = await Promise.all([
      readFile(path.resolve("supabase/migrations/20260803140603_add_daily_signals.sql"), "utf8"),
      readFile(path.resolve("supabase/migrations/20260803142218_reconcile_daily_signal_read_policies.sql"), "utf8"),
      readFile(path.resolve("src/app/signals/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/signals/[slug]/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/admin/signals/page.tsx"), "utf8"),
      readFile(path.resolve("scripts/publish-daily-signals.ts"), "utf8"),
      readFile(path.resolve("src/components/atlas/public-atlas-header.tsx"), "utf8"),
      readFile(path.resolve("src/app/sitemap.ts"), "utf8")
    ]);
    expect(migration).toContain("published signal editions are public");
    expect(migration).toContain("signal_edition_slug_immutable");
    expect(migration).toContain("create table public.signal_runs");
    expect(migration).toContain("create table public.signal_social_drafts");
    expect(migration).toContain("atlas administrator reads signal runs");
    expect(rlsFix).toContain("for select to anon using (publication_status = 'published')");
    expect(rlsFix).toContain("authenticated reads published or staff signal editions");
    expect(migration).not.toContain("create table private.signal_runs");
    expect(migration).not.toContain("insert into public.organizations");
    expect(archive).toContain("source-linked");
    expect(detail).toContain("What remains unknown");
    expect(detail).not.toContain("How to read this edition");
    expect(detail).toContain("Executive Signals");
    expect(admin).toContain("updateSignalItem");
    expect(migration).toContain("signal_items_tags_idx");
    expect(migration).toContain("executive_summary text not null");
    expect(publisher).toContain('mode: "idempotent"');
    expect(publisher).toContain("orderedItems");
    expect(publisher).toContain("storyPosition");
    expect(header).toContain('{ href: "/signals", label: "Signals"');
    expect(sitemap).toContain("getPublishedSignals");
  });

  it("accepts an official source image only when its page is cited", () => {
    const base = { schemaVersion: "daily_signals_packet_v1" as const, runId: "signals-image-20260803", editionDate: "2026-08-03", slug: "canadian-defence-testing-opens-new-paths-for-industry", title: "Canadian defence testing opens new paths for industry", executiveSummary: editionSummary, disclosure: "An automated, source-bounded read prepared from durable public sources. Review the linked evidence before acting.", inspectedCount: 24, sourceFamilyCount: 4, items: [1, 2, 3, 4, 5].map(item), socialDrafts: [] };
    expect(dailySignalsPacketSchema.safeParse({ ...base, heroImage: { imageUrl: "https://example.gc.ca/media/defence.jpg", sourcePageUrl: source.canonicalUrl, alt: "Canadian defence systems undergoing operational testing", attribution: "Government of Canada" } }).success).toBe(true);
    expect(dailySignalsPacketSchema.safeParse({ ...base, heroImage: { imageUrl: "https://example.gc.ca/media/defence.jpg", sourcePageUrl: "https://unrelated.example.ca/story", alt: "Canadian defence systems undergoing operational testing", attribution: "Government of Canada" } }).success).toBe(false);
  });
});
