import { z } from "zod";

export const organizationKindValues = [
  "company",
  "accelerator",
  "incubator",
  "research_test_centre",
  "investor_funder",
  "ecosystem_organization",
  "government_innovation_office"
] as const;

export const organizationCategoryValues = [
  "commercial_company",
  "defence_supplier",
  "dual_use",
  "venture_capital",
  "corporate_venture",
  "public_funder",
  "dual_use_accelerator",
  "ocean_technology",
  "university_affiliated",
  "test_range",
  "research_lab",
  "cluster_operator",
  "industry_association",
  "government_program_operator"
] as const;

export const demandIssuerTypeValues = [
  "alliance",
  "federal_government",
  "department",
  "armed_forces",
  "military_service",
  "procurement_authority",
  "research_innovation_agency",
  "public_program"
] as const;

export const demandSourceKindValues = [
  "strategic_policy",
  "capability_plan",
  "innovation_challenge",
  "funding_program",
  "procurement_notice",
  "award_or_contract",
  "official_problem_statement"
] as const;

export const sourceKindValues = [
  "official_company_product",
  "official_company_news",
  "accelerator_cohort_directory",
  "incubator_program_directory",
  "investor_portfolio",
  "research_centre_profile",
  "official_organization_profile",
  "government_service_page",
  "innovation_program",
  "procurement_notice",
  "award_or_contract",
  "official_policy",
  "official_report",
  "association_directory",
  "event_directory",
  "reputable_industry_publication"
] as const;

export const publicDemandCaveat = "Public-source alignment only. This is not procurement eligibility, endorsement, customer interest, or a classified requirement." as const;

const slugSchema = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const httpsUrlSchema = z.string().url().startsWith("https://");
const confidenceSchema = z.enum(["high", "moderate", "needs_review"]);
const discoveryLaneSchema = z.enum([
  "official_directory",
  "corporate_registry",
  "patent_ip",
  "proactive_disclosure",
  "lobbying_registry",
  "government_awards",
  "government_program",
  "procurement",
  "accelerator_cohort",
  "investor_portfolio",
  "industry_association",
  "conference_directory",
  "company_newsroom",
  "technical_documentation",
  "customer_partner",
  "bilingual_web",
  "broad_web"
]);
export const signalSourceChannelValues = [
  "official_company",
  "government_procurement",
  "source_book",
  "ecosystem_program",
  "industry_publication",
  "gmail_newsletter",
  "linkedin_chrome",
  "other_discovery"
] as const;
export const signalTypeValues = [
  "technology_launch",
  "technology_update",
  "contract_or_award",
  "procurement_notice",
  "marketplace_or_supply_arrangement",
  "government_project",
  "partnership_or_consortium",
  "financing_or_ownership_event",
  "program_or_cohort_participation",
  "official_demand_statement"
] as const;
const signalSourceChannelSchema = z.enum(signalSourceChannelValues);
const signalTypeSchema = z.enum(signalTypeValues);
const nullableDateTimeSchema = z.string().datetime().nullable();

export const osintSubjectTypeValues = [
  "organization",
  "technology",
  "demand",
  "signal",
  "program",
  "relationship"
] as const;

export const osintCoverageDimensionValues = [
  "identity_ownership",
  "canadian_presence",
  "offering_mandate",
  "technical_specifications",
  "maturity_deployment",
  "customers_contracts_programs",
  "procurement_demand",
  "partnerships_financing",
  "public_contacts",
  "current_activity",
  "source_diversity",
  "contradictions"
] as const;

export const osintCollectionLaneValues = [
  "official_site",
  "technical_documents",
  "corporate_registry",
  "patent_ip",
  "government_procurement",
  "proactive_disclosure",
  "customer_partner_program",
  "industry_publication",
  "ecosystem_directory",
  "authenticated_discovery_feed",
  "bilingual_public_web"
] as const;

const osintSubjectTypeSchema = z.enum(osintSubjectTypeValues);
const osintCoverageDimensionSchema = z.enum(osintCoverageDimensionValues);
const osintCollectionLaneSchema = z.enum(osintCollectionLaneValues);
const osintSourcePostureSchema = z.enum(["evidence_anchor", "strong_corroboration", "discovery_only"]);

export const researchCollectionPlanV1Schema = z.object({
  schemaVersion: z.literal("research_collection_plan_v1"),
  planId: slugSchema,
  runId: slugSchema,
  createdAt: z.string().datetime(),
  status: z.enum(["active", "complete"]),
  intelligenceRequirement: z.string().trim().min(40).max(3000),
  targetSubjects: z.array(z.object({
    subjectId: slugSchema,
    subjectType: osintSubjectTypeSchema,
    name: z.string().trim().min(2).max(240),
    aliases: z.array(z.string().trim().min(2).max(240)).max(30),
    canonicalIdentifiers: z.array(z.string().trim().min(2).max(500)).max(30)
  })).max(75),
  priorityQuestions: z.array(z.object({
    questionId: slugSchema,
    subjectType: osintSubjectTypeSchema,
    question: z.string().trim().min(20).max(1000),
    targetFieldPaths: z.array(z.string().trim().min(3).max(300)).min(1).max(20),
    evidenceThreshold: z.enum(["one_anchor", "anchor_plus_independent_corroboration"])
  })).min(3).max(30),
  collectionLanes: z.array(z.object({
    lane: osintCollectionLaneSchema,
    purpose: z.string().trim().min(20).max(1000),
    sourcePosture: osintSourcePostureSchema,
    queryPatterns: z.array(z.string().trim().min(3).max(500)).min(1).max(30),
    expectedClaims: z.array(z.string().trim().min(5).max(300)).min(1).max(20)
  })).min(3).max(osintCollectionLaneValues.length),
  languagePlan: z.object({
    languages: z.array(z.enum(["en", "fr"])).min(1).max(2),
    frenchSearchRequired: z.boolean(),
    exceptionReason: z.string().trim().min(20).max(1000).nullable()
  }),
  coverageDimensions: z.array(osintCoverageDimensionSchema).length(osintCoverageDimensionValues.length),
  stopConditions: z.array(z.string().trim().min(20).max(1000)).min(2).max(20),
  prohibitedActions: z.array(z.enum([
    "social_interaction",
    "access_control_bypass",
    "personal_data_collection",
    "canonical_database_write",
    "candidate_approval_or_publication"
  ])).min(5)
}).superRefine((plan, context) => {
  const unique = <T>(values: T[]) => new Set(values).size === values.length;
  if (!unique(plan.priorityQuestions.map((question) => question.questionId))) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Collection-plan question IDs must be unique.", path: ["priorityQuestions"] });
  }
  if (!unique(plan.collectionLanes.map((lane) => lane.lane))) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Collection-plan lanes must be unique.", path: ["collectionLanes"] });
  }
  if (!unique(plan.coverageDimensions) || osintCoverageDimensionValues.some((dimension) => !plan.coverageDimensions.includes(dimension))) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Collection plan must include every OSINT coverage dimension exactly once.", path: ["coverageDimensions"] });
  }
  if (plan.languagePlan.frenchSearchRequired && !plan.languagePlan.languages.includes("fr")) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "French-required collection plans must include fr.", path: ["languagePlan", "languages"] });
  }
  if (!plan.languagePlan.frenchSearchRequired && !plan.languagePlan.exceptionReason) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "A collection plan that omits French search needs a reason.", path: ["languagePlan", "exceptionReason"] });
  }
});

const researchClaimSchema = z.object({
  claimId: slugSchema,
  subjectId: slugSchema,
  subjectType: osintSubjectTypeSchema,
  predicate: z.string().trim().min(3).max(240),
  value: z.string().trim().min(1).max(4000),
  unit: z.string().trim().min(1).max(120).nullable(),
  material: z.boolean(),
  temporal: z.object({
    observedAt: z.string().datetime(),
    publishedAt: nullableDateTimeSchema,
    effectiveFrom: nullableDateTimeSchema,
    effectiveTo: nullableDateTimeSchema
  }),
  source: z.object({
    sourceId: slugSchema,
    originalUrl: httpsUrlSchema,
    canonicalUrl: httpsUrlSchema,
    locator: z.string().trim().min(2).max(500),
    sourceChannel: signalSourceChannelSchema,
    sourceFamily: z.string().trim().min(3).max(120),
    sourcePosture: osintSourcePostureSchema,
    independenceKey: z.string().trim().min(3).max(500)
  }),
  status: z.enum(["supported", "corroborated", "conflicted", "superseded", "discovery_only", "unresolved"]),
  independentClaimIds: z.array(slugSchema).max(20),
  contradictsClaimIds: z.array(slugSchema).max(20),
  supersedesClaimIds: z.array(slugSchema).max(20),
  disposition: z.enum(["candidate_field", "review_warning", "deferred_backlog", "rejected"]),
  candidateTargets: z.array(z.object({
    candidateId: slugSchema,
    fieldPath: z.string().trim().min(3).max(300),
    operationId: slugSchema.nullable()
  })).max(30),
  analystNote: z.string().trim().min(10).max(2000)
}).superRefine((claim, context) => {
  if (claim.source.sourcePosture === "discovery_only" && !["discovery_only", "unresolved"].includes(claim.status)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Discovery-only sources cannot support or corroborate a field claim.", path: ["status"] });
  }
  if (claim.status === "corroborated" && claim.independentClaimIds.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Corroborated claims need at least one independent claim.", path: ["independentClaimIds"] });
  }
  if (claim.status === "conflicted" && claim.contradictsClaimIds.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Conflicted claims need an explicit contradiction link.", path: ["contradictsClaimIds"] });
  }
  if (claim.status === "superseded" && claim.supersedesClaimIds.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Superseded claims need an explicit supersession link.", path: ["supersedesClaimIds"] });
  }
  if (claim.disposition === "candidate_field" && claim.candidateTargets.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Candidate-field claims need a candidate target.", path: ["candidateTargets"] });
  }
  if (claim.material && claim.candidateTargets.length === 0 && !["review_warning", "deferred_backlog", "rejected"].includes(claim.disposition)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Every material claim needs a candidate target or explicit non-field disposition.", path: ["disposition"] });
  }
});

