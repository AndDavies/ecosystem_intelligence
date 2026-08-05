import { createSign } from "node:crypto";
import { mkdir, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  aggregateSearchPages,
  compareSnapshots,
  createDashboardSummary,
  deriveOpportunities,
  isPublicTnmUrl,
  isStale,
  visibilityDashboardSummaryVersion,
  visibilityReportVersion,
  visibilitySnapshotVersion,
  weightedAveragePosition,
  type ProviderSummary,
  type AggregateMetric,
  type SearchQueryMetric,
  type TechnicalPage,
  type VisibilityDashboardSummaryV2,
  type VisibilitySnapshotV1,
  type WebPerformance,
} from "../src/lib/visibility/contract";

const siteUrl = "https://truenorthmap.ca";
const routeAuditConcurrency = 8;
const searchConsolePageSize = 25_000;
const ga4PageSize = 250_000;
const slowProviderTimeoutMs = 120_000;
const fullRunProviders = ["searchConsole", "ga4", "pageSpeed", "cruxHistory", "bing", "dataforseo", "gscBulkExport"] as const;
type FullRunProvider = typeof fullRunProviders[number];
const googleScopes = ["https://www.googleapis.com/auth/webmasters.readonly", "https://www.googleapis.com/auth/analytics.readonly", "https://www.googleapis.com/auth/bigquery.readonly"];

function fullRunProviderConfiguration(): Record<FullRunProvider, boolean> {
  const google = Boolean(process.env.TNM_VISIBILITY_GOOGLE_SERVICE_ACCOUNT_FILE || process.env.TNM_VISIBILITY_GOOGLE_ACCESS_TOKEN);
  return {
    searchConsole: Boolean(google && process.env.TNM_VISIBILITY_GSC_PROPERTY),
    ga4: Boolean(google && process.env.TNM_VISIBILITY_GA4_PROPERTY),
    pageSpeed: Boolean(process.env.TNM_VISIBILITY_PAGESPEED_API_KEY),
    cruxHistory: Boolean(process.env.TNM_VISIBILITY_CRUX_API_KEY || process.env.TNM_VISIBILITY_PAGESPEED_API_KEY),
    bing: Boolean(process.env.TNM_VISIBILITY_BING_API_KEY),
    dataforseo: Boolean(process.env.TNM_VISIBILITY_DATAFORSEO_LOGIN && process.env.TNM_VISIBILITY_DATAFORSEO_PASSWORD),
    gscBulkExport: Boolean(google && process.env.TNM_VISIBILITY_GSC_BULK_PROJECT && process.env.TNM_VISIBILITY_GSC_BULK_DATASET),
  };
}

function gscBulkExportWarmupActive(now = new Date()) {
  const activatedAt = process.env.TNM_VISIBILITY_GSC_BULK_ACTIVATED_AT;
  if (!activatedAt) return false;
  const timestamp = new Date(activatedAt).getTime();
  return Number.isFinite(timestamp) && now.getTime() - timestamp < 48 * 60 * 60 * 1000;
}

function providerBlocksStrictRun(name: FullRunProvider, summary: ProviderSummary | undefined, configured: Record<FullRunProvider, boolean>) {
  if (!configured[name] || summary?.status === "available") return false;
  if (name === "cruxHistory" && /no eligible origin\/page data/i.test(summary?.note ?? "")) return false;
  if (name === "gscBulkExport" && gscBulkExportWarmupActive() && /initial Search Console tables are still pending/i.test(summary?.note ?? "")) return false;
  return true;
}

type Command = "baseline" | "opportunities" | "technical" | "aeo" | "backlinks" | "weekly-report" | "refresh" | "preflight" | "import" | "dashboard-sync" | "validate";
type ImportProvider = "bing" | "ahrefs" | "trends" | "generative-ai" | "gsc-bulk";
type Options = {
  command: Command;
  localDir: string;
  rangeDays: number;
  refreshProviders: boolean;
  skipNetwork: boolean;
  dryRun: boolean;
  strict: boolean;
  importProvider?: ImportProvider;
  importFile?: string;
};

function parseOptions(args: string[]): Options {
  const [command = "baseline", ...rest] = args.filter((value) => value !== "--");
  const commands: Command[] = ["baseline", "opportunities", "technical", "aeo", "backlinks", "weekly-report", "refresh", "preflight", "import", "dashboard-sync", "validate"];
  if (!commands.includes(command as Command)) throw new Error(`Unknown visibility command: ${command}`);
  const options: Options = {
    command: command as Command,
    localDir: path.resolve("../research/visibility/local"),
    rangeDays: 28,
    // Every reporting lens is a fresh, read-only collection by default. A manual
    // command must not silently republish a dashboard view built from old local
    // evidence; imports, preflight, validation, and an explicit dashboard replay
    // remain the only non-collection commands.
    refreshProviders: !["preflight", "import", "validate", "dashboard-sync"].includes(command),
    skipNetwork: false,
    dryRun: false,
    strict: false,
  };
  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];
    if (value === "--refresh-providers") options.refreshProviders = true;
    else if (value === "--skip-network") options.skipNetwork = true;
    else if (value === "--dry-run") options.dryRun = true;
    else if (value === "--strict") options.strict = true;
    else if (value === "--local-dir") options.localDir = path.resolve(rest[++index] ?? "");
    else if (value === "--range-days") options.rangeDays = Number(rest[++index] ?? "28");
    else if (value === "--provider") options.importProvider = rest[++index] as ImportProvider;
    else if (value === "--file") options.importFile = path.resolve(rest[++index] ?? "");
    else throw new Error(`Unknown option: ${value}`);
  }
  if (!Number.isInteger(options.rangeDays) || options.rangeDays < 1 || options.rangeDays > 365) throw new Error("--range-days must be an integer from 1 to 365");
  if (options.command === "import" && (!options.importProvider || !["bing", "ahrefs", "trends", "generative-ai", "gsc-bulk"].includes(options.importProvider) || !options.importFile)) throw new Error("Import requires --provider bing|ahrefs|trends|generative-ai|gsc-bulk and --file <path>.");
  return options;
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try { return JSON.parse(await readFile(filePath, "utf8")) as T; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
}

async function writeJsonAtomic(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, filePath);
}

