import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, BookmarkPlus, Building2, Download, ExternalLink, FileCheck2, RefreshCw, ShieldCheck } from "lucide-react";
import { EvidenceList } from "@/components/atlas/evidence-list";
import { EmptyCoverage, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { MappingInlineEditPanel, CapabilityInlineEditPanel } from "@/components/operations/inline-edit-panels";
import { SnapshotStrip, WorkspaceEmptyState } from "@/components/workspace/workspace-primitives";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requestRefresh } from "@/lib/actions/review";
import { assessmentConfidenceLabel, evidenceStrengthLabel, publicSourceCountLabel } from "@/lib/atlas/presentation";
import { requireProfile } from "@/lib/auth";
import { getCapabilityById } from "@/lib/data/repository";
import { getAtlasCapabilityBySlug } from "@/lib/atlas/repository";
import { getFreshnessState } from "@/lib/freshness";
import { formatDate, formatFieldLabel, toTitleCase } from "@/lib/utils";
import type { CitationView } from "@/types/view-models";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const publicCapability = await getAtlasCapabilityBySlug(id);

  if (!publicCapability) {
    return { title: "Capability workspace", robots: { index: false, follow: false } };
  }

  return {
    title: publicCapability.capability.name,
    description: publicCapability.capability.summary,
    alternates: { canonical: `/capabilities/${publicCapability.capability.slug}` },
    openGraph: {
      title: publicCapability.capability.name,
      description: publicCapability.capability.summary,
      url: `/capabilities/${publicCapability.capability.slug}`
    }
  };
}

export default async function CapabilityPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fromUseCase?: string; fromDomain?: string; fromCompany?: string }>;
}) {
  const { id } = await props.params;
  const publicCapability = await getAtlasCapabilityBySlug(id);

  if (publicCapability) {
    return <PublicCapabilityPage organization={publicCapability.organization} capability={publicCapability.capability} />;
  }

  return <LegacyCapabilityPage {...props} />;
}

