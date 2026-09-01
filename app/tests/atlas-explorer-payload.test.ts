import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { projectAtlasExplorerOrganization, selectedExplorerCapabilityIds } from "@/lib/atlas/explorer-projection";
import { capabilityResultLabel, relevantCapability } from "@/components/atlas/atlas-explorer-results";
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

  it("keeps ordinary off-page map selections unconstrained while cluster selections fail closed", () => {
    const organization = atlasTestSnapshot.organizations[0];

    const ordinaryConstraint = selectedExplorerCapabilityIds({});
    expect(ordinaryConstraint).toBeUndefined();
    expect(projectAtlasExplorerOrganization(organization, {}, ordinaryConstraint).capabilities[0]?.id)
      .toBe(organization.capabilities[0].id);

    const clusterConstraint = selectedExplorerCapabilityIds({ cluster: "atlantic-underwater-sensing" });
    expect(clusterConstraint).toBeInstanceOf(Set);
    expect(projectAtlasExplorerOrganization(organization, { cluster: "atlantic-underwater-sensing" }, clusterConstraint).capabilities)
      .toEqual([]);
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

  it("fails closed on unknown clusters and projects the capability that belongs to a known cluster", () => {
    const capability = atlasTestSnapshot.organizations[0].capabilities[0];
    const snapshot = {
      ...atlasTestSnapshot,
      clusters: [{
        id: "cluster-underwater",
        slug: "atlantic-underwater-sensing",
        name: "Atlantic Underwater Sensing",
        summary: "A test cluster.",
        regionSlug: "atlantic-canada",
        clusterBasis: "technical" as const,
        capabilityIds: [capability.id]
      }]
    };
    const result = queryAtlasExplorerSnapshot(snapshot, { cluster: "atlantic-underwater-sensing", pageSize: 10 });
    expect(result.total).toBe(1);
    expect(result.organizations[0].capabilities[0].id).toBe(capability.id);
    expect(result.appliedFilters).toContainEqual({ key: "cluster", label: "Cluster", value: "Atlantic Underwater Sensing" });
    expect(result.mapOrganizations[0]).not.toHaveProperty("capabilities");
    expect(queryAtlasExplorerSnapshot(snapshot, { cluster: "missing-cluster", pageSize: 10 }).total).toBe(0);
    expect(projectAtlasExplorerOrganization(snapshot.organizations[0], { cluster: "atlantic-underwater-sensing" }, new Set()).capabilities).toEqual([]);
  });

  it("does not imply capability participation for an organization-level program filter", () => {
    const organization = atlasTestSnapshot.organizations[0];
    const snapshot = {
      ...atlasTestSnapshot,
      organizations: [{
        ...organization,
        programs: [{
          id: "participation-one",
          programSlug: "reviewed-program",
          programName: "Reviewed Program",
          programType: "accelerator",
          programSummary: null,
          programOperatorName: "Program Operator",
          programUrl: "https://program.example.test",
          participationType: "participant",
          cohortLabel: "2026 cohort",
          publicSummary: null,
          lifecycleStage: "selected" as const,
          announcedOn: null,
          startedOn: null,
          endedOn: null,
          externalIdentifiers: [],
          citations: [],
          programCitations: []
        }]
      }]
    };

    const result = queryAtlasExplorerSnapshot(snapshot, { program: "reviewed-program", pageSize: 10 });

    expect(result.total).toBe(1);
    expect(result.organizations[0].slug).toBe(organization.slug);
    expect(result.organizations[0].capabilities).toEqual([]);
    expect(relevantCapability(result.organizations[0], { program: "reviewed-program" })).toBeNull();
    expect(capabilityResultLabel({ program: "reviewed-program" })).toBe("Organization-level program record");
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
