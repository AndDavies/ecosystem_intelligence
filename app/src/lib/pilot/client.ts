"use client";

import type { PilotEventName } from "@/lib/pilot/validation";

const cohortKey = "ecosystem-intelligence-pilot-cohort";
const sessionKey = "ecosystem-intelligence-pilot-session";
const searchKey = "ecosystem-intelligence-pilot-search";

function validUuid(value: string | null) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

export function currentPilotCohort() {
  if (typeof window === "undefined") return null;
  const queryCohort = new URLSearchParams(window.location.search).get("cohort")?.slice(0, 120) ?? null;
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

export function rememberPilotSearchId(searchId: string | null | undefined) {
  if (typeof window === "undefined") return;
  try {
    if (validUuid(searchId ?? null)) window.sessionStorage.setItem(searchKey, searchId as string);
    else window.sessionStorage.removeItem(searchKey);
  } catch {
    // Search attribution is best-effort when session storage is unavailable.
  }
}

export function trackPilotEvent(
  eventName: PilotEventName,
  metadata: Record<string, string | number | boolean | null> = {},
  attribution: { searchId?: string | null } = {}
) {
  if (typeof window === "undefined") return;
  void fetch("/api/pilot-events", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      eventName,
      contextPath: window.location.pathname,
      cohort: currentPilotCohort(),
      sessionId: currentPilotSessionId(),
      searchId: attribution.searchId === undefined ? currentPilotSearchId() : attribution.searchId,
      metadata
    }),
    keepalive: true
  }).catch(() => undefined);
}

export function openPilotUpdates() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("pilot:open-updates"));
}

export function openPilotFeedback() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("pilot:open-feedback"));
}
