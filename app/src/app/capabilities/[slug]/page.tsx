import { Suspense } from "react";
import { CapabilityRelatedContent } from "@/components/atlas/capability-related-content";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CapabilityDossier } from "@/components/atlas/capability-dossier";
import { getAtlasCapabilityBySlug } from "@/lib/atlas/repository";
import { safeAtlasReturn } from "@/lib/atlas/return-path";
import { socialMetadata } from "@/lib/seo/social";

// Safe map-return context is query-string state. Render the route dynamically
// while the bounded dossier loader retains publication-driven invalidation and a 24-hour recovery expiry.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const publicCapability = await getAtlasCapabilityBySlug(slug);

  if (!publicCapability) {
    return { title: "Capability not found", robots: { index: false, follow: false } };
  }

  const path = `/capabilities/${publicCapability.capability.slug}`;
  const title = `${publicCapability.capability.name} — ${publicCapability.organization.name}`;
  const social = socialMetadata({ title, description: publicCapability.capability.summary, path, eyebrow: "Canadian capability profile", detail: publicCapability.organization.name, location: publicCapability.organization.primaryLocation?.name });
  return {
    title,
    description: publicCapability.capability.summary,
    alternates: { canonical: path },
    ...social
  };
}

export default async function CapabilityPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const publicCapability = await getAtlasCapabilityBySlug(slug);
  if (!publicCapability) notFound();
  return <CapabilityDossier organization={publicCapability.organization} capability={publicCapability.capability} mapReturnTo={safeAtlasReturn(query.returnTo)} relatedContent={
    <Suspense fallback={<p className="py-6 text-sm text-[var(--atlas-muted)]" role="status">Loading related records…</p>}>
      <CapabilityRelatedContent organization={publicCapability.organization} capability={publicCapability.capability} />
    </Suspense>
  } />;
}
