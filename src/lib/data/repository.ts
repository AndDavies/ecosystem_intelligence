import "server-only";

import {
  auditEvents,
  aiRuns as mockAiRuns,
  capabilities as mockCapabilities,
  capabilityUseCases as mockCapabilityUseCases,
  changeRequests as mockChangeRequests,
  clusters as mockClusters,
  companies as mockCompanies,
  contacts as mockContacts,
  domains as mockDomains,
  evidenceSnippets as mockEvidenceSnippets,
  fieldCitations as mockFieldCitations,
  signals as mockSignals,
  sources as mockSources,
  useCaseObservations as mockUseCaseObservations,
  useCases as mockUseCases
} from "@/lib/mock-data";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
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
  Source,
  UseCase,
  UseCaseObservation
} from "@/types/domain";
import type {
  CapabilityProfileView,
  CitationView,
  CompanyProfileView,
  DatasetState,
  ReviewQueueItemView,
  ReviewQueueView,
  UseCaseView
} from "@/types/view-models";
import { formatFieldLabel, formatValueForDisplay } from "@/lib/utils";
import { isAiGeneratedRequest, resolveAiRunForRequest } from "@/lib/review/provenance";

function getMockDataset(): DatasetState {
  return {
    auditEvents,
    aiRuns: mockAiRuns,
    domains: mockDomains,
    useCases: mockUseCases,
    clusters: mockClusters,
    companies: mockCompanies,
    contacts: mockContacts,
    capabilities: mockCapabilities,
    capabilityUseCases: mockCapabilityUseCases,
    signals: mockSignals,
    sources: mockSources,
    evidenceSnippets: mockEvidenceSnippets,
    fieldCitations: mockFieldCitations,
    useCaseObservations: mockUseCaseObservations,
    changeRequests: mockChangeRequests
  };
}

async function getSupabaseDataset(): Promise<DatasetState> {
  const supabase = await createClient();

  const [
    auditLog,
    aiRuns,
    domains,
    useCases,
    clusters,
    companies,
    contacts,
    capabilities,
    capabilityUseCases,
    signals,
    sources,
    evidenceSnippets,
    fieldCitations,
    useCaseObservations,
    changeRequests
  ] = await Promise.all([
    supabase.from("audit_log").select("*").order("created_at", { ascending: false }),
    supabase.from("ai_runs").select("*").order("created_at", { ascending: false }),
    supabase.from("domains").select("*"),
    supabase.from("use_cases").select("*"),
    supabase.from("clusters").select("*"),
    supabase.from("companies").select("*"),
    supabase.from("contacts").select("*"),
    supabase.from("capabilities").select("*"),
    supabase.from("capability_use_cases").select("*"),
    supabase.from("signals").select("*"),
    supabase.from("sources").select("*"),
    supabase.from("evidence_snippets").select("*"),
    supabase.from("field_citations").select("*"),
    supabase.from("use_case_observations").select("*"),
    supabase.from("change_requests").select("*")
  ]);

  return {
    auditEvents: (auditLog.data ?? []).map(normalizeAuditEvent),
    aiRuns: (aiRuns.data ?? []).map(normalizeAiRun),
    domains: (domains.data ?? []).map(normalizeDomain),
    useCases: (useCases.data ?? []).map(normalizeUseCase),
    clusters: (clusters.data ?? []).map(normalizeCluster),
    companies: (companies.data ?? []).map(normalizeCompany),
    contacts: (contacts.data ?? []).map(normalizeContact),
    capabilities: (capabilities.data ?? []).map(normalizeCapability),
    capabilityUseCases: (capabilityUseCases.data ?? []).map(normalizeCapabilityUseCase),
    signals: (signals.data ?? []).map(normalizeSignal),
    sources: (sources.data ?? []).map(normalizeSource),
    evidenceSnippets: (evidenceSnippets.data ?? []).map(normalizeEvidenceSnippet),
    fieldCitations: (fieldCitations.data ?? []).map(normalizeFieldCitation),
    useCaseObservations: (useCaseObservations.data ?? []).map(normalizeUseCaseObservation),
    changeRequests: (changeRequests.data ?? []).map(normalizeChangeRequest)
  };
}

