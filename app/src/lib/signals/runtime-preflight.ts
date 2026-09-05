export async function verifySignalsRuntime(origin: string, request: typeof fetch = fetch) {
  const url = new URL("/api/system/signals-contract", origin);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))) throw new Error("Signals runtime origin requires HTTPS or a local development server.");
  const response = await request(url, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Signals reader compatibility check returned HTTP ${response.status}; no publication was attempted.`);
  const value = await response.json() as Record<string, unknown>;
  if (value.schemaVersion !== "daily_signals_runtime_v3" || value.newPacketVersion !== "daily_signals_packet_v3" || value.finalizationFunction !== "finalize_signal_edition" || value.evidenceSnapshots !== true || value.optionalHero !== true) throw new Error("The deployed Signals reader/writer contract is not compatible with v3; no publication was attempted.");
  return value;
}
