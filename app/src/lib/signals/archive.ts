import type { SignalEdition } from "@/lib/atlas/signals";
import { collectSignalTags, getSignalTagLabel, type SignalTag } from "@/lib/signals/taxonomy";

export function filterSignalArchive(editions: SignalEdition[], query: string, selectedTag: SignalTag | null, featuredId?: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase("en-CA");
  const filtering = Boolean(normalizedQuery || selectedTag);
  return editions.filter((edition) => {
    if (!filtering && edition.id === featuredId) return false;
    if (selectedTag && !collectSignalTags(edition.items).includes(selectedTag)) return false;
    if (!normalizedQuery) return true;
    const searchable = [edition.title, edition.executiveSummary, ...edition.items.flatMap((item) => [item.title, item.bottomLine, item.executiveSummary, ...item.tags.map(getSignalTagLabel)])].join(" ").toLocaleLowerCase("en-CA");
    return searchable.includes(normalizedQuery);
  });
}
