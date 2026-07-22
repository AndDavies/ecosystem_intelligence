import Link from "next/link";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import { AdminNav } from "@/components/atlas/admin-nav";
import { EmptyCoverage, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { PendingButton } from "@/components/ui/pending-button";
import { editAtlasCandidate, editTypedResearchCandidate, mergeAtlasCandidate, publishDemandMatchCandidate, reviewAtlasCandidate } from "@/lib/actions/atlas-admin";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { parseAtlasOrganizationCandidate, parseDemandMatchCandidate, parseDemandSignalCandidate, parseOrganizationBundleV2, type AtlasOrganizationCandidate, type DemandMatchCandidate } from "@/lib/atlas/candidate-schema";
import type { DemandSignalBundleV1, OrganizationBundleV2 } from "@/lib/research/pipeline-schema";
import { createClient } from "@/lib/supabase/server";

type CandidateRow = {
  id: string;
  candidate_kind: string;
  target_entity_type: string | null;
  proposed_record: unknown;
  before_record: unknown;
  field_evidence: unknown;
  duplicate_check: unknown;
  reviewer_rationale: string | null;
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
  "review-failed": "The review decision could not be recorded.",
  "invalid-demand-match": "Explain why this technology-to-demand match is useful and defensible before publishing it.",
  "demand-match-publication-failed": "The match was not published. Refresh the queue and confirm that the technology, public demand statement, and candidate are still current."
};

export default async function AdminReviewPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  await requireAtlasStaff("reviewer");
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: candidates }, { data: domains }, { data: clusters }, { data: missionAreas }] = await Promise.all([
    supabase.from("candidate_changes").select("id, candidate_kind, target_entity_type, proposed_record, before_record, field_evidence, duplicate_check, reviewer_rationale, confidence, status, created_at").eq("status", "pending").order("created_at").limit(50),
    supabase.from("technical_domains").select("slug, name").eq("publication_status", "published").order("name"),
    supabase.from("ecosystem_clusters").select("slug, name").eq("publication_status", "published").order("name"),
    supabase.from("mission_areas").select("slug, name").eq("publication_status", "published").order("name")
  ]);
  const candidateRows = (candidates ?? []) as CandidateRow[];
  const organizationCandidateCount = candidateRows.filter((candidate) => candidate.candidate_kind === "organization_bundle").length;
  const demandCandidateCount = candidateRows.filter((candidate) => candidate.candidate_kind === "demand_signal_bundle").length;
  const demandMatchCandidateCount = candidateRows.filter((candidate) => candidate.candidate_kind === "demand_match_bundle").length;

  return (
    <PublicPageShell variant="admin" eyebrow="Editorial operations" title="Review queue" description="Inspect and edit staged research. Accepting a candidate moves it to the publication checkpoint; it does not make the record public." backHref="/admin" backLabel="Atlas operations">
      <AdminNav />
      {params.error ? <div className="mb-5 rounded-md border border-[#fda29b] bg-[#fff6f5] px-3 py-2 text-sm text-[#b42318]">{errorMessages[params.error] ?? "The review action could not be completed."}</div> : null}
      {params.success ? <div className="mb-5 rounded-md border border-[#a6f4c5] bg-[#f6fef9] px-3 py-2 text-sm text-[#067647]">{params.success === "demand-match-published" ? "Technology-to-demand match published and public profiles refreshed." : `Candidate ${params.success === "merged" ? "merged into its canonical organization" : "updated"}. Publication remains unchanged.`}</div> : null}
      {candidateRows.length ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <QueueTypeSummary label="Organization candidates" value={organizationCandidateCount} detail="Companies, accelerators, incubators, investors, research centres, and ecosystem organizations." tone="organization" />
            <QueueTypeSummary label="Demand-signal candidates" value={demandCandidateCount} detail="Public problem statements from governments, armed forces, programs, procurement bodies, and allies." tone="demand" />
            <QueueTypeSummary label="Potential matches" value={demandMatchCandidateCount} detail="Private suggestions connecting reviewed technologies to public demand statements. Each requires an explicit publication decision." tone="match" />
          </div>
          {candidateRows.map((candidate) => {
            const legacy = candidate.candidate_kind === "organization_bundle"
              ? parseAtlasOrganizationCandidate(candidate.proposed_record)
              : null;
            const typed = candidate.candidate_kind === "organization_bundle"
              ? parseOrganizationBundleV2(candidate.proposed_record)
              : null;
            const demand = candidate.candidate_kind === "demand_signal_bundle"
              ? parseDemandSignalCandidate(candidate.proposed_record)
              : null;
            const demandMatch = candidate.candidate_kind === "demand_match_bundle"
              ? parseDemandMatchCandidate(candidate.proposed_record)
              : null;
            return legacy?.success ? (
              <OrganizationCandidateCard key={candidate.id} candidate={candidate} record={legacy.data} domains={domains ?? []} clusters={clusters ?? []} missionAreas={missionAreas ?? []} />
            ) : typed?.success ? (
              <TypedOrganizationCandidateCard key={candidate.id} candidate={candidate} record={typed.data} domains={domains ?? []} missionAreas={missionAreas ?? []} />
            ) : demand?.success ? (
              <DemandSignalCandidateCard key={candidate.id} candidate={candidate} record={demand.data} />
            ) : demandMatch?.success ? (
              <DemandMatchCandidateCard key={candidate.id} candidate={candidate} record={demandMatch.data} />
            ) : (
              <GenericCandidateCard key={candidate.id} candidate={candidate} />
            );
          })}
        </div>
      ) : <EmptyCoverage title="Review queue is clear" detail="New source extractions, research candidates, and public submissions appear here after they are staged." />}
    </PublicPageShell>
  );
}

