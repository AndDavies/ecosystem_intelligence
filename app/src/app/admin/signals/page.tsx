import Link from "next/link";
import { AlertTriangle, ExternalLink, FilePenLine, Rss } from "lucide-react";
import { AdminNav } from "@/components/atlas/admin-nav";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadLocalSignalPreview } from "@/lib/signals/local-preview";

type Row = Record<string, unknown>;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminSignalsPage() {
  await requireAtlasStaff("admin");
  const supabase = createAdminClient();
  const [editionResult, runResult, localPreview] = await Promise.all([
    supabase.from("signal_editions").select("*, signal_items(count)").order("edition_date", { ascending: false }).limit(60),
    supabase.from("signal_runs").select("*").order("started_at", { ascending: false }).limit(8),
    loadLocalSignalPreview()
  ]);
  const editions = (editionResult.data ?? []) as Row[];
  const runs = (runResult.data ?? []) as Row[];
  const drafts: Row[] = [];
  let draftError: unknown = null;
  if (editions.length) {
    for (let from = 0; ; from += 1000) {
      const page = await supabase.from("signal_social_drafts").select("id, edition_id, platform, status").in("edition_id", editions.map((edition) => String(edition.id))).order("id").range(from, from + 999);
      if (page.error) { draftError = page.error; break; }
      drafts.push(...((page.data ?? []) as Row[]));
      if ((page.data?.length ?? 0) < 1000) break;
    }
  }
  const schemaReady = !editionResult.error;
  const operationsReady = !runResult.error && !draftError;

  return <PublicPageShell variant="admin" eyebrow="Automated editorial workspace" title="Canadian Defence Signals" description="Review each published edition, correct its editorial copy, inspect its sources, and copy the associated LinkedIn and X examples. Signal records remain isolated from the core atlas." backHref="/admin" backLabel="Admin home">
    <AdminNav />
    {!schemaReady ? <div className="mb-6 rounded-2xl bg-[var(--admin-warning-soft)] p-5 text-sm leading-6 text-[var(--atlas-ink-soft)]"><p className="font-extrabold text-[var(--atlas-ink)]">Signals data is unavailable.</p><p className="mt-2">No edition has been changed. Check the production database connection before editing.</p>{localPreview ? <Link href={`/signals/${localPreview.slug}`} className="atlas-secondary-button mt-4 inline-flex h-10 px-4 text-xs">Review the local preview <ExternalLink className="ml-2 size-3.5" /></Link> : null}</div> : null}
    {schemaReady && !operationsReady ? <div className="mb-6 rounded-2xl bg-[var(--admin-warning-soft)] p-5 text-sm leading-6"><p className="font-extrabold">Run health or social examples are unavailable.</p><p className="mt-2">Published editions remain editable, but operational details are hidden until the private tables can be read.</p></div> : null}

    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
      <PublicCard eyebrow="Editions" title="Published and archived Signals">
        <div className="space-y-3">
          {editions.map((edition) => {
            const editionId = String(edition.id);
            const editionDrafts = drafts.filter((draft) => String(draft.edition_id) === editionId);
            const platforms = new Set(editionDrafts.map((draft) => String(draft.platform)));
            const socialComplete = platforms.has("linkedin") && platforms.has("x");
            const itemCount = Array.isArray(edition.signal_items) ? Number(edition.signal_items[0]?.count ?? 0) : 0;
            return <article key={editionId} className="rounded-2xl bg-white p-4 shadow-[var(--atlas-shadow-soft)] sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--atlas-muted)]"><span>{String(edition.edition_date)}</span><span aria-hidden="true">·</span><span>{String(edition.publication_status)}</span></div>
                  <h2 className="mt-2 text-lg font-extrabold tracking-[-0.025em] text-[var(--atlas-ink)]">{String(edition.title)}</h2>
                  <p className="mt-2 text-xs text-[var(--atlas-muted)]">{itemCount} article entries · {editionDrafts.length} social examples</p>
                  {!draftError && !socialComplete ? <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--admin-warning)]"><AlertTriangle className="size-3.5" /> Social packaging pending · LinkedIn or X drafts can be completed independently.</p> : null}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link href={`/admin/signals/${editionId}/edit`} className="atlas-primary-button h-11 gap-2 px-4 text-sm"><FilePenLine className="size-4" /> Edit edition</Link>
                  {edition.publication_status === "published" ? <Link href={`/signals/${String(edition.slug)}`} target="_blank" className="atlas-secondary-button h-11 gap-2 px-4 text-sm">Public page <ExternalLink className="size-4" /></Link> : null}
                </div>
              </div>
            </article>;
          })}
          {schemaReady && !editions.length ? <div className="py-10 text-center"><Rss className="mx-auto size-7 text-[var(--atlas-primary)]" /><p className="mt-3 text-sm font-bold">No Signals edition has been published yet.</p></div> : null}
        </div>
      </PublicCard>

      <PublicCard eyebrow="Operations" title="Latest automated scans">
        <div className="space-y-3">{runs.map((run) => {
          const report = run.report && typeof run.report === "object" ? run.report as Row : {};
          const packaging = report.packaging && typeof report.packaging === "object" ? report.packaging as Row : {};
          const verification = report.verification && typeof report.verification === "object" ? report.verification as Row : {};
          return <div key={String(run.id)} className="rounded-xl bg-[var(--atlas-surface-muted)] p-4 text-xs"><div className="flex justify-between gap-4"><span className="min-w-0 truncate font-extrabold">{String(run.run_id)}</span><span className="shrink-0 font-bold text-[var(--atlas-primary)]">{String(run.status)}</span></div><p className="mt-2 text-[var(--atlas-muted)]">Inspected {String(run.inspected_count)} · Selected {String(run.selected_count)} · Source families {String(run.source_family_count)}</p>{packaging.socials === "pending" ? <p className="mt-2 text-[var(--admin-warning)]">Private social drafts pending. Publication is unaffected.</p> : null}{verification.status === "pending" ? <p className="mt-2 text-[var(--admin-warning)]">Database verification pending.</p> : null}</div>;
        })}{!runs.length ? <p className="text-sm text-[var(--atlas-muted)]">No daily scan has been recorded yet.</p> : null}</div>
      </PublicCard>
    </div>
  </PublicPageShell>;
}
