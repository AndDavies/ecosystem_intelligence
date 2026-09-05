import { requireAdminOwner } from "@/lib/atlas/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { collectPagedRows } from "@/lib/supabase/pagination";
import { escapeCsvValue } from "@/lib/export/csv";

export const dynamic = "force-dynamic";

function csvCell(value: unknown) {
  return escapeCsvValue(String(value ?? ""), { alwaysQuote: true });
}

export async function GET() {
  try {
    await requireAdminOwner();
  } catch {
    return new Response("Forbidden", { status: 403 });
  }
  const admin = createAdminClient();
  const [signups, preferences] = await Promise.allSettled([
    collectPagedRows((from,to) => admin.from("pilot_update_signups").select("id, email, status, consent_version, consent_text, source, cohort, landing_path, mailing_provider, mailing_provider_subscriber_id, mailing_provider_status, mailing_provider_synced_at, mailing_provider_error, created_at, updated_at").order("created_at", { ascending: false }).order("id").range(from,to), "newsletter subscribers"),
    collectPagedRows((from,to) => admin.from("newsletter_subscription_preferences").select("subscriber_id, stream, status, consent_version, consented_at, withdrawn_at, provider_sync_status, provider_synced_at, provider_error").order("subscriber_id").order("stream").range(from,to), "newsletter preferences")
  ]);
  if (signups.status === "rejected" || preferences.status === "rejected") return new Response("Export unavailable", { status: 500, headers: {"Cache-Control":"private, no-store"} });
  const preferencesBySubscriber = new Map(preferences.value.map((row) => [`${row.subscriber_id}:${row.stream}`,row]));
  const headers = ["email", "status", "weekly_status", "weekly_consent_version", "weekly_consented_at", "weekly_withdrawn_at", "alerts_status", "alerts_consent_version", "alerts_consented_at", "alerts_withdrawn_at", "preference_sync_status", "consent_version", "consent_text", "source", "cohort", "landing_path", "mailing_provider", "mailing_provider_subscriber_id", "mailing_provider_status", "mailing_provider_synced_at", "mailing_provider_error", "created_at", "updated_at"];
  const csvRows = signups.value.map((row) => {
    const weekly = preferencesBySubscriber.get(`${row.id}:weekly`);
    const alerts = preferencesBySubscriber.get(`${row.id}:signal_alerts`);
    const projection: Record<string, unknown> = {
      ...row,
      weekly_status: weekly?.status,
      weekly_consent_version: weekly?.consent_version,
      weekly_consented_at: weekly?.consented_at,
      weekly_withdrawn_at: weekly?.withdrawn_at,
      alerts_status: alerts?.status,
      alerts_consent_version: alerts?.consent_version,
      alerts_consented_at: alerts?.consented_at,
      alerts_withdrawn_at: alerts?.withdrawn_at,
      preference_sync_status: [weekly, alerts].filter(Boolean).map((preference) => `${preference?.stream}:${preference?.provider_sync_status}`).join("|")
    };
    return headers.map((key) => csvCell(projection[key])).join(",");
  });
  const csv = [headers.join(","), ...csvRows].join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=true-north-map-subscribers.csv", "Cache-Control": "private, no-store" } });
}
