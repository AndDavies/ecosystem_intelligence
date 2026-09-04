import { z } from "zod";
import { organizationProfileFieldAllowlist } from "@/lib/atlas/public-profile-data";
import { normalizeOrganizationIdentity } from "@/lib/research/identity-normalization";

export { organizationProfileFieldAllowlist } from "@/lib/atlas/public-profile-data";

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
    queryPatterns: z.array(z.string().trim().min(3).max(500)).min(1).max(100),
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
  claims: z.array(researchClaimSchema).max(1000),
  subjects: z.array(z.object({
    subjectId: slugSchema,
    subjectType: osintSubjectTypeSchema,
    name: z.string().trim().min(2).max(240),
    candidateIds: z.array(slugSchema).max(20),
    coverage: z.array(z.object({
      dimension: osintCoverageDimensionSchema,
      status: z.enum(["not_assessed", "covered", "partial", "not_found", "not_applicable"]),
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
  if (ledger.status === "complete") {
    ledger.subjects.forEach((subject, subjectIndex) => {
      subject.coverage.forEach((item, coverageIndex) => {
        if (item.status === "not_assessed") {
          context.addIssue({ code: z.ZodIssueCode.custom, message: "Completed claim ledgers cannot retain not_assessed coverage.", path: ["subjects", subjectIndex, "coverage", coverageIndex, "status"] });
        }
      });
    });
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
  matchMethods: z.array(z.enum(["canonical_url", "website_domain", "slug", "legal_name", "alias", "name", "parent_relationship"]))
    .min(1)
    .refine((methods) => new Set(methods).size === methods.length, "Target match methods must be unique."),
  confidence: z.enum(["high", "moderate"]),
  baselineUpdatedAt: z.string().datetime({ offset: true })
});

const recordRefreshLeadSchema = z.object({
  leadType: z.literal("record_refresh_lead"),
  ...leadCommon,
  targetMatch: targetMatchSchema,
  signalIds: z.array(slugSchema).max(50),
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
  leads: z.array(typedSourceLeadSchema).min(1).max(50)
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
      if (lanes.size < 2) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Deferred lead ${lead.id} needs evidence recovery across at least two source lanes; the run-mode validator may require more.`,
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
  sources: z.array(sourceSchema).min(1).max(50),
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
    executiveRelevanceSummary: nullablePublicText(80, 1200).optional(),
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
  if (organization.executiveRelevanceSummary !== null && organization.executiveRelevanceSummary !== undefined
      && !(evidenceByPath.get("organization.executiveRelevanceSummary") ?? []).some((evidence) => evidence.claimClass === "derived")) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "The executive relevance summary requires derived field evidence grounded in a public source.",
      path: ["fieldEvidence"]
    });
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
  "executive_relevance_summary", "reviewed_questions", "editorial_profile_version"
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
    executive_relevance_summary: nullablePublicText(80, 1200),
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
  signalIds: z.array(slugSchema).max(50),
  corroboration: z.array(z.object({
    claim: z.string().trim().min(20).max(1000),
    sourceIds: z.array(slugSchema).min(1).max(10)
  }).strict()).max(20),
  executiveRelevanceSummary: nullablePublicText(80, 1200).optional()
}).strict().superRefine((candidate, context) => {
  const evidenceIds = new Set(candidate.fieldEvidence.map((evidence) => evidence.id));
  const evidenceById = new Map(candidate.fieldEvidence.map((evidence) => [evidence.id, evidence]));
  const beforeOrganization = candidate.beforeRecord.organization;
  const entityKind = beforeOrganization && typeof beforeOrganization === "object"
    ? (beforeOrganization as Record<string, unknown>).entity_kind
    : null;
  const beforeOrganizationRecord = beforeOrganization && typeof beforeOrganization === "object"
    ? beforeOrganization as Record<string, unknown>
    : {};
  let resultingCurrentActivity: unknown = beforeOrganizationRecord.current_activity ?? null;
  let resultingCurrentActivityAsOf: unknown = beforeOrganizationRecord.current_activity_as_of ?? null;
  let resultingExecutiveRelevanceSummary: unknown = beforeOrganizationRecord.executive_relevance_summary ?? null;
  let currentActivityOperationIndex: number | null = null;
  let currentActivityAsOfOperationIndex: number | null = null;

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
    if (operation.operation === "set_field" && operation.field === "current_activity") {
      resultingCurrentActivity = operation.after;
      currentActivityOperationIndex = index;
    }
    if (operation.operation === "set_field" && operation.field === "current_activity_as_of") {
      resultingCurrentActivityAsOf = operation.after;
      currentActivityAsOfOperationIndex = index;
    }
    if (operation.operation === "set_field" && operation.field === "executive_relevance_summary") {
      resultingExecutiveRelevanceSummary = operation.after;
      const hasMappedExecutiveAssessmentEvidence = operation.leafEvidence.some((leaf) =>
        leaf.fieldPath === "after"
        && leaf.evidenceIds.some((evidenceId) => {
          const evidence = evidenceById.get(evidenceId);
          return evidence?.claimClass === "derived"
            && evidence.fieldPath === "executiveRelevanceSummary";
        })
      );
      if (operation.after !== null && !hasMappedExecutiveAssessmentEvidence) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "The executive relevance summary operation requires derived evidence at executiveRelevanceSummary mapped to the after leaf.",
          path: [...path, "leafEvidence"]
        });
      }
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
  if ((resultingCurrentActivity === null) !== (resultingCurrentActivityAsOf === null)) {
    const operationIndex = currentActivityAsOfOperationIndex ?? currentActivityOperationIndex;
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "The resulting current_activity and current_activity_as_of values must be published or cleared together.",
      path: operationIndex === null ? ["beforeRecord", "organization", "current_activity_as_of"] : ["operations", operationIndex, "after"]
    });
  }
  if (candidate.executiveRelevanceSummary !== undefined
      && candidate.executiveRelevanceSummary !== resultingExecutiveRelevanceSummary) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "The executiveRelevanceSummary preview must equal the exact result of the reviewed operations and current baseline.",
      path: ["executiveRelevanceSummary"]
    });
  }
});

const canonicalIdentitySnapshotSchema = z.object({
  id: z.string().uuid(),
  slug: slugSchema,
  name: z.string().trim().min(2).max(240),
  legalName: z.string().trim().min(2).max(240).nullable(),
  websiteUrl: httpsUrlSchema.nullable(),
  entityKind: z.enum(organizationKindValues),
  organizationCategories: z.array(z.enum(organizationCategoryValues)).min(1),
  profileData: z.record(z.string(), z.unknown()),
  publicationStatus: z.literal("published"),
  updatedAt: z.string().datetime({ offset: true })
}).strict();

const canonicalIdentityAfterSchema = canonicalIdentitySnapshotSchema
  .omit({ id: true, slug: true, publicationStatus: true, updatedAt: true, profileData: true })
  .strict();

function canonicalComparable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalComparable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, canonicalComparable(child)]));
  }
  return value;
}

function canonicalEqual(left: unknown, right: unknown) {
  return JSON.stringify(canonicalComparable(left)) === JSON.stringify(canonicalComparable(right));
}

const canonicalAliasSnapshotSchema = z.object({
  id: z.string().uuid(),
  alias: z.string().trim().min(2).max(240),
  aliasType: z.enum(["legal_name", "trade_name", "former_name", "acronym", "other"]),
  publicationStatus: z.enum(["draft", "published"])
}).strict();

const canonicalCapabilitySnapshotSchema = z.object({
  id: z.string().uuid(),
  slug: slugSchema,
  name: z.string().trim().min(2).max(240),
  publicationStatus: z.enum(["draft", "published"]),
  updatedAt: z.string().datetime({ offset: true })
}).strict();

const canonicalRelationKeySchema = z.string().superRefine((value, context) => {
  const parts = value.split(":");
  if (parts.length !== 2 || parts.some((part) => !z.string().uuid().safeParse(part).success)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Relationship keys must contain two UUIDs separated by one colon." });
  }
});

const canonicalCapabilityDependencySchema = z.object({
  activeDomainKeys: z.array(canonicalRelationKeySchema).max(50),
  activeMissionMatchIds: z.array(z.string().uuid()).max(100),
  activeClusterKeys: z.array(canonicalRelationKeySchema).max(50),
  activeDemandMatchIds: z.array(z.string().uuid()).max(100),
  activeMediaAssetIds: z.array(z.string().uuid()).max(50),
  signalRecordLinkIds: z.array(z.string().uuid()).max(100),
  wikiPageRecordLinkIds: z.array(z.string().uuid()).max(100)
}).strict();

const canonicalOrganizationDependencySchema = canonicalCapabilityDependencySchema.extend({
  activeAliasIds: z.array(z.string().uuid()).max(50),
  activeLocationLinkIds: z.array(z.string().uuid()).max(50),
  activeCapabilityIds: z.array(z.string().uuid()).max(50),
  activeProgramParticipationIds: z.array(z.string().uuid()).max(50),
  activeRelationshipIds: z.array(z.string().uuid()).max(50),
  activeFundingEventIds: z.array(z.string().uuid()).max(50),
  incomingActiveRelationshipIds: z.array(z.string().uuid()).max(50)
}).strict();

const canonicalPublicationBlockersSchema = z.object({
  savedCollectionItemIds: z.array(z.string().uuid()).max(500),
  activeConnectionRequestIds: z.array(z.string().uuid()).max(500),
  activeSubmissionIds: z.array(z.string().uuid()).max(500),
  incomingRedirectIds: z.array(z.string().uuid()).max(500)
}).strict();

const canonicalRepairSnapshotTargetV1Schema = z.object({
  organization: canonicalIdentitySnapshotSchema,
  activeAliases: z.array(canonicalAliasSnapshotSchema).max(50),
  activeCapabilities: z.array(canonicalCapabilitySnapshotSchema).max(50),
  organizationDependencies: canonicalOrganizationDependencySchema,
  capabilityDependencies: z.array(z.object({
    capabilityId: z.string().uuid(),
    dependencies: canonicalCapabilityDependencySchema
  }).strict()).max(50),
  publicationBlockers: canonicalPublicationBlockersSchema
}).strict();

export const canonicalOrganizationRepairSnapshotV1Schema = z.object({
  schemaVersion: z.literal("canonical_organization_repair_snapshot_v1"),
  runId: slugSchema,
  capturedAt: z.string().datetime({ offset: true }),
  targets: z.array(canonicalRepairSnapshotTargetV1Schema).min(1).max(25)
}).strict().superRefine((snapshot, context) => {
  const unique = (values: string[], path: Array<string | number>) => {
    if (new Set(values).size !== values.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Canonical snapshot identifiers must be unique.", path });
    }
  };
  const sortedUnique = (values: string[], path: Array<string | number>) => {
    unique(values, path);
    if (values.some((value, index) => index > 0 && values[index - 1].localeCompare(value) > 0)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Canonical snapshot identifiers must use deterministic ascending order.", path });
    }
  };
  sortedUnique(snapshot.targets.map((target) => target.organization.slug), ["targets"]);
  // The snapshot RPC emits targets in deterministic slug order. UUIDs are
  // random identifiers, so requiring them to be independently sorted would
  // make most valid multi-target snapshots impossible to represent.
  unique(snapshot.targets.map((target) => target.organization.id), ["targets"]);
  snapshot.targets.forEach((target, targetIndex) => {
    const targetPath: Array<string | number> = ["targets", targetIndex];
    sortedUnique(target.organization.organizationCategories, [...targetPath, "organization", "organizationCategories"]);
    sortedUnique(target.activeAliases.map((alias) => alias.id), [...targetPath, "activeAliases"]);
    sortedUnique(target.activeCapabilities.map((capability) => capability.id), [...targetPath, "activeCapabilities"]);
    sortedUnique(target.capabilityDependencies.map((dependency) => dependency.capabilityId), [...targetPath, "capabilityDependencies"]);
    for (const [key, values] of Object.entries(target.organizationDependencies) as Array<[string, string[]]>) {
      sortedUnique(values, [...targetPath, "organizationDependencies", key]);
    }
    target.capabilityDependencies.forEach((capability, capabilityIndex) => {
      for (const [key, values] of Object.entries(capability.dependencies) as Array<[string, string[]]>) {
        sortedUnique(values, [...targetPath, "capabilityDependencies", capabilityIndex, "dependencies", key]);
      }
    });
    for (const [key, values] of Object.entries(target.publicationBlockers) as Array<[string, string[]]>) {
      sortedUnique(values, [...targetPath, "publicationBlockers", key]);
    }
    if (!canonicalEqual(
      target.organizationDependencies.activeAliasIds,
      target.activeAliases.map((alias) => alias.id)
    )) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Canonical snapshot alias dependencies do not match the active alias inventory.", path: [...targetPath, "organizationDependencies", "activeAliasIds"] });
    }
    if (!canonicalEqual(
      target.organizationDependencies.activeCapabilityIds,
      target.activeCapabilities.map((capability) => capability.id)
    )) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Canonical snapshot capability dependencies do not match the active capability inventory.", path: [...targetPath, "organizationDependencies", "activeCapabilityIds"] });
    }
    if (!canonicalEqual(
      target.capabilityDependencies.map((dependency) => dependency.capabilityId),
      target.activeCapabilities.map((capability) => capability.id)
    )) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Canonical snapshot capability dependency records do not match the active capability inventory.", path: [...targetPath, "capabilityDependencies"] });
    }
  });
});

const canonicalRepairOperationCommon = {
  operationId: slugSchema,
  evidenceIds: z.array(slugSchema).min(1).max(50),
  reviewerExplanation: z.string().trim().min(40).max(2000)
};

export const organizationCanonicalRepairOperationV1Schema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("set_organization_identity"),
    ...canonicalRepairOperationCommon,
    targetId: z.string().uuid(),
    before: canonicalIdentitySnapshotSchema,
    after: canonicalIdentityAfterSchema,
    formerNameAlias: z.string().trim().min(2).max(240).nullable()
  }).strict(),
  z.object({
    operation: z.literal("set_profile_field"),
    ...canonicalRepairOperationCommon,
    targetId: z.string().uuid(),
    profileField: z.string().regex(/^[a-z][A-Za-z0-9]*$/),
    before: profileFieldValueSchema.nullable(),
    after: profileFieldValueSchema.nullable()
  }).strict(),
  z.object({
    operation: z.literal("add_alias"),
    ...canonicalRepairOperationCommon,
    targetId: z.string().uuid(),
    alias: z.string().trim().min(2).max(240),
    aliasType: z.enum(["legal_name", "trade_name", "former_name", "acronym", "other"])
  }).strict(),
  z.object({
    operation: z.literal("archive_alias"),
    ...canonicalRepairOperationCommon,
    targetId: z.string().uuid(),
    aliasId: z.string().uuid(),
    before: canonicalAliasSnapshotSchema,
    reason: z.enum(["duplicate_alias", "incorrect_owner", "superseded_name"])
  }).strict(),
  z.object({
    operation: z.literal("archive_capability"),
    ...canonicalRepairOperationCommon,
    targetId: z.string().uuid(),
    capabilityId: z.string().uuid(),
    before: canonicalCapabilitySnapshotSchema,
    reason: z.enum(["unsupported_capability", "outside_product_scope", "defunct", "superseded"]),
    dependencies: canonicalCapabilityDependencySchema
  }).strict(),
  z.object({
    operation: z.literal("archive_organization"),
    ...canonicalRepairOperationCommon,
    targetId: z.string().uuid(),
    before: canonicalIdentitySnapshotSchema,
    reason: z.enum(["unsupported_identity", "outside_canadian_scope", "outside_product_scope", "defunct", "superseded"]),
    successor: z.object({
      id: z.string().uuid(),
      slug: slugSchema,
      name: z.string().trim().min(2).max(240),
      baselineUpdatedAt: z.string().datetime({ offset: true })
    }).strict().nullable(),
    dependencies: canonicalOrganizationDependencySchema
  }).strict()
]);

export const organizationCanonicalRepairBundleV1Schema = z.object({
  schemaVersion: z.literal("organization_canonical_repair_bundle_v1"),
  candidateKind: z.literal("organization_canonical_repair_bundle"),
  ...candidateCommon,
  targetMatch: targetMatchSchema.extend({ entityType: z.literal("organization") }),
  beforeRecord: z.object({
    organization: canonicalIdentitySnapshotSchema,
    activeAliases: z.array(canonicalAliasSnapshotSchema).max(50),
    activeCapabilities: z.array(canonicalCapabilitySnapshotSchema).max(50)
  }).strict(),
  operations: z.array(organizationCanonicalRepairOperationV1Schema).min(1).max(10)
}).strict().superRefine((candidate, context) => {
  const evidenceById = new Map(candidate.fieldEvidence.map((evidence) => [evidence.id, evidence]));
  const sourceIds = new Set(candidate.sources.map((source) => source.id));
  const evidenceUseCounts = new Map<string, number>();
  const operationIds = new Set<string>();
  const operationTargets = new Set<string>();
  let archiveOrganizationCount = 0;
  const identityOperation = candidate.operations.find((operation) => operation.operation === "set_organization_identity");
  const identitySnapshot = candidate.beforeRecord.organization;
  const resultingProfileData: Record<string, unknown> = { ...identitySnapshot.profileData };
  if (identitySnapshot.id !== candidate.targetMatch.entityId
      || identitySnapshot.slug !== candidate.targetMatch.slug
      || identitySnapshot.updatedAt !== candidate.targetMatch.baselineUpdatedAt) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Canonical repair target and before-record identity must match byte-for-byte.", path: ["beforeRecord", "organization"] });
  }

  const validateSortedUnique = (values: string[], path: Array<string | number>) => {
    if (new Set(values).size !== values.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Canonical dependency identifiers must be unique.", path });
    }
    if (values.some((value, index) => index > 0 && values[index - 1].localeCompare(value) > 0)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Canonical dependency identifiers must use deterministic ascending order.", path });
    }
  };
  validateSortedUnique(candidate.beforeRecord.activeAliases.map((alias) => alias.id), ["beforeRecord", "activeAliases"]);
  validateSortedUnique(candidate.beforeRecord.activeCapabilities.map((capability) => capability.id), ["beforeRecord", "activeCapabilities"]);
  validateSortedUnique(identitySnapshot.organizationCategories, ["beforeRecord", "organization", "organizationCategories"]);
  if (new Set(candidate.sources.map((source) => source.id)).size !== candidate.sources.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Canonical repair source IDs must be unique.", path: ["sources"] });
  }
  if (new Set(candidate.sources.map((source) => source.url)).size !== candidate.sources.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Canonical repair source URLs must be unique.", path: ["sources"] });
  }
  if (evidenceById.size !== candidate.fieldEvidence.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Canonical repair field-evidence IDs must be unique.", path: ["fieldEvidence"] });
  }

  candidate.operations.forEach((operation, index) => {
    const path: Array<string | number> = ["operations", index];
    if (operationIds.has(operation.operationId)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Canonical repair operation IDs must be unique.", path: [...path, "operationId"] });
    }
    operationIds.add(operation.operationId);
    if (new Set(operation.evidenceIds).size !== operation.evidenceIds.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Canonical repair operation evidence IDs must be unique.", path: [...path, "evidenceIds"] });
    }
    const operationTarget = operation.operation === "archive_alias"
      ? `${operation.operation}:${operation.aliasId}`
      : operation.operation === "archive_capability"
        ? `${operation.operation}:${operation.capabilityId}`
        : operation.operation === "set_profile_field"
          ? `${operation.operation}:${operation.profileField}`
        : operation.operation;
    if (operationTargets.has(operationTarget)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Canonical repair operations cannot repeat the same target.", path });
    }
    operationTargets.add(operationTarget);
    if (operation.targetId !== candidate.targetMatch.entityId) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Canonical repair operations must target the matched organization.", path: [...path, "targetId"] });
    }
    operation.evidenceIds.forEach((evidenceId) => {
      evidenceUseCounts.set(evidenceId, (evidenceUseCounts.get(evidenceId) ?? 0) + 1);
      const evidence = evidenceById.get(evidenceId);
      if (!evidence) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `Repair evidence '${evidenceId}' is missing from fieldEvidence.`, path: [...path, "evidenceIds"] });
      } else if (!evidence.fieldPath.startsWith(`operations.${operation.operationId}.`)) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `Repair evidence '${evidenceId}' must be mapped to operation ${operation.operationId}.`, path: [...path, "evidenceIds"] });
      }
    });
    const allowedEvidencePaths = new Set<string>();
    const requireEvidencePath = (fieldPath: string, claimClass: "source_backed" | "derived") => {
      allowedEvidencePaths.add(fieldPath);
      const evidence = operation.evidenceIds.map((evidenceId) => evidenceById.get(evidenceId))
        .find((item) => item?.fieldPath === fieldPath && item.claimClass === claimClass);
      if (!evidence) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `Canonical repair operation ${operation.operationId} needs ${claimClass.replaceAll("_", " ")} evidence at ${fieldPath}.`, path: [...path, "evidenceIds"] });
      }
    };
    if (operation.operation === "set_organization_identity") {
      if (!canonicalEqual(operation.before, identitySnapshot)) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Identity repair must preserve the exact reviewed organization snapshot.", path: [...path, "before"] });
      }
      validateSortedUnique(operation.after.organizationCategories, [...path, "after", "organizationCategories"]);
      if (operation.after.name !== operation.before.name && operation.formerNameAlias !== operation.before.name) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "A canonical rename must preserve the exact former canonical name as an alias.", path: [...path, "formerNameAlias"] });
      }
      if (operation.after.name === operation.before.name && operation.formerNameAlias !== null) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "A non-rename identity repair cannot create a former-name alias.", path: [...path, "formerNameAlias"] });
      }
      const beforeComparable = {
        name: operation.before.name,
        legalName: operation.before.legalName,
        websiteUrl: operation.before.websiteUrl,
        entityKind: operation.before.entityKind,
        organizationCategories: operation.before.organizationCategories
      };
      if (canonicalEqual(operation.after, beforeComparable)) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "An identity repair must make at least one reviewed canonical change.", path: [...path, "after"] });
      }
      for (const field of ["name", "legalName", "websiteUrl", "entityKind", "organizationCategories"] as const) {
        if (!canonicalEqual(operation.before[field], operation.after[field])) {
          requireEvidencePath(
            `operations.${operation.operationId}.after.${field}`,
            field === "entityKind" || field === "organizationCategories" ? "derived" : "source_backed"
          );
        }
      }
      if (operation.formerNameAlias !== null) requireEvidencePath(`operations.${operation.operationId}.formerNameAlias`, "source_backed");
    }
    if (operation.operation === "set_profile_field") {
      const liveBefore = Object.prototype.hasOwnProperty.call(resultingProfileData, operation.profileField)
        ? resultingProfileData[operation.profileField]
        : null;
      if (!canonicalEqual(operation.before, liveBefore)) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `Profile repair must preserve the exact current ${operation.profileField} value.`, path: [...path, "before"] });
      }
      if (canonicalEqual(operation.before, operation.after)) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Profile repair must change or remove one exact field.", path: [...path, "after"] });
      }
      if (operation.after === null) delete resultingProfileData[operation.profileField];
      else resultingProfileData[operation.profileField] = operation.after;
      // Use a leaf path rather than the operation-wide `after` container so
      // the claim ledger can bind one atomic value without weakening its
      // operation-container rejection rule.
      requireEvidencePath(`operations.${operation.operationId}.after.value`, "source_backed");
    }
    if (operation.operation === "archive_alias" && operation.aliasId !== operation.before.id) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Alias repair must preserve the exact reviewed alias ID.", path: [...path, "aliasId"] });
    }
    if (operation.operation === "archive_alias" && !candidate.beforeRecord.activeAliases.some((alias) => canonicalEqual(alias, operation.before))) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Archived alias must exactly match an active alias in the reviewed before-record.", path: [...path, "before"] });
    }
    if (operation.operation === "archive_alias") {
      requireEvidencePath(`operations.${operation.operationId}.before.alias`, "source_backed");
      requireEvidencePath(`operations.${operation.operationId}.reason`, "derived");
    }
    if (operation.operation === "add_alias") requireEvidencePath(`operations.${operation.operationId}.alias`, "source_backed");
    if (operation.operation === "archive_capability" && operation.capabilityId !== operation.before.id) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Capability repair must preserve the exact reviewed capability ID.", path: [...path, "capabilityId"] });
    }
    if (operation.operation === "archive_capability" && !candidate.beforeRecord.activeCapabilities.some((capability) => canonicalEqual(capability, operation.before))) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Archived capability must exactly match an active capability in the reviewed before-record.", path: [...path, "before"] });
    }
    if (operation.operation === "archive_capability") {
      requireEvidencePath(`operations.${operation.operationId}.before.name`, "source_backed");
      requireEvidencePath(`operations.${operation.operationId}.reason`, "derived");
      Object.entries(operation.dependencies).forEach(([key, values]) => validateSortedUnique(values, [...path, "dependencies", key]));
      for (const relationKey of [...operation.dependencies.activeDomainKeys, ...operation.dependencies.activeClusterKeys]) {
        if (!relationKey.startsWith(`${operation.capabilityId}:`)) {
          context.addIssue({ code: z.ZodIssueCode.custom, message: "Capability dependency relationship keys must belong to the archived capability.", path: [...path, "dependencies"] });
        }
      }
      if (operation.dependencies.signalRecordLinkIds.length || operation.dependencies.wikiPageRecordLinkIds.length) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "A capability with published editorial links cannot enter canonical archival; retain it for manual research resolution.", path: [...path, "dependencies"] });
      }
    }
    if (operation.operation === "archive_organization") {
      archiveOrganizationCount += 1;
      requireEvidencePath(`operations.${operation.operationId}.before.name`, "source_backed");
      requireEvidencePath(`operations.${operation.operationId}.reason`, "derived");
      if (!canonicalEqual(operation.before, identitySnapshot)) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Organization archive must preserve the exact reviewed organization snapshot.", path: [...path, "before"] });
      }
      if (operation.successor?.id === candidate.targetMatch.entityId) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "An organization cannot redirect to itself.", path: [...path, "successor", "id"] });
      }
      if ((operation.reason === "superseded") !== Boolean(operation.successor)) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Only a superseded organization may name a successor, and every superseded organization must name one.", path: [...path, "successor"] });
      }
      if (operation.successor) requireEvidencePath(`operations.${operation.operationId}.successor`, "source_backed");
      Object.entries(operation.dependencies).forEach(([key, values]) => validateSortedUnique(values, [...path, "dependencies", key]));
      if (!canonicalEqual(operation.dependencies.activeAliasIds, candidate.beforeRecord.activeAliases.map((alias) => alias.id))) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Organization archive alias dependencies must equal the reviewed active-alias snapshot.", path: [...path, "dependencies", "activeAliasIds"] });
      }
      if (!canonicalEqual(operation.dependencies.activeCapabilityIds, candidate.beforeRecord.activeCapabilities.map((capability) => capability.id))) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Organization archive capability dependencies must equal the reviewed active-capability snapshot.", path: [...path, "dependencies", "activeCapabilityIds"] });
      }
      if (operation.dependencies.incomingActiveRelationshipIds.length || operation.dependencies.signalRecordLinkIds.length || operation.dependencies.wikiPageRecordLinkIds.length) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "An organization with incoming or published editorial links cannot enter canonical archival; retain it for manual research resolution.", path: [...path, "dependencies"] });
      }
      const activeCapabilityIds = new Set(operation.dependencies.activeCapabilityIds);
      for (const relationKey of [...operation.dependencies.activeDomainKeys, ...operation.dependencies.activeClusterKeys]) {
        if (!activeCapabilityIds.has(relationKey.split(":")[0])) {
          context.addIssue({ code: z.ZodIssueCode.custom, message: "Organization dependency relationship keys must belong to a reviewed active capability.", path: [...path, "dependencies"] });
        }
      }
    }
    for (const evidenceId of operation.evidenceIds) {
      const evidence = evidenceById.get(evidenceId);
      if (evidence && !allowedEvidencePaths.has(evidence.fieldPath)) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `Canonical repair evidence path ${evidence.fieldPath} is not valid for ${operation.operation}.`, path: [...path, "evidenceIds"] });
      }
    }
  });

  const archiveOnly = archiveOrganizationCount === 1 && candidate.operations.length === 1;
  if (!archiveOnly) {
    const resultingEntityKind = identityOperation?.operation === "set_organization_identity"
      ? identityOperation.after.entityKind
      : identitySnapshot.entityKind;
    const profileOperations = candidate.operations.filter((operation) => operation.operation === "set_profile_field");
    const kindChanged = identityOperation?.operation === "set_organization_identity"
      && identityOperation.after.entityKind !== identitySnapshot.entityKind;
    if (profileOperations.length && !kindChanged) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Canonical profile-field repair is limited to fields changed or removed as part of an entity-kind correction; ordinary profile edits use organization refresh v2.", path: ["operations"] });
    }

    if (kindChanged) {
      const allowedResultingProfileFields = new Set([
        ...organizationProfileFieldAllowlist[resultingEntityKind],
        "publicContact"
      ]);
      const invalidResultingProfileFields = Object.keys(resultingProfileData).filter((field) => !allowedResultingProfileFields.has(field));
      if (invalidResultingProfileFields.length) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `Canonical repair leaves profile fields invalid for ${resultingEntityKind}: ${invalidResultingProfileFields.join(", ")}.`, path: ["operations"] });
      }

      const requiredRoleField = resultingEntityKind === "research_test_centre" ? "technicalMandate"
        : ["accelerator", "incubator", "investor_funder", "ecosystem_organization", "government_innovation_office"].includes(resultingEntityKind) ? "mandate"
          : null;
      if (requiredRoleField) {
        const roleValue = resultingProfileData[requiredRoleField];
        if (typeof roleValue !== "string" || roleValue.trim().length < 40) {
          context.addIssue({ code: z.ZodIssueCode.custom, message: `Canonical entity-kind repair requires a source-backed ${requiredRoleField} of at least 40 characters.`, path: ["operations"] });
        }
      }
      for (const [index, operation] of candidate.operations.entries()) {
        if (operation.operation !== "set_profile_field") continue;
        const allowedRemoval = operation.after === null && !allowedResultingProfileFields.has(operation.profileField);
        const allowedRoleField = operation.profileField === requiredRoleField;
        if (!allowedRemoval && !allowedRoleField) {
          context.addIssue({ code: z.ZodIssueCode.custom, message: "Profile-field canonical repair may only remove a field invalid for the corrected kind or set that kind's required mandate field.", path: ["operations", index, "profileField"] });
        }
      }
    }
  }

  for (const evidence of candidate.fieldEvidence) {
    if (!sourceIds.has(evidence.sourceId)) context.addIssue({ code: z.ZodIssueCode.custom, message: `Canonical repair evidence ${evidence.id} references missing source ${evidence.sourceId}.`, path: ["fieldEvidence"] });
    if ((evidenceUseCounts.get(evidence.id) ?? 0) !== 1) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `Canonical repair evidence ${evidence.id} must be used by exactly one operation.`, path: ["fieldEvidence"] });
    }
  }
  const referencedSourceIds = new Set(candidate.fieldEvidence.map((evidence) => evidence.sourceId));
  for (const source of candidate.sources) {
    if (!referencedSourceIds.has(source.id)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `Canonical repair source ${source.id} is unused.`, path: ["sources"] });
    }
  }

  if (candidate.targetMatch.confidence !== "high") {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Canonical repair requires a high-confidence exact target match.", path: ["targetMatch", "confidence"] });
  }
  if (candidate.duplicateCheck.status !== "clear" || candidate.duplicateCheck.matches.length !== 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Canonical repair duplicate status must be clear with no unresolved matches; a reviewed successor is a lifecycle mapping, not a duplicate resolution.", path: ["duplicateCheck"] });
  }

  const archivedAliasIds = new Set(candidate.operations.flatMap((operation) => operation.operation === "archive_alias" ? [operation.aliasId] : []));
  const finalAliasValues = [
    ...candidate.beforeRecord.activeAliases.filter((alias) => !archivedAliasIds.has(alias.id)).map((alias) => alias.alias),
    ...candidate.operations.flatMap((operation) => operation.operation === "add_alias" ? [operation.alias] : []),
    ...(identityOperation?.operation === "set_organization_identity" && identityOperation.formerNameAlias ? [identityOperation.formerNameAlias] : [])
  ].map(normalizeOrganizationIdentity);
  const finalName = identityOperation?.operation === "set_organization_identity" ? identityOperation.after.name : identitySnapshot.name;
  const finalLegalName = identityOperation?.operation === "set_organization_identity" ? identityOperation.after.legalName : identitySnapshot.legalName;
  if (!normalizeOrganizationIdentity(finalName)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "The resulting canonical name must contain at least one letter or number.", path: ["operations"] });
  }
  if (finalLegalName !== null && !normalizeOrganizationIdentity(finalLegalName)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "The resulting legal name must contain at least one letter or number.", path: ["operations"] });
  }
  if (finalAliasValues.some((alias) => alias.length === 0)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Every resulting alias must contain at least one letter or number.", path: ["operations"] });
  }
  if (new Set(finalAliasValues).size !== finalAliasValues.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "The resulting canonical alias set contains a normalized duplicate.", path: ["operations"] });
  }
  if (finalAliasValues.includes(normalizeOrganizationIdentity(finalName))) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "The resulting canonical name cannot duplicate an active or proposed alias on the same organization.", path: ["operations"] });
  }
  if (finalLegalName && finalAliasValues.includes(normalizeOrganizationIdentity(finalLegalName))) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "The resulting legal name cannot duplicate an active or proposed alias on the same organization.", path: ["operations"] });
  }

  if (archiveOrganizationCount > 0 && candidate.operations.length > 1) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Archiving an organization must be the candidate's only operation.", path: ["operations"] });
  }
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
  organizationCanonicalRepairBundleV1Schema,
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
  candidates: z.array(reviewCandidateSchema).max(50),
  deferred: z.array(z.object({
    leadId: slugSchema,
    readinessDisposition: z.enum(["research_required", "no_material_change"]).optional(),
    reason: z.string().trim().min(20).max(1000),
    followUp: z.string().trim().min(10).max(1000)
  }))
}).superRefine((batch, context) => {
  const candidateIds = new Set<string>();
  for (const [index, candidate] of batch.candidates.entries()) {
    if (candidateIds.has(candidate.candidateId)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `Candidate ID ${candidate.candidateId} is duplicated inside the batch.`, path: ["candidates", index, "candidateId"] });
    }
    candidateIds.add(candidate.candidateId);
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
  mode: z.enum(["bootstrap", "gap_targeted", "discovery_batch", "deep_dossier", "dossier_enrichment", "corpus_refresh", "canonical_repair", "refresh_batch"]),
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
    totalMinutes: z.number().int().min(1).max(480),
    sourceBookMinutes: z.number().int().min(0).max(30),
    maxQualifiedLeads: z.number().int().min(1).max(50),
    maxCandidates: z.number().int().min(1).max(50),
    maxSourceItems: z.number().int().min(1).max(50).optional(),
    minimumProspects: z.number().int().min(1).max(75).optional(),
    minimumSourceLanes: z.number().int().min(1).max(10).optional(),
    minimumCandidates: z.number().int().min(1).max(50).optional(),
    targetCandidates: z.number().int().min(1).max(50).optional()
  }),
  sourceQueries: z.array(z.string().trim().min(3).max(500)).max(200),
  counters: z.object({
    sourcesChecked: z.number().int().min(0),
    leadsQualified: z.number().int().min(0).max(50),
    leadsDeferred: z.number().int().min(0),
    candidatesCreated: z.number().int().min(0).max(50),
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
    claimsCollected: z.number().int().min(0).max(1000).optional(),
    claimsConflicted: z.number().int().min(0).max(1000).optional(),
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
    canonicalRepairSnapshot: z.string().nullable().optional(),
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
export type OrganizationCanonicalRepairBundleV1 = z.infer<typeof organizationCanonicalRepairBundleV1Schema>;
export type CanonicalOrganizationRepairSnapshotV1 = z.infer<typeof canonicalOrganizationRepairSnapshotV1Schema>;
export type DemandRefreshBundleV1 = z.infer<typeof demandRefreshBundleV1Schema>;
export type ResearchSignalBatchV1 = z.infer<typeof researchSignalBatchV1Schema>;
export type ResearchCandidateBatchV2 = z.infer<typeof researchCandidateBatchV2Schema>;
export type ResearchRun = z.infer<typeof researchRunSchema>;
export type ReviewCandidate = z.infer<typeof reviewCandidateSchema>;

export const currentResearchPipelineVersion = "tnm-research-pipeline/1.8.0" as const;
export const researchDecisionBriefLabels = [
  "Coverage value",
  "Evidence",
  "Mission/Public Need read",
  "Unknowns",
  "Reviewer action"
] as const;

function pipelineVersion(agentVersion: string) {
  const match = agentVersion.match(/^tnm-research-pipeline\/(\d+)\.(\d+)\.(\d+)$/);
  return match ? { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) } : null;
}

export function requiresResearchQualityContract(agentVersion: string) {
  const version = pipelineVersion(agentVersion);
  return version !== null && (version.major > 1 || (version.major === 1 && version.minor >= 5));
}

export function requiresRecordSpecificResearchContract(agentVersion: string) {
  const version = pipelineVersion(agentVersion);
  return version !== null && (version.major > 1 || (version.major === 1 && version.minor >= 7));
}

export function requiresExecutiveRelevanceContract(agentVersion: string) {
  const version = pipelineVersion(agentVersion);
  return version !== null && (version.major > 1
    || (version.major === 1 && (version.minor > 7 || (version.minor === 7 && version.patch >= 3))));
}

export function requiresCanonicalRepairContract(agentVersion: string) {
  const version = pipelineVersion(agentVersion);
  return version !== null && (version.major > 1 || (version.major === 1 && version.minor >= 8));
}

function requiresStructuredRefreshDateContract(agentVersion: string) {
  const version = pipelineVersion(agentVersion);
  return version !== null && (version.major > 1
    || (version.major === 1 && (version.minor > 7 || (version.minor === 7 && version.patch >= 1))));
}

function requiresProductionCorpusContract(agentVersion: string) {
  const version = pipelineVersion(agentVersion);
  return version !== null && (version.major > 1
    || (version.major === 1 && (version.minor > 7 || (version.minor === 7 && version.patch >= 2))));
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

export function researchReviewLineageIssues(options: {
  run: ResearchRun;
  leads: SourceLeadBatchV2;
  signals: ResearchSignalBatchV1 | null;
  ledger: ResearchClaimLedgerV1;
  batch: ResearchCandidateBatchV2;
}) {
  const { run, leads, signals, ledger, batch } = options;
  const errors: string[] = [];
  const candidateIds = new Set(batch.candidates.map((candidate) => candidate.candidateId));
  const candidatesById = new Map(batch.candidates.map((candidate) => [candidate.candidateId, candidate]));
  const qualifiedLeadIds = new Set(leads.leads.filter((lead) => lead.disposition === "qualified").map((lead) => lead.id));
  const leadsById = new Map<string, SourceLeadBatchV2["leads"][number][]>();
  const signalsById = new Map<string, ResearchSignalBatchV1["signals"][number][]>();
  const evidenceKeys = new Set<string>();
  const subjectsById = new Map<string, ResearchClaimLedgerV1["subjects"][number]>();

  for (const lead of leads.leads) leadsById.set(lead.id, [...(leadsById.get(lead.id) ?? []), lead]);
  for (const signal of signals?.signals ?? []) signalsById.set(signal.signalId, [...(signalsById.get(signal.signalId) ?? []), signal]);

  if (run.counters.candidatesCreated !== batch.candidates.length) errors.push("Run candidate counter does not match candidate batch size.");
  if ((run.counters.claimsCollected ?? 0) !== ledger.claims.length) errors.push("Run claim counter does not match claim ledger.");
  if ((run.counters.claimsConflicted ?? 0) !== ledger.claims.filter((claim) => claim.status === "conflicted").length) errors.push("Run conflicted-claim counter does not match claim ledger.");
  if ((run.counters.coverageSubjects ?? 0) !== ledger.subjects.length) errors.push("Run coverage-subject counter does not match claim ledger.");

  for (const subject of ledger.subjects) {
    if (subjectsById.has(subject.subjectId)) errors.push(`Claim-ledger subject ID ${subject.subjectId} is duplicated.`);
    subjectsById.set(subject.subjectId, subject);
    if (new Set(subject.candidateIds).size !== subject.candidateIds.length) errors.push(`Subject ${subject.subjectId} contains a duplicate candidate ID.`);
    if (subject.candidateIds.length > 1) errors.push(`Subject ${subject.subjectId} combines multiple candidate targets.`);
    for (const candidateId of subject.candidateIds) {
      if (!candidateIds.has(candidateId)) errors.push(`Subject ${subject.subjectId} references unknown candidate ${candidateId}.`);
    }
    for (const coverage of subject.coverage) {
      for (const claimId of coverage.claimIds) {
        const claim = ledger.claims.find((item) => item.claimId === claimId);
        if (claim && claim.subjectId !== subject.subjectId) errors.push(`Subject ${subject.subjectId} coverage references claim ${claimId} owned by ${claim.subjectId}.`);
      }
    }
  }

  for (const claim of ledger.claims) {
    const subject = subjectsById.get(claim.subjectId);
    if (!subject) errors.push(`Claim ${claim.claimId} references missing subject ${claim.subjectId}.`);
    if (subject && claim.subjectType !== subject.subjectType) errors.push(`Claim ${claim.claimId} subject type does not match ${subject.subjectId}.`);
    if (claim.disposition === "candidate_field" && claim.candidateTargets.length !== 1) {
      errors.push(`Claim ${claim.claimId} must target exactly one candidate leaf field.`);
    }
    if (claim.disposition === "candidate_field" && subject && !subject.coverage.some((coverage) => coverage.claimIds.includes(claim.claimId))) {
      errors.push(`Claim ${claim.claimId} is not included in coverage for subject ${subject.subjectId}.`);
    }
    for (const target of claim.candidateTargets) {
      if (!candidateIds.has(target.candidateId)) errors.push(`Claim ${claim.claimId} targets unknown candidate ${target.candidateId}.`);
      if (subject && !subject.candidateIds.includes(target.candidateId)) errors.push(`Claim ${claim.claimId} targets candidate ${target.candidateId} outside subject ${subject.subjectId}.`);
      const operationPath = target.fieldPath.match(/^operations\.([^.]+)\./);
      if (operationPath && target.operationId !== operationPath[1]) errors.push(`Claim ${claim.claimId} operationId does not match its field path.`);
    }
    if (claim.disposition === "candidate_field" && ["supported", "corroborated"].includes(claim.status)
        && claim.source.sourcePosture !== "discovery_only" && claim.candidateTargets.length === 1) {
      const target = claim.candidateTargets[0];
      const targetCandidate = candidatesById.get(target.candidateId);
      const matchingEvidence = targetCandidate?.fieldEvidence.filter((evidence) =>
        (evidence.claimClass === "source_backed" || targetCandidate.candidateKind === "organization_canonical_repair_bundle")
        && evidence.sourceId === claim.source.sourceId
        && evidence.fieldPath === target.fieldPath
        && evidence.excerpt === claim.value
      ) ?? [];
      if (matchingEvidence.length !== 1) errors.push(`Claim ${claim.claimId} must map to exactly one source-backed field-evidence leaf with the same excerpt.`);
    }
  }
  for (const candidate of batch.candidates) {
    if (new Set(candidate.sourceLeadIds).size !== candidate.sourceLeadIds.length) errors.push(`Candidate ${candidate.candidateId} contains duplicate source lead IDs.`);
    for (const leadId of candidate.sourceLeadIds) {
      if (!qualifiedLeadIds.has(leadId)) errors.push(`Candidate ${candidate.candidateId} references lead ${leadId}, which is not qualified.`);
    }
    if (candidate.candidateKind === "organization_canonical_repair_bundle") {
      const target = candidate.targetMatch;
      if (candidate.sourceLeadIds.length !== 1) {
        errors.push(`Canonical repair candidate ${candidate.candidateId} must bind to exactly one qualified record-refresh lead.`);
      }
      for (const leadId of candidate.sourceLeadIds) {
        const matchingLeads = leadsById.get(leadId) ?? [];
        if (matchingLeads.length !== 1) {
          errors.push(`Canonical repair candidate ${candidate.candidateId} source lead ${leadId} is missing or duplicated.`);
          continue;
        }
        const lead = matchingLeads[0];
        if (lead.leadType !== "record_refresh_lead" || lead.disposition !== "qualified"
            || lead.targetMatch.entityType !== "organization" || lead.targetMatch.entityId !== target.entityId
            || lead.targetMatch.slug !== target.slug || lead.targetMatch.baselineUpdatedAt !== target.baselineUpdatedAt) {
          errors.push(`Canonical repair candidate ${candidate.candidateId} source lead ${leadId} does not match its organization target and baseline.`);
        }
        if (lead.leadType === "record_refresh_lead" && lead.signalIds.length > 0) {
          errors.push(`Canonical repair lead ${leadId} must not repurpose dated Signals as canonical identity authority.`);
        }
      }
    }
    if (candidate.candidateKind === "organization_refresh_bundle" || candidate.candidateKind === "demand_refresh_bundle") {
      const target = candidate.targetMatch;
      const candidateSignalIds = new Set(candidate.signalIds);
      if (candidateSignalIds.size !== candidate.signalIds.length) errors.push(`Candidate ${candidate.candidateId} contains duplicate signal IDs.`);
      if (run.mode === "refresh_batch" && candidate.signalIds.length === 0) {
        errors.push(`Refresh-batch candidate ${candidate.candidateId} needs at least one linked qualified signal; signal-free candidates are allowed only in organization-dossier or corpus refresh.`);
      }
      for (const leadId of candidate.sourceLeadIds) {
        const matchingLeads = leadsById.get(leadId) ?? [];
        if (matchingLeads.length !== 1) {
          errors.push(`Candidate ${candidate.candidateId} source lead ${leadId} is missing or duplicated.`);
          continue;
        }
        const lead = matchingLeads[0];
        if (lead.leadType !== "record_refresh_lead" || lead.disposition !== "qualified"
            || lead.targetMatch.entityType !== target.entityType || lead.targetMatch.entityId !== target.entityId
            || lead.targetMatch.slug !== target.slug || lead.targetMatch.baselineUpdatedAt !== target.baselineUpdatedAt) {
          errors.push(`Candidate ${candidate.candidateId} source lead ${leadId} does not match its refresh target and baseline.`);
        } else if (new Set(lead.signalIds).size !== lead.signalIds.length
            || lead.signalIds.length !== candidateSignalIds.size || lead.signalIds.some((signalId) => !candidateSignalIds.has(signalId))) {
          errors.push(`Candidate ${candidate.candidateId} signal IDs do not match source lead ${leadId}.`);
        }
      }
      for (const signalId of candidate.signalIds) {
        const matchingSignals = signalsById.get(signalId) ?? [];
        if (matchingSignals.length !== 1) {
          errors.push(`Candidate ${candidate.candidateId} signal ${signalId} is missing or duplicated.`);
          continue;
        }
        const signal = matchingSignals[0];
        const requiredOutcome = candidate.candidateKind === "organization_refresh_bundle" ? "organization_refresh" : "demand_refresh";
        const targetMatch = signal.liveEntityMatches.some((match) =>
          match.entityType === target.entityType && match.entityId === target.entityId
          && match.slug === target.slug && match.baselineUpdatedAt === target.baselineUpdatedAt
        );
        if (signal.disposition !== "qualified" || !signal.intendedOutcomes.includes(requiredOutcome) || !targetMatch) {
          errors.push(`Candidate ${candidate.candidateId} signal ${signalId} does not qualify for its refresh target and baseline.`);
        }
      }
    }
    const candidateSubjects = ledger.subjects.filter((subject) => subject.candidateIds.includes(candidate.candidateId));
    if (candidateSubjects.length !== 1) errors.push(`Candidate ${candidate.candidateId} must belong to exactly one dossier coverage subject.`);
    const candidateEvidence = candidate.candidateKind === "organization_canonical_repair_bundle"
      ? candidate.fieldEvidence
      : candidate.fieldEvidence.filter((item) => item.claimClass === "source_backed");
    for (const evidence of candidateEvidence) {
      const evidenceKey = `${candidate.candidateId}\u0000${evidence.fieldPath}\u0000${evidence.sourceId}`;
      if (evidenceKeys.has(evidenceKey)) {
        const evidenceLabel = candidate.candidateKind === "organization_canonical_repair_bundle" ? "evidence" : "source-backed evidence";
        errors.push(`Candidate ${candidate.candidateId} has duplicate ${evidenceLabel} for ${evidence.fieldPath} from ${evidence.sourceId}.`);
      }
      evidenceKeys.add(evidenceKey);
      const mappedClaims = ledger.claims.filter((claim) =>
        claim.disposition === "candidate_field"
        && ["supported", "corroborated"].includes(claim.status)
        && claim.source.sourcePosture !== "discovery_only"
        && claim.candidateTargets.length === 1
        && claim.source.sourceId === evidence.sourceId
        && claim.value === evidence.excerpt
        && claim.candidateTargets.some((target) => target.candidateId === candidate.candidateId && target.fieldPath === evidence.fieldPath)
      );
      if (mappedClaims.length !== 1) {
        errors.push(`Candidate ${candidate.candidateId} evidence ${evidence.id} must map to exactly one atomic claim-ledger leaf.`);
        continue;
      }
      if (candidate.candidateKind === "organization_canonical_repair_bundle") {
        const source = candidate.sources.find((item) => item.id === evidence.sourceId);
        const claimSource = mappedClaims[0].source;
        if (!source || (source.url !== claimSource.canonicalUrl && source.url !== claimSource.originalUrl)) {
          errors.push(`Canonical repair evidence ${evidence.id} source URL must equal its claim-ledger canonical or original URL.`);
        }
      }
    }
  }
  return errors;
}

type RecordSpecificityArtifacts = {
  run: ResearchRun;
  plan: ResearchCollectionPlanV1;
  prospects: ResearchProspectInventoryV1 | null;
  signals: ResearchSignalBatchV1 | null;
  leads: SourceLeadBatchV2;
  ledger: ResearchClaimLedgerV1;
  batch: ResearchCandidateBatchV2;
};

const recordSpecificStopWords = new Set([
  "about", "after", "against", "also", "before", "being", "between", "candidate", "changes", "company", "current", "development", "dossier", "durable", "editorial", "evidence", "field", "from", "moderate", "organization", "profile", "proposed", "provide", "provides", "public", "question", "ready", "record", "review", "reviewed", "source", "sources", "supported", "their", "there", "these", "this", "through", "update", "using", "value", "with", "works"
]);

function normalizedResearchText(value: string, subjectValues: string[] = []) {
  let normalized = value.toLowerCase();
  for (const subjectValue of [...subjectValues].sort((left, right) => right.length - left.length)) {
    const subject = subjectValue.toLowerCase().replaceAll("-", " ").trim();
    if (subject) normalized = normalized.replaceAll(subject, "<subject>");
  }
  return normalized.replace(/https?:\/\/\S+/g, "<url>").replace(/\b\d[\d,.:/-]*\b/g, "<number>").replace(/[^a-z0-9<>]+/g, " ").trim();
}

function distinctiveResearchTokens(value: unknown) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value) ?? "";
  return [...new Set(serialized.toLowerCase().match(/[a-z0-9][a-z0-9@./+-]{3,}/g) ?? [])]
    .filter((token) => !recordSpecificStopWords.has(token) && !token.startsWith("http"));
}

function scalarResearchValues(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.flatMap(scalarResearchValues);
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).flatMap(scalarResearchValues);
  return [String(value)];
}

function strongResearchAnchors(value: unknown) {
  return [...new Set(scalarResearchValues(value).flatMap((scalar) => scalar.match(/https?:\/\/\S+|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b\d{4}-\d{2}-\d{2}\b|\b[a-z]{1,12}[-_/]\d[a-z0-9-_/]*\b|\b(?:c\$|us\$|\$)\s?\d[\d,.]*\b|\b[a-z][a-z0-9]+_[a-z0-9_]+\b/gi) ?? []))]
    .map((anchor) => anchor.replace(/[),.;]+$/g, "").toLowerCase());
}

function includesRecordSpecificValue(text: string, value: unknown, excludedValues: string[] = [], minimumTokens = 2) {
  const normalized = text.toLowerCase();
  if (strongResearchAnchors(value).some((anchor) => normalized.includes(anchor))) return true;
  const excludedTokens = new Set(excludedValues.flatMap((excluded) => distinctiveResearchTokens(excluded)));
  const matches = distinctiveResearchTokens(scalarResearchValues(value).join(" "))
    .filter((token) => !excludedTokens.has(token) && normalized.includes(token));
  return new Set(matches).size >= minimumTokens;
}

function rationaleSections(value: string) {
  const sections = new Map<string, string>();
  for (const [index, label] of researchDecisionBriefLabels.entries()) {
    const start = value.indexOf(`${label}:`);
    const nextLabel = researchDecisionBriefLabels[index + 1];
    const end = nextLabel ? value.indexOf(`${nextLabel}:`) : value.length;
    if (start >= 0) sections.set(label, value.slice(start + label.length + 1, end >= 0 ? end : value.length).trim());
  }
  return sections;
}

type RecordSpecificRefreshOperation = OrganizationRefreshBundleV2["operations"][number] | OrganizationRefreshBundleV1["operations"][number] | DemandRefreshBundleV1["operations"][number];

function operationField(operation: RecordSpecificRefreshOperation) {
  if (operation.operation === "set_field") return operation.field;
  if (operation.operation === "set_profile_field") return operation.profileField;
  return operation.entityType;
}

function operationAfter(operation: RecordSpecificRefreshOperation) {
  return operation.operation === "add_child" ? operation.value : operation.after;
}

function operationBefore(operation: RecordSpecificRefreshOperation) {
  return operation.operation === "add_child" ? null : operation.before;
}

function changedFieldWords(field: string) {
  return field.replaceAll("_", " ").replaceAll("-", " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
}

function publisherOrDomainAnchors(candidate: ReviewCandidate) {
  return candidate.sources.flatMap((source) => {
    const domain = (() => { try { return new URL(source.url).hostname.replace(/^www\./, ""); } catch { return ""; } })();
    return [source.publisher.toLowerCase(), domain];
  }).filter(Boolean);
}

function researchSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function relationshipChangeForCandidate(candidate: Extract<ReviewCandidate, { candidateKind: "organization_refresh_bundle" | "demand_refresh_bundle" }>) {
  for (const operation of candidate.operations) {
    if (operation.operation !== "add_child" && operation.operation !== "update_child") continue;
    if (operation.entityType !== "capability") continue;
    const after = operationAfter(operation) as { name?: string; summary?: string; missionMatches?: Array<{ missionAreaSlug?: string }> };
    const before = operationBefore(operation) as { missionMatches?: Array<{ missionAreaSlug?: string }> } | null;
    const afterSlugs = (after.missionMatches ?? []).map((match) => match.missionAreaSlug).filter((slug): slug is string => Boolean(slug));
    const beforeSlugs = (before?.missionMatches ?? []).map((match) => match.missionAreaSlug).filter((slug): slug is string => Boolean(slug));
    if (JSON.stringify([...afterSlugs].sort()) !== JSON.stringify([...beforeSlugs].sort())) {
      return { slugs: afterSlugs, capability: [after.name, after.summary].filter(Boolean).join(" ") };
    }
  }
  return null;
}

export function researchRecordSpecificityIssues({ run, plan, prospects, signals, leads, ledger, batch }: RecordSpecificityArtifacts) {
  if (!requiresRecordSpecificResearchContract(run.agentVersion)) return [];
  const errors: string[] = [];
  const minimumSourceLanes = run.limits.minimumSourceLanes ?? 1;
  for (const lead of leads.leads) {
    if (lead.disposition !== "deferred" || lead.deferralClass !== "recovery_exhausted") continue;
    const laneCount = new Set((lead.recoveryAttempts ?? []).map((attempt) => attempt.lane)).size;
    if (laneCount < minimumSourceLanes) {
      errors.push(`Deferred lead ${lead.id} searched ${laneCount} source lanes; ${run.mode} requires at least ${minimumSourceLanes}.`);
    }
  }
  const organizationDossierMode = run.mode === "dossier_enrichment" || run.mode === "corpus_refresh";
  const candidatesById = new Map(batch.candidates.map((candidate) => [candidate.candidateId, candidate]));
  const refreshCandidates = batch.candidates.filter((candidate) => candidate.candidateKind === "organization_refresh_bundle" || candidate.candidateKind === "demand_refresh_bundle");
  const candidatesBySlug = new Map(refreshCandidates.map((candidate) => [candidate.targetMatch.slug, candidate]));
  const namesBySlug = new Map<string, string>();
  for (const subject of plan.targetSubjects) {
    for (const identifier of subject.canonicalIdentifiers) namesBySlug.set(identifier, subject.name);
  }

  const canonicalRepairCandidates = batch.candidates.filter(
    (candidate) => candidate.candidateKind === "organization_canonical_repair_bundle"
  );
  if ((run.mode === "canonical_repair" || canonicalRepairCandidates.length > 0)
      && !requiresCanonicalRepairContract(run.agentVersion)) {
    errors.push(`Canonical repair requires tnm-research-pipeline/1.8.0 or a compatible newer version; found ${run.agentVersion}.`);
  }
  if (run.mode === "canonical_repair") {
    if (minimumSourceLanes < 2) errors.push(`Canonical-repair run ${run.runId} must require at least two source lanes per target.`);
    if (!prospects) errors.push(`Canonical-repair run ${run.runId} is missing its target inventory.`);
    if (signals) errors.push(`Canonical-repair run ${run.runId} must not manufacture a dated signal batch for identity or lifecycle repair.`);
    if (plan.targetSubjects.length < 1 || plan.targetSubjects.length > 25) errors.push(`Canonical-repair run ${run.runId} must name 1-25 target subjects.`);
    for (const candidate of batch.candidates) {
      if (candidate.candidateKind !== "organization_canonical_repair_bundle") {
        errors.push(`Canonical-repair run ${run.runId} may contain only organization_canonical_repair_bundle_v1 candidates; found ${candidate.schemaVersion}.`);
      }
    }
    const canonicalLeads = leads.leads.filter(
      (lead): lead is Extract<SourceLeadBatchV2["leads"][number], { leadType: "record_refresh_lead" }> =>
        lead.leadType === "record_refresh_lead" && lead.targetMatch.entityType === "organization"
    );
    if (canonicalLeads.length !== leads.leads.length) {
      errors.push(`Canonical-repair run ${run.runId} may contain only organization record-refresh leads.`);
    }
    const subjectSlugs = plan.targetSubjects.map((subject) =>
      subject.subjectId.startsWith("organization-") ? subject.subjectId.slice("organization-".length) : ""
    );
    if (prospects && prospects.prospects.length !== plan.targetSubjects.length) {
      errors.push(`Canonical-repair run ${run.runId} requires exactly one target-inventory row per planned subject.`);
    }
    if (ledger.subjects.length !== plan.targetSubjects.length) {
      errors.push(`Canonical-repair run ${run.runId} requires exactly one claim-ledger subject per planned subject.`);
    }
    const planSlugCounts = new Map<string, number>();
    for (const slug of subjectSlugs) planSlugCounts.set(slug, (planSlugCounts.get(slug) ?? 0) + 1);
    for (const [slug, count] of planSlugCounts) {
      if (count > 1) errors.push(`Canonical-repair run ${run.runId} repeats target ${slug} in its collection plan.`);
    }
    const targetCounts = new Map<string, number>();
    for (const candidate of canonicalRepairCandidates) {
      targetCounts.set(candidate.targetMatch.slug, (targetCounts.get(candidate.targetMatch.slug) ?? 0) + 1);
    }
    for (const [slug, count] of targetCounts) {
      if (count > 1) errors.push(`Canonical-repair run ${run.runId} repeats target ${slug}.`);
    }
    const dispositionCounts = new Map<string, number>();
    const dispositionBySlug = new Map<string, ResearchCandidateBatchV2["deferred"][number]>();
    for (const disposition of batch.deferred) {
      const matchingLeads = canonicalLeads.filter((item) => item.id === disposition.leadId);
      const lead = matchingLeads[0];
      if (matchingLeads.length !== 1 || !disposition.readinessDisposition) {
        errors.push(`Canonical-repair disposition ${disposition.leadId} must reference one exact record-refresh lead and use a typed readiness disposition.`);
        continue;
      }
      if (lead.disposition !== "deferred") {
        errors.push(`Canonical-repair disposition ${disposition.leadId} must reference a deferred lead, not a qualified or rejected lead.`);
      }
      dispositionCounts.set(lead.targetMatch.slug, (dispositionCounts.get(lead.targetMatch.slug) ?? 0) + 1);
      dispositionBySlug.set(lead.targetMatch.slug, disposition);
    }
    for (const slug of subjectSlugs) {
      const count = (targetCounts.get(slug) ?? 0) + (dispositionCounts.get(slug) ?? 0);
      if (count !== 1) errors.push(`Canonical-repair target ${slug} needs exactly one repair candidate or structured research_required/no_material_change disposition; found ${count}.`);
      const leadCount = canonicalLeads.filter((lead) => lead.targetMatch.slug === slug).length;
      if (leadCount !== 1) errors.push(`Canonical-repair target ${slug} needs exactly one exact record-refresh lead; found ${leadCount}.`);
    }
    for (const slug of new Set([...targetCounts.keys(), ...dispositionCounts.keys()])) {
      if (!subjectSlugs.includes(slug)) errors.push(`Canonical-repair run ${run.runId} includes out-of-scope target ${slug}.`);
    }
    for (const lead of canonicalLeads) {
      if (!subjectSlugs.includes(lead.targetMatch.slug)) {
        errors.push(`Canonical-repair run ${run.runId} includes unused out-of-scope lead ${lead.id} for ${lead.targetMatch.slug}.`);
      }
    }
    for (const candidate of canonicalRepairCandidates) {
      const subject = ledger.subjects.find((item) => item.candidateIds.includes(candidate.candidateId));
      if (!subject || !["low", "zero"].includes(subject.saturation.additionalSearchYield)) {
        errors.push(`Canonical repair candidate ${candidate.candidateId} cannot be ready without a low- or zero-yield coverage subject.`);
      }
      const lead = canonicalLeads.find((item) => candidate.sourceLeadIds.includes(item.id));
      const targetName = namesBySlug.get(candidate.targetMatch.slug) ?? candidate.beforeRecord.organization.name;
      const operationLabels = candidate.operations.map((operation) => operation.operation.replaceAll("_", " "));
      if (lead) {
        if (lead.disposition !== "qualified" || lead.sourceConfidence !== "high" || lead.targetMatch.confidence !== "high") {
          errors.push(`Canonical repair lead ${lead.id} must be qualified with high source and target-match confidence.`);
        }
        if (!canonicalEqual([...lead.targetMatch.matchMethods].sort(), [...candidate.targetMatch.matchMethods].sort())
            || lead.targetMatch.confidence !== candidate.targetMatch.confidence) {
          errors.push(`Canonical repair lead ${lead.id} match methods and confidence must equal candidate ${candidate.candidateId}.`);
        }
        const leadSummary = lead.refreshSummary.toLowerCase();
        if (!leadSummary.includes(targetName.toLowerCase()) || !operationLabels.some((label) => leadSummary.includes(label))) {
          errors.push(`Canonical repair lead ${lead.id} must name its target and proposed operation.`);
        }
      }
      const sections = rationaleSections(candidate.reviewerRationale);
      const coverageSection = sections.get("Coverage value") ?? "";
      if (!coverageSection.toLowerCase().includes(targetName.toLowerCase())
          || !operationLabels.some((label) => coverageSection.toLowerCase().includes(label))) {
        errors.push(`Canonical repair candidate ${candidate.candidateId} Coverage value must name its target and repair operation.`);
      }
      const evidenceSection = sections.get("Evidence") ?? "";
      const sourceAnchors = publisherOrDomainAnchors(candidate);
      const sourceCountPattern = new RegExp(`\\b${candidate.sources.length}\\s+(?:durable\\s+)?sources?\\b`, "i");
      if (!sourceCountPattern.test(evidenceSection) || !sourceAnchors.some((anchor) => evidenceSection.toLowerCase().includes(anchor))) {
        errors.push(`Canonical repair candidate ${candidate.candidateId} Evidence rationale must name its exact source count and at least one source publisher or domain.`);
      }
      const relationshipSection = sections.get("Mission/Public Need read") ?? "";
      if (!/no (?:new|canonical)|unchanged|does not (?:create|transfer|reparent)/i.test(relationshipSection)) {
        errors.push(`Canonical repair candidate ${candidate.candidateId} must state that it does not create or transfer Mission/Public Need relationships.`);
      }
      const boundarySection = `${sections.get("Unknowns") ?? ""} ${sections.get("Reviewer action") ?? ""}`;
      if (!/no hard delete|archive|stable slug|human review/i.test(boundarySection)) {
        errors.push(`Canonical repair candidate ${candidate.candidateId} Unknowns or Reviewer action must explain the archive-or-stable-identity and human-review limit.`);
      }
    }
    for (const [index, planSubject] of plan.targetSubjects.entries()) {
      const slug = subjectSlugs[index];
      const targetLeads = canonicalLeads.filter((lead) => lead.targetMatch.slug === slug);
      const targetLead = targetLeads[0];
      if (!slug || planSubject.subjectId !== `organization-${slug}` || targetLeads.length !== 1) {
        errors.push(`Canonical-repair planned subject ${planSubject.subjectId} must bind to exactly one organization-${slug || "missing"} record-refresh lead.`);
      }
      if (targetLead && (!planSubject.canonicalIdentifiers.includes(slug)
          || !planSubject.canonicalIdentifiers.includes(targetLead.targetMatch.entityId)
          || !planSubject.canonicalIdentifiers.includes(`https://truenorthmap.ca/organizations/${slug}`))) {
        errors.push(`Canonical-repair planned subject ${planSubject.subjectId} must retain its exact slug, UUID, and canonical public URL.`);
      }
      const ledgerSubject = ledger.subjects.find((subject) => subject.subjectId === planSubject.subjectId);
      if (!ledgerSubject || ledgerSubject.name !== planSubject.name || ledgerSubject.subjectType !== planSubject.subjectType) {
        errors.push(`Canonical-repair planned subject ${planSubject.subjectId} must have one exact same-name, same-type claim-ledger subject.`);
      }
      const targetProspects = prospects?.prospects.filter((item) => item.id === `organization-${slug}`) ?? [];
      const prospect = targetProspects[0];
      if (targetProspects.length !== 1 || !prospect || prospect.name !== planSubject.name
          || prospect.proposedEntityType !== "organization" || prospect.disposition !== "selected"
          || prospect.canonicalUrl !== `https://truenorthmap.ca/organizations/${slug}`) {
        errors.push(`Canonical-repair target ${slug} must have one selected organization inventory row using its exact canonical public URL.`);
      }
      if (targetLead && prospect) {
        const searchedLanes = new Set([
          ...(targetLead.discoveryLane ? [targetLead.discoveryLane] : []),
          ...(targetLead.recoveryAttempts ?? []).map((attempt) => attempt.lane),
          prospect.discoveryLane,
          ...prospect.recoveryAttempts.map((attempt) => attempt.lane)
        ]);
        if (searchedLanes.size < minimumSourceLanes) {
          errors.push(`Canonical-repair target ${slug} searched ${searchedLanes.size} source lanes; ${minimumSourceLanes} are required.`);
        }
      }
      const targetCandidate = canonicalRepairCandidates.find((candidate) => candidate.targetMatch.slug === slug);
      if (ledgerSubject) {
        const expectedCandidateIds = targetCandidate ? [targetCandidate.candidateId] : [];
        if (!canonicalEqual(ledgerSubject.candidateIds, expectedCandidateIds)) {
          errors.push(`Canonical-repair claim-ledger subject ${ledgerSubject.subjectId} must bind exactly to its candidate or remain empty for a typed disposition.`);
        }
      }
    }
    const archivedTargets = new Set(canonicalRepairCandidates.flatMap((candidate) =>
      candidate.operations.some((operation) => operation.operation === "archive_organization") ? [candidate.targetMatch.entityId] : []
    ));
    for (const candidate of canonicalRepairCandidates) {
      const archive = candidate.operations.find((operation) => operation.operation === "archive_organization");
      if (archive?.operation === "archive_organization" && archive.successor && archivedTargets.has(archive.successor.id)) {
        errors.push(`Canonical repair candidate ${candidate.candidateId} points to successor ${archive.successor.slug}, which is also archived in this batch.`);
      }
    }
    for (const [slug, disposition] of dispositionBySlug) {
      if (disposition.readinessDisposition !== "no_material_change") continue;
      const planSubject = plan.targetSubjects[subjectSlugs.indexOf(slug)];
      const subject = planSubject ? ledger.subjects.find((item) => item.subjectId === planSubject.subjectId) : undefined;
      if (!subject || !["low", "zero"].includes(subject.saturation.additionalSearchYield)) {
        errors.push(`Canonical-repair target ${slug} cannot use no_material_change without a low- or zero-yield coverage subject.`);
      }
    }
  } else if (canonicalRepairCandidates.length > 0) {
    errors.push(`Run ${run.runId} contains canonical-repair candidates outside canonical_repair mode.`);
  }

  if (requiresExecutiveRelevanceContract(run.agentVersion)) {
    for (const candidate of batch.candidates) {
      if (candidate.schemaVersion === "organization_bundle_v3"
          && !Object.prototype.hasOwnProperty.call(candidate.organization, "executiveRelevanceSummary")) {
        errors.push(`Candidate ${candidate.candidateId} must explicitly provide a supported executiveRelevanceSummary assessment or null after coverage validation.`);
      }
      if (candidate.schemaVersion === "organization_refresh_bundle_v2"
          && !Object.prototype.hasOwnProperty.call(candidate, "executiveRelevanceSummary")) {
        errors.push(`Candidate ${candidate.candidateId} must explicitly provide a supported executiveRelevanceSummary assessment or null after coverage validation.`);
      }
    }
  }

  if (organizationDossierMode) {
    if (!prospects) errors.push(`Organization-dossier run ${run.runId} is missing its prospect inventory.`);
    if (!signals) errors.push(`Organization-dossier run ${run.runId} is missing its signal batch.`);
    if (plan.targetSubjects.length < 1 || plan.targetSubjects.length > 50) errors.push(`Organization-dossier run ${run.runId} must name 1-50 target subjects.`);
    const dossierCandidates = batch.candidates.filter((candidate) => candidate.schemaVersion === "organization_refresh_bundle_v2");
    for (const candidate of batch.candidates) {
      if (candidate.schemaVersion !== "organization_refresh_bundle_v2") errors.push(`Organization-dossier run ${run.runId} may contain only organization_refresh_bundle_v2 candidates; found ${candidate.schemaVersion}.`);
    }
    const refreshLeadsForCoverage = leads.leads.filter(
      (lead): lead is Extract<SourceLeadBatchV2["leads"][number], { leadType: "record_refresh_lead" }> =>
        lead.leadType === "record_refresh_lead" && lead.targetMatch.entityType === "organization"
    );
    const knownTargetSlugs = new Set([...dossierCandidates.map((candidate) => candidate.targetMatch.slug), ...refreshLeadsForCoverage.map((lead) => lead.targetMatch.slug)]);
    const subjectSlugs = plan.targetSubjects.map((subject) => subject.canonicalIdentifiers.find((identifier) => knownTargetSlugs.has(identifier)) ?? researchSlug(subject.name));
    const subjectIdCounts = new Map<string, number>();
    const subjectSlugCounts = new Map<string, number>();
    for (const [index, subject] of plan.targetSubjects.entries()) {
      subjectIdCounts.set(subject.subjectId, (subjectIdCounts.get(subject.subjectId) ?? 0) + 1);
      const slug = subjectSlugs[index];
      subjectSlugCounts.set(slug, (subjectSlugCounts.get(slug) ?? 0) + 1);
    }
    for (const [subjectId, count] of subjectIdCounts) {
      if (count > 1) errors.push(`Dossier-enrichment run ${run.runId} repeats collection-plan subject ID ${subjectId}.`);
    }
    for (const [slug, count] of subjectSlugCounts) {
      if (count > 1) errors.push(`Dossier-enrichment run ${run.runId} repeats target ${slug} in its collection plan.`);
    }
    const candidateCounts = new Map<string, number>();
    for (const candidate of dossierCandidates) candidateCounts.set(candidate.targetMatch.slug, (candidateCounts.get(candidate.targetMatch.slug) ?? 0) + 1);
    const dispositionCounts = new Map<string, number>();
    const dispositionsBySlug = new Map<string, ResearchCandidateBatchV2["deferred"][number]>();
    for (const disposition of batch.deferred) {
      const lead = refreshLeadsForCoverage.find((item) => item.id === disposition.leadId);
      if (!lead || !disposition.readinessDisposition) continue;
      dispositionCounts.set(lead.targetMatch.slug, (dispositionCounts.get(lead.targetMatch.slug) ?? 0) + 1);
      dispositionsBySlug.set(lead.targetMatch.slug, disposition);
    }
    for (const slug of subjectSlugs) {
      const count = (candidateCounts.get(slug) ?? 0) + (dispositionCounts.get(slug) ?? 0);
      if (count !== 1) errors.push(`Organization-dossier target ${slug} needs exactly one refresh candidate or structured research_required/no_material_change disposition; found ${count}.`);
    }
    for (const slug of new Set([...candidateCounts.keys(), ...dispositionCounts.keys()])) {
      if (!subjectSlugs.includes(slug)) errors.push(`Organization-dossier run ${run.runId} includes out-of-scope target ${slug}.`);
    }
    for (const candidate of dossierCandidates) {
      const beforeOrganization = candidate.beforeRecord.organization as Record<string, unknown> | undefined;
      const hasVersionBaseline = Boolean(beforeOrganization && Object.prototype.hasOwnProperty.call(beforeOrganization, "editorial_profile_version"));
      const baselineVersion = beforeOrganization?.editorial_profile_version;
      const needsActivation = hasVersionBaseline && baselineVersion === null;
      const activationOperations = candidate.operations.filter((operation) =>
        operation.operation === "set_field"
        && operation.entityType === "organization"
        && operation.field === "editorial_profile_version"
      );
      const activatesTemplate = activationOperations.length === 1
        && operationBefore(activationOperations[0]) === null
        && operationAfter(activationOperations[0]) === organizationEditorialProfileVersion;
      if (!hasVersionBaseline) {
        errors.push(`Dossier candidate ${candidate.candidateId} is missing beforeRecord.organization.editorial_profile_version.`);
      } else if (baselineVersion !== null && baselineVersion !== organizationEditorialProfileVersion) {
        errors.push(`Dossier candidate ${candidate.candidateId} has unsupported beforeRecord.organization.editorial_profile_version.`);
      } else if (needsActivation && !activatesTemplate) {
        errors.push(`Dossier candidate ${candidate.candidateId} must explicitly activate ${organizationEditorialProfileVersion} because the published record is not yet on the editorial template.`);
      }
      const subject = ledger.subjects.find((item) => item.candidateIds.includes(candidate.candidateId));
      if (subject && !["low", "zero"].includes(subject.saturation.additionalSearchYield)) {
        errors.push(`Dossier candidate ${candidate.candidateId} cannot be ready while subject ${subject.subjectId} reports ${subject.saturation.additionalSearchYield} additional search yield.`);
      }
    }
    for (const [slug, disposition] of dispositionsBySlug) {
      if (disposition.readinessDisposition !== "no_material_change") continue;
      const planSubject = plan.targetSubjects[subjectSlugs.indexOf(slug)];
      const subject = planSubject ? ledger.subjects.find((item) => item.subjectId === planSubject.subjectId) : undefined;
      if (!subject || !["low", "zero"].includes(subject.saturation.additionalSearchYield)) {
        errors.push(`Dossier target ${slug} cannot use no_material_change without a low- or zero-yield coverage subject.`);
      }
    }
  }

  if (requiresProductionCorpusContract(run.agentVersion)) {
    const claimsById = new Map(ledger.claims.map((claim) => [claim.claimId, claim]));
    const independencePattern = /^owner:[^|]+\|origin:[^|]+\|event:[^|]+$/;
    for (const claim of ledger.claims) {
      if (!independencePattern.test(claim.source.independenceKey)) {
        errors.push(`Claim ${claim.claimId} must use owner:<underlying-owner>|origin:<canonical-host>|event:<underlying-event-family> provenance.`);
      }
      for (const independentId of claim.independentClaimIds) {
        const independent = claimsById.get(independentId);
        if (!independent) {
          errors.push(`Claim ${claim.claimId} references missing independent claim ${independentId}.`);
        } else if (independent.claimId === claim.claimId || independent.source.independenceKey === claim.source.independenceKey) {
          errors.push(`Claim ${claim.claimId} does not identify a genuinely independent corroborating claim.`);
        }
      }
      for (const contradictionId of claim.contradictsClaimIds) {
        const contradiction = claimsById.get(contradictionId);
        if (!contradiction) {
          errors.push(`Claim ${claim.claimId} references missing contradiction ${contradictionId}.`);
        } else if (!contradiction.contradictsClaimIds.includes(claim.claimId)) {
          errors.push(`Claim ${claim.claimId} and contradiction ${contradictionId} must link to each other.`);
        }
      }
      for (const supersededId of claim.supersedesClaimIds) {
        if (!claimsById.has(supersededId) || supersededId === claim.claimId) {
          errors.push(`Claim ${claim.claimId} references an invalid superseded claim ${supersededId}.`);
        }
      }
    }
  }

  if (prospects) {
    const selected = prospects.prospects.filter((prospect) => prospect.disposition === "selected");
    for (const prospect of selected) {
      const candidate = refreshCandidates.find((item) => namesBySlug.get(item.targetMatch.slug) === prospect.name);
      const operatingContext = candidate?.operations.find((operation) => operation.operation === "set_field" && operation.field === "operating_context");
      if (/owner-approved published pilot selected to test the editorial dossier/i.test(prospect.fitSummary)) errors.push(`Prospect ${prospect.id} fitSummary describes pilot selection instead of a record-specific decision fit.`);
      if (!prospect.fitSummary.toLowerCase().includes(prospect.name.toLowerCase())) errors.push(`Prospect ${prospect.id} fitSummary does not name its target.`);
      if (!/decid|assess|compare|verify|determin|test whether/i.test(prospect.fitSummary)) errors.push(`Prospect ${prospect.id} fitSummary does not state the review decision it informs.`);
      if (candidate && operatingContext && !includesRecordSpecificValue(prospect.fitSummary, operationAfter(operatingContext), [prospect.name, operationField(operatingContext)])) errors.push(`Prospect ${prospect.id} fitSummary lacks a concrete mandate or capability anchor.`);
      if (candidate) {
        const allSourceAnchors = publisherOrDomainAnchors(candidate);
        const targetText = prospect.name.toLowerCase();
        const independentAnchors = allSourceAnchors.filter((anchor) => !targetText.includes(anchor) && !anchor.includes(targetText));
        const requiredAnchors = independentAnchors.length > 0 ? independentAnchors : allSourceAnchors;
        if (!requiredAnchors.some((anchor) => prospect.fitSummary.toLowerCase().includes(anchor))) errors.push(`Prospect ${prospect.id} fitSummary does not name its evidence route.`);
      }
    }
  }

  const refreshLeads = leads.leads.filter((lead) => lead.leadType === "record_refresh_lead");
  for (const lead of refreshLeads) {
    const candidate = candidatesBySlug.get(lead.targetMatch.slug);
    if (/ready_for_editorial_v1 because durable sources support the proposed narrative and action fields/i.test(lead.refreshSummary)) errors.push(`Lead ${lead.id} refreshSummary is a generic readiness assertion.`);
    if (candidate) {
      const fields = candidate.operations.map((operation) => changedFieldWords(operationField(operation)));
      const targetName = namesBySlug.get(candidate.targetMatch.slug) ?? candidate.targetMatch.slug.replaceAll("-", " ");
      if (!lead.refreshSummary.toLowerCase().includes(targetName.toLowerCase())) errors.push(`Lead ${lead.id} refreshSummary does not name its target.`);
      if (!fields.some((field) => lead.refreshSummary.toLowerCase().includes(field))) errors.push(`Lead ${lead.id} refreshSummary does not name a changed field.`);
      if (!candidate.operations.some((operation) => includesRecordSpecificValue(lead.refreshSummary, operationAfter(operation), [targetName, operationField(operation)])) && !(candidate.reviewWarnings ?? []).some((warning) => includesRecordSpecificValue(lead.refreshSummary, warning, [targetName]))) {
        errors.push(`Lead ${lead.id} refreshSummary lacks a record-specific value, event, or warning anchor.`);
      }
    }
  }

  if (signals) {
    const qualified = signals.signals.filter((signal) => signal.disposition === "qualified" && signal.intendedOutcomes.some((outcome) => outcome === "organization_refresh" || outcome === "demand_refresh"));
    for (const signal of qualified) {
      const candidate = signal.liveEntityMatches.map((match) => candidatesBySlug.get(match.slug)).find(Boolean);
      const changeSummary = signal.extracted.changeSummary ?? "";
      if (requiresStructuredRefreshDateContract(run.agentVersion)
          && !signal.extracted.eventDate && !signal.extracted.effectiveDate && !signal.extracted.procurement?.closingAt) {
        errors.push(`Signal ${signal.signalId} needs a structured eventDate, effectiveDate, or procurement.closingAt for a qualified refresh; undated context and maintenance are not signals.`);
      }
      if (!changeSummary) {
        errors.push(`Signal ${signal.signalId} needs a record-specific changeSummary for a qualified refresh.`);
        continue;
      }
      if (/^consolidated source-backed editorial dossier enrichment/i.test(changeSummary)
          || (requiresProductionCorpusContract(run.agentVersion) && /record supports a dated current activity update/i.test(changeSummary))) {
        errors.push(`Signal ${signal.signalId} changeSummary does not state a record-specific decision delta.`);
      }
      const eventAnchors = [signal.extracted.eventDate, signal.extracted.effectiveDate, signal.extracted.procurement?.closingAt, signal.extracted.amount, signal.extracted.technology, signal.extracted.program, signal.extracted.issuer, signal.extracted.procurement?.noticeId, signal.extracted.procurement?.contractId].filter((value): value is string => Boolean(value));
      const noEventCleanup = /current activity/i.test(changeSummary) && /absent|clear|omit|no material dated/i.test(changeSummary);
      if (eventAnchors.length > 0 && !eventAnchors.some((anchor) => changeSummary.toLowerCase().includes(anchor.toLowerCase())) && !noEventCleanup) {
        errors.push(`Signal ${signal.signalId} changeSummary omits its structured event anchor.`);
      }
      if (candidate) {
        const targetName = namesBySlug.get(candidate.targetMatch.slug) ?? candidate.targetMatch.slug.replaceAll("-", " ");
        if (!changeSummary.toLowerCase().includes(targetName.toLowerCase())) errors.push(`Signal ${signal.signalId} changeSummary does not name its target.`);
        if (!candidate.operations.some((operation) => changeSummary.toLowerCase().includes(changedFieldWords(operationField(operation))))) errors.push(`Signal ${signal.signalId} changeSummary does not name an actual changed field.`);
        if (!noEventCleanup && eventAnchors.length === 0 && !candidate.operations.some((operation) => includesRecordSpecificValue(changeSummary, operationAfter(operation), [targetName, operationField(operation)]))) {
          errors.push(`Signal ${signal.signalId} changeSummary lacks a record-specific event or proposed-value anchor.`);
        }
      }
    }
  }

  for (const candidate of refreshCandidates) {
    const targetName = namesBySlug.get(candidate.targetMatch.slug) ?? candidate.targetMatch.slug.replaceAll("-", " ");
    const sections = rationaleSections(candidate.reviewerRationale);
    const affectedFields = candidate.operations.map((operation) => changedFieldWords(operationField(operation)));
    const coverageSection = sections.get("Coverage value") ?? "";
    if (!coverageSection.toLowerCase().includes(targetName.toLowerCase()) || !affectedFields.some((field) => coverageSection.toLowerCase().includes(field)) || !candidate.operations.some((operation) => includesRecordSpecificValue(coverageSection, operationAfter(operation), [targetName, operationField(operation)]))) {
      errors.push(`Candidate ${candidate.candidateId} Coverage value rationale lacks its target, changed field, or proposed-value anchor.`);
    }
    const evidenceSection = sections.get("Evidence") ?? "";
    const sourceAnchors = publisherOrDomainAnchors(candidate);
    const sourceCountPattern = new RegExp(`\\b${candidate.sources.length}\\s+(?:durable\\s+)?sources?\\b`, "i");
    if (!sourceCountPattern.test(evidenceSection) || !sourceAnchors.some((anchor) => evidenceSection.toLowerCase().includes(anchor))) {
      errors.push(`Candidate ${candidate.candidateId} Evidence rationale must name its exact source count and at least one source publisher or domain.`);
    }
    const missionSection = sections.get("Mission/Public Need read") ?? "";
    const lead = refreshLeads.find((item) => candidate.sourceLeadIds.includes(item.id));
    const relationshipAnchors = lead?.possibleMissionAreaSlugs.map(changedFieldWords) ?? [];
    const relationshipChange = relationshipChangeForCandidate(candidate);
    const relationshipSection = missionSection.toLowerCase();
    const operatingContextOperation = candidate.operations.find((operation) => operation.operation === "set_field" && operation.field === "operating_context");
    if (relationshipChange) {
      const changedAnchors = relationshipChange.slugs.map(changedFieldWords);
      if (!/add|new|propos|change|replace/i.test(missionSection) || !changedAnchors.some((anchor) => relationshipSection.includes(anchor)) || !includesRecordSpecificValue(missionSection, relationshipChange.capability, [targetName])) {
        errors.push(`Candidate ${candidate.candidateId} Mission/Public Need rationale does not explain its proposed relationship change and capability premise.`);
      }
    } else if (!/unchanged|no new|does not create/i.test(missionSection)
      || (relationshipAnchors.length > 0 && !relationshipAnchors.some((anchor) => relationshipSection.includes(anchor)))
      || (operatingContextOperation && !includesRecordSpecificValue(missionSection, operationAfter(operatingContextOperation), [targetName, operationField(operatingContextOperation)]))) {
      errors.push(`Candidate ${candidate.candidateId} Mission/Public Need rationale does not state the unchanged relationship boundary and a record-specific premise.`);
    }
    const unknowns = sections.get("Unknowns") ?? "";
    if ((candidate.reviewWarnings ?? []).length > 0 && !(candidate.reviewWarnings ?? []).some((warning) => includesRecordSpecificValue(unknowns, warning, [targetName]))) {
      errors.push(`Candidate ${candidate.candidateId} Unknowns rationale does not anchor its record-specific warning.`);
    }
    const reviewerAction = sections.get("Reviewer action") ?? "";
    if (!affectedFields.some((field) => reviewerAction.toLowerCase().includes(field)) || !candidate.operations.some((operation) => includesRecordSpecificValue(reviewerAction, operationAfter(operation), [targetName, operationField(operation)]))) {
      errors.push(`Candidate ${candidate.candidateId} Reviewer action rationale lacks a changed field and record-specific decision anchor.`);
    }
    for (const operation of candidate.operations) {
      const field = operationField(operation);
      const fieldWords = changedFieldWords(field);
      const after = operationAfter(operation);
      const before = operationBefore(operation);
      const beforeIsEmpty = before === null || before === undefined || before === "" || (Array.isArray(before) && before.length === 0);
      const directionPattern = after === null ? /clear|remove|omit/i : beforeIsEmpty ? /add|set|record|propose|introduce|normalize/i : /update|replace|revise|correct|normalize/i;
      if (!operation.reviewerExplanation.toLowerCase().includes(fieldWords) && !operation.reviewerExplanation.toLowerCase().includes(field.toLowerCase())) {
        errors.push(`Candidate ${candidate.candidateId} operation ${operation.operationId} explanation does not name the changed field or entity.`);
      }
      if (!directionPattern.test(operation.reviewerExplanation)) errors.push(`Candidate ${candidate.candidateId} operation ${operation.operationId} explanation does not state whether the value is added, updated, or cleared.`);
      const anchorValue = after === null ? before : after;
      if (!includesRecordSpecificValue(operation.reviewerExplanation, anchorValue, [targetName, fieldWords])) errors.push(`Candidate ${candidate.candidateId} operation ${operation.operationId} explanation lacks a distinctive proposed-value anchor.`);
    }
    if (candidate.candidateKind === "organization_refresh_bundle") {
      for (const operation of candidate.operations) {
        if (operation.operation !== "set_field" || operation.field !== "current_activity_as_of" || operation.after === null) continue;
        const activityDate = operation.after;
        if (typeof activityDate !== "string") continue;
        const supportedDates = new Set<string>();
        for (const signalId of candidate.signalIds) {
          const signal = signals?.signals.find((item) => item.signalId === signalId && item.disposition === "qualified");
          for (const date of [signal?.extracted.eventDate, signal?.extracted.effectiveDate, signal?.extracted.procurement?.closingAt]) {
            if (date) supportedDates.add(date.slice(0, 10));
          }
        }
        for (const claim of ledger.claims) {
          if (!claim.candidateTargets.some((target) => target.candidateId === candidate.candidateId && target.operationId === operation.operationId)) continue;
          if (!["supported", "corroborated"].includes(claim.status) || claim.source.sourcePosture === "discovery_only") continue;
          for (const date of [claim.temporal.publishedAt, claim.temporal.effectiveFrom, claim.temporal.effectiveTo]) {
            if (date) supportedDates.add(date.slice(0, 10));
          }
        }
        if (!supportedDates.has(activityDate)) {
          errors.push(`Candidate ${candidate.candidateId} current_activity_as_of ${activityDate} does not match a linked structured signal date or mapped source-backed claim date.`);
        }
      }
    }
  }

  const actualAttemptsBySubject = new Map<string, Set<string>>();
  const addAttempt = (subjectName: string, outcome: string) => {
    const values = actualAttemptsBySubject.get(subjectName) ?? new Set<string>();
    values.add(normalizedResearchText(outcome));
    actualAttemptsBySubject.set(subjectName, values);
  };
  for (const prospect of prospects?.prospects ?? []) for (const attempt of prospect.recoveryAttempts) addAttempt(prospect.name, attempt.outcome);
  for (const lead of refreshLeads) {
    const name = namesBySlug.get(lead.targetMatch.slug) ?? lead.targetMatch.slug.replaceAll("-", " ");
    for (const attempt of lead.recoveryAttempts ?? []) addAttempt(name, attempt.outcome);
  }
  for (const signal of signals?.signals ?? []) {
    const name = signal.extracted.organization;
    if (name) for (const attempt of signal.recoveryAttempts) addAttempt(name, attempt.outcome);
  }

  for (const claim of ledger.claims) {
    if (/^(?:set|add|update|refresh|enrich|normalize|replace|clear|propose)\b|\b(?:support|enrichment)$/i.test(claim.predicate.trim())) {
      errors.push(`Claim ${claim.claimId} uses the workflow predicate '${claim.predicate}' instead of a factual relationship.`);
    }
    const target = claim.candidateTargets[0];
    const candidate = target ? candidatesById.get(target.candidateId) : null;
    const evidence = candidate?.fieldEvidence.find((item) => item.fieldPath === target?.fieldPath && item.sourceId === claim.source.sourceId);
    if (evidence && claim.value !== evidence.excerpt) errors.push(`Claim ${claim.claimId} value does not equal its mapped field-evidence excerpt.`);
    const subjectName = ledger.subjects.find((subject) => subject.subjectId === claim.subjectId)?.name ?? claim.subjectId;
    if (claim.disposition === "candidate_field") {
      if (/retained as one atomic source-backed leaf/i.test(claim.analystNote)) errors.push(`Claim ${claim.claimId} uses a generic analyst note.`);
      const sourcePublisher = candidate?.sources.find((source) => source.id === claim.source.sourceId)?.publisher;
      if (!claim.analystNote.toLowerCase().includes(subjectName.toLowerCase()) || !sourcePublisher || !claim.analystNote.toLowerCase().includes(sourcePublisher.toLowerCase())) errors.push(`Claim ${claim.claimId} analyst note does not identify the subject and supporting source.`);
      if (evidence && !includesRecordSpecificValue(claim.analystNote, evidence.excerpt, [subjectName, sourcePublisher ?? "", target?.fieldPath ?? ""])) errors.push(`Claim ${claim.claimId} analyst note does not anchor the mapped leaf assertion.`);
    }
  }
  for (const subject of ledger.subjects) {
    const actualAttempts = actualAttemptsBySubject.get(subject.name) ?? new Set<string>();
    for (const coverage of subject.coverage) {
      if (coverage.status === "not_found" && coverage.attempts.length === 0) errors.push(`Subject ${subject.subjectId} ${coverage.dimension} is not_found without a structured recovery attempt.`);
      for (const attempt of coverage.attempts) {
        if (!actualAttempts.has(normalizedResearchText(attempt))) errors.push(`Subject ${subject.subjectId} ${coverage.dimension} cites a recovery attempt that is not present in its prospect, lead, or signal lineage.`);
      }
    }
  }

  return [...new Set(errors)];
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
  if (run.mode === "canonical_repair" && !requiresCanonicalRepairContract(run.agentVersion)) {
    errors.push(`Canonical repair run ${run.runId} requires tnm-research-pipeline/1.8.0 or a compatible newer version.`);
  }
  if (run.mode === "canonical_repair" && requiresCanonicalRepairContract(run.agentVersion)) {
    if (!run.outputs.canonicalRepairSnapshot) {
      errors.push(`Canonical repair run ${run.runId} requires its exact service-role snapshot artifact.`);
    } else if (!/^research\/ingestion\/local\/canonical-repair-snapshots-v1\/[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(run.outputs.canonicalRepairSnapshot)) {
      errors.push(`Canonical repair run ${run.runId} has a snapshot output outside the private canonical-repair snapshot directory.`);
    }
  } else if (run.outputs.canonicalRepairSnapshot) {
    errors.push(`Non-canonical run ${run.runId} cannot declare a canonical-repair snapshot output.`);
  }
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
  if (run.status === "completed" && requiresRecordSpecificResearchContract(run.agentVersion)) {
    if (!run.validation.passed || run.validation.errors.length > 0 || run.errors.length > 0) {
      errors.push(`Run ${run.runId} cannot complete pipeline 1.7 with failed validation or recorded errors.`);
    }
  }
  return errors;
}

export function formatZodIssues(error: z.ZodError) {
  return error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`);
}
