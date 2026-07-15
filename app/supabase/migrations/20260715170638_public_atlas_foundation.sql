create extension if not exists pgcrypto;

-- New projects default to explicit Data API exposure. Keep that posture for all
-- future objects created by the postgres role in the public schema.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public;

create schema if not exists private;
revoke all on schema private from public, anon;

create or replace function private.is_atlas_staff()
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')
    in ('editor', 'reviewer', 'admin');
$$;

revoke all on function private.is_atlas_staff() from public, anon;
grant usage on schema private to authenticated, service_role;
grant execute on function private.is_atlas_staff() to authenticated, service_role;

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  canonical_url text,
  publisher text not null,
  source_type text not null,
  visibility text not null default 'internal'
    check (visibility in ('public', 'permissioned', 'internal')),
  published_at timestamptz,
  accessed_at timestamptz not null default now(),
  public_approved boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    visibility <> 'public'
    or (canonical_url is not null and canonical_url ~ '^https://')
  )
);

create table public.evidence_snippets (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete cascade,
  excerpt text not null,
  source_locator text,
  visibility text not null default 'internal'
    check (visibility in ('public', 'permissioned', 'internal')),
  public_approved boolean not null default false,
  extracted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  legal_name text,
  description text not null,
  website_url text,
  entity_kind text not null default 'company'
    check (entity_kind in (
      'company',
      'accelerator',
      'incubator',
      'research_test_centre',
      'investor_funder',
      'ecosystem_organization',
      'government_innovation_office'
    )),
  organization_categories text[] not null default '{}',
  founded_year integer check (founded_year between 1800 and 2100),
  employee_range text,
  company_stage text,
  ownership text,
  commercial_status text,
  disclosed_financing_summary text,
  defence_posture text,
  dual_use_posture text,
  profile_data jsonb not null default '{}'::jsonb,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  source_confidence text not null default 'needs_review'
    check (source_confidence in ('high', 'moderate', 'needs_review')),
  freshness_status text not null default 'current'
    check (freshness_status in ('current', 'review_due', 'stale')),
  last_reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (website_url is null or website_url ~ '^https://'),
  check (jsonb_typeof(profile_data) = 'object'),
  check (publication_status <> 'published' or cardinality(organization_categories) > 0),
  check (publication_status <> 'published' or published_at is not null)
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  province_territory text,
  country_code text not null default 'CA' check (char_length(country_code) = 2),
  latitude double precision,
  longitude double precision,
  geographic_confidence text not null default 'unverified'
    check (geographic_confidence in ('exact', 'city_centroid', 'regional', 'unverified')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (latitude is null or latitude between -90 and 90),
  check (longitude is null or longitude between -180 and 180)
);

create table public.organization_locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  location_role text not null
    check (location_role in ('headquarters', 'facility', 'test_site', 'regional_role')),
  is_primary boolean not null default false,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, location_id, location_role)
);

create table public.capabilities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  summary text not null,
  capability_type text,
  core_features text[] not null default '{}',
  technology_readiness_level smallint check (technology_readiness_level between 1 and 9),
  maturity text,
  commercial_availability text,
  defence_applications text[] not null default '{}',
  novelty text[] not null default '{}',
  technical_tags text[] not null default '{}',
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  source_confidence text not null default 'needs_review'
    check (source_confidence in ('high', 'moderate', 'needs_review')),
  last_reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (publication_status <> 'published' or published_at is not null)
);

create table public.technical_domains (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  summary text not null,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.capability_domains (
  capability_id uuid not null references public.capabilities(id) on delete cascade,
  technical_domain_id uuid not null references public.technical_domains(id) on delete cascade,
  is_primary boolean not null default false,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  primary key (capability_id, technical_domain_id)
);

create table public.mission_areas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  summary text not null,
  source_confidence text not null default 'needs_review'
    check (source_confidence in ('high', 'moderate', 'needs_review')),
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.capability_mission_matches (
  id uuid primary key default gen_random_uuid(),
  capability_id uuid not null references public.capabilities(id) on delete cascade,
  mission_area_id uuid not null references public.mission_areas(id) on delete cascade,
  alignment_summary text not null,
  match_type text not null default 'derived'
    check (match_type in ('public_source_alignment', 'derived')),
  confidence text not null default 'needs_review'
    check (confidence in ('high', 'moderate', 'needs_review')),
  review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'rejected')),
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (capability_id, mission_area_id)
);

