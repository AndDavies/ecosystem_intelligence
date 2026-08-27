export type NewsletterInsightEvent = {
  event_name?: string | null;
  session_id?: string | null;
  context_path?: string | null;
  cohort?: string | null;
  metadata?: unknown;
  occurred_at?: string | null;
  received_at?: string | null;
  created_at?: string | null;
  traffic_class?: string | null;
  entry_channel?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
};

export type NewsletterFunnelSurface = "inline" | "modal_banner" | "dedicated_page";

export const newsletterFunnelStages = {
  inline: ["newsletter_impression", "newsletter_form_start", "newsletter_submit", "newsletter_success"],
  modal_banner: ["newsletter_impression", "newsletter_open", "newsletter_form_start", "newsletter_submit", "newsletter_success"],
  dedicated_page: ["newsletter_landing_view", "newsletter_form_start", "newsletter_submit", "newsletter_success"]
} as const;

export type NewsletterFunnelRow = {
  windowDays: 7 | 14 | 28;
  surface: NewsletterFunnelSurface;
  placement: string;
  stageSessions: Record<string, number>;
};

const newsletterEventNames = new Set([
  "newsletter_impression",
  "newsletter_open",
  "newsletter_form_start",
  "newsletter_submit",
  "newsletter_success",
  "newsletter_landing_view",
  "newsletter_sample_open",
  "newsletter_error",
  "newsletter_dismiss"
]);

const excludedCohorts = new Set(["qa", "staff", "test", "internal", "tnm-qa", "tnm-staff", "tnm-test", "automation-test"]);

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function eventTime(event: NewsletterInsightEvent) {
  const value = event.occurred_at ?? event.received_at ?? event.created_at;
  const time = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(time) ? time : null;
}

export function isNonQaNewsletterEvent(event: NewsletterInsightEvent) {
  if (!newsletterEventNames.has(event.event_name ?? "")) return false;
  if (event.context_path?.startsWith("/dev/")) return false;
  if (event.traffic_class === "qa" || event.traffic_class === "staff") return false;
  const metadata = record(event.metadata);
  if (metadata.traffic_class === "qa" || metadata.traffic_class === "staff" || metadata.utm_source === "qa") return false;
  if (excludedCohorts.has(event.cohort?.trim().toLowerCase() ?? "")) return false;
  return true;
}

export function newsletterEventPlacement(event: NewsletterInsightEvent) {
  const metadata = record(event.metadata);
  return text(metadata.placement) ?? text(metadata.source) ?? (event.context_path === "/north-signal" ? "newsletter_page" : "unknown");
}

export function newsletterEventSurface(event: NewsletterInsightEvent): NewsletterFunnelSurface {
  const metadata = record(event.metadata);
  const placement = newsletterEventPlacement(event);
  const variant = text(metadata.variant);
  if (placement === "newsletter_page" || event.event_name === "newsletter_landing_view" || event.context_path === "/north-signal") return "dedicated_page";
  if (variant === "inline" || placement.startsWith("newsletter_inline_")) return "inline";
  return "modal_banner";
}

/**
 * Builds strict prefix funnels from distinct, non-QA sessions. A later stage is
 * counted only when every earlier stage occurred for the same placement and
 * surface in chronological order. Raw event counts belong in diagnostics, not
 * in this conversion projection.
 */
