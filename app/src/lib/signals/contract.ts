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

export const dailySignalsPacketSchema = z.discriminatedUnion("schemaVersion", [
  dailySignalsPacketV1Schema,
  dailySignalsPacketV2Schema
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
  if (!packet.items.some((entry) => entry.sources.some((entrySource) => entrySource.canonicalUrl === packet.heroImage.sourcePageUrl))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["heroImage", "sourcePageUrl"], message: "The hero image must resolve to one of the edition's durable source pages." });
  }
  for (const platform of ["linkedin", "x"] as const) {
    if (!packet.socialDrafts.some((draft) => draft.platform === platform)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["socialDrafts"], message: `A private ${platform === "linkedin" ? "LinkedIn" : "X"} example is required for every publishable edition.` });
    }
  }
  const itemSlugs = new Set(packet.items.map((entry) => entry.slug));
  packet.socialDrafts.forEach((draft, index) => {
    if (draft.itemSlug && !itemSlugs.has(draft.itemSlug)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["socialDrafts", index, "itemSlug"], message: "A social example may reference only an item in this edition." });
    }
  });
});

export type DailySignalsPacket = z.infer<typeof dailySignalsPacketSchema>;
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
  if (packet.schemaVersion !== "daily_signals_packet_v2") {
    throw new Error("daily_signals_packet_v1 is historical-repair only; every new Signals edition requires daily_signals_packet_v2 with exactly eight qualifying developments.");
  }
}
