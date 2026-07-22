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
    expect(result.total).toBe(6);
    expect(result.hasMore).toBe(true);
    expect(result.nextPage).toBe(2);
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