function DemandMatchCandidateCard({ candidate, record }: { candidate: CandidateRow; record: DemandMatchCandidate }) {
  const areaClass = "rounded-md border border-[#d0d5dd] bg-white px-3 py-2 text-sm font-normal leading-6 outline-none focus:border-[#0756d9]";
  return (
    <PublicCard title={`${record.organizationName} → ${record.demandTitle}`} eyebrow="Potential technology-to-demand match · private until you publish it">
      <div className="grid gap-4 md:grid-cols-3">
        <ReviewFact label="Technology" value={record.capabilityName} />
        <ReviewFact label="Public demand statement" value={record.demandTitle} />
        <ReviewFact label="Current status" value="Needs human review" tone="warning" />
      </div>
      <div className="mt-4 rounded-md border border-[#b8dfe5] bg-[#f5fcfd] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#007f98]">What the system noticed</p>
        <p className="mt-2 text-sm leading-6 text-[#344054]">{record.alignmentSummary}</p>
        <div className="mt-3 flex flex-wrap gap-2">{record.matchedConcepts.map((concept) => <span key={concept} className="rounded-full border border-[#b8dfe5] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#007f98]">{concept}</span>)}</div>
      </div>
      <p className="mt-4 text-xs leading-5 text-[#667085]">{record.rationale}</p>
      <ReviewerRationale rationale={candidate.reviewer_rationale ?? record.reviewerRationale} />
      <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
        <Link href={`/capabilities/${record.capabilitySlug}`} target="_blank" className="text-[#0756d9]">Review technology profile</Link>
        <Link href={`/demand/${record.demandSlug}`} target="_blank" className="text-[#0756d9]">Review public demand statement</Link>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-end">
        <form action={publishDemandMatchCandidate} className="contents">
          <input type="hidden" name="candidateId" value={candidate.id} />
          <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">Why this match should be public<textarea name="rationale" required minLength={20} maxLength={2000} rows={3} className={areaClass} placeholder="Explain the source-backed, decision-useful connection and any caveat a user should understand." /></label>
          <PendingButton unstyled type="submit" pendingLabel="Publishing…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0756d9] px-4 text-xs font-semibold text-white">Publish match</PendingButton>
        </form>
        <form action={reviewAtlasCandidate} className="contents">
          <input type="hidden" name="candidateId" value={candidate.id} />
          <input type="hidden" name="rationale" value="Potential relationship requires more source review before any public assessment." />
          <PendingButton unstyled type="submit" name="decision" value="defer" pendingLabel="Deferring…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-4 text-xs font-semibold text-[#475467]">Defer</PendingButton>
          <PendingButton unstyled type="submit" name="decision" value="reject" pendingLabel="Rejecting…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#fda29b] bg-white px-4 text-xs font-semibold text-[#b42318]">Reject</PendingButton>
        </form>
      </div>
      <p className="mt-3 text-[11px] leading-5 text-[#7a2e0e]">Publishing labels this as our reviewed interpretation. It does not imply procurement eligibility, endorsement, or classified demand.</p>
    </PublicCard>
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
    <PublicCard title={record.name} eyebrow={`Organization candidate · ${candidate.confidence} evidence confidence · ${record.capability.name}`}>
      <div className="grid gap-4 md:grid-cols-3">
        <ReviewFact label="Location" value={`${record.city}, ${record.provinceTerritory}`} />
        <ReviewFact label="Primary domain" value={domains.find((domain) => domain.slug === record.capability.technicalDomainSlug)?.name ?? record.capability.technicalDomainSlug} />
        <ReviewFact label="Duplicate check" value={duplicateCheck?.status === "possible_match" ? "Possible match; resolution required" : "No likely duplicate found"} tone={duplicateCheck?.status === "possible_match" ? "warning" : "success"} />
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
            <PendingButton unstyled type="submit" pendingLabel="Merging…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#dc6803] bg-white px-4 text-xs font-semibold text-[#b54708]">Merge candidate</PendingButton>
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
            <PendingButton unstyled type="submit" pendingLabel="Saving…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#0756d9] bg-white px-4 text-xs font-semibold text-[#0756d9]">Save edits</PendingButton>
          </div>
        </form>
      </details>

      <form action={reviewAtlasCandidate} className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-end">
        <input type="hidden" name="candidateId" value={candidate.id} />
        <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">Reviewer rationale<textarea name="rationale" required minLength={3} maxLength={2000} rows={2} className={areaClass} /></label>
        <PendingButton unstyled type="submit" name="decision" value="defer" pendingLabel="Deferring…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-4 text-xs font-semibold text-[#475467]">Defer</PendingButton>
        <PendingButton unstyled type="submit" name="decision" value="reject" pendingLabel="Rejecting…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#fda29b] bg-white px-4 text-xs font-semibold text-[#b42318]">Reject</PendingButton>
        <PendingButton unstyled type="submit" name="decision" value="accept" pendingLabel="Accepting…" disabled={matches.length > 0} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0756d9] px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#98a2b3]">Accept for publication</PendingButton>
      </form>
    </PublicCard>
  );
}

