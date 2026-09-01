import { createHash } from "node:crypto";
import { chmod, mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { analyzeRenderedInternalLinkGraph, inspectStoredEditorialLink, internalLinkRouteFamily } from "../src/lib/launch/internal-link-graph";
import { resolveLinkabilityOrganization, type LinkabilityOrganization } from "../src/lib/research/linkability-review";
import { loadScriptEnv } from "./load-env";

loadScriptEnv();

type Row = Record<string, unknown>;
type QueryResult = { data: unknown; error: { message?: string } | null };
type Provenance = "direct" | "editorial" | "derived" | "discovery";
type LinkRole = "contextual" | "global";
type Edge = {
  sourceUrl: string;
  targetUrl: string;
  sourceFamily: string;
  targetFamily: string;
  relationKind: string;
  provenance: Provenance;
  reciprocalExpected: boolean;
  targetIndexability: "canonical" | "filtered-map";
  occurrences: number;
  linkRole: LinkRole;
};
type DuplicateRelationshipGroup = { table: string; key: string; count: number; rowIds: string[] };

const pageSize = 1000;
const baseUrl = (process.env.TNM_LINKS_BASE_URL ?? "https://truenorthmap.ca").replace(/\/$/, "");
const outputRoot = path.resolve(process.env.TNM_LINKS_OUTPUT_DIR ?? "../research/visibility/local/internal-links");

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for the read-only internal-link inventory.`);
  return value;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function readAll(
  client: SupabaseClient,
  table: string,
  columns: string,
  filters: Array<{ column: string; value: string }> = [],
  orderColumn = "id"
) {
  const rows: Row[] = [];
  for (let from = 0; ; from += pageSize) {
    let query = client.from(table).select(columns);
    for (const filter of filters) query = query.eq(filter.column, filter.value);
    query = query.order(orderColumn).range(from, from + pageSize - 1);
    const result = await query as QueryResult;
    if (result.error) throw new Error(`${table}: ${result.error.message ?? "query failed"}`);
    const page = Array.isArray(result.data) ? result.data as Row[] : [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

function decodeXml(value: string) {
  return value.replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&#39;", "'");
}

async function sitemapUrls() {
  const response = await fetch(`${baseUrl}/sitemap.xml`, { headers: { "User-Agent": "TrueNorthMap-Internal-Link-Inventory/1.0" } });
  if (!response.ok) throw new Error(`Sitemap returned HTTP ${response.status}.`);
  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)]
    .map((match) => decodeXml(match[1]).trim())
    .filter((value) => value.startsWith(`${baseUrl}/`) || value === `${baseUrl}/`)
    .sort();
  if (!urls.length) throw new Error("The canonical sitemap did not contain any same-origin URLs.");
  return urls;
}

function canonicalUrl(route: string) {
  return new URL(route, baseUrl).toString();
}

function addEdge(
  edges: Map<string, Edge>,
  edge: Omit<Edge, "sourceFamily" | "targetFamily" | "occurrences" | "linkRole"> & { linkRole?: LinkRole }
) {
  const { linkRole = "contextual", ...edgeData } = edge;
  const key = `${edgeData.sourceUrl}\n${edgeData.targetUrl}\n${edgeData.relationKind}`;
  const existing = edges.get(key);
  if (existing) {
    edges.set(key, { ...existing, occurrences: existing.occurrences + 1 });
    return;
  }
  const value: Edge = {
    ...edgeData,
    linkRole,
    occurrences: 1,
    sourceFamily: internalLinkRouteFamily(edgeData.sourceUrl),
    targetFamily: edgeData.targetIndexability === "filtered-map" ? "map_filter" : internalLinkRouteFamily(edgeData.targetUrl)
  };
  edges.set(key, value);
}

function duplicateRowGroups(
  table: string,
  rows: Row[],
  keyFor: (row: Row) => string
): DuplicateRelationshipGroup[] {
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const key = keyFor(row);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups.entries()].flatMap(([key, groupedRows]) => groupedRows.length > 1
    ? [{ table, key, count: groupedRows.length, rowIds: groupedRows.map((row) => text(row.id)).sort() }]
    : []);
}

function regionSlugForProvince(value: string) {
  if (["Newfoundland and Labrador", "Nova Scotia", "New Brunswick", "Prince Edward Island"].includes(value)) return "atlantic-canada";
  if (value === "Quebec") return "quebec";
  if (value === "Ontario") return "ontario";
  if (["Manitoba", "Saskatchewan", "Alberta"].includes(value)) return "prairies";
  if (value === "British Columbia") return "british-columbia";
  if (["Yukon", "Northwest Territories", "Nunavut"].includes(value)) return "north";
  return null;
}

function recordRoute(type: string, id: string, routes: Map<string, string>) {
  return routes.get(`${type}:${id}`) ?? null;
}

function eligibleGraphCoverage(nodes: string[], edges: Edge[]) {
  const analysis = analyzeRenderedInternalLinkGraph({
    canonicalUrls: nodes,
    occurrences: edges.map((edge) => ({
      sourceUrl: edge.sourceUrl,
      targetUrl: edge.targetUrl,
      label: edge.relationKind,
      role: edge.linkRole,
      module: "eligible_relationship_graph"
    }))
  });
  const detailFamilies = new Set(["organization", "capability", "mission", "public_need", "signal", "brief", "region", "program"]);
  return {
    contextualOrphans: analysis.contextualOrphanCandidates,
    detailContextualOrphans: analysis.contextualOrphanCandidates.filter((url) => detailFamilies.has(internalLinkRouteFamily(url))),
    nearOrphans: analysis.nearOrphanCandidates,
    eligibleRelationshipDeadEnds: analysis.deadEndCandidates,
    clickDepth: analysis.clickDepth,
    pageMetrics: analysis.pageMetrics.map((page) => ({
      url: page.url,
      routeFamily: page.routeFamily,
      eligibleInbound: page.contextualInboundReferrers,
      eligibleOutbound: page.contextualOutboundTargets,
      clickDepth: page.clickDepth
    }))
  };
}

async function atomicPrivateWrite(filePath: string, contents: string) {
  await mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const temporary = `${filePath}.${process.pid}.tmp`;
  await writeFile(temporary, contents, { encoding: "utf8", mode: 0o600 });
  await chmod(temporary, 0o600);
  await rename(temporary, filePath);
}

async function main() {
  const client = createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const [
    sitemap,
    organizations,
    organizationAliases,
    locations,
    organizationLocations,
    capabilities,
    technicalDomains,
    capabilityDomains,
    clusters,
    capabilityClusters,
    missions,
    missionMatches,
    demandSources,
    demands,
    demandMatches,
    programs,
    participations,
    relationships,
    signalEditions,
    signalItems,
    signalLinks,
    briefPages,
    briefLinks
  ] = await Promise.all([
    sitemapUrls(),
    readAll(client, "organizations", "id, slug, name", [{ column: "publication_status", value: "published" }]),
    readAll(client, "organization_aliases", "id, organization_id, alias", [{ column: "publication_status", value: "published" }]),
    readAll(client, "locations", "id, province_territory"),
    readAll(client, "organization_locations", "id, organization_id, location_id, is_primary", [{ column: "publication_status", value: "published" }]),
    readAll(client, "capabilities", "id, organization_id, slug, name", [{ column: "publication_status", value: "published" }]),
    readAll(client, "technical_domains", "id, slug, name", [{ column: "publication_status", value: "published" }]),
    readAll(client, "capability_domains", "capability_id, technical_domain_id", [{ column: "publication_status", value: "published" }], "capability_id"),
    readAll(client, "ecosystem_clusters", "id, slug, name, region_slug", [{ column: "publication_status", value: "published" }]),
    readAll(client, "capability_clusters", "capability_id, ecosystem_cluster_id", [{ column: "publication_status", value: "published" }], "capability_id"),
    readAll(client, "mission_areas", "id, slug, name", [{ column: "publication_status", value: "published" }]),
    readAll(client, "capability_mission_matches", "id, capability_id, mission_area_id", [{ column: "review_status", value: "approved" }, { column: "publication_status", value: "published" }]),
    readAll(client, "demand_sources", "id, source_verified_at, source_verified_by", [{ column: "publication_status", value: "published" }]),
    readAll(client, "demand_requirements", "id, demand_source_id, slug, title", [{ column: "publication_status", value: "published" }]),
    readAll(client, "capability_demand_matches", "id, capability_id, demand_requirement_id", [{ column: "review_status", value: "approved" }, { column: "publication_status", value: "published" }]),
    readAll(client, "programs", "id, slug, name", [{ column: "publication_status", value: "published" }]),
    readAll(client, "program_participations", "id, organization_id, program_id, participation_type, cohort_label", [{ column: "publication_status", value: "published" }]),
    readAll(client, "organization_relationships", "id, organization_id, related_organization_id, related_organization_name, relationship_type, public_summary", [{ column: "publication_status", value: "published" }]),
    readAll(client, "signal_editions", "id, slug", [{ column: "publication_status", value: "published" }]),
    readAll(client, "signal_items", "id, edition_id", [{ column: "publication_status", value: "published" }]),
    readAll(client, "signal_record_links", "id, item_id, record_type, record_id, public_href"),
    readAll(client, "wiki_pages", "id, slug", [{ column: "publication_status", value: "published" }]),
    readAll(client, "wiki_page_record_links", "id, page_id, record_type, record_id")
  ]);

  const sitemapSet = new Set(sitemap);
  const routes = new Map<string, string>();
  for (const row of organizations) routes.set(`organization:${text(row.id)}`, canonicalUrl(`/organizations/${text(row.slug)}`));
  for (const row of capabilities) routes.set(`capability:${text(row.id)}`, canonicalUrl(`/capabilities/${text(row.slug)}`));
  for (const row of missions) routes.set(`mission_area:${text(row.id)}`, canonicalUrl(`/missions/${text(row.slug)}`));
  const verifiedDemandSources = new Set(demandSources.filter((row) => text(row.source_verified_at) && text(row.source_verified_by)).map((row) => text(row.id)));
  for (const row of demands) if (verifiedDemandSources.has(text(row.demand_source_id))) routes.set(`demand_requirement:${text(row.id)}`, canonicalUrl(`/demand/${text(row.slug)}`));

  const edges = new Map<string, Edge>();
  const reciprocal = (sourceUrl: string, targetUrl: string, relationKind: string, provenance: Provenance) => {
    addEdge(edges, { sourceUrl, targetUrl, relationKind, provenance, reciprocalExpected: true, targetIndexability: "canonical" });
    addEdge(edges, { sourceUrl: targetUrl, targetUrl: sourceUrl, relationKind, provenance, reciprocalExpected: true, targetIndexability: "canonical" });
  };
  const homeUrl = canonicalUrl("/");
  for (const route of [
    "/map", "/organizations", "/missions", "/demand", "/regions", "/signals",
    "/north-signal", "/how-it-works", "/methodology", "/about", "/contact", "/privacy", "/terms"
  ]) {
    const targetUrl = canonicalUrl(route);
    if (sitemapSet.has(targetUrl)) addEdge(edges, { sourceUrl: homeUrl, targetUrl, relationKind: "sitewide_navigation", provenance: "direct", reciprocalExpected: false, targetIndexability: "canonical", linkRole: "global" });
  }
  for (const row of capabilities) {
    const organizationUrl = recordRoute("organization", text(row.organization_id), routes);
    const capabilityUrl = recordRoute("capability", text(row.id), routes);
    if (organizationUrl && capabilityUrl) reciprocal(organizationUrl, capabilityUrl, "ownership", "direct");
  }
  const organizationRouteByCapability = new Map(capabilities.map((row) => [text(row.id), recordRoute("organization", text(row.organization_id), routes)]));
  const domainById = new Map(technicalDomains.map((row) => [text(row.id), row]));
  for (const row of capabilityDomains) {
    const capabilityUrl = recordRoute("capability", text(row.capability_id), routes);
    const organizationUrl = organizationRouteByCapability.get(text(row.capability_id));
    const domain = domainById.get(text(row.technical_domain_id));
    if (!domain) continue;
    const targetUrl = canonicalUrl(`/map?domain=${encodeURIComponent(text(domain.slug))}`);
    if (capabilityUrl) addEdge(edges, { sourceUrl: capabilityUrl, targetUrl, relationKind: "technical_domain", provenance: "direct", reciprocalExpected: false, targetIndexability: "filtered-map" });
    if (organizationUrl) addEdge(edges, { sourceUrl: organizationUrl, targetUrl, relationKind: "organization_domain_via_capability", provenance: "derived", reciprocalExpected: false, targetIndexability: "filtered-map" });
  }
  const clusterById = new Map(clusters.map((row) => [text(row.id), row]));
  for (const row of capabilityClusters) {
    const capabilityUrl = recordRoute("capability", text(row.capability_id), routes);
    const organizationUrl = organizationRouteByCapability.get(text(row.capability_id));
    const cluster = clusterById.get(text(row.ecosystem_cluster_id));
    if (!cluster || !capabilityUrl) continue;
    const mapUrl = canonicalUrl("/map");
    addEdge(edges, { sourceUrl: mapUrl, targetUrl: capabilityUrl, relationKind: `cluster_membership:${text(cluster.slug)}`, provenance: "direct", reciprocalExpected: false, targetIndexability: "canonical" });
    if (organizationUrl) addEdge(edges, { sourceUrl: mapUrl, targetUrl: organizationUrl, relationKind: `organization_cluster_via_capability:${text(cluster.slug)}`, provenance: "derived", reciprocalExpected: false, targetIndexability: "canonical" });
    for (const regionSlug of ["canada", text(cluster.region_slug)].filter(Boolean)) {
      addEdge(edges, { sourceUrl: canonicalUrl(`/regions/${regionSlug}`), targetUrl: canonicalUrl(`/map?cluster=${encodeURIComponent(text(cluster.slug))}`), relationKind: "regional_cluster", provenance: "direct", reciprocalExpected: false, targetIndexability: "filtered-map" });
    }
  }
  const locationById = new Map(locations.map((row) => [text(row.id), row]));
  const capabilitiesByOrganization = new Map<string, Row[]>();
  for (const capability of capabilities) {
    const organizationId = text(capability.organization_id);
    capabilitiesByOrganization.set(organizationId, [...(capabilitiesByOrganization.get(organizationId) ?? []), capability]);
  }
  for (const row of organizationLocations.filter((location) => Boolean(location.is_primary))) {
    const organizationId = text(row.organization_id);
    const organizationUrl = recordRoute("organization", organizationId, routes);
    if (!organizationUrl) continue;
    const province = text(locationById.get(text(row.location_id))?.province_territory);
    const regionSlugs = ["canada", regionSlugForProvince(province)].filter((value): value is string => Boolean(value));
    const firstCapability = capabilitiesByOrganization.get(organizationId)?.[0];
    for (const regionSlug of regionSlugs) {
      const regionUrl = canonicalUrl(`/regions/${regionSlug}`);
      addEdge(edges, { sourceUrl: regionUrl, targetUrl: organizationUrl, relationKind: "regional_organization", provenance: "direct", reciprocalExpected: false, targetIndexability: "canonical" });
      const capabilityUrl = firstCapability ? recordRoute("capability", text(firstCapability.id), routes) : null;
      if (capabilityUrl) addEdge(edges, { sourceUrl: regionUrl, targetUrl: capabilityUrl, relationKind: "regional_capability_summary", provenance: "derived", reciprocalExpected: false, targetIndexability: "canonical" });
    }
  }
  const missionRoutesByCapability = new Map<string, string[]>();
  const demandRoutesByCapability = new Map<string, string[]>();
  for (const row of missionMatches) {
    const capabilityUrl = recordRoute("capability", text(row.capability_id), routes);
    const missionUrl = recordRoute("mission_area", text(row.mission_area_id), routes);
    if (capabilityUrl && missionUrl) {
      reciprocal(capabilityUrl, missionUrl, "reviewed_mission", "direct");
      const organizationUrl = organizationRouteByCapability.get(text(row.capability_id));
      if (organizationUrl) reciprocal(organizationUrl, missionUrl, "organization_mission_via_capability", "derived");
      missionRoutesByCapability.set(text(row.capability_id), [...(missionRoutesByCapability.get(text(row.capability_id)) ?? []), missionUrl]);
    }
  }
  for (const row of demandMatches) {
    const capabilityUrl = recordRoute("capability", text(row.capability_id), routes);
    const demandUrl = recordRoute("demand_requirement", text(row.demand_requirement_id), routes);
    if (capabilityUrl && demandUrl) {
      reciprocal(capabilityUrl, demandUrl, "reviewed_public_need", "direct");
      const organizationUrl = organizationRouteByCapability.get(text(row.capability_id));
      if (organizationUrl) reciprocal(organizationUrl, demandUrl, "organization_public_need_via_capability", "derived");
      demandRoutesByCapability.set(text(row.capability_id), [...(demandRoutesByCapability.get(text(row.capability_id)) ?? []), demandUrl]);
    }
  }
  for (const capability of capabilities) {
    const capabilityId = text(capability.id);
    for (const missionUrl of missionRoutesByCapability.get(capabilityId) ?? []) {
      for (const demandUrl of demandRoutesByCapability.get(capabilityId) ?? []) {
        reciprocal(missionUrl, demandUrl, `shared_capability:${capabilityId}`, "derived");
      }
    }
  }
  for (const row of relationships) {
    const sourceUrl = recordRoute("organization", text(row.organization_id), routes);
    const targetUrl = recordRoute("organization", text(row.related_organization_id), routes);
    if (sourceUrl && targetUrl) addEdge(edges, { sourceUrl, targetUrl, relationKind: `organization_relationship:${text(row.relationship_type)}`, provenance: "direct", reciprocalExpected: false, targetIndexability: "canonical" });
  }
  const programById = new Map(programs.map((row) => [text(row.id), row]));
  for (const row of participations) {
    const sourceUrl = recordRoute("organization", text(row.organization_id), routes);
    const program = programById.get(text(row.program_id));
    if (sourceUrl && program) addEdge(edges, { sourceUrl, targetUrl: canonicalUrl(`/map?program=${encodeURIComponent(text(program.slug))}`), relationKind: "program_participation", provenance: "direct", reciprocalExpected: false, targetIndexability: "filtered-map" });
  }
  const signalByItem = new Map(signalItems.map((row) => [text(row.id), text(row.edition_id)]));
  const signalById = new Map(signalEditions.map((row) => [text(row.id), canonicalUrl(`/signals/${text(row.slug)}`)]));
  const signalEditorialLinkFindings: Array<Record<string, string>> = [];
  for (const row of signalLinks) {
    const sourceUrl = signalById.get(signalByItem.get(text(row.item_id)) ?? "");
    const canonicalTargetUrl = recordRoute(text(row.record_type), text(row.record_id), routes);
    const inspection = inspectStoredEditorialLink({
      baseUrl,
      storedHref: text(row.public_href) || null,
      canonicalTargetUrl
    });
    const { storedTargetUrl } = inspection;
    if (!sourceUrl) continue;
    for (const finding of inspection.findings) {
      signalEditorialLinkFindings.push({
        linkId: text(row.id),
        sourceUrl,
        recordType: text(row.record_type),
        recordId: text(row.record_id),
        ...(storedTargetUrl ? { storedTargetUrl } : {}),
        ...(canonicalTargetUrl ? { canonicalTargetUrl } : {}),
        finding
      });
    }
    const exactReciprocal = Boolean(storedTargetUrl && canonicalTargetUrl && storedTargetUrl === canonicalTargetUrl);
    if (exactReciprocal && storedTargetUrl) reciprocal(sourceUrl, storedTargetUrl, "editorial_record", "editorial");
  }
  const briefById = new Map(briefPages.map((row) => [text(row.id), canonicalUrl(`/briefs/${text(row.slug)}`)]));
  for (const row of briefLinks) {
    const sourceUrl = briefById.get(text(row.page_id));
    const targetUrl = recordRoute(text(row.record_type), text(row.record_id), routes);
    if (sourceUrl && targetUrl) reciprocal(sourceUrl, targetUrl, "editorial_record", "editorial");
  }
  const collectionMembership: Array<[string, string, Row[]]> = [
    ["/organizations", "organization", organizations],
    ["/missions", "mission_area", missions],
    ["/demand", "demand_requirement", demands],
    ["/signals", "signal", signalEditions],
    ["/briefs", "brief", briefPages]
  ];
  for (const [collectionRoute, type, rows] of collectionMembership) {
    const sourceUrl = canonicalUrl(collectionRoute);
    for (const row of rows) {
      const targetUrl = type === "signal" ? signalById.get(text(row.id)) : type === "brief" ? briefById.get(text(row.id)) : recordRoute(type, text(row.id), routes);
      if (targetUrl) addEdge(edges, { sourceUrl, targetUrl, relationKind: "collection_membership", provenance: "direct", reciprocalExpected: false, targetIndexability: "canonical" });
    }
  }
  const regionCollectionUrl = canonicalUrl("/regions");
  for (const targetUrl of sitemap.filter((url) => internalLinkRouteFamily(url) === "region")) {
    addEdge(edges, { sourceUrl: regionCollectionUrl, targetUrl, relationKind: "collection_membership", provenance: "direct", reciprocalExpected: false, targetIndexability: "canonical" });
  }

  const eligibleEdges = [...edges.values()].sort((left, right) => left.sourceUrl.localeCompare(right.sourceUrl) || left.targetUrl.localeCompare(right.targetUrl) || left.relationKind.localeCompare(right.relationKind));
  const sourcesMissingFromSitemap = [...new Set(eligibleEdges.filter((edge) => !sitemapSet.has(edge.sourceUrl)).map((edge) => edge.sourceUrl))].sort();
  const targetsMissingFromSitemap = [...new Set(eligibleEdges.filter((edge) => edge.targetIndexability === "canonical" && !sitemapSet.has(edge.targetUrl)).map((edge) => edge.targetUrl))].sort();
  const selfLinks = eligibleEdges.filter((edge) => edge.sourceUrl === edge.targetUrl);
  const multiSupportedEligibleEdges = eligibleEdges.filter((edge) => edge.occurrences > 1);
  const duplicateRelationshipGroups = [
    ...duplicateRowGroups("capability_mission_matches", missionMatches, (row) => `${text(row.capability_id)}:${text(row.mission_area_id)}`),
    ...duplicateRowGroups("capability_demand_matches", demandMatches, (row) => `${text(row.capability_id)}:${text(row.demand_requirement_id)}`),
    ...duplicateRowGroups("program_participations", participations, (row) => `${text(row.organization_id)}:${text(row.program_id)}:${text(row.participation_type)}:${text(row.cohort_label)}`),
    ...duplicateRowGroups("organization_relationships", relationships, (row) => `${text(row.organization_id)}:${text(row.related_organization_id) || `name:${text(row.related_organization_name).toLowerCase()}`}:${text(row.relationship_type)}:${text(row.public_summary)}`),
    ...duplicateRowGroups("signal_record_links", signalLinks, (row) => `${text(row.item_id)}:${text(row.record_type)}:${text(row.record_id)}:${text(row.public_href)}`),
    ...duplicateRowGroups("wiki_page_record_links", briefLinks, (row) => `${text(row.page_id)}:${text(row.record_type)}:${text(row.record_id)}`)
  ].sort((left, right) => left.table.localeCompare(right.table) || left.key.localeCompare(right.key));
  const missingReciprocalLinks = eligibleEdges.filter((edge) => edge.reciprocalExpected && !edges.has(`${edge.targetUrl}\n${edge.sourceUrl}\n${edge.relationKind}`));
  const aliasesByOrganization = new Map<string, string[]>();
  for (const row of organizationAliases) {
    aliasesByOrganization.set(text(row.organization_id), [...(aliasesByOrganization.get(text(row.organization_id)) ?? []), text(row.alias)]);
  }
  const linkabilityOrganizations: LinkabilityOrganization[] = organizations.map((row) => ({
    id: text(row.id),
    slug: text(row.slug),
    name: text(row.name),
    aliases: aliasesByOrganization.get(text(row.id)) ?? []
  }));
  const organizationById = new Map(linkabilityOrganizations.map((organization) => [organization.id, organization]));
  const unresolvedNameOnlyRelationships = relationships.filter((row) => !text(row.related_organization_id)).map((row) => {
    const resolution = resolveLinkabilityOrganization(
      { name: text(row.related_organization_name) },
      linkabilityOrganizations,
      organizationById.get(text(row.organization_id))?.slug
    );
    return {
      id: text(row.id),
      organizationId: text(row.organization_id),
      relatedOrganizationName: text(row.related_organization_name),
      relationshipType: text(row.relationship_type),
      resolution: resolution.status === "canonical_exact" || resolution.status === "exact_alias_suggestion"
        ? {
            status: resolution.status,
            organizationId: resolution.organization.id,
            organizationSlug: resolution.organization.slug,
            organizationName: resolution.organization.name,
            ...(resolution.matchedAlias ? { matchedAlias: resolution.matchedAlias } : {})
          }
        : resolution.status === "ambiguous"
          ? { status: resolution.status, organizationSlugs: resolution.organizations.map((organization) => organization.slug) }
          : resolution.status === "self_reference"
            ? { status: resolution.status, organizationSlug: resolution.organization.slug }
            : { status: resolution.status }
    };
  });
  const exactNameOrAliasSuggestions = unresolvedNameOnlyRelationships.filter((row) => row.resolution.status === "canonical_exact" || row.resolution.status === "exact_alias_suggestion");
  const routeFamilyCounts = new Map<string, number>();
  for (const url of sitemap) {
    const family = internalLinkRouteFamily(url);
    routeFamilyCounts.set(family, (routeFamilyCounts.get(family) ?? 0) + 1);
  }
  const generatedAt = new Date().toISOString();
  const report = {
    schemaVersion: "internal_link_inventory_v1",
    generatedAt,
    baseUrl,
    graphKind: "eligible_relationship_graph",
    graphBoundary: "Published ownership, Mission, Public Need, technical-domain, cluster, regional, program, canonical-organization and explicit editorial relationships eligible for deterministic linking; rendered coverage is measured separately by launch:audit.",
    sitemapDigest: createHash("sha256").update(sitemap.join("\n")).digest("hex"),
    counts: {
      sitemapUrls: sitemap.length,
      eligibleEdges: eligibleEdges.length,
      contextualEligibleEdges: eligibleEdges.filter((edge) => edge.linkRole === "contextual").length,
      globalNavigationEdges: eligibleEdges.filter((edge) => edge.linkRole === "global").length,
      unresolvedNameOnlyRelationships: unresolvedNameOnlyRelationships.length,
      exactNameOrAliasSuggestions: exactNameOrAliasSuggestions.length,
      signalEditorialLinkFindings: signalEditorialLinkFindings.length,
      sourcesMissingFromSitemap: sourcesMissingFromSitemap.length,
      targetsMissingFromSitemap: targetsMissingFromSitemap.length,
      selfLinks: selfLinks.length,
      multiSupportedEligibleEdges: multiSupportedEligibleEdges.length,
      duplicateRelationshipGroups: duplicateRelationshipGroups.length,
      missingReciprocalLinks: missingReciprocalLinks.length
    },
    routeFamilies: [...routeFamilyCounts.entries()].map(([family, pages]) => ({ family, pages })).sort((left, right) => left.family.localeCompare(right.family)),
    nodes: sitemap,
    eligibleEdges,
    unresolvedNameOnlyRelationships,
    exactNameOrAliasSuggestions,
    signalEditorialLinkFindings,
    sourcesMissingFromSitemap,
    targetsMissingFromSitemap,
    selfLinks,
    multiSupportedEligibleEdges,
    duplicateRelationshipGroups,
    missingReciprocalLinks,
    renderedOnlyChecks: [
      "actual anchor labels and generic-label findings",
      "global navigation versus contextual placement",
      "redirect responses and final canonical destinations",
      "links emitted by client or server rendering"
    ],
    coverage: eligibleGraphCoverage(sitemap, eligibleEdges)
  };
  const stamp = generatedAt.replaceAll(/[:.]/g, "-");
  const jsonPath = path.join(outputRoot, "snapshots", `${stamp}.json`);
  const markdownPath = path.join(outputRoot, "reports", `${stamp}.md`);
  const markdown = `# Internal-link inventory\n\nGenerated: ${generatedAt}\n\nThis is the eligible relationship graph from public reviewed records, including ownership, reviewed Mission and Public Need matches, technical domains, clusters, regional membership, programs, canonical organization relationships, and explicit Signal/Brief links. It separately labels the known sitewide navigation paths. It does not claim that links are rendered; use the explicitly authorized full launch audit for rendered-site coverage.\n\n## Counts\n\n- Sitemap URLs: ${report.counts.sitemapUrls}\n- Eligible edges: ${report.counts.eligibleEdges}\n- Contextual eligible edges: ${report.counts.contextualEligibleEdges}\n- Modelled sitewide-navigation edges: ${report.counts.globalNavigationEdges}\n- Detail-page contextual orphan candidates: ${report.coverage.detailContextualOrphans.length}\n- All routes without eligible contextual inbound paths, including navigation roots and utility pages: ${report.coverage.contextualOrphans.length}\n- Near-orphan candidates: ${report.coverage.nearOrphans.length}\n- Eligible-relationship dead-end candidates: ${report.coverage.eligibleRelationshipDeadEnds.length}\n- Name-only organization relationships held for review: ${report.counts.unresolvedNameOnlyRelationships}\n- Unique exact-name or published-alias suggestions requiring review: ${report.counts.exactNameOrAliasSuggestions}\n- Signal editorial-link findings: ${report.counts.signalEditorialLinkFindings}\n- Eligible sources missing from the sitemap: ${report.counts.sourcesMissingFromSitemap}\n- Canonical targets missing from the sitemap: ${report.counts.targetsMissingFromSitemap}\n- Self-links in eligible relationships: ${report.counts.selfLinks}\n- Eligible graph edges with more than one supporting relationship path: ${report.counts.multiSupportedEligibleEdges}\n- Exact duplicate source-relationship groups: ${report.counts.duplicateRelationshipGroups}\n- Missing expected reciprocal relationships: ${report.counts.missingReciprocalLinks}\n\nThe eligible-relationship dead-end diagnostic counts only published relationship paths represented in this database graph. It is not an actual rendered-page dead-end count because deterministic map, Working List, and collection actions are verified only in rendered assurance. Click depth is calculated from the home page, collection pages and primary navigation routes using eligible canonical relationships. In the rendered graph, both contextual anchors and shaped action links count as useful onward paths; breadcrumbs, global navigation, utility links and pagination do not. Anchor wording, rendered placement and redirect behaviour remain rendered-only checks in the explicitly authorized full launch audit. Exact name or alias matches remain private review suggestions and never become public edges automatically. Stored Signal hrefs are compared with their current public record targets so stale, invalid and unpublished editorial paths remain visible rather than being silently reconstructed.\n\n## Local artifacts\n\n- JSON snapshot: ${jsonPath}\n- This summary: ${markdownPath}\n`;
  await Promise.all([atomicPrivateWrite(jsonPath, `${JSON.stringify(report, null, 2)}\n`), atomicPrivateWrite(markdownPath, markdown)]);
  process.stdout.write(`${JSON.stringify({ status: "ok", jsonPath, markdownPath, counts: report.counts }, null, 2)}\n`);
}

void main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
