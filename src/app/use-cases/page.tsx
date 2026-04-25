import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { DiscoveryCard } from "@/components/workspace/workspace-primitives";
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
        title="Use Cases"
        description="Use Cases now start from public-priority mission effects: who needs to decide, in which operating context, and what capability pathway can make the outcome more real."
        eyebrow="Mission-led discovery"
        breadcrumbs={[
          { label: "Home", href: "/app" },
          { label: "Use Cases" }
        ]}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {useCases.map((useCase) => {
          const useCaseConfig = resolveUseCaseConfig(useCase, useCase.domains);

          return (
            <DiscoveryCard
              key={useCase.id}
              eyebrow={useCaseConfig.cardBadge}
              title={useCase.name}
              description={useCase.summary}
              href={`/use-cases/${useCase.slug}`}
              actionLabel="Explore Use Case"
              badges={
                <>
                  {useCaseConfig.featured ? <Badge tone="info">Featured</Badge> : null}
                  {useCase.domains.map((domain) => (
                    <Badge key={domain.id} tone="outline">
                      {domain.name}
                    </Badge>
                  ))}
                </>
              }
              footer={
                <>
                  <Badge tone={useCase.priorityTier === "p1" ? "success" : "info"}>
                    {useCase.priorityTier.toUpperCase()}
                  </Badge>
                  <Badge tone={useCase.useCaseKind === "mission" ? "secondary" : "surface"}>
                    {useCase.useCaseKind === "mission" ? "Mission" : "Enabling"}
                  </Badge>
                  <FreshnessBadge freshness={useCase.freshness} />
                  {useCase.freshness.lastActivityAt ? (
                    <Badge tone="muted">Last activity {formatDate(useCase.freshness.lastActivityAt)}</Badge>
                  ) : null}
                  <Badge tone="surface">{useCase.capabilityCount} capabilities</Badge>
                </>
              }
            />
          );
        })}
      </div>
      <Card variant="rail" className="mt-6 rounded-[32px]">
        <CardHeader className="space-y-2">
          <div className="workspace-kicker">Coverage discipline</div>
          <CardTitle>Priority areas intentionally held as gaps</CardTitle>
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">
            These are valid CAF/DND, Government of Canada, and NATO priority themes, but the current dataset does not yet
            have enough credible capability and company coverage to promote them as active Use Cases.
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
