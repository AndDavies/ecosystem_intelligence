-- Sanitized operational observations; subscriber identities and provider
-- response bodies remain outside this table and outside Sites.
create table public.newsletter_provider_observations (
  observed_day date primary key,
  collected_at timestamptz not null,
  status text not null check (status in ('available', 'partial', 'unavailable')),
  dashboard_synced_at timestamptz,
  summary jsonb not null check (jsonb_typeof(summary) = 'object')
);
alter table public.newsletter_provider_observations enable row level security;
revoke all on public.newsletter_provider_observations from public, anon, authenticated;
grant select, insert, update on public.newsletter_provider_observations to service_role;

alter table public.newsletter_delivery_runs add column purpose text not null default 'production'
  check (purpose in ('production', 'verification'));
update public.newsletter_delivery_runs set purpose = 'verification'
where provider_campaign_id = '196945915690353799';

comment on table public.newsletter_provider_observations is
'Daily closed-schema MailerLite health, consent reconciliation and aggregate campaign observations. No identity, email body, credentials, or individual opens/clicks. Service role only.';
