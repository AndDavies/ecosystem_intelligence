import { readFile } from "node:fs/promises";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { published } = vi.hoisted(() => ({ published: vi.fn() }));
vi.mock("@/lib/atlas/signals", () => ({ getPublishedSignals: published }));

import { dailySignalsPacketSchema } from "@/lib/signals/contract";
import { signalEditionEditorSchema, signalEditorFormInput, signalItemEditorSchema } from "@/lib/signals/editorial-input";
import { loadLocalSignalPacket, signalPacketToPreview } from "@/lib/signals/local-preview";
import { nullableSignalText, publishedSignalSource, publishedSignalSummary } from "@/lib/signals/public-projection";
import { signalEditionPresentation } from "@/lib/signals/presentation";
import { SignalEditorialDetails, SignalNarrative } from "@/app/signals/[slug]/signal-editorial-content";
import { GET } from "@/app/signals/feed.xml/route";

async function v3Edition(count = 1) {
  const historical = JSON.parse(await readFile(path.resolve("tests/fixtures/daily-signals-packet-v2.json"), "utf8"));
  const packet = dailySignalsPacketSchema.parse({
    ...historical,
    schemaVersion: "daily_signals_packet_v3",
    summary: { opening: "A substantive opening.\n\nA second paragraph belongs to the opening, not an inferred limitation.", takeaway: "The explicit edition takeaway.", limitation: null },
    heroImage: null,
    socialDrafts: [],
    items: Array.from({ length: count }, (_, index) => ({
      ...historical.items[index % historical.items.length],
      slug: `editorial-development-${index + 1}`,
      storyPosition: index + 1,
      eventFingerprint: `editorial-event-${index + 1}`,
      executiveSummary: index === 0 ? "A recovered fact changes the interpretation.\n\nThe narrative explains its consequence." : "A simpler development needs less explanation.",
      automatedRead: null,
      unknowns: null,
      nextStep: null,
      sources: historical.items[0].sources.map((source: object) => ({ ...source, supportType: "attributed_statement", accessedAt: "2026-09-04T12:00:00.000Z" }))
    }))
  });
  return { packet, edition: signalPacketToPreview(packet) };
}

afterEach(() => vi.unstubAllEnvs());

