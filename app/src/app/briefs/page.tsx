import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenText, CheckCircle2, Compass, SearchCheck, ShieldCheck } from "lucide-react";
import { BriefHero } from "@/components/atlas/brief-hero";
import { PublicPageShell } from "@/components/atlas/public-page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { defenceBriefsHomePresentation, getBriefPresentation, getBriefReadingMinutes } from "@/lib/atlas/brief-presentation";
import { getPublishedDefenceBriefs } from "@/lib/atlas/briefs";
import { absoluteUrl, siteName } from "@/lib/site";
import { defenceBriefImageUrl } from "@/lib/atlas/brief-images";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Canadian Defence Briefs",
  description: "Source-linked explainers connecting Canadian defence policy, released public needs, industrial capacity, and capability.",
  alternates: { canonical: "/briefs" },
  openGraph: {
    title: "Canadian Defence Briefs",
    description: "Understand the needs, technology, and industrial forces shaping Canadian defence through concise, reviewed, source-backed analysis.",
    url: "/briefs",
    type: "website",
    siteName,
    locale: "en_CA",
    images: [{ url: defenceBriefImageUrl("defence-briefs-home.jpg"), width: 1672, height: 941, alt: defenceBriefsHomePresentation.imageAlt }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Canadian Defence Briefs",
    description: "Understand the needs, technology, and industrial forces shaping Canadian defence through concise, reviewed, source-backed analysis.",
    images: [{ url: defenceBriefImageUrl("defence-briefs-home.jpg"), alt: defenceBriefsHomePresentation.imageAlt }]
  }
};

const dateFormatter = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", year: "numeric" });

