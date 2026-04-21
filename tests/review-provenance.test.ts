import { describe, expect, it } from "vitest";
import {
  isAiGeneratedRequest,
  resolveAiRunForRequest
} from "@/lib/review/provenance";

describe("review provenance helpers", () => {
  it("identifies AI-generated requests by system identity", () => {
    expect(
      isAiGeneratedRequest({
        requesterEmail: "system@ecosystem-intelligence.local",
        requesterName: "AI Enrichment Worker"
      })
    ).toBe(true);

    expect(
      isAiGeneratedRequest({
        requesterEmail: "analyst@example.com",
        requesterName: "Analyst User"
      })
    ).toBe(false);
  });

  it("maps capability-use-case suggestions back to the originating use-case AI run", () => {
    const run = resolveAiRunForRequest({
      request: {
        entityType: "capability_use_case",
        entityId: "mapping-1",
        createdAt: "2026-04-21T12:05:00.000Z"
      },
      mapping: {
        useCaseId: "use-case-1"
      },
      aiRuns: [
        {
          id: "run-older",
          entityType: "use_case",
          entityId: "use-case-1",
          status: "completed",
          promptVersion: "v1",
          resultSummary: "Older run",
          createdAt: "2026-04-21T11:00:00.000Z"
        },
        {
          id: "run-latest",
          entityType: "use_case",
          entityId: "use-case-1",
          status: "completed",
          promptVersion: "v2",
          resultSummary: "Latest run",
          createdAt: "2026-04-21T12:00:00.000Z"
        }
      ]
    });

    expect(run?.id).toBe("run-latest");
  });
});
