import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Building2, Download, Layers3, MapPin } from "lucide-react";
import { AtlasHeroArt } from "@/components/atlas/atlas-hero-art";
import { OrganizationCard } from "@/components/atlas/organization-card";
import { EmptyCoverage, PublicPageShell } from "@/components/atlas/public-page-shell";
import { PublicShare } from "@/components/atlas/public-share";
import { PaginationNav } from "@/components/ui/pagination-nav";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatTile } from "@/components/ui/stat-tile";
import { clusterBasisLabel } from "@/lib/atlas/presentation";
import { getRegionArt } from "@/lib/atlas/region-presentation";
import { getAtlasRegionBySlug, getAtlasSnapshot } from "@/lib/atlas/repository";
import { normalizedPage, paginate } from "@/lib/pagination";
import { socialMetadata } from "@/lib/seo/social";

const ORGANIZATIONS_PER_PAGE = 12;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getAtlasRegionBySlug(slug);
  if (!result) return { title: "Region not found", robots: { index: false, follow: false } };
  const title = `${result.region.name} Defence and Dual-Use Ecosystem`;
  const path = `/regions/${result.region.slug}`;
  return { title: `${result.region.name} Ecosystem`, description: result.region.description, alternates: { canonical: path }, ...socialMetadata({ title, description: result.region.description, path, eyebrow: "Regional ecosystem", detail: `${result.region.organizationCount} published organizations` }) };
}

export default async function RegionPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const [result, snapshot, search] = await Promise.all([getAtlasRegionBySlug(slug), getAtlasSnapshot(), searchParams]);
  if (!result) notFound();

  const { region, organizations, clusters } = result;
  const art = getRegionArt(region.slug);
  const directory = paginate(organizations, normalizedPage(search.page), ORGANIZATIONS_PER_PAGE);
  const organizationsHref = region.slug === "canada" ? "/organizations" : `/organizations?region=${region.slug}`;

  return (
    <PublicPageShell
      eyebrow="Regional ecosystem"
      title={region.name}
      breadcrumbs={[
        { label: "Map", href: "/" },
        { label: "Regions", href: "/regions" },
        { label: region.name }
      ]}
      pageHeader={(
        <header className="mt-6 overflow-hidden rounded-[2rem] border border-[var(--atlas-border)] bg-white shadow-[var(--atlas-shadow-soft)]">
          <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="order-2 flex min-w-0 flex-col justify-center p-6 sm:p-9 lg:order-1">
              <p className="atlas-eyebrow">Regional ecosystem</p>
              <h1 className="mt-3 text-3xl font-extrabold leading-[1.05] tracking-[-0.05em] text-[var(--atlas-ink)] sm:text-[42px] lg:text-[46px]">
                {region.name}
              </h1>
              <ProvinceContext provincesTerritories={region.provincesTerritories} />
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--atlas-muted)] sm:text-base sm:leading-7">
                {region.description}
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                <Link
                  href={`/?region=${region.slug}`}
                  className="atlas-signal-button h-11 gap-2 px-5 text-sm no-underline hover:no-underline"
                >
                  Explore on the map
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                {organizations.length ? (
                  <Link
                    href={`/api/export?type=region-report&slug=${region.slug}`}
                    className="atlas-secondary-button h-11 gap-2 px-5 text-sm"
                  >
                    <Download className="size-4" aria-hidden="true" />
                    Export report
                  </Link>
                ) : null}
                <PublicShare title={`${region.name} Defence and Dual-Use Ecosystem`} description={region.description} path={`/regions/${region.slug}`} />
              </div>
            </div>
            <AtlasHeroArt
              tone={art.tone}
              icon={art.icon}
              eyebrow="True North Map region"
              label={region.shortName}
              alt={`Decorative artwork representing ${region.name}`}
              className="order-1 h-[180px] rounded-none sm:h-[220px] lg:order-2 lg:aspect-auto lg:h-full lg:min-h-[320px]"
            />
          </div>
        </header>
      )}
    >
      <RegionSwitcher regions={snapshot.regions} activeSlug={region.slug} />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatTile
          icon={Building2}
          label="Published organizations"
          value={region.organizationCount}
          href={organizationsHref}
          linkLabel="Browse the directory"
        />
        <StatTile
          icon={Layers3}
          label="Reviewed technologies and offerings"
          value={region.capabilityCount}
          href={`/?region=${region.slug}`}
          linkLabel="Open on the map"
        />
        <StatTile icon={MapPin} label="Visible clusters" value={region.clusterCount} />
      </div>

      <p className="mt-3 text-xs leading-5 text-[var(--atlas-muted)]">
        Counts reflect the current published dataset, not the total size of the real ecosystem. Unknown and thin coverage
        remain explicit to support gap-driven research.
      </p>

      <section className="mt-12">
        <SectionHeading
          eyebrow="Current regional coverage"
          title="Published organizations"
          description={
            organizations.length
              ? "Every profile below is built from reviewed public sources. Open one to see what supports it and where gaps remain."
              : undefined
          }
        />
        {directory.items.length ? (
          <>
            <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {directory.items.map((organization) => (
                <OrganizationCard key={organization.id} organization={organization} />
              ))}
            </div>
            <PaginationNav
              path={`/regions/${region.slug}`}
              page={directory.page}
              totalPages={directory.totalPages}
              start={directory.start}
              end={directory.end}
              total={directory.total}
              itemLabel="organizations"
            />
          </>
        ) : (
          <div className="mt-7">
            <EmptyCoverage
              title="No published organizations yet"
              detail="The region remains visible as an explicit research gap. Records will appear only after source and editorial review."
            />
          </div>
        )}
      </section>

      <section className="mt-14">
        <SectionHeading
          id="region-clusters"
          eyebrow="Curated groupings"
          title="Ecosystem clusters"
          description="Clusters appear only where the published technology base supports a useful grouping."
        />
        {clusters.length ? (
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {clusters.map((cluster) => (
              <article key={cluster.id} className="atlas-surface flex h-full flex-col p-5">
                <span className="w-fit rounded-full bg-[var(--atlas-surface-muted)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--atlas-muted)] ring-1 ring-[var(--atlas-border)]">
                  {clusterBasisLabel(cluster.clusterBasis)}
                </span>
                <h3 className="mt-3.5 text-base font-extrabold tracking-[-0.02em] text-[var(--atlas-ink)]">{cluster.name}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--atlas-muted)]">{cluster.summary}</p>
                <p className="mt-auto border-t border-[var(--atlas-border)] pt-4 text-xs font-bold text-[var(--atlas-ink-soft)]">
                  {cluster.capabilityIds.length} mapped {cluster.capabilityIds.length === 1 ? "technology" : "technologies"}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-7">
            <EmptyCoverage
              title="Clusters not mapped yet"
              detail="We do not infer a cluster from a thin sample. It will appear once the regional technology base supports a useful grouping."
            />
          </div>
        )}
      </section>
    </PublicPageShell>
  );
}

