import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, FileText, ShieldAlert } from "lucide-react";
import { EvidenceList } from "@/components/atlas/evidence-list";
import { ExploreNext } from "@/components/atlas/explore-next";
import { ExternalSourceLink } from "@/components/atlas/internal-link";
import { NorthSignalInline } from "@/components/atlas/north-signal-signup";
import { CollectionContinuation, EmptyCoverage, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { PublicShare } from "@/components/atlas/public-share";
import { RelationshipResultLink } from "@/components/atlas/relationship-result-link";
import { JsonLd } from "@/components/seo/json-ld";
import { getPublishedDefenceBriefsForRecord } from "@/lib/atlas/briefs";
import { editorialIntelligenceRelationship, type InternalLinkEdge } from "@/lib/atlas/internal-link-graph";
import { evidenceStrengthLabel, publicLanguage } from "@/lib/atlas/presentation";
import { getRelationshipPilotTreatment, isRelationshipPilotControl, type RelationshipPilotTreatment } from "@/lib/atlas/relationship-pilot";
import { demandRelationshipAssessmentCopy, demandRelationshipAssessmentRole, orderDemandRelationships, relationshipPositionBand, selectDemandMissionLenses, selectFeaturedDemandRelationships, selectRelationshipSignals, type DemandRelationshipAssessmentRole } from "@/lib/atlas/relationship-presentation";
import { getAtlasDemandBySlug, getAtlasMissionLinksForCapabilities } from "@/lib/atlas/repository";
import { getPublishedSignals, getPublishedSignalsForRecord } from "@/lib/atlas/signals";
import { socialMetadata } from "@/lib/seo/social";
import { absoluteUrl } from "@/lib/site";
import type { AtlasDemandRequirement, AtlasMissionRecordConnection } from "@/types/atlas";

export const revalidate = 300;

type RelatedDemandSignal = ReturnType<typeof selectRelationshipSignals>[number] & { explicitRecordLink: boolean };

const demandAssessmentRoleLabel: Record<DemandRelationshipAssessmentRole, string> = {
  direct: "Direct functional overlap",
  enabling: "Enabling system",
  broader: "Broader published connection"
};

export async function generateStaticParams() {
  // Demand pages render on demand so production builds do not depend on a
  // successful bulk database read at build time.
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const demand = await getAtlasDemandBySlug(slug);
  if (!demand) return { title: "Demand statement not found", robots: { index: false, follow: false } };
  const treatment = getRelationshipPilotTreatment("public_need", demand.slug);
  const path = `/demand/${demand.slug}`;
  const title = treatment?.metadataTitle ?? demand.title;
  const description = treatment?.metadataDescription ?? demand.problemStatement;
  return { title, description, alternates: { canonical: path }, ...socialMetadata({ title, description, path, eyebrow: "Released Defence need", detail: demand.source.publisher }) };
}

function PublicNeedSource({ demand, treatment = false }: { demand: AtlasDemandRequirement; treatment?: boolean }) {
  return (
    <>
      <PublicCard title="Where this defence need comes from" eyebrow={publicLanguage.sourceFact}>
        <dl className="grid gap-3 text-xs">
          <div><dt className="text-[var(--atlas-muted)]">Publisher</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">{demand.source.publisher}</dd></div>
          {demand.source.sourceKind ? <div><dt className="text-[var(--atlas-muted)]">Signal type</dt><dd className="mt-1 font-semibold capitalize text-[var(--atlas-ink-soft)]">{demand.source.sourceKind.replaceAll("_", " ")}</dd></div> : null}
          {demand.source.commitmentLevel ? <div><dt className="text-[var(--atlas-muted)]">Commitment</dt><dd className="mt-1 font-semibold capitalize text-[var(--atlas-ink-soft)]">{demand.source.commitmentLevel.replaceAll("_", " ")}</dd></div> : null}
          <div><dt className="text-[var(--atlas-muted)]">Document</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">{demand.source.title}</dd></div>
          <div><dt className="text-[var(--atlas-muted)]">Published</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">{demand.source.publishedOn ?? "Date not published"}</dd></div>
        </dl>
        <p className="mt-4 text-xs leading-5 text-[var(--atlas-muted)]">{demand.source.summary}</p>
        <div className={treatment
          ? "mt-4 rounded-[14px] bg-[var(--atlas-surface-muted)] p-4"
          : "mt-4 rounded-2xl border border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] p-4"}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--atlas-muted)]">Relevant passage{demand.source.sourceLocator ? ` · ${demand.source.sourceLocator}` : ""}</p>
          <blockquote className="mt-2 text-xs leading-5 text-[var(--atlas-ink-soft)]">{demand.source.sourceExcerpt}</blockquote>
        </div>
      </PublicCard>
      <PublicCard title="What supports this defence need" eyebrow="Read the public record">
        <EvidenceList citations={demand.citations} />
      </PublicCard>
    </>
  );
}

