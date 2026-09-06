import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Search, Radar, FileSearch2 } from "lucide-react";
import { LandingProductPreview } from "@/components/atlas/guided-landing-dynamic";
import { LandingFaq } from "@/components/atlas/landing-faq";
import { LandingEntryLink, LandingHashBridge, LandingNorthSignalAttribution } from "@/components/atlas/landing-entry-link";
import { PublicRecordSearch } from "@/components/atlas/public-record-search";
import { NorthSignalInline } from "@/components/atlas/north-signal-signup";
import { PublicAtlasFooter } from "@/components/atlas/public-atlas-footer";
import { PublicAtlasHeader } from "@/components/atlas/public-atlas-header";
import { JsonLd } from "@/components/seo/json-ld";
import { brandCopy, rootSocialCard } from "@/lib/brand-copy";
import { absoluteUrl, siteName } from "@/lib/site";
import { signalLeadVisual } from "@/lib/signals/visuals";
import { signalEditionPresentation } from "@/lib/signals/presentation";
import { getPublishedSignals } from "@/lib/atlas/signals";

export const revalidate = 300;

const rootSocialImageUrl = absoluteUrl(rootSocialCard.path);

export const metadata: Metadata = {
  title: "True North Map | Find Canadian Defence and Dual-Use Capability",
  description: brandCopy.positioning,
  alternates: { canonical: "/" },
  openGraph: {
    title: brandCopy.headline,
    description: brandCopy.positioning,
    url: "/",
    type: "website",
    siteName,
    locale: "en_CA",
    images: [{
      url: rootSocialImageUrl,
      width: rootSocialCard.width,
      height: rootSocialCard.height,
      type: rootSocialCard.type,
      alt: rootSocialCard.alt
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: brandCopy.headline,
    description: brandCopy.positioning,
    images: [{
      url: rootSocialImageUrl,
      width: rootSocialCard.width,
      height: rootSocialCard.height,
      alt: rootSocialCard.alt
    }]
  }
};

const faq = [
  ["Where does the information come from?", "Profiles and connections are built from released public sources and approved first-party submissions. Every substantive public claim is expected to remain traceable to supporting evidence."],
  ["Does a possible fit mean procurement eligibility?", "No. A possible fit is a reviewed assessment of relevance based on public evidence. It is not eligibility, endorsement, customer interest or procurement guidance."],
  ["How are AI and human review used?", "AI can help interpret a question and surface possible connections. People review the records, evidence and public assessments before anything is published."],
  ["How can I correct or add a record?", "Use the contribution path to suggest an organization, claim a profile or propose a correction. Submissions enter private review and never change the public record automatically."]
] as const;

export default async function LandingPage() {
  const signal = (await getPublishedSignals(1))[0];
  const signalVisual = signal ? signalLeadVisual(signal) : null;
  return (
    <main className="atlas-page tnm-landing min-h-screen bg-[var(--atlas-canvas)] text-[var(--atlas-ink)]">
      <PublicAtlasHeader />
      <LandingHashBridge />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name: "True North Map", description: metadata.description, url: absoluteUrl("/"), primaryImageOfPage: { "@type": "ImageObject", url: rootSocialImageUrl, width: rootSocialCard.width, height: rootSocialCard.height } }} />
      <section className="atlas-hero" aria-labelledby="landing-heading">
        <div className="atlas-hero-copy">
          <p className="atlas-eyebrow !text-white">{brandCopy.category}</p>
          <h1 id="landing-heading" className="atlas-hero-title mt-4">{brandCopy.headline}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/85">{brandCopy.introduction}</p>
          <div className="mt-6 min-w-0 border-t border-[var(--atlas-border-strong)] pt-5">
            <h2 className="mb-3 text-xl font-extrabold">Who are you looking for?</h2>
            <PublicRecordSearch placement="home" />
            <p className="mt-3 text-sm text-white/75">Try a company name, sonar or cybersecurity.</p>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
              <LandingEntryLink href="/map?view=map" entryPath="map" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold underline underline-offset-4">Explore the map <ArrowRight className="size-4" /></LandingEntryLink>
              <Link href="/how-it-works" className="inline-flex min-h-11 items-center text-sm font-bold underline underline-offset-4">How it works</Link>
            </div>
            <p className="mt-1 text-sm font-semibold">{brandCopy.access}</p>
          </div>
        </div>
        <div className="atlas-hero-media" aria-hidden="true">
          <Image src="/imagery/home-maritime-evidence.webp" alt="" fill priority sizes="(min-width: 1024px) 50vw, 100vw" />
        </div>
      </section>

      <LandingProductPreview />

      <section className="bg-[var(--atlas-ink)] py-9 text-white sm:py-12" aria-label="North Signal weekly briefing">
        <div className="atlas-frame"><LandingNorthSignalAttribution><NorthSignalInline placement="newsletter_inline_home" trigger="landing_editorial_band" tone="dark" /></LandingNorthSignalAttribution></div>
      </section>

      <section className="atlas-frame py-10 sm:py-14" aria-labelledby="choose-heading">
        <h2 id="choose-heading" className="text-3xl font-extrabold tracking-[-0.035em]">Another way in.</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <JobCard icon={Search} title="Find companies and technologies" text="Browse the directory, narrow the results and open a profile." label="Search the directory" href="/organizations" entryPath="directory" />
          <JobCard icon={Radar} title="Explore a mission area" text="See organizations and technologies connected to an operational problem." label="Explore mission areas" href="/missions" entryPath="mission" />
          <JobCard icon={FileSearch2} title="Follow a published defence need" text="Read the original requirement and examine reviewed connections." label="Browse defence needs" href="/demand" entryPath="public_need" />
        </div>
      </section>

      {signal ? <section className="border-y border-[var(--atlas-border)] bg-white py-10 sm:py-14" aria-labelledby="signals-heading">
        <div className="atlas-frame grid gap-6 lg:grid-cols-[0.7fr_1.3fr] lg:gap-12">
          <div><p className="atlas-eyebrow">Defence Signals · News and analysis</p><h2 id="signals-heading" className="mt-3 text-3xl font-extrabold tracking-[-0.035em]">What changed, and who it matters to.</h2><p className="mt-4 text-base leading-7 text-[var(--atlas-muted)]">Follow a development into the Canadian companies, technologies and sources behind it.</p><Link href="/signals" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold underline underline-offset-4">All Defence Signals <ArrowRight className="size-4" /></Link></div>
          <LandingEntryLink href={`/signals/${signal.slug}`} entryPath="signals" aria-label={`Read Defence Signals: ${signal.title}`} className="atlas-landing-signal border-t-2 border-[var(--atlas-ink)] py-6 no-underline hover:no-underline sm:py-8"><div className="atlas-landing-signal-image"><Image src={signalVisual?.url ?? "/brand/north-signal-mark-light.svg"} alt={signalVisual?.alt ?? "Defence Signals editorial cover"} fill sizes="(min-width: 1024px) 220px, 50vw" className="object-contain" /></div><div><p className="text-xs font-semibold text-[var(--atlas-muted)]">{new Intl.DateTimeFormat("en-CA", { dateStyle: "long" }).format(new Date(`${signal.editionDate}T12:00:00Z`))}</p><h3 className="mt-3 text-2xl font-extrabold leading-tight">{signal.title}</h3><p className="mt-3 line-clamp-3 text-base leading-7 text-[var(--atlas-muted)]">{signalEditionPresentation(signal).deck}</p><span className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold underline underline-offset-4">Read the edition <ArrowRight className="size-4" /></span>{signalVisual ? <p className="mt-2 text-xs text-[var(--atlas-muted)]">{signalVisual.attribution}</p> : null}</div></LandingEntryLink>
        </div>
      </section> : null}

      <section className="atlas-frame py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
          <div><p className="atlas-eyebrow">An independent project</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-0.035em]">The capability is here. Finding it should be easier.</h2><p className="mt-4 text-base leading-7 text-[var(--atlas-muted)]">I’m Andrew Davies, a veteran and former Combat Systems Engineering Officer. I built True North Map to help people see what Canadian teams can do and find their next conversation.</p><Link href="/about" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-bold underline underline-offset-4">Why I built it <ArrowRight className="size-4" /></Link></div>
          <div><h2 className="text-xl font-extrabold">Before you begin</h2><LandingFaq items={faq} /><p className="mt-4 text-sm leading-6">Know something missing? <Link href="/submit" className="font-bold underline underline-offset-4">Suggest an organization or correction.</Link></p></div>
        </div>
      </section>
      <PublicAtlasFooter variant="landing" />
    </main>
  );
}

function JobCard({ icon: Icon, title, text, label, href, entryPath }: { icon: typeof Search; title: string; text: string; label: string; href: string; entryPath: "directory" | "public_need" | "mission" }) {
  return <LandingEntryLink href={href} entryPath={entryPath} className="flex flex-col border-t border-[var(--atlas-border-strong)] py-6 no-underline hover:no-underline"><Icon className="size-6 text-[var(--atlas-ink)]" aria-hidden="true" /><h3 className="mt-4 text-xl font-extrabold">{title}</h3><p className="mb-4 mt-3 text-sm leading-6 text-[var(--atlas-muted)]">{text}</p><span className="mt-auto inline-flex min-h-11 items-center gap-2 text-sm font-bold underline underline-offset-4">{label} <ArrowRight className="size-4" /></span></LandingEntryLink>;
}
