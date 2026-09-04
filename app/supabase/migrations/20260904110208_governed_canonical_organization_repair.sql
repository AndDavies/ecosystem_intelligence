-- Governed canonical organization repair.
--
-- Canonical identity/lifecycle corrections are intentionally isolated from
-- ordinary dossier refreshes. Research can stage a private, exact-snapshot
-- proposal; one human reviews one repair; a second explicit checkpoint
-- publishes that one repair atomically. Nothing here grants research direct
-- canonical write authority, reparents data, transfers claims, or hard-deletes
-- a record.

alter table public.candidate_changes
  drop constraint if exists candidate_changes_kind_check;
alter table public.candidate_changes
  add constraint candidate_changes_kind_check
  check (candidate_kind = any (array[
    'source_intake'::text,
    'organization_bundle'::text,
    'demand_signal_bundle'::text,
    'program_relationship_bundle'::text,
    'demand_match_bundle'::text,
    'organization_refresh_bundle'::text,
    'organization_canonical_repair_bundle'::text,
    'demand_refresh_bundle'::text
  ]));

alter table public.candidate_changes
  drop constraint if exists candidate_changes_typed_reviewer_rationale_check;
alter table public.candidate_changes
  add constraint candidate_changes_typed_reviewer_rationale_check
  check (
    proposed_record->>'schemaVersion' <> all (array[
      'organization_bundle_v2'::text,
      'organization_bundle_v3'::text,
      'demand_signal_bundle_v1'::text,
      'program_relationship_bundle_v1'::text,
      'demand_match_bundle_v1'::text,
      'organization_refresh_bundle_v1'::text,
      'organization_refresh_bundle_v2'::text,
      'organization_canonical_repair_bundle_v1'::text,
      'demand_refresh_bundle_v1'::text
    ])
    or length(trim(coalesce(reviewer_rationale, ''))) between 80 and 2000
  );

create or replace function private.sync_typed_candidate_reviewer_rationale()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare generated_rationale text;
begin
  if new.proposed_record->>'schemaVersion' = any (array[
    'organization_bundle_v2', 'organization_bundle_v3',
    'demand_signal_bundle_v1', 'program_relationship_bundle_v1',
    'demand_match_bundle_v1', 'organization_refresh_bundle_v1',
    'organization_refresh_bundle_v2', 'organization_canonical_repair_bundle_v1',
    'demand_refresh_bundle_v1'
  ]) then
    generated_rationale := nullif(trim(new.proposed_record->>'reviewerRationale'), '');
    if generated_rationale is null or length(generated_rationale) < 80 or length(generated_rationale) > 2000 then
      raise exception 'Typed research candidates require an 80-2000 character reviewer rationale.' using errcode = '22023';
    end if;
    new.reviewer_rationale := generated_rationale;
  end if;
  return new;
end;
$$;

revoke all on function private.sync_typed_candidate_reviewer_rationale()
from public, anon, authenticated;

create unique index candidate_changes_one_open_canonical_repair_target_idx
  on public.candidate_changes (target_entity_id)
  where candidate_kind = 'organization_canonical_repair_bundle'
    and status in ('pending', 'approved');

-- Canonical repairs can be read by the normal owner-only Admin UI, but their
-- payload and lifecycle may be changed only through the dedicated staging,
-- review, and publication functions below. This prevents a generic table
-- update from bypassing the individual audited checkpoints.
drop policy if exists "atlas staff manage candidates" on public.candidate_changes;
create policy "atlas staff read candidates" on public.candidate_changes
for select to authenticated using ((select private.is_atlas_staff()));
create policy "atlas staff create ordinary candidates" on public.candidate_changes
for insert to authenticated
with check ((select private.is_atlas_staff()) and candidate_kind <> 'organization_canonical_repair_bundle');
create policy "atlas staff update ordinary candidates" on public.candidate_changes
for update to authenticated
using ((select private.is_atlas_staff()) and candidate_kind <> 'organization_canonical_repair_bundle')
with check ((select private.is_atlas_staff()) and candidate_kind <> 'organization_canonical_repair_bundle');
create policy "atlas staff delete ordinary candidates" on public.candidate_changes
for delete to authenticated
using ((select private.is_atlas_staff()) and candidate_kind <> 'organization_canonical_repair_bundle');

