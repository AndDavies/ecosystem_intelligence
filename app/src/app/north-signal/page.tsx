import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Check, FileCheck2, Radar, Route, ShieldCheck, UsersRound } from "lucide-react";
import { NorthSignalLandingTelemetry, NorthSignalSampleCardLink } from "@/components/atlas/north-signal-landing-telemetry";
import { NorthSignalSignupForm } from "@/components/atlas/north-signal-signup";
import { PublicPageShell } from "@/components/atlas/public-page-shell";
import { SignalHeroImage } from "@/components/atlas/signal-hero-image";
import { JsonLd } from "@/components/seo/json-ld";
import { getPublishedSignals } from "@/lib/atlas/signals";
import { absoluteUrl, siteName } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "North Signal Weekly Canadian Defence Decision Brief",
  description: "Get one evidence-led weekly briefing that connects Canadian defence developments to capability, Public Needs and Mission Areas.",
  alternates: { canonical: "/north-signal" },
  openGraph: {
    title: "North Signal · Weekly Canadian defence decision brief",
    description: "See what changed, how it connects to Canadian capability and public needs, and what deserves investigation next.",
    url: "/north-signal",
    type: "website",
    siteName,
    locale: "en_CA",
    images: [{ url: "/imagery/north-signal/sovereign-capability.webp", width: 1600, height: 900, alt: "Grayscale Canadian fighter aircraft above a connected map of Canada, with Signal Yellow afterburners." }]
  },
  twitter: {
    card: "summary_large_image",
    title: "North Signal · Weekly Canadian defence decision brief",
    description: "A clearer weekly read on what is changing in Canadian defence.",
    images: ["/imagery/north-signal/sovereign-capability.webp"]
  }
};

const weeklyContents = [
  "The one thing to know",
  "Three source-linked Signals behind it",
  "New Canadian capability and public-need connections",
  "What the evidence changes, and what to watch next"
];

const audiences = [
  "Government and Canadian Armed Forces teams",
  "Program, procurement and innovation professionals",
  "Ecosystem conveners building better routes into Canadian capability"
];

const faq = [
  ["What is North Signal?", "A concise weekly decision brief built from published Canadian Defence Signals, reviewed True North Map records and the original public sources behind them."],
  ["Is it an official Government of Canada or CAF publication?", "No. True North Map is an independent project. North Signal does not represent government, the Canadian Armed Forces, a procurement authority or an endorsement."],
  ["How often will it arrive?", "Once each week when the public record supports a useful briefing. Every issue is reviewed before it is sent."],
  ["What happens to my email address?", "It is stored in the private consent ledger and synchronized to MailerLite for delivery. Behaviour events do not contain your email address, and you can unsubscribe at any time."]
];

