import React from "react";
import type { SignalItem } from "@/lib/atlas/signals";
import { signalSummaryParagraphs } from "@/lib/signals/presentation";

export function SignalNarrative({ text, className }: { text: string; className: string }) {
  return <div className={`${className} space-y-4`}>{signalSummaryParagraphs(text).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>;
}

export function SignalEditorialDetails({ item }: { item: SignalItem }) {
  return <>
    {item.unknowns ? <div className="mt-6 border-l-2 border-[var(--atlas-border-strong)] pl-5">
      <h3 className="font-heading text-sm font-extrabold text-[var(--atlas-ink)]">What remains open</h3>
      <SignalNarrative text={item.unknowns} className="mt-2 text-[15px] leading-7 text-[var(--atlas-muted)]" />
    </div> : null}
    {item.nextStep ? <div className="mt-6 max-w-[47rem]">
      <h3 className="font-heading text-sm font-extrabold text-[var(--atlas-ink)]">What comes next</h3>
      <SignalNarrative text={item.nextStep} className="mt-2 text-[15px] leading-7 text-[var(--atlas-ink-soft)]" />
    </div> : null}
    <details className="group mt-6 border-y border-[var(--atlas-border)]">
      <summary className="min-h-11 cursor-pointer rounded py-3 font-heading text-sm font-extrabold text-[var(--atlas-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-signal)] focus-visible:ring-offset-4">Evidence and assessment<span className="sr-only"> for {item.title}</span></summary>
      <div className="space-y-5 border-t border-[var(--atlas-border)] py-5">
        <div>
          <h3 className="font-heading text-sm font-extrabold text-[var(--atlas-ink)]">What the sources establish</h3>
          <SignalNarrative text={item.sourceFact} className="mt-2 text-[15px] leading-7 text-[var(--atlas-ink-soft)]" />
        </div>
        {item.automatedRead ? <div>
          <h3 className="font-heading text-sm font-extrabold text-[var(--atlas-ink)]">True North Map assessment</h3>
          <SignalNarrative text={item.automatedRead} className="mt-2 text-[15px] leading-7 text-[var(--atlas-ink-soft)]" />
        </div> : null}
      </div>
    </details>
  </>;
}