export const researchClaimLedgerV1Schema = z.object({
  schemaVersion: z.literal("research_claim_ledger_v1"),
  ledgerId: slugSchema,
  runId: slugSchema,
  createdAt: z.string().datetime(),
  completedAt: nullableDateTimeSchema,
  status: z.enum(["collecting", "complete"]),
  claims: z.array(researchClaimSchema).max(500),
  subjects: z.array(z.object({
    subjectId: slugSchema,
    subjectType: osintSubjectTypeSchema,
    name: z.string().trim().min(2).max(240),
    candidateIds: z.array(slugSchema).max(20),
    coverage: z.array(z.object({
      dimension: osintCoverageDimensionSchema,
      status: z.enum(["covered", "partial", "not_found", "not_applicable"]),
      claimIds: z.array(slugSchema).max(100),
      attempts: z.array(z.string().trim().min(10).max(1000)).max(20),
      note: z.string().trim().min(10).max(1000)
    })).length(osintCoverageDimensionValues.length),
    saturation: z.object({
      additionalSearchYield: z.enum(["high", "medium", "low", "zero"]),
      newClaimsFromLastTwoLanes: z.number().int().min(0).max(500),
      stopReason: z.string().trim().min(20).max(1000)
    })
  })).max(75),
  warnings: z.array(z.string().trim().min(10).max(1000)).max(100)
}).superRefine((ledger, context) => {
  const claimIds = new Set(ledger.claims.map((claim) => claim.claimId));
  if (claimIds.size !== ledger.claims.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Claim IDs must be unique.", path: ["claims"] });
  }
  ledger.claims.forEach((claim, index) => {
    for (const linkedId of [...claim.independentClaimIds, ...claim.contradictsClaimIds, ...claim.supersedesClaimIds]) {
      if (!claimIds.has(linkedId)) context.addIssue({ code: z.ZodIssueCode.custom, message: `Claim ${claim.claimId} links to missing claim ${linkedId}.`, path: ["claims", index] });
    }
  });
  ledger.subjects.forEach((subject, subjectIndex) => {
    const dimensions = subject.coverage.map((item) => item.dimension);
    if (new Set(dimensions).size !== dimensions.length || osintCoverageDimensionValues.some((dimension) => !dimensions.includes(dimension))) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `Subject ${subject.subjectId} must assess every coverage dimension exactly once.`, path: ["subjects", subjectIndex, "coverage"] });
    }
    subject.coverage.forEach((item, coverageIndex) => {
      if (["covered", "partial"].includes(item.status) && item.claimIds.length === 0) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Covered or partial dimensions need claim IDs.", path: ["subjects", subjectIndex, "coverage", coverageIndex, "claimIds"] });
      }
      if (item.claimIds.some((claimId) => !claimIds.has(claimId))) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Coverage references a missing claim.", path: ["subjects", subjectIndex, "coverage", coverageIndex, "claimIds"] });
      }
    });
  });
  if (ledger.status === "complete" && !ledger.completedAt) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Completed claim ledgers need completedAt.", path: ["completedAt"] });
  }
});

const sourceSchema = z.object({
  id: slugSchema,
  title: z.string().trim().min(8).max(500),
  url: httpsUrlSchema,
  publisher: z.string().trim().min(2).max(240),
  sourceKind: z.enum(sourceKindValues),
  publishedAt: nullableDateTimeSchema,
  accessedAt: z.string().datetime(),
  locator: z.string().trim().min(2).max(500),
  summary: z.string().trim().min(40).max(4000)
});

const fieldEvidenceSchema = z.object({
  id: slugSchema,
  sourceId: slugSchema,
  fieldPath: z.string().trim().min(3).max(300),
  claimClass: z.enum(["source_backed", "derived"]),
  excerpt: z.string().trim().min(30).max(1000),
  confidence: confidenceSchema
});

const duplicateFingerprintSchema = z.object({
  canonicalUrl: httpsUrlSchema,
  websiteDomain: z.string().trim().min(3).max(255).nullable(),
  stableSlug: slugSchema,
  legalName: z.string().trim().min(2).max(240).nullable(),
  aliases: z.array(z.string().trim().min(2).max(240)).max(20)
});

const duplicateCheckSchema = z.object({
  status: z.enum(["clear", "possible_match", "exact_duplicate"]),
  checkedAt: z.string().datetime(),
  methods: z.array(z.enum(["canonical_url", "website_domain", "slug", "legal_name", "alias", "fuzzy_name"]))
    .min(3),
  matches: z.array(z.object({
    id: z.string().trim().min(1),
    name: z.string().trim().min(1),
    matchedBy: z.string().trim().min(2)
  })),
  note: z.string().trim().min(10).max(1000)
});

const leadCommon = {
  id: slugSchema,
  source: sourceSchema,
  discoveryPath: z.array(httpsUrlSchema).min(1).max(20),
  possibleMissionAreaSlugs: z.array(slugSchema),
  possibleTechnicalDomainSlugs: z.array(slugSchema),
  sourceConfidence: confidenceSchema,
  alignmentConfidence: confidenceSchema,
  evidenceLocator: z.string().trim().min(2).max(500),
  duplicateFingerprint: duplicateFingerprintSchema,
  followUpQuestions: z.array(z.string().trim().min(5).max(500)).max(20),
  discoveryLane: discoveryLaneSchema.optional(),
  inclusionScore: z.number().int().min(0).max(100).optional(),
  completenessScore: z.number().int().min(0).max(100).optional(),
  reviewWarnings: z.array(z.string().trim().min(10).max(500)).max(20).optional(),
  deferralClass: z.enum(["hard_stop", "recovery_exhausted"]).optional(),
  recoveryAttempts: z.array(z.object({
    lane: discoveryLaneSchema,
    url: httpsUrlSchema,
    outcome: z.string().trim().min(20).max(1000)
  })).max(10).optional(),
  disposition: z.enum(["qualified", "deferred", "rejected"]),
  doNotIngestReason: z.string().trim().min(20).max(1000).nullable()
};

const organizationLeadSchema = z.object({
  leadType: z.literal("organization_lead"),
  ...leadCommon,
  organizationName: z.string().trim().min(2).max(240),
  proposedKind: z.enum(organizationKindValues),
  proposedCategories: z.array(z.enum(organizationCategoryValues)).min(1),
  websiteUrl: httpsUrlSchema,
  aliases: z.array(z.string().trim().min(2).max(240)).max(20),
  location: z.object({
    city: z.string().trim().min(1).max(160).nullable(),
    provinceTerritory: z.string().trim().min(1).max(160).nullable(),
    countryCode: z.string().length(2)
  }),
  candidateCapabilityName: z.string().trim().min(2).max(240).nullable(),
  roleSpecificEvidence: z.string().trim().min(40).max(4000)
});

const demandSignalLeadSchema = z.object({
  leadType: z.literal("demand_signal_lead"),
  ...leadCommon,
  title: z.string().trim().min(8).max(500),
  issuerNames: z.array(z.string().trim().min(2).max(240)).min(1),
  demandSourceKind: z.enum(demandSourceKindValues),
  commitmentLevel: z.enum(["directional", "programmatic", "procurement"]),
  candidateRequirements: z.array(z.string().trim().min(30).max(1000)).min(1).max(20)
});

const programLeadSchema = z.object({
  leadType: z.literal("program_lead"),
  ...leadCommon,
  programName: z.string().trim().min(2).max(240),
  operatorName: z.string().trim().min(2).max(240),
  programType: z.string().trim().min(3).max(120),
  dates: z.object({
    startsOn: z.string().date().nullable(),
    endsOn: z.string().date().nullable()
  }),
  participationEvidence: z.string().trim().min(40).max(4000)
});

const relationshipLeadSchema = z.object({
  leadType: z.literal("relationship_lead"),
  ...leadCommon,
  subjectName: z.string().trim().min(2).max(240),
  objectName: z.string().trim().min(2).max(240),
  relationshipType: z.string().trim().min(3).max(120),
  publicSummary: z.string().trim().min(40).max(4000)
});

const targetMatchSchema = z.object({
  entityType: z.enum(["organization", "capability", "demand_source", "demand_requirement"]),
  entityId: z.string().uuid(),
  slug: slugSchema,
  matchMethods: z.array(z.enum(["canonical_url", "website_domain", "slug", "legal_name", "alias", "name", "parent_relationship"])).min(1),
  confidence: z.enum(["high", "moderate"]),
  baselineUpdatedAt: z.string().datetime({ offset: true })
});

const recordRefreshLeadSchema = z.object({
  leadType: z.literal("record_refresh_lead"),
  ...leadCommon,
  targetMatch: targetMatchSchema,
  signalIds: z.array(slugSchema).min(1).max(50),
  refreshSummary: z.string().trim().min(40).max(4000),
  intendedChanges: z.array(z.string().trim().min(10).max(500)).min(1).max(30)
});

export const typedSourceLeadSchema = z.discriminatedUnion("leadType", [
  organizationLeadSchema,
  demandSignalLeadSchema,
  programLeadSchema,
  relationshipLeadSchema,
  recordRefreshLeadSchema
]);

