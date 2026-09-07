import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  atlasDiscoveryCacheTag,
  atlasOrganizationCacheTag,
  atlasOrganizationGlobalCacheTag
} from "@/lib/atlas/cache-tags";

export type PublishedAtlasChange = {
  discoveryChanged?: boolean;
  demandChanged?: boolean;
  organizationDossiersChanged?: boolean;
  organizationSlugs?: readonly string[];
  demandSlugs?: readonly string[];
  capabilitySlugs?: readonly string[];
};

export function publishedAtlasInvalidationPlan(change: PublishedAtlasChange) {
  const organizationSlugs = [...new Set(change.organizationSlugs ?? [])].filter(Boolean).sort();
  const demandSlugs = [...new Set(change.demandSlugs ?? [])].filter(Boolean).sort();
  const capabilitySlugs = [...new Set(change.capabilitySlugs ?? [])].filter(Boolean).sort();
  const tags = new Set<string>(["atlas-public"]);
  const paths = new Set<string>(["/"]);

  if (change.discoveryChanged) {
    tags.add(atlasDiscoveryCacheTag);
    ["/organizations", "/missions", "/regions", "/sitemap.xml"].forEach((path) => paths.add(path));
  }
  if (change.demandChanged) paths.add("/demand");
  if (change.organizationDossiersChanged) tags.add(atlasOrganizationGlobalCacheTag);

  organizationSlugs.forEach((slug) => {
    tags.add(atlasOrganizationCacheTag(slug));
    paths.add(`/organizations/${slug}`);
  });
  demandSlugs.forEach((slug) => paths.add(`/demand/${slug}`));
  capabilitySlugs.forEach((slug) => paths.add(`/capabilities/${slug}`));

  return { tags: [...tags], paths: [...paths] };
}

/** Run only after the corresponding canonical write has committed successfully. */
export function revalidatePublishedAtlas(change: PublishedAtlasChange) {
  const plan = publishedAtlasInvalidationPlan(change);
  plan.tags.forEach((tag) => revalidateTag(tag));
  plan.paths.forEach((path) => revalidatePath(path));
  return plan;
}
