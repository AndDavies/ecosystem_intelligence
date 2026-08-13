const sharedGovernmentDomainSuffixes = [
  "canada.ca",
  "gc.ca"
] as const;

export interface ResearchIdentityKey {
  slug: string;
  name: string;
  websiteDomain: string | null;
}

export function normalizeResearchIdentityName(value: string) {
  return value.toLocaleLowerCase("en-CA").replace(/[^a-z0-9]+/g, " ").trim();
}

export function isSharedGovernmentDomain(value: string | null | undefined) {
  if (!value) return false;
  const domain = value.toLocaleLowerCase("en-CA").replace(/^www\./, "");
  return sharedGovernmentDomainSuffixes.some((suffix) => domain === suffix || domain.endsWith(`.${suffix}`));
}

/**
 * Domain equality is useful for dedicated organization sites, but shared
 * government hosts identify a publishing platform rather than one entity.
 */
export function researchIdentityMatches(existing: ResearchIdentityKey, incoming: ResearchIdentityKey) {
  if (existing.slug === incoming.slug) return true;
  if (normalizeResearchIdentityName(existing.name) === normalizeResearchIdentityName(incoming.name)) return true;
  if (!incoming.websiteDomain || isSharedGovernmentDomain(incoming.websiteDomain)) return false;
  return existing.websiteDomain === incoming.websiteDomain;
}
