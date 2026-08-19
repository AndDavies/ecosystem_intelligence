import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { NorthSignalLandingTelemetry, NorthSignalSampleCardLink } from "@/components/atlas/north-signal-landing-telemetry";
import { NorthSignalPageSignupAction, NorthSignalThisWeekCard, NorthSignalValueLines } from "@/components/atlas/north-signal-offer";
import { NorthSignalSignupForm } from "@/components/atlas/north-signal-signup";
import { PublicPageShell } from "@/components/atlas/public-page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { getLatestPublishedSignalProof } from "@/lib/atlas/signals";
import { brandCopy } from "@/lib/brand-copy";
import { northSignalOffer } from "@/lib/north-signal/offer";
import { absoluteUrl, siteName } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "North Signal | Five Minutes to Understand What Changed",
  description: brandCopy.northSignal,
  alternates: { canonical: "/north-signal" },
  openGraph: {
    title: brandCopy.northSignal,
    description: brandCopy.northSignalSupport,
    url: "/north-signal",
    type: "website",
    siteName,
    locale: "en_CA",
    images: [{ url: "/imagery/north-signal/sovereign-capability.webp", width: 1600, height: 900, alt: "Grayscale Canadian fighter aircraft above a connected map of Canada, with Signal Yellow afterburners." }]
  },
  twitter: {
    card: "summary_large_image",
    title: brandCopy.northSignal,
    description: brandCopy.northSignalSupport,
    images: ["/imagery/north-signal/sovereign-capability.webp"]
  }
};

export default async function NorthSignalPage() {
  const proof = await getLatestPublishedSignalProof();

  return (
    <PublicPageShell
      eyebrow={northSignalOffer.label}
      title={northSignalOffer.headline}
      description={northSignalOffer.supportingSentence}
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "North Signal" }]}
      actions={(
        <>
          <NorthSignalPageSignupAction />
          <NorthSignalSampleCardLink href={proof?.href ?? "/signals"} label={northSignalOffer.previewLabel} className="px-2 text-sm" showIcon={false} />
        </>
      )}
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

      <section className="mt-6 overflow-hidden rounded-[18px] bg-[var(--atlas-ink)] text-white xl:grid xl:grid-cols-[minmax(0,1fr)_300px]" aria-label="This week in North Signal">
        <div className="grid gap-4 px-4 py-4 sm:px-5 sm:py-5 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.46fr)] lg:items-center">
          <NorthSignalThisWeekCard proof={proof} placement="newsletter_page" trigger="north_signal_this_week" />
          <p className="text-xs font-semibold leading-5 text-white/70">{northSignalOffer.proofLine}</p>
        </div>
        <div className="relative hidden min-h-[178px] xl:block">
          <Image src="/imagery/north-signal/sovereign-capability.webp" alt="Grayscale Canadian fighter aircraft above a connected map of Canada, with Signal Yellow afterburners." fill sizes="300px" className="object-cover object-[58%_50%]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[var(--atlas-ink)]/35 to-transparent" aria-hidden="true" />
        </div>
      </section>

      <NorthSignalValueLines limit={3} className="border-b border-[var(--atlas-border)] py-3 sm:grid-cols-3 sm:gap-5" />

      <section id="north-signal-signup" data-north-signal-page-signup className="scroll-mt-24 rounded-[18px] bg-white px-4 py-4 sm:px-5 sm:py-5" aria-label="Subscribe to North Signal">
        <NorthSignalSignupForm placement="newsletter_page" trigger="north_signal_hero" variant="inline" previewHref={proof?.href ?? "/signals"} />
      </section>

      <section className="grid gap-6 py-12 sm:py-14 lg:grid-cols-[minmax(0,0.8fr)_minmax(320px,1.2fr)] lg:items-center" aria-labelledby="north-signal-sample-heading">
        <div>
          <p className="atlas-eyebrow">Read before you subscribe</p>
          <h2 id="north-signal-sample-heading" className="mt-3 max-w-[18ch] font-[family-name:var(--font-barlow)] text-3xl font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-4xl">Preview the thinking before North Signal reaches your inbox.</h2>
        </div>
        <div className="rounded-[18px] bg-white p-5 sm:p-7">
          <p className="text-sm leading-7 text-[var(--atlas-muted)]">Published Canadian Defence Signals are the public sample library. Open the latest edition above, or browse the archive to see what changed, which Canadian capabilities it may affect, and the sources and limits behind the weekly brief.</p>
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
