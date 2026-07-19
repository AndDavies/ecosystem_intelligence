import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookmarkPlus, Download, ExternalLink } from "lucide-react";
import { EvidenceList } from "@/components/atlas/evidence-list";
import { EmptyCoverage, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { assessmentConfidenceLabel, evidenceStrengthLabel, publicSourceCountLabel } from "@/lib/atlas/presentation";
import { getAtlasCapabilityBySlug } from "@/lib/atlas/repository";
import { formatDate, toTitleCase } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const publicCapability = await getAtlasCapabilityBySlug(slug);

  if (!publicCapability) {
    return { title: "Capability not found", robots: { index: false, follow: false } };
  }

  return {
    title: publicCapability.capability.name,
    description: publicCapability.capability.summary,
    alternates: { canonical: `/capabilities/${publicCapability.capability.slug}` },
    openGraph: {
      title: publicCapability.capability.name,
      description: publicCapability.capability.summary,
      url: `/capabilities/${publicCapability.capability.slug}`
    }
  };
}

export default async function CapabilityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const publicCapability = await getAtlasCapabilityBySlug(slug);
  if (!publicCapability) notFound();

  return <PublicCapabilityPage organization={publicCapability.organization} capability={publicCapability.capability} />;
}

function PublicCapabilityPage({
  organization,
  capability
}: {
  organization: Awaited<ReturnType<typeof getAtlasCapabilityBySlug>> extends infer T
    ? T extends { organization: infer O }
      ? O
      : never
    : never;
  capability: Awaited<ReturnType<typeof getAtlasCapabilityBySlug>> extends infer T
    ? T extends { capability: infer C }
      ? C
      : never
    : never;
}) {
  const citations = [
    ...capability.citations,
    ...capability.missionMatches.flatMap((match) => match.citations),
    ...capability.demandMatches.flatMap((match) => match.citations)
  ];

  return (
    <PublicPageShell
      eyebrow="Capability dossier"
      title={capability.name}
      description={capability.summary}
      backHref={`/organizations/${organization.slug}`}
      backLabel={`Back to ${organization.name}`}
      actions={
        <>
          <Link href={`/collections?addType=capability&addId=${capability.id}&returnTo=${encodeURIComponent(`/capabilities/${capability.slug}`)}`} className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--atlas-border)] bg-white px-4 text-xs font-semibold text-[var(--atlas-ink-soft)] no-underline hover:bg-[var(--atlas-surface-muted)] hover:no-underline">
            <BookmarkPlus className="size-4" /> Save
          </Link>
          <Link href={`/api/export?type=capability-dossier&slug=${capability.slug}`} className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--atlas-border)] bg-white px-4 text-xs font-semibold text-[var(--atlas-ink-soft)] no-underline hover:bg-[var(--atlas-surface-muted)] hover:no-underline">
            <Download className="size-4" /> Export profile
          </Link>
          <Link href={`/organizations/${organization.slug}`} className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--atlas-primary)] px-4 text-xs font-semibold text-white no-underline hover:bg-[var(--atlas-primary-hover)] hover:no-underline">
            Organization profile <ExternalLink className="size-4" />
          </Link>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1.22fr_0.78fr]">
        <div className="space-y-5">
          <PublicCard title="Capability profile" eyebrow={capability.capabilityType ?? "Verified capability"}>
            <div className="grid gap-5 sm:grid-cols-2">
              <CapabilityList label="Core features" values={capability.coreFeatures} />
              <CapabilityList label="Defence applications" values={capability.defenceApplications} />
              <CapabilityList label="Novelty" values={capability.novelty} empty="No verified novelty claims are published." />
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--atlas-muted)]">Maturity</h3>
                <dl className="mt-2 space-y-2 text-xs text-[var(--atlas-muted)]">
                  {capability.technologyReadinessLevel !== null ? <div><dt className="inline font-semibold">TRL: </dt><dd className="inline">{capability.technologyReadinessLevel}</dd></div> : null}
                  {capability.maturity ? <div><dt className="inline font-semibold">Stage: </dt><dd className="inline">{capability.maturity}</dd></div> : null}
                  {capability.commercialAvailability ? <div><dt className="inline font-semibold">Commercial: </dt><dd className="inline">{capability.commercialAvailability}</dd></div> : null}
                  {capability.technologyReadinessLevel === null && !capability.maturity && !capability.commercialAvailability ? <p className="leading-5 text-[var(--atlas-muted)]">Maturity fields are not published because the reviewed sources do not support them.</p> : null}
                </dl>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-1.5 border-t border-[var(--atlas-border)] pt-4">
              {capability.technicalTags.map((tag) => <span key={tag} className="rounded bg-[var(--atlas-surface-muted)] px-2 py-1 text-[10px] font-medium text-[var(--atlas-muted)]">{toTitleCase(tag)}</span>)}
            </div>
          </PublicCard>

          <PublicCard title="Mission relevance" eyebrow="Analyst assessments">
            {capability.missionMatches.length ? (
              <div className="space-y-3">
                {capability.missionMatches.map((match) => (
                  <article key={match.id} className="rounded-md border border-[var(--atlas-amber)] bg-[var(--atlas-amber-soft)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link href={`/?mission=${match.missionArea.slug}`} className="text-sm font-bold text-[var(--atlas-amber)] no-underline hover:underline">{match.missionArea.name}</Link>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--atlas-amber)]">{assessmentConfidenceLabel(match.confidence)} assessment confidence</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[var(--atlas-amber)]">{match.alignmentSummary}</p>
                  </article>
                ))}
              </div>
            ) : <EmptyCoverage title="Mission relevance not assessed yet" detail="This verified capability does not yet include an analyst assessment against a mission area." />}
          </PublicCard>

          <PublicCard title="Demand relevance" eyebrow="Public demand signals">
            {capability.demandMatches.length ? (
              <div className="space-y-3">
                {capability.demandMatches.map((match) => (
                  <article key={match.id} className="rounded-md border border-[var(--atlas-primary-border)] bg-[var(--atlas-primary-soft)] p-4">
                    <Link href={`/demand/${match.demandSlug}`} className="text-sm font-bold text-[var(--atlas-primary)] no-underline hover:underline">{match.demandTitle}</Link>
                    <p className="mt-2 text-xs leading-5 text-[var(--atlas-ink-soft)]">{match.alignmentSummary}</p>
                    <p className="mt-2 text-[10px] text-[var(--atlas-muted)]">Public-source alignment only; not eligibility or endorsement.</p>
                  </article>
                ))}
              </div>
            ) : <EmptyCoverage title="Demand relevance not assessed yet" detail="No public-demand assessment has been published for this capability." />}
          </PublicCard>
        </div>

        <aside className="space-y-5">
          <PublicCard title="Organization" eyebrow="Associated company">
            <p className="text-base font-bold text-[var(--atlas-ink)]">{organization.name}</p>
            <p className="mt-2 text-xs leading-5 text-[var(--atlas-muted)]">{organization.description}</p>
            <Link href={`/organizations/${organization.slug}`} className="mt-4 inline-flex text-xs font-semibold text-[var(--atlas-primary)] no-underline hover:underline">View organization profile</Link>
          </PublicCard>
          <PublicCard title="Sources" eyebrow={publicSourceCountLabel(new Set(citations.map((citation) => citation.sourceUrl)).size)}>
            <EvidenceList citations={citations} />
          </PublicCard>
          <PublicCard title="Data quality" eyebrow="Profile verification">
            <dl className="grid gap-3 text-xs">
              <div><dt className="text-[var(--atlas-muted)]">Evidence strength</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">{evidenceStrengthLabel(capability.sourceConfidence)}</dd></div>
              <div><dt className="text-[var(--atlas-muted)]">Last verified</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">{formatDate(capability.lastReviewedAt)}</dd></div>
              <div><dt className="text-[var(--atlas-muted)]">Technical domains</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">{capability.technicalDomains.map((domain) => domain.name).join(", ") || "Not yet mapped"}</dd></div>
            </dl>
          </PublicCard>
        </aside>
      </div>
    </PublicPageShell>
  );
}

function CapabilityList({ label, values, empty }: { label: string; values: string[]; empty?: string }) {
  return (
    <div>
      <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--atlas-muted)]">{label}</h3>
      {values.length ? (
        <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[var(--atlas-muted)]">
          {values.map((value) => <li key={value} className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-[var(--atlas-primary)]" />{value}</li>)}
        </ul>
      ) : <p className="mt-2 text-xs leading-5 text-[var(--atlas-muted)]">{empty ?? "No verified values are published."}</p>}
    </div>
  );
}
