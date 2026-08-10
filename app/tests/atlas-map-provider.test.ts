import { describe, expect, it, vi } from "vitest";
import { resolveAtlasBaseMap } from "@/lib/atlas/map-provider";

describe("atlas base-map provider", () => {
  it("uses OpenStreetMap directly for fixed dossier previews", async () => {
    const fetcher = vi.fn<typeof fetch>();
    await expect(resolveAtlasBaseMap({
      provider: "openstreetmap",
      mapTilerStyleUrl: "https://api.maptiler.com/maps/example/style.json?key=invalid",
      fetcher
    })).resolves.toBe("openstreetmap");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("uses OpenStreetMap when no MapTiler style is configured", async () => {
    const fetcher = vi.fn<typeof fetch>();
    await expect(resolveAtlasBaseMap({ provider: "auto", mapTilerStyleUrl: null, fetcher })).resolves.toBe("openstreetmap");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("uses MapTiler only after a successful style preflight", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("{}", { status: 200 }));
    await expect(resolveAtlasBaseMap({ provider: "auto", mapTilerStyleUrl: "https://api.maptiler.com/style.json", fetcher })).resolves.toBe("maptiler");
    expect(fetcher).toHaveBeenCalledWith("https://api.maptiler.com/style.json", expect.objectContaining({ cache: "no-store" }));
  });

  it("falls back when MapTiler rejects the configured key", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("invalid key", { status: 403 }));
    await expect(resolveAtlasBaseMap({ provider: "auto", mapTilerStyleUrl: "https://api.maptiler.com/style.json", fetcher })).resolves.toBe("openstreetmap");
  });

  it("falls back when the provider cannot be reached", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("network unavailable"));
    await expect(resolveAtlasBaseMap({ provider: "auto", mapTilerStyleUrl: "https://api.maptiler.com/style.json", fetcher })).resolves.toBe("openstreetmap");
  });

  it("falls back when the provider preflight does not settle", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(() => new Promise(() => undefined));
    await expect(resolveAtlasBaseMap({
      provider: "auto",
      mapTilerStyleUrl: "https://api.maptiler.com/style.json",
      fetcher,
      timeoutMs: 5
    })).resolves.toBe("openstreetmap");
  });

  it("preserves caller aborts without updating an unmounted map", async () => {
    const controller = new AbortController();
    const fetcher = vi.fn<typeof fetch>().mockImplementation((_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
    }));
    const resolution = resolveAtlasBaseMap({
      provider: "auto",
      mapTilerStyleUrl: "https://api.maptiler.com/style.json",
      fetcher,
      signal: controller.signal
    });
    controller.abort();
    await expect(resolution).rejects.toMatchObject({ name: "AbortError" });
  });
});
