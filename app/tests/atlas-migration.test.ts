import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  buildMinimalOrganizationRefreshV2Candidate,
  buildMinimalOrganizationV3Candidate,
  buildStagingCandidate,
  dossierFixtureResearchRun
} from "./fixtures/organization-dossier-candidates";

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
  const afterFixtureMigrations = new Set([
    "20260809222847_organization_dossier_v3.sql",
    "20260809222938_research_organization_v3_publication.sql",
    "20260813081430_add_executive_relevance_summary.sql",
    "20260813081500_add_newsletter_cta_click_event.sql",
    "20260813081542_remove_dossier_view_citation_aggregate.sql",
    "20260813083552_sanitize_public_organization_profile_data.sql",
    "20260827100251_north_signal_delivery_preferences_and_measurement.sql",
    "20260827100553_north_signal_post_deploy_preference_reconciliation.sql"
  ]);
  const foundationMigrations = migrationFiles.filter((fileName) =>
    !fileName.includes("promote_")
    && !fileName.includes("promotion_audit")
    && !afterFixtureMigrations.has(fileName)
  );
  const reviewedDataMigrations = migrationFiles.filter((fileName) => !foundationMigrations.includes(fileName));
  for (const fileName of foundationMigrations) {
    await applyMigration(fileName);
  }
  await db.exec(await readFile(foundationFixturePath, "utf8"));
  await db.exec(`
    insert into public.pilot_update_signups (
      email, consented, consent_text, consent_version, source, landing_path, status
    ) values
      (
        'active-backfill-migration-test@example.ca', true,
        'I agree to receive the existing weekly North Signal email and can unsubscribe at any time.',
        'north-signal-legacy-v1', 'newsletter_page', '/north-signal', 'subscribed'
      ),
      (
        'unsubscribed-backfill-migration-test@example.ca', true,
        'I previously agreed to receive North Signal and later used the existing unsubscribe control.',
        'north-signal-legacy-v1', 'newsletter_page', '/north-signal', 'unsubscribed'
      );
  `);
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

  it("keeps private workflow lineage out of the public organization profile column", async () => {
    await db.exec(`
      update public.organizations
      set profile_data = profile_data || jsonb_build_object(
        'portfolioScope', 'Published capability portfolio.',
        'reviewed_candidate_id', 'candidate-private',
        'reviewed_by', 'reviewer-private',
        'research_schema_version', 'schema-private',
        'ingestion_batch_id', 'batch-private'
      )
      where slug = 'kraken-robotics'
    `);
    const result = await db.query<{ profile_data: Record<string, unknown>; forbidden_count: number }>(`
      select
        profile_data,
        case when profile_data ?| array[
          'reviewed_candidate_id', 'reviewed_by', 'research_schema_version', 'ingestion_batch_id'
        ]::text[] then 1 else 0 end::int as forbidden_count
      from public.organizations
      where slug = 'kraken-robotics'
    `);
    expect(result.rows[0]?.forbidden_count).toBe(0);
    expect(result.rows[0]?.profile_data).toMatchObject({ portfolioScope: "Published capability portfolio." });

    await db.exec("set role anon");
    try {
      const anonymousResult = await db.query<{ forbidden_count: number }>(`
        select count(*)::int as forbidden_count
        from public.organizations
        where publication_status = 'published'
          and profile_data ?| array['reviewed_candidate_id', 'reviewed_by', 'research_schema_version', 'ingestion_batch_id']::text[]
      `);
      expect(anonymousResult.rows[0]?.forbidden_count).toBe(0);
    } finally {
      await db.exec("reset role");
    }
  });

  it("preserves refresh baselines while the lineage cleanup sanitizes existing rows", async () => {
    const migrationPath = path.join(
      migrationDirectory,
      "20260813083552_sanitize_public_organization_profile_data.sql"
    );
    await db.exec(`
      alter table public.organizations drop constraint organizations_profile_data_excludes_internal_lineage;
      alter table public.organizations disable trigger organizations_strip_internal_profile_lineage;
      alter table public.organizations disable trigger organizations_set_updated_at;
      update public.organizations
      set profile_data = profile_data || jsonb_build_object('reviewed_candidate_id', 'migration-baseline-fixture'),
          updated_at = '2026-08-12T12:34:56Z'::timestamptz
      where slug = 'kraken-robotics';
      alter table public.organizations enable trigger organizations_set_updated_at;
      alter table public.organizations enable trigger organizations_strip_internal_profile_lineage;
    `);
    await db.exec(await readFile(migrationPath, "utf8"));
    const result = await db.query<{ updated_at: string; has_lineage: boolean }>(`
      select updated_at::text, profile_data ? 'reviewed_candidate_id' as has_lineage
      from public.organizations
      where slug = 'kraken-robotics'
    `);
    expect(result.rows[0]?.has_lineage).toBe(false);
    expect(new Date(result.rows[0]?.updated_at ?? 0).toISOString()).toBe("2026-08-12T12:34:56.000Z");
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
      issuers: 11,
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

  it("assembles one RLS-preserving dossier row with bounded citations hydrated outside the view", async () => {
    const result = await db.query<{
      capabilities: number;
      locations: number;
      citations: number;
      public_citations: number;
    }>(`
      select
        jsonb_array_length(capabilities)::int as capabilities,
        jsonb_array_length(locations)::int as locations,
        jsonb_array_length(citations)::int as citations,
        (
          select count(*)::int
          from public.field_citations citation
          join public.evidence_snippets evidence on evidence.id = citation.evidence_snippet_id
          join public.sources source on source.id = evidence.source_id
          where citation.entity_type = 'organization'
            and citation.entity_id = organization_dossiers.id
            and evidence.visibility = 'public'
            and evidence.public_approved
            and source.visibility = 'public'
            and source.public_approved
        ) as public_citations
      from public.organization_dossiers
      where slug = 'kraken-robotics'
    `);
    expect(result.rows[0]).toEqual({ capabilities: 1, locations: 1, citations: 0, public_citations: 3 });

    const security = await db.query<{ reloptions: string[] | null }>(`
      select relation.reloptions
      from pg_class relation
      join pg_namespace namespace on namespace.oid = relation.relnamespace
      where namespace.nspname = 'public'
        and relation.relname = 'organization_dossiers'
    `);
    expect(security.rows[0]?.reloptions).toContain("security_invoker=true");
  });

  it("normalizes cited current activity and unambiguous one-to-one programme participation copy", async () => {
    const organizations = await db.query<{
      slug: string;
      current_activity: string | null;
      legacy_current_activity: string;
      editorial_profile_version: string | null;
      normalized_citations: number;
    }>(`
      select
        organization_record.slug,
        organization_record.current_activity,
        organization_record.profile_data->>'currentActivity' as legacy_current_activity,
        organization_record.editorial_profile_version,
        (
          select count(*)::int
          from public.field_citations citation
          where citation.entity_type = 'organization'
            and citation.entity_id = organization_record.id
            and citation.field_name = 'current_activity'
        ) as normalized_citations
      from public.organizations organization_record
      where organization_record.slug in ('kraken-robotics', 'mda-space')
      order by organization_record.slug
    `);
    expect(organizations.rows).toEqual([
      {
        slug: "kraken-robotics",
        current_activity: "Kraken published a current integration milestone supported by the attached durable public source.",
        legacy_current_activity: "Kraken published a current integration milestone supported by the attached durable public source.",
        editorial_profile_version: null,
        normalized_citations: 1
      },
      {
        slug: "mda-space",
        current_activity: null,
        legacy_current_activity: "MDA published an uncited current activity value that must remain only in historical JSON.",
        editorial_profile_version: null,
        normalized_citations: 0
      }
    ]);

    const participations = await db.query<{
      normalized_summaries: number;
      canonical_summaries: number;
      normalized_summary_citations: number;
      original_program_citations: number;
    }>(`
      select
        count(*) filter (where participation.public_summary is not null)::int as normalized_summaries,
        count(*) filter (where length(trim(program.summary)) >= 40)::int as canonical_summaries,
        (
          select count(*)::int
          from public.field_citations citation
          where citation.entity_type = 'program_participation'
            and citation.field_name = 'public_summary'
        ) as normalized_summary_citations,
        (
          select count(*)::int
          from public.field_citations citation
          where citation.entity_type = 'program'
            and citation.field_name in ('summary', 'add_child')
        ) as original_program_citations
      from public.program_participations participation
      join public.programs program on program.id = participation.program_id
      where participation.publication_status = 'published'
    `);
    expect(participations.rows[0]).toEqual({
      normalized_summaries: 1,
      canonical_summaries: 1,
      normalized_summary_citations: 1,
      original_program_citations: 1
    });
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

  it("keeps editorial RPCs invoker-mode and removes overlapping permissive policies", async () => {
    const functions = await db.query<{ name: string; security_definer: boolean }>(`
      select function_record.proname as name, function_record.prosecdef as security_definer
      from pg_proc function_record
      join pg_namespace namespace on namespace.oid = function_record.pronamespace
      where namespace.nspname = 'public'
        and function_record.proname in ('upsert_defence_brief', 'upsert_defence_article')
      order by function_record.proname
    `);
    expect(functions.rows).toEqual([
      { name: "upsert_defence_article", security_definer: false },
      { name: "upsert_defence_brief", security_definer: false }
    ]);

    const overlaps = await db.query<{ count: number }>(`
      with expanded as (
        select schemaname, tablename, policyname, cmd, unnest(roles) as role_name
        from pg_policies
        where schemaname = 'public' and permissive = 'PERMISSIVE'
      ), normalized as (
        select schemaname, tablename, role_name,
          case when cmd = 'ALL' then action else cmd end as action
        from expanded
        cross join lateral (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) commands(action)
        where cmd = 'ALL' or cmd = action
      )
      select count(*)::int as count
      from (
        select schemaname, tablename, role_name, action
        from normalized
        group by schemaname, tablename, role_name, action
        having count(*) > 1
      ) duplicate_policy_groups
    `);
    expect(overlaps.rows[0]?.count).toBe(0);

    const quota = await db.query<{ trigger_count: number; submission_index: string | null }>(`
      select
        (
          select count(*)::int from pg_trigger
          where not tgisinternal
            and tgname in ('submissions_member_workflow_quota', 'connection_requests_member_workflow_quota')
        ) as trigger_count,
        to_regclass('public.submissions_owner_created_at_idx')::text as submission_index
    `);
    expect(quota.rows[0]).toEqual({
      trigger_count: 2,
      submission_index: "submissions_owner_created_at_idx"
    });
  });

  it("reviews public submissions atomically without changing candidates or published records", async () => {
    const administratorId = "b443c433-2a78-4ca7-8a19-a8f40b140049";
    const memberId = "b5555555-5555-4555-a555-555555555555";
    const approvedSubmissionId = "a1111111-1111-4111-a111-111111111111";
    const rejectedSubmissionId = "a2222222-2222-4222-a222-222222222222";
    const deniedSubmissionId = "a3333333-3333-4333-a333-333333333333";
    const before = await db.query<{ candidates: number; organization_updated_at: string }>(`
      select
        (select count(*)::int from public.candidate_changes) as candidates,
        (select updated_at::text from public.organizations where slug = 'kraken-robotics') as organization_updated_at
    `);

    await db.exec(`
      insert into auth.users (id) values
        ('${administratorId}'::uuid),
        ('${memberId}'::uuid)
      on conflict do nothing;
      insert into public.submissions (
        id, owner_id, submission_type, submitted_payload, status
      ) values
        ('${approvedSubmissionId}'::uuid, '${memberId}'::uuid, 'correction', '{"summary":"approve fixture"}'::jsonb, 'pending'),
        ('${rejectedSubmissionId}'::uuid, '${memberId}'::uuid, 'correction', '{"summary":"reject fixture"}'::jsonb, 'pending'),
        ('${deniedSubmissionId}'::uuid, '${memberId}'::uuid, 'correction', '{"summary":"deny fixture"}'::jsonb, 'pending');
      create or replace function auth.uid() returns uuid language sql stable as $$
        select '${administratorId}'::uuid
      $$;
      create or replace function auth.jwt() returns jsonb language sql stable as $$
        select '{"email":"m.andrew.davies@gmail.com","app_metadata":{"role":"admin"}}'::jsonb
      $$;
      set role authenticated;
    `);
    try {
      const started = await db.query<{ review_public_submission: string }>(
        "select public.review_public_submission($1, $2, $3, $4)",
        [approvedSubmissionId, "pending", "start_review", "Starting a complete source and identity review."]
      );
      expect(started.rows[0]?.review_public_submission).toBe("in_review");

      await expect(db.query(
        "select public.review_public_submission($1, $2, $3, $4)",
        [approvedSubmissionId, "pending", "approve", "This stale transition must not create a decision."]
      )).rejects.toThrow("status changed");

      const returned = await db.query<{ review_public_submission: string }>(
        "select public.review_public_submission($1, $2, $3, $4)",
        [approvedSubmissionId, "in_review", "return_pending", "Returning this record for another bounded source check."]
      );
      expect(returned.rows[0]?.review_public_submission).toBe("pending");

      const restarted = await db.query<{ review_public_submission: string }>(
        "select public.review_public_submission($1, $2, $3, $4)",
        [approvedSubmissionId, "pending", "start_review", "Restarting review after the requested source check was completed."]
      );
      expect(restarted.rows[0]?.review_public_submission).toBe("in_review");

      const approved = await db.query<{ review_public_submission: string }>(
        "select public.review_public_submission($1, $2, $3, $4)",
        [approvedSubmissionId, "in_review", "approve", "Approved only for source-backed candidate preparation."]
      );
      expect(approved.rows[0]?.review_public_submission).toBe("approved");

      const rejected = await db.query<{ review_public_submission: string }>(
        "select public.review_public_submission($1, $2, $3, $4)",
        [rejectedSubmissionId, "pending", "reject", "Rejected because the submitted claim is not supportable."]
      );
      expect(rejected.rows[0]?.review_public_submission).toBe("rejected");
    } finally {
      await db.exec("reset role");
    }

    await db.exec(`
      create or replace function auth.uid() returns uuid language sql stable as $$
        select '${memberId}'::uuid
      $$;
      create or replace function auth.jwt() returns jsonb language sql stable as $$
        select '{"email":"member@example.ca","app_metadata":{"role":"member"}}'::jsonb
      $$;
      set role authenticated;
    `);
    try {
      await expect(db.query(
        "select public.review_public_submission($1, $2, $3, $4)",
        [deniedSubmissionId, "pending", "approve", "A normal member must not be able to review this record."]
      )).rejects.toThrow("requires the authenticated atlas reviewer");
    } finally {
      await db.exec("reset role");
    }

    const result = await db.query<{
      approved_status: string;
      rejected_status: string;
      denied_status: string;
      decision_count: number;
      audit_count: number;
      publication_changes: number;
      candidates: number;
      organization_updated_at: string;
    }>(`
      select
        (select status from public.submissions where id = '${approvedSubmissionId}'::uuid) as approved_status,
        (select status from public.submissions where id = '${rejectedSubmissionId}'::uuid) as rejected_status,
        (select status from public.submissions where id = '${deniedSubmissionId}'::uuid) as denied_status,
        (select count(*)::int from public.review_decisions
          where submission_id in ('${approvedSubmissionId}'::uuid, '${rejectedSubmissionId}'::uuid, '${deniedSubmissionId}'::uuid)) as decision_count,
        (select count(*)::int from public.audit_events
          where event_type = 'submission_reviewed'
            and entity_id in ('${approvedSubmissionId}'::uuid, '${rejectedSubmissionId}'::uuid, '${deniedSubmissionId}'::uuid)) as audit_count,
        (select count(*)::int from public.audit_events
          where event_type = 'submission_reviewed'
            and entity_id in ('${approvedSubmissionId}'::uuid, '${rejectedSubmissionId}'::uuid, '${deniedSubmissionId}'::uuid)
            and metadata ->> 'publication_changed' <> 'false') as publication_changes,
        (select count(*)::int from public.candidate_changes) as candidates,
        (select updated_at::text from public.organizations where slug = 'kraken-robotics') as organization_updated_at
    `);
    expect(result.rows[0]).toEqual({
      approved_status: "approved",
      rejected_status: "rejected",
      denied_status: "pending",
      decision_count: 5,
      audit_count: 5,
      publication_changes: 0,
      candidates: before.rows[0]?.candidates,
      organization_updated_at: before.rows[0]?.organization_updated_at
    });

    await db.exec(`
      delete from public.audit_events
      where event_type = 'submission_reviewed'
        and entity_id in ('${approvedSubmissionId}'::uuid, '${rejectedSubmissionId}'::uuid, '${deniedSubmissionId}'::uuid);
      delete from public.submissions
      where id in ('${approvedSubmissionId}'::uuid, '${rejectedSubmissionId}'::uuid, '${deniedSubmissionId}'::uuid);
      delete from auth.users where id = '${memberId}'::uuid;
      create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
      create or replace function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
    `);
  });

  it("returns only a bounded staff coverage aggregate instead of the national discovery graph", async () => {
    const administratorId = "b443c433-2a78-4ca7-8a19-a8f40b140049";
    const memberId = "baaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
    const contract = await db.query<{
      security_invoker: boolean;
      anon_execute: boolean;
      authenticated_execute: boolean;
    }>(`
      select
        not function_record.prosecdef as security_invoker,
        has_function_privilege('anon', function_record.oid, 'execute') as anon_execute,
        has_function_privilege('authenticated', function_record.oid, 'execute') as authenticated_execute
      from pg_proc function_record
      join pg_namespace namespace on namespace.oid = function_record.pronamespace
      where namespace.nspname = 'public'
        and function_record.proname = 'get_admin_coverage_breakdown'
    `);
    expect(contract.rows[0]).toEqual({
      security_invoker: true,
      anon_execute: false,
      authenticated_execute: true
    });

    await db.exec(`
      insert into auth.users (id) values
        ('${administratorId}'::uuid),
        ('${memberId}'::uuid)
      on conflict do nothing;
      create or replace function auth.uid() returns uuid language sql stable as $$
        select '${administratorId}'::uuid
      $$;
      create or replace function auth.jwt() returns jsonb language sql stable as $$
        select '{"email":"m.andrew.davies@gmail.com","app_metadata":{"role":"admin"}}'::jsonb
      $$;
      set role authenticated;
    `);
    try {
      const result = await db.query<{ get_admin_coverage_breakdown: Record<string, unknown> }>(`
        select public.get_admin_coverage_breakdown()
      `);
      const summary = result.rows[0]?.get_admin_coverage_breakdown;
      expect(summary).toBeTruthy();
      expect(Object.keys(summary ?? {}).sort()).toEqual(["missionAreas", "publicNeeds", "regions", "technicalDomains"]);
      expect(summary?.regions).toEqual(expect.arrayContaining([expect.objectContaining({ label: "Canada", count: 18 })]));
      expect(Array.isArray(summary?.technicalDomains)).toBe(true);
      expect(Array.isArray(summary?.missionAreas)).toBe(true);
      expect(Array.isArray(summary?.publicNeeds)).toBe(true);
    } finally {
      await db.exec("reset role");
    }

    await db.exec(`
      create or replace function auth.uid() returns uuid language sql stable as $$
        select '${memberId}'::uuid
      $$;
      create or replace function auth.jwt() returns jsonb language sql stable as $$
        select '{"email":"member@example.ca","app_metadata":{"role":"member"}}'::jsonb
      $$;
      set role authenticated;
    `);
    try {
      await expect(db.query("select public.get_admin_coverage_breakdown()"))
        .rejects.toThrow("requires the authenticated atlas owner");
    } finally {
      await db.exec("reset role");
    }

    await db.exec(`
      delete from auth.users where id = '${memberId}'::uuid;
      create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
      create or replace function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
    `);
  });

  it("keeps the shared member-workflow quota trigger table-safe", async () => {
    const memberId = "b7777777-7777-4777-a777-777777777777";
    const firstRequestId = "b8888888-8888-4888-a888-888888888888";
    const secondRequestId = "b9999999-9999-4999-a999-999999999999";
    const organization = await db.query<{ id: string }>(`
      select id from public.organizations where slug = 'kraken-robotics'
    `);
    const organizationId = organization.rows[0]?.id;
    expect(organizationId).toBeTruthy();

    await db.exec(`
      insert into auth.users (id) values ('${memberId}'::uuid) on conflict do nothing;
      create or replace function auth.uid() returns uuid language sql stable as $$
        select '${memberId}'::uuid
      $$;
      create or replace function auth.jwt() returns jsonb language sql stable as $$
        select '{"email":"member@example.ca","app_metadata":{"role":"member"}}'::jsonb
      $$;
      set role authenticated;
    `);
    try {
      await db.query(
        `insert into public.connection_requests (
          id, requester_id, organization_id, intent, message, requester_name, requester_email
        ) values ($1, $2, $3, 'partnership', $4, 'Member Fixture', 'member@example.ca')`,
        [firstRequestId, memberId, organizationId, "A bounded fixture verifies that the shared quota trigger reads the correct row fields."]
      );
      await expect(db.query(
        `insert into public.connection_requests (
          id, requester_id, organization_id, intent, message, requester_name, requester_email
        ) values ($1, $2, $3, 'partnership', $4, 'Member Fixture', 'member@example.ca')`,
        [secondRequestId, memberId, organizationId, "A duplicate request to the same organization must remain blocked by the existing quota."]
      )).rejects.toThrow("Daily connection limit reached for the same organization");
    } finally {
      await db.exec("reset role");
    }

    const result = await db.query<{ count: number }>(`
      select count(*)::int as count from public.connection_requests
      where requester_id = '${memberId}'::uuid
    `);
    expect(result.rows[0]?.count).toBe(1);

    await db.exec(`
      delete from public.connection_requests where requester_id = '${memberId}'::uuid;
      delete from auth.users where id = '${memberId}'::uuid;
      create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
      create or replace function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
    `);
  });

  it("keeps Defence Brief links inside the current published-record boundary for every reader", async () => {
    const administratorId = "b443c433-2a78-4ca7-8a19-a8f40b140049";
    const memberId = "b6666666-6666-4666-a666-666666666666";
    const pageId = "b1111111-1111-4111-a111-111111111111";
    const publishedOrganizationId = "b2222222-2222-4222-a222-222222222222";
    const draftOrganizationId = "b3333333-3333-4333-a333-333333333333";
    const linkId = "b4444444-4444-4444-a444-444444444444";

    await db.exec(`
      insert into auth.users (id) values
        ('${administratorId}'::uuid),
        ('${memberId}'::uuid)
      on conflict do nothing;
      insert into public.organizations (
        id, slug, name, description, organization_categories, publication_status, published_at
      ) values
        ('${publishedOrganizationId}'::uuid, 'published-brief-link-fixture', 'Published Brief Link Fixture',
         'A published organization created only to verify the Defence Brief related-record read boundary.',
         array['company'], 'published', now()),
        ('${draftOrganizationId}'::uuid, 'draft-brief-link-fixture', 'Draft Brief Link Fixture',
         'A draft organization created only to verify invalid Defence Brief related-record writes are rejected.',
         array['company'], 'draft', null);
      insert into public.wiki_pages (
        id, slug, title, primary_question, summary_answer, dek, sections,
        seo_title, meta_description, publication_status, reviewed_by, reviewed_at, published_at
      ) values (
        '${pageId}'::uuid,
        'published-brief-link-policy-fixture',
        'Published Brief Link Policy Fixture',
        'Which related records may a published Defence Brief expose?',
        'A public Defence Brief may expose only related records that remain inside the current published-record boundary.',
        'This isolated fixture verifies the public, authenticated-member, and administrator reading contract for related records.',
        '[]'::jsonb,
        'Published Brief Link Policy Fixture',
        'An isolated verification fixture for the Defence Brief related-record visibility and write-validation contract.',
        'published', '${administratorId}'::uuid, now(), now()
      );
      insert into public.wiki_page_record_links (
        id, page_id, record_type, record_id, relationship_label, display_order
      ) values (
        '${linkId}'::uuid, '${pageId}'::uuid, 'organization', '${publishedOrganizationId}'::uuid,
        'Published relationship fixture', 1
      );
    `);

    await expect(db.exec(`
      insert into public.wiki_page_record_links (
        page_id, record_type, record_id, relationship_label, display_order
      ) values (
        '${pageId}'::uuid, 'organization', '${draftOrganizationId}'::uuid,
        'Draft relationship fixture', 2
      )
    `)).rejects.toThrow("only to a published organization");

    await db.exec("set role anon");
    try {
      const visible = await db.query<{ count: number }>(`
        select count(*)::int as count from public.wiki_page_record_links where id = '${linkId}'::uuid
      `);
      expect(visible.rows[0]?.count).toBe(1);
    } finally {
      await db.exec("reset role");
    }

    await db.exec(`
      update public.organizations set publication_status = 'draft', published_at = null
      where id = '${publishedOrganizationId}'::uuid;
      create or replace function auth.uid() returns uuid language sql stable as $$
        select '${memberId}'::uuid
      $$;
      create or replace function auth.jwt() returns jsonb language sql stable as $$
        select '{"email":"member@example.ca","app_metadata":{"role":"member"}}'::jsonb
      $$;
    `);
    await db.exec("set role anon");
    try {
      const hidden = await db.query<{ count: number }>(`
        select count(*)::int as count from public.wiki_page_record_links where id = '${linkId}'::uuid
      `);
      expect(hidden.rows[0]?.count).toBe(0);
    } finally {
      await db.exec("reset role");
    }
    await db.exec("set role authenticated");
    try {
      const hidden = await db.query<{ count: number }>(`
        select count(*)::int as count from public.wiki_page_record_links where id = '${linkId}'::uuid
      `);
      expect(hidden.rows[0]?.count).toBe(0);
    } finally {
      await db.exec("reset role");
    }

    await db.exec(`
      create or replace function auth.uid() returns uuid language sql stable as $$
        select '${administratorId}'::uuid
      $$;
      create or replace function auth.jwt() returns jsonb language sql stable as $$
        select '{"email":"m.andrew.davies@gmail.com","app_metadata":{"role":"admin"}}'::jsonb
      $$;
      set role authenticated;
    `);
    try {
      const visible = await db.query<{ count: number }>(`
        select count(*)::int as count from public.wiki_page_record_links where id = '${linkId}'::uuid
      `);
      expect(visible.rows[0]?.count).toBe(1);
    } finally {
      await db.exec("reset role");
    }

    await db.exec(`
      delete from public.wiki_pages where id = '${pageId}'::uuid;
      delete from public.organizations where id in ('${publishedOrganizationId}'::uuid, '${draftOrganizationId}'::uuid);
      delete from auth.users where id = '${memberId}'::uuid;
      create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
      create or replace function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
    `);
  });

  it("keeps logo media reviewable and restricts mutations to staff or the service importer", async () => {
    const result = await db.query<{
      anon_media_read: boolean;
      anon_media_insert: boolean;
      authenticated_replace: boolean;
      authenticated_import: boolean;
      anon_storage_list_policies: number;
      replace_security: string;
      import_security: string;
    }>(`
      select
        has_table_privilege('anon', 'public.media_assets', 'select') as anon_media_read,
        has_table_privilege('anon', 'public.media_assets', 'insert') as anon_media_insert,
        has_function_privilege('authenticated', 'public.replace_published_organization_logo(uuid,uuid,text,text,text,text,text,text,text)', 'execute') as authenticated_replace,
        has_function_privilege('authenticated', 'public.import_published_organization_logo(uuid,text,text,text,text,text,text,text,text)', 'execute') as authenticated_import,
        (
          select count(*)::int from pg_policies
          where schemaname = 'storage' and tablename = 'objects'
            and roles::text like '%anon%'
            and cmd = 'SELECT'
        ) as anon_storage_list_policies,
        (
          select prosecdef::text from pg_proc function_record
          join pg_namespace namespace on namespace.oid = function_record.pronamespace
          where namespace.nspname = 'public' and function_record.proname = 'replace_published_organization_logo'
        ) as replace_security,
        (
          select prosecdef::text from pg_proc function_record
          join pg_namespace namespace on namespace.oid = function_record.pronamespace
          where namespace.nspname = 'public' and function_record.proname = 'import_published_organization_logo'
        ) as import_security
    `);
    expect(result.rows[0]).toEqual({
      anon_media_read: true,
      anon_media_insert: false,
      authenticated_replace: true,
      authenticated_import: false,
      anon_storage_list_policies: 0,
      replace_security: "false",
      import_security: "false"
    });

    const publicPolicy = await db.query<{ qual: string }>(`
      select qual from pg_policies
      where schemaname = 'public' and tablename = 'media_assets' and policyname = 'approved media is readable'
    `);
    expect(publicPolicy.rows[0]?.qual).toContain("approval_status = 'approved'");
    expect(publicPolicy.rows[0]?.qual).toContain("publication_status = 'published'");
    expect(publicPolicy.rows[0]?.qual).toContain("source_visibility");
  });

  it("imports a high-confidence logo atomically with provenance and an audit event", async () => {
    const organization = await db.query<{ id: string }>(`
      select id from public.organizations where slug = 'kraken-robotics'
    `);
    const organizationId = organization.rows[0]?.id;
    expect(organizationId).toBeTruthy();
    const checksum = "a".repeat(64);
    const storagePath = `organizations/${organizationId}/logos/${checksum}.webp`;

    await db.exec("set role service_role");
    try {
      await db.query(
        `select public.import_published_organization_logo($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          organizationId,
          storagePath,
          "https://www.krakenrobotics.com/",
          "https://www.krakenrobotics.com/logo.svg",
          "json_ld_logo",
          "high",
          checksum,
          "Kraken Robotics official logo",
          "logo-migration-test"
        ]
      );

      await expect(
        db.query(
          `select public.import_published_organization_logo($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            organizationId,
            `organizations/${organizationId}/logos/wrong.webp`,
            "https://www.krakenrobotics.com/",
            "https://www.krakenrobotics.com/logo.svg",
            "json_ld_logo",
            "high",
            checksum,
            "Kraken Robotics official logo",
            "logo-migration-test"
          ]
        )
      ).rejects.toThrow("Invalid immutable organization logo path");
    } finally {
      await db.exec("reset role");
    }

    const result = await db.query<{ media_count: number; audit_count: number }>(`
      select
        (select count(*)::int from public.media_assets
          where organization_id = '${organizationId}'::uuid
            and asset_type = 'logo'
            and approval_status = 'approved'
            and publication_status = 'published') as media_count,
        (select count(*)::int from public.audit_events
          where entity_id = '${organizationId}'::uuid
            and event_type = 'organization_logo_imported'
            and metadata ->> 'run_id' = 'logo-migration-test') as audit_count
    `);
    expect(result.rows[0]).toEqual({ media_count: 1, audit_count: 1 });
  });

  it("lets the exact administrator replace and remove a logo while preserving the audit trail", async () => {
    const administratorId = "b443c433-2a78-4ca7-8a19-a8f40b140049";
    const organization = await db.query<{ id: string }>(`
      select id from public.organizations where slug = 'kraken-robotics'
    `);
    const organizationId = organization.rows[0]?.id;
    const checksum = "b".repeat(64);
    const storagePath = `organizations/${organizationId}/logos/${checksum}.webp`;

    await db.exec(`
      insert into auth.users (id) values ('${administratorId}'::uuid) on conflict do nothing;
      create or replace function auth.uid() returns uuid language sql stable as $$
        select '${administratorId}'::uuid
      $$;
      create or replace function auth.jwt() returns jsonb language sql stable as $$
        select '{"email":"m.andrew.davies@gmail.com","app_metadata":{"role":"admin"}}'::jsonb
      $$;
      set role authenticated;
    `);
    try {
      await db.query(
        `select public.replace_published_organization_logo($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          organizationId,
          administratorId,
          storagePath,
          "https://www.krakenrobotics.com/",
          "https://www.krakenrobotics.com/logo.svg",
          "administrator_upload",
          "high",
          checksum,
          "Kraken Robotics official logo"
        ]
      );
      const removed = await db.query<{ remove_published_organization_logo: string[] }>(
        `select public.remove_published_organization_logo($1, $2)`,
        [organizationId, administratorId]
      );
      expect(removed.rows[0]?.remove_published_organization_logo).toEqual([storagePath]);
    } finally {
      await db.exec(`
        reset role;
        create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
        create or replace function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
      `);
    }

    const result = await db.query<{ active_count: number; replacement_audits: number; removal_audits: number }>(`
      select
        (select count(*)::int from public.media_assets
          where organization_id = '${organizationId}'::uuid
            and asset_type = 'logo' and publication_status = 'published') as active_count,
        (select count(*)::int from public.audit_events
          where entity_id = '${organizationId}'::uuid
            and event_type = 'organization_logo_replaced'
            and actor_id = '${administratorId}'::uuid) as replacement_audits,
        (select count(*)::int from public.audit_events
          where entity_id = '${organizationId}'::uuid
            and event_type = 'organization_logo_removed'
            and actor_id = '${administratorId}'::uuid) as removal_audits
    `);
    expect(result.rows[0]).toEqual({ active_count: 0, replacement_audits: 1, removal_audits: 1 });
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
    await db.exec(`
      insert into public.sources (
        id, title, canonical_url, publisher, source_type, visibility, public_approved
      ) values (
        'f1000000-0000-4000-a000-000000000001',
        'Private field-citation policy fixture',
        null,
        'True North Map Test Fixture',
        'internal_note',
        'internal',
        false
      );
      insert into public.evidence_snippets (
        id, source_id, excerpt, visibility, public_approved
      ) values (
        'f2000000-0000-4000-a000-000000000001',
        'f1000000-0000-4000-a000-000000000001',
        'This private evidence must remain invisible to every public Data API reader.',
        'internal',
        false
      );
      insert into public.programs (
        id, slug, name, program_type, summary, publication_status
      ) values (
        'f3000000-0000-4000-a000-000000000001',
        'draft-citation-policy-fixture',
        'Draft Citation Policy Fixture',
        'test programme',
        'This unpublished programme exists only to prove that a public source cannot expose a draft parent record.',
        'draft'
      );
      insert into public.field_citations (
        id, entity_type, entity_id, field_name, evidence_snippet_id
      ) values
      (
        'f4000000-0000-4000-a000-000000000001',
        'program',
        '91000000-0000-4000-8000-000000000001',
        'summary',
        'f2000000-0000-4000-a000-000000000001'
      ),
      (
        'f4000000-0000-4000-a000-000000000002',
        'program',
        'f3000000-0000-4000-a000-000000000001',
        'summary',
        (
          select evidence_snippet_id
          from public.field_citations
          where entity_type = 'program'
            and entity_id = '91000000-0000-4000-8000-000000000001'
            and field_name = 'summary'
          limit 1
        )
      );
      create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
      create or replace function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
    `);

    const readCitationMatrix = () => db.query<{
      published_program: number;
      published_participation: number;
      draft_program: number;
    }>(`
      select
        count(*) filter (
          where entity_type = 'program'
            and entity_id = '91000000-0000-4000-8000-000000000001'
            and field_name = 'summary'
        )::int as published_program,
        count(*) filter (
          where entity_type = 'program_participation'
            and entity_id = '92000000-0000-4000-8000-000000000001'
            and field_name = 'public_summary'
        )::int as published_participation,
        count(*) filter (
          where entity_type = 'program'
            and entity_id = 'f3000000-0000-4000-a000-000000000001'
        )::int as draft_program
      from public.field_citations
    `);

    try {
      await db.exec("set role anon");
      const publicResult = await db.query<{ count: number }>("select count(*)::int as count from public.organizations");
      expect(publicResult.rows[0]?.count).toBe(18);
      const dossierResult = await db.query<{ count: number }>("select count(*)::int as count from public.organization_dossiers");
      expect(dossierResult.rows[0]?.count).toBe(18);
      expect((await readCitationMatrix()).rows[0]).toEqual({
        published_program: 1,
        published_participation: 1,
        draft_program: 0
      });
      await expect(db.query("select * from public.candidate_changes")).rejects.toThrow();
    } finally {
      await db.exec("reset role");
    }

    try {
      await db.exec("set role authenticated");
      expect((await readCitationMatrix()).rows[0]).toEqual({
        published_program: 1,
        published_participation: 1,
        draft_program: 0
      });
    } finally {
      await db.exec("reset role");
    }

    await db.exec(`
      create or replace function auth.uid() returns uuid language sql stable as $$
        select 'b443c433-2a78-4ca7-8a19-a8f40b140049'::uuid
      $$;
      create or replace function auth.jwt() returns jsonb language sql stable as $$
        select '{"email":"m.andrew.davies@gmail.com","app_metadata":{"role":"admin"}}'::jsonb
      $$;
    `);
    try {
      await db.exec("set role authenticated");
      expect((await readCitationMatrix()).rows[0]).toEqual({
        published_program: 2,
        published_participation: 1,
        draft_program: 1
      });
    } finally {
      await db.exec("reset role");
    }
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
      anon_refresh_helper: boolean;
      authenticated_refresh_helper: boolean;
      service_refresh_helper: boolean;
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
        has_function_privilege('anon', 'private.refresh_candidate_baseline_text(text, jsonb)', 'execute') as anon_refresh_helper,
        has_function_privilege('authenticated', 'private.refresh_candidate_baseline_text(text, jsonb)', 'execute') as authenticated_refresh_helper,
        has_function_privilege('service_role', 'private.refresh_candidate_baseline_text(text, jsonb)', 'execute') as service_refresh_helper,
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
      anon_refresh_helper: false,
      authenticated_refresh_helper: false,
      service_refresh_helper: true,
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

  it("validates, stages, and atomically publishes the v3 dossier and v2 refresh contracts", async () => {
    const administratorId = "b443c433-2a78-4ca7-8a19-a8f40b140049";
    const organizationCandidate = buildMinimalOrganizationV3Candidate();
    const initialExecutiveSummary = "This organization demonstrates a publicly documented Canadian sensing role that may help decision teams compare programme fit and identify a bounded technical-verification conversation.";
    Object.assign(organizationCandidate.organization, { executiveRelevanceSummary: initialExecutiveSummary });
    organizationCandidate.fieldEvidence.push({
      id: "candidate-dossier-v3-executive-relevance-evidence",
      sourceId: organizationCandidate.sources[0].id,
      fieldPath: "organization.executiveRelevanceSummary",
      claimClass: "derived",
      excerpt: "The official fixture source documents the Canadian sensing role and programme participation synthesized in this bounded decision snapshot.",
      confidence: "high"
    });
    const stagedOrganization = await db.query<{ staged_count: number; skipped_count: number }>(
      "select staged_count, skipped_count from public.stage_research_candidates_for_review($1::jsonb, $2::jsonb)",
      [JSON.stringify(dossierFixtureResearchRun), JSON.stringify([buildStagingCandidate(organizationCandidate)])]
    );
    expect(stagedOrganization.rows[0]).toEqual({ staged_count: 1, skipped_count: 0 });
    await db.query("update public.candidate_changes set status = 'approved' where client_candidate_id = $1", [organizationCandidate.candidateId]);

    const publishedOrganization = await db.query<{ entity_id: string; entity_slug: string }>(`
      select entity_id::text, entity_slug
      from public.publish_reviewed_research_candidates(
        array(select id from public.candidate_changes where client_candidate_id = '${organizationCandidate.candidateId}'),
        '${administratorId}'::uuid
      )
    `);
    expect(publishedOrganization.rows[0]?.entity_slug).toBe("dossier-v3-fixture");
    const organizationId = publishedOrganization.rows[0]?.entity_id;
    if (!organizationId) throw new Error("The v3 fixture did not publish an organization ID.");

    const afterV3 = await db.query<{
      updated_at: string;
      editorial_profile_version: string;
      capabilities: number;
      programs: number;
      funding_events: number;
      relationships: number;
      description_citations: number;
      executive_relevance_summary: string;
      executive_relevance_citations: number;
      dossier_executive_relevance_summary: string;
      dossier_programs: number;
      dossier_funding_events: number;
      dossier_relationships: number;
    }>(`
      select
        organization_record.updated_at::text,
        organization_record.editorial_profile_version,
        (select count(*)::int from public.capabilities where organization_id = organization_record.id) as capabilities,
        (select count(*)::int from public.program_participations where organization_id = organization_record.id) as programs,
        (select count(*)::int from public.funding_events where organization_id = organization_record.id) as funding_events,
        (select count(*)::int from public.organization_relationships where organization_id = organization_record.id) as relationships,
        (select count(*)::int from public.field_citations where entity_type = 'organization' and entity_id = organization_record.id and field_name = 'description') as description_citations,
        organization_record.executive_relevance_summary,
        (select count(*)::int from public.field_citations where entity_type = 'organization' and entity_id = organization_record.id and field_name = 'executive_relevance_summary') as executive_relevance_citations,
        dossier.executive_relevance_summary as dossier_executive_relevance_summary,
        jsonb_array_length(dossier.programs)::int as dossier_programs,
        jsonb_array_length(dossier.funding_events)::int as dossier_funding_events,
        jsonb_array_length(dossier.relationships)::int as dossier_relationships
      from public.organizations organization_record
      join public.organization_dossiers dossier on dossier.id = organization_record.id
      where organization_record.id = '${organizationId}'::uuid
    `);
    expect(afterV3.rows[0]).toMatchObject({
      editorial_profile_version: "organization_editorial_profile_v1",
      capabilities: 1,
      programs: 1,
      funding_events: 1,
      relationships: 1,
      description_citations: 1,
      executive_relevance_summary: initialExecutiveSummary,
      executive_relevance_citations: 1,
      dossier_executive_relevance_summary: initialExecutiveSummary,
      dossier_programs: 1,
      dossier_funding_events: 1,
      dossier_relationships: 1
    });
    const originalBaseline = afterV3.rows[0]?.updated_at;
    if (!originalBaseline) throw new Error("The v3 fixture did not preserve an updated_at baseline.");

    const refreshCandidate = buildMinimalOrganizationRefreshV2Candidate({ organizationId, baselineUpdatedAt: originalBaseline });
    const stagedRefresh = await db.query<{ staged_count: number; skipped_count: number }>(
      "select staged_count, skipped_count from public.stage_research_candidates_for_review($1::jsonb, $2::jsonb)",
      [JSON.stringify(dossierFixtureResearchRun), JSON.stringify([buildStagingCandidate(refreshCandidate)])]
    );
    expect(stagedRefresh.rows[0]).toEqual({ staged_count: 1, skipped_count: 0 });
    await db.query("update public.candidate_changes set status = 'approved' where client_candidate_id = $1", [refreshCandidate.candidateId]);
    await db.query(`
      select * from public.publish_reviewed_research_candidates(
        array(select id from public.candidate_changes where client_candidate_id = '${refreshCandidate.candidateId}'),
        '${administratorId}'::uuid
      )
    `);

    const afterRefresh = await db.query<{
      operating_context: string;
      updated_at: string;
      citations: number;
      audits: number;
    }>(`
      select
        organization_record.operating_context,
        organization_record.updated_at::text,
        (select count(*)::int from public.field_citations where entity_type = 'organization' and entity_id = organization_record.id and field_name = 'operating_context') as citations,
        (select count(*)::int from public.audit_events where entity_type = 'organization' and entity_id = organization_record.id and metadata->>'schema_version' = 'organization_refresh_bundle_v2') as audits
      from public.organizations organization_record
      where organization_record.id = '${organizationId}'::uuid
    `);
    expect(afterRefresh.rows[0]).toMatchObject({
      operating_context: "The fixture company operates a bounded Canadian sensing-integration workflow for public migration testing.",
      citations: 1,
      audits: 1
    });

    const stale = buildMinimalOrganizationRefreshV2Candidate({
      organizationId,
      baselineUpdatedAt: originalBaseline,
      candidateId: "candidate-dossier-refresh-v2-stale"
    });
    await db.query(
      "select * from public.stage_research_candidates_for_review($1::jsonb, $2::jsonb)",
      [JSON.stringify(dossierFixtureResearchRun), JSON.stringify([buildStagingCandidate(stale)])]
    );
    await db.query("update public.candidate_changes set status = 'approved' where client_candidate_id = $1", [stale.candidateId]);
    await expect(db.query(`
      select * from public.publish_reviewed_research_candidates(
        array(select id from public.candidate_changes where client_candidate_id = '${stale.candidateId}'),
        '${administratorId}'::uuid
      )
    `)).rejects.toThrow(/stale baseline/i);

    const currentBaseline = afterRefresh.rows[0]?.updated_at;
    if (!currentBaseline) throw new Error("The refresh fixture did not advance updated_at.");
    const unsafe = buildMinimalOrganizationRefreshV2Candidate({
      organizationId,
      baselineUpdatedAt: currentBaseline,
      candidateId: "candidate-dossier-refresh-v2-unsafe-profile",
      field: "profile_data"
    });
    await db.query(
      "select * from public.stage_research_candidates_for_review($1::jsonb, $2::jsonb)",
      [JSON.stringify(dossierFixtureResearchRun), JSON.stringify([buildStagingCandidate(unsafe)])]
    );
    await db.query("update public.candidate_changes set status = 'approved' where client_candidate_id = $1", [unsafe.candidateId]);
    await expect(db.query(`
      select * from public.publish_reviewed_research_candidates(
        array(select id from public.candidate_changes where client_candidate_id = '${unsafe.candidateId}'),
        '${administratorId}'::uuid
      )
    `)).rejects.toThrow(/unsafe organization field/i);
  });

  it("publishes, idempotently rechecks, clears, and stale-guards an executive relevance refresh", async () => {
    const administratorId = "b443c433-2a78-4ca7-8a19-a8f40b140049";
    const organization = await db.query<{ id: string; updated_at: string; executive_relevance_summary: string | null }>(`
      select id::text, updated_at::text, executive_relevance_summary
      from public.organizations
      where slug = 'dossier-v3-fixture'
    `);
    const organizationId = organization.rows[0]?.id;
    const baseline = organization.rows[0]?.updated_at;
    const existingSummary = organization.rows[0]?.executive_relevance_summary ?? null;
    if (!organizationId || !baseline || !existingSummary) throw new Error("The dossier-v3 fixture is missing its executive relevance baseline.");
    const summary = "This organization demonstrates a supported Canadian sensing-integration role that may help a decision team compare public programme fit and identify the next technical-verification conversation.";

    const executiveCandidateBase = buildMinimalOrganizationRefreshV2Candidate({
      organizationId,
      baselineUpdatedAt: baseline,
      candidateId: "candidate-executive-relevance-set"
    });
    const executiveEvidence = {
      ...executiveCandidateBase.fieldEvidence[0],
      id: "candidate-executive-relevance-set-evidence",
      fieldPath: "executiveRelevanceSummary",
      claimClass: "derived" as const,
      excerpt: "The official fixture source documents the sensing role and public programme participation synthesized in the decision snapshot."
    };
    const executiveCandidate = {
      ...executiveCandidateBase,
      executiveRelevanceSummary: summary,
      fieldEvidence: [executiveEvidence],
      operations: [{
        operationId: "set-executive-relevance-summary",
        operation: "set_field" as const,
        entityType: "organization" as const,
        targetId: organizationId,
        field: "executive_relevance_summary" as const,
        before: existingSummary,
        after: summary,
        evidenceIds: [executiveEvidence.id],
        leafEvidence: [{ fieldPath: "after", evidenceIds: [executiveEvidence.id] }],
        reviewerExplanation: "Add the source-grounded TNM assessment describing the supported Canadian sensing role and next technical-verification conversation."
      }]
    };
    const executiveStaging = {
      ...buildStagingCandidate(executiveCandidateBase),
      proposed_record: executiveCandidate,
      field_evidence: executiveCandidate.fieldEvidence
    };
    const researchRun = { ...dossierFixtureResearchRun, client_run_id: "tnm-executive-relevance-set" };
    const staged = await db.query<{ staged_count: number; skipped_count: number }>(
      "select staged_count, skipped_count from public.stage_research_candidates_for_review($1::jsonb, $2::jsonb)",
      [JSON.stringify(researchRun), JSON.stringify([executiveStaging])]
    );
    expect(staged.rows[0]).toEqual({ staged_count: 1, skipped_count: 0 });
    const restaged = await db.query<{ staged_count: number; skipped_count: number }>(
      "select staged_count, skipped_count from public.stage_research_candidates_for_review($1::jsonb, $2::jsonb)",
      [JSON.stringify(researchRun), JSON.stringify([executiveStaging])]
    );
    expect(restaged.rows[0]).toEqual({ staged_count: 1, skipped_count: 0 });
    await db.query("update public.candidate_changes set status = 'approved' where client_candidate_id = $1", [executiveCandidate.candidateId]);
    await db.query(`
      select * from public.publish_reviewed_research_candidates(
        array(select id from public.candidate_changes where client_candidate_id = '${executiveCandidate.candidateId}'),
        '${administratorId}'::uuid
      )
    `);
    const afterSet = await db.query<{ summary: string; updated_at: string; citations: number }>(`
      select executive_relevance_summary as summary, updated_at::text,
        (select count(*)::int from public.field_citations where entity_type = 'organization' and entity_id = '${organizationId}'::uuid and field_name = 'executive_relevance_summary') as citations
      from public.organizations where id = '${organizationId}'::uuid
    `);
    expect(afterSet.rows[0]).toMatchObject({ summary, citations: 2 });
    const restagedAfterPublication = await db.query<{ staged_count: number; skipped_count: number }>(
      "select staged_count, skipped_count from public.stage_research_candidates_for_review($1::jsonb, $2::jsonb)",
      [JSON.stringify(researchRun), JSON.stringify([executiveStaging])]
    );
    expect(restagedAfterPublication.rows[0]).toEqual({ staged_count: 0, skipped_count: 1 });
    await expect(db.query(`
      select * from public.publish_reviewed_research_candidates(
        array(select id from public.candidate_changes where client_candidate_id = '${executiveCandidate.candidateId}'),
        '${administratorId}'::uuid
      )
    `)).rejects.toThrow(/approved|schema-valid|unsupported/i);

    const setBaseline = afterSet.rows[0]?.updated_at;
    if (!setBaseline) throw new Error("Executive relevance publication did not advance the baseline.");
    const clearBase = buildMinimalOrganizationRefreshV2Candidate({
      organizationId,
      baselineUpdatedAt: setBaseline,
      candidateId: "candidate-executive-relevance-clear"
    });
    const clearEvidence = { ...clearBase.fieldEvidence[0], id: "candidate-executive-relevance-clear-evidence", fieldPath: "executiveRelevanceSummary" };
    const clearCandidate = {
      ...clearBase,
      executiveRelevanceSummary: null,
      beforeRecord: { ...clearBase.beforeRecord, organization: { ...clearBase.beforeRecord.organization, executive_relevance_summary: summary } },
      fieldEvidence: [clearEvidence],
      operations: [{
        operationId: "clear-executive-relevance-summary",
        operation: "set_field" as const,
        entityType: "organization" as const,
        targetId: organizationId,
        field: "executive_relevance_summary" as const,
        before: summary,
        after: null,
        evidenceIds: [clearEvidence.id],
        leafEvidence: [{ fieldPath: "after", evidenceIds: [clearEvidence.id] }],
        reviewerExplanation: "Clear the executive relevance summary because the previously synthesized public decision snapshot is no longer supported."
      }]
    };
    const clearStaging = {
      ...buildStagingCandidate(clearBase),
      proposed_record: clearCandidate,
      before_record: clearCandidate.beforeRecord,
      field_evidence: clearCandidate.fieldEvidence
    };
    await db.query(
      "select staged_count from public.stage_research_candidates_for_review($1::jsonb, $2::jsonb)",
      [JSON.stringify({ ...dossierFixtureResearchRun, client_run_id: "tnm-executive-relevance-clear" }), JSON.stringify([clearStaging])]
    );
    await db.query("update public.candidate_changes set status = 'approved' where client_candidate_id = $1", [clearCandidate.candidateId]);
    await db.query(`
      select * from public.publish_reviewed_research_candidates(
        array(select id from public.candidate_changes where client_candidate_id = '${clearCandidate.candidateId}'),
        '${administratorId}'::uuid
      )
    `);
    const afterClear = await db.query<{ summary: string | null }>("select executive_relevance_summary as summary from public.organizations where id = $1::uuid", [organizationId]);
    expect(afterClear.rows[0]?.summary).toBeNull();

    const staleCandidate = structuredClone(clearCandidate);
    staleCandidate.candidateId = "candidate-executive-relevance-stale";
    staleCandidate.sourceLeadIds = ["candidate-executive-relevance-stale-lead"];
    const staleStaging = {
      ...buildStagingCandidate(clearBase),
      client_candidate_id: staleCandidate.candidateId,
      source_lead_ids: staleCandidate.sourceLeadIds,
      proposed_record: staleCandidate,
      before_record: staleCandidate.beforeRecord,
      field_evidence: staleCandidate.fieldEvidence
    };
    await db.query(
      "select staged_count from public.stage_research_candidates_for_review($1::jsonb, $2::jsonb)",
      [JSON.stringify({ ...dossierFixtureResearchRun, client_run_id: "tnm-executive-relevance-stale" }), JSON.stringify([staleStaging])]
    );
    await db.query("update public.candidate_changes set status = 'approved' where client_candidate_id = $1", [staleCandidate.candidateId]);
    await expect(db.query(`
      select * from public.publish_reviewed_research_candidates(
        array(select id from public.candidate_changes where client_candidate_id = '${staleCandidate.candidateId}'),
        '${administratorId}'::uuid
      )
    `)).rejects.toThrow(/stale baseline/i);
  });

  it("rejects stale child snapshots, keeps leaf evidence order-independent, and advances the parent after direct child correction", async () => {
    const administratorId = "b443c433-2a78-4ca7-8a19-a8f40b140049";
    await db.exec(`
      insert into auth.users (id) values ('${administratorId}') on conflict (id) do nothing;
      create or replace function auth.uid() returns uuid language sql stable as $$
        select '${administratorId}'::uuid
      $$;
      create or replace function auth.jwt() returns jsonb language sql stable as $$
        select '{"email":"m.andrew.davies@gmail.com","app_metadata":{"role":"admin"}}'::jsonb
      $$;
    `);

    const organizationResult = await db.query<{ id: string; updated_at: string }>(`
      select id::text, updated_at::text
      from public.organizations
      where slug = 'dossier-v3-fixture'
    `);
    const organization = organizationResult.rows[0];
    if (!organization) throw new Error("The dossier-v3 organization fixture is missing.");
    const capabilityResult = await db.query<{
      id: string;
      name: string;
      summary: string;
      capability_type: string;
      features: string[];
      applications: string[];
      technical_tags: string[];
    }>(`
      select
        id::text,
        name,
        summary,
        capability_type,
        core_features as features,
        defence_applications as applications,
        technical_tags
      from public.capabilities
      where organization_id = '${organization.id}'::uuid
        and slug = 'dossier-v3-sensing-fixture'
    `);
    const capability = capabilityResult.rows[0];
    if (!capability) throw new Error("The dossier-v3 capability fixture is missing.");

    const capabilityBefore = {
      name: capability.name,
      summary: capability.summary,
      capabilityType: capability.capability_type,
      features: capability.features,
      applications: capability.applications,
      technicalTags: capability.technical_tags,
      technicalDomainSlugs: ["sensing-and-isr"],
      missionMatches: [],
      technologyReadinessLevel: null,
      maturity: null,
      commercialAvailability: null
    };
    const staleBase = buildMinimalOrganizationRefreshV2Candidate({
      organizationId: organization.id,
      baselineUpdatedAt: organization.updated_at,
      candidateId: "candidate-dossier-refresh-v2-stale-child"
    });
    const staleEvidenceId = staleBase.fieldEvidence[0].id;
    const staleCandidate = {
      ...staleBase,
      beforeRecord: { ...staleBase.beforeRecord, capabilities: [{ id: capability.id, ...capabilityBefore }] },
      operations: [{
        operationId: "update-dossier-capability-stale",
        operation: "update_child" as const,
        entityType: "capability" as const,
        parentId: organization.id,
        targetId: capability.id,
        before: capabilityBefore,
        after: { ...capabilityBefore, summary: "A reviewed capability summary that must not overwrite an intervening canonical child correction." },
        evidenceIds: [staleEvidenceId],
        leafEvidence: [
          "name", "summary", "capabilityType", "features.0", "applications.0", "technicalTags.0", "technicalDomainSlugs.0"
        ].map((pathValue) => ({ fieldPath: `after.${pathValue}`, evidenceIds: [staleEvidenceId] })),
        reviewerExplanation: "Update one reviewed capability only if its complete public child snapshot still matches the staged baseline."
      }]
    };
    const staleStaging = {
      ...buildStagingCandidate(staleBase),
      proposed_record: staleCandidate,
      before_record: staleCandidate.beforeRecord,
      field_evidence: staleCandidate.fieldEvidence
    };
    await db.query(
      "select staged_count from public.stage_research_candidates_for_review($1::jsonb, $2::jsonb)",
      [JSON.stringify({ ...dossierFixtureResearchRun, client_run_id: "tnm-dossier-stale-child-fixture" }), JSON.stringify([staleStaging])]
    );
    await db.query("update public.candidate_changes set status = 'approved' where client_candidate_id = $1", [staleCandidate.candidateId]);
    const interveningSummary = "An intervening canonical capability correction made after staging must remain authoritative.";
    await db.query("update public.capabilities set summary = $1, updated_at = now() where id = $2::uuid", [interveningSummary, capability.id]);
    await expect(db.query(`
      select * from public.publish_reviewed_research_candidates(
        array(select id from public.candidate_changes where client_candidate_id = '${staleCandidate.candidateId}'),
        '${administratorId}'::uuid
      )
    `)).rejects.toThrow(/stale child baseline/i);
    const afterRejectedStale = await db.query<{ summary: string }>("select summary from public.capabilities where id = $1::uuid", [capability.id]);
    expect(afterRejectedStale.rows[0]?.summary).toBe(interveningSummary);

    const missionResult = await db.query<{ id: string; slug: string }>(`
      select id::text, slug
      from public.mission_areas
      where publication_status = 'published'
      order by slug
      limit 1
    `);
    const mission = missionResult.rows[0];
    if (!mission) throw new Error("A published mission-area fixture is required.");
    const alignmentSummary = "The reviewed fixture capability may contribute its documented sensing workflow to this published mission context.";
    await db.query(`
      insert into public.capability_mission_matches (
        capability_id, mission_area_id, alignment_summary, match_type, confidence,
        review_status, publication_status
      ) values ($1::uuid, $2::uuid, $3, 'derived', 'moderate', 'approved', 'published')
      on conflict (capability_id, mission_area_id) do update
      set alignment_summary = excluded.alignment_summary,
          match_type = excluded.match_type,
          confidence = excluded.confidence,
          review_status = excluded.review_status,
          publication_status = excluded.publication_status
    `, [capability.id, mission.id, alignmentSummary]);

    const routedBefore = {
      ...capabilityBefore,
      summary: interveningSummary,
      missionMatches: [{
        missionAreaSlug: mission.slug,
        alignmentSummary,
        matchClass: "derived" as const,
        confidence: "moderate" as const
      }]
    };
    const routedBase = buildMinimalOrganizationRefreshV2Candidate({
      organizationId: organization.id,
      baselineUpdatedAt: organization.updated_at,
      candidateId: "candidate-dossier-refresh-v2-leaf-routing"
    });
    const sourceEvidence = {
      ...routedBase.fieldEvidence[0],
      id: "candidate-dossier-refresh-v2-leaf-routing-source-evidence",
      fieldPath: "operations.update-dossier-capability.after.summary"
    };
    const derivedEvidence = {
      ...routedBase.fieldEvidence[0],
      id: "candidate-dossier-refresh-v2-leaf-routing-derived-evidence",
      fieldPath: "operations.update-dossier-capability.after.missionMatches.0.alignmentSummary",
      claimClass: "derived" as const,
      excerpt: "The source-backed capability and reviewed mission context support this bounded True North Map assessment."
    };
    const routedAfter = {
      ...routedBefore,
      summary: "The reviewed capability now retains its stable identity while adding a correctly routed public evidence leaf."
    };
    const sourceLeafPaths = [
      "after.summary", "after.name", "after.capabilityType", "after.features.0", "after.applications.0",
      "after.technicalTags.0", "after.technicalDomainSlugs.0"
    ];
    const routedCandidate = {
      ...routedBase,
      fieldEvidence: [sourceEvidence, derivedEvidence],
      beforeRecord: { ...routedBase.beforeRecord, capabilities: [{ id: capability.id, ...routedBefore }] },
      operations: [{
        operationId: "update-dossier-capability",
        operation: "update_child" as const,
        entityType: "capability" as const,
        parentId: organization.id,
        targetId: capability.id,
        before: routedBefore,
        after: routedAfter,
        evidenceIds: [sourceEvidence.id, derivedEvidence.id],
        leafEvidence: [
          { fieldPath: "after.missionMatches.0.alignmentSummary", evidenceIds: [derivedEvidence.id] },
          { fieldPath: "after.summary", evidenceIds: [sourceEvidence.id] },
          { fieldPath: "after.missionMatches.0.missionAreaSlug", evidenceIds: [derivedEvidence.id] },
          ...sourceLeafPaths.filter((pathValue) => pathValue !== "after.summary").map((fieldPath) => ({ fieldPath, evidenceIds: [sourceEvidence.id] }))
        ],
        reviewerExplanation: "Verify mission evidence first, then preserve capability evidence on the capability regardless of leaf ordering."
      }]
    };
    const routedStaging = {
      ...buildStagingCandidate(routedBase),
      proposed_record: routedCandidate,
      before_record: routedCandidate.beforeRecord,
      field_evidence: routedCandidate.fieldEvidence
    };
    await db.query(
      "select staged_count from public.stage_research_candidates_for_review($1::jsonb, $2::jsonb)",
      [JSON.stringify({ ...dossierFixtureResearchRun, client_run_id: "tnm-dossier-leaf-routing-fixture" }), JSON.stringify([routedStaging])]
    );
    await db.query("update public.candidate_changes set status = 'approved' where client_candidate_id = $1", [routedCandidate.candidateId]);
    await db.query(`
      select * from public.publish_reviewed_research_candidates(
        array(select id from public.candidate_changes where client_candidate_id = '${routedCandidate.candidateId}'),
        '${administratorId}'::uuid
      )
    `);
    const routedCitations = await db.query<{ capability_summary: number; mission_alignment: number; misrouted_summary: number }>(`
      select
        count(*) filter (
          where citation.entity_type = 'capability'
            and citation.entity_id = '${capability.id}'::uuid
            and citation.field_name = 'summary'
        )::int as capability_summary,
        count(*) filter (
          where citation.entity_type = 'capability_mission_match'
            and citation.field_name = 'alignment_summary'
        )::int as mission_alignment,
        count(*) filter (
          where citation.entity_type = 'capability_mission_match'
            and citation.field_name = 'summary'
        )::int as misrouted_summary
      from public.field_citations citation
      join public.evidence_snippets evidence on evidence.id = citation.evidence_snippet_id
      join public.sources source_record on source_record.id = evidence.source_id
      where source_record.canonical_url = '${routedCandidate.sources[0].url}'
    `);
    expect(routedCitations.rows[0]).toEqual({ capability_summary: 1, mission_alignment: 1, misrouted_summary: 0 });

    const participationResult = await db.query<{ id: string; payload: Record<string, unknown> }>(`
      select
        participation.id::text,
        jsonb_build_object(
          'participationType', participation.participation_type,
          'cohortLabel', participation.cohort_label,
          'publicSummary', participation.public_summary,
          'lifecycleStage', participation.lifecycle_stage,
          'announcedOn', participation.announced_on,
          'startedOn', participation.started_on,
          'endedOn', participation.ended_on,
          'externalIdentifiers', participation.external_identifiers
        ) as payload
      from public.program_participations participation
      where participation.organization_id = '${organization.id}'::uuid
      limit 1
    `);
    const participation = participationResult.rows[0];
    if (!participation) throw new Error("The dossier-v3 participation fixture is missing.");
    await db.query("update public.organizations set updated_at = '2026-08-09T00:00:00Z'::timestamptz where id = $1::uuid", [organization.id]);
    await db.query(
      "select public.update_published_organization_dossier_child($1::uuid, 'program_participation', $2::uuid, $3::uuid, $4::jsonb, $5)",
      [organization.id, participation.id, administratorId, JSON.stringify(participation.payload), "Confirm the reviewed child record and advance the aggregate dossier baseline."]
    );
    const parentTimestamp = await db.query<{ advanced: boolean }>(`
      select updated_at > '2026-08-09T00:00:00Z'::timestamptz as advanced
      from public.organizations
      where id = '${organization.id}'::uuid
    `);
    expect(parentTimestamp.rows[0]?.advanced).toBe(true);
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
    await db.exec("update public.organizations set updated_at = '2026-07-23T11:59:59.645435+00:00'::timestamptz where slug = 'kraken-robotics'");
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

    const lossyRecord = structuredClone(proposedRecord);
    lossyRecord.candidateId = "candidate-kraken-lossy-baseline-test";
    lossyRecord.targetMatch.baselineUpdatedAt = new Date(organization.updated_at).toISOString();
    const lossyChange = { ...change, client_candidate_id: lossyRecord.candidateId, proposed_record: lossyRecord };
    await expect(db.query(
      "select staged_count from public.stage_research_candidates_for_review($1::jsonb, $2::jsonb)",
      [JSON.stringify({ ...run, client_run_id: "tnm-lossy-refresh-test-2026-07-23" }), JSON.stringify([lossyChange])]
    )).rejects.toThrow(/changed timestamp precision/i);

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

  it("records and reconciles North Signal delivery preferences atomically and idempotently", async () => {
    const weeklyEventId = "7c776aa6-36a8-47c4-afd3-0035505772d2";
    const bothEventId = "04beebdc-ac6d-4d03-acd4-ce41b9325c04";
    const callConsent = async (email: string, eventId: string, alerts: boolean, occurredAt = "2026-08-26T12:00:00Z") => db.query<{
      result_subscriber_id: number;
      created_global_consent: boolean;
      operation_replayed: boolean;
    }>(`
      select * from public.record_north_signal_consent(
        $1, 'north-signal-weekly-2026-08-v1',
        'By subscribing, you agree to receive the free weekly North Signal email from True North Map. Unsubscribe anytime.',
        $2, 'defence-signal-alerts-2026-08-v1',
        'Also email me when a new Defence Signal is published. I can change this preference or unsubscribe anytime.',
        'newsletter_page', 'migration-test', '/north-signal', repeat('a', 64),
        '11111111-1111-4111-8111-111111111111'::uuid, null::uuid, $3::uuid,
        $4::timestamptz, 'direct', 'qa', null, null, null, null,
        '{"placement":"newsletter_page","device_class":"desktop","content_type":"north_signal_landing","landing_path":"/north-signal"}'::jsonb
      )
    `, [email, alerts, eventId, occurredAt]);

    const backfill = await db.query<{ active_weekly: number; active_alerts: number; unsubscribed_preferences: number; sync_state: string }>(`
      select
        count(*) filter (where signup.email = 'active-backfill-migration-test@example.ca' and preference.stream = 'weekly' and preference.status = 'subscribed')::int active_weekly,
        count(*) filter (where signup.email = 'active-backfill-migration-test@example.ca' and preference.stream = 'signal_alerts')::int active_alerts,
        count(preference.id) filter (where signup.email = 'unsubscribed-backfill-migration-test@example.ca')::int unsubscribed_preferences,
        max(preference.provider_sync_status) filter (where signup.email = 'active-backfill-migration-test@example.ca') sync_state
      from public.pilot_update_signups signup
      left join public.newsletter_subscription_preferences preference on preference.subscriber_id = signup.id
      where signup.email in ('active-backfill-migration-test@example.ca', 'unsubscribed-backfill-migration-test@example.ca')
    `);
    expect(backfill.rows[0]).toEqual({ active_weekly: 1, active_alerts: 0, unsubscribed_preferences: 0, sync_state: "not_configured" });

    await db.exec(`
      insert into public.pilot_update_signups (
        email, consented, consent_text, consent_version, source, landing_path, status
      ) values (
        'migration-window-test@example.ca', true,
        'I agree to receive the free weekly North Signal email and can unsubscribe at any time.',
        'north-signal-weekly-2026-08-v1', 'newsletter_page', '/north-signal', 'subscribed'
      );
      insert into public.pilot_update_signups (
        email, consented, consent_text, consent_version, source, landing_path,
        status, mailing_provider, mailing_provider_subscriber_id,
        mailing_provider_status, mailing_provider_synced_at
      ) values (
        'migration-window-unsubscribe-test@example.ca', true,
        'I agree to receive the free weekly North Signal email and can unsubscribe at any time.',
        'north-signal-weekly-2026-08-v1', 'newsletter_page', '/north-signal',
        'subscribed', 'mailerlite', 'migration-window-provider', 'active',
        '2026-08-26T12:00:00Z'
      );
      insert into public.newsletter_subscription_preferences (
        subscriber_id, stream, status, consent_version, consent_text,
        consented_at, provider_sync_status
      )
      select id, 'weekly', 'subscribed', consent_version, consent_text,
        '2026-08-26T12:00:00Z', 'not_configured'
      from public.pilot_update_signups
      where email = 'migration-window-unsubscribe-test@example.ca';
      update public.pilot_update_signups
      set status = 'unsubscribed', mailing_provider_status = 'unsubscribed',
          mailing_provider_synced_at = '2026-08-26T12:05:00Z'
      where email = 'migration-window-unsubscribe-test@example.ca';
    `);
    await db.exec(await readFile(path.join(migrationDirectory, "20260827100553_north_signal_post_deploy_preference_reconciliation.sql"), "utf8"));
    const transitionBackfill = await db.query<{ weekly: number; alerts: number }>(`
      select
        count(*) filter (where preference.stream = 'weekly' and preference.status = 'subscribed')::int weekly,
        count(*) filter (where preference.stream = 'signal_alerts')::int alerts
      from public.pilot_update_signups signup
      left join public.newsletter_subscription_preferences preference on preference.subscriber_id = signup.id
      where signup.email = 'migration-window-test@example.ca'
    `);
    expect(transitionBackfill.rows[0]).toEqual({ weekly: 1, alerts: 0 });
    const transitionWithdrawal = await db.query<{ active_streams: number; global_status: string; sync_status: string; histories: number }>(`
      select
        (select count(*)::int from public.newsletter_subscription_preferences preference where preference.subscriber_id = signup.id and preference.status = 'subscribed') active_streams,
        signup.status global_status,
        (select max(preference.provider_sync_status) from public.newsletter_subscription_preferences preference where preference.subscriber_id = signup.id) sync_status,
        (
          select count(*)::int
          from public.newsletter_subscription_preference_history history
          where history.subscriber_id = signup.id
            and history.source = 'post_deploy_global_withdrawal'
        ) histories
      from public.pilot_update_signups signup
      where signup.email = 'migration-window-unsubscribe-test@example.ca'
    `);
    expect(transitionWithdrawal.rows[0]).toEqual({ active_streams: 0, global_status: "unsubscribed", sync_status: "synced", histories: 1 });

    await db.exec("set role service_role");
    try {
      const first = await callConsent("weekly-only-migration-test@example.ca", weeklyEventId, false);
      expect(first.rows[0]).toMatchObject({ created_global_consent: true, operation_replayed: false });
      const retry = await callConsent("weekly-only-migration-test@example.ca", weeklyEventId, false);
      expect(retry.rows[0]).toMatchObject({
        result_subscriber_id: first.rows[0].result_subscriber_id,
        created_global_consent: false,
        operation_replayed: true
      });
      await expect(callConsent("different-address-migration-test@example.ca", weeklyEventId, false)).rejects.toThrow(/another operation/i);

      const both = await callConsent("both-streams-migration-test@example.ca", bothEventId, true);
      const bothSubscriberId = both.rows[0].result_subscriber_id;
      const initial = await db.query<{ active_streams: number; histories: number; successes: number }>(`
        select
          (select count(*)::int from public.newsletter_subscription_preferences where subscriber_id = $1 and status = 'subscribed') active_streams,
          (select count(*)::int from public.newsletter_subscription_preference_history where subscriber_id = $1 and action = 'consented') histories,
          (select count(*)::int from public.pilot_events where event_id in ('${weeklyEventId}'::uuid, '${bothEventId}'::uuid) and event_name = 'newsletter_success') successes
      `, [bothSubscriberId]);
      expect(initial.rows[0]).toEqual({ active_streams: 2, histories: 2, successes: 2 });

      await db.query(`select * from public.reconcile_north_signal_provider_event(
        'both-streams-migration-test@example.ca', 'provider-2', 'active', 'group_removed',
        'weekly', 'weekly-group', 'provider-remove-weekly', now(),
        false, 'north-signal-weekly-2026-08-v1',
        'By subscribing, you agree to receive the free weekly North Signal email from True North Map. Unsubscribe anytime.'
      )`);
      const alertsOnly = await db.query<{ active_streams: number; global_status: string }>(`
        select
          (select count(*)::int from public.newsletter_subscription_preferences where subscriber_id = $1 and status = 'subscribed') active_streams,
          (select status from public.pilot_update_signups where id = $1) global_status
      `, [bothSubscriberId]);
      expect(alertsOnly.rows[0]).toEqual({ active_streams: 1, global_status: "subscribed" });

      await db.query(`select * from public.reconcile_north_signal_provider_event(
        'both-streams-migration-test@example.ca', 'provider-2', 'active', 'group_removed',
        'signal_alerts', 'alerts-group', 'provider-remove-alerts', now(),
        false, 'defence-signal-alerts-2026-08-v1',
        'Also email me when a new Defence Signal is published. I can change this preference or unsubscribe anytime.'
      )`);
      const none = await db.query<{ active_streams: number; global_status: string }>(`
        select
          (select count(*)::int from public.newsletter_subscription_preferences where subscriber_id = $1 and status = 'subscribed') active_streams,
          (select status from public.pilot_update_signups where id = $1) global_status
      `, [bothSubscriberId]);
      expect(none.rows[0]).toEqual({ active_streams: 0, global_status: "unsubscribed" });

      await db.query(`select * from public.reconcile_north_signal_provider_event(
        'both-streams-migration-test@example.ca', 'provider-2', 'active', 'group_added',
        'weekly', 'weekly-group', 'provider-add-without-consent', '2026-08-26T13:10:00Z',
        false, 'north-signal-weekly-2026-08-v1',
        'By subscribing, you agree to receive the free weekly North Signal email from True North Map. Unsubscribe anytime.'
      )`);
      const notInvented = await db.query<{ active_streams: number }>("select count(*)::int active_streams from public.newsletter_subscription_preferences where subscriber_id = $1 and status = 'subscribed'", [bothSubscriberId]);
      expect(notInvented.rows[0].active_streams).toBe(0);

      const renewedEventId = "86a8c0de-f315-4ada-9a9a-32d5810e5a75";
      await callConsent("both-streams-migration-test@example.ca", renewedEventId, false, "2026-08-26T14:00:00Z");
      await db.query(`select * from public.reconcile_north_signal_provider_event(
        'both-streams-migration-test@example.ca', 'provider-2', 'active', 'group_removed',
        'weekly', 'weekly-group', 'provider-remove-weekly', now(),
        false, 'north-signal-weekly-2026-08-v1',
        'By subscribing, you agree to receive the free weekly North Signal email from True North Map. Unsubscribe anytime.'
      )`);
      await db.query(`select * from public.reconcile_north_signal_provider_event(
        'both-streams-migration-test@example.ca', 'provider-2', 'active', 'group_removed',
        'weekly', 'weekly-group', 'provider-remove-weekly-stale-distinct', '2020-08-26T13:01:00Z',
        false, 'north-signal-weekly-2026-08-v1',
        'By subscribing, you agree to receive the free weekly North Signal email from True North Map. Unsubscribe anytime.'
      )`);
      const weeklyAgain = await db.query<{ active_streams: number; global_status: string; receipts: number }>(`
        select
          (select count(*)::int from public.newsletter_subscription_preferences where subscriber_id = $1 and status = 'subscribed') active_streams,
          (select status from public.pilot_update_signups where id = $1) global_status,
          (select count(*)::int from public.newsletter_provider_event_receipts where event_key in ('provider-remove-weekly', 'provider-remove-weekly-stale-distinct')) receipts
      `, [bothSubscriberId]);
      expect(weeklyAgain.rows[0]).toEqual({ active_streams: 1, global_status: "subscribed", receipts: 2 });

      await db.query(`select * from public.reconcile_north_signal_provider_event(
        'both-streams-migration-test@example.ca', 'provider-2', 'active', 'lifecycle',
        null, null, 'provider-active-current', now() + interval '2 seconds',
        false, 'north-signal-weekly-2026-08-v1',
        'By subscribing, you agree to receive the free weekly North Signal email from True North Map. Unsubscribe anytime.'
      )`);
      await db.query(`select * from public.reconcile_north_signal_provider_event(
        'both-streams-migration-test@example.ca', 'provider-2', 'bounced', 'lifecycle',
        null, null, 'provider-bounce-before-reconsent', now() - interval '1 minute',
        false, 'north-signal-weekly-2026-08-v1',
        'By subscribing, you agree to receive the free weekly North Signal email from True North Map. Unsubscribe anytime.'
      )`);
      await db.query(`select * from public.reconcile_north_signal_provider_event(
        'both-streams-migration-test@example.ca', 'provider-2', 'unconfirmed', 'lifecycle',
        null, null, 'provider-unconfirmed-before-current', now() + interval '1 second',
        false, 'north-signal-weekly-2026-08-v1',
        'By subscribing, you agree to receive the free weekly North Signal email from True North Map. Unsubscribe anytime.'
      )`);
      const chronology = await db.query<{ sync_status: string; has_error: boolean; parent_status: string; preference_timestamp_current: boolean; parent_timestamp_current: boolean }>(`
        select
          preference.provider_sync_status sync_status,
          preference.provider_error is not null has_error,
          signup.mailing_provider_status parent_status,
          preference.provider_synced_at = signup.mailing_provider_synced_at preference_timestamp_current,
          signup.mailing_provider_synced_at > preference.consented_at parent_timestamp_current
        from public.pilot_update_signups signup
        join public.newsletter_subscription_preferences preference on preference.subscriber_id = signup.id
        where signup.id = $1 and preference.stream = 'weekly'
      `, [bothSubscriberId]);
      expect(chronology.rows[0]).toEqual({
        sync_status: "synced",
        has_error: false,
        parent_status: "active",
        preference_timestamp_current: true,
        parent_timestamp_current: true
      });

      await db.query("select public.withdraw_north_signal_preferences($1, $2, $3, $4)", [
        "both-streams-migration-test@example.ca",
        "account_preferences",
        "withdraw-all-migration-test",
        new Date(Date.now() + 3_000).toISOString()
      ]);
      await db.query(`select * from public.reconcile_north_signal_provider_event(
        'both-streams-migration-test@example.ca', 'provider-2', 'active', 'group_added',
        'weekly', 'weekly-group', 'preference-center-add-weekly', now() + interval '4 seconds',
        true, 'north-signal-weekly-2026-08-v1',
        'By subscribing, you agree to receive the free weekly North Signal email from True North Map. Unsubscribe anytime.'
      )`);
      const restored = await db.query<{ active_streams: number; global_status: string; preference_source: string; histories: number }>(`
        select
          (select count(*)::int from public.newsletter_subscription_preferences where subscriber_id = $1 and status = 'subscribed') active_streams,
          (select status from public.pilot_update_signups where id = $1) global_status,
          (select source from public.pilot_update_signups where id = $1) preference_source,
          (select count(*)::int from public.newsletter_subscription_preference_history where subscriber_id = $1 and source = 'mailerlite_preference_center') histories
      `, [bothSubscriberId]);
      expect(restored.rows[0]).toEqual({ active_streams: 1, global_status: "subscribed", preference_source: "mailerlite_preference_center", histories: 1 });

      await db.query("select public.withdraw_north_signal_preferences($1, $2, $3, $4)", [
        "weekly-only-migration-test@example.ca",
        "account_deletion",
        "withdraw-weekly-no-group-migration-test",
        new Date().toISOString()
      ]);
      await db.query(`
        update public.newsletter_subscription_preferences
        set provider_sync_status = 'synced', provider_synced_at = now(), provider_error = null
        where subscriber_id = $1 and stream = 'weekly'
      `, [first.rows[0].result_subscriber_id]);
      const noGroupGlobalSync = await db.query<{ status: string; sync_status: string; has_group: boolean; has_sync_time: boolean }>(`
        select status, provider_sync_status sync_status,
          provider_group_id is not null has_group,
          provider_synced_at is not null has_sync_time
        from public.newsletter_subscription_preferences
        where subscriber_id = $1 and stream = 'weekly'
      `, [first.rows[0].result_subscriber_id]);
      expect(noGroupGlobalSync.rows[0]).toEqual({ status: "unsubscribed", sync_status: "synced", has_group: false, has_sync_time: true });
    } finally {
      await db.exec("reset role");
    }

    const security = await db.query<{ anon_select: boolean; authenticated_execute: boolean; service_execute: boolean }>(`
      select
        has_table_privilege('anon', 'public.newsletter_subscription_preferences', 'select') anon_select,
        has_function_privilege('authenticated', 'public.record_north_signal_consent(text,text,text,boolean,text,text,text,text,text,text,uuid,uuid,uuid,timestamptz,text,text,text,text,text,text,jsonb)', 'execute') authenticated_execute,
        has_function_privilege('service_role', 'public.record_north_signal_consent(text,text,text,boolean,text,text,text,text,text,text,uuid,uuid,uuid,timestamptz,text,text,text,text,text,text,jsonb)', 'execute') service_execute
    `);
    expect(security.rows[0]).toEqual({ anon_select: false, authenticated_execute: false, service_execute: true });
  });
});
