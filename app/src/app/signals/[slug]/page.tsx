import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CircleHelp, Compass, ExternalLink, FileCheck2, Lightbulb } from "lucide-react";
import { NorthSignalInline } from "@/components/atlas/north-signal-signup";
import { PublicPageShell } from "@/components/atlas/public-page-shell";
import { PublicShare } from "@/components/atlas/public-share";
import { SignalHeroImage } from "@/components/atlas/signal-hero-image";
import { SignalTagPill } from "@/components/atlas/signal-tag-pill";
import { JsonLd } from "@/components/seo/json-ld";
import { getPublishedSignalBySlug, signalLaneLabels } from "@/lib/atlas/signals";
import { collectSignalTags } from "@/lib/signals/taxonomy";
import { absoluteUrl, siteName } from "@/lib/site";

export const revalidate = 300;
const dateFormatter = new Intl.DateTimeFormat("en-CA", { dateStyle: "long" });

export async function generateStaticParams() { return []; }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const edition = await getPublishedSignalBySlug(slug);
  if (!edition) return { title: "Signals edition not found" };
  return { title: edition.title, description: edition.executiveSummary, alternates: { canonical: `/signals/${edition.slug}` }, openGraph: { type: "article", title: edition.title, description: edition.executiveSummary, url: `/signals/${edition.slug}`, publishedTime: edition.publishedAt, modifiedTime: edition.updatedAt, authors: [edition.authorName], images: edition.heroImage ? [{ url: edition.heroImage.url, alt: edition.heroImage.alt }] : undefined }, twitter: { card: "summary_large_image", title: edition.title, description: edition.executiveSummary, images: edition.heroImage ? [edition.heroImage.url] : undefined } };
}

