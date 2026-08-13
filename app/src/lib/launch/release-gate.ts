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

const dynamicMetadataPrefixes = representativePrefixes;

const dynamicMetadataIssues = new Set([
  "missing title",
  "missing meta description",
  "missing canonical url",
  "incomplete open graph metadata",
  "missing twitter card metadata"
]);

export const MAX_EXPLICIT_LAUNCH_PATHS = 10;
export const MAX_SUPPORTING_AUDIT_PAGES = 50;
export const MAX_INTERNAL_LINK_TARGETS = 2_500;
export const MAX_OUTBOUND_DURABLE_SOURCE_TARGETS = 1_500;

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
  let pathname = finding.url;
  try { pathname = new URL(finding.url, "https://truenorthmap.ca").pathname; } catch { /* use the raw path */ }
  const missingDynamicMetadata = dynamicMetadataPrefixes.some((prefix) => pathname.startsWith(prefix))
    && dynamicMetadataIssues.has(issue);
  return issue.startsWith("http ")
    || issue.startsWith("request failed")
    || issue.includes("application error document")
    || issue.startsWith("expected html")
    || issue.includes("returned http")
    || issue.includes("request failed")
    || issue.includes("did not return html")
    || issue.includes("react server component error digest")
    || issue.includes("unresolved streamed loading boundary")
    || issue.includes("unresolved route loading shell")
    || missingDynamicMetadata;
}

function decodedNextFlightPayload(html: string) {
  const chunks: string[] = [];
  const expression = /self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)/g;
  for (const match of html.matchAll(expression)) {
    try {
      const decoded = JSON.parse(match[1]);
      if (typeof decoded === "string") chunks.push(decoded);
    } catch {
      // Other route and metadata checks fail closed if a response is malformed.
    }
  }
  return chunks.join("");
}

