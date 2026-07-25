drop policy if exists "published demand sources are readable" on public.demand_sources;
create policy "published demand sources are readable"
on public.demand_sources for select to anon, authenticated
using (
  publication_status = 'published'
  and source_visibility = 'public'
  and source_evidence_snippet_id is not null
  and source_verified_at is not null
  and source_verified_by is not null
  and exists (
    select 1
    from public.evidence_snippets evidence_record
    where evidence_record.id = demand_sources.source_evidence_snippet_id
      and evidence_record.source_id = demand_sources.source_id
      and evidence_record.visibility = 'public'
      and evidence_record.public_approved
  )
);

drop policy if exists "published demand requirements are readable" on public.demand_requirements;
create policy "published demand requirements are readable"
on public.demand_requirements for select to anon, authenticated
using (
  publication_status = 'published'
  and exists (
    select 1
    from public.demand_sources demand_source_record
    join public.evidence_snippets evidence_record
      on evidence_record.id = demand_source_record.source_evidence_snippet_id
    where demand_source_record.id = demand_requirements.demand_source_id
      and demand_source_record.publication_status = 'published'
      and demand_source_record.source_visibility = 'public'
      and demand_source_record.source_verified_at is not null
      and demand_source_record.source_verified_by is not null
      and evidence_record.source_id = demand_source_record.source_id
      and evidence_record.visibility = 'public'
      and evidence_record.public_approved
  )
);

drop policy if exists "approved published matches are readable" on public.capability_demand_matches;
create policy "approved published matches are readable"
on public.capability_demand_matches for select to anon, authenticated
using (
  review_status = 'approved'
  and publication_status = 'published'
  and exists (
    select 1
    from public.capabilities capability_record
    where capability_record.id = capability_demand_matches.capability_id
      and capability_record.publication_status = 'published'
  )
  and exists (
    select 1
    from public.demand_requirements demand_record
    join public.demand_sources demand_source_record
      on demand_source_record.id = demand_record.demand_source_id
    join public.evidence_snippets evidence_record
      on evidence_record.id = demand_source_record.source_evidence_snippet_id
    where demand_record.id = capability_demand_matches.demand_requirement_id
      and demand_record.publication_status = 'published'
      and demand_source_record.publication_status = 'published'
      and demand_source_record.source_visibility = 'public'
      and demand_source_record.source_verified_at is not null
      and demand_source_record.source_verified_by is not null
      and evidence_record.source_id = demand_source_record.source_id
      and evidence_record.visibility = 'public'
      and evidence_record.public_approved
  )
);
