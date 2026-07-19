-- Make the research-generated reviewer rationale a durable queue field and
-- extend the existing human publication checkpoint to public demand signals.

alter table public.candidate_changes
  add column reviewer_rationale text;

update public.candidate_changes
set proposed_record = jsonb_set(
      proposed_record,
      '{reviewerRationale}',
      to_jsonb(
        format(
          'Review this %s because it was produced as a source-backed True North Map coverage candidate. Verify its classification, duplicate status, mapped claims, and field evidence before deciding whether it is worthy of inclusion in the map.',
          coalesce(
            proposed_record#>>'{organization,name}',
            proposed_record#>>'{demandSource,title}',
            proposed_record#>>'{program,name}',
            replace(candidate_kind, '_', ' ')
          )
        )
      ),
      true
    ),
    reviewer_rationale = format(
      'Review this %s because it was produced as a source-backed True North Map coverage candidate. Verify its classification, duplicate status, mapped claims, and field evidence before deciding whether it is worthy of inclusion in the map.',
      coalesce(
        proposed_record#>>'{organization,name}',
        proposed_record#>>'{demandSource,title}',
        proposed_record#>>'{program,name}',
        replace(candidate_kind, '_', ' ')
      )
    )
where proposed_record->>'schemaVersion' in (
  'organization_bundle_v2',
  'demand_signal_bundle_v1',
  'program_relationship_bundle_v1'
);

alter table public.candidate_changes
  add constraint candidate_changes_typed_reviewer_rationale_check
  check (
    proposed_record->>'schemaVersion' not in (
      'organization_bundle_v2',
      'demand_signal_bundle_v1',
      'program_relationship_bundle_v1'
    )
    or length(trim(coalesce(reviewer_rationale, ''))) between 80 and 2000
  );

comment on column public.candidate_changes.reviewer_rationale
is 'Agent-generated inclusion rationale shown to the reviewer and editable as the starting point for the human decision rationale.';

create or replace function private.sync_typed_candidate_reviewer_rationale()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  generated_rationale text;
begin
  if new.proposed_record->>'schemaVersion' in (
    'organization_bundle_v2',
    'demand_signal_bundle_v1',
    'program_relationship_bundle_v1'
  ) then
    generated_rationale := nullif(trim(new.proposed_record->>'reviewerRationale'), '');
    if generated_rationale is null or length(generated_rationale) < 80 or length(generated_rationale) > 2000 then
      raise exception 'Typed research candidates require an 80-2000 character reviewer rationale.' using errcode = '22023';
    end if;
    new.reviewer_rationale := generated_rationale;
  end if;
  return new;
end;
$$;

create trigger candidate_changes_sync_reviewer_rationale
before insert or update of proposed_record, reviewer_rationale
on public.candidate_changes
for each row execute function private.sync_typed_candidate_reviewer_rationale();

revoke all on function private.sync_typed_candidate_reviewer_rationale()
from public, anon, authenticated;

