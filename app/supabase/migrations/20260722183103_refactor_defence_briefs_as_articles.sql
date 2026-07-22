-- Evolve Canadian Defence Briefs from question-and-answer pages into reviewed
-- editorial articles without introducing a second content table. The legacy
-- columns remain canonical storage for the thesis, bottom line, standfirst,
-- and implications so existing relations and publication controls stay intact.
alter table public.wiki_pages
  add column if not exists key_takeaways jsonb not null default '[]'::jsonb,
  add column if not exists limitations text,
  add column if not exists recommended_action text,
  add column if not exists content_format text not null default 'Explainer',
  add column if not exists topic text not null default 'Canadian defence',
  add column if not exists audience text not null default 'Canadian defence business-development and ecosystem leaders',
  add column if not exists hero_image_path text,
  add column if not exists hero_image_alt text;

alter table public.wiki_pages drop constraint if exists wiki_pages_content_format_check;
alter table public.wiki_pages add constraint wiki_pages_content_format_check check (content_format in ('Explainer', 'Guide', 'Analysis'));
alter table public.wiki_pages drop constraint if exists wiki_pages_key_takeaways_array_check;
alter table public.wiki_pages add constraint wiki_pages_key_takeaways_array_check check (jsonb_typeof(key_takeaways) = 'array');

comment on column public.wiki_pages.primary_question is 'Article thesis. The legacy column name is retained to preserve the stable publication contract.';
comment on column public.wiki_pages.summary_answer is 'Article bottom line. The legacy column name is retained to preserve the stable publication contract.';
comment on column public.wiki_pages.dek is 'Article standfirst displayed below the headline.';
comment on column public.wiki_pages.sections is 'Narrative article sections. Each item uses heading, paragraphs, and optional points. Legacy question and answer keys remain during the transition deployment.';
comment on column public.wiki_pages.derived_read is 'Evidence-bounded editorial implications, visibly separated from source-backed facts.';

