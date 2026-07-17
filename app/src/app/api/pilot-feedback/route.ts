import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { pilotFeedbackSchema } from "@/lib/pilot/validation";
import { privateJson, requestFingerprint } from "@/lib/pilot/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasSupabaseAdminEnv()) return privateJson({ error: "Public-beta feedback is not configured." }, { status: 503 });

  const parsed = pilotFeedbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return privateJson({ error: "Please describe what you tried and what was missing." }, { status: 400 });
  if (parsed.data.website) return privateJson({ ok: true }, { status: 202 });

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

  await supabase.from("pilot_events").insert({
    request_hash: fingerprint,
    event_name: "feedback",
    context_path: parsed.data.contextPath,
    cohort: parsed.data.cohort,
    session_id: parsed.data.sessionId,
    search_id: parsed.data.searchId,
    metadata: { contact_provided: Boolean(parsed.data.contactEmail) }
  });

  return privateJson({ ok: true, message: "Thank you. Your feedback is ready for review." }, { status: 202 });
}
