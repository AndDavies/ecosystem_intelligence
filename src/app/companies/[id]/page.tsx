import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { CompanyInlineEditPanel } from "@/components/operations/inline-edit-panels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requestRefresh } from "@/lib/actions/review";
import { requireProfile } from "@/lib/auth";
import { getCompanyById } from "@/lib/data/repository";
import { formatDate, formatFieldLabel, toTitleCase } from "@/lib/utils";
import type { CitationView } from "@/types/view-models";

export default async function CompanyPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fromUseCase?: string; fromCapability?: string }>;
}) {
  const profile = await requireProfile();
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const view = await getCompanyById(id);

  if (!view) {
    notFound();
  }

  const provenance = groupCitationsByField(view.citations);
  const canEdit = profile.role !== "viewer";
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
    ...(useCaseContext
      ? [
          { label: "Use Cases", href: "/use-cases" },
          { label: useCaseContext.name, href: `/use-cases/${useCaseContext.slug}` }
        ]
      : []),
    ...(capabilityContext
      ? [
          {
            label: capabilityContext.name,
            href: `/capabilities/${capabilityContext.id}${useCaseContext ? `?fromUseCase=${useCaseContext.slug}` : ""}`
          }
        ]
      : []),
    { label: view.company.name }
  ];
  const backHref = capabilityContext
    ? `/capabilities/${capabilityContext.id}${useCaseContext ? `?fromUseCase=${useCaseContext.slug}` : ""}`
    : useCaseContext
      ? `/use-cases/${useCaseContext.slug}`
      : "/use-cases";
  const backLabel = capabilityContext
    ? `Back to ${capabilityContext.name}`
    : useCaseContext
      ? `Back to ${useCaseContext.name}`
      : "Back to Use Cases";

  return (
    <AppShell profile={profile}>
      <SectionHeading
        title={view.company.name}
        description={view.company.overview}
        breadcrumbs={breadcrumbs}
        backHref={backHref}
        backLabel={backLabel}
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
          <Card className="rounded-[32px]">
            <CardContent className="space-y-5 pt-6">
              <div className="flex flex-wrap gap-2">
                <Badge>{view.company.headquarters}</Badge>
                <Badge tone="secondary">{view.company.geography}</Badge>
                {view.company.websiteUrl ? (
                  <a
                    href={view.company.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-sm font-medium"
                  >
                    Website
                    <ArrowUpRight className="size-3.5" />
                  </a>
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-[var(--border)] bg-white/60 p-5">
                  <div className="text-sm font-medium">Market context</div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                    {view.company.marketContext ?? "No additional market context yet."}
                  </p>
                </div>
                <div className="rounded-3xl border border-[var(--border)] bg-white/60 p-5">
                  <div className="text-sm font-medium">Decision context</div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                    {view.capabilities.length
                      ? `${view.capabilities.length} visible capabilities are currently tracked for this company, with ${view.signals.length} recent signal${view.signals.length === 1 ? "" : "s"} supporting the current profile.`
                      : "No visible capabilities are attached to this company yet."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <CompanyInlineEditPanel view={view} canEdit={canEdit} />

          <Card className="rounded-[32px]">
            <CardHeader className="space-y-2">
              <CardTitle>Capability context</CardTitle>
              <p className="text-sm text-[var(--muted-foreground)]">
                Review the company’s visible capabilities, their current Use Case fit, and the latest signals attached to each one.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {view.capabilities.map((entry) => (
                <div key={entry.capability.id} className="space-y-4 rounded-3xl border border-[var(--border)] bg-white/60 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <Link
                        href={`/capabilities/${entry.capability.id}${useCaseContext ? `?fromUseCase=${useCaseContext.slug}` : ""}`}
                        className="font-semibold"
                      >
                        {entry.capability.name}
                      </Link>
                      <div className="mt-2 text-sm text-[var(--muted-foreground)]">
                        {entry.capability.summary}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{entry.capability.capabilityType}</Badge>
                      {entry.latestSignal ? (
                        <Badge tone="muted">Last signal {formatDate(entry.latestSignal.observedAt)}</Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {entry.mappings.slice(0, 3).map((mapping) => (
                      <Badge key={mapping.id} tone="secondary">
                        {mapping.useCase.name} · {mapping.pathway}
                      </Badge>
                    ))}
                    {!entry.mappings.length ? <Badge tone="muted">No mapped Use Cases yet</Badge> : null}
                  </div>
                  {entry.mappings.length ? (
                    <div className="space-y-3">
                      {entry.mappings.slice(0, 2).map((mapping) => (
                        <div key={mapping.id} className="rounded-3xl border border-[var(--border)] bg-white/70 p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-semibold">{mapping.useCase.name}</div>
                            <Badge>{mapping.pathway}</Badge>
                            <Badge tone="secondary">{mapping.relevanceBand} relevance</Badge>
                          </div>
                          <p className="mt-2 text-sm text-[var(--muted-foreground)]">{mapping.whyItMatters}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="rounded-[32px]">
            <CardHeader>
              <CardTitle>Recent company signals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {view.signals.slice(0, 8).map((signal) => (
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
                  No recent signals are attached to this company yet.
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-[32px]">
            <CardHeader>
              <CardTitle>Public contacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {view.contacts.map((contact) => (
                <div key={contact.id} className="rounded-3xl border border-[var(--border)] bg-white/60 p-4">
                  <div className="font-semibold">{contact.name}</div>
                  <div className="text-sm text-[var(--muted-foreground)]">{contact.title}</div>
                  {contact.email ? <div className="mt-2 text-sm">{contact.email}</div> : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[32px]">
            <CardHeader>
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
