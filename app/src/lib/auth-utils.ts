export function safeAuthNextPath(value: string | undefined, fallback = "/collections") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

export function isRecentSignIn(lastSignInAt: string | null | undefined, windowMinutes = 15) {
  if (!lastSignInAt) return false;
  const timestamp = Date.parse(lastSignInAt);
  if (Number.isNaN(timestamp)) return false;
  return Date.now() - timestamp <= windowMinutes * 60 * 1000;
}
