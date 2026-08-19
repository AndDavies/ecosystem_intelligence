import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Compass, FileText, Layers3, SearchCheck, ShieldAlert } from "lucide-react";
import { MissionOrganizationCard } from "@/components/atlas/mission-organization-card";
import { NorthSignalInline } from "@/components/atlas/north-signal-signup";
import { CollectionContinuation, EmptyCoverage, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { PublicShare } from "@/components/atlas/public-share";
import { JsonLd } from "@/components/seo/json-ld";
import { PaginationNav } from "@/components/ui/pagination-nav";
import { StatTile } from "@/components/ui/stat-tile";
import { getBriefPresentation } from "@/lib/atlas/brief-presentation";
import { getPublishedDefenceBriefs } from "@/lib/atlas/briefs";
import { getAtlasMissionBySlug } from "@/lib/atlas/repository";
import { normalizedPage, paginate } from "@/lib/pagination";
import { socialMetadata } from "@/lib/seo/social";
import { absoluteUrl } from "@/lib/site";

const ORGANIZATIONS_PER_PAGE = 18;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getAtlasMissionBySlug(slug);
  if (!result) return { title: "Mission Area not found", robots: { index: false, follow: false } };
  const path = `/missions/${result.missionArea.slug}`;
  return {
    title: `${result.missionArea.name} Mission Area`,
    description: result.missionArea.summary,
    alternates: { canonical: path },
    ...socialMetadata({ title: result.missionArea.name, description: result.missionArea.summary, path, eyebrow: "Mission Area and Use Case", detail: "Canadian organizations and technologies that may be worth examining" })
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
  const [result, briefs] = await Promise.all([getAtlasMissionBySlug(slug), getPublishedDefenceBriefs()]);
  if (!result) notFound();
  const directory = paginate(result.organizations, normalizedPage(search.page), ORGANIZATIONS_PER_PAGE);
  const path = `/missions/${result.missionArea.slug}`;
  const organizationIds = new Set(result.organizations.map((connection) => connection.organization.id));
  const capabilityIds = new Set(result.organizations.flatMap((connection) => connection.capabilities.map((capability) => capability.id)));
  const publicNeedIds = new Set(result.publicNeeds.map((demand) => demand.id));
  const relatedBriefs = briefs
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
          <Link href={`/map?mission=${result.missionArea.slug}`} className="atlas-signal-button h-10 gap-2 px-4 text-xs">Explore on the map <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
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
          numberOfItems: result.organizations.length,
          itemListElement: result.organizations.slice(0, 100).map((connection, index) => ({
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

      {result.publicNeeds.length ? (
        <section className="mt-12" aria-labelledby="mission-public-needs-heading">
          <p className="atlas-eyebrow">Released needs connected through this technology</p>
          <h2 id="mission-public-needs-heading" className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[var(--atlas-ink)]">Where the public record creates another lens</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--atlas-muted)]">These Public Needs were reviewed separately against technologies on this page. The Mission Area does not create or change the released source.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {result.publicNeeds.map((demand) => (
              <PublicCard key={demand.id} className="flex h-full flex-col">
                <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--atlas-evidence-soft)] text-[var(--atlas-evidence)]"><FileText className="size-4" aria-hidden="true" /></span>
                <h3 className="mt-4 text-base font-extrabold tracking-[-0.02em] text-[var(--atlas-ink)]">{demand.title}</h3>
                <p className="mt-2 text-xs leading-5 text-[var(--atlas-muted)]">{demand.technologyCount} {demand.technologyCount === 1 ? "technology is" : "technologies are"} connected to both records through separate human review.</p>
                <Link href={`/demand/${demand.slug}`} className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-bold text-[var(--atlas-primary)] no-underline hover:underline">Inspect the released need <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
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
                <Link href={`/briefs/${brief.slug}`} className="mt-auto inline-flex items-center gap-1 pt-5 text-xs font-bold text-[var(--atlas-primary)] no-underline hover:underline">Read the article <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
              </PublicCard>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-12" aria-labelledby="mission-organizations-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="atlas-eyebrow">Our assessment</p>
            <h2 id="mission-organizations-heading" className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[var(--atlas-ink)]">Canadian technology mapped to this mission</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--atlas-muted)]">Organizations are ordered by the strongest published assessment on this page, then alphabetically. This is not a ranking or recommendation.</p>
          </div>
          <Link href={`/map?mission=${result.missionArea.slug}`} className="atlas-secondary-button h-10 w-fit gap-2 px-4 text-xs">See every map point <Compass className="size-3.5" aria-hidden="true" /></Link>
        </div>

        {directory.items.length ? (
          <>
            <div className="mt-7 grid gap-5 lg:grid-cols-2">
              {directory.items.map((connection) => <MissionOrganizationCard key={connection.organization.id} connection={connection} />)}
            </div>
            <PaginationNav path={path} page={directory.page} totalPages={directory.totalPages} start={directory.start} end={directory.end} total={directory.total} itemLabel="organizations" />
          </>
        ) : (
          <div className="mt-7"><EmptyCoverage title="No reviewed connections yet" detail="The Mission Area remains visible as a coverage gap until reviewed Canadian technology can support it." /></div>
        )}
      </section>
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
