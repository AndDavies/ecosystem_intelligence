-- Keep research candidates private until a reviewer explicitly promotes them.
alter table public.candidate_changes
  drop constraint if exists candidate_changes_status_check;

alter table public.candidate_changes
  add constraint candidate_changes_status_check
  check (status in ('pending', 'approved', 'rejected', 'superseded', 'published'));

alter table public.candidate_changes
  add column if not exists published_at timestamptz,
  add column if not exists published_entity_id uuid references public.organizations(id) on delete set null;

insert into public.technical_domains (slug, name, summary, publication_status)
values
  ('aerospace-and-mobility', 'Aerospace & Mobility', 'Aircraft, aviation systems, propulsion, mobility platforms, and supporting airborne technology.', 'published'),
  ('communications-and-cyber', 'Communications & Cyber', 'Secure communications, resilient networks, cyber defence, connectivity, and digital collaboration systems.', 'published'),
  ('test-training-and-sustainment', 'Test, Training & Sustainment', 'Test infrastructure, realistic training, maintenance, repair, overhaul, lifecycle support, and readiness services.', 'published'),
  ('advanced-manufacturing-and-integration', 'Advanced Manufacturing & Integration', 'Specialized manufacturing, electronics production, systems integration, and defence-grade industrial capability.', 'published')
on conflict (slug) do update
set name = excluded.name,
    summary = excluded.summary,
    publication_status = 'published',
    updated_at = now();

create or replace function public.publish_approved_organization_candidates(
  p_candidate_ids uuid[],
  p_reviewer_id uuid
)
returns table(candidate_id uuid, organization_id uuid, organization_slug text)
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $$
declare
  candidate_row public.candidate_changes%rowtype;
  record jsonb;
  new_organization_id uuid;
  new_location_id uuid;
  new_capability_id uuid;
  new_source_id uuid;
  new_evidence_id uuid;
  new_mission_match_id uuid;
  domain_id uuid;
  cluster_id uuid;
  mission_area_id uuid;
  domain_slug text;
  mission_record jsonb;
  selected_count integer;
  published_on timestamptz := now();
