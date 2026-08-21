import type { SignalEdition } from "@/lib/atlas/signals";
import type { RelationshipPilotTreatment } from "@/lib/atlas/relationship-pilot";
import type {
  AtlasConfidence,
  AtlasDemandRequirement,
  AtlasFreshness,
  AtlasMissionDetail,
  AtlasMissionOrganizationConnection,
  AtlasMissionRecordConnection
} from "@/types/atlas";

const confidenceWeight: Record<AtlasConfidence, number> = { high: 3, moderate: 2, needs_review: 1 };
const freshnessWeight: Record<AtlasFreshness, number> = { current: 2, review_due: 1, stale: 0 };

const stopWords = new Set([
  "about", "across", "against", "along", "also", "and", "been", "being", "between", "canadian", "capability", "could", "from", "have", "into", "more", "need", "organization", "public", "record", "reviewed", "system", "technology", "that", "their", "these", "this", "through", "under", "where", "which", "with"
]);

type RelationshipPresentationInput = {
  id: string;
  organizationSlug: string;
  capabilitySlug: string;
  capabilityName: string;
  capabilitySummary: string;
  alignmentSummary: string;
  technicalDomains: readonly string[];
  matchType: "public_source_alignment" | "derived";
  matchConfidence: AtlasConfidence;
  organizationConfidence: AtlasConfidence | null;
  capabilityConfidence: AtlasConfidence | null;
  freshnessStatus: AtlasFreshness | null;
  lastReviewedAt: string | null;
  citationCount: number;
  latestCitationAt: string | null;
};

type PresentationComponents = {
  materialGapPenalty: number;
  genericOverlapPenalty: number;
  directness: number;
  functionalSpecificity: number;
  contextOverlap: number;
  relationshipConfidence: number;
  evidenceSupport: number;
  sourceConfidence: number;
  freshness: number;
  reviewedAt: number;
  organizationSlug: string;
  capabilitySlug: string;
  id: string;
};

export type RelationshipResultVariant = "treatment" | "control";
export type RelationshipResultPlacement = "featured" | "complete";
export type DemandRelationshipAssessmentRole = "direct" | "enabling" | "broader";
export const broaderDemandRelationshipAssessmentCopy = "This published relationship remains available for completeness, but the capability description does not establish direct or enabling functional overlap with this need. Review the public evidence before relying on it.";
export type MissionFeaturePresentation = {
  connection: AtlasMissionOrganizationConnection;
  reason: string;
  themeKey: string;
};

