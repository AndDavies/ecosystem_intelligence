import type { AtlasCitation, AtlasOrganization } from "@/types/atlas";
import type { CapabilitySource } from "@/lib/atlas/capability-presentation";

/** Preserve every claim passage/locator while deduplicating source rows by URL. */
export function organizationDossierSources(organization: AtlasOrganization): CapabilitySource[] {
  const sources = new Map<string, CapabilitySource>();
  const add = (citation: AtlasCitation, association: string) => {
    let source = sources.get(citation.sourceUrl);
    if (!source) { source = { source: citation, evidence: [] }; sources.set(citation.sourceUrl, source); }
    const evidence = source.evidence.find(item => item.citation.id === citation.id);
    if (evidence) { if (!evidence.associations.includes(association)) evidence.associations.push(association); }
    else source.evidence.push({ citation, associations: [association] });
  };
  organization.citations.forEach(citation => add(citation, `Profile · ${citation.fieldName.replaceAll("_", " ")}`));
  organization.mediaAssets.forEach(media => media.citations.forEach(citation => add(citation, `Media · ${citation.fieldName.replaceAll("_", " ")}`)));
  organization.capabilities.forEach(capability => {
    capability.citations.forEach(citation => add(citation, `${capability.name} · ${citation.fieldName.replaceAll("_", " ")}`));
    capability.missionMatches.forEach(match => match.citations.forEach(citation => add(citation, `${capability.name} → ${match.missionArea.name}`)));
    capability.demandMatches.forEach(match => match.citations.forEach(citation => add(citation, `${capability.name} → ${match.demandTitle}`)));
  });
  organization.programs.forEach(participation => {
    participation.citations.forEach(citation => add(citation, `${participation.programName} · organization participation`));
    participation.programCitations.forEach(citation => add(citation, `${participation.programName} · canonical program`));
  });
  organization.relationships.forEach(relationship => relationship.citations.forEach(citation => add(citation, `${relationship.relationshipType} relationship`)));
  organization.fundingEvents.forEach(event => event.citations.forEach(citation => add(citation, `${event.eventType} funding event`)));
  return [...sources.values()];
}
