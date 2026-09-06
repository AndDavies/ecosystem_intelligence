"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CircleAlert,
  Compass,
  Cpu,
  FileSearch,
  LoaderCircle,
  Search,
  Target,
  X
} from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { OrganizationIdentityMark } from "@/components/atlas/organization-identity";
import { cn } from "@/lib/utils";
import type { AtlasLookupKind, AtlasLookupResponse, AtlasLookupSuggestion } from "@/types/atlas";

const lookupKindLabels: Record<AtlasLookupKind, string> = {
  organization: "Organization",
  capability: "Technology or service",
  technical_domain: "Technology area",
  mission_area: "Mission area",
  public_need: "Defence need"
};

const groupLabels = {
  organization: "Organizations",
  capability: "Technologies and services",
  discovery: "Explore by area"
} as const;

function lookupGroup(kind: AtlasLookupKind): keyof typeof groupLabels {
  if (kind === "organization") return "organization";
  if (kind === "capability") return "capability";
  return "discovery";
}

function SuggestionIcon({ suggestion }: { suggestion: AtlasLookupSuggestion }) {
  if (suggestion.kind === "organization") {
    return <OrganizationIdentityMark name={suggestion.label} logoUrl={suggestion.logoUrl} size="sm" />;
  }
  const Icon = suggestion.kind === "capability"
    ? Cpu
    : suggestion.kind === "mission_area"
      ? Compass
      : suggestion.kind === "public_need"
        ? Target
        : FileSearch;
  return (
    <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--atlas-blue-soft)] text-[var(--atlas-primary)]">
      <Icon className="size-4" />
    </span>
  );
}

interface AtlasRecordLookupProps {
  committedQuery: string;
  busy: boolean;
  hideSuggestions?: boolean;
  submitLabel?: string;
  onCommit: (query: string) => void;
  onClear: () => void;
  onOpenAsk: () => void;
  onSearchFocus: () => void;
  onSelectSuggestion: (suggestion: AtlasLookupSuggestion) => void;
}

