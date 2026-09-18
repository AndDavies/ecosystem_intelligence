"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import type { AtlasLookupSuggestion } from "@/types/atlas";

type Result = { suggestions: AtlasLookupSuggestion[]; areas: AtlasLookupSuggestion[]; coverage: { reviewed: number; eligible: number }; error?: string | null };

export function AtlasSemanticSuggestions({ query, filters, onSelect }: {
  query: string; filters: string; onSelect: (suggestion: AtlasLookupSuggestion) => void;
}) {
  const [available, setAvailable] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const generation = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/atlas/semantic", { signal: controller.signal }).then(r => r.json()).then(body => {
      if (!controller.signal.aborted) setAvailable(body.available === true);
    }).catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    generation.current++; request.current?.abort(); setResult(null); setError(null); setBusy(false);
    return () => { request.current?.abort(); };
  }, [query, filters]);

  async function search() {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    const current = ++generation.current;
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/atlas/semantic", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, filters }), signal: controller.signal });
      const body = await response.json();
      if (controller.signal.aborted || current !== generation.current) return;
      if (!response.ok || body.error) throw new Error(body.error ?? "Meaning-based search is unavailable.");
      setResult(body);
    } catch (error) {
      if (!controller.signal.aborted && current === generation.current) setError(error instanceof Error ? error.message : "Meaning-based search is unavailable.");
    } finally { if (!controller.signal.aborted && current === generation.current) setBusy(false); }
  }

  if (!available || query.trim().length < 3) return null;
  return <section aria-label="Meaning-based suggestions" className="mt-2 rounded-xl bg-[var(--atlas-blue-soft)] p-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-xs font-bold text-[var(--atlas-ink)]">Matches your need</p>
      <button type="button" disabled={busy} onClick={() => void search()} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--atlas-border)] bg-white px-3 text-xs font-bold text-[var(--atlas-primary)] disabled:opacity-60">
        {busy ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Sparkles aria-hidden="true" className="size-4" />}
        {busy ? "Finding matches…" : "Find by meaning · AI"}
      </button>
    </div>
    <p className="mt-1 text-xs leading-5 text-[var(--atlas-muted)]">AI uses this search and public records via TypeSafe. Avoid confidential or personal information. <Link href="/privacy" className="atlas-prose-link">Privacy</Link></p>
    <div role="status" aria-live="polite" className="text-xs leading-5 text-[var(--atlas-muted)]">
      {error ? <p className="mt-2">{error}</p> : result ? <p className="mt-2">{result.suggestions.length ? `Reviewed ${result.coverage.reviewed} of ${result.coverage.eligible} organizations within your filters. Suggested matches need review.` : "No useful matches in this candidate pool. Try Ask True North for a broader investigation."}</p> : null}
    </div>
    {result?.suggestions.length ? <ul className="mt-2 space-y-1">{result.suggestions.map(suggestion => <li key={suggestion.id}>
      <Link prefetch={false} href={suggestion.href} onClick={() => onSelect(suggestion)} className="block rounded-lg bg-white px-3 py-3 no-underline hover:bg-[var(--atlas-blue-soft-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--atlas-primary)]">
        <strong className="block text-sm text-[var(--atlas-ink)]">{suggestion.label}</strong>
        <span className="mt-1 block text-xs leading-5 text-[var(--atlas-muted)]">{suggestion.secondary}</span>
      </Link>
    </li>)}</ul> : null}
    {result?.areas.length ? <div className="mt-3 flex flex-wrap gap-2" aria-label="Suggested technology filters">{result.areas.map(area => <button key={area.id} type="button" onClick={() => onSelect(area)} className="min-h-11 rounded-full border border-[var(--atlas-border)] bg-white px-3 text-xs font-semibold text-[var(--atlas-primary)]">Explore {area.label}</button>)}</div> : null}
  </section>;
}
