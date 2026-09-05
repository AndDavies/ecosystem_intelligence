import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { findPublishedOrganizationIds } from "@/lib/atlas/admin-organization-search";
import { collectPagedRows, collectPagedRowsByIds } from "@/lib/supabase/pagination";

type Row = Record<string, unknown>;
function database(tables: Record<string, Row[]>, failPage = false) {
  const batchSizes: number[] = [];
  const client = { from(table: string) {
    const filters: ((row: Row) => boolean)[] = [];
    const builder = {
      select: () => builder, order: () => builder,
      eq: (key: string, value: unknown) => { filters.push((row) => row[key] === value); return builder; },
      ilike: (key: string, value: string) => { filters.push((row) => String(row[key] ?? "").toLowerCase().includes(value.slice(1, -1).toLowerCase())); return builder; },
      in: (key: string, values: unknown[]) => { batchSizes.push(values.length); filters.push((row) => values.includes(row[key])); return builder; },
      range: (from: number, to: number) => {
        const promise = Promise.resolve(failPage && from >= 1000
          ? { data: null, error: { message: "page unavailable" } }
          : { data: (tables[table] ?? []).filter((row) => filters.every((filter) => filter(row))).slice(from, to + 1), error: null });
        return Object.assign(promise, { returns: () => promise });
      }
    };
    return builder;
  }};
  return { client: client as unknown as SupabaseClient, batchSizes };
}

describe("complete Admin organization search", () => {
  it("searches names, legal names, tags, locations and domains beyond the first page", async () => {
    const published = { publication_status: "published" };
    const tables: Record<string, Row[]> = {
      organizations: Array.from({ length: 1105 }, (_, id) => ({ id: `name-${id}`, name: "Radar", ...published })),
      capabilities: Array.from({ length: 1105 }, (_, id) => ({ id: `cap-${id}`, organization_id: `domain-org-${id}`, technical_tags: id === 1104 ? ["Radar"] : [], ...published })),
      technical_domains: [{ id: "domain", name: "Radar", ...published }],
      capability_domains: Array.from({ length: 1105 }, (_, id) => ({ capability_id: `cap-${id}`, technical_domain_id: "domain", ...published })),
      locations: [{ id: "location", city: "Radar Bay" }],
      organization_locations: Array.from({ length: 1105 }, (_, id) => ({ organization_id: `location-org-${id}`, location_id: "location", ...published }))
    };
    tables.organizations.push({ id: "legal", legal_name: "Radar Incorporated", ...published }, { id: "private", name: "Radar", publication_status: "draft" });
    tables.capabilities.push({ id: "tag-only", organization_id: "tag-only", technical_tags: ["Radar"], ...published });
    const { client, batchSizes } = database(tables);
    const ids = await findPublishedOrganizationIds(client, "radar");
    expect(ids).toHaveLength(1105 * 3 + 2);
    expect(ids).toEqual(expect.arrayContaining(["name-1104", "domain-org-1104", "location-org-1104", "legal", "tag-only"]));
    expect(ids).not.toContain("private");
    expect(Math.max(...batchSizes)).toBeLessThanOrEqual(100);
  });
  it("rejects incomplete search pages instead of reporting a false empty or clear result", async () => {
    const tables = { organizations: Array.from({ length: 1105 }, (_, id) => ({ id, name: "Radar", publication_status: "published" })) };
    await expect(findPublishedOrganizationIds(database(tables, true).client, "radar")).rejects.toThrow("page unavailable");
  });
  it("reads all duplicate-check rows and fails closed on a later page", async () => {
    const rows = Array.from({ length: 1105 }, (_, id) => ({ id }));
    expect(await collectPagedRows(async (from, to) => ({ data: rows.slice(from, to + 1), error: null }), "duplicates")).toHaveLength(1105);
    await expect(collectPagedRows(async (from) => from ? { data: null, error: { message: "offline" } } : { data: rows.slice(0, 1000), error: null }, "duplicates")).rejects.toThrow("offline");
  });
  it("does no database work for an empty ID scope", async () => {
    expect(await collectPagedRowsByIds([], () => { throw new Error("must not query"); }, "empty selection")).toEqual([]);
  });
});
