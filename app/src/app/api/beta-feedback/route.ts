import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { betaFeedbackSchema } from "@/lib/product-insights/validation";
import { getAtlasUser, isAtlasAdminOwner } from "@/lib/atlas/auth";
import { privateJson, requestFingerprint, serverEntryChannel, serverTrafficClass } from "@/lib/product-insights/server";
import { verifyPublicTurnstileToken } from "@/lib/security/turnstile";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = betaFeedbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return privateJson({ error: "Please describe what you tried and what was missing." }, { status: 400 });
  if (parsed.data.website) return privateJson({ ok: true }, { status: 202 });
  if (!await verifyPublicTurnstileToken(parsed.data.captchaToken)) {
    return privateJson({ error: "Please complete the verification check and try again." }, { status: 400 });
  }
  if (!hasSupabaseAdminEnv()) return privateJson({ error: "Public-beta feedback is not configured." }, { status: 503 });

  const supabase = createAdminClient();
  const fingerprint = requestFingerprint(request);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("pilot_feedback")
    .select("id", { count: "exact", head: true })
    .eq("request_hash", fingerprint)
    .gte("created_at", oneHourAgo);

  if ((count ?? 0) >= 5) return privateJson({ error: "Feedback limit reached. Please try again later." }, { status: 429 });

  const { error } = await supabase.from("pilot_feedback").insert({
    request_hash: fingerprint,
    goal: parsed.data.goal,
    worked: parsed.data.worked,
    missing: parsed.data.missing,
    contact_email: parsed.data.contactEmail,
    context_path: parsed.data.contextPath,
    cohort: parsed.data.cohort,
    status: "pending"
  });

  if (error) return privateJson({ error: "Your feedback could not be saved. Please try again." }, { status: 500 });

  const receivedAt = new Date().toISOString();
  const currentUser = await getAtlasUser().catch(() => null);
  const { error: eventError } = await supabase.from("pilot_events").insert({
    request_hash: fingerprint,
    event_name: "feedback",
    context_path: parsed.data.contextPath,
    cohort: parsed.data.cohort,
    session_id: parsed.data.sessionId,
    search_id: parsed.data.searchId,
    metadata: { mode: "public_form", outcome: "submitted" },
    occurred_at: receivedAt,
    received_at: receivedAt,
    entry_channel: serverEntryChannel(request, {}),
    traffic_class: serverTrafficClass(request, isAtlasAdminOwner(currentUser)),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });
  if (eventError) console.error("Feedback was saved but its bounded event could not be recorded.", { code: eventError.code });

  return privateJson({ ok: true, message: "Thank you. Your feedback is ready for review." }, { status: 202 });
}
