import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { betaSignupSchema, defenceSignalAlertsConsentText, defenceSignalAlertsConsentVersion } from "@/lib/product-insights/validation";
import { getAtlasUser, isAtlasAdminOwner } from "@/lib/atlas/auth";
import { boundedOccurredAt, privateJson, requestFingerprint, serverEntryChannel, serverTrafficClass } from "@/lib/product-insights/server";
import { hasMailerLiteEnv, mailerLiteGroups, signalAlertsAreConfigured, upsertMailerLiteSubscriber } from "@/lib/email/mailerlite";
import { verifyPublicTurnstileToken } from "@/lib/security/turnstile";

export const dynamic = "force-dynamic";

export async function GET() {
  return privateJson({ signalAlerts: signalAlertsAreConfigured() });
}

export async function POST(request: Request) {
  const parsed = betaSignupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return privateJson({ error: "Please provide a valid email address and consent." }, { status: 400 });
  if (parsed.data.website) return privateJson({ ok: true }, { status: 202 });
  if (!await verifyPublicTurnstileToken(parsed.data.captchaToken)) {
    return privateJson({ error: "Please complete the verification check and try again." }, { status: 400 });
  }
  if (!hasSupabaseAdminEnv()) return privateJson({ error: "Update signup is not configured." }, { status: 503 });
  if (parsed.data.signalAlerts && !signalAlertsAreConfigured()) {
    return privateJson({ error: "Defence Signal alerts are not available yet." }, { status: 409 });
  }

  const supabase = createAdminClient();
  const requestHash = requestFingerprint(request);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("pilot_events")
    .select("id", { count: "exact", head: true })
    .eq("request_hash", requestHash)
    .in("event_name", ["newsletter_submit", "newsletter_success", "subscription"])
    .gte("created_at", oneHourAgo);

  if ((count ?? 0) >= 5) {
    return privateJson({ error: "Signup limit reached. Please try again later." }, { status: 429 });
  }

  const email = parsed.data.email;
  const currentUser = await getAtlasUser().catch(() => null);
  const trafficClass = serverTrafficClass(request, isAtlasAdminOwner(currentUser));
  const entryChannel = serverEntryChannel(request, { source: parsed.data.utmSource, medium: parsed.data.utmMedium });
  const receivedAt = new Date();
  const successMetadata = {
    placement: parsed.data.source,
    device_class: parsed.data.deviceClass,
    content_type: parsed.data.contentType ?? "unknown",
    landing_path: parsed.data.landingPath
  };
  const { data: consentResult, error: consentError } = await supabase.rpc("record_north_signal_consent", {
    p_email: email,
    p_weekly_consent_version: parsed.data.consentVersion,
    p_weekly_consent_text: parsed.data.consentText,
    p_alerts_requested: parsed.data.signalAlerts,
    p_alerts_consent_version: parsed.data.alertsConsentVersion ?? defenceSignalAlertsConsentVersion,
    p_alerts_consent_text: parsed.data.alertsConsentText ?? defenceSignalAlertsConsentText,
    p_source: parsed.data.source,
    p_cohort: parsed.data.cohort,
    p_landing_path: parsed.data.landingPath,
    p_request_hash: requestHash,
    p_session_id: parsed.data.sessionId,
    p_search_id: parsed.data.searchId,
    p_success_event_id: parsed.data.successEventId,
    p_occurred_at: boundedOccurredAt(parsed.data.occurredAt, receivedAt),
    p_entry_channel: entryChannel,
    p_traffic_class: trafficClass,
    p_utm_source: parsed.data.utmSource,
    p_utm_medium: parsed.data.utmMedium,
    p_utm_campaign: parsed.data.utmCampaign,
    p_utm_content: parsed.data.utmContent,
    p_success_metadata: successMetadata
  });
  if (consentError) return privateJson({ error: "Your signup could not be saved. Please try again." }, { status: 500 });
  const consentRow = Array.isArray(consentResult) ? consentResult[0] : null;
  const subscriberId = consentRow?.result_subscriber_id;
  const createsConsent = Boolean(consentRow?.created_global_consent);
  const replayed = Boolean(consentRow?.operation_replayed);

  if (!replayed && hasMailerLiteEnv()) {
    try {
      const subscriber = await upsertMailerLiteSubscriber(email, { weekly: true, signalAlerts: parsed.data.signalAlerts });
      if (subscriber.status !== "active") throw new Error(`MailerLite returned ${subscriber.status}; provider reactivation requires reconciliation.`);
      const groups = mailerLiteGroups();
      const syncedAt = new Date().toISOString();
      const { error: ledgerSyncError } = await supabase.from("pilot_update_signups").update({
        mailing_provider: "mailerlite",
        mailing_provider_subscriber_id: subscriber.id,
        mailing_provider_status: subscriber.status,
        mailing_provider_synced_at: syncedAt,
        mailing_provider_error: null
      }).eq("email", email);
      if (ledgerSyncError) throw new Error("Local provider reconciliation failed after MailerLite accepted the subscriber.");
      if (subscriberId) {
        const { error: weeklySyncError } = await supabase.from("newsletter_subscription_preferences").update({
          provider_group_id: groups.weekly,
          provider_sync_status: groups.weekly ? "synced" : "not_configured",
          provider_synced_at: groups.weekly ? syncedAt : null,
          provider_error: null
        }).eq("subscriber_id", subscriberId).eq("stream", "weekly");
        if (weeklySyncError) throw new Error("Weekly delivery reconciliation failed after MailerLite accepted the subscriber.");
        if (parsed.data.signalAlerts) {
          const { error: alertSyncError } = await supabase.from("newsletter_subscription_preferences").update({
            provider_group_id: groups.signalAlerts,
            provider_sync_status: "synced",
            provider_synced_at: syncedAt,
            provider_error: null
          }).eq("subscriber_id", subscriberId).eq("stream", "signal_alerts");
          if (alertSyncError) throw new Error("Alert delivery reconciliation failed after MailerLite accepted the subscriber.");
        }
      }
    } catch (providerError) {
      await supabase.from("pilot_update_signups").update({
        mailing_provider: "mailerlite",
        mailing_provider_status: "sync_failed",
        mailing_provider_error: providerError instanceof Error ? providerError.message.slice(0, 1000) : "MailerLite synchronization failed."
      }).eq("email", email);
      if (subscriberId) {
        const { error: preferenceFailureError } = await supabase.from("newsletter_subscription_preferences").update({
          provider_sync_status: "failed",
          provider_error: providerError instanceof Error ? providerError.message.slice(0, 1000) : "MailerLite synchronization failed."
        }).eq("subscriber_id", subscriberId).in("stream", parsed.data.signalAlerts ? ["weekly", "signal_alerts"] : ["weekly"]);
        if (preferenceFailureError) console.error("North Signal provider failure could not be reconciled locally.", { code: preferenceFailureError.code });
      }
    }
  } else if (!replayed && subscriberId) {
    const { error: unavailableError } = await supabase.from("newsletter_subscription_preferences").update({
      provider_sync_status: "not_configured",
      provider_synced_at: null,
      provider_error: null
    }).eq("subscriber_id", subscriberId).in("stream", parsed.data.signalAlerts ? ["weekly", "signal_alerts"] : ["weekly"]);
    if (unavailableError) console.error("North Signal provider availability could not be reconciled locally.", { code: unavailableError.code });
  }

  return NextResponse.json({
    ok: true,
    weekly: true,
    signalAlerts: parsed.data.signalAlerts,
    message: createsConsent ? "You are subscribed to North Signal." : "Your North Signal preferences are saved."
  }, { status: 202, headers: { "Cache-Control": "private, no-store" } });
}