export const sourceLeadBatchV2Schema = z.object({
  schemaVersion: z.literal("source_lead_batch_v2"),
  leadBatchId: slugSchema,
  runId: slugSchema,
  createdAt: z.string().datetime(),
  scope: z.object({
    description: z.string().trim().min(40).max(2000),
    targetMissionAreaSlugs: z.array(slugSchema),
    targetTechnicalDomainSlugs: z.array(slugSchema),
    targetOrganizationKinds: z.array(z.enum(organizationKindValues)),
    targetDemandIssuerTypes: z.array(z.enum(demandIssuerTypeValues))
  }),
  leads: z.array(typedSourceLeadSchema).min(1).max(25)
}).superRefine((batch, context) => {
  for (const lead of batch.leads) {
    if (lead.disposition === "rejected" && !lead.doNotIngestReason) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Rejected lead ${lead.id} needs doNotIngestReason.`,
        path: ["leads", batch.leads.indexOf(lead), "doNotIngestReason"]
      });
    }
    if (lead.disposition !== "rejected" && lead.doNotIngestReason) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Only rejected leads may set doNotIngestReason.`,
        path: ["leads", batch.leads.indexOf(lead), "doNotIngestReason"]
      });
    }
    if (lead.disposition === "deferred" && lead.deferralClass === "recovery_exhausted") {
      const lanes = new Set((lead.recoveryAttempts ?? []).map((attempt) => attempt.lane));
      if (lanes.size < 3) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Deferred lead ${lead.id} needs evidence recovery across at least three source lanes.`,
          path: ["leads", batch.leads.indexOf(lead), "recoveryAttempts"]
        });
      }
    }
  }
});

export const researchProspectInventoryV1Schema = z.object({
  schemaVersion: z.literal("research_prospect_inventory_v1"),
  inventoryId: slugSchema,
  runId: slugSchema,
  createdAt: z.string().datetime(),
  scope: z.string().trim().min(40).max(2000),
  prospects: z.array(z.object({
    id: slugSchema,
    name: z.string().trim().min(2).max(240),
    proposedEntityType: z.enum(["organization", "demand_signal", "program", "relationship"]),
    proposedOrganizationKind: z.enum(organizationKindValues).nullable(),
    canonicalUrl: httpsUrlSchema.nullable(),
    discoverySourceUrl: httpsUrlSchema,
    discoveryLane: discoveryLaneSchema,
    countryCode: z.string().length(2).nullable(),
    fitSummary: z.string().trim().min(30).max(1000),
    disposition: z.enum(["queued", "selected", "rejected", "duplicate"]),
    rejectionReason: z.string().trim().min(20).max(1000).nullable(),
    recoveryAttempts: z.array(z.object({
      lane: discoveryLaneSchema,
      url: httpsUrlSchema,
      outcome: z.string().trim().min(20).max(1000)
    })).max(10)
  })).min(1).max(75)
}).superRefine((inventory, context) => {
  const ids = new Set<string>();
  for (const [index, prospect] of inventory.prospects.entries()) {
    if (ids.has(prospect.id)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `Duplicate prospect id ${prospect.id}.`, path: ["prospects", index, "id"] });
    }
    ids.add(prospect.id);
    if (["rejected", "duplicate"].includes(prospect.disposition) && !prospect.rejectionReason) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `${prospect.disposition} prospect ${prospect.id} needs a reason.`, path: ["prospects", index, "rejectionReason"] });
    }
  }
});

const missionMatchSchema = z.object({
  missionAreaSlug: slugSchema,
  alignmentSummary: z.string().trim().min(40).max(2000),
  matchClass: z.literal("derived"),
  confidence: confidenceSchema
});

const capabilitySchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(2).max(240),
  summary: z.string().trim().min(40).max(4000),
  capabilityType: z.string().trim().min(3).max(240),
  features: z.array(z.string().trim().min(2).max(500)).min(1),
  applications: z.array(z.string().trim().min(2).max(500)).min(1),
  technicalTags: z.array(z.string().trim().min(2).max(120)).min(1),
  technicalDomainSlugs: z.array(slugSchema).min(1),
  missionMatches: z.array(missionMatchSchema)
});

const programSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(2).max(240),
  programType: z.string().trim().min(3).max(120),
  websiteUrl: httpsUrlSchema,
  summary: z.string().trim().min(40).max(4000),
  cohortLabel: z.string().trim().min(1).max(120).nullable()
});

const relationshipSchema = z.object({
  relatedOrganizationName: z.string().trim().min(2).max(240),
  relationshipType: z.string().trim().min(3).max(120),
  publicSummary: z.string().trim().min(40).max(4000)
});

const candidateLogoSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.enum(["ready", "review_required"]),
    confidence: z.enum(["high", "medium"]),
    sourcePageUrl: httpsUrlSchema,
    sourceAssetUrl: httpsUrlSchema,
    selectionMethod: z.string().trim().min(2).max(240),
    sourceChecksum: z.string().regex(/^[a-f0-9]{64}$/),
    normalizedChecksum: z.string().regex(/^[a-f0-9]{64}$/),
    packetPath: z.string().trim().min(5).max(1000),
    note: z.string().trim().min(10).max(1000)
  }),
  z.object({
    status: z.literal("not_found"),
    checkedAt: z.string().datetime(),
    note: z.string().trim().min(1).max(1000)
  })
]);

const candidateCommon = {
  candidateId: slugSchema,
  sourceLeadIds: z.array(slugSchema).min(1),
  confidence: confidenceSchema,
  reviewStatus: z.literal("candidate_pending"),
  reviewerRationale: z.string().trim().min(80).max(2000),
  reviewTier: z.enum(["green", "amber"]).optional(),
  inclusionScore: z.number().int().min(0).max(100).optional(),
  completenessScore: z.number().int().min(0).max(100).optional(),
  reviewWarnings: z.array(z.string().trim().min(10).max(500)).max(20).optional(),
  duplicateCheck: duplicateCheckSchema,
  sources: z.array(sourceSchema).min(1).max(20),
  fieldEvidence: z.array(fieldEvidenceSchema).min(1).max(100)
};

export const organizationBundleV2Schema = z.object({
  schemaVersion: z.literal("organization_bundle_v2"),
  candidateKind: z.literal("organization_bundle"),
  ...candidateCommon,
  organization: z.object({
    slug: slugSchema,
    name: z.string().trim().min(2).max(240),
    legalName: z.string().trim().min(2).max(240).nullable(),
    aliases: z.array(z.string().trim().min(2).max(240)).max(20),
    description: z.string().trim().min(40).max(4000),
    websiteUrl: httpsUrlSchema,
    entityKind: z.enum(organizationKindValues),
    categories: z.array(z.enum(organizationCategoryValues)).min(1),
    primaryLocation: z.object({
      city: z.string().trim().min(1).max(160),
      provinceTerritory: z.string().trim().min(1).max(160),
      countryCode: z.literal("CA"),
      latitude: z.number().min(40).max(84),
      longitude: z.number().min(-142).max(-52),
      geographicConfidence: z.enum(["exact", "city_centroid", "regional"])
    }),
    profileData: z.record(z.string(), z.unknown())
  }),
  capabilities: z.array(capabilitySchema).max(10),
  programs: z.array(programSchema).max(20),
  relationships: z.array(relationshipSchema).max(50),
  candidateLogo: candidateLogoSchema.optional()
}).superRefine((candidate, context) => {
  const normalizedAliases = new Map<string, string>();
  candidate.organization.aliases.forEach((alias, index) => {
    const normalized = alias.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const previous = normalizedAliases.get(normalized);
    if (previous) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Alias '${alias}' duplicates '${previous}' after normalization. Keep one canonical alias.`,
        path: ["organization", "aliases", index]
      });
    } else {
      normalizedAliases.set(normalized, alias);
    }
  });
  const kind = candidate.organization.entityKind;
  const requireProfileText = (key: string, message: string) => {
    const value = candidate.organization.profileData[key];
    if (typeof value !== "string" || value.trim().length < 40) {
      context.addIssue({ code: z.ZodIssueCode.custom, message, path: ["organization", "profileData", key] });
    }
  };

  if (kind === "company" && candidate.capabilities.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Companies require at least one cited capability.", path: ["capabilities"] });
  }
  if (["accelerator", "incubator"].includes(kind) && candidate.programs.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Accelerators and incubators require a cited program or cohort.", path: ["programs"] });
  }
  if (kind === "investor_funder") {
    requireProfileText("mandate", "Investors and funders require a sourced mandate.");
    if (candidate.relationships.length === 0) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Investors and funders require public portfolio or funding evidence.", path: ["relationships"] });
    }
  }
  if (kind === "research_test_centre") {
    requireProfileText("technicalMandate", "Research and test centres require a sourced technical mandate.");
  }
  if (["ecosystem_organization", "government_innovation_office"].includes(kind)) {
    requireProfileText("mandate", "Ecosystem bodies and government innovation offices require a sourced mandate.");
    if (candidate.programs.length === 0 && candidate.relationships.length === 0) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "The organization requires a cited program or relationship.", path: ["programs"] });
    }
  }
});

export const organizationEditorialProfileVersion = "organization_editorial_profile_v1" as const;
export const programLifecycleStageValues = [
  "announced", "selected", "funded", "awarded", "contracted", "testing",
  "evaluating", "delivering", "operational", "completed", "cancelled"
] as const;
export const programExternalIdentifierKindValues = [
  "contract", "notice", "challenge", "project", "award", "other"
] as const;

export const organizationProfileFieldAllowlist = {
  company: [
    "portfolioScope", "portfolioSummary", "manufacturingModel", "intellectualProperty",
    "operatingModel", "securityPosture", "qualityCertification", "operatingUnits",
    "parentOrganization"
  ],
  accelerator: ["mandate", "cohortModel", "sectorFocus", "parentOrganization"],
  incubator: ["mandate", "cohortModel", "sectorFocus", "parentOrganization"],
  research_test_centre: [
    "technicalMandate", "institutionalRelationship", "parentOrganization", "priorityAreas",
    "testbedPlatforms", "operatingEnvironment", "secureEnvironmentRole", "strategicSectors"
  ],
  investor_funder: ["mandate", "investmentFocus", "portfolioSummary", "parentOrganization"],
  ecosystem_organization: ["mandate", "sectorFocus", "parentOrganization"],
  government_innovation_office: ["mandate", "parentOrganization", "classificationNote"]
} as const satisfies Record<(typeof organizationKindValues)[number], readonly string[]>;

