import { brandCopy } from "@/lib/brand-copy";

export const northSignalOffer = {
  label: "NORTH SIGNAL",
  headline: brandCopy.northSignal,
  supportingSentence: brandCopy.northSignalSupport,
  valueLines: [
    "What changed in Canadian defence.",
    "Why it matters, with the original sources.",
    "The companies, technologies and defence needs to follow.",
    "A useful place to start your week."
  ],
  proofLine: "Built from published Canadian Defence Signals. Human-reviewed before it reaches you.",
  cta: "Get the free weekly briefing",
  riskReversal: "Free. Weekly. Original sources included. Human reviewed. Unsubscribe anytime.",
  previewLabel: "Read a recent Defence Signals edition →",
  proofMeta: "Published reporting behind the weekly briefing",
  proofLinkLabel: "Read the edition →"
} as const;

export type NorthSignalIssueProof = {
  headline: string;
  href: string;
};

export function resolveNorthSignalIssueProof(
  edition: { slug: string; title: string } | null | undefined
): NorthSignalIssueProof | null {
  if (edition?.slug && edition.title.trim()) {
    return {
      headline: edition.title.trim(),
      href: `/signals/${edition.slug}`
    };
  }

  return null;
}
