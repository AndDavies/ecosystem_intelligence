import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Building2,
  FolderSync,
  ListChecks,
  Search,
  ShieldCheck
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { GlobalSearch } from "@/components/search/global-search";
import { DiscoveryCard, SnapshotStrip } from "@/components/workspace/workspace-primitives";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { getHomeData, searchRecords } from "@/lib/data/repository";
import { resolveUseCaseConfig } from "@/lib/use-case-config";
import { formatDate, formatFieldLabel } from "@/lib/utils";

export default async function AppHomePage() {
  const profile = await requireProfile();
  const home = await getHomeData();
  const initialSearchResults = await searchRecords("");

  return (
    <AppShell profile={profile}>
      <div className="space-y-7">
        <SectionHeading
          title="Dashboard"
          description="A compact operating surface for mission areas, companies, lists, evidence posture, and records that need attention."
          eyebrow="BD intelligence workspace"
          actions={
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/use-cases">
                  Explore Use Cases
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/companies">
                  Browse Companies
                  <Building2 className="size-4" />
                </Link>
              </Button>
            </div>
          }
        />

        <SnapshotStrip
          items={[
            {
              label: "Use Cases",
              value: String(home.useCases.length),
              detail: "Mission-led entry paths.",
              href: "/use-cases",
              hrefLabel: "Open"
            },
            {
              label: "Domains",
              value: String(home.domains.length),
              detail: "Technical landscape areas.",
              href: "/domains",
              hrefLabel: "Open"
            },
            {
              label: "Companies",
              value: String(home.companies.length),
              detail: "Tracked organizations.",
              href: "/companies",
              hrefLabel: "Open"
            },
            {
              label: "Pending Reviews",
              value: String(home.pendingReviews.length),
              detail: "Changes requiring attention.",
              href: "/review",
              hrefLabel: "Review"
            }
          ]}
        />

        <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <Card variant="strong" className="rounded-[28px]">
            <CardHeader className="pb-4">
              <div className="workspace-kicker">
                <ShieldCheck className="size-3.5" />
                Mission control
              </div>
              <CardTitle>Start with the same controls BD users expect: search, browse, lists, and briefings.</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <DashboardAction href="/app#search" label="Search records" detail="Find companies, capabilities, domains, and use cases." icon={<Search className="size-4" />} />
              <DashboardAction href="/use-cases" label="Mission areas" detail="Open use-case led landscapes and target lists." icon={<FolderSync className="size-4" />} />
              <DashboardAction href="/companies" label="Companies" detail="Browse organizations with domains and evidence posture." icon={<Building2 className="size-4" />} />
              <DashboardAction href="/shortlists" label="Lists" detail="Return to saved BD working lists and next steps." icon={<ListChecks className="size-4" />} />
            </CardContent>
          </Card>

          <DiscoveryCard
            eyebrow="Demo path"
            title="Arctic Domain Awareness briefing"
            description="A guided path from mission context to target comparison, evidence, gaps, and a saved shortlist."
            href="/use-cases/arctic-domain-awareness/briefing"
            actionLabel="Open briefing"
            className="rounded-[28px]"
            badges={
              <>
                <Badge tone="success">Validation-ready</Badge>
                <Badge tone="outline">{home.shortlists.length} saved lists</Badge>
              </>
            }
            footer={
              <Button asChild variant="outline" className="justify-between">
                <Link href="/shortlists">
                  Open Lists
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            }
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <Card variant="strong" className="rounded-[28px]">
            <CardHeader>
              <div className="workspace-kicker">Saved lists</div>
              <CardTitle>Working lists</CardTitle>
              <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                Shortlists preserve the recommendation, rationale, owner, and next step without turning the product into a CRM.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {home.shortlists.length ? (
                home.shortlists.slice(0, 3).map((item) => (
                  <Link
                    key={item.shortlist.id}
                    href={`/shortlists/${item.shortlist.id}`}
                    className="block rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] px-4 py-3 no-underline hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-[var(--foreground)]">{item.shortlist.name}</div>
                        <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                          {item.useCase?.name ?? "General list"} · updated {formatDate(item.updatedAt)}
                        </div>
                      </div>
                      <Badge tone="surface">{item.itemCount} targets</Badge>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card-muted)] p-4 text-sm text-[var(--muted-foreground)]">
                  No lists yet. Add targets from a Use Case briefing to create the first working list.
                </div>
              )}
            </CardContent>
          </Card>

          <Card variant="strong" className="rounded-[28px]">
            <CardHeader>
              <div className="workspace-kicker">Attention queue</div>
              <CardTitle>What changed or needs review</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  Recent updates
                </div>
                {home.recentUpdates.slice(0, 3).map((event) => (
                  <div key={event.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-4">
                    <div className="text-sm font-semibold leading-6">{event.summary}</div>
                    <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {event.actorName} · {formatFieldLabel(event.entityType)} · {formatDate(event.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  Pending reviews
                </div>
                {home.pendingReviews.length ? (
                  home.pendingReviews.slice(0, 3).map((request) => (
                    <Link
                      key={request.id}
                      href="/review"
                      className="block rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-4 no-underline hover:bg-white"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-[var(--foreground)]">{request.entityLabel}</div>
                        <Badge tone={request.originType === "ai" ? "info" : "muted"}>{request.originLabel}</Badge>
                      </div>
                      <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                        {request.changedFieldDetails.map((field) => field.label).join(", ")}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card-muted)] p-4 text-sm text-[var(--muted-foreground)]">
                    No pending high-impact changes.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <GlobalSearch initialResults={initialSearchResults} />

        <section className="space-y-4">
          <SectionHeading
            title="Discovery Paths"
            description="Choose the path that best matches the question you are trying to answer."
            eyebrow="Flexible discovery"
          />
          <div className="grid gap-5 xl:grid-cols-3">
            <BrowseColumn
              title="Use Cases"
              description="Best when the user question starts from a mission need, workflow, or operational problem."
              items={home.useCases.slice(0, 3).map((useCase) => {
                const useCaseConfig = resolveUseCaseConfig(useCase, useCase.domains);

                return {
                  id: useCase.id,
                  title: useCase.name,
                  href: `/use-cases/${useCase.slug}`,
                  summary: useCase.summary,
                  freshness: useCase.freshness,
                  badges: [
                    useCaseConfig.cardBadge,
                    `${useCase.capabilityCount} mapped capabilities`
                  ]
                };
              })}
            />
            <BrowseColumn
              title="Domains"
              description="Best when the user wants to explore a technical area before narrowing to specific records."
              items={home.domains.slice(0, 3).map((domain) => ({
                id: domain.domain.id,
                title: domain.domain.name,
                href: `/domains/${domain.domain.slug}`,
                summary: domain.domain.description ?? "No domain description yet.",
                freshness: domain.freshness,
                badges: [
                  `${domain.useCaseCount} use cases`,
                  `${domain.companyCount} companies`,
                  `${domain.capabilityCount} capabilities`
                ]
              }))}
            />
            <BrowseColumn
              title="Companies"
              description="Best when the user already knows the organization and wants portfolio, evidence, and market context."
              items={home.companies.slice(0, 3).map((company) => ({
                id: company.company.id,
                title: company.company.name,
                href: `/companies/${company.company.id}`,
                summary: company.company.overview,
                freshness: company.freshness,
                badges: [
                  company.company.headquarters,
                  ...company.domains.map((domain) => domain.name).slice(0, 2),
                  `${company.useCaseCount} use cases`
                ]
              }))}
            />
          </div>
        </section>

      </div>
    </AppShell>
  );
}

function DashboardAction({
  href,
  label,
  detail,
  icon
}: {
  href: string;
  label: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-4 no-underline transition hover:border-[var(--primary)]/25 hover:bg-white hover:shadow-[0_12px_30px_rgba(20,34,24,0.06)]"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
        <span className="flex size-8 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] transition group-hover:bg-[var(--primary)] group-hover:text-white">
          {icon}
        </span>
        {label}
      </div>
      <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">{detail}</p>
    </Link>
  );
}

function BrowseColumn({
  title,
  description,
  items
}: {
  title: string;
  description: string;
  items: Array<{
    id: string;
    title: string;
    href: string;
    summary: string;
    freshness: { label: string; tone: "success" | "info" | "muted" | "danger"; detail: string; lastActivityAt: string | null };
    badges: string[];
  }>;
}) {
  return (
    <Card variant="strong" className="rounded-[32px]">
      <CardHeader className="space-y-3">
        <div className="workspace-kicker">{title}</div>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="workspace-subtle rounded-[28px] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{item.title}</div>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{item.summary}</p>
              </div>
              <Button asChild variant="subtle" className="shrink-0">
                <Link href={item.href}>
                  Open
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <FreshnessBadge freshness={item.freshness} />
              {item.badges.map((badge) => (
                <Badge key={`${item.id}-${badge}`} tone="outline">
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