create table public.ecosystem_clusters (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  summary text not null,
  region_slug text,
  cluster_basis text not null default 'editorial'
    check (cluster_basis in ('editorial', 'program', 'geographic', 'technical')),
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.capability_clusters (
  capability_id uuid not null references public.capabilities(id) on delete cascade,
  ecosystem_cluster_id uuid not null references public.ecosystem_clusters(id) on delete cascade,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  primary key (capability_id, ecosystem_cluster_id)
);

create table public.demand_sources (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  publisher text not null,
  published_on date,
  classification_label text not null default 'PUBLIC',
  source_visibility text not null default 'public'
    check (source_visibility in ('public', 'permissioned', 'internal')),
  summary text not null,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.demand_requirements (
  id uuid primary key default gen_random_uuid(),
  demand_source_id uuid not null references public.demand_sources(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  problem_statement text not null,
  desired_end_state text not null,
  public_caveat text not null,
  display_order smallint not null default 0,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.capability_demand_matches (
  id uuid primary key default gen_random_uuid(),
  capability_id uuid not null references public.capabilities(id) on delete cascade,
  demand_requirement_id uuid not null references public.demand_requirements(id) on delete cascade,
  match_type text not null default 'derived'
    check (match_type in ('public_source_alignment', 'derived')),
  alignment_summary text not null,
  rationale text not null,
  confidence text not null default 'needs_review'
    check (confidence in ('high', 'moderate', 'needs_review')),
  review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'rejected')),
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (capability_id, demand_requirement_id)
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  program_type text not null,
  operator_name text,
  website_url text,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (website_url is null or website_url ~ '^https://')
);

create table public.program_participations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  participation_type text not null,
  cohort_label text,
  started_on date,
  ended_on date,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, program_id, participation_type, cohort_label)
);

create table public.funding_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_type text not null,
  announced_on date,
  amount_value numeric,
  amount_currency text check (amount_currency is null or char_length(amount_currency) = 3),
  disclosed_summary text not null,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_relationships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  related_organization_id uuid references public.organizations(id) on delete cascade,
  related_organization_name text,
  relationship_type text not null,
  public_summary text not null,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (related_organization_id is not null or related_organization_name is not null)
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  capability_id uuid references public.capabilities(id) on delete cascade,
  asset_type text not null check (asset_type in ('logo', 'product_image', 'facility_image', 'other')),
  storage_path text,
  source_url text,
  source_visibility text not null default 'internal'
    check (source_visibility in ('public', 'permissioned', 'internal')),
  permission_basis text,
  attribution_text text,
  licence text,
  approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'rejected')),
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (organization_id is not null or capability_id is not null),
  check (storage_path is not null or source_url is not null),
  check (source_url is null or source_url ~ '^https://')
);

