import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFile(path.resolve(file), "utf8");

describe("functional discovery collections", () => {
  it("uses outcome-led collection headings and scoped continuation paths", async () => {
    const [organizations, regions, missions, demand] = await Promise.all([
      read("src/app/organizations/page.tsx"),
      read("src/app/regions/page.tsx"),
      read("src/app/missions/page.tsx"),
      read("src/app/demand/page.tsx")
    ]);

    expect(organizations).toContain("Find Canadian organizations worth examining.");
    expect(organizations).toContain("Search by capability, place or organization type.");
    expect(organizations).toContain("Have a specific need?");
    expect(regions).toContain("Explore capability by region.");
    expect(regions).toContain("Counts and locations reflect the current published record.");
    expect(missions).toContain("Choose a Mission Area to see related organizations, technologies and public needs.");
    expect(missions).toContain("How Mission Areas are assessed");
    expect(demand).toContain("What public need was released?");
    expect(demand).toContain("How connections are assessed");
  });

  it("keeps collection cards keyboard-safe and directed to one canonical detail route", async () => {
    const [organizationCard, regions, missions, demand] = await Promise.all([
      read("src/components/atlas/organization-card.tsx"),
      read("src/app/regions/page.tsx"),
      read("src/app/missions/page.tsx"),
      read("src/app/demand/page.tsx")
    ]);

    expect(organizationCard).toContain("after:absolute after:inset-0");
    expect(regions).toContain("after:absolute after:inset-0");
    expect(missions).toContain("after:absolute after:inset-0");
    expect(demand).toContain("after:absolute after:inset-0");
    expect(missions).toContain("Explore this mission");
    expect(demand).toContain("Review the public need");
    expect(regions).toContain("Explore this region");
  });

  it("preserves the compact map-first workspace language and state boundaries", async () => {
    const explorer = await read("src/components/atlas/atlas-explorer.tsx");
    const mapPage = await read("src/app/map/page.tsx");

    expect(explorer).toContain("Search by need, mission, technology or place.");
    expect(explorer).toContain("Filters update the map, results, URL and export together.");
    expect(explorer).toContain("result.mapOrganizations");
    expect(mapPage).toContain("atlasQueryFromSearchParams");
    expect(mapPage).toContain("guidedSearchExampleFromSearchParams");
  });
});
