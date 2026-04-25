import { calculateRankingScore } from "@/lib/scoring";
import type {
  AiRun,
  AuditEvent,
  Capability,
  CapabilityUseCase,
  ChangeRequest,
  Cluster,
  Company,
  Contact,
  Domain,
  EvidenceSnippet,
  FieldCitation,
  Profile,
  Signal,
  Shortlist,
  ShortlistItem,
  Source,
  UseCase,
  UseCaseObservation
} from "@/types/domain";

export const mockProfile: Profile = {
  id: "profile-1",
  email: "analyst@example.com",
  fullName: "Internal Analyst",
  role: "admin"
};

export const domains: Domain[] = [
  {
    id: "domain-1",
    name: "ISR & Sensing",
    slug: "isr-sensing",
    description: "Remote sensing, signal collection, and intelligence-supporting systems."
  },
  {
    id: "domain-2",
    name: "Autonomy & Robotics",
    slug: "autonomy-robotics",
    description: "Autonomous platforms, navigation stacks, and robotic mission systems."
  },
  {
    id: "domain-3",
    name: "Cyber & Data",
    slug: "cyber-data",
    description: "Data fusion, analytics, and mission-support software."
  }
];

export const useCases: UseCase[] = [
  {
    id: "use-case-1",
    slug: "arctic-domain-awareness",
    name: "Arctic Domain Awareness",
    summary:
      "Enable northern watch teams to detect, fuse, and hand off Arctic and northern-approaches threats across sparse infrastructure.",
    active: true,
    domainIds: ["domain-1", "domain-2", "domain-3"],
    priorityTier: "p1",
    useCaseKind: "mission",
    partnerFrames: ["CAF/DND", "NORAD", "NATO"],
    policyAnchors: ["Our North, Strong and Free", "Canada Arctic Foreign Policy", "DND 2026-27 Departmental Plan"],
    operationalOwner: "Arctic and continental defence operators",
    missionContext: "Arctic and northern approaches where sensing, communications, and response windows are constrained.",
    requiredDecision: "Decide which sensing, autonomy, relay, and fusion capabilities should be validated first for persistent northern warning.",
    interoperabilityBoundary: "CAF/DND, NORAD, allied Arctic, and northern community coordination using public-source alignment only.",
    missionOutcome: "Reduce time to detect, understand, and task responses to activity in Arctic and northern approaches.",
    procurementPathway: "Validate through northern testbeds, then assess procurement relevance for Scale-stage systems.",
    realismNote:
      "Public-source priority alignment only; this does not represent classified NORAD or NATO capability target guidance."
  },
  {
    id: "use-case-2",
    slug: "distributed-sensor-networks",
    name: "Distributed Sensor Networks",
    summary:
      "Enable operators to maintain a usable remote operating picture when sensing nodes, relays, and local decision layers are spread across austere sites.",
    active: true,
    domainIds: ["domain-1", "domain-3"],
    priorityTier: "p1",
    useCaseKind: "enabling",
    partnerFrames: ["CAF/DND", "NORAD", "NATO"],
    policyAnchors: ["DND 2026-27 Departmental Plan", "Our North, Strong and Free"],
    operationalOwner: "Joint sensing and network integration teams",
    missionContext: "Sparse domestic, continental, and allied operating areas where fixed infrastructure cannot provide continuous coverage.",
    requiredDecision: "Decide which sensing, relay, and fusion combinations can produce a resilient operating picture.",
    interoperabilityBoundary: "Sensor, relay, and command workflows that must remain interoperable with CAF/DND and allied architectures.",
    missionOutcome: "Improve distributed detection and tasking continuity when remote nodes are degraded or intermittently connected.",
    procurementPathway: "Prioritize integration validation before procurement-facing scaling.",
    realismNote:
      "Treated as an enabling Use Case because it supports multiple mission lanes rather than acting as the final mission effect."
  }
];

