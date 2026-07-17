import type {
  AtlasAlignmentType,
  AtlasConfidence,
  AtlasDemandMatch,
  AtlasLocation,
  AtlasMissionMatch
} from "@/types/atlas";

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
  return matchType === "public_source_alignment" ? "Source-backed match" : "Analyst assessment";
}

export function alignmentSubject(match: AtlasMissionMatch | AtlasDemandMatch) {
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
