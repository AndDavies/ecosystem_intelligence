import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { dailySignalsPacketSchema } from "../src/lib/signals/contract";
import { assertSignalsEditorialVoice } from "../src/lib/signals/editorial-voice";
import { loadScriptEnv } from "./load-env";

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
  const response = await fetch(image.imageUrl, {
    headers: { "User-Agent": "True North Map Signals/1.0 (+https://truenorthmap.ca/signals)" },
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw new Error(`Hero image returned HTTP ${response.status}.`);
  const mimeType = response.headers.get("content-type")?.split(";")[0]?.trim();
  if (!mimeType || !["image/jpeg", "image/png", "image/webp"].includes(mimeType)) throw new Error(`Hero image type is not supported: ${mimeType ?? "unknown"}.`);
  const declaredBytes = Number(response.headers.get("content-length") ?? "0");
  if (declaredBytes > 10_485_760) throw new Error("Hero image exceeds the 10 MB source limit.");
  const sourceBytes = Buffer.from(await response.arrayBuffer());
  if (sourceBytes.byteLength > 10_485_760) throw new Error("Hero image exceeds the 10 MB source limit.");
  const normalized = await sharp(sourceBytes).rotate().resize(1600, 900, { fit: "cover", position: "attention" }).webp({ quality: 84 }).toBuffer();
  const checksum = createHash("sha256").update(normalized).digest("hex");
  const storagePath = `signals/${slug}/${checksum}.webp`;
  const { error } = await supabase.storage.from("brief-images").upload(storagePath, normalized, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
  if (error && !/already exists|duplicate/i.test(error.message)) throw error;
  const { data } = supabase.storage.from("brief-images").getPublicUrl(storagePath);
  return { storagePath, publicUrl: data.publicUrl };
}

async function ensureSocialDrafts(packet: ReturnType<typeof dailySignalsPacketSchema.parse>, editionId: string, itemIds: Map<string, string>, supabase: SupabaseClient) {
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
  if (!platforms.includes("linkedin") || !platforms.includes("x")) throw new Error(`Edition ${editionId} must have verified LinkedIn and X examples.`);
  return { count: verified.length, platforms, inserted: missing.length };
}

async function main() {
const fileArg = process.argv.find((arg) => arg.startsWith("--file="))?.slice(7);
const apply = process.argv.includes("--apply");
const replaceHero = process.argv.includes("--replace-hero");
if (!fileArg) throw new Error("Use --file=/absolute/or/relative/path.json. Add --apply only after validation.");
const packet = dailySignalsPacketSchema.parse(JSON.parse(await readFile(path.resolve(fileArg), "utf8")));
assertSignalsEditorialVoice(packet);
const orderedItems = [...packet.items].sort((left, right) => left.storyPosition - right.storyPosition);

if (!apply) {
  console.log(JSON.stringify({ ok: true, mode: replaceHero ? "dry-run-hero-replacement" : "dry-run", editorialVoice: "passed", runId: packet.runId, slug: packet.slug, items: packet.items.length, sourceFamilies: packet.sourceFamilyCount, socialDraftCount: packet.socialDrafts.length, socialDraftPlatforms: [...new Set(packet.socialDrafts.map((draft) => draft.platform))].sort() }, null, 2));
  process.exit(0);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Publication requires NEXT_PUBLIC_SUPABASE_URL and the local-only SUPABASE_SERVICE_ROLE_KEY.");
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const { data: existing } = await supabase.from("signal_editions").select("id, slug, publication_status").eq("run_id", packet.runId).maybeSingle();
if (existing) {
  const { data: existingItems, error: existingItemsError } = await supabase.from("signal_items").select("id, slug").eq("edition_id", existing.id);
  if (existingItemsError) throw existingItemsError;
  const existingItemIds = new Map((existingItems ?? []).map((item) => [String(item.slug), String(item.id)]));
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
    await supabase.from("signal_runs").update({
      report: { slug: packet.slug, item_count: packet.items.length, hero_image: true, hero_image_replaced: true, editorial_voice: "passed", social_draft_count: socialDrafts.count, social_draft_platforms: socialDrafts.platforms }
    }).eq("run_id", packet.runId);
    console.log(JSON.stringify({ ok: true, mode: "hero-replaced", editionId: existing.id, slug: existing.slug, publicationStatus: existing.publication_status, socialDraftCount: socialDrafts.count, socialDraftPlatforms: socialDrafts.platforms, socialDraftsInserted: socialDrafts.inserted, url: `https://truenorthmap.ca/signals/${existing.slug}` }, null, 2));
    process.exit(0);
  }
  await supabase.from("signal_runs").update({ report: { slug: packet.slug, item_count: packet.items.length, hero_image: true, editorial_voice: "passed", social_draft_count: socialDrafts.count, social_draft_platforms: socialDrafts.platforms, social_drafts_repaired: socialDrafts.inserted } }).eq("run_id", packet.runId);
  console.log(JSON.stringify({ ok: true, mode: "idempotent", editionId: existing.id, slug: existing.slug, socialDraftCount: socialDrafts.count, socialDraftPlatforms: socialDrafts.platforms, socialDraftsInserted: socialDrafts.inserted }, null, 2));
  process.exit(0);
}

const cutoff = new Date(Date.now() - 30 * 86400_000).toISOString();
const { data: recentItems } = await supabase.from("signal_items").select("event_fingerprint, material_update, created_at").in("event_fingerprint", packet.items.map((item) => item.eventFingerprint)).gte("created_at", cutoff);
for (const item of packet.items) {
  if ((recentItems ?? []).some((row) => row.event_fingerprint === item.eventFingerprint) && !item.materialUpdate) throw new Error(`Repeated event without a material-update disposition: ${item.eventFingerprint}`);
}

await supabase.from("signal_runs").insert({ run_id: packet.runId, status: "started", inspected_count: packet.inspectedCount, selected_count: packet.items.length, source_family_count: packet.sourceFamilyCount });
let editionId: string | null = null;
let heroStoragePath: string | null = null;
try {
  const storedHero = await storeHeroImage(packet.heroImage, packet.slug, supabase);
  heroStoragePath = storedHero.storagePath;
  const { data: edition, error: editionError } = await supabase.from("signal_editions").insert({ slug: packet.slug, edition_date: packet.editionDate, title: packet.title, executive_summary: packet.executiveSummary, hero_image_path: storedHero.publicUrl, hero_image_source_url: packet.heroImage.sourcePageUrl, hero_image_alt: packet.heroImage.alt, hero_image_attribution: packet.heroImage.attribution, automation_disclosure: packet.disclosure, run_id: packet.runId, publication_status: "archived" }).select("id").single();
  if (editionError || !edition) throw editionError ?? new Error("Edition insert returned no ID.");
  editionId = String(edition.id);
  const itemIds = new Map<string, string>();
  for (const [position, item] of orderedItems.entries()) {
    const { data: insertedItem, error } = await supabase.from("signal_items").insert({ edition_id: editionId, slug: item.slug, position: position + 1, title: item.title, lane: item.lane, tags: item.tags, bottom_line: item.bottomLine, executive_summary: item.executiveSummary, source_fact: item.sourceFact, automated_read: item.automatedRead, unknowns: item.unknowns, next_step: item.nextStep, confidence: item.confidence, event_fingerprint: item.eventFingerprint, content_hash: item.contentHash, material_update: item.materialUpdate }).select("id").single();
    if (error || !insertedItem) throw error ?? new Error(`Item insert failed: ${item.slug}`);
    itemIds.set(item.slug, String(insertedItem.id));
    for (const [sourceOrder, source] of item.sources.entries()) {
      const { data: savedSource, error: sourceError } = await supabase.from("signal_sources").upsert({ canonical_url: source.canonicalUrl, title: source.title, publisher: source.publisher, published_at: source.publishedAt, source_family: source.sourceFamily, authority: source.authority, evidence_locator: source.evidenceLocator, evidence_excerpt: source.evidenceExcerpt, content_hash: source.contentHash, accessed_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "canonical_url" }).select("id").single();
      if (sourceError || !savedSource) throw sourceError ?? new Error(`Source insert failed: ${source.canonicalUrl}`);
      const { error: joinError } = await supabase.from("signal_item_sources").insert({ item_id: insertedItem.id, source_id: savedSource.id, is_primary: sourceOrder === 0, display_order: sourceOrder });
      if (joinError) throw joinError;
    }
    if (item.recordLinks.length) {
      const { error: linkError } = await supabase.from("signal_record_links").insert(item.recordLinks.map((link, index) => ({ item_id: insertedItem.id, record_type: link.recordType, record_id: link.recordId, relationship_label: link.relationshipLabel, public_href: link.publicHref, display_order: index })));
      if (linkError) throw linkError;
    }
  }
  const socialDrafts = await ensureSocialDrafts(packet, editionId, itemIds, supabase);
  const { error: publishError } = await supabase.from("signal_editions").update({ publication_status: "published", published_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", editionId);
  if (publishError) throw publishError;
  await supabase.from("signal_runs").update({ status: "published", edition_id: editionId, completed_at: new Date().toISOString(), report: { slug: packet.slug, item_count: packet.items.length, hero_image: true, editorial_voice: "passed", social_draft_count: socialDrafts.count, social_draft_platforms: socialDrafts.platforms } }).eq("run_id", packet.runId);
  console.log(JSON.stringify({ ok: true, mode: "published", editionId, slug: packet.slug, socialDraftCount: socialDrafts.count, socialDraftPlatforms: socialDrafts.platforms, url: `https://truenorthmap.ca/signals/${packet.slug}` }, null, 2));
} catch (error) {
  if (editionId) await supabase.from("signal_editions").delete().eq("id", editionId);
  if (heroStoragePath) await supabase.storage.from("brief-images").remove([heroStoragePath]);
  await supabase.from("signal_runs").update({ status: "failed", completed_at: new Date().toISOString(), report: { error: formatError(error) } }).eq("run_id", packet.runId);
  throw error;
}
}

void main().catch((error) => {
  console.error(formatError(error));
  process.exitCode = 1;
});
