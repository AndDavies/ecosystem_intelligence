"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface GlobalSearchProps {
  initialResults?: {
    useCases: Array<{ id: string; name: string; slug: string }>;
    capabilities: Array<{ id: string; name: string }>;
    companies: Array<{ id: string; name: string }>;
  };
}

export function GlobalSearch({ initialResults }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(initialResults);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    if (!deferredQuery.trim()) {
      setResults(initialResults);
      return;
    }

    const controller = new AbortController();

    fetch(`/api/search?q=${encodeURIComponent(deferredQuery)}`, {
      signal: controller.signal
    })
      .then((response) => response.json())
      .then((payload) => setResults(payload))
      .catch(() => {});

    return () => controller.abort();
  }, [deferredQuery, initialResults]);

  return (
    <Card id="search" className="rounded-[32px]">
      <CardHeader>
        <CardTitle>Global Search</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search use cases, capabilities, or companies"
            className="pl-11"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <SearchColumn
            title="Use Cases"
            items={(results?.useCases ?? []).map((item) => ({
              href: `/use-cases/${item.slug}`,
              label: item.name
            }))}
          />
          <SearchColumn
            title="Capabilities"
            items={(results?.capabilities ?? []).map((item) => ({
              href: `/capabilities/${item.id}`,
              label: item.name
            }))}
          />
          <SearchColumn
            title="Companies"
            items={(results?.companies ?? []).map((item) => ({
              href: `/companies/${item.id}`,
              label: item.name
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
  items: Array<{ href: string; label: string }>;
}) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-white/55 p-4">
      <div className="mb-3 text-sm font-semibold">{title}</div>
      <div className="space-y-2">
        {items.length ? (
          items.map((item) => (
            <Link
              key={`${title}-${item.href}`}
              href={item.href}
              className="block rounded-2xl px-3 py-2 text-sm hover:bg-white"
            >
              {item.label}
            </Link>
          ))
        ) : (
          <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No matches yet.</div>
        )}
      </div>
    </div>
  );
}
