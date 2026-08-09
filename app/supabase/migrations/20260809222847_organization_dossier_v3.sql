-- Add the reviewed executive-dossier fields without activating any public
-- profile. Historical JSON and canonical program records remain intact.

create or replace function private.is_valid_reviewed_questions(p_value jsonb)
returns boolean
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  question_record jsonb;
begin
  if p_value is null or jsonb_typeof(p_value) <> 'array' or jsonb_array_length(p_value) > 4 then
    return false;
  end if;

  for question_record in select value from jsonb_array_elements(p_value)
  loop
    if jsonb_typeof(question_record) <> 'object'
       or exists (
         select 1
         from jsonb_object_keys(question_record) as question_key
         where question_key not in ('id', 'question', 'context', 'confidence')
       )
       or coalesce(question_record->>'id', '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
       or length(question_record->>'id') not between 3 and 80
       or length(trim(coalesce(question_record->>'question', ''))) not between 20 and 280
       or length(trim(coalesce(question_record->>'context', ''))) not between 40 and 500
       or coalesce(question_record->>'confidence', '') not in ('high', 'moderate') then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

revoke all on function private.is_valid_reviewed_questions(jsonb) from public, anon;
grant execute on function private.is_valid_reviewed_questions(jsonb) to authenticated, service_role;

create or replace function private.is_valid_external_identifiers(p_value jsonb)
returns boolean
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  identifier_record jsonb;
begin
  if p_value is null or jsonb_typeof(p_value) <> 'array' or jsonb_array_length(p_value) > 10 then
    return false;
  end if;

  for identifier_record in select value from jsonb_array_elements(p_value)
  loop
    if jsonb_typeof(identifier_record) <> 'object'
       or exists (
         select 1
         from jsonb_object_keys(identifier_record) as identifier_key
         where identifier_key not in ('kind', 'value')
       )
       or coalesce(identifier_record->>'kind', '') not in ('contract', 'notice', 'challenge', 'project', 'award', 'other')
       or length(trim(coalesce(identifier_record->>'value', ''))) not between 1 and 160 then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

revoke all on function private.is_valid_external_identifiers(jsonb) from public, anon;
grant execute on function private.is_valid_external_identifiers(jsonb) to authenticated, service_role;

alter table public.organizations
  add column editorial_profile_version text
    check (editorial_profile_version is null or editorial_profile_version = 'organization_editorial_profile_v1'),
  add column current_activity text
    check (current_activity is null or length(trim(current_activity)) between 40 and 4000),
  add column current_activity_as_of date,
  add column operating_context text
    check (operating_context is null or length(trim(operating_context)) between 40 and 2000),
  add column canadian_footprint text
    check (canadian_footprint is null or length(trim(canadian_footprint)) between 40 and 2000),
  add column reviewed_questions jsonb not null default '[]'::jsonb
    check (private.is_valid_reviewed_questions(reviewed_questions));

alter table public.program_participations
  add column public_summary text
    check (public_summary is null or length(trim(public_summary)) between 40 and 2000),
  add column lifecycle_stage text
    check (lifecycle_stage is null or lifecycle_stage in (
      'announced', 'selected', 'funded', 'awarded', 'contracted', 'testing',
      'evaluating', 'delivering', 'operational', 'completed', 'cancelled'
    )),
  add column announced_on date,
  add column external_identifiers jsonb not null default '[]'::jsonb
    check (private.is_valid_external_identifiers(external_identifiers)),
  add constraint program_participations_date_order_check
    check (ended_on is null or started_on is null or ended_on >= started_on);

alter table public.media_assets
  add column alt_text text
    check (alt_text is null or length(trim(alt_text)) between 5 and 300),
  add column display_role text
    check (display_role is null or display_role in (
      'profile_identity', 'profile_context', 'capability_context', 'source_support'
    ));

-- One bounded event carries the dossier interaction taxonomy while the
-- existing private table and 30-day retention policy remain unchanged.
alter table public.pilot_events
  drop constraint if exists pilot_events_event_name_check;
alter table public.pilot_events
  add constraint pilot_events_event_name_check check (event_name in (
    'atlas_search', 'filter_apply', 'marker_select', 'result_select',
    'dossier_open', 'evidence_open', 'export', 'save', 'submission',
    'connection', 'subscription', 'newsletter_impression', 'newsletter_open',
    'newsletter_form_start', 'newsletter_submit', 'newsletter_error',
    'newsletter_dismiss', 'feedback', 'share', 'profile_engagement'
  ));

comment on column public.organizations.editorial_profile_version
is 'Human-approved public presentation contract. Null keeps the organization on the legacy dossier.';
comment on column public.organizations.current_activity
is 'Cited, time-bounded activity used in the executive dossier.';
comment on column public.organizations.current_activity_as_of
is 'Date through which current_activity was assessed; it is not inferred from review time.';
comment on column public.organizations.reviewed_questions
is 'Up to four reviewed decision-support questions. These are assessments, not source facts.';
comment on column public.program_participations.public_summary
is 'Organization-specific participation narrative. Existing one-to-one program summaries are copied here during the initial normalization and may be refined through reviewed enrichment.';
comment on column public.media_assets.display_role
is 'Reviewed dossier placement metadata using an existing media asset type.';

-- Normalize only current-activity claims that already have an exact public
-- field citation. The legacy JSON and its citation remain available during the
-- transition, and no dossier version is activated automatically.
update public.organizations organization_record
set current_activity = organization_record.profile_data->>'currentActivity'
where organization_record.current_activity is null
  and jsonb_typeof(organization_record.profile_data->'currentActivity') = 'string'
  and length(trim(organization_record.profile_data->>'currentActivity')) between 40 and 4000
  and exists (
    select 1
    from public.field_citations citation_record
    join public.evidence_snippets evidence_record
      on evidence_record.id = citation_record.evidence_snippet_id
     and evidence_record.visibility = 'public'
     and evidence_record.public_approved
    join public.sources source_record
      on source_record.id = evidence_record.source_id
     and source_record.visibility = 'public'
     and source_record.public_approved
    where citation_record.entity_type = 'organization'
      and citation_record.entity_id = organization_record.id
      and citation_record.field_name = 'profileData.currentActivity'
  );

insert into public.field_citations (entity_type, entity_id, field_name, evidence_snippet_id)
select citation_record.entity_type,
       citation_record.entity_id,
       'current_activity',
       citation_record.evidence_snippet_id
from public.field_citations citation_record
join public.organizations organization_record
  on organization_record.id = citation_record.entity_id
 and organization_record.current_activity is not null
where citation_record.entity_type = 'organization'
  and citation_record.field_name = 'profileData.currentActivity'
on conflict do nothing;

-- Every program in the pre-dossier production corpus has one participation,
-- so its existing summary is also the current organization-specific public
-- narrative. Copy only that unambiguous one-to-one state; a program shared by
-- multiple organizations must receive a reviewed participation summary later.
update public.program_participations participation_record
set public_summary = program_record.summary
from public.programs program_record
where participation_record.program_id = program_record.id
  and participation_record.public_summary is null
  and length(trim(program_record.summary)) between 40 and 2000
  and 1 = (
    select count(*)
    from public.program_participations sibling_record
    where sibling_record.program_id = participation_record.program_id
  );

-- Retain every original program citation and attach the corresponding summary
-- evidence to the normalized participation claim. Historical add-child
-- citations supported the inserted program record as a whole and therefore
-- remain valid for the copied summary.
insert into public.field_citations (entity_type, entity_id, field_name, evidence_snippet_id)
select 'program_participation',
       participation_record.id,
       'public_summary',
       citation_record.evidence_snippet_id
from public.program_participations participation_record
join public.programs program_record
  on program_record.id = participation_record.program_id
 and participation_record.public_summary = program_record.summary
join public.field_citations citation_record
  on citation_record.entity_type = 'program'
 and citation_record.entity_id = program_record.id
 and citation_record.field_name in ('summary', 'add_child')
where 1 = (
  select count(*)
  from public.program_participations sibling_record
  where sibling_record.program_id = participation_record.program_id
)
on conflict do nothing;

create index organizations_editorial_profile_idx
  on public.organizations (editorial_profile_version, updated_at desc)
  where publication_status = 'published' and editorial_profile_version is not null;
create index program_participations_organization_lifecycle_idx
  on public.program_participations (organization_id, lifecycle_stage, announced_on desc)
  where publication_status = 'published';
create index media_assets_dossier_role_idx
  on public.media_assets (organization_id, display_role, created_at)
  where publication_status = 'published' and approval_status = 'approved';

-- Program citations were already canonical public evidence, but the original
-- field-citation policy did not include the program entity type. Rebuild the
-- consolidated anonymous/authenticated policies so the security-invoker
-- dossier can expose only citations attached to a published program and fully
-- public, approved source evidence. Authenticated staff retain their existing
-- private editorial read path.
drop policy if exists "public field citations are readable" on public.field_citations;
drop policy if exists "public field citations are readable for authenticated" on public.field_citations;

create policy "public field citations are readable"
on public.field_citations for select to anon
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
    or (entity_type = 'program' and exists (
      select 1 from public.programs record
      where record.id = field_citations.entity_id and record.publication_status = 'published'
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

do $$
declare
  public_qual text;
begin
  select qual into public_qual
  from pg_policies
  where schemaname = 'public'
    and tablename = 'field_citations'
    and policyname = 'public field citations are readable';
  if public_qual is null then
    raise exception 'The anonymous field-citation predicate was not created.' using errcode = '42704';
  end if;
  execute format(
    'create policy %I on public.field_citations for select to authenticated using ((%s) or (select private.is_atlas_staff()))',
    'public field citations are readable for authenticated',
    public_qual
  );
end;
$$;

-- Rebuild the bounded dossier projection with explicit public-state filters.
-- security_invoker keeps every underlying RLS policy authoritative.
drop view public.organization_dossiers;

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
      and location_link.publication_status = 'published'
  ), '[]'::jsonb) as locations,
  coalesce((
    select jsonb_agg(to_jsonb(capability_record) order by capability_record.name)
    from public.capabilities capability_record
    where capability_record.organization_id = organization_record.id
      and capability_record.publication_status = 'published'
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
    join public.capabilities capability_record
      on capability_record.id = domain_link.capability_id
     and capability_record.publication_status = 'published'
    join public.technical_domains domain_record
      on domain_record.id = domain_link.technical_domain_id
     and domain_record.publication_status = 'published'
    where capability_record.organization_id = organization_record.id
      and domain_link.publication_status = 'published'
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
    join public.capabilities capability_record
      on capability_record.id = match_record.capability_id
     and capability_record.publication_status = 'published'
    join public.mission_areas mission_record
      on mission_record.id = match_record.mission_area_id
     and mission_record.publication_status = 'published'
    where capability_record.organization_id = organization_record.id
      and match_record.review_status = 'approved'
      and match_record.publication_status = 'published'
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
    join public.capabilities capability_record
      on capability_record.id = match_record.capability_id
     and capability_record.publication_status = 'published'
    join public.demand_requirements requirement_record
      on requirement_record.id = match_record.demand_requirement_id
     and requirement_record.publication_status = 'published'
    join public.demand_sources demand_source_record
      on demand_source_record.id = requirement_record.demand_source_id
     and demand_source_record.publication_status = 'published'
    where capability_record.organization_id = organization_record.id
      and match_record.review_status = 'approved'
      and match_record.publication_status = 'published'
  ), '[]'::jsonb) as demand_matches,
  coalesce((
    select jsonb_agg(
      to_jsonb(participation_record)
      || jsonb_build_object('program', to_jsonb(program_record))
      order by participation_record.announced_on desc nulls last, program_record.name
    )
    from public.program_participations participation_record
    join public.programs program_record
      on program_record.id = participation_record.program_id
     and program_record.publication_status = 'published'
    where participation_record.organization_id = organization_record.id
      and participation_record.publication_status = 'published'
  ), '[]'::jsonb) as programs,
  coalesce((
    select jsonb_agg(to_jsonb(funding_record) order by funding_record.announced_on desc nulls last)
    from public.funding_events funding_record
    where funding_record.organization_id = organization_record.id
      and funding_record.publication_status = 'published'
  ), '[]'::jsonb) as funding_events,
  coalesce((
    select jsonb_agg(
      to_jsonb(relationship_record)
      || jsonb_build_object(
        'related_organization', case
          when related_organization.id is null then null
          else jsonb_build_object(
            'id', related_organization.id,
            'slug', related_organization.slug,
            'name', related_organization.name,
            'entity_kind', related_organization.entity_kind
          )
        end
      )
      order by relationship_record.relationship_type, relationship_record.related_organization_name
    )
    from public.organization_relationships relationship_record
    left join public.organizations related_organization
      on related_organization.id = relationship_record.related_organization_id
     and related_organization.publication_status = 'published'
    where relationship_record.organization_id = organization_record.id
      and relationship_record.publication_status = 'published'
  ), '[]'::jsonb) as relationships,
  coalesce((
    select jsonb_agg(to_jsonb(media_record) order by media_record.display_role nulls last, media_record.asset_type, media_record.created_at)
    from public.media_assets media_record
    where media_record.approval_status = 'approved'
      and media_record.publication_status = 'published'
      and (
        media_record.organization_id = organization_record.id
        or media_record.capability_id in (
          select capability_record.id
          from public.capabilities capability_record
          where capability_record.organization_id = organization_record.id
            and capability_record.publication_status = 'published'
        )
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
    join public.evidence_snippets evidence_record
      on evidence_record.id = citation_record.evidence_snippet_id
     and evidence_record.visibility = 'public'
     and evidence_record.public_approved
    join public.sources source_record
      on source_record.id = evidence_record.source_id
     and source_record.visibility = 'public'
     and source_record.public_approved
    where
      (citation_record.entity_type = 'organization' and citation_record.entity_id = organization_record.id)
      or (
        citation_record.entity_type = 'capability'
        and citation_record.entity_id in (
          select capability_record.id
          from public.capabilities capability_record
          where capability_record.organization_id = organization_record.id
            and capability_record.publication_status = 'published'
        )
      )
      or (
        citation_record.entity_type = 'program'
        and citation_record.entity_id in (
          select participation_record.program_id
          from public.program_participations participation_record
          join public.programs program_record
            on program_record.id = participation_record.program_id
           and program_record.publication_status = 'published'
          where participation_record.organization_id = organization_record.id
            and participation_record.publication_status = 'published'
        )
      )
      or (
        citation_record.entity_type = 'program_participation'
        and citation_record.entity_id in (
          select participation_record.id
          from public.program_participations participation_record
          where participation_record.organization_id = organization_record.id
            and participation_record.publication_status = 'published'
        )
      )
      or (
        citation_record.entity_type = 'funding_event'
        and citation_record.entity_id in (
          select funding_record.id
          from public.funding_events funding_record
          where funding_record.organization_id = organization_record.id
            and funding_record.publication_status = 'published'
        )
      )
      or (
        citation_record.entity_type = 'organization_relationship'
        and citation_record.entity_id in (
          select relationship_record.id
          from public.organization_relationships relationship_record
          where relationship_record.organization_id = organization_record.id
            and relationship_record.publication_status = 'published'
        )
      )
      or (
        citation_record.entity_type = 'media_asset'
        and citation_record.entity_id in (
          select media_record.id
          from public.media_assets media_record
          where media_record.approval_status = 'approved'
            and media_record.publication_status = 'published'
            and (
              media_record.organization_id = organization_record.id
              or media_record.capability_id in (
                select capability_record.id
                from public.capabilities capability_record
                where capability_record.organization_id = organization_record.id
                  and capability_record.publication_status = 'published'
              )
            )
        )
      )
      or (
        citation_record.entity_type = 'capability_mission_match'
        and citation_record.entity_id in (
          select match_record.id
          from public.capability_mission_matches match_record
          join public.capabilities capability_record on capability_record.id = match_record.capability_id
          where capability_record.organization_id = organization_record.id
            and capability_record.publication_status = 'published'
            and match_record.review_status = 'approved'
            and match_record.publication_status = 'published'
        )
      )
      or (
        citation_record.entity_type = 'capability_demand_match'
        and citation_record.entity_id in (
          select match_record.id
          from public.capability_demand_matches match_record
          join public.capabilities capability_record on capability_record.id = match_record.capability_id
          where capability_record.organization_id = organization_record.id
            and capability_record.publication_status = 'published'
            and match_record.review_status = 'approved'
            and match_record.publication_status = 'published'
        )
      )
  ), '[]'::jsonb) as citations
from public.organizations organization_record
where organization_record.publication_status = 'published';

grant select on public.organization_dossiers to anon, authenticated, service_role;

comment on view public.organization_dossiers
is 'Bounded public organization projection. security_invoker preserves source-table RLS; explicit publication, approval, and evidence filters prevent private child records from entering public dossiers.';

create or replace function private.has_public_field_citation(
  p_entity_type text,
  p_entity_id uuid,
  p_field_name text
)
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.field_citations citation_record
    join public.evidence_snippets evidence_record
      on evidence_record.id = citation_record.evidence_snippet_id
     and evidence_record.visibility = 'public'
     and evidence_record.public_approved
    join public.sources source_record
      on source_record.id = evidence_record.source_id
     and source_record.visibility = 'public'
     and source_record.public_approved
    where citation_record.entity_type = p_entity_type
      and citation_record.entity_id = p_entity_id
      and citation_record.field_name = p_field_name
  );
$$;

revoke all on function private.has_public_field_citation(text, uuid, text) from public, anon;
grant execute on function private.has_public_field_citation(text, uuid, text) to authenticated, service_role;

create or replace function public.update_published_organization_editorial_profile(
  p_organization_id uuid,
  p_reviewer_id uuid,
  p_payload jsonb,
  p_rationale text
)
returns text
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $$
declare
  organization_record public.organizations%rowtype;
  clean_version text;
  clean_current_activity text;
  clean_current_activity_as_of date;
  clean_operating_context text;
  clean_canadian_footprint text;
  clean_questions jsonb;
  question_record jsonb;
begin
  if not private.is_atlas_staff() or auth.uid() is distinct from p_reviewer_id then
    raise exception 'Editing requires the authenticated atlas administrator.' using errcode = '42501';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object'
     or not (p_payload ?& array[
       'editorialProfileVersion', 'currentActivity', 'currentActivityAsOf',
       'operatingContext', 'canadianFootprint', 'reviewedQuestions'
     ]) then
    raise exception 'The editorial profile payload is incomplete.' using errcode = '22023';
  end if;
  if length(trim(coalesce(p_rationale, ''))) < 3 then
    raise exception 'Provide an editorial rationale for the public change.' using errcode = '22023';
  end if;

  select * into organization_record
  from public.organizations
  where id = p_organization_id and publication_status = 'published'
  for update;
  if organization_record.id is null then
    raise exception 'The selected published organization no longer exists.' using errcode = 'P0002';
  end if;

  clean_version := nullif(trim(coalesce(p_payload->>'editorialProfileVersion', '')), '');
  clean_current_activity := nullif(trim(coalesce(p_payload->>'currentActivity', '')), '');
  clean_current_activity_as_of := nullif(trim(coalesce(p_payload->>'currentActivityAsOf', '')), '')::date;
  clean_operating_context := nullif(trim(coalesce(p_payload->>'operatingContext', '')), '');
  clean_canadian_footprint := nullif(trim(coalesce(p_payload->>'canadianFootprint', '')), '');
  clean_questions := coalesce(p_payload->'reviewedQuestions', '[]'::jsonb);

  if clean_version is not null and clean_version <> 'organization_editorial_profile_v1' then
    raise exception 'Unknown organization editorial profile version.' using errcode = '22023';
  end if;
  if not private.is_valid_reviewed_questions(clean_questions) then
    raise exception 'Reviewed questions do not satisfy the public dossier contract.' using errcode = '22023';
  end if;
  if clean_current_activity is not null and clean_current_activity_as_of is null then
    raise exception 'Current activity requires an explicit as-of date.' using errcode = '22023';
  end if;
  if clean_current_activity is null and clean_current_activity_as_of is not null then
    raise exception 'An as-of date cannot be published without current activity.' using errcode = '22023';
  end if;

  if clean_current_activity is distinct from organization_record.current_activity
     and clean_current_activity is not null
     and not private.has_public_field_citation('organization', p_organization_id, 'current_activity') then
    raise exception 'Current activity cannot change without an attached public citation.' using errcode = '22023';
  end if;
  if clean_current_activity_as_of is distinct from organization_record.current_activity_as_of
     and clean_current_activity_as_of is not null
     and not private.has_public_field_citation('organization', p_organization_id, 'current_activity_as_of') then
    raise exception 'The current-activity as-of date cannot change without an attached public citation.' using errcode = '22023';
  end if;
  if clean_operating_context is distinct from organization_record.operating_context
     and clean_operating_context is not null
     and not private.has_public_field_citation('organization', p_organization_id, 'operating_context') then
    raise exception 'Operating context cannot change without an attached public citation.' using errcode = '22023';
  end if;
  if clean_canadian_footprint is distinct from organization_record.canadian_footprint
     and clean_canadian_footprint is not null
     and not private.has_public_field_citation('organization', p_organization_id, 'canadian_footprint') then
    raise exception 'Canadian footprint cannot change without an attached public citation.' using errcode = '22023';
  end if;

  for question_record in select value from jsonb_array_elements(clean_questions)
  loop
    if not private.has_public_field_citation(
      'organization',
      p_organization_id,
      'reviewed_questions.' || (question_record->>'id') || '.context'
    ) then
      raise exception 'Reviewed question % lacks an attached public context citation.', question_record->>'id'
        using errcode = '22023';
    end if;
  end loop;

  if clean_version = 'organization_editorial_profile_v1' then
    if not private.has_public_field_citation('organization', p_organization_id, 'description') then
      raise exception 'The executive profile cannot be activated without cited organization copy.' using errcode = '22023';
    end if;
    if clean_current_activity is not null
       and not private.has_public_field_citation('organization', p_organization_id, 'current_activity') then
      raise exception 'The executive profile has uncited current activity.' using errcode = '22023';
    end if;
    if clean_operating_context is not null
       and not private.has_public_field_citation('organization', p_organization_id, 'operating_context') then
      raise exception 'The executive profile has uncited operating context.' using errcode = '22023';
    end if;
    if clean_canadian_footprint is not null
       and not private.has_public_field_citation('organization', p_organization_id, 'canadian_footprint') then
      raise exception 'The executive profile has an uncited Canadian footprint.' using errcode = '22023';
    end if;
  end if;

  update public.organizations
  set editorial_profile_version = clean_version,
      current_activity = clean_current_activity,
      current_activity_as_of = clean_current_activity_as_of,
      operating_context = clean_operating_context,
      canadian_footprint = clean_canadian_footprint,
      reviewed_questions = clean_questions,
      last_reviewed_at = now(),
      updated_at = now()
  where id = p_organization_id;

  insert into public.audit_events (
    actor_id, actor_role, event_type, entity_type, entity_id, summary, metadata
  ) values (
    p_reviewer_id,
    coalesce(auth.jwt()->'app_metadata'->>'role', 'admin'),
    'published_organization_editorial_profile_edited',
    'organization',
    p_organization_id,
    'Administrator edited the cited organization editorial profile.',
    jsonb_build_object(
      'rationale', trim(p_rationale),
      'before', jsonb_build_object(
        'editorialProfileVersion', organization_record.editorial_profile_version,
        'currentActivity', organization_record.current_activity,
        'currentActivityAsOf', organization_record.current_activity_as_of,
        'operatingContext', organization_record.operating_context,
        'canadianFootprint', organization_record.canadian_footprint,
        'reviewedQuestions', organization_record.reviewed_questions
      ),
      'after', p_payload
    )
  );

  return organization_record.slug;
end;
$$;

revoke all on function public.update_published_organization_editorial_profile(uuid, uuid, jsonb, text)
from public, anon, authenticated;
grant execute on function public.update_published_organization_editorial_profile(uuid, uuid, jsonb, text)
to authenticated;

comment on function public.update_published_organization_editorial_profile(uuid, uuid, jsonb, text)
is 'Corrects an existing cited editorial profile and explicitly activates or deactivates its reviewed presentation version. It cannot attach new evidence.';

create or replace function public.update_published_organization_dossier_child(
  p_organization_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_reviewer_id uuid,
  p_payload jsonb,
  p_rationale text
)
returns uuid
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $$
declare
  before_record jsonb;
  after_record jsonb;
  participation_record public.program_participations%rowtype;
  funding_record public.funding_events%rowtype;
  relationship_record public.organization_relationships%rowtype;
  media_record public.media_assets%rowtype;
  clean_identifiers jsonb;
  clean_date date;
  clean_started_on date;
  clean_ended_on date;
  clean_amount numeric;
begin
  if not private.is_atlas_staff() or auth.uid() is distinct from p_reviewer_id then
    raise exception 'Editing requires the authenticated atlas administrator.' using errcode = '42501';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'The child-record payload must be an object.' using errcode = '22023';
  end if;
  if length(trim(coalesce(p_rationale, ''))) < 3 then
    raise exception 'Provide an editorial rationale for the public change.' using errcode = '22023';
  end if;
  perform 1
  from public.organizations
  where id = p_organization_id
    and publication_status = 'published'
  for update;
  if not found then
    raise exception 'The selected published organization no longer exists.' using errcode = 'P0002';
  end if;

  if p_entity_type = 'program_participation' then
    select * into participation_record
    from public.program_participations
    where id = p_entity_id
      and organization_id = p_organization_id
      and publication_status = 'published'
    for update;
    if participation_record.id is null then
      raise exception 'The selected published participation no longer exists.' using errcode = 'P0002';
    end if;
    if not (p_payload ?& array[
      'participationType', 'cohortLabel', 'publicSummary', 'lifecycleStage',
      'announcedOn', 'startedOn', 'endedOn', 'externalIdentifiers'
    ]) then
      raise exception 'The program participation payload is incomplete.' using errcode = '22023';
    end if;
    if length(trim(coalesce(p_payload->>'participationType', ''))) < 1 then
      raise exception 'Participation role is required.' using errcode = '22023';
    end if;

    clean_identifiers := coalesce(p_payload->'externalIdentifiers', '[]'::jsonb);
    clean_date := nullif(trim(coalesce(p_payload->>'announcedOn', '')), '')::date;
    clean_started_on := nullif(trim(coalesce(p_payload->>'startedOn', '')), '')::date;
    clean_ended_on := nullif(trim(coalesce(p_payload->>'endedOn', '')), '')::date;
    if not private.is_valid_external_identifiers(clean_identifiers)
       or (clean_started_on is not null and clean_ended_on is not null and clean_ended_on < clean_started_on) then
      raise exception 'The program participation dates or identifiers are invalid.' using errcode = '22023';
    end if;

    if nullif(trim(coalesce(p_payload->>'participationType', '')), '') is distinct from participation_record.participation_type
       and nullif(trim(coalesce(p_payload->>'participationType', '')), '') is not null
       and not private.has_public_field_citation(p_entity_type, p_entity_id, 'participation_type') then
      raise exception 'Participation role cannot change without an attached public citation.' using errcode = '22023';
    end if;
    if nullif(trim(coalesce(p_payload->>'cohortLabel', '')), '') is distinct from participation_record.cohort_label
       and nullif(trim(coalesce(p_payload->>'cohortLabel', '')), '') is not null
       and not private.has_public_field_citation(p_entity_type, p_entity_id, 'cohort_label') then
      raise exception 'Cohort cannot change without an attached public citation.' using errcode = '22023';
    end if;
    if nullif(trim(coalesce(p_payload->>'publicSummary', '')), '') is distinct from participation_record.public_summary
       and nullif(trim(coalesce(p_payload->>'publicSummary', '')), '') is not null
       and not private.has_public_field_citation(p_entity_type, p_entity_id, 'public_summary') then
      raise exception 'Participation summary cannot change without an attached public citation.' using errcode = '22023';
    end if;
    if nullif(trim(coalesce(p_payload->>'lifecycleStage', '')), '') is distinct from participation_record.lifecycle_stage
       and nullif(trim(coalesce(p_payload->>'lifecycleStage', '')), '') is not null
       and not private.has_public_field_citation(p_entity_type, p_entity_id, 'lifecycle_stage') then
      raise exception 'Lifecycle stage cannot change without an attached public citation.' using errcode = '22023';
    end if;
    if clean_date is distinct from participation_record.announced_on and clean_date is not null
       and not private.has_public_field_citation(p_entity_type, p_entity_id, 'announced_on') then
      raise exception 'Announcement date cannot change without an attached public citation.' using errcode = '22023';
    end if;
    if clean_started_on is distinct from participation_record.started_on and clean_started_on is not null
       and not private.has_public_field_citation(p_entity_type, p_entity_id, 'started_on') then
      raise exception 'Start date cannot change without an attached public citation.' using errcode = '22023';
    end if;
    if clean_ended_on is distinct from participation_record.ended_on and clean_ended_on is not null
       and not private.has_public_field_citation(p_entity_type, p_entity_id, 'ended_on') then
      raise exception 'End date cannot change without an attached public citation.' using errcode = '22023';
    end if;
    if clean_identifiers is distinct from participation_record.external_identifiers
       and clean_identifiers <> '[]'::jsonb
       and not private.has_public_field_citation(p_entity_type, p_entity_id, 'external_identifiers') then
      raise exception 'External identifiers cannot change without an attached public citation.' using errcode = '22023';
    end if;

    before_record := to_jsonb(participation_record);
    update public.program_participations as updated_record
    set participation_type = trim(p_payload->>'participationType'),
        cohort_label = nullif(trim(coalesce(p_payload->>'cohortLabel', '')), ''),
        public_summary = nullif(trim(coalesce(p_payload->>'publicSummary', '')), ''),
        lifecycle_stage = nullif(trim(coalesce(p_payload->>'lifecycleStage', '')), ''),
        announced_on = clean_date,
        started_on = clean_started_on,
        ended_on = clean_ended_on,
        external_identifiers = clean_identifiers,
        updated_at = now()
    where id = p_entity_id
    returning to_jsonb(updated_record) into after_record;

  elsif p_entity_type = 'funding_event' then
    select * into funding_record
    from public.funding_events
    where id = p_entity_id
      and organization_id = p_organization_id
      and publication_status = 'published'
    for update;
    if funding_record.id is null then
      raise exception 'The selected published funding event no longer exists.' using errcode = 'P0002';
    end if;
    if not (p_payload ?& array['eventType', 'announcedOn', 'amountValue', 'amountCurrency', 'disclosedSummary']) then
      raise exception 'The funding event payload is incomplete.' using errcode = '22023';
    end if;
    if length(trim(coalesce(p_payload->>'eventType', ''))) < 1
       or length(trim(coalesce(p_payload->>'disclosedSummary', ''))) < 1 then
      raise exception 'Funding event type and public summary are required.' using errcode = '22023';
    end if;

    clean_date := nullif(trim(coalesce(p_payload->>'announcedOn', '')), '')::date;
    clean_amount := nullif(trim(coalesce(p_payload->>'amountValue', '')), '')::numeric;
    if nullif(trim(coalesce(p_payload->>'eventType', '')), '') is distinct from funding_record.event_type
       and not private.has_public_field_citation(p_entity_type, p_entity_id, 'event_type') then
      raise exception 'Funding event type cannot change without an attached public citation.' using errcode = '22023';
    end if;
    if clean_date is distinct from funding_record.announced_on and clean_date is not null
       and not private.has_public_field_citation(p_entity_type, p_entity_id, 'announced_on') then
      raise exception 'Funding announcement date cannot change without an attached public citation.' using errcode = '22023';
    end if;
    if clean_amount is distinct from funding_record.amount_value and clean_amount is not null
       and not private.has_public_field_citation(p_entity_type, p_entity_id, 'amount_value') then
      raise exception 'Funding amount cannot change without an attached public citation.' using errcode = '22023';
    end if;
    if nullif(upper(trim(coalesce(p_payload->>'amountCurrency', ''))), '') is distinct from funding_record.amount_currency
       and nullif(upper(trim(coalesce(p_payload->>'amountCurrency', ''))), '') is not null
       and not private.has_public_field_citation(p_entity_type, p_entity_id, 'amount_currency') then
      raise exception 'Funding currency cannot change without an attached public citation.' using errcode = '22023';
    end if;
    if nullif(trim(coalesce(p_payload->>'disclosedSummary', '')), '') is distinct from funding_record.disclosed_summary
       and not private.has_public_field_citation(p_entity_type, p_entity_id, 'disclosed_summary') then
      raise exception 'Funding summary cannot change without an attached public citation.' using errcode = '22023';
    end if;

    before_record := to_jsonb(funding_record);
    update public.funding_events as updated_record
    set event_type = trim(p_payload->>'eventType'),
        announced_on = clean_date,
        amount_value = clean_amount,
        amount_currency = nullif(upper(trim(coalesce(p_payload->>'amountCurrency', ''))), ''),
        disclosed_summary = trim(p_payload->>'disclosedSummary'),
        updated_at = now()
    where id = p_entity_id
    returning to_jsonb(updated_record) into after_record;

  elsif p_entity_type = 'organization_relationship' then
    select * into relationship_record
    from public.organization_relationships
    where id = p_entity_id
      and organization_id = p_organization_id
      and publication_status = 'published'
    for update;
    if relationship_record.id is null then
      raise exception 'The selected published relationship no longer exists.' using errcode = 'P0002';
    end if;
    if not (p_payload ?& array['relationshipType', 'publicSummary']) then
      raise exception 'The organization relationship payload is incomplete.' using errcode = '22023';
    end if;
    if length(trim(coalesce(p_payload->>'relationshipType', ''))) < 1
       or length(trim(coalesce(p_payload->>'publicSummary', ''))) < 1 then
      raise exception 'Relationship type and public summary are required.' using errcode = '22023';
    end if;
    if nullif(trim(coalesce(p_payload->>'relationshipType', '')), '') is distinct from relationship_record.relationship_type
       and not private.has_public_field_citation(p_entity_type, p_entity_id, 'relationship_type') then
      raise exception 'Relationship type cannot change without an attached public citation.' using errcode = '22023';
    end if;
    if nullif(trim(coalesce(p_payload->>'publicSummary', '')), '') is distinct from relationship_record.public_summary
       and not private.has_public_field_citation(p_entity_type, p_entity_id, 'public_summary') then
      raise exception 'Relationship summary cannot change without an attached public citation.' using errcode = '22023';
    end if;

    before_record := to_jsonb(relationship_record);
    update public.organization_relationships as updated_record
    set relationship_type = trim(p_payload->>'relationshipType'),
        public_summary = trim(p_payload->>'publicSummary'),
        updated_at = now()
    where id = p_entity_id
    returning to_jsonb(updated_record) into after_record;

  elsif p_entity_type = 'media_asset' then
    select * into media_record
    from public.media_assets
    where id = p_entity_id
      and approval_status = 'approved'
      and publication_status = 'published'
      and (
        organization_id = p_organization_id
        or capability_id in (
          select id from public.capabilities where organization_id = p_organization_id
        )
      )
    for update;
    if media_record.id is null then
      raise exception 'The selected published media asset no longer exists.' using errcode = 'P0002';
    end if;
    if not (p_payload ?& array['altText', 'displayRole']) then
      raise exception 'The media metadata payload is incomplete.' using errcode = '22023';
    end if;

    before_record := to_jsonb(media_record);
    update public.media_assets as updated_record
    set alt_text = nullif(trim(coalesce(p_payload->>'altText', '')), ''),
        display_role = nullif(trim(coalesce(p_payload->>'displayRole', '')), ''),
        updated_at = now()
    where id = p_entity_id
    returning to_jsonb(updated_record) into after_record;
  else
    raise exception 'Unsupported organization dossier child type %.', p_entity_type using errcode = '22023';
  end if;

  -- Locking and advancing the parent makes a direct child correction visible to
  -- any already-staged organization refresh. The refresh publisher takes the
  -- same parent-first lock and must reject its now-stale exact baseline.
  update public.organizations
  set last_reviewed_at = now(),
      updated_at = now()
  where id = p_organization_id;

  insert into public.audit_events (
    actor_id, actor_role, event_type, entity_type, entity_id, summary, metadata
  ) values (
    p_reviewer_id,
    coalesce(auth.jwt()->'app_metadata'->>'role', 'admin'),
    'published_organization_dossier_child_edited',
    p_entity_type,
    p_entity_id,
    'Administrator corrected an existing cited organization dossier record.',
    jsonb_build_object(
      'organization_id', p_organization_id,
      'rationale', trim(p_rationale),
      'before', before_record,
      'after', after_record
    )
  );

  return p_entity_id;
end;
$$;

revoke all on function public.update_published_organization_dossier_child(uuid, text, uuid, uuid, jsonb, text)
from public, anon, authenticated;
grant execute on function public.update_published_organization_dossier_child(uuid, text, uuid, uuid, jsonb, text)
to authenticated;

comment on function public.update_published_organization_dossier_child(uuid, text, uuid, uuid, jsonb, text)
is 'Corrects existing cited participation, funding, relationship, or reviewed media metadata. New claims and records remain research-candidate work.';
