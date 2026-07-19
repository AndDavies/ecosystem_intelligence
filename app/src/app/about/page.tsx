import Link from "next/link";
import { ArrowRight, Compass, Network, ShieldCheck } from "lucide-react";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";

export const metadata = {
  title: "About",
  description: "Why Andrew Davies created True North Map to make Canadian defence and dual-use capability easier to discover and connect."
};

export default function AboutPage() {
  return (
    <PublicPageShell eyebrow="Independent project by Andrew Davies" title="Canada’s capability is stronger than it is visible." description="True North Map is a free, evidence-backed discovery and connection layer for Canada’s defence and dual-use ecosystem.">
      <div className="grid gap-5 lg:grid-cols-3">
        <PublicCard title="The catalyst" eyebrow="Why this exists"><Compass className="mb-4 size-6 text-[var(--atlas-primary)]" /><p className="text-sm leading-6 text-[var(--atlas-muted)]">Work across defence, marine technology, and innovation repeatedly revealed strong Canadian capabilities hidden across fragmented regional, program, and industry networks. The problem was rarely an absence of capability. It was finding it, understanding it, and reaching the right people.</p></PublicCard>
        <PublicCard title="See the country in one view" eyebrow="What changes"><Network className="mb-4 size-6 text-[var(--atlas-primary)]" /><p className="text-sm leading-6 text-[var(--atlas-muted)]">True North Map brings reviewed organizations, technology, locations, public signals, and sources together. You can find a relevant team faster, build a Working List, improve a profile, or request a thoughtful introduction.</p></PublicCard>
        <PublicCard title="The trust boundary" eyebrow="What it is not"><ShieldCheck className="mb-4 size-6 text-[var(--atlas-primary)]" /><p className="text-sm leading-6 text-[var(--atlas-muted)]">This is not an official government, military, procurement, or industry-association directory. Public-source assessments do not indicate eligibility, endorsement, classified demand, or a formal opportunity.</p></PublicCard>
      </div>
      <section className="mt-6 rounded-xl bg-[var(--atlas-ink)] p-6 text-white sm:p-8"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--atlas-primary-soft)]">The ambition</p><h2 className="mt-2 max-w-3xl text-2xl font-bold tracking-[-0.025em]">A stronger sovereign industry starts with shared visibility.</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-white/75">The beta is deliberately incomplete and transparent about its gaps. Each reviewed addition makes Canadian expertise easier to find, compare, support, and connect.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/" className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--atlas-primary-soft)] px-4 text-sm font-semibold text-[var(--atlas-ink)] no-underline">Explore the ecosystem map <ArrowRight className="size-4" /></Link><Link href="/methodology" className="inline-flex h-10 items-center rounded-md border border-white/25 px-4 text-sm font-semibold text-white no-underline">See how profiles are reviewed</Link></div></section>
    </PublicPageShell>
  );
}
