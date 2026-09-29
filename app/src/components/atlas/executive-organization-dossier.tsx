import Image from "next/image";
import Link from "@/components/atlas/navigation-link";
import { Suspense } from "react";
import { ArrowRight, Building2, ChevronDown, MapPin } from "lucide-react";
import { CompanySnapshot } from "@/components/atlas/company-snapshot";
import { DossierEngagement } from "@/components/atlas/dossier-engagement";
import { DossierSectionNavigator } from "@/components/atlas/dossier-section-navigator";
import { DossierActions, DossierParagraphs, DossierReadingSection, DossierSourceLibrary } from "@/components/atlas/dossier-reading";
import { ExploreNext } from "@/components/atlas/explore-next";
import { ExternalSourceLink, InternalLink } from "@/components/atlas/internal-link";
import { NorthSignalInline } from "@/components/atlas/north-signal-signup";
import { PublicPageShell } from "@/components/atlas/public-page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { organizationInitials } from "@/lib/atlas/dossier-presentation";
import { organizationDossierSources } from "@/lib/atlas/organization-dossier-sources";
import { getDossierRelatedIntelligence, type DossierRelatedIntelligence } from "@/lib/atlas/dossier-related";
import { canonicalOrganizationRelationshipEdge, type InternalLinkEdge } from "@/lib/atlas/internal-link-graph";
import { showsContextualNorthSignalSignup } from "@/lib/north-signal/contextual-placement";
import { organizationKindLabel, publicContactFromProfileData, alignmentTypeLabel } from "@/lib/atlas/presentation";
import { absoluteUrl } from "@/lib/site";
import { formatDate, toTitleCase } from "@/lib/utils";
import type { AtlasCapability, AtlasDossierMediaAsset, AtlasOrganization } from "@/types/atlas";
import styles from "./editorial-dossier.module.css";

