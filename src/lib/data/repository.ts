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
  CompanyIndexCardView,
  CompanyProfileView,
  DatasetState,
  DomainCardView,
  DomainDetailView,
  SearchResultsView,
  ReviewQueueItemView,
  ReviewQueueView,
  UseCaseBrowseCardView,
  UseCaseView
} from "@/types/view-models";
import { formatFieldLabel, formatValueForDisplay } from "@/lib/utils";
import { isAiGeneratedRequest, resolveAiRunForRequest } from "@/lib/review/provenance";
import { getFreshnessState, summarizeFreshness } from "@/lib/freshness";
import { mergeUniqueById, rankSearchResults } from "@/lib/search";

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

type UseCaseSearchRow = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  domain_ids?: string[];
  domainIds?: string[];
  domainNames?: string[];
};

type CapabilitySearchRow = {
  id: string;
  name: string;
  summary: string;
  domain_id?: string;
  domainId?: string;
  domainName?: string | null;
  company_id?: string;
  companyId?: string;
  companyName?: string | null;
};

type DomainSearchRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  useCaseCount?: number;
  companyCount?: number;
};

type CompanySearchRow = {
  id: string;
  name: string;
  overview: string;
  headquarters: string;
  domainNames?: string[];
  useCaseCount?: number;
};

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

function uniqueById<T extends { id: string }>(items: Array<T | null | undefined>) {
  const seen = new Map<string, T>();

  items.forEach((item) => {
    if (item && !seen.has(item.id)) {
      seen.set(item.id, item);
    }
  });

  return Array.from(seen.values());
}

function sortByDateDesc(values: Array<string | null | undefined>) {
  return values
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime());
}

function getSortedMappingsForCapability(state: DatasetState, capabilityId: string) {
  return state.capabilityUseCases
    .filter((item) => item.capabilityId === capabilityId)
    .sort((left, right) => right.rankingScore - left.rankingScore);
}

function getSortedSignalsForCapability(state: DatasetState, capabilityId: string) {
  return state.signals
    .filter((item) => item.capabilityId === capabilityId)
    .sort((left, right) => new Date(right.observedAt).getTime() - new Date(left.observedAt).getTime());
}

function getCapabilityFreshnessInput(state: DatasetState, capability: Capability) {
  const mappings = getSortedMappingsForCapability(state, capability.id);
  const signals = getSortedSignalsForCapability(state, capability.id);
  const lastSignalAt =
    sortByDateDesc([
      signals[0]?.observedAt ?? null,
      ...mappings.map((mapping) => mapping.lastSignalAt)
    ])[0] ?? null;

  return {
    lastUpdatedAt: capability.lastUpdatedAt,
    lastSignalAt,
    staleAfterDays: mappings[0]?.staleAfterDays ?? 180
  };
}

function getTopUseCasesForMappings(state: DatasetState, mappings: CapabilityUseCase[]) {
  const bestScoreByUseCase = new Map<string, number>();

  mappings.forEach((mapping) => {
    const current = bestScoreByUseCase.get(mapping.useCaseId) ?? Number.NEGATIVE_INFINITY;
    if (mapping.rankingScore > current) {
      bestScoreByUseCase.set(mapping.useCaseId, mapping.rankingScore);
    }
  });

  return uniqueById(
    mappings.map((mapping) => state.useCases.find((item) => item.id === mapping.useCaseId) ?? null)
  ).sort(
    (left, right) =>
      (bestScoreByUseCase.get(right.id) ?? 0) - (bestScoreByUseCase.get(left.id) ?? 0) ||
      left.name.localeCompare(right.name)
  );
}

function buildUseCaseBrowseCards(state: DatasetState): UseCaseBrowseCardView[] {
  return state.useCases
    .filter((item) => item.active)
    .map((useCase) => {
      const mappings = state.capabilityUseCases.filter((mapping) => mapping.useCaseId === useCase.id);
      const domains = state.domains.filter((domain) => useCase.domainIds.includes(domain.id));
      const capabilities = uniqueById(
        mappings.map((mapping) => state.capabilities.find((item) => item.id === mapping.capabilityId) ?? null)
      );

      return {
        ...useCase,
        domains,
        capabilityCount: capabilities.length,
        freshness: summarizeFreshness(capabilities.map((capability) => getCapabilityFreshnessInput(state, capability)))
      };
    })
    .sort(
      (left, right) =>
        right.capabilityCount - left.capabilityCount || left.name.localeCompare(right.name)
    );
}

