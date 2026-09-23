import { DownloadLink } from "@/components/atlas/download-link";
import Image from "next/image";
import Link from "@/components/atlas/navigation-link";
import { ArrowRight, BookmarkPlus, Building2, ChevronDown, Download } from "lucide-react";
import { DossierSectionNavigator } from "@/components/atlas/dossier-section-navigator";
import { ExternalSourceLink, InternalLink } from "@/components/atlas/internal-link";
import { JsonLd } from "@/components/seo/json-ld";
import { PublicPageShell } from "@/components/atlas/public-page-shell";
import { PublicShare } from "@/components/atlas/public-share";
import { NorthSignalInline } from "@/components/atlas/north-signal-signup";
import { alignmentTypeLabel, evidenceStrengthLabel, publicLanguage, publicSourceCountLabel } from "@/lib/atlas/presentation";
import type { DefenceBrief } from "@/lib/atlas/briefs";
import type { DossierRelatedIntelligence } from "@/lib/atlas/dossier-related";
import { capabilityEvidenceLimits, capabilitySources, type CapabilitySource } from "@/lib/atlas/capability-presentation";
import { publicCitationSourceLocator } from "@/lib/atlas/public-profile-data";
import { organizationInitials } from "@/lib/atlas/dossier-presentation";
import { brandCopy } from "@/lib/brand-copy";
import { absoluteUrl } from "@/lib/site";
import type { SignalEdition } from "@/lib/atlas/signals";
import { showsContextualNorthSignalSignup } from "@/lib/north-signal/contextual-placement";
import { formatDate, toTitleCase } from "@/lib/utils";
import { buildExploreNextGroups, capabilityRelatedOrganizationEdge, type InternalLinkEdge } from "@/lib/atlas/internal-link-graph";
import type { AtlasCapability, AtlasCitation, AtlasConfidence, AtlasAlignmentType, AtlasOrganization } from "@/types/atlas";
import styles from "./capability-dossier.module.css";

