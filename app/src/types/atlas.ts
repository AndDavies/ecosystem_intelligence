export type AtlasConfidence = "high" | "moderate" | "needs_review";
export type AtlasFreshness = "current" | "review_due" | "stale";
export type AtlasPublicationStatus = "draft" | "published" | "archived";
export type AtlasAlignmentType = "public_source_alignment" | "derived";
export type AtlasEntityKind =
  | "company"
  | "accelerator"
  | "incubator"
  | "research_test_centre"
  | "investor_funder"
  | "ecosystem_organization"
  | "government_innovation_office";

export interface AtlasCitation {
  id: string;
  fieldName: string;
  sourceTitle: string;
  sourceUrl: string;
  publisher: string;
  sourceType: string;
  excerpt: string;
  publishedAt: string | null;
}

export interface AtlasLocation {
  id: string;
  name: string;
  city: string | null;
  provinceTerritory: string | null;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  geographicConfidence: "exact" | "city_centroid" | "regional" | "unverified";
  regionSlug: string;
}

export interface AtlasTechnicalDomain {
  id: string;
  slug: string;
  name: string;
  summary: string;
}

export interface AtlasMissionArea {
  id: string;
  slug: string;
  name: string;
  summary: string;
  sourceConfidence: AtlasConfidence;
}

export interface AtlasMissionMatch {
  id: string;
  missionArea: AtlasMissionArea;
  alignmentSummary: string;
  matchType: AtlasAlignmentType;
  confidence: AtlasConfidence;
  citations: AtlasCitation[];
}

export interface AtlasDemandMatch {
  id: string;
  demandRequirementId: string;
  demandSlug: string;
  demandTitle: string;
  alignmentSummary: string;
  rationale: string;
  matchType: AtlasAlignmentType;
  confidence: AtlasConfidence;
  citations: AtlasCitation[];
}

export interface AtlasCapability {
  id: string;
  organizationId: string;
  slug: string;
  name: string;
  summary: string;
  capabilityType: string | null;
  coreFeatures: string[];
  technologyReadinessLevel: number | null;
  maturity: string | null;
  commercialAvailability: string | null;
  defenceApplications: string[];
  novelty: string[];
  technicalTags: string[];
  technicalDomains: AtlasTechnicalDomain[];
  missionMatches: AtlasMissionMatch[];
  demandMatches: AtlasDemandMatch[];
  sourceConfidence: AtlasConfidence;
  lastReviewedAt: string | null;
  citations: AtlasCitation[];
}

export interface AtlasProgramParticipation {
  id: string;
  programSlug: string;
  programName: string;
  programType: string;
  participationType: string;
  cohortLabel: string | null;
}

export interface AtlasFundingEvent {
  id: string;
  eventType: string;
  announcedOn: string | null;
  amountValue: number | null;
  amountCurrency: string | null;
  disclosedSummary: string;
  citations: AtlasCitation[];
}

export interface AtlasOrganizationLogo {
  id: string;
  publicUrl: string;
  storagePath: string;
  sourceUrl: string | null;
  attributionText: string | null;
}

export interface AtlasOrganization {
  id: string;
  slug: string;
  name: string;
  legalName: string | null;
  description: string;
  websiteUrl: string | null;
  entityKind: AtlasEntityKind;
  categories: string[];
  sourceConfidence: AtlasConfidence;
  freshnessStatus: AtlasFreshness;
  lastReviewedAt: string | null;
  primaryLocation: AtlasLocation | null;
  locations: AtlasLocation[];
  foundedYear: number | null;
  employeeRange: string | null;
  companyStage: string | null;
  ownership: string | null;
  commercialStatus: string | null;
  disclosedFinancingSummary: string | null;
  defencePosture: string | null;
  dualUsePosture: string | null;
  profileData: Record<string, unknown>;
  logo: AtlasOrganizationLogo | null;
  capabilities: AtlasCapability[];
  programs: AtlasProgramParticipation[];
  fundingEvents: AtlasFundingEvent[];
  citations: AtlasCitation[];
}

export interface AtlasDemandSource {
  id: string;
  slug: string;
  title: string;
  publisher: string;
  publishedOn: string | null;
  classificationLabel: string;
  summary: string;
  sourceUrl: string;
  sourceKind?: string | null;
  commitmentLevel?: string | null;
}

export interface AtlasDemandRequirement {
  id: string;
  slug: string;
  title: string;
  problemStatement: string;
  desiredEndState: string;
  publicCaveat: string;
  displayOrder: number;
  source: AtlasDemandSource;
  matches: Array<{
    organization: Pick<AtlasOrganization, "id" | "slug" | "name" | "sourceConfidence">;
    capability: Pick<AtlasCapability, "id" | "slug" | "name" | "summary">;
    match: AtlasDemandMatch;
  }>;
  citations: AtlasCitation[];
}

export interface AtlasCluster {
  id: string;
  slug: string;
  name: string;
  summary: string;
  regionSlug: string | null;
  clusterBasis: "editorial" | "program" | "geographic" | "technical";
  capabilityIds: string[];
}

export interface AtlasRegion {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  provincesTerritories: string[];
  organizationCount: number;
  capabilityCount: number;
  clusterCount: number;
}

