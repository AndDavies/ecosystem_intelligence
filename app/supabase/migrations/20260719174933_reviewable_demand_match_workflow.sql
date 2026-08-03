-- Turn deterministic technology-to-demand suggestions into a private,
-- human-reviewed workflow. Nothing becomes public until the sole reviewer
-- explicitly publishes an individual match with a rationale.
create or replace function public.publish_reviewed_demand_match_candidate(
  p_candidate_id uuid,
  p_reviewer_id uuid,
  p_reviewer_rationale text
)
returns uuid
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $$
declare
  candidate_row public.candidate_changes%rowtype;
  record jsonb;
  new_match_id uuid;
  capability_organization_id uuid;
begin
  if not private.is_atlas_staff() or auth.uid() is distinct from p_reviewer_id then
    raise exception 'Publication requires the authenticated atlas reviewer.' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_reviewer_rationale, ''))) < 20 then
    raise exception 'Explain why this match is useful and defensible before publishing it.' using errcode = '22023';
  end if;

  select * into candidate_row
  from public.candidate_changes
  where id = p_candidate_id
    and candidate_kind = 'demand_match_bundle'
    and status = 'pending'
  for update;
  if candidate_row.id is null then
    raise exception 'The selected pending demand-match candidate no longer exists.' using errcode = '22023';
  end if;

  record := candidate_row.proposed_record;
  if record->>'schemaVersion' <> 'demand_match_bundle_v1'
     or nullif(record->>'capabilityId', '') is null
     or nullif(record->>'demandRequirementId', '') is null
     or length(trim(coalesce(record->>'alignmentSummary', ''))) < 40
     or length(trim(coalesce(record->>'rationale', ''))) < 80
     or jsonb_array_length(coalesce(record->'matchedConcepts', '[]'::jsonb)) < 1 then
    raise exception 'The demand-match candidate is incomplete.' using errcode = '22023';
  end if;

  select organization_id into capability_organization_id
  from public.capabilities
  where id = (record->>'capabilityId')::uuid
    and publication_status = 'published';
  if capability_organization_id is null
     or capability_organization_id is distinct from (record->>'organizationId')::uuid then
    raise exception 'The published capability and organization no longer match the candidate.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.demand_requirements
    where id = (record->>'demandRequirementId')::uuid
      and publication_status = 'published'
  ) then
    raise exception 'The public demand requirement no longer exists.' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.capability_demand_matches
    where capability_id = (record->>'capabilityId')::uuid
      and demand_requirement_id = (record->>'demandRequirementId')::uuid
  ) then
    raise exception 'This technology and demand statement are already connected.' using errcode = '23505';
  end if;

  insert into public.capability_demand_matches (
    capability_id, demand_requirement_id, match_type, alignment_summary,
    rationale, confidence, review_status, publication_status,
    reviewed_by, reviewed_at
  ) values (
    (record->>'capabilityId')::uuid,
    (record->>'demandRequirementId')::uuid,
    'derived',
    trim(record->>'alignmentSummary'),
    trim(record->>'rationale') || E'\n\nReviewer decision: ' || trim(p_reviewer_rationale),
    'moderate',
    'approved',
    'published',
    p_reviewer_id,
    now()
  ) returning id into new_match_id;

  insert into public.field_citations (entity_type, entity_id, field_name, evidence_snippet_id)
  select 'capability_demand_match', new_match_id, 'alignment_summary', citation.evidence_snippet_id
  from public.field_citations citation
  where (citation.entity_type = 'capability' and citation.entity_id = (record->>'capabilityId')::uuid)
     or (citation.entity_type = 'demand_requirement' and citation.entity_id = (record->>'demandRequirementId')::uuid)
  on conflict do nothing;

  insert into public.review_decisions (
    candidate_change_id, reviewer_id, decision, field_decisions, rationale
  ) values (
    p_candidate_id, p_reviewer_id, 'accept',
    jsonb_build_array(jsonb_build_object('field', 'alignment_summary', 'decision', 'published')),
    trim(p_reviewer_rationale)
  );

  update public.candidate_changes
  set status = 'published',
      target_entity_type = 'capability_demand_match',
      target_entity_id = new_match_id,
      published_at = now(),
      updated_at = now()
  where id = p_candidate_id;

  insert into public.audit_events (
    actor_id, actor_role, event_type, entity_type, entity_id, summary, metadata
  ) values (
    p_reviewer_id,
    coalesce(auth.jwt()->'app_metadata'->>'role', 'reviewer'),
    'demand_match_published',
    'capability_demand_match',
    new_match_id,
    'Reviewer published a derived technology-to-demand match.',
    jsonb_build_object(
      'candidate_id', p_candidate_id,
      'capability_id', record->>'capabilityId',
      'demand_requirement_id', record->>'demandRequirementId',
      'reviewer_rationale', trim(p_reviewer_rationale)
    )
  );

  return new_match_id;
end;
$$;

revoke all on function public.publish_reviewed_demand_match_candidate(uuid, uuid, text)
from public, anon, authenticated;
grant execute on function public.publish_reviewed_demand_match_candidate(uuid, uuid, text)
to authenticated;

comment on function public.publish_reviewed_demand_match_candidate(uuid, uuid, text)
is 'Publishes one reviewed derived technology-to-demand match after an explicit reviewer decision, preserves source citations, and records the audit trail.';
