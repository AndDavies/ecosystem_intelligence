import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, Building2, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { MappingInlineEditPanel, CapabilityInlineEditPanel } from "@/components/operations/inline-edit-panels";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requestRefresh } from "@/lib/actions/review";
import { requireProfile } from "@/lib/auth";
import { getCapabilityById } from "@/lib/data/repository";
import { getFreshnessState } from "@/lib/freshness";
import { formatDate, formatFieldLabel, toTitleCase } from "@/lib/utils";
import type { CitationView } from "@/types/view-models";

export default async function CapabilityPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fromUseCase?: string }>;
}) {
  const profile = await requireProfile();
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const view = await getCapabilityById(id);

  if (!view) {
    notFound();
  }

  const capabilityProvenance = groupCitationsByField(view.citations);
  const companyProvenance = groupCitationsByField(view.companyCitations);
  const capabilityFreshness = getFreshnessState({
    lastUpdatedAt: view.capability.lastUpdatedAt,
    lastSignalAt: view.latestSignal?.observedAt ?? view.mappings[0]?.lastSignalAt ?? null,
    staleAfterDays: view.mappings[0]?.staleAfterDays ?? 180
  });
  const canEdit = profile.role !== "viewer";
  const useCaseContext = resolvedSearchParams.fromUseCase
    ? view.mappings.find((mapping) => mapping.useCase.slug === resolvedSearchParams.fromUseCase)?.useCase
    : null;
  const breadcrumbs = [
    { label: "Home", href: "/app" },
    ...(useCaseContext
      ? [
          { label: "Use Cases", href: "/use-cases" },
          { label: useCaseContext.name, href: `/use-cases/${useCaseContext.slug}` }
        ]
      : []),
    { label: view.capability.name }
  ];
  const backHref = useCaseContext ? `/use-cases/${useCaseContext.slug}` : "/use-cases";
  const backLabel = useCaseContext ? `Back to ${useCaseContext.name}` : "Back to Use Cases";

  return (
    <AppShell profile={profile}>
      <SectionHeading
        title={view.capability.name}
        description={view.capability.summary}
        breadcrumbs={breadcrumbs}
        backHref={backHref}
        backLabel={backLabel}
        actions={
          profile.role !== "viewer" ? (
            <form action={requestRefresh.bind(null, "capability", view.capability.id)}>
              <Button type="submit" variant="secondary">
                <RefreshCw className="mr-2 size-4" />
                Request refresh
              </Button>
            </form>
          ) : null
        }
      />
      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-5">
          <Card className="rounded-[32px]">
            <CardContent className="space-y-5 pt-6">
              <div className="flex flex-wrap gap-2">
                <Badge>{view.capability.capabilityType}</Badge>
                <Badge tone="secondary">{view.company.name}</Badge>
                <FreshnessBadge freshness={capabilityFreshness} />
                {view.latestSignal ? (
                  <Badge tone="muted">Last signal {formatDate(view.latestSignal.observedAt)}</Badge>
                ) : null}
                <Badge tone="muted">Capability updated {formatDate(view.capability.lastUpdatedAt)}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-[var(--border)] bg-white/60 p-5">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Activity className="size-4 text-[var(--primary)]" />
                    Decision context
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                    {view.mappings.length
                      ? `This capability appears in ${view.mappings.length} Use Case mapping${view.mappings.length === 1 ? "" : "s"}, with the strongest ranking currently in ${view.mappings[0].useCase.name}.`
                      : "This capability does not yet have a mapped decision context."}
                  </p>
                </div>
                <div className="rounded-3xl border border-[var(--border)] bg-white/60 p-5">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Building2 className="size-4 text-[var(--primary)]" />
                    Company context
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                    {view.capability.companyFacingContext ?? "No additional company context yet."}
                  </p>
                  <Link
                    href={`/companies/${view.company.id}?${new URLSearchParams({
                      ...(useCaseContext ? { fromUseCase: useCaseContext.slug } : {}),
                      fromCapability: view.capability.id
                    }).toString()}`}
                    className="mt-3 inline-block text-sm font-medium"
                  >
                    Open company profile
                  </Link>
                </div>
                <div className="rounded-3xl border border-[var(--border)] bg-white/60 p-5 md:col-span-2">
                  <div className="text-sm font-medium">Freshness and trust</div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                    {capabilityFreshness.detail}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {view.latestSignal ? (
                      <Badge tone="muted">Latest signal {formatDate(view.latestSignal.observedAt)}</Badge>
                    ) : (
                      <Badge tone="danger">No recent signal attached</Badge>
                    )}
                    <Badge tone="muted">Company updated {formatDate(view.company.lastUpdatedAt)}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <CapabilityInlineEditPanel view={view} canEdit={canEdit} />

          <Card className="rounded-[32px]">
            <CardHeader className="space-y-2">
              <CardTitle>Use Case mappings</CardTitle>
              <p className="text-sm text-[var(--muted-foreground)]">
                Review the live rationale for each mapping, then adjust narrative or route higher-impact changes into review.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {view.mappings.map((mapping) => (
                <div key={mapping.id} className="space-y-4 rounded-3xl border border-[var(--border)] bg-white/60 p-5">
                  {(() => {
                    const mappingFreshness = getFreshnessState({
                      lastUpdatedAt: view.capability.lastUpdatedAt,
                      lastSignalAt: mapping.lastSignalAt,
                      staleAfterDays: mapping.staleAfterDays
                    });

                    return (
                      <>
                  <div className="flex flex-col gap-3 md:flex-row md:justify-between">
                    <div>
                      <Link href={`/use-cases/${mapping.useCase.slug}`} className="text-base font-semibold">
                        {mapping.useCase.name}
                      </Link>
                      <div className="mt-1 text-sm text-[var(--muted-foreground)]">{mapping.cluster.name}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{mapping.pathway}</Badge>
                      <Badge tone="secondary">{mapping.relevanceBand} relevance</Badge>
                      <Badge tone="muted">{mapping.defenceRelevance} defence fit</Badge>
                      <Badge tone="secondary">Score {mapping.rankingScore}</Badge>
                      <FreshnessBadge freshness={mappingFreshness} />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="text-sm font-medium">Why it matters</div>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                        {mapping.whyItMatters}
                      </p>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Suggested action</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge tone="secondary">{toTitleCase(mapping.suggestedActionType)}</Badge>
                        {mapping.actionNote ? <Badge tone="muted">{mapping.actionNote}</Badge> : null}
                      </div>
                    </div>
                  </div>
                  <ProvenancePanel
                    title="Mapping evidence"
                    citations={groupCitationsByField(mapping.citations)}
                    emptyMessage="No mapping-level citations are attached yet."
                  />
                  <MappingInlineEditPanel mapping={mapping} capabilityId={view.capability.id} canEdit={canEdit} />
                      </>
                    );
                  })()}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="rounded-[32px]">
            <CardHeader>
              <CardTitle>Recent signals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {view.signals.map((signal) => (
                <div key={signal.id} className="rounded-3xl border border-[var(--border)] bg-white/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">{signal.title}</div>
                    <Badge tone="muted">{toTitleCase(signal.signalType)}</Badge>
                  </div>
                  <div className="mt-1 text-sm text-[var(--muted-foreground)]">{signal.description}</div>
                  <div className="mt-2 text-xs text-[var(--muted-foreground)]">{formatDate(signal.observedAt)}</div>
                </div>
              ))}
              {!view.signals.length ? (
                <div className="rounded-3xl border border-[var(--border)] bg-white/60 p-4 text-sm text-[var(--muted-foreground)]">
                  No recent signals are attached to this capability yet.
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-[32px]">
            <CardHeader>
              <CardTitle>Evidence and provenance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProvenancePanel
                title="Capability-backed fields"
                citations={capabilityProvenance}
                emptyMessage="Capability-level citations will appear here as evidence is attached."
              />
              <ProvenancePanel
                title="Company-backed context"
                citations={companyProvenance}
                emptyMessage="Company-level citations will appear here as records are enriched."
              />
            </CardContent>
          </Card>

          <Card className="rounded-[32px]">
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {view.contacts.map((contact) => (
                <div key={contact.id} className="rounded-3xl border border-[var(--border)] bg-white/60 p-4">
                  <div className="font-semibold">{contact.name}</div>
                  <div className="text-sm text-[var(--muted-foreground)]">{contact.title}</div>
                  {contact.email ? <div className="mt-1 text-sm">{contact.email}</div> : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
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
    <div className="space-y-3 rounded-3xl border border-[var(--border)] bg-white/60 p-4">
      <div className="text-sm font-semibold">{title}</div>
      {citations.length ? (
        citations.map((group) => (
          <div key={group.fieldName} className="space-y-3 rounded-3xl border border-[var(--border)] bg-white/70 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
              {group.label}
            </div>
            {group.citations.map((citation, index) => (
              <a
                key={`${group.fieldName}-${citation.sourceUrl}-${index}`}
                href={citation.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
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
        <div className="rounded-3xl border border-[var(--border)] bg-white/70 p-4 text-sm text-[var(--muted-foreground)]">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
