import Link from "next/link";
import { ExternalLink, FileCheck2, SearchCheck } from "lucide-react";
import { alignmentTypeLabel, evidenceStrengthLabel, publicLanguage } from "@/lib/atlas/presentation";
import { cn } from "@/lib/utils";
import type { AtlasAlignmentType, AtlasCitation, AtlasConfidence } from "@/types/atlas";

/**
 * Evidence Green is reserved for verified public-source support and Warning
 * Gold for genuine low-confidence states, so the strength chip may only ever
 * be as strong as the source support behind the match.
 */
export const evidenceStrengthChipClass: Record<AtlasConfidence, string> = {
  high: "bg-[var(--atlas-evidence-soft)] text-[var(--atlas-evidence)] ring-[var(--atlas-evidence)]/25",
  moderate: "bg-white text-[var(--atlas-ink-soft)] ring-[var(--atlas-border-strong)]",
  needs_review: "bg-[var(--atlas-amber-soft)] text-[var(--atlas-amber)] ring-[var(--atlas-amber)]/30"
};

/**
 * One card for mission and public-demand alignment on organization and
 * capability profiles. Derived matches stay visibly separate from direct
 * public-source connections, while evidence strength renders as a labelled
 * chip for both.
 */
export function AlignmentMatchCard({
  href,
  title,
  summary,
  matchType,
  confidence,
  citations,
  caveat,
  className
}: {
  href: string;
  title: string;
  summary: string;
  matchType: AtlasAlignmentType;
  confidence: AtlasConfidence;
  citations: AtlasCitation[];
  caveat?: string;
  className?: string;
}) {
  const isPublicSourceAlignment = matchType === "public_source_alignment";

  return (
    <article className={cn("rounded-lg border border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)]/60 p-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5">
          <span className={`flex size-6 shrink-0 items-center justify-center rounded-[8px] ${isPublicSourceAlignment ? "bg-[var(--atlas-evidence-soft)] text-[var(--atlas-evidence)]" : "bg-[var(--atlas-signal-soft)] text-[var(--atlas-ink)]"}`}>
            {isPublicSourceAlignment ? <FileCheck2 className="size-3.5" aria-hidden="true" /> : <SearchCheck className="size-3.5" aria-hidden="true" />}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--atlas-muted)]">
            {isPublicSourceAlignment ? alignmentTypeLabel(matchType) : publicLanguage.assessment}
          </span>
        </span>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ring-1 ${evidenceStrengthChipClass[confidence]}`}>
          {evidenceStrengthLabel(confidence)} public evidence
        </span>
      </div>
      <h3 className="mt-3 text-sm font-bold tracking-[-0.01em] text-[var(--atlas-ink)]">
        <Link href={href} className="no-underline hover:text-[var(--atlas-primary)] hover:underline">
          {title}
        </Link>
      </h3>
      <p className="mt-1.5 text-xs leading-5 text-[var(--atlas-ink-soft)]">{summary}</p>
      {citations.length ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--atlas-border)] pt-3 text-[11px]">
          <span className="font-medium text-[var(--atlas-muted)]">Supporting sources</span>
          {citations.slice(0, 2).map((citation) => (
            <a
              key={citation.id}
              href={citation.sourceUrl}
              target="_blank"
              rel="noreferrer"
              data-launch-durable-source="true"
              className="inline-flex items-center gap-1 font-semibold text-[var(--atlas-primary)] no-underline hover:underline"
            >
              {citation.sourceTitle}
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          ))}
        </div>
      ) : null}
      {caveat ? <p className="mt-2.5 text-[10px] leading-4 text-[var(--atlas-muted)]">{caveat}</p> : null}
    </article>
  );
}
