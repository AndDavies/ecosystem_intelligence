import { execFileSync } from "node:child_process";
import {
  assessAtlasOperationalPayloads,
  fetchLaunchResource,
  type LaunchFinding
} from "../src/lib/launch/operational-checks";
import {
  buildLaunchTargets,
  inspectNextStreamState,
  inspectLaunchHtml,
  parseCanonicalSitemapPaths,
  recoveredLaunchWarningsBlock,
  selectLaunchPaths
} from "../src/lib/launch/release-gate";

const canonicalBaseUrl = (process.env.PUBLIC_LAUNCH_CANONICAL_BASE_URL ?? "https://truenorthmap.ca").replace(/\/$/, "");
const fetchBaseUrl = (process.env.PUBLIC_LAUNCH_BASE_URL ?? canonicalBaseUrl).replace(/\/$/, "");
const maxResponseMs = Math.max(1_000, Number(process.env.PUBLIC_LAUNCH_MAX_RESPONSE_MS ?? "10000"));
const maxHtmlBytes = Math.max(100_000, Number(process.env.PUBLIC_LAUNCH_MAX_HTML_BYTES ?? "2000000"));
const failOnRecovered = process.env.PUBLIC_LAUNCH_FAIL_ON_RECOVERED === "1";
const maxRecoveredWarnings = failOnRecovered
  ? 0
  : Math.max(0, Number(process.env.PUBLIC_LAUNCH_MAX_RECOVERED_WARNINGS ?? "1"));
const requestedPaths = (process.env.PUBLIC_LAUNCH_PATHS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const mode = new URL(fetchBaseUrl).origin === new URL(canonicalBaseUrl).origin
  ? "production-post-deploy"
  : "candidate-origin";
const requestHeaders = { "User-Agent": "TrueNorthMap-Launch-Gate/1.0" };

function localHead() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return undefined;
  }
}

const expectedDeployment = process.env.PUBLIC_LAUNCH_EXPECTED_DEPLOYMENT
  ?? (mode === "production-post-deploy" ? localHead() : undefined);

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function parseJson(body: string, url: string, findings: LaunchFinding[]) {
  try {
    return JSON.parse(body) as unknown;
  } catch {
    findings.push({ url, issue: "Endpoint returned invalid JSON" });
    return null;
  }
}

function responseBudgetFindings(
  url: string,
  status: number,
  durationMs: number,
  responseBytes: number,
  label = "Response"
) {
  const findings: LaunchFinding[] = [];
  if (status < 200 || status >= 400) findings.push({ url, issue: `${label} returned HTTP ${status}` });
  if (durationMs > maxResponseMs) findings.push({ url, issue: `${label} exceeded ${maxResponseMs} ms (${durationMs} ms)` });
  if (responseBytes > maxHtmlBytes) findings.push({ url, issue: `${label} exceeded ${maxHtmlBytes} bytes (${responseBytes} bytes)` });
  return findings;
}

function fetchGateResource(url: string) {
  return fetchLaunchResource(url, {
    timeoutMs: maxResponseMs,
    headers: requestHeaders,
    expectedOrigin: new URL(fetchBaseUrl).origin
  });
}

