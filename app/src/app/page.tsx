import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  FileSearch2,
  FileSearch,
  ListPlus,
  Radar,
  ScanSearch,
  Search,
  ShieldCheck
} from "lucide-react";
import { LandingCoverageOverlay, LandingEditorialPaths, LandingProductPreview } from "@/components/atlas/guided-landing-dynamic";
import { LandingFaq } from "@/components/atlas/landing-faq";
import { LandingEntryLink, LandingHashBridge, LandingNorthSignalAttribution } from "@/components/atlas/landing-entry-link";
import { GuidedSearchFocus } from "@/components/atlas/guided-search-focus";
import { NorthSignalInline } from "@/components/atlas/north-signal-signup";
import { PublicAtlasFooter } from "@/components/atlas/public-atlas-footer";
import { PublicAtlasHeader } from "@/components/atlas/public-atlas-header";
import { JsonLd } from "@/components/seo/json-ld";
import { brandCopy } from "@/lib/brand-copy";
import { socialMetadata } from "@/lib/seo/social";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "True North Map | Find Canadian Defence and Dual-Use Capability",
  description: brandCopy.positioning,
  alternates: { canonical: "/" },
  ...socialMetadata({
    title: brandCopy.headline,
    description: brandCopy.positioning,
    path: "/",
    eyebrow: brandCopy.category,
    detail: brandCopy.trust
  })
};

const workedSteps = [
  [Search, "Describe the need", "Define the mission, desired outcome and important constraints."],
  [Search, "Confirm the search focus", "See and adjust the concepts applied to the question."],
  [FileSearch, "Compare possible fits", "Review organizations and technologies connected to those concepts."],
  [ClipboardCheck, "Weigh evidence and gaps", "See what supports each possible fit and where the public evidence stops."],
  [ListPlus, "Build a Working List", "Save candidates, evidence and notes for the conversation ahead."]
] as const;

const faq = [
  ["Where does the information come from?", "Profiles and connections are built from released public sources and approved first-party submissions. Every substantive public claim is expected to remain traceable to supporting evidence."],
  ["Does a possible fit mean procurement eligibility?", "No. A possible fit is a reviewed assessment of relevance based on public evidence. It is not eligibility, endorsement, customer interest or procurement guidance."],
  ["How are AI and human review used?", "AI can help interpret a question and surface possible connections. People review the records, evidence and public assessments before anything is published."],
  ["How can I correct or add a record?", "Use the contribution path to suggest an organization, claim a profile or propose a correction. Submissions enter private review and never change the public record automatically."]
] as const;

