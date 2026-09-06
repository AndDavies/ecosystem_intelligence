import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  BookmarkPlus,
  Building2,
  Download,
  ExternalLink,
  Handshake,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Route
} from "lucide-react";
import { DossierEngagement } from "@/components/atlas/dossier-engagement";
import { DossierSectionNavigator } from "@/components/atlas/dossier-section-navigator";
import { ExploreNext } from "@/components/atlas/explore-next";
import { ExternalSourceLink, InternalLink } from "@/components/atlas/internal-link";
import { NorthSignalInline } from "@/components/atlas/north-signal-signup";
import { brandCopy } from "@/lib/brand-copy";
import { OrganizationMapPreview } from "@/components/atlas/organization-map-preview";
import { PublicPageShell } from "@/components/atlas/public-page-shell";
import { PublicShare } from "@/components/atlas/public-share";
import { JsonLd } from "@/components/seo/json-ld";
import {
  buildDossierSections,
  compactCanadianFootprint,
  organizationInitials
} from "@/lib/atlas/dossier-presentation";
import { projectAtlasMapOrganization } from "@/lib/atlas/explorer-projection";
import { getDossierRelatedIntelligence, type DossierRelatedIntelligence } from "@/lib/atlas/dossier-related";
import { canonicalOrganizationRelationshipEdge, type InternalLinkEdge } from "@/lib/atlas/internal-link-graph";
import { showsContextualNorthSignalSignup } from "@/lib/north-signal/contextual-placement";
import {
  organizationKindLabel,
  publicContactFromProfileData
} from "@/lib/atlas/presentation";
import { absoluteUrl } from "@/lib/site";
import { formatDate, toTitleCase } from "@/lib/utils";
import type { AtlasCapability, AtlasCitation, AtlasConfidence, AtlasDossierMediaAsset, AtlasOrganization } from "@/types/atlas";

type SourceGroupName = "Identity and profile" | "Technologies and services" | "Public record" | "Mission and Defence need";
type SourceEntry = AtlasCitation & { associations: string[]; groups: SourceGroupName[] };

