import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { discoverAtlasSnapshot, queryAtlasSnapshot } from "@/lib/atlas/repository";
import { atlasTestSnapshot } from "./fixtures/atlas-snapshot";

describe("organization-type discovery", () => {
  it("constrains company searches by both organization type and region", async () => {
    const discovery = discoverAtlasSnapshot(atlasTestSnapshot, "companies in Ontario");

    expect(discovery.filters).toMatchObject({ region: "ontario", type: "company" });
    expect(discovery.filterChips).toContainEqual({ key: "type", label: "Organization type", value: "Company" });

    const result = queryAtlasSnapshot(atlasTestSnapshot, { region: "ontario", type: "company", pageSize: 100 });
    expect(discovery.organizationIds).toEqual(result.organizations.map((organization) => organization.id));
    expect(result.organizations.every((organization) => organization.entityKind === "company")).toBe(true);
  });

  it.each([
    "venture capital investors anywhere in Canada",
    "Canadian VC",
    "investors in Canada"
  ])("recognizes investor and funder language in %s", async (query) => {
    const discovery = discoverAtlasSnapshot(atlasTestSnapshot, query);
    expect(discovery.filters.type).toBe("investor_funder");
    expect(discovery.filters.query).toBeUndefined();
  });

  it("recognizes the remaining public organization types", async () => {
    expect(discoverAtlasSnapshot(atlasTestSnapshot, "accelerators in Canada")).toMatchObject({ filters: { type: "accelerator" } });
    expect(discoverAtlasSnapshot(atlasTestSnapshot, "research centres in Canada")).toMatchObject({ filters: { type: "research_test_centre" } });
    expect(discoverAtlasSnapshot(atlasTestSnapshot, "ecosystem organizations in Canada")).toMatchObject({ filters: { type: "ecosystem_organization" } });
  });
});
