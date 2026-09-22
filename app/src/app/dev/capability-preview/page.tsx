import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CapabilityDossier } from "@/components/atlas/capability-dossier";
import { previewOrganization } from "@/lib/atlas/dossier-preview-fixtures";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Capability local fixture", robots: { index: false, follow: false } };

export default async function CapabilityPreview({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { state } = await searchParams;
  const organization = structuredClone(previewOrganization);
  const capability = organization.capabilities[state === "sparse" ? 1 : 0];
  organization.name = "Synthetic fixture — Northern Vector Systems";
  capability.name = `Synthetic ${state === "sparse" ? "missing-fields" : "long-content"} fixture — ${capability.name}`;
  if (state === "sparse") {
    capability.coreFeatures = [];
    capability.defenceApplications = [];
    capability.maturity = null;
    capability.capabilityType = null;
    capability.technicalDomains = [];
    capability.technicalTags = [];
    capability.citations = [];
    capability.lastReviewedAt = null;
    organization.primaryLocation = null;
  } else {
    capability.capabilityType = "Distributed sensing, edge processing, operator workflow and subsystem integration with separately documented configuration and access boundaries";
    capability.coreFeatures.push("Long-value wrapping fixture: " + "ConfigurationInterface".repeat(12));
    capability.maturity = "Synthetic qualification: demonstrated in a bounded local fixture; this must not be presented as operational deployment, accepted delivery, procurement eligibility or a company rating. ".repeat(3);
    capability.citations.push({ ...capability.citations[0], id: "extra-passage", excerpt: "A distinct excerpt from the same source must survive deduplication.", sourceLocator: "Annex A, table 2, configuration B" });
  }
  return <CapabilityDossier organization={organization} capability={capability} mapReturnTo="/map?mission=underwater-isr" relatedSignals={[]} relatedBriefs={[]} relatedOrganizations={[]} />;
}
