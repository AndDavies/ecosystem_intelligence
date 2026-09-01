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
  showLogo = false
}: {
  organization: AtlasOrganization;
  eyebrow?: string;
  headingLevel?: "h2" | "h3";
  showLogo?: boolean;
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
    <article className="group relative flex h-full flex-col rounded-[18px] bg-white p-5 shadow-[0_14px_36px_rgba(36,40,39,0.055)] transition-shadow duration-200 focus-within:shadow-[0_18px_44px_rgba(36,40,39,0.1)] hover:shadow-[0_18px_44px_rgba(36,40,39,0.09)]">
      {eyebrow ? <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--atlas-primary)]">{eyebrow}</p> : null}

      <div className={showLogo ? "flex items-start gap-3.5" : ""}>
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

      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--atlas-muted)]">{organization.description}</p>

      {offering ? (
        <div className="mt-4 rounded-[14px] bg-[var(--atlas-blue-soft)] px-3.5 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--atlas-muted)]">What they build</p>
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
        <div className="mt-3 flex flex-wrap gap-2">
          {domains.map((domain) => (
            <span
              key={domain.id}
              className="atlas-pill atlas-pill-tag atlas-pill-evidence min-h-7 px-2.5 py-1 text-[10px] font-semibold"
            >
              {domain.name}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto pt-4">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-bold text-[var(--atlas-ink-soft)]">
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
        <div className="mt-3 flex items-center justify-between gap-3 rounded-[14px] bg-[var(--atlas-surface-muted)] px-3 py-2.5">
          <span className="text-[11px] text-[var(--atlas-muted)]">Reviewed {formatDate(organization.lastReviewedAt)}</span>
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