async function loadLocalEnvironment(localDir: string) {
  try {
    const contents = await readFile(path.join(localDir, ".env"), "utf8");
    const external = new Set(Object.keys(process.env));
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^\s*(TNM_VISIBILITY_[A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!match || external.has(match[1])) continue;
      const value = match[2].replace(/^(["'])(.*)\1$/, "$2");
      if (value) process.env[match[1]] = value;
    }
  } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
}

async function writeProviderArtifact(localDir: string, providerName: string, normalized: unknown, raw: unknown, dryRun: boolean) {
  if (dryRun) return;
  const directory = path.join(localDir, "providers");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  await Promise.all([
    writeJsonAtomic(path.join(directory, `${providerName}.json`), normalized),
    writeJsonAtomic(path.join(directory, `${providerName}-${timestamp}.json`), raw),
  ]);
}

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

let googleTokenCache: { token: string; expiresAt: number } | null = null;
async function googleAccessToken(localDir: string) {
  if (googleTokenCache && googleTokenCache.expiresAt > Date.now() + 60_000) return googleTokenCache.token;
  const serviceAccountFile = process.env.TNM_VISIBILITY_GOOGLE_SERVICE_ACCOUNT_FILE;
  if (!serviceAccountFile) {
    const token = process.env.TNM_VISIBILITY_GOOGLE_ACCESS_TOKEN;
    if (!token) throw new Error("Google read-only credentials are not configured.");
    return token;
  }
  const credentialsPath = path.isAbsolute(serviceAccountFile) ? serviceAccountFile : path.resolve(localDir, serviceAccountFile);
  const credentials = await readJson<{ client_email?: string; private_key?: string; token_uri?: string }>(credentialsPath);
  if (!credentials?.client_email || !credentials.private_key) throw new Error("The local Google service-account file is incomplete.");
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(JSON.stringify({ iss: credentials.client_email, scope: googleScopes.join(" "), aud: credentials.token_uri ?? "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const unsigned = `${header}.${claim}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const assertion = `${unsigned}.${base64url(signer.sign(credentials.private_key))}`;
  const response = await fetch(credentials.token_uri ?? "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!response.ok) throw new Error(`Google service-account token exchange failed: ${response.status}`);
  const body = await response.json() as { access_token?: string; expires_in?: number };
  if (!body.access_token) throw new Error("Google token exchange returned no access token.");
  googleTokenCache = { token: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000 };
  return body.access_token;
}

async function fetchPublic(url: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { redirect: "follow", headers: { "user-agent": "TrueNorthMapVisibility/2.0 (+https://truenorthmap.ca)" }, signal: AbortSignal.timeout(20_000) });
      if (response.status >= 500 && attempt < 2) { await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1))); continue; }
      return { status: response.status, text: await response.text(), url: response.url };
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function mapWithConcurrency<T, R>(values: T[], concurrency: number, run: (value: T, index: number) => Promise<R>) {
  const results = new Array<R>(values.length);
  let nextIndex = 0;
  async function worker() {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= values.length) return;
      results[index] = await run(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, () => worker()));
  return results;
}

function tagAttribute(tag: string, name: string) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1];
}

function inspectPage(url: string, status: number | null, html = ""): TechnicalPage {
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const descriptionTag = metaTags.find((tag) => tagAttribute(tag, "name")?.toLowerCase() === "description");
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
  const canonicalTag = linkTags.find((tag) => tagAttribute(tag, "rel")?.toLowerCase().split(/\s+/).includes("canonical"));
  const description = descriptionTag ? tagAttribute(descriptionTag, "content") : undefined;
  const canonical = canonicalTag ? tagAttribute(canonicalTag, "href") : undefined;
  const jsonLdCount = (html.match(/application\/ld\+json/gi) ?? []).length;
  const issues: string[] = [];
  if (status === null || status < 200 || status >= 300) issues.push(`Non-2xx response (${status ?? "unreachable"})`);
  if (!title) issues.push("Missing title");
  if (!description) issues.push("Missing meta description");
  if (!canonical) issues.push("Missing canonical");
  if (jsonLdCount === 0) issues.push("No JSON-LD detected");
  return { url, status, title, description, canonical, jsonLdCount, issues };
}

async function collectTechnical(skipNetwork: boolean) {
  const robotsUrl = `${siteUrl}/robots.txt`;
  const sitemapUrl = `${siteUrl}/sitemap.xml`;
  if (skipNetwork) return { robotsUrl, sitemapUrl, sitemapCount: 0, pages: [] as TechnicalPage[] };
  const [robots, sitemap] = await Promise.all([fetchPublic(robotsUrl), fetchPublic(sitemapUrl)]);
  const sitemapUrls = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]).filter((url) => isPublicTnmUrl(url, siteUrl));
  const pages = await mapWithConcurrency(sitemapUrls, routeAuditConcurrency, async (url) => {
    try { const page = await fetchPublic(url); return inspectPage(url, page.status, page.text); }
    catch { return inspectPage(url, null); }
  });
  if (!robots.text.includes("Sitemap:")) pages.unshift({ ...inspectPage(robotsUrl, robots.status, "<title>robots</title><meta name=\"description\" content=\"robots\"><link rel=\"canonical\" href=\"/robots.txt\">"), issues: ["robots.txt does not declare a sitemap"] });
  return { robotsUrl, sitemapUrl, sitemapCount: sitemapUrls.length, pages };
}

function provider(source: string, payload: { collectedAt?: string } | null, rangeDays: number, refreshFailure?: string): ProviderSummary {
  if (!payload) return { status: "unavailable", source, rangeDays, note: refreshFailure ?? "No local export or configured live response." };
  if (isStale(payload.collectedAt)) return { status: "stale", source, rangeDays, collectedAt: payload.collectedAt, note: refreshFailure ? `Refresh failed; retained stale evidence. ${refreshFailure}`.slice(0, 180) : "Local evidence is older than eight days." };
  return { status: refreshFailure ? "partial" : "available", source, rangeDays, collectedAt: payload.collectedAt, note: refreshFailure ? `Refresh failed; retained current evidence. ${refreshFailure}`.slice(0, 180) : undefined };
}

async function safeRefresh<T>(existing: T | null, enabled: boolean, run: () => Promise<T>) {
  if (!enabled) return { data: existing, failure: undefined as string | undefined };
  try { return { data: await run(), failure: undefined as string | undefined }; }
  catch (error) { return { data: existing, failure: error instanceof Error ? error.message : "Provider refresh failed." }; }
}

type SearchConsoleData = {
  collectedAt: string;
  queries: SearchQueryMetric[];
  generativeAiAvailable: boolean;
  daily: AggregateMetric[];
  devices: AggregateMetric[];
  countries: AggregateMetric[];
  searchAppearances: AggregateMetric[];
  generativeAi?: { impressions: number; clicks: number; pages: number; collectedAt: string };
  bulkExport?: { rows: number; collectedAt: string };
};
async function refreshSearchConsole(rangeDays: number, localDir: string, dryRun: boolean): Promise<SearchConsoleData> {
  const token = await googleAccessToken(localDir);
  const property = process.env.TNM_VISIBILITY_GSC_PROPERTY ?? "sc-domain:truenorthmap.ca";
  // Google recommends a two-to-three day finalization buffer for repeatable daily reporting.
  const endDate = new Date(Date.now() - 3 * 86_400_000);
  const startDate = new Date(endDate.getTime() - rangeDays * 86_400_000);
  const run = async (dimensions: string[]) => {
    const rows: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }> = [];
    let startRow = 0;
    while (true) {
      const response = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ startDate: startDate.toISOString().slice(0, 10), endDate: endDate.toISOString().slice(0, 10), dimensions, rowLimit: searchConsolePageSize, startRow }), signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`Search Console read failed for ${dimensions.join(",")}: ${response.status}`);
      const batch = (await response.json() as { rows?: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }> }).rows ?? [];
      rows.push(...batch);
      if (batch.length < searchConsolePageSize) return { rows };
      startRow += batch.length;
    }
  };
  const [queryPageRaw, dailyRaw, deviceRaw, countryRaw, appearanceRaw] = await Promise.all([
    run(["query", "page"]), run(["date"]), run(["device"]), run(["country"]), run(["searchAppearance"]),
  ]);
  const aggregate = (raw: Awaited<ReturnType<typeof run>>) => (raw.rows ?? []).map((row) => ({ label: row.keys?.[0] ?? "unknown", clicks: row.clicks ?? 0, impressions: row.impressions ?? 0 }));
  const normalized: SearchConsoleData = {
    collectedAt: new Date().toISOString(),
    queries: (queryPageRaw.rows ?? []).map((row) => ({ query: row.keys?.[0] ?? "", page: row.keys?.[1], clicks: row.clicks ?? 0, impressions: row.impressions ?? 0, ctr: row.ctr ?? 0, position: row.position ?? 0 })),
    generativeAiAvailable: false, daily: aggregate(dailyRaw), devices: aggregate(deviceRaw), countries: aggregate(countryRaw).sort((a, b) => (b.impressions ?? 0) - (a.impressions ?? 0)), searchAppearances: aggregate(appearanceRaw),
  };
  await writeProviderArtifact(localDir, "search-console", normalized, { queryPageRaw, dailyRaw, deviceRaw, countryRaw, appearanceRaw }, dryRun);
  return normalized;
}

