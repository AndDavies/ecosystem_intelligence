import { runEnrichment, type EnrichmentOutput } from "@/lib/ai/enrichment";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasOpenAiEnv } from "@/lib/supabase/env";
import type { SuggestedActionType } from "@/types/domain";

type MappingRecord = {
  id: string;
  capability_id: string;
  use_case_id: string;
  why_it_matters: string;
  suggested_action_type: SuggestedActionType;
};

type CapabilityRecord = {
  id: string;
  name: string;
  company_id: string;
};

type UseCaseRecord = {
  id: string;
  name: string;
};

type CitationRecord = {
  entity_id: string;
  evidence_snippet_id: string;
};

type EvidenceSnippetRecord = {
  id: string;
  excerpt: string;
};

export function buildEnrichmentSuggestionPayload(
  mapping: Pick<MappingRecord, "why_it_matters" | "suggested_action_type">,
  result: EnrichmentOutput
) {
  const beforeValue: Record<string, unknown> = {};
  const afterValue: Record<string, unknown> = {};

  if (result.whyItMatters.trim() && result.whyItMatters !== mapping.why_it_matters) {
    beforeValue.why_it_matters = mapping.why_it_matters;
    afterValue.why_it_matters = result.whyItMatters;
  }

  if (
    result.suggestedActionType &&
    result.suggestedActionType !== mapping.suggested_action_type
  ) {
    beforeValue.suggested_action_type = mapping.suggested_action_type;
    afterValue.suggested_action_type = result.suggestedActionType;
  }

  if (!Object.keys(afterValue).length) {
    return null;
  }

  return {
    changedFields: Object.keys(afterValue),
    beforeValue,
    afterValue
  };
}

async function processUseCaseRun(run: {
  id: string;
  entity_id: string;
  prompt_version: string;
}) {
  const supabase = createAdminClient();
  const [{ data: useCase }, { data: mappings }, { data: pendingRequests }] = await Promise.all([
    supabase.from("use_cases").select("id, name").eq("id", run.entity_id).single<UseCaseRecord>(),
    supabase
      .from("capability_use_cases")
      .select("id, capability_id, use_case_id, why_it_matters, suggested_action_type, ranking_score")
      .eq("use_case_id", run.entity_id)
      .order("ranking_score", { ascending: false })
      .limit(3),
    supabase
      .from("change_requests")
      .select("entity_id")
      .eq("entity_type", "capability_use_case")
      .eq("status", "pending")
  ]);

  if (!useCase) {
    throw new Error("Queued use case no longer exists.");
  }

  const mappingRows = (mappings ?? []) as Array<MappingRecord & { ranking_score: number }>;
  if (!mappingRows.length) {
    return {
      summary: `No candidate mappings were found for ${useCase.name}.`,
      createdRequests: 0
    };
  }

  const pendingIds = new Set((pendingRequests ?? []).map((request) => String(request.entity_id)));
  const actionableMappings = mappingRows.filter((mapping) => !pendingIds.has(mapping.id));

  if (!actionableMappings.length) {
    return {
      summary: `Skipped ${useCase.name} because the top mappings already have pending review requests.`,
      createdRequests: 0
    };
  }

  const capabilityIds = actionableMappings.map((mapping) => mapping.capability_id);
  const mappingIds = actionableMappings.map((mapping) => mapping.id);
  const [{ data: capabilities }, { data: citations }, { data: snippets }] = await Promise.all([
    supabase.from("capabilities").select("id, name, company_id").in("id", capabilityIds),
    supabase
      .from("field_citations")
      .select("entity_id, evidence_snippet_id, field_name, entity_type")
      .in("entity_id", [...mappingIds, ...capabilityIds]),
    supabase.from("evidence_snippets").select("id, excerpt")
  ]);

  const capabilityById = new Map((capabilities ?? []).map((capability) => [capability.id, capability as CapabilityRecord]));
  const snippetById = new Map((snippets ?? []).map((snippet) => [snippet.id, snippet as EvidenceSnippetRecord]));
  const citationRows = (citations ?? []) as Array<CitationRecord & { field_name: string; entity_type: string }>;

  let createdRequests = 0;

  for (const mapping of actionableMappings) {
    const capability = capabilityById.get(mapping.capability_id);

    if (!capability) {
      continue;
    }

    const evidence = citationRows
      .filter((citation) =>
        (citation.entity_type === "capability_use_case" && citation.entity_id === mapping.id) ||
        (citation.entity_type === "capability" && citation.entity_id === capability.id)
      )
      .map((citation) => snippetById.get(citation.evidence_snippet_id)?.excerpt ?? null)
      .filter((value): value is string => Boolean(value))
      .slice(0, 6);

    if (!evidence.length) {
      continue;
    }

    const result = await runEnrichment({
      entityType: "capability_use_case",
      entityId: mapping.id,
      title: `${capability.name} for ${useCase.name}`,
      evidence
    });

    const suggestion = buildEnrichmentSuggestionPayload(mapping, result);

    if (!suggestion) {
      continue;
    }

    await supabase.from("change_requests").insert({
      entity_type: "capability_use_case",
      entity_id: mapping.id,
      changed_fields: suggestion.changedFields,
      before_value: suggestion.beforeValue,
      after_value: suggestion.afterValue,
      requester_name: "AI Enrichment Worker",
      requester_email: "system@ecosystem-intelligence.local",
      status: "pending"
    });

    createdRequests += 1;
  }

  return {
    summary: createdRequests
      ? `Created ${createdRequests} reviewable AI suggestion${createdRequests === 1 ? "" : "s"} for ${useCase.name}.${!hasOpenAiEnv() ? " Placeholder enrichment was used because OPENAI_API_KEY is not configured." : ""}`
      : `No reviewable AI suggestions were created for ${useCase.name}.`,
    createdRequests
  };
}

export async function processQueuedEnrichmentRuns(limit = 5) {
  const supabase = createAdminClient();
  const { data: runs } = await supabase
    .from("ai_runs")
    .select("*")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(limit);

  const queuedRuns = runs ?? [];
  let processed = 0;

  for (const run of queuedRuns) {
    await supabase
      .from("ai_runs")
      .update({
        status: "running",
        result_summary: "Processing queued enrichment run."
      })
      .eq("id", run.id);

    try {
      let result: { summary: string };

      if (run.entity_type === "use_case") {
        result = await processUseCaseRun(run);
      } else {
        result = {
          summary: `No worker handler is configured for ${run.entity_type} yet.`
        };
      }

      await supabase
        .from("ai_runs")
        .update({
          status: "completed",
          result_summary: result.summary
        })
        .eq("id", run.id);

      processed += 1;
    } catch (error) {
      await supabase
        .from("ai_runs")
        .update({
          status: "failed",
          result_summary: error instanceof Error ? error.message : "Unknown enrichment worker failure."
        })
        .eq("id", run.id);
    }
  }

  return {
    processed,
    queued: queuedRuns.length
  };
}
