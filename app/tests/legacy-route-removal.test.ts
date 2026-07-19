import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const removedRoutes = [
  "src/app/app/page.tsx",
  "src/app/companies/page.tsx",
  "src/app/domains/page.tsx",
  "src/app/use-cases/page.tsx",
  "src/app/shortlists/page.tsx",
  "src/app/help/page.tsx",
  "src/app/review/page.tsx",
  "src/app/create-user/page.tsx",
  "src/app/admin/enrichment/page.tsx",
  "src/app/admin/taxonomy/page.tsx",
  "src/app/api/search/route.ts",
  "src/app/api/pilot-events/route.ts",
  "src/app/api/pilot-feedback/route.ts",
  "src/app/api/pilot-signup/route.ts"
];

describe("legacy workspace retirement", () => {
  it("keeps obsolete route implementations out of the application", async () => {
    for (const route of removedRoutes) {
      await expect(access(path.resolve(route))).rejects.toThrow();
    }
  });

  it("keeps the canonical public capability dossier without the authenticated fallback", async () => {
    const capabilityPage = await readFile(path.resolve("src/app/capabilities/[slug]/page.tsx"), "utf8");
    expect(capabilityPage).toContain("PublicCapabilityPage");
    expect(capabilityPage).toContain("notFound()");
    expect(capabilityPage).not.toContain("LegacyCapabilityPage");
    expect(capabilityPage).not.toContain("AppShell");
    expect(capabilityPage).not.toContain("getCapabilityById");
  });

  it("retains only current export modes and canonical beta endpoints", async () => {
    const exportRoute = await readFile(path.resolve("src/app/api/export/route.ts"), "utf8");
    const betaRoute = await readFile(path.resolve("src/app/api/beta-events/route.ts"), "utf8");
    expect(exportRoute).not.toContain("use-case-briefing");
    expect(exportRoute).not.toContain("use-case-targets");
    expect(exportRoute).toContain("organization-dossier");
    expect(betaRoute).not.toContain("@/app/api/pilot-events/route");
  });

  it("provides canonical redirects without preserving the legacy UI", async () => {
    const nextConfig = await readFile(path.resolve("next.config.ts"), "utf8");
    expect(nextConfig).toContain('{ source: "/app", destination: "/", permanent: true }');
    expect(nextConfig).toContain('{ source: "/companies", destination: "/organizations", permanent: true }');
    expect(nextConfig).toContain('{ source: "/shortlists", destination: "/collections", permanent: true }');
  });
});
