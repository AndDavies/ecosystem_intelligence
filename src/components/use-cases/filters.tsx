"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toTitleCase } from "@/lib/utils";
import type { CapabilityCardView } from "@/types/view-models";

type FilterState = {
  domain: string;
  company: string;
  cluster: string;
  pathway: string;
  geography: string;
  defenceRelevance: string;
  relevanceBand: string;
};

const defaultState: FilterState = {
  domain: "all",
  company: "all",
  cluster: "all",
  pathway: "all",
  geography: "all",
  defenceRelevance: "all",
  relevanceBand: "all"
};

export function UseCaseCapabilityFilters({
  capabilities,
  useCaseSlug
}: {
  capabilities: CapabilityCardView[];
  useCaseSlug: string;
}) {
  const [filters, setFilters] = useState<FilterState>(defaultState);
  const domainOptions = useMemo(
    () => [
      { value: "all", label: "All" },
      ...Array.from(new Map(capabilities.map((entry) => [entry.domain.id, entry.domain.name])).entries()).map(
        ([value, label]) => ({ value, label })
      )
    ],
    [capabilities]
  );
  const companyOptions = useMemo(
    () => [
      { value: "all", label: "All" },
      ...Array.from(new Map(capabilities.map((entry) => [entry.company.id, entry.company.name])).entries()).map(
        ([value, label]) => ({ value, label })
      )
    ],
    [capabilities]
  );
  const clusterOptions = useMemo(
    () => [
      { value: "all", label: "All" },
      ...Array.from(new Map(capabilities.map((entry) => [entry.cluster.id, entry.cluster.name])).entries()).map(
        ([value, label]) => ({ value, label })
      )
    ],
    [capabilities]
  );

  const filtered = useMemo(() => {
    return capabilities.filter((entry) => {
      if (filters.domain !== "all" && entry.domain.id !== filters.domain) {
        return false;
      }

      if (filters.company !== "all" && entry.company.id !== filters.company) {
        return false;
      }

      if (filters.cluster !== "all" && entry.cluster.id !== filters.cluster) {
        return false;
      }

      if (filters.pathway !== "all" && entry.mapping.pathway !== filters.pathway) {
        return false;
      }

      if (filters.geography !== "all" && entry.company.geography !== filters.geography) {
        return false;
      }

      if (
        filters.defenceRelevance !== "all" &&
        entry.mapping.defenceRelevance !== filters.defenceRelevance
      ) {
        return false;
      }

      if (filters.relevanceBand !== "all" && entry.mapping.relevanceBand !== filters.relevanceBand) {
        return false;
      }

      return true;
    });
  }, [capabilities, filters]);

  return (
    <div className="space-y-4">
      <Card className="rounded-[28px] border-dashed bg-white/45 shadow-none">
        <CardContent className="grid gap-3 pt-6 md:grid-cols-2 xl:grid-cols-4">
          <FilterGroup
            label="Domain"
            value={filters.domain}
            options={domainOptions}
            onChange={(value) => setFilters((current) => ({ ...current, domain: value }))}
          />
          <FilterGroup
            label="Company"
            value={filters.company}
            options={companyOptions}
            onChange={(value) => setFilters((current) => ({ ...current, company: value }))}
          />
          <FilterGroup
            label="Cluster"
            value={filters.cluster}
            options={clusterOptions}
            onChange={(value) => setFilters((current) => ({ ...current, cluster: value }))}
          />
          <FilterGroup
            label="Pathway"
            value={filters.pathway}
            options={["all", "build", "validate", "scale"].map((option) => ({
              value: option,
              label: option === "all" ? "All" : toTitleCase(option)
            }))}
            onChange={(value) => setFilters((current) => ({ ...current, pathway: value }))}
          />
          <FilterGroup
            label="Geography"
            value={filters.geography}
            options={["all", "canada", "nato", "global"].map((option) => ({
              value: option,
              label: option === "all" ? "All" : toTitleCase(option)
            }))}
            onChange={(value) => setFilters((current) => ({ ...current, geography: value }))}
          />
          <FilterGroup
            label="Defence Relevance"
            value={filters.defenceRelevance}
            options={["all", "high", "medium", "low"].map((option) => ({
              value: option,
              label: option === "all" ? "All" : toTitleCase(option)
            }))}
            onChange={(value) =>
              setFilters((current) => ({ ...current, defenceRelevance: value }))
            }
          />
          <FilterGroup
            label="Use Case Relevance"
            value={filters.relevanceBand}
            options={["all", "high", "medium", "low"].map((option) => ({
              value: option,
              label: option === "all" ? "All" : toTitleCase(option)
            }))}
            onChange={(value) => setFilters((current) => ({ ...current, relevanceBand: value }))}
          />
        </CardContent>
      </Card>
      <div className="grid gap-4">
        {filtered.map((entry) => (
          <Card key={entry.mapping.id} className="rounded-[30px] border border-[var(--border)] bg-white/78 shadow-[0_10px_30px_rgba(20,34,24,0.05)] transition hover:-translate-y-0.5 hover:border-[var(--primary)]/24 hover:shadow-[0_14px_34px_rgba(20,34,24,0.08)]">
            <CardContent className="space-y-5 pt-7">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                    Capability
                  </div>
                  <Link
                    href={`/capabilities/${entry.capability.id}?fromUseCase=${useCaseSlug}`}
                    title="Capability = product, system, or solution"
                    className="block truncate text-xl font-bold tracking-tight no-underline"
                  >
                    {entry.capability.name}
                  </Link>
                </div>
                <Badge
                  tone={getPathwayTone(entry.mapping.pathway)}
                  className="shrink-0 px-3 py-1.5 capitalize"
                  title={getPathwayDescription(entry.mapping.pathway)}
                >
                  {entry.mapping.pathway}
                </Badge>
              </div>
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  Company
                </div>
                <Link
                  href={`/companies/${entry.company.id}?fromUseCase=${useCaseSlug}&fromCapability=${entry.capability.id}`}
                  className="text-sm font-medium text-slate-600 no-underline hover:text-[var(--link-hover)]"
                >
                  {entry.company.name}
                </Link>
              </div>
              <p className="truncate text-sm text-[var(--foreground)]">{entry.capability.summary}</p>
              <div className="grid gap-2 md:grid-cols-[auto_1fr] md:items-center">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                  Why it matters
                </div>
                <div className="truncate text-sm text-[var(--muted-foreground)]">
                  {entry.mapping.whyItMatters}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="secondary" className="px-3 py-1.5">
                  {toTitleCase(entry.mapping.suggestedActionType)}
                </Badge>
                <Badge tone="muted" className="px-3 py-1.5">
                  {entry.mapping.relevanceBand} relevance
                </Badge>
                <Badge tone="muted" className="px-3 py-1.5">
                  {entry.cluster.name}
                </Badge>
                <Badge tone="muted" className="px-3 py-1.5">
                  {entry.domain.name}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {entry.citations.map((citation) => (
                  <a
                    key={`${entry.mapping.id}-${citation.fieldName}-${citation.sourceUrl}`}
                    href={citation.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)] hover:bg-white"
                  >
                    {citation.publisher}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {!filtered.length ? (
          <Card className="rounded-[28px]">
            <CardContent className="pt-6 text-sm text-[var(--muted-foreground)]">
              No capabilities match your current filters. Try adjusting pathway, domain, or geography.
            </CardContent>
          </Card>
        ) : null}
        {filtered.length !== capabilities.length ? (
          <div>
            <Button variant="outline" onClick={() => setFilters(defaultState)}>
              Clear filters
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function FilterGroup({
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
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
        {label}
      </div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function getPathwayTone(pathway: string) {
  if (pathway === "scale") {
    return "success" as const;
  }

  if (pathway === "validate") {
    return "info" as const;
  }

  return "muted" as const;
}

function getPathwayDescription(pathway: string) {
  if (pathway === "scale") {
    return "Scale — ready for deployment, procurement, or commercialization";
  }

  if (pathway === "validate") {
    return "Validate — tested or piloted and needs real-world validation";
  }

  return "Build — early-stage development or concept";
}
