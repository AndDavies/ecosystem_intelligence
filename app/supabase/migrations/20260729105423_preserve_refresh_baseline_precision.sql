create or replace function private.refresh_candidate_baseline_text(
  p_candidate_kind text,
  p_before_record jsonb
)
returns text
language sql
immutable
set search_path = pg_catalog, public, private
as $$
  select case p_candidate_kind
    when 'organization_refresh_bundle' then p_before_record#>>'{organization,updated_at}'
    when 'demand_refresh_bundle' then p_before_record#>>'{demandSource,updated_at}'
    else null
  end;
$$;

revoke all on function private.refresh_candidate_baseline_text(text, jsonb) from public, anon, authenticated;

-- Repair only review candidates whose complete before-record still matches the
-- canonical target exactly. Nothing stale is rewritten and no public record is
-- changed by this reconciliation.
with repairable as (
  select candidate.id,
    private.refresh_candidate_baseline_text(candidate.candidate_kind, candidate.before_record) as exact_baseline
  from public.candidate_changes candidate
  left join public.organizations organization
    on candidate.candidate_kind = 'organization_refresh_bundle'
   and organization.id = candidate.target_entity_id
  left join public.demand_sources demand_source
    on candidate.candidate_kind = 'demand_refresh_bundle'
   and demand_source.id = candidate.target_entity_id
  where candidate.status in ('pending', 'approved')
    and candidate.candidate_kind in ('organization_refresh_bundle', 'demand_refresh_bundle')
    and private.refresh_candidate_baseline_text(candidate.candidate_kind, candidate.before_record) is not null
    and (
      (candidate.candidate_kind = 'organization_refresh_bundle'
        and organization.updated_at = (private.refresh_candidate_baseline_text(candidate.candidate_kind, candidate.before_record))::timestamptz)
      or
      (candidate.candidate_kind = 'demand_refresh_bundle'
        and demand_source.updated_at = (private.refresh_candidate_baseline_text(candidate.candidate_kind, candidate.before_record))::timestamptz)
    )
    and candidate.proposed_record#>>'{targetMatch,baselineUpdatedAt}'
      is distinct from private.refresh_candidate_baseline_text(candidate.candidate_kind, candidate.before_record)
), repaired as (
  update public.candidate_changes candidate
  set proposed_record = jsonb_set(
        candidate.proposed_record,
        '{targetMatch,baselineUpdatedAt}',
        to_jsonb(repairable.exact_baseline),
        false
      ),
      updated_at = now()
  from repairable
  where candidate.id = repairable.id
  returning candidate.id
)
insert into public.audit_events (
  actor_id, actor_role, event_type, entity_type, entity_id, summary, metadata
)
select null, 'system', 'refresh_baseline_precision_reconciled', 'candidate_change', repaired.id,
  'Reconciled a review candidate to the exact timestamp already preserved in its immutable before-record.',
  jsonb_build_object('candidate_id', repaired.id, 'publication_changed', false)
from repaired;

create or replace function private.enforce_refresh_candidate_baseline_precision()
returns trigger
language plpgsql
set search_path = pg_catalog, public, private
as $$
declare
  exact_baseline text;
begin
  if new.candidate_kind not in ('organization_refresh_bundle', 'demand_refresh_bundle') then
    return new;
  end if;

  exact_baseline := private.refresh_candidate_baseline_text(new.candidate_kind, new.before_record);
  if exact_baseline is null then
    raise exception 'Refresh candidate % is missing the authoritative updated_at value in before_record.', new.client_candidate_id
      using errcode = '22023';
  end if;
  if new.proposed_record#>>'{targetMatch,baselineUpdatedAt}' is distinct from exact_baseline then
    raise exception 'Refresh candidate % changed timestamp precision. Copy updated_at byte-for-byte into targetMatch.baselineUpdatedAt.', new.client_candidate_id
      using errcode = '22023';
  end if;
  if new.target_entity_id::text is distinct from new.proposed_record#>>'{targetMatch,entityId}' then
    raise exception 'Refresh candidate % has inconsistent target identifiers.', new.client_candidate_id
      using errcode = '22023';
  end if;
  if new.before_record is distinct from new.proposed_record->'beforeRecord' then
    raise exception 'Refresh candidate % has inconsistent before-record data.', new.client_candidate_id
      using errcode = '22023';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_refresh_candidate_baseline_precision on public.candidate_changes;
create trigger enforce_refresh_candidate_baseline_precision
before insert or update of candidate_kind, target_entity_id, proposed_record, before_record
on public.candidate_changes
for each row execute function private.enforce_refresh_candidate_baseline_precision();

alter function public.publish_reviewed_refresh_candidates(uuid[], uuid)
rename to publish_reviewed_refresh_candidates_v1;

create or replace function public.publish_reviewed_refresh_candidates(
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
  exact_baseline text;
  live_updated_at timestamptz;
begin
  if not private.is_atlas_staff() or auth.uid() is distinct from p_reviewer_id then
    raise exception 'Publication requires the authenticated atlas reviewer.' using errcode = '42501';
  end if;

  for candidate_row in
    select *
    from public.candidate_changes
    where id = any(p_candidate_ids)
      and status = 'approved'
      and candidate_kind in ('organization_refresh_bundle', 'demand_refresh_bundle')
    order by created_at, id
    for update
  loop
    exact_baseline := private.refresh_candidate_baseline_text(candidate_row.candidate_kind, candidate_row.before_record);
    if exact_baseline is null
       or candidate_row.proposed_record#>>'{targetMatch,baselineUpdatedAt}' is distinct from exact_baseline then
      raise exception 'Refresh candidate % (%) has inconsistent timestamp precision.',
        candidate_row.id, candidate_row.proposed_record#>>'{targetMatch,slug}'
        using errcode = '22023';
    end if;

    if candidate_row.candidate_kind = 'organization_refresh_bundle' then
      select updated_at into live_updated_at
      from public.organizations
      where id = candidate_row.target_entity_id;
    else
      select updated_at into live_updated_at
      from public.demand_sources
      where id = candidate_row.target_entity_id;
    end if;

    if live_updated_at is null then
      raise exception 'Refresh target for candidate % (%) no longer exists.',
        candidate_row.id, candidate_row.proposed_record#>>'{targetMatch,slug}'
        using errcode = 'P0002';
    end if;
    if live_updated_at is distinct from exact_baseline::timestamptz then
      raise exception 'Refresh candidate % (%) has a stale baseline.',
        candidate_row.id, candidate_row.proposed_record#>>'{targetMatch,slug}'
        using errcode = '40001';
    end if;
  end loop;

  return query
  select * from public.publish_reviewed_refresh_candidates_v1(p_candidate_ids, p_reviewer_id);
end;
$$;

revoke all on function public.publish_reviewed_refresh_candidates_v1(uuid[], uuid) from public, anon;
grant execute on function public.publish_reviewed_refresh_candidates_v1(uuid[], uuid) to authenticated;
revoke all on function public.publish_reviewed_refresh_candidates(uuid[], uuid) from public, anon, authenticated;
grant execute on function public.publish_reviewed_refresh_candidates(uuid[], uuid) to authenticated;

comment on function public.publish_reviewed_refresh_candidates(uuid[], uuid)
is 'Authenticated refresh publication using the exact immutable before-record timestamp, candidate-specific stale diagnostics, and the existing atomic publication transaction.';
