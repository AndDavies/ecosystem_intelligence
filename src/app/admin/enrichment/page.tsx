import Link from "next/link";
import { Clock3, WandSparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { processEnrichmentQueue, triggerEnrichmentRun } from "@/lib/actions/admin";
import { requireProfile } from "@/lib/auth";
import { getAdminEnrichmentState } from "@/lib/data/repository";
import { formatDate, formatFieldLabel, toTitleCase } from "@/lib/utils";

export default async function AdminEnrichmentPage() {
  const profile = await requireProfile("admin");
  const state = await getAdminEnrichmentState();

  return (
    <AppShell profile={profile}>
      <SectionHeading
        title="Enrichment Admin"
        description="Queue AI-assisted enrichment runs and inspect the current batch state."
        breadcrumbs={[
          { label: "Home", href: "/app" },
          { label: "Admin", href: "/admin/taxonomy" },
          { label: "Enrichment" }
        ]}
        actions={
          <form action={processEnrichmentQueue}>
            <Button type="submit" variant="outline">
              Process queued runs
            </Button>
          </form>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-[32px]">
          <CardHeader>
            <CardTitle>Queue a batch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {state.useCases.map((useCase) => (
              <div key={useCase.id} className="rounded-3xl border border-[var(--border)] bg-white/60 p-4">
                <div className="mb-1 font-semibold">{useCase.name}</div>
                <div className="mb-3 text-sm text-[var(--muted-foreground)]">{useCase.summary}</div>
                <form action={triggerEnrichmentRun.bind(null, "use_case", useCase.id)}>
                  <Button type="submit" variant="secondary">
                    <WandSparkles className="mr-2 size-4" />
                    Queue enrichment
                  </Button>
                </form>
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="space-y-5">
          <Card className="rounded-[32px]">
            <CardHeader>
              <CardTitle>Pending AI suggestions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-3xl border border-sky-100 bg-sky-50/80 p-4 text-sm text-sky-950">
                AI runs never publish directly. They create reviewable suggestions that stay in the queue until a reviewer approves them.
              </div>
              {state.pendingAiSuggestions.length ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="info">{state.pendingAiSuggestions.length} pending</Badge>
                    <Link href="/review" className="text-sm font-medium">
                      Open review queue
                    </Link>
                  </div>
                  {state.pendingAiSuggestions.slice(0, 4).map((request) => (
                    <div key={request.id} className="rounded-3xl border border-[var(--border)] bg-white/60 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-semibold">{request.entityLabel}</div>
                        <Badge tone="info">AI suggestion</Badge>
                      </div>
                      <div className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {request.aiRunContext
                          ? `From ${request.aiRunContext.sourceLabel} · prompt ${request.aiRunContext.promptVersion}`
                          : request.originSummary}
                      </div>
                      <div className="mt-2 text-xs text-[var(--muted-foreground)]">
                        {formatDate(request.createdAt)}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="rounded-3xl border border-[var(--border)] bg-white/60 p-4 text-sm text-[var(--muted-foreground)]">
                  No AI-generated suggestions are waiting for review.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[32px]">
            <CardHeader>
              <CardTitle>Recent AI runs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {state.queuedRuns.length ? (
                state.queuedRuns.map((run) => (
                  <div key={run.id} className="rounded-3xl border border-[var(--border)] bg-white/60 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold">
                        {formatFieldLabel(run.entityType)} · {run.entityId}
                      </div>
                      <Badge tone={getRunTone(run.status)}>{toTitleCase(run.status)}</Badge>
                    </div>
                    <div className="mt-2 text-sm text-[var(--muted-foreground)]">
                      Prompt version {run.promptVersion}
                    </div>
                    <div className="mt-2 text-sm">{run.resultSummary ?? "Awaiting processing."}</div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                      <Clock3 className="size-3.5" />
                      {formatDate(run.createdAt)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-[var(--border)] bg-white/60 p-4 text-sm text-[var(--muted-foreground)]">
                  No AI runs have been queued yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[32px]">
            <CardHeader>
              <CardTitle>Pending manual refreshes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {state.pendingRefreshes.length ? (
                state.pendingRefreshes.map((request) => (
                  <div key={request.id} className="rounded-3xl border border-[var(--border)] bg-white/60 p-4">
                    <div className="font-semibold">{request.entityLabel}</div>
                    <div className="mt-1 text-sm text-[var(--muted-foreground)]">
                      Requested by {request.requesterName} on {formatDate(request.createdAt)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-[var(--border)] bg-white/60 p-4 text-sm text-[var(--muted-foreground)]">
                  No refresh requests are pending.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function getRunTone(status: "queued" | "running" | "completed" | "failed") {
  if (status === "completed") {
    return "success";
  }

  if (status === "running") {
    return "info";
  }

  if (status === "failed") {
    return "danger";
  }

  return "muted";
}
