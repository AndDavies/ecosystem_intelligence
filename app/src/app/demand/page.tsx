import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleDashed, FileText, ShieldAlert } from "lucide-react";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { getAtlasSnapshot } from "@/lib/atlas/repository";
import { toTitleCase } from "@/lib/utils";

// Publication invalidates the shared atlas data cache, but this index must also
// render per request so a previously generated route cannot hide a new signal.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Public Demand Signals",
  description: "Review public Canadian, allied, and NATO demand statements, mapped capabilities, evidence, and explicit coverage gaps."
};

export default async function DemandIndexPage() {
  const snapshot = await getAtlasSnapshot();
  const totalMatches = snapshot.demandRequirements.reduce((sum, demand) => sum + demand.matches.length, 0);
  const demandSourceCount = new Set(snapshot.demandRequirements.map((demand) => demand.source.id)).size;

  return (
    <PublicPageShell
      eyebrow="Early workflow preview"
      title="Public demand overlay"
      description="This emerging workflow separates public problem statements from procurement opportunities. Capability matches appear only after an analyst assesses the published evidence."
    >
      {totalMatches === 0 ? (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[var(--atlas-primary-border)] bg-[var(--atlas-primary-soft)] px-4 py-4 text-sm leading-6 text-[var(--atlas-primary)]">
          <CircleDashed className="mt-0.5 size-5 shrink-0" />
          <div><p className="font-semibold">Published demand is live; capability matching remains an early workflow.</p><p className="mt-1 text-xs leading-5">{demandSourceCount} public {demandSourceCount === 1 ? "source is" : "sources are"} represented through {snapshot.demandRequirements.length} reviewed problem {snapshot.demandRequirements.length === 1 ? "statement" : "statements"}. No organization matches have been assessed yet.</p></div>
        </div>
      ) : null}
      <div className="mb-5 flex items-start gap-3 rounded-lg border border-[var(--atlas-amber)] bg-[var(--atlas-amber-soft)] px-4 py-3 text-xs leading-5 text-[var(--atlas-amber)]">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" />
        <p>Demand records and future mappings are based on published sources. They are not procurement eligibility, endorsement, customer interest, classified demand, or a formal opportunity.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {snapshot.demandRequirements.map((demand) => (
          <PublicCard key={demand.id} className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-4">
              <span className="flex size-10 items-center justify-center rounded-md bg-[var(--atlas-primary-soft)] text-[var(--atlas-primary)]"><FileText className="size-5" /></span>
              <span className="rounded bg-[var(--atlas-violet-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--atlas-violet)] ring-1 ring-[var(--atlas-primary-border)]">Demand signal</span>
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--atlas-muted)]">{demand.source.publisher} · {demand.source.sourceKind ? toTitleCase(demand.source.sourceKind) : "Public problem statement"}</p>
            <h2 className="mt-1 text-lg font-bold tracking-[-0.02em] text-[var(--atlas-ink)]">{demand.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--atlas-muted)]">{demand.problemStatement}</p>
            <div className="mt-auto pt-5">
              <div className="mb-3 flex items-center justify-between gap-3 text-[10px] font-semibold text-[var(--atlas-muted)]"><span>{demand.matches.length} capability assessments</span><span>{demand.source.commitmentLevel ? toTitleCase(demand.source.commitmentLevel) : "Commitment under review"}</span></div>
              <Link href={`/demand/${demand.slug}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--atlas-primary)] no-underline hover:underline">Open demand signal <ArrowRight className="size-3.5" /></Link>
            </div>
          </PublicCard>
        ))}
      </div>
    </PublicPageShell>
  );
}
