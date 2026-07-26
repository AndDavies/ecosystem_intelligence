export const siteUrl = "https://truenorthmap.ca";
export const siteName = "True North Map";
export const siteDescription = "True North Map is an independent, evidence-led discovery platform that helps people find Canadian defence and dual-use capability, understand where it may fit, and move into better-informed conversations.";

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}
