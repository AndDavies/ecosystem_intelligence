import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { getAdminTaxonomy } from "@/lib/data/repository";

export default async function AdminTaxonomyPage() {
  const profile = await requireProfile("admin");
  const taxonomy = await getAdminTaxonomy();

  return (
    <AppShell profile={profile}>
      <SectionHeading
        title="Taxonomy Admin"
        description="Minimal in-app taxonomy visibility for domains, Use Cases, and seeded cluster structure."
      />
      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="rounded-[32px]">
          <CardHeader>
            <CardTitle>Domains</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {taxonomy.domains.map((domain) => (
              <div key={domain.id} className="rounded-3xl border border-[var(--border)] bg-white/60 p-4">
                <div className="font-semibold">{domain.name}</div>
                <div className="mt-2 text-sm text-[var(--muted-foreground)]">{domain.description}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="rounded-[32px]">
          <CardHeader>
            <CardTitle>Use Cases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {taxonomy.useCases.map((useCase) => (
              <div key={useCase.id} className="rounded-3xl border border-[var(--border)] bg-white/60 p-4">
                <div className="font-semibold">{useCase.name}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {useCase.domainIds.map((id) => (
                    <Badge key={id}>{id}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="rounded-[32px]">
          <CardHeader>
            <CardTitle>Clusters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {taxonomy.clusters.map((cluster) => (
              <div key={cluster.id} className="rounded-3xl border border-[var(--border)] bg-white/60 p-4">
                <div className="font-semibold">{cluster.name}</div>
                <div className="mt-2 text-sm text-[var(--muted-foreground)]">{cluster.summary}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
