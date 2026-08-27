import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { resolveNorthSignalIssueProof, type NorthSignalIssueProof } from "@/lib/north-signal/offer";
import type { SignalTag } from "@/lib/signals/taxonomy";

export type SignalSource = {
  id: string; title: string; publisher: string; url: string;
  publishedAt: string | null; locator: string;
};

export type SignalRecordLink = {
  type: "organization" | "capability" | "demand_requirement" | "mission_area";
  id: string; label: string; href: string;
};

export type SignalItem = {
  id: string; slug: string; position: number; title: string;
  lane: "public_need_procurement" | "company_capability" | "funding_industrial_capacity" | "testing_program" | "allied_benchmark";
  tags: SignalTag[]; bottomLine: string; executiveSummary: string; sourceFact: string; automatedRead: string;
  unknowns: string; nextStep: string; confidence: "high" | "medium" | "limited";
  sources: SignalSource[]; links: SignalRecordLink[];
};

export type SignalEdition = {
  id: string; slug: string; editionDate: string; title: string; executiveSummary: string;
  disclosure: string; authorName: string; publishedAt: string; amendedAt: string | null;
  updatedAt: string; items: SignalItem[]; isLocalPreview?: boolean;
  heroImage: { url: string; sourceUrl: string; alt: string; attribution: string } | null;
};

type Row = Record<string, unknown>;

const hydrationPageSize = 1000;
const hydrationIdBatchSize = 100;

function idBatches(ids: string[]) {
  const batches: string[][] = [];
  for (let index = 0; index < ids.length; index += hydrationIdBatchSize) {
    batches.push(ids.slice(index, index + hydrationIdBatchSize));
  }
  return batches;
}

async function loadPublishedSignalItems(editionIds: string[]) {
  const supabase = createPublicClient();
  const rows: Row[] = [];
  for (const batch of idBatches(editionIds)) {
    for (let from = 0; ; from += hydrationPageSize) {
      const { data, error } = await supabase
        .from("signal_items")
        .select("id, edition_id, slug, position, title, lane, tags, bottom_line, executive_summary, source_fact, automated_read, unknowns, next_step, confidence")
        .in("edition_id", batch)
        .eq("publication_status", "published")
        .order("position")
        .range(from, from + hydrationPageSize - 1);
      if (error) {
        console.warn("Published Signal items are partially unavailable.", { code: error.code, message: error.message });
        return rows;
      }
      const page = (data ?? []) as Row[];
      rows.push(...page);
      if (page.length < hydrationPageSize) break;
    }
  }
  return rows;
}

async function loadSignalItemSources(itemIds: string[]) {
  const supabase = createPublicClient();
  const rows: Row[] = [];
  for (const batch of idBatches(itemIds)) {
    for (let from = 0; ; from += hydrationPageSize) {
      const { data, error } = await supabase
        .from("signal_item_sources")
        .select("item_id, display_order, signal_sources(id, canonical_url, title, publisher, published_at, evidence_locator)")
        .in("item_id", batch)
        .order("display_order")
        .range(from, from + hydrationPageSize - 1);
      if (error) {
        console.warn("Published Signal sources are partially unavailable.", { code: error.code, message: error.message });
        return rows;
      }
      const page = (data ?? []) as Row[];
      rows.push(...page);
      if (page.length < hydrationPageSize) break;
    }
  }
  return rows;
}

async function loadSignalRecordLinks(itemIds: string[]) {
  const supabase = createPublicClient();
  const rows: Row[] = [];
  for (const batch of idBatches(itemIds)) {
    for (let from = 0; ; from += hydrationPageSize) {
      const { data, error } = await supabase
        .from("signal_record_links")
        .select("item_id, record_type, record_id, relationship_label, public_href, display_order")
        .in("item_id", batch)
        .order("display_order")
        .range(from, from + hydrationPageSize - 1);
      if (error) {
        console.warn("Published Signal record links are partially unavailable.", { code: error.code, message: error.message });
        return rows;
      }
      const page = (data ?? []) as Row[];
      rows.push(...page);
      if (page.length < hydrationPageSize) break;
    }
  }
  return rows;
}

function oneRelation(value: unknown): Row | null {
  if (Array.isArray(value)) return (value[0] as Row | undefined) ?? null;
  return value && typeof value === "object" ? value as Row : null;
}

