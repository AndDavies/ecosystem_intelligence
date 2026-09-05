import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

async function source(file: string) {
  return readFile(path.resolve(file), "utf8");
}

describe("profile and decision handoffs", () => {
  it("leads organization and capability profiles with contextual evidence while keeping public unknowns contextual", async () => {
    const [organizationRoute, organizationDossier, capability, demand] = await Promise.all([
      source("src/app/organizations/[slug]/page.tsx"),
      source("src/components/atlas/executive-organization-dossier.tsx"),
      source("src/app/capabilities/[slug]/page.tsx"),
      source("src/app/demand/[slug]/page.tsx")
    ]);
    const organization = `${organizationRoute}\n${organizationDossier}`;

    expect(organization).toContain("Sources behind this profile");
    expect(organization).not.toContain('title="What remains unknown"');
    expect(capability).toContain('title="What it enables"');
    expect(capability).toContain('title="What supports this profile"');
    expect(capability).toContain("Evidence limits");
    expect(demand).toContain('title="What supports this defence need"');
    expect(demand).toContain('title="Evidence limits"');
    expect(capability).not.toContain("EvidenceLegend");
    expect(demand).not.toContain("EvidenceLegend");
  });

  it("preserves map and profile state through actions and related records", async () => {
    const [organizationRoute, organizationDossier, capability, mission, region, demand] = await Promise.all([
      source("src/app/organizations/[slug]/page.tsx"),
      source("src/components/atlas/executive-organization-dossier.tsx"),
      source("src/app/capabilities/[slug]/page.tsx"),
      source("src/app/missions/[slug]/page.tsx"),
      source("src/app/regions/[slug]/page.tsx"),
      source("src/app/demand/[slug]/page.tsx")
    ]);
    const organization = `${organizationRoute}\n${organizationDossier}`;

    expect(organization).toContain("safeAtlasReturn");
    expect(organization).toContain("returnTo=${encodeURIComponent(profilePath)}");
    expect(capability).toContain("returnTo=${encodeURIComponent(capabilityPath)}");
    expect(capability).toContain("returnTo=${encodeURIComponent(mapReturnTo)}");
    expect(mission).toContain("/map?mission=${result.missionArea.slug}");
    expect(region).toContain("/map?region=${region.slug}");
    expect(demand).toContain("/map?demand=${demand.slug}");
    expect(`${organization}\n${capability}\n${mission}\n${region}\n${demand}`).not.toMatch(/href=\{`\/\?[^`]+`\}/);
  });

  it("explains Shortlists as the reusable decision handoff", async () => {
    const [collections, collection, organization, capability] = await Promise.all([
      source("src/app/collections/page.tsx"),
      source("src/app/collections/[id]/page.tsx"),
      source("src/components/atlas/executive-organization-dossier.tsx"),
      source("src/app/capabilities/[slug]/page.tsx")
    ]);

    expect(collections).toContain("Save organizations, capabilities and evidence for the conversation ahead.");
    expect(collections).toContain("Your Shortlist is empty.");
    expect(collection).toContain("Organizations, capabilities and evidence saved for the conversation ahead.");
    expect(organization).toContain("My shortlists");
    expect(capability).toContain("My shortlists");
  });
});
