import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  assessAtlasOperationalPayloads,
  fetchLaunchResource,
  type LaunchFinding
} from "../src/lib/launch/operational-checks";

const baseUrl = (process.env.PUBLIC_LAUNCH_BASE_URL ?? "https://truenorthmap.ca").replace(/\/$/, "");
const reportPath = process.env.PUBLIC_LAUNCH_REPORT;
const concurrency = Math.max(1, Math.min(4, Number(process.env.PUBLIC_LAUNCH_CONCURRENCY ?? "1")));
const requestSpacingMs = Math.max(0, Number(process.env.PUBLIC_LAUNCH_REQUEST_SPACING_MS ?? "300"));
const maxResponseMs = Math.max(1_000, Number(process.env.PUBLIC_LAUNCH_MAX_RESPONSE_MS ?? "10000"));
const maxHtmlBytes = Math.max(100_000, Number(process.env.PUBLIC_LAUNCH_MAX_HTML_BYTES ?? "2000000"));
const maxRecoveredFailures = Math.max(0, Number(process.env.PUBLIC_LAUNCH_MAX_RECOVERED_FAILURES ?? "0"));
const operationalUrls = {
  health: `${baseUrl}/api/health`,
  summary: `${baseUrl}/api/atlas/summary`,
  atlas: `${baseUrl}/api/atlas?page=1&pageSize=18`
};

type Finding = LaunchFinding;
type PageResult = {
  url: string;
  status: number;
  title?: string;
  canonical?: string;
  findings: Finding[];
  warnings: Finding[];
  durationMs: number;
  responseBytes: number;
  internalLinks: string[];
};

function match(html: string, expression: RegExp) {
  return expression.exec(html)?.[1]?.trim();
}

function decode(value: string) {
  return value.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'");
}

function percentile(values: number[], quantile: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * quantile) - 1))];
}

function absoluteInternalLink(value: string) {
  try {
    const url = new URL(decode(value), baseUrl);
    if (url.origin !== new URL(baseUrl).origin) return undefined;
    url.hash = "";
    return url.toString();
  } catch {
    return undefined;
  }
}

async function inspectPage(url: string): Promise<PageResult> {
  let response: Response;
  let html: string;
  let warnings: Finding[];
  let durationMs: number;
  let responseBytes: number;
  try {
    const fetched = await fetchLaunchResource(url);
    response = fetched.response;
    html = fetched.body;
    warnings = fetched.warnings;
    durationMs = fetched.durationMs;
    responseBytes = fetched.responseBytes;
  } catch (error) {
    return {
      url,
      status: 0,
      findings: [{ url, issue: error instanceof Error ? `Request failed: ${error.message}` : "Request failed" }],
      warnings: [],
      durationMs: 0,
      responseBytes: 0,
      internalLinks: []
    };
  }
  const findings: Finding[] = [];
  if (!response.ok) findings.push({ url, issue: `HTTP ${response.status}` });
  if (durationMs > maxResponseMs) findings.push({ url, issue: `HTML response exceeded ${maxResponseMs} ms (${durationMs} ms)` });
  if (responseBytes > maxHtmlBytes) findings.push({ url, issue: `HTML response exceeded ${maxHtmlBytes} bytes (${responseBytes} bytes)` });
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

  const internalLinks = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)]
    .map((item) => absoluteInternalLink(item[1]))
    .filter((item): item is string => Boolean(item));
  return {
    url,
    status: response.status,
    title,
    canonical,
    findings,
    warnings,
    durationMs,
    responseBytes,
    internalLinks: [...new Set(internalLinks)]
  };
}

async function mapLimited<T, R>(values: T[], limit: number, work: (value: T) => Promise<R>) {
  const results: R[] = new Array(values.length);
  let next = 0;
  async function worker() {
    while (next < values.length) {
      const index = next++;
      results[index] = await work(values[index]);
      if (requestSpacingMs > 0) await new Promise((resolve) => setTimeout(resolve, requestSpacingMs));
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, worker));
  return results;
}