export const clusters: Cluster[] = [
  {
    id: "cluster-1",
    name: "Acoustic sensing systems",
    slug: "acoustic-sensing-systems",
    domainId: "domain-1",
    summary: "Passive and active sensing systems for persistent awareness in remote environments."
  },
  {
    id: "cluster-2",
    name: "Distributed sensor networks",
    slug: "distributed-sensor-networks",
    domainId: "domain-3",
    summary: "Connected edge nodes and analytics platforms for distributed operating pictures."
  },
  {
    id: "cluster-3",
    name: "AUV-based platforms",
    slug: "auv-based-platforms",
    domainId: "domain-2",
    summary: "Autonomous underwater and surface platforms for long-endurance operations."
  }
];

export const companies: Company[] = [
  {
    id: "company-1",
    name: "Northshore Dynamics",
    slug: "northshore-dynamics",
    overview: "Builds long-endurance sensing platforms for cold-weather and maritime mission sets.",
    geography: "canada",
    headquarters: "Halifax, Canada",
    marketContext: "Growing defence-adjacent supplier with recent trial activity.",
    websiteUrl: "https://example.com/northshore",
    publicContactEmail: "hello@northshore.example.com",
    publicContactPhone: "+1-555-000-1000",
    lastUpdatedAt: "2026-04-08"
  },
  {
    id: "company-2",
    name: "Polar Mesh",
    slug: "polar-mesh",
    overview: "Provides distributed data fusion infrastructure for remote sensing operations.",
    geography: "nato",
    headquarters: "Reykjavik, Iceland",
    marketContext: "Expanding through NATO-aligned pilot programs.",
    websiteUrl: "https://example.com/polarmesh",
    publicContactEmail: "bd@polarmesh.example.com",
    publicContactPhone: "+354-555-0100",
    lastUpdatedAt: "2026-04-06"
  },
  {
    id: "company-3",
    name: "Aegir Robotics",
    slug: "aegir-robotics",
    overview: "Develops autonomous underwater systems with modular sensing payloads.",
    geography: "global",
    headquarters: "Trondheim, Norway",
    marketContext: "Established ocean robotics firm entering defence-adjacent procurement cycles.",
    websiteUrl: "https://example.com/aegir",
    publicContactEmail: "contact@aegir.example.com",
    publicContactPhone: "+47-555-0200",
    lastUpdatedAt: "2026-04-10"
  }
];

export const contacts: Contact[] = [
  {
    id: "contact-1",
    companyId: "company-1",
    name: "Mira Thompson",
    title: "Director of Strategic Programs",
    email: "mira@northshore.example.com",
    linkedinUrl: null
  },
  {
    id: "contact-2",
    companyId: "company-2",
    name: "Elias Jonsson",
    title: "VP Partnerships",
    email: "elias@polarmesh.example.com",
    linkedinUrl: null
  }
];

export const capabilities: Capability[] = [
  {
    id: "capability-1",
    companyId: "company-1",
    name: "FjordSense Passive Array",
    slug: "fjordsense-passive-array",
    capabilityType: "Sensing System",
    domainId: "domain-1",
    summary: "Cold-weather passive acoustic array designed for persistent maritime listening posts.",
    companyFacingContext: "Pairs with Northshore's mobile relay nodes for regional monitoring.",
    lastUpdatedAt: "2026-04-08"
  },
  {
    id: "capability-2",
    companyId: "company-2",
    name: "Polar Mesh Edge Grid",
    slug: "polar-mesh-edge-grid",
    capabilityType: "Data Platform",
    domainId: "domain-3",
    summary: "Distributed edge data fabric that fuses sensor feeds into a resilient operating picture.",
    companyFacingContext: "Useful when mission owners need low-bandwidth awareness across sparse nodes.",
    lastUpdatedAt: "2026-04-06"
  },
  {
    id: "capability-3",
    companyId: "company-3",
    name: "Aegir Scout AUV",
    slug: "aegir-scout-auv",
    capabilityType: "Robotics Platform",
    domainId: "domain-2",
    summary: "Medium-endurance autonomous underwater platform with modular ISR payload support.",
    companyFacingContext: "Supports trial deployment in austere maritime environments.",
    lastUpdatedAt: "2026-04-10"
  }
];

