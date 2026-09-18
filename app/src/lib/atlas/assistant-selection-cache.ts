import "server-only";
import { createHmac } from "node:crypto";
import { unstable_cache } from "next/cache";
import { buildJevRecords, jevFingerprint, JEV_MODEL, JEV_RUBRIC, selectWithJev } from "./assistant-jev";

type Input = Parameters<typeof selectWithJev>[0];
type Dependencies = Parameters<typeof selectWithJev>[1];
type Result = Awaited<ReturnType<typeof selectWithJev>>;
type Cached = Omit<Result, "organizations"> & { organizationIds: string[] };
class Uncacheable extends Error { constructor(readonly result: Result) { super("Selection not cached"); } }
const pending = new Map<string, Promise<Cached>>();

export async function selectCachedWithJev(input: Input, dependencies: Dependencies = {}, bypass = false): Promise<Result> {
  if (bypass || input.disabledReason || !process.env.TYPESAFE_API_KEY) {
    const result = await selectWithJev(input, dependencies);
    result.metrics.cacheStatus = "bypass";
    return result;
  }
  const started = Date.now();
  const key = createHmac("sha256", process.env.TYPESAFE_API_KEY).update(JSON.stringify({
    query: input.query.trim(), priorTurns: input.priorTurns, catalogue: jevFingerprint(buildJevRecords(input.snapshot)),
    model: JEV_MODEL, rubric: JEV_RUBRIC, owner: input.isOwner === true, mode: process.env.ASK_JEV_MODE,
    relevanceOnly: input.relevanceOnly === true
  })).digest("hex");
  let executed = false;
  const read = unstable_cache(async (): Promise<Cached> => {
    executed = true;
    const result = await selectWithJev(input, dependencies);
    if (result.metrics.fallbackReason) throw new Uncacheable(result);
    return { organizationIds: result.organizations.map(o => o.id), judgments: result.judgments, offeringScores: result.offeringScores, metrics: result.metrics };
  }, ["assistant-selection-v2", key], { revalidate: 600, tags: ["atlas-public", "atlas-discovery-public", "atlas-organizations-public"] });
  const coalesced = pending.has(key);
  const work = pending.get(key) ?? read();
  if (!coalesced && pending.size < 64) {
    pending.set(key, work);
    void work.finally(() => { if (pending.get(key) === work) pending.delete(key); }).catch(() => {});
  }
  try {
    const cached = await work;
    const byId = new Map(input.snapshot.organizations.map(o => [o.id,o]));
    if (cached.organizationIds.some(id => !byId.has(id))) return selectWithJev(input, dependencies);
    return { ...cached, organizations: cached.organizationIds.map(id => byId.get(id)!), metrics: {
      ...cached.metrics, cacheStatus: coalesced ? "coalesced" : executed ? "miss" : "hit", latencyMs: Date.now() - started,
      ...(!executed || coalesced ? { batchCount: 0, completedBatchCount: 0, inputTokens: 0, estimatedCostUsd: 0, reservedCostUsd: 0, budgetPeakUsd: 0, providerRequestIds: [], relevanceMs: 0, constraintMs: 0, evidenceMs: 0 } : {})
    } };
  } catch (error) {
    if (error instanceof Uncacheable) return error.result;
    throw error;
  }
}
