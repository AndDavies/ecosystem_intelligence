import { privateJson } from "@/lib/product-insights/server";
import { parseMailerLiteWebhook, verifyMailerLiteSignature } from "@/lib/email/mailerlite";
import { createAdminClient } from "@/lib/supabase/admin";

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
  const event = parseMailerLiteWebhook(payload);
  if (!event) return privateJson({ ok: true, ignored: true }, { status: 202 });

  const admin = createAdminClient();
  const updates: Record<string, string | null> = {
    mailing_provider: "mailerlite",
    mailing_provider_subscriber_id: event.id,
    mailing_provider_status: event.providerStatus,
    mailing_provider_synced_at: new Date().toISOString(),
    mailing_provider_error: null
  };
  if (event.event === "subscriber.unsubscribed") updates.status = "unsubscribed";

  const { error } = await admin.from("pilot_update_signups").update(updates).eq("email", event.email);
  if (error) return privateJson({ error: "Reconciliation failed." }, { status: 500 });
  return privateJson({ ok: true }, { status: 202 });
}
