import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { ExecutiveOrganizationDossier } from "@/components/atlas/executive-organization-dossier";
import {
  authorizeAtlasOrganizationReleaseProbe,
  getAtlasOrganizationBySlug,
  getAtlasOrganizationBySlugForReleaseProbe,
  getAtlasOrganizationSuccessorSlug
} from "@/lib/atlas/repository";
import { dossierReleaseProbeHeader } from "@/lib/launch/dossier-release-gate";
import { safeAtlasReturn } from "@/lib/atlas/return-path";
import { boundedMetadataTitle } from "@/lib/seo/metadata-title";
import { reviewedSearchDescriptor } from "@/lib/seo/reviewed-search-descriptors";
import { socialMetadata } from "@/lib/seo/social";
import { toTitleCase } from "@/lib/utils";

// Safe map-return context is query-string state. Render the route dynamically
// while the bounded dossier loader retains its five-minute server cache.
export const dynamic = "force-dynamic";

type OrganizationRouteSearch = { returnTo?: string; cold_dossier_gate?: string };

async function organizationForRequest(slug: string, query: OrganizationRouteSearch) {
  if (!query.cold_dossier_gate) return getAtlasOrganizationBySlug(slug);
  const requestHeaders = await headers();
  const probeToken = requestHeaders.get(dossierReleaseProbeHeader) ?? "";
  const probeAuthorization = authorizeAtlasOrganizationReleaseProbe(
    slug,
    query.cold_dossier_gate,
    probeToken
  );
  if (!probeAuthorization) {
    return getAtlasOrganizationBySlug(slug);
  }
  return getAtlasOrganizationBySlugForReleaseProbe(
    slug,
    query.cold_dossier_gate,
    probeAuthorization
  );
}

export async function generateMetadata({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<OrganizationRouteSearch>;
}): Promise<Metadata> {
  const { slug } = await params;
  const query = await searchParams;
  const organization = await organizationForRequest(slug, query);
  if (!organization) return { title: "Organization not found" };
  const path = `/organizations/${organization.slug}`;
  const primaryCapability = organization.capabilities[0];
  const mandate = organizationMandateForMetadata(organization.profileData);
  const kindLabel = organizationKindLabelForMetadata(organization.entityKind);
  const title = boundedMetadataTitle(organization.name, [
    reviewedSearchDescriptor(organization.slug, organization.description),
    primaryCapability?.name,
    primaryCapability?.capabilityType,
    mandate,
    kindLabel
  ]);
  const socialTitle = organization.name;
  const description = metadataDescription(organization.description, primaryCapability?.summary ?? mandate ?? undefined);
  const social = socialMetadata({
    title: socialTitle,
    description,
    path,
    eyebrow: "Canadian organization dossier",
    detail: primaryCapability?.name ?? mandate ?? kindLabel,
    logoUrl: organization.logo?.publicUrl,
    location: organization.primaryLocation?.name
  });
  return { title, description, alternates: { canonical: path }, ...social, openGraph: { ...social.openGraph, type: "profile" } };
}

export default async function OrganizationDossierPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<OrganizationRouteSearch>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const organization = await organizationForRequest(slug, query);
  if (!organization) {
    if (!query.cold_dossier_gate) {
      const successorSlug = await getAtlasOrganizationSuccessorSlug(slug);
      if (successorSlug) {
        const returnQuery = query.returnTo ? `?returnTo=${encodeURIComponent(safeAtlasReturn(query.returnTo))}` : "";
        permanentRedirect(`/organizations/${successorSlug}${returnQuery}`);
      }
    }
    notFound();
  }
  const mapReturnTo = safeAtlasReturn(query.returnTo);
  const profilePath = `/organizations/${organization.slug}?returnTo=${encodeURIComponent(mapReturnTo)}`;
  return <ExecutiveOrganizationDossier organization={organization} mapReturnTo={mapReturnTo} profilePath={profilePath} />;
}

function organizationKindLabelForMetadata(entityKind: string) {
  if (entityKind === "research_test_centre") return "Research and test centre";
  if (entityKind === "investor_funder") return "Investor and funder mandate";
  if (entityKind === "government_innovation_office") return "Government innovation mandate";
  return toTitleCase(entityKind);
}

function metadataDescription(description: string, primaryCapability?: string) {
  const combined = [description, primaryCapability].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  if (combined.length <= 190) return combined;
  const clipped = combined.slice(0, 187);
  const boundary = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, boundary > 120 ? boundary : 187).trim()}…`;
}

function organizationMandateForMetadata(profileData: Record<string, unknown>) {
  for (const key of ["mandate", "technicalMandate", "portfolioScope"]) {
    const value = profileData[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}
