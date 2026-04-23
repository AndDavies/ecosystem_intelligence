import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { DiscoveryCard } from "@/components/workspace/workspace-primitives";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import { Badge } from "@/components/ui/badge";
import { requireProfile } from "@/lib/auth";
import { getDomainsIndex } from "@/lib/data/repository";

export default async function DomainsPage() {
  const profile = await requireProfile();
  const domains = await getDomainsIndex();

  return (
    <AppShell profile={profile}>
      <SectionHeading
        title="Domains"
        description="Browse the landscape by technical domain when the user question starts with a capability area rather than a mission lens or a known company."
        eyebrow="Technical landscapes"
        breadcrumbs={[
          { label: "Home", href: "/app" },
          { label: "Domains" }
        ]}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {domains.map((item) => (
          <DiscoveryCard
            key={item.domain.id}
            eyebrow="Domain"
            title={item.domain.name}
            description={item.domain.description ?? "No domain description yet."}
            href={`/domains/${item.domain.slug}`}
            actionLabel="Open Domain"
            badges={
              <>
                {item.useCases.map((useCase) => (
                  <Badge key={`${item.domain.id}-${useCase.id}`} tone="outline">
                    {useCase.name}
                  </Badge>
                ))}
              </>
            }
            footer={
              <>
                <FreshnessBadge freshness={item.freshness} />
                <Badge tone="muted">{item.useCaseCount} use cases</Badge>
                <Badge tone="muted">{item.companyCount} companies</Badge>
                <Badge tone="surface">{item.capabilityCount} capabilities</Badge>
              </>
            }
          />
        ))}
      </div>
    </AppShell>
  );
}
