import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { SignalSocialExample } from "@/components/admin/signal-social-example";
import { AdminNav } from "@/components/atlas/admin-nav";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { updateSignalEdition, updateSignalItem } from "@/lib/actions/signals-admin";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { publishedSignalSource, publishedSignalSummary } from "@/lib/signals/public-projection";
import { signalSupportLabels } from "@/lib/signals/presentation";
import { signalTagDefinitions } from "@/lib/signals/taxonomy";

type Row = Record<string, unknown>;

export const dynamic = "force-dynamic";
export const revalidate = 0;

function oneRelation(value: unknown): Row | null {
  if (Array.isArray(value)) return (value[0] as Row | undefined) ?? null;
  return value && typeof value === "object" ? value as Row : null;
}

export default async function EditSignalEditionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ success?: string; error?: string }> }) {
  await requireAtlasStaff("admin");
  const { id } = await params;
  const state = await searchParams;
  const supabase = createAdminClient();
  const [{ data: edition, error: editionError }, { data: itemData }, { data: socialData }] = await Promise.all([
    supabase.from("signal_editions").select("*").eq("id", id).maybeSingle(),
    loadSignalEditorRows((from, to) => supabase.from("signal_items").select("*").eq("edition_id", id).order("position").range(from, to)),
    supabase.from("signal_social_drafts").select("*").eq("edition_id", id).order("created_at")
  ]);
  if (editionError || !edition) notFound();
  const items = (itemData ?? []) as Row[];
  const itemIds = items.map((item) => String(item.id));
  const [{ data: sourceLinks }, { data: recordLinks }] = itemIds.length ? await Promise.all([
    loadSignalEditorLinks(itemIds, (ids, from, to) => supabase.from("signal_item_sources").select("item_id, source_id, display_order, is_primary, evidence_snapshot, signal_sources(*)").in("item_id", ids).order("display_order").range(from, to)),
    loadSignalEditorLinks(itemIds, (ids, from, to) => supabase.from("signal_record_links").select("*").in("item_id", ids).order("display_order").range(from, to))
  ]) : [{ data: [] }, { data: [] }];
  const socialExamples = (socialData ?? []) as Row[];
  const isV3 = edition.packet_schema_version === "daily_signals_packet_v3";
  const summary = publishedSignalSummary(edition.packet_schema_version, edition.summary_sections);
  const missingSocialPlatforms = ["linkedin", "x"].filter((platform) => !socialExamples.some((draft) => draft.platform === platform));
  const heroUrl = edition.hero_image_path ? String(edition.hero_image_path) : null;

  return <PublicPageShell variant="admin" eyebrow="Edit Signal edition" title={String(edition.title)} description="Correct the published editorial record, inspect its source lineage, and copy its private social examples. Saving refreshes the public Signals routes." breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Signals", href: "/admin/signals" }, { label: "Edit edition" }]} actions={edition.publication_status === "published" ? <Link href={`/signals/${String(edition.slug)}`} target="_blank" className="atlas-secondary-button h-11 gap-2 px-4 text-sm">View public page <ExternalLink className="size-4" /></Link> : null}>
    <AdminNav />
    {state.success ? <div className="mb-5 rounded-xl bg-[var(--admin-success-soft)] px-4 py-3 text-sm text-[var(--admin-success)]">Changes saved and public routes refreshed.</div> : null}
    {state.error ? <div className="mb-5 rounded-xl bg-[var(--admin-danger-soft)] px-4 py-3 text-sm text-[var(--admin-danger)]">The change was not saved. Check the required fields and try again.</div> : null}

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
      <PublicCard eyebrow="Edition" title="Page settings">
        <form action={updateSignalEdition} className="grid gap-4">
          <input type="hidden" name="editionId" value={id} />
          <label className="text-xs font-bold">Title<input name="title" defaultValue={String(edition.title)} maxLength={180} required className="mt-1 w-full rounded-xl border border-[var(--atlas-border)] bg-white px-3 py-2.5 text-sm" /></label>
          {isV3 ? <>{[["opening", "Editorial opening", summary?.opening], ["takeaway", "Edition takeaway", summary?.takeaway], ["limitation", "Edition limitation (optional)", summary?.limitation]].map(([name, label, value]) => <label key={name} className="text-xs font-bold">{label}<textarea name={name ?? ""} defaultValue={value ?? ""} required={name !== "limitation"} rows={name === "opening" ? 12 : 5} className="mt-1 w-full rounded-xl border border-[var(--atlas-border)] bg-white px-3 py-2.5 text-sm leading-6" /></label>)}</> : <label className="text-xs font-bold">Executive summary<textarea name="executiveSummary" defaultValue={String(edition.executive_summary)} rows={10} className="mt-1 w-full rounded-xl border border-[var(--atlas-border)] bg-white px-3 py-2.5 text-sm leading-6" /></label>}
          <div className="flex flex-wrap items-center gap-3"><label className="sr-only" htmlFor="edition-publication-status">Publication status</label><select id="edition-publication-status" name="publicationStatus" defaultValue={String(edition.publication_status)} className="h-11 rounded-xl border border-[var(--atlas-border)] bg-white px-3 text-sm"><option value="published">Published</option><option value="archived">Archived</option></select><button className="atlas-primary-button h-11 px-5 text-sm">Save edition</button></div>
        </form>
      </PublicCard>
      <PublicCard eyebrow="Editorial visual" title="Published hero image">
        {heroUrl ? <><div className="relative aspect-video overflow-hidden rounded-2xl bg-[var(--atlas-surface-muted)]"><Image src={heroUrl} alt={String(edition.hero_image_alt ?? "Signal edition hero image")} fill sizes="(max-width: 1279px) 100vw, 36vw" className="object-cover" /></div><p className="mt-3 text-xs font-semibold text-[var(--atlas-ink-soft)]">{String(edition.hero_image_attribution ?? "Source attribution unavailable")}</p>{edition.hero_image_source_url ? <Link href={String(edition.hero_image_source_url)} target="_blank" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[var(--atlas-primary)]">Open image source <ExternalLink className="size-3.5" /></Link> : null}</> : <p className="text-sm text-[var(--atlas-muted)]">This edition uses a text-led presentation. A hero image is optional.</p>}
      </PublicCard>
    </div>

    <section className="mt-6 space-y-5" aria-labelledby="edition-items-title"><div><p className="atlas-eyebrow">Article entries</p><h2 id="edition-items-title" className="mt-2 text-2xl font-extrabold tracking-[-0.035em]">Edit the published briefing</h2></div>{items.map((item) => {
      const itemId = String(item.id);
      const selectedTags = Array.isArray(item.tags) ? item.tags.map(String) : [];
      const sources = ((sourceLinks ?? []) as Row[]).filter((link) => String(link.item_id) === itemId);
      const links = ((recordLinks ?? []) as Row[]).filter((link) => String(link.item_id) === itemId);
      return <PublicCard key={itemId} eyebrow={`${String(item.position).padStart(2, "0")} · ${String(item.lane).replaceAll("_", " ")}`} title={String(item.title)}>
        <form action={updateSignalItem} className="grid gap-4"><input type="hidden" name="itemId" value={itemId} /><input type="hidden" name="editionId" value={id} /><label className="text-xs font-bold">Signal title<input name="title" defaultValue={String(item.title)} className="mt-1 w-full rounded-xl border border-[var(--atlas-border)] px-3 py-2.5 text-sm" /></label>{[["bottomLine", "Subheading", item.bottom_line], ["executiveSummary", isV3 ? "Editorial narrative" : "Executive summary", item.executive_summary], ["sourceFact", "What the public record says", item.source_fact], ["automatedRead", "Why this may matter", item.automated_read], ["unknowns", "What remains unknown", item.unknowns], ["nextStep", "Practical next step", item.next_step]].map(([name, label, value]) => <label key={String(name)} className="text-xs font-bold">{String(label)}{isV3 && ["automatedRead", "unknowns", "nextStep"].includes(String(name)) ? " (optional)" : ""}<textarea name={String(name)} defaultValue={String(value ?? "")} rows={name === "executiveSummary" ? 9 : 4} className="mt-1 w-full rounded-xl border border-[var(--atlas-border)] px-3 py-2.5 text-sm leading-6" /></label>)}<fieldset><legend className="text-xs font-bold">Searchable tags</legend><div className="mt-2 flex flex-wrap gap-2">{signalTagDefinitions.map((tag) => <label key={tag.id} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-[var(--atlas-border)] bg-white px-3 py-2 text-xs font-semibold"><input type="checkbox" name="tags" value={tag.id} defaultChecked={selectedTags.includes(tag.id)} className="accent-[var(--atlas-primary)]" />{tag.label}</label>)}</div></fieldset><div className="flex flex-wrap items-center gap-3"><label className="sr-only" htmlFor={`${itemId}-confidence`}>Internal confidence assessment</label><select id={`${itemId}-confidence`} name="confidence" defaultValue={String(item.confidence)} className="h-11 rounded-xl border border-[var(--atlas-border)] bg-white px-3 text-sm"><option value="high">High</option><option value="medium">Medium</option><option value="limited">Limited</option></select><button className="atlas-primary-button h-11 px-5 text-sm">Save article entry</button></div></form>
        <div className="mt-6 grid gap-4 lg:grid-cols-2"><div className="rounded-2xl bg-[var(--atlas-surface-muted)] p-4"><h3 className="text-sm font-extrabold">Original sources</h3><div className="mt-3 space-y-3">{sources.map((link, index) => { const legacy = oneRelation(link.signal_sources); const source = publishedSignalSource(String(link.source_id ?? legacy?.id ?? ""), link.evidence_snapshot, legacy); return source ? <Link key={`${itemId}-source-${index}`} href={source.url} target="_blank" className="block rounded-xl bg-white p-3 text-xs no-underline hover:text-[var(--atlas-primary)] hover:no-underline"><span className="font-extrabold">{source.title}</span><span className="mt-1 block text-[var(--atlas-muted)]">{source.publisher} · {source.locator}</span>{source.supportType ? <span className="mt-1 block text-[var(--atlas-muted)]">{signalSupportLabels[source.supportType]}</span> : null}</Link> : null; })}{!sources.length ? <p className="text-xs text-[var(--atlas-muted)]">No linked source was returned.</p> : null}</div></div><div className="rounded-2xl bg-[var(--atlas-blue-soft)] p-4"><h3 className="text-sm font-extrabold">Atlas continuations</h3><div className="mt-3 space-y-2">{links.map((link) => <Link key={String(link.id)} href={String(link.public_href)} target="_blank" className="block text-xs font-bold text-[var(--atlas-primary)]">{String(link.relationship_label)} <ExternalLink className="ml-1 inline size-3" /></Link>)}{!links.length ? <p className="text-xs text-[var(--atlas-muted)]">No atlas relationships were linked to this entry.</p> : null}</div></div></div>
      </PublicCard>;
    })}</section>

    <section className="mt-6" aria-labelledby="social-examples-title"><div><p className="atlas-eyebrow">Private distribution copy</p><h2 id="social-examples-title" className="mt-2 text-2xl font-extrabold tracking-[-0.035em]">Social examples</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--atlas-muted)]">These private drafts can be completed after publication and remain view-and-copy only. Copying does not post externally or change their stored status.</p></div><div className="mt-4 grid gap-4 lg:grid-cols-2">{socialExamples.map((draft) => <SignalSocialExample key={String(draft.id)} platform={String(draft.platform)} status={String(draft.status)} text={String(draft.draft_text)} />)}{missingSocialPlatforms.length ? <div className="rounded-2xl bg-[var(--admin-warning-soft)] p-5 text-sm"><p className="font-extrabold">Social packaging pending: {missingSocialPlatforms.map((platform) => platform === "linkedin" ? "LinkedIn" : "X").join(" and ")}.</p><p className="mt-1 text-xs leading-5">Drafts can be prepared or retried independently. The published editorial remains available.</p></div> : null}</div></section>
  </PublicPageShell>;
}

async function loadSignalEditorRows(fetchPage: (from: number, to: number) => PromiseLike<{ data: Row[] | null; error: unknown }>) {
  const rows: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await fetchPage(from, from + 999);
    if (error) throw new Error("Signals editor data is unavailable. Retry before editing this edition.");
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) return { data: rows };
  }
}

async function loadSignalEditorLinks(itemIds: string[], fetchPage: (ids: string[], from: number, to: number) => PromiseLike<{ data: Row[] | null; error: unknown }>) {
  const data: Row[] = [];
  for (let start = 0; start < itemIds.length; start += 100) {
    const page = await loadSignalEditorRows((from, to) => fetchPage(itemIds.slice(start, start + 100), from, to));
    data.push(...page.data);
  }
  return { data };
}
