import Link from "next/link";
import { Download, MailCheck, RefreshCw, UserMinus } from "lucide-react";
import { AdminNav } from "@/components/atlas/admin-nav";
import { EmptyCoverage, PublicPageShell } from "@/components/atlas/public-page-shell";
import { requireAdminOwner } from "@/lib/atlas/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminSubscribersPage() {
  const user = await requireAdminOwner();
  const { data: subscribers, error } = await createAdminClient()
    .from("pilot_update_signups")
    .select("id, email, status, source, consent_version, consent_text, cohort, landing_path, mailing_provider, mailing_provider_status, mailing_provider_synced_at, mailing_provider_error, created_at, updated_at")
    .order("created_at", { ascending: false });

  const rows = subscribers ?? [];
  const active = rows.filter((row) => row.status === "subscribed").length;
  const unsubscribed = rows.filter((row) => row.status === "unsubscribed").length;
  const pendingSync = rows.filter((row) => row.mailing_provider_status === "sync_failed" || (row.status === "subscribed" && !row.mailing_provider_synced_at)).length;

  return (
    <PublicPageShell variant="admin" eyebrow="Private administration" title="Update subscribers" description="See who asked to hear from True North Map. Consent remains recorded here even when delivery is handled by an external mailing service." actions={<span className="rounded bg-[#f2f4f7] px-3 py-2 text-xs font-semibold text-[#475467]">administrator · {user.email}</span>}>
      <AdminNav />
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric icon={<MailCheck className="size-5" />} label="Subscribed" value={active} />
        <Metric icon={<UserMinus className="size-5" />} label="Unsubscribed" value={unsubscribed} />
        <Metric icon={<RefreshCw className="size-5" />} label="Needs delivery sync" value={pendingSync} />
      </div>

      <div className="mt-7 flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-lg font-bold text-[var(--atlas-ink)]">Consent-backed list</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--atlas-ink-soft)]">Use MailerLite for delivery and unsubscribe links. This private ledger remains the record of what each person agreed to receive.</p></div>
        <Link href="/api/admin/subscribers" className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--atlas-border)] bg-white px-4 text-xs font-semibold text-[var(--atlas-ink)] no-underline hover:bg-[var(--atlas-signal-soft)] hover:no-underline"><Download className="size-4" />Export CSV</Link>
      </div>

      {error ? <div className="mt-4 rounded-xl border border-[#fda29b] bg-[#fff6f5] p-4 text-sm text-[#b42318]">The subscriber list could not be loaded.</div> : rows.length ? (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--atlas-border)] bg-white shadow-[var(--atlas-shadow-soft)]">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-[var(--atlas-signal-soft)] text-[var(--atlas-ink-soft)]"><tr><th className="p-3">Email</th><th className="p-3">Consent</th><th className="p-3">Source</th><th className="p-3">Delivery</th><th className="p-3">Joined</th><th className="p-3">Updated</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.id} className="border-t border-[var(--atlas-border)] align-top"><td className="p-3 font-semibold text-[var(--atlas-ink)]">{row.email}</td><td className="p-3"><Status value={row.status} /></td><td className="p-3 text-[var(--atlas-ink-soft)]">{humanize(row.source)}{row.cohort ? <span className="block">{row.cohort}</span> : null}</td><td className="p-3 text-[var(--atlas-ink-soft)]">{row.mailing_provider_status ? <Status value={row.mailing_provider_status} /> : "Not connected"}{row.mailing_provider_error ? <span className="mt-1 block max-w-xs text-[#b42318]">{row.mailing_provider_error}</span> : null}</td><td className="p-3 text-[var(--atlas-ink-soft)]">{dateTime(row.created_at)}</td><td className="p-3 text-[var(--atlas-ink-soft)]">{dateTime(row.updated_at)}</td></tr>)}</tbody>
          </table>
        </div>
      ) : <div className="mt-4"><EmptyCoverage title="No update subscribers yet" detail="New consent-backed signups will appear here." /></div>}
    </PublicPageShell>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <div className="rounded-2xl border border-[var(--atlas-border)] bg-white p-5 shadow-[var(--atlas-shadow-soft)]"><div className="flex items-center justify-between text-[var(--atlas-ink)]">{icon}<strong className="text-2xl">{value}</strong></div><p className="mt-3 text-xs font-semibold text-[var(--atlas-ink-soft)]">{label}</p></div>; }
function Status({ value }: { value: string }) { const warning = value === "unsubscribed" || value === "bounced" || value === "junk" || value === "deleted" || value === "sync_failed"; return <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${warning ? "bg-[#fff1f0] text-[#b42318]" : "bg-[#ecfdf3] text-[#027a48]"}`}>{humanize(value)}</span>; }
function humanize(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function dateTime(value: string) { return new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Halifax" }).format(new Date(value)); }
