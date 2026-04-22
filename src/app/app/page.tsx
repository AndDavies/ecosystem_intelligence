import Link from "next/link";
import { ArrowRight, BookOpen, Clock3, Download, FolderSync } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { GlobalSearch } from "@/components/search/global-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { getHomeData, searchRecords } from "@/lib/data/repository";
import { formatDate, formatFieldLabel } from "@/lib/utils";

export default async function AppHomePage() {
  const profile = await requireProfile();
  const home = await getHomeData();
  const initialSearchResults = await searchRecords("");

  return (
    <AppShell profile={profile}>
      <div className="space-y-8">
        <section className="grid gap-5 lg:grid-cols-[1.5fr_0.9fr]">
          <Card className="rounded-[32px]">
            <CardHeader className="space-y-4">
              <Badge tone="secondary">Use Case-led discovery</Badge>
              <CardTitle className="max-w-2xl text-3xl">
                Faster ecosystem understanding, evidence-backed target identification.
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-3">
              <Metric label="Active Use Cases" value={String(home.useCases.length)} />
              <Metric label="Pending Reviews" value={String(home.pendingReviews.length)} />
              <Metric label="Queued AI Runs" value={String(home.queuedAiRuns.length)} />
            </CardContent>
          </Card>
          <Card className="rounded-[32px]">
            <CardHeader>
              <CardTitle>Workspace actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-between">
                <Link href="/use-cases">
                  Explore Use Cases
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href="/api/export?type=use-case-targets&useCaseSlug=arctic-domain-awareness">
                  Export Top Targets CSV
                  <Download className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href="/help">
                  Open Help Center
                  <BookOpen className="size-4" />
                </Link>
              </Button>
              {profile.role === "admin" ? (
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link href="/admin/enrichment">
                    Manage Enrichment
                    <FolderSync className="size-4" />
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </section>

        <section>
          <SectionHeading
            title="Curated Use Cases"
            description="Enter through the mission areas that matter most to internal ecosystem work."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {home.useCases.map((useCase) => (
              <Card key={useCase.id} className="rounded-[28px]">
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <div className="text-lg font-semibold">{useCase.name}</div>
                    <div className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                      {useCase.summary}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge>{useCase.targetCount} mapped capabilities</Badge>
                    <Link href={`/use-cases/${useCase.slug}`} className="text-sm font-medium text-[var(--primary)]">
                      Open
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <GlobalSearch initialResults={initialSearchResults} />

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <Card className="rounded-[32px]">
            <CardHeader>
              <CardTitle>Recent updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {home.recentUpdates.map((event) => (
                <div key={event.id} className="rounded-3xl border border-[var(--border)] bg-white/60 p-4">
                  <div className="text-sm font-medium">{event.summary}</div>
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
          <Card className="rounded-[32px]">
            <CardHeader>
              <CardTitle>Pending review queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {home.pendingReviews.length ? (
                home.pendingReviews.map((request) => (
                  <div key={request.id} className="rounded-3xl border border-[var(--border)] bg-white/60 p-4">
                    <div className="text-sm font-medium">{request.entityLabel}</div>
                    <div className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {request.changedFieldDetails.map((field) => field.label).join(", ")}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-[var(--border)] bg-white/60 p-4 text-sm text-[var(--muted-foreground)]">
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[28px] border border-[var(--border)] bg-white/60 p-5">
      <div className="text-sm text-[var(--muted-foreground)]">{label}</div>
      <div className="mt-3 text-3xl font-semibold">{value}</div>
    </div>
  );
}
