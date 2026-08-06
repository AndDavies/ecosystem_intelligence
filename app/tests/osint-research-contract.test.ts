import { describe, expect, it } from "vitest";
import {
  osintCollectionLaneValues,
  osintCoverageDimensionValues,
  researchClaimLedgerQualityIssues,
  researchClaimLedgerV1Schema,
  researchCollectionPlanV1Schema
} from "@/lib/research/pipeline-schema";
import {
  buildOsintEventFingerprint,
  buildSourceIndependenceKey,
  canonicalizeOsintUrl,
  normalizeOsintAlias,
  normalizeProcurementIdentifier
} from "@/lib/research/osint-normalization";

const timestamp = "2026-07-30T12:00:00.000Z";

function collectionPlan() {
  return {
    schemaVersion: "research_collection_plan_v1",
    planId: "osint-test-plan",
    runId: "osint-test-run",
    createdAt: timestamp,
    status: "complete",
    intelligenceRequirement: "Resolve granular Canadian identity, technology, deployment, procurement, demand, relationship, and contradiction claims for reviewer decisions.",
    targetSubjects: [{ subjectId: "sample-company", subjectType: "organization", name: "Sample Technologies Inc.", aliases: ["Sample Technologies"], canonicalIdentifiers: ["sample.ca"] }],
    priorityQuestions: [
      { questionId: "identity", subjectType: "organization", question: "What is the canonical identity and active Canadian operating presence?", targetFieldPaths: ["organization.description"], evidenceThreshold: "one_anchor" },
      { questionId: "technology", subjectType: "technology", question: "What are the supported technical specifications, applications, interfaces, and maturity?", targetFieldPaths: ["capabilities.sample.summary"], evidenceThreshold: "anchor_plus_independent_corroboration" },
      { questionId: "activity", subjectType: "signal", question: "Which dated contracts, procurement events, deployments, and partnerships materially change the record?", targetFieldPaths: ["organization.profileData"], evidenceThreshold: "anchor_plus_independent_corroboration" }
    ],
    collectionLanes: osintCollectionLaneValues.map((lane) => ({
      lane,
      purpose: `Search the ${lane} lane for durable material claims and explicit negative results.`,
      sourcePosture: lane === "authenticated_discovery_feed" ? "discovery_only" : "evidence_anchor",
      queryPatterns: [`Sample Canada ${lane}`, `Sample Canada français ${lane}`],
      expectedClaims: ["identity and technical detail"]
    })),
    languagePlan: { languages: ["en", "fr"], frenchSearchRequired: true, exceptionReason: null },
    coverageDimensions: [...osintCoverageDimensionValues],
    stopConditions: [
      "Stop only after every dossier dimension has a supported state or documented attempt.",
      "Stop only after two complementary lanes produce low or zero new material claims."
    ],
    prohibitedActions: ["social_interaction", "access_control_bypass", "personal_data_collection", "canonical_database_write", "candidate_approval_or_publication"]
  };
}

function claimLedger() {
  const claim = {
    claimId: "sample-company-description",
    subjectId: "sample-company",
    subjectType: "organization",
    predicate: "operates",
    value: "Develops a Canadian maritime sensing system.",
    unit: null,
    material: true,
    temporal: { observedAt: timestamp, publishedAt: timestamp, effectiveFrom: null, effectiveTo: null },
    source: {
      sourceId: "sample-product-source",
      originalUrl: "https://sample.ca/product?utm_source=newsletter",
      canonicalUrl: "https://sample.ca/product",
      locator: "Product overview, first section",
      sourceChannel: "official_company",
      sourceFamily: "official product documentation",
      sourcePosture: "evidence_anchor",
      independenceKey: "host:sample.ca"
    },
    status: "supported",
    independentClaimIds: [],
    contradictsClaimIds: [],
    supersedesClaimIds: [],
    disposition: "candidate_field",
    candidateTargets: [{ candidateId: "sample-company", fieldPath: "organization.description", operationId: null }],
    analystNote: "The official product page directly supports this bounded description."
  };
  return {
    schemaVersion: "research_claim_ledger_v1",
    ledgerId: "osint-test-ledger",
    runId: "osint-test-run",
    createdAt: timestamp,
    completedAt: timestamp,
    status: "complete",
    claims: [claim],
    subjects: [{
      subjectId: "sample-company",
      subjectType: "organization",
      name: "Sample Technologies Inc.",
      candidateIds: ["sample-company"],
      coverage: osintCoverageDimensionValues.map((dimension) => ({
        dimension,
        status: dimension === "offering_mandate" ? "covered" : "not_applicable",
        claimIds: dimension === "offering_mandate" ? [claim.claimId] : [],
        attempts: dimension === "offering_mandate" ? [] : ["The dimension was assessed against the scoped collection plan."],
        note: dimension === "offering_mandate" ? "The official product source covers this dimension." : "This fixture marks the dimension not applicable after assessment."
      })),
      saturation: { additionalSearchYield: "low", newClaimsFromLastTwoLanes: 1, stopReason: "Two complementary fixture lanes produced no additional material claim requiring a candidate field." }
    }],
    warnings: []
  };
}

