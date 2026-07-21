export function buildDefaultResearchRunId({
  trigger,
  bootstrap,
  startedAt
}: {
  trigger: "manual" | "weekly";
  bootstrap: boolean;
  startedAt: string;
}) {
  const date = startedAt.slice(0, 10);
  if (trigger === "weekly" && !bootstrap) return `tnm-weekly-${date}`;
  const timestamp = startedAt.replace(/\D/g, "").slice(0, 14);
  return `tnm-${bootstrap ? "bootstrap" : "manual"}-${timestamp}`;
}
