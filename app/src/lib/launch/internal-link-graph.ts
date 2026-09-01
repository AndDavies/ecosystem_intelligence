export type RenderedInternalLinkRole =
  | "contextual"
  | "global"
  | "breadcrumb"
  | "utility"
  | "pagination"
  | "action"
  | "unclassified";

export type RenderedInternalLinkOccurrence = {
  sourceUrl: string;
  targetUrl: string;
  label: string;
  role: RenderedInternalLinkRole;
  module?: string;
};

export type InternalLinkGraphAnalysis = ReturnType<typeof analyzeRenderedInternalLinkGraph>;

const detailFamilyPattern = /^(organization|capability|mission|public_need|signal|brief|region|program)$/;

export function internalLinkRouteFamily(value: string) {
  const pathname = new URL(value, "https://truenorthmap.ca").pathname;
  if (pathname === "/") return "home";
  const segments = pathname.split("/").filter(Boolean);
  if (!segments.length) return "home";
  const [root, slug] = segments;
  const family = root === "organizations" ? "organization"
    : root === "capabilities" ? "capability"
      : root === "missions" ? "mission"
        : root === "demand" ? "public_need"
          : root === "signals" ? "signal"
            : root === "briefs" ? "brief"
              : root === "regions" ? "region"
                : root === "programs" ? "program"
                  : root;
  if (slug) return family;
  return ["organization", "capability", "mission", "public_need", "signal", "brief", "region", "program"].includes(family)
    ? `${family}_collection`
    : family;
}

export function isGenericInternalAnchor(label: string) {
  const normalized = label.replace(/\s+/g, " ").trim().toLowerCase();
  return !normalized || /^(?:click here|here|learn more|read more|more|view|open|details|link|read (?:the )?(?:(?:latest|related) )?(?:article|signal|brief|edition)|(?:explore|view|open) (?:the )?(?:(?:organization|company|technology) )?profile)$/.test(normalized);
}

export type StoredEditorialLinkFinding =
  | "missing_public_href"
  | "invalid_or_external_public_href"
  | "target_not_public_or_not_canonical"
  | "stored_href_differs_from_canonical_target";

export function inspectStoredEditorialLink({
  baseUrl,
  storedHref,
  canonicalTargetUrl
}: {
  baseUrl: string;
  storedHref: string | null;
  canonicalTargetUrl: string | null;
}) {
  let storedTargetUrl: string | null = null;
  if (storedHref?.trim()) {
    try {
      const url = new URL(storedHref, baseUrl);
      if (url.origin === new URL(baseUrl).origin) {
        url.hash = "";
        storedTargetUrl = url.toString();
      }
    } catch {
      storedTargetUrl = null;
    }
  }
  const findings: StoredEditorialLinkFinding[] = [];
  if (!storedTargetUrl) findings.push(storedHref?.trim() ? "invalid_or_external_public_href" : "missing_public_href");
  if (!canonicalTargetUrl) findings.push("target_not_public_or_not_canonical");
  if (storedTargetUrl && canonicalTargetUrl && storedTargetUrl !== canonicalTargetUrl) findings.push("stored_href_differs_from_canonical_target");
  return { storedTargetUrl, findings };
}

function uniqueSorted(values: Iterable<string>) {
  return [...new Set(values)].sort();
}

function pathKey(value: string) {
  const url = new URL(value, "https://truenorthmap.ca");
  return `${url.origin}${url.pathname}`;
}

function isUsefulOnwardRole(role: RenderedInternalLinkRole) {
  return role === "contextual" || role === "action";
}

