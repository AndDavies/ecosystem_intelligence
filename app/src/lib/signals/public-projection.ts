import "server-only";

import type { SignalSource } from "@/lib/atlas/signals";
import { signalSummarySchema } from "@/lib/signals/contract";
import { signalSupportLabels } from "@/lib/signals/presentation";

type Row = Record<string, unknown>;

export function nullableSignalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function publicDate(value: unknown) {
  const text = nullableSignalText(value);
  return text && Number.isFinite(Date.parse(text)) ? text : null;
}

export function publishedSignalSummary(version: unknown, value: unknown) {
  if (version !== "daily_signals_packet_v3") return null;
  const parsed = signalSummarySchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** An explicit public projection: never serialize the snapshot or source row. */
export function publishedSignalSource(id: string, snapshot: unknown, legacy: Row | null): SignalSource | null {
  const saved = snapshot && typeof snapshot === "object" && !Array.isArray(snapshot) ? snapshot as Row : null;
  const source = saved?.schemaVersion === "signal_evidence_snapshot_v1" ? saved : null;
  if (!source && !legacy) return null;
  const url = nullableSignalText(source ? source.canonicalUrl : legacy?.canonical_url);
  const title = nullableSignalText(source ? source.title : legacy?.title);
  const publisher = nullableSignalText(source ? source.publisher : legacy?.publisher);
  if (!url?.startsWith("https://") || !title || !publisher) return null;
  const supportType = nullableSignalText(source?.supportType);
  return {
    id,
    title,
    publisher,
    url,
    publishedAt: publicDate(source ? source.publishedAt : legacy?.published_at),
    locator: nullableSignalText(source ? source.evidenceLocator : legacy?.evidence_locator) ?? "",
    accessedAt: publicDate(source?.accessedAt),
    supportType: supportType && Object.hasOwn(signalSupportLabels, supportType) ? supportType as NonNullable<SignalSource["supportType"]> : null
  };
}