function buildDomainCards(state: DatasetState): DomainCardView[] {
  const useCaseCards = buildUseCaseBrowseCards(state);

  return state.domains
    .map((domain) => {
      const capabilities = state.capabilities.filter((item) => item.domainId === domain.id);
      const companies = uniqueById(
        capabilities.map((capability) => state.companies.find((item) => item.id === capability.companyId) ?? null)
      );
      const useCases = useCaseCards
        .filter((useCase) => useCase.domainIds.includes(domain.id))
        .map((useCase) => ({
          id: useCase.id,
          slug: useCase.slug,
          name: useCase.name,
          summary: useCase.summary,
          active: useCase.active,
          domainIds: useCase.domainIds
        }));

      return {
        domain,
        useCases,
        useCaseCount: useCases.length,
        companyCount: companies.length,
        capabilityCount: capabilities.length,
        freshness: summarizeFreshness(capabilities.map((capability) => getCapabilityFreshnessInput(state, capability)))
      };
    })
    .sort(
      (left, right) =>
        right.capabilityCount - left.capabilityCount ||
        right.useCaseCount - left.useCaseCount ||
        left.domain.name.localeCompare(right.domain.name)
    );
}

function buildCompanyIndexCards(state: DatasetState): CompanyIndexCardView[] {
  return state.companies
    .map((company) => {
      const capabilities = state.capabilities.filter((item) => item.companyId === company.id);
      const mappings = state.capabilityUseCases.filter((item) =>
        capabilities.some((capability) => capability.id === item.capabilityId)
      );
      const domains = uniqueById(
        capabilities.map((capability) => state.domains.find((item) => item.id === capability.domainId) ?? null)
      ).sort((left, right) => left.name.localeCompare(right.name));
      const topUseCases = getTopUseCasesForMappings(state, mappings).slice(0, 3);

      return {
        company,
        domains,
        topUseCases,
        capabilityCount: capabilities.length,
        useCaseCount: uniqueById(
          mappings.map((mapping) => state.useCases.find((item) => item.id === mapping.useCaseId) ?? null)
        ).length,
        strongestMappingScore: mappings.length ? Math.max(...mappings.map((mapping) => mapping.rankingScore)) : 0,
        freshness: summarizeFreshness(capabilities.map((capability) => getCapabilityFreshnessInput(state, capability)))
      };
    })
    .sort(
      (left, right) =>
        right.strongestMappingScore - left.strongestMappingScore ||
        right.capabilityCount - left.capabilityCount ||
        left.company.name.localeCompare(right.company.name)
    );
}

export async function getHomeData() {
  const state = await getDataset();
  const pendingReviews = buildReviewQueueItems(state).filter((item) => item.status === "pending");
  const pendingAiSuggestions = pendingReviews.filter((item) => item.originType === "ai");
  const recentUpdates = state.auditEvents.slice(0, 5);
  const queuedAiRuns = state.aiRuns.filter((item) => item.status === "queued" || item.status === "running");

  return {
    useCases: buildUseCaseBrowseCards(state),
    domains: buildDomainCards(state),
    companies: buildCompanyIndexCards(state),
    pendingReviews,
    pendingAiSuggestions,
    recentUpdates,
    queuedAiRuns
  };
}

export async function getUseCasesIndex() {
  const state = await getDataset();
  return buildUseCaseBrowseCards(state);
}

export async function getDomainsIndex() {
  const state = await getDataset();
  return buildDomainCards(state);
}

