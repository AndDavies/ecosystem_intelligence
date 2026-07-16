"use client";

import Link from "next/link";
import { MessageSquareText, Waves } from "lucide-react";
import { openPilotFeedback, openPilotUpdates } from "@/lib/pilot/client";

export function PublicAtlasFooter({ generatedLabel }: { generatedLabel?: string }) {
  return (
    <footer className="mt-8 border-t border-[#c9dce0] py-6 text-xs text-[#667085]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-semibold text-[#344054]">Invitation-only design-partner preview</p>
          <p className="mt-1">{generatedLabel ?? "Limited verified coverage for workflow testing. Not a complete ecosystem directory or COVE endorsement."}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button type="button" onClick={openPilotFeedback} className="inline-flex items-center gap-1.5 font-semibold text-[#007f98] hover:underline"><MessageSquareText className="size-3.5" />Give feedback</button>
          <button type="button" onClick={openPilotUpdates} className="inline-flex items-center gap-1.5 font-semibold text-[#007f98] hover:underline"><Waves className="size-3.5" />Get updates</button>
          <Link href="/privacy" className="font-semibold text-[#475467] no-underline hover:text-[#007f98] hover:underline">Privacy</Link>
          <Link href="/demand" className="font-semibold text-[#475467] no-underline hover:text-[#007f98] hover:underline">Demand overlay preview</Link>
        </div>
      </div>
    </footer>
  );
}

