import { createHash } from "node:crypto";

const trackingKeys = new Set([
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "mkt_tok",
  "msclkid"
]);

const legalSuffixes = new Set([
  "corp",
  "corporation",
  "inc",
  "incorporated",
  "ltd",
  "limited",
  "llc",
  "lp",
  "ulc"
]);

export function canonicalizeOsintUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:") throw new Error("OSINT evidence URLs must use HTTPS.");
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith("utm_") || trackingKeys.has(key.toLowerCase())) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  url.pathname = url.pathname.replace(/\/{2,}/g, "/");
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/$/, "");
  return url.toString();
}

export function normalizeOsintAlias(value: string) {
  const tokens = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  while (tokens.length > 1 && legalSuffixes.has(tokens[tokens.length - 1])) tokens.pop();
  return tokens.join(" ");
}

export function normalizeProcurementIdentifier(value: string) {
  return value
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9\-/]/g, "");
}

export function buildSourceIndependenceKey(urlValue: string, syndicatedEventId?: string | null) {
  if (syndicatedEventId?.trim()) return `syndicated:${normalizeProcurementIdentifier(syndicatedEventId)}`;
  return `host:${new URL(canonicalizeOsintUrl(urlValue)).hostname}`;
}

export function buildOsintEventFingerprint(input: {
  eventType: string;
  actors: string[];
  programOrTechnology?: string | null;
  procurementIdentifier?: string | null;
  effectiveDate?: string | null;
  canonicalUrls: string[];
}) {
  const hasDurableEventIdentity = Boolean(input.procurementIdentifier || input.programOrTechnology || input.effectiveDate);
  const normalized = {
    eventType: input.eventType.trim().toLowerCase(),
    actors: [...new Set(input.actors.map(normalizeOsintAlias).filter(Boolean))].sort(),
    programOrTechnology: input.programOrTechnology ? normalizeOsintAlias(input.programOrTechnology) : null,
    procurementIdentifier: input.procurementIdentifier ? normalizeProcurementIdentifier(input.procurementIdentifier) : null,
    effectiveDate: input.effectiveDate ?? null,
    canonicalUrls: hasDurableEventIdentity ? [] : [...new Set(input.canonicalUrls.map(canonicalizeOsintUrl))].sort()
  };
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

export function isDiscoveryOnlySourceChannel(channel: string) {
  return ["gmail_newsletter", "linkedin_chrome", "other_discovery"].includes(channel);
}
