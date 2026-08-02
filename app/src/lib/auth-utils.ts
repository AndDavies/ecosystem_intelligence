import { siteUrl } from "@/lib/site";

import { safeLocalReturnPath } from "@/lib/safe-return";

export const googleOAuthQueryParams = {
  prompt: "select_account"
} as const;

export function safeAuthNextPath(value: string | undefined, fallback = "/collections") {
  return safeLocalReturnPath(value, fallback);
}

export function getAuthBaseUrl(
  configuredUrl = process.env.NEXT_PUBLIC_SITE_URL,
  environment = process.env.NODE_ENV
) {
  const fallback = environment === "production" ? siteUrl : "http://localhost:3000";
  const candidate = configuredUrl?.trim() || fallback;

  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol)) return fallback;
    if (environment === "production" && url.protocol !== "https:") return siteUrl;
    return url.origin;
  } catch {
    return fallback;
  }
}

export function isRecentSignIn(lastSignInAt: string | null | undefined, windowMinutes = 15) {
  if (!lastSignInAt) return false;
  const timestamp = Date.parse(lastSignInAt);
  if (Number.isNaN(timestamp)) return false;
  return Date.now() - timestamp <= windowMinutes * 60 * 1000;
}
