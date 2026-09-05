import { z } from "zod";
import { signalTagIds } from "@/lib/signals/taxonomy";

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(20).max(90).refine((value) => value.split("-").length >= 5 && value.split("-").length <= 12, "Use a concise descriptive slug.");
const source = z.object({ canonicalUrl: z.string().url().startsWith("https://"), title: z.string().trim().min(4).max(240), publisher: z.string().trim().min(2).max(160), publishedAt: z.string().datetime().nullable().default(null), sourceFamily: z.string().trim().min(2).max(100), authority: z.enum(["primary", "official", "specialist"]), evidenceLocator: z.string().trim().min(3).max(300), evidenceExcerpt: z.string().trim().min(20).max(1000), contentHash: z.string().trim().min(16).max(128) });
const recordLink = z.object({ recordType: z.enum(["organization", "capability", "demand_requirement", "mission_area"]), recordId: z.string().uuid(), relationshipLabel: z.string().trim().min(3).max(160), publicHref: z.string().regex(/^\/(organizations|capabilities|demand|missions)\/[a-z0-9-]+$/) });
const item = z.object({ slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(8).max(100), storyPosition: z.number().int().min(1).max(8), title: z.string().trim().min(8).max(180), lane: z.enum(["public_need_procurement", "company_capability", "funding_industrial_capacity", "testing_program", "allied_benchmark"]), tags: z.array(z.enum(signalTagIds)).min(1).max(6), bottomLine: z.string().trim().min(30).max(500), executiveSummary: z.string().trim().min(450).max(2200), sourceFact: z.string().trim().min(30).max(900), automatedRead: z.string().trim().min(30).max(900), unknowns: z.string().trim().min(20).max(600), nextStep: z.string().trim().min(20).max(500), confidence: z.enum(["high", "medium", "limited"]), eventFingerprint: z.string().trim().min(8).max(240), contentHash: z.string().trim().min(16).max(128), materialUpdate: z.boolean().default(false), sources: z.array(source).min(1).max(6), recordLinks: z.array(recordLink).max(12).default([]) });
const heroImage = z.object({
  imageUrl: z.string().url().startsWith("https://"),
  sourcePageUrl: z.string().url().startsWith("https://"),
  alt: z.string().trim().min(12).max(240),
  attribution: z.string().trim().min(3).max(240)
});
const socialDraft = z.object({
  platform: z.enum(["linkedin", "x"]),
  itemSlug: z.string().nullable().default(null),
  text: z.string().trim().min(20).max(5000)
});

const dailySignalsPacketBaseShape = {
  runId: z.string().trim().min(8).max(160),
  editionDate: z.string().date(), slug, title: z.string().trim().min(12).max(180), executiveSummary: z.string().trim().min(400).max(1800),
  disclosure: z.string().trim().min(40).max(500), inspectedCount: z.number().int().min(0), sourceFamilyCount: z.number().int().min(3),
  heroImage,
  socialDrafts: z.array(socialDraft).min(2).max(20)
};

const dailySignalsNoPublishGate = z.enum([
  "fewer_than_eight",
  "duplicate_event",
  "source_evidence",
  "source_diversity",
  "hero_image",
  "editorial_voice",
  "social_drafts",
  "edition_coherence",
  "other"
]);

export const dailySignalsNoPublishSchema = z.object({
  schemaVersion: z.literal("daily_signals_no_publish_v1"),
  runId: z.string().trim().min(8).max(160),
  editionDate: z.string().date(),
  inspectedCount: z.number().int().min(0),
  qualifiedCount: z.number().int().min(0).max(8),
  sourceFamilyCount: z.number().int().min(0),
  blockingGates: z.array(dailySignalsNoPublishGate).min(1).max(9),
  rationale: z.string().trim().min(40).max(1200)
}).superRefine((record, ctx) => {
  if (record.qualifiedCount > record.inspectedCount) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["qualifiedCount"], message: "qualifiedCount cannot exceed inspectedCount." });
  }
  if (new Set(record.blockingGates).size !== record.blockingGates.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["blockingGates"], message: "No-publish blocking gates must be unique." });
  }
  if (record.qualifiedCount < 8 && !record.blockingGates.includes("fewer_than_eight")) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["blockingGates"], message: "A run with fewer than eight qualified developments must record fewer_than_eight." });
  }
  if (record.qualifiedCount === 8 && record.blockingGates.includes("fewer_than_eight")) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["blockingGates"], message: "fewer_than_eight is invalid when eight developments qualified; record the actual edition-level blocker." });
  }
});

const dailySignalsPacketV1Schema = z.object({
  schemaVersion: z.literal("daily_signals_packet_v1"),
  ...dailySignalsPacketBaseShape,
  items: z.array(item).min(6).max(8)
});

const dailySignalsPacketV2Schema = z.object({
  schemaVersion: z.literal("daily_signals_packet_v2"),
  ...dailySignalsPacketBaseShape,
  items: z.array(item).length(8)
});


