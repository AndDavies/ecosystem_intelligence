export type InternalLinkTargetType =
  | "organization"
  | "capability"
  | "mission_area"
  | "public_need"
  | "technical_domain"
  | "program"
  | "signal"
  | "brief"
  | "region"
  | "cluster"
  | "map"
  | "working_list";

export type InternalLinkRelationshipKind =
  | "ownership"
  | "reviewed_mission"
  | "reviewed_public_need"
  | "organization_relationship"
  | "program_participation"
  | "editorial_record"
  | "shared_capability"
  | "shared_mission"
  | "shared_domain"
  | "regional_cluster"
  | "map_path"
  | "decision_handoff";

export type InternalLinkProvenance = "direct" | "editorial" | "derived" | "discovery";

export type InternalLinkEdge = {
  href: string;
  label: string;
  detail?: string;
  targetType: InternalLinkTargetType;
  targetSlug: string;
  relationshipKind: InternalLinkRelationshipKind;
  provenance: InternalLinkProvenance;
};

export type ExploreNextGroupKey = "organizations" | "context" | "intelligence";

export type ExploreNextGroup = {
  key: ExploreNextGroupKey;
  title: string;
  description?: string;
  links: InternalLinkEdge[];
};

export type EditorialRecordContinuationInput = {
  recordType: "organization" | "capability" | "demand_requirement" | "mission_area";
  recordId: string;
  href: string;
  label: string;
  detail?: string;
};

export function capabilityRelatedOrganizationEdge(organization: {
  slug: string;
  name: string;
  reason: string;
}): InternalLinkEdge {
  return {
    href: `/organizations/${organization.slug}`,
    label: `Explore ${organization.name} in similar areas of work`,
    detail: `${organization.reason}. Discovery path only; not a partnership or endorsement.`,
    targetType: "organization",
    targetSlug: organization.slug,
    relationshipKind: organization.reason.includes("Mission Area") ? "shared_mission" : "shared_domain",
    provenance: "discovery"
  };
}

export function canonicalOrganizationRelationshipEdge(relationship: {
  relationshipType: string;
  publicSummary: string;
  relatedOrganization: { slug: string; name: string } | null;
}): InternalLinkEdge | null {
  const target = relationship.relatedOrganization;
  if (!target?.slug.trim() || !target.name.trim()) return null;
  const relationshipLabel = relationship.relationshipType
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
  return {
    href: `/organizations/${target.slug}`,
    label: `Explore ${target.name}'s organization profile`,
    detail: `${relationshipLabel}. ${relationship.publicSummary}`,
    targetType: "organization",
    targetSlug: target.slug,
    relationshipKind: "organization_relationship",
    provenance: "direct"
  };
}

const GROUP_LIMITS: Record<ExploreNextGroupKey, number> = {
  organizations: 3,
  context: 3,
  intelligence: 2
};

const GROUP_COPY: Record<ExploreNextGroupKey, Pick<ExploreNextGroup, "title" | "description">> = {
  organizations: {
    title: "Organizations",
    description: "Profiles that provide the strongest reviewed or discovery-led continuation."
  },
  context: {
    title: "Mission and ecosystem paths",
    description: "Follow reviewed needs, mission areas, technologies, programs, domains, regions, or focused map views."
  },
  intelligence: {
    title: "Signals and briefs",
    description: "Continue into connected editorial intelligence; each link identifies whether the path is explicit or derived."
  }
};

export function editorialIntelligenceRelationship(explicit: boolean): Pick<InternalLinkEdge, "relationshipKind" | "provenance"> {
  return explicit
    ? { relationshipKind: "editorial_record", provenance: "editorial" }
    : { relationshipKind: "shared_capability", provenance: "derived" };
}

const RELATIONSHIP_PRIORITY: Record<InternalLinkRelationshipKind, number> = {
  ownership: 1,
  organization_relationship: 1,
  reviewed_mission: 2,
  reviewed_public_need: 2,
  program_participation: 2,
  editorial_record: 3,
  shared_capability: 4,
  shared_mission: 5,
  shared_domain: 5,
  regional_cluster: 5,
  map_path: 5,
  decision_handoff: 5
};

function groupForTarget(targetType: InternalLinkTargetType): ExploreNextGroupKey {
  if (targetType === "organization") return "organizations";
  if (targetType === "signal" || targetType === "brief") return "intelligence";
  return "context";
}

