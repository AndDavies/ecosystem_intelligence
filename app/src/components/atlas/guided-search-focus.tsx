"use client";

import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { LandingEntryLink } from "@/components/atlas/landing-entry-link";
import {
  guidedSearchFocusForId,
  guidedSearchFocusIds,
  guidedSearchFocuses,
  guidedSearchHref
} from "@/lib/atlas/guided-search";
import type { AtlasGuidedSearchFocus } from "@/types/atlas";

export function GuidedSearchFocus() {
  const [selected, setSelected] = useState<AtlasGuidedSearchFocus[]>(guidedSearchFocusIds);
  const [describedId, setDescribedId] = useState<AtlasGuidedSearchFocus>(guidedSearchFocusIds[0]);
  const described = guidedSearchFocusForId(describedId);
  const selectedCount = selected.length;

  function toggle(id: AtlasGuidedSearchFocus) {
    setDescribedId(id);
    setSelected((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : guidedSearchFocusIds.filter((item) => current.includes(item) || item === id)
    );
  }

  return (
    <div className="mt-10 border-t border-white/15 pt-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          <p className="text-sm font-extrabold">Search focus</p>
          <p className="mt-1 text-sm leading-6 text-white/70">Select the concepts you want to carry into the map.</p>
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Guided search focus controls">
            {guidedSearchFocuses.map((focus) => {
              const isSelected = selected.includes(focus.id);
              return (
                <button
                  key={focus.id}
                  type="button"
                  aria-pressed={isSelected}
                  aria-describedby="guided-search-focus-description"
                  aria-label={`${isSelected ? "Remove" : "Include"} ${focus.label} ${isSelected ? "from" : "in"} the guided search.`}
                  onClick={() => toggle(focus.id)}
                  onFocus={() => setDescribedId(focus.id)}
                  onPointerEnter={() => setDescribedId(focus.id)}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-signal)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--atlas-ink)] ${isSelected ? "border-[var(--atlas-signal)] bg-[var(--atlas-signal)] text-[var(--atlas-ink)] shadow-[0_0_0_4px_rgba(245,233,0,0.09)]" : "border-white/30 bg-white/[0.08] text-white/78 hover:border-white/70 hover:bg-white/[0.13] hover:text-white"}`}
                >
                  {isSelected ? <Check className="size-4 shrink-0 text-[var(--atlas-ink)]" aria-hidden="true" /> : <span className="size-4 shrink-0 rounded-full border border-current opacity-55" aria-hidden="true" />}
                  {focus.label}
                </button>
              );
            })}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start sm:gap-x-4">
            <p className="inline-flex min-h-8 w-fit items-center rounded-full bg-[var(--atlas-evidence)] px-3 text-xs font-extrabold uppercase tracking-[0.08em] text-white">{selectedCount} {selectedCount === 1 ? "concept" : "concepts"} selected</p>
            <p className="text-sm leading-6 text-white/70">The guided search will use the selected concepts to open a shareable map state.</p>
          </div>
          <p id="guided-search-focus-description" className="mt-3 max-w-2xl text-sm leading-6 text-white/80">{described.label}: {described.description}</p>
          {selectedCount === 0 ? <p className="mt-3 text-sm font-semibold text-[var(--atlas-signal)]">Select at least one search focus to continue.</p> : null}
        </div>
        <div className="max-w-md rounded-[14px] bg-white/[0.06] p-4 lg:text-right">
          <p className="mb-4 text-sm font-semibold leading-6 text-white/78">A private, evidence-backed Shortlist you can review or export, not an automated recommendation.</p>
          {selectedCount ? (
            <LandingEntryLink href={guidedSearchHref(selected)} entryPath="example" className="atlas-signal-button h-12 shrink-0 gap-2 rounded-full px-6 text-sm shadow-[0_10px_30px_rgba(245,233,0,0.18)] no-underline hover:no-underline">Open this guided search <ArrowRight className="size-4" /></LandingEntryLink>
          ) : (
            <button type="button" disabled className="atlas-signal-button h-12 shrink-0 gap-2 rounded-full px-6 text-sm opacity-50" aria-describedby="guided-search-focus-description">Open this guided search <ArrowRight className="size-4" /></button>
          )}
        </div>
      </div>
    </div>
  );
}
