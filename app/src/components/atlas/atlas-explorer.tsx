"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookmarkPlus,
  Building2,
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
import { FormEvent, useMemo, useRef, useState } from "react";
import { AtlasMap } from "@/components/atlas/atlas-map";
import { PublicAtlasFooter } from "@/components/atlas/public-atlas-footer";
import { getAtlasEmptyState } from "@/lib/atlas/empty-state";
import {
  alignmentSubject,
  alignmentTypeLabel,
  assessmentConfidenceLabel,
  evidenceStrengthLabel,
  locationAccuracyLabel
} from "@/lib/atlas/presentation";
import { atlasQueryToSearchParams } from "@/lib/atlas/query-params";
import {
  currentPilotCohort,
  currentPilotSessionId,
  openPilotFeedback,
  rememberPilotSearchId,
  trackPilotEvent
} from "@/lib/pilot/client";
import { cn, formatDate, toTitleCase } from "@/lib/utils";
import type {
  AtlasCapability,
  AtlasBounds,
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

function filterWithout(filters: AtlasQuery, key: string): AtlasQuery {
  const next = { ...filters, page: 1 };
  if (key === "bounds") delete next.bounds;
  if (key === "query") delete next.query;
  if (key === "region") delete next.region;
  if (key === "metro") delete next.metro;
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [viewport, setViewport] = useState<{ bounds: AtlasBounds; organizationIds: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [discovery, setDiscovery] = useState<AtlasDiscoveryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());

  const exportHref = useMemo(() => {
    const params = atlasQueryToSearchParams({
      ...filters,
      bounds: viewport?.bounds,
      page: 1,
      pageSize: 1000
    });
    params.set("export", "atlas-results");
    return `/api/export?${params.toString()}`;
  }, [filters, viewport]);

  const visibleOrganizations = useMemo(() => {
    if (!viewport) return result.organizations;
    const visibleIds = new Set(viewport.organizationIds);
    return result.organizations.filter((organization) => visibleIds.has(organization.id));
  }, [result.organizations, viewport]);

  const selectedOrganization = useMemo(
    () => result.organizations.find((organization) => organization.id === selectedId) ?? null,
    [result.organizations, selectedId]
  );
  const selectedCapability = useMemo(
    () => (selectedOrganization ? relevantCapability(selectedOrganization, filters) : null),
    [filters, selectedOrganization]
  );
  const emptyState = getAtlasEmptyState({
    totalResults: result.total,
    submittedQuery: discovery?.query ?? filters.query
  });

  async function load(nextFilters: AtlasQuery, options: { updateQuestion?: boolean } = {}) {
    setLoading(true);
    setError(null);
    try {
      const params = atlasQueryToSearchParams({ ...nextFilters, bounds: undefined, page: 1, pageSize: 1000 });
      const response = await fetch(`/api/atlas?${params.toString()}`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("The published atlas could not be refreshed.");
      const nextResult = (await response.json()) as AtlasQueryResult;
      setResult(nextResult);
      setFilters({ ...nextFilters, page: 1 });
      setViewport(null);
      setSelectedId(null);
      setExpandedId(null);
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
      rememberPilotSearchId(null);
      await load({});
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          query,
          contextPath: window.location.pathname,
          cohort: currentPilotCohort(),
          sessionId: currentPilotSessionId()
        })
      });
      if (!response.ok) throw new Error("The question could not be interpreted.");
      const nextDiscovery = (await response.json()) as AtlasDiscoveryResult;
      setDiscovery(nextDiscovery);
      rememberPilotSearchId(nextDiscovery.searchId);
      trackPilotEvent("atlas_search", {
        filter_count: Object.values(nextDiscovery.filters).filter(Boolean).length,
        result_count: nextDiscovery.organizationIds.length,
        interpretation: nextDiscovery.interpretation,
        zero_result: nextDiscovery.organizationIds.length === 0
      }, { searchId: nextDiscovery.searchId });
      await load(nextDiscovery.filters);
    } catch (discoveryError) {
      setError(discoveryError instanceof Error ? discoveryError.message : "The question could not be interpreted.");
      setLoading(false);
    }
  }

  function updateSelection(id: string, revealInTable = false, source: "map" | "result" = "result") {
    setSelectedId(id);
    const organization = result.organizations.find((item) => item.id === id);
    trackPilotEvent(source === "map" ? "marker_select" : "result_select", {
      organization: organization?.slug ?? "unknown",
      source
    });
    if (!revealInTable) return;
    window.requestAnimationFrame(() => {
      const container = tableScrollRef.current;
      const row = rowRefs.current.get(id);
      if (!container || !row) return;
      container.scrollTo({ top: Math.max(0, row.offsetTop - 44), behavior: "smooth" });
    });
  }

  function updateViewport(nextViewport: { bounds: AtlasBounds; organizationIds: string[] }) {
    setViewport(nextViewport);
    setSelectedId((current) => current && !nextViewport.organizationIds.includes(current) ? null : current);
  }

  const caveat = filters.demand
    ? "Demand relevance is assessed from published sources. It is not eligibility, endorsement, or procurement guidance."
    : "Mission relevance is an analyst assessment based on published sources. Open a row to inspect the rationale and sources.";

  return (
    <div className="atlas-frame pb-8 pt-4 sm:pt-5">
      <section className="mb-4 overflow-hidden rounded-xl border border-[#1c3555] bg-[#05052b] text-white shadow-[0_14px_36px_rgba(5,5,43,0.16)]">
        <div className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#62d9e8]">Invitation-only design partner preview</p>
            <h1 className="mt-2 text-xl font-bold tracking-[-0.025em] sm:text-2xl">Explore verified Canadian defence and dual-use capabilities.</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/72">This limited 18-organization dataset is designed to test discovery, evidence, lookbooks, and exports—not to represent complete national coverage.</p>
          </div>
          <button type="button" onClick={openPilotFeedback} className="inline-flex h-10 items-center justify-center rounded-md border border-[#62d9e8]/60 bg-[#62d9e8] px-4 text-xs font-semibold text-[#05052b] hover:bg-[#8fe7f1]">Tell us what is missing</button>
        </div>
      </section>
      <form onSubmit={submitDiscovery} role="search" aria-label="Ask the Canadian public atlas">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#475467]" aria-hidden="true" />
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            className="h-[50px] w-full rounded-lg border border-[#cbd5e1] bg-white pl-12 pr-28 text-[15px] text-[#101828] shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none placeholder:text-[#667085] focus:border-[#007f98] focus:ring-4 focus:ring-[#007f98]/10 sm:text-base"
            placeholder="Ask by region, capability, or mission — e.g. underwater sensing in Atlantic Canada"
            aria-label="Natural-language atlas question"
            maxLength={500}
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 flex h-9 -translate-y-1/2 items-center gap-2 rounded-md bg-[#007f98] px-4 text-sm font-semibold text-white hover:bg-[#00677d] disabled:opacity-60"
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
              onClick={() => {
                if (filter.key === "query" || filter.key === "metro") rememberPilotSearchId(null);
                void load(filterWithout(filters, filter.key), { updateQuestion: filter.key === "query" || filter.key === "metro" });
              }}
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
            className="inline-flex h-9 items-center gap-2 rounded-md px-2.5 text-xs font-semibold text-[#007f98] hover:bg-[#e7f8fa]"
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
              onChange={(value) => { trackPilotEvent("filter_apply", { filter: "region", value: value || "all" }); void load({ ...filters, region: value || undefined }); }}
            />
            <FilterSelect
              label="Technical domain"
              value={filters.domain ?? ""}
              options={technicalDomains.map((domain) => ({ value: domain.slug, label: domain.name }))}
              onChange={(value) => { trackPilotEvent("filter_apply", { filter: "domain", value: value || "all" }); void load({ ...filters, domain: value || undefined }); }}
            />
            <FilterSelect
              label="Mission area"
              value={filters.mission ?? ""}
              options={missionAreas.map((mission) => ({ value: mission.slug, label: mission.name }))}
              onChange={(value) => { trackPilotEvent("filter_apply", { filter: "mission", value: value || "all" }); void load({ ...filters, mission: value || undefined }); }}
            />
            <FilterSelect
              label="Public demand"
              value={filters.demand ?? ""}
              options={demandRequirements.map((demand) => ({ value: demand.slug, label: demand.title }))}
              onChange={(value) => { trackPilotEvent("filter_apply", { filter: "demand", value: value || "all" }); void load({ ...filters, demand: value || undefined }); }}
            />
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[#eaecf0] pt-3">
            <span className="text-xs text-[#667085]">Filters update the map, result count, table, URL, and export together.</span>
            <button type="button" className="text-xs font-semibold text-[#007f98] hover:underline" onClick={() => { rememberPilotSearchId(null); setDiscovery(null); void load({}, { updateQuestion: true }); }}>
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
          No published records match every interpreted filter. Try a broader geography, remove one filter, or tell us what is missing.
        </div>
      ) : null}

      <section className="mt-4 overflow-hidden rounded-lg border border-[#d0d5dd] bg-white shadow-[0_2px_8px_rgba(16,24,40,0.04)]">
        <div className={cn("relative h-[350px] border-b border-[#d0d5dd] sm:h-[390px] lg:h-[410px]", viewMode === "table" && "hidden lg:block")}>
          <AtlasMap
            organizations={result.organizations}
            selectedOrganizationId={selectedId}
            onSelect={(id) => updateSelection(id, true, "map")}
            onViewportChange={updateViewport}
          />

          <div className="pointer-events-none absolute left-3 top-3 z-[1000] rounded-md border border-white/80 bg-white/95 px-3 py-2 text-xs font-semibold text-[#344054] shadow-[0_6px_20px_rgba(16,24,40,0.14)] backdrop-blur sm:left-4 sm:top-4">
            {viewport ? `${visibleOrganizations.length} ${visibleOrganizations.length === 1 ? "organization" : "organizations"} in view` : "Updating map results…"}
          </div>

          <div className="absolute right-3 top-3 z-[1000] flex overflow-hidden rounded-md border border-white/80 bg-white p-0.5 shadow-[0_8px_24px_rgba(16,24,40,0.16)] lg:hidden">
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded px-3 text-xs font-semibold text-[#344054] hover:bg-[#f2f4f7]"
              onClick={() => setViewMode("table")}
              aria-label="Show accessible results list"
            >
              <List className="size-4" />
              List
            </button>
          </div>

          {selectedOrganization ? (
            <LookbookPeek
              organization={selectedOrganization}
              capability={selectedCapability}
              filters={filters}
              onClose={() => setSelectedId(null)}
            />
          ) : null}
        </div>

        <div className={cn(viewMode === "map" && "hidden lg:block")}>
          <div className="flex flex-col gap-3 border-b border-[#d0d5dd] bg-[#f8fafc] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="text-base font-bold tracking-[-0.01em] text-[#101828]">Organizations in this map view</h2>
                <span className="text-xs text-[#667085]">
                  {visibleOrganizations.length} {visibleOrganizations.length === 1 ? "organization" : "organizations"}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#667085]">
                <span className="hidden lg:inline">Pan or zoom the map to update these results. Select a row to locate it on the map.</span>
                <span className="lg:hidden">Only organizations represented inside the last visible map area are included.</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href={exportHref} className="inline-flex items-center gap-2 text-xs font-semibold text-[#007f98] no-underline hover:underline">
                <Download className="size-4" />
                Export visible results
              </Link>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-3 text-xs font-semibold text-[#344054] shadow-sm hover:bg-[#f2f4f7] lg:hidden"
                onClick={() => setViewMode("map")}
                aria-label="Return to map"
              >
                <MapIcon className="size-4" />
                Map
              </button>
            </div>
          </div>

          {visibleOrganizations.length ? (
            <>
              <ul className="divide-y divide-[#eaecf0] lg:hidden" aria-label="Organizations in the current map view">
                {visibleOrganizations.map((organization) => (
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
                      trackPilotEvent("result_select", { organization: organization.slug, source: "mobile_list" });
                    }}
                  />
                ))}
              </ul>
              <div ref={tableScrollRef} className="hidden max-h-[540px] overflow-auto lg:block">
                <table className="w-full min-w-[960px] border-collapse text-left" aria-label="Organizations in the current map view">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-[#eaecf0] bg-[#fcfcfd] text-[11px] font-semibold text-[#475467] shadow-[0_1px_0_#eaecf0]">
                      <th scope="col" className="w-10 px-3 py-2.5"><span className="sr-only">Expand</span></th>
                      <th scope="col" className="px-2 py-2.5">Organization</th>
                      <th scope="col" className="px-3 py-2.5">Capability</th>
                      <th scope="col" className="px-3 py-2.5">Region</th>
                      <th scope="col" className="px-3 py-2.5">Assessment</th>
                      <th scope="col" className="px-3 py-2.5">Sources</th>
                      <th scope="col" className="px-3 py-2.5">Last verified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleOrganizations.map((organization) => (
                      <OrganizationRows
                        key={organization.id}
                        organization={organization}
                        capability={relevantCapability(organization, filters)}
                        filters={filters}
                        expanded={expandedId === organization.id}
                        selected={selectedId === organization.id}
                        rowRef={(node) => {
                          if (node) rowRefs.current.set(organization.id, node);
                          else rowRefs.current.delete(organization.id);
                        }}
                        onSelect={() => updateSelection(organization.id, false, "result")}
                        onToggleExpanded={() => {
                          setSelectedId(organization.id);
                          setExpandedId((current) => (current === organization.id ? null : organization.id));
                          trackPilotEvent("result_select", { organization: organization.slug, source: "table_expand" });
                        }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="px-6 py-14 text-center" aria-live="polite">
              <Filter className="mx-auto size-7 text-[#98a2b3]" />
              <h2 className="mt-4 text-base font-semibold text-[#101828]">{emptyState.title}</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#667085]">
                {emptyState.description}
              </p>
              {emptyState.kind === "search" ? (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
                  <button type="button" className="text-sm font-semibold text-[#007f98] hover:underline" onClick={() => { rememberPilotSearchId(null); setDiscovery(null); void load({}, { updateQuestion: true }); }}>
                    Clear search
                  </button>
                  <button type="button" className="text-sm font-semibold text-[#007f98] hover:underline" onClick={openPilotFeedback}>
                    Tell us what is missing
                  </button>
                </div>
              ) : (
                <button type="button" className="mt-5 text-sm font-semibold text-[#007f98] hover:underline lg:hidden" onClick={() => setViewMode("map")}>
                  Return to map
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <PublicAtlasFooter generatedLabel={`Snapshot generated ${formatDate(generatedAt)}. Published public sources only; limited verified coverage for workflow testing.`} />
    </div>
  );
}

function LookbookPeek({
  organization,
  capability,
  filters,
  onClose
}: {
  organization: AtlasOrganization;
  capability: AtlasCapability | null;
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
      className="absolute inset-x-3 bottom-3 z-[1001] max-h-[276px] overflow-y-auto rounded-lg border border-white/90 bg-white/97 p-4 shadow-[0_18px_44px_rgba(16,24,40,0.24)] backdrop-blur sm:inset-x-auto sm:right-4 sm:top-4 sm:bottom-auto sm:max-h-[378px] sm:w-[350px]"
      aria-label={`Selected organization: ${organization.name}`}
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#e7f8fa] text-[#007f98] ring-1 ring-[#9bd8e2]" aria-hidden="true">
          <Building2 className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[#101828]">{organization.name}</p>
          <p className="mt-0.5 truncate text-[11px] text-[#667085]">
            {toTitleCase(organization.entityKind)}{location ? ` · ${location.name}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-[#667085] hover:bg-[#f2f4f7] hover:text-[#101828] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007f98]"
          aria-label={`Close ${organization.name} preview`}
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-3 rounded-md border border-[#e4e7ec] bg-[#f8fafc] p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#667085]">
          {alignment ? alignmentTypeLabel(alignment.matchType) : "Verified capability"}
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-[#344054]">{capability?.name ?? "Organization profile"}</p>
        <p className="mt-1 line-clamp-3 text-[11px] leading-[1.1rem] text-[#667085]">{summary}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold">
        <span className={cn(
          "rounded px-2 py-1",
          confidence === "high" ? "bg-[#dcfae6] text-[#067647]" : confidence === "moderate" ? "bg-[#fff1d6] text-[#7a2e0e]" : "bg-[#fee4e2] text-[#b42318]"
        )}>{alignment ? `${assessmentConfidenceLabel(confidence)} assessment confidence` : `${evidenceStrengthLabel(confidence)} evidence`}</span>
        <span className="rounded bg-[#f2f4f7] px-2 py-1 text-[#475467]">{evidence.length} {evidence.length === 1 ? "source" : "sources"}</span>
        <span className={cn(
          "rounded px-2 py-1",
          organization.freshnessStatus === "current" ? "bg-[#e7f8fa] text-[#007f98]" : "bg-[#fff1d6] text-[#7a2e0e]"
        )}>{verificationStatus}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          href={`/organizations/${organization.slug}`}
          className="col-span-2 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#007f98] px-3 text-xs font-semibold text-white no-underline hover:bg-[#00677d] hover:no-underline"
        >
          View profile
          <ArrowRight className="size-3.5" />
        </Link>
        <Link
          href={`/collections?addType=organization&addId=${organization.id}&returnTo=${encodeURIComponent("/")}`}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#d0d5dd] bg-white px-2 text-[11px] font-semibold text-[#344054] no-underline hover:bg-[#f8fafc] hover:no-underline"
        >
          <BookmarkPlus className="size-3.5" />
          Save
        </Link>
        {evidence[0] ? (
          <a
            href={evidence[0].sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#d0d5dd] bg-white px-2 text-[11px] font-semibold text-[#344054] no-underline hover:bg-[#f8fafc] hover:no-underline"
          >
            Source
            <ExternalLink className="size-3.5" />
          </a>
        ) : (
          <span className="inline-flex h-9 items-center justify-center rounded-md bg-[#f2f4f7] px-2 text-[11px] font-semibold text-[#98a2b3]">No public link</span>
        )}
      </div>
    </aside>
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
          className="h-10 w-full appearance-none rounded-md border border-[#d0d5dd] bg-white px-3 pr-9 text-sm font-normal text-[#101828] outline-none focus:border-[#007f98] focus:ring-4 focus:ring-[#007f98]/10"
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
    <li className={cn("bg-white", selected && "bg-[#f0fafb]")}>
      <button
        type="button"
        className="w-full px-4 py-4 text-left"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={`${expanded ? "Collapse" : "Expand"} ${organization.name}`}
      >
        <span className="flex items-start gap-3">
          {expanded ? <ChevronDown className="mt-0.5 size-4 shrink-0 text-[#007f98]" /> : <ChevronRight className="mt-0.5 size-4 shrink-0 text-[#475467]" />}
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-[#007f98]">{organization.name}</span>
            <span className="mt-1 block text-xs leading-5 text-[#344054]">{capability?.name ?? "Capability not yet verified"}</span>
            <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#667085]">
              <span>{location?.provinceTerritory ?? "Location under review"}</span>
              <span>{evidence.length} {evidence.length === 1 ? "source" : "sources"}</span>
              <span>Last verified {formatDate(capability?.lastReviewedAt ?? organization.lastReviewedAt)}</span>
            </span>
          </span>
        </span>
      </button>

      {expanded ? (
        <div className="border-t border-[#b8dfe5] bg-[#f0fafb] px-4 py-4">
          <h3 className="text-xs font-bold text-[#101828]">{alignment ? `Why it matches ${alignmentSubject(alignment)}` : "Verified capability summary"}</h3>
          <p className="mt-2 text-xs leading-5 text-[#344054]">{alignment?.alignmentSummary ?? capability?.summary ?? organization.description}</p>

          {capability?.defenceApplications.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {capability.defenceApplications.slice(0, 3).map((item) => (
                <span key={item} className="rounded bg-white px-2 py-1 text-[10px] font-medium text-[#475467] ring-1 ring-[#d0d5dd]">{item}</span>
              ))}
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#cce7eb] pt-4 text-xs">
            <div>
              <span className="block text-[10px] text-[#667085]">{alignment ? "Assessment confidence" : "Evidence strength"}</span>
              <span className={cn(
                "mt-1 inline-flex rounded px-2 py-1 text-[10px] font-semibold",
                confidence === "high" ? "bg-[#dcfae6] text-[#067647]" : confidence === "moderate" ? "bg-[#fff1d6] text-[#7a2e0e]" : "bg-[#fee4e2] text-[#b42318]"
              )}>{alignment ? assessmentConfidenceLabel(confidence) : evidenceStrengthLabel(confidence)}</span>
            </div>
            <div>
              <span className="block text-[10px] text-[#667085]">Location accuracy</span>
              <span className="mt-1 block font-medium text-[#344054]">{location ? locationAccuracyLabel(location.geographicConfidence) : "Not verified"}</span>
            </div>
          </div>

          {evidence[0] ? (
            <a href={evidence[0].sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-start gap-1 text-xs font-semibold text-[#007f98] no-underline hover:underline">
              <span>Open source</span>
              <ExternalLink className="mt-0.5 size-3 shrink-0" />
            </a>
          ) : null}
          <Link href={`/organizations/${organization.slug}`} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#007f98] px-3 text-xs font-semibold text-white no-underline hover:bg-[#00677d] hover:no-underline">
            View organization profile
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
  rowRef,
  onSelect,
  onToggleExpanded
}: {
  organization: AtlasOrganization;
  capability: AtlasCapability | null;
  filters: AtlasQuery;
  expanded: boolean;
  selected: boolean;
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
          "cursor-pointer border-b border-[#eaecf0] bg-white text-xs text-[#344054] outline-none hover:bg-[#f0fafb] focus-visible:bg-[#f0fafb] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#007f98]",
          selected && "bg-[#f0fafb]",
          expanded && "border-x border-x-[#008fa8] border-t border-t-[#008fa8]"
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
            className="flex size-6 items-center justify-center rounded text-[#344054] hover:bg-[#e7f8fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007f98]"
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
        <th scope="row" className="px-2 py-3 text-[13px] font-semibold text-[#007f98]">{organization.name}</th>
        <td className="max-w-[280px] px-3 py-3 leading-4">{capability?.name ?? "Capability not yet verified"}</td>
        <td className="px-3 py-3">{location?.provinceTerritory ?? "Location under review"}</td>
        <td className="px-3 py-3">
          {alignment ? (
            <span className={cn(
              "inline-flex rounded px-2 py-1 text-[10px] font-semibold",
              alignment.matchType === "public_source_alignment" ? "bg-[#e7f8fa] text-[#007f98]" : "bg-[#fff1d6] text-[#7a2e0e]"
            )}>
              {alignmentTypeLabel(alignment.matchType)}
            </span>
          ) : (
            <span className="inline-flex rounded bg-[#f2f4f7] px-2 py-1 text-[10px] font-semibold text-[#475467]">Verified profile</span>
          )}
        </td>
        <td className="px-3 py-3 font-medium text-[#007f98]">{evidence.length} {evidence.length === 1 ? "source" : "sources"}</td>
        <td className="whitespace-nowrap px-3 py-3">{formatDate(capability?.lastReviewedAt ?? organization.lastReviewedAt)}</td>
      </tr>
      {expanded ? (
        <tr className="border-x border-b border-[#008fa8] bg-[#f0fafb]">
          <td colSpan={7} className="p-0">
            <div className="grid gap-0 px-4 py-4 lg:grid-cols-[1.1fr_0.9fr_0.78fr]">
              <section className="pr-5 lg:border-r lg:border-[#b8dfe5]" aria-labelledby={`why-${organization.id}`}>
                <h3 id={`why-${organization.id}`} className="text-xs font-bold text-[#101828]">
                  {alignment ? `Why it matches ${alignmentSubject(alignment)}` : "Verified capability summary"}
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

              <section className="border-t border-[#b8dfe5] py-4 lg:border-r lg:border-t-0 lg:px-5 lg:py-0" aria-labelledby={`evidence-${organization.id}`}>
                <h3 id={`evidence-${organization.id}`} className="text-xs font-bold text-[#101828]">Sources</h3>
                <ul className="mt-2 space-y-2">
                  {evidence.slice(0, 3).map((citation) => (
                    <li key={citation.id} className="text-xs leading-5">
                      <a href={citation.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1 font-medium text-[#007f98] no-underline hover:underline">
                        <span>{citation.sourceTitle}</span>
                        <ExternalLink className="mt-0.5 size-3 shrink-0" />
                      </a>
                      <span className="block text-[10px] text-[#667085]">{citation.publisher}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="border-t border-[#b8dfe5] pt-4 lg:border-t-0 lg:pl-5 lg:pt-0" aria-labelledby={`posture-${organization.id}`}>
                <h3 id={`posture-${organization.id}`} className="text-xs font-bold text-[#101828]">Data quality</h3>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-xs lg:grid-cols-1">
                  <div>
                    <dt className="text-[10px] text-[#667085]">{alignment ? "Assessment confidence" : "Evidence strength"}</dt>
                    <dd className={cn(
                      "mt-1 inline-flex rounded px-2 py-1 text-[10px] font-semibold",
                      confidence === "high" ? "bg-[#dcfae6] text-[#067647]" : confidence === "moderate" ? "bg-[#fff1d6] text-[#7a2e0e]" : "bg-[#fee4e2] text-[#b42318]"
                    )}>{alignment ? assessmentConfidenceLabel(confidence) : evidenceStrengthLabel(confidence)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-[#667085]">Location accuracy</dt>
                    <dd className="mt-1 font-medium text-[#344054]">{location ? locationAccuracyLabel(location.geographicConfidence) : "Not verified"}</dd>
                  </div>
                </dl>
                <Link href={`/organizations/${organization.slug}`} className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#007f98] px-3 text-xs font-semibold text-white no-underline hover:bg-[#00677d] hover:no-underline">
                  View organization profile
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
