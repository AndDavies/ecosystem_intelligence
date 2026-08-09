import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookmarkPlus, Building2, Download, ExternalLink, FileCheck2, Handshake, Linkedin, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { AlignmentMatchCard } from "@/components/atlas/alignment-match-card";
import { ExecutiveOrganizationDossier } from "@/components/atlas/executive-organization-dossier";
import { EvidenceList } from "@/components/atlas/evidence-list";
import { JsonLd } from "@/components/seo/json-ld";
import { CollectionContinuation, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { PublicShare } from "@/components/atlas/public-share";
import { NorthSignalInline } from "@/components/atlas/north-signal-signup";
import {
  evidenceStrengthLabel,
  locationAccuracyLabel,
  organizationOfferingGap,
  organizationOfferingTitle,
  organizationSnapshotTitle,
  organizationWebsiteLabel,
  publicContactFromProfileData,
  publicLanguage,
  publicSourceCountLabel
} from "@/lib/atlas/presentation";
import { getAtlasOrganizationBySlug } from "@/lib/atlas/repository";
import { safeAtlasReturn } from "@/lib/atlas/return-path";
import { formatDate, toTitleCase } from "@/lib/utils";
import { absoluteUrl } from "@/lib/site";
import { socialMetadata } from "@/lib/seo/social";

// Safe map-return context is query-string state. Render the route dynamically
// while the bounded dossier loader retains its five-minute server cache.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const organization = await getAtlasOrganizationBySlug(slug);
  if (!organization) return { title: "Organization not found" };
  const path = `/organizations/${organization.slug}`;
  const primaryCapability = organization.capabilities[0];
  const isExecutiveDossier = organization.editorialProfile.version === "organization_editorial_profile_v1";
  const mandate = organizationMandateForMetadata(organization.profileData);
  const descriptor = primaryCapability?.name ?? conciseMetadataDescriptor(mandate) ?? organizationKindLabelForMetadata(organization.entityKind);
  const title = isExecutiveDossier ? `${organization.name} — ${descriptor}` : organization.name;
  const description = isExecutiveDossier
    ? metadataDescription(organization.description, primaryCapability?.summary ?? mandate ?? undefined)
    : organization.description;
  const social = socialMetadata({
    title,
    description,
    path,
    eyebrow: isExecutiveDossier ? "Executive organization dossier" : "Canadian organization",
    detail: isExecutiveDossier ? primaryCapability?.summary ?? mandate ?? organization.primaryLocation?.name : organization.primaryLocation?.name,
    logoUrl: isExecutiveDossier ? organization.logo?.publicUrl : undefined,
    location: isExecutiveDossier ? organization.primaryLocation?.name : undefined
  });
  return { title, description, alternates: { canonical: path }, ...social, openGraph: { ...social.openGraph, type: "profile" } };
}

