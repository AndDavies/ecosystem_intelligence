import { publicPath, validEarnedReferences, validAiReport, validIntelligence, parseBingDate, bingHealthRows, validTrafficLabel, channels, contentTypes, eventNames, type AiReport, type VisibilityIntelligence, type SearchCohort, type AnswerSource } from "../src/lib/visibility/intelligence";
import { createHash, createSign } from "node:crypto";
import { mkdir, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  aggregateSearchPages,
  compareSnapshots,
  createDashboardSummary,
  deriveOpportunities,
  isKnownAiReferralSource,
  isPublicTnmUrl,
  isStale,
  selectBoundedTechnicalUrls,
  selectPriorSnapshot,
  snapshotTotals,
  technicalManifestReady,
  technicalPageSuccessful,
  visibilityDashboardSummaryVersion,
  visibilityReportVersion,
  visibilitySnapshotVersion,
  type ProviderSummary,
  type AggregateMetric,
  type DataForSeoFeatures,
  type DataForSeoIntentGroup,
  type SearchQueryMetric,
  type TechnicalPage,
  type VisibilityDashboardSummaryV2,
  type VisibilitySnapshotV1,
  type WebPerformance,
} from "../src/lib/visibility/contract";
import { DEFAULT_LAUNCH_PATHS } from "../src/lib/launch/release-gate";

const siteUrl = "https://truenorthmap.ca";
const technicalRequestSpacingMs = 1_000;
const technicalRetrySpacingMs = 2_000;
const technicalPressureSignalLimit = 3;
const searchConsolePageSize = 25_000;
const ga4PageSize = 250_000;
const slowProviderTimeoutMs = 120_000;
const fullRunProviders = ["searchConsole", "ga4", "pageSpeed", "cruxHistory", "bing", "dataforseo", "gscBulkExport"] as const;
type FullRunProvider = typeof fullRunProviders[number];
const requiredProductionProviders = new Set<FullRunProvider>(["searchConsole", "ga4", "pageSpeed", "cruxHistory", "dataforseo", "gscBulkExport"]);
const googleScopes = ["https://www.googleapis.com/auth/webmasters.readonly", "https://www.googleapis.com/auth/analytics.readonly", "https://www.googleapis.com/auth/bigquery.readonly"];
const transientProviderFailure = /\b(?:429|5\d\d|5\d{4}|internal|temporary|timeout|timed out|try again|server error)\b/i;
const retryPause = (attempt: number) => new Promise<void>((resolve) => setTimeout(resolve, 1_500 * (attempt + 1)));

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
  if (!configured[name]) return requiredProductionProviders.has(name);
  if (summary?.status === "available") return false;
  if (name === "cruxHistory" && /no eligible origin\/page data/i.test(summary?.note ?? "")) return false;
  if (name === "gscBulkExport" && gscBulkExportWarmupActive() && /initial Search Console tables are still pending/i.test(summary?.note ?? "")) return false;
  return true;
}

type Command = "baseline" | "opportunities" | "technical" | "aeo" | "backlinks" | "weekly-report" | "refresh" | "preflight" | "import" | "dashboard-sync" | "validate";
type ImportProvider = "bing" | "ahrefs" | "trends" | "generative-ai" | "google-ai" | "bing-ai" | "index-coverage" | "gsc-links" | "gsc-bulk";
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
    // `refresh` is the sole default network collector. Reporting lenses read the
    // latest immutable private snapshot so a weekly report cannot accidentally
    // repeat paid/provider collection or synchronize the dashboard twice. An
    // operator may explicitly opt a lens into collection with
    // `--refresh-providers` when a fresh snapshot is intentionally required.
    refreshProviders: command === "refresh",
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
    else if (value === "--refresh-technical") throw new Error("--refresh-technical is retired. Visibility never performs a full-site crawl; use the explicit $tnm-site-assurance workflow for guarded production launch:audit.");
    else if (value === "--local-dir") options.localDir = path.resolve(rest[++index] ?? "");
    else if (value === "--range-days") options.rangeDays = Number(rest[++index] ?? "28");
    else if (value === "--provider") options.importProvider = rest[++index] as ImportProvider;
    else if (value === "--file") options.importFile = path.resolve(rest[++index] ?? "");
    else throw new Error(`Unknown option: ${value}`);
  }
  if (!Number.isInteger(options.rangeDays) || options.rangeDays < 1 || options.rangeDays > 365) throw new Error("--range-days must be an integer from 1 to 365");
  if (options.command === "import" && (!options.importProvider || !["bing", "ahrefs", "trends", "generative-ai", "google-ai", "bing-ai", "index-coverage", "gsc-links", "gsc-bulk"].includes(options.importProvider) || !options.importFile)) throw new Error("Import requires --provider bing|ahrefs|trends|generative-ai|gsc-bulk and --file <path>.");
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

async function fetchPublic(url: string, maximumAttempts = 3) {
  let lastError: unknown;
  for (let attempt = 0; attempt < maximumAttempts; attempt += 1) {
    try {
      const response = await fetch(url, { redirect: "follow", headers: { "user-agent": "TrueNorthMapVisibility/2.1 (+https://truenorthmap.ca)" }, signal: AbortSignal.timeout(20_000) });
      if (response.status >= 500 && attempt < maximumAttempts - 1) { await response.body?.cancel(); await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1))); continue; }
      return { status: response.status, text: await response.text(), url: response.url };
    } catch (error) {
      lastError = error;
      if (attempt < maximumAttempts - 1) await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }
  throw lastError;
}

function isTechnicalPressureSignal(page: TechnicalPage) {
  return page.status === null || page.status === 429 || (page.status ?? 0) >= 500;
}

async function crawlTechnicalUrls(urls: string[], spacingMs: number) {
  const pages: TechnicalPage[] = [];
  let consecutivePressureSignals = 0;
  for (let index = 0; index < urls.length; index += 1) {
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, spacingMs));
    let inspected: TechnicalPage;
    try {
      const page = await fetchPublic(urls[index], 1);
      inspected = inspectPage(urls[index], page.status, page.text);
    } catch {
      inspected = inspectPage(urls[index], null);
    }
    pages.push(inspected);
    consecutivePressureSignals = isTechnicalPressureSignal(inspected) ? consecutivePressureSignals + 1 : 0;
    if (consecutivePressureSignals >= technicalPressureSignalLimit) {
      for (const remainingUrl of urls.slice(index + 1)) {
        pages.push({
          ...inspectPage(remainingUrl, null),
          inspectionAttempted: false,
          issues: ["Not inspected after the technical pressure circuit opened"],
        });
      }
      return { pages, circuitOpen: true };
    }
  }
  return { pages, circuitOpen: false };
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
  return { url, status, inspectionAttempted: true, title, description, canonical, jsonLdCount, issues };
}

async function collectTechnical(skipNetwork: boolean) {
  const robotsUrl = `${siteUrl}/robots.txt`;
  const sitemapUrl = `${siteUrl}/sitemap.xml`;
  if (skipNetwork) return { robotsUrl, sitemapUrl, sitemapCount: 0, pages: [] as TechnicalPage[] };
  const unavailableManifest = (url: string) => ({ status: null as number | null, text: "", url });
  const [robots, sitemap] = await Promise.all([
    fetchPublic(robotsUrl).catch(() => unavailableManifest(robotsUrl)),
    fetchPublic(sitemapUrl).catch(() => unavailableManifest(sitemapUrl)),
  ]);
  const sitemapUrls = [...new Set([...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]).filter((url) => isPublicTnmUrl(url, siteUrl)))];
  const sitemapDigest = createHash("sha256").update([...new Set(sitemapUrls)].sort().join("\n")).digest("hex");
  const fallbackCoreUrls = DEFAULT_LAUNCH_PATHS.map((pathname) => new URL(pathname, siteUrl).toString());
  let coreUrls = fallbackCoreUrls;
  let manifestIssue: string | undefined;
  try {
    if (sitemap.status === null || sitemap.status < 200 || sitemap.status >= 300) throw new Error(`Sitemap returned ${sitemap.status ?? "unreachable"}.`);
    coreUrls = selectBoundedTechnicalUrls(sitemapUrls, DEFAULT_LAUNCH_PATHS, siteUrl);
  } catch (error) {
    manifestIssue = error instanceof Error ? error.message : "Sitemap verification failed.";
  }
  const firstPass = manifestIssue
    ? { pages: coreUrls.map((url) => ({ ...inspectPage(url, null), inspectionAttempted: false, issues: ["Not inspected because sitemap verification failed"] })), circuitOpen: false }
    : await crawlTechnicalUrls(coreUrls, technicalRequestSpacingMs);
  const pages = firstPass.pages;
  const retryIndexes = firstPass.circuitOpen || manifestIssue ? [] : pages.flatMap((page, index) => page.status === null || page.status === 429 || (page.status ?? 0) >= 500 ? [index] : []);
  let retryCircuitOpen = false;
  if (retryIndexes.length) {
    await new Promise((resolve) => setTimeout(resolve, 5_000));
    const retried = await crawlTechnicalUrls(retryIndexes.map((index) => coreUrls[index]), technicalRetrySpacingMs);
    retryCircuitOpen = retried.circuitOpen;
    retryIndexes.forEach((pageIndex, retryIndex) => { pages[pageIndex] = retried.pages[retryIndex]; });
  }
  const robotsDeclaresSitemap = /(?:^|\n)\s*Sitemap\s*:/i.test(robots.text);
  return {
    robotsUrl,
    sitemapUrl,
    sitemapCount: sitemapUrls.length,
    pages,
    collectedAt: new Date().toISOString(),
    sitemapDigest,
    inspectionScope: "bounded_core_v1" as const,
    robotsStatus: robots.status,
    sitemapStatus: sitemap.status,
    robotsDeclaresSitemap,
    manifestIssue,
    circuitOpen: firstPass.circuitOpen || retryCircuitOpen,
  };
}