export function ExecutiveOrganizationDossier({ organization, mapReturnTo, profilePath, relatedIntelligence, trackEngagement = true }: {
  organization: AtlasOrganization; mapReturnTo: string; profilePath: string; relatedIntelligence?: DossierRelatedIntelligence; trackEngagement?: boolean;
}) {
  const { editorialProfile: editorial } = organization;
  const publicContact = publicContactFromProfileData(organization.profileData);
  const sources = organizationDossierSources(organization);
  const connections = organization.capabilities.flatMap(capability => [
    ...capability.missionMatches.map(match => ({ key: `mission-${match.id}`, capability, match, title: match.missionArea.name, href: `/missions/${match.missionArea.slug}`, type: "Mission area", action: "mission_open", targetId: match.missionArea.id, targetType: "mission_area" })),
    ...capability.demandMatches.map(match => ({ key: `need-${match.id}`, capability, match, title: match.demandTitle, href: `/demand/${match.demandSlug}`, type: "Released Defence need", action: "public_need_open", targetId: match.demandRequirementId, targetType: "public_need" }))
  ]);
  const hasCommercial = Boolean(organization.commercialStatus || organization.disclosedFinancingSummary || organization.ownership || editorial.snapshotObservations?.length || organization.employeeRange || organization.companyStage);
  const currentActivitySources = organization.citations.filter(citation => citation.fieldName === "current_activity");
  const hasActivity = Boolean(editorial.currentActivity && editorial.currentActivityAsOf && currentActivitySources.length);
  const hasContact = Boolean(organization.websiteUrl || Object.values(publicContact).some(Boolean));
  const hasPublicRecord = Boolean(hasActivity || hasCommercial || organization.programs.length || organization.relationships.length || organization.fundingEvents.length || connections.length);
  const hasAbout = Boolean(organization.description || editorial.operatingContext || editorial.canadianFootprint || organization.primaryLocation || editorial.executiveRelevanceSummary);
  const media = selectHeroMedia(organization.mediaAssets);
  const sections = [
    ...(organization.capabilities.length ? [{ id: "capabilities", label: "Technologies & services" }] : []),
    ...(hasAbout ? [{ id: "about", label: "About" }] : []),
    ...(hasPublicRecord ? [{ id: "public-record", label: "Public record" }] : []),
    ...(editorial.reviewedQuestions.length || sources.length ? [{ id: "verification", label: editorial.reviewedQuestions.length && sources.length ? "Questions & sources" : sources.length ? "Sources" : "Questions" }] : [])
  ];
  const actions = { type: "organization" as const, id: organization.id, slug: organization.slug, ownerSlug: organization.slug, title: organization.name, description: organization.description, profilePath, websiteUrl: organization.websiteUrl };
  return <PublicPageShell variant="dossier" contentClassName={styles.frame} eyebrow={organizationKindLabel(organization.entityKind)} title={organization.name}
    breadcrumbs={[{ label: "Map", href: mapReturnTo }, { label: "Directory", href: "/organizations" }, { label: organization.name }]}
    pageHeader={<header className={styles.header}>
      <div>
        <div className={styles.identity}><div className={styles.identityText}>
          <p className={styles.byline}><strong>{organizationKindLabel(organization.entityKind)}</strong>{organization.primaryLocation?.provinceTerritory ? <span>{organization.primaryLocation.provinceTerritory}</span> : null}</p>
          <h1>{organization.name}</h1>
          {organization.presentationCopy?.roleDescriptor ? <p className={styles.role}>{organization.presentationCopy.roleDescriptor}</p> : null}
        </div><OrganizationIdentityMark organization={organization} /></div>
        <DossierParagraphs text={organization.presentationCopy?.displayLead} className={styles.lead} />
        {!organization.presentationCopy?.displayLead && organization.description ? <a href="#company-context" className={`atlas-prose-link ${styles.fullOverviewLink}`}>Read the full overview <ArrowRight className="size-3.5" aria-hidden="true" /></a> : null}
        <DossierActions {...actions} />
      </div>
      <aside className={styles.facts} aria-label="Profile facts"><dl className={styles.factGrid}>
        {organization.primaryLocation ? <div><dt>Listed Canadian location</dt><dd>{organization.primaryLocation.name}</dd></div> : null}
        {organization.foundedYear ? <div><dt>{organization.entityKind === "company" ? "Founded" : "Established"}</dt><dd>{organization.foundedYear}</dd></div> : null}
        <div><dt>Published capabilities</dt><dd>{organization.capabilities.length} {organization.capabilities.length === 1 ? "record" : "records"}</dd></div>
        {organization.lastReviewedAt ? <div><dt>Reviewed</dt><dd>{formatDate(organization.lastReviewedAt)}</dd></div> : null}
      </dl>{sources.length ? <div className={styles.factSource}><a href="#sources" className="atlas-prose-link">{sources.length} linked source {sources.length === 1 ? "record" : "records"} <ArrowRight className="size-3.5" aria-hidden="true" /></a></div> : null}</aside>
    </header>}>
    {trackEngagement ? <DossierEngagement organizationId={organization.id} /> : null}
    <JsonLd data={[
      { "@context": "https://schema.org", "@type": "Organization", name: organization.name, legalName: organization.legalName ?? undefined, url: absoluteUrl(`/organizations/${organization.slug}`), sameAs: organization.websiteUrl ? [organization.websiteUrl] : undefined, logo: organization.logo?.publicUrl, description: organization.description, knowsAbout: organization.capabilities.length ? organization.capabilities.map(capability => capability.name) : undefined, address: organization.primaryLocation ? { "@type": "PostalAddress", addressLocality: organization.primaryLocation.city ?? undefined, addressRegion: organization.primaryLocation.provinceTerritory ?? undefined, addressCountry: "CA" } : undefined },
      { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Ecosystem Map", item: absoluteUrl("/map") }, { "@type": "ListItem", position: 2, name: "Directory", item: absoluteUrl("/organizations") }, { "@type": "ListItem", position: 3, name: organization.name, item: absoluteUrl(`/organizations/${organization.slug}`) }] }
    ]} />
    <DossierSectionNavigator sections={sections} />
    <article className={styles.body} data-editorial-dossier="organization">
      {organization.capabilities.length ? <section id="capabilities" tabIndex={-1} className={styles.chapter} aria-labelledby="capabilities-heading">
        <div className={styles.sectionTop}><h2 id="capabilities-heading">Technologies &amp; services <span className={styles.count}>{organization.capabilities.length}</span></h2></div>
        {organization.capabilities.map((capability, index) => <CapabilityRow key={capability.id} capability={capability} index={index} organizationId={organization.id} />)}
      </section> : null}
      {hasAbout ? <section id="about" tabIndex={-1} className={styles.chapter} aria-labelledby="about-heading">
        <h2 id="about-heading">About {organization.name}</h2>
        {organization.description ? <div id="company-context" tabIndex={-1} className={styles.prose}><span id="profile" /><DossierParagraphs text={organization.description} />{typeof organization.profileData.portfolioSummary === "string" ? <><h3>Systems and integration</h3><DossierParagraphs text={organization.profileData.portfolioSummary} /></> : null}{media ? <DossierHeroMedia media={media} organizationName={organization.name} /> : null}</div> : null}
        {editorial.operatingContext ? <DossierReadingSection id="operating-context" title="Operating context" level={3}><DossierParagraphs text={editorial.operatingContext} /></DossierReadingSection> : null}
        {editorial.canadianFootprint || organization.primaryLocation ? <DossierReadingSection id="canadian-footprint" alias="geography" title="Canadian footprint" level={3}><DossierParagraphs text={editorial.canadianFootprint} />{organization.primaryLocation ? <div className={styles.mapCallout}><MapPin className="size-4" aria-hidden="true" /><div><p>{locationContext(organization, false)}</p><Link href={selectedMapHref(mapReturnTo, organization.id)} data-profile-action="map_open" data-profile-target-id={organization.id} data-profile-target-type="map" data-profile-section="geography" className="atlas-prose-link">Open the map <ArrowRight className="ml-1 size-3" aria-hidden="true" /></Link></div></div> : null}</DossierReadingSection> : null}
        {editorial.executiveRelevanceSummary ? <DossierReadingSection id="assessment" title="TNM assessment" level={3}><DossierParagraphs text={editorial.executiveRelevanceSummary} /><p className={styles.caveat}>Interpretation of the public record. Not qualification, endorsement or evidence of buyer interest.</p></DossierReadingSection> : null}
      </section> : null}
      {hasPublicRecord ? <section id="public-record" tabIndex={-1} className={styles.chapter} aria-labelledby="public-record-heading">
        <h2 id="public-record-heading">Public record</h2>
        {hasActivity ? <DossierReadingSection id="why-now" title="Recent activity" level={3}><p className={styles.date}>{formatDate(editorial.currentActivityAsOf)}</p><DossierParagraphs text={editorial.currentActivity} />{[...new Map(currentActivitySources.map(source => [source.sourceUrl, source])).values()].map(source => <ExternalSourceLink key={source.id} href={source.sourceUrl} className={styles.sourceInline}>Read the original record<span className="sr-only">: {source.sourceTitle}</span></ExternalSourceLink>)}</DossierReadingSection> : null}
        {hasCommercial ? <DossierReadingSection id="commercial" alias="commercial-context" title={organization.entityKind === "company" ? "Commercial context" : "Operating model and access"} level={3}>
          <DossierParagraphs text={organization.commercialStatus} />
          <CompanySnapshot organization={organization} presentation="commercial" />
          {organization.disclosedFinancingSummary ? <details className={styles.disclosure}><summary><ChevronDown aria-hidden="true" />Financing and disclosed activity</summary><DossierParagraphs text={organization.disclosedFinancingSummary} /></details> : null}
          {organization.ownership ? <details className={styles.disclosure}><summary><ChevronDown aria-hidden="true" />Ownership and entity scope</summary><DossierParagraphs text={organization.ownership} /></details> : null}
          {organization.employeeRange || organization.companyStage ? <dl className={styles.factGrid}>{organization.employeeRange ? <div><dt>Reported employee range</dt><dd>{organization.employeeRange}</dd></div> : null}{organization.companyStage ? <div><dt>Reported stage</dt><dd>{organization.companyStage}</dd></div> : null}</dl> : null}
        </DossierReadingSection> : null}
        <div className={styles.publicRecord}>
          {organization.programs.length ? <ProgramTimeline organization={organization} /> : null}
          {organization.relationships.length ? <RelationshipList organization={organization} /> : null}
          {organization.fundingEvents.length ? <FundingList organization={organization} /> : null}
        </div>
        {connections.length ? <DossierReadingSection id="connections" title="Reviewed connections" level={3}>{connections.map(({ key, capability, match, title, href, type, action, targetId, targetType }) => <article key={key} className={styles.connection}><div className={styles.connectionLabel}><span>{type} · {alignmentTypeLabel(match.matchType)}</span><span>Evidence strength: {toTitleCase(match.confidence)}</span></div><h4><Link href={href} className="atlas-prose-link" data-internal-link-role="contextual" data-internal-link-module="organization_connection" data-profile-action={action} data-profile-target-id={targetId} data-profile-target-type={targetType} data-profile-section="connections">{title}</Link></h4><p className={styles.caveat}>Contributing capability: <Link href={`/capabilities/${capability.slug}`} className="atlas-prose-link">{capability.name}</Link></p><DossierParagraphs text={match.alignmentSummary} /><div className={styles.connectionSources}>{[...new Map(match.citations.map(citation => [citation.sourceUrl, citation])).values()].map(citation => <ExternalSourceLink key={citation.id} href={citation.sourceUrl}>{citation.sourceTitle}</ExternalSourceLink>)}</div></article>)}<p className={styles.caveat}>Reviewed connections indicate possible relevance based on public evidence. They do not indicate procurement direction, eligibility, endorsement or customer interest.</p></DossierReadingSection> : null}
      </section> : null}
      {editorial.reviewedQuestions.length || sources.length ? <section id="verification" tabIndex={-1} className={styles.chapter} aria-label="Questions and sources">
        {editorial.reviewedQuestions.length ? <section id="questions" tabIndex={-1} className={styles.questions} aria-labelledby="questions-heading"><h2 id="questions-heading">Questions for a first conversation</h2><ol className={styles.questionGrid}>{editorial.reviewedQuestions.map((question, index) => <li key={question.id} className={styles.question}><span className={styles.number} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><div><h3>{question.question}</h3><DossierParagraphs text={question.context} /></div></li>)}</ol></section> : null}
        <DossierSourceLibrary sources={sources} scope="These records support the organization, its owned capabilities and their reviewed connections." />
      </section> : null}
      <section id="contact" tabIndex={-1} className={styles.next} aria-label="Contact and next steps">
        {hasContact ? <div className={styles.contactLinks}>
          {publicContact.contactPageUrl || organization.websiteUrl ? <ExternalSourceLink href={publicContact.contactPageUrl ?? organization.websiteUrl!}>Official contact</ExternalSourceLink> : null}
          {publicContact.publicEmail ? <a className="atlas-prose-link" href={`mailto:${publicContact.publicEmail}`}>{publicContact.publicEmail}</a> : null}
          {publicContact.publicPhone ? <a className="atlas-prose-link" href={`tel:${publicContact.publicPhone}`}>{publicContact.publicPhone}</a> : null}
          {publicContact.linkedInUrl ? <ExternalSourceLink href={publicContact.linkedInUrl}>LinkedIn</ExternalSourceLink> : null}
        </div> : null}
        <DossierActions {...actions} closing />
      </section>
      <Suspense fallback={null}><RelatedIntelligenceLoader organization={organization} relatedIntelligence={relatedIntelligence} /></Suspense>
      {showsContextualNorthSignalSignup("organization", organization.slug) ? <NorthSignalInline placement="newsletter_inline_profile" trigger="profile_after_evidence" className="w-full" /> : null}
    </article>
  </PublicPageShell>;
}

function OrganizationIdentityMark({ organization }: { organization: AtlasOrganization }) {
  const initials = organizationInitials(organization.name);
  return <span className={styles.logo}>{organization.logo ? <Image src={organization.logo.publicUrl} alt={`${organization.name} logo`} fill sizes="(max-width: 639px) 36px, (max-width: 1190px) 50px, 68px" priority className="object-contain" /> : initials ? <span aria-hidden="true">{initials}</span> : <Building2 className="size-6" aria-hidden="true" />}</span>;
}

function CapabilityRow({ capability, index, organizationId }: { capability: AtlasCapability; index: number; organizationId: string }) {
  return <article className={styles.capabilityRow}>
    <span className={styles.number} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
    <div><h3><Link href={`/capabilities/${capability.slug}`} className={`${styles.capabilityTitle} no-underline`} data-internal-link-role="contextual" data-internal-link-module="organization_owned_capability">{capability.name}</Link></h3>{capability.capabilityType ? <p className={styles.capabilityType}>{capability.capabilityType}</p> : null}<DossierParagraphs text={capability.presentationCopy?.catalogueTeaser} className={styles.teaser} /></div>
    <Link href={`/capabilities/${capability.slug}`} className={styles.direction} aria-label={`Open ${capability.name}`}><ArrowRight className="size-4" aria-hidden="true" /></Link>
    <details className={`${styles.disclosure} ${styles.technicalDisclosure}`}><summary><ChevronDown aria-hidden="true" />Read technical summary</summary><div className={styles.expanded}>
      <DossierParagraphs text={capability.summary} />
      {capability.maturity ? <><h4>Evidence of maturity</h4><DossierParagraphs text={capability.maturity} /></> : null}
      {capability.technologyReadinessLevel !== null ? <p>Reported TRL: {capability.technologyReadinessLevel}</p> : null}
      {capability.commercialAvailability ? <><h4>Commercial availability</h4><DossierParagraphs text={capability.commercialAvailability} /></> : null}
      {capability.coreFeatures.length ? <><h4>Core features</h4><ul>{capability.coreFeatures.map(feature => <li key={feature}>{feature}</li>)}</ul></> : null}
      {capability.defenceApplications.length ? <><h4>Recorded applications</h4><ul>{capability.defenceApplications.map(value => <li key={value}>{value}</li>)}</ul></> : null}
      {capability.technicalDomains.length ? <p>{capability.technicalDomains.map(domain => <Link key={domain.id} href={`/map?domain=${domain.slug}&selected=${organizationId}`} className="atlas-prose-link mr-3">{domain.name}</Link>)}</p> : null}
      <p className={styles.caveat}>Evidence strength: {toTitleCase(capability.sourceConfidence)}{capability.lastReviewedAt ? ` · Last reviewed ${formatDate(capability.lastReviewedAt)}` : ""}</p>
      <Link href={`/capabilities/${capability.slug}`} className="atlas-prose-link">Explore the complete capability <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
    </div></details>
  </article>;
}

type HeroMediaAsset = AtlasDossierMediaAsset & { publicUrl: string; altText: string };
function DossierHeroMedia({ media, organizationName }: { media: HeroMediaAsset; organizationName: string }) {
  return <figure className={styles.media}><Image src={media.publicUrl} alt={media.altText} width={800} height={600} sizes="(min-width: 1024px) 640px, 90vw" /><figcaption>{media.editorialContext ? <><p>{media.editorialContext.caption}</p><p>{media.editorialContext.subject} · {media.editorialContext.contextDate ?? "Date not specified"} · {media.editorialContext.context}</p></> : null}{media.attributionText ?? `${organizationName} profile image`}{media.sourceUrl ? <> · <ExternalSourceLink href={media.sourceUrl}>Image source</ExternalSourceLink></> : null}</figcaption></figure>;
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
  const hasRelated = related.signals.length || related.briefs.length || related.organizations.length || organization.relationships.length || organization.programs.length || organization.capabilities.some(capability => capability.missionMatches.length || capability.demandMatches.length);
  if (!hasRelated) return null;
  return <section id="related" tabIndex={-1} className="atlas-open-section w-full scroll-mt-28 py-6" aria-label="Related intelligence"><RelatedIntelligence organization={organization} related={related} /></section>;
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
    <>
    <ExploreNext
      links={links}
      module="organization_dossier"
      currentHref={`/organizations/${organization.slug}`}
      title="Follow the strongest connections"
      description="Continue through related organizations, reviewed mission and Defence need connections, programme pathways, and explicitly linked intelligence. Similarity results describe shared areas of work, not partnerships or endorsements."
    />
    {related.unavailable?.length ? <p className="mt-4 text-sm text-[var(--atlas-muted)]">Some related content is temporarily unavailable: {related.unavailable.join(", ")}.</p> : null}
    </>
  );
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
      && (!media.editorialContext || media.editorialContext.reuseBasis !== "unknown")
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
