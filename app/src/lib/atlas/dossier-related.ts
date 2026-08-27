import "server-only";

import { cache } from "react";
import { getPublishedDefenceBriefs } from "@/lib/atlas/briefs";
import { getAllPublishedSignals } from "@/lib/atlas/signals";
import { createPublicClient } from "@/lib/supabase/public";
import type { AtlasOrganization } from "@/types/atlas";

type Row = Record<string, unknown>;

export type DossierRelatedIntelligence = {
  briefs: Array<{ id: string; slug: string; title: string; summary: string; publishedAt: string }>;
  signals: Array<{ id: string; slug: string; title: string; summary: string; editionDate: string; matchedItemTitle: string }>;
  organizations: Array<{ id: string; slug: string; name: string; description: string; reason: string }>;
};

function asRows(value: unknown): Row[] {
  return Array.isArray(value) ? value as Row[] : [];
}

async function relatedOrganizations(organization: AtlasOrganization) {
  const missionIds = new Set(organization.capabilities.flatMap((capability) => capability.missionMatches.map((match) => match.missionArea.id)));
  const domainIds = new Set(organization.capabilities.flatMap((capability) => capability.technicalDomains.map((domain) => domain.id)));
  if (!missionIds.size && !domainIds.size) return [];
  const supabase = createPublicClient();
  const [missionResult, domainResult] = await Promise.all([
    missionIds.size
      ? supabase.from("capability_mission_matches")
          .select("capability_id, mission_area_id")
          .in("mission_area_id", [...missionIds])
          .eq("review_status", "approved")
          .eq("publication_status", "published")
          .limit(120)
      : Promise.resolve({ data: [], error: null }),
    domainIds.size
      ? supabase.from("capability_domains")
          .select("capability_id, technical_domain_id")
          .in("technical_domain_id", [...domainIds])
          .eq("publication_status", "published")
          .limit(120)
      : Promise.resolve({ data: [], error: null })
  ]);
  if (missionResult.error || domainResult.error) return [];
  const capabilityScores = new Map<string, { mission: number; domain: number }>();
  for (const row of asRows(missionResult.data)) {
    const capabilityId = String(row.capability_id);
    const score = capabilityScores.get(capabilityId) ?? { mission: 0, domain: 0 };
    score.mission += 1;
    capabilityScores.set(capabilityId, score);
  }
  for (const row of asRows(domainResult.data)) {
    const capabilityId = String(row.capability_id);
    const score = capabilityScores.get(capabilityId) ?? { mission: 0, domain: 0 };
    score.domain += 1;
    capabilityScores.set(capabilityId, score);
  }
  const currentCapabilityIds = new Set(organization.capabilities.map((capability) => capability.id));
  const candidateCapabilityIds = [...capabilityScores.keys()].filter((id) => !currentCapabilityIds.has(id)).slice(0, 120);
  if (!candidateCapabilityIds.length) return [];
  const capabilityResult = await supabase.from("capabilities")
    .select("id, organization_id")
    .in("id", candidateCapabilityIds)
    .eq("publication_status", "published")
    .limit(120);
  if (capabilityResult.error) return [];
  const organizationScores = new Map<string, { mission: number; domain: number }>();
  for (const row of asRows(capabilityResult.data)) {
    const organizationId = String(row.organization_id);
    if (organizationId === organization.id) continue;
    const capabilityScore = capabilityScores.get(String(row.id)) ?? { mission: 0, domain: 0 };
    const score = organizationScores.get(organizationId) ?? { mission: 0, domain: 0 };
    score.mission += capabilityScore.mission;
    score.domain += capabilityScore.domain;
    organizationScores.set(organizationId, score);
  }
  const rankedIds = [...organizationScores.entries()]
    .sort((left, right) => (right[1].mission * 3 + right[1].domain) - (left[1].mission * 3 + left[1].domain))
    .slice(0, 4)
    .map(([id]) => id);
  if (!rankedIds.length) return [];
  const organizationResult = await supabase.from("organizations")
    .select("id, slug, name, description")
    .in("id", rankedIds)
    .eq("publication_status", "published");
  if (organizationResult.error) return [];
  const byId = new Map(asRows(organizationResult.data).map((row) => [String(row.id), row]));
  return rankedIds.flatMap((id) => {
    const row = byId.get(id);
    if (!row) return [];
    const score = organizationScores.get(id) ?? { mission: 0, domain: 0 };
    const reason = score.mission && score.domain
      ? "Shared reviewed Mission Areas and technical domains"
      : score.mission ? "Shared reviewed Mission Areas" : "Shared technical domains";
    return [{ id, slug: String(row.slug), name: String(row.name), description: String(row.description), reason }];
  });
}

export const getDossierRelatedIntelligence = cache(async (organization: AtlasOrganization): Promise<DossierRelatedIntelligence> => {
  const targetKeys = new Set([
    `organization:${organization.id}`,
    ...organization.capabilities.map((capability) => `capability:${capability.id}`),
    ...organization.capabilities.flatMap((capability) => capability.missionMatches.map((match) => `mission_area:${match.missionArea.id}`)),
    ...organization.capabilities.flatMap((capability) => capability.demandMatches.map((match) => `demand_requirement:${match.demandRequirementId}`))
  ]);
  const [briefs, signalEditions] = await Promise.all([
    getPublishedDefenceBriefs(),
    getAllPublishedSignals()
  ]);
  const relatedBriefs = briefs
    .filter((brief) => brief.links.some((link) => targetKeys.has(`${link.type}:${link.id}`)))
    .slice(0, 3)
    .map((brief) => ({ id: brief.id, slug: brief.slug, title: brief.title, summary: brief.standfirst, publishedAt: brief.publishedAt }));
  const relatedSignals = signalEditions.flatMap((edition) => {
    const item = edition.items.find((candidate) => candidate.links.some((link) => targetKeys.has(`${link.type}:${link.id}`)));
    return item ? [{
      id: edition.id,
      slug: edition.slug,
      title: edition.title,
      summary: edition.executiveSummary,
      editionDate: edition.editionDate,
      matchedItemTitle: item.title
    }] : [];
  }).slice(0, 3);
  const organizations = relatedBriefs.length || relatedSignals.length ? [] : await relatedOrganizations(organization);
  return { briefs: relatedBriefs, signals: relatedSignals, organizations };
});