function provider(source: string, payload: { collectedAt?: string } | null, rangeDays: number, refreshFailure: string | undefined, metadata: Pick<ProviderSummary, "configured" | "kind">): ProviderSummary {
  if (!payload) return { status: "unavailable", source, rangeDays, note: refreshFailure ?? "No local export or configured live response.", ...metadata };
  if (isStale(payload.collectedAt)) return { status: "stale", source, rangeDays, collectedAt: payload.collectedAt, note: refreshFailure ? `Refresh failed; retained stale evidence. ${refreshFailure}`.slice(0, 180) : "Local evidence is older than eight days.", ...metadata };
  return { status: refreshFailure ? "partial" : "available", source, rangeDays, collectedAt: payload.collectedAt, note: refreshFailure ? `Refresh failed; retained current evidence. ${refreshFailure}`.slice(0, 180) : undefined, ...metadata };
}

async function safeRefresh<T>(existing: T | null, enabled: boolean, run: () => Promise<T>) {
  if (!enabled) return { data: existing, failure: undefined as string | undefined };
  try { return { data: await run(), failure: undefined as string | undefined }; }
  catch (error) { return { data: existing, failure: error instanceof Error ? error.message : "Provider refresh failed." }; }
}

type SearchConsoleData = {
  collectedAt: string;
  queries: SearchQueryMetric[];
  queryRows: SearchQueryMetric[];
  queryAttributed: { clicks: number; impressions: number };
  pages: VisibilitySnapshotV1["searchConsole"]["pages"];
  totals: VisibilitySnapshotV1["searchConsole"]["totals"];
  period: { startDate: string; endDate: string };
  generativeAiAvailable: boolean;
  daily: AggregateMetric[];
  devices: AggregateMetric[];
  countries: AggregateMetric[];
  searchAppearances: AggregateMetric[];
  generativeAi?: { impressions: number; clicks: number; pages: number; collectedAt: string };
  bulkExport?: VisibilitySnapshotV1["searchConsole"]["bulkExport"];
};

export function finalizedVisibilityWindow(rangeDays: number, now = new Date(), timeZone = "America/Los_Angeles") {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  const today = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
  const end = new Date(today - 3 * 86_400_000);
  const start = new Date(end.getTime() - (rangeDays - 1) * 86_400_000);
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
}

async function refreshSearchConsole(rangeDays: number, localDir: string, dryRun: boolean): Promise<SearchConsoleData> {
  const token = await googleAccessToken(localDir);
  const property = process.env.TNM_VISIBILITY_GSC_PROPERTY ?? "sc-domain:truenorthmap.ca";
  // Google recommends a two-to-three day finalization buffer for repeatable daily reporting.
  const { startDate, endDate } = finalizedVisibilityWindow(rangeDays);
  const run = async (dimensions: string[]) => {
    const rows: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }> = [];
    let startRow = 0;
    while (true) {
      const response = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ startDate, endDate, dimensions, rowLimit: searchConsolePageSize, startRow }), signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`Search Console read failed for ${dimensions.join(",") || "totals"}: ${response.status}`);
      const batch = (await response.json() as { rows?: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }> }).rows ?? [];
      rows.push(...batch);
      if (batch.length < searchConsolePageSize) return { rows };
      startRow += batch.length;
    }
  };
  const [queryPageRaw, queryRaw, pageRaw, totalsRaw, dailyRaw, deviceRaw, countryRaw, appearanceRaw] = await Promise.all([
    run(["query", "page"]), run(["query"]), run(["page"]), run([]), run(["date"]), run(["device"]), run(["country"]), run(["searchAppearance"]),
  ]);
  const aggregate = (raw: Awaited<ReturnType<typeof run>>) => (raw.rows ?? []).map((row) => ({ label: row.keys?.[0] ?? "unknown", clicks: row.clicks ?? 0, impressions: row.impressions ?? 0 }));
  const totalRow = totalsRaw.rows[0];
  const normalized: SearchConsoleData = {
    collectedAt: new Date().toISOString(),
    queries: (queryPageRaw.rows ?? []).map((row) => ({ query: row.keys?.[0] ?? "", page: row.keys?.[1], clicks: row.clicks ?? 0, impressions: row.impressions ?? 0, ctr: row.ctr ?? 0, position: row.position ?? 0 })),
    queryRows: (queryRaw.rows ?? []).map((row) => ({ query: row.keys?.[0] ?? "", clicks: row.clicks ?? 0, impressions: row.impressions ?? 0, ctr: row.ctr ?? 0, position: row.position ?? 0 })),
    queryAttributed: {
      clicks: (queryRaw.rows ?? []).reduce((total, row) => total + (row.clicks ?? 0), 0),
      impressions: (queryRaw.rows ?? []).reduce((total, row) => total + (row.impressions ?? 0), 0),
    },
    pages: (pageRaw.rows ?? []).flatMap((row) => {
      const page = row.keys?.[0];
      if (!page || !isPublicTnmUrl(page, siteUrl)) return [];
      return [{ path: new URL(page).pathname, clicks: row.clicks ?? 0, impressions: row.impressions ?? 0, ctr: row.ctr ?? 0, position: typeof row.position === "number" ? row.position : null }];
    }),
    totals: { clicks: totalRow?.clicks ?? 0, impressions: totalRow?.impressions ?? 0, ctr: totalRow?.ctr ?? 0, position: typeof totalRow?.position === "number" ? totalRow.position : null },
    period: { startDate, endDate },
    generativeAiAvailable: false, daily: aggregate(dailyRaw), devices: aggregate(deviceRaw), countries: aggregate(countryRaw).sort((a, b) => (b.impressions ?? 0) - (a.impressions ?? 0)), searchAppearances: aggregate(appearanceRaw),
  };
  await writeProviderArtifact(localDir, "search-console", normalized, { queryPageRaw, queryRaw, pageRaw, totalsRaw, dailyRaw, deviceRaw, countryRaw, appearanceRaw }, dryRun);
  return normalized;
}

