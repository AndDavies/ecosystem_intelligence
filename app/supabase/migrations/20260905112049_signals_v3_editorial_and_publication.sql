-- Additive Signals-only v3 contract. Historical rows and canonical atlas tables stay intact.
alter table public.signal_editions
  add column packet_schema_version text check (packet_schema_version is null or packet_schema_version = 'daily_signals_packet_v3'),
  add column summary_sections jsonb check (summary_sections is null or coalesce((
    jsonb_typeof(summary_sections) = 'object'
    and summary_sections ?& array['opening', 'takeaway', 'limitation']
    and jsonb_typeof(summary_sections->'opening') = 'string'
    and length(trim(summary_sections->>'opening')) > 0
    and jsonb_typeof(summary_sections->'takeaway') = 'string'
    and length(trim(summary_sections->>'takeaway')) > 0
    and (summary_sections->'limitation' = 'null'::jsonb or (jsonb_typeof(summary_sections->'limitation') = 'string' and length(trim(summary_sections->>'limitation')) > 0))
  ), false));
alter table public.signal_editions drop constraint signal_editions_executive_summary_check;
alter table public.signal_editions add constraint signal_editions_executive_summary_check check (length(trim(executive_summary)) > 0);

alter table public.signal_items drop constraint signal_items_position_check;
alter table public.signal_items alter column position type integer;
alter table public.signal_items add constraint signal_items_position_check check (position > 0);
alter table public.signal_items drop constraint signal_items_bottom_line_check;
alter table public.signal_items drop constraint signal_items_executive_summary_check;
alter table public.signal_items drop constraint signal_items_source_fact_check;
alter table public.signal_items drop constraint signal_items_automated_read_check;
alter table public.signal_items drop constraint signal_items_unknowns_check;
alter table public.signal_items drop constraint signal_items_next_step_check;
alter table public.signal_items alter column automated_read drop not null;
alter table public.signal_items alter column unknowns drop not null;
alter table public.signal_items alter column next_step drop not null;
alter table public.signal_items add constraint signal_items_bottom_line_check check (length(trim(bottom_line)) > 0);
alter table public.signal_items add constraint signal_items_executive_summary_check check (length(trim(executive_summary)) > 0);
alter table public.signal_items add constraint signal_items_source_fact_check check (length(trim(source_fact)) > 0);
alter table public.signal_items add constraint signal_items_automated_read_check check (automated_read is null or length(trim(automated_read)) > 0);
alter table public.signal_items add constraint signal_items_unknowns_check check (unknowns is null or length(trim(unknowns)) > 0);
alter table public.signal_items add constraint signal_items_next_step_check check (next_step is null or length(trim(next_step)) > 0);

create or replace function private.valid_signal_evidence_snapshot(value jsonb)
returns boolean language plpgsql immutable security invoker set search_path = '' as $$
declare field text;
begin
  if value is null or jsonb_typeof(value) <> 'object' then return false; end if;
  foreach field in array array['schemaVersion', 'canonicalUrl', 'supportType', 'title', 'publisher', 'accessedAt', 'sourceFamily', 'authority', 'evidenceLocator', 'evidenceExcerpt', 'contentHash'] loop
    if jsonb_typeof(value->field) is distinct from 'string' or length(trim(value->>field)) = 0 then return false; end if;
  end loop;
  if not value ? 'publishedAt' or (value->'publishedAt' <> 'null'::jsonb and jsonb_typeof(value->'publishedAt') <> 'string') then return false; end if;
  perform (value->>'accessedAt')::timestamptz;
  if value->'publishedAt' <> 'null'::jsonb then perform (value->>'publishedAt')::timestamptz; end if;
  return true;
exception when others then return false;
end;
$$;
revoke all on function private.valid_signal_evidence_snapshot(jsonb) from public, anon;
grant execute on function private.valid_signal_evidence_snapshot(jsonb) to authenticated, service_role;

