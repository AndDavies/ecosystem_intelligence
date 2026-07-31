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
    expect(publicRepository).toContain("includeOrganizationLogos: true");
    expect(publicRepository).toContain("selectPublishedOrganizationLogo");
  });

  it("loads only the citation graph referenced by the current public scope", async () => {
    const publicRepository = await source("src/lib/atlas/supabase-repository.ts");

    expect(publicRepository).toContain("loadPublicCitationGraph");
    expect(publicRepository).toContain("createAdminClient");
    expect(publicRepository).toContain("hasSupabaseAdminEnv");
    expect(publicRepository).toContain('.eq("entity_type", entityType)');
    expect(publicRepository).toContain('.in("entity_id", batch)');
    expect(publicRepository).toContain('.in("id", batch)');
    expect(publicRepository).toContain('.eq("visibility", "public")');
    expect(publicRepository).toContain('.eq("public_approved", true)');
    expect(publicRepository).not.toContain("Promise.all(\n    targets.flatMap");
    expect(publicRepository).not.toContain('supabase.from("field_citations").select(atlasColumns.citations)\n  ]');
  });

  it("does not expose private demand-match rationale through the public model or AI catalogue", async () => {
    const [publicRepository, atlasTypes, assistant, repository] = await Promise.all([
      source("src/lib/atlas/supabase-repository.ts"),
      source("src/types/atlas.ts"),
      source("src/lib/atlas/assistant.ts"),
      source("src/lib/atlas/repository.ts")
    ]);

    expect(publicRepository).not.toContain("demand_requirement_id, alignment_summary, rationale");
    expect(publicRepository).not.toContain("rationale: asString(row.rationale)");
    expect(atlasTypes.slice(atlasTypes.indexOf("export interface AtlasDemandMatch"), atlasTypes.indexOf("export interface AtlasCapability"))).not.toContain("rationale");
    expect(assistant).not.toContain("match.rationale");
    expect(repository).not.toContain("match.rationale");
  });

  it("adds logos only to organization and capability profiles and preserves the existing map and export surfaces", async () => {
    const publicRepository = await source("src/lib/atlas/supabase-repository.ts");
    const profile = await source("src/app/organizations/[slug]/page.tsx");
    const capabilityProfile = await source("src/app/capabilities/[slug]/page.tsx");
    const directory = await source("src/components/atlas/organization-card.tsx");
    const pdf = await source("src/lib/export/atlas-pdf.tsx");

    expect(profile).toContain("organization.logo?.publicUrl");
    expect(profile).toContain('alt={`${organization.name} logo`}');
    expect(capabilityProfile).toContain("organization.logo");
    expect(capabilityProfile).toContain('alt={`${organization.name} logo`}');
    expect(directory).not.toContain("organization.logo");
    expect(pdf).not.toContain("organization.logo");
    expect(publicRepository).toContain("scope?.includeOrganizationLogos");
  });

  it("keeps organization logo replacement and removal inside the existing administrator editor", async () => {
    const editPage = await source("src/app/admin/organizations/[id]/edit/page.tsx");
    const actions = await source("src/lib/actions/atlas-organizations.ts");

    expect(editPage).toContain('title="Organization logo"');
    expect(editPage).toContain("replacePublishedOrganizationLogo");
    expect(editPage).toContain("removePublishedOrganizationLogo");
    expect(actions).toContain('requireAtlasStaff("editor")');
    expect(actions).toContain('revalidatePath(`/organizations/${organizationSlug}`)');
    expect(actions).toContain("replace_published_organization_logo");
    expect(actions).toContain("remove_published_organization_logo");
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
