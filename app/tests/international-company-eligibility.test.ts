import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { organizationBundleV3Schema, typedSourceLeadSchema } from "../src/lib/research/pipeline-schema";
import { researchCandidateContractIssues, researchReviewContract } from "../src/lib/research/deployment-contract";
import { internationalCompanyCandidate } from "./fixtures/international-company-candidate";
import { buildMinimalOrganizationV3Candidate, buildStagingCandidate, dossierFixtureResearchRun } from "./fixtures/organization-dossier-candidates";
import { createAtlasTestDatabase } from "./helpers/atlas-database";

describe("worldwide company eligibility", () => {
  it("accepts global companies with no Canadian nexus or relevance assessment", () => {
    expect(organizationBundleV3Schema.safeParse(buildMinimalOrganizationV3Candidate()).success).toBe(true);
    expect(typedSourceLeadSchema.options[0].shape.location.parse({city:null,provinceTerritory:null,countryCode:null})).toEqual({city:null,provinceTerritory:null,countryCode:null});
    const foreign = internationalCompanyCandidate();
    expect(organizationBundleV3Schema.parse(foreign).organization.primaryLocation).toMatchObject({ countryCode: "US", latitude: 37.6547 });
    expect(foreign.organization.executiveRelevanceSummary).toBeNull();
    foreign.organization.primaryLocation = null;
    expect(organizationBundleV3Schema.safeParse(foreign).success).toBe(true);
  });
  it("retains factual location evidence and rejects invalid or falsely Canadian coordinates", () => {
    const foreign = internationalCompanyCandidate();
    foreign.organization.primaryLocation!.countryCode = "CA";
    expect(organizationBundleV3Schema.safeParse(foreign).success).toBe(false);
    foreign.organization.primaryLocation!.countryCode = "US";
    foreign.organization.primaryLocation!.latitude = 100;
    expect(organizationBundleV3Schema.safeParse(foreign).success).toBe(false);
    const unsupported = internationalCompanyCandidate();
    unsupported.fieldEvidence = unsupported.fieldEvidence.filter(e => e.fieldPath !== "organization.primaryLocation.locationRole");
    expect(organizationBundleV3Schema.safeParse(unsupported).success).toBe(false);
  });
  it("requires compatible Review and map handling without disabling existing Canadian intake", () => {
    const old = { ...researchReviewContract, candidateWorldwideCompanies: undefined };
    const record = (proposed_record: unknown) => ({ candidate_kind: "organization_bundle", schema_version: "organization_bundle_v3", proposed_record });
    expect(researchCandidateContractIssues([record(internationalCompanyCandidate())], old)).toContain("Worldwide company intake requires deployed worldwide Review, publication and Canadian-only map support.");
    expect(researchCandidateContractIssues([record(buildMinimalOrganizationV3Candidate())], old)).toEqual([]);
  });
});

