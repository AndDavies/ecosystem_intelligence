-- Reconcile mission-area realism schema for environments where migration 002
-- is marked as applied but the use_cases columns are missing.
alter table use_cases
  add column if not exists priority_tier text not null default 'p3',
  add column if not exists use_case_kind text not null default 'mission',
  add column if not exists partner_frames text[] not null default '{}',
  add column if not exists policy_anchors text[] not null default '{}',
  add column if not exists operational_owner text not null default 'Internal mission owner',
  add column if not exists mission_context text not null default 'Public-priority aligned mission context pending refinement.',
  add column if not exists required_decision text not null default 'Determine whether mapped capabilities merit engagement, validation, monitoring, or procurement-facing review.',
  add column if not exists interoperability_boundary text not null default 'Public-source interoperability boundary pending refinement.',
  add column if not exists mission_outcome text not null default 'Improve mission decision quality using public-source capability intelligence.',
  add column if not exists procurement_pathway text not null default 'Monitor or validate before procurement-facing engagement.',
  add column if not exists realism_note text not null default 'Public-source alignment only; not a classified requirement or target.';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'use_cases_priority_tier_check'
  ) then
    alter table use_cases
      add constraint use_cases_priority_tier_check
      check (priority_tier in ('p1', 'p2', 'p3'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'use_cases_use_case_kind_check'
  ) then
    alter table use_cases
      add constraint use_cases_use_case_kind_check
      check (use_case_kind in ('mission', 'enabling'));
  end if;
end $$;
