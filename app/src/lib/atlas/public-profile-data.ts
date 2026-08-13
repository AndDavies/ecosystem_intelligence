import { publicContactFromProfileData } from "@/lib/atlas/presentation";
import type { AtlasEntityKind } from "@/types/atlas";

export const organizationProfileFieldAllowlist = {
  company: [
    "portfolioScope", "portfolioSummary", "manufacturingModel", "intellectualProperty",
    "operatingModel", "securityPosture", "qualityCertification", "operatingUnits",
    "parentOrganization"
  ],
  accelerator: ["mandate", "cohortModel", "sectorFocus", "parentOrganization"],
  incubator: ["mandate", "cohortModel", "sectorFocus", "parentOrganization"],
  research_test_centre: [
    "technicalMandate", "institutionalRelationship", "parentOrganization", "priorityAreas",
    "testbedPlatforms", "operatingEnvironment", "secureEnvironmentRole", "strategicSectors"
  ],
  investor_funder: ["mandate", "investmentFocus", "portfolioSummary", "parentOrganization"],
  ecosystem_organization: ["mandate", "sectorFocus", "parentOrganization"],
  government_innovation_office: ["mandate", "parentOrganization", "classificationNote"]
} as const satisfies Record<AtlasEntityKind, readonly string[]>;

export const forbiddenPublicProfileDataKeys = [
  "reviewed_candidate_id",
  "reviewed_by",
  "research_schema_version",
  "ingestion_batch_id"
] as const;

function isPublicProfileValue(value: unknown) {
  return (typeof value === "string" && value.trim().length > 0)
    || (Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim().length > 0));
}

/**
 * Project the public organization profile from the role-specific research
 * contract. Candidate/reviewer lineage is intentionally retained only in the
 * private review, run and audit tables.
 */
export function publicProfileData(
  value: unknown,
  entityKind: AtlasEntityKind
): Record<string, unknown> {
  const candidate = value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const result: Record<string, unknown> = {};
  for (const field of organizationProfileFieldAllowlist[entityKind]) {
    if (isPublicProfileValue(candidate[field])) result[field] = candidate[field];
  }

  const contact = publicContactFromProfileData(candidate);
  const publicContact = Object.fromEntries(
    Object.entries(contact).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );
  if (Object.keys(publicContact).length > 0) result.publicContact = publicContact;
  return result;
}
