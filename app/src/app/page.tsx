import type { Metadata } from "next";
import { AtlasExplorer } from "@/components/atlas/atlas-explorer";
import { PublicAtlasHeader } from "@/components/atlas/public-atlas-header";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl } from "@/lib/site";
import { atlasQueryFromSearchParams } from "@/lib/atlas/query-params";
import { ATLAS_EXPLORER_PAGE_SIZE } from "@/lib/atlas/explorer-projection";
import { getAtlasSnapshot, queryAtlasExplorer } from "@/lib/atlas/repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "True North Map | Canada’s Defence and Dual-Use Ecosystem Map",
  description:
    "Find Canadian defence and dual-use teams and technology, see where they fit, and inspect the public evidence behind every profile."
};

export default async function PublicAtlasPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawSearchParams = await searchParams;
  const params = new URLSearchParams();
  Object.entries(rawSearchParams).forEach(([key, value]) => {
    if (typeof value === "string") params.set(key, value);
    if (Array.isArray(value) && value[0]) params.set(key, value[0]);
  });

  const query = atlasQueryFromSearchParams(params);
  const [snapshot, result] = await Promise.all([
    getAtlasSnapshot(),
    queryAtlasExplorer({ ...query, page: 1, pageSize: ATLAS_EXPLORER_PAGE_SIZE })
  ]);

  return (
    <main className="atlas-page min-h-screen bg-[#eef7f8] text-[#101828]">
      <PublicAtlasHeader />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: "Published Canadian defence and dual-use organizations", numberOfItems: snapshot.organizations.length, itemListElement: snapshot.organizations.slice(0, 100).map((organization, index) => ({ "@type": "ListItem", position: index + 1, name: organization.name, url: absoluteUrl(`/organizations/${organization.slug}`) })) }} />
      <AtlasExplorer
        initialResult={result}
        initialFilters={query}
        snapshotMetrics={{
          organizations: snapshot.organizations.length,
          capabilities: new Set(snapshot.organizations.flatMap((organization) => organization.capabilities.map((capability) => capability.id))).size,
          sources: new Set(snapshot.organizations.flatMap((organization) => [
            ...organization.citations,
            ...organization.capabilities.flatMap((capability) => [
              ...capability.citations,
              ...capability.missionMatches.flatMap((match) => match.citations),
              ...capability.demandMatches.flatMap((match) => match.citations)
            ])
          ]).map((citation) => citation.sourceUrl)).size
        }}
        regions={snapshot.regions}
        technicalDomains={snapshot.technicalDomains}
        missionAreas={snapshot.missionAreas}
        demandRequirements={snapshot.demandRequirements}
        generatedAt={snapshot.generatedAt}
      />
    </main>
  );
}
