import type { SignalEdition } from "@/lib/atlas/signals";
import { signalPlainText } from "@/lib/signals/formatting";
import { signalEditionExcerpt } from "@/lib/signals/presentation";
import { collectSignalTags, getSignalTagLabel, type SignalTag } from "@/lib/signals/taxonomy";
import { signalLeadVisual, type SignalVisual } from "@/lib/signals/visuals";

/** The archive transports card/search data, not complete article evidence graphs. */
export type SignalArchiveEntry = Pick<SignalEdition, "id" | "slug" | "editionDate" | "title"> & {
  excerpt: string;
  tags: SignalTag[];
  visual: SignalVisual | null;
  searchableText: string;
};

export function projectSignalArchiveEdition(edition: SignalEdition): SignalArchiveEntry {
  return {
    id: edition.id, slug: edition.slug, editionDate: edition.editionDate, title: edition.title,
    excerpt: edition.summarySections ? signalEditionExcerpt(edition) : signalPlainText(edition.items[0]?.bottomLine || edition.executiveSummary),
    tags: collectSignalTags(edition.items),
    visual: signalLeadVisual(edition),
    // Preserve the existing full-archive substring search, including item-only
    // terms and tag labels. Article sources/links/qualifications stay server-side.
    searchableText: [edition.title, edition.executiveSummary, ...edition.items.flatMap((item) => [item.title, item.bottomLine, item.executiveSummary, ...item.tags.map(getSignalTagLabel)])].join(" ").toLocaleLowerCase("en-CA")
  };
}

export function filterSignalArchive(editions: SignalArchiveEntry[], query: string, selectedTag: SignalTag | null, featuredId?: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase("en-CA");
  const filtering = Boolean(normalizedQuery || selectedTag);
  return editions.filter((edition) => {
    if (!filtering && edition.id === featuredId) return false;
    if (selectedTag && !edition.tags.includes(selectedTag)) return false;
    return !normalizedQuery || edition.searchableText.includes(normalizedQuery);
  });
}