export async function getCompaniesIndex() {
  const state = await getDataset();
  return buildCompanyIndexCards(state);
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

export async function getDomainBySlug(slug: string): Promise<DomainDetailView | null> {
  const state = await getDataset();
  const domain = state.domains.find((item) => item.slug === slug);

  if (!domain) {
    return null;
  }

  const useCases = buildUseCaseBrowseCards(state).filter((item) => item.domainIds.includes(domain.id));
  const companies = buildCompanyIndexCards(state).filter((item) =>
    item.domains.some((companyDomain) => companyDomain.id === domain.id)
  );
  const capabilities = state.capabilities
    .filter((item) => item.domainId === domain.id)
    .map((capability) => {
      const company = state.companies.find((item) => item.id === capability.companyId);
      const mappings = getSortedMappingsForCapability(state, capability.id);
      const latestSignal = getSortedSignalsForCapability(state, capability.id)[0] ?? null;

      if (!company) {
        return null;
      }

      return {
        capability,
        company,
        useCases: getTopUseCasesForMappings(state, mappings),
        latestSignal,
        freshness: getFreshnessState(getCapabilityFreshnessInput(state, capability)),
        strongestMappingScore: mappings.length ? Math.max(...mappings.map((mapping) => mapping.rankingScore)) : 0
      };
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value))
    .sort(
      (left, right) =>
        right.strongestMappingScore - left.strongestMappingScore ||
        left.capability.name.localeCompare(right.capability.name)
    );
  const clusters = state.clusters
    .filter((cluster) => cluster.domainId === domain.id)
    .map((cluster) => {
      const clusterCapabilities = capabilities.filter((item) =>
        state.capabilityUseCases.some(
          (mapping) => mapping.capabilityId === item.capability.id && mapping.clusterId === cluster.id
        )
      );

      return {
        cluster,
        count: clusterCapabilities.length,
        topCapability: clusterCapabilities[0]
          ? {
              id: clusterCapabilities[0].capability.id,
              name: clusterCapabilities[0].capability.name,
              companyName: clusterCapabilities[0].company.name
            }
          : null
      };
    })
    .filter((item) => item.count > 0);

  return {
    domain,
    freshness: summarizeFreshness(capabilities.map((item) => getCapabilityFreshnessInput(state, item.capability))),
    useCaseCount: useCases.length,
    companyCount: companies.length,
    capabilityCount: capabilities.length,
    useCases,
    companies,
    capabilities,
    clusters
  };
}

export async function getCapabilityById(id: string): Promise<CapabilityProfileView | null> {
  const state = await getDataset();
  const capability = state.capabilities.find((item) => item.id === id);

  if (!capability) {
    return null;
  }

  const company = state.companies.find((item) => item.id === capability.companyId);
  const domain = state.domains.find((item) => item.id === capability.domainId);

  if (!company || !domain) {
    return null;
  }

  const citationLookup = buildCitationMap(state);
  const signals = state.signals
    .filter((item) => item.capabilityId === capability.id)
    .sort((left, right) => new Date(right.observedAt).getTime() - new Date(left.observedAt).getTime());

  return {
    capability,
    company,
    domain,
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
      const domain = state.domains.find((item) => item.id === capability.domainId);
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

      if (!domain) {
        return null;
      }

      return {
        capability,
        domain,
        mappings,
        signals,
        citations: citationLookup("capability", capability.id),
        latestSignal: signals[0] ?? null
      };
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value))
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
    domains: uniqueById(companyCapabilities.map((item) => item.domain)),
    capabilities: companyCapabilities,
    contacts: state.contacts.filter((item) => item.companyId === company.id),
    citations: citationLookup("company", company.id),
    signals: companySignals
  };
}

function emptySearchResults(): SearchResultsView {
  return {
    domains: [],
    useCases: [],
    capabilities: [],
    companies: []
  };
}

function mapDomainSearchResults(items: DomainSearchRow[], query: string): SearchResultsView["domains"] {
  return rankSearchResults(items, query, [
    { label: "Domain name", weight: 4, value: (item) => item.name },
    { label: "Domain description", weight: 1, value: (item) => item.description }
  ])
    .slice(0, 6)
    .map(({ item, matchContext }) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      useCaseCount: item.useCaseCount ?? 0,
      companyCount: item.companyCount ?? 0,
      matchContext
    }));
}

function mapUseCaseSearchResults(items: UseCaseSearchRow[], query: string): SearchResultsView["useCases"] {
  return rankSearchResults(items, query, [
    { label: "Use Case name", weight: 4, value: (item) => item.name },
    { label: "Use Case summary", weight: 1, value: (item) => item.summary },
    { label: "Domain", weight: 2, value: (item) => (item.domainNames ?? []).join(" ") }
  ])
    .slice(0, 6)
    .map(({ item, matchContext }) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      summary: item.summary,
      domainNames: item.domainNames ?? [],
      matchContext
    }));
}

function mapCapabilitySearchResults(
  items: CapabilitySearchRow[],
  query: string
): SearchResultsView["capabilities"] {
  return rankSearchResults(items, query, [
    { label: "Capability name", weight: 4, value: (item) => item.name },
    { label: "Capability summary", weight: 1, value: (item) => item.summary },
    { label: "Company", weight: 2, value: (item) => item.companyName },
    { label: "Domain", weight: 2, value: (item) => item.domainName }
  ])
    .slice(0, 6)
    .map(({ item, matchContext }) => ({
      id: item.id,
      name: item.name,
      summary: item.summary,
      companyName: item.companyName ?? null,
      domainName: item.domainName ?? null,
      matchContext
    }));
}

