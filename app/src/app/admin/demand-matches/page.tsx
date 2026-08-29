import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { AdminNav } from "@/components/atlas/admin-nav";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { FlashBanner } from "@/components/ui/flash-banner";
import { PendingButton } from "@/components/ui/pending-button";
import { SectionCard } from "@/components/ui/section-card";
import { stageDemandMatchSuggestions } from "@/lib/actions/atlas-admin";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { createClient } from "@/lib/supabase/server";

export default async function DemandMatchWorkspacePage({
  searchParams
}: {
  searchParams: Promise<{ success?: string; error?: string; status?: string }>;
}) {
  await requireAtlasStaff("reviewer");
  const params = await searchParams;
  const supabase = await createClient();
  const [technologies, publicNeeds, pending, published] = await Promise.all([
    supabase.from("capabilities").select("id", { count: "exact", head: true }).eq("publication_status", "published"),
    supabase.from("demand_requirements").select("id", { count: "exact", head: true }).eq("publication_status", "published"),
    supabase.from("candidate_changes").select("id", { count: "exact", head: true }).eq("candidate_kind", "demand_match_bundle").eq("status", "pending"),
    supabase.from("capability_demand_matches").select("id", { count: "exact", head: true }).eq("review_status", "approved").eq("publication_status", "published")
  ]);
  const failedMetric = [technologies, publicNeeds, pending, published].find((result) => result.error);
  if (failedMetric?.error) throw new Error(`Unable to load demand-match metrics: ${failedMetric.error.message}`);

  return (
    <PublicPageShell variant="admin" eyebrow="Private editorial workspace" title="Find technology-to-demand connections" description="Compare reviewed technologies with public needs, then publish only the connections that help users understand who may be worth investigating." backHref="/admin" backLabel="Admin home">
      <AdminNav />
      {params.success ? <FlashBanner tone="success">Staged {params.success} private suggestions. Review each connection before publishing it.</FlashBanner> : null}
      {params.status === "no-new-suggestions" ? <FlashBanner tone="info">No new high-signal suggestions were found. Existing and previously reviewed pairs were excluded.</FlashBanner> : null}
      {params.error ? <FlashBanner tone="error">Suggestions could not be staged. No public data changed.</FlashBanner> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Reviewed technologies" value={technologies.count ?? 0} />
        <Metric label="Public demand statements" value={publicNeeds.count ?? 0} />
        <Metric label="Waiting for review" value={pending.count ?? 0} />
        <Metric label="Published matches" value={published.count ?? 0} />
      </div>

      <PublicCard title="See where a conversation may be worth starting" eyebrow="Private suggestion run" className="mt-5">
        <p className="max-w-3xl text-sm leading-6 text-[var(--admin-muted-strong)]">Compare the published technology record with each public need. The matcher requires shared mission concepts, applies demand-specific safeguards, excludes existing pairs, and stages only the strongest remaining connections. Every suggestion includes an editable explanation of why publishing it may help a user.</p>
        <div className="mt-5 flex flex-col gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--admin-ink)]">{pending.count ?? 0} suggestions waiting in the review queue</p>
            <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">Up to 20 new suggestions are staged per run. Nothing is published automatically.</p>
          </div>
          <form action={stageDemandMatchSuggestions}>
            <PendingButton type="submit" pendingLabel="Comparing…" className="h-11 bg-[var(--admin-action)] px-5 text-sm font-semibold text-white hover:bg-[var(--admin-action-hover)]"><Sparkles className="mr-2 size-4" /> Find potential matches</PendingButton>
          </form>
        </div>
        {(pending.count ?? 0) > 0 ? <Link href="/admin/review" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--admin-action)]">Review potential matches <ArrowRight className="size-3.5" /></Link> : null}
      </PublicCard>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <ProcessStep number="01" title="Compare the records" detail="Use only reviewed technologies and published public needs. Specific demand safeguards remove obvious cross-domain matches." />
        <ProcessStep number="02" title="Review the connection" detail="Open both records, assess the overlap, and edit the pre-filled publication rationale so it reflects the actual decision value." />
        <ProcessStep number="03" title="Publish the interpretation" detail="Publish one connection at a time. The result is labelled moderate-confidence and derived, with the underlying citations preserved." />
      </div>

      <PublicCard title="Publication boundary" eyebrow="A person makes the call" className="mt-5">
        <div className="flex items-start gap-3 text-sm leading-6 text-[var(--admin-muted-strong)]"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[var(--admin-success)]" /><p>Each suggestion links back to the technology profile and the public demand statement. You can defer it, reject it, or publish it with your own rationale. Published connections appear in “Where It Fits” and stay clearly labelled as our interpretation.</p></div>
      </PublicCard>
    </PublicPageShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <SectionCard className="p-5"><strong className="text-2xl text-[var(--admin-ink)]">{value}</strong><p className="mt-2 text-xs font-semibold text-[var(--admin-muted)]">{label}</p></SectionCard>;
}

function ProcessStep({ number, title, detail }: { number: string; title: string; detail: string }) {
  return <SectionCard className="p-5"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--admin-action)]">{number}</p><h2 className="mt-2 text-base font-semibold text-[var(--admin-ink)]">{title}</h2><p className="mt-2 text-xs leading-5 text-[var(--admin-muted-strong)]">{detail}</p></SectionCard>;
}
