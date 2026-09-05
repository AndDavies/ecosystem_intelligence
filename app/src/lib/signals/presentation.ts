import type { SignalEdition } from "@/lib/atlas/signals";

export const signalSupportLabels = {
  direct_record: "Direct record",
  attributed_statement: "Attributed statement",
  original_reporting: "Original reporting",
  corroboration: "Corroborating source"
} as const;

export function signalSummaryParagraphs(text: string) {
  return text.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

export function signalEditionPresentation(edition: Pick<SignalEdition, "executiveSummary" | "summarySections">) {
  if (edition.summarySections) return {
    deck: edition.summarySections.opening,
    bottomLine: edition.summarySections.takeaway,
    boundary: edition.summarySections.limitation ?? ""
  };
  // Historical editions used paragraph order as their presentation contract.
  const paragraphs = signalSummaryParagraphs(edition.executiveSummary);
  const opening = paragraphs[0] ?? edition.executiveSummary;
  const sentences = opening.split(/(?<=[.!?])\s+/).filter(Boolean);
  const deckSentences = sentences.slice(0, 2);
  const deck = deckSentences.join(" ") || opening;
  const openingRemainder = sentences.slice(deckSentences.length).join(" ");
  const meaning = paragraphs.length > 1 ? paragraphs.slice(1, -1).join("\n\n") || paragraphs[1] : "";
  const bottomLine = [openingRemainder, meaning].filter(Boolean).join("\n\n") || opening;
  const boundary = paragraphs.length > 2 ? paragraphs.at(-1) ?? "" : "";
  return { deck, bottomLine, boundary };
}

export function signalEditionExcerpt(edition: Pick<SignalEdition, "executiveSummary" | "summarySections">) {
  return edition.summarySections?.takeaway ?? edition.executiveSummary;
}
