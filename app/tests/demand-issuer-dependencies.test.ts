import { describe, expect, it } from "vitest";
import { findMissingDemandIssuerDependencies } from "@/lib/atlas/demand-issuer-dependencies";
import type { DemandSignalBundleV1 } from "@/lib/research/pipeline-schema";

const candidate = (parentIssuerSlug: string | null): DemandSignalBundleV1 => ({
  schemaVersion: "demand_signal_bundle_v1",
  candidateKind: "demand_signal_bundle",
  candidateId: "candidate-nrc-irap-program",
  sourceLeadIds: ["lead-nrc-irap-program"],
  confidence: "high",
  reviewStatus: "candidate_pending",
  reviewerRationale: "This official Canadian innovation program adds a source-backed public demand signal with a clear industry pathway and durable evidence for review.",
  duplicateCheck: { status: "clear", checkedAt: "2026-07-24T12:00:00.000Z", methods: ["canonical_url"] },
  reviewTier: "green",
  reviewWarnings: [],
  inclusionScore: 92,
  completenessScore: 86,
  sources: [{ id: "source-nrc-irap-program", title: "NRC IRAP", url: "https://nrc.canada.ca/en/support-technology-innovation/industrial-research-assistance-program", publisher: "National Research Council Canada", sourceKind: "government_service_page", summary: "Official program information.", publishedAt: null, accessedAt: "2026-07-24T12:00:00.000Z" }],
  fieldEvidence: [
    { id: "evidence-demand-summary", sourceId: "source-nrc-irap-program", fieldPath: "demandSource.summary", excerpt: "Official program information.", confidence: "high" },
    { id: "evidence-demand-requirement", sourceId: "source-nrc-irap-program", fieldPath: "requirements.innovation-pathway.problemStatement", excerpt: "Official program information.", confidence: "high" }
  ],
  issuers: [{ slug: "nrc-irap", name: "National Research Council Canada Industrial Research Assistance Program", issuerType: "public_program", jurisdiction: "Canada", parentIssuerSlug, role: "issuer" }],
  demandSource: { slug: "nrc-irap-program", title: "NRC IRAP innovation pathway", sourceKind: "funding_program", commitmentLevel: "programmatic", classificationLabel: "Public", summary: "A public innovation program supporting Canadian small and medium-sized businesses as they develop and commercialize technologies.", publishedOn: null },
  requirements: [{ slug: "innovation-pathway", title: "Innovation pathway", problemStatement: "Canadian small and medium-sized businesses need a clearer path to develop, validate, and commercialize technologies with durable public support.", desiredEndState: "Eligible innovators can access coordinated support that helps move credible technologies toward market and operational use.", publicCaveat: "Public-source alignment only. This is not procurement eligibility, endorsement, customer interest, or a classified requirement.", missionAreaSlugs: [], technicalDomainSlugs: [] }]
});

describe("demand issuer publication dependencies", () => {
  it("identifies a missing canonical parent before publication", () => {
    expect(findMissingDemandIssuerDependencies([candidate("national-research-council-canada")], ["government-of-canada"])).toEqual([
      {
        parentIssuerSlug: "national-research-council-canada",
        issuerName: "National Research Council Canada Industrial Research Assistance Program",
        demandSourceTitle: "NRC IRAP innovation pathway"
      }
    ]);
  });

  it("allows a demand candidate when its parent issuer is already canonical", () => {
    expect(findMissingDemandIssuerDependencies([candidate("national-research-council-canada")], ["government-of-canada", "national-research-council-canada"])).toEqual([]);
  });
});
