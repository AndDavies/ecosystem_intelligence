import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronDown, FileSearch, Handshake, Map, PlayCircle } from "lucide-react";
import { GuidedSearchFocus } from "@/components/atlas/guided-search-focus";
import { JsonLd } from "@/components/seo/json-ld";
import { PublicPageShell } from "@/components/atlas/public-page-shell";
import { brandCopy } from "@/lib/brand-copy";
import { absoluteUrl } from "@/lib/site";
import { socialMetadata } from "@/lib/seo/social";

export const metadata: Metadata = {
  title: "How True North Map Works",
  description: "See how True North Map connects Canadian organizations and technologies to released defence needs using inspectable sources, human review, and visible limits.",
  alternates: { canonical: "/how-it-works" },
  ...socialMetadata({ title: "How True North Map Works", description: "Explore Canadian capability, check the public evidence, follow released needs, and see where technology may help.", path: "/how-it-works", eyebrow: "From discovery to conversation" })
};

const steps = [
  { number: "1", title: "Find a team or technology", detail: "Search by company name, technology or area. Use the map when location matters.", action: "Search the directory", href: "/organizations", icon: Map },
  { number: "2", title: "Decide whether it is worth a closer look", detail: "Read what the team offers, our assessment of where it may help, and the sources and limits. Kraken Robotics is one example.", action: "Open the Kraken Robotics profile", href: "/organizations/kraken-robotics", icon: FileSearch },
  { number: "3", title: "Save it and start a conversation", detail: "Keep candidates and notes in a private shortlist. Use the organization’s public website or request an introduction from its profile.", action: "Open my shortlists", href: "/collections", icon: Handshake }
] as const;

const frequentlyAskedQuestions = [
  {
    question: "What is True North Map?",
    answer: brandCopy.positioning
  },
  {
    question: "Is it a government or procurement directory?",
    answer: "No. True North Map is independent. Inclusion, evidence strength, and possible relevance do not indicate endorsement, procurement eligibility, customer interest, or a formal opportunity."
  },
  {
    question: "Where does the information come from?",
    answer: "Information comes from public company pages, government and allied sources, program pages, and other durable public evidence. Public profiles link back to their supporting sources."
  },
  {
    question: "Does AI publish the information?",
    answer: "No. Software can help discover leads, structure candidates, and suggest possible connections. A person reviews every public record and every published technology-to-need assessment."
  },
  {
    question: "What does evidence strength mean?",
    answer: "Evidence strength describes the quality and depth of public support for a statement. It is not a rating of the organization or technology."
  },
  {
    question: "Why is information missing?",
    answer: "Coverage is still growing, and some facts are not available from durable public sources. True North Map shows gaps rather than filling them with assumptions."
  },
  {
    question: "How can an organization correct its profile?",
    answer: "Use the claim or correction controls on the organization profile. Submitted information enters a private review workflow and cannot update the public record automatically."
  },
  {
    question: "How do introductions work?",
    answer: "A signed-in user can explain what they need and what they can offer. Andrew reviews the request and may facilitate an introduction. True North Map does not expose private contact information or connect parties automatically."
  },
  {
    question: "What information should not be entered?",
    answer: "Do not enter classified, controlled, confidential, proprietary, or personal information. True North Map is designed for public evidence only."
  },
  {
    question: "How is visitor data handled?",
    answer: "Essential security and consent records operate by default. Optional analytics load only after consent and are excluded from private routes. Raw search text and detailed workflow events have published retention limits and scheduled deletion."
  },
  {
    question: "Who is responsible for the project?",
    answer: "True North Map is created and stewarded by Andrew Davies, a veteran and former Combat Systems Engineering Officer. The project aims to make Canadian capability visible and help the ecosystem move into better-informed conversations."
  }
] as const;

