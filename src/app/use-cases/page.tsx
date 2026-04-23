import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { DiscoveryCard } from "@/components/workspace/workspace-primitives";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import { Badge } from "@/components/ui/badge";
import { requireProfile } from "@/lib/auth";
import { getUseCasesIndex } from "@/lib/data/repository";
import { resolveUseCaseConfig } from "@/lib/use-case-config";
import { formatDate } from "@/lib/utils";

export default async function UseCasesPage() {
  const profile = await requireProfile();
  const useCases = await getUseCasesIndex();

  return (
    <AppShell profile={profile}>
      <SectionHeading
        title="Use Cases"
        description="Use Cases remain a strong mission-led entry path into the ecosystem when the question starts with an operational need or workflow."
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
    </AppShell>
  );
}
