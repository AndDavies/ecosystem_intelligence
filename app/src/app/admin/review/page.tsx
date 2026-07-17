import { AdminNav } from "@/components/atlas/admin-nav";
import { EmptyCoverage, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { editAtlasCandidate, mergeAtlasCandidate, reviewAtlasCandidate } from "@/lib/actions/atlas-admin";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { parseAtlasOrganizationCandidate, type AtlasOrganizationCandidate } from "@/lib/atlas/candidate-schema";
import { createClient } from "@/lib/supabase/server";

type CandidateRow = {
  id: string;
  candidate_kind: string;
  target_entity_type: string | null;
  proposed_record: unknown;
  before_record: unknown;
  field_evidence: unknown;
  duplicate_check: unknown;
  confidence: string;
  status: string;
  created_at: string;
};

const errorMessages: Record<string, string> = {
  "invalid-review": "That review decision is no longer valid.",
  "invalid-candidate": "The candidate is missing required publication fields.",
  "duplicate-unresolved": "Resolve the possible duplicate before accepting this candidate.",
  "invalid-edit": "The edited candidate contains invalid or incomplete fields.",
  "edit-failed": "The edited candidate could not be saved.",
  "invalid-merge": "Select a valid canonical organization before merging.",
  "merge-failed": "The duplicate resolution could not be saved.",
  "review-failed": "The review decision could not be recorded."
};

export default async function AdminReviewPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  await requireAtlasStaff("reviewer");
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: candidates }, { data: domains }, { data: clusters }, { data: missionAreas }] = await Promise.all([
    supabase.from("candidate_changes").select("id, candidate_kind, target_entity_type, proposed_record, before_record, field_evidence, duplicate_check, confidence, status, created_at").eq("status", "pending").order("created_at").limit(50),
    supabase.from("technical_domains").select("slug, name").eq("publication_status", "published").order("name"),
    supabase.from("ecosystem_clusters").select("slug, name").eq("publication_status", "published").order("name"),
    supabase.from("mission_areas").select("slug, name").eq("publication_status", "published").order("name")
  ]);

  return (
    <PublicPageShell eyebrow="Editorial operations" title="Review queue" description="Inspect and edit staged research. Accepting a candidate moves it to the publication checkpoint; it does not make the record public." backHref="/admin" backLabel="Atlas operations">
      <AdminNav />
      {params.error ? <div className="mb-5 rounded-md border border-[#fda29b] bg-[#fff6f5] px-3 py-2 text-sm text-[#b42318]">{errorMessages[params.error] ?? "The review action could not be completed."}</div> : null}
      {params.success ? <div className="mb-5 rounded-md border border-[#a6f4c5] bg-[#f6fef9] px-3 py-2 text-sm text-[#067647]">Candidate {params.success === "merged" ? "merged into its canonical organization" : "updated"}. Publication remains unchanged.</div> : null}
      {candidates?.length ? (
        <div className="space-y-5">
          {(candidates as CandidateRow[]).map((candidate) => {
            const parsed = candidate.candidate_kind === "organization_bundle"
              ? parseAtlasOrganizationCandidate(candidate.proposed_record)
              : null;
            return parsed?.success ? (
              <OrganizationCandidateCard key={candidate.id} candidate={candidate} record={parsed.data} domains={domains ?? []} clusters={clusters ?? []} missionAreas={missionAreas ?? []} />
            ) : (
              <GenericCandidateCard key={candidate.id} candidate={candidate} />
            );
          })}
        </div>
      ) : <EmptyCoverage title="Review queue is clear" detail="New source extractions, research candidates, and public submissions appear here after they are staged." />}
    </PublicPageShell>
  );
}

