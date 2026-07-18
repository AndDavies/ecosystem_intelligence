export const siteUrl = "https://truenorthmap.ca";
export const siteName = "True North Map";
export const siteDescription = "An independent, evidence-backed public atlas of Canada's defence and dual-use organizations, capabilities, and collaboration opportunities.";

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}
