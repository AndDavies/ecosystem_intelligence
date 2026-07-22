import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookmarkPlus, Download, ExternalLink } from "lucide-react";
import { EvidenceList } from "@/components/atlas/evidence-list";
import { JsonLd } from "@/components/seo/json-ld";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { assessmentConfidenceLabel, evidenceStrengthLabel, publicSourceCountLabel } from "@/lib/atlas/presentation";
import { getAtlasCapabilityBySlug, getPublishedAtlasSlugs } from "@/lib/atlas/repository";
import { absoluteUrl } from "@/lib/site";
import { formatDate, toTitleCase } from "@/lib/utils";

export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await getPublishedAtlasSlugs();
  return slugs.capabilities.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const publicCapability = await getAtlasCapabilityBySlug(slug);

  if (!publicCapability) {
    return { title: "Technology not found", robots: { index: false, follow: false } };
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
  const hasPublishedAlignment = capability.missionMatches.length > 0 || capability.demandMatches.length > 0;

  return (
    <PublicPageShell
      eyebrow="Technology profile"
      title={capability.name}
      description={capability.summary}
      breadcrumbs={[
        { label: "Ecosystem Map", href: "/" },
        { label: "Organizations", href: "/organizations" },
        { label: organization.name, href: `/organizations/${organization.slug}` },
        { label: capability.name }
      ]}
      actions={
        <>
          <Link href={`/collections?addType=capability&addId=${capability.id}&returnTo=${encodeURIComponent(`/capabilities/${capability.slug}`)}`} className="atlas-secondary-button h-10 gap-2 px-4 text-xs">
            <BookmarkPlus className="size-4" /> Add to Working List
          </Link>
          <Link href={`/api/export?type=capability-dossier&slug=${capability.slug}`} className="atlas-secondary-button h-10 gap-2 px-4 text-xs">
            <Download className="size-4" /> Download profile
          </Link>
          <Link href={`/organizations/${organization.slug}`} className="atlas-primary-button h-10 gap-2 px-4 text-xs">
            Meet {organization.name} <ExternalLink className="size-4" />
          </Link>
        </>
      }
    >
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Product", name: capability.name, description: capability.summary, brand: { "@type": "Organization", name: organization.name, url: absoluteUrl(`/organizations/${organization.slug}`) }, url: absoluteUrl(`/capabilities/${capability.slug}`) },
        { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Ecosystem Map", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Organizations", item: absoluteUrl("/organizations") }, { "@type": "ListItem", position: 3, name: organization.name, item: absoluteUrl(`/organizations/${organization.slug}`) }, { "@type": "ListItem", position: 4, name: capability.name, item: absoluteUrl(`/capabilities/${capability.slug}`) }] }
      ]} />
      <div className="grid gap-5 lg:grid-cols-[1.22fr_0.78fr]">
        <div className="space-y-5">
          <PublicCard title="Technology overview" eyebrow={capability.capabilityType ?? "What it does"}>
            <div className="grid gap-5 sm:grid-cols-2">
              <CapabilityList label="Core features" values={capability.coreFeatures} />
              <CapabilityList label="Defence and security uses" values={capability.defenceApplications} />
              <CapabilityList label="What sets it apart" values={capability.novelty} empty="No source-supported differentiators are published yet." />
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

          {hasPublishedAlignment ? <PublicCard title="Where It Fits" eyebrow="See the clearest reason to engage">
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
            ) : null}
            {capability.demandMatches.length ? (
              <div className={capability.missionMatches.length ? "mt-3 space-y-3" : "space-y-3"}>
                {capability.demandMatches.map((match) => (
                  <article key={match.id} className="rounded-md border border-[var(--atlas-primary-border)] bg-[var(--atlas-primary-soft)] p-4">
                    <Link href={`/demand/${match.demandSlug}`} className="text-sm font-bold text-[var(--atlas-primary)] no-underline hover:underline">{match.demandTitle}</Link>
                    <p className="mt-2 text-xs leading-5 text-[var(--atlas-ink-soft)]">{match.alignmentSummary}</p>
                    <p className="mt-2 text-[10px] text-[var(--atlas-muted)]">Public-source alignment only; not eligibility or endorsement.</p>
                  </article>
                ))}
              </div>
            ) : null}
            <p className="mt-4 text-xs leading-5 text-[var(--atlas-muted)]">These connections are interpretations based on public sources. They are not procurement eligibility, endorsement, or classified demand.</p>
          </PublicCard> : null}
        </div>

        <aside className="space-y-5">
          <PublicCard title={organization.name} eyebrow="Who is building it">
            <p className="text-base font-bold text-[var(--atlas-ink)]">{organization.name}</p>
            <p className="mt-2 text-xs leading-5 text-[var(--atlas-muted)]">{organization.description}</p>
            <Link href={`/organizations/${organization.slug}`} className="mt-4 inline-flex text-xs font-semibold text-[var(--atlas-primary)] no-underline hover:underline">Explore the organization</Link>
          </PublicCard>
          <PublicCard title="Evidence & sources" eyebrow={publicSourceCountLabel(new Set(citations.map((citation) => citation.sourceUrl)).size)}>
            <EvidenceList citations={citations} />
            {!hasPublishedAlignment ? (
              <div className="mt-5 rounded-2xl border border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--atlas-ink-soft)]">We have not connected this technology to a mission or public need yet.</p>
                <p className="mt-1 text-xs leading-5 text-[var(--atlas-muted)]">Treat that as a research gap, not a negative signal. <Link href="/demand" className="font-semibold text-[var(--atlas-primary)]">Explore public demand signals</Link>.</p>
              </div>
            ) : null}
          </PublicCard>
          <PublicCard title="How well this is supported" eyebrow="What supports this profile">
            <dl className="grid gap-3 text-xs">
              <div><dt className="text-[var(--atlas-muted)]">Source support</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">{evidenceStrengthLabel(capability.sourceConfidence)}</dd></div>
              <div><dt className="text-[var(--atlas-muted)]">Last verified</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">{formatDate(capability.lastReviewedAt)}</dd></div>
              <div><dt className="text-[var(--atlas-muted)]">Technology areas</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">{capability.technicalDomains.map((domain) => domain.name).join(", ") || "Not yet mapped"}</dd></div>
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
