import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { betaSignupSchema } from "@/lib/product-insights/validation";
import { privateJson, requestFingerprint } from "@/lib/product-insights/server";
import { hasMailerLiteEnv, upsertMailerLiteSubscriber } from "@/lib/email/mailerlite";
import { verifyPublicTurnstileToken } from "@/lib/security/turnstile";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = betaSignupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return privateJson({ error: "Please provide a valid email address and consent." }, { status: 400 });
  if (parsed.data.website) return privateJson({ ok: true }, { status: 202 });
  if (!await verifyPublicTurnstileToken(parsed.data.captchaToken)) {
    return privateJson({ error: "Please complete the verification check and try again." }, { status: 400 });
  }
  if (!hasSupabaseAdminEnv()) return privateJson({ error: "Update signup is not configured." }, { status: 503 });

  const supabase = createAdminClient();
  const requestHash = requestFingerprint(request);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("pilot_events")
    .select("id", { count: "exact", head: true })
    .eq("request_hash", requestHash)
    .eq("event_name", "subscription")
    .gte("created_at", oneHourAgo);

  if ((count ?? 0) >= 5) {
    return privateJson({ error: "Signup limit reached. Please try again later." }, { status: 429 });
  }

  const email = parsed.data.email;
  const { data: existingSignup, error: existingSignupError } = await supabase
    .from("pilot_update_signups")
    .select("status")
    .eq("email", email)
    .maybeSingle();
  if (existingSignupError) return privateJson({ error: "Your signup could not be saved. Please try again." }, { status: 500 });

  const createsConsent = existingSignup?.status !== "subscribed";
  const { error } = createsConsent ? await supabase.from("pilot_update_signups").upsert({
      email,
      consented: true,
      consent_text: parsed.data.consentText,
      consent_version: parsed.data.consentVersion,
      source: parsed.data.source,
      cohort: parsed.data.cohort,
      landing_path: parsed.data.landingPath,
      status: "subscribed"
    }, { onConflict: "email" }) : { error: null };

  if (error) return privateJson({ error: "Your signup could not be saved. Please try again." }, { status: 500 });

  if (hasMailerLiteEnv()) {
    try {
      const subscriber = await upsertMailerLiteSubscriber(email);
      await supabase.from("pilot_update_signups").update({
        mailing_provider: "mailerlite",
        mailing_provider_subscriber_id: subscriber.id,
        mailing_provider_status: subscriber.status,
        mailing_provider_synced_at: new Date().toISOString(),
        mailing_provider_error: null
      }).eq("email", email);
    } catch (providerError) {
      await supabase.from("pilot_update_signups").update({
        mailing_provider: "mailerlite",
        mailing_provider_status: "sync_failed",
        mailing_provider_error: providerError instanceof Error ? providerError.message.slice(0, 1000) : "MailerLite synchronization failed."
      }).eq("email", email);
    }
  }

  const successMetadata = Object.fromEntries(Object.entries({
    source: parsed.data.source,
    device_class: parsed.data.deviceClass,
    content_type: parsed.data.contentType,
    utm_source: parsed.data.utmSource,
    utm_medium: parsed.data.utmMedium,
    utm_content: parsed.data.utmContent
  }).filter(([, value]) => value !== null && value !== undefined));
  const eventLineage = {
    request_hash: requestHash,
    context_path: parsed.data.landingPath,
    cohort: parsed.data.cohort,
    session_id: parsed.data.sessionId,
    search_id: parsed.data.searchId
  };
  const consentEvents = [
    { ...eventLineage, event_name: "subscription", metadata: { source: parsed.data.source } },
    { ...eventLineage, event_name: "newsletter_success", metadata: successMetadata }
  ];
  if (createsConsent) {
    const { error: eventError } = await supabase.from("pilot_events").insert(consentEvents);
    if (eventError) console.error("North Signal consent event could not be recorded.", { code: eventError.code });
  }

  return NextResponse.json({ ok: true, message: createsConsent ? "You are subscribed to North Signal." : "You are already subscribed to North Signal." }, { status: 202, headers: { "Cache-Control": "private, no-store" } });
}