function normalizeDomain(row: Record<string, unknown>): Domain {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: row.description ? String(row.description) : null
  };
}

function normalizeUseCase(row: Record<string, unknown>): UseCase {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    summary: String(row.summary),
    active: Boolean(row.active),
    domainIds: Array.isArray(row.domain_ids) ? row.domain_ids.map(String) : []
  };
}

function normalizeCluster(row: Record<string, unknown>): Cluster {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    domainId: String(row.domain_id),
    summary: String(row.summary)
  };
}

function normalizeCompany(row: Record<string, unknown>): Company {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    overview: String(row.overview),
    geography: String(row.geography) as Company["geography"],
    headquarters: String(row.headquarters),
    marketContext: row.market_context ? String(row.market_context) : null,
    websiteUrl: row.website_url ? String(row.website_url) : null,
    publicContactEmail: row.public_contact_email ? String(row.public_contact_email) : null,
    publicContactPhone: row.public_contact_phone ? String(row.public_contact_phone) : null,
    lastUpdatedAt: String(row.last_updated_at)
  };
}

function normalizeContact(row: Record<string, unknown>): Contact {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    name: String(row.name),
    title: String(row.title),
    email: row.email ? String(row.email) : null,
    linkedinUrl: row.linkedin_url ? String(row.linkedin_url) : null
  };
}

function normalizeCapability(row: Record<string, unknown>): Capability {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    name: String(row.name),
    slug: String(row.slug),
    capabilityType: String(row.capability_type),
    domainId: String(row.domain_id),
    summary: String(row.summary),
    companyFacingContext: row.company_facing_context ? String(row.company_facing_context) : null,
    lastUpdatedAt: String(row.last_updated_at)
  };
}

function normalizeCapabilityUseCase(row: Record<string, unknown>): CapabilityUseCase {
  return {
    id: String(row.id),
    capabilityId: String(row.capability_id),
    useCaseId: String(row.use_case_id),
    clusterId: String(row.cluster_id),
    pathway: String(row.pathway) as CapabilityUseCase["pathway"],
    relevanceBand: String(row.relevance_band) as CapabilityUseCase["relevanceBand"],
    defenceRelevance: String(row.defence_relevance) as CapabilityUseCase["defenceRelevance"],
    suggestedActionType: String(row.suggested_action_type) as CapabilityUseCase["suggestedActionType"],
    actionNote: row.action_note ? String(row.action_note) : null,
    whyItMatters: String(row.why_it_matters),
    rankingScore: Number(row.ranking_score ?? 0),
    reviewerOverrideDelta: Number(row.reviewer_override_delta ?? 0),
    evidenceStrength: Number(row.evidence_strength ?? 1) as CapabilityUseCase["evidenceStrength"],
    actionabilityScore: Number(row.actionability_score ?? 0) as CapabilityUseCase["actionabilityScore"],
    lastSignalAt: row.last_signal_at ? String(row.last_signal_at) : null,
    staleAfterDays: Number(row.stale_after_days ?? 180)
  };
}

function normalizeSignal(row: Record<string, unknown>): Signal {
  return {
    id: String(row.id),
    capabilityId: String(row.capability_id),
    signalType: String(row.signal_type) as Signal["signalType"],
    title: String(row.title),
    description: String(row.description),
    observedAt: String(row.observed_at)
  };
}

function normalizeSource(row: Record<string, unknown>): Source {
  return {
    id: String(row.id),
    sourceType: String(row.source_type),
    title: String(row.title),
    url: String(row.url),
    publisher: String(row.publisher),
    publishedAt: row.published_at ? String(row.published_at) : null
  };
}

function normalizeEvidenceSnippet(row: Record<string, unknown>): EvidenceSnippet {
  return {
    id: String(row.id),
    sourceId: String(row.source_id),
    capabilityId: row.capability_id ? String(row.capability_id) : null,
    excerpt: String(row.excerpt)
  };
}

