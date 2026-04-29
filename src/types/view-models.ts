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
  Shortlist,
  ShortlistItem,
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
  citations: CitationView[];
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

export interface BriefingTargetView {
  entry: CapabilityCardView;
  rank: number;
  targetRead: {
    label: string;
    tone: "success" | "info" | "muted";
    whyPrioritize: string;
    priorityNow: string;
    whyNotOthers: string;
    strength: string;
    limitation: string;
    actionDirective: string;
    context: string;
  };
  freshness: FreshnessState;
  evidencePosture: {
    label: string;
    tone: "success" | "info" | "muted" | "danger";
    detail: string;
    citationCount: number;
  };
  suggestedStatus: ShortlistItem["status"];
}

export interface CoverageGapView {
  label: string;
  detail: string;
  tone: "info" | "muted" | "danger";
  category: "maturity" | "cluster" | "geography" | "evidence" | "freshness";
}

export interface UseCaseBriefingView {
  useCase: UseCaseView;
  targets: BriefingTargetView[];
  coverageGaps: CoverageGapView[];
  briefingSummary: string[];
  shortlists: ShortlistIndexCardView[];
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

export interface ShortlistIndexCardView {
  shortlist: Shortlist;
  useCase: UseCase | null;
  itemCount: number;
  statusCounts: Record<ShortlistItem["status"], number>;
  ownerCount: number;
  dueItemCount: number;
  nextStepCount: number;
  updatedAt: string;
}

export interface ShortlistDetailView {
  shortlist: Shortlist;
  useCase: UseCase | null;
  items: Array<{
    item: ShortlistItem;
    capability: Capability | null;
    company: Company | null;
    domain: Domain | null;
    mappings: Array<CapabilityUseCase & { useCase: UseCase; cluster: Cluster }>;
  }>;
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
  priorityTier: UseCase["priorityTier"];
  useCaseKind: UseCase["useCaseKind"];
  partnerFrames: string[];
  policyAnchors: string[];
  missionOutcome: string;
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
  shortlists: Shortlist[];
  shortlistItems: ShortlistItem[];
}
