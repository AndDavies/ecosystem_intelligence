import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CircleHelp,
  Clock3,
  Compass,
  ExternalLink,
  FileCheck2,
  Lightbulb
} from "lucide-react";
import { NorthSignalInline } from "@/components/atlas/north-signal-signup";
import { PublicPageShell } from "@/components/atlas/public-page-shell";
import { SignalTagPill } from "@/components/atlas/signal-tag-pill";
import { JsonLd } from "@/components/seo/json-ld";
import {
  getPublishedSignalBySlug,
  getPublishedSignals,
  signalLaneLabels,
  type SignalEdition,
  type SignalRecordLink
} from "@/lib/atlas/signals";
import { collectSignalTags } from "@/lib/signals/taxonomy";
import { absoluteUrl, siteName } from "@/lib/site";
import { SignalArticleNavigation } from "./signal-article-navigation";
import { SignalEditionShare } from "./signal-edition-share";

export const revalidate = 300;

const dateFormatter = new Intl.DateTimeFormat("en-CA", { dateStyle: "long" });
const continuationLabels: Record<SignalRecordLink["type"], string> = {
  organization: "Organization",
  capability: "Technology",
  demand_requirement: "Public Need",
  mission_area: "Mission Area"
};

export async function generateStaticParams() { return []; }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const edition = await getPublishedSignalBySlug(slug);
  if (!edition) return { title: "Signals edition not found" };
  const description = metadataDescription(summaryParagraphs(edition.executiveSummary)[0] ?? edition.executiveSummary);
  return {
    title: edition.title,
    description,
    alternates: { canonical: `/signals/${edition.slug}` },
    openGraph: {
      type: "article",
      title: edition.title,
      description,
      url: `/signals/${edition.slug}`,
      publishedTime: edition.publishedAt,
      modifiedTime: edition.amendedAt ?? edition.updatedAt,
      authors: [edition.authorName],
      images: edition.heroImage ? [{ url: edition.heroImage.url, width: 1600, height: 900, alt: edition.heroImage.alt }] : undefined
    },
    twitter: {
      card: "summary_large_image",
      title: edition.title,
      description,
      images: edition.heroImage ? [{ url: edition.heroImage.url, alt: edition.heroImage.alt }] : undefined
    }
  };
}

