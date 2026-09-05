import type { AtlasOrganization } from "@/types/atlas";

export type DossierSection = { id: string; label: string };

export function buildDossierSections({
  hasCurrentActivity,
  hasConnections,
  hasCapabilities,
  hasPublicRecord,
  hasQuestions,
  hasSources
}: {
  hasCurrentActivity: boolean;
  hasConnections: boolean;
  hasCapabilities: boolean;
  hasPublicRecord: boolean;
  hasQuestions: boolean;
  hasSources: boolean;
}) {
  const sections: DossierSection[] = [{ id: "profile", label: "Overview" }];
  if (hasCurrentActivity) sections.push({ id: "why-now", label: "Why now" });
  if (hasConnections) sections.push({ id: "connections", label: "Where it could contribute" });
  if (hasCapabilities) sections.push({ id: "capabilities", label: "Technologies and services" });
  if (hasPublicRecord) sections.push({ id: "public-record", label: "Public record" });
  if (hasQuestions) sections.push({ id: "questions", label: "Questions" });
  if (hasSources) sections.push({ id: "sources", label: "Sources" });
  sections.push({ id: "contact", label: "Next steps" });
  return sections;
}

export function organizationInitials(name: string) {
  const words = name.normalize("NFKC").match(/[\p{L}\p{N}]+/gu) ?? [];
  if (!words.length) return null;
  const letters = words.length === 1
    ? Array.from(words[0]).slice(0, 2)
    : words.slice(0, 2).map((word) => Array.from(word)[0]);
  return letters.join("").toLocaleUpperCase("en-CA");
}

export function compactCanadianFootprint(organization: AtlasOrganization) {
  const locations = new Map(
    [organization.primaryLocation, ...organization.locations]
      .filter((location) => location?.countryCode === "CA")
      .map((location) => [location!.id, location!])
  );
  const publishedLocations = [...locations.values()];
  if (!publishedLocations.length) return null;

  const provinces = [...new Set(publishedLocations.map((location) => location.provinceTerritory).filter((value): value is string => Boolean(value)))];
  if (publishedLocations.length === 1) {
    const [location] = publishedLocations;
    return location.provinceTerritory ?? location.city ?? location.name;
  }
  if (provinces.length === 1) return `${publishedLocations.length} locations · ${provinces[0]}`;
  if (provinces.length > 1 && provinces.length <= 3) return provinces.join(" · ");
  if (provinces.length > 3) return `${publishedLocations.length} locations across ${provinces.length} provinces and territories`;
  return `${publishedLocations.length} published locations`;
}
