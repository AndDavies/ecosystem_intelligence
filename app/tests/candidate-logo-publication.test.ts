import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { createAtlasTestDatabase } from "./helpers/atlas-database";
import { buildMinimalOrganizationV3Candidate, buildMinimalOrganizationRefreshV2Candidate, buildStagingCandidate, dossierFixtureResearchRun } from "./fixtures/organization-dossier-candidates";
import { organizationBundleV3Schema, organizationRefreshBundleV2Schema } from "@/lib/research/pipeline-schema";
import { organizationLogoIdentity } from "@/lib/research/logo-recovery";
import { preparedCandidateLogo, prepareCandidateLogosForPublication } from "@/lib/research/candidate-logo-storage";
import { researchCandidateContractIssues, researchReviewContract } from "@/lib/research/deployment-contract";

import { normalizeOfficialLogo } from "@/lib/research/normalize-logo";

const reviewer = "b443c433-2a78-4ca7-8a19-a8f40b140049";
const logo = {
  status: "review_required" as const, confidence: "medium" as const,
  sourcePageUrl: "https://fixtures.truenorthmap.ca/brand", sourceAssetUrl: "https://fixtures.truenorthmap.ca/logo.png",
  sourceChecksum: "a".repeat(64), normalizedChecksum: "b".repeat(64), selectionMethod: "official_header",
  storagePath: `candidate-logos/${"b".repeat(64)}.webp`, packetPath: "research/ingestion/local/candidate-logos/run/logo.source.json",
  note: "Official identity mark included in the normal dossier review."
};

describe("candidate logo publication", () => {
  let db: Awaited<ReturnType<typeof createAtlasTestDatabase>>;
  beforeAll(async () => {
    db = await createAtlasTestDatabase();
    await db.exec(`
      insert into auth.users (id) values ('${reviewer}') on conflict do nothing;
      create or replace function auth.uid() returns uuid language sql stable as $$ select '${reviewer}'::uuid $$;
      create or replace function auth.jwt() returns jsonb language sql stable as $$ select '{"email":"m.andrew.davies@gmail.com","app_metadata":{"role":"admin"}}'::jsonb $$;
    `);
  }, 60_000);
  beforeEach(async () => { await db.exec("begin"); });
  afterEach(async () => { await db.exec("rollback"); });
  afterAll(async () => { await db.close(); });

  async function stage(candidate: Parameters<typeof buildStagingCandidate>[0]) {
    await db.query("select * from public.stage_research_candidates_for_review($1::jsonb,$2::jsonb)", [JSON.stringify(dossierFixtureResearchRun), JSON.stringify([buildStagingCandidate(candidate)])]);
  }
  async function accept(candidateId: string) {
    await db.query("update public.candidate_changes set status='approved' where client_candidate_id=$1", [candidateId]);
  }
  async function publish(candidateId: string) {
    return db.query<{ entity_id: string }>("select entity_id from public.publish_reviewed_research_candidates(array(select id from public.candidate_changes where client_candidate_id=$1),$2::uuid)", [candidateId, reviewer]);
  }
  async function upload() {
    await db.query("insert into storage.objects(id,bucket_id,name) values(gen_random_uuid(),'atlas-public-media',$1)", [logo.storagePath]);
  }
  async function refresh(organizationId: string) {
    const { rows } = await db.query<{ record: Record<string, unknown>; baseline: string }>("select to_jsonb(o) record, to_jsonb(o)->>'updated_at' baseline from public.organizations o where id=$1", [organizationId]);
    const candidate = buildMinimalOrganizationRefreshV2Candidate({ organizationId, baselineUpdatedAt: rows[0].baseline });
    Object.assign(candidate.beforeRecord.organization, rows[0].record, { updated_at: rows[0].baseline });
    return candidate;
  }

  it("keeps medium-confidence media private through acceptance and publishes it with a new organization", async () => {
    const candidate = Object.assign(buildMinimalOrganizationV3Candidate(), { candidateLogo: logo });
    expect(organizationBundleV3Schema.safeParse(candidate).success).toBe(true);
    await stage(candidate);
    await accept(candidate.candidateId);
    expect((await db.query("select id from public.media_assets where storage_path=$1", [logo.storagePath])).rows).toHaveLength(0);
    await upload();
    const result = await publish(candidate.candidateId);
    const { rows } = await db.query<{ permission_basis: string }>("select organization_id,approval_status,publication_status,permission_basis from public.media_assets where storage_path=$1", [logo.storagePath]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ organization_id: result.rows[0].entity_id, approval_status: "approved", publication_status: "published" });
    expect(rows[0].permission_basis).toContain("Confidence: medium");
  });

  it("publishes a missing logo through the same refresh publication and retains its exact identity", async () => {
    const original = buildMinimalOrganizationV3Candidate();
    await stage(original); await accept(original.candidateId);
    const organizationId = (await publish(original.candidateId)).rows[0].entity_id;
    const candidate = Object.assign(await refresh(organizationId), { candidateLogo: logo });
    organizationRefreshBundleV2Schema.parse(candidate);
    expect(organizationLogoIdentity(organizationRefreshBundleV2Schema.parse(candidate))?.websiteUrl).toBe(original.organization.websiteUrl);
    await stage(candidate); await accept(candidate.candidateId); await upload(); await publish(candidate.candidateId);
    expect((await db.query("select organization_id from public.media_assets where storage_path=$1", [logo.storagePath])).rows).toEqual([{ organization_id: organizationId }]);
  });

  it("preserves a logo already published before the refresh", async () => {
    const original = Object.assign(buildMinimalOrganizationV3Candidate(), { candidateLogo: logo });
    await stage(original); await accept(original.candidateId); await upload();
    const organizationId = (await publish(original.candidateId)).rows[0].entity_id;
    const candidate = Object.assign(await refresh(organizationId), { candidateLogo: { ...logo, normalizedChecksum: "c".repeat(64), storagePath: `candidate-logos/${"c".repeat(64)}.webp` } });
    await stage(candidate); await accept(candidate.candidateId); await publish(candidate.candidateId);
    expect((await db.query("select storage_path from public.media_assets where organization_id=$1 and publication_status='published'", [organizationId])).rows).toEqual([{ storage_path: logo.storagePath }]);
  });

  it("rolls back the dossier when a prepared logo is unavailable", async () => {
    const candidate = Object.assign(buildMinimalOrganizationV3Candidate(), { candidateLogo: logo });
    await stage(candidate); await accept(candidate.candidateId);
    await db.exec("savepoint before_publication");
    await expect(publish(candidate.candidateId)).rejects.toThrow(/logo bytes/i);
    await db.exec("rollback to savepoint before_publication");
    expect((await db.query("select status from public.candidate_changes where client_candidate_id=$1", [candidate.candidateId])).rows).toEqual([{status: "approved"}]);
    expect((await db.query("select id from public.organizations where slug='dossier-v3-fixture'")).rows).toHaveLength(0);
  });

  it("allows not-found dispositions and keeps private image access limited to the administrator", async () => {
    const candidate = Object.assign(buildMinimalOrganizationV3Candidate(), { candidateLogo: { status: "not_found", checkedAt: new Date().toISOString(), note: "No official mark found." } });
    await stage(candidate); await accept(candidate.candidateId); await publish(candidate.candidateId);
    await db.query("insert into storage.objects(id,bucket_id,name) values(gen_random_uuid(),'atlas-private-intake',$1)", [logo.storagePath]);
    await db.exec("set local role anon");
    expect((await db.query("select id from storage.objects where bucket_id='atlas-private-intake'")).rows).toHaveLength(0);
    await db.exec(`reset role;
      create or replace function auth.uid() returns uuid language sql stable as $$ select '10000000-0000-4000-8000-000000000099'::uuid $$;
      create or replace function auth.jwt() returns jsonb language sql stable as $$ select '{"email":"member@example.ca","app_metadata":{"role":"member"}}'::jsonb $$;
      set local role authenticated;`);
    expect((await db.query("select id from storage.objects where bucket_id='atlas-private-intake'")).rows).toHaveLength(0);
    await db.exec(`reset role;
      create or replace function auth.uid() returns uuid language sql stable as $$ select '${reviewer}'::uuid $$;
      create or replace function auth.jwt() returns jsonb language sql stable as $$ select '{"email":"m.andrew.davies@gmail.com","app_metadata":{"role":"admin"}}'::jsonb $$;
      set local role authenticated;`);
    expect((await db.query("select id from storage.objects where bucket_id='atlas-private-intake'")).rows).toHaveLength(1);

  });
});

