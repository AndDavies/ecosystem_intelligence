export type MarketingScorecardEvent = {
  context_path?: string | null;
  cohort?: string | null;
  metadata?: unknown;
};

const excludedCohorts = new Set([
  "qa",
  "staff",
  "test",
  "internal",
  "tnm-qa",
  "tnm-staff",
  "tnm-test",
  "automation-test"
]);

function eventMetadata(value: unknown) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

/** Raw bounded events remain in the private 30-day ledger. This projection is
 * used only for acquisition scorecards so local, staff and explicit QA traffic
 * cannot be mistaken for visitor conversion.
 */
export function isMarketingScorecardEvent(event: MarketingScorecardEvent) {
  const metadata = eventMetadata(event.metadata);
  const cohort = event.cohort?.trim().toLowerCase() ?? "";
  if (event.context_path?.startsWith("/dev/")) return false;
  if (metadata.utm_source === "qa" || metadata.traffic_class === "qa") return false;
  if (excludedCohorts.has(cohort)) return false;
  return true;
}
