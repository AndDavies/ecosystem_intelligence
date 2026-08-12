import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  organizationBundleV3Schema,
  organizationRefreshBundleV2Schema,
  refreshCandidateBaselinePrecisionIssue
} from "../src/lib/research/pipeline-schema";
import {
  buildMinimalOrganizationRefreshV2Candidate,
  buildMinimalOrganizationV3Candidate
} from "./fixtures/organization-dossier-candidates";

const timestamp = "2026-08-09T12:00:00.123456+00:00";
const accessedAt = "2026-08-09T12:00:00.000Z";
const organizationId = "11111111-1111-4111-8111-111111111111";

function evidence(paths: string[], derivedPaths = new Set<string>()) {
  return paths.map((fieldPath, index) => ({
    id: `evidence-${index + 1}`,
    sourceId: "official-source",
    fieldPath,
    claimClass: derivedPaths.has(fieldPath) ? "derived" as const : "source_backed" as const,
    excerpt: `The durable public source supports the bounded public leaf at ${fieldPath}.`,
    confidence: "high" as const
  }));
}

function candidateCommon(fieldEvidence: ReturnType<typeof evidence>) {
  return {
    candidateId: "sample-dossier-candidate",
    sourceLeadIds: ["sample-dossier-lead"],
    confidence: "high" as const,
    reviewStatus: "candidate_pending" as const,
    reviewerRationale: "Coverage value: This candidate fills a documented organization-profile gap. Evidence: Durable official evidence supports each bounded leaf. Mission/Public Need read: No new demand claim is proposed. Unknowns: Unsupported optional facts remain null. Reviewer action: Verify every leaf citation before acceptance and publication.",
    duplicateCheck: {
      status: "clear" as const,
      checkedAt: accessedAt,
      methods: ["canonical_url", "website_domain", "slug"] as const,
      matches: [],
      note: "No exact or possible duplicate was found in the current published and pending corpus."
    },
    sources: [{
      id: "official-source",
      title: "Official organization and programme record",
      url: "https://sample.ca/dossier",
      publisher: "Sample Organization",
      sourceKind: "official_organization_profile" as const,
      publishedAt: "2026-08-01T12:00:00.000Z",
      accessedAt,
      locator: "Organization, capability, programme, relationship, and funding sections",
      summary: "The official record supplies durable public evidence for the bounded organization dossier fixture."
    }],
    fieldEvidence
  };
}

