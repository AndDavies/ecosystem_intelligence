import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

const briefColumns = "id, slug, title, primary_question, summary_answer, dek, sections, derived_read, key_takeaways, limitations, recommended_action, content_format, topic, audience, hero_image_path, hero_image_alt, seo_title, meta_description, author_name, published_at, reviewed_at, updated_at";

export type DefenceBriefSection = {
  heading: string;
  paragraphs: string[];
  points: string[];
};

export type DefenceBriefSource = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  publishedAt: string | null;
  note: string;
};

export type DefenceBriefLink = {
  type: "organization" | "capability" | "demand_requirement";
  id: string;
  label: string;
};

export type DefenceBrief = {
  id: string;
  slug: string;
  title: string;
  thesis: string;
  bottomLine: string;
  standfirst: string;
  sections: DefenceBriefSection[];
  keyTakeaways: string[];
  implications: string | null;
  limitations: string | null;
  recommendedAction: string | null;
  format: "Brief" | "Explainer" | "Guide" | "Analysis";
  topic: string;
  audience: string;
  heroImagePath: string | null;
  heroImageAlt: string | null;
  seoTitle: string;
  metaDescription: string;
  authorName: string;
  publishedAt: string;
  reviewedAt: string;
  updatedAt: string;
  sources: DefenceBriefSource[];
  links: DefenceBriefLink[];
};

type Row = Record<string, unknown>;

function parseSections(value: unknown): DefenceBriefSection[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((section) => {
    if (!section || typeof section !== "object") return [];
    const row = section as Row;
    const heading = String(row.heading ?? row.question ?? "").trim();
    const rawParagraphs = row.paragraphs ?? row.body ?? row.answer;
    const paragraphs = Array.isArray(rawParagraphs)
      ? rawParagraphs.map(String).map((paragraph) => paragraph.trim()).filter(Boolean)
      : String(rawParagraphs ?? "").split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
    if (!heading || !paragraphs.length) return [];
    return [{ heading, paragraphs, points: Array.isArray(row.points) ? row.points.map(String).filter(Boolean) : [] }];
  });
}

function parseStringList(value: unknown) {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : [];
}

function toBrief(row: Row, sources: DefenceBriefSource[], links: DefenceBriefLink[]): DefenceBrief {
  return {
    id: String(row.id), slug: String(row.slug), title: String(row.title), thesis: String(row.primary_question),
    bottomLine: String(row.summary_answer), standfirst: String(row.dek), sections: parseSections(row.sections),
    keyTakeaways: parseStringList(row.key_takeaways), implications: row.derived_read ? String(row.derived_read) : null,
    limitations: row.limitations ? String(row.limitations) : null,
    recommendedAction: row.recommended_action ? String(row.recommended_action) : null,
    format: String(row.content_format ?? "Brief") as DefenceBrief["format"], topic: String(row.topic ?? "Canadian defence"),
    audience: String(row.audience ?? "Canadian defence and dual-use decision-makers"),
    heroImagePath: row.hero_image_path ? String(row.hero_image_path) : null,
    heroImageAlt: row.hero_image_alt ? String(row.hero_image_alt) : null,
    seoTitle: String(row.seo_title),
    metaDescription: String(row.meta_description), authorName: String(row.author_name),
    publishedAt: String(row.published_at), reviewedAt: String(row.reviewed_at), updatedAt: String(row.updated_at), sources, links
  };
}

