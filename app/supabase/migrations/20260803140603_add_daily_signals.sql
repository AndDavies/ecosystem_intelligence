-- Daily Signals are an automated, source-bounded editorial read. They are
-- deliberately isolated from organizations, capabilities, Public Needs,
-- evidence snippets, and every research/review publication table.
create table public.signal_editions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and length(slug) between 20 and 90
  ),
  edition_date date not null unique,
  title text not null check (length(trim(title)) between 12 and 180),
  executive_summary text not null check (length(trim(executive_summary)) between 400 and 1800),
  hero_image_path text,
  hero_image_source_url text check (hero_image_source_url is null or hero_image_source_url ~ '^https://'),
  hero_image_alt text check (hero_image_alt is null or length(trim(hero_image_alt)) between 12 and 240),
  hero_image_attribution text check (hero_image_attribution is null or length(trim(hero_image_attribution)) between 3 and 240),
  publication_status text not null default 'published' check (publication_status in ('published', 'archived')),
  automation_disclosure text not null default 'An automated, source-bounded read prepared from durable public sources. Review the linked evidence before acting.',
  author_name text not null default 'True North Map',
  run_id text not null unique check (length(trim(run_id)) between 8 and 160),
  published_at timestamptz not null default now(),
  amended_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.signal_items (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.signal_editions(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  position smallint not null check (position between 1 and 8),
  title text not null check (length(trim(title)) between 8 and 180),
  lane text not null check (lane in (
    'public_need_procurement', 'company_capability', 'funding_industrial_capacity',
    'testing_program', 'allied_benchmark'
  )),
  tags text[] not null check (
    cardinality(tags) between 1 and 6
    and tags <@ array[
      'air', 'land', 'maritime', 'space', 'cyber', 'arctic',
      'public_need', 'procurement', 'funding', 'testing', 'production',
      'partnership', 'policy', 'allied', 'autonomy',
      'artificial_intelligence', 'sensors', 'communications', 'undersea'
    ]::text[]
  ),
  bottom_line text not null check (length(trim(bottom_line)) between 30 and 500),
  executive_summary text not null check (length(trim(executive_summary)) between 450 and 2200),
  source_fact text not null check (length(trim(source_fact)) between 30 and 900),
  automated_read text not null check (length(trim(automated_read)) between 30 and 900),
  unknowns text not null check (length(trim(unknowns)) between 20 and 600),
  next_step text not null check (length(trim(next_step)) between 20 and 500),
  confidence text not null check (confidence in ('high', 'medium', 'limited')),
  event_fingerprint text not null,
  content_hash text not null,
  material_update boolean not null default false,
  publication_status text not null default 'published' check (publication_status in ('published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (edition_id, slug),
  unique (edition_id, position)
);

create table public.signal_sources (
  id uuid primary key default gen_random_uuid(),
  canonical_url text not null unique check (canonical_url ~ '^https://'),
  title text not null check (length(trim(title)) between 4 and 240),
  publisher text not null check (length(trim(publisher)) between 2 and 160),
  published_at timestamptz,
  accessed_at timestamptz not null default now(),
  source_family text not null,
  authority text not null check (authority in ('primary', 'official', 'specialist')),
  evidence_locator text not null check (length(trim(evidence_locator)) between 3 and 300),
  evidence_excerpt text not null check (length(trim(evidence_excerpt)) between 20 and 1000),
  content_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.signal_item_sources (
  item_id uuid not null references public.signal_items(id) on delete cascade,
  source_id uuid not null references public.signal_sources(id) on delete restrict,
  is_primary boolean not null default false,
  display_order smallint not null default 0,
  created_at timestamptz not null default now(),
  primary key (item_id, source_id)
);

create table public.signal_record_links (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.signal_items(id) on delete cascade,
  record_type text not null check (record_type in ('organization', 'capability', 'demand_requirement', 'mission_area')),
  record_id uuid not null,
  relationship_label text not null check (length(trim(relationship_label)) between 3 and 160),
  public_href text not null check (public_href ~ '^/(organizations|capabilities|demand|missions)/[a-z0-9-]+$'),
  display_order smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (item_id, record_type, record_id)
);

create table public.signal_runs (
  id uuid primary key default gen_random_uuid(),
  run_id text not null unique,
  status text not null check (status in ('started', 'published', 'no_publish', 'failed')),
  inspected_count integer not null default 0,
  selected_count integer not null default 0,
  source_family_count integer not null default 0,
  edition_id uuid references public.signal_editions(id) on delete set null,
  report jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.signal_social_drafts (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.signal_editions(id) on delete cascade,
  item_id uuid references public.signal_items(id) on delete cascade,
  platform text not null check (platform in ('linkedin', 'x')),
  draft_text text not null check (length(trim(draft_text)) between 20 and 5000),
  status text not null default 'draft' check (status in ('draft', 'copied', 'discarded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index signal_editions_public_idx on public.signal_editions (publication_status, edition_date desc);
create index signal_items_edition_idx on public.signal_items (edition_id, publication_status, position);
create index signal_items_fingerprint_idx on public.signal_items (event_fingerprint, created_at desc);
create index signal_items_tags_idx on public.signal_items using gin (tags);
create index signal_item_sources_item_idx on public.signal_item_sources (item_id, display_order);
create index signal_record_links_item_idx on public.signal_record_links (item_id, display_order);

alter table public.signal_editions enable row level security;
alter table public.signal_items enable row level security;
alter table public.signal_sources enable row level security;
alter table public.signal_item_sources enable row level security;
alter table public.signal_record_links enable row level security;
alter table public.signal_runs enable row level security;
alter table public.signal_social_drafts enable row level security;

create policy "published signal editions are public" on public.signal_editions
for select to anon, authenticated
using (publication_status = 'published' or (select private.is_atlas_staff()));

create policy "published signal items are public" on public.signal_items
for select to anon, authenticated
using (
  (publication_status = 'published' and exists (
    select 1 from public.signal_editions edition
    where edition.id = signal_items.edition_id and edition.publication_status = 'published'
  )) or (select private.is_atlas_staff())
);

create policy "published signal sources are public" on public.signal_sources
for select to anon, authenticated
using (exists (
  select 1 from public.signal_item_sources link
  join public.signal_items item on item.id = link.item_id and item.publication_status = 'published'
  join public.signal_editions edition on edition.id = item.edition_id and edition.publication_status = 'published'
  where link.source_id = signal_sources.id
) or (select private.is_atlas_staff()));

create policy "published signal source links are public" on public.signal_item_sources
for select to anon, authenticated
using (exists (
  select 1 from public.signal_items item
  join public.signal_editions edition on edition.id = item.edition_id
  where item.id = signal_item_sources.item_id
    and item.publication_status = 'published' and edition.publication_status = 'published'
) or (select private.is_atlas_staff()));

create policy "published signal record links are public" on public.signal_record_links
for select to anon, authenticated
using (exists (
  select 1 from public.signal_items item
  join public.signal_editions edition on edition.id = item.edition_id
  where item.id = signal_record_links.item_id
    and item.publication_status = 'published' and edition.publication_status = 'published'
) or (select private.is_atlas_staff()));

create policy "atlas administrator creates signal editions" on public.signal_editions for insert to authenticated with check ((select private.is_atlas_staff()));
create policy "atlas administrator updates signal editions" on public.signal_editions for update to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas administrator deletes signal editions" on public.signal_editions for delete to authenticated using ((select private.is_atlas_staff()));
create policy "atlas administrator creates signal items" on public.signal_items for insert to authenticated with check ((select private.is_atlas_staff()));
create policy "atlas administrator updates signal items" on public.signal_items for update to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas administrator deletes signal items" on public.signal_items for delete to authenticated using ((select private.is_atlas_staff()));
create policy "atlas administrator creates signal sources" on public.signal_sources for insert to authenticated with check ((select private.is_atlas_staff()));
create policy "atlas administrator updates signal sources" on public.signal_sources for update to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas administrator deletes signal sources" on public.signal_sources for delete to authenticated using ((select private.is_atlas_staff()));
create policy "atlas administrator creates signal source links" on public.signal_item_sources for insert to authenticated with check ((select private.is_atlas_staff()));
create policy "atlas administrator updates signal source links" on public.signal_item_sources for update to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas administrator deletes signal source links" on public.signal_item_sources for delete to authenticated using ((select private.is_atlas_staff()));
create policy "atlas administrator creates signal record links" on public.signal_record_links for insert to authenticated with check ((select private.is_atlas_staff()));
create policy "atlas administrator updates signal record links" on public.signal_record_links for update to authenticated using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));
create policy "atlas administrator deletes signal record links" on public.signal_record_links for delete to authenticated using ((select private.is_atlas_staff()));
create policy "atlas administrator reads signal runs" on public.signal_runs for select to authenticated
using ((select private.is_atlas_staff()));
create policy "atlas administrator manages signal social drafts" on public.signal_social_drafts for all to authenticated
using ((select private.is_atlas_staff())) with check ((select private.is_atlas_staff()));

grant select on public.signal_editions, public.signal_items, public.signal_sources, public.signal_item_sources, public.signal_record_links to anon;
grant select, insert, update, delete on public.signal_editions, public.signal_items, public.signal_sources, public.signal_item_sources, public.signal_record_links to authenticated;
grant all on public.signal_editions, public.signal_items, public.signal_sources, public.signal_item_sources, public.signal_record_links to service_role;
grant select on public.signal_runs, public.signal_social_drafts to authenticated;
grant all on public.signal_runs, public.signal_social_drafts to service_role;

comment on table public.signal_editions is 'Automatically published weekday Signals editions. These are source-bounded editorial reads, not core corpus evidence or human-reviewed matches.';
comment on column public.signal_editions.slug is 'Immutable descriptive SEO slug. Corrections retain the original canonical URL.';
comment on table public.signal_runs is 'Private operational run state. RLS restricts browser access to the exact True North Map administrator.';
comment on table public.signal_social_drafts is 'Private suggested LinkedIn and X copy. RLS restricts access to the administrator and no row authorizes automatic external posting.';

-- Prevent an edition URL from changing after first publication. Corrections
-- update the copy and amended_at while retaining the stable canonical slug.
create or replace function private.prevent_signal_slug_change()
returns trigger language plpgsql security invoker set search_path = pg_catalog as $$
begin
  if old.slug is distinct from new.slug then
    raise exception 'Published Signal slugs are immutable.' using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger signal_edition_slug_immutable
before update of slug on public.signal_editions
for each row execute function private.prevent_signal_slug_change();