export default async function NorthSignalPage() {
  const samples = (await getPublishedSignals(3)).slice(0, 3);

  return (
    <PublicPageShell
      eyebrow="North Signal · Weekly decision brief"
      title="A clearer weekly read on what is changing in Canadian defence."
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

      <section className="mt-7 overflow-hidden rounded-[18px] bg-[var(--atlas-ink)] text-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]" aria-labelledby="north-signal-hero-title">
        <div className="flex flex-col justify-center px-6 py-9 sm:px-9 sm:py-12 lg:px-12 lg:py-14">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--atlas-signal)]">North Signal · Weekly decision brief</p>
          <h1 id="north-signal-hero-title" className="mt-4 max-w-[13ch] text-[clamp(2.5rem,5vw,4.5rem)] font-extrabold leading-[0.98] tracking-[-0.055em]">A clearer weekly read on what is changing in Canadian defence.</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/76 sm:text-lg sm:leading-8">North Signal connects the week&apos;s most consequential defence developments to Canadian capability, released Public Needs and the Mission Areas they may affect. It is written for people deciding what deserves attention, investigation or a conversation next.</p>
          <div className="mt-7 max-w-xl">
            <NorthSignalSignupForm placement="newsletter_page" trigger="north_signal_hero" variant="inline" tone="dark" />
          </div>
          <NorthSignalSampleCardLink href="/signals" label="Read recent Signals" className="mt-5 w-fit !text-[var(--atlas-signal)] decoration-2 underline-offset-4" />
          <p className="mt-3 text-xs font-semibold text-white/60">One evidence-led briefing each week. Original sources included. Unsubscribe anytime.</p>
        </div>
        <div className="relative min-h-[260px] sm:min-h-[360px] lg:min-h-[620px]">
          <Image src="/imagery/north-signal/sovereign-capability.webp" alt="Grayscale Canadian fighter aircraft above a connected map of Canada, with Signal Yellow afterburners." fill priority sizes="(max-width: 1023px) 100vw, 45vw" className="object-cover object-[58%_50%]" />
        </div>
      </section>

      <section className="py-16 sm:py-20" aria-labelledby="north-signal-weekly-heading">
        <p className="atlas-eyebrow">What lands each week</p>
        <h2 id="north-signal-weekly-heading" className="mt-3 max-w-3xl text-3xl font-extrabold tracking-[-0.045em] sm:text-5xl">A short briefing with a clear decision path.</h2>
        <div className="mt-9 grid gap-3 md:grid-cols-2">
          {weeklyContents.map((item, index) => <div key={item} className="flex items-start gap-4 rounded-[18px] bg-white p-5 sm:p-6"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--atlas-signal)] text-sm font-extrabold text-[var(--atlas-ink)]">{index + 1}</span><p className="pt-1 text-base font-extrabold text-[var(--atlas-ink)]">{item}</p></div>)}
        </div>
      </section>

      <section className="rounded-[18px] bg-[var(--atlas-blue-soft)] px-5 py-9 sm:px-8 sm:py-11" aria-labelledby="north-signal-samples-heading">
        <p className="atlas-eyebrow">Read before you subscribe</p>
        <h2 id="north-signal-samples-heading" className="mt-3 text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">Recent Signals show the evidence standard.</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--atlas-muted)]">Each edition separates the public record from True North Map&apos;s assessment, keeps uncertainty visible and provides the original sources.</p>
        {samples.length ? <div className="mt-8 grid gap-5 lg:grid-cols-3">{samples.map((sample) => <article key={sample.id} className="flex min-h-full flex-col overflow-hidden rounded-[18px] bg-white">
          {sample.heroImage ? <SignalHeroImage image={sample.heroImage} className="aspect-[16/9]" /> : <div className="aspect-[16/9] bg-[var(--atlas-ink)]" />}
          <div className="flex flex-1 flex-col p-5"><time dateTime={sample.editionDate} className="text-xs font-bold text-[var(--atlas-muted)]">{new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(new Date(`${sample.editionDate}T12:00:00Z`))}</time><h3 className="mt-3 text-xl font-extrabold leading-7 tracking-[-0.025em]">{sample.title}</h3><p className="mt-3 line-clamp-4 text-sm leading-6 text-[var(--atlas-muted)]">{sample.executiveSummary}</p><NorthSignalSampleCardLink href={`/signals/${sample.slug}`} label="Read this edition" className="mt-auto pt-5 text-sm" /></div>
        </article>)}</div> : <p className="mt-7 rounded-[14px] bg-white p-5 text-sm text-[var(--atlas-muted)]">Published Signals will appear here as the sample library becomes available.</p>}
      </section>

      <section className="grid gap-8 py-16 sm:py-20 lg:grid-cols-2" aria-labelledby="north-signal-connections-heading">
        <div>
          <p className="atlas-eyebrow">From event to Canadian relevance</p>
          <h2 id="north-signal-connections-heading" className="mt-3 text-3xl font-extrabold tracking-[-0.045em] sm:text-5xl">See the development, then follow where it may connect.</h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--atlas-muted)]">North Signal does more than collect headlines. It connects selected developments to published organizations, Mission Areas and released Public Needs when the evidence supports that path.</p>
          <div className="mt-7 flex flex-wrap gap-2"><Link href="/missions" className="atlas-secondary-button min-h-11 px-4 text-sm">Explore Mission Areas</Link><Link href="/demand" className="atlas-secondary-button min-h-11 px-4 text-sm">Inspect Public Needs</Link><Link href="/organizations" className="atlas-secondary-button min-h-11 px-4 text-sm">Browse organizations</Link></div>
        </div>
        <ol className="grid gap-3">
          {[[Radar, "What changed", "A dated, source-linked development worth attention."], [Route, "Where it connects", "Relevant Canadian capability, Mission Areas or released Public Needs."], [ShieldCheck, "What the evidence establishes", "A clear boundary between public fact, assessment and unknowns."]].map(([Icon, title, text]) => { const Glyph = Icon as typeof Radar; return <li key={String(title)} className="flex gap-4 rounded-[18px] bg-white p-5"><span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--atlas-signal-soft)] text-[var(--atlas-ink)]"><Glyph className="size-5" /></span><div><h3 className="font-extrabold">{String(title)}</h3><p className="mt-1 text-sm leading-6 text-[var(--atlas-muted)]">{String(text)}</p></div></li>; })}
        </ol>
      </section>

      <section className="rounded-[18px] bg-[var(--atlas-ink)] px-6 py-10 text-white sm:px-9 sm:py-12" aria-labelledby="north-signal-audience-heading">
        <div className="grid gap-9 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div><UsersRound className="size-7 text-[var(--atlas-signal)]" /><p className="mt-5 text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--atlas-signal)]">Who it is for</p><h2 id="north-signal-audience-heading" className="mt-3 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">People deciding what deserves attention next.</h2></div>
          <ul className="grid gap-3">{audiences.map((audience) => <li key={audience} className="flex items-start gap-3 border-b border-white/15 pb-4 text-base leading-7 text-white/80 last:border-0"><Check className="mt-1 size-5 shrink-0 text-[var(--atlas-signal)]" />{audience}</li>)}</ul>
        </div>
      </section>

      <section className="grid gap-8 py-16 sm:py-20 lg:grid-cols-[0.8fr_1.2fr]" aria-labelledby="north-signal-trust-heading">
        <div><FileCheck2 className="size-7 text-[var(--atlas-evidence)]" /><p className="mt-5 atlas-eyebrow">Evidence and editorial trust</p><h2 id="north-signal-trust-heading" className="mt-3 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">Original sources remain part of the briefing.</h2></div>
        <div className="space-y-5 text-base leading-8 text-[var(--atlas-muted)]"><p>Published Signals can help explain the pattern, but they never replace the original release, filing, procurement notice, report or durable program page behind the claim.</p><p>Every issue is reviewed before sending. Assessments stay labelled, unresolved points remain visible, and no connection implies procurement eligibility, customer interest or endorsement.</p><Link href="/methodology" className="inline-flex min-h-11 items-center font-bold text-[var(--atlas-primary)] underline decoration-2 underline-offset-4">Read the methodology</Link></div>
      </section>

      <section className="rounded-[18px] bg-white px-5 py-9 sm:px-8 sm:py-11" aria-labelledby="north-signal-faq-heading">
        <p className="atlas-eyebrow">Questions before subscribing</p><h2 id="north-signal-faq-heading" className="mt-3 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">North Signal, clearly explained.</h2>
        <div className="mt-7 divide-y divide-[var(--atlas-border)]">{faq.map(([question, answer]) => <details key={question} className="py-4"><summary className="cursor-pointer text-base font-extrabold text-[var(--atlas-ink)]">{question}</summary><p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--atlas-muted)]">{answer}</p></details>)}</div>
      </section>

      <section className="my-16 rounded-[18px] bg-[var(--atlas-signal-soft)] px-5 py-9 sm:px-8 sm:py-11" aria-labelledby="north-signal-final-heading">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(380px,1.1fr)] lg:items-center"><div><p className="atlas-eyebrow">North Signal · Weekly</p><h2 id="north-signal-final-heading" className="mt-3 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">Get the decision brief in your inbox.</h2><p className="mt-3 text-sm leading-7 text-[var(--atlas-muted)]">One evidence-led briefing each week. Original sources included. Unsubscribe anytime.</p></div><NorthSignalSignupForm placement="newsletter_page" trigger="north_signal_final" variant="inline" /></div>
      </section>
    </PublicPageShell>
  );
}