create table public.field_citations (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  field_name text not null,
  evidence_snippet_id uuid not null references public.evidence_snippets(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (entity_type, entity_id, field_name, evidence_snippet_id)
);

create table public.research_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null check (run_type in ('weekly_gap', 'targeted', 'manual')),
  scope jsonb not null default '{}'::jsonb,
  selected_gap jsonb,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  started_at timestamptz,
  completed_at timestamptz,
  failure_note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.candidate_changes (
  id uuid primary key default gen_random_uuid(),
  research_run_id uuid references public.research_runs(id) on delete set null,
  candidate_kind text not null,
  target_entity_type text,
  target_entity_id uuid,
  proposed_record jsonb not null,
  before_record jsonb,
  field_evidence jsonb not null default '[]'::jsonb,
  duplicate_check jsonb not null default '{}'::jsonb,
  confidence text not null default 'needs_review'
    check (confidence in ('high', 'moderate', 'needs_review')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  submission_type text not null check (submission_type in ('profile_claim', 'correction', 'new_organization')),
  target_entity_type text,
  target_entity_id uuid,
  submitted_payload jsonb not null,
  status text not null default 'pending'
    check (status in ('pending', 'in_review', 'approved', 'rejected', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.review_decisions (
  id uuid primary key default gen_random_uuid(),
  candidate_change_id uuid references public.candidate_changes(id) on delete cascade,
  submission_id uuid references public.submissions(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  decision text not null check (decision in ('accept', 'reject', 'edit', 'merge', 'defer')),
  field_decisions jsonb not null default '[]'::jsonb,
  rationale text not null,
  created_at timestamptz not null default now(),
  check (candidate_change_id is not null or submission_id is not null)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_role text,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.saved_collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  is_private boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.saved_collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.saved_collections(id) on delete cascade,
  entity_type text not null check (entity_type in ('organization', 'capability')),
  entity_id uuid not null,
  note text,
  created_at timestamptz not null default now(),
  unique (collection_id, entity_type, entity_id)
);

-- One read-only row per organization for dossier pages, PDFs, exports, and the
-- unified editor. Canonical repeated records remain normalized and reviewable;
-- this view only assembles them into one predictable payload. As a
-- security-invoker view it preserves the RLS policies of every source table.
create view public.organization_dossiers
with (security_invoker = true)
as
select
  organization_record.*,
  coalesce((
    select jsonb_agg(
      to_jsonb(location_record)
      || jsonb_build_object(
        'link_id', location_link.id,
        'location_role', location_link.location_role,
        'is_primary', location_link.is_primary,
        'publication_status', location_link.publication_status
      )
      order by location_link.is_primary desc, location_record.name
    )
    from public.organization_locations location_link
    join public.locations location_record on location_record.id = location_link.location_id
    where location_link.organization_id = organization_record.id
  ), '[]'::jsonb) as locations,
  coalesce((
    select jsonb_agg(to_jsonb(capability_record) order by capability_record.name)
    from public.capabilities capability_record
    where capability_record.organization_id = organization_record.id
  ), '[]'::jsonb) as capabilities,
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'capability_id', domain_link.capability_id,
        'is_primary', domain_link.is_primary,
        'technical_domain', to_jsonb(domain_record)
      )
      order by domain_record.name
    )
    from public.capability_domains domain_link
    join public.capabilities capability_record on capability_record.id = domain_link.capability_id
    join public.technical_domains domain_record on domain_record.id = domain_link.technical_domain_id
    where capability_record.organization_id = organization_record.id
  ), '[]'::jsonb) as capability_domains,
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'match', to_jsonb(match_record),
        'mission_area', to_jsonb(mission_record)
      )
      order by mission_record.name
    )
    from public.capability_mission_matches match_record
    join public.capabilities capability_record on capability_record.id = match_record.capability_id
    join public.mission_areas mission_record on mission_record.id = match_record.mission_area_id
    where capability_record.organization_id = organization_record.id
  ), '[]'::jsonb) as mission_matches,
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'match', to_jsonb(match_record),
        'requirement', to_jsonb(requirement_record),
        'demand_source', to_jsonb(demand_source_record)
      )
      order by requirement_record.display_order, requirement_record.title
    )
    from public.capability_demand_matches match_record
    join public.capabilities capability_record on capability_record.id = match_record.capability_id
    join public.demand_requirements requirement_record on requirement_record.id = match_record.demand_requirement_id
    join public.demand_sources demand_source_record on demand_source_record.id = requirement_record.demand_source_id
    where capability_record.organization_id = organization_record.id
  ), '[]'::jsonb) as demand_matches,
  coalesce((
    select jsonb_agg(
      to_jsonb(participation_record)
      || jsonb_build_object('program', to_jsonb(program_record))
      order by program_record.name
    )
    from public.program_participations participation_record
    join public.programs program_record on program_record.id = participation_record.program_id
    where participation_record.organization_id = organization_record.id
  ), '[]'::jsonb) as programs,
  coalesce((
    select jsonb_agg(to_jsonb(funding_record) order by funding_record.announced_on desc nulls last)
    from public.funding_events funding_record
    where funding_record.organization_id = organization_record.id
  ), '[]'::jsonb) as funding_events,
  coalesce((
    select jsonb_agg(to_jsonb(relationship_record) order by relationship_record.relationship_type)
    from public.organization_relationships relationship_record
    where relationship_record.organization_id = organization_record.id
  ), '[]'::jsonb) as relationships,
  coalesce((
    select jsonb_agg(to_jsonb(media_record) order by media_record.asset_type, media_record.created_at)
    from public.media_assets media_record
    where media_record.organization_id = organization_record.id
       or media_record.capability_id in (
         select capability_record.id
         from public.capabilities capability_record
         where capability_record.organization_id = organization_record.id
       )
  ), '[]'::jsonb) as media_assets,
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'citation', to_jsonb(citation_record),
        'evidence', to_jsonb(evidence_record),
        'source', to_jsonb(source_record)
      )
      order by citation_record.entity_type, citation_record.field_name, citation_record.created_at
    )
    from public.field_citations citation_record
    join public.evidence_snippets evidence_record on evidence_record.id = citation_record.evidence_snippet_id
    join public.sources source_record on source_record.id = evidence_record.source_id
    where
      (citation_record.entity_type = 'organization' and citation_record.entity_id = organization_record.id)
      or (
        citation_record.entity_type = 'capability'
        and citation_record.entity_id in (
          select capability_record.id
          from public.capabilities capability_record
          where capability_record.organization_id = organization_record.id
        )
      )
      or (
        citation_record.entity_type = 'funding_event'
        and citation_record.entity_id in (
          select funding_record.id
          from public.funding_events funding_record
          where funding_record.organization_id = organization_record.id
        )
      )
      or (
        citation_record.entity_type = 'program_participation'
        and citation_record.entity_id in (
          select participation_record.id
          from public.program_participations participation_record
          where participation_record.organization_id = organization_record.id
        )
      )
      or (
        citation_record.entity_type = 'organization_relationship'
        and citation_record.entity_id in (
          select relationship_record.id
          from public.organization_relationships relationship_record
          where relationship_record.organization_id = organization_record.id
        )
      )
      or (
        citation_record.entity_type = 'media_asset'
        and citation_record.entity_id in (
          select media_record.id
          from public.media_assets media_record
          where media_record.organization_id = organization_record.id
             or media_record.capability_id in (
               select capability_record.id
               from public.capabilities capability_record
               where capability_record.organization_id = organization_record.id
             )
        )
      )
      or (
        citation_record.entity_type in ('capability_mission_match', 'capability_demand_match')
        and exists (
          select 1
          from public.capabilities capability_record
          where capability_record.organization_id = organization_record.id
            and (
              exists (
                select 1 from public.capability_mission_matches mission_match
                where mission_match.id = citation_record.entity_id
                  and mission_match.capability_id = capability_record.id
              )
              or exists (
                select 1 from public.capability_demand_matches demand_match
                where demand_match.id = citation_record.entity_id
                  and demand_match.capability_id = capability_record.id
              )
            )
        )
      )
  ), '[]'::jsonb) as citations
