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

export interface AtlasMissionRecordConnection {
  missionArea: AtlasMissionArea;
  capabilityCount: number;
  connectingCapabilities: Array<Pick<AtlasCapability, "id" | "slug" | "name">>;
}

export interface AtlasDemandMatch {
  id: string;
  demandRequirementId: string;
  demandSlug: string;
  demandTitle: string;
  alignmentSummary: string;
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

export type AtlasOrganizationEditorialProfileVersion = "organization_editorial_profile_v1";

export interface AtlasReviewedQuestion {
  id: string;
  question: string;
  context: string;
  confidence: Exclude<AtlasConfidence, "needs_review">;
}

export interface AtlasOrganizationEditorialProfile {
  version: AtlasOrganizationEditorialProfileVersion | null;
  executiveRelevanceSummary?: string | null;
  currentActivity: string | null;
  currentActivityAsOf: string | null;
  operatingContext: string | null;
  canadianFootprint: string | null;
  reviewedQuestions: AtlasReviewedQuestion[];
}

export type AtlasProgramLifecycleStage =
  | "announced"
  | "selected"
  | "funded"
  | "awarded"
  | "contracted"
  | "testing"
  | "evaluating"
  | "delivering"
  | "operational"
  | "completed"
  | "cancelled";

export interface AtlasProgramExternalIdentifier {
  kind: "contract" | "notice" | "challenge" | "project" | "award" | "other";
  value: string;
}

export interface AtlasProgramParticipation {
  id: string;
  programSlug: string;
  programName: string;
  programType: string;
  programSummary: string | null;
  programOperatorName: string | null;
  programUrl: string | null;
  participationType: string;
  cohortLabel: string | null;
  publicSummary: string | null;
  lifecycleStage: AtlasProgramLifecycleStage | null;
  announcedOn: string | null;
  startedOn: string | null;
  endedOn: string | null;
  externalIdentifiers: AtlasProgramExternalIdentifier[];
  citations: AtlasCitation[];
  programCitations: AtlasCitation[];
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

export interface AtlasOrganizationRelationship {
  id: string;
  relationshipType: string;
  publicSummary: string;
  relatedOrganizationId: string | null;
  relatedOrganizationName: string | null;
  relatedOrganization: {
    id: string;
    slug: string;
    name: string;
    entityKind: AtlasEntityKind;
  } | null;
  citations: AtlasCitation[];
}

export interface AtlasDossierMediaAsset {
  id: string;
  organizationId: string | null;
  capabilityId: string | null;
  assetType: "logo" | "product_image" | "facility_image" | "other";
  publicUrl: string | null;
  sourceUrl: string | null;
  attributionText: string | null;
  altText: string | null;
  displayRole: "profile_identity" | "profile_context" | "capability_context" | "source_support" | null;
  citations: AtlasCitation[];
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
  editorialProfile: AtlasOrganizationEditorialProfile;
  logo: AtlasOrganizationLogo | null;
  mediaAssets: AtlasDossierMediaAsset[];
  capabilities: AtlasCapability[];
  programs: AtlasProgramParticipation[];
  fundingEvents: AtlasFundingEvent[];
  relationships: AtlasOrganizationRelationship[];
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
  sourceLocator: string | null;
  sourceExcerpt: string;
  sourceVerifiedAt: string;
  isSourceVerified: boolean;
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

/**
 * Evidence-light national discovery data used by the public map and filters.
 * Organizations and capabilities retain the searchable fields the explorer
 * needs, while citations, media, financing, and dossier-only fields remain on
 * the bounded record loaders.
 */
export interface AtlasDiscoverySnapshot {
  organizations: AtlasOrganization[];
  demandRequirements: Array<Pick<AtlasDemandRequirement, "id" | "slug" | "title">>;
  technicalDomains: AtlasTechnicalDomain[];
  missionAreas: AtlasMissionArea[];
  clusters: AtlasCluster[];
  regions: AtlasRegion[];
  generatedAt: string;
  dataSource: "supabase";
}

export interface AtlasCoverageSummary {
  organizations: number;
  capabilities: number;
  sources: number;
  generatedAt: string;
}

/**
 * Evidence-light public-need record for the collection page. The full source
 * passage, citations, and matched organization records remain on the bounded
 * Demand Signal detail loader.
 */
export interface AtlasDemandIndexItem {
  id: string;
  slug: string;
  title: string;
  problemStatement: string;
  displayOrder: number;
  matchCount: number;
  source: Pick<
    AtlasDemandSource,
    "id" | "publisher" | "sourceKind" | "commitmentLevel"
  >;
}

export interface AtlasDemandIndexSnapshot {
  demands: AtlasDemandIndexItem[];
  sourceCount: number;
  matchCount: number;
  generatedAt: string;
}

export interface AtlasMissionIndexItem {
  missionArea: AtlasMissionArea;
  organizationCount: number;
  capabilityCount: number;
  connectedPublicNeedCount: number;
  confidenceCounts: Record<AtlasConfidence, number>;
}

export interface AtlasMissionIndexSnapshot {
  missions: AtlasMissionIndexItem[];
  organizationCount: number;
  capabilityCount: number;
  generatedAt: string;
}

export interface AtlasMissionCapabilityConnection extends Pick<
  AtlasCapability,
  "id" | "slug" | "name" | "summary" | "sourceConfidence" | "technicalDomains"
> {
  assessment: Pick<AtlasMissionMatch, "id" | "alignmentSummary" | "matchType" | "confidence">;
}

export interface AtlasMissionOrganizationConnection {
  organization: Pick<
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
  >;
  capabilities: AtlasMissionCapabilityConnection[];
  strongestConfidence: AtlasConfidence;
}

export interface AtlasMissionDetail {
  missionArea: AtlasMissionArea;
  organizations: AtlasMissionOrganizationConnection[];
  publicNeeds: Array<Pick<AtlasDemandRequirement, "id" | "slug" | "title"> & {
    technologyCount: number;
    connectingCapabilities: Array<Pick<AtlasCapability, "id" | "slug" | "name">>;
  }>;
  capabilityCount: number;
  generatedAt: string;
}

export interface AtlasBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

/**
 * Stable, visitor-facing concepts used only by the deterministic modular-naval
 * guided search. These IDs are deliberately distinct from internal taxonomy
 * names so the public language can stay clear without inventing taxonomy.
 */
export type AtlasGuidedSearchFocus =
  | "modular-systems"
  | "naval-integration"
  | "underwater-sensing"
  | "testing"
  | "sustainment";

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
  cluster?: string;
  focus?: AtlasGuidedSearchFocus[];
  view?: "map" | "table";
  selected?: string;
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
  /**
   * Published logo URL attached only for the paginated result page. Optional
   * so full organization records remain assignable where compact rows are
   * accepted; render through organizationLogoSource for both shapes.
   */
  logoUrl?: string | null;
}

/**
 * Minimal public record used to render every matching organization on the map
 * without coupling marker coverage to paginated explorer cards.
 */
export interface AtlasMapOrganization extends Pick<
  AtlasOrganization,
  "id" | "slug" | "name" | "entityKind"
> {
  primaryLocation: Pick<AtlasLocation, "name" | "latitude" | "longitude" | "geographicConfidence"> | null;
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
  mapOrganizations: AtlasMapOrganization[];
  hasMore: boolean;
  nextPage: number | null;
}

export type AtlasExplorerFilterOption = {
  slug: string;
  name: string;
  count?: number;
};

export type AtlasExplorerDemandOption = {
  slug: string;
  title: string;
  count?: number;
};

export type AtlasExplorerTypeOption = {
  value: string;
  label: string;
  count?: number;
};

export type AtlasLookupKind =
  | "organization"
  | "capability"
  | "technical_domain"
  | "mission_area"
  | "public_need";

export type AtlasLookupFilter = {
  key: "domain" | "mission" | "demand";
  value: string;
};

export interface AtlasLookupSuggestion {
  kind: AtlasLookupKind;
  id: string;
  slug: string;
  label: string;
  secondary: string;
  href: string;
  organizationSlug?: string;
  logoUrl?: string | null;
  filter?: AtlasLookupFilter;
}

export interface AtlasLookupResponse {
  suggestions: AtlasLookupSuggestion[];
  totalOrganizationMatches: number;
  seeAllHref: string | null;
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
