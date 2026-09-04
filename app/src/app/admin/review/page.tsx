import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Layers3, TriangleAlert } from "lucide-react";
import { AdminNav } from "@/components/atlas/admin-nav";
import { EmptyCoverage, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { RefreshOperationReview, entityLabel, fieldLabel, humanizeFieldPath } from "@/components/atlas/refresh-operation-review";
import { PendingButton } from "@/components/ui/pending-button";
import { PaginationNav } from "@/components/ui/pagination-nav";
import { editAtlasCandidate, editTypedResearchCandidate, mergeAtlasCandidate, publishDemandMatchCandidate, reviewAtlasCandidate, reviewResearchRunCandidates } from "@/lib/actions/atlas-admin";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { parseAtlasOrganizationCandidate, parseDemandMatchCandidate, parseDemandRefreshCandidate, parseDemandSignalCandidate, parseOrganizationBundleV2, parseOrganizationBundleV3, parseOrganizationCanonicalRepairCandidate, parseOrganizationRefreshCandidate, type AtlasOrganizationCandidate, type DemandMatchCandidate } from "@/lib/atlas/candidate-schema";
import { buildDemandMatchPublicationRationale } from "@/lib/atlas/demand-matching";
import { buildResearchQueueBatches, candidateTypeTotals, type ResearchQueueBatch } from "@/lib/atlas/research-run-queue";
import { loadResearchQueueMetadata } from "@/lib/atlas/research-run-queue-server";
import type { DemandRefreshBundleV1, DemandSignalBundleV1, OrganizationBundleV2, OrganizationBundleV3, OrganizationCanonicalRepairBundleV1, OrganizationRefreshBundleV1, OrganizationRefreshBundleV2 } from "@/lib/research/pipeline-schema";
import { createClient } from "@/lib/supabase/server";
import { normalizedPage } from "@/lib/pagination";

type CandidateRow = {
  id: string;
  research_run_id: string | null;
  candidate_kind: string;
  target_entity_type: string | null;
  target_entity_id: string | null;
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
  "restage-required": "This validated refresh cannot be edited in place. Correct the research artifacts, rerun the complete validation, and restage the candidate.",
  "edit-failed": "The edited candidate could not be saved.",
  "invalid-merge": "Select a valid canonical organization before merging.",
  "merge-failed": "The duplicate resolution could not be saved.",
  "review-failed": "The review decision could not be recorded.",
  "invalid-batch-review": "Select a complete research batch and confirm the batch review action.",
  "batch-review-blocked": "Batch acceptance stopped because at least one candidate needs individual review, duplicate resolution, or a complete reviewer rationale.",
  "batch-review-failed": "No batch decision was recorded. Refresh the queue and confirm that every candidate is still pending.",
  "unsupported-candidate": "This candidate type is not supported by the current review and publication workflow. It was not accepted or published.",
  "invalid-demand-match": "Explain why this technology-to-demand match is useful and defensible before publishing it.",
  "demand-match-publication-failed": "The match was not published. Refresh the queue and confirm that the technology, public demand statement, and candidate are still current."
};

export default async function AdminReviewPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string; page?: string; run?: string; count?: string }> }) {
  await requireAtlasStaff("reviewer");
  const params = await searchParams;
  const pageSize = 20;
  const page = normalizedPage(params.page);
  const rangeStart = (page - 1) * pageSize;
  const supabase = await createClient();
  const queue = await loadResearchQueueMetadata(supabase, "pending");
  const batches = buildResearchQueueBatches(queue.candidates, queue.runs);
  const selectedBatchKey = params.run && batches.some((batch) => batch.key === params.run) ? params.run : null;
  let candidateQuery = supabase
    .from("candidate_changes")
    .select("id, research_run_id, candidate_kind, target_entity_type, target_entity_id, proposed_record, before_record, field_evidence, duplicate_check, reviewer_rationale, confidence, status, created_at", { count: "exact" })
    .eq("status", "pending")
    .order("created_at")
    .range(rangeStart, rangeStart + pageSize - 1);
  if (selectedBatchKey === "unassigned") candidateQuery = candidateQuery.is("research_run_id", null);
  else if (selectedBatchKey) candidateQuery = candidateQuery.eq("research_run_id", selectedBatchKey);
  const [{ data: candidates, count: candidateCount }, { data: domains }, { data: clusters }, { data: missionAreas }] = await Promise.all([
    candidateQuery,
    supabase.from("technical_domains").select("slug, name").eq("publication_status", "published").order("name"),
    supabase.from("ecosystem_clusters").select("slug, name").eq("publication_status", "published").order("name"),
    supabase.from("mission_areas").select("slug, name").eq("publication_status", "published").order("name")
  ]);
  const candidateTotal = candidateCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(candidateTotal / pageSize));
  if (candidateTotal > 0 && page > totalPages) {
    const redirectParams = new URLSearchParams();
    if (selectedBatchKey) redirectParams.set("run", selectedBatchKey);
    if (totalPages > 1) redirectParams.set("page", String(totalPages));
    redirect(`/admin/review${redirectParams.size ? `?${redirectParams}` : ""}`);
  }
  const candidateRows = (candidates ?? []) as CandidateRow[];
  const totals = candidateTypeTotals(queue.candidates);

  return (
    <PublicPageShell variant="admin" eyebrow="Editorial operations" title="Review queue" description="Inspect and edit staged research. Accepting a candidate moves it to the publication checkpoint; it does not make the record public." backHref="/admin" backLabel="Atlas operations">
      <AdminNav />
      {params.error ? <div className="mb-5 rounded-md border border-[var(--admin-danger-border)] bg-[var(--admin-danger-soft)] px-3 py-2 text-sm text-[var(--admin-danger)]">{errorMessages[params.error] ?? "The review action could not be completed."}</div> : null}
      {params.success ? <div className="mb-5 rounded-md border border-[var(--admin-success-border)] bg-[var(--admin-success-soft)] px-3 py-2 text-sm text-[var(--admin-success)]">{params.success === "accepted" ? <span>Candidate accepted. It is not public yet. <Link href="/admin/publish" className="font-bold underline underline-offset-2">Continue to the Publication checkpoint</Link>.</span> : params.success === "batch-accepted" ? <span>{params.count ?? "The selected"} research candidates accepted as one batch. Nothing is public yet. <Link href="/admin/publish" className="font-bold underline underline-offset-2">Continue to the Publication checkpoint</Link>.</span> : params.success === "demand-match-published" ? "Technology-to-demand match published and public profiles refreshed." : params.success === "rejected" ? "Candidate rejected. Publication remains unchanged." : params.success === "deferred" ? "Candidate deferred for further review. Publication remains unchanged." : `Candidate ${params.success === "merged" ? "merged into its canonical organization" : "updated"}. Publication remains unchanged.`}</div> : null}
      {queue.candidates.length ? (
        <div className="space-y-5">
          <section className="rounded-[18px] border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-4 sm:p-5" aria-labelledby="research-batches-heading">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--admin-muted)]">Persistent review queue</p>
                <h2 id="research-batches-heading" className="mt-1 text-lg font-bold text-[var(--admin-ink)]">{queue.candidates.length} pending candidates across {batches.length} research {batches.length === 1 ? "batch" : "batches"}</h2>
                <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--admin-muted)]">The queue total includes every staged candidate, not only the 20 records displayed on a page. Filter by research run to review its candidates or accept an eligible run as one atomic batch.</p>
              </div>
              {selectedBatchKey ? <Link href="/admin/review" className="atlas-secondary-button h-9 shrink-0 px-3 text-xs">Show all pending</Link> : null}
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {batches.map((batch) => <ResearchBatchCard key={batch.key} batch={batch} selected={batch.key === selectedBatchKey} />)}
            </div>
          </section>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <QueueTypeSummary label="Organization candidates" value={totals.organizations} detail="Companies, accelerators, incubators, investors, research centres, and ecosystem organizations." tone="organization" />
            <QueueTypeSummary label="Demand-signal candidates" value={totals.demands} detail="Public problem statements from governments, armed forces, programs, procurement bodies, and allies." tone="demand" />
            <QueueTypeSummary label="Potential matches" value={totals.matches} detail="Private suggestions connecting reviewed technologies to public demand statements. Each requires an explicit publication decision." tone="match" />
            <QueueTypeSummary label="Record refreshes" value={totals.refreshes} detail="Evidence-backed changes to existing organizations, capabilities, programs, relationships, or public demand." tone="refresh" />
            <QueueTypeSummary label="Canonical repairs" value={totals.repairs} detail="Identity, classification, alias, capability, or lifecycle corrections. Every repair requires individual Review and Publish decisions." tone="repair" />
          </div>
          {candidateRows.map((candidate) => {
            const legacy = candidate.candidate_kind === "organization_bundle"
              ? parseAtlasOrganizationCandidate(candidate.proposed_record)
              : null;
            const typedV3 = candidate.candidate_kind === "organization_bundle"
              ? parseOrganizationBundleV3(candidate.proposed_record)
              : null;
            const typedV2 = candidate.candidate_kind === "organization_bundle"
              ? parseOrganizationBundleV2(candidate.proposed_record)
              : null;
            const demand = candidate.candidate_kind === "demand_signal_bundle"
              ? parseDemandSignalCandidate(candidate.proposed_record)
              : null;
            const demandMatch = candidate.candidate_kind === "demand_match_bundle"
              ? parseDemandMatchCandidate(candidate.proposed_record)
              : null;
            const organizationRefresh = candidate.candidate_kind === "organization_refresh_bundle" ? parseOrganizationRefreshCandidate(candidate.proposed_record) : null;
            const demandRefresh = candidate.candidate_kind === "demand_refresh_bundle" ? parseDemandRefreshCandidate(candidate.proposed_record) : null;
            const canonicalRepair = candidate.candidate_kind === "organization_canonical_repair_bundle" ? parseOrganizationCanonicalRepairCandidate(candidate.proposed_record) : null;
            return legacy?.success ? (
              <OrganizationCandidateCard key={candidate.id} candidate={candidate} record={legacy.data} domains={domains ?? []} clusters={clusters ?? []} missionAreas={missionAreas ?? []} />
            ) : typedV3?.success ? (
              <TypedOrganizationCandidateCard key={candidate.id} candidate={candidate} record={typedV3.data} domains={domains ?? []} missionAreas={missionAreas ?? []} />
            ) : typedV2?.success ? (
              <TypedOrganizationCandidateCard key={candidate.id} candidate={candidate} record={typedV2.data} domains={domains ?? []} missionAreas={missionAreas ?? []} />
            ) : demand?.success ? (
              <DemandSignalCandidateCard key={candidate.id} candidate={candidate} record={demand.data} />
            ) : demandMatch?.success ? (
              <DemandMatchCandidateCard key={candidate.id} candidate={candidate} record={demandMatch.data} />
            ) : organizationRefresh?.success ? (
              <RefreshCandidateCard key={candidate.id} candidate={candidate} record={organizationRefresh.data} />
            ) : demandRefresh?.success ? (
              <RefreshCandidateCard key={candidate.id} candidate={candidate} record={demandRefresh.data} />
            ) : canonicalRepair?.success ? (
              <CanonicalRepairCandidateCard key={candidate.id} candidate={candidate} record={canonicalRepair.data} />
            ) : (
              <GenericCandidateCard key={candidate.id} candidate={candidate} />
            );
          })}
          <PaginationNav
            path="/admin/review"
            page={page}
            totalPages={totalPages}
            start={rangeStart + 1}
            end={Math.min(rangeStart + candidateRows.length, candidateTotal)}
            total={candidateTotal}
            itemLabel="pending candidates"
            query={{ run: selectedBatchKey ?? undefined }}
          />
        </div>
      ) : <EmptyCoverage title="Review queue is clear" detail="New source extractions and validated research candidates appear here after staging. Public submissions have their own review queue." />}
    </PublicPageShell>
  );
}