export default function HowItWorksPage() {
  return (
    <PublicPageShell
      eyebrow="How True North Map works"
      title="From question to better-informed conversation."
      description="Start with a real question, compare possible fits, inspect the sources and limits, then carry the strongest candidates into a Shortlist or next conversation."
      backHref="/"
      backLabel="Home"
      actions={<Link href="/organizations" className="atlas-primary-button h-11 px-5 text-sm">Search the directory <ArrowRight className="size-4" /></Link>}
    >
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "WebPage", name: "How True North Map Works", description: metadata.description, url: absoluteUrl("/how-it-works") },
        { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "True North Map", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "How It Works", item: absoluteUrl("/how-it-works") }] },
        { "@context": "https://schema.org", "@type": "VideoObject", name: "A 30-second tour of True North Map", description: "A short walkthrough of how to explore Canada’s defence and dual-use ecosystem with True North Map.", thumbnailUrl: absoluteUrl("/video/true-north-map-tour.png"), uploadDate: "2026-09-05", duration: "PT30S", contentUrl: absoluteUrl("/video/true-north-map-launch.mp4") },
        { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: frequentlyAskedQuestions.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) }
      ]} />

      <ol className="mt-7 overflow-hidden rounded-[18px] bg-white shadow-[0_10px_30px_rgba(36,40,39,0.055)]" aria-label="How True North Map works">
        {steps.map((step, index) => (
          <li key={step.number} className={`group relative grid gap-4 border-b border-[var(--atlas-border)] p-4 last:border-b-0 focus-within:z-10 focus-within:ring-2 focus-within:ring-inset focus-within:ring-[var(--atlas-ink)] sm:grid-cols-[52px_minmax(0,1fr)_auto] sm:items-center sm:px-5 ${index === 0 ? "bg-[var(--atlas-blue-soft)] py-5" : "bg-white"}`}>
            <div className="flex items-center gap-3 sm:block">
              <span className={`flex size-10 items-center justify-center rounded-[10px] text-sm font-extrabold ${index === 0 ? "bg-[var(--atlas-signal)] text-[var(--atlas-ink)]" : "bg-[var(--atlas-surface-muted)] text-[var(--atlas-muted)]"}`}>{step.number}</span>
              <step.icon className={`size-5 sm:mx-auto sm:mt-2 ${index === 0 ? "text-[var(--atlas-ink)]" : "text-[var(--atlas-muted)]"}`} aria-hidden="true" />
            </div>
            <div>
              <h2 className={`${index === 0 ? "text-xl" : "text-lg"} font-extrabold leading-tight tracking-[-0.035em] text-[var(--atlas-ink)]`}>{step.title}</h2>
              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-[var(--atlas-muted)]">{step.detail}</p>
            </div>
            <Link href={step.href} className="inline-flex min-h-11 items-center gap-1.5 self-center text-xs font-extrabold text-[var(--atlas-primary)] no-underline after:absolute after:inset-0 after:content-[''] group-hover:underline focus-visible:outline-none">
              {step.action}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>

      <section className="mt-6 rounded-[14px] bg-[var(--atlas-ink)] px-6 py-7 text-white sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[var(--atlas-signal)]"><CheckCircle2 className="size-5" /></span>
          <div>
            <h2 className="text-lg font-extrabold">Know where the facts end and the assessment begins.</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">Sources establish the record. People review the assessment. AI helps people explore, but it does not publish facts or make procurement decisions.</p>
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-[18px] bg-[var(--atlas-ink)] p-6 text-white sm:p-8" aria-labelledby="guided-example-heading">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--atlas-signal)]">Try a guided example</p>
        <h2 id="guided-example-heading" className="mt-3 text-2xl font-extrabold">Who in Canada could help build a modular naval mission system?</h2>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-white/80">Choose the areas you want to investigate, then open the matching published records. This example uses ordinary search. If you need help turning your own question into a search, Ask True North is an optional AI tool on the map.</p>
        <GuidedSearchFocus />
        <Link href="/map?start=need#ask-true-north" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold underline underline-offset-4">Try Ask True North <ArrowRight className="size-4" /></Link>
      </section>

      <section className="mt-12 grid gap-7 border-y border-[var(--atlas-border)] py-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-12" aria-labelledby="launch-video-title">
        <div>
          <p className="atlas-eyebrow">A 30-second orientation</p>
          <h2 id="launch-video-title" className="mt-3 text-2xl font-extrabold tracking-[-0.04em] text-[var(--atlas-ink)] sm:text-3xl">See how the map moves from a question to useful evidence.</h2>
          <p className="mt-4 text-sm leading-6 text-[var(--atlas-muted)]">Follow the tour through actual page views: search, open a profile, check its sources and save a shortlist. Then try it with your own question.</p>
          <Link href="/map" className="atlas-primary-button mt-6 h-11 gap-2 px-5 text-sm">Explore the map <ArrowRight className="size-4" /></Link>
        </div>
        <div className="overflow-hidden rounded-[14px] border border-[var(--atlas-border-strong)] bg-[var(--atlas-ink)] shadow-[var(--atlas-shadow-soft)]">
          <video
            controls
            playsInline
            preload="metadata"
            poster="/video/true-north-map-tour.png"
            className="aspect-video w-full bg-[var(--atlas-ink)] object-cover"
            aria-label="Thirty-second walkthrough of True North Map"
          >
            <source src="/video/true-north-map-launch.mp4?v=discovery-v2" type="video/mp4" />
            <track kind="captions" src="/video/true-north-map-tour.vtt" srcLang="en" label="English" default />
            <p>Your browser cannot play this video. <a href="/video/true-north-map-launch.mp4">Open the True North Map walkthrough</a>.</p>
          </video>
          <div className="flex items-center gap-3 border-t-2 border-[var(--atlas-signal)] bg-white px-4 py-3">
            <PlayCircle className="size-4 text-[var(--atlas-ink)]" aria-hidden="true" />
            <p className="text-xs font-bold text-[var(--atlas-ink)]">True North Map guided tour · 30 seconds</p>
          </div>
        </div>
      </section>

      <details className="mt-5 rounded-[12px] bg-white p-5"><summary className="cursor-pointer text-sm font-bold">Read the tour transcript</summary><ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-7"><li>Find Canadian companies and technologies for your next defence project. Search the free directory. No account is needed to browse.</li><li>Type a company name or technology. Choose a record, or submit the search to see matching organizations.</li><li>Open a profile to see what the team offers. Add it to a private shortlist when you want to follow up.</li><li>Check the sources, our assessment and the evidence limits. Keep the questions you still need answered.</li><li>North Signal brings selected developments together in a free weekly email. Defence Signals is the public news and analysis behind it.</li></ol></details>

      <section className="mt-12" aria-labelledby="faq-title">
        <div className="grid gap-5 border-b border-[var(--atlas-border)] pb-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
          <div>
            <p className="atlas-eyebrow">Frequently asked questions</p>
            <h2 id="faq-title" className="mt-3 text-3xl font-extrabold tracking-[-0.045em] text-[var(--atlas-ink)] sm:text-4xl">What to know before you use the map.</h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-[var(--atlas-muted)]">Clear answers about evidence, independence, AI, corrections, introductions, and privacy.</p>
        </div>
        <div className="mt-6 grid gap-3 lg:grid-cols-2 lg:items-start">
          {frequentlyAskedQuestions.map((item) => (
            <details key={item.question} className="group rounded-[12px] border border-[var(--atlas-border)] bg-white open:border-[var(--atlas-border-strong)]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-extrabold text-[var(--atlas-ink)] marker:content-none">
                {item.question}
                <ChevronDown className="size-4 shrink-0 text-[var(--atlas-muted)] transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="border-t border-[var(--atlas-border)] px-5 py-4 text-sm leading-6 text-[var(--atlas-muted)]">{item.answer}</p>
            </details>
          ))}
        </div>
        <div className="mt-7 border-l-4 border-[var(--atlas-signal)] pl-4">
          <p className="text-sm font-extrabold text-[var(--atlas-ink)]">Still deciding where to begin?</p>
          <p className="mt-1 text-sm leading-6 text-[var(--atlas-muted)]">Start with the map, read the supporting sources, or <Link href="/contact" className="font-bold text-[var(--atlas-ink)] underline decoration-[var(--atlas-signal)] decoration-2 underline-offset-2">contact Andrew</Link> with a question.</p>
        </div>
      </section>
    </PublicPageShell>
  );
}
