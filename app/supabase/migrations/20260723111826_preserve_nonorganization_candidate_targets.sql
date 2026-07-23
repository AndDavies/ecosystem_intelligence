-- candidate_changes.published_entity_id is an organization foreign key from the
-- original publication workflow. Demand refreshes keep their canonical target
-- in target_entity_id and the audit event instead of overloading that column.

create or replace function public.preserve_candidate_published_organization_reference()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if new.candidate_kind not in ('organization_bundle', 'organization_refresh_bundle') then
    new.published_entity_id := null;
  end if;
  return new;
end;
$$;

drop trigger if exists preserve_candidate_published_organization_reference_trigger
  on public.candidate_changes;
create trigger preserve_candidate_published_organization_reference_trigger
before insert or update of candidate_kind, published_entity_id
on public.candidate_changes
for each row execute function public.preserve_candidate_published_organization_reference();

revoke all on function public.preserve_candidate_published_organization_reference()
  from public, anon, authenticated;

comment on function public.preserve_candidate_published_organization_reference()
is 'Keeps the legacy organization-only published_entity_id foreign key null for demand and other non-organization candidates; their canonical targets remain in target_entity_id and audit metadata.';