function ResearchBatchCard({ batch, selected }: { batch: ResearchQueueBatch; selected: boolean }) {
  const date = new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeZone: "America/Halifax" }).format(new Date(batch.completedAt ?? batch.firstStagedAt));
  return (
    <article className={`rounded-lg border bg-white p-4 ${selected ? "border-[var(--admin-action)] ring-1 ring-[var(--admin-action)]" : "border-[var(--admin-border)]"}`}>
      <div className="flex items-start gap-3">
        <Layers3 className="mt-0.5 size-5 shrink-0 text-[var(--admin-action)]" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-[var(--admin-ink)]">{batch.label}</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">{batch.pendingCount} pending · {batch.refreshCount} refreshes · {batch.repairCount} canonical repairs · {batch.organizationCount} new organizations · completed {date}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-3 border-t border-[var(--admin-border)] pt-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href={`/admin/review?run=${encodeURIComponent(batch.key)}`} className="text-xs font-semibold text-[var(--admin-action)]">Review this batch</Link>
          {batch.bulkReviewIssue ? <p className="mt-1 max-w-md text-[11px] leading-4 text-[var(--admin-warning)]">{batch.bulkReviewIssue}</p> : <p className="mt-1 max-w-md text-[11px] leading-4 text-[var(--admin-muted)]">Uses every candidate&apos;s editable, evidence-bounded reviewer rationale. Publication remains a separate action.</p>}
        </div>
        {batch.runId && batch.bulkReviewEligible ? (
          <form action={reviewResearchRunCandidates} className="shrink-0">
            <input type="hidden" name="researchRunId" value={batch.runId} />
            <label className="mb-2 flex items-start gap-2 text-[11px] leading-4 text-[var(--admin-muted-strong)]">
              <input type="checkbox" name="confirmation" value="accept-run" required className="mt-0.5 size-4 accent-[var(--admin-action)]" />
              <span>I reviewed this run&apos;s research brief and accept all {batch.pendingCount} pending candidates.</span>
            </label>
            <PendingButton type="submit" pendingLabel="Accepting batch…" className="h-10 w-full bg-[var(--admin-action)] px-4 text-xs font-semibold text-white sm:w-auto">Accept all {batch.pendingCount}</PendingButton>
          </form>
        ) : null}
      </div>
    </article>
  );
}