export function analyzeRenderedInternalLinkGraph({
  canonicalUrls,
  occurrences,
  entryUrls = []
}: {
  canonicalUrls: string[];
  occurrences: RenderedInternalLinkOccurrence[];
  entryUrls?: string[];
}) {
  const canonical = uniqueSorted(canonicalUrls.map(pathKey));
  const canonicalSet = new Set(canonical);
  const normalizedOccurrences = occurrences
    .map((occurrence) => ({ ...occurrence, sourceUrl: pathKey(occurrence.sourceUrl), targetUrl: pathKey(occurrence.targetUrl) }))
    .filter((occurrence) => canonicalSet.has(occurrence.sourceUrl) && canonicalSet.has(occurrence.targetUrl))
    .sort((left, right) => left.sourceUrl.localeCompare(right.sourceUrl)
      || left.targetUrl.localeCompare(right.targetUrl)
      || left.role.localeCompare(right.role)
      || left.label.localeCompare(right.label));

  const inbound = new Map(canonical.map((url) => [url, new Set<string>()]));
  const contextualInbound = new Map(canonical.map((url) => [url, new Set<string>()]));
  const contextualOutbound = new Map(canonical.map((url) => [url, new Set<string>()]));
  const adjacency = new Map(canonical.map((url) => [url, new Set<string>()]));
  const edgeInventory = new Map<string, { sourceUrl: string; targetUrl: string; role: RenderedInternalLinkRole; module?: string; labels: Set<string>; occurrences: number }>();
  for (const occurrence of normalizedOccurrences) {
    const isSelfLink = occurrence.sourceUrl === occurrence.targetUrl;
    if (!isSelfLink) {
      inbound.get(occurrence.targetUrl)?.add(occurrence.sourceUrl);
      adjacency.get(occurrence.sourceUrl)?.add(occurrence.targetUrl);
    }
    // A shaped CTA remains a useful contextual continuation even though its
    // rendered role is `action`. Breadcrumbs, global navigation, utility links,
    // and pagination stay outside the contextual degree calculation.
    if (isUsefulOnwardRole(occurrence.role) && !isSelfLink) {
      contextualInbound.get(occurrence.targetUrl)?.add(occurrence.sourceUrl);
      contextualOutbound.get(occurrence.sourceUrl)?.add(occurrence.targetUrl);
    }
    const edgeKey = `${occurrence.sourceUrl}\n${occurrence.targetUrl}\n${occurrence.role}\n${occurrence.module ?? ""}`;
    const edge = edgeInventory.get(edgeKey) ?? {
      sourceUrl: occurrence.sourceUrl,
      targetUrl: occurrence.targetUrl,
      role: occurrence.role,
      module: occurrence.module,
      labels: new Set<string>(),
      occurrences: 0
    };
    if (occurrence.label) edge.labels.add(occurrence.label);
    edge.occurrences += 1;
    edgeInventory.set(edgeKey, edge);
  }

  const roots = uniqueSorted((entryUrls.length ? entryUrls : canonical.filter((url) => {
    const family = internalLinkRouteFamily(url);
    return family === "home"
      || family.endsWith("_collection")
      || ["map", "how-it-works", "about"].includes(family);
  })).map(pathKey)).filter((url) => canonicalSet.has(url));
  const clickDepth = new Map<string, number>();
  const queue = roots.map((url) => ({ url, depth: 0 }));
  for (const root of roots) clickDepth.set(root, 0);
  while (queue.length) {
    const current = queue.shift();
    if (!current) break;
    for (const target of adjacency.get(current.url) ?? []) {
      if (clickDepth.has(target)) continue;
      clickDepth.set(target, current.depth + 1);
      queue.push({ url: target, depth: current.depth + 1 });
    }
  }

  const routeFamilyStats = [...new Set(canonical.map(internalLinkRouteFamily))].sort().map((family) => {
    const urls = canonical.filter((url) => internalLinkRouteFamily(url) === family);
    return {
      family,
      pages: urls.length,
      contextualOrphans: urls.filter((url) => (contextualInbound.get(url)?.size ?? 0) === 0).length,
      deadEnds: urls.filter((url) => detailFamilyPattern.test(family) && (contextualOutbound.get(url)?.size ?? 0) < 2).length
    };
  });

  return {
    schemaVersion: "rendered_internal_link_graph_v1" as const,
    counts: {
      canonicalPages: canonical.length,
      linkOccurrences: normalizedOccurrences.length,
      uniqueEdges: uniqueSorted(normalizedOccurrences.map((item) => `${item.sourceUrl}\n${item.targetUrl}`)).length
    },
    unlinkedSitemapUrls: canonical.filter((url) => (inbound.get(url)?.size ?? 0) === 0),
    contextualOrphanCandidates: canonical.filter((url) => (contextualInbound.get(url)?.size ?? 0) === 0),
    nearOrphanCandidates: canonical.filter((url) => (contextualInbound.get(url)?.size ?? 0) === 1),
    deadEndCandidates: canonical.filter((url) => detailFamilyPattern.test(internalLinkRouteFamily(url)) && (contextualOutbound.get(url)?.size ?? 0) < 2),
    selfLinks: normalizedOccurrences.filter((item) => item.sourceUrl === item.targetUrl),
    edges: [...edgeInventory.values()].map((edge) => ({
      sourceUrl: edge.sourceUrl,
      targetUrl: edge.targetUrl,
      sourceFamily: internalLinkRouteFamily(edge.sourceUrl),
      targetFamily: internalLinkRouteFamily(edge.targetUrl),
      role: edge.role,
      module: edge.module,
      labels: [...edge.labels].sort(),
      occurrences: edge.occurrences
    })),
    duplicateEdges: [...edgeInventory.values()].filter((edge) => edge.occurrences > 1).map((edge) => ({
      sourceUrl: edge.sourceUrl,
      targetUrl: edge.targetUrl,
      role: edge.role,
      module: edge.module,
      count: edge.occurrences
    })),
    genericAnchorLinks: normalizedOccurrences.filter((item) => isGenericInternalAnchor(item.label)),
    pageMetrics: canonical.map((url) => ({
      url,
      routeFamily: internalLinkRouteFamily(url),
      inboundReferrers: inbound.get(url)?.size ?? 0,
      contextualInboundReferrers: contextualInbound.get(url)?.size ?? 0,
      contextualOutboundTargets: contextualOutbound.get(url)?.size ?? 0,
      clickDepth: clickDepth.get(url) ?? null
    })),
    clickDepth: canonical.map((url) => ({ url, depth: clickDepth.get(url) ?? null })),
    routeFamilyStats
  };
}
