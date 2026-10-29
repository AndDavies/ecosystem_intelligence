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
  if (!metro || !city || organization.primaryLocation?.countryCode !== "CA" || organization.primaryLocation.provinceTerritory !== "Nova Scotia") return false;
  const normalizedCity = normalizeGeography(city);
  return metro.cities.some((candidate) => normalizeGeography(candidate) === normalizedCity);
}

export function organizationMatchesCanadianRegion(organization: Pick<AtlasOrganization, "primaryLocation">, region: string) {
  const location = organization.primaryLocation;
  if (location?.countryCode !== "CA") return false;
  return region === "canada" || location.regionSlug === region || normalizeGeography(location.provinceTerritory ?? "") === normalizeGeography(region);
}

/** Only real Canadian coordinate pairs become map markers; directory inclusion is independent. */
export function organizationHasCanadianMapLocation(organization: Pick<AtlasOrganization, "primaryLocation">) {
  const location = organization.primaryLocation;
  return location?.countryCode === "CA" && typeof location.latitude === "number" && Number.isFinite(location.latitude)
    && typeof location.longitude === "number" && Number.isFinite(location.longitude);
}
