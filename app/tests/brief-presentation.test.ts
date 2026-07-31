import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { briefSectionId, getBriefKeyTakeaways, getBriefPresentation, getBriefReadingMinutes } from "@/lib/atlas/brief-presentation";
import { relatedDefenceBriefs, type DefenceBrief } from "@/lib/atlas/briefs";

describe("defence brief editorial presentation", () => {
  const article = (slug: string, title: string, thesis: string) => ({ slug, title, thesis, format: "Explainer" as const, topic: "", heroImagePath: null, heroImageAlt: null });

  it("classifies the current public topics and formats consistently", () => {
    expect(getBriefPresentation(article("canada-arctic-defence-operations", "Canada's Arctic defence operations", "Sustained reach matters."))).toMatchObject({ topic: "Arctic operations", format: "Explainer", tone: "arctic" });
    expect(getBriefPresentation({ ...article("river-class-destroyer-industry-signal", "River-class Destroyer milestone", "The milestone begins an industrial cycle."), format: "Analysis" })).toMatchObject({ topic: "Defence industry", format: "Analysis", tone: "industrial" });
    expect(getBriefPresentation({ ...article("moving-defence-technology-from-prototype-to-operations", "From prototype to operations", "Testing must resolve adoption risk."), format: "Guide" })).toMatchObject({ topic: "Innovation pathways", format: "Guide", tone: "innovation" });
  });

  it("maps reviewed articles to optimized editorial imagery", () => {
    expect(getBriefPresentation(article("canada-arctic-defence-operations", "Arctic operations", "Sustained reach matters.")).imageSrc).toContain("/storage/v1/object/public/brief-images/arctic-operations.jpg");
    expect(getBriefPresentation(article("canada-future-submarine-industrial-opportunity", "Submarine opportunity", "Sustainment matters.")).cardImageSrc).toContain("/storage/v1/object/public/brief-images/submarine-opportunity-card.jpg");
    expect(getBriefPresentation({ ...article("river-class-destroyer-industry-signal", "River-class Destroyer milestone", "The milestone begins an industrial cycle."), format: "Analysis" }).imageSrc).toContain("/storage/v1/object/public/brief-images/defence-briefs-home.jpg");
  });

  it("builds stable reading and navigation helpers", () => {
    const sections = [{ heading: "The next decision", paragraphs: ["A direct narrative paragraph."], points: ["First action", "Second action"] }];
    expect(briefSectionId(sections[0].heading, 0)).toBe("section-1-the-next-decision");
    expect(getBriefKeyTakeaways({ keyTakeaways: [], sections })).toEqual(["First action", "Second action"]);
    expect(getBriefReadingMinutes({ title: "A title", standfirst: "Introduction", thesis: "Thesis", bottomLine: "Bottom line", sections, keyTakeaways: [], implications: null, limitations: null, recommendedAction: null })).toBe(3);
  });

  it("orders related articles by shared records before recency", () => {
    const makeBrief = (id: string, updatedAt: string, links: DefenceBrief["links"]): DefenceBrief => ({
      id,
      slug: id,
      title: id,
      thesis: "Thesis",
      bottomLine: "Bottom line",
      standfirst: "Standfirst",
      sections: [],
      keyTakeaways: [],
      implications: null,
      limitations: null,
      recommendedAction: null,
      format: "Brief",
      topic: "Maritime systems",
      audience: "Decision-makers",
      heroImagePath: null,
      heroImageAlt: null,
      seoTitle: id,
      metaDescription: id,
      authorName: "Andrew Davies",
      publishedAt: updatedAt,
      reviewedAt: updatedAt,
      updatedAt,
      sources: [],
      links
    });
    const current = makeBrief("current", "2026-07-01T00:00:00Z", [{ type: "capability", id: "capability-1", label: "Technology" }]);
    const shared = makeBrief("shared", "2026-06-01T00:00:00Z", [{ type: "capability", id: "capability-1", label: "Technology" }]);
    const recent = makeBrief("recent", "2026-07-30T00:00:00Z", []);

    expect(relatedDefenceBriefs(current, [recent, current, shared], 2).map((brief) => brief.id)).toEqual(["shared", "recent"]);
  });
});