describe("prepared image transfer", () => {
  it("keeps white lettering readable without changing a dark mark", async () => {
    const canvas = {width:100, height:40, channels:4 as const, background: {r:0,g:0,b:0,alpha:0}};
    const mark = (color: string) => sharp({create:canvas}).composite([{input: Buffer.from(`<svg width="50" height="20"><rect width="50" height="20" fill="${color}"/></svg>`)}]).png().toBuffer();
    const white = await normalizeOfficialLogo(await mark("white"));
    const dark = await normalizeOfficialLogo(await mark("black"));
    expect(white.darkBackground).toBe(true);
    expect((await sharp(white.bytes).metadata()).hasAlpha).toBe(false);
    expect(dark.darkBackground).toBe(false);
    expect((await sharp(dark.bytes).metadata()).hasAlpha).toBe(true);
  });

  it("requires the deployed logo feature and a checksum-bound path", () => {
    const candidate = { candidate_kind: "organization_refresh_bundle", schema_version: "organization_refresh_bundle_v2", proposed_record: { candidateLogo: logo } };
    expect(researchCandidateContractIssues([candidate], { ...researchReviewContract, candidateLogoPublication: undefined })).toContain("Candidate logos require deployed Review and Publish logo support.");
    expect(researchCandidateContractIssues([candidate])).toEqual([]);
    expect(() => preparedCandidateLogo({ candidateLogo: { ...logo, storagePath: `candidate-logos/${"c".repeat(64)}.webp` } })).toThrow(/checksum/);
  });

  it("transfers the exact reviewed private bytes once and rejects changed bytes before a public upload", async () => {
    const bytes = await sharp({ create: { width: 100, height: 40, channels: 4, background: "red" } }).webp().toBuffer();
    const checksum = createHash("sha256").update(bytes).digest("hex");
    const record = { candidateLogo: { ...logo, normalizedChecksum: checksum, storagePath: `candidate-logos/${checksum}.webp` } };
    const download = vi.fn().mockResolvedValue({ data: new Blob([new Uint8Array(bytes)]), error: null });
    const upload = vi.fn().mockResolvedValue({ error: null });
    const client = { storage: { from: vi.fn().mockReturnValue({ download, upload }) } } as unknown as SupabaseClient;
    await prepareCandidateLogosForPublication(client, [{ proposed_record: record }, { proposed_record: record }]);
    expect(download).toHaveBeenCalledTimes(1); expect(upload).toHaveBeenCalledTimes(1);
    expect(upload.mock.calls[0][1]).toEqual(bytes);
    upload.mockClear(); download.mockResolvedValue({ data: new Blob(["changed"]), error: null });
    await expect(prepareCandidateLogosForPublication(client, [{ proposed_record: record }])).rejects.toThrow(/differ/);
    expect(upload).not.toHaveBeenCalled();
  });
});