create table public.organization_slug_redirects (
  id uuid primary key default gen_random_uuid(),
  source_organization_id uuid not null unique references public.organizations(id) on delete restrict,
  source_slug text not null unique check (source_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  destination_organization_id uuid not null references public.organizations(id) on delete restrict,
  candidate_change_id uuid not null unique references public.candidate_changes(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (source_organization_id <> destination_organization_id)
);

comment on table public.organization_slug_redirects
is 'Immutable, reviewed, one-hop redirects from an archived organization slug to its exact published successor. The table never reparents or transfers canonical claims.';

create index organization_slug_redirects_destination_idx
  on public.organization_slug_redirects (destination_organization_id);

create or replace function private.prevent_organization_slug_redirect_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception 'Published organization successor redirects are immutable.' using errcode = '55000';
end;
$$;

revoke all on function private.prevent_organization_slug_redirect_mutation()
from public, anon, authenticated;

create trigger organization_slug_redirects_are_immutable
before update or delete on public.organization_slug_redirects
for each row execute function private.prevent_organization_slug_redirect_mutation();

alter table public.organization_slug_redirects enable row level security;
revoke all on public.organization_slug_redirects from public, anon, authenticated, service_role;
grant select on public.organization_slug_redirects to service_role;

create or replace function private.research_pipeline_version_at_least(
  p_version text,
  p_required_major integer,
  p_required_minor integer,
  p_required_patch integer
)
returns boolean
language sql
immutable
set search_path = pg_catalog
as $$
  with parsed as (
    select regexp_match(
      coalesce(p_version, ''),
      '^tnm-research-pipeline/([0-9]+)\.([0-9]+)\.([0-9]+)$'
    ) as parts
  )
  select coalesce(
    array[(parts)[1]::integer, (parts)[2]::integer, (parts)[3]::integer]
      >= array[p_required_major, p_required_minor, p_required_patch],
    false
  )
  from parsed;
$$;

revoke all on function private.research_pipeline_version_at_least(text, integer, integer, integer)
from public, anon, authenticated, service_role;
grant execute on function private.research_pipeline_version_at_least(text, integer, integer, integer)
to service_role;

create or replace function private.normalize_organization_identity(p_value text)
returns text
language sql
immutable
set search_path = pg_catalog
as $$
  select trim(regexp_replace(lower(trim(coalesce(p_value, ''))), '[^a-zA-Z0-9]+', ' ', 'g'));
$$;

revoke all on function private.normalize_organization_identity(text)
from public, anon, authenticated;

create or replace function private.normalize_organization_website_domain(p_value text)
returns text
language sql
immutable
set search_path = pg_catalog
as $$
  select nullif(
    regexp_replace(
      lower(split_part(split_part(trim(coalesce(p_value, '')), '://', 2), '/', 1)),
      '^www\.',
      ''
    ),
    ''
  );
$$;

revoke all on function private.normalize_organization_website_domain(text)
from public, anon, authenticated, service_role;

create or replace function private.canonical_repair_profile_fields(p_entity_kind text)
returns text[]
language sql
immutable
set search_path = pg_catalog
as $$
  select case p_entity_kind
    when 'company' then array[
      'portfolioScope', 'portfolioSummary', 'manufacturingModel', 'intellectualProperty',
      'operatingModel', 'securityPosture', 'qualityCertification', 'operatingUnits',
      'parentOrganization', 'publicContact'
    ]::text[]
    when 'accelerator' then array['mandate', 'cohortModel', 'sectorFocus', 'parentOrganization', 'publicContact']::text[]
    when 'incubator' then array['mandate', 'cohortModel', 'sectorFocus', 'parentOrganization', 'publicContact']::text[]
    when 'research_test_centre' then array[
      'technicalMandate', 'institutionalRelationship', 'parentOrganization', 'priorityAreas',
      'testbedPlatforms', 'operatingEnvironment', 'secureEnvironmentRole', 'strategicSectors',
      'publicContact'
    ]::text[]
    when 'investor_funder' then array['mandate', 'investmentFocus', 'portfolioSummary', 'parentOrganization', 'publicContact']::text[]
    when 'ecosystem_organization' then array['mandate', 'sectorFocus', 'parentOrganization', 'publicContact']::text[]
    when 'government_innovation_office' then array['mandate', 'parentOrganization', 'classificationNote', 'publicContact']::text[]
    else '{}'::text[]
  end;
$$;

revoke all on function private.canonical_repair_profile_fields(text)
from public, anon, authenticated, service_role;

create or replace function private.canonical_repair_required_profile_field(p_entity_kind text)
returns text
language sql
immutable
set search_path = pg_catalog
as $$
  select case
    when p_entity_kind = 'research_test_centre' then 'technicalMandate'
    when p_entity_kind in (
      'accelerator', 'incubator', 'investor_funder',
      'ecosystem_organization', 'government_innovation_office'
    ) then 'mandate'
    else null
  end;
$$;

revoke all on function private.canonical_repair_required_profile_field(text)
from public, anon, authenticated, service_role;

create or replace function private.canonical_repair_has_evidence(
  p_record jsonb,
  p_operation_id text,
  p_field_path text,
  p_claim_class text
)
returns boolean
language sql
immutable
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from jsonb_array_elements(p_record->'operations') operation(value_operation)
    join lateral jsonb_array_elements_text(value_operation->'evidenceIds') evidence_id(value_id) on true
    join lateral jsonb_array_elements(p_record->'fieldEvidence') evidence(value_evidence)
      on value_evidence->>'id' = value_id
    where value_operation->>'operationId' = p_operation_id
      and value_evidence->>'fieldPath' = p_field_path
      and value_evidence->>'claimClass' = p_claim_class
  );
$$;

revoke all on function private.canonical_repair_has_evidence(jsonb, text, text, text)
from public, anon, authenticated, service_role;

create or replace function private.canonical_repair_profile_value_valid(p_value jsonb)
returns boolean
language sql
immutable
set search_path = pg_catalog
as $$
  select coalesce(p_value = 'null'::jsonb
    or (jsonb_typeof(p_value) = 'string' and length(trim(p_value #>> '{}')) between 2 and 4000)
    or (
      jsonb_typeof(p_value) = 'array'
      and jsonb_array_length(p_value) between 1 and 30
      and not exists (
        select 1 from jsonb_array_elements(p_value) item(value)
        where jsonb_typeof(value) <> 'string'
           or length(trim(value #>> '{}')) not between 2 and 1000
      )
    ), false);
$$;

revoke all on function private.canonical_repair_profile_value_valid(jsonb)
from public, anon, authenticated, service_role;

create or replace function private.canonical_capability_dependencies(p_capability_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'activeDomainKeys', coalesce((
      select jsonb_agg(format('%s:%s', link.capability_id, link.technical_domain_id) order by format('%s:%s', link.capability_id, link.technical_domain_id))
      from public.capability_domains link
      where link.capability_id = p_capability_id and link.publication_status <> 'archived'
    ), '[]'::jsonb),
    'activeMissionMatchIds', coalesce((
      select jsonb_agg(link.id::text order by link.id::text)
      from public.capability_mission_matches link
      where link.capability_id = p_capability_id and link.publication_status <> 'archived'
    ), '[]'::jsonb),
    'activeClusterKeys', coalesce((
      select jsonb_agg(format('%s:%s', link.capability_id, link.ecosystem_cluster_id) order by format('%s:%s', link.capability_id, link.ecosystem_cluster_id))
      from public.capability_clusters link
      where link.capability_id = p_capability_id and link.publication_status <> 'archived'
    ), '[]'::jsonb),
    'activeDemandMatchIds', coalesce((
      select jsonb_agg(link.id::text order by link.id::text)
      from public.capability_demand_matches link
      where link.capability_id = p_capability_id and link.publication_status <> 'archived'
    ), '[]'::jsonb),
    'activeMediaAssetIds', coalesce((
      select jsonb_agg(asset.id::text order by asset.id::text)
      from public.media_assets asset
      where asset.capability_id = p_capability_id and asset.publication_status <> 'archived'
    ), '[]'::jsonb),
    'signalRecordLinkIds', coalesce((
      select jsonb_agg(link.id::text order by link.id::text)
      from public.signal_record_links link
      where link.record_type = 'capability' and link.record_id = p_capability_id
    ), '[]'::jsonb),
    'wikiPageRecordLinkIds', coalesce((
      select jsonb_agg(link.id::text order by link.id::text)
      from public.wiki_page_record_links link
      where link.record_type = 'capability' and link.record_id = p_capability_id
    ), '[]'::jsonb)
  );
$$;

revoke all on function private.canonical_capability_dependencies(uuid)
from public, anon;

create or replace function private.canonical_organization_dependencies(p_organization_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  with active_capabilities as (
    select id from public.capabilities
    where organization_id = p_organization_id and publication_status <> 'archived'
  )
  select jsonb_build_object(
    'activeDomainKeys', coalesce((
      select jsonb_agg(format('%s:%s', link.capability_id, link.technical_domain_id) order by format('%s:%s', link.capability_id, link.technical_domain_id))
      from public.capability_domains link join active_capabilities capability on capability.id = link.capability_id
      where link.publication_status <> 'archived'
    ), '[]'::jsonb),
    'activeMissionMatchIds', coalesce((
      select jsonb_agg(link.id::text order by link.id::text)
      from public.capability_mission_matches link join active_capabilities capability on capability.id = link.capability_id
      where link.publication_status <> 'archived'
    ), '[]'::jsonb),
    'activeClusterKeys', coalesce((
      select jsonb_agg(format('%s:%s', link.capability_id, link.ecosystem_cluster_id) order by format('%s:%s', link.capability_id, link.ecosystem_cluster_id))
      from public.capability_clusters link join active_capabilities capability on capability.id = link.capability_id
      where link.publication_status <> 'archived'
    ), '[]'::jsonb),
    'activeDemandMatchIds', coalesce((
      select jsonb_agg(link.id::text order by link.id::text)
      from public.capability_demand_matches link join active_capabilities capability on capability.id = link.capability_id
      where link.publication_status <> 'archived'
    ), '[]'::jsonb),
    'activeMediaAssetIds', coalesce((
      select jsonb_agg(asset.id::text order by asset.id::text)
      from public.media_assets asset
      where asset.publication_status <> 'archived'
        and (asset.organization_id = p_organization_id or asset.capability_id in (select id from active_capabilities))
    ), '[]'::jsonb),
    'signalRecordLinkIds', coalesce((
      select jsonb_agg(link.id::text order by link.id::text)
      from public.signal_record_links link
      where (link.record_type = 'organization' and link.record_id = p_organization_id)
         or (link.record_type = 'capability' and link.record_id in (select id from active_capabilities))
    ), '[]'::jsonb),
    'wikiPageRecordLinkIds', coalesce((
      select jsonb_agg(link.id::text order by link.id::text)
      from public.wiki_page_record_links link
      where (link.record_type = 'organization' and link.record_id = p_organization_id)
         or (link.record_type = 'capability' and link.record_id in (select id from active_capabilities))
    ), '[]'::jsonb),
    'activeAliasIds', coalesce((
      select jsonb_agg(alias_record.id::text order by alias_record.id::text)
      from public.organization_aliases alias_record
      where alias_record.organization_id = p_organization_id and alias_record.publication_status <> 'archived'
    ), '[]'::jsonb),
    'activeLocationLinkIds', coalesce((
      select jsonb_agg(link.id::text order by link.id::text)
      from public.organization_locations link
      where link.organization_id = p_organization_id and link.publication_status <> 'archived'
    ), '[]'::jsonb),
    'activeCapabilityIds', coalesce((
      select jsonb_agg(capability.id::text order by capability.id::text) from active_capabilities capability
    ), '[]'::jsonb),
    'activeProgramParticipationIds', coalesce((
      select jsonb_agg(link.id::text order by link.id::text)
      from public.program_participations link
      where link.organization_id = p_organization_id and link.publication_status <> 'archived'
    ), '[]'::jsonb),
    'activeRelationshipIds', coalesce((
      select jsonb_agg(link.id::text order by link.id::text)
      from public.organization_relationships link
      where link.organization_id = p_organization_id and link.publication_status <> 'archived'
    ), '[]'::jsonb),
    'activeFundingEventIds', coalesce((
      select jsonb_agg(event_record.id::text order by event_record.id::text)
      from public.funding_events event_record
      where event_record.organization_id = p_organization_id and event_record.publication_status <> 'archived'
    ), '[]'::jsonb),
    'incomingActiveRelationshipIds', coalesce((
      select jsonb_agg(link.id::text order by link.id::text)
      from public.organization_relationships link
      where link.related_organization_id = p_organization_id
        and link.organization_id <> p_organization_id
        and link.publication_status <> 'archived'
    ), '[]'::jsonb)
  );
$$;

revoke all on function private.canonical_organization_dependencies(uuid)
from public, anon;

create or replace function public.get_canonical_organization_repair_snapshot(
  p_run_id text,
  p_slugs text[]
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, private
as $$
declare
  result jsonb;
  requested_count integer;
begin
  requested_count := coalesce(cardinality(p_slugs), 0);
  if coalesce(p_run_id, '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
     or requested_count not between 1 and 25
     or array_position(p_slugs, null) is not null
     or exists (select 1 from unnest(p_slugs) slug(value) where value !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
     or (select count(distinct value) from unnest(p_slugs) slug(value)) <> requested_count then
    raise exception 'Canonical repair snapshot requires one stable run ID and 1-25 unique canonical slugs.' using errcode = '22023';
  end if;

  if (
    select count(*)
    from public.organizations organization_record
    where organization_record.slug = any(p_slugs)
      and organization_record.publication_status = 'published'
  ) <> requested_count then
    raise exception 'Every canonical repair snapshot target must resolve to one currently published organization.' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.organizations organization_record
    where organization_record.slug = any(p_slugs)
      and (
        (select count(*) from public.organization_aliases alias_record
          where alias_record.organization_id = organization_record.id
            and alias_record.publication_status <> 'archived') > 50
        or (select count(*) from public.capabilities capability_record
          where capability_record.organization_id = organization_record.id
            and capability_record.publication_status <> 'archived') > 50
      )
  ) then
    raise exception 'Canonical repair snapshot exceeds the v1 alias or capability bound; do not truncate canonical state.' using errcode = '54000';
  end if;

  select jsonb_build_object(
    'schemaVersion', 'canonical_organization_repair_snapshot_v1',
    'runId', p_run_id,
    'capturedAt', to_jsonb(statement_timestamp()),
    'targets', coalesce(jsonb_agg(
      jsonb_build_object(
        'organization', jsonb_build_object(
          'id', organization_record.id::text,
          'slug', organization_record.slug,
          'name', organization_record.name,
          'legalName', organization_record.legal_name,
          'websiteUrl', organization_record.website_url,
          'entityKind', organization_record.entity_kind,
          'organizationCategories', coalesce((
            select jsonb_agg(category order by category)
            from unnest(organization_record.organization_categories) category
          ), '[]'::jsonb),
          'profileData', organization_record.profile_data,
          'publicationStatus', organization_record.publication_status,
          'updatedAt', to_jsonb(organization_record.updated_at)
        ),
        'activeAliases', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', alias_record.id::text,
            'alias', alias_record.alias,
            'aliasType', alias_record.alias_type,
            'publicationStatus', alias_record.publication_status
          ) order by alias_record.id::text)
          from public.organization_aliases alias_record
          where alias_record.organization_id = organization_record.id
            and alias_record.publication_status <> 'archived'
        ), '[]'::jsonb),
        'activeCapabilities', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', capability_record.id::text,
            'slug', capability_record.slug,
            'name', capability_record.name,
            'publicationStatus', capability_record.publication_status,
            'updatedAt', to_jsonb(capability_record.updated_at)
          ) order by capability_record.id::text)
          from public.capabilities capability_record
          where capability_record.organization_id = organization_record.id
            and capability_record.publication_status <> 'archived'
        ), '[]'::jsonb),
        'organizationDependencies', private.canonical_organization_dependencies(organization_record.id),
        'capabilityDependencies', coalesce((
          select jsonb_agg(jsonb_build_object(
            'capabilityId', capability_record.id::text,
            'dependencies', private.canonical_capability_dependencies(capability_record.id)
          ) order by capability_record.id::text)
          from public.capabilities capability_record
          where capability_record.organization_id = organization_record.id
            and capability_record.publication_status <> 'archived'
        ), '[]'::jsonb),
        'publicationBlockers', jsonb_build_object(
          'savedCollectionItemIds', coalesce((
            select jsonb_agg(item.id::text order by item.id::text)
            from public.saved_collection_items item
            where (item.entity_type = 'organization' and item.entity_id = organization_record.id)
               or (item.entity_type = 'capability' and item.entity_id in (
                 select capability_record.id from public.capabilities capability_record
                 where capability_record.organization_id = organization_record.id
                   and capability_record.publication_status <> 'archived'
               ))
          ), '[]'::jsonb),
          'activeConnectionRequestIds', coalesce((
            select jsonb_agg(request_record.id::text order by request_record.id::text)
            from public.connection_requests request_record
            where request_record.organization_id = organization_record.id
              and request_record.status not in ('declined', 'closed')
          ), '[]'::jsonb),
          'activeSubmissionIds', coalesce((
            select jsonb_agg(submission_record.id::text order by submission_record.id::text)
            from public.submissions submission_record
            where submission_record.status in ('pending', 'in_review', 'approved')
              and (
                (submission_record.target_entity_type = 'organization' and submission_record.target_entity_id = organization_record.id)
                or (submission_record.target_entity_type = 'capability' and submission_record.target_entity_id in (
                  select capability_record.id from public.capabilities capability_record
                  where capability_record.organization_id = organization_record.id
                    and capability_record.publication_status <> 'archived'
                ))
              )
          ), '[]'::jsonb),
          'incomingRedirectIds', coalesce((
            select jsonb_agg(redirect_record.id::text order by redirect_record.id::text)
            from public.organization_slug_redirects redirect_record
            where redirect_record.destination_organization_id = organization_record.id
          ), '[]'::jsonb)
        )
      ) order by organization_record.slug
    ), '[]'::jsonb)
  ) into result
  from public.organizations organization_record
  where organization_record.slug = any(p_slugs)
    and organization_record.publication_status = 'published';

  return result;
end;
$$;

revoke all on function public.get_canonical_organization_repair_snapshot(text, text[])
from public, anon, authenticated, service_role;
grant execute on function public.get_canonical_organization_repair_snapshot(text, text[])
to service_role;

comment on function public.get_canonical_organization_repair_snapshot(text, text[])
is 'Returns one bounded, private, service-role-only exact current-state snapshot for a canonical organization repair run. It includes current profile data, performs no write, and excludes owner or requester content.';

create or replace function private.assert_organization_canonical_repair_candidate(
  p_candidate public.candidate_changes
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  record jsonb := p_candidate.proposed_record;
  before_identity jsonb;
  before_aliases jsonb;
  before_capabilities jsonb;
  live_aliases jsonb;
  live_capabilities jsonb;
  operation_record jsonb;
  source_record jsonb;
  evidence_record jsonb;
  identity_operation jsonb;
  live_organization public.organizations%rowtype;
  live_alias public.organization_aliases%rowtype;
  live_capability public.capabilities%rowtype;
  successor_record public.organizations%rowtype;
  archived_alias_ids uuid[] := '{}';
  proposed_identity_values text[] := '{}';
  final_alias_values text[] := '{}';
  proposed_name text;
  proposed_legal_name text;
  proposed_website text;
  identity_value text;
  operation_id text;
  operation_kind text;
  operation_target_key text;
  evidence_id_value text;
  required_profile_field text;
  resulting_entity_kind text;
  resulting_profile_data jsonb;
  allowed_profile_fields text[];
  archive_organization_count integer := 0;
begin
  if p_candidate.candidate_kind <> 'organization_canonical_repair_bundle'
     or p_candidate.schema_version <> 'organization_canonical_repair_bundle_v1'
     or record->>'candidateKind' is distinct from 'organization_canonical_repair_bundle'
     or record->>'schemaVersion' is distinct from 'organization_canonical_repair_bundle_v1'
     or p_candidate.target_entity_type <> 'organization'
     or p_candidate.target_entity_id is null
     or record#>>'{targetMatch,entityType}' is distinct from 'organization'
     or record#>>'{targetMatch,entityId}' is distinct from p_candidate.target_entity_id::text
     or record#>>'{targetMatch,confidence}' is distinct from 'high'
     or p_candidate.research_run_id is null
     or not exists (
       select 1
       from public.research_runs run_record
       where run_record.id = p_candidate.research_run_id
         and private.research_pipeline_version_at_least(run_record.agent_version, 1, 8, 0)
         and run_record.scope->>'researchMode' = 'canonical_repair'
         and run_record.status = 'completed'
     )
     or p_candidate.client_candidate_id is distinct from record->>'candidateId'
     or p_candidate.confidence is distinct from record->>'confidence'
     or p_candidate.reviewer_rationale is distinct from record->>'reviewerRationale'
     or p_candidate.before_record is distinct from record->'beforeRecord'
     or p_candidate.field_evidence is distinct from record->'fieldEvidence'
     or p_candidate.duplicate_check is distinct from record->'duplicateCheck'
     or to_jsonb(p_candidate.source_lead_ids) is distinct from record->'sourceLeadIds'
     or coalesce(record->>'reviewStatus', '') <> 'candidate_pending'
     or coalesce(record->>'confidence', '') not in ('high', 'moderate', 'needs_review')
     or coalesce(p_candidate.duplicate_check->>'status', '') <> 'clear'
     or coalesce(jsonb_array_length(p_candidate.duplicate_check->'matches'), 0) <> 0
     or jsonb_typeof(record->'duplicateCheck') <> 'object'
     or jsonb_typeof(record->'beforeRecord') <> 'object'
     or jsonb_typeof(record->'targetMatch') <> 'object'
     or jsonb_typeof(record->'operations') <> 'array'
     or jsonb_array_length(record->'operations') < 1
     or jsonb_array_length(record->'operations') > 10
     or jsonb_typeof(record->'sources') <> 'array'
     or jsonb_array_length(record->'sources') < 1
     or jsonb_typeof(record->'fieldEvidence') <> 'array'
     or jsonb_array_length(record->'fieldEvidence') < 1
     or jsonb_typeof(record->'sourceLeadIds') <> 'array'
     or jsonb_array_length(record->'sourceLeadIds') < 1 then
    raise exception 'Canonical repair candidate % does not satisfy its typed intake contract.', p_candidate.id using errcode = '22023';
  end if;

  if jsonb_typeof(record->'candidateId') is distinct from 'string'
     or jsonb_typeof(record->'reviewerRationale') is distinct from 'string'
     or jsonb_typeof(record#>'{targetMatch,entityType}') is distinct from 'string'
     or jsonb_typeof(record#>'{targetMatch,entityId}') is distinct from 'string'
     or jsonb_typeof(record#>'{targetMatch,slug}') is distinct from 'string'
     or jsonb_typeof(record#>'{targetMatch,confidence}') is distinct from 'string'
     or jsonb_typeof(record#>'{targetMatch,baselineUpdatedAt}') is distinct from 'string'
     or jsonb_typeof(record#>'{duplicateCheck,status}') is distinct from 'string'
     or jsonb_typeof(record#>'{duplicateCheck,note}') is distinct from 'string'
     or jsonb_typeof(record#>'{duplicateCheck,checkedAt}') is distinct from 'string'
     or coalesce(record->>'candidateId', '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
     or length(trim(coalesce(record->>'reviewerRationale', ''))) not between 80 and 2000
     or jsonb_array_length(record->'sources') > 50
     or jsonb_array_length(record->'fieldEvidence') > 100
     or jsonb_typeof(record#>'{beforeRecord,activeAliases}') <> 'array'
     or jsonb_array_length(record#>'{beforeRecord,activeAliases}') > 50
     or jsonb_typeof(record#>'{beforeRecord,activeCapabilities}') <> 'array'
     or jsonb_array_length(record#>'{beforeRecord,activeCapabilities}') > 50
     or jsonb_typeof(record#>'{targetMatch,matchMethods}') <> 'array'
     or jsonb_array_length(record#>'{targetMatch,matchMethods}') < 1
     or exists (
       select 1 from jsonb_array_elements(record#>'{targetMatch,matchMethods}') method(value)
       where jsonb_typeof(value) is distinct from 'string'
          or value #>> '{}' not in ('canonical_url', 'website_domain', 'slug', 'legal_name', 'alias', 'name', 'parent_relationship')
     )
     or (select count(*) from jsonb_array_elements_text(record#>'{targetMatch,matchMethods}'))
       <> (select count(distinct value) from jsonb_array_elements_text(record#>'{targetMatch,matchMethods}') method(value))
     or jsonb_typeof(record->'duplicateCheck') <> 'object'
     or record#>>'{duplicateCheck,status}' <> 'clear'
     or jsonb_typeof(record#>'{duplicateCheck,methods}') <> 'array'
     or jsonb_array_length(record#>'{duplicateCheck,methods}') < 3
     or exists (
       select 1 from jsonb_array_elements(record#>'{duplicateCheck,methods}') method(value)
       where jsonb_typeof(value) is distinct from 'string'
          or value #>> '{}' not in ('canonical_url', 'website_domain', 'slug', 'legal_name', 'alias', 'fuzzy_name')
     )
     or (select count(*) from jsonb_array_elements_text(record#>'{duplicateCheck,methods}'))
       <> (select count(distinct value) from jsonb_array_elements_text(record#>'{duplicateCheck,methods}') method(value))
     or jsonb_typeof(record#>'{duplicateCheck,matches}') <> 'array'
     or jsonb_array_length(record#>'{duplicateCheck,matches}') <> 0
     or length(trim(coalesce(record#>>'{duplicateCheck,note}', ''))) not between 10 and 1000
     or nullif(record#>>'{duplicateCheck,checkedAt}', '') is null then
    raise exception 'Canonical repair identity, target-match, duplicate, or bounded-count contract is invalid.' using errcode = '22023';
  end if;

  -- These casts deliberately fail closed on malformed timestamps before a
  -- candidate can be staged or reviewed.
  perform (record#>>'{targetMatch,baselineUpdatedAt}')::timestamptz;
  perform (record#>>'{duplicateCheck,checkedAt}')::timestamptz;
  if exists (
    select 1 from jsonb_array_elements(record->'sourceLeadIds') lead(value)
    where jsonb_typeof(value) is distinct from 'string'
       or value #>> '{}' !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ) or (select count(*) from jsonb_array_elements_text(record->'sourceLeadIds'))
    <> (select count(distinct value) from jsonb_array_elements_text(record->'sourceLeadIds') lead(value)) then
    raise exception 'Canonical repair source-lead IDs must be unique stable identifiers.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(record->'sources') source(value)
    where jsonb_typeof(value) <> 'object'
       or jsonb_typeof(value->'id') is distinct from 'string'
       or jsonb_typeof(value->'url') is distinct from 'string'
       or jsonb_typeof(value->'title') is distinct from 'string'
       or jsonb_typeof(value->'publisher') is distinct from 'string'
       or jsonb_typeof(value->'sourceKind') is distinct from 'string'
       or jsonb_typeof(value->'accessedAt') is distinct from 'string'
       or jsonb_typeof(value->'locator') is distinct from 'string'
       or jsonb_typeof(value->'summary') is distinct from 'string'
       or (value->'publishedAt' is not null and value->'publishedAt' <> 'null'::jsonb
         and jsonb_typeof(value->'publishedAt') is distinct from 'string')
       or coalesce(value->>'id', '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
       or coalesce(value->>'url', '') !~ '^https://[^[:space:]/?#]+([/?#][^[:space:]]*)?$'
       or length(trim(coalesce(value->>'title', ''))) < 8
       or length(value->>'title') > 500
       or length(trim(coalesce(value->>'publisher', ''))) < 2
       or length(value->>'publisher') > 240
       or coalesce(value->>'sourceKind', '') not in (
         'official_company_product', 'official_company_news', 'accelerator_cohort_directory',
         'incubator_program_directory', 'investor_portfolio', 'research_centre_profile',
         'official_organization_profile', 'government_service_page', 'innovation_program',
         'procurement_notice', 'award_or_contract', 'official_policy', 'official_report',
         'association_directory', 'event_directory', 'reputable_industry_publication'
       )
       or nullif(value->>'accessedAt', '') is null
       or length(trim(coalesce(value->>'locator', ''))) < 2
       or length(value->>'locator') > 500
       or length(trim(coalesce(value->>'summary', ''))) < 40
       or length(value->>'summary') > 4000
  ) or exists (
    select 1
    from jsonb_array_elements(record->'sources') source(value)
    group by value->>'id'
    having count(*) <> 1
  ) or exists (
    select 1
    from jsonb_array_elements(record->'sources') source(value)
    group by value->>'url'
    having count(*) <> 1
  ) then
    raise exception 'Canonical repair sources must be complete and have unique stable IDs and canonical URLs.' using errcode = '22023';
  end if;
  for source_record in select value from jsonb_array_elements(record->'sources') source(value)
  loop
    perform (source_record->>'accessedAt')::timestamptz;
    if source_record->'publishedAt' is not null and source_record->'publishedAt' <> 'null'::jsonb then
      perform (source_record->>'publishedAt')::timestamptz;
    end if;
  end loop;

  if exists (
    select 1
    from jsonb_array_elements(record->'fieldEvidence') evidence(value)
    where jsonb_typeof(value) <> 'object'
       or jsonb_typeof(value->'id') is distinct from 'string'
       or jsonb_typeof(value->'sourceId') is distinct from 'string'
       or jsonb_typeof(value->'fieldPath') is distinct from 'string'
       or jsonb_typeof(value->'claimClass') is distinct from 'string'
       or jsonb_typeof(value->'excerpt') is distinct from 'string'
       or jsonb_typeof(value->'confidence') is distinct from 'string'
       or coalesce(value->>'id', '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
       or coalesce(value->>'sourceId', '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
       or length(trim(coalesce(value->>'fieldPath', ''))) < 3
       or length(value->>'fieldPath') > 300
       or coalesce(value->>'claimClass', '') not in ('source_backed', 'derived')
       or length(trim(coalesce(value->>'excerpt', ''))) < 30
       or length(value->>'excerpt') > 1000
       or coalesce(value->>'confidence', '') not in ('high', 'moderate', 'needs_review')
       or not exists (
         select 1 from jsonb_array_elements(record->'sources') source(value_source)
         where value_source->>'id' = value->>'sourceId'
       )
  ) or exists (
    select 1
    from jsonb_array_elements(record->'fieldEvidence') evidence(value)
    group by value->>'id'
    having count(*) <> 1
  ) then
    raise exception 'Canonical repair field evidence must be complete, source-bound, and uniquely identified.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(record->'operations') operation(value)
    where jsonb_typeof(value) <> 'object'
       or jsonb_typeof(value->'operationId') is distinct from 'string'
       or jsonb_typeof(value->'operation') is distinct from 'string'
       or jsonb_typeof(value->'targetId') is distinct from 'string'
       or jsonb_typeof(value->'reviewerExplanation') is distinct from 'string'
       or coalesce(value->>'operationId', '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
       or coalesce(value->>'operation', '') not in (
         'set_organization_identity', 'set_profile_field', 'add_alias',
         'archive_alias', 'archive_capability', 'archive_organization'
       )
       or value->>'targetId' is distinct from p_candidate.target_entity_id::text
       or jsonb_typeof(value->'evidenceIds') <> 'array'
       or exists (
         select 1 from jsonb_array_elements(value->'evidenceIds') evidence_id(value_id)
         where jsonb_typeof(value_id) is distinct from 'string'
       )
       or jsonb_array_length(value->'evidenceIds') < 1
       or jsonb_array_length(value->'evidenceIds') > 50
       or length(trim(coalesce(value->>'reviewerExplanation', ''))) not between 40 and 2000
  ) or exists (
    select 1
    from jsonb_array_elements(record->'operations') operation(value)
    group by value->>'operationId'
    having count(*) <> 1
  ) then
    raise exception 'Canonical repair operations must be complete, unique, and target the reviewed organization.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(record->'operations') operation(value),
         jsonb_array_elements_text(value->'evidenceIds') evidence_id(value_id)
    group by value->>'operationId', value_id
    having count(*) <> 1
  ) then
    raise exception 'Canonical repair operations cannot repeat an evidence ID.' using errcode = '22023';
  end if;

  for evidence_record in select value from jsonb_array_elements(record->'fieldEvidence') evidence(value)
  loop
    select count(*) into archive_organization_count
    from jsonb_array_elements(record->'operations') operation(value),
         jsonb_array_elements_text(value->'evidenceIds') evidence_id(value_id)
    where value_id = evidence_record->>'id'
      and evidence_record->>'fieldPath' like 'operations.' || (value->>'operationId') || '.%';
    if archive_organization_count <> 1 then
      raise exception 'Canonical repair evidence % must be used by exactly one matching operation.', evidence_record->>'id' using errcode = '22023';
    end if;
  end loop;

  if exists (
    select 1
    from jsonb_array_elements(record->'sources') source(value)
    where not exists (
      select 1 from jsonb_array_elements(record->'fieldEvidence') evidence(value_evidence)
      where value_evidence->>'sourceId' = value->>'id'
    )
  ) then
    raise exception 'Every canonical repair source must support at least one evidence leaf.' using errcode = '22023';
  end if;
  archive_organization_count := 0;

  select * into live_organization
  from public.organizations
  where id = p_candidate.target_entity_id;
  if not found or live_organization.publication_status <> 'published' then
    raise exception 'Canonical repair target is missing or no longer published.' using errcode = 'P0001';
  end if;

  before_identity := record#>'{beforeRecord,organization}';
  if before_identity->>'id' is distinct from live_organization.id::text
     or before_identity->>'slug' is distinct from live_organization.slug
     or before_identity->>'name' is distinct from live_organization.name
     or (before_identity->>'legalName') is distinct from live_organization.legal_name
     or (before_identity->>'websiteUrl') is distinct from live_organization.website_url
     or before_identity->>'entityKind' is distinct from live_organization.entity_kind
     or before_identity->'organizationCategories' is distinct from to_jsonb(array(
       select category
       from unnest(live_organization.organization_categories) category
       order by category
     ))
     or before_identity->'profileData' is distinct from live_organization.profile_data
     or before_identity->>'publicationStatus' is distinct from live_organization.publication_status
     or (before_identity->>'updatedAt')::timestamptz is distinct from live_organization.updated_at
     or record#>>'{targetMatch,slug}' is distinct from live_organization.slug
     or (record#>>'{targetMatch,baselineUpdatedAt}')::timestamptz is distinct from live_organization.updated_at then
    raise exception 'Canonical repair target identity changed after research.' using errcode = 'P0001';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', alias_record.id::text,
    'alias', alias_record.alias,
    'aliasType', alias_record.alias_type,
    'publicationStatus', alias_record.publication_status
  ) order by alias_record.id::text), '[]'::jsonb)
  into live_aliases
  from public.organization_aliases alias_record
  where alias_record.organization_id = live_organization.id
    and alias_record.publication_status <> 'archived';
  before_aliases := record#>'{beforeRecord,activeAliases}';
  if before_aliases is distinct from live_aliases then
    raise exception 'Canonical repair alias snapshot changed after research.' using errcode = 'P0001';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', capability_record.id::text,
    'slug', capability_record.slug,
    'name', capability_record.name,
    'publicationStatus', capability_record.publication_status,
    'updatedAt', to_jsonb(capability_record.updated_at)
  ) order by capability_record.id::text), '[]'::jsonb)
  into live_capabilities
  from public.capabilities capability_record
  where capability_record.organization_id = live_organization.id
    and capability_record.publication_status <> 'archived';
  before_capabilities := record#>'{beforeRecord,activeCapabilities}';
  if before_capabilities is distinct from live_capabilities then
    raise exception 'Canonical repair technology snapshot changed after research.' using errcode = 'P0001';
  end if;

  select value into identity_operation
  from jsonb_array_elements(record->'operations') operation(value)
  where value->>'operation' = 'set_organization_identity'
  limit 1;
  if (select count(*) from jsonb_array_elements(record->'operations') operation(value)
      where value->>'operation' = 'set_organization_identity') > 1 then
    raise exception 'A canonical repair may contain only one identity operation.' using errcode = '22023';
  end if;
  select count(*) into archive_organization_count
  from jsonb_array_elements(record->'operations') operation(value)
  where value->>'operation' = 'archive_organization';
  if archive_organization_count > 1
     or (archive_organization_count = 1 and jsonb_array_length(record->'operations') <> 1) then
    raise exception 'Archiving an organization must be the repair candidate''s only operation.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from (
      select case value->>'operation'
        when 'archive_alias' then 'archive_alias:' || coalesce(value->>'aliasId', '')
        when 'archive_capability' then 'archive_capability:' || coalesce(value->>'capabilityId', '')
        when 'set_profile_field' then 'set_profile_field:' || coalesce(value->>'profileField', '')
        else value->>'operation'
      end as target_key
      from jsonb_array_elements(record->'operations') operation(value)
    ) operation_targets
    group by target_key
    having count(*) <> 1
  ) then
    raise exception 'Canonical repair operations cannot repeat the same canonical target.' using errcode = '22023';
  end if;

  resulting_entity_kind := coalesce(identity_operation#>>'{after,entityKind}', live_organization.entity_kind);
  resulting_profile_data := live_organization.profile_data;
  allowed_profile_fields := private.canonical_repair_profile_fields(resulting_entity_kind);
  required_profile_field := private.canonical_repair_required_profile_field(resulting_entity_kind);
  proposed_name := coalesce(identity_operation#>>'{after,name}', live_organization.name);
  proposed_legal_name := case
    when identity_operation is null then live_organization.legal_name
    else identity_operation#>>'{after,legalName}'
  end;
  proposed_website := case
    when identity_operation is null then live_organization.website_url
    else identity_operation#>>'{after,websiteUrl}'
  end;

  for operation_record in select value from jsonb_array_elements(record->'operations') operation(value)
  loop
    operation_id := operation_record->>'operationId';
    operation_kind := operation_record->>'operation';
    if operation_record->>'targetId' <> live_organization.id::text then
      raise exception 'Canonical repair operation targets another organization.' using errcode = '22023';
    end if;
    if exists (
      select 1
      from jsonb_array_elements_text(operation_record->'evidenceIds') evidence_id(value)
      where not exists (
        select 1 from jsonb_array_elements(record->'fieldEvidence') evidence(value_evidence)
        where value_evidence->>'id' = value
          and value_evidence->>'fieldPath' like 'operations.' || operation_id || '.%'
      )
    ) then
      raise exception 'Canonical repair operation % references missing or mismapped evidence.', operation_id using errcode = '22023';
    end if;
    if operation_record->>'operation' = 'set_organization_identity' then
      if operation_record->'before' is distinct from before_identity then
        raise exception 'Canonical identity operation has a stale before snapshot.' using errcode = 'P0001';
      end if;
      if jsonb_typeof(operation_record->'after') <> 'object'
         or jsonb_typeof(operation_record#>'{after,name}') is distinct from 'string'
         or (operation_record#>'{after,legalName}' <> 'null'::jsonb
           and jsonb_typeof(operation_record#>'{after,legalName}') is distinct from 'string')
         or (operation_record#>'{after,websiteUrl}' <> 'null'::jsonb
           and jsonb_typeof(operation_record#>'{after,websiteUrl}') is distinct from 'string')
         or jsonb_typeof(operation_record#>'{after,entityKind}') is distinct from 'string'
         or length(trim(coalesce(operation_record#>>'{after,name}', ''))) < 2
         or length(operation_record#>>'{after,name}') > 240
         or nullif(private.normalize_organization_identity(operation_record#>>'{after,name}'), '') is null
         or not (operation_record->'after' ? 'legalName')
         or not (operation_record->'after' ? 'websiteUrl')
         or (operation_record#>'{after,legalName}' <> 'null'::jsonb and (
           length(operation_record#>>'{after,legalName}') not between 2 and 240
           or nullif(private.normalize_organization_identity(operation_record#>>'{after,legalName}'), '') is null
         ))
         or (operation_record#>'{after,websiteUrl}' <> 'null'::jsonb and (
           length(operation_record#>>'{after,websiteUrl}') > 2000
           or operation_record#>>'{after,websiteUrl}' !~ '^https://[^[:space:]/?#]+([/?#][^[:space:]]*)?$'
         ))
         or coalesce(operation_record#>>'{after,entityKind}', '') not in (
        'company', 'accelerator', 'incubator', 'research_test_centre',
        'investor_funder', 'ecosystem_organization', 'government_innovation_office'
      ) or jsonb_typeof(operation_record#>'{after,organizationCategories}') <> 'array'
         or jsonb_array_length(operation_record#>'{after,organizationCategories}') < 1
         or exists (
           select 1 from jsonb_array_elements(operation_record#>'{after,organizationCategories}') category(value)
           where jsonb_typeof(value) is distinct from 'string'
              or value #>> '{}' not in (
             'commercial_company', 'defence_supplier', 'dual_use', 'venture_capital',
             'corporate_venture', 'public_funder', 'dual_use_accelerator', 'ocean_technology',
             'university_affiliated', 'test_range', 'research_lab', 'cluster_operator',
             'industry_association', 'government_program_operator'
           )
         )
         or (select count(*) from jsonb_array_elements_text(operation_record#>'{after,organizationCategories}'))
           <> (select count(distinct value) from jsonb_array_elements_text(operation_record#>'{after,organizationCategories}') category(value))
         or operation_record#>'{after,organizationCategories}' is distinct from (
           select jsonb_agg(value order by value)
           from jsonb_array_elements_text(operation_record#>'{after,organizationCategories}') category(value)
         ) then
        raise exception 'Canonical identity operation has an invalid resulting classification.' using errcode = '22023';
      end if;
      if (operation_record#>>'{after,name}' = before_identity->>'name'
          and operation_record#>>'{after,legalName}' is not distinct from before_identity->>'legalName'
          and operation_record#>>'{after,websiteUrl}' is not distinct from before_identity->>'websiteUrl'
          and operation_record#>>'{after,entityKind}' = before_identity->>'entityKind'
          and operation_record#>'{after,organizationCategories}' is not distinct from before_identity->'organizationCategories') then
        raise exception 'Canonical identity repair must change at least one reviewed field.' using errcode = '22023';
      end if;
      if operation_record#>>'{after,name}' <> before_identity->>'name'
         and operation_record->>'formerNameAlias' is distinct from before_identity->>'name' then
        raise exception 'A canonical rename must preserve the former canonical name as an alias.' using errcode = '22023';
      end if;
      if operation_record->'formerNameAlias' is distinct from 'null'::jsonb
         and (jsonb_typeof(operation_record->'formerNameAlias') is distinct from 'string'
           or nullif(private.normalize_organization_identity(operation_record->>'formerNameAlias'), '') is null) then
        raise exception 'A former-name alias must contain at least one letter or number.' using errcode = '22023';
      end if;
      if operation_record#>>'{after,name}' = before_identity->>'name'
         and operation_record->'formerNameAlias' is distinct from 'null'::jsonb then
        raise exception 'A non-rename identity repair cannot create a former-name alias.' using errcode = '22023';
      end if;
      if operation_record#>>'{after,name}' <> before_identity->>'name'
         and not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.after.name', 'source_backed') then
        raise exception 'Canonical identity name change lacks source-backed operation evidence.' using errcode = '22023';
      end if;
      if operation_record#>>'{after,legalName}' is distinct from before_identity->>'legalName'
         and not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.after.legalName', 'source_backed') then
        raise exception 'Canonical legal-name change lacks source-backed operation evidence.' using errcode = '22023';
      end if;
      if operation_record#>>'{after,websiteUrl}' is distinct from before_identity->>'websiteUrl'
         and not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.after.websiteUrl', 'source_backed') then
        raise exception 'Canonical website change lacks source-backed operation evidence.' using errcode = '22023';
      end if;
      if operation_record#>>'{after,entityKind}' <> before_identity->>'entityKind'
         and not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.after.entityKind', 'derived') then
        raise exception 'Canonical entity-kind change lacks derived operation evidence.' using errcode = '22023';
      end if;
      if operation_record#>'{after,organizationCategories}' is distinct from before_identity->'organizationCategories'
         and not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.after.organizationCategories', 'derived') then
        raise exception 'Canonical category change lacks derived operation evidence.' using errcode = '22023';
      end if;
      if operation_record->'formerNameAlias' is distinct from 'null'::jsonb
         and not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.formerNameAlias', 'source_backed') then
        raise exception 'Canonical former-name alias lacks source-backed operation evidence.' using errcode = '22023';
      end if;
      if exists (
        select 1 from jsonb_array_elements(record->'fieldEvidence') evidence(value)
        where value->>'id' in (select jsonb_array_elements_text(operation_record->'evidenceIds'))
          and not (
            (value->>'fieldPath' = 'operations.' || operation_id || '.after.name'
              and operation_record#>>'{after,name}' <> before_identity->>'name' and value->>'claimClass' = 'source_backed')
            or (value->>'fieldPath' = 'operations.' || operation_id || '.after.legalName'
              and operation_record#>>'{after,legalName}' is distinct from before_identity->>'legalName' and value->>'claimClass' = 'source_backed')
            or (value->>'fieldPath' = 'operations.' || operation_id || '.after.websiteUrl'
              and operation_record#>>'{after,websiteUrl}' is distinct from before_identity->>'websiteUrl' and value->>'claimClass' = 'source_backed')
            or (value->>'fieldPath' = 'operations.' || operation_id || '.after.entityKind'
              and operation_record#>>'{after,entityKind}' <> before_identity->>'entityKind' and value->>'claimClass' = 'derived')
            or (value->>'fieldPath' = 'operations.' || operation_id || '.after.organizationCategories'
              and operation_record#>'{after,organizationCategories}' is distinct from before_identity->'organizationCategories' and value->>'claimClass' = 'derived')
            or (value->>'fieldPath' = 'operations.' || operation_id || '.formerNameAlias'
              and operation_record->'formerNameAlias' is distinct from 'null'::jsonb and value->>'claimClass' = 'source_backed')
          )
      ) then
        raise exception 'Canonical identity operation has an invalid evidence path or claim class.' using errcode = '22023';
      end if;
    elsif operation_record->>'operation' = 'set_profile_field' then
      if jsonb_typeof(operation_record->'profileField') is distinct from 'string'
         or coalesce(operation_record->>'profileField', '') !~ '^[a-z][A-Za-z0-9]*$'
         or not private.canonical_repair_profile_value_valid(operation_record->'before')
         or not private.canonical_repair_profile_value_valid(operation_record->'after')
         or operation_record->'before' is distinct from coalesce(live_organization.profile_data->(operation_record->>'profileField'), 'null'::jsonb)
         or operation_record->'after' is not distinct from operation_record->'before' then
        raise exception 'Canonical profile-field repair has an invalid field, stale baseline, or unchanged value.' using errcode = '22023';
      end if;
      if identity_operation is null
         or identity_operation#>>'{after,entityKind}' = before_identity->>'entityKind' then
        raise exception 'Canonical profile-field changes require an entity-kind correction.' using errcode = '22023';
      end if;
      if not coalesce((
        (operation_record->'after' = 'null'::jsonb and not (operation_record->>'profileField' = any(allowed_profile_fields)))
        or (required_profile_field is not null and operation_record->>'profileField' = required_profile_field)
      ), false) then
        raise exception 'Canonical profile repair may only remove an invalid field or set the corrected kind''s required mandate.' using errcode = '22023';
      end if;
      if not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.after.value', 'source_backed')
         or exists (
           select 1 from jsonb_array_elements(record->'fieldEvidence') evidence(value)
           where value->>'id' in (select jsonb_array_elements_text(operation_record->'evidenceIds'))
             and (value->>'fieldPath' <> 'operations.' || operation_id || '.after.value' or value->>'claimClass' <> 'source_backed')
         ) then
        raise exception 'Canonical profile repair must bind only one supported after-value evidence path.' using errcode = '22023';
      end if;
      if operation_record->'after' = 'null'::jsonb then
        resulting_profile_data := resulting_profile_data - (operation_record->>'profileField');
      else
        resulting_profile_data := jsonb_set(resulting_profile_data, array[operation_record->>'profileField'], operation_record->'after', true);
      end if;
    elsif operation_record->>'operation' = 'add_alias' then
      if jsonb_typeof(operation_record->'alias') is distinct from 'string'
         or jsonb_typeof(operation_record->'aliasType') is distinct from 'string'
         or length(trim(coalesce(operation_record->>'alias', ''))) < 2
         or length(operation_record->>'alias') > 240
         or nullif(private.normalize_organization_identity(operation_record->>'alias'), '') is null
         or coalesce(operation_record->>'aliasType', '') not in ('legal_name', 'trade_name', 'former_name', 'acronym', 'other')
         or not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.alias', 'source_backed')
         or exists (
           select 1 from jsonb_array_elements(record->'fieldEvidence') evidence(value)
           where value->>'id' in (select jsonb_array_elements_text(operation_record->'evidenceIds'))
             and (value->>'fieldPath' <> 'operations.' || operation_id || '.alias' or value->>'claimClass' <> 'source_backed')
         ) then
        raise exception 'Canonical alias addition lacks a valid alias or source-backed operation evidence.' using errcode = '22023';
      end if;
    elsif operation_record->>'operation' = 'archive_alias' then
      select * into live_alias
      from public.organization_aliases
      where id = (operation_record->>'aliasId')::uuid
        and organization_id = live_organization.id
        and publication_status <> 'archived';
      if not found
         or operation_record#>>'{before,id}' is distinct from live_alias.id::text
         or operation_record#>>'{before,alias}' is distinct from live_alias.alias
         or operation_record#>>'{before,aliasType}' is distinct from live_alias.alias_type
         or operation_record#>>'{before,publicationStatus}' is distinct from live_alias.publication_status then
        raise exception 'Canonical alias archive has a stale or mismatched baseline.' using errcode = 'P0001';
      end if;
      if coalesce(operation_record->>'reason', '') not in ('duplicate_alias', 'incorrect_owner', 'superseded_name')
         or not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.before.alias', 'source_backed')
         or not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.reason', 'derived')
         or exists (
           select 1 from jsonb_array_elements(record->'fieldEvidence') evidence(value)
           where value->>'id' in (select jsonb_array_elements_text(operation_record->'evidenceIds'))
             and not (
               (value->>'fieldPath' = 'operations.' || operation_id || '.before.alias' and value->>'claimClass' = 'source_backed')
               or (value->>'fieldPath' = 'operations.' || operation_id || '.reason' and value->>'claimClass' = 'derived')
             )
         ) then
        raise exception 'Canonical alias archival lacks its bounded reason or evidence contract.' using errcode = '22023';
      end if;
      archived_alias_ids := array_append(archived_alias_ids, live_alias.id);
    elsif operation_record->>'operation' = 'archive_capability' then
      select * into live_capability
      from public.capabilities
      where id = (operation_record->>'capabilityId')::uuid
        and organization_id = live_organization.id
        and publication_status <> 'archived';
      if not found
         or operation_record#>>'{before,id}' is distinct from live_capability.id::text
         or operation_record#>>'{before,slug}' is distinct from live_capability.slug
         or operation_record#>>'{before,name}' is distinct from live_capability.name
         or operation_record#>>'{before,publicationStatus}' is distinct from live_capability.publication_status
         or (operation_record#>>'{before,updatedAt}')::timestamptz is distinct from live_capability.updated_at
         or operation_record->'dependencies' is distinct from private.canonical_capability_dependencies(live_capability.id) then
        raise exception 'Canonical technology archive has a stale record or dependency snapshot.' using errcode = 'P0001';
      end if;
      if coalesce(operation_record->>'reason', '') not in ('unsupported_capability', 'outside_product_scope', 'defunct', 'superseded')
         or not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.before.name', 'source_backed')
         or not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.reason', 'derived')
         or jsonb_array_length(operation_record#>'{dependencies,signalRecordLinkIds}') > 0
         or jsonb_array_length(operation_record#>'{dependencies,wikiPageRecordLinkIds}') > 0
         or exists (
           select 1 from jsonb_array_elements(record->'fieldEvidence') evidence(value)
           where value->>'id' in (select jsonb_array_elements_text(operation_record->'evidenceIds'))
             and not (
               (value->>'fieldPath' = 'operations.' || operation_id || '.before.name' and value->>'claimClass' = 'source_backed')
               or (value->>'fieldPath' = 'operations.' || operation_id || '.reason' and value->>'claimClass' = 'derived')
             )
         ) then
        raise exception 'Canonical technology archival lacks its bounded reason, dependency, or evidence contract.' using errcode = '22023';
      end if;
    elsif operation_record->>'operation' = 'archive_organization' then
      if operation_record->'before' is distinct from before_identity
         or operation_record->'dependencies' is distinct from private.canonical_organization_dependencies(live_organization.id) then
        raise exception 'Canonical organization archive has a stale identity or dependency snapshot.' using errcode = 'P0001';
      end if;
      if operation_record->'successor' is not null and operation_record->'successor' <> 'null'::jsonb then
        select * into successor_record
        from public.organizations
        where id = (operation_record#>>'{successor,id}')::uuid;
        if not found or successor_record.id = live_organization.id
           or successor_record.publication_status is distinct from 'published'
           or successor_record.slug is distinct from operation_record#>>'{successor,slug}'
           or successor_record.name is distinct from operation_record#>>'{successor,name}'
           or successor_record.updated_at is distinct from (operation_record#>>'{successor,baselineUpdatedAt}')::timestamptz
           or exists (select 1 from public.organization_slug_redirects where source_slug = successor_record.slug) then
          raise exception 'Canonical repair successor is stale, unpublished, or not a one-hop destination.' using errcode = 'P0001';
        end if;
      end if;
      if coalesce(operation_record->>'reason', '') not in ('unsupported_identity', 'outside_canadian_scope', 'outside_product_scope', 'defunct', 'superseded')
         or ((operation_record->>'reason' = 'superseded') is distinct from (operation_record->'successor' is not null and operation_record->'successor' <> 'null'::jsonb))
         or not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.before.name', 'source_backed')
         or not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.reason', 'derived')
         or ((operation_record->'successor' is not null and operation_record->'successor' <> 'null'::jsonb)
           and not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.successor', 'source_backed'))
         or jsonb_array_length(operation_record#>'{dependencies,incomingActiveRelationshipIds}') > 0
         or jsonb_array_length(operation_record#>'{dependencies,signalRecordLinkIds}') > 0
         or jsonb_array_length(operation_record#>'{dependencies,wikiPageRecordLinkIds}') > 0
         or exists (
           select 1 from jsonb_array_elements(record->'fieldEvidence') evidence(value)
           where value->>'id' in (select jsonb_array_elements_text(operation_record->'evidenceIds'))
             and not (
               (value->>'fieldPath' = 'operations.' || operation_id || '.before.name' and value->>'claimClass' = 'source_backed')
               or (value->>'fieldPath' = 'operations.' || operation_id || '.reason' and value->>'claimClass' = 'derived')
               or (value->>'fieldPath' = 'operations.' || operation_id || '.successor' and value->>'claimClass' = 'source_backed'
                 and operation_record->'successor' is not null and operation_record->'successor' <> 'null'::jsonb)
             )
         ) then
        raise exception 'Canonical organization archival lacks its bounded lifecycle, dependency, or evidence contract.' using errcode = '22023';
      end if;
    elsif coalesce(operation_record->>'operation', '') not in ('set_profile_field', 'add_alias') then
      raise exception 'Unsupported canonical repair operation %.', operation_record->>'operation' using errcode = '22023';
    end if;
  end loop;

  if archive_organization_count = 0 then
    if exists (
      select 1 from jsonb_object_keys(resulting_profile_data) field_name
      where not (field_name = any(allowed_profile_fields))
    ) then
      raise exception 'Canonical entity-kind repair leaves a profile field invalid for the resulting kind.' using errcode = '22023';
    end if;
    if required_profile_field is not null
       and (jsonb_typeof(resulting_profile_data->required_profile_field) is distinct from 'string'
         or coalesce(length(trim(resulting_profile_data->>required_profile_field)), 0) < 40) then
      raise exception 'Canonical entity-kind repair lacks the required source-backed mandate field.' using errcode = '22023';
    end if;
  end if;

  select coalesce(array_agg(private.normalize_organization_identity(alias_record.alias)), '{}')
  into final_alias_values
  from public.organization_aliases alias_record
  where alias_record.organization_id = live_organization.id
    and alias_record.publication_status <> 'archived'
    and not (alias_record.id = any(archived_alias_ids));
  final_alias_values := final_alias_values || coalesce(array(
    select private.normalize_organization_identity(value->>'alias')
    from jsonb_array_elements(record->'operations') operation(value)
    where value->>'operation' = 'add_alias'
  ), '{}');
  if identity_operation#>>'{formerNameAlias}' is not null then
    final_alias_values := array_append(final_alias_values, private.normalize_organization_identity(identity_operation#>>'{formerNameAlias}'));
  end if;

  proposed_identity_values := array[
    private.normalize_organization_identity(proposed_name),
    private.normalize_organization_identity(proposed_legal_name)
  ] || final_alias_values;
  if nullif(private.normalize_organization_identity(proposed_name), '') is null
     or (proposed_legal_name is not null and nullif(private.normalize_organization_identity(proposed_legal_name), '') is null)
     or exists (select 1 from unnest(final_alias_values) alias_value(value) where nullif(value, '') is null) then
    raise exception 'Resulting canonical names and aliases must contain at least one letter or number.' using errcode = '22023';
  end if;
  if private.normalize_organization_identity(proposed_name) = any(final_alias_values) then
    raise exception 'Resulting canonical name duplicates an active or proposed alias.' using errcode = '23505';
  end if;
  if nullif(private.normalize_organization_identity(proposed_legal_name), '') is not null
     and private.normalize_organization_identity(proposed_legal_name) = any(final_alias_values) then
    raise exception 'Resulting legal name duplicates an active or proposed alias.' using errcode = '23505';
  end if;
  if cardinality(final_alias_values) <> (
    select count(distinct value)::integer from unnest(final_alias_values) alias_value(value)
  ) then
    raise exception 'Resulting aliases contain a normalized duplicate.' using errcode = '23505';
  end if;
  foreach identity_value in array proposed_identity_values
  loop
    if nullif(identity_value, '') is null then continue; end if;
    if exists (
      select 1 from public.organizations organization_record
      where organization_record.id <> live_organization.id
        and organization_record.publication_status = 'published'
        and identity_value in (
          private.normalize_organization_identity(organization_record.name),
          private.normalize_organization_identity(organization_record.legal_name)
        )
    ) or exists (
      select 1
      from public.organization_aliases alias_record
      join public.organizations organization_record on organization_record.id = alias_record.organization_id
      where organization_record.id <> live_organization.id
        and organization_record.publication_status = 'published'
        and alias_record.publication_status <> 'archived'
        and private.normalize_organization_identity(alias_record.alias) = identity_value
    ) then
      raise exception 'Canonical repair identity collides with another published organization.' using errcode = '23505';
    end if;
  end loop;
  if private.normalize_organization_website_domain(proposed_website) is not null
     and exists (
       select 1
       from public.organizations organization_record
       where organization_record.id <> live_organization.id
         and organization_record.publication_status = 'published'
         and private.normalize_organization_website_domain(organization_record.website_url)
           = private.normalize_organization_website_domain(proposed_website)
     ) then
    raise exception 'Canonical repair website collides with another published organization.' using errcode = '23505';
  end if;
end;
$$;

revoke all on function private.assert_organization_canonical_repair_candidate(public.candidate_changes)
from public, anon, authenticated;

create or replace function private.enforce_organization_canonical_repair_candidate()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
begin
  if tg_op = 'DELETE' then
    if old.candidate_kind = 'organization_canonical_repair_bundle' then
      raise exception 'Canonical repair candidates are immutable audit records and cannot be deleted.' using errcode = '42501';
    end if;
    return old;
  end if;
  if tg_op = 'INSERT'
     and new.candidate_kind = 'organization_canonical_repair_bundle'
     and (new.status <> 'pending' or new.published_entity_id is not null or new.published_at is not null) then
    raise exception 'Canonical repairs enter only as pending, unpublished review candidates.' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE'
     and (old.candidate_kind = 'organization_canonical_repair_bundle'
       or new.candidate_kind = 'organization_canonical_repair_bundle')
     and old.candidate_kind is distinct from new.candidate_kind then
    raise exception 'Canonical repair candidates cannot be converted to or from another candidate kind.' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE'
     and (old.candidate_kind = 'organization_canonical_repair_bundle'
       or new.candidate_kind = 'organization_canonical_repair_bundle')
     and new.status is distinct from old.status
     and (auth.uid() is null or not private.is_atlas_staff()) then
    raise exception 'Canonical repair status changes require an authenticated reviewer workflow.' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE'
     and old.status in ('pending', 'approved')
     and new.status in ('pending', 'rejected')
     and new.candidate_kind is not distinct from old.candidate_kind
     and new.schema_version is not distinct from old.schema_version
     and new.research_run_id is not distinct from old.research_run_id
     and new.client_candidate_id is not distinct from old.client_candidate_id
     and new.source_lead_ids is not distinct from old.source_lead_ids
     and new.target_entity_type is not distinct from old.target_entity_type
     and new.target_entity_id is not distinct from old.target_entity_id
     and new.proposed_record is not distinct from old.proposed_record
     and new.before_record is not distinct from old.before_record
     and new.field_evidence is not distinct from old.field_evidence
     and new.duplicate_check is not distinct from old.duplicate_check
     and new.confidence is not distinct from old.confidence
     and new.reviewer_rationale is not distinct from old.reviewer_rationale
     and new.staged_at is not distinct from old.staged_at
     and new.published_entity_id is not distinct from old.published_entity_id
     and new.published_at is not distinct from old.published_at then
    -- A reviewer must be able to return or reject a stale approved repair.
    -- This transition does not mutate canonical data.
    return new;
  end if;
  if new.candidate_kind = 'organization_canonical_repair_bundle'
     and (
       tg_op = 'INSERT'
       or new.status in ('pending', 'approved', 'published')
       or new.proposed_record is distinct from old.proposed_record
       or new.before_record is distinct from old.before_record
       or new.target_entity_id is distinct from old.target_entity_id
     ) then
    perform private.assert_organization_canonical_repair_candidate(new);
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_organization_canonical_repair_candidate()
from public, anon, authenticated;

create trigger enforce_organization_canonical_repair_candidate
before insert or update or delete
on public.candidate_changes
for each row execute function private.enforce_organization_canonical_repair_candidate();

-- The research service may stage candidates but cannot forge human review
-- decisions. The dedicated SECURITY DEFINER review function remains the only
-- canonical-repair decision writer available to the application.
drop policy if exists "atlas staff manage review decisions" on public.review_decisions;
create policy "atlas staff read review decisions" on public.review_decisions
for select to authenticated using ((select private.is_atlas_staff()));
create policy "atlas staff create ordinary review decisions" on public.review_decisions
for insert to authenticated
with check (
  (select private.is_atlas_staff())
  and not exists (
    select 1 from public.candidate_changes candidate_record
    where candidate_record.id = review_decisions.candidate_change_id
      and candidate_record.candidate_kind = 'organization_canonical_repair_bundle'
  )
);
create policy "atlas staff update ordinary review decisions" on public.review_decisions
for update to authenticated
using (
  (select private.is_atlas_staff())
  and not exists (
    select 1 from public.candidate_changes candidate_record
    where candidate_record.id = review_decisions.candidate_change_id
      and candidate_record.candidate_kind = 'organization_canonical_repair_bundle'
  )
)
with check (
  (select private.is_atlas_staff())
  and not exists (
    select 1 from public.candidate_changes candidate_record
    where candidate_record.id = review_decisions.candidate_change_id
      and candidate_record.candidate_kind = 'organization_canonical_repair_bundle'
  )
);
create policy "atlas staff delete ordinary review decisions" on public.review_decisions
for delete to authenticated
using (
  (select private.is_atlas_staff())
  and not exists (
    select 1 from public.candidate_changes candidate_record
    where candidate_record.id = review_decisions.candidate_change_id
      and candidate_record.candidate_kind = 'organization_canonical_repair_bundle'
  )
);

revoke all on public.review_decisions from service_role;
grant select on public.review_decisions to service_role;

-- The service-role research worker can read the queue and call the bounded
-- intake function, but cannot create, rewrite, truncate, or erase queue rows
-- directly. SECURITY DEFINER is required below so ordinary intake keeps
-- working after these table privileges are removed.
revoke all on public.candidate_changes from service_role;
grant select on public.candidate_changes to service_role;

create or replace function private.prevent_canonical_research_run_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if old.scope->>'researchMode' = 'canonical_repair'
     or (tg_op = 'UPDATE' and new.scope->>'researchMode' = 'canonical_repair') then
    raise exception 'Canonical repair research-run lineage is immutable after intake.' using errcode = '42501';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function private.prevent_canonical_research_run_mutation()
from public, anon, authenticated, service_role;

create trigger canonical_research_run_lineage_is_immutable
before update or delete on public.research_runs
for each row execute function private.prevent_canonical_research_run_mutation();

create or replace function public.stage_research_candidates_for_review(p_run jsonb, p_candidates jsonb)
returns table(staged_count integer, skipped_count integer, research_run_id uuid)
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  run_id uuid;
  existing_run public.research_runs%rowtype;
  candidate_record jsonb;
  affected_id uuid;
  existing_candidate public.candidate_changes%rowtype;
  staged integer := 0;
  skipped integer := 0;
  is_existing_record boolean;
  canonical_run boolean;
  canonical_scope jsonb;
begin
  if jsonb_typeof(p_run) <> 'object' or nullif(p_run->>'client_run_id', '') is null
     or jsonb_typeof(p_candidates) <> 'array' or jsonb_array_length(p_candidates) < 1 then
    raise exception 'A stable run ID and at least one candidate are required.' using errcode = '22023';
  end if;

  canonical_run := coalesce(p_run->>'research_mode' = 'canonical_repair', false);
  if canonical_run then
    if exists (
      select 1 from jsonb_array_elements(p_candidates) candidate(value)
      where value->>'candidate_kind' is distinct from 'organization_canonical_repair_bundle'
    ) then
      raise exception 'Canonical-repair mode may contain only canonical organization repair candidates.' using errcode = '22023';
    end if;
  elsif exists (
    select 1 from jsonb_array_elements(p_candidates) candidate(value)
    where value->>'candidate_kind' = 'organization_canonical_repair_bundle'
  ) then
    raise exception 'Canonical organization repair candidates require canonical_repair mode and cannot be mixed with ordinary candidates.' using errcode = '22023';
  end if;
  canonical_scope := coalesce(p_run->'scope', '{}'::jsonb)
    || case when nullif(p_run->>'research_mode', '') is null then '{}'::jsonb
      else jsonb_build_object('researchMode', p_run->>'research_mode') end;

  if canonical_run then
    if p_run->>'research_mode' is distinct from 'canonical_repair'
       or p_run->>'status' is distinct from 'completed'
       or nullif(p_run->>'started_at', '') is null
       or nullif(p_run->>'completed_at', '') is null
       or not private.research_pipeline_version_at_least(p_run->>'agent_version', 1, 8, 0) then
      raise exception 'Canonical repair intake requires a completed canonical_repair run from pipeline 1.8.0 or later.' using errcode = '22023';
    end if;

    insert into public.research_runs (
      run_type, scope, selected_gap, status, started_at, completed_at, agent_version,
      source_queries, counters, validation_results, stop_reason, resume_token
    ) values (
      coalesce(nullif(p_run->>'run_type', ''), 'manual'), canonical_scope,
      p_run->'selected_gap', 'completed', (p_run->>'started_at')::timestamptz,
      (p_run->>'completed_at')::timestamptz, p_run->>'agent_version',
      coalesce(p_run->'source_queries', '[]'::jsonb), coalesce(p_run->'counters', '{}'::jsonb),
      coalesce(p_run->'validation_results', '{}'::jsonb), p_run->>'stop_reason', p_run->>'client_run_id'
    ) on conflict (resume_token) do nothing
    returning id into run_id;

    if run_id is null then
      select * into existing_run
      from public.research_runs
      where resume_token = p_run->>'client_run_id'
      for update;
      if not found
         or existing_run.run_type is distinct from coalesce(nullif(p_run->>'run_type', ''), 'manual')
         or existing_run.scope is distinct from canonical_scope
         or existing_run.selected_gap is distinct from p_run->'selected_gap'
         or existing_run.status is distinct from 'completed'
         or existing_run.started_at is distinct from (p_run->>'started_at')::timestamptz
         or existing_run.completed_at is distinct from (p_run->>'completed_at')::timestamptz
         or existing_run.agent_version is distinct from p_run->>'agent_version'
         or existing_run.source_queries is distinct from coalesce(p_run->'source_queries', '[]'::jsonb)
         or existing_run.counters is distinct from coalesce(p_run->'counters', '{}'::jsonb)
         or existing_run.validation_results is distinct from coalesce(p_run->'validation_results', '{}'::jsonb)
         or existing_run.stop_reason is distinct from p_run->>'stop_reason' then
        raise exception 'Canonical repair run % already exists with different immutable lineage.', p_run->>'client_run_id' using errcode = '40001';
      end if;
      run_id := existing_run.id;
    end if;
  else
    insert into public.research_runs (
      run_type, scope, selected_gap, status, started_at, completed_at, agent_version,
      source_queries, counters, validation_results, stop_reason, resume_token
    ) values (
      coalesce(nullif(p_run->>'run_type', ''), 'manual'), canonical_scope,
      p_run->'selected_gap', 'completed', nullif(p_run->>'started_at', '')::timestamptz,
      coalesce(nullif(p_run->>'completed_at', '')::timestamptz, now()), p_run->>'agent_version',
      coalesce(p_run->'source_queries', '[]'::jsonb), coalesce(p_run->'counters', '{}'::jsonb),
      coalesce(p_run->'validation_results', '{}'::jsonb), p_run->>'stop_reason', p_run->>'client_run_id'
    ) on conflict (resume_token) do update set
      scope = excluded.scope, selected_gap = excluded.selected_gap, status = 'completed',
      started_at = excluded.started_at, completed_at = excluded.completed_at,
      agent_version = excluded.agent_version, source_queries = excluded.source_queries,
      counters = excluded.counters, validation_results = excluded.validation_results,
      stop_reason = excluded.stop_reason
    returning id into run_id;
  end if;

  for candidate_record in select value from jsonb_array_elements(p_candidates)
  loop
    is_existing_record := candidate_record->>'candidate_kind' in (
      'organization_refresh_bundle', 'organization_canonical_repair_bundle', 'demand_refresh_bundle'
    );
    if nullif(candidate_record->>'client_candidate_id', '') is null
       or candidate_record->>'status' <> 'pending'
       or candidate_record->>'candidate_kind' not in (
         'organization_bundle', 'demand_signal_bundle', 'program_relationship_bundle',
         'organization_refresh_bundle', 'organization_canonical_repair_bundle', 'demand_refresh_bundle'
       )
       or candidate_record->>'schema_version' is distinct from candidate_record#>>'{proposed_record,schemaVersion}'
       or candidate_record->>'candidate_kind' is distinct from candidate_record#>>'{proposed_record,candidateKind}'
       or coalesce(candidate_record#>>'{duplicate_check,status}', '') <> 'clear'
       or (is_existing_record and (
         nullif(candidate_record->>'target_entity_id', '') is null
         or jsonb_typeof(candidate_record->'before_record') <> 'object'
         or candidate_record#>>'{proposed_record,targetMatch,entityId}' is distinct from candidate_record->>'target_entity_id'
         or candidate_record#>>'{proposed_record,targetMatch,baselineUpdatedAt}' is null
       ))
       or (candidate_record->>'candidate_kind' = 'organization_canonical_repair_bundle' and (
         candidate_record->>'schema_version' <> 'organization_canonical_repair_bundle_v1'
         or not private.research_pipeline_version_at_least(p_run->>'agent_version', 1, 8, 0)
         or candidate_record->>'target_entity_type' <> 'organization'
         or candidate_record#>>'{proposed_record,targetMatch,confidence}' <> 'high'
         or coalesce(jsonb_array_length(candidate_record#>'{duplicate_check,matches}'), 0) <> 0
       )) then
      raise exception 'Candidate % is not review-ready.', coalesce(candidate_record->>'client_candidate_id', '<missing>') using errcode = '22023';
    end if;

    affected_id := null;
    insert into public.candidate_changes (
      research_run_id, client_candidate_id, candidate_kind, schema_version, source_lead_ids,
      target_entity_type, target_entity_id, proposed_record, before_record, field_evidence,
      duplicate_check, confidence, reviewer_rationale, status, staged_at
    ) values (
      run_id, candidate_record->>'client_candidate_id', candidate_record->>'candidate_kind',
      candidate_record->>'schema_version',
      array(select jsonb_array_elements_text(coalesce(candidate_record->'source_lead_ids', '[]'::jsonb))),
      candidate_record->>'target_entity_type', nullif(candidate_record->>'target_entity_id', '')::uuid,
      candidate_record->'proposed_record', candidate_record->'before_record',
      coalesce(candidate_record->'field_evidence', '[]'::jsonb),
      coalesce(candidate_record->'duplicate_check', '{}'::jsonb), candidate_record->>'confidence',
      candidate_record->>'reviewer_rationale',
      'pending', coalesce(nullif(candidate_record->>'staged_at', '')::timestamptz, now())
    ) on conflict (client_candidate_id) do update set
      research_run_id = excluded.research_run_id, candidate_kind = excluded.candidate_kind,
      schema_version = excluded.schema_version, source_lead_ids = excluded.source_lead_ids,
      target_entity_type = excluded.target_entity_type, target_entity_id = excluded.target_entity_id,
      proposed_record = excluded.proposed_record, before_record = excluded.before_record,
      field_evidence = excluded.field_evidence, duplicate_check = excluded.duplicate_check,
      confidence = excluded.confidence, reviewer_rationale = excluded.reviewer_rationale,
      staged_at = excluded.staged_at, updated_at = now()
    where public.candidate_changes.status = 'pending'
      and candidate_record->>'candidate_kind' <> 'organization_canonical_repair_bundle'
      and public.candidate_changes.candidate_kind <> 'organization_canonical_repair_bundle'
    returning id into affected_id;

    if affected_id is null and candidate_record->>'candidate_kind' = 'organization_canonical_repair_bundle' then
      select * into existing_candidate
      from public.candidate_changes
      where client_candidate_id = candidate_record->>'client_candidate_id'
      for update;
      if not found
         or existing_candidate.status <> 'pending'
         or existing_candidate.research_run_id is distinct from run_id
         or existing_candidate.candidate_kind is distinct from candidate_record->>'candidate_kind'
         or existing_candidate.schema_version is distinct from candidate_record->>'schema_version'
         or to_jsonb(existing_candidate.source_lead_ids) is distinct from coalesce(candidate_record->'source_lead_ids', '[]'::jsonb)
         or existing_candidate.target_entity_type is distinct from candidate_record->>'target_entity_type'
         or existing_candidate.target_entity_id is distinct from nullif(candidate_record->>'target_entity_id', '')::uuid
         or existing_candidate.proposed_record is distinct from candidate_record->'proposed_record'
         or existing_candidate.before_record is distinct from candidate_record->'before_record'
         or existing_candidate.field_evidence is distinct from coalesce(candidate_record->'field_evidence', '[]'::jsonb)
         or existing_candidate.duplicate_check is distinct from coalesce(candidate_record->'duplicate_check', '{}'::jsonb)
         or existing_candidate.confidence is distinct from candidate_record->>'confidence'
         or existing_candidate.reviewer_rationale is distinct from candidate_record->>'reviewer_rationale'
         or exists (
           select 1 from public.review_decisions decision_record
           where decision_record.candidate_change_id = existing_candidate.id
         ) then
        raise exception 'Candidate % already exists with different lineage, payload, state, or review history; use a new candidate ID after resolving the open record.', candidate_record->>'client_candidate_id' using errcode = '40001';
      end if;
      skipped := skipped + 1;
    elsif affected_id is null then
      skipped := skipped + 1;
    else
      staged := staged + 1;
    end if;
  end loop;

  insert into public.audit_events (actor_id, actor_role, event_type, entity_type, entity_id, summary, metadata)
  values (null, 'research_worker', 'research_candidates_staged', 'research_run', run_id,
    'Validated research candidates were added directly to the review workflow.',
    jsonb_build_object('client_run_id', p_run->>'client_run_id', 'staged_count', staged, 'skipped_count', skipped, 'publication_changed', false));

  staged_count := staged; skipped_count := skipped; research_run_id := run_id; return next;
end;
$$;

revoke all on function public.stage_research_candidates_for_review(jsonb, jsonb)
from public, anon, authenticated;
grant execute on function public.stage_research_candidates_for_review(jsonb, jsonb)
to service_role;

create or replace function public.review_organization_canonical_repair_candidate(
  p_candidate_id uuid,
  p_reviewer_id uuid,
  p_decision text,
  p_rationale text,
  p_expected_updated_at timestamptz
)
returns table(candidate_id uuid, candidate_status text, candidate_updated_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  candidate_row public.candidate_changes%rowtype;
  next_status text;
begin
  if not private.is_atlas_staff() or auth.uid() is distinct from p_reviewer_id then
    raise exception 'Canonical repair review requires the authenticated atlas reviewer.' using errcode = '42501';
  end if;
  if p_decision not in ('accept', 'reject', 'defer')
     or length(trim(coalesce(p_rationale, ''))) not between 20 and 2000 then
    raise exception 'Canonical repair review requires an accept, reject, or defer decision and a complete rationale.' using errcode = '22023';
  end if;

  select * into candidate_row
  from public.candidate_changes
  where id = p_candidate_id
  for update;
  if not found
     or candidate_row.status not in ('pending', 'approved')
     or candidate_row.candidate_kind <> 'organization_canonical_repair_bundle'
     or candidate_row.schema_version <> 'organization_canonical_repair_bundle_v1'
     or candidate_row.updated_at is distinct from p_expected_updated_at then
    raise exception 'Canonical repair queue changed after it was opened; refresh before reviewing.' using errcode = '40001';
  end if;
  if candidate_row.status = 'approved' and p_decision = 'accept' then
    raise exception 'An approved canonical repair may only be returned or rejected.' using errcode = '22023';
  end if;
  if p_decision = 'accept' then
    perform private.assert_organization_canonical_repair_candidate(candidate_row);
  end if;
  next_status := case p_decision when 'accept' then 'approved' when 'reject' then 'rejected' else 'pending' end;

  insert into public.review_decisions (
    candidate_change_id, reviewer_id, decision, field_decisions, rationale
  ) values (
    candidate_row.id, p_reviewer_id, p_decision, '[]'::jsonb, trim(p_rationale)
  );
  update public.candidate_changes
  set status = next_status, updated_at = now()
  where id = candidate_row.id
  returning id, status, updated_at into candidate_id, candidate_status, candidate_updated_at;

  insert into public.audit_events (
    actor_id, actor_role, event_type, entity_type, entity_id, summary, metadata
  ) values (
    p_reviewer_id, coalesce(auth.jwt()->'app_metadata'->>'role', 'reviewer'),
    'canonical_repair_reviewed', 'candidate_change', candidate_row.id,
    format('Reviewer recorded a %s decision for one canonical organization repair.', p_decision),
    jsonb_build_object('decision', p_decision, 'publication_changed', false, 'individual_review', true)
  );
  return next;
end;
$$;

revoke all on function public.review_organization_canonical_repair_candidate(uuid, uuid, text, text, timestamptz)
from public, anon, authenticated;
grant execute on function public.review_organization_canonical_repair_candidate(uuid, uuid, text, text, timestamptz)
to authenticated;

create or replace function public.preserve_candidate_published_organization_reference()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if new.candidate_kind not in (
    'organization_bundle', 'organization_refresh_bundle', 'organization_canonical_repair_bundle'
  ) then
    new.published_entity_id := null;
  end if;
  return new;
end;
$$;

revoke all on function public.preserve_candidate_published_organization_reference()
from public, anon, authenticated;

create or replace function public.publish_reviewed_organization_canonical_repair_candidate(
  p_candidate_id uuid,
  p_reviewer_id uuid,
  p_expected_candidate_updated_at timestamptz
)
returns table(candidate_id uuid, entity_type text, entity_id uuid, entity_slug text)
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  candidate_row public.candidate_changes%rowtype;
  record jsonb;
  operation_record jsonb;
  source_record jsonb;
  evidence_record jsonb;
  source_map jsonb := '{}'::jsonb;
  evidence_map jsonb := '{}'::jsonb;
  source_id uuid;
  evidence_id uuid;
  operation_id text;
  operation_kind text;
  citation_entity_type text;
  citation_entity_id uuid;
  citation_field_name text;
  target_slug text;
  successor_id uuid;
  successor_slug text;
  archive_organization boolean := false;
  archived_capability_ids uuid[] := '{}';
  published_on timestamptz := now();
begin
  if not private.is_atlas_staff() or auth.uid() is distinct from p_reviewer_id then
    raise exception 'Canonical repair publication requires the authenticated atlas reviewer.' using errcode = '42501';
  end if;

  -- This rare, human-triggered operation must compare and mutate one complete
  -- canonical dependency graph without a concurrent writer creating a phantom
  -- alias, child relationship, save, submission, or editorial link between
  -- the baseline check and the archive. SHARE ROW EXCLUSIVE blocks writes but
  -- leaves ordinary public reads available for the short transaction.
  lock table
    public.candidate_changes,
    public.review_decisions,
    public.organizations,
    public.organization_aliases,
    public.capabilities,
    public.organization_locations,
    public.capability_domains,
    public.capability_mission_matches,
    public.capability_clusters,
    public.capability_demand_matches,
    public.media_assets,
    public.program_participations,
    public.organization_relationships,
    public.funding_events,
    public.saved_collection_items,
    public.connection_requests,
    public.submissions,
    public.signal_record_links,
    public.wiki_page_record_links,
    public.organization_slug_redirects
  in share row exclusive mode;

  select * into candidate_row
  from public.candidate_changes
  where id = p_candidate_id
  for update;
  if not found
     or candidate_row.status <> 'approved'
     or candidate_row.candidate_kind <> 'organization_canonical_repair_bundle'
     or candidate_row.schema_version <> 'organization_canonical_repair_bundle_v1'
     or candidate_row.updated_at is distinct from p_expected_candidate_updated_at
     or coalesce(candidate_row.duplicate_check->>'status', '') <> 'clear'
     or not exists (
       select 1 from public.review_decisions decision_record
       where decision_record.candidate_change_id = candidate_row.id
         and decision_record.decision = 'accept'
     ) then
    raise exception 'Canonical repair approval changed after it was opened; refresh before publishing.' using errcode = '40001';
  end if;
  record := candidate_row.proposed_record;

  for operation_record in select value from jsonb_array_elements(record->'operations') operation(value)
  loop
    if operation_record->>'operation' = 'archive_organization' then
      archive_organization := true;
      select coalesce(array_agg(value::uuid), '{}') into archived_capability_ids
      from jsonb_array_elements_text(operation_record#>'{dependencies,activeCapabilityIds}') item(value);
      successor_id := nullif(operation_record#>>'{successor,id}', '')::uuid;
      successor_slug := operation_record#>>'{successor,slug}';
    elsif operation_record->>'operation' = 'archive_capability' then
      archived_capability_ids := array_append(archived_capability_ids, (operation_record->>'capabilityId')::uuid);
    end if;
  end loop;

  perform organization_record.id
  from public.organizations organization_record
  where organization_record.id = candidate_row.target_entity_id
     or organization_record.id = successor_id
  order by organization_record.id
  for update;
  if not exists (select 1 from public.organizations where id = candidate_row.target_entity_id) then
    raise exception 'Canonical repair target no longer exists.' using errcode = 'P0001';
  end if;
  perform alias_record.id
  from public.organization_aliases alias_record
  where alias_record.organization_id = candidate_row.target_entity_id
    and alias_record.publication_status <> 'archived'
  order by alias_record.id
  for update;
  perform capability_record.id
  from public.capabilities capability_record
  where capability_record.organization_id = candidate_row.target_entity_id
    and capability_record.publication_status <> 'archived'
  order by capability_record.id
  for update;

  perform private.assert_organization_canonical_repair_candidate(candidate_row);

  if exists (
    select 1 from public.candidate_changes other_candidate
    where other_candidate.id <> candidate_row.id
      and other_candidate.target_entity_id = candidate_row.target_entity_id
      and other_candidate.status in ('pending', 'approved')
  ) then
    raise exception 'Another open candidate now targets this canonical organization.' using errcode = '40001';
  end if;

  if archive_organization and (
    exists (
      select 1 from public.saved_collection_items item
      where (item.entity_type = 'organization' and item.entity_id = candidate_row.target_entity_id)
         or (item.entity_type = 'capability' and item.entity_id = any(archived_capability_ids))
    )
    or exists (
      select 1 from public.connection_requests request_record
      where request_record.organization_id = candidate_row.target_entity_id
        and request_record.status not in ('declined', 'closed')
    )
    or exists (
      select 1 from public.submissions submission_record
      where submission_record.status in ('pending', 'in_review', 'approved')
        and (
          (submission_record.target_entity_type = 'organization' and submission_record.target_entity_id = candidate_row.target_entity_id)
          or (submission_record.target_entity_type = 'capability' and submission_record.target_entity_id = any(archived_capability_ids))
        )
    )
    or exists (
      select 1 from public.organization_relationships relationship_record
      where relationship_record.related_organization_id = candidate_row.target_entity_id
        and relationship_record.organization_id <> candidate_row.target_entity_id
        and relationship_record.publication_status <> 'archived'
    )
    or exists (
      select 1 from public.organization_slug_redirects redirect_record
      where redirect_record.destination_organization_id = candidate_row.target_entity_id
    )
  ) then
    raise exception 'Canonical organization archival is blocked by a saved item, active workflow, incoming relationship, or existing redirect.' using errcode = '55000';
  end if;
  if cardinality(archived_capability_ids) > 0 and (
    exists (
      select 1 from public.saved_collection_items item
      where item.entity_type = 'capability' and item.entity_id = any(archived_capability_ids)
    )
    or exists (
      select 1 from public.submissions submission_record
      where submission_record.target_entity_type = 'capability'
        and submission_record.target_entity_id = any(archived_capability_ids)
        and submission_record.status in ('pending', 'in_review', 'approved')
    )
    or exists (
      select 1 from public.signal_record_links link
      where link.record_type = 'capability' and link.record_id = any(archived_capability_ids)
    )
    or exists (
      select 1 from public.wiki_page_record_links link
      where link.record_type = 'capability' and link.record_id = any(archived_capability_ids)
    )
  ) then
    raise exception 'Canonical technology archival is blocked by a saved item, active submission, or published editorial link.' using errcode = '55000';
  end if;
  if archive_organization and (
    exists (
      select 1 from public.signal_record_links link
      where (link.record_type = 'organization' and link.record_id = candidate_row.target_entity_id)
         or (link.record_type = 'capability' and link.record_id = any(archived_capability_ids))
    )
    or exists (
      select 1 from public.wiki_page_record_links link
      where (link.record_type = 'organization' and link.record_id = candidate_row.target_entity_id)
         or (link.record_type = 'capability' and link.record_id = any(archived_capability_ids))
    )
  ) then
    raise exception 'Canonical organization archival is blocked by a published editorial link.' using errcode = '55000';
  end if;

  -- This transition runs the canonical baseline trigger while the complete
  -- reviewed graph is still intact. Every later write is in this transaction,
  -- so any failure rolls the transition and all canonical mutations back.
  update public.candidate_changes
  set status = 'published', published_entity_id = candidate_row.target_entity_id,
      published_at = published_on, updated_at = published_on
  where id = candidate_row.id;

  for source_record in select value from jsonb_array_elements(record->'sources') source(value)
  loop
    insert into public.sources (
      title, canonical_url, publisher, source_type, visibility, published_at,
      accessed_at, public_approved, notes
    ) values (
      source_record->>'title', source_record->>'url', source_record->>'publisher',
      source_record->>'sourceKind', 'public', nullif(source_record->>'publishedAt', '')::timestamptz,
      (source_record->>'accessedAt')::timestamptz, true,
      source_record->>'summary'
    )
    on conflict (canonical_url) where canonical_url is not null do update
    set accessed_at = greatest(public.sources.accessed_at, excluded.accessed_at)
    returning id into source_id;
    if not exists (
      select 1 from public.sources source_check
      where source_check.id = source_id
        and source_check.visibility = 'public'
        and source_check.public_approved
    ) then
      raise exception 'Canonical repair source URL already exists as a non-public source and requires separate source review.' using errcode = '55000';
    end if;
    source_map := source_map || jsonb_build_object(source_record->>'id', source_id::text);
  end loop;

  for evidence_record in select value from jsonb_array_elements(record->'fieldEvidence') evidence(value)
  loop
    source_id := nullif(source_map->>coalesce(evidence_record->>'sourceId', ''), '')::uuid;
    if source_id is null then
      raise exception 'Canonical repair evidence % has no resolvable public source.', evidence_record->>'id' using errcode = '22023';
    end if;
    insert into public.evidence_snippets (
      source_id, excerpt, source_locator, visibility, public_approved, extracted_at
    ) values (
      source_id, evidence_record->>'excerpt', evidence_record->>'fieldPath',
      'public', true, published_on
    ) returning id into evidence_id;
    evidence_map := evidence_map || jsonb_build_object(evidence_record->>'id', evidence_id::text);
  end loop;

  -- Resolve reviewed alias removals before identity aliases or replacement
  -- aliases are inserted. The validator reasons over the final alias set, so
  -- publication must not depend on the authoring order of equivalent ops.
  for operation_record in select value from jsonb_array_elements(record->'operations') operation(value)
  loop
    if operation_record->>'operation' = 'archive_alias' then
      update public.organization_aliases set publication_status = 'archived'
      where id = (operation_record->>'aliasId')::uuid
        and organization_id = candidate_row.target_entity_id
        and publication_status <> 'archived';
      if not found then raise exception 'Canonical alias archive target changed.' using errcode = 'P0001'; end if;
    end if;
  end loop;

  for operation_record in select value from jsonb_array_elements(record->'operations') operation(value)
  loop
    if operation_record->>'operation' = 'set_organization_identity' then
      update public.organizations
      set name = operation_record#>>'{after,name}', legal_name = operation_record#>>'{after,legalName}',
          website_url = operation_record#>>'{after,websiteUrl}', entity_kind = operation_record#>>'{after,entityKind}',
          organization_categories = array(select jsonb_array_elements_text(operation_record#>'{after,organizationCategories}')),
          updated_at = published_on
      where id = candidate_row.target_entity_id and publication_status = 'published';
      if operation_record#>>'{formerNameAlias}' is not null then
        insert into public.organization_aliases (
          organization_id, alias, alias_type, publication_status
        ) values (
          candidate_row.target_entity_id, operation_record#>>'{formerNameAlias}', 'former_name', 'published'
        )
        on conflict (organization_id, normalized_alias) do update
        set alias = excluded.alias, alias_type = excluded.alias_type, publication_status = 'published';
      end if;
    elsif operation_record->>'operation' = 'set_profile_field' then
      update public.organizations
      set profile_data = case
            when operation_record->'after' is null or operation_record->'after' = 'null'::jsonb
              then profile_data - (operation_record->>'profileField')
            else jsonb_set(profile_data, array[operation_record->>'profileField'], operation_record->'after', true)
          end,
          updated_at = published_on
      where id = candidate_row.target_entity_id and publication_status = 'published';
    elsif operation_record->>'operation' = 'add_alias' then
      insert into public.organization_aliases (
        organization_id, alias, alias_type, publication_status
      ) values (
        candidate_row.target_entity_id, operation_record->>'alias', operation_record->>'aliasType', 'published'
      )
      on conflict (organization_id, normalized_alias) do update
      set alias = excluded.alias, alias_type = excluded.alias_type, publication_status = 'published';
    elsif operation_record->>'operation' = 'archive_alias' then
      null;
    elsif operation_record->>'operation' = 'archive_capability' then
      update public.capability_domains set publication_status = 'archived'
      where capability_id = (operation_record->>'capabilityId')::uuid and publication_status <> 'archived';
      update public.capability_mission_matches set publication_status = 'archived', updated_at = published_on
      where capability_id = (operation_record->>'capabilityId')::uuid and publication_status <> 'archived';
      update public.capability_clusters set publication_status = 'archived'
      where capability_id = (operation_record->>'capabilityId')::uuid and publication_status <> 'archived';
      update public.capability_demand_matches set publication_status = 'archived', updated_at = published_on
      where capability_id = (operation_record->>'capabilityId')::uuid and publication_status <> 'archived';
      update public.media_assets set publication_status = 'archived', updated_at = published_on
      where capability_id = (operation_record->>'capabilityId')::uuid and publication_status <> 'archived';
      update public.capabilities set publication_status = 'archived', last_reviewed_at = published_on, updated_at = published_on
      where id = (operation_record->>'capabilityId')::uuid
        and organization_id = candidate_row.target_entity_id and publication_status <> 'archived';
      if not found then raise exception 'Canonical technology archive target changed.' using errcode = 'P0001'; end if;
    elsif operation_record->>'operation' = 'archive_organization' then
      update public.organization_aliases set publication_status = 'archived'
      where organization_id = candidate_row.target_entity_id and publication_status <> 'archived';
      update public.organization_locations set publication_status = 'archived', updated_at = published_on
      where organization_id = candidate_row.target_entity_id and publication_status <> 'archived';
      update public.capability_domains set publication_status = 'archived'
      where capability_id = any(archived_capability_ids) and publication_status <> 'archived';
      update public.capability_mission_matches set publication_status = 'archived', updated_at = published_on
      where capability_id = any(archived_capability_ids) and publication_status <> 'archived';
      update public.capability_clusters set publication_status = 'archived'
      where capability_id = any(archived_capability_ids) and publication_status <> 'archived';
      update public.capability_demand_matches set publication_status = 'archived', updated_at = published_on
      where capability_id = any(archived_capability_ids) and publication_status <> 'archived';
      update public.media_assets set publication_status = 'archived', updated_at = published_on
      where publication_status <> 'archived'
        and (organization_id = candidate_row.target_entity_id or capability_id = any(archived_capability_ids));
      update public.capabilities set publication_status = 'archived', last_reviewed_at = published_on, updated_at = published_on
      where id = any(archived_capability_ids) and organization_id = candidate_row.target_entity_id and publication_status <> 'archived';
      update public.program_participations set publication_status = 'archived', updated_at = published_on
      where organization_id = candidate_row.target_entity_id and publication_status <> 'archived';
      update public.organization_relationships set publication_status = 'archived', updated_at = published_on
      where organization_id = candidate_row.target_entity_id and publication_status <> 'archived';
      update public.funding_events set publication_status = 'archived', updated_at = published_on
      where organization_id = candidate_row.target_entity_id and publication_status <> 'archived';
      update public.organizations set publication_status = 'archived', last_reviewed_at = published_on, updated_at = published_on
      where id = candidate_row.target_entity_id and publication_status = 'published'
      returning slug into target_slug;
      if target_slug is null then raise exception 'Canonical organization archive target changed.' using errcode = 'P0001'; end if;
      if successor_id is not null then
        insert into public.organization_slug_redirects (
          source_organization_id, source_slug, destination_organization_id, candidate_change_id, created_by
        ) values (
          candidate_row.target_entity_id, target_slug, successor_id, candidate_row.id, p_reviewer_id
        );
      end if;
    else
      raise exception 'Unsupported canonical repair operation %.', operation_record->>'operation' using errcode = '22023';
    end if;
  end loop;

  if not archive_organization then
    -- Alias- and capability-only repairs still change the public dossier and
    -- sitemap freshness even when parent identity fields are unchanged.
    update public.organizations
    set updated_at = greatest(updated_at, published_on)
    where id = candidate_row.target_entity_id and publication_status = 'published';
    select slug into target_slug
    from public.organizations
    where id = candidate_row.target_entity_id and publication_status = 'published';
    if target_slug is null then raise exception 'Canonical repair target changed during publication.' using errcode = 'P0001'; end if;
  end if;

  for evidence_record in select value from jsonb_array_elements(record->'fieldEvidence') evidence(value)
  loop
    evidence_id := nullif(evidence_map->>(evidence_record->>'id'), '')::uuid;
    operation_id := split_part(evidence_record->>'fieldPath', '.', 2);
    select value into operation_record
    from jsonb_array_elements(record->'operations') operation(value)
    where value->>'operationId' = operation_id;
    if operation_record is null or evidence_id is null then
      raise exception 'Canonical repair evidence cannot be mapped to its reviewed operation.' using errcode = '22023';
    end if;
    operation_kind := operation_record->>'operation';
    citation_entity_type := 'organization';
    citation_entity_id := candidate_row.target_entity_id;
    citation_field_name := case
      when operation_kind = 'set_organization_identity' and evidence_record->>'fieldPath' like '%.after.name' then 'name'
      when operation_kind = 'set_organization_identity' and evidence_record->>'fieldPath' like '%.after.legalName' then 'legal_name'
      when operation_kind = 'set_organization_identity' and evidence_record->>'fieldPath' like '%.after.websiteUrl' then 'website_url'
      when operation_kind = 'set_organization_identity' and evidence_record->>'fieldPath' like '%.after.entityKind' then 'entity_kind'
      when operation_kind = 'set_organization_identity' and evidence_record->>'fieldPath' like '%.after.organizationCategories' then 'organization_categories'
      when operation_kind = 'set_profile_field' then 'profileData.' || (operation_record->>'profileField')
      when operation_kind in ('add_alias', 'archive_alias')
        or evidence_record->>'fieldPath' like '%.formerNameAlias' then 'aliases'
      when operation_kind = 'archive_organization' then 'publication_status'
      else null
    end;
    if operation_kind = 'archive_capability' then
      citation_entity_type := 'capability';
      citation_entity_id := (operation_record->>'capabilityId')::uuid;
      citation_field_name := 'publication_status';
    end if;
    if citation_field_name is null then
      raise exception 'Canonical repair evidence path % is not publishable.', evidence_record->>'fieldPath' using errcode = '22023';
    end if;
    insert into public.field_citations (entity_type, entity_id, field_name, evidence_snippet_id)
    values (citation_entity_type, citation_entity_id, citation_field_name, evidence_id)
    on conflict do nothing;
  end loop;

  insert into public.audit_events (
    actor_id, actor_role, event_type, entity_type, entity_id, summary, metadata
  ) values (
    p_reviewer_id, coalesce(auth.jwt()->'app_metadata'->>'role', 'reviewer'),
    'canonical_organization_repair_published', 'organization', candidate_row.target_entity_id,
    'Reviewer published one governed canonical organization repair.',
    jsonb_build_object(
      'candidate_id', candidate_row.id,
      'schema_version', 'organization_canonical_repair_bundle_v1',
      'operations', record->'operations',
      'archived', archive_organization,
      'successor_id', successor_id,
      'publication_changed', true,
      'hard_deleted', false,
      'claims_transferred', false
    )
  );

  candidate_id := candidate_row.id;
  entity_type := 'organization';
  entity_id := candidate_row.target_entity_id;
  entity_slug := coalesce(target_slug, record#>>'{targetMatch,slug}');
  return next;
end;
$$;

revoke all on function public.publish_reviewed_organization_canonical_repair_candidate(uuid, uuid, timestamptz)
from public, anon, authenticated;
grant execute on function public.publish_reviewed_organization_canonical_repair_candidate(uuid, uuid, timestamptz)
to authenticated;

comment on function public.review_organization_canonical_repair_candidate(uuid, uuid, text, text, timestamptz)
is 'Atomically records one human canonical-repair review decision against the exact pending candidate version; it cannot publish.';
comment on function public.publish_reviewed_organization_canonical_repair_candidate(uuid, uuid, timestamptz)
is 'Atomically publishes one separately approved organization canonical repair after exact identity, dependency, workflow, successor, collision, and evidence checks; it never hard-deletes or transfers claims.';