describe("international company database boundary", () => {
  let db: PGlite;
  beforeAll(async () => { db = await createAtlasTestDatabase(); }, 30000);
  afterAll(async () => { await db?.close(); });
  const stage = async (candidate: ReturnType<typeof internationalCompanyCandidate>) => db.query(
    "select staged_count from public.stage_research_candidates_for_review($1::jsonb,$2::jsonb)",
    [JSON.stringify({...dossierFixtureResearchRun, client_run_id: `tnm-${candidate.candidateId}`}), JSON.stringify([buildStagingCandidate(candidate as unknown as ReturnType<typeof buildMinimalOrganizationV3Candidate>)])]
  );
  const accept = async (candidateId: string) => {
    await db.exec("set role authenticated");
    try { await db.query(`select * from public.review_research_run_candidates(
      (select research_run_id from public.candidate_changes where client_candidate_id=$1),
      'b443c433-2a78-4ca7-8a19-a8f40b140049'::uuid,
      array(select id from public.candidate_changes where client_candidate_id=$1))`, [candidateId]); }
    finally { await db.exec("reset role"); }
  };
  it("stages privately and preserves facility role and US geography through isolated human publication", async () => {
    const candidate = internationalCompanyCandidate();
    const beforeMapCount = (await db.query<{count:number|string}>("select public.atlas_canadian_map_organization_count() count")).rows[0].count;
    expect((await stage(candidate)).rows[0]).toMatchObject({ staged_count: 1 });
    const before = await db.query("select status,published_at from public.candidate_changes where client_candidate_id=$1", [candidate.candidateId]);
    expect(before.rows[0]).toMatchObject({ status: "pending", published_at: null });
    expect((await db.query("select id from public.organizations where slug=$1", [candidate.organization.slug])).rows).toHaveLength(0);
    const admin = "b443c433-2a78-4ca7-8a19-a8f40b140049";
    await db.exec(`insert into auth.users(id) values('${admin}') on conflict do nothing;
      create or replace function auth.uid() returns uuid language sql stable as $$select '${admin}'::uuid$$;
      create or replace function auth.jwt() returns jsonb language sql stable as $$select '{"email":"m.andrew.davies@gmail.com","app_metadata":{"role":"admin"}}'::jsonb$$;`);
    await accept(candidate.candidateId);
    expect((await db.query("select id from public.organizations where slug=$1", [candidate.organization.slug])).rows).toHaveLength(0);
    await db.query("select * from public.publish_reviewed_research_candidates(array(select id from public.candidate_changes where client_candidate_id=$1),$2::uuid)", [candidate.candidateId, admin]);
    const locations = await db.query("select l.country_code,l.latitude,l.longitude,ol.location_role from public.organizations o join public.organization_locations ol on ol.organization_id=o.id join public.locations l on l.id=ol.location_id where o.slug=$1", [candidate.organization.slug]);
    expect(locations.rows[0]).toMatchObject({ country_code: "US", latitude: 37.6547, longitude: -122.4077, location_role: "facility" });
    expect((await db.query<{count:number|string}>("select public.atlas_canadian_map_organization_count() count")).rows[0].count).toBe(beforeMapCount);
    const profile = await db.query("select profile_data from public.organizations where slug=$1", [candidate.organization.slug]);
    expect(JSON.stringify(profile.rows[0])).not.toContain("internationalEligibility");
  });
  it("supports an unknown location without fabricating a map point or headquarters", async () => {
    const candidate = internationalCompanyCandidate();
    candidate.candidateId += "-unknown-location";
    candidate.organization.slug += "-unknown-location";
    candidate.capabilities.forEach(capability => { capability.slug += "-unknown-location"; });
    candidate.organization.primaryLocation = null;
    expect((await stage(candidate)).rows[0]).toMatchObject({staged_count:1});
    await accept(candidate.candidateId);
    expect((await db.query("select id from public.organizations where slug=$1", [candidate.organization.slug])).rows).toHaveLength(0);
    await db.query("select * from public.publish_reviewed_research_candidates(array(select id from public.candidate_changes where client_candidate_id=$1),'b443c433-2a78-4ca7-8a19-a8f40b140049'::uuid)", [candidate.candidateId]);
    expect((await db.query("select ol.id from public.organization_locations ol join public.organizations o on o.id=ol.organization_id where o.slug=$1", [candidate.organization.slug])).rows).toHaveLength(0);
  });

  it("increments the independent marker count only for a published Canadian coordinate pair", async () => {
    const before=Number((await db.query<{count:number|string}>("select public.atlas_canadian_map_organization_count() count")).rows[0].count);
    const candidate=buildMinimalOrganizationV3Candidate();
    candidate.candidateId += "-canadian-count";
    candidate.organization.slug += "-canadian-count";
    candidate.capabilities.forEach(capability=>{capability.slug += "-canadian-count";});
    expect((await stage(organizationBundleV3Schema.parse(candidate))).rows[0]).toMatchObject({staged_count:1});
    expect(Number((await db.query<{count:number|string}>("select public.atlas_canadian_map_organization_count() count")).rows[0].count)).toBe(before);
    await accept(candidate.candidateId);
    await db.query("select * from public.publish_reviewed_research_candidates(array(select id from public.candidate_changes where client_candidate_id=$1),'b443c433-2a78-4ca7-8a19-a8f40b140049'::uuid)",[candidate.candidateId]);
    expect(Number((await db.query<{count:number|string}>("select public.atlas_canadian_map_organization_count() count")).rows[0].count)).toBe(before+1);
    await db.exec("set role anon");
    try { expect(Number((await db.query<{count:number|string}>("select public.atlas_canadian_map_organization_count() count")).rows[0].count)).toBe(before+1); }
    finally { await db.exec("reset role"); }
  });

  it("preserves an explicitly evidenced Canadian facility and historical headquarters separately", async () => {
    const candidate = internationalCompanyCandidate();
    candidate.candidateId += "-canadian-facility";
    candidate.organization.slug += "-canadian-facility";
    candidate.capabilities.forEach(capability => { capability.slug += "-canadian-facility"; });
    candidate.organization.primaryLocation = { city: "Dartmouth", provinceTerritory: "Nova Scotia", countryCode: "CA", latitude: 44.67, longitude: -63.56, geographicConfidence: "city_centroid", locationRole: "facility" };
    await stage(candidate); await accept(candidate.candidateId);
    expect((await db.query("select id from public.organizations where slug=$1", [candidate.organization.slug])).rows).toHaveLength(0);
    await db.query("select * from public.publish_reviewed_research_candidates(array(select id from public.candidate_changes where client_candidate_id=$1),'b443c433-2a78-4ca7-8a19-a8f40b140049'::uuid)", [candidate.candidateId]);
    expect((await db.query("select ol.location_role from public.organization_locations ol join public.organizations o on o.id=ol.organization_id where o.slug=$1", [candidate.organization.slug])).rows[0]).toEqual({ location_role: "facility" });
    expect((await db.query("select ol.location_role from public.organization_locations ol join public.organizations o on o.id=ol.organization_id where o.slug like '%-canadian-count'")).rows[0]).toEqual({ location_role: "headquarters" });
  });
  it("rejects unproven foreign roles at runtime and publication without partial canonical writes", async () => {
    const candidate = internationalCompanyCandidate();
    candidate.candidateId += "-missing-role"; candidate.organization.slug += "-missing-role";
    candidate.capabilities.forEach(capability => { capability.slug += "-missing-role"; });
    delete candidate.organization.primaryLocation!.locationRole;
    expect(organizationBundleV3Schema.safeParse(candidate).success).toBe(false);
    await stage(candidate); await accept(candidate.candidateId);
    await expect(db.query("select * from public.publish_reviewed_research_candidates(array(select id from public.candidate_changes where client_candidate_id=$1),'b443c433-2a78-4ca7-8a19-a8f40b140049'::uuid)", [candidate.candidateId])).rejects.toThrow(/evidenced location role/);
    expect((await db.query("select id from public.organizations where slug=$1", [candidate.organization.slug])).rows).toHaveLength(0);
  });
  it("denies anonymous and ordinary member acceptance and publication", async () => {
    await db.exec("set role anon");
    try { await expect(db.query("select * from public.publish_reviewed_research_candidates('{}'::uuid[],'b443c433-2a78-4ca7-8a19-a8f40b140049'::uuid)")).rejects.toThrow(); }
    finally { await db.exec("reset role"); }
    await db.exec(`create or replace function auth.jwt() returns jsonb language sql stable as $$select '{"email":"member@example.test","app_metadata":{}}'::jsonb$$; set role authenticated;`);
    try {
      await expect(db.query("select * from public.review_research_run_candidates('00000000-0000-0000-0000-000000000001'::uuid, 'b443c433-2a78-4ca7-8a19-a8f40b140049'::uuid, '{}'::uuid[])")).rejects.toThrow();
      await expect(db.query("select * from public.publish_reviewed_research_candidates('{}'::uuid[],'b443c433-2a78-4ca7-8a19-a8f40b140049'::uuid)")).rejects.toThrow();
    } finally { await db.exec("reset role"); }
  });

});
