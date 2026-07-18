import { ExternalLink } from "lucide-react";
import type { AtlasCitation } from "@/types/atlas";

export function EvidenceList({ citations }: { citations: AtlasCitation[] }) {
  const unique = Array.from(new Map(citations.map((citation) => [citation.sourceUrl, citation])).values());

  return (
    <ul className="divide-y divide-[var(--atlas-border)]">
      {unique.map((citation) => (
        <li key={citation.id} className="py-4 first:pt-0 last:pb-0">
          <a href={citation.sourceUrl} target="_blank" rel="noreferrer" className="group inline-flex items-start gap-1.5 text-sm font-semibold text-[var(--atlas-primary)] no-underline hover:underline">
            <span>{citation.sourceTitle}</span>
            <ExternalLink className="mt-0.5 size-3.5 shrink-0" />
          </a>
          <p className="mt-1 text-xs text-[var(--atlas-muted)]">{citation.publisher} · {citation.sourceType.replaceAll("_", " ")}</p>
          <p className="mt-2 border-l-2 border-[var(--atlas-primary-border)] pl-3 text-xs leading-5 text-[var(--atlas-ink-soft)]">{citation.excerpt}</p>
        </li>
      ))}
    </ul>
  );
}