function normalizeFieldCitation(row: Record<string, unknown>): FieldCitation {
  return {
    id: String(row.id),
    entityType: String(row.entity_type) as FieldCitation["entityType"],
    entityId: String(row.entity_id),
    fieldName: String(row.field_name),
    evidenceSnippetId: String(row.evidence_snippet_id)
  };
}

function normalizeUseCaseObservation(row: Record<string, unknown>): UseCaseObservation {
  return {
    id: String(row.id),
    useCaseId: String(row.use_case_id),
    title: String(row.title),
    note: String(row.note),
    lastUpdatedAt: String(row.last_updated_at)
  };
}

function normalizeChangeRequest(row: Record<string, unknown>): ChangeRequest {
  return {
    id: String(row.id),
    entityType: String(row.entity_type),
    entityId: String(row.entity_id),
    changedFields: Array.isArray(row.changed_fields) ? row.changed_fields.map(String) : [],
    beforeValue:
      row.before_value && typeof row.before_value === "object"
        ? (row.before_value as Record<string, unknown>)
        : {},
    afterValue:
      row.after_value && typeof row.after_value === "object"
        ? (row.after_value as Record<string, unknown>)
        : {},
    requesterName: String(row.requester_name),
    requesterEmail: String(row.requester_email),
    reviewerName: row.reviewer_name ? String(row.reviewer_name) : null,
    status: String(row.status) as ChangeRequest["status"],
    createdAt: String(row.created_at),
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null
  };
}

function normalizeAuditEvent(row: Record<string, unknown>): AuditEvent {
  return {
    id: String(row.id),
    actorName: row.actor_name ? String(row.actor_name) : "Unknown actor",
    actorEmail: String(row.actor_email),
    eventType: String(row.event_type),
    entityType: String(row.entity_type),
    entityId: String(row.entity_id),
    summary: String(row.summary),
    createdAt: String(row.created_at)
  };
}

function normalizeAiRun(row: Record<string, unknown>): AiRun {
  return {
    id: String(row.id),
    entityType: String(row.entity_type),
    entityId: String(row.entity_id),
    status: String(row.status) as AiRun["status"],
    promptVersion: String(row.prompt_version),
    resultSummary: row.result_summary ? String(row.result_summary) : null,
    createdAt: String(row.created_at)
  };
}

export async function getDataset() {
  if (!hasSupabaseEnv()) {
    return getMockDataset();
  }

  return getSupabaseDataset();
}

function buildCitationMap(state: DatasetState) {
  const evidenceById = new Map(state.evidenceSnippets.map((item) => [item.id, item]));
  const sourceById = new Map(state.sources.map((item) => [item.id, item]));

  return (entityType: string, entityId: string) => {
    return state.fieldCitations
      .filter((citation) => citation.entityType === entityType && citation.entityId === entityId)
      .map((citation): CitationView | null => {
        const snippet = evidenceById.get(citation.evidenceSnippetId);
        const source = snippet ? sourceById.get(snippet.sourceId) : null;

        if (!snippet || !source) {
          return null;
        }

        return {
          fieldName: citation.fieldName,
          sourceTitle: source.title,
          sourceUrl: source.url,
          publisher: source.publisher,
          publishedAt: source.publishedAt,
          excerpt: snippet.excerpt
        };
      })
      .filter((value): value is CitationView => Boolean(value));
  };
}

export async function getHomeData() {
  const state = await getDataset();
  const pendingReviews = buildReviewQueueItems(state).filter((item) => item.status === "pending");

  const topUseCases = state.useCases
    .filter((item) => item.active)
    .map((useCase) => {
      const targetCount = state.capabilityUseCases.filter((item) => item.useCaseId === useCase.id).length;
      return {
        ...useCase,
        targetCount
      };
    });

  const recentUpdates = state.auditEvents.slice(0, 5);
  const queuedAiRuns = state.aiRuns.filter((item) => item.status === "queued" || item.status === "running");

  return {
    useCases: topUseCases,
    pendingReviews,
    recentUpdates,
    queuedAiRuns
  };
}

export async function getUseCasesIndex() {
  const state = await getDataset();

  return state.useCases
    .filter((item) => item.active)
    .map((useCase) => {
      const capabilityCount = state.capabilityUseCases.filter((mapping) => mapping.useCaseId === useCase.id).length;
      const domains = state.domains.filter((domain) => useCase.domainIds.includes(domain.id));
      return {
        ...useCase,
        capabilityCount,
        domains
      };
    });
}