from public.organizations organization_record;

create index organizations_publication_idx on public.organizations (publication_status, updated_at desc);
create index organizations_kind_publication_idx on public.organizations (entity_kind, publication_status);
create index organizations_categories_idx on public.organizations using gin (organization_categories);
create index organization_locations_org_idx on public.organization_locations (organization_id, publication_status);
create index organization_locations_location_idx on public.organization_locations (location_id);
create unique index organization_locations_one_published_primary_idx
  on public.organization_locations (organization_id)
  where is_primary and publication_status = 'published';
create index locations_geo_idx on public.locations (latitude, longitude);
create index capabilities_org_idx on public.capabilities (organization_id, publication_status);
create index capabilities_tags_idx on public.capabilities using gin (technical_tags);
create index capability_domains_domain_idx on public.capability_domains (technical_domain_id, publication_status);
create index capability_mission_matches_mission_idx on public.capability_mission_matches (mission_area_id, publication_status);
create index ecosystem_clusters_region_idx on public.ecosystem_clusters (region_slug, publication_status);
create index capability_clusters_cluster_idx on public.capability_clusters (ecosystem_cluster_id, publication_status);
create unique index sources_canonical_url_unique_idx on public.sources (canonical_url) where canonical_url is not null;
create index demand_sources_source_idx on public.demand_sources (source_id);
create index demand_requirements_source_idx on public.demand_requirements (demand_source_id, display_order);
create index capability_demand_matches_requirement_idx on public.capability_demand_matches (demand_requirement_id, publication_status);
create index capability_demand_matches_reviewer_idx on public.capability_demand_matches (reviewed_by) where reviewed_by is not null;
create index program_participations_program_idx on public.program_participations (program_id, publication_status);
create index funding_events_organization_idx on public.funding_events (organization_id, publication_status);
create index organization_relationships_organization_idx on public.organization_relationships (organization_id, publication_status);
create index organization_relationships_related_idx on public.organization_relationships (related_organization_id) where related_organization_id is not null;
create index media_assets_organization_idx on public.media_assets (organization_id, publication_status) where organization_id is not null;
create index media_assets_capability_idx on public.media_assets (capability_id, publication_status) where capability_id is not null;
create index field_citations_entity_idx on public.field_citations (entity_type, entity_id, field_name);
create index field_citations_evidence_idx on public.field_citations (evidence_snippet_id);
create index evidence_snippets_source_idx on public.evidence_snippets (source_id);
create index candidate_changes_status_idx on public.candidate_changes (status, created_at desc);
create index candidate_changes_run_idx on public.candidate_changes (research_run_id) where research_run_id is not null;
create index research_runs_creator_idx on public.research_runs (created_by) where created_by is not null;
create index submissions_owner_idx on public.submissions (owner_id, status, created_at desc);
create index review_decisions_candidate_idx on public.review_decisions (candidate_change_id) where candidate_change_id is not null;
create index review_decisions_submission_idx on public.review_decisions (submission_id) where submission_id is not null;
create index review_decisions_reviewer_idx on public.review_decisions (reviewer_id);
create index audit_events_actor_idx on public.audit_events (actor_id, created_at desc) where actor_id is not null;
create index saved_collections_owner_idx on public.saved_collections (owner_id, updated_at desc);
create index saved_collection_items_collection_idx on public.saved_collection_items (collection_id, created_at);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;

