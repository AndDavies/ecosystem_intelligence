import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Compass, FileText, Layers3, SearchCheck, ShieldAlert } from "lucide-react";
import { MissionOrganizationCard } from "@/components/atlas/mission-organization-card";
import { ExploreNext } from "@/components/atlas/explore-next";
import { NorthSignalInline } from "@/components/atlas/north-signal-signup";
import { CollectionContinuation, EmptyCoverage, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { PublicShare } from "@/components/atlas/public-share";
import { JsonLd } from "@/components/seo/json-ld";
import { PaginationNav } from "@/components/ui/pagination-nav";
import { StatTile } from "@/components/ui/stat-tile";
import { getBriefPresentation } from "@/lib/atlas/brief-presentation";
import { getPublishedDefenceBriefs } from "@/lib/atlas/briefs";
import { getRelationshipPilotTreatment, isRelationshipPilotControl, missionRelationshipMetadataTitles } from "@/lib/atlas/relationship-pilot";
import { orderMissionRelationships, relationshipPositionBand, selectFeaturedMissionRelationshipPresentations, selectMissionPublicNeedsForPresentation, selectRelationshipSignals, shouldShowRelationshipTreatmentIntro } from "@/lib/atlas/relationship-presentation";
import { getAtlasMissionBySlug } from "@/lib/atlas/repository";
import { getPublishedSignals, getPublishedSignalsForRecord } from "@/lib/atlas/signals";
import { normalizedPage, paginate } from "@/lib/pagination";
import { socialMetadata } from "@/lib/seo/social";
import { absoluteUrl } from "@/lib/site";
import { editorialIntelligenceRelationship, type InternalLinkEdge } from "@/lib/atlas/internal-link-graph";

const ORGANIZATIONS_PER_PAGE = 18;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getAtlasMissionBySlug(slug);
  if (!result) return { title: "Mission Area not found", robots: { index: false, follow: false } };
  const treatment = getRelationshipPilotTreatment("mission", result.missionArea.slug);
  const path = `/missions/${result.missionArea.slug}`;
  const { pageTitle, socialTitle } = missionRelationshipMetadataTitles(result.missionArea.name, treatment);
  const description = treatment?.metadataDescription ?? result.missionArea.summary;
  return {
    title: pageTitle,
    description,
    alternates: { canonical: path },
    ...socialMetadata({ title: socialTitle, description, path, eyebrow: "Mission Area and Use Case", detail: "Canadian organizations and technologies that may be worth examining" })
  };
}

