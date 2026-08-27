-- One-newsletter delivery preferences and privacy-bounded conversion telemetry.
-- All records remain service-role only. This migration does not create a
-- campaign, provider group, schedule, or public subscriber read path.

create table public.newsletter_subscription_preferences (
  id uuid primary key default gen_random_uuid(),
  subscriber_id bigint not null references public.pilot_update_signups(id) on delete cascade,
  stream text not null check (stream in ('weekly', 'signal_alerts')),
  status text not null check (status in ('subscribed', 'unsubscribed')),
  consent_version text not null check (char_length(consent_version) between 1 and 80),
  consent_text text not null check (char_length(consent_text) between 20 and 1000),
  consented_at timestamptz not null,
  withdrawn_at timestamptz,
  provider_group_id text check (provider_group_id is null or char_length(provider_group_id) between 1 and 120),
  provider_sync_status text not null default 'pending'
    check (provider_sync_status in ('pending', 'synced', 'failed', 'not_configured')),
  provider_synced_at timestamptz,
  provider_error text check (provider_error is null or char_length(provider_error) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint newsletter_preferences_subscriber_stream_key unique (subscriber_id, stream),
  check ((status = 'subscribed' and withdrawn_at is null) or (status = 'unsubscribed' and withdrawn_at is not null)),
  check (
    provider_sync_status <> 'synced'
    or (
      provider_synced_at is not null
      and (provider_group_id is not null or status = 'unsubscribed')
    )
  )
);

create table public.newsletter_subscription_preference_history (
  id uuid primary key default gen_random_uuid(),
  subscriber_id bigint not null references public.pilot_update_signups(id) on delete cascade,
  stream text not null check (stream in ('weekly', 'signal_alerts')),
  action text not null check (action in ('consented', 'withdrawn', 'provider_reconciled')),
  consent_version text not null check (char_length(consent_version) between 1 and 80),
  consent_text text not null check (char_length(consent_text) between 20 and 1000),
  source text not null check (char_length(source) between 1 and 80),
  operation_key text not null unique check (char_length(operation_key) between 1 and 200),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.newsletter_delivery_runs (
  id uuid primary key default gen_random_uuid(),
  stream text not null check (stream in ('weekly', 'signal_alerts')),
  content_slug text not null check (char_length(content_slug) between 1 and 180),
  provider_campaign_id text check (provider_campaign_id is null or char_length(provider_campaign_id) between 1 and 120),
  status text not null default 'planned'
    check (status in ('planned', 'testing', 'scheduled', 'sending', 'sent', 'failed', 'cancelled', 'skipped')),
  scheduled_for timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  error text check (error is null or char_length(error) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stream, content_slug)
);

create table public.newsletter_campaign_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  delivery_run_id uuid references public.newsletter_delivery_runs(id) on delete cascade,
  provider_campaign_id text not null check (char_length(provider_campaign_id) between 1 and 120),
  observed_at timestamptz not null,
  sent integer not null default 0 check (sent >= 0),
  delivered integer not null default 0 check (delivered >= 0),
  estimated_unique_opens integer not null default 0 check (estimated_unique_opens >= 0),
  unique_clicks integer not null default 0 check (unique_clicks >= 0),
  bounces integer not null default 0 check (bounces >= 0),
  unsubscribes integer not null default 0 check (unsubscribes >= 0),
  created_at timestamptz not null default now(),
  unique (provider_campaign_id, observed_at),
  check (delivered <= sent),
  check (estimated_unique_opens <= greatest(delivered, sent)),
  check (unique_clicks <= greatest(delivered, sent))
);

create table public.newsletter_provider_event_receipts (
  event_key text primary key check (char_length(event_key) between 1 and 160),
  event_kind text not null check (event_kind in ('lifecycle', 'global_unsubscribe', 'group_added', 'group_removed')),
  occurred_at timestamptz not null,
  received_at timestamptz not null default now()
);

create index newsletter_preferences_stream_status_idx
  on public.newsletter_subscription_preferences (stream, status, updated_at desc);
create index newsletter_preference_history_subscriber_idx
  on public.newsletter_subscription_preference_history (subscriber_id, occurred_at desc);
create index newsletter_delivery_runs_status_idx
  on public.newsletter_delivery_runs (stream, status, created_at desc);
create index newsletter_metric_snapshots_observed_idx
  on public.newsletter_campaign_metric_snapshots (observed_at desc);
create unique index newsletter_delivery_runs_provider_campaign_key
  on public.newsletter_delivery_runs (provider_campaign_id)
  where provider_campaign_id is not null;

create trigger newsletter_preferences_set_updated_at
before update on public.newsletter_subscription_preferences
for each row execute function private.set_updated_at();

create trigger newsletter_delivery_runs_set_updated_at
before update on public.newsletter_delivery_runs
for each row execute function private.set_updated_at();

alter table public.newsletter_subscription_preferences enable row level security;
alter table public.newsletter_subscription_preference_history enable row level security;
alter table public.newsletter_delivery_runs enable row level security;
alter table public.newsletter_campaign_metric_snapshots enable row level security;
alter table public.newsletter_provider_event_receipts enable row level security;

revoke all on public.newsletter_subscription_preferences from public, anon, authenticated;
revoke all on public.newsletter_subscription_preference_history from public, anon, authenticated;
revoke all on public.newsletter_delivery_runs from public, anon, authenticated;
revoke all on public.newsletter_campaign_metric_snapshots from public, anon, authenticated;
revoke all on public.newsletter_provider_event_receipts from public, anon, authenticated;

grant select, insert, update on public.newsletter_subscription_preferences to service_role;
grant select, insert on public.newsletter_subscription_preference_history to service_role;
grant select, insert, update on public.newsletter_delivery_runs to service_role;
grant select, insert on public.newsletter_campaign_metric_snapshots to service_role;
grant select, insert on public.newsletter_provider_event_receipts to service_role;

-- Existing active subscribers explicitly consented to the weekly newsletter.
-- The backfill is repeatable and never grants the optional alert preference.
insert into public.newsletter_subscription_preferences (
  subscriber_id,
  stream,
  status,
  consent_version,
  consent_text,
  consented_at,
  provider_sync_status,
  provider_synced_at
)
select
  signup.id,
  'weekly',
  'subscribed',
  signup.consent_version,
  signup.consent_text,
  signup.created_at,
  'not_configured',
  null
from public.pilot_update_signups signup
where signup.status = 'subscribed'
on conflict (subscriber_id, stream) do nothing;

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
  signup.id,
  'weekly',
  'consented',
  signup.consent_version,
  signup.consent_text,
  'active_subscriber_backfill',
  'active-subscriber-backfill:' || signup.id::text || ':weekly',
  signup.created_at
from public.pilot_update_signups signup
where signup.status = 'subscribed'
  and not exists (
    select 1
    from public.newsletter_subscription_preference_history history
    where history.subscriber_id = signup.id
      and history.stream = 'weekly'
      and history.operation_key = 'active-subscriber-backfill:' || signup.id::text || ':weekly'
  );

-- Seed the current published Defence Signal as the alert baseline. It is not a
-- send and does not mark any archive edition for delivery.
insert into public.newsletter_delivery_runs (
  stream, content_slug, status, completed_at, error
)
select 'signal_alerts', edition.slug, 'skipped', now(),
  'Current-edition baseline created before alert activation; no email sent.'
from public.signal_editions edition
where edition.publication_status = 'published'
order by edition.edition_date desc
limit 1
on conflict (stream, content_slug) do nothing;

alter table public.pilot_events
  add column event_id uuid,
  add column occurred_at timestamptz,
  add column received_at timestamptz not null default now(),
  add column entry_channel text not null default 'unknown',
  add column traffic_class text not null default 'unknown',
  add column utm_source text,
  add column utm_medium text,
  add column utm_campaign text,
  add column utm_content text;

update public.pilot_events
set
  event_id = gen_random_uuid(),
  occurred_at = created_at,
  received_at = created_at
where event_id is null or occurred_at is null;

alter table public.pilot_events
  alter column event_id set default gen_random_uuid(),
  alter column occurred_at set default now(),
  alter column event_id set not null,
  alter column occurred_at set not null,
  add constraint pilot_events_event_id_key unique (event_id),
  add constraint pilot_events_entry_channel_check check (entry_channel in (
    'direct', 'organic_google', 'organic_other', 'email', 'founder_social',
    'company_social', 'earned_partner', 'referral', 'authentication_service',
    'internal', 'unknown'
  )),
  add constraint pilot_events_traffic_class_check check (traffic_class in ('production', 'staff', 'qa', 'unknown')),
  add constraint pilot_events_occurred_at_check check (
    occurred_at >= received_at - interval '7 days'
    and occurred_at <= received_at + interval '5 minutes'
  ),
  add constraint pilot_events_utm_source_check check (utm_source is null or char_length(utm_source) between 1 and 80),
  add constraint pilot_events_utm_medium_check check (utm_medium is null or char_length(utm_medium) between 1 and 80),
  add constraint pilot_events_utm_campaign_check check (utm_campaign is null or char_length(utm_campaign) between 1 and 120),
  add constraint pilot_events_utm_content_check check (utm_content is null or char_length(utm_content) between 1 and 120);

alter table public.pilot_events
  drop constraint if exists pilot_events_context_path_check;
alter table public.pilot_events
  add constraint pilot_events_context_path_check check (
    context_path like '/%'
    and context_path !~ '[?#]'
    and char_length(context_path) <= 500
  );

create index pilot_events_received_idx on public.pilot_events (received_at desc);
create index pilot_events_funnel_idx on public.pilot_events (event_name, traffic_class, received_at desc);
create index pilot_events_campaign_idx on public.pilot_events (utm_campaign, utm_source, utm_medium, received_at desc)
  where utm_campaign is not null or utm_source is not null or utm_medium is not null;

grant update, delete on public.pilot_events to service_role;

create or replace function public.record_north_signal_consent(
  p_email text,
  p_weekly_consent_version text,
  p_weekly_consent_text text,
  p_alerts_requested boolean,
  p_alerts_consent_version text,
  p_alerts_consent_text text,
  p_source text,
  p_cohort text,
  p_landing_path text,
  p_request_hash text,
  p_session_id uuid,
  p_search_id uuid,
  p_success_event_id uuid,
  p_occurred_at timestamptz,
  p_entry_channel text,
  p_traffic_class text,
  p_utm_source text,
  p_utm_medium text,
  p_utm_campaign text,
  p_utm_content text,
  p_success_metadata jsonb
)
returns table (result_subscriber_id bigint, created_global_consent boolean, operation_replayed boolean)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_subscriber_id bigint;
  v_created_global_consent boolean;
  v_inserted_event_id uuid;
  v_now timestamptz := now();
  v_occurred_at timestamptz;
begin
  if p_email is null or p_email <> lower(p_email) or position('@' in p_email) <= 1 then
    raise exception 'invalid email';
  end if;
  if p_landing_path !~ '^/[^?#]*$' then
    raise exception 'invalid landing path';
  end if;
  if p_source is null or char_length(p_source) > 80 then
    raise exception 'invalid source';
  end if;
  if p_success_metadata is not null and jsonb_typeof(p_success_metadata) <> 'object' then
    raise exception 'invalid success metadata';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_email, 0));
  v_occurred_at := least(greatest(p_occurred_at, v_now - interval '7 days'), v_now + interval '5 minutes');

  -- The success event UUID is the operation key. Inserting it first makes the
  -- complete consent transaction retry-safe; a later exception rolls it back.
  insert into public.pilot_events (
    event_id, request_hash, event_name, context_path, cohort, session_id,
    search_id, metadata, occurred_at, received_at, entry_channel, traffic_class,
    utm_source, utm_medium, utm_campaign, utm_content, expires_at
  ) values (
    p_success_event_id, p_request_hash, 'newsletter_success', p_landing_path,
    p_cohort, p_session_id, p_search_id, coalesce(p_success_metadata, '{}'::jsonb),
    v_occurred_at, v_now, p_entry_channel, p_traffic_class, p_utm_source,
    p_utm_medium, p_utm_campaign, p_utm_content, v_now + interval '30 days'
  ) on conflict (event_id) do nothing
  returning event_id into v_inserted_event_id;

  if v_inserted_event_id is null then
    select history.subscriber_id into v_subscriber_id
    from public.newsletter_subscription_preference_history history
    join public.pilot_update_signups signup on signup.id = history.subscriber_id
    where history.operation_key = 'signup:' || p_success_event_id::text || ':weekly'
      and history.action = 'consented'
      and signup.email = p_email
    limit 1;
    if v_subscriber_id is null then
      raise exception 'event id is already used by another operation';
    end if;
    return query select v_subscriber_id, false, true;
    return;
  end if;

  select signup.id, signup.status <> 'subscribed'
    into v_subscriber_id, v_created_global_consent
  from public.pilot_update_signups signup
  where signup.email = p_email
  for update;

  if v_subscriber_id is null then
    insert into public.pilot_update_signups (
      email, consented, consent_text, consent_version, source, cohort,
      landing_path, status
    ) values (
      p_email, true, p_weekly_consent_text, p_weekly_consent_version, p_source,
      p_cohort, p_landing_path, 'subscribed'
    ) returning id into v_subscriber_id;
    v_created_global_consent := true;
  else
    update public.pilot_update_signups
    set
      consented = true,
      consent_text = p_weekly_consent_text,
      consent_version = p_weekly_consent_version,
      source = p_source,
      cohort = p_cohort,
      landing_path = p_landing_path,
      status = 'subscribed'
    where id = v_subscriber_id;
  end if;

  insert into public.newsletter_subscription_preferences (
    subscriber_id, stream, status, consent_version, consent_text, consented_at,
    withdrawn_at, provider_sync_status, provider_error
  ) values (
    v_subscriber_id, 'weekly', 'subscribed', p_weekly_consent_version,
    p_weekly_consent_text, v_now, null, 'pending', null
  )
  on conflict on constraint newsletter_preferences_subscriber_stream_key do update set
    status = 'subscribed',
    consent_version = excluded.consent_version,
    consent_text = excluded.consent_text,
    consented_at = excluded.consented_at,
    withdrawn_at = null,
    provider_sync_status = 'pending',
    provider_synced_at = null,
    provider_error = null;

  insert into public.newsletter_subscription_preference_history (
    subscriber_id, stream, action, consent_version, consent_text, source,
    operation_key, occurred_at
  ) values (
    v_subscriber_id, 'weekly', 'consented', p_weekly_consent_version,
    p_weekly_consent_text, p_source,
    'signup:' || p_success_event_id::text || ':weekly', v_now
  );

  if p_alerts_requested then
    insert into public.newsletter_subscription_preferences (
      subscriber_id, stream, status, consent_version, consent_text, consented_at,
      withdrawn_at, provider_sync_status, provider_error
    ) values (
      v_subscriber_id, 'signal_alerts', 'subscribed', p_alerts_consent_version,
      p_alerts_consent_text, v_now, null, 'pending', null
    )
    on conflict on constraint newsletter_preferences_subscriber_stream_key do update set
      status = 'subscribed',
      consent_version = excluded.consent_version,
      consent_text = excluded.consent_text,
      consented_at = excluded.consented_at,
      withdrawn_at = null,
      provider_sync_status = 'pending',
      provider_synced_at = null,
      provider_error = null;

    insert into public.newsletter_subscription_preference_history (
      subscriber_id, stream, action, consent_version, consent_text, source,
      operation_key, occurred_at
    ) values (
      v_subscriber_id, 'signal_alerts', 'consented', p_alerts_consent_version,
      p_alerts_consent_text, p_source,
      'signup:' || p_success_event_id::text || ':signal_alerts', v_now
    );
  end if;

  if v_created_global_consent then
    insert into public.pilot_events (
      request_hash, event_name, context_path, cohort, session_id, search_id,
      metadata, occurred_at, received_at, entry_channel, traffic_class,
      utm_source, utm_medium, utm_campaign, utm_content, expires_at
    ) values (
      p_request_hash, 'subscription', p_landing_path, p_cohort, p_session_id,
      p_search_id, jsonb_build_object('placement', p_source), v_occurred_at,
      v_now, p_entry_channel, p_traffic_class, p_utm_source, p_utm_medium,
      p_utm_campaign, p_utm_content, v_now + interval '30 days'
    );
  end if;

  return query select v_subscriber_id, v_created_global_consent, false;
