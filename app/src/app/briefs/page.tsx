import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Compass, SearchCheck } from "lucide-react";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { getPublishedDefenceBriefs } from "@/lib/atlas/briefs";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, siteName } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Canadian Defence Briefs",
  description: "Clear, source-backed answers about Canadian defence priorities, dual-use technology, industrial capacity, and public demand signals.",
  alternates: { canonical: "/briefs" },
  openGraph: { title: "Canadian Defence Briefs", description: "Understand Canada’s defence needs, industrial opportunities, and technology landscape through concise, reviewed, source-backed answers.", url: "/briefs" }
};

export default async function DefenceBriefsPage() {
  const briefs = await getPublishedDefenceBriefs();
  return (
    <PublicPageShell eyebrow="Find the answer, then follow the evidence" title="Canadian Defence Briefs" description="Clear answers to the questions shaping Canada’s defence and dual-use ecosystem. Each brief connects public evidence to the companies, technologies, and needs worth exploring next.">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "Canadian Defence Briefs", description: metadata.description, url: absoluteUrl("/briefs"), inLanguage: "en-CA", isPartOf: { "@type": "WebSite", name: siteName, url: absoluteUrl("/") }, hasPart: briefs.map((brief) => ({ "@type": "Article", headline: brief.title, url: absoluteUrl(`/briefs/${brief.slug}`) })) }} />
      <div className="grid gap-4 py-6 sm:grid-cols-3">
        <Value icon={<SearchCheck className="size-5" />} title="Answers first" text="Start with a real question and get the concise answer before the detail." />
        <Value icon={<BookOpen className="size-5" />} title="Sources in view" text="See the public record behind each claim and when the page was reviewed." />
        <Value icon={<Compass className="size-5" />} title="A path to action" text="Move from context into public needs, relevant technology, and organizations." />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {briefs.map((brief) => (
          <PublicCard key={brief.id} className="flex h-full flex-col">
            <p className="atlas-eyebrow">Reviewed Canadian defence intelligence</p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.035em] text-[var(--atlas-ink)]">{brief.primaryQuestion}</h2>
            <p className="mt-4 text-sm leading-6 text-[var(--atlas-muted)]">{brief.summaryAnswer}</p>
            <div className="mt-auto flex items-center justify-between gap-4 pt-6">
              <span className="text-[11px] font-semibold text-[var(--atlas-muted)]">{brief.sources.length} public {brief.sources.length === 1 ? "source" : "sources"}</span>
              <Link href={`/briefs/${brief.slug}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--atlas-primary)] no-underline hover:underline">Read the brief <ArrowRight className="size-3.5" /></Link>
            </div>
          </PublicCard>
        ))}
      </div>
    </PublicPageShell>
  );
}

function Value({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="rounded-2xl border border-[var(--atlas-border)] bg-white p-5"><div className="text-[var(--atlas-primary)]">{icon}</div><h2 className="mt-4 text-base font-extrabold text-[var(--atlas-ink)]">{title}</h2><p className="mt-1 text-xs leading-5 text-[var(--atlas-muted)]">{text}</p></div>;
}

