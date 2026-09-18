import {
  atlasAssistantQuota,
  runAtlasAssistant,
  ATLAS_ASSISTANT_MODEL,
  type AtlasAssistantFailureClass
} from "@/lib/atlas/assistant";
import { isAtlasAdminOwner } from "@/lib/atlas/admin-owner";
import type { JevMetrics } from "@/lib/atlas/assistant-jev";
import { getAtlasUser } from "@/lib/atlas/auth";
import { discoverAtlasSnapshot, getAtlasSnapshot } from "@/lib/atlas/repository";
import {
  assistantSubjectFingerprint,
  normalizeBetaSearchQuery,
  privateJson
} from "@/lib/product-insights/server";
import { betaDiscoveryRequestSchema } from "@/lib/product-insights/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasOpenAiEnv, hasSupabaseAdminEnv } from "@/lib/supabase/env";
import type {
  AtlasAssistantAnswer,
  AtlasAssistantFallbackReason,
  AtlasCitation,
  AtlasDiscoveryResult,
  AtlasOrganization,
  AtlasSnapshot
} from "@/types/atlas";

export const dynamic = "force-dynamic";
// Owner baselines may scan the complete catalogue; Vercel still imposes a host ceiling.
export const maxDuration = 300;

type ParsedDiscoveryInput = ReturnType<typeof betaDiscoveryRequestSchema.parse>;

interface SearchMetrics {
  model: string;
  latencyMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  cachedInputTokens: number | null;
  candidateCount: number;
  failureClass: AtlasAssistantFailureClass | null;
  errorCode: string | null;
  selection?: JevMetrics;
}

async function reserveAssistantRequest(requestHash: string, signedIn: boolean) {
  if (!hasSupabaseAdminEnv()) return null;
  try {
    const { data, error } = await createAdminClient().rpc("reserve_assistant_request", {
      p_subject_hash: requestHash,
      p_limit: atlasAssistantQuota(signedIn, 0).limit
    });
    const reservation = data?.[0];
    if (error || typeof reservation?.allowed !== "boolean" || !Number.isInteger(reservation.used) || reservation.used < 0) return null;
    return reservation as { allowed: boolean; used: number };
  } catch {
    return null;
  }
}

async function recordSearch(input: {
  requestHash: string;
  parsed: ParsedDiscoveryInput;
  discovery: AtlasDiscoveryResult;
  answer: AtlasAssistantAnswer | null;
  fallbackReason?: AtlasAssistantFallbackReason;
  metrics: SearchMetrics;
}) {
  if (!hasSupabaseAdminEnv()) return null;

  const supabase = createAdminClient();
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();

  const { count } = await supabase
    .from("pilot_searches")
    .select("id", { count: "exact", head: true })
    .eq("request_hash", input.requestHash)
    .gte("created_at", oneMinuteAgo);
  if ((count ?? 0) >= 30) return null;

  const resolvedFilters = {
    ...input.discovery.filters,
    __assistant: {
      mode: "assistant",
      model: input.metrics.model,
      outcome: input.answer?.outcome ?? null,
      fallbackReason: input.fallbackReason ?? null,
      latencyMs: input.metrics.latencyMs,
      inputTokens: input.metrics.inputTokens,
      outputTokens: input.metrics.outputTokens,
      cachedInputTokens: input.metrics.cachedInputTokens,
      candidateCount: input.metrics.candidateCount,
      failureClass: input.metrics.failureClass,
      errorCode: input.metrics.errorCode,
      gapCount: input.answer?.gaps.length ?? 0,
      selection: input.metrics.selection ?? null
    }
  };

  const { data, error } = await supabase
    .from("pilot_searches")
    .insert({
      request_hash: input.requestHash,
      session_id: input.parsed.sessionId,
      query_text: input.parsed.query,
      normalized_query: normalizeBetaSearchQuery(input.parsed.query),
      interpretation: input.discovery.interpretation,
      resolved_filters: resolvedFilters,
      result_count: input.discovery.organizationIds.length,
      zero_result: input.discovery.organizationIds.length === 0,
      context_path: input.parsed.contextPath,
      cohort: input.parsed.cohort,
      expires_at: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()
    })
    .select("id")
    .single();

  return error ? null : data.id;
}

function citationsForOrganization(organization: AtlasOrganization) {
  return [
    ...organization.citations,
    ...organization.capabilities.flatMap((capability) => [
      ...capability.citations,
      ...capability.missionMatches.flatMap((match) => match.citations),
      ...capability.demandMatches.flatMap((match) => match.citations)
    ])
  ];
}

