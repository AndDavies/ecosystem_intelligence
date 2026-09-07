import { readFile } from "node:fs/promises";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const cache = vi.hoisted(() => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => cache);

import {
  publishedAtlasInvalidationPlan,
  revalidatePublishedAtlas
} from "@/lib/atlas/public-cache-invalidation";

describe("published public cache invalidation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("turns a successful organization publication into targeted data and route invalidation", () => {
    const change = {
      discoveryChanged: true,
      organizationSlugs: ["sample-organization", "sample-organization"]
    };
    const plan = publishedAtlasInvalidationPlan(change);

    expect(plan.tags).toEqual([
      "atlas-public",
      "atlas-discovery-public",
      "atlas-organization:sample-organization"
    ]);
    expect(plan.paths).toEqual([
      "/",
      "/organizations",
      "/missions",
      "/regions",
      "/sitemap.xml",
      "/organizations/sample-organization"
    ]);

    revalidatePublishedAtlas(change);
    plan.tags.forEach((tag) => expect(cache.revalidateTag).toHaveBeenCalledWith(tag));
    plan.paths.forEach((route) => expect(cache.revalidatePath).toHaveBeenCalledWith(route));
  });

  it("invalidates only the affected dossier families for relationship publication", () => {
    const plan = revalidatePublishedAtlas({
      discoveryChanged: true,
      demandChanged: true,
      organizationSlugs: ["sample-organization"],
      capabilitySlugs: ["sample-capability"],
      demandSlugs: ["sample-need"]
    });

    expect(plan.paths).toContain("/capabilities/sample-capability");
    expect(plan.paths).toContain("/demand/sample-need");
    expect(plan.tags).not.toContain("atlas-organizations-public");
  });

  it("keeps cache mutation after the canonical publication transaction succeeds", async () => {
    const source = await readFile(path.resolve("src/lib/actions/atlas-admin.ts"), "utf8");
    const publication = source.slice(
      source.indexOf("export async function publishApprovedCandidates"),
      source.indexOf("const canonicalRepairPublishSchema")
    );

    expect(publication.indexOf('supabase.rpc("publish_reviewed_research_candidates"')).toBeGreaterThan(-1);
    expect(publication.indexOf("if (error) {")).toBeGreaterThan(-1);
    expect(publication.indexOf("revalidatePublishedAtlas({")).toBeGreaterThan(publication.indexOf("if (error) {"));
    expect(publication).toContain("discoveryChanged: organizationSlugs.length > 0 || demandSlugs.length > 0");
  });

  it("uses publication invalidation as primary freshness while retaining a bounded recovery expiry", async () => {
    const [repository, organizations, filteredOrganizations, missions, regions, map, organizationDossier, capabilityDossier, middleware] = await Promise.all([
      readFile(path.resolve("src/lib/atlas/repository.ts"), "utf8"),
      readFile(path.resolve("src/app/organizations/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/organizations/filter/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/missions/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/regions/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/map/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/organizations/[slug]/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/capabilities/[slug]/page.tsx"), "utf8"),
      readFile(path.resolve("src/middleware.ts"), "utf8")
    ]);

    expect(repository).toContain("const publicContentFallbackSeconds = 24 * 60 * 60");
    expect(repository).toContain("unstable_cache(");
    expect(organizations).toContain("export const revalidate = 86400");
    expect(organizations).toContain("<OrganizationsRoute searchParams={Promise.resolve({})}");
    expect(filteredOrganizations).toContain('dynamic = "force-dynamic"');
    expect(middleware).toContain('destination.pathname = "/organizations/filter"');
    expect(middleware).toContain('requestHeaders.set("x-tnm-directory-filter", "1")');
    expect(missions).toContain("export const revalidate = 86400");
    expect(regions).toContain("export const revalidate = 86400");
    expect(missions).not.toContain('dynamic = "force-dynamic"');
    expect(regions).not.toContain('dynamic = "force-dynamic"');
    expect(map).toContain('dynamic = "force-dynamic"');
    expect(organizationDossier).toContain('dynamic = "force-dynamic"');
    expect(capabilityDossier).toContain('dynamic = "force-dynamic"');
  });
});