export default async function DefenceBriefsPage() {
  const briefs = await getPublishedDefenceBriefs();
  const [featured, ...latest] = briefs;
  const topics = [...new Set(briefs.map((brief) => getBriefPresentation(brief).topic))];
  const latestReviewedAt = briefs.reduce<string | null>((latestDate, brief) => {
    if (!latestDate) return brief.reviewedAt;
    return Date.parse(brief.reviewedAt) > Date.parse(latestDate) ? brief.reviewedAt : latestDate;
  }, null);

  return (
    <PublicPageShell
      eyebrow="Defence Briefs"
      title="Understand what may shape what Canada builds next."
      description="Source-linked explainers connecting policy, released public needs and Canadian capability. Go deeper on how a system, technology or decision works, then continue into the records behind it."
    >
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Canadian Defence Briefs",
        description: metadata.description,
        url: absoluteUrl("/briefs"),
        inLanguage: "en-CA",
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: defenceBriefImageUrl("defence-briefs-home.jpg"),
          width: 1672,
          height: 941,
          caption: defenceBriefsHomePresentation.imageAlt
        },
        isPartOf: { "@type": "WebSite", name: siteName, url: absoluteUrl("/") },
        hasPart: briefs.map((brief) => {
          const presentation = getBriefPresentation(brief);
          return {
            "@type": "Article",
            headline: brief.title,
            alternativeHeadline: brief.thesis,
            url: absoluteUrl(`/briefs/${brief.slug}`),
            datePublished: brief.publishedAt,
            dateModified: brief.updatedAt,
            image: presentation.imageSrc ? absoluteUrl(presentation.imageSrc) : undefined,
            author: { "@type": "Person", name: brief.authorName, url: absoluteUrl("/about") }
          };
        }),
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: briefs.length,
          itemListElement: briefs.map((brief, index) => ({ "@type": "ListItem", position: index + 1, url: absoluteUrl(`/briefs/${brief.slug}`), name: brief.title }))
        }
      }} />

      <div className="mt-6 flex flex-col gap-3 rounded-[var(--atlas-radius-card)] bg-[var(--atlas-blue-soft)] px-5 py-4 text-sm text-[var(--atlas-ink-soft)] sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold">{briefs.length} reviewed {briefs.length === 1 ? "article" : "articles"}{latestReviewedAt ? ` · Latest review ${dateFormatter.format(new Date(latestReviewedAt))}` : ""}</p>
        <p>Briefs explain the system. <Link href="/signals" className="font-bold text-[var(--atlas-primary)] underline decoration-2 underline-offset-4">Signals track what changed.</Link></p>
      </div>

      {featured ? (
        <section className="mt-8 overflow-hidden rounded-[var(--atlas-radius-card)] bg-white shadow-[var(--atlas-shadow-soft)]">
          <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.06fr)_minmax(360px,0.94fr)]">
            <BriefHero presentation={getBriefPresentation(featured)} title={featured.title} priority compact className="order-2 h-[280px] min-w-0 rounded-none sm:h-[320px] lg:order-1 lg:aspect-auto lg:h-full lg:min-h-[430px]" />
            <div className="relative z-10 order-1 flex min-w-0 flex-col justify-center bg-white p-6 sm:p-9 lg:order-2 lg:p-11">
              <BriefMeta brief={featured} featured />
              <h2 className="mt-5 text-3xl font-extrabold leading-[1.08] tracking-[-0.045em] text-[var(--atlas-ink)] sm:text-4xl">{featured.title}</h2>
              <p className="mt-5 text-sm leading-7 text-[var(--atlas-ink-soft)] sm:text-base sm:leading-8">{featured.standfirst}</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href={`/briefs/${featured.slug}`} className="atlas-signal-button h-11 px-5 text-sm no-underline hover:no-underline">Read the latest Brief <ArrowRight className="ml-2 size-4" /></Link>
                <span className="text-xs font-semibold text-[var(--atlas-muted)]">{featured.sources.length} reviewed public {featured.sources.length === 1 ? "source" : "sources"}</span>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="mt-8 rounded-[2rem] border border-dashed border-[var(--atlas-border-strong)] bg-white p-10 text-center">
          <BookOpenText className="mx-auto size-7 text-[var(--atlas-primary)]" />
          <h2 className="mt-4 text-xl font-extrabold text-[var(--atlas-ink)]">The next reviewed brief is being prepared.</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--atlas-muted)]">Public pages appear only after their evidence and interpretation have been reviewed.</p>
        </section>
      )}

      {latest.length ? (
        <section className="mt-16 sm:mt-20">
          <div className="flex flex-col gap-4 border-b border-[var(--atlas-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="atlas-eyebrow">Explore the collection</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] text-[var(--atlas-ink)] sm:text-4xl">All Defence Briefs</h2>
            </div>
            <p className="max-w-lg text-sm leading-6 text-[var(--atlas-muted)]">Evergreen explainers sit alongside clearly labelled analysis of current developments.</p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {latest.map((brief) => {
              const presentation = getBriefPresentation(brief);
              return (
                <article key={brief.id} className="group overflow-hidden rounded-[var(--atlas-radius-card)] bg-white shadow-[var(--atlas-shadow-soft)] transition-shadow hover:shadow-[0_22px_52px_rgba(36,40,39,0.1)]">
                  <BriefHero presentation={presentation} title={brief.title} compact />
                  <div className="flex min-h-[300px] flex-col p-6">
                    <BriefMeta brief={brief} />
                    <h3 className="mt-4 text-xl font-extrabold leading-tight tracking-[-0.035em] text-[var(--atlas-ink)]">{brief.title}</h3>
                    <p className="mt-3 line-clamp-4 text-sm leading-6 text-[var(--atlas-muted)]">{brief.standfirst}</p>
                    <Link href={`/briefs/${brief.slug}`} className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-bold text-[var(--atlas-primary)] no-underline group-hover:underline">Read the article <ArrowRight className="size-4" /></Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="mt-16 grid gap-8 rounded-[2rem] bg-[var(--atlas-ink)] px-6 py-9 text-white sm:mt-20 sm:px-9 sm:py-11 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14 lg:px-12">
        <div>
          <Compass className="size-6 text-[var(--atlas-signal)]" />
          <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--atlas-signal)]">What you can explore</p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.04em]">From the public signal to the people who can act on it.</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {topics.map((topic) => <div key={topic} className="rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-4 text-sm font-bold text-white/85">{topic}</div>)}
          <div className="rounded-2xl border border-[var(--atlas-signal)]/45 bg-[var(--atlas-signal)]/10 px-5 py-4 text-sm font-bold text-[var(--atlas-signal)]">More reviewed topics in development</div>
        </div>
      </section>

      <section className="mt-8 rounded-[var(--atlas-radius-card)] bg-[var(--atlas-blue-soft)] p-6 sm:p-8">
        <div className="grid gap-6 md:grid-cols-3">
          <Value icon={SearchCheck} title="The conclusion comes first" text="Each article makes its central argument early, then develops the evidence, context, and implications." />
          <Value icon={ShieldCheck} title="Review stays visible" text="Sources, review dates, uncertainty, and interpretation remain in view as you read." />
          <Value icon={CheckCircle2} title="A path into the ecosystem" text="Move from the brief into related public needs, companies, and Canadian technology." />
        </div>
      </section>
    </PublicPageShell>
  );
}

function BriefMeta({ brief, featured = false }: { brief: Awaited<ReturnType<typeof getPublishedDefenceBriefs>>[number]; featured?: boolean }) {
  const presentation = getBriefPresentation(brief);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-extrabold uppercase tracking-[0.12em]">
      {featured ? <span className="rounded-full bg-[var(--atlas-signal)] px-3 py-1.5 text-[var(--atlas-ink)]">Featured</span> : null}
      <span className="text-[var(--atlas-primary)]">{presentation.format}</span>
      <span aria-hidden="true" className="size-1 rounded-full bg-[var(--atlas-border-strong)]" />
      <span className="text-[var(--atlas-muted)]">{presentation.topic}</span>
      <span aria-hidden="true" className="size-1 rounded-full bg-[var(--atlas-border-strong)]" />
      <span className="text-[var(--atlas-muted)]">{getBriefReadingMinutes(brief)} min read</span>
      <span aria-hidden="true" className="size-1 rounded-full bg-[var(--atlas-border-strong)]" />
      <time dateTime={brief.updatedAt} className="text-[var(--atlas-muted)]">{dateFormatter.format(new Date(brief.updatedAt))}</time>
    </div>
  );
}

function Value({ icon: Icon, title, text }: { icon: typeof SearchCheck; title: string; text: string }) {
  return <div className="flex gap-4"><div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--atlas-signal-soft)] text-[var(--atlas-primary)]"><Icon className="size-5" /></div><div><h2 className="text-sm font-extrabold text-[var(--atlas-ink)]">{title}</h2><p className="mt-1 text-xs leading-5 text-[var(--atlas-muted)]">{text}</p></div></div>;
}
