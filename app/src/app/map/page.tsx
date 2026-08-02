import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, FileSearch2, Radar, ScanSearch } from "lucide-react";
import { AtlasExplorer } from "@/components/atlas/atlas-explorer";
import { PublicAtlasHeader } from "@/components/atlas/public-atlas-header";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl } from "@/lib/site";
import { atlasQueryFromSearchParams } from "@/lib/atlas/query-params";
import { guidedSearchExampleFromSearchParams } from "@/lib/atlas/guided-search";
import { ATLAS_EXPLORER_PAGE_SIZE } from "@/lib/atlas/explorer-projection";
import { getAtlasCoverageSummary, getAtlasDiscoverySnapshot, queryAtlasExplorerSnapshot } from "@/lib/atlas/repository";
import { socialMetadata } from "@/lib/seo/social";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Map Canada’s Defence and Dual-Use Ecosystem",
  description: "Search reviewed Canadian organizations and technologies, inspect public evidence, and build a Working List for the next conversation.",
  alternates: { canonical: "/map" },
  ...socialMetadata({
    title: "Map Canada’s defence and dual-use ecosystem",
    description: "Find Canadian capability, follow public needs, and inspect the evidence behind every result.",
    path: "/map",
    eyebrow: "True North Map atlas",
    detail: "Search, compare, and carry the right organizations into your next conversation."
  })
};

type MapSearchParams = Promise<Record<string, string | string[] | undefined>>;

async function AtlasMapData({ searchParams }: { searchParams: MapSearchParams }) {
  const rawSearchParams = await searchParams;
  const params = new URLSearchParams();
  Object.entries(rawSearchParams).forEach(([key, value]) => {
    if (typeof value === "string") params.set(key, value);
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
  });

  const guidedSearch = guidedSearchExampleFromSearchParams(params);
  const focusNeed = params.get("start") === "need";
  if (guidedSearch) {
    params.delete("example");
    params.delete("focus");
    params.set("focus", guidedSearch.focus.join(","));
  }
  params.delete("start");

  const query = atlasQueryFromSearchParams(params);
  const [snapshot, summary] = await Promise.all([getAtlasDiscoverySnapshot(), getAtlasCoverageSummary()]);
  const result = queryAtlasExplorerSnapshot(snapshot, { ...query, page: 1, pageSize: ATLAS_EXPLORER_PAGE_SIZE });

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Published Canadian defence and dual-use organizations",
        numberOfItems: snapshot.organizations.length,
        itemListElement: snapshot.organizations.slice(0, 100).map((organization, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: organization.name,
          url: absoluteUrl(`/organizations/${organization.slug}`)
        }))
      }} />
      <AtlasExplorer
        initialResult={result}
        initialFilters={query}
        snapshotMetrics={{ organizations: summary.organizations, capabilities: summary.capabilities, sources: summary.sources }}
        regions={snapshot.regions}
        technicalDomains={snapshot.technicalDomains.map(({ slug, name }) => ({ slug, name }))}
        missionAreas={snapshot.missionAreas.map(({ slug, name }) => ({ slug, name }))}
        demandRequirements={snapshot.demandRequirements.map(({ slug, title }) => ({ slug, title }))}
        generatedAt={snapshot.generatedAt}
        canonicalizeExample={Boolean(guidedSearch)}
        focusNeedOnMount={focusNeed}
      />
    </>
  );
}

function MapFallback() {
  return (
    <div className="atlas-frame pb-8 pt-5" aria-live="polite" aria-busy="true">
      <section className="overflow-hidden rounded-[14px] border border-[var(--atlas-border)] bg-white shadow-[var(--atlas-shadow-soft)]">
        <div className="border-t-2 border-[var(--atlas-signal)] p-4 sm:p-5">
          <div className="h-3 w-28 animate-pulse rounded bg-[var(--atlas-border)]" />
          <div className="mt-3 h-14 animate-pulse rounded-[12px] bg-[var(--atlas-surface-muted)] sm:h-16" />
        </div>
        <div className="h-[420px] animate-pulse border-t border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)]" />
      </section>
      <p className="mt-3 text-center text-xs font-semibold text-[var(--atlas-muted)]">Loading the current national map…</p>
    </div>
  );
}

export default function MapPage({ searchParams }: { searchParams: MapSearchParams }) {
  return (
    <main className="atlas-page min-h-screen bg-[var(--atlas-canvas)] text-[var(--atlas-ink)]">
      <PublicAtlasHeader />
      <section className="border-b border-[var(--atlas-border)] bg-white" aria-labelledby="map-heading">
        <div className="atlas-frame py-8 sm:py-10">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)] lg:items-end">
            <div>
              <p className="atlas-eyebrow">Map the Canadian ecosystem</p>
              <h1 id="map-heading" className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-5xl"><span className="atlas-headline-highlight">Start with a need.</span> Follow the evidence.</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--atlas-muted)]">Describe what you are trying to build, source or understand. Search every published organization and technology, inspect what supports each possible fit, then save the strongest candidates to a Working List.</p>
            </div>
            <div className="lg:pb-1">
              <div className="flex flex-wrap gap-3">
                <Link href="/map?start=need#ask-true-north" className="atlas-signal-button min-h-12 gap-2 rounded-full px-5 text-sm">Describe a need <ArrowRight className="size-4" /></Link>
                <Link href="/how-it-works" className="atlas-secondary-button min-h-12 gap-2 rounded-full px-5 text-sm">How it works <ArrowRight className="size-4" /></Link>
              </div>
              <div className="mt-5 flex flex-wrap gap-2" aria-label="Ways to begin">
                <Link href="/map?example=modular-naval" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--atlas-surface-muted)] px-4 text-sm font-bold text-[var(--atlas-ink)] no-underline hover:bg-[var(--atlas-signal-soft)]"><ScanSearch className="size-4 text-[var(--atlas-evidence)]" aria-hidden="true" />Try a guided example</Link>
                <Link href="/demand" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--atlas-surface-muted)] px-4 text-sm font-bold text-[var(--atlas-ink)] no-underline hover:bg-[var(--atlas-signal-soft)]"><FileSearch2 className="size-4 text-[var(--atlas-evidence)]" aria-hidden="true" />Follow a public need</Link>
                <Link href="/missions" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--atlas-surface-muted)] px-4 text-sm font-bold text-[var(--atlas-ink)] no-underline hover:bg-[var(--atlas-signal-soft)]"><Radar className="size-4 text-[var(--atlas-evidence)]" aria-hidden="true" />Explore a mission</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Suspense fallback={<MapFallback />}>
        <AtlasMapData searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
