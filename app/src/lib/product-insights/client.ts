"use client";

import type { BetaEventName, ProfileEngagementAction } from "@/lib/product-insights/validation";

const cohortKey = "true-north-map-beta-cohort";
const sessionKey = "true-north-map-beta-session";
const searchKey = "true-north-map-beta-search";
const attributionKey = "true-north-map-release-attribution";

function boundedAttributionValue(value: string | null, max: number) {
  const normalized = value?.trim().slice(0, max) ?? null;
  return normalized && /^[a-z0-9][a-z0-9_-]*$/i.test(normalized) ? normalized : null;
}

export function currentReleaseAttribution() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const source = boundedAttributionValue(params.get("utm_source"), 80);
  const medium = boundedAttributionValue(params.get("utm_medium"), 80);
  const campaign = boundedAttributionValue(params.get("utm_campaign"), 120);
  const content = boundedAttributionValue(params.get("utm_content"), 120);
  const incoming = source || medium || campaign || content ? { source, medium, campaign, content } : null;
  try {
    if (incoming) window.sessionStorage.setItem(attributionKey, JSON.stringify(incoming));
    const value = incoming ?? JSON.parse(window.sessionStorage.getItem(attributionKey) ?? "null") as typeof incoming;
    if (!value) return null;
    return value;
  } catch {
    return incoming;
  }
}

export function browserEntryChannel(attribution = currentReleaseAttribution(), referrer = typeof document === "undefined" ? "" : document.referrer) {
  if (attribution?.source === "mailerlite" || attribution?.medium === "email") return "email" as const;
  if (attribution?.medium === "founder_social") return "founder_social" as const;
  if (attribution?.medium === "company_social") return "company_social" as const;
  if (attribution?.medium === "earned_partner") return "earned_partner" as const;
  try {
    const hostname = new URL(referrer).hostname.toLowerCase();
    if (hostname === "accounts.google.com") return "authentication_service" as const;
    if (hostname === "google.com" || hostname.endsWith(".google.com") || /^www\.google\.[a-z.]+$/.test(hostname)) return "organic_google" as const;
    if (/^(?:www\.)?(?:bing|duckduckgo)\./.test(hostname)) return "organic_other" as const;
    if (hostname && typeof window !== "undefined" && hostname !== window.location.hostname) return "referral" as const;
  } catch {
    // Missing and malformed referrers fall through to direct.
  }
  return "direct" as const;
}

function validUuid(value: string | null) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

export function currentPilotCohort() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const queryCohort = (params.get("cohort") ?? params.get("utm_campaign"))?.slice(0, 120) ?? null;
  try {
    if (queryCohort) window.sessionStorage.setItem(cohortKey, queryCohort);
    return queryCohort ?? window.sessionStorage.getItem(cohortKey);
  } catch {
    return queryCohort;
  }
}

export function currentPilotSessionId() {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.sessionStorage.getItem(sessionKey);
    if (validUuid(stored)) return stored;
    const created = window.crypto.randomUUID();
    window.sessionStorage.setItem(sessionKey, created);
    return created;
  } catch {
    return null;
  }
}

export function currentPilotSearchId() {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.sessionStorage.getItem(searchKey);
    return validUuid(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function rememberBetaSearchId(searchId: string | null | undefined) {
  if (typeof window === "undefined") return;
  try {
    if (validUuid(searchId ?? null)) window.sessionStorage.setItem(searchKey, searchId as string);
    else window.sessionStorage.removeItem(searchKey);
  } catch {
    // Search attribution is best-effort when session storage is unavailable.
  }
}

export function trackBetaEvent(
  eventName: BetaEventName,
  metadata: Record<string, string | number | boolean | null> = {},
  attribution: { searchId?: string | null } = {}
) {
  if (typeof window === "undefined") return;
  const releaseAttribution = currentReleaseAttribution();
  const boundedMetadata = Object.fromEntries(Object.entries(metadata).slice(0, 8));
  const eventId = window.crypto.randomUUID();
  const occurredAt = new Date().toISOString();
  window.dispatchEvent(new CustomEvent("tnm:meaningful-event", {
    detail: { eventName, metadata: boundedMetadata }
  }));
  void fetch("/api/beta-events", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      eventId,
      eventName,
      contextPath: window.location.pathname,
      occurredAt,
      cohort: currentPilotCohort(),
      entryChannel: browserEntryChannel(releaseAttribution),
      utmSource: releaseAttribution?.source,
      utmMedium: releaseAttribution?.medium,
      utmCampaign: releaseAttribution?.campaign,
      utmContent: releaseAttribution?.content,
      sessionId: currentPilotSessionId(),
      searchId: attribution.searchId === undefined ? currentPilotSearchId() : attribution.searchId,
      metadata: boundedMetadata
    }),
    keepalive: true
  }).catch(() => undefined);
}

export function trackNorthSignalCtaClick(placement: string, destinationPath = "/north-signal") {
  if (typeof window === "undefined") return;
  trackBetaEvent("newsletter_cta_click", {
    placement: placement.slice(0, 80),
    source_path: window.location.pathname.slice(0, 255),
    destination_path: destinationPath.slice(0, 255)
  });
}

export function trackProfileEngagement(
  action: ProfileEngagementAction,
  metadata: {
    organization_id: string;
    target_id?: string;
    target_type?: "section" | "mission_area" | "public_need" | "program" | "brief" | "signal" | "map";
    section?: string;
    template_version: "organization_editorial_profile_v1";
  }
) {
  trackBetaEvent("profile_engagement", { action, ...metadata });
}

export function openBetaUpdates(
  placement: "newsletter_header" | "newsletter_footer" = "newsletter_header",
  trigger = "explicit"
) {
  if (typeof window !== "undefined") {
    const detail = { placement, trigger };
    (window as Window & { __tnmPendingNorthSignalOpen?: typeof detail }).__tnmPendingNorthSignalOpen = detail;
    window.dispatchEvent(new CustomEvent("pilot:open-updates", { detail }));
  }
}

export function takePendingBetaUpdatesOpen() {
  if (typeof window === "undefined") return undefined;
  const browserWindow = window as Window & {
    __tnmPendingNorthSignalOpen?: {
      placement: "newsletter_header" | "newsletter_footer";
      trigger: string;
    };
  };
  const pending = browserWindow.__tnmPendingNorthSignalOpen;
  delete browserWindow.__tnmPendingNorthSignalOpen;
  return pending;
}

export function openBetaFeedback() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("pilot:open-feedback"));
}
