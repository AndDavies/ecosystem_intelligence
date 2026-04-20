import { WandSparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { triggerEnrichmentRun } from "@/lib/actions/admin";
import { requireProfile } from "@/lib/auth";
import { aiRuns, useCases } from "@/lib/mock-data";

export default async function AdminEnrichmentPage() {
  const profile = await requireProfile("admin");

  return (
    <AppShell profile={profile}>
      <SectionHeading
        title="Enrichment Admin"
        description="Queue AI-assisted enrichment runs and inspect the current batch state."
      />
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-[32px]">
          <CardHeader>
            <CardTitle>Queue a batch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {useCases.map((useCase) => (
              <div key={useCase.id} className="rounded-3xl border border-[var(--border)] bg-white/60 p-4">
                <div className="mb-3 font-semibold">{useCase.name}</div>
                <form action={triggerEnrichmentRun.bind(null, "use_case", useCase.id)}>
                  <Button type="submit" variant="secondary">
                    <WandSparkles className="mr-2 size-4" />
                    Queue enrichment
                  </Button>
                </form>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="rounded-[32px]">
          <CardHeader>
            <CardTitle>Recent AI runs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiRuns.map((run) => (
              <div key={run.id} className="rounded-3xl border border-[var(--border)] bg-white/60 p-4">
                <div className="font-semibold">
                  {run.entityType} • {run.entityId}
                </div>
                <div className="mt-2 text-sm text-[var(--muted-foreground)]">
                  Prompt version {run.promptVersion}
                </div>
                <div className="mt-2 text-sm">{run.resultSummary ?? "Awaiting processing."}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
