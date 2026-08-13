import { z } from "zod";
import { researchIdentityMatches } from "./identity-match";
import { buildResearchSourceFamily } from "./source-family";
import {
  currentResearchPipelineVersion,
  formatZodIssues,
  organizationBundleV3Schema,
  osintCollectionLaneValues,
  osintCoverageDimensionValues,
  researchCandidateBatchV2Schema,
  researchCandidateQualityIssues,
  researchClaimLedgerQualityIssues,
  researchClaimLedgerV1Schema,
  researchCollectionPlanV1Schema,
  researchProspectInventoryV1Schema,
  researchRecordSpecificityIssues,
  researchReviewLineageIssues,
  researchRunSchema,
  sourceLeadBatchV2Schema
} from "./pipeline-schema";

const traceSchema = z.object({
  pipelineStage: z.string().min(3),
  failureClass: z.string().min(3),
  expectedControl: z.string().min(3)
}).strict();

const identitySchema = z.object({ slug: z.string(), name: z.string(), websiteDomain: z.string().nullable() }).strict();
const caseSchema = z.discriminatedUnion("kind", [
  z.object({
    caseId: z.string().min(3),
    kind: z.literal("source_family_collision"),
    trace: traceSchema,
    input: z.object({ left: z.string(), right: z.string() }).strict(),
    expected: z.object({ distinct: z.boolean(), maximumLength: z.number().int().positive() }).strict()
  }).strict(),
  z.object({
    caseId: z.string().min(3),
    kind: z.literal("identity_match"),
    trace: traceSchema,
    input: z.object({ existing: identitySchema, incoming: identitySchema }).strict(),
    expected: z.object({ matches: z.boolean() }).strict()
  }).strict(),
  z.object({
    caseId: z.string().min(3),
    kind: z.literal("candidate_sufficiency"),
    trace: traceSchema,
    input: z.object({
      proposedLeafPaths: z.array(z.string().min(1)),
      evidenceLeafPaths: z.array(z.string().min(1)),
      independentSourceFamilies: z.array(z.string().min(1)),
      identityResolved: z.boolean(),
      canadianNexusResolved: z.boolean(),
      concreteOfferingResolved: z.boolean(),
      lifecycleResolved: z.boolean(),
      materialUnknownsExplicit: z.boolean(),
      consequentialClaimNeedsCorroboration: z.boolean(),
      buyerOrAccessPathResolved: z.boolean(),
      separateMissionPremises: z.boolean()
    }).strict(),
    expected: z.object({ eligible: z.boolean() }).strict()
  }).strict(),
  z.object({
    caseId: z.string().min(3),
    kind: z.literal("organization_bundle_contract"),
    trace: traceSchema,
    input: z.object({ candidate: z.unknown() }).strict(),
    expected: z.object({ eligible: z.boolean() }).strict()
  }).strict()
]);

export const researchOperationEvalSetSchema = z.object({
  schemaVersion: z.literal("research_operation_evals_v1"),
  privacy: z.literal("synthetic_no_production_records"),
  cases: z.array(caseSchema).min(1)
}).strict();

