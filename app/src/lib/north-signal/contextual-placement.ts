/**
 * Small, explicit treatment cohort derived from the latest reviewed Search
 * Console visibility evidence available when this release was prepared. This
 * controls presentation only; it is not a ranking or product-data claim.
 */
const organizationSlugs = new Set([
  "h2-analytics",
  "shift-coastal-technologies",
  "sapper-labs-group",
  "metaspectral",
  "shark-marine-technologies",
  "oceanworks-international",
  "d-ta-systems",
  "itres-research"
]);

const capabilitySlugs = new Set([
  "marinenav-oceanus-rapid-deployment-rovs",
  "kraken-seapower-subsea-batteries",
  "pacgeo-commercial-hyperspectral-imagery-access"
]);

export function showsContextualNorthSignalSignup(type: "organization" | "capability", slug: string) {
  return type === "organization" ? organizationSlugs.has(slug) : capabilitySlugs.has(slug);
}

export function pathHasContextualNorthSignalSignup(pathname: string) {
  if (pathname === "/" || pathname === "/signals" || /^\/signals\/[^/]+$/.test(pathname)) return true;
  if (/^\/(missions|demand)\/[^/]+$/.test(pathname)) return true;
  const organization = pathname.match(/^\/organizations\/([^/]+)$/)?.[1];
  if (organization) return organizationSlugs.has(organization);
  const capability = pathname.match(/^\/capabilities\/([^/]+)$/)?.[1];
  return Boolean(capability && capabilitySlugs.has(capability));
}

export const contextualNorthSignalPlacementVersion = "search_visibility_2026_08_v1";
