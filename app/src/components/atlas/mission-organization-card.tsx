import Link from "next/link";
import { ArrowRight, Building2, MapPin, SearchCheck } from "lucide-react";
import { evidenceStrengthChipClass } from "@/components/atlas/alignment-match-card";
import { evidenceStrengthLabel, organizationKindLabel } from "@/lib/atlas/presentation";
import type { AtlasMissionOrganizationConnection } from "@/types/atlas";

export function MissionOrganizationCard({ connection }: { connection: AtlasMissionOrganizationConnection }) {
  const { organization, capabilities } = connection;
  return (
    <article className="atlas-surface flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--atlas-primary-soft)] text-[var(--atlas-primary)]">
          <Building2 className="size-5" aria-hidden="true" />
        </span>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ring-1 ${evidenceStrengthChipClass[connection.strongestConfidence]}`}>
          {evidenceStrengthLabel(connection.strongestConfidence)} assessment
        </span>
      </div>

      <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.09em] text-[var(--atlas-muted)]">
        {organizationKindLabel(organization.entityKind)}
      </p>
      <h2 className="mt-1 text-xl font-extrabold tracking-[-0.035em] text-[var(--atlas-ink)]">
        <Link href={`/organizations/${organization.slug}`} className="no-underline hover:text-[var(--atlas-primary)] hover:underline">
          {organization.name}
        </Link>
      </h2>
      {organization.primaryLocation ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--atlas-muted)]">
          <MapPin className="size-3.5" aria-hidden="true" />
          {organization.primaryLocation.name}
        </p>
      ) : null}
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--atlas-muted)]">{organization.description}</p>

      <div className="mt-5 border-t border-[var(--atlas-border)] pt-4">
        <p className="atlas-eyebrow">Technology reviewed for this mission</p>
        <ul className="mt-3 space-y-3">
          {capabilities.slice(0, 3).map((capability) => (
            <li key={capability.id} className="rounded-lg bg-[var(--atlas-surface-muted)] px-3 py-3">
              <div className="flex items-start gap-2">
                <SearchCheck className="mt-0.5 size-3.5 shrink-0 text-[var(--atlas-primary)]" aria-hidden="true" />
                <div className="min-w-0">
                  <Link href={`/capabilities/${capability.slug}`} className="text-xs font-bold text-[var(--atlas-ink)] no-underline hover:text-[var(--atlas-primary)] hover:underline">
                    {capability.name}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-[var(--atlas-muted)]">{capability.assessment.alignmentSummary}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {capabilities.length > 3 ? (
          <p className="mt-2 text-[11px] font-semibold text-[var(--atlas-muted)]">+ {capabilities.length - 3} more mapped {capabilities.length - 3 === 1 ? "technology" : "technologies"}</p>
        ) : null}
      </div>

      <Link href={`/organizations/${organization.slug}`} className="mt-auto inline-flex items-center gap-1 pt-5 text-xs font-bold text-[var(--atlas-primary)] no-underline hover:underline">
        Inspect the organization record <ArrowRight className="size-3.5" aria-hidden="true" />
      </Link>
    </article>
  );
}