export function CapabilityDossier({ organization, capability, mapReturnTo, relatedContent, relatedSignals = [], relatedBriefs = [], relatedOrganizations = [] }: {
  organization: AtlasOrganization;
  capability: AtlasCapability;
  mapReturnTo: string;
  relatedContent?: React.ReactNode;
  relatedSignals?: Pick<SignalEdition, "id" | "slug" | "title" | "editionDate">[];
  relatedBriefs?: Pick<DefenceBrief, "id" | "slug" | "title" | "publishedAt">[];
  relatedOrganizations?: DossierRelatedIntelligence["organizations"];
}) {
  const sources = capabilitySources(capability);
  const capabilityPath = `/capabilities/${capability.slug}`;
  const saveHref = `/collections?addType=capability&addId=${capability.id}&returnTo=${encodeURIComponent(capabilityPath)}`;
  const organizationHref = `/organizations/${organization.slug}`;
  const introductionHref = `/connect/${organization.slug}`;
  const evidenceLimits = capabilityEvidenceLimits(capability);
  const sections = [
    { id: "overview", label: "Overview" },
    ...(capability.missionMatches.length ? [{ id: "mission-areas", label: "Mission areas" }] : []),
    ...(capability.demandMatches.length ? [{ id: "defence-needs", label: "Defence needs" }] : []),
    { id: "evidence", label: "Sources" },
    { id: "evidence-limits", label: "Evidence limits" },
    { id: "next-steps", label: "Next steps" }
  ];
  const primaryActions = <>
    <Link href={saveHref} prefetch={false} className="atlas-signal-button min-h-12 gap-2 px-4 py-3 text-sm"><BookmarkPlus className="size-4" aria-hidden="true" />Add to shortlist</Link>
    <Link href={introductionHref} prefetch={false} className="atlas-secondary-button min-h-12 px-4 py-3 text-sm">Request an introduction</Link>
  </>;

  return <PublicPageShell
    variant="dossier"
    eyebrow="Capability profile"
    title={capability.name}
    description={capability.summary}
    breadcrumbs={[
      { label: "Map", href: mapReturnTo },
      { label: "Directory", href: "/organizations" },
      { label: organization.name, href: organizationHref },
      { label: capability.name }
    ]}
    pageHeader={<header className={styles.header}>
      <div className={styles.introduction}>
        <span className={styles.signalRule} aria-hidden="true" />
        <p className="atlas-eyebrow">Capability profile</p>
        <h1>{capability.name}</h1>
        <p className={styles.summary}>{capability.summary}</p>
      </div>
      <div className={styles.actions} aria-label="Capability actions">
        <p className={`atlas-eyebrow ${styles.actionLabel}`}>Next actions</p>
        {primaryActions}
        <div className={styles.secondaryActions}>
          <DownloadLink href={`/api/export?type=capability-dossier&slug=${capability.slug}`} className="atlas-prose-link inline-flex min-h-11 items-center gap-2 text-sm font-semibold">Download profile <Download className="size-4" aria-hidden="true" /></DownloadLink>
          <PublicShare title={capability.name} description={capability.summary} path={`/capabilities/${capability.slug}`} className="!border-0 !bg-transparent !px-0 !text-sm !text-[var(--atlas-link)] underline underline-offset-4" />
          <Link href="/collections" prefetch={false} className="atlas-prose-link inline-flex min-h-11 items-center text-sm font-semibold">My shortlists</Link>
        </div>
      </div>
    </header>}
  >
    <JsonLd data={[
      { "@context": "https://schema.org", "@type": "Product", name: capability.name, description: capability.summary, brand: { "@type": "Organization", name: organization.name, url: absoluteUrl(`/organizations/${organization.slug}`) }, url: absoluteUrl(`/capabilities/${capability.slug}`) },
      { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Ecosystem Map", item: absoluteUrl("/map") }, { "@type": "ListItem", position: 2, name: "Directory", item: absoluteUrl("/organizations") }, { "@type": "ListItem", position: 3, name: organization.name, item: absoluteUrl(`/organizations/${organization.slug}`) }, { "@type": "ListItem", position: 4, name: capability.name, item: absoluteUrl(`/capabilities/${capability.slug}`) }] }
    ]} />
    <div className={styles.dossier} data-capability-dossier>
      <DossierSectionNavigator sections={sections} />
      <section id="overview" tabIndex={-1} className={styles.overview} aria-labelledby="overview-heading">
        <div className={styles.reading}>
          <p className="atlas-eyebrow">{capability.capabilityType ?? "Reviewed technology"}</p>
          <h2 id="overview-heading">What it enables</h2>
          <CapabilityList label="Core features" values={capability.coreFeatures} />
          <CapabilityList label="Defence and security uses" values={capability.defenceApplications} />
          <CapabilityList label="What sets it apart" values={capability.novelty} />
          {capability.technologyReadinessLevel !== null || capability.maturity || capability.commercialAvailability ? <div className={styles.maturity}>
            <h3>Evidence of maturity</h3>
            {capability.technologyReadinessLevel !== null ? <p><strong>Reported TRL:</strong> {capability.technologyReadinessLevel}</p> : null}
            {capability.maturity ? <p>{capability.maturity}</p> : null}
            {capability.commercialAvailability ? <p><strong>Commercial availability:</strong> {capability.commercialAvailability}</p> : null}
          </div> : null}
          {!capability.coreFeatures.length && !capability.defenceApplications.length && !capability.novelty.length && !capability.maturity && !capability.commercialAvailability && capability.technologyReadinessLevel === null ? <p className={styles.empty}>Further capability detail is not established in the reviewed public record.</p> : null}
          {capability.technicalTags.length ? <ul className={styles.tags} aria-label="Technical tags">{capability.technicalTags.map((tag) => <li key={tag}>{toTitleCase(tag)}</li>)}</ul> : null}
        </div>
        <aside className={styles.facts} aria-labelledby="facts-heading">
          <h2 id="facts-heading" className="atlas-eyebrow">At a glance</h2>
          <div className={styles.identity}>
            <span className={styles.logo}>
              {organization.logo ? <Image src={organization.logo.publicUrl} alt={`${organization.name} logo`} fill sizes="56px" className="object-contain" /> : organizationInitials(organization.name) ? <span aria-hidden="true">{organizationInitials(organization.name)}</span> : <Building2 className="size-6" aria-hidden="true" />}
            </span>
            <div>
              <p className={styles.factLabel}>Organization behind this capability</p>
              <Link href={organizationHref} prefetch={false} className={styles.organizationName}>{organization.name}<ArrowRight className="size-4 shrink-0" aria-hidden="true" /></Link>
              {organization.primaryLocation ? <p className={styles.location}>{organization.primaryLocation.name}</p> : null}
            </div>
          </div>
          <dl className={styles.factGrid}>
            {capability.capabilityType ? <div className={styles.fullFact}><dt>Capability type</dt><dd>{capability.capabilityType}</dd></div> : null}
            <div><dt>{publicLanguage.evidenceStrength}</dt><dd>{evidenceStrengthLabel(capability.sourceConfidence)}</dd></div>
            <div><dt>Public sources</dt><dd><a href="#evidence" className="atlas-prose-link">{sources.length} {sources.length === 1 ? "source" : "sources"}</a></dd></div>
            <div className={`${styles.fullFact} ${styles.domains}`}><dt>Technology areas</dt><dd>{capability.technicalDomains.length ? capability.technicalDomains.map((domain, index) => <InternalLink key={domain.id} link={{ href: `/map?domain=${domain.slug}`, label: domain.name, targetType: "technical_domain", targetSlug: domain.slug, relationshipKind: "shared_domain", provenance: "discovery" }} module="capability_domains" position={index + 1}>{domain.name}</InternalLink>) : "Not yet mapped"}</dd></div>
            <div className={styles.reviewDate}><dt>Capability reviewed</dt><dd>{formatDate(capability.lastReviewedAt)}</dd>{organization.lastReviewedAt ? <><dt>Organization reviewed</dt><dd>{formatDate(organization.lastReviewedAt)}</dd></> : null}</div>
          </dl>
        </aside>
      </section>
      {capability.missionMatches.length ? <section id="mission-areas" tabIndex={-1} className={styles.section} aria-labelledby="mission-heading">
        <p className="atlas-eyebrow">Reviewed connections</p><h2 id="mission-heading">Mission areas</h2>
        {capability.missionMatches.map((match) => <CapabilityConnection key={match.id} href={`/missions/${match.missionArea.slug}`} title={match.missionArea.name} summary={match.alignmentSummary} matchType={match.matchType} confidence={match.confidence} citations={match.citations} />)}
        {!capability.demandMatches.length ? <p className={styles.caveat}>{publicLanguage.demandCaveat}</p> : null}
      </section> : null}
      {capability.demandMatches.length ? <section id="defence-needs" tabIndex={-1} className={styles.section} aria-labelledby="demand-heading">
        <p className="atlas-eyebrow">Released public requirements</p><h2 id="demand-heading">Defence needs</h2>
        {capability.demandMatches.map((match) => <CapabilityConnection key={match.id} href={`/demand/${match.demandSlug}`} title={match.demandTitle} summary={match.alignmentSummary} matchType={match.matchType} confidence={match.confidence} citations={match.citations} />)}
        <p className={styles.caveat}>{publicLanguage.demandCaveat}</p>
      </section> : null}
      <section id="evidence" tabIndex={-1} className={styles.section} aria-labelledby="sources-heading">
        <div className={styles.sectionHeading}><div><p className="atlas-eyebrow">Source library</p><h2 id="sources-heading">What supports this profile</h2></div><a href="#source-library" className="atlas-prose-link inline-flex min-h-11 items-center gap-2 text-sm">{publicSourceCountLabel(sources.length)}<ChevronDown className="size-4" aria-hidden="true" /></a></div>
        <ol id="source-library" className={styles.sources}>{sources.map((source, index) => <CapabilitySourceRow key={source.source.sourceUrl} entry={source} index={index} />)}</ol>
        {!sources.length ? <p className={styles.empty}>No capability-specific or capability-connection public sources are currently published.</p> : null}
        <p className={styles.trust}>{brandCopy.trustCompact}</p>
      </section>
      <section id="evidence-limits" tabIndex={-1} className={styles.limits} aria-labelledby="capability-evidence-limits-heading">
        <p className="atlas-eyebrow">Evidence limits</p><h2 id="capability-evidence-limits-heading">What still needs verification</h2>
        <dl>{evidenceLimits.map((limit) => <div key={limit.label}><dt>{limit.label}</dt><dd>{limit.text}</dd></div>)}</dl>
      </section>
      <section id="next-steps" tabIndex={-1} className={styles.next} aria-labelledby="next-heading">
        <div><p className="atlas-eyebrow">Next useful conversation</p><h2 id="next-heading">Take this capability into<br className="hidden sm:block" /> the next conversation.</h2><p className={styles.nextCopy}>Save the capability and its sources, then verify operating performance, maturity and integration constraints directly with the organization.</p></div>
        <div className={styles.nextActions}>{primaryActions}<Link href={`/submit?submissionType=correction&targetType=capability&targetId=${capability.id}&returnTo=${encodeURIComponent(capabilityPath)}`} prefetch={false} className={styles.correction}>Suggest a correction <ArrowRight className="size-4" aria-hidden="true" /></Link></div>
      </section>
      {relatedContent ?? <CapabilityRelatedRecords organization={organization} capability={capability} relatedSignals={relatedSignals} relatedBriefs={relatedBriefs} relatedOrganizations={relatedOrganizations} />}

      {showsContextualNorthSignalSignup("capability", capability.slug) ? <NorthSignalInline placement="newsletter_inline_profile" trigger="technology_after_evidence" className="mt-8" /> : null}
    </div>
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
          <h3 id={`related-${group.key}`}>{group.key === "context" && group.links.every((link) => link.targetType === "technical_domain") ? "Explore technology areas" : group.title}</h3>
          <ul>{group.links.map((link) => <li key={link.href}><InternalLink link={link} module="capability_profile" position={++relatedPosition} variant="plain" className={styles.relatedLink}><span>{link.label}{link.detail ? <span className={styles.relatedDetail}>{link.detail}</span> : null}</span><ArrowRight className="size-4 shrink-0" aria-hidden="true" /></InternalLink></li>)}</ul>
          {group.key === "organizations" ? <p className={styles.caveat}>Similar areas of work are discovery paths, not partnerships or endorsements.</p> : null}
          {group.key === "context" ? <p className={styles.caveat}>Organization-level program participation is not attributed to this capability.</p> : null}
        </section>)}</div>
        {unavailable.length ? <p className={styles.caveat}>Some related content is temporarily unavailable: {unavailable.join(", ")}.</p> : null}
      </section> : null;
}

