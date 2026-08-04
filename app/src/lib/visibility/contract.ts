export const visibilitySnapshotVersion = "visibility_snapshot_v1" as const;
export const visibilityReportVersion = "visibility_report_v1" as const;
export const visibilityDashboardSummaryVersion = "tnm_visibility_dashboard_summary_v2" as const;

export type ProviderStatus = "available" | "unavailable" | "stale" | "partial";

export type ProviderSummary = {
  status: ProviderStatus;
  collectedAt?: string;
  source: string;
  rangeDays?: number;
  note?: string;
};

export type SearchQueryMetric = {
  query: string;
  page?: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type SearchPageMetric = {
  path: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number | null;
};

export type TechnicalPage = {
  url: string;
  status: number | null;
  title?: string;
  description?: string;
  canonical?: string;
  jsonLdCount: number;
  issues: string[];
};

export type WebPerformance = {
  url: string;
  strategy: "mobile" | "desktop";
  source: "pagespeed";
  collectedAt: string;
  performanceScore: number | null;
  lcpMs: number | null;
  inpMs: number | null;
  cls: number | null;
  fieldDataAvailable: boolean;
};

export type AggregateMetric = { label: string; clicks?: number; impressions?: number; sessions?: number; engagedSessions?: number; keyEvents?: number; engagementSeconds?: number; lcpMs?: number | null; inpMs?: number | null; cls?: number | null };

export type VisibilitySnapshotV1 = {
  schemaVersion: typeof visibilitySnapshotVersion;
  collectedAt: string;
  siteUrl: string;
  rangeDays: number;
  providerStatus: Record<string, ProviderSummary>;
  searchConsole: {
    queries: SearchQueryMetric[];
    generativeAiAvailable: boolean;
    daily?: AggregateMetric[];
    devices?: AggregateMetric[];
    countries?: AggregateMetric[];
    searchAppearances?: AggregateMetric[];
    generativeAi?: { impressions: number; clicks: number; pages: number; collectedAt: string };
    bulkExport?: { rows: number; collectedAt: string };
  };
  ga4: {
    organicLandingPages: Array<{ page: string; sessions: number; engagedSessions?: number; keyEvents?: number; engagementSeconds?: number }>;
    aiReferrals: Array<{ source: string; sessions: number }>;
    acquisitionChannels?: AggregateMetric[];
    referralCategories?: AggregateMetric[];
    clickEvents?: AggregateMetric[];
  };
  bing?: { searchRows: SearchQueryMetric[]; crawlStats?: AggregateMetric[]; backlinkCount?: number };
  ahrefs?: { organicKeywords: number; siteAuditIssues: number; internalLinkSuggestions: number };
  keywordResearch?: { trendSignals: number; serpTasks: number; trackedTopTen: number; dataForSeoNewTasks?: number; dataForSeoActualCostUsd?: number };
  technical: {
    robotsUrl: string;
    sitemapUrl: string;
    sitemapCount: number;
    pages: TechnicalPage[];
    pageSpeed?: WebPerformance;
    cruxHistory?: AggregateMetric[];
  };
  backlinks: Array<{
    domain: string;
    targetUrl?: string;
    source: "bing" | "ahrefs" | "dataforseo";
    relevance?: "high" | "medium" | "low";
    note?: string;
  }>;
};

export type VisibilityOpportunity = {
  type: "ctr" | "position" | "content" | "internal_link" | "technical" | "earned_link";
  priority: "high" | "medium" | "low";
  confidence: "confirmed" | "inferred";
  target: string;
  rationale: string;
};

export type VisibilityDashboardAction = {
  id: string;
  type: VisibilityOpportunity["type"] | "monitor";
  priority: VisibilityOpportunity["priority"];
  confidence: VisibilityOpportunity["confidence"];
  title: string;
  targetPath?: string;
  rationale: string;
  ownerType: "developer" | "editor_reviewer" | "product_owner" | "human_outreach_owner";
  impact: "high" | "medium" | "low";
  effort: "small" | "medium" | "large";
  verification: string;
};

export type DashboardInsight = {
  id: string;
  type: "change" | "opportunity" | "risk" | "coverage" | "aeo";
  state: "positive" | "attention" | "monitor";
  title: string;
  whyItMatters: string;
  nextAction: string;
  confidence: "confirmed" | "inferred";
  targetPath?: string;
};

export type DashboardPageOpportunity = SearchPageMetric & {
  kind: "ctr" | "position" | "emerging" | "monitor";
  observation: string;
};

export type VisibilityDashboardSummaryV2 = {
  schemaVersion: typeof visibilityDashboardSummaryVersion;
  collectedAt: string;
  rangeDays: number;
  providerStatus: Record<string, Pick<ProviderSummary, "status" | "source" | "collectedAt" | "rangeDays" | "note">>;
  metrics: {
    publicRouteSample: number;
    technicalIssueCount: number;
    organicClicks: number;
    organicImpressions: number;
    organicCtr: number | null;
    averagePosition: number | null;
    organicSessions: number;
    engagedOrganicSessions: number;
    aiReferralSessions: number;
    performanceScore: number | null;
    lcpMs: number | null;
    inpMs: number | null;
    cls: number | null;
    organicKeyEvents: number;
    organicEngagementSeconds: number;
  };
  trend: {
    clicksDelta: number | null;
    impressionsDelta: number | null;
    sessionsDelta: number | null;
    technicalIssuesDelta: number | null;
    averagePositionDelta: number | null;
    providerChanges: string[];
    comparable?: boolean;
    note?: string;
  };
  coverage: {
    available: number;
    partial: number;
    stale: number;
    unavailable: number;
    score: number;
  };
  signals: {
    ctrOpportunityCount: number;
    positionOpportunityCount: number;
    emergingPageCount: number;
    earnedLinkSignalCount: number;
    generativeAiPerformanceAvailable: boolean;
    bingSearchRows: number;
    ahrefsOrganicKeywords: number;
    dataForSeoSerpTasks: number;
    dataForSeoTrackedTopTen: number;
    bingCrawlDays: number;
    bingBacklinkCount: number;
    cruxHistoryPeriods: number;
    gscBulkExportRows: number;
  };
  audience: {
    acquisitionChannels: AggregateMetric[];
    referralCategories: AggregateMetric[];
    clickEvents: AggregateMetric[];
    organicLandingPages: Array<{ path: string; sessions: number; engagedSessions: number; keyEvents: number; engagementSeconds: number }>;
    searchDaily: AggregateMetric[];
    searchDevices: AggregateMetric[];
    searchCountries: AggregateMetric[];
    searchAppearances: AggregateMetric[];
  };
  performanceHistory: AggregateMetric[];
  pageOpportunities: DashboardPageOpportunity[];
  insights: DashboardInsight[];
  actions: VisibilityDashboardAction[];
};

export function isPublicTnmUrl(value: string, siteUrl = "https://truenorthmap.ca") {
  try {
    const url = new URL(value);
    const site = new URL(siteUrl);
    if (url.origin !== site.origin) return false;
    return !["/admin", "/account", "/api", "/auth", "/collections", "/connect", "/sign-in", "/submit"].some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`));
  } catch {
    return false;
  }
}

export function isStale(collectedAt: string | undefined, now = new Date(), maxAgeDays = 8) {
  if (!collectedAt) return true;
  const timestamp = new Date(collectedAt).getTime();
  return !Number.isFinite(timestamp) || now.getTime() - timestamp > maxAgeDays * 86_400_000;
}

function dashboardPath(value: string | undefined, siteUrl: string) {
  if (!value || !isPublicTnmUrl(value, siteUrl)) return undefined;
  return new URL(value).pathname;
}

function stableId(parts: string[]) {
  let hash = 5381;
  for (const character of parts.join("|").toLowerCase()) hash = (hash * 33) ^ character.charCodeAt(0);
  return `tnm-${(hash >>> 0).toString(36)}`;
}

export function aggregateSearchPages(snapshot: VisibilitySnapshotV1): SearchPageMetric[] {
  const grouped = new Map<string, { clicks: number; impressions: number; weightedPosition: number }>();
  for (const row of snapshot.searchConsole.queries) {
    const path = dashboardPath(row.page, snapshot.siteUrl);
    if (!path) continue;
    const current = grouped.get(path) ?? { clicks: 0, impressions: 0, weightedPosition: 0 };
    current.clicks += row.clicks;
    current.impressions += row.impressions;
    current.weightedPosition += row.position > 0 ? row.position * row.impressions : 0;
    grouped.set(path, current);
  }
  return [...grouped.entries()].map(([path, value]) => ({
    path,
    clicks: value.clicks,
    impressions: value.impressions,
    ctr: value.impressions ? value.clicks / value.impressions : 0,
    position: value.impressions ? Number((value.weightedPosition / value.impressions).toFixed(1)) : null,
  })).sort((a, b) => b.impressions - a.impressions || a.path.localeCompare(b.path));
}

export function weightedAveragePosition(rows: SearchQueryMetric[]) {
  const eligible = rows.filter((row) => row.impressions > 0 && row.position > 0);
  const impressions = eligible.reduce((total, row) => total + row.impressions, 0);
  if (!impressions) return null;
  return eligible.reduce((total, row) => total + row.position * row.impressions, 0) / impressions;
}

export function deriveOpportunities(snapshot: VisibilitySnapshotV1): VisibilityOpportunity[] {
  const opportunities: VisibilityOpportunity[] = [];
  for (const page of aggregateSearchPages(snapshot)) {
    if (page.impressions >= 20 && page.ctr < 0.03) opportunities.push({
      type: "ctr", priority: page.impressions >= 100 ? "high" : "medium", confidence: "confirmed", target: page.path,
      rationale: `${page.path} has ${page.impressions} impressions but ${(page.ctr * 100).toFixed(1)}% CTR; review the visible result promise and opening answer.`,
    });
    if (page.impressions >= 5 && page.position !== null && page.position >= 4 && page.position <= 20) opportunities.push({
      type: "position", priority: page.position <= 10 ? "high" : "medium", confidence: "confirmed", target: page.path,
      rationale: `${page.path} averages position ${page.position.toFixed(1)} with existing impressions; strengthen the existing public answer before creating a new page.`,
    });
  }
  for (const page of snapshot.technical.pages) for (const issue of page.issues) opportunities.push({
    type: "technical",
    priority: /non-2xx|missing title|missing canonical/i.test(issue) ? "high" : "medium",
    confidence: "confirmed",
    target: page.url,
    rationale: issue,
  });
  for (const link of snapshot.backlinks) if (link.relevance === "high") opportunities.push({
    type: "earned_link", priority: "medium", confidence: "inferred", target: link.domain,
    rationale: link.note ?? `Review whether ${link.domain} could editorially reference a useful public TNM page; do not automate outreach.`,
  });
  const weight = { high: 0, medium: 1, low: 2 } as const;
  return opportunities.sort((a, b) => weight[a.priority] - weight[b.priority]);
}

function snapshotTotals(snapshot: VisibilitySnapshotV1) {
  const clicks = snapshot.searchConsole.queries.reduce((total, row) => total + row.clicks, 0);
  const impressions = snapshot.searchConsole.queries.reduce((total, row) => total + row.impressions, 0);
  const sessions = snapshot.ga4.organicLandingPages.reduce((total, row) => total + row.sessions, 0);
  const technicalIssues = snapshot.technical.pages.reduce((total, page) => total + page.issues.length, 0);
  return { clicks, impressions, sessions, technicalIssues, position: weightedAveragePosition(snapshot.searchConsole.queries) };
}

export function compareSnapshots(current: VisibilitySnapshotV1, prior: VisibilitySnapshotV1) {
  const next = snapshotTotals(current);
  const previous = snapshotTotals(prior);
  const comparable = current.rangeDays === prior.rangeDays && ["searchConsole", "ga4", "pageSpeed"].every((name) => current.providerStatus[name]?.status === "available" && prior.providerStatus[name]?.status === "available");
  const note = comparable ? undefined : current.rangeDays !== prior.rangeDays
    ? `Not comparable: current range is ${current.rangeDays} days and prior range is ${prior.rangeDays} days.`
    : "Not comparable: a primary provider was unavailable, partial, or stale in one of the snapshots.";
  return {
    comparable,
    note,
    clicksDelta: comparable ? next.clicks - previous.clicks : null,
    impressionsDelta: comparable ? next.impressions - previous.impressions : null,
    sessionsDelta: comparable ? next.sessions - previous.sessions : null,
    technicalIssuesDelta: comparable ? next.technicalIssues - previous.technicalIssues : null,
    averagePositionDelta: comparable && next.position !== null && previous.position !== null ? Number((next.position - previous.position).toFixed(1)) : null,
    providerChanges: Object.keys(current.providerStatus).filter((provider) => current.providerStatus[provider]?.status !== prior.providerStatus[provider]?.status),
  };
}

function pageOpportunities(snapshot: VisibilitySnapshotV1): DashboardPageOpportunity[] {
  return aggregateSearchPages(snapshot).filter((page) => page.impressions >= 3).map((page) => {
    let kind: DashboardPageOpportunity["kind"] = "monitor";
    let observation = "Early visibility signal; keep collecting comparable data before changing the page.";
    if (page.impressions >= 20 && page.ctr < 0.03) {
      kind = "ctr";
      observation = "Meaningful exposure with weak click-through; inspect the search-result promise and answer opening.";
    } else if (page.position !== null && page.position >= 4 && page.position <= 20 && page.impressions >= 5) {
      kind = "position";
      observation = "Already relevant and within reach; strengthen evidence, answer structure, and useful internal links.";
    } else if (page.position !== null && page.position <= 30) {
      kind = "emerging";
      observation = "Emerging public-page relevance; monitor and improve only where the page already answers the intent.";
    }
    return { ...page, kind, observation };
  }).sort((a, b) => {
    const kindWeight = { ctr: 0, position: 1, emerging: 2, monitor: 3 } as const;
    return kindWeight[a.kind] - kindWeight[b.kind] || b.impressions - a.impressions;
  }).slice(0, 8);
}

function makeAction(action: Omit<VisibilityDashboardAction, "id"> & { idParts: string[] }): VisibilityDashboardAction {
  const { idParts, ...rest } = action;
  return { id: stableId(idParts), ...rest };
}

/** The only typed payload permitted to leave the ignored visibility workspace. */
export function createDashboardSummary(snapshot: VisibilitySnapshotV1, prior: VisibilitySnapshotV1 | null = null): VisibilityDashboardSummaryV2 {
  const totals = snapshotTotals(snapshot);
  const pages = pageOpportunities(snapshot);
  const comparison = prior ? compareSnapshots(snapshot, prior) : null;
  const providerValues = Object.values(snapshot.providerStatus);
  const coverage = {
    available: providerValues.filter((item) => item.status === "available").length,
    partial: providerValues.filter((item) => item.status === "partial").length,
    stale: providerValues.filter((item) => item.status === "stale").length,
    unavailable: providerValues.filter((item) => item.status === "unavailable").length,
    score: providerValues.length ? Math.round(providerValues.reduce((total, item) => total + ({ available: 1, partial: .65, stale: .35, unavailable: 0 }[item.status]), 0) / providerValues.length * 100) : 0,
  };

  const technicalActions = snapshot.technical.pages.flatMap((page) => page.issues.map((issue) => ({ page, issue }))).flatMap(({ page, issue }) => {
    const targetPath = dashboardPath(page.url, snapshot.siteUrl);
    if (!targetPath) return [];
    const high = /non-2xx|missing title|missing canonical/i.test(issue);
    return [makeAction({ idParts: ["technical", targetPath, issue], type: "technical", priority: high ? "high" : "medium", confidence: "confirmed", title: high ? "Repair public-route indexability" : "Improve public-route discoverability", targetPath, rationale: issue, ownerType: "developer", impact: high ? "high" : "medium", effort: "small", verification: "Recheck the exact public route after deployment and confirm the issue is absent in the next technical snapshot." })];
  }).slice(0, 4);

  const searchActions = pages.filter((page) => page.kind === "ctr" || page.kind === "position").slice(0, 4).map((page) => makeAction({
    idParts: [page.kind, page.path], type: page.kind === "ctr" ? "ctr" : "position", priority: page.position !== null && page.position <= 10 ? "high" : "medium", confidence: "confirmed",
    title: page.kind === "ctr" ? "Improve the search-result promise" : "Strengthen an already relevant public answer", targetPath: page.path, rationale: page.observation,
    ownerType: "editor_reviewer", impact: page.impressions >= 20 ? "high" : "medium", effort: "medium", verification: "Compare a like-for-like 28-day window after the reviewed page change is live.",
  }));

  const monitorActions: VisibilityDashboardAction[] = [];
  if (coverage.unavailable || coverage.stale) monitorActions.push(makeAction({ idParts: ["monitor", "coverage"], type: "monitor", priority: "medium", confidence: "confirmed", title: "Restore incomplete visibility evidence", rationale: `${coverage.unavailable} providers are unavailable and ${coverage.stale} are stale. Missing evidence is unknown, not zero.`, ownerType: "product_owner", impact: "medium", effort: "small", verification: "The next sanitized snapshot should show a newer collection time and improved coverage score." }));
  if (!snapshot.searchConsole.generativeAiAvailable) monitorActions.push(makeAction({ idParts: ["monitor", "aeo"], type: "monitor", priority: "low", confidence: "inferred", title: "Monitor answer-engine evidence without inventing rank", rationale: "No dedicated generative-AI performance report is available. Use aggregate AI referrals and a dated manual prompt panel only as directional evidence.", ownerType: "editor_reviewer", impact: "medium", effort: "small", verification: "Record the next manual panel date and measured aggregate AI-referral count; keep raw transcripts local." }));

  const linkActions = snapshot.backlinks.filter((link) => link.relevance === "high").slice(0, 2).map((link) => makeAction({ idParts: ["earned-link", link.domain], type: "earned_link", priority: "medium", confidence: "inferred", title: "Review a reader-useful earned-reference opportunity", rationale: "A credible referring-domain signal is available. Identify one source-backed TNM page that would help its readers; do not automate outreach.", ownerType: "human_outreach_owner", impact: "medium", effort: "medium", verification: "A human records whether a relevant editorial reference was earned; no automated outreach or link scheme is permitted." }));
  const actions = [...technicalActions, ...searchActions, ...monitorActions, ...linkActions].slice(0, 12);

  const insights: DashboardInsight[] = [];
  if (comparison?.comparable && comparison.impressionsDelta !== null && comparison.impressionsDelta !== 0) insights.push({ id: stableId(["insight", "impressions", snapshot.collectedAt]), type: "change", state: comparison.impressionsDelta > 0 ? "positive" : "attention", title: comparison.impressionsDelta > 0 ? "Search exposure increased" : "Search exposure declined", whyItMatters: `Organic impressions changed by ${comparison.impressionsDelta > 0 ? "+" : ""}${comparison.impressionsDelta} versus the prior comparable snapshot.`, nextAction: "Confirm provider coverage is comparable, then inspect the page-level opportunity table before changing content.", confidence: "confirmed" });
  if (pages[0]) insights.push({ id: stableId(["insight", "page", pages[0].path]), type: "opportunity", state: pages[0].kind === "monitor" ? "monitor" : "positive", title: "A public page is earning early search visibility", whyItMatters: `${pages[0].path} has ${pages[0].impressions} aggregate impressions at position ${pages[0].position ?? "unknown"}.`, nextAction: pages[0].observation, confidence: "confirmed", targetPath: pages[0].path });
  if (totals.technicalIssues) insights.push({ id: stableId(["insight", "technical", String(totals.technicalIssues)]), type: "risk", state: "attention", title: "Technical defects should be cleared first", whyItMatters: `${totals.technicalIssues} issues were observed across ${snapshot.technical.pages.length} sampled public routes.`, nextAction: "Resolve confirmed indexability defects before commissioning speculative content.", confidence: "confirmed" });
  insights.push({ id: stableId(["insight", "coverage", String(coverage.score)]), type: "coverage", state: coverage.score >= 70 ? "positive" : "attention", title: `Evidence coverage is ${coverage.score}%`, whyItMatters: "Provider freshness determines whether zeros and trends can be interpreted safely.", nextAction: coverage.score >= 70 ? "Use current data while preserving source dates and scope." : "Restore unavailable or stale read-only inputs before broad conclusions.", confidence: "confirmed" });
  if (!snapshot.searchConsole.generativeAiAvailable) insights.push({ id: stableId(["insight", "aeo", "monitor"]), type: "aeo", state: "monitor", title: "AEO evidence remains directional", whyItMatters: "Standard search data and aggregate AI referrals do not prove answer-engine citation or rank.", nextAction: "Improve answer clarity, source provenance, entity consistency, dates, and internal links on strategically important pages.", confidence: "inferred" });

  const performance = snapshot.technical.pageSpeed;
  return {
    schemaVersion: visibilityDashboardSummaryVersion,
    collectedAt: snapshot.collectedAt,
    rangeDays: snapshot.rangeDays,
    providerStatus: snapshot.providerStatus,
    metrics: {
      publicRouteSample: snapshot.technical.pages.length,
      technicalIssueCount: totals.technicalIssues,
      organicClicks: totals.clicks,
      organicImpressions: totals.impressions,
      organicCtr: totals.impressions ? Number((totals.clicks / totals.impressions).toFixed(4)) : null,
      averagePosition: totals.position === null ? null : Number(totals.position.toFixed(1)),
      organicSessions: totals.sessions,
      engagedOrganicSessions: snapshot.ga4.organicLandingPages.reduce((total, page) => total + (page.engagedSessions ?? 0), 0),
      aiReferralSessions: snapshot.ga4.aiReferrals.reduce((total, referral) => total + referral.sessions, 0),
      performanceScore: performance?.performanceScore ?? null,
      lcpMs: performance?.lcpMs ?? null,
      inpMs: performance?.inpMs ?? null,
      cls: performance?.cls ?? null,
      organicKeyEvents: snapshot.ga4.organicLandingPages.reduce((total, page) => total + (page.keyEvents ?? 0), 0),
      organicEngagementSeconds: snapshot.ga4.organicLandingPages.reduce((total, page) => total + (page.engagementSeconds ?? 0), 0),
    },
    trend: {
      clicksDelta: comparison?.clicksDelta ?? null,
      impressionsDelta: comparison?.impressionsDelta ?? null,
      sessionsDelta: comparison?.sessionsDelta ?? null,
      technicalIssuesDelta: comparison?.technicalIssuesDelta ?? null,
      averagePositionDelta: comparison?.averagePositionDelta ?? null,
      providerChanges: comparison?.providerChanges ?? [],
      comparable: comparison?.comparable ?? false,
      note: comparison?.note,
    },
    coverage,
    signals: {
      ctrOpportunityCount: pages.filter((page) => page.kind === "ctr").length,
      positionOpportunityCount: pages.filter((page) => page.kind === "position").length,
      emergingPageCount: pages.filter((page) => page.kind === "emerging").length,
      earnedLinkSignalCount: snapshot.backlinks.filter((link) => link.relevance === "high").length,
      generativeAiPerformanceAvailable: snapshot.searchConsole.generativeAiAvailable,
      bingSearchRows: snapshot.bing?.searchRows.length ?? 0,
      ahrefsOrganicKeywords: snapshot.ahrefs?.organicKeywords ?? 0,
      dataForSeoSerpTasks: snapshot.keywordResearch?.serpTasks ?? 0,
      dataForSeoTrackedTopTen: snapshot.keywordResearch?.trackedTopTen ?? 0,
      bingCrawlDays: snapshot.bing?.crawlStats?.length ?? 0,
      bingBacklinkCount: snapshot.bing?.backlinkCount ?? 0,
      cruxHistoryPeriods: snapshot.technical.cruxHistory?.length ?? 0,
      gscBulkExportRows: snapshot.searchConsole.bulkExport?.rows ?? 0,
    },
    audience: {
      acquisitionChannels: (snapshot.ga4.acquisitionChannels ?? []).slice(0, 8),
      referralCategories: (snapshot.ga4.referralCategories ?? []).slice(0, 8),
      clickEvents: (snapshot.ga4.clickEvents ?? []).slice(0, 8),
      organicLandingPages: snapshot.ga4.organicLandingPages.flatMap((page) => {
        const path = dashboardPath(page.page, snapshot.siteUrl);
        return path ? [{ path, sessions: page.sessions, engagedSessions: page.engagedSessions ?? 0, keyEvents: page.keyEvents ?? 0, engagementSeconds: page.engagementSeconds ?? 0 }] : [];
      }).sort((a, b) => b.sessions - a.sessions).slice(0, 8),
      searchDaily: (snapshot.searchConsole.daily ?? []).slice(-90),
      searchDevices: (snapshot.searchConsole.devices ?? []).slice(0, 8),
      searchCountries: (snapshot.searchConsole.countries ?? []).slice(0, 8),
      searchAppearances: (snapshot.searchConsole.searchAppearances ?? []).slice(0, 8),
    },
    performanceHistory: (snapshot.technical.cruxHistory ?? []).slice(-40),
    pageOpportunities: pages,
    insights: insights.slice(0, 6),
    actions,
  };
}
