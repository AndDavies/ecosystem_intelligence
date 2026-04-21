import { describe, expect, it } from "vitest";
import { buildEnrichmentSuggestionPayload } from "@/lib/ai/worker";

describe("enrichment worker suggestion payload", () => {
  it("creates a review payload when enrichment changes live fields", () => {
    const payload = buildEnrichmentSuggestionPayload(
      {
        why_it_matters: "Existing why it matters.",
        suggested_action_type: "monitor_for_later_stage_engagement"
      },
      {
        whyItMatters: "Updated why it matters.",
        suggestedActionType: "introduce_to_integrator",
        rationale: "New supporting rationale."
      }
    );

    expect(payload).toEqual({
      changedFields: ["why_it_matters", "suggested_action_type"],
      beforeValue: {
        why_it_matters: "Existing why it matters.",
        suggested_action_type: "monitor_for_later_stage_engagement"
      },
      afterValue: {
        why_it_matters: "Updated why it matters.",
        suggested_action_type: "introduce_to_integrator"
      }
    });
  });

  it("returns null when enrichment does not change the mapping", () => {
    const payload = buildEnrichmentSuggestionPayload(
      {
        why_it_matters: "No change",
        suggested_action_type: "assess_procurement_relevance"
      },
      {
        whyItMatters: "No change",
        suggestedActionType: "assess_procurement_relevance",
        rationale: "Same output."
      }
    );

    expect(payload).toBeNull();
  });
});
