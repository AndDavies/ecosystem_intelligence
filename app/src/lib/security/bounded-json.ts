const textEncoder = new TextEncoder();

export const MEMBER_WORKFLOW_MAX_BODY_BYTES = 12 * 1024;
export const SUBMISSION_DAILY_LIMIT = 10;
export const CONNECTION_DAILY_LIMIT = 5;

export type BoundedJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: "too_large" | "invalid_json" };

export async function readBoundedJson(
  request: Request,
  maxBytes = MEMBER_WORKFLOW_MAX_BODY_BYTES
): Promise<BoundedJsonResult> {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const declaredBytes = Number.parseInt(contentLength, 10);
    if (Number.isFinite(declaredBytes) && declaredBytes > maxBytes) {
      return { ok: false, reason: "too_large" };
    }
  }

  const body = await request.text().catch(() => null);
  if (body === null) return { ok: false, reason: "invalid_json" };
  if (textEncoder.encode(body).byteLength > maxBytes) {
    return { ok: false, reason: "too_large" };
  }

  try {
    return { ok: true, value: JSON.parse(body) as unknown };
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
}

export function memberWorkflowWindowStart(now = new Date()) {
  return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
}

export function isMemberWorkflowQuotaError(error: { code?: string | null; message?: string | null } | null) {
  return error?.code === "P0001" && /daily (?:submission|connection) limit/i.test(error.message ?? "");
}