export function ExecutiveOrganizationDossier({
  organization,
  mapReturnTo,
  profilePath,
  relatedIntelligence,
  trackEngagement = true
}: {
  organization: AtlasOrganization;
  mapReturnTo: string;
  profilePath: string;
  relatedIntelligence?: DossierRelatedIntelligence;
  trackEngagement?: boolean;
}) {
  const publicContact = publicContactFromProfileData(organization.profileData);
  const hasPublicContactPaths = Boolean(
    organization.websiteUrl
    || publicContact.contactPageUrl
    || publicContact.publicEmail
    || publicContact.publicPhone
    || publicContact.linkedInUrl
  );
  const missionConnections = organization.capabilities.flatMap((capability) => capability.missionMatches.map((match) => ({ capability, match })));
  const demandConnections = organization.capabilities.flatMap((capability) => capability.demandMatches.map((match) => ({ capability, match })));
  const hasConnections = missionConnections.length > 0 || demandConnections.length > 0;
  const hasBothConnectionTypes = missionConnections.length > 0 && demandConnections.length > 0;
  const hasPublicRecord = organization.programs.length > 0
    || organization.relationships.length > 0
    || organization.fundingEvents.length > 0;
  const sourceGroups = buildSourceGroups(organization);
  const sourceCount = new Set(sourceGroups.flatMap((group) => group.sources.map((source) => source.sourceUrl))).size;
  const hasMapPreview = Boolean(
    organization.primaryLocation
    && organization.primaryLocation.latitude !== null
    && organization.primaryLocation.longitude !== null
    && organization.primaryLocation.geographicConfidence !== "unverified"
  );
  const currentActivitySource = organization.citations.find((citation) => citation.fieldName === "current_activity") ?? null;
  const hasCurrentActivity = Boolean(
    organization.editorialProfile.currentActivity
    && organization.editorialProfile.currentActivityAsOf
    && currentActivitySource
  );
  const dossierSections = buildDossierSections({
    hasCurrentActivity,
    hasConnections,
    hasCapabilities: organization.capabilities.length > 0,
    hasPublicRecord,
    hasQuestions: organization.editorialProfile.reviewedQuestions.length > 0,
    hasSources: sourceCount > 0
  });

  return (
    <PublicPageShell
      variant="dossier"
      eyebrow={organizationKindLabel(organization.entityKind)}
      title={organization.name}
      breadcrumbs={[
        { label: "Map", href: mapReturnTo },
        { label: "Directory", href: "/organizations" },
        { label: organization.name }
      ]}
      pageHeader={<EditorialHeader organization={organization} profilePath={profilePath} />}
    >
      {trackEngagement ? <DossierEngagement organizationId={organization.id} /> : null}
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: organization.name,
          legalName: organization.legalName ?? undefined,
          url: absoluteUrl(`/organizations/${organization.slug}`),
          sameAs: organization.websiteUrl ? [organization.websiteUrl] : undefined,
          logo: organization.logo?.publicUrl,
          description: organization.description,
          knowsAbout: organization.capabilities.length ? organization.capabilities.map((capability) => capability.name) : undefined,
          address: organization.primaryLocation ? {
            "@type": "PostalAddress",
            addressLocality: organization.primaryLocation.city ?? undefined,
            addressRegion: organization.primaryLocation.provinceTerritory ?? undefined,
            addressCountry: "CA"
          } : undefined
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Ecosystem Map", item: absoluteUrl("/map") },
            { "@type": "ListItem", position: 2, name: "Directory", item: absoluteUrl("/organizations") },
            { "@type": "ListItem", position: 3, name: organization.name, item: absoluteUrl(`/organizations/${organization.slug}`) }
          ]
        }
      ]} />

      <DossierSectionNavigator sections={dossierSections} />
      {organization.editorialProfile.executiveRelevanceSummary ? (
        <DecisionSnapshot
          organization={organization}
          missionConnection={missionConnections[0] ?? null}
          demandConnection={demandConnections[0] ?? null}
          hasMoreConnections={hasConnections}
        />
      ) : null}
      <DossierExecutiveSummary organization={organization} />

      <article className="mt-6 space-y-7 sm:mt-8 sm:space-y-8 lg:mt-9 lg:space-y-10" data-public-dossier="true">
          {hasCurrentActivity && organization.editorialProfile.currentActivity && organization.editorialProfile.currentActivityAsOf && currentActivitySource ? (
            <section id="why-now" tabIndex={-1} className="atlas-tonal-surface atlas-tonal-signal w-full scroll-mt-28 px-5 py-8 outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-signal)] focus-visible:ring-offset-4 sm:py-8 lg:py-10" aria-labelledby="why-now-heading">
                <p className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-[var(--atlas-ink)]">Recent activity</p>
                <div className="mt-3 grid gap-5 lg:grid-cols-12 lg:gap-8">
                  <div className="lg:col-span-5">
                    <h2 id="why-now-heading" className="max-w-[20ch] font-[family-name:var(--font-barlow)] text-2xl font-extrabold leading-[1.06] tracking-[-0.04em] text-[var(--atlas-ink)] sm:text-3xl">Why this organization matters now</h2>
                    <p className="mt-3 text-[13px] font-semibold text-[var(--atlas-muted)]">Dated {formatDate(organization.editorialProfile.currentActivityAsOf)}</p>
                  </div>
                  <div className="lg:col-span-7 lg:border-l lg:border-[var(--atlas-border-strong)] lg:pl-8">
                    <p className="max-w-[72ch] text-base leading-8 text-[var(--atlas-ink-soft)] sm:text-[17px]">{organization.editorialProfile.currentActivity}</p>
                    <ExternalSourceLink href={currentActivitySource.sourceUrl} className="mt-4 min-h-11 items-center text-[14px] font-bold">Source: {currentActivitySource.sourceTitle}</ExternalSourceLink>
                  </div>
                </div>
            </section>
          ) : null}

          {hasConnections ? (
            <section id="connections" tabIndex={-1} className="atlas-open-section w-full scroll-mt-28 py-8 outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-signal)] focus-visible:ring-offset-4 sm:py-8 lg:py-10" aria-labelledby="connections-heading">
              <div>
                <p className="atlas-eyebrow">Reviewed assessment</p>
                <h2 id="connections-heading" className="mt-3 max-w-[19ch] font-[family-name:var(--font-barlow)] text-3xl font-extrabold leading-[1.04] tracking-[-0.045em] text-[var(--atlas-ink)] sm:text-4xl">Where this organization could contribute.</h2>
                <p className="mt-4 max-w-[78ch] text-base leading-8 text-[var(--atlas-muted)]">Follow the reviewed Mission area and Defence need connections to understand the problem this organization may help address, the public evidence behind the assessment, and what to verify before engagement.</p>
              </div>

              <div className="mt-8 grid gap-10 xl:grid-cols-12 xl:items-stretch xl:gap-12">
                {missionConnections.length ? (
                  <section className={`flex h-full flex-col border-t-4 border-[#B9D8E3] ${hasBothConnectionTypes ? "xl:col-span-6" : "xl:col-span-12"}`} aria-labelledby="mission-connections-heading">
                    <h3 id="mission-connections-heading" className="pt-4 text-[13px] font-extrabold uppercase tracking-[0.09em] text-[var(--atlas-ink)]">Mission areas</h3>
                    <div className="mt-2 flex-1 divide-y divide-[var(--atlas-border)]">
                    {missionConnections.map(({ capability, match }) => (
                      <ConnectionCard
                        key={match.id}
                        href={`/missions/${match.missionArea.slug}`}
                        title={match.missionArea.name}
                        capabilityName={capability.name}
                        summary={match.alignmentSummary}
                        confidence={match.confidence}
                        reviewedAt={capability.lastReviewedAt ?? organization.lastReviewedAt}
                        reviewedScope={capability.lastReviewedAt ? "Capability" : "Profile"}
                        action="mission_open"
                        targetId={match.missionArea.id}
                        targetType="mission_area"
                        targetLabel="Open Mission area"
                      />
                    ))}
                    </div>
                  </section>
                ) : null}
                {demandConnections.length ? (
                  <section className={`flex h-full flex-col border-t-4 border-[var(--atlas-signal)] ${hasBothConnectionTypes ? "xl:col-span-6" : "xl:col-span-12"}`} aria-labelledby="public-need-connections-heading">
                    <h3 id="public-need-connections-heading" className="pt-4 text-[13px] font-extrabold uppercase tracking-[0.09em] text-[var(--atlas-ink)]">Released Defence needs</h3>
                    <div className="mt-2 flex-1 divide-y divide-[var(--atlas-border)]">
                    {demandConnections.map(({ capability, match }) => (
                      <ConnectionCard
                        key={match.id}
                        href={`/demand/${match.demandSlug}`}
                        title={match.demandTitle}
                        capabilityName={capability.name}
                        summary={match.alignmentSummary}
                        confidence={match.confidence}
                        reviewedAt={capability.lastReviewedAt ?? organization.lastReviewedAt}
                        reviewedScope={capability.lastReviewedAt ? "Capability" : "Profile"}
                        action="public_need_open"
                        targetId={match.demandRequirementId}
                        targetType="public_need"
                        targetLabel="Open Defence need"
                      />
                    ))}
                    </div>
                  </section>
                ) : null}
              </div>
              <p className="mt-7 max-w-[82ch] border-t border-[var(--atlas-border)] pt-5 text-[13px] font-semibold leading-6 text-[var(--atlas-muted)]">Reviewed connections indicate possible relevance based on public evidence. They do not indicate procurement direction, eligibility, endorsement or customer interest.</p>
            </section>
          ) : null}

          {organization.capabilities.length ? (
            <section id="capabilities" tabIndex={-1} className="atlas-open-section w-full scroll-mt-28 py-8 outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-signal)] focus-visible:ring-offset-4 sm:py-8 lg:py-10" aria-labelledby="capabilities-heading">
              <div className="grid gap-5 lg:grid-cols-12 lg:gap-10">
                <div className="lg:col-span-4">
                  <h2 id="capabilities-heading" className="max-w-[18ch] font-[family-name:var(--font-barlow)] text-3xl font-extrabold leading-[1.04] tracking-[-0.045em] text-[var(--atlas-ink)] sm:text-4xl">Technologies and services</h2>
                </div>
                <p className="max-w-[70ch] text-[17px] leading-8 text-[var(--atlas-muted)] lg:col-span-8 lg:pt-7">A closer look at the products, services, operating features, and documented applications that shape the organization’s role.</p>
              </div>
              <div className="mt-8 divide-y divide-[var(--atlas-border)] border-y border-[var(--atlas-border)]">
                {organization.capabilities.map((capability) => (
                  <CapabilityRow key={capability.id} capability={capability} mapReturnTo={mapReturnTo} organizationId={organization.id} />
                ))}
              </div>
            </section>
          ) : null}

          {hasPublicRecord ? (
            <section id="public-record" tabIndex={-1} className="atlas-open-section w-full scroll-mt-28 py-8 outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-signal)] focus-visible:ring-offset-4 sm:py-8 lg:py-10" aria-labelledby="public-record-heading">
              <div className="grid gap-5 lg:grid-cols-12 lg:gap-10">
                <div className="lg:col-span-4">
                  <p className="atlas-eyebrow">Public record</p>
                  <h2 id="public-record-heading" className="mt-3 max-w-[18ch] font-[family-name:var(--font-barlow)] text-3xl font-extrabold leading-[1.04] tracking-[-0.045em] text-[var(--atlas-ink)] sm:text-4xl">Public programs and contracts</h2>
                </div>
                <p className="max-w-[70ch] text-[17px] leading-8 text-[var(--atlas-muted)] lg:col-span-8 lg:pt-7">Dated participation, delivery roles, partnerships, and disclosed funding provide the operating context behind the profile.</p>
              </div>

              {(organization.programs.length || organization.relationships.length || organization.fundingEvents.length) ? (
                <div className="mt-8 border-y border-[var(--atlas-border)] py-7 sm:py-8">
                  {organization.programs.length ? <ProgramTimeline organization={organization} /> : null}
                  {(organization.relationships.length || organization.fundingEvents.length) ? (
                    <div className={`${organization.programs.length ? "mt-9 border-t border-[var(--atlas-border)] pt-8" : ""} grid gap-5 ${organization.relationships.length && organization.fundingEvents.length ? "lg:grid-cols-2" : ""}`}>
                      {organization.relationships.length ? <RelationshipList organization={organization} /> : null}
                      {organization.fundingEvents.length ? <FundingList organization={organization} /> : null}
                    </div>
                  ) : null}
                </div>
              ) : null}

            </section>
          ) : null}

          {organization.editorialProfile.reviewedQuestions.length ? (
            <section id="questions" tabIndex={-1} className="atlas-open-section w-full scroll-mt-28 py-8 outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-signal)] focus-visible:ring-offset-4 sm:py-8 lg:py-10" aria-labelledby="conversation-questions-heading">
              <p className="atlas-eyebrow">Prepare the conversation</p>
              <h2 id="conversation-questions-heading" className="mt-3 font-[family-name:var(--font-barlow)] text-2xl font-extrabold tracking-[-0.035em] text-[var(--atlas-ink)] sm:text-3xl">Questions for a first conversation</h2>
              <ol className="mt-6 divide-y divide-[var(--atlas-border)]">
                {organization.editorialProfile.reviewedQuestions.map((question, index) => (
                  <li key={question.id} className="grid gap-3 py-5 first:pt-0 last:pb-0 sm:grid-cols-[42px_minmax(0,1fr)]">
                    <span aria-hidden="true" className="font-[family-name:var(--font-barlow)] text-xl font-extrabold text-[var(--atlas-primary)]">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="text-base font-bold leading-7 text-[var(--atlas-ink)] sm:text-[17px]">{question.question}</p>
                      <p className="mt-2 max-w-[72ch] text-[15px] leading-7 text-[var(--atlas-muted)]">{question.context}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {organization.primaryLocation ? (
            <section
              id="geography"
              tabIndex={-1}
              className={`atlas-tonal-surface atlas-tonal-paper w-full scroll-mt-28 outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-signal)] focus-visible:ring-offset-4 ${hasMapPreview ? "overflow-hidden" : "px-5 py-7 sm:px-8 sm:py-8 lg:px-10"}`}
              aria-labelledby="geography-heading"
            >
              {hasMapPreview ? (
                <div className="grid lg:grid-cols-12">
                  <div className="relative min-h-[220px] overflow-hidden bg-[var(--atlas-surface-muted)] lg:col-span-4 lg:min-h-[260px]">
                    <OrganizationMapPreview organization={projectAtlasMapOrganization(organization)} />
                  </div>
                  <div className="px-5 py-7 sm:px-8 sm:py-8 lg:col-span-8 lg:px-10">
                    <p className="atlas-eyebrow">Geography</p>
                    <h2 id="geography-heading" className="mt-3 max-w-[17ch] font-[family-name:var(--font-barlow)] text-3xl font-extrabold leading-[1.04] tracking-[-0.045em] text-[var(--atlas-ink)] sm:text-4xl">{organization.primaryLocation.name}</h2>
                    <p className="mt-5 max-w-[72ch] text-base leading-8 text-[var(--atlas-ink-soft)] sm:text-[17px]">{locationContext(organization)}</p>
                    <GeographyMapLink mapReturnTo={mapReturnTo} organizationId={organization.id} />
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-12 lg:gap-10">
                  <div className="lg:col-span-4">
                    <p className="atlas-eyebrow">Geography</p>
                    <h2 id="geography-heading" className="mt-3 max-w-[17ch] font-[family-name:var(--font-barlow)] text-3xl font-extrabold leading-[1.04] tracking-[-0.045em] text-[var(--atlas-ink)] sm:text-4xl">{organization.primaryLocation.name}</h2>
                  </div>
                  <div className="lg:col-span-8 lg:border-l lg:border-[var(--atlas-border-strong)] lg:pl-10">
                    <p className="max-w-[72ch] text-base leading-8 text-[var(--atlas-ink-soft)] sm:text-[17px]">{locationContext(organization, false)}</p>
                    <GeographyMapLink mapReturnTo={mapReturnTo} organizationId={organization.id} />
                  </div>
                </div>
              )}
            </section>
          ) : null}

          {sourceCount ? (
            <section id="sources" tabIndex={-1} className="atlas-open-section w-full scroll-mt-28 py-8 outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-signal)] focus-visible:ring-offset-4 sm:py-8 lg:py-10" aria-labelledby="sources-heading">
              <div className="grid gap-6 lg:grid-cols-12 lg:gap-10">
                <div className="lg:col-span-7">
                  <p className="atlas-eyebrow">Source library</p>
                  <h2 id="sources-heading" className="mt-3 font-[family-name:var(--font-barlow)] text-3xl font-extrabold leading-[1.04] tracking-[-0.045em] text-[var(--atlas-ink)] sm:text-4xl">Sources behind this profile</h2>
                  <p className="mt-4 max-w-[66ch] text-base leading-7 text-[var(--atlas-muted)]">Open the original record, then expand the source details to see which parts of the dossier it informs.</p>
                  <p className="mt-4 text-[13px] font-semibold text-[var(--atlas-muted)]">{brandCopy.trustCompact}</p>
                </div>
                <div className="grid content-start gap-4 border-t border-[var(--atlas-border-strong)] pt-5 text-sm sm:grid-cols-2 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                  <ProfileFact label="Public sources" value={sourceCount} />
                  <ProfileFact label="Last reviewed" value={organization.lastReviewedAt ? formatDate(organization.lastReviewedAt) : null} />
                </div>
              </div>
              <div className="mt-8 space-y-7">
                {sourceGroups.map((group) => (
                  <section key={group.name}>
                    <h3 className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-[var(--atlas-ink)]">{group.name}</h3>
                    <ul className="mt-3 divide-y divide-[var(--atlas-border)] border-y border-[var(--atlas-border)]">
                      {group.sources.map((source) => <SourceRow key={source.sourceUrl} source={source} />)}
                    </ul>
                  </section>
                ))}
              </div>
            </section>
          ) : null}

          <section id="contact" tabIndex={-1} className="scroll-mt-28 bg-[var(--atlas-ink)] px-5 py-8 text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-signal)] focus-visible:ring-offset-4 sm:py-8 lg:py-10" aria-labelledby="contact-heading">
            <div className={`grid gap-8 lg:items-end lg:gap-10 ${hasPublicContactPaths ? "lg:grid-cols-12" : ""}`}>
              <div className={hasPublicContactPaths ? "lg:col-span-7" : "max-w-4xl"}>
                <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--atlas-signal)]">Move into a better-informed conversation</p>
                <h2 id="contact-heading" className="mt-3 max-w-[18ch] font-[family-name:var(--font-barlow)] text-3xl font-extrabold leading-[1.04] tracking-[-0.045em] text-white sm:text-4xl">Take this dossier into the next conversation.</h2>
                <p className="mt-4 max-w-[68ch] text-base leading-8 text-white/75 sm:text-[17px]">Save the organization and its public record in a private Shortlist, then request a human-routed introduction when the fit is specific enough to discuss.</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link href={`/collections?addType=organization&addId=${organization.id}&returnTo=${encodeURIComponent(profilePath)}`} className="atlas-signal-button h-12 gap-2 px-5 text-sm"><BookmarkPlus className="size-4" aria-hidden="true" />Add to shortlist</Link>
                  <Link href={`/connect/${organization.slug}`} className="inline-flex h-12 items-center gap-2 rounded-full border border-white/30 px-4 text-sm font-bold text-white no-underline hover:bg-white/10 hover:no-underline"><Handshake className="size-4" aria-hidden="true" />Request an introduction</Link>
                </div>
                {!hasPublicContactPaths ? <p className="mt-5 text-[13px] leading-6 text-white/65">Only official, source-supported contact paths are shown. True North Map does not expose private contact information or imply endorsement.</p> : null}
              </div>
              {hasPublicContactPaths ? <div className="space-y-2 text-sm lg:col-span-5">
                {organization.websiteUrl ? <ContactLink href={organization.websiteUrl} label="Official website" icon={<ExternalLink className="size-4" />} external /> : null}
                {publicContact.contactPageUrl ? <ContactLink href={publicContact.contactPageUrl} label="Official contact page" icon={<ArrowRight className="size-4" />} external /> : null}
                {publicContact.publicEmail ? <ContactLink href={`mailto:${publicContact.publicEmail}`} label={publicContact.publicEmail} icon={<Mail className="size-4" />} /> : null}
                {publicContact.publicPhone ? <ContactLink href={`tel:${publicContact.publicPhone}`} label={publicContact.publicPhone} icon={<Phone className="size-4" />} /> : null}
                {publicContact.linkedInUrl ? <ContactLink href={publicContact.linkedInUrl} label="Official LinkedIn" icon={<Linkedin className="size-4" />} external /> : null}
                <p className="pt-2 text-[13px] leading-6 text-white/65">Only official, source-supported contact paths are shown. True North Map does not expose private contact information or imply endorsement.</p>
              </div> : null}
            </div>
          </section>

          <section id="related" tabIndex={-1} className="atlas-open-section w-full scroll-mt-28 py-8 outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-signal)] focus-visible:ring-offset-4 sm:py-8 lg:py-10" aria-labelledby="related-heading">
            <div className="grid gap-5 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-4">
                <p className="atlas-eyebrow">Continue exploring</p>
                <h2 id="related-heading" className="mt-3 max-w-[18ch] font-[family-name:var(--font-barlow)] text-3xl font-extrabold leading-[1.04] tracking-[-0.045em] text-[var(--atlas-ink)] sm:text-4xl">Related intelligence</h2>
              </div>
              <p className="max-w-[68ch] text-[17px] leading-8 text-[var(--atlas-muted)] lg:col-span-8 lg:pt-7">Follow the most useful map and editorial pathways connected to this profile.</p>
            </div>
            <Suspense fallback={null}>
              <RelatedIntelligenceLoader organization={organization} relatedIntelligence={relatedIntelligence} />
            </Suspense>
          </section>

          {showsContextualNorthSignalSignup("organization", organization.slug) ? <NorthSignalInline placement="newsletter_inline_profile" trigger="profile_after_evidence" className="w-full" /> : null}
      </article>
    </PublicPageShell>
  );
}

function DossierExecutiveSummary({ organization }: { organization: AtlasOrganization }) {
  const narrativeBlocks = [
    organization.editorialProfile.operatingContext ? {
      label: "Operating context",
      text: organization.editorialProfile.operatingContext
    } : null,
    organization.editorialProfile.canadianFootprint ? {
      label: "Canadian footprint",
      text: organization.editorialProfile.canadianFootprint
    } : null
  ].filter((item): item is { label: string; text: string } => Boolean(item));
  const snapshotFacts = [
    { label: "Organization type", value: organizationKindLabel(organization.entityKind) },
    { label: "Primary location", value: organization.primaryLocation?.name },
    { label: "Canadian footprint", value: compactCanadianFootprint(organization) },
    { label: "Founded", value: organization.foundedYear },
    { label: "Ownership", value: organization.ownership },
    { label: "Last reviewed", value: organization.lastReviewedAt ? formatDate(organization.lastReviewedAt) : null }
  ].filter((fact) => fact.value !== null && fact.value !== undefined && fact.value !== "");

  return (
    <section id="profile" tabIndex={-1} className="mt-6 scroll-mt-28 outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-signal)] focus-visible:ring-offset-4 sm:mt-8 lg:mt-9" aria-labelledby={narrativeBlocks.length ? "profile-heading" : "snapshot-heading"}>
      <div className={narrativeBlocks.length ? "grid gap-6 lg:grid-cols-12 lg:items-stretch lg:gap-8" : ""}>
        {narrativeBlocks.length ? (
          <div className="atlas-open-section py-8 sm:py-8 lg:col-span-7 lg:h-full lg:py-8 xl:col-span-8">
            <p className="atlas-eyebrow">Organization context</p>
            <h2 id="profile-heading" className="mt-3 font-[family-name:var(--font-barlow)] text-3xl font-extrabold leading-[1.04] tracking-[-0.045em] text-[var(--atlas-ink)] sm:text-4xl">What the organization does</h2>
            <div className="mt-6 divide-y divide-[var(--atlas-border)]">
              {narrativeBlocks.map((block) => (
                <section key={block.label} className="py-5 first:pt-0 last:pb-0">
                  <h3 className="text-[13px] font-extrabold uppercase tracking-[0.09em] text-[var(--atlas-muted)]">{block.label}</h3>
                  <p className="mt-3 max-w-[72ch] text-base leading-8 text-[var(--atlas-ink-soft)] sm:text-[17px]">{block.text}</p>
                </section>
              ))}
            </div>
          </div>
        ) : null}

        <aside className={`${narrativeBlocks.length ? "lg:col-span-5 xl:col-span-4" : "w-full"} atlas-open-section py-8 sm:py-8 lg:h-full lg:px-8 lg:py-10`} aria-labelledby="snapshot-heading">
          <p className="atlas-eyebrow">Profile facts</p>
          <h2 id="snapshot-heading" className="mt-3 font-[family-name:var(--font-barlow)] text-2xl font-extrabold tracking-[-0.035em] text-[var(--atlas-ink)] sm:text-3xl">At a glance</h2>
          <dl className="mt-6 grid gap-x-7 sm:grid-cols-2">
            {snapshotFacts.slice(0, 6).map((fact) => <SnapshotFact key={fact.label} label={fact.label} value={fact.value} />)}
          </dl>
        </aside>
      </div>
    </section>
  );
}

function DecisionSnapshot({
  organization,
  missionConnection,
  demandConnection,
  hasMoreConnections
}: {
  organization: AtlasOrganization;
  missionConnection: { capability: AtlasCapability; match: AtlasCapability["missionMatches"][number] } | null;
  demandConnection: { capability: AtlasCapability; match: AtlasCapability["demandMatches"][number] } | null;
  hasMoreConnections: boolean;
}) {
  const summary = organization.editorialProfile.executiveRelevanceSummary;
  if (!summary) return null;
  return (
    <section className="mt-6 border-y border-[var(--atlas-border)] bg-[var(--atlas-blue-soft)] px-5 py-7 sm:mt-8 sm:py-8 lg:mt-9 lg:px-10" aria-labelledby="decision-snapshot-heading">
      <p className="atlas-eyebrow">Decision snapshot</p>
      <div className="mt-3 grid gap-7 lg:grid-cols-12 lg:gap-10">
        <div className={missionConnection || demandConnection ? "lg:col-span-7" : "lg:col-span-12"}>
          <h2 id="decision-snapshot-heading" className="max-w-[22ch] font-[family-name:var(--font-barlow)] text-3xl font-extrabold leading-[1.04] tracking-[-0.045em] text-[var(--atlas-ink)] sm:text-4xl">Why this organization may be worth examining</h2>
          <p className="mt-5 max-w-[74ch] text-base leading-8 text-[var(--atlas-ink-soft)] sm:text-[17px]">{summary}</p>
          {hasMoreConnections ? <a href="#connections" className="mt-5 inline-flex min-h-11 items-center gap-2 text-[14px] font-bold text-[var(--atlas-primary)] underline decoration-[var(--atlas-signal)] decoration-2 underline-offset-4 hover:decoration-[var(--atlas-ink)]">See all reviewed connections <ArrowRight className="size-4" aria-hidden="true" /></a> : null}
        </div>
        {missionConnection || demandConnection ? (
          <div className="divide-y divide-[var(--atlas-border-strong)] border-y border-[var(--atlas-border-strong)] lg:col-span-5 lg:border-l lg:border-y-0 lg:pl-8">
            {missionConnection ? <DecisionConnectionPreview label="Mission area" title={missionConnection.match.missionArea.name} summary={missionConnection.match.alignmentSummary} href={`/missions/${missionConnection.match.missionArea.slug}`} /> : null}
            {demandConnection ? <DecisionConnectionPreview label="Released Defence need" title={demandConnection.match.demandTitle} summary={demandConnection.match.alignmentSummary} href={`/demand/${demandConnection.match.demandSlug}`} /> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function DecisionConnectionPreview({ label, title, summary, href }: { label: string; title: string; summary: string; href: string }) {
  return (
    <article className="py-5 first:pt-0 last:pb-0">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.09em] text-[var(--atlas-muted)]">{label}</p>
      <h3 className="mt-2 text-lg font-extrabold tracking-[-0.02em] text-[var(--atlas-ink)]"><Link href={href} data-internal-link-role="contextual" data-internal-link-module="organization_connection_preview" className="underline decoration-[var(--atlas-signal)] decoration-2 underline-offset-4 hover:decoration-[var(--atlas-ink)]">{title}</Link></h3>
      <p className="mt-2 line-clamp-3 text-[14px] leading-6 text-[var(--atlas-muted)]">{summary}</p>
    </article>
  );
}

function OrganizationIdentityMark({ organization }: { organization: AtlasOrganization }) {
  const initials = organizationInitials(organization.name);
  return (
    <span className="atlas-dossier-logo relative flex shrink-0 items-center justify-center text-[var(--atlas-ink)]">
      {organization.logo ? (
        <Image src={organization.logo.publicUrl} alt={`${organization.name} logo`} fill sizes="(min-width: 1024px) 180px, 96px" priority className="object-contain" />
      ) : initials ? (
        <span aria-hidden="true" className="font-[family-name:var(--font-barlow)] text-xl font-extrabold tracking-[-0.04em] sm:text-2xl">{initials}</span>
      ) : (
        <Building2 className="size-6 text-[var(--atlas-muted)] sm:size-7" aria-hidden="true" />
      )}
    </span>
  );
}

function EditorialHeader({ organization, profilePath }: { organization: AtlasOrganization; profilePath: string }) {
  const heroMedia = selectHeroMedia(organization.mediaAssets);
  const documentedCapability = organization.capabilities.length === 1
    ? organization.capabilities[0].capabilityType ?? organization.capabilities[0].name
    : null;

  return (
    <header className="atlas-profile-header mt-7">
      <div className="grid gap-8 py-8 lg:grid-cols-12 lg:gap-12 lg:py-10">
        <div className="min-w-0 lg:col-span-8">
          <div className="atlas-dossier-identity">
            <OrganizationIdentityMark organization={organization} />
            <div className="min-w-0">
              <span className="block h-1 w-12 bg-[var(--atlas-signal)]" aria-hidden="true" />
              <p className="mt-4 text-[12px] font-extrabold uppercase tracking-[0.12em] text-[var(--atlas-ink)]">{organizationKindLabel(organization.entityKind)}</p>
              <h1 className="mt-3 max-w-[18ch] break-words font-[family-name:var(--font-barlow)] text-[42px] font-extrabold leading-[0.98] tracking-[-0.035em] text-[var(--atlas-ink)] [overflow-wrap:anywhere] sm:text-[52px] xl:text-[60px]">{organization.name}</h1>
              {organization.primaryLocation ? <p className="mt-4 flex items-center gap-2 text-[14px] font-semibold text-[var(--atlas-muted)]"><MapPin className="size-4 shrink-0" aria-hidden="true" /><span>{organization.primaryLocation.name}</span></p> : null}
          {documentedCapability ? <p className="mt-5 max-w-[64ch] border-l-2 border-[var(--atlas-signal)] pl-4 text-[15px] font-semibold leading-7 text-[var(--atlas-ink)]"><span className="text-[var(--atlas-muted)]">What they offer:</span> {documentedCapability}</p> : null}
          <p className="mt-5 max-w-[72ch] text-base leading-8 text-[var(--atlas-ink-soft)] sm:text-[17px]">{organization.description}</p>
          {organization.lastReviewedAt ? <p className="mt-5 border-t border-[var(--atlas-border)] pt-4 text-[13px] font-semibold leading-6 text-[var(--atlas-muted)]">Last reviewed {formatDate(organization.lastReviewedAt)}</p> : null}
            </div>
          </div>
          {heroMedia ? <DossierActions organization={organization} profilePath={profilePath} mode="inline" /> : null}
        </div>

        <div className="min-w-0 lg:col-span-4">
          {heroMedia ? <DossierHeroMedia media={heroMedia} organizationName={organization.name} /> : <DossierActions organization={organization} profilePath={profilePath} mode="panel" />}
        </div>
      </div>
    </header>
  );
}

function DossierActions({ organization, profilePath, mode }: { organization: AtlasOrganization; profilePath: string; mode: "panel" | "inline" }) {
  return (
    <div className={mode === "panel" ? "atlas-dossier-actions border-l-2 border-[var(--atlas-border-strong)] pl-5 sm:pl-7" : "atlas-dossier-actions mt-7 border-t border-[var(--atlas-border)] pt-5"}>
      <p className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-[var(--atlas-ink)]">Next actions</p>
      <div className={`${mode === "inline" ? "sm:grid-cols-2 lg:max-w-2xl" : ""} mt-4 grid gap-2`}>
        <Link href={`/collections?addType=organization&addId=${organization.id}&returnTo=${encodeURIComponent(profilePath)}`} className="atlas-signal-button h-12 gap-2 px-5 text-sm"><BookmarkPlus className="size-4" aria-hidden="true" />Add to shortlist</Link>
        <Link href={`/connect/${organization.slug}`} className="atlas-secondary-button h-12 gap-2 px-4 text-sm"><Handshake className="size-4" aria-hidden="true" />Request an introduction</Link>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-1 gap-y-1 border-t border-[var(--atlas-border)] pt-3">
        <Link href={`/api/export?type=organization-dossier&slug=${organization.slug}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-[12px] px-2.5 text-[13px] font-semibold text-[var(--atlas-muted)] no-underline hover:bg-white hover:text-[var(--atlas-ink)] hover:no-underline">Download profile <Download className="size-3.5" aria-hidden="true" /></Link>
        <PublicShare title={organization.name} description={organization.description} path={`/organizations/${organization.slug}`} className="!h-11 !min-h-11 !rounded-full !border-0 !bg-transparent !px-2.5 !text-[13px] !font-semibold !text-[var(--atlas-link)] hover:!bg-white hover:!text-[var(--atlas-ink)]" />
        {organization.websiteUrl ? <ExternalSourceLink href={organization.websiteUrl} variant="plain" className="min-h-11 items-center rounded-[12px] px-2.5 text-[13px] font-semibold text-[var(--atlas-muted)] no-underline hover:bg-white hover:text-[var(--atlas-ink)] hover:no-underline">Visit website</ExternalSourceLink> : null}
        <Link href="/collections" className="inline-flex min-h-11 items-center rounded-[12px] px-2.5 text-[13px] font-semibold text-[var(--atlas-muted)] no-underline hover:bg-white hover:text-[var(--atlas-ink)] hover:no-underline">My shortlists</Link>
      </div>
    </div>
  );
}

type HeroMediaAsset = AtlasDossierMediaAsset & { publicUrl: string; altText: string };

function DossierHeroMedia({ media, organizationName }: { media: HeroMediaAsset; organizationName: string }) {
  return (
    <figure>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] bg-[var(--atlas-surface-muted)]">
        <Image src={media.publicUrl} alt={media.altText} fill sizes="(min-width: 1024px) 32vw, 100vw" priority className="object-cover" />
      </div>
      {media.attributionText || media.sourceUrl ? (
        <figcaption className="mt-3 text-[12px] leading-5 text-[var(--atlas-muted)]">
          {media.attributionText ?? `${organizationName} profile image`}
          {media.sourceUrl ? <> · <ExternalSourceLink href={media.sourceUrl} className="min-h-11 items-center font-semibold">Image source</ExternalSourceLink></> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}

function ConnectionCard({ href, title, capabilityName, summary, confidence, reviewedAt, reviewedScope, action, targetId, targetType, targetLabel }: {
  href: string; title: string; capabilityName: string; summary: string; confidence: AtlasConfidence; reviewedAt: string | null;
  reviewedScope: "Capability" | "Profile"; action: "mission_open" | "public_need_open"; targetId: string; targetType: "mission_area" | "public_need"; targetLabel: string;
}) {
  return (
    <article className="group relative -mx-3 rounded-[12px] px-3 py-6 transition-colors first:pt-4 last:pb-4 hover:bg-[var(--atlas-blue-soft)] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--atlas-primary)]">
      <p className="text-[12px] font-bold uppercase tracking-[0.07em] text-[var(--atlas-muted)]">Contributing capability</p>
      <p className="mt-1 text-[14px] font-bold leading-6 text-[var(--atlas-ink-soft)]">{capabilityName}</p>
      <h4 className="mt-3 text-lg font-extrabold tracking-[-0.02em] text-[var(--atlas-ink)] sm:text-xl"><Link href={href} aria-label={`${targetLabel}: ${title}`} data-profile-action={action} data-profile-target-id={targetId} data-profile-target-type={targetType} data-profile-section="connections" className="inline-flex min-h-11 items-center underline decoration-[var(--atlas-signal)] decoration-2 underline-offset-4 after:absolute after:inset-0 after:rounded-[12px] after:content-[''] focus-visible:outline-none group-hover:decoration-[var(--atlas-ink)]">{title}</Link></h4>
      <p className="mt-3 max-w-[72ch] text-base leading-7 text-[var(--atlas-ink-soft)]">{summary}</p>
      <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[13px] font-semibold text-[var(--atlas-muted)]"><span>Evidence strength: {toTitleCase(confidence)}</span>{reviewedAt ? <span>{reviewedScope} last reviewed {formatDate(reviewedAt)}</span> : null}</p>
      <span className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-[13px] font-bold text-[var(--atlas-primary)] underline decoration-[var(--atlas-signal)] decoration-2 underline-offset-4">{targetLabel}<ArrowRight className="size-3.5" aria-hidden="true" /></span>
    </article>
  );
}

function CapabilityRow({ capability, mapReturnTo, organizationId }: { capability: AtlasCapability; mapReturnTo: string; organizationId: string }) {
  const visibleFeatures = capability.coreFeatures.slice(0, 3);
  const additionalFeatures = capability.coreFeatures.slice(3);
  const hasTechnicalDetail = capability.defenceApplications.length > 0 || additionalFeatures.length > 0;
  const operatingFacts = [
    capability.maturity ? { label: "Maturity", value: capability.maturity } : null,
    capability.commercialAvailability ? { label: "Availability", value: capability.commercialAvailability } : null,
    capability.technologyReadinessLevel !== null ? { label: "Readiness", value: `TRL ${capability.technologyReadinessLevel}` } : null
  ].filter((item): item is { label: string; value: string } => Boolean(item));
  const hasOperatingContext = operatingFacts.length > 0 || visibleFeatures.length > 0 || hasTechnicalDetail;

  return (
    <article className="grid gap-7 py-8 sm:py-9 lg:grid-cols-12 lg:gap-10">
      <div className={`min-w-0 ${hasOperatingContext ? "lg:col-span-7 xl:col-span-8" : "lg:col-span-12"}`}>
        {capability.capabilityType ? <p className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-[var(--atlas-muted)]">{capability.capabilityType}</p> : null}
        <h3 className="mt-2 text-xl font-extrabold tracking-[-0.025em] text-[var(--atlas-ink)] sm:text-2xl">{capability.name}</h3>
        <div className="mt-5">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-[var(--atlas-muted)]">What it enables</p>
          <p className="mt-2 max-w-[72ch] text-base leading-8 text-[var(--atlas-ink-soft)] sm:text-[17px]">{capability.summary}</p>
        </div>
        {capability.technicalDomains.length ? (
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-semibold">
            <span className="text-[var(--atlas-muted)]">Domains</span>
            {capability.technicalDomains.map((domain) => <Link key={domain.id} href={`/map?domain=${domain.slug}&selected=${organizationId}`} data-internal-link-role="contextual" data-internal-link-module="organization_capability_domain" className="inline-flex min-h-11 items-center text-[var(--atlas-primary)] underline decoration-[var(--atlas-signal)] decoration-2 underline-offset-4 hover:decoration-[var(--atlas-ink)]">{domain.name}</Link>)}
          </div>
        ) : null}
        <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[13px] font-semibold text-[var(--atlas-muted)]"><span>Evidence strength: {toTitleCase(capability.sourceConfidence)}</span>{capability.lastReviewedAt ? <span>Last reviewed {formatDate(capability.lastReviewedAt)}</span> : null}</p>
        <Link href={`/capabilities/${capability.slug}?returnTo=${encodeURIComponent(mapReturnTo)}`} data-internal-link-role="contextual" data-internal-link-module="organization_owned_capability" className="mt-4 inline-flex min-h-11 items-center gap-2 text-[14px] font-bold text-[var(--atlas-primary)] underline decoration-[var(--atlas-signal)] decoration-2 underline-offset-4 hover:decoration-[var(--atlas-ink)]">Explore {capability.name} <ArrowRight className="size-4" aria-hidden="true" /></Link>
      </div>

      {hasOperatingContext ? <div className="min-w-0 border-t border-[var(--atlas-border)] pt-6 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0 xl:col-span-4">
        <p className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-[var(--atlas-muted)]">Operating context</p>
        {operatingFacts.length ? <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">{operatingFacts.map((fact) => <ProfileFact key={fact.label} label={fact.label} value={fact.value} />)}</div> : null}
        {visibleFeatures.length ? <DecisionList label="Decision-useful features" values={visibleFeatures} /> : null}
        {hasTechnicalDetail ? (
          <details className="mt-3 text-[13px] text-[var(--atlas-muted)]">
            <summary className="flex min-h-11 cursor-pointer items-center rounded-[8px] font-semibold text-[var(--atlas-primary)]">Technical detail and applications</summary>
            <div className="mt-1 space-y-4 border-l-2 border-[var(--atlas-border-strong)] pl-3 leading-6">
              {capability.defenceApplications.length ? <p><strong className="font-bold text-[var(--atlas-ink)]">Documented applications. </strong>{capability.defenceApplications.join(" · ")}</p> : null}
              {additionalFeatures.length ? <ul className="space-y-1.5">{additionalFeatures.map((feature) => <li key={feature}>{feature}</li>)}</ul> : null}
            </div>
          </details>
        ) : null}
      </div> : null}
    </article>
  );
}

function GeographyMapLink({ mapReturnTo, organizationId }: { mapReturnTo: string; organizationId: string }) {
  return (
    <Link
      href={selectedMapHref(mapReturnTo, organizationId)}
      data-profile-action="map_open"
      data-profile-target-id={organizationId}
      data-profile-target-type="map"
      data-profile-section="geography"
      className="atlas-primary-button mt-6 inline-flex h-11 gap-2 px-4 text-sm"
    >
      Open in the ecosystem map <Route className="size-4" aria-hidden="true" />
    </Link>
  );
}

function ProgramTimeline({ organization }: { organization: AtlasOrganization }) {
  return (
    <div>
      <h3 className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-[var(--atlas-ink)]">Programs and deployments</h3>
      <ol className="relative mt-4 space-y-0 border-l border-[var(--atlas-border-strong)] pl-6">
        {organization.programs.map((participation, index) => (
          <li key={participation.id} className="relative pb-7 last:pb-0">
            <span className="absolute -left-[29px] top-1.5 size-2.5 rounded-full bg-[var(--atlas-evidence)] ring-4 ring-[var(--atlas-tonal-paper)]" />
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><h4 className="text-lg font-extrabold tracking-[-0.02em] text-[var(--atlas-ink)]">{participation.programName}</h4><p className="mt-1 text-[13px] font-semibold text-[var(--atlas-primary)]">{participation.participationType}{participation.cohortLabel ? ` · ${participation.cohortLabel}` : ""}</p>{participation.programOperatorName ? <p className="mt-1 text-[13px] text-[var(--atlas-muted)]">Sponsor or operator: {participation.programOperatorName}</p> : null}</div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">{participation.lifecycleStage ? <span className="font-semibold text-[var(--atlas-ink-soft)]">{toTitleCase(participation.lifecycleStage)}</span> : null}{participation.lifecycleStage && participation.announcedOn ? <span aria-hidden="true" className="text-[var(--atlas-border-strong)]">·</span> : null}{participation.announcedOn ? <span className="text-[var(--atlas-muted)]">{formatDate(participation.announcedOn)}</span> : null}</div>
            </div>
            {participation.publicSummary ? <p className="mt-3 max-w-[72ch] text-base leading-7 text-[var(--atlas-ink-soft)]"><strong className="font-semibold text-[var(--atlas-ink)]">Organization role. </strong>{participation.publicSummary}</p> : null}
            {participation.programSummary ? <p className="mt-2 max-w-[72ch] text-[14px] leading-6 text-[var(--atlas-muted)]"><strong className="font-semibold">Program. </strong>{participation.programSummary}</p> : null}
            {participation.startedOn || participation.endedOn ? <p className="mt-2 text-[12px] font-semibold text-[var(--atlas-muted)]">{participation.startedOn ? `Started ${formatDate(participation.startedOn)}` : "Start date not published"}{participation.endedOn ? ` · Ended ${formatDate(participation.endedOn)}` : ""}</p> : null}
            {participation.externalIdentifiers.length ? <p className="mt-2 break-words text-[12px] font-semibold text-[var(--atlas-muted)]">{participation.externalIdentifiers.map((identifier) => `${toTitleCase(identifier.kind)} ${identifier.value}`).join(" · ")}</p> : null}
            <div className="mt-3 flex flex-wrap gap-3 text-[13px] font-semibold">
              <InternalLink
                link={{
                  href: `/map?program=${participation.programSlug}&selected=${organization.id}`,
                  label: `View organizations connected to ${participation.programName}`,
                  targetType: "program",
                  targetSlug: participation.programSlug,
                  relationshipKind: "program_participation",
                  provenance: "direct"
                }}
                module="organization_programs"
                position={index + 1}
              />
              {participation.programUrl ? <ExternalSourceLink href={participation.programUrl} className="min-h-11 items-center" >Official program page</ExternalSourceLink> : null}
              {[...participation.citations, ...participation.programCitations].slice(0, 2).map((citation) => <ExternalSourceLink key={citation.id} href={citation.sourceUrl} className="min-h-11 items-center">{citation.sourceTitle}</ExternalSourceLink>)}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function RelationshipList({ organization }: { organization: AtlasOrganization }) {
  return <div><h3 className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-[var(--atlas-ink)]">Ecosystem relationships</h3><ul className="mt-4 divide-y divide-[var(--atlas-border)] border-t border-[var(--atlas-border)]">{organization.relationships.map((relationship) => <li key={relationship.id} className="py-4"><p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--atlas-primary)]">{toTitleCase(relationship.relationshipType)}</p><p className="mt-1 text-base font-bold text-[var(--atlas-ink)]">{relationship.relatedOrganization ? <Link href={`/organizations/${relationship.relatedOrganization.slug}`} prefetch={false} data-internal-link-role="contextual" data-internal-link-module="organization_canonical_relationship" className="inline-flex min-h-11 items-center text-[var(--atlas-primary)] underline decoration-[var(--atlas-signal)] decoration-2 underline-offset-4 hover:decoration-[var(--atlas-ink)]">{relationship.relatedOrganization.name}</Link> : relationship.relatedOrganizationName}</p><p className="mt-1.5 text-[14px] leading-6 text-[var(--atlas-muted)]">{relationship.publicSummary}</p></li>)}</ul></div>;
}

function FundingList({ organization }: { organization: AtlasOrganization }) {
  return <div><h3 className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-[var(--atlas-ink)]">Funding and ownership</h3><ul className="mt-4 divide-y divide-[var(--atlas-border)] border-t border-[var(--atlas-border)]">{organization.fundingEvents.map((event) => <li key={event.id} className="py-4"><div className="flex flex-wrap items-center gap-2"><p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--atlas-ink)]">{toTitleCase(event.eventType)}</p>{event.announcedOn ? <span className="text-[12px] text-[var(--atlas-muted)]">{formatDate(event.announcedOn)}</span> : null}</div>{event.amountValue !== null && event.amountCurrency ? <p className="mt-1 text-lg font-extrabold text-[var(--atlas-evidence)]">{formatMoney(event.amountValue, event.amountCurrency)}</p> : null}<p className="mt-1.5 text-[14px] leading-6 text-[var(--atlas-muted)]">{event.disclosedSummary}</p></li>)}</ul></div>;
}

async function RelatedIntelligenceLoader({
  organization,
  relatedIntelligence
}: {
  organization: AtlasOrganization;
  relatedIntelligence?: DossierRelatedIntelligence;
}) {
  const related = relatedIntelligence ?? await getDossierRelatedIntelligence(organization);
  return <RelatedIntelligence organization={organization} related={related} />;
}

function RelatedIntelligence({ organization, related }: {
  organization: AtlasOrganization;
  related: Awaited<ReturnType<typeof getDossierRelatedIntelligence>>;
}) {
  const editorialLinks: InternalLinkEdge[] = [
    ...related.signals.map((signal) => ({
      href: `/signals/${signal.slug}`,
      label: signal.title,
      detail: signal.matchedItemTitle,
      targetType: "signal" as const,
      targetSlug: signal.slug,
      relationshipKind: "editorial_record" as const,
      provenance: "editorial" as const,
      sortDate: signal.editionDate
    })),
    ...related.briefs.map((brief) => ({
      href: `/briefs/${brief.slug}`,
      label: brief.title,
      detail: brief.summary,
      targetType: "brief" as const,
      targetSlug: brief.slug,
      relationshipKind: "editorial_record" as const,
      provenance: "editorial" as const,
      sortDate: brief.publishedAt
    }))
  ]
    .sort((left, right) => right.sortDate.localeCompare(left.sortDate))
    .map(({ sortDate: _sortDate, ...link }) => link);
  const links: InternalLinkEdge[] = [
    ...organization.relationships.flatMap((relationship) => {
      const link = canonicalOrganizationRelationshipEdge(relationship);
      return link ? [link] : [];
    }),
    ...related.organizations.map((item) => ({
      href: `/organizations/${item.slug}`,
      label: `Explore ${item.name}'s organization profile`,
      detail: item.reason,
      targetType: "organization" as const,
      targetSlug: item.slug,
      relationshipKind: item.reason.includes("Mission") ? "shared_mission" as const : "shared_domain" as const,
      provenance: "discovery" as const
    })),
    ...organization.capabilities.flatMap((capability) => capability.missionMatches.map((match) => ({
      href: `/missions/${match.missionArea.slug}`,
      label: `Explore Mission area: ${match.missionArea.name}`,
      detail: `Connected through ${capability.name}.`,
      targetType: "mission_area" as const,
      targetSlug: match.missionArea.slug,
      relationshipKind: "reviewed_mission" as const,
      provenance: "direct" as const
    }))),
    ...organization.capabilities.flatMap((capability) => capability.demandMatches.map((match) => ({
      href: `/demand/${match.demandSlug}`,
      label: `Review Defence need: ${match.demandTitle}`,
      detail: `Connected through ${capability.name}.`,
      targetType: "public_need" as const,
      targetSlug: match.demandSlug,
      relationshipKind: "reviewed_public_need" as const,
      provenance: "direct" as const
    }))),
    ...organization.programs.map((participation) => ({
      href: `/map?program=${participation.programSlug}`,
      label: `View organizations connected to ${participation.programName}`,
      detail: `Reviewed role: ${participation.participationType}.`,
      targetType: "program" as const,
      targetSlug: participation.programSlug,
      relationshipKind: "program_participation" as const,
      provenance: "direct" as const
    })),
    {
      href: `/map?selected=${organization.id}`,
      label: "View this organization on the ecosystem map",
      targetType: "map" as const,
      targetSlug: organization.id,
      relationshipKind: "map_path" as const,
      provenance: "direct" as const
    },
    ...editorialLinks
  ];
  return (
    <ExploreNext
      links={links}
      module="organization_dossier"
      currentHref={`/organizations/${organization.slug}`}
      title="Follow the strongest connections"
      description="Continue through related organizations, reviewed mission and Defence need connections, programme pathways, and explicitly linked intelligence. Similarity results describe shared areas of work, not partnerships or endorsements."
    />
  );
}

function SourceRow({ source }: { source: SourceEntry }) {
  return (
    <li className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-8">
      <div className="min-w-0">
        <h4 className="break-words text-[15px] font-bold leading-6 text-[var(--atlas-ink)]">{source.sourceTitle}</h4>
        <p className="mt-1 text-[13px] leading-6 text-[var(--atlas-muted)]">{source.publisher}{source.publishedAt ? ` · ${formatDate(source.publishedAt)}` : ""}</p>
      </div>
      <ExternalSourceLink href={source.sourceUrl} className="min-h-11 items-center self-start text-[13px] font-bold">Open source: {source.sourceTitle}</ExternalSourceLink>
      <details className="text-[13px] text-[var(--atlas-muted)] sm:col-span-2">
        <summary aria-label={`Source details: ${source.sourceTitle}`} className="min-h-11 cursor-pointer py-3 font-semibold text-[var(--atlas-ink-soft)] underline decoration-[var(--atlas-border-strong)] underline-offset-4 hover:decoration-[var(--atlas-signal)]">Source details</summary>
        <div className="mb-2 max-w-[72ch] border-l-2 border-[var(--atlas-evidence)] pl-3 leading-6">
          <p><strong className="font-bold text-[var(--atlas-ink)]">Source type. </strong>{source.sourceType.replaceAll("_", " ")}</p>
          <p className="mt-2"><strong className="font-bold text-[var(--atlas-ink)]">Supports. </strong>{source.associations.join(" · ")}</p>
          <p className="mt-2">{source.excerpt}</p>
        </div>
      </details>
    </li>
  );
}

function ProfileFact({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return <div><p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--atlas-muted)]">{label}</p><p className="mt-1 text-[14px] font-semibold leading-6 text-[var(--atlas-ink-soft)]">{value}</p></div>;
}

function SnapshotFact({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return <div className="border-t border-[var(--atlas-border)] py-4"><dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--atlas-muted)]">{label}</dt><dd className="mt-1 text-[14px] font-semibold leading-6 text-[var(--atlas-ink-soft)]">{value}</dd></div>;
}

function DecisionList({ label, values }: { label: string; values: string[] }) {
  return <div className="mt-4"><p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--atlas-muted)]">{label}</p><ul className="mt-2 space-y-1.5 text-[13px] leading-6 text-[var(--atlas-ink-soft)]">{values.slice(0, 3).map((value) => <li key={value} className="flex gap-2"><span className="mt-2.5 size-1 shrink-0 rounded-full bg-[var(--atlas-muted)]" />{value}</li>)}</ul></div>;
}

