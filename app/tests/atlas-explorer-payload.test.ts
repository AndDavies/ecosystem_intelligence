import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { projectAtlasExplorerOrganization } from "@/lib/atlas/explorer-projection";
import { queryAtlasExplorerSnapshot } from "@/lib/atlas/repository";
import { paginate } from "@/lib/pagination";
import { atlasTestSnapshot } from "./fixtures/atlas-snapshot";

describe("public explorer payload", () => {
  it("paginates explorer results and exposes a next-page contract", () => {
    const result = queryAtlasExplorerSnapshot(atlasTestSnapshot, { page: 1, pageSize: 2 });

    expect(result.organizations).toHaveLength(2);
    expect(result.mapOrganizations).toHaveLength(6);
    expect(result.total).toBe(6);
    expect(result.hasMore).toBe(true);
    expect(result.nextPage).toBe(2);
  });

  it("keeps every matching organization on the map while detail rows stay paginated", () => {
    const result = queryAtlasExplorerSnapshot(atlasTestSnapshot, {
      page: 1,
      pageSize: 1,
      region: "atlantic-canada"
    });

    expect(result.organizations).toHaveLength(1);
    expect(result.mapOrganizations).toHaveLength(result.total);
    expect(result.mapOrganizations.every((organization) => organization.primaryLocation)).toBe(true);
  });

  it("does not cap the map collection when the corpus grows beyond request limits", () => {
    const source = atlasTestSnapshot.organizations[0];
    const organizations = Array.from({ length: 1_250 }, (_, index) => ({
      ...source,
      id: `organization-${index}`,
      slug: `organization-${index}`,
      name: `Organization ${index}`
    }));
    const result = queryAtlasExplorerSnapshot(
      { ...atlasTestSnapshot, organizations },
      { page: 1, pageSize: 1_000 }
    );

    expect(result.organizations).toHaveLength(200);
    expect(result.mapOrganizations).toHaveLength(1_250);
    expect(result.total).toBe(1_250);
    expect(result.hasMore).toBe(true);
  });

  it("projects one relevant capability without profile-only data", () => {
    const organization = atlasTestSnapshot.organizations.find((item) => item.slug === "dartmouth-systems");
    expect(organization).toBeDefined();

    const projected = projectAtlasExplorerOrganization(organization!, { mission: "underwater-isr" });

    expect(projected.capabilities).toHaveLength(1);
    expect(projected.capabilities[0].missionMatches[0].missionArea.slug).toBe("underwater-isr");
    expect(projected.capabilities[0]).not.toHaveProperty("coreFeatures");
    expect(projected).not.toHaveProperty("profileData");
    expect(projected).not.toHaveProperty("programs");
    expect(projected).not.toHaveProperty("fundingEvents");
  });

  it("names the selected reviewed grouping as a Mission Area", () => {
    const result = queryAtlasExplorerSnapshot(atlasTestSnapshot, {
      mission: "underwater-isr",
      page: 1,
      pageSize: 10
    });

    expect(result.appliedFilters).toContainEqual({
      key: "mission",
      label: "Mission Area",
      value: "Underwater ISR"
    });
  });
});

describe("server-rendered directory pagination", () => {
  it("clamps invalid pages and returns stable ranges", () => {
    expect(paginate(["a", "b", "c", "d", "e"], 99, 2)).toMatchObject({
      items: ["e"],
      page: 3,
      totalPages: 3,
      start: 5,
      end: 5
    });
  });
});
