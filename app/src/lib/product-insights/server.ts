import "server-only";

import { createHmac } from "node:crypto";
import { isIP } from "node:net";

function canonicalClientAddress(request: Request) {
  // The production origin is Vercel, which overwrites this header at ingress.
  // Do not accept arbitrary forwarding chains or caller-controlled browser fields.
  const address = (request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-forwarded-for"))?.trim() ?? "";
  const family = isIP(address);
  if (family === 4) return address;
  if (family !== 6 || address.includes("%")) return "unknown";
  const normalized = new URL(`http://[${address}]/`).hostname.slice(1, -1);
  const mapped = /^::ffff:([a-f0-9]+):([a-f0-9]+)$/.exec(normalized);
  if (mapped) {
    const high = parseInt(mapped[1], 16);
    const low = parseInt(mapped[2], 16);
    return `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
  }
  return normalized;
}

export function requestFingerprint(request: Request) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "local-preview";
  return createHmac("sha256", secret).update(`client-address|${canonicalClientAddress(request)}`).digest("hex");
}

export function assistantSubjectFingerprint(request: Request, userId?: string | null) {
  if (!userId) return requestFingerprint(request);
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "local-preview";
  return createHmac("sha256", secret).update(`assistant-user|${userId}`).digest("hex");
}

export function normalizeBetaSearchQuery(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function privateJson(body: unknown, init?: ResponseInit) {
  const response = Response.json(body, init);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export type ServerTrafficClass = "production" | "staff" | "qa";
export type ServerEntryChannel = "direct" | "organic_google" | "organic_other" | "email" | "founder_social" | "company_social" | "earned_partner" | "referral" | "authentication_service" | "internal" | "unknown";

export function serverTrafficClass(request: Request, isStaff = false): ServerTrafficClass {
  if (isStaff) return "staff";
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim().toLowerCase();
  const host = (forwardedHost || request.headers.get("host") || "").split(":")[0]?.toLowerCase();
  return host === "truenorthmap.ca" || host === "www.truenorthmap.ca" ? "production" : "qa";
}

export function serverEntryChannel(request: Request, attribution: { source?: string | null; medium?: string | null }): ServerEntryChannel {
  if (attribution.source === "mailerlite" || attribution.medium === "email") return "email";
  if (attribution.medium === "founder_social") return "founder_social";
  if (attribution.medium === "company_social") return "company_social";
  if (attribution.medium === "earned_partner") return "earned_partner";
  try {
    const hostname = new URL(request.headers.get("referer") ?? "").hostname.toLowerCase();
    if (hostname === "accounts.google.com") return "authentication_service";
    if (hostname === "truenorthmap.ca" || hostname === "www.truenorthmap.ca") return "internal";
    if (hostname === "google.com" || hostname.endsWith(".google.com") || /^www\.google\.[a-z.]+$/.test(hostname)) return "organic_google";
    if (/^(?:www\.)?(?:bing|duckduckgo)\./.test(hostname)) return "organic_other";
    if (hostname) return "referral";
  } catch {
    // A missing or malformed referrer is treated as direct.
  }
  return "direct";
}

export function boundedOccurredAt(value: string, receivedAt = new Date()) {
  const occurred = new Date(value);
  const earliest = receivedAt.getTime() - 7 * 24 * 60 * 60 * 1000;
  const latest = receivedAt.getTime() + 5 * 60 * 1000;
  const bounded = Math.min(Math.max(occurred.getTime(), earliest), latest);
  return new Date(bounded).toISOString();
}
