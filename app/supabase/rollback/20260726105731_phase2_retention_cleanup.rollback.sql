-- Agent-operated rollback for 20260726105731_phase2_retention_cleanup.sql.
-- The scheduled caller must be removed before its target function.

do $rollback$
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
  end if;
end;
$rollback$;

drop function if exists private.purge_expired_product_telemetry();
