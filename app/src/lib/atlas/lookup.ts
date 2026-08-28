import { buildAtlasLensOptions } from "@/lib/atlas/lens-options";
import { organizationKindLabel } from "@/lib/atlas/presentation";
import type {
  AtlasDiscoverySnapshot,
  AtlasLookupKind,
  AtlasLookupSuggestion
} from "@/types/atlas";

const corporateSuffixes = new Set([
  "co",
  "company",
  "corp",
  "corporation",
  "inc",
  "incorporated",
  "limited",
  "ltd"
]);

const kindOrder: Record<AtlasLookupKind, number> = {
  organization: 0,
  capability: 1,
  technical_domain: 2,
  mission_area: 3,
  public_need: 4
};

type LookupMatch = {
  tier: number;
  distance: number;
};

type RankedSuggestion = {
  suggestion: AtlasLookupSuggestion;
  match: LookupMatch;
};

export function normalizeAtlasLookupText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function withoutCorporateSuffix(value: string) {
  const words = normalizeAtlasLookupText(value).split(" ").filter(Boolean);
  while (words.length > 1 && corporateSuffixes.has(words.at(-1)!)) words.pop();
  return words.join(" ");
}

function acronym(value: string) {
  return withoutCorporateSuffix(value)
    .split(" ")
    .filter((word) => word && !corporateSuffixes.has(word))
    .map((word) => word[0])
    .join("");
}

function boundedEditDistance(left: string, right: string, limit: number) {
  if (Math.abs(left.length - right.length) > limit) return limit + 1;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    let rowMinimum = current[0];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      const next = Math.min(
        previous[rightIndex] + 1,
        current[rightIndex - 1] + 1,
        previous[rightIndex - 1] + cost
      );
      current.push(next);
      rowMinimum = Math.min(rowMinimum, next);
    }
    if (rowMinimum > limit) return limit + 1;
    previous = current;
  }
  return previous[right.length];
}

function typoDistance(query: string, label: string) {
  if (query.includes(" ")) {
    const limit = query.length >= 12 ? 2 : 1;
    return boundedEditDistance(query, label, limit);
  }
  const limit = query.length >= 8 ? 2 : query.length >= 5 ? 1 : 0;
  if (!limit) return limit + 1;
  return Math.min(
    boundedEditDistance(query, label.replaceAll(" ", ""), limit),
    ...label.split(" ").map((word) => boundedEditDistance(query, word, limit))
  );
}

function lookupMatch(rawQuery: string, label: string, slug: string, supportingText: string): LookupMatch | null {
  const query = withoutCorporateSuffix(rawQuery);
  const normalizedLabel = normalizeAtlasLookupText(label);
  const simplifiedLabel = withoutCorporateSuffix(label);
  const normalizedSlug = normalizeAtlasLookupText(slug);
  const compactQuery = query.replaceAll(" ", "");
  const words = normalizedLabel.split(" ");
  const queryWords = query.split(" ");

  if (query === normalizedLabel || query === simplifiedLabel) return { tier: 0, distance: 0 };
  if (query === normalizedSlug || compactQuery === acronym(label)) return { tier: 1, distance: 0 };
  if (normalizedLabel.startsWith(query) || simplifiedLabel.startsWith(query)) return { tier: 2, distance: 0 };
  if (queryWords.every((queryWord) => words.some((word) => word.startsWith(queryWord)))) {
    return { tier: 3, distance: 0 };
  }
  if (normalizedLabel.includes(query) || simplifiedLabel.includes(query)) return { tier: 4, distance: 0 };

  const distance = typoDistance(query, simplifiedLabel);
  const allowedDistance = query.length >= 8 ? 2 : query.length >= 5 ? 1 : 0;
  if (allowedDistance && distance <= allowedDistance) return { tier: 5, distance };

  const normalizedSupportingText = normalizeAtlasLookupText(supportingText);
  if (queryWords.every((word) => normalizedSupportingText.includes(word))) return { tier: 6, distance: 0 };
  return null;
}

function rankedSuggestion(
  rawQuery: string,
  suggestion: AtlasLookupSuggestion,
  supportingText = suggestion.secondary
): RankedSuggestion | null {
  const match = lookupMatch(rawQuery, suggestion.label, suggestion.slug, supportingText);
  return match ? { suggestion, match } : null;
}

