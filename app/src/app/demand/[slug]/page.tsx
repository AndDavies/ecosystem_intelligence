import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, ShieldAlert } from "lucide-react";
import { EvidenceList } from "@/components/atlas/evidence-list";
import { CollectionContinuation, EmptyCoverage, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { PublicShare } from "@/components/atlas/public-share";
import { evidenceStrengthLabel, publicLanguage } from "@/lib/atlas/presentation";
import { getAtlasDemandBySlug } from "@/lib/atlas/repository";
import { socialMetadata } from "@/lib/seo/social";

export const revalidate = 300;

export async function generateStaticParams() {
  // Demand pages render on demand so production builds do not depend on a
  // successful bulk database read at build time.
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const demand = await getAtlasDemandBySlug(slug);
  if (!demand) return { title: "Demand statement not found", robots: { index: false, follow: false } };
  const path = `/demand/${demand.slug}`;
  return { title: demand.title, description: demand.problemStatement, alternates: { canonical: path }, ...socialMetadata({ title: demand.title, description: demand.problemStatement, path, eyebrow: "Public demand signal", detail: demand.source.publisher }) };
}

export default async function DemandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const demand = await getAtlasDemandBySlug(slug);
  if (!demand) notFound();

  return (
    <PublicPageShell
      eyebrow={`Public demand signal · ${demand.source.publisher}`}
      title={demand.title}
      description={demand.source.summary}
      breadcrumbs={[{ label: "Map", href: "/map" }, { label: "Public Needs", href: "/demand" }, { label: demand.title }]}
      actions={<>
        <PublicShare title={demand.title} description={demand.problemStatement} path={`/demand/${demand.slug}`} />
        <a href={demand.source.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--atlas-primary)] px-4 text-xs font-semibold text-white no-underline hover:bg-[var(--atlas-primary-hover)] hover:no-underline">
          Read the original source <ExternalLink className="size-4" />
        </a>
      </>}
    >
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <PublicCard title="What needs to change" eyebrow={publicLanguage.sourceFact}>
            <p className="text-sm leading-6 text-[var(--atlas-muted)]">{demand.problemStatement}</p>
          </PublicCard>
          <PublicCard title="What success looks like" eyebrow={publicLanguage.sourceFact}>
            <p className="text-sm leading-6 text-[var(--atlas-muted)]">{demand.desiredEndState}</p>
          </PublicCard>
          <PublicCard title="Organizations with technology that may be relevant" eyebrow={`${demand.matches.length} reviewed ${demand.matches.length === 1 ? "assessment" : "assessments"}`}>
            {demand.matches.length ? (
              <div className="divide-y divide-[var(--atlas-border)]">
                {demand.matches.map(({ organization, capability, match }) => (
                  <article key={match.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <Link href={`/organizations/${organization.slug}`} prefetch={false} className="text-sm font-bold text-[var(--atlas-primary)] no-underline hover:underline">{organization.name}</Link>
                        <Link href={`/capabilities/${capability.slug}`} className="mt-1 block text-xs font-semibold text-[var(--atlas-ink-soft)] no-underline hover:underline">{capability.name}</Link>
                      </div>
                      <span className="w-fit rounded bg-[var(--atlas-primary-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--atlas-primary)]">{evidenceStrengthLabel(match.confidence)} public evidence</span>
                    </div>
                    <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--atlas-muted)]">Why this may be relevant</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--atlas-muted)]">{match.alignmentSummary}</p>
                    <div className="mt-3 rounded-xl border border-[var(--atlas-border)] bg-white/70 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--atlas-muted)]">What supports this assessment</p>
                      {match.citations.length ? <EvidenceList citations={match.citations} /> : <p className="mt-2 text-xs leading-5 text-[var(--atlas-muted)]">The reviewed technology profile and released public need support this assessment. Open both records before acting.</p>}
                    </div>
                  </article>
                ))}
              </div>
            ) : <EmptyCoverage title="No reviewed technology match is published yet" detail="This public problem remains an active research target. A technology will only appear here after a person reviews the evidence and publishes the connection." />}
          </PublicCard>
          <PublicCard title="What remains unknown" eyebrow={publicLanguage.coverageGap}>
            <ul className="space-y-2 text-xs leading-5 text-[var(--atlas-muted)]">
              <li className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-[var(--atlas-signal)]" />An empty result means the research is incomplete, not that Canada lacks relevant technology.</li>
              <li className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-[var(--atlas-signal)]" />Public statements do not establish procurement timing, budgets, eligibility, or endorsement.</li>
              <li className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-[var(--atlas-signal)]" />Every future assessment must remain source-linked and open to editorial review.</li>
            </ul>
          </PublicCard>
        </div>

        <aside className="space-y-5">
          <PublicCard title="Where this public need comes from" eyebrow={publicLanguage.sourceFact}>
            <dl className="grid gap-3 text-xs">
              <div><dt className="text-[var(--atlas-muted)]">Publisher</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">{demand.source.publisher}</dd></div>
              {demand.source.sourceKind ? <div><dt className="text-[var(--atlas-muted)]">Signal type</dt><dd className="mt-1 font-semibold capitalize text-[var(--atlas-ink-soft)]">{demand.source.sourceKind.replaceAll("_", " ")}</dd></div> : null}
              {demand.source.commitmentLevel ? <div><dt className="text-[var(--atlas-muted)]">Commitment</dt><dd className="mt-1 font-semibold capitalize text-[var(--atlas-ink-soft)]">{demand.source.commitmentLevel.replaceAll("_", " ")}</dd></div> : null}
              <div><dt className="text-[var(--atlas-muted)]">Document</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">{demand.source.title}</dd></div>
              <div><dt className="text-[var(--atlas-muted)]">Published</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">{demand.source.publishedOn ?? "Date not published"}</dd></div>
            </dl>
            <p className="mt-4 text-xs leading-5 text-[var(--atlas-muted)]">{demand.source.summary}</p>
            <div className="mt-4 rounded-2xl border border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--atlas-muted)]">Relevant passage{demand.source.sourceLocator ? ` · ${demand.source.sourceLocator}` : ""}</p>
              <blockquote className="mt-2 text-xs leading-5 text-[var(--atlas-ink-soft)]">{demand.source.sourceExcerpt}</blockquote>
            </div>
          </PublicCard>
          <PublicCard title="What supports this public need" eyebrow="Read the public record">
            <EvidenceList citations={demand.citations} />
          </PublicCard>
        </aside>
      </div>
      <div className="mt-5 flex items-start gap-3 rounded-[14px] bg-[var(--atlas-amber-soft)] px-4 py-3 text-xs leading-5 text-[var(--atlas-amber)]">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>{demand.publicCaveat}</p>
      </div>
      <CollectionContinuation
        title="Carry the public need into a practical search."
        description="Open the mapped view, inspect potentially relevant organizations, and save records and evidence to a private Working List."
        links={[
          { label: "Explore on the map", href: `/map?demand=${demand.slug}` },
          { label: "View Working Lists", href: "/collections" }
        ]}
      />
    </PublicPageShell>
  );
}
