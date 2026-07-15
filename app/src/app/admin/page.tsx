import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Database, FileSearch } from "lucide-react";
import { AdminNav } from "@/components/atlas/admin-nav";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { getAtlasSnapshot } from "@/lib/atlas/repository";
import { createClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  const user = await requireAtlasStaff("editor");
  const supabase = await createClient();
  const [snapshot, candidates, submissions, runs] = await Promise.all([
    getAtlasSnapshot(),
    supabase.from("candidate_changes").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("submissions").select("id", { count: "exact", head: true }).in("status", ["pending", "in_review"]),
    supabase.from("research_runs").select("id", { count: "exact", head: true }).in("status", ["queued", "running"])
  ]);

  return (
    <PublicPageShell eyebrow="Private editorial workspace" title="Atlas operations" description="Stage research, review field-level candidates, and monitor coverage without granting agents autonomous publication." actions={<span className="rounded bg-[#f2f4f7] px-3 py-2 text-xs font-semibold text-[#475467]">{user.role} · {user.email}</span>}>
      <AdminNav />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetric icon={<Database className="size-5" />} label="Published organizations" value={snapshot.organizations.length} />
        <AdminMetric icon={<Clock3 className="size-5" />} label="Pending candidates" value={candidates.count ?? 0} />
        <AdminMetric icon={<FileSearch className="size-5" />} label="Public submissions" value={submissions.count ?? 0} />
        <AdminMetric icon={<CheckCircle2 className="size-5" />} label="Active research runs" value={runs.count ?? 0} />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <AdminLink title="Stage a source or PDF" detail="Create a private extraction candidate with visibility and provenance intact." href="/admin/intake" />
        <AdminLink title="Review candidate changes" detail="Compare proposed and current records, then accept, reject, edit, merge, or defer." href="/admin/review" />
        <AdminLink title="Inspect coverage gaps" detail="Measure published coverage by region, domain, mission, and demand statement." href="/admin/coverage" />
      </div>
      <PublicCard title="Publication boundary" eyebrow="Human approval required" className="mt-5">
        <p className="text-sm leading-6 text-[#475467]">An accepted candidate is still not public. Promotion into canonical published tables remains a separate, explicit reviewer action with validation and audit logging.</p>
      </PublicCard>
    </PublicPageShell>
  );
}

function AdminMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="rounded-lg border border-[#d0d5dd] bg-white p-5"><div className="flex items-center justify-between text-[#0756d9]">{icon}<strong className="text-2xl text-[#101828]">{value}</strong></div><p className="mt-3 text-xs font-semibold text-[#667085]">{label}</p></div>;
}

function AdminLink({ title, detail, href }: { title: string; detail: string; href: string }) {
  return <Link href={href} className="rounded-lg border border-[#d0d5dd] bg-white p-5 no-underline hover:border-[#98a2b3] hover:no-underline"><h2 className="text-sm font-bold text-[#101828]">{title}</h2><p className="mt-2 text-xs leading-5 text-[#667085]">{detail}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0756d9]">Open <ArrowRight className="size-3.5" /></span></Link>;
}
