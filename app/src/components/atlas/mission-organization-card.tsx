import Link from "next/link";
import { ArrowRight, MapPin, SearchCheck } from "lucide-react";
import { evidenceStrengthChipClass } from "@/components/atlas/alignment-match-card";
import { OrganizationIdentityMark } from "@/components/atlas/organization-identity";
import { RelationshipResultLink } from "@/components/atlas/relationship-result-link";
import { evidenceStrengthLabel, organizationKindLabel } from "@/lib/atlas/presentation";
import type { AtlasMissionOrganizationConnection } from "@/types/atlas";

type RelationshipContext = {
  targetSlug: string;
  positionBand: string;
  variant: "treatment" | "control";
  placement: "featured" | "complete";
  featureReason?: string;
};

export function MissionOrganizationCard({
  connection,
  relationshipContext
}: {
  connection: AtlasMissionOrganizationConnection;
  relationshipContext?: RelationshipContext;
}) {
  const { organization, capabilities } = connection;
  const isTreatment = relationshipContext?.variant === "treatment";
  return (
    <article className="atlas-surface flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <OrganizationIdentityMark name={organization.name} size="sm" />
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ring-1 ${evidenceStrengthChipClass[connection.strongestConfidence]}`}>
          {evidenceStrengthLabel(connection.strongestConfidence)} public evidence
        </span>
      </div>

      <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.09em] text-[var(--atlas-muted)]">
        {organizationKindLabel(organization.entityKind)}
      </p>
      {isTreatment && relationshipContext?.featureReason ? (
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.09em] text-[var(--atlas-primary)]">Our assessment · {relationshipContext.featureReason}</p>
      ) : null}
      {isTreatment ? (
        <h3 className="mt-1 text-xl font-extrabold tracking-[-0.035em] text-[var(--atlas-ink)]">
          <RelationshipResultLink
            href={`/organizations/${organization.slug}`}
            prefetch={false}
            targetType="mission"
            targetSlug={relationshipContext.targetSlug}
            destinationType="organization"
            destinationSlug={organization.slug}
            positionBand={relationshipContext.positionBand}
            variant={relationshipContext.variant}
            placement={relationshipContext.placement}
            className="no-underline hover:text-[var(--atlas-primary)] hover:underline"
          >
            {organization.name}
          </RelationshipResultLink>
        </h3>
      ) : (
        <h2 className="mt-1 text-xl font-extrabold tracking-[-0.035em] text-[var(--atlas-ink)]">
          {relationshipContext ? (
            <RelationshipResultLink
              href={`/organizations/${organization.slug}`}
              prefetch={false}
              targetType="mission"
              targetSlug={relationshipContext.targetSlug}
              destinationType="organization"
              destinationSlug={organization.slug}
              positionBand={relationshipContext.positionBand}
              variant={relationshipContext.variant}
              placement={relationshipContext.placement}
              className="no-underline hover:text-[var(--atlas-primary)] hover:underline"
            >
              {organization.name}
            </RelationshipResultLink>
          ) : (
            <Link href={`/organizations/${organization.slug}`} prefetch={false} className="no-underline hover:text-[var(--atlas-primary)] hover:underline">
              {organization.name}
            </Link>
          )}
        </h2>
      )}
      {organization.primaryLocation ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--atlas-muted)]">
          <MapPin className="size-3.5" aria-hidden="true" />
          {organization.primaryLocation.name}
        </p>
      ) : null}
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--atlas-muted)]">{organization.description}</p>

      <div className="mt-5 border-t border-[var(--atlas-border)] pt-4">
        <ul className="space-y-3">
          {capabilities.slice(0, 3).map((capability) => (
            <li key={capability.id} className="rounded-lg bg-[var(--atlas-surface-muted)] px-3 py-3">
              <div className="flex items-start gap-2">
                <SearchCheck className="mt-0.5 size-3.5 shrink-0 text-[var(--atlas-primary)]" aria-hidden="true" />
                <div className="min-w-0">
                  {relationshipContext ? (
                    <RelationshipResultLink
                      href={`/capabilities/${capability.slug}`}
                      targetType="mission"
                      targetSlug={relationshipContext.targetSlug}
                      destinationType="capability"
                      destinationSlug={capability.slug}
                      positionBand={relationshipContext.positionBand}
                      variant={relationshipContext.variant}
                      placement={relationshipContext.placement}
                      className="text-xs font-bold text-[var(--atlas-ink)] no-underline hover:text-[var(--atlas-primary)] hover:underline"
                    >
                      {capability.name}
                    </RelationshipResultLink>
                  ) : (
                    <Link href={`/capabilities/${capability.slug}`} className="text-xs font-bold text-[var(--atlas-ink)] no-underline hover:text-[var(--atlas-primary)] hover:underline">
                      {capability.name}
                    </Link>
                  )}
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

      {relationshipContext ? (
        <RelationshipResultLink
          href={`/organizations/${organization.slug}`}
          prefetch={false}
          targetType="mission"
          targetSlug={relationshipContext.targetSlug}
          destinationType="organization"
          destinationSlug={organization.slug}
          positionBand={relationshipContext.positionBand}
          variant={relationshipContext.variant}
          placement={relationshipContext.placement}
          className="mt-auto inline-flex items-center gap-1 pt-5 text-xs font-bold text-[var(--atlas-primary)] no-underline hover:underline"
        >
          Inspect the organization record <ArrowRight className="size-3.5" aria-hidden="true" />
        </RelationshipResultLink>
      ) : (
        <Link href={`/organizations/${organization.slug}`} prefetch={false} className="mt-auto inline-flex items-center gap-1 pt-5 text-xs font-bold text-[var(--atlas-primary)] no-underline hover:underline">
          Inspect the organization record <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      )}
    </article>
  );
}