function CapabilityList({ label, values }: { label: string; values: string[] }) {
  if (!values.length) return null;
  return <div className={styles.readingGroup}><h3>{label}</h3><ul>{values.map((value) => <li key={value}>{value}</li>)}</ul></div>;
}

function CapabilityConnection({ href, title, summary, matchType, confidence, citations }: { href: string; title: string; summary: string; matchType: AtlasAlignmentType; confidence: AtlasConfidence; citations: AtlasCitation[] }) {
  return <article className={styles.connection}>
    <div className={styles.connectionLabel}><span>{matchType === "public_source_alignment" ? alignmentTypeLabel(matchType) : publicLanguage.assessment}</span><span>{evidenceStrengthLabel(confidence)} public evidence</span></div>
    <h3><Link href={href} data-internal-link-role="contextual" data-internal-link-module="alignment_match_card" className="atlas-prose-link">{title}</Link></h3>
    <p>{summary}</p>
    {citations.length ? <div className={styles.connectionSources}><span>Supporting sources</span>{[...new Map(citations.map((citation) => [citation.sourceUrl, citation])).values()].map((citation) => <ExternalSourceLink key={citation.id} href={citation.sourceUrl}>{citation.sourceTitle}</ExternalSourceLink>)}</div> : null}
  </article>;
}

