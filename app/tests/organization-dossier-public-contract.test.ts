import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { buildDossierSections, compactCanadianFootprint, organizationInitials } from "@/lib/atlas/dossier-presentation";
import {
  dossierCitationRows,
  dossierCitationTargets,
  mapAtlasOrganizationDossierRow
} from "@/lib/atlas/supabase-repository";
import type { AtlasOrganization } from "@/types/atlas";

async function source(file: string) {
  const text = await readFile(path.resolve(file), "utf8");
  return file === "src/app/capabilities/[slug]/page.tsx"
    ? `${text}\n${await readFile(path.resolve("src/components/atlas/capability-dossier.tsx"), "utf8")}`
    : text;
}

function citation(entityType: string, entityId: string, fieldName: string, id: string, locator = "Annex B, table 4") {
  return {
    citation: { id, entity_type: entityType, entity_id: entityId, field_name: fieldName },
    evidence: { excerpt: `Public evidence for ${fieldName}.`, source_locator: locator },
    source: {
      title: "Official dossier source",
      canonical_url: "https://sample.ca/evidence",
      publisher: "Sample Organization",
      source_type: "official_organization_profile",
      published_at: "2026-08-01T00:00:00.000Z"
    }
  };
}

describe("public organization dossier contract", () => {
  it("hydrates citations only for child IDs admitted by the dossier row", () => {
    const targets = dossierCitationTargets({
      id: "organization-one",
      capabilities: [{ id: "capability-one" }, { id: "capability-one" }],
      mission_matches: [{ match: { id: "mission-match-one" } }],
      demand_matches: [{ match: { id: "demand-match-one" } }],
      programs: [{ id: "participation-one", program: { id: "program-one" } }],
      funding_events: [{ id: "funding-one" }],
      relationships: [{ id: "relationship-one" }],
      media_assets: [{ id: "media-one" }]
    });

    expect(targets).toEqual([
      { entityType: "organization", ids: ["organization-one"] },
      { entityType: "capability", ids: ["capability-one"] },
      { entityType: "capability_mission_match", ids: ["mission-match-one"] },
      { entityType: "capability_demand_match", ids: ["demand-match-one"] },
      { entityType: "program_participation", ids: ["participation-one"] },
      { entityType: "program", ids: ["program-one"] },
      { entityType: "funding_event", ids: ["funding-one"] },
      { entityType: "organization_relationship", ids: ["relationship-one"] },
      { entityType: "media_asset", ids: ["media-one"] }
    ]);
  });

  it("rebuilds the mapper citation shape only from approved graph rows", () => {
    const rows = dossierCitationRows({
      citations: [
        { id: "citation-one", entity_type: "organization", entity_id: "organization-one", field_name: "description", evidence_snippet_id: "evidence-one" },
        { id: "citation-missing", entity_type: "organization", entity_id: "organization-one", field_name: "ownership", evidence_snippet_id: "evidence-missing" }
      ],
      evidence: [{ id: "evidence-one", source_id: "source-one", excerpt: "Public evidence." }],
      sources: [{ id: "source-one", title: "Official source", canonical_url: "https://example.ca/source", publisher: "Example", source_type: "official_organization_profile", published_at: null }]
    });

    expect(rows).toEqual([{
      citation: expect.objectContaining({ id: "citation-one" }),
      evidence: expect.objectContaining({ id: "evidence-one" }),
      source: expect.objectContaining({ id: "source-one" })
    }]);
  });

  it("maps the bounded dossier projection without losing organization-specific programme facts", () => {
    const organizationId = "organization-one";
    const capabilityId = "capability-one";
    const participationId = "participation-one";
    const programId = "program-one";
    const relationshipId = "relationship-one";
    const fundingId = "funding-one";
    const mapped = mapAtlasOrganizationDossierRow({
      id: organizationId,
      slug: "sample-organization",
      name: "Sample Organization",
      legal_name: "Sample Organization Ltd.",
      description: "A source-backed executive description for the sample organization.",
      website_url: "https://sample.ca",
      entity_kind: "company",
      organization_categories: ["commercial_company", "dual_use"],
      source_confidence: "high",
      freshness_status: "current",
      last_reviewed_at: "2026-08-09T00:00:00.000Z",
      founded_year: 2021,
      employee_range: "11-50",
      company_stage: "growth",
      ownership: "privately held",
      commercial_status: "commercial",
      disclosed_financing_summary: null,
      defence_posture: null,
      dual_use_posture: "Public civil and defence applications are documented.",
      profile_data: { portfolioScope: "Documented sensing and integration products." },
      editorial_profile_version: "organization_editorial_profile_v1",
      current_activity: "The organization published a current integration milestone.",
      current_activity_as_of: "2026-08-01",
      operating_context: "Operators use the platform to combine multiple public sensor feeds.",
      canadian_footprint: "Engineering and integration are publicly documented in Halifax.",
      reviewed_questions: [{ id: "integration-boundary", question: "Which integration boundary governs deployment readiness?", context: "The source describes interfaces without assigning the operator-controlled dependency.", confidence: "moderate" }],
      locations: [{ id: "location-one", name: "Halifax, Nova Scotia", city: "Halifax", province_territory: "Nova Scotia", country_code: "CA", latitude: 44.6488, longitude: -63.5752, geographic_confidence: "city_centroid", is_primary: true }],
      capabilities: [{
        id: capabilityId,
        organization_id: organizationId,
        slug: "sample-sensing-capability",
        name: "Sample sensing capability",
        summary: "The platform combines multiple sensing inputs into an operator-facing monitoring workflow.",
        capability_type: "Sensing integration software",
        core_features: ["Multi-sensor integration"],
        technology_readiness_level: 7,
        maturity: "Demonstrated",
        commercial_availability: "Available through the official organization",
        defence_applications: ["Maritime monitoring"],
        novelty: ["Bounded interface model"],
        technical_tags: ["sensor fusion"],
        source_confidence: "high",
        last_reviewed_at: "2026-08-09T00:00:00.000Z"
      }],
      capability_domains: [{ capability_id: capabilityId, technical_domain: { id: "domain-one", slug: "sensing-and-isr", name: "Sensing and ISR", summary: "Reviewed sensing technologies." } }],
      mission_matches: [{ match: { id: "mission-match-one", capability_id: capabilityId, alignment_summary: "The documented sensing workflow may support maritime awareness decisions.", match_type: "derived", confidence: "moderate" }, mission_area: { id: "mission-one", slug: "underwater-isr", name: "Underwater ISR", summary: "Reviewed maritime sensing mission area.", source_confidence: "high" } }],
      demand_matches: [{ match: { id: "demand-match-one", capability_id: capabilityId, alignment_summary: "The public capability may inform a released sensor-integration need.", match_type: "public_source_alignment", confidence: "moderate" }, requirement: { id: "demand-one", slug: "released-sensing-need", title: "Released sensing integration need" } }],
      programs: [{
        id: participationId,
        participation_type: "selected participant",
        cohort_label: "2026 cohort",
        public_summary: "Sample Organization owns the sensing-integration workstream in the public programme.",
        lifecycle_stage: "testing",
        announced_on: "2026-06-01",
        started_on: "2026-07-01",
        ended_on: null,
        external_identifiers: [{ kind: "project", value: "SAMPLE-2026" }],
        program: { id: programId, slug: "sample-programme", name: "Sample Programme", program_type: "demonstration programme", operator_name: "Public Operator", website_url: "https://sample.ca/programme", summary: "The canonical programme tests Canadian sensing and integration technologies." }
      }],
      funding_events: [{ id: fundingId, event_type: "public grant", announced_on: "2026-06-01", amount_value: 250000, amount_currency: "CAD", disclosed_summary: "A public grant supports the documented integration activity." }],
      relationships: [{ id: relationshipId, relationship_type: "programme_operator", public_summary: "The public operator runs the programme in which Sample Organization participates.", related_organization_id: null, related_organization_name: "Public Operator", related_organization: null }],
      media_assets: [{ id: "logo-one", organization_id: organizationId, capability_id: null, asset_type: "logo", storage_path: "organizations/sample/logo.svg", source_url: "https://sample.ca/brand", source_visibility: "public", attribution_text: "Sample Organization official logo", approval_status: "approved", publication_status: "published", created_at: "2026-08-09T00:00:00.000Z", alt_text: "Sample Organization logo", display_role: "profile_identity" }],
      citations: [
        citation("organization", organizationId, "description", "citation-organization", "operations.op-private.value.description"),
        citation("capability", capabilityId, "summary", "citation-capability"),
        citation("program_participation", participationId, "public_summary", "citation-participation"),
        citation("program", programId, "summary", "citation-program"),
        citation("funding_event", fundingId, "disclosed_summary", "citation-funding"),
        citation("organization_relationship", relationshipId, "public_summary", "citation-relationship")
      ]
    });

    expect(mapped.editorialProfile).toMatchObject({
      version: "organization_editorial_profile_v1",
      currentActivityAsOf: "2026-08-01",
      reviewedQuestions: [{ id: "integration-boundary", confidence: "moderate" }]
    });
    expect(mapped.primaryLocation?.geographicConfidence).toBe("city_centroid");
    expect(mapped.capabilities[0]).toMatchObject({
      technologyReadinessLevel: 7,
      maturity: "Demonstrated",
      commercialAvailability: "Available through the official organization"
    });
    expect(mapped.programs[0]).toMatchObject({
      programName: "Sample Programme",
      programSummary: "The canonical programme tests Canadian sensing and integration technologies.",
      programOperatorName: "Public Operator",
      participationType: "selected participant",
      publicSummary: "Sample Organization owns the sensing-integration workstream in the public programme.",
      lifecycleStage: "testing",
      externalIdentifiers: [{ kind: "project", value: "SAMPLE-2026" }]
    });
    expect(mapped.capabilities[0].citations[0].sourceLocator).toBe("Annex B, table 4");
    expect(mapped.citations[0].sourceLocator).toBeNull();
    expect(mapped.programs[0].citations).toHaveLength(1);
    expect(mapped.programs[0].programCitations).toHaveLength(1);
    expect(mapped.relationships[0].citations).toHaveLength(1);
    expect(mapped.fundingEvents[0].citations).toHaveLength(1);
    expect(mapped.logo?.publicUrl).toContain("/storage/v1/object/public/atlas-public-media/organizations/sample/logo.svg");
  });

  it("derives sparse and rich navigation plus compact identity facts without placeholders", () => {
    const sparseSections = buildDossierSections({
      hasCurrentActivity: false,
      hasConnections: false,
      hasCapabilities: false,
      hasPublicRecord: false,
      hasQuestions: false,
      hasSources: false
    });
    const richSections = buildDossierSections({
      hasCurrentActivity: true,
      hasConnections: true,
      hasCapabilities: true,
      hasPublicRecord: true,
      hasQuestions: true,
      hasSources: true
    });

    expect(sparseSections).toEqual([
      { id: "profile", label: "Overview" },
      { id: "contact", label: "Next steps" }
    ]);
    expect(richSections).toEqual([
      { id: "profile", label: "Overview" },
      { id: "why-now", label: "Why now" },
      { id: "connections", label: "Where it could contribute" },
      { id: "capabilities", label: "Technologies and services" },
      { id: "public-record", label: "Public record" },
      { id: "questions", label: "Questions" },
      { id: "sources", label: "Sources" },
      { id: "contact", label: "Next steps" }
    ]);
    expect(new Set(richSections.map((section) => section.id)).size).toBe(richSections.length);
    expect(richSections.some((section) => section.id === "geography")).toBe(false);
    expect(richSections.some((section) => section.id === "related")).toBe(false);
    const optionalSections = [
      ["hasCurrentActivity", "why-now"],
      ["hasConnections", "connections"],
      ["hasCapabilities", "capabilities"],
      ["hasPublicRecord", "public-record"],
      ["hasQuestions", "questions"],
      ["hasSources", "sources"]
    ] as const;
    for (const [enabledFlag, expectedId] of optionalSections) {
      const flags = {
        hasCurrentActivity: false,
        hasConnections: false,
        hasCapabilities: false,
        hasPublicRecord: false,
        hasQuestions: false,
        hasSources: false,
        [enabledFlag]: true
      };
      expect(buildDossierSections(flags).map((section) => section.id)).toEqual(["profile", expectedId, "contact"]);
    }
    expect(buildDossierSections({
      hasCurrentActivity: true,
      hasConnections: true,
      hasCapabilities: true,
      hasPublicRecord: false,
      hasQuestions: false,
      hasSources: false
    }).map((section) => section.id)).toEqual(["profile", "why-now", "connections", "capabilities", "contact"]);
    expect(organizationInitials("Northern Vector Systems")).toBe("NV");
    expect(organizationInitials("CAE")).toBe("CA");
    expect(organizationInitials("---")).toBeNull();

    const halifaxLocation = {
      id: "halifax",
      name: "Halifax, Nova Scotia",
      city: "Halifax",
      provinceTerritory: "Nova Scotia",
      countryCode: "CA",
      latitude: null,
      longitude: null,
      geographicConfidence: "city_centroid" as const,
      regionSlug: "atlantic-canada"
    };
    const vancouverLocation = {
      ...halifaxLocation,
      id: "vancouver",
      name: "Vancouver, British Columbia",
      city: "Vancouver",
      provinceTerritory: "British Columbia",
      regionSlug: "pacific-canada"
    };
    expect(compactCanadianFootprint({ primaryLocation: halifaxLocation, locations: [] } as unknown as AtlasOrganization)).toBe("Nova Scotia");
    expect(compactCanadianFootprint({ primaryLocation: halifaxLocation, locations: [halifaxLocation, vancouverLocation] } as unknown as AtlasOrganization)).toBe("Nova Scotia · British Columbia");
    expect(compactCanadianFootprint({ primaryLocation: { ...halifaxLocation, countryCode: "US" }, locations: [] } as unknown as AtlasOrganization)).toBeNull();
  });

  it("renders every published organization through the shared dossier shell", async () => {
    const route = await source("src/app/organizations/[slug]/page.tsx");
    expect(route).toContain("<ExecutiveOrganizationDossier");
    expect(route).not.toContain('organization.editorialProfile.version === "organization_editorial_profile_v1"');
    expect(route).not.toContain("const citations = [");
    expect(route).toContain("alternates: { canonical: path }");
    expect(route).toContain("organizationMandateForMetadata");
    expect(route).not.toContain('title="What remains unknown"');
  });

  it("preserves deferred related content, geographic precision, media guards and navigation telemetry", async () => {
    const [dossier, navigator] = await Promise.all([
      source("src/components/atlas/executive-organization-dossier.tsx"),
      source("src/components/atlas/dossier-section-navigator.tsx")
    ]);
    expect(dossier).toContain("<Suspense fallback={null}>");
    expect(dossier).toContain("relatedIntelligence ?? await getDossierRelatedIntelligence(organization)");
    expect(dossier).toContain("locationContext(organization, false)");
    expect(dossier).toContain("does not imply a street address or exact facility location");
    expect(dossier).toContain("trackEngagement = true");
    expect(dossier).toContain('media.assetType !== "logo"');
    expect(dossier).toContain('media.editorialContext.reuseBasis !== "unknown"');
    expect(dossier).toContain("media.altText?.trim()");
    expect(dossier).toContain("canonicalOrganizationRelationshipEdge(relationship)");
    expect(dossier).toContain("Similarity results describe shared areas of work, not partnerships or endorsements.");
    expect(navigator).toContain('data-profile-action="section_nav"');
    expect(navigator).toContain('window.addEventListener("hashchange"');
    expect(navigator).toContain('window.addEventListener("popstate"');
    expect(navigator).toContain("parent.open = true");
    expect(navigator).toContain("focus({ preventScroll: true })");
  });

  it("bounds related intelligence, rich reads, PDF selection, and social logo trust", async () => {
    const [related, repository, pdf, og] = await Promise.all([
      source("src/lib/atlas/dossier-related.ts"),
      source("src/lib/atlas/supabase-repository.ts"),
      source("src/lib/export/atlas-pdf.tsx"),
      source("src/app/api/og/route.tsx")
    ]);
    const organizationLoader = repository.slice(
      repository.indexOf("export async function loadAtlasOrganizationBySlugFromSupabase"),
      repository.indexOf("export async function loadAtlasCapabilityBySlugFromSupabase")
    );
    expect(related).toContain("getRelatedBriefSummaries(targets)");
    expect(related).toContain("getRelatedSignalSummaries(targets)");
    expect(await source("src/lib/atlas/briefs.ts")).toContain(".slice(0, 3)");
    expect(await source("src/lib/atlas/signals.ts")).toContain(".slice(0, 3)");
    expect(related).toContain(".slice(0, 4)");
    expect(related).toContain('.eq("publication_status", "published")');
    expect(organizationLoader).toContain('.from("organizations")\n    .select("id, editorial_profile_version")');
    expect(organizationLoader).toContain('organizationResult.data.editorial_profile_version !== "organization_editorial_profile_v1"');
    expect(organizationLoader).toContain("loadAtlasSnapshotFromSupabase({");
    expect(organizationLoader).toContain('.from("organization_dossiers")');
    expect(organizationLoader).toContain("dossierPresentationCopyAvailable() ? `${atlasDossierColumns}, display_lead, role_descriptor` : atlasDossierColumns");
    expect(organizationLoader).toContain("dossierCitationTargets(dossierRow)");
    expect(organizationLoader).toContain("dossierCitationRows(citationGraph)");
    expect(organizationLoader).toContain('.eq("id", organizationId)');
    expect(organizationLoader).toContain('.eq("editorial_profile_version", "organization_editorial_profile_v1")');
    expect(organizationLoader.indexOf('.from("organizations")\n    .select("id, editorial_profile_version")')).toBeLessThan(
      organizationLoader.indexOf('.from("organization_dossiers")')
    );
    expect(organizationLoader).not.toContain('.from("organization_dossiers")\n    .select("*")');
    expect(pdf).toContain('organization.editorialProfile.version === "organization_editorial_profile_v1"');
    expect(pdf).toContain("<ExecutiveOrganizationPdf organization={organization} />");
    expect(og).toContain('url.hostname === "facoactpdckkhciamflk.supabase.co"');
    expect(og).toContain('url.pathname.startsWith("/storage/v1/object/public/atlas-public-media/")');
  });

  it("provides a noindex local-only review surface for the shared template", async () => {
    const preview = await source("src/app/dev/dossier-preview/page.tsx");
    expect(preview).toContain('process.env.NODE_ENV !== "development"');
    expect(preview).toContain("notFound()");
    expect(preview).toContain("robots: { index: false, follow: false }");
    expect(preview).toContain("<ExecutiveOrganizationDossier");
    expect(preview).toContain("trackEngagement={false}");
    expect(preview).not.toContain("getAtlasSnapshot");
  });
});
