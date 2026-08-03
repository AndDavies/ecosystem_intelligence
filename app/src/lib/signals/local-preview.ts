import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { dailySignalsPacketSchema } from "@/lib/signals/contract";
import type { SignalEdition } from "@/lib/atlas/signals";
import type { DailySignalsPacket } from "@/lib/signals/contract";

const previewRelativePath = path.join("research", "signals", "local", "preview", "daily-signals-packet-v1.json");

function previewCandidates() {
  const configured = process.env.SIGNALS_PREVIEW_FILE;
  return [
    configured ? path.resolve(configured) : null,
    path.resolve(process.cwd(), previewRelativePath),
    path.resolve(process.cwd(), "..", previewRelativePath)
  ].filter((candidate): candidate is string => Boolean(candidate));
}

export async function loadLocalSignalPacket(): Promise<DailySignalsPacket | null> {
  if (process.env.NODE_ENV !== "development") return null;

  for (const filePath of previewCandidates()) {
    try {
      return dailySignalsPacketSchema.parse(JSON.parse(await readFile(filePath, "utf8")));
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

  try {
      const publishedAt = `${packet.editionDate}T11:00:00.000Z`;
      return {
        id: `preview:${packet.runId}`,
        slug: packet.slug,
        editionDate: packet.editionDate,
        title: packet.title,
        executiveSummary: packet.executiveSummary,
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
          sources: item.sources.map((source, sourceIndex) => ({
            id: `preview:${item.slug}:${sourceIndex}`,
            title: source.title,
            publisher: source.publisher,
            url: source.canonicalUrl,
            publishedAt: source.publishedAt,
            locator: source.evidenceLocator
          })),
          links: item.recordLinks.map((link) => ({ type: link.recordType, id: link.recordId, label: link.relationshipLabel, href: link.publicHref }))
        }))
      };
  } catch (error) {
    console.warn("Signals local preview could not be rendered.", error);
    return null;
  }
}
