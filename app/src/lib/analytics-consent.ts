export const analyticsConsentStorageKey = "tnm-analytics-consent-v1";
export const analyticsPreferencesEvent = "tnm:open-analytics-preferences";

export type AnalyticsConsent = "accepted" | "declined" | "unknown";

const privatePathPrefixes = [
  "/account",
  "/admin",
  "/auth",
  "/collections",
  "/review",
  "/sign-in",
  "/submissions"
];

export function isAnalyticsEligiblePath(pathname: string) {
  return !privatePathPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function openAnalyticsPreferences() {
  window.dispatchEvent(new CustomEvent(analyticsPreferencesEvent));
}
