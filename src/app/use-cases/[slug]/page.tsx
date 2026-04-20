import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, Download, RefreshCw, Sparkles, Target } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { MaturityChart } from "@/components/use-cases/maturity-chart";
import { UseCaseCapabilityFilters } from "@/components/use-cases/filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requestRefresh } from "@/lib/actions/review";
import { requireProfile } from "@/lib/auth";
import { getUseCaseBySlug } from "@/lib/data/repository";
import { cn, formatDate, toTitleCase } from "@/lib/utils";
import type { Pathway } from "@/types/domain";
import type { CapabilityCardView, UseCaseView } from "@/types/view-models";

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

  const insightLayer = buildUseCaseInsight(view);

  return (
    <AppShell profile={profile}>
      <SectionHeading
        title={view.useCase.name}
        description={view.useCase.summary}
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
      <div className="mb-6 flex flex-wrap gap-2">
        {view.domains.map((domain) => (
          <Badge key={domain.id} tone="secondary">
            {domain.name}
          </Badge>
        ))}
      </div>
      <Card className="mb-5 rounded-[32px] border-[var(--primary)]/10 bg-[linear-gradient(180deg,rgba(31,80,51,0.08),rgba(255,255,255,0.85))]">
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-2">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
              Page overview
            </div>
            <p className="max-w-4xl text-base leading-7 text-[var(--foreground)]">
              This view shows capabilities relevant to {view.useCase.name}, grouped by type and maturity.
              Use clusters to understand the landscape, filters to refine results, and Top Targets to identify priority engagement opportunities.
            </p>
          </div>
          <div className="rounded-3xl border border-[var(--border)] bg-white/70 px-5 py-4">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
              What is a capability?
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
              A capability is a product, system, or technical solution that can be evaluated or deployed independently.
            </p>
          </div>
          <details className="group rounded-3xl border border-[var(--border)] bg-white/70 px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
              <span>How to Use</span>
              <ChevronDown className="size-4 transition group-open:rotate-180" />
            </summary>
            <ol className="mt-4 space-y-2 text-sm leading-6 text-[var(--muted-foreground)]">
              <li>1. Start with capability clusters to understand the landscape.</li>
              <li>2. Use filters to narrow results.</li>
              <li>3. Review Top Engagement Targets for recommended actions.</li>
              <li>4. Click into capabilities for details and supporting evidence.</li>
            </ol>
          </details>
        </CardContent>
      </Card>

      <div className="grid gap-5">
        <Card className="rounded-[32px] border-[var(--primary)]/14 bg-[linear-gradient(180deg,rgba(31,80,51,0.12),rgba(255,255,255,0.98))] shadow-[0_18px_50px_rgba(20,34,24,0.08)]">
          <CardHeader className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
              Decision guide
            </div>
            <CardTitle>Recommended Actions</CardTitle>
            <p className="text-sm text-[var(--muted-foreground)]">
              Start here if you need to decide what to do first.
            </p>
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
	                          href={`/capabilities/${action.entry.capability.id}`}
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

      <Card className="mt-6 rounded-[36px] border-[var(--primary)]/12 bg-[linear-gradient(180deg,rgba(31,80,51,0.11),rgba(255,255,255,0.96))] shadow-[0_24px_80px_rgba(20,34,24,0.12)]">
        <CardHeader className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
            Highest priority
          </div>
          <CardTitle className="text-2xl md:text-3xl">Top Engagement Targets</CardTitle>
          <p className="text-sm text-[var(--muted-foreground)]">
            Highest-priority capabilities based on relevance, maturity, and recent activity.
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
	                  const targetRead = getTargetRead(entry, index, view.topTargets, view);
	                  const isPrimaryFocus = index < 3;

	                  return (
	                    <>
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
                          <Target className="size-3.5" />
                          Top Target #{index + 1}
                        </div>
                        {index < 3 ? (
                          <Badge tone="default" className="px-3 py-1.5">
                            Primary Focus
                          </Badge>
                        ) : null}
                        <Badge tone={targetRead.tone} className="px-3 py-1.5">
                          {targetRead.label}
                        </Badge>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                              Capability
                            </div>
                            <Link
                              href={`/capabilities/${entry.capability.id}`}
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
                            href={`/companies/${entry.company.id}`}
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
              <CardTitle>Ecosystem Summary</CardTitle>
              <p className="text-sm text-[var(--muted-foreground)]">
                A short read on what exists in this Use Case today.
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {insightLayer.ecosystemSummary.map((item) => (
                  <InsightBullet key={item}>{item}</InsightBullet>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-[var(--primary)]/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(31,80,51,0.05))]">
            <CardHeader className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                Action implications
              </div>
              <CardTitle>What This Means</CardTitle>
              <p className="text-sm text-[var(--muted-foreground)]">
                Turn the current landscape into next-step decisions.
              </p>
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
        <Card className="rounded-[32px]">
          <CardHeader className="space-y-2">
            <CardTitle>Gaps</CardTitle>
            <p className="text-sm text-[var(--muted-foreground)]">
              Short rule-based gaps derived from maturity, cluster depth, and current capability mix.
            </p>
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
        <Card className="rounded-[32px]">
          <CardHeader className="space-y-2">
            <CardTitle>Capability Clusters</CardTitle>
            <p className="text-sm text-[var(--muted-foreground)]">
              Groupings that help you understand the capability landscape by type.
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
                        href={`/capabilities/${entry.topCapability.capability.id}`}
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
        <Card className="rounded-[32px]">
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
          title="Filtered capability exploration"
          description="Use structured filters to narrow the view without losing the Use Case frame."
        />
        <UseCaseCapabilityFilters capabilities={view.allCapabilities} />
      </div>

      <div className="mt-6">
        <Card className="rounded-[32px]">
          <CardHeader className="space-y-2">
            <CardTitle>Supporting observations</CardTitle>
            <p className="text-sm text-[var(--muted-foreground)]">
              Curated notes that add supporting context beyond the summary and gaps above.
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

function buildUseCaseInsight(view: UseCaseView) {
  const totalCapabilities = view.allCapabilities.length;
  const pathwayCounts = {
    build: view.maturityDistribution.find((item) => item.pathway === "build")?.count ?? 0,
    validate: view.maturityDistribution.find((item) => item.pathway === "validate")?.count ?? 0,
    scale: view.maturityDistribution.find((item) => item.pathway === "scale")?.count ?? 0
  };
  const dominantPathway = (Object.entries(pathwayCounts).sort((left, right) => right[1] - left[1])[0]?.[0] ??
    "validate") as Pathway;
  const uniqueCompanyIds = new Set(view.allCapabilities.map((item) => item.company.id));
  const canadianCompanyIds = new Set(
    view.allCapabilities.filter((item) => item.company.geography === "canada").map((item) => item.company.id)
  );
  const clusterRanking = [...view.clusters].sort((left, right) => right.count - left.count);
  const dominantCluster = clusterRanking[0] ?? null;
  const thinnestCluster = clusterRanking.at(-1) ?? null;
  const scaleCount = pathwayCounts.scale;
  const validateCount = pathwayCounts.validate;
  const canadaShare = uniqueCompanyIds.size ? canadianCompanyIds.size / uniqueCompanyIds.size : 0;
  const recommendedActions = buildRecommendedActions(view);

  const ecosystemSummary: string[] = [];

  if (dominantPathway === "validate") {
    ecosystemSummary.push(
      `Most capabilities sit in Validate (${validateCount} of ${totalCapabilities}), so the landscape is strongest in mid-stage systems rather than deployed solutions.`
    );
  } else if (dominantPathway === "scale") {
    ecosystemSummary.push(
      `Scale-ready capabilities are relatively prominent (${scaleCount} of ${totalCapabilities}), which gives this Use Case clearer near-term options than a typical early ecosystem.`
    );
  } else {
    ecosystemSummary.push(
      `Build-stage capabilities still lead this landscape (${pathwayCounts.build} of ${totalCapabilities}), so the ecosystem remains early and exploratory overall.`
    );
  }

  if (scaleCount <= Math.max(3, Math.floor(totalCapabilities * 0.2))) {
    ecosystemSummary.push(
      `Only ${scaleCount} capabilities appear Scale-ready, leaving a small pool of immediate deployment-oriented opportunities.`
    );
  } else {
    ecosystemSummary.push(
      `${scaleCount} capabilities are already in Scale, so there is meaningful depth for near-term engagement beyond monitoring alone.`
    );
  }

  if (dominantCluster) {
    ecosystemSummary.push(
      `${dominantCluster.cluster.name} is the deepest cluster with ${dominantCluster.count} capabilities, making it the clearest concentration of current market depth.`
    );
  }

  if (!dominantCluster && canadaShare < 0.45) {
    ecosystemSummary.push(
      `Canadian companies account for ${canadianCompanyIds.size} of ${uniqueCompanyIds.size} suppliers in view, which limits domestic depth relative to international options.`
    );
  }

  const whatThisMeans: string[] = [];

  if (validateCount >= scaleCount) {
    whatThisMeans.push(
      "Implication: Focus engagement on validating the strongest mid-stage systems to close the deployment gap."
    );
  }

  if (scaleCount <= 3) {
    whatThisMeans.push(
      "Implication: Start with the small Scale-ready subset first, because those entries are the clearest near-term actions."
    );
  } else {
    whatThisMeans.push(
      "Implication: Separate the top Scale-stage capabilities from the broader list before spending time on lower-priority options."
    );
  }

  if (dominantCluster && thinnestCluster && dominantCluster.cluster.id !== thinnestCluster.cluster.id) {
    whatThisMeans.push(
      `Implication: Use engagement to bridge beyond ${dominantCluster.cluster.name.toLowerCase()}, especially where ${thinnestCluster.cluster.name.toLowerCase()} remains thin.`
    );
  }

  const gaps: string[] = [];

  if (scaleCount <= Math.max(3, Math.floor(totalCapabilities * 0.2))) {
    gaps.push("Limited deployment-ready Arctic-specific capabilities for immediate engagement.");
  }

  const clusterWithoutScale = view.clusters.find((entry) => {
    const clusterMembers = view.allCapabilities.filter((item) => item.cluster.id === entry.cluster.id);
    return clusterMembers.length > 0 && clusterMembers.every((item) => item.mapping.pathway !== "scale");
  });

  if (clusterWithoutScale) {
    gaps.push(
      `No Scale-stage depth in ${clusterWithoutScale.cluster.name.toLowerCase()}, leaving a thinner path to deployment there.`
    );
  }

  if (canadaShare < 0.45) {
    gaps.push("Limited Canadian mid-stage and late-stage depth relative to international suppliers in the current view.");
  }

  if (gaps.length < 2 && thinnestCluster) {
    gaps.push(
      `Thin representation in ${thinnestCluster.cluster.name.toLowerCase()} compared with the rest of the landscape.`
    );
  }

  return {
    recommendedActions,
    ecosystemSummary: ecosystemSummary.slice(0, 3),
    whatThisMeans: whatThisMeans.slice(0, 3),
    gaps: gaps.slice(0, 3)
  };
}

function buildRecommendedActions(view: UseCaseView) {
  const actions: Array<{
    verb: "Engage" | "Validate" | "Monitor";
    tone: "success" | "info" | "muted";
    entry: CapabilityCardView;
    directive: string;
    context: string;
  }> = [];

  return view.topTargets.slice(0, 3).map((entry, index) => {
    const verb = getActionVerb(entry.mapping.pathway);
    const targetRead = getTargetRead(entry, index, view.topTargets, view);

    return {
      verb,
      tone: (verb === "Engage" ? "success" : verb === "Validate" ? "info" : "muted") as
        | "success"
        | "info"
        | "muted",
      entry,
      directive: targetRead.actionDirective,
      context: targetRead.whyPrioritize
    };
  });
}

function getTargetRead(
  entry: CapabilityCardView,
  index: number,
  topTargets: CapabilityCardView[],
  view?: UseCaseView
) {
  const scaleEntriesBefore = topTargets
    .slice(0, index + 1)
    .filter((item) => item.mapping.pathway === "scale").length;
  const scaleCount = view?.maturityDistribution.find((item) => item.pathway === "scale")?.count ?? 0;
  const clusterCount =
    view?.allCapabilities.filter((item) => item.cluster.id === entry.cluster.id).length ?? 0;
  const recentSignal = getMostRelevantSignal(entry.signals);
  const signalEvidence = recentSignal ? describeSignalEvidence(recentSignal.signalType) : null;
  const capabilityType = entry.capability.capabilityType.toLowerCase();

  if (entry.mapping.pathway === "scale") {
    const whyPrioritize =
      scaleCount <= 3
        ? "One of the few Scale-stage capabilities in this Use Case."
        : "Ranks among the strongest Scale-stage capabilities in the current shortlist.";

    return {
      label: "Immediate Opportunity",
      tone: "success" as const,
      whyPrioritize,
      priorityNow: [
        `One of only ${scaleCount} Scale-stage capabilities in this Use Case.`,
        signalEvidence
          ? `Backed by ${signalEvidence}, so it is more actionable now than Validate-stage alternatives.`
          : `Ranks above Validate-stage alternatives because it can support near-term engagement without another validation cycle.`
      ].join(" "),
      whyNotOthers: getWhyNotOthers(entry, capabilityType),
      strength: getStrength(entry, capabilityType),
      limitation: getLimitation(entry, capabilityType),
      actionDirective: getActionDirective(entry, capabilityType),
      context:
        scaleEntriesBefore <= 3
          ? "One of the clearest near-term engagement priorities in this Use Case."
          : "Deployment-ready and worth evaluation, but not among the first immediate moves."
    };
  }

  if (entry.mapping.pathway === "validate") {
    const whyPrioritize =
      index <= 2
        ? "Highest-ranked Validate-stage option for closing the deployment gap."
        : "Stronger near-term candidate than most other mid-stage capabilities in view.";

    return {
      label: "High Potential - Needs Validation",
      tone: "info" as const,
      whyPrioritize,
      priorityNow:
        "Highest-ranked Validate-stage option in the shortlist and one of the clearest candidates to move into Arctic operator trials next.",
      whyNotOthers:
        "Most competing mid-stage capabilities either solve narrower problems or have a less obvious next validation step.",
      strength: getStrength(entry, capabilityType),
      limitation: getLimitation(entry, capabilityType),
      actionDirective: getActionDirective(entry, capabilityType),
      context: "Relevant now, but it still needs operator access or field validation before wider deployment."
    };
  }

  return {
    label: "Early Signal - Monitor",
    tone: "muted" as const,
    whyPrioritize:
      clusterCount <= 4
        ? `One of the few early signals in ${entry.cluster.name.toLowerCase()}.`
        : "Strategically relevant, but earlier than the top deployment-oriented options.",
    priorityNow:
      "Strategically relevant to Arctic monitoring, but still too early to justify near-term engagement over stronger alternatives.",
    whyNotOthers:
      "Higher-ranked options already have clearer validation or deployment evidence, so this remains a monitor rather than an active priority.",
    strength: getStrength(entry, capabilityType),
    limitation: getLimitation(entry, capabilityType),
    actionDirective: getActionDirective(entry, capabilityType),
    context: "Useful to track, but still too early to treat as a near-term engagement priority."
  };
}

function getActionVerb(pathway: Pathway) {
  if (pathway === "scale") {
    return "Engage";
  }

  if (pathway === "validate") {
    return "Validate";
  }

  return "Monitor";
}

function getMostRelevantSignal(signals: CapabilityCardView["signals"]) {
  const signalPriority: Record<CapabilityCardView["signals"][number]["signalType"], number> = {
    contract: 6,
    partnership: 5,
    pilot: 4,
    technical_milestone: 3,
    accelerator: 2,
    funding: 1,
    strategic_hiring: 0
  };

  return [...signals].sort((left, right) => {
    const priorityDelta = signalPriority[right.signalType] - signalPriority[left.signalType];

    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return new Date(right.observedAt).getTime() - new Date(left.observedAt).getTime();
  })[0];
}

function describeSignalEvidence(signalType: CapabilityCardView["signals"][number]["signalType"]) {
  if (signalType === "contract") {
    return "a recent contract or procurement-facing signal";
  }

  if (signalType === "partnership") {
    return "a recent integration or deployment partnership";
  }

  if (signalType === "pilot") {
    return "a recent field pilot in Arctic-like conditions";
  }

  if (signalType === "technical_milestone") {
    return "a recent technical milestone that reduces execution risk";
  }

  if (signalType === "accelerator") {
    return "entry into a relevant field-testing program";
  }

  if (signalType === "funding") {
    return "recent external funding support";
  }

  return "recent strategic hiring that signals delivery focus";
}

function getWhyNotOthers(entry: CapabilityCardView, capabilityType: string) {
  if (capabilityType.includes("analytics") || capabilityType.includes("software") || capabilityType.includes("data")) {
    return "Most competing analytics and fusion options remain in Validate stage or still depend on deeper workflow integration before frontline use.";
  }

  if (capabilityType.includes("radar")) {
    return "Most competing sensing options are either Validate-stage or rely on indirect analytics rather than delivering direct chokepoint watch.";
  }

  if (capabilityType.includes("satellite")) {
    return "Most competing route-awareness options either cover smaller local areas or still need validation before recurring operational use.";
  }

  if (capabilityType.includes("rf")) {
    return "Most competing sensing options are more visible or less suited to contested monitoring conditions.";
  }

  if (entry.mapping.pathway === "scale") {
    return "Most competing capabilities remain in Validate stage and still need operator access before they can be treated as near-term deployment candidates.";
  }

  return "Higher-ranked alternatives have either stronger deployment evidence or a clearer near-term use case than the rest of the field.";
}

function getStrength(entry: CapabilityCardView, capabilityType: string) {
  if (capabilityType.includes("analytics") || capabilityType.includes("software") || capabilityType.includes("data")) {
    return "Turns fragmented Arctic data into operator-ready decisions instead of another raw feed.";
  }

  if (capabilityType.includes("radar")) {
    return "Delivers persistent watch over constrained Arctic approaches and chokepoints.";
  }

  if (capabilityType.includes("satellite")) {
    return "Provides wide-area route awareness across vast Arctic corridors.";
  }

  if (capabilityType.includes("rf")) {
    return "Adds passive coverage in environments where active sensing would reveal the watch position.";
  }

  if (capabilityType.includes("relay") || capabilityType.includes("communications")) {
    return "Extends coverage into Arctic areas where fixed communications do not exist.";
  }

  if (capabilityType.includes("eo") || capabilityType.includes("ir")) {
    return "Stands up local watch quickly at austere northern positions.";
  }

  if (capabilityType.includes("power")) {
    return "Improves endurance for remote sensing and relay nodes in low-sustainment environments.";
  }

  if (entry.cluster.id === "cluster-3") {
    return "Reaches operating environments where crewed or fixed systems cannot stay persistent.";
  }

  return "Directly addresses a known Arctic sensing or integration constraint.";
}

function getLimitation(entry: CapabilityCardView, capabilityType: string) {
  if (capabilityType.includes("analytics") || capabilityType.includes("software") || capabilityType.includes("data")) {
    return "Depends on external sensors and integration into existing command workflows.";
  }

  if (capabilityType.includes("radar")) {
    return "Best for fixed corridors rather than broad distributed coverage.";
  }

  if (capabilityType.includes("satellite")) {
    return "Stronger for route monitoring than for local tactical watch.";
  }

  if (capabilityType.includes("rf")) {
    return "Emitter-based detection is weaker when targets remain silent.";
  }

  if (capabilityType.includes("relay") || capabilityType.includes("communications")) {
    return "Creates enabling infrastructure but is less valuable without mission systems attached.";
  }

  if (capabilityType.includes("eo") || capabilityType.includes("ir")) {
    return "Line-of-sight coverage is narrower than wide-area sensing options.";
  }

  if (capabilityType.includes("power")) {
    return "Improves endurance but is not itself a differentiated sensing capability.";
  }

  if (entry.cluster.id === "cluster-3") {
    return "Still depends on Arctic field validation and sustainment proof in harsh conditions.";
  }

  return "Needs integration into a broader Arctic monitoring architecture to deliver full value.";
}

function getActionDirective(entry: CapabilityCardView, capabilityType: string) {
  if (entry.mapping.pathway === "scale") {
    if (capabilityType.includes("analytics") || capabilityType.includes("software") || capabilityType.includes("data")) {
      return `Engage ${entry.capability.name} for near-term operator evaluation on live Arctic monitoring feeds.`;
    }

    if (capabilityType.includes("radar")) {
      return `Engage ${entry.capability.name} for near-term deployment assessment at Arctic chokepoints.`;
    }

    if (capabilityType.includes("satellite")) {
      return `Engage ${entry.capability.name} for route-risk support with Arctic planning teams.`;
    }

    if (capabilityType.includes("rf")) {
      return `Engage ${entry.capability.name} for contested-monitoring trials where passive sensing matters.`;
    }

    return `Engage ${entry.capability.name} for near-term deployment validation with Arctic operators.`;
  }

  if (entry.mapping.pathway === "validate") {
    if (capabilityType.includes("relay") || capabilityType.includes("communications")) {
      return `Validate ${entry.capability.name} through Arctic field trials that stress remote connectivity and sustainment.`;
    }

    if (capabilityType.includes("analytics") || capabilityType.includes("software")) {
      return `Validate ${entry.capability.name} with Arctic operators before treating it as a deployment-ready software layer.`;
    }

    if (entry.cluster.id === "cluster-3") {
      return `Validate ${entry.capability.name} in Arctic trials that test ice access and low-support operations.`;
    }

    return `Validate ${entry.capability.name} through operator trials before committing near-term engagement.`;
  }

  return `Monitor ${entry.capability.name} while Arctic field evidence and deployment fit mature.`;
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
