-- Post-deploy catch-up for the bounded window between the base newsletter
-- migration and the compatible application becoming READY. Apply only after
-- the new application is live. This migration is idempotent, grants no alert
-- consent, and makes no provider change.

with withdrawn as (
update public.newsletter_subscription_preferences preference
set
  status = 'unsubscribed',
  withdrawn_at = signup.updated_at,
  provider_sync_status = case
    when signup.mailing_provider_status = 'unsubscribed'
      and signup.mailing_provider_synced_at is not null then 'synced'
    else 'pending'
  end,
  provider_synced_at = case
    when signup.mailing_provider_status = 'unsubscribed'
      and signup.mailing_provider_synced_at is not null
      then signup.mailing_provider_synced_at
    else null
  end,
  provider_error = signup.mailing_provider_error
from public.pilot_update_signups signup
where signup.id = preference.subscriber_id
  and signup.status = 'unsubscribed'
  and preference.status = 'subscribed'
  and signup.updated_at >= preference.consented_at
returning
  preference.subscriber_id,
  preference.stream,
  preference.consent_version,
  preference.consent_text,
  preference.withdrawn_at
)
insert into public.newsletter_subscription_preference_history (
  subscriber_id,
  stream,
  action,
  consent_version,
  consent_text,
  source,
  operation_key,
  occurred_at
)
select
  withdrawn.subscriber_id,
  withdrawn.stream,
  'withdrawn',
  withdrawn.consent_version,
  withdrawn.consent_text,
  'post_deploy_global_withdrawal',
  'post-deploy-global-withdrawal:' || withdrawn.subscriber_id::text || ':' ||
    withdrawn.stream || ':' ||
    extract(epoch from withdrawn.withdrawn_at)::bigint::text,
  withdrawn.withdrawn_at
from withdrawn
on conflict (operation_key) do nothing;

with reconciled as (
insert into public.newsletter_subscription_preferences (
  subscriber_id,
  stream,
  status,
  consent_version,
  consent_text,
  consented_at,
  withdrawn_at,
  provider_sync_status,
  provider_synced_at,
  provider_error
)
select
  signup.id,
  'weekly',
  'subscribed',
  signup.consent_version,
  signup.consent_text,
  signup.updated_at,
  null,
  'not_configured',
  null,
  null
from public.pilot_update_signups signup
left join public.newsletter_subscription_preferences weekly
  on weekly.subscriber_id = signup.id and weekly.stream = 'weekly'
where signup.status = 'subscribed'
  and (
    weekly.id is null
    or (
      weekly.status = 'unsubscribed'
      and signup.updated_at > weekly.updated_at
      and not exists (
        select 1
        from public.newsletter_subscription_preferences alerts
        where alerts.subscriber_id = signup.id
          and alerts.stream = 'signal_alerts'
          and alerts.status = 'subscribed'
      )
    )
  )
on conflict on constraint newsletter_preferences_subscriber_stream_key do update set
  status = 'subscribed',
  consent_version = excluded.consent_version,
  consent_text = excluded.consent_text,
  consented_at = excluded.consented_at,
  withdrawn_at = null,
  provider_sync_status = 'not_configured',
  provider_synced_at = null,
  provider_error = null
returning subscriber_id, consent_version, consent_text, consented_at
)

insert into public.newsletter_subscription_preference_history (
  subscriber_id,
  stream,
  action,
  consent_version,
  consent_text,
  source,
  operation_key,
  occurred_at
)
select
  reconciled.subscriber_id,
  'weekly',
  'consented',
  reconciled.consent_version,
  reconciled.consent_text,
  'post_deploy_weekly_reconciliation',
  'post-deploy-weekly-reconciliation:' || reconciled.subscriber_id::text || ':' ||
    extract(epoch from reconciled.consented_at)::bigint::text,
  reconciled.consented_at
from reconciled
on conflict (operation_key) do nothing;

do $$
begin
  if exists (
    select 1
    from public.pilot_update_signups signup
    where signup.status = 'subscribed'
      and not exists (
        select 1
        from public.newsletter_subscription_preferences preference
        where preference.subscriber_id = signup.id
          and preference.status = 'subscribed'
      )
  ) then
    raise exception 'active North Signal subscribers remain without an active delivery preference';
  end if;
  if exists (
    select 1
    from public.pilot_update_signups signup
    join public.newsletter_subscription_preferences preference
      on preference.subscriber_id = signup.id
     and preference.status = 'subscribed'
    where signup.status = 'unsubscribed'
  ) then
    raise exception 'unsubscribed North Signal subscribers retain an active delivery preference';
  end if;
end;
$$;
