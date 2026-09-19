import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Database, RadioTower, Send } from "lucide-react";
import { AdminNav } from "@/components/atlas/admin-nav";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  const user = await requireAtlasStaff("editor");
  const supabase = await createClient();
  const [organizations, demandSources, candidates, approved, submissions] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact", head: true }).eq("publication_status", "published"),
    supabase.from("demand_sources").select("id", { count: "exact", head: true }).eq("publication_status", "published"),
    supabase.from("candidate_changes").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("candidate_changes").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("submissions").select("id", { count: "exact", head: true }).in("status", ["pending", "in_review"])
  ]);
  const failedMetric = [organizations, demandSources, candidates, approved, submissions].find((result) => result.error);
  if (failedMetric?.error) throw new Error(`Unable to load the admin overview: ${failedMetric.error.message}`);

  return (
    <PublicPageShell variant="admin" eyebrow="Private editorial workspace" title="True North Map operations" description="Stage research, review field-level candidates, maintain published intelligence, and monitor coverage without granting agents autonomous publication." actions={<span className="rounded bg-[var(--admin-surface-subtle)] px-3 py-2 text-xs font-semibold text-[var(--admin-muted-strong)]">{user.role} · {user.email}</span>}>
      <AdminNav />
      {(approved.count ?? 0) > 0 ? <Link href="/admin/publish" prefetch={false} className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-[var(--admin-success-border)] bg-[var(--admin-success-soft)] p-4 text-[var(--admin-success)] no-underline hover:no-underline"><span><strong className="block text-sm">{approved.count} approved {approved.count === 1 ? "record is" : "records are"} waiting at the Publication checkpoint</strong><span className="mt-1 block text-xs">Review the approved record and use the separate Publish action when you are ready.</span></span><ArrowRight className="size-5 shrink-0" /></Link> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminMetric icon={<Database className="size-5" />} label="Published organizations" value={organizations.count ?? 0} href="/admin/organizations" />
        <AdminMetric icon={<RadioTower className="size-5" />} label="Published demand signals" value={demandSources.count ?? 0} href="/admin/demand-signals" />
        <AdminMetric icon={<Clock3 className="size-5" />} label="Pending candidates" value={candidates.count ?? 0} href="/admin/review" />
        <AdminMetric icon={<CheckCircle2 className="size-5" />} label="Ready to publish" value={approved.count ?? 0} href="/admin/publish" />
        <AdminMetric icon={<Send className="size-5" />} label="Public submissions" value={submissions.count ?? 0} href="/admin/submissions" />
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <AdminLink title="Stage a source or PDF" detail="Create a private extraction candidate with visibility and provenance intact." href="/admin/intake" />
        <AdminLink title="Review candidate changes" detail="Compare proposed and current records, then accept, reject, edit, merge, or defer." href="/admin/review" />
        <AdminLink title="Publish approved records" detail="Run final validation and publish every approved record with one explicit action." href="/admin/publish" />
        <AdminLink title="Review public submissions" detail="Assess claims, corrections, and suggested organizations without implying that approval publishes a record." href="/admin/submissions" />
        <AdminLink title="Manage organizations" detail="Edit a published organization, its primary location, and its capability profile." href="/admin/organizations" />
        <AdminLink title="Manage demand signals" detail="Add or update public problem statements while preserving every linked technology match." href="/admin/demand-signals" />
        <AdminLink title="Find potential demand matches" detail="Compare reviewed technologies with public problem statements, then publish only the connections you can defend." href="/admin/demand-matches" />
        <AdminLink title="Manage defence briefs" detail="Create answer-first, source-backed pages and publish only after explicit editorial review." href="/admin/briefs" />
        <AdminLink title="Review update subscribers" detail="See who asked to hear from True North Map and export the consent-backed list." href="/admin/subscribers" />
        <AdminLink title="Inspect coverage gaps" detail="Measure published coverage by region, domain, mission, and demand statement." href="/admin/coverage" />
      </div>
      <PublicCard title="Publication boundary" eyebrow="Human approval required" className="mt-5">
        <p className="text-sm leading-6 text-[var(--admin-muted-strong)]">An accepted candidate is still not public. Promotion into canonical organization or demand tables remains a separate, explicit reviewer action with validation and audit logging. Once publication succeeds, no redeploy is required.</p>
      </PublicCard>
    </PublicPageShell>
  );
}

function AdminMetric({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: number; href?: string }) {
  const content = <><div className="flex items-center justify-between text-[var(--admin-action)]">{icon}<strong className="text-2xl text-[var(--admin-ink)]">{value}</strong></div><p className="mt-3 text-xs font-semibold text-[var(--admin-muted)]">{label}</p></>;
  return href
    ? <Link href={href} prefetch={false} className="rounded-lg border border-[var(--admin-border)] bg-white p-5 no-underline hover:border-[var(--admin-border-strong)] hover:no-underline">{content}</Link>
    : <div className="rounded-lg border border-[var(--admin-border)] bg-white p-5">{content}</div>;
}

function AdminLink({ title, detail, href }: { title: string; detail: string; href: string }) {
  return <Link href={href} prefetch={false} className="rounded-lg border border-[var(--admin-border)] bg-white p-5 no-underline hover:border-[var(--admin-border-strong)] hover:no-underline"><h2 className="text-sm font-bold text-[var(--admin-ink)]">{title}</h2><p className="mt-2 text-xs leading-5 text-[var(--admin-muted)]">{detail}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--admin-action)]">Open <ArrowRight className="size-3.5" /></span></Link>;
}
