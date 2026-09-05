import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { collectPagedRows, collectPagedRowsByIds } from "@/lib/supabase/pagination";
import { createPublicClient } from "@/lib/supabase/public";
import { resolveNorthSignalIssueProof, type NorthSignalIssueProof } from "@/lib/north-signal/offer";
import { nullableSignalText, publishedSignalSource, publishedSignalSummary } from "@/lib/signals/public-projection";
import type { SignalsSummary } from "@/lib/signals/contract";
import type { SignalTag } from "@/lib/signals/taxonomy";

export type SignalSource = {
  id: string; title: string; publisher: string; url: string;
  publishedAt: string | null; locator: string; accessedAt?: string | null;
  supportType?: "direct_record" | "attributed_statement" | "original_reporting" | "corroboration" | null;
};

export type SignalRecordLink = {
  type: "organization" | "capability" | "demand_requirement" | "mission_area";
  id: string; label: string; href: string;
};

export type SignalItem = {
  id: string; slug: string; position: number; title: string;
  lane: "public_need_procurement" | "company_capability" | "funding_industrial_capacity" | "testing_program" | "allied_benchmark";
  tags: SignalTag[]; bottomLine: string; executiveSummary: string; sourceFact: string; automatedRead: string | null;
  unknowns: string | null; nextStep: string | null; confidence: "high" | "medium" | "limited";
  sources: SignalSource[]; links: SignalRecordLink[];
};

export type SignalEdition = {
  id: string; slug: string; editionDate: string; title: string; executiveSummary: string;
  disclosure: string; authorName: string; publishedAt: string; amendedAt: string | null;
  updatedAt: string; items: SignalItem[]; isLocalPreview?: boolean;
  packetSchemaVersion?: string | null; summarySections?: SignalsSummary | null;
  heroImage: { url: string; sourceUrl: string; alt: string; attribution: string } | null;
};

type Row = Record<string, unknown>;
type SignalRecordLinkRow = {
  item_id: unknown;
  record_type: unknown;
  record_id: unknown;
  relationship_label: unknown;
  public_href: unknown;
};
type HydratedSignalRecordLink = { itemId: string; link: SignalRecordLink };

const hydrationPageSize = 1000;
const hydrationIdBatchSize = 100;

function idBatches(ids: string[]) {
  const batches: string[][] = [];
  for (let index = 0; index < ids.length; index += hydrationIdBatchSize) {
    batches.push(ids.slice(index, index + hydrationIdBatchSize));
  }
  return batches;
}

export function validatedPublishedSignalRecordLink(
  row: SignalRecordLinkRow,
  canonicalRoutes: ReadonlyMap<string, string>
): SignalRecordLink | null {
  const type = String(row.record_type) as SignalRecordLink["type"];
  if (!["organization", "capability", "demand_requirement", "mission_area"].includes(type)) return null;
  const id = String(row.record_id);
  const href = String(row.public_href).trim();
  const label = String(row.relationship_label).trim();
  if (!id || !label || canonicalRoutes.get(`${type}:${id}`) !== href) return null;
  return { type, id, label, href };
}

async function loadPublishedSlugRows(
  table: "organizations" | "capabilities" | "mission_areas",
  ids: string[]
): Promise<Row[] | null> {
  if (!ids.length) return [];
  const supabase = createPublicClient();
  const rows: Row[] = [];
  for (const batch of idBatches(ids)) {
    const { data, error } = await supabase
      .from(table)
      .select("id, slug")
      .in("id", batch)
      .eq("publication_status", "published");
    if (error) return null;
    rows.push(...((data ?? []) as Row[]));
  }
  return rows;
}

