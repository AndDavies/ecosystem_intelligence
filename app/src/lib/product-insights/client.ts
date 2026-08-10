"use client";

import type { BetaEventName, ProfileEngagementAction } from "@/lib/product-insights/validation";

const cohortKey = "true-north-map-beta-cohort";
const sessionKey = "true-north-map-beta-session";
const searchKey = "true-north-map-beta-search";
const attributionKey = "true-north-map-release-attribution";

export function currentReleaseAttribution() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const source = params.get("utm_source")?.slice(0, 80) ?? null;
  const medium = params.get("utm_medium")?.slice(0, 80) ?? null;
  const campaign = params.get("utm_campaign")?.slice(0, 120) ?? null;
  const content = params.get("utm_content")?.slice(0, 120) ?? null;
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
  const attributionMetadata = releaseAttribution ? {
    utm_source: releaseAttribution.source,
    utm_medium: releaseAttribution.medium,
    utm_content: releaseAttribution.content
  } : {};
  const attributionCount = Object.values(attributionMetadata).filter((value) => value !== null).length;
  const boundedMetadata = Object.fromEntries(Object.entries(metadata).slice(0, Math.max(0, 8 - attributionCount)));
  window.dispatchEvent(new CustomEvent("tnm:meaningful-event", {
    detail: { eventName, metadata: boundedMetadata }
  }));
  void fetch("/api/beta-events", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      eventName,
      contextPath: window.location.pathname,
      cohort: currentPilotCohort(),
      sessionId: currentPilotSessionId(),
      searchId: attribution.searchId === undefined ? currentPilotSearchId() : attribution.searchId,
      metadata: releaseAttribution ? { ...boundedMetadata, ...Object.fromEntries(Object.entries(attributionMetadata).filter(([, value]) => value !== null)) } : boundedMetadata
    }),
    keepalive: true
  }).catch(() => undefined);
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
    window.dispatchEvent(new CustomEvent("pilot:open-updates", { detail: { placement, trigger } }));
  }
}

export function openBetaFeedback() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("pilot:open-feedback"));
}
