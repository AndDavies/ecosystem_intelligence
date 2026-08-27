export type MarketingScorecardEvent = {
  event_name?: string | null;
  context_path?: string | null;
  cohort?: string | null;
  metadata?: unknown;
  traffic_class?: string | null;
  entry_channel?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  occurred_at?: string | null;
  received_at?: string | null;
  created_at?: string | null;
};

export const meaningfulMarketingEvents = [
  "result_select",
  "dossier_open",
  "evidence_open",
  "save",
  "feedback",
  "submission",
  "connection",
  "newsletter_form_start",
  "newsletter_success"
] as const;

export type MeaningfulMarketingEvent = (typeof meaningfulMarketingEvents)[number];
export type MarketingBreakdownRow = {
  dimension: "Campaign / cohort" | "Source / medium" | "Content" | "Destination route";
  value: string;
  counts: Record<MeaningfulMarketingEvent, number>;
  total: number;
};

export type MarketingContinuationWindow = {
  windowDays: number;
  counts: Record<MeaningfulMarketingEvent, number>;
  total: number;
};

/** Non-personal fixture used only by the authenticated local Admin Insights
 * preview. It is never written to the event ledger and is unreachable in a
 * production build.
 */
export function localFounderPilotPreviewEvents(): MarketingScorecardEvent[] {
  const attribution = { utm_source: "linkedin", utm_medium: "founder_social", utm_campaign: "tnm_founder_pilot_v1", utm_content: "underwater_systems_company_capability" };
  const occurred_at = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  return [
    { event_name: "result_select", context_path: "/organizations", cohort: "tnm_founder_pilot_v1", occurred_at, ...attribution, metadata: { destination_path: "/organizations/kraken-robotics" } },
    { event_name: "dossier_open", context_path: "/organizations/kraken-robotics", cohort: "tnm_founder_pilot_v1", occurred_at, ...attribution },
    { event_name: "evidence_open", context_path: "/organizations/kraken-robotics", cohort: "tnm_founder_pilot_v1", occurred_at, ...attribution },
    { event_name: "save", context_path: "/organizations/kraken-robotics", cohort: "tnm_founder_pilot_v1", occurred_at, ...attribution },
    { event_name: "connection", context_path: "/connect/kraken-robotics", cohort: "tnm_founder_pilot_v1", occurred_at, ...attribution },
    { event_name: "newsletter_form_start", context_path: "/north-signal", cohort: "tnm_founder_pilot_v1", occurred_at, ...attribution, metadata: { destination_path: "/north-signal" } },
    { event_name: "newsletter_success", context_path: "/north-signal", cohort: "tnm_founder_pilot_v1", occurred_at, ...attribution, metadata: { destination_path: "/north-signal" } },
    { event_name: "dossier_open", context_path: "/dev/dossier-preview", cohort: "qa", traffic_class: "qa", occurred_at, ...attribution }
  ];
}

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
  if (event.traffic_class === "qa" || event.traffic_class === "staff") return false;
  if (metadata.utm_source === "qa" || metadata.traffic_class === "qa") return false;
  if (excludedCohorts.has(cohort)) return false;
  return true;
}

export function buildMarketingCampaignBreakdown(events: MarketingScorecardEvent[]): MarketingBreakdownRow[] {
  const rows = new Map<string, MarketingBreakdownRow>();
  for (const event of events) {
    if (!isMarketingScorecardEvent(event) || !meaningfulMarketingEvents.includes(event.event_name as MeaningfulMarketingEvent)) continue;
    const metadata = eventMetadata(event.metadata);
    const dimensions: MarketingBreakdownRow["dimension"][] = ["Campaign / cohort", "Source / medium", "Content", "Destination route"];
    const values = [
      event.utm_campaign || event.cohort || textValue(metadata.utm_campaign) || "unattributed",
      sourceMedium(event, metadata),
      event.utm_content || textValue(metadata.utm_content) || "unattributed",
      destinationRoute(event.context_path, metadata)
    ];
    dimensions.forEach((dimension, index) => {
      const value = values[index];
      const key = `${dimension}\u0000${value}`;
      const row = rows.get(key) ?? { dimension, value, counts: emptyMeaningfulCounts(), total: 0 };
      const eventName = event.event_name as MeaningfulMarketingEvent;
      row.counts[eventName] += 1;
      row.total += 1;
      rows.set(key, row);
    });
  }
  return Array.from(rows.values()).sort((left, right) => left.dimension.localeCompare(right.dimension) || right.total - left.total || left.value.localeCompare(right.value));
}

export function buildMarketingContinuationWindows(
  events: MarketingScorecardEvent[],
  now = new Date(),
  windows: readonly number[] = [7, 14, 28]
) {
  return windows.map((windowDays) => {
    const counts = emptyMeaningfulCounts();
    const since = now.getTime() - windowDays * 24 * 60 * 60 * 1000;
    for (const event of events) {
      if (!isMarketingScorecardEvent(event) || !hasMarketingAttribution(event) || !meaningfulMarketingEvents.includes(event.event_name as MeaningfulMarketingEvent)) continue;
      const timestamp = Date.parse(event.occurred_at ?? event.received_at ?? event.created_at ?? "");
      if (!Number.isFinite(timestamp) || timestamp < since || timestamp > now.getTime() + 5 * 60 * 1000) continue;
      counts[event.event_name as MeaningfulMarketingEvent] += 1;
    }
    return { windowDays, counts, total: Object.values(counts).reduce((sum, count) => sum + count, 0) } satisfies MarketingContinuationWindow;
  });
}

function hasMarketingAttribution(event: MarketingScorecardEvent) {
  const metadata = eventMetadata(event.metadata);
  return Boolean(
    event.cohort?.trim()
    || event.utm_source?.trim()
    || event.utm_medium?.trim()
    || event.utm_campaign?.trim()
    || event.utm_content?.trim()
    || textValue(metadata.utm_source)
    || textValue(metadata.utm_medium)
    || textValue(metadata.utm_campaign)
    || textValue(metadata.utm_content)
  );
}

function emptyMeaningfulCounts() {
  return Object.fromEntries(meaningfulMarketingEvents.map((event) => [event, 0])) as Record<MeaningfulMarketingEvent, number>;
}

function textValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function sourceMedium(event: MarketingScorecardEvent, metadata: Record<string, unknown>) {
  const source = event.utm_source || textValue(metadata.utm_source);
  const medium = event.utm_medium || textValue(metadata.utm_medium);
  return source || medium ? `${source ?? "unknown"} / ${medium ?? "unknown"}` : "unattributed";
}

function destinationRoute(contextPath: string | null | undefined, metadata: Record<string, unknown>) {
  const value = textValue(metadata.destination_path) ?? textValue(metadata.sample_path) ?? contextPath ?? "unknown";
  if (!value.startsWith("/")) return value;
  return value.split(/[?#]/, 1)[0] || "/";
}
