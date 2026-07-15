import { NextResponse } from "next/server";
import { atlasQueryFromSearchParams } from "@/lib/atlas/query-params";
import { getAtlasCapabilityBySlug, getAtlasOrganizationBySlug, getAtlasRegionBySlug, getAtlasSnapshot, queryAtlas } from "@/lib/atlas/repository";
import { getAtlasUser } from "@/lib/atlas/auth";
import { renderCapabilityDossierPdf, renderCollectionLookbookPdf, renderOrganizationDossierPdf, renderRegionReportPdf } from "@/lib/export/atlas-pdf";
import { createClient } from "@/lib/supabase/server";
import { getUseCaseBriefingBySlug, getUseCaseBySlug } from "@/lib/data/repository";
import { buildCsv } from "@/lib/export/csv";

export const runtime = "nodejs";

function pdfResponse(buffer: Buffer, filename: string) {
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store"
    }
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("export") ?? searchParams.get("type");
  const useCaseSlug = searchParams.get("useCaseSlug");

  if (type === "atlas-results") {
    const queryParams = new URLSearchParams(searchParams);
    queryParams.delete("export");
    // Older links used `type=atlas-results`, which collided with the public
    // organization-type filter. New links use `export` and preserve `type`.
    if (!searchParams.has("export")) queryParams.delete("type");
    const query = atlasQueryFromSearchParams(queryParams);
    const result = await queryAtlas({ ...query, page: 1, pageSize: 1000 });
    const header = [
      "stable_id",
      "organization_name",
      "organization_slug",
      "website_url",
      "entity_kind",
      "organization_types",
      "city",
      "province_territory",
      "region",
      "geographic_confidence",
      "source_confidence",
      "freshness_status",
      "last_reviewed_at",
      "capability_names",
      "technical_domains",
      "mission_areas",
      "public_source_count"
    ];
    const rows = result.organizations.map((organization) => {
      const citations = [
        ...organization.citations,
        ...organization.capabilities.flatMap((capability) => [
          ...capability.citations,
          ...capability.missionMatches.flatMap((match) => match.citations),
          ...capability.demandMatches.flatMap((match) => match.citations)
        ])
      ];
      return [
        organization.id,
        organization.name,
        organization.slug,
        organization.websiteUrl,
        organization.entityKind,
        organization.categories.join("; "),
        organization.primaryLocation?.city,
        organization.primaryLocation?.provinceTerritory,
        organization.primaryLocation?.regionSlug,
        organization.primaryLocation?.geographicConfidence,
        organization.sourceConfidence,
        organization.freshnessStatus,
        organization.lastReviewedAt,
        organization.capabilities.map((capability) => capability.name).join("; "),
        Array.from(new Set(organization.capabilities.flatMap((capability) => capability.technicalDomains.map((domain) => domain.name)))).join("; "),
        Array.from(new Set(organization.capabilities.flatMap((capability) => capability.missionMatches.map((match) => match.missionArea.name)))).join("; "),
        String(new Set(citations.map((citation) => citation.sourceUrl)).size)
      ];
    });
    return new NextResponse(buildCsv(header, rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=canadian-ecosystem-atlas-results.csv"
      }
    });
  }

  if (type === "organization-dossier") {
    const slug = searchParams.get("slug");
    const organization = slug ? await getAtlasOrganizationBySlug(slug) : null;
    if (!organization) return NextResponse.json({ error: "Published organization not found." }, { status: 404 });
    return pdfResponse(await renderOrganizationDossierPdf(organization), `${organization.slug}-public-dossier.pdf`);
  }

  if (type === "capability-dossier") {
    const slug = searchParams.get("slug");
    const result = slug ? await getAtlasCapabilityBySlug(slug) : null;
    if (!result) return NextResponse.json({ error: "Published capability not found." }, { status: 404 });
    return pdfResponse(await renderCapabilityDossierPdf(result.organization, result.capability), `${result.capability.slug}-public-dossier.pdf`);
  }

  if (type === "region-report") {
    const slug = searchParams.get("slug");
    const result = slug ? await getAtlasRegionBySlug(slug) : null;
    if (!result) return NextResponse.json({ error: "Published region not found." }, { status: 404 });
    const entries = result.organizations.map((organization) => ({ organization }));
    if (!entries.length) return NextResponse.json({ error: "This region has no published records to export." }, { status: 409 });
    return pdfResponse(await renderRegionReportPdf(result.region.name, entries), `${result.region.slug}-ecosystem-report.pdf`);
  }

  if (type === "collection-lookbook") {
    const user = await getAtlasUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Collection id is required." }, { status: 400 });
    const supabase = await createClient();
    const [{ data: collection }, { data: items }, snapshot] = await Promise.all([
      supabase.from("saved_collections").select("id, name").eq("id", id).eq("owner_id", user.id).single(),
      supabase.from("saved_collection_items").select("entity_type, entity_id, note").eq("collection_id", id).order("created_at"),
      getAtlasSnapshot()
    ]);
    if (!collection) return NextResponse.json({ error: "Collection not found." }, { status: 404 });
    const organizationsById = new Map(snapshot.organizations.map((organization) => [organization.id, organization]));
    const capabilitiesById = new Map(snapshot.organizations.flatMap((organization) => organization.capabilities.map((capability) => [capability.id, { organization, capability }] as const)));
    const entries = (items ?? []).flatMap((item) => {
      if (item.entity_type === "organization") {
        const organization = organizationsById.get(item.entity_id);
        return organization ? [{ organization, note: item.note }] : [];
      }
      const match = capabilitiesById.get(item.entity_id);
      return match ? [{ ...match, note: item.note }] : [];
    });
    if (!entries.length) return NextResponse.json({ error: "The collection has no published records to export." }, { status: 409 });
    return pdfResponse(await renderCollectionLookbookPdf(collection.name, entries), `${String(collection.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "collection"}-lookbook.pdf`);
  }

  if (!useCaseSlug || (type !== "use-case-targets" && type !== "use-case-briefing")) {
    return NextResponse.json({ error: "Invalid export request." }, { status: 400 });
  }

  if (type === "use-case-briefing") {
    const briefing = await getUseCaseBriefingBySlug(useCaseSlug);

    if (!briefing) {
      return NextResponse.json({ error: "Use case not found." }, { status: 404 });
    }

    const markdown = [
      `# ${briefing.useCase.useCase.name} Briefing`,
      "",
      `## Mission Decision`,
      briefing.useCase.useCase.requiredDecision,
      "",
      `## Mission Outcome`,
      briefing.useCase.useCase.missionOutcome,
      "",
      "## Top Targets",
      ...briefing.targets.flatMap((target) => [
        "",
        `### ${target.rank}. ${target.entry.capability.name} - ${target.entry.company.name}`,
        `- Status suggestion: ${target.suggestedStatus}`,
        `- Why now: ${target.targetRead.priorityNow}`,
        `- Why not others: ${target.targetRead.whyNotOthers}`,
        `- Strength: ${target.targetRead.strength}`,
        `- Limitation: ${target.targetRead.limitation}`,
        `- Next step: ${target.targetRead.actionDirective}`,
        `- Evidence posture: ${target.evidencePosture.detail}`
      ]),
      "",
      "## Gaps And Caveats",
      ...briefing.coverageGaps.map((gap) => `- ${gap.label}: ${gap.detail}`),
      "",
      "_Derived read: current-record analysis, not a direct source quote._"
    ].join("\n");

    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${useCaseSlug}-briefing.md"`
      }
    });
  }

  const useCase = await getUseCaseBySlug(useCaseSlug);

  if (!useCase) {
    return NextResponse.json({ error: "Use case not found." }, { status: 404 });
  }

  const header = [
    "capability_name",
    "company_name",
    "cluster_name",
    "pathway",
    "relevance_band",
    "defence_relevance",
    "ranking_score",
    "suggested_action_type",
    "why_it_matters"
  ];
  const rows = useCase.topTargets.map((entry) => [
    entry.capability.name,
    entry.company.name,
    entry.cluster.name,
    entry.mapping.pathway,
    entry.mapping.relevanceBand,
    entry.mapping.defenceRelevance,
    String(entry.mapping.rankingScore),
    entry.mapping.suggestedActionType,
    entry.mapping.whyItMatters
  ]);
  const csv = buildCsv(header, rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${useCaseSlug}-top-targets.csv"`
    }
  });
}