create or replace function public.publish_reviewed_research_candidates(
  p_candidate_ids uuid[],
  p_reviewer_id uuid
)
returns table(candidate_id uuid, entity_type text, entity_id uuid, entity_slug text)
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $$
declare
  candidate_row public.candidate_changes%rowtype;
  organization_result record;
  record jsonb;
  source_record jsonb;
  issuer_record jsonb;
  requirement_record jsonb;
  evidence_record jsonb;
  organization_ids uuid[];
  demand_ids uuid[];
  selected_count integer;
  new_source_id uuid;
  new_demand_source_id uuid;
  new_requirement_id uuid;
  new_evidence_id uuid;
  source_map jsonb;
  requirement_map jsonb;
  source_key text;
  requirement_key text;
  field_path text;
  requirement_index bigint;
  primary_source_id uuid;
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
    and (
      (
        candidate_kind = 'organization_bundle'
        and proposed_record->>'schemaVersion' in ('organization_bundle_v1', 'organization_bundle_v2')
      )
      or (
        candidate_kind = 'demand_signal_bundle'
        and proposed_record->>'schemaVersion' = 'demand_signal_bundle_v1'
      )
    )
    and coalesce(duplicate_check->>'status', '') in ('clear', 'merged');
  if selected_count <> cardinality(p_candidate_ids) then
    raise exception 'Every selected candidate must be approved, supported, and duplicate-cleared.' using errcode = '22023';
  end if;

  select array_agg(id order by created_at, id) into organization_ids
  from public.candidate_changes
  where id = any(p_candidate_ids) and candidate_kind = 'organization_bundle';

  if coalesce(cardinality(organization_ids), 0) > 0 then
    for organization_result in
      select * from public.publish_reviewed_organization_candidates(organization_ids, p_reviewer_id)
    loop
      candidate_id := organization_result.candidate_id;
      entity_type := 'organization';
      entity_id := organization_result.organization_id;
      entity_slug := organization_result.organization_slug;
      return next;
    end loop;
  end if;

  select array_agg(id order by created_at, id) into demand_ids
  from public.candidate_changes
  where id = any(p_candidate_ids) and candidate_kind = 'demand_signal_bundle';

  for candidate_row in
    select *
    from public.candidate_changes
    where id = any(coalesce(demand_ids, '{}'::uuid[]))
    order by created_at, id
    for update
  loop
    record := candidate_row.proposed_record;
    source_map := '{}'::jsonb;
    requirement_map := '{}'::jsonb;

    if nullif(record#>>'{demandSource,slug}', '') is null
       or nullif(record#>>'{demandSource,title}', '') is null
       or jsonb_array_length(coalesce(record->'issuers', '[]'::jsonb)) < 1
       or jsonb_array_length(coalesce(record->'requirements', '[]'::jsonb)) < 1
       or jsonb_array_length(coalesce(record->'sources', '[]'::jsonb)) < 1
       or jsonb_array_length(coalesce(record->'fieldEvidence', '[]'::jsonb)) < 2 then
      raise exception 'Demand-signal candidate % is incomplete.', candidate_row.id using errcode = '22023';
    end if;

    if exists (select 1 from public.demand_sources where slug = record#>>'{demandSource,slug}') then
      raise exception 'Demand source slug % already exists.', record#>>'{demandSource,slug}' using errcode = '23505';
    end if;

    if not exists (
      select 1 from jsonb_array_elements(record->'fieldEvidence') evidence
      where evidence->>'fieldPath' = 'demandSource.summary'
    ) then
      raise exception 'Demand source % lacks public summary evidence.', record#>>'{demandSource,slug}' using errcode = '22023';
    end if;

    for requirement_record in select value from jsonb_array_elements(record->'requirements')
    loop
      if exists (select 1 from public.demand_requirements where slug = requirement_record->>'slug') then
        raise exception 'Demand requirement slug % already exists.', requirement_record->>'slug' using errcode = '23505';
      end if;
      if not exists (
        select 1 from jsonb_array_elements(record->'fieldEvidence') evidence
        where evidence->>'fieldPath' = 'requirements.' || (requirement_record->>'slug') || '.problemStatement'
      ) then
        raise exception 'Demand requirement % lacks public problem-statement evidence.', requirement_record->>'slug' using errcode = '22023';
      end if;
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

    primary_source_id := nullif(source_map->>(record#>>'{sources,0,id}'), '')::uuid;
    if primary_source_id is null then
      raise exception 'Demand candidate % has no resolvable primary source.', candidate_row.id using errcode = '22023';
    end if;

    insert into public.demand_sources (
      source_id, slug, title, publisher, published_on, classification_label,
      source_visibility, summary, source_kind, commitment_level, publication_status
    ) values (
      primary_source_id,
      record#>>'{demandSource,slug}',
      record#>>'{demandSource,title}',
      coalesce(record#>>'{sources,0,publisher}', record#>>'{issuers,0,name}'),
      nullif(record#>>'{demandSource,publishedOn}', '')::date,
      record#>>'{demandSource,classificationLabel}',
      'public',
      record#>>'{demandSource,summary}',
      record#>>'{demandSource,sourceKind}',
      record#>>'{demandSource,commitmentLevel}',
      'published'
    ) returning id into new_demand_source_id;

    for issuer_record in select value from jsonb_array_elements(record->'issuers')
    loop
      insert into public.demand_issuers (
        slug, name, issuer_type, jurisdiction, parent_issuer_id, publication_status
      ) values (
        issuer_record->>'slug', issuer_record->>'name', issuer_record->>'issuerType',
        issuer_record->>'jurisdiction', null, 'published'
      )
      on conflict (slug) do update
      set name = excluded.name,
          issuer_type = excluded.issuer_type,
          jurisdiction = excluded.jurisdiction,
          publication_status = 'published',
          updated_at = now();
    end loop;

    for issuer_record in select value from jsonb_array_elements(record->'issuers')
    loop
      if nullif(issuer_record->>'parentIssuerSlug', '') is not null
         and not exists (select 1 from public.demand_issuers where slug = issuer_record->>'parentIssuerSlug') then
        raise exception 'Unknown parent demand issuer %.', issuer_record->>'parentIssuerSlug' using errcode = '22023';
      end if;

      update public.demand_issuers child
      set parent_issuer_id = parent.id,
          updated_at = now()
      from public.demand_issuers parent
      where child.slug = issuer_record->>'slug'
        and parent.slug = issuer_record->>'parentIssuerSlug';

      insert into public.demand_source_issuers (
        demand_source_id, demand_issuer_id, issuer_role, publication_status
      )
      select new_demand_source_id, issuer.id, issuer_record->>'role', 'published'
      from public.demand_issuers issuer
      where issuer.slug = issuer_record->>'slug';
    end loop;

    for requirement_record, requirement_index in
      select value, ordinality
      from jsonb_array_elements(record->'requirements') with ordinality
    loop
      insert into public.demand_requirements (
        demand_source_id, slug, title, problem_statement, desired_end_state,
        public_caveat, display_order, publication_status
      ) values (
        new_demand_source_id,
        requirement_record->>'slug',
        requirement_record->>'title',
        requirement_record->>'problemStatement',
        requirement_record->>'desiredEndState',
        requirement_record->>'publicCaveat',
        requirement_index,
        'published'
      ) returning id into new_requirement_id;
      requirement_map := requirement_map || jsonb_build_object(requirement_record->>'slug', new_requirement_id::text);
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
        (source_map->>source_key)::uuid,
        evidence_record->>'excerpt',
        evidence_record->>'fieldPath',
        'public', true, published_on
      ) returning id into new_evidence_id;

      field_path := evidence_record->>'fieldPath';
      if field_path like 'requirements.%.problemStatement' then
        requirement_key := split_part(field_path, '.', 2);
        new_requirement_id := nullif(requirement_map->>requirement_key, '')::uuid;
        if new_requirement_id is not null then
          insert into public.field_citations (entity_type, entity_id, field_name, evidence_snippet_id)
          values ('demand_requirement', new_requirement_id, 'problem_statement', new_evidence_id);
        end if;
      elsif field_path like 'requirements.%.desiredEndState' then
        requirement_key := split_part(field_path, '.', 2);
        new_requirement_id := nullif(requirement_map->>requirement_key, '')::uuid;
        if new_requirement_id is not null then
          insert into public.field_citations (entity_type, entity_id, field_name, evidence_snippet_id)
          values ('demand_requirement', new_requirement_id, 'desired_end_state', new_evidence_id);
        end if;
      end if;
    end loop;

    update public.candidate_changes
    set status = 'published',
        target_entity_type = 'demand_source',
        target_entity_id = new_demand_source_id,
        published_at = published_on,
        updated_at = published_on
    where id = candidate_row.id;

    insert into public.audit_events (
      actor_id, actor_role, event_type, entity_type, entity_id, summary, metadata
    ) values (
      p_reviewer_id, coalesce(auth.jwt()->'app_metadata'->>'role', 'reviewer'),
      'candidate_published', 'demand_source', new_demand_source_id,
      'Reviewer published an approved public demand-signal record.',
      jsonb_build_object('candidate_id', candidate_row.id, 'schema_version', 'demand_signal_bundle_v1')
    );

    candidate_id := candidate_row.id;
    entity_type := 'demand_source';
    entity_id := new_demand_source_id;
    entity_slug := record#>>'{demandSource,slug}';
    return next;
  end loop;
end;
$$;

revoke all on function public.publish_reviewed_research_candidates(uuid[], uuid)
from public, anon, authenticated;
grant execute on function public.publish_reviewed_research_candidates(uuid[], uuid)
to authenticated;

comment on function public.publish_reviewed_research_candidates(uuid[], uuid)
is 'Atomically publishes approved organization and public-demand candidates after one explicit authenticated reviewer action.';