/** Free prose is bounded by the packet byte limit, not editorial word quotas. */
const prose = z.string().trim().min(1);
export const signalSummarySchema = z.object({ opening: prose, takeaway: prose, limitation: prose.nullable().default(null) });
export type SignalsSummary = z.infer<typeof signalSummarySchema>;
export const signalSupportTypes = ["direct_record", "attributed_statement", "original_reporting", "corroboration"] as const;
export const signalV3SourceSchema = source.extend({ supportType: z.enum(signalSupportTypes), accessedAt: z.string().datetime() });
export const signalV3EditorialItemShape = {
  title: item.shape.title,
  bottomLine: prose,
  executiveSummary: prose,
  sourceFact: prose,
  automatedRead: prose.nullable().default(null),
  unknowns: prose.nullable().default(null),
  nextStep: prose.nullable().default(null),
  confidence: item.shape.confidence,
  tags: item.shape.tags
};
export const signalEditionEditorialSchemaV3 = z.object({ title: dailySignalsPacketBaseShape.title, summary: signalSummarySchema });
export const signalItemEditorialSchemaV3 = z.object(signalV3EditorialItemShape);
export const signalEditionEditorialSchemaLegacy = z.object({ title: dailySignalsPacketBaseShape.title, executiveSummary: dailySignalsPacketBaseShape.executiveSummary });
export const signalItemEditorialSchemaLegacy = item.pick({ title: true, bottomLine: true, executiveSummary: true, tags: true, sourceFact: true, automatedRead: true, unknowns: true, nextStep: true, confidence: true });
const signalV3ItemSchema = item.extend({
  ...signalV3EditorialItemShape,
  storyPosition: z.number().int().positive().max(2147483647),
  sources: z.array(signalV3SourceSchema).min(1),
  materialUpdateReason: prose.nullable().default(null)
});
const dailySignalsPacketV3Schema = z.object({
  schemaVersion: z.literal("daily_signals_packet_v3"),
  runId: dailySignalsPacketBaseShape.runId,
  editionDate: dailySignalsPacketBaseShape.editionDate,
  slug: dailySignalsPacketBaseShape.slug,
  title: dailySignalsPacketBaseShape.title,
  summary: signalSummarySchema,
  disclosure: dailySignalsPacketBaseShape.disclosure,
  inspectedCount: dailySignalsPacketBaseShape.inspectedCount,
  sourceFamilyCount: z.number().int().nonnegative().optional(),
  heroImage: heroImage.nullable().default(null),
  socialDrafts: z.array(socialDraft).default([]),
  items: z.array(signalV3ItemSchema).min(1)
});

export const dailySignalsRunOutcomeSchema = z.object({
  schemaVersion: z.literal("daily_signals_run_outcome_v2"),
  runId: dailySignalsPacketBaseShape.runId,
  editionDate: dailySignalsPacketBaseShape.editionDate,
  outcome: z.enum(["no_publish", "blocked", "failed"]),
  inspectedCount: z.number().int().nonnegative(),
  qualifiedCount: z.number().int().nonnegative(),
  sourceFamilyCount: z.number().int().nonnegative(),
  coverageComplete: z.boolean(),
  reason: prose,
  resumable: z.boolean().default(false)
}).superRefine((record, ctx) => {
  if (record.qualifiedCount > record.inspectedCount) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["qualifiedCount"], message: "qualifiedCount cannot exceed inspectedCount." });
  if (record.outcome === "no_publish" && !record.coverageComplete) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["coverageComplete"], message: "Incomplete collection is blocked or failed, not an editorial no_publish decision." });
});
export type DailySignalsRunOutcome = z.infer<typeof dailySignalsRunOutcomeSchema>;
export const SIGNALS_PACKET_MAX_BYTES = 1024 * 1024;
export function parseSignalsJson(text: string): unknown {
  if (new TextEncoder().encode(text).byteLength > SIGNALS_PACKET_MAX_BYTES) throw new Error("Signals input exceeds the 1 MiB operational packet limit.");
  return JSON.parse(text) as unknown;
}

