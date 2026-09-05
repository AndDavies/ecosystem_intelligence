/** Sanitized, portable extension shared with the owner-only Sites consumer.
 * No raw search queries, referring URLs, visitor identifiers or contact fields. */
export type ReportingPeriod = { startDate: string; endDate: string; timeZone: string };
export type AiReport = {
  provider: "google-ai" | "bing-ai"; collectedAt: string; period: ReportingPeriod;
  metric: "impressions" | "citations"; total: number; clicks: number | null;
  rows: Array<{ path: string; value: number; variants: number }>;
  dimensions: Array<{ dimension: "date" | "country" | "device"; label: string; value: number }>;
  coverage: "complete" | "partial"; sourceUrl: string;
};
export type SearchCohort = { date: string; path: string; country: string; device: string; clicks: number; impressions: number; position: number | null };
export type LandingMetric = { path: string; channel: string; sessions: number; engagedSessions: number; keyEvents: number };
export type TrafficSegment = { dimension: "entry_path" | "search_engine" | "campaign"; label: string; events: number; sessions: number };
export type EventMetric = { event: string; contentType: string; events: number };
export type AnswerSource = { domain: string; url: string; group: string; appearances: number; kind: "organic" | "ai_reference" };
export type BingHealth = { date: string; crawled: number | null; indexed: number | null; blocked: number | null; inboundLinks: number | null; http4xx: number | null; http5xx: number | null };
export type EarnedReferences = { collectedAt: string; externalLinks: number; internalLinks: number; domains: Array<{domain:string;links:number}>; targets:Array<{path:string;links:number}>; sourceUrl:"https://search.google.com/search-console/links" };
export type IndexCoverage = { collectedAt: string; reportDate: string; indexed: number; excluded: number; reasons: Array<{ reason: string; count: number }> };
export type VisibilityIntelligence = {
  schemaVersion: "tnm_visibility_intelligence_v1";
  aiReports: AiReport[];
  searchCohorts: SearchCohort[];
  ga4: { period: ReportingPeriod; landings: LandingMetric[]; events: EventMetric[]; segments?: TrafficSegment[]; recentCollection?: { period: ReportingPeriod; sessions: number; events: number; status: "provisional" } } | null;
  answerSources: AnswerSource[];
  bingHealth: BingHealth[];
  indexCoverage: IndexCoverage | null;
  earnedReferences?: EarnedReferences | null;
  annotations: Array<{ date: string; kind: "collection_gap" | "release"; note: string }>;
};

