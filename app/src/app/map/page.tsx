import type { Metadata } from "next";
import { Suspense } from "react";
import { AtlasExplorer } from "@/components/atlas/atlas-explorer";
import { PublicAtlasHeader } from "@/components/atlas/public-atlas-header";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl } from "@/lib/site";
import { atlasQueryFromSearchParams } from "@/lib/atlas/query-params";
import { guidedSearchExampleFromSearchParams } from "@/lib/atlas/guided-search";
import { ATLAS_EXPLORER_PAGE_SIZE } from "@/lib/atlas/explorer-projection";
import { getAtlasDiscoverySnapshot, queryAtlasExplorerSnapshot } from "@/lib/atlas/repository";
import { socialMetadata } from "@/lib/seo/social";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Find Canadian Defence and Dual-Use Capability",
  description: "Search Canadian organizations and technologies, compare possible fit, inspect the public record, and build a Working List for the next conversation.",
  alternates: { canonical: "/map" },
  ...socialMetadata({
    title: "Find Canadian defence and dual-use capability",
    description: "Start with a real question, find who may help, and inspect the facts, assessment, sources and limits behind every result.",
    path: "/map",
    eyebrow: "True North Map atlas",
    detail: "See who can help, understand why they matter, and carry the strongest candidates into your next conversation."
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
  const snapshot = await getAtlasDiscoverySnapshot();
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
    <div className="atlas-frame pb-8 pt-3 sm:pt-4" aria-live="polite" aria-busy="true">
      <section className="overflow-hidden border border-[var(--atlas-border)] bg-white shadow-[var(--atlas-shadow-soft)]">
        <div className="border-t-2 border-[var(--atlas-signal)] p-3 sm:p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="h-3 w-36 animate-pulse rounded bg-[var(--atlas-border)]" />
              <div className="mt-2 h-3 w-64 max-w-[70vw] animate-pulse rounded bg-[var(--atlas-surface-muted)]" />
            </div>
            <div className="hidden h-10 w-28 animate-pulse rounded-[12px] bg-[var(--atlas-surface-muted)] sm:block" />
          </div>
          <div className="mt-3 h-14 animate-pulse rounded-[12px] bg-[var(--atlas-surface-muted)]" />
          <div className="mt-3 flex gap-2">
            <div className="h-9 w-24 animate-pulse rounded-full bg-[var(--atlas-surface-muted)]" />
            <div className="h-9 w-20 animate-pulse rounded-full bg-[var(--atlas-surface-muted)]" />
            <div className="h-9 w-28 animate-pulse rounded-full bg-[var(--atlas-surface-muted)]" />
          </div>
        </div>
        <div className="grid min-h-[560px] animate-pulse border-t border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] lg:h-[max(560px,calc(100dvh-250px))] lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-3 lg:p-3">
          <div className="bg-[var(--atlas-border)]/45 lg:rounded-[14px]" />
          <div className="hidden bg-[var(--atlas-ink)] lg:block lg:rounded-[14px]" />
        </div>
      </section>
      <p className="mt-3 text-center text-xs font-semibold text-[var(--atlas-muted)]">Loading the current national map…</p>
    </div>
  );
}

export default function MapPage({ searchParams }: { searchParams: MapSearchParams }) {
  return (
    <main className="atlas-page min-h-screen bg-[var(--atlas-canvas)] text-[var(--atlas-ink)]">
      <PublicAtlasHeader />
      <Suspense fallback={<MapFallback />}>
        <AtlasMapData searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