type Ga4Data = VisibilitySnapshotV1["ga4"] & { collectedAt: string; intelligence?: VisibilityIntelligence["ga4"] };
async function refreshGa4(rangeDays: number, localDir: string, dryRun: boolean): Promise<Ga4Data> {
  const property = process.env.TNM_VISIBILITY_GA4_PROPERTY;
  if (!property) throw new Error("GA4 property is not configured.");
  const token = await googleAccessToken(localDir);
  const window = finalizedVisibilityWindow(rangeDays, new Date(), "America/Halifax");
  const dateRanges = [window];
  const recentEnd = new Date(`${new Intl.DateTimeFormat("en-CA", {timeZone:"America/Halifax",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())}T12:00:00Z`);
  recentEnd.setUTCDate(recentEnd.getUTCDate()-1);
  const recentStart = new Date(recentEnd); recentStart.setUTCDate(recentStart.getUTCDate()-6);
  const recentWindow = {startDate:recentStart.toISOString().slice(0,10),endDate:recentEnd.toISOString().slice(0,10)};
  const productionHostFilter = { filter: { fieldName: "hostName", stringFilter: { matchType: "EXACT", value: "truenorthmap.ca", caseSensitive: false } } };
  const runReport = async (body: Record<string, unknown>) => {
    const rows: Array<{ dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }> = [];
    let offset = 0;
    while (true) {
      const existingFilter = body.dimensionFilter;
      const dimensionFilter = existingFilter
        ? { andGroup: { expressions: [productionHostFilter, existingFilter] } }
        : productionHostFilter;
      const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/${property}:runReport`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ ...body, dimensionFilter, limit: ga4PageSize, offset }), signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`GA4 read failed: ${response.status}`);
      const batch = (await response.json() as { rows?: Array<{ dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }> }).rows ?? [];
      rows.push(...batch);
      if (batch.length < ga4PageSize) return { rows };
      offset += batch.length;
    }
  };
  const [landingRaw, referralRaw, referralDailyRaw, acquisitionRaw, eventRaw, contentEventRaw, aiLandingRaw, segmentRaw, recentRaw] = await Promise.all([
    runReport({ dateRanges, dimensions: [{ name: "landingPage" }, { name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }, { name: "engagedSessions" }, { name: "keyEvents" }, { name: "userEngagementDuration" }] }),
    runReport({ dateRanges, dimensions: [{ name: "sessionSource" }], metrics: [{ name: "sessions" }] }),
    runReport({ dateRanges, dimensions: [{ name: "date" }, { name: "sessionSource" }], metrics: [{ name: "sessions" }] }),
    runReport({ dateRanges, dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }, { name: "engagedSessions" }, { name: "keyEvents" }] }),
    runReport({ dateRanges, dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }], dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: ["tnm_content_view", "tnm_organic_entry", "tnm_landing_entry", "tnm_external_source_open", "tnm_working_list_intent"] } } } }),
    runReport({ dateRanges, dimensions: [{ name: "eventName" }, { name: "customEvent:content_type" }], metrics: [{ name: "eventCount" }], dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: [...eventNames] } } } }),
    runReport({ dateRanges, dimensions: [{ name: "landingPage" }, { name: "sessionSource" }], metrics: [{ name: "sessions" }, { name: "engagedSessions" }, { name: "keyEvents" }] }),
    Promise.all(["entry_path", "search_engine", "campaign"].map(async dimension => {
      const result = await runReport({
        dateRanges,
        dimensions: [{ name: dimension === "campaign" ? "sessionCampaignName" : `customEvent:${dimension}` }],
        metrics: [{ name: "eventCount" }, { name: "sessions" }],
        ...(dimension === "campaign" ? {} : {
          dimensionFilter: { filter: { fieldName: "eventName", stringFilter: { matchType: "EXACT", value: dimension === "entry_path" ? "tnm_landing_entry" : "tnm_organic_entry" } } }
        })
      });
      return { dimension, ...result };
    })),
    runReport({dateRanges:[recentWindow],metrics:[{name:"sessions"},{name:"eventCount"}]}),
  ]);
  const landings = landingRaw.rows.flatMap(row => {
    const pathname = publicPath(row.dimensionValues?.[0]?.value); if (!pathname) return [];
    const channel = row.dimensionValues?.[1]?.value ?? "Other";
    return [{ path: pathname, channel: channels.has(channel) ? channel : "Other", sessions: Number(row.metricValues?.[0]?.value ?? 0), engagedSessions: Number(row.metricValues?.[1]?.value ?? 0), keyEvents: Number(row.metricValues?.[2]?.value ?? 0) }];
  });
  landings.push(...aiLandingRaw.rows.flatMap(row => {
    const pathname = publicPath(row.dimensionValues?.[0]?.value); if (!pathname || !isKnownAiReferralSource(row.dimensionValues?.[1]?.value ?? "")) return [];
    return [{ path: pathname, channel: "AI assistants", sessions: Number(row.metricValues?.[0]?.value ?? 0), engagedSessions: Number(row.metricValues?.[1]?.value ?? 0), keyEvents: Number(row.metricValues?.[2]?.value ?? 0) }];
  }));
  const normalized: Ga4Data = {
    intelligence: { period: { ...window, timeZone: "America/Halifax" }, landings, recentCollection: {period:{...recentWindow,timeZone:"America/Halifax"},sessions:Number(recentRaw.rows[0]?.metricValues?.[0]?.value??0),events:Number(recentRaw.rows[0]?.metricValues?.[1]?.value??0),status:"provisional"}, segments: segmentRaw.flatMap(result => {
      const rows = new Map<string,{dimension:"entry_path"|"search_engine"|"campaign";label:string;events:number;sessions:number}>();
      for(const row of result.rows) { const rawLabel=row.dimensionValues?.[0]?.value??""; const label=validTrafficLabel(result.dimension,rawLabel)?rawLabel:result.dimension === "campaign"?"untagged_or_other":"unknown"; const current=rows.get(label)??{dimension:result.dimension as "entry_path"|"search_engine"|"campaign",label,events:0,sessions:0};current.events+=Number(row.metricValues?.[0]?.value??0);current.sessions+=Number(row.metricValues?.[1]?.value??0);rows.set(label,current); }
      return [...rows.values()];
    }), events: contentEventRaw.rows.flatMap(row => {
      const event = row.dimensionValues?.[0]?.value ?? ""; if (!eventNames.has(event)) return [];
      const contentType = row.dimensionValues?.[1]?.value ?? "unknown";
      return [{ event, contentType: contentTypes.has(contentType) ? contentType : "unknown", events: Number(row.metricValues?.[0]?.value ?? 0) }];
    }) },
    collectedAt: new Date().toISOString(),
    organicLandingPages: (landingRaw.rows ?? []).filter((row) => row.dimensionValues?.[1]?.value === "Organic Search").map((row) => ({ page: (row.dimensionValues?.[0]?.value ?? "/").split("?")[0], sessions: Number(row.metricValues?.[0]?.value ?? 0), engagedSessions: Number(row.metricValues?.[1]?.value ?? 0), keyEvents: Number(row.metricValues?.[2]?.value ?? 0), engagementSeconds: Math.round(Number(row.metricValues?.[3]?.value ?? 0)) })),
    aiReferrals: (referralRaw.rows ?? []).filter((row) => isKnownAiReferralSource(row.dimensionValues?.[0]?.value ?? "")).map((row) => ({ source: row.dimensionValues?.[0]?.value ?? "AI referral", sessions: Number(row.metricValues?.[0]?.value ?? 0) })),
    acquisitionChannels: (acquisitionRaw.rows ?? []).map((row) => ({ label: row.dimensionValues?.[0]?.value ?? "Other", sessions: Number(row.metricValues?.[0]?.value ?? 0), engagedSessions: Number(row.metricValues?.[1]?.value ?? 0), keyEvents: Number(row.metricValues?.[2]?.value ?? 0) })),
    // Source hostnames are deliberately categorized before leaving the local raw artifact.
    referralCategories: (referralRaw.rows ?? []).reduce<AggregateMetric[]>((rows, row) => {
      const source = row.dimensionValues?.[0]?.value ?? "";
      const label = isKnownAiReferralSource(source) ? "AI assistants" : source.toLowerCase() === "accounts.google.com" ? "Other referrals" : /^(?:www\.)?(?:google(?:\.[a-z.]+)?|bing(?:\.[a-z.]+)?|duckduckgo(?:\.[a-z.]+)?)$/i.test(source) ? "Search engines" : /linkedin|x\.com|twitter|facebook|instagram/i.test(source) ? "Social networks" : source === "(direct)" ? "Direct" : "Other referrals";
      const existing = rows.find((item) => item.label === label);
      if (existing) existing.sessions = (existing.sessions ?? 0) + Number(row.metricValues?.[0]?.value ?? 0);
      else rows.push({ label, sessions: Number(row.metricValues?.[0]?.value ?? 0) });
      return rows;
    }, []).sort((a, b) => (b.sessions ?? 0) - (a.sessions ?? 0)),
    clickEvents: (eventRaw.rows ?? []).map((row) => ({ label: row.dimensionValues?.[0]?.value ?? "public_event", events: Number(row.metricValues?.[0]?.value ?? 0) })),
    aiReferralDaily: (referralDailyRaw.rows ?? []).filter((row) => isKnownAiReferralSource(row.dimensionValues?.[1]?.value ?? "")).reduce<AggregateMetric[]>((days, row) => {
      const rawDate = row.dimensionValues?.[0]?.value ?? "";
      const label = /^\d{8}$/.test(rawDate) ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}` : rawDate;
      const existing = days.find((item) => item.label === label);
      if (existing) existing.sessions = (existing.sessions ?? 0) + Number(row.metricValues?.[0]?.value ?? 0);
      else if (label) days.push({ label, sessions: Number(row.metricValues?.[0]?.value ?? 0) });
      return days;
    }, []).sort((a, b) => a.label.localeCompare(b.label)),
  };
  await writeProviderArtifact(localDir, "ga4", normalized, { landingRaw, referralRaw, referralDailyRaw, acquisitionRaw, eventRaw, contentEventRaw, aiLandingRaw, segmentRaw, recentRaw }, dryRun);
  return normalized;
}

function metricPercentile(raw: Record<string, unknown>, key: string) {
  const metrics = (raw.loadingExperience as { metrics?: Record<string, { percentile?: number }> } | undefined)?.metrics;
  return metrics?.[key]?.percentile ?? null;
}

