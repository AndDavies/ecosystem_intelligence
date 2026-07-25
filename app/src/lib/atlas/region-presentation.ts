import { Compass, Factory, Lightbulb, MapPin, Ship, Snowflake, Waves, Wheat, type LucideIcon } from "lucide-react";
import type { AtlasHeroTone } from "@/components/atlas/atlas-hero-art";

/**
 * Decorative only. The tone and icon give each region page a distinct visual
 * identity; they carry no assessment of the region or its organizations.
 */
const regionArt: Record<string, { tone: AtlasHeroTone; icon: LucideIcon }> = {
  canada: { tone: "general", icon: Compass },
  "atlantic-canada": { tone: "maritime", icon: Ship },
  quebec: { tone: "industrial", icon: Factory },
  ontario: { tone: "innovation", icon: Lightbulb },
  prairies: { tone: "demand", icon: Wheat },
  "british-columbia": { tone: "maritime", icon: Waves },
  north: { tone: "arctic", icon: Snowflake }
};

export function getRegionArt(slug: string) {
  return regionArt[slug] ?? { tone: "general" as AtlasHeroTone, icon: MapPin };
}

export function regionProvinceLabel(provincesTerritories: string[]) {
  if (provincesTerritories.length === 0) return "Coverage under review";
  if (provincesTerritories.length > 6) return `${provincesTerritories.length} provinces and territories`;
  return provincesTerritories.join(" · ");
}
