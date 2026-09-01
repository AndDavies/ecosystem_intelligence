"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  CircleAlert,
  Download,
  Filter,
  Info,
  List,
  LoaderCircle,
  Map as MapIcon,
  MessageSquareText,
  RotateCcw,
  ScanSearch,
  SlidersHorizontal,
  X
} from "lucide-react";
import dynamic from "next/dynamic";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AssistantAnswer, AssistantFallback } from "@/components/atlas/assistant-answer";
import { AtlasLensBand, type AtlasLens, type AtlasLensKey } from "@/components/atlas/atlas-lens-band";
import { AtlasRecordLookup } from "@/components/atlas/atlas-record-lookup";
import {
  FilterSelect,
  LookbookPeek,
  MobileOrganizationCard,
  MobileResultsSheet,
  type MobileResultsSheetState,
  OrganizationRows,
  PublicEvidenceLedger,
  relevantCapability,
  ResultsRail,
  rowEvidence
} from "@/components/atlas/atlas-explorer-results";
import { PublicAtlasFooter } from "@/components/atlas/public-atlas-footer";
import { NorthSignalInline } from "@/components/atlas/north-signal-signup";
import { PublicShare } from "@/components/atlas/public-share";
import { EvidenceLegendDisclosure } from "@/components/atlas/evidence-legend";
import { getAtlasEmptyState } from "@/lib/atlas/empty-state";
import { guidedSearchFocusForId, guidedSearchFromQuery, guidedSearchQuestion } from "@/lib/atlas/guided-search";
import { publicOrganizationTypes } from "@/lib/atlas/lens-options";
import {
  ATLAS_EXPLORER_PAGE_SIZE,
  projectAtlasExplorerOrganization,
  selectedExplorerCapabilityIds,
  projectAtlasMapOrganization
} from "@/lib/atlas/explorer-projection";
import { atlasQueryToSearchParams } from "@/lib/atlas/query-params";
import {
  currentPilotCohort,
  currentPilotSessionId,
  openBetaFeedback,
  rememberBetaSearchId,
  trackBetaEvent
} from "@/lib/product-insights/client";
import { cn, formatDate } from "@/lib/utils";
import type {
  AtlasAssistantPriorTurn,
  AtlasBounds,
  AtlasExplorerDemandOption,
  AtlasExplorerFilterOption,
  AtlasExplorerTypeOption,
  AtlasDiscoveryResult,
  AtlasExplorerOrganization,
  AtlasExplorerQueryResult,
  AtlasLookupSuggestion,
  AtlasOrganization,
  AtlasQuery,
  AtlasRegion,
} from "@/types/atlas";

const suggestedQuestions = [
  "Arctic communications capability",
  "Maritime sensor systems",
  "Technology for contested logistics"
] as const;

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

function mapPathForQuery(query: AtlasQuery) {
  const params = atlasQueryToSearchParams(query);
  return params.size ? `/map?${params.toString()}` : "/map";
}

interface AtlasExplorerProps {
  initialResult: AtlasExplorerQueryResult;
  initialFilters: AtlasQuery;
  regions: AtlasRegion[];
  technicalDomains: AtlasExplorerFilterOption[];
  missionAreas: AtlasExplorerFilterOption[];
  demandRequirements: AtlasExplorerDemandOption[];
  organizationTypes: AtlasExplorerTypeOption[];
  generatedAt: string;
  canonicalizeExample?: boolean;
  focusNeedOnMount?: boolean;
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
  if (key === "cluster") delete next.cluster;
  if (key === "focus") delete next.focus;
  if (key === "selected") delete next.selected;
  return next;
}

