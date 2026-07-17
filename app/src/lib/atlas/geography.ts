import type { AtlasOrganization } from "@/types/atlas";

export interface AtlasMetroArea {
  slug: string;
  name: string;
  aliases: string[];
  cities: string[];
}

export const atlasMetroAreas: AtlasMetroArea[] = [
  {
    slug: "halifax-regional-municipality",
    name: "Halifax Regional Municipality",
    aliases: [
      "halifax regional municipality",
      "greater halifax",
      "lower sackville",
      "dartmouth",
      "halifax",
      "bedford",
      "hrm"
    ],
    cities: ["Halifax", "Dartmouth", "Bedford", "Lower Sackville"]
  }
];

function normalizeGeography(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesPhrase(value: string, phrase: string) {
  return ` ${normalizeGeography(value)} `.includes(` ${normalizeGeography(phrase)} `);
}

export function getAtlasMetroArea(slug: string | null | undefined) {
  if (!slug) return null;
  return atlasMetroAreas.find((metro) => metro.slug === slug) ?? null;
}

export function inferAtlasMetroArea(rawQuery: string) {
  return (
    atlasMetroAreas.find((metro) =>
      [...metro.aliases].sort((left, right) => right.length - left.length).some((alias) => includesPhrase(rawQuery, alias))
    ) ?? null
  );
}

export function organizationMatchesMetro(organization: AtlasOrganization, metroSlug: string) {
  const metro = getAtlasMetroArea(metroSlug);
  const city = organization.primaryLocation?.city;
  if (!metro || !city) return false;
  const normalizedCity = normalizeGeography(city);
  return metro.cities.some((candidate) => normalizeGeography(candidate) === normalizedCity);
}
