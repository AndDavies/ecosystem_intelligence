import { createHash, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assertExistingDailySignalsRunMatchesEdition, assertNewDailySignalsRunAvailable, getSignalsExecutiveSummary, type DailySignalsPacketV3, type DailySignalsRunOutcome, type SignalEvidenceSnapshot } from "./contract";
import { runSignalsPublication, signalsErrorMessage, type SignalsPackagingResult } from "./publication";

type Row = Record<string, unknown>;
export type StoredSignalsHero = { storagePath: string; publicUrl: string; created: boolean };
export type SignalsPublisherServices = {
  storeHero(image: NonNullable<DailySignalsPacketV3["heroImage"]>, slug: string, client: SupabaseClient): Promise<StoredSignalsHero>;
  ensureSocialDrafts(packet: DailySignalsPacketV3, editionId: string, itemIds: Map<string, string>, client: SupabaseClient, requireComplete: boolean): Promise<SignalsPackagingResult>;
};
export function signalsPublicationHash(packet: DailySignalsPacketV3) {
  // Packaging can be repaired independently; the public article's identity/content cannot drift on a rerun.
  return createHash("sha256").update(JSON.stringify({ ...packet, items: [...packet.items].sort((a, b) => a.storyPosition - b.storyPosition), heroImage: null, socialDrafts: [] })).digest("hex");
}
export function signalEvidenceSnapshot(source: DailySignalsPacketV3["items"][number]["sources"][number]): SignalEvidenceSnapshot {
  return { schemaVersion: "signal_evidence_snapshot_v1", ...source };
}
export function mergeSignalsReport(previous: unknown, patch: Row): Row {
  return { ...(previous && typeof previous === "object" ? previous as Row : {}), ...patch };
}
export async function mergeSignalsRunReport(client: SupabaseClient, runId: string, patch: Row, writerToken?: string) {
  const { data, error } = await client.from("signal_runs").select("report,writer_token").eq("run_id", runId).single();
  if (error) throw error;
  if (writerToken && data?.writer_token !== writerToken) throw new Error("Signals writer was superseded; preserve the current run report.");
  const report = data?.report && typeof data.report === "object" ? data.report as Row : {};
  let query = client.from("signal_runs").update({ report: mergeSignalsReport(report, patch) }).eq("run_id", runId);
  if (writerToken) query = query.eq("writer_token", writerToken);
  const { data: saved, error: writeError } = await query.select("id").single();
  if (writeError || !saved) throw writeError ?? new Error("Signals run report could not be saved.");
}
export async function recordSignalsOutcome(record: DailySignalsRunOutcome, client?: SupabaseClient) {
  const payloadHash = createHash("sha256").update(JSON.stringify(record)).digest("hex");
  const result = { ok: true, mode: client ? "outcome-recorded" : "dry-run-outcome", runId: record.runId, editionDate: record.editionDate, outcome: record.outcome, createsEdition: false };
  if (!client) return result;
  const [edition, run] = await Promise.all([
    client.from("signal_editions").select("id").eq("run_id", record.runId).maybeSingle(),
    client.from("signal_runs").select("id,status,edition_id,report").eq("run_id", record.runId).maybeSingle()
  ]);
  if (edition.error || run.error) throw edition.error ?? run.error;
  if (edition.data) throw new Error("A run owning an edition cannot become a nonpublishing outcome.");
  if (run.data) {
    if (run.data.status === record.outcome && !run.data.edition_id && (run.data.report as Row | null)?.payload_hash === payloadHash) return { ...result, mode: "idempotent-outcome" };
    const previous = run.data.report as Row | null;
    if (run.data.status !== "blocked" || run.data.edition_id || previous?.schema_version !== "daily_signals_run_outcome_v2" || previous.edition_date !== record.editionDate || previous.resumable !== true || record.outcome === "blocked") throw new Error("Run identity already records a different outcome; refusing to overwrite it.");
  }
  const prior = run.data?.report as Row | undefined;
  const values = { run_id: record.runId, status: record.outcome, inspected_count: record.inspectedCount, selected_count: record.qualifiedCount, source_family_count: record.sourceFamilyCount, completed_at: new Date().toISOString(), report: { schema_version: record.schemaVersion, edition_date: record.editionDate, payload_hash: payloadHash, coverage_complete: record.coverageComplete, reason: record.reason, resumable: record.resumable, creates_edition: false, ...(prior ? { previous_outcomes: [...(Array.isArray(prior.previous_outcomes) ? prior.previous_outcomes : []), { status: "blocked", report: Object.fromEntries(Object.entries(prior).filter(([key]) => key !== "previous_outcomes")) }] } : {}) } };
  const { data, error } = run.data
    ? await client.from("signal_runs").update(values).eq("run_id", record.runId).eq("status", "blocked").is("edition_id", null).select("id,status,edition_id,report").maybeSingle()
    : await client.from("signal_runs").insert(values).select("id,status,edition_id,report").single();
  if (error || !data || data.status !== record.outcome || data.edition_id || (data.report as Row)?.payload_hash !== payloadHash) throw error ?? new Error("Signals outcome verification failed.");
  return result;
}