export const contentTypes = new Set(["brief", "organization_profile", "capability_profile", "demand_profile", "mission_profile", "region", "discovery_hub", "signal", "north_signal", "map", "home", "other_public_page", "unknown"]);
export const eventNames = new Set(["tnm_content_view", "tnm_organic_entry", "tnm_landing_entry", "tnm_external_source_open", "tnm_working_list_intent"]);
export const channels = new Set(["Affiliates", "Audio", "Cross-network", "Direct", "Display", "Email", "Mobile Push Notifications", "Organic Search", "Organic Shopping", "Organic Social", "Organic Video", "Paid Other", "Paid Search", "Paid Shopping", "Paid Social", "Paid Video", "Referral", "SMS", "Unassigned", "Other", "AI assistants"]);
export function validTrafficLabel(dimension: unknown, label: unknown) {
  return typeof label === "string" && (dimension === "entry_path" ? ["need","public_need","mission","map","example","brief","signals","north_signal","unknown"].includes(label) : dimension === "search_engine" ? ["google","bing","duckduckgo","unknown"].includes(label) : dimension === "campaign" && (label === "untagged_or_other" || /^tnm[_-][a-z0-9_-]{1,75}$/.test(label)));
}
export const indexReasons = new Set(["blocked_by_robots", "duplicate_without_canonical", "discovered_not_indexed", "crawled_not_indexed", "redirect", "not_found", "other"]);
export function publicPath(input: unknown): string | null {
  if (typeof input !== "string") return null;
  try {
    const url = new URL(input, "https://truenorthmap.ca");
    if (url.origin !== "https://truenorthmap.ca" || url.username || url.password || /%|\\|\s/.test(url.pathname)) return null;
    return /^\/(?:$|(?:organizations|capabilities|signals|briefs|demand|missions|regions)(?:\/[a-z0-9][a-z0-9-]*)?\/?$|(?:map|north-signal|methodology|how-it-works|about|contact|privacy|terms)\/?$)/.test(url.pathname) ? url.pathname.replace(/\/$/, "") || "/" : null;
  } catch { return null; }
}
export function validDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const keys = (v: Record<string, unknown>, names: string[]) => Object.keys(v).length === names.length && names.every(k => k in v);
const nonnegative = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;
const nullable = (v: unknown) => v === null || nonnegative(v);
const timestamp = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v) && Number.isFinite(Date.parse(v));
const array = (v: unknown, check: (x: unknown) => boolean, max = 100000) => Array.isArray(v) && v.length <= max && v.every(check);
const safePath = (v: unknown) => publicPath(v) === v;
export function validPeriod(v: unknown): v is ReportingPeriod {
  return object(v) && keys(v, ["startDate", "endDate", "timeZone"]) && validDate(v.startDate) && validDate(v.endDate) && v.startDate <= v.endDate && ["America/Los_Angeles", "America/Halifax", "UTC", "provider_local"].includes(String(v.timeZone));
}
export function validAiReport(v: unknown): v is AiReport {
  if (!object(v) || !keys(v, ["provider", "collectedAt", "period", "metric", "total", "clicks", "rows", "dimensions", "coverage", "sourceUrl"])) return false;
  const google = v.provider === "google-ai";
  return (google || v.provider === "bing-ai") && v.metric === (google ? "impressions" : "citations") && timestamp(v.collectedAt) && validPeriod(v.period) && nonnegative(v.total) && v.clicks === null
    && ["complete", "partial"].includes(String(v.coverage)) && v.sourceUrl === (google ? "https://search.google.com/search-console" : "https://www.bing.com/webmasters/aiperformance")
    && array(v.rows, r => object(r) && keys(r, ["path", "value", "variants"]) && safePath(r.path) && nonnegative(r.value) && nonnegative(r.variants))
    && array(v.dimensions, r => object(r) && keys(r, ["dimension", "label", "value"]) && nonnegative(r.value) && (r.dimension === "date" ? validDate(r.label) : r.dimension === "country" ? /^[A-Z]{2,3}$/.test(String(r.label)) : r.dimension === "device" && ["DESKTOP", "MOBILE", "TABLET"].includes(String(r.label))));
}
export function validIntelligence(v: unknown): v is VisibilityIntelligence {
  if (!object(v) || !keys(v, ["schemaVersion", "aiReports", "searchCohorts", "ga4", "answerSources", "bingHealth", "indexCoverage", "annotations", ...(v.earnedReferences === undefined ? [] : ["earnedReferences"])]) || v.schemaVersion !== "tnm_visibility_intelligence_v1") return false;
  return (v.earnedReferences === undefined || v.earnedReferences === null || validEarnedReferences(v.earnedReferences)) && array(v.aiReports, validAiReport, 2)
    && array(v.searchCohorts, r => object(r) && keys(r, ["date", "path", "country", "device", "clicks", "impressions", "position"]) && validDate(r.date) && safePath(r.path) && /^[A-Z]{2,3}$/.test(String(r.country)) && ["DESKTOP", "MOBILE", "TABLET", "OTHER"].includes(String(r.device)) && nonnegative(r.clicks) && nonnegative(r.impressions) && nullable(r.position))
    && (v.ga4 === null || object(v.ga4) && keys(v.ga4, ["period", "landings", "events", ...(v.ga4.segments === undefined ? [] : ["segments"]), ...(v.ga4.recentCollection === undefined ? [] : ["recentCollection"])]) && validPeriod(v.ga4.period)
      && (v.ga4.recentCollection === undefined || object(v.ga4.recentCollection) && keys(v.ga4.recentCollection,["period","sessions","events","status"]) && validPeriod(v.ga4.recentCollection.period) && nonnegative(v.ga4.recentCollection.sessions) && nonnegative(v.ga4.recentCollection.events) && v.ga4.recentCollection.status === "provisional")
      && array(v.ga4.landings, r => object(r) && keys(r, ["path", "channel", "sessions", "engagedSessions", "keyEvents"]) && safePath(r.path) && channels.has(String(r.channel)) && nonnegative(r.sessions) && nonnegative(r.engagedSessions) && nonnegative(r.keyEvents))
      && array(v.ga4.events, r => object(r) && keys(r, ["event", "contentType", "events"]) && eventNames.has(String(r.event)) && contentTypes.has(String(r.contentType)) && nonnegative(r.events))
      && (v.ga4.segments === undefined || array(v.ga4.segments, r => object(r) && keys(r,["dimension","label","events","sessions"]) && validTrafficLabel(r.dimension,r.label) && nonnegative(r.events) && nonnegative(r.sessions))))
    && array(v.answerSources, r => {
      if (!object(r) || !keys(r, ["domain", "url", "group", "appearances", "kind"]) || !["organic", "ai_reference"].includes(String(r.kind)) || !["ecosystem-discovery", "mission-capability", "business-development", "other"].includes(String(r.group)) || !nonnegative(r.appearances)) return false;
      try { const u = new URL(String(r.url)); return u.protocol === "https:" && u.hostname === r.domain && !u.search && !u.hash && !u.username && !u.password && !/%40|@/.test(u.pathname); } catch { return false; }
    })
    && array(v.bingHealth, r => object(r) && keys(r, ["date", "crawled", "indexed", "blocked", "inboundLinks", "http4xx", "http5xx"]) && validDate(r.date) && [r.crawled, r.indexed, r.blocked, r.inboundLinks, r.http4xx, r.http5xx].every(nullable))
    && (v.indexCoverage === null || object(v.indexCoverage) && keys(v.indexCoverage, ["collectedAt", "reportDate", "indexed", "excluded", "reasons"]) && timestamp(v.indexCoverage.collectedAt) && validDate(v.indexCoverage.reportDate) && nonnegative(v.indexCoverage.indexed) && nonnegative(v.indexCoverage.excluded) && array(v.indexCoverage.reasons, r => object(r) && keys(r, ["reason", "count"]) && indexReasons.has(String(r.reason)) && nonnegative(r.count), 12))
    && array(v.annotations, r => object(r) && keys(r, ["date", "kind", "note"]) && validDate(r.date) && ["collection_gap", "release"].includes(String(r.kind)) && typeof r.note === "string" && r.note.length <= 300 && !/@|https?:/.test(r.note) && !Array.from(r.note).some(c => c.charCodeAt(0) < 32), 40);
}