export default async function SignalEditionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [edition, archive] = await Promise.all([getPublishedSignalBySlug(slug), getPublishedSignals(30)]);
  if (!edition) notFound();

  const url = `/signals/${edition.slug}`;
  const editionTags = collectSignalTags(edition.items);
  const { deck, bottomLine, boundary } = editionPresentation(edition.executiveSummary);
  const navigationItems = edition.items.map((item, index) => ({ id: item.slug, label: item.title, position: index + 1 }));
  const continuationLinks = uniqueContinuationLinks(edition);
  const { previousEdition, nextEdition, relatedEditions } = editionNavigation(edition, archive);
  const readingMinutes = readingTime(edition);
  const modifiedAt = edition.amendedAt ?? (edition.updatedAt !== edition.publishedAt ? edition.updatedAt : null);

  return <PublicPageShell
    eyebrow="Canadian Defence Signals"
    title={edition.title}
    breadcrumbs={[{ label: "Map", href: "/map" }, { label: "Signals", href: "/signals" }, { label: edition.title }]}
    pageHeader={<></>}
  >
    <JsonLd data={[
      {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: edition.title,
        description: metadataDescription(deck),
        mainEntityOfPage: absoluteUrl(url),
        datePublished: edition.publishedAt,
        dateModified: edition.amendedAt ?? edition.updatedAt,
        inLanguage: "en-CA",
        articleSection: "Canadian Defence Signals",
        image: edition.heroImage ? { "@type": "ImageObject", url: edition.heroImage.url, width: 1600, height: 900, caption: edition.heroImage.alt } : undefined,
        keywords: editionTags,
        about: editionTags.map((tag) => ({ "@type": "Thing", name: tag })),
        author: { "@type": "Organization", name: edition.authorName, url: absoluteUrl("/about") },
        publisher: { "@type": "Organization", name: siteName, url: absoluteUrl("/") },
        citation: edition.items.flatMap((item) => item.sources.map((source) => source.url)),
        hasPart: edition.items.map((item) => ({ "@type": "WebPageElement", name: item.title, description: item.bottomLine, url: `${absoluteUrl(url)}#${item.slug}` }))
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "True North Map", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Signals", item: absoluteUrl("/signals") },
          { "@type": "ListItem", position: 3, name: edition.title, item: absoluteUrl(url) }
        ]
      }
    ]} />

    <article aria-labelledby="signal-edition-title" className="mt-6 sm:mt-8">
      <header className={`atlas-tonal-surface atlas-tonal-paper mx-auto w-full overflow-hidden shadow-[var(--atlas-shadow-soft)] ${edition.heroImage ? "lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)]" : ""}`}>
        <div className="min-w-0 px-5 py-8 sm:px-8 sm:py-10 lg:flex lg:min-h-[400px] lg:flex-col lg:justify-center lg:px-12 lg:py-9">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-heading text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--atlas-primary)]">True North Defence Signals</p>
            {edition.isLocalPreview ? <span className="rounded-full bg-[var(--atlas-signal-soft)] px-3 py-1 text-xs font-extrabold text-[var(--atlas-ink)]">Local preview · not published</span> : null}
          </div>
          <h1 id="signal-edition-title" className="mt-5 max-w-[18ch] font-heading text-[clamp(2.25rem,4.7vw,4rem)] font-extrabold leading-[0.98] tracking-[-0.055em] text-[var(--atlas-ink)]">{edition.title}</h1>
          <SignalNarrative text={deck} className="mt-6 max-w-2xl text-[17px] leading-8 text-[var(--atlas-ink-soft)] sm:text-lg" />
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-[var(--atlas-border)] pt-5 text-sm text-[var(--atlas-muted)]">
            <span className="inline-flex items-center gap-2"><CalendarDays className="size-4 text-[var(--atlas-primary)]" aria-hidden="true" /><time dateTime={edition.publishedAt}>{dateFormatter.format(new Date(edition.publishedAt))}</time></span>
            <span className="inline-flex items-center gap-2"><Clock3 className="size-4 text-[var(--atlas-primary)]" aria-hidden="true" />{readingMinutes} min read</span>
            {modifiedAt ? <span>Updated <time dateTime={modifiedAt}>{dateFormatter.format(new Date(modifiedAt))}</time></span> : null}
          </div>
          <div className="mt-5"><SignalEditionShare title={edition.title} path={url} /></div>
        </div>
        {edition.heroImage ? <EditorialHero image={edition.heroImage} /> : null}
      </header>

      <section aria-labelledby="briefing-snapshot-heading" className="mx-auto mt-12 w-full pb-12 sm:mt-16 sm:pb-16 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.36fr)] lg:gap-8">
        <div className="atlas-tonal-surface atlas-tonal-signal min-w-0 p-6 sm:p-8 lg:p-10">
          <p className="font-heading text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--atlas-primary)]">Editorial briefing snapshot</p>
          <h2 id="briefing-snapshot-heading" className="mt-3 font-heading text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">The Bottom Line</h2>
          <SignalNarrative text={bottomLine} className="mt-5 max-w-[48rem] text-[17px] leading-8 text-[var(--atlas-ink-soft)] sm:text-lg" />
          <div className="mt-6 flex flex-wrap gap-2">{editionTags.slice(0, 8).map((tag) => <SignalTagPill key={tag} tag={tag} surface="signal" />)}</div>
        </div>
        <div className="atlas-tonal-surface atlas-tonal-blue mt-6 min-w-0 p-6 sm:p-8 lg:mt-0">
          <SignalArticleNavigation items={navigationItems} label="In this edition" />
        </div>
      </section>

      <div className="mx-auto w-full xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(280px,300px)] xl:gap-12">
        <div className="min-w-0">
          {edition.items.map((item, index) => <section key={item.id} id={item.slug} tabIndex={-1} aria-labelledby={`${item.slug}-heading`} className="scroll-mt-28 mb-6 rounded-[18px] bg-white p-5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-signal)] focus-visible:ring-offset-4 sm:p-8">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="font-heading text-sm font-extrabold text-[var(--atlas-primary)]">{String(index + 1).padStart(2, "0")}</span>
              <span className="font-heading text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--atlas-primary)]">{signalLaneLabels[item.lane]}</span>
            </div>
            <h2 id={`${item.slug}-heading`} className="mt-5 max-w-[18ch] font-heading text-3xl font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[2.65rem]">{item.title}</h2>
            <p className="mt-5 max-w-[46rem] rounded-2xl bg-[var(--atlas-blue-soft)] px-5 py-4 text-xl font-semibold leading-8 text-[var(--atlas-ink-soft)]">{item.bottomLine}</p>
            <SignalNarrative text={item.executiveSummary} className="mt-6 max-w-[47rem] text-[17px] leading-8 text-[var(--atlas-ink-soft)]" />

            <div className="mt-8 grid gap-3 md:grid-cols-2">
              <SignalBlock title="What the public record says" text={item.sourceFact} icon={FileCheck2} tone="fact" />
              <SignalBlock title="Why this may matter" text={item.automatedRead} icon={Lightbulb} tone="assessment" />
              <SignalBlock title="What remains unknown" text={item.unknowns} icon={CircleHelp} tone="gap" />
              <SignalBlock title="Practical next step" text={item.nextStep} icon={Compass} tone="next" />
            </div>

            <div className="mt-8 grid gap-6 rounded-2xl bg-[var(--atlas-blue-soft)] p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-6">
              <div className="min-w-0">
                <h3 className="font-heading text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--atlas-ink)]">Original source{item.sources.length === 1 ? "" : "s"}</h3>
                <ul className="mt-3 space-y-3">{item.sources.map((source) => <li key={source.id} className="min-w-0">
                  <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 max-w-full items-start gap-2 [overflow-wrap:anywhere] font-bold leading-6 text-[var(--atlas-primary)] no-underline hover:underline">
                    <span>{source.publisher}: {source.title}</span><ExternalLink className="mt-1 size-4 shrink-0" aria-hidden="true" />
                  </a>
                  {source.locator ? <span className="block text-sm leading-6 text-[var(--atlas-muted)]">{source.locator}</span> : null}
                </li>)}</ul>
              </div>
              {item.links.length ? <div className="flex max-w-sm flex-wrap gap-2 sm:justify-end">{item.links.map((link) => <Link key={`${link.type}:${link.id}`} href={link.href} prefetch={false} className="atlas-pill atlas-pill-paper atlas-pill-link min-h-11 gap-2 px-4 text-sm font-bold no-underline hover:bg-[var(--atlas-ink)] hover:text-white hover:no-underline">{link.label}<ArrowRight className="size-4" aria-hidden="true" /></Link>)}</div> : null}
            </div>
          </section>)}

          {continuationLinks.length ? <section aria-labelledby="continue-heading" className="py-12">
            <p className="font-heading text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--atlas-primary)]">Carry the signal forward</p>
            <h2 id="continue-heading" className="mt-3 font-heading text-3xl font-extrabold tracking-[-0.04em]">Continue in True North Map</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--atlas-muted)]">Follow the edition into the organizations, technologies, Public Needs and Mission Areas already connected to its record.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">{continuationLinks.map((link) => <Link key={`${link.type}:${link.id}`} href={link.href} prefetch={false} className="flex min-h-20 items-center justify-between gap-4 rounded-2xl bg-[var(--atlas-surface-muted)] px-5 py-4 text-[var(--atlas-ink)] no-underline transition-colors hover:bg-[var(--atlas-blue-soft)] hover:text-[var(--atlas-primary)] hover:no-underline">
              <span><span className="block text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--atlas-muted)]">{continuationLabels[link.type]}</span><span className="mt-1 block font-heading text-lg font-extrabold">{link.label}</span></span><ArrowRight className="size-5 shrink-0" aria-hidden="true" />
            </Link>)}</div>
          </section> : null}
        </div>

        <aside aria-label="Article section navigation" className="hidden xl:block">
          <div className="atlas-tonal-surface atlas-tonal-blue sticky top-24 mt-12 p-5">
            <SignalArticleNavigation items={navigationItems} label="In this edition" compact />
          </div>
        </aside>
      </div>
    </article>

    <nav aria-labelledby="edition-navigation-heading" className="mx-auto mt-12 w-full py-10">
      <p className="font-heading text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--atlas-primary)]">Follow the record</p>
      <h2 id="edition-navigation-heading" className="mt-3 font-heading text-3xl font-extrabold tracking-[-0.04em]">Related and adjacent editions</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--atlas-muted)]">Signals track what changed and keep the original public record close. Follow adjacent editions or continue into the organizations, Mission Areas and Public Needs linked above.</p>
      {relatedEditions.length ? <div className="mt-7 grid gap-4 md:grid-cols-2">{relatedEditions.map((related) => <EditionLink key={related.id} edition={related} label="Related edition" />)}</div> : null}
      {previousEdition || nextEdition ? <div className="mt-7 grid gap-4 border-t border-[var(--atlas-border)] pt-7 sm:grid-cols-2">
        {previousEdition ? <Link href={`/signals/${previousEdition.slug}`} rel="prev" className="flex min-h-20 items-center gap-4 text-[var(--atlas-ink)] no-underline hover:text-[var(--atlas-primary)] hover:no-underline"><ArrowLeft className="size-5 shrink-0" aria-hidden="true" /><span><span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--atlas-muted)]">Previous edition</span><span className="mt-1 block font-heading text-lg font-extrabold">{previousEdition.title}</span></span></Link> : <span />}
        {nextEdition ? <Link href={`/signals/${nextEdition.slug}`} rel="next" className="flex min-h-20 items-center justify-end gap-4 text-right text-[var(--atlas-ink)] no-underline hover:text-[var(--atlas-primary)] hover:no-underline"><span><span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--atlas-muted)]">Next edition</span><span className="mt-1 block font-heading text-lg font-extrabold">{nextEdition.title}</span></span><ArrowRight className="size-5 shrink-0" aria-hidden="true" /></Link> : null}
      </div> : null}
    </nav>

    <NorthSignalInline placement="newsletter_inline_signals" trigger="signals_complete" className="mx-auto mt-12 w-full" />

    <aside aria-labelledby="editorial-note-heading" className="atlas-tonal-surface atlas-tonal-muted mx-auto mt-10 w-full p-5 text-xs leading-6 text-[var(--atlas-muted)] sm:p-6">
      <h2 id="editorial-note-heading" className="font-heading text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--atlas-ink)]">Editorial note</h2>
      {boundary ? <p className="mt-3">{boundary}</p> : null}
      <p className="mt-3">{edition.disclosure} Signals keep source-backed facts separate from True North Map assessments, identify uncertainty, and link to the public record. They are not procurement recommendations, eligibility findings, endorsements, or substitutes for due diligence.</p>
      <p className="mt-3">Read the <Link href="/methodology" className="font-semibold text-[var(--atlas-primary)]">methodology</Link> or <Link href="/contact" className="font-semibold text-[var(--atlas-primary)]">send a correction</Link>.</p>
    </aside>
  </PublicPageShell>;
}

