-- Make the released public source behind every demand signal inspectable.
-- Existing published signals are verified only when an approved public evidence
-- snippet is already cited to the signal or one of its requirements. Records
-- that do not meet that standard are retained as drafts rather than deleted.
alter table public.demand_sources
  add column source_evidence_snippet_id uuid references public.evidence_snippets(id) on delete restrict,
  add column source_verified_at timestamptz,
  add column source_verified_by uuid references auth.users(id) on delete set null;

with source_evidence as (
  select
    demand_source_record.id as demand_source_id,
    evidence_record.id as evidence_snippet_id,
    coalesce(
      (
        select audit_record.actor_id
        from public.audit_events audit_record
        where audit_record.entity_type = 'demand_source'
          and audit_record.entity_id = demand_source_record.id
          and audit_record.actor_id is not null
        order by audit_record.created_at desc
        limit 1
      ),
      (
        select user_record.id
        from auth.users user_record
        limit 1
      )
    ) as reviewer_id
  from public.demand_sources demand_source_record
  join lateral (
    select evidence_snippet_record.id
    from public.field_citations citation_record
    join public.evidence_snippets evidence_snippet_record
      on evidence_snippet_record.id = citation_record.evidence_snippet_id
    where evidence_snippet_record.source_id = demand_source_record.source_id
      and evidence_snippet_record.visibility = 'public'
      and evidence_snippet_record.public_approved
      and (
        (citation_record.entity_type = 'demand_source' and citation_record.entity_id = demand_source_record.id)
        or (
          citation_record.entity_type = 'demand_requirement'
          and exists (
            select 1
            from public.demand_requirements requirement_record
            where requirement_record.id = citation_record.entity_id
              and requirement_record.demand_source_id = demand_source_record.id
          )
        )
      )
    order by evidence_snippet_record.created_at desc
    limit 1
  ) evidence_record on true
)
update public.demand_sources demand_source_record
set
  source_evidence_snippet_id = source_evidence.evidence_snippet_id,
  source_verified_at = coalesce(demand_source_record.updated_at, demand_source_record.created_at, now()),
  source_verified_by = source_evidence.reviewer_id
from source_evidence
where demand_source_record.id = source_evidence.demand_source_id
  and source_evidence.reviewer_id is not null;

update public.capability_demand_matches match_record
set publication_status = 'draft', updated_at = now()
where match_record.publication_status = 'published'
  and exists (
    select 1
    from public.demand_requirements requirement_record
    join public.demand_sources demand_source_record on demand_source_record.id = requirement_record.demand_source_id
    where requirement_record.id = match_record.demand_requirement_id
      and demand_source_record.publication_status = 'published'
      and (
        demand_source_record.source_evidence_snippet_id is null
        or demand_source_record.source_verified_at is null
        or demand_source_record.source_verified_by is null
      )
  );

update public.demand_requirements requirement_record
set publication_status = 'draft', updated_at = now()
where requirement_record.publication_status = 'published'
  and exists (
    select 1
    from public.demand_sources demand_source_record
    where demand_source_record.id = requirement_record.demand_source_id
      and demand_source_record.publication_status = 'published'
      and (
        demand_source_record.source_evidence_snippet_id is null
        or demand_source_record.source_verified_at is null
        or demand_source_record.source_verified_by is null
      )
  );

update public.demand_sources
set publication_status = 'draft', updated_at = now()
where publication_status = 'published'
  and (
    source_evidence_snippet_id is null
    or source_verified_at is null
    or source_verified_by is null
  );

