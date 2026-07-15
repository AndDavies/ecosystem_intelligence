"use client";

import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Download,
  ExternalLink,
  Filter,
  Info,
  List,
  LoaderCircle,
  Map as MapIcon,
  Search,
  SlidersHorizontal,
  X
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { AtlasMap } from "@/components/atlas/atlas-map";
import { atlasQueryToSearchParams } from "@/lib/atlas/query-params";
import { cn, formatDate, toTitleCase } from "@/lib/utils";
import type {
  AtlasCapability,
  AtlasDemandRequirement,
  AtlasDiscoveryResult,
  AtlasMissionArea,
  AtlasOrganization,
  AtlasQuery,
  AtlasQueryResult,
  AtlasRegion,
  AtlasTechnicalDomain
} from "@/types/atlas";

type ViewMode = "map" | "table";

interface AtlasExplorerProps {
  initialResult: AtlasQueryResult;
  initialFilters: AtlasQuery;
  regions: AtlasRegion[];
  technicalDomains: AtlasTechnicalDomain[];
  missionAreas: AtlasMissionArea[];
  demandRequirements: AtlasDemandRequirement[];
  generatedAt: string;
}

function relevantCapability(organization: AtlasOrganization, filters: AtlasQuery): AtlasCapability | null {
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

function rowEvidence(organization: AtlasOrganization, capability: AtlasCapability | null) {
  const citations = [
    ...organization.citations,
    ...(capability?.citations ?? []),
    ...(capability?.missionMatches.flatMap((match) => match.citations) ?? []),
    ...(capability?.demandMatches.flatMap((match) => match.citations) ?? [])
  ];
  return Array.from(new Map(citations.map((citation) => [citation.sourceUrl, citation])).values());
}

function selectedAlignment(capability: AtlasCapability | null, filters: AtlasQuery) {
  if (!capability) return null;
  if (filters.demand) return capability.demandMatches.find((match) => match.demandSlug === filters.demand) ?? null;
  if (filters.mission) return capability.missionMatches.find((match) => match.missionArea.slug === filters.mission) ?? null;
  return capability.missionMatches[0] ?? capability.demandMatches[0] ?? null;
}

function confidenceLabel(value: AtlasOrganization["sourceConfidence"]) {
  if (value === "needs_review") return "Needs review";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function filterWithout(filters: AtlasQuery, key: string): AtlasQuery {
  const next = { ...filters, page: 1 };
  if (key === "bounds") delete next.bounds;
  if (key === "query") delete next.query;
  if (key === "region") delete next.region;
  if (key === "type") delete next.type;
  if (key === "capability") delete next.capability;
  if (key === "domain") delete next.domain;
  if (key === "mission") delete next.mission;
  if (key === "demand") delete next.demand;
  if (key === "stage") delete next.stage;
  if (key === "program") delete next.program;
  return next;
}

export function AtlasExplorer({
  initialResult,
  initialFilters,
  regions,
  technicalDomains,
  missionAreas,
  demandRequirements,
  generatedAt
}: AtlasExplorerProps) {
  const [filters, setFilters] = useState<AtlasQuery>(initialFilters);
  const [result, setResult] = useState(initialResult);
  const [question, setQuestion] = useState(initialFilters.query ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(initialResult.organizations[0]?.id ?? null);
  const [expandedId, setExpandedId] = useState<string | null>(initialResult.organizations[0]?.id ?? null);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [loading, setLoading] = useState(false);
  const [discovery, setDiscovery] = useState<AtlasDiscoveryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportHref = useMemo(() => {
    const params = atlasQueryToSearchParams({ ...filters, page: 1, pageSize: 100 });
    params.set("export", "atlas-results");
    return `/api/export?${params.toString()}`;
  }, [filters]);

  async function load(nextFilters: AtlasQuery, options: { updateQuestion?: boolean } = {}) {
    setLoading(true);
    setError(null);
    try {
      const params = atlasQueryToSearchParams({ ...nextFilters, page: 1, pageSize: 100 });
      const response = await fetch(`/api/atlas?${params.toString()}`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("The published atlas could not be refreshed.");
      const nextResult = (await response.json()) as AtlasQueryResult;
      setResult(nextResult);
      setFilters({ ...nextFilters, page: 1 });
      const firstId = nextResult.organizations[0]?.id ?? null;
      setSelectedId(firstId);
      setExpandedId(firstId);
      if (options.updateQuestion) setQuestion(nextFilters.query ?? "");
      const browserParams = atlasQueryToSearchParams(nextFilters);
      window.history.replaceState(null, "", browserParams.size ? `/?${browserParams.toString()}` : "/");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "The published atlas could not be refreshed.");
    } finally {
      setLoading(false);
    }
  }

  async function submitDiscovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = question.trim();
    if (!query) {
      setDiscovery(null);
      await load({});
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query })
      });
      if (!response.ok) throw new Error("The question could not be interpreted.");
      const nextDiscovery = (await response.json()) as AtlasDiscoveryResult;
      setDiscovery(nextDiscovery);
      await load(nextDiscovery.filters);
    } catch (discoveryError) {
      setError(discoveryError instanceof Error ? discoveryError.message : "The question could not be interpreted.");
      setLoading(false);
    }
  }

  function updateSelection(id: string) {
    setSelectedId(id);
    setExpandedId(id);
  }

  const caveat = filters.demand
    ? "Demand matches are reviewed public-source alignments. They are not eligibility, endorsement, or procurement notices."
    : "Mission-fit notes are reviewed derived reads. Open a row to inspect their public evidence and caveats.";

  return (
    <div className="atlas-frame pb-8 pt-4 sm:pt-5">
      <form onSubmit={submitDiscovery} role="search" aria-label="Ask the Canadian public atlas">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#475467]" aria-hidden="true" />
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            className="h-[50px] w-full rounded-lg border border-[#cbd5e1] bg-white pl-12 pr-28 text-[15px] text-[#101828] shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none placeholder:text-[#667085] focus:border-[#0756d9] focus:ring-4 focus:ring-[#0756d9]/10 sm:text-base"
            placeholder="Ask by region, capability, or mission — e.g. underwater sensing in Atlantic Canada"
            aria-label="Natural-language atlas question"
            maxLength={500}
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 flex h-9 -translate-y-1/2 items-center gap-2 rounded-md bg-[#0756d9] px-4 text-sm font-semibold text-white hover:bg-[#0649b9] disabled:opacity-60"
            disabled={loading}
          >
            {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
            <span className="hidden sm:inline">Search</span>
            <span className="sm:hidden">Go</span>
          </button>
        </div>
      </form>

      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-h-9 flex-wrap items-center gap-2">
          {result.appliedFilters.map((filter) => (
            <button
              key={`${filter.key}-${filter.value}`}
              type="button"
              onClick={() => void load(filterWithout(filters, filter.key), { updateQuestion: filter.key === "query" })}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd5e1] bg-[#f8fafc] px-3 text-xs font-medium text-[#344054] hover:border-[#98a2b3] hover:bg-white"
              aria-label={`Remove ${filter.label}: ${filter.value}`}
            >
              <span>{filter.label}: {filter.value}</span>
              <X className="size-3.5" />
            </button>
          ))}
          {result.appliedFilters.length === 0 ? (
            <span className="inline-flex h-9 items-center rounded-md border border-[#cbd5e1] bg-[#f8fafc] px-3 text-xs font-medium text-[#475467]">
              Geography: Canada
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setFilterPanelOpen((value) => !value)}
            className="inline-flex h-9 items-center gap-2 rounded-md px-2.5 text-xs font-semibold text-[#0756d9] hover:bg-[#eff6ff]"
            aria-expanded={filterPanelOpen}
          >
            <SlidersHorizontal className="size-4" />
            Edit filters
          </button>
        </div>

        <p className="flex max-w-[460px] items-start gap-2 text-xs leading-5 text-[#667085] lg:justify-end lg:text-right">
          <Info className="mt-0.5 size-4 shrink-0 text-[#475467]" aria-hidden="true" />
          <span>{caveat}</span>
        </p>
      </div>

      {filterPanelOpen ? (
        <section className="mt-3 rounded-lg border border-[#d0d5dd] bg-white p-4 shadow-[0_10px_30px_rgba(16,24,40,0.08)]" aria-label="Atlas filters">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FilterSelect
              label="Region"
              value={filters.region ?? ""}
              options={regions.map((region) => ({ value: region.slug, label: `${region.name} (${region.organizationCount})` }))}
              onChange={(value) => void load({ ...filters, region: value || undefined })}
            />
            <FilterSelect
              label="Technical domain"
              value={filters.domain ?? ""}
              options={technicalDomains.map((domain) => ({ value: domain.slug, label: domain.name }))}
              onChange={(value) => void load({ ...filters, domain: value || undefined })}
            />
            <FilterSelect
              label="Mission area"
              value={filters.mission ?? ""}
              options={missionAreas.map((mission) => ({ value: mission.slug, label: mission.name }))}
              onChange={(value) => void load({ ...filters, mission: value || undefined })}
            />
            <FilterSelect
              label="Public demand"
              value={filters.demand ?? ""}
              options={demandRequirements.map((demand) => ({ value: demand.slug, label: demand.title }))}
              onChange={(value) => void load({ ...filters, demand: value || undefined })}
            />
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[#eaecf0] pt-3">
            <span className="text-xs text-[#667085]">Filters update the map, result count, table, URL, and export together.</span>
            <button type="button" className="text-xs font-semibold text-[#0756d9] hover:underline" onClick={() => void load({}, { updateQuestion: true })}>
              Clear all
            </button>
          </div>
        </section>
      ) : null}

      {error ? (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-[#fda29b] bg-[#fff6f5] px-3 py-2 text-sm text-[#b42318]" role="alert">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {discovery?.interpretation === "no_match" ? (
        <div className="mt-3 rounded-md border border-[#fedf89] bg-[#fffaeb] px-3 py-2 text-sm text-[#7a2e0e]">
          No reviewed records match every interpreted filter. The empty state is intentional; try removing one filter or inspect the related demand page.
        </div>
      ) : null}

      <section className="mt-4 overflow-hidden rounded-lg border border-[#d0d5dd] bg-white shadow-[0_2px_8px_rgba(16,24,40,0.04)]">
        <div
          className={cn(
            "relative border-b border-[#d0d5dd] lg:h-[350px]",
            viewMode === "table" ? "h-[60px] bg-[#f8fafc]" : "h-[330px] sm:h-[350px]"
          )}
        >
          <div className={cn("h-full", viewMode === "table" && "hidden lg:block")}>
            <AtlasMap organizations={result.organizations} selectedOrganizationId={selectedId} onSelect={updateSelection} />
          </div>
          <div className="absolute right-3 top-3 z-[1000] flex overflow-hidden rounded-md border border-white/80 bg-white p-0.5 shadow-[0_8px_24px_rgba(16,24,40,0.16)] sm:right-4 sm:top-4">
            <button
              type="button"
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded px-3 text-xs font-semibold sm:text-sm",
                viewMode === "map" ? "bg-[#0756d9] text-white" : "text-[#344054] hover:bg-[#f2f4f7]"
              )}
              onClick={() => setViewMode("map")}
              aria-pressed={viewMode === "map"}
              aria-label="Show map"
            >
              <MapIcon className="size-4" />
              Map
            </button>
            <button
              type="button"
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded px-3 text-xs font-semibold sm:text-sm",
                viewMode === "table" ? "bg-[#0756d9] text-white" : "text-[#344054] hover:bg-[#f2f4f7]"
              )}
              onClick={() => setViewMode("table")}
              aria-pressed={viewMode === "table"}
              aria-label="Show accessible results list"
            >
              <List className="size-4" />
              <span className="lg:hidden">List</span>
              <span className="hidden lg:inline">Accessible table</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-b border-[#d0d5dd] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-baseline gap-3">
            <h1 className="text-base font-bold tracking-[-0.01em] text-[#101828]">Published ecosystem records</h1>
            <span className="text-xs text-[#667085]">{result.total} {result.total === 1 ? "organization" : "organizations"}</span>
          </div>
          <Link href={exportHref} className="inline-flex items-center gap-2 text-xs font-semibold text-[#0756d9] no-underline hover:underline">
            <Download className="size-4" />
            Export current results
          </Link>
        </div>

        {result.organizations.length ? (
          <>
            <ul className={cn("divide-y divide-[#eaecf0] lg:hidden", viewMode === "map" && "hidden")} aria-label="Published Canadian ecosystem organizations">
              {result.organizations.map((organization) => (
                <MobileOrganizationCard
                  key={organization.id}
                  organization={organization}
                  capability={relevantCapability(organization, filters)}
                  filters={filters}
                  expanded={expandedId === organization.id}
                  selected={selectedId === organization.id}
                  onToggle={() => {
                    setSelectedId(organization.id);
                    setExpandedId((current) => (current === organization.id ? null : organization.id));
                  }}
                />
              ))}
            </ul>
            <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[960px] border-collapse text-left" aria-label="Published Canadian ecosystem organizations">
              <thead>
                <tr className="border-b border-[#eaecf0] bg-[#fcfcfd] text-[11px] font-semibold text-[#475467]">
                  <th scope="col" className="w-10 px-3 py-2.5"><span className="sr-only">Expand</span></th>
                  <th scope="col" className="px-2 py-2.5">Organization</th>
                  <th scope="col" className="px-3 py-2.5">Capability</th>
                  <th scope="col" className="px-3 py-2.5">Region</th>
                  <th scope="col" className="px-3 py-2.5">Reviewed fit</th>
                  <th scope="col" className="px-3 py-2.5">Evidence</th>
                  <th scope="col" className="px-3 py-2.5">Freshness</th>
                </tr>
              </thead>
              <tbody>
                {result.organizations.map((organization) => (
                  <OrganizationRows
                    key={organization.id}
                    organization={organization}
                    capability={relevantCapability(organization, filters)}
                    filters={filters}
                    expanded={expandedId === organization.id}
                    selected={selectedId === organization.id}
                    onToggle={() => {
                      setSelectedId(organization.id);
                      setExpandedId((current) => (current === organization.id ? null : organization.id));
                    }}
                  />
                ))}
              </tbody>
            </table>
            </div>
          </>
        ) : (
          <div className={cn("px-6 py-14 text-center", viewMode === "map" && "hidden lg:block")}>
            <Filter className="mx-auto size-7 text-[#98a2b3]" />
            <h2 className="mt-4 text-base font-semibold text-[#101828]">No reviewed records match these filters</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#667085]">
              Thin or unmapped coverage stays visible as a gap. Remove a filter, broaden to Canada, or review the demand statement for its current evidence posture.
            </p>
            <button type="button" className="mt-5 text-sm font-semibold text-[#0756d9] hover:underline" onClick={() => void load({}, { updateQuestion: true })}>
              Clear all filters
            </button>
          </div>
        )}
      </section>

      <footer className="flex flex-col gap-2 px-0 py-5 text-xs text-[#667085] sm:flex-row sm:items-center sm:justify-between">
        <span>Snapshot generated {formatDate(generatedAt)}. Published public sources only.</span>
        <Link href="/help/concepts" className="font-medium text-[#0756d9] no-underline hover:underline">About evidence and derived reads</Link>
      </footer>
    </div>
  );
}

function FilterSelect({
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
    <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">
      {label}
      <span className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full appearance-none rounded-md border border-[#d0d5dd] bg-white px-3 pr-9 text-sm font-normal text-[#101828] outline-none focus:border-[#0756d9] focus:ring-4 focus:ring-[#0756d9]/10"
        >
          <option value="">All {label.toLowerCase()}s</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#667085]" />
      </span>
    </label>
  );
}

function MobileOrganizationCard({
  organization,
  capability,
  filters,
  expanded,
  selected,
  onToggle
}: {
  organization: AtlasOrganization;
  capability: AtlasCapability | null;
  filters: AtlasQuery;
  expanded: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  const evidence = rowEvidence(organization, capability);
  const alignment = selectedAlignment(capability, filters);
  const location = organization.primaryLocation;
  const confidence = alignment?.confidence ?? capability?.sourceConfidence ?? organization.sourceConfidence;

  return (
    <li className={cn("bg-white", selected && "bg-[#f8fbff]")}>
      <button
        type="button"
        className="w-full px-4 py-4 text-left"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={`${expanded ? "Collapse" : "Expand"} ${organization.name}`}
      >
        <span className="flex items-start gap-3">
          {expanded ? <ChevronDown className="mt-0.5 size-4 shrink-0 text-[#0756d9]" /> : <ChevronRight className="mt-0.5 size-4 shrink-0 text-[#475467]" />}
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-[#0756d9]">{organization.name}</span>
            <span className="mt-1 block text-xs leading-5 text-[#344054]">{capability?.name ?? "No reviewed capability"}</span>
            <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#667085]">
              <span>{location?.provinceTerritory ?? "Location under review"}</span>
              <span>{evidence.length} {evidence.length === 1 ? "source" : "sources"}</span>
              <span>Reviewed {formatDate(capability?.lastReviewedAt ?? organization.lastReviewedAt)}</span>
            </span>
          </span>
        </span>
      </button>

      {expanded ? (
        <div className="border-t border-[#bfd3f6] bg-[#f8fbff] px-4 py-4">
          <h3 className="text-xs font-bold text-[#101828]">{alignment ? "Why this capability fits" : "Reviewed capability summary"}</h3>
          <p className="mt-2 text-xs leading-5 text-[#344054]">{alignment?.alignmentSummary ?? capability?.summary ?? organization.description}</p>

          {capability?.defenceApplications.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {capability.defenceApplications.slice(0, 3).map((item) => (
                <span key={item} className="rounded bg-white px-2 py-1 text-[10px] font-medium text-[#475467] ring-1 ring-[#d0d5dd]">{item}</span>
              ))}
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#d6e2f5] pt-4 text-xs">
            <div>
              <span className="block text-[10px] text-[#667085]">Confidence</span>
              <span className={cn(
                "mt-1 inline-flex rounded px-2 py-1 text-[10px] font-semibold",
                confidence === "high" ? "bg-[#dcfae6] text-[#067647]" : confidence === "moderate" ? "bg-[#fff1d6] text-[#7a2e0e]" : "bg-[#fee4e2] text-[#b42318]"
              )}>{confidenceLabel(confidence)}</span>
            </div>
            <div>
              <span className="block text-[10px] text-[#667085]">Map precision</span>
              <span className="mt-1 block font-medium text-[#344054]">{location ? toTitleCase(location.geographicConfidence) : "Unknown"}</span>
            </div>
          </div>

          {evidence[0] ? (
            <a href={evidence[0].sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-start gap-1 text-xs font-semibold text-[#0756d9] no-underline hover:underline">
              <span>Open public-source evidence</span>
              <ExternalLink className="mt-0.5 size-3 shrink-0" />
            </a>
          ) : null}
          <Link href={`/organizations/${organization.slug}`} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#0756d9] px-3 text-xs font-semibold text-white no-underline hover:bg-[#0649b9] hover:no-underline">
            View organization dossier
            <ExternalLink className="size-3.5" />
          </Link>
        </div>
      ) : null}
    </li>
  );
}

function OrganizationRows({
  organization,
  capability,
  filters,
  expanded,
  selected,
  onToggle
}: {
  organization: AtlasOrganization;
  capability: AtlasCapability | null;
  filters: AtlasQuery;
  expanded: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  const evidence = rowEvidence(organization, capability);
  const alignment = selectedAlignment(capability, filters);
  const location = organization.primaryLocation;
  const confidence = alignment?.confidence ?? capability?.sourceConfidence ?? organization.sourceConfidence;

  return (
    <>
      <tr
        className={cn(
          "cursor-pointer border-b border-[#eaecf0] bg-white text-xs text-[#344054] hover:bg-[#f8fbff]",
          selected && "bg-[#f8fbff]",
          expanded && "border-x border-x-[#2e72e8] border-t border-t-[#2e72e8]"
        )}
        onClick={onToggle}
      >
        <td className="px-3 py-3 align-middle">
          <button type="button" className="flex size-6 items-center justify-center rounded text-[#344054] hover:bg-[#eaf2ff]" aria-expanded={expanded} aria-label={`${expanded ? "Collapse" : "Expand"} ${organization.name}`}>
            {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        </td>
        <th scope="row" className="px-2 py-3 text-[13px] font-semibold text-[#0756d9]">{organization.name}</th>
        <td className="max-w-[280px] px-3 py-3 leading-4">{capability?.name ?? "No reviewed capability"}</td>
        <td className="px-3 py-3">{location?.provinceTerritory ?? "Location under review"}</td>
        <td className="px-3 py-3">
          {alignment ? (
            <span className={cn(
              "inline-flex rounded px-2 py-1 text-[10px] font-semibold",
              alignment.matchType === "public_source_alignment" ? "bg-[#eaf2ff] text-[#0756d9]" : "bg-[#fff1d6] text-[#7a2e0e]"
            )}>
              {alignment.matchType === "public_source_alignment" ? "Public-source alignment" : "Reviewed derived fit"}
            </span>
          ) : (
            <span className="inline-flex rounded bg-[#f2f4f7] px-2 py-1 text-[10px] font-semibold text-[#475467]">Capability profile</span>
          )}
        </td>
        <td className="px-3 py-3 font-medium text-[#0756d9]">{evidence.length} {evidence.length === 1 ? "source" : "sources"}</td>
        <td className="whitespace-nowrap px-3 py-3">{formatDate(capability?.lastReviewedAt ?? organization.lastReviewedAt)}</td>
      </tr>
      {expanded ? (
        <tr className="border-x border-b border-[#2e72e8] bg-[#f8fbff]">
          <td colSpan={7} className="p-0">
            <div className="grid gap-0 px-4 py-4 lg:grid-cols-[1.1fr_0.9fr_0.78fr]">
              <section className="pr-5 lg:border-r lg:border-[#bfd3f6]" aria-labelledby={`why-${organization.id}`}>
                <h3 id={`why-${organization.id}`} className="text-xs font-bold text-[#101828]">
                  {alignment ? "Why this capability fits the selected context" : "Reviewed capability summary"}
                </h3>
                <p className="mt-2 text-xs leading-5 text-[#344054]">{alignment?.alignmentSummary ?? capability?.summary ?? organization.description}</p>
                {capability?.defenceApplications.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {capability.defenceApplications.slice(0, 3).map((item) => (
                      <span key={item} className="rounded bg-white px-2 py-1 text-[10px] font-medium text-[#475467] ring-1 ring-[#d0d5dd]">{item}</span>
                    ))}
                  </div>
                ) : null}
              </section>

              <section className="border-t border-[#bfd3f6] py-4 lg:border-r lg:border-t-0 lg:px-5 lg:py-0" aria-labelledby={`evidence-${organization.id}`}>
                <h3 id={`evidence-${organization.id}`} className="text-xs font-bold text-[#101828]">Public-source evidence</h3>
                <ul className="mt-2 space-y-2">
                  {evidence.slice(0, 3).map((citation) => (
                    <li key={citation.id} className="text-xs leading-5">
                      <a href={citation.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1 font-medium text-[#0756d9] no-underline hover:underline">
                        <span>{citation.sourceTitle}</span>
                        <ExternalLink className="mt-0.5 size-3 shrink-0" />
                      </a>
                      <span className="block text-[10px] text-[#667085]">{citation.publisher}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="border-t border-[#bfd3f6] pt-4 lg:border-t-0 lg:pl-5 lg:pt-0" aria-labelledby={`posture-${organization.id}`}>
                <h3 id={`posture-${organization.id}`} className="text-xs font-bold text-[#101828]">Review posture</h3>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-xs lg:grid-cols-1">
                  <div>
                    <dt className="text-[10px] text-[#667085]">Confidence</dt>
                    <dd className={cn(
                      "mt-1 inline-flex rounded px-2 py-1 text-[10px] font-semibold",
                      confidence === "high" ? "bg-[#dcfae6] text-[#067647]" : confidence === "moderate" ? "bg-[#fff1d6] text-[#7a2e0e]" : "bg-[#fee4e2] text-[#b42318]"
                    )}>{confidenceLabel(confidence)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-[#667085]">Map precision</dt>
                    <dd className="mt-1 font-medium text-[#344054]">{location ? toTitleCase(location.geographicConfidence) : "Unknown"}</dd>
                  </div>
                </dl>
                <Link href={`/organizations/${organization.slug}`} className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#0756d9] px-3 text-xs font-semibold text-white no-underline hover:bg-[#0649b9] hover:no-underline">
                  View organization dossier
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
