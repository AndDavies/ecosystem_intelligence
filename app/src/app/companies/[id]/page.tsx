import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, RefreshCw, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { CompanyInlineEditPanel } from "@/components/operations/inline-edit-panels";
import { SnapshotStrip, WorkspaceEmptyState } from "@/components/workspace/workspace-primitives";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requestRefresh } from "@/lib/actions/review";
import { requireProfile } from "@/lib/auth";
import { getCompanyById } from "@/lib/data/repository";
import { getFreshnessState, summarizeFreshness } from "@/lib/freshness";
import { formatDate, formatFieldLabel, toTitleCase } from "@/lib/utils";
import type { CitationView } from "@/types/view-models";

export default async function CompanyPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fromUseCase?: string; fromCapability?: string; fromDomain?: string }>;
}) {
  const profile = await requireProfile();
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const view = await getCompanyById(id);

  if (!view) {
    notFound();
  }

  const provenance = groupCitationsByField(view.citations);
  const companyFreshness = getFreshnessState({
    lastUpdatedAt: view.company.lastUpdatedAt,
    lastSignalAt: view.signals[0]?.observedAt ?? null,
    staleAfterDays: 180
  });
  const portfolioFreshness = summarizeFreshness(
    view.capabilities.map((entry) => ({
      lastUpdatedAt: entry.capability.lastUpdatedAt,
      lastSignalAt: entry.latestSignal?.observedAt ?? entry.mappings[0]?.lastSignalAt ?? null,
      staleAfterDays: entry.mappings[0]?.staleAfterDays ?? 180
    }))
  );
  const evidenceCount =
    view.citations.length +
    view.capabilities.reduce(
      (total, entry) => total + entry.citations.length + entry.mappings.reduce((sum, mapping) => sum + mapping.citations.length, 0),
      0
    );
  const leadCapability = view.capabilities[0] ?? null;
  const canEdit = profile.role !== "viewer";
  const domainContext = resolvedSearchParams.fromDomain
    ? view.domains.find((domain) => domain.slug === resolvedSearchParams.fromDomain) ?? null
    : null;
  const useCaseContext = resolvedSearchParams.fromUseCase
    ? view.capabilities
        .flatMap((entry) => entry.mappings)
        .find((mapping) => mapping.useCase.slug === resolvedSearchParams.fromUseCase)?.useCase ?? null
    : null;
  const capabilityContext = resolvedSearchParams.fromCapability
    ? view.capabilities.find((entry) => entry.capability.id === resolvedSearchParams.fromCapability)?.capability ?? null
    : null;
  const breadcrumbs = [
    { label: "Home", href: "/app" },
    ...(capabilityContext
      ? [
          ...(useCaseContext
            ? [
                { label: "Use Cases", href: "/use-cases" },
                { label: useCaseContext.name, href: `/use-cases/${useCaseContext.slug}` }
              ]
            : []),
          {
            label: capabilityContext.name,
            href: `/capabilities/${capabilityContext.id}?${new URLSearchParams({
              ...(useCaseContext ? { fromUseCase: useCaseContext.slug } : {}),
              ...(domainContext ? { fromDomain: domainContext.slug } : {}),
              fromCompany: view.company.id
            }).toString()}`
          }
        ]
      : domainContext
        ? [
            { label: "Domains", href: "/domains" },
            { label: domainContext.name, href: `/domains/${domainContext.slug}` }
          ]
        : [{ label: "Companies", href: "/companies" }]),
    { label: view.company.name }
  ];
  const backHref = capabilityContext
    ? `/capabilities/${capabilityContext.id}?${new URLSearchParams({
        ...(useCaseContext ? { fromUseCase: useCaseContext.slug } : {}),
        ...(domainContext ? { fromDomain: domainContext.slug } : {}),
        fromCompany: view.company.id
      }).toString()}`
    : domainContext
      ? `/domains/${domainContext.slug}`
      : "/companies";
  const backLabel = capabilityContext
    ? `Back to ${capabilityContext.name}`
    : domainContext
      ? `Back to ${domainContext.name}`
      : "Back to Companies";

  return (
    <AppShell profile={profile}>
      <SectionHeading
        title={view.company.name}
        description={view.company.overview}
        eyebrow="Company record"
        breadcrumbs={breadcrumbs}
        backHref={backHref}
        backLabel={backLabel}
        meta={
          <>
            <Badge tone="surface">{view.company.headquarters}</Badge>
            <Badge tone="outline">
              {view.company.geography === "nato" ? "NATO" : toTitleCase(view.company.geography)}
            </Badge>
            {view.domains.map((domain) => (
              <Link key={domain.id} href={`/domains/${domain.slug}`} className="no-underline">
                <Badge tone="outline">{domain.name}</Badge>
              </Link>
            ))}
            <FreshnessBadge freshness={companyFreshness} />
          </>
        }
        actions={
          canEdit ? (
            <form action={requestRefresh.bind(null, "company", view.company.id)}>
              <Button type="submit" variant="secondary">
                <RefreshCw className="mr-2 size-4" />
                Request refresh
              </Button>
            </form>
          ) : null
        }
      />
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <Card variant="hero" className="rounded-[36px]">
            <CardHeader className="space-y-3">
              <div className="workspace-kicker">
                <ShieldCheck className="size-3.5" />
                Primary question
              </div>
              <CardTitle>Is this organization strategically worth attention, and in what way?</CardTitle>
              <p className="max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
                {view.capabilities.length
                  ? `${view.capabilities.length} tracked capabilities and ${view.signals.length} recent company signals currently shape the working read on this organization.`
                  : "This company exists in the dataset, but its capability context is still thin and should be treated as a candidate for deeper review."}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <ContextPanel
                  title="Market context"
                  body={view.company.marketContext ?? "No additional market context yet."}
                />
                <div className="grid gap-4">
                  <ContextPanel
                    title="Decision read"
                    body={
                      leadCapability
                        ? `${leadCapability.capability.name} is currently the strongest visible capability anchor for this company.`
                        : "No lead capability is attached yet."
                    }
                    detail={
                      leadCapability?.mappings[0]
                        ? `${leadCapability.mappings[0].useCase.name} · ${leadCapability.mappings[0].pathway}`
                        : undefined
                    }
                  />
                  <ContextPanel
                    title="Domain coverage"
                    body={
                      view.domains.length
                        ? `This company is currently represented across ${view.domains.length} tracked domain${view.domains.length === 1 ? "" : "s"}.`
                        : "No domain coverage is attached to this company yet."
                    }
                  />
                </div>
              </div>

              <SnapshotStrip
                items={[
                  {
                    label: "Tracked capabilities",
                    value: String(view.capabilities.length),
                    detail: leadCapability ? `Lead capability: ${leadCapability.capability.name}` : "No capability context yet."
                  },
                  {
                    label: "Recent signals",
                    value: String(view.signals.length),
                    detail: view.signals[0] ? `Latest: ${formatDate(view.signals[0].observedAt)}` : "No recent company signals."
                  },
                  {
                    label: "Domain coverage",
                    value: String(view.domains.length),
                    detail: view.domains.length ? view.domains.map((domain) => domain.name).join(", ") : "No domains attached."
                  },
                  {
                    label: "Evidence coverage",
                    value: String(evidenceCount),
                    detail: "Company, capability, and mapping citations attached to the current portfolio view."
                  }
                ]}
              />

              <div className="flex flex-wrap gap-2">
                {view.company.websiteUrl ? (
                  <a
                    href={view.company.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/88 px-3 py-1.5 text-sm font-medium text-[var(--foreground)] no-underline transition hover:border-[var(--primary)]/24 hover:bg-white"
                  >
                    Website
                    <ArrowUpRight className="size-3.5" />
                  </a>
                ) : (
                  <Badge tone="muted">No website attached yet</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <CompanyInlineEditPanel view={view} canEdit={canEdit} />

          <Card variant="strong" className="rounded-[32px]">
            <CardHeader className="space-y-3">
              <div className="workspace-kicker">Portfolio view</div>
              <CardTitle>Capability context</CardTitle>
              <p className="text-sm text-[var(--muted-foreground)]">
                Review the company’s visible capabilities, their current Use Case fit, and the latest signals attached to each one.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {view.capabilities.map((entry) => (
                <div key={entry.capability.id} className="workspace-subtle rounded-[28px] p-5">
                  {(() => {
                    const capabilityFreshness = getFreshnessState({
                      lastUpdatedAt: entry.capability.lastUpdatedAt,
                      lastSignalAt: entry.latestSignal?.observedAt ?? entry.mappings[0]?.lastSignalAt ?? null,
                      staleAfterDays: entry.mappings[0]?.staleAfterDays ?? 180
                    });

                    return (
                      <>
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <Link
                              href={`/capabilities/${entry.capability.id}?${new URLSearchParams({
                                ...(useCaseContext ? { fromUseCase: useCaseContext.slug } : {}),
                                ...(domainContext ? { fromDomain: domainContext.slug } : {}),
                                fromCompany: view.company.id
                              }).toString()}`}
                              className="font-semibold"
                            >
                              {entry.capability.name}
                            </Link>
                            <div className="mt-2 text-sm text-[var(--muted-foreground)]">
                              {entry.capability.summary}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge tone="surface">{entry.capability.capabilityType}</Badge>
                            <Link href={`/domains/${entry.domain.slug}`} className="no-underline">
                              <Badge tone="outline">{entry.domain.name}</Badge>
                            </Link>
                            <FreshnessBadge freshness={capabilityFreshness} />
                            {entry.latestSignal ? (
                              <Badge tone="muted">Last signal {formatDate(entry.latestSignal.observedAt)}</Badge>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {entry.mappings.slice(0, 3).map((mapping) => (
                            <Badge key={mapping.id} tone="outline">
                              {mapping.useCase.name} · {mapping.pathway}
                            </Badge>
                          ))}
                          {!entry.mappings.length ? <Badge tone="muted">No mapped Use Cases yet</Badge> : null}
                        </div>
                        {entry.mappings.length ? (
                          <div className="space-y-3">
                            {entry.mappings.slice(0, 2).map((mapping) => (
                              <ContextPanel
                                key={mapping.id}
                                title={mapping.useCase.name}
                                body={mapping.whyItMatters}
                                detail={`${mapping.pathway} · ${mapping.relevanceBand} relevance`}
                              />
                            ))}
                          </div>
                        ) : null}
                      </>
                    );
                  })()}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card variant="rail" className="rounded-[32px]">
            <CardHeader className="space-y-3">
              <div className="workspace-kicker">Trust summary</div>
              <CardTitle>Current portfolio trust posture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ContextPanel title="Company freshness" body={companyFreshness.detail} />
              <div className="workspace-subtle rounded-[26px] p-4">
                <div className="text-sm font-semibold">Portfolio freshness</div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{portfolioFreshness.detail}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <FreshnessBadge freshness={companyFreshness} />
                  <FreshnessBadge freshness={portfolioFreshness} />
                  <Badge tone="outline">Company updated {formatDate(view.company.lastUpdatedAt)}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="rail" className="rounded-[32px]">
            <CardHeader className="space-y-3">
              <div className="workspace-kicker">Signals</div>
              <CardTitle>Recent company signals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {view.signals.slice(0, 8).map((signal) => (
                <div key={signal.id} className="workspace-subtle rounded-[24px] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">{signal.title}</div>
                    <Badge tone="muted">{toTitleCase(signal.signalType)}</Badge>
                  </div>
                  <div className="mt-1 text-sm text-[var(--muted-foreground)]">{signal.description}</div>
                  <div className="mt-2 text-xs text-[var(--muted-foreground)]">{formatDate(signal.observedAt)}</div>
                </div>
              ))}
              {!view.signals.length ? (
                <WorkspaceEmptyState message="No recent signals are attached to this company yet." />
              ) : null}
            </CardContent>
          </Card>

          <Card variant="strong" className="rounded-[32px]">
            <CardHeader className="space-y-3">
              <div className="workspace-kicker">Contacts</div>
              <CardTitle>Public contacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {view.contacts.map((contact) => (
                <div key={contact.id} className="workspace-subtle rounded-[24px] p-4">
                  <div className="font-semibold">{contact.name}</div>
                  <div className="text-sm text-[var(--muted-foreground)]">{contact.title}</div>
                  {contact.email ? <div className="mt-2 text-sm">{contact.email}</div> : null}
                </div>
              ))}
              {!view.contacts.length ? <WorkspaceEmptyState message="No public contacts are attached to this company yet." /> : null}
            </CardContent>
          </Card>

          <Card variant="strong" className="rounded-[32px]">
            <CardHeader className="space-y-3">
              <div className="workspace-kicker">Evidence</div>
              <CardTitle>Evidence and provenance</CardTitle>
            </CardHeader>
            <CardContent>
              <ProvenancePanel
                title="Company-backed fields"
                citations={provenance}
                emptyMessage="Company-level citations will appear here as records are enriched."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function ContextPanel({
  title,
  body,
  detail
}: {
  title: string;
  body: string;
  detail?: string;
}) {
  return (
    <div className="workspace-subtle rounded-[26px] p-5">
      <div className="text-sm font-medium">{title}</div>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{body}</p>
      {detail ? <div className="mt-3 text-sm text-[var(--foreground)]">{detail}</div> : null}
    </div>
  );
}

function groupCitationsByField(citations: CitationView[]) {
  const byField = new Map<string, CitationView[]>();

  citations.forEach((citation) => {
    const existing = byField.get(citation.fieldName) ?? [];
    existing.push(citation);
    byField.set(citation.fieldName, existing);
  });

  return Array.from(byField.entries()).map(([fieldName, groupedCitations]) => ({
    fieldName,
    label: formatFieldLabel(fieldName),
    citations: groupedCitations
  }));
}

function ProvenancePanel({
  title,
  citations,
  emptyMessage
}: {
  title: string;
  citations: Array<{ fieldName: string; label: string; citations: CitationView[] }>;
  emptyMessage: string;
}) {
  return (
    <div className="space-y-3 rounded-[26px] border border-[var(--border)] bg-white/60 p-4">
      <div className="text-sm font-semibold">{title}</div>
      {citations.length ? (
        citations.map((group) => (
          <div key={group.fieldName} className="space-y-3 rounded-[24px] border border-[var(--border)] bg-white/80 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
              {group.label}
            </div>
            {group.citations.map((citation, index) => (
              <a
                key={`${group.fieldName}-${citation.sourceUrl}-${index}`}
                href={citation.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="block rounded-[20px] border border-[var(--border)] bg-white px-4 py-3 text-sm transition hover:border-[var(--primary)]/20 hover:bg-[var(--card)]"
              >
                <div className="font-medium">{citation.sourceTitle}</div>
                <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {citation.publisher} · {formatDate(citation.publishedAt)}
                </div>
                <div className="mt-2 text-[var(--muted-foreground)]">{citation.excerpt}</div>
              </a>
            ))}
          </div>
        ))
      ) : (
        <WorkspaceEmptyState message={emptyMessage} />
      )}
    </div>
  );
}
