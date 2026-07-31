import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { isTransientPublicReadError, withPublicReadRetry } from "@/lib/supabase/public-read";
import { ATLAS_EXPLORER_PAGE_SIZE, projectAtlasExplorerResult } from "@/lib/atlas/explorer-projection";
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

  it("streams the decision-first shell ahead of the cached national discovery projection", async () => {
    const [page, hero, repository, supabaseRepository, vercel] = await Promise.all([
      readFile(path.resolve("src/app/page.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/atlas-home-hero.tsx"), "utf8"),
      readFile(path.resolve("src/lib/atlas/repository.ts"), "utf8"),
      readFile(path.resolve("src/lib/atlas/supabase-repository.ts"), "utf8"),
      readFile(path.resolve("vercel.json"), "utf8")
    ]);
    expect(page).toContain("<AtlasHomeHero />");
    expect(page).toContain("<Suspense fallback={<AtlasHomepageFallback />}");
    expect(hero).toContain("<Suspense fallback={<CoverageFallback />}");
    expect(repository).toContain("ecosystem-intelligence-atlas-discovery-v1");
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
    const [organizations, regions, regionDetail, demand, repository, supabaseRepository] = await Promise.all([
      readFile(path.resolve("src/app/organizations/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/regions/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/regions/[slug]/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/demand/page.tsx"), "utf8"),
      readFile(path.resolve("src/lib/atlas/repository.ts"), "utf8"),
      readFile(path.resolve("src/lib/atlas/supabase-repository.ts"), "utf8")
    ]);

    expect(organizations).toContain("getAtlasDiscoverySnapshot()");
    expect(organizations).toContain("getAtlasCoverageSummary()");
    expect(organizations).toContain("<Suspense fallback={<OrganizationsDirectoryFallback />}");
    expect(organizations).not.toContain("getAtlasSnapshot");

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

    expect(repository).toContain("ecosystem-intelligence-demand-index-v1");
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

  it("keeps the compact split hero independent from national data loading", async () => {
    const [hero, explorer, page] = await Promise.all([
      readFile(path.resolve("src/components/atlas/atlas-home-hero.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/atlas-explorer.tsx"), "utf8"),
      readFile(path.resolve("src/app/page.tsx"), "utf8")
    ]);

    expect(hero).toContain('sizes="(min-width: 1280px) 55vw, (min-width: 1024px) 45vw, 100vw"');
    expect(hero).toContain("priority");
    expect(hero).toContain("lg:h-[480px]");
    expect(hero).toContain("<AtlasHomeCoverage />");
    expect(hero).not.toContain("rounded-2xl border border-[var(--atlas-border-strong)]");
    expect(hero).not.toContain("lg:min-h-[690px]");
    expect(hero).toContain('className="atlas-frame pb-2 pt-6 sm:pb-2 sm:pt-8"');
    expect(explorer).toContain('className="atlas-frame pb-8 pt-2"');
    expect(page).toContain('className="atlas-frame pb-8 pt-2" aria-live="polite"');
    expect(page.indexOf("<AtlasHomeHero />")).toBeLessThan(page.indexOf("<Suspense fallback={<AtlasHomepageFallback />}"));
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
    expect(health).not.toContain("error.message");
    expect(authState).toContain("signedOutResponse.cookies.delete");
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
      readFile(path.resolve("supabase/migrations/20260726100611_phase2_retention_cleanup.sql"), "utf8"),
      readFile(path.resolve("supabase/rollback/20260726100611_phase2_retention_cleanup.rollback.sql"), "utf8"),
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
    expect(explorer).toContain('className="rounded-[8px] border');
    expect(header).toContain('rounded-[8px] px-3');
  });
});