const baseCapabilityUseCases: CapabilityUseCase[] = [
  {
    id: "cuc-1",
    capabilityId: "capability-1",
    useCaseId: "use-case-1",
    clusterId: "cluster-1",
    pathway: "validate",
    relevanceBand: "high",
    defenceRelevance: "high",
    suggestedActionType: "connect_to_end_user_validation",
    actionNote: "Strong fit for Arctic sensing trials with defence-adjacent operators.",
    whyItMatters:
      "Provides persistent sensing in low-communications environments and has recent validation signals.",
    rankingScore: 0,
    reviewerOverrideDelta: 3,
    evidenceStrength: 5,
    actionabilityScore: 5,
    lastSignalAt: "2026-03-15",
    staleAfterDays: 180
  },
  {
    id: "cuc-2",
    capabilityId: "capability-2",
    useCaseId: "use-case-1",
    clusterId: "cluster-2",
    pathway: "scale",
    relevanceBand: "high",
    defenceRelevance: "medium",
    suggestedActionType: "introduce_to_integrator",
    actionNote: "Could bridge distributed sensing into existing NATO-aligned architectures.",
    whyItMatters:
      "Improves distributed awareness through resilient fusion and aligns with remote operating constraints.",
    rankingScore: 0,
    reviewerOverrideDelta: 0,
    evidenceStrength: 5,
    actionabilityScore: 5,
    lastSignalAt: "2026-02-20",
    staleAfterDays: 180
  },
  {
    id: "cuc-3",
    capabilityId: "capability-3",
    useCaseId: "use-case-1",
    clusterId: "cluster-3",
    pathway: "build",
    relevanceBand: "medium",
    defenceRelevance: "high",
    suggestedActionType: "explore_testbed_inclusion",
    actionNote: "Worth evaluating through a northern operations testbed before deeper engagement.",
    whyItMatters:
      "Expands autonomous coverage options in areas with sparse infrastructure but still needs operational validation.",
    rankingScore: 0,
    reviewerOverrideDelta: -2,
    evidenceStrength: 3,
    actionabilityScore: 5,
    lastSignalAt: "2025-12-11",
    staleAfterDays: 180
  },
  {
    id: "cuc-4",
    capabilityId: "capability-2",
    useCaseId: "use-case-2",
    clusterId: "cluster-2",
    pathway: "scale",
    relevanceBand: "high",
    defenceRelevance: "medium",
    suggestedActionType: "assess_procurement_relevance",
    actionNote: "Ready for evaluation in scaling distributed monitoring programs.",
    whyItMatters:
      "Already demonstrated with networked sensing programs and can support wider procurement-facing pilots.",
    rankingScore: 0,
    reviewerOverrideDelta: 1,
    evidenceStrength: 5,
    actionabilityScore: 5,
    lastSignalAt: "2026-02-20",
    staleAfterDays: 180
  },
  {
    id: "cuc-5",
    capabilityId: "capability-1",
    useCaseId: "use-case-2",
    clusterId: "cluster-1",
    pathway: "validate",
    relevanceBand: "medium",
    defenceRelevance: "medium",
    suggestedActionType: "connect_to_end_user_validation",
    actionNote: "Relevant where fixed-node coverage needs to be tied into a broader relay architecture.",
    whyItMatters:
      "Adds a validated sensing endpoint that can strengthen distributed monitoring coverage when paired with relay and fusion layers.",
    rankingScore: 0,
    reviewerOverrideDelta: 0,
    evidenceStrength: 5,
    actionabilityScore: 5,
    lastSignalAt: "2026-03-15",
    staleAfterDays: 180
  }
];

export const capabilityUseCases = baseCapabilityUseCases.map((record) => {
  const company = companies.find(
    (candidate) =>
      candidate.id === capabilities.find((capability) => capability.id === record.capabilityId)?.companyId
  );

  if (!company) {
    return record;
  }

  return {
    ...record,
    rankingScore: calculateRankingScore({
      relevanceBand: record.relevanceBand,
      pathway: record.pathway,
      defenceRelevance: record.defenceRelevance,
      geography: company.geography,
      lastSignalAt: record.lastSignalAt,
      evidenceStrength: record.evidenceStrength,
      actionabilityScore: record.actionabilityScore,
      reviewerOverrideDelta: record.reviewerOverrideDelta
    })
  };
});

