import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Suspense } from "react";
import { AtlasHomeCoverage } from "@/components/atlas/atlas-home-coverage";

function CoverageFallback() {
  return (
    <span className="flex min-h-[30px] items-center gap-4 text-white" aria-live="polite">
      <span className="h-7 w-14 animate-pulse bg-white/15" aria-hidden="true" />
      <span className="text-xs font-medium leading-4 text-white/70">Loading current<br />national coverage</span>
    </span>
  );
}

export function AtlasHomeHero() {
  return (
    <section aria-labelledby="home-hero-heading" className="grid overflow-hidden bg-[var(--atlas-ink)] lg:min-h-[690px] lg:grid-cols-1 lg:grid-rows-1">
      <div className="relative col-start-1 row-start-2 min-h-[285px] bg-[var(--atlas-ink)] sm:min-h-[390px] lg:row-start-1 lg:min-h-[690px]">
        <Image
          src="/imagery/home-maritime-evidence.webp"
          alt="Illustration of a Canadian naval vessel moving through Arctic waters with an evidence network connecting industry, communities and defence."
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_35%]"
        />
      </div>

      <div className="atlas-frame relative z-10 col-start-1 row-start-1 flex lg:min-h-[690px] lg:items-start lg:pt-[70px]">
        <div className="w-full bg-[var(--atlas-ink)] px-5 py-7 text-white sm:px-8 sm:py-8 lg:w-[500px] lg:px-8 lg:py-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="atlas-eyebrow !text-white">Evidence-led ecosystem discovery</span>
            <span className="rounded-full border border-white/25 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-white/70">Public Beta</span>
          </div>
          <h1 id="home-hero-heading" className="mt-4 max-w-[430px] text-[38px] font-extrabold leading-[0.94] tracking-[-0.06em] text-white sm:text-[46px] lg:text-[45px] lg:tracking-[-0.065em]"><span className="atlas-headline-highlight">Canada is building</span><br /> more than<br /> most people can see.</h1>
          <p className="mt-5 max-w-[420px] text-sm leading-6 text-white/80 sm:text-[15px] sm:leading-6">Explore the organizations, capabilities and public needs shaping Canada’s defence and dual-use ecosystem. Follow the evidence. Find the fit. Start the right conversation.</p>

          <div className="mt-4 border-t border-white/25 pt-4">
            <Suspense fallback={<CoverageFallback />}>
              <AtlasHomeCoverage inverted />
            </Suspense>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <a href="#ask-true-north" className="atlas-signal-button h-11 gap-2 px-5 text-sm">Explore the ecosystem <ArrowRight className="size-4" /></a>
            <Link href="/demand" className="inline-flex h-11 items-center justify-center rounded-[12px] border border-white/55 px-5 text-sm font-semibold text-white no-underline transition-colors hover:border-white hover:bg-white hover:text-[var(--atlas-ink)] hover:no-underline">Browse public needs</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
