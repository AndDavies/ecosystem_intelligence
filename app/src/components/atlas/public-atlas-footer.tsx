"use client";

import Link from "next/link";
import { Bell, MessageSquareText } from "lucide-react";
import { openBetaFeedback, openBetaUpdates } from "@/lib/product-insights/client";
import { AnalyticsPreferencesButton } from "@/components/atlas/public-beta-insights";

export function PublicAtlasFooter({ generatedLabel }: { generatedLabel?: string }) {
  return (
    <footer className="mt-10 rounded-[22px] bg-[var(--atlas-ink)] px-5 py-6 text-xs text-white/60 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-bold text-white">Independent project by Andrew Davies</p>
          <p className="mt-1">{generatedLabel ?? "Public Beta with reviewed, source-backed records and transparent coverage gaps."}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button type="button" onClick={openBetaFeedback} className="inline-flex items-center gap-1.5 font-semibold text-white hover:text-[var(--atlas-signal)] hover:underline"><MessageSquareText className="size-3.5" />Give feedback</button>
          <button type="button" onClick={openBetaUpdates} className="inline-flex items-center gap-1.5 font-semibold text-white hover:text-[var(--atlas-signal)] hover:underline"><Bell className="size-3.5" />Get updates</button>
          <AnalyticsPreferencesButton className="font-semibold text-white/70 hover:text-[var(--atlas-signal)] hover:underline" />
          <Link href="/privacy" className="font-semibold text-white/70 no-underline hover:text-[var(--atlas-signal)] hover:underline">Privacy</Link>
          <Link href="/methodology" className="font-semibold text-white/70 no-underline hover:text-[var(--atlas-signal)] hover:underline">Methodology</Link>
          <Link href="/contact" className="font-semibold text-white/70 no-underline hover:text-[var(--atlas-signal)] hover:underline">Contact</Link>
          <Link href="/terms" className="font-semibold text-white/70 no-underline hover:text-[var(--atlas-signal)] hover:underline">Terms</Link>
          <Link href="/briefs" className="font-semibold text-white/70 no-underline hover:text-[var(--atlas-signal)] hover:underline">Canadian Defence Briefs</Link>
          <Link href="/demand" className="font-semibold text-white/70 no-underline hover:text-[var(--atlas-signal)] hover:underline">Public demand signals</Link>
        </div>
      </div>
    </footer>
  );
}