export function signalsRunStartValues(packet: DailySignalsPacketV3, existingRun: Row | null) {
  const payloadHash = signalsPublicationHash(packet);
  const report: Row = { schema_version: packet.schemaVersion, payload_hash: payloadHash, edition_date: packet.editionDate, edition_slug: packet.slug, assembly_edition_id: randomUUID(), planned_source_ids: Object.fromEntries([...new Set(packet.items.flatMap((item) => item.sources.map((source) => source.canonicalUrl)))].map((url) => [url, randomUUID()])), material_updates: packet.items.filter((item) => item.materialUpdate).map((item) => ({ event_fingerprint: item.eventFingerprint, reason: item.materialUpdateReason })) };
  if (existingRun) {
    const previous = existingRun.report && typeof existingRun.report === "object" ? existingRun.report as Row : {};
    if (existingRun.status !== "blocked" || existingRun.edition_id || previous.schema_version !== "daily_signals_run_outcome_v2" || previous.edition_date !== packet.editionDate || previous.resumable !== true) {
      assertNewDailySignalsRunAvailable(existingRun as { status: unknown; edition_id: unknown }, packet.runId);
    }
    const { previous_outcomes: history, ...prior } = previous;
    report.previous_outcomes = [...(Array.isArray(history) ? history : []), { status: existingRun.status, completed_at: existingRun.completed_at ?? null, report: prior }];
  }
  return { run_id: packet.runId, writer_token: randomUUID(), status: "started", inspected_count: packet.inspectedCount, selected_count: packet.items.length, source_family_count: packet.sourceFamilyCount, completed_at: null, report };
}
export async function startSignalsRun(client: SupabaseClient, packet: DailySignalsPacketV3, existingRun: Row | null) {
  const values = signalsRunStartValues(packet, existingRun);
  const started = existingRun
    ? await client.from("signal_runs").update(values).eq("run_id", packet.runId).eq("status", "blocked").is("edition_id", null).select("id").maybeSingle()
    : await client.from("signal_runs").insert(values).select("id").single();
  if (started.error || !started.data) throw started.error ?? new Error("Signal run could not be started; another worker may have resumed it.");
  return values;
}

