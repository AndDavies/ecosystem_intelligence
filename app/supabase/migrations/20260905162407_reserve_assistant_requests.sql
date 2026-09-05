-- Paid requests are reserved before calling the model. Product telemetry is not
-- an authorization ledger and cannot replenish this rolling allowance.
create table private.assistant_request_reservations (
  subject_hash text primary key check (subject_hash ~ '^[a-f0-9]{64}$'),
  reserved_at timestamptz[] not null default '{}',
  updated_at timestamptz not null default clock_timestamp()
);
alter table private.assistant_request_reservations enable row level security;
revoke all on private.assistant_request_reservations from public, anon, authenticated, service_role;
grant select, delete on private.assistant_request_reservations to service_role;
create index assistant_request_reservations_expiry_idx on private.assistant_request_reservations(updated_at);

create function public.reserve_assistant_request(p_subject_hash text, p_limit integer)
returns table (allowed boolean, used integer)
language plpgsql security definer set search_path = ''
as $$
declare
  reservations timestamptz[];
  received_at timestamptz;
begin
  if p_subject_hash is null or p_subject_hash !~ '^[a-f0-9]{64}$' or p_limit is null or p_limit < 1 or p_limit > 10000 then
    raise exception 'Invalid assistant reservation policy.' using errcode = '22023';
  end if;
  -- The upsert locks (or recreates) the subject row even when retention runs
  -- concurrently, so a cleanup between INSERT and SELECT cannot lose a charge.
  insert into private.assistant_request_reservations as r(subject_hash) values (p_subject_hash)
    on conflict (subject_hash) do update set updated_at = clock_timestamp()
    returning r.reserved_at into reservations;
  received_at := clock_timestamp();
  select coalesce(array_agg(reservation order by reservation), '{}'::timestamptz[])
    into reservations from unnest(reservations) reservation
    where reservation > received_at - interval '24 hours';
  allowed := cardinality(reservations) < p_limit;
  if allowed then reservations := array_append(reservations, received_at); end if;
  used := cardinality(reservations);
  update private.assistant_request_reservations r
    set reserved_at = reservations, updated_at = received_at where r.subject_hash = p_subject_hash;
  return next;
end;
$$;
revoke all on function public.reserve_assistant_request(text,integer) from public, anon, authenticated;
grant execute on function public.reserve_assistant_request(text,integer) to service_role;

-- Reuse the existing daily retention job without adding another scheduler.
create or replace function private.purge_expired_product_telemetry()
returns table (deleted_searches bigint, deleted_events bigint)
language plpgsql security invoker set search_path = ''
as $$
declare search_count bigint; event_count bigint;
begin
  delete from private.assistant_request_reservations where updated_at <= now() - interval '24 hours';
  delete from public.pilot_events where expires_at <= now();
  get diagnostics event_count = row_count;
  delete from public.pilot_searches where expires_at <= now();
  get diagnostics search_count = row_count;
  return query select search_count, event_count;
end;
$$;