export async function getUseCaseBySlug(slug: string): Promise<UseCaseView | null> {
  const state = await getDataset();
  const useCase = state.useCases.find((item) => item.slug === slug);

  if (!useCase) {
    return null;
  }

  const citationLookup = buildCitationMap(state);
  const domains = state.domains.filter((domain) => useCase.domainIds.includes(domain.id));
  const mappings = state.capabilityUseCases
    .filter((item) => item.useCaseId === useCase.id)
    .sort((left, right) => right.rankingScore - left.rankingScore);

  const allCapabilities = mappings.map((mapping) => {
    const capability = state.capabilities.find((item) => item.id === mapping.capabilityId);
    const company = capability
      ? state.companies.find((item) => item.id === capability.companyId)
      : undefined;
    const domain = capability ? state.domains.find((item) => item.id === capability.domainId) : undefined;
    const cluster = state.clusters.find((item) => item.id === mapping.clusterId);
    const signals = state.signals.filter((item) => item.capabilityId === mapping.capabilityId);

    if (!capability || !company || !domain || !cluster) {
      return null;
    }

    return {
      capability,
      company,
      domain,
      mapping,
      cluster,
      signals,
      citations: citationLookup("capability_use_case", mapping.id)
    };
  });

  const compactCapabilities = allCapabilities.filter((value): value is NonNullable<typeof value> => Boolean(value));
  const clusterViews = state.clusters
    .map((cluster) => {
      const members = compactCapabilities.filter((item) => item.cluster.id === cluster.id);

      if (!members.length) {
        return null;
      }

      return {
        cluster,
        count: members.length,
        topCapability: members[0] ?? null
      };
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value));

  const maturityDistribution = ["build", "validate", "scale"].map((pathway) => ({
    pathway: pathway as "build" | "validate" | "scale",
    count: mappings.filter((item) => item.pathway === pathway).length
  }));

  return {
    useCase,
    domains,
    observations: state.useCaseObservations.filter((item) => item.useCaseId === useCase.id),
    topTargets: compactCapabilities.slice(0, 10),
    allCapabilities: compactCapabilities,
    clusters: clusterViews,
    maturityDistribution
  };
}

export async function getCapabilityById(id: string): Promise<CapabilityProfileView | null> {
  const state = await getDataset();
  const capability = state.capabilities.find((item) => item.id === id);

  if (!capability) {
    return null;
  }

  const company = state.companies.find((item) => item.id === capability.companyId);

  if (!company) {
    return null;
  }

  const citationLookup = buildCitationMap(state);
  const signals = state.signals
    .filter((item) => item.capabilityId === capability.id)
    .sort((left, right) => new Date(right.observedAt).getTime() - new Date(left.observedAt).getTime());

  return {
    capability,
    company,
    mappings: state.capabilityUseCases
      .filter((item) => item.capabilityId === capability.id)
      .map((mapping) => {
        const useCase = state.useCases.find((item) => item.id === mapping.useCaseId);
        const cluster = state.clusters.find((item) => item.id === mapping.clusterId);

        if (!useCase || !cluster) {
          return null;
        }

        return {
          ...mapping,
          useCase,
          cluster,
          citations: citationLookup("capability_use_case", mapping.id)
        };
      })
      .filter((value): value is NonNullable<typeof value> => Boolean(value))
      .sort((left, right) => right.rankingScore - left.rankingScore),
    signals,
    citations: citationLookup("capability", capability.id),
    companyCitations: citationLookup("company", company.id),
    latestSignal: signals[0] ?? null,
    contacts: state.contacts.filter((item) => item.companyId === company.id)
  };
}

