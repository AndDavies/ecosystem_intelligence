export type LaunchFinding = { url: string; issue: string };

type LaunchFetchOptions = {
  fetcher?: typeof fetch;
  retryDelayMs?: number;
  timeoutMs?: number;
  headers?: HeadersInit;
  expectedOrigin?: string;
};

export async function fetchLaunchResource(url: string, options: LaunchFetchOptions = {}) {
  const fetcher = options.fetcher ?? fetch;
  const retryDelayMs = options.retryDelayMs ?? 150;
  const timeoutMs = options.timeoutMs ?? 30_000;
  const startedAt = Date.now();
  let retryReason: string | undefined;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetcher(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(timeoutMs),
        headers: options.headers
      });
      if (options.expectedOrigin && response.url) {
        const finalOrigin = new URL(response.url).origin;
        if (finalOrigin !== new URL(options.expectedOrigin).origin) {
          throw new Error(`Launch request escaped expected origin ${options.expectedOrigin}: ${response.url}`);
        }
      }
      const body = await response.text();
      if (response.status >= 500 && attempt === 1) {
        retryReason = `initial HTTP ${response.status}`;
        if (retryDelayMs) await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        continue;
      }
      const warnings = retryReason && response.status < 500
        ? [{ url, issue: `Recovered after ${retryReason}` }]
        : [];
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
      if (error instanceof Error && error.message.startsWith("Launch request escaped expected origin")) throw error;
      if (attempt === 2) {
        const finalMessage = error instanceof Error ? error.message : "unknown error";
        throw new Error(`${retryReason ?? "initial request failure"}; retry failed: ${finalMessage}`);
      }
      retryReason = `initial request failure: ${error instanceof Error ? error.message : "unknown error"}`;
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
