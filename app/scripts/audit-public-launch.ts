import { lookup } from "node:dns/promises";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  assessAtlasOperationalPayloads,
  fetchLaunchResource,
  type LaunchFinding
} from "../src/lib/launch/operational-checks";
import {
  buildInternalLinkInventory,
  classifyDurableSourceProbes,
  extractMarkedDurableSourceLinks,
  extractNormalizedSameOriginLinks,
  isLaunchOperationalFinding,
  inspectNextStreamState,
  launchAuditLockCanBeReplaced,
  launchAuditPressureExceeded,
  MAX_INTERNAL_LINK_TARGETS,
  MAX_OUTBOUND_DURABLE_SOURCE_TARGETS,
  MAX_SUPPORTING_AUDIT_PAGES,
  parseCanonicalSitemapPaths,
  publicOutboundUrlIssue,
  supportingAuditHealthProbeDue,
  supportingAuditStopReason,
  type DurableSourceClassification,
  type DurableSourceProbe,
  type LaunchAuditLockState
} from "../src/lib/launch/release-gate";

const baseUrl = (process.env.PUBLIC_LAUNCH_BASE_URL ?? "https://truenorthmap.ca").replace(/\/$/, "");
const runId = `audit-${new Date().toISOString().replaceAll(/[:.]/g, "-")}-${Math.random().toString(36).slice(2, 8)}`;
const reportPath = process.env.PUBLIC_LAUNCH_REPORT ?? join(tmpdir(), "tnm-public-launch-audit.json");
const lockPath = process.env.PUBLIC_LAUNCH_AUDIT_LOCK
  ?? join(tmpdir(), `tnm-public-launch-audit-${new URL(baseUrl).hostname}.lock`);
const lockTtlMs = boundedInteger(process.env.PUBLIC_LAUNCH_AUDIT_LOCK_TTL_MS, 7_200_000, 60_000);
const requestSpacingMs = Math.max(750, boundedInteger(process.env.PUBLIC_LAUNCH_REQUEST_SPACING_MS, 1_000, 750));
const requestJitterMs = boundedInteger(process.env.PUBLIC_LAUNCH_REQUEST_JITTER_MS, 250, 0, 1_000);
const maxResponseMs = boundedInteger(process.env.PUBLIC_LAUNCH_MAX_RESPONSE_MS, 10_000, 1_000);
const maxHtmlBytes = boundedInteger(process.env.PUBLIC_LAUNCH_MAX_HTML_BYTES, 2_000_000, 100_000);
const maxInternalLinkTargets = positiveInteger(
  process.env.PUBLIC_LAUNCH_MAX_INTERNAL_LINK_TARGETS,
  MAX_INTERNAL_LINK_TARGETS
);
const maxOutboundDurableSourceTargets = positiveInteger(
  process.env.PUBLIC_LAUNCH_MAX_OUTBOUND_SOURCE_TARGETS,
  MAX_OUTBOUND_DURABLE_SOURCE_TARGETS
);
const requestHeaders = {
  "User-Agent": `TrueNorthMap-Launch-Audit/1.0 (${runId})`
};
const operationalUrls = {
  health: `${baseUrl}/api/health`,
  summary: `${baseUrl}/api/atlas/summary`,
  atlas: `${baseUrl}/api/atlas?page=1&pageSize=18`
};

type Finding = LaunchFinding;
type AuditLockRecord = LaunchAuditLockState & {
  runId: string;
  baseUrl: string;
  pid: number;
  startedAt: string;
  heartbeatAt: string;
};
type PageResult = {
  url: string;
  finalUrl: string;
  status: number;
  title?: string;
  canonical?: string;
  findings: Finding[];
  warnings: Finding[];
  durationMs: number;
  responseBytes: number;
  internalLinks: string[];
  durableSourceLinks: string[];
};
type SupportingPageResult = Pick<
  PageResult,
  "url" | "finalUrl" | "status" | "findings" | "warnings" | "durationMs" | "responseBytes" | "internalLinks" | "durableSourceLinks"
>;
type InternalLinkCheck = SupportingPageResult & {
  referrers: string[];
  source: "sitemap" | "supporting-pagination" | "linked-target";
  redirectedTo?: string;
};
type OutboundDurableSourceCheck = {
  url: string;
  referrers: string[];
  classification: DurableSourceClassification;
  probes: DurableSourceProbe[];
};

function boundedInteger(value: string | undefined, fallback: number, minimum = 1, maximum = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed)
    ? Math.min(maximum, Math.max(minimum, Math.floor(parsed)))
    : fallback;
}

function positiveInteger(value: string | undefined, fallback: number) {
  return boundedInteger(value, fallback);
}

function auditLockRecord(startedAt = new Date().toISOString()): AuditLockRecord {
  return {
    runId,
    baseUrl,
    pid: process.pid,
    startedAt,
    heartbeatAt: new Date().toISOString()
  };
}

async function readAuditLock() {
  try {
    const raw = await readFile(lockPath, "utf8");
    const value = JSON.parse(raw) as unknown;
    return value !== null && typeof value === "object" && !Array.isArray(value)
      ? value as Partial<AuditLockRecord>
      : null;
  } catch {
    return null;
  }
}

function auditLockPidIsAlive(pid: unknown): boolean | null {
  if (typeof pid !== "number" || !Number.isInteger(pid) || pid <= 0) return null;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "ESRCH" ? false : true;
  }
}

