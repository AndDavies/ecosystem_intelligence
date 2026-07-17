import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Building2, Download, Layers3, MapPin } from "lucide-react";
import { EmptyCoverage, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { getAtlasRegionBySlug } from "@/lib/atlas/repository";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getAtlasRegionBySlug(slug);
  return result ? { title: `${result.region.name} Ecosystem`, description: result.region.description } : { title: "Region not found" };
}

export default async function RegionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getAtlasRegionBySlug(slug);
  if (!result) notFound();

  return (
    <PublicPageShell
      eyebrow="Regional ecosystem"
      title={result.region.name}
      description={result.region.description}
      actions={
        <>
          {result.organizations.length ? <Link href={`/api/export?type=region-report&slug=${result.region.slug}`} className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-4 text-xs font-semibold text-[#344054] no-underline hover:bg-[#f8fafc] hover:no-underline"><Download className="size-4" />Export report</Link> : null}
          <Link href={`/?region=${result.region.slug}`} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#007f98] px-4 text-xs font-semibold text-white no-underline hover:bg-[#00677d] hover:no-underline">
            Explore on atlas <ArrowRight className="size-4" />
          </Link>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard icon={<Building2 className="size-5" />} label="Published organizations" value={result.region.organizationCount} />
        <MetricCard icon={<Layers3 className="size-5" />} label="Verified capabilities" value={result.region.capabilityCount} />
        <MetricCard icon={<MapPin className="size-5" />} label="Visible clusters" value={result.region.clusterCount} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <PublicCard title="Published organizations" eyebrow="Current regional coverage">
          {result.organizations.length ? (
            <div className="divide-y divide-[#eaecf0]">
              {result.organizations.map((organization) => (
                <article key={organization.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link href={`/organizations/${organization.slug}`} className="text-sm font-bold text-[#007f98] no-underline hover:underline">{organization.name}</Link>
                    <p className="mt-1 text-xs text-[#667085]">{organization.primaryLocation?.name ?? "Location under review"}</p>
                    <p className="mt-2 line-clamp-2 max-w-2xl text-xs leading-5 text-[#475467]">{organization.description}</p>
                  </div>
                  <Link href={`/organizations/${organization.slug}`} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#007f98] no-underline hover:underline">Profile <ArrowRight className="size-3.5" /></Link>
                </article>
              ))}
            </div>
          ) : <EmptyCoverage title="No published organizations yet" detail="The region remains visible as an explicit research gap. Records will appear only after source and editorial review." />}
        </PublicCard>

        <div className="space-y-5">
          <PublicCard title="Ecosystem clusters" eyebrow="Curated groupings">
            {result.clusters.length ? (
              <div className="space-y-3">
                {result.clusters.map((cluster) => (
                  <article key={cluster.id} className="rounded-md border border-[#d0d5dd] bg-[#f8fafc] p-4">
                    <h3 className="text-sm font-bold text-[#344054]">{cluster.name}</h3>
                    <p className="mt-1 text-xs leading-5 text-[#667085]">{cluster.summary}</p>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#007f98]">{cluster.capabilityIds.length} mapped capabilities · {cluster.clusterBasis}</p>
                  </article>
                ))}
              </div>
            ) : <EmptyCoverage title="Clusters not mapped yet" detail="Cluster coverage is not inferred from a thin sample. It will be added after the regional capability base supports it." />}
          </PublicCard>
          <PublicCard title="Coverage note" eyebrow="Research status">
            <p className="text-xs leading-5 text-[#667085]">Counts reflect the current published dataset, not the total size of the real ecosystem. Unknown and thin coverage remain explicit to support gap-driven research.</p>
          </PublicCard>
        </div>
      </div>
    </PublicPageShell>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[#d0d5dd] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
      <div className="flex items-center justify-between text-[#007f98]">{icon}<span className="text-2xl font-bold tracking-[-0.04em] text-[#101828]">{value}</span></div>
      <p className="mt-3 text-xs font-semibold text-[#667085]">{label}</p>
    </div>
  );
}