function DemandMatchCandidateCard({ candidate, record }: { candidate: CandidateRow; record: DemandMatchCandidate }) {
  const areaClass = "rounded-md border border-[var(--admin-border)] bg-white px-3 py-2 text-sm font-normal leading-6 outline-none focus:border-[var(--admin-action)]";
  const publicationRationale = record.publicationRationale ?? buildDemandMatchPublicationRationale(record);
  return (
    <PublicCard title={`${record.organizationName} → ${record.demandTitle}`} eyebrow="Potential technology-to-demand match · private until you publish it">
      <div className="grid gap-4 md:grid-cols-3">
        <ReviewFact label="Technology" value={record.capabilityName} />
        <ReviewFact label="Public demand statement" value={record.demandTitle} />
        <ReviewFact label="Current status" value="Needs human review" tone="warning" />
      </div>
      <div className="mt-4 rounded-md border border-[var(--admin-evidence-border)] bg-[var(--admin-evidence-soft)] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--admin-evidence)]">Why it may fit</p>
        <p className="mt-2 text-sm leading-6 text-[var(--admin-ink-soft)]">{record.alignmentSummary}</p>
        <div className="mt-3 flex flex-wrap gap-2">{record.matchedConcepts.map((concept) => <span key={concept} className="rounded-full border border-[var(--admin-evidence-border)] bg-white px-2.5 py-1 text-[10px] font-semibold text-[var(--admin-evidence)]">{concept}</span>)}</div>
      </div>
      <aside className="mt-4 rounded-md border border-[var(--admin-success-border)] bg-[var(--admin-success-soft)] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--admin-success)]">What publication will do</p><p className="mt-2 text-xs leading-5 text-[var(--admin-ink-soft)]">Add a reviewed, moderate-confidence connection to the technology and demand profiles. The underlying records and citations remain unchanged.</p></aside>
      <details className="mt-4 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-3 text-xs"><summary className="cursor-pointer font-semibold text-[var(--admin-muted-strong)]">Matching method and caveats</summary><p className="mt-2 leading-5 text-[var(--admin-muted)]">{record.rationale}</p></details>
      <ReviewerRationale rationale={candidate.reviewer_rationale ?? record.reviewerRationale} />
      <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
        <Link href={`/capabilities/${record.capabilitySlug}`} target="_blank" className="text-[var(--admin-action)]">Review technology profile</Link>
        <Link href={`/demand/${record.demandSlug}`} target="_blank" className="text-[var(--admin-action)]">Review public demand statement</Link>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-end">
        <form action={publishDemandMatchCandidate} className="contents">
          <input type="hidden" name="candidateId" value={candidate.id} />
          <label className="grid gap-1.5 text-xs font-semibold text-[var(--admin-ink-soft)]">Why this match should be public<textarea name="rationale" required minLength={20} maxLength={2000} rows={5} defaultValue={publicationRationale} className={areaClass} /></label>
          <PendingButton unstyled type="submit" pendingLabel="Publishing…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--admin-action)] px-4 text-xs font-semibold text-white">Publish match</PendingButton>
        </form>
        <form action={reviewAtlasCandidate} className="contents">
          <input type="hidden" name="candidateId" value={candidate.id} />
          <input type="hidden" name="rationale" value="Potential relationship requires more source review before any public assessment." />
          <PendingButton unstyled type="submit" name="decision" value="defer" pendingLabel="Deferring…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--admin-border)] bg-white px-4 text-xs font-semibold text-[var(--admin-muted-strong)]">Defer</PendingButton>
          <PendingButton unstyled type="submit" name="decision" value="reject" pendingLabel="Rejecting…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--admin-danger-border)] bg-white px-4 text-xs font-semibold text-[var(--admin-danger)]">Reject</PendingButton>
        </form>
      </div>
      <p className="mt-3 text-[11px] leading-5 text-[var(--admin-warning)]">Publishing labels this as our reviewed interpretation. It does not imply procurement eligibility, endorsement, or classified demand.</p>
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
  const fieldClass = "h-10 rounded-md border border-[var(--admin-border)] bg-white px-3 text-sm font-normal outline-none focus:border-[var(--admin-action)]";
  const areaClass = "rounded-md border border-[var(--admin-border)] bg-white px-3 py-2 text-sm font-normal leading-6 outline-none focus:border-[var(--admin-action)]";

  return (
    <PublicCard title={record.name} eyebrow={`Organization candidate · ${candidate.confidence} evidence confidence · ${record.capability.name}`}>
      <div className="grid gap-4 md:grid-cols-3">
        <ReviewFact label="Location" value={`${record.city}, ${record.provinceTerritory}`} />
        <ReviewFact label="Primary domain" value={domains.find((domain) => domain.slug === record.capability.technicalDomainSlug)?.name ?? record.capability.technicalDomainSlug} />
        <ReviewFact label="Duplicate check" value={duplicateCheck?.status === "possible_match" ? "Possible match; resolution required" : "No likely duplicate found"} tone={duplicateCheck?.status === "possible_match" ? "warning" : "success"} />
      </div>
      <p className="mt-4 text-sm leading-6 text-[var(--admin-muted-strong)]">{record.description}</p>
      <div className="mt-4 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--admin-ink-soft)]">Capability candidate</h3>
        <p className="mt-2 text-sm font-semibold text-[var(--admin-ink)]">{record.capability.name}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">{record.capability.summary}</p>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--admin-muted)]">{record.capability.tags.join(" · ")}</p>
      </div>
      {record.capability.missionMatches.length ? (
        <div className="mt-4 rounded-md border border-[var(--admin-evidence-border)] bg-[var(--admin-evidence-soft)] p-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--admin-evidence)]">Analyst assessments to review</h3>
          <div className="mt-3 space-y-3">
            {record.capability.missionMatches.map((match) => (
              <div key={match.missionAreaSlug}>
                <p className="text-xs font-bold text-[var(--admin-ink)]">{missionAreas.find((mission) => mission.slug === match.missionAreaSlug)?.name ?? match.missionAreaSlug} · {match.confidence} confidence</p>
                <p className="mt-1 text-xs leading-5 text-[var(--admin-muted-strong)]">{match.alignmentSummary}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <a href={record.source.url} target="_blank" rel="noreferrer" className="mt-4 block rounded-md border border-[var(--admin-evidence-border)] bg-[var(--admin-evidence-soft)] p-4 no-underline hover:border-[var(--admin-evidence)] hover:no-underline">
        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--admin-evidence)]">Primary source</span>
        <strong className="mt-1 block text-sm text-[var(--admin-ink)]">{record.source.title}</strong>
        <span className="mt-1 block text-xs leading-5 text-[var(--admin-muted)]">{record.source.publisher} · {record.source.excerpt}</span>
      </a>

      {matches.length ? (
        <form action={mergeAtlasCandidate} className="mt-4 rounded-md border border-[var(--admin-warning-border)] bg-[var(--admin-warning-soft)] p-4">
          <input type="hidden" name="candidateId" value={candidate.id} />
          <p className="text-xs font-bold text-[var(--admin-warning-strong)]">Possible duplicate</p>
          <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1.5fr_auto] lg:items-end">
            <label className="grid gap-1.5 text-xs font-semibold text-[var(--admin-ink-soft)]">Canonical organization
              <select name="canonicalOrganizationId" required className={fieldClass} defaultValue="">
                <option value="" disabled>Select organization</option>
                {matches.map((match) => <option key={match.id} value={match.id}>{match.name}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-[var(--admin-ink-soft)]">Merge rationale
              <input name="rationale" required minLength={3} maxLength={2000} className={fieldClass} placeholder="Why these records represent the same organization" />
            </label>
            <PendingButton unstyled type="submit" pendingLabel="Merging…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--admin-warning-action-border)] bg-white px-4 text-xs font-semibold text-[var(--admin-warning-action)]">Merge candidate</PendingButton>
          </div>
        </form>
      ) : null}

      <details className="mt-4 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--admin-ink-soft)]">Edit fields before review</summary>
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
            <EditField label="Core features"><textarea name="features" required rows={4} defaultValue={record.capability.features.join("\n")} className={areaClass} /><span className="text-[10px] font-normal text-[var(--admin-muted)]">One item per line.</span></EditField>
            <EditField label="Applications"><textarea name="applications" required rows={4} defaultValue={record.capability.applications.join("\n")} className={areaClass} /><span className="text-[10px] font-normal text-[var(--admin-muted)]">One item per line.</span></EditField>
            <EditField label="Technical tags"><textarea name="tags" required rows={4} defaultValue={record.capability.tags.join("\n")} className={areaClass} /><span className="text-[10px] font-normal text-[var(--admin-muted)]">One item per line.</span></EditField>
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
            <PendingButton unstyled type="submit" pendingLabel="Saving…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--admin-action)] bg-white px-4 text-xs font-semibold text-[var(--admin-action)]">Save edits</PendingButton>
          </div>
        </form>
      </details>

      <form action={reviewAtlasCandidate} className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-end">
        <input type="hidden" name="candidateId" value={candidate.id} />
        <label className="grid gap-1.5 text-xs font-semibold text-[var(--admin-ink-soft)]">Reviewer rationale<textarea name="rationale" required minLength={3} maxLength={2000} rows={2} className={areaClass} /></label>
        <PendingButton unstyled type="submit" name="decision" value="defer" pendingLabel="Deferring…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--admin-border)] bg-white px-4 text-xs font-semibold text-[var(--admin-muted-strong)]">Defer</PendingButton>
        <PendingButton unstyled type="submit" name="decision" value="reject" pendingLabel="Rejecting…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--admin-danger-border)] bg-white px-4 text-xs font-semibold text-[var(--admin-danger)]">Reject</PendingButton>
        <PendingButton unstyled type="submit" name="decision" value="accept" pendingLabel="Accepting…" disabled={matches.length > 0} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--admin-action)] px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-[var(--admin-border-strong)]">Accept for publication</PendingButton>
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
  record: OrganizationBundleV2 | OrganizationBundleV3;
  domains: Array<{ slug: string; name: string }>;
  missionAreas: Array<{ slug: string; name: string }>;
}) {
  const duplicateCheck = candidate.duplicate_check as { status?: string } | null;
  const location = record.organization.primaryLocation;
  const locationLabel = [location.city, location.provinceTerritory, location.countryCode].filter(Boolean).join(", ");
  const areaClass = "rounded-md border border-[var(--admin-border)] bg-white px-3 py-2 text-sm font-normal leading-6 outline-none focus:border-[var(--admin-action)]";
  const roleLabel = record.organization.entityKind.replaceAll("_", " ");

  return (
    <PublicCard title={record.organization.name} eyebrow={`Organization candidate · ${candidate.confidence} evidence confidence · ${roleLabel}`}>
      <div className="grid gap-4 md:grid-cols-3">
        <ReviewFact label="Organization type" value={roleLabel} />
        <ReviewFact label="Location" value={locationLabel || "Canada · location not yet resolved"} />
        <ReviewFact label="Duplicate check" value={duplicateCheck?.status === "clear" ? "No likely duplicate found" : "Resolution required"} tone={duplicateCheck?.status === "clear" ? "success" : "warning"} />
      </div>
      <p className="mt-4 text-sm leading-6 text-[var(--admin-muted-strong)]">{record.organization.description}</p>
      {record.schemaVersion === "organization_bundle_v3" && record.organization.executiveRelevanceSummary ? (
        <ExecutiveRelevancePreview
          summary={record.organization.executiveRelevanceSummary}
          evidence={record.fieldEvidence.filter((item) => item.fieldPath === "organization.executiveRelevanceSummary")}
          sources={record.sources}
          connectionCount={record.capabilities.reduce((count, capability) => count + capability.missionMatches.length, 0)}
        />
      ) : null}
      <ReviewerRationale rationale={candidate.reviewer_rationale ?? record.reviewerRationale} />

      {record.capabilities.map((capability) => (
        <div key={capability.slug} className="mt-4 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--admin-ink-soft)]">Capability candidate</h3>
          <p className="mt-2 text-sm font-semibold text-[var(--admin-ink)]">{capability.name}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">{capability.summary}</p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--admin-muted)]">{capability.technicalDomainSlugs.map((slug) => domains.find((domain) => domain.slug === slug)?.name ?? slug).join(" · ")}</p>
          {capability.missionMatches.length ? <div className="mt-3 space-y-2 border-t border-[var(--admin-border-subtle)] pt-3">{capability.missionMatches.map((match) => <div key={match.missionAreaSlug}><p className="text-xs font-bold text-[var(--admin-ink)]">{missionAreas.find((mission) => mission.slug === match.missionAreaSlug)?.name ?? match.missionAreaSlug} · {match.confidence}</p><p className="mt-1 text-xs leading-5 text-[var(--admin-muted-strong)]">{match.alignmentSummary}</p></div>)}</div> : null}
        </div>
      ))}

      {record.schemaVersion === "organization_bundle_v3"
        ? record.programParticipations.map(({ program, participation }) => (
            <div key={program.slug} className="mt-4 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--admin-ink-soft)]">Program participation candidate</h3>
              {program.websiteUrl ? <a href={program.websiteUrl} target="_blank" rel="noreferrer" className="mt-2 block text-sm font-semibold text-[var(--admin-action)]">{program.name}</a> : <p className="mt-2 text-sm font-semibold text-[var(--admin-ink)]">{program.name}</p>}
              <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">{program.summary}</p>
              <p className="mt-2 text-xs leading-5 text-[var(--admin-ink-soft)]"><strong>Participation:</strong> {participation.publicSummary ?? `${participation.participationType}${participation.cohortLabel ? ` · ${participation.cohortLabel}` : ""}`}</p>
            </div>
          ))
        : record.programs.map((program) => (
            <div key={program.slug} className="mt-4 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--admin-ink-soft)]">Program candidate</h3>
              <a href={program.websiteUrl} target="_blank" rel="noreferrer" className="mt-2 block text-sm font-semibold text-[var(--admin-action)]">{program.name}</a>
              <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">{program.summary}</p>
            </div>
          ))}

      {record.schemaVersion === "organization_bundle_v3" && record.fundingEvents.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">{record.fundingEvents.map((event, index) => <div key={`${event.eventType}-${index}`} className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-4"><h3 className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--admin-ink-soft)]">Funding event</h3><p className="mt-2 text-sm font-semibold text-[var(--admin-ink)]">{event.eventType.replaceAll("_", " ")}{event.announcedOn ? ` · ${event.announcedOn}` : ""}</p><p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">{event.disclosedSummary}</p></div>)}</div> : null}

      {record.relationships.map((relationship, index) => (
        <div key={`${relationship.relatedOrganizationName}-${index}`} className="mt-4 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--admin-ink-soft)]">Relationship candidate</h3>
          <p className="mt-2 text-sm font-semibold text-[var(--admin-ink)]">{relationship.relatedOrganizationName} · {relationship.relationshipType.replaceAll("_", " ")}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">{relationship.publicSummary}</p>
        </div>
      ))}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {record.sources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="block rounded-md border border-[var(--admin-evidence-border)] bg-[var(--admin-evidence-soft)] p-4 no-underline hover:border-[var(--admin-evidence)] hover:no-underline"><span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--admin-evidence)]">Public evidence</span><strong className="mt-1 block text-sm text-[var(--admin-ink)]">{source.title}</strong><span className="mt-1 block text-xs leading-5 text-[var(--admin-muted)]">{source.publisher} · {source.locator}</span></a>)}
      </div>

      <details className="mt-4 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4 text-xs">
        <summary className="cursor-pointer font-semibold text-[var(--admin-ink-soft)]">Field-level evidence ({record.fieldEvidence.length})</summary>
        <div className="mt-3 space-y-3">{record.fieldEvidence.map((evidence) => <div key={evidence.id}><p className="font-semibold text-[var(--admin-ink-soft)]">{evidence.fieldPath} · {evidence.confidence}</p><p className="mt-1 leading-5 text-[var(--admin-muted)]">{evidence.excerpt}</p></div>)}</div>
      </details>

      <TypedCandidateEditor candidateId={candidate.id} record={record} />

      <form action={reviewAtlasCandidate} className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-end">
        <input type="hidden" name="candidateId" value={candidate.id} />
        <label className="grid gap-1.5 text-xs font-semibold text-[var(--admin-ink-soft)]">Reviewer rationale<textarea name="rationale" required minLength={3} maxLength={2000} rows={3} defaultValue={candidate.reviewer_rationale ?? record.reviewerRationale} className={areaClass} /></label>
        <PendingButton unstyled type="submit" name="decision" value="defer" pendingLabel="Deferring…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--admin-border)] bg-white px-4 text-xs font-semibold text-[var(--admin-muted-strong)]">Defer</PendingButton>
        <PendingButton unstyled type="submit" name="decision" value="reject" pendingLabel="Rejecting…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--admin-danger-border)] bg-white px-4 text-xs font-semibold text-[var(--admin-danger)]">Reject</PendingButton>
        <PendingButton unstyled type="submit" name="decision" value="accept" pendingLabel="Accepting…" disabled={duplicateCheck?.status !== "clear"} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--admin-action)] px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-[var(--admin-border-strong)]">Accept for publication</PendingButton>
      </form>
    </PublicCard>
  );
}

