"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookmarkPlus,
  Building2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  LoaderCircle,
  X
} from "lucide-react";
import {
  alignmentSubject,
  alignmentTypeLabel,
  evidenceStrengthLabel,
  locationAccuracyLabel
} from "@/lib/atlas/presentation";
import { cn, formatDate, toTitleCase } from "@/lib/utils";
import type { AtlasExplorerCapability, AtlasExplorerOrganization, AtlasQuery } from "@/types/atlas";

export function relevantCapability(organization: AtlasExplorerOrganization, filters: AtlasQuery): AtlasExplorerCapability | null {
  return (
    organization.capabilities.find((capability) => {
      if (filters.domain && !capability.technicalDomains.some((domain) => domain.slug === filters.domain)) return false;
      if (filters.mission && !capability.missionMatches.some((match) => match.missionArea.slug === filters.mission)) return false;
      if (filters.demand && !capability.demandMatches.some((match) => match.demandSlug === filters.demand)) return false;
      if (filters.capability) {
        const query = filters.capability.toLowerCase();
        return [capability.name, capability.slug, capability.capabilityType ?? "", ...capability.technicalTags]
          .join(" ")
          .toLowerCase()
          .includes(query);
      }
      return true;
    }) ??
    organization.capabilities[0] ??
    null
  );
}
export function rowEvidence(organization: AtlasExplorerOrganization, capability: AtlasExplorerCapability | null) {
  const citations = [
    ...organization.citations,
    ...(capability?.citations ?? []),
    ...(capability?.missionMatches.flatMap((match) => match.citations) ?? []),
    ...(capability?.demandMatches.flatMap((match) => match.citations) ?? [])
  ];
  return Array.from(new Map(citations.map((citation) => [citation.sourceUrl, citation])).values());
}

function selectedAlignment(capability: AtlasExplorerCapability | null, filters: AtlasQuery) {
  if (!capability) return null;
  if (filters.demand) return capability.demandMatches.find((match) => match.demandSlug === filters.demand) ?? null;
  if (filters.mission) return capability.missionMatches.find((match) => match.missionArea.slug === filters.mission) ?? null;
  return capability.missionMatches[0] ?? capability.demandMatches[0] ?? null;
}

export function SnapshotMetric({ value, label }: { value: number; label: string }) {
  return (
    <div className="px-3 first:pl-0 last:pr-0 sm:px-5">
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="block text-2xl font-extrabold leading-none tracking-[-0.045em] text-[var(--atlas-ink)] sm:text-3xl">{value}</span>
        <span className="mt-2 block text-[10px] font-medium leading-4 text-[var(--atlas-muted)] sm:text-[11px]">{label}</span>
      </dd>
    </div>
  );
}

