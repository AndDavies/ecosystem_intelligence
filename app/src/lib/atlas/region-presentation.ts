import { Compass, Factory, Lightbulb, MapPin, Ship, Snowflake, Waves, Wheat, type LucideIcon } from "lucide-react";
import type { AtlasHeroTone } from "@/components/atlas/atlas-hero-art";

/**
 * Illustrative only. The image, tone, and icon give each region page a distinct
 * visual identity; they are not evidence about the region or its organizations.
 */
type RegionArt = {
  tone: AtlasHeroTone;
  icon: LucideIcon;
  imageSrc?: string;
  imageAlt?: string;
  imagePosition?: string;
};

const regionArt: Record<string, RegionArt> = {
  canada: {
    tone: "general",
    icon: Compass,
    imageSrc: "/imagery/regions/canada.webp",
    imageAlt: "Illustrative view of Canada's connected defence and dual-use engineering ecosystem.",
    imagePosition: "center"
  },
  "atlantic-canada": {
    tone: "maritime",
    icon: Ship,
    imageSrc: "/imagery/regions/atlantic-canada.webp",
    imageAlt: "Illustrative view of Atlantic marine engineering, shipbuilding, and ocean-technology activity.",
    imagePosition: "center"
  },
  quebec: {
    tone: "industrial",
    icon: Factory,
    imageSrc: "/imagery/regions/quebec.webp",
    imageAlt: "Illustrative view of Quebec aerospace assembly and precision manufacturing.",
    imagePosition: "center"
  },
  ontario: {
    tone: "innovation",
    icon: Lightbulb,
    imageSrc: "/imagery/regions/ontario.webp",
    imageAlt: "Illustrative view of Ontario sensor, aerospace, and advanced-manufacturing activity.",
    imagePosition: "center"
  },
  prairies: {
    tone: "demand",
    icon: Wheat,
    imageSrc: "/imagery/regions/prairies.webp",
    imageAlt: "Illustrative view of Prairie autonomous-systems testing and advanced manufacturing.",
    imagePosition: "center"
  },
  "british-columbia": {
    tone: "maritime",
    icon: Waves,
    imageSrc: "/imagery/regions/british-columbia.webp",
    imageAlt: "Illustrative view of British Columbia shipbuilding, marine engineering, and subsea technology.",
    imagePosition: "center"
  },
  north: {
    tone: "arctic",
    icon: Snowflake,
    imageSrc: "/imagery/regions/north.webp",
    imageAlt: "Illustrative view of Northern communications, logistics, and Arctic operating infrastructure.",
    imagePosition: "center"
  }
};

export function getRegionArt(slug: string): RegionArt {
  return regionArt[slug] ?? { tone: "general" as AtlasHeroTone, icon: MapPin };
}

export function regionProvinceLabel(provincesTerritories: string[]) {
  if (provincesTerritories.length === 0) return "Coverage under review";
  if (provincesTerritories.length > 6) return `${provincesTerritories.length} provinces and territories`;
  return provincesTerritories.join(" · ");
}