function organizationV3Candidate() {
  const publicLeafPaths = [
    "organization.name",
    "organization.description",
    "organization.websiteUrl",
    "organization.entityKind",
    "organization.categories.0",
    "organization.categories.1",
    "organization.primaryLocation.city",
    "organization.primaryLocation.provinceTerritory",
    "organization.primaryLocation.countryCode",
    "organization.primaryLocation.latitude",
    "organization.primaryLocation.longitude",
    "organization.currentActivity",
    "organization.currentActivityAsOf",
    "organization.operatingContext",
    "organization.canadianFootprint",
    "organization.reviewedQuestions.0.question",
    "organization.reviewedQuestions.0.context",
    "capabilities.0.name",
    "capabilities.0.summary",
    "capabilities.0.capabilityType",
    "capabilities.0.features.0",
    "capabilities.0.applications.0",
    "capabilities.0.technicalTags.0",
    "capabilities.0.technicalDomainSlugs.0",
    "programParticipations.0.program.name",
    "programParticipations.0.program.programType",
    "programParticipations.0.program.operatorName",
    "programParticipations.0.program.websiteUrl",
    "programParticipations.0.program.summary",
    "programParticipations.0.participation.participationType",
    "programParticipations.0.participation.publicSummary",
    "programParticipations.0.participation.lifecycleStage",
    "programParticipations.0.participation.announcedOn",
    "programParticipations.0.participation.startedOn",
    "programParticipations.0.participation.externalIdentifiers.0.kind",
    "programParticipations.0.participation.externalIdentifiers.0.value",
    "fundingEvents.0.eventType",
    "fundingEvents.0.announcedOn",
    "fundingEvents.0.amountValue",
    "fundingEvents.0.amountCurrency",
    "fundingEvents.0.disclosedSummary",
    "relationships.0.relatedOrganizationName",
    "relationships.0.relationshipType",
    "relationships.0.publicSummary"
  ];
  const derivedPaths = new Set([
    "organization.reviewedQuestions.0.question",
    "organization.reviewedQuestions.0.context"
  ]);
  return {
    schemaVersion: "organization_bundle_v3" as const,
    candidateKind: "organization_bundle" as const,
    ...candidateCommon(evidence(publicLeafPaths, derivedPaths)),
    organization: {
      slug: "sample-organization",
      name: "Sample Organization",
      legalName: null,
      aliases: [],
      description: "Sample Organization develops a documented Canadian sensing platform for reviewed maritime operations.",
      websiteUrl: "https://sample.ca",
      entityKind: "company" as const,
      categories: ["commercial_company" as const, "dual_use" as const],
      primaryLocation: {
        city: "Halifax",
        provinceTerritory: "Nova Scotia",
        countryCode: "CA" as const,
        latitude: 44.6488,
        longitude: -63.5752,
        geographicConfidence: "city_centroid" as const
      },
      foundedYear: null,
      employeeRange: null,
      companyStage: null,
      ownership: null,
      commercialStatus: null,
      disclosedFinancingSummary: null,
      defencePosture: null,
      dualUsePosture: null,
      publicContact: { contactPageUrl: null, publicEmail: null, publicPhone: null, linkedInUrl: null },
      editorialProfileVersion: "organization_editorial_profile_v1" as const,
      currentActivity: "The organization published a current integration milestone for its Canadian maritime sensing platform.",
      currentActivityAsOf: "2026-08-01",
      operatingContext: "The platform is designed for integration into maritime monitoring workflows where operators combine several public sensor feeds.",
      canadianFootprint: "Engineering, integration, and customer support are publicly documented in Halifax, Nova Scotia.",
      reviewedQuestions: [{
        id: "integration-boundary",
        question: "Which integration boundary most often determines deployment readiness?",
        context: "The source describes multiple sensor interfaces but does not identify which operator-controlled dependency governs field integration.",
        confidence: "moderate" as const
      }],
      profileData: {}
    },
    capabilities: [{
      slug: "sample-maritime-sensing",
      name: "Maritime sensing integration",
      summary: "The documented platform combines public maritime sensor feeds into an operator-facing monitoring workflow.",
      capabilityType: "Maritime sensing software",
      features: ["Multi-sensor data integration"],
      applications: ["Maritime monitoring"],
      technicalTags: ["sensor fusion"],
      technicalDomainSlugs: ["mission-software-and-data"],
      missionMatches: [],
      technologyReadinessLevel: null,
      maturity: null,
      commercialAvailability: null
    }],
    programParticipations: [{
      program: {
        slug: "sample-integration-program",
        name: "Sample Integration Programme",
        programType: "demonstration programme",
        operatorName: "Sample Public Operator",
        websiteUrl: "https://sample.ca/programme",
        summary: "The programme provides a documented public pathway for integrating and demonstrating Canadian maritime technology."
      },
      participation: {
        participationType: "selected participant",
        cohortLabel: null,
        publicSummary: "Sample Organization was selected to integrate its sensing workflow within the published demonstration programme.",
        lifecycleStage: "testing" as const,
        announcedOn: "2026-06-10",
        startedOn: "2026-07-01",
        endedOn: null,
        externalIdentifiers: [{ kind: "project" as const, value: "SIP-2026-04" }]
      }
    }],
    fundingEvents: [{
      eventType: "public grant",
      announcedOn: "2026-06-10",
      amountValue: 500000,
      amountCurrency: "CAD",
      disclosedSummary: "The public operator announced a five-hundred-thousand-dollar grant supporting the documented integration project."
    }],
    relationships: [{
      relatedOrganizationName: "Sample Public Operator",
      relationshipType: "programme_operator",
      publicSummary: "The public operator runs the programme in which Sample Organization is a selected integration participant.",
      relatedOrganizationSlug: null
    }]
  };
}

