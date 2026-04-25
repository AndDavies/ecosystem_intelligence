import { describe, expect, it } from "vitest";
import { loadSeedData } from "../scripts/seed-utils";

describe("seed data", () => {
  it("loads normalized CSV rows", async () => {
    const data = await loadSeedData();

    expect(data.useCases.length).toBeGreaterThan(0);
    expect(data.companies.length).toBeGreaterThan(0);
    expect(data.capabilityUseCases.every((item) => Number(item.ranking_score) > 0)).toBe(true);
  });

  it("requires realism metadata and policy citations on active use cases", async () => {
    const data = await loadSeedData();
    const activeUseCases = data.useCases.filter((item) => Boolean(item.active));

    expect(activeUseCases.length).toBeGreaterThanOrEqual(8);
    activeUseCases.forEach((useCase) => {
      expect(useCase.priority_tier).toMatch(/^p[123]$/);
      expect(["mission", "enabling"]).toContain(useCase.use_case_kind);
      expect(useCase.partner_frames).toEqual(expect.arrayContaining([expect.any(String)]));
      expect(useCase.policy_anchors).toEqual(expect.arrayContaining([expect.any(String)]));
      expect(String(useCase.mission_outcome)).toContain(" ");
      expect(String(useCase.procurement_pathway)).toContain(" ");
      expect(
        data.fieldCitations.some(
          (citation) =>
            citation.entity_type === "use_case" &&
            citation.entity_id === useCase.id &&
            citation.field_name === "policy_anchors"
        )
      ).toBe(true);
    });
  });
});