async function refreshPageSpeed(localDir: string, dryRun: boolean): Promise<WebPerformance> {
  const key = process.env.TNM_VISIBILITY_PAGESPEED_API_KEY;
  if (!key) throw new Error("PageSpeed API key is not configured.");
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(siteUrl)}&strategy=mobile&category=performance&key=${encodeURIComponent(key)}`;
  let response: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try { response = await fetch(endpoint, { signal: AbortSignal.timeout(slowProviderTimeoutMs) }); }
    catch (error) {
      if (attempt === 2) throw error;
      await retryPause(attempt);
      continue;
    }
    if (response.ok || (response.status !== 429 && response.status < 500) || attempt === 2) break;
    await response.body?.cancel();
    await retryPause(attempt);
  }
  if (!response) throw new Error("PageSpeed read failed before a response was received.");
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

type ImportedProvider = { collectedAt: string; period?: { startDate: string; endDate: string }; searchCohorts?: SearchCohort[]; bingHealth?: VisibilityIntelligence["bingHealth"]; backlinks?: VisibilitySnapshotV1["backlinks"]; searchRows?: SearchQueryMetric[]; crawlStats?: AggregateMetric[]; backlinkCount?: number; organicKeywords?: number; siteAuditIssues?: number; internalLinkSuggestions?: number; trendSignals?: number; generativeAi?: SearchConsoleData["generativeAi"]; bulkExport?: SearchConsoleData["bulkExport"] };

async function refreshBing(rangeDays: number, localDir: string, dryRun: boolean): Promise<ImportedProvider> {
  const apiKey = process.env.TNM_VISIBILITY_BING_API_KEY;
  if (!apiKey) throw new Error("Bing Webmaster API key is not configured.");
  const get = async (method: string, page?: number) => {
    const response = await fetch(`https://ssl.bing.com/webmaster/api.svc/json/${method}?siteUrl=${encodeURIComponent(siteUrl)}&apikey=${encodeURIComponent(apiKey)}${page === undefined ? "" : `&page=${page}`}`, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`Bing Webmaster ${method} read failed: ${response.status}`);
    return response.json() as Promise<{ d?: Array<Record<string, unknown>> | Record<string, unknown> }>;
  };
  const period = finalizedVisibilityWindow(rangeDays);
  const [raw, crawlRaw, firstLinks] = await Promise.all([get("GetQueryStats"), get("GetCrawlStats"), get("GetLinkCounts", 0)]);
  const queryRows = Array.isArray(raw.d) ? raw.d : [];
  const searchRows: SearchQueryMetric[] = queryRows.flatMap(row => {
    const date = parseBingDate(row.Date);
    if (!date || date < period.startDate || date > period.endDate || typeof row.Query !== "string") return [];
    const impressions = Number(row.Impressions ?? 0), clicks = Number(row.Clicks ?? 0);
    return [{ query: row.Query, clicks, impressions, ctr: impressions ? clicks / impressions : 0, position: Number(row.AvgImpressionPosition ?? 0) }];
  });
  const linkPages = [firstLinks];
  const firstData = !Array.isArray(firstLinks.d) ? firstLinks.d : undefined;
  if (!firstData || !Array.isArray(firstData.Links) || !Number.isInteger(firstData.TotalPages)) throw new Error("Bing link-count response contract changed.");
  for (let page = 1; page < Number(firstData.TotalPages); page += 1) linkPages.push(await get("GetLinkCounts", page));
  const links = linkPages.flatMap(p => !Array.isArray(p.d) && Array.isArray(p.d?.Links) ? p.d.Links as Array<Record<string, unknown>> : []);
  // GetLinkCounts describes target-page link counts, not referring domains.
  const backlinkCount = links.reduce((n, r) => n + Number(r.Count ?? 0), 0);
  const health = bingHealthRows(Array.isArray(crawlRaw.d) ? crawlRaw.d : []);
  const normalized: ImportedProvider = { collectedAt: new Date().toISOString(), period, searchRows, backlinks: [], crawlStats: [], backlinkCount, bingHealth: health };
  await writeProviderArtifact(localDir, "bing", normalized, { queryStats: raw, crawlStats: crawlRaw, linkCounts: linkPages }, dryRun);
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
  const parsedJson = source.toLowerCase().endsWith(".json") ? JSON.parse(contents) : null;
  if (["google-ai", "bing-ai", "generative-ai"].includes(providerName)) {
    if (!parsedJson || !validAiReport(parsedJson) || (providerName !== "generative-ai" && (parsedJson as AiReport).provider !== providerName)) throw new Error("AI imports require a typed dated AiReport JSON, with null clicks and canonical page aggregates. Use the provider export conversion workflow.");
    const ai = parsedJson as AiReport;
    await writeProviderArtifact(options.localDir, ai.provider, ai, { importedAt: new Date().toISOString(), sourceFileName: path.basename(source) }, options.dryRun);
    console.log(JSON.stringify({ ok: true, provider: ai.provider, period: ai.period, rows: ai.rows.length })); return;
  }
  if (providerName === "gsc-links") {
    if (!validEarnedReferences(parsedJson)) throw new Error("Earned-reference import requires a dated aggregate GSC report.");
    await writeProviderArtifact(options.localDir, providerName, parsedJson, { importedAt: new Date().toISOString() }, options.dryRun); return;
  }
  if (providerName === "index-coverage") {
    const bundle = { schemaVersion: "tnm_visibility_intelligence_v1", aiReports: [], searchCohorts: [], ga4: null, answerSources: [], bingHealth: [], indexCoverage: parsedJson, annotations: [] };
    if (!validIntelligence(bundle)) throw new Error("Index coverage needs a typed dated report with closed reason categories.");
    await writeProviderArtifact(options.localDir, providerName, parsedJson, { importedAt: new Date().toISOString() }, options.dryRun); return;
  }
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
  const bulkProperty = process.env.TNM_VISIBILITY_GSC_BULK_SITE_URL ?? process.env.TNM_VISIBILITY_GSC_PROPERTY ?? `${siteUrl}/`;
  const { startDate: start, endDate: end } = finalizedVisibilityWindow(rangeDays);
  const query = `
    WITH performance AS (
      SELECT
        COUNT(*) AS row_count,
        COALESCE(SUM(impressions), 0) AS impressions,
        COALESCE(SUM(clicks), 0) AS clicks,
        SAFE_DIVIDE(SUM(sum_top_position), SUM(impressions)) + 1 AS average_position,
        COUNT(DISTINCT IF(NOT is_anonymized_query, query, NULL)) AS non_anonymized_queries,
        COALESCE(SUM(IF(is_anonymized_query, impressions, 0)), 0) AS anonymized_impressions,
        COALESCE(SUM(IF(is_anonymized_query, clicks, 0)), 0) AS anonymized_clicks,
        MIN(data_date) AS first_date,
        MAX(data_date) AS latest_date
      FROM \`${project}.${dataset}.searchdata_site_impression\`
      WHERE data_date BETWEEN @start AND @end AND search_type = 'WEB' AND site_url = @site
    ), export_health AS (
      SELECT
        COUNT(DISTINCT IF(REGEXP_CONTAINS(LOWER(namespace), r'site') AND data_date BETWEEN @start AND @end, data_date, NULL)) AS site_exported_days,
        COUNT(DISTINCT IF(REGEXP_CONTAINS(LOWER(namespace), r'url') AND data_date BETWEEN @start AND @end, data_date, NULL)) AS url_exported_days,
        MIN(IF(REGEXP_CONTAINS(LOWER(namespace), r'site'), data_date, NULL)) AS site_first_date,
        MIN(IF(REGEXP_CONTAINS(LOWER(namespace), r'url'), data_date, NULL)) AS url_first_date,
        MAX(IF(REGEXP_CONTAINS(LOWER(namespace), r'site') AND data_date BETWEEN @start AND @end, data_date, NULL)) AS site_latest_date,
        MAX(IF(REGEXP_CONTAINS(LOWER(namespace), r'url') AND data_date BETWEEN @start AND @end, data_date, NULL)) AS url_latest_date
      FROM \`${project}.${dataset}.ExportLog\`
    )
    SELECT
      performance.row_count,
      performance.impressions,
      performance.clicks,
      performance.average_position,
      performance.non_anonymized_queries,
      performance.anonymized_impressions,
      performance.anonymized_clicks,
      LEAST(export_health.site_exported_days, export_health.url_exported_days) AS exported_days,
      CAST(performance.first_date AS STRING),
      CAST(performance.latest_date AS STRING),
      export_health.site_exported_days,
      export_health.url_exported_days,
      CAST(export_health.site_first_date AS STRING),
      CAST(export_health.url_first_date AS STRING),
      CAST(export_health.site_latest_date AS STRING),
      CAST(export_health.url_latest_date AS STRING)
    FROM performance CROSS JOIN export_health`;
  const response = await fetch(`https://bigquery.googleapis.com/bigquery/v2/projects/${encodeURIComponent(project)}/queries`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ query, useLegacySql: false, parameterMode: "NAMED", queryParameters: [{ name: "start", parameterType: { type: "DATE" }, parameterValue: { value: start } }, { name: "end", parameterType: { type: "DATE" }, parameterValue: { value: end } }, { name: "site", parameterType: { type: "STRING" }, parameterValue: { value: bulkProperty } }] }), signal: AbortSignal.timeout(60_000) });
  if (!response.ok) {
    const failure = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    const message = failure?.error?.message ?? "unknown BigQuery error";
    if (response.status === 404 && /not found|does not exist/i.test(message)) throw new Error("GSC BigQuery export is active but its initial Search Console tables are still pending; Google allows up to 48 hours after activation.");
    throw new Error(`GSC BigQuery bulk export read failed: ${response.status} (${message}).`);
  }
  const raw = await response.json() as { jobComplete?: boolean; rows?: Array<{ f?: Array<{ v?: string | null }> }> };
  if (raw.jobComplete === false) throw new Error("GSC BigQuery bulk export aggregate query did not complete within the synchronous read window.");
  const values = raw.rows?.[0]?.f ?? [];
  const siteExportedDays = Number(values[10]?.v ?? 0);
  const urlExportedDays = Number(values[11]?.v ?? 0);
  const siteFirstDate = values[12]?.v ?? undefined;
  const urlFirstDate = values[13]?.v ?? undefined;
  const siteLatestDate = values[14]?.v ?? undefined;
  const urlLatestDate = values[15]?.v ?? undefined;
  const expectedDaysFrom = (firstDate: string | undefined) => firstDate
    ? Math.floor((Date.parse(`${end}T00:00:00.000Z`) - Date.parse(`${firstDate > start ? firstDate : start}T00:00:00.000Z`)) / 86_400_000) + 1
    : 0;
  const expectedSiteDays = expectedDaysFrom(siteFirstDate);
  const expectedUrlDays = expectedDaysFrom(urlFirstDate);
  if (!siteFirstDate || !urlFirstDate || !siteLatestDate || !urlLatestDate || siteLatestDate < end || urlLatestDate < end || siteExportedDays < expectedSiteDays || urlExportedDays < expectedUrlDays) {
    if (gscBulkExportWarmupActive()) throw new Error("GSC BigQuery export is active but its initial Search Console tables are still pending; Google allows up to 48 hours after activation.");
    throw new Error("GSC BigQuery export health is incomplete for the finalized reporting window.");
  }
  const collectedAt = new Date().toISOString();
  const nullableNumber = (value: string | null | undefined) => value === null || value === undefined || value === "" ? null : Number(value);
  const normalized: ImportedProvider = {
    collectedAt,
    bulkExport: {
      rows: Number(values[0]?.v ?? 0),
      impressions: Number(values[1]?.v ?? 0),
      clicks: Number(values[2]?.v ?? 0),
      averagePosition: nullableNumber(values[3]?.v),
      nonAnonymizedQueries: Number(values[4]?.v ?? 0),
      anonymizedImpressions: Number(values[5]?.v ?? 0),
      anonymizedClicks: Number(values[6]?.v ?? 0),
      exportedDays: Number(values[7]?.v ?? 0),
      siteExportedDays,
      urlExportedDays,
      firstDate: values[8]?.v ?? undefined,
      latestDate: values[9]?.v ?? undefined,
      siteLatestDate,
      urlLatestDate,
      collectedAt,
    },
  };
  // URL/date/country/device aggregates contain no query text. Keep both anonymized
  // and visible-query contributions and normalize navigation variants locally.
  const cohortQuery = `SELECT CAST(data_date AS STRING), url, country, device, SUM(clicks), SUM(impressions), SAFE_DIVIDE(SUM(sum_position), SUM(impressions)) + 1 FROM \`${project}.${dataset}.searchdata_url_impression\` WHERE data_date BETWEEN @start AND @end AND search_type = 'WEB' AND site_url = @site GROUP BY 1,2,3,4 ORDER BY 1,2,3,4`;
  const cohortBody = { query: cohortQuery, useLegacySql: false, parameterMode: "NAMED", maxResults: 10000, location: process.env.TNM_VISIBILITY_GSC_BULK_LOCATION ?? "northamerica-northeast1", queryParameters: [{ name: "start", parameterType: { type: "DATE" }, parameterValue: { value: start } }, { name: "end", parameterType: { type: "DATE" }, parameterValue: { value: end } }, { name: "site", parameterType: { type: "STRING" }, parameterValue: { value: bulkProperty } }] };
  type CohortPage = { jobComplete?: boolean; pageToken?: string; jobReference?: { jobId: string; location: string }; rows?: Array<{ f?: Array<{ v?: string | null }> }> };
  const cohortResponse = await fetch(`https://bigquery.googleapis.com/bigquery/v2/projects/${encodeURIComponent(project)}/queries`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(cohortBody), signal: AbortSignal.timeout(60000) });
  if (!cohortResponse.ok) throw new Error(`BigQuery URL cohort query failed: ${cohortResponse.status}`);
  let cohortPage = await cohortResponse.json() as CohortPage;
  const cohortRows = [...(cohortPage.rows ?? [])];
  const cohortDeadline = Date.now() + 120_000;
  while (cohortPage.pageToken || cohortPage.jobComplete === false) {
    if (Date.now() > cohortDeadline) throw new Error("BigQuery URL cohort pagination exceeded two minutes.");
    if (!cohortPage.jobReference) throw new Error("BigQuery URL cohort job reference missing.");
    const endpoint = new URL(`https://bigquery.googleapis.com/bigquery/v2/projects/${encodeURIComponent(project)}/queries/${encodeURIComponent(cohortPage.jobReference.jobId)}`);
    endpoint.searchParams.set("location", cohortPage.jobReference.location); endpoint.searchParams.set("maxResults", "10000"); endpoint.searchParams.set("timeoutMs", "10000");
    if (cohortPage.pageToken) endpoint.searchParams.set("pageToken", cohortPage.pageToken);
    const next = await fetch(endpoint, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30000) });
    if (!next.ok) throw new Error(`BigQuery URL cohort pagination failed: ${next.status}`);
    cohortPage = await next.json() as CohortPage; cohortRows.push(...(cohortPage.rows ?? []));
  }
  const grouped = new Map<string, SearchCohort>();
  for (const row of cohortRows) {
    const v = row.f ?? []; const pathname = publicPath(v[1]?.v); if (!pathname) continue;
    const country = String(v[2]?.v ?? "ZZZ").toUpperCase(); const device = String(v[3]?.v ?? "OTHER").toUpperCase();
    const date = String(v[0]?.v); const key = [date, pathname, country, device].join("|"); const prior = grouped.get(key);
    const impressions = Number(v[5]?.v ?? 0), clicks = Number(v[4]?.v ?? 0), position = v[6]?.v == null ? null : Number(v[6].v);
    const total = impressions + (prior?.impressions ?? 0);
    grouped.set(key, { date, path: pathname, country, device, impressions: total, clicks: clicks + (prior?.clicks ?? 0), position: total ? ((position ?? 0) * impressions + (prior?.position ?? 0) * (prior?.impressions ?? 0)) / total : null });
  }
  normalized.searchCohorts = [...grouped.values()];
  await writeProviderArtifact(localDir, "gsc-bulk", normalized, raw, dryRun);
  return normalized;
}

