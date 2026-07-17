export const siteUrl = "https://ecosystem-intelligence.vercel.app";
export const siteName = "Ecosystem Intelligence";
export const siteDescription = "An independent, evidence-backed public atlas of Canada's defence and dual-use organizations, capabilities, and collaboration opportunities.";

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}
