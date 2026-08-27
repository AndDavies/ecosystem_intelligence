"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { readMailerLiteCampaignAggregate, type MailerLiteCampaignAggregate } from "@/lib/email/mailerlite-campaign-metrics";
import { createAdminClient } from "@/lib/supabase/admin";

const campaignImportSchema = z.object({
  stream: z.enum(["weekly", "signal_alerts"]),
  contentSlug: z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  providerCampaignId: z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9_-]+$/)
});

export async function importNewsletterCampaignAggregate(formData: FormData) {
  await requireAtlasStaff("editor");
  const parsed = campaignImportSchema.safeParse({
    stream: String(formData.get("stream") ?? ""),
    contentSlug: String(formData.get("contentSlug") ?? ""),
    providerCampaignId: String(formData.get("providerCampaignId") ?? "")
  });
  if (!parsed.success) redirect("/admin/insights?error=invalid-campaign-aggregate");

  let aggregate: MailerLiteCampaignAggregate;
  try {
    aggregate = await readMailerLiteCampaignAggregate(parsed.data.providerCampaignId);
  } catch {
    redirect("/admin/insights?error=campaign-aggregate-unavailable");
  }

  const admin = createAdminClient();
  const { data: deliveryRun, error: deliveryError } = await admin
    .from("newsletter_delivery_runs")
    .upsert({
      stream: parsed.data.stream,
      content_slug: parsed.data.contentSlug,
      provider_campaign_id: aggregate.providerCampaignId,
      status: "sent",
      completed_at: aggregate.completedAt,
      error: null
    }, { onConflict: "stream,content_slug" })
    .select("id")
    .single();
  if (deliveryError || !deliveryRun?.id) redirect("/admin/insights?error=campaign-run-reconciliation");

  const observedAt = new Date().toISOString();
  const { error: metricError } = await admin.from("newsletter_campaign_metric_snapshots").insert({
    delivery_run_id: deliveryRun.id,
    provider_campaign_id: aggregate.providerCampaignId,
    observed_at: observedAt,
    sent: aggregate.sent,
    delivered: aggregate.delivered,
    estimated_unique_opens: aggregate.estimatedUniqueOpens,
    unique_clicks: aggregate.uniqueClicks,
    bounces: aggregate.bounces,
    unsubscribes: aggregate.unsubscribes
  });
  if (metricError) redirect("/admin/insights?error=campaign-metric-reconciliation");

  revalidatePath("/admin/insights");
  redirect("/admin/insights?campaignMetrics=refreshed");
}