function OrganizationCandidateCard({
  candidate,
  record,
  domains,
  clusters,
  missionAreas
}: {
  candidate: CandidateRow;
  record: AtlasOrganizationCandidate;
  domains: Array<{ slug: string; name: string }>;
  clusters: Array<{ slug: string; name: string }>;
  missionAreas: Array<{ slug: string; name: string }>;
}) {
  const duplicateCheck = candidate.duplicate_check as { status?: string; matches?: Array<{ id: string; name: string; slug: string }> } | null;
  const matches = duplicateCheck?.matches ?? [];
  const fieldClass = "h-10 rounded-md border border-[#d0d5dd] bg-white px-3 text-sm font-normal outline-none focus:border-[#0756d9]";
  const areaClass = "rounded-md border border-[#d0d5dd] bg-white px-3 py-2 text-sm font-normal leading-6 outline-none focus:border-[#0756d9]";

  return (
    <PublicCard title={record.name} eyebrow={`${candidate.confidence} evidence confidence · ${record.capability.name}`}>
      <div className="grid gap-4 md:grid-cols-3">
        <ReviewFact label="Location" value={`${record.city}, ${record.provinceTerritory}`} />
        <ReviewFact label="Primary domain" value={domains.find((domain) => domain.slug === record.capability.technicalDomainSlug)?.name ?? record.capability.technicalDomainSlug} />
        <ReviewFact label="Duplicate check" value={duplicateCheck?.status === "possible_match" ? "Possible match—resolution required" : "No likely duplicate found"} tone={duplicateCheck?.status === "possible_match" ? "warning" : "success"} />
      </div>
      <p className="mt-4 text-sm leading-6 text-[#475467]">{record.description}</p>
      <div className="mt-4 rounded-md border border-[#d0d5dd] bg-[#f8fafc] p-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-[#344054]">Capability candidate</h3>
        <p className="mt-2 text-sm font-semibold text-[#101828]">{record.capability.name}</p>
        <p className="mt-1 text-xs leading-5 text-[#667085]">{record.capability.summary}</p>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#667085]">{record.capability.tags.join(" · ")}</p>
      </div>
      {record.capability.missionMatches.length ? (
        <div className="mt-4 rounded-md border border-[#b8dfe5] bg-[#f5fcfd] p-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-[#007f98]">Analyst assessments to review</h3>
          <div className="mt-3 space-y-3">
            {record.capability.missionMatches.map((match) => (
              <div key={match.missionAreaSlug}>
                <p className="text-xs font-bold text-[#101828]">{missionAreas.find((mission) => mission.slug === match.missionAreaSlug)?.name ?? match.missionAreaSlug} · {match.confidence} confidence</p>
                <p className="mt-1 text-xs leading-5 text-[#475467]">{match.alignmentSummary}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <a href={record.source.url} target="_blank" rel="noreferrer" className="mt-4 block rounded-md border border-[#b8dfe5] bg-[#f5fcfd] p-4 no-underline hover:border-[#007f98] hover:no-underline">
        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#007f98]">Primary source</span>
        <strong className="mt-1 block text-sm text-[#101828]">{record.source.title}</strong>
        <span className="mt-1 block text-xs leading-5 text-[#667085]">{record.source.publisher} · {record.source.excerpt}</span>
      </a>

      {matches.length ? (
        <form action={mergeAtlasCandidate} className="mt-4 rounded-md border border-[#fec84b] bg-[#fffaeb] p-4">
          <input type="hidden" name="candidateId" value={candidate.id} />
          <p className="text-xs font-bold text-[#93370d]">Possible duplicate</p>
          <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1.5fr_auto] lg:items-end">
            <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">Canonical organization
              <select name="canonicalOrganizationId" required className={fieldClass} defaultValue="">
                <option value="" disabled>Select organization</option>
                {matches.map((match) => <option key={match.id} value={match.id}>{match.name}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">Merge rationale
              <input name="rationale" required minLength={3} maxLength={2000} className={fieldClass} placeholder="Why these records represent the same organization" />
            </label>
            <button className="h-10 rounded-md border border-[#dc6803] bg-white px-4 text-xs font-semibold text-[#b54708]">Merge candidate</button>
          </div>
        </form>
      ) : null}

      <details className="mt-4 rounded-md border border-[#d0d5dd] bg-[#fcfcfd] p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[#344054]">Edit fields before review</summary>
        <form action={editAtlasCandidate} className="mt-4 grid gap-4">
          <input type="hidden" name="candidateId" value={candidate.id} />
          <div className="grid gap-4 md:grid-cols-2">
            <EditField label="Organization name"><input name="name" required defaultValue={record.name} className={fieldClass} /></EditField>
            <EditField label="Website"><input name="websiteUrl" type="url" required defaultValue={record.websiteUrl} className={fieldClass} /></EditField>
          </div>
          <EditField label="Organization description"><textarea name="description" required minLength={40} rows={3} defaultValue={record.description} className={areaClass} /></EditField>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <EditField label="City"><input name="city" required defaultValue={record.city} className={fieldClass} /></EditField>
            <EditField label="Province or territory"><input name="provinceTerritory" required defaultValue={record.provinceTerritory} className={fieldClass} /></EditField>
            <EditField label="Latitude"><input name="latitude" type="number" step="any" required defaultValue={record.latitude} className={fieldClass} /></EditField>
            <EditField label="Longitude"><input name="longitude" type="number" step="any" required defaultValue={record.longitude} className={fieldClass} /></EditField>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <EditField label="Evidence confidence"><select name="confidence" defaultValue={record.confidence} className={fieldClass}><option value="high">High</option><option value="moderate">Moderate</option></select></EditField>
            <EditField label="Capability name"><input name="capabilityName" required defaultValue={record.capability.name} className={fieldClass} /></EditField>
            <EditField label="Capability type"><input name="capabilityType" required defaultValue={record.capability.type} className={fieldClass} /></EditField>
          </div>
          <EditField label="Capability summary"><textarea name="capabilitySummary" required minLength={40} rows={3} defaultValue={record.capability.summary} className={areaClass} /></EditField>
          <div className="grid gap-4 md:grid-cols-3">
            <EditField label="Core features"><textarea name="features" required rows={4} defaultValue={record.capability.features.join("\n")} className={areaClass} /><span className="text-[10px] font-normal text-[#667085]">One item per line.</span></EditField>
            <EditField label="Applications"><textarea name="applications" required rows={4} defaultValue={record.capability.applications.join("\n")} className={areaClass} /><span className="text-[10px] font-normal text-[#667085]">One item per line.</span></EditField>
            <EditField label="Technical tags"><textarea name="tags" required rows={4} defaultValue={record.capability.tags.join("\n")} className={areaClass} /><span className="text-[10px] font-normal text-[#667085]">One item per line.</span></EditField>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <EditField label="Primary technical domain"><select name="technicalDomainSlug" required defaultValue={record.capability.technicalDomainSlug} className={fieldClass}>{domains.map((domain) => <option key={domain.slug} value={domain.slug}>{domain.name}</option>)}</select></EditField>
            <EditField label="Additional domain slugs"><input name="additionalTechnicalDomainSlugs" defaultValue={record.capability.additionalTechnicalDomainSlugs.join(", ")} className={fieldClass} /></EditField>
            <EditField label="Ecosystem cluster"><select name="clusterSlug" defaultValue={record.capability.clusterSlug ?? ""} className={fieldClass}><option value="">No cluster</option>{clusters.map((cluster) => <option key={cluster.slug} value={cluster.slug}>{cluster.name}</option>)}</select></EditField>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <EditField label="Source title"><input name="sourceTitle" required defaultValue={record.source.title} className={fieldClass} /></EditField>
            <EditField label="Source publisher"><input name="sourcePublisher" required defaultValue={record.source.publisher} className={fieldClass} /></EditField>
            <EditField label="Source URL"><input name="sourceUrl" type="url" required defaultValue={record.source.url} className={fieldClass} /></EditField>
          </div>
          <EditField label="Evidence summary"><textarea name="sourceExcerpt" required minLength={30} rows={3} defaultValue={record.source.excerpt} className={areaClass} /></EditField>
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <EditField label="Edit rationale"><input name="rationale" required minLength={3} maxLength={2000} className={fieldClass} placeholder="What changed and why" /></EditField>
            <button className="h-10 rounded-md border border-[#0756d9] bg-white px-4 text-xs font-semibold text-[#0756d9]">Save edits</button>
          </div>
        </form>
      </details>

      <form action={reviewAtlasCandidate} className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-end">
        <input type="hidden" name="candidateId" value={candidate.id} />
        <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">Reviewer rationale<textarea name="rationale" required minLength={3} maxLength={2000} rows={2} className={areaClass} /></label>
        <button name="decision" value="defer" className="h-10 rounded-md border border-[#d0d5dd] bg-white px-4 text-xs font-semibold text-[#475467]">Defer</button>
        <button name="decision" value="reject" className="h-10 rounded-md border border-[#fda29b] bg-white px-4 text-xs font-semibold text-[#b42318]">Reject</button>
        <button name="decision" value="accept" disabled={matches.length > 0} className="h-10 rounded-md bg-[#0756d9] px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#98a2b3]">Accept for publication</button>
      </form>
    </PublicCard>
  );
}

function GenericCandidateCard({ candidate }: { candidate: CandidateRow }) {
  return (
    <PublicCard title={candidate.candidate_kind.replaceAll("_", " ")} eyebrow={`${candidate.confidence} confidence · ${candidate.target_entity_type ?? "new candidate"}`}>
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
  );
}

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">{label}{children}</label>;
}

function ReviewFact({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "warning" }) {
  const toneClass = tone === "success" ? "text-[#067647]" : tone === "warning" ? "text-[#b54708]" : "text-[#344054]";
  return <div className="rounded-md border border-[#eaecf0] bg-[#fcfcfd] p-3"><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#667085]">{label}</p><p className={`mt-1 text-xs font-semibold ${toneClass}`}>{value}</p></div>;
}

function JsonPanel({ label, value, empty }: { label: string; value: unknown; empty?: string }) {
  return <section><h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#667085]">{label}</h3>{value ? <pre className="mt-2 max-h-80 overflow-auto rounded-md border border-[#d0d5dd] bg-[#fcfcfd] p-3 text-[11px] leading-5 text-[#344054]">{JSON.stringify(value, null, 2)}</pre> : <div className="mt-2 rounded-md border border-dashed border-[#d0d5dd] p-4 text-xs text-[#667085]">{empty ?? "No value"}</div>}</section>;
}