function TypedOrganizationCandidateCard({
  candidate,
  record,
  domains,
  missionAreas
}: {
  candidate: CandidateRow;
  record: OrganizationBundleV2;
  domains: Array<{ slug: string; name: string }>;
  missionAreas: Array<{ slug: string; name: string }>;
}) {
  const duplicateCheck = candidate.duplicate_check as { status?: string } | null;
  const location = record.organization.primaryLocation;
  const locationLabel = [location.city, location.provinceTerritory, location.countryCode].filter(Boolean).join(", ");
  const areaClass = "rounded-md border border-[#d0d5dd] bg-white px-3 py-2 text-sm font-normal leading-6 outline-none focus:border-[#0756d9]";
  const roleLabel = record.organization.entityKind.replaceAll("_", " ");

  return (
    <PublicCard title={record.organization.name} eyebrow={`Organization candidate · ${candidate.confidence} evidence confidence · ${roleLabel}`}>
      <div className="grid gap-4 md:grid-cols-3">
        <ReviewFact label="Organization type" value={roleLabel} />
        <ReviewFact label="Location" value={locationLabel || "Canada · location not yet resolved"} />
        <ReviewFact label="Duplicate check" value={duplicateCheck?.status === "clear" ? "No likely duplicate found" : "Resolution required"} tone={duplicateCheck?.status === "clear" ? "success" : "warning"} />
      </div>
      <p className="mt-4 text-sm leading-6 text-[#475467]">{record.organization.description}</p>
      <ReviewerRationale rationale={candidate.reviewer_rationale ?? record.reviewerRationale} />

      {record.capabilities.map((capability) => (
        <div key={capability.slug} className="mt-4 rounded-md border border-[#d0d5dd] bg-[#f8fafc] p-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-[#344054]">Capability candidate</h3>
          <p className="mt-2 text-sm font-semibold text-[#101828]">{capability.name}</p>
          <p className="mt-1 text-xs leading-5 text-[#667085]">{capability.summary}</p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#667085]">{capability.technicalDomainSlugs.map((slug) => domains.find((domain) => domain.slug === slug)?.name ?? slug).join(" · ")}</p>
          {capability.missionMatches.length ? <div className="mt-3 space-y-2 border-t border-[#eaecf0] pt-3">{capability.missionMatches.map((match) => <div key={match.missionAreaSlug}><p className="text-xs font-bold text-[#101828]">{missionAreas.find((mission) => mission.slug === match.missionAreaSlug)?.name ?? match.missionAreaSlug} · {match.confidence}</p><p className="mt-1 text-xs leading-5 text-[#475467]">{match.alignmentSummary}</p></div>)}</div> : null}
        </div>
      ))}

      {record.programs.map((program) => (
        <div key={program.slug} className="mt-4 rounded-md border border-[#d0d5dd] bg-[#f8fafc] p-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-[#344054]">Program candidate</h3>
          <a href={program.websiteUrl} target="_blank" rel="noreferrer" className="mt-2 block text-sm font-semibold text-[#0756d9]">{program.name}</a>
          <p className="mt-1 text-xs leading-5 text-[#667085]">{program.summary}</p>
        </div>
      ))}

      {record.relationships.map((relationship, index) => (
        <div key={`${relationship.relatedOrganizationName}-${index}`} className="mt-4 rounded-md border border-[#d0d5dd] bg-[#f8fafc] p-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-[#344054]">Relationship candidate</h3>
          <p className="mt-2 text-sm font-semibold text-[#101828]">{relationship.relatedOrganizationName} · {relationship.relationshipType.replaceAll("_", " ")}</p>
          <p className="mt-1 text-xs leading-5 text-[#667085]">{relationship.publicSummary}</p>
        </div>
      ))}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {record.sources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="block rounded-md border border-[#b8dfe5] bg-[#f5fcfd] p-4 no-underline hover:border-[#007f98] hover:no-underline"><span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#007f98]">Public evidence</span><strong className="mt-1 block text-sm text-[#101828]">{source.title}</strong><span className="mt-1 block text-xs leading-5 text-[#667085]">{source.publisher} · {source.locator}</span></a>)}
      </div>

      <details className="mt-4 rounded-md border border-[#d0d5dd] bg-[#fcfcfd] p-4 text-xs">
        <summary className="cursor-pointer font-semibold text-[#344054]">Field-level evidence ({record.fieldEvidence.length})</summary>
        <div className="mt-3 space-y-3">{record.fieldEvidence.map((evidence) => <div key={evidence.id}><p className="font-semibold text-[#344054]">{evidence.fieldPath} · {evidence.confidence}</p><p className="mt-1 leading-5 text-[#667085]">{evidence.excerpt}</p></div>)}</div>
      </details>

      <TypedCandidateEditor candidateId={candidate.id} record={record} />

      <form action={reviewAtlasCandidate} className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-end">
        <input type="hidden" name="candidateId" value={candidate.id} />
        <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">Reviewer rationale<textarea name="rationale" required minLength={3} maxLength={2000} rows={3} defaultValue={candidate.reviewer_rationale ?? record.reviewerRationale} className={areaClass} /></label>
        <PendingButton unstyled type="submit" name="decision" value="defer" pendingLabel="Deferring…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-4 text-xs font-semibold text-[#475467]">Defer</PendingButton>
        <PendingButton unstyled type="submit" name="decision" value="reject" pendingLabel="Rejecting…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#fda29b] bg-white px-4 text-xs font-semibold text-[#b42318]">Reject</PendingButton>
        <PendingButton unstyled type="submit" name="decision" value="accept" pendingLabel="Accepting…" disabled={duplicateCheck?.status !== "clear"} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0756d9] px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#98a2b3]">Accept for publication</PendingButton>
      </form>
    </PublicCard>
  );
}

