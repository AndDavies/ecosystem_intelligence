/** Every public profile gets the same contextual offer; no hidden treatment cohort. */
export function showsContextualNorthSignalSignup(type: "organization" | "capability", slug: string) {
  return (type === "organization" || type === "capability") && Boolean(slug);
}

export function pathHasContextualNorthSignalSignup(pathname: string) {
  return pathname === "/" || pathname === "/signals" || /^\/(signals|missions|demand|organizations|capabilities)\/[^/]+$/.test(pathname);
}

export const contextualNorthSignalPlacementVersion = "discovery_v2";