export interface AtlasSnapshot {
  organizations: AtlasOrganization[];
  demandRequirements: AtlasDemandRequirement[];
  technicalDomains: AtlasTechnicalDomain[];
  missionAreas: AtlasMissionArea[];
  clusters: AtlasCluster[];
  regions: AtlasRegion[];
  generatedAt: string;
  dataSource: "supabase";
}

export interface AtlasBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface AtlasQuery {
  query?: string;
  bounds?: AtlasBounds;
  region?: string;
  metro?: string;
  type?: string;
  capability?: string;
  domain?: string;
  mission?: string;
  demand?: string;
  stage?: string;
  program?: string;
  page?: number;
  pageSize?: number;
}

export interface AtlasQueryResult {
  organizations: AtlasOrganization[];
  total: number;
  page: number;
  pageSize: number;
  appliedFilters: Array<{ key: string; label: string; value: string }>;
  facets: {
    regions: Array<{ value: string; label: string; count: number }>;
    organizationTypes: Array<{ value: string; label: string; count: number }>;
    technicalDomains: Array<{ value: string; label: string; count: number }>;
    missionAreas: Array<{ value: string; label: string; count: number }>;
    demandRequirements: Array<{ value: string; label: string; count: number }>;
  };
}

/**
 * Compact public-explorer representation. Full organization records remain the
 * canonical model and are fetched only when a user opens a detailed result.
 */
export interface AtlasExplorerOrganization extends Pick<
  AtlasOrganization,
  | "id"
  | "slug"
  | "name"
  | "description"
  | "entityKind"
  | "sourceConfidence"
  | "freshnessStatus"
  | "lastReviewedAt"
  | "primaryLocation"
> {
  citations: AtlasExplorerCitation[];
  capabilities: AtlasExplorerCapability[];
}

export type AtlasExplorerCitation = Pick<
  AtlasCitation,
  "id" | "sourceTitle" | "sourceUrl" | "publisher"
>;

export interface AtlasExplorerMissionMatch extends Pick<
  AtlasMissionMatch,
  "id" | "alignmentSummary" | "matchType" | "confidence"
> {
  missionArea: Pick<AtlasMissionArea, "id" | "slug" | "name">;
  citations: AtlasExplorerCitation[];
}

export interface AtlasExplorerDemandMatch extends Pick<
  AtlasDemandMatch,
  "id" | "demandSlug" | "demandTitle" | "alignmentSummary" | "matchType" | "confidence"
> {
  citations: AtlasExplorerCitation[];
}

export interface AtlasExplorerCapability extends Pick<
  AtlasCapability,
  | "id"
  | "organizationId"
  | "slug"
  | "name"
  | "summary"
  | "capabilityType"
  | "defenceApplications"
  | "technicalTags"
  | "sourceConfidence"
  | "lastReviewedAt"
> {
  technicalDomains: Array<Pick<AtlasTechnicalDomain, "id" | "slug" | "name">>;
  missionMatches: AtlasExplorerMissionMatch[];
  demandMatches: AtlasExplorerDemandMatch[];
  citations: AtlasExplorerCitation[];
}

export interface AtlasExplorerQueryResult extends Omit<AtlasQueryResult, "organizations"> {
  organizations: AtlasExplorerOrganization[];
  hasMore: boolean;
  nextPage: number | null;
}

export interface AtlasDiscoveryResult {
  query: string;
  searchId?: string | null;
  interpretation: "matched" | "ambiguous" | "no_match";
  filters: AtlasQuery;
  filterChips: Array<{ key: string; label: string; value: string }>;
  organizationIds: string[];
  capabilityIds: string[];
  evidenceLinks: Array<{ title: string; url: string; publisher: string }>;
  summary: string | null;
  suggestions: string[];
  assistant?: AtlasAssistantAnswer | null;
  organizations?: AtlasOrganization[];
  quota?: AtlasAssistantQuota;
  fallbackReason?: AtlasAssistantFallbackReason;
}

export type AtlasAssistantOutcome = "exact_match" | "closest_supported" | "coverage_gap";
export type AtlasAssistantFitLevel = "strong" | "plausible" | "adjacent";
export type AtlasAssistantEvidenceLevel = "strong" | "moderate" | "limited";
export type AtlasAssistantFallbackReason = "quota" | "unavailable" | "timeout" | "refusal" | "invalid_output";

export interface AtlasAssistantSupportPoint {
  text: string;
  citationIds: string[];
}

export interface AtlasAssistantMatch {
  organizationId: string;
  capabilityId: string | null;
  fitLevel: AtlasAssistantFitLevel;
  evidenceLevel: AtlasAssistantEvidenceLevel;
  supportPoints: AtlasAssistantSupportPoint[];
  limitations: string[];
}

export interface AtlasAssistantAnswer {
  outcome: AtlasAssistantOutcome;
  interpretedNeed: string;
  summary: string;
  matches: AtlasAssistantMatch[];
  gaps: string[];
  followUpSuggestions: string[];
}

export interface AtlasAssistantPriorTurn {
  query: string;
  organizationIds: string[];
}

export interface AtlasAssistantQuota {
  signedIn: boolean;
  limit: 3 | 20;
  used: number;
  remaining: number;
}
