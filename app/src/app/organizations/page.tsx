import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Compass, FileText, Layers3, MapPin, X } from "lucide-react";
import { OrganizationCard } from "@/components/atlas/organization-card";
import { EmptyCoverage, PublicPageShell } from "@/components/atlas/public-page-shell";
import { PaginationNav } from "@/components/ui/pagination-nav";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatTile } from "@/components/ui/stat-tile";
import { organizationKindLabel } from "@/lib/atlas/presentation";
import { getAtlasSnapshot } from "@/lib/atlas/repository";
import { normalizedPage, paginate } from "@/lib/pagination";
import type { AtlasEntityKind, AtlasOrganization } from "@/types/atlas";
import { socialMetadata } from "@/lib/seo/social";

// Keep the directory in sync with publication without depending on a cached
// full-route render from before the latest reviewed records were promoted.
export const dynamic = "force-dynamic";

const PER_PAGE = 24;
const SPOTLIGHT_SIZE = 3;

export const metadata: Metadata = {
  title: "Canadian Defence and Dual-Use Organizations",
  description: "Find Canadian defence and dual-use organizations, see what they build, and inspect the public evidence behind each profile.",
  alternates: { canonical: "/organizations" },
  ...socialMetadata({ title: "Canadian Defence and Dual-Use Organizations", description: "Find Canadian organizations, see what they build, and inspect the public evidence behind each profile.", path: "/organizations", eyebrow: "Canadian ecosystem directory" })
};

