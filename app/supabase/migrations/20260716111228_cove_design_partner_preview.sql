-- Migration version aligned with the production history.
-- Invitation-only design-partner preview capture. These records are never
-- exposed directly through the public Data API; validated server routes write
-- with the server-side service role and editors inspect them privately.

create table public.pilot_update_signups (
  id bigint generated always as identity primary key,
  email text not null unique,
  consented boolean not null check (consented),
  consent_text text not null check (char_length(consent_text) between 20 and 1000),
  consent_version text not null check (char_length(consent_version) between 1 and 40),
  source text not null default 'pilot_popup' check (char_length(source) between 1 and 80),
  cohort text check (cohort is null or char_length(cohort) <= 120),
  landing_path text check (landing_path is null or (landing_path like '/%' and char_length(landing_path) <= 500)),
  status text not null default 'subscribed'
    check (status in ('subscribed', 'unsubscribed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(email) between 3 and 320),
  check (email = lower(email)),
  check (position('@' in email) > 1)
);

create table public.pilot_feedback (
  id bigint generated always as identity primary key,
  request_hash text not null check (char_length(request_hash) = 64),
  goal text not null check (char_length(goal) between 3 and 1200),
  worked text check (worked is null or char_length(worked) <= 2000),
  missing text not null check (char_length(missing) between 3 and 3000),
  contact_email text check (contact_email is null or char_length(contact_email) between 3 and 320),
  context_path text not null check (context_path like '/%' and char_length(context_path) <= 500),
  cohort text check (cohort is null or char_length(cohort) <= 120),
  status text not null default 'pending'
    check (status in ('pending', 'reviewed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (contact_email is null or contact_email = lower(contact_email)),
  check (contact_email is null or position('@' in contact_email) > 1)
);

create table public.pilot_events (
  id bigint generated always as identity primary key,
  request_hash text not null check (char_length(request_hash) = 64),
  event_name text not null check (event_name in (
    'atlas_search',
    'filter_apply',
    'marker_select',
    'dossier_open',
    'evidence_open',
    'export',
    'signup',
    'feedback'
  )),
  context_path text not null check (context_path like '/%' and char_length(context_path) <= 500),
  cohort text check (cohort is null or char_length(cohort) <= 120),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index pilot_update_signups_status_idx
  on public.pilot_update_signups (status, created_at desc);
create index pilot_feedback_review_idx
  on public.pilot_feedback (status, created_at desc);
create index pilot_feedback_rate_limit_idx
  on public.pilot_feedback (request_hash, created_at desc);
create index pilot_events_name_created_idx
  on public.pilot_events (event_name, created_at desc);
create index pilot_events_request_created_idx
  on public.pilot_events (request_hash, created_at desc);

create trigger pilot_update_signups_set_updated_at
before update on public.pilot_update_signups
for each row execute function private.set_updated_at();

create trigger pilot_feedback_set_updated_at
before update on public.pilot_feedback
for each row execute function private.set_updated_at();

alter table public.pilot_update_signups enable row level security;
alter table public.pilot_feedback enable row level security;
alter table public.pilot_events enable row level security;

revoke all on public.pilot_update_signups from public, anon, authenticated;
revoke all on public.pilot_feedback from public, anon, authenticated;
revoke all on public.pilot_events from public, anon, authenticated;
revoke all on sequence public.pilot_update_signups_id_seq from public, anon, authenticated;
revoke all on sequence public.pilot_feedback_id_seq from public, anon, authenticated;
revoke all on sequence public.pilot_events_id_seq from public, anon, authenticated;

grant select, insert, update on public.pilot_update_signups to service_role;
grant select, insert, update on public.pilot_feedback to service_role;
grant select, insert on public.pilot_events to service_role;
grant usage, select on sequence public.pilot_update_signups_id_seq to service_role;
grant usage, select on sequence public.pilot_feedback_id_seq to service_role;
grant usage, select on sequence public.pilot_events_id_seq to service_role;

comment on table public.pilot_update_signups is
  'Private consent ledger for invitation-only Ecosystem Intelligence preview updates.';
comment on table public.pilot_feedback is
  'Private, unauthenticated design-partner feedback staged for product review.';
comment on table public.pilot_events is
  'Private, low-volume interaction events for the invitation-only preview.';
