import type { AtlasEntityKind, AtlasFreshness } from "@/types/atlas";

export type OrganizationCoverageRole =
  | "industry"
  | "research_and_test"
  | "government"
  | "accelerator_and_incubator"
  | "ecosystem"
  | "capital";

export type OrganizationCoverageTraffic = {
  searchImpressions?: number;
  searchClicks?: number;
  dossierOpens?: number;
  profileEngagements?: number;
};

export type OrganizationCoverageInput = {
  id: string;
  slug: string;
  name: string;
  entityKind: AtlasEntityKind;
  freshnessStatus: AtlasFreshness;
  lastReviewedAt: string | null;
  hasExecutiveRelevanceSummary: boolean;
  hasOperatingContext: boolean;
  hasCanadianFootprint: boolean;
  hasCurrentActivity: boolean;
  capabilityCount: number;
  missionMatchCount: number;
  demandMatchCount: number;
  programCount: number;
  relationshipCount: number;
  fundingEventCount: number;
  publicCitationCount: number;
  hasPublicContact: boolean;
  hasPublishedLogo: boolean;
  traffic?: OrganizationCoverageTraffic;
};

export type RankedOrganizationCoverage = OrganizationCoverageInput & {
  role: OrganizationCoverageRole;
  dossierDepthScore: number;
  priorityScore: number;
  gaps: string[];
  priorityReasons: string[];
};

export type OrganizationCoverageReport = {
  generatedAt: string;
  totalPublishedOrganizations: number;
  signalAvailability: {
    executiveRelevanceField: boolean;
    searchTraffic: boolean;
    attributableEngagement: boolean;
  };
  coverage: Record<string, number>;
  roles: Record<OrganizationCoverageRole, number>;
  rankedOrganizations: RankedOrganizationCoverage[];
  recommendedWave: RankedOrganizationCoverage[];
};

const allRoles: OrganizationCoverageRole[] = [
  "industry",
  "research_and_test",
  "government",
  "accelerator_and_incubator",
  "ecosystem",
  "capital"
];

function finiteCount(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}

function boundedLogSignal(value: number | undefined, weight: number, maximum: number) {
  return Math.min(maximum, Math.log2(finiteCount(value) + 1) * weight);
}

export function coverageRole(entityKind: AtlasEntityKind): OrganizationCoverageRole {
  if (entityKind === "company") return "industry";
  if (entityKind === "research_test_centre") return "research_and_test";
  if (entityKind === "government_innovation_office") return "government";
  if (entityKind === "accelerator" || entityKind === "incubator") return "accelerator_and_incubator";
  if (entityKind === "investor_funder") return "capital";
  return "ecosystem";
}

export function publicContactPresence(profileData: unknown) {
  if (!profileData || typeof profileData !== "object" || Array.isArray(profileData)) return false;
  const publicContact = (profileData as Record<string, unknown>).publicContact;
  if (!publicContact || typeof publicContact !== "object" || Array.isArray(publicContact)) return false;
  return ["contactPageUrl", "publicEmail", "publicPhone", "linkedInUrl"]
    .some((key) => typeof (publicContact as Record<string, unknown>)[key] === "string"
      && Boolean(String((publicContact as Record<string, unknown>)[key]).trim()));
}

export function rankOrganizationCoverage(input: OrganizationCoverageInput): RankedOrganizationCoverage {
  const gaps: string[] = [];
  let score = 0;
  const addGap = (missing: boolean, label: string, weight: number) => {
    if (!missing) return;
    gaps.push(label);
    score += weight;
  };

  addGap(!input.hasExecutiveRelevanceSummary, "Executive relevance summary", 24);
  addGap(input.publicCitationCount === 0, "Public evidence", 18);
  addGap(input.capabilityCount === 0, "Published capabilities", 12);
  addGap(!input.hasCurrentActivity, "Current activity and date", 8);
  addGap(!input.hasOperatingContext, "Operating context", 7);
  addGap(!input.hasCanadianFootprint, "Canadian footprint", 6);
  addGap(input.programCount === 0, "Public programs or contracts", 5);
  addGap(!input.hasPublicContact, "Official public contact path", 3);
  addGap(!input.hasPublishedLogo, "Approved organization logo", 2);

  if (input.freshnessStatus === "stale") score += 8;
  else if (input.freshnessStatus === "review_due") score += 4;

  const relevanceScore = Math.min(input.missionMatchCount, 3) * 3
    + Math.min(input.demandMatchCount, 3) * 4;
  const traffic = input.traffic ?? {};
  const trafficScore = boundedLogSignal(traffic.searchClicks, 4, 12)
    + boundedLogSignal(traffic.searchImpressions, 1.25, 6)
    + boundedLogSignal(traffic.dossierOpens, 2.5, 8)
    + boundedLogSignal(traffic.profileEngagements, 2, 8);
  score += relevanceScore + trafficScore;

  const publicRecordDepth = input.programCount > 0 || input.relationshipCount > 0 || input.fundingEventCount > 0;
  const dossierDepthScore = [
    input.hasExecutiveRelevanceSummary,
    input.hasOperatingContext,
    input.hasCanadianFootprint,
    input.hasCurrentActivity,
    input.capabilityCount > 0,
    input.publicCitationCount > 0,
    publicRecordDepth,
    input.hasPublicContact,
    input.hasPublishedLogo
  ].filter(Boolean).length;
  const priorityReasons = [
    relevanceScore > 0 ? `${input.missionMatchCount} Mission and ${input.demandMatchCount} Public Need connections` : null,
    trafficScore > 0 ? "Attributable visitor or search demand" : null,
    input.freshnessStatus !== "current" ? `Freshness: ${input.freshnessStatus.replaceAll("_", " ")}` : null,
    gaps.length ? `${gaps.length} dossier coverage gaps` : null
  ].filter((value): value is string => Boolean(value));

  return {
    ...input,
    role: coverageRole(input.entityKind),
    dossierDepthScore,
    priorityScore: Number(score.toFixed(2)),
    gaps,
    priorityReasons
  };
}