export async function getCompanyById(id: string): Promise<CompanyProfileView | null> {
  const state = await getDataset();
  const company = state.companies.find((item) => item.id === id);

  if (!company) {
    return null;
  }

  const citationLookup = buildCitationMap(state);
  const companyCapabilities = state.capabilities
    .filter((item) => item.companyId === company.id)
    .map((capability) => {
      const mappings = state.capabilityUseCases
        .filter((item) => item.capabilityId === capability.id)
        .map((mapping) => {
          const useCase = state.useCases.find((item) => item.id === mapping.useCaseId);
          const cluster = state.clusters.find((item) => item.id === mapping.clusterId);

          if (!useCase || !cluster) {
            return null;
          }

          return {
            ...mapping,
            useCase,
            cluster,
            citations: citationLookup("capability_use_case", mapping.id)
          };
        })
        .filter((value): value is NonNullable<typeof value> => Boolean(value))
        .sort((left, right) => right.rankingScore - left.rankingScore);

      const signals = state.signals
        .filter((item) => item.capabilityId === capability.id)
        .sort((left, right) => new Date(right.observedAt).getTime() - new Date(left.observedAt).getTime());

      return {
        capability,
        mappings,
        signals,
        citations: citationLookup("capability", capability.id),
        latestSignal: signals[0] ?? null
      };
    })
    .sort((left, right) => {
      const leftScore = left.mappings[0]?.rankingScore ?? 0;
      const rightScore = right.mappings[0]?.rankingScore ?? 0;
      return rightScore - leftScore;
    });

  const companySignals = companyCapabilities
    .flatMap((item) => item.signals)
    .sort((left, right) => new Date(right.observedAt).getTime() - new Date(left.observedAt).getTime());

  return {
    company,
    capabilities: companyCapabilities,
    contacts: state.contacts.filter((item) => item.companyId === company.id),
    citations: citationLookup("company", company.id),
    signals: companySignals
  };
}

export async function searchRecords(query: string) {
  const state = await getDataset();
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return {
      useCases: [],
      capabilities: [],
      companies: []
    };
  }

  const includesQuery = (value: string) => value.toLowerCase().includes(normalized);

  return {
    useCases: state.useCases.filter((item) => includesQuery(item.name) || includesQuery(item.summary)),
    capabilities: state.capabilities.filter(
      (item) => includesQuery(item.name) || includesQuery(item.summary)
    ),
    companies: state.companies.filter(
      (item) => includesQuery(item.name) || includesQuery(item.overview)
    )
  };
}

export async function getReviewQueue(): Promise<ReviewQueueView> {
  const state = await getDataset();
  return {
    pending: buildReviewQueueItems(state).filter((item) => item.status === "pending")
  };
}

