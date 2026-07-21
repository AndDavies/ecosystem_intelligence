import { createHash } from "node:crypto";
import { z } from "zod";

export const DEFENCE_WIKI_PACKET_VERSION = "defence-source-packet-v1" as const;

export const defenceSelectionReasonValues = [
  "defence_event",
  "defence_concept",
  "defence_label",
  "source_book_fit",
  "published_evidence",
  "manual_include"
] as const;

export const defenceSourcePacketV1Schema = z.object({
  schemaVersion: z.literal(DEFENCE_WIKI_PACKET_VERSION),
  packetId: z.string().min(3),
  sourceSystem: z.enum(["crashboard", "true_north_map", "manual"]),
  sourceRecordIds: z.array(z.string().min(1)).min(1),
  sourceKind: z.string().min(1),
  title: z.string().min(1),
  publisher: z.string().min(1),
  sourceFamily: z.string().min(1),
  authorityTier: z.enum(["primary", "specialist", "aggregator", "community", "unknown"]),
  canonicalUrl: z.string().url().nullable(),
  publishedAt: z.string().datetime().nullable(),
  capturedAt: z.string().datetime().nullable(),
  relevantExcerpt: z.string().max(2400),
  summary: z.string().max(1600).nullable(),
  selectionReasons: z.array(z.enum(defenceSelectionReasonValues)).min(1),
  defenceRelevanceReason: z.string().min(1),
  canadaRelevanceReason: z.string().nullable(),
  concepts: z.array(z.string()),
  entities: z.array(z.string()),
  geography: z.array(z.string()),
  labels: z.array(z.string()),
  sourceConfidence: z.enum(["high", "moderate", "needs_review"]),
  evidenceRole: z.enum(["primary", "supporting", "contradicting", "discovery_lead", "context", "research_lead"]),
  freshness: z.enum(["current", "review_due", "stale", "unknown"]),
  claimRisk: z.enum(["durable", "mixed", "time_sensitive", "needs_verification"]),
  visibility: z.enum(["public", "permissioned", "internal"]),
  reusePolicy: z.enum(["public_reference", "citation_only", "internal_only"]),
  needsVerification: z.boolean(),
  relatedTrueNorthIds: z.array(z.string()),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/),
  generatedAt: z.string().datetime()
});

export type DefenceSourcePacketV1 = z.infer<typeof defenceSourcePacketV1Schema>;

export function compactWikiText(value: unknown, maxLength: number) {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  const sliced = normalized.slice(0, maxLength - 1);
  const lastSpace = sliced.lastIndexOf(" ");
  return `${(lastSpace > maxLength / 2 ? sliced.slice(0, lastSpace) : sliced).trim()}…`;
}

export function stableWikiPacketHash(value: Omit<DefenceSourcePacketV1, "contentHash" | "generatedAt">) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function safeWikiSourceUrl(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:") return null;
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
}
