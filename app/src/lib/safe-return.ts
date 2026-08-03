const trustedOrigin = "https://truenorthmap.ca";
function hasUnsafePathCharacters(value: string) {
  return [...value].some((character) => character === "\\" || character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127);
}

/**
 * Keep server redirects and navigation context on this site. A leading slash
 * alone is insufficient because WHATWG URL parsing treats backslashes as
 * authority separators in a special URL.
 */
export function safeLocalReturnPath(value: string | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || hasUnsafePathCharacters(value)) return fallback;

  try {
    return new URL(value, trustedOrigin).origin === trustedOrigin ? value : fallback;
  } catch {
    return fallback;
  }
}
