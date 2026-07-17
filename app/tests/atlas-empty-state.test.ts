import { describe, expect, it } from "vitest";
import { getAtlasEmptyState } from "@/lib/atlas/empty-state";

describe("atlas empty states", () => {
  it("explains a submitted search failure without blaming map bounds", () => {
    const state = getAtlasEmptyState({ totalResults: 0, submittedQuery: "Unknown supplier" });

    expect(state.kind).toBe("search");
    expect(state.title).toContain("Unknown supplier");
    expect(state.description).toContain("Atlantic Canada");
    expect(state.description).not.toContain("zoom out");
  });

  it("uses map guidance only when published results exist outside the viewport", () => {
    const state = getAtlasEmptyState({ totalResults: 3, submittedQuery: "Dartmouth" });

    expect(state.kind).toBe("map_bounds");
    expect(state.description).toContain("Pan or zoom out");
  });
});
