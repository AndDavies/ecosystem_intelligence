import type { LaunchFinding } from "./operational-checks";

export const DEFAULT_LAUNCH_PATHS = [
  "/",
  "/organizations",
  "/map",
  "/signals",
  "/north-signal"
] as const;

const representativePrefixes = [
  "/organizations/",
  "/capabilities/",
  "/missions/",
  "/demand/",
  "/briefs/",
  "/signals/"
] as const;

export const MAX_EXPLICIT_LAUNCH_PATHS = 10;
export const MAX_SUPPORTING_AUDIT_PAGES = 50;

export type LaunchAuditLockState = {
  runId?: unknown;
  pid?: unknown;
  heartbeatAt?: unknown;
};

export type LaunchTarget = {
  path: string;
  fetchUrl: string;
  canonicalUrl: string;
};

export function isLaunchOperationalFinding(finding: LaunchFinding) {
  const issue = finding.issue.toLowerCase();
  return issue.startsWith("http ")
    || issue.startsWith("request failed")
    || issue.includes("application error document")
    || issue.startsWith("expected html")
    || issue.includes("returned http")
    || issue.includes("request failed")
    || issue.includes("did not return html");
}

export function launchAuditPressureExceeded(signals: boolean[], windowSize = 10, threshold = 3) {
  return signals.slice(-windowSize).filter(Boolean).length >= threshold;
}

export function supportingAuditStopReason(result: {
  status: number;
  findings: LaunchFinding[];
  warnings: LaunchFinding[];
}) {
  if (result.warnings.length > 0) return "a supporting-page request required a retry";
  if (result.status === 0 || result.findings.some(isLaunchOperationalFinding)) {
    return "a supporting-page request returned an operational failure";
  }
  return undefined;
}

export function supportingAuditHealthProbeDue(pagesChecked: number, interval = 10) {
  return pagesChecked > 0 && pagesChecked % interval === 0;
}

export function recoveredLaunchWarningsBlock(count: number, maximumAdvisory = 1) {
  return count > maximumAdvisory;
}

export function launchAuditLockCanBeReplaced(
  state: LaunchAuditLockState,
  nowMs: number,
  lockMtimeMs: number,
  pidIsAlive: boolean | null,
  ttlMs: number
) {
  if (pidIsAlive === true) return false;
  if (pidIsAlive === false) return true;
  const heartbeatMs = typeof state.heartbeatAt === "string" ? Date.parse(state.heartbeatAt) : Number.NaN;
  const lastSeenMs = Number.isFinite(heartbeatMs) ? heartbeatMs : lockMtimeMs;
  return nowMs - lastSeenMs > ttlMs;
}

function decodeXml(value: string) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function normalizedOrigin(value: string) {
  return new URL(value).origin;
}

function pathWithSearch(url: URL) {
  return `${url.pathname}${url.search}`;
}

export function normalizeRequestedLaunchPath(value: string, canonicalBaseUrl: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Launch path cannot be empty");
  const canonicalOrigin = normalizedOrigin(canonicalBaseUrl);
  const parsed = new URL(trimmed, canonicalOrigin);
  if (parsed.origin !== canonicalOrigin) {
    throw new Error(`Launch path must remain on ${canonicalOrigin}: ${value}`);
  }
  parsed.hash = "";
  return pathWithSearch(parsed);
}

export function parseCanonicalSitemapPaths(xml: string, canonicalBaseUrl: string) {
  const canonicalOrigin = normalizedOrigin(canonicalBaseUrl);
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => {
    const parsed = new URL(decodeXml(match[1]));
    if (parsed.origin !== canonicalOrigin) {
      throw new Error(`Sitemap mixed an unexpected origin: ${parsed.origin}`);
    }
    parsed.hash = "";
    return pathWithSearch(parsed);
  });
  if (paths.length === 0) throw new Error("Sitemap contains no canonical URLs");
  return [...new Set(paths)];
}

