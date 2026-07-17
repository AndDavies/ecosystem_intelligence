-- Private design-partner search telemetry. Submitted queries are stored apart
-- from generic interaction events so they can have a shorter retention window
-- and remain inaccessible to public Data API roles.

create table public.pilot_searches (
  id uuid primary key default gen_random_uuid(),
  request_hash text not null check (char_length(request_hash) = 64),
  session_id uuid,
  query_text text not null check (char_length(query_text) between 1 and 500),
  normalized_query text not null check (char_length(normalized_query) between 1 and 500),
  interpretation text not null
    check (interpretation in ('matched', 'ambiguous', 'no_match')),
  resolved_filters jsonb not null default '{}'::jsonb
    check (jsonb_typeof(resolved_filters) = 'object'),
  result_count integer not null check (result_count >= 0),
  zero_result boolean not null,
  context_path text not null
    check (context_path like '/%' and char_length(context_path) <= 500),
  cohort text check (cohort is null or char_length(cohort) <= 120),
  expires_at timestamptz not null default (now() + interval '90 days'),
  created_at timestamptz not null default now(),
  check (zero_result = (result_count = 0)),
  check (expires_at > created_at)
);

create index pilot_searches_created_idx
  on public.pilot_searches (created_at desc);
create index pilot_searches_zero_result_idx
  on public.pilot_searches (zero_result, created_at desc);
create index pilot_searches_session_idx
  on public.pilot_searches (session_id, created_at desc)
  where session_id is not null;
create index pilot_searches_expiry_idx
  on public.pilot_searches (expires_at);

alter table public.pilot_events
  add column session_id uuid,
  add column search_id uuid references public.pilot_searches(id) on delete set null;

alter table public.pilot_events
  drop constraint if exists pilot_events_event_name_check;

alter table public.pilot_events
  add constraint pilot_events_event_name_check check (event_name in (
    'page_view',
    'atlas_search',
    'filter_apply',
    'marker_select',
    'result_select',
    'dossier_open',
    'evidence_open',
    'export',
    'signup',
    'feedback'
  ));

create index pilot_events_session_created_idx
  on public.pilot_events (session_id, created_at desc)
  where session_id is not null;
create index pilot_events_search_created_idx
  on public.pilot_events (search_id, created_at asc)
  where search_id is not null;

alter table public.pilot_searches enable row level security;

revoke all on public.pilot_searches from public, anon, authenticated;
grant select, insert, delete on public.pilot_searches to service_role;

comment on table public.pilot_searches is
  'Private submitted search terms, interpretations, and result counts for the invitation-only preview; raw terms expire after 90 days.';
comment on column public.pilot_searches.session_id is
  'Random per-tab identifier used to connect search and semantic workflow events without identifying a person.';
comment on column public.pilot_events.search_id is
  'Optional attribution to the private submitted search that preceded this semantic event.';
