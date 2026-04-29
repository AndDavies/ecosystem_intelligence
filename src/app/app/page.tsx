import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  FolderKanban,
  Layers3,
  ListChecks,
  Search,
  ShieldCheck
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { GlobalSearch } from "@/components/search/global-search";
import { DiscoveryCard, SnapshotStrip } from "@/components/workspace/workspace-primitives";
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
  const primaryReview = home.pendingReviews[0];

  return (
    <AppShell profile={profile}>
      <div className="space-y-5">
        <SectionHeading
          title="Start Here"
          description="Choose the path that matches the question in front of you, then move toward evidence-backed engagement decisions."
          eyebrow="BD intelligence workspace"
          actions={
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/use-cases">
                  Explore Mission Areas
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/companies">
                  Browse Companies
                  <Building2 className="size-4" />
                </Link>
              </Button>
            </div>
          }
        />

        <SnapshotStrip
          items={[
            {
              label: "Mission Areas",
              value: String(home.useCases.length),
              detail: "Mission-led entry paths.",
              href: "/use-cases",
              hrefLabel: "Open"
            },
            {
              label: "Technical Domains",
              value: String(home.domains.length),
              detail: "Technical landscape areas.",
              href: "/domains",
              hrefLabel: "Open"
            },
            {
              label: "Companies",
              value: String(home.companies.length),
              detail: "Tracked organizations.",
              href: "/companies",
              hrefLabel: "Open"
            },
            {
              label: "Pending Reviews",
              value: String(home.pendingReviews.length),
              detail: "Changes requiring attention.",
              href: "/review",
              hrefLabel: "Review"
            }
          ]}
        />

        <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <Card variant="strong" className="rounded-[28px]">
            <CardHeader className="pb-3">
              <div className="workspace-kicker">Start here based on your question</div>
              <CardTitle>Pick the clearest entry path</CardTitle>
              <p className="max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
                The workspace is built for mission-led BD decisions, but you can also start from a technology area,
                known organization, or saved follow-up list.
              </p>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <StartPathCard
                icon={<FolderKanban className="size-4" />}
                title="I have a mission problem"
                when="Use this when the question is about an operational need or engagement decision."
                output="Mission areas, top targets, evidence posture, and gaps."
                href="/use-cases"
                actionLabel="Open mission areas"
              />
              <StartPathCard
                icon={<Layers3 className="size-4" />}
                title="I know the technology area"
                when="Use this when the question starts from sensors, autonomy, communications, data, or another technical landscape."
                output="Technical domains with linked mission areas, companies, and capabilities."
                href="/domains"
                actionLabel="Open technical domains"
              />
              <StartPathCard
                icon={<Building2 className="size-4" />}
                title="I know the organization"
                when="Use this when you already have a company name or want portfolio context."
                output="Company records, linked domains, capabilities, and mission-area fit."
                href="/companies"
                actionLabel="Open companies"
              />
              <StartPathCard
                icon={<ListChecks className="size-4" />}
                title="I need to brief or follow up"
                when="Use this when targets have already been selected and need status, owner, rationale, or next step."
                output="Working lists that preserve lightweight engagement memory."
                href="/shortlists"
                actionLabel="Open working lists"
              />
            </CardContent>
          </Card>

          <Card variant="rail" className="rounded-[28px]">
            <CardHeader className="pb-3">
              <div className="workspace-kicker">Concept map</div>
              <CardTitle>How the pieces connect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ConceptStep label="Mission Area / Use Case" detail="The mission decision or enabling problem." />
              <ConceptStep label="Capability" detail="The product, system, or solution to assess." />
              <ConceptStep label="Company" detail="The organization behind one or more capabilities." />
              <ConceptStep label="Evidence" detail="Source support, citations, freshness, and uncertainty." />
              <ConceptStep label="Working List" detail="Saved engagement memory with status and next step." />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <Card variant="strong" className="rounded-[28px]">
            <CardHeader className="pb-3">
              <div className="workspace-kicker">
                <ShieldCheck className="size-3.5" />
                Mission control
              </div>
              <CardTitle>Next best actions</CardTitle>
              <p className="max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
                Work from review risk to engagement context, then capture the targets worth carrying forward.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <NextAction
                eyebrow={primaryReview ? "Review first" : "Review posture"}
                title={primaryReview ? primaryReview.entityLabel : "No high-impact changes pending"}
                detail={
                  primaryReview
                    ? `${primaryReview.originLabel} changed ${primaryReview.changedFieldDetails
                        .map((field) => field.label)
                        .join(", ")}. Clear this before using the record in a meeting.`
                    : "The queue is clear. Move into validation or target discovery without a review blocker."
                }
                href="/review"
                icon={<ClipboardCheck className="size-4" />}
                actionLabel={primaryReview ? "Review change" : "Open review"}
                priority="1"
              />
              <NextAction
                eyebrow="Validate the story"
                title="Arctic Domain Awareness briefing"
                detail="Open the guided path that explains the mission context, candidate targets, evidence posture, and gaps."
                href="/use-cases/arctic-domain-awareness/briefing"
                icon={<ShieldCheck className="size-4" />}
                actionLabel="Open briefing"
                priority="2"
              />
              <NextAction
                eyebrow="Broaden discovery"
                title="Find companies, capabilities, technical domains, or mission areas"
                detail="Use global search when you already have a name, acronym, capability, or topic to chase."
                href="/app#search"
                icon={<Search className="size-4" />}
                actionLabel="Search"
                priority="3"
              />
            </CardContent>
          </Card>

          <DiscoveryCard
            eyebrow="Demo path"
            title="Arctic Domain Awareness briefing"
            description="A guided path from mission context to target comparison, evidence, gaps, and a saved working list."
            href="/use-cases/arctic-domain-awareness/briefing"
            actionLabel="Open briefing"
            className="rounded-[28px]"
            badges={
              <>
                <Badge tone="success">Validation-ready</Badge>
                <Badge tone="outline">{home.shortlists.length} working lists</Badge>
              </>
            }
            footer={
              <Button asChild variant="outline" className="justify-between">
                <Link href="/shortlists">
                  Open Working Lists
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            }
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
          <Card variant="strong" className="rounded-[28px]">
            <CardHeader>
              <div className="workspace-kicker">Saved follow-up</div>
              <CardTitle>Working lists</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {home.shortlists.length ? (
                home.shortlists.slice(0, 3).map((item) => (
                  <Link
                    key={item.shortlist.id}
                    href={`/shortlists/${item.shortlist.id}`}
                    className="block rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] px-4 py-3 no-underline hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-[var(--foreground)]">{item.shortlist.name}</div>
                        <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                          {item.useCase?.name ?? "General list"} · updated {formatDate(item.updatedAt)}
                        </div>
                      </div>
                      <Badge tone="surface">{item.itemCount} targets</Badge>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card-muted)] p-4 text-sm text-[var(--muted-foreground)]">
                  No working lists yet. Add targets from a mission-area briefing to create the first one.
                </div>
              )}
            </CardContent>
          </Card>

          <Card variant="strong" className="rounded-[28px]">
            <CardHeader>
              <div className="workspace-kicker">Attention queue</div>
              <CardTitle>What changed or needs review</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  Recent updates
                </div>
                {home.recentUpdates.slice(0, 3).map((event) => (
                  <div key={event.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-4">
                    <div className="text-sm font-semibold leading-6">{event.summary}</div>
                    <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {event.actorName} · {formatFieldLabel(event.entityType)} · {formatDate(event.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  Pending reviews
                </div>
                {home.pendingReviews.length ? (
                  home.pendingReviews.slice(0, 3).map((request) => (
                    <Link
                      key={request.id}
                      href="/review"
                      className="block rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-4 no-underline hover:bg-white"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-[var(--foreground)]">{request.entityLabel}</div>
                        <Badge tone={request.originType === "ai" ? "info" : "muted"}>{request.originLabel}</Badge>
                      </div>
                      <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                        {request.changedFieldDetails.map((field) => field.label).join(", ")}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card-muted)] p-4 text-sm text-[var(--muted-foreground)]">
                    No pending high-impact changes.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <GlobalSearch initialResults={initialSearchResults} />

      </div>
    </AppShell>
  );
}

function StartPathCard({
  icon,
  title,
  when,
  output,
  href,
  actionLabel
}: {
  icon: ReactNode;
  title: string;
  when: string;
  output: string;
  href: string;
  actionLabel: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col justify-between rounded-[24px] border border-[var(--border)] bg-white/78 p-4 no-underline transition hover:border-[var(--primary)]/25 hover:bg-white hover:shadow-[0_12px_30px_rgba(20,34,24,0.07)]"
    >
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] transition group-hover:bg-[var(--primary)] group-hover:text-white">
            {icon}
          </span>
          <div>
            <div className="font-semibold text-[var(--foreground)]">{title}</div>
            <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">{when}</p>
          </div>
        </div>
        <div className="rounded-[18px] bg-[var(--card-muted)] px-3 py-2 text-xs leading-5 text-[var(--muted-foreground)]">
          <span className="font-semibold text-[var(--foreground)]">What you get: </span>
          {output}
        </div>
      </div>
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
        {actionLabel}
        <ArrowRight className="size-4" />
      </span>
    </Link>
  );
}

function ConceptStep({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="rounded-[22px] border border-[var(--border)] bg-white/70 px-4 py-3">
      <div className="text-sm font-semibold text-[var(--foreground)]">{label}</div>
      <div className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">{detail}</div>
    </div>
  );
}

function NextAction({
  href,
  eyebrow,
  title,
  detail,
  icon,
  actionLabel,
  priority
}: {
  href: string;
  eyebrow: string;
  title: string;
  detail: string;
  icon: ReactNode;
  actionLabel: string;
  priority: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-4 no-underline transition hover:border-[var(--primary)]/25 hover:bg-white hover:shadow-[0_12px_30px_rgba(20,34,24,0.06)]"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] transition group-hover:bg-[var(--primary)] group-hover:text-white">
            {icon}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="surface">No. {priority}</Badge>
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                {eyebrow}
              </span>
            </div>
            <div className="mt-2 text-sm font-semibold leading-5 text-[var(--foreground)]">{title}</div>
            <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">{detail}</p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[var(--primary)]">
          {actionLabel}
          <ArrowRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}
