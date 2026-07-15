import { describe, expect, it, vi } from "vitest";
import { getFreshnessState, summarizeFreshness } from "@/lib/freshness";

describe("freshness helpers", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-04-22T00:00:00.000Z"));

  it("marks records as stale when activity is beyond threshold", () => {
    const freshness = getFreshnessState({
      lastUpdatedAt: "2025-10-01T00:00:00.000Z",
      lastSignalAt: "2025-10-01T00:00:00.000Z",
      staleAfterDays: 180
    });

    expect(freshness.label).toBe("Stale");
    expect(freshness.isStale).toBe(true);
    expect(freshness.tone).toBe("danger");
  });

  it("summarizes mixed freshness states across a use case", () => {
    const summary = summarizeFreshness([
      {
        lastUpdatedAt: "2026-04-15T00:00:00.000Z",
        lastSignalAt: "2026-04-16T00:00:00.000Z",
        staleAfterDays: 180
      },
      {
        lastUpdatedAt: "2025-09-30T00:00:00.000Z",
        lastSignalAt: "2025-09-30T00:00:00.000Z",
        staleAfterDays: 180
      }
    ]);

    expect(summary.label).toBe("1 stale");
    expect(summary.staleCount).toBe(1);
    expect(summary.lastActivityAt).toBe("2026-04-16T00:00:00.000Z");
  });
});