function assistantDiscovery(
  snapshot: AtlasSnapshot,
  query: string,
  answer: AtlasAssistantAnswer
): Omit<AtlasDiscoveryResult, "searchId" | "quota"> {
  const organizationById = new Map(snapshot.organizations.map((organization) => [organization.id, organization]));
  const organizations = answer.matches
    .map((match) => organizationById.get(match.organizationId))
    .filter((organization): organization is AtlasOrganization => Boolean(organization));
  const citationIds = new Set(answer.matches.flatMap((match) => match.supportPoints.flatMap((point) => point.citationIds)));
  const citations = organizations
    .flatMap(citationsForOrganization)
    .filter((citation) => citationIds.has(citation.id));
  const evidenceLinks = Array.from(new Map<string, AtlasCitation>(citations.map((citation) => [citation.sourceUrl, citation])).values())
    .map((citation) => ({ title: citation.sourceTitle, url: citation.sourceUrl, publisher: citation.publisher }));

  return {
    query,
    interpretation: answer.outcome === "coverage_gap" ? "no_match" : "matched",
    filters: { query },
    filterChips: [{ key: "query", label: "Ask True North", value: answer.interpretedNeed }],
    organizationIds: organizations.map((organization) => organization.id),
    capabilityIds: answer.matches.flatMap((match) => match.capabilityId ? [match.capabilityId] : []),
    evidenceLinks,
    summary: answer.summary,
    suggestions: answer.followUpSuggestions,
    assistant: answer,
    organizations
  };
}

export async function POST(request: Request) {
  const requestStartedAt = performance.now();
  const stages: Record<string, number> = {};
  async function timed<T>(name: string, work: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try { return await work(); }
    finally { stages[name] = Math.round(performance.now() - start); }
  }
  const parsed = betaDiscoveryRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return privateJson(
      { error: "Enter an English discovery question between 1 and 500 characters." },
      { status: 400 }
    );
  }

  const [snapshot, user] = await Promise.all([
    timed("snapshotMs", () => getAtlasSnapshot()),
    timed("authMs", () => getAtlasUser().catch(() => null))
  ]);
  const fallbackStartedAt = performance.now();
  const fallback = discoverAtlasSnapshot(snapshot, parsed.data.query);
  stages.deterministicSearchMs = Math.round(performance.now() - fallbackStartedAt);
  const requestHash = assistantSubjectFingerprint(request, user?.id);
  const reservation = hasOpenAiEnv() ? await timed("quotaMs", () => reserveAssistantRequest(requestHash, Boolean(user))) : null;
  const currentQuota = reservation === null ? null : atlasAssistantQuota(Boolean(user), reservation.used);

  if (reservation && !reservation.allowed) {
    return privateJson({
      ...fallback,
      searchId: null,
      assistant: null,
      quota: currentQuota,
      fallbackReason: "quota" satisfies AtlasAssistantFallbackReason
    });
  }

  const assistantAvailable = hasOpenAiEnv() && reservation?.allowed === true;
  const run = assistantAvailable
    ? await runAtlasAssistant({
        snapshot,
        query: parsed.data.query,
        priorTurns: parsed.data.priorTurns,
        safetyIdentifier: requestHash,
        isOwner: isAtlasAdminOwner(user)
      })
    : {
        answer: null,
        fallbackReason: "unavailable" as const,
        metrics: {
          model: ATLAS_ASSISTANT_MODEL,
          latencyMs: 0,
          inputTokens: null,
          outputTokens: null,
          cachedInputTokens: null,
          candidateCount: 0,
          failureClass: hasOpenAiEnv() ? "dependency_unavailable" as const : process.env.OPENAI_API_KEY?.trim() ? "missing_model" as const : "missing_key" as const,
          errorCode: null
        }
      };

  const discovery = run.answer
    ? assistantDiscovery(snapshot, parsed.data.query, run.answer)
    : fallback;
  const searchId = await timed("telemetryMs", () => recordSearch({
    requestHash,
    parsed: parsed.data,
    discovery,
    answer: run.answer,
    fallbackReason: run.fallbackReason,
    metrics: run.metrics
  })).catch(() => null);

  // Operational diagnostics only: never log the question, answer, account or source text.
  console.info(JSON.stringify({
    event: "ask_true_north_completed",
    stages,
    searchId,
    requestLatencyMs: Math.round(performance.now() - requestStartedAt),
    assistantLatencyMs: run.metrics.latencyMs,
    model: run.metrics.model,
    inputTokens: run.metrics.inputTokens,
    outputTokens: run.metrics.outputTokens,
    cachedInputTokens: run.metrics.cachedInputTokens,
    outcome: run.answer?.outcome ?? null,
    fallbackReason: run.fallbackReason ?? null,
    failureClass: run.metrics.failureClass,
    selection: "selection" in run.metrics ? run.metrics.selection : null,
    organizationIds: discovery.organizationIds,
    capabilityIds: discovery.capabilityIds
  }));

  return privateJson({
    ...discovery,
    searchId,
    assistant: run.answer,
    organizations: run.answer ? discovery.organizations : undefined,
    quota: currentQuota ?? undefined,
    fallbackReason: run.fallbackReason
  });
}