export function rankOrganizationCoverageCorpus(inputs: OrganizationCoverageInput[]) {
  return inputs.map(rankOrganizationCoverage).sort((left, right) => {
    if (right.priorityScore !== left.priorityScore) return right.priorityScore - left.priorityScore;
    const leftReviewed = left.lastReviewedAt ?? "";
    const rightReviewed = right.lastReviewedAt ?? "";
    if (leftReviewed !== rightReviewed) return leftReviewed.localeCompare(rightReviewed);
    return left.name.localeCompare(right.name, "en-CA");
  });
}

export function selectRoleBalancedCoverageWave(ranked: RankedOrganizationCoverage[], limit: number) {
  const boundedLimit = Math.max(0, Math.min(Math.floor(limit), ranked.length));
  if (!boundedLimit) return [];
  const selected: RankedOrganizationCoverage[] = [];
  const selectedIds = new Set<string>();
  const roleCounts = new Map<OrganizationCoverageRole, number>();
  const populatedRoles = allRoles.filter((role) => ranked.some((record) => record.role === role));

  for (const role of populatedRoles) {
    const candidate = ranked.find((record) => record.role === role && !selectedIds.has(record.id));
    if (!candidate || selected.length === boundedLimit) break;
    selected.push(candidate);
    selectedIds.add(candidate.id);
    roleCounts.set(role, 1);
  }

  const dominantRoleLimit = Math.max(1, Math.ceil(boundedLimit * 0.6));
  for (const candidate of ranked) {
    if (selected.length === boundedLimit) break;
    if (selectedIds.has(candidate.id)) continue;
    if ((roleCounts.get(candidate.role) ?? 0) >= dominantRoleLimit) continue;
    selected.push(candidate);
    selectedIds.add(candidate.id);
    roleCounts.set(candidate.role, (roleCounts.get(candidate.role) ?? 0) + 1);
  }
  for (const candidate of ranked) {
    if (selected.length === boundedLimit) break;
    if (selectedIds.has(candidate.id)) continue;
    selected.push(candidate);
    selectedIds.add(candidate.id);
  }
  return selected;
}

export function buildOrganizationCoverageReport({
  records,
  generatedAt,
  waveSize = 50,
  executiveRelevanceFieldAvailable = true,
  searchTrafficIncluded = false,
  attributableEngagementIncluded = false
}: {
  records: OrganizationCoverageInput[];
  generatedAt: string;
  waveSize?: number;
  executiveRelevanceFieldAvailable?: boolean;
  searchTrafficIncluded?: boolean;
  attributableEngagementIncluded?: boolean;
}): OrganizationCoverageReport {
  const rankedOrganizations = rankOrganizationCoverageCorpus(records);
  const roles = Object.fromEntries(allRoles.map((role) => [role, 0])) as Record<OrganizationCoverageRole, number>;
  for (const record of rankedOrganizations) roles[record.role] += 1;
  const count = (predicate: (record: RankedOrganizationCoverage) => boolean) => rankedOrganizations.filter(predicate).length;
  return {
    generatedAt,
    totalPublishedOrganizations: rankedOrganizations.length,
    signalAvailability: {
      executiveRelevanceField: executiveRelevanceFieldAvailable,
      searchTraffic: searchTrafficIncluded,
      attributableEngagement: attributableEngagementIncluded
    },
    coverage: {
      executiveRelevanceSummary: count((record) => record.hasExecutiveRelevanceSummary),
      operatingContext: count((record) => record.hasOperatingContext),
      canadianFootprint: count((record) => record.hasCanadianFootprint),
      currentActivity: count((record) => record.hasCurrentActivity),
      publishedCapabilities: count((record) => record.capabilityCount > 0),
      publicEvidence: count((record) => record.publicCitationCount > 0),
      publicProgramsOrContracts: count((record) => record.programCount > 0),
      publicContactPath: count((record) => record.hasPublicContact),
      approvedLogo: count((record) => record.hasPublishedLogo),
      missionRelevance: count((record) => record.missionMatchCount > 0),
      publicNeedRelevance: count((record) => record.demandMatchCount > 0)
    },
    roles,
    rankedOrganizations,
    recommendedWave: selectRoleBalancedCoverageWave(rankedOrganizations, waveSize)
  };
}
