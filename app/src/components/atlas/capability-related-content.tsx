import "server-only";

import { CapabilityRelatedRecords } from "@/components/atlas/capability-dossier";
import { getCapabilityRelatedIntelligence, getCapabilitySiblingSummaries } from "@/lib/atlas/dossier-related";
import type { AtlasCapability, AtlasOrganization } from "@/types/atlas";

/** Optional supporting reads never hold the core dossier or its evidence. */
export async function CapabilityRelatedContent({ organization, capability }: {
  organization: AtlasOrganization;
  capability: AtlasCapability;
}) {
  const [related, siblings] = await Promise.all([
    getCapabilityRelatedIntelligence(organization, capability.id),
    getCapabilitySiblingSummaries(organization.id, capability.id)
  ]);
  return <CapabilityRelatedRecords organization={organization} capability={capability}
    relatedSignals={related.signals} relatedBriefs={related.briefs} relatedOrganizations={related.organizations}
    siblings={siblings ?? []} unavailable={[...(related.unavailable ?? []), ...(siblings === null ? ["other capabilities"] : [])]} />;
}
