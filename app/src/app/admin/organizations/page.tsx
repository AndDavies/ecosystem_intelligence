import Link from "next/link";
import { ArrowRight, ExternalLink, Search } from "lucide-react";
import { AdminNav } from "@/components/atlas/admin-nav";
import { EmptyCoverage, PublicPageShell } from "@/components/atlas/public-page-shell";
import { PaginationNav } from "@/components/ui/pagination-nav";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { findPublishedOrganizationIds } from "@/lib/atlas/admin-organization-search";
import { collectPagedRows, collectPagedRowsByIds } from "@/lib/supabase/pagination";
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
type LocationLinkRow = { organization_id: string; location_id: string; is_primary: boolean };
type LocationRow = { id: string; city: string | null; province_territory: string | null };

export default async function AdminOrganizationsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requireAtlasStaff("editor");
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 120) ?? "";
  const requestedPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const supabase = await createClient();

  const matchingIds = query ? await findPublishedOrganizationIds(supabase, query) : null;
  let matchingRows: OrganizationRow[] | null = null;
  let total = 0;
  if (matchingIds) {
    matchingRows = await collectPagedRowsByIds(matchingIds, (batch, from, to) => supabase.from("organizations")
      .select("id, name, slug, entity_kind, source_confidence, last_reviewed_at")
      .eq("publication_status", "published").in("id", batch).order("name").order("id").range(from, to), "matching published organizations");
    matchingRows.sort((left, right) => left.name.localeCompare(right.name, "en-CA") || left.id.localeCompare(right.id));
    total = matchingRows.length;
  } else {
    const countResult = await supabase.from("organizations").select("id", { count: "exact", head: true }).eq("publication_status", "published");
    if (countResult.error) throw new Error(`Unable to count published organizations: ${countResult.error.message}`);
    total = countResult.count ?? 0;
  }
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const rangeStart = (page - 1) * pageSize;

  let organizationRows: OrganizationRow[] = [];
  if (matchingRows) {
    organizationRows = matchingRows.slice(rangeStart, rangeStart + pageSize);
  } else if (total > 0) {
    const organizationQuery = supabase
      .from("organizations")
      .select("id, name, slug, entity_kind, source_confidence, last_reviewed_at")
      .eq("publication_status", "published")
      .order("name").order("id")
      .range(rangeStart, rangeStart + pageSize - 1);
    const organizations = await organizationQuery;
    if (organizations.error) throw new Error(`Unable to load published organizations: ${organizations.error.message}`);
    organizationRows = (organizations.data ?? []) as OrganizationRow[];
  }

  const organizationIds = organizationRows.map((organization) => organization.id);
  const [capabilities, locationLinks] = organizationIds.length
    ? await Promise.all([
        collectPagedRows((from, to) => supabase.from("capabilities").select("organization_id, name").eq("publication_status", "published").in("organization_id", organizationIds).order("name").order("id").range(from, to), "Admin capabilities").then((data) => ({ data, error: null })),
        collectPagedRows((from, to) => supabase.from("organization_locations").select("organization_id, location_id, is_primary").eq("publication_status", "published").in("organization_id", organizationIds).order("is_primary", { ascending: false }).order("organization_id").order("location_id").range(from, to), "Admin location links").then((data) => ({ data, error: null }))
      ])
    : [{ data: [], error: null }, { data: [], error: null }];
  const locationIds = Array.from(new Set(((locationLinks.data ?? []) as LocationLinkRow[]).map((link) => link.location_id)));
  const locations = locationIds.length
    ? await collectPagedRowsByIds(locationIds, (batch, from, to) => supabase.from("locations").select("id, city, province_territory").in("id", batch).order("id").range(from, to), "Admin locations").then((data) => ({ data, error: null }))
    : { data: [], error: null };

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
