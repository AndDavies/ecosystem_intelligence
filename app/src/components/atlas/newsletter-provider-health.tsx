import { createAdminClient } from "@/lib/supabase/admin";
import { newsletterObservationSchema } from "@/lib/email/newsletter-observation";
import { refreshNewsletterObservation } from "@/lib/actions/newsletter-admin";
import { PendingButton } from "@/components/ui/pending-button";

export async function NewsletterProviderHealth() {
  const {data} = await createAdminClient().from("newsletter_provider_observations").select("summary").order("collected_at", {ascending: false}).limit(1).maybeSingle();
  const parsed = newsletterObservationSchema.safeParse(data?.summary);
  const summary = parsed.success ? parsed.data : null;
  const stale = summary && Date.now() - Date.parse(summary.collectedAt) > 36 * 3600000;
  return <div className="mb-5 rounded-lg bg-[var(--admin-surface-muted)] p-4 text-sm">
    <h3 className="font-bold">Delivery connection</h3>
    <p className="mt-2">{summary ? `${stale ? "Stale" : summary.status} · Checked ${new Date(summary.collectedAt).toLocaleString("en-CA", {timeZone: "America/Halifax"})} Halifax time` : "No verified provider observation yet."}</p>
    {summary && <><p className="mt-2">{summary.preferences.verified ?? "Unknown"} preferences verified · {summary.preferences.mismatches ?? "Unknown"} need review · {summary.preferences.unrecordedMemberships ?? "Unknown"} memberships without consent records · Welcome {summary.welcome.enabled === null ? "unknown" : summary.welcome.enabled ? "active" : "paused"} · Alerts {summary.alerts.status}</p>
      {summary.alerts.status === "draft" && <p className="mt-2">Alerts need activation{summary.groups.signalAlerts === 0 ? " after the first alert opt-in" : " in MailerLite"}. Weekly delivery remains a separate preference.</p>}
      {!!summary.errors.length && <p role="status" className="mt-2">Incomplete checks: {summary.errors.join(", ")}. Missing data is not zero.</p>}
      <details className="mt-3"><summary>Evidence and verification emails</summary><p className="mt-2">Provider groups: {summary.groups.master ?? "Unknown"} master · {summary.groups.weekly ?? "Unknown"} weekly · {summary.groups.signalAlerts ?? "Unknown"} alerts.</p><p>Welcome activity is cumulative and separate from issue performance: {summary.welcome.metrics.sent ?? "Unknown"} sent, {summary.welcome.metrics.uniqueClicks ?? "Unknown"} unique clicks. Opens are estimated.</p><p>{summary.campaigns.filter(c => c.purpose === "verification").length} verification campaigns excluded from growth totals. Campaigns without a verified delivery timestamp stay out of date-window comparisons.</p><a className="underline" href="https://dashboard.mailerlite.com/campaigns/status/sent">Inspect provider reports</a></details>
    </>}
    <form action={refreshNewsletterObservation} className="mt-3"><PendingButton unstyled pendingLabel="Checking connection…" className="rounded-md bg-[var(--admin-action)] px-4 py-2 font-semibold text-white">Refresh connection and results</PendingButton></form>
    <p className="mt-2 text-xs">Checked automatically daily at 12:30 UTC. This reads MailerLite and updates private reporting; it does not subscribe anyone or send email.</p>
  </div>;
}