function containsUnresolvedRouteShell(html: string) {
  const hasLoadingState = /aria-busy=["']true["']/i.test(html)
    && /Loading (?:published |current |the |regional |Canadian )/i.test(html);
  if (!hasLoadingState) return false;
  return !/<title[^>]*>[^<]+<\/title>/i.test(html)
    && !/<link[^>]+rel=["']canonical["'][^>]+href=["'][^"']+["']/i.test(html)
    && !/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(html);
}

/** Inspect a fully buffered Next.js HTML response for streamed application
 * failures that may still carry HTTP 200. `$undefined` metadata objects and a
 * healthy streamed fallback followed by resolved content are normal; decoded
 * Flight error rows and unresolved route shells are not.
 */
export function inspectNextStreamState(html: string, url: string): LaunchFinding[] {
  const findings: LaunchFinding[] = [];
  const hasErrorFrame = /(?:^|\n)[0-9a-z]+:E\{/i.test(decodedNextFlightPayload(html))
    || /\$RX\("B:[^"]+"/.test(html);
  if (hasErrorFrame) findings.push({ url, issue: "React Server Component error digest" });

  const pending = new Set([...html.matchAll(/<template id="B:([^"]+)"/g)].map((match) => match[1]));
  const settled = new Set([
    ...[...html.matchAll(/\$(?:RC|RX)\("B:([^"]+)"/g)].map((match) => match[1])
  ]);
  if ([...pending].some((id) => !settled.has(id))) {
    findings.push({ url, issue: "Unresolved streamed loading boundary" });
  }
  if (containsUnresolvedRouteShell(html)) {
    findings.push({ url, issue: "Unresolved route loading shell" });
  }
  return findings;
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

const nonContentQueryKeys = new Set(["fbclid", "gclid", "msclkid"]);

/** Resolve an anchor target against the page that contains it, keep it on the
 * canonical origin, remove fragments and acquisition-only query parameters,
 * and sort the remaining query string so one route is audited once.
 */
export function normalizeSameOriginLink(
  value: string,
  referrerUrl: string,
  canonicalBaseUrl: string
) {
  const decoded = decodeXml(value.trim());
  if (!decoded) return undefined;
  try {
    const canonicalOrigin = normalizedOrigin(canonicalBaseUrl);
    const referrer = new URL(referrerUrl, canonicalOrigin);
    if (referrer.origin !== canonicalOrigin) return undefined;
    const target = new URL(decoded, referrer);
    if (target.origin !== canonicalOrigin || !["http:", "https:"].includes(target.protocol)) return undefined;
    target.hash = "";
    for (const key of [...target.searchParams.keys()]) {
      if (key.toLowerCase().startsWith("utm_") || nonContentQueryKeys.has(key.toLowerCase())) {
        target.searchParams.delete(key);
      }
    }
    target.searchParams.sort();
    return target.toString();
  } catch {
    return undefined;
  }
}

export function extractNormalizedSameOriginLinks(
  html: string,
  referrerUrl: string,
  canonicalBaseUrl: string
) {
  const links = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)]
    .map((match) => normalizeSameOriginLink(match[1], referrerUrl, canonicalBaseUrl))
    .filter((link): link is string => Boolean(link));
  return [...new Set(links)];
}

export function normalizeMarkedDurableSourceLink(value: string, canonicalBaseUrl: string) {
  const decoded = decodeXml(value.trim());
  if (!decoded) return undefined;
  try {
    const target = new URL(decoded, canonicalBaseUrl);
    if (!["http:", "https:"].includes(target.protocol)) return undefined;
    if (target.origin === normalizedOrigin(canonicalBaseUrl)) return undefined;
    if (target.username || target.password) return undefined;
    target.hash = "";
    for (const key of [...target.searchParams.keys()]) {
      if (key.toLowerCase().startsWith("utm_") || nonContentQueryKeys.has(key.toLowerCase())) {
        target.searchParams.delete(key);
      }
    }
    target.searchParams.sort();
    return target.toString();
  } catch {
    return undefined;
  }
}

/** Only anchors deliberately marked by a public durable-evidence renderer are
 * eligible. Ordinary external, social, provider, campaign and navigation links
 * remain outside the outbound audit.
 */
export function extractMarkedDurableSourceLinks(html: string, canonicalBaseUrl: string) {
  const links = [...html.matchAll(/<a\b([^>]*)>/gi)]
    .filter((match) => /\bdata-launch-durable-source=["']true["']/i.test(match[1]))
    .map((match) => /\bhref=["']([^"']+)["']/i.exec(match[1])?.[1])
    .filter((value): value is string => Boolean(value))
    .map((value) => normalizeMarkedDurableSourceLink(value, canonicalBaseUrl))
    .filter((link): link is string => Boolean(link));
  return [...new Set(links)];
}

export type InternalLinkInventoryEntry = {
  targetUrl: string;
  referrers: string[];
};

export function buildInternalLinkInventory(
  pages: Array<{ url: string; internalLinks: string[] }>
): InternalLinkInventoryEntry[] {
  const inventory = new Map<string, Set<string>>();
  for (const page of pages) {
    for (const targetUrl of page.internalLinks) {
      const referrers = inventory.get(targetUrl) ?? new Set<string>();
      referrers.add(page.url);
      inventory.set(targetUrl, referrers);
    }
  }
  return [...inventory.entries()]
    .map(([targetUrl, referrers]) => ({ targetUrl, referrers: [...referrers].sort() }))
    .sort((left, right) => left.targetUrl.localeCompare(right.targetUrl));
}

export type DurableSourceProbe = {
  status: number;
  finalUrl: string;
  redirected: boolean;
  transportError?: string;
};

export type DurableSourceClassification =
  | "healthy"
  | "redirected"
  | "confirmed_broken"
  | "bot_restricted"
  | "transport_unknown";

function ipv4AddressIsPublic(address: string) {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(address);
  if (!match) return false;
  const octets = match.slice(1).map(Number);
  if (octets.some((octet) => octet < 0 || octet > 255)) return false;
  const [first, second, third] = octets;
  return !(
    first === 0
    || first === 10
    || first === 127
    || (first === 100 && second >= 64 && second <= 127)
    || (first === 169 && second === 254)
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 0 && third === 0)
    || (first === 192 && second === 0 && third === 2)
    || (first === 192 && second === 168)
    || (first === 198 && (second === 18 || second === 19))
    || (first === 198 && second === 51 && third === 100)
    || (first === 203 && second === 0 && third === 113)
    || first >= 224
  );
}

function ipv6AddressIsPublic(address: string) {
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, "").split("%")[0];
  if (!normalized.includes(":")) return false;
  if (normalized === "::" || normalized === "::1") return false;
  if (
    /^(?:fc|fd)/.test(normalized)
    || /^fe[89ab]/.test(normalized)
    || /^fe[c-f]/.test(normalized)
    || /^ff/.test(normalized)
  ) return false;
  if (normalized.startsWith("2001:db8:")) return false;
  const dottedIpv4 = /(\d{1,3}(?:\.\d{1,3}){3})$/.exec(normalized)?.[1];
  if (dottedIpv4) return ipv4AddressIsPublic(dottedIpv4);
  const segments = normalized.split(":");
  if (segments.length >= 2) {
    const high = Number.parseInt(segments.at(-2) || "0", 16);
    const low = Number.parseInt(segments.at(-1) || "0", 16);
    const embeddedIpv4 = `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
    const embeddedPrefix = normalized.slice(0, normalized.lastIndexOf(segments.at(-2) || ""));
    if (/^(?:::ffff:|::)$/i.test(embeddedPrefix)) return ipv4AddressIsPublic(embeddedIpv4);
  }
  return true;
}

/** Validate the URL and every DNS answer before an outbound assurance request.
 * The caller must still pin the actual connection to one of the checked
 * addresses so a second DNS lookup cannot rebind the request.
 */
export function publicOutboundUrlIssue(value: string, resolvedAddresses: string[] = []) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return "Invalid outbound URL";
  }
  if (!["http:", "https:"].includes(parsed.protocol)) return "Outbound URL must use HTTP or HTTPS";
  if (parsed.username || parsed.password) return "Outbound URL must not contain credentials";
  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    hostname === "localhost"
    || hostname.endsWith(".localhost")
    || hostname.endsWith(".local")
    || hostname.endsWith(".internal")
    || hostname.endsWith(".lan")
    || hostname.endsWith(".home")
    || hostname.endsWith(".test")
    || hostname.endsWith(".invalid")
    || hostname.endsWith(".example")
  ) return "Private or reserved hostname";
  const directAddress = hostname.includes(":") || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)
    ? hostname
    : null;
  if (directAddress && !(directAddress.includes(":") ? ipv6AddressIsPublic(directAddress) : ipv4AddressIsPublic(directAddress))) {
    return "Private or reserved address";
  }
  if (resolvedAddresses.length > 0 && resolvedAddresses.some((address) => (
    address.includes(":") ? !ipv6AddressIsPublic(address) : !ipv4AddressIsPublic(address)
  ))) return "DNS resolved to a private or reserved address";
  return undefined;
}

export function classifyDurableSourceProbes(
  sourceUrl: string,
  probes: DurableSourceProbe[]
): DurableSourceClassification {
  const latest = probes.at(-1);
  if (!latest || latest.transportError || latest.status === 0) return "transport_unknown";
  if (latest.status === 404 || latest.status === 410) {
    return probes.length >= 2 && probes.every((probe) => probe.status === 404 || probe.status === 410)
      ? "confirmed_broken"
      : "transport_unknown";
  }
  if ([401, 403, 429].includes(latest.status)) return "bot_restricted";
  if (latest.status >= 500) {
    return probes.length >= 2 && probes[0].status >= 500
      ? "confirmed_broken"
      : "transport_unknown";
  }
  if (latest.status >= 200 && latest.status < 300) {
    return latest.redirected || latest.finalUrl !== sourceUrl ? "redirected" : "healthy";
  }
  return "transport_unknown";
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