function LegacyDemandContent({ demand, controlSlug }: { demand: AtlasDemandRequirement; controlSlug: string | null }) {
  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <PublicCard title="What needs to change" eyebrow={publicLanguage.sourceFact}>
            <p className="text-sm leading-6 text-[var(--atlas-muted)]">{demand.problemStatement}</p>
          </PublicCard>
          <PublicCard title="What success looks like" eyebrow={publicLanguage.sourceFact}>
            <p className="text-sm leading-6 text-[var(--atlas-muted)]">{demand.desiredEndState}</p>
          </PublicCard>
          <PublicCard title="Organizations with technology that may be relevant" eyebrow={`${demand.matches.length} reviewed ${demand.matches.length === 1 ? "assessment" : "assessments"}`}>
            {demand.matches.length ? (
              <>
              <p className="mb-4 text-xs leading-5 text-[var(--atlas-muted)]">Each connection pairs the organization-specific reason it may be relevant with the public evidence that supports it.</p>
              <div className="divide-y divide-[var(--atlas-border)]">
                {demand.matches.map(({ organization, capability, match }, index) => (
                  <article key={match.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        {controlSlug ? (
                          <RelationshipResultLink href={`/organizations/${organization.slug}`} prefetch={false} targetType="public_need" targetSlug={controlSlug} destinationType="organization" destinationSlug={organization.slug} positionBand={relationshipPositionBand(index)} variant="control" placement="complete" className="text-sm font-bold text-[var(--atlas-primary)] no-underline hover:underline">{organization.name}</RelationshipResultLink>
                        ) : (
                          <Link href={`/organizations/${organization.slug}`} prefetch={false} data-internal-link-role="contextual" data-internal-link-module="public_need_matches" className="text-sm font-bold text-[var(--atlas-primary)] no-underline hover:underline">{organization.name}</Link>
                        )}
                        {controlSlug ? (
                          <RelationshipResultLink href={`/capabilities/${capability.slug}`} targetType="public_need" targetSlug={controlSlug} destinationType="capability" destinationSlug={capability.slug} positionBand={relationshipPositionBand(index)} variant="control" placement="complete" className="mt-1 block text-xs font-semibold text-[var(--atlas-ink-soft)] no-underline hover:underline">{capability.name}</RelationshipResultLink>
                        ) : (
                          <Link href={`/capabilities/${capability.slug}`} data-internal-link-role="contextual" data-internal-link-module="public_need_matches" className="mt-1 block text-xs font-semibold text-[var(--atlas-ink-soft)] no-underline hover:underline">{capability.name}</Link>
                        )}
                      </div>
                      <span className="w-fit rounded bg-[var(--atlas-primary-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--atlas-primary)]">{evidenceStrengthLabel(match.confidence)} public evidence</span>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-[var(--atlas-ink-soft)]">{match.alignmentSummary}</p>
                    <div className="mt-3 rounded-xl border border-[var(--atlas-border)] bg-white/70 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--atlas-muted)]">What supports this assessment</p>
                      {match.citations.length ? <EvidenceList citations={match.citations} /> : <p className="mt-2 text-xs leading-5 text-[var(--atlas-muted)]">The reviewed technology profile and released defence need support this assessment. Open both records before acting.</p>}
                    </div>
                  </article>
                ))}
              </div>
              </>
            ) : <EmptyCoverage title="No reviewed technology match is published yet" detail="This public problem remains an active research target. A technology will only appear here after a person reviews the evidence and publishes the connection." />}
          </PublicCard>
          <EvidenceLimits />
        </div>

        <aside className="space-y-5"><PublicNeedSource demand={demand} /></aside>
      </div>
    </>
  );
}

