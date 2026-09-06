import type { SignalEdition, SignalItem } from "@/lib/atlas/signals";
import { socialImageUrl } from "@/lib/seo/social";
import { absoluteUrl } from "@/lib/site";

export type SignalVisual = { url: string; alt: string; attribution: string; sourceUrl: string; kind: "photo" | "logo"; context?: string };

// Presentation assets are not evidence for the story's claims. This reviewed
// placement never modifies publication records or their immutable sources.
const allenVanguardProduct: SignalVisual = {
  url: "/images/signals/allen-vanguard-equinox-ng.png",
  alt: "Allen-Vanguard EQUINOX NG electronic countermeasure system",
  attribution: "Product image: Allen-Vanguard",
  sourceUrl: "https://www.allenvanguard.com/equinox-ng/",
  kind: "photo",
  context: "Product context; receivership reporting relies on the cited court records."
};
const allenVanguardLogo: SignalVisual = {
  url: "/images/signals/allen-vanguard-mark.png", alt: "Allen-Vanguard company mark",
  attribution: "Company mark: Allen-Vanguard", sourceUrl: "https://www.allenvanguard.com/", kind: "logo"
};
export function signalLeadVisual(edition: Pick<SignalEdition, "slug" | "heroImage">): SignalVisual | null {
  if (edition.heroImage) return { ...edition.heroImage, kind: "photo" };
  return edition.slug === "allen-vanguard-distress-and-the-next-industrial-bets" ? allenVanguardProduct : null;
}
export function signalSocialImage(edition: Pick<SignalEdition, "slug" | "title" | "heroImage">) {
  const visual = signalLeadVisual(edition);
  if (visual) return { url: absoluteUrl(visual.url), alt: visual.alt };
  return {
    url: socialImageUrl({ title: edition.title, eyebrow: "Canadian Defence Signals" }),
    alt: `${edition.title} on True North Map`, width: 1200, height: 630
  };
}
export function signalStoryVisual(editionSlug: string, item: Pick<SignalItem, "slug">): SignalVisual | null {
  return editionSlug === "allen-vanguard-distress-and-the-next-industrial-bets" && item.slug === "allen-vanguard-engineering-continuity-receivership" ? allenVanguardLogo : null;
}
