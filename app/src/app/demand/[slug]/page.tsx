import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, ShieldAlert } from "lucide-react";
import { EvidenceList } from "@/components/atlas/evidence-list";
import { EmptyCoverage, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { assessmentConfidenceLabel } from "@/lib/atlas/presentation";
import { getAtlasDemandBySlug } from "@/lib/atlas/repository";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const demand = await getAtlasDemandBySlug(slug);
  return demand ? { title: demand.title, description: demand.problemStatement, alternates: { canonical: `/demand/${demand.slug}` }, openGraph: { title: demand.title, description: demand.problemStatement, url: `/demand/${demand.slug}` } } : { title: "Demand statement not found" };
}

export default async function DemandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const demand = await getAtlasDemandBySlug(slug);
  if (!demand) notFound();

  return (
    <PublicPageShell
      eyebrow={`Public demand signal · ${demand.source.publisher}`}
      title={demand.title}
      description={demand.problemStatement}
      backHref="/demand"
      backLabel="All demand signals"
      actions={
        <a href={demand.source.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--atlas-primary)] px-4 text-xs font-semibold text-white no-underline hover:bg-[var(--atlas-primary-hover)] hover:no-underline">
          View authoritative source <ExternalLink className="size-4" />
        </a>
      }
    >
      <div className="flex items-start gap-3 rounded-lg border border-[var(--atlas-amber)] bg-[var(--atlas-amber-soft)] px-4 py-3 text-xs leading-5 text-[var(--atlas-amber)]">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" />
        <p>{demand.publicCaveat}</p>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <PublicCard title="Desired end state" eyebrow="Public problem framing">
            <p className="text-sm leading-6 text-[var(--atlas-muted)]">{demand.desiredEndState}</p>
          </PublicCard>
          <PublicCard title="Capability matches" eyebrow={`${demand.matches.length} published assessments`}>
            {demand.matches.length ? (
              <div className="divide-y divide-[var(--atlas-border)]">
                {demand.matches.map(({ organization, capability, match }) => (
                  <article key={match.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <Link href={`/organizations/${organization.slug}`} className="text-sm font-bold text-[var(--atlas-primary)] no-underline hover:underline">{organization.name}</Link>
                        <Link href={`/capabilities/${capability.slug}`} className="mt-1 block text-xs font-semibold text-[var(--atlas-ink-soft)] no-underline hover:underline">{capability.name}</Link>
                      </div>
                      <span className="w-fit rounded bg-[var(--atlas-primary-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--atlas-primary)]">{assessmentConfidenceLabel(match.confidence)} assessment confidence</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[var(--atlas-muted)]">{match.alignmentSummary}</p>
                  </article>
                ))}
              </div>
            ) : <EmptyCoverage title="Demand relevance not assessed yet" detail="The public demand statement is preserved as a research target. Capabilities will not appear here until an analyst assesses the published evidence." />}
          </PublicCard>
          <PublicCard title="Known gaps and caveats" eyebrow="Coverage status">
            <ul className="space-y-2 text-xs leading-5 text-[var(--atlas-muted)]">
              <li className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-[var(--atlas-coral)]" />An empty match set indicates incomplete assessment coverage, not a lack of relevant Canadian capability.</li>
              <li className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-[var(--atlas-coral)]" />Public statements do not establish procurement timing, budgets, eligibility, or endorsement.</li>
              <li className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-[var(--atlas-coral)]" />Every future assessment must remain source-linked and open to editorial review.</li>
            </ul>
          </PublicCard>
        </div>

        <aside className="space-y-5">
          <PublicCard title="Source record" eyebrow={demand.source.classificationLabel}>
            <dl className="grid gap-3 text-xs">
              <div><dt className="text-[var(--atlas-muted)]">Publisher</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">{demand.source.publisher}</dd></div>
              {demand.source.sourceKind ? <div><dt className="text-[var(--atlas-muted)]">Signal type</dt><dd className="mt-1 font-semibold capitalize text-[var(--atlas-ink-soft)]">{demand.source.sourceKind.replaceAll("_", " ")}</dd></div> : null}
              {demand.source.commitmentLevel ? <div><dt className="text-[var(--atlas-muted)]">Commitment</dt><dd className="mt-1 font-semibold capitalize text-[var(--atlas-ink-soft)]">{demand.source.commitmentLevel.replaceAll("_", " ")}</dd></div> : null}
              <div><dt className="text-[var(--atlas-muted)]">Document</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">{demand.source.title}</dd></div>
              <div><dt className="text-[var(--atlas-muted)]">Published</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">{demand.source.publishedOn ?? "Date not published"}</dd></div>
            </dl>
            <p className="mt-4 text-xs leading-5 text-[var(--atlas-muted)]">{demand.source.summary}</p>
          </PublicCard>
          <PublicCard title="Sources" eyebrow="Authoritative citation">
            <EvidenceList citations={demand.citations} />
          </PublicCard>
        </aside>
      </div>
    </PublicPageShell>
  );
}
