import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExecutiveOrganizationDossier } from "@/components/atlas/executive-organization-dossier";
import type { DossierRelatedIntelligence } from "@/lib/atlas/dossier-related";
import type { AtlasCitation, AtlasOrganization } from "@/types/atlas";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Executive dossier local preview",
  robots: { index: false, follow: false }
};

function previewCitation(id: string, fieldName: string, sourceTitle: string, sourceUrl: string): AtlasCitation {
  return {
    id,
    fieldName,
    sourceTitle,
    sourceUrl,
    publisher: "True North Map preview evidence",
    sourceType: "review_fixture",
    excerpt: `Local-only fixture evidence supporting the ${fieldName.replaceAll("_", " ")} presentation contract.`,
    publishedAt: "2026-08-01T00:00:00.000Z"
  };
}

const profileSource = "https://truenorthmap.ca/how-it-works";
const programmeSource = "https://truenorthmap.ca/methodology";
const capabilitySource = "https://truenorthmap.ca/capabilities";
const connectionSource = "https://truenorthmap.ca/missions";
const organizationId = "11111111-1111-4111-8111-111111111111";
const profileCitation = previewCitation("preview-profile", "description", "Executive dossier profile evidence", profileSource);
const activityCitation = previewCitation("preview-activity", "current_activity", "Current-activity evidence", profileSource);
const capabilityCitation = previewCitation("preview-capability", "summary", "Capability evidence", capabilitySource);
const connectionCitation = previewCitation("preview-connection", "alignment_summary", "Connection rationale source", connectionSource);
const programmeCitation = previewCitation("preview-programme", "summary", "Programme evidence", programmeSource);
const participationCitation = previewCitation("preview-participation", "public_summary", "Participation evidence", programmeSource);

