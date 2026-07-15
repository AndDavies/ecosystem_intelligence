import { describe, expect, it } from "vitest";
import { buildImpactChanges } from "@/lib/review/change-routing";

describe("change routing", () => {
  it("splits capability-use-case edits into low and high impact changes", () => {
    const changes = buildImpactChanges({
      entityType: "capability_use_case",
      currentValues: {
        why_it_matters: "Current rationale",
        action_note: "Current note",
        pathway: "validate",
        relevance_band: "medium",
        defence_relevance: "medium",
        suggested_action_type: "monitor_for_later_stage_engagement"
      },
      nextValues: {
        why_it_matters: "Updated rationale",
        action_note: "Current note",
        pathway: "scale",
        relevance_band: "high",
        defence_relevance: "medium",
        suggested_action_type: "assess_procurement_relevance"
      }
    });

    expect(changes.lowImpactUpdates).toEqual({
      why_it_matters: "Updated rationale"
    });
    expect(changes.highImpactBefore).toEqual({
      pathway: "validate",
      relevance_band: "medium",
      suggested_action_type: "monitor_for_later_stage_engagement"
    });
    expect(changes.highImpactAfter).toEqual({
      pathway: "scale",
      relevance_band: "high",
      suggested_action_type: "assess_procurement_relevance"
    });
  });
});
