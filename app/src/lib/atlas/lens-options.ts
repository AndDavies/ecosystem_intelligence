import { buildOrganizationTypeOptions } from "@/lib/atlas/organization-type-filters";
export { publicOrganizationTypes } from "@/lib/atlas/organization-type-filters";
import type {
  AtlasDiscoverySnapshot,
  AtlasExplorerDemandOption,
  AtlasExplorerFilterOption,
  AtlasExplorerTypeOption
} from "@/types/atlas";

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

  for (const organization of snapshot.organizations) {
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
    organizationTypes: buildOrganizationTypeOptions(snapshot.organizations)
  };
}
