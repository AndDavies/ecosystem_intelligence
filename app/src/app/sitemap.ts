import type { MetadataRoute } from "next";
import { getAtlasSnapshot } from "@/lib/atlas/repository";
import { getPublishedDefenceBriefs } from "@/lib/atlas/briefs";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [snapshot, briefs] = await Promise.all([getAtlasSnapshot(), getPublishedDefenceBriefs()]);
  const lastModified = new Date(snapshot.generatedAt);
  const staticPages = ["/", "/organizations", "/regions", "/demand", "/briefs", "/about", "/methodology", "/contact", "/privacy", "/terms"];
  const capabilities = new Map(snapshot.organizations.flatMap((organization) => organization.capabilities.map((capability) => [capability.slug, capability])));
  return [
    ...staticPages.map((path) => ({ url: absoluteUrl(path), lastModified, changeFrequency: path === "/" ? "daily" as const : "monthly" as const, priority: path === "/" ? 1 : 0.6 })),
    ...snapshot.organizations.map((organization) => ({ url: absoluteUrl(`/organizations/${organization.slug}`), lastModified: organization.lastReviewedAt ? new Date(organization.lastReviewedAt) : lastModified, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...Array.from(capabilities.values()).map((capability) => ({ url: absoluteUrl(`/capabilities/${capability.slug}`), lastModified: capability.lastReviewedAt ? new Date(capability.lastReviewedAt) : lastModified, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...snapshot.regions.map((region) => ({ url: absoluteUrl(`/regions/${region.slug}`), lastModified, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...snapshot.demandRequirements.map((demand) => ({ url: absoluteUrl(`/demand/${demand.slug}`), lastModified, changeFrequency: "monthly" as const, priority: 0.65 })),
    ...briefs.map((brief) => ({ url: absoluteUrl(`/briefs/${brief.slug}`), lastModified: new Date(brief.updatedAt), changeFrequency: "monthly" as const, priority: 0.75 }))
  ];
}
