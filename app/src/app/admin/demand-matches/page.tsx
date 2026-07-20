import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { AdminNav } from "@/components/atlas/admin-nav";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { PendingButton } from "@/components/ui/pending-button";
import { stageDemandMatchSuggestions } from "@/lib/actions/atlas-admin";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { getAtlasSnapshot } from "@/lib/atlas/repository";
import { createClient } from "@/lib/supabase/server";

export default async function DemandMatchWorkspacePage({
  searchParams
}: {
  searchParams: Promise<{ success?: string; error?: string; status?: string }>;
}) {
  await requireAtlasStaff("reviewer");
  const params = await searchParams;
  const supabase = await createClient();
  const [snapshot, pending, published] = await Promise.all([
    getAtlasSnapshot(),
    supabase.from("candidate_changes").select("id", { count: "exact", head: true }).eq("candidate_kind", "demand_match_bundle").eq("status", "pending"),
    supabase.from("capability_demand_matches").select("id", { count: "exact", head: true }).eq("review_status", "approved").eq("publication_status", "published")
  ]);
  const technologyCount = snapshot.organizations.reduce((count, organization) => count + organization.capabilities.length, 0);

  return (
    <PublicPageShell variant="admin" eyebrow="Private editorial workspace" title="Find potential demand matches" description="Surface plausible connections between reviewed technologies and public demand statements, then decide which ones are useful enough to publish." backHref="/admin" backLabel="Admin home">
      <AdminNav />
      {params.success ? <div className="mb-5 rounded-md border border-[#a6f4c5] bg-[#f6fef9] px-3 py-2 text-sm text-[#067647]">Staged {params.success} private suggestions. Review each connection before publishing it.</div> : null}
      {params.status === "no-new-suggestions" ? <div className="mb-5 rounded-md border border-[#b2ccff] bg-[#f5f8ff] px-3 py-2 text-sm text-[#1849a9]">No new high-signal suggestions were found. Existing and previously reviewed pairs were excluded.</div> : null}
      {params.error ? <div className="mb-5 rounded-md border border-[#fda29b] bg-[#fff6f5] px-3 py-2 text-sm text-[#b42318]">Suggestions could not be staged. No public data changed.</div> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Reviewed technologies" value={technologyCount} />
        <Metric label="Public demand statements" value={snapshot.demandRequirements.length} />
        <Metric label="Published matches" value={published.count ?? 0} />
      </div>

      <PublicCard title="See where a conversation may be worth starting" eyebrow="Private suggestion run" className="mt-5">
        <p className="max-w-3xl text-sm leading-6 text-[#475467]">The comparison looks for concrete mission concepts shared by a reviewed technology profile and a public problem statement. It excludes existing pairs and only stages stronger overlaps. The output is a research prompt, not a public claim.</p>
        <div className="mt-5 flex flex-col gap-3 rounded-lg border border-[#d0d5dd] bg-[#f8fafc] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#101828]">{pending.count ?? 0} suggestions waiting in the review queue</p>
            <p className="mt-1 text-xs leading-5 text-[#667085]">Up to 20 new candidates are staged per run. Nothing is published automatically.</p>
          </div>
          <form action={stageDemandMatchSuggestions}>
            <PendingButton type="submit" pendingLabel="Comparing…" className="h-11 bg-[#0756d9] px-5 text-sm font-semibold text-white hover:bg-[#0649b8]"><Sparkles className="mr-2 size-4" /> Find potential matches</PendingButton>
          </form>
        </div>
        {(pending.count ?? 0) > 0 ? <Link href="/admin/review" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0756d9]">Review potential matches <ArrowRight className="size-3.5" /></Link> : null}
      </PublicCard>

      <PublicCard title="Publication boundary" eyebrow="A person makes the call" className="mt-5">
        <div className="flex items-start gap-3 text-sm leading-6 text-[#475467]"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#067647]" /><p>Each suggestion links back to the technology profile and the public demand statement. You can defer it, reject it, or publish it with your own rationale. Published connections appear in “Where It Fits” and stay clearly labelled as our interpretation.</p></div>
      </PublicCard>
    </PublicPageShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-[#d0d5dd] bg-white p-5"><strong className="text-2xl text-[#101828]">{value}</strong><p className="mt-2 text-xs font-semibold text-[#667085]">{label}</p></div>;
}
