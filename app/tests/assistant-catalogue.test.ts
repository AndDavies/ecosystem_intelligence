import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
const state = vi.hoisted(() => ({ graph: vi.fn(), rows: {} as Record<string, object[]>, reads: [] as string[] }));
vi.mock("@/lib/atlas/repository", () => ({ getAtlasDiscoverySnapshot: vi.fn() }));
vi.mock("@/lib/atlas/supabase-repository", () => ({ loadPublicCitationGraph: state.graph, dossierCitationRows: () => [] }));
vi.mock("@/lib/supabase/public", () => ({ createPublicClient: () => ({ from: (table: string) => {
  state.reads.push(table);
  const chain = { select: () => chain, in: () => chain, eq: () => chain, order: () => chain, range: () => chain,
    abortSignal: () => chain, then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: state.rows[table] ?? [], error: null }).then(resolve) };
  return chain;
} }) }));
import { hydrateAssistantOrganizations } from "@/lib/atlas/assistant-catalogue";
import { atlasTestSnapshot } from "./fixtures/atlas-snapshot";
beforeEach(() => { state.reads = []; state.rows = {}; state.graph.mockReset().mockResolvedValue({ citations: [], evidence: [], sources: [] }); });
it("batches only admitted final offerings, excludes wrong-owner children, and omits need/mission source graphs", async () => {
  const orgs = structuredClone(atlasTestSnapshot.organizations.slice(0,2));
  state.rows.organizations = orgs.map(o => ({ id:o.id }));
  state.rows.capabilities = orgs.flatMap(o => o.capabilities.map(c => ({ id:c.id, organization_id: o.id })));
  const wrong = orgs[0].capabilities[0];
  state.rows.capabilities = state.rows.capabilities.map(r => (r as {id:string}).id === wrong.id ? { ...r, organization_id: "another-owner" } : r);
  const result = await hydrateAssistantOrganizations(orgs);
  expect(state.reads).toEqual(["organizations", "capabilities"]);
  expect(result[0].capabilities.some(c => c.id === wrong.id)).toBe(false);
  const [targets,, options] = state.graph.mock.calls[0];
  expect(targets.map((t: {entityType:string}) => t.entityType)).toEqual(["organization", "capability"]);
  expect(targets[1].ids).not.toContain(wrong.id);
  expect(options.signal).toBeInstanceOf(AbortSignal);
  expect(options.fieldsByEntity.capability).toContain("maturity");
  expect(options.fieldsByEntity.organization).not.toContain("disclosed_financing_summary");
});
it("never passes an unpublished organization to privileged citation hydration", async () => {
  await hydrateAssistantOrganizations(atlasTestSnapshot.organizations.slice(0,1));
  expect(state.graph.mock.calls[0][0]).toEqual([{ entityType:"organization", ids:[] }, { entityType:"capability", ids:[] }]);
});
