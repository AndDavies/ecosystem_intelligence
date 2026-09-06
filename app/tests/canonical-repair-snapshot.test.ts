import { readFile } from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";
import { buildResearchFinalizePlan } from "../src/lib/research/finalize-plan";
import {
  canonicalOrganizationRepairSnapshotV1Schema,
  researchCandidateBatchV2Schema,
  researchRunSchema
} from "../src/lib/research/pipeline-schema";
import { canonicalRepairSnapshotParityIssues } from "../src/lib/research/staging-integrity";
import {
  buildCanonicalRepairCandidate,
  canonicalRepairEmptyCapabilityDependencies,
  canonicalRepairEmptyOrganizationDependencies,
  canonicalRepairFixtureIds
} from "./fixtures/canonical-organization-repair-candidates";

const startedAt = "2026-09-04T11:45:00.000Z";
const completedAt = "2026-09-04T12:00:00.000Z";
const runId = "tnm-canonical-repair-snapshot";

const capability = {
  id: canonicalRepairFixtureIds.capability,
  slug: "alpha-sensor",
  name: "Alpha Sensor",
  publicationStatus: "published",
  updatedAt: completedAt
};

function operationEvidence(suffix: "before.name" | "reason", claimClass: "source_backed" | "derived") {
  return {
    id: `evidence-archive-capability-${suffix.replace(".", "-")}`,
    sourceId: "source-alpha-canonical-repair",
    fieldPath: `operations.archive-capability.${suffix}`,
    claimClass,
    excerpt: `The durable fixture source supports the bounded ${suffix} conclusion for this capability archive operation.`,
    confidence: "high"
  };
}

function artifacts() {
  const candidate = buildCanonicalRepairCandidate({
    activeCapabilities: [capability],
    operations: [{
      operationId: "archive-capability",
      operation: "archive_capability",
      targetId: canonicalRepairFixtureIds.organization,
      capabilityId: canonicalRepairFixtureIds.capability,
      before: capability,
      reason: "unsupported_capability",
      dependencies: canonicalRepairEmptyCapabilityDependencies,
      evidenceIds: ["evidence-archive-capability-before-name", "evidence-archive-capability-reason"],
      reviewerExplanation: "Soft-archive only this unsupported capability after its exact record and protected dependency state are verified."
    }],
    evidence: [
      operationEvidence("before.name", "source_backed"),
      operationEvidence("reason", "derived")
    ]
  });
  const batch = researchCandidateBatchV2Schema.parse({
    schemaVersion: "research_candidate_batch_v2",
    batchId: "canonical-repair-snapshot-batch",
    runId,
    title: "Canonical repair snapshot fixture batch",
    status: "candidate",
    createdAt: completedAt,
    selectedGap: {
      coverageView: "supply",
      dimension: "canonical repair fixture",
      reason: "The fixture verifies exact private snapshot parity before canonical repair review intake.",
      score: 1000
    },
    sourceLeadBatchPath: `research/ingestion/source-leads-v2/${runId}.json`,
    guardrailNotes: ["This fixture permits no canonical write, acceptance, or publication outside separate governed actions."],
    candidates: [candidate],
    deferred: []
  });
  const snapshot = canonicalOrganizationRepairSnapshotV1Schema.parse({
    schemaVersion: "canonical_organization_repair_snapshot_v1",
    runId,
    capturedAt: completedAt,
    targets: [{
      ...candidate.beforeRecord,
      organizationDependencies: {
        ...canonicalRepairEmptyOrganizationDependencies,
        activeCapabilityIds: [canonicalRepairFixtureIds.capability]
      },
      capabilityDependencies: [{
        capabilityId: canonicalRepairFixtureIds.capability,
        dependencies: canonicalRepairEmptyCapabilityDependencies
      }],
      publicationBlockers: {
        savedCollectionItemIds: [],
        activeConnectionRequestIds: [],
        activeSubmissionIds: [],
        incomingRedirectIds: []
      }
    }]
  });
  const run = researchRunSchema.parse({
    schemaVersion: "research_run_v1",
    runId,
    agentVersion: "tnm-research-pipeline/1.8.0",
    trigger: "manual",
    mode: "canonical_repair",
    scope: { geography: "canada_first", organizationKinds: ["company"], missionAreaSlugs: [], technicalDomainSlugs: [], demandIssuerTypes: [] },
    selectedGap: batch.selectedGap,
    status: "completed",
    osintArtifactsRequired: true,
    startedAt,
    completedAt,
    limits: { totalMinutes: 120, sourceBookMinutes: 15, maxQualifiedLeads: 1, maxCandidates: 1, minimumProspects: 1, minimumSourceLanes: 2, targetCandidates: 1 },
    sourceQueries: ["Alpha Systems official legal identity Canada"],
    counters: { sourcesChecked: 2, leadsQualified: 1, leadsDeferred: 0, candidatesCreated: 1, duplicatesBlocked: 0, prospectsDiscovered: 1, uniqueProspects: 1, prospectsQueued: 0, recoveryAttempts: 0, sourceLanesSearched: 2, candidatesGreen: 1, candidatesAmber: 0, claimsCollected: 2, claimsConflicted: 0, coverageSubjects: 1 },
    validation: { passed: true, errors: [], warnings: [] },
    errors: [],
    stopReason: "The exact canonical repair fixture completed with no protected references.",
    outputs: {
      collectionPlan: `research/ingestion/collection-plans-v1/${runId}.json`,
      claimLedger: `research/ingestion/claim-ledgers-v1/${runId}.json`,
      canonicalRepairSnapshot: `research/ingestion/local/canonical-repair-snapshots-v1/${runId}.json`,
      prospectInventory: `research/ingestion/prospect-inventories-v1/${runId}.json`,
      signalBatch: null,
      sourceLeadBatch: `research/ingestion/source-leads-v2/${runId}.json`,
      candidateBatch: `research/ingestion/candidate-batches-v2/${runId}.json`,
      reviewPacket: null,
      stagingExport: null
    }
  });
  return { run, batch, snapshot };
}

