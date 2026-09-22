import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import { getRelatedBriefSummaries, type EditorialRecordTarget } from "@/lib/atlas/briefs";
import { atlasDiscoveryCacheTag } from "@/lib/atlas/cache-tags";
import { getRelatedSignalSummaries } from "@/lib/atlas/signals";
import { createPublicClient } from "@/lib/supabase/public";
import type { AtlasOrganization } from "@/types/atlas";

type Row = Record<string, unknown>;

export type DossierRelatedIntelligence = {
  unavailable?: string[];
  briefs: Array<{ id: string; slug: string; title: string; summary: string; publishedAt: string }>;
  signals: Array<{ id: string; slug: string; title: string; summary: string; editionDate: string; matchedItemTitle: string }>;
  organizations: Array<{ id: string; slug: string; name: string; description: string; reason: string }>;
};

export function dossierDirectEditorialTargetKeys(organization: AtlasOrganization) {
  return new Set([
    `organization:${organization.id}`,
    ...organization.capabilities.map((capability) => `capability:${capability.id}`)
  ]);
}

function asRows(value: unknown): Row[] {
  return Array.isArray(value) ? value as Row[] : [];
}

export async function fetchPagedRows(
  queryPage: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }>,
  pageSize = 500
) {
  const rows: Row[] = [];
  for (let from = 0; ; from += pageSize) {
    const result = await queryPage(from, from + pageSize - 1);
    if (result.error) return { rows: [], error: result.error };
    const page = asRows(result.data);
    rows.push(...page);
    if (page.length < pageSize) return { rows, error: null };
  }
}

type PublishedRelationshipIndex = {
  missionMatches: Row[];
  domainMatches: Row[];
  capabilities: Row[];
  organizations: Row[];
};

async function loadPublishedRelationshipIndex(): Promise<PublishedRelationshipIndex | null> {
  const supabase = createPublicClient();
  const [missionResult, domainResult, capabilityResult, organizationResult] = await Promise.all([
    fetchPagedRows((from, to) => supabase.from("capability_mission_matches")
      .select("id, capability_id, mission_area_id")
      .eq("review_status", "approved")
      .eq("publication_status", "published")
      .order("id")
      .range(from, to)),
    fetchPagedRows((from, to) => supabase.from("capability_domains")
      .select("capability_id, technical_domain_id")
      .eq("publication_status", "published")
      .order("technical_domain_id")
      .order("capability_id")
      .range(from, to)),
    fetchPagedRows((from, to) => supabase.from("capabilities")
      .select("id, organization_id")
      .eq("publication_status", "published")
      .order("id")
      .range(from, to)),
    fetchPagedRows((from, to) => supabase.from("organizations")
      .select("id, slug, name, description")
      .eq("publication_status", "published")
      .order("id")
      .range(from, to))
  ]);
  if (missionResult.error || domainResult.error || capabilityResult.error || organizationResult.error) throw new Error("Related organization index is unavailable");
  return {
    missionMatches: missionResult.rows,
    domainMatches: domainResult.rows,
    capabilities: capabilityResult.rows,
    organizations: organizationResult.rows
  };
}

const getPublishedRelationshipIndex = unstable_cache(
  loadPublishedRelationshipIndex,
  ["dossier-related-published-index-v2"],
  { revalidate: 300, tags: [atlasDiscoveryCacheTag] }
);

