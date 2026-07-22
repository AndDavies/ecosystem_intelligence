-- Keep the currently deployed question-era editor functional until the new
-- article editor is deployed. The adapter normalizes old payload names into
-- the article contract, then delegates to the reviewed implementation.
alter function public.upsert_defence_brief(uuid, uuid, jsonb, jsonb, jsonb, text)
  rename to upsert_defence_article;

revoke all on function public.upsert_defence_article(uuid, uuid, jsonb, jsonb, jsonb, text)
  from public, anon, authenticated;

create function public.upsert_defence_brief(
  p_page_id uuid,
  p_reviewer_id uuid,
  p_payload jsonb,
  p_source_links jsonb,
  p_record_links jsonb,
  p_rationale text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  current_page public.wiki_pages%rowtype;
  normalized_payload jsonb;
begin
  if not private.is_atlas_staff() or auth.uid() is distinct from p_reviewer_id then
    raise exception 'Defence brief changes require the authenticated administrator.' using errcode = '42501';
  end if;

  if p_page_id is not null then
    select * into current_page from public.wiki_pages where id = p_page_id;
  end if;

  normalized_payload := p_payload || jsonb_build_object(
    'thesis', coalesce(nullif(p_payload->>'thesis', ''), p_payload->>'primaryQuestion', current_page.primary_question),
    'bottomLine', coalesce(nullif(p_payload->>'bottomLine', ''), p_payload->>'summaryAnswer', current_page.summary_answer),
    'standfirst', coalesce(nullif(p_payload->>'standfirst', ''), p_payload->>'dek', current_page.dek),
    'keyTakeaways', coalesce(p_payload->'keyTakeaways', current_page.key_takeaways, '[]'::jsonb),
    'implications', coalesce(p_payload->>'implications', p_payload->>'derivedRead', current_page.derived_read, ''),
    'limitations', coalesce(p_payload->>'limitations', current_page.limitations, ''),
    'recommendedAction', coalesce(p_payload->>'recommendedAction', current_page.recommended_action, ''),
    'format', coalesce(nullif(p_payload->>'format', ''), current_page.content_format, 'Explainer'),
    'topic', coalesce(nullif(p_payload->>'topic', ''), current_page.topic, 'Canadian defence'),
    'audience', coalesce(nullif(p_payload->>'audience', ''), current_page.audience, 'Canadian defence business-development and ecosystem leaders'),
    'heroImagePath', coalesce(p_payload->>'heroImagePath', current_page.hero_image_path, '/imagery/briefs/defence-briefs-home.jpg'),
    'heroImageAlt', coalesce(nullif(p_payload->>'heroImageAlt', ''), current_page.hero_image_alt, 'Editorial image for ' || coalesce(p_payload->>'title', 'a Canadian Defence Brief'))
  );

  return public.upsert_defence_article(
    p_page_id,
    p_reviewer_id,
    normalized_payload,
    p_source_links,
    p_record_links,
    p_rationale
  );
end;
$$;

revoke all on function public.upsert_defence_brief(uuid, uuid, jsonb, jsonb, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.upsert_defence_brief(uuid, uuid, jsonb, jsonb, jsonb, text)
  to authenticated;

comment on function public.upsert_defence_brief(uuid, uuid, jsonb, jsonb, jsonb, text)
  is 'Administrator-only compatibility adapter for the Defence Briefs article editor.';