export default function LandingPage() {
  return (
    <main className="atlas-page tnm-landing min-h-screen bg-[var(--atlas-canvas)] text-[var(--atlas-ink)]">
      <PublicAtlasHeader />
      <LandingHashBridge />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "True North Map",
        description: metadata.description,
        url: absoluteUrl("/"),
        primaryImageOfPage: { "@type": "ImageObject", url: absoluteUrl("/opengraph-image") }
      }} />

      <section className="border-b border-[var(--atlas-border)] bg-[var(--atlas-canvas)] py-0 sm:py-6" aria-labelledby="landing-heading">
        <div className="atlas-frame grid bg-white xl:h-[480px] xl:grid-cols-[600px_minmax(0,1fr)]">
          <div className="min-w-0 flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-10 lg:py-8 xl:py-5 xl:pl-12 xl:pr-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className="atlas-eyebrow">{brandCopy.category}</p>
              <span className="rounded-full border border-[var(--atlas-border-strong)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--atlas-muted)]">Public Beta</span>
            </div>
            <h1 id="landing-heading" className="mt-5 max-w-[620px] text-[clamp(2.75rem,3.4vw,3.25rem)] font-extrabold leading-[0.96] tracking-[-0.052em] text-[var(--atlas-ink)]">
              <span className="atlas-headline-highlight">{brandCopy.headlineLead}</span><br /> more than<br /> most people can see.
            </h1>
            <p className="mt-6 max-w-[34rem] text-[17px] leading-[1.55] text-[var(--atlas-ink-soft)] xl:mt-5 xl:text-lg">Find Canadian organizations and capabilities relevant to a mission, project or released public need. Inspect the public evidence, compare possible fits and decide who is worth speaking with next.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center xl:mt-5 xl:flex-nowrap xl:gap-2.5">
              <LandingEntryLink href="/map?start=need#ask-true-north" entryPath="need" className="atlas-signal-button h-12 gap-2 px-4 text-sm no-underline hover:no-underline">Describe a need <ArrowRight className="size-4" /></LandingEntryLink>
              <LandingEntryLink href="/map" entryPath="map" className="atlas-secondary-button h-12 gap-2 px-4 text-sm">Explore the map <ArrowRight className="size-4" /></LandingEntryLink>
              <Link href="/how-it-works" className="inline-flex min-h-12 items-center gap-2 text-sm font-bold text-[var(--atlas-evidence)] underline decoration-[var(--atlas-evidence)] decoration-2 underline-offset-4">See how it works <ArrowRight className="size-4" /></Link>
            </div>
            <p className="mt-6 flex items-start gap-2 text-sm font-semibold leading-6 text-[var(--atlas-ink)] xl:mt-5"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-[var(--atlas-evidence)]" aria-hidden="true" /><span>{brandCopy.trustCompact}</span></p>
          </div>
          <figure className="grid min-w-0 overflow-hidden bg-white xl:h-[480px] xl:grid-rows-[minmax(0,1fr)_64px]">
            <div className="relative aspect-[16/9] overflow-hidden bg-[var(--atlas-ink)] xl:aspect-auto">
              <Image
                src="/imagery/home-maritime-evidence.webp"
                alt="Illustration of a naval vessel in Arctic waters with network lines connecting industry, communities and defence."
                fill
                priority
                sizes="(min-width: 1480px) 880px, (min-width: 1280px) calc(100vw - 600px), 100vw"
                className="object-cover object-[56%_52%]"
              />
              <LandingCoverageOverlay />
            </div>
            <figcaption className="flex min-h-16 items-center gap-4 bg-white px-6 py-3 text-[var(--atlas-ink)] sm:px-8">
              <span className="h-0.5 w-7 shrink-0 bg-[var(--atlas-signal)]" aria-hidden="true" />
              <span><strong className="block text-sm font-extrabold">{brandCopy.promise}</strong><span className="mt-0.5 block text-xs text-[var(--atlas-muted)]">Find the Canadian teams and technologies worth examining next.</span></span>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="atlas-frame pb-16 pt-10 sm:pb-20 sm:pt-12" aria-labelledby="choose-heading">
        <div className="mx-auto max-w-2xl text-center">
          <p className="atlas-eyebrow">Start with the question</p>
          <h2 id="choose-heading" className="mt-4 text-4xl font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-5xl">What are you trying to decide?</h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[var(--atlas-muted)]">Choose the question you are trying to answer. Each path leads to reviewed organizations, public evidence and a practical next step.</p>
        </div>
        <div className="mt-9 grid gap-5 lg:grid-cols-3">
          <JobCard icon={ScanSearch} title="Find organizations for a need" text="Describe a mission, project or capability gap. See Canadian organizations worth examining and why." label="Describe a need" href="/map?start=need#ask-true-north" entryPath="need" primary />
          <JobCard icon={FileSearch2} title="Follow a public need" text="Start with a released government or allied need. See which technologies may be relevant, what supports that view and the limits of the evidence." label="Review public needs" href="/demand" entryPath="public_need" />
          <JobCard icon={Radar} title="Understand a mission landscape" text="Compare the organizations, technologies and visible gaps connected to an operational context." label="Explore a mission" href="/missions" entryPath="mission" />
        </div>
      </section>

      <LandingProductPreview />

      <section className="atlas-frame pb-16 sm:pb-20" aria-labelledby="example-heading">
        <div className="overflow-hidden rounded-[16px] bg-[var(--atlas-ink)] px-6 py-10 text-white sm:px-10 sm:py-12 lg:px-12">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--atlas-signal)]">From question to possible fit</p>
          <p className="mt-3 text-xl font-extrabold tracking-[-0.02em] text-white sm:text-2xl">Turn an uncertain requirement into a defensible shortlist.</p>
          <div className="mt-10 grid gap-10 xl:grid-cols-[0.74fr_2.26fr] xl:gap-14">
            <div>
              <h2 id="example-heading" className="max-w-lg text-3xl font-extrabold leading-[1.04] tracking-[-0.04em] sm:text-4xl">Who in Canada could help build a modular naval mission system?</h2>
              <p className="mt-5 max-w-md text-base leading-7 text-white/72">True North Map translates the need into visible concepts, searches reviewed records and helps you build a shortlist you can inspect, save and carry into a real conversation.</p>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/58">It does not decide who is qualified, eligible or recommended.</p>
            </div>
            <ol className="grid gap-7 sm:grid-cols-2 xl:grid-cols-5 xl:gap-5">
              {workedSteps.map(([Icon, title, text], index) => (
                <li key={title} className="relative border-t border-white/20 pt-6 xl:border-t-0 xl:pt-0">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-[var(--atlas-evidence)] text-sm font-extrabold text-white">{index + 1}</span>
                    {index < workedSteps.length - 1 ? <span className="hidden h-px flex-1 border-t border-dashed border-white/20 xl:block" aria-hidden="true" /> : null}
                  </div>
                  <Icon className="mt-6 size-7 text-[var(--atlas-signal)]" aria-hidden="true" />
                  <h3 className="mt-5 text-base font-extrabold leading-6">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/66">{text}</p>
                </li>
              ))}
            </ol>
          </div>
          <GuidedSearchFocus />
        </div>
      </section>

      <LandingEditorialPaths />

      <section className="relative isolate overflow-hidden bg-[var(--atlas-ink)] py-16 text-white sm:py-20">
        <Image src="/imagery/landing-arctic-intelligence.png" alt="" fill sizes="100vw" className="-z-10 object-cover opacity-40" />
        <div className="absolute inset-0 -z-10 bg-[rgba(36,40,39,0.52)]" aria-hidden="true" />
        <div className="atlas-frame">
          <LandingNorthSignalAttribution><NorthSignalInline placement="newsletter_inline_home" trigger="landing_editorial_band" tone="dark" /></LandingNorthSignalAttribution>
        </div>
      </section>

      <section className="border-b border-[var(--atlas-border)] bg-white py-16 sm:py-20">
        <div className="atlas-frame grid gap-14 lg:grid-cols-2 lg:gap-0">
          <div className="lg:border-r lg:border-[var(--atlas-border)] lg:pr-14">
            <div className="flex items-start gap-5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-[var(--atlas-surface-muted)] text-[var(--atlas-evidence)]"><ListPlus className="size-6" /></span>
              <div>
                <p className="atlas-eyebrow">Improve the public record</p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">Know something missing? Improve the public record.</h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-[var(--atlas-muted)]">Suggest an organization, correct a profile or add a public source. Every change is reviewed before publication.</p>
                <Link href="/submit" className="atlas-secondary-button mt-7 h-12 gap-2 px-5 text-sm">Suggest an organization or correction <ArrowRight className="size-4" /></Link>
              </div>
            </div>
          </div>
          <div className="lg:pl-14">
            <div className="flex items-start gap-5">
              <Image src="/brand/north-signal-mark.svg" alt="" width={54} height={54} className="shrink-0" />
              <div>
                <p className="atlas-eyebrow">Independent by design</p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">The capability was here. The shared picture was not.</h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-[var(--atlas-muted)]">True North Map is an independent project created by Andrew Davies, a veteran and former Combat Systems Engineering Officer, to make Canadian defence and dual-use capability easier to find, understand and connect.</p>
                <Link href="/about" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--atlas-evidence)] underline decoration-[var(--atlas-evidence)] decoration-2 underline-offset-4">Why True North Map exists <ArrowRight className="size-4" /></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="atlas-frame py-16 sm:py-20" aria-labelledby="faq-heading">
        <p className="atlas-eyebrow">Trust and transparency</p>
        <h2 id="faq-heading" className="mt-4 text-4xl font-extrabold tracking-[-0.045em] sm:text-5xl">Questions before you begin?</h2>
        <LandingFaq items={faq} />
      </section>

      <PublicAtlasFooter variant="landing" />
    </main>
  );
}

