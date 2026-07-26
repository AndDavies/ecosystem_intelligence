import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const baseUrl = (process.env.PUBLIC_LAUNCH_BASE_URL ?? "https://truenorthmap.ca").replace(/\/$/, "");
const reportPath = process.env.PUBLIC_LAUNCH_REPORT;
const concurrency = Math.max(1, Math.min(4, Number(process.env.PUBLIC_LAUNCH_CONCURRENCY ?? "2")));
const requestSpacingMs = Math.max(0, Number(process.env.PUBLIC_LAUNCH_REQUEST_SPACING_MS ?? "125"));

type Finding = { url: string; issue: string };
type PageResult = {
  url: string;
  status: number;
  title?: string;
  canonical?: string;
  findings: Finding[];
  internalLinks: string[];
};

async function fetchWithRetry(url: string) {
  let response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(30_000) });
  let body = await response.text();
  if (response.status >= 500) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(30_000) });
    body = await response.text();
  }
  return { response, body };
}

function match(html: string, expression: RegExp) {
  return expression.exec(html)?.[1]?.trim();
}

function decode(value: string) {
  return value.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'");
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
  try {
    const fetched = await fetchWithRetry(url);
    response = fetched.response;
    html = fetched.body;
  } catch (error) {
    return {
      url,
      status: 0,
      findings: [{ url, issue: error instanceof Error ? `Request failed: ${error.message}` : "Request failed" }],
      internalLinks: []
    };
  }
  const findings: Finding[] = [];
  if (!response.ok) findings.push({ url, issue: `HTTP ${response.status}` });
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
  return { url, status: response.status, title, canonical, findings, internalLinks: [...new Set(internalLinks)] };
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
  const pages: Array<{ url: string; internalLinks: string[] }> = [];
  while (pending.length > 0 && seen.size < 50) {
    const batch = pending.splice(0, concurrency).filter((url) => !seen.has(url));
    if (batch.length === 0) continue;
    const results = await mapLimited(batch, concurrency, async (url) => {
      seen.add(url);
      try {
        const { response, body } = await fetchWithRetry(url);
        if (!response.ok) return { url, internalLinks: [] as string[] };
        const internalLinks = [...body.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)]
          .map((item) => absoluteInternalLink(item[1]))
          .filter((item): item is string => Boolean(item));
        return { url, internalLinks: [...new Set(internalLinks)] };
      } catch {
        return { url, internalLinks: [] as string[] };
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
  const sitemap = await fetchWithRetry(`${baseUrl}/sitemap.xml`);
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
  const findings = pages.flatMap((page) => page.findings);
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    pagesChecked: pages.length,
    supportingListPagesChecked: supportingPages.length,
    sitemapInternalLinks: [...linked].filter((url) => sitemapSet.has(url)).length,
    findings,
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
    orphanCandidates: orphanCandidates.length,
    duplicateTitles: duplicateTitles.length,
    reportPath: reportPath ?? null
  }, null, 2));
  if (findings.length > 0 || duplicateTitles.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Public launch validation failed");
  process.exitCode = 1;
});
