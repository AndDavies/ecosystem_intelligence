import { describe, expect, it } from "vitest";
import { briefSectionId, getBriefKeyTakeaways, getBriefPresentation, getBriefReadingMinutes } from "@/lib/atlas/brief-presentation";

describe("defence brief editorial presentation", () => {
  it("classifies the current public topics and formats consistently", () => {
    expect(getBriefPresentation({ slug: "canada-arctic-defence-operations", title: "Canada's Arctic defence operations", primaryQuestion: "What needs to work?" })).toMatchObject({ topic: "Arctic operations", format: "Explainer", tone: "arctic" });
    expect(getBriefPresentation({ slug: "river-class-destroyer-industry-signal", title: "River-class Destroyer milestone", primaryQuestion: "What does it signal?" })).toMatchObject({ topic: "Defence industry", format: "Analysis", tone: "industrial" });
    expect(getBriefPresentation({ slug: "moving-defence-technology-from-prototype-to-operations", title: "From prototype to operations", primaryQuestion: "How can Canadian companies move defence technology into use?" })).toMatchObject({ topic: "Innovation pathways", format: "Guide", tone: "innovation" });
  });

  it("maps reviewed articles to optimized editorial imagery", () => {
    expect(getBriefPresentation({ slug: "canada-arctic-defence-operations", title: "Arctic operations", primaryQuestion: "What needs to work?" }).imageSrc).toBe("/imagery/briefs/arctic-operations.jpg");
    expect(getBriefPresentation({ slug: "canada-future-submarine-industrial-opportunity", title: "Submarine opportunity", primaryQuestion: "What does Canada need?" }).cardImageSrc).toBe("/imagery/briefs/submarine-opportunity-card.jpg");
    expect(getBriefPresentation({ slug: "river-class-destroyer-industry-signal", title: "River-class Destroyer milestone", primaryQuestion: "What does it signal?" }).imageSrc).toBe("/imagery/briefs/defence-briefs-home.jpg");
  });

  it("builds stable reading and navigation helpers", () => {
    const sections = [{ question: "What should happen next?", answer: "A direct answer.", points: ["First action", "Second action"] }];
    expect(briefSectionId(sections[0].question, 0)).toBe("question-1-what-should-happen-next");
    expect(getBriefKeyTakeaways(sections)).toEqual(["First action", "Second action"]);
    expect(getBriefReadingMinutes({ title: "A title", dek: "Introduction", summaryAnswer: "Answer", sections, derivedRead: null })).toBe(3);
  });
});
