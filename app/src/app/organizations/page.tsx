import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Building2, Compass, Layers3, MapPin, X, type LucideIcon } from "lucide-react";
import { OrganizationDirectoryLoading } from "@/components/atlas/organization-directory-loading";
import { PublicRecordSearch } from "@/components/atlas/public-record-search";
import { OrganizationCard } from "@/components/atlas/organization-card";
import { CollectionContinuation, EmptyCoverage, PublicPageShell } from "@/components/atlas/public-page-shell";
import { PaginationNav } from "@/components/ui/pagination-nav";
import { SectionHeading } from "@/components/ui/section-heading";
import { buildOrganizationTypeOptions, organizationTypeFilterLabel } from "@/lib/atlas/organization-type-filters";
import { getAtlasDiscoverySnapshot, getAtlasOrganizationLogos, matchingAtlasOrganizations } from "@/lib/atlas/repository";
import { normalizedPage, paginate } from "@/lib/pagination";
import { socialMetadata } from "@/lib/seo/social";

// The directory shell refreshes more often than the bounded discovery pages.
// Publication never purges those pages synchronously, preventing a batch
// publish from turning the next directory request into a full-corpus rewarm.
export const revalidate = 60;

const PER_PAGE = 24;

export const metadata: Metadata = {
  title: "Canadian Defence and Dual-Use Organizations",
  description: "Find Canadian defence and dual-use organizations, understand their possible contribution, and decide which profiles are worth a closer look or conversation.",
  alternates: { canonical: "/organizations" },
  ...socialMetadata({ title: "Canadian Defence and Dual-Use Organizations", description: "Find Canadian organizations, understand what they may contribute, and decide which profiles are worth examining next.", path: "/organizations", eyebrow: "Canadian capability directory" })
};

type OrganizationSearchParams = Promise<{ page?: string | string[]; type?: string | string[]; region?: string | string[]; q?: string | string[] }>;
const firstParameter = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default function OrganizationsPage({ searchParams }: { searchParams: OrganizationSearchParams }) {
  return (
    <PublicPageShell
      variant="collection"
      eyebrow="Canadian defence and dual-use directory"
      title="Find the people and technology your project needs."
      description="Search companies, research centres and industry organizations. Open a profile to see what they offer and where they may fit."
      actions={<Link href="/map?view=map" className="atlas-prose-link inline-flex min-h-11 items-center text-sm font-bold">Explore the map</Link>}
    >
      <Suspense fallback={<OrganizationDirectoryLoading />}>
        <OrganizationsDirectoryData searchParams={searchParams} />
      </Suspense>
    </PublicPageShell>
  );
}

