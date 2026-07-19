-- Connect a validated autonomous research result directly to the existing
-- candidate review and human publication workflow. Research runs remain audit
-- metadata; they are not a separate reviewer queue or approval step.

alter table public.research_runs
  add constraint research_runs_resume_token_unique unique (resume_token);

alter table public.candidate_changes
  add column client_candidate_id text,
  add constraint candidate_changes_client_candidate_id_unique unique (client_candidate_id);

alter table public.programs
  add column summary text;

comment on column public.research_runs.resume_token
is 'Stable research artifact run ID used for idempotent trusted review intake; not a reviewer-facing workflow step.';
comment on column public.candidate_changes.client_candidate_id
is 'Stable candidate artifact ID used to prevent duplicate review cards when a run is retried.';
comment on column public.programs.summary
is 'Reviewed public summary of a program operated by or associated with an organization.';

create or replace function public.stage_research_candidates_for_review(
  p_run jsonb,
  p_candidates jsonb
)
returns table(staged_count integer, skipped_count integer, research_run_id uuid)
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  run_id uuid;
  candidate_record jsonb;
  affected_id uuid;
  staged integer := 0;
  skipped integer := 0;
begin
  if jsonb_typeof(p_run) <> 'object'
     or nullif(p_run->>'client_run_id', '') is null
     or jsonb_typeof(p_candidates) <> 'array'
     or jsonb_array_length(p_candidates) < 1 then
    raise exception 'A stable run ID and at least one candidate are required.' using errcode = '22023';
  end if;

  insert into public.research_runs (
    run_type, scope, selected_gap, status, started_at, completed_at,
    agent_version, source_queries, counters, validation_results, stop_reason,
    resume_token
  ) values (
    coalesce(nullif(p_run->>'run_type', ''), 'manual'),
    coalesce(p_run->'scope', '{}'::jsonb),
    p_run->'selected_gap',
    'completed',
    nullif(p_run->>'started_at', '')::timestamptz,
    coalesce(nullif(p_run->>'completed_at', '')::timestamptz, now()),
    p_run->>'agent_version',
    coalesce(p_run->'source_queries', '[]'::jsonb),
    coalesce(p_run->'counters', '{}'::jsonb),
    coalesce(p_run->'validation_results', '{}'::jsonb),
    p_run->>'stop_reason',
    p_run->>'client_run_id'
  )
  on conflict (resume_token) do update
  set scope = excluded.scope,
      selected_gap = excluded.selected_gap,
      status = 'completed',
      started_at = excluded.started_at,
      completed_at = excluded.completed_at,
      agent_version = excluded.agent_version,
      source_queries = excluded.source_queries,
      counters = excluded.counters,
      validation_results = excluded.validation_results,
      stop_reason = excluded.stop_reason
  returning id into run_id;

  for candidate_record in select value from jsonb_array_elements(p_candidates)
  loop
    if nullif(candidate_record->>'client_candidate_id', '') is null
       or candidate_record->>'status' <> 'pending'
       or candidate_record->>'candidate_kind' not in (
         'organization_bundle', 'demand_signal_bundle', 'program_relationship_bundle'
       )
       or candidate_record->>'schema_version' is distinct from candidate_record#>>'{proposed_record,schemaVersion}'
       or coalesce(candidate_record#>>'{duplicate_check,status}', '') <> 'clear' then
      raise exception 'Candidate % is not review-ready.', coalesce(candidate_record->>'client_candidate_id', '<missing>') using errcode = '22023';
    end if;

    affected_id := null;
    insert into public.candidate_changes (
      research_run_id, client_candidate_id, candidate_kind, schema_version,
      source_lead_ids, target_entity_type, target_entity_id, proposed_record,
      before_record, field_evidence, duplicate_check, confidence, status,
      staged_at
    ) values (
      run_id,
      candidate_record->>'client_candidate_id',
      candidate_record->>'candidate_kind',
      candidate_record->>'schema_version',
      array(select jsonb_array_elements_text(coalesce(candidate_record->'source_lead_ids', '[]'::jsonb))),
      candidate_record->>'target_entity_type',
      nullif(candidate_record->>'target_entity_id', '')::uuid,
      candidate_record->'proposed_record',
      candidate_record->'before_record',
      coalesce(candidate_record->'field_evidence', '[]'::jsonb),
      coalesce(candidate_record->'duplicate_check', '{}'::jsonb),
      candidate_record->>'confidence',
      'pending',
      coalesce(nullif(candidate_record->>'staged_at', '')::timestamptz, now())
    )
    on conflict (client_candidate_id) do update
    set research_run_id = excluded.research_run_id,
        candidate_kind = excluded.candidate_kind,
        schema_version = excluded.schema_version,
        source_lead_ids = excluded.source_lead_ids,
        target_entity_type = excluded.target_entity_type,
        proposed_record = excluded.proposed_record,
        field_evidence = excluded.field_evidence,
        duplicate_check = excluded.duplicate_check,
        confidence = excluded.confidence,
        staged_at = excluded.staged_at,
        updated_at = now()
    where public.candidate_changes.status = 'pending'
    returning id into affected_id;

    if affected_id is null then skipped := skipped + 1;
    else staged := staged + 1;
    end if;
  end loop;

  insert into public.audit_events (
    actor_id, actor_role, event_type, entity_type, entity_id, summary, metadata
  ) values (
    null, 'research_worker', 'research_candidates_staged', 'research_run', run_id,
    'Validated research candidates were added directly to the review workflow.',
    jsonb_build_object('client_run_id', p_run->>'client_run_id', 'staged_count', staged, 'skipped_count', skipped, 'publication_changed', false)
  );

  staged_count := staged;
  skipped_count := skipped;
  research_run_id := run_id;
  return next;
end;
$$;

revoke all on function public.stage_research_candidates_for_review(jsonb, jsonb)
from public, anon, authenticated;
grant execute on function public.stage_research_candidates_for_review(jsonb, jsonb)
to service_role;

comment on function public.stage_research_candidates_for_review(jsonb, jsonb)
is 'Trusted, idempotent intake from validated research artifacts directly into private candidate review. It cannot approve or publish.';

create or replace function public.publish_reviewed_organization_candidates(
  p_candidate_ids uuid[],
  p_reviewer_id uuid
)
returns table(candidate_id uuid, organization_id uuid, organization_slug text)
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $$
declare
  candidate_row public.candidate_changes%rowtype;
  record jsonb;
  organization_record jsonb;
  capability_record jsonb;
  program_record jsonb;
  relationship_record jsonb;
  source_record jsonb;
  evidence_record jsonb;
  mission_record jsonb;
  legacy_ids uuid[];
  selected_count integer;
  new_organization_id uuid;
  new_location_id uuid;
  new_capability_id uuid;
  new_program_id uuid;
  new_relationship_id uuid;
  new_source_id uuid;
  new_evidence_id uuid;
  new_mission_match_id uuid;
  domain_id uuid;
  mission_area_id uuid;
  domain_slug text;
  source_map jsonb := '{}'::jsonb;
  capability_map jsonb := '{}'::jsonb;
  program_map jsonb := '{}'::jsonb;
  relationship_map jsonb := '{}'::jsonb;
  mission_map jsonb := '{}'::jsonb;
  source_key text;
  field_path text;
  entity_key text;
  evidence_entity_id uuid;
  evidence_entity_type text;
  evidence_field_name text;
  relationship_index bigint;
  mission_index bigint;
  published_on timestamptz := now();
begin
  if not private.is_atlas_staff() or auth.uid() is distinct from p_reviewer_id then
    raise exception 'Publication requires the authenticated atlas reviewer.' using errcode = '42501';
  end if;

  if p_candidate_ids is null or cardinality(p_candidate_ids) < 1 or cardinality(p_candidate_ids) > 50 then
    raise exception 'Select between one and fifty approved candidates.' using errcode = '22023';
  end if;

  select count(distinct candidate_value) into selected_count
  from unnest(p_candidate_ids) as candidate_value;
  if selected_count <> cardinality(p_candidate_ids) then
    raise exception 'Candidate selection contains duplicate identifiers.' using errcode = '22023';
  end if;

  select count(*) into selected_count
  from public.candidate_changes
  where id = any(p_candidate_ids)
    and status = 'approved'
    and candidate_kind = 'organization_bundle'
    and proposed_record->>'schemaVersion' in ('organization_bundle_v1', 'organization_bundle_v2')
    and coalesce(duplicate_check->>'status', '') in ('clear', 'merged');
  if selected_count <> cardinality(p_candidate_ids) then
    raise exception 'Every selected candidate must be approved, valid, and duplicate-cleared.' using errcode = '22023';
  end if;

  select array_agg(id order by created_at, id) into legacy_ids
  from public.candidate_changes
  where id = any(p_candidate_ids)
    and proposed_record->>'schemaVersion' = 'organization_bundle_v1';

  if coalesce(cardinality(legacy_ids), 0) > 0 then
    return query
    select published.candidate_id, published.organization_id, published.organization_slug
    from public.publish_approved_organization_candidates(legacy_ids, p_reviewer_id) published;
  end if;

  for candidate_row in
    select *
    from public.candidate_changes
    where id = any(p_candidate_ids)
      and proposed_record->>'schemaVersion' = 'organization_bundle_v2'
    order by created_at, id
    for update
  loop
    record := candidate_row.proposed_record;
    organization_record := record->'organization';
    source_map := '{}'::jsonb;
    capability_map := '{}'::jsonb;
    program_map := '{}'::jsonb;
    relationship_map := '{}'::jsonb;
    mission_map := '{}'::jsonb;

    if nullif(organization_record->>'slug', '') is null
       or nullif(organization_record->>'name', '') is null
       or nullif(organization_record->>'description', '') is null
       or jsonb_array_length(coalesce(record->'sources', '[]'::jsonb)) < 1
       or jsonb_array_length(coalesce(record->'fieldEvidence', '[]'::jsonb)) < 1 then
      raise exception 'Typed organization candidate % is incomplete.', candidate_row.id using errcode = '22023';
    end if;
    if exists (select 1 from public.organizations where slug = organization_record->>'slug') then
      raise exception 'Organization slug % already exists.', organization_record->>'slug' using errcode = '23505';
    end if;

    insert into public.organizations (
      slug, name, legal_name, description, website_url, entity_kind,
      organization_categories, profile_data, publication_status,
      source_confidence, freshness_status, last_reviewed_at, published_at
    ) values (
      organization_record->>'slug', organization_record->>'name', organization_record->>'legalName',
      organization_record->>'description', organization_record->>'websiteUrl', organization_record->>'entityKind',
      array(select jsonb_array_elements_text(coalesce(organization_record->'categories', '[]'::jsonb))),
      coalesce(organization_record->'profileData', '{}'::jsonb) || jsonb_build_object(
        'reviewed_candidate_id', candidate_row.id,
        'reviewed_by', p_reviewer_id,
        'research_schema_version', 'organization_bundle_v2'
      ),
      'published', candidate_row.confidence, 'current', published_on, published_on
    ) returning id into new_organization_id;

    insert into public.locations (
      name, city, province_territory, country_code, latitude, longitude, geographic_confidence
    ) values (
      coalesce(
        nullif(concat_ws(', ', organization_record#>>'{primaryLocation,city}', organization_record#>>'{primaryLocation,provinceTerritory}'), ''),
        (organization_record->>'name') || ' primary location'
      ),
      organization_record#>>'{primaryLocation,city}',
      organization_record#>>'{primaryLocation,provinceTerritory}',
      coalesce(organization_record#>>'{primaryLocation,countryCode}', 'CA'),
      nullif(organization_record#>>'{primaryLocation,latitude}', '')::double precision,
      nullif(organization_record#>>'{primaryLocation,longitude}', '')::double precision,
      coalesce(organization_record#>>'{primaryLocation,geographicConfidence}', 'unverified')
    ) returning id into new_location_id;

    insert into public.organization_locations (
      organization_id, location_id, location_role, is_primary, publication_status
    ) values (new_organization_id, new_location_id, 'headquarters', true, 'published');

    insert into public.organization_aliases (organization_id, alias, alias_type, publication_status)
    select new_organization_id, alias_value, 'other', 'published'
    from jsonb_array_elements_text(coalesce(organization_record->'aliases', '[]'::jsonb)) alias_value;

    for capability_record in select value from jsonb_array_elements(coalesce(record->'capabilities', '[]'::jsonb))
    loop
      if exists (select 1 from public.capabilities where slug = capability_record->>'slug') then
        raise exception 'Capability slug % already exists.', capability_record->>'slug' using errcode = '23505';
      end if;
      insert into public.capabilities (
        organization_id, slug, name, summary, capability_type, core_features,
        defence_applications, technical_tags, publication_status, source_confidence,
        last_reviewed_at, published_at
      ) values (
        new_organization_id, capability_record->>'slug', capability_record->>'name',
        capability_record->>'summary', capability_record->>'capabilityType',
        array(select jsonb_array_elements_text(coalesce(capability_record->'features', '[]'::jsonb))),
        array(select jsonb_array_elements_text(coalesce(capability_record->'applications', '[]'::jsonb))),
        array(select jsonb_array_elements_text(coalesce(capability_record->'technicalTags', '[]'::jsonb))),
        'published', candidate_row.confidence, published_on, published_on
      ) returning id into new_capability_id;
      capability_map := capability_map || jsonb_build_object(capability_record->>'slug', new_capability_id::text);

      for domain_slug in select jsonb_array_elements_text(coalesce(capability_record->'technicalDomainSlugs', '[]'::jsonb))
      loop
        select id into domain_id from public.technical_domains
        where slug = domain_slug and publication_status = 'published';
        if domain_id is null then
          raise exception 'Unknown technical domain %.', domain_slug using errcode = '22023';
        end if;
        insert into public.capability_domains (capability_id, technical_domain_id, is_primary, publication_status)
        values (
          new_capability_id, domain_id,
          domain_slug = capability_record#>>'{technicalDomainSlugs,0}', 'published'
        ) on conflict (capability_id, technical_domain_id) do nothing;
      end loop;

      for mission_record, mission_index in
        select value, ordinality - 1
        from jsonb_array_elements(coalesce(capability_record->'missionMatches', '[]'::jsonb)) with ordinality
      loop
        select id into mission_area_id from public.mission_areas
        where slug = mission_record->>'missionAreaSlug' and publication_status = 'published';
        if mission_area_id is null then
          raise exception 'Unknown mission area %.', mission_record->>'missionAreaSlug' using errcode = '22023';
        end if;
        insert into public.capability_mission_matches (
          capability_id, mission_area_id, alignment_summary, match_type,
          confidence, review_status, publication_status
        ) values (
          new_capability_id, mission_area_id, mission_record->>'alignmentSummary',
          coalesce(mission_record->>'matchClass', 'derived'), mission_record->>'confidence',
          'approved', 'published'
        ) returning id into new_mission_match_id;
        mission_map := mission_map || jsonb_build_object((capability_record->>'slug') || ':' || mission_index::text, new_mission_match_id::text);
      end loop;
    end loop;

    for program_record in select value from jsonb_array_elements(coalesce(record->'programs', '[]'::jsonb))
    loop
      if exists (select 1 from public.programs where slug = program_record->>'slug') then
        raise exception 'Program slug % already exists.', program_record->>'slug' using errcode = '23505';
      end if;
      insert into public.programs (
        slug, name, program_type, operator_name, website_url, summary, publication_status
      ) values (
        program_record->>'slug', program_record->>'name', program_record->>'programType',
        organization_record->>'name', program_record->>'websiteUrl', program_record->>'summary', 'published'
      ) returning id into new_program_id;
      program_map := program_map || jsonb_build_object(program_record->>'slug', new_program_id::text);
      insert into public.program_participations (
        organization_id, program_id, participation_type, cohort_label, publication_status
      ) values (
        new_organization_id, new_program_id, 'operator', program_record->>'cohortLabel', 'published'
      );
    end loop;

    for relationship_record, relationship_index in
      select value, ordinality - 1
      from jsonb_array_elements(coalesce(record->'relationships', '[]'::jsonb)) with ordinality
    loop
      insert into public.organization_relationships (
        organization_id, related_organization_id, related_organization_name,
        relationship_type, public_summary, publication_status
      ) values (
        new_organization_id,
        (select id from public.organizations where lower(name) = lower(relationship_record->>'relatedOrganizationName') limit 1),
        relationship_record->>'relatedOrganizationName', relationship_record->>'relationshipType',
        relationship_record->>'publicSummary', 'published'
      ) returning id into new_relationship_id;
      relationship_map := relationship_map || jsonb_build_object(relationship_index::text, new_relationship_id::text);
    end loop;

    for source_record in select value from jsonb_array_elements(record->'sources')
    loop
      insert into public.sources (
        title, canonical_url, publisher, source_type, visibility, published_at,
        accessed_at, public_approved, notes
      ) values (
        source_record->>'title', source_record->>'url', source_record->>'publisher',
        source_record->>'sourceKind', 'public', nullif(source_record->>'publishedAt', '')::timestamptz,
        coalesce(nullif(source_record->>'accessedAt', '')::timestamptz, published_on), true,
        source_record->>'summary'
      )
      on conflict (canonical_url) where canonical_url is not null do update
      set title = excluded.title,
          publisher = excluded.publisher,
          source_type = excluded.source_type,
          visibility = 'public',
          public_approved = true,
          accessed_at = excluded.accessed_at,
          notes = excluded.notes,
          updated_at = now()
      returning id into new_source_id;
      source_map := source_map || jsonb_build_object(source_record->>'id', new_source_id::text);
    end loop;

    for evidence_record in select value from jsonb_array_elements(record->'fieldEvidence')
    loop
      source_key := evidence_record->>'sourceId';
      if nullif(source_map->>source_key, '') is null then
        raise exception 'Evidence references missing source %.', source_key using errcode = '22023';
      end if;
      insert into public.evidence_snippets (
        source_id, excerpt, source_locator, visibility, public_approved, extracted_at
      ) values (
        (source_map->>source_key)::uuid, evidence_record->>'excerpt', evidence_record->>'fieldPath',
        'public', true, published_on
      ) returning id into new_evidence_id;

      field_path := evidence_record->>'fieldPath';
      evidence_entity_id := null;
      evidence_entity_type := null;
      evidence_field_name := null;
      if field_path = 'organization.description' then
        evidence_entity_id := new_organization_id;
        evidence_entity_type := 'organization';
        evidence_field_name := 'description';
      elsif field_path like 'organization.profileData.%' then
        evidence_entity_id := new_organization_id;
        evidence_entity_type := 'organization';
        evidence_field_name := replace(field_path, 'organization.', '');
      elsif field_path like 'capabilities.%.summary' then
        entity_key := split_part(field_path, '.', 2);
        evidence_entity_id := nullif(capability_map->>entity_key, '')::uuid;
        evidence_entity_type := 'capability';
        evidence_field_name := 'summary';
      elsif field_path like 'capabilities.%.missionMatches.%.alignmentSummary' then
        entity_key := split_part(field_path, '.', 2) || ':' || split_part(field_path, '.', 4);
        evidence_entity_id := nullif(mission_map->>entity_key, '')::uuid;
        evidence_entity_type := 'capability_mission_match';
        evidence_field_name := 'alignment_summary';
      elsif field_path like 'programs.%.summary' then
        entity_key := split_part(field_path, '.', 2);
        evidence_entity_id := nullif(program_map->>entity_key, '')::uuid;
        evidence_entity_type := 'program';
        evidence_field_name := 'summary';
      elsif field_path like 'relationships.%.publicSummary' then
        entity_key := split_part(field_path, '.', 2);
        evidence_entity_id := nullif(relationship_map->>entity_key, '')::uuid;
        evidence_entity_type := 'organization_relationship';
        evidence_field_name := 'public_summary';
      end if;

      if evidence_entity_id is not null then
        insert into public.field_citations (entity_type, entity_id, field_name, evidence_snippet_id)
        values (evidence_entity_type, evidence_entity_id, evidence_field_name, new_evidence_id);
      end if;
    end loop;

    if not exists (
      select 1 from public.field_citations
      where entity_type = 'organization' and entity_id = new_organization_id and field_name = 'description'
    ) then
      raise exception 'Typed organization candidate % lacks public description evidence.', candidate_row.id using errcode = '22023';
    end if;

    update public.candidate_changes
    set status = 'published', target_entity_type = 'organization', target_entity_id = new_organization_id,
        published_entity_id = new_organization_id, published_at = published_on, updated_at = published_on
    where id = candidate_row.id;

    insert into public.audit_events (
      actor_id, actor_role, event_type, entity_type, entity_id, summary, metadata
    ) values (
      p_reviewer_id, coalesce(auth.jwt()->'app_metadata'->>'role', 'reviewer'),
      'candidate_published', 'organization', new_organization_id,
      'Reviewer published an approved typed organization dossier.',
      jsonb_build_object('candidate_id', candidate_row.id, 'schema_version', 'organization_bundle_v2')
    );

    candidate_id := candidate_row.id;
    organization_id := new_organization_id;
    organization_slug := organization_record->>'slug';
    return next;
  end loop;
end;
$$;

revoke all on function public.publish_reviewed_organization_candidates(uuid[], uuid)
from public, anon, authenticated;
grant execute on function public.publish_reviewed_organization_candidates(uuid[], uuid)
to authenticated;

comment on function public.publish_reviewed_organization_candidates(uuid[], uuid)
is 'Atomically publishes approved legacy or typed organization candidates after one explicit authenticated reviewer action.';
