import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { fetchPublicBytes } from "../src/lib/security/public-outbound";
import { assertHistoricalSignalsEdition, assertExistingDailySignalsRunMatchesEdition, assertNewDailySignalsPacketVersion, assertNewDailySignalsRunAvailable, dailySignalsNoPublishSchema, dailySignalsPacketSchema, dailySignalsRunOutcomeSchema, parseSignalsJson, SIGNALS_PACKET_MAX_BYTES } from "../src/lib/signals/contract";
import { assertSignalsEditorialVoice } from "../src/lib/signals/editorial-voice";
import { loadScriptEnv } from "./load-env";
import { publishSignalsV3, recordSignalsOutcome, mergeSignalsReport } from "../src/lib/signals/publisher";
import { verifySignalsRuntime } from "../src/lib/signals/runtime-preflight";

loadScriptEnv();

function formatError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    try {
      return JSON.stringify(error);
    } catch {
      return "Unknown structured error";
    }
  }
  return String(error);
}

async function storeHeroImage(image: NonNullable<ReturnType<typeof dailySignalsPacketSchema.parse>["heroImage"]>, slug: string, supabase: SupabaseClient) {
  const { body: sourceBytes } = await fetchPublicBytes(image.imageUrl, {
    userAgent: "True North Map Signals/3.0 (+https://truenorthmap.ca/signals)",
    maxBytes: 10_485_760,
    allowedTypes: ["image/jpeg", "image/png", "image/webp"]
  });
  const normalized = await sharp(sourceBytes).rotate().resize(1600, 900, { fit: "cover", position: "attention" }).webp({ quality: 84 }).toBuffer();
  const checksum = createHash("sha256").update(normalized).digest("hex");
  const storagePath = `signals/${slug}/${checksum}.webp`;
  const { error } = await supabase.storage.from("brief-images").upload(storagePath, normalized, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
  const alreadyStored = Boolean(error && /already exists|duplicate/i.test(error.message));
  if (error && !alreadyStored) throw error;
  const { data } = supabase.storage.from("brief-images").getPublicUrl(storagePath);
  return { storagePath, publicUrl: data.publicUrl, created: !alreadyStored };
}

async function ensureSocialDrafts(packet: ReturnType<typeof dailySignalsPacketSchema.parse>, editionId: string, itemIds: Map<string, string>, supabase: SupabaseClient, requireComplete = true) {
  const expected = packet.socialDrafts.map((draft) => {
    const itemId = draft.itemSlug ? itemIds.get(draft.itemSlug) : null;
    if (draft.itemSlug && !itemId) throw new Error(`Social example references an unavailable edition item: ${draft.itemSlug}`);
    return { edition_id: editionId, item_id: itemId ?? null, platform: draft.platform, draft_text: draft.text };
  });
  const { data: existingRows, error: existingError } = await supabase.from("signal_social_drafts").select("id, item_id, platform, draft_text, status").eq("edition_id", editionId);
  if (existingError) throw existingError;
  const missing = expected.filter((draft) => !(existingRows ?? []).some((row) => row.platform === draft.platform && (row.item_id ?? null) === draft.item_id && row.draft_text === draft.draft_text));
  if (missing.length) {
    const { error: insertError } = await supabase.from("signal_social_drafts").insert(missing);
    if (insertError) throw insertError;
  }
  const { data: verifiedRows, error: verifyError } = await supabase.from("signal_social_drafts").select("item_id, platform, draft_text, status").eq("edition_id", editionId);
  if (verifyError) throw verifyError;
  const verified = verifiedRows ?? [];
  for (const draft of expected) {
    if (!verified.some((row) => row.platform === draft.platform && (row.item_id ?? null) === draft.item_id && row.draft_text === draft.draft_text)) {
      throw new Error(`The ${draft.platform} social example could not be verified for edition ${editionId}.`);
    }
  }
  const platforms = [...new Set(verified.map((row) => String(row.platform)))].sort();
  if (requireComplete && (!platforms.includes("linkedin") || !platforms.includes("x"))) throw new Error(`Edition ${editionId} must have verified LinkedIn and X examples.`);
  return { count: verified.length, platforms, inserted: missing.length };
}

function requireSignalsClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Signals verification or publication requires NEXT_PUBLIC_SUPABASE_URL and the local-only SUPABASE_SERVICE_ROLE_KEY.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function assertExistingEditionIdentity(existing: { slug: unknown; edition_date: unknown; packet_schema_version?: unknown }, packet: { slug: string; editionDate: string }) {
  assertHistoricalSignalsEdition(existing);
  if (String(existing.slug) !== packet.slug || String(existing.edition_date) !== packet.editionDate) {
    throw new Error("The packet slug or edition date does not match the existing run; repair is blocked before any write.");
  }
}

async function assertExistingHeroSource(editionId: string, sourcePageUrl: string, itemIds: string[], supabase: SupabaseClient) {
  if (itemIds.length === 0) throw new Error(`Edition ${editionId} has no stored items to anchor hero provenance.`);
  const { data: joins, error: joinsError } = await supabase.from("signal_item_sources").select("source_id").in("item_id", itemIds);
  if (joinsError) throw joinsError;
  const sourceIds = [...new Set((joins ?? []).map((row) => String(row.source_id)))];
  if (sourceIds.length === 0) throw new Error(`Edition ${editionId} has no stored source links to anchor hero provenance.`);
  const { data: sources, error: sourcesError } = await supabase.from("signal_sources").select("canonical_url").in("id", sourceIds);
  if (sourcesError) throw sourcesError;
  if (!(sources ?? []).some((source) => String(source.canonical_url) === sourcePageUrl)) {
    throw new Error("The replacement hero source page is not one of the existing edition's stored sources.");
  }
}

async function updateSignalRun(runId: string, values: Record<string, unknown>, supabase: SupabaseClient) {
  if (values.report && typeof values.report === "object") {
    const current = await supabase.from("signal_runs").select("report").eq("run_id", runId).single();
    if (current.error) throw current.error;
    values = { ...values, report: mergeSignalsReport(current.data.report, values.report as Record<string, unknown>) };
  }
  const { data, error } = await supabase.from("signal_runs").update(values).eq("run_id", runId).select("id").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Signal run ${runId} could not be updated or verified.`);
}

async function handleNoPublish(raw: unknown, apply: boolean) {
  const record = dailySignalsNoPublishSchema.parse(raw);
  const payloadHash = createHash("sha256").update(JSON.stringify(record)).digest("hex");
  const report = {
    schema_version: record.schemaVersion,
    edition_date: record.editionDate,
    qualified_count: record.qualifiedCount,
    blocking_gates: record.blockingGates,
    rationale: record.rationale,
    payload_hash: payloadHash,
    creates_edition: false
  };
  if (!apply) {
    console.log(JSON.stringify({ ok: true, mode: "dry-run-no-publish", runId: record.runId, editionDate: record.editionDate, inspectedCount: record.inspectedCount, qualifiedCount: record.qualifiedCount, sourceFamilyCount: record.sourceFamilyCount, blockingGates: record.blockingGates, createsEdition: false }, null, 2));
    return;
  }

  const supabase = requireSignalsClient();
  const [{ data: existingEdition, error: editionError }, { data: existingRun, error: runError }] = await Promise.all([
    supabase.from("signal_editions").select("id").eq("run_id", record.runId).maybeSingle(),
    supabase.from("signal_runs").select("id, status, edition_id, report").eq("run_id", record.runId).maybeSingle()
  ]);
  if (editionError) throw editionError;
  if (runError) throw runError;
  if (existingEdition) throw new Error(`Run ${record.runId} already owns a Signals edition and cannot become no_publish.`);
  if (existingRun) {
    const existingReport = existingRun.report && typeof existingRun.report === "object" ? existingRun.report as Record<string, unknown> : {};
    if (existingRun.status === "no_publish" && !existingRun.edition_id && existingReport.payload_hash === payloadHash) {
      console.log(JSON.stringify({ ok: true, mode: "idempotent-no-publish", runId: record.runId, runRecordId: existingRun.id, createsEdition: false }, null, 2));
      return;
    }
    throw new Error(`Run ${record.runId} already exists with different no-publish state; refusing to overwrite its audit record.`);
  }

  const { data: inserted, error: insertError } = await supabase.from("signal_runs").insert({
    run_id: record.runId,
    status: "no_publish",
    inspected_count: record.inspectedCount,
    selected_count: record.qualifiedCount,
    source_family_count: record.sourceFamilyCount,
    completed_at: new Date().toISOString(),
    report
  }).select("id, status, edition_id, report").single();
  if (insertError || !inserted) throw insertError ?? new Error("No-publish run insert returned no row.");
  if (inserted.status !== "no_publish" || inserted.edition_id || (inserted.report as Record<string, unknown> | null)?.payload_hash !== payloadHash) {
    throw new Error("No-publish run verification failed after insert.");
  }
  console.log(JSON.stringify({ ok: true, mode: "no-publish-recorded", runId: record.runId, runRecordId: inserted.id, createsEdition: false }, null, 2));
}

async function main() {
const fileArg = process.argv.find((arg) => arg.startsWith("--file="))?.slice(7);
const apply = process.argv.includes("--apply");
const replaceHero = process.argv.includes("--replace-hero");
const recover = process.argv.includes("--recover");
if (!fileArg) throw new Error("Use --file=/absolute/or/relative/path.json. Add --apply only after validation.");
const filePath = path.resolve(fileArg);
if ((await stat(filePath)).size > SIGNALS_PACKET_MAX_BYTES) throw new Error("Signals input exceeds the 1 MiB operational packet limit.");
const raw = parseSignalsJson(await readFile(filePath, "utf8"));
if (recover && (!raw || typeof raw !== "object" || (raw as { schemaVersion?: unknown }).schemaVersion !== "daily_signals_packet_v3")) throw new Error("--recover applies only to an interrupted v3 publication attempt.");
if (raw && typeof raw === "object" && (raw as { schemaVersion?: unknown }).schemaVersion === "daily_signals_run_outcome_v2") {
  if (replaceHero) throw new Error("A run outcome cannot replace an edition hero.");
  const record = dailySignalsRunOutcomeSchema.parse(raw);
  console.log(JSON.stringify(await recordSignalsOutcome(record, apply ? requireSignalsClient() : undefined), null, 2));
  return;
}
if (raw && typeof raw === "object" && (raw as { schemaVersion?: unknown }).schemaVersion === "daily_signals_no_publish_v1") {
  if (replaceHero) throw new Error("A no-publish record cannot replace an edition hero.");
  await handleNoPublish(raw, apply);
  return;
}
const packet = dailySignalsPacketSchema.parse(raw);
if (packet.schemaVersion === "daily_signals_packet_v3") {
  if (!apply) {
    console.log(JSON.stringify({ ok: true, mode: "dry-run", runId: packet.runId, slug: packet.slug, items: packet.items.length, sourceFamilies: packet.sourceFamilyCount, packetValid: true, liveEligibility: "not_checked", socialDraftCount: packet.socialDrafts.length, image: packet.heroImage ? "source_image" : "text_led" }, null, 2));
    return;
  }
  await verifySignalsRuntime(process.env.SIGNALS_SITE_ORIGIN ?? "https://truenorthmap.ca");
  console.log(JSON.stringify(await publishSignalsV3(packet, requireSignalsClient(), { storeHero: storeHeroImage, ensureSocialDrafts }, replaceHero, recover), null, 2));
  return;
}
if (recover) throw new Error("--recover applies only to an interrupted v3 publication attempt.");
assertSignalsEditorialVoice(packet);

if (!apply) {
  const supabase = requireSignalsClient();
  const { data: existing, error } = await supabase.from("signal_editions").select("id, slug, edition_date, publication_status, packet_schema_version").eq("run_id", packet.runId).maybeSingle();
  if (error) throw error;
  if (!existing) throw new Error("Historical v1/v2 packets and hero repairs may dry-run only after their existing edition run ID is verified.");
  assertExistingEditionIdentity(existing, packet);
  console.log(JSON.stringify({ ok: true, mode: replaceHero ? "dry-run-existing-hero-repair" : "dry-run-existing-repair", editorialVoice: "passed", existingRunVerified: true, newEditionEligible: false, runId: packet.runId, slug: packet.slug, items: packet.items.length, sourceFamilies: packet.sourceFamilyCount, socialDraftCount: packet.socialDrafts.length, socialDraftPlatforms: [...new Set(packet.socialDrafts.map((draft) => draft.platform))].sort() }, null, 2));
  return;
}

const supabase = requireSignalsClient();
const [
  { data: existing, error: existingError },
  { data: existingRun, error: existingRunError },
  { data: slugOwner, error: slugOwnerError },
  { data: dateOwner, error: dateOwnerError }
] = await Promise.all([
  supabase.from("signal_editions").select("id, slug, edition_date, publication_status, packet_schema_version").eq("run_id", packet.runId).maybeSingle(),
  supabase.from("signal_runs").select("id, status, edition_id").eq("run_id", packet.runId).maybeSingle(),
  supabase.from("signal_editions").select("id, run_id").eq("slug", packet.slug).maybeSingle(),
  supabase.from("signal_editions").select("id, run_id").eq("edition_date", packet.editionDate).maybeSingle()
]);
if (existingError) throw existingError;
if (existingRunError) throw existingRunError;
if (slugOwnerError) throw slugOwnerError;
if (dateOwnerError) throw dateOwnerError;
if (existing) {
  assertExistingEditionIdentity(existing, packet);
  assertExistingDailySignalsRunMatchesEdition(existingRun, String(existing.id), packet.runId);
  const { data: existingItems, error: existingItemsError } = await supabase.from("signal_items").select("id, slug").eq("edition_id", existing.id);
  if (existingItemsError) throw existingItemsError;
  const existingItemIds = new Map((existingItems ?? []).map((item) => [String(item.slug), String(item.id)]));
  if (replaceHero) {
    await assertExistingHeroSource(String(existing.id), packet.heroImage.sourcePageUrl, [...existingItemIds.values()], supabase);
  }
  const socialDrafts = await ensureSocialDrafts(packet, String(existing.id), existingItemIds, supabase);
  if (replaceHero) {
    const storedHero = await storeHeroImage(packet.heroImage, packet.slug, supabase);
    const now = new Date().toISOString();
    const { error: heroUpdateError } = await supabase.from("signal_editions").update({
      hero_image_path: storedHero.publicUrl,
      hero_image_source_url: packet.heroImage.sourcePageUrl,
      hero_image_alt: packet.heroImage.alt,
      hero_image_attribution: packet.heroImage.attribution,
      amended_at: now,
      updated_at: now
    }).eq("id", existing.id);
    if (heroUpdateError) throw heroUpdateError;
    await updateSignalRun(packet.runId, {
      report: { slug: packet.slug, item_count: packet.items.length, hero_image: true, hero_image_replaced: true, editorial_voice: "passed", social_draft_count: socialDrafts.count, social_draft_platforms: socialDrafts.platforms }
    }, supabase);
    console.log(JSON.stringify({ ok: true, mode: "hero-replaced", editionId: existing.id, slug: existing.slug, publicationStatus: existing.publication_status, socialDraftCount: socialDrafts.count, socialDraftPlatforms: socialDrafts.platforms, socialDraftsInserted: socialDrafts.inserted, url: `https://truenorthmap.ca/signals/${existing.slug}` }, null, 2));
    process.exit(0);
  }
  await updateSignalRun(packet.runId, { report: { slug: packet.slug, item_count: packet.items.length, hero_image: true, editorial_voice: "passed", social_draft_count: socialDrafts.count, social_draft_platforms: socialDrafts.platforms, social_drafts_repaired: socialDrafts.inserted } }, supabase);
  console.log(JSON.stringify({ ok: true, mode: "idempotent", editionId: existing.id, slug: existing.slug, socialDraftCount: socialDrafts.count, socialDraftPlatforms: socialDrafts.platforms, socialDraftsInserted: socialDrafts.inserted }, null, 2));
  process.exit(0);
}

assertNewDailySignalsRunAvailable(existingRun, packet.runId);
if (slugOwner) throw new Error(`Signals slug ${packet.slug} already belongs to run ${String(slugOwner.run_id)}.`);
if (dateOwner) throw new Error(`Signals edition date ${packet.editionDate} already belongs to run ${String(dateOwner.run_id)}.`);
assertNewDailySignalsPacketVersion(packet);


}

void main().catch((error) => {
  console.error(formatError(error));
  process.exitCode = 1;
});
