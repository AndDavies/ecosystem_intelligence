-- Autonomous ecosystem research contract.
--
-- Research workers may prepare private run and candidate records. They do not
-- receive a publication path and cannot mutate canonical ecosystem records.

create table public.organization_aliases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  alias text not null,
  normalized_alias text generated always as (
    lower(regexp_replace(trim(alias), '[^a-zA-Z0-9]+', ' ', 'g'))
  ) stored,
  alias_type text not null default 'other'
    check (alias_type in ('legal_name', 'trade_name', 'former_name', 'acronym', 'other')),
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  unique (organization_id, normalized_alias)
);

create index organization_aliases_normalized_idx
  on public.organization_aliases (normalized_alias);

create table public.demand_issuers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  issuer_type text not null
    check (issuer_type in (
      'alliance',
      'federal_government',
      'department',
      'armed_forces',
      'military_service',
      'procurement_authority',
      'research_innovation_agency',
      'public_program'
    )),
  jurisdiction text not null,
  parent_issuer_id uuid references public.demand_issuers(id) on delete restrict,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (parent_issuer_id is null or parent_issuer_id <> id)
);

create table public.demand_source_issuers (
  demand_source_id uuid not null references public.demand_sources(id) on delete cascade,
  demand_issuer_id uuid not null references public.demand_issuers(id) on delete restrict,
  issuer_role text not null
    check (issuer_role in ('issuer', 'co_issuer', 'sponsor', 'beneficiary')),
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  primary key (demand_source_id, demand_issuer_id, issuer_role)
);

alter table public.demand_sources
  add column source_kind text not null default 'official_problem_statement'
    check (source_kind in (
      'strategic_policy',
      'capability_plan',
      'innovation_challenge',
      'funding_program',
      'procurement_notice',
      'award_or_contract',
      'official_problem_statement'
    )),
  add column commitment_level text not null default 'directional'
    check (commitment_level in ('directional', 'programmatic', 'procurement'));

alter table public.research_runs
  add column agent_version text,
  add column source_queries jsonb not null default '[]'::jsonb,
  add column counters jsonb not null default '{}'::jsonb,
  add column validation_results jsonb not null default '{}'::jsonb,
  add column stop_reason text,
  add column resume_token text,
  add constraint research_runs_source_queries_array_check
    check (jsonb_typeof(source_queries) = 'array'),
  add constraint research_runs_counters_object_check
    check (jsonb_typeof(counters) = 'object'),
  add constraint research_runs_validation_object_check
    check (jsonb_typeof(validation_results) = 'object');

alter table public.candidate_changes
  add column schema_version text,
  add column source_lead_ids text[] not null default '{}',
  add column staged_at timestamptz not null default now();

alter table public.candidate_changes
  add constraint candidate_changes_kind_check
  check (candidate_kind in (
    'source_intake',
    'organization_bundle',
    'demand_signal_bundle',
    'program_relationship_bundle'
  ));

create index research_runs_status_created_idx
  on public.research_runs (status, created_at desc);
create index candidate_changes_schema_status_idx
  on public.candidate_changes (schema_version, status, created_at desc);
create index demand_issuers_parent_idx
  on public.demand_issuers (parent_issuer_id);
create index demand_source_issuers_issuer_idx
  on public.demand_source_issuers (demand_issuer_id, demand_source_id);

create trigger demand_issuers_set_updated_at
before update on public.demand_issuers
for each row execute function private.set_updated_at();

alter table public.organization_aliases enable row level security;
alter table public.demand_issuers enable row level security;
alter table public.demand_source_issuers enable row level security;

create policy "published organization aliases are readable"
on public.organization_aliases for select to anon, authenticated
using (
  publication_status = 'published'
  and exists (
    select 1
    from public.organizations organization_record
    where organization_record.id = organization_aliases.organization_id
      and organization_record.publication_status = 'published'
  )
);

create policy "published demand issuers are readable"
on public.demand_issuers for select to anon, authenticated
using (publication_status = 'published');

create policy "published demand source issuers are readable"
on public.demand_source_issuers for select to anon, authenticated
using (
  publication_status = 'published'
  and exists (
    select 1
    from public.demand_sources source_record
    where source_record.id = demand_source_issuers.demand_source_id
      and source_record.publication_status = 'published'
  )
);

create policy "atlas staff manage organization aliases"
on public.organization_aliases for all to authenticated
using ((select private.is_atlas_staff()))
with check ((select private.is_atlas_staff()));

create policy "atlas staff manage demand issuers"
on public.demand_issuers for all to authenticated
using ((select private.is_atlas_staff()))
with check ((select private.is_atlas_staff()));

create policy "atlas staff manage demand source issuers"
on public.demand_source_issuers for all to authenticated
using ((select private.is_atlas_staff()))
with check ((select private.is_atlas_staff()));

grant select, insert, update, delete on table
  public.organization_aliases,
  public.demand_issuers,
  public.demand_source_issuers
to authenticated;

