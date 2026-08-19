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
  return readFile(path.resolve(file), "utf8");
}

function citation(entityType: string, entityId: string, fieldName: string, id: string) {
  return {
    citation: { id, entity_type: entityType, entity_id: entityId, field_name: fieldName },
    evidence: { excerpt: `Public evidence for ${fieldName}.` },
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
        citation("organization", organizationId, "description", "citation-organization"),
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
      { id: "capabilities", label: "Capabilities" },
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

  it("implements the locked dossier hierarchy, contextual questions, location accuracy, and CTA order", async () => {
    const [dossier, capability, presentation, navigator, mapPreview, atlasMap] = await Promise.all([
      source("src/components/atlas/executive-organization-dossier.tsx"),
      source("src/app/capabilities/[slug]/page.tsx"),
      source("src/lib/atlas/dossier-presentation.ts"),
      source("src/components/atlas/dossier-section-navigator.tsx"),
      source("src/components/atlas/organization-map-preview.tsx"),
      source("src/components/atlas/atlas-map.tsx")
    ]);
    expect((dossier.match(/<h1\b/g) ?? [])).toHaveLength(1);
    expect(dossier).toContain("Where this organization could contribute.");
    expect(dossier).toContain("Decision snapshot");
    expect(dossier).toContain("Why this organization may be worth examining");
    expect(dossier).toContain("organization.editorialProfile.executiveRelevanceSummary");
    expect(dossier).toContain("missionConnections[0] ?? null");
    expect(dossier).toContain("demandConnections[0] ?? null");
    expect(dossier).toContain("See all reviewed connections");
    expect(dossier).toContain("Follow the reviewed Mission Area and Public Need connections to understand the problem this organization may help address, the public evidence behind the assessment, and what to verify before engagement.");
    expect(dossier).not.toContain("See how documented capabilities connect to reviewed Mission Areas and released Public Needs—and why each connection may be worth a conversation.");
    expect(dossier).toContain("Contributing capability");
    expect(dossier).toContain("Questions for a first conversation");
    expect(dossier).toContain("organization.editorialProfile.reviewedQuestions.length");
    const orderedSectionIds = ["why-now", "connections", "capabilities", "public-record", "questions", "geography", "sources", "contact", "related"];
    orderedSectionIds.forEach((id) => expect(dossier).toContain(`id="${id}"`));
    orderedSectionIds.slice(1).forEach((id, index) => {
      expect(dossier.indexOf(`id="${orderedSectionIds[index]}"`)).toBeLessThan(dossier.indexOf(`id="${id}"`));
    });
    expect(dossier).toContain('id="profile"');
    expect(dossier.indexOf("<DossierExecutiveSummary organization={organization} />")).toBeLessThan(dossier.indexOf('id="why-now"'));
    expect(dossier).not.toContain('className="order-');
    expect(dossier).toContain('from "@/components/atlas/dossier-section-navigator"');
    expect(dossier).toContain("<DossierSectionNavigator sections={dossierSections} />");
    expect(dossier).not.toContain("function DossierSectionNavigator");
    expect(navigator).toContain('"use client"');
    expect(navigator).toContain("if (sections.length < 4) return null");
    expect(navigator).toContain('aria-label="On this page"');
    expect(navigator).toContain("On this page");
    expect(navigator).toContain("IntersectionObserver");
    expect(navigator).toContain('rootMargin: "-112px 0px -62% 0px"');
    expect(navigator).toContain('aria-current={active ? "location" : undefined}');
    expect(navigator).toContain('data-profile-action="section_nav"');
    expect(navigator).toContain('data-profile-target-id={section.id}');
    expect(navigator).toContain('data-profile-target-type="section"');
    expect(navigator).toContain('data-profile-section="navigator"');
    expect(navigator).toContain("event.preventDefault()");
    expect(navigator).toContain("scrollIntoView({ block: \"start\" })");
    expect(navigator).toContain("focus({ preventScroll: true })");
    expect(navigator).toContain("disclosureRef.current.open = false");
    expect(navigator).toContain('window.addEventListener("hashchange"');
    expect(navigator).toContain('window.addEventListener("popstate"');
    expect(navigator).toContain('className="group lg:hidden"');
    expect(navigator).toContain("lg:flex");
    expect(navigator).toContain("border-y border-[var(--atlas-border)] bg-white");
    expect(navigator).toContain("decoration-[var(--atlas-signal)]");
    expect(navigator).toContain("gap-4 lg:flex xl:gap-6");
    expect(navigator).toContain("flex-nowrap");
    expect(navigator).toContain("gap-x-4 xl:gap-x-6");
    expect(navigator).toContain('className="shrink-0"');
    expect(navigator).toContain("whitespace-nowrap");
    expect(navigator).not.toContain("justify-between gap-x-2");
    expect(navigator).not.toContain("flex-wrap");
    expect(navigator).toContain("underline underline-offset-4");
    expect(navigator).toContain("decoration-[var(--atlas-border-strong)]");
    expect(navigator).not.toContain("atlas-tonal-blue");
    expect(navigator).not.toContain("grid-cols-4");
    expect(navigator).not.toContain("xl:grid-cols-5");
    expect(navigator).not.toContain("String(index + 1)");
    expect(navigator).not.toContain("<ArrowDown");
    expect(presentation).toContain("if (hasCurrentActivity) sections.push");
    expect(presentation).toContain("if (hasConnections) sections.push");
    expect(presentation).toContain("if (hasCapabilities) sections.push");
    expect(presentation).toContain("if (hasPublicRecord) sections.push");
    expect(presentation).toContain("if (hasQuestions) sections.push");
    expect(presentation).toContain("if (hasSources) sections.push");
    expect(`${dossier}\n${navigator}`).not.toContain("sticky");
    expect(dossier).not.toContain("max-w-[1240px]");
    expect(dossier).toContain("<DossierExecutiveSummary organization={organization} />");
    expect(dossier).toContain("<GeographyMapLink mapReturnTo={mapReturnTo} organizationId={organization.id} />");
    expect(dossier).toContain("selectedMapHref(mapReturnTo, organizationId)");
    expect(dossier).toContain("locationContext(organization, false)");
    expect(dossier).toContain("does not imply a street address or exact facility location");
    expect(dossier).toContain("<OrganizationMapPreview organization={projectAtlasMapOrganization(organization)} />");
    expect(mapPreview).toContain('<div role="img"');
    expect(atlasMap).toContain('role="region"');
    expect(dossier).not.toContain("/static/");
    expect(mapPreview).toContain("IntersectionObserver");
    expect(mapPreview).toContain('rootMargin: "320px 0px"');
    expect(mapPreview).toContain("interactive={false}");
    expect(mapPreview).toContain("compact");
    expect(mapPreview).toContain('baseMapProvider="openstreetmap"');
    expect(mapPreview).toContain("singleOrganizationZoom=");
    expect(mapPreview).toContain("organizations={[organization]}");
    expect(dossier).toContain("trackEngagement = true");
    expect(dossier).toContain('className="atlas-signal-button h-12');
    expect(dossier).toContain("Building2");
    expect(dossier.indexOf("Add to Working List")).toBeLessThan(dossier.indexOf("Request an introduction"));
    expect(dossier.indexOf("pageHeader={<EditorialHeader")).toBeLessThan(dossier.indexOf("<DossierExecutiveSummary"));
    expect(dossier).toContain("participation.lifecycleStage");
    expect(dossier).toContain("toTitleCase(participation.lifecycleStage)");
    expect(dossier).toContain("<Suspense");
    expect(dossier).toContain("<RelatedIntelligenceLoader organization={organization} relatedIntelligence={relatedIntelligence} />");
    ["01 ·", "02 ·", "03 ·", "04 ·", "05 ·", "06 ·", "07 ·"].forEach((fixedChapter) => {
      expect(dossier).not.toContain(fixedChapter);
    });
    [
      "Source-backed fact",
      "Source-backed connection",
      "Strong evidence",
      "Moderate evidence",
      "Limited evidence",
      "evidence context",
      "EvidenceChip",
      "atlas-pill-evidence"
    ].forEach((removed) => expect(dossier).not.toContain(removed));
    expect(dossier).toContain("brandCopy.trustCompact");
    ["Executive memo", "Moderate–High", "Active and operating", "Strong alignment", "High relevance", ">Risks<", ">Documents<"].forEach((unsupported) => {
      expect(dossier).not.toContain(unsupported);
    });
    const header = dossier.slice(dossier.indexOf("function EditorialHeader"), dossier.indexOf("function DossierActions"));
    const identityMark = dossier.slice(dossier.indexOf("function OrganizationIdentityMark"), dossier.indexOf("function EditorialHeader"));
    const executiveSummary = dossier.slice(dossier.indexOf("function DossierExecutiveSummary"), dossier.indexOf("function OrganizationIdentityMark"));
    const whyNow = dossier.slice(dossier.indexOf('id="why-now"'), dossier.indexOf("{hasConnections ?"));
    const connections = dossier.slice(dossier.indexOf('id="connections"'), dossier.indexOf("{organization.capabilities.length ?"));
    const capabilities = dossier.slice(dossier.indexOf('id="capabilities"'), dossier.indexOf("{hasPublicRecord ?"));
    const publicRecordStart = dossier.indexOf('id="public-record"');
    const publicRecord = dossier.slice(publicRecordStart, dossier.indexOf("{organization.editorialProfile.reviewedQuestions.length ?", publicRecordStart));
    const questionsStart = dossier.indexOf('id="questions"');
    const questions = dossier.slice(questionsStart, dossier.indexOf("{organization.primaryLocation ?", questionsStart));
    const geographyStart = dossier.indexOf('id="geography"');
    const geography = dossier.slice(geographyStart, dossier.indexOf("{sourceCount ?", geographyStart));
    const sourcesStart = dossier.indexOf('id="sources"');
    const sources = dossier.slice(sourcesStart, dossier.indexOf('id="contact"', sourcesStart));
    const contactStart = dossier.indexOf('id="contact"');
    const contact = dossier.slice(contactStart, dossier.indexOf('id="related"', contactStart));
    const relatedStart = dossier.indexOf('id="related"');
    const related = dossier.slice(relatedStart, dossier.indexOf("<NorthSignalInline", relatedStart));
    const capabilityRow = dossier.slice(dossier.indexOf("function CapabilityRow"), dossier.indexOf("function GeographyMapLink"));
    const relationshipLists = dossier.slice(dossier.indexOf("function RelationshipList"), dossier.indexOf("async function RelatedIntelligenceLoader"));
    const relatedIntelligence = dossier.slice(dossier.indexOf("function RelatedIntelligence"), dossier.indexOf("function MapPathways"));
    const mapPathways = dossier.slice(dossier.indexOf("function MapPathways"), dossier.indexOf("function SourceRow"));
    const sourceRow = dossier.slice(dossier.indexOf("function SourceRow"), dossier.indexOf("function ProfileFact"));
    expect(header).toContain("lg:grid-cols-12");
    expect(header).toContain("lg:col-span-8");
    expect(header).toContain("lg:col-span-4");
    expect(header).toContain("bg-white");
    expect(header).toContain("text-[var(--atlas-ink)]");
    expect(header).toContain("organizationKindLabel(organization.entityKind)");
    expect((header.match(/organizationKindLabel\(organization.entityKind\)/g) ?? [])).toHaveLength(1);
    expect(header).toContain("<OrganizationIdentityMark organization={organization} />");
    expect(header).toContain("[overflow-wrap:anywhere]");
    expect(identityMark.indexOf("organization.logo")).toBeLessThan(identityMark.indexOf("initials ?"));
    expect(identityMark.indexOf("initials ?")).toBeLessThan(identityMark.indexOf("<Building2"));
    expect(identityMark).toContain("organizationInitials(organization.name)");
    expect(header).toContain('<DossierActions organization={organization} profilePath={profilePath} mode="panel" />');
    expect(header).not.toContain("bg-[var(--atlas-ink)]");
    expect(header).not.toContain("shadow-[");
    expect(header).not.toContain("Executive organization dossier");
    expect(header).not.toContain("Build your next step");
    expect(dossier).toContain("Next actions");
    expect(dossier).toContain("Visit website");
    expect(dossier).toContain("Download profile");
    expect(dossier).toContain("What the organization does");
    expect(dossier).toContain("At a glance");
    expect(dossier).toContain("Public programs and contracts");
    expect(dossier).toContain("Sponsor or operator:");
    expect(dossier).toContain("participation.externalIdentifiers");
    expect(dossier).not.toContain("Organization profile");
    expect(dossier).not.toContain("Organization snapshot");
    expect(dossier).not.toContain("Technology and capabilities");
    expect(dossier).not.toContain("Contracts, programs, and relationships");
    expect(executiveSummary).not.toContain("organization.description");
    expect(executiveSummary).toContain("organization.editorialProfile.canadianFootprint");
    expect(executiveSummary).toContain("compactCanadianFootprint(organization)");
    expect(executiveSummary).toContain("snapshotFacts.slice(0, 6)");
    expect(executiveSummary).toContain("lg:items-stretch");
    expect((executiveSummary.match(/lg:h-full/g) ?? [])).toHaveLength(2);
    expect(executiveSummary).not.toContain("self-start");
    expect(executiveSummary).not.toContain("max-w-5xl");
    ["Legal name", "Stage", "Team", "Commercial status"].forEach((removedFact) => expect(executiveSummary).not.toContain(`label: "${removedFact}"`));
    expect(dossier).toContain('<article className="mt-6 space-y-7 sm:mt-8 sm:space-y-8 lg:mt-9 lg:space-y-10" data-public-dossier="true">');
    expect(whyNow).toContain("atlas-tonal-signal w-full");
    expect(whyNow).not.toContain("max-w-5xl");
    expect(connections).toContain("atlas-tonal-paper w-full");
    expect(connections).toContain("hasBothConnectionTypes");
    expect(connections).toContain('"xl:col-span-6" : "xl:col-span-12"');
    expect(connections).toContain("flex-1 divide-y");
    expect(connections).not.toContain("border-b border-[var(--atlas-border)]");
    expect(capabilities).toContain("atlas-tonal-paper w-full");
    expect(publicRecord).toContain("atlas-tonal-paper w-full");
    expect(publicRecord).toContain('organization.relationships.length && organization.fundingEvents.length ? "lg:grid-cols-2" : ""');
    expect(relationshipLists).not.toContain("border-y border-[var(--atlas-border)]");
    expect((relationshipLists.match(/border-t border-\[var\(--atlas-border\)\]/g) ?? [])).toHaveLength(2);
    expect(questions).toContain("atlas-tonal-paper w-full");
    expect(questions).not.toContain("atlas-blue-soft");
    expect(geography).toContain("atlas-tonal-paper w-full");
    expect(geography).not.toContain("shadow-[var(--atlas-shadow-soft)]");
    expect(sources).toContain("atlas-tonal-paper w-full");
    expect(sources).not.toContain("atlas-blue-soft");
    expect(related).toContain("atlas-tonal-paper w-full");
    expect(dossier.indexOf('id="contact"')).toBeLessThan(dossier.indexOf('id="related"'));
    expect(dossier.indexOf('id="related"')).toBeLessThan(dossier.indexOf("<NorthSignalInline", dossier.indexOf('id="related"')));
    expect(contact).toContain("hasPublicContactPaths");
    expect(contact).toContain("!hasPublicContactPaths");
    expect(capabilityRow).toContain("hasOperatingContext");
    expect(capabilityRow).toContain('"lg:col-span-7 xl:col-span-8" : "lg:col-span-12"');
    expect(dossier).toContain("tabIndex={-1}");
    expect(dossier).not.toContain("scroll-mt-24");
    expect((dossier.match(/scroll-mt-28/g) ?? []).length).toBeGreaterThanOrEqual(9);
    expect((dossier.match(/decoration-\[var\(--atlas-signal\)\]/g) ?? []).length).toBeGreaterThanOrEqual(8);
    expect((dossier.match(/Reviewed assessment/g) ?? [])).toHaveLength(1);
    expect(dossier).not.toContain("Our assessment");
    expect(dossier).toContain("Evidence strength:");
    expect(dossier).toContain("reviewedAt={capability.lastReviewedAt ?? organization.lastReviewedAt}");
    expect(dossier).toContain('reviewedScope={capability.lastReviewedAt ? "Capability" : "Profile"}');
    expect(dossier).toContain("{reviewedScope} last reviewed");
    expect(dossier).toContain('citation.fieldName === "current_activity"');
    expect(dossier).toContain("currentActivitySource.sourceUrl");
    expect(dossier).toContain("Recent activity");
    expect(dossier).toContain("Open technology profile");
    expect(dossier).toContain("capability.coreFeatures.slice(0, 3)");
    expect(dossier).toContain("Technical detail and applications");
    expect(dossier).toContain("after:absolute after:inset-0");
    expect(dossier).toContain("Open Mission Area");
    expect(dossier).toContain("Open Public Need");
    expect(relatedIntelligence).toContain("items.slice(0, 4)");
    expect(relatedIntelligence).toContain("items.slice(4)");
    expect(relatedIntelligence).toContain("View more related intelligence");
    expect(relatedIntelligence).toContain("RelatedDestinationRow");
    expect(relatedIntelligence).toContain("Related destinations");
    expect(relatedIntelligence).not.toContain("RelatedCard");
    expect(relatedIntelligence).not.toContain("atlas-blue-soft");
    expect(mapPathways).toContain("pathways.slice(0, 4)");
    expect(mapPathways).toContain("pathways.slice(4)");
    expect(mapPathways).toContain("View this organization on the map");
    expect(mapPathways).toContain("Explore Mission Area:");
    expect(mapPathways).toContain("Review Public Need:");
    expect(mapPathways).toContain("View more map pathways");
    expect(mapPathways).not.toContain("atlas-secondary-button");
    expect(sourceRow).toContain("Open source");
    expect(sourceRow).toContain("Source details");
    expect(sourceRow).toContain('aria-label={`Open source: ${source.sourceTitle}`}');
    expect(sourceRow).toContain('aria-label={`Source details: ${source.sourceTitle}`}');
    expect(sourceRow).toContain("Source type.");
    expect(sourceRow).toContain("sm:grid-cols-[minmax(0,1fr)_auto]");
    expect(sourceRow).not.toContain("bg-white");
    expect(dossier).not.toContain("min-h-10");
    expect(dossier).toContain("fallback={null}");
    expect(dossier).not.toContain("Loading related intelligence");
    expect(dossier).not.toContain("Use the map pathways below");
    expect(dossier).toContain("selectHeroMedia(organization.mediaAssets)");
    expect(dossier).toContain('media.assetType !== "logo"');
    expect(dossier).toContain("media.altText?.trim()");
    expect(`${dossier}\n${capability}`).not.toContain("What remains unknown");
    expect(capability).toContain('title="What it enables"');
    expect(capability).toContain("Evidence of maturity");
    expect(capability).toContain('title="Public programs and contracts"');
    expect(capability).toContain("Evidence limits");
    expect(capability).toContain("Next useful conversation");
    expect(capability).not.toContain("evidenceStrengthChipClass");
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
    expect(related).toContain("getPublishedDefenceBriefs()");
    expect(related).toContain("getPublishedSignals(30)");
    expect(related).toContain(".slice(0, 3)");
    expect(related).toContain(".slice(0, 4)");
    expect(related).toContain('.eq("publication_status", "published")');
    expect(organizationLoader).toContain('.from("organizations")\n    .select("id, editorial_profile_version")');
    expect(organizationLoader).toContain('organizationResult.data.editorial_profile_version !== "organization_editorial_profile_v1"');
    expect(organizationLoader).toContain("loadAtlasSnapshotFromSupabase({");
    expect(organizationLoader).toContain('.from("organization_dossiers")');
    expect(organizationLoader).toContain(".select(atlasDossierColumns)");
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
