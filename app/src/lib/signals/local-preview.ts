import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { dailySignalsPacketSchema, getSignalsExecutiveSummary, parseSignalsJson } from "@/lib/signals/contract";
import type { SignalEdition } from "@/lib/atlas/signals";
import { publishedSignalSource } from "@/lib/signals/public-projection";
import type { DailySignalsPacket } from "@/lib/signals/contract";

const previewRelativePaths = ["daily-signals-packet-v3.json", "daily-signals-packet-v2.json", "daily-signals-packet-v1.json"]
  .map((name) => path.join("research", "signals", "local", "preview", name));

function previewCandidates() {
  const configured = process.env.SIGNALS_PREVIEW_FILE?.trim();
  if (configured) return [path.resolve(configured)];
  return previewRelativePaths.flatMap((relative) => [path.resolve(process.cwd(), relative), path.resolve(process.cwd(), "..", relative)]);
}

export async function loadLocalSignalPacket(): Promise<DailySignalsPacket | null> {
  if (process.env.NODE_ENV !== "development") return null;

  for (const filePath of previewCandidates()) {
    try {
      const bytes = await readFile(filePath);
      return dailySignalsPacketSchema.parse(parseSignalsJson(bytes.toString("utf8")));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
      console.warn("Signals local preview could not be loaded.", error);
      return null;
    }
  }
  return null;
}

export async function loadLocalSignalPreview(): Promise<SignalEdition | null> {
  const packet = await loadLocalSignalPacket();
  if (!packet) return null;

  try { return signalPacketToPreview(packet); } catch (error) {
    console.warn("Signals local preview could not be rendered.", error);
    return null;
  }
}

export function signalPacketToPreview(packet: DailySignalsPacket): SignalEdition {
      const publishedAt = `${packet.editionDate}T11:00:00.000Z`;
      return {
        id: `preview:${packet.runId}`,
        slug: packet.slug,
        editionDate: packet.editionDate,
        title: packet.title,
        executiveSummary: getSignalsExecutiveSummary(packet),
        packetSchemaVersion: packet.schemaVersion,
        summarySections: packet.schemaVersion === "daily_signals_packet_v3" ? packet.summary : null,
        disclosure: packet.disclosure,
        authorName: "True North Map",
        publishedAt,
        amendedAt: null,
        updatedAt: publishedAt,
        isLocalPreview: true,
        heroImage: packet.heroImage ? {
          url: "/api/signals/preview-image",
          sourceUrl: packet.heroImage.sourcePageUrl,
          alt: packet.heroImage.alt,
          attribution: packet.heroImage.attribution
        } : null,
        items: [...packet.items].sort((left, right) => left.storyPosition - right.storyPosition).map((item, index) => ({
          id: `preview:${item.slug}`,
          slug: item.slug,
          position: index + 1,
          title: item.title,
          lane: item.lane,
          tags: item.tags,
          bottomLine: item.bottomLine,
          executiveSummary: item.executiveSummary,
          sourceFact: item.sourceFact,
          automatedRead: item.automatedRead,
          unknowns: item.unknowns,
          nextStep: item.nextStep,
          confidence: item.confidence,
          sources: item.sources.flatMap((source, sourceIndex) => {
            const publicSource = publishedSignalSource(`preview:${item.slug}:${sourceIndex}`, {
              schemaVersion: "signal_evidence_snapshot_v1", ...source
            }, null);
            return publicSource ? [publicSource] : [];
          }),
          links: item.recordLinks.map((link) => ({ type: link.recordType, id: link.recordId, label: link.relationshipLabel, href: link.publicHref }))
        }))
      };
}
