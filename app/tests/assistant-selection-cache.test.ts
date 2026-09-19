import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { selectCachedWithJev } from "@/lib/atlas/assistant-selection-cache";
import { JEV_MODEL } from "@/lib/atlas/assistant-jev";
import { atlasTestSnapshot } from "./fixtures/atlas-snapshot";
const input = () => ({ snapshot: structuredClone(atlasTestSnapshot), query: "Need sensors", priorTurns: [], baseline: atlasTestSnapshot.organizations, relevanceOnly: true });
function provider() { return vi.fn<typeof fetch>(async (_,init) => {
  const body = JSON.parse(String(init?.body));
  return Response.json({ model:JEV_MODEL, usage:{input_tokens:100,output_tokens:0}, answers:Object.fromEntries(Object.keys(body.questions).map(id => [id,{type:"score",score:3,confidence:1,probabilities:{"0":0,"1":0,"2":0,"3":1}}])) });
}); }
let keyIndex = 0;
beforeEach(() => { vi.stubEnv("TYPESAFE_API_KEY",`test-key-${keyIndex++}`); });
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });
it("reuses successful selection, records zero new billing, and keys query/corpus changes", async () => {
  const fetch = provider(); const data = input();
  const first = await selectCachedWithJev(data,{fetch}); const count = fetch.mock.calls.length;
  const second = await selectCachedWithJev(data,{fetch});
  expect(first.metrics.cacheStatus).toBe("miss"); expect(second.metrics).toMatchObject({cacheStatus:"hit",inputTokens:0,batchCount:0,estimatedCostUsd:0});
  expect(second.organizations).toEqual(first.organizations); expect(fetch).toHaveBeenCalledTimes(count);
  await selectCachedWithJev({...data,query:"different"},{fetch}); expect(fetch.mock.calls.length).toBeGreaterThan(count);
  data.snapshot.organizations[0].description += " changed offering";
  await selectCachedWithJev(data,{fetch}); expect(fetch.mock.calls.length).toBe(count * 3);
});
it("coalesces concurrent requests and never caches failed passes", async () => {
  const fetch = provider();
  const [first,second] = await Promise.all([selectCachedWithJev(input(),{fetch}),selectCachedWithJev(input(),{fetch})]);
  expect(first.metrics.cacheStatus).toBe("miss"); expect(second.metrics.cacheStatus).toBe("coalesced");
  expect(second.metrics.inputTokens).toBe(0);
  vi.stubEnv("TYPESAFE_API_KEY","failed-pass-key"); const failure = vi.fn<typeof globalThis.fetch>(async () => new Response(null,{status:429}));
  await selectCachedWithJev(input(),{fetch:failure}); await selectCachedWithJev(input(),{fetch:failure});
  expect(failure.mock.calls.length).toBeGreaterThanOrEqual(2);
});
it("explicit bypass runs fresh and does not populate the cache",async()=>{
  const fetch=provider(); await selectCachedWithJev(input(),{fetch},true);
 const next = await selectCachedWithJev(input(),{fetch}); expect(next.metrics.cacheStatus).toBe("miss");
});

it("expires synchronously, coalesces the paid refresh, and cannot report an old artifact as a miss", async () => {
  vi.useFakeTimers();
  const fetch = provider();
  const first = await selectCachedWithJev(input(), { fetch });
  const calls = fetch.mock.calls.length;
  await vi.advanceTimersByTimeAsync(600001);
  expect(fetch.mock.calls.length).toBe(calls);
  const [fresh, coalesced] = await Promise.all([selectCachedWithJev(input(), { fetch }), selectCachedWithJev(input(), { fetch })]);
  expect(fresh.metrics.cacheStatus).toBe("miss");
  expect(fresh.metrics.cacheCreatedAt).toBeGreaterThan(first.metrics.cacheCreatedAt!);
  expect(coalesced.metrics).toMatchObject({ cacheStatus: "coalesced", inputTokens: 0, estimatedCostUsd: 0 });
  expect(fetch.mock.calls.length).toBe(calls * 2);
  fresh.metrics.selectedOrganizationIds = ["mutated"];
  const hit = await selectCachedWithJev(input(), { fetch });
  expect(hit.metrics.selectedOrganizationIds).not.toEqual(["mutated"]);
});
