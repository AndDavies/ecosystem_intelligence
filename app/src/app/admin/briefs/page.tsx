import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AdminNav } from "@/components/atlas/admin-nav";
import { DefenceBriefEditor, type BriefDraft, type BriefRecordOption, type BriefSourceOption } from "@/components/atlas/defence-brief-editor";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { getAtlasSnapshot } from "@/lib/atlas/repository";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

export default async function AdminBriefsPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  await requireAtlasStaff("admin");
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: pages }, { data: sources }, { data: sourceLinks }, { data: recordLinks }, snapshot] = await Promise.all([
    supabase.from("wiki_pages").select("*").order("updated_at", { ascending: false }),
    supabase.from("sources").select("id, title, publisher").eq("visibility", "public").eq("public_approved", true).order("publisher"),
    supabase.from("wiki_page_sources").select("page_id, source_id, citation_note, display_order").order("display_order"),
    supabase.from("wiki_page_record_links").select("page_id, record_type, record_id, relationship_label, display_order").order("display_order"),
    getAtlasSnapshot()
  ]);
  const sourceOptions: BriefSourceOption[] = ((sources ?? []) as Row[]).map((row) => ({ id: String(row.id), title: String(row.title), publisher: String(row.publisher) }));
  const recordOptions: BriefRecordOption[] = [
    ...snapshot.demandRequirements.map((row) => ({ id: row.id, type: "demand_requirement" as const, name: row.title })),
    ...snapshot.organizations.map((row) => ({ id: row.id, type: "organization" as const, name: row.name })),
    ...snapshot.organizations.flatMap((org) => org.capabilities.map((row) => ({ id: row.id, type: "capability" as const, name: `${org.name}: ${row.name}` })))
  ];
  const drafts: BriefDraft[] = ((pages ?? []) as Row[]).map((page) => ({
    id: String(page.id), slug: String(page.slug), title: String(page.title), primaryQuestion: String(page.primary_question), summaryAnswer: String(page.summary_answer), dek: String(page.dek),
    sections: Array.isArray(page.sections) ? page.sections as BriefDraft["sections"] : [], derivedRead: String(page.derived_read ?? ""), seoTitle: String(page.seo_title), metaDescription: String(page.meta_description), authorName: String(page.author_name), publicationStatus: String(page.publication_status) as BriefDraft["publicationStatus"],
    sourceLinks: ((sourceLinks ?? []) as Row[]).filter((link) => link.page_id === page.id).map((link) => ({ sourceId: String(link.source_id), citationNote: String(link.citation_note), displayOrder: Number(link.display_order) })),
    recordLinks: ((recordLinks ?? []) as Row[]).filter((link) => link.page_id === page.id).map((link) => ({ recordType: String(link.record_type) as BriefDraft["recordLinks"][number]["recordType"], recordId: String(link.record_id), relationshipLabel: String(link.relationship_label), displayOrder: Number(link.display_order) }))
  }));
  return <PublicPageShell variant="admin" eyebrow="Private editorial workspace" title="Canadian Defence Briefs" description="Turn reviewed public evidence into concise, answer-first pages. Nothing becomes public until you select Reviewed and public and record the rationale." backHref="/admin" backLabel="Admin home">
    <AdminNav />
    {params.success ? <div className="mb-5 rounded-xl border border-[var(--admin-success-border)] bg-[var(--admin-success-soft)] px-4 py-3 text-sm text-[var(--admin-success)]">Brief saved and public routes refreshed.</div> : null}
    {params.error ? <div className="mb-5 rounded-xl border border-[var(--admin-danger-border)] bg-[var(--admin-danger-soft)] px-4 py-3 text-sm text-[var(--admin-danger)]">The brief was not saved. Check the required fields, approved sources, and review rationale.</div> : null}
    <PublicCard title="Create a defence brief" eyebrow="Answer a useful question"><DefenceBriefEditor sources={sourceOptions} records={recordOptions} /></PublicCard>
    <div className="mt-5 space-y-4">{drafts.map((draft) => <details key={draft.id} className="rounded-2xl border border-[var(--atlas-border)] bg-white p-5"><summary className="cursor-pointer text-sm font-extrabold text-[var(--atlas-ink)]">{draft.title} <span className="ml-2 text-xs font-semibold text-[var(--atlas-muted)]">{draft.publicationStatus}</span></summary>{draft.publicationStatus === "published" ? <Link href={`/briefs/${draft.slug}`} target="_blank" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[var(--atlas-primary)]">View public page <ExternalLink className="size-3" /></Link> : null}<div className="mt-5"><DefenceBriefEditor initial={draft} sources={sourceOptions} records={recordOptions} /></div></details>)}</div>
  </PublicPageShell>;
}