create or replace function public.upsert_published_demand_signal(
  p_demand_source_id uuid,
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
  managed_demand_source_id uuid;
  canonical_source_id uuid;
  canonical_evidence_snippet_id uuid;
  managed_issuer_id uuid;
  requirement jsonb;
  requirement_id uuid;
  is_new boolean := p_demand_source_id is null;
begin
  if not private.is_atlas_staff() or auth.uid() is distinct from p_reviewer_id then
    raise exception 'Demand signal changes require the authenticated atlas administrator.' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_rationale, ''))) < 20 then
    raise exception 'Explain the evidence and reason for this demand signal change.' using errcode = '22023';
  end if;
  if jsonb_typeof(p_payload) <> 'object'
     or length(trim(coalesce(p_payload->>'title', ''))) < 8
     or length(trim(coalesce(p_payload->>'publisher', ''))) < 2
     or coalesce(p_payload->>'canonicalUrl', '') !~ '^https://'
     or length(trim(coalesce(p_payload->>'sourceLocator', ''))) < 3
     or length(trim(coalesce(p_payload->>'sourceExcerpt', ''))) < 40
     or coalesce(p_payload->>'sourceVerified', 'false') <> 'true'
     or length(trim(coalesce(p_payload->>'summary', ''))) < 40
     or jsonb_typeof(p_payload->'requirements') <> 'array'
     or jsonb_array_length(p_payload->'requirements') < 1 then
    raise exception 'The demand signal needs a released public source, a source passage, and a completed verification decision.' using errcode = '22023';
  end if;

  managed_issuer_id := nullif(p_payload->>'issuerId', '')::uuid;
  if managed_issuer_id is null or not exists (
    select 1 from public.demand_issuers
    where id = managed_issuer_id and publication_status = 'published'
  ) then
    raise exception 'Choose a published issuing authority.' using errcode = '22023';
  end if;

  if is_new then
    if coalesce(p_payload->>'slug', '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
      raise exception 'A valid stable demand signal slug is required.' using errcode = '22023';
    end if;
    insert into public.sources (
      title, canonical_url, publisher, source_type, visibility,
      published_at, accessed_at, public_approved, notes
    ) values (
      trim(p_payload->>'title'), trim(p_payload->>'canonicalUrl'), trim(p_payload->>'publisher'),
      'official_demand_source', 'public', nullif(p_payload->>'publishedOn', '')::date,
      now(), true, 'Created through the administrator demand-signal editor. ' || trim(p_rationale)
    ) returning id into canonical_source_id;

    insert into public.evidence_snippets (
      source_id, excerpt, source_locator, visibility, public_approved, extracted_at
    ) values (
      canonical_source_id, trim(p_payload->>'sourceExcerpt'), trim(p_payload->>'sourceLocator'),
      'public', true, now()
    ) returning id into canonical_evidence_snippet_id;

    insert into public.demand_sources (
      source_id, slug, title, publisher, published_on, classification_label,
      source_visibility, summary, source_kind, commitment_level, publication_status,
      source_evidence_snippet_id, source_verified_at, source_verified_by
    ) values (
      canonical_source_id, p_payload->>'slug', trim(p_payload->>'title'), trim(p_payload->>'publisher'),
      nullif(p_payload->>'publishedOn', '')::date, 'PUBLIC', 'public', trim(p_payload->>'summary'),
      p_payload->>'sourceKind', p_payload->>'commitmentLevel', 'published',
      canonical_evidence_snippet_id, now(), p_reviewer_id
    ) returning id into managed_demand_source_id;
  else
    select source_id into canonical_source_id
    from public.demand_sources where id = p_demand_source_id for update;
    if canonical_source_id is null then
      raise exception 'The selected demand signal no longer exists.' using errcode = '22023';
    end if;
    managed_demand_source_id := p_demand_source_id;

    update public.sources set
      title = trim(p_payload->>'title'),
      canonical_url = trim(p_payload->>'canonicalUrl'),
      publisher = trim(p_payload->>'publisher'),
      published_at = nullif(p_payload->>'publishedOn', '')::date,
      accessed_at = now(),
      visibility = 'public',
      public_approved = true,
      notes = concat_ws(E'\n', nullif(notes, ''), 'Administrator update: ' || trim(p_rationale)),
      updated_at = now()
    where id = canonical_source_id;

    insert into public.evidence_snippets (
      source_id, excerpt, source_locator, visibility, public_approved, extracted_at
    ) values (
      canonical_source_id, trim(p_payload->>'sourceExcerpt'), trim(p_payload->>'sourceLocator'),
      'public', true, now()
    ) returning id into canonical_evidence_snippet_id;

    update public.demand_sources set
      title = trim(p_payload->>'title'),
      publisher = trim(p_payload->>'publisher'),
      published_on = nullif(p_payload->>'publishedOn', '')::date,
      classification_label = 'PUBLIC',
      source_visibility = 'public',
      summary = trim(p_payload->>'summary'),
      source_kind = p_payload->>'sourceKind',
      commitment_level = p_payload->>'commitmentLevel',
      publication_status = 'published',
      source_evidence_snippet_id = canonical_evidence_snippet_id,
      source_verified_at = now(),
      source_verified_by = p_reviewer_id,
      updated_at = now()
    where id = managed_demand_source_id;
  end if;

  insert into public.field_citations (entity_type, entity_id, field_name, evidence_snippet_id)
  values
    ('demand_source', managed_demand_source_id, 'title', canonical_evidence_snippet_id),
    ('demand_source', managed_demand_source_id, 'summary', canonical_evidence_snippet_id)
  on conflict do nothing;

  delete from public.demand_source_issuers
  where demand_source_id = managed_demand_source_id
    and issuer_role = 'issuer'
    and demand_issuer_id <> managed_issuer_id;

  insert into public.demand_source_issuers (
    demand_source_id, demand_issuer_id, issuer_role, publication_status
  ) values (
    managed_demand_source_id, managed_issuer_id, 'issuer', 'published'
  )
  on conflict (demand_source_id, demand_issuer_id, issuer_role)
  do update set publication_status = 'published';

  for requirement in select value from jsonb_array_elements(p_payload->'requirements') loop
    if length(trim(coalesce(requirement->>'title', ''))) < 8
       or length(trim(coalesce(requirement->>'problemStatement', ''))) < 40
       or length(trim(coalesce(requirement->>'desiredEndState', ''))) < 40
       or length(trim(coalesce(requirement->>'publicCaveat', ''))) < 20 then
      raise exception 'Every demand requirement needs a title, problem, outcome, and public caveat.' using errcode = '22023';
    end if;

    requirement_id := nullif(requirement->>'id', '')::uuid;
    if requirement_id is null then
      if coalesce(requirement->>'slug', '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
        raise exception 'Every new demand requirement needs a valid stable slug.' using errcode = '22023';
      end if;
      insert into public.demand_requirements (
        demand_source_id, slug, title, problem_statement, desired_end_state,
        public_caveat, display_order, publication_status
      ) values (
        managed_demand_source_id, requirement->>'slug', trim(requirement->>'title'),
        trim(requirement->>'problemStatement'), trim(requirement->>'desiredEndState'),
        trim(requirement->>'publicCaveat'), coalesce((requirement->>'displayOrder')::smallint, 0), 'published'
      ) returning id into requirement_id;
    else
      update public.demand_requirements as existing set
        title = trim(requirement->>'title'),
        problem_statement = trim(requirement->>'problemStatement'),
        desired_end_state = trim(requirement->>'desiredEndState'),
        public_caveat = trim(requirement->>'publicCaveat'),
        display_order = coalesce((requirement->>'displayOrder')::smallint, display_order),
        publication_status = 'published',
        updated_at = now()
      where existing.id = requirement_id and existing.demand_source_id = managed_demand_source_id;
      if not found then
        raise exception 'A requirement does not belong to the selected demand signal.' using errcode = '22023';
      end if;
    end if;

    insert into public.field_citations (entity_type, entity_id, field_name, evidence_snippet_id)
    values
      ('demand_requirement', requirement_id, 'problem_statement', canonical_evidence_snippet_id),
      ('demand_requirement', requirement_id, 'desired_end_state', canonical_evidence_snippet_id)
    on conflict do nothing;
  end loop;

  insert into public.audit_events (
    actor_id, actor_role, event_type, entity_type, entity_id, summary, metadata
  ) values (
    p_reviewer_id, coalesce(auth.jwt()->'app_metadata'->>'role', 'admin'),
    case when is_new then 'demand_signal_created' else 'demand_signal_updated' end,
    'demand_source', managed_demand_source_id,
    case when is_new then 'Administrator created a source-verified public demand signal.' else 'Administrator updated and reverified a public demand signal without changing its dependent matches.' end,
    jsonb_build_object(
      'rationale', trim(p_rationale),
      'source_id', canonical_source_id,
      'source_evidence_snippet_id', canonical_evidence_snippet_id,
      'source_verified', true,
      'issuer_id', managed_issuer_id,
      'relationship_ids_preserved', not is_new
    )
  );

  return managed_demand_source_id;
end;
$$;

revoke all on function public.upsert_published_demand_signal(uuid, uuid, jsonb, text)
from public, anon, authenticated;
grant execute on function public.upsert_published_demand_signal(uuid, uuid, jsonb, text)
to authenticated;

comment on function public.upsert_published_demand_signal(uuid, uuid, jsonb, text)
is 'Creates or edits a source-verified public demand signal transactionally, preserves stable requirement identifiers and matches, and records approved public evidence.';
