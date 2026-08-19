import { brandCopy } from "@/lib/brand-copy";

export const northSignalOffer = {
  label: "NORTH SIGNAL · WEEKLY",
  headline: brandCopy.northSignal,
  supportingSentence: brandCopy.northSignalSupport,
  valueLines: [
    "One clear bottom line.",
    "The source-linked Signals behind it.",
    "The Canadian capability and Public Need links worth watching.",
    "Without rebuilding the week yourself."
  ],
  proofLine: "Built from published Canadian Defence Signals. Human-reviewed before it reaches you.",
  cta: "Get North Signal",
  riskReversal: "Free. Weekly. Original sources included. Human reviewed. Unsubscribe anytime.",
  previewLabel: "Preview this week’s issue →",
  proofMeta: "One bottom line · 3 Signals · 5-minute read",
  proofLinkLabel: "Preview issue →"
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
