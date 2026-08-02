import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, Layers3, SearchCheck, ShieldAlert } from "lucide-react";
import { EvidenceLegend } from "@/components/atlas/evidence-legend";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { StatTile } from "@/components/ui/stat-tile";
import { getAtlasMissionIndex } from "@/lib/atlas/repository";
import { socialMetadata } from "@/lib/seo/social";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mission Areas and Use Cases",
  description: "Start with an operational mission or use case, then explore Canadian organizations and technology reviewed for possible relevance.",
  alternates: { canonical: "/missions" },
  ...socialMetadata({
    title: "Mission Areas and Use Cases",
    description: "Start with the mission, then explore reviewed Canadian technology that may help.",
    path: "/missions",
    eyebrow: "Start with the mission"
  })
};

export default async function MissionsPage() {
  const snapshot = await getAtlasMissionIndex();
  return (
    <PublicPageShell
      eyebrow="Mission Areas and Use Cases"
      title="Start with the mission."
      description="Explore the operational problems and use cases True North Map uses to organize reviewed Canadian technology. Move from the outcome you need to the organizations and capabilities worth inspecting."
      breadcrumbs={[{ label: "Map", href: "/map" }, { label: "Mission Areas" }]}
    >
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "True North Map Mission Areas and Use Cases",
          description: metadata.description,
          url: absoluteUrl("/missions"),
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: snapshot.missions.length,
            itemListElement: snapshot.missions.map((mission, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: mission.missionArea.name,
              url: absoluteUrl(`/missions/${mission.missionArea.slug}`)
            }))
          }
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "True North Map", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Mission Areas", item: absoluteUrl("/missions") }
          ]
        }
      ]} />

      <EvidenceLegend compact className="mb-5" />
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-[var(--atlas-amber)] bg-[var(--atlas-amber-soft)] px-4 py-3 text-xs leading-5 text-[var(--atlas-amber)]">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>Mission Areas are reviewed True North Map groupings. They are not released requirements, procurement priorities, Public Needs, customer interest, or classified guidance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile icon={Compass} label="Published mission areas" value={snapshot.missions.length} />
        <StatTile icon={SearchCheck} label="Organizations connected through review" value={snapshot.organizationCount} />
        <StatTile icon={Layers3} label="Technologies mapped to a mission" value={snapshot.capabilityCount} />
      </div>

      <section className="mt-12" aria-labelledby="mission-directory-heading">
        <p className="atlas-eyebrow">Choose an operational lens</p>
        <h2 id="mission-directory-heading" className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[var(--atlas-ink)] sm:text-3xl">Where are you trying to create an outcome?</h2>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {snapshot.missions.map((item) => (
            <PublicCard key={item.missionArea.id} className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <span className="flex size-10 items-center justify-center rounded-lg bg-[var(--atlas-primary-soft)] text-[var(--atlas-primary)]"><Compass className="size-5" aria-hidden="true" /></span>
                <span className="rounded bg-[var(--atlas-surface-muted)] px-2 py-1 text-[10px] font-bold text-[var(--atlas-muted)] ring-1 ring-[var(--atlas-border)]">Our assessment</span>
              </div>
              <h3 className="mt-5 text-xl font-extrabold tracking-[-0.03em] text-[var(--atlas-ink)]">{item.missionArea.name}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--atlas-muted)]">{item.missionArea.summary}</p>
              <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-[var(--atlas-border)] pt-4 text-center">
                <div><dt className="text-[10px] text-[var(--atlas-muted)]">Organizations</dt><dd className="mt-1 text-lg font-extrabold text-[var(--atlas-ink)]">{item.organizationCount}</dd></div>
                <div><dt className="text-[10px] text-[var(--atlas-muted)]">Technologies</dt><dd className="mt-1 text-lg font-extrabold text-[var(--atlas-ink)]">{item.capabilityCount}</dd></div>
                <div><dt className="text-[10px] text-[var(--atlas-muted)]">Public Needs</dt><dd className="mt-1 text-lg font-extrabold text-[var(--atlas-ink)]">{item.connectedPublicNeedCount}</dd></div>
              </dl>
              <Link href={`/missions/${item.missionArea.slug}`} className="mt-auto inline-flex items-center gap-1 pt-5 text-xs font-bold text-[var(--atlas-primary)] no-underline hover:underline">
                Explore the mission landscape <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </PublicCard>
          ))}
        </div>
      </section>
    </PublicPageShell>
  );
}
