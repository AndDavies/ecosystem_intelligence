import "server-only";

import { createHmac } from "node:crypto";

export function requestFingerprint(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = request.headers.get("user-agent")?.slice(0, 500) ?? "unknown";
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "local-preview";
  return createHmac("sha256", secret).update(`${forwardedFor}|${userAgent}`).digest("hex");
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
