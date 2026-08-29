-- Give public submissions a narrow, atomic and auditable human-review path.
-- A reviewer decision changes only the private submission workflow. Approval
-- still requires a separate validated research candidate and Publish action
-- before any canonical public record can change.

-- The shared quota trigger predates this review surface. Reading table-specific
-- fields directly from polymorphic NEW records makes PostgreSQL resolve a field
-- that does not exist on the other table (for example requester_id on a
-- submission). Extract the bounded identifiers from the row JSON instead so
-- both existing member workflows remain fail-closed and usable.
create or replace function private.enforce_member_workflow_quota()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  actor_id uuid;
  target_organization_id uuid;
  recent_count integer;
  duplicate_count integer;
begin
  if tg_table_name = 'submissions' then
    actor_id := nullif(to_jsonb(new) ->> 'owner_id', '')::uuid;
  elsif tg_table_name = 'connection_requests' then
    actor_id := nullif(to_jsonb(new) ->> 'requester_id', '')::uuid;
    target_organization_id := nullif(to_jsonb(new) ->> 'organization_id', '')::uuid;
  end if;
  if actor_id is null then
    raise exception 'A signed-in owner is required.' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(tg_table_name || ':' || actor_id::text, 0));

  if tg_table_name = 'submissions' then
    select count(*)::integer into recent_count
    from public.submissions
    where owner_id = actor_id and created_at >= now() - interval '24 hours';
    if recent_count >= 10 then
      raise exception 'Daily submission limit reached.' using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'connection_requests' then
    select count(*)::integer,
           count(*) filter (where connection_requests.organization_id = target_organization_id)::integer
      into recent_count, duplicate_count
    from public.connection_requests
    where requester_id = actor_id and created_at >= now() - interval '24 hours';
    if duplicate_count > 0 then
      raise exception 'Daily connection limit reached for the same organization.' using errcode = 'P0001';
    end if;
    if recent_count >= 5 then
      raise exception 'Daily connection limit reached.' using errcode = 'P0001';
    end if;
  else
    raise exception 'Unsupported member workflow quota table.' using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_member_workflow_quota()
from public, anon, authenticated, service_role;

create index if not exists submissions_status_created_at_idx
  on public.submissions(status, created_at desc);

create or replace function public.review_public_submission(
  p_submission_id uuid,
  p_expected_status text,
  p_action text,
  p_rationale text
)
returns text
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $$
declare
  submission_row public.submissions%rowtype;
  next_status text;
  review_decision text;
begin
  if not private.is_atlas_staff() then
    raise exception 'Submission review requires the authenticated atlas reviewer.' using errcode = '42501';
  end if;
  if p_expected_status not in ('pending', 'in_review') then
    raise exception 'Only active submissions can be reviewed.' using errcode = '22023';
  end if;
  if p_action not in ('start_review', 'return_pending', 'approve', 'reject') then
    raise exception 'Unknown submission review action.' using errcode = '22023';
  end if;
  if length(trim(coalesce(p_rationale, ''))) not between 20 and 2000 then
    raise exception 'Record a reviewer rationale between 20 and 2,000 characters.' using errcode = '22023';
  end if;

  select * into submission_row
  from public.submissions
  where id = p_submission_id
    and status = p_expected_status
    and status in ('pending', 'in_review')
  for update;
  if submission_row.id is null then
    raise exception 'The submission status changed or it is no longer available for review.' using errcode = 'P0001';
  end if;

  if p_action = 'start_review' and submission_row.status = 'pending' then
    next_status := 'in_review';
    review_decision := 'edit';
  elsif p_action = 'return_pending' and submission_row.status = 'in_review' then
    next_status := 'pending';
    review_decision := 'defer';
  elsif p_action = 'approve' then
    next_status := 'approved';
    review_decision := 'accept';
  elsif p_action = 'reject' then
    next_status := 'rejected';
    review_decision := 'reject';
  else
    raise exception 'That review transition is not valid from the current submission status.' using errcode = '22023';
  end if;

  insert into public.review_decisions (
    submission_id, reviewer_id, decision, field_decisions, rationale
  ) values (
    submission_row.id,
    auth.uid(),
    review_decision,
    jsonb_build_array(jsonb_build_object(
      'field', 'status',
      'from', submission_row.status,
      'to', next_status,
      'action', p_action
    )),
    trim(p_rationale)
  );

  update public.submissions
  set status = next_status,
      updated_at = now()
  where id = submission_row.id;

  insert into public.audit_events (
    actor_id, actor_role, event_type, entity_type, entity_id, summary, metadata
  ) values (
    auth.uid(),
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'reviewer'),
    'submission_reviewed',
    'submission',
    submission_row.id,
    format('Reviewer moved a public submission from %s to %s.', submission_row.status, next_status),
    jsonb_build_object(
      'action', p_action,
      'previous_status', submission_row.status,
      'new_status', next_status,
      'publication_changed', false,
      'candidate_preparation_required', next_status = 'approved'
    )
  );

  return next_status;
end;
$$;

revoke all on function public.review_public_submission(uuid, text, text, text)
from public, anon, authenticated;
grant execute on function public.review_public_submission(uuid, text, text, text)
to authenticated;

comment on function public.review_public_submission(uuid, text, text, text)
is 'Atomically records an atlas reviewer decision and changes only the private public-submission workflow; it never changes a canonical public record.';