function compareRanked(left: RankedSuggestion, right: RankedSuggestion) {
  return left.match.tier - right.match.tier
    || left.match.distance - right.match.distance
    || kindOrder[left.suggestion.kind] - kindOrder[right.suggestion.kind]
    || left.suggestion.label.length - right.suggestion.label.length
    || left.suggestion.label.localeCompare(right.suggestion.label)
    || left.suggestion.slug.localeCompare(right.suggestion.slug);
}

function selectRanked(values: Array<RankedSuggestion | null>, limit: number) {
  return values
    .filter((value): value is RankedSuggestion => Boolean(value))
    .sort(compareRanked)
    .slice(0, limit)
    .map(({ suggestion }) => suggestion);
}

export function queryAtlasLookupSnapshot(snapshot: AtlasDiscoverySnapshot, rawQuery: string) {
  const query = rawQuery.trim().slice(0, 120);
  if (normalizeAtlasLookupText(query).length < 2) return [];

  const organizations = selectRanked(snapshot.organizations.map((organization) => rankedSuggestion(query, {
    kind: "organization",
    id: organization.id,
    slug: organization.slug,
    label: organization.name,
    secondary: [
      organizationKindLabel(organization.entityKind),
      organization.primaryLocation?.name
    ].filter(Boolean).join(" · "),
    href: `/organizations/${organization.slug}`
  }, [
    organization.description,
    organization.primaryLocation?.name ?? "",
    organization.primaryLocation?.provinceTerritory ?? "",
    ...organization.categories,
    ...organization.capabilities.flatMap((capability) => [capability.name, capability.summary])
  ].join(" "))), 4);

  const capabilities = selectRanked(snapshot.organizations.flatMap((organization) =>
    organization.capabilities.map((capability) => rankedSuggestion(query, {
      kind: "capability",
      id: capability.id,
      slug: capability.slug,
      label: capability.name,
      secondary: [organization.name, capability.capabilityType].filter(Boolean).join(" · "),
      href: `/capabilities/${capability.slug}`,
      organizationSlug: organization.slug
    }, [
      organization.name,
      capability.summary,
      capability.capabilityType ?? "",
      ...capability.coreFeatures,
      ...capability.defenceApplications,
      ...capability.technicalTags
    ].join(" ")))
  ), 3);

  const lensOptions = buildAtlasLensOptions(snapshot);
  const technologyAreas = snapshot.technicalDomains.map((domain) => {
    const count = lensOptions.technicalDomains.find((option) => option.slug === domain.slug)?.count ?? 0;
    return rankedSuggestion(query, {
      kind: "technical_domain",
      id: domain.id,
      slug: domain.slug,
      label: domain.name,
      secondary: `${count.toLocaleString("en-CA")} published ${count === 1 ? "organization" : "organizations"}`,
      href: `/map?domain=${encodeURIComponent(domain.slug)}`,
      filter: { key: "domain", value: domain.slug }
    }, domain.summary);
  });
  const missionAreas = snapshot.missionAreas.map((mission) => {
    const count = lensOptions.missionAreas.find((option) => option.slug === mission.slug)?.count ?? 0;
    return rankedSuggestion(query, {
      kind: "mission_area",
      id: mission.id,
      slug: mission.slug,
      label: mission.name,
      secondary: `${count.toLocaleString("en-CA")} published ${count === 1 ? "organization" : "organizations"}`,
      href: `/map?mission=${encodeURIComponent(mission.slug)}`,
      filter: { key: "mission", value: mission.slug }
    }, mission.summary);
  });
  const publicNeeds = snapshot.demandRequirements.map((demand) => {
    const count = lensOptions.demandRequirements.find((option) => option.slug === demand.slug)?.count ?? 0;
    return rankedSuggestion(query, {
      kind: "public_need",
      id: demand.id,
      slug: demand.slug,
      label: demand.title,
      secondary: `${count.toLocaleString("en-CA")} published ${count === 1 ? "organization" : "organizations"}`,
      href: `/map?demand=${encodeURIComponent(demand.slug)}`,
      filter: { key: "demand", value: demand.slug }
    });
  });
  const discoveryLenses = selectRanked([...technologyAreas, ...missionAreas, ...publicNeeds], 3);

  return [...organizations, ...capabilities, ...discoveryLenses];
}