end;
$$;

create or replace function public.reconcile_north_signal_provider_event(
  p_email text,
  p_provider_subscriber_id text,
  p_provider_status text,
  p_action text,
  p_stream text,
  p_provider_group_id text,
  p_event_key text,
  p_occurred_at timestamptz,
  p_allow_new_consent boolean,
  p_consent_version text,
  p_consent_text text
)
returns table (result_subscriber_id bigint, active_stream_count bigint)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_subscriber_id bigint;
  v_stream text;
  v_current_status text;
  v_current_version text;
  v_current_text text;
  v_current_consented_at timestamptz;
  v_current_withdrawn_at timestamptz;
  v_current_provider_synced_at timestamptz;
  v_active_streams bigint := 0;
  v_rows_affected integer := 0;
  v_applied_provider_event boolean := false;
  v_occurred_at timestamptz := least(coalesce(p_occurred_at, now()), now() + interval '5 minutes');
  v_receipt_key text;
begin
  if p_email is null or p_email <> lower(p_email) or position('@' in p_email) <= 1 then
    raise exception 'invalid email';
  end if;
  if p_provider_status not in ('active', 'unsubscribed', 'unconfirmed', 'bounced', 'junk', 'deleted') then
    raise exception 'invalid provider status';
  end if;
  if p_action not in ('lifecycle', 'global_unsubscribe', 'group_added', 'group_removed') then
    raise exception 'invalid provider action';
  end if;
  if p_action in ('group_added', 'group_removed') and (p_stream is null or p_stream not in ('weekly', 'signal_alerts')) then
    raise exception 'invalid provider stream';
  end if;
  if p_action in ('group_added', 'group_removed') and p_provider_group_id is null then
    raise exception 'missing provider group';
  end if;
  if p_event_key is null or char_length(p_event_key) > 160 then
    raise exception 'invalid provider event key';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_email, 0));
  insert into public.newsletter_provider_event_receipts (
    event_key, event_kind, occurred_at
  ) values (
    p_event_key, p_action, v_occurred_at
  ) on conflict (event_key) do nothing
  returning event_key into v_receipt_key;

  if v_receipt_key is null then
    select signup.id into v_subscriber_id
    from public.pilot_update_signups signup
    where signup.email = p_email;
    if v_subscriber_id is null then return; end if;
    select count(*) into v_active_streams
    from public.newsletter_subscription_preferences preference
    where preference.subscriber_id = v_subscriber_id
      and preference.status = 'subscribed';
    return query select v_subscriber_id, v_active_streams;
    return;
  end if;

  select signup.id into v_subscriber_id
  from public.pilot_update_signups signup
  where signup.email = p_email
  for update;
  if v_subscriber_id is null then return; end if;

  if p_action = 'global_unsubscribe' then
    select exists (
      select 1
      from public.newsletter_subscription_preferences preference
      where preference.subscriber_id = v_subscriber_id
        and preference.status = 'subscribed'
        and preference.consented_at <= v_occurred_at
    ) into v_applied_provider_event;
    with withdrawn as (
      update public.newsletter_subscription_preferences preference
      set status = 'unsubscribed', withdrawn_at = v_occurred_at,
          provider_sync_status = 'synced',
          provider_synced_at = v_occurred_at,
          provider_error = null
      where preference.subscriber_id = v_subscriber_id
        and preference.status = 'subscribed'
        and preference.consented_at <= v_occurred_at
      returning preference.stream, preference.consent_version, preference.consent_text
    )
    insert into public.newsletter_subscription_preference_history (
      subscriber_id, stream, action, consent_version, consent_text, source,
      operation_key, occurred_at
    )
    select v_subscriber_id, withdrawn.stream, 'withdrawn',
      withdrawn.consent_version, withdrawn.consent_text,
      'mailerlite_global_unsubscribe', p_event_key || ':' || withdrawn.stream,
      v_occurred_at
    from withdrawn
    on conflict (operation_key) do nothing;
  elsif p_action = 'group_removed' then
    update public.newsletter_subscription_preferences preference
    set status = 'unsubscribed', withdrawn_at = v_occurred_at,
        provider_group_id = p_provider_group_id,
        provider_sync_status = 'synced', provider_synced_at = v_occurred_at,
        provider_error = null
    where preference.subscriber_id = v_subscriber_id
      and preference.stream = p_stream
      and preference.status = 'subscribed'
      and preference.consented_at <= v_occurred_at
    returning preference.stream, preference.consent_version,
      preference.consent_text, preference.consented_at
    into v_stream, v_current_version, v_current_text, v_current_consented_at;
    if v_stream is not null then
      v_applied_provider_event := true;
      insert into public.newsletter_subscription_preference_history (
        subscriber_id, stream, action, consent_version, consent_text, source,
        operation_key, occurred_at
      ) values (
        v_subscriber_id, v_stream, 'withdrawn', v_current_version,
        v_current_text, 'mailerlite_group_preference',
        p_event_key || ':' || v_stream, v_occurred_at
      ) on conflict (operation_key) do nothing;
    end if;
  elsif p_action = 'group_added' then
    select preference.status, preference.consent_version, preference.consent_text,
      preference.consented_at, preference.withdrawn_at, preference.provider_synced_at
    into v_current_status, v_current_version, v_current_text, v_current_consented_at,
      v_current_withdrawn_at, v_current_provider_synced_at
    from public.newsletter_subscription_preferences preference
    where preference.subscriber_id = v_subscriber_id
      and preference.stream = p_stream
    for update;
    if v_current_status = 'subscribed'
      and v_occurred_at >= v_current_consented_at
      and (v_current_provider_synced_at is null or v_occurred_at >= v_current_provider_synced_at)
    then
      update public.newsletter_subscription_preferences
      set provider_group_id = p_provider_group_id,
          provider_sync_status = 'synced', provider_synced_at = v_occurred_at,
          provider_error = null
      where subscriber_id = v_subscriber_id and stream = p_stream;
      insert into public.newsletter_subscription_preference_history (
        subscriber_id, stream, action, consent_version, consent_text, source,
        operation_key, occurred_at
      ) values (
        v_subscriber_id, p_stream, 'provider_reconciled', v_current_version,
        v_current_text, 'mailerlite_group_sync', p_event_key || ':' || p_stream,
        v_occurred_at
      ) on conflict (operation_key) do nothing;
      v_applied_provider_event := true;
    elsif p_allow_new_consent
      and (v_current_withdrawn_at is null or v_occurred_at >= v_current_withdrawn_at)
      and (v_current_provider_synced_at is null or v_occurred_at >= v_current_provider_synced_at)
    then
      insert into public.newsletter_subscription_preferences (
        subscriber_id, stream, status, consent_version, consent_text, consented_at,
        withdrawn_at, provider_group_id, provider_sync_status,
        provider_synced_at, provider_error
      ) values (
        v_subscriber_id, p_stream, 'subscribed', p_consent_version,
        p_consent_text, v_occurred_at, null, p_provider_group_id, 'synced',
        v_occurred_at, null
      )
      on conflict on constraint newsletter_preferences_subscriber_stream_key do update set
        status = 'subscribed',
        consent_version = excluded.consent_version,
        consent_text = excluded.consent_text,
        consented_at = excluded.consented_at,
        withdrawn_at = null,
        provider_group_id = excluded.provider_group_id,
        provider_sync_status = 'synced',
        provider_synced_at = excluded.provider_synced_at,
        provider_error = null;
      insert into public.newsletter_subscription_preference_history (
        subscriber_id, stream, action, consent_version, consent_text, source,
        operation_key, occurred_at
      ) values (
        v_subscriber_id, p_stream, 'consented', p_consent_version,
        p_consent_text, 'mailerlite_preference_center',
        p_event_key || ':' || p_stream, v_occurred_at
      ) on conflict (operation_key) do nothing;
      v_applied_provider_event := true;
    end if;
  elsif p_action = 'lifecycle' and p_provider_status in ('bounced', 'junk') then
    update public.newsletter_subscription_preferences preference
    set provider_sync_status = 'failed', provider_synced_at = v_occurred_at,
        provider_error = 'MailerLite delivery status is ' || p_provider_status || '.'
    where preference.subscriber_id = v_subscriber_id
      and preference.status = 'subscribed'
      and preference.consented_at <= v_occurred_at
      and (preference.provider_synced_at is null or preference.provider_synced_at <= v_occurred_at);
    get diagnostics v_rows_affected = row_count;
    v_applied_provider_event := v_rows_affected > 0;
  elsif p_action = 'lifecycle' and p_provider_status = 'unconfirmed' then
    update public.newsletter_subscription_preferences preference
    set provider_sync_status = 'pending', provider_synced_at = v_occurred_at,
        provider_error = null
    where preference.subscriber_id = v_subscriber_id
      and preference.status = 'subscribed'
      and preference.consented_at <= v_occurred_at
      and (preference.provider_synced_at is null or preference.provider_synced_at <= v_occurred_at);
    get diagnostics v_rows_affected = row_count;
    v_applied_provider_event := v_rows_affected > 0;
  elsif p_action = 'lifecycle' and p_provider_status = 'active' then
    update public.newsletter_subscription_preferences preference
    set provider_sync_status = case
          when preference.provider_group_id is null then 'not_configured'
          else 'synced'
        end,
        provider_synced_at = v_occurred_at,
        provider_error = null
    where preference.subscriber_id = v_subscriber_id
      and preference.status = 'subscribed'
      and preference.consented_at <= v_occurred_at
      and (preference.provider_synced_at is null or preference.provider_synced_at <= v_occurred_at);
    get diagnostics v_rows_affected = row_count;
    v_applied_provider_event := v_rows_affected > 0;
  end if;

  select count(*) into v_active_streams
  from public.newsletter_subscription_preferences preference
  where preference.subscriber_id = v_subscriber_id
    and preference.status = 'subscribed';
  update public.pilot_update_signups
  set status = case when v_active_streams > 0 then 'subscribed' else 'unsubscribed' end,
      consent_version = case
        when p_action = 'group_added' and p_allow_new_consent
          and status = 'unsubscribed' and v_active_streams > 0 then p_consent_version
        else consent_version
      end,
      consent_text = case
        when p_action = 'group_added' and p_allow_new_consent
          and status = 'unsubscribed' and v_active_streams > 0 then p_consent_text
        else consent_text
      end,
      source = case
        when p_action = 'group_added' and p_allow_new_consent
          and status = 'unsubscribed' and v_active_streams > 0 then 'mailerlite_preference_center'
        else source
      end
  where id = v_subscriber_id
    and p_action in ('global_unsubscribe', 'group_added', 'group_removed');

  update public.pilot_update_signups
  set mailing_provider = 'mailerlite',
      mailing_provider_subscriber_id = p_provider_subscriber_id,
      mailing_provider_status = p_provider_status,
      mailing_provider_synced_at = v_occurred_at,
      mailing_provider_error = null
  where id = v_subscriber_id
    and v_applied_provider_event
    and (mailing_provider_synced_at is null or mailing_provider_synced_at <= v_occurred_at);
  return query select v_subscriber_id, v_active_streams;
