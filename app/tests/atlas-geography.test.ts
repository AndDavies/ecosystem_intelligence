import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getAtlasMetroArea, inferAtlasMetroArea } from "@/lib/atlas/geography";
import { mapAtlasOrganizationDossierRow } from "@/lib/atlas/supabase-repository";
import { projectAtlasMapOrganization, projectAtlasExplorerOrganization, projectAtlasExplorerResult } from "@/lib/atlas/explorer-projection";
import { discoverAtlasSnapshot, queryAtlasSnapshot } from "@/lib/atlas/repository";
import { atlasTestSnapshot } from "./fixtures/atlas-snapshot";

describe("atlas metro geography", () => {
  it("keeps foreign companies discoverable without assigning Canadian regions, metros or coordinates", () => {
    const foreign = structuredClone(atlasTestSnapshot.organizations[0]);
    foreign.id = "foreign-company";
    foreign.slug = "foreign-company";
    foreign.primaryLocation = { ...foreign.primaryLocation!, name: "Halifax, Virginia", city: "Halifax", provinceTerritory: "Nova Scotia", countryCode: "US", latitude: 37.6547, longitude: -122.4077, regionSlug: "atlantic-canada" };
    const snapshot = { ...atlasTestSnapshot, organizations: [...atlasTestSnapshot.organizations, foreign] };
    expect(queryAtlasSnapshot(snapshot).organizations.some(o => o.id === foreign.id)).toBe(true);
    for (const query of [{region:"canada"}, {region:"atlantic-canada"}, {metro:"halifax-regional-municipality"}]) {
      expect(queryAtlasSnapshot(snapshot, query).organizations.some(o => o.id === foreign.id)).toBe(false);
    }
    expect(projectAtlasMapOrganization(foreign).primaryLocation).toBeNull();
    const result = projectAtlasExplorerResult(queryAtlasSnapshot(snapshot));
    expect(result.organizations.some(o => o.id === foreign.id)).toBe(true);
    expect(result.mapOrganizations.some(o => o.id === foreign.id)).toBe(false);
    expect(projectAtlasExplorerOrganization(foreign).primaryLocation).toMatchObject({countryCode:"US",latitude:37.6547});
    Object.assign(foreign, { internationalEligibility: { relevanceAssessment: "private review metadata" } });
    expect(JSON.stringify(projectAtlasExplorerOrganization(foreign))).not.toContain("internationalEligibility");
  });
  it("keeps unresolved Canadian coordinates in the directory without emitting a marker", () => {
    const organization=structuredClone(atlasTestSnapshot.organizations[0]);
    organization.primaryLocation!.latitude=null;
    const result=projectAtlasExplorerResult(queryAtlasSnapshot({...atlasTestSnapshot,organizations:[organization]}));
    expect(result.organizations).toHaveLength(1);
    expect(result.mapOrganizations).toHaveLength(0);
  });
  it("maps real foreign country independently of a Canadian-looking state or city name", () => {
    for (const province_territory of ["California", "Ontario"]) {
      const mapped = mapAtlasOrganizationDossierRow({ id:"foreign-row",slug:"foreign-row",name:"Foreign row",locations:[{id:"foreign-location",name:"Foreign facility",city:"Halifax",province_territory,country_code:"US",latitude:37.6547,longitude:-122.4077,geographic_confidence:"city_centroid",is_primary:true}] });
      expect(mapped.primaryLocation).toMatchObject({ countryCode: "US", regionSlug: "", latitude: 37.6547 });
    }
  });
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