function DemandSignalCandidateCard({ candidate, record }: { candidate: CandidateRow; record: DemandSignalBundleV1 }) {
  const duplicateCheck = candidate.duplicate_check as { status?: string } | null;
  const areaClass = "rounded-md border border-[var(--admin-border)] bg-white px-3 py-2 text-sm font-normal leading-6 outline-none focus:border-[var(--admin-action)]";

  return (
    <PublicCard title={record.demandSource.title} eyebrow={`Demand-signal candidate · ${candidate.confidence} evidence confidence`}>
      <div className="grid gap-4 md:grid-cols-3">
        <ReviewFact label="Issuer" value={record.issuers.map((issuer) => `${issuer.name} (${issuer.role.replaceAll("_", " ")})`).join(" · ")} />
        <ReviewFact label="Signal" value={`${record.demandSource.sourceKind.replaceAll("_", " ")} · ${record.demandSource.commitmentLevel}`} />
        <ReviewFact label="Duplicate check" value={duplicateCheck?.status === "clear" ? "No likely duplicate found" : "Resolution required"} tone={duplicateCheck?.status === "clear" ? "success" : "warning"} />
      </div>
      <p className="mt-4 text-sm leading-6 text-[var(--admin-muted-strong)]">{record.demandSource.summary}</p>
      <ReviewerRationale rationale={candidate.reviewer_rationale ?? record.reviewerRationale} />

      <div className="mt-4 space-y-3">
        {record.requirements.map((requirement) => (
          <section key={requirement.slug} className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-4">
            <h3 className="text-sm font-semibold text-[var(--admin-ink)]">{requirement.title}</h3>
            <p className="mt-2 text-xs leading-5 text-[var(--admin-muted-strong)]"><strong>Public problem:</strong> {requirement.problemStatement}</p>
            <p className="mt-2 text-xs leading-5 text-[var(--admin-muted-strong)]"><strong>Desired end state:</strong> {requirement.desiredEndState}</p>
            <p className="mt-3 text-[11px] leading-5 text-[var(--admin-warning)]">{requirement.publicCaveat}</p>
          </section>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {record.sources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="block rounded-md border border-[var(--admin-evidence-border)] bg-[var(--admin-evidence-soft)] p-4 no-underline hover:border-[var(--admin-evidence)] hover:no-underline"><span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--admin-evidence)]">Official demand evidence</span><strong className="mt-1 block text-sm text-[var(--admin-ink)]">{source.title}</strong><span className="mt-1 block text-xs leading-5 text-[var(--admin-muted)]">{source.publisher} · {source.locator}</span></a>)}
      </div>

      <details className="mt-4 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4 text-xs">
        <summary className="cursor-pointer font-semibold text-[var(--admin-ink-soft)]">Field-level evidence ({record.fieldEvidence.length})</summary>
        <div className="mt-3 space-y-3">{record.fieldEvidence.map((evidence) => <div key={evidence.id}><p className="font-semibold text-[var(--admin-ink-soft)]">{evidence.fieldPath} · {evidence.confidence}</p><p className="mt-1 leading-5 text-[var(--admin-muted)]">{evidence.excerpt}</p></div>)}</div>
      </details>

      <TypedCandidateEditor candidateId={candidate.id} record={record} />

      <form action={reviewAtlasCandidate} className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-end">
        <input type="hidden" name="candidateId" value={candidate.id} />
        <label className="grid gap-1.5 text-xs font-semibold text-[var(--admin-ink-soft)]">Reviewer rationale<textarea name="rationale" required minLength={3} maxLength={2000} rows={3} defaultValue={candidate.reviewer_rationale ?? record.reviewerRationale} className={areaClass} /></label>
        <PendingButton unstyled type="submit" name="decision" value="defer" pendingLabel="Deferring…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--admin-border)] bg-white px-4 text-xs font-semibold text-[var(--admin-muted-strong)]">Defer</PendingButton>
        <PendingButton unstyled type="submit" name="decision" value="reject" pendingLabel="Rejecting…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--admin-danger-border)] bg-white px-4 text-xs font-semibold text-[var(--admin-danger)]">Reject</PendingButton>
        <PendingButton unstyled type="submit" name="decision" value="accept" pendingLabel="Accepting…" disabled={duplicateCheck?.status !== "clear"} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--admin-action)] px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-[var(--admin-border-strong)]">Accept for publication</PendingButton>
      </form>
    </PublicCard>
  );
}