export function buildExploreNextGroups(
  links: InternalLinkEdge[],
  options: { currentHref?: string; maximum?: number } = {}
): ExploreNextGroup[] {
  const maximum = Math.max(0, Math.min(options.maximum ?? 8, 8));
  const currentHref = options.currentHref ? normalizedInternalHref(options.currentHref) : null;
  const currentPath = currentHref ? new URL(currentHref, "https://truenorthmap.ca").pathname : null;
  const seen = new Set<string>();
  const grouped: Record<ExploreNextGroupKey, InternalLinkEdge[]> = {
    organizations: [],
    context: [],
    intelligence: []
  };

  const candidates = links.flatMap((link, index) => {
    const href = normalizedInternalHref(link.href);
    if (!href || new URL(href, "https://truenorthmap.ca").pathname === currentPath) return [];
    return [{ link: { ...link, href }, index }];
  });
  const bestByDestination = new Map<string, { link: InternalLinkEdge; firstIndex: number }>();
  candidates.forEach(({ link, index }) => {
    const destinationKey = `${link.targetType}:${link.targetSlug}`;
    const existing = bestByDestination.get(destinationKey);
    if (!existing) {
      bestByDestination.set(destinationKey, { link, firstIndex: index });
      return;
    }
    if (RELATIONSHIP_PRIORITY[link.relationshipKind] < RELATIONSHIP_PRIORITY[existing.link.relationshipKind]) {
      bestByDestination.set(destinationKey, { link, firstIndex: existing.firstIndex });
    }
  });
  const rankedLinks = [...bestByDestination.values()].sort((left, right) => left.firstIndex - right.firstIndex);

  for (const { link } of rankedLinks) {
    const href = link.href;
    const destinationKey = `${link.targetType}:${link.targetSlug}`;
    if (seen.has(destinationKey)) continue;
    const key = groupForTarget(link.targetType);
    if (grouped[key].length >= GROUP_LIMITS[key]) continue;
    grouped[key].push({ ...link, href });
    seen.add(destinationKey);
  }

  const keys = (["organizations", "context", "intelligence"] as const)
    .filter((key) => grouped[key].length > 0);
  if (!keys.length) return [];

  // Reserve one slot for every populated lane before filling by priority. A
  // rich organization lane must never make a valid context or intelligence
  // lane disappear from the continuation module.
  const effectiveMaximum = Math.min(8, Math.max(maximum, keys.length));
  const selected = new Map<ExploreNextGroupKey, InternalLinkEdge[]>(
    keys.map((key) => [key, grouped[key].slice(0, 1)])
  );
  let remaining = effectiveMaximum - keys.length;
  for (const key of keys) {
    if (remaining <= 0) break;
    const additional = grouped[key].slice(1, 1 + remaining);
    selected.get(key)?.push(...additional);
    remaining -= additional.length;
  }

  return keys.map((key) => ({ key, ...GROUP_COPY[key], links: selected.get(key) ?? [] }));
}

const EDITORIAL_RECORD_PRIORITY: Record<EditorialRecordContinuationInput["recordType"], number> = {
  organization: 0,
  capability: 1,
  demand_requirement: 2,
  mission_area: 3
};

function editorialRecordTargetType(recordType: EditorialRecordContinuationInput["recordType"]): InternalLinkTargetType {
  if (recordType === "organization") return "organization";
  if (recordType === "capability") return "capability";
  if (recordType === "mission_area") return "mission_area";
  return "public_need";
}

function editorialRecordTargetSlug(href: string, fallback: string) {
  const normalized = normalizedInternalHref(href);
  if (!normalized) return fallback;
  return new URL(normalized, "https://truenorthmap.ca").pathname.split("/").filter(Boolean).at(-1) ?? fallback;
}

/** Keep custom Signal and Brief layouts on the shared 3/3 continuation cap. */
export function buildEditorialRecordContinuationLinks(inputs: EditorialRecordContinuationInput[]) {
  const seenRecords = new Set<string>();
  const uniqueInputs = inputs.filter((input) => {
    if (!normalizedInternalHref(input.href)) return false;
    const recordKey = `${input.recordType}:${input.recordId}`;
    if (seenRecords.has(recordKey)) return false;
    seenRecords.add(recordKey);
    return true;
  });
  const edges = uniqueInputs
    .sort((left, right) => EDITORIAL_RECORD_PRIORITY[left.recordType] - EDITORIAL_RECORD_PRIORITY[right.recordType]
      || left.label.localeCompare(right.label)
      || left.recordId.localeCompare(right.recordId))
    .map((input): InternalLinkEdge => ({
      href: input.href,
      label: input.label,
      detail: input.detail,
      targetType: editorialRecordTargetType(input.recordType),
      targetSlug: editorialRecordTargetSlug(input.href, input.recordId),
      relationshipKind: "editorial_record",
      provenance: "editorial"
    }));

  return buildExploreNextGroups(edges).flatMap((group) => group.links);
}

export function internalLinkPositionBand(position: number) {
  if (position <= 3) return "1-3";
  if (position <= 6) return "4-6";
  return "7-8";
}

export function internalLinkMetadata(link: InternalLinkEdge, module: string, position: number) {
  return {
    presentation: `internal_link_graph_v1:${module}`,
    target: link.relationshipKind,
    position_band: internalLinkPositionBand(position),
    destination: `${link.targetType}:${link.targetSlug}`
  } as const;
}

export function normalizedInternalHref(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  try {
    const url = new URL(trimmed, "https://truenorthmap.ca");
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
