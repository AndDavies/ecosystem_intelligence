import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { dailySignalsPacketSchema } from "../src/lib/signals/contract";
import { getSignalsEditorialIssues } from "../src/lib/signals/editorial-voice";

const source = { canonicalUrl: "https://example.gc.ca/defence/program", title: "Official defence program update", publisher: "Government of Canada", publishedAt: "2026-08-03T10:00:00.000Z", sourceFamily: "government_program", authority: "official" as const, evidenceLocator: "Program update, paragraph 4", evidenceExcerpt: "The program update identifies a concrete public requirement and a dated next step.", contentHash: "1234567890abcdef" };
const heroImage = { imageUrl: "https://example.gc.ca/media/defence.jpg", sourcePageUrl: source.canonicalUrl, alt: "Canadian defence systems undergoing operational testing", attribution: "Government of Canada" };
const editionSummary = "Several public developments now give Canadian defence and strategic-technology teams a clearer basis for deciding what to inspect next. Released needs, testing activity and industrial capacity are starting to connect.\n\nTaken together, the changes expose where evidence, relationships and qualification work need to begin before a formal opportunity appears. They narrow the questions that suppliers and program teams should ask.\n\nImportant questions about timing, eligibility, funding and customer intent remain open. The linked original sources establish the movement, not a contract forecast.";
const itemOpenings = ["A released public need", "Operational testing now exposes", "A supplier milestone creates", "New industrial capacity gives", "An allied benchmark establishes", "A sustainment pathway reveals"];
const itemSummary = (index: number) => `${itemOpenings[index - 1]} a clearer route from a visible requirement to a reviewable Canadian capability conversation. It lets teams compare organizations, identify evidence gaps and decide which partner or program relationships deserve attention.\n\nUse the signal to test whether the development strengthens an existing Canadian cluster or exposes a dependency that still needs to be addressed. Timing, evidence and next steps can now be considered together without treating procurement status, supplier eligibility, customer interest or later adoption as established.`;
const item = (index: number) => ({ slug: `source-linked-signal-item-${index}`, storyPosition: index, title: `Source-linked signal item ${index}`, lane: "public_need_procurement" as const, tags: ["public_need", "procurement"] as const, bottomLine: "A concrete public development changes what Canadian teams should inspect next.", executiveSummary: itemSummary(index), sourceFact: "The official source publishes a dated change and describes the public requirement in direct terms.", automatedRead: "This may alter the timing or relevance of Canadian capability already visible in the ecosystem.", unknowns: "Eligibility, procurement timing, and buyer interest remain unverified.", nextStep: "Open the original source and compare it with the linked public records before acting.", confidence: "high" as const, eventFingerprint: `government-program-${index}`, contentHash: `abcdef123456789${index}`, materialUpdate: false, sources: [source], recordLinks: [] });
const socialDrafts = [
  { platform: "linkedin" as const, itemSlug: null, text: "Canada's latest public defence signals connect testing, capacity and qualification. Read the source-linked edition and inspect the evidence." },
  { platform: "x" as const, itemSlug: null, text: "Canada's latest defence signals connect testing, capacity and qualification. Inspect the evidence and the next watchpoints." }
];

