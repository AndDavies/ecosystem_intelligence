import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

const migrationDirectory = path.resolve("supabase/migrations");
const foundationFixturePath = path.resolve("tests/fixtures/database-foundation.sql");

/** Apply the complete production migration chain with the existing historical backfill fixtures. */
export async function createAtlasTestDatabase() {
  const db = new PGlite();
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
    "20260827100553_north_signal_post_deploy_preference_reconciliation.sql",
    "20260905120323_visibility_product_daily_aggregates.sql",
    "20260905175008_newsletter_provider_observation.sql"
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
  return db;
}
