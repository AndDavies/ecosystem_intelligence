"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { WorkspaceEmptyState } from "@/components/workspace/workspace-primitives";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
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
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <div className="workspace-kicker">Browse controls</div>
              <p className="text-xs leading-5 text-[var(--muted-foreground)]">
                Rank signal is a relative fit signal, not a probability.
              </p>
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
              <Select
                value={domainFilter}
                onValueChange={setDomainFilter}
              >
                <SelectTrigger className="h-11 w-full rounded-[3px] border-[var(--border)] bg-white/80 px-4 text-sm">
                  <SelectValue placeholder="All domains" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {domainOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                Geography
              </span>
              <Select
                value={geographyFilter}
                onValueChange={setGeographyFilter}
              >
                <SelectTrigger className="h-11 w-full rounded-[3px] border-[var(--border)] bg-white/80 px-4 text-sm">
                  <SelectValue placeholder="All geographies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={defaultGeographyFilter}>All geographies</SelectItem>
                    <SelectItem value="canada">Canada</SelectItem>
                    <SelectItem value="nato">NATO</SelectItem>
                    <SelectItem value="global">Global</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="hidden overflow-hidden rounded-[28px] border border-[var(--border)] bg-white shadow-[0_12px_38px_rgba(20,34,24,0.05)] xl:block">
        <Table>
          <TableHeader className="bg-[var(--card-muted)]">
            <TableRow>
              <TableHead className="w-[24%] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                Company
              </TableHead>
              <TableHead className="w-[17%] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                Domain Coverage
              </TableHead>
              <TableHead className="w-[22%] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                Top Mission Areas
              </TableHead>
              <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                Caps.
              </TableHead>
              <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                Rank Signal
              </TableHead>
              <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                Freshness
              </TableHead>
              <TableHead className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                Open
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {filteredCompanies.map((item) => (
            <TableRow
              key={item.company.id}
              className="hover:bg-[var(--card-muted)]"
            >
              <TableCell className="px-4 py-3">
                <Link href={`/companies/${item.company.id}`} className="block min-w-0 no-underline">
                  <div className="truncate font-semibold text-[var(--foreground)]">{item.company.name}</div>
                  <div className="mt-1 truncate text-xs text-[var(--muted-foreground)]">
                    {item.company.headquarters} · {formatGeography(item.company.geography)}
                  </div>
                </Link>
              </TableCell>
              <TableCell className="px-4 py-3 whitespace-normal">
                <div className="flex min-w-0 flex-wrap gap-1.5">
                  {item.domains.slice(0, 2).map((domain) => (
                    <Badge key={`${item.company.id}-${domain.id}-table`} tone="outline">
                      {domain.name}
                    </Badge>
                  ))}
                  {item.domains.length > 2 ? <Badge tone="muted">+{item.domains.length - 2}</Badge> : null}
                </div>
              </TableCell>
              <TableCell className="px-4 py-3 whitespace-normal text-xs leading-5 text-[var(--muted-foreground)]">
                  {item.topUseCases.length
                    ? item.topUseCases.map((useCase) => useCase.name).join(", ")
                    : "No linked use cases"}
              </TableCell>
              <TableCell className="px-4 py-3 font-semibold text-[var(--foreground)]">
                {item.capabilityCount}
              </TableCell>
              <TableCell className="px-4 py-3 font-semibold text-[var(--foreground)]">
                {formatScore(item.strongestMappingScore)}
              </TableCell>
              <TableCell className="px-4 py-3">
                <FreshnessBadge freshness={item.freshness} />
              </TableCell>
              <TableCell className="px-4 py-3 text-right">
                <Link href={`/companies/${item.company.id}`} className="font-semibold text-[var(--primary)] no-underline">
                  Open
                </Link>
              </TableCell>
            </TableRow>
          ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 xl:hidden">
        {filteredCompanies.map((item) => (
          <Link
            key={item.company.id}
            href={`/companies/${item.company.id}`}
            className="block rounded-[28px] border border-[var(--border)] bg-white p-4 no-underline shadow-[0_10px_26px_rgba(5,22,27,0.05)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-[var(--foreground)]">{item.company.name}</div>
                <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {item.company.headquarters} · {formatGeography(item.company.geography)}
                </div>
              </div>
              <ArrowRight className="mt-0.5 size-4 shrink-0 text-[var(--primary)]" />
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-5 text-[var(--muted-foreground)]">{item.company.overview}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.domains.slice(0, 2).map((domain) => (
                <Badge key={`${item.company.id}-${domain.id}`} tone="outline">
                    {domain.name}
                </Badge>
              ))}
              {item.domains.length > 2 ? <Badge tone="muted">+{item.domains.length - 2}</Badge> : null}
              <Badge tone="muted">{item.capabilityCount} capabilities</Badge>
              <Badge tone="surface">{item.useCaseCount} use cases</Badge>
              <FreshnessBadge freshness={item.freshness} />
            </div>
          </Link>
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
    return String(Math.round(value * 100));
  }

  return String(Math.round(value));
}
