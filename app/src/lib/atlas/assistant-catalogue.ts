import "server-only";

import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { getAtlasDiscoverySnapshot } from "@/lib/atlas/repository";
import { dossierCitationRows, loadPublicCitationGraph } from "@/lib/atlas/supabase-repository";
import { collectPagedRows, collectPagedRowsByIds } from "@/lib/supabase/pagination";
import { createHash } from "node:crypto";
import type { AtlasCitation, AtlasOrganization, AtlasSnapshot } from "@/types/atlas";

type Row = Record<string, unknown>;
const tags = ["atlas-public", "atlas-discovery-public", "atlas-organizations-public"];
const fields = {
  organizations: "id,legal_name,website_url,defence_posture,dual_use_posture",
  capabilities: "id,organization_id,maturity,commercial_availability,novelty,technology_readiness_level"
} as const;

// Small independently cached pages, not a >2 MB national dossier cache entry.
const qualificationPage = unstable_cache(async (table: keyof typeof fields, from: number, to: number) => {
  const started = performance.now();
  const { data, error } = await createPublicClient().from(table).select(fields[table])
    .eq("publication_status", "published").order("id").range(from, to);
  if (error) throw new Error(`Assistant ${table} qualifications unavailable`);
  console.info(JSON.stringify({ event: "assistant_catalogue_read", table, from, to, startedAt: new Date(Date.now() - (performance.now() - started)).toISOString(), cacheLoader: true, rows: data?.length ?? 0, ms: Math.round(performance.now() - started) }));
  return data as unknown as Row[];
}, ["assistant-qualifications-v1"], { tags, revalidate: 86400 });

const nullable = (value: unknown) => typeof value === "string" ? value : null;

export async function getAssistantCatalogue() {
  const started = performance.now();
  const [discovery, orgRows, capRows] = await Promise.all([
    getAtlasDiscoverySnapshot(),
    collectPagedRows(async (from, to) => ({ data: await qualificationPage("organizations", from, to), error: null }), "assistant identities", 100),
    collectPagedRows(async (from, to) => ({ data: await qualificationPage("capabilities", from, to), error: null }), "assistant qualifications", 100)
  ]);
  const orgs = new Map(orgRows.map(row => [row.id, row]));
  const caps = new Map(capRows.map(row => [row.id, row]));
  if (discovery.organizations.some(org => !orgs.has(org.id) || org.capabilities.some(cap => caps.get(cap.id)?.organization_id !== org.id))) {
    throw new Error("Assistant catalogue publication changed; retry after cache refresh");
  }
  if (orgs.size !== orgRows.length || caps.size !== capRows.length || orgs.size !== discovery.organizations.length || caps.size !== discovery.organizations.flatMap(o => o.capabilities).length) {
    throw new Error("Assistant catalogue publication changed; retry after cache refresh");
  }
  const organizations = discovery.organizations.map(org => {
    const row = orgs.get(org.id)!;
    return { ...org, legalName: nullable(row.legal_name), websiteUrl: nullable(row.website_url),
      defencePosture: nullable(row.defence_posture), dualUsePosture: nullable(row.dual_use_posture),
      capabilities: org.capabilities.filter(cap => caps.get(cap.id)?.organization_id === org.id).map(cap => {
        const row = caps.get(cap.id)!;
        return { ...cap, maturity: nullable(row.maturity), commercialAvailability: nullable(row.commercial_availability),
          novelty: Array.isArray(row.novelty) ? row.novelty.filter((v): v is string => typeof v === "string") : [],
          technologyReadinessLevel: typeof row.technology_readiness_level === "number" ? row.technology_readiness_level : null };
      }).sort((a,b) => a.id.localeCompare(b.id)) };
  }).sort((a,b) => a.id.localeCompare(b.id));
  // Need relationships stay on each capability; unrelated full need dossiers do not enter Ask.
  const snapshot: AtlasSnapshot = { ...discovery, organizations, demandRequirements: [] };
  const revision = createHash("sha256").update(JSON.stringify({ organizations, missions: snapshot.missionAreas, domains: snapshot.technicalDomains })).digest("hex");
  return { snapshot, revision, latencyMs: Math.round(performance.now() - started) };
}

