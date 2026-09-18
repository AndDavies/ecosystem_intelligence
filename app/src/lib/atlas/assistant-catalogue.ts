import "server-only";

import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { getAtlasDiscoverySnapshot } from "@/lib/atlas/repository";
import { dossierCitationRows, loadPublicCitationGraph } from "@/lib/atlas/supabase-repository";
import { collectPagedRows, collectPagedRowsByIds } from "@/lib/supabase/pagination";
import { boundedMap } from "@/lib/research/bounded-map";
import { jevFingerprint } from "@/lib/atlas/assistant-jev";
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
  console.info(JSON.stringify({ event: "assistant_catalogue_read", table, rows: data?.length ?? 0, ms: Math.round(performance.now() - started) }));
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
  const revision = jevFingerprint({ organizations, missions: snapshot.missionAreas, domains: snapshot.technicalDomains });
  return { snapshot, revision, latencyMs: Math.round(performance.now() - started) };
}

// Re-admit IDs with the public client before privileged citation hydration. Cache
// only approved public evidence; publication/source changes invalidate atlas-public.
const evidenceForOrganization = unstable_cache(async (organizationId: string) => {
  const started = performance.now();
  const client = createPublicClient();
  const [{ data: org, error: orgError }, caps] = await Promise.all([
    client.from("organizations").select("id").eq("id", organizationId).eq("publication_status", "published").maybeSingle(),
    collectPagedRows(async (from,to) => await client.from("capabilities").select("id").eq("organization_id", organizationId).eq("publication_status", "published").order("id").range(from,to), "assistant admitted capabilities")
  ]);
  if (orgError) throw new Error("Assistant evidence admission failed");
  if (!org) return null;
  const ids = (caps ?? []).map(cap => cap.id as string);
  const matchRows = async (table: string) => collectPagedRowsByIds(ids, async (batch,from,to) => {
    const result = await client.from(table).select("id,capability_id").in("capability_id", batch)
      .eq("review_status", "approved").eq("publication_status", "published").order("id").range(from,to);
    return { data: result.data ?? [], error: result.error };
  }, table);
  const [missions, needs] = await Promise.all([matchRows("capability_mission_matches"), matchRows("capability_demand_matches")]);
  const graph = await loadPublicCitationGraph([
    { entityType: "organization", ids: [organizationId] }, { entityType: "capability", ids },
    { entityType: "capability_mission_match", ids: missions.map(row => String(row.id)) },
    { entityType: "capability_demand_match", ids: needs.map(row => String(row.id)) }
  ], []);
  const citations: Record<string, AtlasCitation[]> = {};
  for (const { citation, evidence, source } of dossierCitationRows(graph).sort((a,b) => String(a.citation.id).localeCompare(String(b.citation.id)))) {
    if (typeof source.canonical_url !== "string") continue;
    const key = `${citation.entity_type}:${citation.entity_id}`;
    (citations[key] ??= []).push({ id: String(citation.id), fieldName: String(citation.field_name),
      sourceTitle: String(source.title), sourceUrl: source.canonical_url, publisher: String(source.publisher),
      sourceType: String(source.source_type), excerpt: String(evidence.excerpt), publishedAt: nullable(source.published_at) });
  }
  console.info(JSON.stringify({ event: "assistant_evidence_read", organizationId, capabilities: ids.length, citations: graph.citations.length, ms: Math.round(performance.now() - started) }));
  return { ids, missionIds: missions.map(row => String(row.id)), needIds: needs.map(row => String(row.id)), citations };
}, ["assistant-public-evidence-v1"], { tags, revalidate: 86400 });

export async function hydrateAssistantOrganizations(organizations: AtlasOrganization[]) {
  const hydrated = await boundedMap(organizations, 4, async org => {
    const graph = await evidenceForOrganization(org.id);
    if (!graph) return null;
    const get = (kind: string, id: string) => graph.citations[`${kind}:${id}`] ?? [];
    return { ...org, citations: get("organization", org.id), capabilities: org.capabilities.filter(cap => graph.ids.includes(cap.id)).map(cap => ({
      ...cap, citations: get("capability", cap.id),
      missionMatches: cap.missionMatches.filter(match => graph.missionIds.includes(match.id)).map(match => ({ ...match, citations: get("capability_mission_match", match.id) })),
      demandMatches: cap.demandMatches.filter(match => graph.needIds.includes(match.id)).map(match => ({ ...match, citations: get("capability_demand_match", match.id) }))
    })) };
  });
  return hydrated.filter((org): org is AtlasOrganization => org !== null);
}