create trigger sources_set_updated_at before update on public.sources
for each row execute function private.set_updated_at();
create trigger organizations_set_updated_at before update on public.organizations
for each row execute function private.set_updated_at();
create trigger locations_set_updated_at before update on public.locations
for each row execute function private.set_updated_at();
create trigger organization_locations_set_updated_at before update on public.organization_locations
for each row execute function private.set_updated_at();
create trigger capabilities_set_updated_at before update on public.capabilities
for each row execute function private.set_updated_at();
create trigger technical_domains_set_updated_at before update on public.technical_domains
for each row execute function private.set_updated_at();
create trigger mission_areas_set_updated_at before update on public.mission_areas
for each row execute function private.set_updated_at();
create trigger capability_mission_matches_set_updated_at before update on public.capability_mission_matches
for each row execute function private.set_updated_at();
create trigger ecosystem_clusters_set_updated_at before update on public.ecosystem_clusters
for each row execute function private.set_updated_at();
create trigger demand_sources_set_updated_at before update on public.demand_sources
for each row execute function private.set_updated_at();
create trigger demand_requirements_set_updated_at before update on public.demand_requirements
for each row execute function private.set_updated_at();
create trigger capability_demand_matches_set_updated_at before update on public.capability_demand_matches
for each row execute function private.set_updated_at();
create trigger programs_set_updated_at before update on public.programs
for each row execute function private.set_updated_at();
create trigger program_participations_set_updated_at before update on public.program_participations
for each row execute function private.set_updated_at();
create trigger funding_events_set_updated_at before update on public.funding_events
for each row execute function private.set_updated_at();
create trigger organization_relationships_set_updated_at before update on public.organization_relationships
for each row execute function private.set_updated_at();
create trigger media_assets_set_updated_at before update on public.media_assets
for each row execute function private.set_updated_at();
create trigger candidate_changes_set_updated_at before update on public.candidate_changes
for each row execute function private.set_updated_at();
create trigger submissions_set_updated_at before update on public.submissions
for each row execute function private.set_updated_at();
create trigger saved_collections_set_updated_at before update on public.saved_collections
for each row execute function private.set_updated_at();

alter table public.sources enable row level security;
alter table public.evidence_snippets enable row level security;
alter table public.organizations enable row level security;
alter table public.locations enable row level security;
alter table public.organization_locations enable row level security;
alter table public.capabilities enable row level security;
alter table public.technical_domains enable row level security;
alter table public.capability_domains enable row level security;
alter table public.mission_areas enable row level security;
alter table public.capability_mission_matches enable row level security;
alter table public.ecosystem_clusters enable row level security;
alter table public.capability_clusters enable row level security;
alter table public.demand_sources enable row level security;
alter table public.demand_requirements enable row level security;
alter table public.capability_demand_matches enable row level security;
alter table public.programs enable row level security;
alter table public.program_participations enable row level security;
alter table public.funding_events enable row level security;
alter table public.organization_relationships enable row level security;
alter table public.media_assets enable row level security;
alter table public.field_citations enable row level security;
alter table public.research_runs enable row level security;
alter table public.candidate_changes enable row level security;
alter table public.submissions enable row level security;
alter table public.review_decisions enable row level security;
alter table public.audit_events enable row level security;
alter table public.saved_collections enable row level security;
alter table public.saved_collection_items enable row level security;

create policy "public sources are readable"
on public.sources for select to anon, authenticated
using (visibility = 'public' and public_approved);

