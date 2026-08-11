export const northSignalDismissalMs = 30 * 24 * 60 * 60 * 1000;

export function pathSupportsNorthSignal(pathname: string) {
  return pathname === "/" || pathname === "/map" || [
    "/regions",
    "/organizations",
    "/missions",
    "/capabilities",
    "/demand",
    "/signals",
    "/north-signal",
    "/briefs",
    "/about",
    "/how-it-works",
    "/methodology",
    "/privacy",
    "/terms",
    "/contact"
  ].some((prefix) => pathname.startsWith(prefix));
}

export function pathAllowsAutomaticNorthSignal(pathname: string) {
  return pathname !== "/map" && pathname !== "/north-signal" && pathSupportsNorthSignal(pathname);
}

export function automaticNorthSignalPromptIsSuppressed({
  subscribed,
  dismissedAt,
  now = Date.now()
}: {
  subscribed: boolean;
  dismissedAt: number;
  now?: number;
}) {
  return subscribed || (dismissedAt > 0 && now - dismissedAt < northSignalDismissalMs);
}
