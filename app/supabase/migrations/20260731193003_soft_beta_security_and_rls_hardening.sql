-- Close the remaining soft-beta security and policy-efficiency findings without
-- changing public data, editorial authority, or the published read contract.

-- The compatibility adapter performs no privileged work. Both it and the
-- article implementation enforce the authenticated administrator identity.
alter function public.upsert_defence_brief(uuid, uuid, jsonb, jsonb, jsonb, text)
  security invoker;
revoke all on function public.upsert_defence_article(uuid, uuid, jsonb, jsonb, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.upsert_defence_article(uuid, uuid, jsonb, jsonb, jsonb, text)
  to authenticated;

comment on function public.upsert_defence_brief(uuid, uuid, jsonb, jsonb, jsonb, text)
  is 'Security-invoker compatibility adapter. The authenticated administrator check remains in both editor functions.';

-- A stale editorial baseline is a review conflict, not a serialization failure.
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
        using errcode = 'P0001';
    end if;
  end loop;

  return query
  select * from public.publish_reviewed_refresh_candidates_v1(p_candidate_ids, p_reviewer_id);
end;
$$;

revoke all on function public.publish_reviewed_refresh_candidates(uuid[], uuid) from public, anon, authenticated;
grant execute on function public.publish_reviewed_refresh_candidates(uuid[], uuid) to authenticated;

comment on function public.publish_reviewed_refresh_candidates(uuid[], uuid)
  is 'Authenticated refresh publication with a non-retryable stale-review conflict and atomic canonical write.';

-- Account-level quotas backstop the friendly API preflight and remain atomic
-- when a user submits concurrent requests directly through the Data API.
create index if not exists submissions_owner_created_at_idx
  on public.submissions(owner_id, created_at desc);

create or replace function private.enforce_member_workflow_quota()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  actor_id uuid;
  recent_count integer;
  duplicate_count integer;
begin
  actor_id := case tg_table_name
    when 'submissions' then new.owner_id
    when 'connection_requests' then new.requester_id
    else null
  end;
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
           count(*) filter (where organization_id = new.organization_id)::integer
      into recent_count, duplicate_count
    from public.connection_requests
    where requester_id = actor_id and created_at >= now() - interval '24 hours';
    if duplicate_count > 0 then
      raise exception 'Daily connection limit reached for the same organization.' using errcode = 'P0001';
    end if;
    if recent_count >= 5 then
      raise exception 'Daily connection limit reached.' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_member_workflow_quota() from public, anon, authenticated, service_role;
drop trigger if exists submissions_member_workflow_quota on public.submissions;
create trigger submissions_member_workflow_quota
  before insert on public.submissions
  for each row execute function private.enforce_member_workflow_quota();
drop trigger if exists connection_requests_member_workflow_quota on public.connection_requests;
create trigger connection_requests_member_workflow_quota
  before insert on public.connection_requests
  for each row execute function private.enforce_member_workflow_quota();

-- Consolidate each public-read plus staff-ALL pair. Anonymous visitors retain
-- the exact public predicate. Signed-in users receive one SELECT policy that
-- combines that predicate with staff access, and staff writes become explicit.
create or replace function private.consolidate_public_staff_policies(
  p_table regclass,
  p_public_policy text,
  p_staff_policy text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  public_qual text;
begin
  select qual into public_qual
  from pg_policies
  where schemaname = 'public'
    and tablename = (select relname from pg_class where oid = p_table)
    and policyname = p_public_policy
    and cmd = 'SELECT';
  if public_qual is null then
    raise exception 'Missing public read policy % on %.', p_public_policy, p_table using errcode = '42704';
  end if;

  execute format('drop policy %I on %s', p_public_policy, p_table);
  execute format('drop policy %I on %s', p_staff_policy, p_table);
  execute format('create policy %I on %s for select to anon using (%s)', p_public_policy, p_table, public_qual);
  execute format(
    'create policy %I on %s for select to authenticated using ((%s) or (select private.is_atlas_staff()))',
    p_public_policy || ' for authenticated', p_table, public_qual
  );
  execute format(
    'create policy %I on %s for insert to authenticated with check ((select private.is_atlas_staff()))',
    p_staff_policy || ' inserts', p_table
  );
  execute format(
    'create policy %I on %s for update to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()))',
    p_staff_policy || ' updates', p_table
  );
  execute format(
    'create policy %I on %s for delete to authenticated using ((select private.is_atlas_staff()))',
    p_staff_policy || ' deletes', p_table
  );
end;
$$;

select private.consolidate_public_staff_policies('public.capabilities', 'published capabilities are readable', 'atlas staff manage capabilities');
select private.consolidate_public_staff_policies('public.capability_clusters', 'published capability clusters are readable', 'atlas staff manage capability clusters');
select private.consolidate_public_staff_policies('public.capability_demand_matches', 'approved published matches are readable', 'atlas staff manage demand matches');
select private.consolidate_public_staff_policies('public.capability_domains', 'published capability domains are readable', 'atlas staff manage capability domains');
select private.consolidate_public_staff_policies('public.capability_mission_matches', 'approved mission matches are readable', 'atlas staff manage mission matches');
select private.consolidate_public_staff_policies('public.demand_issuers', 'published demand issuers are readable', 'atlas staff manage demand issuers');
select private.consolidate_public_staff_policies('public.demand_requirements', 'published demand requirements are readable', 'atlas staff manage demand requirements');
select private.consolidate_public_staff_policies('public.demand_source_issuers', 'published demand source issuers are readable', 'atlas staff manage demand source issuers');
select private.consolidate_public_staff_policies('public.demand_sources', 'published demand sources are readable', 'atlas staff manage demand sources');
select private.consolidate_public_staff_policies('public.ecosystem_clusters', 'published ecosystem clusters are readable', 'atlas staff manage ecosystem clusters');
select private.consolidate_public_staff_policies('public.evidence_snippets', 'public evidence is readable', 'atlas staff manage evidence');
select private.consolidate_public_staff_policies('public.field_citations', 'public field citations are readable', 'atlas staff manage citations');
select private.consolidate_public_staff_policies('public.funding_events', 'published funding events are readable', 'atlas staff manage funding events');
select private.consolidate_public_staff_policies('public.locations', 'published locations are readable', 'atlas staff manage locations');
select private.consolidate_public_staff_policies('public.media_assets', 'approved media is readable', 'atlas staff manage media');
select private.consolidate_public_staff_policies('public.mission_areas', 'published mission areas are readable', 'atlas staff manage mission areas');
select private.consolidate_public_staff_policies('public.organization_aliases', 'published organization aliases are readable', 'atlas staff manage organization aliases');
select private.consolidate_public_staff_policies('public.organization_locations', 'published organization locations are readable', 'atlas staff manage organization locations');
select private.consolidate_public_staff_policies('public.organization_relationships', 'published relationships are readable', 'atlas staff manage relationships');
select private.consolidate_public_staff_policies('public.organizations', 'published organizations are readable', 'atlas staff manage organizations');
select private.consolidate_public_staff_policies('public.program_participations', 'published program participation is readable', 'atlas staff manage program participation');
select private.consolidate_public_staff_policies('public.programs', 'published programs are readable', 'atlas staff manage programs');
select private.consolidate_public_staff_policies('public.sources', 'public sources are readable', 'atlas staff manage sources');
select private.consolidate_public_staff_policies('public.technical_domains', 'published technical domains are readable', 'atlas staff manage technical domains');
select private.consolidate_public_staff_policies('public.wiki_page_record_links', 'published defence brief links are public', 'atlas administrator manages defence brief links');
select private.consolidate_public_staff_policies('public.wiki_page_sources', 'published defence brief sources are public', 'atlas administrator manages defence brief sources');
select private.consolidate_public_staff_policies('public.wiki_pages', 'published defence briefs are public', 'atlas administrator manages defence briefs');

drop function private.consolidate_public_staff_policies(regclass, text, text);

drop policy "atlas staff manage connection requests" on public.connection_requests;
drop policy "users create their own connection requests" on public.connection_requests;
drop policy "users read their own connection requests" on public.connection_requests;
create policy "members or staff read connection requests" on public.connection_requests
  for select to authenticated
  using ((select auth.uid()) = requester_id or (select private.is_atlas_staff()));
create policy "members or staff create connection requests" on public.connection_requests
  for insert to authenticated
  with check (
    (((select auth.uid()) = requester_id and status = 'new') or (select private.is_atlas_staff()))
  );
create policy "staff update connection requests" on public.connection_requests
  for update to authenticated
  using ((select private.is_atlas_staff()))
  with check ((select private.is_atlas_staff()));
create policy "staff delete connection requests" on public.connection_requests
  for delete to authenticated
  using ((select private.is_atlas_staff()));

drop policy "atlas staff manage submissions" on public.submissions;
drop policy "users create their own submissions" on public.submissions;
drop policy "users read their own submissions" on public.submissions;
drop policy "users update pending submissions" on public.submissions;
create policy "members or staff read submissions" on public.submissions
  for select to authenticated
  using ((select auth.uid()) = owner_id or (select private.is_atlas_staff()));
create policy "members or staff create submissions" on public.submissions
  for insert to authenticated
  with check ((select auth.uid()) = owner_id or (select private.is_atlas_staff()));
create policy "members or staff update submissions" on public.submissions
  for update to authenticated
  using (
    ((select auth.uid()) = owner_id and status in ('pending', 'withdrawn'))
    or (select private.is_atlas_staff())
  )
  with check (
    ((select auth.uid()) = owner_id and status in ('pending', 'withdrawn'))
    or (select private.is_atlas_staff())
  );
create policy "staff delete submissions" on public.submissions
  for delete to authenticated
  using ((select private.is_atlas_staff()));