function RefreshCandidateCard({ candidate, record }: { candidate: CandidateRow; record: OrganizationRefreshBundleV1 | OrganizationRefreshBundleV2 | DemandRefreshBundleV1 }) {
  const targetHref = record.candidateKind === "organization_refresh_bundle" ? `/organizations/${record.targetMatch.slug}` : `/demand/${record.targetMatch.slug}`;
  const targetAdminHref = record.candidateKind === "organization_refresh_bundle" ? `/admin/organizations/${record.targetMatch.entityId}/edit` : "/admin/demand-signals";
  const operationSummary = summarizeRefreshOperations(record.operations);
  const sourceById = new Map(record.sources.map((source) => [source.id, source]));
  const executiveRelevanceOperation = record.schemaVersion === "organization_refresh_bundle_v2"
    ? record.operations.find((operation) => operation.operation === "set_field" && operation.field === "executive_relevance_summary")
    : undefined;
  const executiveRelevanceEvidenceIds = new Set(executiveRelevanceOperation?.evidenceIds ?? []);
  const executiveConnectionCount = record.schemaVersion === "organization_refresh_bundle_v2"
    ? record.operations.reduce((count, operation) => {
      if ((operation.operation !== "add_child" && operation.operation !== "update_child") || operation.entityType !== "capability") return count;
      const capability = operation.operation === "add_child" ? operation.value : operation.after;
      const missionMatches = capability && typeof capability === "object" && Array.isArray((capability as Record<string, unknown>).missionMatches)
        ? (capability as Record<string, unknown>).missionMatches as unknown[]
        : [];
      return count + missionMatches.length;
    }, 0)
    : 0;
  return (
    <PublicCard title={`Refresh ${record.targetMatch.slug.replaceAll("-", " ")}`} eyebrow={`${record.candidateKind === "organization_refresh_bundle" ? "Organization" : "Demand"} refresh · ${record.confidence} confidence`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[var(--admin-evidence-soft)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--admin-evidence)]">Refresh existing record</span>
        <Link href={targetAdminHref} className="text-xs font-semibold text-[var(--admin-action)]">Open target record</Link>
        <Link href={targetHref} prefetch={false} target="_blank" className="text-xs font-semibold text-[var(--admin-action)]">Open live profile</Link>
        <span className="text-xs text-[var(--admin-muted)]">Target confidence: {record.targetMatch.confidence} · {record.targetMatch.matchMethods.join(", ")}</span>
      </div>
      <aside className="mt-4 rounded-md border border-[var(--admin-success-border)] bg-[var(--admin-success-soft)] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--admin-success)]">What publication will do</p>
        <p className="mt-2 text-sm font-semibold text-[var(--admin-ink-soft)]">{operationSummary}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--admin-muted-strong)]">The existing record keeps its stable identity. Only the reviewed changes below will be applied.</p>
      </aside>
      {record.schemaVersion === "organization_refresh_bundle_v2" && record.executiveRelevanceSummary ? (
        <ExecutiveRelevancePreview
          summary={record.executiveRelevanceSummary}
          evidence={record.fieldEvidence.filter((item) => executiveRelevanceEvidenceIds.has(item.id))}
          sources={record.sources}
          connectionCount={executiveConnectionCount}
        />
      ) : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <ReviewFact label="Sources in packet" value={`${record.sources.length} source record${record.sources.length === 1 ? "" : "s"} available for review`} />
        <ReviewFact label="Declared source channels" value={`${new Set(record.sourceChannels).size} channel${new Set(record.sourceChannels).size === 1 ? "" : "s"}`} />
        <ReviewFact label="Signal basis" value={record.signalIds.length > 0 ? `${record.signalIds.length} linked material signal${record.signalIds.length === 1 ? "" : "s"}` : "Profile enrichment only; no material signal claimed"} tone={record.signalIds.length > 0 ? "success" : "default"} />
      </div>
      <div className="mt-4 grid gap-3">
        {record.operations.map((operation) => <RefreshOperationReview key={operation.operationId} operation={operation} />)}
      </div>
      <details className="mt-4 rounded-md border border-[var(--admin-evidence-border)] bg-[var(--admin-evidence-soft)] p-3 text-xs">
        <summary className="cursor-pointer font-semibold text-[var(--admin-evidence)]">Review evidence and provenance ({record.fieldEvidence.length} evidence excerpts)</summary>
        <div className="mt-3 grid gap-3">
          {record.fieldEvidence.map((evidence) => {
            const source = sourceById.get(evidence.sourceId);
            return <div key={evidence.id} className="rounded-md border border-[var(--admin-evidence-border)] bg-white p-3"><p className="font-semibold text-[var(--admin-ink-soft)]">{humanizeFieldPath(evidence.fieldPath)} · {evidence.confidence} confidence</p><p className="mt-1 leading-5 text-[var(--admin-muted-strong)]">{evidence.excerpt}</p>{source ? <div className="mt-2 grid gap-1 text-[11px] text-[var(--admin-muted)]"><p><span className="font-semibold text-[var(--admin-ink-soft)]">{source.title}</span> · {source.publisher} · {source.publishedAt ? source.publishedAt.slice(0, 10) : "Undated"} · {source.sourceKind.replaceAll("_", " ")}</p><p>{source.locator}</p><Link href={source.url} target="_blank" rel="noreferrer" className="w-fit font-semibold text-[var(--admin-action)] underline decoration-[var(--atlas-signal)] decoration-2 underline-offset-4">Open source</Link></div> : <p className="mt-2 text-[11px] font-semibold text-[var(--admin-danger)]">Mapped source metadata is missing.</p>}</div>;
          })}
          {record.reviewWarnings?.length ? <div className="rounded-md border border-[var(--admin-warning-border)] bg-[var(--admin-warning-soft)] p-3 text-[var(--admin-warning)]"><p className="font-semibold">Warnings</p><ul className="mt-1 list-disc space-y-1 pl-4">{record.reviewWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div> : null}
        </div>
      </details>
      <details className="mt-3 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-3 text-xs"><summary className="cursor-pointer font-semibold text-[var(--admin-muted-strong)]">Technical payload</summary><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-[11px] leading-5 text-[var(--admin-muted-strong)]">{JSON.stringify({ sourceChannels: record.sourceChannels, sources: record.sources, corroboration: record.corroboration, operations: record.operations }, null, 2)}</pre></details>
      <details className="mt-3 rounded-md border border-[var(--admin-signal-border)] bg-[var(--admin-signal-soft)] p-3 text-xs"><summary className="cursor-pointer font-semibold text-[var(--admin-signal)]">Research decision brief</summary><p className="mt-3 leading-5 text-[var(--admin-ink-soft)]">{record.reviewerRationale}</p></details>
      <TypedCandidateEditor candidateId={candidate.id} record={record} />
      <form action={reviewAtlasCandidate} className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-end">
        <input type="hidden" name="candidateId" value={candidate.id} />
        <label className="grid gap-1.5 text-xs font-semibold text-[var(--admin-ink-soft)]">
          Reviewer decision rationale
          <textarea name="rationale" required minLength={20} maxLength={2000} rows={3} defaultValue={candidate.reviewer_rationale ?? record.reviewerRationale} className="rounded-md border border-[var(--admin-border)] px-3 py-2 text-sm font-normal outline-none focus:border-[var(--admin-action)]" />
          <span className="font-normal leading-5 text-[var(--admin-muted)]">Suggested from the candidate&apos;s evidence-bounded research brief. Review and edit it before accepting; rewrite it to match a defer or reject decision.</span>
        </label>
        <PendingButton unstyled type="submit" name="decision" value="defer" pendingLabel="Deferring…" className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--admin-border)] bg-white px-4 text-xs font-semibold">Defer</PendingButton>
        <PendingButton unstyled type="submit" name="decision" value="reject" pendingLabel="Rejecting…" className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--admin-danger-border)] bg-white px-4 text-xs font-semibold text-[var(--admin-danger)]">Reject</PendingButton>
        <PendingButton unstyled type="submit" name="decision" value="accept" pendingLabel="Accepting…" className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--admin-action)] px-4 text-xs font-semibold text-white">Accept for publication</PendingButton>
      </form>
    </PublicCard>
  );
}

