import { AdminNav } from "@/components/atlas/admin-nav";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { PendingButton } from "@/components/ui/pending-button";
import { stageSourceIntake } from "@/lib/actions/atlas-admin";
import { requireAtlasStaff } from "@/lib/atlas/auth";

export default async function AdminIntakePage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  await requireAtlasStaff("editor");
  const params = await searchParams;
  return (
    <PublicPageShell variant="admin" eyebrow="Editorial operations" title="Source and PDF intake" description="Uploads remain private. This form stages extraction work and never publishes claims directly." backHref="/admin" backLabel="Atlas operations">
      <AdminNav />
      {params.success ? <div className="mb-5 rounded-md border border-[#abefc6] bg-[#ecfdf3] px-3 py-2 text-sm text-[#067647]">Source staged in the review queue.</div> : null}
      {params.error ? <div className="mb-5 rounded-md border border-[#fda29b] bg-[#fff6f5] px-3 py-2 text-sm text-[#b42318]">The source could not be staged. Provide a valid URL or file and try again.</div> : null}
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <PublicCard title="Stage source" eyebrow="URL or private document">
          <form action={stageSourceIntake} className="space-y-4">
            <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">Canonical public URL<input name="sourceUrl" type="url" placeholder="https://organization.ca/product" className="h-10 rounded-md border border-[#d0d5dd] px-3 text-sm font-normal outline-none focus:border-[#0756d9] focus:ring-4 focus:ring-[#0756d9]/10" /></label>
            <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">PDF or document<input name="document" type="file" accept="application/pdf,.doc,.docx,.txt" className="rounded-md border border-[#d0d5dd] bg-[#f8fafc] px-3 py-2 text-sm font-normal file:mr-3 file:rounded file:border-0 file:bg-[#eaf2ff] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#0756d9]" /></label>
            <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">Visibility<select name="sourceVisibility" defaultValue="public" className="h-10 rounded-md border border-[#d0d5dd] bg-white px-3 text-sm font-normal"><option value="public">Public</option><option value="permissioned">Permissioned</option><option value="internal">Internal</option></select></label>
            <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">Editor notes<textarea name="notes" rows={5} maxLength={2000} placeholder="What should extraction look for?" className="rounded-md border border-[#d0d5dd] px-3 py-2 text-sm font-normal outline-none focus:border-[#0756d9] focus:ring-4 focus:ring-[#0756d9]/10" /></label>
            <PendingButton unstyled type="submit" pendingLabel="Staging…" className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#0756d9] px-4 text-sm font-semibold text-white hover:bg-[#0649b9]">Stage for extraction</PendingButton>
          </form>
        </PublicCard>
        <PublicCard title="What happens next" eyebrow="Review-first pipeline">
          <ol className="space-y-4 text-sm leading-6 text-[#475467]">
            {["The source is stored privately with its visibility classification.", "Extraction creates field-level candidate changes and evidence snippets.", "Duplicate, URL, media-rights, and evidence checks add review notes.", "A reviewer accepts, rejects, edits, merges, or defers each candidate.", "Publication remains a separate explicit promotion step."].map((step, index) => <li key={step} className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#eaf2ff] text-[10px] font-bold text-[#0756d9]">{index + 1}</span><span>{step}</span></li>)}
          </ol>
        </PublicCard>
      </div>
    </PublicPageShell>
  );
}