function DemandSignalCandidateCard({ candidate, record }: { candidate: CandidateRow; record: DemandSignalBundleV1 }) {
  const duplicateCheck = candidate.duplicate_check as { status?: string } | null;
  const areaClass = "rounded-md border border-[#d0d5dd] bg-white px-3 py-2 text-sm font-normal leading-6 outline-none focus:border-[#0756d9]";

  return (
    <PublicCard title={record.demandSource.title} eyebrow={`Demand-signal candidate · ${candidate.confidence} evidence confidence`}>
      <div className="grid gap-4 md:grid-cols-3">
        <ReviewFact label="Issuer" value={record.issuers.map((issuer) => `${issuer.name} (${issuer.role.replaceAll("_", " ")})`).join(" · ")} />
        <ReviewFact label="Signal" value={`${record.demandSource.sourceKind.replaceAll("_", " ")} · ${record.demandSource.commitmentLevel}`} />
        <ReviewFact label="Duplicate check" value={duplicateCheck?.status === "clear" ? "No likely duplicate found" : "Resolution required"} tone={duplicateCheck?.status === "clear" ? "success" : "warning"} />
      </div>
      <p className="mt-4 text-sm leading-6 text-[#475467]">{record.demandSource.summary}</p>
      <ReviewerRationale rationale={candidate.reviewer_rationale ?? record.reviewerRationale} />

      <div className="mt-4 space-y-3">
        {record.requirements.map((requirement) => (
          <section key={requirement.slug} className="rounded-md border border-[#d0d5dd] bg-[#f8fafc] p-4">
            <h3 className="text-sm font-semibold text-[#101828]">{requirement.title}</h3>
            <p className="mt-2 text-xs leading-5 text-[#475467]"><strong>Public problem:</strong> {requirement.problemStatement}</p>
            <p className="mt-2 text-xs leading-5 text-[#475467]"><strong>Desired end state:</strong> {requirement.desiredEndState}</p>
            <p className="mt-3 text-[11px] leading-5 text-[#7a2e0e]">{requirement.publicCaveat}</p>
          </section>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {record.sources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="block rounded-md border border-[#b8dfe5] bg-[#f5fcfd] p-4 no-underline hover:border-[#007f98] hover:no-underline"><span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#007f98]">Official demand evidence</span><strong className="mt-1 block text-sm text-[#101828]">{source.title}</strong><span className="mt-1 block text-xs leading-5 text-[#667085]">{source.publisher} · {source.locator}</span></a>)}
      </div>

      <details className="mt-4 rounded-md border border-[#d0d5dd] bg-[#fcfcfd] p-4 text-xs">
        <summary className="cursor-pointer font-semibold text-[#344054]">Field-level evidence ({record.fieldEvidence.length})</summary>
        <div className="mt-3 space-y-3">{record.fieldEvidence.map((evidence) => <div key={evidence.id}><p className="font-semibold text-[#344054]">{evidence.fieldPath} · {evidence.confidence}</p><p className="mt-1 leading-5 text-[#667085]">{evidence.excerpt}</p></div>)}</div>
      </details>

      <TypedCandidateEditor candidateId={candidate.id} record={record} />

      <form action={reviewAtlasCandidate} className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-end">
        <input type="hidden" name="candidateId" value={candidate.id} />
        <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">Reviewer rationale<textarea name="rationale" required minLength={3} maxLength={2000} rows={3} defaultValue={candidate.reviewer_rationale ?? record.reviewerRationale} className={areaClass} /></label>
        <PendingButton unstyled type="submit" name="decision" value="defer" pendingLabel="Deferring…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-4 text-xs font-semibold text-[#475467]">Defer</PendingButton>
        <PendingButton unstyled type="submit" name="decision" value="reject" pendingLabel="Rejecting…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#fda29b] bg-white px-4 text-xs font-semibold text-[#b42318]">Reject</PendingButton>
        <PendingButton unstyled type="submit" name="decision" value="accept" pendingLabel="Accepting…" disabled={duplicateCheck?.status !== "clear"} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0756d9] px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#98a2b3]">Accept for publication</PendingButton>
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
      {candidate.reviewer_rationale ? <ReviewerRationale rationale={candidate.reviewer_rationale} /> : null}
      <form action={reviewAtlasCandidate} className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-end">
        <input type="hidden" name="candidateId" value={candidate.id} />
        <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">Reviewer rationale<textarea name="rationale" required minLength={3} maxLength={2000} rows={3} defaultValue={candidate.reviewer_rationale ?? undefined} className="rounded-md border border-[#d0d5dd] px-3 py-2 text-sm font-normal outline-none focus:border-[#0756d9]" /></label>
        <PendingButton unstyled type="submit" name="decision" value="defer" pendingLabel="Deferring…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-4 text-xs font-semibold text-[#475467]">Defer</PendingButton>
        <PendingButton unstyled type="submit" name="decision" value="reject" pendingLabel="Rejecting…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#fda29b] bg-white px-4 text-xs font-semibold text-[#b42318]">Reject</PendingButton>
        <PendingButton unstyled type="submit" name="decision" value="accept" pendingLabel="Accepting…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0756d9] px-4 text-xs font-semibold text-white">Accept candidate</PendingButton>
      </form>
    </PublicCard>
  );
}

function TypedCandidateEditor({ candidateId, record }: { candidateId: string; record: OrganizationBundleV2 | DemandSignalBundleV1 }) {
  return (
    <details className="mt-4 rounded-md border border-[#b2ccff] bg-[#f5f8ff] p-4">
      <summary className="cursor-pointer text-sm font-semibold text-[#1849a9]">Edit complete typed candidate</summary>
      <form action={editTypedResearchCandidate} className="mt-4 grid gap-4">
        <input type="hidden" name="candidateId" value={candidateId} />
        <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">Candidate JSON
          <textarea name="proposedRecordJson" required rows={22} defaultValue={JSON.stringify(record, null, 2)} spellCheck={false} className="rounded-md border border-[#98a2b3] bg-white px-3 py-2 font-mono text-[11px] leading-5 text-[#344054] outline-none focus:border-[#0756d9]" />
          <span className="text-[10px] font-normal leading-4 text-[#667085]">The save action validates the typed schema, field evidence, live taxonomy, source portability, and duplicate identity before preserving the edit.</span>
        </label>
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">Edit rationale
            <input name="rationale" required minLength={3} maxLength={2000} className="h-10 rounded-md border border-[#98a2b3] bg-white px-3 text-sm font-normal outline-none focus:border-[#0756d9]" placeholder="What changed and why" />
          </label>
          <PendingButton unstyled type="submit" pendingLabel="Validating…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#0756d9] bg-white px-4 text-xs font-semibold text-[#0756d9]">Validate and save edits</PendingButton>
        </div>
      </form>
    </details>
  );
}

function ReviewerRationale({ rationale }: { rationale: string }) {
  return <aside className="mt-4 rounded-md border border-[#b2ccff] bg-[#f5f8ff] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#1849a9]">Generated reviewer rationale</p><p className="mt-2 text-xs leading-5 text-[#344054]">{rationale}</p></aside>;
}

function QueueTypeSummary({ label, value, detail, tone }: { label: string; value: number; detail: string; tone: "organization" | "demand" | "match" }) {
  const toneClasses = tone === "organization"
    ? "border-[#b2ccff] bg-[#f5f8ff] text-[#1849a9]"
    : tone === "demand" ? "border-[#b8dfe5] bg-[#f5fcfd] text-[#007f98]" : "border-[#fec84b] bg-[#fffaeb] text-[#93370d]";
  return <div className={`rounded-lg border p-4 ${toneClasses}`}><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.08em]">{label}</p><strong className="text-2xl">{value}</strong></div><p className="mt-2 text-xs leading-5 text-[#475467]">{detail}</p></div>;
}

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">{label}{children}</label>;
}

function ReviewFact({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "warning" }) {
  const toneClass = tone === "success" ? "text-[#067647]" : tone === "warning" ? "text-[#b54708]" : "text-[#344054]";
  const StatusIcon = tone === "success" ? CheckCircle2 : tone === "warning" ? TriangleAlert : null;
  return <div className="rounded-md border border-[#eaecf0] bg-[#fcfcfd] p-3"><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#667085]">{label}</p><p className={`mt-1 flex items-start gap-1.5 text-xs font-semibold ${toneClass}`}>{StatusIcon ? <StatusIcon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" /> : null}<span>{value}</span></p></div>;
}

function JsonPanel({ label, value, empty }: { label: string; value: unknown; empty?: string }) {
  return <section><h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#667085]">{label}</h3>{value ? <pre className="mt-2 max-h-80 overflow-auto rounded-md border border-[#d0d5dd] bg-[#fcfcfd] p-3 text-[11px] leading-5 text-[#344054]">{JSON.stringify(value, null, 2)}</pre> : <div className="mt-2 rounded-md border border-dashed border-[#d0d5dd] p-4 text-xs text-[#667085]">{empty ?? "No value"}</div>}</section>;
}
