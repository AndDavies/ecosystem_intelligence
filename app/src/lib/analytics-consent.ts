export const analyticsConsentStorageKey = "tnm-analytics-consent-v1";
export const analyticsPreferencesEvent = "tnm:open-analytics-preferences";

export type AnalyticsConsent = "accepted" | "declined" | "unknown";

const privatePathPrefixes = [
  "/account",
  "/admin",
  "/auth",
  "/collections",
  "/connect",
  "/sign-in",
  "/submit"
];

export function isAnalyticsEligiblePath(pathname: string) {
  return !privatePathPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function sanitizeAnalyticsUrl(value: string) {
  const url = new URL(value);
  if (!isAnalyticsEligiblePath(url.pathname)) return null;
  url.search = "";
  url.hash = "";
  return url.toString();
}

export function openAnalyticsPreferences() {
  window.dispatchEvent(new CustomEvent(analyticsPreferencesEvent));
}
