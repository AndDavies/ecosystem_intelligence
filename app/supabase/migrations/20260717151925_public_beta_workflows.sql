-- Public beta participation and connection workflows.
-- Personal information remains private. Public records are never changed by
-- these tables without a separate editorial decision and promotion step.

create table public.connection_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  intent text not null check (intent in (
    'partnership',
    'supplier_customer',
    'pilot_testing',
    'program_support',
    'investment',
    'other'
  )),
  message text not null check (char_length(message) between 20 and 2000),
  requester_name text not null check (char_length(requester_name) between 2 and 120),
  requester_organization text check (requester_organization is null or char_length(requester_organization) <= 180),
  requester_email text not null check (char_length(requester_email) between 3 and 320 and requester_email = lower(requester_email) and position('@' in requester_email) > 1),
  status text not null default 'new' check (status in ('new', 'reviewing', 'introduced', 'declined', 'closed')),
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewer_notes text check (reviewer_notes is null or char_length(reviewer_notes) <= 4000),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('general', 'privacy', 'media', 'partnership')),
  sender_name text not null check (char_length(sender_name) between 2 and 120),
  sender_email text not null check (char_length(sender_email) between 3 and 320 and sender_email = lower(sender_email) and position('@' in sender_email) > 1),
  organization_name text check (organization_name is null or char_length(organization_name) <= 180),
  message text not null check (char_length(message) between 20 and 4000),
  request_hash text not null check (char_length(request_hash) = 64),
  status text not null default 'new' check (status in ('new', 'reviewing', 'replied', 'closed', 'spam')),
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewer_notes text check (reviewer_notes is null or char_length(reviewer_notes) <= 4000),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index connection_requests_requester_created_idx
  on public.connection_requests (requester_id, created_at desc);
create index connection_requests_review_idx
  on public.connection_requests (status, created_at desc);
create index connection_requests_organization_idx
  on public.connection_requests (organization_id, created_at desc);
create index contact_messages_review_idx
  on public.contact_messages (status, created_at desc);
create index contact_messages_rate_limit_idx
  on public.contact_messages (request_hash, created_at desc);

create trigger connection_requests_set_updated_at
before update on public.connection_requests
for each row execute function private.set_updated_at();

create trigger contact_messages_set_updated_at
before update on public.contact_messages
for each row execute function private.set_updated_at();

alter table public.connection_requests enable row level security;
alter table public.contact_messages enable row level security;

revoke all on public.connection_requests from public, anon, authenticated;
revoke all on public.contact_messages from public, anon, authenticated;

grant select, insert on public.connection_requests to authenticated;
grant select, insert, update, delete on public.connection_requests to service_role;
grant select, insert, update, delete on public.contact_messages to service_role;

create policy "users create their own connection requests"
on public.connection_requests for insert to authenticated
with check ((select auth.uid()) = requester_id and status = 'new');

create policy "users read their own connection requests"
on public.connection_requests for select to authenticated
using ((select auth.uid()) = requester_id);

create policy "atlas staff manage connection requests"
on public.connection_requests for all to authenticated
using ((select private.is_atlas_staff()))
with check ((select private.is_atlas_staff()));

-- Contact messages are written only through the rate-limited server endpoint
-- using the server-side service role. They have no public Data API grants.

alter table public.pilot_events
  add column if not exists expires_at timestamptz not null default (now() + interval '30 days');

alter table public.pilot_events
  drop constraint if exists pilot_events_event_name_check;

-- Vercel Analytics owns generic page traffic in the public beta. Preserve
-- meaningful historical events while removing duplicate page-view telemetry.
delete from public.pilot_events where event_name = 'page_view';
update public.pilot_events set event_name = 'subscription' where event_name = 'signup';

alter table public.pilot_events
  add constraint pilot_events_event_name_check check (event_name in (
    'atlas_search',
    'filter_apply',
    'marker_select',
    'result_select',
    'dossier_open',
    'evidence_open',
    'export',
    'save',
    'submission',
    'connection',
    'subscription',
    'feedback'
  ));

create index if not exists pilot_events_expiry_idx
  on public.pilot_events (expires_at);

alter table public.pilot_update_signups
  alter column source set default 'public_beta_prompt';

comment on table public.connection_requests is
  'Private, user-initiated requests for a human-vetted introduction. No endorsement or automatic introduction is implied.';
comment on table public.contact_messages is
  'Private public-beta contact inbox for general, privacy, media, and partnership messages.';
comment on table public.pilot_update_signups is
  'Private consent ledger for occasional Ecosystem Intelligence public-beta updates.';
comment on table public.pilot_feedback is
  'Private public-beta feedback for product learning and voluntary follow-up.';
comment on table public.pilot_events is
  'Private, low-volume public-beta workflow events retained for 30 days.';
comment on table public.pilot_searches is
  'Private public-beta search telemetry retained for 90 days.';
