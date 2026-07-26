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

    expect(ATLAS_EXPLORER_PAGE_SIZE).toBeLessThanOrEqual(36);
    expect(result.organizations).toHaveLength(ATLAS_EXPLORER_PAGE_SIZE);
    expect(result.mapOrganizations).toHaveLength(1000);
    expect(result.hasMore).toBe(true);
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
});