function EditorialHero({ image }: { image: NonNullable<SignalEdition["heroImage"]> }) {
  return <figure className="min-w-0 bg-[var(--atlas-ink)] lg:flex lg:min-h-[400px] lg:flex-col">
    <div className="relative aspect-[16/9] min-h-0 overflow-hidden lg:flex-1 lg:aspect-auto">
      <Image src={image.url} alt={image.alt} fill priority sizes="(max-width: 1023px) 100vw, 45vw" className="object-cover" />
    </div>
    <figcaption className="flex flex-wrap items-start justify-between gap-2 bg-[var(--atlas-ink)] px-4 py-3 text-xs leading-5 text-white/75">
      <span>{image.attribution}</span>
      <a href={image.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-6 items-center gap-1 font-semibold text-white no-underline hover:text-[var(--atlas-signal)] hover:underline">Image source <ExternalLink className="size-3.5" aria-hidden="true" /></a>
    </figcaption>
  </figure>;
}

function SignalBlock({ title, text, icon: Icon, tone }: { title: string; text: string; icon: typeof FileCheck2; tone: "fact" | "assessment" | "gap" | "next" }) {
  const tones = {
    fact: "bg-[var(--atlas-evidence-soft)] text-[var(--atlas-evidence)]",
    assessment: "bg-[var(--atlas-signal-soft)] text-[var(--atlas-ink)]",
    gap: "bg-[var(--atlas-surface-muted)] text-[var(--atlas-muted)]",
    next: "bg-[var(--atlas-ink)] text-white"
  } as const;
  return <div className={`min-w-0 rounded-2xl p-5 md:min-h-48 ${tones[tone]}`}>
    <Icon className="size-5" aria-hidden="true" />
    <h3 className={`mt-4 font-heading text-sm font-extrabold uppercase tracking-[0.1em] ${tone === "next" ? "text-white" : "text-[var(--atlas-ink)]"}`}>{title}</h3>
    <p className={`mt-3 text-[15px] leading-7 ${tone === "next" ? "text-white/78" : "text-[var(--atlas-ink-soft)]"}`}>{text}</p>
  </div>;
}

function SignalNarrative({ text, className }: { text: string; className: string }) {
  return <div className={`${className} space-y-4`}>{summaryParagraphs(text).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>;
}

function EditionLink({ edition, label }: { edition: SignalEdition; label: string }) {
  return <Link href={`/signals/${edition.slug}`} className="flex min-h-32 flex-col justify-between rounded-2xl bg-white p-5 text-[var(--atlas-ink)] no-underline transition-colors hover:bg-[var(--atlas-blue-soft)] hover:text-[var(--atlas-primary)] hover:no-underline">
    <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--atlas-muted)]">{label} · {dateFormatter.format(new Date(`${edition.editionDate}T12:00:00Z`))}</span>
    <span className="mt-4 flex items-end justify-between gap-4 font-heading text-xl font-extrabold leading-tight"><span>{edition.title}</span><ArrowRight className="size-5 shrink-0" aria-hidden="true" /></span>
  </Link>;
}

