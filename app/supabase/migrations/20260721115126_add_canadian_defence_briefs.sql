-- A reviewed, public synthesis layer for evergreen Canadian defence knowledge.
-- Raw source packets and private compiler notes remain outside the public runtime.
create table public.wiki_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (length(trim(title)) between 8 and 180),
  primary_question text not null check (length(trim(primary_question)) between 12 and 240),
  summary_answer text not null check (length(trim(summary_answer)) between 40 and 1200),
  dek text not null check (length(trim(dek)) between 40 and 500),
  sections jsonb not null default '[]'::jsonb check (jsonb_typeof(sections) = 'array'),
  derived_read text,
  seo_title text not null check (length(trim(seo_title)) between 8 and 180),
  meta_description text not null check (length(trim(meta_description)) between 40 and 320),
  author_name text not null default 'Andrew Davies',
  publication_status text not null default 'draft' check (publication_status in ('draft', 'published', 'archived')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wiki_pages_publication_review check (
    publication_status <> 'published'
    or (reviewed_by is not null and reviewed_at is not null and published_at is not null)
  )
);

create table public.wiki_page_sources (
  page_id uuid not null references public.wiki_pages(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete restrict,
  citation_note text not null check (length(trim(citation_note)) between 8 and 500),
  display_order smallint not null default 0,
  created_at timestamptz not null default now(),
  primary key (page_id, source_id)
);

create table public.wiki_page_record_links (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.wiki_pages(id) on delete cascade,
  record_type text not null check (record_type in ('organization', 'capability', 'demand_requirement')),
  record_id uuid not null,
  relationship_label text not null check (length(trim(relationship_label)) between 3 and 120),
  display_order smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (page_id, record_type, record_id)
);

create index wiki_pages_public_idx on public.wiki_pages (publication_status, published_at desc);
create index wiki_page_sources_page_idx on public.wiki_page_sources (page_id, display_order);
create index wiki_page_record_links_page_idx on public.wiki_page_record_links (page_id, display_order);

alter table public.wiki_pages enable row level security;
alter table public.wiki_page_sources enable row level security;
alter table public.wiki_page_record_links enable row level security;

create policy "published defence briefs are public"
on public.wiki_pages for select to anon, authenticated
using (publication_status = 'published' or (select private.is_atlas_staff()));

create policy "published defence brief sources are public"
on public.wiki_page_sources for select to anon, authenticated
using (
  exists (
    select 1 from public.wiki_pages p
    where p.id = wiki_page_sources.page_id
      and (p.publication_status = 'published' or (select private.is_atlas_staff()))
  )
);

create policy "published defence brief links are public"
on public.wiki_page_record_links for select to anon, authenticated
using (
  exists (
    select 1 from public.wiki_pages p
    where p.id = wiki_page_record_links.page_id
      and (p.publication_status = 'published' or (select private.is_atlas_staff()))
  )
);

create policy "atlas administrator manages defence briefs"
on public.wiki_pages for all to authenticated
using ((select private.is_atlas_staff()))
with check ((select private.is_atlas_staff()));

create policy "atlas administrator manages defence brief sources"
on public.wiki_page_sources for all to authenticated
using ((select private.is_atlas_staff()))
with check ((select private.is_atlas_staff()));

create policy "atlas administrator manages defence brief links"
on public.wiki_page_record_links for all to authenticated
using ((select private.is_atlas_staff()))
with check ((select private.is_atlas_staff()));

grant select on public.wiki_pages, public.wiki_page_sources, public.wiki_page_record_links to anon;
grant select, insert, update, delete on public.wiki_pages, public.wiki_page_sources, public.wiki_page_record_links to authenticated;
grant all on public.wiki_pages, public.wiki_page_sources, public.wiki_page_record_links to service_role;

comment on table public.wiki_pages is 'Reviewed public Canadian Defence Briefs. Private source packets and draft compiler notes never enter this table.';
comment on column public.wiki_pages.sections is 'Visible question-led sections. Each item uses question, answer, and optional points fields.';
comment on column public.wiki_pages.derived_read is 'Optional interpretation based on linked evidence; displayed publicly as analysis rather than sourced fact.';

create or replace function public.upsert_defence_brief(
  p_page_id uuid,
  p_reviewer_id uuid,
  p_payload jsonb,
  p_source_links jsonb,
  p_record_links jsonb,
  p_rationale text
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
  if length(trim(coalesce(p_rationale, ''))) < 20 then
    raise exception 'Record the evidence checked and reason for this change.' using errcode = '22023';
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
    case when requested_status = 'published' then 'Administrator reviewed and published a Canadian Defence Brief.' else 'Administrator saved a private Canadian Defence Brief.' end,
    jsonb_build_object('rationale', trim(p_rationale), 'publication_status', requested_status, 'source_count', jsonb_array_length(p_source_links)));
  return managed_page_id;
end;
$$;

revoke all on function public.upsert_defence_brief(uuid, uuid, jsonb, jsonb, jsonb, text) from public, anon, authenticated;
grant execute on function public.upsert_defence_brief(uuid, uuid, jsonb, jsonb, jsonb, text) to authenticated;

-- Seed three reviewed, source-bounded launch briefs. The production administrator
-- remains the named reviewer and can revise or archive them through /admin/briefs.
do $$
declare
  reviewer_id uuid := 'b443c433-2a78-4ca7-8a19-a8f40b140049';
  arctic_page_id uuid := 'bb100000-0000-4000-8000-000000000001';
  submarine_page_id uuid := 'bb100000-0000-4000-8000-000000000002';
  demand_page_id uuid := 'bb100000-0000-4000-8000-000000000003';
begin
  if not exists (select 1 from auth.users where id = reviewer_id) then
    -- Migration fixtures do not preload Auth. In production this is the exact
    -- administrator ID enforced by private.is_atlas_staff().
    insert into auth.users (id) values (reviewer_id);
  end if;

  -- Production already contains these reviewed public records. Isolated schema
  -- fixtures intentionally do not, so the optional launch content is skipped.
  if exists (select 1 from public.sources where id = '696fea6f-a9e7-4502-8c85-1e4b70ba36fd')
     and exists (select 1 from public.sources where id = '0072a63d-7631-4c65-8cfe-97059bc9d0c2')
     and exists (select 1 from public.sources where id = '40000000-0000-4000-8000-000000000010')
     and exists (select 1 from public.demand_requirements where id = 'c85ee20e-2c3e-48e7-8680-45ea18eca7be') then

  insert into public.wiki_pages (
    id, slug, title, primary_question, summary_answer, dek, sections, derived_read,
    seo_title, meta_description, publication_status, reviewed_by, reviewed_at, published_at
  ) values
  (
    arctic_page_id,
    'canada-arctic-defence-operations',
    'Canada’s Arctic defence operations: what needs to work?',
    'What does Canada need to operate effectively in the Arctic?',
    'Canada needs a distributed network of northern hubs, transportation links, logistics, infrastructure, pre-positioned resources, and scalable support. The public objective is faster response, longer deployments, and more effective year-round operations while creating shared benefits where feasible.',
    'A practical guide to the public infrastructure, logistics, partnership, and sustainment needs shaping Canadian Arctic defence operations.',
    '[{"question":"Why is Arctic operational reach difficult?","answer":"Distance, limited infrastructure, severe conditions, and constrained local support make it harder to move people and equipment quickly and sustain them once deployed.","points":["Reach remote locations faster","Support personnel and equipment for longer","Maintain command, medical, maintenance, and air-staging functions"]},{"question":"What is Canada building to improve Arctic operations?","answer":"National Defence describes a hub-and-node network that combines strategically located infrastructure, transportation corridors, pre-positioned resources, and scalable multi-modal support.","points":["Northern hubs and smaller nodes","Road, runway, seaport, energy, medical, and logistics support","Climate-resilient infrastructure and services"]},{"question":"Where can Canadian industry contribute?","answer":"The public signal points toward practical capabilities that improve mobility, power, communications, construction, logistics, maintenance, medical support, and persistent operations in remote environments.","points":["Use the linked public needs to identify specific capability fits","Inspect company evidence before treating a potential fit as confirmed","Consider Indigenous and northern partnerships early"]}]'::jsonb,
    'The opportunity is broader than building individual facilities. Canada will need connected operating systems that can be supplied, maintained, and adapted across remote locations over time.',
    'Canada Arctic Defence Operations and Infrastructure',
    'What Canada needs for Arctic defence operations, including northern hubs, logistics, infrastructure, sustainment, and industry opportunities.',
    'published', reviewer_id, now(), now()
  ),
  (
    submarine_page_id,
    'canada-future-submarine-industrial-opportunity',
    'Canada’s future submarine program: where can industry contribute?',
    'What will Canada’s future submarine program need from Canadian industry?',
    'Canada’s future submarine program will require more than the platforms themselves. Public objectives point to domestic infrastructure, workforce, training, maintenance, supply chains, upgrades, and through-life support that can sustain a fleet for decades.',
    'A source-backed view of the operational and industrial work surrounding Canada’s planned future submarine fleet.',
    '[{"question":"What operational capability is Canada seeking?","answer":"Canada is pursuing conventionally powered submarines able to operate at long range and endurance, including under ice, while supporting surveillance, deterrence, and sovereignty missions across three ocean approaches.","points":["Arctic, Atlantic, and Pacific operations","Interoperability with allies","A transition that avoids a capability gap"]},{"question":"Why does sustainment matter as much as acquisition?","answer":"A fleet that remains available over decades depends on Canadian maintenance capacity, trained people, secure supply chains, infrastructure, and a repeatable approach to upgrades and support.","points":["Through-life maintenance and modernization","Training and workforce development","Domestic supply-chain and infrastructure capacity"]},{"question":"How should a company assess its fit?","answer":"Start with a specific product, service, or technical capability and connect it to a documented operational or sustainment need. A credible fit requires evidence; general interest in the program is not enough.","points":["Describe the capability and the problem it solves","Show relevant operating or certification evidence","Separate a plausible contribution from procurement eligibility"]}]'::jsonb,
    'The most durable Canadian industrial opportunity may sit in the long support tail: the people, facilities, data, maintenance, training, and supply chains that keep a fleet operational after delivery.',
    'Canada Future Submarine Program Industry Opportunities',
    'Explore what Canada’s future submarine fleet may require from industry, from operational capability to domestic sustainment, training, and supply chains.',
    'published', reviewer_id, now(), now()
  ),
  (
    demand_page_id,
    'canadian-defence-demand-signals',
    'How can companies read Canadian defence demand signals?',
    'What is a public defence demand signal, and how should a company use one?',
    'A public defence demand signal describes a problem, desired outcome, program direction, or active buying notice that an authority has published. Companies can use it to frame where a capability may help, but alignment is not procurement eligibility, customer interest, endorsement, or proof of a future contract.',
    'A plain-language guide to finding public defence needs, assessing fit, and avoiding the common mistake of treating alignment as an opportunity notice.',
    '[{"question":"What counts as a public defence demand signal?","answer":"It may be an official problem statement, innovation challenge, capability plan, funded program, procurement notice, or award. The source type and commitment level determine what conclusions are reasonable.","points":["Directional signals describe a need","Programmatic signals identify a structured or funded pathway","Procurement signals describe active buying activity"]},{"question":"How should a company use a demand signal?","answer":"Use the signal to sharpen a hypothesis: identify the exact problem, show how a specific capability changes the outcome, and support the connection with current public evidence.","points":["Start with the published problem","Match a specific product or service","State gaps, dependencies, and limits"]},{"question":"What does a reviewed technology match mean?","answer":"A reviewed match means a person found enough public evidence to make a defensible connection between a capability and a public need. It remains an assessment, not a statement from the buyer.","points":["Read the underlying sources","Check confidence and freshness","Treat the match as a starting point for due diligence"]}]'::jsonb,
    'The strongest business-development use is not to chase every signal. It is to find the small number of public needs where a company can explain a concrete, evidence-backed contribution.',
    'Canadian Defence Demand Signals Explained',
    'Learn what Canadian defence demand signals mean, how companies can assess capability fit, and why public alignment is not procurement eligibility.',
    'published', reviewer_id, now(), now()
  );

  insert into public.wiki_page_sources (page_id, source_id, citation_note, display_order) values
    (arctic_page_id, '696fea6f-a9e7-4502-8c85-1e4b70ba36fd', 'Official National Defence description of Northern Operational Support Hubs and public operational outcomes.', 1),
    (submarine_page_id, '0072a63d-7631-4c65-8cfe-97059bc9d0c2', 'Official Government of Canada backgrounder on the future submarine program and Canadian industrial objectives.', 1),
    (demand_page_id, '40000000-0000-4000-8000-000000000010', 'Official NATO demand signal used to illustrate public problem statements and the limits of inferred alignment.', 1),
    (demand_page_id, '696fea6f-a9e7-4502-8c85-1e4b70ba36fd', 'Official National Defence program source used to illustrate a programmatic public signal.', 2),
    (demand_page_id, '5a18f4b3-0894-4e93-ba73-4cf32f634f0a', 'Official National Defence innovation challenge used to illustrate a scoped public problem statement.', 3);

  insert into public.wiki_page_record_links (page_id, record_type, record_id, relationship_label, display_order) values
    (arctic_page_id, 'demand_requirement', 'c85ee20e-2c3e-48e7-8680-45ea18eca7be', 'Explore the operational reach need', 1),
    (arctic_page_id, 'demand_requirement', 'd6de6219-92c8-49b3-81dd-85ec4a430fce', 'Explore the infrastructure and partnership need', 2),
    (submarine_page_id, 'demand_requirement', '3d9730ac-0730-4233-acdf-9f47887f0115', 'Explore the future fleet need', 1),
    (submarine_page_id, 'demand_requirement', 'e0847917-e84c-4207-a335-55ecdd12158c', 'Explore the sustainment need', 2),
    (demand_page_id, 'demand_requirement', '71000000-0000-4000-8000-000000000001', 'See a directional demand example', 1),
    (demand_page_id, 'demand_requirement', 'a106f66c-7d7d-4265-817b-0e726ed37b50', 'See an innovation challenge example', 2),
    (demand_page_id, 'demand_requirement', 'c85ee20e-2c3e-48e7-8680-45ea18eca7be', 'See a programmatic demand example', 3);
  end if;
end $$;
