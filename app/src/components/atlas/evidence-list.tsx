import { ExternalSourceLink } from "@/components/atlas/internal-link";
import type { AtlasCitation } from "@/types/atlas";

export function EvidenceList({ citations }: { citations: AtlasCitation[] }) {
  const unique = Array.from(new Map(citations.map((citation) => [citation.sourceUrl, citation])).values());

  return (
    <ul className="divide-y divide-[var(--atlas-border)]">
      {unique.map((citation) => (
        <li key={citation.id} className="py-4 first:pt-0 last:pb-0">
          <ExternalSourceLink href={citation.sourceUrl} className="min-h-11 items-start text-sm font-semibold">{citation.sourceTitle}</ExternalSourceLink>
          <p className="mt-1 text-xs text-[var(--atlas-muted)]">{citation.publisher} · {citation.sourceType.replaceAll("_", " ")}</p>
          <p className="mt-2 border-l-2 border-[var(--atlas-primary-border)] pl-3 text-xs leading-5 text-[var(--atlas-ink-soft)]">{citation.excerpt}</p>
        </li>
      ))}
    </ul>
  );
}
