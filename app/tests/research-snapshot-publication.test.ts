import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createAtlasTestDatabase } from "./helpers/atlas-database";
import { buildMinimalOrganizationRefreshV2Candidate, buildMinimalOrganizationV3Candidate, buildStagingCandidate, dossierFixtureResearchRun } from "./fixtures/organization-dossier-candidates";

const reviewerId = "b443c433-2a78-4ca7-8a19-a8f40b140049";
let db: PGlite;
let organizationId: string;
const baseline = buildMinimalOrganizationV3Candidate();

function observation(source: { id: string; url: string }) {
  return {
    id: "reported-quarter", metric: "revenue", subjectName: baseline.organization.name,
    scopeRelation: "organization", reportingScope: "Synthetic consolidated entity; excludes pending acquisition",
    amount: 1200000, amountHigh: null, unit: "currency", currency: "CAD", textValue: null,
    basis: "reported_actual", period: "Second quarter 2026", asOf: "2026-06-30",
    qualification: "Synthetic test value, not a real company's financial result.",
    sourceId: source.id, sourceUrl: source.url, sourceLocator: "Quarterly results, table 1"
  };
}

async function stageAndAccept(candidate: {client_candidate_id: string} & Record<string, unknown>) {
  await db.query("select * from public.stage_research_candidates_for_review($1::jsonb,$2::jsonb)", [
    JSON.stringify({...dossierFixtureResearchRun, client_run_id: `tnm-${candidate.client_candidate_id}`}), JSON.stringify([candidate])
  ]);
  await db.query(`select * from public.review_research_run_candidates(
    (select research_run_id from public.candidate_changes where client_candidate_id=$1), $2::uuid,
    array(select id from public.candidate_changes where client_candidate_id=$1))`, [candidate.client_candidate_id, reviewerId]);
}
async function publish(id: string) {
  return db.query(`select * from public.publish_reviewed_research_candidates(
    array(select id from public.candidate_changes where client_candidate_id=$1),$2::uuid)`, [id, reviewerId]);
}
async function current() {
  return (await db.query<{record: Record<string, unknown>; updated_at: string}>(
    "select row_to_json(o) as record, updated_at::text from public.organizations o where id=$1::uuid", [organizationId])).rows[0];
}
async function refresh(id: string, change: Record<string, unknown> = {}) {
  const saved = await current();
  const base = buildMinimalOrganizationRefreshV2Candidate({organizationId, baselineUpdatedAt: saved.updated_at, candidateId: id});
  const item = {...observation(base.sources[0]), ...change};
  const leaves = Object.entries(item).filter(([,value]) => value !== null).map(([key]) => `after.0.${key}`);
  const candidate = {
    ...base, editorialStandard: "reader_usefulness_v1",
    beforeRecord: {organization: {...saved.record, updated_at: saved.updated_at}},
    operations: [{...base.operations[0], operationId: "set-snapshot", field: "snapshot_observations",
      before: saved.record.snapshot_observations, after: [item],
      leafEvidence: leaves.map(fieldPath => ({fieldPath, evidenceIds: [base.fieldEvidence[0].id]}))}]
  };
  const staging = {...buildStagingCandidate(base), proposed_record: candidate, before_record: candidate.beforeRecord};
  return {candidate, staging, item, saved};
}

beforeAll(async () => {
  db = await createAtlasTestDatabase();
  await db.exec(`insert into auth.users(id) values('${reviewerId}') on conflict do nothing;
    create or replace function auth.uid() returns uuid language sql stable as $$select '${reviewerId}'::uuid$$;
    create or replace function auth.jwt() returns jsonb language sql stable as $$select '{"email":"m.andrew.davies@gmail.com","app_metadata":{"role":"admin"}}'::jsonb$$;`);
  await stageAndAccept(buildStagingCandidate(baseline));
  await publish(baseline.candidateId);
  organizationId = (await db.query<{id:string}>("select id::text from public.organizations where slug=$1", [baseline.organization.slug])).rows[0].id;
}, 120000);
afterAll(async () => {await db?.close();});

