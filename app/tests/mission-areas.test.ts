import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildAtlasMissionDetail, buildAtlasMissionIndex, buildAtlasMissionLinksForRecords } from "@/lib/atlas/repository";
import type { AtlasDiscoverySnapshot } from "@/types/atlas";
import { atlasTestSnapshot } from "./fixtures/atlas-snapshot";

const snapshot = atlasTestSnapshot as AtlasDiscoverySnapshot;

describe("public Mission area journey", () => {
  it("derives the index from reviewed published mappings without inventing needs", () => {
    const index = buildAtlasMissionIndex(snapshot);
    expect(index.missions).toHaveLength(snapshot.missionAreas.length);
    const underwater = index.missions.find((item) => item.missionArea.slug === "underwater-isr");
    expect(underwater).toBeTruthy();
    expect(underwater?.organizationCount).toBeGreaterThan(0);
    expect(underwater?.capabilityCount).toBeGreaterThan(0);
    expect(Object.values(underwater?.confidenceCounts ?? {}).reduce((sum, count) => sum + count, 0))
      .toBe(underwater?.capabilityCount);
  });

  it("orders organization connections by assessment strength and joins defence needs through technology", () => {
    const detail = buildAtlasMissionDetail(snapshot, "underwater-isr");
    expect(detail?.missionArea.name).toBeTruthy();
    expect(detail?.organizations.length).toBeGreaterThan(0);
    expect(detail?.organizations.every((connection) => connection.capabilities.every((capability) => capability.assessment))).toBe(true);
    expect(buildAtlasMissionDetail(snapshot, "not-a-mission")).toBeNull();
  });

  it("connects editorial records to mission areas only through reviewed technology mappings", () => {
    const organization = snapshot.organizations[0];
    const capability = organization.capabilities[0];
    const fromOrganization = buildAtlasMissionLinksForRecords(snapshot, [{ type: "organization", id: organization.id }]);
    const fromCapability = buildAtlasMissionLinksForRecords(snapshot, [{ type: "capability", id: capability.id }]);

    expect(fromOrganization).toEqual([{
      missionArea: snapshot.missionAreas[0],
      capabilityCount: 1,
      connectingCapabilities: [{ id: capability.id, slug: capability.slug, name: capability.name }]
    }]);
    expect(fromCapability).toEqual(fromOrganization);
    expect(buildAtlasMissionLinksForRecords(snapshot, [{ type: "organization", id: "unknown" }])).toEqual([]);
  });

  it("ships index, detail, loading, metadata, evidence boundaries and structured navigation", async () => {
    const [indexPage, detailPage, header, footer, sitemap, promptRoutes] = await Promise.all([
      readFile(path.resolve("src/app/missions/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/missions/[slug]/page.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/public-atlas-header.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/public-atlas-footer.tsx"), "utf8"),
      readFile(path.resolve("src/app/sitemap.ts"), "utf8"),
      readFile(path.resolve("src/lib/north-signal/prompt.ts"), "utf8")
    ]);
    await access(path.resolve("src/app/missions/loading.tsx"));
    expect(indexPage).toContain("Start with an operational problem.");
    expect(indexPage).toContain("Mission areas are not released requirements or procurement direction.");
    expect(indexPage).toContain('actions={<Link href="/map"');
    expect(indexPage).toContain('label="Published mission areas"');
    expect(indexPage).not.toContain("EvidenceLegend");
    expect(indexPage).not.toContain("Mission areas are reviewed True North Map groupings");
    expect(detailPage).toContain("Our assessment");
    expect(detailPage).toContain("The Mission area does not create or change the released source.");
    expect(detailPage).toContain("Defence Briefs connected to this mission");
    expect(detailPage).toContain('"@type": "DefinedTerm"');
    expect(detailPage).toContain('"@type": "BreadcrumbList"');
    expect(header).toContain('{ href: "/missions", label: "Mission areas", match:');
    expect(footer).toContain('["Mission areas", "/missions"]');
    expect(sitemap).toContain('"/missions"');
    expect(sitemap).toContain("slugs.missions");
    expect(promptRoutes).toContain('"/missions"');
  });
});
