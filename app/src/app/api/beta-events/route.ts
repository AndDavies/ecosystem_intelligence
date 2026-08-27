import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { betaEventSchema } from "@/lib/product-insights/validation";
import { getAtlasUser, isAtlasAdminOwner } from "@/lib/atlas/auth";
import { boundedOccurredAt, privateJson, requestFingerprint, serverEntryChannel, serverTrafficClass } from "@/lib/product-insights/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasSupabaseAdminEnv()) return privateJson({ ok: true }, { status: 202 });

  const parsed = betaEventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return privateJson({ error: "Invalid public-beta event." }, { status: 400 });

  const supabase = createAdminClient();
  const fingerprint = requestFingerprint(request);
  const receivedAt = new Date();
  const currentUser = await getAtlasUser().catch(() => null);
  const trafficClass = serverTrafficClass(request, isAtlasAdminOwner(currentUser));
  const entryChannel = serverEntryChannel(request, {
    source: parsed.data.utmSource,
    medium: parsed.data.utmMedium
  });
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  const { count } = await supabase
    .from("pilot_events")
    .select("id", { count: "exact", head: true })
    .eq("request_hash", fingerprint)
    .gte("created_at", oneMinuteAgo);

  if ((count ?? 0) >= 60) return privateJson({ ok: true }, { status: 202 });

  const { error } = await supabase.from("pilot_events").insert({
    event_id: parsed.data.eventId,
    request_hash: fingerprint,
    event_name: parsed.data.eventName,
    context_path: parsed.data.contextPath,
    cohort: parsed.data.cohort,
    session_id: parsed.data.sessionId,
    search_id: parsed.data.searchId,
    metadata: parsed.data.metadata,
    occurred_at: boundedOccurredAt(parsed.data.occurredAt, receivedAt),
    received_at: receivedAt.toISOString(),
    entry_channel: entryChannel,
    traffic_class: trafficClass,
    utm_source: parsed.data.utmSource,
    utm_medium: parsed.data.utmMedium,
    utm_campaign: parsed.data.utmCampaign,
    utm_content: parsed.data.utmContent,
    expires_at: new Date(receivedAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });

  if (error?.code === "23505") return privateJson({ ok: true, duplicate: true }, { status: 202 });
  if (error) return privateJson({ error: "Event could not be recorded." }, { status: 500 });
  return privateJson({ ok: true }, { status: 202 });
}
