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
  FileCheck2,
  Filter,
  Info,
  List,
  LoaderCircle,
  Map as MapIcon,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X
} from "lucide-react";
import dynamic from "next/dynamic";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AssistantAnswer, AssistantFallback } from "@/components/atlas/assistant-answer";
import { PublicAtlasFooter } from "@/components/atlas/public-atlas-footer";
import { getAtlasEmptyState } from "@/lib/atlas/empty-state";
import {
  ATLAS_EXPLORER_PAGE_SIZE,
  projectAtlasExplorerOrganization
} from "@/lib/atlas/explorer-projection";
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
  openBetaFeedback,
  rememberBetaSearchId,
  trackBetaEvent
} from "@/lib/product-insights/client";
import { cn, formatDate, toTitleCase } from "@/lib/utils";
import type {
  AtlasAssistantPriorTurn,
  AtlasBounds,
  AtlasDemandRequirement,
  AtlasDiscoveryResult,
  AtlasExplorerCapability,
  AtlasExplorerOrganization,
  AtlasExplorerQueryResult,
  AtlasMissionArea,
  AtlasOrganization,
  AtlasQuery,
  AtlasRegion,
  AtlasTechnicalDomain
} from "@/types/atlas";

const publicOrganizationTypes = new Set([
  "company",
  "accelerator",
  "incubator",
  "research_test_centre",
  "investor_funder",
  "ecosystem_organization",
  "government_innovation_office"
]);

const AtlasMap = dynamic(
  () => import("@/components/atlas/atlas-map").then((module) => module.AtlasMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[350px] w-full items-center justify-center bg-[var(--atlas-surface-muted)] text-sm font-semibold text-[var(--atlas-muted)]">
        Loading the interactive map…
      </div>
    )
  }
);

type ViewMode = "map" | "table";

interface AtlasExplorerProps {
  initialResult: AtlasExplorerQueryResult;
  initialFilters: AtlasQuery;
  snapshotMetrics: { organizations: number; capabilities: number; sources: number };
  regions: AtlasRegion[];
  technicalDomains: AtlasTechnicalDomain[];
  missionAreas: AtlasMissionArea[];
  demandRequirements: AtlasDemandRequirement[];
  generatedAt: string;
}