async function loadPublishedDemandRouteRows(ids: string[]): Promise<Row[] | null> {
  if (!ids.length) return [];
  const supabase = createPublicClient();
  const demandRows: Row[] = [];
  for (const batch of idBatches(ids)) {
    const { data, error } = await supabase
      .from("demand_requirements")
      .select("id, slug, demand_source_id")
      .in("id", batch)
      .eq("publication_status", "published");
    if (error) return null;
    demandRows.push(...((data ?? []) as Row[]));
  }
  const sourceIds = [...new Set(demandRows.map((row) => String(row.demand_source_id)).filter(Boolean))];
  const verifiedSourceIds = new Set<string>();
  for (const batch of idBatches(sourceIds)) {
    const { data, error } = await supabase
      .from("demand_sources")
      .select("id")
      .in("id", batch)
      .eq("publication_status", "published")
      .not("source_verified_at", "is", null)
      .not("source_verified_by", "is", null);
    if (error) return null;
    for (const row of (data ?? []) as Row[]) verifiedSourceIds.add(String(row.id));
  }
  return demandRows.filter((row) => verifiedSourceIds.has(String(row.demand_source_id)));
}

async function canonicalPublishedSignalRecordRoutes(rows: SignalRecordLinkRow[]) {
  const ids = (type: SignalRecordLink["type"]) => [...new Set(rows
    .filter((row) => String(row.record_type) === type)
    .map((row) => String(row.record_id))
    .filter(Boolean))];
  const [organizations, capabilities, demands, missions] = await Promise.all([
    loadPublishedSlugRows("organizations", ids("organization")),
    loadPublishedSlugRows("capabilities", ids("capability")),
    loadPublishedDemandRouteRows(ids("demand_requirement")),
    loadPublishedSlugRows("mission_areas", ids("mission_area"))
  ]);
  if (!organizations || !capabilities || !demands || !missions) return null;
  const routes = new Map<string, string>();
  for (const row of organizations) routes.set(`organization:${String(row.id)}`, `/organizations/${String(row.slug)}`);
  for (const row of capabilities) routes.set(`capability:${String(row.id)}`, `/capabilities/${String(row.slug)}`);
  for (const row of demands) routes.set(`demand_requirement:${String(row.id)}`, `/demand/${String(row.slug)}`);
  for (const row of missions) routes.set(`mission_area:${String(row.id)}`, `/missions/${String(row.slug)}`);
  return routes;
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
        .order("id")
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
        .select("item_id, source_id, display_order, evidence_snapshot, signal_sources(id, canonical_url, title, publisher, published_at, evidence_locator)")
        .in("item_id", batch)
        .order("display_order")
        .order("item_id")
        .order("source_id")
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

async function loadSignalRecordLinks(itemIds: string[]): Promise<HydratedSignalRecordLink[]> {
  const supabase = createPublicClient();
  const rows: Row[] = [];
  for (const batch of idBatches(itemIds)) {
    for (let from = 0; ; from += hydrationPageSize) {
      const { data, error } = await supabase
        .from("signal_record_links")
        .select("item_id, record_type, record_id, relationship_label, public_href, display_order")
        .in("item_id", batch)
        .order("display_order")
        .order("id")
        .range(from, from + hydrationPageSize - 1);
      if (error) {
        console.warn("Published Signal record links are partially unavailable.", { code: error.code, message: error.message });
        return [];
      }
      const page = (data ?? []) as Row[];
      rows.push(...page);
      if (page.length < hydrationPageSize) break;
    }
  }
  const canonicalRoutes = await canonicalPublishedSignalRecordRoutes(rows as unknown as SignalRecordLinkRow[]);
  if (!canonicalRoutes) {
    console.warn("Published Signal record targets could not be verified; record links were omitted.");
    return [];
  }
  const validated = rows.flatMap((row) => {
    const link = validatedPublishedSignalRecordLink(row as unknown as SignalRecordLinkRow, canonicalRoutes);
    return link ? [{ itemId: String(row.item_id), link }] : [];
  });
  if (validated.length !== rows.length) {
    console.warn("Stale, unpublished or noncanonical Signal record links were omitted.", { omitted: rows.length - validated.length });
  }
  return validated;
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
    const item = publishedSignalSource(String(row.source_id ?? source?.id ?? ""), row.evidence_snapshot, source);
    if (!item) continue;
    sourcesByItem.set(String(row.item_id), [...(sourcesByItem.get(String(row.item_id)) ?? []), item]);
  }
  const linksByItem = new Map<string, SignalRecordLink[]>();
  for (const row of linkRows) {
    linksByItem.set(row.itemId, [...(linksByItem.get(row.itemId) ?? []), row.link]);
  }
  const itemsByEdition = new Map<string, SignalItem[]>();
  for (const row of items) {
    const item: SignalItem = {
      id: String(row.id), slug: String(row.slug), position: Number(row.position), title: String(row.title), lane: String(row.lane) as SignalItem["lane"],
      tags: Array.isArray(row.tags) ? row.tags.map(String) as SignalTag[] : [], bottomLine: String(row.bottom_line), executiveSummary: String(row.executive_summary), sourceFact: String(row.source_fact), automatedRead: nullableSignalText(row.automated_read), unknowns: nullableSignalText(row.unknowns), nextStep: nullableSignalText(row.next_step), confidence: String(row.confidence) as SignalItem["confidence"],
      sources: sourcesByItem.get(String(row.id)) ?? [], links: linksByItem.get(String(row.id)) ?? []
    };
    itemsByEdition.set(String(row.edition_id), [...(itemsByEdition.get(String(row.edition_id)) ?? []), item]);
  }
  return rows.map((row) => ({
    id: String(row.id), slug: String(row.slug), editionDate: String(row.edition_date), title: String(row.title), executiveSummary: String(row.executive_summary), disclosure: String(row.automation_disclosure), authorName: String(row.author_name), publishedAt: String(row.published_at), amendedAt: row.amended_at ? String(row.amended_at) : null, updatedAt: String(row.updated_at), items: itemsByEdition.get(String(row.id)) ?? [],
    packetSchemaVersion: nullableSignalText(row.packet_schema_version),
    summarySections: publishedSignalSummary(row.packet_schema_version, row.summary_sections),
    heroImage: row.hero_image_path ? {
      url: String(row.hero_image_path),
      sourceUrl: String(row.hero_image_source_url),
      alt: String(row.hero_image_alt),
      attribution: String(row.hero_image_attribution)
    } : null
  }));
}