function mapCompanySearchResults(items: CompanySearchRow[], query: string): SearchResultsView["companies"] {
  return rankSearchResults(items, query, [
    { label: "Company name", weight: 4, value: (item) => item.name },
    { label: "Company overview", weight: 1, value: (item) => item.overview },
    { label: "Headquarters", weight: 2, value: (item) => item.headquarters },
    { label: "Domain", weight: 2, value: (item) => (item.domainNames ?? []).join(" ") }
  ])
    .slice(0, 6)
    .map(({ item, matchContext }) => ({
      id: item.id,
      name: item.name,
      overview: item.overview,
      headquarters: item.headquarters,
      domainNames: item.domainNames ?? [],
      useCaseCount: item.useCaseCount ?? 0,
      matchContext
    }));
}

function buildSearchResultsFromState(state: DatasetState, query: string): SearchResultsView {
  const companiesById = new Map(state.companies.map((item) => [item.id, item]));
  const domainsById = new Map(state.domains.map((item) => [item.id, item]));
  const companyCards = new Map(buildCompanyIndexCards(state).map((item) => [item.company.id, item]));
  const domainCards = buildDomainCards(state);

  return {
    domains: mapDomainSearchResults(
      domainCards.map((item) => ({
        id: item.domain.id,
        name: item.domain.name,
        slug: item.domain.slug,
        description: item.domain.description,
        useCaseCount: item.useCaseCount,
        companyCount: item.companyCount
      })),
      query
    ),
    useCases: mapUseCaseSearchResults(
      state.useCases.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        summary: item.summary,
        domainNames: item.domainIds
          .map((domainId) => domainsById.get(domainId)?.name ?? null)
          .filter((value): value is string => Boolean(value))
      })),
      query
    ),
    capabilities: mapCapabilitySearchResults(
      state.capabilities.map((item) => ({
        id: item.id,
        name: item.name,
        summary: item.summary,
        domainId: item.domainId,
        domainName: domainsById.get(item.domainId)?.name ?? null,
        companyId: item.companyId,
        companyName: companiesById.get(item.companyId)?.name ?? null
      })),
      query
    ),
    companies: mapCompanySearchResults(
      state.companies.map((item) => ({
        id: item.id,
        name: item.name,
        overview: item.overview,
        headquarters: item.headquarters,
        domainNames: companyCards.get(item.id)?.domains.map((domain) => domain.name) ?? [],
        useCaseCount: companyCards.get(item.id)?.useCaseCount ?? 0
      })),
      query
    )
  };
}

