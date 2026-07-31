export type LaunchFinding = { url: string; issue: string };

type LaunchFetchOptions = {
  fetcher?: typeof fetch;
  retryDelayMs?: number;
  timeoutMs?: number;
};

export async function fetchLaunchResource(url: string, options: LaunchFetchOptions = {}) {
  const fetcher = options.fetcher ?? fetch;
  const retryDelayMs = options.retryDelayMs ?? 150;
  const timeoutMs = options.timeoutMs ?? 30_000;
  const startedAt = Date.now();
  const warnings: LaunchFinding[] = [];

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetcher(url, { redirect: "follow", signal: AbortSignal.timeout(timeoutMs) });
      const body = await response.text();
      if (response.status >= 500 && attempt === 1) {
        warnings.push({ url, issue: `Recovered after initial HTTP ${response.status}` });
        if (retryDelayMs) await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        continue;
      }
      return {
        response,
        body,
        warnings,
        attempts: attempt,
        recoveredRetry: warnings.length > 0,
        durationMs: Date.now() - startedAt,
        responseBytes: Buffer.byteLength(body)
      };
    } catch (error) {
      if (attempt === 2) throw error;
      warnings.push({
        url,
        issue: `Recovered after initial request failure: ${error instanceof Error ? error.message : "unknown error"}`
      });
      if (retryDelayMs) await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
  throw new Error("Launch request retry loop ended unexpectedly");
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function assessAtlasOperationalPayloads(
  healthPayload: unknown,
  summaryPayload: unknown,
  atlasPayload: unknown,
  urls: { health: string; summary: string; atlas: string }
) {
  const findings: LaunchFinding[] = [];
  const health = record(healthPayload);
  const healthChecks = record(health.checks);
  const summary = record(summaryPayload);
  const atlas = record(atlasPayload);
  const total = finiteNumber(atlas.total);
  const mapCount = Array.isArray(atlas.mapOrganizations) ? atlas.mapOrganizations.length : null;
  const detailCount = Array.isArray(atlas.organizations) ? atlas.organizations.length : null;
  const summaryOrganizations = finiteNumber(summary.organizations);

  if (health.status !== "ok" || healthChecks.catalogueConsistent !== true) {
    findings.push({ url: urls.health, issue: "Health endpoint did not confirm a consistent public catalogue" });
  }
  if (summaryOrganizations === null || total === null || mapCount === null || detailCount === null) {
    findings.push({ url: urls.atlas, issue: "Atlas operational payload is incomplete" });
  } else {
    if (summaryOrganizations !== total || total !== mapCount) {
      findings.push({ url: urls.atlas, issue: "Published organization totals do not match the complete map projection" });
    }
    if (detailCount > 18) {
      findings.push({ url: urls.atlas, issue: `Initial rich result page exceeded 18 records (${detailCount})` });
    }
  }
  return findings;
}
