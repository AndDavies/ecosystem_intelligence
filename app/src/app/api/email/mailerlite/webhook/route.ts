import { createHash } from "node:crypto";
import { privateJson } from "@/lib/product-insights/server";
import { mailerLiteGroups, parseMailerLiteWebhookEvents, unsubscribeMailerLiteSubscriber, verifyMailerLitePreferenceCenterGroupChange, verifyMailerLiteSignature } from "@/lib/email/mailerlite";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  defenceSignalAlertsConsentText,
  defenceSignalAlertsConsentVersion,
  northSignalConsentText,
  northSignalConsentVersion
} from "@/lib/product-insights/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifyMailerLiteSignature(rawBody, request.headers.get("signature"))) {
    return privateJson({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return privateJson({ ok: true, ignored: true }, { status: 202 });
  }
  const events = parseMailerLiteWebhookEvents(payload);
  if (events.length === 0) return privateJson({ ok: true, ignored: true }, { status: 202 });

  const admin = createAdminClient();
  const syncedAt = new Date().toISOString();
  const groups = mailerLiteGroups();
  for (const [index, event] of events.entries()) {
    const stream = event.groupId === groups.weekly
      ? "weekly"
      : event.groupId === groups.signalAlerts
        ? "signal_alerts"
        : null;
    if (event.groupAction && !stream) continue;
    const action = event.providerStatus === "unsubscribed" || event.providerStatus === "deleted"
      ? "global_unsubscribe"
      : event.groupAction === "added"
        ? "group_added"
        : event.groupAction === "removed"
          ? "group_removed"
          : "lifecycle";
    const eventKey = createHash("sha256")
      .update([rawBody, index, event.event, event.id, event.groupId ?? "none"].join("\u0000"))
      .digest("hex");
    const consentVersion = stream === "signal_alerts" ? defenceSignalAlertsConsentVersion : northSignalConsentVersion;
    const consentText = stream === "signal_alerts" ? defenceSignalAlertsConsentText : northSignalConsentText;
    const occurredAt = event.occurredAt ?? syncedAt;
    const preferenceCenterConsent = action === "group_added" && event.groupId && event.occurredAt
      ? await verifyMailerLitePreferenceCenterGroupChange(event.id, event.groupId, event.occurredAt, syncedAt)
      : false;
    const { data: reconciliationResult, error } = await admin.rpc("reconcile_north_signal_provider_event", {
      p_email: event.email,
      p_provider_subscriber_id: event.id,
      p_provider_status: event.providerStatus ?? "active",
      p_action: action,
      p_stream: stream,
      p_provider_group_id: event.groupId,
      p_event_key: eventKey,
      p_occurred_at: occurredAt,
      // Ordinary group membership reconciles existing consent only. New local
      // stream consent requires the explicit, fresh signed-event timestamp and
      // exact Preference Center activity proof computed above.
      p_allow_new_consent: preferenceCenterConsent,
      p_consent_version: consentVersion,
      p_consent_text: consentText
    });
    if (error) return privateJson({ error: "Reconciliation failed." }, { status: 500 });
    const reconciliation = Array.isArray(reconciliationResult) ? reconciliationResult[0] : null;
    if (action === "group_removed" && Number(reconciliation?.active_stream_count) === 0) {
      try {
        await unsubscribeMailerLiteSubscriber(event.id);
        const { error: providerStateError } = await admin.from("pilot_update_signups").update({
          mailing_provider_status: "unsubscribed",
          mailing_provider_synced_at: syncedAt,
          mailing_provider_error: null
        }).eq("email", event.email);
        if (providerStateError) throw new Error("Local global-unsubscribe state could not be reconciled.");
      } catch (providerError) {
        const message = providerError instanceof Error ? providerError.message.slice(0, 1000) : "MailerLite global unsubscribe failed.";
        await Promise.all([
          admin.from("pilot_update_signups").update({
            mailing_provider_status: "sync_failed",
            mailing_provider_error: message
          }).eq("email", event.email),
          admin.from("newsletter_subscription_preferences").update({
            provider_sync_status: "failed",
            provider_synced_at: null,
            provider_error: message
          }).eq("subscriber_id", reconciliation.result_subscriber_id)
        ]);
        return privateJson({ error: "Global unsubscribe reconciliation failed." }, { status: 500 });
      }
    }
  }
  return privateJson({ ok: true, reconciled: events.length }, { status: 202 });
}
