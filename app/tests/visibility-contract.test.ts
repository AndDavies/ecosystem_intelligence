import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { aggregateSearchPages, compareSnapshots, createDashboardSummary, deriveOpportunities, isPublicTnmUrl, isStale, weightedAveragePosition, type VisibilitySnapshotV1 } from "@/lib/visibility/contract";

function snapshot(): VisibilitySnapshotV1 {
  return {
    schemaVersion: "visibility_snapshot_v1",
    collectedAt: "2026-07-25T00:00:00.000Z",
    siteUrl: "https://truenorthmap.ca",
    rangeDays: 28,
    providerStatus: {
      searchConsole: { status: "available", source: "fixture" },
      ga4: { status: "available", source: "fixture" },
      pageSpeed: { status: "available", source: "fixture" },
    },
    searchConsole: {
      generativeAiAvailable: false,
      queries: [
        { query: "canadian defence technology companies", page: "https://truenorthmap.ca/organizations", clicks: 2, impressions: 150, ctr: 0.013, position: 7 }
      ]
    },
    ga4: { organicLandingPages: [], aiReferrals: [] },
    technical: { robotsUrl: "https://truenorthmap.ca/robots.txt", sitemapUrl: "https://truenorthmap.ca/sitemap.xml", sitemapCount: 1, pages: [{ url: "https://truenorthmap.ca/briefs", status: 200, jsonLdCount: 0, issues: ["No JSON-LD detected"] }] },
    backlinks: [{ domain: "example.ca", source: "ahrefs", relevance: "high" }]
  };
}

describe("TNM visibility contract", () => {
  it("keeps private routes out of the visibility surface", () => {
    expect(isPublicTnmUrl("https://truenorthmap.ca/briefs")).toBe(true);
    expect(isPublicTnmUrl("https://truenorthmap.ca/admin/review")).toBe(false);
    expect(isPublicTnmUrl("https://other.example/briefs")).toBe(false);
  });

  it("identifies evidence-backed CTR, position, technical, and earned-link opportunities", () => {
    const opportunities = deriveOpportunities(snapshot());
    expect(opportunities.map((opportunity) => opportunity.type)).toEqual(expect.arrayContaining(["ctr", "position", "technical", "earned_link"]));
    expect(opportunities.find((opportunity) => opportunity.type === "earned_link")?.confidence).toBe("inferred");
  });

  it("marks missing and old provider data as stale", () => {
    expect(isStale(undefined, new Date("2026-07-25T00:00:00.000Z"))).toBe(true);
    expect(isStale("2026-07-24T00:00:00.000Z", new Date("2026-07-25T00:00:00.000Z"))).toBe(false);
    expect(isStale("2026-07-01T00:00:00.000Z", new Date("2026-07-25T00:00:00.000Z"))).toBe(true);
  });

  it("compares only explicit first-party metric changes", () => {
    const prior = snapshot();
    const current = snapshot();
    current.searchConsole.queries[0].clicks = 8;
    current.searchConsole.queries[0].impressions = 240;
    expect(compareSnapshots(current, prior)).toMatchObject({ clicksDelta: 6, impressionsDelta: 90 });
  });

  it("does not present incompatible reporting windows as a trend", () => {
    const current = snapshot();
    const prior = snapshot();
    prior.rangeDays = 90;
    expect(compareSnapshots(current, prior)).toMatchObject({ comparable: false, clicksDelta: null, impressionsDelta: null });
  });

  it("creates a dashboard-safe aggregate without exposing raw search queries", () => {
    const value = snapshot();
    value.keywordResearch = { trendSignals: 0, serpTasks: 9, trackedTopTen: 2 };
    value.ga4 = { organicLandingPages: [{ page: "https://truenorthmap.ca/organizations", sessions: 4, engagedSessions: 3, keyEvents: 2, engagementSeconds: 91 }], aiReferrals: [], acquisitionChannels: [{ label: "Organic Search", sessions: 4 }], referralCategories: [{ label: "AI assistants", sessions: 2 }], clickEvents: [{ label: "tnm_content_view", sessions: 3 }] };
    value.searchConsole.daily = [{ label: "2026-07-20", clicks: 1, impressions: 12 }];
    const summary = createDashboardSummary(value);
    const serialized = JSON.stringify(summary);
    expect(summary.schemaVersion).toBe("tnm_visibility_dashboard_summary_v2");
    expect(summary.metrics.organicImpressions).toBe(150);
    expect(summary.metrics.organicCtr).toBeCloseTo(0.0133, 4);
    expect(summary.coverage.score).toBe(100);
    expect(summary.pageOpportunities[0]).toMatchObject({ path: "/organizations", kind: "ctr" });
    expect(summary.actions.some((action) => action.type === "technical")).toBe(true);
    expect(summary.actions.some((action) => action.type === "ctr")).toBe(true);
    expect(summary.insights.length).toBeGreaterThan(0);
    expect(summary.signals).toMatchObject({ dataForSeoSerpTasks: 9, dataForSeoTrackedTopTen: 2 });
    expect(summary.audience).toMatchObject({ acquisitionChannels: [{ label: "Organic Search", sessions: 4 }], organicLandingPages: [{ path: "/organizations", keyEvents: 2 }] });
    expect(serialized).not.toContain("canadian defence technology companies");
    expect(serialized).not.toContain("/admin/");
  });

  it("aggregates public pages and weights position by impressions", () => {
    const value = snapshot();
    value.searchConsole.queries.push({ query: "second private query", page: "https://truenorthmap.ca/organizations", clicks: 0, impressions: 50, ctr: 0, position: 19 });
    expect(weightedAveragePosition(value.searchConsole.queries)).toBe(10);
    expect(aggregateSearchPages(value)[0]).toMatchObject({ path: "/organizations", impressions: 200, position: 10 });
  });

  it("keeps the visibility implementation isolated from Supabase", async () => {
    const [collector, contract] = await Promise.all([
      readFile(new URL("../scripts/tnm-visibility.ts", import.meta.url), "utf8"),
      readFile(new URL("../src/lib/visibility/contract.ts", import.meta.url), "utf8"),
    ]);
    expect(`${collector}\n${contract}`).not.toMatch(/@supabase|createClient\(|SUPABASE_(URL|KEY)|execute_sql/i);
  });
});
