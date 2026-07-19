"use client";

import Link from "next/link";
import { Bell, MessageSquareText } from "lucide-react";
import { openBetaFeedback, openBetaUpdates } from "@/lib/product-insights/client";
import { AnalyticsPreferencesButton } from "@/components/atlas/public-beta-insights";

export function PublicAtlasFooter({ generatedLabel }: { generatedLabel?: string }) {
  return (
    <footer className="mt-10 border-t border-[var(--atlas-border)] py-7 text-xs text-[var(--atlas-muted)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-semibold text-[var(--atlas-ink-soft)]">Independent project by Andrew Davies</p>
          <p className="mt-1">{generatedLabel ?? "Public Beta with reviewed, source-backed records and transparent coverage gaps."}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button type="button" onClick={openBetaFeedback} className="inline-flex items-center gap-1.5 font-semibold text-[var(--atlas-primary)] hover:underline"><MessageSquareText className="size-3.5" />Give feedback</button>
          <button type="button" onClick={openBetaUpdates} className="inline-flex items-center gap-1.5 font-semibold text-[var(--atlas-primary)] hover:underline"><Bell className="size-3.5" />Get updates</button>
          <AnalyticsPreferencesButton className="font-semibold text-[var(--atlas-muted)] hover:text-[var(--atlas-primary)] hover:underline" />
          <Link href="/privacy" className="font-semibold text-[var(--atlas-muted)] no-underline hover:text-[var(--atlas-primary)] hover:underline">Privacy</Link>
          <Link href="/methodology" className="font-semibold text-[var(--atlas-muted)] no-underline hover:text-[var(--atlas-primary)] hover:underline">Methodology</Link>
          <Link href="/contact" className="font-semibold text-[var(--atlas-muted)] no-underline hover:text-[var(--atlas-primary)] hover:underline">Contact</Link>
          <Link href="/terms" className="font-semibold text-[var(--atlas-muted)] no-underline hover:text-[var(--atlas-primary)] hover:underline">Terms</Link>
          <Link href="/demand" className="font-semibold text-[var(--atlas-muted)] no-underline hover:text-[var(--atlas-primary)] hover:underline">Public demand signals</Link>
        </div>
      </div>
    </footer>
  );
}
