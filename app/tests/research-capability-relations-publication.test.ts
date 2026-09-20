import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createAtlasTestDatabase } from "./helpers/atlas-database";
import {
  buildMinimalOrganizationRefreshV2Candidate,
  buildMinimalOrganizationV3Candidate,
  buildStagingCandidate,
  dossierFixtureResearchRun
} from "./fixtures/organization-dossier-candidates";

const reviewerId = "b443c433-2a78-4ca7-8a19-a8f40b140049";
let db: PGlite;
let organizationId: string;
let capabilityId: string;
let missionId: string;
let missionSlug: string;
const originalCapability = buildMinimalOrganizationV3Candidate().capabilities[0];
const { slug: _slug, ...originalSnapshot } = originalCapability;
void _slug;

async function publish(candidateId: string) {
  return db.query(`select * from public.publish_reviewed_research_candidates(
    array(select id from public.candidate_changes where client_candidate_id = $1), $2::uuid
  )`, [candidateId, reviewerId]);
}

async function stageAndAccept(candidate: Record<string, unknown> & { client_candidate_id: string }, runId: string) {
  await db.query("select * from public.stage_research_candidates_for_review($1::jsonb, $2::jsonb)", [
    JSON.stringify({ ...dossierFixtureResearchRun, client_run_id: runId }), JSON.stringify([candidate])
  ]);
  await db.query(`select * from public.review_research_run_candidates(
    (select research_run_id from public.candidate_changes where client_candidate_id = $1),
    $2::uuid, array(select id from public.candidate_changes where client_candidate_id = $1)
  )`, [candidate.client_candidate_id, reviewerId]);
}

beforeAll(async () => {
  db = await createAtlasTestDatabase();
  await db.exec(`
    insert into auth.users (id) values ('${reviewerId}') on conflict (id) do nothing;
    create or replace function auth.uid() returns uuid language sql stable as $$ select '${reviewerId}'::uuid $$;
    create or replace function auth.jwt() returns jsonb language sql stable as $$
      select '{"email":"m.andrew.davies@gmail.com","app_metadata":{"role":"admin"}}'::jsonb
    $$;
  `);
  const bundle = buildMinimalOrganizationV3Candidate();
  await stageAndAccept(buildStagingCandidate(bundle), "tnm-relations-initial");
  await publish(bundle.candidateId);
  const records = await db.query<{ organization_id: string; capability_id: string }>(`
    select organization_id::text, id::text as capability_id from public.capabilities where slug = $1
  `, [originalCapability.slug]);
  organizationId = records.rows[0].organization_id;
  capabilityId = records.rows[0].capability_id;
  const missions = await db.query<{ id: string; slug: string }>(`
    select id::text, slug from public.mission_areas where publication_status = 'published' order by slug limit 1
  `);
  missionId = missions.rows[0].id;
  missionSlug = missions.rows[0].slug;
  await db.query(`insert into public.capability_domains (capability_id, technical_domain_id, publication_status)
    select $1::uuid, id, 'published' from public.technical_domains where slug = 'mission-software-and-data'
  `, [capabilityId]);
  await db.query(`insert into public.capability_mission_matches (
    capability_id, mission_area_id, alignment_summary, match_type, confidence, review_status, publication_status
  ) values ($1::uuid, $2::uuid, 'The previous reviewed mission alignment.', 'derived', 'moderate', 'approved', 'published')`,
  [capabilityId, missionId]);
  await db.query(`insert into public.field_citations (entity_type, entity_id, field_name, evidence_snippet_id)
    select 'capability_mission_match', match.id, 'alignment_summary', citation.evidence_snippet_id
    from public.capability_mission_matches match
    cross join lateral (select evidence_snippet_id from public.field_citations where entity_id = $1::uuid limit 1) citation
    where match.capability_id = $1::uuid and match.mission_area_id = $2::uuid
  `, [capabilityId, missionId]);
}, 120_000);

afterAll(async () => { await db?.close(); });

async function stageRefresh(id: string, domains: string[]) {
  const parent = await db.query<{ updated_at: string }>("select updated_at::text from public.organizations where id = $1::uuid", [organizationId]);
  const base = buildMinimalOrganizationRefreshV2Candidate({ organizationId, baselineUpdatedAt: parent.rows[0].updated_at, candidateId: id });
  const before = {
    ...originalSnapshot,
    technicalDomainSlugs: ["sensing-and-isr", "mission-software-and-data"],
    missionMatches: [{ missionAreaSlug: missionSlug, alignmentSummary: "The previous reviewed mission alignment.", matchClass: "derived", confidence: "moderate" }]
  };
  const after = { ...before, technicalDomainSlugs: domains, missionMatches: [] };
  const evidenceId = base.fieldEvidence[0].id;
  const candidate = {
    ...base,
    beforeRecord: { ...base.beforeRecord, capabilities: [{ id: capabilityId, ...before }] },
    operations: [{
      operationId: "update-relations", operation: "update_child", entityType: "capability",
      parentId: organizationId, targetId: capabilityId, before, after, evidenceIds: [evidenceId],
      leafEvidence: ["name", "summary", "capabilityType", "features.0", "applications.0", "technicalTags.0",
        ...domains.map((_, index) => `technicalDomainSlugs.${index}`)
      ].map((leaf) => ({ fieldPath: `after.${leaf}`, evidenceIds: [evidenceId] })),
      reviewerExplanation: "Replace the complete reviewed relation set, preserving archived relationship history."
    }]
  };
  await stageAndAccept({ ...buildStagingCandidate(base), proposed_record: candidate, before_record: candidate.beforeRecord }, `tnm-${id}`);
}

