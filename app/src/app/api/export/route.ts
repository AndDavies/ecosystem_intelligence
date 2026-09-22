import { reserveExportRequest, recordExportOutcome } from "@/lib/export/access";
import { collectPagedRows } from "@/lib/supabase/pagination";
import { NextResponse } from "next/server";
import { atlasQueryFromSearchParams } from "@/lib/atlas/query-params";
import { getAtlasCapabilityBySlug, getAtlasOrganizationBySlug, getAtlasRegionBySlug, getAtlasOrganizationsForExport, getAtlasOrganizationsForCollection } from "@/lib/atlas/repository";
import { getAtlasUser } from "@/lib/atlas/auth";
import { createClient } from "@/lib/supabase/server";
import { atlasResultsCapabilityExportScope, buildCsv } from "@/lib/export/csv";

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

async function generateExport(request: Request, user: { id: string }) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("export") ?? searchParams.get("type");

  if (type === "atlas-results") {
    const queryParams = new URLSearchParams(searchParams);
    const requestedOrganizationIds = (queryParams.get("organizationIds") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    queryParams.delete("export");
    queryParams.delete("organizationIds");
    // Older links used `type=atlas-results`, which collided with the public
    // organization-type filter. New links use `export` and preserve `type`.
    if (!searchParams.has("export")) queryParams.delete("type");
    const query = atlasQueryFromSearchParams(queryParams);
    const capabilityScope = atlasResultsCapabilityExportScope(query);
    const organizations = getAtlasOrganizationsForExport(query,requestedOrganizationIds);
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
      "public_source_count",
      "scope_note"
    ];
    const rows = (await organizations).map((organization) => {
      const scopedCapabilities = capabilityScope.includeCapabilities ? organization.capabilities : [];
      const citations = [
        ...organization.citations,
        ...scopedCapabilities.flatMap((capability) => [
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
        scopedCapabilities.map((capability) => capability.name).join("; "),
        Array.from(new Set(scopedCapabilities.flatMap((capability) => capability.technicalDomains.map((domain) => domain.name)))).join("; "),
        Array.from(new Set(scopedCapabilities.flatMap((capability) => capability.missionMatches.map((match) => match.missionArea.name)))).join("; "),
        String(new Set(citations.map((citation) => citation.sourceUrl)).size),
        capabilityScope.note
      ];
    });
    return new NextResponse(buildCsv(header, rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=\"true-north-map-results.csv\""
      }
    });
  }

  const { renderCapabilityDossierPdf, renderCollectionLookbookPdf, renderOrganizationDossierPdf, renderRegionReportPdf } = await import("@/lib/export/atlas-pdf");

  if (type === "organization-dossier") {
    const slug = searchParams.get("slug");
    const organization = slug ? await getAtlasOrganizationBySlug(slug) : null;
    if (!organization) return NextResponse.json({ error: "Published organization not found." }, { status: 404 });
    return pdfResponse(await renderOrganizationDossierPdf(organization), `${organization.slug}-public-dossier.pdf`);
  }

  if (type === "capability-dossier") {
    const slug = searchParams.get("slug");
    const result = slug ? await getAtlasCapabilityBySlug(slug) : null;
    if (!result) return NextResponse.json({ error: "Published technology not found." }, { status: 404 });
    return pdfResponse(await renderCapabilityDossierPdf(result.organization, result.capability), `${result.capability.slug}-technology-profile.pdf`);
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
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Collection id is required." }, { status: 400 });
    const supabase = await createClient();
    const {data:collection,error:collectionError}=await supabase.from("saved_collections").select("id, name").eq("id",id).eq("owner_id",user.id).single();
    if (collectionError || !collection) return NextResponse.json({ error: "Collection not found." }, { status: 404 });
    const items=await collectPagedRows((from,to)=>supabase.from("saved_collection_items").select("entity_type, entity_id, note").eq("collection_id",id).order("created_at").order("id").range(from,to),"Shortlist export items");
    const organizations=await getAtlasOrganizationsForCollection(items);
    const organizationsById = new Map(organizations.map((organization) => [organization.id, organization]));
    const capabilitiesById = new Map(organizations.flatMap((organization) => organization.capabilities.map((capability) => [capability.id, { organization, capability }] as const)));
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

  return NextResponse.json({ error: "Invalid export request." }, { status: 400 });
}


export async function GET(request: Request) {
  const startedAt = Date.now();
  const url = new URL(request.url);
  const requestedType = url.searchParams.get("export") ?? url.searchParams.get("type");
  const type = ["atlas-results", "organization-dossier", "capability-dossier", "region-report", "collection-lookbook"].includes(requestedType ?? "") ? requestedType! : "invalid";
  const finish = (response: NextResponse, outcome: string) => {
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    recordExportOutcome(type, outcome, response.status, startedAt);
    return response;
  };
  if (type === "invalid") return finish(NextResponse.json({ error: "Invalid export request." }, { status: 400 }), "invalid_request");
  try {
    const user = await getAtlasUser();
    if (!user) {
      const signIn = `/sign-in?next=${encodeURIComponent(url.pathname + url.search)}`;
      if (request.headers.get("accept")?.includes("text/html")) {
        return finish(NextResponse.redirect(new URL(signIn, url), 303), "authentication_required");
      }
      return finish(NextResponse.json({ error: "Sign in to download.", signIn }, { status: 401 }), "authentication_required");
    }
    const allowance = await reserveExportRequest(user.id);
    if (!allowance.allowed) return finish(NextResponse.json({ error: "Download limit reached. Please try again later." }, { status: 429, headers: { "Retry-After": String(allowance.retryAfter) } }), "rate_limited");
    const response = await generateExport(request, user);
    return finish(response, response.ok ? "generated" : "rejected");
  } catch {
    return finish(NextResponse.json({ error: "Downloads are temporarily unavailable. Please try again shortly." }, { status: 503, headers: { "Retry-After": "60" } }), "unavailable");
  }
}
