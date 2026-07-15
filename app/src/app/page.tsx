import type { Metadata } from "next";
import { AtlasExplorer } from "@/components/atlas/atlas-explorer";
import { PublicAtlasHeader } from "@/components/atlas/public-atlas-header";
import { atlasQueryFromSearchParams } from "@/lib/atlas/query-params";
import { getAtlasSnapshot, queryAtlas } from "@/lib/atlas/repository";

export const metadata: Metadata = {
  title: "Canadian Defence & Dual-Use Ecosystem Atlas",
  description:
    "Explore verified Canadian defence and dual-use organizations, capabilities, regions, public evidence, and reviewed mission alignment."
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
  const [snapshot, result] = await Promise.all([getAtlasSnapshot(), queryAtlas(query)]);

  return (
    <main className="atlas-page min-h-screen bg-[#f7f9fc] text-[#101828]">
      <PublicAtlasHeader />
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
