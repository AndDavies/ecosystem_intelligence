-- Review every remaining pending candidate in one completed research run as a
-- single transaction. Application code validates the current typed candidate
-- schemas before invoking this database boundary; the function repeats the
-- durable queue, rationale, duplicate, count, and authorization invariants.

create or replace function public.review_research_run_candidates(
  p_research_run_id uuid,
  p_reviewer_id uuid
)
returns table(accepted_count integer)
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $$
declare
  pending_count integer;
begin
  if not private.is_atlas_staff() or auth.uid() is distinct from p_reviewer_id then
    raise exception 'Batch review requires the authenticated atlas reviewer.' using errcode = '42501';
  end if;
  if p_research_run_id is null then
    raise exception 'Select a research run to review.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.research_runs
    where id = p_research_run_id and status = 'completed'
  ) then
    raise exception 'Only a completed research run can be accepted as a batch.' using errcode = '22023';
  end if;

  perform 1
  from public.candidate_changes
  where research_run_id = p_research_run_id and status = 'pending'
  order by created_at, id
  for update;

  select count(*)::integer into pending_count
  from public.candidate_changes
  where research_run_id = p_research_run_id and status = 'pending';
  if pending_count < 1 or pending_count > 50 then
    raise exception 'Select a completed run with between one and fifty pending candidates.' using errcode = '22023';
  end if;
  if exists (
    select 1
    from public.candidate_changes
    where research_run_id = p_research_run_id
      and status = 'pending'
      and (
        candidate_kind not in ('organization_bundle', 'demand_signal_bundle', 'organization_refresh_bundle', 'demand_refresh_bundle')
        or coalesce(duplicate_check->>'status', '') not in ('clear', 'merged')
        or length(trim(coalesce(reviewer_rationale, ''))) not between 80 and 2000
        or (candidate_kind = 'organization_bundle' and schema_version not in ('organization_bundle_v1', 'organization_bundle_v2', 'organization_bundle_v3'))
        or (candidate_kind = 'demand_signal_bundle' and schema_version <> 'demand_signal_bundle_v1')
        or (candidate_kind = 'organization_refresh_bundle' and schema_version not in ('organization_refresh_bundle_v1', 'organization_refresh_bundle_v2'))
        or (candidate_kind = 'demand_refresh_bundle' and schema_version <> 'demand_refresh_bundle_v1')
      )
  ) then
    raise exception 'Every pending candidate must be supported, duplicate-clear, and carry its complete reviewer rationale.' using errcode = '22023';
  end if;

  insert into public.review_decisions (
    candidate_change_id, reviewer_id, decision, field_decisions, rationale
  )
  select id, p_reviewer_id, 'accept', '[]'::jsonb, reviewer_rationale
  from public.candidate_changes
  where research_run_id = p_research_run_id and status = 'pending'
  order by created_at, id;

  update public.candidate_changes
  set status = 'approved', updated_at = now()
  where research_run_id = p_research_run_id and status = 'pending';

  insert into public.audit_events (
    actor_id, actor_role, event_type, entity_type, entity_id, summary, metadata
  ) values (
    p_reviewer_id,
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'reviewer'),
    'research_run_candidates_reviewed',
    'research_run',
    p_research_run_id,
    format('Reviewer accepted %s candidates from one completed research run.', pending_count),
    jsonb_build_object(
      'decision', 'accept',
      'candidate_count', pending_count,
      'publication_changed', false,
      'publication_checkpoint_required', true
    )
  );

  accepted_count := pending_count;
  return next;
end;
$$;

revoke all on function public.review_research_run_candidates(uuid, uuid) from public, anon, authenticated;
grant execute on function public.review_research_run_candidates(uuid, uuid) to authenticated;
