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
  Signal,
  Source,
  UseCase,
  UseCaseObservation
} from "@/types/domain";
import type { FreshnessState, FreshnessTone } from "@/lib/freshness";

export interface FreshnessSummaryView {
  label: string;
  tone: FreshnessTone;
  detail: string;
  lastActivityAt: string | null;
  staleCount: number;
  watchCount: number;
  freshCount: number;
}

export interface CitationView {
  fieldName: string;
  sourceTitle: string;
  sourceUrl: string;
  publisher: string;
  publishedAt: string | null;
  excerpt: string;
}

export interface CapabilityCardView {
  capability: Capability;
  company: Company;
  domain: Domain;
  mapping: CapabilityUseCase;
  cluster: Cluster;
  citations: CitationView[];
  signals: Signal[];
}

export interface UseCaseView {
  useCase: UseCase;
  domains: Domain[];
  observations: UseCaseObservation[];
  topTargets: CapabilityCardView[];
  allCapabilities: CapabilityCardView[];
  clusters: Array<{
    cluster: Cluster;
    count: number;
    topCapability: CapabilityCardView | null;
  }>;
  maturityDistribution: Array<{
    pathway: CapabilityUseCase["pathway"];
    count: number;
  }>;
}

export interface UseCaseBrowseCardView extends UseCase {
  domains: Domain[];
  capabilityCount: number;
  freshness: FreshnessSummaryView;
}

export interface DomainCardView {
  domain: Domain;
  useCases: UseCase[];
  useCaseCount: number;
  companyCount: number;
  capabilityCount: number;
  freshness: FreshnessSummaryView;
}

export interface CompanyIndexCardView {
  company: Company;
  domains: Domain[];
  topUseCases: UseCase[];
  capabilityCount: number;
  useCaseCount: number;
  strongestMappingScore: number;
  freshness: FreshnessSummaryView;
}

export interface DomainDetailView {
  domain: Domain;
  freshness: FreshnessSummaryView;
  useCaseCount: number;
  companyCount: number;
  capabilityCount: number;
  useCases: UseCaseBrowseCardView[];
  companies: CompanyIndexCardView[];
  capabilities: Array<{
    capability: Capability;
    company: Company;
    useCases: UseCase[];
    latestSignal: Signal | null;
    freshness: FreshnessState;
    strongestMappingScore: number;
  }>;
  clusters: Array<{
    cluster: Cluster;
    count: number;
    topCapability: {
      id: string;
      name: string;
      companyName: string;
    } | null;
  }>;
}

export interface CapabilityProfileView {
  capability: Capability;
  company: Company;
  domain: Domain;
  mappings: Array<
    CapabilityUseCase & {
      useCase: UseCase;
      cluster: Cluster;
      citations: CitationView[];
    }
  >;
  signals: Signal[];
  citations: CitationView[];
  companyCitations: CitationView[];
  latestSignal: Signal | null;
  contacts: Contact[];
}

export interface CompanyCapabilityContextView {
  capability: Capability;
  domain: Domain;
  mappings: Array<
    CapabilityUseCase & {
      useCase: UseCase;
      cluster: Cluster;
      citations: CitationView[];
    }
  >;
  signals: Signal[];
  citations: CitationView[];
  latestSignal: Signal | null;
}

export interface CompanyProfileView {
  company: Company;
  domains: Domain[];
  capabilities: CompanyCapabilityContextView[];
  contacts: Contact[];
  citations: CitationView[];
  signals: Signal[];
}

export interface ReviewQueueItemView extends ChangeRequest {
  entityLabel: string;
  entityHref: string | null;
  entityContext: string | null;
  isRefreshRequest: boolean;
  originType: "ai" | "human";
  originLabel: string;
  originSummary: string;
  aiRunContext: {
    createdAt: string;
    promptVersion: string;
    status: AiRun["status"];
    resultSummary: string | null;
    sourceLabel: string;
  } | null;
  supportingCitations: CitationView[];
  changedFieldDetails: Array<{
    fieldName: string;
    label: string;
    beforeValue: string;
    afterValue: string;
  }>;
}

export interface ReviewQueueView {
  pending: ReviewQueueItemView[];
}

export interface DomainSearchResult {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  useCaseCount: number;
  companyCount: number;
  matchContext: string;
}

export interface UseCaseSearchResult {
  id: string;
  name: string;
  slug: string;
  summary: string;
  domainNames: string[];
  matchContext: string;
}

export interface CapabilitySearchResult {
  id: string;
  name: string;
  summary: string;
  companyName: string | null;
  domainName: string | null;
  matchContext: string;
}

export interface CompanySearchResult {
  id: string;
  name: string;
  overview: string;
  headquarters: string;
  domainNames: string[];
  useCaseCount: number;
  matchContext: string;
}

export interface SearchResultsView {
  domains: DomainSearchResult[];
  useCases: UseCaseSearchResult[];
  capabilities: CapabilitySearchResult[];
  companies: CompanySearchResult[];
}

export interface DatasetState {
  auditEvents: AuditEvent[];
  aiRuns: AiRun[];
  domains: Domain[];
  useCases: UseCase[];
  clusters: Cluster[];
  companies: Company[];
  contacts: Contact[];
  capabilities: Capability[];
  capabilityUseCases: CapabilityUseCase[];
  signals: Signal[];
  sources: Source[];
  evidenceSnippets: EvidenceSnippet[];
  fieldCitations: FieldCitation[];
  useCaseObservations: UseCaseObservation[];
  changeRequests: ChangeRequest[];
}
