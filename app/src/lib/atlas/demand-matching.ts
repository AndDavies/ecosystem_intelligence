import { z } from "zod";
import type { AtlasDemandRequirement, AtlasOrganization } from "@/types/atlas";

export const demandMatchCandidateSchema = z.object({
  schemaVersion: z.literal("demand_match_bundle_v1"),
  capabilityId: z.string().uuid(),
  capabilitySlug: z.string().min(1),
  capabilityName: z.string().min(1),
  organizationId: z.string().uuid(),
  organizationSlug: z.string().min(1),
  organizationName: z.string().min(1),
  demandRequirementId: z.string().uuid(),
  demandSlug: z.string().min(1),
  demandTitle: z.string().min(1),
  matchType: z.literal("derived"),
  alignmentSummary: z.string().trim().min(40).max(2000),
  rationale: z.string().trim().min(80).max(4000),
  confidence: z.literal("needs_review"),
  matchedConcepts: z.array(z.string().min(1)).min(1),
  reviewerRationale: z.string().trim().min(80).max(2000)
});

export type DemandMatchCandidate = z.infer<typeof demandMatchCandidateSchema>;

type OrganizationInput = Pick<AtlasOrganization, "id" | "slug" | "name" | "capabilities">;
type DemandInput = Pick<AtlasDemandRequirement, "id" | "slug" | "title" | "problemStatement" | "desiredEndState">;

const concepts = [
  { key: "maritime", label: "maritime and undersea operations", terms: ["maritime", "marine", "ocean", "underwater", "undersea", "subsea", "naval", "uuv", "auv", "sonar"] },
  { key: "arctic", label: "Arctic and northern operations", terms: ["arctic", "northern", "polar", "ice", "cold weather", "high north"] },
  { key: "sensing", label: "detection and situational awareness", terms: ["sensor", "sensing", "detect", "detection", "monitor", "monitoring", "surveillance", "situational awareness", "isr", "radar", "imaging"] },
  { key: "autonomy", label: "autonomous and uncrewed systems", terms: ["autonomous", "autonomy", "uncrewed", "unmanned", "robotic", "remotely operated", "drone", "uav", "uas"] },
  { key: "communications", label: "resilient communications and command", terms: ["communications", "communication", "network", "connectivity", "command and control", "c2", "radio", "satellite", "data link"] },
  { key: "cyber", label: "cyber and digital operations", terms: ["cyber", "software", "digital", "artificial intelligence", "machine learning", "data analytics", "ai-enabled"] },
  { key: "energy", label: "energy and power resilience", terms: ["energy", "power", "battery", "charging", "fuel", "electrical", "grid"] },
  { key: "logistics", label: "logistics and sustainment", terms: ["logistics", "sustainment", "supply", "maintenance", "repair", "transport", "resupply"] },
  { key: "aerospace", label: "aerospace operations", terms: ["aerospace", "aircraft", "aviation", "flight", "airborne", "helicopter", "vertical lift", "drone", "uav", "uas"] },
  { key: "land", label: "land operations", terms: ["land force", "land forces", "ground force", "ground forces", "soldier", "army", "terrain", "battlefield", "artillery", "indirect fire"] },
  { key: "fires", label: "targeting and precision effects", terms: ["strike", "target acquisition", "targeting", "range finding", "range-finding", "laser ranging", "fire control", "indirect fire", "missile", "weapon", "lethality"] },
  { key: "medical", label: "medical treatment and evacuation", terms: ["medical", "casualty", "patient", "trauma", "evacuation", "diagnostic", "intensive care", "cbrn treatment"] },
  { key: "materials", label: "advanced materials and manufacturing", terms: ["manufacturing", "material", "composite", "additive", "production", "fabrication", "industrial"] },
  { key: "protection", label: "protection and survivability", terms: ["protect", "protection", "survivability", "armour", "armor", "countermeasure", "resilience", "threat"] }
] as const;

const mandatoryTitleAnchors = new Set(["maritime", "arctic", "cyber", "energy", "logistics", "aerospace", "land", "fires", "medical", "materials", "protection"]);
const specificSingleAnchors = new Set(["maritime", "arctic", "logistics", "land", "fires", "medical"]);

export function suggestDemandMatches(
  organizations: OrganizationInput[],
  demandRequirements: DemandInput[],
  existingPairs: Set<string> = new Set()
): DemandMatchCandidate[] {
  return organizations.flatMap((organization) => organization.capabilities.flatMap((capability) => {
    const capabilityText = [
      capability.name,
      capability.summary,
      capability.capabilityType,
      ...capability.coreFeatures,
      ...capability.defenceApplications,
      ...capability.novelty,
      ...capability.technicalTags,
      ...capability.technicalDomains.flatMap((domain) => [domain.name, domain.summary])
    ].filter(Boolean).join(" ");
    const capabilityConcepts = findConcepts(capabilityText);

    return demandRequirements.flatMap((demand): DemandMatchCandidate[] => {
      if (existingPairs.has(`${capability.id}:${demand.id}`)) return [];
      const demandConcepts = findConcepts(`${demand.title} ${demand.problemStatement} ${demand.desiredEndState}`);
      const titleConcepts = findConcepts(demand.title);
      const requiredAnchors = [...titleConcepts].filter((key) => mandatoryTitleAnchors.has(key));
      const shared = [...capabilityConcepts].filter((key) => demandConcepts.has(key));
      const specificSingleAnchor = requiredAnchors.length === 1 && specificSingleAnchors.has(requiredAnchors[0]);
      if ((shared.length < 2 && !specificSingleAnchor) || !requiredAnchors.length || requiredAnchors.some((key) => !capabilityConcepts.has(key))) return [];
      const matchedConcepts = shared.map((key) => concepts.find((concept) => concept.key === key)?.label ?? key);
      const conceptPhrase = naturalList(matchedConcepts.slice(0, 3));
      const alignmentSummary = `${capability.name} may help teams working on ${demand.title} by contributing to ${conceptPhrase}.`;
      const rationale = `This private suggestion is based on overlapping concepts in the reviewed technology profile and the public demand statement: ${conceptPhrase}. A reviewer must compare the underlying sources, confirm that the relationship is decision-useful, edit the wording if needed, and explicitly publish it before anyone sees it on a public profile.`;
      const reviewerRationale = `Review whether ${organization.name}’s ${capability.name} has a defensible, useful connection to ${demand.title}. The system found overlap in ${conceptPhrase}; this is a discovery aid, not evidence of eligibility, endorsement, procurement intent, or classified demand.`;
      const candidate = demandMatchCandidateSchema.parse({
        schemaVersion: "demand_match_bundle_v1",
        capabilityId: capability.id,
        capabilitySlug: capability.slug,
        capabilityName: capability.name,
        organizationId: organization.id,
        organizationSlug: organization.slug,
        organizationName: organization.name,
        demandRequirementId: demand.id,
        demandSlug: demand.slug,
        demandTitle: demand.title,
        matchType: "derived",
        alignmentSummary,
        rationale,
        confidence: "needs_review",
        matchedConcepts,
        reviewerRationale
      });
      return [candidate];
    });
  })).sort((a, b) => b.matchedConcepts.length - a.matchedConcepts.length || a.organizationName.localeCompare(b.organizationName));
}

function findConcepts(value: string) {
  const normalized = ` ${value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim()} `;
  return new Set(concepts.filter((concept) => concept.terms.some((term) => normalized.includes(` ${term.replace(/[^a-z0-9]+/g, " ")} `))).map((concept) => concept.key));
}

function naturalList(values: string[]) {
  if (values.length <= 1) return values[0] ?? "the identified mission need";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}
