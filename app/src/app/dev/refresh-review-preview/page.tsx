import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RefreshOperationReview } from "@/components/atlas/refresh-operation-review";
import { PublicPageShell } from "@/components/atlas/public-page-shell";
import type { ReviewableRefreshCandidate } from "@/lib/atlas/candidate-schema";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Refresh review local preview",
  robots: { index: false, follow: false }
};

type RefreshOperation = ReviewableRefreshCandidate["operations"][number];

const targetId = "c02a3b39-6443-4d1d-a26c-ed898bf905a4";
const base = {
  entityType: "organization",
  targetId,
  evidenceIds: ["preview-evidence"],
  leafEvidence: [{ fieldPath: "after", evidenceIds: ["preview-evidence"] }]
};

const previewOperations = [
  {
    ...base,
    operationId: "preview-operating-context",
    operation: "set_field",
    field: "operating_context",
    before: null,
    after: "Northern Vector Systems integrates maritime sensors, edge processing and operator software for government and commercial users.",
    reviewerExplanation: "Add the operating context for Northern Vector Systems from its official profile, anchored to maritime sensors, edge processing and operator software."
  },
  {
    ...base,
    operationId: "preview-current-activity-as-of",
    operation: "set_field",
    field: "current_activity_as_of",
    before: null,
    after: "2026-04-20",
    reviewerExplanation: "Record the current activity as of date as 2026-04-20 because the cited contract publishes that event date."
  },
  {
    ...base,
    operationId: "preview-public-contact",
    operation: "set_field",
    field: "public_contact",
    before: "A legacy prose contact statement.",
    after: { contactPageUrl: "https://example.com/contact", publicEmail: "hello@example.com", publicPhone: null, linkedInUrl: null },
    reviewerExplanation: "Normalize the public contact field from the official contact page https://example.com/contact and retain unsupported telephone and LinkedIn values as null."
  },
  {
    ...base,
    operationId: "preview-reviewed-questions",
    operation: "set_field",
    field: "reviewed_questions",
    before: [],
    after: [{ id: "preview-first-conversation", question: "Which measured test results are available to prospective operators?", context: "The public contract establishes a test path but does not disclose acceptance results.", confidence: "moderate" }],
    reviewerExplanation: "Add the reviewed questions field with a decision prompt about measured test results and operator acceptance."
  },
  {
    ...base,
    operationId: "preview-clear-current-activity",
    operation: "set_field",
    field: "current_activity",
    before: "Legacy undated product description that is not a material current development.",
    after: null,
    reviewerExplanation: "Clear the current activity field because the legacy undated product description does not establish a material development."
  },
  {
    ...base,
    operationId: "preview-mission-match-update",
    operation: "update_child",
    entityType: "capability",
    parentId: targetId,
    targetId: "94058484-b4ce-463c-80ed-60cabbd7a3b4",
    before: { name: "Navigator", summary: "Supported underwater navigation capability.", missionMatches: [] },
    after: {
      name: "Navigator",
      summary: "Supported underwater navigation capability.",
      missionMatches: [{ missionAreaSlug: "underwater-isr", alignmentSummary: "Supports underwater search and survey workflows.", matchClass: "relevant", confidence: "moderate" }]
    },
    reviewerExplanation: "Update the Navigator technology relationship by adding the underwater ISR premise supported by its underwater search and survey role."
  }
] as unknown as RefreshOperation[];

export default function RefreshReviewPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <PublicPageShell
      variant="admin"
      eyebrow="Local review fixture"
      title="Refresh operation presentation"
      description="Development-only coverage for scalar, date, structured-object, array, relationship and clear-to-null proposals."
      backHref="/dev/dossier-preview"
      backLabel="Dossier preview"
    >
      <div className="grid gap-4">
        {previewOperations.map((operation) => <RefreshOperationReview key={operation.operationId} operation={operation} />)}
      </div>
    </PublicPageShell>
  );
}