end;
$$;

create or replace function public.withdraw_north_signal_preferences(
  p_email text,
  p_source text,
  p_operation_key text,
  p_occurred_at timestamptz
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_subscriber_id bigint;
  v_occurred_at timestamptz := least(coalesce(p_occurred_at, now()), now() + interval '5 minutes');
begin
  if p_email is null or p_email <> lower(p_email) or position('@' in p_email) <= 1 then
    raise exception 'invalid email';
  end if;
  if p_source is null or char_length(p_source) > 80 then
    raise exception 'invalid source';
  end if;
  if p_operation_key is null or char_length(p_operation_key) > 140 then
    raise exception 'invalid operation key';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_email, 0));
  select signup.id into v_subscriber_id
  from public.pilot_update_signups signup
  where signup.email = p_email
  for update;
  if v_subscriber_id is null then return null; end if;

  with withdrawn as (
    update public.newsletter_subscription_preferences preference
    set status = 'unsubscribed', withdrawn_at = v_occurred_at,
        provider_sync_status = 'pending', provider_synced_at = null,
        provider_error = null
    where preference.subscriber_id = v_subscriber_id
      and preference.status = 'subscribed'
    returning preference.stream, preference.consent_version, preference.consent_text
  )
  insert into public.newsletter_subscription_preference_history (
    subscriber_id, stream, action, consent_version, consent_text, source,
    operation_key, occurred_at
  )
  select v_subscriber_id, withdrawn.stream, 'withdrawn',
    withdrawn.consent_version, withdrawn.consent_text, p_source,
    p_operation_key || ':' || withdrawn.stream, v_occurred_at
  from withdrawn
  on conflict (operation_key) do nothing;

  update public.pilot_update_signups set status = 'unsubscribed'
  where id = v_subscriber_id;
  return v_subscriber_id;