type Ga4Data = VisibilitySnapshotV1["ga4"] & { collectedAt: string };
async function refreshGa4(rangeDays: number, localDir: string, dryRun: boolean): Promise<Ga4Data> {
  const property = process.env.TNM_VISIBILITY_GA4_PROPERTY;
  if (!property) throw new Error("GA4 property is not configured.");
  const token = await googleAccessToken(localDir);
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - rangeDays * 86_400_000);
  const dateRanges = [{ startDate: startDate.toISOString().slice(0, 10), endDate: endDate.toISOString().slice(0, 10) }];
  const runReport = async (body: Record<string, unknown>) => {
    const rows: Array<{ dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }> = [];
    let offset = 0;
    while (true) {
      const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/${property}:runReport`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ ...body, limit: ga4PageSize, offset }), signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`GA4 read failed: ${response.status}`);
      const batch = (await response.json() as { rows?: Array<{ dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }> }).rows ?? [];
      rows.push(...batch);
      if (batch.length < ga4PageSize) return { rows };
      offset += batch.length;
    }
  };
  const [landingRaw, referralRaw, acquisitionRaw, eventRaw] = await Promise.all([
    runReport({ dateRanges, dimensions: [{ name: "landingPage" }, { name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }, { name: "engagedSessions" }, { name: "keyEvents" }, { name: "userEngagementDuration" }] }),
    runReport({ dateRanges, dimensions: [{ name: "sessionSource" }], metrics: [{ name: "sessions" }] }),
    runReport({ dateRanges, dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }, { name: "engagedSessions" }, { name: "keyEvents" }] }),
    runReport({ dateRanges, dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }], dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: ["tnm_content_view", "tnm_organic_entry", "tnm_external_source_open", "tnm_working_list_intent"] } } } }),
  ]);
  const aiPattern = /(^|\.)((chatgpt|openai|perplexity|claude|anthropic|copilot|gemini)\.|com$)/i;
  const normalized: Ga4Data = {
    collectedAt: new Date().toISOString(),
    organicLandingPages: (landingRaw.rows ?? []).filter((row) => row.dimensionValues?.[1]?.value === "Organic Search").map((row) => ({ page: (row.dimensionValues?.[0]?.value ?? "/").split("?")[0], sessions: Number(row.metricValues?.[0]?.value ?? 0), engagedSessions: Number(row.metricValues?.[1]?.value ?? 0), keyEvents: Number(row.metricValues?.[2]?.value ?? 0), engagementSeconds: Math.round(Number(row.metricValues?.[3]?.value ?? 0)) })),
    aiReferrals: (referralRaw.rows ?? []).filter((row) => aiPattern.test(row.dimensionValues?.[0]?.value ?? "")).map((row) => ({ source: row.dimensionValues?.[0]?.value ?? "AI referral", sessions: Number(row.metricValues?.[0]?.value ?? 0) })),
    acquisitionChannels: (acquisitionRaw.rows ?? []).map((row) => ({ label: row.dimensionValues?.[0]?.value ?? "Other", sessions: Number(row.metricValues?.[0]?.value ?? 0), engagedSessions: Number(row.metricValues?.[1]?.value ?? 0), keyEvents: Number(row.metricValues?.[2]?.value ?? 0) })),
    // Source hostnames are deliberately categorized before leaving the local raw artifact.
    referralCategories: (referralRaw.rows ?? []).reduce<AggregateMetric[]>((rows, row) => {
      const source = row.dimensionValues?.[0]?.value ?? "";
      const label = aiPattern.test(source) ? "AI assistants" : /google|bing|duckduckgo/i.test(source) ? "Search engines" : /linkedin|x\.com|twitter|facebook|instagram/i.test(source) ? "Social networks" : source === "(direct)" ? "Direct" : "Other referrals";
      const existing = rows.find((item) => item.label === label);
      if (existing) existing.sessions = (existing.sessions ?? 0) + Number(row.metricValues?.[0]?.value ?? 0);
      else rows.push({ label, sessions: Number(row.metricValues?.[0]?.value ?? 0) });
      return rows;
    }, []).sort((a, b) => (b.sessions ?? 0) - (a.sessions ?? 0)),
    clickEvents: (eventRaw.rows ?? []).map((row) => ({ label: row.dimensionValues?.[0]?.value ?? "public_event", sessions: Number(row.metricValues?.[0]?.value ?? 0) })),
  };
  await writeProviderArtifact(localDir, "ga4", normalized, { landingRaw, referralRaw, acquisitionRaw, eventRaw }, dryRun);
  return normalized;
}

function metricPercentile(raw: Record<string, unknown>, key: string) {
  const metrics = (raw.loadingExperience as { metrics?: Record<string, { percentile?: number }> } | undefined)?.metrics;
  return metrics?.[key]?.percentile ?? null;
}

async function refreshPageSpeed(localDir: string, dryRun: boolean): Promise<WebPerformance> {
  const key = process.env.TNM_VISIBILITY_PAGESPEED_API_KEY;
  if (!key) throw new Error("PageSpeed API key is not configured.");
  const response = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(siteUrl)}&strategy=mobile&category=performance&key=${encodeURIComponent(key)}`, { signal: AbortSignal.timeout(slowProviderTimeoutMs) });
  if (!response.ok) throw new Error(`PageSpeed read failed: ${response.status}`);
  const raw = await response.json() as Record<string, unknown>;
  const lighthouse = raw.lighthouseResult as { categories?: { performance?: { score?: number } }; audits?: Record<string, { numericValue?: number }> } | undefined;
  const normalized: WebPerformance = {
    url: siteUrl, strategy: "mobile", source: "pagespeed", collectedAt: new Date().toISOString(),
    performanceScore: typeof lighthouse?.categories?.performance?.score === "number" ? Math.round(lighthouse.categories.performance.score * 100) : null,
    lcpMs: metricPercentile(raw, "LARGEST_CONTENTFUL_PAINT_MS") ?? lighthouse?.audits?.["largest-contentful-paint"]?.numericValue ?? null,
    inpMs: metricPercentile(raw, "INTERACTION_TO_NEXT_PAINT") ?? lighthouse?.audits?.["interaction-to-next-paint"]?.numericValue ?? null,
    cls: metricPercentile(raw, "CUMULATIVE_LAYOUT_SHIFT_SCORE") ?? lighthouse?.audits?.["cumulative-layout-shift"]?.numericValue ?? null,
    fieldDataAvailable: Boolean((raw.loadingExperience as { metrics?: unknown } | undefined)?.metrics),
  };
  await writeProviderArtifact(localDir, "pagespeed", normalized, raw, dryRun);
  return normalized;
}

