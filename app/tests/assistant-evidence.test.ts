import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
const state = vi.hoisted(() => ({ graph: vi.fn(), discovery: vi.fn(), rows: {} as Record<string, Record<string, unknown>[]> }));
vi.mock("@/lib/atlas/repository", () => ({ getAtlasDiscoverySnapshot: state.discovery }));
vi.mock("@/lib/atlas/supabase-repository", async importOriginal => ({
  ...await importOriginal<typeof import("@/lib/atlas/supabase-repository")>(), loadPublicCitationGraph: state.graph
}));
vi.mock("@/lib/supabase/public", () => ({ createPublicClient: () => ({ from: (table: string) => {
  let columns: string[] = []; let from = 0; let to = Infinity;
  const chain = { select: (value: string) => { columns = value.split(",").map(column => column.trim()); return chain; },
    in: () => chain, eq: () => chain, order: () => chain,
    range: (start: number, end: number) => { from = start; to = end; return chain; },
    abortSignal: () => chain, then: (resolve: (value: unknown) => unknown) => Promise.resolve({
      data: (state.rows[table] ?? []).slice(from, to + 1).map(row => Object.fromEntries(columns.map(column => [column, row[column]]))), error: null
    }).then(resolve) };
  return chain;
} }) }));
import { getAssistantCatalogue, hydrateAssistantOrganizations } from "@/lib/atlas/assistant-catalogue";
import { dossierCitationRows, loadAtlasDiscoverySnapshotFromSupabase, mapAtlasOrganizationDossierRow } from "@/lib/atlas/supabase-repository";
import { discoveryEvidenceSignature } from "@/lib/atlas/discovery-context";
import type { AtlasOrganization } from "@/types/atlas";

const org = { id: "org-one", slug: "sample", name: "Sample", legal_name: "Sample Ltd", website_url: "https://sample.test", description: "Sensing integration", entity_kind: "company", organization_categories: ["commercial_company"], source_confidence: "high", freshness_status: "current", last_reviewed_at: "2026-10-28", company_stage: "growth", defence_posture: "Demonstrated trials", dual_use_posture: "Civil and defence applications", profile_data: { portfolioScope: "Sensor integration" }, current_activity: "A documented milestone", editorial_profile_version: "organization_editorial_profile_v1", operating_context: "Full dossier context" };
const cap = { id: "cap-one", organization_id: org.id, slug: "sensor", name: "Sensor", summary: "Bounded sensing configuration", capability_type: "Sensing", core_features: ["Data link"], technology_readiness_level: 7, maturity: "Demonstrated", commercial_availability: "On request", defence_applications: ["ISR"], novelty: ["Bounded interface"], technical_tags: ["sensing"], source_confidence: "moderate", last_reviewed_at: "2026-10-28" };
const location = { id: "loc-one", name: "Foreign facility", city: "Boston", province_territory: "Massachusetts", country_code: "US", latitude: 42.3, longitude: -71.1, geographic_confidence: "city_centroid" };
const locationLink = { organization_id: org.id, location_id: location.id, is_primary: true, location_role: "facility" };
const domain = { id: "domain-one", slug: "sensing", name: "Sensing", summary: "Sensing technologies" };
const mission = { id: "mission-one", slug: "isr", name: "ISR", summary: "Reviewed ISR need", source_confidence: "high" };
const missionMatch = { id: "mission-match", capability_id: cap.id, mission_area_id: mission.id, alignment_summary: "Reviewed sensing relevance", match_type: "derived", confidence: "moderate" };
const demand = { id: "demand-one", slug: "sensor-need", title: "Sensing need", demand_source_id: "source-one" };
const demandMatch = { id: "demand-match", capability_id: cap.id, demand_requirement_id: demand.id, alignment_summary: "Reviewed bounded relevance", match_type: "public_source_alignment", confidence: "moderate" };
const program = { id: "program-one", slug: "trial", name: "Trial", program_type: "demonstration", summary: "Full programme description", operator_name: "Trial operator", website_url: "https://sample.test/trial" };
const participation = { id: "participation-one", organization_id: org.id, program_id: program.id, participation_type: "participant", cohort_label: "2026", public_summary: "Full reviewed participation", lifecycle_stage: "testing", announced_on: "2026-06-01", external_identifiers: [{kind: "project", value: "TRIAL-1"}] };
const graph = {
  citations: [
    { id: "org-citation", entity_type: "organization", entity_id: org.id, field_name: "description", evidence_snippet_id: "evidence-one" },
    { id: "cap-citation", entity_type: "capability", entity_id: cap.id, field_name: "summary", evidence_snippet_id: "evidence-one" },
    { id: "mission-citation", entity_type: "capability_mission_match", entity_id: missionMatch.id, field_name: "alignment_summary", evidence_snippet_id: "evidence-one" },
    { id: "funding-citation", entity_type: "organization", entity_id: org.id, field_name: "disclosed_financing_summary", evidence_snippet_id: "evidence-one" }
  ],
  evidence: [{ id: "evidence-one", source_id: "source-one", excerpt: "Tested configuration only", source_locator: "Section 3" }],
  sources: [{ id: "source-one", title: "Official test", canonical_url: "https://sample.test/source", publisher: "Sample", source_type: "official", published_at: null }]
};