async function LegacyCapabilityPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fromUseCase?: string; fromDomain?: string; fromCompany?: string }>;
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
  const leadMapping = view.mappings[0] ?? null;
  const evidenceCount =
    view.citations.length +
    view.companyCitations.length +
    view.mappings.reduce((total, mapping) => total + mapping.citations.length, 0);
  const primaryEvidence = [...view.citations, ...view.companyCitations].slice(0, 3);
  const canEdit = profile.role !== "viewer";
  const companyContext = resolvedSearchParams.fromCompany === view.company.id ? view.company : null;
  const domainContext = resolvedSearchParams.fromDomain === view.domain.slug ? view.domain : null;
  const useCaseContext = resolvedSearchParams.fromUseCase
    ? view.mappings.find((mapping) => mapping.useCase.slug === resolvedSearchParams.fromUseCase)?.useCase
    : null;
  const breadcrumbs = [
    { label: "Home", href: "/app" },
    ...(companyContext
      ? [
          { label: "Companies", href: "/companies" },
          { label: companyContext.name, href: `/companies/${companyContext.id}` }
        ]
      : domainContext
        ? [
            { label: "Domains", href: "/domains" },
            { label: domainContext.name, href: `/domains/${domainContext.slug}` }
          ]
        : useCaseContext
          ? [
              { label: "Use Cases", href: "/use-cases" },
              { label: useCaseContext.name, href: `/use-cases/${useCaseContext.slug}` }
            ]
          : []),
    { label: view.capability.name }
  ];
  const backHref = companyContext
    ? `/companies/${companyContext.id}`
    : domainContext
      ? `/domains/${domainContext.slug}`
      : useCaseContext
        ? `/use-cases/${useCaseContext.slug}`
        : "/app";
  const backLabel = companyContext
    ? `Back to ${companyContext.name}`
    : domainContext
      ? `Back to ${domainContext.name}`
      : useCaseContext
        ? `Back to ${useCaseContext.name}`
        : "Back to Home";
  const companyProfileHref = `/companies/${view.company.id}?${new URLSearchParams({
    ...(resolvedSearchParams.fromDomain ? { fromDomain: resolvedSearchParams.fromDomain } : {}),
    ...(useCaseContext ? { fromUseCase: useCaseContext.slug } : {}),
    fromCapability: view.capability.id
  }).toString()}`;

  return (
    <AppShell profile={profile}>
      <SectionHeading
        title={view.capability.name}
        description={view.capability.summary}
        eyebrow="Capability record"
        breadcrumbs={breadcrumbs}
        backHref={backHref}
        backLabel={backLabel}
        meta={
          <>
            <Badge tone="surface">{view.capability.capabilityType}</Badge>
            <Link href={`/companies/${view.company.id}`} className="no-underline">
              <Badge tone="outline">{view.company.name}</Badge>
            </Link>
            <Link href={`/domains/${view.domain.slug}`} className="no-underline">
              <Badge tone="outline">{view.domain.name}</Badge>
            </Link>
            <FreshnessBadge freshness={capabilityFreshness} />
            {view.latestSignal ? <Badge tone="muted">Last signal {formatDate(view.latestSignal.observedAt)}</Badge> : null}
          </>
        }
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
          <Card variant="hero" className="rounded-[36px]">
            <CardHeader className="space-y-3">
              <div className="workspace-kicker">
                <Activity className="size-3.5" />
                Primary question
              </div>
              <CardTitle>Should we pay attention to this capability, and why now?</CardTitle>
              <p className="max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
                {leadMapping
                  ? `This capability currently maps into ${view.mappings.length} Use Case ${view.mappings.length === 1 ? "path" : "paths"}, with its strongest ranking in ${leadMapping.useCase.name}.`
                  : "This capability exists in the dataset but does not yet have a mapped decision context."}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <ContextPanel
                  title="Decision context"
                  icon={<Activity className="size-4 text-[var(--primary)]" />}
                  body={
                    leadMapping
                      ? leadMapping.whyItMatters
                      : "No mapping rationale is attached yet, so the record should be treated as a candidate for follow-up rather than a fully supported priority."
                  }
                />
                <div className="grid gap-4">
                  <ContextPanel
                    title="Suggested next move"
                    icon={<ShieldCheck className="size-4 text-[var(--primary)]" />}
                    body={
                      leadMapping
                        ? `${toTitleCase(leadMapping.suggestedActionType)}${leadMapping.actionNote ? `: ${leadMapping.actionNote}` : "."}`
                        : "No suggested action is attached yet."
                    }
                  />
                  <ContextPanel
                    title="Company context"
                    icon={<Building2 className="size-4 text-[var(--primary)]" />}
                    body={view.capability.companyFacingContext ?? "No additional company context yet."}
                    actionHref={companyProfileHref}
                    actionLabel="Open company profile"
                  />
                </div>
              </div>

              <SnapshotStrip
                items={[
                  {
                    label: "Use Case mappings",
                    value: String(view.mappings.length),
                    detail: leadMapping ? `Strongest read: ${leadMapping.useCase.name}` : "No mapped Use Cases yet."
                  },
                  {
                    label: "Evidence coverage",
                    value: String(evidenceCount),
                    detail: "Capability, company, and mapping citations attached to the current record."
                  },
                  {
                    label: "Latest signal",
                    value: view.latestSignal ? formatDate(view.latestSignal.observedAt) : "No recent signal",
                    detail: view.latestSignal?.title ?? "Signal coverage needs a refresh."
                  },
                  {
                    label: "Domain landscape",
                    value: view.domain.name,
                    detail: view.domain.description ?? "No domain description is available yet.",
                    href: `/domains/${view.domain.slug}`,
                    hrefLabel: "Open domain profile"
                  }
                ]}
              />

              <div className="space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  Lead evidence
                </div>
                <div className="flex flex-wrap gap-2">
                  {primaryEvidence.length ? (
                    primaryEvidence.map((citation, index) => (
                      <a
                        key={`${citation.sourceUrl}-${index}`}
                        href={citation.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-[var(--border)] bg-white/88 px-3 py-1.5 text-xs font-medium text-[var(--foreground)] no-underline transition hover:border-[var(--primary)]/24 hover:bg-white"
                      >
                        {citation.publisher} · {citation.sourceTitle}
                      </a>
                    ))
                  ) : (
                    <Badge tone="muted">No lead evidence attached yet</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <CapabilityInlineEditPanel view={view} canEdit={canEdit} />

          <Card variant="strong" className="rounded-[32px]">
            <CardHeader className="space-y-3">
              <div className="workspace-kicker">Mapped decisions</div>
              <CardTitle>Use Case mappings</CardTitle>
              <p className="text-sm text-[var(--muted-foreground)]">
                Review the live rationale for each mapping, then adjust narrative or route higher-impact changes into review.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {view.mappings.map((mapping) => (
                <div key={mapping.id} className="workspace-subtle rounded-[28px] p-5">
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
                            <Badge tone="surface">{mapping.pathway}</Badge>
                            <Badge tone="outline">{mapping.relevanceBand} relevance</Badge>
                            <Badge tone="muted">{mapping.defenceRelevance} defence fit</Badge>
                            <Badge tone="outline">Score {mapping.rankingScore}</Badge>
                            <FreshnessBadge freshness={mappingFreshness} />
                          </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <ContextPanel title="Why it matters" body={mapping.whyItMatters} />
                          <ContextPanel
                            title="Suggested action"
                            body={toTitleCase(mapping.suggestedActionType)}
                            detail={mapping.actionNote ?? undefined}
                          />
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
          <Card variant="rail" className="rounded-[32px]">
            <CardHeader className="space-y-3">
              <div className="workspace-kicker">Trust summary</div>
              <CardTitle>What supports the current read</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="workspace-subtle rounded-[26px] p-4">
                <div className="text-sm font-semibold">Freshness and confidence</div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  {capabilityFreshness.detail}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <FreshnessBadge freshness={capabilityFreshness} />
                  {view.latestSignal ? (
                    <Badge tone="muted">Latest signal {formatDate(view.latestSignal.observedAt)}</Badge>
                  ) : (
                    <Badge tone="danger">No recent signal attached</Badge>
                  )}
                  <Badge tone="outline">Capability updated {formatDate(view.capability.lastUpdatedAt)}</Badge>
                  <Badge tone="outline">Company updated {formatDate(view.company.lastUpdatedAt)}</Badge>
                </div>
              </div>
              <div className="workspace-subtle rounded-[26px] p-4">
                <div className="text-sm font-semibold">Related context</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild variant="subtle">
                    <Link href={companyProfileHref}>Open company profile</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/domains/${view.domain.slug}`}>Open domain profile</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="rail" className="rounded-[32px]">
            <CardHeader className="space-y-3">
              <div className="workspace-kicker">Signals</div>
              <CardTitle>Recent signals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {view.signals.map((signal) => (
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
                <WorkspaceEmptyState message="No recent signals are attached to this capability yet." />
              ) : null}
            </CardContent>
          </Card>

          <Card variant="strong" className="rounded-[32px]">
            <CardHeader className="space-y-3">
              <div className="workspace-kicker">Evidence</div>
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

          <Card variant="strong" className="rounded-[32px]">
            <CardHeader className="space-y-3">
              <div className="workspace-kicker">Contacts</div>
              <CardTitle>Contacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {view.contacts.map((contact) => (
                <div key={contact.id} className="workspace-subtle rounded-[24px] p-4">
                  <div className="font-semibold">{contact.name}</div>
                  <div className="text-sm text-[var(--muted-foreground)]">{contact.title}</div>
                  {contact.email ? <div className="mt-1 text-sm">{contact.email}</div> : null}
                </div>
              ))}
              {!view.contacts.length ? <WorkspaceEmptyState message="No public contacts are attached to this capability yet." /> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function PublicCapabilityPage({
  organization,
  capability
}: {
  organization: Awaited<ReturnType<typeof getAtlasCapabilityBySlug>> extends infer T
    ? T extends { organization: infer O }
      ? O
      : never
    : never;
  capability: Awaited<ReturnType<typeof getAtlasCapabilityBySlug>> extends infer T
    ? T extends { capability: infer C }
      ? C
      : never
    : never;
}) {
  const citations = [
    ...capability.citations,
    ...capability.missionMatches.flatMap((match) => match.citations),
    ...capability.demandMatches.flatMap((match) => match.citations)
  ];

  return (
    <PublicPageShell
      eyebrow="Capability dossier"
      title={capability.name}
      description={capability.summary}
      backHref={`/organizations/${organization.slug}`}
      backLabel={`Back to ${organization.name}`}
      actions={
        <>
          <Link href={`/collections?addType=capability&addId=${capability.id}&returnTo=${encodeURIComponent(`/capabilities/${capability.slug}`)}`} className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--atlas-border)] bg-white px-4 text-xs font-semibold text-[var(--atlas-ink-soft)] no-underline hover:bg-[var(--atlas-surface-muted)] hover:no-underline">
            <BookmarkPlus className="size-4" /> Save
          </Link>
          <Link href={`/api/export?type=capability-dossier&slug=${capability.slug}`} className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--atlas-border)] bg-white px-4 text-xs font-semibold text-[var(--atlas-ink-soft)] no-underline hover:bg-[var(--atlas-surface-muted)] hover:no-underline">
            <Download className="size-4" /> Export profile
          </Link>
          <Link href={`/organizations/${organization.slug}`} className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--atlas-primary)] px-4 text-xs font-semibold text-white no-underline hover:bg-[var(--atlas-primary-hover)] hover:no-underline">
            Organization profile <ExternalLink className="size-4" />
          </Link>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1.22fr_0.78fr]">
        <div className="space-y-5">
          <PublicCard title="Capability profile" eyebrow={capability.capabilityType ?? "Verified capability"}>
            <div className="grid gap-5 sm:grid-cols-2">
              <CapabilityList label="Core features" values={capability.coreFeatures} />
              <CapabilityList label="Defence applications" values={capability.defenceApplications} />
              <CapabilityList label="Novelty" values={capability.novelty} empty="No verified novelty claims are published." />
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--atlas-muted)]">Maturity</h3>
                <dl className="mt-2 space-y-2 text-xs text-[var(--atlas-muted)]">
                  {capability.technologyReadinessLevel !== null ? <div><dt className="inline font-semibold">TRL: </dt><dd className="inline">{capability.technologyReadinessLevel}</dd></div> : null}
                  {capability.maturity ? <div><dt className="inline font-semibold">Stage: </dt><dd className="inline">{capability.maturity}</dd></div> : null}
                  {capability.commercialAvailability ? <div><dt className="inline font-semibold">Commercial: </dt><dd className="inline">{capability.commercialAvailability}</dd></div> : null}
                  {capability.technologyReadinessLevel === null && !capability.maturity && !capability.commercialAvailability ? <p className="leading-5 text-[var(--atlas-muted)]">Maturity fields are not published because the reviewed sources do not support them.</p> : null}
                </dl>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-1.5 border-t border-[var(--atlas-border)] pt-4">
              {capability.technicalTags.map((tag) => <span key={tag} className="rounded bg-[var(--atlas-surface-muted)] px-2 py-1 text-[10px] font-medium text-[var(--atlas-muted)]">{toTitleCase(tag)}</span>)}
            </div>
          </PublicCard>

          <PublicCard title="Mission relevance" eyebrow="Analyst assessments">
            {capability.missionMatches.length ? (
              <div className="space-y-3">
                {capability.missionMatches.map((match) => (
                  <article key={match.id} className="rounded-md border border-[var(--atlas-amber)] bg-[var(--atlas-amber-soft)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link href={`/?mission=${match.missionArea.slug}`} className="text-sm font-bold text-[var(--atlas-amber)] no-underline hover:underline">{match.missionArea.name}</Link>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--atlas-amber)]">{assessmentConfidenceLabel(match.confidence)} assessment confidence</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[var(--atlas-amber)]">{match.alignmentSummary}</p>
                  </article>
                ))}
              </div>
            ) : <EmptyCoverage title="Mission relevance not assessed yet" detail="This verified capability does not yet include an analyst assessment against a mission area." />}
          </PublicCard>

          <PublicCard title="Demand relevance" eyebrow="Public demand signals">
            {capability.demandMatches.length ? (
              <div className="space-y-3">
                {capability.demandMatches.map((match) => (
                  <article key={match.id} className="rounded-md border border-[var(--atlas-primary-border)] bg-[var(--atlas-primary-soft)] p-4">
                    <Link href={`/demand/${match.demandSlug}`} className="text-sm font-bold text-[var(--atlas-primary)] no-underline hover:underline">{match.demandTitle}</Link>
                    <p className="mt-2 text-xs leading-5 text-[var(--atlas-ink-soft)]">{match.alignmentSummary}</p>
                    <p className="mt-2 text-[10px] text-[var(--atlas-muted)]">Public-source alignment only; not eligibility or endorsement.</p>
                  </article>
                ))}
              </div>
            ) : <EmptyCoverage title="Demand relevance not assessed yet" detail="No public-demand assessment has been published for this capability." />}
          </PublicCard>
        </div>

        <aside className="space-y-5">
          <PublicCard title="Organization" eyebrow="Associated company">
            <p className="text-base font-bold text-[var(--atlas-ink)]">{organization.name}</p>
            <p className="mt-2 text-xs leading-5 text-[var(--atlas-muted)]">{organization.description}</p>
            <Link href={`/organizations/${organization.slug}`} className="mt-4 inline-flex text-xs font-semibold text-[var(--atlas-primary)] no-underline hover:underline">View organization profile</Link>
          </PublicCard>
          <PublicCard title="Sources" eyebrow={publicSourceCountLabel(new Set(citations.map((citation) => citation.sourceUrl)).size)}>
            <EvidenceList citations={citations} />
          </PublicCard>
          <PublicCard title="Data quality" eyebrow="Profile verification">
            <dl className="grid gap-3 text-xs">
              <div><dt className="text-[var(--atlas-muted)]">Evidence strength</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">{evidenceStrengthLabel(capability.sourceConfidence)}</dd></div>
              <div><dt className="text-[var(--atlas-muted)]">Last verified</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">{formatDate(capability.lastReviewedAt)}</dd></div>
              <div><dt className="text-[var(--atlas-muted)]">Technical domains</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">{capability.technicalDomains.map((domain) => domain.name).join(", ") || "Not yet mapped"}</dd></div>
            </dl>
          </PublicCard>
        </aside>
      </div>
    </PublicPageShell>
  );
}

function CapabilityList({ label, values, empty }: { label: string; values: string[]; empty?: string }) {
  return (
    <div>
      <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--atlas-muted)]">{label}</h3>
      {values.length ? (
        <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[var(--atlas-muted)]">
          {values.map((value) => <li key={value} className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-[var(--atlas-primary)]" />{value}</li>)}
        </ul>
      ) : <p className="mt-2 text-xs leading-5 text-[var(--atlas-muted)]">{empty ?? "No verified values are published."}</p>}
    </div>
  );
}

function ContextPanel({
  title,
  body,
  detail,
  icon,
  actionHref,
  actionLabel
}: {
  title: string;
  body: string;
  detail?: string;
  icon?: React.ReactNode;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="workspace-subtle rounded-[26px] p-5">
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon ?? null}
        {title}
      </div>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{body}</p>
      {detail ? <div className="mt-3 text-sm text-[var(--foreground)]">{detail}</div> : null}
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="mt-3 inline-flex text-sm font-medium no-underline">
          {actionLabel}
        </Link>
      ) : null}
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
