import "server-only";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export async function reserveExportRequest(userId: string) {
  const subject = createHash("sha256").update(`tnm-export-v1:${userId}`).digest("hex");
  const { data, error } = await createAdminClient().rpc("reserve_export_request", { p_subject_hash: subject });
  const result = data?.[0];
  if (error || typeof result?.allowed !== "boolean" || !Number.isInteger(result.retry_after) || result.retry_after < 0) {
    throw new Error("Export allowance unavailable.");
  }
  return { allowed: result.allowed as boolean, retryAfter: result.retry_after as number };
}

// Server outcomes are separate from browser click analytics. No identity, IP,
// query, record selection or private shortlist information enters runtime logs.
export function recordExportOutcome(type: string, outcome: string, status: number, startedAt: number) {
  console.info(JSON.stringify({ event: "tnm_export", type, outcome, status, durationMs: Date.now() - startedAt }));
}