async function acquireAuditLock() {
  const startedAt = new Date().toISOString();
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await writeFile(lockPath, `${JSON.stringify(auditLockRecord(startedAt))}\n`, { flag: "wx" });
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "EEXIST") throw error;
      const existing = await stat(lockPath);
      const owner = await readAuditLock();
      const replaceable = launchAuditLockCanBeReplaced(
        owner ?? {},
        Date.now(),
        existing.mtimeMs,
        auditLockPidIsAlive(owner?.pid),
        lockTtlMs
      );
      if (!replaceable) {
        throw new Error(`Full launch audit already running (${owner ? JSON.stringify(owner) : "unknown owner"})`);
      }
      await unlink(lockPath).catch(() => undefined);
    }
  }
  throw new Error("Could not acquire the full launch-audit lock");
}

async function heartbeatAuditLock() {
  const owner = await readAuditLock();
  if (owner?.runId !== runId) throw new Error("Full launch audit lost ownership of its lock");
  await writeFile(lockPath, `${JSON.stringify({ ...owner, heartbeatAt: new Date().toISOString() })}\n`);
}

async function releaseAuditLock() {
  const owner = await readAuditLock();
  if (owner?.runId === runId) await unlink(lockPath).catch(() => undefined);
}

function fetchAuditResource(url: string) {
  return fetchLaunchResource(url, {
    timeoutMs: maxResponseMs,
    headers: requestHeaders,
    expectedOrigin: new URL(baseUrl).origin
  });
}

async function pauseAudit() {
  const jitter = requestJitterMs > 0 ? Math.floor(Math.random() * (requestJitterMs + 1)) : 0;
  await new Promise((resolve) => setTimeout(resolve, requestSpacingMs + jitter));
}