async function hydrate(rows: Row[]): Promise<SignalEdition[]> {
  if (!rows.length) return [];
  const editionIds = rows.map((row) => String(row.id));
  const items = await loadPublishedSignalItems(editionIds);
  const itemIds = items.map((row) => String(row.id));
  const [sourceRows, linkRows] = itemIds.length ? await Promise.all([
    loadSignalItemSources(itemIds),
    loadSignalRecordLinks(itemIds)
  ]) : [[], []];
  const sourcesByItem = new Map<string, SignalSource[]>();
  for (const row of sourceRows) {
    const source = oneRelation(row.signal_sources);
    if (!source) continue;
    const item = { id: String(source.id), title: String(source.title), publisher: String(source.publisher), url: String(source.canonical_url), publishedAt: source.published_at ? String(source.published_at) : null, locator: String(source.evidence_locator) };
    sourcesByItem.set(String(row.item_id), [...(sourcesByItem.get(String(row.item_id)) ?? []), item]);
  }
  const linksByItem = new Map<string, SignalRecordLink[]>();
  for (const row of linkRows) {
    const item = { type: String(row.record_type) as SignalRecordLink["type"], id: String(row.record_id), label: String(row.relationship_label), href: String(row.public_href) };
    linksByItem.set(String(row.item_id), [...(linksByItem.get(String(row.item_id)) ?? []), item]);
  }
  const itemsByEdition = new Map<string, SignalItem[]>();
  for (const row of items) {
    const item: SignalItem = {
      id: String(row.id), slug: String(row.slug), position: Number(row.position), title: String(row.title), lane: String(row.lane) as SignalItem["lane"],
      tags: Array.isArray(row.tags) ? row.tags.map(String) as SignalTag[] : [], bottomLine: String(row.bottom_line), executiveSummary: String(row.executive_summary), sourceFact: String(row.source_fact), automatedRead: String(row.automated_read), unknowns: String(row.unknowns), nextStep: String(row.next_step), confidence: String(row.confidence) as SignalItem["confidence"],
      sources: sourcesByItem.get(String(row.id)) ?? [], links: linksByItem.get(String(row.id)) ?? []
    };
    itemsByEdition.set(String(row.edition_id), [...(itemsByEdition.get(String(row.edition_id)) ?? []), item]);
  }
  return rows.map((row) => ({
    id: String(row.id), slug: String(row.slug), editionDate: String(row.edition_date), title: String(row.title), executiveSummary: String(row.executive_summary), disclosure: String(row.automation_disclosure), authorName: String(row.author_name), publishedAt: String(row.published_at), amendedAt: row.amended_at ? String(row.amended_at) : null, updatedAt: String(row.updated_at), items: itemsByEdition.get(String(row.id)) ?? [],
    heroImage: row.hero_image_path ? {
      url: String(row.hero_image_path),
      sourceUrl: String(row.hero_image_source_url),
      alt: String(row.hero_image_alt),
      attribution: String(row.hero_image_attribution)
    } : null
  }));
}

async function loadPublishedSignals(limit = 30) {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("signal_editions").select("id, slug, edition_date, title, executive_summary, hero_image_path, hero_image_source_url, hero_image_alt, hero_image_attribution, automation_disclosure, author_name, published_at, amended_at, updated_at").eq("publication_status", "published").order("edition_date", { ascending: false }).limit(Math.min(Math.max(limit, 1), 100));
  if (error) {
    const { loadLocalSignalPreview } = await import("@/lib/signals/local-preview");
    const preview = await loadLocalSignalPreview();
    if (preview) return [preview];
    console.warn("Published Signals are unavailable.", { code: error.code, message: error.message });
    return [];
  }
  return hydrate((data ?? []) as Row[]);
}