create policy "public evidence is readable"
on public.evidence_snippets for select to anon, authenticated
using (
  visibility = 'public'
  and public_approved
  and exists (
    select 1 from public.sources source_record
    where source_record.id = evidence_snippets.source_id
      and source_record.visibility = 'public'
      and source_record.public_approved
  )
);

create policy "published organizations are readable"
on public.organizations for select to anon, authenticated
using (publication_status = 'published');

create policy "published organization locations are readable"
on public.organization_locations for select to anon, authenticated
using (
  publication_status = 'published'
  and exists (
    select 1 from public.organizations organization_record
    where organization_record.id = organization_locations.organization_id
      and organization_record.publication_status = 'published'
  )
);

create policy "published locations are readable"
on public.locations for select to anon, authenticated
using (
  exists (
    select 1 from public.organization_locations location_link
    join public.organizations organization_record on organization_record.id = location_link.organization_id
    where location_link.location_id = locations.id
      and location_link.publication_status = 'published'
      and organization_record.publication_status = 'published'
  )
);

create policy "published capabilities are readable"
on public.capabilities for select to anon, authenticated
using (
  publication_status = 'published'
  and exists (
    select 1 from public.organizations organization_record
    where organization_record.id = capabilities.organization_id
      and organization_record.publication_status = 'published'
  )
);

create policy "published technical domains are readable"
on public.technical_domains for select to anon, authenticated
using (publication_status = 'published');

create policy "published capability domains are readable"
on public.capability_domains for select to anon, authenticated
using (
  publication_status = 'published'
  and exists (
    select 1 from public.capabilities capability_record
    where capability_record.id = capability_domains.capability_id
      and capability_record.publication_status = 'published'
  )
  and exists (
    select 1 from public.technical_domains domain_record
    where domain_record.id = capability_domains.technical_domain_id
      and domain_record.publication_status = 'published'
  )
);

create policy "published mission areas are readable"
on public.mission_areas for select to anon, authenticated
using (publication_status = 'published');

create policy "approved mission matches are readable"
on public.capability_mission_matches for select to anon, authenticated
using (
  review_status = 'approved'
  and publication_status = 'published'
  and exists (
    select 1 from public.capabilities capability_record
    where capability_record.id = capability_mission_matches.capability_id
      and capability_record.publication_status = 'published'
  )
  and exists (
    select 1 from public.mission_areas mission_record
    where mission_record.id = capability_mission_matches.mission_area_id
      and mission_record.publication_status = 'published'
  )
);

create policy "published ecosystem clusters are readable"
on public.ecosystem_clusters for select to anon, authenticated
using (publication_status = 'published');

create policy "published capability clusters are readable"
on public.capability_clusters for select to anon, authenticated
using (
  publication_status = 'published'
  and exists (
    select 1 from public.capabilities capability_record
    where capability_record.id = capability_clusters.capability_id
      and capability_record.publication_status = 'published'
  )
  and exists (
    select 1 from public.ecosystem_clusters cluster_record
    where cluster_record.id = capability_clusters.ecosystem_cluster_id
      and cluster_record.publication_status = 'published'
  )
);

create policy "published demand sources are readable"
on public.demand_sources for select to anon, authenticated
using (publication_status = 'published' and source_visibility = 'public');

create policy "published demand requirements are readable"
on public.demand_requirements for select to anon, authenticated
using (
  publication_status = 'published'
  and exists (
    select 1 from public.demand_sources demand_source_record
    where demand_source_record.id = demand_requirements.demand_source_id
      and demand_source_record.publication_status = 'published'
      and demand_source_record.source_visibility = 'public'
  )
);

create policy "approved published matches are readable"
on public.capability_demand_matches for select to anon, authenticated
using (
  review_status = 'approved'
  and publication_status = 'published'
  and exists (
    select 1 from public.capabilities capability_record
    where capability_record.id = capability_demand_matches.capability_id
      and capability_record.publication_status = 'published'
  )
  and exists (
    select 1 from public.demand_requirements demand_record
    where demand_record.id = capability_demand_matches.demand_requirement_id
      and demand_record.publication_status = 'published'
  )
);

create policy "published programs are readable"
on public.programs for select to anon, authenticated
using (publication_status = 'published');

