import Link from "next/link";
import { Check, Clock3, GitCompareArrows, WandSparkles, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { getReviewQueue } from "@/lib/data/repository";
import { reviewChangeRequest } from "@/lib/actions/review";
import { formatDate, formatFieldLabel } from "@/lib/utils";

export default async function ReviewPage() {
  const profile = await requireProfile("reviewer");
  const queue = await getReviewQueue();

  return (
    <AppShell profile={profile}>
      <SectionHeading
        title="Review Queue"
        description="High-impact changes route here before they become live in the validated dataset."
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
      <div className="space-y-4">
        {queue.pending.map((request) => (
          <Card key={request.id} className="rounded-[32px]">
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

              <div className="rounded-3xl border border-[var(--border)] bg-white/60 p-4">
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
                  <div key={`${request.id}-${field.fieldName}-diff`} className="rounded-3xl border border-[var(--border)] bg-white/60 p-4">
                    <div className="text-sm font-semibold">{field.label}</div>
                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      <DiffColumn title="Before" value={field.beforeValue} />
                      <DiffColumn title="After" value={field.afterValue} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-[var(--border)] bg-white/60 p-4">
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
          <Card className="rounded-[32px]">
            <CardContent className="pt-6 text-sm text-[var(--muted-foreground)]">
              No pending requests right now.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}

function DiffColumn({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-white/70 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
        {title}
      </div>
      <div className="mt-3 whitespace-pre-wrap text-sm text-[var(--foreground)]">{value}</div>
    </div>
  );
}
