import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { pilotSignupSchema } from "@/lib/pilot/validation";
import { privateJson, requestFingerprint } from "@/lib/pilot/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasSupabaseAdminEnv()) return privateJson({ error: "Preview signup is not configured." }, { status: 503 });

  const parsed = pilotSignupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return privateJson({ error: "Please provide a valid email address and consent." }, { status: 400 });
  if (parsed.data.website) return privateJson({ ok: true }, { status: 202 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("pilot_update_signups").upsert({
    email: parsed.data.email,
    consented: true,
    consent_text: parsed.data.consentText,
    consent_version: parsed.data.consentVersion,
    source: parsed.data.source,
    cohort: parsed.data.cohort,
    landing_path: parsed.data.landingPath,
    status: "subscribed"
  }, { onConflict: "email" });

  if (error) return privateJson({ error: "Your signup could not be saved. Please try again." }, { status: 500 });

  await supabase.from("pilot_events").insert({
    request_hash: requestFingerprint(request),
    event_name: "signup",
    context_path: parsed.data.landingPath,
    cohort: parsed.data.cohort,
    metadata: { source: parsed.data.source }
  });

  return NextResponse.json({ ok: true, message: "You are on the design-partner update list." }, { status: 202, headers: { "Cache-Control": "private, no-store" } });
}

