import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CircleDashed } from "lucide-react";
import { TopicIcon } from "@/components/atlas/topic-icon";
import { CollectionContinuation, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { PaginationNav } from "@/components/ui/pagination-nav";
import { getAtlasDemandIndex } from "@/lib/atlas/repository";
import { normalizedPage, paginate } from "@/lib/pagination";
import { toTitleCase } from "@/lib/utils";
import { socialMetadata } from "@/lib/seo/social";

// Publication invalidates the shared atlas data cache, but this index must also
// render per request so a previously generated route cannot hide a new signal.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Defence needs",
  description: "Start with a released Canadian or allied need, then inspect the Canadian technologies that may be relevant and the limits of that assessment.",
  alternates: { canonical: "/demand" },
  ...socialMetadata({ title: "Defence needs", description: "See released defence needs, then explore reviewed Canadian technologies that may help.", path: "/demand", eyebrow: "Start with the problem" })
};

type DemandSearchParams = Promise<{ page?: string }>;

export default function DemandIndexPage({ searchParams }: { searchParams: DemandSearchParams }) {
  return (
    <PublicPageShell
      variant="collection"
      eyebrow="Released Defence needs"
      title="What defence need was released?"
      description="Read released government and allied needs, then inspect the Canadian technologies that may be relevant."
      actions={<Link href="/map?start=need#ask-true-north" className="atlas-primary-button min-h-11 gap-2 px-5 text-sm">Explore the map <ArrowRight className="size-4" aria-hidden="true" /></Link>}
    >
      <Suspense fallback={<DemandDirectoryFallback />}>
        <DemandDirectoryData searchParams={searchParams} />
      </Suspense>
      <CollectionContinuation
        title="Explore related Canadian capability."
        description="Move from a released defence need into the technologies, organizations and evidence that may be relevant."
        links={[{ label: "Explore the map", href: "/map" }, { label: "Browse organizations", href: "/organizations" }]}
      />
    </PublicPageShell>
  );
}

async function DemandDirectoryData({ searchParams }: { searchParams: DemandSearchParams }) {
  const [snapshot, params] = await Promise.all([getAtlasDemandIndex(), searchParams]);
  const directory = paginate(snapshot.demands, normalizedPage(params.page), 12);

  return (
    <>
      {snapshot.matchCount === 0 ? (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[var(--atlas-primary-border)] bg-[var(--atlas-primary-soft)] px-4 py-4 text-sm leading-6 text-[var(--atlas-primary)]">
          <CircleDashed className="mt-0.5 size-5 shrink-0" />
          <div><p className="font-semibold">The public problems are visible; reviewed technology matches are still being built.</p><p className="mt-1 text-xs leading-5">{snapshot.sourceCount} public {snapshot.sourceCount === 1 ? "source is" : "sources are"} represented through {snapshot.demands.length} reviewed problem {snapshot.demands.length === 1 ? "statement" : "statements"}. No organization matches have been published yet.</p></div>
        </div>
      ) : null}
      <div className="atlas-demand-grid grid gap-x-6 gap-y-4 lg:grid-cols-2">
        {directory.items.map((demand) => (
          <PublicCard key={demand.id} className="group relative flex h-full flex-col transition-colors" contentClassName="flex h-full flex-col">
            <div className="flex items-start justify-between gap-4">
              <TopicIcon title={demand.title} />
              <span className="rounded bg-[var(--atlas-evidence-soft)] px-2 py-1 text-xs font-semibold text-[var(--atlas-evidence)] ring-1 ring-[var(--atlas-primary-border)]">Demand signal</span>
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.1em] text-[var(--atlas-muted)]">{demand.source.publisher} · {demand.source.sourceKind ? toTitleCase(demand.source.sourceKind) : "Public problem statement"}</p>
            <h2 className="mt-1 text-lg font-bold tracking-[-0.02em] text-[var(--atlas-ink)]">{demand.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--atlas-muted)]">{demand.problemStatement}</p>
            <div className="mt-auto pt-5">
              <div className="mb-3 flex items-center justify-between gap-3 text-xs font-semibold text-[var(--atlas-muted)]"><span>{demand.matchCount ? `${demand.matchCount} reviewed technology ${demand.matchCount === 1 ? "connection" : "connections"}` : "No reviewed connection yet"}</span><span>{demand.source.commitmentLevel ? toTitleCase(demand.source.commitmentLevel) : "Commitment not stated"}</span></div>
              <Link href={`/demand/${demand.slug}`} data-internal-link-role="contextual" data-internal-link-module="public_need_collection" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[var(--atlas-primary)] no-underline after:absolute after:inset-0 after:rounded-none after:content-[''] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-evidence)]">Review the defence need <ArrowRight className="size-3.5" /></Link>
            </div>
          </PublicCard>
        ))}
      </div>
      <PaginationNav path="/demand" page={directory.page} totalPages={directory.totalPages} start={directory.start} end={directory.end} total={directory.total} itemLabel="defence needs" />
    </>
  );
}

function DemandDirectoryFallback() {
  return (
    <div aria-live="polite" aria-busy="true">
      <p className="sr-only">Loading published Defence needs…</p>
      <div aria-hidden="true" className="grid animate-pulse gap-4 lg:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-64 border border-[var(--atlas-border)] bg-white" />
        ))}
      </div>
      <p className="mt-3 text-center text-xs font-semibold text-[var(--atlas-muted)]">Loading published Defence needs…</p>
    </div>
  );
}