type DataForSeoData = { collectedAt: string; answerSources?: AnswerSource[]; backlinks: VisibilitySnapshotV1["backlinks"]; requestedTasks: number; trackedTopTen: number; intentGroups?: DataForSeoIntentGroup[]; features?: DataForSeoFeatures; newTasks?: number; actualCostUsd?: number; taskResults?: unknown[] };
type DataForSeoApiResponse = {
  status_code?: number;
  status_message?: string;
  cost?: number;
  tasks?: Array<{ status_code?: number; status_message?: string; cost?: number; data?: { keyword?: string }; result?: unknown[] }>;
};
type DataForSeoRunData = DataForSeoData & { newTasks: number; actualCostUsd: number };

function validateDataForSeoResponse(payload: DataForSeoApiResponse, keyword: string) {
  if (payload.status_code !== 20000) throw new Error(`DataForSEO request failed for ${keyword}: ${payload.status_message ?? payload.status_code ?? "unknown status"}`);
  if (!Array.isArray(payload.tasks) || payload.tasks.length !== 1) throw new Error(`DataForSEO returned no task for ${keyword}.`);
  const failedTask = payload.tasks?.find((task) => task.status_code !== 20000);
  if (failedTask) throw new Error(`DataForSEO task failed for ${keyword}: ${failedTask.status_message ?? failedTask.status_code ?? "unknown status"}`);
  if (!Array.isArray(payload.tasks[0]?.result)) throw new Error(`DataForSEO returned no live result for ${keyword}.`);
  return Number(payload.cost ?? payload.tasks?.reduce((total, task) => total + Number(task.cost ?? 0), 0) ?? 0);
}

type DataForSeoItem = { type?: string; rank_group?: number; url?: string; domain?: string; asynchronous_ai_overview?: boolean; references?: unknown[]; items?: unknown[]; markdown?: string | null };
function dataForSeoItems(response: unknown) {
  const typed = response as { tasks?: Array<{ result?: Array<{ items?: DataForSeoItem[] }> }> } | null;
  return (typed?.tasks ?? []).flatMap((task) => (task.result ?? []).flatMap((result) => result.items ?? []));
}

function dataForSeoTaskIsTopTen(response: unknown) {
  return dataForSeoItems(response).some((item) => item.type === "organic" && (item.rank_group ?? 99) <= 10
    && (/(^|\.)truenorthmap\.ca$/i.test(item.domain ?? "") || /https?:\/\/(?:[^/]+\.)?truenorthmap\.ca(?:\/|$)/i.test(item.url ?? "")));
}

function isTnmReference(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(isTnmReference);
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  for (const key of ["url", "domain", "source_url", "link"]) {
    const candidate = record[key];
    if (typeof candidate !== "string") continue;
    try {
      const hostname = new URL(candidate.includes("://") ? candidate : `https://${candidate}`).hostname.toLowerCase().replace(/^www\./, "");
      if (hostname === "truenorthmap.ca" || hostname.endsWith(".truenorthmap.ca")) return true;
    } catch { /* Ignore malformed provider reference fields. */ }
  }
  return Object.values(record).some(isTnmReference);
}

const safeSeedIntentGroups = new Set(["ecosystem-discovery", "mission-capability", "business-development"]);
function safeSeedIntentGroup(value: string | undefined) {
  return value && safeSeedIntentGroups.has(value) ? value : "other";
}

function summarizeDataForSeoFeatures(rawResults: unknown[]): DataForSeoFeatures {
  let aiOverviewTasks = 0;
  let aiOverviewResolvedTasks = 0;
  let peopleAlsoAskTasks = 0;
  let featuredSnippetTasks = 0;
  let videoTasks = 0;
  let relatedSearchesTasks = 0;
  let tnmInAiOverviewTasks = 0;
  for (const response of rawResults) {
    const items = dataForSeoItems(response);
    const aiItems = items.filter((item) => item.type === "ai_overview");
    if (aiItems.length) aiOverviewTasks += 1;
    const resolved = aiItems.some((item) => item.asynchronous_ai_overview === false || Boolean(item.markdown)
      || (Array.isArray(item.references) && item.references.length > 0)
      || (Array.isArray(item.items) && item.items.length > 0));
    if (resolved) {
      aiOverviewResolvedTasks += 1;
      if (aiItems.some((item) => isTnmReference(item.references) || isTnmReference(item.items))) tnmInAiOverviewTasks += 1;
    }
    if (items.some((item) => item.type === "people_also_ask")) peopleAlsoAskTasks += 1;
    if (items.some((item) => item.type === "featured_snippet")) featuredSnippetTasks += 1;
    if (items.some((item) => item.type === "video")) videoTasks += 1;
    if (items.some((item) => item.type === "related_searches")) relatedSearchesTasks += 1;
  }
  const citationCount = tnmInAiOverviewTasks > 0 ? tnmInAiOverviewTasks : aiOverviewTasks > 0 && aiOverviewResolvedTasks === aiOverviewTasks ? 0 : null;
  return { aiOverviewTasks, aiOverviewResolvedTasks, peopleAlsoAskTasks, featuredSnippetTasks, videoTasks, relatedSearchesTasks, tnmInAiOverviewTasks: citationCount };
}