function evaluateOrganizationBundleContract(candidateValue: unknown) {
  const candidateResult = organizationBundleV3Schema.safeParse(candidateValue);
  if (!candidateResult.success) {
    return {
      eligible: false,
      schemaIssues: formatZodIssues(candidateResult.error),
      qualityIssues: [],
      lineageIssues: [],
      specificityIssues: []
    };
  }

  const candidate = candidateResult.data;
  const runId = "synthetic-organization-bundle-run";
  const createdAt = "2026-08-12T12:00:00.000Z";
  const completedAt = "2026-08-12T12:15:00.000Z";
  const source = candidate.sources[0];
  const sourceBackedEvidence = candidate.fieldEvidence.filter((evidence) => evidence.claimClass === "source_backed");
  const claims = sourceBackedEvidence.map((evidence, index) => ({
    claimId: `synthetic-claim-${String(index + 1).padStart(2, "0")}`,
    subjectId: "synthetic-northstar-systems",
    subjectType: "organization" as const,
    predicate: `documents ${evidence.fieldPath.replaceAll(".", " ")}`,
    value: evidence.excerpt,
    unit: null,
    material: true,
    temporal: { observedAt: createdAt, publishedAt: null, effectiveFrom: null, effectiveTo: null },
    source: {
      sourceId: evidence.sourceId,
      originalUrl: source.url,
      canonicalUrl: source.url,
      locator: source.locator,
      sourceChannel: "official_company" as const,
      sourceFamily: "synthetic-northstar-official-profile",
      sourcePosture: "evidence_anchor" as const,
      independenceKey: "owner:synthetic-northstar|origin:synthetic.example|event:official-profile"
    },
    status: "supported" as const,
    independentClaimIds: [],
    contradictsClaimIds: [],
    supersedesClaimIds: [],
    disposition: "candidate_field" as const,
    candidateTargets: [{ candidateId: candidate.candidateId, fieldPath: evidence.fieldPath, operationId: null }],
    analystNote: `${candidate.organization.name} evidence from ${source.publisher} maps ${evidence.fieldPath}: ${evidence.excerpt}`
  }));
  const coverage = osintCoverageDimensionValues.map((dimension, dimensionIndex) => ({
    dimension,
    status: "covered" as const,
    claimIds: claims.filter((_, claimIndex) => claimIndex % osintCoverageDimensionValues.length === dimensionIndex).map((claim) => claim.claimId),
    attempts: [],
    note: `Synthetic ${dimension.replaceAll("_", " ")} coverage is represented by the mapped official profile evidence.`
  }));
  const collectionLanes = osintCollectionLaneValues.slice(0, 3).map((lane) => ({
    lane,
    purpose: `Use the synthetic ${lane.replaceAll("_", " ")} lane to test bounded source recovery and evidence mapping.`,
    sourcePosture: "evidence_anchor" as const,
    queryPatterns: [`Synthetic Northstar Systems ${lane.replaceAll("_", " ")}`],
    expectedClaims: ["Concrete organization identity, capability, Canadian presence, and public operating evidence"]
  }));

  const artifactResults = {
    run: researchRunSchema.safeParse({
      schemaVersion: "research_run_v1",
      runId,
      agentVersion: currentResearchPipelineVersion,
      trigger: "manual",
      mode: "deep_dossier",
      scope: { geography: "canada_first", organizationKinds: ["company"], missionAreaSlugs: [], technicalDomainSlugs: ["maritime-sensing"], demandIssuerTypes: [] },
      selectedGap: { coverageView: "supply", dimension: "synthetic-organization-contract", reason: "A synthetic organization bundle exercises the complete current candidate contract without production data.", score: 1000 },
      status: "completed",
      osintArtifactsRequired: true,
      startedAt: createdAt,
      completedAt,
      limits: { totalMinutes: 90, sourceBookMinutes: 30, maxQualifiedLeads: 25, maxCandidates: 5, minimumProspects: 1, minimumSourceLanes: 3, targetCandidates: 5 },
      sourceQueries: ["Synthetic Northstar Systems official capability Canada"],
      counters: {
        sourcesChecked: 1, leadsQualified: 1, leadsDeferred: 0, candidatesCreated: 1, duplicatesBlocked: 0,
        prospectsDiscovered: 1, uniqueProspects: 1, prospectsQueued: 1, recoveryAttempts: 0, sourceLanesSearched: 3,
        candidatesGreen: 1, candidatesAmber: 0, claimsCollected: claims.length, claimsConflicted: 0, coverageSubjects: 1
      },
      underTargetReason: null,
      exhaustionEvidence: null,
      validation: { passed: true, errors: [], warnings: [] },
      errors: [],
      stopReason: "Synthetic contract evaluation completed.",
      outputs: {
        collectionPlan: "research/ingestion/collection-plans-v1/synthetic-organization-bundle-run.json",
        claimLedger: "research/ingestion/claim-ledgers-v1/synthetic-organization-bundle-run.json",
        prospectInventory: "research/ingestion/prospect-inventories-v1/synthetic-organization-bundle-run.json",
        signalBatch: null,
        sourceLeadBatch: "research/ingestion/source-leads-v2/synthetic-organization-bundle-run.json",
        candidateBatch: "research/ingestion/candidate-batches-v2/synthetic-organization-bundle-run.json",
        reviewPacket: null,
        stagingExport: null
      }
    }),
    plan: researchCollectionPlanV1Schema.safeParse({
      schemaVersion: "research_collection_plan_v1",
      planId: "synthetic-organization-bundle-plan",
      runId,
      createdAt,
      status: "complete",
      intelligenceRequirement: "Determine whether a synthetic Canadian company candidate carries complete identity, capability, evidence, and reviewer-decision lineage.",
      targetSubjects: [{
        subjectId: "synthetic-northstar-systems",
        subjectType: "organization",
        name: candidate.organization.name,
        aliases: [],
        canonicalIdentifiers: [candidate.organization.slug, candidate.organization.websiteUrl]
      }],
      priorityQuestions: [
        { questionId: "synthetic-identity", subjectType: "organization", question: "What durable evidence establishes the organization identity and Canadian operating presence?", targetFieldPaths: ["organization.description"], evidenceThreshold: "one_anchor" },
        { questionId: "synthetic-capability", subjectType: "organization", question: "What concrete capability and interface can a reviewer compare against the mapped technical domain?", targetFieldPaths: ["capabilities.0.summary"], evidenceThreshold: "one_anchor" },
        { questionId: "synthetic-action", subjectType: "organization", question: "What bounded reviewer action follows from the supported capability and explicit remaining unknown?", targetFieldPaths: ["reviewerRationale"], evidenceThreshold: "one_anchor" }
      ],
      collectionLanes,
      languagePlan: { languages: ["en"], frenchSearchRequired: false, exceptionReason: "This synthetic contract fixture has no real bilingual identity or public source surface to search." },
      coverageDimensions: [...osintCoverageDimensionValues],
      stopConditions: [
        "Stop when every proposed public leaf maps to the synthetic durable source and atomic claim lineage.",
        "Stop without staging if the candidate fails schema, quality, lineage, or record-specificity validation."
      ],
      prohibitedActions: ["social_interaction", "access_control_bypass", "personal_data_collection", "canonical_database_write", "candidate_approval_or_publication"]
    }),
    prospects: researchProspectInventoryV1Schema.safeParse({
      schemaVersion: "research_prospect_inventory_v1",
      inventoryId: "synthetic-organization-bundle-prospects",
      runId,
      createdAt,
      scope: "Synthetic Canadian company prospect used only to exercise current organization-bundle validation contracts.",
      prospects: [{
        id: "synthetic-northstar-systems-prospect",
        name: candidate.organization.name,
        proposedEntityType: "organization",
        proposedOrganizationKind: "company",
        canonicalUrl: candidate.organization.websiteUrl,
        discoverySourceUrl: source.url,
        discoveryLane: "official_directory",
        countryCode: "CA",
        fitSummary: `${candidate.organization.name} lets a reviewer assess a concrete modular coastal-surveillance capability against Canadian maritime sensing coverage.`,
        disposition: "selected",
        rejectionReason: null,
        recoveryAttempts: []
      }]
    }),
    leads: sourceLeadBatchV2Schema.safeParse({
      schemaVersion: "source_lead_batch_v2",
      leadBatchId: "synthetic-organization-bundle-leads",
      runId,
      createdAt,
      scope: { description: "Synthetic qualified organization lead used to exercise current candidate and lineage validation without production data.", targetMissionAreaSlugs: [], targetTechnicalDomainSlugs: ["maritime-sensing"], targetOrganizationKinds: ["company"], targetDemandIssuerTypes: [] },
      leads: [{
        leadType: "organization_lead",
        id: candidate.sourceLeadIds[0],
        source,
        discoveryPath: [source.url],
        possibleMissionAreaSlugs: [],
        possibleTechnicalDomainSlugs: ["maritime-sensing"],
        sourceConfidence: "moderate",
        alignmentConfidence: "moderate",
        evidenceLocator: source.locator,
        duplicateFingerprint: { canonicalUrl: candidate.organization.websiteUrl, websiteDomain: "synthetic.example", stableSlug: candidate.organization.slug, legalName: candidate.organization.legalName, aliases: candidate.organization.aliases },
        followUpQuestions: ["Which public integration interfaces distinguish the synthetic coastal-surveillance software for a technical reviewer?"],
        discoveryLane: "official_directory",
        inclusionScore: 88,
        completenessScore: 78,
        reviewWarnings: candidate.reviewWarnings,
        disposition: "qualified",
        doNotIngestReason: null,
        organizationName: candidate.organization.name,
        proposedKind: candidate.organization.entityKind,
        proposedCategories: candidate.organization.categories,
        websiteUrl: candidate.organization.websiteUrl,
        aliases: candidate.organization.aliases,
        location: { city: candidate.organization.primaryLocation.city, provinceTerritory: candidate.organization.primaryLocation.provinceTerritory, countryCode: "CA" },
        candidateCapabilityName: candidate.capabilities[0]?.name ?? null,
        roleSpecificEvidence: "The synthetic official profile describes a concrete modular coastal-surveillance software capability and its Canadian operating location."
      }]
    }),
    ledger: researchClaimLedgerV1Schema.safeParse({
      schemaVersion: "research_claim_ledger_v1",
      ledgerId: "synthetic-organization-bundle-ledger",
      runId,
      createdAt,
      completedAt,
      status: "complete",
      claims,
      subjects: [{
        subjectId: "synthetic-northstar-systems",
        subjectType: "organization",
        name: candidate.organization.name,
        candidateIds: [candidate.candidateId],
        coverage,
        saturation: { additionalSearchYield: "zero", newClaimsFromLastTwoLanes: 0, stopReason: "The final two synthetic lanes add no material claim beyond the complete mapped fixture." }
      }],
      warnings: []
    }),
    batch: researchCandidateBatchV2Schema.safeParse({
      schemaVersion: "research_candidate_batch_v2",
      batchId: "synthetic-organization-bundle-candidates",
      runId,
      title: "Synthetic organization bundle contract evaluation",
      status: "candidate",
      createdAt,
      selectedGap: { coverageView: "supply", dimension: "synthetic-organization-contract", reason: "A synthetic organization bundle exercises the complete current candidate contract without production data.", score: 1000 },
      sourceLeadBatchPath: "research/ingestion/source-leads-v2/synthetic-organization-bundle-run.json",
      guardrailNotes: ["This synthetic candidate has no production identity and cannot be imported or published."],
      candidates: [candidate],
      deferred: []
    })
  };
  const schemaIssues = Object.entries(artifactResults).flatMap(([artifact, result]) => (
    result.success ? [] : formatZodIssues(result.error).map((issue) => `${artifact}: ${issue}`)
  ));
  if (schemaIssues.length > 0
      || !artifactResults.run.success
      || !artifactResults.plan.success
      || !artifactResults.prospects.success
      || !artifactResults.leads.success
      || !artifactResults.ledger.success
      || !artifactResults.batch.success) {
    return { eligible: false, schemaIssues, qualityIssues: [], lineageIssues: [], specificityIssues: [] };
  }

  const qualityIssues = [
    ...researchCandidateQualityIssues(candidate),
    ...researchClaimLedgerQualityIssues(artifactResults.ledger.data)
  ];
  const lineageIssues = researchReviewLineageIssues({
    run: artifactResults.run.data,
    leads: artifactResults.leads.data,
    signals: null,
    ledger: artifactResults.ledger.data,
    batch: artifactResults.batch.data
  });
  const specificityIssues = researchRecordSpecificityIssues({
    run: artifactResults.run.data,
    plan: artifactResults.plan.data,
    prospects: artifactResults.prospects.data,
    signals: null,
    leads: artifactResults.leads.data,
    ledger: artifactResults.ledger.data,
    batch: artifactResults.batch.data
  });
  return {
    eligible: schemaIssues.length === 0 && qualityIssues.length === 0 && lineageIssues.length === 0 && specificityIssues.length === 0,
    schemaIssues,
    qualityIssues,
    lineageIssues,
    specificityIssues
  };
}

