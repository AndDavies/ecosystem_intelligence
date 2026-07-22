import Link from "next/link";
import { ArrowRight, ExternalLink, Search } from "lucide-react";
import { AdminNav } from "@/components/atlas/admin-nav";
import { EmptyCoverage, PublicPageShell } from "@/components/atlas/public-page-shell";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { getAtlasSnapshot } from "@/lib/atlas/repository";

export default async function AdminOrganizationsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAtlasStaff("editor");
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? "";
  const snapshot = await getAtlasSnapshot();
  const organizations = snapshot.organizations.filter((organization) => {
    if (!query) return true;
    return [
      organization.name,
      organization.primaryLocation?.city,
      organization.primaryLocation?.provinceTerritory,
      ...organization.capabilities.flatMap((capability) => [capability.name, ...capability.technicalTags])
    ].some((value) => value?.toLowerCase().includes(query));
  });

  return (
    <PublicPageShell variant="admin" eyebrow="Editorial operations" title="Published organizations" description="Edit canonical organization, primary-location, and capability details without creating a new research candidate. Every save is immediately public and audit logged." backHref="/admin" backLabel="Atlas operations">
      <AdminNav />
      <form className="mb-5 flex max-w-xl gap-2" method="get">
        <label className="relative flex-1">
          <span className="sr-only">Search published organizations</span>
          <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-[var(--admin-muted)]" />
          <input name="q" defaultValue={params.q ?? ""} className="form-control pl-10" placeholder="Search name, location, capability, or tag" />
        </label>
        <button className="h-11 rounded-md bg-[var(--admin-evidence)] px-4 text-sm font-semibold text-white">Search</button>
      </form>
      <div className="mb-3 flex items-center justify-between text-xs text-[var(--admin-muted)]">
        <span>{organizations.length} of {snapshot.organizations.length} published organizations</span>
        {query ? <Link href="/admin/organizations" className="font-semibold text-[var(--admin-action)]">Clear search</Link> : null}
      </div>
      {organizations.length ? (
        <div className="overflow-hidden rounded-lg border border-[var(--admin-border)] bg-white">
          <div className="hidden grid-cols-[1.2fr_0.8fr_1.2fr_0.5fr_auto] gap-4 border-b border-[var(--admin-border-subtle)] bg-[var(--admin-surface-muted)] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--admin-muted)] md:grid">
            <span>Organization</span><span>Location</span><span>Capability</span><span>Review</span><span>Actions</span>
          </div>
          {organizations.map((organization) => (
            <div key={organization.id} className="grid gap-3 border-b border-[var(--admin-border-subtle)] px-4 py-4 last:border-0 md:grid-cols-[1.2fr_0.8fr_1.2fr_0.5fr_auto] md:items-center md:gap-4">
              <div><strong className="text-sm text-[var(--admin-ink)]">{organization.name}</strong><span className="mt-1 block text-[11px] text-[var(--admin-muted)]">{organization.entityKind.replaceAll("_", " ")} · {organization.sourceConfidence} confidence</span></div>
              <span className="text-xs text-[var(--admin-muted-strong)]">{organization.primaryLocation ? `${organization.primaryLocation.city ?? ""}, ${organization.primaryLocation.provinceTerritory ?? ""}` : "No primary location"}</span>
              <span className="text-xs leading-5 text-[var(--admin-muted-strong)]">{organization.capabilities.map((capability) => capability.name).join(" · ") || "No published capability"}</span>
              <span className="text-xs text-[var(--admin-muted-strong)]">{organization.lastReviewedAt ? new Date(organization.lastReviewedAt).toLocaleDateString("en-CA") : "Not recorded"}</span>
              <div className="flex items-center gap-2">
                <Link href={`/organizations/${organization.slug}`} target="_blank" className="inline-flex size-9 items-center justify-center rounded-md border border-[var(--admin-border)] text-[var(--admin-muted-strong)]" aria-label={`View ${organization.name} public profile`}><ExternalLink className="size-4" /></Link>
                <Link href={`/admin/organizations/${organization.id}/edit`} className="inline-flex h-9 items-center gap-1 rounded-md bg-[var(--admin-action)] px-3 text-xs font-semibold text-white no-underline hover:bg-[var(--admin-action-hover)] hover:no-underline">Edit <ArrowRight className="size-3.5" /></Link>
              </div>
            </div>
          ))}
        </div>
      ) : <EmptyCoverage title="No organizations match" detail="Try a different name, city, province, capability, or technical tag." />}
    </PublicPageShell>
  );
}
