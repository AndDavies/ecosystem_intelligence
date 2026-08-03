import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { isTransientPublicReadError, withPublicReadRetry } from "@/lib/supabase/public-read";
import { ATLAS_EXPLORER_PAGE_SIZE, projectAtlasExplorerResult } from "@/lib/atlas/explorer-projection";
import { collectPagedPublicRows } from "@/lib/atlas/supabase-repository";
import { groupProjectedPointsByGrid } from "@/lib/atlas/map-clustering";
import { atlasTestSnapshot } from "./fixtures/atlas-snapshot";

vi.mock("server-only", () => ({}));

describe("phase 2 launch hardening", () => {
  it("retries one transient public read and does not retry permanent errors", async () => {
    const transient = vi.fn()
      .mockRejectedValueOnce(new Error("fetch failed: ECONNRESET"))
      .mockResolvedValueOnce("ready");
    await expect(withPublicReadRetry(transient, 0)).resolves.toBe("ready");
    expect(transient).toHaveBeenCalledTimes(2);

    const permanent = vi.fn().mockRejectedValue(new Error("published record is invalid"));
    await expect(withPublicReadRetry(permanent, 0)).rejects.toThrow("published record is invalid");
    expect(permanent).toHaveBeenCalledTimes(1);
    expect(isTransientPublicReadError(new Error("upstream 525"))).toBe(true);
  });

  it("keeps the complete marker collection while limiting rich initial cards", () => {
    const organizations = Array.from({ length: 1000 }, (_, index) => ({
      ...atlasTestSnapshot.organizations[0]!,
      id: `organization-${index}`,
      slug: `organization-${index}`,
      name: `Organization ${index}`
    }));
    const result = projectAtlasExplorerResult({
      organizations: organizations.slice(0, ATLAS_EXPLORER_PAGE_SIZE),
      total: organizations.length,
      page: 1,
      pageSize: ATLAS_EXPLORER_PAGE_SIZE,
      appliedFilters: [],
      facets: { regions: [], organizationTypes: [], technicalDomains: [], missionAreas: [], demandRequirements: [] }
    }, {}, organizations);

    expect(ATLAS_EXPLORER_PAGE_SIZE).toBe(18);
    expect(result.organizations).toHaveLength(ATLAS_EXPLORER_PAGE_SIZE);
    expect(result.mapOrganizations).toHaveLength(1000);
    expect(result.hasMore).toBe(true);
    expect(Buffer.byteLength(JSON.stringify(result))).toBeLessThan(300_000);
  });

  it("retrieves every public discovery row across the database page boundary", async () => {
    const records = Array.from({ length: 2_505 }, (_, index) => ({ id: `row-${index}` }));
    const pages: Array<[number, number]> = [];
    const result = await collectPagedPublicRows(async (from, to) => {
      pages.push([from, to]);
      return { data: records.slice(from, to + 1), error: null };
    }, "scale fixture");

    expect(result.data).toHaveLength(2_505);
    expect(pages).toEqual([[0, 999], [1_000, 1_999], [2_000, 2_999]]);
    await expect(collectPagedPublicRows(async () => ({ data: [], error: null }), "invalid fixture", 0))
      .rejects.toThrow("Invalid page size");
  });

  it("clusters the Leaflet fallback with a bounded grid pass", () => {
    const points = Array.from({ length: 5_000 }, (_, index) => ({
      id: index,
      projected: { x: index % 1_000, y: Math.floor(index / 1_000) * 70 }
    }));
    const groups = groupProjectedPointsByGrid(points);
    expect(groups.flat()).toHaveLength(points.length);
    expect(groups.length).toBeLessThan(points.length);
  });

  it("streams the decision-first shell ahead of the cached national discovery projection", async () => {
    const [page, mapPage, repository, supabaseRepository, vercel] = await Promise.all([
      readFile(path.resolve("src/app/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/map/page.tsx"), "utf8"),
      readFile(path.resolve("src/lib/atlas/repository.ts"), "utf8"),
      readFile(path.resolve("src/lib/atlas/supabase-repository.ts"), "utf8"),
      readFile(path.resolve("vercel.json"), "utf8")
    ]);
    expect(page).toContain("<LandingCoverage />");
    expect(page).toContain("Canada is building");
    expect(mapPage).toContain("<Suspense fallback={<MapFallback />}");
    expect(repository).toContain("loadWarmAtlasDiscoverySnapshot");
    expect(repository).toContain("getCachedAtlasDiscoveryTablePage");
    expect(repository).toContain("ecosystem-intelligence-atlas-discovery-table-page-v1");
    expect(repository).not.toContain("ecosystem-intelligence-atlas-discovery-v3");
    expect(repository).toContain('tags: ["atlas-public"]');
    expect(repository).toContain("queryAtlasExplorerSnapshot(await getAtlasDiscoverySnapshot(), query)");
    const discoveryLoader = supabaseRepository.slice(
      supabaseRepository.indexOf("loadAtlasDiscoverySnapshotFromSupabase"),
      supabaseRepository.indexOf("loadAtlasDemandIndexFromSupabase")
    );
    expect(discoveryLoader).not.toContain("loadPublicCitationGraph");
    expect(discoveryLoader).toContain("verifiedDemandSourceIds");
    expect(discoveryLoader).toContain("source_verified_at");
    expect(discoveryLoader).toContain("source_verified_by");
    expect(JSON.parse(vercel)).toMatchObject({ regions: ["sfo1"] });
  });

  it("streams collection-page shells while loading only their compact public projections", async () => {
    const [organizations, missions, regions, regionDetail, demand, repository, supabaseRepository] = await Promise.all([
      readFile(path.resolve("src/app/organizations/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/missions/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/regions/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/regions/[slug]/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/demand/page.tsx"), "utf8"),
      readFile(path.resolve("src/lib/atlas/repository.ts"), "utf8"),
      readFile(path.resolve("src/lib/atlas/supabase-repository.ts"), "utf8")
    ]);

    expect(organizations).toContain("getAtlasDiscoverySnapshot()");
    expect(organizations).toContain("getAtlasCoverageSummary()");
    expect(organizations).toContain("export const revalidate = 300");
    expect(organizations).toContain("<Suspense fallback={<OrganizationsDirectoryFallback />}");
    expect(organizations).not.toContain("getAtlasSnapshot");

    expect(missions).toContain("getAtlasMissionIndex()");
    expect(missions).not.toContain("getAtlasSnapshot");

    expect(regions).toContain("getAtlasDiscoverySnapshot()");
    expect(regions).toContain("<Suspense fallback={<RegionsDirectoryFallback />}");
    expect(regions).not.toContain("getAtlasSnapshot");

    expect(regionDetail).toContain("getAtlasRegionDefinitionBySlug");
    expect(regionDetail).toContain("getAtlasRegionDirectoryBySlug");
    expect(regionDetail).toContain("<Suspense fallback={<RegionDirectoryFallback />}");
    expect(regionDetail).not.toContain("getAtlasRegionBySlug");
    expect(regionDetail).not.toContain("getAtlasSnapshot");

    expect(demand).toContain("getAtlasDemandIndex()");
    expect(demand).toContain("<Suspense fallback={<DemandDirectoryFallback />}");
    expect(demand).not.toContain("getAtlasSnapshot");

    expect(repository).toContain("ecosystem-intelligence-demand-index-v2");
    expect(repository).toContain('tags: ["atlas-public"]');
    const demandIndexLoader = supabaseRepository.slice(
      supabaseRepository.indexOf("loadAtlasDemandIndexFromSupabase"),
      supabaseRepository.indexOf("loadAtlasCoverageSummaryFromSupabase")
    );
    expect(demandIndexLoader).toContain('.from("demand_sources")');
    expect(demandIndexLoader).toContain('.from("demand_requirements")');
    expect(demandIndexLoader).toContain('.from("capability_demand_matches")');
    expect(demandIndexLoader).toContain('.eq("review_status", "approved")');
    expect(demandIndexLoader).toContain("source_verified_at");
    expect(demandIndexLoader).toContain("source_verified_by");
    expect(demandIndexLoader).not.toContain('.from("organizations")');
    expect(demandIndexLoader).not.toContain('.from("capabilities")');
    expect(demandIndexLoader).not.toContain('.from("funding_events")');
  });

  it("keeps the guided landing shell independent from national data loading", async () => {
    const [explorer, page, mapPage] = await Promise.all([
      readFile(path.resolve("src/components/atlas/atlas-explorer.tsx"), "utf8"),
      readFile(path.resolve("src/app/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/map/page.tsx"), "utf8")
    ]);
    expect(page).toContain("export const revalidate = 300");
    expect(page).not.toContain("getAtlasDiscoverySnapshot");
    expect(page).toContain("<LandingCoverage />");
    expect(mapPage).toContain("getAtlasDiscoverySnapshot()");
    expect(explorer).toContain('className="atlas-frame pb-8 pt-3 sm:pt-4"');
    expect(explorer).toContain("lg:grid-cols-[minmax(0,1fr)_380px]");
    expect(explorer).toContain("lg:h-[max(560px,calc(100dvh-250px))]");
    expect(mapPage).toContain("MapFallback");
  });

  it("ships a provider-aware security policy and a safe health endpoint", async () => {
    const [config, health, authState] = await Promise.all([
      readFile(path.resolve("next.config.ts"), "utf8"),
      readFile(path.resolve("src/app/api/health/route.ts"), "utf8"),
      readFile(path.resolve("src/app/api/auth-state/route.ts"), "utf8")
    ]);
    expect(config).toContain("Content-Security-Policy");
    expect(config).toContain("challenges.cloudflare.com");
    expect(config).toContain("facoactpdckkhciamflk.supabase.co");
    expect(config).toContain("poweredByHeader: false");
    expect(config).not.toContain("clarity.ms");
    expect(health).toContain("catalogueConsistent");
    expect(health).toContain("missionsAvailable");
    expect(health).toContain("loadAtlasPublicHealthSnapshotFromSupabase");
    expect(health).not.toContain("error.message");
    expect(authState).toContain("signedOutResponse.cookies.delete");
  });

  it("keeps scale and launch-response budgets inside the release gate", async () => {
    const [workspacePackage, scaleValidator, launchValidator, operationalChecks] = await Promise.all([
      readFile(path.resolve("../package.json"), "utf8"),
      readFile(path.resolve("scripts/validate-atlas-scale.ts"), "utf8"),
      readFile(path.resolve("scripts/validate-public-launch.ts"), "utf8"),
      readFile(path.resolve("src/lib/launch/operational-checks.ts"), "utf8")
    ]);
    expect(JSON.parse(workspacePackage).scripts["release:validate"]).toContain("pnpm scale:validate");
    expect(scaleValidator).toContain("const organizationCount = 5_000");
    expect(scaleValidator).toContain("maxProjectionMs = 300");
    expect(scaleValidator).toContain("maxSerializedBytes = 1_500_000");
    expect(launchValidator).toContain("PUBLIC_LAUNCH_MAX_RESPONSE_MS");
    expect(launchValidator).toContain("PUBLIC_LAUNCH_MAX_HTML_BYTES");
    expect(launchValidator).toContain("PUBLIC_LAUNCH_MAX_RECOVERED_FAILURES");
    expect(operationalChecks).toContain("Recovered after initial HTTP");
    expect(launchValidator).toContain("/api/atlas/summary");
    expect(launchValidator).toContain("page=1&pageSize=18");
    expect(launchValidator).toContain("warnings.length > maxRecoveredFailures");
    expect(launchValidator).toContain('PUBLIC_LAUNCH_MAX_RECOVERED_FAILURES ?? "0"');
    expect(launchValidator).toContain("responseTimingMs");
  });

  it("fails the release gate when high or critical production dependencies are known", async () => {
    const workspacePackage = JSON.parse(await readFile(path.resolve("../package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    const appPackage = JSON.parse(await readFile(path.resolve("package.json"), "utf8")) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
      pnpm?: { overrides?: Record<string, string> };
    };

    expect(workspacePackage.scripts["security:validate"]).toContain("audit --prod --audit-level high");
    expect(workspacePackage.scripts["release:validate"]).toContain("pnpm security:validate");
    expect(appPackage.dependencies.next).toBe("^15.5.22");
    expect(appPackage.dependencies.sharp).toBe("0.35.3");
    expect(appPackage.dependencies).not.toHaveProperty("shadcn");
    expect(appPackage.devDependencies).toHaveProperty("shadcn");
    expect(appPackage.pnpm?.overrides).toMatchObject({
      postcss: "8.5.18",
      sharp: "0.35.3",
      ws: "8.21.0"
    });
  });

  it("enforces scheduled telemetry retention and an agent-owned rollback order", async () => {
    const [migration, rollback, runbook, agentContract] = await Promise.all([
      readFile(path.resolve("supabase/migrations/20260726105731_phase2_retention_cleanup.sql"), "utf8"),
      readFile(path.resolve("supabase/rollback/20260726105731_phase2_retention_cleanup.rollback.sql"), "utf8"),
      readFile(path.resolve("../context/governance/Phase 2 Release Runbook.md"), "utf8"),
      readFile(path.resolve("../AGENTS.md"), "utf8")
    ]);
    expect(migration).toContain("true-north-map-purge-expired-product-telemetry");
    expect(migration).toContain("delete from public.pilot_searches where expires_at <= now()");
    expect(migration).toContain("delete from public.pilot_events where expires_at <= now()");
    expect(migration).toContain("revoke all on function private.purge_expired_product_telemetry() from public, anon, authenticated");
    expect(rollback.indexOf("cron.unschedule")).toBeGreaterThanOrEqual(0);
    expect(rollback.indexOf("drop function if exists private.purge_expired_product_telemetry")).toBeGreaterThan(rollback.indexOf("cron.unschedule"));
    expect(runbook).toContain("versioned rollback script");
    expect(agentContract).toContain("release owner is not expected to remember internal scheduler dependencies");
  });

  it("publishes the launch walkthrough and evidence-aware FAQ with field-guide geometry", async () => {
    const [howItWorks, explorer, header] = await Promise.all([
      readFile(path.resolve("src/app/how-it-works/page.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/atlas-explorer.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/public-atlas-header.tsx"), "utf8")
    ]);
    expect(howItWorks).toContain('"@type": "VideoObject"');
    expect(howItWorks).toContain('"@type": "FAQPage"');
    expect(howItWorks).toContain('/video/true-north-map-launch.mp4');
    expect(howItWorks).toContain("Does AI publish the information?");
    expect(explorer).toContain('type="submit" className="atlas-signal-button');
    expect(explorer).toContain('className="min-h-9 shrink-0 rounded-full border');
    expect(header).toContain('rounded-[8px] px-3');
  });
});
