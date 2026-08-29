import Link from "next/link";
import { ArrowRight, ExternalLink, Plus } from "lucide-react";
import { AdminNav } from "@/components/atlas/admin-nav";
import { DefenceBriefEditor, type BriefDraft, type BriefImageOption, type BriefRecordOption, type BriefSourceOption } from "@/components/atlas/defence-brief-editor";
import { EmptyCoverage, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { defenceBriefImageBucket, defenceBriefImageUrl, seededDefenceBriefImages } from "@/lib/atlas/brief-images";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;
type BriefListRow = { id: string; slug: string; title: string; publication_status: string; updated_at: string };

export default async function AdminBriefsPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string; edit?: string }> }) {
  await requireAtlasStaff("admin");
  const params = await searchParams;
  const selectedId = params.edit?.trim() || null;
  const supabase = await createClient();
  const publicSupabase = createPublicClient();
  const listResult = await supabase.from("wiki_pages").select("id, slug, title, publication_status, updated_at").order("updated_at", { ascending: false });
  if (listResult.error) throw new Error(`Unable to load defence briefs: ${listResult.error.message}`);
  const briefs = (listResult.data ?? []) as BriefListRow[];

  let editorInitial: BriefDraft | undefined;
  let sourceOptions: BriefSourceOption[] = [];
  let recordOptions: BriefRecordOption[] = [];
  let imageOptions: BriefImageOption[] = [];
  if (selectedId) {
    const selectedPageQuery = selectedId === "new"
      ? Promise.resolve({ data: null, error: null })
      : supabase.from("wiki_pages").select("*").eq("id", selectedId).maybeSingle();
    const sourceLinksQuery = selectedId === "new"
      ? Promise.resolve({ data: [], error: null })
      : supabase.from("wiki_page_sources").select("page_id, source_id, citation_note, display_order").eq("page_id", selectedId).order("display_order");
    const recordLinksQuery = selectedId === "new"
      ? Promise.resolve({ data: [], error: null })
      : supabase.from("wiki_page_record_links").select("page_id, record_type, record_id, relationship_label, display_order").eq("page_id", selectedId).order("display_order");
    const [pageResult, sourcesResult, sourceLinksResult, recordLinksResult, imageObjectsResult, demandRecords, organizationRecords, capabilityRecords] = await Promise.all([
      selectedPageQuery,
      supabase.from("sources").select("id, title, publisher").eq("visibility", "public").eq("public_approved", true).order("publisher"),
      sourceLinksQuery,
      recordLinksQuery,
      supabase.storage.from(defenceBriefImageBucket).list("", { limit: 200, sortBy: { column: "created_at", order: "desc" } }),
      publicSupabase.from("demand_requirements").select("id, title").eq("publication_status", "published").order("title"),
      publicSupabase.from("organizations").select("id, name").eq("publication_status", "published").order("name"),
      publicSupabase.from("capabilities").select("id, name, organization_id").eq("publication_status", "published").order("name")
    ]);
    const failedQuery = [pageResult, sourcesResult, sourceLinksResult, recordLinksResult, demandRecords, organizationRecords, capabilityRecords].find((result) => result.error);
    if (failedQuery?.error) throw new Error(`Unable to load the defence-brief editor: ${failedQuery.error.message}`);
    if (selectedId !== "new" && !pageResult.data) throw new Error("The selected defence brief no longer exists.");

    sourceOptions = ((sourcesResult.data ?? []) as Row[]).map((row) => ({ id: String(row.id), title: String(row.title), publisher: String(row.publisher) }));
    const organizationNameById = new Map(((organizationRecords.data ?? []) as Row[]).map((row) => [String(row.id), String(row.name)]));
    recordOptions = [
      ...((demandRecords.data ?? []) as Row[]).map((row) => ({ id: String(row.id), type: "demand_requirement" as const, name: String(row.title) })),
      ...((organizationRecords.data ?? []) as Row[]).map((row) => ({ id: String(row.id), type: "organization" as const, name: String(row.name) })),
      ...((capabilityRecords.data ?? []) as Row[]).map((row) => ({ id: String(row.id), type: "capability" as const, name: `${organizationNameById.get(String(row.organization_id)) ?? "Unknown organization"}: ${String(row.name)}` }))
    ];
    const seededLabels = new Map(seededDefenceBriefImages.map((image) => [image.objectName, image.label]));
    imageOptions = Array.from(new Map([
      ...seededDefenceBriefImages.map((image) => [image.value, { value: image.value, label: image.label }] as const),
      ...(((imageObjectsResult.data ?? []) as Array<{ name: string }>).filter((object) => /\.(?:jpe?g|png|webp)$/i.test(object.name)).map((object) => {
        const value = defenceBriefImageUrl(object.name);
        return [value, { value, label: seededLabels.get(object.name) ?? object.name.replace(/[-_]+/g, " ").replace(/\.[^.]+$/, "") }] as const;
      }))
    ]).values());
    if (pageResult.data) editorInitial = mapBriefDraft(pageResult.data as Row, sourceLinksResult.data ?? [], recordLinksResult.data ?? []);
  }

  return <PublicPageShell variant="admin" eyebrow="Private editorial workspace" title="Canadian Defence Briefs" description="Write and publish evidence-backed articles with a clear thesis, useful analysis, public sources, and visible limits. Nothing becomes public until you select Reviewed and public." backHref="/admin" backLabel="Admin home">
    <AdminNav />
    {params.success ? <div className="mb-5 rounded-xl border border-[var(--admin-success-border)] bg-[var(--admin-success-soft)] px-4 py-3 text-sm text-[var(--admin-success)]">Brief saved and public routes refreshed.</div> : null}
    {params.error ? <div className="mb-5 rounded-xl border border-[var(--admin-danger-border)] bg-[var(--admin-danger-soft)] px-4 py-3 text-sm text-[var(--admin-danger)]">{params.error === "invalid-image" ? "Choose a JPEG, PNG, or WebP image smaller than 10 MB." : params.error === "image-upload" ? "The image could not be uploaded. Try again before saving the article." : "The brief was not saved. Check the required fields and approved public sources."}</div> : null}
    {selectedId ? <>
      <Link href="/admin/briefs" prefetch={false} className="mb-4 inline-flex items-center text-xs font-semibold text-[var(--admin-action)]">← Back to brief list</Link>
      <PublicCard title={editorInitial ? `Edit ${editorInitial.title}` : "Create a defence article"} eyebrow="One active editor"><DefenceBriefEditor initial={editorInitial} sources={sourceOptions} records={recordOptions} images={imageOptions} /></PublicCard>
    </> : <>
      <div className="mb-5 flex justify-end"><Link href="/admin/briefs?edit=new" prefetch={false} className="inline-flex h-11 items-center gap-2 rounded-md bg-[var(--admin-action)] px-4 text-sm font-semibold text-white no-underline hover:bg-[var(--admin-action-hover)] hover:no-underline"><Plus className="size-4" />Create a defence article</Link></div>
      {briefs.length ? <div className="overflow-hidden rounded-lg border border-[var(--admin-border)] bg-white">
        <div className="hidden grid-cols-[minmax(0,1fr)_150px_150px_auto] gap-4 border-b border-[var(--admin-border-subtle)] bg-[var(--admin-surface-muted)] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--admin-muted)] md:grid"><span>Article</span><span>Status</span><span>Updated</span><span>Actions</span></div>
        {briefs.map((brief) => <div key={brief.id} className="grid gap-3 border-b border-[var(--admin-border-subtle)] px-4 py-4 last:border-0 md:grid-cols-[minmax(0,1fr)_150px_150px_auto] md:items-center md:gap-4"><strong className="text-sm text-[var(--admin-ink)]">{brief.title}</strong><span className="text-xs text-[var(--admin-muted-strong)]">{brief.publication_status}</span><span className="text-xs text-[var(--admin-muted-strong)]">{new Date(brief.updated_at).toLocaleDateString("en-CA")}</span><div className="flex items-center gap-2">{brief.publication_status === "published" ? <Link href={`/briefs/${brief.slug}`} prefetch={false} target="_blank" className="inline-flex size-9 items-center justify-center rounded-md border border-[var(--admin-border)] text-[var(--admin-muted-strong)]" aria-label={`View ${brief.title}`}><ExternalLink className="size-4" /></Link> : null}<Link href={`/admin/briefs?edit=${encodeURIComponent(brief.id)}`} prefetch={false} className="inline-flex h-9 items-center gap-1 rounded-md bg-[var(--admin-action)] px-3 text-xs font-semibold text-white no-underline hover:bg-[var(--admin-action-hover)] hover:no-underline">Edit <ArrowRight className="size-3.5" /></Link></div></div>)}
      </div> : <EmptyCoverage title="No defence briefs" detail="Create the first private article draft when the source packet is ready." />}
    </>}
  </PublicPageShell>;
}