describe("Signals v3 reader and correction", () => {
  it("preserves explicit multi-paragraph sections and variable-depth editions above eight", async () => {
    const { edition } = await v3Edition(11);
    expect(edition.items).toHaveLength(11);
    expect(edition.items.map((item) => item.position)).toEqual(Array.from({ length: 11 }, (_, index) => index + 1));
    expect(signalEditionPresentation(edition)).toEqual({ deck: edition.summarySections!.opening, bottomLine: "The explicit edition takeaway.", boundary: "" });
    expect(edition.heroImage).toBeNull();
    expect(edition.items[0].unknowns).toBeNull();
    expect(edition.executiveSummary).toContain("The explicit edition takeaway.");
  });

  it("keeps legacy summary parsing and rejects malformed new summaries", () => {
    expect(signalEditionPresentation({ executiveSummary: "Opening one. Opening two. Remaining meaning.\n\nInterpretation.\n\nHistorical boundary.", summarySections: null })).toEqual({ deck: "Opening one. Opening two.", bottomLine: "Remaining meaning.\n\nInterpretation.", boundary: "Historical boundary." });
    expect(publishedSignalSummary(null, { opening: "x", takeaway: "y" })).toBeNull();
    expect(publishedSignalSummary("daily_signals_packet_v3", { opening: "", takeaway: "y" })).toBeNull();
    expect(nullableSignalText(null)).toBeNull();
    expect(nullableSignalText(undefined)).toBeNull();
  });

  it("projects immutable attribution over mutable source data without leaking evidence or lineage", () => {
    const snapshot = { schemaVersion: "signal_evidence_snapshot_v1", canonicalUrl: "https://example.ca/original", title: "Original statement", publisher: "Original publisher", evidenceLocator: "Section two", publishedAt: null, accessedAt: "2026-09-04T12:00:00.000Z", supportType: "attributed_statement", evidenceExcerpt: "Stored quote", contentHash: "private-hash", privateNote: "do not serialize", authority: "official" };
    const legacy = { canonical_url: "https://example.ca/rewritten", title: "Rewritten title", publisher: "Different publisher", evidence_locator: "Changed paragraph" };
    const result = publishedSignalSource("source-1", snapshot, legacy);
    expect(result).toEqual({ id: "source-1", url: snapshot.canonicalUrl, title: snapshot.title, publisher: snapshot.publisher, locator: snapshot.evidenceLocator, publishedAt: null, accessedAt: snapshot.accessedAt, supportType: "attributed_statement" });
    expect(JSON.stringify(result)).not.toMatch(/Stored quote|private-hash|privateNote|authority/);
    expect(publishedSignalSource("source-1", null, legacy)?.title).toBe("Rewritten title");
    expect(publishedSignalSource("source-1", { ...snapshot, canonicalUrl: "javascript:alert(1)" }, legacy)).toBeNull();
  });

  it("renders narrative once and omits empty assessment, limits and next steps", async () => {
    const { edition } = await v3Edition();
    const item = edition.items[0];
    const narrative = renderToStaticMarkup(createElement(SignalNarrative, { text: item.executiveSummary, className: "prose" }));
    const disclosure = renderToStaticMarkup(createElement(SignalEditorialDetails, { item }));
    expect(narrative.match(/A recovered fact changes the interpretation/g)).toHaveLength(1);
    expect(disclosure).toContain("<details");
    expect(disclosure).toContain("<summary");
    expect(disclosure).toContain("Evidence and assessment");
    expect(disclosure).not.toContain(item.executiveSummary);
    expect(disclosure).not.toMatch(/What remains open|What comes next|True North Map assessment|>null</);
    const complete = renderToStaticMarkup(createElement(SignalEditorialDetails, { item: { ...item, automatedRead: "TNM interpretation.", unknowns: "A consequential unknown.", nextStep: "A dated decision follows." } }));
    expect(complete).toContain("TNM interpretation.");
    expect(complete).toContain("A consequential unknown.");
    expect(complete).toContain("A dated decision follows.");
  });

  it("uses stored-version admin validators and stores blank optional inputs as null", async () => {
    const { edition } = await v3Edition();
    const itemInput = { ...edition.items[0], itemId: "b63a4ba1-3d1a-4a65-b19d-8bb5e3e4a946", executiveSummary: "Detailed analysis. ".repeat(200) };
    expect(signalItemEditorSchema("daily_signals_packet_v3").safeParse(itemInput).success).toBe(true);
    expect(signalItemEditorSchema(null).safeParse(itemInput).success).toBe(false);
    const form = new FormData();
    form.set("editionId", itemInput.itemId);
    form.set("title", "A substantial Canadian defence editorial");
    form.set("publicationStatus", "archived");
    form.set("opening", "The editorial opening.");
    form.set("takeaway", "The takeaway.");
    form.set("limitation", "  ");
    form.set("unknowns", "");
    const normalized = signalEditorFormInput(form);
    expect(normalized.unknowns).toBeNull();
    const corrected = signalEditionEditorSchema("daily_signals_packet_v3").parse(normalized);
    expect(corrected.publicationStatus).toBe("archived");
    expect(corrected.summarySections?.limitation).toBeNull();
    expect(corrected.executiveSummary).toBe("The editorial opening.\n\nThe takeaway.");
  });

  it("never loads a local packet in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(await loadLocalSignalPacket()).toBeNull();
  });

  it("retains the historical edition summary in RSS without borrowing an item's limitation", async () => {
    const packet = dailySignalsPacketSchema.parse(JSON.parse(await readFile(path.resolve("tests/fixtures/daily-signals-packet-v2.json"), "utf8")));
    const edition = signalPacketToPreview(packet);
    published.mockResolvedValue([{ ...edition, executiveSummary: "The historical edition summary.", isLocalPreview: undefined }]);
    const feed = await (await GET()).text();
    expect(feed).toContain("The historical edition summary.");
    expect(feed).not.toContain("Principal limit:");
    expect(feed).not.toContain("<details");
  });

  it("uses the explicit RSS takeaway with stable identity and omits invented limits and image enclosures", async () => {
    const { edition } = await v3Edition();
    published.mockResolvedValue([{ ...edition, isLocalPreview: undefined, items: [{ ...edition.items[0], unknowns: "This item-specific limit must not become the edition's limit." }] }]);
    const first = await (await GET()).text();
    expect(published).toHaveBeenCalledWith(20);
    expect(first).toContain("The explicit edition takeaway.");
    expect(first).not.toContain("A substantive opening.");
    expect(first).not.toMatch(/Principal limit:|item-specific limit|<enclosure/);
    const originalGuid = first.match(/<guid[^>]*>[^<]+<\/guid>/)?.[0];
    const originalDate = first.match(/<pubDate>[^<]+<\/pubDate>/)?.[0];
    published.mockResolvedValue([{ ...edition, isLocalPreview: undefined, title: "An amended title", amendedAt: "2026-09-05T14:00:00.000Z", summarySections: { ...edition.summarySections!, limitation: "Delivery timing remains open." } }]);
    const corrected = await (await GET()).text();
    expect(corrected).toContain(originalGuid);
    expect(corrected).toContain(originalDate);
    expect(corrected).toContain("Principal limit: Delivery timing remains open.");
    published.mockResolvedValue([edition]);
    expect(await (await GET()).text()).not.toContain("<item>");
    published.mockResolvedValue([]);
    expect(await (await GET()).text()).not.toContain("<item>");
  });
});