export function parseBingDate(value: unknown): string | null {
  const match = String(value).match(/^\/Date\((\d+)(?:[+-]\d+)?\)\/$/);
  const date = match ? new Date(Number(match[1])).toISOString().slice(0, 10) : String(value).slice(0, 10);
  return validDate(date) ? date : null;
}
export function bingHealthRows(rows: Array<Record<string, unknown>>): BingHealth[] {
  const n = (value: unknown) => value === null || value === undefined || value === "" ? null : Number.isFinite(Number(value)) ? Number(value) : null;
  return rows.flatMap(r => { const date = parseBingDate(r.Date); return date ? [{ date, crawled: n(r.CrawledPages), indexed: n(r.InIndex), blocked: n(r.BlockedByRobotsTxt), inboundLinks: n(r.InLinks), http4xx: n(r.Code4xx), http5xx: n(r.Code5xx) }] : []; });
}

export function rankOpportunity(page: { impressions: number; ctr: number; position: number | null }) {
  const pos = page.position;
  if (pos === null || pos <= 0) return "monitor";
  // Conservative intervention heuristic, not a universal CTR benchmark.
  const threshold = pos <= 3 ? 0.03 : pos <= 10 ? 0.01 : 0.003;
  if (page.impressions >= 50 && pos <= 15 && page.ctr < threshold) return "ctr";
  if (page.impressions >= 20 && pos >= 4 && pos <= 20) return "position";
  return pos <= 30 ? "emerging" : "monitor";
}

export function validEarnedReferences(v: unknown): v is EarnedReferences {
  return object(v) && keys(v,["collectedAt","externalLinks","internalLinks","domains","targets","sourceUrl"]) && timestamp(v.collectedAt) && nonnegative(v.externalLinks) && nonnegative(v.internalLinks) && v.sourceUrl === "https://search.google.com/search-console/links"
    && array(v.domains,r=>object(r)&&keys(r,["domain","links"])&&typeof r.domain==="string"&&/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/.test(r.domain)&&nonnegative(r.links))
    && array(v.targets,r=>object(r)&&keys(r,["path","links"])&&safePath(r.path)&&nonnegative(r.links));
}
