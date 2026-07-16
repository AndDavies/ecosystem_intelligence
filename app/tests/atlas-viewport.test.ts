import { describe, expect, it } from "vitest";
import { atlasOrganizations } from "@/lib/atlas/validated-data";
import { isUsableAtlasBounds, organizationIdsInBounds } from "@/lib/atlas/viewport";

describe("atlas viewport filtering", () => {
  it("returns only organizations inside the current visible bounds", () => {
    const ids = organizationIdsInBounds(atlasOrganizations, {
      west: -64.0,
      south: 44.4,
      east: -63.2,
      north: 45.0
    });

    expect(ids).toEqual(["10000000-0000-4000-8000-000000000005"]);
  });

  it("excludes organizations without usable coordinates", () => {
    const organizations = [
      {
        ...atlasOrganizations[0],
        id: "missing-location",
        primaryLocation: null
      }
    ];

    expect(
      organizationIdsInBounds(organizations, { west: -141, south: 40, east: -50, north: 75 })
    ).toEqual([]);
  });

  it("rejects collapsed bounds emitted while a mobile map is hidden", () => {
    const collapsed = { west: -94.859, south: 67.374, east: -94.859, north: 67.374 };
    expect(isUsableAtlasBounds(collapsed)).toBe(false);
    expect(organizationIdsInBounds(atlasOrganizations, collapsed)).toEqual([]);
  });
});