alter table public.signal_item_sources alter column display_order type integer;
alter table public.signal_item_sources add column evidence_snapshot jsonb check (evidence_snapshot is null or coalesce((
  private.valid_signal_evidence_snapshot(evidence_snapshot)
  and jsonb_typeof(evidence_snapshot) = 'object'
  and evidence_snapshot ?& array['schemaVersion', 'canonicalUrl', 'supportType', 'title', 'publisher', 'publishedAt', 'accessedAt', 'sourceFamily', 'authority', 'evidenceLocator', 'evidenceExcerpt', 'contentHash']
  and evidence_snapshot->>'schemaVersion' = 'signal_evidence_snapshot_v1'
  and evidence_snapshot->>'canonicalUrl' ~ '^https://'
  and evidence_snapshot->>'supportType' in ('direct_record', 'attributed_statement', 'original_reporting', 'corroboration')
  and evidence_snapshot->>'authority' in ('primary', 'official', 'specialist')
  and length(trim(evidence_snapshot->>'title')) >= 4
  and length(trim(evidence_snapshot->>'publisher')) >= 2
  and length(trim(evidence_snapshot->>'sourceFamily')) >= 2
  and length(trim(evidence_snapshot->>'evidenceLocator')) >= 3
  and length(trim(evidence_snapshot->>'evidenceExcerpt')) between 20 and 1000
  and length(trim(evidence_snapshot->>'contentHash')) between 16 and 128
  and evidence_snapshot->>'accessedAt' ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}'
  and (evidence_snapshot->'publishedAt' = 'null'::jsonb or evidence_snapshot->>'publishedAt' ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}')
), false));
comment on column public.signal_item_sources.evidence_snapshot is 'Immutable item-specific publication evidence. NULL means legacy shared-source evidence; never claim a reconstructed snapshot was captured at publication.';
create or replace function private.keep_signal_evidence_snapshot_immutable()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if old.evidence_snapshot is not null and (new.evidence_snapshot is distinct from old.evidence_snapshot or new.item_id is distinct from old.item_id or new.source_id is distinct from old.source_id) then
    raise exception 'Published Signals evidence snapshots are immutable.' using errcode = '22023';
  end if;
  return new;
end;
$$;
create trigger signal_evidence_snapshot_immutable before update
on public.signal_item_sources for each row execute function private.keep_signal_evidence_snapshot_immutable();

alter table public.signal_runs add column writer_token uuid;
alter table public.signal_runs drop constraint signal_runs_status_check;
alter table public.signal_runs add constraint signal_runs_status_check check (status in ('started', 'published', 'no_publish', 'blocked', 'failed'));

-- The only v3 publication transition commits edition visibility and run status together.
-- SECURITY INVOKER plus an explicit service-role-only grant avoids new public authority.
create or replace function public.finalize_signal_edition(p_run_id text, p_edition_id uuid, p_payload_hash text, p_writer_token uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  run_row public.signal_runs%rowtype;
  edition_row public.signal_editions%rowtype;
  item_count integer;
  computed_family_count integer;
  published_time timestamptz := now();
begin
  select * into run_row from public.signal_runs where run_id = p_run_id for update;
  select * into edition_row from public.signal_editions where id = p_edition_id for update;
  if p_payload_hash is null or length(trim(p_payload_hash)) < 16
     or run_row.id is null or edition_row.id is null or edition_row.run_id <> p_run_id
     or edition_row.packet_schema_version is distinct from 'daily_signals_packet_v3'
     or run_row.report->>'payload_hash' is distinct from p_payload_hash
     or p_writer_token is null or run_row.writer_token is distinct from p_writer_token then
    raise exception 'Signals finalization identity or payload does not match.' using errcode = '22023';
  end if;
  if run_row.status = 'published' and run_row.edition_id = p_edition_id and edition_row.publication_status = 'published' then
    return jsonb_build_object('editionId', p_edition_id, 'publicationStatus', 'published', 'publishedAt', edition_row.published_at);
  end if;
  if run_row.status <> 'started' or run_row.edition_id is not null or edition_row.publication_status <> 'archived' then
    raise exception 'Signals finalization requires a started run and its private assembled edition.' using errcode = '22023';
  end if;
  if edition_row.summary_sections is null then
    raise exception 'A v3 edition requires explicit summary sections.' using errcode = '22023';
  end if;
  select count(*) into item_count from public.signal_items where edition_id = p_edition_id;
  if item_count = 0 or item_count <> run_row.selected_count or exists (
    select 1 from public.signal_items where edition_id = p_edition_id group by event_fingerprint having count(*) > 1
  ) or exists (
    select 1 from (select position, row_number() over (order by position) expected from public.signal_items where edition_id = p_edition_id) ordered
    where position <> expected
  ) or exists (
    select 1 from public.signal_items item where item.edition_id = p_edition_id and (
      item.publication_status <> 'published' or (
        select count(*) from public.signal_item_sources link where link.item_id = item.id and link.is_primary
      ) <> 1
    )
  ) then
    raise exception 'Signals items must be nonempty, contiguous and source-linked.' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.signal_items item
    join public.signal_item_sources link on link.item_id = item.id
    join public.signal_sources source on source.id = link.source_id
    where item.edition_id = p_edition_id and (
      link.evidence_snapshot is null
      or link.evidence_snapshot->>'canonicalUrl' is distinct from source.canonical_url
      or coalesce(link.evidence_snapshot->>'schemaVersion', '') <> 'signal_evidence_snapshot_v1'
    )
  ) then
    raise exception 'Every v3 item-source link requires its immutable matching evidence snapshot.' using errcode = '22023';
  end if;
  select count(distinct link.evidence_snapshot->>'sourceFamily') into computed_family_count
  from public.signal_items item join public.signal_item_sources link on link.item_id = item.id where item.edition_id = p_edition_id;
  update public.signal_editions set publication_status = 'published', published_at = published_time, updated_at = published_time where id = p_edition_id;
  update public.signal_runs set status = 'published', edition_id = p_edition_id, selected_count = item_count,
    source_family_count = computed_family_count, completed_at = published_time,
    report = report || jsonb_build_object('publication_status', 'published', 'item_count', item_count)
  where id = run_row.id;
  return jsonb_build_object('editionId', p_edition_id, 'publicationStatus', 'published', 'publishedAt', published_time);
