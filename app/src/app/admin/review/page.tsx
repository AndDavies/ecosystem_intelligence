import { AdminNav } from "@/components/atlas/admin-nav";
import { EmptyCoverage, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { reviewAtlasCandidate } from "@/lib/actions/atlas-admin";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminReviewPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAtlasStaff("reviewer");
  const params = await searchParams;
  const supabase = await createClient();
  const { data: candidates } = await supabase.from("candidate_changes").select("id, candidate_kind, target_entity_type, proposed_record, before_record, field_evidence, duplicate_check, confidence, status, created_at").eq("status", "pending").order("created_at").limit(50);
  return (
    <PublicPageShell eyebrow="Editorial operations" title="Review queue" description="Inspect proposed changes beside current values. Accepting a candidate does not publish it." backHref="/admin" backLabel="Atlas operations">
      <AdminNav />
      {params.error ? <div className="mb-5 rounded-md border border-[#fda29b] bg-[#fff6f5] px-3 py-2 text-sm text-[#b42318]">The review decision could not be recorded.</div> : null}
      {candidates?.length ? <div className="space-y-5">{candidates.map((candidate) => (
        <PublicCard key={candidate.id} title={String(candidate.candidate_kind).replaceAll("_", " ")} eyebrow={`${candidate.confidence} confidence · ${candidate.target_entity_type ?? "new candidate"}`}>
          <div className="grid gap-4 lg:grid-cols-2">
            <JsonPanel label="Current record" value={candidate.before_record} empty="New record; no current canonical value." />
            <JsonPanel label="Proposed record" value={candidate.proposed_record} />
          </div>
          <details className="mt-4 rounded-md border border-[#d0d5dd] bg-[#f8fafc] p-3 text-xs"><summary className="cursor-pointer font-semibold text-[#344054]">Evidence and duplicate checks</summary><pre className="mt-3 overflow-auto whitespace-pre-wrap text-[11px] leading-5 text-[#475467]">{JSON.stringify({ fieldEvidence: candidate.field_evidence, duplicateCheck: candidate.duplicate_check }, null, 2)}</pre></details>
          <form action={reviewAtlasCandidate} className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-end">
            <input type="hidden" name="candidateId" value={candidate.id} />
            <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">Reviewer rationale<textarea name="rationale" required minLength={3} maxLength={2000} rows={2} className="rounded-md border border-[#d0d5dd] px-3 py-2 text-sm font-normal outline-none focus:border-[#0756d9]" /></label>
            <button name="decision" value="defer" className="h-10 rounded-md border border-[#d0d5dd] bg-white px-4 text-xs font-semibold text-[#475467]">Defer</button>
            <button name="decision" value="reject" className="h-10 rounded-md border border-[#fda29b] bg-white px-4 text-xs font-semibold text-[#b42318]">Reject</button>
            <button name="decision" value="accept" className="h-10 rounded-md bg-[#0756d9] px-4 text-xs font-semibold text-white">Accept candidate</button>
          </form>
        </PublicCard>
      ))}</div> : <EmptyCoverage title="Review queue is clear" detail="New URL/PDF extractions, research-agent candidates, and public submissions will appear here after staging." />}
    </PublicPageShell>
  );
}

function JsonPanel({ label, value, empty }: { label: string; value: unknown; empty?: string }) {
  return <section><h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#667085]">{label}</h3>{value ? <pre className="mt-2 max-h-80 overflow-auto rounded-md border border-[#d0d5dd] bg-[#fcfcfd] p-3 text-[11px] leading-5 text-[#344054]">{JSON.stringify(value, null, 2)}</pre> : <div className="mt-2 rounded-md border border-dashed border-[#d0d5dd] p-4 text-xs text-[#667085]">{empty ?? "No value"}</div>}</section>;
}