function buildReviewQueueItems(state: DatasetState): ReviewQueueItemView[] {
  const companiesById = new Map(state.companies.map((item) => [item.id, item]));
  const capabilitiesById = new Map(state.capabilities.map((item) => [item.id, item]));
  const useCasesById = new Map(state.useCases.map((item) => [item.id, item]));
  const clustersById = new Map(state.clusters.map((item) => [item.id, item]));
  const citationLookup = buildCitationMap(state);

  return state.changeRequests
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .map((request) => {
      let entityLabel = request.entityId;
      let entityHref: string | null = null;
      let entityContext: string | null = null;
      let relatedMapping: CapabilityUseCase | undefined;
      let supportingCitations: CitationView[] = [];

      if (request.entityType === "capability") {
        const capability = capabilitiesById.get(request.entityId);
        const company = capability ? companiesById.get(capability.companyId) : null;
        entityLabel = capability?.name ?? entityLabel;
        entityHref = capability ? `/capabilities/${capability.id}` : null;
        entityContext = company ? company.name : null;
        supportingCitations = citationLookup("capability", request.entityId).slice(0, 3);
      }

      if (request.entityType === "company") {
        const company = companiesById.get(request.entityId);
        entityLabel = company?.name ?? entityLabel;
        entityHref = company ? `/companies/${company.id}` : null;
        entityContext = company?.headquarters ?? null;
        supportingCitations = citationLookup("company", request.entityId).slice(0, 3);
      }

      if (request.entityType === "capability_use_case") {
        const mapping = state.capabilityUseCases.find((item) => item.id === request.entityId);
        relatedMapping = mapping;
        const capability = mapping ? capabilitiesById.get(mapping.capabilityId) : null;
        const useCase = mapping ? useCasesById.get(mapping.useCaseId) : null;
        const cluster = mapping ? clustersById.get(mapping.clusterId) : null;
        const company = capability ? companiesById.get(capability.companyId) : null;
        entityLabel = capability && useCase ? `${capability.name} → ${useCase.name}` : entityLabel;
        entityHref = capability ? `/capabilities/${capability.id}` : null;
        entityContext = [company?.name, cluster?.name].filter(Boolean).join(" · ") || null;
        supportingCitations = dedupeCitations([
          ...citationLookup("capability_use_case", request.entityId),
          ...(capability ? citationLookup("capability", capability.id) : [])
        ]).slice(0, 4);
      }

      if (request.entityType === "use_case") {
        const useCase = useCasesById.get(request.entityId);
        entityLabel = useCase?.name ?? entityLabel;
        entityHref = useCase ? `/use-cases/${useCase.slug}` : null;
      }

      const changeFields = request.changedFields.length
        ? request.changedFields
        : Array.from(new Set([...Object.keys(request.beforeValue), ...Object.keys(request.afterValue)]));

      const originType = isAiGeneratedRequest(request) ? "ai" : "human";
      const aiRun = originType === "ai"
        ? resolveAiRunForRequest({
            request,
            aiRuns: state.aiRuns,
            mapping: relatedMapping
          })
        : null;
      const aiSourceLabel =
        request.entityType === "capability_use_case" && relatedMapping
          ? useCasesById.get(relatedMapping.useCaseId)?.name ?? entityLabel
          : entityLabel;

      return {
        ...request,
        entityLabel,
        entityHref,
        entityContext,
        isRefreshRequest: changeFields.includes("refresh_requested"),
        originType,
        originLabel: originType === "ai" ? "AI suggestion" : "Human edit",
        originSummary:
          originType === "ai"
            ? aiRun
              ? `Derived by the enrichment worker from the ${aiSourceLabel} run and routed into review before any live update.`
              : "Derived by the enrichment worker and routed into review before any live update."
            : `Submitted by ${request.requesterName} and routed into review before publication.`,
        aiRunContext: aiRun
          ? {
              createdAt: aiRun.createdAt,
              promptVersion: aiRun.promptVersion,
              status: aiRun.status,
              resultSummary: aiRun.resultSummary,
              sourceLabel: aiSourceLabel
            }
          : null,
        supportingCitations,
        changedFieldDetails: changeFields.map((fieldName) => ({
          fieldName,
          label: formatFieldLabel(fieldName),
          beforeValue:
            fieldName === "refresh_requested"
              ? "Not requested"
              : formatValueForDisplay(request.beforeValue[fieldName]),
          afterValue:
            fieldName === "refresh_requested"
              ? "Requested"
              : formatValueForDisplay(request.afterValue[fieldName])
        }))
      };
    });
}

export async function getRecentAuditEvents(): Promise<AuditEvent[]> {
  const state = await getDataset();
  return state.auditEvents.slice(0, 8);
}

export async function getAdminTaxonomy() {
  const state = await getDataset();
  return {
    domains: state.domains,
    useCases: state.useCases,
    clusters: state.clusters
  };
}

export async function getAdminEnrichmentState() {
  const state = await getDataset();
  const pendingRefreshes = buildReviewQueueItems(state).filter((item) => item.isRefreshRequest && item.status === "pending");
  const pendingAiSuggestions = buildReviewQueueItems(state).filter(
    (item) => item.originType === "ai" && item.status === "pending"
  );

  return {
    useCases: state.useCases.filter((item) => item.active),
    pendingRefreshes,
    pendingAiSuggestions,
    queuedRuns: state.aiRuns
  };
}

export async function getSessionProfileSummary(): Promise<Profile | null> {
  const { getCurrentProfile } = await import("@/lib/auth");
  return getCurrentProfile();
}

function dedupeCitations(citations: CitationView[]) {
  const seen = new Set<string>();

  return citations.filter((citation) => {
    const key = [
      citation.fieldName,
      citation.sourceTitle,
      citation.sourceUrl,
      citation.excerpt
    ].join("::");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