export function AtlasRecordLookup({
  committedQuery,
  busy,
  hideSuggestions = false,
  submitLabel,
  onCommit,
  onClear,
  onOpenAsk,
  onSearchFocus,
  onSelectSuggestion
}: AtlasRecordLookupProps) {
  const router = useRouter();
  const [query, setQuery] = useState(committedQuery);
  const [response, setResponse] = useState<AtlasLookupResponse | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [completedQuery, setCompletedQuery] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const focusedRef = useRef(false);
  const trimmedQuery = query.trim();
  const suggestions = useMemo(() => completedQuery === trimmedQuery ? response?.suggestions ?? [] : [], [response, completedQuery, trimmedQuery]);
  const hasSeeAll = Boolean(completedQuery === trimmedQuery && response?.seeAllHref && response.totalOrganizationMatches > 0);
  const optionCount = suggestions.length + (hasSeeAll ? 1 : 0);
  const listboxId = "atlas-record-lookup-options";

  const groupedSuggestions = useMemo(() => {
    const groups = new Map<keyof typeof groupLabels, AtlasLookupSuggestion[]>();
    suggestions.forEach((suggestion) => {
      const group = lookupGroup(suggestion.kind);
      groups.set(group, [...(groups.get(group) ?? []), suggestion]);
    });
    return Array.from(groups.entries());
  }, [suggestions]);

  useEffect(() => {
    setQuery(committedQuery);
  }, [committedQuery]);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  useEffect(() => {
    if (hideSuggestions) {
      setOpen(false);
      setLookupLoading(false);
      return;
    }
    if (trimmedQuery.length < 2) {
      setResponse(null);
      setLookupError(null);
      setLookupLoading(false);
      setActiveIndex(-1);
      return;
    }

    setLookupLoading(true);
    setLookupError(null);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLookupLoading(true);
      setLookupError(null);
      try {
        const lookupResponse = await fetch("/api/atlas/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ query: trimmedQuery }),
          signal: controller.signal
        });
        const body = await lookupResponse.json().catch(() => null) as (AtlasLookupResponse & { error?: string }) | null;
        if (!lookupResponse.ok || !body) {
          throw new Error(body?.error ?? "Published records could not be searched. Try again.");
        }
        setResponse(body);
        setCompletedQuery(trimmedQuery);
        setActiveIndex(-1);
        if (focusedRef.current) setOpen(true);
      } catch (error) {
        if (controller.signal.aborted) return;
        setResponse(null);
        setActiveIndex(-1);
        setCompletedQuery(trimmedQuery);
        setLookupError(error instanceof Error ? error.message : "Published records could not be searched. Try again.");
        if (focusedRef.current) setOpen(true);
      } finally {
        if (!controller.signal.aborted) setLookupLoading(false);
      }
    }, 200);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [hideSuggestions, trimmedQuery]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (trimmedQuery.length < 2 && !(submitLabel && !trimmedQuery)) return;
    setOpen(false);
    onCommit(trimmedQuery);
  }

  function activate(index: number) {
    if (index < suggestions.length) {
      const suggestion = suggestions[index];
      onSelectSuggestion(suggestion);
      setOpen(false);
      if (!suggestion.filter) router.push(suggestion.href);
      return;
    }
    if (hasSeeAll) {
      setOpen(false);
      onCommit(trimmedQuery);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (!open) return;
      event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!optionCount) return;
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => {
        if (event.key === "ArrowDown") return current >= optionCount - 1 ? 0 : current + 1;
        return current <= 0 ? optionCount - 1 : current - 1;
      });
      return;
    }
    if (event.key === "Home" && open && optionCount) {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === "End" && open && optionCount) {
      event.preventDefault();
      setActiveIndex(optionCount - 1);
      return;
    }
    if (event.key === "Enter" && open && activeIndex >= 0) {
      event.preventDefault();
      activate(activeIndex);
    }
  }

  const status = lookupLoading
    ? "Searching published records."
    : lookupError
      ? lookupError
      : response
        ? `${suggestions.length} suggestions available${response.totalOrganizationMatches ? ` and ${response.totalOrganizationMatches} matching ${response.totalOrganizationMatches === 1 ? "organization" : "organizations"}` : ""}.`
        : "";

  let optionIndex = 0;
  return (
    <div ref={rootRef} className="relative" data-clarity-mask="true">
      <form className="atlas-search-form" onSubmit={submit} role="search" aria-label="Search published True North Map records" aria-busy={busy || lookupLoading}>
        <div className="atlas-search-input relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--atlas-muted)]" aria-hidden="true" />
          <label htmlFor="atlas-record-search" className="sr-only">Search companies, technologies and areas</label>
          <input
            id="atlas-record-search"
            role="combobox"
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={open}
            aria-activedescendant={open && activeIndex >= 0 ? `atlas-lookup-option-${activeIndex}` : undefined}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value.slice(0, 120));
              setOpen(true);
            }}
            onFocus={() => {
              focusedRef.current = true;
              onSearchFocus();
              if (trimmedQuery.length >= 2) setOpen(true);
            }}
            onBlur={() => {
              focusedRef.current = false;
            }}
            onKeyDown={handleKeyDown}
            className="h-14 w-full rounded-[12px] border border-[var(--atlas-border-strong)] bg-white pl-12 pr-12 text-[15px] text-[var(--atlas-ink)] outline-none placeholder:text-[var(--atlas-muted)] focus:border-[var(--atlas-ink)] focus:ring-4 focus:ring-[var(--atlas-signal-soft)] sm:text-base"
            placeholder="Company, technology or area"
            autoComplete="off"
            spellCheck={false}
            maxLength={120}
          />
          {lookupLoading ? (
            <LoaderCircle className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-[var(--atlas-muted)]" aria-hidden="true" />
          ) : query ? (
            <button
              type="button"
              className="absolute right-1.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-[10px] text-[var(--atlas-muted)] hover:bg-[var(--atlas-blue-soft)] hover:text-[var(--atlas-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-primary)]"
              aria-label="Clear record search"
              onClick={() => {
                setQuery("");
                setResponse(null);
                setOpen(false);
                if (committedQuery) onClear();
              }}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        {submitLabel ? <button type="submit" disabled={busy || trimmedQuery.length === 1} className="atlas-signal-button mt-3 min-h-12 w-full px-5 text-sm disabled:opacity-50 sm:w-auto">{submitLabel}</button> : null}
      </form>

      <p className="sr-only" aria-live="polite">{status}</p>

      {open && trimmedQuery.length >= 2 ? (
        <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-[1200] max-h-[min(420px,55dvh)] overflow-y-auto overscroll-contain rounded-[14px] bg-white p-2 shadow-[0_18px_48px_rgba(36,40,39,0.2)] ring-1 ring-[var(--atlas-border)]">
          {(lookupLoading || completedQuery !== trimmedQuery) && !suggestions.length ? (
            <div className="flex min-h-16 items-center gap-3 px-3 py-3 text-sm font-semibold text-[var(--atlas-muted)]" role="status">
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              Searching published records…
            </div>
          ) : lookupError ? (
            <div className="flex min-h-16 items-start gap-3 rounded-[12px] bg-[var(--atlas-danger-soft)] px-3 py-3 text-sm text-[var(--atlas-danger)]" role="alert">
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {lookupError}
            </div>
          ) : suggestions.length || hasSeeAll ? (
            <div id={listboxId} role="listbox" aria-label="Published record suggestions">
              {groupedSuggestions.map(([group, groupSuggestions]) => (
                <section key={group} role="group" aria-labelledby={`atlas-lookup-group-${group}`}>
                  <p id={`atlas-lookup-group-${group}`} className="px-3 pb-1 pt-2 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--atlas-muted)]">
                    {groupLabels[group]}
                  </p>
                  {groupSuggestions.map((suggestion) => {
                    const currentIndex = optionIndex;
                    optionIndex += 1;
                    const active = activeIndex === currentIndex;
                    const content = (
                      <>
                        <SuggestionIcon suggestion={suggestion} />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <strong className="truncate text-sm text-[var(--atlas-ink)]">{suggestion.label}</strong>
                            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--atlas-primary)]">{lookupKindLabels[suggestion.kind]}</span>
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-[var(--atlas-muted)]">{suggestion.secondary}</span>
                        </span>
                        <ArrowRight className="size-4 shrink-0 text-[var(--atlas-muted)]" aria-hidden="true" />
                      </>
                    );
                    const classes = cn(
                      "flex min-h-14 w-full items-center gap-3 rounded-[12px] border-l-2 border-l-transparent px-3 py-2 text-left no-underline outline-none hover:bg-[var(--atlas-blue-soft-hover)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--atlas-primary)]",
                      active && "border-l-[var(--atlas-signal)] bg-[var(--atlas-signal-soft)]"
                    );
                    if (suggestion.filter) {
                      return (
                        <button
                          key={`${suggestion.kind}-${suggestion.id}`}
                          id={`atlas-lookup-option-${currentIndex}`}
                          type="button"
                          tabIndex={-1}
                          role="option"
                          aria-selected={active}
                          className={classes}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => activate(currentIndex)}
                        >
                          {content}
                        </button>
                      );
                    }
                    return (
                      <Link
                        key={`${suggestion.kind}-${suggestion.id}`}
                        id={`atlas-lookup-option-${currentIndex}`}
                        role="option"
                        aria-selected={active}
                        href={suggestion.href}
                        tabIndex={-1}
                        prefetch={false}
                        className={classes}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setOpen(false);
                          onSelectSuggestion(suggestion);
                        }}
                      >
                        {content}
                      </Link>
                    );
                  })}
                </section>
              ))}

              {hasSeeAll ? (
                <button
                  id={`atlas-lookup-option-${suggestions.length}`}
                  type="button"
                  tabIndex={-1}
                  role="option"
                  aria-selected={activeIndex === suggestions.length}
                  className={cn(
                    "mt-1 flex min-h-12 w-full items-center justify-between rounded-[12px] bg-[var(--atlas-ink)] px-4 text-left text-sm font-bold text-white outline-none hover:bg-[var(--atlas-ink-soft)] focus-visible:ring-2 focus-visible:ring-[var(--atlas-signal)] focus-visible:ring-offset-2",
                    activeIndex === suggestions.length && "ring-2 ring-[var(--atlas-signal)] ring-offset-2"
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => activate(suggestions.length)}
                >
                  <span>Show {response?.totalOrganizationMatches.toLocaleString("en-CA")} matching {response?.totalOrganizationMatches === 1 ? "organization" : "organizations"}</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          ) : (
            <div className="rounded-[12px] bg-[var(--atlas-blue-soft)] px-4 py-4">
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 size-4 shrink-0 text-[var(--atlas-primary)]" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold text-[var(--atlas-ink)]">No published record matches this search.</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                    <button type="button" className="min-h-11 text-xs font-bold text-[var(--atlas-primary)] underline decoration-2 underline-offset-4" onClick={() => { setQuery(""); setResponse(null); setOpen(false); if (committedQuery) onClear(); }}>Clear search</button>
                    <button type="button" className="min-h-11 text-xs font-bold text-[var(--atlas-primary)] underline decoration-2 underline-offset-4" onClick={() => { setOpen(false); onOpenAsk(); }}>Ask about a need instead</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
