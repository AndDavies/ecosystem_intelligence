const trustedOrigin = "https://truenorthmap.ca";
const unsafePathCharacters = /[\\\u0000-\u001F\u007F]/;

/**
 * Keep server redirects and navigation context on this site. A leading slash
 * alone is insufficient because WHATWG URL parsing treats backslashes as
 * authority separators in a special URL.
 */
export function safeLocalReturnPath(value: string | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || unsafePathCharacters.test(value)) return fallback;

  try {
    return new URL(value, trustedOrigin).origin === trustedOrigin ? value : fallback;
  } catch {
    return fallback;
  }
}