async function relations() {
  const result = await db.query<{ domains: unknown[]; missions: unknown[]; citation_count: number }>(`
    select
      (select jsonb_agg(jsonb_build_object('slug', domain.slug, 'primary', link.is_primary, 'status', link.publication_status) order by domain.slug)
        from public.capability_domains link join public.technical_domains domain on domain.id = link.technical_domain_id
        where link.capability_id = $1::uuid) as domains,
      (select jsonb_agg(jsonb_build_object('id', match.id, 'status', match.publication_status) order by match.id)
        from public.capability_mission_matches match where match.capability_id = $1::uuid) as missions,
      (select count(*)::integer from public.field_citations citation join public.capability_mission_matches match on match.id = citation.entity_id
        where match.capability_id = $1::uuid) as citation_count
  `, [capabilityId]);
  return result.rows[0];
}

describe("reviewed capability relation replacement", () => {
  it("archives omitted relations, changes the primary domain, and retains their evidence and identities", async () => {
    await db.exec("begin");
    try {
      const previous = await relations();
      const unrelated = await db.query("select * from public.capability_domains where capability_id <> $1::uuid order by capability_id, technical_domain_id", [capabilityId]);
      await stageRefresh("candidate-relations-replace", ["advanced-manufacturing-and-integration", "sensing-and-isr"]);
      await db.exec("set local role authenticated");
      await publish("candidate-relations-replace");
      await db.exec("reset role");
      const current = await relations();
      expect(current.domains).toEqual([
        { slug: "advanced-manufacturing-and-integration", primary: true, status: "published" },
        { slug: "mission-software-and-data", primary: false, status: "archived" },
        { slug: "sensing-and-isr", primary: false, status: "published" }
      ]);
      expect(current.missions).toEqual(previous.missions.map((match) => ({ ...(match as object), status: "archived" })));
      expect(current.citation_count).toBe(1);
      expect((await db.query("select * from public.capability_domains where capability_id <> $1::uuid order by capability_id, technical_domain_id", [capabilityId])).rows).toEqual(unrelated.rows);
      expect((await db.query("select status from public.candidate_changes where client_candidate_id = 'candidate-relations-replace'")).rows).toEqual([{ status: "published" }]);
    } finally { await db.exec("rollback"); }
  });

  it("updates the primary flag on a retained domain and restores an archived link", async () => {
    await db.exec("begin");
    try {
      await db.query(`insert into public.capability_domains (capability_id, technical_domain_id, publication_status)
        select $1::uuid, id, 'archived' from public.technical_domains where slug = 'advanced-manufacturing-and-integration'`, [capabilityId]);
      await stageRefresh("candidate-relations-primary", ["mission-software-and-data", "advanced-manufacturing-and-integration"]);
      await publish("candidate-relations-primary");
      expect((await relations()).domains).toEqual([
        { slug: "advanced-manufacturing-and-integration", primary: false, status: "published" },
        { slug: "mission-software-and-data", primary: true, status: "published" },
        { slug: "sensing-and-isr", primary: false, status: "archived" }
      ]);
    } finally { await db.exec("rollback"); }
  });

  it("rolls back relation removals when later publication fails and still rejects stale children", async () => {
    await stageRefresh("candidate-relations-failure", ["advanced-manufacturing-and-integration"]);
    const previous = await relations();
    await db.exec(`create function public.test_reject_refresh_marker() returns trigger language plpgsql as $$
      begin
        if new.client_candidate_id = 'candidate-relations-failure' and new.status = 'published' then
          raise exception 'Simulated final publication failure';
        end if;
        return new;
      end;
    $$;
    create trigger test_reject_refresh_marker before update on public.candidate_changes for each row execute function public.test_reject_refresh_marker();`);
    await expect(publish("candidate-relations-failure")).rejects.toThrow(/Simulated final publication failure/);
    expect(await relations()).toEqual(previous);
    expect((await db.query("select status from public.candidate_changes where client_candidate_id = 'candidate-relations-failure'")).rows).toEqual([{ status: "approved" }]);
    await db.exec("drop trigger test_reject_refresh_marker on public.candidate_changes; drop function public.test_reject_refresh_marker();");
    await db.query("update public.capabilities set summary = 'An intervening reviewed edit.' where id = $1::uuid", [capabilityId]);
    await expect(publish("candidate-relations-failure")).rejects.toThrow(/stale child baseline/i);
    expect(await relations()).toEqual(previous);
  });
});
