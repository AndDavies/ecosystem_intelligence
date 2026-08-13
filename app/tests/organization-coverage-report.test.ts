import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildOrganizationCoverageReport,
  publicContactPresence,
  rankOrganizationCoverage,
  selectRoleBalancedCoverageWave,
  type OrganizationCoverageInput
} from "@/lib/research/organization-coverage-report";

const base: OrganizationCoverageInput = {
  id: "00000000-0000-4000-a000-000000000001",
  slug: "sample-company",
  name: "Sample Company",
  entityKind: "company",
  freshnessStatus: "current",
  lastReviewedAt: "2026-08-01T00:00:00.000Z",
  hasExecutiveRelevanceSummary: true,
  hasOperatingContext: true,
  hasCanadianFootprint: true,
  hasCurrentActivity: true,
  capabilityCount: 2,
  missionMatchCount: 1,
  demandMatchCount: 1,
  programCount: 1,
  relationshipCount: 0,
  fundingEventCount: 0,
  publicCitationCount: 8,
  hasPublicContact: true,
  hasPublishedLogo: true
};

function record(overrides: Partial<OrganizationCoverageInput>): OrganizationCoverageInput {
  return { ...base, ...overrides };
}

describe("read-only organization coverage ranking", () => {
  it("prioritizes meaningful dossier gaps, reviewed relevance and attributable demand", () => {
    const complete = rankOrganizationCoverage(base);
    const gapHeavy = rankOrganizationCoverage(record({
      id: "00000000-0000-4000-a000-000000000002",
      slug: "gap-heavy",
      name: "Gap Heavy",
      hasExecutiveRelevanceSummary: false,
      hasOperatingContext: false,
      hasCanadianFootprint: false,
      hasCurrentActivity: false,
      capabilityCount: 0,
      publicCitationCount: 0,
      programCount: 0,
      hasPublicContact: false,
      hasPublishedLogo: false,
      demandMatchCount: 3,
      freshnessStatus: "stale",
      traffic: { searchClicks: 12, dossierOpens: 8, profileEngagements: 4 }
    }));

    expect(gapHeavy.priorityScore).toBeGreaterThan(complete.priorityScore);
    expect(gapHeavy.gaps).toEqual(expect.arrayContaining([
      "Executive relevance summary",
      "Public evidence",
      "Published capabilities",
      "Public programs or contracts"
    ]));
    expect(gapHeavy.priorityReasons).toContain("Attributable visitor or search demand");
    expect(complete.dossierDepthScore).toBe(9);
  });

  it("detects only the presence of bounded public contact values", () => {
    expect(publicContactPresence({ publicContact: { contactPageUrl: "https://example.ca/contact" } })).toBe(true);
    expect(publicContactPresence({ publicContact: { publicEmail: "public@example.ca" } })).toBe(true);
    expect(publicContactPresence({ publicContact: { publicEmail: "   " }, reviewed_by: "private-lineage" })).toBe(false);
    expect(publicContactPresence(null)).toBe(false);
  });

  it("keeps a recommended wave role-balanced without discarding global priority", () => {
    const ranked = [
      ...Array.from({ length: 10 }, (_, index) => rankOrganizationCoverage(record({
        id: `company-${index}`,
        slug: `company-${index}`,
        name: `Company ${index}`,
        entityKind: "company",
        hasExecutiveRelevanceSummary: false
      }))),
      rankOrganizationCoverage(record({ id: "research", slug: "research", name: "Research", entityKind: "research_test_centre" })),
      rankOrganizationCoverage(record({ id: "government", slug: "government", name: "Government", entityKind: "government_innovation_office" })),
      rankOrganizationCoverage(record({ id: "accelerator", slug: "accelerator", name: "Accelerator", entityKind: "accelerator" })),
      rankOrganizationCoverage(record({ id: "ecosystem", slug: "ecosystem", name: "Ecosystem", entityKind: "ecosystem_organization" })),
      rankOrganizationCoverage(record({ id: "capital", slug: "capital", name: "Capital", entityKind: "investor_funder" }))
    ].sort((left, right) => right.priorityScore - left.priorityScore);
    const wave = selectRoleBalancedCoverageWave(ranked, 10);

    expect(wave).toHaveLength(10);
    expect(new Set(wave.map((item) => item.role))).toEqual(new Set([
      "industry",
      "research_and_test",
      "government",
      "accelerator_and_incubator",
      "ecosystem",
      "capital"
    ]));
    expect(wave.filter((item) => item.role === "industry")).toHaveLength(5);
  });

  it("reports full-corpus coverage and explicit optional-signal availability", () => {
    const report = buildOrganizationCoverageReport({
      records: [base, record({ id: "research", slug: "research", name: "Research", entityKind: "research_test_centre", hasExecutiveRelevanceSummary: false })],
      generatedAt: "2026-08-13T12:00:00.000Z",
      waveSize: 2,
      executiveRelevanceFieldAvailable: false,
      searchTrafficIncluded: false,
      attributableEngagementIncluded: true
    });

    expect(report.totalPublishedOrganizations).toBe(2);
    expect(report.coverage.executiveRelevanceSummary).toBe(1);
    expect(report.roles.industry).toBe(1);
    expect(report.roles.research_and_test).toBe(1);
    expect(report.signalAvailability).toEqual({
      executiveRelevanceField: false,
      searchTraffic: false,
      attributableEngagement: true
    });
    expect(report.recommendedWave).toHaveLength(2);
  });

  it("keeps the executable read-only and excludes PII-bearing event fields", async () => {
    const script = await readFile(path.resolve("scripts/report-organization-coverage.ts"), "utf8");
    const rootPackage = await readFile(path.resolve("../package.json"), "utf8");
    const appPackage = await readFile(path.resolve("package.json"), "utf8");

    expect(script).not.toMatch(/\.insert\(|\.update\(|\.delete\(|\.upsert\(|\.rpc\(/);
    expect(script).not.toContain("request_hash");
    expect(script).not.toContain("session_id");
    expect(script).not.toContain('select("email');
    expect(script).toContain('select("event_name, context_path, cohort, metadata, created_at")');
    expect(script).toContain("evidence_snippets!inner");
    expect(script).toContain('.eq("evidence_snippets.public_approved", true)');
    expect(script).toContain('.eq("evidence_snippets.sources.public_approved", true)');
    expect(script).toContain('event.event_name === "profile_engagement"');
    expect(script).toContain('^\\/organizations\\/([^/?#]+)');
    expect(rootPackage).toContain('"research:dossier-coverage": "pnpm --dir app research:dossier-coverage --"');
    expect(appPackage).toContain('"research:dossier-coverage": "tsx scripts/report-organization-coverage.ts"');
  });
});
