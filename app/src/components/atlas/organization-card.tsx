import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { OrganizationIdentityMark } from "@/components/atlas/organization-identity";
import { organizationKindLabel } from "@/lib/atlas/presentation";
import { formatDate } from "@/lib/utils";
import type { AtlasOrganization } from "@/types/atlas";

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

export function OrganizationCard({
  organization,
  eyebrow,
  headingLevel = "h3",
  showLogo = false,
  layout = "grid"
}: {
  organization: AtlasOrganization;
  eyebrow?: string;
  headingLevel?: "h2" | "h3";
  showLogo?: boolean;
  layout?: "grid" | "row";
}) {
  const offering = organization.capabilities[0];
  const capabilityCount = organization.capabilities.length;
  const demandMatchCount = organizationDemandMatchCount(organization);
  const domains = organizationTechnicalDomains(organization).slice(0, 2);
  const Heading = headingLevel;
  // Accelerators, investors, and other ecosystem roles are not expected to
  // publish capability records, so zero counts get an honest scope label
  // instead of reading like a coverage failure.
  const ecosystemRoleWithoutRecords =
    organization.entityKind !== "company" && capabilityCount === 0 && demandMatchCount === 0;

  return (
    <article className={`atlas-record group relative flex h-full flex-col ${layout === "row" ? "atlas-record-row" : ""}`}>
      {eyebrow ? <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--atlas-primary)]">{eyebrow}</p> : null}

      <div className={showLogo ? "atlas-record-identity flex items-start gap-3.5" : "atlas-record-identity"}>
        {showLogo ? (
          <OrganizationIdentityMark
            name={organization.name}
            logoUrl={organization.logo?.publicUrl ?? null}
            size="md"
            alt={`${organization.name} logo`}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <Heading className={`${eyebrow ? "mt-3" : ""} text-lg font-extrabold leading-tight tracking-[-0.03em] text-[var(--atlas-ink)]`}>
            {organization.name}
          </Heading>

          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--atlas-muted)]">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            {organization.primaryLocation?.name ?? "Location under review"}
          </p>
        </div>
      </div>

      <p className="atlas-record-description mt-3 line-clamp-2 text-sm leading-6 text-[var(--atlas-muted)]">{organization.description}</p>

      {offering ? (
        <div className="atlas-record-offering mt-4 py-1">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--atlas-muted)]">What they offer</p>
          <Link
            href={`/capabilities/${offering.slug}`}
            prefetch={false}
            data-internal-link-role="contextual"
            data-internal-link-module="organization_card_capability"
            className="atlas-prose-link mt-1 line-clamp-1 text-sm font-bold text-[var(--atlas-ink-soft)]"
          >
            Explore {offering.name}
          </Link>
        </div>
      ) : null}

      {domains.length ? (
        <div className="atlas-record-domains mt-3 flex flex-wrap gap-2">
          {domains.map((domain) => (
            <span
              key={domain.id}
              className="atlas-pill atlas-pill-tag atlas-pill-evidence min-h-7 px-2.5 py-1 text-xs font-semibold"
            >
              {domain.name}
            </span>
          ))}
        </div>
      ) : null}

      <div className="atlas-record-meta mt-auto pt-4">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-bold text-[var(--atlas-ink-soft)]">
          {ecosystemRoleWithoutRecords ? (
            <>
              <span>{organizationKindLabel(organization.entityKind)}</span>
              <span aria-hidden="true" className="size-1 rounded-full bg-[var(--atlas-border-strong)]" />
              <span>Profiled for its ecosystem role</span>
            </>
          ) : (
            <>
              <span>
                {capabilityCount} reviewed {capabilityCount === 1 ? "capability" : "capabilities"}
              </span>
              <span aria-hidden="true" className="size-1 rounded-full bg-[var(--atlas-border-strong)]" />
              <span>
                {demandMatchCount} public demand {demandMatchCount === 1 ? "match" : "matches"}
              </span>
            </>
          )}
        </div>
        <div className="atlas-record-footer mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-[var(--atlas-muted)]">Reviewed {formatDate(organization.lastReviewedAt)}</span>
          <Link
            href={`/organizations/${organization.slug}`}
            prefetch={false}
            data-internal-link-role="contextual"
            data-internal-link-module="organization_card_profile"
            className="inline-flex items-center gap-1 text-xs font-bold text-[var(--atlas-primary)] no-underline hover:underline"
          >
            Explore {organization.name}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