function CanonicalRepairCandidateCard({ candidate, record }: { candidate: CandidateRow; record: OrganizationCanonicalRepairBundleV1 }) {
  const duplicateCheck = candidate.duplicate_check as { status?: string } | null;
  const archiveOperation = record.operations.find((operation) => operation.operation === "archive_organization");
  const successor = archiveOperation?.operation === "archive_organization" ? archiveOperation.successor : null;
  const targetHref = `/organizations/${record.targetMatch.slug}`;
  const actionSummary = record.operations.map((operation) => {
    if (operation.operation === "set_organization_identity") {
      const changes = [
        operation.before.name !== operation.after.name ? `${operation.before.name} → ${operation.after.name}` : null,
        operation.before.entityKind !== operation.after.entityKind ? `${operation.before.entityKind.replaceAll("_", " ")} → ${operation.after.entityKind.replaceAll("_", " ")}` : null,
        operation.before.websiteUrl !== operation.after.websiteUrl ? "website identity" : null,
        JSON.stringify(operation.before.organizationCategories) !== JSON.stringify(operation.after.organizationCategories) ? "classification" : null
      ].filter(Boolean);
      return `Repair organization identity (${changes.join("; ") || "reviewed identity fields"})`;
    }
    if (operation.operation === "add_alias") return `Add ${operation.aliasType.replaceAll("_", " ")} alias “${operation.alias}”`;
    if (operation.operation === "archive_alias") return `Archive alias “${operation.before.alias}”`;
    if (operation.operation === "archive_capability") return `Archive unsupported technology “${operation.before.name}”`;
    if (operation.operation === "set_profile_field") return `${operation.after === null ? "Remove" : "Set"} ${fieldLabel(operation.profileField).toLowerCase()} for the corrected organization kind`;
    return operation.successor
      ? `Archive predecessor and redirect its stable URL to ${operation.successor.name}`
      : `Archive organization and its active child records (${operation.reason.replaceAll("_", " ")})`;
  });

  return (
    <PublicCard title={`Canonical repair · ${record.beforeRecord.organization.name}`} eyebrow={`${record.confidence} confidence · individual review required`}>
      <div className="grid gap-3 sm:grid-cols-3">
        <ReviewFact label="Stable target" value={`${record.targetMatch.slug} · ${record.targetMatch.entityId}`} />
        <ReviewFact label="Exact baseline" value={new Date(record.targetMatch.baselineUpdatedAt).toLocaleString("en-CA", { timeZone: "America/Halifax" })} />
        <ReviewFact label="Duplicate check" value={duplicateCheck?.status === "clear" ? "Canonical target and successor checks clear" : "Resolution required"} tone={duplicateCheck?.status === "clear" ? "success" : "warning"} />
      </div>

      <aside className="mt-4 rounded-md border border-[var(--admin-warning-border)] bg-[var(--admin-warning-soft)] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--admin-warning)]">What publication would do</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-[var(--admin-ink-soft)]">{actionSummary.map((summary) => <li key={summary}>{summary}.</li>)}</ul>
        <p className="mt-2 text-xs leading-5 text-[var(--admin-warning)]">No row is hard-deleted. An archive preserves history, archives the reviewed child graph, and never transfers claims or technologies to a successor.</p>
      </aside>

      <div className="mt-4 grid gap-3">
        {record.operations.map((operation) => (
          <section key={operation.operationId} className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--admin-muted)]">{operation.operation.replaceAll("_", " ")}</p><h3 className="mt-1 text-sm font-bold text-[var(--admin-ink)]">{operation.operationId}</h3></div>
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-[var(--admin-muted-strong)]">{operation.evidenceIds.length} evidence {operation.evidenceIds.length === 1 ? "reference" : "references"}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--admin-muted-strong)]">{operation.reviewerExplanation}</p>
            {operation.operation === "set_organization_identity" ? <div className="mt-3 grid gap-3 lg:grid-cols-2"><JsonPanel label="Current canonical identity" value={operation.before} /><JsonPanel label="Proposed canonical identity" value={{ slug: record.targetMatch.slug, ...operation.after, formerNameAlias: operation.formerNameAlias }} /></div> : null}
            {operation.operation === "set_profile_field" ? <div className="mt-3 grid gap-3 lg:grid-cols-2"><JsonPanel label={`Current ${fieldLabel(operation.profileField)}`} value={operation.before} /><JsonPanel label={`Proposed ${fieldLabel(operation.profileField)}`} value={operation.after} /></div> : null}
            {operation.operation === "archive_alias" ? <JsonPanel label="Alias to archive" value={operation.before} /> : null}
            {operation.operation === "archive_capability" ? <div className="mt-3 grid gap-3 lg:grid-cols-2"><JsonPanel label="Technology to archive" value={operation.before} /><JsonPanel label="Reviewed dependency snapshot" value={operation.dependencies} /></div> : null}
            {operation.operation === "archive_organization" ? <div className="mt-3 grid gap-3 lg:grid-cols-2"><JsonPanel label="Organization to archive" value={operation.before} /><JsonPanel label="Reviewed archive graph" value={{ reason: operation.reason, successor: operation.successor, dependencies: operation.dependencies }} /></div> : null}
          </section>
        ))}
      </div>

      <details className="mt-4 rounded-md border border-[var(--admin-evidence-border)] bg-[var(--admin-evidence-soft)] p-3 text-xs">
        <summary className="cursor-pointer font-semibold text-[var(--admin-evidence)]">Review durable evidence ({record.sources.length} sources · {record.fieldEvidence.length} excerpts)</summary>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {record.operations.flatMap((operation) => operation.evidenceIds.map((evidenceId) => {
            const evidence = record.fieldEvidence.find((item) => item.id === evidenceId);
            const source = evidence ? record.sources.find((item) => item.id === evidence.sourceId) : null;
            return <div key={`${operation.operationId}:${evidenceId}`} className="rounded-md bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--admin-muted)]">{operation.operationId} · {evidence?.fieldPath ?? "Missing evidence mapping"}</p><p className="mt-1 leading-5 text-[var(--admin-muted-strong)]">{evidence?.excerpt ?? "This operation references evidence that is not present in the candidate."}</p>{source ? <div className="mt-2 grid gap-1 text-[11px] text-[var(--admin-muted)]"><p><strong className="text-[var(--admin-ink-soft)]">{source.title}</strong> · {source.publisher} · {source.publishedAt ? source.publishedAt.slice(0, 10) : "Undated"}</p><p>{source.locator}</p><Link href={source.url} target="_blank" rel="noreferrer" className="w-fit font-semibold text-[var(--admin-action)] underline decoration-[var(--atlas-signal)] decoration-2 underline-offset-4">Open source</Link></div> : <p className="mt-2 font-semibold text-[var(--admin-danger)]">Mapped source metadata is missing.</p>}</div>;
          }))}
        </div>
      </details>
      {record.reviewWarnings?.length ? <aside className="mt-3 rounded-md border border-[var(--admin-warning-border)] bg-[var(--admin-warning-soft)] p-3 text-xs text-[var(--admin-warning)]"><p className="font-semibold">Review warnings</p><ul className="mt-1 list-disc space-y-1 pl-4">{record.reviewWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></aside> : null}
      <ReviewerRationale rationale={candidate.reviewer_rationale ?? record.reviewerRationale} />
      <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold"><Link href={targetHref} prefetch={false} target="_blank" className="text-[var(--admin-action)]">Open current public record</Link>{successor ? <Link href={`/organizations/${successor.slug}`} prefetch={false} target="_blank" className="text-[var(--admin-action)]">Open proposed successor</Link> : null}</div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_auto] xl:items-end">
        <form action={reviewAtlasCandidate} className="grid gap-3 rounded-md border border-[var(--admin-warning-border)] bg-[var(--admin-warning-soft)] p-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <input type="hidden" name="candidateId" value={candidate.id} />
          <input type="hidden" name="decision" value="accept" />
          <label className="grid gap-1.5 text-xs font-semibold text-[var(--admin-ink-soft)]">Reviewer decision rationale<textarea name="rationale" required minLength={20} maxLength={2000} rows={3} defaultValue={candidate.reviewer_rationale ?? record.reviewerRationale} className="rounded-md border border-[var(--admin-border)] bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[var(--admin-action)]" /></label>
          <div className="grid gap-2">
            <label className="flex max-w-xs items-start gap-2 text-[11px] leading-4 text-[var(--admin-warning)]"><input type="checkbox" name="repairConfirmation" value="review-canonical-repair" required className="mt-0.5 size-4 accent-[var(--admin-danger)]" /><span>I reviewed the exact baseline, evidence, dependencies, and successor outcome. This advances one repair only; nothing is public yet.</span></label>
            <PendingButton unstyled type="submit" pendingLabel="Accepting repair…" disabled={duplicateCheck?.status !== "clear"} className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--admin-danger)] px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Accept repair for publication</PendingButton>
          </div>
        </form>
        <form action={reviewAtlasCandidate} className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          <input type="hidden" name="candidateId" value={candidate.id} />
          <input type="hidden" name="rationale" value="Canonical repair requires correction or additional research before any publication decision." />
          <PendingButton unstyled type="submit" name="decision" value="defer" pendingLabel="Deferring…" className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--admin-border)] bg-white px-4 text-xs font-semibold">Defer</PendingButton>
          <PendingButton unstyled type="submit" name="decision" value="reject" pendingLabel="Rejecting…" className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--admin-danger-border)] bg-white px-4 text-xs font-semibold text-[var(--admin-danger)]">Reject</PendingButton>
        </form>
      </div>
    </PublicCard>
  );
}