// Batch only the final selected organizations and offerings. Public admission
// precedes privileged evidence hydration; no unreviewed targets enter the graph.
export async function hydrateAssistantOrganizations(organizations: AtlasOrganization[]) {
  if (!organizations.length) return [];
  const started = performance.now();
  const client = createPublicClient();
  const signal = AbortSignal.timeout(12_000);
  const orgIds = organizations.map(o => o.id);
  const capIds = organizations.flatMap(o => o.capabilities.map(c => c.id));
  const read = (table: string, ids: string[], columns: string) => collectPagedRowsByIds(ids, (batch, from, to) => client.from(table)
    .select(columns).in("id", batch).eq("publication_status", "published").order("id").range(from, to).abortSignal(signal), `assistant admitted ${table}`);
  const [orgRows, capRows] = await Promise.all([read("organizations", orgIds, "id"), read("capabilities", capIds, "id,organization_id")]);
  const admittedOrgs = new Set(orgRows.map(row => String((row as unknown as Row).id)));
  const owners = new Map(capRows.map(row => { const r = row as unknown as Row; return [String(r.id), String(r.organization_id)]; }));
  const admitted = organizations.filter(o => admittedOrgs.has(o.id)).map(o => ({ ...o, capabilities: o.capabilities.filter(c => owners.get(c.id) === o.id) }));
  const graph = await loadPublicCitationGraph([
    { entityType: "organization", ids: admitted.map(o => o.id) },
    { entityType: "capability", ids: admitted.flatMap(o => o.capabilities.map(c => c.id)) }
  ], [], { signal, fieldsByEntity: {
    organization: ["name", "legal_name", "entity_kind", "description", "operating_context", "canadian_footprint", "defence_posture", "dual_use_posture", "commercial_status", "primary_location", "primary_location.city", "primary_location.provinceterritory", "primary_location.countrycode", "profileData.mandate", "profileData.operatingModel", "profileData.qualityCertification", "profileData.securityPosture"],
    capability: ["name", "summary", "core_features", "defence_applications", "maturity", "commercial_availability", "technology_readiness_level", "update_child", "add_child"]
  } });
  const citations = new Map<string, AtlasCitation[]>();
  for (const { citation, evidence, source } of dossierCitationRows(graph).sort((a,b) => String(a.citation.id).localeCompare(String(b.citation.id)))) {
    if (typeof source.canonical_url !== "string") continue;
    const key = `${citation.entity_type}:${citation.entity_id}`;
    const items = citations.get(key) ?? [];
    items.push({ id: String(citation.id), fieldName: String(citation.field_name), sourceTitle: String(source.title),
      sourceUrl: source.canonical_url, publisher: String(source.publisher), sourceType: String(source.source_type),
      excerpt: String(evidence.excerpt), publishedAt: nullable(source.published_at) });
    citations.set(key, items);
  }
  console.info(JSON.stringify({ event: "assistant_evidence_read", scope: "final_offerings", organizations: admitted.length,
    capabilities: owners.size, citations: graph.citations.length, ms: Math.round(performance.now() - started) }));
  return admitted.map(o => ({ ...o, citations: citations.get(`organization:${o.id}`) ?? [], capabilities: o.capabilities.map(c => ({ ...c,
    citations: citations.get(`capability:${c.id}`) ?? [],
    // Reviewed alignments can guide discovery but are not proof of supplier functionality.
    missionMatches: c.missionMatches.map(m => ({ ...m, citations: [] })),
    demandMatches: c.demandMatches.map(m => ({ ...m, citations: [] }))
  })) }));
}
