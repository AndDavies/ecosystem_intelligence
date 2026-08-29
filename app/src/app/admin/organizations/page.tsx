import Link from "next/link";
import { ArrowRight, ExternalLink, Search } from "lucide-react";
import { AdminNav } from "@/components/atlas/admin-nav";
import { EmptyCoverage, PublicPageShell } from "@/components/atlas/public-page-shell";
import { PaginationNav } from "@/components/ui/pagination-nav";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { createClient } from "@/lib/supabase/server";

const pageSize = 50;

type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  entity_kind: string;
  source_confidence: string;
  last_reviewed_at: string | null;
};

type CapabilityRow = { organization_id: string; name: string };
type CapabilityTagRow = { organization_id: string; technical_tags: unknown };
type LocationLinkRow = { organization_id: string; location_id: string; is_primary: boolean };
type LocationRow = { id: string; city: string | null; province_territory: string | null };

export default async function AdminOrganizationsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requireAtlasStaff("editor");
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 120) ?? "";
  const requestedPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const supabase = await createClient();

  let matchingIds: string[] | null = null;
  if (query) {
    const pattern = `%${query}%`;
    const [names, legalNames, capabilityNames, capabilitySummaries, capabilityTags, cities, provinces, domainNames, domainSummaries] = await Promise.all([
      supabase.from("organizations").select("id").eq("publication_status", "published").ilike("name", pattern).limit(1000),
      supabase.from("organizations").select("id").eq("publication_status", "published").ilike("legal_name", pattern).limit(1000),
      supabase.from("capabilities").select("organization_id").eq("publication_status", "published").ilike("name", pattern).limit(1000),
      supabase.from("capabilities").select("organization_id").eq("publication_status", "published").ilike("summary", pattern).limit(1000),
      supabase.from("capabilities").select("organization_id, technical_tags").eq("publication_status", "published").limit(1000),
      supabase.from("locations").select("id").ilike("city", pattern).limit(1000),
      supabase.from("locations").select("id").ilike("province_territory", pattern).limit(1000),
      supabase.from("technical_domains").select("id").eq("publication_status", "published").ilike("name", pattern).limit(1000),
      supabase.from("technical_domains").select("id").eq("publication_status", "published").ilike("summary", pattern).limit(1000)
    ]);
    const failedSearch = [names, legalNames, capabilityNames, capabilitySummaries, capabilityTags, cities, provinces, domainNames, domainSummaries].find((result) => result.error);
    if (failedSearch?.error) throw new Error(`Unable to search published organizations: ${failedSearch.error.message}`);
    const normalizedQuery = query.toLocaleLowerCase("en-CA");
    const matchingTagOrganizationIds = ((capabilityTags.data ?? []) as CapabilityTagRow[])
      .filter((row) => Array.isArray(row.technical_tags) && row.technical_tags.some((tag) => typeof tag === "string" && tag.toLocaleLowerCase("en-CA").includes(normalizedQuery)))
      .map((row) => row.organization_id);
    const matchingLocationIds = Array.from(new Set([...(cities.data ?? []), ...(provinces.data ?? [])].map((row) => String(row.id))));
    const matchingDomainIds = Array.from(new Set([...(domainNames.data ?? []), ...(domainSummaries.data ?? [])].map((row) => String(row.id))));
    const [matchingLocationLinks, matchingCapabilityDomains] = await Promise.all([
      matchingLocationIds.length
        ? supabase.from("organization_locations").select("organization_id").eq("publication_status", "published").in("location_id", matchingLocationIds).limit(1000)
        : Promise.resolve({ data: [], error: null }),
      matchingDomainIds.length
        ? supabase.from("capability_domains").select("capability_id").eq("publication_status", "published").in("technical_domain_id", matchingDomainIds).limit(1000)
        : Promise.resolve({ data: [], error: null })
    ]);
    if (matchingLocationLinks.error) throw new Error(`Unable to search organization locations: ${matchingLocationLinks.error.message}`);
    if (matchingCapabilityDomains.error) throw new Error(`Unable to search technical domains: ${matchingCapabilityDomains.error.message}`);
    const matchingDomainCapabilityIds = Array.from(new Set((matchingCapabilityDomains.data ?? []).map((row) => String(row.capability_id))));
    const matchingDomainCapabilities = matchingDomainCapabilityIds.length
      ? await supabase.from("capabilities").select("organization_id").eq("publication_status", "published").in("id", matchingDomainCapabilityIds).limit(1000)
      : { data: [], error: null };
    if (matchingDomainCapabilities.error) throw new Error(`Unable to search technical-domain organizations: ${matchingDomainCapabilities.error.message}`);
    matchingIds = Array.from(new Set([
      ...(names.data ?? []).map((row) => String(row.id)),
      ...(legalNames.data ?? []).map((row) => String(row.id)),
      ...(capabilityNames.data ?? []).map((row) => String(row.organization_id)),
      ...(capabilitySummaries.data ?? []).map((row) => String(row.organization_id)),
      ...matchingTagOrganizationIds.map(String),
      ...(matchingDomainCapabilities.data ?? []).map((row) => String(row.organization_id)),
      ...(matchingLocationLinks.data ?? []).map((row) => String(row.organization_id))
    ])).sort();
  }

  let total = 0;
  if (!matchingIds || matchingIds.length) {
    let countQuery = supabase.from("organizations").select("id", { count: "exact", head: true }).eq("publication_status", "published");
    if (matchingIds) countQuery = countQuery.in("id", matchingIds);
    const countResult = await countQuery;
    if (countResult.error) throw new Error(`Unable to count published organizations: ${countResult.error.message}`);
    total = countResult.count ?? 0;
  }
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const rangeStart = (page - 1) * pageSize;

  let organizationRows: OrganizationRow[] = [];
  if (total > 0) {
    let organizationQuery = supabase
      .from("organizations")
      .select("id, name, slug, entity_kind, source_confidence, last_reviewed_at")
      .eq("publication_status", "published")
      .order("name")
      .range(rangeStart, rangeStart + pageSize - 1);
    if (matchingIds) organizationQuery = organizationQuery.in("id", matchingIds);
    const organizations = await organizationQuery;
    if (organizations.error) throw new Error(`Unable to load published organizations: ${organizations.error.message}`);
    organizationRows = (organizations.data ?? []) as OrganizationRow[];
  }

  const organizationIds = organizationRows.map((organization) => organization.id);
  const [capabilities, locationLinks] = organizationIds.length
    ? await Promise.all([
        supabase.from("capabilities").select("organization_id, name").eq("publication_status", "published").in("organization_id", organizationIds).order("name"),
        supabase.from("organization_locations").select("organization_id, location_id, is_primary").eq("publication_status", "published").in("organization_id", organizationIds).order("is_primary", { ascending: false })
      ])
    : [{ data: [], error: null }, { data: [], error: null }];
  if (capabilities.error) throw new Error(`Unable to load organization capabilities: ${capabilities.error.message}`);
  if (locationLinks.error) throw new Error(`Unable to load organization locations: ${locationLinks.error.message}`);
  const locationIds = Array.from(new Set(((locationLinks.data ?? []) as LocationLinkRow[]).map((link) => link.location_id)));
  const locations = locationIds.length
    ? await supabase.from("locations").select("id, city, province_territory").in("id", locationIds)
    : { data: [], error: null };
  if (locations.error) throw new Error(`Unable to load published locations: ${locations.error.message}`);

  const capabilitiesByOrganization = new Map<string, string[]>();
  for (const capability of (capabilities.data ?? []) as CapabilityRow[]) {
    const namesForOrganization = capabilitiesByOrganization.get(capability.organization_id) ?? [];
    namesForOrganization.push(capability.name);
    capabilitiesByOrganization.set(capability.organization_id, namesForOrganization);
  }
  const locationById = new Map(((locations.data ?? []) as LocationRow[]).map((location) => [location.id, location]));
  const primaryLocationByOrganization = new Map<string, LocationRow>();
  for (const link of (locationLinks.data ?? []) as LocationLinkRow[]) {
    const location = locationById.get(link.location_id);
    if (location && (!primaryLocationByOrganization.has(link.organization_id) || link.is_primary)) {
      primaryLocationByOrganization.set(link.organization_id, location);
    }
  }

  return (
    <PublicPageShell variant="admin" eyebrow="Editorial operations" title="Published organizations" description="Edit canonical organization, primary-location, and capability details without creating a new research candidate. Every save is immediately public and audit logged." backHref="/admin" backLabel="Atlas operations">
      <AdminNav />
      <form className="mb-5 flex max-w-xl gap-2" method="get">
        <label className="relative flex-1">
          <span className="sr-only">Search published organizations</span>
          <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-[var(--admin-muted)]" />
          <input name="q" defaultValue={params.q ?? ""} maxLength={120} className="form-control pl-10" placeholder="Search name, location, or capability" />
        </label>
        <button className="h-11 rounded-md bg-[var(--admin-evidence)] px-4 text-sm font-semibold text-white">Search</button>
      </form>
      <div className="mb-3 flex items-center justify-between text-xs text-[var(--admin-muted)]">
        <span>{query ? `${total} matching` : total} published {total === 1 ? "organization" : "organizations"}</span>
        {query ? <Link href="/admin/organizations" prefetch={false} className="font-semibold text-[var(--admin-action)]">Clear search</Link> : null}
      </div>
      {organizationRows.length ? (
        <>
          <div className="overflow-hidden rounded-lg border border-[var(--admin-border)] bg-white">
            <div className="hidden grid-cols-[1.2fr_0.8fr_1.2fr_0.5fr_auto] gap-4 border-b border-[var(--admin-border-subtle)] bg-[var(--admin-surface-muted)] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--admin-muted)] md:grid">
              <span>Organization</span><span>Location</span><span>Capability</span><span>Review</span><span>Actions</span>
            </div>
            {organizationRows.map((organization) => {
              const location = primaryLocationByOrganization.get(organization.id);
              return (
                <div key={organization.id} className="grid gap-3 border-b border-[var(--admin-border-subtle)] px-4 py-4 last:border-0 md:grid-cols-[1.2fr_0.8fr_1.2fr_0.5fr_auto] md:items-center md:gap-4">
                  <div><strong className="text-sm text-[var(--admin-ink)]">{organization.name}</strong><span className="mt-1 block text-[11px] text-[var(--admin-muted)]">{organization.entity_kind.replaceAll("_", " ")} · {organization.source_confidence} confidence</span></div>
                  <span className="text-xs text-[var(--admin-muted-strong)]">{location ? [location.city, location.province_territory].filter(Boolean).join(", ") : "No primary location"}</span>
                  <span className="text-xs leading-5 text-[var(--admin-muted-strong)]">{capabilitiesByOrganization.get(organization.id)?.join(" · ") || "No published capability"}</span>
                  <span className="text-xs text-[var(--admin-muted-strong)]">{organization.last_reviewed_at ? new Date(organization.last_reviewed_at).toLocaleDateString("en-CA") : "Not recorded"}</span>
                  <div className="flex items-center gap-2">
                    <Link href={`/organizations/${organization.slug}`} prefetch={false} target="_blank" className="inline-flex size-9 items-center justify-center rounded-md border border-[var(--admin-border)] text-[var(--admin-muted-strong)]" aria-label={`View ${organization.name} public profile`}><ExternalLink className="size-4" /></Link>
                    <Link href={`/admin/organizations/${organization.id}/edit`} prefetch={false} className="inline-flex h-9 items-center gap-1 rounded-md bg-[var(--admin-action)] px-3 text-xs font-semibold text-white no-underline hover:bg-[var(--admin-action-hover)] hover:no-underline">Edit <ArrowRight className="size-3.5" /></Link>
                  </div>
                </div>
              );
            })}
          </div>
          <PaginationNav path="/admin/organizations" page={page} totalPages={totalPages} start={rangeStart + 1} end={Math.min(rangeStart + organizationRows.length, total)} total={total} itemLabel="published organizations" query={{ q: query || undefined }} />
        </>
      ) : <EmptyCoverage title="No organizations match" detail="Try a different name, city, province, or capability." />}
    </PublicPageShell>
  );
}
