import { describe, expect, it } from "vitest";
import {
  demandSignalBundleV1Schema,
  organizationBundleV2Schema,
  publicDemandCaveat,
  researchCandidateBatchV2Schema,
  sourceLeadBatchV2Schema
} from "../src/lib/research/pipeline-schema";

const timestamp = "2026-07-18T12:00:00.000Z";

function commonCandidate() {
  return {
    candidateId: "sample-organization-candidate",
    sourceLeadIds: ["sample-organization-lead"],
    confidence: "moderate" as const,
    reviewStatus: "candidate_pending" as const,
    reviewerRationale: "This candidate fills a documented True North Map coverage gap with durable official evidence. Review the proposed classification, mapped fields, and citations before deciding whether it is worthy of inclusion.",
    duplicateCheck: {
      status: "clear" as const,
      checkedAt: timestamp,
      methods: ["canonical_url", "website_domain", "slug", "legal_name", "alias", "fuzzy_name"] as const,
      matches: [],
      note: "No exact or fuzzy identity matches were found in published or pending records."
    },
    sources: [{
      id: "sample-source",
      title: "Sample official organization source",
      url: "https://sample.ca/program",
      publisher: "Sample Organization",
      sourceKind: "official_company_product" as const,
      publishedAt: null,
      accessedAt: timestamp,
      locator: "Program overview",
      summary: "The official page provides a durable source for the organization and its operating model."
    }],
    fieldEvidence: [{
      id: "sample-description-evidence",
      sourceId: "sample-source",
      fieldPath: "organization.description",
      claimClass: "source_backed" as const,
      excerpt: "The official page describes the organization and the service it provides to its ecosystem.",
      confidence: "moderate" as const
    }]
  };
}

function organizationCandidate(kind: "company" | "accelerator" | "incubator" | "investor_funder") {
  return {
    schemaVersion: "organization_bundle_v2" as const,
    candidateKind: "organization_bundle" as const,
    ...commonCandidate(),
    organization: {
      slug: "sample-organization",
      name: "Sample Organization",
      legalName: null,
      aliases: [],
      description: "A Canadian ecosystem organization described through a durable official public source for review.",
      websiteUrl: "https://sample.ca",
      entityKind: kind,
      categories: kind === "company" ? ["commercial_company" as const] : kind === "investor_funder" ? ["venture_capital" as const] : ["dual_use_accelerator" as const],
      primaryLocation: {
        city: "Ottawa",
        provinceTerritory: "Ontario",
        countryCode: "CA",
        latitude: 45.4215,
        longitude: -75.6972,
        geographicConfidence: "city_centroid" as const
      },
      profileData: kind === "investor_funder"
        ? { mandate: "The fund publicly describes a Canadian investment mandate with a focus on technology companies." }
        : {}
    },
    capabilities: kind === "company" ? [{
      slug: "sample-capability",
      name: "Sample capability",
      summary: "The public product page describes a concrete capability with defined features and applications.",
      capabilityType: "software platform",
      features: ["Data integration"],
      applications: ["Operational awareness"],
      technicalTags: ["software"],
      technicalDomainSlugs: ["mission-software-and-data"],
      missionMatches: []
    }] : [],
    programs: ["accelerator", "incubator"].includes(kind) ? [{
      slug: "sample-program",
      name: "Sample Program",
      programType: "cohort program",
      websiteUrl: "https://sample.ca/program",
      summary: "The official program page describes a structured cohort and public participation pathway.",
      cohortLabel: null
    }] : [],
    relationships: kind === "investor_funder" ? [{
      relatedOrganizationName: "Sample Portfolio Company",
      relationshipType: "portfolio_investment",
      publicSummary: "The official portfolio page identifies the company as a publicly disclosed portfolio investment."
    }] : []
  };
}

