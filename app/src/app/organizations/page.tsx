import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, MapPin } from "lucide-react";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { evidenceStrengthLabel } from "@/lib/atlas/presentation";
import { getAtlasSnapshot } from "@/lib/atlas/repository";
import { formatDate, toTitleCase } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Published Organizations",
  description: "Browse verified organizations in Canada's defence and dual-use ecosystem."
};

export default async function OrganizationsPage() {
  const snapshot = await getAtlasSnapshot();

  return (
    <PublicPageShell
      eyebrow="Published directory"
      title="Organizations"
      description={`${snapshot.organizations.length} verified organizations are currently public. Coverage gaps are shown as gaps; synthetic entries and unsupported profile fields are excluded.`}
      actions={<Link href="/submit?submissionType=new_organization&targetType=organization&returnTo=%2Forganizations" className="inline-flex h-10 items-center rounded-md border border-[#007f98] bg-white px-4 text-xs font-semibold text-[#007f98] no-underline hover:bg-[#e7f8fa] hover:no-underline">Suggest an organization</Link>}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {snapshot.organizations.map((organization) => {
          const capability = organization.capabilities[0];
          return (
            <PublicCard key={organization.id} className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#e7f8fa] text-[#007f98]">
                  <Building2 className="size-5" />
                </span>
                <span className="rounded bg-[#f2f4f7] px-2 py-1 text-[10px] font-semibold text-[#475467]">
                  {evidenceStrengthLabel(organization.sourceConfidence)} evidence
                </span>
              </div>
              <h2 className="mt-5 text-lg font-bold tracking-[-0.02em] text-[#101828]">
                <Link href={`/organizations/${organization.slug}`} className="no-underline hover:text-[#007f98] hover:no-underline">{organization.name}</Link>
              </h2>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-[#667085]"><MapPin className="size-3.5" />{organization.primaryLocation?.name ?? "Location under review"}</p>
              <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#475467]">{organization.description}</p>
              {capability ? (
                <div className="mt-5 border-t border-[#eaecf0] pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#667085]">Featured capability</p>
                  <p className="mt-1 text-sm font-semibold text-[#344054]">{capability.name}</p>
                </div>
              ) : null}
              <div className="mt-auto flex items-center justify-between pt-5 text-xs">
                <span className="text-[#667085]">Last verified {formatDate(organization.lastReviewedAt)}</span>
                <Link href={`/organizations/${organization.slug}`} className="inline-flex items-center gap-1 font-semibold text-[#007f98] no-underline hover:underline">
                  View profile <ArrowRight className="size-3.5" />
                </Link>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="rounded bg-[#eff4ff] px-2 py-1 text-[10px] font-semibold text-[#175cd3] ring-1 ring-[#9bd8e2]">{toTitleCase(organization.entityKind)}</span>
                {organization.categories.slice(0, 2).map((category) => (
                  <span key={category} className="rounded bg-[#f8fafc] px-2 py-1 text-[10px] font-medium text-[#475467] ring-1 ring-[#e4e7ec]">{toTitleCase(category)}</span>
                ))}
              </div>
            </PublicCard>
          );
        })}
      </div>
    </PublicPageShell>
  );
}
