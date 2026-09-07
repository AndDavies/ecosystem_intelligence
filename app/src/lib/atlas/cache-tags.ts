export const atlasDiscoveryCacheTag = "atlas-discovery-public";
export const atlasOrganizationGlobalCacheTag = "atlas-organizations-public";

export function atlasOrganizationCacheTag(slug: string) {
  return `atlas-organization:${slug}`;
}

export function atlasCapabilityCacheTag(slug: string) {
  return `atlas-capability:${slug}`;
}
