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
const nullableDateTimeSchema = z.string().datetime().nullable();

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

export const typedSourceLeadSchema = z.discriminatedUnion("leadType", [
  organizationLeadSchema,
  demandSignalLeadSchema,
  programLeadSchema,
  relationshipLeadSchema
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

const candidateCommon = {
  candidateId: slugSchema,
  sourceLeadIds: z.array(slugSchema).min(1),
  confidence: confidenceSchema,
  reviewStatus: z.literal("candidate_pending"),
  reviewerRationale: z.string().trim().min(80).max(2000),
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
  relationships: z.array(relationshipSchema).max(50)
}).superRefine((candidate, context) => {
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

export const reviewCandidateSchema = z.union([
  organizationBundleV2Schema,
  demandSignalBundleV1Schema,
  programRelationshipBundleV1Schema
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
});

export const researchRunSchema = z.object({
  schemaVersion: z.literal("research_run_v1"),
  runId: slugSchema,
  agentVersion: z.string().trim().min(1).max(120),
  trigger: z.enum(["manual", "weekly"]),
  mode: z.enum(["bootstrap", "gap_targeted"]),
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
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  limits: z.object({
    totalMinutes: z.number().int().min(1).max(90),
    sourceBookMinutes: z.number().int().min(0).max(30),
    maxQualifiedLeads: z.number().int().min(1).max(25),
    maxCandidates: z.number().int().min(1).max(10)
  }),
  sourceQueries: z.array(z.string().trim().min(3).max(500)).max(200),
  counters: z.object({
    sourcesChecked: z.number().int().min(0),
    leadsQualified: z.number().int().min(0).max(25),
    leadsDeferred: z.number().int().min(0),
    candidatesCreated: z.number().int().min(0).max(10),
    duplicatesBlocked: z.number().int().min(0)
  }),
  validation: z.object({
    passed: z.boolean(),
    errors: z.array(z.string()),
    warnings: z.array(z.string())
  }),
  errors: z.array(z.string()),
  stopReason: z.string().trim().min(3).max(1000).nullable(),
  outputs: z.object({
    sourceLeadBatch: z.string().nullable(),
    candidateBatch: z.string().nullable(),
    reviewPacket: z.string().nullable(),
    stagingExport: z.string().nullable()
  })
});

export type SourceLeadBatchV2 = z.infer<typeof sourceLeadBatchV2Schema>;
export type OrganizationBundleV2 = z.infer<typeof organizationBundleV2Schema>;
export type DemandSignalBundleV1 = z.infer<typeof demandSignalBundleV1Schema>;
export type ResearchCandidateBatchV2 = z.infer<typeof researchCandidateBatchV2Schema>;
export type ResearchRun = z.infer<typeof researchRunSchema>;
export type ReviewCandidate = z.infer<typeof reviewCandidateSchema>;

export function formatZodIssues(error: z.ZodError) {
  return error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`);
}
