"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { SearchResultsView } from "@/types/view-models";

const resultSections = [
  { key: "domains", label: "Domains" },
  { key: "useCases", label: "Use Cases" },
  { key: "capabilities", label: "Capabilities" },
  { key: "companies", label: "Companies" }
] as const;

export function CompactGlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultsView | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const trimmedQuery = deferredQuery.trim();
  const shouldShowResults = isFocused && trimmedQuery.length >= 2;

  useEffect(() => {
    if (trimmedQuery.length < 2) {
      setResults(null);
      return;
    }

    const controller = new AbortController();

    fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`, {
      signal: controller.signal
    })
      .then((response) => response.json())
      .then((payload) => setResults(payload))
      .catch(() => {});

    return () => controller.abort();
  }, [trimmedQuery]);

  return (
    <div className="relative w-full max-w-3xl">
      <Search className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => window.setTimeout(() => setIsFocused(false), 140)}
        placeholder="Search companies, capabilities, mission areas, or domains"
        className="h-11 rounded-2xl border-[var(--border-strong)] bg-white pl-11 text-sm shadow-[0_8px_24px_rgba(20,34,24,0.04)]"
      />
      {shouldShowResults ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-[70vh] overflow-auto rounded-3xl border border-[var(--border)] bg-white p-3 shadow-[0_24px_80px_rgba(20,34,24,0.16)]">
          <div className="grid gap-3 lg:grid-cols-2">
            {resultSections.map((section) => {
              const items = ((results?.[section.key] ?? []) as Array<{
                id?: string;
                slug?: string;
                name: string;
                summary?: string;
                overview?: string;
                description?: string | null;
                matchContext?: string;
              }>).slice(0, 3);

              return (
                <div key={section.key} className="rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                      {section.label}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">{items.length}</div>
                  </div>
                  <div className="space-y-1">
                    {items.length ? (
                      items.map((item) => (
                        <Link
                          key={`${section.key}-${item.id ?? item.slug}`}
                          href={getResultHref(section.key, item)}
                          className="block rounded-xl px-3 py-2 no-underline hover:bg-white"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-[var(--foreground)]">{item.name}</div>
                              <div className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
                                {item.matchContext ?? item.summary ?? item.overview ?? item.description ?? "Open record"}
                              </div>
                            </div>
                            <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-[var(--muted-foreground)]" />
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-xs text-[var(--muted-foreground)]">No matches.</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--border)] pt-3 text-xs">
            <Link href="/use-cases" className="rounded-full bg-[var(--muted)] px-3 py-1.5 font-medium no-underline">
              Browse mission areas
            </Link>
            <Link href="/companies" className="rounded-full bg-[var(--muted)] px-3 py-1.5 font-medium no-underline">
              Browse companies
            </Link>
            <Link href="/shortlists" className="rounded-full bg-[var(--muted)] px-3 py-1.5 font-medium no-underline">
              Open lists
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getResultHref(
  section: (typeof resultSections)[number]["key"],
  item: { id?: string; slug?: string }
) {
  if (section === "domains") {
    return `/domains/${item.slug}`;
  }

  if (section === "useCases") {
    return `/use-cases/${item.slug}`;
  }

  if (section === "capabilities") {
    return `/capabilities/${item.id}`;
  }

  return `/companies/${item.id}`;
}
