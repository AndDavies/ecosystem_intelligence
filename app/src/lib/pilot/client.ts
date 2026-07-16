"use client";

import type { PilotEventName } from "@/lib/pilot/validation";

const cohortKey = "ecosystem-intelligence-pilot-cohort";

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

export function trackPilotEvent(eventName: PilotEventName, metadata: Record<string, string | number | boolean | null> = {}) {
  if (typeof window === "undefined") return;
  void fetch("/api/pilot-events", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      eventName,
      contextPath: window.location.pathname,
      cohort: currentPilotCohort(),
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

