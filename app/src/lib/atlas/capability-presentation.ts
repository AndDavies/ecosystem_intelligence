import type { AtlasCapability, AtlasCitation } from "@/types/atlas";

export type CapabilitySource = {
  source: AtlasCitation;
  evidence: Array<{ citation: AtlasCitation; associations: string[] }>;
};

/** Group public sources without losing the different claims a source supports. */
export function capabilitySources(capability: AtlasCapability): CapabilitySource[] {
  const sources = new Map<string, CapabilitySource>();
  const add = (citation: AtlasCitation, association: string) => {
    let group = sources.get(citation.sourceUrl);
    if (!group) {
      group = { source: citation, evidence: [] };
      sources.set(citation.sourceUrl, group);
    }
    const existing = group.evidence.find((entry) => entry.citation.id === citation.id);
    if (existing) {
      if (!existing.associations.includes(association)) existing.associations.push(association);
    } else {
      group.evidence.push({ citation, associations: [association] });
    }
  };
  capability.citations.forEach((citation) => add(citation, `Capability · ${citation.fieldName.replaceAll("_", " ")}`));
  capability.missionMatches.forEach((match) => match.citations.forEach((citation) => add(citation, `Mission area · ${match.missionArea.name}`)));
  capability.demandMatches.forEach((match) => match.citations.forEach((citation) => add(citation, `Defence need · ${match.demandTitle}`)));
  return [...sources.values()];
}

export function capabilityEvidenceLimits(capability: AtlasCapability) {
  const limits: Array<{ label: string; text: string }> = [];
  if (capability.technologyReadinessLevel === null) limits.push({ label: "Readiness", text: "A technology readiness level is not established by the reviewed public sources." });
  if (!capability.maturity) limits.push({ label: "Maturity", text: "A specific maturity stage is not established by the reviewed public sources." });
  if (!capability.commercialAvailability) limits.push({ label: "Availability", text: "Commercial availability is not established by the reviewed public sources." });
  if (!capability.missionMatches.length && !capability.demandMatches.length) limits.push({ label: "Reviewed connections", text: "No reviewed Mission area or released Defence need connection is currently published." });
  if (!capability.citations.length) limits.push({ label: "Capability evidence", text: "No capability-specific public citation is currently published." });
  return limits.length ? limits : [{ label: "Operating performance", text: "Performance in a specific operating environment still requires direct verification beyond the reviewed public record." }];
}
