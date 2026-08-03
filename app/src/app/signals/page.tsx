import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, RadioTower } from "lucide-react";
import { NorthSignalInline } from "@/components/atlas/north-signal-signup";
import { PublicPageShell } from "@/components/atlas/public-page-shell";
import { SignalArchiveBrowser } from "@/components/atlas/signal-archive-browser";
import { SignalHeroImage } from "@/components/atlas/signal-hero-image";
import { SignalTagPill } from "@/components/atlas/signal-tag-pill";
import { JsonLd } from "@/components/seo/json-ld";
import { getPublishedSignals } from "@/lib/atlas/signals";
import { collectSignalTags } from "@/lib/signals/taxonomy";
import { absoluteUrl, siteName } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Canadian Defence Signals",
  description: "A daily, source-linked scan of Canadian defence capability, public needs, procurement, funding, testing, and allied developments.",
  alternates: { canonical: "/signals" },
  openGraph: { title: "Canadian Defence Signals", description: "See what changed, why it may matter, what remains unknown, and where to continue in True North Map.", url: "/signals", type: "website", siteName, locale: "en_CA" },
  twitter: { card: "summary_large_image", title: "Canadian Defence Signals", description: "A source-linked daily scan of developments that may shape Canadian defence capability." }
};

const dateFormatter = new Intl.DateTimeFormat("en-CA", { dateStyle: "long" });

export default async function SignalsPage() {
  const editions = await getPublishedSignals();
  const latest = editions[0];
  const latestTags = latest ? collectSignalTags(latest.items).slice(0, 6) : [];

  return <PublicPageShell eyebrow="Weekday intelligence scan" title="See what Canadian defence developments add up to." description="Follow the movements connecting public need, testing, industrial capacity and allied markets. Each edition shows the decision behind the headline and the evidence worth watching next.">
    <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "Canadian Defence Signals", url: absoluteUrl("/signals"), description: metadata.description, inLanguage: "en-CA", isPartOf: { "@type": "WebSite", name: siteName, url: absoluteUrl("/") }, mainEntity: { "@type": "ItemList", numberOfItems: editions.length, itemListElement: editions.map((edition, index) => ({ "@type": "ListItem", position: index + 1, name: edition.title, url: absoluteUrl(`/signals/${edition.slug}`) })) } }} />

    {latest ? <article className="relative mt-8 grid overflow-hidden rounded-2xl border border-[var(--atlas-ink)] bg-[var(--atlas-ink)] text-white shadow-[0_22px_60px_rgba(36,40,39,0.16)] md:grid-cols-[minmax(270px,0.78fr)_minmax(0,1.22fr)]">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 z-10 h-1 bg-[var(--atlas-signal)]" />
      {latest.heroImage ? <SignalHeroImage image={latest.heroImage} priority className="min-h-[260px] border-b border-white/15 md:min-h-full md:border-b-0 md:border-r" /> : <div className="flex min-h-[280px] flex-col justify-between border-b border-white/15 bg-[linear-gradient(145deg,var(--atlas-ink),#151817)] p-7 md:border-b-0 md:border-r"><RadioTower className="size-8 text-[var(--atlas-signal)]" /><p className="text-xs leading-6 text-white/55">{latest.disclosure}</p></div>}
      <div className="flex flex-col p-7 sm:p-8 md:min-h-[420px] lg:p-10">
        <div className="flex flex-wrap items-center gap-3"><p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--atlas-signal)]">Latest Signals</p><time dateTime={latest.editionDate} className="text-xs font-semibold text-white/55">{dateFormatter.format(new Date(`${latest.editionDate}T12:00:00Z`))}</time>{latest.isLocalPreview ? <span className="rounded-full border border-[var(--atlas-signal)]/50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--atlas-signal)]">Local preview</span> : null}</div>
        <h2 className="mt-4 max-w-3xl text-3xl font-extrabold leading-[1.05] tracking-[-0.045em] sm:text-[2.4rem]">{latest.title}</h2>
        <p className="mt-4 line-clamp-6 max-w-3xl text-[15px] leading-7 text-white/72">{latest.executiveSummary}</p>
        <div className="mt-5 flex flex-wrap gap-2">{latestTags.map((tag) => <SignalTagPill key={tag} tag={tag} />)}</div>
        <div className="mt-auto pt-6"><Link href={`/signals/${latest.slug}`} className="atlas-signal-button h-11 px-5 text-sm no-underline hover:no-underline">Read {latest.isLocalPreview ? "the local preview" : "today's Signals"} <ArrowRight className="ml-2 size-4" /></Link></div>
      </div>
    </article> : <section className="mt-9 rounded-2xl border border-dashed border-[var(--atlas-border-strong)] bg-white px-6 py-12 text-center"><RadioTower className="mx-auto size-7 text-[var(--atlas-evidence)]" /><h2 className="mt-4 text-xl font-extrabold">The first Signals edition is being prepared.</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--atlas-muted)]">An edition appears only when the scan finds enough distinct, durable public evidence to support a useful read.</p></section>}

    <SignalArchiveBrowser editions={editions} featuredId={latest?.id} />
    <NorthSignalInline placement="newsletter_inline_home" trigger="signals_archive" className="mt-16" />
  </PublicPageShell>;
}