function summarizeDataForSeo(queryEntries: Array<{ groupId: string; keyword: string }>, rawResults: unknown[]) {
  const groups = new Map<string, DataForSeoIntentGroup>();
  rawResults.forEach((response, index) => {
    const entry = queryEntries[index];
    if (!entry) return;
    const group = groups.get(entry.groupId) ?? { id: entry.groupId, tasks: 0, trackedTopTen: 0 };
    group.tasks += 1;
    if (dataForSeoTaskIsTopTen(response)) group.trackedTopTen += 1;
    groups.set(entry.groupId, group);
  });
  const intentGroups = [...groups.values()].sort((a, b) => a.id.localeCompare(b.id));
  const sources = new Map<string, AnswerSource>();
  rawResults.forEach((response, index) => {
    const group = safeSeedIntentGroup(queryEntries[index]?.groupId);
    const seen = new Set<string>();
    const visit = (value: unknown, kind: AnswerSource["kind"]) => {
      if (Array.isArray(value)) { value.forEach(v => visit(v, kind)); return; }
      if (!value || typeof value !== "object") return;
      const row = value as Record<string, unknown>;
      const rawUrl = row.url ?? row.source_url;
      if (typeof rawUrl === "string") try {
        const u = new URL(rawUrl); u.search = ""; u.hash = "";
        if (u.protocol === "https:" && !u.username && !u.password && !/@|%40/.test(u.pathname)) {
          const key = `${kind}|${group}|${u.href}`;
          if (!seen.has(key)) { seen.add(key); const prior = sources.get(key); sources.set(key, { domain: u.hostname, url: u.href, kind, group, appearances: (prior?.appearances ?? 0) + 1 }); }
        }
      } catch { /* Malformed public reference omitted. */ }
      if (row.items) visit(row.items, kind);
    };
    for (const item of dataForSeoItems(response)) {
      if (item.type === "organic") visit(item, "organic");
      if (item.type === "ai_overview") { visit(item.references, "ai_reference"); visit(item.items, "ai_reference"); }
    }
  });
  return { trackedTopTen: rawResults.filter(dataForSeoTaskIsTopTen).length, intentGroups, features: summarizeDataForSeoFeatures(rawResults), answerSources: [...sources.values()].sort((a, b) => b.appearances - a.appearances) };
}

async function collectDataForSeo(options: Options, existing: DataForSeoData | null) {
  if (!options.refreshProviders) return { data: existing, failure: undefined as string | undefined, billedCallsThisRun: 0, actualCostUsdThisRun: 0 };
  try {
    if (options.dryRun) throw new Error("Full DataForSEO collection is not available in --dry-run mode.");
    const login = process.env.TNM_VISIBILITY_DATAFORSEO_LOGIN; const password = process.env.TNM_VISIBILITY_DATAFORSEO_PASSWORD;
    if (!login || !password) throw new Error("DataForSEO credentials are not configured.");
    const seeds = await readJson<{ intentGroups?: Array<{ id?: string; queries?: string[] }> }>(path.resolve("../research/visibility/seed-queries.json"));
    const queryEntries = (seeds?.intentGroups ?? []).flatMap((group) => (group.queries ?? []).map((keyword) => ({ groupId: safeSeedIntentGroup(group.id), keyword })));
    if (!queryEntries.length) throw new Error("Visibility seed query set is empty.");
    const authorization = `Basic ${Buffer.from(`${login}:${password}`).toString("base64")}`;
    const taskResults: unknown[] = Array.from({ length: queryEntries.length }, () => null);
    const failures: string[] = [];
    let actualCostUsd = 0;
    let completedNewTasks = 0;
    for (const [index, { keyword }] of queryEntries.entries()) {
      try {
        let completed: { payload: DataForSeoApiResponse; cost: number } | null = null;
        let lastFailure: unknown;
        for (let attempt = 0; attempt < 2; attempt += 1) {
          try {
            const response = await fetch("https://api.dataforseo.com/v3/serp/google/organic/live/advanced", { method: "POST", headers: { authorization, "content-type": "application/json" }, body: JSON.stringify([{ keyword, location_name: "Canada", language_name: "English", depth: 10, load_async_ai_overview: true }]), signal: AbortSignal.timeout(slowProviderTimeoutMs) });
            if (!response.ok) throw new Error(`DataForSEO read failed: ${response.status}`);
            const payload = await response.json() as DataForSeoApiResponse;
            completed = { payload, cost: validateDataForSeoResponse(payload, keyword) };
            break;
          } catch (error) {
            lastFailure = error;
            const message = error instanceof Error ? error.message : "DataForSEO request failed.";
            if (attempt === 1 || !transientProviderFailure.test(message)) throw error;
            await retryPause(attempt);
          }
        }
        if (!completed) throw lastFailure ?? new Error("DataForSEO request failed.");
        const { payload, cost } = completed;
        actualCostUsd += cost;
        taskResults[index] = payload; completedNewTasks += 1;
        // Persist every successful task before proceeding: a later transient failure cannot discard billed evidence.
        const checkpointSummary = summarizeDataForSeo(queryEntries, taskResults);
        const checkpoint: DataForSeoRunData = { collectedAt: new Date().toISOString(), backlinks: [], requestedTasks: queryEntries.length, ...checkpointSummary, newTasks: completedNewTasks, actualCostUsd: Number(actualCostUsd.toFixed(6)) };
        await writeProviderArtifact(options.localDir, "dataforseo", checkpoint, { collectedAt: checkpoint.collectedAt, requestedTasks: queryEntries.length, newTasks: completedNewTasks, actualCostUsd: checkpoint.actualCostUsd, taskResults }, false);
      } catch (error) {
        failures.push(error instanceof Error ? error.message : `DataForSEO seed ${index + 1} failed.`);
        const checkpoint: DataForSeoRunData = { collectedAt: new Date().toISOString(), backlinks: [], requestedTasks: queryEntries.length, ...summarizeDataForSeo(queryEntries, taskResults), newTasks: completedNewTasks, actualCostUsd: Number(actualCostUsd.toFixed(6)) };
        await writeProviderArtifact(options.localDir, "dataforseo", checkpoint, { collectedAt: checkpoint.collectedAt, requestedTasks: queryEntries.length, newTasks: completedNewTasks, actualCostUsd: checkpoint.actualCostUsd, failures, taskResults }, false);
      }
    }
    const normalized: DataForSeoRunData = { collectedAt: new Date().toISOString(), backlinks: [], requestedTasks: queryEntries.length, ...summarizeDataForSeo(queryEntries, taskResults), newTasks: completedNewTasks, actualCostUsd: Number(actualCostUsd.toFixed(6)) };
    await writeProviderArtifact(options.localDir, "dataforseo", normalized, { collectedAt: normalized.collectedAt, requestedTasks: queryEntries.length, newTasks: completedNewTasks, actualCostUsd: normalized.actualCostUsd, failures, taskResults }, false);
    return { data: normalized, failure: failures.length ? `${failures.length} of ${queryEntries.length} DataForSEO seed tasks failed.` : undefined, billedCallsThisRun: completedNewTasks, actualCostUsdThisRun: normalized.actualCostUsd };
  } catch (error) { return { data: existing, failure: error instanceof Error ? error.message : "DataForSEO refresh failed.", billedCallsThisRun: 0, actualCostUsdThisRun: 0 }; }
}

