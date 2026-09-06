"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { SignalVisual } from "@/components/atlas/signal-visual";
import type { SignalEdition } from "@/lib/atlas/signals";
import { paginate } from "@/lib/pagination";
import { filterSignalArchive } from "@/lib/signals/archive";
import { signalEditionExcerpt } from "@/lib/signals/presentation";
import { collectSignalTags, getSignalTagDefinition, getSignalTagLabel, type SignalTag } from "@/lib/signals/taxonomy";
import { signalLeadVisual } from "@/lib/signals/visuals";

const dateFormatter = new Intl.DateTimeFormat("en-CA", { dateStyle: "long" });
const tagGroups = [{ id: "environment", label: "Operating environment" }, { id: "activity", label: "Development" }, { id: "technology", label: "Technology" }] as const;

export function SignalArchiveBrowser({ editions, featuredId }: { editions: SignalEdition[]; featuredId?: string }) {
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<SignalTag | null>(null);
  const [page, setPage] = useState(1);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const availableTags = useMemo(() => collectSignalTags(editions.flatMap((edition) => edition.items)), [editions]);
  const filtering = Boolean(query.trim() || selectedTag);
  const visibleEditions = useMemo(() => filterSignalArchive(editions, query, selectedTag, featuredId), [editions, query, selectedTag, featuredId]);
  const directory = paginate(visibleEditions, page, 4);

  function selectTag(tag: SignalTag | null) {
    setSelectedTag(tag);
    setPage(1);
  }
  function changePage(next: number) {
    setPage(next);
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ block: "start" });
  }

  return <section className="mt-4" aria-labelledby="signals-archive-heading">
    <div className="border-b border-[var(--atlas-border)] pb-5">
      <p className="atlas-eyebrow">Signals archive</p>
      <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div><h2 ref={headingRef} tabIndex={-1} id="signals-archive-heading" className="scroll-mt-24 text-3xl font-extrabold tracking-[-0.04em]">More Signals</h2><p id="signals-search-hint" className="mt-2 max-w-2xl text-sm leading-6 text-[var(--atlas-muted)]">Search by company, technology or development. Try “Kraken”, “sonar” or “shipbuilding”.</p></div>
        <label className="relative block w-full lg:max-w-md"><span className="sr-only">Search Canadian Defence Signals</span><Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--atlas-muted)]" /><input value={query} aria-describedby="signals-search-hint" onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Company, technology or development" className="h-12 w-full rounded-[12px] border border-[var(--atlas-border-strong)] bg-white pl-11 pr-12 text-sm outline-none transition focus:border-[var(--atlas-ink)]" />{query ? <button type="button" onClick={() => { setQuery(""); setPage(1); }} aria-label="Clear Signals search" className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-[var(--atlas-muted)] hover:bg-[var(--atlas-surface-muted)]"><X className="size-4" /></button> : null}</label>
      </div>
      {availableTags.length ? <div className="atlas-signal-filters mt-6" aria-label="Filter Signals by tag">
        {tagGroups.map((group) => <fieldset key={group.id} className="min-w-0"><legend className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--atlas-muted)]">{group.label}</legend><div className="flex flex-wrap gap-1">{availableTags.filter((tag) => getSignalTagDefinition(tag)?.group === group.id).map((tag) => <button key={tag} type="button" aria-pressed={selectedTag === tag} onClick={() => selectTag(selectedTag === tag ? null : tag)} className="atlas-topic-filter">{getSignalTagLabel(tag)}</button>)}</div></fieldset>)}
      </div> : null}
      <div className="mt-4 flex min-h-11 flex-wrap items-center justify-between gap-3"><p role="status" className="text-sm text-[var(--atlas-muted)]">{directory.total ? `Showing ${directory.start}–${directory.end} of ${directory.total} ${filtering ? "matching " : "earlier "}Signals` : "No matching Signals"}{selectedTag ? ` · ${getSignalTagLabel(selectedTag)}` : ""}</p>{filtering ? <button type="button" onClick={() => { setQuery(""); selectTag(null); }} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold underline underline-offset-4">Clear search and filter <X className="size-4" /></button> : null}</div>
    </div>

    {directory.items.length ? <div className="grid gap-6 pt-6 lg:grid-cols-2">{directory.items.map((edition) => {
      const tags = collectSignalTags(edition.items).slice(0, 5);
      return <article key={edition.id} className="atlas-signal-teaser">
        <SignalVisual visual={signalLeadVisual(edition)} />
        <div className="atlas-signal-teaser-copy">
          <time dateTime={edition.editionDate} className="text-xs font-bold text-white/70">{dateFormatter.format(new Date(`${edition.editionDate}T12:00:00Z`))}</time>
          <h3 className="mt-3 text-2xl font-extrabold leading-tight tracking-[-0.035em]"><Link href={`/signals/${edition.slug}`} className="text-white no-underline hover:underline">{edition.title}</Link></h3>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/75">{edition.summarySections ? signalEditionExcerpt(edition) : edition.items[0]?.bottomLine || edition.executiveSummary}</p>
          <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-6">
            <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1">{tags.map((tag) => <span key={tag} className="atlas-archive-tag">{getSignalTagLabel(tag)}</span>)}</div>
            <Link href={`/signals/${edition.slug}`} data-internal-link-role="contextual" data-internal-link-module="signals_archive" className="atlas-signal-button min-h-11 shrink-0 gap-2 px-4 py-2 text-sm font-extrabold no-underline hover:no-underline">Read the signal <ArrowRight className="size-4" /></Link>
          </div>
        </div>
      </article>;
    })}</div> : <div className="border-b border-[var(--atlas-border)] px-6 py-12 text-center"><p className="text-sm font-extrabold">{filtering ? "No Signals match this search." : "Earlier Signals will appear here."}</p><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--atlas-muted)]">{filtering ? "Try another topic or clear the selected tag." : "The archive grows only when the source and significance gates support a useful edition."}</p></div>}
    {directory.totalPages > 1 ? <nav aria-label="Signals archive pages" className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-[var(--atlas-border)] py-4">
      <p className="text-sm font-semibold">Page {directory.page} of {directory.totalPages}</p>
      <div className="flex gap-3"><button type="button" disabled={directory.page === 1} onClick={() => changePage(directory.page - 1)} className="atlas-secondary-button gap-2 px-4 text-sm disabled:opacity-40"><ChevronLeft className="size-4" />Previous</button><button type="button" disabled={directory.page === directory.totalPages} onClick={() => changePage(directory.page + 1)} className="atlas-primary-button gap-2 px-4 text-sm disabled:opacity-40">Next<ChevronRight className="size-4" /></button></div>
    </nav> : null}
  </section>;
}