async function OrganizationsDirectoryData({ searchParams }: { searchParams: OrganizationSearchParams }) {
  const [snapshot, params] = await Promise.all([
    getAtlasDiscoverySnapshot(),
    searchParams
  ]);
  const activeType = firstParameter(params.type)?.trim() || undefined;
  const activeRegion = firstParameter(params.region)?.trim() || undefined;
  const activeQuery = firstParameter(params.q)?.trim().slice(0, 120) || undefined;
  const hasFilters = Boolean(activeType || activeRegion || activeQuery);
  const matching = matchingAtlasOrganizations(snapshot, { query: activeQuery, type: activeType, region: activeRegion });

  const directory = paginate(
    matching,
    normalizedPage(firstParameter(params.page)),
    PER_PAGE
  );
  const directoryLogos = await getAtlasOrganizationLogos(directory.items.map((organization) => organization.id));

  const typeFacets = buildOrganizationTypeOptions(snapshot.organizations, activeType);
  const regionFacets = snapshot.regions.filter((region) => region.slug !== "canada" && region.organizationCount > 0);
  const coveredRegions = regionFacets.length;
  const publishedOrganizationCount = snapshot.organizations.length;
  const publishedCapabilityCount = new Set(
    snapshot.organizations.flatMap((organization) => organization.capabilities.map((capability) => capability.id))
  ).size;
  const browseHref = (next: { type?: string; region?: string }) => {
    const query = new URLSearchParams();
    const type = "type" in next ? next.type : activeType;
    const region = "region" in next ? next.region : activeRegion;
    if (activeQuery) query.set("q", activeQuery);
    if (type) query.set("type", type);
    if (region) query.set("region", region);
    const search = query.toString();
    return search ? `/organizations?${search}` : "/organizations";
  };

  const activeRegionName = snapshot.regions.find((region) => region.slug === activeRegion)?.name ?? activeRegion;

  return (
    <>
      <div className="mt-6 max-w-3xl"><PublicRecordSearch query={activeQuery} type={activeType} region={activeRegion} /></div>
      <dl className="atlas-directory-stats">
        <DirectoryStat icon={Building2} label="Published organizations" value={publishedOrganizationCount} tone="blue" />
        <DirectoryStat icon={Layers3} label="Technologies and services" value={publishedCapabilityCount} tone="evidence" />
        <DirectoryStat icon={MapPin} label="Covered regions" value={coveredRegions} href="/regions" tone="signal" />
      </dl>

      <section className="mt-6">
        <SectionHeading
          className="atlas-directory-heading"
          eyebrow="Full directory"
          title="Browse the directory"
          actions={
            <Link href="/submit?submissionType=new_organization&targetType=organization&returnTo=%2Forganizations" className="atlas-secondary-button h-10 px-4 text-xs">
              Suggest an organization
            </Link>
          }
        />

        <div className="atlas-directory-grid">
        <aside className="atlas-directory-filters">
          <BrowseRow
            label="Organization type"
            allLabel="All types"
            allHref={browseHref({ type: undefined })}
            allActive={!activeType}
            options={typeFacets.map((facet) => ({
              key: facet.value,
              label: facet.label,
              count: facet.count,
              href: browseHref({ type: facet.value }),
              active: activeType === facet.value
            }))}
          />
          <BrowseRow
            label="Region"
            allLabel="All regions"
            allHref={browseHref({ region: undefined })}
            allActive={!activeRegion}
            options={regionFacets.map((region) => ({
              key: region.slug,
              label: region.shortName,
              count: region.organizationCount,
              href: browseHref({ region: region.slug }),
              active: activeRegion === region.slug
            }))}
          />
        </aside>

        <div className="atlas-directory-records">
        {hasFilters ? (
          <div className="mt-5 flex flex-wrap items-center gap-2 border-y border-[var(--atlas-border)] py-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--atlas-muted)]">Showing</span>
            {activeQuery ? <span className="text-sm font-semibold">Search: {activeQuery}</span> : null}
            {activeType ? <FilterPill label={organizationTypeFilterLabel(activeType)} removeHref={browseHref({ type: undefined })} /> : null}
            {activeRegion ? <FilterPill label={activeRegionName ?? activeRegion} removeHref={browseHref({ region: undefined })} /> : null}
            <Link href="/organizations" className="ml-auto text-xs font-bold text-[var(--atlas-primary)] underline-offset-4 hover:underline">
              Clear all
            </Link>
          </div>
        ) : null}

        <p className="text-sm font-semibold" role="status">{directory.total.toLocaleString("en-CA")} {directory.total === 1 ? "organization" : "organizations"} found{hasFilters ? " with these filters" : " across Canada"}.</p>
        {directory.items.length ? (
          <>
            <div className="atlas-directory-list mt-4">
              {directory.items.map((organization) => (
                <OrganizationCard
                  key={organization.id}
                  organization={{ ...organization, logo: directoryLogos[organization.id] ?? null }}
                  showLogo
                  layout="row"
                />
              ))}
            </div>
            <PaginationNav
              path="/organizations"
              page={directory.page}
              totalPages={directory.totalPages}
              start={directory.start}
              end={directory.end}
              total={directory.total}
              itemLabel="organizations"
              query={{ type: activeType, region: activeRegion, q: activeQuery }}
            />
          </>
        ) : (
          <div className="mt-7 space-y-4">
            <EmptyCoverage
              title={hasFilters ? "No published organizations match these filters" : "No published organizations yet"}
              detail={
                hasFilters
                  ? "Coverage is still being built. Try a wider filter, browse the regional view, or tell us what is missing."
                  : "Records appear here only after source and editorial review. The gap stays visible until then."
              }
            />
            {hasFilters ? (
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/organizations" className="atlas-secondary-button h-10 px-4 text-xs">
                  Clear filters
                </Link>
                <Link href="/regions" className="atlas-secondary-button h-10 px-4 text-xs">
                  Browse by region
                </Link>
              </div>
            ) : null}
          </div>
        )}
        </div>
        </div>
      </section>

      <section className="atlas-region-continuation mt-12 border-y border-[var(--atlas-border)] py-8">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
          <div>
            <Compass className="size-6 text-[var(--atlas-signal)]" aria-hidden="true" />
            <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--atlas-signal)]">
              Explore by region
            </p>
            <h2 className="mt-3 text-2xl font-extrabold leading-tight tracking-[-0.04em] sm:text-3xl">
              See where published coverage sits across Canada.
            </h2>
            <Link href="/regions" className="atlas-primary-button mt-6 h-11 px-5 text-sm no-underline hover:no-underline">
              View all regions
              <ArrowRight className="ml-2 size-4" aria-hidden="true" />
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {regionFacets.map((region) => (
              <li key={region.slug}>
                <Link
                  href={`/regions/${region.slug}`}
                  className="flex h-full items-center justify-between gap-3 border-b border-[var(--atlas-border)] py-3 no-underline transition-colors duration-150 hover:border-white/40 hover:bg-white/[0.1] hover:no-underline"
                >
                  <span className="text-sm font-bold text-[var(--atlas-ink)]">{region.name}</span>
                  <span className="shrink-0 text-sm font-bold text-[var(--atlas-link)]">{region.organizationCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CollectionContinuation
        eyebrow="Have a specific need?"
        title="Start with the outcome you are trying to create."
        description="Describe a mission or capability gap and search across every published organization, then carry the strongest records into a Shortlist."
        links={[{ label: "Describe a need", href: "/map?start=need" }, { label: "My shortlists", href: "/collections" }]}
      />
    </>
  );
}

function DirectoryStat({ label, value, href }: { icon: LucideIcon; label: string; value: number; href?: string; tone: "blue" | "evidence" | "signal" }) {
  return <div className="atlas-directory-stat"><dd>{href ? <Link href={href} className="underline underline-offset-4" aria-label={`${value} ${label.toLowerCase()}; browse regions`}>{value}</Link> : value}</dd><dt>{label}</dt></div>;
}

function BrowseRow({
  label,
  allLabel,
  allHref,
  allActive,
  options
}: {
  label: string;
  allLabel: string;
  allHref: string;
  allActive: boolean;
  options: Array<{ key: string; label: string; count: number; href: string; active: boolean }>;
}) {
  if (!options.length) return null;

  return (
    <nav aria-label={`Filter by ${label.toLowerCase()}`} className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-4">
      <p className="shrink-0 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--atlas-muted)] sm:w-[124px]">
        {label}
      </p>
      <ul className="flex flex-wrap gap-2">
        <li>
          <BrowseChip href={allHref} active={allActive} label={allLabel} />
        </li>
        {options.map((option) => (
          <li key={option.key}>
            <BrowseChip href={option.href} active={option.active} label={option.label} count={option.count} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function BrowseChip({
  href,
  active,
  label,
  count
}: {
  href: string;
  active: boolean;
  label: string;
  count?: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`inline-flex min-h-9 max-w-full items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold no-underline transition-colors duration-150 hover:no-underline ${
        active
          ? "bg-[var(--atlas-ink)] text-white"
          : "bg-white text-[var(--atlas-ink-soft)] ring-1 ring-[var(--atlas-border)] hover:bg-[var(--atlas-surface-muted)] hover:text-[var(--atlas-ink)]"
      }`}
    >
      <span className="min-w-0 break-words">{label}</span>
      {count === undefined ? null : (
        <span className={active ? "text-[var(--atlas-signal)]" : "text-[var(--atlas-muted)]"}>{count}</span>
      )}
    </Link>
  );
}

function FilterPill({ label, removeHref }: { label: string; removeHref: string }) {
  return (
    <Link
      href={removeHref}
      className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-[var(--atlas-ink-soft)] no-underline ring-1 ring-[var(--atlas-border)] transition-colors duration-150 hover:bg-[var(--atlas-signal-soft)] hover:text-[var(--atlas-ink)] hover:no-underline"
    >
      {label}
      <X className="size-3.5" aria-hidden="true" />
      <span className="sr-only">Remove this filter</span>
    </Link>
  );
}
