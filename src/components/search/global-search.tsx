"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { SearchResultsView } from "@/types/view-models";

interface GlobalSearchProps {
  initialResults?: SearchResultsView;
}

export function GlobalSearch({ initialResults }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(initialResults);
  const deferredQuery = useDeferredValue(query);
  const trimmedQuery = deferredQuery.trim();

  useEffect(() => {
    if (!trimmedQuery || trimmedQuery.length < 2) {
      setResults(initialResults);
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
  }, [trimmedQuery, initialResults]);

  return (
    <Card id="search" variant="hero" className="rounded-[36px]">
      <CardHeader className="space-y-3">
        <div className="workspace-kicker">Global search</div>
        <CardTitle>Global Search</CardTitle>
        <p className="max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
          Move across domains, use cases, capabilities, and companies from one search surface while keeping the surrounding context legible.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search domains, use cases, capabilities, or companies"
              className="h-14 rounded-[24px] border-[var(--border-strong)] bg-white/90 pl-11 text-[15px]"
            />
          </div>
          <div className="flex flex-wrap gap-2 xl:justify-end">
            <BrowseShortcut href="/use-cases" label="Browse Use Cases" />
            <BrowseShortcut href="/domains" label="Browse Domains" />
            <BrowseShortcut href="/companies" label="Browse Companies" />
          </div>
        </div>

        {trimmedQuery && trimmedQuery.length < 2 ? (
          <div className="text-sm text-[var(--muted-foreground)]">
            Type at least 2 characters to search across records.
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-4">
          <SearchColumn
            title="Domains"
            items={(results?.domains ?? []).map((item) => ({
              href: `/domains/${item.slug}`,
              label: item.name,
              meta: [item.matchContext, `${item.useCaseCount} use cases`, `${item.companyCount} companies`]
                .filter(Boolean)
                .join(" · "),
              description: item.description ?? undefined
            }))}
          />
          <SearchColumn
            title="Use Cases"
            items={(results?.useCases ?? []).map((item) => ({
              href: `/use-cases/${item.slug}`,
              label: item.name,
              meta: [
                item.priorityTier.toUpperCase(),
                item.useCaseKind,
                ...item.partnerFrames,
                item.matchContext
              ]
                .filter(Boolean)
                .join(" · "),
              description: item.summary
            }))}
          />
          <SearchColumn
            title="Capabilities"
            items={(results?.capabilities ?? []).map((item) => ({
              href: `/capabilities/${item.id}`,
              label: item.name,
              meta: [item.companyName, item.domainName, item.matchContext].filter(Boolean).join(" · "),
              description: item.summary
            }))}
          />
          <SearchColumn
            title="Companies"
            items={(results?.companies ?? []).map((item) => ({
              href: `/companies/${item.id}`,
              label: item.name,
              meta: [
                item.headquarters,
                item.domainNames.join(" · "),
                `${item.useCaseCount} use cases`,
                item.matchContext
              ]
                .filter(Boolean)
                .join(" · "),
              description: item.overview
            }))}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SearchColumn({
  title,
  items
}: {
  title: string;
  items: Array<{ href: string; label: string; meta?: string; description?: string }>;
}) {
  return (
    <div className="rounded-[28px] border border-[var(--border)] bg-white/72 p-4 shadow-[0_14px_36px_rgba(20,34,24,0.05)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">{title}</div>
        <Badge tone="surface">{items.length}</Badge>
      </div>
      <div className="space-y-2">
        {items.length ? (
          items.map((item) => (
            <Link
              key={`${title}-${item.href}`}
              href={item.href}
              className="block rounded-[22px] border border-transparent px-3 py-3 no-underline transition hover:border-[var(--primary)]/16 hover:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-medium text-[var(--foreground)]">{item.label}</div>
                <ArrowRight className="mt-0.5 size-4 shrink-0 text-[var(--muted-foreground)]" />
              </div>
              {item.meta ? (
                <div className="mt-1 text-xs text-[var(--muted-foreground)]">{item.meta}</div>
              ) : null}
              {item.description ? (
                <div className="mt-1 text-sm text-[var(--muted-foreground)]">{item.description}</div>
              ) : null}
            </Link>
          ))
        ) : (
          <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No matches yet.</div>
        )}
      </div>
    </div>
  );
}

function BrowseShortcut({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="no-underline">
      <Badge tone="outline" className="px-3 py-1.5">
        {label}
      </Badge>
    </Link>
  );
}
