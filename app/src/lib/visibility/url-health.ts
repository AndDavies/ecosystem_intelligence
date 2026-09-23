export type SearchUrlRow = { path: string; sourceUrl?: string; clicks: number; impressions: number };
/** Private source URLs stay local; only aggregates and clean public paths leave this module. */
export function searchUrlHealth(rows: SearchUrlRow[] | undefined) {
  if (!rows || rows.some(row => !row.sourceUrl)) return null;
  let queryUrls = 0, navigationUrls = 0, impressions = 0, queryImpressions = 0;
  const affected = new Map<string, { variants: number; impressions: number; clicks: number }>();
  for (const row of rows) {
    const url = new URL(row.sourceUrl!);
    impressions += row.impressions;
    if (!url.search) continue;
    queryUrls++; queryImpressions += row.impressions;
    if (url.searchParams.has("returnTo") || url.pathname === "/map") navigationUrls++;
    const current = affected.get(url.pathname) ?? { variants: 0, impressions: 0, clicks: 0 };
    current.variants++; current.impressions += row.impressions; current.clicks += row.clicks;
    affected.set(url.pathname, current);
  }
  return { urls: rows.length, queryUrls, navigationUrls, queryImpressions, impressionShare: impressions ? queryImpressions / impressions : null, affected };
}
