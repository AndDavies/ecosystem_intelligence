import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Building2, Download, Layers3, MapPin } from "lucide-react";
import { EmptyCoverage, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { getAtlasRegionBySlug } from "@/lib/atlas/repository";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getAtlasRegionBySlug(slug);
  return result ? { title: `${result.region.name} Ecosystem`, description: result.region.description, alternates: { canonical: `/regions/${result.region.slug}` }, openGraph: { title: `${result.region.name} Defence and Dual-Use Ecosystem`, description: result.region.description, url: `/regions/${result.region.slug}` } } : { title: "Region not found" };
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
          {result.organizations.length ? <Link href={`/api/export?type=region-report&slug=${result.region.slug}`} className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--atlas-border)] bg-white px-4 text-xs font-semibold text-[var(--atlas-ink-soft)] no-underline hover:bg-[var(--atlas-surface-muted)] hover:no-underline"><Download className="size-4" />Export report</Link> : null}
          <Link href={`/?region=${result.region.slug}`} className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--atlas-primary)] px-4 text-xs font-semibold text-white no-underline hover:bg-[var(--atlas-primary-hover)] hover:no-underline">
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
            <div className="divide-y divide-[var(--atlas-border)]">
              {result.organizations.map((organization) => (
                <article key={organization.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link href={`/organizations/${organization.slug}`} className="text-sm font-bold text-[var(--atlas-primary)] no-underline hover:underline">{organization.name}</Link>
                    <p className="mt-1 text-xs text-[var(--atlas-muted)]">{organization.primaryLocation?.name ?? "Location under review"}</p>
                    <p className="mt-2 line-clamp-2 max-w-2xl text-xs leading-5 text-[var(--atlas-muted)]">{organization.description}</p>
                  </div>
                  <Link href={`/organizations/${organization.slug}`} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--atlas-primary)] no-underline hover:underline">Profile <ArrowRight className="size-3.5" /></Link>
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
                  <article key={cluster.id} className="rounded-md border border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] p-4">
                    <h3 className="text-sm font-bold text-[var(--atlas-ink-soft)]">{cluster.name}</h3>
                    <p className="mt-1 text-xs leading-5 text-[var(--atlas-muted)]">{cluster.summary}</p>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--atlas-primary)]">{cluster.capabilityIds.length} mapped capabilities · {cluster.clusterBasis}</p>
                  </article>
                ))}
              </div>
            ) : <EmptyCoverage title="Clusters not mapped yet" detail="Cluster coverage is not inferred from a thin sample. It will be added after the regional capability base supports it." />}
          </PublicCard>
          <PublicCard title="Coverage note" eyebrow="Research status">
            <p className="text-xs leading-5 text-[var(--atlas-muted)]">Counts reflect the current published dataset, not the total size of the real ecosystem. Unknown and thin coverage remain explicit to support gap-driven research.</p>
          </PublicCard>
        </div>
      </div>
    </PublicPageShell>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--atlas-border)] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
      <div className="flex items-center justify-between text-[var(--atlas-primary)]">{icon}<span className="text-2xl font-bold tracking-[-0.04em] text-[var(--atlas-ink)]">{value}</span></div>
      <p className="mt-3 text-xs font-semibold text-[var(--atlas-muted)]">{label}</p>
    </div>
  );
}
