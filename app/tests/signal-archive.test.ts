import { describe, expect, it } from "vitest";
import type { SignalEdition, SignalItem } from "@/lib/atlas/signals";
import { filterSignalArchive } from "@/lib/signals/archive";
import { paginate } from "@/lib/pagination";

const item: SignalItem = { id: "item", slug: "test-item", position: 1, title: "Kraken sonar trials", lane: "testing_program", tags: ["maritime", "testing"], bottomLine: "Seabed sensing", executiveSummary: "Field trials", sourceFact: "Published test", automatedRead: null, unknowns: null, nextStep: null, confidence: "high", sources: [], links: [] };
function edition(id: number): SignalEdition {
  return { id: String(id), slug: `edition-${id}`, editionDate: "2026-09-05", title: `Edition ${id}`, executiveSummary: "Defence developments", disclosure: "Read the sources", authorName: "True North Map", publishedAt: "2026-09-05T12:00:00Z", amendedAt: null, updatedAt: "2026-09-05T12:00:00Z", items: [{ ...item, id: `item-${id}` }], heroImage: null };
}

describe("Signals archive browsing", () => {
  const editions = Array.from({ length: 10 }, (_, index) => edition(index));
  it("keeps the featured edition out of the unfiltered archive, but searchable", () => {
    expect(filterSignalArchive(editions, "  ", null, "0").map((entry) => entry.id)).not.toContain("0");
    expect(filterSignalArchive(editions, "  KRAKEN  ", null, "0")).toHaveLength(10);
    expect(filterSignalArchive(editions, "", "testing", "0")).toHaveLength(10);
  });
  it("combines topic and text, including article text and tag labels", () => {
    expect(filterSignalArchive(editions, "sonar", "maritime")).toHaveLength(10);
    expect(filterSignalArchive(editions, "sonar", "air")).toEqual([]);
    expect(filterSignalArchive(editions, "TESTING", null)).toHaveLength(10);
    expect(filterSignalArchive(editions, "unmatched subject", null)).toEqual([]);
  });
  it("pages through every earlier edition exactly once and bounds the last page", () => {
    const filtered = filterSignalArchive(editions, "", null, "0");
    const pages = [1, 2, 3].map((page) => paginate(filtered, page, 4));
    expect(pages.map((page) => page.items.length)).toEqual([4, 4, 1]);
    expect(pages.flatMap((page) => page.items.map((entry) => entry.id))).toEqual(filtered.map((entry) => entry.id));
    expect(paginate(filtered, 99, 4).page).toBe(3);
    expect(paginate([], 3, 4)).toMatchObject({ page: 1, total: 0, items: [], start: 0, end: 0 });
  });
});