function CapabilitySourceRow({ entry, index }: { entry: CapabilitySource; index: number }) {
  const source = entry.source;
  return <li className={styles.sourceRow}>
    <span className={styles.sourceNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
    <div className={styles.sourceTitle}><h3>{source.sourceTitle}</h3><p>{source.publisher}{source.publishedAt ? ` · ${formatDate(source.publishedAt)}` : ""}</p></div>
    <details className={styles.sourceDetails}>
      <summary aria-label={`Source details: ${source.sourceTitle}`}>Source details<ChevronDown className="size-3.5" aria-hidden="true" /></summary>
      <div className={styles.sourcePassages}>
        <p><strong>Source type:</strong> {source.sourceType.replaceAll("_", " ")}</p>
        {entry.evidence.map(({ citation, associations }) => <div key={citation.id} id={`citation-${citation.id}`} className={styles.sourcePassage}>
          <p><strong>Supports:</strong> {associations.join(" · ")}</p>
          {publicCitationSourceLocator(citation.sourceLocator) ? <p><strong>Source location:</strong> {publicCitationSourceLocator(citation.sourceLocator)}</p> : null}
          <blockquote>{citation.excerpt}</blockquote>
        </div>)}
      </div>
    </details>
    <ExternalSourceLink href={source.sourceUrl} className={styles.sourceLink}>Open original source<span className="sr-only">: {source.sourceTitle}</span></ExternalSourceLink>
  </li>;
}
