import { describe, expect, it } from "vitest";
import { loadSeedData } from "../scripts/seed-utils";

describe("seed data", () => {
  it("loads normalized CSV rows", async () => {
    const data = await loadSeedData();

    expect(data.useCases.length).toBeGreaterThan(0);
    expect(data.companies.length).toBeGreaterThan(0);
    expect(data.capabilityUseCases.every((item) => Number(item.ranking_score) > 0)).toBe(true);
  });
});
