import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  version: "daily_signals_packet_v3" as string | null,
  readError: null as unknown,
  saveError: null as unknown,
  writes: [] as Array<{ table: string; values: Record<string, unknown> }>,
  filters: [] as Array<[string, unknown]>,
  requireStaff: vi.fn(async () => ({ id: "admin-1" })),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn()
}));

vi.mock("@/lib/atlas/auth", () => ({ requireAtlasStaff: state.requireStaff }));
vi.mock("next/navigation", () => ({ redirect: (href: string) => { throw new Error(`redirect:${href}`); } }));
vi.mock("next/cache", () => ({ revalidatePath: state.revalidatePath, revalidateTag: state.revalidateTag }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({
  from: (table: string) => ({
    select: () => {
      const query = {
        eq: (column: string, value: unknown) => { state.filters.push([column, value]); return query; },
        single: async () => ({ error: state.readError, data: state.readError ? null : table === "signal_editions" ? { slug: "a-stable-published-edition-slug", packet_schema_version: state.version } : { edition_id: "b63a4ba1-3d1a-4a65-b19d-8bb5e3e4a946", signal_editions: { slug: "a-stable-published-edition-slug", packet_schema_version: state.version } } })
      };
      return query;
    },
    update: (values: Record<string, unknown>) => { state.writes.push({ table, values }); return { eq: async () => ({ error: state.saveError }) }; },
    insert: async (values: Record<string, unknown>) => { state.writes.push({ table, values }); return { error: null }; }
  })
}) }));

import { updateSignalEdition, updateSignalItem } from "@/lib/actions/signals-admin";

const editionId = "b63a4ba1-3d1a-4a65-b19d-8bb5e3e4a946";
const itemId = "5f3289ea-7750-4d24-8e1d-a75490562348";
function editionForm() {
  const form = new FormData();
  Object.entries({ editionId, title: "The corrected published edition", opening: "The substantial opening.", takeaway: "The concise consequence.", limitation: "", publicationStatus: "archived", schemaVersion: "daily_signals_packet_v3" }).forEach(([name, value]) => form.set(name, value));
  return form;
}
function itemForm() {
  const form = new FormData();
  Object.entries({ itemId, editionId, title: "The corrected development", bottomLine: "A changed implication.", executiveSummary: "A substantial narrative. ".repeat(150), sourceFact: "The record establishes a dated decision.", automatedRead: "", unknowns: "", nextStep: "", confidence: "medium" }).forEach(([name, value]) => form.set(name, value));
  form.append("tags", "procurement");
  return form;
}

beforeEach(() => {
  state.version = "daily_signals_packet_v3";
  state.readError = null;
  state.saveError = null;
  state.writes.length = 0;
  state.filters.length = 0;
  vi.clearAllMocks();
});

describe("versioned Signals admin actions", () => {
  it("archives the existing v3 edition with matching summary projection and an audit event", async () => {
    await expect(updateSignalEdition(editionForm())).rejects.toThrow("success=edition-saved");
    expect(state.requireStaff).toHaveBeenCalledWith("admin");
    const update = state.writes.find((write) => write.table === "signal_editions")!;
    expect(update.values).toMatchObject({ publication_status: "archived", summary_sections: { opening: "The substantial opening.", takeaway: "The concise consequence.", limitation: null }, executive_summary: "The substantial opening.\n\nThe concise consequence.", reviewed_by: "admin-1" });
    expect(update.values).not.toHaveProperty("published_at");
    expect(update.values).not.toHaveProperty("slug");
    expect(state.writes).toContainEqual(expect.objectContaining({ table: "audit_events", values: expect.objectContaining({ event_type: "signal_edition_updated" }) }));
    expect(state.revalidateTag).toHaveBeenCalledWith("signals-public");
    expect(state.revalidatePath).toHaveBeenCalledWith("/signals/feed.xml");
  });

  it("uses the database version instead of a forged form version", async () => {
    state.version = null;
    await expect(updateSignalEdition(editionForm())).rejects.toThrow("error=invalid-edition");
    expect(state.writes).toEqual([]);
  });

  it("corrects long v3 narrative and nullable fields without changing evidence snapshots", async () => {
    await expect(updateSignalItem(itemForm())).rejects.toThrow("success=item-saved");
    expect(state.filters).toContainEqual(["edition_id", editionId]);
    const update = state.writes.find((write) => write.table === "signal_items")!;
    expect(String(update.values.executive_summary).length).toBeGreaterThan(2200);
    expect(update.values).toMatchObject({ automated_read: null, unknowns: null, next_step: null });
    expect(state.writes.map((write) => write.table)).toEqual(["signal_items", "signal_editions", "audit_events"]);
    expect(state.writes[1].values).toHaveProperty("amended_at");
  });

  it("does not write when the stored edition cannot be read or refresh public caches after a failed save", async () => {
    state.readError = { message: "Unavailable" };
    await expect(updateSignalEdition(editionForm())).rejects.toThrow("error=edition-unavailable");
    expect(state.writes).toEqual([]);
    state.readError = null;
    state.saveError = { message: "Database rejected update" };
    await expect(updateSignalItem(itemForm())).rejects.toThrow("error=save-failed");
    expect(state.writes).toHaveLength(1);
    expect(state.revalidateTag).not.toHaveBeenCalled();
  });
});