grant select on table
  public.organization_aliases,
  public.demand_issuers,
  public.demand_source_issuers
to anon;

grant all privileges on table
  public.organization_aliases,
  public.demand_issuers,
  public.demand_source_issuers
to service_role;

insert into public.demand_issuers (slug, name, issuer_type, jurisdiction, parent_issuer_id, publication_status)
values
  ('nato', 'NATO', 'alliance', 'NATO', null, 'published'),
  ('government-of-canada', 'Government of Canada', 'federal_government', 'Canada', null, 'published')
on conflict (slug) do update
set name = excluded.name,
    issuer_type = excluded.issuer_type,
    jurisdiction = excluded.jurisdiction,
    publication_status = excluded.publication_status,
    updated_at = now();

insert into public.demand_issuers (slug, name, issuer_type, jurisdiction, parent_issuer_id, publication_status)
select child.slug, child.name, child.issuer_type, 'Canada', parent.id, 'published'
from (
  values
    ('national-defence', 'National Defence', 'department', 'government-of-canada'),
    ('public-services-and-procurement-canada', 'Public Services and Procurement Canada', 'procurement_authority', 'government-of-canada')
) as child(slug, name, issuer_type, parent_slug)
join public.demand_issuers parent on parent.slug = child.parent_slug
on conflict (slug) do update
set name = excluded.name,
    issuer_type = excluded.issuer_type,
    jurisdiction = excluded.jurisdiction,
    parent_issuer_id = excluded.parent_issuer_id,
    publication_status = excluded.publication_status,
    updated_at = now();

insert into public.demand_issuers (slug, name, issuer_type, jurisdiction, parent_issuer_id, publication_status)
select
  'defence-research-and-development-canada',
  'Defence Research and Development Canada',
  'research_innovation_agency',
  'Canada',
  parent.id,
  'published'
from public.demand_issuers parent
where parent.slug = 'national-defence'
on conflict (slug) do update
set name = excluded.name,
    issuer_type = excluded.issuer_type,
    jurisdiction = excluded.jurisdiction,
    parent_issuer_id = excluded.parent_issuer_id,
    publication_status = excluded.publication_status,
    updated_at = now();

insert into public.demand_issuers (slug, name, issuer_type, jurisdiction, parent_issuer_id, publication_status)
select child.slug, child.name, child.issuer_type, 'Canada', parent.id, 'published'
from (
  values
    ('canadian-armed-forces', 'Canadian Armed Forces', 'armed_forces', 'national-defence'),
    ('ideas', 'Innovation for Defence Excellence and Security', 'public_program', 'national-defence')
) as child(slug, name, issuer_type, parent_slug)
join public.demand_issuers parent on parent.slug = child.parent_slug
on conflict (slug) do update
set name = excluded.name,
    issuer_type = excluded.issuer_type,
    jurisdiction = excluded.jurisdiction,
    parent_issuer_id = excluded.parent_issuer_id,
    publication_status = excluded.publication_status,
    updated_at = now();

insert into public.demand_issuers (slug, name, issuer_type, jurisdiction, parent_issuer_id, publication_status)
select child.slug, child.name, 'military_service', 'Canada', parent.id, 'published'
from (
  values
    ('royal-canadian-navy', 'Royal Canadian Navy'),
    ('royal-canadian-air-force', 'Royal Canadian Air Force'),
    ('canadian-army', 'Canadian Army')
) as child(slug, name)
join public.demand_issuers parent on parent.slug = 'canadian-armed-forces'
on conflict (slug) do update
set name = excluded.name,
    issuer_type = excluded.issuer_type,
    jurisdiction = excluded.jurisdiction,
    parent_issuer_id = excluded.parent_issuer_id,
    publication_status = excluded.publication_status,
    updated_at = now();

update public.demand_sources
set source_kind = 'official_problem_statement',
    commitment_level = 'directional'
where slug = 'nato-aggregated-demand-signal-2026';

insert into public.demand_source_issuers (
  demand_source_id,
  demand_issuer_id,
  issuer_role,
  publication_status
)
select source_record.id, issuer.id, 'issuer', source_record.publication_status
from public.demand_sources source_record
join public.demand_issuers issuer on issuer.slug = 'nato'
where source_record.slug = 'nato-aggregated-demand-signal-2026'
on conflict (demand_source_id, demand_issuer_id, issuer_role) do update
set publication_status = excluded.publication_status;

comment on table public.demand_issuers
is 'Canonical public authorities that issue, sponsor, or benefit from public demand sources.';
comment on table public.demand_source_issuers
is 'Many-to-many demand-source issuer links with issuer, co-issuer, sponsor, and beneficiary roles.';
comment on table public.organization_aliases
is 'Sourced aliases used for identity resolution and duplicate review.';
comment on column public.research_runs.validation_results
is 'Structured autonomous-run validator output; never a publication approval.';
comment on column public.candidate_changes.schema_version
is 'Typed candidate contract such as organization_bundle_v2 or demand_signal_bundle_v1.';
