import { describe, expect, it } from "vitest";
import { buildResearchQueueBatches, candidateTypeTotals, type ResearchQueueCandidate, type ResearchQueueRun } from "@/lib/atlas/research-run-queue";

function candidate(index: number, runId: string, overrides: Partial<ResearchQueueCandidate> = {}): ResearchQueueCandidate {
  return {
    id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    research_run_id: runId,
    candidate_kind: "organization_refresh_bundle",
    schema_version: "organization_refresh_bundle_v2",
    duplicate_check: { status: "clear" },
    reviewer_rationale: "Scope: Evidence-backed dossier refresh. Evidence: Durable source lineage is present. Risk: Unknowns remain visible. Recommendation: Accept for the separate publication checkpoint after review.",
    created_at: `2026-08-11T10:${String(index % 60).padStart(2, "0")}:00.000Z`,
    ...overrides
  };
}

function run(id: string, resumeToken: string): ResearchQueueRun {
  return {
    id,
    run_type: "manual",
    scope: { mode: "corpus-refresh" },
    status: "completed",
    completed_at: "2026-08-11T11:00:00.000Z",
    resume_token: resumeToken
  };
}

describe("research-run review queue", () => {
  it("keeps totals above one page and separates candidates by research run", () => {
    const runA = "10000000-0000-4000-8000-000000000001";
    const runB = "20000000-0000-4000-8000-000000000002";
    const candidates = [
      ...Array.from({ length: 23 }, (_, index) => candidate(index + 1, runA)),
      ...Array.from({ length: 27 }, (_, index) => candidate(index + 24, runB))
    ];
    const batches = buildResearchQueueBatches(candidates, [run(runA, "tnm-corpus-refresh-segment-01"), run(runB, "tnm-corpus-refresh-segment-02")]);

    expect(candidates).toHaveLength(50);
    expect(batches.map((batch) => [batch.label, batch.pendingCount])).toEqual([
      ["tnm-corpus-refresh-segment-01", 23],
      ["tnm-corpus-refresh-segment-02", 27]
    ]);
    expect(batches.every((batch) => batch.bulkReviewEligible)).toBe(true);
    expect(candidateTypeTotals(candidates)).toEqual({ organizations: 0, demands: 0, matches: 0, refreshes: 50, repairs: 0 });
  });

  it("blocks batch acceptance when any candidate lacks a complete prefilled rationale", () => {
    const runId = "30000000-0000-4000-8000-000000000003";
    const batches = buildResearchQueueBatches([
      candidate(1, runId),
      candidate(2, runId, { reviewer_rationale: "Too short" })
    ], [run(runId, "tnm-corpus-refresh-segment-03")]);

    expect(batches[0].bulkReviewEligible).toBe(false);
    expect(batches[0].bulkReviewIssue).toContain("complete AI-prepared reviewer rationale");
  });
});
