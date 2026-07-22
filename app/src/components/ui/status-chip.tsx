import type { HTMLAttributes } from "react";
import { Badge } from "@/components/ui/badge";

type StatusTone = "neutral" | "evidence" | "signal" | "success" | "warning" | "danger";

const statusTone: Record<string, StatusTone> = {
  published: "success",
  approved: "success",
  current: "success",
  pending: "warning",
  review_due: "warning",
  deferred: "warning",
  rejected: "danger",
  stale: "danger",
  needs_review: "warning",
  high: "success",
  moderate: "warning"
};

export function StatusChip({ status, label, ...props }: HTMLAttributes<HTMLSpanElement> & { status: string; label?: string }) {
  return <Badge tone={statusTone[status] ?? "neutral"} {...props}>{label ?? status.replaceAll("_", " ")}</Badge>;
}
