import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, ExternalLink, Lightbulb, ShieldCheck, Target } from "lucide-react";
import { BriefHero } from "@/components/atlas/brief-hero";
import { PublicPageShell } from "@/components/atlas/public-page-shell";
import { PublicShare } from "@/components/atlas/public-share";
import { NorthSignalInline } from "@/components/atlas/north-signal-signup";
import { JsonLd } from "@/components/seo/json-ld";
import { briefSectionId, getBriefKeyTakeaways, getBriefPresentation, getBriefReadingMinutes } from "@/lib/atlas/brief-presentation";
import { getPublishedDefenceBriefBySlug, getPublishedDefenceBriefs, relatedDefenceBriefs } from "@/lib/atlas/briefs";
import { getAtlasMissionLinksForRecords, getAtlasRecordSummaries } from "@/lib/atlas/repository";
import { absoluteUrl, siteName } from "@/lib/site";

export const revalidate = 300;

const dateFormatter = new Intl.DateTimeFormat("en-CA", { dateStyle: "long" });

export async function generateStaticParams() {
  const briefs = await getPublishedDefenceBriefs();
  return briefs.map((brief) => ({ slug: brief.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const brief = await getPublishedDefenceBriefBySlug(slug);
  if (!brief) return { title: "Defence brief not found" };
  const presentation = getBriefPresentation(brief);
  return {
    title: brief.seoTitle,
    description: brief.metaDescription,
    keywords: [presentation.topic, "Canadian defence", "defence industry Canada", "dual-use technology Canada"],
    alternates: { canonical: `/briefs/${brief.slug}` },
    openGraph: {
      type: "article",
      title: brief.seoTitle,
      description: brief.metaDescription,
      url: `/briefs/${brief.slug}`,
      publishedTime: brief.publishedAt,
      modifiedTime: brief.updatedAt,
      authors: [brief.authorName],
      section: presentation.topic,
      images: presentation.imageSrc ? [{ url: presentation.imageSrc, alt: presentation.imageAlt }] : undefined
    },
    twitter: { card: "summary_large_image", title: brief.seoTitle, description: brief.metaDescription, images: presentation.imageSrc ? [{ url: presentation.imageSrc, alt: presentation.imageAlt }] : undefined }
  };
}

export default async function DefenceBriefPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brief = await getPublishedDefenceBriefBySlug(slug);
  if (!brief) notFound();

  const presentation = getBriefPresentation(brief);
  const readingMinutes = getBriefReadingMinutes(brief);
  const takeaways = getBriefKeyTakeaways(brief);
  const [summaries, allBriefs, missionConnections] = await Promise.all([
    getAtlasRecordSummaries(brief.links),
    getPublishedDefenceBriefs(),
    getAtlasMissionLinksForRecords(brief.links)
  ]);
  const summariesByRecord = new Map(summaries.map((item) => [`${item.type}:${item.id}`, item]));
  const relatedRecords = brief.links.flatMap((link) => {
    const record = summariesByRecord.get(`${link.type}:${link.id}`);
    if (!record) return [];
    const route = link.type === "demand_requirement" ? "demand" : link.type === "organization" ? "organizations" : "capabilities";
    return [{ ...link, href: `/${route}/${record.slug}`, name: record.name }];
  });
  const relatedBriefs = relatedDefenceBriefs(brief, allBriefs);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": presentation.format === "Guide" ? "TechArticle" : "Article",
    headline: brief.title,
    alternativeHeadline: brief.thesis,
    description: brief.metaDescription,
    mainEntityOfPage: absoluteUrl(`/briefs/${brief.slug}`),
    datePublished: brief.publishedAt,
    dateModified: brief.updatedAt,
    inLanguage: "en-CA",
    articleSection: presentation.topic,
    audience: { "@type": "Audience", audienceType: brief.audience },
    timeRequired: `PT${readingMinutes}M`,
    image: presentation.imageSrc ? absoluteUrl(presentation.imageSrc) : undefined,
    author: { "@type": "Person", name: brief.authorName, url: absoluteUrl("/about") },
    publisher: { "@type": "Organization", name: siteName, url: absoluteUrl("/") },
    citation: brief.sources.map((source) => source.url),
    about: [presentation.topic, "Canadian defence", "dual-use technology", "defence industrial base"]
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "True North Map", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Canadian Defence Briefs", item: absoluteUrl("/briefs") },
      { "@type": "ListItem", position: 3, name: brief.title, item: absoluteUrl(`/briefs/${brief.slug}`) }
    ]
  };

  return (
    <PublicPageShell
      eyebrow={`${presentation.format} · ${presentation.topic}`}
      title={brief.title}
      description={brief.standfirst}
      breadcrumbs={[{ label: "Map", href: "/map" }, { label: "Defence Briefs", href: "/briefs" }, { label: brief.title }]}
      pageHeader={(
        <header className="mt-6 overflow-hidden rounded-[2rem] border border-[var(--atlas-border)] bg-white shadow-[var(--atlas-shadow-soft)]">
          <div className="grid min-w-0 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
            <div className="flex min-w-0 flex-col justify-center p-6 sm:p-9 lg:min-h-[420px] lg:p-11">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-extrabold uppercase tracking-[0.12em]">
                <span className="rounded-full bg-[var(--atlas-signal)] px-3 py-1.5 text-[var(--atlas-ink)]">{presentation.format}</span>
                <span className="text-[var(--atlas-primary)]">{presentation.topic}</span>
                <span aria-hidden="true" className="size-1 rounded-full bg-[var(--atlas-border-strong)]" />
                <span className="text-[var(--atlas-muted)]">{readingMinutes} min read</span>
              </div>
              <h1 className="mt-5 text-3xl font-extrabold leading-[1.03] tracking-[-0.052em] text-[var(--atlas-ink)] sm:text-[44px] lg:text-[48px]">{brief.title}</h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--atlas-ink-soft)] sm:text-base sm:leading-8">{brief.standfirst}</p>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-semibold text-[var(--atlas-muted)]">
                <span>By <Link href="/about" className="font-bold text-[var(--atlas-primary)] underline">{brief.authorName}</Link></span>
                <span aria-hidden="true">·</span>
                <time dateTime={brief.updatedAt}>Reviewed {dateFormatter.format(new Date(brief.reviewedAt))}</time>
                <PublicShare title={brief.title} description={brief.metaDescription} path={`/briefs/${brief.slug}`} className="ml-auto" />
              </div>
            </div>
            <BriefHero presentation={presentation} title={brief.title} priority compact className="h-[260px] min-w-0 rounded-none sm:h-[300px] lg:aspect-auto lg:h-full lg:min-h-[420px]" />
          </div>
        </header>
      )}
    >
      <JsonLd data={[articleSchema, breadcrumbSchema]} />

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-14">
        <article className="min-w-0">
          <section aria-labelledby="bottom-line" className="rounded-[1.6rem] border border-[var(--atlas-border)] bg-white p-6 shadow-[var(--atlas-shadow-soft)] sm:p-8">
            <p className="atlas-eyebrow">Bottom line</p>
            <h2 id="bottom-line" className="mt-3 text-2xl font-extrabold leading-tight tracking-[-0.035em] text-[var(--atlas-ink)] sm:text-3xl">{brief.thesis}</h2>
            <p className="mt-5 text-base leading-8 text-[var(--atlas-ink-soft)] sm:text-lg sm:leading-9">{brief.bottomLine}</p>
          </section>

          {takeaways.length ? (
            <section aria-labelledby="key-takeaways" className="mt-10 border-y border-[var(--atlas-border)] py-8">
              <p className="atlas-eyebrow">Executive takeaways</p>
              <h2 id="key-takeaways" className="mt-3 text-2xl font-extrabold tracking-[-0.035em] text-[var(--atlas-ink)]">What matters most</h2>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {takeaways.map((takeaway) => <li key={takeaway} className="flex gap-3 text-sm leading-6 text-[var(--atlas-ink-soft)]"><span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--atlas-signal)] text-[var(--atlas-ink)]"><Check className="size-3.5" /></span>{takeaway}</li>)}
              </ul>
            </section>
          ) : null}

          <div className="mt-4 divide-y divide-[var(--atlas-border)]">
            {brief.sections.map((section, index) => {
              const id = briefSectionId(section.heading, index);
              return (
                <section key={section.heading} id={id} className="scroll-mt-28 py-9 sm:py-11">
                  <h2 className="text-2xl font-extrabold leading-tight tracking-[-0.035em] text-[var(--atlas-ink)] sm:text-3xl">{section.heading}</h2>
                  <div className="mt-5 space-y-5 text-base leading-8 text-[var(--atlas-ink-soft)]">
                    {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  </div>
                  {section.points.length ? <ul className="mt-6 space-y-3 rounded-2xl bg-[var(--atlas-surface-muted)] p-5 text-sm leading-7 text-[var(--atlas-ink-soft)] sm:p-6">{section.points.map((point) => <li key={point} className="flex gap-3"><span className="mt-3 size-1.5 shrink-0 rounded-full bg-[var(--atlas-signal)]" />{point}</li>)}</ul> : null}
                </section>
              );
            })}
          </div>

          {brief.implications ? (
            <section id="implications" className="scroll-mt-28 rounded-[1.6rem] border border-[var(--atlas-primary-border)] bg-[var(--atlas-primary-soft)] p-6 sm:p-8">
              <div className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--atlas-primary)]"><Lightbulb className="size-5" /></div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--atlas-primary)]">Analysis</p>
                  <h2 className="mt-2 text-xl font-extrabold tracking-[-0.025em] text-[var(--atlas-ink)]">What this means</h2>
                  <p className="mt-4 text-sm leading-7 text-[var(--atlas-ink-soft)]">{brief.implications}</p>
                  <p className="mt-4 text-[11px] leading-5 text-[var(--atlas-muted)]">This is True North Map’s interpretation of the linked public record, not a statement from the source organization or a confirmed procurement opportunity.</p>
                </div>
              </div>
            </section>
          ) : null}

          {brief.recommendedAction ? (
            <section id="next-step" className="mt-8 scroll-mt-28 rounded-[1.6rem] bg-[var(--atlas-ink)] p-6 text-white sm:p-8">
              <div className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--atlas-signal)] text-[var(--atlas-ink)]"><Target className="size-5" /></div>
                <div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--atlas-signal)]">Recommended next step</p><h2 className="mt-2 text-xl font-extrabold tracking-[-0.025em]">Turn the insight into a specific decision</h2><p className="mt-4 text-sm leading-7 text-white/75">{brief.recommendedAction}</p></div>
              </div>
            </section>
          ) : null}

          {brief.limitations ? (
            <section id="limitations" className="mt-10 scroll-mt-28 border-t border-[var(--atlas-border)] pt-8">
              <p className="atlas-eyebrow">Limits of this analysis</p>
              <p className="mt-3 text-sm leading-7 text-[var(--atlas-muted)]">{brief.limitations}</p>
            </section>
          ) : null}

          <section id="sources" className="mt-10 scroll-mt-28 border-t border-[var(--atlas-border)] pt-9">
            <p className="atlas-eyebrow">Follow the evidence</p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.035em] text-[var(--atlas-ink)]">Public sources</h2>
            <ol className="mt-6 space-y-4">
              {brief.sources.map((source, index) => <li key={source.id} className="grid gap-3 rounded-2xl border border-[var(--atlas-border)] bg-white p-5 sm:grid-cols-[34px_1fr]"><span className="flex size-8 items-center justify-center rounded-xl bg-[var(--atlas-surface-muted)] text-xs font-extrabold text-[var(--atlas-primary)]">{index + 1}</span><div><a href={source.url} target="_blank" rel="noreferrer" className="text-sm font-bold leading-6 text-[var(--atlas-primary)] no-underline hover:underline">{source.title} <ExternalLink className="ml-1 inline size-3.5" /></a><p className="mt-1 text-xs font-semibold text-[var(--atlas-muted)]">{source.publisher}{source.publishedAt ? ` · ${dateFormatter.format(new Date(source.publishedAt))}` : ""}</p><p className="mt-2 text-xs leading-6 text-[var(--atlas-muted)]">{source.note}</p></div></li>)}
            </ol>
          </section>

          <footer className="mt-10 rounded-2xl border border-[var(--atlas-border)] bg-white p-6 sm:p-7">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--atlas-primary)]">About this article</p>
            <p className="mt-3 text-sm leading-7 text-[var(--atlas-ink-soft)]">Written and reviewed by <Link href="/about" className="font-bold text-[var(--atlas-primary)] underline">{brief.authorName}</Link>. Claims are bounded by the public sources above, interpretation is labelled separately, and material gaps remain visible. <Link href="/methodology" className="font-bold text-[var(--atlas-primary)] underline">Read the methodology</Link> or <Link href="/contact" className="font-bold text-[var(--atlas-primary)] underline">request a correction</Link>.</p>
          </footer>

          <NorthSignalInline placement="newsletter_inline_brief" trigger="brief_complete" className="mt-10" />

          {relatedBriefs.length ? (
            <section className="mt-12 border-t border-[var(--atlas-border)] pt-9" aria-labelledby="related-analysis-heading">
              <p className="atlas-eyebrow">Continue the analysis</p>
              <h2 id="related-analysis-heading" className="mt-3 text-2xl font-extrabold tracking-[-0.035em] text-[var(--atlas-ink)]">Related Defence Briefs</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {relatedBriefs.map((relatedBrief) => (
                  <Link key={relatedBrief.id} href={`/briefs/${relatedBrief.slug}`} className="group rounded-2xl border border-[var(--atlas-border)] bg-white p-5 no-underline transition-colors hover:border-[var(--atlas-ink)] hover:no-underline">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--atlas-muted)]">{getBriefPresentation(relatedBrief).topic}</span>
                    <span className="mt-2 block text-base font-extrabold leading-6 text-[var(--atlas-ink)]">{relatedBrief.title}</span>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[var(--atlas-primary)] group-hover:underline">Read the article <ArrowRight className="size-3.5" aria-hidden="true" /></span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </article>

        <aside className="space-y-5 lg:sticky lg:top-28">
          <section className="rounded-2xl border border-[var(--atlas-border)] bg-white p-5">
            <p className="atlas-eyebrow">In this article</p>
            <nav aria-label="On this page" className="mt-4">
              <ol className="space-y-3 text-xs font-semibold">
                <li><a href="#bottom-line" className="text-[var(--atlas-primary)] no-underline hover:underline">Bottom line</a></li>
                {takeaways.length ? <li><a href="#key-takeaways" className="text-[var(--atlas-primary)] no-underline hover:underline">What matters most</a></li> : null}
                {brief.sections.map((section, index) => <li key={section.heading}><a href={`#${briefSectionId(section.heading, index)}`} className="line-clamp-2 text-[var(--atlas-muted)] no-underline hover:text-[var(--atlas-primary)] hover:underline">{section.heading}</a></li>)}
                {brief.implications ? <li><a href="#implications" className="text-[var(--atlas-muted)] no-underline hover:text-[var(--atlas-primary)] hover:underline">What this means</a></li> : null}
                {brief.recommendedAction ? <li><a href="#next-step" className="text-[var(--atlas-muted)] no-underline hover:text-[var(--atlas-primary)] hover:underline">Recommended next step</a></li> : null}
                <li><a href="#sources" className="text-[var(--atlas-primary)] no-underline hover:underline">Public sources</a></li>
              </ol>
            </nav>
          </section>

          <section className="rounded-2xl border border-[var(--atlas-border)] bg-white p-5">
            <div className="flex gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-[var(--atlas-primary)]" /><div><h2 className="text-sm font-extrabold text-[var(--atlas-ink)]">Reviewed before publication</h2><p className="mt-2 text-xs leading-5 text-[var(--atlas-muted)]">Every article is checked against durable public evidence. Newsletter and social material remain research leads until a source can support the public record.</p></div></div>
            <dl className="mt-5 grid gap-3 border-t border-[var(--atlas-border)] pt-4 text-xs"><div><dt className="text-[var(--atlas-muted)]">Primary reader</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">{brief.audience}</dd></div><div><dt className="text-[var(--atlas-muted)]">Last reviewed</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">{dateFormatter.format(new Date(brief.reviewedAt))}</dd></div><div><dt className="text-[var(--atlas-muted)]">Evidence</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">{brief.sources.length} approved public {brief.sources.length === 1 ? "source" : "sources"}</dd></div></dl>
          </section>

          {missionConnections.length ? (
            <section className="rounded-2xl border border-[var(--atlas-border)] bg-white p-5">
              <p className="atlas-eyebrow">Mission lens</p>
              <h2 className="mt-2 text-base font-extrabold text-[var(--atlas-ink)]">Explore related use cases</h2>
              <p className="mt-2 text-xs leading-5 text-[var(--atlas-muted)]">These are reviewed True North Map groupings connected through the records in this article.</p>
              <div className="mt-4 space-y-2">
                {missionConnections.slice(0, 4).map((connection) => (
                  <Link key={connection.missionArea.id} href={`/missions/${connection.missionArea.slug}`} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--atlas-border)] p-3 text-xs font-bold text-[var(--atlas-primary)] no-underline hover:border-[var(--atlas-ink)] hover:no-underline">
                    <span>{connection.missionArea.name}</span>
                    <span className="shrink-0 text-[10px] text-[var(--atlas-muted)]">{connection.capabilityCount} {connection.capabilityCount === 1 ? "technology" : "technologies"}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {relatedRecords.length ? (
            <section className="rounded-2xl border border-[var(--atlas-border)] bg-white p-5">
              <p className="atlas-eyebrow">Keep exploring</p>
              <h2 className="mt-2 text-base font-extrabold text-[var(--atlas-ink)]">Move from context to action</h2>
              <div className="mt-4 space-y-3">{relatedRecords.map((item) => <Link key={`${item.type}-${item.id}`} href={item.href} className="group block rounded-xl border border-[var(--atlas-border)] p-3 no-underline hover:border-[var(--atlas-ink)] hover:no-underline"><span className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--atlas-muted)]">{item.label}</span><span className="mt-1 flex items-center justify-between gap-2 text-xs font-bold text-[var(--atlas-primary)]">{item.name}<ArrowRight className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" /></span></Link>)}</div>
            </section>
          ) : null}
        </aside>
      </div>
    </PublicPageShell>
  );
}
