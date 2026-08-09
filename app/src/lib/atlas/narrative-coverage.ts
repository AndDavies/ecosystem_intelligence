export type NarrativeStatus = "published_v1" | "pending_review" | "research_required";

export const narrativeStatusOrder: Record<NarrativeStatus, number> = {
  research_required: 0,
  pending_review: 1,
  published_v1: 2
};

export function deriveNarrativeStatus({
  publishedV1,
  pendingReview
}: {
  publishedV1: boolean;
  pendingReview: boolean;
}): NarrativeStatus {
  if (publishedV1) return "published_v1";
  if (pendingReview) return "pending_review";
  return "research_required";
}
