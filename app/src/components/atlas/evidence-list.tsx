import { ExternalLink } from "lucide-react";
import type { AtlasCitation } from "@/types/atlas";

export function EvidenceList({ citations }: { citations: AtlasCitation[] }) {
  const unique = Array.from(new Map(citations.map((citation) => [citation.sourceUrl, citation])).values());

  return (
    <ul className="divide-y divide-[#eaecf0]">
      {unique.map((citation) => (
        <li key={citation.id} className="py-3 first:pt-0 last:pb-0">
          <a href={citation.sourceUrl} target="_blank" rel="noreferrer" className="group inline-flex items-start gap-1.5 text-sm font-semibold text-[#0756d9] no-underline hover:underline">
            <span>{citation.sourceTitle}</span>
            <ExternalLink className="mt-0.5 size-3.5 shrink-0" />
          </a>
          <p className="mt-1 text-xs text-[#667085]">{citation.publisher} · {citation.sourceType.replaceAll("_", " ")}</p>
          <p className="mt-2 text-xs leading-5 text-[#475467]">{citation.excerpt}</p>
        </li>
      ))}
    </ul>
  );
}
