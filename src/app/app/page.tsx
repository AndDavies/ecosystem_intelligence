import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Building2,
  Clock3,
  FolderSync,
  Layers3,
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
      <div className="space-y-8">
        <section className="grid gap-5 xl:grid-cols-[1.45fr_0.9fr]">
          <Card variant="hero" className="rounded-[36px]">
            <CardHeader className="space-y-4">
              <div className="workspace-kicker">
                <ShieldCheck className="size-3.5" />
                Discovery workspace
              </div>
              <CardTitle className="max-w-4xl text-4xl md:text-5xl">
                Start from the question you need to answer, then move into records with trust and evidence still visible.
              </CardTitle>
              <p className="max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
                Use the workspace to move between mission-led discovery, technical landscapes, and known companies
                without losing review posture, freshness, or the capability context behind each recommendation.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <SnapshotStrip
                items={[
                  {
                    label: "Active Use Cases",
                    value: String(home.useCases.length),
                    detail: "Mission-led entry paths for ecosystem discovery."
                  },
                  {
                    label: "Tracked Domains",
                    value: String(home.domains.length),
                    detail: "Technical areas that organize the wider landscape."
                  },
                  {
                    label: "Tracked Companies",
                    value: String(home.companies.length),
                    detail: "Organizations with portfolio, signal, and evidence context."
                  },
                  {
                    label: "Pending Reviews",
                    value: String(home.pendingReviews.length),
                    detail: "High-impact changes waiting for reviewer approval."
                  }
                ]}
              />
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Button asChild className="w-full justify-between">
                  <Link href="/use-cases">
                    Explore Use Cases
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="surface" className="w-full justify-between">
                  <Link href="/domains">
                    Explore Domains
                    <Layers3 className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="surface" className="w-full justify-between">
                  <Link href="/companies">
                    Explore Companies
                    <Building2 className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="surface" className="w-full justify-between">
                  <Link href="/app#search">
                    Open Search
                    <Search className="size-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5">
            <Card variant="rail" className="rounded-[34px]">
              <CardHeader className="space-y-3">
                <div className="workspace-kicker">How to work here</div>
                <CardTitle>Use the workspace like a decision surface, not a static directory.</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Choose the entry path that best matches the question you are trying to answer.",
                  "Use search, freshness, and linked records to narrow attention without losing context.",
                  "Open the underlying capability or company record when you need evidence, signals, or governance detail."
                ].map((step, index) => (
                  <div key={step} className="workspace-subtle rounded-[26px] px-4 py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white">
                        {index + 1}
                      </div>
                      <div className="pt-1 text-sm leading-6 text-[var(--foreground)]">{step}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <DiscoveryCard
              eyebrow="Workspace actions"
              title="Jump into help, enrichment, or governance without leaving the app shell."
              description="Support routes stay available, but the center of gravity remains discovery and evidence-backed records."
              href="/help"
              actionLabel="Open Help Center"
              badges={
                <>
                  <Badge tone="outline">
                    <BookOpen className="mr-1.5 size-3" />
                    Help
                  </Badge>
                  {profile.role === "admin" ? (
                    <Badge tone="outline">
                      <FolderSync className="mr-1.5 size-3" />
                      Admin enrichment
                    </Badge>
                  ) : null}
                </>
              }
              footer={
                <>
                  {profile.role === "admin" ? (
                    <Button asChild variant="outline" className="justify-between">
                      <Link href="/admin/enrichment">
                        Manage Enrichment
                        <FolderSync className="size-4" />
                      </Link>
                    </Button>
                  ) : null}
                </>
              }
            />
          </div>
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

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <Card variant="strong" className="rounded-[32px]">
            <CardHeader className="space-y-3">
              <div className="workspace-kicker">Recent activity</div>
              <CardTitle>Recent updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {home.recentUpdates.map((event) => (
                <div key={event.id} className="workspace-subtle rounded-[26px] p-4">
                  <div className="text-sm font-medium leading-6">{event.summary}</div>
                  <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {event.actorName} · {formatFieldLabel(event.entityType)}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                    <Clock3 className="size-3.5" />
                    {formatDate(event.createdAt)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card variant="strong" className="rounded-[32px]">
            <CardHeader className="space-y-3">
              <div className="workspace-kicker">Governance view</div>
              <CardTitle>Pending review queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {home.pendingReviews.length ? (
                home.pendingReviews.map((request) => (
                  <div key={request.id} className="workspace-subtle rounded-[26px] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-medium">{request.entityLabel}</div>
                      <Badge tone={request.originType === "ai" ? "info" : "muted"}>
                        {request.originLabel}
                      </Badge>
                    </div>
                    <div className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {request.changedFieldDetails.map((field) => field.label).join(", ")}
                    </div>
                  </div>
                ))
              ) : (
                <div className="workspace-subtle rounded-[26px] p-4 text-sm text-[var(--muted-foreground)]">
                  No pending high-impact changes.
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
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
