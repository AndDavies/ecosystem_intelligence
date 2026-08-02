import { describe, expect, it } from "vitest";
import {
  capabilityMatchesGuidedSearchFocus,
  guidedSearchExample,
  guidedSearchExampleFromSearchParams,
  guidedSearchFocusIds,
  guidedSearchHref,
  normalizeGuidedSearchFocus
} from "@/lib/atlas/guided-search";
import { atlasQueryFromSearchParams, atlasQueryToSearchParams } from "@/lib/atlas/query-params";
import { atlasTestSnapshot } from "./fixtures/atlas-snapshot";

describe("guided Search focus", () => {
  it("accepts only the fixed five focus IDs in their published order", () => {
    expect(guidedSearchFocusIds).toEqual([
      "modular-systems",
      "naval-integration",
      "underwater-sensing",
      "testing",
      "sustainment"
    ]);
    expect(normalizeGuidedSearchFocus(["testing,unknown", "underwater-sensing", "testing"]))
      .toEqual(["underwater-sensing", "testing"]);
  });

  it("creates a reproducible temporary example URL and a canonical ordinary atlas state", () => {
    const initial = new URL(guidedSearchHref(["underwater-sensing", "testing"]), "https://truenorthmap.ca");
    expect(initial.searchParams.get("example")).toBe(guidedSearchExample);
    expect(guidedSearchExampleFromSearchParams(initial.searchParams)).toEqual({
      focus: ["underwater-sensing", "testing"]
    });

    initial.searchParams.delete("example");
    const parsed = atlasQueryFromSearchParams(initial.searchParams);
    expect(parsed.focus).toEqual(["underwater-sensing", "testing"]);
    expect(atlasQueryToSearchParams(parsed).toString()).toContain("focus=underwater-sensing%2Ctesting");
  });

  it("serializes the complete guided map state for copied and return URLs", () => {
    const params = atlasQueryToSearchParams({
      focus: ["testing"],
      view: "map",
      selected: "622647bd-e3e6-4caa-a56d-08dee4a61f05",
      bounds: { west: -64.1, south: 44.5, east: -63.2, north: 45.1 }
    });

    expect(atlasQueryFromSearchParams(params)).toMatchObject({
      focus: ["testing"],
      view: "map",
      selected: "622647bd-e3e6-4caa-a56d-08dee4a61f05",
      bounds: { west: -64.1, south: 44.5, east: -63.2, north: 45.1 }
    });
  });

  it("matches a selected focus against reviewed capability fields without a free-form question", () => {
    const capability = atlasTestSnapshot.organizations[0]?.capabilities[0];
    expect(capability).toBeDefined();
    expect(capabilityMatchesGuidedSearchFocus(capability!, "underwater-sensing")).toBe(true);
    expect(capabilityMatchesGuidedSearchFocus(capability!, "testing")).toBe(true);
  });
});