function JobCard({ icon: Icon, title, text, label, href, entryPath, primary = false }: { icon: typeof Search; title: string; text: string; label: string; href: string; entryPath: "need" | "public_need" | "mission"; primary?: boolean }) {
  return <LandingEntryLink href={href} entryPath={entryPath} aria-label={`${title}. ${label}.`} className={`group flex min-h-[236px] flex-col rounded-[18px] p-6 text-[var(--atlas-ink)] no-underline shadow-[0_12px_34px_rgba(36,40,39,0.08)] transition-shadow hover:shadow-[0_18px_42px_rgba(36,40,39,0.13)] hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-evidence)] focus-visible:ring-offset-4 sm:p-7 ${primary ? "bg-[var(--atlas-signal)]" : "bg-white"}`}><span className={`flex size-13 items-center justify-center rounded-full ${primary ? "bg-[var(--atlas-ink)] text-white" : "bg-[var(--atlas-evidence)] text-white"}`}><Icon className="size-6" strokeWidth={2.25} /></span><h3 className="mt-6 text-2xl font-extrabold leading-tight tracking-[-0.03em]">{title}</h3><p className={`mt-3 text-base leading-7 ${primary ? "text-[var(--atlas-ink-soft)]" : "text-[var(--atlas-muted)]"}`}>{text}</p><span className={`mt-auto inline-flex min-h-11 w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold ${primary ? "bg-[var(--atlas-ink)] text-white" : "bg-[var(--atlas-surface-muted)] text-[var(--atlas-ink)]"}`}>{label} <ArrowRight className="size-4" /></span></LandingEntryLink>;
}
