import { describe, expect, it } from "vitest";
import {
  currentResearchPipelineVersion,
  organizationBundleV3Schema,
  organizationRefreshBundleV2Schema,
  researchRecordSpecificityIssues,
  requiresExecutiveRelevanceContract
} from "@/lib/research/pipeline-schema";
import {
  buildMinimalOrganizationRefreshV2Candidate,
  buildMinimalOrganizationV3Candidate
} from "./fixtures/organization-dossier-candidates";
import { buildStagingCandidateChange } from "@/lib/research/staging-integrity";

const summary = "This organization demonstrates a supported Canadian sensing-integration role that may help a decision team compare public programme fit and identify the next technical-verification conversation.";

describe("pipeline 1.7.3 executive relevance contract", () => {
  it("bumps only new research runs to the additive contract", () => {
    expect(currentResearchPipelineVersion).toBe("tnm-research-pipeline/1.7.3");
    expect(requiresExecutiveRelevanceContract("tnm-research-pipeline/1.7.2")).toBe(false);
    expect(requiresExecutiveRelevanceContract("tnm-research-pipeline/1.7.3")).toBe(true);
  });

  it("accepts an omitted or null new-record synthesis without forcing speculative copy", () => {
    const omitted = buildMinimalOrganizationV3Candidate();
    expect(organizationBundleV3Schema.safeParse(omitted).success).toBe(true);

    const explicitNull = structuredClone(omitted);
    Object.assign(explicitNull.organization, { executiveRelevanceSummary: null });
    expect(organizationBundleV3Schema.safeParse(explicitNull).success).toBe(true);
  });

  it("requires derived, source-grounded field evidence for a proposed new-record synthesis", () => {
    const candidate = buildMinimalOrganizationV3Candidate();
    Object.assign(candidate.organization, { executiveRelevanceSummary: summary });
    expect(organizationBundleV3Schema.safeParse(candidate).success).toBe(false);

    candidate.fieldEvidence.push({
      id: "executive-relevance-evidence",
      sourceId: candidate.sources[0].id,
      fieldPath: "organization.executiveRelevanceSummary",
      claimClass: "derived",
      excerpt: "The official fixture source documents the sensing role and public programme participation synthesized in the decision snapshot.",
      confidence: "high"
    });
    expect(organizationBundleV3Schema.safeParse(candidate).success).toBe(true);
  });

  it("requires the refresh preview to equal an evidence-backed reviewed operation", () => {
    const candidate = buildMinimalOrganizationRefreshV2Candidate({
      organizationId: "00000000-0000-4000-a000-000000000010",
      baselineUpdatedAt: "2026-08-09T13:00:00.000Z"
    }) as unknown as Record<string, unknown> & {
      fieldEvidence: Array<Record<string, unknown>>;
      operations: Array<Record<string, unknown>>;
      sources: Array<{ id: string }>;
      targetMatch: { entityId: string };
      executiveRelevanceSummary?: string | null;
    };
    const evidence = {
      id: "executive-relevance-evidence",
      sourceId: candidate.sources[0].id,
      fieldPath: "executiveRelevanceSummary",
      claimClass: "derived" as const,
      excerpt: "The official fixture source documents the sensing role and public programme participation synthesized in the decision snapshot.",
      confidence: "high" as const
    };
    candidate.fieldEvidence.push(evidence);
    candidate.operations.push({
      operationId: "set-executive-relevance-summary",
      operation: "set_field",
      entityType: "organization",
      targetId: candidate.targetMatch.entityId,
      field: "executive_relevance_summary",
      before: null,
      after: summary,
      evidenceIds: [evidence.id],
      leafEvidence: [{ fieldPath: "after", evidenceIds: [evidence.id] }],
      reviewerExplanation: "Add the source-grounded TNM assessment describing the supported Canadian sensing role and next technical-verification conversation."
    });
    Object.assign(candidate, { executiveRelevanceSummary: summary });
    const unrelatedEvidence = structuredClone(candidate);
    unrelatedEvidence.fieldEvidence[unrelatedEvidence.fieldEvidence.length - 1].fieldPath = "reviewedQuestions.0.question";
    expect(organizationRefreshBundleV2Schema.safeParse(unrelatedEvidence).success).toBe(false);

    const parsed = organizationRefreshBundleV2Schema.parse(candidate);
    const staged = buildStagingCandidateChange("executive-relevance-parity-run", parsed);
    const stagedRecord = organizationRefreshBundleV2Schema.parse(staged.proposed_record);
    expect(stagedRecord.executiveRelevanceSummary).toBe(summary);
    expect(stagedRecord.operations).toContainEqual(expect.objectContaining({
      field: "executive_relevance_summary",
      after: summary
    }));
    expect(staged.field_evidence).toContainEqual(expect.objectContaining({ id: evidence.id }));

    candidate.executiveRelevanceSummary = `${summary} Additional unsupported conclusion.`;
    expect(organizationRefreshBundleV2Schema.safeParse(candidate).success).toBe(false);
  });

  it("requires new 1.7.3 runs to record a supported summary or an explicit null disposition", () => {
    const candidate = buildMinimalOrganizationV3Candidate();
    const artifacts = {
      run: { agentVersion: "tnm-research-pipeline/1.7.3", mode: "deep_dossier" },
      plan: { targetSubjects: [] },
      prospects: null,
      signals: null,
      leads: { leads: [] },
      ledger: { claims: [], subjects: [] },
      batch: { candidates: [candidate], deferred: [] }
    } as unknown as Parameters<typeof researchRecordSpecificityIssues>[0];
    expect(researchRecordSpecificityIssues(artifacts)).toContain(
      `Candidate ${candidate.candidateId} must explicitly provide a supported executiveRelevanceSummary assessment or null after coverage validation.`
    );

    Object.assign(candidate.organization, { executiveRelevanceSummary: null });
    expect(researchRecordSpecificityIssues(artifacts)).not.toContain(
      `Candidate ${candidate.candidateId} must explicitly provide a supported executiveRelevanceSummary assessment or null after coverage validation.`
    );
  });
});
