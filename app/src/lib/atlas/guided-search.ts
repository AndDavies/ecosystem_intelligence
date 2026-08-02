import type { AtlasCapability, AtlasExplorerCapability, AtlasGuidedSearchFocus, AtlasOrganization, AtlasQuery } from "@/types/atlas";

export const guidedSearchQuestion = "Who in Canada could help build a modular naval mission system?";
export const guidedSearchExample = "modular-naval";

type GuidedSearchFocusDefinition = {
  id: AtlasGuidedSearchFocus;
  label: string;
  description: string;
  domains?: readonly string[];
  missions?: readonly string[];
  matches: readonly string[];
};

export const guidedSearchFocuses: readonly GuidedSearchFocusDefinition[] = [
  {
    id: "modular-systems",
    label: "Modular systems",
    description: "Containerized or modular platforms, payloads and mission packages.",
    matches: ["modular", "containerized", "container", "payload", "mission package"]
  },
  {
    id: "naval-integration",
    label: "Naval integration",
    description: "Interfaces, power, data and mission-system integration in naval environments.",
    matches: ["naval", "maritime", "shipbuilding", "ship", "vessel", "marine", "mission system"]
  },
  {
    id: "underwater-sensing",
    label: "Underwater sensing",
    description: "Sensors and systems for subsea detection, survey and awareness.",
    domains: ["sensing-and-isr"],
    missions: ["underwater-isr"],
    matches: ["underwater", "subsea", "sonar", "hydrographic"]
  },
  {
    id: "testing",
    label: "Testing",
    description: "Facilities, ranges and services that support validation and evaluation.",
    domains: ["test-training-and-sustainment"],
    matches: ["test", "testing", "validation", "evaluation", "range"]
  },
  {
    id: "sustainment",
    label: "Sustainment",
    description: "Maintenance, supportability, lifecycle and through-life capability.",
    domains: ["test-training-and-sustainment", "logistics-and-sustainment"],
    matches: ["sustainment", "maintenance", "supportability", "lifecycle", "through-life", "logistics"]
  }
];

export const guidedSearchFocusIds = guidedSearchFocuses.map((focus) => focus.id);

export function normalizeGuidedSearchFocus(values: readonly string[] | undefined): AtlasGuidedSearchFocus[] {
  if (!values?.length) return [];
  const requested = new Set(values.flatMap((value) => value.split(",")).map((value) => value.trim()));
  return guidedSearchFocusIds.filter((id) => requested.has(id));
}

export function guidedSearchFocusForId(id: AtlasGuidedSearchFocus) {
  return guidedSearchFocuses.find((focus) => focus.id === id)!;
}

export function guidedSearchExampleFromSearchParams(params: URLSearchParams) {
  if (params.get("example") !== guidedSearchExample) return null;
  const requested = normalizeGuidedSearchFocus(params.getAll("focus"));
  return { focus: requested.length ? requested : guidedSearchFocusIds };
}

export function guidedSearchFromQuery(query: AtlasQuery) {
  const focus = normalizeGuidedSearchFocus(query.focus);
  return focus.length ? { focus } : null;
}

export function guidedSearchHref(focus: readonly AtlasGuidedSearchFocus[]) {
  const params = new URLSearchParams({ example: guidedSearchExample });
  const selected = normalizeGuidedSearchFocus(focus);
  if (selected.length) params.set("focus", selected.join(","));
  return `/map?${params.toString()}`;
}

function capabilitySearchText(capability: AtlasCapability | AtlasExplorerCapability) {
  return [
    capability.name,
    capability.summary,
    capability.capabilityType ?? "",
    ...("coreFeatures" in capability ? capability.coreFeatures : []),
    ...capability.defenceApplications,
    ...capability.technicalTags,
    ...capability.technicalDomains.flatMap((domain) => [domain.slug, domain.name, ...("summary" in domain ? [domain.summary] : [])]),
    ...capability.missionMatches.flatMap((match) => [match.missionArea.slug, match.missionArea.name, match.alignmentSummary])
  ].join(" ").toLowerCase();
}

export function capabilityMatchesGuidedSearchFocus(capability: AtlasCapability | AtlasExplorerCapability, focusId: AtlasGuidedSearchFocus) {
  const focus = guidedSearchFocusForId(focusId);
  if (focus.domains?.some((domain) => capability.technicalDomains.some((item) => item.slug === domain))) return true;
  if (focus.missions?.some((mission) => capability.missionMatches.some((match) => match.missionArea.slug === mission))) return true;
  const searchable = capabilitySearchText(capability);
  return focus.matches.some((term) => searchable.includes(term));
}

export function organizationMatchesGuidedSearchFocus(organization: AtlasOrganization, focus: readonly AtlasGuidedSearchFocus[]) {
  return focus.length > 0 && organization.capabilities.some((capability) =>
    focus.some((focusId) => capabilityMatchesGuidedSearchFocus(capability, focusId))
  );
}
