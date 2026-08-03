import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
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

function oneRelation(value: unknown): Row | null {
  if (Array.isArray(value)) return (value[0] as Row | undefined) ?? null;
  return value && typeof value === "object" ? value as Row : null;
}

async function hydrate(rows: Row[]): Promise<SignalEdition[]> {
  if (!rows.length) return [];
  const supabase = createPublicClient();
  const editionIds = rows.map((row) => String(row.id));
  const { data: itemRows } = await supabase.from("signal_items").select("id, edition_id, slug, position, title, lane, tags, bottom_line, executive_summary, source_fact, automated_read, unknowns, next_step, confidence").in("edition_id", editionIds).eq("publication_status", "published").order("position");
  const items = (itemRows ?? []) as Row[];
  const itemIds = items.map((row) => String(row.id));
  const [{ data: sourceRows }, { data: linkRows }] = itemIds.length ? await Promise.all([
    supabase.from("signal_item_sources").select("item_id, display_order, signal_sources(id, canonical_url, title, publisher, published_at, evidence_locator)").in("item_id", itemIds).order("display_order"),
    supabase.from("signal_record_links").select("item_id, record_type, record_id, relationship_label, public_href, display_order").in("item_id", itemIds).order("display_order")
  ]) : [{ data: [] }, { data: [] }];
  const sourcesByItem = new Map<string, SignalSource[]>();
  for (const row of (sourceRows ?? []) as Row[]) {
    const source = oneRelation(row.signal_sources);
    if (!source) continue;
    const item = { id: String(source.id), title: String(source.title), publisher: String(source.publisher), url: String(source.canonical_url), publishedAt: source.published_at ? String(source.published_at) : null, locator: String(source.evidence_locator) };
    sourcesByItem.set(String(row.item_id), [...(sourcesByItem.get(String(row.item_id)) ?? []), item]);
  }
  const linksByItem = new Map<string, SignalRecordLink[]>();
  for (const row of (linkRows ?? []) as Row[]) {
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

const cachedSignals = unstable_cache(loadPublishedSignals, ["published-signals-v2"], { revalidate: 300, tags: ["signals-public"] });
const cachedSignalBySlug = unstable_cache(loadPublishedSignalBySlug, ["published-signal-v2"], { revalidate: 300, tags: ["signals-public"] });

export const getPublishedSignals = cache(async (limit = 30) => process.env.NODE_ENV === "development" ? loadPublishedSignals(limit) : cachedSignals(limit));
export const getPublishedSignalBySlug = cache(async (slug: string) => process.env.NODE_ENV === "development" ? loadPublishedSignalBySlug(slug) : cachedSignalBySlug(slug));

export const signalLaneLabels: Record<SignalItem["lane"], string> = {
  public_need_procurement: "Public need and procurement",
  company_capability: "Company and capability",
  funding_industrial_capacity: "Funding and industrial capacity",
  testing_program: "Testing and program activity",
  allied_benchmark: "Allied benchmark"
};