/** Explicit development previews are an isolated source, never a live-data fallback. */
async function configuredSignalPreview() {
  if (process.env.NODE_ENV !== "development" || !process.env.SIGNALS_PREVIEW_FILE?.trim()) return null;
  const { loadLocalSignalPreview } = await import("@/lib/signals/local-preview");
  return { edition: await loadLocalSignalPreview() };
}

async function loadPublishedSignals(limit = 30) {
  const preview = await configuredSignalPreview();
  if (preview) return preview.edition ? [preview.edition] : [];
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("signal_editions").select("id, slug, edition_date, title, executive_summary, packet_schema_version, summary_sections, hero_image_path, hero_image_source_url, hero_image_alt, hero_image_attribution, automation_disclosure, author_name, published_at, amended_at, updated_at").eq("publication_status", "published").order("edition_date", { ascending: false }).limit(Math.min(Math.max(limit, 1), 100));
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
  const preview = await configuredSignalPreview();
  if (preview) return preview.edition ? [preview.edition] : [];
  const supabase = createPublicClient();
  const rows: Row[] = [];
  const pageSize = 500;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("signal_editions")
      .select("id, slug, edition_date, title, executive_summary, packet_schema_version, summary_sections, hero_image_path, hero_image_source_url, hero_image_alt, hero_image_attribution, automation_disclosure, author_name, published_at, amended_at, updated_at")
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
  const normalizedId = id.trim();
  if (!normalizedId) return [];
  const preview = await configuredSignalPreview();
  if (preview) return preview.edition?.items.some((item) => item.links.some((link) => link.type === type && link.id === normalizedId)) ? [preview.edition] : [];
  const supabase = createPublicClient();
  const linkRows = await collectPagedRows((from, to) => supabase
    .from("signal_record_links")
    .select("item_id, record_type, record_id, relationship_label, public_href")
    .eq("record_type", type)
    .eq("record_id", normalizedId)
    .order("item_id").order("id").range(from, to), "published Signal record links").catch(() => null);
  if (!linkRows?.length) return [];
  const candidateLinks = linkRows as unknown as SignalRecordLinkRow[];
  const canonicalRoutes = await canonicalPublishedSignalRecordRoutes(candidateLinks);
  if (!canonicalRoutes) return [];
  const itemIds = [...new Set(candidateLinks.flatMap((row) => (
    validatedPublishedSignalRecordLink(row, canonicalRoutes)
      ? [String(row.item_id)]
      : []
  )))];
  if (!itemIds.length) return [];
  const itemRows = await collectPagedRowsByIds(itemIds, (batch, from, to) => supabase.from("signal_items").select("edition_id").in("id", batch).eq("publication_status", "published").order("id").range(from, to), "linked published Signal items").catch(() => null);
  if (!itemRows?.length) return [];
  const editionIds = [...new Set(itemRows.map((row) => String(row.edition_id)))];
  const editionRows = await collectPagedRowsByIds(editionIds, (batch, from, to) => supabase
    .from("signal_editions")
    .select("id, slug, edition_date, title, executive_summary, packet_schema_version, summary_sections, hero_image_path, hero_image_source_url, hero_image_alt, hero_image_attribution, automation_disclosure, author_name, published_at, amended_at, updated_at")
    .in("id", batch)
    .eq("publication_status", "published")
    .order("edition_date", { ascending: false }).order("id").range(from, to), "linked published Signal editions").catch(() => null);
  if (!editionRows) return [];
  editionRows.sort((left, right) => String(right.edition_date).localeCompare(String(left.edition_date)) || String(left.id).localeCompare(String(right.id)));
  return hydrate(editionRows.slice(0, Math.min(Math.max(limit, 1), 20)) as Row[]);

}

