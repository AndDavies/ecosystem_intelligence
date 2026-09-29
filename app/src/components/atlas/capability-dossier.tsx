import Link from "@/components/atlas/navigation-link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DossierSectionNavigator } from "@/components/atlas/dossier-section-navigator";
import { DossierActions, DossierParagraphs, DossierReadingSection, DossierSourceLibrary } from "@/components/atlas/dossier-reading";
import { ExternalSourceLink, InternalLink } from "@/components/atlas/internal-link";
import { JsonLd } from "@/components/seo/json-ld";
import { PublicPageShell } from "@/components/atlas/public-page-shell";
import { NorthSignalInline } from "@/components/atlas/north-signal-signup";
import { alignmentTypeLabel, evidenceStrengthLabel, publicLanguage } from "@/lib/atlas/presentation";
import type { DefenceBrief } from "@/lib/atlas/briefs";
import type { DossierRelatedIntelligence } from "@/lib/atlas/dossier-related";
import { capabilityEvidenceLimits, capabilitySources } from "@/lib/atlas/capability-presentation";
import { absoluteUrl } from "@/lib/site";
import type { SignalEdition } from "@/lib/atlas/signals";
import { showsContextualNorthSignalSignup } from "@/lib/north-signal/contextual-placement";
import { formatDate, toTitleCase } from "@/lib/utils";
import { buildExploreNextGroups, capabilityRelatedOrganizationEdge, type InternalLinkEdge } from "@/lib/atlas/internal-link-graph";
import type { AtlasCapability, AtlasCitation, AtlasConfidence, AtlasAlignmentType, AtlasOrganization } from "@/types/atlas";
import styles from "./capability-dossier.module.css";
import d from "./editorial-dossier.module.css";