function summaryParagraphs(text: string) {
  return text.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

function editionPresentation(text: string) {
  const paragraphs = summaryParagraphs(text);
  const opening = paragraphs[0] ?? text;
  const sentences = opening.split(/(?<=[.!?])\s+/).filter(Boolean);
  const deckSentences = sentences.slice(0, 2);
  const deck = deckSentences.join(" ") || opening;
  const openingRemainder = sentences.slice(deckSentences.length).join(" ");
  const meaning = paragraphs.length > 1 ? paragraphs.slice(1, -1).join("\n\n") || paragraphs[1] : "";
  const bottomLine = [openingRemainder, meaning].filter(Boolean).join("\n\n") || opening;
  const boundary = paragraphs.length > 2 ? paragraphs.at(-1) ?? "" : "";
  return { deck, bottomLine, boundary };
}

function metadataDescription(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= 158) return normalized;
  const clipped = normalized.slice(0, 155);
  return `${clipped.slice(0, Math.max(clipped.lastIndexOf(" "), 120)).trim()}…`;
}

function readingTime(edition: SignalEdition) {
  const words = [edition.executiveSummary, ...edition.items.flatMap((item) => [item.title, item.bottomLine, item.executiveSummary, item.sourceFact, item.automatedRead, item.unknowns, item.nextStep])].join(" ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function uniqueContinuationLinks(edition: SignalEdition) {
  const links = new Map<string, SignalRecordLink>();
  for (const link of edition.items.flatMap((item) => item.links)) links.set(`${link.type}:${link.id}`, link);
  return [...links.values()].slice(0, 8);
}

function editionNavigation(current: SignalEdition, archive: SignalEdition[]) {
  const ordered = [...archive].sort((a, b) => b.editionDate.localeCompare(a.editionDate));
  const currentIndex = ordered.findIndex((edition) => edition.id === current.id);
  const nextEdition = currentIndex > 0 ? ordered[currentIndex - 1] : null;
  const previousEdition = currentIndex >= 0 && currentIndex < ordered.length - 1 ? ordered[currentIndex + 1] : null;
  const currentTags = new Set(collectSignalTags(current.items));
  const adjacentIds = new Set([current.id, previousEdition?.id, nextEdition?.id].filter(Boolean));
  const relatedEditions = ordered
    .filter((edition) => !adjacentIds.has(edition.id))
    .map((edition) => ({ edition, score: collectSignalTags(edition.items).filter((tag) => currentTags.has(tag)).length }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.edition.editionDate.localeCompare(a.edition.editionDate))
    .slice(0, 2)
    .map(({ edition }) => edition);
  return { previousEdition, nextEdition, relatedEditions };
}
