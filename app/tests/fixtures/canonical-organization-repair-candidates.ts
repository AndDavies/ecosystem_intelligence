const reviewedAt = "2026-09-04T12:00:00.000Z";

export const canonicalRepairFixtureIds = {
  organization: "11111111-1111-4111-8111-111111111111",
  successor: "22222222-2222-4222-8222-222222222222",
  alias: "33333333-3333-4333-8333-333333333333",
  capability: "44444444-4444-4444-8444-444444444444"
} as const;

export const canonicalRepairEmptyCapabilityDependencies = {
  activeDomainKeys: [],
  activeMissionMatchIds: [],
  activeClusterKeys: [],
  activeDemandMatchIds: [],
  activeMediaAssetIds: [],
  signalRecordLinkIds: [],
  wikiPageRecordLinkIds: []
};

export const canonicalRepairEmptyOrganizationDependencies = {
  ...canonicalRepairEmptyCapabilityDependencies,
  activeAliasIds: [],
  activeLocationLinkIds: [],
  activeCapabilityIds: [],
  activeProgramParticipationIds: [],
  activeRelationshipIds: [],
  activeFundingEventIds: [],
  incomingActiveRelationshipIds: []
};

function identitySnapshot(overrides: Record<string, unknown> = {}) {
  return {
    id: String(canonicalRepairFixtureIds.organization),
    slug: "alpha-systems",
    name: "Alpha Systems",
    legalName: "Alpha Systems Inc.",
    websiteUrl: "https://alpha.example/",
    entityKind: "company",
    organizationCategories: ["commercial_company"],
    profileData: {
      portfolioScope: "Alpha Systems develops a bounded test capability for the isolated repair fixture."
    },
    publicationStatus: "published",
    updatedAt: reviewedAt,
    ...overrides
  };
}

function source() {
  return {
    id: "source-alpha-canonical-repair",
    title: "Official Alpha Systems identity and lifecycle record",
    url: "https://alpha.example/about",
    publisher: "Alpha Systems",
    sourceKind: "official_organization_profile",
    publishedAt: "2026-09-01T12:00:00.000Z",
    accessedAt: reviewedAt,
    locator: "Identity and corporate-status section",
    summary: "The official record establishes the current organization identity and the bounded facts used by this isolated canonical-repair fixture."
  };
}

function evidence(operationId: string, suffix: string, claimClass: "source_backed" | "derived") {
  return {
    id: `evidence-${operationId}-${suffix.replaceAll(".", "-").replaceAll(/[A-Z]/g, (value) => `-${value.toLowerCase()}`)}`,
    sourceId: "source-alpha-canonical-repair",
    fieldPath: `operations.${operationId}.${suffix}`,
    claimClass,
    excerpt: `The official fixture record supports the bounded ${suffix.replaceAll(".", " ")} repair and its stated canonical-review limit.`,
    confidence: "high"
  };
}

type RepairOperation = Record<string, unknown> & { operationId: string; evidenceIds: string[] };

export function buildCanonicalRepairCandidate(input: {
  candidateId?: string;
  organization?: Record<string, unknown>;
  activeAliases?: Array<Record<string, unknown>>;
  activeCapabilities?: Array<Record<string, unknown>>;
  operations?: RepairOperation[];
  evidence?: Array<Record<string, unknown>>;
} = {}) {
  const organization = identitySnapshot(input.organization);
  const operationId = "rename-alpha";
  const operations = input.operations ?? [{
    operationId,
    operation: "set_organization_identity",
    targetId: canonicalRepairFixtureIds.organization,
    before: organization,
    after: {
      name: "Alpha Defence Systems",
      legalName: "Alpha Systems Inc.",
      websiteUrl: "https://alpha.example/",
      entityKind: "company",
      organizationCategories: ["commercial_company"]
    },
    formerNameAlias: "Alpha Systems",
    evidenceIds: [
      "evidence-rename-alpha-after-name",
      "evidence-rename-alpha-former-name-alias"
    ],
    reviewerExplanation: "Rename the organization while preserving its stable public slug and exact former canonical name as a reviewed alias."
  }];
  const fieldEvidence: Array<Record<string, unknown>> = input.evidence ?? [
    evidence(operationId, "after.name", "source_backed"),
    evidence(operationId, "formerNameAlias", "source_backed")
  ];
  const candidateId = input.candidateId ?? "candidate-alpha-canonical-repair";
  return {
    schemaVersion: "organization_canonical_repair_bundle_v1",
    candidateKind: "organization_canonical_repair_bundle",
    candidateId,
    sourceLeadIds: ["lead-alpha-canonical-repair"],
    confidence: "high",
    reviewStatus: "candidate_pending",
    reviewerRationale: "Coverage value: Alpha Systems needs one set organization identity repair so its stable public dossier names the current organization. Evidence: 1 durable source from Alpha Systems supports each operation-scoped leaf. Mission/Public Need read: No new canonical relationship is created, transferred, or reparented. Unknowns: No hard delete is proposed and unsupported facts remain unchanged. Reviewer action: A human must verify the exact snapshot and accept this one repair before a separate individual Publish action.",
    duplicateCheck: {
      status: "clear",
      checkedAt: reviewedAt,
      methods: ["canonical_url", "slug", "legal_name"],
      matches: [],
      note: "The exact target and proposed identity were checked against names, aliases, slugs, and canonical websites."
    },
    sources: [source()],
    fieldEvidence,
    targetMatch: {
      entityType: "organization",
      entityId: String(canonicalRepairFixtureIds.organization),
      slug: "alpha-systems",
      matchMethods: ["slug"],
      confidence: "high",
      baselineUpdatedAt: reviewedAt
    },
    beforeRecord: {
      organization,
      activeAliases: input.activeAliases ?? [],
      activeCapabilities: input.activeCapabilities ?? []
    },
    operations
  };
}

export function canonicalRepairStagingRun(clientRunId = "tnm-canonical-repair-fixture") {
  return {
    client_run_id: clientRunId,
    run_type: "manual",
    research_mode: "canonical_repair",
    scope: {
      geography: "canada_first",
      organizationKinds: ["company"],
      missionAreaSlugs: [],
      technicalDomainSlugs: [],
      demandIssuerTypes: []
    },
    selected_gap: {
      coverageView: "supply",
      dimension: "canonical identity",
      reason: "The published record has a verified identity or lifecycle defect that ordinary enrichment cannot safely express.",
      score: 100
    },
    status: "completed",
    started_at: "2026-09-04T11:45:00.000Z",
    completed_at: reviewedAt,
    agent_version: "tnm-research-pipeline/1.8.0",
    source_queries: ["Alpha Systems official identity"],
    counters: { candidatesPrepared: 1 },
    validation_results: { passed: true },
    stop_reason: "Exact canonical repair fixture completed."
  };
}

export function canonicalRepairStagingChange(candidate = buildCanonicalRepairCandidate()) {
  return {
    client_candidate_id: candidate.candidateId,
    candidate_kind: candidate.candidateKind,
    schema_version: candidate.schemaVersion,
    source_lead_ids: candidate.sourceLeadIds,
    target_entity_type: "organization",
    target_entity_id: candidate.targetMatch.entityId,
    proposed_record: candidate,
    before_record: candidate.beforeRecord,
    field_evidence: candidate.fieldEvidence,
    duplicate_check: candidate.duplicateCheck,
    reviewer_rationale: candidate.reviewerRationale,
    confidence: candidate.confidence,
    status: "pending",
    staged_at: reviewedAt
  };
}
