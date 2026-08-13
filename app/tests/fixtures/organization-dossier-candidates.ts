const reviewedAt = "2026-08-09T13:00:00.000Z";

function commonCandidate(candidateId: string, fieldPaths: string[]) {
  return {
    candidateId,
    sourceLeadIds: [`${candidateId}-lead`],
    confidence: "high" as const,
    reviewStatus: "candidate_pending" as const,
    reviewerRationale: "Coverage value: This fixture adds a bounded dossier field to the reviewed public corpus. Evidence: One durable official source supports every proposed public leaf. Mission/Public Need read: No unreviewed demand claim is created. Unknowns: Unsupported optional facts remain null. Reviewer action: Verify the cited leaf mapping before acceptance and publication.",
    duplicateCheck: {
      status: "clear" as const,
      checkedAt: reviewedAt,
      methods: ["canonical_url", "website_domain", "slug"] as const,
      matches: [],
      note: "No duplicate was found in the published or pending organization corpus."
    },
    sources: [{
      id: `${candidateId}-source`,
      title: "Official bounded dossier fixture source",
      url: `https://fixtures.truenorthmap.ca/${candidateId}`,
      publisher: "True North Map Test Fixture",
      sourceKind: "official_organization_profile" as const,
      publishedAt: "2026-08-01T12:00:00.000Z",
      accessedAt: reviewedAt,
      locator: "Public organization and capability sections",
      summary: "The fixture source represents a durable public record used only in the isolated migration test database."
    }],
    fieldEvidence: fieldPaths.map((fieldPath, index) => ({
      id: `${candidateId}-evidence-${index + 1}`,
      sourceId: `${candidateId}-source`,
      fieldPath,
      claimClass: "source_backed" as "source_backed" | "derived",
      excerpt: `The fixture source supports the bounded public value at ${fieldPath}.`,
      confidence: "high" as const
    }))
  };
}