type RefreshOperation = OrganizationRefreshBundleV1["operations"][number] | OrganizationRefreshBundleV2["operations"][number] | DemandRefreshBundleV1["operations"][number];
function summarizeRefreshOperations(operations: RefreshOperation[]) {
  const counts = new Map<string, number>();
  for (const operation of operations) {
    const verb = operation.operation === "add_child" ? "add" : "update";
    const label = operation.operation === "add_child" ? `new ${entityLabel(operation.entityType)}` : operation.operation === "update_child" ? `existing ${entityLabel(operation.entityType)}` : operation.operation === "set_profile_field" ? fieldLabel(operation.profileField).toLowerCase() : fieldLabel(operation.field).toLowerCase();
    const key = `${verb}|${label}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const phrases = [...counts].map(([key, count]) => { const [verb, label] = key.split("|"); return `${verb} ${count} ${count === 1 ? label : pluralizeReviewLabel(label)}`; });
  return phrases.join(", ").replace(/^./, (letter) => letter.toUpperCase()) + ".";
}
function pluralizeReviewLabel(label: string) { return label.endsWith("technology") ? `${label.slice(0, -1)}ies` : `${label}s`; }

function GenericCandidateCard({ candidate }: { candidate: CandidateRow }) {
  return (
    <PublicCard title={candidate.candidate_kind.replaceAll("_", " ")} eyebrow={`${candidate.confidence} confidence · ${candidate.target_entity_type ?? "new candidate"}`}>
      <div className="grid gap-4 lg:grid-cols-2">
        <JsonPanel label="Current record" value={candidate.before_record} empty="New record; no current canonical value." />
        <JsonPanel label="Proposed record" value={candidate.proposed_record} />
      </div>
      <details className="mt-4 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-3 text-xs"><summary className="cursor-pointer font-semibold text-[var(--admin-ink-soft)]">Evidence and duplicate checks</summary><pre className="mt-3 overflow-auto whitespace-pre-wrap text-[11px] leading-5 text-[var(--admin-muted-strong)]">{JSON.stringify({ fieldEvidence: candidate.field_evidence, duplicateCheck: candidate.duplicate_check }, null, 2)}</pre></details>
      {candidate.reviewer_rationale ? <ReviewerRationale rationale={candidate.reviewer_rationale} /> : null}
      <div className="mt-4 rounded-md border border-[var(--admin-warning-border)] bg-[var(--admin-warning-soft)] p-3 text-xs leading-5 text-[var(--admin-warning)]">This candidate type has no complete review and publication interface. It cannot be accepted. Defer it for pipeline repair or reject it.</div>
      <form action={reviewAtlasCandidate} className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-end">
        <input type="hidden" name="candidateId" value={candidate.id} />
        <label className="grid gap-1.5 text-xs font-semibold text-[var(--admin-ink-soft)]">Reviewer rationale<textarea name="rationale" required minLength={3} maxLength={2000} rows={3} defaultValue={candidate.reviewer_rationale ?? undefined} className="rounded-md border border-[var(--admin-border)] px-3 py-2 text-sm font-normal outline-none focus:border-[var(--admin-action)]" /></label>
        <PendingButton unstyled type="submit" name="decision" value="defer" pendingLabel="Deferring…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--admin-border)] bg-white px-4 text-xs font-semibold text-[var(--admin-muted-strong)]">Defer</PendingButton>
        <PendingButton unstyled type="submit" name="decision" value="reject" pendingLabel="Rejecting…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--admin-danger-border)] bg-white px-4 text-xs font-semibold text-[var(--admin-danger)]">Reject</PendingButton>
      </form>
    </PublicCard>
  );
}

function TypedCandidateEditor({ candidateId, record }: { candidateId: string; record: OrganizationBundleV2 | OrganizationBundleV3 | DemandSignalBundleV1 | OrganizationRefreshBundleV1 | OrganizationRefreshBundleV2 | DemandRefreshBundleV1 }) {
  if (record.schemaVersion === "organization_refresh_bundle_v2") {
    return <aside className="mt-4 rounded-md border border-[var(--admin-warning-border)] bg-[var(--admin-warning-soft)] p-3 text-xs leading-5 text-[var(--admin-warning)]"><span className="font-semibold">Validated refresh payload.</span> Changes to sources, evidence, operations, warnings, signals, or generated research rationale must be made in the canonical research artifacts, fully revalidated, and restaged. Use the decision rationale below for the human review decision.</aside>;
  }
  return (
    <details className="mt-4 rounded-md border border-[var(--admin-signal-border)] bg-[var(--admin-signal-soft)] p-4">
      <summary className="cursor-pointer text-sm font-semibold text-[var(--admin-signal)]">Edit complete typed candidate</summary>
      <form action={editTypedResearchCandidate} className="mt-4 grid gap-4">
        <input type="hidden" name="candidateId" value={candidateId} />
        <label className="grid gap-1.5 text-xs font-semibold text-[var(--admin-ink-soft)]">Candidate JSON
          <textarea name="proposedRecordJson" required rows={22} defaultValue={JSON.stringify(record, null, 2)} spellCheck={false} className="rounded-md border border-[var(--admin-border-strong)] bg-white px-3 py-2 font-mono text-[11px] leading-5 text-[var(--admin-ink-soft)] outline-none focus:border-[var(--admin-action)]" />
          <span className="text-[10px] font-normal leading-4 text-[var(--admin-muted)]">The save action validates the typed schema, field evidence, live taxonomy, source portability, and duplicate identity before preserving the edit.</span>
        </label>
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <label className="grid gap-1.5 text-xs font-semibold text-[var(--admin-ink-soft)]">Edit rationale
            <input name="rationale" required minLength={3} maxLength={2000} className="h-10 rounded-md border border-[var(--admin-border-strong)] bg-white px-3 text-sm font-normal outline-none focus:border-[var(--admin-action)]" placeholder="What changed and why" />
          </label>
          <PendingButton unstyled type="submit" pendingLabel="Validating…" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--admin-action)] bg-white px-4 text-xs font-semibold text-[var(--admin-action)]">Validate and save edits</PendingButton>
        </div>
      </form>
    </details>
  );
}

function ReviewerRationale({ rationale }: { rationale: string }) {
  return <aside className="mt-4 rounded-md border border-[var(--admin-signal-border)] bg-[var(--admin-signal-soft)] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--admin-signal)]">Generated reviewer rationale</p><p className="mt-2 text-xs leading-5 text-[var(--admin-ink-soft)]">{rationale}</p></aside>;
}

function ExecutiveRelevancePreview({
  summary,
  evidence,
  sources,
  connectionCount
}: {
  summary: string;
  evidence: Array<{ id: string; sourceId: string; excerpt: string; confidence: string }>;
  sources: Array<{ id: string; title: string; url: string; publisher: string }>;
  connectionCount: number;
}) {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  return (
    <section className="mt-4 rounded-md border border-[var(--admin-signal-border)] bg-[var(--admin-signal-soft)] p-4" aria-labelledby={`decision-snapshot-${evidence[0]?.id ?? "preview"}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--admin-signal)]">Proposed decision snapshot · True North Map assessment</p>
      <h3 id={`decision-snapshot-${evidence[0]?.id ?? "preview"}`} className="mt-2 text-sm font-bold text-[var(--admin-ink)]">Executive relevance summary</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--admin-ink-soft)]">{summary}</p>
      <p className="mt-3 text-[11px] leading-5 text-[var(--admin-muted)]">Synthesized after research coverage review. {connectionCount > 0 ? `${connectionCount} proposed or reviewed connection${connectionCount === 1 ? "" : "s"} appear in this candidate.` : "No new reviewed connection is implied by this summary."}</p>
      <div className="mt-3 grid gap-2">
        {evidence.map((item) => {
          const source = sourceById.get(item.sourceId);
          return (
            <div key={item.id} className="rounded-md bg-white p-3 text-xs">
              <p className="leading-5 text-[var(--admin-muted-strong)]">{item.excerpt}</p>
              {source ? <Link href={source.url} target="_blank" rel="noreferrer" className="mt-2 inline-block font-semibold text-[var(--admin-action)]">{source.publisher} · {source.title}</Link> : null}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] leading-5 text-[var(--admin-warning)]">Accepting advances this proposal to the separate Publication checkpoint. It does not publish the snapshot.</p>
    </section>
  );
}

function QueueTypeSummary({ label, value, detail, tone }: { label: string; value: number; detail: string; tone: "organization" | "demand" | "match" | "refresh" | "repair" }) {
  const toneClasses = tone === "organization"
    ? "border-[var(--admin-signal-border)] bg-[var(--admin-signal-soft)] text-[var(--admin-signal)]"
    : tone === "demand" || tone === "refresh" ? "border-[var(--admin-evidence-border)] bg-[var(--admin-evidence-soft)] text-[var(--admin-evidence)]" : "border-[var(--admin-warning-border)] bg-[var(--admin-warning-soft)] text-[var(--admin-warning-strong)]";
  return <div className={`rounded-lg border p-4 ${toneClasses}`}><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.08em]">{label}</p><strong className="text-2xl">{value}</strong></div><p className="mt-2 text-xs leading-5 text-[var(--admin-muted-strong)]">{detail}</p></div>;
}

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-xs font-semibold text-[var(--admin-ink-soft)]">{label}{children}</label>;
}

function ReviewFact({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "warning" }) {
  const toneClass = tone === "success" ? "text-[var(--admin-success)]" : tone === "warning" ? "text-[var(--admin-warning-action)]" : "text-[var(--admin-ink-soft)]";
  const StatusIcon = tone === "success" ? CheckCircle2 : tone === "warning" ? TriangleAlert : null;
  return <div className="rounded-md border border-[var(--admin-border-subtle)] bg-[var(--admin-surface-soft)] p-3"><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--admin-muted)]">{label}</p><p className={`mt-1 flex items-start gap-1.5 text-xs font-semibold ${toneClass}`}>{StatusIcon ? <StatusIcon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" /> : null}<span>{value}</span></p></div>;
}

function JsonPanel({ label, value, empty }: { label: string; value: unknown; empty?: string }) {
  return <section><h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--admin-muted)]">{label}</h3>{value ? <pre className="mt-2 max-h-80 overflow-auto rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-3 text-[11px] leading-5 text-[var(--admin-ink-soft)]">{JSON.stringify(value, null, 2)}</pre> : <div className="mt-2 rounded-md border border-dashed border-[var(--admin-border)] p-4 text-xs text-[var(--admin-muted)]">{empty ?? "No value"}</div>}</section>;
}
