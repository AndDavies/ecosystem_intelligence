-- Preserve aggregate product learning before the existing raw-event TTL expires.
-- No identifiers, metadata, query text, campaign values or individual sessions leave this lane.
create table public.product_activity_daily (
  day date not null,
  event_name text not null,
  route_family text not null check (route_family in ('home','organizations','capabilities','map','signals','north-signal','demand','missions','regions','briefs','other_public')),
  channel text not null check (channel in ('organic_google','organic_bing','organic_other','ai_referral','founder_social','company_social','earned_partner','email','referral','direct','internal','unknown')),
  events bigint not null check (events >= 0),
  observed_sessions bigint not null check (observed_sessions >= 0),
  tagged_events bigint not null check (tagged_events >= 0),
  updated_at timestamptz not null default now(),
  primary key (day,event_name,route_family,channel)
);
alter table public.product_activity_daily enable row level security;
revoke all on public.product_activity_daily from public, anon, authenticated;
grant select, insert, update, delete on public.product_activity_daily to service_role;
comment on table public.product_activity_daily is 'Private production-class daily aggregate, America/Halifax. Session counts are distinct within each cell only and must not be added as unique visitors. Retained 400 days. No personal or raw campaign data.';

create or replace function private.refresh_product_activity_daily()
returns bigint language plpgsql security invoker set search_path = '' as $$
declare affected bigint;
begin
  -- Only recompute fully retained days; never overwrite historical totals from
  -- a partially purged raw day. The last 28 completed days have a 30-day raw TTL.
  insert into public.product_activity_daily (day,event_name,route_family,channel,events,observed_sessions,tagged_events,updated_at)
  select (created_at at time zone 'America/Halifax')::date, event_name,
    case
      when context_path = '/' then 'home'
      when split_part(context_path,'/',2) in ('organizations','capabilities','map','signals','north-signal','demand','missions','regions','briefs') then split_part(context_path,'/',2)
      else 'other_public'
    end,
    case when entry_channel in ('organic_google','organic_bing','organic_other','ai_referral','founder_social','company_social','earned_partner','email','referral','direct','internal') then entry_channel else 'unknown' end,
    count(*), count(distinct session_id), count(*) filter (where utm_source is not null and utm_campaign is not null), now()
  from public.pilot_events
  where traffic_class = 'production'
    and created_at >= (((now() at time zone 'America/Halifax')::date - 28)::timestamp at time zone 'America/Halifax')
    and created_at < (((now() at time zone 'America/Halifax')::date)::timestamp at time zone 'America/Halifax')
    and context_path !~ '^/(admin|account|api|auth|collections|connect|sign-in|submit)(/|$)'
    and event_name in ('atlas_search','filter_apply','marker_select','result_select','dossier_open','evidence_open','export','save','submission','connection','subscription','newsletter_impression','newsletter_open','newsletter_cta_click','newsletter_form_start','newsletter_submit','newsletter_landing_view','newsletter_sample_open','newsletter_success','newsletter_error','newsletter_dismiss','feedback','share','profile_engagement')
  group by 1,2,3,4
  on conflict (day,event_name,route_family,channel) do update set events=excluded.events,observed_sessions=excluded.observed_sessions,tagged_events=excluded.tagged_events,updated_at=excluded.updated_at;
  get diagnostics affected = row_count;
  delete from public.product_activity_daily where day < (now() at time zone 'America/Halifax')::date - 400;
  return affected;
end;
$$;
revoke all on function private.refresh_product_activity_daily() from public, anon, authenticated;
grant execute on function private.refresh_product_activity_daily() to service_role;

-- Collection remains separate from WF04. Sites receives only a typed export
-- produced by the credentialed local product-activity operator.
create or replace function public.get_product_activity_summary(start_day date, end_day date)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'schemaVersion','tnm_product_activity_summary_v1',
    'collectedAt',to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'period',jsonb_build_object('startDate',start_day,'endDate',end_day,'timeZone','America/Halifax'),
    'firstObservedDate',(select min(day) from public.product_activity_daily),
    'rows',coalesce((select jsonb_agg(jsonb_build_object('date',day,'event',event_name,'routeFamily',route_family,'channel',channel,'events',events,'observedSessions',observed_sessions,'taggedEvents',tagged_events) order by day,event_name,route_family,channel) from public.product_activity_daily where day between start_day and end_day),'[]'::jsonb)
  ) where start_day <= end_day and end_day - start_day <= 400;
$$;
revoke all on function public.get_product_activity_summary(date,date) from public, anon, authenticated;
grant execute on function public.get_product_activity_summary(date,date) to service_role;

do $schedule$
begin
  if exists (select 1 from pg_namespace where nspname='cron') then
    perform cron.schedule('true-north-map-product-activity-daily','10 4 * * *','select private.refresh_product_activity_daily();');
  end if;
end;
$schedule$;
select private.refresh_product_activity_daily();
