-- Add review-first enrichment candidates without creating another queue.

alter table public.candidate_changes drop constraint if exists candidate_changes_kind_check;
alter table public.candidate_changes add constraint candidate_changes_kind_check
check (candidate_kind = any (array[
  'source_intake'::text,
  'organization_bundle'::text,
  'demand_signal_bundle'::text,
  'program_relationship_bundle'::text,
  'demand_match_bundle'::text,
  'organization_refresh_bundle'::text,
  'demand_refresh_bundle'::text
]));

alter table public.candidate_changes drop constraint if exists candidate_changes_typed_reviewer_rationale_check;
alter table public.candidate_changes add constraint candidate_changes_typed_reviewer_rationale_check
check (
  proposed_record->>'schemaVersion' <> all (array[
    'organization_bundle_v2'::text,
    'demand_signal_bundle_v1'::text,
    'program_relationship_bundle_v1'::text,
    'demand_match_bundle_v1'::text,
    'organization_refresh_bundle_v1'::text,
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
    'organization_bundle_v2', 'demand_signal_bundle_v1', 'program_relationship_bundle_v1',
    'demand_match_bundle_v1', 'organization_refresh_bundle_v1', 'demand_refresh_bundle_v1'
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

create or replace function public.stage_research_candidates_for_review(p_run jsonb, p_candidates jsonb)
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
  is_refresh boolean;
begin
  if jsonb_typeof(p_run) <> 'object' or nullif(p_run->>'client_run_id', '') is null
     or jsonb_typeof(p_candidates) <> 'array' or jsonb_array_length(p_candidates) < 1 then
    raise exception 'A stable run ID and at least one candidate are required.' using errcode = '22023';
  end if;

  insert into public.research_runs (
    run_type, scope, selected_gap, status, started_at, completed_at, agent_version,
    source_queries, counters, validation_results, stop_reason, resume_token
  ) values (
    coalesce(nullif(p_run->>'run_type', ''), 'manual'), coalesce(p_run->'scope', '{}'::jsonb),
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

  for candidate_record in select value from jsonb_array_elements(p_candidates)
  loop
    is_refresh := candidate_record->>'candidate_kind' in ('organization_refresh_bundle', 'demand_refresh_bundle');
    if nullif(candidate_record->>'client_candidate_id', '') is null
       or candidate_record->>'status' <> 'pending'
       or candidate_record->>'candidate_kind' not in (
         'organization_bundle', 'demand_signal_bundle', 'program_relationship_bundle',
         'organization_refresh_bundle', 'demand_refresh_bundle'
       )
       or candidate_record->>'schema_version' is distinct from candidate_record#>>'{proposed_record,schemaVersion}'
       or coalesce(candidate_record#>>'{duplicate_check,status}', '') <> 'clear'
       or (is_refresh and (
         nullif(candidate_record->>'target_entity_id', '') is null
         or jsonb_typeof(candidate_record->'before_record') <> 'object'
         or candidate_record#>>'{proposed_record,targetMatch,entityId}' is distinct from candidate_record->>'target_entity_id'
         or candidate_record#>>'{proposed_record,targetMatch,baselineUpdatedAt}' is null
       )) then
      raise exception 'Candidate % is not review-ready.', coalesce(candidate_record->>'client_candidate_id', '<missing>') using errcode = '22023';
    end if;

    affected_id := null;
    insert into public.candidate_changes (
      research_run_id, client_candidate_id, candidate_kind, schema_version, source_lead_ids,
      target_entity_type, target_entity_id, proposed_record, before_record, field_evidence,
      duplicate_check, confidence, status, staged_at
    ) values (
      run_id, candidate_record->>'client_candidate_id', candidate_record->>'candidate_kind',
      candidate_record->>'schema_version',
      array(select jsonb_array_elements_text(coalesce(candidate_record->'source_lead_ids', '[]'::jsonb))),
      candidate_record->>'target_entity_type', nullif(candidate_record->>'target_entity_id', '')::uuid,
      candidate_record->'proposed_record', candidate_record->'before_record',
      coalesce(candidate_record->'field_evidence', '[]'::jsonb),
      coalesce(candidate_record->'duplicate_check', '{}'::jsonb), candidate_record->>'confidence',
      'pending', coalesce(nullif(candidate_record->>'staged_at', '')::timestamptz, now())
    ) on conflict (client_candidate_id) do update set
      research_run_id = excluded.research_run_id, candidate_kind = excluded.candidate_kind,
      schema_version = excluded.schema_version, source_lead_ids = excluded.source_lead_ids,
      target_entity_type = excluded.target_entity_type, target_entity_id = excluded.target_entity_id,
      proposed_record = excluded.proposed_record, before_record = excluded.before_record,
      field_evidence = excluded.field_evidence, duplicate_check = excluded.duplicate_check,
      confidence = excluded.confidence, staged_at = excluded.staged_at, updated_at = now()
    where public.candidate_changes.status = 'pending'
    returning id into affected_id;

    if affected_id is null then skipped := skipped + 1; else staged := staged + 1; end if;
  end loop;

  insert into public.audit_events (actor_id, actor_role, event_type, entity_type, entity_id, summary, metadata)
  values (null, 'research_worker', 'research_candidates_staged', 'research_run', run_id,
    'Validated research candidates were added directly to the review workflow.',
    jsonb_build_object('client_run_id', p_run->>'client_run_id', 'staged_count', staged, 'skipped_count', skipped, 'publication_changed', false));

  staged_count := staged; skipped_count := skipped; research_run_id := run_id; return next;
end;
$$;

revoke all on function public.stage_research_candidates_for_review(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.stage_research_candidates_for_review(jsonb, jsonb) to service_role;

alter function public.publish_reviewed_research_candidates(uuid[], uuid)
rename to publish_reviewed_new_research_candidates;

revoke all on function public.publish_reviewed_new_research_candidates(uuid[], uuid) from public, anon, authenticated;
grant execute on function public.publish_reviewed_new_research_candidates(uuid[], uuid) to authenticated;

create or replace function public.publish_reviewed_refresh_candidates(p_candidate_ids uuid[], p_reviewer_id uuid)
returns table(candidate_id uuid, entity_type text, entity_id uuid, entity_slug text)
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $$
declare
  candidate_row public.candidate_changes%rowtype;
  record jsonb;
  operation_record jsonb;
  source_record jsonb;
  evidence_record jsonb;
  evidence_id_value text;
  source_map jsonb := '{}'::jsonb;
  evidence_map jsonb := '{}'::jsonb;
  target_updated_at timestamptz;
  affected_entity_id uuid;
  new_child_id uuid;
  source_id uuid;
  evidence_id uuid;
  field_name text;
  published_on timestamptz := now();
begin
  if not private.is_atlas_staff() or auth.uid() is distinct from p_reviewer_id then
    raise exception 'Publication requires the authenticated atlas reviewer.' using errcode = '42501';
  end if;
  if p_candidate_ids is null or cardinality(p_candidate_ids) < 1 or cardinality(p_candidate_ids) > 50 then
    raise exception 'Select between one and fifty approved refresh candidates.' using errcode = '22023';
  end if;

  for candidate_row in
    select * from public.candidate_changes
    where id = any(p_candidate_ids)
      and status = 'approved'
      and candidate_kind in ('organization_refresh_bundle', 'demand_refresh_bundle')
      and proposed_record->>'schemaVersion' in ('organization_refresh_bundle_v1', 'demand_refresh_bundle_v1')
      and coalesce(duplicate_check->>'status', '') = 'clear'
    order by created_at, id for update
  loop
    record := candidate_row.proposed_record;
    if candidate_row.target_entity_id is null
       or candidate_row.target_entity_id::text is distinct from record#>>'{targetMatch,entityId}'
       or candidate_row.before_record is distinct from record->'beforeRecord' then
      raise exception 'Refresh candidate % has inconsistent target or baseline data.', candidate_row.id using errcode = '22023';
    end if;

    if candidate_row.candidate_kind = 'organization_refresh_bundle' then
      select updated_at into target_updated_at from public.organizations where id = candidate_row.target_entity_id for update;
    else
      select updated_at into target_updated_at from public.demand_sources where id = candidate_row.target_entity_id for update;
    end if;
    if target_updated_at is null then raise exception 'Refresh target for % no longer exists.', candidate_row.id using errcode = 'P0002'; end if;
    if target_updated_at is distinct from (record#>>'{targetMatch,baselineUpdatedAt}')::timestamptz then
      raise exception 'Refresh candidate % has a stale baseline.', candidate_row.id using errcode = '40001';
    end if;

    source_map := '{}'::jsonb; evidence_map := '{}'::jsonb;
    for source_record in select value from jsonb_array_elements(coalesce(record->'sources', '[]'::jsonb)) loop
      insert into public.sources (title, canonical_url, publisher, source_type, visibility, published_at, accessed_at, public_approved, notes)
      values (source_record->>'title', source_record->>'url', source_record->>'publisher', source_record->>'sourceKind', 'public',
        nullif(source_record->>'publishedAt', '')::timestamptz, (source_record->>'accessedAt')::timestamptz, true,
        concat('Refresh candidate ', candidate_row.id, ': ', source_record->>'summary'))
      on conflict (canonical_url) where canonical_url is not null do update set
        title = excluded.title, publisher = excluded.publisher, source_type = excluded.source_type,
        accessed_at = greatest(public.sources.accessed_at, excluded.accessed_at), public_approved = true
      returning id into source_id;
      source_map := source_map || jsonb_build_object(source_record->>'id', source_id::text);
    end loop;

    for evidence_record in select value from jsonb_array_elements(coalesce(record->'fieldEvidence', '[]'::jsonb)) loop
      source_id := nullif(source_map->>coalesce(evidence_record->>'sourceId', ''), '')::uuid;
      if source_id is null then raise exception 'Refresh evidence % has no source.', evidence_record->>'id' using errcode = '22023'; end if;
      insert into public.evidence_snippets (source_id, excerpt, source_locator, visibility, public_approved, extracted_at)
      values (source_id, evidence_record->>'excerpt', evidence_record->>'fieldPath', 'public', true, published_on)
      returning id into evidence_id;
      evidence_map := evidence_map || jsonb_build_object(evidence_record->>'id', evidence_id::text);
    end loop;

    for operation_record in select value from jsonb_array_elements(coalesce(record->'operations', '[]'::jsonb)) loop
      affected_entity_id := null; new_child_id := null;
      if operation_record->>'operation' = 'set_field' and operation_record->>'entityType' = 'organization' then
        if operation_record->>'targetId' <> candidate_row.target_entity_id::text or operation_record->>'field' not in ('name','legal_name','description','website_url','organization_categories','disclosed_financing_summary','defence_posture','dual_use_posture','profile_data') then
          raise exception 'Unsafe organization field operation in candidate %.', candidate_row.id using errcode = '22023';
        end if;
        update public.organizations set
          name = case when operation_record->>'field' = 'name' then operation_record#>>'{after}' else name end,
          legal_name = case when operation_record->>'field' = 'legal_name' then operation_record#>>'{after}' else legal_name end,
          description = case when operation_record->>'field' = 'description' then operation_record#>>'{after}' else description end,
          website_url = case when operation_record->>'field' = 'website_url' then operation_record#>>'{after}' else website_url end,
          organization_categories = case when operation_record->>'field' = 'organization_categories' then array(select jsonb_array_elements_text(operation_record->'after')) else organization_categories end,
          disclosed_financing_summary = case when operation_record->>'field' = 'disclosed_financing_summary' then operation_record#>>'{after}' else disclosed_financing_summary end,
          defence_posture = case when operation_record->>'field' = 'defence_posture' then operation_record#>>'{after}' else defence_posture end,
          dual_use_posture = case when operation_record->>'field' = 'dual_use_posture' then operation_record#>>'{after}' else dual_use_posture end,
          profile_data = case when operation_record->>'field' = 'profile_data' then operation_record->'after' else profile_data end,
          source_confidence = candidate_row.confidence, freshness_status = 'current', last_reviewed_at = published_on
        where id = candidate_row.target_entity_id;
        affected_entity_id := candidate_row.target_entity_id;
      elsif operation_record->>'operation' = 'set_field' and operation_record->>'entityType' = 'demand_source' then
        if operation_record->>'targetId' <> candidate_row.target_entity_id::text or operation_record->>'field' not in ('title','summary','published_on','classification_label') then
          raise exception 'Unsafe demand field operation in candidate %.', candidate_row.id using errcode = '22023';
        end if;
        update public.demand_sources set
          title = case when operation_record->>'field' = 'title' then operation_record#>>'{after}' else title end,
          summary = case when operation_record->>'field' = 'summary' then operation_record#>>'{after}' else summary end,
          published_on = case when operation_record->>'field' = 'published_on' then nullif(operation_record#>>'{after}', '')::date else published_on end,
          classification_label = case when operation_record->>'field' = 'classification_label' then operation_record#>>'{after}' else classification_label end
        where id = candidate_row.target_entity_id;
        affected_entity_id := candidate_row.target_entity_id;
      elsif operation_record->>'operation' = 'add_child' and operation_record->>'entityType' = 'capability' then
        if operation_record->>'parentId' <> candidate_row.target_entity_id::text then raise exception 'Capability parent mismatch.' using errcode = '22023'; end if;
        insert into public.capabilities (organization_id, slug, name, summary, capability_type, core_features, defence_applications, technical_tags, publication_status, source_confidence, last_reviewed_at, published_at)
        values (candidate_row.target_entity_id, operation_record#>>'{value,slug}', operation_record#>>'{value,name}', operation_record#>>'{value,summary}', operation_record#>>'{value,capabilityType}',
          array(select jsonb_array_elements_text(coalesce(operation_record#>'{value,features}', '[]'::jsonb))),
          array(select jsonb_array_elements_text(coalesce(operation_record#>'{value,applications}', '[]'::jsonb))),
          array(select jsonb_array_elements_text(coalesce(operation_record#>'{value,technicalTags}', '[]'::jsonb))),
          'published', candidate_row.confidence, published_on, published_on)
        returning id into new_child_id;
        insert into public.capability_domains (capability_id, technical_domain_id, is_primary, publication_status)
        select new_child_id, domain.id, row_number() over () = 1, 'published'
        from jsonb_array_elements_text(coalesce(operation_record#>'{value,technicalDomainSlugs}', '[]'::jsonb)) slug_value
        join public.technical_domains domain on domain.slug = slug_value;
        affected_entity_id := new_child_id;
      elsif operation_record->>'operation' = 'add_child' and operation_record->>'entityType' = 'program' then
        insert into public.programs (slug, name, program_type, operator_name, website_url, summary, publication_status)
        values (operation_record#>>'{value,slug}', operation_record#>>'{value,name}', operation_record#>>'{value,programType}', operation_record#>>'{value,operatorName}', operation_record#>>'{value,websiteUrl}', operation_record#>>'{value,summary}', 'published')
        returning id into new_child_id;
        insert into public.program_participations (organization_id, program_id, participation_type, cohort_label, publication_status)
        values (candidate_row.target_entity_id, new_child_id, coalesce(operation_record#>>'{value,participationType}', 'participant'), operation_record#>>'{value,cohortLabel}', 'published');
        affected_entity_id := new_child_id;
      elsif operation_record->>'operation' = 'add_child' and operation_record->>'entityType' = 'relationship' then
        insert into public.organization_relationships (organization_id, related_organization_name, relationship_type, public_summary, publication_status)
        values (candidate_row.target_entity_id, operation_record#>>'{value,relatedOrganizationName}', operation_record#>>'{value,relationshipType}', operation_record#>>'{value,publicSummary}', 'published')
        returning id into new_child_id;
        affected_entity_id := new_child_id;
      elsif operation_record->>'operation' = 'add_child' and operation_record->>'entityType' = 'demand_requirement' then
        insert into public.demand_requirements (demand_source_id, slug, title, problem_statement, desired_end_state, public_caveat, display_order, publication_status)
        values (candidate_row.target_entity_id, operation_record#>>'{value,slug}', operation_record#>>'{value,title}', operation_record#>>'{value,problemStatement}', operation_record#>>'{value,desiredEndState}', operation_record#>>'{value,publicCaveat}', coalesce(nullif(operation_record#>>'{value,displayOrder}', '')::smallint, 0), 'published')
        returning id into new_child_id;
        affected_entity_id := new_child_id;
      elsif operation_record->>'operation' = 'update_child' and operation_record->>'entityType' = 'capability' then
        update public.capabilities set name = operation_record#>>'{after,name}', summary = operation_record#>>'{after,summary}', capability_type = operation_record#>>'{after,capabilityType}',
          core_features = array(select jsonb_array_elements_text(coalesce(operation_record#>'{after,features}', '[]'::jsonb))),
          defence_applications = array(select jsonb_array_elements_text(coalesce(operation_record#>'{after,applications}', '[]'::jsonb))),
          technical_tags = array(select jsonb_array_elements_text(coalesce(operation_record#>'{after,technicalTags}', '[]'::jsonb))),
          source_confidence = candidate_row.confidence, last_reviewed_at = published_on
        where id = (operation_record->>'targetId')::uuid and organization_id = candidate_row.target_entity_id;
        if not found then raise exception 'Capability refresh target mismatch.' using errcode = '22023'; end if;
        affected_entity_id := (operation_record->>'targetId')::uuid;
      elsif operation_record->>'operation' = 'update_child' and operation_record->>'entityType' = 'demand_requirement' then
        update public.demand_requirements set title = operation_record#>>'{after,title}', problem_statement = operation_record#>>'{after,problemStatement}', desired_end_state = operation_record#>>'{after,desiredEndState}', public_caveat = operation_record#>>'{after,publicCaveat}'
        where id = (operation_record->>'targetId')::uuid and demand_source_id = candidate_row.target_entity_id;
        if not found then raise exception 'Demand requirement refresh target mismatch.' using errcode = '22023'; end if;
        affected_entity_id := (operation_record->>'targetId')::uuid;
      else
        raise exception 'Unsupported refresh operation in candidate %.', candidate_row.id using errcode = '22023';
      end if;

      field_name := coalesce(operation_record->>'field', operation_record->>'operation');
      for evidence_id_value in select jsonb_array_elements_text(operation_record->'evidenceIds') loop
        evidence_id := nullif(evidence_map->>evidence_id_value, '')::uuid;
        if evidence_id is null then raise exception 'Operation evidence % is missing.', evidence_id_value using errcode = '22023'; end if;
        insert into public.field_citations (entity_type, entity_id, field_name, evidence_snippet_id)
        values (operation_record->>'entityType', affected_entity_id, field_name, evidence_id)
        on conflict do nothing;
      end loop;
    end loop;

    if candidate_row.candidate_kind = 'organization_refresh_bundle' then
      update public.organizations set freshness_status = 'current', last_reviewed_at = published_on where id = candidate_row.target_entity_id;
    else
      update public.demand_sources set summary = summary where id = candidate_row.target_entity_id;
    end if;

    update public.candidate_changes set status = 'published', published_entity_id = candidate_row.target_entity_id,
      published_at = published_on, updated_at = published_on
    where id = candidate_row.id;

    insert into public.audit_events (actor_id, actor_role, event_type, entity_type, entity_id, summary, metadata)
    values (p_reviewer_id, 'reviewer', 'research_refresh_published', candidate_row.target_entity_type,
      candidate_row.target_entity_id, 'Published an explicitly reviewed additive record refresh.',
      jsonb_build_object('candidate_id', candidate_row.id, 'before', candidate_row.before_record, 'operations', record->'operations', 'publication_changed', true));

    candidate_id := candidate_row.id; entity_type := candidate_row.target_entity_type;
    entity_id := candidate_row.target_entity_id; entity_slug := record#>>'{targetMatch,slug}'; return next;
  end loop;

  if not found then raise exception 'No approved refresh candidates were eligible.' using errcode = '22023'; end if;
end;
$$;

revoke all on function public.publish_reviewed_refresh_candidates(uuid[], uuid) from public, anon, authenticated;
grant execute on function public.publish_reviewed_refresh_candidates(uuid[], uuid) to authenticated;

create or replace function public.publish_reviewed_research_candidates(p_candidate_ids uuid[], p_reviewer_id uuid)
returns table(candidate_id uuid, entity_type text, entity_id uuid, entity_slug text)
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $$
declare new_ids uuid[]; refresh_ids uuid[]; selected_count integer;
begin
  select count(distinct item),
    array_agg(item) filter (where candidate_kind in ('organization_bundle','demand_signal_bundle')),
    array_agg(item) filter (where candidate_kind in ('organization_refresh_bundle','demand_refresh_bundle'))
  into selected_count, new_ids, refresh_ids
  from unnest(p_candidate_ids) item join public.candidate_changes candidate on candidate.id = item;
  if selected_count <> cardinality(p_candidate_ids) then raise exception 'Candidate selection contains invalid or duplicate identifiers.' using errcode = '22023'; end if;
  if coalesce(cardinality(new_ids), 0) > 0 then return query select * from public.publish_reviewed_new_research_candidates(new_ids, p_reviewer_id); end if;
  if coalesce(cardinality(refresh_ids), 0) > 0 then return query select * from public.publish_reviewed_refresh_candidates(refresh_ids, p_reviewer_id); end if;
end;
$$;

revoke all on function public.publish_reviewed_research_candidates(uuid[], uuid) from public, anon, authenticated;
grant execute on function public.publish_reviewed_research_candidates(uuid[], uuid) to authenticated;

comment on function public.publish_reviewed_refresh_candidates(uuid[], uuid)
is 'Authenticated atomic publication of explicitly reviewed additive refresh operations with stale-baseline protection and append-only evidence.';
