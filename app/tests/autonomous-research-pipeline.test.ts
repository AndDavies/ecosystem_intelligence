import { describe, expect, it } from "vitest";
import {
  demandSignalBundleV1Schema,
  organizationBundleV2Schema,
  publicDemandCaveat,
  researchCandidateBatchV2Schema,
  researchProspectInventoryV1Schema,
  researchRunCompletionIssues,
  researchRunSchema,
  reviewCandidateIntakeIssues,
  sourceLeadBatchV2Schema
} from "../src/lib/research/pipeline-schema";
import { buildDefaultResearchRunId } from "../src/lib/research/run-id";
import { rankSourceBookRows } from "../src/lib/research/source-ranking";

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
  it("keeps weekly runs idempotent while giving manual and bootstrap runs unique IDs", () => {
    expect(buildDefaultResearchRunId({
      trigger: "weekly",
      bootstrap: false,
      startedAt: "2026-07-20T12:34:56.000Z"
    })).toBe("tnm-weekly-2026-07-20");

    expect(buildDefaultResearchRunId({
      trigger: "manual",
      bootstrap: false,
      startedAt: "2026-07-20T12:34:56.000Z"
    })).toBe("tnm-manual-20260720123456");

    expect(buildDefaultResearchRunId({
      trigger: "manual",
      bootstrap: true,
      startedAt: "2026-07-20T12:34:57.000Z"
    })).toBe("tnm-bootstrap-20260720123457");
  });

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

  it("keeps private candidate-logo provenance inside the organization contract", () => {
    const candidate = organizationCandidate("company");
    Object.assign(candidate, {
      candidateLogo: {
        status: "ready",
        confidence: "high",
        sourcePageUrl: "https://sample.ca",
        sourceAssetUrl: "https://sample.ca/assets/logo.svg",
        selectionMethod: "official-site image discovery",
        sourceChecksum: "a".repeat(64),
        normalizedChecksum: "b".repeat(64),
        packetPath: "research/ingestion/local/candidate-logos/sample/logo.source.json",
        note: "Official mark retained in the private candidate packet."
      }
    });
    const parsed = organizationBundleV2Schema.parse(candidate);
    expect(parsed.candidateLogo?.status).toBe("ready");

    const incomplete = structuredClone(candidate) as typeof candidate & { candidateLogo: Record<string, unknown> };
    delete incomplete.candidateLogo.sourceChecksum;
    expect(organizationBundleV2Schema.safeParse(incomplete).success).toBe(false);
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

  it("allows useful amber candidates with explicit non-blocking reviewer warnings", () => {
    const candidate = organizationCandidate("company");
    Object.assign(candidate, {
      confidence: "needs_review",
      reviewTier: "amber",
      inclusionScore: 78,
      completenessScore: 61,
      reviewWarnings: ["The public legal name and a direct contact email were not found; verify during human review."]
    });
    expect(organizationBundleV2Schema.safeParse(candidate).success).toBe(true);
    expect(candidate.organization.legalName).toBeNull();
    expect(candidate.organization.profileData).not.toHaveProperty("contactEmail");
  });

  it("keeps exact and possible duplicates as hard intake stops", () => {
    const candidate = organizationBundleV2Schema.parse(organizationCandidate("company"));
    candidate.duplicateCheck.status = "exact_duplicate";
    expect(reviewCandidateIntakeIssues(candidate)).toContain("Candidate sample-organization-candidate has unresolved duplicate status 'exact_duplicate'.");
  });

  it("fails an under-target discovery batch unless exhaustion is explicit", () => {
    const run = researchRunSchema.parse({
      schemaVersion: "research_run_v1",
      runId: "sample-discovery-run",
      agentVersion: "tnm-research-pipeline/1.2.0",
      trigger: "manual",
      mode: "discovery_batch",
      scope: { geography: "canada_first", organizationKinds: ["company"], missionAreaSlugs: [], technicalDomainSlugs: [], demandIssuerTypes: [] },
      selectedGap: { coverageView: "supply", dimension: "organization-kind:company", reason: "Canadian company coverage remains below the working saturation target.", score: 900 },
      status: "completed",
      startedAt: timestamp,
      completedAt: timestamp,
      limits: { totalMinutes: 90, sourceBookMinutes: 30, maxQualifiedLeads: 25, maxCandidates: 10, minimumProspects: 40, minimumSourceLanes: 6, minimumCandidates: 8, targetCandidates: 10 },
      sourceQueries: [],
      counters: { sourcesChecked: 20, leadsQualified: 4, leadsDeferred: 0, candidatesCreated: 4, duplicatesBlocked: 0, prospectsDiscovered: 20, uniqueProspects: 20, prospectsQueued: 16, recoveryAttempts: 3, sourceLanesSearched: 3, candidatesGreen: 3, candidatesAmber: 1 },
      validation: { passed: true, errors: [], warnings: [] },
      errors: [],
      stopReason: "The time box ended after the initial source lanes.",
      outputs: { prospectInventory: "research/prospects.json", sourceLeadBatch: "research/leads.json", candidateBatch: "research/candidates.json", reviewPacket: null, stagingExport: null }
    });
    expect(researchRunCompletionIssues(run)).toContain("Discovery batch sample-discovery-run finished below target without underTargetReason and exhaustionEvidence.");
  });

  it("does not impose discovery-batch breadth on a deep dossier", () => {
    const run = researchRunSchema.parse({
      schemaVersion: "research_run_v1",
      runId: "sample-deep-dossier",
      agentVersion: "tnm-research-pipeline/1.2.0",
      trigger: "manual",
      mode: "deep_dossier",
      scope: { geography: "canada_first", organizationKinds: ["company"], missionAreaSlugs: [], technicalDomainSlugs: [], demandIssuerTypes: [] },
      selectedGap: { coverageView: "supply", dimension: "named-organization", reason: "The operator requested a deep evidence dossier for one named organization.", score: 1000 },
      status: "completed",
      startedAt: timestamp,
      completedAt: timestamp,
      limits: { totalMinutes: 90, sourceBookMinutes: 30, maxQualifiedLeads: 5, maxCandidates: 5, minimumProspects: 1, minimumSourceLanes: 3, minimumCandidates: 1, targetCandidates: 1 },
      sourceQueries: [],
      counters: { sourcesChecked: 3, leadsQualified: 1, leadsDeferred: 0, candidatesCreated: 1, duplicatesBlocked: 0, prospectsDiscovered: 1, uniqueProspects: 1, prospectsQueued: 0, recoveryAttempts: 0, sourceLanesSearched: 3, candidatesGreen: 1, candidatesAmber: 0 },
      validation: { passed: true, errors: [], warnings: [] },
      errors: [], stopReason: "Named organization dossier completed.",
      outputs: { prospectInventory: "research/prospects.json", sourceLeadBatch: "research/leads.json", candidateBatch: "research/candidates.json", reviewPacket: null, stagingExport: null }
    });
    expect(researchRunCompletionIssues(run)).toEqual([]);
  });

  it("supports a 50-prospect discovery universe feeding a 10-candidate review batch", () => {
    const lanes = ["official_directory", "government_awards", "government_program", "procurement", "industry_association", "conference_directory"] as const;
    const inventory = researchProspectInventoryV1Schema.parse({
      schemaVersion: "research_prospect_inventory_v1",
      inventoryId: "sample-inventory",
      runId: "sample-run",
      createdAt: timestamp,
      scope: "Enumerate Canadian defence and strategic-technology organizations before evidence qualification.",
      prospects: Array.from({ length: 50 }, (_, index) => ({
        id: `prospect-${index + 1}`,
        name: `Prospect ${index + 1}`,
        proposedEntityType: "organization",
        proposedOrganizationKind: "company",
        canonicalUrl: `https://prospect-${index + 1}.ca`,
        discoverySourceUrl: `https://directory.ca/member-${index + 1}`,
        discoveryLane: lanes[index % lanes.length],
        countryCode: "CA",
        fitSummary: "A Canadian strategic-technology prospect requiring evidence qualification.",
        disposition: index < 10 ? "selected" : "queued",
        rejectionReason: null,
        recoveryAttempts: []
      }))
    });
    const candidates = Array.from({ length: 10 }, (_, index) => {
      const candidate = structuredClone(organizationCandidate("company"));
      candidate.candidateId = `candidate-${index + 1}`;
      candidate.sourceLeadIds = [`lead-${index + 1}`];
      candidate.organization.slug = `organization-${index + 1}`;
      candidate.organization.name = `Organization ${index + 1}`;
      candidate.organization.websiteUrl = `https://organization-${index + 1}.ca`;
      return candidate;
    });
    expect(inventory.prospects).toHaveLength(50);
    expect(candidates).toHaveLength(10);
  });

  it("ranks high-yield Canadian sources ahead of thin generic sources", () => {
    const ranked = rankSourceBookRows([{ name: "Canadian awards", url: "https://canada.ca/awards", status: "active", credibility: "high", geography: "Canada", expected_organization_yield: "high", last_successful_discovery: "2026-07-20", refresh_cadence: "monthly", recursive_follow_up_urls: "https://canada.ca/winners", organization_kinds: "company" }, { name: "Generic directory", url: "https://example.com", status: "active", credibility: "moderate", geography: "global", expected_organization_yield: "unknown", last_successful_discovery: "", refresh_cadence: "", recursive_follow_up_urls: "", organization_kinds: "" }], ["company"]);
    expect(ranked[0].name).toBe("Canadian awards");
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });

  it("requires three distinct evidence-recovery lanes before a plausible lead is deferred", () => {
    const lead = {
      leadType: "organization_lead" as const,
      id: "thin-prospect-lead",
      source: commonCandidate().sources[0],
      discoveryPath: ["https://sample.ca/program"],
      possibleMissionAreaSlugs: [],
      possibleTechnicalDomainSlugs: ["mission-software-and-data"],
      sourceConfidence: "moderate" as const,
      alignmentConfidence: "needs_review" as const,
      evidenceLocator: "Program overview",
      duplicateFingerprint: { canonicalUrl: "https://sample.ca/program", websiteDomain: "sample.ca", stableSlug: "thin-prospect", legalName: null, aliases: [] },
      followUpQuestions: ["Can a third durable source confirm the Canadian operating footprint?"],
      discoveryLane: "official_directory" as const,
      inclusionScore: 72,
      completenessScore: 45,
      reviewWarnings: ["Canadian operations need stronger corroboration."],
      deferralClass: "recovery_exhausted" as const,
      recoveryAttempts: [{ lane: "official_directory" as const, url: "https://sample.ca/program", outcome: "The directory confirmed identity but did not establish the complete operating footprint." }, { lane: "company_newsroom" as const, url: "https://sample.ca/news", outcome: "The newsroom described current activity but did not resolve the Canadian location question." }],
      disposition: "deferred" as const,
      doNotIngestReason: null,
      organizationName: "Thin Prospect",
      proposedKind: "company" as const,
      proposedCategories: ["dual_use" as const],
      websiteUrl: "https://sample.ca",
      aliases: [],
      location: { city: null, provinceTerritory: null, countryCode: "CA" },
      candidateCapabilityName: "Sample capability",
      roleSpecificEvidence: "The durable public source identifies a concrete strategic-technology capability worth further investigation."
    };
    const batch = { schemaVersion: "source_lead_batch_v2" as const, leadBatchId: "thin-prospect-leads", runId: "sample-run", createdAt: timestamp, scope: { description: "A recovery-loop fixture for a plausible Canadian strategic-technology prospect.", targetMissionAreaSlugs: [], targetTechnicalDomainSlugs: ["mission-software-and-data"], targetOrganizationKinds: ["company" as const], targetDemandIssuerTypes: [] }, leads: [lead] };
    expect(sourceLeadBatchV2Schema.safeParse(batch).success).toBe(false);
    (lead.recoveryAttempts as Array<{ lane: "official_directory" | "company_newsroom" | "government_awards"; url: string; outcome: string }>).push({ lane: "government_awards", url: "https://canada.ca/awards", outcome: "The awards directory was searched but did not identify a sufficiently precise Canadian location." });
    expect(sourceLeadBatchV2Schema.safeParse(batch).success).toBe(true);
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
