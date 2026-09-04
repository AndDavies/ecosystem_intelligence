import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { aggregateSearchPages, compareSnapshots, createDashboardSummary, deriveOpportunities, isKnownAiReferralSource, isPublicTnmUrl, isStale, selectBoundedTechnicalUrls, selectPriorSnapshot, snapshotTotals, technicalManifestReady, technicalPageSuccessful, weightedAveragePosition, type VisibilitySnapshotV1 } from "@/lib/visibility/contract";

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
  it("selects only the deterministic bounded sample from a large public sitemap", () => {
    const sitemap = Array.from({ length: 1_265 }, (_, index) => `https://truenorthmap.ca/organizations/example-${index}`);
    sitemap.push("https://truenorthmap.ca/", "https://truenorthmap.ca/organizations", "https://truenorthmap.ca/map", "https://truenorthmap.ca/signals", "https://truenorthmap.ca/north-signal");
    sitemap.push("https://other.example/map", "https://truenorthmap.ca/admin/review");
    expect(selectBoundedTechnicalUrls(sitemap, ["/", "/organizations", "/map", "/signals", "/north-signal"])).toEqual([
      "https://truenorthmap.ca/",
      "https://truenorthmap.ca/organizations",
      "https://truenorthmap.ca/map",
      "https://truenorthmap.ca/signals",
      "https://truenorthmap.ca/north-signal",
    ]);
    expect(() => selectBoundedTechnicalUrls(sitemap, ["/", "/missing"])).toThrow(/missing bounded visibility routes: \/missing/);
  });

  it("keeps private routes out of the visibility surface", () => {
    expect(isPublicTnmUrl("https://truenorthmap.ca/briefs")).toBe(true);
    expect(isPublicTnmUrl("https://truenorthmap.ca/admin/review")).toBe(false);
    expect(isPublicTnmUrl("https://truenorthmap.ca/ad%6din/review")).toBe(false);
    expect(isPublicTnmUrl("https://truenorthmap.ca/dev/dossier-preview")).toBe(false);
    expect(isPublicTnmUrl("https://other.example/briefs")).toBe(false);
  });

  it("requires healthy manifest responses and sampled 2xx responses", () => {
    const value = snapshot();
    Object.assign(value.technical, { robotsStatus: 200, sitemapStatus: 200, robotsDeclaresSitemap: true });
    expect(technicalManifestReady(value.technical)).toBe(true);
    value.technical.robotsStatus = 302;
    expect(technicalManifestReady(value.technical)).toBe(false);
    value.technical.robotsStatus = 200;
    value.technical.sitemapStatus = 500;
    expect(technicalManifestReady(value.technical)).toBe(false);
    value.technical.sitemapStatus = 200;
    value.technical.robotsDeclaresSitemap = false;
    expect(technicalManifestReady(value.technical)).toBe(false);
    expect(technicalPageSuccessful({ url: "https://truenorthmap.ca/", status: 200, jsonLdCount: 0, issues: [] })).toBe(true);
    expect(technicalPageSuccessful({ url: "https://truenorthmap.ca/", status: 302, jsonLdCount: 0, issues: [] })).toBe(false);
  });

  it("classifies only known AI-assistant hosts", () => {
    expect(isKnownAiReferralSource("chatgpt.com")).toBe(true);
    expect(isKnownAiReferralSource("www.perplexity.ai/path")).toBe(true);
    expect(isKnownAiReferralSource("example.com")).toBe(false);
    expect(isKnownAiReferralSource("openai.example.com")).toBe(false);
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

  it("does not compare technical issue counts across different inspection scopes or route sets", () => {
    const current = snapshot();
    const prior = snapshot();
    current.technical.inspectionScope = "bounded_core_v1";
    prior.technical.inspectionScope = "full_sitemap_legacy";
    expect(compareSnapshots(current, prior)).toMatchObject({ comparable: true, technicalIssuesDelta: null });
    prior.technical.inspectionScope = "bounded_core_v1";
    prior.technical.pages[0].url = "https://truenorthmap.ca/map";
    expect(compareSnapshots(current, prior)).toMatchObject({ comparable: true, technicalIssuesDelta: null });
  });

  it("creates a dashboard-safe aggregate without exposing raw search queries", () => {
    const value = snapshot();
    value.providerStatus.dataforseo = { status: "partial", source: "DataForSEO", kind: "live", configured: true, note: "DataForSEO task failed for secret-seed-query: provider detail" };
    value.keywordResearch = { trendSignals: 0, serpTasks: 9, trackedTopTen: 2 };
    value.ga4 = { organicLandingPages: [{ page: "https://truenorthmap.ca/organizations", sessions: 4, engagedSessions: 3, keyEvents: 2, engagementSeconds: 91 }], aiReferrals: [], acquisitionChannels: [{ label: "Organic Search", sessions: 4 }], referralCategories: [{ label: "AI assistants", sessions: 2 }], clickEvents: [{ label: "tnm_content_view", events: 3 }] };
    value.searchConsole.totals = { clicks: 37, impressions: 3_209, ctr: 37 / 3_209, position: 16.2 };
    value.searchConsole.daily = [{ label: "2026-07-20", clicks: 37, impressions: 3_209 }];
    const summary = createDashboardSummary(value);
    const serialized = JSON.stringify(summary);
    expect(summary.schemaVersion).toBe("tnm_visibility_dashboard_summary_v2");
    expect(summary.metrics.organicImpressions).toBe(3_209);
    expect(summary.metrics.organicCtr).toBeCloseTo(37 / 3_209, 4);
    expect(summary.coverage).toMatchObject({ available: 3, partial: 1, score: 91 });
    expect(summary.pageOpportunities[0]).toMatchObject({ path: "/organizations", kind: "ctr" });
    expect(summary.actions.some((action) => action.type === "technical")).toBe(true);
    expect(summary.actions.some((action) => action.type === "ctr")).toBe(true);
    expect(summary.insights.length).toBeGreaterThan(0);
    expect(summary.signals).toMatchObject({ dataForSeoSerpTasks: 9, dataForSeoTrackedTopTen: 2 });
    expect(summary.audience).toMatchObject({ acquisitionChannels: [{ label: "Organic Search", sessions: 4 }], organicLandingPages: [{ path: "/organizations", keyEvents: 2 }] });
    expect(summary.diagnostics?.searchCompleteness).toMatchObject({ totalImpressions: 3_209, queryAttributedImpressions: 150, pageTotalsAvailable: false });
    expect(serialized).not.toContain("canadian defence technology companies");
    expect(serialized).not.toContain("secret-seed-query");
    expect(serialized).not.toContain("/admin/");
  });

  it("preserves the complete sanitized aggregate set instead of truncating display rows", () => {
    const value = snapshot();
    value.searchConsole.queries = Array.from({ length: 20 }, (_, index) => ({ query: `query-${index}`, page: `https://truenorthmap.ca/public-${index}`, clicks: 1, impressions: 1, ctr: 1, position: 1 }));
    value.searchConsole.generativeAiAvailable = true;
    value.ga4.acquisitionChannels = Array.from({ length: 20 }, (_, index) => ({ label: `channel-${index}`, sessions: index + 1 }));
    value.technical.pages = Array.from({ length: 20 }, (_, index) => ({ url: `https://truenorthmap.ca/public-${index}`, status: 200, title: `Page ${index}`, description: "Description", canonical: `https://truenorthmap.ca/public-${index}`, jsonLdCount: 1, issues: [] }));
    value.backlinks = [];
    const summary = createDashboardSummary(value);
    expect(summary.pageOpportunities).toHaveLength(20);
    expect(summary.audience.acquisitionChannels).toHaveLength(20);
    expect(summary.actions).toHaveLength(0);
  });

  it("aggregates public pages and weights position by impressions", () => {
    const value = snapshot();
    value.searchConsole.queries.push({ query: "second private query", page: "https://truenorthmap.ca/organizations", clicks: 0, impressions: 50, ctr: 0, position: 19 });
    expect(weightedAveragePosition(value.searchConsole.queries)).toBe(10);
    expect(aggregateSearchPages(value)[0]).toMatchObject({ path: "/organizations", impressions: 200, position: 10 });
  });

  it("uses total and page-only Search Console aggregates before privacy-filtered query rows", () => {
    const value = snapshot();
    value.searchConsole.totals = { clicks: 37, impressions: 3_209, ctr: 37 / 3_209, position: 16.2 };
    value.searchConsole.pages = [{ path: "/organizations", clicks: 11, impressions: 2_100, ctr: 11 / 2_100, position: 9.4 }];
    expect(snapshotTotals(value)).toMatchObject({ clicks: 37, impressions: 3_209, position: 16.2 });
    expect(aggregateSearchPages(value)).toEqual([{ path: "/organizations", clicks: 11, impressions: 2_100, ctr: 11 / 2_100, position: 9.4 }]);
  });

  it("keeps an explicitly empty page-only result authoritative", () => {
    const value = snapshot();
    value.searchConsole.pages = [];
    expect(aggregateSearchPages(value)).toEqual([]);
    expect(snapshotTotals(value)).toMatchObject({ clicks: 0, impressions: 0, position: null });
    expect(createDashboardSummary(value).diagnostics?.searchCompleteness.pageTotalsAvailable).toBe(true);
  });

  it("reports query attribution share only from the dedicated query-only set", () => {
    const value = snapshot();
    value.searchConsole.totals = { clicks: 10, impressions: 100, ctr: 0.1, position: 10 };
    value.searchConsole.queries = [
      { query: "multi page", page: "https://truenorthmap.ca/organizations", clicks: 10, impressions: 100, ctr: 0.1, position: 8 },
      { query: "multi page", page: "https://truenorthmap.ca/capabilities", clicks: 10, impressions: 100, ctr: 0.1, position: 12 },
    ];
    expect(createDashboardSummary(value).diagnostics?.searchCompleteness.queryAttributedImpressionShare).toBeNull();
    value.searchConsole.queryAttributed = { clicks: 7, impressions: 80 };
    expect(createDashboardSummary(value).diagnostics?.searchCompleteness.queryAttributedImpressionShare).toBe(0.8);
  });

  it("surfaces a consent-safe organic-attribution measurement gap", () => {
    const value = snapshot();
    value.searchConsole.totals = { clicks: 12, impressions: 500, ctr: 0.024, position: 9 };
    value.ga4.organicLandingPages = [];
    const summary = createDashboardSummary(value);
    expect(summary.insights.some((item) => item.title === "Organic attribution is missing from GA4")).toBe(true);
    expect(summary.actions.some((item) => item.title === "Reconcile search clicks with GA4 organic attribution")).toBe(true);
  });

  it("accepts GA4 relative public landing paths in the sanitized audience projection", () => {
    const value = snapshot();
    value.ga4.organicLandingPages = [{ page: "/organizations", sessions: 4 }];
    expect(createDashboardSummary(value).audience.organicLandingPages).toEqual([{ path: "/organizations", sessions: 4, engagedSessions: 0, keyEvents: 0, engagementSeconds: 0 }]);
  });

  it("rebuckets legacy referrer labels and drops invalid AI-referral dates", () => {
    const value = snapshot();
    value.ga4.referralCategories = [{ label: "private-referrer.example/path", sessions: 7 }, { label: "Search engines", sessions: 2 }];
    value.ga4.aiReferralDaily = [{ label: "not-a-date", sessions: 99 }, { label: "2026-07-20", sessions: 3 }];
    const summary = createDashboardSummary(value);
    expect(summary.audience.referralCategories).toEqual([{ label: "Other referrals", sessions: 7 }, { label: "Search engines", sessions: 2 }]);
    expect(summary.audience.aiReferralDaily).toEqual([{ label: "2026-07-20", sessions: 3 }]);
    expect(JSON.stringify(summary)).not.toContain("private-referrer.example");
  });

  it("counts metadata completeness as an intersection, not the smaller independent count", () => {
    const value = snapshot();
    value.technical.pages = [
      { url: "https://truenorthmap.ca/one", status: 200, title: "One", canonical: "https://truenorthmap.ca/one", jsonLdCount: 1, issues: [] },
      { url: "https://truenorthmap.ca/two", status: 200, description: "Two", canonical: "https://truenorthmap.ca/two", jsonLdCount: 1, issues: [] },
    ];
    expect(createDashboardSummary(value).diagnostics?.technicalReadiness).toMatchObject({ titledRoutes: 1, describedRoutes: 1, metadataCompleteRoutes: 0, metadataRate: 0 });
  });

  it("skips same-day retries when choosing a comparison baseline", () => {
    const current = snapshot();
    current.collectedAt = "2026-07-25T12:00:00.000Z";
    const retry = snapshot();
    retry.collectedAt = "2026-07-25T11:00:00.000Z";
    const priorDay = snapshot();
    priorDay.collectedAt = "2026-07-24T11:00:00.000Z";
    expect(selectPriorSnapshot(current, [retry, priorDay])?.collectedAt).toBe(priorDay.collectedAt);
  });

  it("skips a prior collection for the same finalized Search Console window", () => {
    const current = snapshot();
    current.collectedAt = "2026-07-26T22:00:00.000Z";
    current.searchConsole.period = { startDate: "2026-06-28", endDate: "2026-07-22" };
    const sameWindow = snapshot();
    sameWindow.collectedAt = "2026-07-25T00:00:00.000Z";
    sameWindow.searchConsole.period = { startDate: "2026-06-28", endDate: "2026-07-22" };
    const earlierWindow = snapshot();
    earlierWindow.collectedAt = "2026-07-24T00:00:00.000Z";
    earlierWindow.searchConsole.period = { startDate: "2026-06-27", endDate: "2026-07-21" };
    expect(selectPriorSnapshot(current, [sameWindow, earlierWindow])?.collectedAt).toBe(earlierWindow.collectedAt);
  });

  it("separates configured-live readiness from the wider optional portfolio", () => {
    const value = snapshot();
    for (const status of Object.values(value.providerStatus)) Object.assign(status, { kind: "live", configured: true });
    value.providerStatus.bing = { status: "unavailable", source: "fixture", kind: "live", configured: false };
    value.providerStatus.ahrefs = { status: "unavailable", source: "fixture", kind: "import", configured: false };
    const summary = createDashboardSummary(value);
    expect(summary.coverage.configuredLive).toMatchObject({ total: 3, available: 3, blocking: 0, score: 100 });
    expect(summary.coverage.score).toBe(60);
    expect(summary.actions.some((action) => action.title.includes("provider"))).toBe(false);
  });

  it("keeps the visibility implementation isolated from Supabase", async () => {
    const [collector, contract] = await Promise.all([
      readFile(new URL("../scripts/tnm-visibility.ts", import.meta.url), "utf8"),
      readFile(new URL("../src/lib/visibility/contract.ts", import.meta.url), "utf8"),
    ]);
    expect(`${collector}\n${contract}`).not.toMatch(/@supabase|createClient\(|SUPABASE_(URL|KEY)|execute_sql/i);
    expect(collector).toMatch(/rangeDays - 1/);
    expect(collector).toMatch(/site_url = @site/);
    expect(collector).toMatch(/ExportLog/);
  });

  it("collects providers only during refresh and keeps report lenses snapshot-only", async () => {
    const collector = await readFile(new URL("../scripts/tnm-visibility.ts", import.meta.url), "utf8");
    expect(collector).toContain('refreshProviders: command === "refresh"');
    expect(collector).toMatch(/const snapshot = options\.refreshProviders\s*\? await loadSnapshot\(options\)\s*:\s*history\[0\]/);
    expect(collector).toContain("if (options.refreshProviders) writes.push(writeJsonAtomic");
    expect(collector).toContain("requires an existing private visibility snapshot. Run refresh first.");
    expect(collector).toContain("--refresh-technical is retired");
    expect(collector).toContain("DEFAULT_LAUNCH_PATHS");
    expect(collector).toContain('inspectionScope: "bounded_core_v1"');
    expect(collector).toContain("Full-site audit not run; that remains explicit-only through tnm-site-assurance.");
    expect(collector).toContain("technicalPressureSignalLimit = 3");
    expect(collector).toContain("technicalRequestSpacingMs = 1_000");
    expect(collector).toContain("technicalManifestReady(snapshot.technical)");
    expect(collector).toContain("technicalPageSuccessful(page)");
    expect(collector).toContain("inspectionAttempted: false");
    expect(collector).toContain("attemptedTechnicalPages.length");
    expect(collector).toContain("Not inspected after the technical pressure circuit opened");
    expect(collector).not.toContain("routeAuditConcurrency");
    expect(collector).not.toContain("complete public-route audit");
    expect(collector).not.toContain("mapWithConcurrency(sitemapUrls");
  });
});
