import { createHash } from "node:crypto";
import { z } from "zod";
import { getAtlasUser } from "@/lib/atlas/auth";
import { isAtlasAdminOwner } from "@/lib/atlas/admin-owner";
import { jevAccess } from "@/lib/atlas/assistant-jev";
import { getAssistantCatalogue } from "@/lib/atlas/assistant-catalogue";
import { selectCachedWithJev } from "@/lib/atlas/assistant-selection-cache";
import { retrieveAssistantPool } from "@/lib/atlas/assistant-retrieval";
import { matchingAtlasOrganizations } from "@/lib/atlas/repository";
import { atlasQueryFromSearchParams } from "@/lib/atlas/query-params";
import { assistantSubjectFingerprint, privateJson } from "@/lib/product-insights/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import type { AtlasLookupSuggestion } from "@/types/atlas";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const schema = z.object({ query: z.string().trim().min(3).max(120).refine(q => !q.includes("\0")), filters: z.string().max(2048).default("") });
export async function GET() {
  const user = await getAtlasUser().catch(() => null);
  return privateJson({ available: jevAccess(isAtlasAdminOwner(user)) === null });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return privateJson({ error: "Same-origin requests only." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return privateJson({ error: "Enter a need between 3 and 120 characters." }, { status: 400 });
  const user = await getAtlasUser().catch(() => null);
  const owner = isAtlasAdminOwner(user);
  if (jevAccess(owner)) return privateJson({ error: "Meaning-based search is not enabled for this account." }, { status: 403 });
  // The uncapped, authenticated owner pilot remains distinct from public traffic.
  if (!(owner && process.env.ASK_JEV_MODE === "owner-pilot")) {
    if (!hasSupabaseAdminEnv()) return privateJson({ error: "Search is temporarily unavailable." }, { status: 503 });
    const subject = assistantSubjectFingerprint(request,user?.id);
    for (const [period, limit] of [[Math.floor(Date.now()/60000), 10], [Math.floor(Date.now()/86400000), 100]]) {
      const hash = createHash("sha256").update(`semantic|${limit}|${period}|${subject}`).digest("hex");
      const { data, error } = await createAdminClient().rpc("reserve_assistant_request", { p_subject_hash: hash, p_limit: limit });
      if (error || data?.[0]?.allowed !== true) return privateJson({ error: "Please pause before another meaning-based search. Direct search is still available." }, { status: error ? 503 : 429 });
    }
  }
  const started = performance.now();
  try {
    const { snapshot, revision, latencyMs } = await getAssistantCatalogue();
    const filters = atlasQueryFromSearchParams(new URLSearchParams(parsed.data.filters));
    const eligible = matchingAtlasOrganizations(snapshot, { ...filters, query: undefined, selected: undefined });
    const filtered = { ...snapshot, organizations: eligible };
    const pool = retrieveAssistantPool(filtered, parsed.data.query, [], 100);
    const result = await selectCachedWithJev({ snapshot: { ...filtered, organizations: pool }, query: parsed.data.query, priorTurns: [], baseline: pool, isOwner: owner, relevanceOnly: true });
    const suggestions: AtlasLookupSuggestion[] = result.metrics.fallbackReason ? [] : result.organizations.filter(org => (result.judgments.find(j => j.organizationId===org.id)?.score ?? 0) >= 1.5).slice(0,5).map(org => {
      const cap = org.capabilities.find(cap => cap.id === result.judgments.find(j => j.organizationId===org.id)?.capabilityId);
      return { kind: "organization", id: org.id, slug: org.slug, label: org.name,
        secondary: cap?.name ?? org.description, href: `/organizations/${org.slug}` };
    });
    const domains = [...new Set(result.organizations.slice(0,5).flatMap(org => {
      const winner = result.judgments.find(j => j.organizationId===org.id);
      return org.capabilities.filter(cap => cap.id===winner?.capabilityId).flatMap(cap => cap.technicalDomains.map(d => d.slug));
    }))].slice(0,3);
    const areas: AtlasLookupSuggestion[] = suggestions.length ? domains.flatMap(slug => {
      const domain = snapshot.technicalDomains.find(d => d.slug===slug);
      return domain ? [{ kind: "technical_domain" as const, id: domain.id, slug, label: domain.name, secondary: "Optional technology-area filter", href: `/map?domain=${encodeURIComponent(slug)}`, filter: { key: "domain" as const, value: slug } }] : [];
    }) : [];
    const metrics = { event: "semantic_lookup_completed", catalogueRevision: revision, eligibleCount: eligible.length,
      poolCount: pool.length, snapshotMs: latencyMs, requestLatencyMs: Math.round(performance.now()-started), selection: result.metrics };
    console.info(JSON.stringify(metrics));
    return privateJson({ suggestions, areas, coverage: { eligible: eligible.length, reviewed: pool.length },
      error: result.metrics.fallbackReason ? "Meaning-based search is unavailable. Direct search still works." : null });
  } catch {
    return privateJson({ error: "Meaning-based search is temporarily unavailable. Direct search still works." }, { status: 503 });
  }
}
