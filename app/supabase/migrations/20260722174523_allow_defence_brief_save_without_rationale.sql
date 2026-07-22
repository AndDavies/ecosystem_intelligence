-- The Defence Briefs workspace is restricted to the sole atlas administrator.
-- Preserve the existing review, evidence, and audit controls while removing the
-- need to write a separate rationale for every save or publication action.
create or replace function public.upsert_defence_brief(
  p_page_id uuid,
  p_reviewer_id uuid,
  p_payload jsonb,
  p_source_links jsonb,
  p_record_links jsonb,
  p_rationale text default null
)
returns uuid
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $$
declare
  managed_page_id uuid;
  requested_status text := coalesce(p_payload->>'publicationStatus', 'draft');
  source_link jsonb;
  record_link jsonb;
begin
  if not private.is_atlas_staff() or auth.uid() is distinct from p_reviewer_id then
    raise exception 'Defence brief changes require the authenticated administrator.' using errcode = '42501';
  end if;
  if requested_status not in ('draft', 'published', 'archived')
     or coalesce(p_payload->>'slug', '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
     or length(trim(coalesce(p_payload->>'title', ''))) < 8
     or length(trim(coalesce(p_payload->>'primaryQuestion', ''))) < 12
     or length(trim(coalesce(p_payload->>'summaryAnswer', ''))) < 40
     or length(trim(coalesce(p_payload->>'dek', ''))) < 40
     or jsonb_typeof(p_payload->'sections') <> 'array'
     or jsonb_array_length(p_payload->'sections') < 1
     or length(trim(coalesce(p_payload->>'seoTitle', ''))) < 8
     or length(trim(coalesce(p_payload->>'metaDescription', ''))) < 40
     or jsonb_typeof(p_source_links) <> 'array'
     or (requested_status = 'published' and jsonb_array_length(p_source_links) < 1)
     or jsonb_typeof(p_record_links) <> 'array' then
    raise exception 'The defence brief payload is incomplete.' using errcode = '22023';
  end if;

  if p_page_id is null then
    insert into public.wiki_pages (
      slug, title, primary_question, summary_answer, dek, sections, derived_read,
      seo_title, meta_description, author_name, publication_status,
      reviewed_by, reviewed_at, published_at
    ) values (
      p_payload->>'slug', trim(p_payload->>'title'), trim(p_payload->>'primaryQuestion'),
      trim(p_payload->>'summaryAnswer'), trim(p_payload->>'dek'), p_payload->'sections',
      nullif(trim(p_payload->>'derivedRead'), ''), trim(p_payload->>'seoTitle'),
      trim(p_payload->>'metaDescription'), coalesce(nullif(trim(p_payload->>'authorName'), ''), 'Andrew Davies'),
      requested_status, case when requested_status = 'published' then p_reviewer_id end,
      case when requested_status = 'published' then now() end,
      case when requested_status = 'published' then now() end
    ) returning id into managed_page_id;
  else
    managed_page_id := p_page_id;
    update public.wiki_pages set
      slug = p_payload->>'slug', title = trim(p_payload->>'title'),
      primary_question = trim(p_payload->>'primaryQuestion'), summary_answer = trim(p_payload->>'summaryAnswer'),
      dek = trim(p_payload->>'dek'), sections = p_payload->'sections',
      derived_read = nullif(trim(p_payload->>'derivedRead'), ''), seo_title = trim(p_payload->>'seoTitle'),
      meta_description = trim(p_payload->>'metaDescription'),
      author_name = coalesce(nullif(trim(p_payload->>'authorName'), ''), author_name),
      publication_status = requested_status,
      reviewed_by = case when requested_status = 'published' then p_reviewer_id else reviewed_by end,
      reviewed_at = case when requested_status = 'published' then now() else reviewed_at end,
      published_at = case when requested_status = 'published' then coalesce(published_at, now()) else published_at end,
      updated_at = now()
    where id = managed_page_id;
    if not found then raise exception 'The selected defence brief no longer exists.' using errcode = '22023'; end if;
  end if;

  delete from public.wiki_page_sources where page_id = managed_page_id;
  for source_link in select value from jsonb_array_elements(p_source_links) loop
    if not exists (
      select 1 from public.sources s
      where s.id = (source_link->>'sourceId')::uuid
        and s.visibility = 'public' and s.public_approved = true
    ) then raise exception 'Every brief source must be an approved public source.' using errcode = '22023'; end if;
    insert into public.wiki_page_sources (page_id, source_id, citation_note, display_order)
    values (managed_page_id, (source_link->>'sourceId')::uuid, trim(source_link->>'citationNote'), coalesce((source_link->>'displayOrder')::smallint, 0));
  end loop;

  delete from public.wiki_page_record_links where page_id = managed_page_id;
  for record_link in select value from jsonb_array_elements(p_record_links) loop
    if (record_link->>'recordType') not in ('organization', 'capability', 'demand_requirement') then
      raise exception 'Unsupported related-record type.' using errcode = '22023';
    end if;
    insert into public.wiki_page_record_links (page_id, record_type, record_id, relationship_label, display_order)
    values (managed_page_id, record_link->>'recordType', (record_link->>'recordId')::uuid, trim(record_link->>'relationshipLabel'), coalesce((record_link->>'displayOrder')::smallint, 0));
  end loop;

  insert into public.audit_events (actor_id, actor_role, event_type, entity_type, entity_id, summary, metadata)
  values (p_reviewer_id, 'admin', 'defence_brief_saved', 'wiki_page', managed_page_id,
    case when requested_status = 'published' then 'Administrator published a Canadian Defence Brief.' else 'Administrator saved a private Canadian Defence Brief.' end,
    jsonb_strip_nulls(jsonb_build_object(
      'rationale', nullif(trim(coalesce(p_rationale, '')), ''),
      'publication_status', requested_status,
      'source_count', jsonb_array_length(p_source_links)
    )));
  return managed_page_id;
end;
$$;

revoke all on function public.upsert_defence_brief(uuid, uuid, jsonb, jsonb, jsonb, text) from public, anon, authenticated;
grant execute on function public.upsert_defence_brief(uuid, uuid, jsonb, jsonb, jsonb, text) to authenticated;
