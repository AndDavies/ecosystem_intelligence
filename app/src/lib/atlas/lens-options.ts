import { organizationKindLabel } from "@/lib/atlas/presentation";
import type {
  AtlasDiscoverySnapshot,
  AtlasExplorerDemandOption,
  AtlasExplorerFilterOption,
  AtlasExplorerTypeOption
} from "@/types/atlas";

/**
 * Organization kinds surfaced on public discovery controls. Internal or
 * administrative kinds never become public lens options.
 */
export const publicOrganizationTypes = new Set([
  "company",
  "accelerator",
  "incubator",
  "research_test_centre",
  "investor_funder",
  "ecosystem_organization",
  "government_innovation_office"
]);

export interface AtlasLensOptionSets {
  missionAreas: AtlasExplorerFilterOption[];
  demandRequirements: AtlasExplorerDemandOption[];
  technicalDomains: AtlasExplorerFilterOption[];
  organizationTypes: AtlasExplorerTypeOption[];
}

function addOrganization(index: Map<string, Set<string>>, key: string, organizationId: string) {
  const existing = index.get(key);
  if (existing) existing.add(organizationId);
  else index.set(key, new Set([organizationId]));
}

/**
 * Builds the four guided-lens option sets with live organization counts from
 * the already-loaded discovery snapshot. Counts are distinct published
 * organizations per lens value, matching what selecting the lens shows.
 */
export function buildAtlasLensOptions(
  snapshot: Pick<AtlasDiscoverySnapshot, "organizations" | "missionAreas" | "demandRequirements" | "technicalDomains">
): AtlasLensOptionSets {
  const missionIndex = new Map<string, Set<string>>();
  const demandIndex = new Map<string, Set<string>>();
  const domainIndex = new Map<string, Set<string>>();
  const typeCounts = new Map<string, number>();

  for (const organization of snapshot.organizations) {
    typeCounts.set(organization.entityKind, (typeCounts.get(organization.entityKind) ?? 0) + 1);
    for (const capability of organization.capabilities) {
      for (const match of capability.missionMatches) addOrganization(missionIndex, match.missionArea.slug, organization.id);
      for (const match of capability.demandMatches) addOrganization(demandIndex, match.demandSlug, organization.id);
      for (const domain of capability.technicalDomains) addOrganization(domainIndex, domain.slug, organization.id);
    }
  }

  return {
    missionAreas: snapshot.missionAreas.map(({ slug, name }) => ({ slug, name, count: missionIndex.get(slug)?.size ?? 0 })),
    demandRequirements: snapshot.demandRequirements.map(({ slug, title }) => ({ slug, title, count: demandIndex.get(slug)?.size ?? 0 })),
    technicalDomains: snapshot.technicalDomains.map(({ slug, name }) => ({ slug, name, count: domainIndex.get(slug)?.size ?? 0 })),
    organizationTypes: Array.from(publicOrganizationTypes)
      .filter((kind) => (typeCounts.get(kind) ?? 0) > 0)
      .map((kind) => ({ value: kind, label: organizationKindLabel(kind, true), count: typeCounts.get(kind) ?? 0 }))
  };
}