export async function publishSignalsV3(packet: DailySignalsPacketV3, client: SupabaseClient, services: SignalsPublisherServices, replaceHero = false, recover = false): Promise<Record<string, unknown>> {
  const payloadHash = signalsPublicationHash(packet);
  const [edition, run, slugOwner, dateOwner, snapshotContract] = await Promise.all([
    client.from("signal_editions").select("id,slug,edition_date,publication_status,packet_schema_version").eq("run_id", packet.runId).maybeSingle(),
    client.from("signal_runs").select("id,status,edition_id,report,completed_at,writer_token").eq("run_id", packet.runId).maybeSingle(),
    client.from("signal_editions").select("id,run_id").eq("slug", packet.slug).maybeSingle(),
    client.from("signal_editions").select("id,run_id").eq("edition_date", packet.editionDate).maybeSingle(),
    client.from("signal_item_sources").select("evidence_snapshot").limit(0)
  ]);
  for (const result of [edition, run, slugOwner, dateOwner, snapshotContract]) if (result.error) throw result.error;
  if (recover && run.data?.status !== "started" && run.data?.status !== "published") throw new Error("--recover requires an existing interrupted started v3 run.");
  if (edition.data && run.data?.status === "published") {
    const existing = edition.data;
    if (existing.slug !== packet.slug || existing.edition_date !== packet.editionDate || existing.packet_schema_version !== packet.schemaVersion) throw new Error("The packet version, slug or edition date does not match the existing run; repair is blocked before any write.");
    assertExistingDailySignalsRunMatchesEdition(run.data, String(existing.id), packet.runId);
    if ((run.data?.report as Row | null)?.payload_hash !== payloadHash) throw new Error("Existing edition content differs from the packet; use Admin correction rather than rerun replacement.");
    const { data: items, error } = await client.from("signal_items").select("id,slug").eq("edition_id", existing.id);
    if (error) throw error;
    const itemIds = new Map((items ?? []).map((item) => [String(item.slug), String(item.id)]));
    if (replaceHero) {
      if (!packet.heroImage) throw new Error("Hero repair requires a cited image.");
      const { data: links, error: linksError } = await client.from("signal_item_sources").select("evidence_snapshot").in("item_id", [...itemIds.values()]);
      if (linksError) throw linksError;
      if (!(links ?? []).some((link) => (link.evidence_snapshot as Row | null)?.canonicalUrl === packet.heroImage?.sourcePageUrl)) throw new Error("Replacement hero is not anchored to existing edition evidence.");
      const hero = await services.storeHero(packet.heroImage, packet.slug, client);
      const { error: updateError } = await client.from("signal_editions").update({ hero_image_path: hero.publicUrl, hero_image_source_url: packet.heroImage.sourcePageUrl, hero_image_alt: packet.heroImage.alt, hero_image_attribution: packet.heroImage.attribution, amended_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", existing.id);
      if (updateError) throw updateError;
    }
    let packaging: Row;
    try { const social = await services.ensureSocialDrafts(packet, String(existing.id), itemIds, client, false); packaging = { socials: social.platforms.includes("linkedin") && social.platforms.includes("x") ? "complete" : "pending", socialDraftCount: social.count, socialDraftPlatforms: social.platforms }; }
    catch (error) { packaging = { socials: "pending", error: signalsErrorMessage(error) }; }
    let reportPending = false;
    try { const priorPackaging = (run.data?.report as Row | null)?.packaging; await mergeSignalsRunReport(client, packet.runId, { packaging: { ...(priorPackaging && typeof priorPackaging === "object" ? priorPackaging as Row : {}), ...packaging } }); } catch { reportPending = true; }
    return { ok: true, mode: replaceHero ? "hero-replaced" : "idempotent", runId: packet.runId, editionId: existing.id, slug: packet.slug, editionDate: packet.editionDate, publicationStatus: existing.publication_status, publicationVerified: existing.publication_status === "published", packaging, reportPending };
  }
  if (replaceHero) throw new Error("Hero repair requires an existing edition.");
  if ((slugOwner.data && slugOwner.data.run_id !== packet.runId) || (dateOwner.data && dateOwner.data.run_id !== packet.runId)) throw new Error("Signals slug or Atlantic edition date already belongs to another run.");
  const cutoff = new Date(Date.now() - 30 * 86400_000).toISOString();
  const recent = await client.from("signal_items").select("event_fingerprint,edition_id").in("event_fingerprint", packet.items.map((item) => item.eventFingerprint)).gte("created_at", cutoff);
  if (recent.error) throw recent.error;
  for (const item of packet.items) if ((recent.data ?? []).some((row) => row.event_fingerprint === item.eventFingerprint && row.edition_id !== edition.data?.id) && !item.materialUpdate) throw new Error(`Repeated event without a material-update disposition: ${item.eventFingerprint}`);
  let assembly: ReturnType<typeof signalsRunStartValues>;
  if (run.data?.status === "started") {
    const previous = run.data.report as Row | null;
    if (!recover) throw new Error("This Signals attempt was interrupted or is still active. Reconcile its state, confirm the previous writer stopped, then use --recover with the same packet.");
    if (!run.data.writer_token || previous?.payload_hash !== payloadHash || previous.edition_date !== packet.editionDate || previous.edition_slug !== packet.slug) throw new Error("Recovery must use the same v3 run, packet, slug and date.");
    assembly = signalsRunStartValues(packet, null);
    const recovery = await client.rpc("cleanup_signal_edition_run", { p_run_id: packet.runId, p_payload_hash: payloadHash, p_writer_token: run.data.writer_token, p_error: "Explicit recovery of interrupted uncommitted preparation", p_resume_token: assembly.writer_token, p_resume_report: assembly.report });
    if (recovery.error) throw recovery.error;
    if ((recovery.data as Row)?.outcome === "already_published") return publishSignalsV3(packet, client, services, replaceHero, false);
    if ((recovery.data as Row)?.outcome !== "cleaned") throw new Error("Recovery could not confirm cleanup; preserve the attempt.");
    const ownedPath = (recovery.data as Row)?.ownedHeroPath;
    if (typeof ownedPath === "string" && ownedPath.startsWith(`signals/${packet.slug}/`)) { const removed = await client.storage.from("brief-images").remove([ownedPath]); if (removed.error) throw removed.error; }
  } else {
    assembly = await startSignalsRun(client, packet, run.data);
  }
  let editionId: string | null = null;
  let heroStoragePath: string | null = null;
  let heroState: Row = { status: "text_led" };
  const itemIds = new Map<string, string>();
  const sourceIds = new Map<string, string>();
  const plannedSourceIds = assembly.report.planned_source_ids as Record<string, string>;
  const completion = await runSignalsPublication({
    async prepare() {
      let storedHero: StoredSignalsHero | null = null;
      if (packet.heroImage) {
        try { storedHero = await services.storeHero(packet.heroImage, packet.slug, client); heroStoragePath = storedHero.created ? storedHero.storagePath : null; heroState = { status: "source_image" }; }
        catch (error) { heroState = { status: "text_led", error: signalsErrorMessage(error) }; }
      }
      if (heroStoragePath) await mergeSignalsRunReport(client, packet.runId, { owned_hero_path: heroStoragePath }, assembly.writer_token);
      const saved = await client.from("signal_editions").insert({ id: assembly.report.assembly_edition_id, slug: packet.slug, edition_date: packet.editionDate, title: packet.title, executive_summary: getSignalsExecutiveSummary(packet), summary_sections: packet.summary, packet_schema_version: packet.schemaVersion, automation_disclosure: packet.disclosure, run_id: packet.runId, publication_status: "archived", hero_image_path: storedHero?.publicUrl ?? null, hero_image_source_url: storedHero ? packet.heroImage?.sourcePageUrl : null, hero_image_alt: storedHero ? packet.heroImage?.alt : null, hero_image_attribution: storedHero ? packet.heroImage?.attribution : null }).select("id").single();
      if (saved.error || !saved.data) throw saved.error ?? new Error("Edition insert returned no row.");
      editionId = String(saved.data.id);
      for (const item of [...packet.items].sort((a, b) => a.storyPosition - b.storyPosition)) {
        const savedItem = await client.from("signal_items").insert({ edition_id: editionId, slug: item.slug, position: item.storyPosition, title: item.title, lane: item.lane, tags: item.tags, bottom_line: item.bottomLine, executive_summary: item.executiveSummary, source_fact: item.sourceFact, automated_read: item.automatedRead, unknowns: item.unknowns, next_step: item.nextStep, confidence: item.confidence, event_fingerprint: item.eventFingerprint, content_hash: item.contentHash, material_update: item.materialUpdate }).select("id").single();
        if (savedItem.error || !savedItem.data) throw savedItem.error ?? new Error("Item insert returned no row.");
        itemIds.set(item.slug, String(savedItem.data.id));
        for (const [position, source] of item.sources.entries()) {
          let sourceId = sourceIds.get(source.canonicalUrl);
          if (!sourceId) {
            // Allocate our candidate identity before the request so cleanup also handles a lost insert response.
            const candidateId = plannedSourceIds[source.canonicalUrl];
            const sourceInsert = await client.from("signal_sources").upsert({ id: candidateId, canonical_url: source.canonicalUrl, title: source.title, publisher: source.publisher, published_at: source.publishedAt, source_family: source.sourceFamily, authority: source.authority, evidence_locator: source.evidenceLocator, evidence_excerpt: source.evidenceExcerpt, content_hash: source.contentHash, accessed_at: source.accessedAt }, { onConflict: "canonical_url", ignoreDuplicates: true });
            if (sourceInsert.error) throw sourceInsert.error;
            const savedSource = await client.from("signal_sources").select("id").eq("canonical_url", source.canonicalUrl).single();
            if (savedSource.error || !savedSource.data) throw savedSource.error ?? new Error("Source identity is unavailable.");
            sourceId = String(savedSource.data.id);
            sourceIds.set(source.canonicalUrl, sourceId);
          }
          const join = await client.from("signal_item_sources").insert({ item_id: savedItem.data.id, source_id: sourceId, is_primary: position === 0, display_order: position, evidence_snapshot: signalEvidenceSnapshot(source) });
          if (join.error) throw join.error;
        }
        if (item.recordLinks.length) {
          const links = await client.from("signal_record_links").insert(item.recordLinks.map((link, position) => ({ item_id: savedItem.data.id, record_type: link.recordType, record_id: link.recordId, relationship_label: link.relationshipLabel, public_href: link.publicHref, display_order: position })));
          if (links.error) throw links.error;
        }
      }
    },
    async finalize() { const result = await client.rpc("finalize_signal_edition", { p_run_id: packet.runId, p_edition_id: editionId, p_payload_hash: payloadHash, p_writer_token: assembly.writer_token }); if (result.error) throw result.error; if ((result.data as Row | null)?.publicationStatus !== "published") throw new Error("Signals finalization response could not be verified."); },
    async inspect() {
      const [observed, observedRun] = await Promise.all([
        client.from("signal_editions").select("id,publication_status").eq("run_id", packet.runId).maybeSingle(),
        client.from("signal_runs").select("status,edition_id,writer_token").eq("run_id", packet.runId).maybeSingle()
      ]);
      if (observed.error || observedRun.error || !observedRun.data) return "unknown";
      if (observed.data) editionId = String(observed.data.id);
      if (observedRun.data.status === "published" && observedRun.data.edition_id === observed.data?.id) return "published";
      if (observedRun.data.writer_token !== assembly.writer_token || observed.data?.publication_status === "published") return "unknown";
      return "unpublished";
    },
    async rollback(error) {
      const cleaned = await client.rpc("cleanup_signal_edition_run", { p_run_id: packet.runId, p_payload_hash: payloadHash, p_writer_token: assembly.writer_token, p_error: signalsErrorMessage(error) });
      if (cleaned.error) throw cleaned.error;
      if ((cleaned.data as Row)?.outcome === "already_published") return "published";
      if ((cleaned.data as Row)?.outcome !== "cleaned") throw new Error("Cleanup state is unconfirmed; preserve media and the run.");
      if (heroStoragePath) { const result = await client.storage.from("brief-images").remove([heroStoragePath]); if (result.error) throw result.error; }
    },
    async package() { if (!editionId) throw new Error("Published edition identity is unavailable."); return services.ensureSocialDrafts(packet, editionId, itemIds, client, false); },
    async verify() {
      const [editionState, runState] = await Promise.all([client.from("signal_editions").select("id,publication_status,slug,edition_date").eq("run_id", packet.runId).single(), client.from("signal_runs").select("status,edition_id").eq("run_id", packet.runId).single()]);
      if (editionState.error || runState.error) throw editionState.error ?? runState.error;
      if (editionState.data.publication_status !== "published" || editionState.data.slug !== packet.slug || editionState.data.edition_date !== packet.editionDate || runState.data.status !== "published" || runState.data.edition_id !== editionState.data.id) throw new Error("Published edition and run state do not match.");
    },
    async record(result) { await mergeSignalsRunReport(client, packet.runId, { packaging: { ...result.packaging, hero: heroState }, verification: result.verification }, assembly.writer_token); }
  });
  return { ok: true, mode: "published", runId: packet.runId, editionId, slug: packet.slug, editionDate: packet.editionDate, url: `https://truenorthmap.ca/signals/${packet.slug}`, ...completion, hero: heroState };
}