describe("OSINT research contracts", () => {
  it("requires complete coverage vectors and bilingual collection plans", () => {
    expect(researchCollectionPlanV1Schema.safeParse(collectionPlan()).success).toBe(true);
    const incomplete = structuredClone(collectionPlan());
    incomplete.coverageDimensions.pop();
    expect(researchCollectionPlanV1Schema.safeParse(incomplete).success).toBe(false);
  });

  it("rejects discovery-only content as supported field evidence", () => {
    expect(researchClaimLedgerV1Schema.safeParse(claimLedger()).success).toBe(true);
    const socialOnly = structuredClone(claimLedger());
    socialOnly.claims[0].source.sourceChannel = "linkedin_chrome";
    socialOnly.claims[0].source.sourcePosture = "discovery_only";
    expect(researchClaimLedgerV1Schema.safeParse(socialOnly).success).toBe(false);
  });

  it("requires explicit contradiction links", () => {
    const conflicted = structuredClone(claimLedger());
    conflicted.claims[0].status = "conflicted";
    expect(researchClaimLedgerV1Schema.safeParse(conflicted).success).toBe(false);
  });

  it("rejects generic, operation-wide, and multi-field claims in the pipeline 1.5 quality gate", () => {
    const ledger = researchClaimLedgerV1Schema.parse(claimLedger());
    ledger.claims[0].predicate = "has a material published-record enrichment";
    ledger.claims[0].candidateTargets = [
      { candidateId: "sample-company", fieldPath: "operations.refresh.after", operationId: "refresh" },
      { candidateId: "sample-company", fieldPath: "organization.description", operationId: null }
    ];
    const issues = researchClaimLedgerQualityIssues(ledger);
    expect(issues).toContain("Claim sample-company-description uses the generic predicate 'has a material published-record enrichment'.");
    expect(issues).toContain("Claim sample-company-description must target exactly one candidate leaf field.");
    expect(issues).toContain("Claim sample-company-description targets the operation-wide path 'operations.refresh.after' instead of a leaf field.");
    expect(issues).toContain("Claim ledger osint-test-ledger completedAt must be later than createdAt.");
  });

  it("normalizes aliases, URLs, and procurement identifiers deterministically", () => {
    expect(normalizeOsintAlias("Échantillon Technologies, Inc." )).toBe("echantillon technologies");
    expect(normalizeProcurementIdentifier(" cw 2428966 — a ")).toBe("CW2428966-A");
    expect(canonicalizeOsintUrl("https://www.sample.ca/product/?utm_source=mail&b=2&a=1#details"))
      .toBe("https://sample.ca/product?a=1&b=2");
  });

  it("collapses repeated event reporting without pretending syndicated sources are independent", () => {
    const event = {
      eventType: "contract_or_award",
      actors: ["Sample Technologies Inc.", "Department of National Defence"],
      programOrTechnology: "Maritime Sensor",
      procurementIdentifier: "CW-1234",
      effectiveDate: "2026-07-30"
    };
    expect(buildOsintEventFingerprint({ ...event, canonicalUrls: ["https://sample.ca/news/award"] }))
      .toBe(buildOsintEventFingerprint({ ...event, canonicalUrls: ["https://publication.example/story"] }));
    expect(buildSourceIndependenceKey("https://wire.example/release", "release-123"))
      .toBe(buildSourceIndependenceKey("https://mirror.example/release", "release-123"));
  });
});