begin
  if not private.is_atlas_staff() or auth.uid() is distinct from p_reviewer_id then
    raise exception 'Publication requires the authenticated atlas reviewer.' using errcode = '42501';
  end if;

  if p_candidate_ids is null or cardinality(p_candidate_ids) < 1 or cardinality(p_candidate_ids) > 50 then
    raise exception 'Select between one and fifty approved candidates.' using errcode = '22023';
  end if;

  select count(distinct candidate_value) into selected_count
  from unnest(p_candidate_ids) as candidate_value;
  if selected_count <> cardinality(p_candidate_ids) then
    raise exception 'Candidate selection contains duplicate identifiers.' using errcode = '22023';
  end if;

  select count(*) into selected_count
  from public.candidate_changes
  where id = any(p_candidate_ids)
    and status = 'approved'
    and candidate_kind = 'organization_bundle'
    and proposed_record->>'schemaVersion' = 'organization_bundle_v1'
    and coalesce(duplicate_check->>'status', '') in ('clear', 'merged');
  if selected_count <> cardinality(p_candidate_ids) then
    raise exception 'Every selected candidate must be approved, valid, and duplicate-cleared.' using errcode = '22023';
  end if;

  for candidate_row in
    select *
    from public.candidate_changes
    where id = any(p_candidate_ids)
    order by created_at, id
    for update
  loop
    record := candidate_row.proposed_record;

    if exists (select 1 from public.organizations where slug = record->>'slug') then
      raise exception 'Organization slug % already exists.', record->>'slug' using errcode = '23505';
    end if;
    if exists (select 1 from public.capabilities where slug = record#>>'{capability,slug}') then
      raise exception 'Capability slug % already exists.', record#>>'{capability,slug}' using errcode = '23505';
    end if;

    insert into public.organizations (
      slug, name, description, website_url, entity_kind, organization_categories,
      profile_data, publication_status, source_confidence, freshness_status,
      last_reviewed_at, published_at
    ) values (
      record->>'slug', record->>'name', record->>'description', record->>'websiteUrl', 'company',
      array['commercial_company', 'dual_use'],
      jsonb_build_object(
        'ingestion_batch_id', record->>'batchId',
        'reviewed_candidate_id', candidate_row.id,
        'reviewed_by', p_reviewer_id
      ),
      'published', record->>'confidence', 'current', published_on, published_on
    ) returning id into new_organization_id;

    insert into public.locations (
      name, city, province_territory, country_code, latitude, longitude, geographic_confidence
    ) values (
      (record->>'city') || ', ' || (record->>'provinceTerritory'),
      record->>'city', record->>'provinceTerritory', 'CA',
      (record->>'latitude')::double precision, (record->>'longitude')::double precision,
      'city_centroid'
    ) returning id into new_location_id;

    insert into public.organization_locations (
      organization_id, location_id, location_role, is_primary, publication_status
    ) values (new_organization_id, new_location_id, 'headquarters', true, 'published');

    insert into public.capabilities (
      organization_id, slug, name, summary, capability_type, core_features,
      defence_applications, technical_tags, publication_status, source_confidence,
      last_reviewed_at, published_at
    ) values (
      new_organization_id,
      record#>>'{capability,slug}', record#>>'{capability,name}',
      record#>>'{capability,summary}', record#>>'{capability,type}',
      array(select jsonb_array_elements_text(record#>'{capability,features}')),
      array(select jsonb_array_elements_text(record#>'{capability,applications}')),
      array(select jsonb_array_elements_text(record#>'{capability,tags}')),
      'published', record->>'confidence', published_on, published_on
    ) returning id into new_capability_id;

    select id into domain_id
    from public.technical_domains
    where slug = record#>>'{capability,technicalDomainSlug}'
      and publication_status = 'published';
    if domain_id is null then
      raise exception 'Unknown primary technical domain %.', record#>>'{capability,technicalDomainSlug}' using errcode = '22023';
    end if;
    insert into public.capability_domains (capability_id, technical_domain_id, is_primary, publication_status)
    values (new_capability_id, domain_id, true, 'published');

    for domain_slug in select jsonb_array_elements_text(coalesce(record#>'{capability,additionalTechnicalDomainSlugs}', '[]'::jsonb))
    loop
      select id into domain_id
      from public.technical_domains
      where slug = domain_slug and publication_status = 'published';
      if domain_id is null then
        raise exception 'Unknown additional technical domain %.', domain_slug using errcode = '22023';
      end if;
      insert into public.capability_domains (capability_id, technical_domain_id, is_primary, publication_status)
      values (new_capability_id, domain_id, false, 'published')
      on conflict (capability_id, technical_domain_id) do nothing;
    end loop;

    if nullif(record#>>'{capability,clusterSlug}', '') is not null then
      select id into cluster_id
      from public.ecosystem_clusters
      where slug = record#>>'{capability,clusterSlug}' and publication_status = 'published';
      if cluster_id is null then
        raise exception 'Unknown ecosystem cluster %.', record#>>'{capability,clusterSlug}' using errcode = '22023';
      end if;
      insert into public.capability_clusters (capability_id, ecosystem_cluster_id, publication_status)
      values (new_capability_id, cluster_id, 'published');
    end if;

    insert into public.sources (
      title, canonical_url, publisher, source_type, visibility, accessed_at,
      public_approved, notes
    ) values (
      record#>>'{source,title}', record#>>'{source,url}', record#>>'{source,publisher}',
      record#>>'{source,type}', 'public', published_on, true,
      'Reviewed first-party source from ' || (record->>'batchId') || '.'
    ) returning id into new_source_id;

    insert into public.evidence_snippets (
      source_id, excerpt, source_locator, visibility, public_approved, extracted_at
    ) values (
      new_source_id, record#>>'{source,excerpt}', 'Reviewed source summary',
      'public', true, published_on
    ) returning id into new_evidence_id;

    insert into public.field_citations (entity_type, entity_id, field_name, evidence_snippet_id)
    values
      ('organization', new_organization_id, 'description', new_evidence_id),
      ('capability', new_capability_id, 'summary', new_evidence_id);

    for mission_record in select value from jsonb_array_elements(coalesce(record#>'{capability,missionMatches}', '[]'::jsonb))
    loop
      select id into mission_area_id
      from public.mission_areas
      where slug = mission_record->>'missionAreaSlug' and publication_status = 'published';
      if mission_area_id is null then
        raise exception 'Unknown mission area %.', mission_record->>'missionAreaSlug' using errcode = '22023';
      end if;
      insert into public.capability_mission_matches (
        capability_id, mission_area_id, alignment_summary, match_type,
        confidence, review_status, publication_status
      ) values (
        new_capability_id, mission_area_id, mission_record->>'alignmentSummary',
        'derived', mission_record->>'confidence', 'approved', 'published'
      ) returning id into new_mission_match_id;
      insert into public.field_citations (entity_type, entity_id, field_name, evidence_snippet_id)
      values ('capability_mission_match', new_mission_match_id, 'alignment_summary', new_evidence_id);
    end loop;

    update public.candidate_changes
    set status = 'published',
        target_entity_type = 'organization',
        target_entity_id = new_organization_id,
        published_entity_id = new_organization_id,
        published_at = published_on,
        updated_at = published_on
    where id = candidate_row.id;

    insert into public.audit_events (
      actor_id, actor_role, event_type, entity_type, entity_id, summary, metadata
    ) values (
      p_reviewer_id, coalesce(auth.jwt()->'app_metadata'->>'role', 'reviewer'),
      'candidate_published', 'organization', new_organization_id,
      'Reviewer published an approved organization dossier.',
      jsonb_build_object('candidate_id', candidate_row.id, 'batch_id', record->>'batchId')
    );

    candidate_id := candidate_row.id;
    organization_id := new_organization_id;
    organization_slug := record->>'slug';
    return next;
  end loop;
end;
$$;

revoke all on function public.publish_approved_organization_candidates(uuid[], uuid) from public, anon, authenticated;
grant execute on function public.publish_approved_organization_candidates(uuid[], uuid) to authenticated;

comment on function public.publish_approved_organization_candidates(uuid[], uuid)
is 'Atomically promotes selected, approved organization candidates after an explicit authenticated reviewer action.';
