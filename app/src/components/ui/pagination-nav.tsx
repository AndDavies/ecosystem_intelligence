import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PaginationNav({
  path,
  page,
  totalPages,
  start,
  end,
  total,
  itemLabel
}: {
  path: string;
  page: number;
  totalPages: number;
  start: number;
  end: number;
  total: number;
  itemLabel: string;
}) {
  if (totalPages <= 1) return null;
  const href = (targetPage: number) => targetPage === 1 ? path : `${path}?page=${targetPage}`;

  return (
    <nav className="mt-7 flex flex-col gap-3 rounded-[18px] border border-[var(--atlas-border)] bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between" aria-label={`${itemLabel} pages`}>
      <p className="text-xs text-[var(--atlas-muted)]">Showing {start}–{end} of {total} {itemLabel}</p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} rel="prev" className="atlas-secondary-button h-9 gap-1.5 px-3 text-xs"><ChevronLeft className="size-3.5" />Previous</Link>
        ) : <span className="atlas-secondary-button h-9 cursor-not-allowed gap-1.5 px-3 text-xs opacity-45"><ChevronLeft className="size-3.5" />Previous</span>}
        <span className="px-2 text-xs font-semibold text-[var(--atlas-ink-soft)]">Page {page} of {totalPages}</span>
        {page < totalPages ? (
          <Link href={href(page + 1)} rel="next" className="atlas-secondary-button h-9 gap-1.5 px-3 text-xs">Next<ChevronRight className="size-3.5" /></Link>
        ) : <span className="atlas-secondary-button h-9 cursor-not-allowed gap-1.5 px-3 text-xs opacity-45">Next<ChevronRight className="size-3.5" /></span>}
      </div>
    </nav>
  );
}
