import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { AtlasHeroArt } from "@/components/atlas/atlas-hero-art";
import { CollectionContinuation, PublicPageShell } from "@/components/atlas/public-page-shell";
import { SectionHeading } from "@/components/ui/section-heading";
import { JsonLd } from "@/components/seo/json-ld";
import { getRegionArt, regionProvinceLabel } from "@/lib/atlas/region-presentation";
import { getAtlasDiscoverySnapshot } from "@/lib/atlas/repository";
import { absoluteUrl } from "@/lib/site";
import type { AtlasRegion } from "@/types/atlas";
import { socialMetadata } from "@/lib/seo/social";

// Publication invalidates the shared atlas data cache, but this index must also
// render per request so a previously generated route cannot hide new coverage.
export const dynamic = "force-dynamic";

const title = "Canadian Defence Ecosystem by Region";
const description =
  "Find Canadian defence and dual-use organizations and technologies by region, then open the profiles that may matter to your question.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/regions" },
  ...socialMetadata({ title, description, path: "/regions", eyebrow: "Where Canadian capability sits" })
};

export default function RegionsIndexPage() {
  return (
    <PublicPageShell
      eyebrow="Regions"
      title="Explore capability by region."
      description="See where Canadian organizations and technologies are located, compare regional strengths, and continue into the profiles worth examining."
      breadcrumbs={[{ label: "Map", href: "/map" }, { label: "Regions" }]}
    >
      <Suspense fallback={<RegionsDirectoryFallback />}>
        <RegionsDirectoryData />
      </Suspense>
    </PublicPageShell>
  );
}

async function RegionsDirectoryData() {
  const snapshot = await getAtlasDiscoverySnapshot();
  const national = snapshot.regions.find((region) => region.slug === "canada");
  const nationalArt = national ? getRegionArt(national.slug) : null;
  const regions = snapshot.regions.filter((region) => region.slug !== "canada");
  const covered = regions.filter((region) => region.organizationCount > 0).length;

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Ecosystem Map", item: absoluteUrl("/map") },
              { "@type": "ListItem", position: 2, name: "Regions", item: absoluteUrl("/regions") }
            ]
          },
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Canadian defence and dual-use ecosystem regions",
            description,
            url: absoluteUrl("/regions"),
            numberOfItems: snapshot.regions.length,
            itemListElement: snapshot.regions.map((region, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: region.name,
              url: absoluteUrl(`/regions/${region.slug}`)
            }))
          }
        ]}
      />

      {national ? (
        <section className="mt-8 overflow-hidden rounded-[18px] bg-white shadow-[var(--atlas-shadow-soft)]">
          <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]">
            <AtlasHeroArt
              tone={nationalArt!.tone}
              icon={nationalArt!.icon}
              eyebrow="True North Map region"
              label={national.name}
              alt={nationalArt!.imageAlt ?? `Illustrative artwork representing the ${national.name} view of the ecosystem map`}
              imageSrc={nationalArt!.imageSrc}
              imagePosition={nationalArt!.imagePosition}
              imageFit={nationalArt!.imageFit}
              showLabel={nationalArt!.showLabel}
              priority
              className="order-2 h-[200px] rounded-none sm:h-[240px] lg:order-1 lg:aspect-auto lg:h-full lg:min-h-[340px]"
            />
            <div className="order-1 flex min-w-0 flex-col justify-center p-6 sm:p-9 lg:order-2">
              <p className="atlas-eyebrow">National overview</p>
              <h2 className="mt-3 text-3xl font-extrabold leading-[1.06] tracking-[-0.045em] text-[var(--atlas-ink)] sm:text-4xl">
                {national.name}
              </h2>
              <p className="mt-4 text-sm leading-6 text-[var(--atlas-muted)] sm:text-base sm:leading-7">
                {national.description}
              </p>
              <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-[var(--atlas-border)] pt-5">
                <RegionCount label="Organizations" value={national.organizationCount} />
                <RegionCount label="Technologies" value={national.capabilityCount} />
                <RegionCount label="Clusters" value={national.clusterCount} />
              </dl>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href={`/regions/${national.slug}`}
                  data-internal-link-role="contextual"
                  data-internal-link-module="regions_national"
                  className="atlas-signal-button h-11 px-5 text-sm no-underline hover:no-underline"
                >
                  View the national picture
                  <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </Link>
                <span className="text-xs font-semibold text-[var(--atlas-muted)]">
                  {covered} of {regions.length} regions have published coverage
                </span>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-14 sm:mt-16">
        <SectionHeading
          eyebrow="Browse every region"
          title="Regions across Canada"
          description="Open a region to see its published organizations, reviewed technologies, and any clusters that the current evidence supports."
        />
        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {regions.map((region) => (
            <RegionCard key={region.slug} region={region} />
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-[18px] bg-[var(--atlas-surface-muted)] px-5 py-4">
        <p className="text-xs leading-5 text-[var(--atlas-muted)]">
          Counts and locations reflect the current published record. Regional imagery is illustrative. A low count means coverage is still being built, not that a region lacks capability.
        </p>
      </section>

      <CollectionContinuation
        title="Carry a regional view into the national map."
        description="Open the map with the same published coverage, then narrow by organization type, technology or Mission area."
        links={[{ label: "Explore the national map", href: "/map" }, { label: "Browse organizations", href: "/organizations" }]}
      />
    </>
  );
}

function RegionsDirectoryFallback() {
  return (
    <div className="mt-8" aria-live="polite" aria-busy="true">
      <p className="sr-only">Loading current regional coverage</p>
      <div aria-hidden="true" className="animate-pulse">
        <div className="grid min-h-[340px] overflow-hidden rounded-[18px] bg-white lg:grid-cols-2">
          <div className="bg-[var(--atlas-surface-muted)]" />
          <div className="space-y-4 p-7 sm:p-9">
            <div className="h-3 w-28 rounded bg-[var(--atlas-border)]" />
            <div className="h-10 w-48 rounded bg-[var(--atlas-border)]" />
            <div className="h-20 rounded bg-[var(--atlas-surface-muted)]" />
            <div className="h-16 rounded bg-[var(--atlas-surface-muted)]" />
          </div>
        </div>
        <div className="mt-14 h-7 w-56 rounded bg-[var(--atlas-border)]" />
        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-80 rounded-[18px] bg-white" />
          ))}
        </div>
      </div>
      <p className="mt-3 text-center text-xs font-semibold text-[var(--atlas-muted)]">Loading regional coverage…</p>
    </div>
  );
}

