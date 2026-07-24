import type { DemandSignalBundleV1 } from "@/lib/research/pipeline-schema";

export type MissingDemandIssuerDependency = {
  parentIssuerSlug: string;
  issuerName: string;
  demandSourceTitle: string;
};

/**
 * Demand issuers are canonical taxonomy records. A candidate may introduce an
 * issuing body, but its parent must already be established in the published
 * hierarchy before an atomic publication begins.
 */
export function findMissingDemandIssuerDependencies(
  candidates: DemandSignalBundleV1[],
  publishedIssuerSlugs: Iterable<string>
): MissingDemandIssuerDependency[] {
  const knownParentSlugs = new Set([...publishedIssuerSlugs].map((slug) => slug.trim()));
  const seen = new Set<string>();
  const missing: MissingDemandIssuerDependency[] = [];

  for (const candidate of candidates) {
    for (const issuer of candidate.issuers) {
      const parentIssuerSlug = issuer.parentIssuerSlug;
      if (!parentIssuerSlug || knownParentSlugs.has(parentIssuerSlug)) continue;
      const key = `${parentIssuerSlug}:${issuer.slug}:${candidate.demandSource.slug}`;
      if (seen.has(key)) continue;
      seen.add(key);
      missing.push({
        parentIssuerSlug,
        issuerName: issuer.name,
        demandSourceTitle: candidate.demandSource.title
      });
    }
  }

  return missing.sort((left, right) => (
    left.parentIssuerSlug.localeCompare(right.parentIssuerSlug)
    || left.demandSourceTitle.localeCompare(right.demandSourceTitle)
    || left.issuerName.localeCompare(right.issuerName)
  ));
}
