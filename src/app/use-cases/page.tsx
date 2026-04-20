import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { getUseCasesIndex } from "@/lib/data/repository";

export default async function UseCasesPage() {
  const profile = await requireProfile();
  const useCases = await getUseCasesIndex();

  return (
    <AppShell profile={profile}>
      <SectionHeading
        title="Use Cases"
        description="The MVP discovery workflow starts here. Each Use Case acts as a structured lens into the ecosystem."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {useCases.map((useCase) => (
          <Card key={useCase.id} className="rounded-[30px]">
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-wrap gap-2">
                {useCase.domains.map((domain) => (
                  <Badge key={domain.id} tone="secondary">
                    {domain.name}
                  </Badge>
                ))}
              </div>
              <div>
                <div className="text-xl font-semibold">{useCase.name}</div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{useCase.summary}</p>
              </div>
              <div className="flex items-center justify-between">
                <Badge>{useCase.capabilityCount} capabilities</Badge>
                <Link href={`/use-cases/${useCase.slug}`} className="text-sm font-medium text-[var(--primary)]">
                  Explore
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
