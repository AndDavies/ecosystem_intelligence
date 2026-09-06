import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { initialAtlasView, atlasQueryFromSearchParams, atlasQueryToSearchParams } from "@/lib/atlas/query-params";

const read = (file: string) => readFile(path.resolve(file), "utf8");

describe("discovery entry and shared map state", () => {
  it("respects explicit views and shared spatial intent before a viewport default", () => {
    expect(initialAtlasView({}, false)).toBe("table");
    expect(initialAtlasView({}, true)).toBe("map");
    for (const desktop of [false, true]) {
      expect(initialAtlasView({ view: "table", selected: "selected" }, desktop)).toBe("table");
      expect(initialAtlasView({ view: "map" }, desktop)).toBe("map");
      expect(initialAtlasView({ selected: "selected" }, desktop)).toBe("map");
      expect(initialAtlasView({ bounds: { west: -65, east: -60, south: 40, north: 50 } }, desktop)).toBe("map");
    }
  });
  it("roundtrips a filtered shortlist return without changing canonical URL values", () => {
    const state = atlasQueryFromSearchParams(new URLSearchParams("q=sonar&type=company&region=atlantic&view=table&bounds=-65,40,-60,50&selected=11111111-1111-4111-8111-111111111111"));
    expect(atlasQueryFromSearchParams(atlasQueryToSearchParams(state))).toEqual(state);
    expect(atlasQueryToSearchParams({ ...state, bounds: undefined }).get("region")).toBe("atlantic");
    expect(atlasQueryToSearchParams({ ...state, bounds: undefined }).get("q")).toBe("sonar");
  });
  it("keeps direct lookup and the guided example independent of AI", async () => {
    const [lookup, directory, guide, map, focus] = await Promise.all([read("src/components/atlas/public-record-search.tsx"), read("src/app/organizations/page.tsx"), read("src/app/how-it-works/page.tsx"), read("src/app/map/page.tsx"), read("src/components/atlas/guided-search-focus.tsx")]);
    expect(directory).toContain("matchingAtlasOrganizations");
    expect(directory).toContain("<PublicRecordSearch");
    expect(lookup).not.toContain("/api/discover");
    expect(guide).toContain("<GuidedSearchFocus");
    expect(map).toContain("guidedSearchExampleFromSearchParams");
    expect(focus).toContain("guidedSearchHref(selected)");
    expect(focus).toContain("Select at least one search focus to continue.");
  });
  it("keeps the homepage cacheable and product proof tied to published records", async () => {
    const [home, data, preview, bridge] = await Promise.all([read("src/app/page.tsx"), read("src/app/api/landing/route.ts"), read("src/components/atlas/guided-landing-dynamic.tsx"), read("src/components/atlas/landing-entry-link.tsx")]);
    expect(home).toContain("export const revalidate = 300");
    expect(home).not.toContain("searchParams");
    expect(home).toContain("home-maritime-evidence.webp");
    expect(data).toContain('getAtlasOrganizationBySlug("kraken-robotics")');
    expect(data).toContain('getAtlasCapabilityBySlug("kraken-katfish-sas")');
    expect(preview).toContain("publicLanguage.assessment");
    expect(preview).toContain("What still needs checking:");
    expect(preview).toContain("{capability.gap}");
    expect(bridge).toContain('window.location.hash !== "#ask-true-north"');
  });
});