async function relatedOrganizations(organization: AtlasOrganization) {
  const missionIds = new Set(organization.capabilities.flatMap((capability) => capability.missionMatches.map((match) => match.missionArea.id)));
  const domainIds = new Set(organization.capabilities.flatMap((capability) => capability.technicalDomains.map((domain) => domain.id)));
  if (!missionIds.size && !domainIds.size) return [];
  const index = await getPublishedRelationshipIndex();
  if (!index) return [];
  const capabilityScores = new Map<string, { mission: number; domain: number }>();
  for (const row of index.missionMatches) {
    if (!missionIds.has(String(row.mission_area_id))) continue;
    const capabilityId = String(row.capability_id);
    const score = capabilityScores.get(capabilityId) ?? { mission: 0, domain: 0 };
    score.mission += 1;
    capabilityScores.set(capabilityId, score);
  }
  for (const row of index.domainMatches) {
    if (!domainIds.has(String(row.technical_domain_id))) continue;
    const capabilityId = String(row.capability_id);
    const score = capabilityScores.get(capabilityId) ?? { mission: 0, domain: 0 };
    score.domain += 1;
    capabilityScores.set(capabilityId, score);
  }
  const currentCapabilityIds = new Set(organization.capabilities.map((capability) => capability.id));
  const candidateCapabilityIds = [...capabilityScores.keys()].filter((id) => !currentCapabilityIds.has(id));
  if (!candidateCapabilityIds.length) return [];
  const candidateCapabilitySet = new Set(candidateCapabilityIds);
  const capabilityRows = index.capabilities.filter((row) => candidateCapabilitySet.has(String(row.id)));
  const organizationScores = new Map<string, { mission: number; domain: number }>();
  for (const row of capabilityRows) {
    const organizationId = String(row.organization_id);
    if (organizationId === organization.id) continue;
    const capabilityScore = capabilityScores.get(String(row.id)) ?? { mission: 0, domain: 0 };
    const score = organizationScores.get(organizationId) ?? { mission: 0, domain: 0 };
    score.mission += capabilityScore.mission;
    score.domain += capabilityScore.domain;
    organizationScores.set(organizationId, score);
  }
  const rankedIds = [...organizationScores.entries()]
    .sort((left, right) => {
      const scoreDifference = (right[1].mission * 3 + right[1].domain) - (left[1].mission * 3 + left[1].domain);
      return scoreDifference || left[0].localeCompare(right[0]);
    })
    .slice(0, 4)
    .map(([id]) => id);
  if (!rankedIds.length) return [];
  const rankedIdSet = new Set(rankedIds);
  const byId = new Map(index.organizations.filter((row) => rankedIdSet.has(String(row.id))).map((row) => [String(row.id), row]));
  return rankedIds.flatMap((id) => {
    const row = byId.get(id);
    if (!row) return [];
    const score = organizationScores.get(id) ?? { mission: 0, domain: 0 };
    const reason = score.mission && score.domain
      ? "Shared reviewed Mission areas and technical domains"
      : score.mission ? "Shared reviewed Mission areas" : "Shared technical domains";
    return [{ id, slug: String(row.slug), name: String(row.name), description: String(row.description), reason }];
  });
}

export const getCapabilityRelatedOrganizations = cache(async (
  organization: AtlasOrganization,
  capabilityId: string
): Promise<DossierRelatedIntelligence["organizations"]> => {
  const capability = organization.capabilities.find((candidate) => candidate.id === capabilityId);
  if (!capability) return [];
  return relatedOrganizations({ ...organization, capabilities: [capability] });
});

/** Fail optional branches independently, outside persistent success caches. */
export async function readRelatedIntelligence(organization: AtlasOrganization, targets: EditorialRecordTarget[]): Promise<DossierRelatedIntelligence> {
  const results = await Promise.allSettled([
    getRelatedBriefSummaries(targets), getRelatedSignalSummaries(targets), relatedOrganizations(organization)
  ]);
  const labels = ["Briefs", "Signals", "similar organizations"];
  const unavailable = results.flatMap((result, index) => {
    if (result.status === "fulfilled") return [];
    console.warn("Dossier supporting content unavailable", { section: labels[index] });
    return [labels[index]];
  });
  return {
    briefs: results[0].status === "fulfilled" ? results[0].value : [],
    signals: results[1].status === "fulfilled" ? results[1].value : [],
    organizations: results[2].status === "fulfilled" ? results[2].value : [],
    unavailable
  };
}

export const getDossierRelatedIntelligence = cache(async (organization: AtlasOrganization): Promise<DossierRelatedIntelligence> =>
  readRelatedIntelligence(organization, [
    { type: "organization", id: organization.id },
    ...organization.capabilities.map((capability) => ({ type: "capability" as const, id: capability.id }))
  ])
);

export const getCapabilityRelatedIntelligence = cache(async (organization: AtlasOrganization, capabilityId: string) =>
  readRelatedIntelligence({ ...organization, capabilities: organization.capabilities.filter((capability) => capability.id === capabilityId) },
    [{ type: "capability", id: capabilityId }])
);

const cachedSiblingCapabilities = unstable_cache(async (organizationId: string, capabilityId: string) => {
  const { data, error } = await createPublicClient().from("capabilities").select("id, slug, name")
    .eq("organization_id", organizationId).eq("publication_status", "published").neq("id", capabilityId).order("name").order("id").limit(2);
  if (error) throw new Error("Sibling capability summaries unavailable");
  return (data ?? []) as Array<{ id: string; slug: string; name: string }>;
}, ["dossier-sibling-capabilities-v1"], { revalidate: 300, tags: ["atlas-public"] });

export async function getCapabilitySiblingSummaries(organizationId: string, capabilityId: string) {
  try { return await cachedSiblingCapabilities(organizationId, capabilityId); }
  catch { console.warn("Dossier supporting content unavailable", { section: "sibling capabilities" }); return null; }
}
