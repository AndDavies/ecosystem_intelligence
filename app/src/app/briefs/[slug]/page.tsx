import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink, Lightbulb, ShieldCheck } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { getPublishedDefenceBriefBySlug, getPublishedDefenceBriefs } from "@/lib/atlas/briefs";
import { getAtlasRecordSummaries } from "@/lib/atlas/repository";
import { absoluteUrl, siteName } from "@/lib/site";

export const revalidate = 300;

export async function generateStaticParams() {
  const briefs = await getPublishedDefenceBriefs();
  return briefs.map((brief) => ({ slug: brief.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const brief = await getPublishedDefenceBriefBySlug(slug);
  if (!brief) return { title: "Defence brief not found" };
  return { title: brief.seoTitle, description: brief.metaDescription, alternates: { canonical: `/briefs/${brief.slug}` }, openGraph: { type: "article", title: brief.seoTitle, description: brief.metaDescription, url: `/briefs/${brief.slug}`, publishedTime: brief.publishedAt, modifiedTime: brief.updatedAt, authors: [brief.authorName] } };
}

export default async function DefenceBriefPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brief = await getPublishedDefenceBriefBySlug(slug);
  if (!brief) notFound();
  const summaries = await getAtlasRecordSummaries(brief.links);
  const summariesByRecord = new Map(summaries.map((item) => [`${item.type}:${item.id}`, item]));
  const related = brief.links.flatMap((link) => {
    const record = summariesByRecord.get(`${link.type}:${link.id}`);
    if (!record) return [];
    const route = link.type === "demand_requirement" ? "demand" : link.type === "organization" ? "organizations" : "capabilities";
    return [{ ...link, href: `/${route}/${record.slug}`, name: record.name }];
  });
  const articleSchema = { "@context": "https://schema.org", "@type": "Article", headline: brief.title, description: brief.metaDescription, mainEntityOfPage: absoluteUrl(`/briefs/${brief.slug}`), datePublished: brief.publishedAt, dateModified: brief.updatedAt, inLanguage: "en-CA", author: { "@type": "Person", name: brief.authorName, url: absoluteUrl("/about") }, publisher: { "@type": "Organization", name: siteName, url: absoluteUrl("/") }, citation: brief.sources.map((source) => source.url), about: ["Canadian defence", "dual-use technology", "defence industrial base"] };
  const breadcrumbSchema = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "True North Map", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Canadian Defence Briefs", item: absoluteUrl("/briefs") }, { "@type": "ListItem", position: 3, name: brief.title, item: absoluteUrl(`/briefs/${brief.slug}`) }] };

  return (
    <PublicPageShell eyebrow="Canadian Defence Brief" title={brief.title} description={brief.dek} breadcrumbs={[{ label: "Ecosystem Map", href: "/" }, { label: "Defence Briefs", href: "/briefs" }, { label: brief.title }]}>
      <JsonLd data={[articleSchema, breadcrumbSchema]} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <article className="space-y-5">
          <section className="rounded-[22px] bg-[var(--atlas-ink)] p-6 text-white sm:p-8">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--atlas-signal)]">The short answer</p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.035em]">{brief.primaryQuestion}</h2>
            <p className="mt-4 text-base leading-7 text-white/80">{brief.summaryAnswer}</p>
          </section>
          {brief.sections.map((section, index) => (
            <PublicCard key={section.question} eyebrow={`Key question ${index + 1}`} title={section.question}>
              <p className="text-sm leading-7 text-[var(--atlas-ink-soft)]">{section.answer}</p>
              {section.points.length ? <ul className="mt-4 space-y-2 text-sm leading-6 text-[var(--atlas-muted)]">{section.points.map((point) => <li key={point} className="flex gap-3"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[var(--atlas-signal)]" />{point}</li>)}</ul> : null}
            </PublicCard>
          ))}
          {brief.derivedRead ? <section className="rounded-[22px] border border-[var(--atlas-primary-border)] bg-[var(--atlas-primary-soft)] p-6"><div className="flex gap-3"><Lightbulb className="mt-0.5 size-5 shrink-0 text-[var(--atlas-primary)]" /><div><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--atlas-primary)]">What this may mean</p><p className="mt-2 text-sm leading-7 text-[var(--atlas-ink-soft)]">{brief.derivedRead}</p><p className="mt-3 text-[11px] leading-5 text-[var(--atlas-muted)]">This is a Derived Read from the linked public record, not a statement from the source organization.</p></div></div></section> : null}
        </article>
        <aside className="space-y-5">
          <PublicCard title="Why you can trust this page" eyebrow="Reviewed, not auto-published">
            <div className="flex gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-[var(--atlas-primary)]" /><p className="text-xs leading-5 text-[var(--atlas-muted)]">Written and reviewed by {brief.authorName}. Facts are bounded by the public sources below; interpretation is labelled separately.</p></div>
            <dl className="mt-5 grid gap-3 text-xs"><div><dt className="text-[var(--atlas-muted)]">Last reviewed</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">{new Intl.DateTimeFormat("en-CA", { dateStyle: "long" }).format(new Date(brief.reviewedAt))}</dd></div><div><dt className="text-[var(--atlas-muted)]">Language</dt><dd className="mt-1 font-semibold text-[var(--atlas-ink-soft)]">English (Canada)</dd></div></dl>
          </PublicCard>
          <PublicCard title="Public sources" eyebrow="Follow the evidence">
            <ol className="space-y-4">{brief.sources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer" className="text-xs font-bold leading-5 text-[var(--atlas-primary)] no-underline hover:underline">{source.title} <ExternalLink className="ml-1 inline size-3" /></a><p className="mt-1 text-[11px] font-semibold text-[var(--atlas-muted)]">{source.publisher}</p><p className="mt-1 text-[11px] leading-5 text-[var(--atlas-muted)]">{source.note}</p></li>)}</ol>
          </PublicCard>
          {related.length ? <PublicCard title="Keep exploring" eyebrow="From context to action"><div className="space-y-3">{related.map((item) => <Link key={`${item.type}-${item.id}`} href={item.href} className="block rounded-xl border border-[var(--atlas-border)] p-3 no-underline hover:border-[var(--atlas-primary-border)] hover:no-underline"><span className="block text-[11px] font-semibold text-[var(--atlas-muted)]">{item.label}</span><span className="mt-1 flex items-center justify-between gap-2 text-xs font-bold text-[var(--atlas-primary)]">{item.name}<ArrowRight className="size-3.5 shrink-0" /></span></Link>)}</div></PublicCard> : null}
        </aside>
      </div>
    </PublicPageShell>
  );
}