type CruxHistoryData = { collectedAt: string; points: AggregateMetric[] };
async function refreshCruxHistory(localDir: string, dryRun: boolean): Promise<CruxHistoryData> {
  const key = process.env.TNM_VISIBILITY_CRUX_API_KEY ?? process.env.TNM_VISIBILITY_PAGESPEED_API_KEY;
  if (!key) throw new Error("CrUX History requires a dedicated CrUX or PageSpeed Google API key.");
  const response = await fetch(`https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord?key=${encodeURIComponent(key)}`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ origin: siteUrl, formFactor: "PHONE", collectionPeriodCount: 40, metrics: ["largest_contentful_paint", "interaction_to_next_paint", "cumulative_layout_shift"] }), signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    if (response.status === 404) throw new Error("CrUX History has no eligible origin/page data (404: chrome ux report data not found).");
    if (response.status === 401 || response.status === 403) throw new Error(`CrUX History credential/API access was rejected (${response.status}); verify the dedicated key restriction and enabled API.`);
    throw new Error(`CrUX History read failed: ${response.status}`);
  }
  const raw = await response.json() as { record?: { collectionPeriods?: Array<{ firstDate?: { year?: number; month?: number; day?: number } }>; metrics?: Record<string, { percentilesTimeseries?: { p75s?: Array<number | string | null> } }> } };
  const periods = raw.record?.collectionPeriods ?? [];
  const metrics = raw.record?.metrics ?? {};
  const lcp = metrics.largest_contentful_paint?.percentilesTimeseries?.p75s ?? [];
  const inp = metrics.interaction_to_next_paint?.percentilesTimeseries?.p75s ?? [];
  const cls = metrics.cumulative_layout_shift?.percentilesTimeseries?.p75s ?? [];
  const numberOrNull = (value: unknown) => typeof value === "number" ? value : typeof value === "string" && value !== "NaN" && Number.isFinite(Number(value)) ? Number(value) : null;
  const points = periods.map((period, index) => {
    const date = period.firstDate;
    const label = date?.year && date?.month && date?.day ? `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}` : `period-${index + 1}`;
    return { label, lcpMs: numberOrNull(lcp[index]), inpMs: numberOrNull(inp[index]), cls: numberOrNull(cls[index]) };
  });
  const normalized = { collectedAt: new Date().toISOString(), points };
  await writeProviderArtifact(localDir, "crux-history", normalized, raw, dryRun);
  return normalized;
}

type ImportedProvider = { collectedAt: string; backlinks?: VisibilitySnapshotV1["backlinks"]; searchRows?: SearchQueryMetric[]; crawlStats?: AggregateMetric[]; backlinkCount?: number; organicKeywords?: number; siteAuditIssues?: number; internalLinkSuggestions?: number; trendSignals?: number; generativeAi?: SearchConsoleData["generativeAi"]; bulkExport?: SearchConsoleData["bulkExport"] };

async function refreshBing(localDir: string, dryRun: boolean): Promise<ImportedProvider> {
  const apiKey = process.env.TNM_VISIBILITY_BING_API_KEY;
  if (!apiKey) throw new Error("Bing Webmaster API key is not configured.");
  const get = async (method: string) => {
    const response = await fetch(`https://ssl.bing.com/webmaster/api.svc/json/${method}?siteUrl=${encodeURIComponent(siteUrl)}&apikey=${encodeURIComponent(apiKey)}`, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`Bing Webmaster ${method} read failed: ${response.status}`);
    return response.json() as Promise<{ d?: Array<Record<string, unknown>> | Record<string, unknown> }>;
  };
  const [raw, crawlRaw, linksRaw] = await Promise.all([get("GetQueryStats"), get("GetCrawlStats"), get("GetLinkCounts")]);
  const queryRows = Array.isArray(raw.d) ? raw.d : [];
  const searchRows: SearchQueryMetric[] = queryRows.map((row) => {
    const impressions = Number(row.Impressions ?? row.impressions ?? 0);
    const clicks = Number(row.Clicks ?? row.clicks ?? 0);
    return { query: String(row.Query ?? row.query ?? ""), page: typeof row.Url === "string" ? row.Url : undefined, clicks, impressions, ctr: impressions ? clicks / impressions : 0, position: Number(row.AvgImpressionPosition ?? row.Position ?? row.position ?? 0) };
  }).filter((row) => row.query);
  const crawlRows = Array.isArray(crawlRaw.d) ? crawlRaw.d : [];
  const linkData = Array.isArray(linksRaw.d) ? linksRaw.d[0] : linksRaw.d;
  const normalized: ImportedProvider = { collectedAt: new Date().toISOString(), searchRows, backlinks: [], crawlStats: crawlRows.map((row) => ({ label: String(row.Date ?? row.date ?? "unknown"), sessions: Number(row.CrawledPages ?? row.crawledPages ?? row.CrawlCount ?? 0) })), backlinkCount: Number((linkData as Record<string, unknown> | undefined)?.InboundLinks ?? (linkData as Record<string, unknown> | undefined)?.inboundLinks ?? 0) };
  await writeProviderArtifact(localDir, "bing", normalized, { queryStats: raw, crawlStats: crawlRaw, linkCounts: linksRaw }, dryRun);
  return normalized;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"' && quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((character === "\n" || character === "\r") && !quoted) { if (character === "\r" && text[index + 1] === "\n") index += 1; row.push(cell); if (row.some(Boolean)) rows.push(row); row = []; cell = ""; }
    else cell += character;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0].map((header) => header.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""])));
}

function first(row: Record<string, string>, names: string[]) { return names.map((name) => row[name]).find(Boolean); }
function numberValue(value: string | undefined) { const number = Number((value ?? "").replace(/[%,$]/g, "")); return Number.isFinite(number) ? number : 0; }

async function importProvider(options: Options) {
  const providerName = options.importProvider!;
  const source = options.importFile!;
  const contents = await readFile(source, "utf8");
  const parsedJson = source.toLowerCase().endsWith(".json") ? JSON.parse(contents) as ImportedProvider : null;
  let normalized: ImportedProvider;
  if (parsedJson) normalized = { ...parsedJson, collectedAt: parsedJson.collectedAt ?? new Date().toISOString() };
  else {
    const rows = parseCsv(contents);
    const backlinks = rows.flatMap((row) => {
      const domain = first(row, ["referringdomain", "domain", "sourceurl", "source"]);
      if (!domain) return [];
      const cleanDomain = domain.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
      const targetUrl = first(row, ["targeturl", "target", "destinationurl"]);
      return [{ domain: cleanDomain, targetUrl, source: providerName === "bing" ? "bing" as const : "ahrefs" as const, relevance: "medium" as const }];
    });
    const searchRows = providerName === "bing" ? rows.flatMap((row) => {
      const query = first(row, ["query", "keyword"]); const page = first(row, ["page", "url", "targeturl"]);
      if (!query) return [];
      const impressions = numberValue(first(row, ["impressions"])); const clicks = numberValue(first(row, ["clicks"]));
      return [{ query, page, clicks, impressions, ctr: impressions ? clicks / impressions : numberValue(first(row, ["ctr"])) / 100, position: numberValue(first(row, ["position", "averageposition"])) }];
    }) : [];
    normalized = {
      collectedAt: new Date().toISOString(), backlinks, searchRows,
      organicKeywords: providerName === "ahrefs" ? rows.filter((row) => first(row, ["keyword", "query"])).length : undefined,
      siteAuditIssues: providerName === "ahrefs" ? rows.filter((row) => first(row, ["issue", "issuetype"])).length : undefined,
      internalLinkSuggestions: providerName === "ahrefs" ? rows.filter((row) => first(row, ["internallink", "linkopportunity", "suggestedsourceurl"])).length : undefined,
      trendSignals: providerName === "trends" ? rows.length : undefined,
    };
  }
  if (providerName === "generative-ai") {
    const rows = parsedJson ? [] : parseCsv(contents);
    const impressions = parsedJson ? Number((parsedJson as Record<string, unknown>).impressions ?? 0) : rows.reduce((total, row) => total + numberValue(first(row, ["impressions"])), 0);
    const clicks = parsedJson ? Number((parsedJson as Record<string, unknown>).clicks ?? 0) : rows.reduce((total, row) => total + numberValue(first(row, ["clicks"])), 0);
    const pages = parsedJson ? Number((parsedJson as Record<string, unknown>).pages ?? 0) : new Set(rows.map((row) => first(row, ["page", "url"]) ?? "").filter(Boolean)).size;
    normalized.generativeAi = { impressions, clicks, pages, collectedAt: normalized.collectedAt };
  }
  if (providerName === "gsc-bulk") {
    const rows = parsedJson ? Number((parsedJson as Record<string, unknown>).rows ?? 0) : parseCsv(contents).length;
    normalized.bulkExport = { rows, collectedAt: normalized.collectedAt };
  }
  await writeProviderArtifact(options.localDir, providerName, normalized, { importedAt: new Date().toISOString(), sourceFileName: path.basename(source), rowCount: parsedJson ? undefined : parseCsv(contents).length }, options.dryRun);
  console.log(JSON.stringify({ ok: true, provider: providerName, collectedAt: normalized.collectedAt, records: Math.max(normalized.backlinks?.length ?? 0, normalized.searchRows?.length ?? 0, normalized.trendSignals ?? 0) }, null, 2));
}