function relevantCapability(organization: AtlasExplorerOrganization, filters: AtlasQuery): AtlasExplorerCapability | null {
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

function rowEvidence(organization: AtlasExplorerOrganization, capability: AtlasExplorerCapability | null) {
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
  snapshotMetrics,
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
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [mapEnabled, setMapEnabled] = useState(false);
  const [viewport, setViewport] = useState<{ bounds: AtlasBounds; organizationIds: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [discovery, setDiscovery] = useState<AtlasDiscoveryResult | null>(null);
  const [assistantTurns, setAssistantTurns] = useState<AtlasAssistantPriorTurn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [organizationDetails, setOrganizationDetails] = useState<Record<string, AtlasOrganization>>({});
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({});
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());

  useEffect(() => {
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    setMapEnabled(true);
    setViewMode("map");
  }, []);

  const exportHref = useMemo(() => {
    const params = atlasQueryToSearchParams({
      ...filters,
      bounds: viewport?.bounds,
      page: 1,
      pageSize: 1000
    });
    if (discovery?.assistant) {
      const visibleIds = viewport ? new Set(viewport.organizationIds) : null;
      const organizationIds = result.organizations
        .filter((organization) => !visibleIds || visibleIds.has(organization.id))
        .map((organization) => organization.id);
      params.set("organizationIds", organizationIds.join(","));
    }
    params.set("export", "atlas-results");
    return `/api/export?${params.toString()}`;
  }, [discovery?.assistant, filters, result.organizations, viewport]);

  const visibleOrganizations = useMemo(() => {
    if (!viewport) return result.organizations;
    const visibleIds = new Set(viewport.organizationIds);
    return result.organizations.filter((organization) => visibleIds.has(organization.id));
  }, [result.organizations, viewport]);

  const visibleEvidence = useMemo(() => {
    const citations = visibleOrganizations.flatMap((organization) => rowEvidence(organization, relevantCapability(organization, filters)));
    return Array.from(new Map(citations.map((citation) => [citation.sourceUrl, citation])).values());
  }, [filters, visibleOrganizations]);

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

  async function load(nextFilters: AtlasQuery, options: { updateQuestion?: boolean; preserveDiscovery?: boolean } = {}) {
    setLoading(true);
    setError(null);
    if (!options.preserveDiscovery) {
      setDiscovery(null);
      setAssistantTurns([]);
    }
    try {
      const params = atlasQueryToSearchParams({
        ...nextFilters,
        bounds: undefined,
        page: 1,
        pageSize: ATLAS_EXPLORER_PAGE_SIZE
      });
      const response = await fetch(`/api/atlas?${params.toString()}`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("The ecosystem map could not be refreshed.");
      const nextResult = (await response.json()) as AtlasExplorerQueryResult;
      setResult(nextResult);
      setFilters({ ...nextFilters, page: 1 });
      setViewport(null);
      setSelectedId(null);
      setExpandedId(null);
      setOrganizationDetails({});
      setDetailErrors({});
      if (options.updateQuestion) setQuestion(nextFilters.query ?? "");
      const browserParams = atlasQueryToSearchParams(nextFilters);
      window.history.replaceState(null, "", browserParams.size ? `/?${browserParams.toString()}` : "/");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "The ecosystem map could not be refreshed.");
    } finally {
      setLoading(false);
    }
  }

  async function runDiscovery(rawQuery: string) {
    const query = rawQuery.trim();
    if (!query) {
      setDiscovery(null);
      setAssistantTurns([]);
      rememberBetaSearchId(null);
      await load({});
      return;
    }

    setQuestion(query);
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
          sessionId: currentPilotSessionId(),
          priorTurns: assistantTurns
        })
      });
      if (!response.ok) throw new Error("The question could not be interpreted.");
      const nextDiscovery = (await response.json()) as AtlasDiscoveryResult;
      setDiscovery(nextDiscovery);
      rememberBetaSearchId(nextDiscovery.searchId);
      trackBetaEvent("atlas_search", {
        filter_count: Object.values(nextDiscovery.filters).filter(Boolean).length,
        result_count: nextDiscovery.organizationIds.length,
        interpretation: nextDiscovery.interpretation,
        mode: nextDiscovery.assistant ? "assistant" : "deterministic_fallback",
        outcome: nextDiscovery.assistant?.outcome ?? nextDiscovery.fallbackReason ?? "none",
        zero_result: nextDiscovery.organizationIds.length === 0
      }, { searchId: nextDiscovery.searchId });
      if (nextDiscovery.assistant && nextDiscovery.organizations) {
        const projectedOrganizations = nextDiscovery.organizations.map((organization) =>
          projectAtlasExplorerOrganization(organization, { query })
        );
        setResult({
          ...initialResult,
          organizations: projectedOrganizations,
          total: projectedOrganizations.length,
          page: 1,
          pageSize: Math.max(1, projectedOrganizations.length),
          appliedFilters: nextDiscovery.filterChips,
          hasMore: false,
          nextPage: null
        });
        setFilters({ query });
        setViewport(null);
        setSelectedId(null);
        setExpandedId(null);
        setOrganizationDetails({});
        setDetailErrors({});
        setAssistantTurns((turns) => [...turns, { query, organizationIds: nextDiscovery.organizationIds }].slice(-3));
        window.history.replaceState(null, "", "/");
        setLoading(false);
      } else {
        await load(nextDiscovery.filters, { preserveDiscovery: true });
      }
    } catch (discoveryError) {
      setError(discoveryError instanceof Error ? discoveryError.message : "The question could not be interpreted.");
      setLoading(false);
    }
  }

  async function submitDiscovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runDiscovery(question);
  }

  function startNewQuestion() {
    setQuestion("");
    setDiscovery(null);
    setAssistantTurns([]);
    rememberBetaSearchId(null);
    void load({}, { updateQuestion: true });
  }

  function selectAssistantOrganization(id: string) {
    setMapEnabled(true);
    setViewMode("map");
    updateSelection(id, true, "result");
    window.requestAnimationFrame(() => document.getElementById("ecosystem-map")?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  function updateSelection(id: string, revealInTable = false, source: "map" | "result" = "result") {
    setSelectedId(id);
    const organization = result.organizations.find((item) => item.id === id);
    trackBetaEvent(source === "map" ? "marker_select" : "result_select", {
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

  async function toggleExpanded(organization: AtlasExplorerOrganization, source: "mobile_list" | "table_expand") {
    setSelectedId(organization.id);
    trackBetaEvent("result_select", { organization: organization.slug, source });
    if (expandedId === organization.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(organization.id);
    if (organizationDetails[organization.id] || detailLoadingId === organization.id) return;

    setDetailLoadingId(organization.id);
    setDetailErrors((current) => {
      const next = { ...current };
      delete next[organization.id];
      return next;
    });
    try {
      const response = await fetch(`/api/organizations/${encodeURIComponent(organization.slug)}`, {
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error("The complete organization profile could not be loaded.");
      const detail = (await response.json()) as AtlasOrganization;
      setOrganizationDetails((current) => ({ ...current, [organization.id]: detail }));
    } catch (detailError) {
      setDetailErrors((current) => ({
        ...current,
        [organization.id]: detailError instanceof Error
          ? detailError.message
          : "The complete organization profile could not be loaded."
      }));
    } finally {
      setDetailLoadingId((current) => current === organization.id ? null : current);
    }
  }

  async function loadMore() {
    if (!result.nextPage || loading) return;
    setLoading(true);
    setError(null);
    try {
      const params = atlasQueryToSearchParams({
        ...filters,
        bounds: undefined,
        page: result.nextPage,
        pageSize: result.pageSize
      });
      const response = await fetch(`/api/atlas?${params.toString()}`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("More organizations could not be loaded.");
      const nextResult = (await response.json()) as AtlasExplorerQueryResult;
      setResult((current) => ({
        ...nextResult,
        organizations: Array.from(
          new Map([...current.organizations, ...nextResult.organizations].map((organization) => [organization.id, organization])).values()
        )
      }));
      setViewport(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "More organizations could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  const caveat = filters.demand
    ? "Potential demand connections are interpretations based on published sources, not eligibility, endorsement, or procurement guidance."
    : "Open a result to see what an organization offers, where it may fit, and which public sources support the profile.";

  return (
    <div className="atlas-frame pb-8 pt-6 sm:pt-12">
      <section className="mb-6 grid gap-5 sm:mb-8 sm:gap-8 lg:grid-cols-[minmax(0,1.18fr)_minmax(390px,0.82fr)] lg:items-end">
        <div className="max-w-4xl">
          <span className="inline-flex rounded-full bg-[var(--atlas-ink)] px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.11em] text-white">Canadian Public Beta</span>
          <h1 className="mt-4 max-w-4xl text-[36px] font-extrabold leading-[0.97] tracking-[-0.062em] text-[var(--atlas-ink)] sm:mt-5 sm:text-[52px] lg:text-[58px]"><span className="atlas-headline-highlight">Canada is building</span> more than most people can see.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--atlas-muted)] sm:mt-5 sm:text-base sm:leading-7">Discover the companies, technologies, and public needs shaping Canada’s defence and dual-use ecosystem. Follow the evidence, find the fit, and start the right conversation.</p>
        </div>
        <div className="space-y-4">
          <div className="rounded-[22px] border border-[var(--atlas-border)] bg-white p-4 shadow-[var(--atlas-shadow-soft)] sm:p-5">
            <dl className="grid grid-cols-3 divide-x divide-[var(--atlas-border)]">
              <SnapshotMetric value={snapshotMetrics.organizations} label="reviewed organizations" />
              <SnapshotMetric value={snapshotMetrics.capabilities} label="reviewed technologies" />
              <SnapshotMetric value={snapshotMetrics.sources} label="public sources" />
            </dl>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--atlas-border)] pt-4">
              <span className="atlas-signal-pill">Updated {formatDate(generatedAt)}</span>
              <button type="button" onClick={openBetaFeedback} className="hidden text-xs font-bold text-[var(--atlas-ink)] underline decoration-[var(--atlas-signal)] decoration-2 underline-offset-4 sm:inline-flex">Tell us what is missing</button>
            </div>
          </div>
          <p className="flex items-start gap-3 rounded-[18px] border border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] p-3 text-xs leading-5 text-[var(--atlas-muted)] sm:p-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--atlas-violet-soft)] text-[var(--atlas-violet)]"><ShieldCheck className="size-4" /></span>
            <span><strong className="block text-[var(--atlas-ink-soft)]">Reviewed public sources · transparent gaps · human review</strong><span className="hidden sm:inline">Open a result to inspect what supports the profile and where interpretation begins.</span></span>
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-[26px] border border-[var(--atlas-border)] bg-white shadow-[var(--atlas-shadow-soft)]">
        <div className="border-b border-[var(--atlas-border)] bg-white p-3 sm:p-5">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[var(--atlas-primary)]">Ask True North</p><p className="mt-1 text-sm text-[var(--atlas-muted)]">Describe what you need. See the best-supported fits, the evidence behind them, and what remains unknown.</p></div>
            {discovery?.quota ? <p className="text-[11px] font-semibold text-[var(--atlas-muted)]">{discovery.quota.remaining} of {discovery.quota.limit} questions remaining today</p> : null}
          </div>
          <form onSubmit={submitDiscovery} role="search" aria-label="Search the Canadian ecosystem map">
            <div className="relative grid gap-2 sm:block">
              <Search className="pointer-events-none absolute left-4 top-7 size-5 -translate-y-1/2 text-[var(--atlas-muted)] sm:top-1/2" aria-hidden="true" />
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                className="h-14 w-full rounded-[18px] border border-[var(--atlas-border-strong)] bg-white pl-12 pr-4 text-[15px] text-[var(--atlas-ink)] outline-none placeholder:text-[var(--atlas-muted)] focus:border-[var(--atlas-ink)] focus:ring-4 focus:ring-[var(--atlas-signal-soft)] sm:h-16 sm:pr-40 sm:text-base"
                placeholder="What are you trying to build, source, or understand?"
                aria-label="Search the ecosystem map in natural language"
                maxLength={500}
              />
              <button type="submit" className="atlas-primary-button h-11 w-full gap-2 px-4 text-sm disabled:opacity-60 sm:absolute sm:right-1.5 sm:top-1/2 sm:h-[52px] sm:w-auto sm:-translate-y-1/2 sm:px-5" disabled={loading}>
                {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
                <span>Explore the map</span>
                {!loading ? <ArrowRight className="hidden size-4 text-[var(--atlas-signal)] sm:block" /> : null}
              </button>
            </div>
          </form>
          <p className="mt-2 text-[11px] leading-5 text-[var(--atlas-muted)]">Uses reviewed public records only. Do not enter classified, confidential, proprietary, or personal information.</p>

          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-h-9 flex-wrap items-center gap-2">
              {result.appliedFilters.map((filter) => (
                <button key={`${filter.key}-${filter.value}`} type="button" onClick={() => { if (filter.key === "query" || filter.key === "metro") rememberBetaSearchId(null); void load(filterWithout(filters, filter.key), { updateQuestion: filter.key === "query" || filter.key === "metro" }); }} className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--atlas-primary-border)] bg-[var(--atlas-primary-soft)] px-3 text-xs font-medium text-[var(--atlas-primary)] hover:border-[var(--atlas-primary)]" aria-label={`Remove ${filter.label}: ${filter.value}`}>
                  <span>{filter.label}: {filter.value}</span><X className="size-3.5" />
                </button>
              ))}
              {result.appliedFilters.length === 0 ? <span className="inline-flex h-9 items-center rounded-xl border border-[var(--atlas-border)] bg-white px-3 text-xs font-semibold text-[var(--atlas-ink-soft)]">Canada-wide view</span> : null}
              <button type="button" onClick={() => setFilterPanelOpen((value) => !value)} className="atlas-secondary-button h-9 gap-2 px-3 text-xs" aria-expanded={filterPanelOpen}><SlidersHorizontal className="size-4" />Filters</button>
              <button type="button" onClick={() => { setMapEnabled(true); setViewMode("map"); }} className={cn("inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-bold", viewMode === "map" ? "border-[var(--atlas-signal)] bg-[var(--atlas-signal)] text-[var(--atlas-ink)]" : "border-[var(--atlas-border)] bg-white text-[var(--atlas-ink-soft)]")}><MapIcon className="size-4" />Map</button>
              <button type="button" onClick={() => { if (window.matchMedia("(min-width: 1024px)").matches) document.getElementById("atlas-results")?.scrollIntoView({ behavior: "smooth", block: "start" }); else setViewMode("table"); }} className={cn("inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-bold", viewMode === "table" ? "border-[var(--atlas-signal)] bg-[var(--atlas-signal)] text-[var(--atlas-ink)]" : "border-[var(--atlas-border)] bg-white text-[var(--atlas-ink-soft)]")}><List className="size-4" />Table</button>
            </div>
            <p className="flex max-w-[470px] items-start gap-2 text-xs leading-5 text-[var(--atlas-muted)] lg:justify-end lg:text-right"><Info className="mt-0.5 size-4 shrink-0 text-[var(--atlas-violet)]" aria-hidden="true" /><span>{caveat}</span></p>
          </div>

          {filterPanelOpen ? (
            <section className="mt-3 rounded-2xl border border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] p-4" aria-label="Ecosystem map filters">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <FilterSelect label="Region" value={filters.region ?? ""} options={regions.map((region) => ({ value: region.slug, label: `${region.name} (${region.organizationCount})` }))} onChange={(value) => { trackBetaEvent("filter_apply", { filter: "region", value: value || "all" }); void load({ ...filters, region: value || undefined }); }} />
                <FilterSelect label="Organization type" value={filters.type ?? ""} options={result.facets.organizationTypes.filter((type) => publicOrganizationTypes.has(type.value)).map((type) => ({ value: type.value, label: `${type.label} (${type.count})` }))} onChange={(value) => { trackBetaEvent("filter_apply", { filter: "type", value: value || "all" }); void load({ ...filters, type: value || undefined }); }} />
                <FilterSelect label="Technology area" value={filters.domain ?? ""} options={technicalDomains.map((domain) => ({ value: domain.slug, label: domain.name }))} onChange={(value) => { trackBetaEvent("filter_apply", { filter: "domain", value: value || "all" }); void load({ ...filters, domain: value || undefined }); }} />
                <FilterSelect label="Mission or use case" value={filters.mission ?? ""} options={missionAreas.map((mission) => ({ value: mission.slug, label: mission.name }))} onChange={(value) => { trackBetaEvent("filter_apply", { filter: "mission", value: value || "all" }); void load({ ...filters, mission: value || undefined }); }} />
                <FilterSelect label="Public demand" value={filters.demand ?? ""} options={demandRequirements.map((demand) => ({ value: demand.slug, label: demand.title }))} onChange={(value) => { trackBetaEvent("filter_apply", { filter: "demand", value: value || "all" }); void load({ ...filters, demand: value || undefined }); }} />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[var(--atlas-border)] pt-3"><span className="text-xs text-[var(--atlas-muted)]">Filters update the map, results, URL, and export together.</span><button type="button" className="text-xs font-semibold text-[var(--atlas-primary)] hover:underline" onClick={() => { rememberBetaSearchId(null); setDiscovery(null); void load({}, { updateQuestion: true }); }}>Clear all</button></div>
            </section>
          ) : null}

          {error ? <div className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--atlas-danger)] bg-[var(--atlas-danger-soft)] px-3 py-2 text-sm text-[var(--atlas-danger)]" role="alert"><CircleAlert className="mt-0.5 size-4 shrink-0" />{error}</div> : null}
          {discovery?.fallbackReason ? <AssistantFallback reason={discovery.fallbackReason} quota={discovery.quota} /> : null}
          {discovery?.interpretation === "no_match" && !discovery.assistant ? <div className="mt-3 rounded-xl border border-[var(--atlas-amber)] bg-[var(--atlas-amber-soft)] px-3 py-2 text-sm text-[var(--atlas-amber)]">No published records match every interpreted filter. Try a broader geography, remove one filter, or tell us what is missing.</div> : null}
        </div>
        {discovery?.assistant ? <div className="bg-[var(--atlas-surface-muted)] px-3 pb-3 sm:px-5 sm:pb-5"><AssistantAnswer discovery={discovery} onSelectOrganization={selectAssistantOrganization} onAskSuggestion={(suggestion) => void runDiscovery(suggestion)} onStartNewQuestion={startNewQuestion} /></div> : null}
        <div id="ecosystem-map" className={cn("scroll-mt-24 border-b border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-3 lg:p-3", viewMode === "table" && "hidden lg:grid")}>
          <div className="relative h-[350px] overflow-hidden sm:h-[410px] lg:h-[510px] lg:rounded-[22px] lg:border lg:border-[var(--atlas-border)]">
            {mapEnabled ? (
              <AtlasMap
                organizations={result.organizations}
                selectedOrganizationId={selectedId}
                onSelect={(id) => updateSelection(id, true, "map")}
                onViewportChange={updateViewport}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[var(--atlas-surface-muted)] text-sm font-semibold text-[var(--atlas-muted)]">
                Preparing the interactive map…
              </div>
            )}

            <div className="pointer-events-none absolute left-3 top-3 z-[1000] rounded-xl border border-white/80 bg-white/95 px-3 py-2 text-xs font-bold text-[var(--atlas-ink)] shadow-[var(--atlas-shadow-soft)] backdrop-blur sm:left-4 sm:top-4">
              {viewport ? `${visibleOrganizations.length} ${visibleOrganizations.length === 1 ? "organization" : "organizations"} in view` : "Updating map results…"}
            </div>

            <div className="absolute right-3 top-3 z-[1000] flex overflow-hidden rounded-xl border border-white/80 bg-white p-0.5 shadow-[var(--atlas-shadow-soft)] lg:hidden">
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded px-3 text-xs font-semibold text-[var(--atlas-ink-soft)] hover:bg-[var(--atlas-signal-soft)]"
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
          <ResultsRail
            organizations={visibleOrganizations}
            filters={filters}
            selectedId={selectedId}
            onSelect={(id) => updateSelection(id, true, "result")}
          />
        </div>

        <div id="atlas-results" className={cn("scroll-mt-24", viewMode === "map" && "hidden lg:block")}>
          <div className="flex flex-col gap-3 border-b border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="text-base font-bold tracking-[-0.01em] text-[var(--atlas-ink)]">Organizations in this map view</h2>
                <span className="text-xs text-[var(--atlas-muted)]">
                  {visibleOrganizations.length} {visibleOrganizations.length === 1 ? "organization" : "organizations"}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--atlas-muted)]">
                <span className="hidden lg:inline">Pan or zoom the map to update these results. Select a row to locate it on the map.</span>
                <span className="lg:hidden">{viewport ? "Only organizations inside the last visible map area are included." : "Showing published organizations. Open the map to narrow this list by view."}</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href={exportHref} className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--atlas-primary)] no-underline hover:underline">
                <Download className="size-4" />
                Export visible results
              </Link>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--atlas-border)] bg-white px-3 text-xs font-semibold text-[var(--atlas-ink-soft)] shadow-sm hover:bg-[var(--atlas-surface-muted)] lg:hidden"
                onClick={() => {
                  setMapEnabled(true);
                  setViewMode("map");
                }}
                aria-label="Return to map"
              >
                <MapIcon className="size-4" />
                Map
              </button>
            </div>
          </div>

          {visibleOrganizations.length ? (
            <>
              <ul className="divide-y divide-[var(--atlas-border)] lg:hidden" aria-label="Organizations in the current map view">
                {visibleOrganizations.map((organization) => (
                  <MobileOrganizationCard
                    key={organization.id}
                    organization={organizationDetails[organization.id] ?? organization}
                    capability={relevantCapability(organizationDetails[organization.id] ?? organization, filters)}
                    filters={filters}
                    expanded={expandedId === organization.id}
                    selected={selectedId === organization.id}
                    detailLoading={detailLoadingId === organization.id}
                    detailError={detailErrors[organization.id]}
                    onToggle={() => {
                      void toggleExpanded(organization, "mobile_list");
                    }}
                  />
                ))}
              </ul>
              <div ref={tableScrollRef} className="hidden max-h-[540px] overflow-auto lg:block">
                <table className="w-full min-w-[960px] border-collapse text-left" aria-label="Organizations in the current map view">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] text-[11px] font-semibold text-[var(--atlas-muted)] shadow-[0_1px_0_var(--atlas-border)]">
                      <th scope="col" className="w-10 px-3 py-2.5"><span className="sr-only">Expand</span></th>
                      <th scope="col" className="px-2 py-2.5">Organization</th>
                      <th scope="col" className="px-3 py-2.5">Technology or offering</th>
                      <th scope="col" className="px-3 py-2.5">Region</th>
                      <th scope="col" className="px-3 py-2.5">Where it fits</th>
                      <th scope="col" className="px-3 py-2.5">Sources</th>
                      <th scope="col" className="px-3 py-2.5">Last verified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleOrganizations.map((organization) => (
                      <OrganizationRows
                        key={organization.id}
                        organization={organizationDetails[organization.id] ?? organization}
                        capability={relevantCapability(organizationDetails[organization.id] ?? organization, filters)}
                        filters={filters}
                        expanded={expandedId === organization.id}
                        selected={selectedId === organization.id}
                        detailLoading={detailLoadingId === organization.id}
                        detailError={detailErrors[organization.id]}
                        rowRef={(node) => {
                          if (node) rowRefs.current.set(organization.id, node);
                          else rowRefs.current.delete(organization.id);
                        }}
                        onSelect={() => updateSelection(organization.id, false, "result")}
                        onToggleExpanded={() => {
                          void toggleExpanded(organization, "table_expand");
                        }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="px-6 py-14 text-center" aria-live="polite">
              <Filter className="mx-auto size-7 text-[var(--atlas-muted)]" />
              <h2 className="mt-4 text-base font-semibold text-[var(--atlas-ink)]">{emptyState.title}</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--atlas-muted)]">
                {emptyState.description}
              </p>
              {emptyState.kind === "search" ? (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
                  <button type="button" className="text-sm font-semibold text-[var(--atlas-primary)] hover:underline" onClick={() => { rememberBetaSearchId(null); setDiscovery(null); void load({}, { updateQuestion: true }); }}>
                    Clear search
                  </button>
                  <button type="button" className="text-sm font-semibold text-[var(--atlas-primary)] hover:underline" onClick={openBetaFeedback}>
                    Tell us what is missing
                  </button>
                </div>
              ) : (
                <button type="button" className="mt-5 text-sm font-semibold text-[var(--atlas-primary)] hover:underline lg:hidden" onClick={() => setViewMode("map")}>
                  Return to map
                </button>
              )}
            </div>
          )}

          {result.hasMore ? (
            <div className="flex flex-col items-center gap-2 border-t border-[var(--atlas-border)] bg-white px-4 py-5 text-center">
              <p className="text-xs text-[var(--atlas-muted)]">
                {result.organizations.length} of {result.total} matching organizations loaded
              </p>
              <button
                type="button"
                className="atlas-secondary-button h-10 gap-2 px-4 text-xs disabled:opacity-60"
                onClick={() => void loadMore()}
                disabled={loading}
              >
                {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
                Load more organizations
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <PublicEvidenceLedger citations={visibleEvidence} />

      <PublicAtlasFooter generatedLabel={`Snapshot generated ${formatDate(generatedAt)}. Reviewed public sources only; coverage gaps remain explicit.`} />
    </div>
  );
}

function SnapshotMetric({ value, label }: { value: number; label: string }) {
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

function ResultsRail({
  organizations,
  filters,
  selectedId,
  onSelect
}: {
  organizations: AtlasExplorerOrganization[];
  filters: AtlasQuery;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="atlas-dark-panel hidden h-[510px] overflow-hidden lg:flex lg:flex-col" aria-label="Organizations in the current map view">
      <div className="border-b border-white/15 px-5 py-5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/60">Organizations in view</p>
        <p className="mt-2 text-lg font-extrabold tracking-[-0.025em] text-[var(--atlas-signal)]">{organizations.length} reviewed {organizations.length === 1 ? "organization" : "organizations"}</p>
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

function PublicEvidenceLedger({ citations }: { citations: ReturnType<typeof rowEvidence> }) {
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

function LookbookPeek({
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
        )}>{alignment ? `${assessmentConfidenceLabel(confidence)} fit confidence` : `${evidenceStrengthLabel(confidence)} source support`}</span>
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

function MobileOrganizationCard({
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
              <span className="block text-[10px] text-[var(--atlas-muted)]">{alignment ? "Fit confidence" : "Source support"}</span>
              <span className={cn(
                "mt-1 inline-flex rounded px-2 py-1 text-[10px] font-semibold",
                confidence === "high" ? "bg-[var(--atlas-primary-soft)] text-[var(--atlas-primary)]" : confidence === "moderate" ? "bg-[var(--atlas-amber-soft)] text-[var(--atlas-amber)]" : "bg-[var(--atlas-danger-soft)] text-[var(--atlas-danger)]"
              )}>{alignment ? assessmentConfidenceLabel(confidence) : evidenceStrengthLabel(confidence)}</span>
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

function OrganizationRows({
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
                    <dt className="text-[10px] text-[var(--atlas-muted)]">{alignment ? "Fit confidence" : "Source support"}</dt>
                    <dd className={cn(
                      "mt-1 inline-flex rounded px-2 py-1 text-[10px] font-semibold",
                      confidence === "high" ? "bg-[var(--atlas-primary-soft)] text-[var(--atlas-primary)]" : confidence === "moderate" ? "bg-[var(--atlas-amber-soft)] text-[var(--atlas-amber)]" : "bg-[var(--atlas-danger-soft)] text-[var(--atlas-danger)]"
                    )}>{alignment ? assessmentConfidenceLabel(confidence) : evidenceStrengthLabel(confidence)}</dd>
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