create policy "published program participation is readable"
on public.program_participations for select to anon, authenticated
using (
  publication_status = 'published'
  and exists (
    select 1 from public.organizations organization_record
    where organization_record.id = program_participations.organization_id
      and organization_record.publication_status = 'published'
  )
  and exists (
    select 1 from public.programs program_record
    where program_record.id = program_participations.program_id
      and program_record.publication_status = 'published'
  )
);

create policy "published funding events are readable"
on public.funding_events for select to anon, authenticated
using (
  publication_status = 'published'
  and exists (
    select 1 from public.organizations organization_record
    where organization_record.id = funding_events.organization_id
      and organization_record.publication_status = 'published'
  )
);

create policy "published relationships are readable"
on public.organization_relationships for select to anon, authenticated
using (
  publication_status = 'published'
  and exists (
    select 1 from public.organizations organization_record
    where organization_record.id = organization_relationships.organization_id
      and organization_record.publication_status = 'published'
  )
);

create policy "approved media is readable"
on public.media_assets for select to anon, authenticated
using (
  approval_status = 'approved'
  and publication_status = 'published'
  and source_visibility in ('public', 'permissioned')
);

create policy "public field citations are readable"
on public.field_citations for select to anon, authenticated
using (
  exists (
    select 1 from public.evidence_snippets evidence_record
    join public.sources source_record on source_record.id = evidence_record.source_id
    where evidence_record.id = field_citations.evidence_snippet_id
      and evidence_record.visibility = 'public'
      and evidence_record.public_approved
      and source_record.visibility = 'public'
      and source_record.public_approved
  )
  and (
    (entity_type = 'organization' and exists (
      select 1 from public.organizations record
      where record.id = field_citations.entity_id and record.publication_status = 'published'
    ))
    or (entity_type = 'capability' and exists (
      select 1 from public.capabilities record
      where record.id = field_citations.entity_id and record.publication_status = 'published'
    ))
    or (entity_type = 'mission_area' and exists (
      select 1 from public.mission_areas record
      where record.id = field_citations.entity_id and record.publication_status = 'published'
    ))
    or (entity_type = 'capability_mission_match' and exists (
      select 1 from public.capability_mission_matches record
      where record.id = field_citations.entity_id
        and record.review_status = 'approved'
        and record.publication_status = 'published'
    ))
    or (entity_type = 'demand_requirement' and exists (
      select 1 from public.demand_requirements record
      where record.id = field_citations.entity_id and record.publication_status = 'published'
    ))
    or (entity_type = 'capability_demand_match' and exists (
      select 1 from public.capability_demand_matches record
      where record.id = field_citations.entity_id
        and record.review_status = 'approved'
        and record.publication_status = 'published'
    ))
    or (entity_type = 'funding_event' and exists (
      select 1 from public.funding_events record
      where record.id = field_citations.entity_id and record.publication_status = 'published'
    ))
    or (entity_type = 'program_participation' and exists (
      select 1 from public.program_participations record
      where record.id = field_citations.entity_id and record.publication_status = 'published'
    ))
    or (entity_type = 'organization_relationship' and exists (
      select 1 from public.organization_relationships record
      where record.id = field_citations.entity_id and record.publication_status = 'published'
    ))
    or (entity_type = 'media_asset' and exists (
      select 1 from public.media_assets record
      where record.id = field_citations.entity_id
        and record.approval_status = 'approved'
        and record.publication_status = 'published'
    ))
  )
);

-- Staff authorization is sourced only from app_metadata. Users cannot grant
-- themselves editor or reviewer access through user-editable metadata.
create policy "atlas staff manage sources" on public.sources
for all to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas staff manage evidence" on public.evidence_snippets
for all to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas staff manage organizations" on public.organizations
for all to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas staff manage locations" on public.locations
for all to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas staff manage organization locations" on public.organization_locations
for all to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas staff manage capabilities" on public.capabilities
for all to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas staff manage technical domains" on public.technical_domains
for all to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas staff manage capability domains" on public.capability_domains
for all to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas staff manage mission areas" on public.mission_areas
for all to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas staff manage mission matches" on public.capability_mission_matches
for all to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas staff manage ecosystem clusters" on public.ecosystem_clusters
for all to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas staff manage capability clusters" on public.capability_clusters
for all to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas staff manage demand sources" on public.demand_sources
for all to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas staff manage demand requirements" on public.demand_requirements
for all to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas staff manage demand matches" on public.capability_demand_matches
for all to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas staff manage programs" on public.programs
for all to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas staff manage program participation" on public.program_participations
for all to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas staff manage funding events" on public.funding_events
for all to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas staff manage relationships" on public.organization_relationships
for all to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas staff manage media" on public.media_assets
for all to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas staff manage citations" on public.field_citations
for all to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas staff manage research runs" on public.research_runs
for all to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas staff manage candidates" on public.candidate_changes
for all to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas staff manage review decisions" on public.review_decisions
for all to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas staff read audit events" on public.audit_events
for select to authenticated using ((select private.is_atlas_staff()));
create policy "atlas staff create audit events" on public.audit_events
for insert to authenticated with check ((select private.is_atlas_staff()));

