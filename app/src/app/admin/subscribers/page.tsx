import Link from "next/link";
import { Download, MailCheck, RefreshCw, UserMinus } from "lucide-react";
import { AdminNav } from "@/components/atlas/admin-nav";
import { EmptyCoverage, PublicPageShell } from "@/components/atlas/public-page-shell";
import { requireAdminOwner } from "@/lib/atlas/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminSubscribersPage() {
  const user = await requireAdminOwner();
  const admin = createAdminClient();
  const [{ data: subscribers, error }, preferences] = await Promise.all([
    admin.from("pilot_update_signups")
      .select("id, email, status, source, consent_version, consent_text, cohort, landing_path, mailing_provider, mailing_provider_status, mailing_provider_synced_at, mailing_provider_error, created_at, updated_at")
      .order("created_at", { ascending: false }),
    admin.from("newsletter_subscription_preferences").select("subscriber_id, stream, status, provider_sync_status, provider_error")
  ]);

  const rows = subscribers ?? [];
  const active = rows.filter((row) => row.status === "subscribed").length;
  const unsubscribed = rows.filter((row) => row.status === "unsubscribed").length;
  const preferenceRows = preferences.data ?? [];
  const weekly = preferences.error ? null : preferenceRows.filter((row) => row.stream === "weekly" && row.status === "subscribed").length;
  const alerts = preferences.error ? null : preferenceRows.filter((row) => row.stream === "signal_alerts" && row.status === "subscribed").length;
  const pendingSync = preferences.error
    ? rows.filter((row) => row.mailing_provider_status === "sync_failed" || (row.status === "subscribed" && !row.mailing_provider_synced_at)).length
    : preferenceRows.filter((row) => row.provider_sync_status === "failed" || row.provider_error).length;
  const preferencesBySubscriber = new Map<number, typeof preferenceRows>();
  for (const preference of preferenceRows) preferencesBySubscriber.set(preference.subscriber_id, [...(preferencesBySubscriber.get(preference.subscriber_id) ?? []), preference]);

  return (
    <PublicPageShell variant="admin" eyebrow="Private administration" title="North Signal subscribers" description="See who subscribed to the weekly True North Map briefing. Consent remains recorded here while MailerLite handles delivery and unsubscribe links." actions={<span className="rounded bg-[var(--admin-surface-subtle)] px-3 py-2 text-xs font-semibold text-[var(--admin-muted-strong)]">administrator · {user.email}</span>}>
      <AdminNav />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<MailCheck className="size-5" />} label="Global subscribers" value={active} />
        <Metric icon={<MailCheck className="size-5" />} label="Weekly delivery" value={weekly ?? "Unavailable"} />
        <Metric icon={<MailCheck className="size-5" />} label="Signal alerts" value={alerts ?? "Unavailable"} />
        <Metric icon={<UserMinus className="size-5" />} label="Unsubscribed" value={unsubscribed} />
        <Metric icon={<RefreshCw className="size-5" />} label="Needs delivery sync" value={pendingSync} />
      </div>

      <div className="mt-7 flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-lg font-bold text-[var(--atlas-ink)]">Consent-backed North Signal list</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--atlas-ink-soft)]">Use MailerLite for the weekly briefing, welcome email, and unsubscribe links. This private ledger remains the record of what each person agreed to receive.</p></div>
        <Link href="/api/admin/subscribers" className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--atlas-border)] bg-white px-4 text-xs font-semibold text-[var(--atlas-ink)] no-underline hover:bg-[var(--atlas-signal-soft)] hover:no-underline"><Download className="size-4" />Export CSV</Link>
      </div>

      {error ? <div className="mt-4 rounded-xl border border-[var(--admin-danger-border)] bg-[var(--admin-danger-soft)] p-4 text-sm text-[var(--admin-danger)]">The subscriber list could not be loaded.</div> : rows.length ? (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--atlas-border)] bg-white shadow-[var(--atlas-shadow-soft)]">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-[var(--atlas-signal-soft)] text-[var(--atlas-ink-soft)]"><tr><th className="p-3">Email</th><th className="p-3">Consent</th><th className="p-3">Preferences</th><th className="p-3">Source</th><th className="p-3">Delivery</th><th className="p-3">Joined</th><th className="p-3">Updated</th></tr></thead>
            <tbody>{rows.map((row) => { const streams = preferencesBySubscriber.get(row.id) ?? []; return <tr key={row.id} className="border-t border-[var(--atlas-border)] align-top"><td className="p-3 font-semibold text-[var(--atlas-ink)]">{row.email}</td><td className="p-3"><Status value={row.status} /></td><td className="p-3 text-[var(--atlas-ink-soft)]">{preferences.error ? "Unavailable" : streams.length ? streams.map((stream) => <span key={stream.stream} className="mb-1 block">{humanize(stream.stream)} · {humanize(stream.status)}</span>) : "No stream rows"}</td><td className="p-3 text-[var(--atlas-ink-soft)]">{humanize(row.source)}{row.cohort ? <span className="block">{row.cohort}</span> : null}</td><td className="p-3 text-[var(--atlas-ink-soft)]">{row.mailing_provider_status ? <Status value={row.mailing_provider_status} /> : "Not connected"}{row.mailing_provider_error ? <span className="mt-1 block max-w-xs text-[var(--admin-danger)]">{row.mailing_provider_error}</span> : null}</td><td className="p-3 text-[var(--atlas-ink-soft)]">{dateTime(row.created_at)}</td><td className="p-3 text-[var(--atlas-ink-soft)]">{dateTime(row.updated_at)}</td></tr>; })}</tbody>
          </table>
        </div>
      ) : <div className="mt-4"><EmptyCoverage title="No North Signal subscribers yet" detail="New consent-backed subscriptions will appear here." /></div>}
    </PublicPageShell>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) { return <div className="rounded-2xl border border-[var(--atlas-border)] bg-white p-5 shadow-[var(--atlas-shadow-soft)]"><div className="flex items-center justify-between text-[var(--atlas-ink)]">{icon}<strong className="text-2xl">{value}</strong></div><p className="mt-3 text-xs font-semibold text-[var(--atlas-ink-soft)]">{label}</p></div>; }
function Status({ value }: { value: string }) { const warning = value === "unsubscribed" || value === "bounced" || value === "junk" || value === "deleted" || value === "sync_failed"; return <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${warning ? "bg-[var(--admin-danger-soft-strong)] text-[var(--admin-danger)]" : "bg-[var(--admin-success-soft-strong)] text-[var(--admin-success-strong)]"}`}>{humanize(value)}</span>; }
function humanize(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function dateTime(value: string) { return new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Halifax" }).format(new Date(value)); }
