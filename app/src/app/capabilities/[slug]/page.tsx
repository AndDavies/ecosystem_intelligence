import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookmarkPlus, Building2, Download, Handshake } from "lucide-react";
import { AlignmentMatchCard } from "@/components/atlas/alignment-match-card";
import { EvidenceList } from "@/components/atlas/evidence-list";
import { JsonLd } from "@/components/seo/json-ld";
import { CollectionContinuation, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { PublicShare } from "@/components/atlas/public-share";
import { evidenceStrengthLabel, organizationKindLabel, publicLanguage, publicSourceCountLabel } from "@/lib/atlas/presentation";
import { getAtlasCapabilityBySlug } from "@/lib/atlas/repository";
import { safeAtlasReturn } from "@/lib/atlas/return-path";
import { absoluteUrl } from "@/lib/site";
import { socialMetadata } from "@/lib/seo/social";
import { formatDate, toTitleCase } from "@/lib/utils";

// Safe map-return context is query-string state. Render the route dynamically
// while the bounded dossier loader retains its five-minute server cache.
export const dynamic = "force-dynamic";

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

export default async function CapabilityPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const publicCapability = await getAtlasCapabilityBySlug(slug);
  if (!publicCapability) notFound();

  return <PublicCapabilityPage organization={publicCapability.organization} capability={publicCapability.capability} mapReturnTo={safeAtlasReturn(query.returnTo)} />;
}