create policy "users create their own submissions"
on public.submissions for insert to authenticated
with check ((select auth.uid()) = owner_id);
create policy "users read their own submissions"
on public.submissions for select to authenticated
using ((select auth.uid()) = owner_id);
create policy "users update pending submissions"
on public.submissions for update to authenticated
using ((select auth.uid()) = owner_id and status in ('pending', 'withdrawn'))
with check ((select auth.uid()) = owner_id and status in ('pending', 'withdrawn'));
create policy "atlas staff manage submissions"
on public.submissions for all to authenticated
using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));

create policy "owners manage collections"
on public.saved_collections for all to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id and is_private);
create policy "owners manage collection items"
on public.saved_collection_items for all to authenticated
using (
  exists (
    select 1 from public.saved_collections collection_record
    where collection_record.id = saved_collection_items.collection_id
      and collection_record.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.saved_collections collection_record
    where collection_record.id = saved_collection_items.collection_id
      and collection_record.owner_id = (select auth.uid())
  )
);

grant usage on schema public to anon, authenticated, service_role;

grant select on table
  public.sources,
  public.evidence_snippets,
  public.organizations,
  public.locations,
  public.organization_locations,
  public.capabilities,
  public.technical_domains,
  public.capability_domains,
  public.mission_areas,
  public.capability_mission_matches,
  public.ecosystem_clusters,
  public.capability_clusters,
  public.demand_sources,
  public.demand_requirements,
  public.capability_demand_matches,
  public.programs,
  public.program_participations,
  public.funding_events,
  public.organization_relationships,
  public.media_assets,
  public.field_citations
to anon;

grant select on public.organization_dossiers to anon, authenticated, service_role;

grant select, insert, update, delete on table
  public.sources,
  public.evidence_snippets,
  public.organizations,
  public.locations,
  public.organization_locations,
  public.capabilities,
  public.technical_domains,
  public.capability_domains,
  public.mission_areas,
  public.capability_mission_matches,
  public.ecosystem_clusters,
  public.capability_clusters,
  public.demand_sources,
  public.demand_requirements,
  public.capability_demand_matches,
  public.programs,
  public.program_participations,
  public.funding_events,
  public.organization_relationships,
  public.media_assets,
  public.field_citations,
  public.research_runs,
  public.candidate_changes,
  public.submissions,
  public.review_decisions,
  public.audit_events,
  public.saved_collections,
  public.saved_collection_items
to authenticated;

grant all privileges on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'atlas-public-media',
    'atlas-public-media',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'atlas-private-intake',
    'atlas-private-intake',
    false,
    52428800,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "public atlas media is readable"
on storage.objects for select to anon, authenticated
using (bucket_id = 'atlas-public-media');

create policy "users upload private intake"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'atlas-private-intake'
  and owner_id = (select auth.uid()::text)
);

create policy "users read their private intake"
on storage.objects for select to authenticated
using (
  bucket_id = 'atlas-private-intake'
  and (owner_id = (select auth.uid()::text) or (select private.is_atlas_staff()))
);

create policy "users update their private intake"
on storage.objects for update to authenticated
using (
  bucket_id = 'atlas-private-intake'
  and (owner_id = (select auth.uid()::text) or (select private.is_atlas_staff()))
)
with check (
  bucket_id = 'atlas-private-intake'
  and (owner_id = (select auth.uid()::text) or (select private.is_atlas_staff()))
);

create policy "users delete their private intake"
on storage.objects for delete to authenticated
using (
  bucket_id = 'atlas-private-intake'
  and (owner_id = (select auth.uid()::text) or (select private.is_atlas_staff()))
);

create policy "atlas staff manage public media"
on storage.objects for all to authenticated
using (bucket_id = 'atlas-public-media' and (select private.is_atlas_staff()))
with check (bucket_id = 'atlas-public-media' and (select private.is_atlas_staff()));