async function loadAllPublishedSignals() {
  const supabase = createPublicClient();
  const rows: Row[] = [];
  const pageSize = 500;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("signal_editions")
      .select("id, slug, edition_date, title, executive_summary, hero_image_path, hero_image_source_url, hero_image_alt, hero_image_attribution, automation_disclosure, author_name, published_at, amended_at, updated_at")
      .eq("publication_status", "published")
      .order("edition_date", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) {
      console.warn("The complete Signals archive is unavailable.", { code: error.code, message: error.message });
      return loadPublishedSignals(100);
    }
    const page = (data ?? []) as Row[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return hydrate(rows);
}

async function loadPublishedSignalsForRecord(type: SignalRecordLink["type"], id: string, limit = 4) {
  const supabase = createPublicClient();
  const { data: linkRows, error: linkError } = await supabase
    .from("signal_record_links")
    .select("item_id")
    .eq("record_type", type)
    .eq("record_id", id)
    .limit(100);
  if (linkError || !linkRows?.length) return [];
  const itemIds = linkRows.map((row) => String(row.item_id));
  const { data: itemRows, error: itemError } = await supabase.from("signal_items").select("edition_id").in("id", itemIds).eq("publication_status", "published");
  if (itemError || !itemRows?.length) return [];
  const editionIds = Array.from(new Set(itemRows.map((row) => String(row.edition_id))));
  const { data: editionRows, error: editionError } = await supabase
    .from("signal_editions")
    .select("id, slug, edition_date, title, executive_summary, hero_image_path, hero_image_source_url, hero_image_alt, hero_image_attribution, automation_disclosure, author_name, published_at, amended_at, updated_at")
    .in("id", editionIds)
    .eq("publication_status", "published")
    .order("edition_date", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 20));
  if (editionError) return [];
  return hydrate((editionRows ?? []) as Row[]);
}

async function loadPublishedSignalBySlug(slug: string) {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("signal_editions").select("id, slug, edition_date, title, executive_summary, hero_image_path, hero_image_source_url, hero_image_alt, hero_image_attribution, automation_disclosure, author_name, published_at, amended_at, updated_at").eq("slug", slug).eq("publication_status", "published").maybeSingle();
  if (error) {
    const { loadLocalSignalPreview } = await import("@/lib/signals/local-preview");
    const preview = await loadLocalSignalPreview();
    return preview?.slug === slug ? preview : null;
  }
  if (!data) return null;
  return (await hydrate([data as Row]))[0] ?? null;
}

async function loadLatestPublishedSignalProof(): Promise<NorthSignalIssueProof | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("signal_editions")
    .select("slug, title")
    .eq("publication_status", "published")
    .order("edition_date", { ascending: false })
    .limit(1)
    .abortSignal(AbortSignal.timeout(5_000))
    .maybeSingle();

  if (error) return null;

  return resolveNorthSignalIssueProof(data ? { slug: String(data.slug), title: String(data.title) } : null);
}

const cachedSignals = unstable_cache(loadPublishedSignals, ["published-signals-v2"], { revalidate: 300, tags: ["signals-public"] });
const cachedAllSignals = unstable_cache(loadAllPublishedSignals, ["all-published-signals-v1"], { revalidate: 300, tags: ["signals-public"] });
const cachedSignalBySlug = unstable_cache(loadPublishedSignalBySlug, ["published-signal-v2"], { revalidate: 300, tags: ["signals-public"] });
const cachedLatestSignalProof = unstable_cache(loadLatestPublishedSignalProof, ["latest-published-signal-proof-v1"], { revalidate: 300, tags: ["signals-public"] });
const cachedSignalsForRecord = unstable_cache(loadPublishedSignalsForRecord, ["published-signals-for-record-v1"], { revalidate: 300, tags: ["signals-public"] });

export const getPublishedSignals = cache(async (limit = 30) => process.env.NODE_ENV === "development" ? loadPublishedSignals(limit) : cachedSignals(limit));
export const getAllPublishedSignals = cache(async () => process.env.NODE_ENV === "development" ? loadAllPublishedSignals() : cachedAllSignals());
export const getPublishedSignalBySlug = cache(async (slug: string) => process.env.NODE_ENV === "development" ? loadPublishedSignalBySlug(slug) : cachedSignalBySlug(slug));
export const getLatestPublishedSignalProof = cache(async () => process.env.NODE_ENV === "development" ? loadLatestPublishedSignalProof() : cachedLatestSignalProof());
export const getPublishedSignalsForRecord = cache(async (type: SignalRecordLink["type"], id: string, limit = 4) => process.env.NODE_ENV === "development" ? loadPublishedSignalsForRecord(type, id, limit) : cachedSignalsForRecord(type, id, limit));

export const signalLaneLabels: Record<SignalItem["lane"], string> = {
  public_need_procurement: "Public need and procurement",
  company_capability: "Company and capability",
  funding_industrial_capacity: "Funding and industrial capacity",
  testing_program: "Testing and program activity",
  allied_benchmark: "Allied benchmark"
};