function PublicCapabilityPage({
  organization,
  capability,
  mapReturnTo
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
  mapReturnTo: string;
}) {
  const citations = [
    ...capability.citations,
    ...capability.missionMatches.flatMap((match) => match.citations),
    ...capability.demandMatches.flatMap((match) => match.citations)
  ];
  const hasPublishedAlignment = capability.missionMatches.length > 0 || capability.demandMatches.length > 0;
  const capabilityPath = `/capabilities/${capability.slug}?returnTo=${encodeURIComponent(mapReturnTo)}`;
  const evidenceLimits = capabilityEvidenceLimits(capability);

  return (
    <PublicPageShell
      variant="dossier"
      eyebrow="Capability profile"
      title={capability.name}
      description={capability.summary}
      breadcrumbs={[
        { label: "Map", href: mapReturnTo },
        { label: "Organizations", href: "/organizations" },
        { label: organization.name, href: `/organizations/${organization.slug}?returnTo=${encodeURIComponent(mapReturnTo)}` },
        { label: capability.name }
      ]}
      actions={
        <>
          <Link href={`/collections?addType=capability&addId=${capability.id}&returnTo=${encodeURIComponent(capabilityPath)}`} className="atlas-primary-button h-10 gap-2 px-4 text-xs">
            <BookmarkPlus className="size-4" /> Add to Working List
          </Link>
          <Link href={`/connect/${organization.slug}`} className="atlas-secondary-button h-10 w-full gap-2 px-4 text-xs sm:w-auto">
            <Handshake className="size-4" /> Request an introduction
          </Link>
          <Link href={`/api/export?type=capability-dossier&slug=${capability.slug}`} className="atlas-secondary-button h-10 gap-2 px-4 text-xs">
            <Download className="size-4" /> Download profile
          </Link>
          <PublicShare title={capability.name} description={capability.summary} path={`/capabilities/${capability.slug}`} />
          <Link href={`/organizations/${organization.slug}?returnTo=${encodeURIComponent(mapReturnTo)}`} prefetch={false} className="atlas-secondary-button h-10 gap-2 px-4 text-xs">
            Explore {organization.name} <ArrowRight className="size-4" />
          </Link>
        </>
      }
    >
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Product", name: capability.name, description: capability.summary, brand: { "@type": "Organization", name: organization.name, url: absoluteUrl(`/organizations/${organization.slug}`) }, url: absoluteUrl(`/capabilities/${capability.slug}`) },
        { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Ecosystem Map", item: absoluteUrl("/map") }, { "@type": "ListItem", position: 2, name: "Organizations", item: absoluteUrl("/organizations") }, { "@type": "ListItem", position: 3, name: organization.name, item: absoluteUrl(`/organizations/${organization.slug}`) }, { "@type": "ListItem", position: 4, name: capability.name, item: absoluteUrl(`/capabilities/${capability.slug}`) }] }
      ]} />
      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-5 lg:order-2">
          <PublicCard title="What it enables" eyebrow={capability.capabilityType ?? "Reviewed technology"} className="atlas-tonal-surface atlas-tonal-paper">
            <div className="grid gap-5 sm:grid-cols-2">
              <CapabilityList label="Core features" values={capability.coreFeatures} />
              <CapabilityList label="Defence and security uses" values={capability.defenceApplications} />
              <CapabilityList label="What sets it apart" values={capability.novelty} empty="No source-supported differentiators are published yet." />
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--atlas-muted)]">Evidence of maturity</h3>
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

          {hasPublishedAlignment ? <PublicCard title="Where this capability could contribute." eyebrow="Reviewed Mission Areas and released Public Needs" className="atlas-tonal-surface atlas-tonal-paper">
            <p className="mb-5 max-w-3xl text-sm leading-6 text-[var(--atlas-muted)]">See how the documented capability connects to reviewed Mission Areas and released Public Needs—and why each connection may be worth a conversation.</p>
            {capability.missionMatches.length ? (
              <div className="space-y-3"><h3 className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--atlas-ink)]">Mission Areas</h3>
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
              <div className={capability.missionMatches.length ? "mt-6 space-y-3 border-t border-[var(--atlas-border)] pt-6" : "space-y-3"}><h3 className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--atlas-ink)]">Released Public Needs</h3>
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

          {organization.programs.length ? (
            <PublicCard title="Public programs and contracts" eyebrow="Organization-level public record" className="atlas-tonal-surface atlas-tonal-paper">
              <p className="mb-5 max-w-3xl text-sm leading-6 text-[var(--atlas-muted)]">These records document the organization&apos;s public participation. They do not establish that this capability formed part of every program or contract.</p>
              <ol className="divide-y divide-[var(--atlas-border)] border-y border-[var(--atlas-border)]">
                {organization.programs.map((participation) => (
                  <li key={participation.id} className="py-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-extrabold text-[var(--atlas-ink)]">{participation.programName}</h3>
                        <p className="mt-1 text-[13px] font-semibold text-[var(--atlas-primary)]">{participation.participationType}</p>
                        {participation.programOperatorName ? <p className="mt-1 text-[13px] text-[var(--atlas-muted)]">Sponsor or operator: {participation.programOperatorName}</p> : null}
                      </div>
                      <p className="text-[13px] font-semibold text-[var(--atlas-muted)]">{participation.lifecycleStage ? toTitleCase(participation.lifecycleStage) : "Status not published"}{participation.announcedOn ? ` · ${formatDate(participation.announcedOn)}` : ""}</p>
                    </div>
                    {participation.externalIdentifiers.length ? <p className="mt-3 break-words text-[12px] font-semibold text-[var(--atlas-muted)]">{participation.externalIdentifiers.map((identifier) => `${toTitleCase(identifier.kind)} ${identifier.value}`).join(" · ")}</p> : null}
                    {participation.programUrl ? <a href={participation.programUrl} target="_blank" rel="noreferrer" data-launch-durable-source="true" className="mt-3 inline-flex min-h-11 items-center text-[13px] font-bold text-[var(--atlas-primary)] underline decoration-[var(--atlas-signal)] decoration-2 underline-offset-4 hover:decoration-[var(--atlas-ink)]">Open official program record</a> : null}
                  </li>
                ))}
              </ol>
            </PublicCard>
          ) : null}
        </div>

        <aside className="space-y-5 self-start lg:order-1 lg:sticky lg:top-24">
          <PublicCard title={organization.name} eyebrow="Who is building it" className="atlas-tonal-surface atlas-tonal-paper">
            <div className="flex items-center gap-3">
              <span className="relative flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[var(--atlas-blue-soft)] p-1.5 text-[var(--atlas-primary)]">
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
                <p className="mt-1.5 text-[11px] font-semibold text-[var(--atlas-muted)]">Profile last reviewed {formatDate(organization.lastReviewedAt)}</p>
              </div>
            </div>
            <Link href={`/organizations/${organization.slug}?returnTo=${encodeURIComponent(mapReturnTo)}`} prefetch={false} className="atlas-secondary-button mt-4 flex h-10 w-full gap-2 px-4 text-xs">
              Explore the organization <ArrowRight className="size-4" />
            </Link>
          </PublicCard>
          <PublicCard id="evidence" title="What supports this profile" eyebrow={publicSourceCountLabel(new Set(citations.map((citation) => citation.sourceUrl)).size)} className="atlas-tonal-surface atlas-tonal-paper">
            <EvidenceList citations={citations} />
            <p className="mt-4 border-t border-[var(--atlas-border)] pt-4 text-[12px] font-semibold leading-5 text-[var(--atlas-muted)]">Reviewed public evidence · Evidence limits stated · Human review</p>
          </PublicCard>
          <PublicCard title="Review status" eyebrow="Record currency" className="atlas-tonal-surface atlas-tonal-paper">
            <dl className="grid gap-3 text-xs">
              <div><dt className="text-[var(--atlas-muted)]">{publicLanguage.evidenceStrength}</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">{evidenceStrengthLabel(capability.sourceConfidence)}</dd></div>
              <div><dt className="text-[var(--atlas-muted)]">Last reviewed</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">{formatDate(capability.lastReviewedAt)}</dd></div>
              <div><dt className="text-[var(--atlas-muted)]">Technology areas</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">{capability.technicalDomains.map((domain) => domain.name).join(", ") || "Not yet mapped"}</dd></div>
            </dl>
          </PublicCard>
        </aside>
      </div>
      <section className="mt-6 rounded-[18px] bg-[var(--atlas-blue-soft)] px-5 py-7 sm:mt-8 sm:px-8 sm:py-9" aria-labelledby="capability-evidence-limits-heading">
        <p className="atlas-eyebrow">Evidence limits</p>
        <h2 id="capability-evidence-limits-heading" className="mt-3 font-[family-name:var(--font-barlow)] text-2xl font-extrabold tracking-[-0.035em] text-[var(--atlas-ink)] sm:text-3xl">What still needs verification</h2>
        <ul className="mt-5 grid gap-3 text-sm leading-6 text-[var(--atlas-ink-soft)] sm:grid-cols-2">
          {evidenceLimits.map((limit) => <li key={limit} className="border-t border-[var(--atlas-border-strong)] pt-3">{limit}</li>)}
        </ul>
      </section>
      <CollectionContinuation
        eyebrow="Next useful conversation"
        title="Take the reviewed record into the conversation ahead."
        description="Save the capability and its sources, then verify operating performance, maturity and integration constraints directly with the organization."
        links={[
          { label: "View Working Lists", href: "/collections" },
          { label: "Suggest a correction", href: `/submit?submissionType=correction&targetType=capability&targetId=${capability.id}&returnTo=${encodeURIComponent(capabilityPath)}` }
        ]}
      />
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

function capabilityEvidenceLimits(capability: {
  technologyReadinessLevel: number | null;
  maturity: string | null;
  commercialAvailability: string | null;
  missionMatches: unknown[];
  demandMatches: unknown[];
  citations: unknown[];
}) {
  const limits = [
    capability.technologyReadinessLevel === null ? "A technology readiness level is not established by the reviewed public sources." : null,
    !capability.maturity ? "A specific maturity stage is not established by the reviewed public sources." : null,
    !capability.commercialAvailability ? "Commercial availability is not established by the reviewed public sources." : null,
    !capability.missionMatches.length && !capability.demandMatches.length ? "No reviewed Mission Area or released Public Need connection is currently published." : null,
    !capability.citations.length ? "No capability-specific public citation is currently published." : null
  ].filter((value): value is string => Boolean(value));
  if (limits.length) return limits;
  return ["Performance in a specific operating environment still requires direct verification beyond the reviewed public record."];
}
