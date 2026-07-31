import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookmarkPlus, Building2, Download, Handshake } from "lucide-react";
import { AlignmentMatchCard, evidenceStrengthChipClass } from "@/components/atlas/alignment-match-card";
import { EvidenceLegend } from "@/components/atlas/evidence-legend";
import { EvidenceList } from "@/components/atlas/evidence-list";
import { JsonLd } from "@/components/seo/json-ld";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { PublicShare } from "@/components/atlas/public-share";
import { evidenceStrengthLabel, organizationKindLabel, publicLanguage, publicSourceCountLabel } from "@/lib/atlas/presentation";
import { getAtlasCapabilityBySlug } from "@/lib/atlas/repository";
import { absoluteUrl } from "@/lib/site";
import { socialMetadata } from "@/lib/seo/social";
import { formatDate, toTitleCase } from "@/lib/utils";

export const revalidate = 300;

export async function generateStaticParams() {
  // Capability profiles render on demand; this keeps a transient upstream
  // database timeout from failing the whole production build.
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const publicCapability = await getAtlasCapabilityBySlug(slug);

  if (!publicCapability) {
    return { title: "Capability not found", robots: { index: false, follow: false } };
  }

  const path = `/capabilities/${publicCapability.capability.slug}`;
  const social = socialMetadata({ title: publicCapability.capability.name, description: publicCapability.capability.summary, path, eyebrow: "Canadian capability", detail: publicCapability.organization.name });
  return {
    title: publicCapability.capability.name,
    description: publicCapability.capability.summary,
    alternates: { canonical: path },
    ...social
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
      eyebrow="Capability profile"
      title={capability.name}
      description={capability.summary}
      breadcrumbs={[
        { label: "Map", href: "/" },
        { label: "Organizations", href: "/organizations" },
        { label: organization.name, href: `/organizations/${organization.slug}` },
        { label: capability.name }
      ]}
      actions={
        <>
          <Link href={`/connect/${organization.slug}`} className="atlas-primary-button h-10 w-full gap-2 px-4 text-xs sm:w-auto">
            <Handshake className="size-4" /> Request an introduction
          </Link>
          <Link href={`/collections?addType=capability&addId=${capability.id}&returnTo=${encodeURIComponent(`/capabilities/${capability.slug}`)}`} className="atlas-secondary-button h-10 gap-2 px-4 text-xs">
            <BookmarkPlus className="size-4" /> Add to Working List
          </Link>
          <Link href={`/api/export?type=capability-dossier&slug=${capability.slug}`} className="atlas-secondary-button h-10 gap-2 px-4 text-xs">
            <Download className="size-4" /> Download profile
          </Link>
          <PublicShare title={capability.name} description={capability.summary} path={`/capabilities/${capability.slug}`} />
          <Link href={`/organizations/${organization.slug}`} className="atlas-secondary-button h-10 gap-2 px-4 text-xs">
            Explore {organization.name} <ArrowRight className="size-4" />
          </Link>
        </>
      }
    >
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Product", name: capability.name, description: capability.summary, brand: { "@type": "Organization", name: organization.name, url: absoluteUrl(`/organizations/${organization.slug}`) }, url: absoluteUrl(`/capabilities/${capability.slug}`) },
        { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Ecosystem Map", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Organizations", item: absoluteUrl("/organizations") }, { "@type": "ListItem", position: 3, name: organization.name, item: absoluteUrl(`/organizations/${organization.slug}`) }, { "@type": "ListItem", position: 4, name: capability.name, item: absoluteUrl(`/capabilities/${capability.slug}`) }] }
      ]} />
      <EvidenceLegend compact className="mb-5" />
      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-5 lg:order-2">
          <PublicCard title="Capability overview" eyebrow={capability.capabilityType ?? "What it does"}>
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
            {capability.technicalTags.length ? (
              <div className="mt-5 flex flex-wrap gap-1.5 border-t border-[var(--atlas-border)] pt-4">
                {capability.technicalTags.map((tag) => <span key={tag} className="rounded-[6px] bg-[var(--atlas-surface-muted)] px-2 py-1 text-[10px] font-medium text-[var(--atlas-muted)]">{toTitleCase(tag)}</span>)}
              </div>
            ) : null}
          </PublicCard>

          {hasPublishedAlignment ? <PublicCard title={publicLanguage.technologyDemand} eyebrow="See the clearest reason to explore a conversation">
            {capability.missionMatches.length ? (
              <div className="space-y-3">
                {capability.missionMatches.map((match) => (
                  <AlignmentMatchCard
                    key={match.id}
                    href={`/missions/${match.missionArea.slug}`}
                    title={match.missionArea.name}
                    summary={match.alignmentSummary}
                    matchType={match.matchType}
                    confidence={match.confidence}
                    citations={match.citations}
                  />
                ))}
              </div>
            ) : null}
            {capability.demandMatches.length ? (
              <div className={capability.missionMatches.length ? "mt-3 space-y-3" : "space-y-3"}>
                {capability.demandMatches.map((match) => (
                  <AlignmentMatchCard
                    key={match.id}
                    href={`/demand/${match.demandSlug}`}
                    title={match.demandTitle}
                    summary={match.alignmentSummary}
                    matchType={match.matchType}
                    confidence={match.confidence}
                    citations={match.citations}
                    caveat="Public-source alignment only; not eligibility or endorsement."
                  />
                ))}
              </div>
            ) : null}
            <p className="mt-4 text-xs leading-5 text-[var(--atlas-muted)]">{publicLanguage.demandCaveat}</p>
          </PublicCard> : null}
        </div>

        <aside className="space-y-5 self-start lg:order-1 lg:sticky lg:top-24">
          <PublicCard title={organization.name} eyebrow="Who is building it">
            <div className="flex items-center gap-3">
              <span className="relative flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#c9ccca] p-1.5 text-[var(--atlas-primary)] ring-1 ring-[var(--atlas-primary-border)]">
                {organization.logo ? (
                  <Image
                    src={organization.logo.publicUrl}
                    alt={`${organization.name} logo`}
                    fill
                    sizes="80px"
                    className="object-contain p-1.5"
                  />
                ) : (
                  <Building2 className="size-5" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--atlas-ink-soft)]">
                  {organizationKindLabel(organization.entityKind)}
                  {organization.primaryLocation ? ` · ${organization.primaryLocation.name}` : ""}
                </p>
                <p className="mt-1.5">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ring-1 ${evidenceStrengthChipClass[organization.sourceConfidence]}`}>
                    {evidenceStrengthLabel(organization.sourceConfidence)} public evidence
                  </span>
                </p>
              </div>
            </div>
            <Link href={`/organizations/${organization.slug}`} className="atlas-secondary-button mt-4 flex h-10 w-full gap-2 px-4 text-xs">
              Explore the organization <ArrowRight className="size-4" />
            </Link>
          </PublicCard>
          <PublicCard title="Evidence & sources" eyebrow={publicSourceCountLabel(new Set(citations.map((citation) => citation.sourceUrl)).size)}>
            <EvidenceList citations={citations} />
            {!hasPublishedAlignment ? (
              <div className="mt-5 rounded-lg border border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--atlas-ink-soft)]">We have not connected this technology to a mission or public need yet.</p>
                <p className="mt-1 text-xs leading-5 text-[var(--atlas-muted)]">Treat that as a research gap, not a negative signal. <Link href="/demand" className="font-semibold text-[var(--atlas-primary)]">Explore public needs</Link>.</p>
              </div>
            ) : null}
          </PublicCard>
          <PublicCard title="How well this is supported" eyebrow="What supports this profile">
            <dl className="grid gap-3 text-xs">
              <div><dt className="text-[var(--atlas-muted)]">Public evidence</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">{evidenceStrengthLabel(capability.sourceConfidence)}</dd></div>
              <div><dt className="text-[var(--atlas-muted)]">Last reviewed</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">{formatDate(capability.lastReviewedAt)}</dd></div>
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
