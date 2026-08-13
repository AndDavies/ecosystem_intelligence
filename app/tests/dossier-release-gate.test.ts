import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  countPublicDossierCitations,
  dossierReleaseProbeMaxAgeMs,
  dossierApiContractIssues,
  percentile,
  selectDossierReleaseSamples,
  signDossierReleaseProbe,
  verifyDossierReleaseProbe,
  type DossierReleaseCandidate
} from "@/lib/launch/dossier-release-gate";

const candidates: DossierReleaseCandidate[] = Array.from({ length: 18 }, (_, index) => ({
  id: `organization-${index}`,
  slug: `organization-${index}`,
  entityKind: ["company", "accelerator", "research_test_centre", "investor_funder", "ecosystem_organization"][index % 5],
  updatedAt: new Date(Date.UTC(2026, 7, index + 1)).toISOString(),
  citationCount: index + 1,
  contentCount: index
}));

describe("cold dossier release gate", () => {
  it("selects ten unique high-citation, sparse and newly updated dossiers", () => {
    const selected = selectDossierReleaseSamples(candidates, 10);
    expect(selected).toHaveLength(10);
    expect(new Set(selected.map((candidate) => candidate.id)).size).toBe(10);
    expect(new Set(selected.map((candidate) => candidate.selectionLane))).toEqual(new Set([
      "high_citation",
      "sparse",
      "newly_updated",
      "coverage_fill"
    ]));
    expect(new Set(selected.map((candidate) => candidate.entityKind)).size).toBe(5);
  });

  it("requires enough cited dossiers and computes nearest-rank p95", () => {
    expect(() => selectDossierReleaseSamples(candidates.slice(0, 9), 10)).toThrow("10 are required");
    expect(percentile([100, 200, 300, 400, 500], 0.95)).toBe(500);
  });

  it("requires identity, activated profile, collections and public citations", () => {
    const expected = candidates[0];
    expect(dossierApiContractIssues({
      id: expected.id,
      slug: expected.slug,
      editorialProfile: { version: "organization_editorial_profile_v1" },
      profileData: { portfolioScope: "Published capability portfolio." },
      capabilities: [],
      citations: [{ id: "citation-one" }]
    }, expected)).toEqual([]);
    expect(dossierApiContractIssues({}, expected)).toEqual([
      "API record identity did not match the selected dossier",
      "API omitted the activated editorial profile marker",
      "API omitted the capabilities collection",
      "API omitted the bounded public citation trail"
    ]);
  });

  it("counts a public citation anywhere in the admitted dossier graph", () => {
    expect(countPublicDossierCitations({
      citations: [],
      capabilities: [{
        citations: [],
        missionMatches: [{ citations: [{ id: "nested-citation", sourceUrl: "https://example.ca/source" }] }]
      }]
    })).toBe(1);
    expect(countPublicDossierCitations({ citations: [], capabilities: [{ citations: [] }] })).toBe(0);
  });

  it("rejects internal review lineage in a public profile payload", () => {
    const expected = candidates[0];
    expect(dossierApiContractIssues({
      id: expected.id,
      slug: expected.slug,
      editorialProfile: { version: "organization_editorial_profile_v1" },
      profileData: { reviewed_candidate_id: "private-candidate" },
      capabilities: [],
      citations: [{ id: "citation-one" }]
    }, expected)).toContain("API exposed internal profile lineage: reviewed_candidate_id");
  });

  it("authenticates a short-lived, nonce-bound probe to one exact deployment and slug", () => {
    const now = Date.parse("2026-08-13T09:00:00.000Z");
    const signature = signDossierReleaseProbe(
      "deployment-sha",
      "organization-1",
      "release-secret",
      now,
      "0123456789abcdef0123456789abcdef"
    );
    expect(verifyDossierReleaseProbe(
      "deployment-sha",
      "organization-1",
      signature,
      "deployment-sha",
      "release-secret",
      now
    )).toBe(true);
    expect(verifyDossierReleaseProbe(
      "other-deployment",
      "organization-1",
      signature,
      "deployment-sha",
      "release-secret",
      now
    )).toBe(false);
    expect(verifyDossierReleaseProbe(
      "deployment-sha",
      "organization-2",
      signature,
      "deployment-sha",
      "release-secret",
      now
    )).toBe(false);
    const tampered = `${signature.slice(0, -1)}${signature.endsWith("0") ? "1" : "0"}`;
    expect(verifyDossierReleaseProbe(
      "deployment-sha",
      "organization-1",
      tampered,
      "deployment-sha",
      "release-secret",
      now
    )).toBe(false);
    expect(verifyDossierReleaseProbe(
      "deployment-sha",
      "organization-1",
      signature,
      "deployment-sha",
      "release-secret",
      now + dossierReleaseProbeMaxAgeMs + 1
    )).toBe(false);
    const second = signDossierReleaseProbe(
      "deployment-sha",
      "organization-1",
      "release-secret",
      now,
      "fedcba9876543210fedcba9876543210"
    );
    expect(second).not.toBe(signature);
    expect(verifyDossierReleaseProbe(
      "deployment-sha",
      "organization-1",
      signature,
      "deployment-sha",
      "release-secret",
      now + dossierReleaseProbeMaxAgeMs + 1
    )).toBe(false);
  });

  it("keeps the authenticated release probe outside the ordinary slug cache", async () => {
    const repository = await readFile(join(process.cwd(), "src/lib/atlas/repository.ts"), "utf8");
    const probeSection = repository.slice(repository.indexOf("export const getAtlasOrganizationBySlugForReleaseProbe"));
    expect(probeSection).toContain("loadAtlasOrganizationBySlugFromSupabase(slug)");
    expect(probeSection.slice(0, probeSection.indexOf("export async function getAtlasOrganizationLogos")))
      .not.toContain("getCachedAtlasOrganizationBySlug");
    const apiRoute = await readFile(join(process.cwd(), "src/app/api/organizations/[slug]/route.ts"), "utf8");
    const pageRoute = await readFile(join(process.cwd(), "src/app/organizations/[slug]/page.tsx"), "utf8");
    expect(apiRoute).toContain("getAtlasOrganizationBySlugForReleaseProbe");
    expect(apiRoute).toContain("authorizeAtlasOrganizationReleaseProbe");
    expect(apiRoute).toContain("status: 403");
    expect(apiRoute).toContain('"private, no-store"');
    expect(pageRoute).toContain("getAtlasOrganizationBySlugForReleaseProbe");
    expect(pageRoute).toContain("authorizeAtlasOrganizationReleaseProbe");
    expect(pageRoute).toContain("return getAtlasOrganizationBySlug(slug)");
    const gateScript = await readFile(join(process.cwd(), "scripts/validate-cold-dossiers.ts"), "utf8");
    expect(gateScript).toContain('redirect: "manual"');
    expect(gateScript).toContain("refused redirect");
    expect(gateScript).toContain("response escaped");
  });
});
