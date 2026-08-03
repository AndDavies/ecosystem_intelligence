import type { MetadataRoute } from "next";
import { getPublishedAtlasSlugs } from "@/lib/atlas/repository";
import { getPublishedDefenceBriefs } from "@/lib/atlas/briefs";
import { getPublishedSignals } from "@/lib/atlas/signals";
import { absoluteUrl } from "@/lib/site";

// The canonical sitemap is sourced from the live publication ledger. Generate
// it at request time so clean CI builds never need production credentials;
// the underlying slug and Brief loaders remain bounded and cached.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, briefs, signals] = await Promise.all([getPublishedAtlasSlugs(), getPublishedDefenceBriefs(), getPublishedSignals(100)]);
  const releaseUpdatedAt = new Date("2026-07-26T00:00:00-03:00");
  const staticPages = ["/", "/map", "/organizations", "/missions", "/regions", "/demand", "/signals", "/briefs", "/about", "/how-it-works", "/methodology", "/contact", "/privacy", "/terms"];
  const regionSlugs = ["canada", "atlantic-canada", "quebec", "ontario", "prairies", "british-columbia", "north"];
  return [
    ...staticPages.map((path) => ({ url: absoluteUrl(path), lastModified: releaseUpdatedAt, changeFrequency: path === "/" || path === "/map" ? "daily" as const : "monthly" as const, priority: path === "/" ? 1 : path === "/map" ? 0.9 : 0.6 })),
    ...slugs.organizations.map((record) => ({ url: absoluteUrl(`/organizations/${record.slug}`), lastModified: record.updatedAt ? new Date(record.updatedAt) : releaseUpdatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...slugs.capabilities.map((record) => ({ url: absoluteUrl(`/capabilities/${record.slug}`), lastModified: record.updatedAt ? new Date(record.updatedAt) : releaseUpdatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...(slugs.missions ?? []).map((record) => ({ url: absoluteUrl(`/missions/${record.slug}`), lastModified: record.updatedAt ? new Date(record.updatedAt) : releaseUpdatedAt, changeFrequency: "weekly" as const, priority: 0.75 })),
    ...regionSlugs.map((slug) => ({ url: absoluteUrl(`/regions/${slug}`), lastModified: releaseUpdatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...slugs.demands.map((record) => ({ url: absoluteUrl(`/demand/${record.slug}`), lastModified: record.updatedAt ? new Date(record.updatedAt) : releaseUpdatedAt, changeFrequency: "monthly" as const, priority: 0.65 })),
    ...briefs.map((brief) => ({ url: absoluteUrl(`/briefs/${brief.slug}`), lastModified: new Date(brief.updatedAt), changeFrequency: "monthly" as const, priority: 0.75 })),
    ...signals.map((signal) => ({ url: absoluteUrl(`/signals/${signal.slug}`), lastModified: new Date(signal.updatedAt), changeFrequency: "weekly" as const, priority: 0.72 }))
  ];
}
