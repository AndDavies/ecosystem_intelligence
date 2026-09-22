import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;
const state = vi.hoisted(() => ({ tables: {} as Record<string, Row[]>, reads: [] as Array<{ table: string; columns: string; rows: number; filters: string[] }>, failed: "" }));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("@/lib/supabase/env", () => ({ hasSupabaseAdminEnv: () => false }));
vi.mock("@/lib/supabase/public", () => ({ createPublicClient: () => ({ from(table: string) {
  let columns = "*", single = false, start = 0, end = Infinity;
  const filters: Array<[string, (row: Row) => boolean]> = [];
  const orders: Array<[string, boolean]> = [];
  const query = {
    select(value: string) { columns = value; return query; },
    eq(key: string, value: unknown) { filters.push([key, (row) => row[key] === value]); return query; },
    neq(key: string, value: unknown) { filters.push([key, (row) => row[key] !== value]); return query; },
    in(key: string, values: unknown[]) { filters.push([key, (row) => values.includes(row[key])]); return query; },
    order(key: string, options?: { ascending?: boolean }) { orders.push([key, options?.ascending !== false]); return query; },
    range(from: number, to: number) { start = from; end = to + 1; return query; },
    limit(limit: number) { end = limit; return query; },
    maybeSingle() { single = true; return query; },
    then(resolve: (value: unknown) => unknown) {
      let rows = [...(state.tables[table] ?? [])].filter((row) => filters.every(([, filter]) => filter(row)));
      rows.sort((a, b) => { for (const [key, asc] of orders) { const diff = String(a[key]).localeCompare(String(b[key]), undefined, { numeric: true }); if (diff) return asc ? diff : -diff; } return 0; });
      rows = rows.slice(start, end);
      state.reads.push({ table, columns, rows: rows.length, filters: filters.map(([key]) => key) });
      const data = rows.map((row) => Object.fromEntries(columns.split(",").map((key) => [key.trim(), row[key.trim()]])));
      return Promise.resolve({ data: single ? data[0] ?? null : data, error: state.failed === table ? { message: "temporary failure" } : null }).then(resolve);
    }
  };
  return query;
} }) }));

import { loadAtlasCapabilityBySlugFromSupabase, loadAtlasOrganizationBySlugFromSupabase } from "@/lib/atlas/supabase-repository";
import { loadRelatedBriefSummaries } from "@/lib/atlas/briefs";
import { loadRelatedSignalSummaries } from "@/lib/atlas/signals";
import { getDossierRelatedIntelligence, getCapabilitySiblingSummaries } from "@/lib/atlas/dossier-related";

const published = { publication_status: "published" };
const approved = { ...published, review_status: "approved" };
const publicEvidence = { visibility: "public", public_approved: true };
function seed(extra = 0) {
  state.tables = {
    organizations: [{ id: "org", slug: "org", name: "Parent", ...published }],
    capabilities: [{ id: "cap", slug: "cap", name: "Capability", organization_id: "org", summary: "Configuration A only", maturity: "Demonstrated, not delivered", ...published }],
    capability_domains: [{ capability_id: "cap", technical_domain_id: "domain", ...published }],
    technical_domains: [{ id: "domain", name: "Domain", ...published }],
    capability_mission_matches: [{ id: "mission-match", capability_id: "cap", mission_area_id: "mission", alignment_summary: "Qualified mission", ...approved }],
    mission_areas: [{ id: "mission", name: "Mission", ...published }],
    capability_demand_matches: [{ id: "demand-match", capability_id: "cap", demand_requirement_id: "need", alignment_summary: "Alignment is not eligibility", ...approved }],
    demand_requirements: [{ id: "need", demand_source_id: "demand-source", title: "Relevant need", ...published }],
    demand_sources: [{ id: "demand-source", source_id: "source", ...published }],
    field_citations: ["capability", "capability_mission_match", "capability_demand_match"].map((type, i) => ({ id: `citation-${i}`, entity_type: type, entity_id: ["cap", "mission-match", "demand-match"][i], evidence_snippet_id: "evidence", field_name: "summary" })),
    evidence_snippets: [{ id: "evidence", source_id: "source", excerpt: "Applies to configuration A", source_locator: "Table 4", ...publicEvidence }],
    sources: [{ id: "source", canonical_url: "https://example.com/a", title: "Official source", ...publicEvidence }],
    program_participations: [{ id: "participation", organization_id: "org", program_id: "program", ...published }],
    programs: [{ id: "program", name: "Parent programme", ...published }],
    funding_events: [{ id: "funding", organization_id: "org", disclosed_summary: "Disclosed funding", ...published }]
  };
  for (let i = 0; i < extra; i++) {
    for (const table of ["technical_domains", "mission_areas", "demand_requirements", "demand_sources", "programs", "ecosystem_clusters"]) (state.tables[table] ??= []).push({ id: `unrelated-${i}`, ...published });
    state.tables.field_citations.push({ id: `unrelated-citation-${i}`, entity_type: "demand_requirement", entity_id: `unrelated-${i}`, evidence_snippet_id: `unrelated-evidence-${i}` });
    state.tables.evidence_snippets.push({ id: `unrelated-evidence-${i}`, source_id: "source", excerpt: "Unrelated", ...publicEvidence });
  }
}
beforeEach(() => { state.reads = []; state.failed = ""; seed(); });

