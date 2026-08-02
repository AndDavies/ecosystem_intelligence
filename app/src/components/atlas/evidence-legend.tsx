import { CircleHelp, FileCheck2, SearchCheck, ShieldCheck, TimerReset } from "lucide-react";
import { publicLanguage } from "@/lib/atlas/presentation";
import { cn } from "@/lib/utils";

const states = [
  { label: publicLanguage.sourceFact, detail: "A released source supports the statement.", icon: FileCheck2, tone: "evidence" },
  { label: publicLanguage.assessment, detail: "A person reviewed where the evidence may point.", icon: SearchCheck, tone: "signal" },
  { label: "Evidence strength", detail: "The label reflects the quality and depth of public support.", icon: ShieldCheck, tone: "evidence" },
  { label: "Last reviewed", detail: "The date shows when the record was checked most recently.", icon: TimerReset, tone: "neutral" },
  { label: publicLanguage.coverageGap, detail: "Missing information stays visible instead of being invented.", icon: CircleHelp, tone: "warning" }
] as const;

export function EvidenceLegend({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <section className={cn("border-y border-[var(--atlas-border)] bg-white px-4 sm:px-5", compact ? "py-4" : "py-5", className)} aria-labelledby="evidence-legend-title">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="shrink-0">
          <p className="atlas-eyebrow">How to read the record</p>
          <h2 id="evidence-legend-title" className="mt-1 text-base font-extrabold tracking-[-0.025em] text-[var(--atlas-ink)]">Know what is sourced, assessed, current or still unknown.</h2>
        </div>
        <ul className="grid flex-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5" aria-label="Evidence states">
          {states.map((state) => (
            <li key={state.label} className="flex items-start gap-2.5">
              <span className={cn(
                "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
                state.tone === "evidence" && "bg-[var(--atlas-evidence-soft)] text-[var(--atlas-evidence)]",
                state.tone === "signal" && "bg-[var(--atlas-signal-soft)] text-[var(--atlas-ink)]",
                state.tone === "warning" && "bg-[var(--atlas-amber-soft)] text-[var(--atlas-amber)]",
                state.tone === "neutral" && "bg-[var(--atlas-surface-muted)] text-[var(--atlas-muted)]"
              )}><state.icon className="size-3.5" aria-hidden="true" /></span>
              <span><strong className="block text-[13px] leading-5 text-[var(--atlas-ink)]">{state.label}</strong><span className="mt-0.5 block text-[13px] leading-5 text-[var(--atlas-muted)]">{state.detail}</span></span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function EvidenceLegendDisclosure() {
  return (
    <details className="group relative">
      <summary className="inline-flex min-h-9 cursor-pointer list-none items-center gap-2 rounded-full border border-[var(--atlas-border)] bg-white px-3 text-xs font-bold text-[var(--atlas-ink-soft)] hover:border-[var(--atlas-ink)] hover:text-[var(--atlas-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-evidence)] [&::-webkit-details-marker]:hidden">
        <CircleHelp className="size-4 text-[var(--atlas-evidence)]" aria-hidden="true" />
        How results are assessed
      </summary>
      <div className="absolute right-0 top-11 z-[1200] w-[min(340px,calc(100vw-3rem))] rounded-[12px] border border-[var(--atlas-border)] bg-white p-4 shadow-[var(--atlas-shadow-float)]">
        <p className="text-sm font-extrabold text-[var(--atlas-ink)]">Read the evidence before the conclusion.</p>
        <ul className="mt-3 space-y-3" aria-label="Evidence states">
          {states.map((state) => (
            <li key={state.label} className="flex items-start gap-2.5">
              <span className={cn(
                "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
                state.tone === "evidence" && "bg-[var(--atlas-evidence-soft)] text-[var(--atlas-evidence)]",
                state.tone === "signal" && "bg-[var(--atlas-signal-soft)] text-[var(--atlas-ink)]",
                state.tone === "warning" && "bg-[var(--atlas-amber-soft)] text-[var(--atlas-amber)]",
                state.tone === "neutral" && "bg-[var(--atlas-surface-muted)] text-[var(--atlas-muted)]"
              )}><state.icon className="size-3.5" aria-hidden="true" /></span>
              <span><strong className="block text-xs leading-5 text-[var(--atlas-ink)]">{state.label}</strong><span className="block text-xs leading-5 text-[var(--atlas-muted)]">{state.detail}</span></span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
