create table if not exists shortlists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  use_case_id text not null references use_cases(id) on delete cascade,
  description text,
  creator_id uuid references profiles(id) on delete set null,
  creator_email text not null,
  creator_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists shortlist_items (
  id uuid primary key default gen_random_uuid(),
  shortlist_id uuid not null references shortlists(id) on delete cascade,
  capability_id text references capabilities(id) on delete cascade,
  company_id text references companies(id) on delete cascade,
  status text not null default 'watch' check (status in ('watch', 'validate', 'engage', 'hold')),
  owner text,
  next_step text,
  due_date date,
  rationale text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (capability_id is not null or company_id is not null)
);

create index if not exists shortlists_use_case_idx on shortlists (use_case_id, updated_at desc);
create index if not exists shortlist_items_shortlist_idx on shortlist_items (shortlist_id, updated_at desc);
create index if not exists shortlist_items_status_idx on shortlist_items (status);

alter table shortlists enable row level security;
alter table shortlist_items enable row level security;

create policy "authenticated read shortlists" on shortlists for select to authenticated using (true);
create policy "authenticated read shortlist_items" on shortlist_items for select to authenticated using (true);
