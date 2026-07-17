import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const migrationDirectory = path.resolve("supabase/migrations");
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

    create function public.rls_auto_enable() returns boolean
    language sql security definer as $$ select true $$;
    grant execute on function public.rls_auto_enable() to public, anon, authenticated, service_role;

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
      owner_id text
    );
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon, authenticated, service_role;
    grant select, insert, update, delete on storage.objects to anon, authenticated, service_role;
    grant select, insert, update, delete on storage.buckets to service_role;
  `);
  const migrationFiles = (await readdir(migrationDirectory))
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();
  const applyMigration = async (fileName: string) => {
    const migration = (await readFile(path.join(migrationDirectory, fileName), "utf8")).replace(
      "create extension if not exists pgcrypto;",
      "-- pgcrypto is provided by hosted Supabase; PGlite uses the bootstrap UUID function above."
    );
    await db.exec(migration);
  };
  const foundationMigrations = migrationFiles.filter((fileName) => !fileName.includes("promote_") && !fileName.includes("promotion_audit"));
  const reviewedDataMigrations = migrationFiles.filter((fileName) => !foundationMigrations.includes(fileName));
  for (const fileName of foundationMigrations) {
    await applyMigration(fileName);
  }
  await db.exec(await readFile(seedPath, "utf8"));
  for (const fileName of reviewedDataMigrations) {
    await applyMigration(fileName);
  }
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
      organizations: 18,
      capabilities: 18,
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

  it("keeps the editable profile on one organization row", async () => {
    const result = await db.query<{
      entity_kind: string;
      profile_data_type: string;
      legacy_profile_table: string | null;
    }>(`
      select
        organization_record.entity_kind,
        jsonb_typeof(organization_record.profile_data) as profile_data_type,
        to_regclass('public.organization_company_profiles')::text as legacy_profile_table
      from public.organizations organization_record
      where organization_record.slug = 'kraken-robotics'
    `);
    expect(result.rows[0]).toEqual({
      entity_kind: "company",
      profile_data_type: "object",
      legacy_profile_table: null
    });
  });

  it("assembles one RLS-preserving dossier row for pages and exports", async () => {
    const result = await db.query<{
      capabilities: number;
      locations: number;
      citations: number;
    }>(`
      select
        jsonb_array_length(capabilities)::int as capabilities,
        jsonb_array_length(locations)::int as locations,
        jsonb_array_length(citations)::int as citations
      from public.organization_dossiers
      where slug = 'kraken-robotics'
    `);
    expect(result.rows[0]).toEqual({ capabilities: 1, locations: 1, citations: 4 });

    const security = await db.query<{ reloptions: string[] | null }>(`
      select relation.reloptions
      from pg_class relation
      join pg_namespace namespace on namespace.oid = relation.relnamespace
      where namespace.nspname = 'public'
        and relation.relname = 'organization_dossiers'
    `);
    expect(security.rows[0]?.reloptions).toContain("security_invoker=true");
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

  it("restricts editorial RLS policies to the exact administrator identity", async () => {
    const result = await db.query<{ definition: string }>(`
      select pg_get_functiondef(function_record.oid) as definition
      from pg_proc function_record
      join pg_namespace namespace on namespace.oid = function_record.pronamespace
      where namespace.nspname = 'private'
        and function_record.proname = 'is_atlas_staff'
    `);
    const definition = result.rows[0]?.definition ?? "";
    expect(definition).toContain("b443c433-2a78-4ca7-8a19-a8f40b140049");
    expect(definition).toContain("m.andrew.davies@gmail.com");
    expect(definition).toContain("app_metadata");
  });

  it("keeps submitted searches private and connects semantic events without public grants", async () => {
    const result = await db.query<{
      search_rls: boolean;
      anon_search_access: boolean;
      authenticated_search_access: boolean;
      session_column: string | null;
      search_column: string | null;
    }>(`
      select
        (
          select relation.relrowsecurity
          from pg_class relation
          join pg_namespace namespace on namespace.oid = relation.relnamespace
          where namespace.nspname = 'public' and relation.relname = 'pilot_searches'
        ) as search_rls,
        has_table_privilege('anon', 'public.pilot_searches', 'select') as anon_search_access,
        has_table_privilege('authenticated', 'public.pilot_searches', 'select') as authenticated_search_access,
        (
          select data_type
          from information_schema.columns
          where table_schema = 'public' and table_name = 'pilot_events' and column_name = 'session_id'
        ) as session_column,
        (
          select data_type
          from information_schema.columns
          where table_schema = 'public' and table_name = 'pilot_events' and column_name = 'search_id'
        ) as search_column
    `);

    expect(result.rows[0]).toEqual({
      search_rls: true,
      anon_search_access: false,
      authenticated_search_access: false,
      session_column: "uuid",
      search_column: "uuid"
    });
  });

  it("prevents public bucket listing and direct auto-RLS helper execution", async () => {
    const result = await db.query<{
      broad_public_media_policies: number;
      anon_can_execute_rls_helper: boolean;
      authenticated_can_execute_rls_helper: boolean;
    }>(`
      select
        (
          select count(*)::int
          from pg_policies
          where schemaname = 'storage'
            and tablename = 'objects'
            and policyname = 'public atlas media is readable'
        ) as broad_public_media_policies,
        has_function_privilege('anon', 'public.rls_auto_enable()', 'execute') as anon_can_execute_rls_helper,
        has_function_privilege('authenticated', 'public.rls_auto_enable()', 'execute') as authenticated_can_execute_rls_helper
    `);
    expect(result.rows[0]).toEqual({
      broad_public_media_policies: 0,
      anon_can_execute_rls_helper: false,
      authenticated_can_execute_rls_helper: false
    });
  });

  it("allows anonymous access to published records but not editorial candidates", async () => {
    await db.exec("set role anon");
    const publicResult = await db.query<{ count: number }>("select count(*)::int as count from public.organizations");
    expect(publicResult.rows[0]?.count).toBe(18);
    const dossierResult = await db.query<{ count: number }>("select count(*)::int as count from public.organization_dossiers");
    expect(dossierResult.rows[0]?.count).toBe(18);
    await expect(db.query("select * from public.candidate_changes")).rejects.toThrow();
    await db.exec("reset role");
  });
});