function ContactLink({ href, label, icon, external = false }: { href: string; label: string; icon: React.ReactNode; external?: boolean }) {
  return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="flex min-h-11 items-center justify-between gap-3 rounded-full border border-white/15 px-3.5 py-2.5 text-[14px] font-semibold text-white no-underline hover:bg-white/10 hover:no-underline"><span className="min-w-0 truncate">{label}{external ? <span className="sr-only"> (opens in a new tab)</span> : null}</span><span className="shrink-0 text-[var(--atlas-signal)]" aria-hidden="true">{icon}</span></a>;
}

function buildSourceGroups(organization: AtlasOrganization) {
  const order: SourceGroupName[] = ["Identity and profile", "Technologies and services", "Public record", "Mission and Defence need"];
  const sources = new Map<string, SourceEntry & { primaryGroup: SourceGroupName }>();
  const add = (citation: AtlasCitation, group: SourceGroupName, association: string) => {
    const existing = sources.get(citation.sourceUrl);
    if (existing) {
      if (!existing.groups.includes(group)) existing.groups.push(group);
      if (!existing.associations.includes(association)) existing.associations.push(association);
      return;
    }
    sources.set(citation.sourceUrl, { ...citation, associations: [association], groups: [group], primaryGroup: group });
  };
  organization.citations.forEach((citation) => add(citation, "Identity and profile", `Profile · ${citation.fieldName.replaceAll("_", " ")}`));
  organization.mediaAssets.forEach((media) => media.citations.forEach((citation) => add(citation, "Identity and profile", `Media · ${citation.fieldName.replaceAll("_", " ")}`)));
  organization.capabilities.forEach((capability) => {
    capability.citations.forEach((citation) => add(citation, "Technologies and services", `${capability.name} · ${citation.fieldName.replaceAll("_", " ")}`));
    capability.missionMatches.forEach((match) => match.citations.forEach((citation) => add(citation, "Mission and Defence need", `${capability.name} → ${match.missionArea.name}`)));
    capability.demandMatches.forEach((match) => match.citations.forEach((citation) => add(citation, "Mission and Defence need", `${capability.name} → ${match.demandTitle}`)));
  });
  organization.programs.forEach((participation) => {
    participation.citations.forEach((citation) => add(citation, "Public record", `${participation.programName} · organization participation`));
    participation.programCitations.forEach((citation) => add(citation, "Public record", `${participation.programName} · canonical program`));
  });
  organization.relationships.forEach((relationship) => relationship.citations.forEach((citation) => add(citation, "Public record", `${relationship.relationshipType} relationship`)));
  organization.fundingEvents.forEach((event) => event.citations.forEach((citation) => add(citation, "Public record", `${event.eventType} funding event`)));
  return order.flatMap((name) => {
    const grouped = [...sources.values()].filter((source) => source.primaryGroup === name);
    return grouped.length ? [{ name, sources: grouped }] : [];
  });
}

