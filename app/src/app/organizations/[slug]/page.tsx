import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookmarkPlus, Building2, Download, ExternalLink, FileCheck2, Handshake, MapPin, ShieldCheck } from "lucide-react";
import { EvidenceList } from "@/components/atlas/evidence-list";
import { JsonLd } from "@/components/seo/json-ld";
import { EmptyCoverage, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { assessmentConfidenceLabel, evidenceStrengthLabel, locationAccuracyLabel, publicSourceCountLabel } from "@/lib/atlas/presentation";
import { getAtlasOrganizationBySlug } from "@/lib/atlas/repository";
import { formatDate, toTitleCase } from "@/lib/utils";
import { absoluteUrl } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const organization = await getAtlasOrganizationBySlug(slug);
  if (!organization) return { title: "Organization not found" };
  return { title: organization.name, description: organization.description, alternates: { canonical: `/organizations/${organization.slug}` }, openGraph: { title: organization.name, description: organization.description, url: `/organizations/${organization.slug}`, type: "profile" } };
}

export default async function OrganizationDossierPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const organization = await getAtlasOrganizationBySlug(slug);
  if (!organization) notFound();

  const citations = [
    ...organization.citations,
    ...organization.capabilities.flatMap((capability) => [
      ...capability.citations,
      ...capability.missionMatches.flatMap((match) => match.citations),
      ...capability.demandMatches.flatMap((match) => match.citations)
    ])
  ];

  return (
    <PublicPageShell
      eyebrow="Organization profile"
      title={organization.name}
      description={organization.description}
      backHref="/organizations"
      backLabel="All organizations"
      actions={
        <>
          <Link href={`/connect/${organization.slug}`} className="atlas-primary-button h-10 gap-2 px-4 text-xs">
            <Handshake className="size-4" /> Connect
          </Link>
          <Link href={`/collections?addType=organization&addId=${organization.id}&returnTo=${encodeURIComponent(`/organizations/${organization.slug}`)}`} className="atlas-secondary-button h-10 gap-2 px-4 text-xs">
            <BookmarkPlus className="size-4" /> Save
          </Link>
          <Link href={`/api/export?type=organization-dossier&slug=${organization.slug}`} className="atlas-secondary-button h-10 gap-2 px-4 text-xs">
            <Download className="size-4" /> Export profile
          </Link>
          {organization.websiteUrl ? (
            <a href={organization.websiteUrl} target="_blank" rel="noreferrer" className="atlas-tertiary-button h-10 gap-2 px-3 text-xs">
              Visit website <ExternalLink className="size-4" />
            </a>
          ) : null}
        </>
      }
    >
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Organization", name: organization.name, legalName: organization.legalName ?? undefined, url: absoluteUrl(`/organizations/${organization.slug}`), sameAs: organization.websiteUrl ? [organization.websiteUrl] : undefined, description: organization.description, address: organization.primaryLocation ? { "@type": "PostalAddress", addressLocality: organization.primaryLocation.city ?? undefined, addressRegion: organization.primaryLocation.provinceTerritory ?? undefined, addressCountry: "CA" } : undefined },
        { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Atlas", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Organizations", item: absoluteUrl("/organizations") }, { "@type": "ListItem", position: 3, name: organization.name, item: absoluteUrl(`/organizations/${organization.slug}`) }] }
      ]} />
      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-5 self-start lg:sticky lg:top-24">
          <PublicCard title="Profile at a glance" eyebrow="Published identity">
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[var(--atlas-border)] bg-[var(--atlas-primary-soft)] p-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--atlas-primary)] ring-1 ring-[var(--atlas-primary-border)]" aria-hidden="true">
                <Building2 className="size-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--atlas-ink)]">{organization.name}</p>
                <p className="mt-0.5 text-xs text-[var(--atlas-muted)]">{toTitleCase(organization.entityKind)}{organization.primaryLocation ? ` · ${organization.primaryLocation.name}` : ""}</p>
              </div>
            </div>
            <dl className="grid gap-4 text-sm">
              <ProfileItem label="Headquarters" value={organization.primaryLocation?.name} icon={<MapPin className="size-4" />} />
              <ProfileItem label="Location accuracy" value={organization.primaryLocation ? locationAccuracyLabel(organization.primaryLocation.geographicConfidence) : null} />
              <ProfileItem label="Organization type" value={toTitleCase(organization.entityKind)} />
              <ProfileItem label="Categories" value={organization.categories.map(toTitleCase).join(", ")} />
              <ProfileItem label="Company stage" value={organization.companyStage} />
              <ProfileItem label="Employee range" value={organization.employeeRange} />
              <ProfileItem label="Commercial status" value={organization.commercialStatus} />
            </dl>
            <div className="mt-5 border-t border-[var(--atlas-border)] pt-5">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--atlas-primary-soft)] text-[var(--atlas-primary)]"><ShieldCheck className="size-5" /></span>
                <div>
                  <p className="text-sm font-semibold text-[var(--atlas-ink)]">{evidenceStrengthLabel(organization.sourceConfidence)} evidence</p>
                  <p className="text-xs text-[var(--atlas-muted)]">Last verified {formatDate(organization.lastReviewedAt)}</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-[var(--atlas-muted)]">Unknown fields remain unpublished. Relevance assessments are separated from verified profile facts.</p>
            </div>
          </PublicCard>

          <Link href={`/submit?submissionType=correction&targetType=organization&targetId=${organization.id}&returnTo=${encodeURIComponent(`/organizations/${organization.slug}`)}`} className="atlas-secondary-button flex h-12 w-full items-center justify-between px-4 text-sm">
            Suggest a correction
            <FileCheck2 className="size-4 text-[var(--atlas-primary)]" />
          </Link>
        </aside>

        <div className="space-y-5">
          <PublicCard title="Capabilities" eyebrow={`${organization.capabilities.length} verified ${organization.capabilities.length === 1 ? "capability" : "capabilities"}`}>
            <div className="divide-y divide-[var(--atlas-border)]">
              {organization.capabilities.map((capability) => (
                <article key={capability.id} className="py-5 first:pt-0 last:pb-0">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold tracking-[-0.02em] text-[var(--atlas-ink)]">
                        <Link href={`/capabilities/${capability.slug}`} className="no-underline hover:text-[var(--atlas-primary)] hover:no-underline">{capability.name}</Link>
                      </h3>
                      {capability.capabilityType ? <p className="mt-1 text-xs text-[var(--atlas-muted)]">{capability.capabilityType}</p> : null}
                    </div>
                    <span className="w-fit rounded-full bg-[var(--atlas-primary-soft)] px-2.5 py-1 text-[10px] font-semibold text-[var(--atlas-primary)]">{evidenceStrengthLabel(capability.sourceConfidence)} evidence</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--atlas-ink-soft)]">{capability.summary}</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {capability.coreFeatures.length ? <TagList label="Core features" values={capability.coreFeatures} /> : null}
                    {capability.defenceApplications.length ? <TagList label="Defence applications" values={capability.defenceApplications} /> : null}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {capability.technicalTags.map((tag) => <span key={tag} className="rounded-full bg-[var(--atlas-surface-muted)] px-2.5 py-1 text-[10px] font-medium text-[var(--atlas-ink-soft)] ring-1 ring-[var(--atlas-border)]">{toTitleCase(tag)}</span>)}
                  </div>
                </article>
              ))}
            </div>
          </PublicCard>

          <PublicCard title="Mission relevance" eyebrow="Analyst assessments">
            {organization.capabilities.some((capability) => capability.missionMatches.length) ? (
              <div className="space-y-3">
                {organization.capabilities.flatMap((capability) => capability.missionMatches.map((match) => (
                  <article key={match.id} className="rounded-2xl border border-[var(--atlas-violet)]/25 bg-[var(--atlas-violet-soft)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link href={`/?mission=${match.missionArea.slug}`} className="text-sm font-bold text-[var(--atlas-violet)] no-underline hover:underline">{match.missionArea.name}</Link>
                      <span className="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-semibold text-[var(--atlas-violet)]">{assessmentConfidenceLabel(match.confidence)} confidence</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[var(--atlas-ink-soft)]">{match.alignmentSummary}</p>
                    <AssessmentSources citations={match.citations} />
                  </article>
                )))}
              </div>
            ) : <EmptyCoverage title="Mission relevance not assessed yet" detail="This verified organization profile does not yet include an analyst assessment against a mission area." />}
          </PublicCard>

          <PublicCard title="Demand relevance" eyebrow="Public demand signals">
            {organization.capabilities.some((capability) => capability.demandMatches.length) ? (
              <div className="space-y-3">
                {organization.capabilities.flatMap((capability) => capability.demandMatches.map((match) => (
                  <article key={match.id} className="rounded-2xl border border-[var(--atlas-primary-border)] bg-[var(--atlas-primary-soft)] p-4">
                    <Link href={`/demand/${match.demandSlug}`} className="text-sm font-bold text-[var(--atlas-primary)] no-underline hover:underline">{match.demandTitle}</Link>
                    <p className="mt-2 text-xs leading-5 text-[var(--atlas-ink-soft)]">{match.alignmentSummary}</p>
                    <AssessmentSources citations={match.citations} />
                  </article>
                )))}
              </div>
            ) : <EmptyCoverage title="Demand relevance not assessed yet" detail="No public-demand assessment has been published for this organization. This is a coverage gap, not a negative assessment." />}
          </PublicCard>

          <PublicCard title="Sources" eyebrow={publicSourceCountLabel(new Set(citations.map((citation) => citation.sourceUrl)).size)}>
            <EvidenceList citations={citations} />
          </PublicCard>
        </div>
      </div>
    </PublicPageShell>
  );
}

function ProfileItem({ label, value, icon }: { label: string; value: string | number | null | undefined; icon?: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <dt className="text-xs font-medium text-[var(--atlas-muted)]">{label}</dt>
      <dd className="mt-1 flex items-center gap-2 text-sm font-semibold text-[var(--atlas-ink-soft)]">{icon}{value}</dd>
    </div>
  );
}

function TagList({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-[var(--atlas-muted)]">{label}</h4>
      <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[var(--atlas-ink-soft)]">
        {values.map((value) => <li key={value} className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-[var(--atlas-coral)]" />{value}</li>)}
      </ul>
    </div>
  );
}

function AssessmentSources({ citations }: { citations: Array<{ id: string; sourceUrl: string; sourceTitle: string }> }) {
  if (!citations.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-black/10 pt-3 text-[11px]">
      <span className="font-medium text-[var(--atlas-muted)]">Supporting sources</span>
      {citations.slice(0, 2).map((citation) => (
        <a key={citation.id} href={citation.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[var(--atlas-primary)] no-underline hover:underline">
          {citation.sourceTitle}<ExternalLink className="size-3" />
        </a>
      ))}
    </div>
  );
}