const nullablePublicText = (minimum: number, maximum: number) => z.string().trim().min(minimum).max(maximum).nullable();
const publicContactSchema = z.object({
  contactPageUrl: httpsUrlSchema.nullable(),
  publicEmail: z.string().trim().email().max(320).nullable(),
  publicPhone: z.string().trim().min(3).max(80).nullable(),
  linkedInUrl: httpsUrlSchema.nullable()
}).strict();
const genericReviewedQuestionPattern = /\b(?:what remains unknown|research further|further research|more research|additional research|what (?:else )?(?:is|remains) (?:unknown|unclear)|what do we not know)\b/i;
const reviewedQuestionSchema = z.object({
  id: slugSchema.min(3).max(80),
  question: z.string().trim().min(20).max(280),
  context: z.string().trim().min(40).max(500),
  confidence: z.enum(["high", "moderate"])
}).strict().superRefine((value, context) => {
  if (genericReviewedQuestionPattern.test(`${value.question} ${value.context}`)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Reviewed questions must identify a specific decision, dependency, lifecycle ambiguity, operating constraint, or buyer/operator distinction; generic research prompts are not public dossier content.",
      path: ["question"]
    });
  }
});
const profileFieldValueSchema = z.union([
  z.string().trim().min(2).max(4000),
  z.array(z.string().trim().min(2).max(1000)).min(1).max(30)
]);
const programExternalIdentifierSchema = z.object({
  kind: z.enum(programExternalIdentifierKindValues),
  value: z.string().trim().min(1).max(160)
}).strict();
const programParticipationDetailsV3Schema = z.object({
  participationType: z.string().trim().min(2).max(120),
  cohortLabel: z.string().trim().min(1).max(120).nullable(),
  publicSummary: nullablePublicText(40, 2000),
  lifecycleStage: z.enum(programLifecycleStageValues).nullable(),
  announcedOn: z.string().date().nullable(),
  startedOn: z.string().date().nullable(),
  endedOn: z.string().date().nullable(),
  externalIdentifiers: z.array(programExternalIdentifierSchema).max(10)
}).strict();
const organizationProgramParticipationV3Schema = z.object({
  program: z.object({
    slug: slugSchema,
    name: z.string().trim().min(2).max(240),
    programType: z.string().trim().min(3).max(120),
    operatorName: z.string().trim().min(2).max(240).nullable(),
    websiteUrl: httpsUrlSchema.nullable(),
    summary: z.string().trim().min(40).max(4000)
  }).strict(),
  participation: programParticipationDetailsV3Schema
}).strict().superRefine((value, context) => {
  if (value.participation.startedOn && value.participation.endedOn
      && value.participation.endedOn < value.participation.startedOn) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Participation endedOn cannot precede startedOn.", path: ["participation", "endedOn"] });
  }
});
const capabilityV3Schema = capabilitySchema.extend({
  technologyReadinessLevel: z.number().int().min(1).max(9).nullable(),
  maturity: nullablePublicText(2, 500),
  commercialAvailability: nullablePublicText(2, 500)
}).strict();
const fundingEventV3Schema = z.object({
  eventType: z.string().trim().min(2).max(120),
  announcedOn: z.string().date().nullable(),
  amountValue: z.number().nonnegative().nullable(),
  amountCurrency: z.string().trim().length(3).toUpperCase().nullable(),
  disclosedSummary: z.string().trim().min(40).max(2000)
}).strict().superRefine((value, context) => {
  if ((value.amountValue === null) !== (value.amountCurrency === null)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Funding amount and currency must be provided together.", path: ["amountValue"] });
  }
});
const relationshipV3Schema = relationshipSchema.extend({
  relatedOrganizationSlug: slugSchema.nullable()
}).strict();

function collectPublicLeafPaths(
  value: unknown,
  prefix: string,
  paths: string[],
  excludedKeys = new Set(["id", "slug", "confidence", "matchClass", "editorialProfileVersion", "geographicConfidence"])
) {
  if (value === null || value === undefined || value === "") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectPublicLeafPaths(item, `${prefix}.${index}`, paths, excludedKeys));
    return;
  }
  if (typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      if (!excludedKeys.has(key)) collectPublicLeafPaths(item, `${prefix}.${key}`, paths, excludedKeys);
    });
    return;
  }
  paths.push(prefix);
}

function requireEvidenceForPublicLeaves(
  candidate: { fieldEvidence: Array<{ fieldPath: string }> },
  publicValues: Array<{ value: unknown; prefix: string }>,
  context: z.RefinementCtx
) {
  const evidencePaths = new Set(candidate.fieldEvidence.map((evidence) => evidence.fieldPath));
  const requiredPaths: string[] = [];
  publicValues.forEach(({ value, prefix }) => collectPublicLeafPaths(value, prefix, requiredPaths));
  requiredPaths.forEach((path) => {
    if (!evidencePaths.has(path)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `Public leaf '${path}' requires field evidence.`, path: ["fieldEvidence"] });
    }
  });
}

export const organizationBundleV3Schema = z.object({
  schemaVersion: z.literal("organization_bundle_v3"),
  candidateKind: z.literal("organization_bundle"),
  ...candidateCommon,
  fieldEvidence: z.array(fieldEvidenceSchema).min(1).max(300),
  organization: z.object({
    slug: slugSchema,
    name: z.string().trim().min(2).max(240),
    legalName: z.string().trim().min(2).max(240).nullable(),
    aliases: z.array(z.string().trim().min(2).max(240)).max(20),
    description: z.string().trim().min(40).max(4000),
    websiteUrl: httpsUrlSchema,
    entityKind: z.enum(organizationKindValues),
    categories: z.array(z.enum(organizationCategoryValues)).min(1),
    primaryLocation: z.object({
      city: z.string().trim().min(1).max(160),
      provinceTerritory: z.string().trim().min(1).max(160),
      countryCode: z.literal("CA"),
      latitude: z.number().min(40).max(84),
      longitude: z.number().min(-142).max(-52),
      geographicConfidence: z.enum(["exact", "city_centroid", "regional"])
    }).strict(),
    foundedYear: z.number().int().min(1800).max(2100).nullable(),
    employeeRange: nullablePublicText(1, 120),
    companyStage: nullablePublicText(1, 120),
    ownership: nullablePublicText(2, 500),
    commercialStatus: nullablePublicText(2, 500),
    disclosedFinancingSummary: nullablePublicText(40, 2000),
    defencePosture: nullablePublicText(20, 2000),
    dualUsePosture: nullablePublicText(20, 2000),
    publicContact: publicContactSchema,
    editorialProfileVersion: z.literal(organizationEditorialProfileVersion).nullable(),
    currentActivity: nullablePublicText(40, 4000),
    currentActivityAsOf: z.string().date().nullable(),
    operatingContext: nullablePublicText(40, 2000),
    canadianFootprint: nullablePublicText(40, 2000),
    reviewedQuestions: z.array(reviewedQuestionSchema).max(4),
    profileData: z.record(profileFieldValueSchema)
  }).strict(),
  capabilities: z.array(capabilityV3Schema).max(10),
  programParticipations: z.array(organizationProgramParticipationV3Schema).max(20),
  fundingEvents: z.array(fundingEventV3Schema).max(20),
  relationships: z.array(relationshipV3Schema).max(50),
  candidateLogo: candidateLogoSchema.optional()
}).strict().superRefine((candidate, context) => {
  const organization = candidate.organization;
  const evidenceByPath = new Map<string, typeof candidate.fieldEvidence>();
  candidate.fieldEvidence.forEach((evidence) => {
    const current = evidenceByPath.get(evidence.fieldPath) ?? [];
    current.push(evidence);
    evidenceByPath.set(evidence.fieldPath, current);
  });
  const aliases = new Set<string>();
  organization.aliases.forEach((alias, index) => {
    const normalized = alias.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (aliases.has(normalized)) context.addIssue({ code: z.ZodIssueCode.custom, message: "Aliases must be unique after normalization.", path: ["organization", "aliases", index] });
    aliases.add(normalized);
  });
  const questionIds = new Set<string>();
  organization.reviewedQuestions.forEach((question, index) => {
    if (questionIds.has(question.id)) context.addIssue({ code: z.ZodIssueCode.custom, message: "Reviewed question IDs must be unique.", path: ["organization", "reviewedQuestions", index, "id"] });
    questionIds.add(question.id);
    for (const field of ["question", "context"] as const) {
      const fieldPath = `organization.reviewedQuestions.${index}.${field}`;
      if (!(evidenceByPath.get(fieldPath) ?? []).some((evidence) => evidence.claimClass === "derived")) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `Reviewed question leaf '${fieldPath}' requires derived field evidence.`, path: ["fieldEvidence"] });
      }
    }
  });
  candidate.capabilities.forEach((capability, capabilityIndex) => {
    capability.missionMatches.forEach((_match, matchIndex) => {
      const fieldPath = `capabilities.${capabilityIndex}.missionMatches.${matchIndex}.alignmentSummary`;
      if (!(evidenceByPath.get(fieldPath) ?? []).some((evidence) => evidence.claimClass === "derived")) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `Mission connection leaf '${fieldPath}' requires derived field evidence.`, path: ["fieldEvidence"] });
      }
    });
  });
  if ((organization.currentActivity === null) !== (organization.currentActivityAsOf === null)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Current activity and its as-of date must be published together.", path: ["organization", "currentActivityAsOf"] });
  }
  const allowedProfileFields = new Set<string>(organizationProfileFieldAllowlist[organization.entityKind]);
  Object.keys(organization.profileData).forEach((field) => {
    if (!allowedProfileFields.has(field)) context.addIssue({ code: z.ZodIssueCode.custom, message: `profileData field '${field}' is not allowed for ${organization.entityKind}.`, path: ["organization", "profileData", field] });
  });
  if (organization.entityKind === "company" && candidate.capabilities.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Companies require at least one cited capability.", path: ["capabilities"] });
  }
  if (["accelerator", "incubator"].includes(organization.entityKind) && candidate.programParticipations.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Accelerators and incubators require a cited program participation.", path: ["programParticipations"] });
  }
  if (organization.entityKind === "investor_funder" && candidate.relationships.length === 0 && candidate.fundingEvents.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Investors and funders require a cited relationship or funding event.", path: ["relationships"] });
  }
  if (["ecosystem_organization", "government_innovation_office"].includes(organization.entityKind)
      && candidate.programParticipations.length === 0 && candidate.relationships.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "The organization requires a cited program participation or relationship.", path: ["programParticipations"] });
  }

  requireEvidenceForPublicLeaves(candidate, [
    { value: organization, prefix: "organization" },
    { value: candidate.capabilities, prefix: "capabilities" },
    { value: candidate.programParticipations, prefix: "programParticipations" },
    { value: candidate.fundingEvents, prefix: "fundingEvents" },
    { value: candidate.relationships, prefix: "relationships" }
  ], context);
});

const demandIssuerSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(2).max(240),
  issuerType: z.enum(demandIssuerTypeValues),
  jurisdiction: z.string().trim().min(2).max(120),
  parentIssuerSlug: slugSchema.nullable(),
  role: z.enum(["issuer", "co_issuer", "sponsor", "beneficiary"])
});

export const demandSignalBundleV1Schema = z.object({
  schemaVersion: z.literal("demand_signal_bundle_v1"),
  candidateKind: z.literal("demand_signal_bundle"),
  ...candidateCommon,
  issuers: z.array(demandIssuerSchema).min(1).max(10),
  demandSource: z.object({
    slug: slugSchema,
    title: z.string().trim().min(8).max(500),
    sourceKind: z.enum(demandSourceKindValues),
    commitmentLevel: z.enum(["directional", "programmatic", "procurement"]),
    classificationLabel: z.string().trim().min(2).max(120),
    summary: z.string().trim().min(40).max(4000),
    publishedOn: z.string().date().nullable()
  }),
  requirements: z.array(z.object({
    slug: slugSchema,
    title: z.string().trim().min(8).max(500),
    problemStatement: z.string().trim().min(40).max(4000),
    desiredEndState: z.string().trim().min(40).max(4000),
    publicCaveat: z.literal(publicDemandCaveat),
    missionAreaSlugs: z.array(slugSchema),
    technicalDomainSlugs: z.array(slugSchema)
  })).min(1).max(20)
});

export const programRelationshipBundleV1Schema = z.object({
  schemaVersion: z.literal("program_relationship_bundle_v1"),
  candidateKind: z.literal("program_relationship_bundle"),
  ...candidateCommon,
  operatorOrganizationSlug: slugSchema,
  program: programSchema,
  participations: z.array(z.object({
    organizationName: z.string().trim().min(2).max(240),
    participationType: z.string().trim().min(3).max(120),
    publicSummary: z.string().trim().min(40).max(2000)
  })).min(1).max(100)
});

const refreshOperationCommon = {
  operationId: slugSchema,
  evidenceIds: z.array(slugSchema).min(1).max(20),
  reviewerExplanation: z.string().trim().min(30).max(2000)
};

const refreshOperationSchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("set_field"),
    ...refreshOperationCommon,
    entityType: z.enum(["organization", "capability", "demand_source", "demand_requirement"]),
    targetId: z.string().uuid(),
    field: z.string().trim().regex(/^[a-z][a-z0-9_]*$/),
    before: z.unknown(),
    after: z.unknown()
  }),
  z.object({
    operation: z.literal("add_child"),
    ...refreshOperationCommon,
    entityType: z.enum(["capability", "program", "relationship", "demand_requirement"]),
    parentId: z.string().uuid(),
    value: z.record(z.string(), z.unknown())
  }),
  z.object({
    operation: z.literal("update_child"),
    ...refreshOperationCommon,
    entityType: z.enum(["capability", "demand_requirement"]),
    targetId: z.string().uuid(),
    before: z.record(z.string(), z.unknown()),
    after: z.record(z.string(), z.unknown())
  })
]);

const refreshProgramValueSchema = programSchema.extend({
  operatorName: z.string().trim().min(2).max(240),
  participationType: z.string().trim().min(2).max(120)
});

const refreshDemandRequirementValueSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(8).max(500),
  problemStatement: z.string().trim().min(40).max(4000),
  desiredEndState: z.string().trim().min(40).max(4000),
  publicCaveat: z.literal(publicDemandCaveat),
  displayOrder: z.number().int().min(0).max(32767).optional()
});

function validateRefreshOperationValue(operation: z.infer<typeof refreshOperationSchema>, context: z.RefinementCtx, path: Array<string | number>) {
  if (operation.operation === "add_child") {
    const schema = operation.entityType === "capability" ? capabilitySchema
      : operation.entityType === "program" ? refreshProgramValueSchema
      : operation.entityType === "relationship" ? relationshipSchema
      : refreshDemandRequirementValueSchema;
    if (!schema.safeParse(operation.value).success) context.addIssue({ code: z.ZodIssueCode.custom, message: `The new ${operation.entityType.replaceAll("_", " ")} does not satisfy its publication contract.`, path: [...path, "value"] });
  }
  if (operation.operation === "update_child" && operation.entityType === "capability") {
    const after = operation.after;
    const valid = z.object({
      name: z.string().trim().min(2).max(240), summary: z.string().trim().min(40).max(4000), capabilityType: z.string().trim().min(3).max(240),
      features: z.array(z.string().trim().min(2).max(500)).min(1), applications: z.array(z.string().trim().min(2).max(500)).min(1), technicalTags: z.array(z.string().trim().min(2).max(120)).min(1)
    }).safeParse(after).success;
    if (!valid) context.addIssue({ code: z.ZodIssueCode.custom, message: "The updated capability does not satisfy its publication contract.", path: [...path, "after"] });
  }
  if (operation.operation === "update_child" && operation.entityType === "demand_requirement" && !refreshDemandRequirementValueSchema.omit({ slug: true, displayOrder: true }).safeParse(operation.after).success) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "The updated demand statement does not satisfy its publication contract.", path: [...path, "after"] });
  }
}

const refreshCandidateCommon = {
  ...candidateCommon,
  targetMatch: targetMatchSchema,
  beforeRecord: z.record(z.string(), z.unknown()),
  operations: z.array(refreshOperationSchema).min(1).max(30),
  sourceChannels: z.array(signalSourceChannelSchema).min(1),
  signalIds: z.array(slugSchema).min(1).max(50),
  corroboration: z.array(z.object({
    claim: z.string().trim().min(20).max(1000),
    sourceIds: z.array(slugSchema).min(1).max(10)
  })).max(20)
};

export const organizationRefreshBundleV1Schema = z.object({
  schemaVersion: z.literal("organization_refresh_bundle_v1"),
  candidateKind: z.literal("organization_refresh_bundle"),
  ...refreshCandidateCommon,
  targetMatch: targetMatchSchema.extend({ entityType: z.literal("organization") })
}).superRefine((candidate, context) => {
  candidate.operations.forEach((operation, index) => {
    validateRefreshOperationValue(operation, context, ["operations", index]);
    if (operation.entityType === "demand_source" || operation.entityType === "demand_requirement") context.addIssue({ code: z.ZodIssueCode.custom, message: "Organization refreshes cannot contain demand operations.", path: ["operations", index, "entityType"] });
    if (operation.operation === "add_child" && operation.parentId !== candidate.targetMatch.entityId) context.addIssue({ code: z.ZodIssueCode.custom, message: "The new child must belong to the matched organization.", path: ["operations", index, "parentId"] });
    if (operation.operation === "set_field" && operation.entityType === "organization" && operation.targetId !== candidate.targetMatch.entityId) context.addIssue({ code: z.ZodIssueCode.custom, message: "The field update must target the matched organization.", path: ["operations", index, "targetId"] });
  });
});

export const organizationRefreshV2SafeFieldValues = [
  "name", "legal_name", "description", "website_url", "organization_categories",
  "founded_year", "employee_range", "company_stage", "ownership", "commercial_status",
  "disclosed_financing_summary", "defence_posture", "dual_use_posture", "public_contact",
  "current_activity", "current_activity_as_of", "operating_context", "canadian_footprint",
  "reviewed_questions", "editorial_profile_version"
] as const;

const refreshLeafEvidenceSchema = z.object({
  fieldPath: z.string().trim().min(1).max(300),
  evidenceIds: z.array(slugSchema).min(1).max(20)
}).strict();
const refreshV2OperationCommon = {
  operationId: slugSchema,
  evidenceIds: z.array(slugSchema).min(1).max(50),
  leafEvidence: z.array(refreshLeafEvidenceSchema).min(1).max(100),
  reviewerExplanation: z.string().trim().min(30).max(2000)
};
const organizationRefreshOperationV2Schema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("set_field"),
    ...refreshV2OperationCommon,
    entityType: z.literal("organization"),
    targetId: z.string().uuid(),
    field: z.enum(organizationRefreshV2SafeFieldValues),
    before: z.unknown(),
    after: z.unknown()
  }).strict(),
  z.object({
    operation: z.literal("set_profile_field"),
    ...refreshV2OperationCommon,
    entityType: z.literal("organization"),
    targetId: z.string().uuid(),
    profileField: z.string().trim().regex(/^[a-z][A-Za-z0-9]*$/),
    before: profileFieldValueSchema.nullable(),
    after: profileFieldValueSchema.nullable()
  }).strict(),
  z.object({
    operation: z.literal("add_child"),
    ...refreshV2OperationCommon,
    entityType: z.enum(["capability", "program_participation", "organization_relationship", "funding_event"]),
    parentId: z.string().uuid(),
    value: z.record(z.string(), z.unknown())
  }).strict(),
  z.object({
    operation: z.literal("update_child"),
    ...refreshV2OperationCommon,
    entityType: z.enum(["capability", "program_participation", "organization_relationship", "funding_event"]),
    parentId: z.string().uuid(),
    targetId: z.string().uuid(),
    before: z.record(z.string(), z.unknown()),
    after: z.record(z.string(), z.unknown())
  }).strict()
]);

