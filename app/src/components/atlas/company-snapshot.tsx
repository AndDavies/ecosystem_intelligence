import { ExternalSourceLink } from "@/components/atlas/internal-link";
import styles from "./company-snapshot.module.css";
import { ChevronDown } from "lucide-react";
import { formatSnapshotDate, formatSnapshotValue, snapshotLabels } from "@/lib/atlas/company-snapshot";
import type { AtlasOrganization } from "@/types/atlas";

export function CompanySnapshot({ organization, presentation = "snapshot" }: { organization: AtlasOrganization; presentation?: "snapshot" | "commercial" }) {
  const observations = organization.editorialProfile.snapshotObservations ?? [];
  const company = organization.entityKind === "company";
  const location = organization.primaryLocation;
  const identityFacts = presentation === "commercial" ? [] : [
    location ? {label: "Operating base", value: [location.city, location.provinceTerritory].filter(Boolean).join(", ") || location.name} : null,
    organization.foundedYear ? {label: "Founded", value: organization.foundedYear} : null
  ].filter(fact => fact !== null);
  if (!observations.length && !identityFacts.length) return null;
  return <section aria-label={company ? "Company snapshot" : "Organization snapshot"} className={presentation === "commercial" ? styles.commercial : "rounded-lg border-t-4 border-[var(--atlas-ink)] bg-[var(--atlas-surface-muted)] p-6"}>
    {presentation !== "commercial" ? <h2 className="font-[family-name:var(--font-barlow)] text-xl font-bold">{company ? "Company snapshot" : "Organization snapshot"}</h2> : null}
    {identityFacts.length ? <dl className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-4">
      {identityFacts.map(fact => <div key={fact.label} className="min-w-0"><dt className="text-xs font-semibold text-[var(--atlas-muted)]">{fact.label}</dt><dd className="mt-1 text-sm font-semibold">{fact.value}</dd></div>)}
    </dl> : null}
    {observations.length ? <dl className={`grid grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] gap-6 ${identityFacts.length ? "mt-5 border-t border-[var(--atlas-border)] pt-5" : "mt-5"}`}>
      {observations.map(item => <div key={item.id} className="min-w-0 break-words">
        <dt className="text-xs font-semibold text-[var(--atlas-muted)]">{snapshotLabels[item.metric]}{item.basis === "forecast" ? " · forecast" : item.basis === "conditional" ? " · conditional" : ""}</dt>
        <dd className="mt-1">
          <p className="text-2xl font-bold leading-tight tabular-nums">{formatSnapshotValue(item, "readable")}</p>
          <p className="mt-2 text-sm leading-5">{item.period}</p>
          <p className="mt-1 text-sm font-semibold leading-5">{item.scopeRelation === "parent" ? `Parent: ${item.subjectName}. ` : ""}{item.reportingScope}</p>
          <p className="mt-2 text-sm leading-5 text-[var(--atlas-muted)]">{item.qualification}</p>
          <div className="mt-2 flex flex-wrap items-start gap-x-4">
            <ExternalSourceLink href={item.sourceUrl} className="min-h-11 !items-center text-sm">Source<span className="sr-only">: {snapshotLabels[item.metric]}, {item.sourceLocator}</span></ExternalSourceLink>
            <details className="group min-w-0 flex-1 basis-40 text-sm">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-semibold text-[var(--atlas-link)] [&::-webkit-details-marker]:hidden"><ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />Reporting detail</summary>
              <p className="mt-1 leading-5">{item.subjectName} · as of {formatSnapshotDate(item.asOf)}</p>
              <p className="mt-2 leading-5">Recorded value: {formatSnapshotValue(item)}</p>
              <p className="mt-2 leading-5 text-[var(--atlas-muted)]">{item.sourceLocator}</p>
            </details>
          </div>
        </dd>
      </div>)}
    </dl> : null}
  </section>;
}