async function refreshGscBulkExport(rangeDays: number, localDir: string, dryRun: boolean): Promise<ImportedProvider> {
  const project = process.env.TNM_VISIBILITY_GSC_BULK_PROJECT;
  const dataset = process.env.TNM_VISIBILITY_GSC_BULK_DATASET;
  if (!project || !dataset) throw new Error("GSC BigQuery bulk export is not configured.");
  const token = await googleAccessToken(localDir);
  const end = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);
  const start = new Date(Date.now() - (rangeDays + 3) * 86_400_000).toISOString().slice(0, 10);
  const query = `SELECT COUNT(*) AS row_count FROM \`${project}.${dataset}.searchdata_site_impression\` WHERE data_date BETWEEN @start AND @end`;
  const response = await fetch(`https://bigquery.googleapis.com/bigquery/v2/projects/${encodeURIComponent(project)}/queries`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ query, useLegacySql: false, parameterMode: "NAMED", queryParameters: [{ name: "start", parameterType: { type: "DATE" }, parameterValue: { value: start } }, { name: "end", parameterType: { type: "DATE" }, parameterValue: { value: end } }] }), signal: AbortSignal.timeout(60_000) });
  if (!response.ok) {
    const failure = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    const message = failure?.error?.message ?? "unknown BigQuery error";
    if (response.status === 404 && /not found|does not exist/i.test(message)) throw new Error("GSC BigQuery export is active but its initial Search Console tables are still pending; Google allows up to 48 hours after activation.");
    throw new Error(`GSC BigQuery bulk export read failed: ${response.status} (${message}).`);
  }
  const raw = await response.json() as { rows?: Array<{ f?: Array<{ v?: string }> }> };
  const normalized: ImportedProvider = { collectedAt: new Date().toISOString(), bulkExport: { rows: Number(raw.rows?.[0]?.f?.[0]?.v ?? 0), collectedAt: new Date().toISOString() } };
  await writeProviderArtifact(localDir, "gsc-bulk", normalized, raw, dryRun);
  return normalized;
}

type DataForSeoData = { collectedAt: string; backlinks: VisibilitySnapshotV1["backlinks"]; requestedTasks: number; trackedTopTen: number; newTasks?: number; actualCostUsd?: number; taskResults?: unknown[] };
type DataForSeoApiResponse = {
  status_code?: number;
  status_message?: string;
  cost?: number;
  tasks?: Array<{ status_code?: number; status_message?: string; cost?: number; data?: { keyword?: string }; result?: unknown[] }>;
};
type DataForSeoRunData = DataForSeoData & { newTasks: number; actualCostUsd: number };

function validateDataForSeoResponse(payload: DataForSeoApiResponse, keyword: string) {
  if (payload.status_code !== 20000) throw new Error(`DataForSEO request failed for ${keyword}: ${payload.status_message ?? payload.status_code ?? "unknown status"}`);
  const failedTask = payload.tasks?.find((task) => task.status_code !== 20000);
  if (failedTask) throw new Error(`DataForSEO task failed for ${keyword}: ${failedTask.status_message ?? failedTask.status_code ?? "unknown status"}`);
  return Number(payload.cost ?? payload.tasks?.reduce((total, task) => total + Number(task.cost ?? 0), 0) ?? 0);
}

function normalizeDataForSeo(rawResults: unknown[]) {
  let trackedTopTen = 0;
  for (const response of rawResults as Array<{ tasks?: Array<{ result?: Array<{ items?: Array<{ rank_group?: number; url?: string }> }> }> }>) {
    for (const task of response.tasks ?? []) for (const result of task.result ?? []) if ((result.items ?? []).some((item) => (item.rank_group ?? 99) <= 10 && item.url?.includes("truenorthmap.ca"))) trackedTopTen += 1;
  }
  return trackedTopTen;
}

async function collectDataForSeo(options: Options, existing: DataForSeoData | null) {
  if (!options.refreshProviders) return { data: existing, failure: undefined as string | undefined, billedCallsThisRun: 0, actualCostUsdThisRun: 0 };
  try {
    if (options.dryRun) throw new Error("Full DataForSEO collection is not available in --dry-run mode.");
    const login = process.env.TNM_VISIBILITY_DATAFORSEO_LOGIN; const password = process.env.TNM_VISIBILITY_DATAFORSEO_PASSWORD;
    if (!login || !password) throw new Error("DataForSEO credentials are not configured.");
    const seeds = await readJson<{ intentGroups?: Array<{ queries?: string[] }> }>(path.resolve("../research/visibility/seed-queries.json"));
    const queries = (seeds?.intentGroups ?? []).flatMap((group) => group.queries ?? []);
    if (!queries.length) throw new Error("Visibility seed query set is empty.");
    const authorization = `Basic ${Buffer.from(`${login}:${password}`).toString("base64")}`;
    const taskResults: unknown[] = [];
    let actualCostUsd = 0;
    let completedNewTasks = 0;
    for (const keyword of queries) {
      try {
        const response = await fetch("https://api.dataforseo.com/v3/serp/google/organic/live/advanced", { method: "POST", headers: { authorization, "content-type": "application/json" }, body: JSON.stringify([{ keyword, location_name: "Canada", language_name: "English", depth: 10 }]), signal: AbortSignal.timeout(slowProviderTimeoutMs) });
        if (!response.ok) throw new Error(`DataForSEO read failed: ${response.status}`);
        const payload = await response.json() as DataForSeoApiResponse;
        actualCostUsd += validateDataForSeoResponse(payload, keyword);
        taskResults.push(payload); completedNewTasks += 1;
        // Persist every successful task before proceeding: a later transient failure cannot discard billed evidence.
        const checkpoint: DataForSeoRunData = { collectedAt: new Date().toISOString(), backlinks: [], requestedTasks: queries.length, trackedTopTen: normalizeDataForSeo(taskResults), newTasks: completedNewTasks, actualCostUsd: Number(actualCostUsd.toFixed(6)) };
        await writeProviderArtifact(options.localDir, "dataforseo", checkpoint, { collectedAt: checkpoint.collectedAt, requestedTasks: queries.length, newTasks: completedNewTasks, actualCostUsd: checkpoint.actualCostUsd, taskResults }, false);
      } catch (error) {
        const normalized: DataForSeoRunData = { collectedAt: new Date().toISOString(), backlinks: [], requestedTasks: queries.length, trackedTopTen: normalizeDataForSeo(taskResults), newTasks: completedNewTasks, actualCostUsd: Number(actualCostUsd.toFixed(6)) };
        await writeProviderArtifact(options.localDir, "dataforseo", normalized, { collectedAt: normalized.collectedAt, requestedTasks: queries.length, newTasks: completedNewTasks, actualCostUsd: normalized.actualCostUsd, taskResults }, false);
        return { data: normalized, failure: error instanceof Error ? error.message : "DataForSEO refresh partially failed.", billedCallsThisRun: completedNewTasks, actualCostUsdThisRun: normalized.actualCostUsd };
      }
    }
    const normalized: DataForSeoRunData = { collectedAt: new Date().toISOString(), backlinks: [], requestedTasks: queries.length, trackedTopTen: normalizeDataForSeo(taskResults), newTasks: completedNewTasks, actualCostUsd: Number(actualCostUsd.toFixed(6)) };
    await writeProviderArtifact(options.localDir, "dataforseo", normalized, { collectedAt: normalized.collectedAt, requestedTasks: queries.length, newTasks: completedNewTasks, actualCostUsd: normalized.actualCostUsd, taskResults }, false);
    return { data: normalized, failure: undefined as string | undefined, billedCallsThisRun: completedNewTasks, actualCostUsdThisRun: normalized.actualCostUsd };
  } catch (error) { return { data: existing, failure: error instanceof Error ? error.message : "DataForSEO refresh failed.", billedCallsThisRun: 0, actualCostUsdThisRun: 0 }; }
}

