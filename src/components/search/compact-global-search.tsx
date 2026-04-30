"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { SearchResultsView } from "@/types/view-models";

const resultSections = [
  { key: "domains", label: "Technical Domains" },
  { key: "useCases", label: "Mission Areas" },
  { key: "capabilities", label: "Capabilities" },
  { key: "companies", label: "Companies" }
] as const;

const browseShortcuts = [
  { label: "Mission areas", href: "/use-cases" },
  { label: "Technical domains", href: "/domains" },
  { label: "Companies", href: "/companies" },
  { label: "Working lists", href: "/shortlists" }
];

type CompactSearchItem = {
  id?: string;
  slug?: string;
  name: string;
  summary?: string;
  overview?: string;
  description?: string | null;
  matchContext?: string;
};

export function CompactGlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultsView | null>(null);
  const [open, setOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const trimmedQuery = deferredQuery.trim();
  const shouldSearch = trimmedQuery.length >= 2;

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

  const openHref = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-11 w-full max-w-3xl items-center gap-3 rounded-[3px] border border-[var(--border-strong)] bg-white px-4 text-left text-sm shadow-[0_8px_24px_rgba(20,34,24,0.04)] transition hover:border-[var(--primary)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          <Search className="size-4 shrink-0 text-[var(--muted-foreground)]" />
          <span className={query ? "truncate text-[var(--foreground)]" : "truncate text-[var(--muted-foreground)]"}>
            {query || "Search companies, capabilities, mission areas, or technical domains"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[min(42rem,calc(100vw-2rem))] rounded-[4px] border-[var(--border)] bg-white p-0 shadow-[0_24px_80px_rgba(20,34,24,0.16)]"
      >
        <Command shouldFilter={false} className="rounded-[4px] bg-white">
          <CommandInput
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Search companies, capabilities, mission areas, or technical domains"
          />
          <CommandList className="max-h-[62vh]">
            {!shouldSearch ? (
              <CommandGroup heading="Browse shortcuts">
                {browseShortcuts.map((shortcut) => (
                  <CommandItem
                    key={shortcut.href}
                    value={shortcut.label}
                    onSelect={() => openHref(shortcut.href)}
                  >
                    <span>{shortcut.label}</span>
                    <ArrowRight className="ml-auto size-3.5 text-[var(--muted-foreground)]" />
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              <SearchResultGroups
                results={results}
                onOpen={openHref}
              />
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function SearchResultGroups({
  results,
  onOpen
}: {
  results: SearchResultsView | null;
  onOpen: (href: string) => void;
}) {
  const totalMatches = resultSections.reduce(
    (count, section) => count + ((results?.[section.key] ?? []) as CompactSearchItem[]).length,
    0
  );

  if (results && totalMatches === 0) {
    return (
      <div className="px-3 py-8 text-center text-sm text-[var(--muted-foreground)]">
        No matches yet. Try a company, capability, mission area, or domain.
      </div>
    );
  }

  return (
    <>
      {resultSections.map((section, index) => {
        const items = ((results?.[section.key] ?? []) as CompactSearchItem[]).slice(0, 3);

        return (
          <div key={section.key}>
            {index > 0 ? <CommandSeparator /> : null}
            <CommandGroup heading={`${section.label} (${items.length})`}>
              {items.length ? (
                items.map((item) => (
                  <CommandItem
                    key={`${section.key}-${item.id ?? item.slug}`}
                    value={`${section.label} ${item.name}`}
                    onSelect={() => onOpen(getResultHref(section.key, item))}
                    className="items-start py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[var(--foreground)]">{item.name}</div>
                      <div className="mt-0.5 line-clamp-1 text-xs text-[var(--muted-foreground)]">
                        {item.matchContext ?? item.summary ?? item.overview ?? item.description ?? "Open record"}
                      </div>
                    </div>
                    <ArrowRight className="ml-auto mt-0.5 size-3.5 shrink-0 text-[var(--muted-foreground)]" />
                  </CommandItem>
                ))
              ) : (
                <div className="px-2 py-1.5 text-xs text-[var(--muted-foreground)]">No matches.</div>
              )}
            </CommandGroup>
          </div>
        );
      })}
    </>
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