export const signals: Signal[] = [
  {
    id: "signal-1",
    capabilityId: "capability-1",
    signalType: "pilot",
    title: "Cold-weather listening post field trial",
    description: "Completed a six-week validation exercise with a northern maritime partner.",
    observedAt: "2026-03-15"
  },
  {
    id: "signal-2",
    capabilityId: "capability-2",
    signalType: "partnership",
    title: "Integration announcement with relay hardware provider",
    description: "Expanded interoperability across sparse-node sensing programs.",
    observedAt: "2026-02-20"
  },
  {
    id: "signal-3",
    capabilityId: "capability-3",
    signalType: "technical_milestone",
    title: "Announced new modular payload interface",
    description: "Added multi-payload mounting option for trial deployments.",
    observedAt: "2025-12-11"
  }
];

export const sources: Source[] = [
  {
    id: "source-1",
    sourceType: "company_website",
    title: "Northshore field trial update",
    url: "https://example.com/northshore/trial",
    publisher: "Northshore Dynamics",
    publishedAt: "2026-03-15"
  },
  {
    id: "source-2",
    sourceType: "industry_news",
    title: "Polar Mesh expands distributed fusion pilot footprint",
    url: "https://example.com/news/polarmesh",
    publisher: "Maritime Systems News",
    publishedAt: "2026-02-20"
  },
  {
    id: "source-3",
    sourceType: "company_website",
    title: "Aegir announces modular payload milestone",
    url: "https://example.com/aegir/payload",
    publisher: "Aegir Robotics",
    publishedAt: "2025-12-11"
  },
  {
    id: "source-policy-1",
    sourceType: "government_policy",
    title: "Our North, Strong and Free",
    url: "https://www.canada.ca/en/department-national-defence/corporate/reports-publications/north-strong-free-2024.html",
    publisher: "Department of National Defence",
    publishedAt: "2024-05-03"
  },
  {
    id: "source-policy-2",
    sourceType: "departmental_plan",
    title: "2026-27 Departmental Plan",
    url: "https://www.canada.ca/en/department-national-defence/corporate/reports-publications/departmental-plans/departmental-plan-2026-27.html",
    publisher: "Department of National Defence",
    publishedAt: "2026-03-01"
  }
];

export const evidenceSnippets: EvidenceSnippet[] = [
  {
    id: "snippet-1",
    sourceId: "source-1",
    capabilityId: "capability-1",
    excerpt:
      "The pilot demonstrated passive detection performance through six weeks of continuous cold-weather operation."
  },
  {
    id: "snippet-2",
    sourceId: "source-2",
    capabilityId: "capability-2",
    excerpt:
      "The partnership expands data fusion across sparse relay nodes for distributed Arctic and North Atlantic programs."
  },
  {
    id: "snippet-3",
    sourceId: "source-3",
    capabilityId: "capability-3",
    excerpt:
      "The new payload interface lets operators swap ISR packages without redesigning the vehicle core."
  },
  {
    id: "snippet-policy-1",
    sourceId: "source-policy-1",
    capabilityId: null,
    excerpt:
      "Canada's defence policy centers Arctic sovereignty, continental defence, digital modernization, and faster capability delivery."
  },
  {
    id: "snippet-policy-2",
    sourceId: "source-policy-2",
    capabilityId: null,
    excerpt:
      "The departmental plan links NORAD modernization, Arctic surveillance, readiness, exercises, and procurement acceleration to current priorities."
  }
];

