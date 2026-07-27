import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Suspense } from "react";
import { AtlasHomeCoverage } from "@/components/atlas/atlas-home-coverage";

function CoverageFallback() {
  return (
    <span className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--atlas-muted)]" aria-live="polite">
      <span className="size-1.5 animate-pulse rounded-full bg-[var(--atlas-evidence)]" aria-hidden="true" />
      Loading current national coverage
    </span>
  );
}

export function AtlasHomeHero() {
  return (
    <div className="atlas-frame pt-6 sm:pt-10">
      <section className="grid gap-6 border-b border-[var(--atlas-border)] pb-6 sm:pb-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.72fr)] lg:items-stretch">
        <div className="flex flex-col justify-center py-2 lg:py-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="atlas-eyebrow">Evidence-led ecosystem discovery</span>
            <span className="rounded-full border border-[var(--atlas-border)] bg-white px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--atlas-muted)]">Public Beta</span>
          </div>
          <h1 className="mt-4 max-w-4xl text-[38px] font-extrabold leading-[0.94] tracking-[-0.064em] text-[var(--atlas-ink)] sm:text-[54px] lg:text-[62px]"><span className="atlas-headline-highlight">Canada is building</span> more than most people can see.</h1>
          <p className="mt-5 max-w-3xl text-sm leading-6 text-[var(--atlas-muted)] sm:text-base sm:leading-7">Explore the organizations, capabilities and public needs shaping Canada’s defence and dual-use ecosystem. Follow the evidence. Find the fit. Start the right conversation.</p>
          <div className="mt-5 min-h-5">
            <Suspense fallback={<CoverageFallback />}>
              <AtlasHomeCoverage />
            </Suspense>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#ask-true-north" className="atlas-signal-button h-11 gap-2 px-5 text-sm">Explore the ecosystem <ArrowRight className="size-4" /></a>
            <Link href="/demand" className="atlas-primary-button h-11 px-5 text-sm">Browse public needs</Link>
          </div>
        </div>
        <div className="relative min-h-[260px] overflow-hidden rounded-2xl border border-[var(--atlas-border-strong)] bg-[var(--atlas-ink)] shadow-[var(--atlas-shadow-soft)] sm:min-h-[320px] lg:min-h-[360px]">
          <Image src="/imagery/home-maritime-evidence.webp" alt="Illustration of a Canadian naval vessel moving through Arctic waters with an evidence network connecting industry, communities and defence." fill priority sizes="(min-width: 1024px) 42vw, 100vw" className="object-cover" />
          <div className="absolute inset-x-0 bottom-0 border-t-2 border-[var(--atlas-signal)] bg-[rgba(36,40,39,0.9)] px-5 py-4 text-white backdrop-blur-sm">
            <p className="text-sm font-extrabold">Make Canadian capability visible.</p>
            <p className="mt-1 text-[11px] leading-4 text-white/70">Evidence-led discovery across the country.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
