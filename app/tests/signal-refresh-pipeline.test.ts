import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { organizationRefreshBundleV1Schema, refreshCandidateBaselinePrecisionIssue, researchRunCompletionIssues, researchRunSchema, researchSignalBatchV1Schema } from "../src/lib/research/pipeline-schema";
import { canonicalizeSignalUrl, consolidateSignals, signalFingerprint, splitCompositeSignalText } from "../src/lib/research/signal-processing";

const timestamp = "2026-07-23T12:00:00.000Z";
const organizationId = "622647bd-e3e6-4caa-a56d-08dee4a61f05";

function refreshCandidate() {
  return {
    schemaVersion: "organization_refresh_bundle_v1",
    candidateKind: "organization_refresh_bundle",
    candidateId: "sample-organization-refresh",
    sourceLeadIds: ["sample-record-refresh-lead"],
    confidence: "moderate",
    reviewStatus: "candidate_pending",
    reviewerRationale: "This refresh adds a newly documented technology to an existing Canadian organization using a durable official product page. Review the capability details, target match, field evidence, and additive operation before publication.",
    reviewTier: "green",
    inclusionScore: 90,
    completenessScore: 82,
    reviewWarnings: [],
    duplicateCheck: { status: "clear", checkedAt: timestamp, methods: ["canonical_url", "website_domain", "slug"], matches: [], note: "The intended organization target is resolved and no accidental entity conflict was found." },
    sources: [{ id: "official-product-source", title: "Official new technology product announcement", url: "https://example.ca/products/new-system", publisher: "Example Canada", sourceKind: "official_company_product", publishedAt: timestamp, accessedAt: timestamp, locator: "Product overview", summary: "The official product page describes the new system, its technical features, and its intended defence applications." }],
    fieldEvidence: [{ id: "new-system-evidence", sourceId: "official-product-source", fieldPath: "operations.add-new-system.value.summary", claimClass: "source_backed", excerpt: "The official product page describes a new autonomous system with mission-planning and sensor-integration features.", confidence: "moderate" }],
    targetMatch: { entityType: "organization", entityId: organizationId, slug: "sample-organization", matchMethods: ["slug", "website_domain"], confidence: "high", baselineUpdatedAt: timestamp },
    beforeRecord: { organization: { id: organizationId, slug: "sample-organization", updated_at: timestamp }, capabilities: [] },
    operations: [{ operationId: "add-new-system", operation: "add_child", entityType: "capability", parentId: organizationId, value: { slug: "sample-new-system", name: "Sample New System", summary: "A newly documented autonomous system with mission planning and sensor integration for defence applications.", capabilityType: "autonomous system", features: ["Mission planning", "Sensor integration"], applications: ["Defence operations"], technicalTags: ["autonomy"], technicalDomainSlugs: ["mission-software-and-data"], missionMatches: [] }, evidenceIds: ["new-system-evidence"], reviewerExplanation: "Add the official product as a new capability while preserving the existing organization and all current capabilities." }],
    sourceChannels: ["official_company", "gmail_newsletter"],
    signalIds: ["sample-product-launch"],
    corroboration: [{ claim: "The company publicly launched the named system and describes its technical functions.", sourceIds: ["official-product-source"] }]
  };
}

