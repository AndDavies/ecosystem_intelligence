import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookmarkPlus, Building2, Download, ExternalLink, FileCheck2, MapPin, ShieldCheck } from "lucide-react";
import { EvidenceList } from "@/components/atlas/evidence-list";
import { EmptyCoverage, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { assessmentConfidenceLabel, evidenceStrengthLabel, locationAccuracyLabel, publicSourceCountLabel } from "@/lib/atlas/presentation";
import { getAtlasOrganizationBySlug } from "@/lib/atlas/repository";
import { formatDate, toTitleCase } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const organization = await getAtlasOrganizationBySlug(slug);
  if (!organization) return { title: "Organization not found" };
  return { title: organization.name, description: organization.description };
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
          <Link href={`/collections?addType=organization&addId=${organization.id}&returnTo=${encodeURIComponent(`/organizations/${organization.slug}`)}`} className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-4 text-xs font-semibold text-[#344054] no-underline hover:bg-[#f8fafc] hover:no-underline">
            <BookmarkPlus className="size-4" /> Save
          </Link>
          <Link href={`/api/export?type=organization-dossier&slug=${organization.slug}`} className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-4 text-xs font-semibold text-[#344054] no-underline hover:bg-[#f8fafc] hover:no-underline">
            <Download className="size-4" /> Export profile
          </Link>
          {organization.websiteUrl ? (
            <a href={organization.websiteUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-md bg-[#007f98] px-4 text-xs font-semibold text-white no-underline hover:bg-[#00677d] hover:no-underline">
              Visit website <ExternalLink className="size-4" />
            </a>
          ) : null}
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="space-y-5">
          <PublicCard title="Profile at a glance" eyebrow="Published identity">
            <div className="mb-5 flex items-center gap-3 rounded-lg border border-[#d0d5dd] bg-[#f8fafc] p-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-white text-[#007f98] ring-1 ring-[#d0d5dd]" role="img" aria-label={`${organization.name} logo placeholder`}>
                <Building2 className="size-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold text-[#344054]">{organization.name}</p>
                <p className="mt-0.5 text-[11px] text-[#667085]">Logo pending rights and editorial approval</p>
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
          </PublicCard>

          <PublicCard title="Data quality" eyebrow="Profile verification">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-md bg-[#dcfae6] text-[#067647]"><ShieldCheck className="size-5" /></span>
              <div>
                <p className="text-sm font-semibold text-[#101828]">{evidenceStrengthLabel(organization.sourceConfidence)} evidence</p>
                <p className="text-xs text-[#667085]">Last verified {formatDate(organization.lastReviewedAt)}</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-[#667085]">Unknown fields remain unpublished. Mission and demand relevance are shown as analyst assessments, separate from verified profile information.</p>
          </PublicCard>

          <Link href={`/submit?submissionType=correction&targetType=organization&targetId=${organization.id}&returnTo=${encodeURIComponent(`/organizations/${organization.slug}`)}`} className="flex items-center justify-between rounded-lg border border-[#d0d5dd] bg-white px-5 py-4 text-sm font-semibold text-[#344054] no-underline hover:border-[#98a2b3] hover:no-underline">
            Suggest a correction
            <FileCheck2 className="size-4 text-[#007f98]" />
          </Link>
        </aside>

        <div className="space-y-5">
          <PublicCard title="Capabilities" eyebrow={`${organization.capabilities.length} verified ${organization.capabilities.length === 1 ? "capability" : "capabilities"}`}>
            <div className="space-y-5">
              {organization.capabilities.map((capability) => (
                <article key={capability.id} className="rounded-lg border border-[#d0d5dd] p-4 sm:p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-base font-bold text-[#101828]">
                        <Link href={`/capabilities/${capability.slug}`} className="no-underline hover:text-[#007f98] hover:no-underline">{capability.name}</Link>
                      </h3>
                      {capability.capabilityType ? <p className="mt-1 text-xs text-[#667085]">{capability.capabilityType}</p> : null}
                    </div>
                    <span className="w-fit rounded bg-[#e7f8fa] px-2 py-1 text-[10px] font-semibold text-[#007f98]">{evidenceStrengthLabel(capability.sourceConfidence)} evidence</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#475467]">{capability.summary}</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {capability.coreFeatures.length ? <TagList label="Core features" values={capability.coreFeatures} /> : null}
                    {capability.defenceApplications.length ? <TagList label="Defence applications" values={capability.defenceApplications} /> : null}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {capability.technicalTags.map((tag) => <span key={tag} className="rounded bg-[#f2f4f7] px-2 py-1 text-[10px] font-medium text-[#475467]">{toTitleCase(tag)}</span>)}
                  </div>
                </article>
              ))}
            </div>
          </PublicCard>

          <PublicCard title="Mission relevance" eyebrow="Analyst assessments">
            {organization.capabilities.some((capability) => capability.missionMatches.length) ? (
              <div className="space-y-3">
                {organization.capabilities.flatMap((capability) => capability.missionMatches.map((match) => (
                  <article key={match.id} className="rounded-md border border-[#fedf89] bg-[#fffaeb] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link href={`/?mission=${match.missionArea.slug}`} className="text-sm font-bold text-[#7a2e0e] no-underline hover:underline">{match.missionArea.name}</Link>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#93370d]">{assessmentConfidenceLabel(match.confidence)} assessment confidence</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#7a2e0e]">{match.alignmentSummary}</p>
                  </article>
                )))}
              </div>
            ) : <EmptyCoverage title="Mission relevance not assessed yet" detail="This verified organization profile does not yet include an analyst assessment against a mission area." />}
          </PublicCard>

          <PublicCard title="Demand relevance" eyebrow="Public demand signals">
            {organization.capabilities.some((capability) => capability.demandMatches.length) ? (
              <div className="space-y-3">
                {organization.capabilities.flatMap((capability) => capability.demandMatches.map((match) => (
                  <article key={match.id} className="rounded-md border border-[#9bd8e2] bg-[#e7f8fa] p-4">
                    <Link href={`/demand/${match.demandSlug}`} className="text-sm font-bold text-[#007f98] no-underline hover:underline">{match.demandTitle}</Link>
                    <p className="mt-2 text-xs leading-5 text-[#344054]">{match.alignmentSummary}</p>
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
      <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#667085]">{label}</dt>
      <dd className="mt-1 flex items-center gap-2 text-sm font-medium text-[#344054]">{icon}{value}</dd>
    </div>
  );
}

function TagList({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <h4 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#667085]">{label}</h4>
      <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[#475467]">
        {values.map((value) => <li key={value} className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-[#007f98]" />{value}</li>)}
      </ul>
    </div>
  );
}
