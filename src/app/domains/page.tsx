import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { getDomainsIndex } from "@/lib/data/repository";

export default async function DomainsPage() {
  const profile = await requireProfile();
  const domains = await getDomainsIndex();

  return (
    <AppShell profile={profile}>
      <SectionHeading
        title="Technical Domains"
        description="Browse the technical landscape when the question starts with a capability area rather than a mission lens or a known company."
        eyebrow="Technical landscapes"
        breadcrumbs={[
          { label: "Home", href: "/app" },
          { label: "Technical Domains" }
        ]}
      />
      <Card variant="rail" className="mb-5 rounded-[32px]">
        <CardHeader className="space-y-2">
          <div className="workspace-kicker">How to read this taxonomy</div>
          <CardTitle>Domains are technical landscapes, not the primary workflow.</CardTitle>
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">
            Use domains when you know the technology area first. If the question is about who to engage and why now,
            start from a Mission Area / Use Case.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <TaxonomyTerm term="Use Case" definition="Mission decision or enabling problem." />
          <TaxonomyTerm term="Domain" definition="Technical landscape such as sensing, autonomy, data, or communications." />
          <TaxonomyTerm term="Cluster" definition="Subgroup of related capabilities inside a landscape." />
          <TaxonomyTerm term="Capability" definition="Product, system, or solution that can be assessed." />
          <TaxonomyTerm term="Company" definition="Organization associated with capabilities and evidence." />
        </CardContent>
      </Card>
      <Card variant="strong" className="rounded-[32px]">
        <CardContent className="p-0">
          <div className="hidden grid-cols-[minmax(14rem,1.1fr)_minmax(16rem,1.3fr)_7rem_8rem_10rem_5rem] gap-4 border-b border-[var(--border)] bg-[var(--card-muted)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)] xl:grid">
            <div>Technical Domain</div>
            <div>Linked Mission Areas</div>
            <div>Companies</div>
            <div>Capabilities</div>
            <div>Freshness</div>
            <div className="text-right">Open</div>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {domains.map((item) => (
              <Link
                key={item.domain.id}
                href={`/domains/${item.domain.slug}`}
                className="block px-4 py-4 no-underline transition hover:bg-[var(--card-muted)] xl:grid xl:grid-cols-[minmax(14rem,1.1fr)_minmax(16rem,1.3fr)_7rem_8rem_10rem_5rem] xl:items-center xl:gap-4"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-[var(--foreground)]">{item.domain.name}</div>
                  <div className="mt-1 line-clamp-2 text-sm leading-5 text-[var(--muted-foreground)] xl:line-clamp-1">
                    {item.domain.description ?? "No domain description yet."}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5 xl:mt-0">
                  {item.useCases.slice(0, 3).map((useCase) => (
                    <Badge key={`${item.domain.id}-${useCase.id}`} tone="outline">
                      {useCase.name}
                    </Badge>
                  ))}
                  {item.useCases.length > 3 ? <Badge tone="muted">+{item.useCases.length - 3}</Badge> : null}
                  {!item.useCases.length ? <Badge tone="muted">No linked mission areas</Badge> : null}
                </div>
                <div className="mt-3 text-sm font-semibold text-[var(--foreground)] xl:mt-0">
                  {item.companyCount}
                </div>
                <div className="mt-3 text-sm font-semibold text-[var(--foreground)] xl:mt-0">
                  {item.capabilityCount}
                </div>
                <div className="mt-3 xl:mt-0">
                  <FreshnessBadge freshness={item.freshness} />
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--primary)] xl:mt-0 xl:justify-end">
                  Open
                  <ArrowRight className="size-4" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function TaxonomyTerm({ term, definition }: { term: string; definition: string }) {
  return (
    <div className="rounded-[22px] border border-[var(--border)] bg-white/70 p-4">
      <div className="text-sm font-semibold text-[var(--foreground)]">{term}</div>
      <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">{definition}</p>
    </div>
  );
}