const capabilityRefreshV2Schema = capabilityV3Schema.omit({ slug: true });
const participationRefreshV2Schema = programParticipationDetailsV3Schema;
const relationshipRefreshV2Schema = relationshipV3Schema;

function validateOrganizationRefreshV2Field(
  field: (typeof organizationRefreshV2SafeFieldValues)[number],
  value: unknown
) {
  const schemaByField: Record<(typeof organizationRefreshV2SafeFieldValues)[number], z.ZodTypeAny> = {
    name: z.string().trim().min(2).max(240),
    legal_name: z.string().trim().min(2).max(240).nullable(),
    description: z.string().trim().min(40).max(4000),
    website_url: httpsUrlSchema,
    organization_categories: z.array(z.enum(organizationCategoryValues)).min(1),
    founded_year: z.number().int().min(1800).max(2100).nullable(),
    employee_range: nullablePublicText(1, 120),
    company_stage: nullablePublicText(1, 120),
    ownership: nullablePublicText(2, 500),
    commercial_status: nullablePublicText(2, 500),
    disclosed_financing_summary: nullablePublicText(40, 2000),
    defence_posture: nullablePublicText(20, 2000),
    dual_use_posture: nullablePublicText(20, 2000),
    public_contact: publicContactSchema,
    current_activity: nullablePublicText(40, 4000),
    current_activity_as_of: z.string().date().nullable(),
    operating_context: nullablePublicText(40, 2000),
    canadian_footprint: nullablePublicText(40, 2000),
    reviewed_questions: z.array(reviewedQuestionSchema).max(4),
    editorial_profile_version: z.literal(organizationEditorialProfileVersion).nullable()
  };
  return schemaByField[field].safeParse(value).success;
}

function refreshV2ChildSchema(
  entityType: "capability" | "program_participation" | "organization_relationship" | "funding_event",
  operation: "add_child" | "update_child"
) {
  if (entityType === "capability") return operation === "add_child" ? capabilityV3Schema : capabilityRefreshV2Schema;
  if (entityType === "program_participation") return operation === "add_child" ? organizationProgramParticipationV3Schema : participationRefreshV2Schema;
  if (entityType === "organization_relationship") return relationshipRefreshV2Schema;
  return fundingEventV3Schema;
}

function refreshV2ExpectedLeafPaths(operation: z.infer<typeof organizationRefreshOperationV2Schema>) {
  const paths: string[] = [];
  const value = operation.operation === "add_child" ? operation.value : operation.after;
  collectPublicLeafPaths(value, operation.operation === "add_child" ? "value" : "after", paths);
  return paths;
}

export const organizationRefreshBundleV2Schema = z.object({
  schemaVersion: z.literal("organization_refresh_bundle_v2"),
  candidateKind: z.literal("organization_refresh_bundle"),
  ...candidateCommon,
  fieldEvidence: z.array(fieldEvidenceSchema).min(1).max(300),
  targetMatch: targetMatchSchema.extend({ entityType: z.literal("organization") }),
  beforeRecord: z.record(z.string(), z.unknown()),
  operations: z.array(organizationRefreshOperationV2Schema).min(1).max(30),
  sourceChannels: z.array(signalSourceChannelSchema).min(1),
  signalIds: z.array(slugSchema).min(1).max(50),
  corroboration: z.array(z.object({
    claim: z.string().trim().min(20).max(1000),
    sourceIds: z.array(slugSchema).min(1).max(10)
  }).strict()).max(20)
}).strict().superRefine((candidate, context) => {
  const evidenceIds = new Set(candidate.fieldEvidence.map((evidence) => evidence.id));
  const evidenceById = new Map(candidate.fieldEvidence.map((evidence) => [evidence.id, evidence]));
  const beforeOrganization = candidate.beforeRecord.organization;
  const entityKind = beforeOrganization && typeof beforeOrganization === "object"
    ? (beforeOrganization as Record<string, unknown>).entity_kind
    : null;

  candidate.operations.forEach((operation, index) => {
    const path: Array<string | number> = ["operations", index];
    if ((operation.operation === "set_field" || operation.operation === "set_profile_field")
        && operation.targetId !== candidate.targetMatch.entityId) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "The field update must target the matched organization.", path: [...path, "targetId"] });
    }
    if ((operation.operation === "add_child" || operation.operation === "update_child")
        && operation.parentId !== candidate.targetMatch.entityId) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "The child operation must belong to the matched organization.", path: [...path, "parentId"] });
    }
    if (operation.operation === "set_field" && !validateOrganizationRefreshV2Field(operation.field, operation.after)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `Field '${operation.field}' does not satisfy its publication contract.`, path: [...path, "after"] });
    }
    if (operation.operation === "set_profile_field") {
      if (typeof entityKind !== "string" || !(organizationKindValues as readonly string[]).includes(entityKind)
          || !(organizationProfileFieldAllowlist[entityKind as (typeof organizationKindValues)[number]] as readonly string[]).includes(operation.profileField)) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `Profile field '${operation.profileField}' is not allowed for the matched organization kind.`, path: [...path, "profileField"] });
      }
    }
    if (operation.operation === "add_child" || operation.operation === "update_child") {
      const value = operation.operation === "add_child" ? operation.value : operation.after;
      if (!refreshV2ChildSchema(operation.entityType, operation.operation).safeParse(value).success) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `The ${operation.entityType.replaceAll("_", " ")} does not satisfy its publication contract.`, path: [...path, operation.operation === "add_child" ? "value" : "after"] });
      }
      if (operation.operation === "update_child"
          && !refreshV2ChildSchema(operation.entityType, operation.operation).safeParse(operation.before).success) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `The existing ${operation.entityType.replaceAll("_", " ")} snapshot does not satisfy its exact-baseline contract.`, path: [...path, "before"] });
      }
    }

    const operationEvidenceIds = new Set(operation.evidenceIds);
    operation.evidenceIds.forEach((evidenceId) => {
      if (!evidenceIds.has(evidenceId)) context.addIssue({ code: z.ZodIssueCode.custom, message: `Operation evidence '${evidenceId}' is missing from fieldEvidence.`, path: [...path, "evidenceIds"] });
    });
    const leafPaths = new Set(operation.leafEvidence.map((leaf) => leaf.fieldPath));
    refreshV2ExpectedLeafPaths(operation).forEach((expectedPath) => {
      if (!leafPaths.has(expectedPath)) context.addIssue({ code: z.ZodIssueCode.custom, message: `Changed leaf '${expectedPath}' requires evidence IDs.`, path: [...path, "leafEvidence"] });
    });
    operation.leafEvidence.forEach((leaf, leafIndex) => {
      leaf.evidenceIds.forEach((evidenceId) => {
        if (!operationEvidenceIds.has(evidenceId) || !evidenceIds.has(evidenceId)) {
          context.addIssue({ code: z.ZodIssueCode.custom, message: `Leaf evidence '${evidenceId}' is not attached to the operation and candidate.`, path: [...path, "leafEvidence", leafIndex, "evidenceIds"] });
        }
      });
      if (operation.operation === "set_field" && operation.field === "reviewed_questions"
          && /(?:^|\.)(?:question|context)$/.test(leaf.fieldPath)
          && !leaf.evidenceIds.some((evidenceId) => evidenceById.get(evidenceId)?.claimClass === "derived")) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `Reviewed question leaf '${leaf.fieldPath}' requires derived evidence.`, path: [...path, "leafEvidence", leafIndex, "evidenceIds"] });
      }
    });
  });
});

export const demandRefreshBundleV1Schema = z.object({
  schemaVersion: z.literal("demand_refresh_bundle_v1"),
  candidateKind: z.literal("demand_refresh_bundle"),
  ...refreshCandidateCommon,
  targetMatch: targetMatchSchema.extend({ entityType: z.literal("demand_source") })
}).superRefine((candidate, context) => {
  candidate.operations.forEach((operation, index) => {
    validateRefreshOperationValue(operation, context, ["operations", index]);
    if (operation.entityType !== "demand_source" && operation.entityType !== "demand_requirement") context.addIssue({ code: z.ZodIssueCode.custom, message: "Demand refreshes cannot contain organization operations.", path: ["operations", index, "entityType"] });
    if (operation.operation === "add_child" && operation.parentId !== candidate.targetMatch.entityId) context.addIssue({ code: z.ZodIssueCode.custom, message: "The new demand statement must belong to the matched demand source.", path: ["operations", index, "parentId"] });
    if (operation.operation === "set_field" && operation.entityType === "demand_source" && operation.targetId !== candidate.targetMatch.entityId) context.addIssue({ code: z.ZodIssueCode.custom, message: "The field update must target the matched demand source.", path: ["operations", index, "targetId"] });
  });
});

