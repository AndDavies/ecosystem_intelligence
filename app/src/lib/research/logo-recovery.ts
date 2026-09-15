/** Reuse observed official pages; never guess a brand route or use third-party reporting. */
export function officialLogoSourcePages(websiteUrl: string, observedUrls: string[]) {
  const website = new URL(websiteUrl);
  const host = website.hostname.toLowerCase().replace(/^www\./, "");
  const eligible = observedUrls.flatMap((value) => {
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" || url.username || url.password
        || url.hostname.toLowerCase().replace(/^www\./, "") !== host
        || /\.(?:pdf|docx?|xlsx?|pptx?|zip|png|jpe?g|webp|svg|gif|xml)$/i.test(url.pathname)) return [];
      url.hash = "";
      return [url.href];
    } catch {
      return [];
    }
  });
  eligible.sort((a, b) => Number(/brand|press|media|about|contact/i.test(new URL(b).pathname))
    - Number(/brand|press|media|about|contact/i.test(new URL(a).pathname)));
  // Four page attempts bound optional asset work, not research or source selection.
  website.hash = "";
  return [...new Set([website.href, ...eligible])].slice(0, 4);
}

export function needsLogoRecovery(status: string | undefined, retryMissing: boolean) {
  return status === undefined || (retryMissing && status === "not_found");
}

export function mergeLogoResults<T extends { candidateId: string }>(previous: T[], current: T[]) {
  const merged = new Map(previous.map((result) => [result.candidateId, result]));
  for (const result of current) merged.set(result.candidateId, result);
  return [...merged.values()];
}
import type { ResearchCandidateBatchV2 } from "./pipeline-schema";

/** Refreshes use the exact canonical identity captured by the research snapshot. */
export function organizationLogoIdentity(candidate: ResearchCandidateBatchV2["candidates"][number]) {
  if (candidate.candidateKind === "organization_bundle") return candidate.organization;
  if (candidate.candidateKind !== "organization_refresh_bundle") return null;
  const organization = candidate.beforeRecord.organization as Record<string, unknown> | undefined;
  if (!organization || typeof organization.name !== "string" || typeof organization.website_url !== "string") {
    throw new Error(`Logo preparation requires the canonical organization baseline for ${candidate.candidateId}.`);
  }
  return { name: organization.name, slug: candidate.targetMatch.slug, websiteUrl: organization.website_url };
}