describe("autonomous ecosystem research schemas", () => {
  it("enforces role-specific organization evidence", () => {
    const accelerator = organizationCandidate("accelerator");
    expect(organizationBundleV2Schema.safeParse(accelerator).success).toBe(true);

    const withoutProgram = structuredClone(accelerator);
    withoutProgram.programs = [];
    expect(organizationBundleV2Schema.safeParse(withoutProgram).success).toBe(false);

    const investor = organizationCandidate("investor_funder");
    expect(organizationBundleV2Schema.safeParse(investor).success).toBe(true);
    investor.relationships = [];
    expect(organizationBundleV2Schema.safeParse(investor).success).toBe(false);
  });

  it("rejects organization candidates that cannot be published to the Canadian map", () => {
    const withoutCoordinates = structuredClone(organizationCandidate("company"));
    const incompleteLocation = withoutCoordinates.organization.primaryLocation as {
      latitude: number | null;
      longitude: number | null;
    };
    incompleteLocation.latitude = null;
    incompleteLocation.longitude = null;
    expect(organizationBundleV2Schema.safeParse(withoutCoordinates).success).toBe(false);

    const outsideCanada = structuredClone(organizationCandidate("company"));
    (outsideCanada.organization.primaryLocation as { countryCode: string }).countryCode = "US";
    expect(organizationBundleV2Schema.safeParse(outsideCanada).success).toBe(false);
  });

  it("keeps candidate batches private and bounded", () => {
    const candidate = organizationCandidate("company");
    candidate.fieldEvidence.push({
      id: "sample-capability-evidence",
      sourceId: "sample-source",
      fieldPath: "capabilities.sample-capability.summary",
      claimClass: "source_backed",
      excerpt: "The product page describes a defined software capability for integrating operational data.",
      confidence: "moderate"
    });
    const result = researchCandidateBatchV2Schema.safeParse({
      schemaVersion: "research_candidate_batch_v2",
      batchId: "sample-batch",
      runId: "sample-run",
      title: "Sample private research candidate batch",
      status: "candidate",
      createdAt: timestamp,
      selectedGap: { coverageView: "supply", dimension: "sample-gap", reason: "A test coverage gap needs a private review candidate.", score: 100 },
      sourceLeadBatchPath: "research/ingestion/source-leads-v2/sample.json",
      guardrailNotes: ["Candidates remain private until an explicit human publication action."],
      candidates: [candidate],
      deferred: []
    });
    expect(result.success).toBe(true);
  });

  it("requires rejected leads to explain why they cannot advance", () => {
    const lead = {
      leadType: "organization_lead" as const,
      id: "sample-organization-lead",
      source: commonCandidate().sources[0],
      discoveryPath: ["https://sample.ca/program"],
      possibleMissionAreaSlugs: [],
      possibleTechnicalDomainSlugs: ["mission-software-and-data"],
      sourceConfidence: "moderate" as const,
      alignmentConfidence: "needs_review" as const,
      evidenceLocator: "Program overview",
      duplicateFingerprint: {
        canonicalUrl: "https://sample.ca/program",
        websiteDomain: "sample.ca",
        stableSlug: "sample-organization",
        legalName: null,
        aliases: []
      },
      followUpQuestions: [],
      disposition: "rejected" as const,
      doNotIngestReason: null as string | null,
      organizationName: "Sample Organization",
      proposedKind: "company" as const,
      proposedCategories: ["commercial_company" as const],
      websiteUrl: "https://sample.ca",
      aliases: [],
      location: { city: "Ottawa", provinceTerritory: "Ontario", countryCode: "CA" },
      candidateCapabilityName: "Sample capability",
      roleSpecificEvidence: "The page describes a concrete capability but this fixture intentionally rejects the lead."
    };
    const batch = {
      schemaVersion: "source_lead_batch_v2" as const,
      leadBatchId: "sample-leads",
      runId: "sample-run",
      createdAt: timestamp,
      scope: {
        description: "A sample source-lead batch used to validate the rejection explanation gate.",
        targetMissionAreaSlugs: [],
        targetTechnicalDomainSlugs: ["mission-software-and-data"],
        targetOrganizationKinds: ["company"],
        targetDemandIssuerTypes: []
      },
      leads: [lead]
    };
    expect(sourceLeadBatchV2Schema.safeParse(batch).success).toBe(false);
    lead.doNotIngestReason = "The source does not provide enough durable detail for a review-ready record.";
    expect(sourceLeadBatchV2Schema.safeParse(batch).success).toBe(true);
  });

  it("keeps public demand separate and requires the public-alignment caveat", () => {
    const common = commonCandidate();
    const demandCandidate = {
      schemaVersion: "demand_signal_bundle_v1" as const,
      candidateKind: "demand_signal_bundle" as const,
      ...common,
      candidateId: "sample-demand-candidate",
      sourceLeadIds: ["sample-demand-lead"],
      fieldEvidence: [{
        ...common.fieldEvidence[0],
        id: "sample-demand-evidence",
        fieldPath: "demandSource.summary",
        excerpt: "The official source states a public operational problem and the outcome sought by the issuing authority."
      }, {
        ...common.fieldEvidence[0],
        id: "sample-requirement-evidence",
        fieldPath: "requirements.sample-public-requirement.problemStatement",
        excerpt: "The official problem statement describes a concrete public need for resilient information exchange in remote operations."
      }],
      issuers: [{
        slug: "royal-canadian-navy",
        name: "Royal Canadian Navy",
        issuerType: "military_service" as const,
        jurisdiction: "Canada",
        parentIssuerSlug: "canadian-armed-forces",
        role: "issuer" as const
      }],
      demandSource: {
        slug: "sample-public-demand-source",
        title: "Sample public operational demand source",
        sourceKind: "official_problem_statement" as const,
        commitmentLevel: "directional" as const,
        classificationLabel: "PUBLIC",
        summary: "An official public source describing an operational problem and a desired outcome without creating procurement eligibility.",
        publishedOn: "2026-07-18"
      },
      requirements: [{
        slug: "sample-public-requirement",
        title: "Resilient information exchange in remote operations",
        problemStatement: "Remote operations require dependable information exchange even when communications infrastructure is degraded or intermittent.",
        desiredEndState: "Operators can maintain timely and trustworthy information flow across remote teams and systems despite degraded connectivity.",
        publicCaveat: publicDemandCaveat,
        missionAreaSlugs: ["edge-data-processing"],
        technicalDomainSlugs: ["mission-software-and-data"]
      }]
    };

    expect(demandSignalBundleV1Schema.safeParse(demandCandidate).success).toBe(true);
    demandCandidate.requirements[0].publicCaveat = "This weaker caveat should not pass the deterministic public-demand boundary." as typeof publicDemandCaveat;
    expect(demandSignalBundleV1Schema.safeParse(demandCandidate).success).toBe(false);
  });
});