function selectHeroMedia(mediaAssets: AtlasDossierMediaAsset[]): HeroMediaAsset | null {
  const rolePriority: Record<NonNullable<AtlasDossierMediaAsset["displayRole"]>, number> = {
    profile_context: 0,
    profile_identity: 1,
    capability_context: 2,
    source_support: 3
  };
  const candidates = mediaAssets
    .filter((media): media is HeroMediaAsset => (
      media.assetType !== "logo"
      && (media.displayRole === "profile_context" || media.displayRole === "profile_identity")
      && Boolean(media.publicUrl?.trim())
      && Boolean(media.altText?.trim())
      && isRenderableDossierMediaUrl(media.publicUrl)
    ))
    .sort((left, right) => rolePriority[left.displayRole ?? "source_support"] - rolePriority[right.displayRole ?? "source_support"]);
  return candidates[0] ?? null;
}

function isRenderableDossierMediaUrl(value: string | null) {
  if (!value) return false;
  if (value.startsWith("/")) return true;
  try {
    const url = new URL(value);
    return url.hostname === "facoactpdckkhciamflk.supabase.co"
      && url.pathname.startsWith("/storage/v1/object/public/atlas-public-media/");
  } catch {
    return false;
  }
}

function locationContext(organization: AtlasOrganization, hasStaticMap = true) {
  const location = organization.primaryLocation;
  if (!location) return "No public geographic context is available.";
  if (!hasStaticMap && location.geographicConfidence === "exact") return `${location.name} is the source-supported published location for ${organization.name}. Use it as organizational context, not as operating-access guidance.`;
  if (!hasStaticMap && location.geographicConfidence === "city_centroid") return `${location.name} is the published city-level context for ${organization.name}. It does not imply a street address or exact facility location.`;
  if (!hasStaticMap && location.geographicConfidence === "regional") return `${location.name} is the published regional context for ${organization.name}. It does not imply a city or street-level location.`;
  if (location.geographicConfidence === "exact") return "The map is centred on a source-supported published location. It should still be used as organizational context, not as operating-access guidance.";
  if (location.geographicConfidence === "city_centroid") return `The map is centred on ${location.city ?? location.name}. It does not imply a street address or exact facility location.`;
  if (location.geographicConfidence === "regional") return `The map shows the published regional context for ${organization.name}; it does not imply a city or street-level location.`;
  return "The published location has not been verified precisely, so no static map is shown.";
}

function selectedMapHref(mapReturnTo: string, organizationId: string) {
  const target = new URL(mapReturnTo, "https://truenorthmap.ca");
  if (target.pathname !== "/map") return `/map?selected=${encodeURIComponent(organizationId)}`;
  target.searchParams.set("selected", organizationId);
  return `${target.pathname}?${target.searchParams.toString()}`;
}

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-CA", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("en-CA")}`;
  }
}