function EvidenceLimits() {
  return (
    <PublicCard title="Evidence limits" eyebrow={publicLanguage.coverageGap}>
      <ul className="space-y-2 text-xs leading-5 text-[var(--atlas-muted)]">
        <li className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-[var(--atlas-signal)]" />An empty result means the research is incomplete, not that Canada lacks relevant technology.</li>
        <li className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-[var(--atlas-signal)]" />Public statements do not establish procurement timing, budgets, eligibility, or endorsement.</li>
        <li className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-[var(--atlas-signal)]" />Every future assessment must remain source-linked and open to editorial review.</li>
      </ul>
    </PublicCard>
  );
}

function TreatmentResult({
  entry,
  treatment,
  positionIndex,
  placement
}: {
  entry: AtlasDemandRequirement["matches"][number];
  treatment: RelationshipPilotTreatment;
  positionIndex: number;
  placement: "featured" | "complete";
}) {
  const { organization, capability, match } = entry;
  const positionBand = relationshipPositionBand(positionIndex);
  const assessmentRole = demandRelationshipAssessmentRole(entry, treatment);
  return (
    <article className={placement === "featured" ? "rounded-[14px] bg-white p-5" : "py-5 first:pt-0 last:pb-0"}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-bold tracking-[-0.02em] text-[var(--atlas-ink)]">
            <RelationshipResultLink href={`/organizations/${organization.slug}`} prefetch={false} targetType="public_need" targetSlug={treatment.slug} destinationType="organization" destinationSlug={organization.slug} positionBand={positionBand} variant="treatment" placement={placement} className="no-underline hover:text-[var(--atlas-primary)] hover:underline">
              {organization.name}
            </RelationshipResultLink>
          </h3>
          <RelationshipResultLink href={`/capabilities/${capability.slug}`} targetType="public_need" targetSlug={treatment.slug} destinationType="capability" destinationSlug={capability.slug} positionBand={positionBand} variant="treatment" placement={placement} className="mt-1 block text-xs font-semibold text-[var(--atlas-primary)] no-underline hover:underline">
            {capability.name}
          </RelationshipResultLink>
        </div>
        <span className="w-fit rounded bg-[var(--atlas-primary-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--atlas-primary)]">{evidenceStrengthLabel(match.confidence)} public evidence</span>
      </div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--atlas-muted)]">Source-backed capability</p>
      <p className="mt-1 text-xs leading-5 text-[var(--atlas-ink-soft)]">{capability.summary}</p>
      <p className={`mt-3 text-[10px] font-bold uppercase tracking-[0.1em] ${assessmentRole === "broader" ? "text-[var(--atlas-amber)]" : "text-[var(--atlas-muted)]"}`}>Our assessment · {demandAssessmentRoleLabel[assessmentRole]}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--atlas-muted)]">{demandRelationshipAssessmentCopy(assessmentRole, match.alignmentSummary)}</p>
      <details className="mt-3 rounded-[14px] bg-[var(--atlas-surface-muted)] px-4 py-3">
        <summary className="flex min-h-11 cursor-pointer items-center text-xs font-bold text-[var(--atlas-ink-soft)]">Review supporting public evidence</summary>
        <div className="mt-3">
          {match.citations.length ? <EvidenceList citations={match.citations} /> : <p className="text-xs leading-5 text-[var(--atlas-muted)]">The reviewed technology profile and released defence need support this assessment. Open both records before acting.</p>}
        </div>
      </details>
    </article>
  );
}