async function loadSnapshot(options: Options): Promise<VisibilitySnapshotV1> {
  const providerDir = path.join(options.localDir, "providers");
  const configured = fullRunProviderConfiguration();
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
    safeRefresh(bingExisting, options.refreshProviders, () => refreshBing(options.rangeDays, options.localDir, options.dryRun)),
    safeRefresh(bulkExisting, options.refreshProviders, () => refreshGscBulkExport(options.rangeDays, options.localDir, options.dryRun)),
    collectDataForSeo(options, dataForSeoExisting),
    collectTechnical(options.skipNetwork),
  ]);
  const [googleAi, bingAi, indexCoverage, earnedReferences] = await Promise.all([
    readJson<AiReport>(path.join(providerDir, "google-ai.json")), readJson<AiReport>(path.join(providerDir, "bing-ai.json")), readJson<VisibilityIntelligence["indexCoverage"]>(path.join(providerDir, "index-coverage.json")), readJson<VisibilityIntelligence["earnedReferences"]>(path.join(providerDir, "gsc-links.json")),
  ]);
  const aiReports = [googleAi, bingAi].filter((r): r is AiReport => validAiReport(r));
  const intelligence: VisibilityIntelligence = {
    schemaVersion: "tnm_visibility_intelligence_v1", aiReports, searchCohorts: bulkExport.data?.searchCohorts ?? [], ga4: ga4.data?.intelligence ?? null,
    answerSources: dataforseo.data?.answerSources ?? [], bingHealth: bing.data?.bingHealth ?? [], indexCoverage, earnedReferences,
    annotations: [{ date: "2026-08-03", kind: "collection_gap", note: "GA4 collection interruption begins; zero observations in this interval do not establish zero activity." }, { date: "2026-09-04", kind: "release", note: "GA4 collection repair, consent-safe page views and MDA metadata repair deployed." }],
  };
  if (!validIntelligence(intelligence)) throw new Error("Visibility intelligence failed its privacy and data contract.");
  const backlinks = [bing.data, ahrefs, dataforseo.data].flatMap((value) => value?.backlinks ?? []).filter((link) => link.targetUrl === undefined || isPublicTnmUrl(link.targetUrl, siteUrl));
  return {
    schemaVersion: visibilitySnapshotVersion, intelligence, collectedAt: new Date().toISOString(), siteUrl, rangeDays: options.rangeDays,
    providerStatus: {
      googleAi: provider("Google AI report", googleAi, options.rangeDays, undefined, { configured: Boolean(googleAi), kind: "import" }),
      bingAi: provider("Bing AI report", bingAi, options.rangeDays, undefined, { configured: Boolean(bingAi), kind: "import" }),
      searchConsole: provider("Google Search Console", gsc.data, options.rangeDays, gsc.failure, { configured: configured.searchConsole, kind: "live" }),
      ga4: provider("GA4", ga4.data, options.rangeDays, ga4.failure, { configured: configured.ga4, kind: "live" }),
      bing: provider("Bing Webmaster API/import", bing.data, options.rangeDays, bing.failure, { configured: configured.bing, kind: "live" }),
      ahrefs: provider("Ahrefs import", ahrefs, options.rangeDays, undefined, { configured: Boolean(ahrefs), kind: "import" }),
      dataforseo: provider("DataForSEO", dataforseo.data, options.rangeDays, dataforseo.failure, { configured: configured.dataforseo, kind: "live" }),
      pageSpeed: provider("PageSpeed Insights", pageSpeed.data, options.rangeDays, pageSpeed.failure, { configured: configured.pageSpeed, kind: "live" }),
      cruxHistory: provider("CrUX History API", crux.data, options.rangeDays, crux.failure, { configured: configured.cruxHistory, kind: "live" }),
      gscBulkExport: provider("Search Console BigQuery export", bulkExport.data, options.rangeDays, bulkExport.failure, { configured: configured.gscBulkExport, kind: "live" }),
      trends: provider("Google Trends import", trends, options.rangeDays, undefined, { configured: Boolean(trends), kind: "import" }),
    },
    searchConsole: { queries: gsc.data?.queries ?? [], queryRows: gsc.data?.queryRows ?? [], queryAttributed: gsc.data?.queryAttributed, pages: gsc.data?.pages ?? [], totals: gsc.data?.totals, period: gsc.data?.period, generativeAiAvailable: Boolean(googleAi || generativeAi?.generativeAi || gsc.data?.generativeAiAvailable), daily: gsc.data?.daily ?? [], devices: gsc.data?.devices ?? [], countries: gsc.data?.countries ?? [], searchAppearances: gsc.data?.searchAppearances ?? [], generativeAi: googleAi ? { impressions: googleAi.total, clicks: null, pages: googleAi.rows.length, collectedAt: googleAi.collectedAt } : generativeAi?.generativeAi ?? gsc.data?.generativeAi, bulkExport: bulkExport.data?.bulkExport ?? bulkExisting?.bulkExport },
    ga4: { organicLandingPages: ga4.data?.organicLandingPages ?? [], aiReferrals: ga4.data?.aiReferrals ?? [], acquisitionChannels: ga4.data?.acquisitionChannels ?? [], referralCategories: ga4.data?.referralCategories ?? [], clickEvents: ga4.data?.clickEvents ?? [], aiReferralDaily: ga4.data?.aiReferralDaily ?? [] },
    bing: { searchRows: bing.data?.searchRows ?? [], crawlStats: bing.data?.crawlStats ?? [], backlinkCount: bing.data?.backlinkCount ?? 0 },
    ahrefs: { organicKeywords: ahrefs?.organicKeywords ?? 0, siteAuditIssues: ahrefs?.siteAuditIssues ?? 0, internalLinkSuggestions: ahrefs?.internalLinkSuggestions ?? 0 },
    keywordResearch: { trendSignals: trends?.trendSignals ?? 0, serpTasks: dataforseo.data?.requestedTasks ?? 0, trackedTopTen: dataforseo.data?.trackedTopTen ?? 0, dataForSeoNewTasks: dataforseo.billedCallsThisRun, dataForSeoActualCostUsd: dataforseo.actualCostUsdThisRun, intentGroups: dataforseo.data?.intentGroups ?? [], features: dataforseo.data?.features },
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
  const totals = snapshotTotals(snapshot);
  const clicks = totals.clicks;
  const impressions = totals.impressions;
  const queryClicks = snapshot.searchConsole.queryAttributed?.clicks ?? snapshot.searchConsole.queries.reduce((total, item) => total + item.clicks, 0);
  const queryImpressions = snapshot.searchConsole.queryAttributed?.impressions ?? snapshot.searchConsole.queries.reduce((total, item) => total + item.impressions, 0);
  const queryImpressionShare = snapshot.searchConsole.queryAttributed && impressions ? queryImpressions / impressions : null;
  const comparison = prior ? compareSnapshots(snapshot, prior) : null;
  const comparableChanges = comparison?.comparable ? {
    clicks: comparison.clicksDelta ?? 0,
    impressions: comparison.impressionsDelta ?? 0,
    sessions: comparison.sessionsDelta ?? 0,
    technicalIssues: comparison.technicalIssuesDelta,
    averagePosition: comparison.averagePositionDelta,
  } : null;
  const dataQuality = Object.entries(snapshot.providerStatus).map(([name, value]) => `- ${name}: **${value.status}**${value.collectedAt ? ` — collected ${value.collectedAt}` : ""}${value.note ? ` — ${value.note}` : ""}`).join("\n");
  const performance = snapshot.technical.pageSpeed;
  const features = snapshot.keywordResearch?.features;
  const bulk = snapshot.searchConsole.bulkExport;
  const boundedTechnicalPages = snapshot.technical.pages.filter((page) => DEFAULT_LAUNCH_PATHS.includes(new URL(page.url).pathname as typeof DEFAULT_LAUNCH_PATHS[number]));
  const attemptedTechnicalPages = boundedTechnicalPages.filter((page) => page.inspectionAttempted !== false);
  return [
    "# True North Map Visibility Report",
    `\nSchema: ${visibilityReportVersion}\nMode: ${command}\nCollected: ${snapshot.collectedAt}\nRange: ${snapshot.rangeDays} days\nScope: ${siteUrl} public routes only; ${snapshot.technical.sitemapCount} sitemap URLs inventoried and ${attemptedTechnicalPages.length}/${DEFAULT_LAUNCH_PATHS.length} bounded core routes inspected. Full-site audit not run; that remains explicit-only through tnm-site-assurance.`,
    `\n## Data quality\n${dataQuality}\n\nUnavailable means unknown, never zero. Raw provider evidence remains local-only.`,
    `\n## Search visibility\n- Total impressions: ${impressions}\n- Total clicks: ${clicks}\n- CTR: ${impressions ? (clicks / impressions * 100).toFixed(2) : "unavailable"}%\n- Impression-weighted average position: ${formatNumber(totals.position, 1)}\n- Query-attributed detail: ${queryClicks} clicks and ${queryImpressions} impressions${queryImpressionShare === null ? " (legacy query-plus-page basis; share unavailable)" : ` (${(queryImpressionShare * 100).toFixed(1)}% of total impressions)`}; withheld query detail is unknown, not zero\n- Page-only opportunity coverage: ${pages.length} public pages\n- Search Console bulk export: ${bulk ? `${bulk.rows} rows across ${bulk.exportedDays ?? 0} successful export days, ${bulk.impressions ?? 0} impressions, ${bulk.clicks ?? 0} clicks` : "unavailable"}\n- DataForSEO Canada panel: ${snapshot.keywordResearch?.serpTasks ?? 0} tasks requested, ${snapshot.keywordResearch?.trackedTopTen ?? 0} TNM top-ten results, ${snapshot.keywordResearch?.dataForSeoNewTasks ?? 0} tasks completed during this run, $${(snapshot.keywordResearch?.dataForSeoActualCostUsd ?? 0).toFixed(3)} provider-reported cost during this run\n\n### Public pages\n${pages.length ? pages.map((page) => `- ${page.path}: ${page.impressions} impressions, ${page.clicks} clicks, ${(page.ctr * 100).toFixed(1)}% CTR, position ${page.position ?? "unknown"}`).join("\n") : "No current page-level Search Console evidence."}`,
    `\n## Technical health\n- Sitemap public URLs: ${snapshot.technical.sitemapCount}; bounded core routes inspected: ${attemptedTechnicalPages.length}/${DEFAULT_LAUNCH_PATHS.length}\n- Manifest: ${technicalManifestReady(snapshot.technical) ? "verified" : `incomplete${snapshot.technical.manifestIssue ? ` — ${snapshot.technical.manifestIssue}` : ""}`}\n- Technical sample: collected ${snapshot.technical.collectedAt ?? snapshot.collectedAt}; full-site audit not run${snapshot.technical.circuitOpen ? "; pressure circuit opened" : ""}\n- Inspected pages with issues: ${attemptedTechnicalPages.filter((page) => page.issues.length).length}/${attemptedTechnicalPages.length}\n- PageSpeed mobile score: ${formatNumber(performance?.performanceScore ?? null)}\n- LCP: ${formatNumber(performance?.lcpMs ?? null)} ms\n- INP: ${formatNumber(performance?.inpMs ?? null)} ms\n- CLS: ${formatNumber(performance?.cls ?? null, 3)}`,
    `\n## AEO and GEO\n- Dedicated Google Generative AI Performance report: ${snapshot.searchConsole.generativeAiAvailable ? "available" : "unavailable or not imported; unknown, not zero"}\n- Corrected aggregate referrals from known AI-assistant hosts: ${snapshot.ga4.aiReferrals.reduce((total, item) => total + item.sessions, 0)} sessions\n- DataForSEO AI Overview triggers: ${features?.aiOverviewTasks ?? 0}/${snapshot.keywordResearch?.serpTasks ?? 0}; retrievable overview detail: ${features?.aiOverviewResolvedTasks ?? 0}; TNM citation presence: ${features?.tnmInAiOverviewTasks === null || features?.tnmInAiOverviewTasks === undefined ? "unknown" : `${features.tnmInAiOverviewTasks} tasks`}\n- Other seed-panel features: ${features?.peopleAlsoAskTasks ?? 0} People Also Ask, ${features?.featuredSnippetTasks ?? 0} featured snippets, ${features?.videoTasks ?? 0} video, ${features?.relatedSearchesTasks ?? 0} related-search panels\n- These are separate directional signals, not an answer-engine rank. Improve answer clarity, provenance, entity consistency, visible dates, accurate schema, and useful internal links.`,
    `\n## Content and links\n${opportunities.length ? opportunities.map((item, index) => `${index + 1}. **${item.priority} / ${item.confidence} — ${item.type}**: ${item.target}\n   ${item.rationale}`).join("\n") : "No evidence-backed opportunity is available from the current inputs."}\n\nImported high-relevance earned-link signals: ${snapshot.backlinks.filter((link) => link.relevance === "high").length}. Human review is required before any outreach.`,
    `\n## Priority actions\n${createDashboardSummary(snapshot, prior).actions.map((action, index) => `${index + 1}. **${action.priority} impact / ${action.confidence} — ${action.title}**\n   Owner: ${action.ownerType}; effort: ${action.effort}; target: ${action.targetPath ?? "monitoring"}\n   Why: ${action.rationale}\n   Verify: ${action.verification}`).join("\n") || "Monitor until stronger evidence is available."}`,
    comparableChanges ? `\n## Change from prior snapshot\n- Clicks: ${comparableChanges.clicks >= 0 ? "+" : ""}${comparableChanges.clicks}\n- Impressions: ${comparableChanges.impressions >= 0 ? "+" : ""}${comparableChanges.impressions}\n- Organic sessions: ${comparableChanges.sessions >= 0 ? "+" : ""}${comparableChanges.sessions}\n- Technical issues: ${comparableChanges.technicalIssues === null ? "not comparable (inspection scopes differ)" : `${comparableChanges.technicalIssues >= 0 ? "+" : ""}${comparableChanges.technicalIssues}`}\n- Average position: ${comparableChanges.averagePosition === null ? "not comparable" : `${comparableChanges.averagePosition > 0 ? "+" : ""}${comparableChanges.averagePosition}`}\n- Provider-status changes: ${comparison?.providerChanges.join(", ") || "none"}` : `\n## Change from prior snapshot\n${comparison?.note ?? "No comparable prior private snapshot is available."}`,
    "\n## Guardrails\nPrivate SEO/GEO/AEO intelligence only. No Supabase interaction, provider writes, indexing submission, content publication, automated outreach, paid links, or changes to public records.",
  ].join("\n");
}

