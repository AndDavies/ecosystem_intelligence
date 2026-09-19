import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { z } from "zod";
import { getAtlasUser } from "@/lib/atlas/auth";
import { isAtlasAdminOwner } from "@/lib/atlas/admin-owner";
import { getAssistantCatalogue, hydrateAssistantOrganizations } from "@/lib/atlas/assistant-catalogue";
import { runAtlasAssistant } from "@/lib/atlas/assistant";
import { selectCachedWithJev } from "@/lib/atlas/assistant-selection-cache";
import { jevAccess } from "@/lib/atlas/assistant-jev";
import { retrieveAssistantPool } from "@/lib/atlas/assistant-retrieval";
import { assistantTestCases, assistantTestModes } from "@/lib/atlas/assistant-test-cases";
import { assistantSubjectFingerprint, privateJson } from "@/lib/product-insights/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
const schema = z.object({ caseIndex: z.number().int().min(0).max(4), mode: z.enum(assistantTestModes), receipt: z.string().max(32000).optional() }).strict();
const replaySchema = z.object({ caseIndex: z.number().int(), expires: z.number(), organizationIds: z.array(z.string()).max(16), capabilityIds: z.array(z.string()).max(2000), fingerprint: z.string().length(64) });
function sign(payload: string) { return createHmac("sha256", process.env.TYPESAFE_API_KEY!).update(payload).digest("hex"); }

export async function POST(request: Request) {
  const handlerStarted = performance.now();
  const runId = randomUUID();
  const startedAt = new Date().toISOString();
  const user = await getAtlasUser().catch(() => null);
  if (!isAtlasAdminOwner(user)) return privateJson({ error: "Owner access required." }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) return privateJson({ error: "Same-origin requests required." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return privateJson({ error: "Choose a listed test case and mode." }, { status: 400 });
  const { caseIndex, mode } = parsed.data;
  const query = assistantTestCases[caseIndex];
  const identity = { runId, startedAt, mode, caseIndex, deploymentSha: process.env.VERCEL_GIT_COMMIT_SHA ?? "local", deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? "local", diagnosticVersion: 2 };
  const failed = (phase: string, code: string, message: string) => {
    const diagnostics = { ...identity, phase, errorCode: code, status: 409, handlerMs: Math.round(performance.now()-handlerStarted) };
    console.warn(JSON.stringify({ event: "owner_ask_test_failed", ...diagnostics }));
    return privateJson({ query, diagnostics, error: message, answer: null, sources: [], organizations: [] }, { status: 409 });
  };
  if (process.env.ASK_JEV_MODE !== "owner-pilot" || jevAccess(true)) return failed("configuration", "pilot_unavailable", "These owner tests require owner-pilot mode and a TypeSafe key.");
  let replay: z.infer<typeof replaySchema> | undefined;
  if (mode === "answer-replay") {
    try {
      const [payload, signature] = (parsed.data.receipt ?? "").split(".");
      const expected = Buffer.from(sign(payload ?? ""));
      const actual = Buffer.from(signature ?? "");
      if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error();
      replay = replaySchema.parse(JSON.parse(Buffer.from(payload, "base64url").toString()));
      if (replay.caseIndex !== caseIndex || replay.expires < Date.now()) throw new Error();
    } catch { return failed("replay", "invalid_receipt", "Capture a fresh result for this question before replaying its answer."); }
  }
  const started = performance.now();
  let phase = "catalogue";
  try {
    const catalogue = await getAssistantCatalogue();
    const poolSize = mode === "hybrid-50" ? 50 : mode === "hybrid-100" ? 100 : null;
    const snapshot = poolSize ? { ...catalogue.snapshot, organizations: retrieveAssistantPool(catalogue.snapshot, query, [], poolSize) } : catalogue.snapshot;
    phase = "assistant";
    const run = await runAtlasAssistant({ snapshot, query, priorTurns: [], isOwner: true, includeAudit: true,
      safetyIdentifier: assistantSubjectFingerprint(request, user!.id),
      selectionDisabled: mode === "lexical", hydrateOrganizations: hydrateAssistantOrganizations,
      select: (input, dependencies) => selectCachedWithJev(input, dependencies, mode !== "full-cached"),
      fixedOrganizationIds: replay?.organizationIds, fixedCapabilityIds: replay?.capabilityIds, expectedCatalogueFingerprint: replay?.fingerprint });
    const selection = run.metrics.selection;
    const evidenceMs = (selection?.evidenceMs ?? 0) + (run.metrics.answeringEvidenceMs ?? 0);
    const diagnostics = { ...identity, status: 200, handlerMs: Math.round(performance.now()-handlerStarted), authAndValidationMs: Math.round(started-handlerStarted), catalogueRevision: catalogue.revision, catalogueCount: catalogue.snapshot.organizations.length,
      poolCount: snapshot.organizations.length, snapshotMs: catalogue.latencyMs,
      requestLatencyMs: Math.round(performance.now()-started), evidenceMs,
      answerMs: Math.max(0, run.metrics.latencyMs - (selection?.latencyMs ?? 0) - (run.metrics.answeringEvidenceMs ?? 0)),
      ...run.metrics, outcome: run.answer?.outcome ?? null, fallbackReason: run.fallbackReason ?? null };
    console.info(JSON.stringify({ event: "owner_ask_test_completed", ...diagnostics, organizationIds: run.answer?.matches.map(m => m.organizationId) ?? [] }));
    const payload = selection?.selectedCatalogueFingerprint ? Buffer.from(JSON.stringify({ caseIndex, expires: Date.now()+7200000,
      organizationIds: selection.selectedOrganizationIds, capabilityIds: selection.selectedCapabilityIds, fingerprint: selection.selectedCatalogueFingerprint })).toString("base64url") : null;
    const citedIds = new Set(run.answer?.matches.flatMap(m => m.supportPoints.flatMap(p => p.citationIds)) ?? []);
    const citations = (run.organizations ?? []).flatMap(org => [...org.citations, ...org.capabilities.flatMap(cap => [...cap.citations, ...cap.missionMatches.flatMap(m=>m.citations), ...cap.demandMatches.flatMap(m=>m.citations)])]).filter(c => citedIds.has(c.id));
    const sources = [...new Map(citations.map(c => [c.sourceUrl, { title:c.sourceTitle, url:c.sourceUrl }])).values()];
    return privateJson({ query, diagnostics, answer: run.answer, sources, audit: run.audit,
      organizations: (run.organizations ?? []).map(org => ({ id: org.id, name: org.name, slug: org.slug })),
      receipt: payload ? `${payload}.${sign(payload)}` : null });
  } catch (error) {
    const replayChanged = error instanceof Error && error.message.startsWith("Replay evidence changed");
    return failed(phase, replayChanged ? "evidence_changed" : error instanceof Error && /publication changed/i.test(error.message) ? "publication_changed" : "dependency_failed", replayChanged ? "Replay evidence changed; capture a fresh result." : "Test could not complete. The failed attempt has been recorded; inspect its run ID before retrying.");
  }
}
