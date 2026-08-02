"use client";

import { Boxes } from "lucide-react";
import { useId, useState } from "react";

export function LandingFaq({ items }: { items: ReadonlyArray<readonly [string, string]> }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const idPrefix = useId();

  return (
    <div className="mt-9 max-w-5xl divide-y divide-[var(--atlas-border)] border-y border-[var(--atlas-border)]">
      {items.map(([question, answer], index) => {
        const panelId = `${idPrefix}-${index}`;
        const expanded = Boolean(open[index]);
        return (
          <div key={question} className="py-5">
            <button
              type="button"
              className="flex min-h-11 w-full items-center justify-between gap-5 text-left text-lg font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-evidence)] focus-visible:ring-offset-4"
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => setOpen((current) => ({ ...current, [index]: !current[index] }))}
            >
              <span>{question}</span>
              <Boxes className={`size-4 shrink-0 text-[var(--atlas-evidence)] transition-transform ${expanded ? "rotate-45" : ""}`} aria-hidden="true" />
            </button>
            <div id={panelId} hidden={!expanded} className="max-w-3xl pb-2 pr-10 pt-3 text-base leading-7 text-[var(--atlas-muted)]">{answer}</div>
          </div>
        );
      })}
    </div>
  );
}