async function relatedFor(pageIds: string[]) {
  if (!pageIds.length) return { sourcesByPage: new Map<string, DefenceBriefSource[]>(), linksByPage: new Map<string, DefenceBriefLink[]>() };
  const supabase = createPublicClient();
  const [{ data: sourceLinks }, { data: recordLinks }] = await Promise.all([
    supabase.from("wiki_page_sources").select("page_id, citation_note, display_order, sources(id, title, publisher, canonical_url, published_at)").in("page_id", pageIds).order("display_order"),
    supabase.from("wiki_page_record_links").select("page_id, record_type, record_id, relationship_label, display_order").in("page_id", pageIds).order("display_order")
  ]);
  const sourcesByPage = new Map<string, DefenceBriefSource[]>();
  for (const raw of (sourceLinks ?? []) as Row[]) {
    const pageId = String(raw.page_id);
    const source = (Array.isArray(raw.sources) ? raw.sources[0] : raw.sources) as Row | null;
    if (!source) continue;
    const item = { id: String(source.id), title: String(source.title), publisher: String(source.publisher), url: String(source.canonical_url), publishedAt: source.published_at ? String(source.published_at) : null, note: String(raw.citation_note) };
    sourcesByPage.set(pageId, [...(sourcesByPage.get(pageId) ?? []), item]);
  }
  const linksByPage = new Map<string, DefenceBriefLink[]>();
  for (const raw of (recordLinks ?? []) as Row[]) {
    const pageId = String(raw.page_id);
    const item = { type: String(raw.record_type) as DefenceBriefLink["type"], id: String(raw.record_id), label: String(raw.relationship_label) };
    linksByPage.set(pageId, [...(linksByPage.get(pageId) ?? []), item]);
  }
  return { sourcesByPage, linksByPage };
}

async function loadPublishedDefenceBriefs() {
  const supabase = createPublicClient();
  const { data } = await supabase.from("wiki_pages").select(briefColumns).eq("publication_status", "published").order("published_at", { ascending: false });
  const rows = (data ?? []) as Row[];
  const related = await relatedFor(rows.map((row) => String(row.id)));
  return rows.map((row) => toBrief(row, related.sourcesByPage.get(String(row.id)) ?? [], related.linksByPage.get(String(row.id)) ?? []));
}

async function loadPublishedDefenceBriefBySlug(slug: string) {
  const supabase = createPublicClient();
  const { data } = await supabase.from("wiki_pages").select(briefColumns).eq("slug", slug).eq("publication_status", "published").maybeSingle();
  if (!data) return null;
  const row = data as Row;
  const related = await relatedFor([String(row.id)]);
  return toBrief(row, related.sourcesByPage.get(String(row.id)) ?? [], related.linksByPage.get(String(row.id)) ?? []);
}

const getCachedPublishedDefenceBriefs = unstable_cache(
  loadPublishedDefenceBriefs,
  ["ecosystem-intelligence-published-defence-briefs-v3"],
  { revalidate: 300, tags: ["briefs-public"] }
);

const getCachedPublishedDefenceBriefBySlug = unstable_cache(
  loadPublishedDefenceBriefBySlug,
  ["ecosystem-intelligence-published-defence-brief-v3"],
  { revalidate: 300, tags: ["briefs-public"] }
);

export const getPublishedDefenceBriefs = cache(async () => getCachedPublishedDefenceBriefs());

export const getPublishedDefenceBriefBySlug = cache(async (slug: string) => getCachedPublishedDefenceBriefBySlug(slug));

export function relatedDefenceBriefs(current: DefenceBrief, briefs: DefenceBrief[], limit = 3) {
  const currentLinks = new Set(current.links.map((link) => `${link.type}:${link.id}`));
  const currentSources = new Set(current.sources.map((source) => source.id));

  return briefs
    .filter((brief) => brief.id !== current.id)
    .map((brief) => {
      const sharedRecords = brief.links.filter((link) => currentLinks.has(`${link.type}:${link.id}`)).length;
      const sharedSources = brief.sources.filter((source) => currentSources.has(source.id)).length;
      const sameTopic = brief.topic && brief.topic === current.topic ? 1 : 0;
      return { brief, score: sharedRecords * 4 + sameTopic * 2 + sharedSources };
    })
    .sort((left, right) => right.score - left.score || Date.parse(right.brief.updatedAt) - Date.parse(left.brief.updatedAt))
    .slice(0, limit)
    .map(({ brief }) => brief);
}