async function writeArtifacts(options: Options, snapshot: VisibilitySnapshotV1, report: string) {
  if (options.dryRun) return;
  const date = snapshot.collectedAt.replace(/[:.]/g, "-");
  const writes: Promise<unknown>[] = [
    (async () => { const file = path.join(options.localDir, "reports", `${date}-${options.command}.md`); await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, `${report}\n`, { mode: 0o600 }); })(),
  ];
  // Reporting lenses are pure readers of the most recent collected snapshot.
  // Only the refresh command creates a new snapshot/provider checkpoint.
  if (options.refreshProviders) writes.push(writeJsonAtomic(path.join(options.localDir, "snapshots", `${date}.json`), snapshot));
  await Promise.all(writes);
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
      if (!summary || summary.schemaVersion !== visibilityDashboardSummaryVersion) throw new Error(`Dashboard outbox contains an unrecognized item: ${file}`);
      await postDashboard(summary);
      await unlink(path.join(directory, file));
    }
  } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
}

async function dashboardOutboxItems(localDir: string) {
  try { return (await readdir(path.join(localDir, "dashboard", "outbox"))).filter((file) => file.endsWith(".json")); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; }
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
  const dashboardConfigured = Boolean(process.env.TNM_VISIBILITY_DASHBOARD_INGEST_URL && process.env.TNM_VISIBILITY_DASHBOARD_INGEST_TOKEN && process.env.TNM_VISIBILITY_DASHBOARD_SITES_BYPASS_TOKEN);
  let dashboardReady = false;
  if (dashboardConfigured) try {
    const response = await fetch(process.env.TNM_VISIBILITY_DASHBOARD_INGEST_URL!, { headers: { authorization: `Bearer ${process.env.TNM_VISIBILITY_DASHBOARD_INGEST_TOKEN}`, "OAI-Sites-Authorization": `Bearer ${process.env.TNM_VISIBILITY_DASHBOARD_SITES_BYPASS_TOKEN}` }, signal: AbortSignal.timeout(15000) });
    const readback = await response.json() as { ok?: boolean; intelligence?: string };
    dashboardReady = response.ok && readback.ok === true && readback.intelligence === "tnm_visibility_intelligence_v1";
  } catch { /* A missing or inaccessible consumer is not a connected dashboard. */ }
  const googleReady = google === "service-account-ready" || google === "short-lived-token-ready";
  const configuredGoogleProvider = fullRunProviderConfig.searchConsole || fullRunProviderConfig.ga4 || fullRunProviderConfig.gscBulkExport;
  const requiredProvidersConfigured = fullRunProviders.filter((name) => requiredProductionProviders.has(name)).every((name) => fullRunProviderConfig[name]);
  const fullRunReady = requiredProvidersConfigured && (!configuredGoogleProvider || googleReady) && dashboardReady;
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
    requiredProvidersConfigured,
    configuredProviders: fullRunProviders.filter((name) => fullRunProviderConfig[name]),
    optionalUnconfiguredProviders: fullRunProviders.filter((name) => !fullRunProviderConfig[name]),
    strictPolicy: "configured live providers must succeed; unconfigured optional APIs remain unavailable/unknown and do not fail refreshes",
    dashboard: dashboardReady,
    dashboardConfigured,
    providerAccess: "Every configured provider must return current evidence during the subsequent strict refresh; configuration is not collection proof.",
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
  const history = await latestSnapshots(options.localDir, 64);
  if (options.command === "dashboard-sync") {
    if (!history[0]) throw new Error("Dashboard sync requires an existing private visibility snapshot.");
    const prior = selectPriorSnapshot(history[0], history.slice(1));
    const dashboard = await syncDashboard(options, history[0], prior);
    if (!dashboard) throw new Error("Dashboard sync is not configured in the ignored local environment.");
    console.log(`Dashboard sync verified: ${dashboard.schemaVersion} at ${dashboard.collectedAt}.`);
    return;
  }
  const snapshot = options.refreshProviders
    ? await loadSnapshot(options)
    : history[0] ?? (() => { throw new Error(`${options.command} requires an existing private visibility snapshot. Run refresh first.`); })();
  const prior = selectPriorSnapshot(snapshot, options.refreshProviders ? history : history.slice(1));
  const report = renderReport(options.command, snapshot, prior);
  await writeArtifacts(options, snapshot, report);
  const dashboard = options.refreshProviders ? await syncDashboard(options, snapshot, prior) : null;
  console.log(report);
  if (dashboard) console.log(options.dryRun ? `\nDashboard projection validated locally: ${dashboard.schemaVersion}.` : `\nDashboard sync verified: ${dashboard.schemaVersion} at ${dashboard.collectedAt}.`);
  if (options.strict) {
    const configured = fullRunProviderConfiguration();
    const missingFullRun: string[] = fullRunProviders.filter((name) => providerBlocksStrictRun(name, snapshot.providerStatus[name], configured));
    const auditedPaths = snapshot.technical.pages.map((page) => new URL(page.url).pathname);
    const boundedSampleComplete = snapshot.technical.inspectionScope === "bounded_core_v1"
      && auditedPaths.length === DEFAULT_LAUNCH_PATHS.length
      && DEFAULT_LAUNCH_PATHS.every((pathname) => auditedPaths.includes(pathname));
    if (!technicalManifestReady(snapshot.technical)) missingFullRun.push("verified robots and sitemap manifest");
    if (!boundedSampleComplete) missingFullRun.push("complete bounded core-route inspection");
    if (snapshot.technical.circuitOpen) missingFullRun.push("technical pressure circuit opened");
    const failedRoutes = snapshot.technical.pages.filter((page) => !technicalPageSuccessful(page));
    if (failedRoutes.length) missingFullRun.push(`${failedRoutes.length} public-route responses`);
    const pendingDashboardItems = await dashboardOutboxItems(options.localDir);
    if (pendingDashboardItems.length) missingFullRun.push(`${pendingDashboardItems.length} dashboard-outbox items`);
    if (missingFullRun.length) throw new Error(`Strict visibility run is incomplete: ${missingFullRun.join(", ")}. A partial snapshot was retained and, when configured, synchronized for monitoring.`);
    if (!dashboard) throw new Error("Strict visibility run did not verify the owner dashboard.");
  }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
