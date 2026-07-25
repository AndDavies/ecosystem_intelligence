import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { AtlasHeroArt } from "@/components/atlas/atlas-hero-art";
import { PublicPageShell } from "@/components/atlas/public-page-shell";
import { SectionHeading } from "@/components/ui/section-heading";
import { JsonLd } from "@/components/seo/json-ld";
import { getRegionArt, regionProvinceLabel } from "@/lib/atlas/region-presentation";
import { getAtlasSnapshot } from "@/lib/atlas/repository";
import { absoluteUrl, siteName } from "@/lib/site";
import type { AtlasRegion } from "@/types/atlas";

// Publication invalidates the shared atlas data cache, but this index must also
// render per request so a previously generated route cannot hide new coverage.
export const dynamic = "force-dynamic";

const title = "Canadian Defence Ecosystem by Region";
const description =
  "Browse published Canadian defence and dual-use coverage region by region. See how many organizations and technologies are reviewed in each part of the country, and where coverage is still thin.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/regions" },
  openGraph: {
    title,
    description,
    url: "/regions",
    type: "website",
    siteName,
    locale: "en_CA"
  },
  twitter: { card: "summary_large_image", title, description }
};

export default async function RegionsIndexPage() {
  const snapshot = await getAtlasSnapshot();
  const national = snapshot.regions.find((region) => region.slug === "canada");
  const regions = snapshot.regions.filter((region) => region.slug !== "canada");
  const covered = regions.filter((region) => region.organizationCount > 0).length;

  return (
    <PublicPageShell
      eyebrow="Where Canadian capability sits"
      title="Explore the ecosystem region by region."
      description="Every region below is built from the same reviewed public records. Counts reflect what has been published so far, so thin coverage stays visible instead of being filled in."
      breadcrumbs={[{ label: "Ecosystem Map", href: "/" }, { label: "Regions" }]}
    >
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Ecosystem Map", item: absoluteUrl("/") },
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
        <section className="mt-8 overflow-hidden rounded-[2rem] border border-[var(--atlas-border)] bg-white shadow-[var(--atlas-shadow-soft)]">
          <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]">
            <AtlasHeroArt
              tone={getRegionArt(national.slug).tone}
              icon={getRegionArt(national.slug).icon}
              eyebrow="True North Map region"
              label={national.name}
              alt={`Decorative artwork representing the ${national.name} view of the ecosystem map`}
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

      <section className="mt-12 rounded-2xl border border-dashed border-[var(--atlas-border-strong)] bg-[var(--atlas-surface-muted)] px-5 py-4">
        <p className="text-xs leading-5 text-[var(--atlas-muted)]">
          Counts describe the current published dataset, not the full size of any regional ecosystem. A low count means
          coverage is still being built, not that a region lacks capability.
        </p>
      </section>
    </PublicPageShell>
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
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-[var(--atlas-border)] bg-white shadow-[0_1px_2px_rgba(36,40,39,0.035)] transition-[translate,box-shadow,border-color] duration-200 focus-within:-translate-y-1 focus-within:border-[var(--atlas-border-strong)] focus-within:shadow-[var(--atlas-shadow-soft)] hover:-translate-y-1 hover:border-[var(--atlas-border-strong)] hover:shadow-[var(--atlas-shadow-soft)]">
      <AtlasHeroArt
        tone={art.tone}
        icon={art.icon}
        compact
        eyebrow="True North Map region"
        label={region.shortName}
        alt={`Decorative artwork representing ${region.name}`}
      />
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl font-extrabold leading-tight tracking-[-0.035em] text-[var(--atlas-ink)]">
          <Link
            href={`/regions/${region.slug}`}
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
          {region.organizationCount ? "Explore the region" : "See the coverage gap"}
          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}
