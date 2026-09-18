import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const cache = vi.hoisted(() => new Map<string, unknown>());
vi.mock("next/cache", () => ({ unstable_cache: (fn: () => Promise<unknown>, keys: string[]) => async () => {
  const key = JSON.stringify(keys); if (cache.has(key)) return cache.get(key);
  const result = await fn(); cache.set(key,result); return result;
} }));
import { selectCachedWithJev } from "@/lib/atlas/assistant-selection-cache";
import { JEV_MODEL } from "@/lib/atlas/assistant-jev";
import { atlasTestSnapshot } from "./fixtures/atlas-snapshot";
const input = () => ({ snapshot: structuredClone(atlasTestSnapshot), query: "Need sensors", priorTurns: [], baseline: atlasTestSnapshot.organizations, relevanceOnly: true });
function provider() { return vi.fn<typeof fetch>(async (_,init) => {
  const body = JSON.parse(String(init?.body));
  return Response.json({ model:JEV_MODEL, usage:{input_tokens:100,output_tokens:0}, answers:Object.fromEntries(Object.keys(body.questions).map(id => [id,{type:"score",score:3,confidence:1,probabilities:{"0":0,"1":0,"2":0,"3":1}}])) });
}); }
beforeEach(() => { cache.clear(); vi.stubEnv("TYPESAFE_API_KEY","test-key"); });
afterEach(() => vi.unstubAllEnvs());
it("reuses successful selection, records zero new billing, and keys query/corpus changes", async () => {
  const fetch = provider(); const data = input();
  const first = await selectCachedWithJev(data,{fetch}); const count = fetch.mock.calls.length;
  const second = await selectCachedWithJev(data,{fetch});
  expect(first.metrics.cacheStatus).toBe("miss"); expect(second.metrics).toMatchObject({cacheStatus:"hit",inputTokens:0,batchCount:0,estimatedCostUsd:0});
  expect(second.organizations).toEqual(first.organizations); expect(fetch).toHaveBeenCalledTimes(count);
  await selectCachedWithJev({...data,query:"different"},{fetch}); expect(fetch.mock.calls.length).toBeGreaterThan(count);
  data.snapshot.organizations[0].description += " changed offering";
  await selectCachedWithJev(data,{fetch}); expect(cache.size).toBe(3);
  expect([...cache.keys()].join()).not.toContain("Need sensors");
});
it("coalesces concurrent requests and never caches failed passes", async () => {
  const fetch = provider();
  const [first,second] = await Promise.all([selectCachedWithJev(input(),{fetch}),selectCachedWithJev(input(),{fetch})]);
  expect(first.metrics.cacheStatus).toBe("miss"); expect(second.metrics.cacheStatus).toBe("coalesced");
  expect(second.metrics.inputTokens).toBe(0);
  cache.clear(); const failure = vi.fn<typeof globalThis.fetch>(async () => new Response(null,{status:429}));
  await selectCachedWithJev(input(),{fetch:failure}); await selectCachedWithJev(input(),{fetch:failure});
  expect(cache.size).toBe(0); expect(failure.mock.calls.length).toBeGreaterThanOrEqual(2);
});
it("explicit bypass runs fresh and does not populate the cache",async()=>{
  const fetch=provider(); await selectCachedWithJev(input(),{fetch},true); expect(cache.size).toBe(0);
});
