do $$
begin
  begin
    execute 'create extension if not exists pg_cron with schema extensions';
  exception
    when feature_not_supported or undefined_file then
      raise notice 'pg_cron is unavailable in this local database fixture; scheduling is skipped';
  end;
end;
$$;

create schema if not exists private;

create or replace function private.purge_expired_product_telemetry()
returns table (deleted_searches bigint, deleted_events bigint)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  search_count bigint;
  event_count bigint;
begin
  delete from public.pilot_events where expires_at <= now();
  get diagnostics event_count = row_count;

  delete from public.pilot_searches where expires_at <= now();
  get diagnostics search_count = row_count;

  return query select search_count, event_count;
end;
$$;

revoke all on function private.purge_expired_product_telemetry() from public, anon, authenticated;
grant execute on function private.purge_expired_product_telemetry() to service_role;

do $schedule$
declare
  existing_job_id bigint;
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    execute 'select jobid from cron.job where jobname = $1'
      into existing_job_id
      using 'true-north-map-purge-expired-product-telemetry';

    if existing_job_id is not null then
      execute 'select cron.unschedule($1)' using existing_job_id;
    end if;

    execute $cron$
      select cron.schedule(
        'true-north-map-purge-expired-product-telemetry',
        '17 4 * * *',
        'select * from private.purge_expired_product_telemetry();'
      )
    $cron$;
  end if;
end;
$schedule$;

comment on function private.purge_expired_product_telemetry() is
  'Deletes expired private search text and workflow events according to the public privacy policy.';
