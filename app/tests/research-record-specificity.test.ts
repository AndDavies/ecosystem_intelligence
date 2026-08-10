import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  researchCandidateBatchV2Schema,
  researchClaimLedgerV1Schema,
  researchCollectionPlanV1Schema,
  researchProspectInventoryV1Schema,
  researchRecordSpecificityIssues,
  researchReviewLineageIssues,
  researchRunCompletionIssues,
  researchRunSchema,
  researchSignalBatchV1Schema,
  sourceLeadBatchV2Schema,
  type OrganizationRefreshBundleV2,
  type SourceLeadBatchV2
} from "@/lib/research/pipeline-schema";
import {
  buildStagingCandidateChange,
  buildStagingResearchRun,
  canonicalArtifactRunIssues,
  recordSpecificArtifactRequirements,
  stagingPayloadParityIssues
} from "@/lib/research/staging-integrity";

type RecordRefreshLead = Extract<SourceLeadBatchV2["leads"][number], { leadType: "record_refresh_lead" }>;

const runId = "tnm-dossier-pilot-20260809";

async function artifact(folder: string) {
  return JSON.parse(await readFile(path.resolve(`../research/ingestion/${folder}/${runId}.json`), "utf8")) as unknown;
}

async function pilotArtifacts() {
  return {
    run: researchRunSchema.parse(await artifact("runs")),
    plan: researchCollectionPlanV1Schema.parse(await artifact("collection-plans-v1")),
    prospects: researchProspectInventoryV1Schema.parse(await artifact("prospect-inventories-v1")),
    signals: researchSignalBatchV1Schema.parse(await artifact("signal-batches-v1")),
    leads: sourceLeadBatchV2Schema.parse(await artifact("source-leads-v2")),
    ledger: researchClaimLedgerV1Schema.parse(await artifact("claim-ledgers-v1")),
    batch: researchCandidateBatchV2Schema.parse(await artifact("candidate-batches-v2"))
  };
}

