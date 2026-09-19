import "server-only";
import { createHmac } from "node:crypto";
import { buildJevRecords, jevFingerprint, JEV_MODEL, JEV_RUBRIC, selectWithJev } from "./assistant-jev";

type Input = Parameters<typeof selectWithJev>[0];
type Dependencies = Parameters<typeof selectWithJev>[1];
type Result = Awaited<ReturnType<typeof selectWithJev>>;
type Cached = Omit<Result, "organizations"> & { organizationIds: string[]; createdAt: number };
const pending = new Map<string, Promise<Cached>>();
const completed = new Map<string, Cached>();
const TTL_MS = 600_000;
const MAX_ENTRIES = 64;

/** Instance-local, synchronous expiry: never start unaccounted paid background refresh. */
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
  for (const [id, value] of completed) if (started - value.createdAt >= TTL_MS) completed.delete(id);
  const hit = completed.get(key);
  const coalesced = !hit && pending.has(key);
  const compute = async (): Promise<Cached> => {
    const result = await selectWithJev(input, dependencies);
    const artifact = { ...result, organizationIds: result.organizations.map(o => o.id), createdAt: Date.now() };
    if (!result.metrics.fallbackReason) {
      if (completed.size >= MAX_ENTRIES) completed.delete(completed.keys().next().value!);
      completed.set(key, structuredClone(artifact));
    }
    return artifact;
  };
  const work = hit ? Promise.resolve(hit) : pending.get(key) ?? compute();
  if (!hit && !coalesced && pending.size < MAX_ENTRIES) {
    pending.set(key, work);
    void work.finally(() => { if (pending.get(key) === work) pending.delete(key); }).catch(() => {});
  }
  const cached = structuredClone(await work);
  const byId = new Map(input.snapshot.organizations.map(o => [o.id, o]));
  if (cached.organizationIds.some(id => !byId.has(id))) return selectWithJev(input, dependencies);
  return { organizations: cached.organizationIds.map(id => byId.get(id)!), judgments: cached.judgments, offeringScores: cached.offeringScores, metrics: {
    ...cached.metrics, cacheStatus: hit ? "hit" : coalesced ? "coalesced" : "miss", cacheScope: "instance", cacheCreatedAt: cached.createdAt,
    latencyMs: Date.now() - started,
    ...(hit || coalesced ? { batchCount: 0, completedBatchCount: 0, inputTokens: 0, estimatedCostUsd: 0, reservedCostUsd: 0, budgetPeakUsd: 0, providerRequestIds: [], relevanceMs: 0, intentMs: 0, constraintMs: 0, evidenceMs: 0 } : {})
  } };
}
