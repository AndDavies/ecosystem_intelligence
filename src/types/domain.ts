export type Role = "viewer" | "editor" | "reviewer" | "admin";
export type Pathway = "build" | "validate" | "scale";
export type RelevanceBand = "low" | "medium" | "high";
export type DefenceRelevance = "low" | "medium" | "high";
export type ChangeStatus = "pending" | "approved" | "rejected";
export type SignalType =
  | "funding"
  | "contract"
  | "pilot"
  | "partnership"
  | "strategic_hiring"
  | "accelerator"
  | "technical_milestone";

export type SuggestedActionType =
  | "connect_to_end_user_validation"
  | "explore_testbed_inclusion"
  | "assess_funding_fit"
  | "introduce_to_integrator"
  | "monitor_for_later_stage_engagement"
  | "assess_procurement_relevance";

export interface Profile {
  id: string;
  email: string;
  fullName: string | null;
  role: Role;
}

export interface Domain {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface UseCase {
  id: string;
  slug: string;
  name: string;
  summary: string;
  active: boolean;
  domainIds: string[];
}

export interface Cluster {
  id: string;
  name: string;
  slug: string;
  domainId: string;
  summary: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  overview: string;
  geography: "canada" | "nato" | "global";
  headquarters: string;
  marketContext: string | null;
  websiteUrl: string | null;
  publicContactEmail: string | null;
  publicContactPhone: string | null;
  lastUpdatedAt: string;
}

export interface Contact {
  id: string;
  companyId: string;
  name: string;
  title: string;
  email: string | null;
  linkedinUrl: string | null;
}

export interface Capability {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  capabilityType: string;
  domainId: string;
  summary: string;
  companyFacingContext: string | null;
  lastUpdatedAt: string;
}

export interface CapabilityUseCase {
  id: string;
  capabilityId: string;
  useCaseId: string;
  clusterId: string;
  pathway: Pathway;
  relevanceBand: RelevanceBand;
  defenceRelevance: DefenceRelevance;
  suggestedActionType: SuggestedActionType;
  actionNote: string | null;
  whyItMatters: string;
  rankingScore: number;
  reviewerOverrideDelta: number;
  evidenceStrength: 1 | 3 | 5;
  actionabilityScore: 0 | 5;
  lastSignalAt: string | null;
  staleAfterDays: number;
}

export interface Signal {
  id: string;
  capabilityId: string;
  signalType: SignalType;
  title: string;
  description: string;
  observedAt: string;
}

export interface Source {
  id: string;
  sourceType: string;
  title: string;
  url: string;
  publisher: string;
  publishedAt: string | null;
}

export interface EvidenceSnippet {
  id: string;
  sourceId: string;
  capabilityId: string | null;
  excerpt: string;
}

export interface FieldCitation {
  id: string;
  entityType: "capability" | "company" | "capability_use_case" | "use_case_observation";
  entityId: string;
  fieldName: string;
  evidenceSnippetId: string;
}

export interface UseCaseObservation {
  id: string;
  useCaseId: string;
  title: string;
  note: string;
  lastUpdatedAt: string;
}

export interface ChangeRequest {
  id: string;
  entityType: string;
  entityId: string;
  changedFields: string[];
  beforeValue: Record<string, unknown>;
  afterValue: Record<string, unknown>;
  requesterName: string;
  requesterEmail: string;
  reviewerName: string | null;
  status: ChangeStatus;
  createdAt: string;
  reviewedAt: string | null;
}

export interface AuditEvent {
  id: string;
  actorName: string;
  actorEmail: string;
  eventType: string;
  entityType: string;
  entityId: string;
  summary: string;
  createdAt: string;
}

export interface AiRun {
  id: string;
  entityType: string;
  entityId: string;
  status: "queued" | "running" | "completed" | "failed";
  promptVersion: string;
  resultSummary: string | null;
  createdAt: string;
}