export default async function MissionDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ slug }, search] = await Promise.all([params, searchParams]);
  const treatment = getRelationshipPilotTreatment("mission", slug);
  const control = isRelationshipPilotControl("mission", slug);
  const [result, briefs, signalEditions] = await Promise.all([
    getAtlasMissionBySlug(slug),
    getPublishedDefenceBriefs(),
    treatment ? getPublishedSignals(30) : Promise.resolve([])
  ]);
  if (!result) notFound();
  const directSignalEditions = treatment ? [] : await getPublishedSignalsForRecord("mission_area", result.missionArea.id, 3);

  const organizations = treatment ? orderMissionRelationships(result.organizations, treatment) : result.organizations;
  const requestedPage = normalizedPage(search.page);
  const featuredPresentations = treatment ? selectFeaturedMissionRelationshipPresentations(organizations, treatment) : [];
  const featuredConnections = featuredPresentations.map((presentation) => presentation.connection);
  const featuredOrganizationIds = new Set(featuredConnections.map((connection) => connection.organization.id));
  const directoryConnections = treatment
    ? organizations.filter((connection) => !featuredOrganizationIds.has(connection.organization.id))
    : organizations;
  const directoryPageSize = treatment
    ? Math.max(1, ORGANIZATIONS_PER_PAGE - featuredConnections.length)
    : ORGANIZATIONS_PER_PAGE;
  const directory = paginate(directoryConnections, requestedPage, directoryPageSize);
  const showTreatmentIntro = shouldShowRelationshipTreatmentIntro(Boolean(treatment), directory.page);
  const presentationSequence = treatment ? [...featuredConnections, ...directoryConnections] : organizations;
  const presentedPublicNeeds = treatment && showTreatmentIntro
    ? selectMissionPublicNeedsForPresentation(result.publicNeeds, treatment)
    : treatment ? [] : result.publicNeeds;
  const positionByOrganizationId = new Map(organizations.map((connection, index) => [connection.organization.id, index]));
  const path = `/missions/${result.missionArea.slug}`;
  const organizationIds = new Set(result.organizations.map((connection) => connection.organization.id));
  const capabilityIds = new Set(result.organizations.flatMap((connection) => connection.capabilities.map((capability) => capability.id)));
  const publicNeedIds = new Set(result.publicNeeds.map((demand) => demand.id));
  const relatedBriefs = treatment ? [] : briefs
    .map((brief) => ({
      brief,
      score: brief.links.reduce((score, link) => score + (
        link.type === "capability" && capabilityIds.has(link.id) ? 3
          : link.type === "organization" && organizationIds.has(link.id) ? 2
            : link.type === "demand_requirement" && publicNeedIds.has(link.id) ? 1
              : 0
      ), 0)
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || Date.parse(right.brief.updatedAt) - Date.parse(left.brief.updatedAt))
    .slice(0, 3)
    .map((item) => item.brief);
  const currentSignalTargetKey = `mission_area:${result.missionArea.id}`;
  const adjacentSignalTargetKeys = new Set([
    ...featuredConnections.map((connection) => `organization:${connection.organization.id}`),
    ...featuredConnections.flatMap((connection) => connection.capabilities.map((capability) => `capability:${capability.id}`)),
    ...result.publicNeeds.map((demand) => `demand_requirement:${demand.id}`)
  ]);
  const candidateSignalEditions = treatment ? signalEditions : directSignalEditions;
  const directSignals = selectRelationshipSignals(candidateSignalEditions, new Set([currentSignalTargetKey]));
  const directSignalIds = new Set(directSignals.map((signal) => signal.id));
  const derivedSignals = treatment
    ? selectRelationshipSignals(candidateSignalEditions, adjacentSignalTargetKeys)
        .filter((signal) => !directSignalIds.has(signal.id))
    : [];
  const relatedSignals = [...directSignals, ...derivedSignals].slice(0, 3).map((signal) => ({
    ...signal,
    explicitRecordLink: directSignalIds.has(signal.id)
  }));
  const featuredCapabilityNames = featuredConnections
    .flatMap((connection) => connection.capabilities.slice(0, 1).map((capability) => capability.name))
    .slice(0, 3);
  const editorialExploreLinks: InternalLinkEdge[] = [
    ...relatedSignals.map((signal) => ({
      href: `/signals/${signal.slug}`,
      label: signal.title,
      detail: signal.explicitRecordLink
        ? `Explicit Mission Area record link · ${signal.matchedItemTitle}`
        : `Derived through another reviewed record on this Mission Area · ${signal.matchedItemTitle}`,
      targetType: "signal" as const,
      targetSlug: signal.slug,
      ...editorialIntelligenceRelationship(signal.explicitRecordLink),
      sortDate: signal.editionDate
    })),
    ...relatedBriefs.map((brief) => ({
      href: `/briefs/${brief.slug}`,
      label: brief.title,
      detail: "Derived through an explicitly linked organization, technology, or Public Need on this Mission Area.",
      targetType: "brief" as const,
      targetSlug: brief.slug,
      ...editorialIntelligenceRelationship(false),
      sortDate: brief.publishedAt
    }))
  ].sort((left, right) => right.sortDate.localeCompare(left.sortDate)).map(({ sortDate: _sortDate, ...link }) => link);
  const missionExploreLinks: InternalLinkEdge[] = [
    ...organizations.slice(0, 3).map((connection) => ({
      href: `/organizations/${connection.organization.slug}`,
      label: `Explore ${connection.organization.name}'s organization profile`,
      detail: connection.capabilities[0] ? `Connected through ${connection.capabilities[0].name}.` : "Reviewed for this Mission Area.",
      targetType: "organization" as const,
      targetSlug: connection.organization.slug,
      relationshipKind: "shared_capability" as const,
      provenance: "derived" as const
    })),
    ...result.publicNeeds.map((demand) => ({
      href: `/demand/${demand.slug}`,
      label: `Review Public Need: ${demand.title}`,
      detail: demand.connectingCapabilities[0]
        ? `Connected through ${demand.connectingCapabilities.map((capability) => capability.name).join(", ")}${demand.technologyCount > demand.connectingCapabilities.length ? ` and ${demand.technologyCount - demand.connectingCapabilities.length} more` : ""}.`
        : `${demand.technologyCount} reviewed ${demand.technologyCount === 1 ? "technology connects" : "technologies connect"} the records.`,
      targetType: "public_need" as const,
      targetSlug: demand.slug,
      relationshipKind: "shared_capability" as const,
      provenance: "derived" as const
    })),
    { href: `/map?mission=${result.missionArea.slug}`, label: `View all organizations connected to ${result.missionArea.name}`, targetType: "map" as const, targetSlug: result.missionArea.slug, relationshipKind: "map_path" as const, provenance: "direct" as const },
    ...editorialExploreLinks
  ];

  return (
    <PublicPageShell
      eyebrow="Mission Area and Use Case"
      title={result.missionArea.name}
      description={result.missionArea.summary}
      breadcrumbs={[
        { label: "Map", href: "/map" },
        { label: "Mission Areas", href: "/missions" },
        { label: result.missionArea.name }
      ]}
      actions={(
        <>
          <Link href={`/map?mission=${result.missionArea.slug}`} data-internal-link-role="contextual" data-internal-link-module="mission_map" className="atlas-signal-button h-10 gap-2 px-4 text-xs">Explore on the map <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
          <PublicShare title={result.missionArea.name} description={result.missionArea.summary} path={path} />
        </>
      )}
    >
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "DefinedTerm",
          name: result.missionArea.name,
          description: result.missionArea.summary,
          url: absoluteUrl(path),
          inDefinedTermSet: { "@type": "DefinedTermSet", name: "True North Map Mission Areas", url: absoluteUrl("/missions") }
        },
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Canadian organizations reviewed for ${result.missionArea.name}`,
          numberOfItems: presentationSequence.length,
          itemListElement: presentationSequence.slice(0, 100).map((connection, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: connection.organization.name,
            url: absoluteUrl(`/organizations/${connection.organization.slug}`)
          }))
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "True North Map", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Mission Areas", item: absoluteUrl("/missions") },
            { "@type": "ListItem", position: 3, name: result.missionArea.name, item: absoluteUrl(path) }
          ]
        }
      ]} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile icon={SearchCheck} label="Organizations reviewed for this mission" value={result.organizations.length} />
        <StatTile icon={Layers3} label="Mapped technologies" value={result.capabilityCount} />
        <StatTile icon={FileText} label="Separately reviewed Public Needs" value={result.publicNeeds.length} />
      </div>

      <details className="mt-5 rounded-[14px] bg-[var(--atlas-amber-soft)] px-4 py-3 text-xs leading-5 text-[var(--atlas-amber)]">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold"><ShieldAlert className="size-4 shrink-0" aria-hidden="true" />How to interpret this Mission Area</summary>
        <p className="mt-2 pl-6">This page shows reviewed True North Map assessments. It is not a released requirement, procurement priority, endorsement, customer interest, or classified guidance.</p>
      </details>

      {treatment && showTreatmentIntro ? (
        <>
          <section className="mt-7 rounded-[18px] bg-[var(--atlas-blue-soft)] px-5 py-6 sm:px-7" aria-labelledby="mission-contribution-heading">
            <p className="atlas-eyebrow">Our assessment</p>
            <h2 id="mission-contribution-heading" className="mt-2 font-[family-name:var(--font-barlow)] text-2xl font-extrabold tracking-[-0.04em] text-[var(--atlas-ink)]">How Canadian capability may contribute</h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--atlas-ink-soft)]">{treatment.contributionSummary}</p>
            {featuredCapabilityNames.length ? <p className="mt-3 text-xs leading-5 text-[var(--atlas-muted)]">The first reviewed records include {featuredCapabilityNames.join(", ")}.</p> : null}
          </section>

          <section className="mt-8" aria-labelledby="mission-featured-connections-heading">
            <p className="atlas-eyebrow">Start with the clearest reviewed connections</p>
            <h2 id="mission-featured-connections-heading" className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[var(--atlas-ink)]">Capability descriptions with the most specific mission overlap</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--atlas-muted)]">These records appear first because their published descriptions are more functionally specific to this Mission Area. The order is a discovery aid and does not express supplier preference or a recommendation.</p>
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {featuredPresentations.map(({ connection, reason }, index) => (
                <MissionOrganizationCard
                  key={connection.organization.id}
                  connection={connection}
                  relationshipContext={{ targetSlug: result.missionArea.slug, positionBand: relationshipPositionBand(positionByOrganizationId.get(connection.organization.id) ?? index), variant: "treatment", placement: "featured", featureReason: reason }}
                />
              ))}
            </div>
          </section>
        </>
      ) : null}

      {presentedPublicNeeds.length ? (
        <section className="mt-12" aria-labelledby="mission-public-needs-heading">
          <p className="atlas-eyebrow">{treatment ? `${presentedPublicNeeds.length} multi-technology connections to inspect` : "Released needs connected through this technology"}</p>
          <h2 id="mission-public-needs-heading" className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[var(--atlas-ink)]">Where the public record creates another lens</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--atlas-muted)]">{treatment ? "This bounded starting set requires at least two separately reviewed technology connections, then prioritizes Arctic-specific title overlap and relationship breadth. It does not rank or change the released needs." : "These Public Needs were reviewed separately against technologies on this page. The Mission Area does not create or change the released source."}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {presentedPublicNeeds.map((demand) => (
              <PublicCard key={demand.id} className="flex h-full flex-col">
                <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--atlas-evidence-soft)] text-[var(--atlas-evidence)]"><FileText className="size-4" aria-hidden="true" /></span>
                <h3 className="mt-4 text-base font-extrabold tracking-[-0.02em] text-[var(--atlas-ink)]">{demand.title}</h3>
                <p className="mt-2 text-xs leading-5 text-[var(--atlas-muted)]">{demand.technologyCount} {demand.technologyCount === 1 ? "technology is" : "technologies are"} connected to both records through separate human review.</p>
                {demand.connectingCapabilities.length ? (
                  <p className="mt-3 text-xs leading-5 text-[var(--atlas-muted)]">
                    Established by {demand.connectingCapabilities.map((capability, index) => (
                      <span key={capability.id}>{index ? ", " : ""}<Link href={`/capabilities/${capability.slug}`} prefetch={false} data-internal-link-role="contextual" data-internal-link-module="mission_public_need_bridge" className="atlas-prose-link font-semibold">{capability.name}</Link></span>
                    ))}.
                  </p>
                ) : null}
                <Link href={`/demand/${demand.slug}`} data-internal-link-role="contextual" data-internal-link-module="mission_public_need_bridge" className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-bold text-[var(--atlas-primary)] no-underline hover:underline">Inspect the released need <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
              </PublicCard>
            ))}
          </div>
          {treatment && result.publicNeeds.length > presentedPublicNeeds.length ? (
            <Link href={`/map?mission=${result.missionArea.slug}`} data-internal-link-role="contextual" data-internal-link-module="mission_map" className="atlas-secondary-button mt-5 h-10 w-fit gap-2 px-4 text-xs">
              Explore all {result.publicNeeds.length} connected records on the map <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          ) : null}
        </section>
      ) : null}

      {(showTreatmentIntro || (!treatment && directory.page === 1)) && relatedSignals.length ? (
        <section className="mt-12" aria-labelledby="mission-signals-heading">
          <p className="atlas-eyebrow">Developments connected to these records</p>
          <h2 id="mission-signals-heading" className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[var(--atlas-ink)]">Current Signals worth inspecting next</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--atlas-muted)]">Signals appear only when the published edition links to a Mission, Public Need, organization or technology on this page.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {relatedSignals.map((signal) => (
              <PublicCard key={signal.id} className="flex h-full flex-col">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--atlas-primary)]">Canadian Defence Signals</span>
                <h3 className="mt-3 text-base font-extrabold leading-6 text-[var(--atlas-ink)]">{signal.title}</h3>
                <p className="mt-3 line-clamp-3 text-xs leading-5 text-[var(--atlas-muted)]">{signal.summary}</p>
                <p className="mt-3 text-[11px] leading-5 text-[var(--atlas-muted)]">Connected item: {signal.matchedItemTitle}</p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--atlas-evidence)]">{signal.explicitRecordLink ? "Explicit Mission Area record link" : "Derived discovery path through a reviewed record"}</p>
                <Link href={`/signals/${signal.slug}`} data-internal-link-role="contextual" data-internal-link-module="mission_editorial" className="mt-auto inline-flex items-center gap-1 pt-5 text-xs font-bold text-[var(--atlas-primary)] no-underline hover:underline">Read Signal<span className="sr-only">: {signal.title}</span> <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
              </PublicCard>
            ))}
          </div>
        </section>
      ) : null}

      {relatedBriefs.length ? (
        <section className="mt-12" aria-labelledby="mission-briefs-heading">
          <p className="atlas-eyebrow">Read the wider context</p>
          <h2 id="mission-briefs-heading" className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[var(--atlas-ink)]">Defence Briefs connected to this mission</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--atlas-muted)]">Articles appear here when their linked organizations, technologies, or released Public Needs also appear in this Mission Area.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {relatedBriefs.map((brief) => (
              <PublicCard key={brief.id} className="flex h-full flex-col">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--atlas-primary)]">{getBriefPresentation(brief).topic}</span>
                <h3 className="mt-3 text-base font-extrabold leading-6 text-[var(--atlas-ink)]">{brief.title}</h3>
                <p className="mt-3 line-clamp-3 text-xs leading-5 text-[var(--atlas-muted)]">{brief.standfirst}</p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--atlas-evidence)]">Derived discovery path through a reviewed record</p>
                <Link href={`/briefs/${brief.slug}`} data-internal-link-role="contextual" data-internal-link-module="mission_editorial" className="mt-auto inline-flex items-center gap-1 pt-5 text-xs font-bold text-[var(--atlas-primary)] no-underline hover:underline">Read Brief<span className="sr-only">: {brief.title}</span> <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
              </PublicCard>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-12" aria-labelledby="mission-organizations-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="atlas-eyebrow">Our assessment</p>
            <h2 id="mission-organizations-heading" className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[var(--atlas-ink)]">{treatment ? "Remaining reviewed connections" : "Canadian technology mapped to this mission"}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--atlas-muted)]">{treatment ? "Each published connection appears once. The remaining set keeps the same deterministic presentation order without expressing supplier preference." : "Every record below shows the technology reviewed for this mission and its organization-specific reason. Organizations are ordered by the strongest published assessment on this page, then alphabetically, not ranked or recommended."}</p>
          </div>
          <Link href={`/map?mission=${result.missionArea.slug}`} data-internal-link-role="contextual" data-internal-link-module="mission_map" className="atlas-secondary-button h-10 w-fit gap-2 px-4 text-xs">See every map point <Compass className="size-3.5" aria-hidden="true" /></Link>
        </div>

        {directory.items.length ? (
          <>
            <div className="mt-7 grid gap-5 lg:grid-cols-2">
              {directory.items.map((connection, index) => (
                <MissionOrganizationCard
                  key={connection.organization.id}
                  connection={connection}
                  relationshipContext={treatment || control ? {
                    targetSlug: result.missionArea.slug,
                    positionBand: relationshipPositionBand(positionByOrganizationId.get(connection.organization.id) ?? (directory.start + index - 1)),
                    variant: treatment ? "treatment" : "control",
                    placement: "complete"
                  } : undefined}
                />
              ))}
            </div>
            <PaginationNav path={path} page={directory.page} totalPages={directory.totalPages} start={directory.start} end={directory.end} total={directory.total} itemLabel="organizations" />
          </>
        ) : treatment && featuredConnections.length ? null : (
          <div className="mt-7"><EmptyCoverage title="No reviewed connections yet" detail="The Mission Area remains visible as a coverage gap until reviewed Canadian technology can support it." /></div>
        )}
      </section>
      <ExploreNext
        links={missionExploreLinks}
        module="mission_area"
        currentHref={path}
        title="Continue through the mission landscape"
        description="Move between the strongest reviewed organization paths, Public Needs connected through named capabilities, the focused map, and direct or clearly labelled derived editorial paths."
      />
      <CollectionContinuation
        title="Carry this mission landscape into the next decision."
        description="Explore every mapped organization, compare released Public Needs, or save the strongest records to a private Working List."
        links={[
          { label: "Explore on the map", href: `/map?mission=${result.missionArea.slug}` },
          { label: "View Working Lists", href: "/collections" }
        ]}
      />
      <NorthSignalInline placement="newsletter_inline_mission" trigger="mission_detail_complete" className="mt-8" />
    </PublicPageShell>
  );
}
