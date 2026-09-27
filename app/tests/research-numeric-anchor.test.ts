import { describe, expect, it } from "vitest";
import { refreshOperationExplanationIssues, type OrganizationRefreshBundleV2 } from "@/lib/research/pipeline-schema";

describe("numeric refresh explanation anchors", () => {
  const operation: OrganizationRefreshBundleV2["operations"][number] = {
    operation: "set_field", operationId: "founding-year", entityType: "organization",
    targetId: "388de241-b768-4063-80fb-31dc3a2fe139", field: "founded_year",
    before: null, after: 2019, evidenceIds: ["founding-source"],
    leafEvidence: [{ fieldPath: "after", evidenceIds: ["founding-source"] }],
    reviewerExplanation: "Add founded year 2019 from the inspected company history."
  };

  it("accepts an exact cited numeric value while rejecting absent, wrong or embedded numbers", () => {
    expect(refreshOperationExplanationIssues("candidate", "Example Company", operation)).toEqual([]);
    for (const anchor of ["the documented year", "2020", "20190", "2019.5", "x2019"]) {
      expect(refreshOperationExplanationIssues("candidate", "Example Company", {
        ...operation, reviewerExplanation: `Add founded year ${anchor} from the inspected company history.`
      })).toContain("Candidate candidate operation founding-year explanation lacks a distinctive proposed-value anchor.");
    }
  });
});
