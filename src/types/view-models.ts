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

export interface CapabilityProfileView {
  capability: Capability;
  company: Company;
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
