import Link from "next/link";
import { notFound } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requestRefresh } from "@/lib/actions/review";
import { requireProfile } from "@/lib/auth";
import { getCapabilityById } from "@/lib/data/repository";
import { formatDate, toTitleCase } from "@/lib/utils";

export default async function CapabilityPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile();
  const { id } = await params;
  const view = await getCapabilityById(id);

  if (!view) {
    notFound();
  }

  return (
    <AppShell profile={profile}>
      <SectionHeading
        title={view.capability.name}
        description={view.capability.summary}
        actions={
          profile.role !== "viewer" ? (
            <form action={requestRefresh.bind(null, "capability", view.capability.id)}>
              <Button type="submit" variant="secondary">
                <RefreshCw className="mr-2 size-4" />
                Request refresh
              </Button>
            </form>
          ) : null
        }
      />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[32px]">
          <CardContent className="space-y-5 pt-6">
            <div className="flex flex-wrap gap-2">
              <Badge>{view.capability.capabilityType}</Badge>
              <Badge tone="secondary">{view.company.name}</Badge>
            </div>
            <div className="rounded-3xl border border-[var(--border)] bg-white/60 p-5">
              <div className="text-sm font-medium">Company context</div>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                {view.capability.companyFacingContext ?? "No additional company context yet."}
              </p>
              <Link href={`/companies/${view.company.id}`} className="mt-3 inline-block text-sm font-medium text-[var(--primary)]">
                Open company profile
              </Link>
            </div>
            <div className="space-y-4">
              <div className="text-lg font-semibold">Use Case mappings</div>
              {view.mappings.map((mapping) => (
                <div key={mapping.id} className="rounded-3xl border border-[var(--border)] bg-white/60 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:justify-between">
                    <div>
                      <Link href={`/use-cases/${mapping.useCase.slug}`} className="text-base font-semibold">
                        {mapping.useCase.name}
                      </Link>
                      <div className="mt-1 text-sm text-[var(--muted-foreground)]">{mapping.cluster.name}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{mapping.pathway}</Badge>
                      <Badge tone="secondary">Score {mapping.rankingScore}</Badge>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
                    {mapping.whyItMatters}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge tone="muted">{toTitleCase(mapping.suggestedActionType)}</Badge>
                    {mapping.actionNote ? <Badge tone="secondary">{mapping.actionNote}</Badge> : null}
                  </div>
                  <div className="mt-4 space-y-2">
                    {mapping.citations.map((citation) => (
                      <a
                        key={`${mapping.id}-${citation.sourceUrl}`}
                        href={citation.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                      >
                        <div className="font-medium">{citation.sourceTitle}</div>
                        <div className="mt-1 text-[var(--muted-foreground)]">{citation.excerpt}</div>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="space-y-5">
          <Card className="rounded-[32px]">
            <CardHeader>
              <CardTitle>Signals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {view.signals.map((signal) => (
                <div key={signal.id} className="rounded-3xl border border-[var(--border)] bg-white/60 p-4">
                  <div className="text-sm font-semibold">{signal.title}</div>
                  <div className="mt-1 text-sm text-[var(--muted-foreground)]">{signal.description}</div>
                  <div className="mt-2 text-xs text-[var(--muted-foreground)]">{formatDate(signal.observedAt)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="rounded-[32px]">
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {view.contacts.map((contact) => (
                <div key={contact.id} className="rounded-3xl border border-[var(--border)] bg-white/60 p-4">
                  <div className="font-semibold">{contact.name}</div>
                  <div className="text-sm text-[var(--muted-foreground)]">{contact.title}</div>
                  {contact.email ? <div className="mt-1 text-sm">{contact.email}</div> : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