export default async function OrganizationDossierPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const organization = await getAtlasOrganizationBySlug(slug);
  if (!organization) notFound();
  const mapReturnTo = safeAtlasReturn(query.returnTo);
  const profilePath = `/organizations/${organization.slug}?returnTo=${encodeURIComponent(mapReturnTo)}`;

  if (organization.editorialProfile.version === "organization_editorial_profile_v1") {
    return <ExecutiveOrganizationDossier organization={organization} mapReturnTo={mapReturnTo} profilePath={profilePath} />;
  }

  const citations = [
    ...organization.citations,
    ...organization.capabilities.flatMap((capability) => [
      ...capability.citations,
      ...capability.missionMatches.flatMap((match) => match.citations),
      ...capability.demandMatches.flatMap((match) => match.citations)
    ])
  ];
  const publicContact = publicContactFromProfileData(organization.profileData);
  const hasMissionMatches = organization.capabilities.some((capability) => capability.missionMatches.length);
  const hasDemandMatches = organization.capabilities.some((capability) => capability.demandMatches.length);
  const hasPublishedAlignment = hasMissionMatches || hasDemandMatches;
  const offeringTitle = organizationOfferingTitle(organization.entityKind, organization.name);

  return (
    <PublicPageShell
      eyebrow={organization.entityKind === "company" ? "Company profile" : "Organization profile"}
      title={organization.name}
      description={organization.description}
      breadcrumbs={[
        { label: "Map", href: mapReturnTo },
        { label: "Organizations", href: "/organizations" },
        { label: organization.name }
      ]}
      actions={
        <>
          <Link href={`/connect/${organization.slug}`} className="atlas-primary-button h-10 gap-2 px-4 text-xs">
            <Handshake className="size-4" /> Request an introduction
          </Link>
          <Link href={`/collections?addType=organization&addId=${organization.id}&returnTo=${encodeURIComponent(profilePath)}`} className="atlas-secondary-button h-10 gap-2 px-4 text-xs">
            <BookmarkPlus className="size-4" /> Add to Working List
          </Link>
          <PublicShare title={organization.name} description={organization.description} path={`/organizations/${organization.slug}`} />
          <Link href={`/api/export?type=organization-dossier&slug=${organization.slug}`} className="atlas-secondary-button h-10 gap-2 px-4 text-xs">
            <Download className="size-4" /> Download profile
          </Link>
          {organization.websiteUrl ? (
            <a href={organization.websiteUrl} target="_blank" rel="noreferrer" className="atlas-tertiary-button h-10 gap-2 px-3 text-xs">
              {organizationWebsiteLabel(organization.entityKind)} <ExternalLink className="size-4" />
            </a>
          ) : null}
        </>
      }
    >
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Organization", name: organization.name, legalName: organization.legalName ?? undefined, url: absoluteUrl(`/organizations/${organization.slug}`), sameAs: organization.websiteUrl ? [organization.websiteUrl] : undefined, logo: organization.logo?.publicUrl, description: organization.description, address: organization.primaryLocation ? { "@type": "PostalAddress", addressLocality: organization.primaryLocation.city ?? undefined, addressRegion: organization.primaryLocation.provinceTerritory ?? undefined, addressCountry: "CA" } : undefined },
        { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Ecosystem Map", item: absoluteUrl("/map") }, { "@type": "ListItem", position: 2, name: "Organizations", item: absoluteUrl("/organizations") }, { "@type": "ListItem", position: 3, name: organization.name, item: absoluteUrl(`/organizations/${organization.slug}`) }] }
      ]} />
      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-5 self-start lg:sticky lg:top-24">
          <PublicCard title={organizationSnapshotTitle(organization.entityKind)} eyebrow="What we know" className="atlas-tonal-surface bg-white shadow-[0_14px_36px_rgba(36,40,39,0.055)]">
            <div className="mb-5 flex items-center gap-3 rounded-[14px] bg-[var(--atlas-blue-soft)] p-3">
              <span className="relative flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-white p-2 text-[var(--atlas-evidence)]">
                {organization.logo ? (
                  <Image
                    src={organization.logo.publicUrl}
                    alt={`${organization.name} logo`}
                    fill
                    sizes="96px"
                    className="object-contain p-2"
                  />
                ) : (
                  <Building2 className="size-6" aria-hidden="true" />
                )}
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
            <div className="mt-5 rounded-[14px] bg-[var(--atlas-evidence-soft)] p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-[12px] bg-white text-[var(--atlas-evidence)]"><ShieldCheck className="size-5" /></span>
                <div>
                  <p className="text-sm font-semibold text-[var(--atlas-ink)]">{publicLanguage.evidenceStrength}: {evidenceStrengthLabel(organization.sourceConfidence)}</p>
                  <p className="text-xs text-[var(--atlas-muted)]">{publicLanguage.lastReviewed} {formatDate(organization.lastReviewedAt)}</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-[var(--atlas-muted)]">Unknown fields stay blank. You can see which details come from public sources and which connections are our current interpretation.</p>
            </div>
          </PublicCard>

          <PublicCard title="Contact" eyebrow="Start a conversation" className="atlas-tonal-surface bg-[var(--atlas-blue-soft)]">
            <div className="space-y-2.5 text-sm">
              {organization.websiteUrl ? <ContactLink href={organization.websiteUrl} label="Website" icon={<ExternalLink className="size-4" />} external /> : null}
              {publicContact.contactPageUrl ? <ContactLink href={publicContact.contactPageUrl} label="Official contact page" icon={<ArrowRight className="size-4" />} external /> : null}
              {publicContact.publicEmail ? <ContactLink href={`mailto:${publicContact.publicEmail}`} label={publicContact.publicEmail} icon={<Mail className="size-4" />} /> : null}
              {publicContact.publicPhone ? <ContactLink href={`tel:${publicContact.publicPhone}`} label={publicContact.publicPhone} icon={<Phone className="size-4" />} /> : null}
              {publicContact.linkedInUrl ? <ContactLink href={publicContact.linkedInUrl} label="LinkedIn" icon={<Linkedin className="size-4" />} external /> : null}
              {organization.primaryLocation ? <div className="flex items-start gap-2.5 rounded-xl bg-[var(--atlas-surface-muted)] px-3 py-2.5 text-[var(--atlas-ink-soft)]"><MapPin className="mt-0.5 size-4 shrink-0 text-[var(--atlas-primary)]" /><span>{organization.primaryLocation.name}</span></div> : null}
            </div>
            <Link href={`/connect/${organization.slug}`} className="atlas-primary-button mt-4 flex h-11 w-full gap-2 px-4 text-xs">
              <Handshake className="size-4" /> Request an introduction
            </Link>
            <p className="mt-3 text-xs leading-5 text-[var(--atlas-muted)]">We only publish official, source-supported contact details. True North Map can help route a relevant introduction without exposing private information.</p>
          </PublicCard>

          <Link href={`/submit?submissionType=correction&targetType=organization&targetId=${organization.id}&returnTo=${encodeURIComponent(profilePath)}`} className="atlas-secondary-button flex h-12 w-full items-center justify-between px-4 text-sm">
            Suggest a correction
            <FileCheck2 className="size-4 text-[var(--atlas-primary)]" />
          </Link>
        </aside>

        <div className="space-y-5">
          <PublicCard title={offeringTitle} eyebrow={organization.capabilities.length ? `${organization.capabilities.length} reviewed ${organization.capabilities.length === 1 ? "technology or offering" : "technologies and offerings"}` : "Coverage still growing"} className="atlas-tonal-surface bg-white shadow-[0_14px_36px_rgba(36,40,39,0.055)]">
            {organization.capabilities.length ? <div className="space-y-4">
              {organization.capabilities.map((capability) => (
                <article key={capability.id} className="rounded-[16px] bg-[var(--atlas-surface-muted)] p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold tracking-[-0.02em] text-[var(--atlas-ink)]">
                        <Link href={`/capabilities/${capability.slug}?returnTo=${encodeURIComponent(mapReturnTo)}`} className="no-underline hover:text-[var(--atlas-primary)] hover:no-underline">{capability.name}</Link>
                      </h3>
                      {capability.capabilityType ? <p className="mt-1 text-xs text-[var(--atlas-muted)]">{capability.capabilityType}</p> : null}
                    </div>
                    <span className="atlas-pill atlas-pill-tag atlas-pill-evidence w-fit px-2.5 py-1 text-[10px] font-semibold">{publicLanguage.evidenceStrength}: {evidenceStrengthLabel(capability.sourceConfidence)}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--atlas-ink-soft)]">{capability.summary}</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {capability.coreFeatures.length ? <TagList label="Core features" values={capability.coreFeatures} /> : null}
                    {capability.defenceApplications.length ? <TagList label="Defence applications" values={capability.defenceApplications} /> : null}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {capability.technicalTags.map((tag) => <span key={tag} className="atlas-pill atlas-pill-tag atlas-pill-blue px-2.5 py-1 text-[10px] font-medium">{toTitleCase(tag)}</span>)}
                  </div>
                  <Link href={`/capabilities/${capability.slug}?returnTo=${encodeURIComponent(mapReturnTo)}`} className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--atlas-primary)] no-underline hover:underline">
                    Explore this technology <ArrowRight className="size-3.5" />
                  </Link>
                </article>
              ))}
            </div> : (
              <div className="rounded-[16px] bg-[var(--atlas-blue-soft)] px-4 py-4">
                <p className="text-sm font-semibold leading-6 text-[var(--atlas-ink-soft)]">{organizationOfferingGap(organization.entityKind, organization.name)}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--atlas-muted)]">Use the official website for current details, or help us add a source-backed summary.</p>
                <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
                  {organization.websiteUrl ? <a href={organization.websiteUrl} target="_blank" rel="noreferrer" className="text-[var(--atlas-primary)] no-underline hover:underline">Visit the official website</a> : null}
                  <Link href={`/submit?submissionType=correction&targetType=organization&targetId=${organization.id}&returnTo=${encodeURIComponent(profilePath)}`} className="text-[var(--atlas-primary)] no-underline hover:underline">Suggest a source</Link>
                </div>
              </div>
            )}
          </PublicCard>

          {hasPublishedAlignment ? <PublicCard title={publicLanguage.technologyDemand} eyebrow="See the missions and released public needs worth exploring" className="atlas-tonal-surface bg-[var(--atlas-signal-soft)]">
            {hasMissionMatches ? (
              <div className="space-y-3">
                {organization.capabilities.flatMap((capability) => capability.missionMatches.map((match) => (
                  <AlignmentMatchCard
                    key={match.id}
                    href={`/missions/${match.missionArea.slug}`}
                    title={match.missionArea.name}
                    summary={match.alignmentSummary}
                    matchType={match.matchType}
                    confidence={match.confidence}
                    citations={match.citations}
                    className="border-0 bg-white"
                  />
                )))}
              </div>
            ) : null}
            {hasDemandMatches ? (
              <div className={hasMissionMatches ? "mt-3 space-y-3" : "space-y-3"}>
                {organization.capabilities.flatMap((capability) => capability.demandMatches.map((match) => (
                  <AlignmentMatchCard
                    key={match.id}
                    href={`/demand/${match.demandSlug}`}
                    title={match.demandTitle}
                    summary={match.alignmentSummary}
                    matchType={match.matchType}
                    confidence={match.confidence}
                    citations={match.citations}
                    caveat="Public-source alignment only; not eligibility or endorsement."
                    className="border-0 bg-white"
                  />
                )))}
              </div>
            ) : null}
            <p className="mt-4 text-xs leading-5 text-[var(--atlas-muted)]">{publicLanguage.demandCaveat}</p>
          </PublicCard> : null}

          <PublicCard id="evidence" title="What supports this profile" eyebrow={publicSourceCountLabel(new Set(citations.map((citation) => citation.sourceUrl)).size)} className="atlas-tonal-surface bg-[var(--atlas-blue-soft)]">
            <EvidenceList citations={citations} />
          </PublicCard>

          <NorthSignalInline placement="newsletter_inline_profile" trigger="profile_evidence_context" />
        </div>
      </div>
      <CollectionContinuation
        eyebrow="Carry the record forward"
        title="Save this organization for the conversation ahead."
        description="Keep the organization, its capabilities and supporting evidence together in a private Working List, or improve the public record."
        links={[
          { label: "View Working Lists", href: "/collections" },
          { label: "Suggest a correction", href: `/submit?submissionType=correction&targetType=organization&targetId=${organization.id}&returnTo=${encodeURIComponent(profilePath)}` }
        ]}
      />
    </PublicPageShell>
  );
}