async function searchRecordsWithSupabase(query: string): Promise<SearchResultsView> {
  const supabase = await createClient();
  const pattern = `%${query}%`;

  const [
    domainsByName,
    domainsByDescription,
    useCasesByName,
    useCasesBySummary,
    capabilitiesByName,
    capabilitiesBySummary,
    companiesByName,
    companiesByOverview
  ] = await Promise.all([
    supabase.from("domains").select("id, name, slug, description").ilike("name", pattern).limit(8),
    supabase.from("domains").select("id, name, slug, description").ilike("description", pattern).limit(8),
    supabase.from("use_cases").select("id, name, slug, summary, domain_ids").ilike("name", pattern).limit(8),
    supabase.from("use_cases").select("id, name, slug, summary, domain_ids").ilike("summary", pattern).limit(8),
    supabase
      .from("capabilities")
      .select("id, name, summary, company_id, domain_id")
      .ilike("name", pattern)
      .limit(8),
    supabase
      .from("capabilities")
      .select("id, name, summary, company_id, domain_id")
      .ilike("summary", pattern)
      .limit(8),
    supabase.from("companies").select("id, name, overview, headquarters").ilike("name", pattern).limit(8),
    supabase
      .from("companies")
      .select("id, name, overview, headquarters")
      .ilike("overview", pattern)
      .limit(8)
  ]);

  const domainRows = mergeUniqueById(
    (domainsByName.data ?? []) as DomainSearchRow[],
    (domainsByDescription.data ?? []) as DomainSearchRow[]
  );
  const useCaseRows = mergeUniqueById(
    (useCasesByName.data ?? []) as UseCaseSearchRow[],
    (useCasesBySummary.data ?? []) as UseCaseSearchRow[]
  );
  const capabilityRows = mergeUniqueById(
    (capabilitiesByName.data ?? []) as CapabilitySearchRow[],
    (capabilitiesBySummary.data ?? []) as CapabilitySearchRow[]
  );
  const companyRows = mergeUniqueById(
    (companiesByName.data ?? []) as CompanySearchRow[],
    (companiesByOverview.data ?? []) as CompanySearchRow[]
  );
  const capabilityCompanyIds = Array.from(
    new Set(capabilityRows.map((item) => item.company_id ?? item.companyId).filter(Boolean))
  ) as string[];
  const allResolvedDomainIds = Array.from(
    new Set(
      [
        ...useCaseRows.flatMap((item) => item.domain_ids ?? item.domainIds ?? []),
        ...capabilityRows.map((item) => item.domain_id ?? item.domainId).filter(Boolean)
      ].filter(Boolean)
    )
  ) as string[];
  const [
    capabilityCompanies,
    resolvedDomains,
    matchedCompanyCapabilities
  ] = await Promise.all([
    capabilityCompanyIds.length
      ? supabase.from("companies").select("id, name").in("id", capabilityCompanyIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    allResolvedDomainIds.length
      ? supabase.from("domains").select("id, name").in("id", allResolvedDomainIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    companyRows.length
      ? supabase
          .from("capabilities")
          .select("id, company_id, domain_id")
          .in(
            "company_id",
            companyRows.map((item) => item.id)
          )
      : Promise.resolve({ data: [] as Array<{ id: string; company_id: string; domain_id: string }> })
  ]);
  const matchedCompanyCapabilityRows = (matchedCompanyCapabilities.data ?? []) as Array<{
    id: string;
    company_id: string;
    domain_id: string;
  }>;
  const { data: matchedCompanyMappings } = matchedCompanyCapabilityRows.length
    ? await supabase
        .from("capability_use_cases")
        .select("capability_id, use_case_id")
        .in(
          "capability_id",
          matchedCompanyCapabilityRows.map((item) => item.id)
        )
    : { data: [] as Array<{ capability_id: string; use_case_id: string }> };
  const companyNamesById = new Map((capabilityCompanies.data ?? []).map((item) => [item.id, item.name]));
  const domainNamesById = new Map((resolvedDomains.data ?? []).map((item) => [item.id, item.name]));
  const matchedCompanyCapabilitiesByCompany = new Map<string, typeof matchedCompanyCapabilityRows>();
  matchedCompanyCapabilityRows.forEach((row) => {
    const existing = matchedCompanyCapabilitiesByCompany.get(row.company_id) ?? [];
    existing.push(row);
    matchedCompanyCapabilitiesByCompany.set(row.company_id, existing);
  });
  const matchedUseCaseIdsByCompany = new Map<string, Set<string>>();
  (matchedCompanyMappings ?? []).forEach((mapping) => {
    const companyCapability = matchedCompanyCapabilityRows.find((item) => item.id === mapping.capability_id);
    if (!companyCapability) {
      return;
    }
    const existing = matchedUseCaseIdsByCompany.get(companyCapability.company_id) ?? new Set<string>();
    existing.add(mapping.use_case_id);
    matchedUseCaseIdsByCompany.set(companyCapability.company_id, existing);
  });

  return {
    domains: mapDomainSearchResults(
      domainRows.map((item) => ({
        ...item,
        useCaseCount:
          item.useCaseCount ??
          useCaseRows.filter((useCase) => (useCase.domain_ids ?? useCase.domainIds ?? []).includes(item.id)).length,
        companyCount:
          item.companyCount ??
          companyRows.filter((company) =>
            (matchedCompanyCapabilitiesByCompany.get(company.id) ?? []).some(
              (capability) => capability.domain_id === item.id
            )
          ).length
      })),
      query
    ),
    useCases: mapUseCaseSearchResults(
      useCaseRows.map((item) => ({
        ...item,
        domainNames: (item.domain_ids ?? item.domainIds ?? [])
          .map((domainId) => domainNamesById.get(domainId) ?? null)
          .filter((value): value is string => Boolean(value))
      })),
      query
    ),
    capabilities: mapCapabilitySearchResults(
      capabilityRows.map((item) => ({
        ...item,
        domainName: domainNamesById.get(item.domain_id ?? item.domainId ?? "") ?? null,
        companyName: companyNamesById.get(item.company_id ?? item.companyId ?? "") ?? null
      })),
      query
    ),
    companies: mapCompanySearchResults(
      companyRows.map((item) => ({
        ...item,
        domainNames: uniqueById(
          (matchedCompanyCapabilitiesByCompany.get(item.id) ?? []).map((capability) => ({
            id: capability.domain_id,
            name: domainNamesById.get(capability.domain_id) ?? capability.domain_id
          }))
        ).map((domain) => domain.name),
        useCaseCount: matchedUseCaseIdsByCompany.get(item.id)?.size ?? 0
      })),
      query
    )
  };
}

export async function searchRecords(query: string): Promise<SearchResultsView> {
  const normalized = query.trim();

  if (!normalized) {
    return emptySearchResults();
  }

  if (!hasSupabaseEnv()) {
    return buildSearchResultsFromState(getMockDataset(), normalized);
  }

  return searchRecordsWithSupabase(normalized);
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
