import Link from "next/link";
import { AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { AdminNav } from "@/components/atlas/admin-nav";
import { EmptyCoverage, PublicPageShell } from "@/components/atlas/public-page-shell";
import { PendingButton } from "@/components/ui/pending-button";
import { Badge } from "@/components/ui/badge";
import { FlashBanner } from "@/components/ui/flash-banner";
import { StatusChip } from "@/components/ui/status-chip";
import { publishApprovedCandidates } from "@/lib/actions/atlas-admin";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { parseDemandSignalCandidate, parseReviewableOrganizationCandidate, type ReviewableDemandSignalCandidate } from "@/lib/atlas/candidate-schema";
import { createClient } from "@/lib/supabase/server";

type ApprovedRow = {
  id: string;
  candidate_kind: string;
  proposed_record: unknown;
  duplicate_check: unknown;
  confidence: string;
  updated_at: string;
  published_at?: string | null;
};

type ParsedOrganizationCandidate = NonNullable<ReturnType<typeof parseReviewableOrganizationCandidate>>;
type PublishableRow =
  | { candidate: ApprovedRow; kind: "organization"; parsed: ParsedOrganizationCandidate }
  | { candidate: ApprovedRow; kind: "demand"; parsed: ReviewableDemandSignalCandidate };

const errorMessages: Record<string, string> = {
  selection: "No approved records were available to publish. Refresh the checkpoint and try again.",
  "publication-failed": "Publication was stopped. No selected record was published. Recheck the approved records and try again."
};

function parsePublishableRows(data: unknown[] | null): PublishableRow[] {
  return ((data ?? []) as ApprovedRow[]).flatMap((candidate): PublishableRow[] => {
    const organization = parseReviewableOrganizationCandidate(candidate.proposed_record);
    if (organization) return [{ candidate, kind: "organization", parsed: organization }];
    const demand = parseDemandSignalCandidate(candidate.proposed_record);
    if (demand.success) return [{ candidate, kind: "demand", parsed: demand.data }];
    return [];
  });
}

function publicationDisplay(row: PublishableRow) {
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
      row.parsed.data.capabilities[0]?.name ?? row.parsed.data.programs[0]?.name ?? row.parsed.data.relationships[0]?.relationshipType.replaceAll("_", " ") ?? "organization profile"
    ].join(" · "),
    sourceUrl: row.parsed.data.sources[0]?.url,
    publicHref: `/organizations/${row.parsed.data.organization.slug}`
  };
}

