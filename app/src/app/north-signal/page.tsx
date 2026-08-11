import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { NorthSignalLandingTelemetry, NorthSignalSampleCardLink } from "@/components/atlas/north-signal-landing-telemetry";
import { NorthSignalThisWeekCard, NorthSignalValueLines } from "@/components/atlas/north-signal-offer";
import { NorthSignalSignupForm } from "@/components/atlas/north-signal-signup";
import { PublicPageShell } from "@/components/atlas/public-page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { getLatestPublishedSignalProof } from "@/lib/atlas/signals";
import { northSignalOffer } from "@/lib/north-signal/offer";
import { absoluteUrl, siteName } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Five Minutes to Understand the Week in Canadian Defence",
  description: "Get North Signal, the free five-minute weekly decision brief built from source-linked Canadian Defence Signals and human review.",
  alternates: { canonical: "/north-signal" },
  openGraph: {
    title: "Five minutes to understand the week in Canadian defence",
    description: "One clear bottom line, the source-linked Signals behind it, and the Canadian capability and Public Need links worth watching.",
    url: "/north-signal",
    type: "website",
    siteName,
    locale: "en_CA",
    images: [{ url: "/imagery/north-signal/sovereign-capability.webp", width: 1600, height: 900, alt: "Grayscale Canadian fighter aircraft above a connected map of Canada, with Signal Yellow afterburners." }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Five minutes to understand the week in Canadian defence",
    description: "Get one free, source-linked, human-reviewed decision brief each week.",
    images: ["/imagery/north-signal/sovereign-capability.webp"]
  }
};

export default async function NorthSignalPage() {
  const proof = await getLatestPublishedSignalProof();

  return (
    <PublicPageShell
      eyebrow={northSignalOffer.label}
      title={northSignalOffer.headline}
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "North Signal" }]}
      pageHeader={<></>}
    >
      <NorthSignalLandingTelemetry />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "North Signal",
        description: metadata.description,
        url: absoluteUrl("/north-signal"),
        inLanguage: "en-CA",
        isPartOf: { "@type": "WebSite", name: siteName, url: absoluteUrl("/") },
        primaryImageOfPage: { "@type": "ImageObject", url: absoluteUrl("/imagery/north-signal/sovereign-capability.webp"), width: 1600, height: 900 }
      }} />

      <section className="mt-7 overflow-hidden rounded-[18px] bg-[var(--atlas-ink)] text-white lg:grid lg:grid-cols-[minmax(0,1.12fr)_minmax(340px,0.68fr)]" aria-labelledby="north-signal-hero-title">
        <div className="flex flex-col justify-center px-5 py-8 sm:px-8 sm:py-11 lg:px-10 lg:py-12">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--atlas-signal)]">{northSignalOffer.label}</p>
          <h1 id="north-signal-hero-title" className="mt-4 max-w-[18ch] font-[family-name:var(--font-barlow)] text-[clamp(2.45rem,5vw,4.4rem)] font-extrabold leading-[0.98] tracking-[-0.055em]">{northSignalOffer.headline}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/76 sm:text-lg sm:leading-8">{northSignalOffer.supportingSentence}</p>

          <NorthSignalThisWeekCard proof={proof} placement="newsletter_page" trigger="north_signal_this_week" className="mt-6 max-w-2xl" />
          <NorthSignalValueLines className="mt-6 !text-white/82" />
          <p className="mt-5 max-w-2xl text-xs font-semibold leading-5 text-white/65">{northSignalOffer.proofLine}</p>

          <div className="mt-6 max-w-2xl rounded-[14px] bg-white p-4 text-[var(--atlas-ink)] shadow-[0_20px_50px_rgba(0,0,0,0.16)] sm:p-5">
            <NorthSignalSignupForm placement="newsletter_page" trigger="north_signal_hero" variant="inline" previewHref={proof?.href ?? "/signals"} />
          </div>
        </div>
        <div className="relative min-h-[260px] sm:min-h-[320px] lg:min-h-full">
          <Image src="/imagery/north-signal/sovereign-capability.webp" alt="Grayscale Canadian fighter aircraft above a connected map of Canada, with Signal Yellow afterburners." fill priority sizes="(max-width: 1023px) 100vw, 38vw" className="object-cover object-[58%_50%]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[var(--atlas-ink)]/15 to-transparent lg:from-[var(--atlas-ink)]/40" aria-hidden="true" />
        </div>
      </section>

      <section className="grid gap-6 py-14 sm:py-16 lg:grid-cols-[minmax(0,0.8fr)_minmax(320px,1.2fr)] lg:items-center" aria-labelledby="north-signal-sample-heading">
        <div>
          <p className="atlas-eyebrow">Read before you subscribe</p>
          <h2 id="north-signal-sample-heading" className="mt-3 max-w-[18ch] font-[family-name:var(--font-barlow)] text-3xl font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-4xl">See the public evidence before North Signal reaches your inbox.</h2>
        </div>
        <div className="rounded-[18px] bg-white p-5 sm:p-7">
          <p className="text-sm leading-7 text-[var(--atlas-muted)]">Published Canadian Defence Signals are the public sample library. Open the latest edition above, or browse the archive to see the source links, evidence boundaries and unresolved questions behind the weekly brief.</p>
          <NorthSignalSampleCardLink href="/signals" label="Browse published Signals" className="mt-4 text-sm" />
        </div>
      </section>

      <section className="mb-16 rounded-[18px] bg-[var(--atlas-blue-soft)] px-5 py-8 sm:px-8 sm:py-10" aria-labelledby="north-signal-trust-heading">
        <p className="atlas-eyebrow">A low-risk weekly read</p>
        <h2 id="north-signal-trust-heading" className="mt-3 font-[family-name:var(--font-barlow)] text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">Five minutes. One human-reviewed briefing. No lock-in.</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--atlas-muted)]">Original sources stay attached, the bottom line is reviewed before delivery, and you can unsubscribe at any time.</p>
        <Link href="/privacy" className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-[var(--atlas-primary)] underline decoration-2 underline-offset-4">Review privacy details</Link>
      </section>
    </PublicPageShell>
  );
}
