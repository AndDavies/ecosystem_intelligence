import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { SnapshotStrip, WorkspaceEmptyState } from "@/components/workspace/workspace-primitives";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { getDomainBySlug } from "@/lib/data/repository";
import { formatDate } from "@/lib/utils";

export default async function DomainDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const profile = await requireProfile();
  const { slug } = await params;
  const view = await getDomainBySlug(slug);

  if (!view) {
    notFound();
  }

  return (
    <AppShell profile={profile}>
      <SectionHeading
        title={view.domain.name}
        description={view.domain.description ?? "No domain description yet."}
        eyebrow="Domain landscape"
        breadcrumbs={[
          { label: "Home", href: "/app" },
          { label: "Domains", href: "/domains" },
          { label: view.domain.name }
        ]}
        backHref="/domains"
        backLabel="Back to Domains"
        meta={
          <>
            <FreshnessBadge freshness={view.freshness} />
            <Badge tone="muted">{view.useCaseCount} linked use cases</Badge>
            <Badge tone="muted">{view.companyCount} companies</Badge>
            <Badge tone="surface">{view.capabilityCount} capabilities</Badge>
          </>
        }
      />

      <Card variant="hero" className="mb-6 rounded-[36px]">
        <CardHeader className="space-y-3">
          <div className="workspace-kicker">
            <ShieldCheck className="size-3.5" />
            Primary question
          </div>
          <CardTitle>What does the current landscape look like in this technical area?</CardTitle>
          <p className="max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
            Use this page to move from the technical domain into linked use cases, companies, and capabilities without losing the surrounding trust context.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <SnapshotStrip
            items={[
              {
                label: "Linked use cases",
                value: String(view.useCaseCount),
                detail: view.useCases[0] ? `Lead route: ${view.useCases[0].name}` : "No use cases linked yet."
              },
              {
                label: "Tracked companies",
                value: String(view.companyCount),
                detail: view.companies[0] ? `Top visible company: ${view.companies[0].company.name}` : "No company context yet."
              },
              {
                label: "Tracked capabilities",
                value: String(view.capabilityCount),
                detail: view.capabilities[0] ? `Lead capability: ${view.capabilities[0].capability.name}` : "No capability context yet."
              },
              {
                label: "Cluster coverage",
                value: String(view.clusters.length),
                detail: view.freshness.detail
              }
            ]}
          />
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <Card variant="strong" className="rounded-[32px]">
            <CardHeader className="space-y-3">
              <div className="workspace-kicker">Mission links</div>
              <CardTitle>Linked use cases</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {view.useCases.map((useCase) => (
                <div key={useCase.id} className="workspace-subtle rounded-[26px] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{useCase.name}</div>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{useCase.summary}</p>
                    </div>
                    <Link href={`/use-cases/${useCase.slug}`} className="text-sm font-medium text-[var(--primary)]">
                      Open
                    </Link>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <FreshnessBadge freshness={useCase.freshness} />
                    <Badge tone="muted">{useCase.capabilityCount} capabilities</Badge>
                  </div>
                </div>
              ))}
              {!view.useCases.length ? <WorkspaceEmptyState message="No linked use cases are available for this domain yet." /> : null}
            </CardContent>
          </Card>

          <Card variant="strong" className="rounded-[32px]">
            <CardHeader className="space-y-3">
              <div className="workspace-kicker">Organizations</div>
              <CardTitle>Top companies in this domain</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {view.companies.map((item) => (
                <div key={item.company.id} className="workspace-subtle rounded-[26px] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{item.company.name}</div>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{item.company.overview}</p>
                    </div>
                    <Link
                      href={`/companies/${item.company.id}?fromDomain=${view.domain.slug}`}
                      className="text-sm font-medium text-[var(--primary)]"
                    >
                      Open
                    </Link>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge>{item.company.headquarters}</Badge>
                    <FreshnessBadge freshness={item.freshness} />
                    <Badge tone="muted">{item.capabilityCount} capabilities</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.topUseCases.map((useCase) => (
                      <Badge key={`${item.company.id}-${useCase.id}`} tone="secondary">
                        {useCase.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
              {!view.companies.length ? <WorkspaceEmptyState message="No companies are attached to this domain yet." /> : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card variant="rail" className="rounded-[32px]">
            <CardHeader className="space-y-3">
              <div className="workspace-kicker">Capabilities</div>
              <CardTitle>Domain capabilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {view.capabilities.map((item) => (
                <div key={item.capability.id} className="workspace-subtle rounded-[26px] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{item.capability.name}</div>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{item.capability.summary}</p>
                    </div>
                    <Link
                      href={`/capabilities/${item.capability.id}?fromDomain=${view.domain.slug}`}
                      className="text-sm font-medium text-[var(--primary)]"
                    >
                      Open
                    </Link>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge tone="secondary">{item.company.name}</Badge>
                    <FreshnessBadge freshness={item.freshness} />
                    {item.latestSignal ? (
                      <Badge tone="muted">Last signal {formatDate(item.latestSignal.observedAt)}</Badge>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.useCases.slice(0, 3).map((useCase) => (
                      <Badge key={`${item.capability.id}-${useCase.id}`} tone="muted">
                        {useCase.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
              {!view.capabilities.length ? <WorkspaceEmptyState message="No capabilities are attached to this domain yet." /> : null}
            </CardContent>
          </Card>

          <Card variant="rail" className="rounded-[32px]">
            <CardHeader className="space-y-3">
              <div className="workspace-kicker">Structure</div>
              <CardTitle>Cluster summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {view.clusters.map((item) => (
                <div key={item.cluster.id} className="workspace-subtle rounded-[26px] p-4">
                  <div className="font-semibold">{item.cluster.name}</div>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">{item.cluster.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge tone="muted">{item.count} capabilities</Badge>
                    {item.topCapability ? (
                      <Badge tone="secondary">
                        {item.topCapability.name} · {item.topCapability.companyName}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              ))}
              {!view.clusters.length ? <WorkspaceEmptyState message="No cluster summary is available for this domain yet." /> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
