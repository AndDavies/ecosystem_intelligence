-- Enforce private workflow invariants at the direct Data API boundary.
-- These controls do not accept research candidates or publish canonical data.
drop policy "members or staff create submissions" on public.submissions;
create policy "members or staff create submissions" on public.submissions
  for insert to authenticated
  with check (
    ((select auth.uid()) = owner_id and status = 'pending')
    or (select private.is_atlas_staff())
  );

create function private.protect_member_workflow_created_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if (select auth.uid()) is not null and not (select private.is_atlas_staff()) then
    if tg_op = 'INSERT' then
      new.created_at := statement_timestamp();
    else
      new.created_at := old.created_at;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.protect_member_workflow_created_at() from public, anon, authenticated, service_role;

create trigger submissions_created_at_guard
before insert or update on public.submissions
for each row execute function private.protect_member_workflow_created_at();

create trigger connection_requests_created_at_guard
before insert or update on public.connection_requests
for each row execute function private.protect_member_workflow_created_at();

-- Mirror the existing Working List form contract without rewriting any content.
alter table public.saved_collections
  add constraint saved_collections_name_length check (char_length(btrim(name)) between 2 and 100),
  add constraint saved_collections_description_length check (description is null or char_length(description) <= 500);
alter table public.saved_collection_items
  add constraint saved_collection_items_note_length check (note is null or char_length(note) <= 500);
