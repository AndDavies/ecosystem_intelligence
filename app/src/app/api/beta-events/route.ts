import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { betaEventSchema } from "@/lib/product-insights/validation";
import { privateJson, requestFingerprint } from "@/lib/product-insights/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasSupabaseAdminEnv()) return privateJson({ ok: true }, { status: 202 });

  const parsed = betaEventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return privateJson({ error: "Invalid public-beta event." }, { status: 400 });

  const supabase = createAdminClient();
  const fingerprint = requestFingerprint(request);
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  await supabase.from("pilot_events").delete().lte("expires_at", new Date().toISOString());
  const { count } = await supabase
    .from("pilot_events")
    .select("id", { count: "exact", head: true })
    .eq("request_hash", fingerprint)
    .gte("created_at", oneMinuteAgo);

  if ((count ?? 0) >= 60) return privateJson({ ok: true }, { status: 202 });

  const { error } = await supabase.from("pilot_events").insert({
    request_hash: fingerprint,
    event_name: parsed.data.eventName,
    context_path: parsed.data.contextPath,
    cohort: parsed.data.cohort,
    session_id: parsed.data.sessionId,
    search_id: parsed.data.searchId,
    metadata: parsed.data.metadata,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });

  if (error) return privateJson({ error: "Event could not be recorded." }, { status: 500 });
  return privateJson({ ok: true }, { status: 202 });
}
