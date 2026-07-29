-- Keep the exact-baseline guard inside the authenticated publication wrapper.
-- The prior wrapper called a deliberately private helper while running as the
-- authenticated reviewer, so PostgreSQL correctly denied the call before any
-- reviewed record could be published.
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
    exact_baseline := case candidate_row.candidate_kind
      when 'organization_refresh_bundle' then candidate_row.before_record#>>'{organization,updated_at}'
      when 'demand_refresh_bundle' then candidate_row.before_record#>>'{demandSource,updated_at}'
      else null
    end;

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

revoke all on function public.publish_reviewed_refresh_candidates(uuid[], uuid) from public, anon, authenticated;
grant execute on function public.publish_reviewed_refresh_candidates(uuid[], uuid) to authenticated;

comment on function public.publish_reviewed_refresh_candidates(uuid[], uuid)
is 'Authenticated refresh publication with an inline exact-baseline guard, candidate-specific stale diagnostics, and the existing atomic publication transaction.';