function RegionCount({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--atlas-muted)]">{label}</dt>
      <dd className="mt-1 text-2xl font-extrabold tracking-[-0.04em] text-[var(--atlas-ink)]">{value}</dd>
    </div>
  );
}

function RegionCard({ region }: { region: AtlasRegion }) {
  const art = getRegionArt(region.slug);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_1px_2px_rgba(36,40,39,0.035)] transition-shadow duration-200 focus-within:shadow-[var(--atlas-shadow-soft)] hover:shadow-[var(--atlas-shadow-soft)]">
      <AtlasHeroArt
        tone={art.tone}
        icon={art.icon}
        compact
        eyebrow="True North Map region"
        label={region.shortName}
        alt={art.imageAlt ?? `Illustrative artwork representing ${region.name}`}
        imageSrc={art.imageSrc}
        imagePosition={art.imagePosition}
        imageFit={art.imageFit}
        showLabel={art.showLabel}
        className="aspect-[4/3] border-b border-[var(--atlas-border)]"
      />
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl font-extrabold leading-tight tracking-[-0.035em] text-[var(--atlas-ink)]">
          <Link
            href={`/regions/${region.slug}`}
            data-internal-link-role="contextual"
            data-internal-link-module="regions_collection"
            className="no-underline after:absolute after:inset-0 after:content-[''] hover:no-underline group-hover:underline"
          >
            {region.name}
          </Link>
        </h3>
        <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-4 text-[var(--atlas-muted)]">
          <MapPin className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {regionProvinceLabel(region.provincesTerritories)}
        </p>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--atlas-muted)]">{region.description}</p>
        <dl className="mt-auto grid grid-cols-3 gap-3 border-t border-[var(--atlas-border)] pt-4">
          <RegionCount label="Organizations" value={region.organizationCount} />
          <RegionCount label="Technologies" value={region.capabilityCount} />
          <RegionCount label="Clusters" value={region.clusterCount} />
        </dl>
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[var(--atlas-primary)]">
          {region.organizationCount ? "Explore this region" : "See the coverage gap"}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}
