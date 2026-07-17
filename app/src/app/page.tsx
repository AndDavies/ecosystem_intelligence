import type { Metadata } from "next";
import { AtlasExplorer } from "@/components/atlas/atlas-explorer";
import { PublicAtlasHeader } from "@/components/atlas/public-atlas-header";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl } from "@/lib/site";
import { atlasQueryFromSearchParams } from "@/lib/atlas/query-params";
import { getAtlasSnapshot, queryAtlas } from "@/lib/atlas/repository";

export const metadata: Metadata = {
  title: "Canadian Public Beta",
  description:
    "Explore reviewed Canadian defence and dual-use organizations, capabilities, regions, public sources, and clearly labelled analyst assessments."
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
    queryAtlas({ ...query, page: 1, pageSize: 1000 })
  ]);

  return (
    <main className="atlas-page min-h-screen bg-[#eef7f8] text-[#101828]">
      <PublicAtlasHeader />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: "Published Canadian defence and dual-use organizations", numberOfItems: snapshot.organizations.length, itemListElement: snapshot.organizations.slice(0, 100).map((organization, index) => ({ "@type": "ListItem", position: index + 1, name: organization.name, url: absoluteUrl(`/organizations/${organization.slug}`) })) }} />
      <AtlasExplorer
        initialResult={result}
        initialFilters={query}
        regions={snapshot.regions}
        technicalDomains={snapshot.technicalDomains}
        missionAreas={snapshot.missionAreas}
        demandRequirements={snapshot.demandRequirements}
        generatedAt={snapshot.generatedAt}
      />
    </main>
  );
}
