import type { Metadata } from "next";
import { Suspense } from "react";
import { AtlasExplorer } from "@/components/atlas/atlas-explorer";
import { AtlasHomeHero } from "@/components/atlas/atlas-home-hero";
import { PublicAtlasHeader } from "@/components/atlas/public-atlas-header";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl } from "@/lib/site";
import { atlasQueryFromSearchParams } from "@/lib/atlas/query-params";
import { ATLAS_EXPLORER_PAGE_SIZE } from "@/lib/atlas/explorer-projection";
import { getAtlasCoverageSummary, getAtlasDiscoverySnapshot, queryAtlasExplorerSnapshot } from "@/lib/atlas/repository";
import { socialMetadata } from "@/lib/seo/social";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "True North Map | Canada’s Defence and Dual-Use Ecosystem Map",
  description:
    "Find Canadian defence and dual-use teams and technology, see where they fit, and inspect the public evidence behind every profile.",
  alternates: { canonical: "/" },
  ...socialMetadata({
    title: "Canada is building more than most people can see.",
    description: "Discover the companies, technologies, and public needs shaping Canada’s defence and dual-use ecosystem.",
    path: "/",
    eyebrow: "Canadian ecosystem map",
    detail: "Follow the evidence, find the fit, and start the right conversation."
  })
};

type PublicAtlasSearchParams = Promise<Record<string, string | string[] | undefined>>;

async function AtlasHomepageData({ searchParams }: { searchParams: PublicAtlasSearchParams }) {
  const rawSearchParams = await searchParams;
  const params = new URLSearchParams();
  Object.entries(rawSearchParams).forEach(([key, value]) => {
    if (typeof value === "string") params.set(key, value);
    if (Array.isArray(value) && value[0]) params.set(key, value[0]);
  });

  const query = atlasQueryFromSearchParams(params);
  const [snapshot, summary] = await Promise.all([
    getAtlasDiscoverySnapshot(),
    getAtlasCoverageSummary()
  ]);
  const result = queryAtlasExplorerSnapshot(snapshot, {
    ...query,
    page: 1,
    pageSize: ATLAS_EXPLORER_PAGE_SIZE
  });

  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: "Published Canadian defence and dual-use organizations", numberOfItems: snapshot.organizations.length, itemListElement: snapshot.organizations.slice(0, 100).map((organization, index) => ({ "@type": "ListItem", position: index + 1, name: organization.name, url: absoluteUrl(`/organizations/${organization.slug}`) })) }} />
      <AtlasExplorer
        initialResult={result}
        initialFilters={query}
        snapshotMetrics={{
          organizations: summary.organizations,
          capabilities: summary.capabilities,
          sources: summary.sources
        }}
        regions={snapshot.regions}
        technicalDomains={snapshot.technicalDomains.map(({ slug, name }) => ({ slug, name }))}
        missionAreas={snapshot.missionAreas.map(({ slug, name }) => ({ slug, name }))}
        demandRequirements={snapshot.demandRequirements.map(({ slug, title }) => ({ slug, title }))}
        generatedAt={snapshot.generatedAt}
      />
    </>
  );
}

function AtlasHomepageFallback() {
  return (
    <div className="atlas-frame pb-8 pt-2" aria-live="polite" aria-busy="true">
      <section className="overflow-hidden rounded-[14px] border border-[var(--atlas-border)] bg-white shadow-[var(--atlas-shadow-soft)]">
        <div className="border-t-2 border-[var(--atlas-signal)] p-4 sm:p-5">
          <div className="h-3 w-28 animate-pulse rounded bg-[var(--atlas-border)]" />
          <div className="mt-3 h-14 animate-pulse rounded-[12px] bg-[var(--atlas-surface-muted)] sm:h-16" />
          <div className="mt-5 grid gap-px overflow-hidden rounded-[10px] border border-[var(--atlas-border)] bg-[var(--atlas-border)] sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-28 animate-pulse bg-white p-4" />
            ))}
          </div>
        </div>
        <div className="h-[350px] animate-pulse border-t border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] sm:h-[410px] lg:h-[510px]" />
      </section>
      <p className="mt-3 text-center text-xs font-semibold text-[var(--atlas-muted)]">Loading the current national map…</p>
    </div>
  );
}

export default function PublicAtlasPage({ searchParams }: { searchParams: PublicAtlasSearchParams }) {
  return (
    <main className="atlas-page min-h-screen bg-[var(--atlas-canvas)] text-[var(--atlas-ink)]">
      <PublicAtlasHeader />
      <AtlasHomeHero />
      <Suspense fallback={<AtlasHomepageFallback />}>
        <AtlasHomepageData searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
