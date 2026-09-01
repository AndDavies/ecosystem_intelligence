"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookmarkPlus,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  FileCheck2,
  LoaderCircle,
  Minus,
  X
} from "lucide-react";
import { evidenceStrengthChipClass } from "@/components/atlas/alignment-match-card";
import { OrganizationIdentityMark, organizationLogoSource } from "@/components/atlas/organization-identity";
import {
  alignmentSubject,
  alignmentTypeLabel,
  evidenceStrengthLabel,
  locationAccuracyLabel,
  publicLanguage
} from "@/lib/atlas/presentation";
import { capabilityMatchesGuidedSearchFocus } from "@/lib/atlas/guided-search";
import { cn, formatDate, toTitleCase } from "@/lib/utils";
import type { AtlasExplorerCapability, AtlasExplorerOrganization, AtlasQuery } from "@/types/atlas";

export function relevantCapability(organization: AtlasExplorerOrganization, filters: AtlasQuery): AtlasExplorerCapability | null {
  const hasCapabilityConstraint = Boolean(
    filters.focus?.length ||
    filters.domain ||
    filters.mission ||
    filters.demand ||
    filters.capability ||
    filters.cluster
  );
  if (filters.program && !hasCapabilityConstraint) return null;

  return (
    organization.capabilities.find((capability) => {
      if (filters.focus?.length && !filters.focus.some((focus) => capabilityMatchesGuidedSearchFocus(capability, focus))) return false;
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

export function capabilityResultLabel(filters: AtlasQuery) {
  if (filters.program) return "Organization-level program record";
  if (filters.cluster) return "Cluster-linked organization";
  return "Technology not yet reviewed";
}

function capabilityResultEyebrow(filters: AtlasQuery) {
  if (filters.program) return "Reviewed organization participation";
  if (filters.cluster) return "Reviewed cluster connection";
  return "Organization profile";
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
  returnTo,
  onSelect
}: {
  organizations: AtlasExplorerOrganization[];
  totalInView: number;
  filters: AtlasQuery;
  selectedId: string | null;
  returnTo: string;
  onSelect: (id: string) => void;
}) {
  return (
    <aside data-results-rail className="atlas-dark-panel hidden h-full min-h-0 overflow-hidden lg:flex lg:flex-col" aria-label="Organizations in the current map view">
      <div className="border-b border-white/15 px-5 py-5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/60">Organizations in view</p>
        <p className="mt-2 text-lg font-extrabold tracking-[-0.025em] text-[var(--atlas-signal)]">{totalInView} reviewed {totalInView === 1 ? "organization" : "organizations"}</p>
        {organizations.length < totalInView ? <p className="mt-1 text-[11px] text-white/55">{organizations.length} detailed results loaded below.</p> : null}
        <p className="mt-1 text-[11px] text-white/55">Pan or zoom the map to refine this list.</p>
      </div>
      {organizations.length ? (
        <ol className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {organizations.map((organization) => {
            const capability = relevantCapability(organization, filters);
            const evidence = rowEvidence(organization, capability);
            const selected = organization.id === selectedId;
            return (
              <li key={organization.id} className={cn("grid grid-cols-[minmax(0,1fr)_44px] border-b border-l-2 border-b-white/15", selected ? "border-l-[var(--atlas-signal)] bg-[var(--atlas-signal-soft)] text-[var(--atlas-ink)]" : "border-l-transparent text-white")}>
                <button type="button" onClick={() => onSelect(organization.id)} aria-current={selected || undefined} className={cn("flex min-w-0 items-start gap-3 py-4 pl-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset", selected ? "focus-visible:ring-[var(--atlas-ink)]" : "hover:bg-white/[0.06] focus-visible:ring-[var(--atlas-signal)]")}>
                  <OrganizationIdentityMark name={organization.name} logoUrl={organizationLogoSource(organization)} size="sm" className="mt-0.5" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-extrabold tracking-[-0.015em]">{organization.name}</span>
                    <span className={cn("mt-1 block line-clamp-2 text-[11px] font-semibold leading-4", selected ? "text-[rgba(36,40,39,0.8)]" : "text-white/85")}>{capability?.name ?? capabilityResultLabel(filters)}</span>
                    <span className={cn("mt-1 block truncate text-[10px]", selected ? "text-[rgba(36,40,39,0.6)]" : "text-white/55")}>{organization.primaryLocation?.name ?? "Location under review"}</span>
                    <span className={cn("mt-2 inline-flex rounded-lg border px-2 py-1 text-[9px] font-bold", selected ? "border-[rgba(36,40,39,0.3)] text-[var(--atlas-ink)]" : "border-white/25 text-white/80")}>{evidence.length ? `${evidenceStrengthLabel(capability?.sourceConfidence ?? organization.sourceConfidence)} evidence · ${evidence.length} ${evidence.length === 1 ? "source" : "sources"}` : "Open profile for sources"}</span>
                  </span>
                </button>
                <Link href={`/organizations/${organization.slug}?returnTo=${encodeURIComponent(returnTo)}`} prefetch={false} className={cn("flex items-center justify-center no-underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset", selected ? "text-[var(--atlas-ink)] focus-visible:ring-[var(--atlas-ink)]" : "text-white/80 hover:text-[var(--atlas-signal)] focus-visible:ring-[var(--atlas-signal)]")} aria-label={`Open ${organization.name} profile`}>
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

export type MobileResultsSheetState = "collapsed" | "preview" | "expanded";

export function MobileResultsSheet({
  state,
  organizations,
  totalInView,
  filters,
  selectedId,
  selectedOrganization,
  selectedCapability,
  detailLoading,
  returnTo,
  onStateChange,
  onSelect
}: {
  state: MobileResultsSheetState;
  organizations: AtlasExplorerOrganization[];
  totalInView: number;
  filters: AtlasQuery;
  selectedId: string | null;
  selectedOrganization: AtlasExplorerOrganization | null;
  selectedCapability: AtlasExplorerCapability | null;
  detailLoading: boolean;
  returnTo: string;
  onStateChange: (state: MobileResultsSheetState) => void;
  onSelect: (id: string) => void;
}) {
  const previewOrganizations = state === "preview" ? organizations.slice(0, 4) : organizations;
  return (
    <section
      id="mobile-results-sheet"
      className={cn(
        "absolute inset-x-2 bottom-2 z-[1002] flex min-h-16 flex-col overflow-hidden rounded-[16px] border border-white/85 bg-[var(--atlas-ink)] text-white shadow-[var(--atlas-shadow-float)] transition-[height] duration-200 lg:hidden",
        state === "collapsed" && "h-16",
        state === "preview" && "h-[44%]",
        state === "expanded" && "h-[calc(100%_-_1rem)]"
      )}
      aria-label="Organizations in the current map view"
    >
      <div className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-white/15 px-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-white">
            <span className="sm:hidden">{totalInView} in view</span>
            <span className="hidden sm:inline">{totalInView} {totalInView === 1 ? "organization" : "organizations"} in view</span>
          </p>
          <p className="mt-0.5 text-[10px] text-white/58">Select a result to inspect it on the map.</p>
        </div>
        <div className="flex shrink-0 rounded-full border border-white/20 bg-white/[0.08] p-0.5" aria-label="Results sheet size">
          <button type="button" onClick={() => onStateChange("collapsed")} className={cn("inline-flex size-9 items-center justify-center rounded-full text-white/70", state === "collapsed" && "bg-white text-[var(--atlas-ink)]")} aria-label="Collapse results" aria-pressed={state === "collapsed"}><ChevronDown className="size-4" /></button>
          <button type="button" onClick={() => onStateChange("preview")} className={cn("inline-flex size-9 items-center justify-center rounded-full text-white/70", state === "preview" && "bg-white text-[var(--atlas-ink)]")} aria-label="Preview results" aria-pressed={state === "preview"}><Minus className="size-4" /></button>
          <button type="button" onClick={() => onStateChange("expanded")} className={cn("inline-flex size-9 items-center justify-center rounded-full text-white/70", state === "expanded" && "bg-white text-[var(--atlas-ink)]")} aria-label="Expand results" aria-pressed={state === "expanded"}><ChevronUp className="size-4" /></button>
        </div>
      </div>
      {state !== "collapsed" ? (
        state === "preview" && selectedOrganization ? (
          <MobileSelectedPreview
            organization={selectedOrganization}
            capability={selectedCapability}
            filters={filters}
            detailLoading={detailLoading}
            returnTo={returnTo}
          />
        ) : organizations.length ? (
          <ol className="min-h-0 flex-1 overflow-y-auto overscroll-contain" aria-label="Map results">
            {previewOrganizations.map((organization) => {
              const capability = relevantCapability(organization, filters);
              const evidence = rowEvidence(organization, capability);
              const selected = organization.id === selectedId;
              return (
                <li key={organization.id} className={cn("border-b border-l-2 border-b-white/15", selected ? "border-l-[var(--atlas-signal)] bg-[var(--atlas-signal-soft)] text-[var(--atlas-ink)]" : "border-l-transparent")}>
                  <button type="button" onClick={() => onSelect(organization.id)} aria-current={selected || undefined} className={cn("grid w-full grid-cols-[32px_minmax(0,1fr)_auto] gap-3 px-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset", selected ? "focus-visible:ring-[var(--atlas-ink)]" : "hover:bg-white/[0.06] focus-visible:ring-[var(--atlas-signal)]")}>
                    <OrganizationIdentityMark name={organization.name} logoUrl={organizationLogoSource(organization)} size="xs" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-extrabold">{organization.name}</span>
                      <span className={cn("mt-1 block truncate text-[11px] font-semibold", selected ? "text-[var(--atlas-ink)]/75" : "text-white/70")}>{capability?.name ?? capabilityResultLabel(filters)}</span>
                    </span>
                    <span className={cn("self-center rounded-full border px-2 py-1 text-[9px] font-bold", selected ? "border-[var(--atlas-ink)]/20" : "border-white/20 text-white/70")}>{evidence.length ? `${evidence.length} ${evidence.length === 1 ? "source" : "sources"}` : "Profile"}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="flex flex-1 items-center justify-center px-8 text-center text-sm leading-6 text-white/60">No published organizations are visible in this map area.</div>
        )
      ) : null}
    </section>
  );
}

function MobileSelectedPreview({
  organization,
  capability,
  filters,
  detailLoading,
  returnTo
}: {
  organization: AtlasExplorerOrganization;
  capability: AtlasExplorerCapability | null;
  filters: AtlasQuery;
  detailLoading: boolean;
  returnTo: string;
}) {
  const evidence = rowEvidence(organization, capability);
  const alignment = selectedAlignment(capability, filters);
  const summary = alignment?.alignmentSummary ?? capability?.summary ?? organization.description;
  const confidence = alignment?.confidence ?? capability?.sourceConfidence ?? organization.sourceConfidence;
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
      <div className="rounded-[12px] bg-white p-4 text-[var(--atlas-ink)]">
        <div className="flex items-start gap-3">
          <OrganizationIdentityMark name={organization.name} logoUrl={organizationLogoSource(organization)} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-extrabold">{organization.name}</p>
            <p className="mt-1 truncate text-xs text-[var(--atlas-muted)]">{organization.primaryLocation?.name ?? "Location under review"}</p>
          </div>
          {detailLoading ? <LoaderCircle className="mt-1 size-4 animate-spin text-[var(--atlas-evidence)]" aria-label="Loading the complete organization profile" /> : null}
        </div>
        <div className="mt-3 border-l-2 border-[var(--atlas-signal)] pl-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--atlas-evidence)]">{alignment ? alignmentTypeLabel(alignment.matchType) : capability ? "Reviewed technology" : capabilityResultEyebrow(filters)}</p>
          <p className="mt-1 text-sm font-extrabold">{capability?.name ?? "Organization profile"}</p>
          <p className="mt-1 line-clamp-3 text-xs leading-5 text-[var(--atlas-muted)]">{summary}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold">
          <span className={cn("rounded-full px-2.5 py-1 ring-1", evidenceStrengthChipClass[confidence])}>{publicLanguage.evidenceStrength}: {evidenceStrengthLabel(confidence)}</span>
          <span className="rounded-full bg-[var(--atlas-surface-muted)] px-2.5 py-1 text-[var(--atlas-muted)]">{evidence.length ? `${evidence.length} ${evidence.length === 1 ? "source" : "sources"}` : "Sources on profile"}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link href={`/organizations/${organization.slug}?returnTo=${encodeURIComponent(returnTo)}`} prefetch={false} className="atlas-primary-button h-10 gap-1.5 px-2 text-xs">View profile<span className="sr-only">: {organization.name}</span> <ArrowRight className="size-3.5" /></Link>
          <Link href={`/collections?addType=organization&addId=${organization.id}&returnTo=${encodeURIComponent(returnTo)}`} className="atlas-secondary-button h-10 gap-1.5 px-2 text-xs"><BookmarkPlus className="size-3.5" />Working List</Link>
        </div>
      </div>
    </div>
  );
}

export function PublicEvidenceLedger({ citations }: { citations: ReturnType<typeof rowEvidence> }) {
  if (!citations.length) return null;
  return (
    <section className="mt-4 grid overflow-hidden rounded-[18px] bg-white shadow-[var(--atlas-shadow-soft)] lg:grid-cols-[170px_minmax(0,1fr)]" aria-labelledby="public-evidence-title">
      <div className="flex min-h-24 items-center bg-[var(--atlas-ink)] px-5 py-5 text-white">
        <div>
          <p id="public-evidence-title" className="text-[15px] font-extrabold uppercase leading-5 tracking-[0.04em]">Public<br />evidence</p>
          <p className="mt-2 text-[10px] text-white/55">For this map view</p>
        </div>
      </div>
      <div className="grid divide-y divide-[var(--atlas-border)] sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        {citations.slice(0, 4).map((citation) => (
          <a key={citation.sourceUrl} href={citation.sourceUrl} target="_blank" rel="noreferrer" data-launch-durable-source="true" className="group flex min-w-0 gap-3 px-5 py-5 no-underline hover:bg-[var(--atlas-signal-soft)] hover:no-underline">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[var(--atlas-border)] bg-white text-[var(--atlas-ink)]"><FileCheck2 className="size-4" /></span>
            <span className="min-w-0">
              <strong className="block truncate text-xs text-[var(--atlas-ink)]">{citation.publisher}</strong>
              <span className="mt-1 block line-clamp-2 text-[11px] leading-4 text-[var(--atlas-muted)]">{citation.sourceTitle}</span>
              <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-[var(--atlas-ink)]">Open source <ExternalLink className="size-3" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></span>
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
  returnTo,
  onClose
}: {
  organization: AtlasExplorerOrganization;
  capability: AtlasExplorerCapability | null;
  filters: AtlasQuery;
  returnTo: string;
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
        <OrganizationIdentityMark name={organization.name} logoUrl={organizationLogoSource(organization)} size="sm" />
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
        <p className="text-[11px] font-semibold text-[var(--atlas-evidence)]">
          {alignment ? alignmentTypeLabel(alignment.matchType) : capability ? "Reviewed technology" : capabilityResultEyebrow(filters)}
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-[var(--atlas-ink-soft)]">{capability?.name ?? "Organization profile"}</p>
        <p className="mt-1 line-clamp-3 text-[11px] leading-[1.1rem] text-[var(--atlas-muted)]">{summary}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold">
        <span className={cn("rounded-full px-2.5 py-1 ring-1", evidenceStrengthChipClass[confidence])}>{publicLanguage.evidenceStrength}: {evidenceStrengthLabel(confidence)}</span>
        <span className="rounded-full bg-[var(--atlas-surface-muted)] px-2.5 py-1 text-[var(--atlas-muted)]">{evidence.length ? `${evidence.length} ${evidence.length === 1 ? "source" : "sources"}` : "Sources on profile"}</span>
        <span className={cn(
          "rounded-full px-2.5 py-1",
          organization.freshnessStatus === "current" ? "bg-[var(--atlas-primary-soft)] text-[var(--atlas-primary)]" : "bg-[var(--atlas-amber-soft)] text-[var(--atlas-amber)]"
        )}>{verificationStatus}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          href={`/organizations/${organization.slug}?returnTo=${encodeURIComponent(returnTo)}`}
          prefetch={false}
          className="atlas-primary-button col-span-2 h-10 gap-2 px-3 text-xs"
        >
          View profile<span className="sr-only">: {organization.name}</span>
          <ArrowRight className="size-3.5" />
        </Link>
        <Link
          href={`/collections?addType=organization&addId=${organization.id}&returnTo=${encodeURIComponent(returnTo)}`}
          className="atlas-secondary-button h-10 gap-1.5 px-2 text-[11px]"
        >
          <BookmarkPlus className="size-3.5" />
          Add to Working List
        </Link>
        <Link
          href={`/organizations/${organization.slug}?returnTo=${encodeURIComponent(returnTo)}#evidence`}
          prefetch={false}
          className="atlas-secondary-button h-10 gap-1.5 px-2 text-[11px]"
        >
          Inspect evidence
          <ExternalLink className="size-3.5" />
        </Link>
      </div>
    </aside>
  );
}

export function FilterSelect({
  label,
  allOptionLabel,
  value,
  options,
  onChange
}: {
  label: string;
  allOptionLabel: string;
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
          <option value="">{allOptionLabel}</option>
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
  returnTo,
  onToggle
}: {
  organization: AtlasExplorerOrganization;
  capability: AtlasExplorerCapability | null;
  filters: AtlasQuery;
  expanded: boolean;
  selected: boolean;
  detailLoading: boolean;
  detailError?: string;
  returnTo: string;
  onToggle: () => void;
}) {
  const evidence = rowEvidence(organization, capability);
  const alignment = selectedAlignment(capability, filters);
  const location = organization.primaryLocation;
  const confidence = alignment?.confidence ?? capability?.sourceConfidence ?? organization.sourceConfidence;

  return (
    <li className={cn("border-l-2 bg-white", selected ? "border-l-[var(--atlas-signal)] bg-[var(--atlas-signal-soft)]" : "border-l-transparent")}>
      <button
        type="button"
        className="w-full px-4 py-4 text-left hover:bg-[var(--atlas-surface-muted)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--atlas-primary)]"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={`${expanded ? "Collapse" : "Expand"} ${organization.name}`}
      >
        <span className="flex items-start gap-3">
          {expanded ? <ChevronDown className="mt-2.5 size-4 shrink-0 text-[var(--atlas-primary)]" /> : <ChevronRight className="mt-2.5 size-4 shrink-0 text-[var(--atlas-muted)]" />}
          <OrganizationIdentityMark name={organization.name} logoUrl={organizationLogoSource(organization)} size="xs" className="mt-0.5" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-[var(--atlas-primary)]">{organization.name}</span>
            <span className="mt-1 block text-xs font-semibold leading-5 text-[var(--atlas-ink-soft)]">{capability?.name ?? capabilityResultLabel(filters)}</span>
            <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--atlas-muted)]">
              <span>{location?.provinceTerritory ?? "Location under review"}</span>
              <span>{evidence.length ? `${evidence.length} ${evidence.length === 1 ? "source" : "sources"}` : "Sources on profile"}</span>
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
              <span className="block text-[10px] text-[var(--atlas-muted)]">{alignment ? publicLanguage.assessment : publicLanguage.evidenceStrength}</span>
              <span className={cn("mt-1 inline-flex rounded px-2 py-1 text-[10px] font-semibold ring-1", evidenceStrengthChipClass[confidence])}>{evidenceStrengthLabel(confidence)}</span>
            </div>
            <div>
              <span className="block text-[10px] text-[var(--atlas-muted)]">Location accuracy</span>
              <span className="mt-1 block font-medium text-[var(--atlas-ink-soft)]">{location ? locationAccuracyLabel(location.geographicConfidence) : "Not verified"}</span>
            </div>
          </div>

          {evidence[0] ? (
            <a href={evidence[0].sourceUrl} target="_blank" rel="noreferrer" data-launch-durable-source="true" className="mt-4 inline-flex items-start gap-1 text-xs font-semibold text-[var(--atlas-primary)] no-underline hover:underline">
              <span>Open source</span>
              <ExternalLink className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : null}
          <Link href={`/organizations/${organization.slug}?returnTo=${encodeURIComponent(returnTo)}#evidence`} prefetch={false} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--atlas-primary)] no-underline hover:underline">
            Inspect evidence
            <ExternalLink className="size-3" />
          </Link>
          <Link href={`/organizations/${organization.slug}?returnTo=${encodeURIComponent(returnTo)}`} prefetch={false} className="atlas-primary-button mt-4 h-10 w-full gap-2 px-3 text-xs">
            Explore the organization
            <ExternalLink className="size-3.5" />
          </Link>
          <Link href={`/collections?addType=organization&addId=${organization.id}&returnTo=${encodeURIComponent(returnTo)}`} className="atlas-secondary-button mt-2 h-10 w-full gap-1.5 px-3 text-xs">
            <BookmarkPlus className="size-3.5" />
            Add to Working List
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
  returnTo,
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
  returnTo: string;
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
          "cursor-pointer border-b border-l-2 border-b-[var(--atlas-border)] border-l-transparent bg-white text-xs text-[var(--atlas-ink-soft)] outline-none hover:bg-[var(--atlas-surface-muted)] focus-visible:bg-[var(--atlas-surface-muted)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--atlas-primary)]",
          selected && "border-l-[var(--atlas-signal)] bg-[var(--atlas-signal-soft)]",
          expanded && "border-x border-x-[var(--atlas-signal)] border-t border-t-[var(--atlas-signal)]"
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
        <th scope="row" className="px-2 py-3 text-[13px] font-semibold text-[var(--atlas-primary)]">
          <span className="flex items-center gap-2.5">
            <OrganizationIdentityMark name={organization.name} logoUrl={organizationLogoSource(organization)} size="xs" />
            <span className="min-w-0">{organization.name}</span>
          </span>
        </th>
        <td className="max-w-[280px] px-3 py-3 leading-4">{capability?.name ?? capabilityResultLabel(filters)}</td>
        <td className="px-3 py-3">{location?.provinceTerritory ?? "Location under review"}</td>
        <td className="px-3 py-3">
          {alignment ? (
            <span className={cn(
              "inline-flex rounded px-2 py-1 text-[10px] font-semibold",
              alignment.matchType === "public_source_alignment" ? "bg-[var(--atlas-evidence-soft)] text-[var(--atlas-evidence)]" : "bg-[var(--atlas-amber-soft)] text-[var(--atlas-amber)]"
            )}>
              {alignmentTypeLabel(alignment.matchType)}
            </span>
          ) : (
            <span className="inline-flex rounded bg-[var(--atlas-surface-muted)] px-2 py-1 text-[10px] font-semibold text-[var(--atlas-muted)]">Reviewed profile</span>
          )}
        </td>
        <td className="px-3 py-3 font-medium text-[var(--atlas-primary)]">{evidence.length ? `${evidence.length} ${evidence.length === 1 ? "source" : "sources"}` : "Open profile"}</td>
        <td className="whitespace-nowrap px-3 py-3">{formatDate(capability?.lastReviewedAt ?? organization.lastReviewedAt)}</td>
      </tr>
      {expanded ? (
        <tr className="border-x border-b border-[var(--atlas-signal)] bg-[var(--atlas-surface-muted)]">
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
                      <a href={citation.sourceUrl} target="_blank" rel="noreferrer" data-launch-durable-source="true" className="inline-flex items-start gap-1 font-medium text-[var(--atlas-primary)] no-underline hover:underline">
                        <span>{citation.sourceTitle}</span>
                        <ExternalLink className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                        <span className="sr-only"> (opens in a new tab)</span>
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
                    <dt className="text-[10px] text-[var(--atlas-muted)]">{alignment ? publicLanguage.assessment : publicLanguage.evidenceStrength}</dt>
                    <dd className={cn("mt-1 inline-flex rounded px-2 py-1 text-[10px] font-semibold ring-1", evidenceStrengthChipClass[confidence])}>{evidenceStrengthLabel(confidence)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-[var(--atlas-muted)]">Location accuracy</dt>
                    <dd className="mt-1 font-medium text-[var(--atlas-ink-soft)]">{location ? locationAccuracyLabel(location.geographicConfidence) : "Not verified"}</dd>
                  </div>
                </dl>
                <Link href={`/organizations/${organization.slug}?returnTo=${encodeURIComponent(returnTo)}`} prefetch={false} className="atlas-primary-button mt-4 h-9 w-full gap-2 px-3 text-xs">
                  Explore the organization
                  <ExternalLink className="size-3.5" />
                </Link>
                <Link href={`/collections?addType=organization&addId=${organization.id}&returnTo=${encodeURIComponent(returnTo)}`} className="atlas-secondary-button mt-2 h-9 w-full gap-1.5 px-3 text-xs">
                  <BookmarkPlus className="size-3.5" />
                  Add to Working List
                </Link>
                <Link href={`/organizations/${organization.slug}?returnTo=${encodeURIComponent(returnTo)}#evidence`} prefetch={false} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--atlas-primary)] no-underline hover:underline">
                  Inspect evidence
                  <ExternalLink className="size-3" />
                </Link>
              </section>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
