import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const migrationDirectory = path.resolve("supabase/migrations");
const foundationFixturePath = path.resolve("tests/fixtures/database-foundation.sql");

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
  await db.exec(await readFile(foundationFixturePath, "utf8"));
  for (const fileName of reviewedDataMigrations) {
    await applyMigration(fileName);
  }
}, 30_000);

afterAll(async () => {
  await db?.close();
});

describe("public atlas database foundation", () => {
  it("applies the complete migration chain against the isolated database fixture", async () => {
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

  it("models public demand issuers separately from demand sources", async () => {
    const result = await db.query<{
      issuers: number;
      nato_links: number;
      source_kind: string;
      commitment_level: string;
    }>(`
      select
        (select count(*)::int from public.demand_issuers) as issuers,
        (
          select count(*)::int
          from public.demand_source_issuers link
          join public.demand_issuers issuer on issuer.id = link.demand_issuer_id
          join public.demand_sources source_record on source_record.id = link.demand_source_id
          where issuer.slug = 'nato'
            and source_record.slug = 'nato-aggregated-demand-signal-2026'
            and link.issuer_role = 'issuer'
        ) as nato_links,
        (
          select source_kind
          from public.demand_sources
          where slug = 'nato-aggregated-demand-signal-2026'
        ) as source_kind,
        (
          select commitment_level
          from public.demand_sources
          where slug = 'nato-aggregated-demand-signal-2026'
        ) as commitment_level
    `);
    expect(result.rows[0]).toEqual({
      issuers: 10,
      nato_links: 1,
      source_kind: "official_problem_statement",
      commitment_level: "directional"
    });
  });

  it("stores reproducible run metadata without changing the publication boundary", async () => {
    const result = await db.query<{
      source_queries: string;
      counters: string;
      validation_results: string;
      schema_version: string;
    }>(`
      select
        (
          select data_type from information_schema.columns
          where table_schema = 'public' and table_name = 'research_runs' and column_name = 'source_queries'
        ) as source_queries,
        (
          select data_type from information_schema.columns
          where table_schema = 'public' and table_name = 'research_runs' and column_name = 'counters'
        ) as counters,
        (
          select data_type from information_schema.columns
          where table_schema = 'public' and table_name = 'research_runs' and column_name = 'validation_results'
        ) as validation_results,
        (
          select data_type from information_schema.columns
          where table_schema = 'public' and table_name = 'candidate_changes' and column_name = 'schema_version'
        ) as schema_version
    `);
    expect(result.rows[0]).toEqual({
      source_queries: "jsonb",
      counters: "jsonb",
      validation_results: "jsonb",
      schema_version: "text"
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

  it("denies structural table privileges to public Data API roles", async () => {
    const result = await db.query<{
      anon_structural_privileges: number;
      authenticated_structural_privileges: number;
    }>(`
      select
        count(*) filter (
          where grantee = 'anon'
            and privilege_type in ('TRUNCATE', 'REFERENCES', 'TRIGGER')
        )::int as anon_structural_privileges,
        count(*) filter (
          where grantee = 'authenticated'
            and privilege_type in ('TRUNCATE', 'REFERENCES', 'TRIGGER')
        )::int as authenticated_structural_privileges
      from information_schema.role_table_grants
      where table_schema = 'public'
    `);

    expect(result.rows[0]).toEqual({
      anon_structural_privileges: 0,
      authenticated_structural_privileges: 0
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

  it("keeps candidate publication behind a restricted, transaction-safe checkpoint", async () => {
    const result = await db.query<{
      is_security_definer: boolean;
      public_can_execute: boolean;
      anon_can_execute: boolean;
      authenticated_can_execute: boolean;
      publication_domains: number;
      published_column: string | null;
    }>(`
      select
        (
          select function_record.prosecdef
          from pg_proc function_record
          join pg_namespace namespace on namespace.oid = function_record.pronamespace
          where namespace.nspname = 'public'
            and function_record.proname = 'publish_approved_organization_candidates'
        ) as is_security_definer,
        has_function_privilege('public', 'public.publish_approved_organization_candidates(uuid[], uuid)', 'execute') as public_can_execute,
        has_function_privilege('anon', 'public.publish_approved_organization_candidates(uuid[], uuid)', 'execute') as anon_can_execute,
        has_function_privilege('authenticated', 'public.publish_approved_organization_candidates(uuid[], uuid)', 'execute') as authenticated_can_execute,
        (
          select count(*)::int
          from public.technical_domains
          where slug in (
            'aerospace-and-mobility',
            'communications-and-cyber',
            'test-training-and-sustainment',
            'advanced-manufacturing-and-integration'
          ) and publication_status = 'published'
        ) as publication_domains,
        (
          select data_type
          from information_schema.columns
          where table_schema = 'public'
            and table_name = 'candidate_changes'
            and column_name = 'published_at'
        ) as published_column
    `);

    expect(result.rows[0]).toEqual({
      is_security_definer: false,
      public_can_execute: false,
      anon_can_execute: false,
      authenticated_can_execute: true,
      publication_domains: 4,
      published_column: "timestamp with time zone"
    });
  });

  it("limits direct research intake to the trusted worker and keeps typed publication human-only", async () => {
    const result = await db.query<{
      anon_intake: boolean;
      authenticated_intake: boolean;
      service_intake: boolean;
      anon_publish: boolean;
      authenticated_publish: boolean;
      anon_research_publish: boolean;
      authenticated_research_publish: boolean;
      client_candidate_id: string | null;
      reviewer_rationale: string | null;
    }>(`
      select
        has_function_privilege('anon', 'public.stage_research_candidates_for_review(jsonb, jsonb)', 'execute') as anon_intake,
        has_function_privilege('authenticated', 'public.stage_research_candidates_for_review(jsonb, jsonb)', 'execute') as authenticated_intake,
        has_function_privilege('service_role', 'public.stage_research_candidates_for_review(jsonb, jsonb)', 'execute') as service_intake,
        has_function_privilege('anon', 'public.publish_reviewed_organization_candidates(uuid[], uuid)', 'execute') as anon_publish,
        has_function_privilege('authenticated', 'public.publish_reviewed_organization_candidates(uuid[], uuid)', 'execute') as authenticated_publish,
        has_function_privilege('anon', 'public.publish_reviewed_research_candidates(uuid[], uuid)', 'execute') as anon_research_publish,
        has_function_privilege('authenticated', 'public.publish_reviewed_research_candidates(uuid[], uuid)', 'execute') as authenticated_research_publish,
        (
          select data_type from information_schema.columns
          where table_schema = 'public' and table_name = 'candidate_changes' and column_name = 'client_candidate_id'
        ) as client_candidate_id,
        (
          select data_type from information_schema.columns
          where table_schema = 'public' and table_name = 'candidate_changes' and column_name = 'reviewer_rationale'
        ) as reviewer_rationale
    `);
    expect(result.rows[0]).toEqual({
      anon_intake: false,
      authenticated_intake: false,
      service_intake: true,
      anon_publish: false,
      authenticated_publish: true,
      anon_research_publish: false,
      authenticated_research_publish: true,
      client_candidate_id: "text",
      reviewer_rationale: "text"
    });
  });

  it("keeps published dossier editing RLS-preserving and administrator-only", async () => {
    const result = await db.query<{
      is_security_definer: boolean;
      public_can_execute: boolean;
      anon_can_execute: boolean;
      authenticated_can_execute: boolean;
      audit_event_insert_policy: number;
    }>(`
      select
        (
          select function_record.prosecdef
          from pg_proc function_record
          join pg_namespace namespace on namespace.oid = function_record.pronamespace
          where namespace.nspname = 'public'
            and function_record.proname = 'update_published_organization_dossier'
        ) as is_security_definer,
        has_function_privilege(
          'public',
          'public.update_published_organization_dossier(uuid, uuid, uuid, uuid, jsonb, text)',
          'execute'
        ) as public_can_execute,
        has_function_privilege(
          'anon',
          'public.update_published_organization_dossier(uuid, uuid, uuid, uuid, jsonb, text)',
          'execute'
        ) as anon_can_execute,
        has_function_privilege(
          'authenticated',
          'public.update_published_organization_dossier(uuid, uuid, uuid, uuid, jsonb, text)',
          'execute'
        ) as authenticated_can_execute,
        (
          select count(*)::int
          from pg_policies
          where schemaname = 'public'
            and tablename = 'audit_events'
            and cmd = 'INSERT'
        ) as audit_event_insert_policy
    `);

    expect(result.rows[0]).toEqual({
      is_security_definer: false,
      public_can_execute: false,
      anon_can_execute: false,
      authenticated_can_execute: true,
      audit_event_insert_policy: 1
    });
  });

  it("stages a completed research result directly into Review and publishes typed organizations only after approval", async () => {
    const staging = JSON.parse(await readFile(path.resolve("../research/ingestion/staging/tnm-balanced-bootstrap-2026-07-18.json"), "utf8")) as {
      researchRun: Record<string, unknown>;
      candidateChanges: Array<Record<string, unknown>>;
    };
    const staged = await db.query<{ staged_count: number; skipped_count: number }>(
      "select staged_count, skipped_count from public.stage_research_candidates_for_review($1::jsonb, $2::jsonb)",
      [JSON.stringify(staging.researchRun), JSON.stringify(staging.candidateChanges)]
    );
    expect(staged.rows[0]).toEqual({ staged_count: 4, skipped_count: 0 });

    const pending = await db.query<{ count: number }>(`
      select count(*)::int as count
      from public.candidate_changes
      where status = 'pending'
        and schema_version = 'organization_bundle_v2'
        and client_candidate_id in (
          'candidate-mission-control', 'candidate-l-spark', 'candidate-cove', 'candidate-build-ventures'
        )
    `);
    expect(pending.rows[0]?.count).toBe(4);

    const retried = await db.query<{ staged_count: number; skipped_count: number }>(
      "select staged_count, skipped_count from public.stage_research_candidates_for_review($1::jsonb, $2::jsonb)",
      [JSON.stringify(staging.researchRun), JSON.stringify(staging.candidateChanges)]
    );
    expect(retried.rows[0]).toEqual({ staged_count: 4, skipped_count: 0 });

    const administratorId = "b443c433-2a78-4ca7-8a19-a8f40b140049";
    await db.exec(`
      insert into auth.users (id) values ('${administratorId}') on conflict (id) do nothing;
      create or replace function auth.uid() returns uuid language sql stable as $$
        select '${administratorId}'::uuid
      $$;
      create or replace function auth.jwt() returns jsonb language sql stable as $$
        select '{"email":"m.andrew.davies@gmail.com","app_metadata":{"role":"admin"}}'::jsonb
      $$;
      update public.candidate_changes
      set status = 'approved'
      where client_candidate_id in (
        'candidate-mission-control', 'candidate-l-spark', 'candidate-cove', 'candidate-build-ventures'
      );
    `);

    const published = await db.query<{ candidate_id: string; organization_slug: string }>(`
      select candidate_id::text, organization_slug
      from public.publish_reviewed_organization_candidates(
        array(
          select id from public.candidate_changes
          where client_candidate_id in (
            'candidate-mission-control', 'candidate-l-spark', 'candidate-cove', 'candidate-build-ventures'
          )
        ),
        '${administratorId}'::uuid
      )
      order by organization_slug
    `);
    expect(published.rows.map((row) => row.organization_slug)).toEqual([
      "build-ventures",
      "cove",
      "l-spark",
      "mission-control"
    ]);

    const result = await db.query<{
      organizations: number;
      mappable_organizations: number;
      capabilities: number;
      programs: number;
      relationships: number;
      pending_candidates: number;
    }>(`
      select
        (select count(*)::int from public.organizations where slug in ('mission-control', 'l-spark', 'cove', 'build-ventures')) as organizations,
        (
          select count(*)::int
          from public.organizations organization_record
          join public.organization_locations location_link
            on location_link.organization_id = organization_record.id
           and location_link.is_primary
           and location_link.publication_status = 'published'
          join public.locations location_record on location_record.id = location_link.location_id
          where organization_record.slug in ('mission-control', 'l-spark', 'cove', 'build-ventures')
            and organization_record.publication_status = 'published'
            and location_record.latitude is not null
            and location_record.longitude is not null
        ) as mappable_organizations,
        (select count(*)::int from public.capabilities where slug = 'spacefarer-ai') as capabilities,
        (select count(*)::int from public.programs where slug in ('telus-sovereign-ai-accelerator', 'cove-start-up-yard')) as programs,
        (select count(*)::int from public.organization_relationships relationship_record join public.organizations organization_record on organization_record.id = relationship_record.organization_id where organization_record.slug = 'build-ventures') as relationships,
        (select count(*)::int from public.candidate_changes where client_candidate_id in ('candidate-mission-control', 'candidate-l-spark', 'candidate-cove', 'candidate-build-ventures') and status <> 'published') as pending_candidates
    `);
    expect(result.rows[0]).toEqual({
      organizations: 4,
      mappable_organizations: 4,
      capabilities: 1,
      programs: 2,
      relationships: 1,
      pending_candidates: 0
    });
  });

  it("prevents published organization locations from becoming unmappable", async () => {
    await expect(db.exec(`
      update public.locations location_record
      set latitude = null
      from public.organization_locations location_link
      join public.organizations organization_record
        on organization_record.id = location_link.organization_id
      where location_record.id = location_link.location_id
        and location_link.is_primary
        and organization_record.slug = 'mission-control'
    `)).rejects.toThrow(/mappable primary location/i);
  });

  it("stages generated reviewer rationale and publishes an approved Canadian public-demand signal", async () => {
    const administratorId = "b443c433-2a78-4ca7-8a19-a8f40b140049";
    const reviewerRationale = "This Canadian Army public problem statement is worthy of inclusion because it adds a non-NATO demand signal with a concrete operational need and desired end state. Verify issuer attribution, commitment level, and field evidence before publication.";
    const proposedRecord = {
      schemaVersion: "demand_signal_bundle_v1",
      candidateKind: "demand_signal_bundle",
      candidateId: "candidate-canadian-army-contested-logistics",
      sourceLeadIds: ["lead-canadian-army-contested-logistics"],
      confidence: "high",
      reviewStatus: "candidate_pending",
      reviewerRationale,
      duplicateCheck: {
        status: "clear",
        checkedAt: "2026-07-19T10:00:00.000Z",
        methods: ["canonical_url", "website_domain", "slug", "legal_name", "alias", "fuzzy_name"],
        matches: [],
        note: "No matching demand source or pending candidate was found in the current corpus."
      },
      sources: [{
        id: "canadian-army-logistics-source",
        title: "Canadian Army public contested logistics problem statement",
        url: "https://www.canada.ca/en/army/services/innovation/contested-logistics-test.html",
        publisher: "Canadian Army",
        sourceKind: "government_service_page",
        publishedAt: "2026-06-15T00:00:00.000Z",
        accessedAt: "2026-07-19T10:00:00.000Z",
        locator: "Operational problem and desired outcome",
        summary: "The official Canadian Army page describes a public logistics challenge and the outcome sought for operations in contested environments."
      }],
      fieldEvidence: [{
        id: "canadian-army-demand-summary-evidence",
        sourceId: "canadian-army-logistics-source",
        fieldPath: "demandSource.summary",
        claimClass: "source_backed",
        excerpt: "The official page frames resilient logistics in contested environments as a public operational challenge for the Canadian Army.",
        confidence: "high"
      }, {
        id: "canadian-army-logistics-problem-evidence",
        sourceId: "canadian-army-logistics-source",
        fieldPath: "requirements.resilient-contested-logistics.problemStatement",
        claimClass: "source_backed",
        excerpt: "The public problem statement describes the need to sustain distributed forces when transport, communications, and supply routes are disrupted.",
        confidence: "high"
      }],
      issuers: [{
        slug: "canadian-army",
        name: "Canadian Army",
        issuerType: "military_service",
        jurisdiction: "Canada",
        parentIssuerSlug: "canadian-armed-forces",
        role: "issuer"
      }],
      demandSource: {
        slug: "canadian-army-contested-logistics-test-2026",
        title: "Canadian Army public contested logistics problem statement",
        sourceKind: "official_problem_statement",
        commitmentLevel: "directional",
        classificationLabel: "PUBLIC",
        summary: "An official Canadian Army source describing a public operational problem and a desired logistics outcome without implying procurement eligibility.",
        publishedOn: "2026-06-15"
      },
      requirements: [{
        slug: "resilient-contested-logistics",
        title: "Resilient logistics in contested environments",
        problemStatement: "Distributed forces need to sustain operations when transport corridors, communications, and conventional supply routes are disrupted or denied.",
        desiredEndState: "Publicly proposed approaches should improve resilient, adaptive, and observable logistics for distributed operations under contested conditions.",
        publicCaveat: "Public-source alignment only. This is not procurement eligibility, endorsement, customer interest, or a classified requirement.",
        missionAreaSlugs: [],
        technicalDomainSlugs: []
      }]
    };
    const researchRun = {
      client_run_id: "test-canadian-demand-run",
      run_type: "manual",
      scope: { geography: "canada_first", coverage_view: "demand" },
      selected_gap: { coverageView: "demand", dimension: "canadian-army", reason: "Test a non-NATO demand signal through the complete reviewed workflow.", score: 100 },
      started_at: "2026-07-19T10:00:00.000Z",
      completed_at: "2026-07-19T10:10:00.000Z",
      agent_version: "test",
      source_queries: ["Canadian Army public operational problem statement"],
      counters: { candidatesCreated: 1 },
      validation_results: { passed: true },
      stop_reason: "Validated demand candidate staged for review."
    };
    const candidateChange = {
      client_candidate_id: proposedRecord.candidateId,
      candidate_kind: proposedRecord.candidateKind,
      schema_version: proposedRecord.schemaVersion,
      source_lead_ids: proposedRecord.sourceLeadIds,
      target_entity_type: "demand_source",
      target_entity_id: null,
      proposed_record: proposedRecord,
      before_record: null,
      field_evidence: proposedRecord.fieldEvidence,
      duplicate_check: proposedRecord.duplicateCheck,
      confidence: proposedRecord.confidence,
      status: "pending",
      staged_at: "2026-07-19T10:10:00.000Z"
    };

    const staged = await db.query<{ staged_count: number; skipped_count: number }>(
      "select staged_count, skipped_count from public.stage_research_candidates_for_review($1::jsonb, $2::jsonb)",
      [JSON.stringify(researchRun), JSON.stringify([candidateChange])]
    );
    expect(staged.rows[0]).toEqual({ staged_count: 1, skipped_count: 0 });

    const pending = await db.query<{ reviewer_rationale: string; proposed_rationale: string }>(`
      select reviewer_rationale, proposed_record->>'reviewerRationale' as proposed_rationale
      from public.candidate_changes
      where client_candidate_id = 'candidate-canadian-army-contested-logistics'
    `);
    expect(pending.rows[0]).toEqual({ reviewer_rationale: reviewerRationale, proposed_rationale: reviewerRationale });

    await db.exec(`
      insert into auth.users (id) values ('${administratorId}') on conflict (id) do nothing;
      create or replace function auth.uid() returns uuid language sql stable as $$
        select '${administratorId}'::uuid
      $$;
      create or replace function auth.jwt() returns jsonb language sql stable as $$
        select '{"email":"m.andrew.davies@gmail.com","app_metadata":{"role":"admin"}}'::jsonb
      $$;
      update public.candidate_changes
      set status = 'approved'
      where client_candidate_id = 'candidate-canadian-army-contested-logistics';
    `);

    const published = await db.query<{ entity_type: string; entity_slug: string }>(`
      select entity_type, entity_slug
      from public.publish_reviewed_research_candidates(
        array(
          select id from public.candidate_changes
          where client_candidate_id = 'candidate-canadian-army-contested-logistics'
        ),
        '${administratorId}'::uuid
      )
    `);
    expect(published.rows[0]).toEqual({ entity_type: "demand_source", entity_slug: "canadian-army-contested-logistics-test-2026" });

    const result = await db.query<{ sources: number; requirements: number; issuers: number; citations: number; published_candidates: number }>(`
      select
        (select count(*)::int from public.demand_sources where slug = 'canadian-army-contested-logistics-test-2026' and publication_status = 'published') as sources,
        (select count(*)::int from public.demand_requirements where slug = 'resilient-contested-logistics' and publication_status = 'published') as requirements,
        (select count(*)::int from public.demand_source_issuers link join public.demand_sources source_record on source_record.id = link.demand_source_id where source_record.slug = 'canadian-army-contested-logistics-test-2026' and link.publication_status = 'published') as issuers,
        (select count(*)::int from public.field_citations citation join public.demand_requirements requirement on requirement.id = citation.entity_id where citation.entity_type = 'demand_requirement' and requirement.slug = 'resilient-contested-logistics') as citations,
        (select count(*)::int from public.candidate_changes where client_candidate_id = 'candidate-canadian-army-contested-logistics' and status = 'published') as published_candidates
    `);
    expect(result.rows[0]).toEqual({ sources: 1, requirements: 1, issuers: 1, citations: 1, published_candidates: 1 });
  });

  it("stages, publishes, and retries an additive organization refresh safely", async () => {
    const administratorId = "b443c433-2a78-4ca7-8a19-a8f40b140049";
    const target = await db.query<{ id: string; slug: string; updated_at: string }>("select id, slug, updated_at::text from public.organizations where slug = 'kraken-robotics'");
    const organization = target.rows[0];
    const reviewerRationale = "Add a newly documented product capability to the existing Kraken Robotics profile using a durable official product source. Review the additive fields, target baseline, evidence, and taxonomy before publication.";
    const source = { id: "refresh-product-source", title: "Official refresh product technology page", url: "https://www.krakenrobotics.com/products/refresh-test-system", publisher: "Kraken Robotics", sourceKind: "official_company_product", publishedAt: null, accessedAt: "2026-07-23T12:00:00.000Z", locator: "Product overview", summary: "The official page describes a new test capability for validating the reviewed refresh publication path." };
    const evidence = { id: "refresh-product-evidence", sourceId: source.id, fieldPath: "operations.add-refresh-test.value.summary", claimClass: "source_backed", excerpt: "The official page describes the refresh test system as a concrete maritime sensing capability for defence users.", confidence: "moderate" };
    const proposedRecord = {
      schemaVersion: "organization_refresh_bundle_v1", candidateKind: "organization_refresh_bundle", candidateId: "candidate-kraken-refresh-test",
      sourceLeadIds: ["lead-kraken-refresh-test"], confidence: "moderate", reviewStatus: "candidate_pending", reviewerRationale,
      duplicateCheck: { status: "clear", checkedAt: "2026-07-23T12:00:00.000Z", methods: ["canonical_url", "website_domain", "slug"], matches: [], note: "The intended target is Kraken Robotics and no other entity conflicts with this additive capability." },
      sources: [source], fieldEvidence: [evidence],
      targetMatch: { entityType: "organization", entityId: organization.id, slug: organization.slug, matchMethods: ["slug"], confidence: "high", baselineUpdatedAt: organization.updated_at },
      beforeRecord: { organization: { id: organization.id, slug: organization.slug, updated_at: organization.updated_at }, capabilities: [] },
      operations: [
        { operationId: "add-refresh-test", operation: "add_child", entityType: "capability", parentId: organization.id, value: { slug: "kraken-refresh-test-system", name: "Refresh Test System", summary: "A test-only maritime sensing capability used to validate additive reviewed refresh publication.", capabilityType: "maritime sensing system", features: ["Synthetic aperture sensing"], applications: ["Maritime situational awareness"], technicalTags: ["maritime sensing"], technicalDomainSlugs: ["sensing-and-isr"], missionMatches: [] }, evidenceIds: [evidence.id], reviewerExplanation: "Add the newly supported capability without replacing or deleting the organization's existing technologies." },
        { operationId: "add-refresh-program", operation: "add_child", entityType: "program", parentId: organization.id, value: { slug: "kraken-refresh-public-program", name: "Refresh Public Program", summary: "A test-only public program participation used to verify that reviewed enrichment attaches to the intended organization record.", programType: "Defence innovation program", operatorName: "Government of Canada", websiteUrl: "https://www.canada.ca/en/department-national-defence/programs/refresh-public-program.html", cohortLabel: null, participationType: "technology participant" }, evidenceIds: [evidence.id], reviewerExplanation: "Add the reviewed program participation to the matched organization while preserving its existing technologies and stable identity." }
      ],
      sourceChannels: ["official_company"], signalIds: ["signal-kraken-refresh-test"], corroboration: []
    };
    const run = { client_run_id: "tnm-refresh-test-2026-07-23", run_type: "manual", scope: { workflow: "signal_refresh" }, selected_gap: { dimension: "record-refresh" }, started_at: "2026-07-23T12:00:00.000Z", completed_at: "2026-07-23T12:10:00.000Z", agent_version: "test", source_queries: [], counters: {}, validation_results: { passed: true }, stop_reason: "fixture complete" };
    const change = { client_candidate_id: proposedRecord.candidateId, candidate_kind: proposedRecord.candidateKind, schema_version: proposedRecord.schemaVersion, source_lead_ids: proposedRecord.sourceLeadIds, target_entity_type: "organization", target_entity_id: organization.id, proposed_record: proposedRecord, before_record: proposedRecord.beforeRecord, field_evidence: proposedRecord.fieldEvidence, duplicate_check: proposedRecord.duplicateCheck, confidence: proposedRecord.confidence, status: "pending", staged_at: "2026-07-23T12:10:00.000Z" };

    const staged = await db.query<{ staged_count: number; skipped_count: number }>("select staged_count, skipped_count from public.stage_research_candidates_for_review($1::jsonb, $2::jsonb)", [JSON.stringify(run), JSON.stringify([change])]);
    expect(staged.rows[0]).toEqual({ staged_count: 1, skipped_count: 0 });
    const reviewQueueBefore = await db.query<{ count: number }>("select count(*)::int count from public.candidate_changes where client_candidate_id = 'candidate-kraken-refresh-test' and status = 'pending'");
    expect(reviewQueueBefore.rows[0].count).toBe(1);
    await db.exec(`
      insert into auth.users (id) values ('${administratorId}') on conflict (id) do nothing;
      insert into public.review_decisions (candidate_change_id, reviewer_id, decision, field_decisions, rationale)
      select id, '${administratorId}'::uuid, 'accept', '[]'::jsonb, 'Reviewed the target identity, additive capability, durable official source, evidence mapping, duplicate check, and publication caveats.'
      from public.candidate_changes where client_candidate_id = 'candidate-kraken-refresh-test';
      update public.candidate_changes set status = 'approved' where client_candidate_id = 'candidate-kraken-refresh-test';
    `);
    const checkpoints = await db.query<{ pending: number; approved: number; decisions: number }>(`
      select
        (select count(*)::int from public.candidate_changes where client_candidate_id = 'candidate-kraken-refresh-test' and status = 'pending') pending,
        (select count(*)::int from public.candidate_changes where client_candidate_id = 'candidate-kraken-refresh-test' and status = 'approved') approved,
        (select count(*)::int from public.review_decisions decision join public.candidate_changes candidate on candidate.id = decision.candidate_change_id where candidate.client_candidate_id = 'candidate-kraken-refresh-test' and decision.decision = 'accept') decisions
    `);
    expect(checkpoints.rows[0]).toEqual({ pending: 0, approved: 1, decisions: 1 });
    const published = await db.query<{ entity_type: string; entity_slug: string }>(`select entity_type, entity_slug from public.publish_reviewed_research_candidates(array(select id from public.candidate_changes where client_candidate_id = 'candidate-kraken-refresh-test'), '${administratorId}'::uuid)`);
    expect(published.rows[0]).toEqual({ entity_type: "organization", entity_slug: "kraken-robotics" });
    const result = await db.query<{ capabilities: number; citations: number; programs: number; sources: number; published_candidates: number }>(`select (select count(*)::int from public.capabilities where slug = 'kraken-refresh-test-system') capabilities, (select count(*)::int from public.field_citations citation join public.capabilities capability on capability.id = citation.entity_id where capability.slug = 'kraken-refresh-test-system') citations, (select count(*)::int from public.program_participations participation join public.programs program on program.id = participation.program_id where program.slug = 'kraken-refresh-public-program' and participation.organization_id = '${organization.id}'::uuid) programs, (select count(*)::int from public.sources where canonical_url = 'https://www.krakenrobotics.com/products/refresh-test-system') sources, (select count(*)::int from public.candidate_changes where client_candidate_id = 'candidate-kraken-refresh-test' and status = 'published') published_candidates`);
    expect(result.rows[0]).toEqual({ capabilities: 1, citations: 1, programs: 1, sources: 1, published_candidates: 1 });
    const retry = await db.query<{ staged_count: number; skipped_count: number }>("select staged_count, skipped_count from public.stage_research_candidates_for_review($1::jsonb, $2::jsonb)", [JSON.stringify(run), JSON.stringify([change])]);
    expect(retry.rows[0]).toEqual({ staged_count: 0, skipped_count: 1 });

    const refreshedTarget = await db.query<{ id: string; updated_at: string }>("select id, updated_at::text from public.organizations where id = $1", [organization.id]);
    const existingCapability = await db.query<{ id: string; slug: string; name: string; summary: string }>("select id, slug, name, summary from public.capabilities where slug = 'kraken-refresh-test-system'");
    const capabilityBefore = existingCapability.rows[0];
    const updateRecord = JSON.parse(JSON.stringify(proposedRecord));
    updateRecord.candidateId = "candidate-kraken-update-refresh-test";
    updateRecord.sourceLeadIds = ["lead-kraken-update-refresh-test"];
    updateRecord.targetMatch.baselineUpdatedAt = refreshedTarget.rows[0].updated_at;
    updateRecord.beforeRecord = { organization: { id: organization.id, slug: organization.slug, updated_at: refreshedTarget.rows[0].updated_at }, capabilities: [capabilityBefore] };
    updateRecord.sources[0].id = "update-refresh-source";
    updateRecord.sources[0].url = "https://www.krakenrobotics.com/products/refresh-test-system-update";
    updateRecord.fieldEvidence[0].id = "update-refresh-evidence";
    updateRecord.fieldEvidence[0].sourceId = "update-refresh-source";
    updateRecord.operations = [{ operationId: "update-refresh-test", operation: "update_child", entityType: "capability", targetId: capabilityBefore.id, before: capabilityBefore, after: { name: capabilityBefore.name, summary: "An updated test-only maritime sensing capability that preserves its canonical identity while adding reviewed details.", capabilityType: "maritime sensing system", features: ["Synthetic aperture sensing", "Reviewed stable-identity update"], applications: ["Maritime situational awareness"], technicalTags: ["maritime sensing"] }, evidenceIds: ["update-refresh-evidence"], reviewerExplanation: "Update the existing capability fields while preserving its stable database identifier and public slug." }];
    updateRecord.signalIds = ["signal-kraken-update-refresh-test"];
    const updateChange = { ...change, client_candidate_id: updateRecord.candidateId, source_lead_ids: updateRecord.sourceLeadIds, proposed_record: updateRecord, before_record: updateRecord.beforeRecord, field_evidence: updateRecord.fieldEvidence };
    const updateRun = { ...run, client_run_id: "tnm-update-refresh-test-2026-07-23" };
    await db.query("select staged_count from public.stage_research_candidates_for_review($1::jsonb, $2::jsonb)", [JSON.stringify(updateRun), JSON.stringify([updateChange])]);
    await db.exec("update public.candidate_changes set status = 'approved' where client_candidate_id = 'candidate-kraken-update-refresh-test'");
    await db.query(`select * from public.publish_reviewed_research_candidates(array(select id from public.candidate_changes where client_candidate_id = 'candidate-kraken-update-refresh-test'), '${administratorId}'::uuid)`);
    const capabilityAfter = await db.query<{ id: string; slug: string; summary: string }>("select id, slug, summary from public.capabilities where id = $1", [capabilityBefore.id]);
    expect(capabilityAfter.rows[0]).toEqual({ id: capabilityBefore.id, slug: capabilityBefore.slug, summary: "An updated test-only maritime sensing capability that preserves its canonical identity while adding reviewed details." });

    const staleRecord = structuredClone(proposedRecord);
    staleRecord.candidateId = "candidate-kraken-stale-refresh-test";
    staleRecord.sourceLeadIds = ["lead-kraken-stale-refresh-test"];
    staleRecord.sources[0].id = "stale-refresh-source";
    staleRecord.sources[0].url = "https://www.krakenrobotics.com/products/stale-refresh-test-system";
    staleRecord.fieldEvidence[0].id = "stale-refresh-evidence";
    staleRecord.fieldEvidence[0].sourceId = "stale-refresh-source";
    staleRecord.operations[0].operationId = "add-stale-refresh-test";
    staleRecord.operations[0].value.slug = "kraken-stale-refresh-test-system";
    staleRecord.operations[0].evidenceIds = ["stale-refresh-evidence"];
    const staleChange = { ...change, client_candidate_id: staleRecord.candidateId, source_lead_ids: staleRecord.sourceLeadIds, proposed_record: staleRecord, field_evidence: staleRecord.fieldEvidence };
    const staleRun = { ...run, client_run_id: "tnm-stale-refresh-test-2026-07-23" };
    await db.query("select staged_count from public.stage_research_candidates_for_review($1::jsonb, $2::jsonb)", [JSON.stringify(staleRun), JSON.stringify([staleChange])]);
    await db.exec("update public.candidate_changes set status = 'approved' where client_candidate_id = 'candidate-kraken-stale-refresh-test'");
    await expect(db.query(`select * from public.publish_reviewed_research_candidates(array(select id from public.candidate_changes where client_candidate_id = 'candidate-kraken-stale-refresh-test'), '${administratorId}'::uuid)`)).rejects.toThrow(/stale baseline/i);
    const staleResult = await db.query<{ capabilities: number }>("select count(*)::int capabilities from public.capabilities where slug = 'kraken-stale-refresh-test-system'");
    expect(staleResult.rows[0].capabilities).toBe(0);
  });

  it("adds a reviewed requirement to an existing demand source through the refresh path", async () => {
    const administratorId = "b443c433-2a78-4ca7-8a19-a8f40b140049";
    const target = await db.query<{ id: string; slug: string; updated_at: string }>("select id, slug, updated_at::text from public.demand_sources where slug = 'canadian-army-contested-logistics-test-2026'");
    const demand = target.rows[0];
    const source = { id: "demand-refresh-source", title: "Official contested logistics requirement update", url: "https://www.canada.ca/en/department-national-defence/programs/contested-logistics-refresh-test.html", publisher: "Department of National Defence", sourceKind: "official_policy", publishedAt: "2026-07-23T00:00:00.000Z", accessedAt: "2026-07-23T13:00:00.000Z", locator: "Updated requirement section", summary: "The official update adds an explicit requirement for distributed autonomous resupply in degraded operating environments." };
    const evidence = { id: "demand-refresh-evidence", sourceId: source.id, fieldPath: "operations.add-autonomous-resupply.value", claimClass: "source_backed", excerpt: "The public requirement calls for distributed autonomous resupply that can continue operating when communications and transport routes are degraded.", confidence: "high" };
    const proposedRecord = {
      schemaVersion: "demand_refresh_bundle_v1", candidateKind: "demand_refresh_bundle", candidateId: "candidate-contested-logistics-demand-refresh-test",
      sourceLeadIds: ["lead-contested-logistics-demand-refresh-test"], confidence: "high", reviewStatus: "candidate_pending",
      reviewerRationale: "Add a newly published, source-backed requirement to the existing contested logistics demand record while preserving its stable identity and all previously reviewed requirements and evidence.",
      duplicateCheck: { status: "clear", checkedAt: "2026-07-23T13:00:00.000Z", methods: ["canonical_url", "slug", "fuzzy_name"], matches: [], note: "The requirement slug is new and the intended demand source is an exact live target." },
      sources: [source], fieldEvidence: [evidence],
      targetMatch: { entityType: "demand_source", entityId: demand.id, slug: demand.slug, matchMethods: ["slug"], confidence: "high", baselineUpdatedAt: demand.updated_at },
      beforeRecord: { demandSource: { id: demand.id, slug: demand.slug, updated_at: demand.updated_at } },
      operations: [{ operationId: "add-autonomous-resupply-requirement", operation: "add_child", entityType: "demand_requirement", parentId: demand.id, value: { slug: "distributed-autonomous-resupply-refresh-test", title: "Distributed autonomous resupply in degraded environments", problemStatement: "Land formations need resilient ways to distribute supplies when transport routes, communications and conventional logistics nodes are degraded or contested.", desiredEndState: "Forces can sustain dispersed operations with autonomous resupply options that reduce exposure and continue functioning through intermittent connectivity.", publicCaveat: "Public-source alignment only. This is not procurement eligibility, endorsement, customer interest, or a classified requirement.", displayOrder: 3 }, evidenceIds: [evidence.id], reviewerExplanation: "Append the new public requirement without deleting or rewriting any previously reviewed demand content." }],
      sourceChannels: ["government_procurement"], signalIds: ["signal-autonomous-resupply-refresh-test"], corroboration: []
    };
    const run = { client_run_id: "tnm-demand-refresh-test-2026-07-23", run_type: "targeted", scope: { workflow: "signal_refresh" }, selected_gap: { dimension: "demand-refresh" }, started_at: "2026-07-23T13:00:00.000Z", completed_at: "2026-07-23T13:10:00.000Z", agent_version: "test", source_queries: [], counters: {}, validation_results: { passed: true }, stop_reason: "fixture complete" };
    const change = { client_candidate_id: proposedRecord.candidateId, candidate_kind: proposedRecord.candidateKind, schema_version: proposedRecord.schemaVersion, source_lead_ids: proposedRecord.sourceLeadIds, target_entity_type: "demand_source", target_entity_id: demand.id, proposed_record: proposedRecord, before_record: proposedRecord.beforeRecord, field_evidence: proposedRecord.fieldEvidence, duplicate_check: proposedRecord.duplicateCheck, confidence: proposedRecord.confidence, status: "pending", staged_at: "2026-07-23T13:10:00.000Z" };

    const staged = await db.query<{ staged_count: number }>("select staged_count from public.stage_research_candidates_for_review($1::jsonb, $2::jsonb)", [JSON.stringify(run), JSON.stringify([change])]);
    expect(staged.rows[0].staged_count).toBe(1);
    await db.exec("update public.candidate_changes set status = 'approved' where client_candidate_id = 'candidate-contested-logistics-demand-refresh-test'");
    const published = await db.query<{ entity_type: string; entity_slug: string }>(`select entity_type, entity_slug from public.publish_reviewed_research_candidates(array(select id from public.candidate_changes where client_candidate_id = 'candidate-contested-logistics-demand-refresh-test'), '${administratorId}'::uuid)`);
    expect(published.rows[0]).toEqual({ entity_type: "demand_source", entity_slug: demand.slug });
    const result = await db.query<{ requirements: number; citations: number }>("select (select count(*)::int from public.demand_requirements where slug = 'distributed-autonomous-resupply-refresh-test') requirements, (select count(*)::int from public.field_citations citation join public.demand_requirements requirement on requirement.id = citation.entity_id where requirement.slug = 'distributed-autonomous-resupply-refresh-test') citations");
    expect(result.rows[0]).toEqual({ requirements: 1, citations: 1 });
  });
});
