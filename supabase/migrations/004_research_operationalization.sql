alter table companies
  add column if not exists data_stage text not null default 'scaffold',
  add column if not exists source_confidence text not null default 'needs_validation',
  add column if not exists research_rationale text,
  add column if not exists source_batch_id text;

alter table capabilities
  add column if not exists data_stage text not null default 'scaffold',
  add column if not exists source_confidence text not null default 'needs_validation',
  add column if not exists research_rationale text,
  add column if not exists source_batch_id text;

alter table capability_use_cases
  add column if not exists data_stage text not null default 'scaffold',
  add column if not exists source_confidence text not null default 'needs_validation',
  add column if not exists research_rationale text,
  add column if not exists source_batch_id text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'companies_data_stage_check'
  ) then
    alter table companies
      add constraint companies_data_stage_check
      check (data_stage in ('scaffold', 'candidate', 'validated', 'deprecated'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'companies_source_confidence_check'
  ) then
    alter table companies
      add constraint companies_source_confidence_check
      check (source_confidence in ('high', 'moderate', 'needs_validation'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'capabilities_data_stage_check'
  ) then
    alter table capabilities
      add constraint capabilities_data_stage_check
      check (data_stage in ('scaffold', 'candidate', 'validated', 'deprecated'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'capabilities_source_confidence_check'
  ) then
    alter table capabilities
      add constraint capabilities_source_confidence_check
      check (source_confidence in ('high', 'moderate', 'needs_validation'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'capability_use_cases_data_stage_check'
  ) then
    alter table capability_use_cases
      add constraint capability_use_cases_data_stage_check
      check (data_stage in ('scaffold', 'candidate', 'validated', 'deprecated'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'capability_use_cases_source_confidence_check'
  ) then
    alter table capability_use_cases
      add constraint capability_use_cases_source_confidence_check
      check (source_confidence in ('high', 'moderate', 'needs_validation'));
  end if;
end $$;

create table if not exists research_batches (
  id text primary key,
  title text not null,
  batch_type text not null default 'candidate' check (batch_type in ('source_leads', 'candidate')),
  status text not null default 'staged' check (status in ('staged', 'reviewed', 'promoted', 'rejected', 'superseded')),
  scope_description text not null,
  target_use_case_ids text[] not null default '{}',
  target_domain_ids text[] not null default '{}',
  file_path text,
  promotion_log_path text,
  reviewer_name text,
  reviewer_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  promoted_at timestamptz
);

create table if not exists research_batch_records (
  id uuid primary key default gen_random_uuid(),
  batch_id text not null references research_batches(id) on delete cascade,
  entity_type text not null check (entity_type in ('company', 'capability', 'capability_use_case', 'source', 'signal')),
  entity_id text not null,
  record_status text not null default 'candidate' check (record_status in ('candidate', 'accepted', 'rejected', 'promoted', 'superseded')),
  reviewer_note text,
  created_at timestamptz not null default now(),
  unique (batch_id, entity_type, entity_id)
);

create index if not exists companies_data_stage_idx on companies (data_stage, source_confidence);
create index if not exists capabilities_data_stage_idx on capabilities (data_stage, source_confidence);
create index if not exists capability_use_cases_data_stage_idx on capability_use_cases (data_stage, source_confidence);
create index if not exists research_batches_status_idx on research_batches (status, created_at desc);
create index if not exists research_batch_records_batch_idx on research_batch_records (batch_id, entity_type);

alter table research_batches enable row level security;
alter table research_batch_records enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'research_batches'
      and policyname = 'authenticated read research_batches'
  ) then
    create policy "authenticated read research_batches"
      on research_batches for select to authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'research_batch_records'
      and policyname = 'authenticated read research_batch_records'
  ) then
    create policy "authenticated read research_batch_records"
      on research_batch_records for select to authenticated using (true);
  end if;
end $$;

update companies
set
  data_stage = 'validated',
  source_confidence = 'high',
  research_rationale = coalesce(research_rationale, 'Promoted real-data pilot record with public-source evidence and human review.'),
  source_batch_id = coalesce(source_batch_id, 'pilot-arctic-domain-awareness-2026-04-24')
where id like 'pilot-company-%';

update capabilities
set
  data_stage = 'validated',
  source_confidence = 'high',
  research_rationale = coalesce(research_rationale, 'Promoted real-data pilot capability with public-source evidence and human review.'),
  source_batch_id = coalesce(source_batch_id, 'pilot-arctic-domain-awareness-2026-04-24')
where id like 'pilot-capability-%';

update capability_use_cases
set
  data_stage = 'validated',
  source_confidence = 'high',
  research_rationale = coalesce(research_rationale, 'Promoted real-data pilot mapping with public-source evidence and human review.'),
  source_batch_id = coalesce(source_batch_id, 'pilot-arctic-domain-awareness-2026-04-24')
where id like 'pilot-cuc-%';
