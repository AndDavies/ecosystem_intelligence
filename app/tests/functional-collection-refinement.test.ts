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

    expect(organizations).toContain("Find the people and technology your project needs.");
    expect(organizations).toContain("Search companies, research centres and industry organizations.");
    expect(organizations).toContain("Have a specific need?");
    expect(regions).toContain("Explore capability by region.");
    expect(regions).toContain("Counts and locations reflect the current published record.");
    expect(missions).toContain("Choose a reviewed discovery lens to explore related organizations, technologies and defence needs.");
    expect(missions).toContain('actions={<Link href="/map"');
    expect(missions).toContain("Mission areas are not released requirements or procurement direction.");
    expect(missions).not.toContain("How Mission areas are assessed");
    expect(missions).toContain('label="Published mission areas"');
    expect(missions).toContain("Published organizations</dt>");
    expect(missions).toContain("Published technologies</dt>");
    expect(missions).toContain("Published Defence needs</dt>");
    expect(demand).toContain("What defence need was released?");
    expect(demand).toContain('actions={<Link href="/map?start=need#ask-true-north"');
    expect(demand).toContain("reviewed technology");
    expect(demand).not.toContain("How connections are assessed");
    expect(organizations).toContain('atlas-directory-stats');
    expect(organizations).toContain('className="mt-6"');
    expect(organizations).not.toContain("getAtlasCoverageSummary");
  });

  it("keeps collection cards keyboard-safe while exposing approved contextual continuations", async () => {
    const [organizationCard, regions, missions, demand] = await Promise.all([
      read("src/components/atlas/organization-card.tsx"),
      read("src/app/regions/page.tsx"),
      read("src/app/missions/page.tsx"),
      read("src/app/demand/page.tsx")
    ]);

    expect(organizationCard).not.toContain("after:absolute after:inset-0");
    expect(organizationCard).toContain('href={`/organizations/${organization.slug}`}');
    expect(organizationCard).toContain('href={`/capabilities/${offering.slug}`}');
    expect(organizationCard).toContain('data-internal-link-module="organization_card_profile"');
    expect(organizationCard).toContain('data-internal-link-module="organization_card_capability"');
    expect(organizationCard).not.toContain("focus-visible:outline-none");
    expect(regions).toContain("after:absolute after:inset-0");
    expect(missions).toContain("after:absolute after:inset-0");
    expect(demand).toContain("after:absolute after:inset-0");
    expect(missions).toContain("Explore this mission");
    expect(demand).toContain("Review the defence need");
    expect(regions).toContain("Explore this region");
  });

  it("preserves the compact map-first workspace language and state boundaries", async () => {
    const explorer = await read("src/components/atlas/atlas-explorer.tsx");
    const mapPage = await read("src/app/map/page.tsx");

    expect(explorer).toContain("Find a company, technology or area.");
    expect(explorer).toContain("Search by name or subject, then narrow the results.");
    expect(explorer).toContain("Ask True North · AI-assisted");
    expect(explorer).toContain("Describe a challenge. See which Canadian capabilities may help.");
    expect(explorer).toContain("Filters update the map, results, URL and export together.");
    expect(explorer).toContain("result.mapOrganizations");
    expect(mapPage).toContain("atlasQueryFromSearchParams");
    expect(mapPage).toContain("guidedSearchExampleFromSearchParams");
  });
});