function organizationRefreshV2Candidate() {
  const fieldEvidence = evidence(["operations.set-operating-context.after"]);
  return {
    schemaVersion: "organization_refresh_bundle_v2" as const,
    candidateKind: "organization_refresh_bundle" as const,
    ...candidateCommon(fieldEvidence),
    targetMatch: {
      entityType: "organization" as const,
      entityId: organizationId,
      slug: "sample-organization",
      matchMethods: ["slug" as const, "website_domain" as const],
      confidence: "high" as const,
      baselineUpdatedAt: timestamp
    },
    beforeRecord: {
      organization: {
        id: organizationId,
        slug: "sample-organization",
        entity_kind: "company",
        current_activity: null,
        current_activity_as_of: null,
        updated_at: timestamp
      }
    },
    operations: [{
      operationId: "set-operating-context",
      operation: "set_field" as const,
      entityType: "organization" as const,
      targetId: organizationId,
      field: "operating_context" as const,
      before: null,
      after: "The organization operates a bounded Canadian sensing-integration workflow supported by a durable official source.",
      evidenceIds: [fieldEvidence[0].id],
      leafEvidence: [{ fieldPath: "after", evidenceIds: [fieldEvidence[0].id] }],
      reviewerExplanation: "Add the source-backed operating context without changing the arbitrary profile JSON object."
    }],
    sourceChannels: ["official_company" as const],
    signalIds: ["sample-current-activity-signal"],
    corroboration: []
  };
}

