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
  configured?: boolean;
  kind?: "live" | "import";
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
  inspectionAttempted?: boolean;
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

export type AggregateMetric = { label: string; clicks?: number; impressions?: number; sessions?: number; events?: number; engagedSessions?: number; keyEvents?: number; engagementSeconds?: number; lcpMs?: number | null; inpMs?: number | null; cls?: number | null };

export type GscBulkExportSummary = {
  rows: number;
  impressions?: number;
  clicks?: number;
  averagePosition?: number | null;
  nonAnonymizedQueries?: number;
  anonymizedImpressions?: number;
  anonymizedClicks?: number;
  exportedDays?: number;
  siteExportedDays?: number;
  urlExportedDays?: number;
  firstDate?: string;
  latestDate?: string;
  siteLatestDate?: string;
  urlLatestDate?: string;
  collectedAt: string;
};

export type DataForSeoIntentGroup = { id: string; tasks: number; trackedTopTen: number };
export type DataForSeoFeatures = { aiOverviewTasks: number; aiOverviewResolvedTasks: number; peopleAlsoAskTasks: number; featuredSnippetTasks: number; videoTasks: number; relatedSearchesTasks: number; tnmInAiOverviewTasks: number | null };

export type VisibilitySnapshotV1 = {
  schemaVersion: typeof visibilitySnapshotVersion;
  collectedAt: string;
  siteUrl: string;
  rangeDays: number;
  providerStatus: Record<string, ProviderSummary>;
  searchConsole: {
    queries: SearchQueryMetric[];
    queryRows?: SearchQueryMetric[];
    queryAttributed?: { clicks: number; impressions: number };
    pages?: SearchPageMetric[];
    totals?: { clicks: number; impressions: number; ctr: number; position: number | null };
    period?: { startDate: string; endDate: string };
    generativeAiAvailable: boolean;
    daily?: AggregateMetric[];
    devices?: AggregateMetric[];
    countries?: AggregateMetric[];
    searchAppearances?: AggregateMetric[];
    generativeAi?: { impressions: number; clicks: number; pages: number; collectedAt: string };
    bulkExport?: GscBulkExportSummary;
  };
  ga4: {
    organicLandingPages: Array<{ page: string; sessions: number; engagedSessions?: number; keyEvents?: number; engagementSeconds?: number }>;
    aiReferrals: Array<{ source: string; sessions: number }>;
    acquisitionChannels?: AggregateMetric[];
    referralCategories?: AggregateMetric[];
    clickEvents?: AggregateMetric[];
    aiReferralDaily?: AggregateMetric[];
  };
  bing?: { searchRows: SearchQueryMetric[]; crawlStats?: AggregateMetric[]; backlinkCount?: number };
  ahrefs?: { organicKeywords: number; siteAuditIssues: number; internalLinkSuggestions: number };
  keywordResearch?: { trendSignals: number; serpTasks: number; trackedTopTen: number; dataForSeoNewTasks?: number; dataForSeoActualCostUsd?: number; intentGroups?: DataForSeoIntentGroup[]; features?: DataForSeoFeatures };
  technical: {
    robotsUrl: string;
    sitemapUrl: string;
    sitemapCount: number;
    pages: TechnicalPage[];
    collectedAt?: string;
    sitemapDigest?: string;
    reused?: boolean;
    inspectionScope?: "bounded_core_v1" | "full_sitemap_legacy";
    robotsStatus?: number | null;
    sitemapStatus?: number | null;
    robotsDeclaresSitemap?: boolean;
    manifestIssue?: string;
    circuitOpen?: boolean;
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

export type DashboardRouteFamily = {
  label: string;
  routes: number;
  issues: number;
  structuredDataRoutes: number;
  technicalEligibilityRoutes: number;
  impressions: number;
  clicks: number;
};

export type DashboardOpportunityBucket = {
  label: DashboardPageOpportunity["kind"];
  pages: number;
  impressions: number;
  clicks: number;
};

export type DashboardQuestionDemand = {
  label: string;
  queries: number;
  impressions: number;
  clicks: number;
};

export type DashboardDiagnostics = {
  window: { startDate?: string; endDate?: string; priorCollectedAt?: string; priorWindowEnd?: string };
  searchCompleteness: {
    totalImpressions: number;
    totalClicks: number;
    queryAttributedImpressions: number;
    queryAttributedClicks: number;
    queryAttributedImpressionShare: number | null;
    pageTotalsAvailable: boolean;
    bulkRows: number;
    bulkImpressions: number;
    bulkClicks: number;
    bulkNonAnonymizedQueries: number;
    bulkAnonymizedImpressions: number;
    bulkAnonymizedClicks: number;
    bulkExportedDays: number;
    bulkSiteExportedDays: number;
    bulkUrlExportedDays: number;
    bulkFirstDate?: string;
    bulkLatestDate?: string;
    bulkSiteLatestDate?: string;
    bulkUrlLatestDate?: string;
  };
  searchMomentum: {
    recentStart?: string;
    recentEnd?: string;
    recentImpressions: number;
    priorImpressions: number;
    recentClicks: number;
    priorClicks: number;
    impressionChangeRate: number | null;
    clickChangeRate: number | null;
  };
  technicalReadiness: {
    totalRoutes: number;
    successfulRoutes: number;
    titledRoutes: number;
    describedRoutes: number;
    metadataCompleteRoutes: number;
    canonicalRoutes: number;
    structuredDataRoutes: number;
    technicalEligibilityRoutes: number;
    successRate: number | null;
    metadataRate: number | null;
    canonicalRate: number | null;
    structuredDataRate: number | null;
    technicalEligibilityRate: number | null;
  };
  aeo: {
    aiReferralSessions: number;
    categorizedReferralSessions: number;
    aiReferralShare: number | null;
    contentViewEvents: number;
    sourceOpenEvents: number;
    sourceOpenRate: number | null;
    generativeAiImpressions: number | null;
    generativeAiClicks: number | null;
    generativeAiPages: number | null;
    dataForSeoAiOverviewTasks: number;
    dataForSeoAiOverviewResolvedTasks: number;
    dataForSeoPeopleAlsoAskTasks: number;
    dataForSeoFeaturedSnippetTasks: number;
    dataForSeoVideoTasks: number;
    dataForSeoRelatedSearchesTasks: number;
    dataForSeoTnmInAiOverviewTasks: number | null;
    dataForSeoSeedTasks: number;
    dataForSeoTrackedTopTen: number;
  };
  routeFamilies: DashboardRouteFamily[];
  opportunityPortfolio: DashboardOpportunityBucket[];
  questionDemand: DashboardQuestionDemand[];
  seedIntentGroups: DataForSeoIntentGroup[];
};

export type VisibilityDashboardSummaryV2 = {
  schemaVersion: typeof visibilityDashboardSummaryVersion;
  collectedAt: string;
  rangeDays: number;
  providerStatus: Record<string, ProviderSummary>;
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
    priorCollectedAt?: string;
  };
  coverage: {
    available: number;
    partial: number;
    stale: number;
    unavailable: number;
    score: number;
    configuredLive?: { total: number; available: number; resolvedUnknown: number; blocking: number; score: number };
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
    aiReferralDaily: AggregateMetric[];
  };
  performanceHistory: AggregateMetric[];
  diagnostics?: DashboardDiagnostics;
  pageOpportunities: DashboardPageOpportunity[];
  insights: DashboardInsight[];
  actions: VisibilityDashboardAction[];
};

export function isPublicTnmUrl(value: string, siteUrl = "https://truenorthmap.ca") {
  try {
    const url = new URL(value);
    const site = new URL(siteUrl);
    if (url.origin !== site.origin) return false;
    const pathname = decodeURIComponent(url.pathname).replace(/\/{2,}/g, "/");
    return !["/admin", "/account", "/api", "/auth", "/collections", "/connect", "/dev", "/sign-in", "/submit"].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  } catch {
    return false;
  }
}

export function selectBoundedTechnicalUrls(
  sitemapUrls: string[],
  requiredPaths: readonly string[],
  siteUrl = "https://truenorthmap.ca"
) {
  const publicUrls = [...new Set(sitemapUrls.filter((url) => isPublicTnmUrl(url, siteUrl)))];
  if (!publicUrls.length) throw new Error("The public sitemap did not contain any valid True North Map URLs.");
  const sitemapPaths = new Set(publicUrls.map((url) => new URL(url).pathname));
  const missingPaths = requiredPaths.filter((pathname) => !sitemapPaths.has(pathname));
  if (missingPaths.length) throw new Error(`The public sitemap is missing bounded visibility routes: ${missingPaths.join(", ")}.`);
  return requiredPaths.map((pathname) => new URL(pathname, siteUrl).toString());
}

export function technicalManifestReady(technical: VisibilitySnapshotV1["technical"]) {
  return (technical.robotsStatus ?? 0) >= 200
    && (technical.robotsStatus ?? 0) < 300
    && (technical.sitemapStatus ?? 0) >= 200
    && (technical.sitemapStatus ?? 0) < 300
    && technical.robotsDeclaresSitemap === true
    && technical.sitemapCount > 0
    && !technical.manifestIssue;
}

export function technicalPageSuccessful(page: TechnicalPage) {
  return page.status !== null && page.status >= 200 && page.status < 300;
}

const knownAiAssistantHosts = [
  "chatgpt.com",
  "chat.openai.com",
  "perplexity.ai",
  "claude.ai",
  "gemini.google.com",
  "bard.google.com",
  "copilot.microsoft.com",
  "poe.com",
  "you.com",
  "phind.com",
  "grok.com",
  "meta.ai",
  "chat.mistral.ai",
] as const;

/** Strict hostname classifier for consent-safe aggregate AI referral reporting. */
export function isKnownAiReferralSource(value: string) {
  const normalized = value.trim().toLowerCase().replace(/^https?:\/\//, "").split(/[/?#]/, 1)[0].replace(/^www\./, "").replace(/:\d+$/, "");
  return knownAiAssistantHosts.some((host) => normalized === host || normalized.endsWith(`.${host}`));
}

export function isStale(collectedAt: string | undefined, now = new Date(), maxAgeDays = 8) {
  if (!collectedAt) return true;
  const timestamp = new Date(collectedAt).getTime();
  return !Number.isFinite(timestamp) || now.getTime() - timestamp > maxAgeDays * 86_400_000;
}

function dashboardPath(value: string | undefined, siteUrl: string) {
  if (!value) return undefined;
  let resolved: string;
  try { resolved = new URL(value, siteUrl).href; } catch { return undefined; }
  if (!isPublicTnmUrl(resolved, siteUrl)) return undefined;
  try { return decodeURIComponent(new URL(resolved).pathname).replace(/\/{2,}/g, "/"); }
  catch { return undefined; }
}

function stableId(parts: string[]) {
  let hash = 5381;
  for (const character of parts.join("|").toLowerCase()) hash = (hash * 33) ^ character.charCodeAt(0);
  return `tnm-${(hash >>> 0).toString(36)}`;
}

export function aggregateSearchPages(snapshot: VisibilitySnapshotV1): SearchPageMetric[] {
  const grouped = new Map<string, { clicks: number; impressions: number; weightedPosition: number }>();
  if (snapshot.searchConsole.pages !== undefined) {
    for (const page of snapshot.searchConsole.pages) {
      let publicUrl: string;
      try { publicUrl = new URL(page.path, snapshot.siteUrl).href; } catch { continue; }
      const path = dashboardPath(publicUrl, snapshot.siteUrl);
      if (!path) continue;
      const current = grouped.get(path) ?? { clicks: 0, impressions: 0, weightedPosition: 0 };
      current.clicks += page.clicks;
      current.impressions += page.impressions;
      current.weightedPosition += page.position !== null && page.position > 0 ? page.position * page.impressions : 0;
      grouped.set(path, current);
    }
  } else {
  for (const row of snapshot.searchConsole.queries) {
    const path = dashboardPath(row.page, snapshot.siteUrl);
    if (!path) continue;
    const current = grouped.get(path) ?? { clicks: 0, impressions: 0, weightedPosition: 0 };
    current.clicks += row.clicks;
    current.impressions += row.impressions;
    current.weightedPosition += row.position > 0 ? row.position * row.impressions : 0;
    grouped.set(path, current);
  }
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

export function snapshotTotals(snapshot: VisibilitySnapshotV1) {
  const dailyClicks = (snapshot.searchConsole.daily ?? []).reduce((total, row) => total + (row.clicks ?? 0), 0);
  const dailyImpressions = (snapshot.searchConsole.daily ?? []).reduce((total, row) => total + (row.impressions ?? 0), 0);
  const pageRows = aggregateSearchPages(snapshot);
  const pageTotalsAvailable = snapshot.searchConsole.pages !== undefined;
  const pageClicks = pageRows.reduce((total, row) => total + row.clicks, 0);
  const pageImpressions = pageRows.reduce((total, row) => total + row.impressions, 0);
  const queryClicks = snapshot.searchConsole.queries.reduce((total, row) => total + row.clicks, 0);
  const queryImpressions = snapshot.searchConsole.queries.reduce((total, row) => total + row.impressions, 0);
  const clicks = snapshot.searchConsole.totals?.clicks ?? (snapshot.searchConsole.daily?.length ? dailyClicks : pageTotalsAvailable ? pageClicks : queryClicks);
  const impressions = snapshot.searchConsole.totals?.impressions ?? (snapshot.searchConsole.daily?.length ? dailyImpressions : pageTotalsAvailable ? pageImpressions : queryImpressions);
  const sessions = snapshot.ga4.organicLandingPages.reduce((total, row) => total + row.sessions, 0);
  const technicalIssues = snapshot.technical.pages.reduce((total, page) => total + page.issues.length, 0);
  const position = snapshot.searchConsole.totals?.position ?? (pageTotalsAvailable ? weightedPagePosition(pageRows) : weightedAveragePosition(snapshot.searchConsole.queries));
  return { clicks, impressions, sessions, technicalIssues, position };
}

function weightedPagePosition(rows: SearchPageMetric[]) {
  const eligible = rows.filter((row) => row.impressions > 0 && row.position !== null && row.position > 0);
  const impressions = eligible.reduce((total, row) => total + row.impressions, 0);
  if (!impressions) return null;
  return eligible.reduce((total, row) => total + (row.position ?? 0) * row.impressions, 0) / impressions;
}

function primaryEvidenceAvailable(snapshot: VisibilitySnapshotV1) {
  return ["searchConsole", "ga4", "pageSpeed"].every((name) => snapshot.providerStatus[name]?.status === "available");
}

/** Avoids presenting retries or a second report from the same day as trend evidence. */
export function selectPriorSnapshot(current: VisibilitySnapshotV1, candidates: VisibilitySnapshotV1[], minimumHours = 20) {
  const currentTime = new Date(current.collectedAt).getTime();
  const eligible = candidates.filter((candidate) => {
    const candidateTime = new Date(candidate.collectedAt).getTime();
    const sameCollectedDay = candidate.collectedAt.slice(0, 10) === current.collectedAt.slice(0, 10);
    const sameFinalizedWindow = Boolean(current.searchConsole.period?.endDate && candidate.searchConsole.period?.endDate
      && current.searchConsole.period.endDate === candidate.searchConsole.period.endDate);
    return candidate.collectedAt !== current.collectedAt && Number.isFinite(candidateTime) && Number.isFinite(currentTime)
      && !sameCollectedDay && !sameFinalizedWindow
      && currentTime - candidateTime >= minimumHours * 3_600_000 && candidate.rangeDays === current.rangeDays;
  });
  return eligible.find(primaryEvidenceAvailable) ?? eligible[0] ?? null;
}

export function compareSnapshots(current: VisibilitySnapshotV1, prior: VisibilitySnapshotV1) {
  const next = snapshotTotals(current);
  const previous = snapshotTotals(prior);
  const comparable = current.rangeDays === prior.rangeDays && ["searchConsole", "ga4", "pageSpeed"].every((name) => current.providerStatus[name]?.status === "available" && prior.providerStatus[name]?.status === "available");
  const currentTechnicalUrls = [...new Set(current.technical.pages.map((page) => page.url))].sort();
  const priorTechnicalUrls = [...new Set(prior.technical.pages.map((page) => page.url))].sort();
  const technicalComparable = current.technical.inspectionScope === prior.technical.inspectionScope
    && currentTechnicalUrls.length === priorTechnicalUrls.length
    && currentTechnicalUrls.every((url, index) => url === priorTechnicalUrls[index]);
  const note = comparable ? undefined : current.rangeDays !== prior.rangeDays
    ? `Not comparable: current range is ${current.rangeDays} days and prior range is ${prior.rangeDays} days.`
    : "Not comparable: a primary provider was unavailable, partial, or stale in one of the snapshots.";
  return {
    comparable,
    note,
    clicksDelta: comparable ? next.clicks - previous.clicks : null,
    impressionsDelta: comparable ? next.impressions - previous.impressions : null,
    sessionsDelta: comparable ? next.sessions - previous.sessions : null,
    technicalIssuesDelta: comparable && technicalComparable ? next.technicalIssues - previous.technicalIssues : null,
    averagePositionDelta: comparable && next.position !== null && previous.position !== null ? Number((next.position - previous.position).toFixed(1)) : null,
    providerChanges: Object.keys(current.providerStatus).filter((provider) => current.providerStatus[provider]?.status !== prior.providerStatus[provider]?.status),
    priorCollectedAt: prior.collectedAt,
  };
}

function pageOpportunities(snapshot: VisibilitySnapshotV1): DashboardPageOpportunity[] {
  return aggregateSearchPages(snapshot).map((page) => {
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
  });
}

function makeAction(action: Omit<VisibilityDashboardAction, "id"> & { idParts: string[] }): VisibilityDashboardAction {
  const { idParts, ...rest } = action;
  return { id: stableId(idParts), ...rest };
}

function ratio(part: number, whole: number) {
  return whole > 0 ? Number((part / whole).toFixed(4)) : null;
}

function technicalReadiness(snapshot: VisibilitySnapshotV1) {
  const pages = snapshot.technical.pages;
  const successfulRoutes = pages.filter((page) => page.status !== null && page.status >= 200 && page.status < 300).length;
  const titledRoutes = pages.filter((page) => Boolean(page.title?.trim())).length;
  const describedRoutes = pages.filter((page) => Boolean(page.description?.trim())).length;
  const metadataCompleteRoutes = pages.filter((page) => Boolean(page.title?.trim()) && Boolean(page.description?.trim())).length;
  const canonicalRoutes = pages.filter((page) => Boolean(page.canonical?.trim())).length;
  const structuredDataRoutes = pages.filter((page) => page.jsonLdCount > 0).length;
  const technicalEligibilityRoutes = pages.filter((page) => page.status !== null && page.status >= 200 && page.status < 300 && page.title?.trim() && page.description?.trim() && page.canonical?.trim() && page.jsonLdCount > 0).length;
  const totalRoutes = pages.length;
  return {
    totalRoutes,
    successfulRoutes,
    titledRoutes,
    describedRoutes,
    metadataCompleteRoutes,
    canonicalRoutes,
    structuredDataRoutes,
    technicalEligibilityRoutes,
    successRate: ratio(successfulRoutes, totalRoutes),
    metadataRate: ratio(metadataCompleteRoutes, totalRoutes),
    canonicalRate: ratio(canonicalRoutes, totalRoutes),
    structuredDataRate: ratio(structuredDataRoutes, totalRoutes),
    technicalEligibilityRate: ratio(technicalEligibilityRoutes, totalRoutes),
  };
}

const routeFamilyLabels = new Set(["organizations", "capabilities", "demand", "signals", "briefs", "regions", "missions"]);
function routeFamily(pathname: string) {
  const segment = pathname.split("/").filter(Boolean)[0] ?? "home";
  return routeFamilyLabels.has(segment) ? segment : segment === "home" ? "home" : "other";
}

function routeFamilyDiagnostics(snapshot: VisibilitySnapshotV1, pages: DashboardPageOpportunity[]): DashboardRouteFamily[] {
  const grouped = new Map<string, DashboardRouteFamily>();
  for (const page of snapshot.technical.pages) {
    const pathname = dashboardPath(page.url, snapshot.siteUrl);
    if (!pathname) continue;
    const label = routeFamily(pathname);
    const current = grouped.get(label) ?? { label, routes: 0, issues: 0, structuredDataRoutes: 0, technicalEligibilityRoutes: 0, impressions: 0, clicks: 0 };
    current.routes += 1;
    current.issues += page.issues.length;
    if (page.jsonLdCount > 0) current.structuredDataRoutes += 1;
    if (page.status !== null && page.status >= 200 && page.status < 300 && page.title?.trim() && page.description?.trim() && page.canonical?.trim() && page.jsonLdCount > 0) current.technicalEligibilityRoutes += 1;
    grouped.set(label, current);
  }
  for (const page of pages) {
    const label = routeFamily(page.path);
    const current = grouped.get(label) ?? { label, routes: 0, issues: 0, structuredDataRoutes: 0, technicalEligibilityRoutes: 0, impressions: 0, clicks: 0 };
    current.impressions += page.impressions;
    current.clicks += page.clicks;
    grouped.set(label, current);
  }
  return [...grouped.values()].sort((a, b) => b.impressions - a.impressions || b.routes - a.routes || a.label.localeCompare(b.label));
}

function opportunityPortfolio(pages: DashboardPageOpportunity[]): DashboardOpportunityBucket[] {
  return (["ctr", "position", "emerging", "monitor"] as const).map((label) => {
    const matching = pages.filter((page) => page.kind === label);
    return { label, pages: matching.length, impressions: matching.reduce((total, page) => total + page.impressions, 0), clicks: matching.reduce((total, page) => total + page.clicks, 0) };
  });
}

function searchMomentum(snapshot: VisibilitySnapshotV1): DashboardDiagnostics["searchMomentum"] {
  const daily = [...(snapshot.searchConsole.daily ?? [])].filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.label)).sort((a, b) => a.label.localeCompare(b.label));
  const recent = daily.slice(-7);
  const prior = daily.slice(-14, -7);
  const sum = (rows: AggregateMetric[], field: "clicks" | "impressions") => rows.reduce((total, row) => total + (row[field] ?? 0), 0);
  const recentImpressions = sum(recent, "impressions");
  const priorImpressions = sum(prior, "impressions");
  const recentClicks = sum(recent, "clicks");
  const priorClicks = sum(prior, "clicks");
  return {
    recentStart: recent[0]?.label,
    recentEnd: recent.at(-1)?.label,
    recentImpressions,
    priorImpressions,
    recentClicks,
    priorClicks,
    impressionChangeRate: prior.length === 7 && priorImpressions > 0 ? Number(((recentImpressions - priorImpressions) / priorImpressions).toFixed(4)) : null,
    clickChangeRate: prior.length === 7 && priorClicks > 0 ? Number(((recentClicks - priorClicks) / priorClicks).toFixed(4)) : null,
  };
}

function questionDemand(snapshot: VisibilitySnapshotV1): DashboardQuestionDemand[] {
  const buckets = new Map<string, { queries: Set<string>; impressions: number; clicks: number }>();
  for (const row of snapshot.searchConsole.queryRows ?? snapshot.searchConsole.queries) {
    const query = row.query.trim().toLowerCase();
    const match = query.match(/^(who|what|where|when|why|how|which|can|could|does|do|is|are|should|best)\b/);
    if (!match) continue;
    const label = ["can", "could", "does", "do", "is", "are", "should"].includes(match[1]) ? "decision questions" : match[1] === "best" ? "comparison questions" : `${match[1]} questions`;
    const current = buckets.get(label) ?? { queries: new Set<string>(), impressions: 0, clicks: 0 };
    current.queries.add(query);
    current.impressions += row.impressions;
    current.clicks += row.clicks;
    buckets.set(label, current);
  }
  return [...buckets.entries()].map(([label, value]) => ({ label, queries: value.queries.size, impressions: value.impressions, clicks: value.clicks }))
    .filter((item) => item.queries >= 5 || item.impressions >= 20)
    .sort((a, b) => b.impressions - a.impressions || b.queries - a.queries);
}

function eventCount(snapshot: VisibilitySnapshotV1, label: string) {
  const row = (snapshot.ga4.clickEvents ?? []).find((item) => item.label === label);
  return row?.events ?? row?.sessions ?? 0;
}

const dashboardProviderLabels = {
  searchConsole: "Google Search Console",
  ga4: "GA4",
  bing: "Bing Webmaster",
  ahrefs: "Ahrefs import",
  dataforseo: "DataForSEO",
  pageSpeed: "PageSpeed Insights",
  cruxHistory: "CrUX History",
  gscBulkExport: "Search Console BigQuery export",
  trends: "Google Trends import",
} as const;

function safeDashboardProviderNote(provider: ProviderSummary) {
  const note = provider.note ?? "";
  if (/no eligible origin\/page data|no eligible.*dataset/i.test(note)) return "No eligible CrUX field dataset is currently available; this is unknown, not zero.";
  if (/initial Search Console tables are still pending|first-48-hour|warm-up/i.test(note)) return "Search Console BigQuery is within the documented initial-table warm-up.";
  if (provider.configured === false) return provider.kind === "import" ? "Optional dated import is not present." : "Optional live provider is not configured.";
  if (provider.status === "partial") return "The configured provider refresh did not complete; retained current evidence is incomplete.";
  if (provider.status === "stale") return "The retained provider evidence is older than the current reporting threshold.";
  if (provider.status === "unavailable") return "The provider did not return current evidence; this is unknown, not zero.";
  return undefined;
}

function sanitizedProviderStatus(snapshot: VisibilitySnapshotV1) {
  return Object.fromEntries(Object.entries(dashboardProviderLabels).flatMap(([key, source]) => {
    const provider = snapshot.providerStatus[key];
    if (!provider) return [];
    return [[key, {
      status: provider.status,
      source,
      rangeDays: provider.rangeDays,
      collectedAt: provider.collectedAt,
      configured: provider.configured,
      kind: provider.kind,
      note: safeDashboardProviderNote(provider),
    } satisfies ProviderSummary]];
  }));
}

const dashboardReferralCategories = new Set(["AI assistants", "Search engines", "Social networks", "Direct", "Other referrals"]);
function sanitizedReferralCategories(rows: AggregateMetric[] | undefined) {
  const totals = new Map<string, number>();
  for (const row of rows ?? []) {
    const label = dashboardReferralCategories.has(row.label) ? row.label : "Other referrals";
    totals.set(label, (totals.get(label) ?? 0) + (row.sessions ?? 0));
  }
  return [...totals].map(([label, sessions]) => ({ label, sessions }));
}

function canonicalDailySessions(rows: AggregateMetric[] | undefined) {
  const totals = new Map<string, number>();
  for (const row of rows ?? []) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.label)) continue;
    const parsed = new Date(`${row.label}T00:00:00.000Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== row.label) continue;
    totals.set(row.label, (totals.get(row.label) ?? 0) + (row.sessions ?? 0));
  }
  return [...totals].sort(([left], [right]) => left.localeCompare(right)).map(([label, sessions]) => ({ label, sessions }));
}

/** The only typed payload permitted to leave the ignored visibility workspace. */
export function createDashboardSummary(snapshot: VisibilitySnapshotV1, prior: VisibilitySnapshotV1 | null = null): VisibilityDashboardSummaryV2 {
  const totals = snapshotTotals(snapshot);
  const pages = pageOpportunities(snapshot);
  const comparison = prior ? compareSnapshots(snapshot, prior) : null;
  const providerStatus = sanitizedProviderStatus(snapshot);
  const providerValues = Object.values(providerStatus);
  const configuredLiveProviders = providerValues.filter((item) => item.kind === "live" && item.configured !== false);
  const resolvedUnknown = configuredLiveProviders.filter((item) => item.status !== "available" && /no eligible.*dataset|initial-table warm-up/i.test(item.note ?? "")).length;
  const configuredLiveAvailable = configuredLiveProviders.filter((item) => item.status === "available").length;
  const configuredLiveBlocking = configuredLiveProviders.length - configuredLiveAvailable - resolvedUnknown;
  const coverage = {
    available: providerValues.filter((item) => item.status === "available").length,
    partial: providerValues.filter((item) => item.status === "partial").length,
    stale: providerValues.filter((item) => item.status === "stale").length,
    unavailable: providerValues.filter((item) => item.status === "unavailable").length,
    score: providerValues.length ? Math.round(providerValues.reduce((total, item) => total + ({ available: 1, partial: .65, stale: .35, unavailable: 0 }[item.status]), 0) / providerValues.length * 100) : 0,
    configuredLive: configuredLiveProviders.length ? {
      total: configuredLiveProviders.length,
      available: configuredLiveAvailable,
      resolvedUnknown,
      blocking: configuredLiveBlocking,
      score: Math.round((configuredLiveAvailable + resolvedUnknown) / configuredLiveProviders.length * 100),
    } : undefined,
  };

  const technicalActions = snapshot.technical.pages.flatMap((page) => page.issues.map((issue) => ({ page, issue }))).flatMap(({ page, issue }) => {
    const targetPath = dashboardPath(page.url, snapshot.siteUrl);
    if (!targetPath) return [];
    const high = /non-2xx|missing title|missing canonical/i.test(issue);
    return [makeAction({ idParts: ["technical", targetPath, issue], type: "technical", priority: high ? "high" : "medium", confidence: "confirmed", title: high ? "Repair public-route indexability" : "Improve public-route discoverability", targetPath, rationale: issue, ownerType: "developer", impact: high ? "high" : "medium", effort: "small", verification: "Recheck the exact public route after deployment and confirm the issue is absent in the next technical snapshot." })];
  });

  const searchActions = pages.filter((page) => page.kind === "ctr" || page.kind === "position").map((page) => makeAction({
    idParts: [page.kind, page.path], type: page.kind === "ctr" ? "ctr" : "position", priority: page.position !== null && page.position <= 10 ? "high" : "medium", confidence: "confirmed",
    title: page.kind === "ctr" ? "Improve the search-result promise" : "Strengthen an already relevant public answer", targetPath: page.path, rationale: page.observation,
    ownerType: "editor_reviewer", impact: page.impressions >= 20 ? "high" : "medium", effort: "medium", verification: "Compare a like-for-like 28-day window after the reviewed page change is live.",
  }));

  const monitorActions: VisibilityDashboardAction[] = [];
  if (coverage.configuredLive?.blocking) monitorActions.push(makeAction({ idParts: ["monitor", "coverage"], type: "monitor", priority: "medium", confidence: "confirmed", title: "Restore incomplete configured-provider evidence", rationale: `${coverage.configuredLive.blocking} configured live providers are blocking a complete evidence picture. Missing evidence is unknown, not zero.`, ownerType: "product_owner", impact: "medium", effort: "small", verification: "The next strict snapshot should resolve every configured provider or preserve only an explicitly recognized no-data state." }));
  if (snapshot.searchConsole.totals && totals.clicks > 0 && totals.sessions === 0 && snapshot.providerStatus.searchConsole?.status === "available" && snapshot.providerStatus.ga4?.status === "available") monitorActions.push(makeAction({ idParts: ["monitor", "organic-attribution"], type: "monitor", priority: "medium", confidence: "confirmed", title: "Reconcile search clicks with GA4 organic attribution", rationale: `Search Console recorded ${totals.clicks} clicks while consent-safe GA4 returned no Organic Search landing-page sessions. The scopes differ, but the gap prevents an attributed search journey.`, ownerType: "product_owner", impact: "medium", effort: "small", verification: "Review consent mode, channel grouping, landing-page capture, and analytics collection; confirm a later consent-safe GA4 report returns correctly categorized organic rows without inspecting individual visitors." }));
  if (!snapshot.searchConsole.generativeAiAvailable) monitorActions.push(makeAction({ idParts: ["monitor", "aeo"], type: "monitor", priority: "low", confidence: "inferred", title: "Monitor answer-engine evidence without inventing rank", rationale: "No dedicated generative-AI performance report is available. Use aggregate AI referrals and a dated manual prompt panel only as directional evidence.", ownerType: "editor_reviewer", impact: "medium", effort: "small", verification: "Record the next manual panel date and measured aggregate AI-referral count; keep raw transcripts local." }));

  const performanceActions: VisibilityDashboardAction[] = [];
  const performance = snapshot.technical.pageSpeed;
  if ((performance?.performanceScore ?? 100) < 90 || (performance?.lcpMs ?? 0) > 2_500) performanceActions.push(makeAction({
    idParts: ["technical", "mobile-performance"], type: "technical", priority: (performance?.performanceScore ?? 100) < 70 ? "high" : "medium", confidence: "confirmed", title: "Improve the mobile loading path", targetPath: "/",
    rationale: `The current mobile lab run scored ${performance?.performanceScore ?? "unknown"} with ${performance?.lcpMs === null || performance?.lcpMs === undefined ? "unknown" : `${Math.round(performance.lcpMs)} ms`} LCP. This is lab evidence until CrUX becomes eligible.`,
    ownerType: "developer", impact: "medium", effort: "medium", verification: "Re-run mobile PageSpeed after a reviewed change and use CrUX p75 only when field data becomes eligible.",
  }));

  const linkActions = snapshot.backlinks.filter((link) => link.relevance === "high").map((link) => makeAction({ idParts: ["earned-link", link.domain], type: "earned_link", priority: "medium", confidence: "inferred", title: "Review a reader-useful earned-reference opportunity", rationale: "A credible referring-domain signal is available. Identify one source-backed TNM page that would help its readers; do not automate outreach.", ownerType: "human_outreach_owner", impact: "medium", effort: "medium", verification: "A human records whether a relevant editorial reference was earned; no automated outreach or link scheme is permitted." }));
  const actions = [...technicalActions, ...performanceActions, ...searchActions, ...monitorActions, ...linkActions];

  const readiness = technicalReadiness(snapshot);
  const queryAttributedImpressions = snapshot.searchConsole.queryAttributed?.impressions ?? snapshot.searchConsole.queries.reduce((total, row) => total + row.impressions, 0);
  const queryAttributedClicks = snapshot.searchConsole.queryAttributed?.clicks ?? snapshot.searchConsole.queries.reduce((total, row) => total + row.clicks, 0);
  const bulk = snapshot.searchConsole.bulkExport;
  const categorizedReferralSessions = (snapshot.ga4.referralCategories ?? []).reduce((total, row) => total + (row.sessions ?? 0), 0);
  const aiReferralSessions = snapshot.ga4.aiReferrals.reduce((total, referral) => total + referral.sessions, 0);
  const contentViewEvents = eventCount(snapshot, "tnm_content_view");
  const sourceOpenEvents = eventCount(snapshot, "tnm_external_source_open");
  const dataForSeoFeatures = snapshot.keywordResearch?.features;
  const diagnostics: DashboardDiagnostics = {
    window: {
      startDate: snapshot.searchConsole.period?.startDate,
      endDate: snapshot.searchConsole.period?.endDate,
      priorCollectedAt: prior?.collectedAt,
      priorWindowEnd: prior?.searchConsole.period?.endDate,
    },
    searchCompleteness: {
      totalImpressions: totals.impressions,
      totalClicks: totals.clicks,
      queryAttributedImpressions,
      queryAttributedClicks,
      queryAttributedImpressionShare: snapshot.searchConsole.queryAttributed ? ratio(queryAttributedImpressions, totals.impressions) : null,
      pageTotalsAvailable: snapshot.searchConsole.pages !== undefined,
      bulkRows: bulk?.rows ?? 0,
      bulkImpressions: bulk?.impressions ?? 0,
      bulkClicks: bulk?.clicks ?? 0,
      bulkNonAnonymizedQueries: bulk?.nonAnonymizedQueries ?? 0,
      bulkAnonymizedImpressions: bulk?.anonymizedImpressions ?? 0,
      bulkAnonymizedClicks: bulk?.anonymizedClicks ?? 0,
      bulkExportedDays: bulk?.exportedDays ?? 0,
      bulkSiteExportedDays: bulk?.siteExportedDays ?? 0,
      bulkUrlExportedDays: bulk?.urlExportedDays ?? 0,
      bulkFirstDate: bulk?.firstDate,
      bulkLatestDate: bulk?.latestDate,
      bulkSiteLatestDate: bulk?.siteLatestDate,
      bulkUrlLatestDate: bulk?.urlLatestDate,
    },
    searchMomentum: searchMomentum(snapshot),
    technicalReadiness: readiness,
    aeo: {
      aiReferralSessions,
      categorizedReferralSessions,
      aiReferralShare: ratio(aiReferralSessions, categorizedReferralSessions),
      contentViewEvents,
      sourceOpenEvents,
      sourceOpenRate: ratio(sourceOpenEvents, contentViewEvents),
      generativeAiImpressions: snapshot.searchConsole.generativeAi?.impressions ?? null,
      generativeAiClicks: snapshot.searchConsole.generativeAi?.clicks ?? null,
      generativeAiPages: snapshot.searchConsole.generativeAi?.pages ?? null,
      dataForSeoAiOverviewTasks: dataForSeoFeatures?.aiOverviewTasks ?? 0,
      dataForSeoAiOverviewResolvedTasks: dataForSeoFeatures?.aiOverviewResolvedTasks ?? 0,
      dataForSeoPeopleAlsoAskTasks: dataForSeoFeatures?.peopleAlsoAskTasks ?? 0,
      dataForSeoFeaturedSnippetTasks: dataForSeoFeatures?.featuredSnippetTasks ?? 0,
      dataForSeoVideoTasks: dataForSeoFeatures?.videoTasks ?? 0,
      dataForSeoRelatedSearchesTasks: dataForSeoFeatures?.relatedSearchesTasks ?? 0,
      dataForSeoTnmInAiOverviewTasks: dataForSeoFeatures?.tnmInAiOverviewTasks ?? null,
      dataForSeoSeedTasks: snapshot.keywordResearch?.serpTasks ?? 0,
      dataForSeoTrackedTopTen: snapshot.keywordResearch?.trackedTopTen ?? 0,
    },
    routeFamilies: routeFamilyDiagnostics(snapshot, pages),
    opportunityPortfolio: opportunityPortfolio(pages),
    questionDemand: questionDemand(snapshot),
    seedIntentGroups: snapshot.keywordResearch?.intentGroups ?? [],
  };

  const insights: DashboardInsight[] = [];
  if (comparison?.comparable && comparison.impressionsDelta !== null && comparison.impressionsDelta !== 0) insights.push({ id: stableId(["insight", "impressions", snapshot.collectedAt]), type: "change", state: comparison.impressionsDelta > 0 ? "positive" : "attention", title: comparison.impressionsDelta > 0 ? "Search exposure increased" : "Search exposure declined", whyItMatters: `Organic impressions changed by ${comparison.impressionsDelta > 0 ? "+" : ""}${comparison.impressionsDelta} versus the prior comparable snapshot.`, nextAction: "Confirm provider coverage is comparable, then inspect the page-level opportunity table before changing content.", confidence: "confirmed" });
  if (pages[0]) insights.push({ id: stableId(["insight", "page", pages[0].path]), type: "opportunity", state: pages[0].kind === "monitor" ? "monitor" : "positive", title: "A public page is earning early search visibility", whyItMatters: `${pages[0].path} has ${pages[0].impressions} aggregate impressions at position ${pages[0].position ?? "unknown"}.`, nextAction: pages[0].observation, confidence: "confirmed", targetPath: pages[0].path });
  if (totals.technicalIssues) insights.push({ id: stableId(["insight", "technical", String(totals.technicalIssues)]), type: "risk", state: "attention", title: "Technical defects should be cleared first", whyItMatters: `${totals.technicalIssues} issues were observed across ${snapshot.technical.pages.length} inspected public routes.`, nextAction: "Resolve confirmed indexability defects before commissioning speculative content.", confidence: "confirmed" });
  const configuredScore = coverage.configuredLive?.score ?? coverage.score;
  insights.push({ id: stableId(["insight", "coverage", String(configuredScore)]), type: "coverage", state: configuredScore === 100 ? "positive" : "attention", title: `Configured-provider readiness is ${configuredScore}%`, whyItMatters: `The wider evidence portfolio is ${coverage.score}% available, while strict readiness counts only configured live sources and recognized no-data states.`, nextAction: configuredScore === 100 ? "Use current configured evidence while keeping optional inputs explicitly unknown." : "Restore blocking configured providers before broad conclusions.", confidence: "confirmed" });
  if (diagnostics.searchCompleteness.queryAttributedImpressionShare !== null && diagnostics.searchCompleteness.queryAttributedImpressionShare < .8) insights.push({ id: stableId(["insight", "measurement-depth", snapshot.collectedAt]), type: "coverage", state: "monitor", title: "Top-line search totals exceed query-labelled rows", whyItMatters: `Query-labelled rows account for ${(diagnostics.searchCompleteness.queryAttributedImpressionShare * 100).toFixed(0)}% of reported impressions because Search Console withholds anonymized and low-volume query detail.`, nextAction: "Use total and page-only aggregates for visibility decisions; use query detail only as a partial intent sample.", confidence: "confirmed" });
  if (snapshot.searchConsole.totals && totals.clicks > 0 && totals.sessions === 0 && snapshot.providerStatus.searchConsole?.status === "available" && snapshot.providerStatus.ga4?.status === "available") insights.push({ id: stableId(["insight", "organic-attribution", snapshot.collectedAt]), type: "coverage", state: "attention", title: "Organic attribution is missing from GA4", whyItMatters: `Search Console recorded ${totals.clicks} clicks, but the consent-safe GA4 landing-page aggregate returned no Organic Search sessions. These scopes are not a funnel, yet the gap limits journey analysis.`, nextAction: "Verify consent mode, channel grouping, landing-page capture, and analytics collection without inspecting individual visitors.", confidence: "confirmed" });
  if ((dataForSeoFeatures?.aiOverviewTasks ?? 0) > 0) insights.push({ id: stableId(["insight", "ai-overview", snapshot.collectedAt]), type: "aeo", state: dataForSeoFeatures?.tnmInAiOverviewTasks ? "positive" : "monitor", title: "AI Overviews are common in the approved seed panel", whyItMatters: `${dataForSeoFeatures?.aiOverviewTasks ?? 0} of ${snapshot.keywordResearch?.serpTasks ?? 0} Canada/English seed SERPs returned an AI Overview trigger; ${dataForSeoFeatures?.aiOverviewResolvedTasks ?? 0} returned retrievable overview detail.`, nextAction: dataForSeoFeatures?.tnmInAiOverviewTasks === null ? "Keep citation presence unknown until the provider returns resolved references." : "Use the aggregate citation signal alongside page evidence; do not present it as an AI rank.", confidence: "confirmed" });
  if (!snapshot.searchConsole.generativeAiAvailable) insights.push({ id: stableId(["insight", "aeo", "monitor"]), type: "aeo", state: "monitor", title: "Dedicated Google generative visibility remains unknown", whyItMatters: "Google Web totals, DataForSEO SERP features, and corrected aggregate AI referrals are separate signals; none alone proves answer-engine citation rank.", nextAction: "Keep citation evidence, referral evidence, and technical eligibility separate while improving answer clarity and durable sourcing.", confidence: "inferred" });

  return {
    schemaVersion: visibilityDashboardSummaryVersion,
    collectedAt: snapshot.collectedAt,
    rangeDays: snapshot.rangeDays,
    providerStatus,
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
      providerChanges: (comparison?.providerChanges ?? []).filter((provider) => provider in dashboardProviderLabels),
      comparable: comparison?.comparable ?? false,
      note: comparison?.note,
      priorCollectedAt: comparison?.priorCollectedAt,
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
      acquisitionChannels: snapshot.ga4.acquisitionChannels ?? [],
      referralCategories: sanitizedReferralCategories(snapshot.ga4.referralCategories),
      clickEvents: snapshot.ga4.clickEvents ?? [],
      organicLandingPages: snapshot.ga4.organicLandingPages.flatMap((page) => {
        const path = dashboardPath(page.page, snapshot.siteUrl);
        return path ? [{ path, sessions: page.sessions, engagedSessions: page.engagedSessions ?? 0, keyEvents: page.keyEvents ?? 0, engagementSeconds: page.engagementSeconds ?? 0 }] : [];
      }).sort((a, b) => b.sessions - a.sessions),
      searchDaily: snapshot.searchConsole.daily ?? [],
      searchDevices: snapshot.searchConsole.devices ?? [],
      searchCountries: snapshot.searchConsole.countries ?? [],
      searchAppearances: snapshot.searchConsole.searchAppearances ?? [],
      aiReferralDaily: canonicalDailySessions(snapshot.ga4.aiReferralDaily),
    },
    performanceHistory: snapshot.technical.cruxHistory ?? [],
    diagnostics,
    pageOpportunities: pages,
    insights,
    actions,
  };
}