describe("snapshot guarded publication", () => {
  it("keeps new observations private until Publish and preserves every value and citation", async () => {
    await db.exec("begin");
    try {
      const item = observation(baseline.sources[0]);
      const candidate = {...baseline, candidateId: "new-snapshot-fixture", editorialStandard: "reader_usefulness_v1",
        organization: {...baseline.organization, slug: "new-snapshot-fixture", snapshotObservations: [item]},
        capabilities: baseline.capabilities.map(capability => ({...capability, slug: "new-snapshot-capability"})),
        fieldEvidence: [...baseline.fieldEvidence, ...Object.entries(item).filter(([,value])=>value!==null).map(([key])=>({
          ...baseline.fieldEvidence[0], id: `snapshot-${key}`, fieldPath: `organization.snapshotObservations.0.${key}`
        }))]};
      await stageAndAccept(buildStagingCandidate(candidate));
      expect((await db.query("select id from public.organizations where slug='new-snapshot-fixture'")).rows).toHaveLength(0);
      await db.exec("set local role authenticated");
      await publish(candidate.candidateId);
      await db.exec("reset role");
      expect((await db.query("select snapshot_observations from public.organization_dossiers where slug='new-snapshot-fixture'")).rows).toEqual([{snapshot_observations: [item]}]);
      const citations = await db.query<{field_name:string}>(`select c.field_name from public.field_citations c join public.organizations o on o.id=c.entity_id
        where o.slug='new-snapshot-fixture' and c.field_name like 'snapshot_observations.%'`);
      expect(citations.rows.map(r=>r.field_name).sort()).toEqual(Object.entries(item).filter(([,v])=>v!==null).map(([key])=>`snapshot_observations.0.${key}`).sort());
    } finally {await db.exec("rollback");}
  });

  it("refreshes exact snapshot leaves without changing the unrelated dossier", async () => {
    await db.exec("begin");
    try {
      const {candidate, staging, item, saved} = await refresh("refresh-snapshot-fixture");
      await stageAndAccept(staging);
      expect((await current()).record.snapshot_observations).toEqual([]);
      await db.exec("set local role authenticated");
      await publish(candidate.candidateId);
      await db.exec("reset role");
      const result = await current();
      expect(result.record.snapshot_observations).toEqual([item]);
      for (const field of ["description","operating_context","profile_data","disclosed_financing_summary"]) expect(result.record[field]).toEqual(saved.record[field]);
      const citations = await db.query<{field_name:string}>("select field_name from public.field_citations where entity_id=$1::uuid and field_name like 'snapshot_observations.%'", [organizationId]);
      expect(citations.rows.map(r=>r.field_name).sort()).toEqual(candidate.operations[0].leafEvidence.map(leaf=>leaf.fieldPath.replace("after.","snapshot_observations.")).sort());
    } finally {await db.exec("rollback");}
  });

  it("rolls back wrong-entity and unmapped-source observations", async () => {
    for (const [change, message] of [[{subjectName:"Different entity"}, /snapshot_observations_valid/], [{sourceUrl:"https://fixtures.truenorthmap.ca/unmapped"}, /Snapshot source must resolve/]] as const) {
      await db.exec("begin");
      try {
        const {candidate, staging} = await refresh("unsafe-snapshot-fixture", change);
        await stageAndAccept(staging);
        await db.exec("savepoint attempt");
        await expect(publish(candidate.candidateId)).rejects.toThrow(message);
        await db.exec("rollback to savepoint attempt");
        expect((await current()).record.snapshot_observations).toEqual([]);
        expect((await db.query("select status from public.candidate_changes where client_candidate_id=$1",[candidate.candidateId])).rows).toEqual([{status:"approved"}]);
      } finally {await db.exec("rollback");}
    }
  });

  it("still rejects an intervening organization edit", async () => {
    await db.exec("begin");
    try {
      const {candidate, staging} = await refresh("stale-snapshot-fixture");
      await stageAndAccept(staging);
      await db.query("update public.organizations set updated_at=updated_at+interval '1 second' where id=$1::uuid",[organizationId]);
      await expect(publish(candidate.candidateId)).rejects.toThrow(/stale|changed/i);
    } finally {await db.exec("rollback");}
  });
});
