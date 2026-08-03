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

export const dailySignalsPacketSchema = z.object({
  schemaVersion: z.literal("daily_signals_packet_v1"), runId: z.string().trim().min(8).max(160),
  editionDate: z.string().date(), slug, title: z.string().trim().min(12).max(180), executiveSummary: z.string().trim().min(400).max(1800),
  disclosure: z.string().trim().min(40).max(500), inspectedCount: z.number().int().min(0), sourceFamilyCount: z.number().int().min(3),
  heroImage,
  items: z.array(item).min(5).max(8),
  socialDrafts: z.array(z.object({ platform: z.enum(["linkedin", "x"]), itemSlug: z.string().nullable().default(null), text: z.string().trim().min(20).max(5000) })).max(20).default([])
}).superRefine((packet, ctx) => {
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
  if (!packet.items.some((entry) => entry.sources.some((entrySource) => entrySource.canonicalUrl === packet.heroImage.sourcePageUrl))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["heroImage", "sourcePageUrl"], message: "The hero image must resolve to one of the edition's durable source pages." });
  }
});

export type DailySignalsPacket = z.infer<typeof dailySignalsPacketSchema>;