export const fieldCitations: FieldCitation[] = [
  {
    id: "citation-1",
    entityType: "capability_use_case",
    entityId: "cuc-1",
    fieldName: "why_it_matters",
    evidenceSnippetId: "snippet-1"
  },
  {
    id: "citation-2",
    entityType: "capability_use_case",
    entityId: "cuc-2",
    fieldName: "why_it_matters",
    evidenceSnippetId: "snippet-2"
  },
  {
    id: "citation-3",
    entityType: "capability_use_case",
    entityId: "cuc-3",
    fieldName: "why_it_matters",
    evidenceSnippetId: "snippet-3"
  },
  {
    id: "citation-4",
    entityType: "capability_use_case",
    entityId: "cuc-4",
    fieldName: "why_it_matters",
    evidenceSnippetId: "snippet-2"
  },
  {
    id: "citation-5",
    entityType: "capability_use_case",
    entityId: "cuc-5",
    fieldName: "why_it_matters",
    evidenceSnippetId: "snippet-1"
  },
  {
    id: "citation-policy-1",
    entityType: "use_case",
    entityId: "use-case-1",
    fieldName: "policy_anchors",
    evidenceSnippetId: "snippet-policy-1"
  },
  {
    id: "citation-policy-2",
    entityType: "use_case",
    entityId: "use-case-2",
    fieldName: "policy_anchors",
    evidenceSnippetId: "snippet-policy-2"
  }
];

export const useCaseObservations: UseCaseObservation[] = [
  {
    id: "observation-1",
    useCaseId: "use-case-1",
    title: "Validated sensing is ahead of autonomous deployment maturity",
    note: "Sensing and fusion capabilities show more near-term engagement readiness than fully autonomous platforms.",
    lastUpdatedAt: "2026-04-12"
  },
  {
    id: "observation-2",
    useCaseId: "use-case-1",
    title: "Canadian players have a signal advantage in Arctic relevance",
    note: "Canada-based capabilities are better positioned for early trial engagement due to geography and operating context.",
    lastUpdatedAt: "2026-04-11"
  },
  {
    id: "observation-3",
    useCaseId: "use-case-2",
    title: "Relay and fusion depth is stronger than sensing endpoint breadth",
    note: "The current dataset shows stronger maturity in relay and data-fusion layers than in the underlying endpoint coverage layer.",
    lastUpdatedAt: "2026-04-13"
  }
];

export const changeRequests: ChangeRequest[] = [
  {
    id: "change-1",
    entityType: "capability_use_case",
    entityId: "cuc-3",
    changedFields: ["pathway", "suggested_action_type"],
    beforeValue: {
      pathway: "build",
      suggested_action_type: "explore_testbed_inclusion"
    },
    afterValue: {
      pathway: "validate",
      suggested_action_type: "connect_to_end_user_validation"
    },
    requesterName: "Jules Martin",
    requesterEmail: "jules@example.com",
    reviewerName: null,
    status: "pending",
    createdAt: "2026-04-18T13:05:00.000Z",
    reviewedAt: null
  }
];

export const auditEvents: AuditEvent[] = [
  {
    id: "audit-1",
    actorName: "System",
    actorEmail: "system@ecosystem-intelligence.local",
    eventType: "seed_import",
    entityType: "dataset",
    entityId: "initial-seed",
    summary: "Initial seeded dataset validated and imported.",
    createdAt: "2026-04-10T10:00:00.000Z"
  },
  {
    id: "audit-2",
    actorName: "Mira Analyst",
    actorEmail: "mira@example.com",
    eventType: "low_impact_edit",
    entityType: "capability",
    entityId: "capability-2",
    summary: "Updated summary wording and supporting citation metadata.",
    createdAt: "2026-04-17T11:45:00.000Z"
  }
];

export const aiRuns: AiRun[] = [
  {
    id: "ai-1",
    entityType: "capability_use_case",
    entityId: "cuc-1",
    status: "completed",
    promptVersion: "v1",
    resultSummary: "Suggested validation-focused why-it-matters narrative grounded in field trial evidence.",
    createdAt: "2026-04-09T14:00:00.000Z"
  },
  {
    id: "ai-2",
    entityType: "capability_use_case",
    entityId: "cuc-4",
    status: "queued",
    promptVersion: "v1",
    resultSummary: null,
    createdAt: "2026-04-18T08:30:00.000Z"
  }
];

export const shortlists: Shortlist[] = [];
export const shortlistItems: ShortlistItem[] = [];
