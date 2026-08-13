-- Remove private review/run lineage from the public organization JSON column.
-- Candidate, reviewer, schema and ingestion lineage remain in candidate_changes,
-- review_decisions, research_runs and audit_events. Apply only after the
-- compatible application projection is deployed. This cleanup is irreversible;
-- rollback removes the guard but cannot reconstruct deleted JSON values.

create or replace function private.strip_internal_organization_profile_lineage()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.profile_data := coalesce(new.profile_data, '{}'::jsonb)
    - 'reviewed_candidate_id'
    - 'reviewed_by'
    - 'research_schema_version'
    - 'ingestion_batch_id';
  return new;
end;
$$;

revoke all on function private.strip_internal_organization_profile_lineage() from public, anon, authenticated;

drop trigger if exists organizations_strip_internal_profile_lineage on public.organizations;
create trigger organizations_strip_internal_profile_lineage
before insert or update of profile_data on public.organizations
for each row execute function private.strip_internal_organization_profile_lineage();

-- This is metadata sanitation, not an editorial record change. Preserve every
-- canonical updated_at baseline so pending or approved refresh candidates do
-- not become stale solely because private lineage moved out of the public JSON
-- projection. ALTER TABLE takes the required lock; a migration failure rolls
-- the trigger state back with the transaction.
alter table public.organizations disable trigger organizations_set_updated_at;

update public.organizations
set profile_data = profile_data
  - 'reviewed_candidate_id'
  - 'reviewed_by'
  - 'research_schema_version'
  - 'ingestion_batch_id'
where profile_data ?| array[
  'reviewed_candidate_id',
  'reviewed_by',
  'research_schema_version',
  'ingestion_batch_id'
]::text[];

alter table public.organizations enable trigger organizations_set_updated_at;

alter table public.organizations
  drop constraint if exists organizations_profile_data_excludes_internal_lineage;
alter table public.organizations
  add constraint organizations_profile_data_excludes_internal_lineage
  check (not (profile_data ?| array[
    'reviewed_candidate_id',
    'reviewed_by',
    'research_schema_version',
    'ingestion_batch_id'
  ]::text[])) not valid;
alter table public.organizations
  validate constraint organizations_profile_data_excludes_internal_lineage;

comment on function private.strip_internal_organization_profile_lineage()
is 'Keeps private review, research schema and ingestion lineage out of the public organizations.profile_data column.';

comment on constraint organizations_profile_data_excludes_internal_lineage on public.organizations
is 'Private review and run lineage belongs in private workflow/audit tables, never in the public organization JSON payload.';
