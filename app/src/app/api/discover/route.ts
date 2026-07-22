import {
  atlasAssistantQuota,
  runAtlasAssistant,
  ATLAS_ASSISTANT_MODEL,
  type AtlasAssistantFailureClass
} from "@/lib/atlas/assistant";
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
}

async function assistantUsage(requestHash: string) {
  if (!hasSupabaseAdminEnv()) return null;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await createAdminClient()
    .from("pilot_searches")
    .select("id", { count: "exact", head: true })
    .eq("request_hash", requestHash)
    .gte("created_at", since);
  if (error) return null;
  return count ?? 0;
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

  await supabase.from("pilot_searches").delete().lte("expires_at", now.toISOString());
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
      gapCount: input.answer?.gaps.length ?? 0
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
  const parsed = betaDiscoveryRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return privateJson(
      { error: "Enter an English discovery question between 1 and 500 characters." },
      { status: 400 }
    );
  }

  const [snapshot, user] = await Promise.all([
    getAtlasSnapshot(),
    getAtlasUser().catch(() => null)
  ]);
  const fallback = discoverAtlasSnapshot(snapshot, parsed.data.query);
  const requestHash = assistantSubjectFingerprint(request, user?.id);
  const used = await assistantUsage(requestHash);
  const currentQuota = used === null ? null : atlasAssistantQuota(Boolean(user), used);

  if (currentQuota?.remaining === 0) {
    return privateJson({
      ...fallback,
      searchId: null,
      assistant: null,
      quota: currentQuota,
      fallbackReason: "quota" satisfies AtlasAssistantFallbackReason
    });
  }

  const assistantAvailable = hasOpenAiEnv() && (
    process.env.NODE_ENV !== "production" ||
    (hasSupabaseAdminEnv() && used !== null)
  );
  const run = assistantAvailable
    ? await runAtlasAssistant({
        snapshot,
        query: parsed.data.query,
        priorTurns: parsed.data.priorTurns,
        safetyIdentifier: requestHash
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
          failureClass: hasOpenAiEnv() ? "dependency_unavailable" as const : "missing_key" as const,
          errorCode: null
        }
      };

  const discovery = run.answer
    ? assistantDiscovery(snapshot, parsed.data.query, run.answer)
    : fallback;
  const searchId = await recordSearch({
    requestHash,
    parsed: parsed.data,
    discovery,
    answer: run.answer,
    fallbackReason: run.fallbackReason,
    metrics: run.metrics
  });

  return privateJson({
    ...discovery,
    searchId,
    assistant: run.answer,
    organizations: run.answer ? discovery.organizations : undefined,
    quota: used === null ? undefined : atlasAssistantQuota(Boolean(user), used + 1),
    fallbackReason: run.fallbackReason
  });
}
