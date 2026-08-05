"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { SignalTagPill } from "@/components/atlas/signal-tag-pill";
import type { SignalEdition } from "@/lib/atlas/signals";
import { collectSignalTags, getSignalTagLabel, type SignalTag } from "@/lib/signals/taxonomy";

const dateFormatter = new Intl.DateTimeFormat("en-CA", { dateStyle: "long" });

export function SignalArchiveBrowser({ editions, featuredId }: { editions: SignalEdition[]; featuredId?: string }) {
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<SignalTag | null>(null);
  const availableTags = useMemo(() => collectSignalTags(editions.flatMap((edition) => edition.items)), [editions]);
  const filtering = Boolean(query.trim() || selectedTag);
  const normalizedQuery = query.trim().toLocaleLowerCase("en-CA");
  const visibleEditions = useMemo(() => editions.filter((edition) => {
    if (!filtering && edition.id === featuredId) return false;
    const tags = collectSignalTags(edition.items);
    if (selectedTag && !tags.includes(selectedTag)) return false;
    if (!normalizedQuery) return true;
    const searchable = [edition.title, edition.executiveSummary, ...edition.items.flatMap((item) => [item.title, item.bottomLine, item.executiveSummary, ...item.tags.map(getSignalTagLabel)])].join(" ").toLocaleLowerCase("en-CA");
    return searchable.includes(normalizedQuery);
  }), [editions, featuredId, filtering, normalizedQuery, selectedTag]);

  return <section className="mt-14" aria-labelledby="signals-archive-heading">
    <div className="border-b border-[var(--atlas-border)] pb-5">
      <p className="atlas-eyebrow">Signals archive</p>
      <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div><h2 id="signals-archive-heading" className="text-3xl font-extrabold tracking-[-0.04em]">More Signals</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--atlas-muted)]">Search by development, organization, technology, or one of the standard editorial tags.</p></div>
        <label className="relative block w-full lg:max-w-sm"><span className="sr-only">Search Canadian Defence Signals</span><Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--atlas-muted)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Signals" className="h-12 w-full rounded-xl border border-[var(--atlas-border-strong)] bg-white pl-11 pr-11 text-sm outline-none transition focus:border-[var(--atlas-primary)] focus:ring-2 focus:ring-[var(--atlas-primary-soft)]" />{query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear Signals search" className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--atlas-muted)] hover:bg-[var(--atlas-surface-muted)]"><X className="size-4" /></button> : null}</label>
      </div>
      {availableTags.length ? <div className="mt-5 flex flex-wrap gap-2" aria-label="Filter Signals by tag">{availableTags.map((tag) => <SignalTagPill key={tag} tag={tag} asButton active={selectedTag === tag} onClick={() => setSelectedTag((current) => current === tag ? null : tag)} />)}{selectedTag ? <button type="button" onClick={() => setSelectedTag(null)} className="inline-flex min-h-8 items-center gap-1 rounded-full px-3 text-[11px] font-bold text-[var(--atlas-muted)] hover:text-[var(--atlas-ink)]">Clear tag <X className="size-3" /></button> : null}</div> : null}
    </div>

    {visibleEditions.length ? <div className="grid gap-5 pt-6 lg:grid-cols-2">{visibleEditions.map((edition) => {
      const tags = collectSignalTags(edition.items).slice(0, 5);
      return <article key={edition.id} className="relative flex min-h-[280px] flex-col overflow-hidden rounded-2xl bg-white p-6 shadow-[0_18px_44px_rgba(36,40,39,0.06)] transition-shadow duration-200 hover:shadow-[0_22px_52px_rgba(36,40,39,0.1)]">
        <div className="flex flex-wrap items-center gap-3"><time dateTime={edition.editionDate} className="inline-flex items-center gap-2 text-xs font-bold text-[var(--atlas-muted)]"><CalendarDays className="size-4 text-[var(--atlas-primary)]" />{dateFormatter.format(new Date(`${edition.editionDate}T12:00:00Z`))}</time></div>
        <h3 className="mt-5 text-2xl font-extrabold leading-tight tracking-[-0.035em]">{edition.title}</h3>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--atlas-muted)]">{edition.items[0]?.bottomLine || edition.executiveSummary}</p>
        <div className="mt-auto grid gap-5 pt-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="flex min-w-0 flex-wrap gap-2">{tags.map((tag) => <SignalTagPill key={tag} tag={tag} />)}</div>
          <Link href={`/signals/${edition.slug}`} className="atlas-pill atlas-pill-blue atlas-pill-link min-h-11 w-fit shrink-0 gap-2 px-4 py-2 text-sm font-extrabold no-underline transition-colors hover:bg-[var(--atlas-ink)] hover:text-white hover:no-underline">Read the signal <ArrowRight className="size-4" /></Link>
        </div>
      </article>;
    })}</div> : <div className="rounded-2xl bg-white px-6 py-12 text-center"><p className="text-sm font-extrabold">{filtering ? "No Signals match this search." : "Earlier Signals will appear here."}</p><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--atlas-muted)]">{filtering ? "Try another topic or clear the selected tag." : "The archive grows only when the source and significance gates support a useful edition."}</p></div>}
  </section>;
}