export function selectLaunchPaths(
  sitemapPaths: string[],
  canonicalBaseUrl: string,
  requestedPaths: string[] = []
) {
  if (requestedPaths.length > MAX_EXPLICIT_LAUNCH_PATHS) {
    throw new Error(`Bounded launch validation accepts at most ${MAX_EXPLICIT_LAUNCH_PATHS} explicit paths; use launch:audit for broader coverage`);
  }
  const available = new Set(sitemapPaths);
  const selected = new Set<string>();
  for (const path of DEFAULT_LAUNCH_PATHS) {
    if (!available.has(path)) throw new Error(`Required public route is absent from the sitemap: ${path}`);
    selected.add(path);
  }
  for (const prefix of representativePrefixes) {
    const representative = sitemapPaths.find((path) => path.startsWith(prefix));
    if (!representative) throw new Error(`Required public route family is absent from the sitemap: ${prefix}`);
    selected.add(representative);
  }
  for (const value of requestedPaths) {
    const path = normalizeRequestedLaunchPath(value, canonicalBaseUrl);
    if (!available.has(path)) throw new Error(`Requested public route is absent from the sitemap: ${path}`);
    selected.add(path);
  }
  return [...selected];
}

export function buildLaunchTargets(
  paths: string[],
  fetchBaseUrl: string,
  canonicalBaseUrl: string
): LaunchTarget[] {
  const fetchOrigin = normalizedOrigin(fetchBaseUrl);
  const canonicalOrigin = normalizedOrigin(canonicalBaseUrl);
  return paths.map((path) => {
    const fetchUrl = new URL(path, fetchOrigin).toString();
    const canonicalUrl = new URL(path, canonicalOrigin).toString();
    if (new URL(fetchUrl).origin !== fetchOrigin) throw new Error(`Mixed-origin fetch target: ${fetchUrl}`);
    return { path, fetchUrl, canonicalUrl };
  });
}

function match(html: string, expression: RegExp) {
  return expression.exec(html)?.[1]?.trim();
}

export function inspectLaunchHtml(html: string, target: LaunchTarget): LaunchFinding[] {
  const findings: LaunchFinding[] = [];
  const title = match(html, /<title[^>]*>([^<]+)<\/title>/i);
  const description = match(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    ?? match(html, /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  const canonical = match(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
    ?? match(html, /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  const ogTitle = match(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  const ogImage = match(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  const twitterCard = match(html, /<meta[^>]+name=["']twitter:card["'][^>]+content=["']([^"']+)["']/i);

  if (!title) findings.push({ url: target.fetchUrl, issue: "Missing title" });
  if (!description) findings.push({ url: target.fetchUrl, issue: "Missing meta description" });
  if (!canonical) findings.push({ url: target.fetchUrl, issue: "Missing canonical URL" });
  if (canonical) {
    try {
      if (new URL(canonical, target.canonicalUrl).toString() !== target.canonicalUrl) {
        findings.push({ url: target.fetchUrl, issue: `Canonical mismatch: ${canonical}` });
      }
    } catch {
      findings.push({ url: target.fetchUrl, issue: `Invalid canonical URL: ${canonical}` });
    }
  }
  if (!ogTitle || !ogImage) findings.push({ url: target.fetchUrl, issue: "Incomplete Open Graph metadata" });
  if (!twitterCard) findings.push({ url: target.fetchUrl, issue: "Missing Twitter card metadata" });

  const jsonLdBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (jsonLdBlocks.length === 0) findings.push({ url: target.fetchUrl, issue: "Missing JSON-LD" });
  for (const block of jsonLdBlocks) {
    try {
      JSON.parse(block[1]);
    } catch {
      findings.push({ url: target.fetchUrl, issue: "Invalid JSON-LD" });
    }
  }

  for (const image of html.matchAll(/<img\b([^>]*)>/gi)) {
    const attributes = image[1];
    if (!/\balt=["'][^"']*["']/i.test(attributes)) {
      findings.push({ url: target.fetchUrl, issue: "Image without alt attribute" });
    }
    const layoutReservedByFill = /\bdata-nimg=["']fill["']/i.test(attributes)
      || (/position:\s*absolute/i.test(attributes) && /height:\s*100%/i.test(attributes) && /width:\s*100%/i.test(attributes));
    if (!layoutReservedByFill && (!/\bwidth=["']?\d+/i.test(attributes) || !/\bheight=["']?\d+/i.test(attributes))) {
      findings.push({ url: target.fetchUrl, issue: "Image without explicit dimensions" });
    }
  }
  return findings;
}
