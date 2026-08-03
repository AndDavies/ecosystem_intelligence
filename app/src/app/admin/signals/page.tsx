import Link from "next/link";
import { ExternalLink, Rss } from "lucide-react";
import { AdminNav } from "@/components/atlas/admin-nav";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { updateSignalEdition, updateSignalItem } from "@/lib/actions/signals-admin";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadLocalSignalPreview } from "@/lib/signals/local-preview";
import { signalTagDefinitions } from "@/lib/signals/taxonomy";

type Row = Record<string, unknown>;

export default async function AdminSignalsPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  await requireAtlasStaff("admin");
  const params = await searchParams;
  const supabase = createAdminClient();
  const [editionResult, itemResult, runResult, draftResult, localPreview] = await Promise.all([
    supabase.from("signal_editions").select("*").order("edition_date", { ascending: false }).limit(60),
    supabase.from("signal_items").select("*").order("position"),
    supabase.from("signal_runs").select("*").order("started_at", { ascending: false }).limit(10),
    supabase.from("signal_social_drafts").select("*").eq("status", "draft").order("created_at", { ascending: false }).limit(40),
    loadLocalSignalPreview()
  ]);
  const editions = editionResult.data;
  const items = itemResult.data;
  const runs = runResult.data;
  const drafts = draftResult.data;
  const schemaReady = !editionResult.error && !itemResult.error;
  const operationsReady = !runResult.error && !draftResult.error;
  const editionRows = (editions ?? []) as Row[];
  const itemRows = (items ?? []) as Row[];
  return <PublicPageShell variant="admin" eyebrow="Automated editorial workspace" title="Canadian Defence Signals" description="Inspect weekday scan health, correct published copy, archive an edition, and copy private social drafts. Signals never write to the core organization, technology, Public Need, evidence, or match tables." backHref="/admin" backLabel="Admin home">
    <AdminNav />
    {params.success ? <div className="mb-5 rounded-xl border border-[var(--admin-success-border)] bg-[var(--admin-success-soft)] px-4 py-3 text-sm text-[var(--admin-success)]">Signals saved and public routes refreshed.</div> : null}
    {params.error ? <div className="mb-5 rounded-xl border border-[var(--admin-danger-border)] bg-[var(--admin-danger-soft)] px-4 py-3 text-sm text-[var(--admin-danger)]">The change was not saved. Check the required lengths and try again.</div> : null}
    {!schemaReady ? <div className="mb-6 rounded-2xl border border-[var(--admin-warning-border)] bg-[var(--admin-warning-soft)] p-5 text-sm leading-6 text-[var(--atlas-ink-soft)]"><p className="font-extrabold text-[var(--atlas-ink)]">Signals database migration is not installed.</p><p className="mt-2">The application is ready, but the canonical database does not yet contain the Signals tables. No edition was lost and the dry run did not publish anything. Apply <code className="font-mono text-xs">20260803110242_add_daily_signals.sql</code> only when this feature is approved for production.</p>{localPreview ? <Link href={`/signals/${localPreview.slug}`} className="atlas-secondary-button mt-4 inline-flex h-10 px-4 text-xs">Review the local preview <ExternalLink className="ml-2 size-3.5" /></Link> : <p className="mt-3 text-xs font-semibold">No valid local preview packet was found under the ignored Signals workspace.</p>}</div> : null}
    {schemaReady && !operationsReady ? <div className="mb-6 rounded-2xl border border-[var(--admin-warning-border)] bg-[var(--admin-warning-soft)] p-5 text-sm leading-6"><p className="font-extrabold">Signals operational tables are unavailable.</p><p className="mt-2">Public editions can still be inspected, but run health and private social drafts will remain hidden until their RLS-protected tables are available through the server-side Data API.</p></div> : null}
    <div className="grid gap-5 lg:grid-cols-2">
      <PublicCard eyebrow="Run health" title="Latest automated scans"><div className="space-y-3">{((runs ?? []) as Row[]).map((run) => <div key={String(run.id)} className="rounded-xl bg-[var(--atlas-surface-muted)] p-4 text-xs"><div className="flex justify-between gap-4"><span className="font-extrabold">{String(run.run_id)}</span><span className="font-bold text-[var(--atlas-primary)]">{String(run.status)}</span></div><p className="mt-2 text-[var(--atlas-muted)]">Inspected {String(run.inspected_count)} · Selected {String(run.selected_count)} · Source families {String(run.source_family_count)}</p></div>)}{!runs?.length ? <p className="text-sm text-[var(--atlas-muted)]">No daily scan has been recorded yet.</p> : null}</div></PublicCard>
      <PublicCard eyebrow="Private only" title="Social drafts"><div className="max-h-[420px] space-y-3 overflow-y-auto">{((drafts ?? []) as Row[]).map((draft) => <div key={String(draft.id)} className="rounded-xl border border-[var(--atlas-border)] p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--atlas-primary)]">{String(draft.platform)}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--atlas-ink-soft)]">{String(draft.draft_text)}</p></div>)}{!drafts?.length ? <p className="text-sm text-[var(--atlas-muted)]">No social drafts are waiting.</p> : null}</div></PublicCard>
    </div>
    <section className="mt-6 space-y-5">{schemaReady ? editionRows.map((edition) => {
      const editionItems = itemRows.filter((item) => item.edition_id === edition.id);
      return <details key={String(edition.id)} className="rounded-2xl border border-[var(--atlas-border)] bg-white p-5"><summary className="cursor-pointer text-sm font-extrabold">{String(edition.title)} <span className="ml-2 text-xs font-semibold text-[var(--atlas-muted)]">{String(edition.edition_date)} · {String(edition.publication_status)}</span></summary>
        <Link href={`/signals/${String(edition.slug)}`} target="_blank" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[var(--atlas-primary)]">View public page <ExternalLink className="size-3" /></Link>
        <form action={updateSignalEdition} className="mt-5 grid gap-4 rounded-xl bg-[var(--atlas-surface-muted)] p-4"><input type="hidden" name="editionId" value={String(edition.id)} /><label className="text-xs font-bold">Title<input name="title" defaultValue={String(edition.title)} className="mt-1 w-full rounded-lg border border-[var(--atlas-border)] bg-white px-3 py-2 text-sm" /></label><label className="text-xs font-bold">Executive summary<textarea name="executiveSummary" defaultValue={String(edition.executive_summary)} rows={8} className="mt-1 w-full rounded-lg border border-[var(--atlas-border)] bg-white px-3 py-2 text-sm leading-6" /></label><div className="flex flex-wrap items-center gap-3"><select name="publicationStatus" defaultValue={String(edition.publication_status)} className="h-10 rounded-lg border border-[var(--atlas-border)] bg-white px-3 text-sm"><option value="published">Published</option><option value="archived">Archived</option></select><button className="atlas-primary-button h-10 px-4 text-sm">Save edition</button></div></form>
        <div className="mt-5 space-y-4">{editionItems.map((item) => {
          const selectedTags = Array.isArray(item.tags) ? item.tags.map(String) : [];
          return <form key={String(item.id)} action={updateSignalItem} className="grid gap-3 rounded-xl border border-[var(--atlas-border)] p-4"><input type="hidden" name="itemId" value={String(item.id)} /><label className="text-xs font-bold">Signal title<input name="title" defaultValue={String(item.title)} className="mt-1 w-full rounded-lg border border-[var(--atlas-border)] px-3 py-2 text-sm" /></label>{[["bottomLine", "Subheading", item.bottom_line], ["executiveSummary", "Executive summary", item.executive_summary], ["sourceFact", "What the public record says", item.source_fact], ["automatedRead", "Why this may matter", item.automated_read], ["unknowns", "What remains unknown", item.unknowns], ["nextStep", "Practical next step", item.next_step]].map(([name, label, value]) => <label key={String(name)} className="text-xs font-bold">{String(label)}<textarea name={String(name)} defaultValue={String(value)} rows={name === "executiveSummary" ? 8 : 3} className="mt-1 w-full rounded-lg border border-[var(--atlas-border)] px-3 py-2 text-sm leading-6" /></label>)}<fieldset><legend className="text-xs font-bold">Searchable tags</legend><div className="mt-2 flex flex-wrap gap-2">{signalTagDefinitions.map((tag) => <label key={tag.id} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--atlas-border)] bg-white px-3 py-2 text-xs font-semibold"><input type="checkbox" name="tags" value={tag.id} defaultChecked={selectedTags.includes(tag.id)} className="accent-[var(--atlas-primary)]" />{tag.label}</label>)}</div></fieldset><div className="flex flex-wrap items-center gap-3"><select name="confidence" defaultValue={String(item.confidence)} className="h-10 rounded-lg border border-[var(--atlas-border)] bg-white px-3 text-sm"><option value="high">High</option><option value="medium">Medium</option><option value="limited">Limited</option></select><button className="atlas-secondary-button h-10 px-4 text-sm">Save correction</button></div></form>;
        })}</div>
      </details>;
    }) : null}{schemaReady && !editionRows.length ? <PublicCard><div className="py-10 text-center"><Rss className="mx-auto size-7 text-[var(--atlas-primary)]" /><p className="mt-3 text-sm font-bold">No Signals edition has been published yet.</p></div></PublicCard> : null}</section>
  </PublicPageShell>;
}
