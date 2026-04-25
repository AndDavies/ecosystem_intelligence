import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Download, ListChecks, ShieldCheck, Target } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { AddToShortlistForm } from "@/components/shortlists/add-to-shortlist-form";
import { SnapshotStrip } from "@/components/workspace/workspace-primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import { Input } from "@/components/ui/input";
import { PendingButton } from "@/components/ui/pending-button";
import { Textarea } from "@/components/ui/textarea";
import { createShortlist } from "@/lib/actions/shortlists";
import { requireProfile } from "@/lib/auth";
import { getUseCaseBriefingBySlug } from "@/lib/data/repository";
import { summarizeFreshness } from "@/lib/freshness";
import { formatDate, toTitleCase } from "@/lib/utils";
import type { CoverageGapView } from "@/types/view-models";

export default async function UseCaseBriefingPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ shortlistSetup?: string; shortlistItem?: string }>;
}) {
  const profile = await requireProfile();
  const { slug } = await params;
  const query = await searchParams;
  const briefing = await getUseCaseBriefingBySlug(slug);

  if (!briefing) {
    notFound();
  }

  const view = briefing.useCase;
  const freshnessSummary = summarizeFreshness(
    view.allCapabilities.map((entry) => ({
      lastUpdatedAt: entry.capability.lastUpdatedAt,
      lastSignalAt: entry.mapping.lastSignalAt,
      staleAfterDays: entry.mapping.staleAfterDays
    }))
  );

  return (
    <AppShell profile={profile}>
      <SectionHeading
        title={`${view.useCase.name} Briefing`}
        description="A leadership-ready readout for moving from mission problem to defensible engagement shortlist."
        eyebrow="BD validation briefing"
        breadcrumbs={[
          { label: "Home", href: "/app" },
          { label: "Use Cases", href: "/use-cases" },
          { label: view.useCase.name, href: `/use-cases/${view.useCase.slug}` },
          { label: "Briefing" }
        ]}
        backHref={`/use-cases/${view.useCase.slug}`}
        backLabel="Back to Use Case"
        meta={
          <>
            <Badge tone="outline">{view.useCase.priorityTier.toUpperCase()}</Badge>
            <Badge tone="surface">{toTitleCase(view.useCase.useCaseKind)}</Badge>
            <FreshnessBadge freshness={freshnessSummary} />
          </>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/api/export?type=use-case-briefing&useCaseSlug=${view.useCase.slug}`}>
                <Download className="size-4" />
                Export Briefing
              </Link>
            </Button>
            <Button asChild>
              <Link href="/shortlists">
                <ListChecks className="size-4" />
                Shortlists
              </Link>
            </Button>
          </div>
        }
      />

      {query.shortlistSetup === "missing-schema" ? (
        <Card variant="muted" className="mb-6 rounded-[28px]">
          <CardContent className="pt-6 text-sm text-[var(--muted-foreground)]">
            Shortlist persistence needs the latest Supabase migration. Apply `003_shortlists.sql`, then retry adding the target.
          </CardContent>
        </Card>
      ) : null}

      {query.shortlistItem ? (
        <NoticeCard
          message={
            query.shortlistItem === "updated"
              ? "Target was already on this shortlist, so its rationale and next step were updated."
              : "Target added to the shortlist. Open Shortlists when you are ready to assign owner, due date, and follow-up."
          }
        />
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card variant="hero" className="rounded-[36px]">
          <CardHeader className="space-y-4">
            <div className="workspace-kicker">
              <ShieldCheck className="size-3.5" />
              Mission brief
            </div>
            <CardTitle className="text-3xl md:text-4xl">{view.useCase.requiredDecision}</CardTitle>
            <p className="text-base leading-7 text-[var(--muted-foreground)]">{view.useCase.missionContext}</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <SnapshotStrip
              items={[
                {
                  label: "Briefing targets",
                  value: String(briefing.targets.length),
                  detail: "Top recommendations for BD validation."
                },
                {
                  label: "Mapped capabilities",
                  value: String(view.allCapabilities.length),
                  detail: "Current evidence-backed landscape depth."
                },
                {
                  label: "Coverage gaps",
                  value: String(briefing.coverageGaps.length),
                  detail: "Derived weaknesses to disclose in the room."
                },
                {
                  label: "Saved shortlists",
                  value: String(briefing.shortlists.length),
                  detail: "Shared working lists tied to this Use Case."
                }
              ]}
              className="xl:grid-cols-2"
            />
            <div className="rounded-[28px] border border-[var(--border)] bg-white/70 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                Mission outcome
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">{view.useCase.missionOutcome}</p>
            </div>
          </CardContent>
        </Card>

        <Card variant="rail" className="rounded-[36px]">
          <CardHeader className="space-y-3">
            <div className="workspace-kicker">Demo guide</div>
            <CardTitle>Use this path for guided BD conversations.</CardTitle>
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">
              Keep the conversation anchored on who to engage first, why now, what evidence supports the read, and what remains uncertain.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "Explain the mission brief and public-source confidence boundary.",
              "Walk through the top 3 targets before opening any detail page.",
              "Use gaps to invite critique instead of overselling certainty.",
              "Save the targets the user would actually carry forward."
            ].map((step, index) => (
              <div key={step} className="workspace-subtle rounded-[24px] p-4 text-sm leading-6">
                <span className="mr-2 font-semibold text-[var(--primary)]">{index + 1}.</span>
                {step}
              </div>
            ))}
            <DerivedReadLabel />
          </CardContent>
        </Card>
      </div>

      <section className="mt-6 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card variant="strong" className="rounded-[32px]">
          <CardHeader>
            <CardTitle>Create a working shortlist</CardTitle>
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">
              Save the targets that should survive the meeting. This is intentionally lightweight: status, owner, next step, due date, and rationale.
            </p>
          </CardHeader>
          <CardContent>
            <form action={createShortlist} className="space-y-3">
              <input type="hidden" name="useCaseId" value={view.useCase.id} />
              <Input
                name="name"
                defaultValue={`${view.useCase.name} BD validation shortlist`}
              />
              <Textarea
                name="description"
                defaultValue="Targets selected during BD validation briefing."
              />
              <PendingButton type="submit" className="w-full justify-between" pendingLabel="Creating...">
                Create shortlist
                <ArrowRight className="size-4" />
              </PendingButton>
            </form>
          </CardContent>
        </Card>

        <Card variant="strong" className="rounded-[32px]">
          <CardHeader>
            <CardTitle>Briefing summary</CardTitle>
            <p className="text-sm text-[var(--muted-foreground)]">
              Derived analysis from the current mapped records. Use it as a meeting guide, not as a source-backed claim by itself.
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {briefing.briefingSummary.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-6">
                  <span className="mt-2 size-2 shrink-0 rounded-full bg-[var(--primary)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="mt-8 space-y-4">
        <SectionHeading
          title="Top engagement targets"
          description="Compare the strongest targets before drilling into full capability and company records."
          eyebrow="Target shortlist"
        />
        <div className="grid gap-5">
          {briefing.targets.map((target) => (
            <Card key={target.entry.mapping.id} variant={target.rank <= 3 ? "feature" : "strong"} className="rounded-[34px]">
              <CardContent className="space-y-5 pt-7">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="default">
                        <Target className="mr-1.5 size-3" />
                        Target #{target.rank}
                      </Badge>
                      <Badge tone={target.targetRead.tone}>{target.targetRead.label}</Badge>
                      <Badge tone={target.evidencePosture.tone}>{target.evidencePosture.label}</Badge>
                      <FreshnessBadge freshness={target.freshness} />
                    </div>
                    <Link
                      href={`/capabilities/${target.entry.capability.id}?fromUseCase=${view.useCase.slug}`}
                      className="block text-2xl font-bold tracking-tight no-underline md:text-3xl"
                    >
                      {target.entry.capability.name}
                    </Link>
                    <Link
                      href={`/companies/${target.entry.company.id}?fromUseCase=${view.useCase.slug}&fromCapability=${target.entry.capability.id}`}
                      className="text-sm font-medium text-[var(--muted-foreground)] no-underline hover:text-[var(--primary)]"
                    >
                      {target.entry.company.name} · {target.entry.company.headquarters}
                    </Link>
                  </div>
                  <AddToShortlistForm
                    shortlists={briefing.shortlists}
                    useCaseId={view.useCase.id}
                    useCaseName={view.useCase.name}
                    pagePath={`/use-cases/${view.useCase.slug}/briefing`}
                    capabilityId={target.entry.capability.id}
                    companyId={target.entry.company.id}
                    status={target.suggestedStatus}
                    rationale={target.targetRead.priorityNow}
                    nextStep={target.targetRead.actionDirective}
                  />
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <BriefingBlock title="Why this target now" body={target.targetRead.priorityNow} />
                  <BriefingBlock title="Why not others" body={target.targetRead.whyNotOthers} />
                  <BriefingBlock title="Strength" body={target.targetRead.strength} />
                  <BriefingBlock title="Limitation" body={target.targetRead.limitation} />
                </div>
                <BriefingBlock title="Suggested next step" body={target.targetRead.actionDirective} />
                <div className="rounded-[24px] border border-[var(--border)] bg-white/72 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                    Evidence posture
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">{target.evidencePosture.detail}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {target.entry.citations.length ? (
                      target.entry.citations.map((citation) => (
                        <a
                          key={`${target.entry.mapping.id}-${citation.sourceUrl}`}
                          href={citation.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs text-[var(--muted-foreground)] no-underline hover:bg-[var(--card)]"
                        >
                          {citation.publisher}
                          {citation.publishedAt ? ` · ${formatDate(citation.publishedAt)}` : ""}
                        </a>
                      ))
                    ) : (
                      <Badge tone="muted">No linked citations</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <SectionHeading
          title="Gaps and caveats"
          description="The point of the briefing is not to pretend certainty. These gaps make the read more defensible."
          eyebrow="Coverage realism"
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {briefing.coverageGaps.map((gap) => (
            <GapCard key={`${gap.category}-${gap.label}`} gap={gap} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function BriefingBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-white/72 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
        {title}
      </div>
      <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">{body}</p>
    </div>
  );
}

function GapCard({ gap }: { gap: CoverageGapView }) {
  return (
    <Card className="rounded-[28px]" variant="muted">
      <CardContent className="space-y-3 pt-6">
        <Badge tone={gap.tone}>{toTitleCase(gap.category)}</Badge>
        <div className="font-semibold">{gap.label}</div>
        <p className="text-sm leading-6 text-[var(--muted-foreground)]">{gap.detail}</p>
        <DerivedReadLabel />
      </CardContent>
    </Card>
  );
}

function DerivedReadLabel() {
  return (
    <div className="inline-flex items-center rounded-full bg-[var(--muted)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
      Derived read: current-record analysis, not a direct source quote.
    </div>
  );
}

function NoticeCard({ message }: { message: string }) {
  return (
    <Card variant="muted" className="mb-6 rounded-[28px] border-[var(--primary)]/18">
      <CardContent className="pt-6 text-sm font-medium text-[var(--foreground)]">{message}</CardContent>
    </Card>
  );
}