export default async function AdminPublishPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  await requireAtlasStaff("reviewer");
  const params = await searchParams;
  const database = await createClient();
  const [{ data }, { data: publishedData }] = await Promise.all([
    database
      .from("candidate_changes")
      .select("id, candidate_kind, proposed_record, duplicate_check, confidence, updated_at")
      .eq("status", "approved")
      .in("candidate_kind", ["organization_bundle", "demand_signal_bundle"])
      .order("updated_at")
      .limit(50),
    database
      .from("candidate_changes")
      .select("id, candidate_kind, proposed_record, duplicate_check, confidence, updated_at, published_at")
      .eq("status", "published")
      .in("candidate_kind", ["organization_bundle", "demand_signal_bundle"])
      .order("published_at", { ascending: false })
      .limit(12)
  ]);
  const rows = parsePublishableRows(data);
  const recentPublications = parsePublishableRows(publishedData);
  const organizationCount = rows.filter((row) => row.kind === "organization").length;
  const demandCount = rows.filter((row) => row.kind === "demand").length;

  return (
    <PublicPageShell variant="admin" eyebrow="Editorial operations" title="Publication checkpoint" description="Review the approved list, then publish it with one explicit action. Publication runs as one transaction and stops entirely if any record fails validation." backHref="/admin" backLabel="Atlas operations">
      <AdminNav />
      {params.error ? <FlashBanner tone="error">{errorMessages[params.error] ?? "Publication could not be completed."}</FlashBanner> : null}
      {params.success ? <FlashBanner tone="success">Published {params.success} reviewed {params.success === "1" ? "record" : "records"}. The live records are linked under Recent publications below; no redeploy is required.</FlashBanner> : null}
      {rows.length ? (
        <form action={publishApprovedCandidates}>
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-[var(--admin-warning-border)] bg-[var(--admin-warning-soft)] p-4 text-sm leading-6 text-[var(--admin-warning)]">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <p><strong>{rows.length} approved {rows.length === 1 ? "record is" : "records are"} ready: {organizationCount} {organizationCount === 1 ? "organization" : "organizations"} and {demandCount} demand {demandCount === 1 ? "signal" : "signals"}.</strong> Publishing creates the reviewed public records with their sources, evidence, and citations. It does not send messages or introductions.</p>
          </div>
          <div className="space-y-3">
            {rows.map(({ candidate, kind, parsed }) => {
              const display = publicationDisplay({ candidate, kind, parsed } as PublishableRow);
              const duplicateCheck = candidate.duplicate_check as { status?: string } | null;
              return (
                <div key={candidate.id} className="grid gap-3 rounded-lg border border-[var(--admin-border)] bg-white p-4 md:grid-cols-[1fr_auto] md:items-start">
                  <input type="hidden" name="candidateId" value={candidate.id} />
                  <div>
                    <Badge className="mb-2" tone={kind === "demand" ? "evidence" : "signal"}>{display.typeLabel}</Badge>
                    <span className="block text-sm font-bold text-[var(--admin-ink)]">{display.name}</span>
                    <span className="mt-1 block text-xs leading-5 text-[var(--admin-muted)]">{display.detail}</span>
                    <span className="mt-2 block text-xs leading-5 text-[var(--admin-muted-strong)]">{display.description}</span>
                    {display.sourceUrl ? <a href={display.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--admin-action)]">Review source <ExternalLink className="size-3" /></a> : null}
                  </div>
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--admin-success)]"><CheckCircle2 className="size-4" /><StatusChip status={candidate.confidence} label={`${candidate.confidence} confidence`} /> · {duplicateCheck?.status === "clear" ? "duplicate check clear" : "duplicate resolved"}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex flex-col gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-xs leading-5 text-[var(--admin-muted)]">This publishes every approved record shown above. Validation and audit logging still run before the transaction completes.</p>
            <PendingButton type="submit" pendingLabel="Publishing…" className="h-11 shrink-0 bg-[var(--admin-danger)] px-5 text-sm font-semibold text-white hover:bg-[var(--admin-danger-hover)]">
              Publish {rows.length} approved {rows.length === 1 ? "record" : "records"}
            </PendingButton>
          </div>
        </form>
      ) : <EmptyCoverage title="No records are ready to publish" detail="Accept fully reviewed organization or demand-signal candidates in the review queue. They will then appear here for a separate publication decision." />}

      {recentPublications.length ? (
        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--admin-muted)]">Publication confirmation</p><h2 className="mt-1 text-lg font-bold text-[var(--admin-ink)]">Recent publications</h2></div>
            <p className="text-xs text-[var(--admin-muted)]">Open a record to verify exactly what is live.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {recentPublications.map((row) => {
              const display = publicationDisplay(row);
              return <div key={row.candidate.id} className="rounded-lg border border-[var(--admin-border)] bg-white p-4"><div className="flex items-start justify-between gap-3"><div><span className={`inline-flex rounded px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${row.kind === "demand" ? "bg-[var(--admin-signal-soft)] text-[var(--admin-signal)]" : "bg-[var(--admin-signal-soft)] text-[var(--admin-signal)]"}`}>{display.typeLabel}</span><h3 className="mt-3 text-sm font-bold text-[var(--admin-ink)]">{display.name}</h3><p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">{display.detail}</p></div><CheckCircle2 className="size-5 shrink-0 text-[var(--admin-success)]" /></div><Link href={display.publicHref} target="_blank" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--admin-action)]">View live {row.kind === "demand" ? "demand signal" : "organization"} <ExternalLink className="size-3" /></Link></div>;
            })}
          </div>
        </section>
      ) : null}
    </PublicPageShell>
  );
}
