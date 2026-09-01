import type { AtlasBounds, AtlasQuery } from "@/types/atlas";
import { normalizeGuidedSearchFocus } from "@/lib/atlas/guided-search";

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBounds(value: string | null): AtlasBounds | undefined {
  if (!value) return undefined;
  const parts = value.split(",").map((item) => Number(item));
  if (parts.length !== 4 || parts.some((item) => !Number.isFinite(item))) return undefined;
  const [west, south, east, north] = parts;
  if (west >= east || south >= north) return undefined;
  if (west < -180 || east > 180 || south < -90 || north > 90) return undefined;
  return { west, south, east, north };
}

export function atlasQueryFromSearchParams(searchParams: URLSearchParams): AtlasQuery {
  const read = (name: string) => searchParams.get(name)?.trim() || undefined;
  const view = read("view");
  const selected = read("selected");
  return {
    query: read("q"),
    bounds: parseBounds(searchParams.get("bounds")),
    region: read("region"),
    metro: read("metro"),
    type: read("type"),
    capability: read("capability"),
    domain: read("domain"),
    mission: read("mission"),
    demand: read("demand"),
    stage: read("stage"),
    program: read("program"),
    cluster: read("cluster"),
    focus: normalizeGuidedSearchFocus(searchParams.getAll("focus")),
    view: view === "map" || view === "table" ? view : undefined,
    selected: selected && /^[0-9a-f-]{36}$/i.test(selected) ? selected : undefined,
    page: positiveInteger(searchParams.get("page"), 1),
    pageSize: positiveInteger(searchParams.get("pageSize"), 25)
  };
}

export function atlasQueryToSearchParams(query: AtlasQuery) {
  const params = new URLSearchParams();
  const set = (key: string, value?: string | number) => {
    if (value !== undefined && String(value).trim()) params.set(key, String(value));
  };
  set("q", query.query);
  set("region", query.region);
  set("metro", query.metro);
  set("type", query.type);
  set("capability", query.capability);
  set("domain", query.domain);
  set("mission", query.mission);
  set("demand", query.demand);
  set("stage", query.stage);
  set("program", query.program);
  set("cluster", query.cluster);
  const focus = normalizeGuidedSearchFocus(query.focus);
  if (focus.length) set("focus", focus.join(","));
  set("view", query.view);
  set("selected", query.selected);
  if (query.bounds) {
    set("bounds", [query.bounds.west, query.bounds.south, query.bounds.east, query.bounds.north].join(","));
  }
  if (query.page && query.page > 1) set("page", query.page);
  if (query.pageSize && query.pageSize !== 25) set("pageSize", query.pageSize);
  return params;
}
