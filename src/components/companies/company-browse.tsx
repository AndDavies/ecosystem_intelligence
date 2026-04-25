"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { DiscoveryCard, WorkspaceEmptyState } from "@/components/workspace/workspace-primitives";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CompanyIndexCardView } from "@/types/view-models";

const defaultDomainFilter = "all";
const defaultGeographyFilter = "all";

export function CompanyBrowse({ companies }: { companies: CompanyIndexCardView[] }) {
  const [query, setQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState(defaultDomainFilter);
  const [geographyFilter, setGeographyFilter] = useState(defaultGeographyFilter);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const domainOptions = useMemo(
    () => [
      { value: defaultDomainFilter, label: "All domains" },
      ...Array.from(
        new Map(
          companies.flatMap((item) => item.domains.map((domain) => [domain.id, domain.name]))
        ).entries()
      )
        .map(([value, label]) => ({ value, label }))
        .sort((left, right) => left.label.localeCompare(right.label))
    ],
    [companies]
  );

  const filteredCompanies = useMemo(() => {
    return companies.filter((item) => {
      if (
        deferredQuery &&
        ![
          item.company.name,
          item.company.overview,
          item.company.headquarters,
          ...item.domains.map((domain) => domain.name),
          ...item.topUseCases.map((useCase) => useCase.name)
        ]
          .join(" ")
          .toLowerCase()
          .includes(deferredQuery)
      ) {
        return false;
      }

      if (domainFilter !== defaultDomainFilter && !item.domains.some((domain) => domain.id === domainFilter)) {
        return false;
      }

      if (
        geographyFilter !== defaultGeographyFilter &&
        item.company.geography !== geographyFilter
      ) {
        return false;
      }

      return true;
    });
  }, [companies, deferredQuery, domainFilter, geographyFilter]);

  return (
    <div className="space-y-5">
      <Card variant="rail" className="rounded-[32px]">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <div className="workspace-kicker">Browse controls</div>
              <div className="text-sm leading-6 text-[var(--muted-foreground)]">
                Filter the visible company landscape by query, domain, and geography without changing the underlying data model.
              </div>
            </div>
            <Badge tone="surface">{filteredCompanies.length} visible companies</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                Company search
              </span>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search company, domain, or use case"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                Domain
              </span>
              <select
                value={domainFilter}
                onChange={(event) => setDomainFilter(event.target.value)}
                className="h-11 w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 text-sm"
              >
                {domainOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                Geography
              </span>
              <select
                value={geographyFilter}
                onChange={(event) => setGeographyFilter(event.target.value)}
                className="h-11 w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 text-sm"
              >
                <option value={defaultGeographyFilter}>All geographies</option>
                <option value="canada">Canada</option>
                <option value="nato">NATO</option>
                <option value="global">Global</option>
              </select>
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="hidden overflow-hidden rounded-[28px] border border-[var(--border)] bg-white shadow-[0_18px_55px_rgba(20,34,24,0.07)] xl:block">
        <div className="grid grid-cols-[minmax(14rem,1.45fr)_minmax(10rem,0.95fr)_minmax(12rem,1fr)_7rem_7rem_9rem_4rem] gap-4 border-b border-[var(--border)] bg-[var(--card-muted)] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          <div>Company</div>
          <div>Domain Coverage</div>
          <div>Top Use Cases</div>
          <div>Caps.</div>
          <div>Score</div>
          <div>Freshness</div>
          <div className="text-right">Open</div>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {filteredCompanies.map((item) => (
            <Link
              key={item.company.id}
              href={`/companies/${item.company.id}`}
              className="grid grid-cols-[minmax(14rem,1.45fr)_minmax(10rem,0.95fr)_minmax(12rem,1fr)_7rem_7rem_9rem_4rem] items-center gap-4 px-5 py-4 text-sm no-underline transition hover:bg-[var(--card-muted)]"
            >
              <div className="min-w-0">
                <div className="truncate font-semibold text-[var(--foreground)]">{item.company.name}</div>
                <div className="mt-1 truncate text-xs text-[var(--muted-foreground)]">
                  {item.company.headquarters} · {formatGeography(item.company.geography)}
                </div>
              </div>
              <div className="flex min-w-0 flex-wrap gap-1.5">
                {item.domains.slice(0, 2).map((domain) => (
                  <Badge key={`${item.company.id}-${domain.id}-table`} tone="outline">
                    {domain.name}
                  </Badge>
                ))}
                {item.domains.length > 2 ? <Badge tone="muted">+{item.domains.length - 2}</Badge> : null}
              </div>
              <div className="min-w-0 text-xs leading-5 text-[var(--muted-foreground)]">
                {item.topUseCases.length
                  ? item.topUseCases.map((useCase) => useCase.name).join(", ")
                  : "No linked use cases"}
              </div>
              <div className="font-semibold text-[var(--foreground)]">{item.capabilityCount}</div>
              <div className="font-semibold text-[var(--foreground)]">{formatScore(item.strongestMappingScore)}</div>
              <div>
                <FreshnessBadge freshness={item.freshness} />
              </div>
              <div className="text-right font-semibold text-[var(--primary)]">Open</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:hidden">
        {filteredCompanies.map((item) => (
          <DiscoveryCard
            key={item.company.id}
            eyebrow={formatGeography(item.company.geography)}
            title={item.company.name}
            description={item.company.overview}
            href={`/companies/${item.company.id}`}
            actionLabel="Open Company"
            badges={
              <>
                <Badge tone="outline">{item.company.headquarters}</Badge>
                {item.domains.map((domain) => (
                  <Badge key={`${item.company.id}-${domain.id}`} tone="outline">
                    {domain.name}
                  </Badge>
                ))}
                {item.topUseCases.map((useCase) => (
                  <Badge key={`${item.company.id}-${useCase.id}`} tone="muted">
                    {useCase.name}
                  </Badge>
                ))}
              </>
            }
            footer={
              <>
                <FreshnessBadge freshness={item.freshness} />
                <Badge tone="muted">{item.capabilityCount} capabilities</Badge>
                <Badge tone="surface">{item.useCaseCount} linked use cases</Badge>
              </>
            }
          />
        ))}
      </div>

      {!filteredCompanies.length ? (
        <WorkspaceEmptyState message="No companies match the current search and filters." />
      ) : null}
    </div>
  );
}

function formatGeography(value: CompanyIndexCardView["company"]["geography"]) {
  if (value === "nato") {
    return "NATO";
  }

  if (value === "canada") {
    return "Canada";
  }

  return "Global";
}

function formatScore(value: number) {
  if (value <= 1) {
    return `${Math.round(value * 100)}%`;
  }

  return `${Math.round(value)}%`;
}