function organizationKindLabelForMetadata(entityKind: string) {
  if (entityKind === "research_test_centre") return "Research and test centre";
  if (entityKind === "investor_funder") return "Investor and funder mandate";
  if (entityKind === "government_innovation_office") return "Government innovation mandate";
  return toTitleCase(entityKind);
}

function metadataDescription(description: string, primaryCapability?: string) {
  const combined = [description, primaryCapability].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  if (combined.length <= 190) return combined;
  const clipped = combined.slice(0, 187);
  const boundary = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, boundary > 120 ? boundary : 187).trim()}…`;
}

function organizationMandateForMetadata(profileData: Record<string, unknown>) {
  for (const key of ["mandate", "technicalMandate", "portfolioScope"]) {
    const value = profileData[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function conciseMetadataDescriptor(value: string | null) {
  if (!value) return null;
  if (value.length <= 72) return value;
  const shortened = value.slice(0, 72).replace(/\s+\S*$/, "").replace(/[.,;:!?]+$/, "");
  return shortened || value.slice(0, 72);
}

function ContactLink({ href, label, icon, external = false }: { href: string; label: string; icon: React.ReactNode; external?: boolean }) {
  return (
    <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="flex items-center justify-between gap-3 rounded-[12px] bg-white px-3 py-2.5 font-semibold text-[var(--atlas-ink-soft)] no-underline transition-colors hover:bg-[var(--atlas-ink)] hover:text-white hover:no-underline">
      <span className="min-w-0 truncate">{label}</span>
      <span className="shrink-0 text-[var(--atlas-evidence)]">{icon}</span>
    </a>
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
        {values.map((value) => <li key={value} className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-[var(--atlas-primary)]" />{value}</li>)}
      </ul>
    </div>
  );
}
