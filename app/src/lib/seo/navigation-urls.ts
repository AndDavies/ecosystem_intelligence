import { safeLocalReturnPath } from "@/lib/safe-return";

export const mapStateKeys = new Set(["q", "bounds", "region", "metro", "type", "capability", "domain", "mission", "demand", "stage", "program", "cluster", "focus", "view", "selected", "page", "pageSize", "example", "start"]);
const profileNavigationKeys = new Set(["returnTo", "selected", "bounds", "view"]);
export const isProfilePath = (path: string) => /^\/(organizations|capabilities)\/[^/]+$/.test(path) && path !== "/organizations/filter";

/** Only navigation state moves to fragments. Attribution and private parameters stay intact. */
export function publicNavigationHref(href: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const url = new URL(href, "https://truenorthmap.ca");
  if (url.pathname === "/map") {
    const state = new URLSearchParams(url.hash.startsWith("#?") ? url.hash.slice(2) : "");
    for (const key of mapStateKeys) {
      if (!url.searchParams.has(key)) continue;
      state.delete(key);
      for (const value of url.searchParams.getAll(key)) state.append(key, value);
      url.searchParams.delete(key);
    }
    if (state.size) url.hash = `?${state.toString()}`;
  } else if (isProfilePath(url.pathname)) {
    for (const key of profileNavigationKeys) url.searchParams.delete(key);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

export function safeMapReturn(value: string | undefined): string {
  if (!value || value.length > 4096) return "/map";
  const safe = safeLocalReturnPath(value, "/map");
  const url = new URL(safe, "https://truenorthmap.ca");
  return url.pathname === "/map" ? publicNavigationHref(safe) : "/map";
}

/** Server redirect for legacy navigation URLs; fragments never reach the origin. */
export function legacyNavigationDestination(url: URL): string | null {
  if (url.pathname === "/map") {
    const next = publicNavigationHref(`${url.pathname}${url.search}`);
    return next !== `${url.pathname}${url.search}` ? next : null;
  }
  if (!isProfilePath(url.pathname) || ![...profileNavigationKeys].some(key => url.searchParams.has(key))) return null;
  const clean = publicNavigationHref(`${url.pathname}${url.search}`);
  let context = url.searchParams.get("returnTo") ?? undefined;
  // Older display-decoded links sometimes put these outside the nested return URL.
  if (context) {
    const map = new URL(safeMapReturn(context), url.origin);
    const state = new URLSearchParams(map.hash.slice(2));
    for (const key of ["selected", "bounds", "view"]) {
      const value = url.searchParams.get(key);
      if (value) state.set(key, value);
    }
    context = `/map#?${state}`;
  }
  return context ? `${clean}#tnm-return=${encodeURIComponent(safeMapReturn(context))}` : clean;
}
