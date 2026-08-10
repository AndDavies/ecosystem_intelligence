import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { RefreshOperationReview, changesForOperation } from "@/components/atlas/refresh-operation-review";
import type { ReviewableRefreshCandidate } from "@/lib/atlas/candidate-schema";

type RefreshOperation = ReviewableRefreshCandidate["operations"][number];

const operationBase = {
  operationId: "review-operation",
  entityType: "organization",
  targetId: "c02a3b39-6443-4d1d-a26c-ed898bf905a4",
  evidenceIds: ["evidence-1"],
  leafEvidence: [{ fieldPath: "after", evidenceIds: ["evidence-1"] }],
  reviewerExplanation: "Review this record-specific proposal against the cited source before deciding whether it should advance."
};

function render(operation: unknown) {
  return renderToStaticMarkup(createElement(RefreshOperationReview, { operation: operation as RefreshOperation }));
}

describe("refresh operation review presentation", () => {
  it("keeps the visual QA fixture development-only and noindex", async () => {
    const preview = await readFile(path.resolve("src/app/dev/refresh-review-preview/page.tsx"), "utf8");
    expect(preview).toContain('process.env.NODE_ENV !== "development"');
    expect(preview).toContain("notFound()");
    expect(preview).toContain("index: false, follow: false");
    expect(preview).toContain("RefreshOperationReview");
    expect(preview).toContain("preview-mission-match-update");
  });

  it("renders scalar prose as one proposed change", () => {
    const operation = { ...operationBase, operation: "set_field", field: "operating_context", before: null, after: "A source-backed operating context for the organization." };
    const markup = render(operation);

    expect(changesForOperation(operation as RefreshOperation)).toHaveLength(1);
    expect(markup).toContain("1 proposed change");
    expect(markup).toContain("Current");
    expect(markup).toContain("Proposed");
    expect(markup).toContain("A source-backed operating context");
  });

  it("shows a date operation once and never calls it reviewed", () => {
    const markup = render({ ...operationBase, operation: "set_field", field: "current_activity_as_of", before: null, after: "2026-03-25" });

    expect(markup.match(/Update Current activity as of/g)).toHaveLength(1);
    expect(markup).toContain("2026-03-25");
    expect(markup).toContain("1 proposed change");
    expect(markup).not.toContain("fields reviewed");
  });

  it("renders reviewed-question objects without object string coercion", () => {
    const markup = render({
      ...operationBase,
      operation: "set_field",
      field: "reviewed_questions",
      before: [],
      after: [{ id: "first-conversation", question: "Which measured result is decision-useful?", context: "Public evidence does not yet establish the answer.", confidence: "moderate" }]
    });

    expect(markup).toContain("Which measured result is decision-useful?");
    expect(markup).toContain("Public evidence does not yet establish the answer.");
    expect(markup).not.toContain("[object Object]");
  });

  it("makes an explicit clear-to-null operation visible", () => {
    const markup = render({ ...operationBase, operation: "set_field", field: "current_activity", before: "Legacy undated activity text", after: null });

    expect(markup).toContain("Legacy undated activity text");
    expect(markup).toContain("Proposed");
    expect(markup).toContain("Not set");
  });

  it("treats a structured contact migration as one organization-field change", () => {
    const markup = render({
      ...operationBase,
      operation: "set_field",
      field: "public_contact",
      before: "Legacy prose contact",
      after: { contactPageUrl: "https://example.com/contact", publicEmail: null, publicPhone: null, linkedInUrl: null }
    });

    expect(markup).toContain("1 proposed change");
    expect(markup).toContain("Contact Page URL");
    expect(markup).toContain("https://example.com/contact");
    expect(markup).toContain("overflow-wrap:anywhere");
  });

  it("shows only changed update-child fields and keeps a distinct child title", () => {
    const operation = {
      ...operationBase,
      operation: "update_child",
      entityType: "capability",
      parentId: operationBase.targetId,
      targetId: "94058484-b4ce-463c-80ed-60cabbd7a3b4",
      before: { name: "Navigator", summary: "Current supported summary", maturity: "fielded" },
      after: { name: "Navigator", summary: "Proposed supported summary", maturity: "fielded" }
    };
    const markup = render(operation);

    expect(changesForOperation(operation as unknown as RefreshOperation)).toHaveLength(1);
    expect(markup).toContain("Update technology");
    expect(markup).toContain("Navigator");
    expect(markup).toContain("1 proposed change");
    expect(markup).not.toContain("fields reviewed");
  });

  it("never hides a changed Mission Area relationship", () => {
    const operation = {
      ...operationBase,
      operation: "update_child",
      entityType: "capability",
      parentId: operationBase.targetId,
      targetId: "94058484-b4ce-463c-80ed-60cabbd7a3b4",
      before: { name: "Navigator", summary: "Supported summary", missionMatches: [] },
      after: {
        name: "Navigator",
        summary: "Supported summary",
        missionMatches: [{ missionAreaSlug: "underwater-isr", alignmentSummary: "Supports underwater search and survey workflows.", matchClass: "relevant", confidence: "moderate" }]
      }
    };
    const markup = render(operation);

    expect(changesForOperation(operation as unknown as RefreshOperation)).toHaveLength(1);
    expect(markup).toContain("Mission Matches");
    expect(markup).toContain("underwater-isr");
    expect(markup).toContain("1 proposed change");
    expect(markup).not.toContain("0 proposed changes");
  });
});