export function CapabilityDossier({ organization, capability, mapReturnTo, relatedContent, relatedSignals = [], relatedBriefs = [], relatedOrganizations = [] }: {
  organization: AtlasOrganization; capability: AtlasCapability; mapReturnTo: string; relatedContent?: React.ReactNode;
  relatedSignals?: Pick<SignalEdition, "id" | "slug" | "title" | "editionDate">[];
  relatedBriefs?: Pick<DefenceBrief, "id" | "slug" | "title" | "publishedAt">[];
  relatedOrganizations?: DossierRelatedIntelligence["organizations"];
}) {
  const sources = capabilitySources(capability);
  const capabilityPath = `/capabilities/${capability.slug}`;
  const organizationHref = `/organizations/${organization.slug}`;
  const evidenceLimits = capabilityEvidenceLimits(capability);
  const hasTechnical = Boolean(capability.coreFeatures.length || capability.novelty.length || capability.technicalTags.length);
  const hasMaturity = Boolean(capability.maturity || capability.technologyReadinessLevel !== null);
  const actions = { type: "capability" as const, id: capability.id, slug: capability.slug, ownerSlug: organization.slug, title: capability.name, description: capability.summary, profilePath: capabilityPath };
  const hasConnections = Boolean(capability.missionMatches.length || capability.demandMatches.length);
  const sections = [
    ...(capability.summary ? [{ id: "overview", label: "Overview" }] : []),
    ...(hasTechnical ? [{ id: "technical-profile", label: "Technical detail" }] : []),
    { id: "use-integration", label: "Use & integration" },
    ...(hasConnections ? [{ id: "connections", label: "Connections" }] : []),
    ...(sources.length ? [{ id: "evidence", label: "Sources" }] : [])
  ];
  return <PublicPageShell variant="dossier" contentClassName={d.frame} eyebrow="Capability profile" title={capability.name} description={capability.summary}
    breadcrumbs={[{ label: "Map", href: mapReturnTo }, { label: "Directory", href: "/organizations" }, { label: organization.name, href: organizationHref }, { label: capability.name }]}
    pageHeader={<header className={d.header}>
      <div><Link href={organizationHref} className={`atlas-prose-link ${d.owner}`}><ArrowLeft className="size-3.5" aria-hidden="true" />{organization.name}</Link><p className={d.label}>Capability profile</p><h1>{capability.name}</h1><DossierParagraphs text={capability.presentationCopy?.displayLead} className={d.lead} />{!capability.presentationCopy?.displayLead && capability.summary ? <a href="#overview" className={`atlas-prose-link ${d.fullOverviewLink}`}>Read the full technical summary <ArrowRight className="size-3.5" aria-hidden="true" /></a> : null}<DossierActions {...actions} /></div>
      <aside className={d.facts} aria-label="Capability record"><dl className={d.factGrid}>
        <div><dt>Organization behind this capability</dt><dd><Link href={organizationHref} className="atlas-prose-link">{organization.name}</Link></dd></div>
        {capability.capabilityType ? <div><dt>Capability type</dt><dd>{capability.capabilityType}</dd></div> : null}
        <div><dt>{publicLanguage.evidenceStrength}</dt><dd>{evidenceStrengthLabel(capability.sourceConfidence)}</dd></div>
        {capability.lastReviewedAt ? <div><dt>Capability reviewed</dt><dd>{formatDate(capability.lastReviewedAt)}</dd></div> : null}
        {organization.lastReviewedAt ? <div><dt>Organization reviewed</dt><dd>{formatDate(organization.lastReviewedAt)}</dd></div> : null}
        {capability.technicalDomains.length ? <div><dt>Technology areas</dt><dd>{capability.technicalDomains.map((domain, index) => <InternalLink key={domain.id} link={{ href: `/map?domain=${domain.slug}`, label: domain.name, targetType: "technical_domain", targetSlug: domain.slug, relationshipKind: "shared_domain", provenance: "discovery" }} module="capability_domains" position={index + 1} className="block">{domain.name}</InternalLink>)}</dd></div> : null}
      </dl>{sources.length ? <div className={d.factSource}><a href="#evidence" className="atlas-prose-link">{sources.length} linked source {sources.length === 1 ? "record" : "records"} <ArrowRight className="size-3.5" aria-hidden="true" /></a></div> : null}</aside>
    </header>}>
    <JsonLd data={[
      { "@context": "https://schema.org", "@type": "Product", name: capability.name, description: capability.summary, brand: { "@type": "Organization", name: organization.name, url: absoluteUrl(organizationHref) }, url: absoluteUrl(capabilityPath) },
      { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Ecosystem Map", item: absoluteUrl("/map") }, { "@type": "ListItem", position: 2, name: "Directory", item: absoluteUrl("/organizations") }, { "@type": "ListItem", position: 3, name: organization.name, item: absoluteUrl(organizationHref) }, { "@type": "ListItem", position: 4, name: capability.name, item: absoluteUrl(capabilityPath) }] }
    ]} />
    <DossierSectionNavigator sections={sections} />
    <article className={d.body} data-capability-dossier>
      {capability.summary ? <DossierReadingSection id="overview" title="How it works"><DossierParagraphs text={capability.summary} /></DossierReadingSection> : null}
      {hasTechnical ? <section id="technical-profile" tabIndex={-1} className={d.chapter} aria-labelledby="technical-heading">
        <h2 id="technical-heading">Technical detail</h2>
        {capability.coreFeatures.length ? <><h3>Core features</h3><ul className={d.features}>{capability.coreFeatures.map(feature => <li key={feature}>{feature}</li>)}</ul></> : null}
        {capability.novelty.length ? <><h3>What sets it apart</h3><ul className={d.features}>{capability.novelty.map(item => <li key={item}>{item}</li>)}</ul></> : null}
        {capability.technicalTags.length ? <ul className={d.tags} aria-label="Technical tags">{capability.technicalTags.map(tag => <li key={tag}>{toTitleCase(tag)}</li>)}</ul> : null}
      </section> : null}
      <section id="use-integration" tabIndex={-1} className={d.chapter} aria-labelledby="use-integration-heading">
        <h2 id="use-integration-heading">Use &amp; integration</h2>
        {capability.defenceApplications.length ? <DossierReadingSection id="applications" title="Recorded applications" level={3}><ul className={d.features}>{capability.defenceApplications.map(value => <li key={value}>{value}</li>)}</ul><p className={d.caveat}>These describe the reviewed application scope, not confirmed deployments, released requirements or procurement eligibility.</p></DossierReadingSection> : null}
        {hasMaturity ? <DossierReadingSection id="maturity" title="Evidence of maturity" level={3}>{capability.technologyReadinessLevel !== null ? <p><strong>Reported TRL:</strong> {capability.technologyReadinessLevel}</p> : null}<DossierParagraphs text={capability.maturity} /></DossierReadingSection> : null}
        {capability.commercialAvailability ? <DossierReadingSection id="availability" title="Commercial availability" level={3}><DossierParagraphs text={capability.commercialAvailability} /></DossierReadingSection> : null}
        <DossierReadingSection id="evidence-limits" title="Integration and verification" level={3}><dl className={d.limits}>{evidenceLimits.map(limit => <div key={limit.label}><dt>{limit.label}</dt><dd><DossierParagraphs text={limit.text} /></dd></div>)}</dl></DossierReadingSection>
      </section>
      {hasConnections ? <section id="connections" tabIndex={-1} className={d.chapter} aria-labelledby="connections-heading">
        <h2 id="connections-heading">Reviewed connections</h2>
        {capability.missionMatches.length ? <DossierReadingSection id="mission-areas" title="Mission areas" level={3}>{capability.missionMatches.map(match => <CapabilityConnection key={match.id} href={`/missions/${match.missionArea.slug}`} title={match.missionArea.name} summary={match.alignmentSummary} matchType={match.matchType} confidence={match.confidence} citations={match.citations} />)}{!capability.demandMatches.length ? <p className={d.caveat}>{publicLanguage.demandCaveat}</p> : null}</DossierReadingSection> : null}
        {capability.demandMatches.length ? <DossierReadingSection id="defence-needs" title="Defence needs" level={3}>{capability.demandMatches.map(match => <CapabilityConnection key={match.id} href={`/demand/${match.demandSlug}`} title={match.demandTitle} summary={match.alignmentSummary} matchType={match.matchType} confidence={match.confidence} citations={match.citations} />)}<p className={d.caveat}>{publicLanguage.demandCaveat}</p></DossierReadingSection> : null}
      </section> : null}
      <span id="sources" /><DossierSourceLibrary sources={sources} id="evidence" scope="These records support this capability and its published Mission area and Defence need connections." />
      <section id="next-steps" tabIndex={-1} className={d.next} aria-label="Next steps"><DossierActions {...actions} closing /></section>
      {relatedContent ?? <CapabilityRelatedRecords organization={organization} capability={capability} relatedSignals={relatedSignals} relatedBriefs={relatedBriefs} relatedOrganizations={relatedOrganizations} />}
      {showsContextualNorthSignalSignup("capability", capability.slug) ? <NorthSignalInline placement="newsletter_inline_profile" trigger="technology_after_evidence" className="mt-8" /> : null}
    </article>
  </PublicPageShell>;
}

export function CapabilityRelatedRecords({ organization, capability, relatedSignals, relatedBriefs, relatedOrganizations,
  siblings = organization.capabilities.filter((item) => item.id !== capability.id).slice(0, 2), unavailable = []
}: {
  organization: AtlasOrganization;
  capability: AtlasCapability;
  relatedSignals: Pick<SignalEdition, "id" | "slug" | "title" | "editionDate">[];
  relatedBriefs: Pick<DefenceBrief, "id" | "slug" | "title" | "publishedAt">[];
  relatedOrganizations: DossierRelatedIntelligence["organizations"];
  siblings?: Array<{ id: string; slug: string; name: string }>;
  unavailable?: string[];
}) {
  const editorialExploreLinks: InternalLinkEdge[] = [
    ...relatedSignals.map((signal) => ({
      href: `/signals/${signal.slug}`,
      label: signal.title,
      detail: `Explicit Signal record link · ${formatDate(signal.editionDate)}`,
      targetType: "signal" as const,
      targetSlug: signal.slug,
      relationshipKind: "editorial_record" as const,
      provenance: "editorial" as const,
      sortDate: signal.editionDate
    })),
    ...relatedBriefs.map((brief) => ({
      href: `/briefs/${brief.slug}`,
      label: brief.title,
      detail: "Explicit Brief record link",
      targetType: "brief" as const,
      targetSlug: brief.slug,
      relationshipKind: "editorial_record" as const,
      provenance: "editorial" as const,
      sortDate: brief.publishedAt
    }))
  ].sort((left, right) => right.sortDate.localeCompare(left.sortDate)).map(({ sortDate: _sortDate, ...link }) => link);
  const exploreLinks: InternalLinkEdge[] = [
    {
      href: `/organizations/${organization.slug}`,
      label: organization.name,
      targetType: "organization",
      targetSlug: organization.slug,
      relationshipKind: "ownership",
      provenance: "direct"
    },
    ...relatedOrganizations.map((item) => ({ ...capabilityRelatedOrganizationEdge(item), label: item.name, detail: item.reason })),
    ...capability.missionMatches.map((match) => ({
      href: `/missions/${match.missionArea.slug}`,
      label: `Explore Mission area: ${match.missionArea.name}`,
      detail: `Reviewed connection through ${capability.name}.`,
      targetType: "mission_area" as const,
      targetSlug: match.missionArea.slug,
      relationshipKind: "reviewed_mission" as const,
      provenance: "direct" as const
    })),
    ...siblings.map((item) => ({
      href: `/capabilities/${item.slug}`,
      label: `Review ${item.name}`,
      detail: `Another published capability from ${organization.name}.`,
      targetType: "capability" as const,
      targetSlug: item.slug,
      relationshipKind: "ownership" as const,
      provenance: "direct" as const
    })),
    ...capability.demandMatches.map((match) => ({
      href: `/demand/${match.demandSlug}`,
      label: `Review Defence need: ${match.demandTitle}`,
      detail: `Reviewed public-source alignment through ${capability.name}.`,
      targetType: "public_need" as const,
      targetSlug: match.demandSlug,
      relationshipKind: "reviewed_public_need" as const,
      provenance: "direct" as const
    })),
    ...capability.technicalDomains.map((domain) => ({
      href: `/map?domain=${domain.slug}`,
      label: domain.name,
      targetType: "technical_domain" as const,
      targetSlug: domain.slug,
      relationshipKind: "shared_domain" as const,
      provenance: "discovery" as const
    })),
    ...editorialExploreLinks
  ];

  const groups = buildExploreNextGroups(exploreLinks, { currentHref: `/capabilities/${capability.slug}` });
  let relatedPosition = 0;
  return groups.length || unavailable.length ? <section className={`${styles.section} ${styles.related}`} aria-labelledby="capability-related-heading" data-internal-link-module="capability_profile">
        <p className="atlas-eyebrow">Continue exploring</p><h2 id="capability-related-heading">Related records</h2>
        <div className={styles.relatedGroups}>{groups.map((group) => <section key={group.key} aria-labelledby={`related-${group.key}`}>
          <h3 id={`related-${group.key}`}>{group.key === "context"
            ? group.links.every((link) => link.targetType === "capability") ? `Other capabilities from ${organization.name}`
              : group.links.some((link) => link.targetType === "capability") ? "Other capabilities and related paths"
                : group.links.every((link) => link.targetType === "technical_domain") ? "Explore technology areas" : group.title
            : group.title}</h3>
          <ul>{group.links.map((link) => <li key={link.href}><InternalLink link={link} module="capability_profile" position={++relatedPosition} variant="plain" className={styles.relatedLink}><span>{link.label}{link.detail ? <span className={styles.relatedDetail}>{link.detail}</span> : null}</span><ArrowRight className="size-4 shrink-0" aria-hidden="true" /></InternalLink></li>)}</ul>
          {group.key === "organizations" ? <p className={styles.caveat}>Similar areas of work are discovery paths, not partnerships or endorsements.</p> : null}
          {group.key === "context" ? <p className={styles.caveat}>Organization-level program participation is not attributed to this capability.</p> : null}
        </section>)}</div>
        {unavailable.length ? <p className={styles.caveat}>Some related content is temporarily unavailable: {unavailable.join(", ")}.</p> : null}
      </section> : null;
}

function CapabilityConnection({ href, title, summary, matchType, confidence, citations }: { href: string; title: string; summary: string; matchType: AtlasAlignmentType; confidence: AtlasConfidence; citations: AtlasCitation[] }) {
  return <article className={d.connection}>
    <div className={d.connectionLabel}><span>{matchType === "public_source_alignment" ? alignmentTypeLabel(matchType) : publicLanguage.assessment}</span><span>{evidenceStrengthLabel(confidence)} public evidence</span></div>
    <h4><Link href={href} data-internal-link-role="contextual" data-internal-link-module="alignment_match_card" className="atlas-prose-link">{title}</Link></h4>
    <DossierParagraphs text={summary} />
    {citations.length ? <div className={d.connectionSources}><span>Supporting sources</span>{[...new Map(citations.map((citation) => [citation.sourceUrl, citation])).values()].map((citation) => <ExternalSourceLink key={citation.id} href={citation.sourceUrl}>{citation.sourceTitle}</ExternalSourceLink>)}</div> : null}
  </article>;
}