function mapBriefDraft(page: Row, sourceLinks: Row[], recordLinks: Row[]): BriefDraft {
  return {
    id: String(page.id), slug: String(page.slug), title: String(page.title), thesis: String(page.primary_question), bottomLine: String(page.summary_answer), standfirst: String(page.dek),
    keyTakeaways: Array.isArray(page.key_takeaways) ? page.key_takeaways.map(String) : [],
    sections: Array.isArray(page.sections) ? page.sections.map((value) => { const section = value as Row; return { heading: String(section.heading ?? section.question ?? ""), paragraphs: Array.isArray(section.paragraphs) ? section.paragraphs.map(String) : [String(section.answer ?? "")], points: Array.isArray(section.points) ? section.points.map(String) : [] }; }) : [],
    implications: String(page.derived_read ?? ""), limitations: String(page.limitations ?? ""), recommendedAction: String(page.recommended_action ?? ""),
    format: String(page.content_format ?? "Explainer") as BriefDraft["format"], topic: String(page.topic ?? "Canadian defence"), audience: String(page.audience ?? "Canadian defence business-development and ecosystem leaders"),
    heroImagePath: String(page.hero_image_path ?? defenceBriefImageUrl("defence-briefs-home.jpg")), heroImageAlt: String(page.hero_image_alt ?? "Canadian defence capability and industry network."),
    seoTitle: String(page.seo_title), metaDescription: String(page.meta_description), authorName: String(page.author_name), publicationStatus: String(page.publication_status) as BriefDraft["publicationStatus"],
    sourceLinks: sourceLinks.map((link) => ({ sourceId: String(link.source_id), citationNote: String(link.citation_note), displayOrder: Number(link.display_order) })),
    recordLinks: recordLinks.map((link) => ({ recordType: String(link.record_type) as BriefDraft["recordLinks"][number]["recordType"], recordId: String(link.record_id), relationshipLabel: String(link.relationship_label), displayOrder: Number(link.display_order) }))
  };
}