async function main() {
  const findings: LaunchFinding[] = [];
  const warnings: LaunchFinding[] = [];
  const sitemapUrl = `${fetchBaseUrl}/sitemap.xml`;
  const sitemap = await fetchGateResource(sitemapUrl);
  warnings.push(...sitemap.warnings);
  findings.push(...responseBudgetFindings(
    sitemapUrl,
    sitemap.response.status,
    sitemap.durationMs,
    sitemap.responseBytes,
    "Sitemap"
  ));
  if (!sitemap.response.ok) throw new Error(`Sitemap returned ${sitemap.response.status}`);

  const sitemapPaths = parseCanonicalSitemapPaths(sitemap.body, canonicalBaseUrl);
  const selectedPaths = selectLaunchPaths(sitemapPaths, canonicalBaseUrl, requestedPaths);
  const targets = buildLaunchTargets(selectedPaths, fetchBaseUrl, canonicalBaseUrl);

  for (const target of targets) {
    const result = await fetchGateResource(target.fetchUrl);
    warnings.push(...result.warnings);
    findings.push(...responseBudgetFindings(
      target.fetchUrl,
      result.response.status,
      result.durationMs,
      result.responseBytes,
      "Page"
    ));
    if (result.response.ok) {
      const contentType = result.response.headers.get("content-type") ?? "";
      const renderedApplicationError = result.body.includes("id=\"__next_error__\"")
        || result.body.includes("Application error: a server-side exception");
      if (!contentType.includes("text/html")) {
        findings.push({ url: target.fetchUrl, issue: `Expected HTML but received ${contentType || "an unknown content type"}` });
      } else if (renderedApplicationError) {
        findings.push({ url: target.fetchUrl, issue: "Rendered application error document" });
      } else {
        findings.push(...inspectNextStreamState(result.body, target.fetchUrl));
        findings.push(...inspectLaunchHtml(result.body, target));
      }
    }
  }

  const urls = {
    health: `${fetchBaseUrl}/api/health`,
    summary: `${fetchBaseUrl}/api/atlas/summary`,
    atlas: `${fetchBaseUrl}/api/atlas?page=1&pageSize=18`,
    contract: `${fetchBaseUrl}/api/system/research-contract`,
    proof: `${fetchBaseUrl}/api/signals/latest-proof`,
    feed: `${fetchBaseUrl}/signals/feed.xml`
  };
  const [health, summary, atlas, contract, proof, feed] = await Promise.all([
    fetchGateResource(urls.health),
    fetchGateResource(urls.summary),
    fetchGateResource(urls.atlas),
    fetchGateResource(urls.contract),
    fetchGateResource(urls.proof),
    fetchGateResource(urls.feed)
  ]);
  const endpointResults = [health, summary, atlas, contract, proof, feed];
  const endpointUrls = [urls.health, urls.summary, urls.atlas, urls.contract, urls.proof, urls.feed];
  endpointResults.forEach((result, index) => {
    warnings.push(...result.warnings);
    findings.push(...responseBudgetFindings(
      endpointUrls[index],
      result.response.status,
      result.durationMs,
      result.responseBytes,
      "Operational endpoint"
    ));
  });

  const healthPayload = parseJson(health.body, urls.health, findings);
  const summaryPayload = parseJson(summary.body, urls.summary, findings);
  const atlasPayload = parseJson(atlas.body, urls.atlas, findings);
  const contractPayload = parseJson(contract.body, urls.contract, findings);
  const proofPayload = parseJson(proof.body, urls.proof, findings);
  findings.push(...assessAtlasOperationalPayloads(
    healthPayload,
    summaryPayload,
    atlasPayload,
    { health: urls.health, summary: urls.summary, atlas: urls.atlas }
  ));

  const deployment = asRecord(contractPayload).deployment;
  if (expectedDeployment && deployment !== expectedDeployment) {
    findings.push({
      url: urls.contract,
      issue: `Production deployment mismatch: expected ${expectedDeployment}, received ${String(deployment ?? "missing")}`
    });
  }

  const proofRecord = asRecord(asRecord(proofPayload).proof);
  const latestSignalPath = sitemapPaths.find((path) => path.startsWith("/signals/"));
  if (typeof proofRecord.headline !== "string" || proofRecord.headline.trim().length === 0) {
    findings.push({ url: urls.proof, issue: "Latest Signals proof is missing a headline" });
  }
  if (typeof proofRecord.href !== "string" || !proofRecord.href.startsWith("/signals/")) {
    findings.push({ url: urls.proof, issue: "Latest Signals proof is missing a concrete edition path" });
  } else if (latestSignalPath && proofRecord.href !== latestSignalPath) {
    findings.push({ url: urls.proof, issue: `Latest Signals proof does not match the newest sitemap edition (${latestSignalPath})` });
  }
  if (!feed.body.includes("<rss") || !feed.body.includes("<channel")) {
    findings.push({ url: urls.feed, issue: "Signals feed is not valid RSS channel output" });
  }

  const recoveryBlocked = recoveredLaunchWarningsBlock(warnings.length, maxRecoveredWarnings);
  const status = findings.length > 0 || recoveryBlocked
    ? "fail"
    : warnings.length > 0
      ? "pass_with_recovered_warnings"
      : "pass";
  console.log(JSON.stringify({
    status,
    mode,
    fetchBaseUrl,
    canonicalBaseUrl,
    expectedDeployment: expectedDeployment ?? null,
    deployedCommit: typeof deployment === "string" ? deployment : null,
    sitemapPages: sitemapPaths.length,
    pagesChecked: targets.length,
    selectedPaths,
    findings,
    recoveredWarnings: warnings,
    recoveryPolicy: failOnRecovered ? "strict" : `up_to_${maxRecoveredWarnings}_advisory`
  }, null, 2));
  if (findings.length > 0 || recoveryBlocked) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Public launch validation failed");
  process.exitCode = 1;
});