describe("bounded dossier reads", () => {
  it("keeps the same complete capability evidence as unrelated tables grow", async () => {
    const first = await loadAtlasCapabilityBySlugFromSupabase("cap");
    const small = structuredClone(state.reads);
    seed(1100); state.reads = [];
    const second = await loadAtlasCapabilityBySlugFromSupabase("cap");
    expect(second).toEqual(first);
    expect(state.reads).toEqual(small);
    expect(second?.capability.citations[0].excerpt).toBe("Applies to configuration A");
    expect(second?.capability.missionMatches[0].citations).toHaveLength(1);
    expect(second?.capability.demandMatches[0].citations).toHaveLength(1);
    expect(second?.capability.maturity).toBe("Demonstrated, not delivered");
    expect(state.reads.some((read) => ["funding_events", "programs", "demand_sources", "ecosystem_clusters"].includes(read.table))).toBe(false);
    console.info("capability fixture reads", { queries: state.reads.length, rows: state.reads.reduce((sum, read) => sum + read.rows, 0) });
  });
  it("preserves scoped legacy parent content and does not expose private sources or parents", async () => {
    const legacy = await loadAtlasOrganizationBySlugFromSupabase("org");
    expect(legacy?.programs[0].programName).toBe("Parent programme");
    expect(legacy?.fundingEvents[0].disclosedSummary).toBe("Disclosed funding");
    state.tables.sources[0].public_approved = false;
    expect((await loadAtlasCapabilityBySlugFromSupabase("cap"))?.capability.citations).toEqual([]);
    state.tables.organizations[0].publication_status = "draft";
    expect(await loadAtlasCapabilityBySlugFromSupabase("cap")).toBeNull();
  });
  it("distinguishes a failed core query from not found", async () => {
    expect(await loadAtlasCapabilityBySlugFromSupabase("missing")).toBeNull();
    state.failed = "capabilities";
    await expect(loadAtlasCapabilityBySlugFromSupabase("cap")).rejects.toThrow();
  });
  it("loads complete, deduplicated Brief summaries across batches without article hydration", async () => {
    const targets = Array.from({ length: 105 }, (_, i) => ({ type: "capability" as const, id: `c${i}` }));
    state.tables.wiki_page_record_links = Array.from({ length: 1100 }, (_, i) => ({ id: `l${i}`, page_id: "older", record_type: "capability", record_id: "c0" }));
    state.tables.wiki_page_record_links.push({ id: "latest", page_id: "new", record_type: "capability", record_id: "c104" });
    state.tables.wiki_pages = [{ id: "older", slug: "older", title: "Older", published_at: "2026-09-01", ...published }, { id: "new", slug: "new", title: "New", published_at: "2026-09-22", ...published }, { id: "private", ...published, publication_status: "draft" }];
    expect((await loadRelatedBriefSummaries(targets)).map((row) => row.id)).toEqual(["new", "older"]);
    expect(state.reads.filter((read) => read.table === "wiki_page_record_links").length).toBe(3);
    expect(state.reads.every((read) => !read.columns.includes("sections") && !read.table.includes("sources"))).toBe(true);
  });
  it("validates canonical Signal links and chooses the earliest matching item without source hydration", async () => {
    state.tables.signal_record_links = [{ id: "l1", item_id: "item2", record_type: "capability", record_id: "cap", relationship_label: "Related", public_href: "/capabilities/cap" }, { id: "l2", item_id: "item1", record_type: "capability", record_id: "cap", relationship_label: "Related", public_href: "/capabilities/cap" }, { id: "bad", item_id: "bad", record_type: "capability", record_id: "cap", relationship_label: "Wrong", public_href: "/capabilities/wrong" }];
    state.tables.signal_items = [{ id: "item1", edition_id: "edition", title: "First", position: 1, ...published }, { id: "item2", edition_id: "edition", title: "Second", position: 2, ...published }, { id: "bad", edition_id: "bad-edition", position: 0, ...published }];
    state.tables.signal_editions = [{ id: "edition", slug: "edition", title: "Edition", edition_date: "2026-09-22", ...published }, { id: "bad-edition", ...published }];
    expect(await loadRelatedSignalSummaries([{ type: "capability", id: "cap" }])).toEqual([expect.objectContaining({ id: "edition", matchedItemTitle: "First" })]);
    expect(state.reads.some((read) => read.table.includes("sources") || read.columns.includes("source_fact"))).toBe(false);
  });
  it("isolates related failures from successful summaries, and returns only published siblings", async () => {
    const org = (await loadAtlasCapabilityBySlugFromSupabase("cap"))!.organization;
    state.failed = "wiki_page_record_links";
    const result = await getDossierRelatedIntelligence(org);
    expect(result.unavailable).toEqual(["Briefs"]);
    expect(result.signals).toEqual([]);
    state.failed = "";
    state.tables.capabilities.push({ id: "sibling", slug: "sibling", name: "Sibling", organization_id: "org", ...published }, { id: "private", organization_id: "org", publication_status: "draft" });
    expect(await getCapabilitySiblingSummaries("org", "cap")).toEqual([{ id: "sibling", slug: "sibling", name: "Sibling" }]);
  });
});
