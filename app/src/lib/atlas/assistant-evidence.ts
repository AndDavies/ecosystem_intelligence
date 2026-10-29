import type { AtlasCitation, AtlasOrganization } from "@/types/atlas";

/** Shared with the Ask loader: only these citation fields enter its catalogue. */
export const assistantEvidenceFields = {
  organization: ["name", "legal_name", "entity_kind", "description", "operating_context", "canadian_footprint", "defence_posture", "dual_use_posture", "commercial_status", "primary_location", "primary_location.city", "primary_location.provinceterritory", "primary_location.countrycode", "profileData.mandate", "profileData.operatingModel", "profileData.qualityCertification", "profileData.securityPosture"],
  capability: ["name", "summary", "core_features", "defence_applications", "maturity", "commercial_availability", "technology_readiness_level", "update_child", "add_child"]
};

const optionalText = (value: string | null) => value === "" ? null : value;

function evidence(citations: AtlasCitation[], fields: string[]) {
  const admitted = new Set(fields);
  return citations.filter(citation => admitted.has(citation.fieldName)).map(citation => ({
    id: citation.id, fieldName: citation.fieldName, sourceTitle: citation.sourceTitle,
    sourceUrl: citation.sourceUrl, publisher: citation.publisher, sourceType: citation.sourceType,
    excerpt: citation.excerpt, publishedAt: citation.publishedAt
  }));
}

/**
 * Compare the facts actually admitted to Ask in both loader representations.
 * Discovery stubs intentionally omit dossier-only prose/media/funding, locators
 * and relationship citations. Those additions are not evidence changes. IDs,
 * ownership, qualifiers, reviewed alignments and all admitted citations remain.
 */
export function assistantEvidenceProjection(organization: AtlasOrganization) {
  return {
    id: organization.id, slug: organization.slug, name: organization.name, legalName: optionalText(organization.legalName),
    websiteUrl: optionalText(organization.websiteUrl), description: organization.description, entityKind: organization.entityKind,
    categories: organization.categories, sourceConfidence: organization.sourceConfidence,
    freshnessStatus: organization.freshnessStatus, lastReviewedAt: organization.lastReviewedAt,
    companyStage: organization.companyStage, defencePosture: optionalText(organization.defencePosture), dualUsePosture: optionalText(organization.dualUsePosture),
    primaryLocation: organization.primaryLocation, locations: organization.locations,
    programs: organization.programs.map(program => ({
      id: program.id, programSlug: program.programSlug, programName: program.programName, programType: program.programType,
      participationType: program.participationType, cohortLabel: program.cohortLabel
    })),
    citations: evidence(organization.citations, assistantEvidenceFields.organization),
    capabilities: organization.capabilities.map(({ presentationCopy: _presentationCopy, ...capability }) => ({
      ...capability,
      maturity: optionalText(capability.maturity), commercialAvailability: optionalText(capability.commercialAvailability),
      novelty: capability.novelty.filter(Boolean),
      citations: evidence(capability.citations, assistantEvidenceFields.capability),
      missionMatches: capability.missionMatches.map(({ citations: _citations, ...match }) => match),
      demandMatches: capability.demandMatches.map(({ citations: _citations, ...match }) => match)
    }))
  };
}