export function refreshCandidateBaselinePrecisionIssue(
  candidate: z.infer<typeof organizationRefreshBundleV1Schema> | z.infer<typeof organizationRefreshBundleV2Schema> | z.infer<typeof demandRefreshBundleV1Schema>
) {
  const beforeRecord = candidate.beforeRecord as Record<string, unknown>;
  const parentKey = candidate.candidateKind === "organization_refresh_bundle" ? "organization" : "demandSource";
  const parent = beforeRecord[parentKey];
  const exactBaseline = parent && typeof parent === "object"
    ? (parent as Record<string, unknown>).updated_at
    : null;

  if (typeof exactBaseline !== "string" || exactBaseline.length === 0) {
    return `Candidate ${candidate.candidateId} is missing beforeRecord.${parentKey}.updated_at.`;
  }
  if (candidate.targetMatch.baselineUpdatedAt !== exactBaseline) {
    return `Candidate ${candidate.candidateId} changed timestamp precision: targetMatch.baselineUpdatedAt must copy beforeRecord.${parentKey}.updated_at byte-for-byte.`;
  }
  return null;
}

export const researchSignalBatchV1Schema = z.object({
  schemaVersion: z.literal("research_signal_batch_v1"),
  signalBatchId: slugSchema,
  runId: slugSchema,
  createdAt: z.string().datetime(),
  watermarkStart: z.string().datetime(),
  watermarkEnd: z.string().datetime(),
  sourceFamilyCounters: z.record(signalSourceChannelSchema, z.number().int().min(0)),
  warnings: z.array(z.string().trim().min(10).max(1000)),
  signals: z.array(z.object({
    signalId: slugSchema,
    fingerprint: z.string().trim().regex(/^[a-f0-9]{64}$/),
    sourceChannel: signalSourceChannelSchema,
    sourceFamily: z.string().trim().min(3).max(120),
    discoveryOrigin: z.object({
      url: httpsUrlSchema.nullable(),
      gmailMessageId: z.string().trim().min(1).nullable(),
      gmailThreadId: z.string().trim().min(1).nullable(),
      linkedinUrl: httpsUrlSchema.nullable()
    }),
    extracted: z.object({
      organization: z.string().trim().min(2).max(240).nullable(),
      technology: z.string().trim().min(2).max(240).nullable(),
      program: z.string().trim().min(2).max(240).nullable(),
      issuer: z.string().trim().min(2).max(240).nullable(),
      eventDate: z.string().date().nullable(),
      amount: z.string().trim().min(1).max(120).nullable(),
      details: z.string().trim().min(30).max(4000),
      observedAt: z.string().datetime().optional(),
      effectiveDate: z.string().date().nullable().optional(),
      actors: z.array(z.object({
        name: z.string().trim().min(2).max(240),
        role: z.enum(["issuer", "buyer", "supplier", "partner", "funder", "recipient", "operator", "other"])
      })).max(30).optional(),
      procurement: z.object({
        noticeId: z.string().trim().min(2).max(240).nullable(),
        contractId: z.string().trim().min(2).max(240).nullable(),
        stage: z.enum(["forecast", "planned", "open", "amended", "awarded", "cancelled", "closed"]).nullable(),
        amendmentNumber: z.string().trim().min(1).max(120).nullable(),
        buyer: z.string().trim().min(2).max(240).nullable(),
        supplier: z.string().trim().min(2).max(240).nullable(),
        value: z.string().trim().min(1).max(120).nullable(),
        currency: z.string().trim().length(3).nullable(),
        closingAt: nullableDateTimeSchema
      }).optional(),
      changeSummary: z.string().trim().min(20).max(2000).optional()
    }),
    redirectUrls: z.array(httpsUrlSchema).max(20),
    canonicalUrls: z.array(httpsUrlSchema).max(20),
    signalType: signalTypeSchema,
    sourceClusterId: slugSchema.optional(),
    supersedesSignalIds: z.array(slugSchema).max(20).optional(),
    canonicalEvidenceStatus: z.enum(["resolved", "unresolved", "not_required_duplicate"]),
    liveEntityMatches: z.array(targetMatchSchema).max(10),
    intendedOutcomes: z.array(z.enum(["new_record", "organization_refresh", "demand_refresh", "demand_match", "deferred"])).min(1),
    recoveryAttempts: z.array(z.object({ channel: signalSourceChannelSchema, url: httpsUrlSchema.nullable(), outcome: z.string().trim().min(20).max(1000) })).max(10),
    warnings: z.array(z.string().trim().min(10).max(500)).max(20),
    disposition: z.enum(["qualified", "duplicate", "irrelevant", "unresolved", "already_current", "deferred"]),
    deferralRationale: z.string().trim().min(20).max(1000).nullable()
  })).max(50)
}).superRefine((batch, context) => {
  const families = Object.entries(batch.sourceFamilyCounters).filter(([, count]) => count > 0);
  if (families.length < 4) context.addIssue({ code: z.ZodIssueCode.custom, message: "Refresh batches require at least four searched source families.", path: ["sourceFamilyCounters"] });
  for (const [index, signal] of batch.signals.entries()) {
    if (["qualified", "already_current", "duplicate"].includes(signal.disposition) && signal.canonicalEvidenceStatus === "unresolved") {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Qualified, duplicate, and already-current signals must resolve canonical evidence.", path: ["signals", index, "canonicalEvidenceStatus"] });
    }
    if (["unresolved", "deferred"].includes(signal.disposition) && !signal.deferralRationale) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Unresolved or deferred signals require a rationale.", path: ["signals", index, "deferralRationale"] });
    }
  }
});

export const reviewCandidateSchema = z.union([
  organizationBundleV3Schema,
  organizationBundleV2Schema,
  demandSignalBundleV1Schema,
  programRelationshipBundleV1Schema,
  organizationRefreshBundleV2Schema,
  organizationRefreshBundleV1Schema,
  demandRefreshBundleV1Schema
]);

export const researchCandidateBatchV2Schema = z.object({
  schemaVersion: z.literal("research_candidate_batch_v2"),
  batchId: slugSchema,
  runId: slugSchema,
  title: z.string().trim().min(8).max(500),
  status: z.literal("candidate"),
  createdAt: z.string().datetime(),
  selectedGap: z.object({
    coverageView: z.enum(["supply", "ecosystem_support", "demand"]),
    dimension: z.string().trim().min(3).max(240),
    reason: z.string().trim().min(20).max(1000),
    score: z.number().int().min(0).max(1000)
  }),
  sourceLeadBatchPath: z.string().trim().min(5),
  guardrailNotes: z.array(z.string().trim().min(20).max(1000)).min(1),
  candidates: z.array(reviewCandidateSchema).min(1).max(10),
  deferred: z.array(z.object({
    leadId: slugSchema,
    reason: z.string().trim().min(20).max(1000),
    followUp: z.string().trim().min(10).max(1000)
  }))
}).superRefine((batch, context) => {
  for (const [index, candidate] of batch.candidates.entries()) {
    if (candidate.reviewTier === "amber") {
      if ((candidate.reviewWarnings ?? []).length === 0) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `Amber candidate ${candidate.candidateId} needs at least one reviewer warning.`, path: ["candidates", index, "reviewWarnings"] });
      }
      if (candidate.confidence === "high") {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `Amber candidate ${candidate.candidateId} cannot use high confidence.`, path: ["candidates", index, "confidence"] });
      }
    }
  }
});