async function loadSnapshot(options: Options): Promise<VisibilitySnapshotV1> {
  const providerDir = path.join(options.localDir, "providers");
  const priorLocalSnapshot = (await latestSnapshots(options.localDir, 1))[0] ?? null;
  const [gscLatest, ga4Latest, pageSpeedLatest, cruxExisting, bingExisting, ahrefs, trends, dataForSeoExisting, generativeAi, bulkExisting] = await Promise.all([
    readJson<SearchConsoleData>(path.join(providerDir, "search-console.json")), readJson<Ga4Data>(path.join(providerDir, "ga4.json")), readJson<WebPerformance>(path.join(providerDir, "pagespeed.json")), readJson<CruxHistoryData>(path.join(providerDir, "crux-history.json")), readJson<ImportedProvider>(path.join(providerDir, "bing.json")), readJson<ImportedProvider>(path.join(providerDir, "ahrefs.json")), readJson<ImportedProvider>(path.join(providerDir, "trends.json")), readJson<DataForSeoData>(path.join(providerDir, "dataforseo.json")), readJson<ImportedProvider>(path.join(providerDir, "generative-ai.json")), readJson<ImportedProvider>(path.join(providerDir, "gsc-bulk.json")),
  ]);
  const gscExisting = gscLatest ?? (priorLocalSnapshot ? { collectedAt: priorLocalSnapshot.providerStatus.searchConsole?.collectedAt ?? priorLocalSnapshot.collectedAt, ...priorLocalSnapshot.searchConsole } : null);
  const ga4Existing = ga4Latest ?? (priorLocalSnapshot ? { collectedAt: priorLocalSnapshot.providerStatus.ga4?.collectedAt ?? priorLocalSnapshot.collectedAt, ...priorLocalSnapshot.ga4 } : null);
  const pageSpeedExisting = pageSpeedLatest ?? (priorLocalSnapshot?.technical.pageSpeed?.source === "pagespeed" ? priorLocalSnapshot.technical.pageSpeed : null);
  const [gsc, ga4, pageSpeed, crux, bing, bulkExport, dataforseo, technical] = await Promise.all([
    safeRefresh(gscExisting, options.refreshProviders, () => refreshSearchConsole(options.rangeDays, options.localDir, options.dryRun)),
    safeRefresh(ga4Existing, options.refreshProviders, () => refreshGa4(options.rangeDays, options.localDir, options.dryRun)),
    safeRefresh(pageSpeedExisting, options.refreshProviders, () => refreshPageSpeed(options.localDir, options.dryRun)),
    safeRefresh(cruxExisting, options.refreshProviders, () => refreshCruxHistory(options.localDir, options.dryRun)),
    safeRefresh(bingExisting, options.refreshProviders, () => refreshBing(options.localDir, options.dryRun)),
    safeRefresh(bulkExisting, options.refreshProviders, () => refreshGscBulkExport(options.rangeDays, options.localDir, options.dryRun)),
    collectDataForSeo(options, dataForSeoExisting),
    collectTechnical(options.skipNetwork),
  ]);
  const backlinks = [bing.data, ahrefs, dataforseo.data].flatMap((value) => value?.backlinks ?? []).filter((link) => link.targetUrl === undefined || isPublicTnmUrl(link.targetUrl, siteUrl));
  return {
    schemaVersion: visibilitySnapshotVersion, collectedAt: new Date().toISOString(), siteUrl, rangeDays: options.rangeDays,
    providerStatus: {
      searchConsole: provider("Google Search Console", gsc.data, options.rangeDays, gsc.failure),
      ga4: provider("GA4", ga4.data, options.rangeDays, ga4.failure),
      bing: provider("Bing Webmaster API/import", bing.data, options.rangeDays, bing.failure),
      ahrefs: provider("Ahrefs import", ahrefs, options.rangeDays),
      dataforseo: provider("DataForSEO", dataforseo.data, options.rangeDays, dataforseo.failure),
      pageSpeed: provider("PageSpeed Insights", pageSpeed.data, options.rangeDays, pageSpeed.failure),
      cruxHistory: provider("CrUX History API", crux.data, options.rangeDays, crux.failure),
      gscBulkExport: provider("Search Console BigQuery export", bulkExport.data, options.rangeDays, bulkExport.failure),
      trends: provider("Google Trends import", trends, options.rangeDays),
    },
    searchConsole: { queries: gsc.data?.queries ?? [], generativeAiAvailable: Boolean(generativeAi?.generativeAi || gsc.data?.generativeAiAvailable), daily: gsc.data?.daily ?? [], devices: gsc.data?.devices ?? [], countries: gsc.data?.countries ?? [], searchAppearances: gsc.data?.searchAppearances ?? [], generativeAi: generativeAi?.generativeAi, bulkExport: bulkExport.data?.bulkExport ?? bulkExisting?.bulkExport },
    ga4: { organicLandingPages: ga4.data?.organicLandingPages ?? [], aiReferrals: ga4.data?.aiReferrals ?? [], acquisitionChannels: ga4.data?.acquisitionChannels ?? [], referralCategories: ga4.data?.referralCategories ?? [], clickEvents: ga4.data?.clickEvents ?? [] },
    bing: { searchRows: bing.data?.searchRows ?? [], crawlStats: bing.data?.crawlStats ?? [], backlinkCount: bing.data?.backlinkCount ?? 0 },
    ahrefs: { organicKeywords: ahrefs?.organicKeywords ?? 0, siteAuditIssues: ahrefs?.siteAuditIssues ?? 0, internalLinkSuggestions: ahrefs?.internalLinkSuggestions ?? 0 },
    keywordResearch: { trendSignals: trends?.trendSignals ?? 0, serpTasks: dataforseo.data?.requestedTasks ?? 0, trackedTopTen: dataforseo.data?.trackedTopTen ?? 0, dataForSeoNewTasks: dataforseo.billedCallsThisRun, dataForSeoActualCostUsd: dataforseo.actualCostUsdThisRun },
    technical: { ...technical, pageSpeed: pageSpeed.data ?? undefined, cruxHistory: crux.data?.points ?? undefined }, backlinks,
  };
}

async function latestSnapshots(localDir: string, limit = 2) {
  const directory = path.join(localDir, "snapshots");
  try {
    const files = (await readdir(directory)).filter((file) => file.endsWith(".json")).sort().reverse().slice(0, limit);
    return (await Promise.all(files.map((file) => readJson<VisibilitySnapshotV1>(path.join(directory, file))))).filter((value): value is VisibilitySnapshotV1 => Boolean(value));
  } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; }
}

