import { CircleHelp, FileCheck2, SearchCheck, ShieldCheck, TimerReset } from "lucide-react";
import { cn } from "@/lib/utils";

const states = [
  { label: "Public-source fact", detail: "A released source supports the statement.", icon: FileCheck2, tone: "evidence" },
  { label: "Our assessment", detail: "A person reviewed where the evidence may point.", icon: SearchCheck, tone: "signal" },
  { label: "Evidence strength", detail: "The label reflects the quality and depth of public support.", icon: ShieldCheck, tone: "evidence" },
  { label: "Last reviewed", detail: "The date shows when the record was checked most recently.", icon: TimerReset, tone: "neutral" },
  { label: "Not yet verified", detail: "Missing information stays visible instead of being invented.", icon: CircleHelp, tone: "warning" }
] as const;

export function EvidenceLegend({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <section className={cn("border-y border-[var(--atlas-border)] bg-white", compact ? "py-4" : "py-5", className)} aria-labelledby="evidence-legend-title">
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
              <span><strong className="block text-[11px] text-[var(--atlas-ink)]">{state.label}</strong><span className="mt-0.5 block text-[10px] leading-4 text-[var(--atlas-muted)]">{state.detail}</span></span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
