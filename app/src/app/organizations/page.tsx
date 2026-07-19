import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, MapPin } from "lucide-react";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { evidenceStrengthLabel } from "@/lib/atlas/presentation";
import { getAtlasSnapshot } from "@/lib/atlas/repository";
import { formatDate, toTitleCase } from "@/lib/utils";

// Keep the directory in sync with publication without depending on a cached
// full-route render from before the latest reviewed records were promoted.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Canadian Defence and Dual-Use Organizations",
  description: "Find Canadian defence and dual-use organizations, see what they build, and inspect the public evidence behind each profile."
};

export default async function OrganizationsPage() {
  const snapshot = await getAtlasSnapshot();

  return (
    <PublicPageShell
      eyebrow="Find the right Canadian team"
      title="Organizations"
      description={`Explore ${snapshot.organizations.length} reviewed organizations, see what they build, and decide who deserves a closer look. Gaps stay visible; unsupported details stay out.`}
      actions={<Link href="/submit?submissionType=new_organization&targetType=organization&returnTo=%2Forganizations" className="inline-flex h-10 items-center rounded-md border border-[var(--atlas-primary)] bg-white px-4 text-xs font-semibold text-[var(--atlas-primary)] no-underline hover:bg-[var(--atlas-primary-soft)] hover:no-underline">Suggest an organization</Link>}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {snapshot.organizations.map((organization) => {
          const capability = organization.capabilities[0];
          return (
            <PublicCard key={organization.id} className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--atlas-primary-soft)] text-[var(--atlas-primary)]">
                  <Building2 className="size-5" />
                </span>
                <span className="rounded bg-[var(--atlas-surface-muted)] px-2 py-1 text-[10px] font-semibold text-[var(--atlas-muted)]">
                  {evidenceStrengthLabel(organization.sourceConfidence)} source support
                </span>
              </div>
              <h2 className="mt-5 text-lg font-bold tracking-[-0.02em] text-[var(--atlas-ink)]">
                <Link href={`/organizations/${organization.slug}`} className="no-underline hover:text-[var(--atlas-primary)] hover:no-underline">{organization.name}</Link>
              </h2>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--atlas-muted)]"><MapPin className="size-3.5" />{organization.primaryLocation?.name ?? "Location under review"}</p>
              <p className="mt-4 line-clamp-3 text-sm leading-6 text-[var(--atlas-muted)]">{organization.description}</p>
              {capability ? (
                <div className="mt-5 border-t border-[var(--atlas-border)] pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--atlas-muted)]">What they build</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--atlas-ink-soft)]">{capability.name}</p>
                </div>
              ) : null}
              <div className="mt-auto flex items-center justify-between pt-5 text-xs">
                <span className="text-[var(--atlas-muted)]">Last verified {formatDate(organization.lastReviewedAt)}</span>
                <Link href={`/organizations/${organization.slug}`} className="inline-flex items-center gap-1 font-semibold text-[var(--atlas-primary)] no-underline hover:underline">
                  Explore profile <ArrowRight className="size-3.5" />
                </Link>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="rounded bg-[var(--atlas-violet-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--atlas-violet)] ring-1 ring-[var(--atlas-primary-border)]">{toTitleCase(organization.entityKind)}</span>
                {organization.categories.slice(0, 2).map((category) => (
                  <span key={category} className="rounded bg-[var(--atlas-surface-muted)] px-2 py-1 text-[10px] font-medium text-[var(--atlas-muted)] ring-1 ring-[var(--atlas-border)]">{toTitleCase(category)}</span>
                ))}
              </div>
            </PublicCard>
          );
        })}
      </div>
    </PublicPageShell>
  );
}
