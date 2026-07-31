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
  imageFit?: "cover" | "contain";
  showLabel?: boolean;
};

const regionArt: Record<string, RegionArt> = {
  canada: {
    tone: "general",
    icon: Compass,
    imageSrc: "/imagery/regions/canada.webp?v=20260731",
    imageAlt: "Illustrative map showing Canada within the national ecosystem view.",
    imagePosition: "center",
    imageFit: "contain",
    showLabel: false
  },
  "atlantic-canada": {
    tone: "maritime",
    icon: Ship,
    imageSrc: "/imagery/regions/atlantic-canada.webp?v=20260731",
    imageAlt: "Illustrative map highlighting Atlantic Canada within the national ecosystem view.",
    imagePosition: "center",
    imageFit: "contain",
    showLabel: false
  },
  quebec: {
    tone: "industrial",
    icon: Factory,
    imageSrc: "/imagery/regions/quebec.webp?v=20260731",
    imageAlt: "Illustrative map highlighting Quebec within the national ecosystem view.",
    imagePosition: "center",
    imageFit: "contain",
    showLabel: false
  },
  ontario: {
    tone: "innovation",
    icon: Lightbulb,
    imageSrc: "/imagery/regions/ontario.webp?v=20260731",
    imageAlt: "Illustrative map highlighting Ontario within the national ecosystem view.",
    imagePosition: "center",
    imageFit: "contain",
    showLabel: false
  },
  prairies: {
    tone: "demand",
    icon: Wheat,
    imageSrc: "/imagery/regions/prairies.webp?v=20260731",
    imageAlt: "Illustrative map highlighting the Prairies within the national ecosystem view.",
    imagePosition: "center",
    imageFit: "contain",
    showLabel: false
  },
  "british-columbia": {
    tone: "maritime",
    icon: Waves,
    imageSrc: "/imagery/regions/british-columbia.webp?v=20260731",
    imageAlt: "Illustrative map highlighting British Columbia within the national ecosystem view.",
    imagePosition: "center",
    imageFit: "contain",
    showLabel: false
  },
  north: {
    tone: "arctic",
    icon: Snowflake,
    imageSrc: "/imagery/regions/north.webp?v=20260731",
    imageAlt: "Illustrative map highlighting Northern Canada within the national ecosystem view.",
    imagePosition: "center",
    imageFit: "contain",
    showLabel: false
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