export const dailySignalsPacketSchema = z.discriminatedUnion("schemaVersion", [
  dailySignalsPacketV1Schema,
  dailySignalsPacketV2Schema,
  dailySignalsPacketV3Schema
]).superRefine((packet, ctx) => {
  const fingerprints = new Set<string>();
  const positions = new Set<number>();
  packet.items.forEach((entry, index) => {
    if (fingerprints.has(entry.eventFingerprint)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["items", index, "eventFingerprint"], message: "Duplicate event fingerprint in one edition." });
    fingerprints.add(entry.eventFingerprint);
    if (positions.has(entry.storyPosition)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["items", index, "storyPosition"], message: "Story positions must be unique." });
    positions.add(entry.storyPosition);
  });
  const expectedPositions = Array.from({ length: packet.items.length }, (_, index) => index + 1);
  if (expectedPositions.some((position) => !positions.has(position))) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["items"], message: "Story positions must form a contiguous sequence from 1 through the item count." });
  if (packet.schemaVersion === "daily_signals_packet_v2") {
    const primarySourceUrls = packet.items.map((entry) => entry.sources[0]?.canonicalUrl);
    if (new Set(primarySourceUrls).size !== packet.items.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["items"], message: "Every v2 signal needs a distinct primary durable source page." });
    }
    const computedSourceFamilyCount = new Set(packet.items.flatMap((entry) => entry.sources.map((entrySource) => entrySource.sourceFamily))).size;
    if (packet.sourceFamilyCount !== computedSourceFamilyCount) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["sourceFamilyCount"], message: `sourceFamilyCount must equal the ${computedSourceFamilyCount} source families present in the packet.` });
    }
  }
  if (packet.heroImage && !packet.items.some((entry) => entry.sources.some((entrySource) => entrySource.canonicalUrl === packet.heroImage?.sourcePageUrl))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["heroImage", "sourcePageUrl"], message: "The hero image must resolve to one of the edition's durable source pages." });
  }
  for (const platform of packet.schemaVersion === "daily_signals_packet_v3" ? [] : ["linkedin", "x"] as const) {
    if (!packet.socialDrafts.some((draft) => draft.platform === platform)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["socialDrafts"], message: `A private ${platform === "linkedin" ? "LinkedIn" : "X"} example is required for every publishable edition.` });
    }
  }
  const itemSlugs = new Set(packet.items.map((entry) => entry.slug));
  if (itemSlugs.size !== packet.items.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["items"], message: "Item slugs must be unique within an edition." });
  if (packet.schemaVersion === "daily_signals_packet_v3") {
    packet.items.forEach((entry, index) => {
      if (new Set(entry.sources.map((entrySource) => entrySource.canonicalUrl)).size !== entry.sources.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["items", index, "sources"], message: "List a source URL once within an item; distinct items may share a source." });
      if (entry.materialUpdate && !entry.materialUpdateReason) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["items", index, "materialUpdateReason"], message: "Explain the actual change when repeating an event." });
    });
  }
  packet.socialDrafts.forEach((draft, index) => {
    if (draft.itemSlug && !itemSlugs.has(draft.itemSlug)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["socialDrafts", index, "itemSlug"], message: "A social example may reference only an item in this edition." });
    }
  });
}).transform((packet) => packet.schemaVersion === "daily_signals_packet_v3" ? { ...packet, sourceFamilyCount: new Set(packet.items.flatMap((entry) => entry.sources.map((entrySource) => entrySource.sourceFamily))).size } : packet);

export type DailySignalsPacket = z.infer<typeof dailySignalsPacketSchema>;
export type DailySignalsPacketV3 = Extract<DailySignalsPacket, { schemaVersion: "daily_signals_packet_v3" }>;
export type SignalEvidenceSnapshot = z.infer<typeof signalV3SourceSchema> & { schemaVersion: "signal_evidence_snapshot_v1" };
export function getSignalsExecutiveSummary(packet: DailySignalsPacket) {
  return packet.schemaVersion === "daily_signals_packet_v3" ? [packet.summary.opening, packet.summary.takeaway, packet.summary.limitation].filter(Boolean).join("\n\n") : packet.executiveSummary;
}
export function getSignalsSourceFamilyCount(packet: DailySignalsPacket) { return packet.sourceFamilyCount; }

export type DailySignalsNoPublish = z.infer<typeof dailySignalsNoPublishSchema>;

export function assertNewDailySignalsRunAvailable(
  existingRun: { status: unknown; edition_id: unknown } | null,
  runId: string
) {
  if (!existingRun) return;
  throw new Error(`Run ${runId} already exists with status ${String(existingRun.status)} and cannot create a new Signals edition.`);
}

export function assertExistingDailySignalsRunMatchesEdition(
  existingRun: { status: unknown; edition_id: unknown } | null,
  editionId: string,
  runId: string
) {
  if (!existingRun || existingRun.status !== "published" || String(existingRun.edition_id) !== editionId) {
    throw new Error(`Run ${runId} does not match the existing published edition; repair is blocked before any write.`);
  }
}

export function assertNewDailySignalsPacketVersion(packet: DailySignalsPacket) {
  if (packet.schemaVersion !== "daily_signals_packet_v3") {
    throw new Error("daily_signals_packet_v1 and daily_signals_packet_v2 are historical-repair only; every new Signals edition requires daily_signals_packet_v3.");
  }
}

export function assertHistoricalSignalsEdition(existing: { packet_schema_version?: unknown }) {
  if (existing.packet_schema_version === "daily_signals_packet_v3") throw new Error("A historical v1/v2 packet cannot repair a v3 edition; use its v3 packet or Admin correction.");
}
