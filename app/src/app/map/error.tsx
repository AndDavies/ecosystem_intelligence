"use client";

import { RotateCcw } from "lucide-react";

export default function MapError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="atlas-frame py-8">
      <section className="rounded-[14px] border border-[var(--atlas-amber)]/35 bg-[var(--atlas-amber-soft)] p-5" role="alert">
        <p className="text-sm font-extrabold text-[var(--atlas-ink)]">The current map results could not be loaded.</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--atlas-ink-soft)]">Your map URL is unchanged. Try again to reload the same published map state.</p>
        <button type="button" onClick={reset} className="atlas-secondary-button mt-4 h-10 gap-2 px-4 text-sm">
          <RotateCcw className="size-4" /> Try again
        </button>
      </section>
    </div>
  );
}
