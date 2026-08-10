import { isDeepStrictEqual } from "node:util";
import { researchRunCompletionIssues, type ResearchCandidateBatchV2, type ResearchRun } from "./pipeline-schema";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function buildStagingResearchRun(run: ResearchRun) {
  return {
    client_run_id: run.runId,
    run_type: run.trigger === "weekly" ? "weekly_gap" : run.trigger === "weekday" ? "targeted" : "manual",
    scope: run.scope,
    selected_gap: run.selectedGap,
    status: "completed",
    started_at: run.startedAt,
    completed_at: run.completedAt,
    agent_version: run.agentVersion,
    source_queries: run.sourceQueries,
    counters: run.counters,
    validation_results: run.validation,
    stop_reason: run.stopReason
  };
}

export function buildStagingCandidateChange(runId: string, candidate: ResearchCandidateBatchV2["candidates"][number]) {
  const targetEntityType = candidate.candidateKind === "organization_bundle"
    ? "organization"
    : candidate.candidateKind === "demand_signal_bundle"
      ? "demand_source"
      : candidate.candidateKind === "organization_refresh_bundle"
        ? "organization"
        : candidate.candidateKind === "demand_refresh_bundle"
          ? "demand_source"
          : "program";
  const isRefresh = candidate.candidateKind === "organization_refresh_bundle" || candidate.candidateKind === "demand_refresh_bundle";
  return {
    client_candidate_id: candidate.candidateId,
    research_run_ref: runId,
    candidate_kind: candidate.candidateKind,
    schema_version: candidate.schemaVersion,
    source_lead_ids: candidate.sourceLeadIds,
    target_entity_type: targetEntityType,
    target_entity_id: isRefresh ? candidate.targetMatch.entityId : null,
    proposed_record: candidate,
    before_record: isRefresh ? candidate.beforeRecord : null,
    field_evidence: candidate.fieldEvidence,
    duplicate_check: candidate.duplicateCheck,
    reviewer_rationale: candidate.reviewerRationale,
    confidence: candidate.confidence,
    status: "pending"
  };
}

export function recordSpecificArtifactRequirements(run: Pick<ResearchRun, "mode" | "outputs">) {
  const organizationDossierMode = run.mode === "dossier_enrichment" || run.mode === "corpus_refresh";
  return {
    prospects: run.mode === "discovery_batch" || organizationDossierMode || Boolean(run.outputs.prospectInventory),
    signals: run.mode === "refresh_batch" || organizationDossierMode || Boolean(run.outputs.signalBatch)
  };
}

export function canonicalArtifactRunIssues(
  run: ResearchRun,
  artifacts: Array<{ label: string; runId: string; status?: string; requiredStatus?: string }>
) {
  const issues: string[] = [];
  if (run.status !== "completed") {
    issues.push(`Canonical research run ${run.runId} is '${run.status}', not completed.`);
  }
  issues.push(...researchRunCompletionIssues(run));
  for (const artifact of artifacts) {
    if (artifact.runId !== run.runId) {
      issues.push(`${artifact.label} belongs to run ${artifact.runId}, not canonical run ${run.runId}.`);
    }
    if (artifact.requiredStatus && artifact.status !== artifact.requiredStatus) {
      issues.push(`${artifact.label} is '${artifact.status ?? "missing"}', not ${artifact.requiredStatus}.`);
    }
  }
  return issues;
}

export function stagingPayloadParityIssues(options: {
  staging: Record<string, unknown>;
  run: ResearchRun;
  batch: ResearchCandidateBatchV2;
  requiredApplicationContract: string;
}) {
  const { staging, run, batch, requiredApplicationContract } = options;
  const issues: string[] = [];
  if (staging.schemaVersion !== "research_staging_export_v1") issues.push("Staging schema version is not research_staging_export_v1.");
  if (staging.requiredApplicationContract !== requiredApplicationContract) issues.push("Staging application contract does not match the importer.");
  if (staging.writePolicy !== "private_candidate_changes_only") issues.push("Staging write policy is not private_candidate_changes_only.");
  if (staging.publicationAllowed !== false) issues.push("Staging export must prohibit publication.");
  if (typeof staging.generatedAt !== "string" || Number.isNaN(Date.parse(staging.generatedAt))) issues.push("Staging generatedAt is not a valid timestamp.");
  if (run.status !== "completed") issues.push(`Canonical research run ${run.runId} is '${run.status}', not completed.`);
  issues.push(...researchRunCompletionIssues(run));
  if (!isDeepStrictEqual(asRecord(staging.researchRun), buildStagingResearchRun(run))) issues.push("Staged research run does not match the canonical run artifact.");

  const values = Array.isArray(staging.candidateChanges) ? staging.candidateChanges : [];
  const expected = new Map(batch.candidates.map((candidate) => [candidate.candidateId, buildStagingCandidateChange(run.runId, candidate)]));
  const seen = new Set<string>();
  if (expected.size !== batch.candidates.length) issues.push("Canonical candidate batch contains duplicate candidate IDs.");
  if (values.length !== expected.size) issues.push("Staging candidate count does not match the canonical candidate batch.");
  for (const value of values) {
    const row = asRecord(value);
    const candidateId = String(row.client_candidate_id ?? "");
    const stagedAt = typeof row.staged_at === "string" ? row.staged_at : "";
    const { staged_at: _stagedAt, ...payload } = row;
    if (!candidateId || seen.has(candidateId)) issues.push(`Staging candidate ID '${candidateId || "missing"}' is missing or duplicated.`);
    if (Number.isNaN(Date.parse(stagedAt))) issues.push(`Staging candidate ${candidateId || "missing"} has an invalid staged_at timestamp.`);
    if (stagedAt !== staging.generatedAt) issues.push(`Staging candidate ${candidateId || "missing"} staged_at does not match the export generatedAt timestamp.`);
    if (!isDeepStrictEqual(payload, expected.get(candidateId))) issues.push(`Staging candidate ${candidateId || "missing"} does not match its complete canonical candidate payload.`);
    seen.add(candidateId);
  }
  if (seen.size !== expected.size || [...expected.keys()].some((candidateId) => !seen.has(candidateId))) issues.push("Staging candidate IDs do not match the canonical candidate batch.");
  return issues;
}
