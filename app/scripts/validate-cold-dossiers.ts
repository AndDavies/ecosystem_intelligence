import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import {
  dossierReleaseProbeHeader,
  dossierApiContractIssues,
  deriveDossierReleaseProbeSecret,
  percentile,
  selectDossierReleaseSamples,
  signDossierReleaseProbe,
  type DossierReleaseCandidate
} from "../src/lib/launch/dossier-release-gate";
import { buildLaunchTargets, inspectLaunchHtml, inspectNextStreamState } from "../src/lib/launch/release-gate";
import { loadScriptEnv } from "./load-env";

loadScriptEnv();

const baseUrl = (process.env.PUBLIC_LAUNCH_BASE_URL ?? "https://truenorthmap.ca").replace(/\/$/, "");
const canonicalBaseUrl = (process.env.PUBLIC_LAUNCH_CANONICAL_BASE_URL ?? "https://truenorthmap.ca").replace(/\/$/, "");
const minimum = Math.max(10, Number(process.env.PUBLIC_DOSSIER_COLD_READS ?? "10"));
const maxViewP95Ms = Math.max(1, Number(process.env.PUBLIC_DOSSIER_VIEW_P95_MS ?? "500"));
const maxApiP95Ms = Math.max(1, Number(process.env.PUBLIC_DOSSIER_API_P95_MS ?? "2500"));
const headers = { "User-Agent": "TrueNorthMap-Cold-Dossier-Gate/1.0", "Cache-Control": "no-cache" };

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for the cold dossier gate`);
  return value;
}

function localHead() {
  return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

async function readAll<T extends Record<string, unknown>>(
  load: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message?: string } | null }>,
  label: string
) {
  const rows: T[] = [];
  const pageSize = 500;
  for (let from = 0; ; from += pageSize) {
    const result = await load(from, from + pageSize - 1);
    if (result.error) throw new Error(`${label}: ${result.error.message ?? "query failed"}`);
    const page = result.data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

async function selectedCandidates() {
  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
    ?? requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const publicClient = createClient(supabaseUrl, publicKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const organizations = await readAll<{ id: string; slug: string; entity_kind: string; updated_at: string | null }>(
    (from, to) => admin.from("organizations")
      .select("id, slug, entity_kind, updated_at")
      .eq("publication_status", "published")
      .eq("editorial_profile_version", "organization_editorial_profile_v1")
      .order("id")
      .range(from, to),
    "activated published organizations"
  );
  const organizationIds = organizations.map((record) => record.id);
  const citationCounts = new Map<string, number>();
  const contentCounts = new Map<string, number>();
  for (let index = 0; index < organizationIds.length; index += 100) {
    const batch = organizationIds.slice(index, index + 100);
    const { data: dossiers, error: dossierError } = await admin
      .from("organization_dossiers")
      .select("id, locations, capabilities, capability_domains, mission_matches, demand_matches, programs, funding_events, relationships, media_assets")
      .in("id", batch);
    if (dossierError) throw new Error(`dossier sample inventory: ${dossierError.message}`);
    const ownersByTarget = new Map<string, Set<string>>();
    for (const dossier of dossiers ?? []) {
      const organizationId = String(dossier.id);
      for (const targetId of dossierTargetIds(dossier)) {
        const owners = ownersByTarget.get(targetId) ?? new Set<string>();
        owners.add(organizationId);
        ownersByTarget.set(targetId, owners);
      }
      const contentCount = [
        dossier.locations,
        dossier.capabilities,
        dossier.capability_domains,
        dossier.mission_matches,
        dossier.demand_matches,
        dossier.programs,
        dossier.funding_events,
        dossier.relationships,
        dossier.media_assets
      ]
        .reduce((total, value) => total + (Array.isArray(value) ? value.length : 0), 0);
      contentCounts.set(organizationId, contentCount);
    }
    const targetIds = [...ownersByTarget.keys()];
    for (let targetIndex = 0; targetIndex < targetIds.length; targetIndex += 100) {
      const targetBatch = targetIds.slice(targetIndex, targetIndex + 100);
      const { data: citations, error: citationError } = await publicClient
        .from("field_citations")
        .select("entity_id")
        .in("entity_id", targetBatch);
      if (citationError) throw new Error(`public citation sample inventory: ${citationError.message}`);
      for (const citation of citations ?? []) {
        for (const ownerId of ownersByTarget.get(String(citation.entity_id)) ?? []) {
          citationCounts.set(ownerId, (citationCounts.get(ownerId) ?? 0) + 1);
        }
      }
    }
  }
  const candidates: DossierReleaseCandidate[] = organizations.map((organization) => ({
    id: organization.id,
    slug: organization.slug,
    entityKind: organization.entity_kind,
    updatedAt: organization.updated_at,
    citationCount: citationCounts.get(organization.id) ?? 0,
    contentCount: contentCounts.get(organization.id) ?? 0
  }));
  return selectDossierReleaseSamples(candidates, minimum);
}

function objectRows(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => item !== null && typeof item === "object" && !Array.isArray(item))
    : [];
}

function dossierTargetIds(dossier: Record<string, unknown>) {
  const ids = new Set<string>([String(dossier.id)]);
  const add = (value: unknown) => {
    if (typeof value === "string" && value.length > 0) ids.add(value);
  };
  objectRows(dossier.capabilities).forEach((row) => add(row.id));
  objectRows(dossier.mission_matches).forEach((row) => add((row.match as Record<string, unknown> | undefined)?.id));
  objectRows(dossier.demand_matches).forEach((row) => add((row.match as Record<string, unknown> | undefined)?.id));
  objectRows(dossier.programs).forEach((row) => {
    add(row.id);
    add((row.program as Record<string, unknown> | undefined)?.id);
  });
  objectRows(dossier.funding_events).forEach((row) => add(row.id));
  objectRows(dossier.relationships).forEach((row) => add(row.id));
  objectRows(dossier.media_assets).forEach((row) => add(row.id));
  return [...ids];
}

async function timedFetch(url: string, init?: RequestInit) {
  const startedAt = performance.now();
  const response = await fetch(url, { ...init, redirect: "manual", signal: AbortSignal.timeout(10_000) });
  const body = await response.text();
  const requestedOrigin = new URL(url).origin;
  if (response.status >= 300 && response.status < 400) {
    throw new Error(`Cold dossier gate refused redirect from ${url}`);
  }
  if (response.url && new URL(response.url).origin !== requestedOrigin) {
    throw new Error(`Cold dossier gate response escaped ${requestedOrigin}`);
  }
  return { response, body, durationMs: Math.round(performance.now() - startedAt) };
}

async function main() {
  const expectedDeployment = process.env.PUBLIC_LAUNCH_EXPECTED_DEPLOYMENT ?? localHead();
  const contractResult = await timedFetch(`${baseUrl}/api/system/research-contract`, { headers });
  if (!contractResult.response.ok) throw new Error(`Research contract returned ${contractResult.response.status}`);
  const contract = JSON.parse(contractResult.body) as { deployment?: unknown };
  if (contract.deployment !== expectedDeployment) {
    throw new Error(`Deployment mismatch: expected ${expectedDeployment}, received ${String(contract.deployment ?? "missing")}`);
  }

  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const probeSecret = process.env.DOSSIER_RELEASE_PROBE_SECRET?.trim()
    || deriveDossierReleaseProbeSecret(serviceRoleKey);
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
    ?? requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const samples = await selectedCandidates();
  const results = [];
  const findings: Array<{ slug: string; issue: string }> = [];
  for (const sample of samples) {
    const probeHeaders = {
      ...headers,
      [dossierReleaseProbeHeader]: signDossierReleaseProbe(expectedDeployment, sample.slug, probeSecret)
    };
    const viewUrl = new URL("/rest/v1/organization_dossiers", supabaseUrl);
    viewUrl.searchParams.set(
      "select",
      "id,slug,editorial_profile_version,locations,capabilities,capability_domains,mission_matches,demand_matches,programs,funding_events,relationships,media_assets"
    );
    viewUrl.searchParams.set("id", `eq.${sample.id}`);
    const view = await timedFetch(viewUrl.toString(), {
      headers: { apikey: publicKey, Authorization: `Bearer ${publicKey}`, ...headers }
    });
    if (!view.response.ok) findings.push({ slug: sample.slug, issue: `Anonymous dossier view returned ${view.response.status}` });
    let viewPayload: unknown = null;
    try { viewPayload = JSON.parse(view.body); } catch { findings.push({ slug: sample.slug, issue: "Anonymous dossier view returned invalid JSON" }); }
    if (!Array.isArray(viewPayload) || viewPayload.length !== 1) findings.push({ slug: sample.slug, issue: "Anonymous dossier view did not return exactly one admitted row" });

    const api = await timedFetch(`${baseUrl}/api/organizations/${sample.slug}?cold_dossier_gate=${expectedDeployment}`, {
      headers: probeHeaders
    });
    if (!api.response.ok) findings.push({ slug: sample.slug, issue: `Organization API returned ${api.response.status}` });
    let apiPayload: unknown = null;
    try { apiPayload = JSON.parse(api.body); } catch { findings.push({ slug: sample.slug, issue: "Organization API returned invalid JSON" }); }
    dossierApiContractIssues(apiPayload, sample).forEach((issue) => findings.push({ slug: sample.slug, issue }));

    let pageMs: number | null = null;
    if (sample.selectionLane !== "coverage_fill") {
      const path = `/organizations/${sample.slug}`;
      const page = await timedFetch(`${baseUrl}${path}?cold_dossier_gate=${expectedDeployment}`, {
        headers: probeHeaders
      });
      pageMs = page.durationMs;
      if (!page.response.ok) findings.push({ slug: sample.slug, issue: `Organization page returned ${page.response.status}` });
      const [target] = buildLaunchTargets([path], baseUrl, canonicalBaseUrl);
      inspectNextStreamState(page.body, page.response.url || target.fetchUrl).forEach((finding) => findings.push({ slug: sample.slug, issue: finding.issue }));
      inspectLaunchHtml(page.body, target).forEach((finding) => findings.push({ slug: sample.slug, issue: finding.issue }));
      if (!page.body.includes('data-public-dossier="true"')) findings.push({ slug: sample.slug, issue: "Organization page omitted the public dossier marker" });
    }
    results.push({
      slug: sample.slug,
      selectionLane: sample.selectionLane,
      citationCount: sample.citationCount,
      contentCount: sample.contentCount,
      viewMs: view.durationMs,
      apiMs: api.durationMs,
      pageMs
    });
  }

  const viewP95Ms = percentile(results.map((result) => result.viewMs), 0.95);
  const apiP95Ms = percentile(results.map((result) => result.apiMs), 0.95);
  if (viewP95Ms >= maxViewP95Ms) findings.push({ slug: "sample", issue: `Anonymous dossier view p95 ${viewP95Ms} ms exceeded ${maxViewP95Ms} ms` });
  if (apiP95Ms >= maxApiP95Ms) findings.push({ slug: "sample", issue: `Organization API p95 ${apiP95Ms} ms exceeded ${maxApiP95Ms} ms` });
  console.log(JSON.stringify({
    status: findings.length ? "fail" : "pass",
    deployment: expectedDeployment,
    sampleSize: samples.length,
    thresholds: { viewP95Ms: maxViewP95Ms, apiP95Ms: maxApiP95Ms },
    observed: { viewP95Ms, apiP95Ms },
    findings,
    results
  }, null, 2));
  if (findings.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Cold dossier validation failed");
  process.exitCode = 1;
});