export const researchRunSchema = z.object({
  schemaVersion: z.literal("research_run_v1"),
  runId: slugSchema,
  agentVersion: z.string().trim().min(1).max(120),
  trigger: z.enum(["manual", "weekly", "weekday"]),
  mode: z.enum(["bootstrap", "gap_targeted", "discovery_batch", "deep_dossier", "dossier_enrichment", "refresh_batch"]),
  scope: z.object({
    geography: z.literal("canada_first"),
    organizationKinds: z.array(z.enum(organizationKindValues)),
    missionAreaSlugs: z.array(slugSchema),
    technicalDomainSlugs: z.array(slugSchema),
    demandIssuerTypes: z.array(z.enum(demandIssuerTypeValues))
  }),
  selectedGap: z.object({
    coverageView: z.enum(["supply", "ecosystem_support", "demand"]),
    dimension: z.string().trim().min(3).max(240),
    reason: z.string().trim().min(20).max(1000),
    score: z.number().int().min(0).max(1000)
  }),
  status: z.enum(["queued", "running", "completed", "failed", "stopped"]),
  osintArtifactsRequired: z.boolean().optional(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  limits: z.object({
    totalMinutes: z.number().int().min(1).max(90),
    sourceBookMinutes: z.number().int().min(0).max(30),
    maxQualifiedLeads: z.number().int().min(1).max(25),
    maxCandidates: z.number().int().min(1).max(10),
    maxSourceItems: z.number().int().min(1).max(50).optional(),
    minimumProspects: z.number().int().min(1).max(75).optional(),
    minimumSourceLanes: z.number().int().min(1).max(10).optional(),
    minimumCandidates: z.number().int().min(1).max(10).optional(),
    targetCandidates: z.number().int().min(1).max(10).optional()
  }),
  sourceQueries: z.array(z.string().trim().min(3).max(500)).max(200),
  counters: z.object({
    sourcesChecked: z.number().int().min(0),
    leadsQualified: z.number().int().min(0).max(25),
    leadsDeferred: z.number().int().min(0),
    candidatesCreated: z.number().int().min(0).max(10),
    duplicatesBlocked: z.number().int().min(0),
    prospectsDiscovered: z.number().int().min(0).optional(),
    uniqueProspects: z.number().int().min(0).optional(),
    prospectsQueued: z.number().int().min(0).optional(),
    recoveryAttempts: z.number().int().min(0).optional(),
    sourceLanesSearched: z.number().int().min(0).optional(),
    candidatesGreen: z.number().int().min(0).optional(),
    candidatesAmber: z.number().int().min(0).optional(),
    signalsExtracted: z.number().int().min(0).max(50).optional(),
    signalsDispositioned: z.number().int().min(0).max(50).optional(),
    sourceFamiliesSearched: z.number().int().min(0).max(8).optional(),
    claimsCollected: z.number().int().min(0).max(500).optional(),
    claimsConflicted: z.number().int().min(0).max(500).optional(),
    coverageSubjects: z.number().int().min(0).max(75).optional()
  }),
  underTargetReason: z.string().trim().min(20).max(2000).nullable().optional(),
  exhaustionEvidence: z.object({
    sourceLanes: z.array(discoveryLaneSchema).min(1),
    prospectsConsidered: z.number().int().min(1),
    unresolvedTrails: z.array(z.string().trim().min(10).max(1000)),
    note: z.string().trim().min(40).max(2000)
  }).nullable().optional(),
  validation: z.object({
    passed: z.boolean(),
    errors: z.array(z.string()),
    warnings: z.array(z.string())
  }),
  errors: z.array(z.string()),
  stopReason: z.string().trim().min(3).max(1000).nullable(),
  outputs: z.object({
    collectionPlan: z.string().nullable().optional(),
    claimLedger: z.string().nullable().optional(),
    prospectInventory: z.string().nullable().optional(),
    signalBatch: z.string().nullable().optional(),
    candidateLogoPacket: z.string().nullable().optional(),
    sourceLeadBatch: z.string().nullable(),
    candidateBatch: z.string().nullable(),
    reviewPacket: z.string().nullable(),
    stagingExport: z.string().nullable()
  })
});

export type SourceLeadBatchV2 = z.infer<typeof sourceLeadBatchV2Schema>;
export type ResearchCollectionPlanV1 = z.infer<typeof researchCollectionPlanV1Schema>;
export type ResearchClaimLedgerV1 = z.infer<typeof researchClaimLedgerV1Schema>;
export type ResearchProspectInventoryV1 = z.infer<typeof researchProspectInventoryV1Schema>;
export type OrganizationBundleV2 = z.infer<typeof organizationBundleV2Schema>;
export type OrganizationBundleV3 = z.infer<typeof organizationBundleV3Schema>;
export type DemandSignalBundleV1 = z.infer<typeof demandSignalBundleV1Schema>;
export type OrganizationRefreshBundleV1 = z.infer<typeof organizationRefreshBundleV1Schema>;
export type OrganizationRefreshBundleV2 = z.infer<typeof organizationRefreshBundleV2Schema>;
export type DemandRefreshBundleV1 = z.infer<typeof demandRefreshBundleV1Schema>;
export type ResearchSignalBatchV1 = z.infer<typeof researchSignalBatchV1Schema>;
export type ResearchCandidateBatchV2 = z.infer<typeof researchCandidateBatchV2Schema>;
export type ResearchRun = z.infer<typeof researchRunSchema>;
export type ReviewCandidate = z.infer<typeof reviewCandidateSchema>;

export const currentResearchPipelineVersion = "tnm-research-pipeline/1.6.0" as const;
export const researchDecisionBriefLabels = [
  "Coverage value",
  "Evidence",
  "Mission/Public Need read",
  "Unknowns",
  "Reviewer action"
] as const;

function pipelineVersion(agentVersion: string) {
  const match = agentVersion.match(/^tnm-research-pipeline\/(\d+)\.(\d+)\.(\d+)$/);
  return match ? { major: Number(match[1]), minor: Number(match[2]) } : null;
}

export function requiresResearchQualityContract(agentVersion: string) {
  const version = pipelineVersion(agentVersion);
  return version !== null && (version.major > 1 || (version.major === 1 && version.minor >= 5));
}

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function isSharedResearchBoundaryWarning(value: string) {
  const normalized = value.toLowerCase();
  return normalized.includes("procurement eligibility")
    && normalized.includes("endorsement")
    && normalized.includes("customer interest")
    && (normalized.includes("classified") || normalized.includes("operational adoption"));
}

export function researchCandidateQualityIssues(candidate: ReviewCandidate) {
  const errors: string[] = [];
  let previousIndex = -1;
  for (const label of researchDecisionBriefLabels) {
    const index = candidate.reviewerRationale.indexOf(`${label}:`);
    if (index < 0) errors.push(`Candidate ${candidate.candidateId} rationale is missing '${label}:'`);
    else if (index <= previousIndex) errors.push(`Candidate ${candidate.candidateId} rationale labels are out of order.`);
    previousIndex = Math.max(previousIndex, index);
  }
  const rationaleWords = wordCount(candidate.reviewerRationale);
  if (rationaleWords < 90 || rationaleWords > 160) {
    errors.push(`Candidate ${candidate.candidateId} rationale has ${rationaleWords} words; pipeline 1.5 or later requires 90-160.`);
  }
  const warnings = candidate.reviewWarnings ?? [];
  const normalizedWarnings = warnings.map((warning) => warning.trim().toLowerCase());
  if (new Set(normalizedWarnings).size !== warnings.length) errors.push(`Candidate ${candidate.candidateId} has duplicate reviewer warnings.`);
  if (warnings.some(isSharedResearchBoundaryWarning)) {
    errors.push(`Candidate ${candidate.candidateId} repeats the shared review boundary in reviewWarnings instead of keeping a record-specific warning.`);
  }
  return errors;
}

export function researchClaimLedgerQualityIssues(ledger: ResearchClaimLedgerV1) {
  const errors: string[] = [];
  for (const claim of ledger.claims) {
    if (/\b(material\s+)?(published[- ]record|defen[cs]e posture) enrichment\b/i.test(claim.predicate)) {
      errors.push(`Claim ${claim.claimId} uses the generic predicate '${claim.predicate}'.`);
    }
    if (claim.disposition === "candidate_field" && claim.candidateTargets.length !== 1) {
      errors.push(`Claim ${claim.claimId} must target exactly one candidate leaf field.`);
    }
    for (const target of claim.candidateTargets) {
      if (/^operations\.[^.]+\.after$/.test(target.fieldPath)) {
        errors.push(`Claim ${claim.claimId} targets the operation-wide path '${target.fieldPath}' instead of a leaf field.`);
      }
    }
  }
  if (ledger.status === "complete" && ledger.completedAt && new Date(ledger.completedAt).getTime() <= new Date(ledger.createdAt).getTime()) {
    errors.push(`Claim ledger ${ledger.ledgerId} completedAt must be later than createdAt.`);
  }
  return errors;
}

export function reviewCandidateIntakeIssues(candidate: ReviewCandidate) {
  const errors: string[] = [];
  if (candidate.duplicateCheck.status !== "clear") {
    errors.push(`Candidate ${candidate.candidateId} has unresolved duplicate status '${candidate.duplicateCheck.status}'.`);
  }
  return errors;
}

export function researchRunCompletionIssues(run: ResearchRun) {
  const errors: string[] = [];
  if (run.status === "completed" && run.osintArtifactsRequired && (!run.outputs.collectionPlan || !run.outputs.claimLedger)) {
    errors.push(`Run ${run.runId} requires a collection plan and claim ledger before completion.`);
  }
  const minimumCandidates = run.limits.minimumCandidates ?? 1;
  const targetCandidates = run.limits.targetCandidates ?? minimumCandidates;
  const minimumProspects = run.limits.minimumProspects ?? 1;
  const minimumSourceLanes = run.limits.minimumSourceLanes ?? 1;
  if (run.mode === "discovery_batch" && run.status === "completed") {
    const underMinimum = (run.counters.prospectsDiscovered ?? 0) < minimumProspects
      || (run.counters.sourceLanesSearched ?? 0) < minimumSourceLanes
      || run.counters.candidatesCreated < minimumCandidates;
    const underTarget = run.counters.candidatesCreated < targetCandidates;
    if (underTarget && (!run.underTargetReason || !run.exhaustionEvidence)) {
      errors.push(`Discovery batch ${run.runId} finished below target without underTargetReason and exhaustionEvidence.`);
    }
    if (underMinimum && !run.exhaustionEvidence) {
      errors.push(`Discovery batch ${run.runId} did not meet minimum prospect, source-lane, and candidate controls.`);
    }
    if (run.exhaustionEvidence) {
      if (run.exhaustionEvidence.prospectsConsidered < (run.counters.prospectsDiscovered ?? 0)) {
        errors.push(`Run ${run.runId} exhaustionEvidence understates the prospects considered.`);
      }
      if (new Set(run.exhaustionEvidence.sourceLanes).size < Math.min(minimumSourceLanes, run.counters.sourceLanesSearched ?? 0)) {
        errors.push(`Run ${run.runId} exhaustionEvidence does not identify the searched source lanes.`);
      }
    }
  }
  if (run.mode === "refresh_batch" && run.status === "completed") {
    if ((run.counters.sourceFamiliesSearched ?? 0) < 4) errors.push(`Refresh batch ${run.runId} searched fewer than four source families.`);
    if ((run.counters.signalsExtracted ?? 0) !== (run.counters.signalsDispositioned ?? 0)) errors.push(`Refresh batch ${run.runId} did not disposition every extracted signal.`);
  }
  const tierCount = (run.counters.candidatesGreen ?? 0) + (run.counters.candidatesAmber ?? 0);
  if (tierCount > 0 && tierCount !== run.counters.candidatesCreated) errors.push(`Run ${run.runId} green and amber counters do not equal candidatesCreated.`);
  if ((run.counters.uniqueProspects ?? 0) > (run.counters.prospectsDiscovered ?? 0)) errors.push(`Run ${run.runId} uniqueProspects exceeds prospectsDiscovered.`);
  if ((run.counters.prospectsQueued ?? 0) > (run.counters.uniqueProspects ?? 0)) errors.push(`Run ${run.runId} prospectsQueued exceeds uniqueProspects.`);
  if (run.status === "completed" && requiresResearchQualityContract(run.agentVersion)) {
    if (!run.completedAt || new Date(run.completedAt).getTime() <= new Date(run.startedAt).getTime()) {
      errors.push(`Run ${run.runId} completedAt must be later than startedAt for pipeline 1.5 or later.`);
    }
  }
  return errors;
}

export function formatZodIssues(error: z.ZodError) {
  return error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`);
}
