import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, Layers3, SearchCheck, type LucideIcon } from "lucide-react";
import { CollectionContinuation, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { getAtlasMissionIndex } from "@/lib/atlas/repository";
import { socialMetadata } from "@/lib/seo/social";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mission Areas and Use Cases",
  description: "Start with an operational mission or use case, then find the Canadian organizations and technologies that may be worth examining next.",
  alternates: { canonical: "/missions" },
  ...socialMetadata({
    title: "Mission Areas and Use Cases",
    description: "Start with the mission, then see which Canadian organizations and technologies may help and why.",
    path: "/missions",
    eyebrow: "Start with the mission"
  })
};

export default async function MissionsPage() {
  const snapshot = await getAtlasMissionIndex();
  return (
    <PublicPageShell
      eyebrow="Mission Areas"
      title="Start with an operational problem."
      description="Choose a reviewed discovery lens to explore related organizations, technologies and public needs. Mission Areas are not released requirements or procurement direction."
      actions={<Link href="/map" className="atlas-primary-button min-h-11 gap-2 px-5 text-sm">Explore the map <ArrowRight className="size-4" aria-hidden="true" /></Link>}
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

      <dl className="mt-7 grid grid-cols-3 gap-2">
        <MissionStat icon={Compass} label="Published mission areas" value={snapshot.missions.length} tone="blue" />
        <MissionStat icon={SearchCheck} label="Published organizations" value={snapshot.organizationCount} tone="evidence" />
        <MissionStat icon={Layers3} label="Published technologies" value={snapshot.capabilityCount} tone="signal" />
      </dl>

      <section className="mt-9 sm:mt-11" aria-labelledby="mission-directory-heading">
        <p className="atlas-eyebrow">Choose an operational lens</p>
        <h2 id="mission-directory-heading" className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[var(--atlas-ink)] sm:text-3xl">Where are you trying to create an outcome?</h2>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {snapshot.missions.map((item) => (
            <PublicCard key={item.missionArea.id} className="group relative flex h-full flex-col transition-shadow duration-200 hover:shadow-[var(--atlas-shadow-soft)] focus-within:shadow-[var(--atlas-shadow-soft)]">
              <div className="flex items-start justify-between gap-4">
                <span className="flex size-10 items-center justify-center rounded-lg bg-[var(--atlas-primary-soft)] text-[var(--atlas-primary)]"><Compass className="size-5" aria-hidden="true" /></span>
                <span className="rounded bg-[var(--atlas-surface-muted)] px-2 py-1 text-[10px] font-bold text-[var(--atlas-muted)] ring-1 ring-[var(--atlas-border)]">Our assessment</span>
              </div>
              <h3 className="mt-5 text-xl font-extrabold tracking-[-0.03em] text-[var(--atlas-ink)]">{item.missionArea.name}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--atlas-muted)]">{item.missionArea.summary}</p>
              <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-[var(--atlas-border)] pt-4 text-center">
                <div><dt className="text-[10px] text-[var(--atlas-muted)]">Published organizations</dt><dd className="mt-1 text-lg font-extrabold text-[var(--atlas-ink)]">{item.organizationCount}</dd></div>
                <div><dt className="text-[10px] text-[var(--atlas-muted)]">Published technologies</dt><dd className="mt-1 text-lg font-extrabold text-[var(--atlas-ink)]">{item.capabilityCount}</dd></div>
                <div><dt className="text-[10px] text-[var(--atlas-muted)]">Published Public Needs</dt><dd className="mt-1 text-lg font-extrabold text-[var(--atlas-ink)]">{item.connectedPublicNeedCount}</dd></div>
              </dl>
              <Link href={`/missions/${item.missionArea.slug}`} className="mt-auto inline-flex items-center gap-1 pt-5 text-xs font-bold text-[var(--atlas-primary)] no-underline after:absolute after:inset-0 after:rounded-[18px] after:content-[''] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-evidence)]">
                Explore this mission <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </PublicCard>
          ))}
        </div>
      </section>

      <CollectionContinuation
        title="Continue from the mission."
        description="Open related organizations, review released Public Needs or carry the mission into the map."
        links={[{ label: "Open the map", href: "/map" }, { label: "Review public needs", href: "/demand" }, { label: "Browse organizations", href: "/organizations" }]}
      />
    </PublicPageShell>
  );
}

const missionStatTone = {
  blue: "bg-[var(--atlas-blue-soft)]",
  evidence: "bg-[var(--atlas-evidence-soft)]",
  signal: "bg-[var(--atlas-signal-soft)]"
} as const;

const missionStatIconTone = {
  blue: "text-[var(--atlas-ink)]",
  evidence: "text-[var(--atlas-evidence)]",
  signal: "text-[var(--atlas-ink)]"
} as const;

function MissionStat({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: keyof typeof missionStatTone;
}) {
  return (
    <div className={`rounded-[14px] px-3 py-3 sm:px-4 ${missionStatTone[tone]}`}>
      <div className="flex items-start gap-2 sm:items-center sm:gap-2.5">
        <Icon className={`mt-0.5 size-4 shrink-0 sm:mt-0 ${missionStatIconTone[tone]}`} aria-hidden="true" />
        <div className="flex min-w-0 flex-col">
          <dt className="order-2 mt-1.5 text-[10px] font-bold leading-4 text-[var(--atlas-muted)] sm:text-[11px]">{label}</dt>
          <dd className="order-1 font-[family-name:var(--font-barlow)] text-xl font-extrabold leading-none tracking-[-0.04em] text-[var(--atlas-ink)] sm:text-2xl">{value.toLocaleString("en-CA")}</dd>
        </div>
      </div>
    </div>
  );
}