export function evaluateResearchOperationCases(value: unknown) {
  const evalSet = researchOperationEvalSetSchema.parse(value);
  return evalSet.cases.map((evalCase) => {
    if (evalCase.kind === "source_family_collision") {
      const left = buildResearchSourceFamily(evalCase.input.left, evalCase.expected.maximumLength);
      const right = buildResearchSourceFamily(evalCase.input.right, evalCase.expected.maximumLength);
      const passed = (left !== right) === evalCase.expected.distinct
        && left.length <= evalCase.expected.maximumLength
        && right.length <= evalCase.expected.maximumLength;
      return { caseId: evalCase.caseId, passed, trace: evalCase.trace, observed: { left, right } };
    }
    if (evalCase.kind === "identity_match") {
      const matches = researchIdentityMatches(evalCase.input.existing, evalCase.input.incoming);
      return { caseId: evalCase.caseId, passed: matches === evalCase.expected.matches, trace: evalCase.trace, observed: { matches } };
    }
    if (evalCase.kind === "organization_bundle_contract") {
      const observed = evaluateOrganizationBundleContract(evalCase.input.candidate);
      return { caseId: evalCase.caseId, passed: observed.eligible === evalCase.expected.eligible, trace: evalCase.trace, observed };
    }
    const evidence = new Set(evalCase.input.evidenceLeafPaths);
    const unsupportedLeafPaths = [...new Set(evalCase.input.proposedLeafPaths)].filter((fieldPath) => !evidence.has(fieldPath));
    const distinctSourceFamilies = new Set(evalCase.input.independentSourceFamilies).size;
    const eligible = unsupportedLeafPaths.length === 0
      && evalCase.input.identityResolved
      && evalCase.input.canadianNexusResolved
      && evalCase.input.concreteOfferingResolved
      && evalCase.input.lifecycleResolved
      && evalCase.input.materialUnknownsExplicit
      && evalCase.input.buyerOrAccessPathResolved
      && evalCase.input.separateMissionPremises
      && (!evalCase.input.consequentialClaimNeedsCorroboration || distinctSourceFamilies >= 2);
    return {
      caseId: evalCase.caseId,
      passed: eligible === evalCase.expected.eligible,
      trace: evalCase.trace,
      observed: { eligible, unsupportedLeafPaths, distinctSourceFamilies }
    };
  });
}
