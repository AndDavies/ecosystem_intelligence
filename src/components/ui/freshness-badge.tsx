import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { FreshnessState } from "@/lib/freshness";

type FreshnessBadgeState = Pick<FreshnessState, "label" | "tone" | "detail">;

export function FreshnessBadge({
  freshness,
  showIcon = true
}: {
  freshness: FreshnessBadgeState;
  showIcon?: boolean;
}) {
  const Icon = getFreshnessIcon(freshness.tone);

  return (
    <Badge tone={freshness.tone} title={freshness.detail}>
      {showIcon ? <Icon className="mr-1.5 size-3" /> : null}
      {freshness.label}
    </Badge>
  );
}

function getFreshnessIcon(tone: FreshnessBadgeState["tone"]) {
  if (tone === "success") {
    return CheckCircle2;
  }

  if (tone === "danger") {
    return AlertTriangle;
  }

  return Clock3;
}
