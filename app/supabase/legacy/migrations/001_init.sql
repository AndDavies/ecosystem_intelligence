create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'role_type') then
    create type role_type as enum ('viewer', 'editor', 'reviewer', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'pathway_type') then
    create type pathway_type as enum ('build', 'validate', 'scale');
  end if;
  if not exists (select 1 from pg_type where typname = 'relevance_band_type') then
    create type relevance_band_type as enum ('low', 'medium', 'high');
  end if;
  if not exists (select 1 from pg_type where typname = 'defence_relevance_type') then
    create type defence_relevance_type as enum ('low', 'medium', 'high');
  end if;
  if not exists (select 1 from pg_type where typname = 'change_status_type') then
    create type change_status_type as enum ('pending', 'approved', 'rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'signal_type_enum') then
    create type signal_type_enum as enum ('funding', 'contract', 'pilot', 'partnership', 'strategic_hiring', 'accelerator', 'technical_milestone');
  end if;
  if not exists (select 1 from pg_type where typname = 'suggested_action_type') then
    create type suggested_action_type as enum ('connect_to_end_user_validation', 'explore_testbed_inclusion', 'assess_funding_fit', 'introduce_to_integrator', 'monitor_for_later_stage_engagement', 'assess_procurement_relevance');
  end if;
end $$;

create table if not exists profiles (
  id uuid primary key,
  email text not null unique,
  full_name text,
  role role_type not null default 'viewer',
  created_at timestamptz not null default now()
);

create table if not exists domains (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text
);

create table if not exists use_cases (
  id text primary key,
  slug text not null unique,
  name text not null,
  summary text not null,
  active boolean not null default true,
  domain_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists clusters (
  id text primary key,
  name text not null,
  slug text not null unique,
  domain_id text not null references domains(id) on delete restrict,
  summary text not null
);

create table if not exists companies (
  id text primary key,
  slug text not null unique,
  name text not null,
  overview text not null,
  geography text not null check (geography in ('canada', 'nato', 'global')),
  headquarters text not null,
  market_context text,
  website_url text,
  public_contact_email text,
  public_contact_phone text,
  last_updated_at timestamptz not null default now(),
  search_document tsvector generated always as (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(overview, ''))
  ) stored
);

create table if not exists contacts (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  name text not null,
  title text not null,
  email text,
  linkedin_url text
);

create table if not exists capabilities (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  slug text not null unique,
  name text not null,
  capability_type text not null,
  domain_id text not null references domains(id) on delete restrict,
  summary text not null,
  company_facing_context text,
  last_updated_at timestamptz not null default now(),
  search_document tsvector generated always as (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(summary, ''))
  ) stored
);

create table if not exists capability_use_cases (
  id text primary key,
  capability_id text not null references capabilities(id) on delete cascade,
  use_case_id text not null references use_cases(id) on delete cascade,
  cluster_id text not null references clusters(id) on delete restrict,
  pathway pathway_type not null,
  relevance_band relevance_band_type not null,
  defence_relevance defence_relevance_type not null,
  suggested_action_type suggested_action_type not null,
  action_note text,
  why_it_matters text not null,
  ranking_score integer not null default 0,
  reviewer_override_delta integer not null default 0 check (reviewer_override_delta between -10 and 10),
  evidence_strength integer not null default 1 check (evidence_strength in (1, 3, 5)),
  actionability_score integer not null default 0 check (actionability_score in (0, 5)),
  last_signal_at timestamptz,
  stale_after_days integer not null default 180,
  created_at timestamptz not null default now(),
  unique (capability_id, use_case_id)
);

create table if not exists signals (
  id text primary key,
  capability_id text not null references capabilities(id) on delete cascade,
  signal_type signal_type_enum not null,
  title text not null,
  description text not null,
  observed_at timestamptz not null
);

create table if not exists sources (
  id text primary key,
  source_type text not null,
  title text not null,
  url text not null unique,
  publisher text not null,
  published_at timestamptz
);

create table if not exists evidence_snippets (
  id text primary key,
  source_id text not null references sources(id) on delete cascade,
  capability_id text references capabilities(id) on delete cascade,
  excerpt text not null
);

create table if not exists field_citations (
  id text primary key,
  entity_type text not null,
  entity_id text not null,
  field_name text not null,
  evidence_snippet_id text not null references evidence_snippets(id) on delete cascade
);

create table if not exists use_case_observations (
  id text primary key,
  use_case_id text not null references use_cases(id) on delete cascade,
  title text not null,
  note text not null,
  last_updated_at timestamptz not null default now()
);

create table if not exists change_requests (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  changed_fields text[] not null,
  before_value jsonb not null default '{}'::jsonb,
  after_value jsonb not null default '{}'::jsonb,
  requester_name text not null,
  requester_email text not null,
  reviewer_name text,
  status change_status_type not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_email text not null,
  actor_name text,
  event_type text not null,
  entity_type text not null,
  entity_id text not null,
  summary text not null,
  created_at timestamptz not null default now()
);

create table if not exists ai_runs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  status text not null check (status in ('queued', 'running', 'completed', 'failed')),
  prompt_version text not null,
  result_summary text,
  created_at timestamptz not null default now()
);

create index if not exists companies_search_document_idx on companies using gin (search_document);
create index if not exists capabilities_search_document_idx on capabilities using gin (search_document);
create index if not exists capability_use_cases_use_case_idx on capability_use_cases (use_case_id, ranking_score desc);
create index if not exists signals_capability_idx on signals (capability_id, observed_at desc);

alter table profiles enable row level security;
alter table domains enable row level security;
alter table use_cases enable row level security;
alter table clusters enable row level security;
alter table companies enable row level security;
alter table contacts enable row level security;
alter table capabilities enable row level security;
alter table capability_use_cases enable row level security;
alter table signals enable row level security;
alter table sources enable row level security;
alter table evidence_snippets enable row level security;
alter table field_citations enable row level security;
alter table use_case_observations enable row level security;
alter table change_requests enable row level security;
alter table audit_log enable row level security;
alter table ai_runs enable row level security;

create policy "authenticated read profiles" on profiles for select to authenticated using (auth.uid() = id);
create policy "authenticated read domains" on domains for select to authenticated using (true);
create policy "authenticated read use_cases" on use_cases for select to authenticated using (true);
create policy "authenticated read clusters" on clusters for select to authenticated using (true);
create policy "authenticated read companies" on companies for select to authenticated using (true);
create policy "authenticated read contacts" on contacts for select to authenticated using (true);
create policy "authenticated read capabilities" on capabilities for select to authenticated using (true);
create policy "authenticated read capability_use_cases" on capability_use_cases for select to authenticated using (true);
create policy "authenticated read signals" on signals for select to authenticated using (true);
create policy "authenticated read sources" on sources for select to authenticated using (true);
create policy "authenticated read evidence_snippets" on evidence_snippets for select to authenticated using (true);
create policy "authenticated read field_citations" on field_citations for select to authenticated using (true);
create policy "authenticated read observations" on use_case_observations for select to authenticated using (true);
create policy "authenticated read change_requests" on change_requests for select to authenticated using (true);
create policy "authenticated read audit_log" on audit_log for select to authenticated using (true);
create policy "authenticated read ai_runs" on ai_runs for select to authenticated using (true);
