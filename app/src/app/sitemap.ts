import type { MetadataRoute } from "next";
import { getPublishedAtlasSlugs } from "@/lib/atlas/repository";
import { getPublishedDefenceBriefs } from "@/lib/atlas/briefs";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, briefs] = await Promise.all([getPublishedAtlasSlugs(), getPublishedDefenceBriefs()]);
  const lastModified = new Date();
  const staticPages = ["/", "/organizations", "/regions", "/demand", "/briefs", "/about", "/how-it-works", "/methodology", "/contact", "/privacy", "/terms"];
  const regionSlugs = ["canada", "atlantic-canada", "quebec", "ontario", "prairies", "british-columbia", "north"];
  return [
    ...staticPages.map((path) => ({ url: absoluteUrl(path), lastModified, changeFrequency: path === "/" ? "daily" as const : "monthly" as const, priority: path === "/" ? 1 : 0.6 })),
    ...slugs.organizations.map((slug) => ({ url: absoluteUrl(`/organizations/${slug}`), lastModified, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...slugs.capabilities.map((slug) => ({ url: absoluteUrl(`/capabilities/${slug}`), lastModified, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...regionSlugs.map((slug) => ({ url: absoluteUrl(`/regions/${slug}`), lastModified, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...slugs.demands.map((slug) => ({ url: absoluteUrl(`/demand/${slug}`), lastModified, changeFrequency: "monthly" as const, priority: 0.65 })),
    ...briefs.map((brief) => ({ url: absoluteUrl(`/briefs/${brief.slug}`), lastModified: new Date(brief.updatedAt), changeFrequency: "monthly" as const, priority: 0.75 }))
  ];
}
