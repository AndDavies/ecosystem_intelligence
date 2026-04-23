import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, Download, RefreshCw, Sparkles, Target } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { MaturityChart } from "@/components/use-cases/maturity-chart";
import { UseCaseCapabilityFilters } from "@/components/use-cases/filters";
import { SnapshotStrip } from "@/components/workspace/workspace-primitives";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requestRefresh } from "@/lib/actions/review";
import { requireProfile } from "@/lib/auth";
import { getUseCaseBySlug } from "@/lib/data/repository";
import { getFreshnessState, summarizeFreshness } from "@/lib/freshness";
import { resolveUseCaseConfig } from "@/lib/use-case-config";
import { buildUseCaseInsight, getTargetRead } from "@/lib/use-case-insights";
import { cn, formatDate, toTitleCase } from "@/lib/utils";

export default async function UseCaseDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const profile = await requireProfile();
  const { slug } = await params;
  const view = await getUseCaseBySlug(slug);

  if (!view) {
    notFound();
  }

  const useCaseConfig = resolveUseCaseConfig(view.useCase, view.domains);
  const insightLayer = buildUseCaseInsight(view, useCaseConfig.insightCopy);
  const freshnessSummary = summarizeFreshness(
    view.allCapabilities.map((entry) => ({
      lastUpdatedAt: entry.capability.lastUpdatedAt,
      lastSignalAt: entry.mapping.lastSignalAt,
      staleAfterDays: entry.mapping.staleAfterDays
    }))
  );

  return (
    <AppShell profile={profile}>
      <SectionHeading
        title={view.useCase.name}
        description={view.useCase.summary}
        eyebrow="Use case workspace"
        breadcrumbs={[
          { label: "Home", href: "/app" },
          { label: "Use Cases", href: "/use-cases" },
          { label: view.useCase.name }
        ]}
        backHref="/use-cases"
        backLabel="Back to Use Cases"
        meta={
          <>
            {view.domains.map((domain) => (
              <Badge key={domain.id} tone="outline">
                {domain.name}
              </Badge>
            ))}
            <FreshnessBadge freshness={freshnessSummary} />
            {freshnessSummary.lastActivityAt ? (
              <Badge tone="muted">Last activity {formatDate(freshnessSummary.lastActivityAt)}</Badge>
            ) : null}
          </>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/api/export?type=use-case-targets&useCaseSlug=${view.useCase.slug}`}>
                <Download className="mr-2 size-4" />
                Export CSV
              </Link>
            </Button>
            {profile.role !== "viewer" ? (
              <form action={requestRefresh.bind(null, "use_case", view.useCase.id)}>
                <Button type="submit" variant="secondary">
                  <RefreshCw className="mr-2 size-4" />
                  Request refresh
                </Button>
              </form>
            ) : null}
          </div>
        }
      />
      <div className="mb-6 grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
        <Card variant="hero" className="rounded-[36px]">
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                {useCaseConfig.detail.overviewEyebrow}
              </div>
              <p className="max-w-4xl text-base leading-7 text-[var(--foreground)]">
                {useCaseConfig.detail.overviewBody}
              </p>
            </div>
            <div className="workspace-subtle rounded-[28px] px-5 py-4">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                What is a capability?
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                {useCaseConfig.detail.capabilityDefinition}
              </p>
            </div>
            <details className="group rounded-[28px] border border-[var(--border)] bg-white/70 px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
                <span>How to Use</span>
                <ChevronDown className="size-4 transition group-open:rotate-180" />
              </summary>
              <ol className="mt-4 space-y-2 text-sm leading-6 text-[var(--muted-foreground)]">
                {useCaseConfig.detail.quickStartSteps.map((step, index) => (
                  <li key={step}>
                    {index + 1}. {step}
                  </li>
                ))}
              </ol>
            </details>
          </CardContent>
        </Card>

        <Card variant="rail" className="rounded-[36px]">
          <CardHeader className="space-y-3">
            <div className="workspace-kicker">Trust and coverage</div>
            <CardTitle>What supports the current mission read</CardTitle>
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">
              This page keeps the heuristic summary, freshness posture, and target coverage visible before you drill into individual capability records.
            </p>
            <DerivedReadLabel />
          </CardHeader>
          <CardContent className="space-y-5">
            <SnapshotStrip
              items={[
                {
                  label: "Top targets",
                  value: String(view.topTargets.length),
                  detail: "Highest-priority capability candidates currently surfaced for this Use Case."
                },
                {
                  label: "Capability coverage",
                  value: String(view.allCapabilities.length),
                  detail: `${freshnessSummary.freshCount} fresh · ${freshnessSummary.watchCount} watch · ${freshnessSummary.staleCount} stale`
                },
                {
                  label: "Cluster coverage",
                  value: String(view.clusters.length),
                  detail: "Technical groupings represented inside this problem space."
                },
                {
                  label: "Observations",
                  value: String(view.observations.length),
                  detail: freshnessSummary.detail
                }
              ]}
              className="xl:grid-cols-2"
            />
            <div className="flex flex-wrap gap-2 text-sm">
              <Link href="/help/use-case-discovery" className="font-medium">
                Read the discovery guide
              </Link>
              <span className="text-[var(--muted-foreground)]">or</span>
              <Link href="/help/first-walkthrough" className="font-medium">
                follow the 10-minute walkthrough
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5">
        <Card variant="feature" className="rounded-[32px]">
          <CardHeader className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
              Decision guide
            </div>
            <CardTitle>{useCaseConfig.detail.decisionGuideTitle}</CardTitle>
            <p className="text-sm text-[var(--muted-foreground)]">
              {useCaseConfig.detail.decisionGuideDescription}
            </p>
            <DerivedReadLabel />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insightLayer.recommendedActions.map((action, index) => (
                <div
                  key={`${action.entry.mapping.id}-${action.verb}`}
                  className="rounded-[28px] border border-[var(--primary)]/12 bg-white/85 px-5 py-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white">
                      {index + 1}
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={action.tone}>{action.verb}</Badge>
                        <Link
                          href={`/capabilities/${action.entry.capability.id}?fromUseCase=${view.useCase.slug}`}
                          className="text-base font-semibold no-underline"
                        >
                          {action.entry.capability.name}
                        </Link>
                      </div>
                      <p className="text-sm font-medium text-[var(--foreground)]">{action.directive}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">{action.context}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card variant="strong" className="mt-6 rounded-[36px]">
        <CardHeader className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
            Highest priority
          </div>
          <CardTitle className="text-2xl md:text-3xl">{useCaseConfig.detail.topTargetsTitle}</CardTitle>
          <p className="text-sm text-[var(--muted-foreground)]">
            {useCaseConfig.detail.topTargetsDescription}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {view.topTargets.length ? (
            view.topTargets.map((entry, index) => (
              <div
                key={entry.mapping.id}
                className={cn(
                  "rounded-[32px] p-7 transition hover:-translate-y-0.5",
                  index < 3
                    ? "border border-[var(--primary)]/15 bg-[var(--card-strong)] shadow-[0_14px_40px_rgba(20,34,24,0.08)] hover:border-[var(--primary)]/30 hover:shadow-[0_18px_48px_rgba(20,34,24,0.12)]"
                    : "border border-[var(--border)] bg-white/75 shadow-none hover:border-[var(--primary)]/16 hover:bg-white"
                )}
              >
                {(() => {
                  const targetRead = getTargetRead(
                    entry,
                    index,
                    view.topTargets,
                    view,
                    useCaseConfig.insightCopy
                  );
                  const isPrimaryFocus = index < 3;
                    const freshness = getFreshnessState({
                      lastUpdatedAt: entry.capability.lastUpdatedAt,
                      lastSignalAt: entry.mapping.lastSignalAt,
                      staleAfterDays: entry.mapping.staleAfterDays
                    });

                  return (
                    <>
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
                          <Target className="size-3.5" />
                          Top Target #{index + 1}
                        </div>
                        {index < 3 ? (
                          <Badge tone="default" className="px-3 py-1.5">
                            {useCaseConfig.detail.primaryFocusLabel}
                          </Badge>
                        ) : null}
                        <Badge tone={targetRead.tone} className="px-3 py-1.5">
                          {targetRead.label}
                        </Badge>
                        <FreshnessBadge freshness={freshness} />
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                              Capability
                            </div>
                            <Link
                              href={`/capabilities/${entry.capability.id}?fromUseCase=${view.useCase.slug}`}
                              title="Capability = product, system, or solution"
                              className="block truncate text-2xl font-bold tracking-tight no-underline md:text-3xl"
                            >
                              {entry.capability.name}
                            </Link>
                          </div>
                          <Badge
                            tone={getPathwayTone(entry.mapping.pathway)}
                            className="px-4 py-2 text-sm capitalize"
                            title={getPathwayDescription(entry.mapping.pathway)}
                          >
                            {entry.mapping.pathway}
                          </Badge>
                        </div>
                        <div>
                          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                            Company
                          </div>
                          <Link
                            href={`/companies/${entry.company.id}?fromUseCase=${view.useCase.slug}&fromCapability=${entry.capability.id}`}
                            className="text-base font-medium text-slate-600 no-underline hover:text-[var(--link-hover)]"
                          >
                            {entry.company.name}
                          </Link>
                        </div>
                        <p className="truncate text-sm text-[var(--foreground)]">
                          {entry.capability.summary}
                        </p>
                        {isPrimaryFocus ? (
                          <>
                            <div className="grid gap-3 lg:grid-cols-2">
                              <DecisionDetailBlock
                                title="Why This Is a Priority Now"
                                body={targetRead.priorityNow}
                              />
                              <DecisionDetailBlock
                                title="Why Not Others"
                                body={targetRead.whyNotOthers}
                              />
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <TradeoffBlock title="Strength" body={targetRead.strength} />
                              <TradeoffBlock title="Limitation" body={targetRead.limitation} />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="grid gap-2 md:grid-cols-[auto_1fr] md:items-center">
                              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                                Why prioritize
                              </div>
                              <div className="truncate text-sm text-[var(--foreground)]">
                                {truncateText(targetRead.whyPrioritize, 105)}
                              </div>
                            </div>
                            <div className="grid gap-2 md:grid-cols-[auto_1fr] md:items-center">
                              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                                Engagement read
                              </div>
                              <div className="truncate text-sm text-[var(--foreground)]">
                                {truncateText(targetRead.context, 115)}
                              </div>
                            </div>
                          </>
                        )}
                        <div className="grid gap-2 md:grid-cols-[auto_1fr] md:items-center">
                          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                            Why it matters
                          </div>
                          <div className="truncate text-sm text-[var(--muted-foreground)]">
                            {truncateText(entry.mapping.whyItMatters, 115)}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="secondary" className="px-3 py-1.5">
                            <Sparkles className="mr-1.5 size-3" />
                            {toTitleCase(entry.mapping.suggestedActionType)}
                          </Badge>
                          <Badge tone="muted" className="px-3 py-1.5">
                            {entry.mapping.relevanceBand} relevance
                          </Badge>
                          <Badge tone="muted" className="px-3 py-1.5">
                            {entry.cluster.name}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-6 flex flex-wrap gap-2">
                        {entry.citations.map((citation) => (
                          <a
                            key={`${entry.mapping.id}-${citation.sourceUrl}`}
                            href={citation.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs text-[var(--muted-foreground)] hover:bg-[var(--card)]"
                          >
                            {citation.publisher} • {formatDate(citation.publishedAt)}
                          </a>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            ))
          ) : (
            <EmptyState message="No engagement targets are available for this Use Case yet." />
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <div className="grid gap-5">
          <Card className="rounded-[32px] border-[var(--border)] bg-white/85">
            <CardHeader className="space-y-2">
              <CardTitle>{useCaseConfig.detail.summaryTitle}</CardTitle>
              <p className="text-sm text-[var(--muted-foreground)]">
                {useCaseConfig.detail.summaryDescription}
              </p>
              <DerivedReadLabel />
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {insightLayer.ecosystemSummary.map((item) => (
                  <InsightBullet key={item}>{item}</InsightBullet>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card variant="strong" className="rounded-[32px]">
            <CardHeader className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                  {useCaseConfig.detail.implicationsEyebrow}
                </div>
              <CardTitle>{useCaseConfig.detail.implicationsTitle}</CardTitle>
              <p className="text-sm text-[var(--muted-foreground)]">
                {useCaseConfig.detail.implicationsDescription}
              </p>
              <DerivedReadLabel />
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {insightLayer.whatThisMeans.map((item) => (
                  <InsightBullet key={item}>{item}</InsightBullet>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <Card variant="strong" className="rounded-[32px]">
          <CardHeader className="space-y-2">
            <CardTitle>{useCaseConfig.detail.gapsTitle}</CardTitle>
            <p className="text-sm text-[var(--muted-foreground)]">
              {useCaseConfig.detail.gapsDescription}
            </p>
            <DerivedReadLabel />
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {insightLayer.gaps.map((item) => (
                <InsightBullet key={item}>{item}</InsightBullet>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card variant="strong" className="rounded-[32px]">
          <CardHeader className="space-y-2">
            <CardTitle>{useCaseConfig.detail.clustersTitle}</CardTitle>
            <p className="text-sm text-[var(--muted-foreground)]">
              {useCaseConfig.detail.clustersDescription}
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {view.clusters.length ? (
              view.clusters.map((entry) => (
                <div
                  key={entry.cluster.id}
                  className="rounded-[28px] border border-[var(--border)] bg-white/70 p-5 transition hover:border-[var(--primary)]/20 hover:shadow-[0_12px_30px_rgba(20,34,24,0.06)]"
                >
                  <div className="space-y-2">
                    <div className="text-base font-semibold">{entry.cluster.name}</div>
                    <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                      {entry.cluster.summary}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <Badge tone="secondary">{entry.count} capabilities</Badge>
                    {entry.topCapability ? (
                      <Link
                        href={`/capabilities/${entry.topCapability.capability.id}?fromUseCase=${view.useCase.slug}`}
                        className="text-sm font-medium no-underline"
                        title="Open top capability in this cluster"
                      >
                        {entry.topCapability.capability.name}
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="No capability clusters are available for this Use Case yet." />
            )}
          </CardContent>
        </Card>
        <Card variant="rail" className="rounded-[32px]">
          <CardHeader className="space-y-2">
            <CardTitle>Maturity Distribution</CardTitle>
            <p className="text-sm text-[var(--muted-foreground)]">
              A quick read on where capabilities sit across Build, Validate, and Scale.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <MaturityChart data={view.maturityDistribution} />
            <div className="space-y-3 rounded-3xl border border-[var(--border)] bg-white/60 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                Pathways
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-3">
                  <Badge tone="muted" className="mt-0.5 capitalize" title={getPathwayDescription("build")}>
                    Build
                  </Badge>
                  <span className="text-[var(--muted-foreground)]">Early-stage development or concept.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Badge tone="info" className="mt-0.5 capitalize" title={getPathwayDescription("validate")}>
                    Validate
                  </Badge>
                  <span className="text-[var(--muted-foreground)]">Tested or piloted and needs real-world validation.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Badge tone="success" className="mt-0.5 capitalize" title={getPathwayDescription("scale")}>
                    Scale
                  </Badge>
                  <span className="text-[var(--muted-foreground)]">Ready for deployment, procurement, or commercialization.</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <SectionHeading
          title={useCaseConfig.detail.filtersTitle}
          description={useCaseConfig.detail.filtersDescription}
        />
        <UseCaseCapabilityFilters capabilities={view.allCapabilities} useCaseSlug={view.useCase.slug} />
      </div>

      <div className="mt-6">
        <Card variant="strong" className="rounded-[32px]">
          <CardHeader className="space-y-2">
            <CardTitle>{useCaseConfig.detail.observationsTitle}</CardTitle>
            <p className="text-sm text-[var(--muted-foreground)]">
              {useCaseConfig.detail.observationsDescription}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {view.observations.length ? (
              view.observations.map((observation) => (
                <div key={observation.id} className="rounded-3xl border border-[var(--border)] bg-white/60 p-4">
                  <div className="font-semibold">{observation.title}</div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{observation.note}</p>
                </div>
              ))
            ) : (
              <EmptyState message="No observations are available for this Use Case yet." />
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[28px] border border-dashed border-[var(--border)] bg-white/55 p-5 text-sm text-[var(--muted-foreground)]">
      {message}
    </div>
  );
}

function InsightBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm leading-6 text-[var(--foreground)]">
      <span className="mt-2 size-2 shrink-0 rounded-full bg-[var(--primary)]" />
      <span>{children}</span>
    </li>
  );
}

function DerivedReadLabel() {
  return (
    <div className="inline-flex items-center rounded-full bg-[var(--muted)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
      Derived read: heuristic summary from current records, not a direct source-backed fact.
    </div>
  );
}

function DecisionDetailBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-white/70 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
        {title}
      </div>
      <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">{body}</p>
    </div>
  );
}

function TradeoffBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-white/70 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
        {title}
      </div>
      <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">{body}</p>
    </div>
  );
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function getPathwayTone(pathway: "build" | "validate" | "scale") {
  if (pathway === "scale") {
    return "success";
  }

  if (pathway === "validate") {
    return "info";
  }

  return "muted";
}

function getPathwayDescription(pathway: "build" | "validate" | "scale") {
  if (pathway === "scale") {
    return "Scale — ready for deployment, procurement, or commercialization";
  }

  if (pathway === "validate") {
    return "Validate — tested or piloted and needs real-world validation";
  }

  return "Build — early-stage development or concept";
}
