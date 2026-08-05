import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, CheckCircle2, ChevronDown, Compass, FileSearch, Handshake, Lightbulb, Map, PlayCircle } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { PublicPageShell } from "@/components/atlas/public-page-shell";
import { absoluteUrl } from "@/lib/site";
import { socialMetadata } from "@/lib/seo/social";

export const metadata: Metadata = {
  title: "How True North Map Works",
  description: "See how True North Map connects Canadian organizations and technologies to released public needs using inspectable sources, human review, and visible limits.",
  alternates: { canonical: "/how-it-works" },
  ...socialMetadata({ title: "How True North Map Works", description: "Explore Canadian capability, check the public evidence, follow released needs, and see where technology may help.", path: "/how-it-works", eyebrow: "From discovery to conversation" })
};

const steps = [
  { number: "1", title: "Start with a question", detail: "Describe a mission, project, capability gap, place, or released public need.", action: "Describe a need", href: "/map?start=need#ask-true-north", icon: Map },
  { number: "2", title: "Find relevant capability", detail: "See published organizations and technologies connected to the question.", action: "Browse organizations", href: "/organizations", icon: FileSearch },
  { number: "3", title: "Inspect the public record", detail: "Open the sources, assessment, and review date behind each record.", action: "Review public needs", href: "/demand", icon: Compass },
  { number: "4", title: "Compare and save", detail: "Add useful organizations, capabilities, and notes to a private Working List.", action: "Build a Working List", href: "/collections", icon: Lightbulb },
  { number: "5", title: "Start the conversation", detail: "Export a brief, suggest a correction, contribute evidence, or request an introduction.", action: "Improve the record", href: "/submit", icon: Handshake }
] as const;

const frequentlyAskedQuestions = [
  {
    question: "What is True North Map?",
    answer: "True North Map is an independent, evidence-led discovery platform for Canadian defence and dual-use organizations, technologies, and released public needs."
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
      description="Start with a need, mission, place, or released public need. Follow the records, evidence, and assessments into a Working List or next conversation."
      backHref="/"
      backLabel="Home"
      actions={<Link href="/map?start=need#ask-true-north" className="atlas-primary-button h-11 px-5 text-sm">Describe a need <ArrowRight className="size-4" /></Link>}
    >
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "WebPage", name: "How True North Map Works", description: metadata.description, url: absoluteUrl("/how-it-works") },
        { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "True North Map", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "How It Works", item: absoluteUrl("/how-it-works") }] },
        { "@context": "https://schema.org", "@type": "VideoObject", name: "See True North Map in 30 seconds", description: "A short walkthrough of how to explore Canada’s defence and dual-use ecosystem with True North Map.", thumbnailUrl: absoluteUrl("/imagery/home-maritime-evidence.webp"), uploadDate: "2026-07-26", duration: "PT30S", contentUrl: absoluteUrl("/video/true-north-map-launch.mp4") },
        { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: frequentlyAskedQuestions.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) }
      ]} />

      <ol className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5" aria-label="How True North Map works">
        {steps.map((step, index) => (
          <li key={step.number} className="relative flex min-h-60 flex-col rounded-[14px] border border-[var(--atlas-border)] bg-white p-5 shadow-[0_1px_2px_rgba(36,40,39,0.035)] 2xl:min-h-64">
            <div className="flex items-center justify-between gap-3">
              <span className="flex size-10 items-center justify-center rounded-[9px] bg-[var(--atlas-signal)] text-sm font-extrabold text-[var(--atlas-ink)]">{step.number}</span>
              <step.icon className="size-5 text-[var(--atlas-primary)]" aria-hidden="true" />
            </div>
            <h2 className="mt-6 text-xl font-extrabold leading-tight tracking-[-0.035em] text-[var(--atlas-ink)]">{step.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--atlas-muted)]">{step.detail}</p>
            <Link href={step.href} className="mt-auto inline-flex items-center gap-1.5 pt-5 text-xs font-bold text-[var(--atlas-primary)] no-underline hover:underline">{step.action} <ArrowRight className="size-3.5" /></Link>
            {index < steps.length - 1 ? <ArrowDown className="absolute -right-[18px] top-8 z-10 hidden size-6 -rotate-90 rounded-full border border-[var(--atlas-border)] bg-white p-1 text-[var(--atlas-primary)] 2xl:block" aria-hidden="true" /> : null}
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

      <section className="mt-12 grid gap-7 border-y border-[var(--atlas-border)] py-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-12" aria-labelledby="launch-video-title">
        <div>
          <p className="atlas-eyebrow">A 30-second orientation</p>
          <h2 id="launch-video-title" className="mt-3 text-2xl font-extrabold tracking-[-0.04em] text-[var(--atlas-ink)] sm:text-3xl">See how the map moves from a question to useful evidence.</h2>
          <p className="mt-4 text-sm leading-6 text-[var(--atlas-muted)]">Watch the short walkthrough, then explore the map with a capability, region, organization, or public need in mind.</p>
          <Link href="/map" className="atlas-signal-button mt-6 h-11 gap-2 px-5 text-sm">Explore the map <ArrowRight className="size-4" /></Link>
        </div>
        <div className="overflow-hidden rounded-[14px] border border-[var(--atlas-border-strong)] bg-[var(--atlas-ink)] shadow-[var(--atlas-shadow-soft)]">
          <video
            controls
            playsInline
            preload="metadata"
            poster="/imagery/home-maritime-evidence.webp"
            className="aspect-video w-full bg-[var(--atlas-ink)] object-cover"
            aria-label="Thirty-second walkthrough of True North Map"
          >
            <source src="/video/true-north-map-launch.mp4" type="video/mp4" />
            <p>Your browser cannot play this video. <a href="/video/true-north-map-launch.mp4">Open the True North Map walkthrough</a>.</p>
          </video>
          <div className="flex items-center gap-3 border-t-2 border-[var(--atlas-signal)] bg-white px-4 py-3">
            <PlayCircle className="size-4 text-[var(--atlas-ink)]" aria-hidden="true" />
            <p className="text-xs font-bold text-[var(--atlas-ink)]">True North Map product walkthrough · 30 seconds</p>
          </div>
        </div>
      </section>

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
