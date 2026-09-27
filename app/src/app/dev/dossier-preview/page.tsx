import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExecutiveOrganizationDossier } from "@/components/atlas/executive-organization-dossier";
import type { DossierRelatedIntelligence } from "@/lib/atlas/dossier-related";
import { previewOrganization } from "@/lib/atlas/dossier-preview-fixtures";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Executive dossier local preview",
  robots: { index: false, follow: false }
};

const previewRelated: DossierRelatedIntelligence = { briefs: [], signals: [], organizations: [] };

export default function DossierPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <ExecutiveOrganizationDossier
      organization={previewOrganization}
      mapReturnTo="/map?mission=underwater-isr"
      profilePath="/dev/dossier-preview"
      relatedIntelligence={previewRelated}
      trackEngagement={false}
    />
  );
}