describe("pipeline 1.7 record-specific research gate", () => {
  it("applies the same complete-artifact gate during private review intake", async () => {
    const coordinator = await readFile(path.resolve("scripts/autonomous-research.ts"), "utf8");
    const importSlice = coordinator.slice(coordinator.indexOf("async function assertRecordSpecificStaging"), coordinator.indexOf("async function smoke"));
    expect(importSlice).toContain("researchRecordSpecificityIssues");
    expect(importSlice).toContain("researchReviewLineageIssues");
    expect(importSlice).toContain("stagingPayloadParityIssues");
    expect(importSlice).toContain("recordSpecificArtifactRequirements");
    expect(importSlice).toContain("requiresRecordSpecificResearchContract(run.data.agentVersion)");
    expect(importSlice).toContain("await assertRecordSpecificStaging(staging)");
    expect(importSlice).not.toContain("requiresRecordSpecificResearchContract(String(researchRun.agent_version");
    expect(coordinator).toContain('staging.writePolicy !== "private_candidate_changes_only"');
    expect(coordinator).toContain('plan.data.status !== "complete" || ledger.data.status !== "complete"');
  });

  it("rejects every mutable staging-envelope bypass before private intake", async () => {
    const { run, batch } = await pilotArtifacts();
    const generatedAt = "2026-08-10T08:14:18.000Z";
    const valid = {
      schemaVersion: "research_staging_export_v1",
      requiredApplicationContract: "tnm-review-publication-v3",
      generatedAt,
      writePolicy: "private_candidate_changes_only",
      publicationAllowed: false,
      researchRun: buildStagingResearchRun(run),
      candidateChanges: batch.candidates.map((candidate) => ({ ...buildStagingCandidateChange(run.runId, candidate), staged_at: generatedAt }))
    };
    const issues = (staging: Record<string, unknown>) => stagingPayloadParityIssues({ staging, run, batch, requiredApplicationContract: "tnm-review-publication-v3" });
    expect(issues(valid)).toEqual([]);

    const mutations: Array<(value: typeof valid) => void> = [
      (value) => { value.writePolicy = "direct_database_write"; },
      (value) => { value.researchRun.agent_version = "tnm-research-pipeline/1.6.0"; },
      (value) => { value.candidateChanges[0].before_record = null; },
      (value) => { value.candidateChanges[0].field_evidence = []; },
      (value) => { value.candidateChanges[0].reviewer_rationale = "Generic review text"; },
      (value) => { value.candidateChanges[0].confidence = "high"; },
      (value) => { value.candidateChanges[0].source_lead_ids = []; },
      (value) => { value.candidateChanges[0].status = "approved"; },
      (value) => { value.candidateChanges[0].staged_at = "2026-08-10T08:15:18.000Z"; }
    ];
    for (const mutate of mutations) {
      const changed = structuredClone(valid);
      mutate(changed);
      expect(issues(changed)).not.toEqual([]);
    }
  });

  it("requires a completed canonical run and exact same-run artifact IDs", async () => {
    const { run } = await pilotArtifacts();
    expect(canonicalArtifactRunIssues(run, [
      { label: "Collection plan", runId: run.runId },
      { label: "Source lead batch", runId: run.runId },
      { label: "Claim ledger", runId: run.runId, status: "complete", requiredStatus: "complete" }
    ])).toEqual([]);

    expect(canonicalArtifactRunIssues(
      { ...run, status: "running", completedAt: null },
      [{ label: "Collection plan", runId: "different-run", status: "active", requiredStatus: "complete" }]
    )).toEqual([
      `Canonical research run ${run.runId} is 'running', not completed.`,
      `Collection plan belongs to run different-run, not canonical run ${run.runId}.`,
      "Collection plan is 'active', not complete."
    ]);
  });

  it("rejects failed completion state and duplicate canonical candidate IDs", async () => {
    const { run, batch } = await pilotArtifacts();
    const failedRun = {
      ...run,
      validation: { passed: false, errors: ["collection failed"], warnings: [] },
      errors: ["collection failed"]
    };
    expect(researchRunCompletionIssues(failedRun)).toContain(`Run ${run.runId} cannot complete pipeline 1.7 with failed validation or recorded errors.`);

    const duplicateBatch = structuredClone(batch);
    duplicateBatch.candidates.push(structuredClone(duplicateBatch.candidates[0]));
    expect(researchCandidateBatchV2Schema.safeParse(duplicateBatch).success).toBe(false);
  });

  it("requires complete lifecycle artifacts and atomic source-backed ledger mapping", async () => {
    const artifacts = await pilotArtifacts();
    expect(researchReviewLineageIssues(artifacts)).toEqual([]);

    artifacts.plan.status = "active";
    artifacts.ledger.status = "collecting";
    const candidate = artifacts.batch.candidates[0];
    candidate.fieldEvidence.push({
      ...candidate.fieldEvidence[0],
      id: "evidence-unmapped-review-leaf",
      fieldPath: "operations.unmapped.after",
      excerpt: "This deliberately unmapped evidence leaf must not enter private Review."
    });
    expect(researchReviewLineageIssues(artifacts)).toContain(`Candidate ${candidate.candidateId} evidence evidence-unmapped-review-leaf must map to exactly one atomic claim-ledger leaf.`);
    expect(artifacts.plan.status).not.toBe("complete");
    expect(artifacts.ledger.status).not.toBe("complete");
  });

  it("enforces a one-to-one eligible claim for every source-backed evidence leaf", async () => {
    const duplicate = await pilotArtifacts();
    const duplicateCandidate = duplicate.batch.candidates[0];
    const firstEvidence = duplicateCandidate.fieldEvidence.find((evidence) => evidence.claimClass === "source_backed");
    if (!firstEvidence) throw new Error("Pilot source-backed evidence is missing.");
    duplicateCandidate.fieldEvidence.push({
      ...firstEvidence,
      id: "evidence-duplicate-contradictory-leaf",
      excerpt: "A contradictory excerpt cannot share the same candidate, source, and field path."
    });
    const duplicateIssues = researchReviewLineageIssues(duplicate);
    expect(duplicateIssues).toContain(`Candidate ${duplicateCandidate.candidateId} has duplicate source-backed evidence for ${firstEvidence.fieldPath} from ${firstEvidence.sourceId}.`);
    expect(duplicateIssues).toContain(`Candidate ${duplicateCandidate.candidateId} evidence evidence-duplicate-contradictory-leaf must map to exactly one atomic claim-ledger leaf.`);

    const ineligible = await pilotArtifacts();
    const ineligibleCandidate = ineligible.batch.candidates[0];
    const ineligibleEvidence = ineligibleCandidate.fieldEvidence.find((evidence) => evidence.claimClass === "source_backed");
    const ineligibleClaim = ineligible.ledger.claims.find((claim) =>
      claim.source.sourceId === ineligibleEvidence?.sourceId
      && claim.candidateTargets.some((target) => target.candidateId === ineligibleCandidate.candidateId && target.fieldPath === ineligibleEvidence?.fieldPath)
    );
    if (!ineligibleEvidence || !ineligibleClaim) throw new Error("Pilot claim mapping is missing.");
    ineligibleClaim.status = "discovery_only";
    ineligibleClaim.source.sourcePosture = "discovery_only";
    ineligibleClaim.disposition = "review_warning";
    expect(researchReviewLineageIssues(ineligible)).toContain(`Candidate ${ineligibleCandidate.candidateId} evidence ${ineligibleEvidence.id} must map to exactly one atomic claim-ledger leaf.`);

    const multiTarget = await pilotArtifacts();
    const firstClaim = multiTarget.ledger.claims.find((claim) => claim.disposition === "candidate_field");
    const secondClaim = multiTarget.ledger.claims.find((claim) => claim.disposition === "candidate_field" && claim.claimId !== firstClaim?.claimId);
    if (!firstClaim || !secondClaim || !secondClaim.candidateTargets[0]) throw new Error("Pilot candidate-field claims are missing.");
    firstClaim.candidateTargets.push(structuredClone(secondClaim.candidateTargets[0]));
    expect(researchReviewLineageIssues(multiTarget)).toContain(`Claim ${firstClaim.claimId} must target exactly one candidate leaf field.`);
  });

  it("binds every claim and candidate to exactly one real coverage subject", async () => {
    const duplicateSubject = await pilotArtifacts();
    const subject = duplicateSubject.ledger.subjects[0];
    duplicateSubject.ledger.subjects.push(structuredClone(subject));
    duplicateSubject.run.counters.coverageSubjects = duplicateSubject.ledger.subjects.length;
    const duplicateIssues = researchReviewLineageIssues(duplicateSubject);
    expect(duplicateIssues).toContain(`Claim-ledger subject ID ${subject.subjectId} is duplicated.`);
    expect(duplicateIssues).toContain(`Candidate ${subject.candidateIds[0]} must belong to exactly one dossier coverage subject.`);

    const missingSubject = await pilotArtifacts();
    const missingClaim = missingSubject.ledger.claims.find((claim) => claim.disposition === "candidate_field");
    if (!missingClaim) throw new Error("Pilot candidate-field claim is missing.");
    missingClaim.subjectId = "fabricated-subject";
    expect(researchReviewLineageIssues(missingSubject)).toContain(`Claim ${missingClaim.claimId} references missing subject fabricated-subject.`);

    const crossedSubject = await pilotArtifacts();
    const crossedClaim = crossedSubject.ledger.claims.find((claim) => claim.disposition === "candidate_field");
    const otherSubject = crossedSubject.ledger.subjects.find((item) => item.subjectId !== crossedClaim?.subjectId);
    const targetId = crossedClaim?.candidateTargets[0]?.candidateId;
    if (!crossedClaim || !otherSubject || !targetId) throw new Error("Pilot cross-subject fixture is incomplete.");
    crossedClaim.subjectId = otherSubject.subjectId;
    expect(researchReviewLineageIssues(crossedSubject)).toContain(`Claim ${crossedClaim.claimId} targets candidate ${targetId} outside subject ${otherSubject.subjectId}.`);

    const uncovered = await pilotArtifacts();
    const uncoveredClaim = uncovered.ledger.claims.find((claim) => claim.disposition === "candidate_field");
    const uncoveredSubject = uncovered.ledger.subjects.find((item) => item.subjectId === uncoveredClaim?.subjectId);
    if (!uncoveredClaim || !uncoveredSubject) throw new Error("Pilot coverage fixture is incomplete.");
    for (const coverage of uncoveredSubject.coverage) coverage.claimIds = coverage.claimIds.filter((claimId) => claimId !== uncoveredClaim.claimId);
    expect(researchReviewLineageIssues(uncovered)).toContain(`Claim ${uncoveredClaim.claimId} is not included in coverage for subject ${uncoveredSubject.subjectId}.`);
  });

  it("binds refresh source leads and signals to the same canonical target", async () => {
    const artifacts = await pilotArtifacts();
    const shift = artifacts.batch.candidates.find((candidate) => candidate.candidateKind === "organization_refresh_bundle" && candidate.targetMatch.slug === "shift-coastal-technologies") as OrganizationRefreshBundleV2 | undefined;
    const oceanworks = artifacts.batch.candidates.find((candidate) => candidate.candidateKind === "organization_refresh_bundle" && candidate.targetMatch.slug === "oceanworks-international") as OrganizationRefreshBundleV2 | undefined;
    if (!shift || !oceanworks) throw new Error("Pilot refresh-target fixtures are missing.");
    [shift.sourceLeadIds, oceanworks.sourceLeadIds] = [structuredClone(oceanworks.sourceLeadIds), structuredClone(shift.sourceLeadIds)];
    [shift.signalIds, oceanworks.signalIds] = [structuredClone(oceanworks.signalIds), structuredClone(shift.signalIds)];

    const issues = researchReviewLineageIssues(artifacts);
    expect(issues).toContain(`Candidate ${shift.candidateId} source lead ${shift.sourceLeadIds[0]} does not match its refresh target and baseline.`);
    expect(issues).toContain(`Candidate ${shift.candidateId} signal ${shift.signalIds[0]} does not qualify for its refresh target and baseline.`);
    expect(issues).toContain(`Candidate ${oceanworks.candidateId} source lead ${oceanworks.sourceLeadIds[0]} does not match its refresh target and baseline.`);
    expect(issues).toContain(`Candidate ${oceanworks.candidateId} signal ${oceanworks.signalIds[0]} does not qualify for its refresh target and baseline.`);

    const wrongOutcome = await pilotArtifacts();
    const wrongCandidate = wrongOutcome.batch.candidates.find((candidate) => candidate.candidateKind === "organization_refresh_bundle") as OrganizationRefreshBundleV2 | undefined;
    const wrongSignal = wrongOutcome.signals.signals.find((signal) => signal.signalId === wrongCandidate?.signalIds[0]);
    if (!wrongCandidate || !wrongSignal) throw new Error("Pilot signal-outcome fixture is missing.");
    wrongSignal.intendedOutcomes = ["deferred"];
    delete wrongSignal.extracted.changeSummary;
    expect(researchReviewLineageIssues(wrongOutcome)).toContain(`Candidate ${wrongCandidate.candidateId} signal ${wrongSignal.signalId} does not qualify for its refresh target and baseline.`);
  });

  it("uses mode-specific complete-artifact requirements", () => {
    const outputs = { sourceLeadBatch: null, candidateBatch: null, reviewPacket: null, stagingExport: null };
    expect(recordSpecificArtifactRequirements({ mode: "discovery_batch", outputs })).toEqual({ prospects: true, signals: false });
    expect(recordSpecificArtifactRequirements({ mode: "refresh_batch", outputs })).toEqual({ prospects: false, signals: true });
    expect(recordSpecificArtifactRequirements({ mode: "dossier_enrichment", outputs })).toEqual({ prospects: true, signals: true });
    expect(recordSpecificArtifactRequirements({ mode: "deep_dossier", outputs })).toEqual({ prospects: false, signals: false });
    expect(recordSpecificArtifactRequirements({ mode: "deep_dossier", outputs: { ...outputs, prospectInventory: "research/ingestion/prospect-inventories-v1/deep.json" } })).toEqual({ prospects: true, signals: false });
  });

  it("permits a fully dispositioned zero-candidate dossier and refresh records with no qualifying signal", async () => {
    const artifacts = await pilotArtifacts();
    const emptyBatch = { ...artifacts.batch, candidates: [] };
    expect(researchCandidateBatchV2Schema.safeParse(emptyBatch).success).toBe(true);

    const candidateWithoutSignal = structuredClone(artifacts.batch);
    const refreshCandidate = candidateWithoutSignal.candidates.find((candidate) => candidate.schemaVersion === "organization_refresh_bundle_v2") as OrganizationRefreshBundleV2 | undefined;
    if (!refreshCandidate) throw new Error("Pilot organization refresh candidate is missing.");
    refreshCandidate.signalIds = [];
    expect(researchCandidateBatchV2Schema.safeParse(candidateWithoutSignal).success).toBe(true);

    const leadsWithoutSignal = structuredClone(artifacts.leads);
    const refreshLead = leadsWithoutSignal.leads.find((lead) => lead.leadType === "record_refresh_lead") as RecordRefreshLead | undefined;
    if (!refreshLead) throw new Error("Pilot organization refresh lead is missing.");
    refreshLead.signalIds = [];
    expect(sourceLeadBatchV2Schema.safeParse(leadsWithoutSignal).success).toBe(true);
  });

  it("keeps signal-free candidates dossier-specific and requires a dated qualified refresh signal", async () => {
    const artifacts = await pilotArtifacts();
    const refreshCandidate = artifacts.batch.candidates.find((candidate) => candidate.schemaVersion === "organization_refresh_bundle_v2") as OrganizationRefreshBundleV2 | undefined;
    const refreshLead = artifacts.leads.leads.find((lead) => lead.leadType === "record_refresh_lead" && lead.targetMatch.slug === refreshCandidate?.targetMatch.slug) as RecordRefreshLead | undefined;
    const refreshSignal = artifacts.signals.signals.find((signal) => signal.signalId === refreshCandidate?.signalIds[0]);
    if (!refreshCandidate || !refreshLead || !refreshSignal) throw new Error("Pilot refresh lineage is missing.");

    artifacts.run.mode = "refresh_batch";
    refreshCandidate.signalIds = [];
    refreshLead.signalIds = [];
    expect(researchReviewLineageIssues(artifacts)).toContain(
      `Refresh-batch candidate ${refreshCandidate.candidateId} needs at least one linked qualified signal; signal-free candidates are allowed only in organization-dossier or corpus refresh.`
    );

    const undated = await pilotArtifacts();
    const undatedSignal = undated.signals.signals.find((signal) => signal.extracted.eventDate && signal.disposition === "qualified");
    if (!undatedSignal) throw new Error("Dated pilot signal is missing.");
    undatedSignal.extracted.eventDate = null;
    undatedSignal.extracted.effectiveDate = null;
    if (undatedSignal.extracted.procurement) undatedSignal.extracted.procurement.closingAt = null;
    undated.run.agentVersion = "tnm-research-pipeline/1.7.1";
    expect(researchSignalBatchV1Schema.safeParse(undated.signals).success).toBe(true);
    expect(researchRecordSpecificityIssues(undated)).toContain(
      `Signal ${undatedSignal.signalId} needs a structured eventDate, effectiveDate, or procurement.closingAt for a qualified refresh; undated context and maintenance are not signals.`
    );

    const procurementDate = await pilotArtifacts();
    const procurementSignal = procurementDate.signals.signals.find((signal) => signal.extracted.eventDate && signal.disposition === "qualified");
    if (!procurementSignal) throw new Error("Dated pilot procurement signal is missing.");
    procurementSignal.extracted.eventDate = null;
    procurementSignal.extracted.effectiveDate = null;
    procurementSignal.extracted.procurement = {
      noticeId: "notice-2026-001",
      contractId: null,
      stage: "open",
      amendmentNumber: null,
      buyer: "Government of Canada",
      supplier: null,
      value: null,
      currency: null,
      closingAt: "2026-09-30T15:00:00.000Z"
    };
    procurementDate.run.agentVersion = "tnm-research-pipeline/1.7.1";
    expect(researchSignalBatchV1Schema.safeParse(procurementDate.signals).success).toBe(true);
    expect(researchRecordSpecificityIssues(procurementDate).filter((issue) => issue.includes(procurementSignal.signalId) && issue.includes("structured eventDate"))).toEqual([]);
  });

  it("limits dossier-enrichment candidates to organization refresh v2", async () => {
    const artifacts = await pilotArtifacts();
    const candidate = artifacts.batch.candidates[0] as unknown as { schemaVersion: string };
    candidate.schemaVersion = "organization_refresh_bundle_v1";

    expect(researchRecordSpecificityIssues(artifacts)).toContain(
      `Organization-dossier run ${artifacts.run.runId} may contain only organization_refresh_bundle_v2 candidates; found organization_refresh_bundle_v1.`
    );
  });

  it("requires explicit template activation, exhausted search yield, and a supported activity date", async () => {
    const activation = await pilotArtifacts();
    const activationCandidate = activation.batch.candidates.find((candidate) => candidate.schemaVersion === "organization_refresh_bundle_v2") as OrganizationRefreshBundleV2 | undefined;
    if (!activationCandidate) throw new Error("Pilot activation candidate is missing.");
    activationCandidate.operations = activationCandidate.operations.filter((operation) => !(operation.operation === "set_field" && operation.field === "editorial_profile_version"));
    expect(researchRecordSpecificityIssues(activation)).toContain(
      `Dossier candidate ${activationCandidate.candidateId} must explicitly activate organization_editorial_profile_v1 because the published record is not yet on the editorial template.`
    );

    const alreadyActivated = await pilotArtifacts();
    const activatedCandidate = alreadyActivated.batch.candidates.find((candidate) => candidate.schemaVersion === "organization_refresh_bundle_v2") as OrganizationRefreshBundleV2 | undefined;
    if (!activatedCandidate) throw new Error("Pilot activated candidate is missing.");
    (activatedCandidate.beforeRecord.organization as Record<string, unknown>).editorial_profile_version = "organization_editorial_profile_v1";
    activatedCandidate.operations = activatedCandidate.operations.filter((operation) => !(operation.operation === "set_field" && operation.field === "editorial_profile_version"));
    expect(researchRecordSpecificityIssues(alreadyActivated).filter((issue) => issue.includes("explicitly activate"))).toEqual([]);

    const saturation = await pilotArtifacts();
    const saturationCandidate = saturation.batch.candidates.find((candidate) => candidate.schemaVersion === "organization_refresh_bundle_v2") as OrganizationRefreshBundleV2 | undefined;
    const saturationSubject = saturation.ledger.subjects.find((subject) => subject.candidateIds.includes(saturationCandidate?.candidateId ?? ""));
    if (!saturationCandidate || !saturationSubject) throw new Error("Pilot saturation lineage is missing.");
    saturationSubject.saturation.additionalSearchYield = "high";
    saturationSubject.saturation.newClaimsFromLastTwoLanes = 50;
    saturationSubject.saturation.stopReason = "Additional public collection continues to produce material claims that could change the reviewer decision.";
    expect(researchRecordSpecificityIssues(saturation)).toContain(
      `Dossier candidate ${saturationCandidate.candidateId} cannot be ready while subject ${saturationSubject.subjectId} reports high additional search yield.`
    );

    const noMaterial = await pilotArtifacts();
    const oceanworksIndex = noMaterial.batch.candidates.findIndex((candidate) => candidate.schemaVersion === "organization_refresh_bundle_v2" && candidate.targetMatch.slug === "oceanworks-international");
    const oceanworksSubject = noMaterial.ledger.subjects.find((subject) => subject.subjectId === "subject-oceanworks-international");
    if (oceanworksIndex < 0 || !oceanworksSubject) throw new Error("OceanWorks no-material fixture is missing.");
    noMaterial.batch.candidates.splice(oceanworksIndex, 1);
    noMaterial.ledger.claims = noMaterial.ledger.claims.filter((claim) => claim.subjectId !== oceanworksSubject.subjectId);
    oceanworksSubject.candidateIds = [];
    oceanworksSubject.saturation.additionalSearchYield = "medium";
    noMaterial.batch.deferred.push({
      leadId: "lead-oceanworks-international-editorial-v1-20260809",
      readinessDisposition: "no_material_change",
      reason: "no_material_change: the bounded review found no supported dated activity change for this target.",
      followUp: "Continue the unresolved evidence route before proposing a public change."
    });
    expect(researchRecordSpecificityIssues(noMaterial)).toContain(
      "Dossier target oceanworks-international cannot use no_material_change without a low- or zero-yield coverage subject."
    );

    const activityDate = await pilotArtifacts();
    const dateCandidate = activityDate.batch.candidates.find((candidate) => candidate.schemaVersion === "organization_refresh_bundle_v2" && candidate.operations.some((operation) => operation.operation === "set_field" && operation.field === "current_activity_as_of")) as OrganizationRefreshBundleV2 | undefined;
    const dateOperation = dateCandidate?.operations.find((operation) => operation.operation === "set_field" && operation.field === "current_activity_as_of");
    if (!dateCandidate || !dateOperation || dateOperation.operation !== "set_field" || dateOperation.field !== "current_activity_as_of") throw new Error("Pilot activity-date operation is missing.");
    dateOperation.after = "2026-08-10";
    expect(researchRecordSpecificityIssues(activityDate)).toContain(
      `Candidate ${dateCandidate.candidateId} current_activity_as_of 2026-08-10 does not match a linked structured signal date or mapped source-backed claim date.`
    );
  });

  it("accepts the repaired eight-profile review packet", async () => {
    expect(researchRecordSpecificityIssues(await pilotArtifacts())).toEqual([]);
  });

  it("rejects the subject-substitution summaries that caused the review incident", async () => {
    const artifacts = await pilotArtifacts();
    const lead = artifacts.leads.leads.find((item) => item.leadType === "record_refresh_lead");
    if (!lead) throw new Error("Pilot refresh lead is missing.");
    artifacts.prospects.prospects[0].fitSummary = "Shift Coastal Technologies is an owner-approved published pilot selected to test the editorial dossier against live evidence and the existing reviewed relationship graph.";
    lead.refreshSummary = "Shift Coastal Technologies is ready_for_editorial_v1 because durable sources support the proposed narrative and action fields; human review must resolve the record-specific warning before separate publication.";
    artifacts.signals.signals[0].extracted.changeSummary = "Consolidated source-backed editorial dossier enrichment for Shift Coastal Technologies.";

    const issues = researchRecordSpecificityIssues(artifacts);
    expect(issues).toContain("Prospect prospect-shift-coastal-technologies-20260809 fitSummary describes pilot selection instead of a record-specific decision fit.");
    expect(issues).toContain("Lead lead-shift-coastal-technologies-editorial-v1-20260809 refreshSummary is a generic readiness assertion.");
    expect(issues).toContain("Signal signal-shift-coastal-technologies-editorial-v1-20260809 changeSummary does not state a record-specific decision delta.");
  });

  it("rejects generic operation explanations, workflow predicates, analyst notes, and invented attempt summaries", async () => {
    const artifacts = await pilotArtifacts();
    const candidate = artifacts.batch.candidates.find((item) => item.candidateKind === "organization_refresh_bundle");
    if (!candidate) throw new Error("Pilot refresh candidate is missing.");
    candidate.operations[0].reviewerExplanation = "Add a bounded explanation of the organization's operating role, users and place in the delivery ecosystem without repeating the short hero description.";
    artifacts.ledger.claims[0].predicate = "set operating context support";
    artifacts.ledger.claims[0].analystNote = "Retained as one atomic source-backed leaf for private reviewer verification before any acceptance or publication decision.";
    artifacts.ledger.subjects[0].coverage[0].attempts = ["Checked official organization material, durable government or partner evidence, and a complementary technical or independent lane."];

    const issues = researchRecordSpecificityIssues(artifacts);
    expect(issues).toContain(`Candidate ${candidate.candidateId} operation ${candidate.operations[0].operationId} explanation does not name the changed field or entity.`);
    expect(issues).toContain("Claim claim-shift-coastal-technologies-1-20260809 uses the workflow predicate 'set operating context support' instead of a factual relationship.");
    expect(issues).toContain("Claim claim-shift-coastal-technologies-1-20260809 uses a generic analyst note.");
    expect(issues).toContain("Subject subject-shift-coastal-technologies identity_ownership cites a recovery attempt that is not present in its prospect, lead, or signal lineage.");
  });

  it("rejects plausible-looking prose that lacks structured record anchors", async () => {
    const artifacts = await pilotArtifacts();
    const candidate = artifacts.batch.candidates.find((item) => item.candidateKind === "organization_refresh_bundle" && item.targetMatch.slug === "shift-coastal-technologies") as OrganizationRefreshBundleV2 | undefined;
    const lead = artifacts.leads.leads.find((item) => item.leadType === "record_refresh_lead" && item.targetMatch.slug === "shift-coastal-technologies") as RecordRefreshLead | undefined;
    const signal = artifacts.signals.signals.find((item) => item.liveEntityMatches.some((match) => match.slug === "shift-coastal-technologies"));
    const claim = artifacts.ledger.claims.find((item) => item.subjectId === "subject-shift-coastal-technologies" && item.disposition === "candidate_field");
    if (!candidate || !lead || !signal || !claim) throw new Error("Shift pilot lineage is incomplete.");

    artifacts.prospects.prospects[0].fitSummary = "Reviewers decide whether Shift Coastal Technologies works, using British Institute of Non-Destructive Testing evidence.";
    lead.refreshSummary = "Shift Coastal Technologies changes the reviewed questions field with a moderate question for review.";
    delete signal.extracted.changeSummary;
    claim.analystNote = "Shift Coastal Technologies and Shift Coastal Technologies provide the review reference.";
    candidate.reviewerRationale = candidate.reviewerRationale.replace(/Evidence:.*?Mission\/Public Need read:/, "Evidence: A 2024 note from Shift Coastal Technologies provides evidence. Mission/Public Need read:");

    const issues = researchRecordSpecificityIssues(artifacts);
    expect(issues).toContain("Prospect prospect-shift-coastal-technologies-20260809 fitSummary lacks a concrete mandate or capability anchor.");
    expect(issues).toContain("Lead lead-shift-coastal-technologies-editorial-v1-20260809 refreshSummary lacks a record-specific value, event, or warning anchor.");
    expect(issues).toContain("Signal signal-shift-coastal-technologies-editorial-v1-20260809 needs a record-specific changeSummary for a qualified refresh.");
    expect(issues).toContain(`Claim ${claim.claimId} analyst note does not anchor the mapped leaf assertion.`);
    expect(issues).toContain(`Candidate ${candidate.candidateId} Evidence rationale must name its exact source count and at least one source publisher or domain.`);
  });

  it("allows factual supports predicates while keeping the workflow-language ban", async () => {
    const artifacts = await pilotArtifacts();
    artifacts.ledger.claims[0].predicate = "supports maritime operators";
    expect(researchRecordSpecificityIssues(artifacts)).toEqual([]);
  });

  it("accepts an explicit relationship change when the capability operation and rationale agree", async () => {
    const artifacts = await pilotArtifacts();
    const candidate = artifacts.batch.candidates.find((item) => item.candidateKind === "organization_refresh_bundle" && item.targetMatch.slug === "shift-coastal-technologies") as OrganizationRefreshBundleV2 | undefined;
    if (!candidate) throw new Error("Shift pilot candidate is missing.");
    candidate.operations.push({
      operationId: "update-oceansled-mission-match",
      operation: "update_child",
      entityType: "capability",
      parentId: candidate.targetMatch.entityId,
      targetId: "86c2fd9e-d3ea-4d9a-8860-d18d4f29133c",
      before: { name: "OceanSled Ranger", summary: "Autonomous maritime platform", missionMatches: [] },
      after: { name: "OceanSled Ranger", summary: "Autonomous maritime platform", missionMatches: [{ missionAreaSlug: "underwater-isr", alignmentSummary: "OceanSled Ranger can carry sensing payloads for underwater ISR workflows.", matchClass: "relevant", confidence: "moderate" }] },
      evidenceIds: [candidate.fieldEvidence[0].id],
      leafEvidence: [{ fieldPath: "after.missionMatches.0.alignmentSummary", evidenceIds: [candidate.fieldEvidence[0].id] }],
      reviewerExplanation: "Update the capability relationship for OceanSled Ranger by adding the underwater ISR mission premise supported by its sensing-payload role."
    } as unknown as typeof candidate.operations[number]);
    candidate.reviewerRationale = candidate.reviewerRationale.replace(/Mission\/Public Need read:.*?Unknowns:/, "Mission/Public Need read: A new underwater isr relationship is proposed from the OceanSled Ranger sensing-payload capability premise. Unknowns:");

    const issues = researchRecordSpecificityIssues(artifacts);
    expect(issues.filter((issue) => issue.includes("Mission/Public Need rationale"))).toEqual([]);
  });

  it("requires exact one-to-one target coverage but permits a structured no-material-change disposition", async () => {
    const artifacts = await pilotArtifacts();
    const oceanworksIndex = artifacts.batch.candidates.findIndex((item) => item.candidateKind === "organization_refresh_bundle" && item.targetMatch.slug === "oceanworks-international");
    if (oceanworksIndex < 0) throw new Error("OceanWorks pilot candidate is missing.");
    artifacts.batch.candidates.splice(oceanworksIndex, 1);
    artifacts.ledger.claims = artifacts.ledger.claims.filter((claim) => claim.subjectId !== "subject-oceanworks-international");
    artifacts.batch.deferred.push({
      leadId: "lead-oceanworks-international-editorial-v1-20260809",
      readinessDisposition: "no_material_change",
      reason: "no_material_change: the target remains research-ready only for the supported existing fields in this bounded run.",
      followUp: "Recheck official and government sources in the next enrichment cycle."
    });
    expect(researchRecordSpecificityIssues(artifacts)).toEqual([]);

    artifacts.batch.deferred[0].readinessDisposition = undefined;
    artifacts.batch.deferred[0].reason = "This is not a no_material_change disposition; the researcher did not investigate this target at all.";
    expect(researchRecordSpecificityIssues(artifacts)).toContain("Organization-dossier target oceanworks-international needs exactly one refresh candidate or structured research_required/no_material_change disposition; found 0.");

    artifacts.batch.deferred = [];
    expect(researchRecordSpecificityIssues(artifacts)).toContain("Organization-dossier target oceanworks-international needs exactly one refresh candidate or structured research_required/no_material_change disposition; found 0.");
  });

  it("rejects duplicate target keys and subject IDs in a dossier collection plan", async () => {
    const artifacts = await pilotArtifacts();
    artifacts.plan.targetSubjects.push(structuredClone(artifacts.plan.targetSubjects[0]));

    const issues = researchRecordSpecificityIssues(artifacts);
    expect(issues).toContain(`Dossier-enrichment run ${artifacts.run.runId} repeats collection-plan subject ID ${artifacts.plan.targetSubjects[0].subjectId}.`);
    expect(issues).toContain("Dossier-enrichment run tnm-dossier-pilot-20260809 repeats target shift-coastal-technologies in its collection plan.");
  });

  it("rejects duplicate candidates even when the total target count still looks complete", async () => {
    const artifacts = await pilotArtifacts();
    const shift = artifacts.batch.candidates.find((item) => item.candidateKind === "organization_refresh_bundle" && item.targetMatch.slug === "shift-coastal-technologies") as OrganizationRefreshBundleV2 | undefined;
    const h2Index = artifacts.batch.candidates.findIndex((item) => item.candidateKind === "organization_refresh_bundle" && item.targetMatch.slug === "h2-analytics");
    if (!shift || h2Index < 0) throw new Error("Pilot candidates are incomplete.");
    const duplicate = structuredClone(shift);
    duplicate.candidateId = "candidate-shift-coastal-technologies-duplicate-20260809";
    artifacts.batch.candidates[h2Index] = duplicate;

    const issues = researchRecordSpecificityIssues(artifacts);
    expect(issues).toContain("Organization-dossier target shift-coastal-technologies needs exactly one refresh candidate or structured research_required/no_material_change disposition; found 2.");
    expect(issues).toContain("Organization-dossier target h2-analytics needs exactly one refresh candidate or structured research_required/no_material_change disposition; found 0.");
  });

  it("keeps historical pipeline 1.6 artifacts advisory rather than retroactively failing them", async () => {
    const artifacts = await pilotArtifacts();
    artifacts.run.agentVersion = "tnm-research-pipeline/1.6.0";
    artifacts.prospects.prospects[0].fitSummary = "A generic historical pilot summary that would not meet the current record-specific contract.";
    expect(researchRecordSpecificityIssues(artifacts)).toEqual([]);
  });

  it("makes production provenance, conflicts, and signal deltas executable in pipeline 1.7.2", async () => {
    const malformed = await pilotArtifacts();
    malformed.run.agentVersion = "tnm-research-pipeline/1.7.2";
    const malformedClaim = malformed.ledger.claims[0];
    malformedClaim.source.independenceKey = "sample.ca|source-one";
    expect(researchRecordSpecificityIssues(malformed)).toContain(
      `Claim ${malformedClaim.claimId} must use owner:<underlying-owner>|origin:<canonical-host>|event:<underlying-event-family> provenance.`
    );

    const contradiction = await pilotArtifacts();
    contradiction.run.agentVersion = "tnm-research-pipeline/1.7.2";
    for (const claim of contradiction.ledger.claims) {
      claim.source.independenceKey = `owner:${claim.source.sourceFamily.toLowerCase().replace(/[^a-z0-9]+/g, "-")}|origin:${new URL(claim.source.canonicalUrl).hostname}|event:${claim.source.sourceId}`;
    }
    const [first, second] = contradiction.ledger.claims;
    first.contradictsClaimIds = [second.claimId];
    expect(researchRecordSpecificityIssues(contradiction)).toContain(
      `Claim ${first.claimId} and contradiction ${second.claimId} must link to each other.`
    );

    const templated = await pilotArtifacts();
    templated.run.agentVersion = "tnm-research-pipeline/1.7.2";
    for (const claim of templated.ledger.claims) {
      claim.source.independenceKey = `owner:${claim.source.sourceFamily.toLowerCase().replace(/[^a-z0-9]+/g, "-")}|origin:${new URL(claim.source.canonicalUrl).hostname}|event:${claim.source.sourceId}`;
    }
    const signal = templated.signals.signals.find((item) => item.disposition === "qualified");
    if (!signal) throw new Error("Qualified signal fixture is missing.");
    const eventDate = signal.extracted.eventDate ?? signal.extracted.effectiveDate ?? signal.extracted.procurement?.closingAt;
    signal.extracted.changeSummary = `${signal.extracted.organization}'s ${eventDate} record supports a dated current activity update for the current activity field.`;
    expect(researchRecordSpecificityIssues(templated)).toContain(
      `Signal ${signal.signalId} changeSummary does not state a record-specific decision delta.`
    );
  });
});
