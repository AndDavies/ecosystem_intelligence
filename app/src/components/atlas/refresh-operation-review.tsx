import React from "react";
import type { ReviewableRefreshCandidate } from "@/lib/atlas/candidate-schema";

type RefreshOperation = ReviewableRefreshCandidate["operations"][number];

type ReviewChange = {
  field: string;
  before: unknown;
  after: unknown;
  isNew: boolean;
};

const hiddenReviewFields = new Set(["id", "slug", "parentId"]);

export function RefreshOperationReview({ operation }: { operation: RefreshOperation }) {
  const actionLabel = operationActionLabel(operation);
  const after = operation.operation === "add_child" ? operation.value : operation.after;
  const childTitle = operation.operation === "add_child" || operation.operation === "update_child"
    ? recordValue(after, "name") ?? recordValue(after, "title")
    : null;
  const changes = changesForOperation(operation);

  return (
    <section className="min-w-0 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          {childTitle ? <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--admin-action)]">{actionLabel}</p> : null}
          <h3 className={`${childTitle ? "mt-1 " : ""}text-base font-semibold text-[var(--admin-ink)]`}>{childTitle ?? actionLabel}</h3>
        </div>
        <span className="rounded-full border border-[var(--admin-border)] bg-white px-2.5 py-1 text-[10px] font-semibold text-[var(--admin-muted-strong)]">
          {changes.length} proposed {changes.length === 1 ? "change" : "changes"}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-[var(--admin-muted-strong)]">{operation.reviewerExplanation}</p>
      {operation.operation === "add_child" ? (
        <p className="mt-3 rounded-md border border-dashed border-[var(--admin-border-strong)] bg-white p-3 text-xs text-[var(--admin-muted-strong)]">
          This {entityLabel(operation.entityType)} is not currently on the record. Publishing will add it without replacing existing content.
        </p>
      ) : null}
      <div className="mt-3 grid gap-2">
        {changes.map((change) => <RefreshFieldChange key={change.field} {...change} />)}
      </div>
    </section>
  );
}

export function changesForOperation(operation: RefreshOperation): ReviewChange[] {
  if (operation.operation === "set_field") {
    return sameValue(operation.before, operation.after)
      ? []
      : [{ field: operation.field, before: operation.before, after: operation.after, isNew: false }];
  }

  if (operation.operation === "set_profile_field") {
    return sameValue(operation.before, operation.after)
      ? []
      : [{ field: operation.profileField, before: operation.before, after: operation.after, isNew: false }];
  }

  if (operation.operation === "add_child") {
    return visibleEntries(operation.value).map(([field, after]) => ({
      field,
      before: undefined,
      after,
      isNew: true
    }));
  }

  const before = asRecord(operation.before);
  return visibleEntries(operation.after)
    .filter(([field, after]) => !sameValue(before[field], after))
    .map(([field, after]) => ({
      field,
      before: before[field],
      after,
      isNew: false
    }));
}

function RefreshFieldChange({ field, before, after, isNew }: ReviewChange) {
  const listDiff = Array.isArray(before) && Array.isArray(after) ? diffLists(before, after) : null;
  const useListDiff = listDiff && (listDiff.removed.length > 0 || listDiff.added.length > 0);

  return (
    <div className="min-w-0 rounded-md border border-[var(--admin-border-subtle)] bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--admin-muted)]">{fieldLabel(field)}</p>
      {useListDiff ? (
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <ReviewValue label="Removed" value={listDiff.removed} tone="removed" empty="None" />
          <ReviewValue label="Added" value={listDiff.added} tone="added" empty="None" />
        </div>
      ) : isNew ? (
        <ReviewValue label="New value" value={after} tone="added" />
      ) : (
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <ReviewValue label="Current" value={before} />
          <ReviewValue label="Proposed" value={after} tone="added" />
        </div>
      )}
    </div>
  );
}

function ReviewValue({ label, value, tone = "default", empty = "Not set" }: { label: string; value: unknown; tone?: "default" | "added" | "removed"; empty?: string }) {
  const toneClass = tone === "added"
    ? "border-[var(--admin-success-border)] bg-[var(--admin-success-soft)]"
    : tone === "removed"
      ? "border-[var(--admin-danger-border)] bg-[var(--admin-danger-soft)]"
      : "border-[var(--admin-border)] bg-[var(--admin-surface-soft)]";

  return (
    <div className={`rounded-md border p-2.5 ${toneClass}`}>
      <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--admin-muted)]">{label}</p>
      <div className="mt-1 min-w-0 break-words text-xs leading-5 text-[var(--admin-ink-soft)] [overflow-wrap:anywhere]"><ReadableValue value={value} empty={empty} /></div>
    </div>
  );
}

function ReadableValue({ value, empty }: { value: unknown; empty: string }) {
  if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
    return <span className="text-[var(--admin-muted)]">{empty}</span>;
  }
  if (Array.isArray(value)) {
    return <ul className="list-disc space-y-1 pl-4">{value.map((item, index) => <li key={`${comparisonKey(item)}-${index}`}><ReadableValue value={item} empty="Not set" /></li>)}</ul>;
  }
  if (typeof value === "object") {
    return (
      <dl className="grid gap-2">
        {Object.entries(asRecord(value)).map(([key, nested]) => (
          <div key={key}>
            <dt className="font-semibold">{fieldLabel(key)}</dt>
            <dd className="text-[var(--admin-muted-strong)]"><ReadableValue value={nested} empty="Not set" /></dd>
          </div>
        ))}
      </dl>
    );
  }
  if (typeof value === "boolean") return <span>{value ? "Yes" : "No"}</span>;
  return <span className="whitespace-pre-wrap">{String(value)}</span>;
}

function operationActionLabel(operation: RefreshOperation) {
  if (operation.operation === "add_child") return `Add ${entityLabel(operation.entityType)}`;
  if (operation.operation === "update_child") return `Update ${entityLabel(operation.entityType)}`;
  if (operation.operation === "set_profile_field") return `Update ${fieldLabel(operation.profileField)}`;
  return `Update ${fieldLabel(operation.field)}`;
}

function visibleEntries(value: unknown) {
  return Object.entries(asRecord(value)).filter(([field]) => !hiddenReviewFields.has(field));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function recordValue(value: unknown, key: string) {
  const found = asRecord(value)[key];
  return typeof found === "string" ? found : null;
}

function sameValue(left: unknown, right: unknown) {
  return comparisonKey(left) === comparisonKey(right);
}

function comparisonKey(value: unknown) {
  return JSON.stringify(value) ?? String(value);
}

function diffLists(before: unknown[], after: unknown[]) {
  const previous = new Map(before.map((value) => [comparisonKey(value), value]));
  const proposed = new Map(after.map((value) => [comparisonKey(value), value]));
  return {
    removed: [...previous].filter(([key]) => !proposed.has(key)).map(([, value]) => value),
    added: [...proposed].filter(([key]) => !previous.has(key)).map(([, value]) => value)
  };
}

export function fieldLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b(url|id)\b/gi, (token) => token.toUpperCase())
    .replace(/^./, (letter) => letter.toUpperCase());
}

export function entityLabel(value: string) {
  return value === "capability" ? "technology" : value === "demand_requirement" ? "demand statement" : value.replaceAll("_", " ");
}

export function humanizeFieldPath(value: string) {
  return value.split(".").map(fieldLabel).join(" · ");
}
