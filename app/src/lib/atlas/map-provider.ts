export type AtlasBaseMapProvider = "auto" | "openstreetmap";
export type ResolvedAtlasBaseMap = "maptiler" | "openstreetmap";

export async function resolveAtlasBaseMap({
  provider,
  mapTilerStyleUrl,
  signal,
  fetcher = fetch,
  timeoutMs = 2_500
}: {
  provider: AtlasBaseMapProvider;
  mapTilerStyleUrl: string | null;
  signal?: AbortSignal;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}): Promise<ResolvedAtlasBaseMap> {
  if (provider === "openstreetmap" || !mapTilerStyleUrl) return "openstreetmap";

  if (signal?.aborted) throw new DOMException("The operation was aborted.", "AbortError");
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort();
  signal?.addEventListener("abort", abortFromCaller, { once: true });
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      resolve(null);
    }, Math.max(1, timeoutMs));
  });

  try {
    const response = await Promise.race([
      fetcher(mapTilerStyleUrl, { signal: controller.signal, cache: "no-store" }),
      timeout
    ]);
    return response?.ok ? "maptiler" : "openstreetmap";
  } catch {
    if (signal?.aborted) throw new DOMException("The operation was aborted.", "AbortError");
    return "openstreetmap";
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}
