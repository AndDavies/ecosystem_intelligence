import { brandCopy } from "@/lib/brand-copy";

export const siteUrl = "https://truenorthmap.ca";
export const siteName = "True North Map";
export const siteDescription = brandCopy.positioning;
export const officialSocialLinks = {
  linkedIn: "https://www.linkedin.com/company/true-north-map-ca",
  x: "https://x.com/TrueNorthMapCA"
} as const;

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}