export function buildNewsletterFunnelRows(
  events: NewsletterInsightEvent[],
  now = new Date(),
  windows: readonly (7 | 14 | 28)[] = [7, 14, 28]
): NewsletterFunnelRow[] {
  const nowTime = now.getTime();
  const rows: NewsletterFunnelRow[] = [];

  for (const windowDays of windows) {
    const earliest = nowTime - windowDays * 24 * 60 * 60 * 1000;
    const flows = new Map<string, { surface: NewsletterFunnelSurface; placement: string; events: Array<{ name: string; time: number }> }>();
    for (const event of events) {
      if (!isNonQaNewsletterEvent(event) || !event.session_id) continue;
      const time = eventTime(event);
      if (time === null || time < earliest || time > nowTime + 5 * 60 * 1000) continue;
      const surface = newsletterEventSurface(event);
      const placement = newsletterEventPlacement(event);
      const key = `${event.session_id}\u0000${surface}\u0000${placement}`;
      const flow = flows.get(key) ?? { surface, placement, events: [] };
      flow.events.push({ name: event.event_name ?? "", time });
      flows.set(key, flow);
    }

    const aggregates = new Map<string, NewsletterFunnelRow>();
    for (const flow of flows.values()) {
      const required = newsletterFunnelStages[flow.surface];
      const ordered = flow.events.sort((left, right) => left.time - right.time);
      let cursor = Number.NEGATIVE_INFINITY;
      const aggregateKey = `${flow.surface}\u0000${flow.placement}`;
      const row = aggregates.get(aggregateKey) ?? {
        windowDays,
        surface: flow.surface,
        placement: flow.placement,
        stageSessions: Object.fromEntries(required.map((stage) => [stage, 0]))
      };
      for (const stage of required) {
        const match = ordered.find((event) => event.name === stage && event.time >= cursor);
        if (!match) break;
        row.stageSessions[stage] += 1;
        cursor = match.time;
      }
      aggregates.set(aggregateKey, row);
    }
    rows.push(...Array.from(aggregates.values()));
  }

  return rows.sort((left, right) => left.windowDays - right.windowDays || left.surface.localeCompare(right.surface) || left.placement.localeCompare(right.placement));
}

export function newsletterAttribution(event: NewsletterInsightEvent) {
  const metadata = record(event.metadata);
  const source = event.utm_source ?? text(metadata.utm_source);
  const medium = event.utm_medium ?? text(metadata.utm_medium);
  const campaign = event.utm_campaign ?? text(metadata.utm_campaign) ?? event.cohort ?? null;
  const content = event.utm_content ?? text(metadata.utm_content);
  return {
    sourceMedium: source || medium ? `${source ?? "unknown"} / ${medium ?? "unknown"}` : "unattributed",
    campaign: campaign || "unattributed",
    content: content || "unattributed",
    entryChannel: event.entry_channel ?? "unknown"
  };
}

/** Non-personal local preview rows. They exercise the three funnel shapes and
 * are never inserted into Supabase or returned in production.
 */
export function localNewsletterFunnelPreviewEvents(now = new Date()): NewsletterInsightEvent[] {
  const occurred = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60 * 1000).toISOString();
  const flow = (
    sessionId: string,
    contextPath: string,
    placement: string,
    variant: string,
    names: readonly string[],
    startMinutesAgo: number
  ) => names.map((event_name, index) => ({
    event_name,
    session_id: sessionId,
    context_path: contextPath,
    cohort: "local_newsletter_preview",
    occurred_at: occurred(startMinutesAgo - index),
    received_at: occurred(startMinutesAgo - index),
    traffic_class: "production",
    entry_channel: "organic_google",
    utm_source: "google",
    utm_medium: "organic",
    utm_campaign: "local_newsletter_preview",
    utm_content: `${placement}_fixture`,
    metadata: { placement, variant, device_class: "desktop", content_type: "preview" }
  }));
  return [
    ...flow("11111111-1111-4111-8111-111111111111", "/signals", "newsletter_inline_signals", "inline", newsletterFunnelStages.inline, 20),
    ...flow("22222222-2222-4222-8222-222222222222", "/organizations/h2-analytics", "newsletter_modal_desktop", "dialog", newsletterFunnelStages.modal_banner, 40),
    ...flow("33333333-3333-4333-8333-333333333333", "/north-signal", "newsletter_page", "inline", newsletterFunnelStages.dedicated_page, 60)
  ];
}