export function ResultsRail({
  organizations,
  totalInView,
  filters,
  selectedId,
  onSelect
}: {
  organizations: AtlasExplorerOrganization[];
  totalInView: number;
  filters: AtlasQuery;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="atlas-dark-panel hidden h-[510px] overflow-hidden lg:flex lg:flex-col" aria-label="Organizations in the current map view">
      <div className="border-b border-white/15 px-5 py-5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/60">Organizations in view</p>
        <p className="mt-2 text-lg font-extrabold tracking-[-0.025em] text-[var(--atlas-signal)]">{totalInView} reviewed {totalInView === 1 ? "organization" : "organizations"}</p>
        {organizations.length < totalInView ? <p className="mt-1 text-[11px] text-white/55">{organizations.length} detailed results loaded below.</p> : null}
        <p className="mt-1 text-[11px] text-white/55">Pan or zoom the map to refine this list.</p>
      </div>
      {organizations.length ? (
        <ol className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {organizations.map((organization, index) => {
            const capability = relevantCapability(organization, filters);
            const evidence = rowEvidence(organization, capability);
            const selected = organization.id === selectedId;
            return (
              <li key={organization.id} className={cn("grid grid-cols-[44px_minmax(0,1fr)_44px] border-b border-white/15", selected ? "bg-[var(--atlas-signal)] text-[var(--atlas-ink)]" : "text-white")}>
                <span className={cn("m-3 flex size-8 items-center justify-center rounded-full border text-sm font-bold", selected ? "border-[rgba(36,40,39,0.35)]" : "border-white/30 text-white/80")}>{index + 1}</span>
                <button type="button" onClick={() => onSelect(organization.id)} className="min-w-0 py-4 text-left">
                  <span className="block truncate text-sm font-extrabold tracking-[-0.015em]">{organization.name}</span>
                  <span className={cn("mt-1 block truncate text-[11px]", selected ? "text-[rgba(36,40,39,0.65)]" : "text-white/60")}>{organization.primaryLocation?.name ?? "Location under review"}</span>
                  <span className={cn("mt-1.5 block line-clamp-2 text-[11px] leading-4", selected ? "text-[rgba(36,40,39,0.8)]" : "text-white/80")}>{capability?.name ?? "Technology not yet reviewed"}</span>
                  <span className={cn("mt-2 inline-flex rounded-lg border px-2 py-1 text-[9px] font-bold", selected ? "border-[rgba(36,40,39,0.25)] bg-[var(--atlas-ink)] text-white" : "border-white/25 text-white/80")}>{evidenceStrengthLabel(capability?.sourceConfidence ?? organization.sourceConfidence)} evidence · {evidence.length} {evidence.length === 1 ? "source" : "sources"}</span>
                </button>
                <Link href={`/organizations/${organization.slug}`} className={cn("flex items-center justify-center no-underline hover:no-underline", selected ? "text-[var(--atlas-ink)]" : "text-white/80 hover:text-[var(--atlas-signal)]")} aria-label={`Open ${organization.name} profile`}>
                  <ChevronRight className="size-5" />
                </Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="flex flex-1 items-center justify-center px-8 text-center text-sm leading-6 text-white/60">No published organizations are visible in this map area.</div>
      )}
    </aside>
  );
}

export function PublicEvidenceLedger({ citations }: { citations: ReturnType<typeof rowEvidence> }) {
  if (!citations.length) return null;
  return (
    <section className="mt-4 grid overflow-hidden rounded-[24px] border border-[var(--atlas-border)] bg-white shadow-[var(--atlas-shadow-soft)] lg:grid-cols-[170px_minmax(0,1fr)]" aria-labelledby="public-evidence-title">
      <div className="flex min-h-24 items-center bg-[var(--atlas-ink)] px-5 py-5 text-white">
        <div>
          <p id="public-evidence-title" className="text-[15px] font-extrabold uppercase leading-5 tracking-[0.04em]">Public<br />evidence</p>
          <p className="mt-2 text-[10px] text-white/55">For this map view</p>
        </div>
      </div>
      <div className="grid divide-y divide-[var(--atlas-border)] sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        {citations.slice(0, 4).map((citation) => (
          <a key={citation.sourceUrl} href={citation.sourceUrl} target="_blank" rel="noreferrer" className="group flex min-w-0 gap-3 px-5 py-5 no-underline hover:bg-[var(--atlas-signal-soft)] hover:no-underline">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[var(--atlas-border)] bg-white text-[var(--atlas-ink)]"><FileCheck2 className="size-4" /></span>
            <span className="min-w-0">
              <strong className="block truncate text-xs text-[var(--atlas-ink)]">{citation.publisher}</strong>
              <span className="mt-1 block line-clamp-2 text-[11px] leading-4 text-[var(--atlas-muted)]">{citation.sourceTitle}</span>
              <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-[var(--atlas-ink)]">Open source <ExternalLink className="size-3" /></span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

export function LookbookPeek({
  organization,
  capability,
  filters,
  onClose
}: {
  organization: AtlasExplorerOrganization;
  capability: AtlasExplorerCapability | null;
  filters: AtlasQuery;
  onClose: () => void;
}) {
  const evidence = rowEvidence(organization, capability);
  const alignment = selectedAlignment(capability, filters);
  const confidence = alignment?.confidence ?? capability?.sourceConfidence ?? organization.sourceConfidence;
  const summary = alignment?.alignmentSummary ?? capability?.summary ?? organization.description;
  const location = organization.primaryLocation;
  const verificationStatus = organization.freshnessStatus === "current"
    ? `Last verified ${formatDate(organization.lastReviewedAt)}`
    : organization.freshnessStatus === "review_due"
      ? "Review due"
      : "Out of date";

  return (
    <aside
      className="absolute inset-x-3 bottom-3 z-[1001] max-h-[276px] overflow-y-auto rounded-2xl border border-white/90 bg-white p-4 shadow-[var(--atlas-shadow-float)] sm:inset-x-auto sm:right-4 sm:top-4 sm:bottom-auto sm:max-h-[378px] sm:w-[350px]"
      aria-label={`Selected organization: ${organization.name}`}
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--atlas-primary-soft)] text-[var(--atlas-primary)] ring-1 ring-[var(--atlas-primary-border)]" aria-hidden="true">
          <Building2 className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[var(--atlas-ink)]">{organization.name}</p>
          <p className="mt-0.5 truncate text-[11px] text-[var(--atlas-muted)]">
            {toTitleCase(organization.entityKind)}{location ? ` · ${location.name}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--atlas-muted)] hover:bg-[var(--atlas-surface-muted)] hover:text-[var(--atlas-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-primary)]"
          aria-label={`Close ${organization.name} preview`}
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-3 rounded-xl border border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] p-3">
        <p className="text-[11px] font-semibold text-[var(--atlas-violet)]">
          {alignment ? alignmentTypeLabel(alignment.matchType) : "Reviewed technology"}
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-[var(--atlas-ink-soft)]">{capability?.name ?? "Organization profile"}</p>
        <p className="mt-1 line-clamp-3 text-[11px] leading-[1.1rem] text-[var(--atlas-muted)]">{summary}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold">
        <span className={cn(
          "rounded-full px-2.5 py-1",
          confidence === "high" ? "bg-[var(--atlas-primary-soft)] text-[var(--atlas-primary)]" : confidence === "moderate" ? "bg-[var(--atlas-amber-soft)] text-[var(--atlas-amber)]" : "bg-[var(--atlas-danger-soft)] text-[var(--atlas-danger)]"
        )}>{alignment ? `${evidenceStrengthLabel(confidence)} public evidence` : `${evidenceStrengthLabel(confidence)} public evidence`}</span>
        <span className="rounded-full bg-[var(--atlas-surface-muted)] px-2.5 py-1 text-[var(--atlas-muted)]">{evidence.length} {evidence.length === 1 ? "source" : "sources"}</span>
        <span className={cn(
          "rounded-full px-2.5 py-1",
          organization.freshnessStatus === "current" ? "bg-[var(--atlas-primary-soft)] text-[var(--atlas-primary)]" : "bg-[var(--atlas-amber-soft)] text-[var(--atlas-amber)]"
        )}>{verificationStatus}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          href={`/organizations/${organization.slug}`}
          className="atlas-primary-button col-span-2 h-10 gap-2 px-3 text-xs"
        >
          View profile
          <ArrowRight className="size-3.5" />
        </Link>
        <Link
          href={`/collections?addType=organization&addId=${organization.id}&returnTo=${encodeURIComponent("/")}`}
          className="atlas-secondary-button h-10 gap-1.5 px-2 text-[11px]"
        >
          <BookmarkPlus className="size-3.5" />
          Add to Working List
        </Link>
        {evidence[0] ? (
          <a
            href={evidence[0].sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="atlas-secondary-button h-10 gap-1.5 px-2 text-[11px]"
          >
            Source
            <ExternalLink className="size-3.5" />
          </a>
        ) : (
          <span className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--atlas-surface-muted)] px-2 text-[11px] font-semibold text-[var(--atlas-muted)]">No public link</span>
        )}
      </div>
    </aside>
  );
}

export function FilterSelect({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold text-[var(--atlas-ink-soft)]">
      {label}
      <span className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full appearance-none rounded-xl border border-[var(--atlas-border)] bg-white px-3 pr-9 text-sm font-normal text-[var(--atlas-ink)] outline-none focus:border-[var(--atlas-primary)] focus:ring-4 focus:ring-[rgba(31,90,67,0.1)]"
        >
          <option value="">All {label.toLowerCase()}s</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--atlas-muted)]" />
      </span>
    </label>
  );
}

export function MobileOrganizationCard({
  organization,
  capability,
  filters,
  expanded,
  selected,
  detailLoading,
  detailError,
  onToggle
}: {
  organization: AtlasExplorerOrganization;
  capability: AtlasExplorerCapability | null;
  filters: AtlasQuery;
  expanded: boolean;
  selected: boolean;
  detailLoading: boolean;
  detailError?: string;
  onToggle: () => void;
}) {
  const evidence = rowEvidence(organization, capability);
  const alignment = selectedAlignment(capability, filters);
  const location = organization.primaryLocation;
  const confidence = alignment?.confidence ?? capability?.sourceConfidence ?? organization.sourceConfidence;

  return (
    <li className={cn("bg-white", selected && "bg-[var(--atlas-coral-soft)]")}>
      <button
        type="button"
        className="w-full px-4 py-4 text-left"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={`${expanded ? "Collapse" : "Expand"} ${organization.name}`}
      >
        <span className="flex items-start gap-3">
          {expanded ? <ChevronDown className="mt-0.5 size-4 shrink-0 text-[var(--atlas-primary)]" /> : <ChevronRight className="mt-0.5 size-4 shrink-0 text-[var(--atlas-muted)]" />}
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-[var(--atlas-primary)]">{organization.name}</span>
            <span className="mt-1 block text-xs leading-5 text-[var(--atlas-ink-soft)]">{capability?.name ?? "Technology not yet reviewed"}</span>
            <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--atlas-muted)]">
              <span>{location?.provinceTerritory ?? "Location under review"}</span>
              <span>{evidence.length} {evidence.length === 1 ? "source" : "sources"}</span>
              <span>Last verified {formatDate(capability?.lastReviewedAt ?? organization.lastReviewedAt)}</span>
            </span>
          </span>
        </span>
      </button>

      {expanded ? (
        <div className="border-t border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] px-4 py-4">
          {detailLoading ? <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-[var(--atlas-muted)]"><LoaderCircle className="size-3.5 animate-spin" />Loading the complete profile…</p> : null}
          {detailError ? <p className="mb-3 text-xs font-semibold text-[var(--atlas-danger)]">{detailError} The reviewed preview remains available below.</p> : null}
          <h3 className="text-xs font-bold text-[var(--atlas-ink)]">{alignment ? `Why it may fit ${alignmentSubject(alignment)}` : "What it does"}</h3>
          <p className="mt-2 text-xs leading-5 text-[var(--atlas-ink-soft)]">{alignment?.alignmentSummary ?? capability?.summary ?? organization.description}</p>

          {capability?.defenceApplications.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {capability.defenceApplications.slice(0, 3).map((item) => (
                <span key={item} className="rounded bg-white px-2 py-1 text-[10px] font-medium text-[var(--atlas-muted)] ring-1 ring-[var(--atlas-border)]">{item}</span>
              ))}
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--atlas-border)] pt-4 text-xs">
            <div>
              <span className="block text-[10px] text-[var(--atlas-muted)]">{alignment ? "Our assessment" : "Public evidence"}</span>
              <span className={cn(
                "mt-1 inline-flex rounded px-2 py-1 text-[10px] font-semibold",
                confidence === "high" ? "bg-[var(--atlas-primary-soft)] text-[var(--atlas-primary)]" : confidence === "moderate" ? "bg-[var(--atlas-amber-soft)] text-[var(--atlas-amber)]" : "bg-[var(--atlas-danger-soft)] text-[var(--atlas-danger)]"
              )}>{evidenceStrengthLabel(confidence)}</span>
            </div>
            <div>
              <span className="block text-[10px] text-[var(--atlas-muted)]">Location accuracy</span>
              <span className="mt-1 block font-medium text-[var(--atlas-ink-soft)]">{location ? locationAccuracyLabel(location.geographicConfidence) : "Not verified"}</span>
            </div>
          </div>

          {evidence[0] ? (
            <a href={evidence[0].sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-start gap-1 text-xs font-semibold text-[var(--atlas-primary)] no-underline hover:underline">
              <span>Open source</span>
              <ExternalLink className="mt-0.5 size-3 shrink-0" />
            </a>
          ) : null}
          <Link href={`/organizations/${organization.slug}`} className="atlas-primary-button mt-4 h-10 w-full gap-2 px-3 text-xs">
            Explore the organization
            <ExternalLink className="size-3.5" />
          </Link>
        </div>
      ) : null}
    </li>
  );
}

export function OrganizationRows({
  organization,
  capability,
  filters,
  expanded,
  selected,
  detailLoading,
  detailError,
  rowRef,
  onSelect,
  onToggleExpanded
}: {
  organization: AtlasExplorerOrganization;
  capability: AtlasExplorerCapability | null;
  filters: AtlasQuery;
  expanded: boolean;
  selected: boolean;
  detailLoading: boolean;
  detailError?: string;
  rowRef: (node: HTMLTableRowElement | null) => void;
  onSelect: () => void;
  onToggleExpanded: () => void;
}) {
  const evidence = rowEvidence(organization, capability);
  const alignment = selectedAlignment(capability, filters);
  const location = organization.primaryLocation;
  const confidence = alignment?.confidence ?? capability?.sourceConfidence ?? organization.sourceConfidence;

  return (
    <>
      <tr
        ref={rowRef}
        className={cn(
          "cursor-pointer border-b border-[var(--atlas-border)] bg-white text-xs text-[var(--atlas-ink-soft)] outline-none hover:bg-[var(--atlas-surface-muted)] focus-visible:bg-[var(--atlas-surface-muted)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--atlas-primary)]",
          selected && "bg-[var(--atlas-coral-soft)]",
          expanded && "border-x border-x-[var(--atlas-coral)] border-t border-t-[var(--atlas-coral)]"
        )}
        onClick={onSelect}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          onSelect();
        }}
        tabIndex={0}
        aria-selected={selected}
      >
        <td className="px-3 py-3 align-middle">
          <button
            type="button"
            className="flex size-6 items-center justify-center rounded text-[var(--atlas-ink-soft)] hover:bg-[var(--atlas-primary-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-primary)]"
            aria-expanded={expanded}
            aria-label={`${expanded ? "Collapse" : "Expand"} ${organization.name}`}
            onClick={(event) => {
              event.stopPropagation();
              onToggleExpanded();
            }}
          >
            {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        </td>
        <th scope="row" className="px-2 py-3 text-[13px] font-semibold text-[var(--atlas-primary)]">{organization.name}</th>
        <td className="max-w-[280px] px-3 py-3 leading-4">{capability?.name ?? "Technology not yet reviewed"}</td>
        <td className="px-3 py-3">{location?.provinceTerritory ?? "Location under review"}</td>
        <td className="px-3 py-3">
          {alignment ? (
            <span className={cn(
              "inline-flex rounded px-2 py-1 text-[10px] font-semibold",
              alignment.matchType === "public_source_alignment" ? "bg-[var(--atlas-violet-soft)] text-[var(--atlas-violet)]" : "bg-[var(--atlas-amber-soft)] text-[var(--atlas-amber)]"
            )}>
              {alignmentTypeLabel(alignment.matchType)}
            </span>
          ) : (
            <span className="inline-flex rounded bg-[var(--atlas-surface-muted)] px-2 py-1 text-[10px] font-semibold text-[var(--atlas-muted)]">Reviewed profile</span>
          )}
        </td>
        <td className="px-3 py-3 font-medium text-[var(--atlas-primary)]">{evidence.length} {evidence.length === 1 ? "source" : "sources"}</td>
        <td className="whitespace-nowrap px-3 py-3">{formatDate(capability?.lastReviewedAt ?? organization.lastReviewedAt)}</td>
      </tr>
      {expanded ? (
        <tr className="border-x border-b border-[var(--atlas-coral)] bg-[var(--atlas-surface-muted)]">
          <td colSpan={7} className="p-0">
            {detailLoading ? <p className="flex items-center gap-2 border-b border-[var(--atlas-border)] px-4 py-3 text-xs font-semibold text-[var(--atlas-muted)]"><LoaderCircle className="size-3.5 animate-spin" />Loading the complete profile…</p> : null}
            {detailError ? <p className="border-b border-[var(--atlas-border)] px-4 py-3 text-xs font-semibold text-[var(--atlas-danger)]">{detailError} The reviewed preview remains available below.</p> : null}
            <div className="grid gap-0 px-4 py-4 lg:grid-cols-[1.1fr_0.9fr_0.78fr]">
              <section className="pr-5 lg:border-r lg:border-[var(--atlas-primary-border)]" aria-labelledby={`why-${organization.id}`}>
                <h3 id={`why-${organization.id}`} className="text-xs font-bold text-[var(--atlas-ink)]">
                  {alignment ? `Why it may fit ${alignmentSubject(alignment)}` : "What it does"}
                </h3>
                <p className="mt-2 text-xs leading-5 text-[var(--atlas-ink-soft)]">{alignment?.alignmentSummary ?? capability?.summary ?? organization.description}</p>
                {capability?.defenceApplications.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {capability.defenceApplications.slice(0, 3).map((item) => (
                      <span key={item} className="rounded bg-white px-2 py-1 text-[10px] font-medium text-[var(--atlas-muted)] ring-1 ring-[var(--atlas-border)]">{item}</span>
                    ))}
                  </div>
                ) : null}
              </section>

              <section className="border-t border-[var(--atlas-primary-border)] py-4 lg:border-r lg:border-t-0 lg:px-5 lg:py-0" aria-labelledby={`evidence-${organization.id}`}>
                <h3 id={`evidence-${organization.id}`} className="text-xs font-bold text-[var(--atlas-ink)]">Sources</h3>
                <ul className="mt-2 space-y-2">
                  {evidence.slice(0, 3).map((citation) => (
                    <li key={citation.id} className="text-xs leading-5">
                      <a href={citation.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1 font-medium text-[var(--atlas-primary)] no-underline hover:underline">
                        <span>{citation.sourceTitle}</span>
                        <ExternalLink className="mt-0.5 size-3 shrink-0" />
                      </a>
                      <span className="block text-[10px] text-[var(--atlas-muted)]">{citation.publisher}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="border-t border-[var(--atlas-primary-border)] pt-4 lg:border-t-0 lg:pl-5 lg:pt-0" aria-labelledby={`posture-${organization.id}`}>
                <h3 id={`posture-${organization.id}`} className="text-xs font-bold text-[var(--atlas-ink)]">What supports this</h3>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-xs lg:grid-cols-1">
                  <div>
                    <dt className="text-[10px] text-[var(--atlas-muted)]">{alignment ? "Our assessment" : "Public evidence"}</dt>
                    <dd className={cn(
                      "mt-1 inline-flex rounded px-2 py-1 text-[10px] font-semibold",
                      confidence === "high" ? "bg-[var(--atlas-primary-soft)] text-[var(--atlas-primary)]" : confidence === "moderate" ? "bg-[var(--atlas-amber-soft)] text-[var(--atlas-amber)]" : "bg-[var(--atlas-danger-soft)] text-[var(--atlas-danger)]"
                    )}>{evidenceStrengthLabel(confidence)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-[var(--atlas-muted)]">Location accuracy</dt>
                    <dd className="mt-1 font-medium text-[var(--atlas-ink-soft)]">{location ? locationAccuracyLabel(location.geographicConfidence) : "Not verified"}</dd>
                  </div>
                </dl>
                <Link href={`/organizations/${organization.slug}`} className="atlas-primary-button mt-4 h-9 w-full gap-2 px-3 text-xs">
                  Explore the organization
                  <ExternalLink className="size-3.5" />
                </Link>
              </section>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