async function writeAuditReport(value: unknown) {
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(value, null, 2)}\n`);
}

async function writeInconclusiveAuditReport(message: string) {
  let partial: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(await readFile(reportPath, "utf8")) as unknown;
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) partial = parsed as Record<string, unknown>;
  } catch {
    // The initial report may not have been created yet.
  }
  await writeAuditReport({
    ...partial,
    status: "inconclusive",
    runId,
    baseUrl,
    stoppedAt: new Date().toISOString(),
    error: message,
    reportPath
  });
}

async function assertStableAuditHealth(context: string) {
  const health = await fetchAuditResource(operationalUrls.health);
  if (health.warnings.length > 0) {
    throw new Error(`Full launch audit stopped because ${context} health required a retry`);
  }
  if (!health.response.ok) {
    throw new Error(`Full launch audit stopped because ${context} health returned ${health.response.status}`);
  }
  try {
    const payload = JSON.parse(health.body) as { status?: unknown; checks?: { catalogueConsistent?: unknown } };
    if (payload.status !== "ok" || payload.checks?.catalogueConsistent !== true) {
      throw new Error("health payload was not consistent");
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : "invalid JSON";
    throw new Error(`Full launch audit stopped because ${context} health was invalid: ${detail}`);
  }
}

function match(html: string, expression: RegExp) {
  return expression.exec(html)?.[1]?.trim();
}

function percentile(values: number[], quantile: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * quantile) - 1))];
}

async function inspectPage(url: string): Promise<PageResult> {
  let response: Response;
  let html: string;
  let warnings: Finding[];
  let durationMs: number;
  let responseBytes: number;
  try {
    const fetched = await fetchAuditResource(url);
    response = fetched.response;
    html = fetched.body;
    warnings = fetched.warnings;
    durationMs = fetched.durationMs;
    responseBytes = fetched.responseBytes;
  } catch (error) {
    return {
      url,
      finalUrl: url,
      status: 0,
      findings: [{ url, issue: error instanceof Error ? `Request failed: ${error.message}` : "Request failed" }],
      warnings: [],
      durationMs: 0,
      responseBytes: 0,
      internalLinks: [],
      durableSourceLinks: []
    };
  }
  const findings: Finding[] = [];
  if (!response.ok) findings.push({ url, issue: `HTTP ${response.status}` });
  if (durationMs > maxResponseMs) findings.push({ url, issue: `HTML response exceeded ${maxResponseMs} ms (${durationMs} ms)` });
  if (responseBytes > maxHtmlBytes) findings.push({ url, issue: `HTML response exceeded ${maxHtmlBytes} bytes (${responseBytes} bytes)` });
  const contentType = response.headers.get("content-type") ?? "";
  const renderedApplicationError = html.includes("id=\"__next_error__\"")
    || html.includes("Application error: a server-side exception");
  if (!response.ok || !contentType.includes("text/html") || renderedApplicationError) {
    if (response.ok && !contentType.includes("text/html")) {
      findings.push({ url, issue: `Expected HTML but received ${contentType || "an unknown content type"}` });
    }
    if (renderedApplicationError) findings.push({ url, issue: "Rendered application error document" });
    return {
      url,
      finalUrl: response.url || url,
      status: response.status,
      findings,
      warnings,
      durationMs,
      responseBytes,
      internalLinks: [],
      durableSourceLinks: []
    };
  }
  findings.push(...inspectNextStreamState(html, url));
  const title = match(html, /<title[^>]*>([^<]+)<\/title>/i);
  const description = match(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    ?? match(html, /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  const canonical = match(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
    ?? match(html, /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  const ogTitle = match(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  const ogImage = match(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  const twitterCard = match(html, /<meta[^>]+name=["']twitter:card["'][^>]+content=["']([^"']+)["']/i);
  if (!title) findings.push({ url, issue: "Missing title" });
  if (!description) findings.push({ url, issue: "Missing meta description" });
  if (!canonical) findings.push({ url, issue: "Missing canonical URL" });
  if (canonical && new URL(canonical, baseUrl).toString() !== url) findings.push({ url, issue: `Canonical mismatch: ${canonical}` });
  if (!ogTitle || !ogImage) findings.push({ url, issue: "Incomplete Open Graph metadata" });
  if (!twitterCard) findings.push({ url, issue: "Missing Twitter card metadata" });

  const jsonLdBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (jsonLdBlocks.length === 0) findings.push({ url, issue: "Missing JSON-LD" });
  for (const block of jsonLdBlocks) {
    try { JSON.parse(block[1]); } catch { findings.push({ url, issue: "Invalid JSON-LD" }); }
  }

  const images = [...html.matchAll(/<img\b([^>]*)>/gi)];
  for (const image of images) {
    const attributes = image[1];
    if (!/\balt=["'][^"']*["']/i.test(attributes)) findings.push({ url, issue: "Image without alt attribute" });
    const layoutReservedByFill = /\bdata-nimg=["']fill["']/i.test(attributes)
      || (/position:\s*absolute/i.test(attributes) && /height:\s*100%/i.test(attributes) && /width:\s*100%/i.test(attributes));
    if (!layoutReservedByFill && (!/\bwidth=["']?\d+/i.test(attributes) || !/\bheight=["']?\d+/i.test(attributes))) {
      findings.push({ url, issue: "Image without explicit dimensions" });
    }
  }

  const internalLinks = extractNormalizedSameOriginLinks(html, response.url || url, baseUrl);
  const durableSourceLinks = extractMarkedDurableSourceLinks(html, baseUrl);
  return {
    url,
    finalUrl: response.url || url,
    status: response.status,
    title,
    canonical,
    findings,
    warnings,
    durationMs,
    responseBytes,
    internalLinks,
    durableSourceLinks
  };
}

async function inspectSupportingListPage(url: string): Promise<SupportingPageResult> {
  try {
    const { response, body, warnings, durationMs, responseBytes } = await fetchAuditResource(url);
    const findings: Finding[] = [];
    if (!response.ok) findings.push({ url, issue: `Supporting list page returned HTTP ${response.status}` });
    if (durationMs > maxResponseMs) findings.push({ url, issue: `Supporting list response exceeded ${maxResponseMs} ms (${durationMs} ms)` });
    if (responseBytes > maxHtmlBytes) findings.push({ url, issue: `Supporting list response exceeded ${maxHtmlBytes} bytes (${responseBytes} bytes)` });
    if (!response.ok || !(response.headers.get("content-type") ?? "").includes("text/html")) {
      if (response.ok) findings.push({ url, issue: "Supporting list page did not return HTML" });
      return {
        url,
        finalUrl: response.url || url,
        status: response.status,
        findings,
        warnings,
        durationMs,
        responseBytes,
        internalLinks: [],
        durableSourceLinks: []
      };
    }
    if (body.includes("id=\"__next_error__\"") || body.includes("Application error: a server-side exception")) {
      findings.push({ url, issue: "Supporting list page rendered an application error document" });
      return {
        url,
        finalUrl: response.url || url,
        status: response.status,
        findings,
        warnings,
        durationMs,
        responseBytes,
        internalLinks: [],
        durableSourceLinks: []
      };
    }
    findings.push(...inspectNextStreamState(body, url));
    const internalLinks = extractNormalizedSameOriginLinks(body, response.url || url, baseUrl);
    const durableSourceLinks = extractMarkedDurableSourceLinks(body, baseUrl);
    return {
      url,
      finalUrl: response.url || url,
      status: response.status,
      findings,
      warnings,
      durationMs,
      responseBytes,
      internalLinks,
      durableSourceLinks
    };
  } catch (error) {
    return {
      url,
      finalUrl: url,
      status: 0,
      findings: [{ url, issue: error instanceof Error ? `Supporting list request failed: ${error.message}` : "Supporting list request failed" }],
      warnings: [],
      durationMs: 0,
      responseBytes: 0,
      internalLinks: [],
      durableSourceLinks: []
    };
  }
}

async function inspectInternalLinkTarget(url: string): Promise<SupportingPageResult> {
  try {
    const { response, body, warnings, durationMs, responseBytes } = await fetchAuditResource(url);
    const findings: Finding[] = [];
    if (!response.ok) findings.push({ url, issue: `HTTP ${response.status} from internal link target` });
    if (durationMs > maxResponseMs) findings.push({ url, issue: `Internal link response exceeded ${maxResponseMs} ms (${durationMs} ms)` });
    if (responseBytes > maxHtmlBytes) findings.push({ url, issue: `Internal link response exceeded ${maxHtmlBytes} bytes (${responseBytes} bytes)` });
    const contentType = response.headers.get("content-type") ?? "";
    const renderedApplicationError = body.includes("id=\"__next_error__\"")
      || body.includes("Application error: a server-side exception");
    if (renderedApplicationError) findings.push({ url, issue: "Internal link target rendered an application error document" });
    const internalLinks = response.ok && contentType.includes("text/html") && !renderedApplicationError
      ? extractNormalizedSameOriginLinks(body, response.url || url, baseUrl)
      : [];
    const durableSourceLinks = response.ok && contentType.includes("text/html") && !renderedApplicationError
      ? extractMarkedDurableSourceLinks(body, baseUrl)
      : [];
    if (response.ok && contentType.includes("text/html") && !renderedApplicationError) {
      findings.push(...inspectNextStreamState(body, url));
    }
    return {
      url,
      finalUrl: response.url || url,
      status: response.status,
      findings,
      warnings,
      durationMs,
      responseBytes,
      internalLinks,
      durableSourceLinks
    };
  } catch (error) {
    return {
      url,
      finalUrl: url,
      status: 0,
      findings: [{
        url,
        issue: error instanceof Error ? `Request failed: ${error.message}` : "Request failed"
      }],
      warnings: [],
      durationMs: 0,
      responseBytes: 0,
      internalLinks: [],
      durableSourceLinks: []
    };
  }
}

const maxOutboundRedirectHops = 5;
const maxOutboundResponseBytes = 16_384;

async function withOutboundDeadline<T>(operation: Promise<T>, label: string) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(
          () => reject(new Error(`${label} exceeded ${maxResponseMs} ms`)),
          maxResponseMs
        );
      })
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function resolvePinnedPublicAddress(url: string) {
  const parsed = new URL(url);
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  const structuralIssue = publicOutboundUrlIssue(url);
  if (structuralIssue) throw new Error(`${structuralIssue}; target was not probed`);
  const addresses = await withOutboundDeadline(
    lookup(hostname, { all: true, verbatim: true }),
    "Outbound DNS resolution"
  );
  if (addresses.length === 0) throw new Error("DNS returned no addresses; target was not probed");
  const resolutionIssue = publicOutboundUrlIssue(url, addresses.map((entry) => entry.address));
  if (resolutionIssue) throw new Error(`${resolutionIssue}; target was not probed`);
  return [...addresses].sort((left, right) => left.family - right.family)[0];
}

async function requestPinnedOutboundHop(url: string) {
  const parsed = new URL(url);
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  const address = await resolvePinnedPublicAddress(url);
  return new Promise<{ status: number; location?: string }>((resolve, reject) => {
    let settled = false;
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      reject(error);
    };
    const transport = parsed.protocol === "https:" ? httpsRequest : httpRequest;
    const request = transport({
      protocol: parsed.protocol,
      hostname: address.address,
      port: parsed.port || undefined,
      path: `${parsed.pathname}${parsed.search}`,
      method: "GET",
      ...(parsed.protocol === "https:" ? { servername: hostname } : {}),
      headers: {
        ...requestHeaders,
        Host: parsed.host,
        Accept: "text/html,application/pdf;q=0.9,*/*;q=0.5",
        Range: "bytes=0-16383"
      }
    }, (response) => {
      const status = response.statusCode ?? 0;
      const location = response.headers.location;
      let bytesRead = 0;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(deadline);
        response.destroy();
        resolve({ status, ...(location ? { location } : {}) });
      };
      response.on("data", (chunk: Buffer | string) => {
        bytesRead += Buffer.byteLength(chunk);
        if (bytesRead >= maxOutboundResponseBytes) finish();
      });
      response.once("end", finish);
      response.once("error", (error) => {
        fail(error);
      });
    });
    const deadline = setTimeout(
      () => request.destroy(new Error(`Outbound request exceeded ${maxResponseMs} ms`)),
      maxResponseMs
    );
    request.once("error", fail);
    request.end();
  });
}

async function probeOutboundDurableSource(url: string): Promise<DurableSourceProbe> {
  let currentUrl = url;
  try {
    for (let hop = 0; hop <= maxOutboundRedirectHops; hop += 1) {
      const response = await requestPinnedOutboundHop(currentUrl);
      if (response.status >= 300 && response.status < 400 && response.location) {
        if (hop === maxOutboundRedirectHops) throw new Error(`Outbound redirect exceeded ${maxOutboundRedirectHops} hops`);
        const nextUrl = new URL(response.location, currentUrl).toString();
        const redirectIssue = publicOutboundUrlIssue(nextUrl);
        if (redirectIssue) throw new Error(`${redirectIssue} in redirect; destination was not probed`);
        currentUrl = nextUrl;
        continue;
      }
      return {
        status: response.status,
        finalUrl: currentUrl,
        redirected: currentUrl !== url
      };
    }
    throw new Error(`Outbound redirect exceeded ${maxOutboundRedirectHops} hops`);
  } catch (error) {
    return {
      status: 0,
      finalUrl: currentUrl,
      redirected: currentUrl !== url,
      transportError: error instanceof Error ? error.message : "Unknown transport failure"
    };
  }
}

async function inspectOutboundDurableSource(
  url: string,
  referrers: string[]
): Promise<OutboundDurableSourceCheck> {
  const probes = [await probeOutboundDurableSource(url)];
  if ([404, 410].includes(probes[0].status) || probes[0].status >= 500) {
    // A single terminal or upstream response is not enough to call a durable
    // source broken. Space one cautious verification before classifying it.
    await heartbeatAuditLock();
    await pauseAudit();
    probes.push(await probeOutboundDurableSource(url));
  }
  return {
    url,
    referrers,
    classification: classifyDurableSourceProbes(url, probes),
    probes
  };
}

async function collectSupportingListPages(
  seedUrls: string[],
  onPage: (pages: SupportingPageResult[]) => Promise<void>
) {
  const pending = [...new Set(seedUrls)];
  const seen = new Set<string>();
  const pages: SupportingPageResult[] = [];
  while (pending.length > 0 && seen.size < MAX_SUPPORTING_AUDIT_PAGES) {
    const url = pending.shift();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const result = await inspectSupportingListPage(url);
    pages.push(result);
    await onPage(pages);
    const stopReason = supportingAuditStopReason(result);
    if (stopReason) throw new Error(`Full launch audit stopped because ${stopReason}: ${url}`);
    if (supportingAuditHealthProbeDue(pages.length)) {
      await assertStableAuditHealth("supporting-pagination");
    }
    for (const link of result.internalLinks) {
      if (/\/(organizations|demand)\?[^#]*\bpage=\d+/.test(link) && !seen.has(link)) pending.push(link);
    }
    await pauseAudit();
  }
  if (pending.some((url) => !seen.has(url))) {
    throw new Error(
      `Full launch audit reached the ${MAX_SUPPORTING_AUDIT_PAGES}-page supporting-pagination safety ceiling before exhausting discovered pages`
    );
  }
  return pages;
}

async function main() {
  await writeAuditReport({
    status: "running",
    runId,
    baseUrl,
    startedAt: new Date().toISOString(),
    pagesChecked: 0,
    reportPath
  });
  await heartbeatAuditLock();
  await assertStableAuditHealth("preflight");
  // Warm the compact national projection before the canonical crawl. This
  // avoids turning a site audit into a cold-cache stampede against the
  // public database while still checking the operational endpoints again
  // after the complete crawl.
  const prewarm = await fetchAuditResource(operationalUrls.atlas);
  if (prewarm.warnings.length > 0) throw new Error("Atlas prewarm required a retry; full launch audit did not start");
  if (!prewarm.response.ok) throw new Error(`Atlas prewarm returned ${prewarm.response.status}`);

  const sitemap = await fetchAuditResource(`${baseUrl}/sitemap.xml`);
  if (sitemap.warnings.length > 0) throw new Error("Sitemap required a retry; full launch audit did not start");
  if (!sitemap.response.ok) throw new Error(`Sitemap returned ${sitemap.response.status}`);
  const sitemapPaths = parseCanonicalSitemapPaths(sitemap.body, baseUrl);
  const urls = sitemapPaths.map((path) => new URL(path, baseUrl).toString());

  const pages: PageResult[] = [];
  let consecutiveRouteFailures = 0;
  const recentPressureSignals: boolean[] = [];
  let lastProgressAt = Date.now();
  const persistProgress = async (force = false) => {
    if (!force && pages.length % 25 !== 0 && Date.now() - lastProgressAt < 30_000 && pages.length !== urls.length) return;
    await heartbeatAuditLock();
    lastProgressAt = Date.now();
    const progress = {
      status: "running",
      runId,
      baseUrl,
      pagesChecked: pages.length,
      pagesTotal: urls.length,
      findings: pages.flatMap((result) => result.findings),
      warnings: [...sitemap.warnings, ...pages.flatMap((result) => result.warnings)],
      reportPath
    };
    console.error(JSON.stringify({
      type: "launch-audit-progress",
      runId,
      pagesChecked: pages.length,
      pagesTotal: urls.length,
      findings: progress.findings.length,
      warnings: progress.warnings.length
    }));
    await writeAuditReport(progress);
  };
  for (const url of urls) {
    const page = await inspectPage(url);
    pages.push(page);
    const hardFailure = page.status === 0
      || page.status >= 500
      || page.findings.some(isLaunchOperationalFinding);
    consecutiveRouteFailures = hardFailure ? consecutiveRouteFailures + 1 : 0;
    recentPressureSignals.push(hardFailure || page.warnings.length > 0);
    if (recentPressureSignals.length > 10) recentPressureSignals.shift();
    await persistProgress();
    if (consecutiveRouteFailures >= 3) {
      await persistProgress(true);
      throw new Error("Full launch audit stopped after three consecutive route failures");
    }
    if (launchAuditPressureExceeded(recentPressureSignals)) {
      await persistProgress(true);
      throw new Error("Full launch audit stopped after repeated route pressure signals");
    }
    if (pages.length % 25 === 0) {
      await assertStableAuditHealth("in-run");
    }
    await pauseAudit();
  }
  await persistProgress(true);
  await heartbeatAuditLock();
  const supportingListUrls = [...new Set(pages
    .flatMap((page) => page.internalLinks)
    .filter((url) => /\/(organizations|demand)\?[^#]*\bpage=\d+/.test(url)))];
  const supportingPages = await collectSupportingListPages(supportingListUrls, async (checkedPages) => {
    await heartbeatAuditLock();
    await writeAuditReport({
      status: "running",
      runId,
      baseUrl,
      pagesChecked: pages.length,
      pagesTotal: urls.length,
      supportingListPagesChecked: checkedPages.length,
      findings: [
        ...pages.flatMap((result) => result.findings),
        ...checkedPages.flatMap((result) => result.findings)
      ],
      warnings: [
        ...sitemap.warnings,
        ...pages.flatMap((result) => result.warnings),
        ...checkedPages.flatMap((result) => result.warnings)
      ],
      reportPath
    });
    console.error(JSON.stringify({
      type: "launch-audit-supporting-progress",
      runId,
      pagesChecked: pages.length,
      supportingListPagesChecked: checkedPages.length
    }));
  });

  const inventory = new Map(
    buildInternalLinkInventory([...pages, ...supportingPages])
      .map((entry) => [entry.targetUrl, new Set(entry.referrers)] as const)
  );
  if (inventory.size > maxInternalLinkTargets) {
    await writeAuditReport({
      status: "running",
      runId,
      baseUrl,
      pagesChecked: pages.length,
      pagesTotal: urls.length,
      supportingListPagesChecked: supportingPages.length,
      internalLinkTargetsDiscovered: inventory.size,
      internalLinkTargetsChecked: 0,
      linkedTargetsFetched: 0,
      findings: [
        ...pages.flatMap((page) => page.findings),
        ...supportingPages.flatMap((page) => page.findings)
      ],
      warnings: [
        ...sitemap.warnings,
        ...pages.flatMap((page) => page.warnings),
        ...supportingPages.flatMap((page) => page.warnings)
      ],
      reportPath
    });
    throw new Error(
      `Full launch audit discovered ${inventory.size} normalized internal-link targets, exceeding the ${maxInternalLinkTargets}-target safety ceiling`
    );
  }
  const knownResults = new Map<string, {
    result: PageResult | SupportingPageResult;
    source: InternalLinkCheck["source"];
  }>([
    ...pages.map((result) => [result.url, { result, source: "sitemap" as const }] as const),
    ...supportingPages.map((result) => [result.url, { result, source: "supporting-pagination" as const }] as const)
  ]);
  const pendingInternalTargets = [...inventory.keys()].filter((target) => !knownResults.has(target));
  const queuedInternalTargets = new Set(pendingInternalTargets);
  const linkedTargetPages: SupportingPageResult[] = [];
  const internalPressureSignals: boolean[] = [];
  let consecutiveInternalFailures = 0;
  let lastInternalProgressAt = Date.now();

  while (pendingInternalTargets.length > 0) {
    const target = pendingInternalTargets.shift();
    if (!target || knownResults.has(target)) continue;
    const result = await inspectInternalLinkTarget(target);
    linkedTargetPages.push(result);
    knownResults.set(target, { result, source: "linked-target" });
    const hardFailure = result.status === 0
      || result.status >= 500
      || result.findings.some(isLaunchOperationalFinding);
    consecutiveInternalFailures = hardFailure ? consecutiveInternalFailures + 1 : 0;
    internalPressureSignals.push(hardFailure || result.warnings.length > 0);
    if (internalPressureSignals.length > 10) internalPressureSignals.shift();

    for (const discoveredTarget of result.internalLinks) {
      const referrers = inventory.get(discoveredTarget) ?? new Set<string>();
      referrers.add(target);
      inventory.set(discoveredTarget, referrers);
      if (inventory.size > maxInternalLinkTargets) {
        throw new Error(
          `Full launch audit reached the ${maxInternalLinkTargets}-target internal-link safety ceiling before exhausting discovered links`
        );
      }
      if (!knownResults.has(discoveredTarget) && !queuedInternalTargets.has(discoveredTarget)) {
        queuedInternalTargets.add(discoveredTarget);
        pendingInternalTargets.push(discoveredTarget);
      }
    }

    await heartbeatAuditLock();
    if (
      linkedTargetPages.length % 10 === 0
      || Date.now() - lastInternalProgressAt >= 30_000
      || pendingInternalTargets.length === 0
    ) {
      lastInternalProgressAt = Date.now();
      await writeAuditReport({
        status: "running",
        runId,
        baseUrl,
        pagesChecked: pages.length,
        pagesTotal: urls.length,
        supportingListPagesChecked: supportingPages.length,
        internalLinkTargetsDiscovered: inventory.size,
        internalLinkTargetsChecked: [...inventory.keys()].filter((url) => knownResults.has(url)).length,
        linkedTargetsFetched: linkedTargetPages.length,
        findings: [
          ...pages.flatMap((page) => page.findings),
          ...supportingPages.flatMap((page) => page.findings),
          ...linkedTargetPages.flatMap((page) => page.findings)
        ],
        warnings: [
          ...sitemap.warnings,
          ...pages.flatMap((page) => page.warnings),
          ...supportingPages.flatMap((page) => page.warnings),
          ...linkedTargetPages.flatMap((page) => page.warnings)
        ],
        reportPath
      });
      console.error(JSON.stringify({
        type: "launch-audit-internal-link-progress",
        runId,
        internalLinkTargetsDiscovered: inventory.size,
        internalLinkTargetsChecked: [...inventory.keys()].filter((url) => knownResults.has(url)).length,
        linkedTargetsFetched: linkedTargetPages.length
      }));
    }
    if (consecutiveInternalFailures >= 3) {
      throw new Error("Full launch audit stopped after three consecutive internal-link target failures");
    }
    if (launchAuditPressureExceeded(internalPressureSignals)) {
      throw new Error("Full launch audit stopped after repeated internal-link pressure signals");
    }
    if (supportingAuditHealthProbeDue(linkedTargetPages.length)) {
      await assertStableAuditHealth("internal-link-crawl");
    }
    await pauseAudit();
  }

  const internalLinkChecks: InternalLinkCheck[] = [...inventory.entries()]
    .map(([targetUrl, referrers]) => {
      const known = knownResults.get(targetUrl);
      if (!known) {
        throw new Error(`Full launch audit did not check discovered internal-link target ${targetUrl}`);
      }
      const redirectedTo = known.result.finalUrl !== targetUrl ? known.result.finalUrl : undefined;
      return {
        ...known.result,
        referrers: [...referrers].sort(),
        source: known.source,
        ...(redirectedTo ? { redirectedTo } : {})
      };
    })
    .sort((left, right) => left.url.localeCompare(right.url));

  const durableSourceInventory = buildInternalLinkInventory(
    [...pages, ...supportingPages, ...linkedTargetPages].map((page) => ({
      url: page.url,
      internalLinks: page.durableSourceLinks
    }))
  );
  if (durableSourceInventory.length > maxOutboundDurableSourceTargets) {
    throw new Error(
      `Full launch audit discovered ${durableSourceInventory.length} marked durable-source targets, exceeding the ${maxOutboundDurableSourceTargets}-target safety ceiling`
    );
  }
  const outboundDurableSourceChecks: OutboundDurableSourceCheck[] = [];
  const outboundPressureSignals: boolean[] = [];
  let consecutiveOutboundPressure = 0;
  let lastOutboundProgressAt = Date.now();
  for (const source of durableSourceInventory) {
    const check = await inspectOutboundDurableSource(source.targetUrl, source.referrers);
    outboundDurableSourceChecks.push(check);
    const pressure = check.probes.some((probe) => probe.status >= 500 || Boolean(probe.transportError));
    consecutiveOutboundPressure = pressure ? consecutiveOutboundPressure + 1 : 0;
    outboundPressureSignals.push(pressure);
    if (outboundPressureSignals.length > 10) outboundPressureSignals.shift();

    await heartbeatAuditLock();
    if (
      outboundDurableSourceChecks.length % 10 === 0
      || Date.now() - lastOutboundProgressAt >= 30_000
      || outboundDurableSourceChecks.length === durableSourceInventory.length
    ) {
      lastOutboundProgressAt = Date.now();
      const classificationCounts = Object.fromEntries(
        ["healthy", "redirected", "confirmed_broken", "bot_restricted", "transport_unknown"]
          .map((classification) => [
            classification,
            outboundDurableSourceChecks.filter((item) => item.classification === classification).length
          ])
      );
      await writeAuditReport({
        status: "running",
        runId,
        baseUrl,
        pagesChecked: pages.length,
        pagesTotal: urls.length,
        supportingListPagesChecked: supportingPages.length,
        internalLinkTargetsDiscovered: inventory.size,
        internalLinkTargetsChecked: internalLinkChecks.length,
        outboundDurableSourceTargetsDiscovered: durableSourceInventory.length,
        outboundDurableSourceTargetsChecked: outboundDurableSourceChecks.length,
        outboundDurableSourceClassifications: classificationCounts,
        outboundDurableSourceChecks,
        findings: [
          ...pages.flatMap((page) => page.findings),
          ...supportingPages.flatMap((page) => page.findings),
          ...linkedTargetPages.flatMap((page) => page.findings),
          ...outboundDurableSourceChecks
            .filter((item) => item.classification === "confirmed_broken")
            .map((item) => ({
              url: item.url,
              issue: `Confirmed broken durable source (${item.probes.map((probe) => probe.status || "transport").join(" then ")})`
            }))
        ],
        warnings: [
          ...sitemap.warnings,
          ...pages.flatMap((page) => page.warnings),
          ...supportingPages.flatMap((page) => page.warnings),
          ...linkedTargetPages.flatMap((page) => page.warnings)
        ],
        reportPath
      });
      console.error(JSON.stringify({
        type: "launch-audit-outbound-source-progress",
        runId,
        outboundDurableSourceTargetsChecked: outboundDurableSourceChecks.length,
        outboundDurableSourceTargetsTotal: durableSourceInventory.length,
        classifications: classificationCounts
      }));
    }
    if (consecutiveOutboundPressure >= 3) {
      throw new Error("Full launch audit stopped after three consecutive outbound-source transport or server pressure signals");
    }
    if (launchAuditPressureExceeded(outboundPressureSignals)) {
      throw new Error("Full launch audit stopped after repeated outbound-source transport or server pressure signals");
    }
    if (supportingAuditHealthProbeDue(outboundDurableSourceChecks.length)) {
      await assertStableAuditHealth("outbound-source-audit");
    }
    await pauseAudit();
  }
  await heartbeatAuditLock();
  await assertStableAuditHealth("post-crawl");
  const sitemapSet = new Set(urls);
  const linked = new Set(inventory.keys());
  const orphanCandidates = urls.filter((url) => url !== `${baseUrl}/` && !linked.has(url));
  const titleGroups = new Map<string, string[]>();
  for (const page of pages) {
    if (!page.title) continue;
    titleGroups.set(page.title, [...(titleGroups.get(page.title) ?? []), page.url]);
  }
  const duplicateTitles = [...titleGroups.entries()].filter(([, matching]) => matching.length > 1);
  const operationalResponses = await Promise.all([
    fetchAuditResource(operationalUrls.health),
    fetchAuditResource(operationalUrls.summary),
    fetchAuditResource(operationalUrls.atlas)
  ]);
  const operationalFindings: Finding[] = [];
  const operationalPayloads = operationalResponses.map((result, index) => {
    const url = [operationalUrls.health, operationalUrls.summary, operationalUrls.atlas][index];
    if (!result.response.ok) operationalFindings.push({ url, issue: `Operational endpoint returned HTTP ${result.response.status}` });
    if (result.durationMs > maxResponseMs) operationalFindings.push({ url, issue: `Operational response exceeded ${maxResponseMs} ms (${result.durationMs} ms)` });
    if (result.responseBytes > maxHtmlBytes) operationalFindings.push({ url, issue: `Operational response exceeded ${maxHtmlBytes} bytes (${result.responseBytes} bytes)` });
    try {
      return JSON.parse(result.body) as unknown;
    } catch {
      operationalFindings.push({ url, issue: "Operational endpoint returned invalid JSON" });
      return null;
    }
  });
  operationalFindings.push(...assessAtlasOperationalPayloads(
    operationalPayloads[0],
    operationalPayloads[1],
    operationalPayloads[2],
    operationalUrls
  ));
  const pageFindings = pages.flatMap((page) => page.findings);
  const supportingFindings = supportingPages.flatMap((page) => page.findings);
  const linkedTargetFindings = linkedTargetPages.flatMap((page) => page.findings);
  const outboundDurableSourceFindings: Finding[] = outboundDurableSourceChecks
    .filter((check) => check.classification === "confirmed_broken")
    .map((check) => ({
      url: check.url,
      issue: `Confirmed broken durable source (${check.probes.map((probe) => probe.status || "transport").join(" then ")})`
    }));
  const releaseBlockers = [
    ...pageFindings.filter(isLaunchOperationalFinding),
    ...supportingFindings.filter(isLaunchOperationalFinding),
    ...linkedTargetFindings.filter(isLaunchOperationalFinding),
    ...outboundDurableSourceFindings,
    ...operationalFindings
  ];
  const siteAuditFindings = [
    ...pageFindings.filter((finding) => !isLaunchOperationalFinding(finding)),
    ...supportingFindings.filter((finding) => !isLaunchOperationalFinding(finding)),
    ...linkedTargetFindings.filter((finding) => !isLaunchOperationalFinding(finding)),
    ...duplicateTitles.map(([title, matching]) => ({
      url: matching.join(", "),
      issue: `Duplicate title: ${title}`
    }))
  ];
  const warnings = [
    ...sitemap.warnings,
    ...pages.flatMap((page) => page.warnings),
    ...supportingPages.flatMap((page) => page.warnings),
    ...linkedTargetPages.flatMap((page) => page.warnings),
    ...operationalResponses.flatMap((response) => response.warnings)
  ];
  const slowestPages = pages
    .map((page) => ({ url: page.url, durationMs: page.durationMs, responseBytes: page.responseBytes }))
    .sort((left, right) => right.durationMs - left.durationMs)
    .slice(0, 10);
  const pageDurations = pages.map((page) => page.durationMs);
  const report = {
    status: releaseBlockers.length > 0
      ? "failed"
      : siteAuditFindings.length > 0 || warnings.length > 0 || orphanCandidates.length > 0
        ? "completed_with_findings"
        : "passed",
    runId,
    generatedAt: new Date().toISOString(),
    baseUrl,
    pagesChecked: pages.length,
    supportingListPagesChecked: supportingPages.length,
    internalLinkTargetsDiscovered: internalLinkChecks.length,
    linkedTargetsFetched: linkedTargetPages.length,
    sitemapInternalLinks: [...linked].filter((url) => sitemapSet.has(url)).length,
    internalLinkChecks: internalLinkChecks.map(({
      internalLinks: _internalLinks,
      durableSourceLinks: _durableSourceLinks,
      ...check
    }) => check),
    internalLinkRedirects: internalLinkChecks
      .filter((check) => check.redirectedTo)
      .map((check) => ({ url: check.url, redirectedTo: check.redirectedTo, referrers: check.referrers })),
    outboundDurableSourceTargetsDiscovered: durableSourceInventory.length,
    outboundDurableSourceChecks,
    outboundDurableSourceClassifications: Object.fromEntries(
      ["healthy", "redirected", "confirmed_broken", "bot_restricted", "transport_unknown"]
        .map((classification) => [
          classification,
          outboundDurableSourceChecks.filter((check) => check.classification === classification).length
        ])
    ),
    releaseBlockers,
    siteAuditFindings,
    warnings,
    performanceBudgets: {
      maxResponseMs,
      maxHtmlBytes,
      maxInternalLinkTargets,
      maxOutboundDurableSourceTargets,
      requestSpacingMs,
      requestJitterMs
    },
    responseTimingMs: {
      p50: percentile(pageDurations, 0.5),
      p75: percentile(pageDurations, 0.75),
      p95: percentile(pageDurations, 0.95)
    },
    slowestPages,
    operationalChecks: operationalResponses.map((response, index) => ({
      url: [operationalUrls.health, operationalUrls.summary, operationalUrls.atlas][index],
      status: response.response.status,
      attempts: response.attempts,
      recoveredRetry: response.recoveredRetry,
      durationMs: response.durationMs,
      responseBytes: response.responseBytes
    })),
    orphanCandidates,
    duplicateTitles,
    pages: pages.map(({
      internalLinks: _internalLinks,
      durableSourceLinks: _durableSourceLinks,
      ...page
    }) => page)
  };
  await writeAuditReport(report);
  console.log(JSON.stringify({
    status: report.status,
    runId,
    baseUrl,
    pagesChecked: report.pagesChecked,
    internalLinkTargetsChecked: report.internalLinkTargetsDiscovered,
    linkedTargetsFetched: report.linkedTargetsFetched,
    outboundDurableSourceTargetsChecked: report.outboundDurableSourceChecks.length,
    releaseBlockers: releaseBlockers.length,
    siteAuditFindings: siteAuditFindings.length,
    recoveredWarnings: warnings.length,
    orphanCandidates: orphanCandidates.length,
    duplicateTitles: duplicateTitles.length,
    reportPath
  }, null, 2));
  if (releaseBlockers.length > 0) process.exitCode = 1;
}

async function orchestrate() {
  let lockAcquired = false;
  let stoppingForSignal = false;
  const releaseForSignal = async (code: number, signal: string) => {
    if (stoppingForSignal) return;
    stoppingForSignal = true;
    if (lockAcquired) await writeInconclusiveAuditReport(`Full launch audit interrupted by ${signal}`);
    if (lockAcquired) await releaseAuditLock();
    process.exit(code);
  };
  const onSigint = () => { void releaseForSignal(130, "SIGINT"); };
  const onSigterm = () => { void releaseForSignal(143, "SIGTERM"); };
  try {
    await acquireAuditLock();
    lockAcquired = true;
    process.once("SIGINT", onSigint);
    process.once("SIGTERM", onSigterm);
    await main();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Public launch audit failed";
    if (lockAcquired) await writeInconclusiveAuditReport(message);
    console.error(message);
    process.exitCode = 2;
  } finally {
    process.off("SIGINT", onSigint);
    process.off("SIGTERM", onSigterm);
    if (lockAcquired) await releaseAuditLock();
  }
}

void orchestrate();
