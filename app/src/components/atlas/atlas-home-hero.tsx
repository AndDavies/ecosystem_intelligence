import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Suspense } from "react";
import { AtlasHomeCoverage } from "@/components/atlas/atlas-home-coverage";

function CoverageFallback() {
  return (
    <span className="flex min-h-[38px] items-center gap-4 border-l-4 border-[var(--atlas-signal)] pl-4" aria-live="polite">
      <span className="h-7 w-14 animate-pulse bg-[var(--atlas-border)]" aria-hidden="true" />
      <span className="text-xs font-medium leading-4 text-[var(--atlas-muted)]">Loading current<br />national coverage</span>
    </span>
  );
}

export function AtlasHomeHero() {
  return (
    <div className="atlas-frame pb-2 pt-6 sm:pb-2 sm:pt-8">
      <section aria-labelledby="home-hero-heading" className="grid overflow-hidden bg-white lg:h-[480px] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="flex flex-col justify-center px-5 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-8 xl:px-12">
          <div className="flex flex-wrap items-center gap-2">
            <span className="atlas-eyebrow">Evidence-led ecosystem discovery</span>
            <span className="rounded-full border border-[var(--atlas-border)] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--atlas-muted)]">Public Beta</span>
          </div>
          <h1 id="home-hero-heading" className="mt-4 max-w-[590px] text-[38px] font-extrabold leading-[0.96] tracking-[-0.06em] text-[var(--atlas-ink)] sm:text-[48px] lg:text-[38px] xl:text-[48px]"><span className="atlas-headline-highlight">Canada is building</span><br /> more than<br /> most people can see.</h1>
          <p className="mt-5 max-w-[550px] text-sm leading-6 text-[var(--atlas-muted)] sm:text-[15px] sm:leading-6">Explore the organizations, capabilities and public needs shaping Canada’s defence and dual-use ecosystem. Follow the evidence. Find the fit. Start the right conversation.</p>

          <div className="mt-5">
            <Suspense fallback={<CoverageFallback />}>
              <AtlasHomeCoverage />
            </Suspense>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <a href="#ask-true-north" className="atlas-signal-button h-11 gap-2 px-5 text-sm">Explore the ecosystem <ArrowRight className="size-4" /></a>
            <Link href="/demand" className="atlas-primary-button h-11 px-5 text-sm">Browse public needs</Link>
          </div>
        </div>

        <figure className="grid min-h-[340px] grid-rows-[minmax(0,1fr)_auto] bg-[var(--atlas-ink)] sm:min-h-[420px] lg:h-[480px] lg:min-h-0">
          <div className="relative min-h-[285px]">
            <Image
              src="/imagery/home-maritime-evidence.webp"
              alt="Illustration of a Canadian naval vessel moving through Arctic waters with an evidence network connecting industry, communities and defence."
              fill
              priority
              sizes="(min-width: 1280px) 55vw, (min-width: 1024px) 45vw, 100vw"
              className="object-cover object-[center_42%]"
            />
          </div>
          <figcaption className="flex min-h-[58px] items-center gap-3 bg-white px-5 py-3 text-[var(--atlas-ink)]">
            <span className="h-0.5 w-7 shrink-0 bg-[var(--atlas-signal)]" aria-hidden="true" />
            <span>
              <strong className="block text-xs font-extrabold">Make Canadian capability visible.</strong>
              <span className="mt-0.5 block text-[10px] leading-4 text-[var(--atlas-muted)]">Evidence-led discovery across the country.</span>
            </span>
          </figcaption>
        </figure>
      </section>
    </div>
  );
}
