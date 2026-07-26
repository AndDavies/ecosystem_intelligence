import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, CheckCircle2, Compass, FileSearch, Handshake, Lightbulb, Map } from "lucide-react";
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
  { number: "1", title: "Explore the map", detail: "Find companies, organizations, technologies, and programs across Canada.", action: "Explore the map", href: "/", icon: Map },
  { number: "2", title: "Check the public evidence", detail: "Open the sources supporting each profile and technology.", action: "Browse organizations", href: "/organizations", icon: FileSearch },
  { number: "3", title: "Follow released public needs", detail: "Read public needs issued by governments, armed forces, programs, and allied organizations.", action: "See public needs", href: "/demand", icon: Compass },
  { number: "4", title: "See where technology may help", detail: "Review source-linked assessments of possible relevance and visible limits.", action: "Learn about the review", href: "/methodology", icon: Lightbulb },
  { number: "5", title: "Start a better conversation", detail: "Save a Working List, suggest a correction, claim a profile, or request a connection.", action: "Contribute a profile", href: "/submit", icon: Handshake }
] as const;

export default function HowItWorksPage() {
  return (
    <PublicPageShell
      eyebrow="Evidence-led ecosystem discovery"
      title="See what Canada can build, why it matters, and what to do next."
      description="True North Map is an independent, evidence-led discovery platform that helps people find Canadian defence and dual-use capability, understand where it may fit, and move into better-informed conversations."
      actions={<Link href="/" className="atlas-primary-button h-11 px-5 text-sm">Explore the map <ArrowRight className="size-4" /></Link>}
    >
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "WebPage", name: "How True North Map Works", description: metadata.description, url: absoluteUrl("/how-it-works") },
        { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "True North Map", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "How It Works", item: absoluteUrl("/how-it-works") }] }
      ]} />

      <ol className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5" aria-label="How True North Map works">
        {steps.map((step, index) => (
          <li key={step.number} className="relative flex min-h-60 flex-col rounded-3xl border border-[var(--atlas-border)] bg-white p-5 shadow-[var(--atlas-shadow-soft)] 2xl:min-h-64">
            <div className="flex items-center justify-between gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-[var(--atlas-signal)] text-sm font-extrabold text-[var(--atlas-ink)]">{step.number}</span>
              <step.icon className="size-5 text-[var(--atlas-primary)]" aria-hidden="true" />
            </div>
            <h2 className="mt-6 text-xl font-extrabold leading-tight tracking-[-0.035em] text-[var(--atlas-ink)]">{step.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--atlas-muted)]">{step.detail}</p>
            <Link href={step.href} className="mt-auto inline-flex items-center gap-1.5 pt-5 text-xs font-bold text-[var(--atlas-primary)] no-underline hover:underline">{step.action} <ArrowRight className="size-3.5" /></Link>
            {index < steps.length - 1 ? <ArrowDown className="absolute -right-[18px] top-8 z-10 hidden size-6 -rotate-90 rounded-full border border-[var(--atlas-border)] bg-white p-1 text-[var(--atlas-primary)] 2xl:block" aria-hidden="true" /> : null}
          </li>
        ))}
      </ol>

      <section className="mt-6 rounded-3xl bg-[var(--atlas-ink)] px-6 py-7 text-white sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[var(--atlas-signal)]"><CheckCircle2 className="size-5" /></span>
          <div>
            <h2 className="text-lg font-extrabold">Know where the facts end and the assessment begins.</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">Sources create the public record. People review the interpretation. AI helps people explore, but it does not publish facts or make procurement decisions.</p>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
