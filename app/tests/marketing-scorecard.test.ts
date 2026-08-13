import { describe, expect, it } from "vitest";
import { isMarketingScorecardEvent } from "@/lib/product-insights/marketing-scorecard";

describe("North Signal marketing scorecard", () => {
  it("keeps ordinary attributed visitor events", () => {
    expect(isMarketingScorecardEvent({
      context_path: "/signals/current-edition",
      cohort: "north_signal_90d",
      metadata: { utm_source: "linkedin" }
    })).toBe(true);
  });

  it("excludes local, explicit QA, staff and development traffic without deleting it", () => {
    expect(isMarketingScorecardEvent({ context_path: "/dev/dossier-preview", metadata: {} })).toBe(false);
    expect(isMarketingScorecardEvent({ context_path: "/north-signal", metadata: { utm_source: "qa" } })).toBe(false);
    expect(isMarketingScorecardEvent({ context_path: "/north-signal", metadata: { traffic_class: "qa" } })).toBe(false);
    expect(isMarketingScorecardEvent({ context_path: "/north-signal", cohort: "staff", metadata: {} })).toBe(false);
  });
});