describe("canonical organization repair snapshot", () => {
  it("requires deterministic exact inventory and dependency structure", () => {
    const { snapshot } = artifacts();
    expect(canonicalOrganizationRepairSnapshotV1Schema.safeParse(snapshot).success).toBe(true);

    const inconsistent = structuredClone(snapshot);
    inconsistent.targets[0].organizationDependencies.activeCapabilityIds = [];
    expect(canonicalOrganizationRepairSnapshotV1Schema.safeParse(inconsistent).success).toBe(false);

    const unknownField = { ...structuredClone(snapshot), internalNote: "must not be serialized" };
    expect(canonicalOrganizationRepairSnapshotV1Schema.safeParse(unknownField).success).toBe(false);
  });

  it("orders multi-target snapshots by slug without imposing random UUID order", () => {
    const { snapshot } = artifacts();
    const secondTarget = structuredClone(snapshot.targets[0]);
    secondTarget.organization.id = "00000000-0000-4000-8000-000000000001";
    secondTarget.organization.slug = "zeta-systems";
    secondTarget.organization.name = "Zeta Systems";
    const multiTarget = { ...snapshot, targets: [snapshot.targets[0], secondTarget] };

    expect(canonicalOrganizationRepairSnapshotV1Schema.safeParse(multiTarget).success).toBe(true);

    const duplicateIdentity = structuredClone(multiTarget);
    duplicateIdentity.targets[1].organization.id = duplicateIdentity.targets[0].organization.id;
    expect(canonicalOrganizationRepairSnapshotV1Schema.safeParse(duplicateIdentity).success).toBe(false);

    const wrongSlugOrder = { ...multiTarget, targets: [...multiTarget.targets].reverse() };
    expect(canonicalOrganizationRepairSnapshotV1Schema.safeParse(wrongSlugOrder).success).toBe(false);
  });

  it("fails closed on stale baselines, dependency drift, and protected references", () => {
    const { run, batch, snapshot } = artifacts();
    const issues = (candidateBatch = batch, exactSnapshot = snapshot) => canonicalRepairSnapshotParityIssues({
      run,
      batch: candidateBatch,
      snapshot: exactSnapshot,
      targetSlugs: ["alpha-systems"]
    });
    expect(issues()).toEqual([]);

    const stale = structuredClone(batch);
    const staleCandidate = stale.candidates.find((candidate) => candidate.candidateKind === "organization_canonical_repair_bundle");
    if (!staleCandidate) throw new Error("Fixture canonical repair candidate is missing.");
    staleCandidate.beforeRecord.organization.updatedAt = "2026-09-04T12:00:01.000Z";
    expect(issues(stale).some((issue) => issue.includes("does not preserve the exact organization, alias, and capability snapshot"))).toBe(true);

    const dependencyDrift = structuredClone(batch);
    const dependencyCandidate = dependencyDrift.candidates.find((candidate) => candidate.candidateKind === "organization_canonical_repair_bundle");
    if (!dependencyCandidate) throw new Error("Fixture canonical repair candidate is missing.");
    const archive = dependencyCandidate.operations[0];
    if (archive.operation !== "archive_capability") throw new Error("Fixture archive operation is missing.");
    archive.dependencies.activeMissionMatchIds = [canonicalRepairFixtureIds.successor];
    expect(issues(dependencyDrift).some((issue) => issue.includes("does not preserve the exact dependency snapshot"))).toBe(true);

    const blocked = structuredClone(snapshot);
    blocked.targets[0].publicationBlockers.savedCollectionItemIds = [canonicalRepairFixtureIds.successor];
    expect(issues(batch, blocked).some((issue) => issue.includes("blocked by protected production references"))).toBe(true);
  });

  it("passes the exact private snapshot through the single complete finalizer gate", () => {
    const { run, batch } = artifacts();
    const plan = buildResearchFinalizePlan({
      runPath: `research/ingestion/runs/${runId}.json`,
      run,
      candidatePath: run.outputs.candidateBatch as string,
      batch,
      mode: "check-only"
    });
    const validate = plan.steps.find((step) => step.id === "validate");

    expect(validate?.args).toContain(run.outputs.canonicalRepairSnapshot);
    expect(plan.steps).toHaveLength(1);
  });

  it("keeps the portable snapshot schema strict and compilable", async () => {
    const { snapshot } = artifacts();
    const schema = JSON.parse(await readFile(path.resolve("../research/ingestion/schema/canonical-organization-repair-snapshot-v1.schema.json"), "utf8"));
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    expect(validate(snapshot), JSON.stringify(validate.errors)).toBe(true);
    expect(validate({ ...snapshot, unexpected: true })).toBe(false);
  });
});
