import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type DefenceBriefSection = {
  question: string;
  answer: string;
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
  primaryQuestion: string;
  summaryAnswer: string;
  dek: string;
  sections: DefenceBriefSection[];
  derivedRead: string | null;
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
    const question = String(row.question ?? "").trim();
    const answer = String(row.answer ?? "").trim();
    if (!question || !answer) return [];
    return [{ question, answer, points: Array.isArray(row.points) ? row.points.map(String).filter(Boolean) : [] }];
  });
}

function toBrief(row: Row, sources: DefenceBriefSource[], links: DefenceBriefLink[]): DefenceBrief {
  return {
    id: String(row.id), slug: String(row.slug), title: String(row.title), primaryQuestion: String(row.primary_question),
    summaryAnswer: String(row.summary_answer), dek: String(row.dek), sections: parseSections(row.sections),
    derivedRead: row.derived_read ? String(row.derived_read) : null, seoTitle: String(row.seo_title),
    metaDescription: String(row.meta_description), authorName: String(row.author_name),
    publishedAt: String(row.published_at), reviewedAt: String(row.reviewed_at), updatedAt: String(row.updated_at), sources, links
  };
}

async function relatedFor(pageIds: string[]) {
  if (!pageIds.length) return { sourcesByPage: new Map<string, DefenceBriefSource[]>(), linksByPage: new Map<string, DefenceBriefLink[]>() };
  const supabase = await createClient();
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

export const getPublishedDefenceBriefs = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.from("wiki_pages").select("*").eq("publication_status", "published").order("published_at", { ascending: false });
  const rows = (data ?? []) as Row[];
  const related = await relatedFor(rows.map((row) => String(row.id)));
  return rows.map((row) => toBrief(row, related.sourcesByPage.get(String(row.id)) ?? [], related.linksByPage.get(String(row.id)) ?? []));
});

export const getPublishedDefenceBriefBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from("wiki_pages").select("*").eq("slug", slug).eq("publication_status", "published").maybeSingle();
  if (!data) return null;
  const row = data as Row;
  const related = await relatedFor([String(row.id)]);
  return toBrief(row, related.sourcesByPage.get(String(row.id)) ?? [], related.linksByPage.get(String(row.id)) ?? []);
});

