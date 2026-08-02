export const siteUrl = "https://truenorthmap.ca";
export const siteName = "True North Map";
export const siteDescription = "True North Map is an independent, evidence-led discovery platform that helps people find Canadian defence and dual-use capability, understand where it may fit, and move into better-informed conversations.";
export const officialSocialLinks = {
  linkedIn: "https://www.linkedin.com/company/true-north-map-ca",
  x: "https://x.com/TrueNorthMapCA"
} as const;

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}