describe("multi-source signal refresh", () => {
  it("extracts atomic stories and strips tracking from canonical URLs", async () => {
    const fixtures = JSON.parse(await readFile(path.resolve("tests/fixtures/signal-source-items.json"), "utf8"));
    expect(splitCompositeSignalText(fixtures.multiStoryNewsletter.content)).toHaveLength(2);
    expect(canonicalizeSignalUrl("https://www.Example.ca/news/item/?utm_source=mail&gclid=123#section")).toBe("https://example.ca/news/item");
  });

  it("collapses repeated events across channels while preserving distinct fingerprints", () => {
    const common = { organization: "Example Canada", technology: "New System", eventDate: "2026-07-23", signalType: "contract_or_award", canonicalUrls: ["https://canada.ca/contracts/example-award"] };
    const fingerprint = signalFingerprint(common);
    expect(consolidateSignals([{ channel: "gmail", fingerprint }, { channel: "linkedin", fingerprint }, { channel: "official", fingerprint }])).toHaveLength(1);
    expect(signalFingerprint({ ...common, signalType: "technology_update" })).not.toBe(fingerprint);
  });

  it("keeps signal artifacts mode-neutral while requiring durable evidence resolution", () => {
    const signal = {
      signalId: "sample-product-launch", fingerprint: "a".repeat(64), sourceChannel: "gmail_newsletter", sourceFamily: "newsletter",
      discoveryOrigin: { url: null, gmailMessageId: "message-1", gmailThreadId: "thread-1", linkedinUrl: null },
      extracted: { organization: "Example Canada", technology: "New System", program: null, issuer: null, eventDate: "2026-07-23", amount: null, details: "A newsletter reported a new product launch and linked to the official product page." },
      redirectUrls: [] as string[], canonicalUrls: [] as string[], signalType: "technology_launch", canonicalEvidenceStatus: "unresolved",
      liveEntityMatches: [], intendedOutcomes: ["organization_refresh"], recoveryAttempts: [], warnings: [], disposition: "qualified", deferralRationale: null
    };
    const batch = { schemaVersion: "research_signal_batch_v1", signalBatchId: "sample-signals", runId: "sample-refresh-run", createdAt: timestamp, watermarkStart: "2026-07-16T12:00:00.000Z", watermarkEnd: timestamp, sourceFamilyCounters: { official_company: 1 }, warnings: [], signals: [signal] };
    expect(researchSignalBatchV1Schema.safeParse(batch).success).toBe(false);
    signal.canonicalEvidenceStatus = "resolved";
    signal.canonicalUrls = ["https://example.ca/products/new-system"];
    expect(researchSignalBatchV1Schema.safeParse(batch).success).toBe(true);
  });

  it("retains the four-family breadth gate for completed ordinary refresh runs", () => {
    const run = researchRunSchema.parse({
      schemaVersion: "research_run_v1",
      runId: "sample-refresh-run",
      agentVersion: "tnm-research-pipeline/1.7.2",
      trigger: "manual",
      mode: "refresh_batch",
      scope: { geography: "canada_first", organizationKinds: ["company"], missionAreaSlugs: [], technicalDomainSlugs: [], demandIssuerTypes: [] },
      selectedGap: { coverageView: "supply", dimension: "material-change-watchlist", reason: "Inspect the published watchlist for supported material changes.", score: 900 },
      status: "completed",
      osintArtifactsRequired: true,
      startedAt: "2026-07-23T11:00:00.000Z",
      completedAt: timestamp,
      limits: { totalMinutes: 180, sourceBookMinutes: 10, maxQualifiedLeads: 50, maxCandidates: 50, minimumProspects: 1, minimumSourceLanes: 4, targetCandidates: 50 },
      sourceQueries: [],
      counters: { sourcesChecked: 3, leadsQualified: 0, leadsDeferred: 0, candidatesCreated: 0, duplicatesBlocked: 0, sourceFamiliesSearched: 3, signalsExtracted: 1, signalsDispositioned: 1, claimsCollected: 0, claimsConflicted: 0, coverageSubjects: 0 },
      underTargetReason: null,
      exhaustionEvidence: null,
      validation: { passed: true, errors: [], warnings: [] },
      errors: [],
      stopReason: "Every inspected signal was dispositioned without a review candidate.",
      outputs: { collectionPlan: "research/plan.json", claimLedger: "research/claims.json", prospectInventory: null, signalBatch: "research/signals.json", sourceLeadBatch: "research/leads.json", candidateBatch: "research/candidates.json", reviewPacket: null, stagingExport: null }
    });
    expect(researchRunCompletionIssues(run)).toContain("Refresh batch sample-refresh-run searched fewer than four source families.");
    run.counters.sourceFamiliesSearched = 4;
    expect(researchRunCompletionIssues(run)).not.toContain("Refresh batch sample-refresh-run searched fewer than four source families.");
  });

  it("validates an additive existing-record refresh with explicit evidence", () => {
    expect(organizationRefreshBundleV1Schema.safeParse(refreshCandidate()).success).toBe(true);
    const invalid = refreshCandidate();
    invalid.operations[0].evidenceIds = ["missing-evidence"];
    const parsed = organizationRefreshBundleV1Schema.safeParse(invalid);
    expect(parsed.success).toBe(true);
    const candidate = parsed.success ? parsed.data : null;
    expect(candidate?.operations[0].operation).toBe("add_child");
  });

  it("requires the live updated_at timestamp to be copied without losing precision", () => {
    const candidate = refreshCandidate();
    candidate.beforeRecord.organization.updated_at = "2026-07-23T12:00:00.645435+00:00";
    candidate.targetMatch.baselineUpdatedAt = "2026-07-23T12:00:00.645Z";
    const parsed = organizationRefreshBundleV1Schema.parse(candidate);
    expect(refreshCandidateBaselinePrecisionIssue(parsed)).toContain("changed timestamp precision");

    candidate.targetMatch.baselineUpdatedAt = candidate.beforeRecord.organization.updated_at;
    expect(refreshCandidateBaselinePrecisionIssue(organizationRefreshBundleV1Schema.parse(candidate))).toBeNull();
  });

  it("rejects refresh operations that could target the wrong record or publish an incomplete child", () => {
    const wrongParent = refreshCandidate();
    wrongParent.operations[0].parentId = "78532d21-8dfc-470f-9526-0f98c4a57631";
    expect(organizationRefreshBundleV1Schema.safeParse(wrongParent).success).toBe(false);

    const incompleteCapability = refreshCandidate();
    incompleteCapability.operations[0].value.features = [];
    expect(organizationRefreshBundleV1Schema.safeParse(incompleteCapability).success).toBe(false);
  });

  it("keeps social and newsletter fixtures as discovery routes, not evidence anchors", async () => {
    const fixtures = JSON.parse(await readFile(path.resolve("tests/fixtures/signal-source-items.json"), "utf8"));
    expect(fixtures.linkedinCompanyPost.disposition).toBe("qualified_after_canonical_resolution");
    expect(fixtures.promotedLinkedinItem.disposition).toBe("irrelevant");
    expect(fixtures.companyNewsroomLaunch.channel).toBe("official_company");
    expect(fixtures.governmentMarketplace.requirements).toHaveLength(2);
  });
});