export function AtlasExplorer({
  initialResult,
  initialFilters,
  regions,
  technicalDomains,
  missionAreas,
  demandRequirements,
  organizationTypes,
  generatedAt,
  canonicalizeExample = false,
  focusNeedOnMount = false
}: AtlasExplorerProps) {
  const [filters, setFilters] = useState<AtlasQuery>(initialFilters);
  const [result, setResult] = useState(initialResult);
  const [question, setQuestion] = useState("");
  const [askOpen, setAskOpen] = useState(focusNeedOnMount);
  const [selectedId, setSelectedId] = useState<string | null>(initialFilters.selected ?? null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(initialFilters.view ?? "map");
  const [mapEnabled, setMapEnabled] = useState(initialFilters.view !== "table");
  const [mobileResultsState, setMobileResultsState] = useState<MobileResultsSheetState>("collapsed");
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
  const detailRequestsRef = useRef(new Set<string>());

  useEffect(() => {
    if (canonicalizeExample) {
      const params = atlasQueryToSearchParams(initialFilters);
      window.history.replaceState(null, "", params.size ? `/map?${params.toString()}` : "/map");
    }
    if (focusNeedOnMount) {
      window.requestAnimationFrame(() => {
        document.getElementById("atlas-question")?.focus({ preventScroll: true });
      });
    }
  }, [canonicalizeExample, focusNeedOnMount, initialFilters]);

  useEffect(() => {
    const restoreFromHistory = () => window.location.reload();
    window.addEventListener("popstate", restoreFromHistory);
    return () => window.removeEventListener("popstate", restoreFromHistory);
  }, []);

  useEffect(() => {
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    if (!initialFilters.view) {
      setMapEnabled(true);
      setViewMode("map");
    }
  }, [initialFilters.view]);

  function writeMapState(nextFilters: AtlasQuery, mode: "push" | "replace" = "push") {
    const path = mapPathForQuery(nextFilters);
    window.history[mode === "push" ? "pushState" : "replaceState"](null, "", path);
  }

  function changeViewMode(nextView: ViewMode) {
    setMapEnabled(nextView === "map" || mapEnabled);
    setViewMode(nextView);
    const nextFilters = { ...filters, view: nextView, selected: selectedId ?? undefined };
    setFilters(nextFilters);
    writeMapState(nextFilters);
  }

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

  const visibleMapOrganizations = useMemo(() => {
    if (!viewport) return result.mapOrganizations;
    const visibleIds = new Set(viewport.organizationIds);
    return result.mapOrganizations.filter((organization) => visibleIds.has(organization.id));
  }, [result.mapOrganizations, viewport]);

  const selectedOrganization = useMemo(() => {
    const detail = selectedId ? organizationDetails[selectedId] : null;
    const preview = result.organizations.find((organization) => organization.id === selectedId) ?? null;
    if (detail) {
      const preferredCapabilityIds = selectedExplorerCapabilityIds(
        filters,
        preview?.capabilities.map((capability) => capability.id)
      );
      return projectAtlasExplorerOrganization(detail, filters, preferredCapabilityIds);
    }
    return preview;
  }, [filters, organizationDetails, result.organizations, selectedId]);

  const visibleOrganizationsWithDetails = useMemo(() => {
    const organizations = visibleOrganizations.map((organization) => {
      const detail = organizationDetails[organization.id];
      return detail
        ? projectAtlasExplorerOrganization(detail, filters, new Set(organization.capabilities.map((capability) => capability.id)))
        : organization;
    });
    const selectedIsVisible = selectedOrganization && visibleMapOrganizations.some((organization) => organization.id === selectedOrganization.id);
    if (!selectedIsVisible || organizations.some((organization) => organization.id === selectedOrganization.id)) return organizations;
    return [selectedOrganization, ...organizations];
  }, [filters, organizationDetails, selectedOrganization, visibleMapOrganizations, visibleOrganizations]);

  const visibleEvidence = useMemo(() => {
    const citations = visibleOrganizationsWithDetails.flatMap((organization) => rowEvidence(organization, relevantCapability(organization, filters)));
    return Array.from(new Map(citations.map((citation) => [citation.sourceUrl, citation])).values());
  }, [filters, visibleOrganizationsWithDetails]);

  const selectedCapability = useMemo(
    () => (selectedOrganization ? relevantCapability(selectedOrganization, filters) : null),
    [filters, selectedOrganization]
  );

  // The four guided lenses reuse the exact option data the filter panel uses,
  // so a lens selection and a panel selection travel the same load/URL path.
  const guidedLenses = useMemo<AtlasLens[]>(() => [
    { key: "mission", label: "Mission Area", allOptionLabel: "All Mission Areas", options: missionAreas.map((mission) => ({ value: mission.slug, label: mission.name, count: mission.count })) },
    { key: "demand", label: "Public Need", allOptionLabel: "All Public Needs", options: demandRequirements.map((demand) => ({ value: demand.slug, label: demand.title, count: demand.count })) },
    { key: "domain", label: "Technology Area", shortLabel: "Technology", allOptionLabel: "All technology areas", options: technicalDomains.map((domain) => ({ value: domain.slug, label: domain.name, count: domain.count })) },
    { key: "type", label: "Organization type", shortLabel: "Organization", allOptionLabel: "All organization types", options: organizationTypes.map((type) => ({ value: type.value, label: type.label, count: type.count })) }
  ], [demandRequirements, missionAreas, organizationTypes, technicalDomains]);

  function applyLensSelection(key: AtlasLensKey, value: string) {
    trackBetaEvent("filter_apply", { filter: key, value: value || "all" });
    void load({ ...filters, [key]: value || undefined });
  }
  const emptyState = getAtlasEmptyState({
    totalResults: result.total,
    submittedQuery: discovery?.query ?? filters.query
  });

  async function load(nextFilters: AtlasQuery, options: { preserveDiscovery?: boolean } = {}) {
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
      const refreshedFilters = { ...nextFilters, page: 1, selected: undefined };
      setFilters(refreshedFilters);
      setViewport(null);
      setSelectedId(null);
      setExpandedId(null);
      setOrganizationDetails({});
      setDetailErrors({});
      writeMapState(refreshedFilters);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "The ecosystem map could not be refreshed.");
    } finally {
      setLoading(false);
    }
  }

  async function runDiscovery(rawQuery: string) {
    const query = rawQuery.trim();
    if (!query) return;

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
          mapOrganizations: nextDiscovery.organizations.map(projectAtlasMapOrganization),
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
        window.history.replaceState(null, "", "/map");
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
    void load({});
  }

  function commitRecordLookup(query: string) {
    rememberBetaSearchId(null);
    trackBetaEvent("filter_apply", { filter: "query", value: "set" }, { searchId: null });
    setAskOpen(false);
    void load({
      ...filters,
      query,
      bounds: undefined,
      selected: undefined,
      page: 1
    });
  }

  function clearRecordLookup() {
    rememberBetaSearchId(null);
    trackBetaEvent("filter_apply", { filter: "query", value: "all" }, { searchId: null });
    void load(filterWithout(filters, "query"));
  }

  function selectLookupSuggestion(suggestion: AtlasLookupSuggestion) {
    rememberBetaSearchId(null);
    if (suggestion.filter) {
      trackBetaEvent("filter_apply", {
        filter: suggestion.filter.key,
        value: suggestion.filter.value
      }, { searchId: null });
      setAskOpen(false);
      void load({
        ...filterWithout(filters, "query"),
        [suggestion.filter.key]: suggestion.filter.value,
        bounds: undefined,
        selected: undefined,
        page: 1
      });
      return;
    }
    trackBetaEvent("result_select", {
      organization: suggestion.organizationSlug ?? (suggestion.kind === "organization" ? suggestion.slug : "unknown"),
      source: "atlas_lookup",
      presentation: suggestion.kind,
      target: `${suggestion.kind}:${suggestion.slug}`,
      destination: suggestion.kind === "organization" ? "organization_profile" : "capability_profile"
    }, { searchId: null });
  }

  function openAskTrueNorth() {
    setAskOpen(true);
    window.requestAnimationFrame(() => {
      document.getElementById("atlas-question")?.focus({ preventScroll: true });
    });
  }

  function selectAssistantOrganization(id: string) {
    setMapEnabled(true);
    setViewMode("map");
    setMobileResultsState("preview");
    updateSelection(id, true, "result", "map");
    window.requestAnimationFrame(() => document.getElementById("ecosystem-map")?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  function updateSelection(id: string, revealInTable = false, source: "map" | "result" = "result", nextView = viewMode) {
    setSelectedId(id);
    const nextFilters = { ...filters, view: nextView, selected: id, bounds: viewport?.bounds };
    setFilters(nextFilters);
    writeMapState(nextFilters);
    const organization = result.mapOrganizations.find((item) => item.id === id);
    trackBetaEvent(source === "map" ? "marker_select" : "result_select", {
      organization: organization?.slug ?? "unknown",
      source
    });
    if (source === "map" && !window.matchMedia("(min-width: 1024px)").matches) setMobileResultsState("preview");
    if (!revealInTable) return;
    window.requestAnimationFrame(() => {
      const container = tableScrollRef.current;
      const row = rowRefs.current.get(id);
      if (!container || !row) return;
      container.scrollTo({ top: Math.max(0, row.offsetTop - 44), behavior: "smooth" });
    });
  }

  const loadOrganizationDetail = useCallback(async (organization: { id: string; slug: string }) => {
    if (organizationDetails[organization.id] || detailRequestsRef.current.has(organization.id)) return;

    detailRequestsRef.current.add(organization.id);
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
      detailRequestsRef.current.delete(organization.id);
      setDetailLoadingId((current) => current === organization.id ? null : current);
    }
  }, [organizationDetails]);

  useEffect(() => {
    if (!selectedId) return;
    const organization = result.organizations.find((item) => item.id === selectedId)
      ?? result.mapOrganizations.find((item) => item.id === selectedId);
    if (organization) void loadOrganizationDetail(organization);
  }, [loadOrganizationDetail, result.mapOrganizations, result.organizations, selectedId]);

  function selectMapOrganization(id: string) {
    updateSelection(id, false, "map");
    if (organizationDetails[id]) return;
    const organization = result.organizations.find((item) => item.id === id)
      ?? result.mapOrganizations.find((item) => item.id === id);
    if (organization) void loadOrganizationDetail(organization);
  }

  function updateViewport(nextViewport: { bounds: AtlasBounds; organizationIds: string[] }) {
    const nextSelectedId = selectedId && nextViewport.organizationIds.includes(selectedId) ? selectedId : null;
    const nextFilters = {
      ...filters,
      bounds: nextViewport.bounds,
      view: viewMode,
      selected: nextSelectedId ?? undefined
    };
    setViewport(nextViewport);
    setSelectedId(nextSelectedId);
    setFilters(nextFilters);
    // Panning is a refinement of the current map view, not a new history step.
    // Replace keeps Back useful while making copied and return URLs reproducible.
    writeMapState(nextFilters, "replace");
  }

  async function toggleExpanded(organization: AtlasExplorerOrganization, source: "mobile_list" | "table_expand") {
    setSelectedId(organization.id);
    const nextFilters = { ...filters, view: viewMode, selected: organization.id, bounds: viewport?.bounds };
    setFilters(nextFilters);
    writeMapState(nextFilters);
    trackBetaEvent("result_select", { organization: organization.slug, source });
    if (expandedId === organization.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(organization.id);
    await loadOrganizationDetail(organization);
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
    ? "Potential Public Need connections are interpretations based on published sources, not eligibility, endorsement, or procurement guidance."
    : "Open a result to see what an organization offers, where it may fit, and which public sources support the profile.";
  const guidedSearch = guidedSearchFromQuery(filters);
  const mapReturnTo = mapPathForQuery({
    ...filters,
    bounds: viewport?.bounds,
    view: viewMode,
    selected: selectedId ?? undefined
  });

  function removeGuidedFocus(focusId: NonNullable<AtlasQuery["focus"]>[number]) {
    const nextFocus = filters.focus?.filter((item) => item !== focusId) ?? [];
    void load({
      ...filters,
      focus: nextFocus.length ? nextFocus : undefined,
      selected: undefined,
      page: 1
    });
  }

  function resetMap() {
    rememberBetaSearchId(null);
    setDiscovery(null);
    setQuestion("");
    setAskOpen(false);
    setMobileResultsState("collapsed");
    void load({});
  }

  return (
    <div className="atlas-frame pb-8 pt-3 sm:pt-4">
      <section id="atlas-discovery" className="scroll-mt-24 border border-[var(--atlas-border)] bg-white shadow-[var(--atlas-shadow-soft)]">
        <div className="border-t-2 border-[var(--atlas-signal)] bg-white p-3 sm:p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[var(--atlas-primary)]">Explore True North Map</p>
              <h1 className="mt-1 font-[family-name:var(--font-barlow)] text-xl font-extrabold tracking-[-0.025em] text-[var(--atlas-ink)] sm:text-2xl">Find a company, capability or area of interest.</h1>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--atlas-muted)]">Search published organizations, capabilities, technology areas, Mission Areas and Public Needs. This search matches records directly and does not use AI.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-extrabold text-[var(--atlas-evidence)]">{result.total.toLocaleString("en-CA")} published results</span>
            </div>
          </div>

          <AtlasRecordLookup
            committedQuery={discovery ? "" : filters.query ?? ""}
            busy={loading}
            hideSuggestions={askOpen}
            onCommit={commitRecordLookup}
            onClear={clearRecordLookup}
            onOpenAsk={openAskTrueNorth}
            onSearchFocus={() => setAskOpen(false)}
            onSelectSuggestion={selectLookupSuggestion}
          />

          <div id="ask-true-north" className="scroll-mt-24">
            <button
              type="button"
              className="mt-2 flex min-h-11 w-full items-center justify-between gap-3 rounded-[12px] px-3 text-left text-xs text-[var(--atlas-muted)] outline-none hover:bg-[var(--atlas-blue-soft)] focus-visible:ring-2 focus-visible:ring-[var(--atlas-primary)]"
              aria-expanded={askOpen}
              aria-controls="ask-true-north-panel"
              onClick={() => {
                if (askOpen) setAskOpen(false);
                else openAskTrueNorth();
              }}
            >
              <span className="flex min-w-0 items-center gap-2">
                <MessageSquareText className="size-4 shrink-0 text-[var(--atlas-primary)]" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--atlas-primary)]">Ask True North · AI-assisted</span>
                  <strong className="mt-0.5 block text-xs leading-5 text-[var(--atlas-ink)]">Describe a challenge. See which Canadian capabilities may help.</strong>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {discovery?.quota ? <span className="hidden text-[11px] font-semibold sm:inline">{discovery.quota.remaining} of {discovery.quota.limit} questions remaining</span> : null}
                <ChevronDown className={`size-4 transition-transform ${askOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </span>
            </button>

            {askOpen ? (
              <section id="ask-true-north-panel" className="mt-2 rounded-[14px] bg-[var(--atlas-blue-soft)] p-3 sm:p-4" aria-labelledby="ask-true-north-title">
                <div className="mb-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--atlas-primary)]">Ask True North · AI-assisted</p>
                  <h2 id="ask-true-north-title" className="mt-1 font-[family-name:var(--font-barlow)] text-lg font-extrabold tracking-[-0.02em] text-[var(--atlas-ink)]">Not sure who or what to search for?</h2>
                  <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--atlas-muted)]">Ask True North helps you explore who may help—and why.</p>
                </div>
                <form onSubmit={submitDiscovery} aria-label="Ask True North about a need" data-clarity-mask="true">
                  <div className="relative grid gap-2 sm:block">
                    <MessageSquareText className="pointer-events-none absolute left-4 top-7 size-5 -translate-y-1/2 text-[var(--atlas-muted)] sm:top-1/2" aria-hidden="true" />
                    <label htmlFor="atlas-question" className="sr-only">Describe a need for Ask True North</label>
                    <input
                      id="atlas-question"
                      value={question}
                      onChange={(event) => setQuestion(event.target.value)}
                      className="h-14 w-full rounded-[12px] border border-[var(--atlas-border-strong)] bg-white pl-12 pr-4 text-[15px] text-[var(--atlas-ink)] outline-none placeholder:text-[var(--atlas-muted)] focus:border-[var(--atlas-ink)] focus:ring-4 focus:ring-[var(--atlas-signal-soft)] sm:pr-40 sm:text-base"
                      placeholder="What are you trying to build, source, or understand?"
                      maxLength={500}
                    />
                    <button type="submit" className="atlas-signal-button h-11 w-full gap-2 px-4 text-sm disabled:opacity-60 sm:absolute sm:right-1.5 sm:top-1/2 sm:h-[44px] sm:w-auto sm:-translate-y-1/2 sm:px-5" disabled={loading || !question.trim()}>
                      {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
                      <span>Ask True North</span>
                      {!loading ? <ArrowRight className="hidden size-4 sm:block" /> : null}
                    </button>
                  </div>
                </form>
                <p className="mt-2 text-[11px] leading-5 text-[var(--atlas-muted)]">Do not enter classified, confidential, proprietary or personal information.</p>
                {!discovery ? (
                  <div className="mt-3 text-[11px] leading-5 text-[var(--atlas-muted)]" aria-label="Example Ask True North questions">
                    <p className="font-bold">Try an example:</p>
                    <div className="mt-1 grid gap-1 sm:flex sm:flex-wrap sm:gap-x-3">
                      {suggestedQuestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          disabled={loading}
                          onClick={() => { setQuestion(suggestion); void runDiscovery(suggestion); }}
                          className="min-h-11 whitespace-normal text-left text-[11px] font-semibold text-[var(--atlas-primary)] underline decoration-[var(--atlas-primary)]/30 decoration-2 underline-offset-2 hover:decoration-[var(--atlas-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-primary)] disabled:cursor-wait disabled:opacity-60"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>

          {!guidedSearch && !discovery ? (
            <div className="mt-3" aria-label="Starting points">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--atlas-muted)]">Start from</span>
                <Link href="/map?example=modular-naval" className="inline-flex min-h-8 items-center gap-1.5 text-[11px] font-bold text-[var(--atlas-evidence)] underline decoration-[var(--atlas-evidence)]/40 decoration-2 underline-offset-4 hover:decoration-[var(--atlas-evidence)]"><ScanSearch className="size-3.5" aria-hidden="true" />Guided example</Link>
              </div>
              <AtlasLensBand
                className="mt-2"
                lenses={guidedLenses}
                activeValues={{ mission: filters.mission ?? "", demand: filters.demand ?? "", domain: filters.domain ?? "", type: filters.type ?? "" }}
                disabled={loading}
                onSelect={applyLensSelection}
              />
            </div>
          ) : null}

          {guidedSearch ? (
            <section className="mt-3 flex flex-col gap-3 rounded-[12px] border border-[var(--atlas-signal)]/60 bg-[var(--atlas-signal-soft)] px-3 py-3 lg:flex-row lg:items-center lg:justify-between" aria-labelledby="guided-search-title">
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--atlas-evidence)]">Guided search</p>
                <h2 id="guided-search-title" className="mt-1 text-sm font-extrabold text-[var(--atlas-ink)] sm:text-base">{guidedSearchQuestion}</h2>
              </div>
              <div className="flex flex-wrap gap-2" aria-label="Selected search focus">
                {guidedSearch.focus.map((focusId) => {
                  const focus = guidedSearchFocusForId(focusId);
                  return <button key={focus.id} type="button" onClick={() => removeGuidedFocus(focus.id)} className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[var(--atlas-evidence)]/30 bg-white px-3 text-[11px] font-semibold text-[var(--atlas-ink)] hover:border-[var(--atlas-evidence)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-evidence)]" aria-label={`Remove ${focus.label} from the guided search`}>{focus.label}<X className="size-3" aria-hidden="true" /></button>;
                })}
              </div>
            </section>
          ) : null}

          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-h-9 min-w-0 flex-wrap items-center gap-2">
              {result.appliedFilters.map((filter) => (
                <button key={`${filter.key}-${filter.value}`} type="button" onClick={() => { if (filter.key === "query" || filter.key === "metro") rememberBetaSearchId(null); void load(filterWithout(filters, filter.key)); }} className="inline-flex min-h-9 max-w-full items-center gap-2 rounded-full border border-[var(--atlas-primary-border)] bg-[var(--atlas-primary-soft)] px-3 py-2 text-left text-xs font-medium leading-5 text-[var(--atlas-primary)] hover:border-[var(--atlas-primary)]" aria-label={`Remove ${filter.label}: ${filter.value}`}>
                  <span className="min-w-0 break-words">{filter.label}: {filter.value}</span><X className="size-3.5 shrink-0" />
                </button>
              ))}
              {result.appliedFilters.length === 0 ? <span className="inline-flex h-9 items-center rounded-full border border-[var(--atlas-border)] bg-white px-3 text-xs font-semibold text-[var(--atlas-ink-soft)]">Canada-wide view</span> : null}
              <button type="button" onClick={() => setFilterPanelOpen((value) => !value)} className="atlas-secondary-button h-9 gap-2 px-3 text-xs" aria-expanded={filterPanelOpen}><SlidersHorizontal className="size-4" />Filters</button>
              <button type="button" onClick={() => changeViewMode("map")} className={cn("inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-bold", viewMode === "map" ? "border-[var(--atlas-signal)] bg-[var(--atlas-signal)] text-[var(--atlas-ink)]" : "border-[var(--atlas-border)] bg-white text-[var(--atlas-ink-soft)]")} aria-pressed={viewMode === "map"}><MapIcon className="size-4" />Map</button>
              <button type="button" onClick={() => { if (window.matchMedia("(min-width: 1024px)").matches) document.getElementById("atlas-results")?.scrollIntoView({ behavior: "smooth", block: "start" }); else changeViewMode("table"); }} className={cn("inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-bold", viewMode === "table" ? "border-[var(--atlas-signal)] bg-[var(--atlas-signal)] text-[var(--atlas-ink)]" : "border-[var(--atlas-border)] bg-white text-[var(--atlas-ink-soft)]")} aria-pressed={viewMode === "table"}><List className="size-4" />List</button>
              <button type="button" onClick={resetMap} className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--atlas-border)] bg-white px-3 text-xs font-bold text-[var(--atlas-ink-soft)] hover:border-[var(--atlas-ink)]"><RotateCcw className="size-3.5" />Reset</button>
              <EvidenceLegendDisclosure className="hidden sm:block" />
            </div>
            <div className="hidden shrink-0 items-center gap-3 sm:flex">
              <Link href={exportHref} className="inline-flex min-h-9 items-center gap-2 text-xs font-bold text-[var(--atlas-primary)] no-underline hover:underline"><Download className="size-4" />Export</Link>
              <PublicShare title="True North Map: Canada’s defence and dual-use ecosystem" description="Explore reviewed Canadian organizations, technologies, Public Needs, and the evidence behind them." useCurrentUrl className="h-9 px-3" />
            </div>
          </div>

          <p className="mt-2 hidden items-start gap-2 text-[11px] leading-5 text-[var(--atlas-muted)] md:flex"><Info className="mt-0.5 size-3.5 shrink-0 text-[var(--atlas-evidence)]" aria-hidden="true" /><span>{caveat}</span></p>

          {filterPanelOpen ? (
            <section className="mt-3 rounded-2xl border border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] p-4" aria-label="Ecosystem map filters">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <FilterSelect label="Region" allOptionLabel="All regions" value={filters.region ?? ""} options={regions.map((region) => ({ value: region.slug, label: `${region.name} (${region.organizationCount})` }))} onChange={(value) => { trackBetaEvent("filter_apply", { filter: "region", value: value || "all" }); void load({ ...filters, region: value || undefined }); }} />
                <FilterSelect label="Organization type" allOptionLabel="All organization types" value={filters.type ?? ""} options={result.facets.organizationTypes.filter((type) => publicOrganizationTypes.has(type.value)).map((type) => ({ value: type.value, label: `${type.label} (${type.count})` }))} onChange={(value) => { trackBetaEvent("filter_apply", { filter: "type", value: value || "all" }); void load({ ...filters, type: value || undefined }); }} />
                <FilterSelect label="Technology area" allOptionLabel="All technology areas" value={filters.domain ?? ""} options={technicalDomains.map((domain) => ({ value: domain.slug, label: domain.name }))} onChange={(value) => { trackBetaEvent("filter_apply", { filter: "domain", value: value || "all" }); void load({ ...filters, domain: value || undefined }); }} />
                <FilterSelect label="Mission Area" allOptionLabel="All Mission Areas" value={filters.mission ?? ""} options={missionAreas.map((mission) => ({ value: mission.slug, label: mission.name }))} onChange={(value) => { trackBetaEvent("filter_apply", { filter: "mission", value: value || "all" }); void load({ ...filters, mission: value || undefined }); }} />
                <FilterSelect label="Public Need" allOptionLabel="All Public Needs" value={filters.demand ?? ""} options={demandRequirements.map((demand) => ({ value: demand.slug, label: demand.title }))} onChange={(value) => { trackBetaEvent("filter_apply", { filter: "demand", value: value || "all" }); void load({ ...filters, demand: value || undefined }); }} />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[var(--atlas-border)] pt-3"><span className="text-xs text-[var(--atlas-muted)]">Filters update the map, results, URL and export together.</span><button type="button" className="text-xs font-semibold text-[var(--atlas-primary)] hover:underline" onClick={resetMap}>Clear all</button></div>
            </section>
          ) : null}

          {error ? <div className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--atlas-danger)] bg-[var(--atlas-danger-soft)] px-3 py-2 text-sm text-[var(--atlas-danger)]" role="alert"><CircleAlert className="mt-0.5 size-4 shrink-0" />{error}</div> : null}
          {discovery?.fallbackReason ? <AssistantFallback reason={discovery.fallbackReason} quota={discovery.quota} returnTo={mapReturnTo} /> : null}
          {discovery?.interpretation === "no_match" && !discovery.assistant ? <div className="mt-3 rounded-xl border border-[var(--atlas-amber)] bg-[var(--atlas-amber-soft)] px-3 py-2 text-sm text-[var(--atlas-amber)]">No published records match every interpreted filter. Try a broader geography, remove one filter, or tell us what is missing.</div> : null}
        </div>
          {discovery?.assistant ? <div className="bg-[var(--atlas-surface-muted)] px-3 pb-3 sm:px-5 sm:pb-5"><AssistantAnswer discovery={discovery} returnTo={mapReturnTo} onSelectOrganization={selectAssistantOrganization} onAskSuggestion={(suggestion) => void runDiscovery(suggestion)} onStartNewQuestion={startNewQuestion} /></div> : null}
        <div id="ecosystem-map" data-atlas-workspace className={cn("scroll-mt-24 border-y border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] lg:grid lg:h-[max(560px,calc(100dvh-250px))] lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-3 lg:p-3", viewMode === "table" && "hidden lg:grid")}>
          <div data-map-canvas className="relative isolate h-[55dvh] min-h-[420px] max-h-[620px] overflow-hidden lg:h-full lg:min-h-0 lg:max-h-none lg:rounded-[14px] lg:border lg:border-[var(--atlas-border)]">
            {mapEnabled ? (
              <AtlasMap
                organizations={result.mapOrganizations}
                initialBounds={initialFilters.bounds}
                selectedOrganizationId={selectedId}
                onSelect={selectMapOrganization}
                onViewportChange={updateViewport}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[var(--atlas-surface-muted)] text-sm font-semibold text-[var(--atlas-muted)]">
                Preparing the interactive map…
              </div>
            )}

            <div className="pointer-events-none absolute left-3 top-3 z-[1000] rounded-xl border border-white/80 bg-white/95 px-3 py-2 text-xs font-bold text-[var(--atlas-ink)] shadow-[var(--atlas-shadow-soft)] backdrop-blur sm:left-4 sm:top-4">
              {viewport ? `${visibleMapOrganizations.length} ${visibleMapOrganizations.length === 1 ? "organization" : "organizations"} in view` : "Updating map results…"}
            </div>

            {selectedOrganization ? (
              <div className="hidden lg:contents"><LookbookPeek
                  organization={selectedOrganization}
                  capability={selectedCapability}
                  filters={filters}
                  returnTo={mapReturnTo}
                  onClose={() => {
                    setSelectedId(null);
                    const nextFilters = { ...filters, view: viewMode, selected: undefined, bounds: viewport?.bounds };
                    setFilters(nextFilters);
                    writeMapState(nextFilters);
                  }}
                /></div>
            ) : null}

            <MobileResultsSheet
              state={mobileResultsState}
              organizations={visibleOrganizationsWithDetails}
              totalInView={visibleMapOrganizations.length}
              filters={filters}
              selectedId={selectedId}
              selectedOrganization={selectedOrganization}
              selectedCapability={selectedCapability}
              detailLoading={detailLoadingId === selectedId}
              returnTo={mapReturnTo}
              onStateChange={setMobileResultsState}
              onSelect={(id) => {
                updateSelection(id, false, "result", "map");
                setMobileResultsState("preview");
                const organization = result.organizations.find((item) => item.id === id);
                if (organization) void loadOrganizationDetail(organization);
              }}
            />
          </div>
          <ResultsRail
            organizations={visibleOrganizationsWithDetails}
            totalInView={visibleMapOrganizations.length}
            filters={filters}
            selectedId={selectedId}
            returnTo={mapReturnTo}
            onSelect={(id) => updateSelection(id, true, "result")}
          />
        </div>

        {/* Secondary utilities relocate here below the sm breakpoint so the first mobile screen keeps a meaningful map preview. */}
        <section data-mobile-map-utilities className="border-b border-[var(--atlas-border)] bg-white px-4 py-4 sm:hidden" aria-label="Map utilities">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--atlas-muted)]">Map utilities</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            <EvidenceLegendDisclosure className="[&>summary]:min-h-11" />
            <Link href={exportHref} className="inline-flex min-h-11 items-center gap-2 px-1 text-xs font-bold text-[var(--atlas-primary)] no-underline hover:underline"><Download className="size-4" />Export</Link>
            <PublicShare title="True North Map: Canada’s defence and dual-use ecosystem" description="Explore reviewed Canadian organizations, technologies, Public Needs, and the evidence behind them." useCurrentUrl className="h-11 px-3" />
          </div>
          <p className="mt-2 flex items-start gap-2 text-[11px] leading-5 text-[var(--atlas-muted)]"><Info className="mt-0.5 size-3.5 shrink-0 text-[var(--atlas-evidence)]" aria-hidden="true" /><span>{caveat}</span></p>
        </section>

        <div id="atlas-results" data-accessible-results-table className={cn("scroll-mt-24", viewMode === "map" && "hidden lg:block")}>
          <div className="flex flex-col gap-3 border-b border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="text-base font-bold tracking-[-0.01em] text-[var(--atlas-ink)]">Organizations in this map view</h2>
                <span className="text-xs text-[var(--atlas-muted)]">
                  {visibleMapOrganizations.length} {visibleMapOrganizations.length === 1 ? "organization" : "organizations"} on the map
                  {visibleOrganizationsWithDetails.length < visibleMapOrganizations.length
                    ? ` · ${visibleOrganizationsWithDetails.length} detailed results loaded`
                    : ""}
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
                  changeViewMode("map");
                }}
                aria-label="Return to map"
              >
                <MapIcon className="size-4" />
                Map
              </button>
            </div>
          </div>

          {visibleOrganizationsWithDetails.length ? (
            <>
              <ul className="divide-y divide-[var(--atlas-border)] lg:hidden" aria-label="Organizations in the current map view">
                {visibleOrganizationsWithDetails.map((organization) => (
                  <MobileOrganizationCard
                    key={organization.id}
                    organization={organization}
                    capability={relevantCapability(organization, filters)}
                    filters={filters}
                    expanded={expandedId === organization.id}
                    selected={selectedId === organization.id}
                    detailLoading={detailLoadingId === organization.id}
                    detailError={detailErrors[organization.id]}
                    returnTo={mapReturnTo}
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
                      <th scope="col" className="px-3 py-2.5">Why it may help</th>
                      <th scope="col" className="px-3 py-2.5">Sources</th>
                      <th scope="col" className="px-3 py-2.5">Last verified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleOrganizationsWithDetails.map((organization) => (
                      <OrganizationRows
                        key={organization.id}
                        organization={organization}
                        capability={relevantCapability(organization, filters)}
                        filters={filters}
                        expanded={expandedId === organization.id}
                        selected={selectedId === organization.id}
                        detailLoading={detailLoadingId === organization.id}
                        detailError={detailErrors[organization.id]}
                        returnTo={mapReturnTo}
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
                  <button type="button" className="text-sm font-semibold text-[var(--atlas-primary)] hover:underline" onClick={() => { rememberBetaSearchId(null); setDiscovery(null); void load(filterWithout(filters, "query")); }}>
                    Clear search
                  </button>
                  <button type="button" className="text-sm font-semibold text-[var(--atlas-primary)] hover:underline" onClick={openBetaFeedback}>
                    Tell us what is missing
                  </button>
                </div>
              ) : (
                <button type="button" className="mt-5 text-sm font-semibold text-[var(--atlas-primary)] hover:underline lg:hidden" onClick={() => changeViewMode("map")}>
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

      <NorthSignalInline placement="newsletter_inline_map" trigger="first_discovery_interaction" revealOnEngagement className="mt-6" />

      <PublicAtlasFooter generatedLabel={`Snapshot generated ${formatDate(generatedAt)}. Reviewed public sources only; coverage gaps remain explicit.`} />
    </div>
  );
}
