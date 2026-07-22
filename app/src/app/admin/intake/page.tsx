import { AdminNav } from "@/components/atlas/admin-nav";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { FlashBanner } from "@/components/ui/flash-banner";
import { AdminInput, AdminSelect, AdminTextarea, FormField } from "@/components/ui/form-field";
import { PendingButton } from "@/components/ui/pending-button";
import { stageSourceIntake } from "@/lib/actions/atlas-admin";
import { requireAtlasStaff } from "@/lib/atlas/auth";

export default async function AdminIntakePage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  await requireAtlasStaff("editor");
  const params = await searchParams;
  return (
    <PublicPageShell variant="admin" eyebrow="Editorial operations" title="Source and PDF intake" description="Uploads remain private. This form stages extraction work and never publishes claims directly." backHref="/admin" backLabel="Atlas operations">
      <AdminNav />
      {params.success ? <FlashBanner tone="success">Source staged in the review queue.</FlashBanner> : null}
      {params.error ? <FlashBanner tone="error">The source could not be staged. Provide a valid URL or file and try again.</FlashBanner> : null}
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <PublicCard title="Stage source" eyebrow="URL or private document">
          <form action={stageSourceIntake} className="space-y-4">
            <FormField label="Canonical public URL"><AdminInput name="sourceUrl" type="url" placeholder="https://organization.ca/product" /></FormField>
            <FormField label="PDF or document"><AdminInput name="document" type="file" accept="application/pdf,.doc,.docx,.txt" className="h-auto bg-[var(--admin-surface-muted)] py-2 file:mr-3 file:rounded file:border-0 file:bg-[var(--admin-signal-soft)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--admin-action)]" /></FormField>
            <FormField label="Visibility"><AdminSelect name="sourceVisibility" defaultValue="public"><option value="public">Public</option><option value="permissioned">Permissioned</option><option value="internal">Internal</option></AdminSelect></FormField>
            <FormField label="Editor notes"><AdminTextarea name="notes" rows={5} maxLength={2000} placeholder="What should extraction look for?" /></FormField>
            <PendingButton unstyled type="submit" pendingLabel="Staging…" className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--admin-action)] px-4 text-sm font-semibold text-white hover:bg-[var(--admin-action-hover)]">Stage for extraction</PendingButton>
          </form>
        </PublicCard>
        <PublicCard title="What happens next" eyebrow="Review-first pipeline">
          <ol className="space-y-4 text-sm leading-6 text-[var(--admin-muted-strong)]">
            {["The source is stored privately with its visibility classification.", "Extraction creates field-level candidate changes and evidence snippets.", "Duplicate, URL, media-rights, and evidence checks add review notes.", "A reviewer accepts, rejects, edits, merges, or defers each candidate.", "Publication remains a separate explicit promotion step."].map((step, index) => <li key={step} className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--admin-signal-soft)] text-[10px] font-bold text-[var(--admin-action)]">{index + 1}</span><span>{step}</span></li>)}
          </ol>
        </PublicCard>
      </div>
    </PublicPageShell>
  );
}
