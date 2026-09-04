import Link from "next/link";
import { AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { AdminNav } from "@/components/atlas/admin-nav";
import { EmptyCoverage, PublicPageShell } from "@/components/atlas/public-page-shell";
import { PendingButton } from "@/components/ui/pending-button";
import { Badge } from "@/components/ui/badge";
import { FlashBanner } from "@/components/ui/flash-banner";
import { StatusChip } from "@/components/ui/status-chip";
import { publishApprovedCandidates, publishApprovedCanonicalRepair, reviewAtlasCandidate } from "@/lib/actions/atlas-admin";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { parseDemandRefreshCandidate, parseDemandSignalCandidate, parseOrganizationCanonicalRepairCandidate, parseOrganizationRefreshCandidate, parseReviewableOrganizationCandidate, type ReviewableCanonicalRepairCandidate, type ReviewableDemandSignalCandidate, type ReviewableRefreshCandidate } from "@/lib/atlas/candidate-schema";
import { findMissingDemandIssuerDependencies } from "@/lib/atlas/demand-issuer-dependencies";
import { buildResearchQueueBatches } from "@/lib/atlas/research-run-queue";
import { loadResearchQueueMetadata } from "@/lib/atlas/research-run-queue-server";
import { researchCandidateContractIssues } from "@/lib/research/deployment-contract";
import { createClient } from "@/lib/supabase/server";

type ApprovedRow = {
  id: string;
  candidate_kind: string;
  schema_version: string | null;
  proposed_record: unknown;
  duplicate_check: unknown;
  confidence: string;
  updated_at: string;
  published_at?: string | null;
};

type ParsedOrganizationCandidate = NonNullable<ReturnType<typeof parseReviewableOrganizationCandidate>>;
type PublishableRow =
  | { candidate: ApprovedRow; kind: "organization"; parsed: ParsedOrganizationCandidate }
  | { candidate: ApprovedRow; kind: "demand"; parsed: ReviewableDemandSignalCandidate }
  | { candidate: ApprovedRow; kind: "refresh"; parsed: ReviewableRefreshCandidate };
type CanonicalRepairRow = { candidate: ApprovedRow; parsed: ReviewableCanonicalRepairCandidate };

const errorMessages: Record<string, string> = {
  selection: "No approved records were available to publish. Refresh the checkpoint and try again.",
  "publication-failed": "Publication was stopped. No selected record was published. Recheck the approved records and try again.",
  "missing-demand-issuer": "Publication is paused because a required issuing authority has not been established in the canonical demand hierarchy.",
  "stale-refresh": "Publication was safely stopped because a live record changed after its refresh was prepared. Rebuild that refresh from the current profile, review it again, and then publish.",
  "stale-child": "Your selection was received. Publication was safely stopped because an approved refresh did not preserve the exact child record it reviewed. No selected record was published, and retrying the unchanged candidate will fail. Return it to research, rebuild it from the current child record, and review it again.",
  "refresh-baseline": "Publication was safely stopped because a refresh did not preserve the exact record version it reviewed. Rebuild that refresh from the current profile before publishing.",
  "activity-pair": "Publication was safely stopped because a refresh would leave Recent activity without its required as-of date. Correct and restage that refresh for human review before publishing it.",
  "canonical-program-conflict": "Your selection was received. Publication was safely stopped because the candidate described an existing canonical program differently. No selected record was published. Rebuild the candidate using the current canonical program record, then review it again.",
  "canonical-repair-selection": "Select one approved canonical repair and confirm its exact outcome before publishing.",
  "canonical-repair-stale": "Publication stopped because the reviewed canonical identity, candidate, successor, or dependency snapshot changed. Rebuild and review the repair from current production data.",
  "canonical-repair-protected": "Publication stopped because a Working List, open connection request, active submission, incoming relationship, or published editorial link still depends on this record.",
  "canonical-repair-collision": "Publication stopped because the proposed name or alias conflicts with another published organization.",
  "canonical-repair-successor": "Publication stopped because the proposed successor is no longer an exact, published, one-hop destination.",
  "canonical-repair-failed": "The canonical repair transaction stopped without changing a public record. Recheck its baseline, dependencies, evidence, and proposed outcome."
};

const staleChildLabels: Record<string, string> = {
  capability: "capability",
  "program-participation": "program participation",
  "organization-relationship": "organization relationship",
  "funding-event": "funding event"
};

function parsePublishableRows(data: unknown[] | null): PublishableRow[] {
  return ((data ?? []) as ApprovedRow[]).flatMap((candidate): PublishableRow[] => {
    if (researchCandidateContractIssues([{ candidate_kind: candidate.candidate_kind, schema_version: candidate.schema_version }]).length) return [];
    if (candidate.candidate_kind === "organization_bundle") {
      const organization = parseReviewableOrganizationCandidate(candidate.proposed_record);
      if (organization) return [{ candidate, kind: "organization", parsed: organization }];
    }
    if (candidate.candidate_kind === "demand_signal_bundle") {
      const demand = parseDemandSignalCandidate(candidate.proposed_record);
      if (demand.success) return [{ candidate, kind: "demand", parsed: demand.data }];
    }
    if (candidate.candidate_kind === "organization_refresh_bundle") {
      const organizationRefresh = parseOrganizationRefreshCandidate(candidate.proposed_record);
      if (organizationRefresh.success) return [{ candidate, kind: "refresh", parsed: organizationRefresh.data }];
    }
    if (candidate.candidate_kind === "demand_refresh_bundle") {
      const demandRefresh = parseDemandRefreshCandidate(candidate.proposed_record);
      if (demandRefresh.success) return [{ candidate, kind: "refresh", parsed: demandRefresh.data }];
    }
    return [];
  });
}

function parseCanonicalRepairRows(data: unknown[] | null): CanonicalRepairRow[] {
  return ((data ?? []) as ApprovedRow[]).flatMap((candidate) => {
    if (candidate.candidate_kind !== "organization_canonical_repair_bundle"
        || researchCandidateContractIssues([{ candidate_kind: candidate.candidate_kind, schema_version: candidate.schema_version }]).length) return [];
    const parsed = parseOrganizationCanonicalRepairCandidate(candidate.proposed_record);
    return parsed.success ? [{ candidate, parsed: parsed.data }] : [];
  });
}

function canonicalRepairOutcome(record: ReviewableCanonicalRepairCandidate) {
  const archive = record.operations.find((operation) => operation.operation === "archive_organization");
  if (archive?.operation === "archive_organization") {
    return archive.successor
      ? { label: `Archive predecessor; redirect to ${archive.successor.name}`, href: `/organizations/${record.targetMatch.slug}`, liveLabel: "Verify predecessor redirect" }
      : { label: "Archive organization and its reviewed active child graph; no redirect", href: null, liveLabel: "Archived without a public destination" };
  }
  const capabilityArchives = record.operations.filter((operation) => operation.operation === "archive_capability").length;
  return {
    label: capabilityArchives
      ? `Preserve stable organization URL and archive ${capabilityArchives} reviewed ${capabilityArchives === 1 ? "technology" : "technologies"}`
      : "Preserve stable URL and apply the reviewed identity, classification, profile-field, or alias correction",
    href: `/organizations/${record.targetMatch.slug}`,
    liveLabel: "Verify repaired organization"
  };
}

function approvedRowLabel(candidate: ApprovedRow) {
  if (!candidate.proposed_record || typeof candidate.proposed_record !== "object") return candidate.id;
  const record = candidate.proposed_record as Record<string, unknown>;
  const targetMatch = record.targetMatch && typeof record.targetMatch === "object"
    ? record.targetMatch as Record<string, unknown>
    : null;
  if (typeof targetMatch?.slug === "string" && targetMatch.slug.trim()) return targetMatch.slug.replaceAll("-", " ");
  const organization = record.organization && typeof record.organization === "object"
    ? record.organization as Record<string, unknown>
    : null;
  if (typeof organization?.name === "string" && organization.name.trim()) return organization.name;
  return candidate.id;
}

function publicationDisplay(row: PublishableRow) {
  if (row.kind === "refresh") {
    return {
      typeLabel: row.parsed.candidateKind === "organization_refresh_bundle" ? "Organization refresh" : "Demand refresh",
      name: row.parsed.targetMatch.slug.replaceAll("-", " "),
      description: row.parsed.reviewerRationale,
      detail: `${row.parsed.operations.length} reviewed ${row.parsed.operations.length === 1 ? "operation" : "operations"} · ${row.parsed.sourceChannels.join(" · ")}`,
      sourceUrl: row.parsed.sources[0]?.url,
      publicHref: row.parsed.candidateKind === "organization_refresh_bundle" ? `/organizations/${row.parsed.targetMatch.slug}` : `/demand/${row.parsed.targetMatch.slug}`
    };
  }
  if (row.kind === "demand") {
    return {
      typeLabel: "Demand signal",
      name: row.parsed.demandSource.title,
      description: row.parsed.demandSource.summary,
      detail: `${row.parsed.issuers.map((issuer) => issuer.name).join(" · ")} · ${row.parsed.demandSource.sourceKind.replaceAll("_", " ")} · ${row.parsed.requirements.length} ${row.parsed.requirements.length === 1 ? "requirement" : "requirements"}`,
      sourceUrl: row.parsed.sources[0]?.url,
      publicHref: row.parsed.requirements[0] ? `/demand/${row.parsed.requirements[0].slug}` : "/demand"
    };
  }
  if (row.parsed.version === "v1") {
    return {
      typeLabel: "Organization",
      name: row.parsed.data.name,
      description: row.parsed.data.description,
      detail: `${row.parsed.data.city}, ${row.parsed.data.provinceTerritory} · ${row.parsed.data.capability.name}`,
      sourceUrl: row.parsed.data.source.url,
      publicHref: `/organizations/${row.parsed.data.slug}`
    };
  }
  return {
    typeLabel: "Organization",
    name: row.parsed.data.organization.name,
    description: row.parsed.data.organization.description,
    detail: [
      [row.parsed.data.organization.primaryLocation.city, row.parsed.data.organization.primaryLocation.provinceTerritory].filter(Boolean).join(", ") || "Location pending",
      row.parsed.data.organization.entityKind.replaceAll("_", " "),
      row.parsed.data.capabilities[0]?.name
        ?? (row.parsed.version === "v3" ? row.parsed.data.programParticipations[0]?.program.name : row.parsed.data.programs[0]?.name)
        ?? row.parsed.data.relationships[0]?.relationshipType.replaceAll("_", " ")
        ?? "organization profile"
    ].join(" · "),
    sourceUrl: row.parsed.data.sources[0]?.url,
    publicHref: `/organizations/${row.parsed.data.organization.slug}`
  };
}

export default async function AdminPublishPage({ searchParams }: { searchParams: Promise<{ error?: string; issuer?: string; candidate?: string; record?: string; childType?: string; child?: string; program?: string; success?: string; run?: string }> }) {
  await requireAtlasStaff("reviewer");
  const params = await searchParams;
  const database = await createClient();
  const approvedQueue = await loadResearchQueueMetadata(database, "approved");
  const approvedBatches = buildResearchQueueBatches(approvedQueue.candidates, approvedQueue.runs);
  const selectedBatchKey = params.run && approvedBatches.some((batch) => batch.key === params.run)
    ? params.run
    : approvedBatches[0]?.key ?? null;
  let approvedQuery = database
    .from("candidate_changes")
    .select("id, candidate_kind, schema_version, proposed_record, duplicate_check, confidence, updated_at")
    .eq("status", "approved")
    .in("candidate_kind", ["organization_bundle", "demand_signal_bundle", "organization_refresh_bundle", "demand_refresh_bundle", "organization_canonical_repair_bundle"])
    .order("updated_at")
    .limit(50);
  if (selectedBatchKey === "unassigned") approvedQuery = approvedQuery.is("research_run_id", null);
  else if (selectedBatchKey) approvedQuery = approvedQuery.eq("research_run_id", selectedBatchKey);
  const [{ data }, { data: publishedData }, { data: issuerRows }] = await Promise.all([
    approvedQuery,
    database
      .from("candidate_changes")
      .select("id, candidate_kind, schema_version, proposed_record, duplicate_check, confidence, updated_at, published_at")
      .eq("status", "published")
      .in("candidate_kind", ["organization_bundle", "demand_signal_bundle", "organization_refresh_bundle", "demand_refresh_bundle", "organization_canonical_repair_bundle"])
      .order("published_at", { ascending: false })
      .limit(12),
    database
      .from("demand_issuers")
      .select("slug")
      .eq("publication_status", "published")
  ]);
  const rows = parsePublishableRows(data);
  const canonicalRepairs = parseCanonicalRepairRows(data);
  const publishableIds = new Set([...rows.map((row) => row.candidate.id), ...canonicalRepairs.map((row) => row.candidate.id)]);
  const invalidApprovedRows = ((data ?? []) as ApprovedRow[]).filter((candidate) => !publishableIds.has(candidate.id));
  const recentPublications = parsePublishableRows(publishedData);
  const recentCanonicalRepairs = parseCanonicalRepairRows(publishedData);
  const missingIssuerDependencies = findMissingDemandIssuerDependencies(
    rows.flatMap((row) => row.kind === "demand" ? [row.parsed] : []),
    (issuerRows ?? []).map((issuer) => issuer.slug)
  );
  const organizationCount = rows.filter((row) => row.kind === "organization").length;
  const demandCount = rows.filter((row) => row.kind === "demand").length;
  const refreshCount = rows.filter((row) => row.kind === "refresh").length;
  const canReturnBlockedCandidate = Boolean(
    params.candidate
    && [
      "stale-child",
      "canonical-program-conflict",
      "canonical-repair-stale",
      "canonical-repair-protected",
      "canonical-repair-collision",
      "canonical-repair-successor",
      "canonical-repair-failed"
    ].includes(params.error ?? "")
    && approvedQueue.candidates.some((candidate) => candidate.id === params.candidate)
  );
  const publicationError = params.error
    ? params.error === "missing-demand-issuer" && params.issuer
      ? `${errorMessages[params.error]} Missing issuer: ${params.issuer.replaceAll("-", " ")}.`
      : ["stale-refresh", "refresh-baseline"].includes(params.error) && params.record
        ? `${errorMessages[params.error]} Affected record: ${params.record.replaceAll("-", " ")}.`
        : params.error === "stale-child" && params.childType && staleChildLabels[params.childType]
          ? `${errorMessages[params.error]} Affected child type: ${staleChildLabels[params.childType]}.`
          : params.error === "canonical-program-conflict" && params.program
            ? `${errorMessages[params.error]} Existing program: ${params.program.replaceAll("-", " ")}.`
            : errorMessages[params.error] ?? "Publication could not be completed."
    : null;

  return (
    <PublicPageShell variant="admin" eyebrow="Editorial operations" title="Publication checkpoint" description="Review the approved list, then publish it with one explicit action. Publication runs as one transaction and stops entirely if any record fails validation." backHref="/admin" backLabel="Atlas operations">
      <AdminNav />
      {publicationError ? (
        <FlashBanner tone="error">
          <div>
            <p>{publicationError}</p>
            {canReturnBlockedCandidate && params.candidate ? (
              <form action={reviewAtlasCandidate} className="mt-3">
                <input type="hidden" name="candidateId" value={params.candidate} />
                <input type="hidden" name="decision" value="reject" />
                <input type="hidden" name="rationale" value="Returned to research because the publication checkpoint found a stale baseline, protected dependency, identity collision, successor conflict, or other canonical contract mismatch that must be rebuilt and reviewed before publication." />
                <PendingButton type="submit" pendingLabel="Returning…" className="h-9 bg-[var(--admin-danger)] px-3 text-xs font-semibold text-white hover:bg-[var(--admin-danger-hover)]">
                  Return selected candidate to research
                </PendingButton>
              </form>
            ) : null}
          </div>
        </FlashBanner>
      ) : null}
      {params.success ? <FlashBanner tone="success">Published {params.success} reviewed {params.success === "1" ? "record" : "records"}. The live records are linked under Recent publications below; no redeploy is required.</FlashBanner> : null}
      {invalidApprovedRows.length ? (
        <FlashBanner tone="error">
          <div>
            <p>{invalidApprovedRows.length} approved {invalidApprovedRows.length === 1 ? "record no longer satisfies" : "records no longer satisfy"} the current publication contract and {invalidApprovedRows.length === 1 ? "is" : "are"} excluded from this checkpoint: {invalidApprovedRows.map(approvedRowLabel).join(", ")}. Return {invalidApprovedRows.length === 1 ? "it" : "them"} to research, restage the corrected proposal, and review it again before publication.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {invalidApprovedRows.map((candidate) => (
                <form key={candidate.id} action={reviewAtlasCandidate}>
                  <input type="hidden" name="candidateId" value={candidate.id} />
                  <input type="hidden" name="decision" value="reject" />
                  <input type="hidden" name="rationale" value="Returned to research because the approved payload no longer satisfies the current publication contract." />
                  <PendingButton type="submit" pendingLabel="Returning…" className="h-9 bg-[var(--admin-danger)] px-3 text-xs font-semibold text-white hover:bg-[var(--admin-danger-hover)]">
                    Return {approvedRowLabel(candidate)} to research
                  </PendingButton>
                </form>
              ))}
            </div>
          </div>
        </FlashBanner>
      ) : null}
      {approvedBatches.length ? (
        <section className="mb-5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-4" aria-labelledby="publication-batches-heading">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--admin-muted)]">Approved queue</p>
          <h2 id="publication-batches-heading" className="mt-1 text-base font-bold text-[var(--admin-ink)]">{approvedQueue.candidates.length} approved candidates across {approvedBatches.length} research {approvedBatches.length === 1 ? "batch" : "batches"}</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">Each research batch stays distinct at publication. Select a batch below; the checked records in that batch publish as one all-or-nothing transaction.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {approvedBatches.map((batch) => (
              <Link key={batch.key} href={`/admin/publish?run=${encodeURIComponent(batch.key)}`} className={`rounded-md border px-3 py-2 text-xs font-semibold no-underline ${batch.key === selectedBatchKey ? "border-[var(--admin-action)] bg-[var(--admin-action)] text-white" : "border-[var(--admin-border)] bg-white text-[var(--admin-ink-soft)]"}`}>
                {batch.label} · {batch.pendingCount}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      {rows.length ? (
        <form action={publishApprovedCandidates}>
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-[var(--admin-warning-border)] bg-[var(--admin-warning-soft)] p-4 text-sm leading-6 text-[var(--admin-warning)]">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <p><strong>{rows.length} approved {rows.length === 1 ? "record is" : "records are"} ready in this research batch: {organizationCount} new {organizationCount === 1 ? "organization" : "organizations"}, {demandCount} new demand {demandCount === 1 ? "signal" : "signals"}, and {refreshCount} {refreshCount === 1 ? "refresh" : "refreshes"}.</strong> Publishing creates or updates only the reviewed records with their sources, evidence, and citations. It does not send messages or introductions.</p>
          </div>
          {missingIssuerDependencies.length ? (
            <div className="mb-4 rounded-lg border border-[var(--admin-danger-border)] bg-[var(--admin-danger-soft)] p-4 text-sm leading-6 text-[var(--admin-danger)]">
              <strong>The named demand records need their issuer hierarchy completed before they can be published.</strong> Unselect them to publish an unrelated ready subset now.
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {missingIssuerDependencies.map((dependency) => (
                  <li key={`${dependency.parentIssuerSlug}-${dependency.demandSourceTitle}`}><span className="font-semibold">{dependency.parentIssuerSlug.replaceAll("-", " ")}</span> is required as the parent of {dependency.issuerName} for “{dependency.demandSourceTitle}”. Establish the canonical issuer first, then refresh this checkpoint.</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="space-y-3">
            {rows.map(({ candidate, kind, parsed }) => {
              const display = publicationDisplay({ candidate, kind, parsed } as PublishableRow);
              const duplicateCheck = candidate.duplicate_check as { status?: string } | null;
              return (
                <label key={candidate.id} className="grid cursor-pointer gap-3 rounded-lg border border-[var(--admin-border)] bg-white p-4 md:grid-cols-[auto_1fr_auto] md:items-start">
                  <input type="checkbox" name="candidateId" value={candidate.id} defaultChecked className="mt-1 size-4 accent-[var(--admin-action)]" />
                  <div>
                    <Badge className="mb-2" tone={kind === "demand" ? "evidence" : "signal"}>{display.typeLabel}</Badge>
                    <span className="block text-sm font-bold text-[var(--admin-ink)]">{display.name}</span>
                    <span className="mt-1 block text-xs leading-5 text-[var(--admin-muted)]">{display.detail}</span>
                    <span className="mt-2 block text-xs leading-5 text-[var(--admin-muted-strong)]">{display.description}</span>
                    {display.sourceUrl ? <a href={display.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--admin-action)]">Review source <ExternalLink className="size-3" /></a> : null}
                  </div>
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--admin-success)]"><CheckCircle2 className="size-4" /><StatusChip status={candidate.confidence} label={`${candidate.confidence} confidence`} /> · {duplicateCheck?.status === "clear" ? "duplicate check clear" : "duplicate resolved"}</span>
                </label>
              );
            })}
          </div>
          <div className="mt-5 flex flex-col gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-xs leading-5 text-[var(--admin-muted)]">Choose the approved records to publish now. Validation, stale-baseline checks, and audit logging run against only that selected set, and the selected set remains one all-or-nothing transaction.</p>
            <PendingButton type="submit" pendingLabel="Publishing…" className="h-11 shrink-0 bg-[var(--admin-danger)] px-5 text-sm font-semibold text-white hover:bg-[var(--admin-danger-hover)] disabled:cursor-not-allowed disabled:opacity-60">
              Publish selected records
            </PendingButton>
          </div>
        </form>
      ) : null}

      {canonicalRepairs.length ? (
        <section className="mt-6" aria-labelledby="canonical-repairs-heading">
          <div className="mb-4 rounded-lg border border-[var(--admin-warning-border)] bg-[var(--admin-warning-soft)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--admin-warning)]">Individual canonical checkpoint</p>
            <h2 id="canonical-repairs-heading" className="mt-1 text-base font-bold text-[var(--admin-ink)]">{canonicalRepairs.length} approved canonical {canonicalRepairs.length === 1 ? "repair" : "repairs"}</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--admin-warning)]">Canonical repairs never enter bulk publication. Publish one exact reviewed target at a time after confirming its live baseline, dependencies, and destination.</p>
          </div>
          <div className="space-y-3">
            {canonicalRepairs.map(({ candidate, parsed }) => {
              const outcome = canonicalRepairOutcome(parsed);
              return <article key={candidate.id} className="grid gap-4 rounded-lg border border-[var(--admin-danger-border)] bg-white p-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <div><Badge className="mb-2" tone="warning">Canonical repair</Badge><h3 className="text-sm font-bold text-[var(--admin-ink)]">{parsed.beforeRecord.organization.name}</h3><p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">Stable slug: {parsed.targetMatch.slug} · exact baseline {new Date(parsed.targetMatch.baselineUpdatedAt).toLocaleString("en-CA", { timeZone: "America/Halifax" })}</p><p className="mt-2 text-xs leading-5 text-[var(--admin-muted-strong)]">{outcome.label}. Operations: {parsed.operations.map((operation) => operation.operation.replaceAll("_", " ")).join(", ")}.</p></div>
                <div className="grid max-w-sm gap-3">
                  <form action={publishApprovedCanonicalRepair} className="grid gap-2">
                    <input type="hidden" name="candidateId" value={candidate.id} />
                    <label className="flex items-start gap-2 text-[11px] leading-4 text-[var(--admin-danger)]"><input type="checkbox" name="confirmation" value="publish-canonical-repair" required className="mt-0.5 size-4 accent-[var(--admin-danger)]" /><span>I confirm this exact target, baseline, dependency graph, and successor outcome. Publish this repair only.</span></label>
                    <PendingButton type="submit" pendingLabel="Publishing repair…" className="h-11 bg-[var(--admin-danger)] px-5 text-sm font-semibold text-white hover:bg-[var(--admin-danger-hover)]">Publish this canonical repair</PendingButton>
                  </form>
                  <form action={reviewAtlasCandidate}>
                    <input type="hidden" name="candidateId" value={candidate.id} />
                    <input type="hidden" name="decision" value="defer" />
                    <input type="hidden" name="rationale" value="Returned to Review from the publication checkpoint for reconsideration of this same immutable canonical-repair packet." />
                    <PendingButton type="submit" pendingLabel="Returning…" className="h-10 w-full border border-[var(--admin-border)] bg-white px-4 text-xs font-semibold text-[var(--admin-muted-strong)]">Return to Review</PendingButton>
                    <p className="mt-1 text-[10px] leading-4 text-[var(--admin-muted)]">This reopens the same packet. Reject it in Review before staging replacement research or a fresh baseline.</p>
                  </form>
                </div>
              </article>;
            })}
          </div>
        </section>
      ) : null}

      {!rows.length && !canonicalRepairs.length ? <EmptyCoverage title="No records are ready to publish" detail="Accept fully reviewed candidates in the review queue. Standard records and individually governed canonical repairs will then appear here for separate publication decisions." /> : null}

      {recentPublications.length ? (
        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--admin-muted)]">Publication confirmation</p><h2 className="mt-1 text-lg font-bold text-[var(--admin-ink)]">Recent publications</h2></div>
            <p className="text-xs text-[var(--admin-muted)]">Open a record to verify exactly what is live.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {recentPublications.map((row) => {
              const display = publicationDisplay(row);
              return <div key={row.candidate.id} className="rounded-lg border border-[var(--admin-border)] bg-white p-4"><div className="flex items-start justify-between gap-3"><div><span className={`inline-flex rounded px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${row.kind === "demand" ? "bg-[var(--admin-signal-soft)] text-[var(--admin-signal)]" : "bg-[var(--admin-signal-soft)] text-[var(--admin-signal)]"}`}>{display.typeLabel}</span><h3 className="mt-3 text-sm font-bold text-[var(--admin-ink)]">{display.name}</h3><p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">{display.detail}</p></div><CheckCircle2 className="size-5 shrink-0 text-[var(--admin-success)]" /></div><Link href={display.publicHref} prefetch={false} target="_blank" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--admin-action)]">View live {row.kind === "demand" ? "demand signal" : row.kind === "refresh" ? "updated record" : "organization"} <ExternalLink className="size-3" /></Link></div>;
            })}
          </div>
        </section>
      ) : null}
      {recentCanonicalRepairs.length ? <section className="mt-8"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--admin-muted)]">Recent canonical repairs</p><div className="mt-3 grid gap-3 md:grid-cols-2">{recentCanonicalRepairs.map(({ candidate, parsed }) => { const outcome = canonicalRepairOutcome(parsed); return <div key={candidate.id} className="rounded-lg border border-[var(--admin-border)] bg-white p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-bold text-[var(--admin-ink)]">{parsed.beforeRecord.organization.name}</h3><p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">{outcome.label}</p></div><CheckCircle2 className="size-5 shrink-0 text-[var(--admin-success)]" /></div>{outcome.href ? <Link href={outcome.href} prefetch={false} target="_blank" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--admin-action)]">{outcome.liveLabel} <ExternalLink className="size-3" /></Link> : <p className="mt-4 text-xs font-semibold text-[var(--admin-muted-strong)]">{outcome.liveLabel}</p>}</div>; })}</div></section> : null}
    </PublicPageShell>
  );
}
