import { describe, expect, it } from "vitest";
import { formatDate } from "@/lib/utils";

describe("date formatting", () => {
  it("uses a deterministic UTC calendar date during server and client rendering", () => {
    expect(formatDate("2026-04-24T00:00:00.000Z")).toBe("Apr 24, 2026");
  });

  it("keeps the unknown safe state", () => {
    expect(formatDate(null)).toBe("Unknown");
    expect(formatDate("not-a-date")).toBe("Unknown");
  });
});