describe("organization dossier research contracts", () => {
  it("validates the same minimal v3/v2 fixtures used by isolated publication tests", () => {
    const organization = organizationBundleV3Schema.parse(buildMinimalOrganizationV3Candidate());
    expect(organization.organization.editorialProfileVersion).toBe("organization_editorial_profile_v1");

    const refresh = buildMinimalOrganizationRefreshV2Candidate({
      organizationId,
      baselineUpdatedAt: timestamp
    });
    expect(organizationRefreshBundleV2Schema.safeParse(refresh).success).toBe(true);
  });

  it("accepts a fully evidenced v3 dossier with narrative, programme, funding, and relationship leaves", () => {
    const parsed = organizationBundleV3Schema.safeParse(organizationV3Candidate());
    expect(parsed.success, parsed.success ? undefined : JSON.stringify(parsed.error.issues, null, 2)).toBe(true);
  });

  it("fails a v3 dossier when a public leaf loses evidence", () => {
    const candidate = organizationV3Candidate();
    candidate.fieldEvidence = candidate.fieldEvidence.filter((item) => item.fieldPath !== "programParticipations.0.participation.lifecycleStage");
    const parsed = organizationBundleV3Schema.safeParse(candidate);
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.issues.some((issue) => issue.message.includes("lifecycleStage"))).toBe(true);
  });

  it("requires reviewed questions to be specific and mapped as derived assessments", () => {
    const generic = organizationV3Candidate();
    generic.organization.reviewedQuestions[0].question = "What remains unknown and what should the team research further?";
    expect(organizationBundleV3Schema.safeParse(generic).success).toBe(false);

    const sourceFact = organizationV3Candidate();
    const questionEvidence = sourceFact.fieldEvidence.find((item) => item.fieldPath.endsWith("reviewedQuestions.0.question"));
    if (!questionEvidence) throw new Error("Fixture question evidence is missing.");
    questionEvidence.claimClass = "source_backed";
    expect(organizationBundleV3Schema.safeParse(sourceFact).success).toBe(false);
  });

  it("accepts safe v2 leaf updates and preserves the exact timestamp baseline", () => {
    const candidate = organizationRefreshBundleV2Schema.parse(organizationRefreshV2Candidate());
    expect(refreshCandidateBaselinePrecisionIssue(candidate)).toBeNull();

    candidate.targetMatch.baselineUpdatedAt = "2026-08-09T12:00:00.123Z";
    expect(refreshCandidateBaselinePrecisionIssue(candidate)).toContain("byte-for-byte");
  });

  it("rejects a refresh whose resulting current activity and date are not paired", () => {
    const missingDate = structuredClone(organizationRefreshV2Candidate()) as Record<string, unknown> & {
      beforeRecord: { organization: Record<string, unknown> };
      operations: Array<Record<string, unknown>>;
    };
    missingDate.beforeRecord.organization.current_activity = "The legacy record carries undated activity copy that needs a review-safe correction.";
    missingDate.beforeRecord.organization.current_activity_as_of = null;
    missingDate.operations[0] = {
      ...missingDate.operations[0],
      operationId: "set-current-activity",
      field: "current_activity",
      before: missingDate.beforeRecord.organization.current_activity,
      after: "A durable source describes a current event, but no exact event or publication date supports an as-of value."
    };
    const result = organizationRefreshBundleV2Schema.safeParse(missingDate);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.message.includes("published or cleared together"))).toBe(true);

    const cleared = structuredClone(missingDate);
    cleared.operations[0].after = null;
    expect(organizationRefreshBundleV2Schema.safeParse(cleared).success).toBe(true);

    const paired = structuredClone(missingDate);
    paired.operations.push({
      ...paired.operations[0],
      operationId: "set-current-activity-as-of",
      field: "current_activity_as_of",
      before: null,
      after: "2026-08-12"
    });
    expect(organizationRefreshBundleV2Schema.safeParse(paired).success).toBe(true);
  });

  it("rejects missing leaf evidence, deletes, and whole-profile replacement", () => {
    const missingLeaf = organizationRefreshV2Candidate();
    missingLeaf.operations[0].leafEvidence[0].fieldPath = "after.unrelated";
    expect(organizationRefreshBundleV2Schema.safeParse(missingLeaf).success).toBe(false);

    const deleteOperation = organizationRefreshV2Candidate() as Record<string, unknown> & { operations: Array<Record<string, unknown>> };
    deleteOperation.operations[0] = { ...deleteOperation.operations[0], operation: "delete_child" };
    expect(organizationRefreshBundleV2Schema.safeParse(deleteOperation).success).toBe(false);

    const wholeProfile = organizationRefreshV2Candidate() as Record<string, unknown> & { operations: Array<Record<string, unknown>> };
    wholeProfile.operations[0] = { ...wholeProfile.operations[0], field: "profile_data" };
    expect(organizationRefreshBundleV2Schema.safeParse(wholeProfile).success).toBe(false);
  });

  it("requires a complete typed child snapshot before an in-place refresh", () => {
    const candidate = organizationRefreshV2Candidate();
    const capability = organizationV3Candidate().capabilities[0];
    const capabilitySnapshot = {
      name: capability.name,
      summary: capability.summary,
      capabilityType: capability.capabilityType,
      features: capability.features,
      applications: capability.applications,
      technicalTags: capability.technicalTags,
      technicalDomainSlugs: capability.technicalDomainSlugs,
      missionMatches: capability.missionMatches,
      technologyReadinessLevel: capability.technologyReadinessLevel,
      maturity: capability.maturity,
      commercialAvailability: capability.commercialAvailability
    };
    const evidenceId = candidate.fieldEvidence[0].id;
    const leafPaths = [
      "after.name",
      "after.summary",
      "after.capabilityType",
      "after.features.0",
      "after.applications.0",
      "after.technicalTags.0",
      "after.technicalDomainSlugs.0"
    ];
    candidate.operations = [{
      operationId: "update-capability",
      operation: "update_child" as const,
      entityType: "capability" as const,
      parentId: organizationId,
      targetId: "22222222-2222-4222-8222-222222222222",
      before: capabilitySnapshot,
      after: { ...capabilitySnapshot, summary: "The refreshed capability remains the same stable technology record with one reviewed public summary update." },
      evidenceIds: [evidenceId],
      leafEvidence: leafPaths.map((fieldPath) => ({ fieldPath, evidenceIds: [evidenceId] })),
      reviewerExplanation: "Update the stable capability only after comparing the complete reviewed child snapshot with the locked live record."
    } as unknown as typeof candidate.operations[0]];
    expect(organizationRefreshBundleV2Schema.safeParse(candidate).success).toBe(true);

    const incomplete = structuredClone(candidate) as Record<string, unknown> & { operations: Array<Record<string, unknown>> };
    incomplete.operations[0].before = { name: capabilitySnapshot.name, summary: capabilitySnapshot.summary };
    expect(organizationRefreshBundleV2Schema.safeParse(incomplete).success).toBe(false);
  });

  it("keeps type-specific profile updates inside the company allowlist", () => {
    const allowed = organizationRefreshV2Candidate();
    allowed.operations = [{
      operationId: allowed.operations[0].operationId,
      operation: "set_profile_field" as const,
      entityType: "organization" as const,
      targetId: organizationId,
      profileField: "portfolioScope",
      before: null,
      after: "The company publicly documents a bounded portfolio of maritime sensing integration products.",
      evidenceIds: allowed.operations[0].evidenceIds,
      leafEvidence: allowed.operations[0].leafEvidence,
      reviewerExplanation: allowed.operations[0].reviewerExplanation
    } as unknown as typeof allowed.operations[0]];
    const parsed = organizationRefreshBundleV2Schema.safeParse(allowed);
    expect(parsed.success, parsed.success ? undefined : JSON.stringify(parsed.error.issues, null, 2)).toBe(true);

    const disallowed = structuredClone(allowed) as Record<string, unknown> & { operations: Array<Record<string, unknown>> };
    disallowed.operations[0].profileField = "mandate";
    expect(organizationRefreshBundleV2Schema.safeParse(disallowed).success).toBe(false);
  });

  it("keeps the portable schema aligned on latest versions, safe operations, and review bounds", async () => {
    const portable = JSON.parse(await readFile(path.resolve("../research/ingestion/schema/research-candidate-batch-v2.schema.json"), "utf8"));
    expect(portable.$defs.organizationBundleV3.allOf[1].properties.schemaVersion.const).toBe("organization_bundle_v3");
    expect(portable.$defs.organizationRefreshBundleV2.allOf[1].properties.schemaVersion.const).toBe("organization_refresh_bundle_v2");
    expect(portable.$defs.refreshOperationV2.properties.operation.enum).toEqual(["set_field", "set_profile_field", "add_child", "update_child"]);
    expect(portable.$defs.organizationBundleV3.allOf[1].properties.organization.properties.reviewedQuestions.maxItems).toBe(4);
    expect(portable.$defs.organizationBundleV3.allOf[1].properties.organization.properties.reviewedQuestions.items.$ref).toBe("#/$defs/reviewedQuestionV3");
    expect(portable.$defs.reviewedQuestionV3.properties.question).toMatchObject({ minLength: 20, maxLength: 280 });
    expect(portable.$defs.programmeParticipationDetailsV3.properties.externalIdentifiers.maxItems).toBe(10);
    expect(portable.$defs.refreshOperationV2.properties.field.enum).not.toContain("profile_data");
    expect(portable.$defs.refreshOperationV2.oneOf.map((operation: { properties: { operation: { const: string } } }) => operation.properties.operation.const)).toEqual(["set_field", "set_profile_field", "add_child", "update_child"]);
  });
});