export function buildMinimalOrganizationV3Candidate() {
  const candidateId = "candidate-dossier-v3-fixture";
  const fieldPaths = [
    "organization.name",
    "organization.description",
    "organization.websiteUrl",
    "organization.entityKind",
    "organization.categories.0",
    "organization.primaryLocation.city",
    "organization.primaryLocation.provinceTerritory",
    "organization.primaryLocation.countryCode",
    "organization.primaryLocation.latitude",
    "organization.primaryLocation.longitude",
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
  return {
    schemaVersion: "organization_bundle_v3" as const,
    candidateKind: "organization_bundle" as const,
    ...commonCandidate(candidateId, fieldPaths),
    organization: {
      slug: "dossier-v3-fixture",
      name: "Dossier V3 Fixture",
      legalName: null,
      aliases: [],
      description: "Dossier V3 Fixture is a Canadian sensing company used to verify the isolated reviewed publication path.",
      websiteUrl: "https://fixtures.truenorthmap.ca/dossier-v3-fixture",
      entityKind: "company" as const,
      categories: ["commercial_company" as const],
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
      currentActivity: null,
      currentActivityAsOf: null,
      operatingContext: null,
      canadianFootprint: null,
      reviewedQuestions: [],
      profileData: {}
    },
    capabilities: [{
      slug: "dossier-v3-sensing-fixture",
      name: "Dossier sensing fixture",
      summary: "The fixture capability combines documented public sensing inputs in a bounded operator-facing workflow.",
      capabilityType: "Sensing integration software",
      features: ["Multi-sensor integration"],
      applications: ["Maritime monitoring"],
      technicalTags: ["sensor integration"],
      technicalDomainSlugs: ["sensing-and-isr"],
      missionMatches: [],
      technologyReadinessLevel: null,
      maturity: null,
      commercialAvailability: null
    }],
    programParticipations: [{
      program: {
        slug: "dossier-v3-test-programme",
        name: "Dossier V3 Test Programme",
        programType: "demonstration programme",
        operatorName: "Test Programme Operator",
        websiteUrl: "https://fixtures.truenorthmap.ca/dossier-v3-test-programme",
        summary: "The fixture programme provides a documented public path for testing Canadian sensing-integration technology."
      },
      participation: {
        participationType: "selected participant",
        cohortLabel: null,
        publicSummary: "Dossier V3 Fixture is a selected participant responsible for one documented sensing-integration workstream.",
        lifecycleStage: "testing" as const,
        announcedOn: "2026-07-15",
        startedOn: "2026-08-01",
        endedOn: null,
        externalIdentifiers: [{ kind: "project" as const, value: "TNM-V3-FIXTURE" }]
      }
    }],
    fundingEvents: [{
      eventType: "public grant",
      announcedOn: "2026-07-15",
      amountValue: 125000,
      amountCurrency: "CAD",
      disclosedSummary: "The fixture record discloses a one-hundred-and-twenty-five-thousand-dollar public integration grant."
    }],
    relationships: [{
      relatedOrganizationName: "Test Programme Operator",
      relationshipType: "programme_operator",
      publicSummary: "The Test Programme Operator runs the public programme in which Dossier V3 Fixture participates.",
      relatedOrganizationSlug: null
    }]
  };
}

export function buildMinimalOrganizationRefreshV2Candidate(input: {
  organizationId: string;
  baselineUpdatedAt: string;
  candidateId?: string;
  operation?: "set_field" | "delete_child";
  field?: "operating_context" | "profile_data";
}) {
  const candidateId = input.candidateId ?? "candidate-dossier-refresh-v2-fixture";
  const common = commonCandidate(candidateId, ["operations.set-operating-context.after"]);
  const evidenceId = common.fieldEvidence[0].id;
  return {
    schemaVersion: "organization_refresh_bundle_v2" as const,
    candidateKind: "organization_refresh_bundle" as const,
    ...common,
    targetMatch: {
      entityType: "organization" as const,
      entityId: input.organizationId,
      slug: "dossier-v3-fixture",
      matchMethods: ["slug" as const],
      confidence: "high" as const,
      baselineUpdatedAt: input.baselineUpdatedAt
    },
    beforeRecord: {
      organization: {
        id: input.organizationId,
        slug: "dossier-v3-fixture",
        entity_kind: "company",
        updated_at: input.baselineUpdatedAt
      }
    },
    operations: [{
      operationId: "set-operating-context",
      operation: input.operation ?? "set_field",
      entityType: "organization" as const,
      targetId: input.organizationId,
      field: input.field ?? "operating_context",
      before: null,
      after: "The fixture company operates a bounded Canadian sensing-integration workflow for public migration testing.",
      evidenceIds: [evidenceId],
      leafEvidence: [{ fieldPath: "after", evidenceIds: [evidenceId] }],
      reviewerExplanation: "Add one source-backed operating-context leaf while preserving every unrelated organization field."
    }],
    sourceChannels: ["official_company" as const],
    signalIds: [`${candidateId}-signal`],
    corroboration: []
  };
}

export function buildStagingCandidate(proposedRecord: ReturnType<typeof buildMinimalOrganizationV3Candidate> | ReturnType<typeof buildMinimalOrganizationRefreshV2Candidate>) {
  const isRefresh = proposedRecord.candidateKind === "organization_refresh_bundle";
  return {
    client_candidate_id: proposedRecord.candidateId,
    candidate_kind: proposedRecord.candidateKind,
    schema_version: proposedRecord.schemaVersion,
    source_lead_ids: proposedRecord.sourceLeadIds,
    target_entity_type: "organization",
    target_entity_id: isRefresh ? proposedRecord.targetMatch.entityId : null,
    proposed_record: proposedRecord,
    before_record: isRefresh ? proposedRecord.beforeRecord : {},
    field_evidence: proposedRecord.fieldEvidence,
    duplicate_check: proposedRecord.duplicateCheck,
    confidence: proposedRecord.confidence,
    status: "pending",
    staged_at: reviewedAt
  };
}

export const dossierFixtureResearchRun = {
  client_run_id: "tnm-dossier-contract-fixtures-2026-08-09",
  run_type: "manual",
  scope: { geography: "canada_first", purpose: "isolated dossier publication contract fixture" },
  selected_gap: { coverageView: "supply", dimension: "organization-dossier-v3", reason: "Verify the accepted dossier publication contract in isolation.", score: 1000 },
  status: "completed",
  started_at: "2026-08-09T12:55:00.000Z",
  completed_at: reviewedAt,
  agent_version: "tnm-research-pipeline/1.6.0",
  source_queries: [],
  counters: { sourcesChecked: 1, candidatesCreated: 1 },
  validation_results: { passed: true, errors: [], warnings: [] },
  stop_reason: "The isolated publication fixture completed."
};
