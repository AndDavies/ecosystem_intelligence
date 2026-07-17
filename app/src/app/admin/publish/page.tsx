import { AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { AdminNav } from "@/components/atlas/admin-nav";
import { EmptyCoverage, PublicPageShell } from "@/components/atlas/public-page-shell";
import { publishApprovedCandidates } from "@/lib/actions/atlas-admin";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { parseAtlasOrganizationCandidate } from "@/lib/atlas/candidate-schema";
import { createClient } from "@/lib/supabase/server";

type ApprovedRow = {
  id: string;
  candidate_kind: string;
  proposed_record: unknown;
  duplicate_check: unknown;
  confidence: string;
  updated_at: string;
};

const errorMessages: Record<string, string> = {
  confirmation: "Select at least one record and type the exact confirmation shown below.",
  "publication-failed": "Publication was stopped. No selected record was published. Recheck the approved records and try again."
};

export default async function AdminPublishPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  await requireAtlasStaff("reviewer");
  const params = await searchParams;
  const database = await createClient();
  const { data } = await database
    .from("candidate_changes")
    .select("id, candidate_kind, proposed_record, duplicate_check, confidence, updated_at")
    .eq("status", "approved")
    .eq("candidate_kind", "organization_bundle")
    .order("updated_at")
    .limit(50);
  const rows = ((data ?? []) as ApprovedRow[])
    .map((candidate) => ({ candidate, parsed: parseAtlasOrganizationCandidate(candidate.proposed_record) }))
    .filter((item) => item.parsed.success);

  return (
    <PublicPageShell eyebrow="Editorial operations" title="Publication checkpoint" description="This is the final public-data change. Select only fully reviewed records; publication runs as one transaction and stops entirely if any selected record fails validation." backHref="/admin" backLabel="Atlas operations">
      <AdminNav />
      {params.error ? <div className="mb-5 rounded-md border border-[#fda29b] bg-[#fff6f5] px-3 py-2 text-sm text-[#b42318]">{errorMessages[params.error] ?? "Publication could not be completed."}</div> : null}
      {params.success ? <div className="mb-5 rounded-md border border-[#a6f4c5] bg-[#f6fef9] px-3 py-2 text-sm text-[#067647]">Published {params.success} reviewed organization {params.success === "1" ? "dossier" : "dossiers"} and refreshed the public atlas.</div> : null}
      {rows.length ? (
        <form action={publishApprovedCandidates}>
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-[#fec84b] bg-[#fffaeb] p-4 text-sm leading-6 text-[#7a2e0e]">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <p><strong>{rows.length} approved {rows.length === 1 ? "record is" : "records are"} ready.</strong> Publishing creates the public organization, location, capability, domain links, mission alignment, source, evidence, and citations. It does not send messages or introductions.</p>
          </div>
          <div className="space-y-3">
            {rows.map(({ candidate, parsed }) => {
              if (!parsed.success) return null;
              const record = parsed.data;
              const duplicateCheck = candidate.duplicate_check as { status?: string } | null;
              return (
                <label key={candidate.id} className="grid cursor-pointer gap-3 rounded-lg border border-[#d0d5dd] bg-white p-4 hover:border-[#98a2b3] md:grid-cols-[auto_1fr_auto] md:items-start">
                  <input type="checkbox" name="candidateId" value={candidate.id} defaultChecked className="mt-1 size-4 accent-[#0756d9]" />
                  <span>
                    <span className="block text-sm font-bold text-[#101828]">{record.name}</span>
                    <span className="mt-1 block text-xs leading-5 text-[#667085]">{record.city}, {record.provinceTerritory} · {record.capability.name}</span>
                    <span className="mt-2 block text-xs leading-5 text-[#475467]">{record.description}</span>
                    <a href={record.source.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#0756d9]">Review source <ExternalLink className="size-3" /></a>
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#067647]"><CheckCircle2 className="size-4" />{candidate.confidence} confidence · {duplicateCheck?.status === "clear" ? "duplicate check clear" : "duplicate resolved"}</span>
                </label>
              );
            })}
          </div>
          <div className="mt-5 rounded-lg border border-[#d0d5dd] bg-[#f8fafc] p-5">
            <label className="grid max-w-xl gap-2 text-sm font-semibold text-[#344054]">
              Type <code className="w-fit rounded bg-white px-2 py-1 text-[#b42318]">PUBLISH {rows.length}</code> to publish all currently selected records
              <input name="confirmation" required autoComplete="off" className="h-11 rounded-md border border-[#98a2b3] bg-white px-3 text-sm font-normal outline-none focus:border-[#0756d9]" />
            </label>
            <p className="mt-2 text-xs leading-5 text-[#667085]">If you deselect records, change the number to match the selected count. The system rejects any mismatch.</p>
            <button className="mt-4 h-11 rounded-md bg-[#b42318] px-5 text-sm font-semibold text-white hover:bg-[#912018]">Publish selected records</button>
          </div>
        </form>
      ) : <EmptyCoverage title="No records are ready to publish" detail="Accept fully reviewed organization candidates in the review queue. They will then appear here for a separate publication decision." />}
    </PublicPageShell>
  );
}
