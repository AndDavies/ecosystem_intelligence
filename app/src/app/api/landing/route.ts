import { NextResponse } from "next/server";
import { getBriefPresentation, getBriefReadingMinutes } from "@/lib/atlas/brief-presentation";
import { getPublishedDefenceBriefs } from "@/lib/atlas/briefs";
import { projectAtlasMapOrganization } from "@/lib/atlas/explorer-projection";
import { getAtlasCapabilityBySlug, getAtlasCoverageSummary, getAtlasMissionIndex, getAtlasOrganizationBySlug } from "@/lib/atlas/repository";

export const dynamic = "force-dynamic";

const missionSlugs = ["autonomous-patrol-and-monitoring", "underwater-isr", "arctic-domain-awareness", "edge-data-processing"];
const briefSlugs = ["modular-containerized-systems-for-naval-operations", "canadian-defence-demand-signals"];

function publishedCapabilityGap(capability: {
  technologyReadinessLevel: number | null;
  maturity: string | null;
  commercialAvailability: string | null;
}) {
  const readinessMissing = capability.technologyReadinessLevel === null && !capability.maturity;
  const availabilityMissing = !capability.commercialAvailability;
  if (readinessMissing && availabilityMissing) {
    return "A reviewed technology-readiness level and commercial-availability status are not yet published.";
  }
  if (readinessMissing) return "A reviewed technology-readiness level is not yet published.";
  if (availabilityMissing) return "A reviewed commercial-availability status is not yet published.";
  return null;
}

export async function GET() {
  const [summary, missionIndex, briefs, organization, capabilityRecord] = await Promise.all([
    getAtlasCoverageSummary(),
    getAtlasMissionIndex(),
    getPublishedDefenceBriefs(),
    getAtlasOrganizationBySlug("kraken-robotics"),
    getAtlasCapabilityBySlug("kraken-katfish-sas")
  ]);

  const missions = missionSlugs.flatMap((slug) => {
    const item = missionIndex.missions.find((candidate) => candidate.missionArea.slug === slug);
    if (!item) {
      console.warn(`Landing mission omitted because it is not published: ${slug}`);
      return [];
    }
    return [item];
  });
  const selectedBriefs = briefSlugs.flatMap((slug) => {
    const brief = briefs.find((candidate) => candidate.slug === slug);
    if (!brief) {
      console.warn(`Landing brief omitted because it is not published: ${slug}`);
      return [];
    }
    return [{
      slug: brief.slug,
      title: brief.title,
      topic: brief.topic,
      standfirst: brief.standfirst,
      readingMinutes: getBriefReadingMinutes(brief),
      presentation: getBriefPresentation(brief)
    }];
  });

  const preview = organization && capabilityRecord && capabilityRecord.organization.id === organization.id
    ? {
        organization: projectAtlasMapOrganization(organization),
        organizationName: organization.name,
        organizationSlug: organization.slug,
        locationName: organization.primaryLocation?.name ?? "Location not yet verified",
        logoUrl: organization.logo?.publicUrl ?? null,
        capability: {
          id: capabilityRecord.capability.id,
          slug: capabilityRecord.capability.slug,
          name: capabilityRecord.capability.name,
          summary: capabilityRecord.capability.summary,
          sourceConfidence: capabilityRecord.capability.sourceConfidence,
          lastReviewedAt: capabilityRecord.capability.lastReviewedAt,
          assessment: capabilityRecord.capability.missionMatches.find((match) => match.missionArea.slug === "underwater-isr")?.alignmentSummary
            ?? capabilityRecord.capability.demandMatches[0]?.alignmentSummary
            ?? "No reviewed mission or public-need assessment is published yet.",
          gap: publishedCapabilityGap(capabilityRecord.capability)
        }
      }
    : null;

  if (!preview) console.warn("Landing specimen omitted because the editor-selected Kraken/KATFISH records are not both published.");

  return NextResponse.json({ summary, preview, missions, briefs: selectedBriefs }, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" }
  });
}