update public.wiki_pages set
  title = case slug
    when 'canada-arctic-defence-operations' then 'Canada’s Arctic defence operations: the system behind year-round reach'
    when 'canada-future-submarine-industrial-opportunity' then 'Canada’s future submarine program: the industrial work beyond the platform'
    when 'canadian-defence-demand-signals' then 'Reading Canadian defence demand signals without overreaching'
    when 'what-sovereign-defence-capability-requires' then 'Sovereign defence capability depends on more than equipment'
    when 'moving-defence-technology-from-prototype-to-operations' then 'Moving Canadian defence technology from prototype to operations'
    when 'resilient-communications-for-arctic-defence' then 'Resilient communications are the backbone of Arctic defence'
    when 'modular-containerized-systems-for-naval-operations' then 'Modular containerized systems for naval operations'
    when 'river-class-destroyer-industry-signal' then 'What the River-class Destroyer milestone signals for Canadian industry'
    else title end,
  primary_question = case slug
    when 'canada-arctic-defence-operations' then 'Canada''s Arctic defence challenge is sustained operational reach, not simply northern presence.'
    when 'canada-future-submarine-industrial-opportunity' then 'The durable Canadian opportunity lies in the infrastructure, people, supply chains, and support that keep a future fleet operational.'
    when 'canadian-defence-demand-signals' then 'Public demand signals are useful for framing a capability hypothesis, but they are not proof of eligibility, buyer interest, or a future contract.'
    when 'what-sovereign-defence-capability-requires' then 'Canada controls defence capability only when it can operate, maintain, adapt, and replace critical systems as conditions change.'
    when 'moving-defence-technology-from-prototype-to-operations' then 'A prototype moves toward operational use when testing resolves a specific adoption risk and leaves decision-makers with credible evidence.'
    when 'resilient-communications-for-arctic-defence' then 'Arctic operations depend on a resilient system of space, ground, power, user equipment, training, and support, not one network or terminal.'
    when 'modular-containerized-systems-for-naval-operations' then 'Containerization creates value when the enclosure, mission system, host platform, and support model are designed as one integrated capability.'
    when 'river-class-destroyer-industry-signal' then 'The first keel-laying matters because it begins a long industrial cycle of construction, integration, testing, delivery, and through-life support.'
    else primary_question end,
  content_format = case slug
    when 'canadian-defence-demand-signals' then 'Guide'
    when 'moving-defence-technology-from-prototype-to-operations' then 'Guide'
    when 'modular-containerized-systems-for-naval-operations' then 'Guide'
    when 'river-class-destroyer-industry-signal' then 'Analysis'
    else 'Explainer' end,
  topic = case slug
    when 'canada-arctic-defence-operations' then 'Arctic operations'
    when 'canada-future-submarine-industrial-opportunity' then 'Maritime systems'
    when 'canadian-defence-demand-signals' then 'Operational demand'
    when 'what-sovereign-defence-capability-requires' then 'Defence industry'
    when 'moving-defence-technology-from-prototype-to-operations' then 'Innovation pathways'
    when 'resilient-communications-for-arctic-defence' then 'Arctic operations'
    when 'modular-containerized-systems-for-naval-operations' then 'Maritime systems'
    when 'river-class-destroyer-industry-signal' then 'Defence industry'
    else topic end,
  hero_image_path = case slug
    when 'canada-arctic-defence-operations' then '/imagery/briefs/arctic-operations.jpg'
    when 'canada-future-submarine-industrial-opportunity' then '/imagery/briefs/submarine-opportunity.jpg'
    when 'canadian-defence-demand-signals' then '/imagery/briefs/defence-demand-and-innovation.jpg'
    when 'what-sovereign-defence-capability-requires' then '/imagery/briefs/sovereign-capability.jpg'
    when 'moving-defence-technology-from-prototype-to-operations' then '/imagery/briefs/defence-demand-and-innovation.jpg'
    when 'resilient-communications-for-arctic-defence' then '/imagery/briefs/arctic-operations.jpg'
    else '/imagery/briefs/defence-briefs-home.jpg' end,
  hero_image_alt = case slug
    when 'canada-arctic-defence-operations' then 'Canadian soldiers operating in winter terrain beneath the northern lights and a connected communications network.'
    when 'canada-future-submarine-industrial-opportunity' then 'Conceptual submarine operating above and below Arctic sea ice with an illuminated undersea sensor network.'
    when 'canadian-defence-demand-signals' then 'Canadian armoured vehicle surrounded by a network of defence, industry, communications, and technology symbols.'
    when 'what-sovereign-defence-capability-requires' then 'Canadian fighter aircraft above a connected map of Canada with a formation of uncrewed aircraft.'
    when 'moving-defence-technology-from-prototype-to-operations' then 'Canadian armoured vehicle surrounded by connected industry, technology, and operational symbols.'
    when 'resilient-communications-for-arctic-defence' then 'Canadian soldiers operating in Arctic winter terrain beneath an illuminated communications network.'
    else 'Conceptual Canadian naval vessel connected to industry, defence, community, and national partners.' end,
  limitations = 'This article is based on reviewed public sources. It does not indicate procurement eligibility, endorsement, classified demand, or a confirmed commercial opportunity.',
  recommended_action = case slug
    when 'canada-arctic-defence-operations' then 'Map a specific capability to a documented mobility, infrastructure, logistics, communications, power, medical, or sustainment need, then validate the fit with northern operators and Indigenous partners.'
    when 'canada-future-submarine-industrial-opportunity' then 'Identify the exact through-life or operational dependency your capability addresses, show relevant delivery evidence, and trace the correct platform, integrator, or sustainment relationship before outreach.'
    when 'canadian-defence-demand-signals' then 'Use each signal to form a bounded hypothesis: name the public problem, show how a specific capability changes the outcome, and record the evidence and uncertainty before engagement.'
    when 'what-sovereign-defence-capability-requires' then 'Name the dependency your capability reduces and show what Canada can operate, support, change, or replace domestically under disrupted conditions.'
    when 'moving-defence-technology-from-prototype-to-operations' then 'Design the next test around one adoption risk, define the decision the evidence must support, and involve operators, integrators, and sustainment partners before the demonstration.'
    when 'resilient-communications-for-arctic-defence' then 'Demonstrate the complete operating chain in relevant northern conditions, including deployment, power, coverage, data flow, training, and in-service support.'
    when 'modular-containerized-systems-for-naval-operations' then 'Define the mission package and every host interface first, then assemble the container, technology, platform, integration, certification, and support partners around one acceptance model.'
    when 'river-class-destroyer-industry-signal' then 'Map your capability to a named system, integration, production, testing, or support function and approach the organization that owns that interface with current delivery evidence.'
    else recommended_action end,
  updated_at = now()