describe("daily Signals contract", () => {
  it("accepts a bounded, descriptive, source-linked edition", () => {
    const parsed = dailySignalsPacketSchema.parse({ schemaVersion: "daily_signals_packet_v1", runId: "signals-20260803", editionDate: "2026-08-03", slug: "canada-accelerates-testing-for-autonomous-defence-systems", title: "Canada accelerates testing for autonomous defence systems", executiveSummary: editionSummary, disclosure: "An automated, source-bounded read prepared from durable public sources. Review the linked evidence before acting.", inspectedCount: 24, sourceFamilyCount: 4, heroImage, items: [1, 2, 3, 4, 5, 6].map(item), socialDrafts });
    expect(parsed.items).toHaveLength(6);
    expect(dailySignalsPacketSchema.safeParse({ ...parsed, items: parsed.items.slice(0, 5) }).success).toBe(false);
  });

  it("enforces the repeatable executive field-guide voice before publication", () => {
    const packet = dailySignalsPacketSchema.parse({ schemaVersion: "daily_signals_packet_v1", runId: "signals-voice-20260803", editionDate: "2026-08-03", slug: "canada-connects-testing-production-and-allied-market-access", title: "Canada connects testing, production and allied market access", executiveSummary: editionSummary, disclosure: "An automated, source-bounded read prepared from durable public sources. Review the linked evidence before acting.", inspectedCount: 24, sourceFamilyCount: 4, heroImage, items: [1, 2, 3, 4, 5, 6].map(item), socialDrafts });
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

  it("requires current-edition LinkedIn and X examples", () => {
    const base = { schemaVersion: "daily_signals_packet_v1" as const, runId: "signals-social-20260803", editionDate: "2026-08-03", slug: "canada-connects-testing-capacity-and-defence-qualification", title: "Canada connects testing, capacity and defence qualification", executiveSummary: editionSummary, disclosure: "An automated, source-bounded read prepared from durable public sources. Review the linked evidence before acting.", inspectedCount: 24, sourceFamilyCount: 4, heroImage, items: [1, 2, 3, 4, 5, 6].map(item) };
    expect(dailySignalsPacketSchema.safeParse({ ...base, socialDrafts }).success).toBe(true);
    expect(dailySignalsPacketSchema.safeParse({ ...base, socialDrafts: socialDrafts.filter((draft) => draft.platform === "linkedin") }).success).toBe(false);
    expect(dailySignalsPacketSchema.safeParse({ ...base, socialDrafts: socialDrafts.filter((draft) => draft.platform === "x") }).success).toBe(false);
    expect(dailySignalsPacketSchema.safeParse({ ...base, socialDrafts: [{ ...socialDrafts[0], itemSlug: "not-in-this-edition" }, socialDrafts[1]] }).success).toBe(false);
  });

  it("keeps RLS, stable slugs, admin correction, public routes and private social drafts explicit", async () => {
    const [migration, rlsFix, archive, archiveBrowser, detail, articleNavigation, articleShare, tagPill, heroComponent, northSignal, taxonomy, admin, adminEditor, socialExample, publisher, header, sitemap] = await Promise.all([
      readFile(path.resolve("supabase/migrations/20260803140603_add_daily_signals.sql"), "utf8"),
      readFile(path.resolve("supabase/migrations/20260803142218_reconcile_daily_signal_read_policies.sql"), "utf8"),
      readFile(path.resolve("src/app/signals/page.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/signal-archive-browser.tsx"), "utf8"),
      readFile(path.resolve("src/app/signals/[slug]/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/signals/[slug]/signal-article-navigation.tsx"), "utf8"),
      readFile(path.resolve("src/app/signals/[slug]/signal-edition-share.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/signal-tag-pill.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/signal-hero-image.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/north-signal-signup.tsx"), "utf8"),
      readFile(path.resolve("src/lib/signals/taxonomy.ts"), "utf8"),
      readFile(path.resolve("src/app/admin/signals/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/admin/signals/[id]/edit/page.tsx"), "utf8"),
      readFile(path.resolve("src/components/admin/signal-social-example.tsx"), "utf8"),
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
    expect(detail).toContain("True North Defence Signals");
    expect(detail).toContain("The Bottom Line");
    expect(detail).toContain("In this edition");
    expect(detail).toContain("Editorial note");
    expect(detail).toContain('"@type": "NewsArticle"');
    expect(detail).toContain('"@type": "WebPageElement"');
    expect(detail.match(/<h1/g)).toHaveLength(1);
    expect(detail).not.toContain("See what the developments add up to, which decisions they create");
    expect(detail.lastIndexOf("NorthSignalInline")).toBeLessThan(detail.lastIndexOf("edition.disclosure"));
    expect(articleNavigation).toContain("IntersectionObserver");
    expect(articleNavigation).toContain('aria-current={active ? "location"');
    expect(articleNavigation).toContain('href={`#${item.id}`}');
    expect(articleNavigation).toContain("min-h-11");
    expect(archive).toContain('images: [{ url: "/opengraph-image"');
    expect(detail).toContain("width: 1600, height: 900");
    expect(detail).toContain('sizes="(max-width: 1023px) 100vw, 45vw"');
    expect(detail).toContain("atlas-tonal-surface atlas-tonal-paper mx-auto w-full");
    expect(detail).toContain("atlas-tonal-blue");
    expect(detail).toContain("mx-auto w-full xl:grid");
    expect(detail).not.toContain('max-w-[1180px] xl:grid');
    expect(detail).toContain('atlas-tonal-muted mx-auto mt-10 w-full p-5 text-xs');
    expect(detail).toContain('surface="signal"');
    expect(detail).not.toContain("Evidence strength:");
    expect(detail).not.toContain('border-l-4 border-[var(--atlas-signal)]');
    expect(articleNavigation).not.toContain("border-l-2");
    expect(articleNavigation).toContain("bg-white font-bold");
    expect(articleShare).toContain("A signal worth watching from True North Map");
    expect(articleShare).toContain('openShare("linkedin")');
    expect(articleShare).toContain('openShare("x")');
    expect(articleShare).toContain('trackBetaEvent("share"');
    expect(tagPill).toContain('surface?: "paper" | "signal"');
    expect(tagPill).toContain("atlas-pill atlas-pill-tag");
    expect(tagPill).not.toContain("rounded-full border");
    expect(taxonomy).toContain('if (group === "environment") return "atlas-pill-blue"');
    expect(archiveBrowser).not.toContain("source-linked signals</span>");
    expect(archiveBrowser).toContain("Read the signal");
    expect(archiveBrowser).toContain("sm:grid-cols-[minmax(0,1fr)_auto]");
    expect(archiveBrowser).toContain("atlas-pill-link");
    expect(archiveBrowser).not.toContain("hover:bg-[var(--atlas-blue-soft)] hover:shadow");
    expect(archiveBrowser).not.toContain("hover:-translate-y");
    expect(northSignal).toContain('overflow-hidden rounded-[18px]');
    expect(northSignal).not.toContain('border-y border-[var(--atlas-border)]');
    expect(archive).not.toContain('className="absolute inset-x-0 top-0');
    expect(heroComponent).toContain("width={1600} height={900}");
    expect(admin).toContain("Edit edition");
    expect(admin).toContain('dynamic = "force-dynamic"');
    expect(admin).toContain("LinkedIn and X examples are incomplete.");
    expect(adminEditor).toContain("updateSignalEdition");
    expect(adminEditor).toContain("updateSignalItem");
    expect(adminEditor).toContain("Original sources");
    expect(adminEditor).toContain("Social examples");
    expect(socialExample).toContain("navigator.clipboard.writeText");
    expect(socialExample).not.toContain("signal_social_drafts");
    expect(migration).toContain("signal_items_tags_idx");
    expect(migration).toContain("executive_summary text not null");
    expect(publisher).toContain('mode: "idempotent"');
    expect(publisher).toContain('process.argv.includes("--replace-hero")');
    expect(publisher).toContain('mode: "hero-replaced"');
    expect(publisher).toContain('resize(1600, 900');
    expect(publisher).toContain("hero_image_source_url: packet.heroImage.sourcePageUrl");
    expect(publisher).toContain("amended_at: now");
    expect(publisher).toContain("orderedItems");
    expect(publisher).toContain("storyPosition");
    expect(publisher).toContain("ensureSocialDrafts");
    expect(publisher).toContain("socialDraftPlatforms");
    expect(header).toContain('{ href: "/signals", label: "Signals"');
    expect(sitemap).toContain("getPublishedSignals");
  });

  it("accepts an official source image only when its page is cited", () => {
    const base = { schemaVersion: "daily_signals_packet_v1" as const, runId: "signals-image-20260803", editionDate: "2026-08-03", slug: "canadian-defence-testing-opens-new-paths-for-industry", title: "Canadian defence testing opens new paths for industry", executiveSummary: editionSummary, disclosure: "An automated, source-bounded read prepared from durable public sources. Review the linked evidence before acting.", inspectedCount: 24, sourceFamilyCount: 4, items: [1, 2, 3, 4, 5, 6].map(item), socialDrafts };
    expect(dailySignalsPacketSchema.safeParse({ ...base, heroImage: { imageUrl: "https://example.gc.ca/media/defence.jpg", sourcePageUrl: source.canonicalUrl, alt: "Canadian defence systems undergoing operational testing", attribution: "Government of Canada" } }).success).toBe(true);
    expect(dailySignalsPacketSchema.safeParse({ ...base, heroImage: { imageUrl: "https://example.gc.ca/media/defence.jpg", sourcePageUrl: "https://unrelated.example.ca/story", alt: "Canadian defence systems undergoing operational testing", attribution: "Government of Canada" } }).success).toBe(false);
    expect(dailySignalsPacketSchema.safeParse(base).success).toBe(false);
  });
});