function reviewedTime(value: string | null) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default async function OrganizationsPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string; type?: string; region?: string }>;
}) {
  const snapshot = await getAtlasSnapshot();
  const params = await searchParams;
  const activeType = params.type?.trim() || undefined;
  const activeRegion = params.region?.trim() || undefined;
  const hasFilters = Boolean(activeType || activeRegion);

  const matching = snapshot.organizations.filter((organization) => {
    const matchesType =
      !activeType || organization.entityKind === activeType || organization.categories.includes(activeType);
    const matchesRegion =
      !activeRegion || activeRegion === "canada" || organization.primaryLocation?.regionSlug === activeRegion;
    return matchesType && matchesRegion;
  });

  const recentlyReviewed = [...snapshot.organizations]
    .filter((organization) => organization.lastReviewedAt)
    .sort((left, right) => reviewedTime(right.lastReviewedAt) - reviewedTime(left.lastReviewedAt))
    .slice(0, SPOTLIGHT_SIZE);
  const spotlightActive =
    !hasFilters && recentlyReviewed.length === SPOTLIGHT_SIZE && snapshot.organizations.length > SPOTLIGHT_SIZE * 2;
  const spotlightIds = new Set(spotlightActive ? recentlyReviewed.map((organization) => organization.id) : []);

  const directory = paginate(
    matching.filter((organization) => !spotlightIds.has(organization.id)),
    normalizedPage(params.page),
    PER_PAGE
  );

  const typeFacets = buildTypeFacets(snapshot.organizations);
  const regionFacets = snapshot.regions.filter((region) => region.slug !== "canada" && region.organizationCount > 0);
  const coveredRegions = regionFacets.length;
  const technologyCount = new Set(
    snapshot.organizations.flatMap((organization) => organization.capabilities.map((capability) => capability.id))
  ).size;
  const sourceCount = new Set(
    snapshot.organizations.flatMap((organization) => [
      ...organization.citations,
      ...organization.capabilities.flatMap((capability) => [
        ...capability.citations,
        ...capability.missionMatches.flatMap((match) => match.citations),
        ...capability.demandMatches.flatMap((match) => match.citations)
      ])
    ]).map((citation) => citation.sourceUrl)
  ).size;

  const browseHref = (next: { type?: string; region?: string }) => {
    const query = new URLSearchParams();
    const type = "type" in next ? next.type : activeType;
    const region = "region" in next ? next.region : activeRegion;
    if (type) query.set("type", type);
    if (region) query.set("region", region);
    const search = query.toString();
    return search ? `/organizations?${search}` : "/organizations";
  };

  const activeRegionName = snapshot.regions.find((region) => region.slug === activeRegion)?.name ?? activeRegion;

  return (
    <PublicPageShell
      eyebrow="Find the right Canadian team"
      title="Organizations"
      description={`Explore ${snapshot.organizations.length} reviewed organizations, see what they build, and decide who deserves a closer look. Gaps stay visible; unsupported details stay out.`}
      actions={<Link href="/submit?submissionType=new_organization&targetType=organization&returnTo=%2Forganizations" className="inline-flex h-10 items-center rounded-md border border-[var(--atlas-primary)] bg-white px-4 text-xs font-semibold text-[var(--atlas-primary)] no-underline hover:bg-[var(--atlas-primary-soft)] hover:no-underline">Suggest an organization</Link>}
    >
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={Building2} label="Reviewed organizations" value={snapshot.organizations.length} />
        <StatTile icon={Layers3} label="Reviewed technologies and offerings" value={technologyCount} />
        <StatTile
          icon={MapPin}
          label="Regions with published coverage"
          value={coveredRegions}
          href="/regions"
          linkLabel="Browse regions"
        />
        <StatTile icon={FileText} label="Public sources behind the profiles" value={sourceCount} />
      </div>

      {spotlightActive && directory.page === 1 ? (
        <section className="mt-14">
          <SectionHeading
            eyebrow="Latest review activity"
            title="Recently reviewed"
            description="Ordered only by the date each profile was last reviewed. This is not a ranking, a recommendation, or a measure of suitability."
          />
          <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {recentlyReviewed.map((organization) => (
              <OrganizationCard key={organization.id} organization={organization} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-14">
        <SectionHeading
          eyebrow="Full directory"
          title="Browse the directory"
          description={
            spotlightActive && directory.page === 1
              ? "The most recently reviewed profiles appear above. Every other published organization is listed here."
              : undefined
          }
        />

        <div className="mt-6 space-y-4">
          <BrowseRow
            label="Organization type"
            allLabel="All types"
            allHref={browseHref({ type: undefined })}
            allActive={!activeType}
            options={typeFacets.map((facet) => ({
              key: facet.value,
              label: organizationKindLabel(facet.value, true),
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
        </div>

        {hasFilters ? (
          <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] px-4 py-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--atlas-muted)]">Showing</span>
            {activeType ? <FilterPill label={organizationKindLabel(activeType, true)} removeHref={browseHref({ type: undefined })} /> : null}
            {activeRegion ? <FilterPill label={activeRegionName ?? activeRegion} removeHref={browseHref({ region: undefined })} /> : null}
            <Link href="/organizations" className="ml-auto text-xs font-bold text-[var(--atlas-primary)] underline-offset-4 hover:underline">
              Clear all
            </Link>
          </div>
        ) : null}

        {directory.items.length ? (
          <>
            <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {directory.items.map((organization) => (
                <OrganizationCard key={organization.id} organization={organization} />
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
              query={{ type: activeType, region: activeRegion }}
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
      </section>

      <section className="mt-14 rounded-[2rem] bg-[var(--atlas-ink)] px-6 py-8 text-white sm:px-9 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
          <div>
            <Compass className="size-6 text-[var(--atlas-signal)]" aria-hidden="true" />
            <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--atlas-signal)]">
              Explore by region
            </p>
            <h2 className="mt-3 text-2xl font-extrabold leading-tight tracking-[-0.04em] sm:text-3xl">
              See where published coverage sits across Canada.
            </h2>
            <Link href="/regions" className="atlas-signal-button mt-6 h-11 px-5 text-sm no-underline hover:no-underline">
              View all regions
              <ArrowRight className="ml-2 size-4" aria-hidden="true" />
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {regionFacets.map((region) => (
              <li key={region.slug}>
                <Link
                  href={`/regions/${region.slug}`}
                  className="flex h-full items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 no-underline transition-colors duration-150 hover:border-white/40 hover:bg-white/[0.1] hover:no-underline"
                >
                  <span className="text-sm font-bold text-white/90">{region.name}</span>
                  <span className="shrink-0 text-xs font-bold text-[var(--atlas-signal)]">{region.organizationCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </PublicPageShell>
  );
}

function buildTypeFacets(organizations: AtlasOrganization[]) {
  const counts = new Map<AtlasEntityKind, number>();
  organizations.forEach((organization) => {
    counts.set(organization.entityKind, (counts.get(organization.entityKind) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value));
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
