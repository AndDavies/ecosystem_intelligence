import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { buildOrganizationTypeOptions, matchesOrganizationType } from "@/lib/atlas/organization-type-filters";
import { buildAtlasLensOptions } from "@/lib/atlas/lens-options";
import { matchingAtlasOrganizations, queryAtlasExplorerSnapshot } from "@/lib/atlas/repository";
import type { AtlasEntityKind } from "@/types/atlas";
import { atlasTestSnapshot } from "./fixtures/atlas-snapshot";

const kinds: AtlasEntityKind[] = ["incubator", "accelerator", "ecosystem_organization", "government_innovation_office", "company", "research_test_centre", "investor_funder"];
const base = atlasTestSnapshot.organizations[0];
const organizations = kinds.map((entityKind, index) => ({
  ...base, id: `type-${index}`, name: index === 0 ? "COVE" : entityKind, slug: index === 0 ? "cove" : entityKind,
  entityKind, categories: index === 0 ? ["ocean_technology", "cluster_operator", "incubator"] : [],
  primaryLocation: { ...base.primaryLocation!, city: "Dartmouth", provinceTerritory: "Nova Scotia", regionSlug: "atlantic-canada" }
}));
const snapshot = { ...atlasTestSnapshot, organizations };

describe("public organization type discovery", () => {
  it("finds COVE and overlapping support roles under Atlantic innovation support", () => {
    const results = matchingAtlasOrganizations(snapshot, { region: "atlantic-canada", type: "innovation_support" });
    expect(results.map((item) => item.entityKind).sort()).toEqual(kinds.slice(0, 4).sort());
    expect(results.some((item) => item.slug === "cove")).toBe(true);
    expect(matchingAtlasOrganizations(snapshot, { region: "ontario", type: "innovation_support" })).toEqual([]);
  });

  it("preserves exact legacy filters and unrelated category links", () => {
    expect(matchingAtlasOrganizations(snapshot, { type: "accelerator" }).map((item) => item.entityKind)).toEqual(["accelerator"]);
    expect(matchingAtlasOrganizations(snapshot, { type: "incubator" }).map((item) => item.slug)).toEqual(["cove"]);
    expect(matchingAtlasOrganizations(snapshot, { type: "ocean_technology" }).map((item) => item.slug)).toEqual(["cove"]);
    expect(matchesOrganizationType(organizations[3], " Government_Innovation_Office ")).toBe(true);
  });

  it("counts each organization once even when its primary type also appears in categories", () => {
    const options = buildOrganizationTypeOptions(organizations);
    expect(options.find((option) => option.value === "innovation_support")?.count).toBe(4);
    expect(options).toHaveLength(4);
    expect(buildOrganizationTypeOptions(organizations, "incubator").find((option) => option.value === "incubator")?.count).toBe(1);
    expect(buildOrganizationTypeOptions([], "accelerator")).toEqual([{ value: "accelerator", label: "Accelerators", count: 0 }]);
  });

  it("keeps map projection, facet and guided-lens counts consistent with directory filtering", () => {
    const map = queryAtlasExplorerSnapshot(snapshot, { type: "innovation_support" });
    const group = map.facets.organizationTypes.find((option) => option.value === "innovation_support");
    expect(map.total).toBe(4);
    expect(map.mapOrganizations).toHaveLength(4);
    expect(group).toEqual({ value: "innovation_support", label: "Innovation & business support", count: 4 });
    expect(buildAtlasLensOptions(snapshot).organizationTypes.find((option) => option.value === "innovation_support")).toEqual(group);
    expect(map.facets.organizationTypes.find((option) => option.value === "incubator")?.count).toBe(1);
    expect(map.appliedFilters.find((filter) => filter.key === "type")?.value).toBe("Innovation & business support");
  });
});