function formatNumber(value: number | null, decimals = 0) { return value === null ? "unavailable" : value.toFixed(decimals); }
function renderReport(command: Command, snapshot: VisibilitySnapshotV1, prior: VisibilitySnapshotV1 | null) {
  const opportunities = deriveOpportunities(snapshot);
  const pages = aggregateSearchPages(snapshot);
  const clicks = snapshot.searchConsole.queries.reduce((total, item) => total + item.clicks, 0);
  const impressions = snapshot.searchConsole.queries.reduce((total, item) => total + item.impressions, 0);
  const comparison = prior ? compareSnapshots(snapshot, prior) : null;
  const comparableChanges = comparison?.comparable ? {
    clicks: comparison.clicksDelta ?? 0,
    impressions: comparison.impressionsDelta ?? 0,
    sessions: comparison.sessionsDelta ?? 0,
    technicalIssues: comparison.technicalIssuesDelta ?? 0,
    averagePosition: comparison.averagePositionDelta,
  } : null;
  const dataQuality = Object.entries(snapshot.providerStatus).map(([name, value]) => `- ${name}: **${value.status}**${value.collectedAt ? ` — collected ${value.collectedAt}` : ""}${value.note ? ` — ${value.note}` : ""}`).join("\n");
  const performance = snapshot.technical.pageSpeed;
  return [
    "# True North Map Visibility Report",
    `\nSchema: ${visibilityReportVersion}\nMode: ${command}\nCollected: ${snapshot.collectedAt}\nRange: ${snapshot.rangeDays} days\nScope: ${siteUrl} public routes only; ${snapshot.technical.pages.length} routes inspected from the complete sitemap.`,
    `\n## Data quality\n${dataQuality}\n\nUnavailable means unknown, never zero. Raw provider evidence remains local-only.`,
    `\n## Search visibility\n- Impressions: ${impressions}\n- Clicks: ${clicks}\n- CTR: ${impressions ? (clicks / impressions * 100).toFixed(2) : "unavailable"}%\n- Impression-weighted average position: ${formatNumber(weightedAveragePosition(snapshot.searchConsole.queries), 1)}\n- DataForSEO Canada panel: ${snapshot.keywordResearch?.serpTasks ?? 0} tasks requested, ${snapshot.keywordResearch?.trackedTopTen ?? 0} TNM top-ten results, ${snapshot.keywordResearch?.dataForSeoNewTasks ?? 0} tasks completed during this run, $${(snapshot.keywordResearch?.dataForSeoActualCostUsd ?? 0).toFixed(3)} provider-reported cost during this run\n\n### Public pages\n${pages.length ? pages.map((page) => `- ${page.path}: ${page.impressions} impressions, ${page.clicks} clicks, ${(page.ctr * 100).toFixed(1)}% CTR, position ${page.position ?? "unknown"}`).join("\n") : "No current page-level Search Console evidence."}`,
    `\n## Technical health\n- Sitemap public URLs: ${snapshot.technical.sitemapCount}; inspected routes: ${snapshot.technical.pages.length}\n- Pages with issues: ${snapshot.technical.pages.filter((page) => page.issues.length).length}/${snapshot.technical.pages.length}\n- PageSpeed mobile score: ${formatNumber(performance?.performanceScore ?? null)}\n- LCP: ${formatNumber(performance?.lcpMs ?? null)} ms\n- INP: ${formatNumber(performance?.inpMs ?? null)} ms\n- CLS: ${formatNumber(performance?.cls ?? null, 3)}`,
    `\n## AEO and GEO\n- Google Generative AI Performance report: ${snapshot.searchConsole.generativeAiAvailable ? "available" : "unavailable or not imported"}\n- Aggregate eligible AI referrals: ${snapshot.ga4.aiReferrals.reduce((total, item) => total + item.sessions, 0)} sessions\n- Manual prompt panel: record system, date, observation, citation accuracy, and TNM presence locally; do not claim rank.\n- Improve answer-first copy, provenance, entity consistency, visible dates, accurate schema, and useful internal links.`,
    `\n## Content and links\n${opportunities.length ? opportunities.map((item, index) => `${index + 1}. **${item.priority} / ${item.confidence} — ${item.type}**: ${item.target}\n   ${item.rationale}`).join("\n") : "No evidence-backed opportunity is available from the current inputs."}\n\nImported high-relevance earned-link signals: ${snapshot.backlinks.filter((link) => link.relevance === "high").length}. Human review is required before any outreach.`,
    `\n## Priority actions\n${createDashboardSummary(snapshot, prior).actions.map((action, index) => `${index + 1}. **${action.priority} impact / ${action.confidence} — ${action.title}**\n   Owner: ${action.ownerType}; effort: ${action.effort}; target: ${action.targetPath ?? "monitoring"}\n   Why: ${action.rationale}\n   Verify: ${action.verification}`).join("\n") || "Monitor until stronger evidence is available."}`,
    comparableChanges ? `\n## Change from prior snapshot\n- Clicks: ${comparableChanges.clicks >= 0 ? "+" : ""}${comparableChanges.clicks}\n- Impressions: ${comparableChanges.impressions >= 0 ? "+" : ""}${comparableChanges.impressions}\n- Organic sessions: ${comparableChanges.sessions >= 0 ? "+" : ""}${comparableChanges.sessions}\n- Technical issues: ${comparableChanges.technicalIssues >= 0 ? "+" : ""}${comparableChanges.technicalIssues}\n- Average position: ${comparableChanges.averagePosition === null ? "not comparable" : `${comparableChanges.averagePosition > 0 ? "+" : ""}${comparableChanges.averagePosition}`}\n- Provider-status changes: ${comparison?.providerChanges.join(", ") || "none"}` : `\n## Change from prior snapshot\n${comparison?.note ?? "No comparable prior private snapshot is available."}`,
    "\n## Guardrails\nPrivate SEO/GEO/AEO intelligence only. No Supabase interaction, provider writes, indexing submission, content publication, automated outreach, paid links, or changes to public records.",
  ].join("\n");
}

async function writeArtifacts(options: Options, snapshot: VisibilitySnapshotV1, report: string) {
  if (options.dryRun) return;
  const date = snapshot.collectedAt.replace(/[:.]/g, "-");
  await Promise.all([
    writeJsonAtomic(path.join(options.localDir, "snapshots", `${date}.json`), snapshot),
    (async () => { const file = path.join(options.localDir, "reports", `${date}-${options.command}.md`); await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, `${report}\n`, { mode: 0o600 }); })(),
  ]);
}

async function postDashboard(summary: VisibilityDashboardSummaryV2) {
  const endpoint = process.env.TNM_VISIBILITY_DASHBOARD_INGEST_URL;
  const token = process.env.TNM_VISIBILITY_DASHBOARD_INGEST_TOKEN;
  const sitesBypassToken = process.env.TNM_VISIBILITY_DASHBOARD_SITES_BYPASS_TOKEN;
  if (!endpoint && !token) return null;
  if (!endpoint || !token) throw new Error("Dashboard sync requires both the ignored ingest URL and ingest token.");
  const response = await fetch(endpoint, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(sitesBypassToken ? { "OAI-Sites-Authorization": `Bearer ${sitesBypassToken}` } : {}) }, body: JSON.stringify(summary), signal: AbortSignal.timeout(30_000) });
  const result = await response.json().catch(() => null) as { ok?: boolean; collectedAt?: string; error?: string; message?: string } | null;
  if (!response.ok || !result?.ok || result.collectedAt !== summary.collectedAt) {
    const detail = result?.error ?? result?.message;
    throw new Error(`Dashboard sync was not verified (${response.status})${detail ? `: ${detail}` : "."}`);
  }
  return result;
}

