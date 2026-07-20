export const siteUrl = "https://truenorthmap.ca";
export const siteName = "True North Map";
export const siteDescription = "Discover the companies, technologies, and public needs shaping Canada’s defence and dual-use ecosystem. Follow the evidence, find the fit, and start the right conversation.";

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}
