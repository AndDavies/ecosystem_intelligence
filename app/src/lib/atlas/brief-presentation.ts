import type { DefenceBrief } from "@/lib/atlas/briefs";
import { seededDefenceBriefImages } from "@/lib/atlas/brief-images";

const image = (objectName: string) => seededDefenceBriefImages.find((item) => item.objectName === objectName)?.value;

export type DefenceBriefTopic =
  | "Arctic operations"
  | "Defence industry"
  | "Innovation pathways"
  | "Maritime systems"
  | "Operational demand"
  | "Canadian defence";

export type DefenceBriefFormat = DefenceBrief["format"];
export type DefenceBriefTone = "arctic" | "industrial" | "innovation" | "maritime" | "demand" | "general";

export type DefenceBriefPresentation = {
  topic: string;
  format: DefenceBriefFormat;
  tone: DefenceBriefTone;
  imageSrc?: string;
  imageAlt?: string;
  cardImageSrc?: string;
  cardImageAlt?: string;
};

const presentationOverrides: Record<string, Partial<DefenceBriefPresentation>> = {
  "canada-arctic-defence-operations": {
    topic: "Arctic operations", format: "Explainer", tone: "arctic",
    imageSrc: image("arctic-operations.jpg"),
    imageAlt: "Canadian soldiers operating in winter terrain beneath the northern lights and a connected communications network."
  },
  "canada-future-submarine-industrial-opportunity": {
    topic: "Maritime systems", format: "Explainer", tone: "maritime",
    imageSrc: image("submarine-opportunity.jpg"),
    imageAlt: "Conceptual submarine operating above and below Arctic sea ice with an illuminated undersea sensor network.",
    cardImageSrc: image("submarine-opportunity-card.jpg"),
    cardImageAlt: "Conceptual submarine operating above and below Arctic sea ice with a blue undersea sensor network."
  },
  "canadian-defence-demand-signals": {
    topic: "Operational demand", format: "Guide", tone: "demand",
    imageSrc: image("defence-demand-and-innovation.jpg"),
    imageAlt: "Canadian armoured vehicle surrounded by a network of defence, industry, communications, and technology symbols."
  },
  "what-sovereign-defence-capability-requires": {
    topic: "Defence industry", format: "Explainer", tone: "industrial",
    imageSrc: image("sovereign-capability.jpg"),
    imageAlt: "Canadian fighter aircraft above a connected map of Canada with a formation of uncrewed aircraft."
  },
  "moving-defence-technology-from-prototype-to-operations": {
    topic: "Innovation pathways", format: "Guide", tone: "innovation",
    imageSrc: image("defence-demand-and-innovation.jpg"),
    imageAlt: "Canadian armoured vehicle surrounded by connected industry, technology, and operational symbols."
  },
  "resilient-communications-for-arctic-defence": {
    topic: "Arctic operations", format: "Explainer", tone: "arctic",
    imageSrc: image("arctic-operations.jpg"),
    imageAlt: "Canadian soldiers operating in Arctic winter terrain beneath an illuminated communications network."
  },
  "modular-containerized-systems-for-naval-operations": {
    topic: "Maritime systems", format: "Guide", tone: "maritime",
    imageSrc: image("defence-briefs-home.jpg"),
    imageAlt: "Conceptual Canadian naval vessel connected to industry, defence, community, and national partners."
  },
  "river-class-destroyer-industry-signal": {
    topic: "Defence industry", format: "Analysis", tone: "industrial",
    imageSrc: image("defence-briefs-home.jpg"),
    imageAlt: "Conceptual Canadian destroyer connected to industry, defence, community, and national partners."
  }
};

export const defenceBriefsHomePresentation: DefenceBriefPresentation = {
  topic: "Canadian defence",
  format: "Explainer",
  tone: "maritime",
  imageSrc: image("defence-briefs-home.jpg"),
  imageAlt: "Conceptual Canadian naval vessel connecting defence, industry, communities, and partners across Canada."
};

export const briefHeroOptions = seededDefenceBriefImages;

export function getBriefPresentation(brief: Pick<DefenceBrief, "slug" | "title" | "thesis" | "format" | "topic" | "heroImagePath" | "heroImageAlt">): DefenceBriefPresentation {
  const haystack = `${brief.slug} ${brief.title} ${brief.thesis}`.toLowerCase();
  let inferred: DefenceBriefPresentation = { topic: "Canadian defence", format: "Explainer", tone: "general" };

  if (/arctic|north|northern/.test(haystack)) inferred = { topic: "Arctic operations", format: "Explainer", tone: "arctic" };
  else if (/submarine|undersea|naval|maritime|ship|destroyer|container/.test(haystack)) inferred = { topic: "Maritime systems", format: "Explainer", tone: "maritime" };
  else if (/prototype|innovation|ideas|test|commercialization/.test(haystack)) inferred = { topic: "Innovation pathways", format: "Guide", tone: "innovation" };
  else if (/demand|mission|operational need/.test(haystack)) inferred = { topic: "Operational demand", format: "Guide", tone: "demand" };
  else if (/industry|industrial|sovereign|procurement|supply chain/.test(haystack)) inferred = { topic: "Defence industry", format: "Explainer", tone: "industrial" };

  if (/milestone|signal|what does.+mean/.test(haystack)) inferred.format = "Analysis";

  const override = presentationOverrides[brief.slug] ?? {};
  return {
    ...inferred,
    ...override,
    topic: brief.topic || override.topic || inferred.topic,
    format: brief.format || override.format || inferred.format,
    imageSrc: brief.heroImagePath || override.imageSrc,
    imageAlt: brief.heroImageAlt || override.imageAlt
  };
}

export function getBriefReadingMinutes(brief: Pick<DefenceBrief, "title" | "standfirst" | "thesis" | "bottomLine" | "sections" | "keyTakeaways" | "implications" | "limitations" | "recommendedAction">) {
  const words = [
    brief.title,
    brief.standfirst,
    brief.thesis,
    brief.bottomLine,
    ...brief.keyTakeaways,
    ...brief.sections.flatMap((section) => [section.heading, ...section.paragraphs, ...section.points]),
    brief.implications ?? "",
    brief.limitations ?? "",
    brief.recommendedAction ?? ""
  ].join(" ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.ceil(words / 210));
}

export function getBriefKeyTakeaways(brief: Pick<DefenceBrief, "keyTakeaways" | "sections">, limit = 4) {
  const candidates = brief.keyTakeaways.length
    ? brief.keyTakeaways
    : brief.sections.flatMap((section) => section.points.length ? section.points : section.paragraphs.slice(0, 1));
  return [...new Set(candidates.map((point) => point.trim()).filter(Boolean))].slice(0, limit);
}

export function briefSectionId(heading: string, index: number) {
  const slug = heading.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `section-${index + 1}-${slug || "analysis"}`;
}
