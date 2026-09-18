import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { catalogue, questions, relevanceMetrics, savedAssistantSnapshot } from "../scripts/lib/assistant-evaluation";
import { buildJevRecords } from "@/lib/atlas/assistant-jev";

describe("frozen offline Ask evaluation", () => {
  it("has forty separate development/held-out questions backed by saved public records", () => {
    expect(questions.cases).toHaveLength(40);
    expect(questions.cases.filter((q) => q.split === "development")).toHaveLength(20);
    expect(new Set(questions.cases.map((q) => q.id)).size).toBe(40);
    expect(questions.judgmentStatus).toBe("draft_requires_human_review");
    const slugs = new Set(catalogue.organizations.map((o) => o.slug));
    for (const q of questions.cases) for (const slug of q.seedRelevantSlugs) expect(slugs.has(slug)).toBe(true);
    for (const org of catalogue.organizations) {
      expect(org.provenance.packetSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(org.provenance.sources.length).toBeGreaterThan(0);
      expect(org.provenance.sources.every((s) => new URL(s.url).protocol === "https:")).toBe(true);
    }
  });
  it("does not fabricate missing locations, citation bindings or current evidence strength", () => {
    const snapshot = savedAssistantSnapshot();
    expect(snapshot.organizations.length).toBeGreaterThan(32);
    expect(snapshot.organizations.every((o) => !o.primaryLocation && !o.citations.length && o.sourceConfidence === "needs_review")).toBe(true);
    const payload = JSON.stringify(buildJevRecords(snapshot));
    expect(payload).not.toMatch(/reviewerRationale|fieldEvidence|beforeRecord|savedPacket|packetSha256/);
  });
  it("separates retrieval-pool coverage, recall16 and ranking quality", () => {
    expect(relevanceMetrics(["a"], { a: 1, b: 3 }, ["a", "b"])).toMatchObject({ poolRecall: 1, recall16: 0.5 });
    expect(relevanceMetrics(["b", "a"], { a: 1, b: 3 }).ndcg5).toBe(1);
    expect(relevanceMetrics(["a", "b"], { a: 1, b: 3 }).ndcg5).toBeLessThan(1);
    expect(relevanceMetrics(["a"], {})).toEqual({ poolRecall: null, recall16: null, ndcg5: null });
  });
});
