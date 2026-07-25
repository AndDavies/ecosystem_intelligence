import type {
  AtlasAlignmentType,
  AtlasCluster,
  AtlasConfidence,
  AtlasDemandMatch,
  AtlasEntityKind,
  AtlasLocation
} from "@/types/atlas";
import { toTitleCase } from "@/lib/utils";

export interface AtlasPublicContact {
  contactPageUrl: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
  linkedInUrl: string | null;
}

export function assessmentConfidenceLabel(confidence: AtlasConfidence) {
  if (confidence === "high") return "High";
  if (confidence === "moderate") return "Moderate";
  return "Needs review";
}

export function evidenceStrengthLabel(confidence: AtlasConfidence) {
  if (confidence === "high") return "Strong";
  if (confidence === "moderate") return "Moderate";
  return "Limited";
}

export function alignmentTypeLabel(matchType: AtlasAlignmentType) {
  return matchType === "public_source_alignment" ? "Connected by a public source" : "Reviewed connection";
}

export function alignmentSubject(
  match: { missionArea: { name: string } } | Pick<AtlasDemandMatch, "demandTitle">
) {
  return "missionArea" in match ? match.missionArea.name : match.demandTitle;
}

export function locationAccuracyLabel(confidence: AtlasLocation["geographicConfidence"]) {
  if (confidence === "exact") return "Exact location";
  if (confidence === "city_centroid") return "City-level";
  if (confidence === "regional") return "Region-level";
  return "Not verified";
}

export function publicSourceCountLabel(count: number) {
  return `${count} public ${count === 1 ? "source" : "sources"}`;
}

export function clusterBasisLabel(basis: AtlasCluster["clusterBasis"]) {
  if (basis === "program") return "Grouped by shared program";
  if (basis === "geographic") return "Grouped by location";
  if (basis === "technical") return "Grouped by technology";
  return "Grouped by editorial review";
}

const organizationKindLabels: Record<AtlasEntityKind, [string, string]> = {
  company: ["Company", "Companies"],
  accelerator: ["Accelerator", "Accelerators"],
  incubator: ["Incubator", "Incubators"],
  research_test_centre: ["Research and test centre", "Research and test centres"],
  investor_funder: ["Investor or funder", "Investors and funders"],
  ecosystem_organization: ["Ecosystem organization", "Ecosystem organizations"],
  government_innovation_office: ["Government innovation office", "Government innovation offices"]
};

/** Tolerates unknown values so an unrecognized URL filter cannot break the page. */
export function organizationKindLabel(entityKind: string, plural = false) {
  const entry = organizationKindLabels[entityKind as AtlasEntityKind];
  return entry ? entry[plural ? 1 : 0] : toTitleCase(entityKind);
}

export function organizationOfferingTitle(entityKind: AtlasEntityKind, name: string) {
  if (entityKind === "company") return `${name}’s Tech`;
  if (entityKind === "research_test_centre") return "Facilities & Expertise";
  if (entityKind === "accelerator" || entityKind === "incubator") return "Programs & Support";
  if (entityKind === "investor_funder") return "Investment Focus";
  return `What ${name} Offers`;
}

export function organizationOfferingGap(entityKind: AtlasEntityKind, name: string) {
  if (entityKind === "company") return `We have not published a reviewed technology profile for ${name} yet.`;
  if (entityKind === "research_test_centre") return "We have not published a reviewed summary of this centre’s facilities or technical expertise yet.";
  if (entityKind === "accelerator" || entityKind === "incubator") return "We have not published a reviewed summary of this organization’s programs or support yet.";
  if (entityKind === "investor_funder") return "We have not published a reviewed summary of this investor’s focus or criteria yet.";
  return "We have not published a reviewed summary of what this organization offers yet.";
}

export function organizationSnapshotTitle(entityKind: AtlasEntityKind) {
  return entityKind === "company" ? "Company snapshot" : "Organization snapshot";
}

export function organizationWebsiteLabel(entityKind: AtlasEntityKind) {
  return entityKind === "company" ? "Visit company website" : "Visit organization website";
}

export function publicContactFromProfileData(profileData: Record<string, unknown>): AtlasPublicContact {
  const candidate = asRecord(profileData.publicContact);

  return {
    contactPageUrl: safeHttpsUrl(candidate.contactPageUrl),
    publicEmail: safeEmail(candidate.publicEmail),
    publicPhone: safeText(candidate.publicPhone, 80),
    linkedInUrl: safeHttpsUrl(candidate.linkedInUrl)
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function safeHttpsUrl(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function safeEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function safeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text && text.length <= maxLength ? text : null;
}