function normalize(value: string) {
  return value.toLocaleLowerCase("en-CA").replace(/[_–—-]/g, " ").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function countNormalizedPhraseHits(haystack: string, phrases: readonly string[]) {
  const normalizedPhrases = new Set(phrases.map(normalize).filter(Boolean));
  const normalizedHaystack = normalize(haystack);
  return [...normalizedPhrases].reduce((count, phrase) => count + (normalizedHaystack.includes(phrase) ? 1 : 0), 0);
}

function meaningfulTokens(values: readonly string[]) {
  return new Set(values.flatMap((value) => normalize(value).split(" ")).filter((token) => token.length >= 4 && !stopWords.has(token)));
}

function timestamp(value: string | null) {
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

function presentationComponents(input: RelationshipPresentationInput, treatment: RelationshipPilotTreatment): PresentationComponents {
  const capabilityText = normalize([
    input.capabilityName,
    input.capabilitySummary,
    ...input.technicalDomains
  ].join(" "));
  const directHits = countNormalizedPhraseHits(capabilityText, treatment.directPhrases);
  const enablingHits = countNormalizedPhraseHits(capabilityText, treatment.enablingPhrases);
  const adjacentHits = countNormalizedPhraseHits(capabilityText, treatment.adjacentPhrases);
  const contextTokens = meaningfulTokens(treatment.contextPhrases);
  const capabilityTokens = meaningfulTokens([capabilityText]);
  const contextOverlap = [...contextTokens].filter((token) => capabilityTokens.has(token)).length;
  const materialGapPenalty = adjacentHits > 0 && enablingHits === 0 && directHits === 0 ? 2 : 0;
  const genericOverlapPenalty = directHits === 0 && enablingHits === 0 && contextOverlap < 2 ? 1 : 0;
  const directness = directHits > 0 ? 3 : enablingHits > 0 ? 2 : contextOverlap >= 2 ? 1 : 0;
  const latestEvidenceAt = Math.max(timestamp(input.lastReviewedAt), timestamp(input.latestCitationAt));

  return {
    materialGapPenalty,
    genericOverlapPenalty,
    directness,
    functionalSpecificity: directHits * 3 + enablingHits * 2 + Math.min(contextOverlap, 4),
    contextOverlap,
    relationshipConfidence: confidenceWeight[input.matchConfidence] + (input.matchType === "public_source_alignment" ? 1 : 0),
    evidenceSupport: Math.min(input.citationCount, 2),
    sourceConfidence: input.organizationConfidence && input.capabilityConfidence
      ? Math.min(confidenceWeight[input.organizationConfidence], confidenceWeight[input.capabilityConfidence])
      : 0,
    freshness: input.freshnessStatus ? freshnessWeight[input.freshnessStatus] : 0,
    reviewedAt: latestEvidenceAt,
    organizationSlug: input.organizationSlug,
    capabilitySlug: input.capabilitySlug,
    id: input.id
  };
}

function compareComponents(left: PresentationComponents, right: PresentationComponents) {
  return left.materialGapPenalty - right.materialGapPenalty
    || left.genericOverlapPenalty - right.genericOverlapPenalty
    || right.directness - left.directness
    || right.functionalSpecificity - left.functionalSpecificity
    || right.contextOverlap - left.contextOverlap
    || right.relationshipConfidence - left.relationshipConfidence
    || right.evidenceSupport - left.evidenceSupport
    || right.sourceConfidence - left.sourceConfidence
    || right.freshness - left.freshness
    || right.reviewedAt - left.reviewedAt
    || left.organizationSlug.localeCompare(right.organizationSlug)
    || left.capabilitySlug.localeCompare(right.capabilitySlug)
    || left.id.localeCompare(right.id);
}

function latestCitationAt(citations: readonly { publishedAt: string | null }[]) {
  return citations.reduce<string | null>((latest, citation) => {
    if (!citation.publishedAt) return latest;
    return !latest || timestamp(citation.publishedAt) > timestamp(latest) ? citation.publishedAt : latest;
  }, null);
}

function demandInput(entry: AtlasDemandRequirement["matches"][number]): RelationshipPresentationInput {
  return {
    id: entry.match.id,
    organizationSlug: entry.organization.slug,
    capabilitySlug: entry.capability.slug,
    capabilityName: entry.capability.name,
    capabilitySummary: entry.capability.summary,
    alignmentSummary: entry.match.alignmentSummary,
    technicalDomains: [],
    matchType: entry.match.matchType,
    matchConfidence: entry.match.confidence,
    organizationConfidence: null,
    capabilityConfidence: null,
    freshnessStatus: null,
    lastReviewedAt: null,
    citationCount: entry.match.citations.length,
    latestCitationAt: latestCitationAt(entry.match.citations)
  };
}

function missionInput(connection: AtlasMissionOrganizationConnection, capability: AtlasMissionOrganizationConnection["capabilities"][number]): RelationshipPresentationInput {
  return {
    id: capability.assessment.id,
    organizationSlug: connection.organization.slug,
    capabilitySlug: capability.slug,
    capabilityName: capability.name,
    capabilitySummary: capability.summary,
    alignmentSummary: capability.assessment.alignmentSummary,
    technicalDomains: capability.technicalDomains.flatMap((domain) => [domain.name, domain.summary]),
    matchType: capability.assessment.matchType,
    matchConfidence: capability.assessment.confidence,
    organizationConfidence: connection.organization.sourceConfidence,
    capabilityConfidence: capability.sourceConfidence,
    freshnessStatus: connection.organization.freshnessStatus,
    lastReviewedAt: connection.organization.lastReviewedAt,
    citationCount: 0,
    latestCitationAt: null
  };
}

function missionConnectionComponents(connection: AtlasMissionOrganizationConnection, treatment: RelationshipPilotTreatment) {
  const capability = connection.capabilities[0];
  if (capability) return presentationComponents(missionInput(connection, capability), treatment);
  return {
    materialGapPenalty: 3,
    genericOverlapPenalty: 2,
    directness: 0,
    functionalSpecificity: 0,
    contextOverlap: 0,
    relationshipConfidence: 0,
    evidenceSupport: 0,
    sourceConfidence: 0,
    freshness: 0,
    reviewedAt: 0,
    organizationSlug: connection.organization.slug,
    capabilitySlug: "",
    id: connection.organization.id
  } satisfies PresentationComponents;
}

export function orderDemandRelationships(matches: AtlasDemandRequirement["matches"], treatment: RelationshipPilotTreatment) {
  return [...matches].sort((left, right) => compareComponents(
    presentationComponents(demandInput(left), treatment),
    presentationComponents(demandInput(right), treatment)
  ));
}

export function orderMissionRelationships(connections: AtlasMissionOrganizationConnection[], treatment: RelationshipPilotTreatment) {
  return connections
    .map((connection) => ({
      ...connection,
      capabilities: [...connection.capabilities].sort((left, right) => compareComponents(
        presentationComponents(missionInput(connection, left), treatment),
        presentationComponents(missionInput(connection, right), treatment)
      ))
    }))
    .sort((left, right) => compareComponents(
      missionConnectionComponents(left, treatment),
      missionConnectionComponents(right, treatment)
    ));
}

function isFeatureQuality(components: PresentationComponents, minimumDirectness: number) {
  return components.materialGapPenalty === 0
    && components.genericOverlapPenalty === 0
    && components.directness >= minimumDirectness
    && components.relationshipConfidence >= 2;
}

export function selectFeaturedDemandRelationships(
  orderedMatches: AtlasDemandRequirement["matches"],
  treatment: RelationshipPilotTreatment,
  limit = 5
) {
  return orderedMatches.filter((entry) => {
    const components = presentationComponents(demandInput(entry), treatment);
    return isFeatureQuality(components, 3) && components.evidenceSupport >= 1;
  }).slice(0, limit);
}

export function demandRelationshipAssessmentRole(
  entry: AtlasDemandRequirement["matches"][number],
  treatment: RelationshipPilotTreatment
): DemandRelationshipAssessmentRole {
  const components = presentationComponents(demandInput(entry), treatment);
  if (components.materialGapPenalty > 0 || components.genericOverlapPenalty > 0 || components.directness < 2) return "broader";
  return components.directness >= 3 ? "direct" : "enabling";
}

export function demandRelationshipAssessmentCopy(
  role: DemandRelationshipAssessmentRole,
  alignmentSummary: string
) {
  return role === "broader" ? broaderDemandRelationshipAssessmentCopy : alignmentSummary;
}

type MissionCapability = AtlasMissionOrganizationConnection["capabilities"][number];
type MissionFeatureTheme = NonNullable<RelationshipPilotTreatment["featureThemes"]>[number];

type MissionThemeCandidate = {
  connection: AtlasMissionOrganizationConnection;
  capability: MissionCapability;
  components: PresentationComponents;
  specificHits: number;
  domainHits: number;
};

function missionCapabilityText(capability: MissionCapability) {
  return [capability.name, capability.summary].join(" ");
}

function missionCapabilityDomainText(capability: MissionCapability) {
  return capability.technicalDomains.flatMap((domain) => [domain.name, domain.summary]).join(" ");
}

function compareMissionThemeCandidates(left: MissionThemeCandidate, right: MissionThemeCandidate) {
  return right.specificHits - left.specificHits
    || right.components.relationshipConfidence - left.components.relationshipConfidence
    || right.components.sourceConfidence - left.components.sourceConfidence
    || right.components.freshness - left.components.freshness
    || right.components.directness - left.components.directness
    || right.components.functionalSpecificity - left.components.functionalSpecificity
    || right.domainHits - left.domainHits
    || right.components.reviewedAt - left.components.reviewedAt
    || left.connection.organization.slug.localeCompare(right.connection.organization.slug)
    || left.capability.slug.localeCompare(right.capability.slug);
}

function missionThemeCandidates(
  connections: AtlasMissionOrganizationConnection[],
  treatment: RelationshipPilotTreatment,
  theme: MissionFeatureTheme,
  excludedOrganizationIds: ReadonlySet<string>
) {
  return connections.flatMap((connection) => {
    if (excludedOrganizationIds.has(connection.organization.id)) return [];
    return connection.capabilities.flatMap((capability) => {
      const components = presentationComponents(missionInput(connection, capability), treatment);
      const specificHits = countNormalizedPhraseHits(missionCapabilityText(capability), theme.phrases);
      const domainHits = countNormalizedPhraseHits(missionCapabilityDomainText(capability), theme.phrases);
      const hasSpecificThemeEvidence = specificHits > 0;
      const hasSupportedDomainEvidence = specificHits === 0
        && domainHits > 0
        && isFeatureQuality(components, 2);
      return components.materialGapPenalty === 0
        && components.relationshipConfidence >= 2
        && components.sourceConfidence >= 1
        && components.freshness >= 1
        && (hasSpecificThemeEvidence || hasSupportedDomainEvidence)
        ? [{ connection, capability, components, specificHits, domainHits }]
        : [];
    });
  }).sort(compareMissionThemeCandidates);
}

function connectionWithCapabilityFirst(connection: AtlasMissionOrganizationConnection, capabilityId: string) {
  return {
    ...connection,
    capabilities: [
      ...connection.capabilities.filter((capability) => capability.id === capabilityId),
      ...connection.capabilities.filter((capability) => capability.id !== capabilityId)
    ]
  };
}

export function selectFeaturedMissionRelationshipPresentations(
  orderedConnections: AtlasMissionOrganizationConnection[],
  treatment: RelationshipPilotTreatment,
  limit = 5
): MissionFeaturePresentation[] {
  const selected: MissionFeaturePresentation[] = [];
  const selectedIds = new Set<string>();

  for (const theme of treatment.featureThemes ?? []) {
    const winner = missionThemeCandidates(orderedConnections, treatment, theme, selectedIds)[0];
    if (!winner) continue;
    selected.push({
      connection: connectionWithCapabilityFirst(winner.connection, winner.capability.id),
      reason: theme.label,
      themeKey: theme.key
    });
    selectedIds.add(winner.connection.organization.id);
    if (selected.length >= limit) return selected;
  }

  for (const connection of orderedConnections) {
    if (selectedIds.has(connection.organization.id)) continue;
    const capability = connection.capabilities.find((candidate) => {
      const components = presentationComponents(missionInput(connection, candidate), treatment);
      return isFeatureQuality(components, 2) && components.sourceConfidence >= 1 && components.freshness >= 1;
    });
    if (!capability) continue;
    selected.push({
      connection: connectionWithCapabilityFirst(connection, capability.id),
      reason: "Additional specific capability",
      themeKey: "additional-specific-capability"
    });
    selectedIds.add(connection.organization.id);
    if (selected.length >= limit) break;
  }
  return selected;
}

export function selectFeaturedMissionRelationships(
  orderedConnections: AtlasMissionOrganizationConnection[],
  treatment: RelationshipPilotTreatment,
  limit = 5
) {
  return selectFeaturedMissionRelationshipPresentations(orderedConnections, treatment, limit)
    .map((presentation) => presentation.connection);
}

export function selectMissionPublicNeedsForPresentation(
  publicNeeds: AtlasMissionDetail["publicNeeds"],
  treatment: RelationshipPilotTreatment,
  limit = 4
) {
  return [...publicNeeds]
    .filter((publicNeed) => publicNeed.technologyCount >= 2)
    .sort((left, right) => {
      const contextDifference = countNormalizedPhraseHits(right.title, treatment.contextPhrases)
        - countNormalizedPhraseHits(left.title, treatment.contextPhrases);
      return contextDifference
        || right.technologyCount - left.technologyCount
        || left.title.localeCompare(right.title);
    })
    .slice(0, limit);
}

export function selectDemandMissionLenses(
  missions: AtlasMissionRecordConnection[],
  limit = 4
) {
  return missions
    .filter(({ capabilityCount }) => capabilityCount >= 2)
    .slice(0, limit);
}

export function relationshipPositionBand(index: number) {
  if (index < 3) return "1-3";
  if (index < 6) return "4-6";
  if (index < 12) return "7-12";
  return "13+";
}

export function relationshipResultMetadata(input: {
  variant: RelationshipResultVariant;
  placement: RelationshipResultPlacement;
  targetType: "mission" | "public_need";
  targetSlug: string;
  positionBand: string;
  destinationType: "organization" | "capability";
  destinationSlug: string;
}) {
  return {
    presentation: `relationship_presentation_v1:${input.variant}:${input.placement}`,
    target: `${input.targetType}:${input.targetSlug}`,
    position_band: input.positionBand,
    destination: `${input.destinationType}:${input.destinationSlug}`
  };
}

export function shouldShowRelationshipTreatmentIntro(hasTreatment: boolean, clampedDirectoryPage: number) {
  return hasTreatment && clampedDirectoryPage === 1;
}

export function selectRelationshipSignals(
  editions: SignalEdition[],
  targetKeys: ReadonlySet<string>,
  limit = 3
) {
  return editions.flatMap((edition) => {
    const item = edition.items.find((candidate) => candidate.links.some((link) => targetKeys.has(`${link.type}:${link.id}`)));
    return item ? [{
      id: edition.id,
      slug: edition.slug,
      title: edition.title,
      summary: edition.executiveSummary,
      editionDate: edition.editionDate,
      matchedItemTitle: item.title
    }] : [];
  }).slice(0, limit);
}
