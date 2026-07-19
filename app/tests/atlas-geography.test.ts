import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getAtlasMetroArea, inferAtlasMetroArea } from "@/lib/atlas/geography";
import { discoverAtlasSnapshot, queryAtlasSnapshot } from "@/lib/atlas/repository";
import { atlasTestSnapshot } from "./fixtures/atlas-snapshot";

describe("atlas metro geography", () => {
  it("resolves Halifax, HRM, and Dartmouth to one reviewed metro area", () => {
    expect(inferAtlasMetroArea("Halifax")?.slug).toBe("halifax-regional-municipality");
    expect(inferAtlasMetroArea("companies in HRM")?.slug).toBe("halifax-regional-municipality");
    expect(inferAtlasMetroArea("Dartmouth underwater systems")?.slug).toBe("halifax-regional-municipality");
    expect(getAtlasMetroArea("halifax-regional-municipality")?.cities).toContain("Dartmouth");
  });

  it("returns Dartmouth-based organizations for a Halifax discovery query", async () => {
    const discovery = discoverAtlasSnapshot(atlasTestSnapshot, "Halifax");

    expect(discovery.interpretation).toBe("matched");
    expect(discovery.filters).toEqual({ metro: "halifax-regional-municipality" });
    expect(discovery.organizationIds).toContain("10000000-0000-4000-8000-000000000005");
    expect(discovery.filterChips).toContainEqual({
      key: "metro",
      label: "Metro area",
      value: "Halifax Regional Municipality"
    });
  });

  it("combines HRM geography with capability-oriented discovery", async () => {
    const discovery = discoverAtlasSnapshot(atlasTestSnapshot, "HRM underwater");
    const result = queryAtlasSnapshot(atlasTestSnapshot, { metro: "halifax-regional-municipality", mission: "underwater-isr" });

    expect(discovery.filters).toMatchObject({
      metro: "halifax-regional-municipality",
      mission: "underwater-isr"
    });
    expect(discovery.organizationIds).toEqual(result.organizations.map((organization) => organization.id));
    expect(discovery.organizationIds).toContain("10000000-0000-4000-8000-000000000005");
  });
});