const previewOrganization: AtlasOrganization = {
  id: organizationId,
  slug: "northern-vector-systems-preview",
  name: "Northern Vector Systems",
  legalName: "Northern Vector Systems Inc.",
  description: "A Halifax-based maritime sensing integrator that combines distributed sensor inputs, edge processing, and operator software into reviewable decision workflows.",
  websiteUrl: null,
  entityKind: "company",
  categories: ["commercial_company", "defence_supplier", "dual_use", "ocean_technology"],
  sourceConfidence: "high",
  freshnessStatus: "current",
  lastReviewedAt: "2026-08-09T00:00:00.000Z",
  primaryLocation: {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Halifax, Nova Scotia",
    city: "Halifax",
    provinceTerritory: "Nova Scotia",
    countryCode: "CA",
    latitude: 44.6488,
    longitude: -63.5752,
    geographicConfidence: "city_centroid",
    regionSlug: "atlantic-canada"
  },
  locations: [],
  foundedYear: 2021,
  employeeRange: "11–50",
  companyStage: "Growth",
  ownership: "Privately held",
  commercialStatus: "Commercial and programme-based delivery",
  disclosedFinancingSummary: null,
  defencePosture: "The reviewed profile separates source-backed technology facts from defence-relevance assessments.",
  dualUsePosture: "The same integration workflow can support civil maritime monitoring and reviewed defence-adjacent applications.",
  profileData: {},
  editorialProfile: {
    version: "organization_editorial_profile_v1",
    currentActivity: "The organization recently completed a public integration milestone linking a distributed sensing stack with an operator-facing maritime monitoring workflow.",
    currentActivityAsOf: "2026-08-01",
    operatingContext: "Northern Vector Systems is presented as an integration company: it connects sensing, edge processing, and operator workflows rather than implying ownership of every upstream sensor or downstream command system.",
    canadianFootprint: "Public evidence places engineering, integration, testing, and customer support in Halifax; the map remains intentionally approximate at city level.",
    reviewedQuestions: [
      {
        id: "operator-integration-boundary",
        question: "Which operator-controlled interface most often governs deployment readiness?",
        context: "The public integration model spans sensing, data transport, and operator software, so the controlling interface is decision-useful to clarify before a technical introduction.",
        confidence: "moderate"
      },
      {
        id: "programme-transition-gate",
        question: "What evidence would move the current programme work from testing into operational delivery?",
        context: "The reviewed public record supports a testing-stage participation but does not treat programme selection as proof of operational adoption.",
        confidence: "high"
      }
    ]
  },
  logo: null,
  mediaAssets: [],
  capabilities: [
    {
      id: "33333333-3333-4333-8333-333333333333",
      organizationId,
      slug: "distributed-maritime-sensing-preview",
      name: "Distributed maritime sensing integration",
      summary: "Combine multiple maritime sensing inputs, edge processing, and operator software into a reviewable monitoring workflow without collapsing subsystem responsibilities.",
      capabilityType: "Maritime sensing integration software",
      coreFeatures: ["Multi-sensor ingest", "Edge data normalization", "Operator-facing event workflow", "Documented interface boundaries"],
      technologyReadinessLevel: 7,
      maturity: "Demonstrated in a public testing programme",
      commercialAvailability: "Available for scoped integration work",
      defenceApplications: ["Maritime domain awareness", "Distributed coastal monitoring", "Sensor-to-operator workflow integration"],
      novelty: ["Separates sensor, transport, processing, and operator responsibilities in the public architecture"],
      technicalTags: ["sensor fusion", "edge processing", "maritime monitoring"],
      technicalDomains: [{ id: "domain-sensing", slug: "sensing-and-isr", name: "Sensing and ISR", summary: "Public sensing and intelligence technologies." }],
      missionMatches: [{
        id: "44444444-4444-4444-8444-444444444444",
        missionArea: { id: "mission-underwater-isr", slug: "underwater-isr", name: "Underwater ISR", summary: "Reviewed mission area for persistent underwater awareness.", sourceConfidence: "high" },
        alignmentSummary: "The documented integration workflow may help connect distributed maritime sensors to operator review, while the public record does not establish procurement eligibility or mission adoption.",
        matchType: "derived",
        confidence: "moderate",
        citations: [connectionCitation]
      }],
      demandMatches: [{
        id: "55555555-5555-4555-8555-555555555555",
        demandRequirementId: "demand-distributed-sensing",
        demandSlug: "released-distributed-sensing-need-preview",
        demandTitle: "Integrate distributed sensing into a resilient operator picture",
        alignmentSummary: "The source-backed sensor-ingest and operator-workflow premises create a plausible public-source connection to the released need; they do not demonstrate buyer interest.",
        matchType: "public_source_alignment",
        confidence: "moderate",
        citations: [connectionCitation]
      }],
      sourceConfidence: "high",
      lastReviewedAt: "2026-08-09T00:00:00.000Z",
      citations: [capabilityCitation]
    },
    {
      id: "66666666-6666-4666-8666-666666666666",
      organizationId,
      slug: "edge-event-triage-preview",
      name: "Edge event triage",
      summary: "Normalize public sensor inputs near the collection point and route prioritized events into an operator review queue with retained provenance.",
      capabilityType: "Edge data-processing workflow",
      coreFeatures: ["Local normalization", "Priority event routing", "Provenance retention"],
      technologyReadinessLevel: null,
      maturity: "Publicly demonstrated; exact deployment scope not inferred",
      commercialAvailability: null,
      defenceApplications: ["Bandwidth-aware monitoring", "Operator alert triage"],
      novelty: [],
      technicalTags: ["edge computing", "event triage"],
      technicalDomains: [{ id: "domain-data", slug: "mission-software-and-data", name: "Mission Software and Data", summary: "Software and data systems supporting reviewed missions." }],
      missionMatches: [],
      demandMatches: [],
      sourceConfidence: "moderate",
      lastReviewedAt: "2026-08-09T00:00:00.000Z",
      citations: [capabilityCitation]
    }
  ],
  programs: [{
    id: "77777777-7777-4777-8777-777777777777",
    programSlug: "maritime-integration-demonstration-preview",
    programName: "Maritime Integration Demonstration",
    programType: "Public demonstration programme",
    programSummary: "The public programme supports staged testing of Canadian maritime sensing and integration technologies.",
    programOperatorName: "Atlantic Test Operator",
    programUrl: programmeSource,
    participationType: "Selected sensing-integration participant",
    cohortLabel: "2026 demonstration",
    publicSummary: "Northern Vector Systems owns the sensing-to-operator integration workstream; the programme record does not imply that it operates the full demonstration.",
    lifecycleStage: "testing",
    announcedOn: "2026-05-14",
    startedOn: "2026-07-01",
    endedOn: null,
    externalIdentifiers: [{ kind: "project", value: "MIDI-2026-04" }],
    citations: [participationCitation],
    programCitations: [programmeCitation]
  }],
  fundingEvents: [{
    id: "88888888-8888-4888-8888-888888888888",
    eventType: "Public integration grant",
    announcedOn: "2026-05-14",
    amountValue: 750000,
    amountCurrency: "CAD",
    disclosedSummary: "A disclosed public grant supports the integration work; available sources do not establish total financing or company valuation.",
    citations: [programmeCitation]
  }],
  relationships: [{
    id: "99999999-9999-4999-8999-999999999999",
    relationshipType: "programme_operator",
    publicSummary: "Atlantic Test Operator runs the demonstration in which Northern Vector Systems owns a bounded integration workstream.",
    relatedOrganizationId: null,
    relatedOrganizationName: "Atlantic Test Operator",
    relatedOrganization: null,
    citations: [programmeCitation]
  }],
  citations: [profileCitation, activityCitation]
};

const previewRelated: DossierRelatedIntelligence = { briefs: [], signals: [], organizations: [] };

export default function DossierPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <ExecutiveOrganizationDossier
      organization={previewOrganization}
      mapReturnTo="/map?mission=underwater-isr"
      profilePath="/dev/dossier-preview"
      relatedIntelligence={previewRelated}
      trackEngagement={false}
    />
  );
}
