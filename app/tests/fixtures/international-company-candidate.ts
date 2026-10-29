import { organizationBundleV3Schema } from "../../src/lib/research/pipeline-schema";
import { buildMinimalOrganizationV3Candidate } from "./organization-dossier-candidates";

export function internationalCompanyCandidate() {
  const candidate = organizationBundleV3Schema.parse(buildMinimalOrganizationV3Candidate());
  candidate.organization.primaryLocation = { city: "South San Francisco", provinceTerritory: "California", countryCode: "US", latitude: 37.6547, longitude: -122.4077, geographicConfidence: "city_centroid" };
  candidate.organization.description = "A foreign maritime technology company with an evidenced operating facility and concrete marine systems.";
  candidate.organization.executiveRelevanceSummary = null;
  candidate.organization.primaryLocation!.locationRole = "facility";
  candidate.fieldEvidence.push({ id: "actual-location-role", sourceId: candidate.sources[0].id, fieldPath: "organization.primaryLocation.locationRole", claimClass: "source_backed", excerpt: "The official company source identifies its operating facility at the stated location.", confidence: "high" });
  return candidate;
}