where slug in (
  'canada-arctic-defence-operations', 'canada-future-submarine-industrial-opportunity',
  'canadian-defence-demand-signals', 'what-sovereign-defence-capability-requires',
  'moving-defence-technology-from-prototype-to-operations', 'resilient-communications-for-arctic-defence',
  'modular-containerized-systems-for-naval-operations', 'river-class-destroyer-industry-signal'
);

with rebuilt as (
  select p.id,
    jsonb_agg(
      jsonb_build_object(
        'heading', case p.slug
          when 'canada-arctic-defence-operations' then (array['Why Arctic operational reach remains difficult','Canada''s hub-and-node operating model','Where Canadian industry can contribute'])[s.ordinality]
          when 'canada-future-submarine-industrial-opportunity' then (array['The operational capability Canada is seeking','Sustainment is as important as acquisition','How companies should assess their fit'])[s.ordinality]
          when 'canadian-defence-demand-signals' then (array['How public demand signals differ','Use demand signals to sharpen a capability hypothesis','What a reviewed technology match actually means'])[s.ordinality]
          when 'what-sovereign-defence-capability-requires' then (array['Owning equipment is not the same as controlling capability','The industrial capabilities that create durable value','Showing a credible contribution to Canadian sovereignty'])[s.ordinality]
          when 'moving-defence-technology-from-prototype-to-operations' then (array['Operational testing changes the question','Canadian pathways for validation','What makes a capability easier to adopt'])[s.ordinality]
          when 'resilient-communications-for-arctic-defence' then (array['The operating conditions that make connectivity difficult','Canada''s emerging northern communications direction','The evidence industry needs to demonstrate'])[s.ordinality]
          when 'modular-containerized-systems-for-naval-operations' then (array['Why containerized mission systems are useful','The delivery team extends beyond the container manufacturer','Canadian evidence already exists'])[s.ordinality]
          when 'river-class-destroyer-industry-signal' then (array['The program has moved into physical production','The broader industrial work extends far beyond the hull','How companies should act on the signal'])[s.ordinality]
        end,
        'paragraphs', jsonb_build_array(s.item->>'answer'),
        'points', coalesce(s.item->'points', '[]'::jsonb),
        'question', case p.slug
          when 'canada-arctic-defence-operations' then (array['Why Arctic operational reach remains difficult','Canada''s hub-and-node operating model','Where Canadian industry can contribute'])[s.ordinality]
          when 'canada-future-submarine-industrial-opportunity' then (array['The operational capability Canada is seeking','Sustainment is as important as acquisition','How companies should assess their fit'])[s.ordinality]
          when 'canadian-defence-demand-signals' then (array['How public demand signals differ','Use demand signals to sharpen a capability hypothesis','What a reviewed technology match actually means'])[s.ordinality]
          when 'what-sovereign-defence-capability-requires' then (array['Owning equipment is not the same as controlling capability','The industrial capabilities that create durable value','Showing a credible contribution to Canadian sovereignty'])[s.ordinality]
          when 'moving-defence-technology-from-prototype-to-operations' then (array['Operational testing changes the question','Canadian pathways for validation','What makes a capability easier to adopt'])[s.ordinality]
          when 'resilient-communications-for-arctic-defence' then (array['The operating conditions that make connectivity difficult','Canada''s emerging northern communications direction','The evidence industry needs to demonstrate'])[s.ordinality]
          when 'modular-containerized-systems-for-naval-operations' then (array['Why containerized mission systems are useful','The delivery team extends beyond the container manufacturer','Canadian evidence already exists'])[s.ordinality]
          when 'river-class-destroyer-industry-signal' then (array['The program has moved into physical production','The broader industrial work extends far beyond the hull','How companies should act on the signal'])[s.ordinality]
        end,
        'answer', s.item->>'answer'
      ) order by s.ordinality
    ) as sections,
    (select coalesce(jsonb_agg(takeaway.item), '[]'::jsonb) from (select point.item from jsonb_array_elements(p.sections) old_section(section_value) cross join lateral jsonb_array_elements(coalesce(old_section.section_value->'points', '[]'::jsonb)) point(item) limit 4) takeaway) as key_takeaways
  from public.wiki_pages p
  cross join lateral jsonb_array_elements(p.sections) with ordinality as s(item, ordinality)
  where p.slug in (
    'canada-arctic-defence-operations', 'canada-future-submarine-industrial-opportunity',
    'canadian-defence-demand-signals', 'what-sovereign-defence-capability-requires',
    'moving-defence-technology-from-prototype-to-operations', 'resilient-communications-for-arctic-defence',
    'modular-containerized-systems-for-naval-operations', 'river-class-destroyer-industry-signal'
  )
  group by p.id, p.sections
)
update public.wiki_pages p set sections = rebuilt.sections, key_takeaways = rebuilt.key_takeaways
from rebuilt where p.id = rebuilt.id;

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
     or length(trim(coalesce(p_payload->>'thesis', ''))) < 12
     or length(trim(coalesce(p_payload->>'bottomLine', ''))) < 40
     or length(trim(coalesce(p_payload->>'standfirst', ''))) < 40
     or jsonb_typeof(p_payload->'sections') <> 'array'
     or jsonb_array_length(p_payload->'sections') < 1
     or coalesce(p_payload->>'format', '') not in ('Explainer', 'Guide', 'Analysis')
     or length(trim(coalesce(p_payload->>'topic', ''))) < 3
     or length(trim(coalesce(p_payload->>'audience', ''))) < 8
     or length(trim(coalesce(p_payload->>'heroImageAlt', ''))) < 12
     or length(trim(coalesce(p_payload->>'seoTitle', ''))) < 8
     or length(trim(coalesce(p_payload->>'metaDescription', ''))) < 40
     or jsonb_typeof(p_source_links) <> 'array'
     or (requested_status = 'published' and jsonb_array_length(p_source_links) < 1)
     or jsonb_typeof(p_record_links) <> 'array' then
    raise exception 'The defence article payload is incomplete.' using errcode = '22023';
  end if;

  if p_page_id is null then
    insert into public.wiki_pages (
      slug, title, primary_question, summary_answer, dek, key_takeaways, sections, derived_read,
      limitations, recommended_action, content_format, topic, audience, hero_image_path, hero_image_alt,
      seo_title, meta_description, author_name, publication_status, reviewed_by, reviewed_at, published_at
    ) values (
      p_payload->>'slug', trim(p_payload->>'title'), trim(p_payload->>'thesis'), trim(p_payload->>'bottomLine'),
      trim(p_payload->>'standfirst'), coalesce(p_payload->'keyTakeaways', '[]'::jsonb), p_payload->'sections',
      nullif(trim(p_payload->>'implications'), ''), nullif(trim(p_payload->>'limitations'), ''), nullif(trim(p_payload->>'recommendedAction'), ''),
      p_payload->>'format', trim(p_payload->>'topic'), trim(p_payload->>'audience'), nullif(trim(p_payload->>'heroImagePath'), ''), trim(p_payload->>'heroImageAlt'),
      trim(p_payload->>'seoTitle'), trim(p_payload->>'metaDescription'), coalesce(nullif(trim(p_payload->>'authorName'), ''), 'Andrew Davies'), requested_status,
      case when requested_status = 'published' then p_reviewer_id end, case when requested_status = 'published' then now() end, case when requested_status = 'published' then now() end
    ) returning id into managed_page_id;
  else
    managed_page_id := p_page_id;
    update public.wiki_pages set
      slug = p_payload->>'slug', title = trim(p_payload->>'title'), primary_question = trim(p_payload->>'thesis'),
      summary_answer = trim(p_payload->>'bottomLine'), dek = trim(p_payload->>'standfirst'), key_takeaways = coalesce(p_payload->'keyTakeaways', '[]'::jsonb),
      sections = p_payload->'sections', derived_read = nullif(trim(p_payload->>'implications'), ''), limitations = nullif(trim(p_payload->>'limitations'), ''),
      recommended_action = nullif(trim(p_payload->>'recommendedAction'), ''), content_format = p_payload->>'format', topic = trim(p_payload->>'topic'),
      audience = trim(p_payload->>'audience'), hero_image_path = nullif(trim(p_payload->>'heroImagePath'), ''), hero_image_alt = trim(p_payload->>'heroImageAlt'),
      seo_title = trim(p_payload->>'seoTitle'), meta_description = trim(p_payload->>'metaDescription'), author_name = coalesce(nullif(trim(p_payload->>'authorName'), ''), author_name),
      publication_status = requested_status, reviewed_by = case when requested_status = 'published' then p_reviewer_id else reviewed_by end,
      reviewed_at = case when requested_status = 'published' then now() else reviewed_at end,
      published_at = case when requested_status = 'published' then coalesce(published_at, now()) else published_at end, updated_at = now()
    where id = managed_page_id;
    if not found then raise exception 'The selected defence brief no longer exists.' using errcode = '22023'; end if;
  end if;

  delete from public.wiki_page_sources where page_id = managed_page_id;
  for source_link in select value from jsonb_array_elements(p_source_links) loop
    if not exists (select 1 from public.sources s where s.id = (source_link->>'sourceId')::uuid and s.visibility = 'public' and s.public_approved = true) then
      raise exception 'Every brief source must be an approved public source.' using errcode = '22023';
    end if;
    insert into public.wiki_page_sources (page_id, source_id, citation_note, display_order)
    values (managed_page_id, (source_link->>'sourceId')::uuid, trim(source_link->>'citationNote'), coalesce((source_link->>'displayOrder')::smallint, 0));
  end loop;

  delete from public.wiki_page_record_links where page_id = managed_page_id;
  for record_link in select value from jsonb_array_elements(p_record_links) loop
    if (record_link->>'recordType') not in ('organization', 'capability', 'demand_requirement') then raise exception 'Unsupported related-record type.' using errcode = '22023'; end if;
    insert into public.wiki_page_record_links (page_id, record_type, record_id, relationship_label, display_order)
    values (managed_page_id, record_link->>'recordType', (record_link->>'recordId')::uuid, trim(record_link->>'relationshipLabel'), coalesce((record_link->>'displayOrder')::smallint, 0));
  end loop;

  insert into public.audit_events (actor_id, actor_role, event_type, entity_type, entity_id, summary, metadata)
  values (p_reviewer_id, 'admin', 'defence_brief_saved', 'wiki_page', managed_page_id,
    case when requested_status = 'published' then 'Administrator published a Canadian Defence Brief.' else 'Administrator saved a private Canadian Defence Brief.' end,
    jsonb_strip_nulls(jsonb_build_object('rationale', nullif(trim(coalesce(p_rationale, '')), ''), 'publication_status', requested_status, 'source_count', jsonb_array_length(p_source_links))));
  return managed_page_id;
end;
$$;

revoke all on function public.upsert_defence_brief(uuid, uuid, jsonb, jsonb, jsonb, text) from public, anon, authenticated;
grant execute on function public.upsert_defence_brief(uuid, uuid, jsonb, jsonb, jsonb, text) to authenticated;
