import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  readFile: vi.fn(),
  createPublicClient: vi.fn(() => { throw new Error("live-client-created"); })
}));

vi.mock("server-only", () => ({}));
vi.mock("node:fs/promises", () => ({ readFile: state.readFile }));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("@/lib/supabase/public", () => ({ createPublicClient: state.createPublicClient }));

import { getAllPublishedSignals, getLatestPublishedSignalProof, getPublishedSignalBySlug, getPublishedSignals, getPublishedSignalsForRecord } from "@/lib/atlas/signals";

const previewFile = "/tmp/isolated-signal-preview.json";
const historical = JSON.parse(readFileSync(path.resolve("tests/fixtures/daily-signals-packet-v2.json"), "utf8"));
const preview = {
  ...historical,
  schemaVersion: "daily_signals_packet_v3",
  summary: { opening: "The substantial private opening.", takeaway: "The private takeaway.", limitation: null },
  heroImage: null,
  socialDrafts: [],
  items: [{
    ...historical.items[0],
    automatedRead: null, unknowns: null, nextStep: null,
    sources: historical.items[0].sources.map((source: object) => ({ ...source, supportType: "direct_record", accessedAt: "2026-09-05T12:00:00.000Z" }))
  }]
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("SIGNALS_PREVIEW_FILE", previewFile);
  state.readFile.mockResolvedValue(Buffer.from(JSON.stringify(preview)));
});
afterEach(() => vi.unstubAllEnvs());

describe("explicit Signals development preview", () => {
  it("resolves list, archive and slug without configuring or querying Supabase", async () => {
    expect(await getPublishedSignals()).toMatchObject([{ slug: preview.slug, isLocalPreview: true }]);
    expect(await getAllPublishedSignals()).toMatchObject([{ slug: preview.slug, isLocalPreview: true }]);
    expect(await getPublishedSignalBySlug(preview.slug)).toMatchObject({ slug: preview.slug, isLocalPreview: true });
    expect(await getPublishedSignalBySlug("a-different-live-edition-slug")).toBeNull();
    expect(state.createPublicClient).not.toHaveBeenCalled();
    expect(state.readFile.mock.calls.every(([file]) => file === previewFile)).toBe(true);
  });

  it("does not replace a missing explicit file with an old default packet or live edition", async () => {
    state.readFile.mockRejectedValue(Object.assign(new Error("missing preview"), { code: "ENOENT" }));
    expect(await getPublishedSignals()).toEqual([]);
    expect(await getAllPublishedSignals()).toEqual([]);
    expect(await getPublishedSignalBySlug(preview.slug)).toBeNull();
    expect(state.createPublicClient).not.toHaveBeenCalled();
    expect(state.readFile.mock.calls.map(([file]) => file)).toEqual([previewFile, previewFile, previewFile]);
  });

  it("does not advertise the private packet as a published proof or mix live record editions into its preview", async () => {
    expect(await getLatestPublishedSignalProof()).toBeNull();
    expect(await getPublishedSignalsForRecord("organization", "not-in-this-preview")).toEqual([]);
    expect(state.createPublicClient).not.toHaveBeenCalled();
  });

  it("ignores the preview setting in production and never reads its private file", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(getPublishedSignals()).rejects.toThrow("live-client-created");
    expect(state.createPublicClient).toHaveBeenCalledOnce();
    expect(state.readFile).not.toHaveBeenCalled();
  });
});
