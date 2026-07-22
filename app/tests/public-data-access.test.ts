import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

async function source(file: string) {
  return readFile(path.resolve(file), "utf8");
}

describe("public data access", () => {
  it("selects explicit public columns and keeps slug reads targeted", async () => {
    const publicRepository = await source("src/lib/atlas/supabase-repository.ts");

    expect(publicRepository).not.toContain('.select("*")');
    expect(publicRepository).toContain("const atlasColumns");
    expect(publicRepository).toContain("loadAtlasOrganizationBySlugFromSupabase");
    expect(publicRepository).toContain("loadAtlasCapabilityBySlugFromSupabase");
    expect(publicRepository).toContain("loadAtlasDemandBySlugFromSupabase");
    expect(publicRepository).toContain('.eq("slug", slug)');
  });

  it("does not load the national snapshot for public profile routes", async () => {
    const repository = await source("src/lib/atlas/repository.ts");
    const detailSection = repository.slice(repository.indexOf("export const getAtlasOrganizationBySlug"));

    expect(detailSection).toContain("getCachedAtlasOrganizationBySlug(slug)");
    expect(detailSection).toContain("getCachedAtlasCapabilityBySlug(slug)");
    expect(detailSection).toContain("getCachedAtlasDemandBySlug(slug)");
    expect(detailSection.slice(0, detailSection.indexOf("export async function getAtlasRegionBySlug"))).not.toContain("getAtlasSnapshot()");
  });

  it("caches stable public pages while leaving search-param indexes live", async () => {
    const stablePages = await Promise.all([
      source("src/app/organizations/[slug]/page.tsx"),
      source("src/app/capabilities/[slug]/page.tsx"),
      source("src/app/demand/[slug]/page.tsx"),
      source("src/app/briefs/page.tsx"),
      source("src/app/briefs/[slug]/page.tsx")
    ]);
    const liveIndexes = await Promise.all([
      source("src/app/page.tsx"),
      source("src/app/organizations/page.tsx"),
      source("src/app/demand/page.tsx")
    ]);

    stablePages.forEach((page) => expect(page).toContain("export const revalidate = 300"));
    stablePages.slice(0, 3).forEach((page) => expect(page).toContain("generateStaticParams"));
    expect(stablePages[4]).toContain("generateStaticParams");
    liveIndexes.forEach((page) => expect(page).toContain('export const dynamic = "force-dynamic"'));
  });

  it("resolves brief and Working List links without the national snapshot", async () => {
    const briefRepository = await source("src/lib/atlas/briefs.ts");
    const briefDetail = await source("src/app/briefs/[slug]/page.tsx");
    const collectionDetail = await source("src/app/collections/[id]/page.tsx");

    expect(briefRepository).not.toContain('.select("*")');
    expect(briefRepository).toContain('tags: ["briefs-public"]');
    expect(briefDetail).toContain("getAtlasRecordSummaries(brief.links)");
    expect(collectionDetail).toContain("getAtlasRecordSummaries");
    expect(briefDetail).not.toContain("getAtlasSnapshot");
    expect(collectionDetail).not.toContain("getAtlasSnapshot");
  });
});
