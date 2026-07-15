import { describe, expect, it } from "vitest";
import { calculateRankingScore, calculateSignalRecencyScore } from "../src/lib/scoring";

describe("ranking score", () => {
  it("applies the documented score weights", () => {
    expect(
      calculateRankingScore({
        relevanceBand: "high",
        pathway: "scale",
        defenceRelevance: "high",
        geography: "canada",
        lastSignalAt: new Date().toISOString(),
        evidenceStrength: 5,
        actionabilityScore: 5,
        reviewerOverrideDelta: 3
      })
    ).toBe(103);
  });

  it("drops signal recency after one year", () => {
    const olderThanYear = new Date(Date.now() - 370 * 24 * 60 * 60 * 1000).toISOString();
    expect(calculateSignalRecencyScore(olderThanYear)).toBe(0);
  });
});
