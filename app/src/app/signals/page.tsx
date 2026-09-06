import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, RadioTower, Rss } from "lucide-react";
import { NorthSignalInline } from "@/components/atlas/north-signal-signup";
import { PublicPageShell } from "@/components/atlas/public-page-shell";
import { SignalArchiveBrowser } from "@/components/atlas/signal-archive-browser";
import { SignalVisual } from "@/components/atlas/signal-visual";
import { signalLeadVisual } from "@/lib/signals/visuals";
import { SignalTagPill } from "@/components/atlas/signal-tag-pill";
import { JsonLd } from "@/components/seo/json-ld";
import { getAllPublishedSignals } from "@/lib/atlas/signals";
import { signalEditionExcerpt } from "@/lib/signals/presentation";
import { collectSignalTags } from "@/lib/signals/taxonomy";
import { absoluteUrl, siteName } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Canadian Defence Signals | Source-Linked Defence Developments",
  description: "Source-linked Canadian defence developments and what they may change.",
  alternates: { canonical: "/signals", types: { "application/rss+xml": "/signals/feed.xml" } },
  openGraph: { title: "Canadian Defence Signals", description: "See what changed, which Canadian capabilities it may affect, and what teams may want to inspect next.", url: "/signals", type: "website", siteName, locale: "en_CA", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "True North Map Canadian Defence Signals" }] },
  twitter: { card: "summary_large_image", title: "Canadian Defence Signals", description: "Developments that may change what Canadian defence teams inspect next.", images: ["/opengraph-image"] }
};

const dateFormatter = new Intl.DateTimeFormat("en-CA", { dateStyle: "long" });

export default async function SignalsPage() {
  const editions = await getAllPublishedSignals();
  const latest = editions[0];
  const latestTags = latest ? collectSignalTags(latest.items).slice(0, 4) : [];

  return <PublicPageShell
    variant="collection"
    eyebrow="Defence Signals"
    title="Canadian Defence Signals"
    description="Source-linked Canadian defence developments and what they may change."
    actions={<Link href="/signals/feed.xml" className="atlas-secondary-button h-11 gap-2 px-4 text-sm"><Rss className="size-4" aria-hidden="true" />RSS feed</Link>}
  >
    <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "Canadian Defence Signals", url: absoluteUrl("/signals"), description: metadata.description, inLanguage: "en-CA", isPartOf: { "@type": "WebSite", name: siteName, url: absoluteUrl("/") }, mainEntity: { "@type": "ItemList", numberOfItems: editions.length, itemListElement: editions.map((edition, index) => ({ "@type": "ListItem", position: index + 1, name: edition.title, url: absoluteUrl(`/signals/${edition.slug}`) })) } }} />

    {latest ? <article className="atlas-signal-archive-feature relative mt-4 grid overflow-hidden bg-[var(--atlas-ink)] text-white lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
      <SignalVisual visual={signalLeadVisual(latest)} priority />
      <div className="flex flex-col justify-center p-6 sm:p-8 md:min-h-[240px] lg:order-first">
        <div className="flex flex-wrap items-center gap-3"><p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--atlas-signal)]">Latest edition</p><time dateTime={latest.editionDate} className="text-xs font-semibold text-white/55">{dateFormatter.format(new Date(`${latest.editionDate}T12:00:00Z`))}</time>{latest.isLocalPreview ? <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--atlas-signal)]">Local preview</span> : null}</div>
        <h2 className="mt-3 max-w-3xl font-[family-name:var(--font-barlow)] text-2xl font-extrabold leading-[1.05] tracking-[-0.045em] sm:text-[2rem]">{latest.title}</h2>
        <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-white/72">{signalEditionExcerpt(latest)}</p>
        <div className="mt-3 hidden flex-wrap gap-2 xl:flex">{latestTags.map((tag) => <SignalTagPill key={tag} tag={tag} surface="signal" />)}</div>
        <div className="mt-6 pt-3"><Link href={`/signals/${latest.slug}`} data-internal-link-role="contextual" data-internal-link-module="signals_latest" className="atlas-signal-button h-11 px-5 text-sm no-underline hover:no-underline">Read {latest.isLocalPreview ? "the local preview" : "the latest Defence Signal"} <ArrowRight className="ml-2 size-4" /></Link></div>
      </div>
    </article> : <section className="mt-9 border-y border-[var(--atlas-border)] bg-white px-6 py-12 text-center"><RadioTower className="mx-auto size-7 text-[var(--atlas-evidence)]" /><h2 className="mt-4 text-xl font-extrabold">The first Signals edition is being prepared.</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--atlas-muted)]">An edition appears only when the scan finds enough distinct, durable public evidence to support a useful read.</p></section>}

    <SignalArchiveBrowser editions={editions} featuredId={latest?.id} />
    <NorthSignalInline placement="newsletter_inline_signals" trigger="signals_feature_complete" className="mt-8" />
  </PublicPageShell>;
}