end;
$$;
revoke all on function public.finalize_signal_edition(text, uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.finalize_signal_edition(text, uuid, text, uuid) to service_role;

-- Guard stale writers after an explicit recovery changed the assembly identity.
create or replace function private.guard_signal_assembly_insert()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.packet_schema_version = 'daily_signals_packet_v3' and not exists (
    select 1 from public.signal_runs run where run.run_id = new.run_id and run.status = 'started'
    and run.report->>'assembly_edition_id' = new.id::text
  ) then raise exception 'Signals assembly is not owned by the current writer attempt.' using errcode = '22023'; end if;
  return new;
end;
$$;
create trigger signal_assembly_insert_guard before insert on public.signal_editions for each row execute function private.guard_signal_assembly_insert();

-- Cleanup and finalization lock the same run first, then edition, so publication
-- cannot race a compensating delete or media cleanup. A published run stays protected even if Admin archived its edition.
create or replace function public.cleanup_signal_edition_run(
  p_run_id text, p_payload_hash text, p_writer_token uuid, p_error text,
  p_resume_token uuid default null, p_resume_report jsonb default null
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare run_row public.signal_runs%rowtype; edition_row public.signal_editions%rowtype; owned_source_id uuid; next_report jsonb;
begin
  select * into run_row from public.signal_runs where run_id = p_run_id for update;
  select * into edition_row from public.signal_editions where run_id = p_run_id for update;
  if run_row.id is null or p_payload_hash is null or length(trim(p_payload_hash)) < 16
    or run_row.report->>'payload_hash' is distinct from p_payload_hash
    or p_writer_token is null or run_row.writer_token is distinct from p_writer_token then
    raise exception 'Signals cleanup identity or writer changed; preserve the current attempt.' using errcode = '22023';
  end if;
  if run_row.status = 'published' or edition_row.publication_status = 'published' then
    return jsonb_build_object('outcome', 'already_published', 'editionId', coalesce(run_row.edition_id, edition_row.id));
  end if;
  if run_row.status = 'failed' and run_row.report->>'cleanup_complete' = 'true' and p_resume_token is null then
    return jsonb_build_object('outcome', 'cleaned', 'ownedHeroPath', run_row.report->>'owned_hero_path');
  end if;
  if run_row.status <> 'started' or run_row.edition_id is not null then
    raise exception 'Only an uncommitted started Signals attempt can be cleaned.' using errcode = '22023';
  end if;
  if p_resume_token is not null and (
    p_resume_report is null or p_resume_report->>'payload_hash' is distinct from p_payload_hash
    or p_resume_report->>'edition_date' is distinct from run_row.report->>'edition_date'
    or p_resume_report->>'edition_slug' is distinct from run_row.report->>'edition_slug'
    or coalesce(p_resume_report->>'assembly_edition_id', '') = ''
  ) then raise exception 'Recovery must preserve the same packet, slug and Atlantic date.' using errcode = '22023'; end if;
  if edition_row.id is not null then delete from public.signal_editions where id = edition_row.id; end if;
  for owned_source_id in select value::uuid from jsonb_each_text(coalesce(run_row.report->'planned_source_ids', '{}'::jsonb)) loop
    -- Locking the source also serializes a concurrent FK reference, preserving shared identities.
    perform 1 from public.signal_sources where id = owned_source_id for update;
    if not exists (select 1 from public.signal_item_sources link where link.source_id = owned_source_id) then
      delete from public.signal_sources source where source.id = owned_source_id;
    end if;
  end loop;
  if p_resume_token is null then
    update public.signal_runs set status = 'failed', completed_at = now(),
      report = report || jsonb_build_object('error', p_error, 'cleanup_complete', true) where id = run_row.id;
  else
    next_report := p_resume_report || jsonb_build_object('previous_attempts',
      coalesce(run_row.report->'previous_attempts', '[]'::jsonb) || jsonb_build_array(jsonb_build_object('writer_token', run_row.writer_token, 'reason', p_error, 'recovered_at', now())));
    update public.signal_runs set writer_token = p_resume_token, report = next_report, completed_at = null where id = run_row.id;
  end if;
  return jsonb_build_object('outcome', 'cleaned', 'ownedHeroPath', run_row.report->>'owned_hero_path');
end;
$$;
revoke all on function public.cleanup_signal_edition_run(text, text, uuid, text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.cleanup_signal_edition_run(text, text, uuid, text, uuid, jsonb) to service_role;
