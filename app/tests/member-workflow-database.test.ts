import type { PGlite } from "@electric-sql/pglite";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createAtlasTestDatabase } from "./helpers/atlas-database";

let db: PGlite;
const member = "eeeeeeee-1111-4111-8111-111111111111";
const other = "eeeeeeee-2222-4222-8222-222222222222";
const owner = "b443c433-2a78-4ca7-8a19-a8f40b140049";
const organization = "10000000-0000-4000-8000-000000000001";

beforeAll(async () => { db = await createAtlasTestDatabase(); }, 30_000);
afterAll(async () => { await db?.close(); });
beforeEach(async () => {
  await db.exec(`begin;
    insert into auth.users(id) values ('${member}'), ('${other}'), ('${owner}') on conflict do nothing;
    create or replace function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    create or replace function auth.jwt() returns jsonb language sql stable as $$
      select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
    $$;
    set local "request.jwt.claim.sub" = '${member}';
    set local "request.jwt.claims" = '{}';
    set local role authenticated;
  `);
});
afterEach(async () => { await db.exec("rollback; reset role;"); });

async function denied(query: string, parameters: unknown[] = [], pattern = /policy|permission|limit|constraint/i) {
  await db.exec("savepoint expected_denial");
  try { await expect(db.query(query, parameters)).rejects.toThrow(pattern); }
  finally { await db.exec("rollback to savepoint expected_denial; release savepoint expected_denial"); }
}

const insertSubmission = `insert into public.submissions(owner_id, submission_type, submitted_payload, status, created_at)
  values ($1::uuid, 'new_organization', '{"name":"Member submission"}', $2, $3::timestamptz) returning id, status, created_at::text`;
const insertConnection = `insert into public.connection_requests(requester_id, organization_id, intent, message, requester_name, requester_email, created_at)
  values ($1::uuid,$2::uuid,'partnership','A legitimate request to discuss a potential partnership.','Test Member','member@example.ca',$3::timestamptz) returning id, created_at::text`;

describe("member Data API workflow boundaries", () => {
  it.each(["approved", "in_review", "rejected", "withdrawn"])("rejects a member-created %s submission", async (status) => {
    await denied(insertSubmission, [member, status, "2000-01-01"]);
  });

  it("permits pending creation but rejects foreign-owner and anonymous creation", async () => {
    const pending = await db.query<{status: string}>(insertSubmission, [member, "pending", "2000-01-01"]);
    expect(pending.rows[0].status).toBe("pending");
    await denied(insertSubmission, [other, "pending", "2000-01-01"]);
    await db.exec("set local role anon");
    await denied(insertSubmission, [member, "pending", "2000-01-01"]);
  });

  it.each(["2000-01-01", "2099-01-01"])("uses server time for %s inserts and preserves it on edits and withdrawal", async (suppliedTime) => {
    const inserted = await db.query<{id: string; created_at: string}>(insertSubmission, [member, "pending", suppliedTime]);
    const row = inserted.rows[0];
    expect(Math.abs(Date.now() - Date.parse(row.created_at))).toBeLessThan(10_000);
    const updated = await db.query<{created_at: string; status: string}>(
      "update public.submissions set created_at='1900-01-01', status='withdrawn' where id=$1::uuid returning created_at::text,status", [row.id]);
    expect(updated.rows[0]).toEqual({created_at: row.created_at, status: "withdrawn"});
  });

  it("counts every backdated and withdrawn submission against the rolling limit", async () => {
    for (let index=0; index<10; index++) await db.query(insertSubmission,[member,"pending","2000-01-01"]);
    await db.exec("update public.submissions set status='withdrawn', created_at='1900-01-01'");
    await denied(insertSubmission,[member,"pending","2000-01-01"],/daily submission limit/i);
  });

  it("counts backdated connections and enforces both same-organization and daily limits", async () => {
    const row = await db.query<{created_at: string}>(insertConnection,[member,organization,"2000-01-01"]);
    expect(Math.abs(Date.now() - Date.parse(row.rows[0].created_at))).toBeLessThan(10_000);
    await denied(insertConnection,[member,organization,"2000-01-01"],/same organization/i);
    for (let index=2;index<=5;index++) await db.query(insertConnection,[member,`10000000-0000-4000-8000-${String(index).padStart(12,"0")}`,"2000-01-01"]);
    await denied(insertConnection,[member,"10000000-0000-4000-8000-000000000006","2000-01-01"],/daily connection limit/i);
  });

  it("retains the audited owner review transition without publishing anything", async () => {
    const submission = await db.query<{id:string}>(insertSubmission,[member,"pending","2000-01-01"]);
    const before = await db.query("select id,publication_status from public.organizations order by id");
    await db.exec(`set local "request.jwt.claim.sub"='${owner}'; set local "request.jwt.claims"='{"email":"m.andrew.davies@gmail.com","app_metadata":{"role":"admin"}}'`);
    const reviewed = await db.query("select public.review_public_submission($1::uuid,'pending','approve','The submitted correction has been checked and needs a separate research candidate.')",[submission.rows[0].id]);
    expect(reviewed.rows[0]).toMatchObject({review_public_submission:"approved"});
    expect((await db.query("select id,publication_status from public.organizations order by id")).rows).toEqual(before.rows);
    expect((await db.query("select count(*)::integer as count from public.review_decisions where submission_id=$1::uuid",[submission.rows[0].id])).rows[0]).toEqual({count:1});
  });

  it("enforces the existing Working List text bounds for direct writes", async () => {
    await denied("insert into public.saved_collections(owner_id,name) values ($1::uuid,$2)",[member,"x".repeat(101)]);
    const collection=await db.query<{id:string}>("insert into public.saved_collections(owner_id,name,description) values ($1::uuid,'Working List',$2) returning id",[member,"x".repeat(500)]);
    await denied("insert into public.saved_collection_items(collection_id,entity_type,entity_id,note) values ($1::uuid,'organization',$2::uuid,$3)",[collection.rows[0].id,organization,"x".repeat(501)]);
    await db.query("insert into public.saved_collection_items(collection_id,entity_type,entity_id,note) values ($1::uuid,'organization',$2::uuid,$3)",[collection.rows[0].id,organization,"x".repeat(500)]);
  });
});