function ProvinceContext({ provincesTerritories }: { provincesTerritories: string[] }) {
  if (!provincesTerritories.length) return null;

  if (provincesTerritories.length > 6) {
    return (
      <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[var(--atlas-muted)]">
        <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
        {provincesTerritories.length} provinces and territories
      </p>
    );
  }

  return (
    <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Provinces and territories in this region">
      {provincesTerritories.map((province) => (
        <li
          key={province}
          className="rounded-full bg-[var(--atlas-surface-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--atlas-ink-soft)] ring-1 ring-[var(--atlas-border)]"
        >
          {province}
        </li>
      ))}
    </ul>
  );
}

function RegionSwitcher({
  regions,
  activeSlug
}: {
  regions: Array<{ slug: string; shortName: string; organizationCount: number }>;
  activeSlug: string;
}) {
  return (
    <nav aria-label="Switch region" className="mt-8">
      <ul className="flex flex-wrap gap-2">
        {regions.map((region) => {
          const active = region.slug === activeSlug;
          return (
            <li key={region.slug}>
              <Link
                href={`/regions/${region.slug}`}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold no-underline transition-colors duration-150 hover:no-underline ${
                  active
                    ? "bg-[var(--atlas-ink)] text-white"
                    : "bg-white text-[var(--atlas-ink-soft)] ring-1 ring-[var(--atlas-border)] hover:bg-[var(--atlas-surface-muted)] hover:text-[var(--atlas-ink)]"
                }`}
              >
                {region.shortName}
                <span className={active ? "text-[var(--atlas-signal)]" : "text-[var(--atlas-muted)]"}>
                  {region.organizationCount}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