async function retryDashboardOutbox(localDir: string) {
  const directory = path.join(localDir, "dashboard", "outbox");
  try {
    const files = (await readdir(directory)).filter((file) => file.endsWith(".json")).sort();
    for (const file of files) {
      const summary = await readJson<VisibilityDashboardSummaryV2>(path.join(directory, file));
      if (!summary || summary.schemaVersion !== visibilityDashboardSummaryVersion) continue;
      await postDashboard(summary);
      await unlink(path.join(directory, file));
    }
  } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
}

async function syncDashboard(options: Options, snapshot: VisibilitySnapshotV1, prior: VisibilitySnapshotV1 | null) {
  const summary = createDashboardSummary(snapshot, prior);
  if (options.dryRun) return summary;
  if (!process.env.TNM_VISIBILITY_DASHBOARD_INGEST_URL && !process.env.TNM_VISIBILITY_DASHBOARD_INGEST_TOKEN) return null;
  await retryDashboardOutbox(options.localDir);
  const fileName = `${snapshot.collectedAt.replace(/[:.]/g, "-")}.json`;
  await writeJsonAtomic(path.join(options.localDir, "dashboard", fileName), summary);
  const outbox = path.join(options.localDir, "dashboard", "outbox", fileName);
  await writeJsonAtomic(outbox, summary);
  await postDashboard(summary);
  await unlink(outbox);
  return summary;
}

async function preflight(options: Options) {
  const localDir = options.localDir;
  const providerDir = path.join(localDir, "providers");
  const serviceAccount = Boolean(process.env.TNM_VISIBILITY_GOOGLE_SERVICE_ACCOUNT_FILE);
  let google = serviceAccount || Boolean(process.env.TNM_VISIBILITY_GOOGLE_ACCESS_TOKEN) ? "configured" : "missing";
  if (google === "configured") try {
    const token = await googleAccessToken(localDir);
    if (serviceAccount) google = "service-account-ready";
    else {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`, { signal: AbortSignal.timeout(10_000) });
      google = response.ok ? "short-lived-token-ready" : "short-lived-token-expired";
    }
  } catch { google = "authentication-failed"; }
  const dataForSeoConfigured = Boolean(process.env.TNM_VISIBILITY_DATAFORSEO_LOGIN && process.env.TNM_VISIBILITY_DATAFORSEO_PASSWORD);
  const dataForSeo = dataForSeoConfigured ? "configured" : "missing";
  const fullRunProviderConfig = fullRunProviderConfiguration();
  const dashboardReady = Boolean(process.env.TNM_VISIBILITY_DASHBOARD_INGEST_URL && process.env.TNM_VISIBILITY_DASHBOARD_INGEST_TOKEN);
  const googleReady = google === "service-account-ready" || google === "short-lived-token-ready";
  const configuredGoogleProvider = fullRunProviderConfig.searchConsole || fullRunProviderConfig.ga4 || fullRunProviderConfig.gscBulkExport;
  const fullRunReady = (!configuredGoogleProvider || googleReady) && dashboardReady;
  const status = {
    ok: fullRunReady,
    mode: "full-provider-refresh",
    google,
    gscProperty: Boolean(process.env.TNM_VISIBILITY_GSC_PROPERTY),
    ga4Property: Boolean(process.env.TNM_VISIBILITY_GA4_PROPERTY),
    pageSpeed: Boolean(process.env.TNM_VISIBILITY_PAGESPEED_API_KEY),
    cruxHistory: Boolean(process.env.TNM_VISIBILITY_CRUX_API_KEY || process.env.TNM_VISIBILITY_PAGESPEED_API_KEY),
    bingApi: Boolean(process.env.TNM_VISIBILITY_BING_API_KEY),
    dataForSeo,
    fullRunProviders: fullRunProviderConfig,
    configuredProviders: fullRunProviders.filter((name) => fullRunProviderConfig[name]),
    optionalUnconfiguredProviders: fullRunProviders.filter((name) => !fullRunProviderConfig[name]),
    strictPolicy: "configured live providers must succeed; unconfigured optional APIs remain unavailable/unknown and do not fail refreshes",
    dashboard: dashboardReady,
    imports: { bing: Boolean(await readJson(path.join(providerDir, "bing.json"))), ahrefs: Boolean(await readJson(path.join(providerDir, "ahrefs.json"))), trends: Boolean(await readJson(path.join(providerDir, "trends.json"))) },
    boundary: "local provider evidence -> typed sanitized Sites summary; no Supabase",
  };
  console.log(JSON.stringify(status, null, 2));
  if (!status.ok) process.exitCode = 1;
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  if (options.command === "validate") {
    const seeds = await readJson<{ schemaVersion?: string; intentGroups?: unknown[] }>(path.resolve("../research/visibility/seed-queries.json"));
    if (seeds?.schemaVersion !== "tnm_visibility_seed_queries_v1" || !Array.isArray(seeds.intentGroups) || !seeds.intentGroups.length) throw new Error("Invalid visibility seed query contract.");
    console.log(JSON.stringify({ ok: true, snapshot: visibilitySnapshotVersion, report: visibilityReportVersion, dashboard: visibilityDashboardSummaryVersion, boundary: "no-supabase" }, null, 2));
    return;
  }
  await loadLocalEnvironment(options.localDir);
  if (options.command === "preflight") { await preflight(options); return; }
  if (options.command === "import") { await importProvider(options); return; }
  const history = await latestSnapshots(options.localDir, 2);
  if (options.command === "dashboard-sync") {
    if (!history[0]) throw new Error("Dashboard sync requires an existing private visibility snapshot.");
    const dashboard = await syncDashboard(options, history[0], history[1] ?? null);
    if (!dashboard) throw new Error("Dashboard sync is not configured in the ignored local environment.");
    console.log(`Dashboard sync verified: ${dashboard.schemaVersion} at ${dashboard.collectedAt}.`);
    return;
  }
  const snapshot = await loadSnapshot(options);
  const prior = history[0] ?? null;
  const report = renderReport(options.command, snapshot, prior);
  await writeArtifacts(options, snapshot, report);
  const dashboard = options.refreshProviders ? await syncDashboard(options, snapshot, prior) : null;
  console.log(report);
  if (dashboard) console.log(options.dryRun ? `\nDashboard projection validated locally: ${dashboard.schemaVersion}.` : `\nDashboard sync verified: ${dashboard.schemaVersion} at ${dashboard.collectedAt}.`);
  if (options.strict) {
    const configured = fullRunProviderConfiguration();
    const missingFullRun: string[] = fullRunProviders.filter((name) => providerBlocksStrictRun(name, snapshot.providerStatus[name], configured));
    const auditedRoutes = snapshot.technical.pages.filter((page) => page.url !== snapshot.technical.robotsUrl).length;
    if (!snapshot.technical.sitemapCount || auditedRoutes !== snapshot.technical.sitemapCount) missingFullRun.push("complete public-route audit");
    const failedRoutes = snapshot.technical.pages.filter((page) => page.url !== snapshot.technical.robotsUrl && (page.status === null || page.status < 200 || page.status >= 400));
    if (failedRoutes.length) missingFullRun.push(`${failedRoutes.length} public-route responses`);
    if (missingFullRun.length) throw new Error(`Strict visibility run is incomplete: ${missingFullRun.join(", ")}. A partial snapshot was retained and, when configured, synchronized for monitoring.`);
    if (!dashboard) throw new Error("Strict visibility run did not verify the owner dashboard.");
  }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
