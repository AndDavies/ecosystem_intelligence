import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFile(path.resolve(file), "utf8");

describe("guided public landing", () => {
  it("splits the cacheable landing from the atlas workspace", async () => {
    const [landing, map, header, middleware] = await Promise.all([
      read("src/app/page.tsx"), read("src/app/map/page.tsx"), read("src/components/atlas/public-atlas-header.tsx"), read("src/middleware.ts")
    ]);
    expect(landing).toContain("export const revalidate = 300");
    expect(landing).not.toContain("searchParams");
    expect(map).toContain('export const dynamic = "force-dynamic"');
    expect(header).toContain('{ href: "/map", label: "Map"');
    expect(header).toContain('<Link href="/"');
    expect(header).toContain("font-[family-name:var(--font-inter)]");
    expect(middleware).toContain("legacyAtlasParameters");
    expect(middleware).toContain('destination.pathname = "/map"');
    expect(middleware).toContain('"/account/:path*"');
    expect(middleware).not.toContain('"/((?!_next/static');
  });

  it("uses a quota-free deterministic guided example and canonicalizes it", async () => {
    const [landing, focus, map, explorer] = await Promise.all([read("src/app/page.tsx"), read("src/components/atlas/guided-search-focus.tsx"), read("src/app/map/page.tsx"), read("src/components/atlas/atlas-explorer.tsx")]);
    expect(landing).toContain("GuidedSearchFocus");
    expect(focus).toContain("guidedSearchHref(selected)");
    expect(focus).toContain("aria-pressed={isSelected}");
    expect(focus).toContain("Select at least one search focus to continue.");
    expect(map).toContain("guidedSearchExampleFromSearchParams");
    expect(map).toContain('params.delete("example")');
    expect(map).not.toContain("/api/discover");
    expect(explorer).toContain("canonicalizeExample");
    expect(explorer).toContain('`/map?${params.toString()}`');
    expect(landing).toContain('"Build a Working List"');
    expect(focus).toContain("A private, evidence-backed Working List");
    expect(focus).toContain("Open this guided search");
  });

  it("uses editor-selected published specimens and bounded landing analytics", async () => {
    const [landingData, analytics] = await Promise.all([read("src/app/api/landing/route.ts"), read("src/components/atlas/public-beta-insights.tsx")]);
    expect(landingData).toContain('getAtlasOrganizationBySlug("kraken-robotics")');
    expect(landingData).toContain('getAtlasCapabilityBySlug("kraken-katfish-sas")');
    expect(landingData).toContain("publishedCapabilityGap");
    expect(landingData).not.toContain("capabilityRecord.capability.novelty");
    expect(landingData).toContain('"autonomous-patrol-and-monitoring"');
    expect(landingData).toContain('"underwater-isr"');
    expect(landingData).toContain("getPublishedSignals(3)");
    expect(analytics).toContain('"tnm_landing_entry"');
    expect(analytics).toContain("landingEntryPaths");
  });

  it("uses governed public evidence language and outcome-led landing copy", async () => {
    const [landing, focus, preview, legend, presentation] = await Promise.all([
      read("src/app/page.tsx"),
      read("src/components/atlas/guided-search-focus.tsx"),
      read("src/components/atlas/guided-landing-dynamic.tsx"),
      read("src/components/atlas/evidence-legend.tsx"),
      read("src/lib/atlas/presentation.ts")
    ]);
    expect(landing).toContain("Describe a need");
    expect(landing).toContain("Turn an uncertain requirement into a defensible shortlist.");
    expect(preview).toContain("See where capability is and why it may matter.");
    expect(preview).toContain("publicLanguage.sourceFact");
    expect(preview).toContain("publicLanguage.coverageGap");
    expect(legend).toContain("publicLanguage.sourceFact");
    expect(legend).not.toContain('label: "Public-source fact"');
    expect(presentation).toContain('sourceFact: "Source-backed fact"');
    expect([landing, focus, preview, legend, presentation].join("\n")).not.toContain("Public-source fact");
    expect([landing, focus, preview, legend, presentation].join("\n")).not.toContain("Interpreted concepts");
  });

  it("keeps the hero bounded with the approved production-aligned image treatment", async () => {
    const [landing, dynamicLanding] = await Promise.all([
      read("src/app/page.tsx"),
      read("src/components/atlas/guided-landing-dynamic.tsx")
    ]);
    expect(landing).toContain('<span className="atlas-headline-highlight">Canada is building</span>');
    expect(landing).toContain("xl:h-[480px]");
    expect(landing).toContain("xl:grid-cols-[600px_minmax(0,1fr)]");
    expect(landing).toContain('className="object-cover object-[56%_52%]"');
    expect(landing).toContain("Make Canadian capability visible.");
    expect(landing).toContain("Evidence-led discovery across the country.");
    expect(landing).toContain("Find Canadian organizations and capabilities relevant to a mission, project or released public need.");
    expect(landing).toContain("Public sources cited");
    expect(landing).toContain("Facts and assessments kept separate");
    expect(landing).toContain("<LandingCoverageOverlay />");
    expect(landing).not.toContain("<LandingCoverage />");
    expect(dynamicLanding).toContain('aria-label="Current published coverage"');
    expect(dynamicLanding).not.toContain("Updated as reviewed records are published.");
    expect(landing).not.toContain("build a Working List for the conversations worth pursuing next");
  });

  it("puts the live atlas workspace ahead of explanatory content", async () => {
    const [map, explorer, results, atlasMap] = await Promise.all([
      read("src/app/map/page.tsx"),
      read("src/components/atlas/atlas-explorer.tsx"),
      read("src/components/atlas/atlas-explorer-results.tsx"),
      read("src/components/atlas/atlas-map.tsx")
    ]);
    expect(map).not.toContain("Map the Canadian ecosystem");
    expect(map).toContain("<AtlasExplorer");
    expect(map).toContain("<Suspense fallback={<MapFallback />}");
    expect(explorer).toContain("Search by need, mission, technology or place.");
    expect(explorer).toContain("lg:grid-cols-[minmax(0,1fr)_380px]");
    expect(explorer).toContain("lg:h-[max(560px,calc(100dvh-250px))]");
    expect(explorer).toContain("initialBounds={initialFilters.bounds}");
    expect(atlasMap).toContain("frameInitialMapLibreView");
    expect(atlasMap).toContain("frameInitialLeafletView");
    expect(explorer).toContain("MobileResultsSheet");
    expect(explorer).toContain("<List className=\"size-4\" />List");
    expect(results).toContain('export type MobileResultsSheetState = "collapsed" | "preview" | "expanded"');
    expect(results).toContain("MobileSelectedPreview");
    expect(results).toContain("h-full min-h-0 overflow-hidden lg:flex lg:flex-col");
  });

  it("shows the real reviewed product specimen before the quota-free worked example in a fixed provider-resilient map view", async () => {
    const [landing, preview, mapPreview, atlasMap] = await Promise.all([
      read("src/app/page.tsx"),
      read("src/components/atlas/guided-landing-dynamic.tsx"),
      read("src/components/atlas/landing-map-preview.tsx"),
      read("src/components/atlas/atlas-map.tsx")
    ]);
    expect(landing.indexOf("<LandingProductPreview />")).toBeLessThan(landing.indexOf('aria-labelledby="example-heading"'));
    expect(preview).toContain("<LandingMapPreview organization={organization} />");
    expect(preview).toContain("{organizationName}");
    expect(preview).toContain("{capability.name}");
    expect(mapPreview).toContain("selectedOrganizationId={organization.id}");
    expect(mapPreview).toContain("interactive={false}");
    expect(atlasMap).toContain("interactive = true");
    expect(atlasMap).toContain("if (interactive) map.addControl");
    expect(atlasMap).toContain("if (interactive) {");
    expect(atlasMap).toContain("resolveAtlasBaseMap");
    expect(atlasMap).toContain('setResolvedBaseMap("openstreetmap")');
    expect(atlasMap).toContain('tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"]');
  });
});