async function loadPublishedSignalBySlug(slug: string) {
  const preview = await configuredSignalPreview();
  if (preview) return preview.edition?.slug === slug ? preview.edition : null;
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("signal_editions").select("id, slug, edition_date, title, executive_summary, packet_schema_version, summary_sections, hero_image_path, hero_image_source_url, hero_image_alt, hero_image_attribution, automation_disclosure, author_name, published_at, amended_at, updated_at").eq("slug", slug).eq("publication_status", "published").maybeSingle();
  if (error) {
    const { loadLocalSignalPreview } = await import("@/lib/signals/local-preview");
    const preview = await loadLocalSignalPreview();
    return preview?.slug === slug ? preview : null;
  }
  if (!data) return null;
  return (await hydrate([data as Row]))[0] ?? null;
}

async function loadLatestPublishedSignalProof(): Promise<NorthSignalIssueProof | null> {
  if (await configuredSignalPreview()) return null;
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

const cachedSignals = unstable_cache(loadPublishedSignals, ["published-signals-v3"], { revalidate: 300, tags: ["signals-public"] });
const cachedAllSignals = unstable_cache(loadAllPublishedSignals, ["all-published-signals-v3"], { revalidate: 300, tags: ["signals-public"] });
const cachedSignalBySlug = unstable_cache(loadPublishedSignalBySlug, ["published-signal-v3"], { revalidate: 300, tags: ["signals-public"] });
const cachedLatestSignalProof = unstable_cache(loadLatestPublishedSignalProof, ["latest-published-signal-proof-v1"], { revalidate: 300, tags: ["signals-public"] });
const cachedSignalsForRecord = unstable_cache(loadPublishedSignalsForRecord, ["published-signals-for-record-v3"], { revalidate: 300, tags: ["signals-public"] });

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
