import path from "node:path";
import Link from "next/link";
import type { ReactNode } from "react";
import { Check, Clock3, DatabaseZap, FileCheck2, GitCompareArrows, WandSparkles, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { SnapshotStrip, WorkspaceEmptyState } from "@/components/workspace/workspace-primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { getReviewQueue } from "@/lib/data/repository";
import { promoteIngestionCandidate, reviewChangeRequest } from "@/lib/actions/review";
import { formatDate, formatFieldLabel } from "@/lib/utils";
import {
  formatCandidateValidationReport,
  loadCandidateBatches,
  validateCandidateBatch,
  type CandidateBatch,
  type CandidateValidationResult
} from "../../../scripts/ingestion-candidates";
import { loadSeedData } from "../../../scripts/seed-utils";

async function getIngestionCandidateReviews() {
  const seedData = await loadSeedData();
  const batches = await loadCandidateBatches();

  return Promise.all(
    batches.map(async ({ batch, filePath }) => ({
      batch,
      filePath,
      relativePath: path.relative(process.cwd(), filePath),
      result: await validateCandidateBatch(batch, filePath, seedData)
    }))
  );
}

export default async function ReviewPage() {
  const profile = await requireProfile("reviewer");
  const queue = await getReviewQueue();
  const candidateReviews = await getIngestionCandidateReviews();
  const aiPending = queue.pending.filter((request) => request.originType === "ai").length;
  const refreshRequests = queue.pending.filter((request) => request.isRefreshRequest).length;
  const readyCandidates = candidateReviews.filter(
    (candidate) => !candidate.result.promoted && candidate.result.errors.length === 0
  ).length;

  return (
    <AppShell profile={profile}>
      <SectionHeading
        title="Review Queue"
        description="High-impact changes route here before they become live in the validated dataset."
        eyebrow="Governance workspace"
        breadcrumbs={[
          { label: "Home", href: "/app" },
          { label: "Review" }
        ]}
        actions={
          <Link href="/help/trust-and-review" className="text-sm font-medium">
            Review guide
          </Link>
        }
      />
      <Card variant="hero" className="mb-5 rounded-[36px]">
        <CardHeader className="space-y-3">
          <div className="workspace-kicker">Trust boundary</div>
          <CardTitle>Review higher-impact edits without losing the record context behind the change.</CardTitle>
          <p className="max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
            Proposed edits, AI runs, evidence, and before-versus-after comparisons stay together so approval remains evidence-backed rather than opaque.
          </p>
        </CardHeader>
        <CardContent>
          <SnapshotStrip
            items={[
              {
                label: "Pending requests",
                value: String(queue.pending.length),
                detail: "Changes waiting for reviewer action."
              },
              {
                label: "AI-suggested",
                value: String(aiPending),
                detail: "Requests originating from enrichment or derived runs."
              },
              {
                label: "Refresh requests",
                value: String(refreshRequests),
                detail: "Requests asking for refreshed records instead of direct field diffs."
              },
              {
                label: "Human-submitted",
                value: String(queue.pending.length - aiPending),
                detail: "Direct edits or user-originated changes."
              },
              {
                label: "Ingestion batches",
                value: String(candidateReviews.length),
                detail: "Research candidate batches staged for review."
              },
              {
                label: "Ready to promote",
                value: String(readyCandidates),
                detail: "Candidate batches passing guardrails and awaiting approval."
              }
            ]}
          />
        </CardContent>
      </Card>

      <Card variant="strong" className="mb-5 rounded-[32px]">
        <CardHeader className="space-y-3">
          <div className="workspace-kicker">Research ingestion</div>
          <CardTitle>Review candidate batches before they become validated seed data.</CardTitle>
          <p className="max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
            Candidate records stay staged until a reviewer promotes them. Promotion validates the batch, upserts rows into Supabase when configured, appends the seed CSVs, and writes a promotion log.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {candidateReviews.map((candidate) => (
            <CandidateReviewCard key={candidate.batch.batchId} candidate={candidate} />
          ))}
          {!candidateReviews.length ? (
            <WorkspaceEmptyState message="No staged ingestion candidate batches are available." />
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {queue.pending.map((request) => (
          <Card key={request.id} variant="strong" className="rounded-[32px]">
            <CardContent className="space-y-5 pt-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-lg font-semibold">{request.entityLabel}</div>
                    {request.entityHref ? (
                      <Link href={request.entityHref} className="text-sm font-medium">
                        Open record
                      </Link>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    <Badge tone="secondary">{request.entityType}</Badge>
                    {request.entityContext ? <span>{request.entityContext}</span> : null}
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)]">
                    Requested by {request.requesterName} on {formatDate(request.createdAt)}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="secondary">{request.status}</Badge>
                  <Badge tone={request.originType === "ai" ? "info" : "muted"}>
                    {request.originType === "ai" ? (
                      <WandSparkles className="mr-1.5 size-3" />
                    ) : null}
                    {request.originLabel}
                  </Badge>
                  {request.isRefreshRequest ? (
                    <Badge tone="muted">
                      <Clock3 className="mr-1.5 size-3" />
                      Refresh request
                    </Badge>
                  ) : (
                    <Badge tone="muted">
                      <GitCompareArrows className="mr-1.5 size-3" />
                      {request.changedFieldDetails.length} changed field
                      {request.changedFieldDetails.length === 1 ? "" : "s"}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {request.changedFieldDetails.map((field) => (
                  <Badge key={`${request.id}-${field.fieldName}`} tone="secondary">
                    {field.label}
                  </Badge>
                ))}
              </div>

              <div className="workspace-subtle rounded-[26px] p-4">
                <div className="text-sm font-semibold">Origin and provenance</div>
                <div className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {request.originSummary}
                </div>
                {request.aiRunContext ? (
                  <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="info">Prompt {request.aiRunContext.promptVersion}</Badge>
                      <Badge tone="muted">Run {request.aiRunContext.status}</Badge>
                      <Badge tone="muted">
                        Source {request.aiRunContext.sourceLabel}
                      </Badge>
                    </div>
                    <div className="text-sm text-[var(--muted-foreground)]">
                      Generated {formatDate(request.aiRunContext.createdAt)}
                    </div>
                    {request.aiRunContext.resultSummary ? (
                      <div className="rounded-3xl border border-sky-100 bg-sky-50/80 p-4 text-sm text-sky-900">
                        <div className="font-semibold">Worker summary</div>
                        <div className="mt-1">{request.aiRunContext.resultSummary}</div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="space-y-3">
                {request.changedFieldDetails.map((field) => (
                  <div key={`${request.id}-${field.fieldName}-diff`} className="workspace-subtle rounded-[26px] p-4">
                    <div className="text-sm font-semibold">{field.label}</div>
                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      <DiffColumn title="Before" value={field.beforeValue} />
                      <DiffColumn title="After" value={field.afterValue} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="workspace-subtle rounded-[26px] p-4">
                <div className="text-sm font-semibold">Supporting evidence</div>
                {request.supportingCitations.length ? (
                  <div className="mt-3 space-y-3">
                    {request.supportingCitations.map((citation, index) => (
                      <a
                        key={`${request.id}-${citation.sourceUrl}-${index}`}
                        href={citation.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-3xl border border-[var(--border)] bg-white/80 p-4 transition hover:border-[var(--primary)]/25 hover:bg-white"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-medium">{citation.sourceTitle}</div>
                          <Badge tone="secondary">{citation.publisher}</Badge>
                          <Badge tone="muted">{formatFieldLabel(citation.fieldName)}</Badge>
                        </div>
                        <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                          {formatDate(citation.publishedAt)}
                        </div>
                        <div className="mt-2 text-sm text-[var(--muted-foreground)]">
                          {citation.excerpt}
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-[var(--muted-foreground)]">
                    No supporting snippets are attached to this change yet.
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <form action={reviewChangeRequest.bind(null, request.id, "approved")}>
                  <Button type="submit">
                    <Check className="mr-2 size-4" />
                    Approve change
                  </Button>
                </form>
                <form action={reviewChangeRequest.bind(null, request.id, "rejected")}>
                  <Button type="submit" variant="outline">
                    <X className="mr-2 size-4" />
                    Reject change
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ))}
        {!queue.pending.length ? (
          <WorkspaceEmptyState message="No pending requests right now." />
        ) : null}
      </div>
    </AppShell>
  );
}

function CandidateReviewCard({
  candidate
}: {
  candidate: {
    batch: CandidateBatch;
    filePath: string;
    relativePath: string;
    result: CandidateValidationResult;
  };
}) {
  const { batch, result } = candidate;
  const isBlocked = result.errors.length > 0;
  const isPromoted = result.promoted;

  return (
    <div className="workspace-subtle rounded-[28px] p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-lg font-semibold">{batch.title}</div>
            <Badge tone={isPromoted ? "success" : isBlocked ? "danger" : "info"}>
              {isPromoted ? "Promoted" : isBlocked ? "Blocked" : "Ready for review"}
            </Badge>
            <Badge tone="muted">{batch.status}</Badge>
          </div>
          <p className="max-w-4xl text-sm leading-7 text-[var(--muted-foreground)]">
            {batch.researchScope.description}
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge tone="secondary">{result.counts.companies} companies</Badge>
            <Badge tone="secondary">{result.counts.capabilities} capabilities</Badge>
            <Badge tone="secondary">{result.counts.mappings} mappings</Badge>
            <Badge tone="secondary">{result.counts.sources} sources</Badge>
            <Badge tone="secondary">{result.counts.fieldCitations} citations</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={promoteIngestionCandidate}>
            <input type="hidden" name="candidateFilePath" value={candidate.relativePath} />
            <Button type="submit" disabled={isBlocked || isPromoted}>
              <DatabaseZap className="size-4" />
              {isPromoted ? "Already promoted" : "Promote batch"}
            </Button>
          </form>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <MiniPanel title="Validation">
          <div className="flex flex-wrap gap-2">
            <Badge tone={result.errors.length ? "danger" : "success"}>{result.errors.length} errors</Badge>
            <Badge tone={result.warnings.length ? "info" : "muted"}>{result.warnings.length} warnings</Badge>
          </div>
          {isPromoted ? (
            <div className="mt-2 text-xs text-[var(--muted-foreground)]">
              Promotion log: {path.relative(process.cwd(), result.promotionPath)}
            </div>
          ) : null}
        </MiniPanel>
        <MiniPanel title="Use Cases">
          <div className="flex flex-wrap gap-2">
            {result.touchedUseCases.map((useCaseId) => (
              <Badge key={useCaseId} tone="secondary">
                {useCaseId}
              </Badge>
            ))}
          </div>
        </MiniPanel>
        <MiniPanel title="Domains">
          <div className="flex flex-wrap gap-2">
            {result.touchedDomains.map((domainId) => (
              <Badge key={domainId} tone="secondary">
                {domainId}
              </Badge>
            ))}
          </div>
        </MiniPanel>
      </div>

      <details className="mt-4 rounded-[24px] border border-[var(--border)] bg-white/75 p-4">
        <summary className="cursor-pointer text-sm font-semibold">
          Open in-app review packet
        </summary>
        <div className="mt-4 space-y-5">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <FileCheck2 className="size-4" />
              Reviewer checklist
            </div>
            <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <li>Company records are real organizations and are not duplicates of existing seed records.</li>
              <li>Capability summaries are public-source grounded and do not imply classified alignment.</li>
              <li>Use-case mappings are realistic and not stretched to fill the catalog.</li>
              <li>High relevance or high defence relevance mappings have enough evidence to justify confidence.</li>
              <li>Source URLs are canonical and useful for public-source traceability.</li>
            </ul>
          </div>

          {(result.errors.length > 0 || result.warnings.length > 0) ? (
            <pre className="overflow-x-auto rounded-[24px] border border-[var(--border)] bg-white p-4 text-xs leading-6 text-[var(--foreground)]">
              {formatCandidateValidationReport([result])}
            </pre>
          ) : null}

          <ReviewTable
            title="Companies"
            headers={["Company", "Geography", "Confidence", "Rationale"]}
            rows={batch.companies.map((company) => [
              company.name,
              company.geography,
              company.confidence,
              company.research_rationale
            ])}
          />
          <ReviewTable
            title="Capabilities"
            headers={["Capability", "Company", "Domain", "Confidence"]}
            rows={batch.capabilities.map((capability) => {
              const company = batch.companies.find((item) => item.id === capability.company_id);

              return [
                capability.name,
                company?.name ?? capability.company_id,
                capability.domain_id,
                capability.confidence
              ];
            })}
          />
          <ReviewTable
            title="Use-Case Mappings"
            headers={["Capability", "Use case", "Pathway", "Relevance", "Defence", "Why it matters"]}
            rows={batch.capabilityUseCases.map((mapping) => {
              const capability = batch.capabilities.find((item) => item.id === mapping.capability_id);

              return [
                capability?.name ?? mapping.capability_id,
                mapping.use_case_id,
                mapping.pathway,
                mapping.relevance_band,
                mapping.defence_relevance,
                mapping.why_it_matters
              ];
            })}
          />
          <ReviewTable
            title="Sources"
            headers={["Source", "Publisher", "Type", "URL"]}
            rows={batch.sources.map((source) => [
              source.title,
              source.publisher,
              source.source_type,
              source.url
            ])}
          />
        </div>
      </details>
    </div>
  );
}

function MiniPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-white/75 p-4">
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
        {title}
      </div>
      {children}
    </div>
  );
}

function ReviewTable({
  title,
  headers,
  rows
}: {
  title: string;
  headers: string[];
  rows: string[][];
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-semibold">{title}</div>
      <div className="overflow-x-auto rounded-[24px] border border-[var(--border)] bg-white/80">
        <table className="min-w-full divide-y divide-[var(--border)] text-left text-sm">
          <thead className="bg-[var(--secondary)]/45 text-xs uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {rows.map((row, rowIndex) => (
              <tr key={`${title}-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${title}-${rowIndex}-${cellIndex}`} className="max-w-[520px] px-4 py-3 align-top text-[var(--foreground)]">
                    {cell.startsWith("https://") ? (
                      <a href={cell} target="_blank" rel="noreferrer">
                        {cell}
                      </a>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DiffColumn({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
        {title}
      </div>
      <div className="mt-3 whitespace-pre-wrap text-sm text-[var(--foreground)]">{value}</div>
    </div>
  );
}
