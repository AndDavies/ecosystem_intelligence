import { readFile } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const migrationPath = path.resolve("supabase/migrations/20260715170638_public_atlas_foundation.sql");
const seedPath = path.resolve("supabase/seed.sql");

let db: PGlite;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create function gen_random_uuid() returns uuid language sql volatile as $$
      select (
        substr(md5(random()::text || clock_timestamp()::text), 1, 8) || '-' ||
        substr(md5(random()::text || clock_timestamp()::text), 9, 4) || '-4' ||
        substr(md5(random()::text || clock_timestamp()::text), 14, 3) || '-a' ||
        substr(md5(random()::text || clock_timestamp()::text), 18, 3) || '-' ||
        substr(md5(random()::text || clock_timestamp()::text), 21, 12)
      )::uuid
    $$;
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;

    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
    grant usage on schema auth to anon, authenticated, service_role;
    grant execute on function auth.uid(), auth.jwt() to anon, authenticated, service_role;

    create schema storage;
    create table storage.buckets (
      id text primary key,
      name text not null,
      public boolean not null default false,
      file_size_limit bigint,
      allowed_mime_types text[]
    );
    create table storage.objects (
      id uuid primary key,
      bucket_id text not null references storage.buckets(id) on delete cascade,
      owner_id uuid
    );
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon, authenticated, service_role;
    grant select, insert, update, delete on storage.objects to anon, authenticated, service_role;
    grant select, insert, update, delete on storage.buckets to service_role;
  `);
  const migration = (await readFile(migrationPath, "utf8")).replace(
    "create extension if not exists pgcrypto;",
    "-- pgcrypto is provided by hosted Supabase; PGlite uses the bootstrap UUID function above."
  );
  await db.exec(migration);
  await db.exec(await readFile(seedPath, "utf8"));
}, 30_000);

afterAll(async () => {
  await db?.close();
});

describe("public atlas database foundation", () => {
  it("applies the complete migration and validated seed", async () => {
    const result = await db.query<{
      organizations: number;
      capabilities: number;
      demand_requirements: number;
      demand_matches: number;
    }>(`
      select
        (select count(*)::int from public.organizations) as organizations,
        (select count(*)::int from public.capabilities) as capabilities,
        (select count(*)::int from public.demand_requirements) as demand_requirements,
        (select count(*)::int from public.capability_demand_matches) as demand_matches
    `);
    expect(result.rows[0]).toEqual({
      organizations: 6,
      capabilities: 6,
      demand_requirements: 5,
      demand_matches: 0
    });
  });

  it("contains no scaffold names, example domains, or placeholder YTD values", async () => {
    const result = await db.query<{ synthetic_count: number }>(`
      select count(*)::int as synthetic_count
      from public.organizations
      where lower(name) like '%scaffold%'
         or coalesce(website_url, '') like '%example.%'
         or description ~* '\\mYTD\\M'
    `);
    expect(result.rows[0]?.synthetic_count).toBe(0);
  });

  it("publishes only organizations with public canonical evidence", async () => {
    const result = await db.query<{ unsupported: number }>(`
      select count(*)::int as unsupported
      from public.organizations organization_record
      where organization_record.publication_status = 'published'
        and not exists (
          select 1
          from public.field_citations citation
          join public.evidence_snippets evidence on evidence.id = citation.evidence_snippet_id
          join public.sources source_record on source_record.id = evidence.source_id
          where citation.entity_type = 'organization'
            and citation.entity_id = organization_record.id
            and evidence.visibility = 'public'
            and evidence.public_approved
            and source_record.visibility = 'public'
            and source_record.public_approved
            and source_record.canonical_url ~ '^https://'
        )
    `);
    expect(result.rows[0]?.unsupported).toBe(0);
  });

  it("enables RLS on every exposed public table", async () => {
    const result = await db.query<{ unprotected: number }>(`
      select count(*)::int as unprotected
      from pg_class relation
      join pg_namespace namespace on namespace.oid = relation.relnamespace
      where namespace.nspname = 'public'
        and relation.relkind = 'r'
        and not relation.relrowsecurity
    `);
    expect(result.rows[0]?.unprotected).toBe(0);
  });

  it("allows anonymous access to published records but not editorial candidates", async () => {
    await db.exec("set role anon");
    const publicResult = await db.query<{ count: number }>("select count(*)::int as count from public.organizations");
    expect(publicResult.rows[0]?.count).toBe(6);
    await expect(db.query("select * from public.candidate_changes")).rejects.toThrow();
    await db.exec("reset role");
  });
});
