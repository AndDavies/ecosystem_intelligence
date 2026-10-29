import { safeMapReturn } from "@/lib/seo/navigation-urls";
import { projectAtlasExplorerOrganization, projectAtlasMapOrganization } from "@/lib/atlas/explorer-projection";
import { organizationHasCanadianMapLocation } from "@/lib/atlas/geography";
import type { AtlasDiscoveryResult, AtlasExplorerQueryResult, AtlasQuery, AtlasOrganization } from "@/types/atlas";

/** Project only the offering actually selected in the verified Ask response. */
export function projectDiscovery(discovery: AtlasDiscoveryResult, base: AtlasExplorerQueryResult): AtlasExplorerQueryResult {
  const organizations = discovery.organizations ?? [];
  const matches = new Map(discovery.assistant?.matches.map(match => [match.organizationId, match]));
  const projected = organizations.map(organization => {
    const match = matches.get(organization.id);
    const projected = projectAtlasExplorerOrganization(organization, { query: discovery.query }, new Set(match?.capabilityId ? [match.capabilityId] : []));
    const cited = new Set(match?.supportPoints.flatMap(point => point.citationIds));
    const citations = [...organization.citations, ...organization.capabilities.flatMap(capability => [...capability.citations, ...capability.missionMatches.flatMap(connection => connection.citations), ...capability.demandMatches.flatMap(connection => connection.citations)])].filter(citation => cited.has(citation.id));
    return { ...projected, citations: [...new Map(citations.map(citation => [citation.id, { id: citation.id, sourceTitle: citation.sourceTitle, sourceUrl: citation.sourceUrl, publisher: citation.publisher }])).values()],
      ...(match ? { discoveryAssessment: { supportPoints: match.supportPoints, limitations: match.limitations, fitLevel: match.fitLevel, evidenceLevel: match.evidenceLevel } } : {}) };
  });
  return { ...base, organizations: projected, mapOrganizations: organizations.filter(organizationHasCanadianMapLocation).map(projectAtlasMapOrganization),
    total: projected.length, page: 1, pageSize: Math.max(1, projected.length), appliedFilters: discovery.filterChips, hasMore: false, nextPage: null };
}

export function discoveryProfileHref(organization: { slug: string; id?: string }, capability: { slug: string; id?: string } | null, evidence = false, returnTo?: string) {
  const path = capability ? `/capabilities/${capability.slug}` : `/organizations/${organization.slug}`;
  const context = new URL(safeMapReturn(returnTo), "https://truenorthmap.ca");
  const state = new URLSearchParams(context.hash.slice(2));
  if (organization.id) state.set("selected", organization.id);
  if (capability?.id) state.set("selectedCapability", capability.id); else state.delete("selectedCapability");
  const query = returnTo ? `?returnTo=${encodeURIComponent(`/map#?${state}`)}` : "";
  return `${path}${query}${evidence ? capability ? "#evidence" : "#sources" : ""}`;
}

const prefix = "tnm-discovery-v1:";
const maxAge = 30 * 60 * 1000;

/** Tab-local, short-lived recovery; questions never enter analytics or server URLs. */
export function rememberDiscovery(discovery: AtlasDiscoveryResult): string | undefined {
  try {
    const keys = Object.keys(sessionStorage).filter(key => key.startsWith(prefix));
    for (const key of keys.slice(0, Math.max(0, keys.length - 4))) sessionStorage.removeItem(key);
    const id = crypto.randomUUID();
    sessionStorage.setItem(`${prefix}${id}`, JSON.stringify({ expires: Date.now() + maxAge, discovery }));
    return id;
  } catch { return undefined; }
}

export function recallDiscovery(query: AtlasQuery): AtlasDiscoveryResult | null {
  if (!query.discovery) return null;
  try {
    const key = `${prefix}${query.discovery}`;
    const saved = JSON.parse(sessionStorage.getItem(key) ?? "null");
    if (!saved || saved.expires < Date.now()) { sessionStorage.removeItem(key); return null; }
    if (saved.discovery?.query !== query.query || !saved.discovery.assistant || !Array.isArray(saved.discovery.organizations)) return null;
    return saved.discovery as AtlasDiscoveryResult;
  } catch { return null; }
}

/** Evidence identity is independent of query order, media delivery and JSON key order. */
export function discoveryEvidenceSignature(organization: AtlasOrganization) {
  // Conservatively invalidate on any public-record change, including confidence,
  // readiness, geography, reviewed relationships and their qualifications.
  function canonical(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(canonical).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
    return value;
  }
  return JSON.stringify(canonical(organization));
}