function TreatmentDemandContent({
  demand,
  treatment,
  orderedMatches,
  relatedMissions,
  relatedSignals
}: {
  demand: AtlasDemandRequirement;
  treatment: RelationshipPilotTreatment;
  orderedMatches: AtlasDemandRequirement["matches"];
  relatedMissions: AtlasMissionRecordConnection[];
  relatedSignals: RelatedDemandSignal[];
}) {
  const featured = selectFeaturedDemandRelationships(orderedMatches, treatment);
  const featuredIds = new Set(featured.map((entry) => entry.match.id));
  const remainingMatches = orderedMatches.filter((entry) => !featuredIds.has(entry.match.id));
  const presentedMissions = selectDemandMissionLenses(relatedMissions);
  const positionByMatchId = new Map(orderedMatches.map((entry, index) => [entry.match.id, index]));
  const featuredCapabilityNames = featured.slice(0, 3).map(({ capability }) => capability.name);
  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <PublicCard title="What needs to change" eyebrow={publicLanguage.sourceFact}>
            <p className="text-sm leading-6 text-[var(--atlas-muted)]">{demand.problemStatement}</p>
          </PublicCard>
          <PublicCard title="What success looks like" eyebrow={publicLanguage.sourceFact}>
            <p className="text-sm leading-6 text-[var(--atlas-muted)]">{demand.desiredEndState}</p>
          </PublicCard>
        </div>
        <aside className="space-y-5"><PublicNeedSource demand={demand} treatment /></aside>
      </div>

      <section className="mt-7 rounded-[18px] bg-[var(--atlas-blue-soft)] px-5 py-6 sm:px-7" aria-labelledby="public-need-contribution-heading">
        <p className="atlas-eyebrow">{publicLanguage.assessment}</p>
        <h2 id="public-need-contribution-heading" className="mt-2 font-[family-name:var(--font-barlow)] text-2xl font-extrabold tracking-[-0.04em] text-[var(--atlas-ink)]">How Canadian capability may contribute</h2>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--atlas-ink-soft)]">{treatment.contributionSummary}</p>
        {featuredCapabilityNames.length ? <p className="mt-3 text-xs leading-5 text-[var(--atlas-muted)]">The first reviewed records include {featuredCapabilityNames.join(", ")}.</p> : null}
      </section>

      <section className="mt-8" aria-labelledby="public-need-featured-heading">
        <p className="atlas-eyebrow">Start with the clearest reviewed connections</p>
        <h2 id="public-need-featured-heading" className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[var(--atlas-ink)]">Specific capabilities to inspect first</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--atlas-muted)]">These records appear first because their published descriptions are more functionally specific to the released need. The order is a discovery aid and does not express supplier preference, endorsement or eligibility.</p>
        {featured.length ? <div className="mt-6 grid gap-4 lg:grid-cols-2">{featured.map((entry) => <TreatmentResult key={entry.match.id} entry={entry} treatment={treatment} positionIndex={positionByMatchId.get(entry.match.id) ?? 0} placement="featured" />)}</div> : <EmptyCoverage title="No connection meets the featured threshold yet" detail="Every published connection remains available below; the feature is intentionally left empty rather than padded with broader adjacency." />}
      </section>

      {remainingMatches.length ? (
        <section className="mt-12" aria-labelledby="public-need-complete-heading">
          <p className="atlas-eyebrow">{remainingMatches.length} additional reviewed {remainingMatches.length === 1 ? "assessment" : "assessments"}</p>
          <h2 id="public-need-complete-heading" className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[var(--atlas-ink)]">Remaining published connections</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--atlas-muted)]">The rest of the published set remains available once, with supporting evidence collapsed until it is useful.</p>
          <div className="mt-6 divide-y divide-[var(--atlas-border)] rounded-[18px] bg-white px-5 py-1 sm:px-7">{remainingMatches.map((entry) => <TreatmentResult key={entry.match.id} entry={entry} treatment={treatment} positionIndex={positionByMatchId.get(entry.match.id) ?? 0} placement="complete" />)}</div>
        </section>
      ) : null}

      {presentedMissions.length ? (
        <section className="mt-12" aria-labelledby="public-need-missions-heading">
          <p className="atlas-eyebrow">Related discovery lenses</p>
          <h2 id="public-need-missions-heading" className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[var(--atlas-ink)]">Mission areas connected through reviewed technology</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--atlas-muted)]">These are True North Map discovery lenses, not released requirements or procurement direction.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {presentedMissions.map(({ missionArea, capabilityCount, connectingCapabilities }) => (
              <PublicCard key={missionArea.id} className="flex h-full flex-col">
                <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--atlas-blue-soft)] text-[var(--atlas-ink)]"><FileText className="size-4" aria-hidden="true" /></span>
                <h3 className="mt-4 text-base font-extrabold tracking-[-0.02em] text-[var(--atlas-ink)]">{missionArea.name}</h3>
                <p className="mt-2 text-xs leading-5 text-[var(--atlas-muted)]">{capabilityCount} {capabilityCount === 1 ? "technology connects" : "technologies connect"} this lens to the released need through separate reviewed records.</p>
                {connectingCapabilities.length ? (
                  <p className="mt-3 text-xs leading-5 text-[var(--atlas-muted)]">
                    Established by {connectingCapabilities.map((capability, index) => (
                      <span key={capability.id}>{index ? ", " : ""}<Link href={`/capabilities/${capability.slug}`} prefetch={false} data-internal-link-role="contextual" data-internal-link-module="public_need_mission_bridge" className="atlas-prose-link font-semibold">{capability.name}</Link></span>
                    ))}.
                  </p>
                ) : null}
                <Link href={`/missions/${missionArea.slug}`} data-internal-link-role="contextual" data-internal-link-module="public_need_mission_bridge" className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-bold text-[var(--atlas-primary)] no-underline hover:underline">Explore the Mission area <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
              </PublicCard>
            ))}
          </div>
        </section>
      ) : null}

      {relatedSignals.length ? (
        <section className="mt-12" aria-labelledby="public-need-signals-heading">
          <p className="atlas-eyebrow">Developments connected to these records</p>
          <h2 id="public-need-signals-heading" className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[var(--atlas-ink)]">Current Signals worth inspecting next</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {relatedSignals.map((signal) => (
              <PublicCard key={signal.id} className="flex h-full flex-col">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--atlas-primary)]">Canadian Defence Signals</span>
                <h3 className="mt-3 text-base font-extrabold leading-6 text-[var(--atlas-ink)]">{signal.title}</h3>
                <p className="mt-3 line-clamp-3 text-xs leading-5 text-[var(--atlas-muted)]">{signal.summary}</p>
                <p className="mt-3 text-[11px] leading-5 text-[var(--atlas-muted)]">Connected item: {signal.matchedItemTitle}</p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--atlas-evidence)]">{signal.explicitRecordLink ? "Explicit Defence need record link" : "Derived discovery path through a reviewed record"}</p>
                <Link href={`/signals/${signal.slug}`} data-internal-link-role="contextual" data-internal-link-module="public_need_editorial" className="mt-auto inline-flex items-center gap-1 pt-5 text-xs font-bold text-[var(--atlas-primary)] no-underline hover:underline">Read Signal<span className="sr-only">: {signal.title}</span> <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
              </PublicCard>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-12"><EvidenceLimits /></div>
    </>
  );
}