export default async function SignalEditionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const edition = await getPublishedSignalBySlug(slug);
  if (!edition) notFound();
  const url = `/signals/${edition.slug}`;
  const editionTags = collectSignalTags(edition.items);

  return <PublicPageShell eyebrow="Canadian Defence Signals" title={edition.title} description="See what the developments add up to, which decisions they create, and what evidence could change the view." breadcrumbs={[{ label: "Map", href: "/map" }, { label: "Signals", href: "/signals" }, { label: edition.title }]} actions={<PublicShare title={edition.title} description={edition.executiveSummary} path={url} />}>
    <JsonLd data={[{ "@context": "https://schema.org", "@type": "Article", headline: edition.title, description: edition.executiveSummary, mainEntityOfPage: absoluteUrl(url), datePublished: edition.publishedAt, dateModified: edition.updatedAt, inLanguage: "en-CA", image: edition.heroImage?.url, keywords: editionTags, author: { "@type": "Organization", name: edition.authorName }, publisher: { "@type": "Organization", name: siteName, url: absoluteUrl("/") }, citation: edition.items.flatMap((item) => item.sources.map((source) => source.url)), hasPart: edition.items.map((item) => ({ "@type": "Article", headline: item.title, description: item.executiveSummary, url: `${absoluteUrl(url)}#${item.slug}` })) }, { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "True North Map", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Signals", item: absoluteUrl("/signals") }, { "@type": "ListItem", position: 3, name: edition.title, item: absoluteUrl(url) }] }]} />

    <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-[var(--atlas-border)] py-4 text-xs font-semibold text-[var(--atlas-muted)]"><time dateTime={edition.editionDate}>{dateFormatter.format(new Date(`${edition.editionDate}T12:00:00Z`))}</time><span>{edition.items.length} source-linked signals</span>{edition.isLocalPreview ? <span className="rounded-full bg-[var(--atlas-signal)] px-3 py-1 font-extrabold text-[var(--atlas-ink)]">Local preview · not published</span> : null}{edition.amendedAt ? <span>Corrected {dateFormatter.format(new Date(edition.amendedAt))}</span> : null}</div>

    <section className={`mt-8 overflow-hidden rounded-2xl border border-[var(--atlas-border)] bg-white ${edition.heroImage ? "grid md:grid-cols-[minmax(270px,0.78fr)_minmax(0,1.22fr)]" : ""}`} aria-labelledby="signals-executive-summary">
      {edition.heroImage ? <SignalHeroImage image={edition.heroImage} priority className="min-h-[260px] border-b border-[var(--atlas-border)] md:min-h-full md:border-b-0 md:border-r" /> : null}
      <div className="relative p-6 sm:p-8 lg:p-10"><div aria-hidden="true" className="absolute left-0 top-0 h-1 w-28 bg-[var(--atlas-signal)]" /><p className="atlas-eyebrow">Executive Signals</p><h2 id="signals-executive-summary" className="mt-3 text-2xl font-extrabold tracking-[-0.035em] sm:text-3xl">What changed, and why it matters.</h2><SignalNarrative text={edition.executiveSummary} className="mt-4 max-w-3xl text-base leading-8 text-[var(--atlas-ink-soft)]" /><div className="mt-6 flex flex-wrap gap-2">{editionTags.slice(0, 8).map((tag) => <SignalTagPill key={tag} tag={tag} />)}</div><p className="mt-6 text-xs leading-6 text-[var(--atlas-muted)]">{edition.disclosure} It is not a procurement recommendation, eligibility finding, endorsement, or substitute for due diligence.</p></div>
    </section>

    <article className="mt-12 divide-y divide-[var(--atlas-border)]">
      {edition.items.map((item, index) => <section key={item.id} id={item.slug} className="scroll-mt-28 py-12 first:pt-0 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center gap-3"><span className="inline-flex size-9 items-center justify-center rounded-full bg-[var(--atlas-signal)] text-sm font-extrabold text-[var(--atlas-ink)]">{index + 1}</span><span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--atlas-primary)]">{signalLaneLabels[item.lane]}</span><span className="text-xs font-semibold text-[var(--atlas-muted)]">Evidence strength: {item.confidence}</span></div>
          <div className="mt-4 flex flex-wrap gap-2">{item.tags.map((tag) => <SignalTagPill key={tag} tag={tag} />)}</div>
          <h2 className="mt-6 max-w-4xl text-3xl font-extrabold leading-[1.08] tracking-[-0.04em] sm:text-4xl">{item.title}</h2>
          <p className="mt-4 max-w-4xl text-xl font-semibold leading-8 text-[var(--atlas-ink-soft)]">{item.bottomLine}</p>
          <SignalNarrative text={item.executiveSummary} className="mt-5 max-w-4xl text-[16px] leading-8 text-[var(--atlas-muted)] sm:text-[17px]" />

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <SignalBlock title="What the public record says" text={item.sourceFact} icon={FileCheck2} tone="fact" />
            <SignalBlock title="Why this may matter" text={item.automatedRead} icon={Lightbulb} tone="assessment" />
            <SignalBlock title="What remains unknown" text={item.unknowns} icon={CircleHelp} tone="gap" />
            <SignalBlock title="Practical next step" text={item.nextStep} icon={Compass} tone="next" />
          </div>

          <div className="mt-7 flex flex-col gap-4 border-t border-[var(--atlas-border)] pt-6 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--atlas-muted)]">Original source{item.sources.length === 1 ? "" : "s"}</p><ul className="mt-3 space-y-2">{item.sources.map((source, sourceIndex) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer" className={`inline-flex min-h-10 items-center gap-2 font-bold no-underline hover:underline ${sourceIndex === 0 ? "text-sm text-[var(--atlas-primary)]" : "text-xs text-[var(--atlas-muted)]"}`}>{source.publisher}: {source.title}<ExternalLink className="size-3.5 shrink-0" /></a>{source.locator ? <span className="ml-2 text-xs text-[var(--atlas-muted)]">{source.locator}</span> : null}</li>)}</ul></div>
            {item.links.length ? <div className="flex max-w-md flex-wrap gap-2 sm:justify-end">{item.links.map((link) => <Link key={`${link.type}:${link.id}`} href={link.href} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--atlas-border)] bg-white px-4 text-xs font-bold text-[var(--atlas-ink)] no-underline hover:border-[var(--atlas-ink)] hover:no-underline">{link.label}<ArrowRight className="size-3.5" /></Link>)}</div> : null}
          </div>
        </div>
      </section>)}
    </article>
    <NorthSignalInline placement="newsletter_inline_brief" trigger="signals_complete" className="mt-8" />
  </PublicPageShell>;
}

function SignalBlock({ title, text, icon: Icon, tone }: { title: string; text: string; icon: typeof FileCheck2; tone: "fact" | "assessment" | "gap" | "next" }) {
  const tones = {
    fact: "border-[var(--atlas-primary-border)] bg-white text-[var(--atlas-primary)]",
    assessment: "border-[var(--atlas-signal)] bg-[var(--atlas-signal-soft)] text-[var(--atlas-ink)]",
    gap: "border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] text-[var(--atlas-muted)]",
    next: "border-[var(--atlas-ink)] bg-[var(--atlas-ink)] text-[var(--atlas-signal)]"
  } as const;
  const textTone = tone === "next" ? "text-white/75" : "text-[var(--atlas-ink-soft)]";
  return <div className={`rounded-2xl border p-5 sm:p-6 ${tones[tone]}`}><Icon className="size-5" /><p className={`mt-4 text-xs font-extrabold uppercase tracking-[0.12em] ${tone === "next" ? "text-[var(--atlas-signal)]" : "text-[var(--atlas-ink)]"}`}>{title}</p><p className={`mt-3 text-sm leading-7 ${textTone}`}>{text}</p></div>;
}

function SignalNarrative({ text, className }: { text: string; className: string }) {
  return <div className={`${className} space-y-4`}>{text.split(/\n\s*\n/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>;
}
