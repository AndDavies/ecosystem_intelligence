import { describe, expect, it, vi } from "vitest";
import { assessAtlasOperationalPayloads, fetchLaunchResource } from "@/lib/launch/operational-checks";

describe("launch operational checks", () => {
  it("records a recovered 503 before returning the successful response", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response("temporary", { status: 503 }))
      .mockResolvedValueOnce(new Response("ready", { status: 200 }));
    const result = await fetchLaunchResource("https://example.test/health", { fetcher, retryDelayMs: 0 });
    expect(result.response.status).toBe(200);
    expect(result.attempts).toBe(2);
    expect(result.recoveredRetry).toBe(true);
    expect(result.warnings[0]?.issue).toContain("initial HTTP 503");
  });

  it("does not retry a normal 404 response", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("missing", { status: 404 }));
    const result = await fetchLaunchResource("https://example.test/missing", { fetcher, retryDelayMs: 0 });
    expect(result.response.status).toBe(404);
    expect(result.attempts).toBe(1);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("does not call an unrecovered second 503 a recovery", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response("temporary", { status: 503 }))
      .mockResolvedValueOnce(new Response("still unavailable", { status: 503 }));
    const result = await fetchLaunchResource("https://example.test/health", { fetcher, retryDelayMs: 0 });
    expect(result.response.status).toBe(503);
    expect(result.attempts).toBe(2);
    expect(result.recoveredRetry).toBe(false);
    expect(result.warnings).toEqual([]);
  });

  it("reports both attempts when a network retry also fails", async () => {
    const fetcher = vi.fn()
      .mockRejectedValueOnce(new Error("connection reset"))
      .mockRejectedValueOnce(new Error("connection timed out"));
    await expect(fetchLaunchResource("https://example.test/health", { fetcher, retryDelayMs: 0 }))
      .rejects.toThrow("retry failed: connection timed out");
  });

  it("fails immediately when a followed redirect escapes the target origin", async () => {
    const redirected = new Response("production", { status: 200 });
    Object.defineProperty(redirected, "url", { value: "https://production.example/organizations" });
    const fetcher = vi.fn().mockResolvedValue(redirected);
    await expect(fetchLaunchResource("https://candidate.example/organizations", {
      fetcher,
      retryDelayMs: 0,
      expectedOrigin: "https://candidate.example"
    })).rejects.toThrow("escaped expected origin");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("accepts matching health, summary and complete-map counts", () => {
    const findings = assessAtlasOperationalPayloads(
      { status: "ok", checks: { catalogueConsistent: true } },
      { organizations: 25 },
      { total: 25, mapOrganizations: Array.from({ length: 25 }), organizations: Array.from({ length: 18 }) },
      { health: "/api/health", summary: "/api/atlas/summary", atlas: "/api/atlas" }
    );
    expect(findings).toEqual([]);
  });

  it("fails when the public summary and complete-map projection diverge", () => {
    const findings = assessAtlasOperationalPayloads(
      { status: "ok", checks: { catalogueConsistent: true } },
      { organizations: 25 },
      { total: 24, mapOrganizations: Array.from({ length: 23 }), organizations: Array.from({ length: 18 }) },
      { health: "/api/health", summary: "/api/atlas/summary", atlas: "/api/atlas" }
    );
    expect(findings.some((finding) => finding.issue.includes("totals do not match"))).toBe(true);
  });
});