end;
$$;

revoke all on function public.record_north_signal_consent(
  text, text, text, boolean, text, text, text, text, text, text, uuid, uuid,
  uuid, timestamptz, text, text, text, text, text, text, jsonb
) from public, anon, authenticated;
grant execute on function public.record_north_signal_consent(
  text, text, text, boolean, text, text, text, text, text, text, uuid, uuid,
  uuid, timestamptz, text, text, text, text, text, text, jsonb
) to service_role;

revoke all on function public.reconcile_north_signal_provider_event(
  text, text, text, text, text, text, text, timestamptz, boolean, text, text
) from public, anon, authenticated;
grant execute on function public.reconcile_north_signal_provider_event(
  text, text, text, text, text, text, text, timestamptz, boolean, text, text
) to service_role;

revoke all on function public.withdraw_north_signal_preferences(
  text, text, text, timestamptz
) from public, anon, authenticated;
grant execute on function public.withdraw_north_signal_preferences(
  text, text, text, timestamptz
) to service_role;

comment on table public.newsletter_subscription_preferences is
  'Private current delivery preference for each consent-led North Signal stream.';
comment on table public.newsletter_subscription_preference_history is
  'Private append-only consent, withdrawal and provider reconciliation history.';
comment on table public.newsletter_delivery_runs is
  'Private aggregate delivery ledger; it contains no recipient identity.';
comment on table public.newsletter_campaign_metric_snapshots is
  'Private aggregate MailerLite campaign metrics. Opens are estimated and directional.';
comment on table public.newsletter_provider_event_receipts is
  'Private idempotency receipts for provider lifecycle and group events; contains no email identity.';
comment on function public.record_north_signal_consent is
  'Service-role-only transaction that records weekly consent, optional alert consent and the local-success event without joining behavior events to email identity.';
comment on function public.reconcile_north_signal_provider_event is
  'Service-role-only, retry-safe reconciliation of MailerLite lifecycle and delivery-preference events.';
comment on function public.withdraw_north_signal_preferences is
  'Service-role-only atomic global withdrawal of all active North Signal delivery preferences.';
