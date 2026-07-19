import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { privateJson, requestFingerprint } from "@/lib/product-insights/server";
import { contactMessageSchema } from "@/lib/beta/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = contactMessageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return privateJson({ error: "Please complete the contact form." }, { status: 400 });
  if (parsed.data.website) return privateJson({ ok: true }, { status: 202 });
  if (!hasSupabaseAdminEnv()) return privateJson({ error: "Contact is temporarily unavailable." }, { status: 503 });

  const supabase = createAdminClient();
  const requestHash = requestFingerprint(request);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("request_hash", requestHash).gte("created_at", oneHourAgo);
  if ((count ?? 0) >= 5) return privateJson({ error: "Message limit reached. Please try again later." }, { status: 429 });

  const { error } = await supabase.from("contact_messages").insert({
    category: parsed.data.category,
    sender_name: parsed.data.senderName,
    sender_email: parsed.data.senderEmail,
    organization_name: parsed.data.organizationName,
    message: parsed.data.message,
    request_hash: requestHash,
    status: "new"
  });
  if (error) return privateJson({ error: "Your message could not be saved. Please try again." }, { status: 500 });
  return privateJson({ ok: true, message: "Your message has been received." }, { status: 202 });
}
