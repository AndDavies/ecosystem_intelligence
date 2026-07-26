import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { evidenceStrengthLabel } from "@/lib/atlas/presentation";
import { formatDate } from "@/lib/utils";
import type { AtlasConfidence, AtlasOrganization } from "@/types/atlas";

export function organizationDemandMatchCount(organization: AtlasOrganization) {
  return new Set(
    organization.capabilities.flatMap((capability) => capability.demandMatches.map((match) => match.demandSlug))
  ).size;
}

export function organizationTechnicalDomains(organization: AtlasOrganization) {
  return Array.from(
    new Map(
      organization.capabilities
        .flatMap((capability) => capability.technicalDomains)
        .map((domain) => [domain.id, domain])
    ).values()
  );
}

const evidenceToneClass: Record<AtlasConfidence, string> = {
  high: "bg-[var(--atlas-evidence-soft)] text-[var(--atlas-evidence)] ring-[var(--atlas-evidence)]/25",
  moderate: "bg-[var(--atlas-surface-muted)] text-[var(--atlas-ink-soft)] ring-[var(--atlas-border-strong)]",
  needs_review: "bg-[var(--atlas-amber-soft)] text-[var(--atlas-amber)] ring-[var(--atlas-amber)]/30"
};

export function OrganizationCard({
  organization,
  eyebrow,
  headingLevel = "h3"
}: {
  organization: AtlasOrganization;
  eyebrow?: string;
  headingLevel?: "h2" | "h3";
}) {
  const offering = organization.capabilities[0];
  const capabilityCount = organization.capabilities.length;
  const demandMatchCount = organizationDemandMatchCount(organization);
  const domains = organizationTechnicalDomains(organization).slice(0, 2);
  const Heading = headingLevel;

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-[var(--atlas-border)] bg-white p-5 shadow-[0_1px_2px_rgba(36,40,39,0.035)] transition-[translate,box-shadow,border-color] duration-200 focus-within:-translate-y-1 focus-within:border-[var(--atlas-border-strong)] focus-within:shadow-[var(--atlas-shadow-soft)] hover:-translate-y-1 hover:border-[var(--atlas-border-strong)] hover:shadow-[var(--atlas-shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        {eyebrow ? (
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--atlas-primary)]">{eyebrow}</p>
        ) : (
          <span aria-hidden="true" />
        )}
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ring-1 ${evidenceToneClass[organization.sourceConfidence]}`}
        >
          {evidenceStrengthLabel(organization.sourceConfidence)} public evidence
        </span>
      </div>

      <Heading className="mt-4 text-lg font-extrabold leading-tight tracking-[-0.03em] text-[var(--atlas-ink)]">
        <Link
          href={`/organizations/${organization.slug}`}
          className="no-underline after:absolute after:inset-0 after:rounded-2xl after:content-[''] hover:no-underline group-hover:underline"
        >
          {organization.name}
        </Link>
      </Heading>

      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--atlas-muted)]">
        <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
        {organization.primaryLocation?.name ?? "Location under review"}
      </p>

      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--atlas-muted)]">{organization.description}</p>

      {offering ? (
        <div className="mt-4 rounded-xl bg-[var(--atlas-surface-muted)] px-3.5 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--atlas-muted)]">What they build</p>
          <p className="mt-1 line-clamp-1 text-sm font-bold text-[var(--atlas-ink-soft)]">{offering.name}</p>
        </div>
      ) : null}

      {domains.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {domains.map((domain) => (
            <span
              key={domain.id}
              className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-[var(--atlas-muted)] ring-1 ring-[var(--atlas-border)]"
            >
              {domain.name}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto border-t border-[var(--atlas-border)] pt-4">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-bold text-[var(--atlas-ink-soft)]">
          <span>
            {capabilityCount} reviewed {capabilityCount === 1 ? "technology" : "technologies"}
          </span>
          <span aria-hidden="true" className="size-1 rounded-full bg-[var(--atlas-border-strong)]" />
          <span>
            {demandMatchCount} public demand {demandMatchCount === 1 ? "match" : "matches"}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-[11px] text-[var(--atlas-muted)]">Reviewed {formatDate(organization.lastReviewedAt)}</span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--atlas-primary)]">
            View profile
            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
      </div>
    </article>
  );
}