async function collectSupportingListPages(seedUrls: string[]) {
  const pending = [...new Set(seedUrls)];
  const seen = new Set<string>();
  const pages: Array<{ url: string; status: number; findings: Finding[]; warnings: Finding[]; internalLinks: string[] }> = [];
  while (pending.length > 0 && seen.size < 50) {
    const batch = pending.splice(0, concurrency).filter((url) => !seen.has(url));
    if (batch.length === 0) continue;
    const results = await mapLimited(batch, concurrency, async (url) => {
      seen.add(url);
      try {
        const { response, body, warnings, durationMs, responseBytes } = await fetchLaunchResource(url);
        const findings: Finding[] = [];
        if (!response.ok) findings.push({ url, issue: `Supporting list page returned HTTP ${response.status}` });
        if (durationMs > maxResponseMs) findings.push({ url, issue: `Supporting list response exceeded ${maxResponseMs} ms (${durationMs} ms)` });
        if (responseBytes > maxHtmlBytes) findings.push({ url, issue: `Supporting list response exceeded ${maxHtmlBytes} bytes (${responseBytes} bytes)` });
        if (!response.ok) return { url, status: response.status, findings, warnings, internalLinks: [] as string[] };
        const internalLinks = [...body.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)]
          .map((item) => absoluteInternalLink(item[1]))
          .filter((item): item is string => Boolean(item));
        return { url, status: response.status, findings, warnings, internalLinks: [...new Set(internalLinks)] };
      } catch (error) {
        return {
          url,
          status: 0,
          findings: [{ url, issue: error instanceof Error ? `Supporting list request failed: ${error.message}` : "Supporting list request failed" }],
          warnings: [],
          internalLinks: [] as string[]
        };
      }
    });
    pages.push(...results);
    for (const link of results.flatMap((page) => page.internalLinks)) {
      if (/\/(organizations|demand)\?[^#]*\bpage=\d+/.test(link) && !seen.has(link)) pending.push(link);
    }
  }
  return pages;
}

async function main() {
  // Warm the compact national projection before the canonical crawl. This
  // avoids turning a release check into a cold-cache stampede against the
  // public database while still checking the operational endpoints again
  // after the complete crawl.
  const prewarm = await fetchLaunchResource(operationalUrls.atlas);
  if (!prewarm.response.ok) throw new Error(`Atlas prewarm returned ${prewarm.response.status}`);

  const sitemap = await fetchLaunchResource(`${baseUrl}/sitemap.xml`);
  if (!sitemap.response.ok) throw new Error(`Sitemap returned ${sitemap.response.status}`);
  const sitemapXml = sitemap.body;
  const urls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((item) => decode(item[1]));
  if (urls.length === 0) throw new Error("Sitemap contains no canonical URLs");

  const pages = await mapLimited(urls, concurrency, inspectPage);
  const supportingListUrls = [...new Set(pages
    .flatMap((page) => page.internalLinks)
    .filter((url) => /\/(organizations|demand)\?[^#]*\bpage=\d+/.test(url)))];
  const supportingPages = await collectSupportingListPages(supportingListUrls);
  const sitemapSet = new Set(urls);
  const linked = new Set([...pages.flatMap((page) => page.internalLinks), ...supportingPages.flatMap((page) => page.internalLinks)]);
  const orphanCandidates = urls.filter((url) => url !== `${baseUrl}/` && !linked.has(url));
  const titleGroups = new Map<string, string[]>();
  for (const page of pages) {
    if (!page.title) continue;
    titleGroups.set(page.title, [...(titleGroups.get(page.title) ?? []), page.url]);
  }
  const duplicateTitles = [...titleGroups.entries()].filter(([, matching]) => matching.length > 1);
  const operationalResponses = await Promise.all([
    fetchLaunchResource(operationalUrls.health),
    fetchLaunchResource(operationalUrls.summary),
    fetchLaunchResource(operationalUrls.atlas)
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
  const findings = [
    ...pages.flatMap((page) => page.findings),
    ...supportingPages.flatMap((page) => page.findings),
    ...operationalFindings
  ];
  const warnings = [
    ...sitemap.warnings,
    ...pages.flatMap((page) => page.warnings),
    ...supportingPages.flatMap((page) => page.warnings),
    ...operationalResponses.flatMap((response) => response.warnings)
  ];
  const slowestPages = pages
    .map((page) => ({ url: page.url, durationMs: page.durationMs, responseBytes: page.responseBytes }))
    .sort((left, right) => right.durationMs - left.durationMs)
    .slice(0, 10);
  const pageDurations = pages.map((page) => page.durationMs);
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    pagesChecked: pages.length,
    supportingListPagesChecked: supportingPages.length,
    sitemapInternalLinks: [...linked].filter((url) => sitemapSet.has(url)).length,
    findings,
    warnings,
    performanceBudgets: { maxResponseMs, maxHtmlBytes, maxRecoveredFailures },
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
    pages: pages.map(({ internalLinks: _links, ...page }) => page)
  };
  if (reportPath) {
    await mkdir(dirname(reportPath), { recursive: true });
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  }
  console.log(JSON.stringify({
    baseUrl,
    pagesChecked: report.pagesChecked,
    findings: findings.length,
    recoveredWarnings: warnings.length,
    maxRecoveredFailures,
    orphanCandidates: orphanCandidates.length,
    duplicateTitles: duplicateTitles.length,
    reportPath: reportPath ?? null
  }, null, 2));
  if (findings.length > 0 || duplicateTitles.length > 0 || warnings.length > maxRecoveredFailures) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Public launch validation failed");
  process.exitCode = 1;
});
