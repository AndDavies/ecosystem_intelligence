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
import { organizationKindLabel } from "@/lib/atlas/presentation";
import { getAtlasDiscoverySnapshot, getAtlasOrganizationLogos, matchingAtlasOrganizations } from "@/lib/atlas/repository";
import { normalizedPage, paginate } from "@/lib/pagination";
import type { AtlasEntityKind, AtlasOrganization } from "@/types/atlas";
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
      eyebrow="Canadian defence and dual-use directory"
      title="Find the people and technology your project needs."
      description="Search companies, research centres and industry organizations. Open a profile to see what they offer and where they may fit."
      actions={<Link href="/map?view=map" className="atlas-primary-button min-h-11 px-5 text-sm">Explore the map</Link>}
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

  const typeFacets = buildTypeFacets(snapshot.organizations);
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
      <dl className="mt-5 grid grid-cols-3 overflow-hidden rounded-[18px]">
        <DirectoryStat icon={Building2} label="Published organizations" value={publishedOrganizationCount} tone="blue" />
        <DirectoryStat icon={Layers3} label="Technologies and services" value={publishedCapabilityCount} tone="evidence" />
        <DirectoryStat icon={MapPin} label="Covered regions" value={coveredRegions} href="/regions" tone="signal" />
      </dl>

      <section className="mt-6">
        <SectionHeading
          eyebrow="Full directory"
          title="Browse the directory"
          actions={
            <Link href="/submit?submissionType=new_organization&targetType=organization&returnTo=%2Forganizations" className="atlas-secondary-button h-10 px-4 text-xs">
              Suggest an organization
            </Link>
          }
        />

        <div className="mt-4 space-y-3">
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
            {activeQuery ? <span className="text-sm font-semibold">Search: {activeQuery}</span> : null}
            {activeType ? <FilterPill label={organizationKindLabel(activeType, true)} removeHref={browseHref({ type: undefined })} /> : null}
            {activeRegion ? <FilterPill label={activeRegionName ?? activeRegion} removeHref={browseHref({ region: undefined })} /> : null}
            <Link href="/organizations" className="ml-auto text-xs font-bold text-[var(--atlas-primary)] underline-offset-4 hover:underline">
              Clear all
            </Link>
          </div>
        ) : null}

        <p className="mt-5 text-sm font-semibold" role="status">{directory.total.toLocaleString("en-CA")} {directory.total === 1 ? "organization" : "organizations"} found{hasFilters ? " with these filters" : " across Canada"}.</p>
        {directory.items.length ? (
          <>
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {directory.items.map((organization) => (
                <OrganizationCard
                  key={organization.id}
                  organization={{ ...organization, logo: directoryLogos[organization.id] ?? null }}
                  showLogo
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
      </section>

      <section className="mt-14 rounded-[18px] bg-[var(--atlas-ink)] px-6 py-8 text-white sm:px-9 sm:py-10">
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
                  className="flex h-full items-center justify-between gap-3 rounded-md border border-white/15 bg-white/[0.06] px-4 py-3 no-underline transition-colors duration-150 hover:border-white/40 hover:bg-white/[0.1] hover:no-underline"
                >
                  <span className="text-sm font-bold text-white/90">{region.name}</span>
                  <span className="shrink-0 text-xs font-bold text-[var(--atlas-signal)]">{region.organizationCount}</span>
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

const directoryStatTone = {
  blue: "bg-[var(--atlas-blue-soft)]",
  evidence: "bg-[var(--atlas-evidence-soft)]",
  signal: "bg-[var(--atlas-signal-soft)]"
} as const;

const directoryStatIconTone = {
  blue: "text-[var(--atlas-ink)]",
  evidence: "text-[var(--atlas-evidence)]",
  signal: "text-[var(--atlas-ink)]"
} as const;

function DirectoryStat({
  icon: Icon,
  label,
  value,
  href,
  tone
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  href?: string;
  tone: keyof typeof directoryStatTone;
}) {
  return (
    <div className={`px-3 py-2.5 sm:px-4 ${directoryStatTone[tone]}`}>
      <div className="flex items-center gap-2.5">
        <Icon className={`size-4 shrink-0 ${directoryStatIconTone[tone]}`} aria-hidden="true" />
        <div className="flex min-w-0 flex-col">
          <dt className="order-2 mt-1.5 text-[10px] font-bold leading-4 text-[var(--atlas-muted)] sm:text-[11px]">{label}</dt>
          <dd className="order-1 font-[family-name:var(--font-barlow)] text-xl font-extrabold leading-none tracking-[-0.04em] text-[var(--atlas-ink)] sm:text-2xl">
            {href ? (
              <Link href={href} className="underline-offset-4 hover:underline" aria-label={`${value} ${label.toLowerCase()}; browse regions`}>
                {value}
              </Link>
            ) : value}
          </dd>
        </div>
      </div>
    </div>
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
