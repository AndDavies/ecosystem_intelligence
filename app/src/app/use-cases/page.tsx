import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { getUseCasesIndex } from "@/lib/data/repository";
import { resolveUseCaseConfig } from "@/lib/use-case-config";
import { formatDate } from "@/lib/utils";

const coverageGaps = [
  "Integrated air and missile defence",
  "Long-range strike",
  "Force generation and training",
  "Procurement acceleration as a workflow"
];

export default async function UseCasesPage() {
  const profile = await requireProfile();
  const useCases = await getUseCasesIndex();

  return (
    <AppShell profile={profile}>
      <SectionHeading
        title="Mission Areas / Use Cases"
        description="Start here when the question is a mission problem, enabling need, or engagement decision."
        eyebrow="Mission-led discovery"
        breadcrumbs={[
          { label: "Home", href: "/app" },
          { label: "Mission Areas" }
        ]}
      />
      <Card variant="strong" className="rounded-[32px]">
        <CardContent className="p-0">
          <div className="hidden grid-cols-[minmax(18rem,1.5fr)_8rem_minmax(12rem,1fr)_8rem_10rem_5rem] gap-4 border-b border-[var(--border)] bg-[var(--card-muted)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)] xl:grid">
            <div>Mission Area</div>
            <div>Type</div>
            <div>Technical Domains</div>
            <div>Coverage</div>
            <div>Freshness</div>
            <div className="text-right">Open</div>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {useCases.map((useCase) => {
              const useCaseConfig = resolveUseCaseConfig(useCase, useCase.domains);

              return (
                <Link
                  key={useCase.id}
                  href={`/use-cases/${useCase.slug}`}
                  className="block px-4 py-4 no-underline transition hover:bg-[var(--card-muted)] xl:grid xl:grid-cols-[minmax(18rem,1.5fr)_8rem_minmax(12rem,1fr)_8rem_10rem_5rem] xl:items-center xl:gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold text-[var(--foreground)]">{useCase.name}</div>
                      {useCaseConfig.featured ? <Badge tone="info">Featured</Badge> : null}
                    </div>
                    <div className="mt-1 line-clamp-2 text-sm leading-5 text-[var(--muted-foreground)]">
                      <span className="font-medium text-[var(--foreground)]">Use this when: </span>
                      {useCaseConfig.detail.orientation.useThisWhen}
                    </div>
                    <div className="mt-1 line-clamp-1 text-xs leading-5 text-[var(--muted-foreground)]">
                      Example: {useCaseConfig.detail.orientation.exampleQuestion}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 xl:mt-0">
                    <Badge tone={useCase.priorityTier === "p1" ? "success" : "info"}>
                      {useCase.priorityTier.toUpperCase()}
                    </Badge>
                    <Badge tone={useCase.useCaseKind === "mission" ? "secondary" : "surface"}>
                      {useCase.useCaseKind === "mission" ? "Mission" : "Enabling"}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 xl:mt-0">
                    {useCase.domains.slice(0, 2).map((domain) => (
                      <Badge key={domain.id} tone="outline">
                        {domain.name}
                      </Badge>
                    ))}
                    {useCase.domains.length > 2 ? <Badge tone="muted">+{useCase.domains.length - 2}</Badge> : null}
                  </div>
                  <div className="mt-3 text-sm font-semibold text-[var(--foreground)] xl:mt-0">
                    {useCase.capabilityCount} capabilities
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 xl:mt-0">
                    <FreshnessBadge freshness={useCase.freshness} />
                    {useCase.freshness.lastActivityAt ? (
                      <span className="text-xs text-[var(--muted-foreground)]">{formatDate(useCase.freshness.lastActivityAt)}</span>
                    ) : null}
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--primary)] xl:mt-0 xl:justify-end">
                    Open
                    <ArrowRight className="size-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Card variant="rail" className="mt-6 rounded-[32px]">
        <CardHeader className="space-y-2">
          <div className="workspace-kicker">Coverage discipline</div>
          <CardTitle>Priority areas intentionally held as gaps</CardTitle>
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">
            These are valid CAF/DND, Government of Canada, and NATO priority themes, but the current dataset does not yet
            have enough credible capability and company coverage to promote them as active mission areas.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {coverageGaps.map((gap) => (
            <Badge key={gap} tone="outline" className="px-3 py-1.5">
              {gap}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
