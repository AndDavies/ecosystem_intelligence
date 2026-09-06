import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
  title: "North Signal | The Free Weekly Canadian Defence Newsletter",
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

      <div className="my-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-start">
        <div><div className="relative aspect-[16/9] overflow-hidden bg-[var(--atlas-ink)]"><Image src="/imagery/north-signal/sovereign-capability.webp" alt="" fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" /></div>
        <NorthSignalValueLines limit={3} className="border-b border-[var(--atlas-border)] py-4" /></div>

      <section id="north-signal-signup" data-north-signal-page-signup className="scroll-mt-24 border-t-2 border-[var(--atlas-ink)] py-5" aria-label="Subscribe to North Signal">
        <NorthSignalSignupForm placement="newsletter_page" trigger="north_signal_hero" variant="inline" previewHref={proof?.href ?? "/signals"} />
      </section>

      </div>
      <section className="my-8 grid gap-8 border-t border-[var(--atlas-border)] py-8 lg:grid-cols-2" aria-labelledby="north-signal-reporting-heading">
        <div><p className="atlas-eyebrow">Read before you subscribe</p><h2 id="north-signal-reporting-heading" className="mt-3 text-2xl font-extrabold">Start with the reporting behind the briefing.</h2><p className="mt-3 text-sm leading-7 text-[var(--atlas-muted)]">Defence Signals is our public news and analysis. North Signal is the weekly email that brings selected developments together. This link opens a published Signals edition, not a sample email.</p></div>
        <NorthSignalThisWeekCard proof={proof} placement="newsletter_page" trigger="north_signal_reporting" />
      </section>
      <p className="mb-10 text-sm leading-7 text-[var(--atlas-muted)]">Free to read. Reviewed by a person before delivery. Unsubscribe whenever you like. <Link href="/privacy" className="font-bold underline underline-offset-4">How we handle your information.</Link></p>
    </PublicPageShell>
  );
}