export default async function DemandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const demand = await getAtlasDemandBySlug(slug);
  if (!demand) notFound();
  const treatment = getRelationshipPilotTreatment("public_need", demand.slug);
  const controlSlug = isRelationshipPilotControl("public_need", demand.slug) ? demand.slug : null;
  const capabilityIds = demand.matches.map(({ capability }) => capability.id);
  const [relatedMissions, signalEditions, directSignalEditions, relatedBriefs] = await Promise.all([
    getAtlasMissionLinksForCapabilities(capabilityIds),
    treatment ? getPublishedSignals(30) : Promise.resolve([]),
    treatment ? Promise.resolve([]) : getPublishedSignalsForRecord("demand_requirement", demand.id, 3),
    getPublishedDefenceBriefsForRecord("demand_requirement", demand.id, 3)
  ]);
  const orderedMatches = treatment ? orderDemandRelationships(demand.matches, treatment) : demand.matches;
  const currentSignalTargetKey = `demand_requirement:${demand.id}`;
  const adjacentSignalTargetKeys = new Set([
    ...orderedMatches.slice(0, 5).map(({ organization }) => `organization:${organization.id}`),
    ...orderedMatches.slice(0, 5).map(({ capability }) => `capability:${capability.id}`),
    ...relatedMissions.map(({ missionArea }) => `mission_area:${missionArea.id}`)
  ]);
  const candidateSignalEditions = treatment ? signalEditions : directSignalEditions;
  const directSignals = selectRelationshipSignals(candidateSignalEditions, new Set([currentSignalTargetKey]));
  const directSignalIds = new Set(directSignals.map((signal) => signal.id));
  const derivedSignals = treatment
    ? selectRelationshipSignals(candidateSignalEditions, adjacentSignalTargetKeys)
        .filter((signal) => !directSignalIds.has(signal.id))
    : [];
  const relatedSignals: RelatedDemandSignal[] = [...directSignals, ...derivedSignals].slice(0, 3).map((signal) => ({
    ...signal,
    explicitRecordLink: directSignalIds.has(signal.id)
  }));
  const path = `/demand/${demand.slug}`;
  const editorialExploreLinks: InternalLinkEdge[] = [
    ...relatedSignals.map((signal) => ({
      href: `/signals/${signal.slug}`,
      label: signal.title,
      detail: signal.explicitRecordLink
        ? `Explicit Defence need record link · ${signal.matchedItemTitle}`
        : `Derived through another reviewed record on this Defence need · ${signal.matchedItemTitle}`,
      targetType: "signal" as const,
      targetSlug: signal.slug,
      ...editorialIntelligenceRelationship(signal.explicitRecordLink),
      sortDate: signal.editionDate
    })),
    ...relatedBriefs.map((brief) => ({
      href: `/briefs/${brief.slug}`,
      label: brief.title,
      detail: "Explicit Brief record link",
      targetType: "brief" as const,
      targetSlug: brief.slug,
      ...editorialIntelligenceRelationship(true),
      sortDate: brief.publishedAt
    }))
  ].sort((left, right) => right.sortDate.localeCompare(left.sortDate)).map(({ sortDate: _sortDate, ...link }) => link);
  const demandExploreLinks: InternalLinkEdge[] = [
    ...orderedMatches.slice(0, 3).map(({ organization, capability }) => ({
      href: `/organizations/${organization.slug}`,
      label: `Explore ${organization.name}'s organization profile`,
      detail: `Connected through ${capability.name}.`,
      targetType: "organization" as const,
      targetSlug: organization.slug,
      relationshipKind: "reviewed_public_need" as const,
      provenance: "direct" as const
    })),
    ...relatedMissions.map(({ missionArea, capabilityCount, connectingCapabilities }) => ({
      href: `/missions/${missionArea.slug}`,
      label: `Explore Mission area: ${missionArea.name}`,
      detail: connectingCapabilities[0]
        ? `Connected through ${connectingCapabilities.map((capability) => capability.name).join(", ")}${capabilityCount > connectingCapabilities.length ? ` and ${capabilityCount - connectingCapabilities.length} more` : ""}.`
        : `${capabilityCount} reviewed ${capabilityCount === 1 ? "technology connects" : "technologies connect"} the records.`,
      targetType: "mission_area" as const,
      targetSlug: missionArea.slug,
      relationshipKind: "shared_capability" as const,
      provenance: "derived" as const
    })),
    { href: `/map?demand=${demand.slug}`, label: `View organizations connected to ${demand.title}`, targetType: "map" as const, targetSlug: demand.slug, relationshipKind: "map_path" as const, provenance: "direct" as const },
    ...editorialExploreLinks
  ];

  return (
    <PublicPageShell
      eyebrow={`Public demand signal · ${demand.source.publisher}`}
      title={demand.title}
      description={demand.source.summary}
      breadcrumbs={[{ label: "Map", href: "/map" }, { label: "Defence needs", href: "/demand" }, { label: demand.title }]}
      actions={<>
        <PublicShare title={demand.title} description={demand.problemStatement} path={path} />
        <ExternalSourceLink href={demand.source.sourceUrl} variant="plain" className="h-10 items-center rounded-md bg-[var(--atlas-primary)] px-4 text-xs font-semibold text-white no-underline hover:bg-[var(--atlas-primary-hover)] hover:no-underline">
          Read the original source
        </ExternalSourceLink>
      </>}
    >
      {treatment ? <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: demand.title,
          description: demand.problemStatement,
          url: absoluteUrl(path),
          about: { "@type": "DefinedTerm", name: demand.title, description: demand.desiredEndState }
        },
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Reviewed Canadian capability connections for ${demand.title}`,
          numberOfItems: orderedMatches.length,
          itemListElement: orderedMatches.slice(0, 100).map(({ organization, capability }, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: `${capability.name} · ${organization.name}`,
            url: absoluteUrl(`/capabilities/${capability.slug}`)
          }))
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "True North Map", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Defence needs", item: absoluteUrl("/demand") },
            { "@type": "ListItem", position: 3, name: demand.title, item: absoluteUrl(path) }
          ]
        }
      ]} /> : null}
      {treatment ? (
        <TreatmentDemandContent demand={demand} treatment={treatment} orderedMatches={orderedMatches} relatedMissions={relatedMissions} relatedSignals={relatedSignals} />
      ) : (
        <>
          <LegacyDemandContent demand={demand} controlSlug={controlSlug} />
          {relatedSignals.length ? <section className="mt-12" aria-labelledby="public-need-signals-heading">
            <p className="atlas-eyebrow">Defence Signals</p>
            <h2 id="public-need-signals-heading" className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[var(--atlas-ink)]">Developments connected to this Defence need</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">{relatedSignals.map((signal) => <PublicCard key={signal.id} className="flex h-full flex-col"><h3 className="text-base font-extrabold leading-6 text-[var(--atlas-ink)]">{signal.title}</h3><p className="mt-3 line-clamp-3 text-xs leading-5 text-[var(--atlas-muted)]">{signal.summary}</p><p className="mt-3 text-[11px] leading-5 text-[var(--atlas-muted)]">Connected item: {signal.matchedItemTitle}</p><p className="mt-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--atlas-evidence)]">Explicit Defence need record link</p><Link href={`/signals/${signal.slug}`} data-internal-link-role="contextual" data-internal-link-module="public_need_editorial" className="mt-auto inline-flex items-center gap-1 pt-5 text-xs font-bold text-[var(--atlas-primary)] no-underline hover:underline">Read the Defence Signal <ArrowRight className="size-3.5" aria-hidden="true" /></Link></PublicCard>)}</div>
          </section> : null}
        </>
      )}
      <ExploreNext
        links={demandExploreLinks}
        module="public_need"
        currentHref={path}
        title="Continue from the defence need into the evidence graph"
        description="Follow reviewed organization connections, Mission areas derived through named capabilities, the focused map, and direct or clearly labelled derived editorial paths."
      />
      <div className="mt-5 flex items-start gap-3 rounded-[14px] bg-[var(--atlas-amber-soft)] px-4 py-3 text-xs leading-5 text-[var(--atlas-amber)]">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>{demand.publicCaveat}</p>
      </div>
      <CollectionContinuation
        title="Carry the defence need into a practical search."
        description="Open the mapped view, inspect potentially relevant organizations, and save records and evidence to a private Shortlist."
        links={[
          { label: "Explore on the map", href: `/map?demand=${demand.slug}` },
          { label: "My shortlists", href: "/collections" }
        ]}
      />
      <NorthSignalInline placement="newsletter_inline_demand" trigger="public_need_complete" className="mt-8" />
    </PublicPageShell>
  );
}