async function pair(emptyOptionals = false) {
  const organization = { ...org, ...(emptyOptionals ? { legal_name: "", website_url: "", defence_posture: "", dual_use_posture: "" } : {}) };
  const capability = { ...cap, ...(emptyOptionals ? { maturity: "", commercial_availability: "", novelty: ["", "Bounded interface"] } : {}) };
  const tables: typeof state.rows = { organizations: [organization], capabilities: [capability], locations: [location], organization_locations: [locationLink], technical_domains: [domain], capability_domains: [{ capability_id: cap.id, technical_domain_id: domain.id }], mission_areas: [mission], capability_mission_matches: [missionMatch], demand_sources: [{ id: "source-one", source_verified_at: "2026-10-28", source_verified_by: "reviewer-one" }], demand_requirements: [demand], capability_demand_matches: [demandMatch], programs: [program], program_participations: [participation] };
  // Exercise the actual bounded discovery SELECTs, not rich copied programme DTOs.
  state.rows = tables;
  const discovery = await loadAtlasDiscoverySnapshotFromSupabase();
  state.discovery.mockResolvedValue({ ...discovery, regions: [] });
  state.rows = tables;
  state.graph.mockResolvedValue({ ...graph, citations: graph.citations.slice(0, 2) });
  const catalogue = await getAssistantCatalogue();
  const [ask] = await hydrateAssistantOrganizations(catalogue.snapshot.organizations);
  const dossier = mapAtlasOrganizationDossierRow({ ...organization, locations: [{ ...location, ...locationLink }], capabilities: [capability], capability_domains: [{ capability_id: cap.id, technical_domain: domain }], mission_matches: [{ match: missionMatch, mission_area: mission }], demand_matches: [{ match: demandMatch, requirement: demand }], programs: [{ ...participation, program }], funding_events: [{ id: "fund-one", disclosed_summary: "Reviewed financing" }], relationships: [{ id: "rel-one", relationship_type: "programme_operator", public_summary: "Full relationship" }], media_assets: [{ id: "image-one", asset_type: "product_image", source_url: "https://sample.test/image.jpg" }], citations: dossierCitationRows(graph) });
  return { ask, dossier };
}

beforeEach(() => { state.rows = {}; state.graph.mockReset(); state.discovery.mockReset(); });
it("restores unchanged actual Ask-loader and dossier-mapper representations with richer evidence and programme details", async () => {
  const { ask, dossier } = await pair();
  expect(ask).not.toEqual(dossier);
  expect(ask.programs[0].programSummary).toBeNull();
  expect(dossier.programs[0].programSummary).toBe(program.summary);
  expect(ask.citations[0].sourceLocator).toBeUndefined();
  expect(dossier.citations[0].sourceLocator).toBe("Section 3");
  expect(ask.profileData).toEqual({});
  expect(dossier.fundingEvents).toHaveLength(1);
  expect(dossier.capabilities[0].missionMatches[0].citations).toHaveLength(1);
  expect(discoveryEvidenceSignature(ask)).toBe(discoveryEvidenceSignature(dossier));
});
it("normalizes empty nullable qualification strings and novelty entries across actual serializers", async () => {
  const { ask, dossier } = await pair(true);
  expect(ask.legalName).toBe(""); expect(dossier.legalName).toBeNull();
  expect(ask.capabilities[0].novelty).toEqual(["", "Bounded interface"]);
  expect(dossier.capabilities[0].novelty).toEqual(["Bounded interface"]);
  expect(discoveryEvidenceSignature(ask)).toBe(discoveryEvidenceSignature(dossier));
});
it("rejects changes to every admitted evidence and qualification boundary after returning from a profile", async () => {
  const { ask, dossier } = await pair();
  const changes: Record<string, (record: AtlasOrganization) => void> = {
    citationId: record => { record.capabilities[0].citations[0].id = "replacement"; },
    citationText: record => { record.capabilities[0].citations[0].excerpt = "Withdrawn"; },
    citationUrl: record => { record.capabilities[0].citations[0].sourceUrl += "/correction"; },
    citationRemoved: record => { record.capabilities[0].citations = []; },
    confidence: record => { record.sourceConfidence = "needs_review"; },
    capConfidence: record => { record.capabilities[0].sourceConfidence = "needs_review"; },
    maturity: record => { record.capabilities[0].maturity = "Prototype"; },
    availability: record => { record.capabilities[0].commercialAvailability = "Withdrawn"; },
    trl: record => { record.capabilities[0].technologyReadinessLevel = 4; },
    novelty: record => { record.capabilities[0].novelty = ["Different interface"]; },
    country: record => { record.primaryLocation!.countryCode = "CA"; },
    locationRole: record => { record.primaryLocation!.locationRole = "headquarters"; },
    owner: record => { record.capabilities[0].organizationId = "other-owner"; },
    publicationRemoval: record => { record.capabilities = []; },
    alignment: record => { record.capabilities[0].missionMatches[0].alignmentSummary = "Corrected alignment"; },
    matchConfidence: record => { record.capabilities[0].demandMatches[0].confidence = "needs_review"; },
    programme: record => { record.programs[0].participationType = "former participant"; }
  };
  for (const [name, change] of Object.entries(changes)) {
    const corrected = structuredClone(dossier); change(corrected);
    expect(discoveryEvidenceSignature(ask), name).not.toBe(discoveryEvidenceSignature(corrected));
  }
});
