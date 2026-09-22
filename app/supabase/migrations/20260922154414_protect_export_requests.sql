-- Server-only, atomic account allowance. Attempts consume quota before rendering;
-- telemetry failures and parallel workers cannot replenish it.
create table private.export_request_reservations (
  subject_hash text primary key check (subject_hash ~ '^[a-f0-9]{64}$'),
  reserved_at timestamptz[] not null default '{}',
  updated_at timestamptz not null default clock_timestamp()
);
alter table private.export_request_reservations enable row level security;
revoke all on private.export_request_reservations from public, anon, authenticated, service_role;
grant select, delete on private.export_request_reservations to service_role;
create index export_request_reservations_expiry_idx on private.export_request_reservations(updated_at);

create function public.reserve_export_request(p_subject_hash text)
returns table (allowed boolean, retry_after integer)
language plpgsql security definer set search_path = '' as $$
declare reservations timestamptz[]; received_at timestamptz; recent_count integer; release_at timestamptz;
begin
  if p_subject_hash is null or p_subject_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid export subject.' using errcode = '22023';
  end if;
  insert into private.export_request_reservations as r(subject_hash) values(p_subject_hash)
    on conflict(subject_hash) do update set updated_at = clock_timestamp()
    returning r.reserved_at into reservations;
  received_at := clock_timestamp();
  select coalesce(array_agg(t order by t), '{}'::timestamptz[]) into reservations
    from unnest(reservations) t where t > received_at - interval '24 hours';
  select count(*) into recent_count from unnest(reservations) t where t > received_at - interval '10 minutes';
  allowed := cardinality(reservations) < 100 and recent_count < 10;
  retry_after := 0;
  if allowed then
    reservations := array_append(reservations, received_at);
  else
    if cardinality(reservations) >= 100 then release_at := reservations[1] + interval '24 hours'; end if;
    if recent_count >= 10 then
      select greatest(release_at, min(t) + interval '10 minutes') into release_at
        from unnest(reservations) t where t > received_at - interval '10 minutes';
    end if;
    retry_after := greatest(1, ceil(extract(epoch from release_at - received_at))::integer);
  end if;
  update private.export_request_reservations r set reserved_at = reservations, updated_at = received_at where r.subject_hash = p_subject_hash;
  return next;
end;
$$;
revoke all on function public.reserve_export_request(text) from public, anon, authenticated;
grant execute on function public.reserve_export_request(text) to service_role;

-- Preserve the existing scheduled job and its public result shape.
create or replace function private.purge_expired_product_telemetry()
returns table (deleted_searches bigint, deleted_events bigint)
language plpgsql security invoker set search_path = '' as $$
declare search_count bigint; event_count bigint;
begin
  delete from private.export_request_reservations where updated_at <= now() - interval '24 hours';
  delete from private.assistant_request_reservations where updated_at <= now() - interval '24 hours';
  delete from public.pilot_events where expires_at <= now();
  get diagnostics event_count = row_count;
  delete from public.pilot_searches where expires_at <= now();
  get diagnostics search_count = row_count;
  return query select search_count, event_count;
end;
$$;
