"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

export function DirectoryFilters({ children, activeCount }: { children: ReactNode; activeCount: number }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { try { setOpen(sessionStorage.getItem("tnm-directory-filters") === "open"); } catch { /* Optional preference. */ } }, []);
  return <aside className="atlas-directory-filter-panel">
    <button type="button" className="atlas-secondary-button min-h-11 w-full justify-between gap-3 px-4 lg:hidden" aria-expanded={open} aria-controls="directory-secondary-filters" onClick={() => {
      setOpen(!open); try { sessionStorage.setItem("tnm-directory-filters", open ? "closed" : "open"); } catch { /* Optional preference. */ }
    }}><SlidersHorizontal className="size-4" aria-hidden="true" /><span>Filters{activeCount ? ` · ${activeCount} active` : ""}</span><ChevronDown className={`size-4 ${open ? "rotate-180" : ""}`} aria-hidden="true" /></button>
    <div id="directory-secondary-filters" data-open={open} className="atlas-directory-filters mt-4 lg:mt-0">{children}</div>
  </aside>;
}

export function DirectoryResultStatus({ children, stateKey, focus }: { children: ReactNode; stateKey: string; focus: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focus) { ref.current?.focus({ preventScroll: true }); ref.current?.scrollIntoView({ block: "nearest" }); }
  }, [stateKey, focus]);
  return <div ref={ref} id="directory-results-status" tabIndex={-1} role="status" aria-live="polite" aria-atomic="true" className="mt-4 scroll-mt-24 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--atlas-primary)]">{children}</div>;
}
