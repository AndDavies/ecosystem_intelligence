import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ tables: {} as Record<string, Record<string, unknown>[]>, failLater: false, batchSizes: [] as number[] }));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("@/lib/supabase/public", () => ({ createPublicClient: () => ({ from: (table: string) => {
  const filters: ((row: Record<string, unknown>) => boolean)[] = [];
  const builder = {
    select: () => builder, order: () => builder,
    eq: (key: string, value: unknown) => { filters.push(row => row[key] === value); return builder; },
    in: (key: string, values: unknown[]) => { state.batchSizes.push(values.length); filters.push(row => values.includes(row[key])); return builder; },
    range: async (from: number, to: number) => state.failLater && table === "signal_record_links" && from >= 1000
      ? { data: null, error: { message: "unavailable" } }
      : { data: (state.tables[table] ?? []).filter(row => filters.every(filter => filter(row))).slice(from, to + 1), error: null },
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: (state.tables[table] ?? []).filter(row => filters.every(filter => filter(row))).slice(0, 1000), error: null }).then(resolve)
  };
  return builder;
}}) }));
import { getPublishedSignalsForRecord } from "@/lib/atlas/signals";
beforeEach(() => {
  state.failLater = false; state.batchSizes = [];
  const published = { publication_status: "published" };
  state.tables = {
    organizations: [{ id: "organization", slug: "organization", ...published }],
    signal_record_links: Array.from({ length: 1105 }, (_, i) => ({ id: `link-${i}`, item_id: `item-${i}`, record_type: "organization", record_id: "organization", relationship_label: "Published record", public_href: "/organizations/organization" })),
    signal_items: Array.from({ length: 1105 }, (_, i) => ({ id: `item-${i}`, edition_id: `edition-${i}`, ...published })),
    signal_editions: Array.from({ length: 1105 }, (_, i) => ({ id: `edition-${i}`, slug: `edition-${i}`, edition_date: new Date(Date.UTC(2020, 0, i + 1)).toISOString().slice(0, 10), ...published }))
  };
});
describe("record-linked Signals selection", () => {
  it("finds the latest four editions across every link without changing the displayed count", async () => {
    const editions = await getPublishedSignalsForRecord("organization", "organization");
    expect(editions.map(edition => edition.id)).toEqual(["edition-1104", "edition-1103", "edition-1102", "edition-1101"]);
    expect(Math.max(...state.batchSizes)).toBeLessThanOrEqual(100);
  });
  it("keeps unpublished editions out of the latest selection", async () => {
    state.tables.signal_editions.at(-1)!.publication_status = "draft";
    expect((await getPublishedSignalsForRecord("organization", "organization"))[0].id).toBe("edition-1103");
  });
  it("does not present an incomplete first page as the latest related stream", async () => {
    state.failLater = true;
    expect(await getPublishedSignalsForRecord("organization", "organization")).toEqual([]);
  });
});
