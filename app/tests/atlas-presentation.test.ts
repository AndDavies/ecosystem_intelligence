import { describe, expect, it } from "vitest";
import {
  alignmentSubject,
  alignmentTypeLabel,
  assessmentConfidenceLabel,
  evidenceStrengthLabel,
  locationAccuracyLabel
} from "@/lib/atlas/presentation";

describe("public atlas terminology", () => {
  it("separates evidence strength from assessment confidence", () => {
    expect(evidenceStrengthLabel("high")).toBe("Strong");
    expect(evidenceStrengthLabel("needs_review")).toBe("Limited");
    expect(assessmentConfidenceLabel("high")).toBe("High");
    expect(assessmentConfidenceLabel("needs_review")).toBe("Needs review");
  });

  it("uses plain-language assessment and location labels", () => {
    expect(alignmentTypeLabel("derived")).toBe("Analyst assessment");
    expect(alignmentTypeLabel("public_source_alignment")).toBe("Source-backed match");
    expect(locationAccuracyLabel("city_centroid")).toBe("City-level");
    expect(locationAccuracyLabel("unverified")).toBe("Not verified");
  });

  it("names the subject of mission and demand assessments", () => {
    expect(alignmentSubject({ missionArea: { name: "Underwater ISR" } } as never)).toBe("Underwater ISR");
    expect(alignmentSubject({ demandTitle: "Contested logistics" } as never)).toBe("Contested logistics");
  });
});
