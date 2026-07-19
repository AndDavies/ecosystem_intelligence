export const siteUrl = "https://truenorthmap.ca";
export const siteName = "True North Map";
export const siteDescription = "See who is building what across Canada’s defence and dual-use ecosystem, where their technology fits, and who may be worth speaking with next.";

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}
