export const analyticsConsentStorageKey = "tnm-analytics-consent-v2";
export const legacyAnalyticsConsentStorageKey = "tnm-analytics-consent-v1";
export const analyticsPreferencesEvent = "tnm:open-analytics-preferences";
export const analyticsConsentUpdatedEvent = "tnm:analytics-consent-updated";

export type AnalyticsPreferences = {
  version: 2;
  productAnalytics: boolean;
  experienceDiagnostics: boolean;
  decidedAt: string;
};

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

export function analyticsPreferences(
  productAnalytics: boolean,
  experienceDiagnostics: boolean,
  decidedAt = new Date().toISOString()
): AnalyticsPreferences {
  return { version: 2, productAnalytics, experienceDiagnostics, decidedAt };
}

export function parseAnalyticsPreferences(value: string | null): AnalyticsPreferences | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<AnalyticsPreferences>;
    if (
      parsed.version !== 2 ||
      typeof parsed.productAnalytics !== "boolean" ||
      typeof parsed.experienceDiagnostics !== "boolean" ||
      typeof parsed.decidedAt !== "string"
    ) return null;
    return parsed as AnalyticsPreferences;
  } catch {
    return null;
  }
}

export function readAnalyticsPreferences(storage: Pick<Storage, "getItem" | "setItem">) {
  const current = parseAnalyticsPreferences(storage.getItem(analyticsConsentStorageKey));
  if (current) return current;

  const legacy = storage.getItem(legacyAnalyticsConsentStorageKey);
  if (legacy !== "accepted" && legacy !== "declined") return null;

  const migrated = analyticsPreferences(legacy === "accepted", false);
  storage.setItem(analyticsConsentStorageKey, JSON.stringify(migrated));
  return migrated;
}

export function writeAnalyticsPreferences(storage: Pick<Storage, "setItem">, preferences: AnalyticsPreferences) {
  storage.setItem(analyticsConsentStorageKey, JSON.stringify(preferences));
}
