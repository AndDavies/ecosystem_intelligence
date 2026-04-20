import type {
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
  contacts: Contact[];
}

export interface CompanyProfileView {
  company: Company;
  capabilities: Capability[];
  contacts: Contact[];
  citations: CitationView[];
}

export interface ReviewQueueView {
  pending: ChangeRequest[];
}

export interface DatasetState {
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
