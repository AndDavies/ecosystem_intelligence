-- Keep related-record links on public Defence Briefs resolvable through the
-- same published-record boundary used by the public application. This trigger
-- protects the database contract even if an authenticated administrator sends
-- a stale or hand-edited payload instead of using the bounded editor options.

create or replace function private.validate_wiki_page_record_link_visibility()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if new.record_type = 'organization' then
    if not exists (
      select 1 from public.organizations organization_record
      where organization_record.id = new.record_id
        and organization_record.publication_status = 'published'
    ) then
      raise exception 'A Defence Brief can link only to a published organization.' using errcode = '22023';
    end if;
  elsif new.record_type = 'capability' then
    if not exists (
      select 1
      from public.capabilities capability_record
      join public.organizations organization_record
        on organization_record.id = capability_record.organization_id
      where capability_record.id = new.record_id
        and capability_record.publication_status = 'published'
        and organization_record.publication_status = 'published'
    ) then
      raise exception 'A Defence Brief can link only to a published capability on a published organization.' using errcode = '22023';
    end if;
  elsif new.record_type = 'demand_requirement' then
    if not exists (
      select 1
      from public.demand_requirements demand_record
      join public.demand_sources demand_source_record
        on demand_source_record.id = demand_record.demand_source_id
      join public.evidence_snippets evidence_record
        on evidence_record.id = demand_source_record.source_evidence_snippet_id
      where demand_record.id = new.record_id
        and demand_record.publication_status = 'published'
        and demand_source_record.publication_status = 'published'
        and demand_source_record.source_visibility = 'public'
        and demand_source_record.source_verified_at is not null
        and demand_source_record.source_verified_by is not null
        and evidence_record.source_id = demand_source_record.source_id
        and evidence_record.visibility = 'public'
        and evidence_record.public_approved
    ) then
      raise exception 'A Defence Brief can link only to a published Public Need with verified public source evidence.' using errcode = '22023';
    end if;
  else
    raise exception 'Unsupported Defence Brief related-record type.' using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_wiki_page_record_link_visibility()
from public, anon, authenticated;

-- Fail closed if a previously stored link does not satisfy the same target
-- boundary. This migration must not make an invalid relationship public merely
-- because it predates the write trigger.
do $$
begin
  if exists (
    select 1
    from public.wiki_page_record_links link
    where not (
      (link.record_type = 'organization' and exists (
        select 1 from public.organizations organization_record
        where organization_record.id = link.record_id
          and organization_record.publication_status = 'published'
      ))
      or (link.record_type = 'capability' and exists (
        select 1
        from public.capabilities capability_record
        join public.organizations organization_record
          on organization_record.id = capability_record.organization_id
        where capability_record.id = link.record_id
          and capability_record.publication_status = 'published'
          and organization_record.publication_status = 'published'
      ))
      or (link.record_type = 'demand_requirement' and exists (
        select 1
        from public.demand_requirements demand_record
        join public.demand_sources demand_source_record
          on demand_source_record.id = demand_record.demand_source_id
        join public.evidence_snippets evidence_record
          on evidence_record.id = demand_source_record.source_evidence_snippet_id
        where demand_record.id = link.record_id
          and demand_record.publication_status = 'published'
          and demand_source_record.publication_status = 'published'
          and demand_source_record.source_visibility = 'public'
          and demand_source_record.source_verified_at is not null
          and demand_source_record.source_verified_by is not null
          and evidence_record.source_id = demand_source_record.source_id
          and evidence_record.visibility = 'public'
          and evidence_record.public_approved
      ))
    )
  ) then
    raise exception 'Existing Defence Brief related-record links include a target outside the published boundary.' using errcode = '23514';
  end if;
end;
$$;

-- Public readers must continue to satisfy the target boundary after a linked
-- organization, capability, source, or Public Need changes state. The separate
-- staff management policy continues to expose private editor state to staff.
drop policy if exists "published defence brief links are public"
on public.wiki_page_record_links;
drop policy if exists "published defence brief links are public for authenticated"
on public.wiki_page_record_links;

create policy "published defence brief links are public"
on public.wiki_page_record_links for select to anon
using (
  exists (
    select 1
    from public.wiki_pages page_record
    where page_record.id = wiki_page_record_links.page_id
      and page_record.publication_status = 'published'
  )
  and (
    (record_type = 'organization' and exists (
      select 1 from public.organizations organization_record
      where organization_record.id = wiki_page_record_links.record_id
        and organization_record.publication_status = 'published'
    ))
    or (record_type = 'capability' and exists (
      select 1
      from public.capabilities capability_record
      join public.organizations organization_record
        on organization_record.id = capability_record.organization_id
      where capability_record.id = wiki_page_record_links.record_id
        and capability_record.publication_status = 'published'
        and organization_record.publication_status = 'published'
    ))
    or (record_type = 'demand_requirement' and exists (
      select 1
      from public.demand_requirements demand_record
      join public.demand_sources demand_source_record
        on demand_source_record.id = demand_record.demand_source_id
      join public.evidence_snippets evidence_record
        on evidence_record.id = demand_source_record.source_evidence_snippet_id
      where demand_record.id = wiki_page_record_links.record_id
        and demand_record.publication_status = 'published'
        and demand_source_record.publication_status = 'published'
        and demand_source_record.source_visibility = 'public'
        and demand_source_record.source_verified_at is not null
        and demand_source_record.source_verified_by is not null
        and evidence_record.source_id = demand_source_record.source_id
        and evidence_record.visibility = 'public'
        and evidence_record.public_approved
    ))
  )
);

create policy "published defence brief links are public for authenticated"
on public.wiki_page_record_links for select to authenticated
using (
  (
    exists (
      select 1
      from public.wiki_pages page_record
      where page_record.id = wiki_page_record_links.page_id
        and page_record.publication_status = 'published'
    )
    and (
      (record_type = 'organization' and exists (
        select 1 from public.organizations organization_record
        where organization_record.id = wiki_page_record_links.record_id
          and organization_record.publication_status = 'published'
      ))
      or (record_type = 'capability' and exists (
        select 1
        from public.capabilities capability_record
        join public.organizations organization_record
          on organization_record.id = capability_record.organization_id
        where capability_record.id = wiki_page_record_links.record_id
          and capability_record.publication_status = 'published'
          and organization_record.publication_status = 'published'
      ))
      or (record_type = 'demand_requirement' and exists (
        select 1
        from public.demand_requirements demand_record
        join public.demand_sources demand_source_record
          on demand_source_record.id = demand_record.demand_source_id
        join public.evidence_snippets evidence_record
          on evidence_record.id = demand_source_record.source_evidence_snippet_id
        where demand_record.id = wiki_page_record_links.record_id
          and demand_record.publication_status = 'published'
          and demand_source_record.publication_status = 'published'
          and demand_source_record.source_visibility = 'public'
          and demand_source_record.source_verified_at is not null
          and demand_source_record.source_verified_by is not null
          and evidence_record.source_id = demand_source_record.source_id
          and evidence_record.visibility = 'public'
          and evidence_record.public_approved
      ))
    )
  )
  or (select private.is_atlas_staff())
);

drop trigger if exists wiki_page_record_links_validate_visibility
on public.wiki_page_record_links;
create trigger wiki_page_record_links_validate_visibility
before insert or update of page_id, record_type, record_id
on public.wiki_page_record_links
for each row execute function private.validate_wiki_page_record_link_visibility();

comment on function private.validate_wiki_page_record_link_visibility()
is 'Rejects Defence Brief record links that are not resolvable through the current published organization, capability, or verified Public Need boundary.';
