-- Migration version aligned with the production history.
-- Update the public-facing organization dossier in one transaction while
-- preserving stable organization and capability URLs. The function remains a
-- security-invoker so table RLS and the exact administrator policy still apply.
create or replace function public.update_published_organization_dossier(
  p_organization_id uuid,
  p_location_id uuid,
  p_capability_id uuid,
  p_reviewer_id uuid,
  p_payload jsonb,
  p_rationale text
)
returns text
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $$
declare
  organization_slug text;
  cluster_slug text;
  cluster_id uuid;
  requested_domain_count integer;
  matched_domain_count integer;
  before_record jsonb;
begin
  if not private.is_atlas_staff() or auth.uid() is distinct from p_reviewer_id then
    raise exception 'Editing requires the authenticated atlas administrator.' using errcode = '42501';
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'The organization edit payload must be an object.' using errcode = '22023';
  end if;
  if length(trim(coalesce(p_rationale, ''))) < 3 then
    raise exception 'Provide an editorial rationale for the public change.' using errcode = '22023';
  end if;
  if length(trim(coalesce(p_payload#>>'{organization,name}', ''))) < 1
     or length(trim(coalesce(p_payload#>>'{organization,description}', ''))) < 40
     or length(trim(coalesce(p_payload#>>'{location,city}', ''))) < 1
     or length(trim(coalesce(p_payload#>>'{location,provinceTerritory}', ''))) < 1
     or length(trim(coalesce(p_payload#>>'{capability,name}', ''))) < 1
     or length(trim(coalesce(p_payload#>>'{capability,summary}', ''))) < 40 then
    raise exception 'Required organization, location, or capability fields are incomplete.' using errcode = '22023';
  end if;
  if nullif(trim(coalesce(p_payload#>>'{organization,websiteUrl}', '')), '') is not null
     and p_payload#>>'{organization,websiteUrl}' !~ '^https://' then
    raise exception 'The public website must use HTTPS.' using errcode = '22023';
  end if;
  if jsonb_typeof(p_payload#>'{organization,categories}') <> 'array'
     or jsonb_array_length(p_payload#>'{organization,categories}') < 1 then
    raise exception 'Published organizations require at least one category.' using errcode = '22023';
  end if;
  if jsonb_typeof(p_payload#>'{capability,domainSlugs}') <> 'array'
     or jsonb_array_length(p_payload#>'{capability,domainSlugs}') < 1 then
    raise exception 'Published capabilities require at least one technical domain.' using errcode = '22023';
  end if;

  select organization_record.slug,
         jsonb_build_object(
           'organization', to_jsonb(organization_record) - 'profile_data',
           'location', to_jsonb(location_record),
           'capability', to_jsonb(capability_record),
           'domainSlugs', coalesce((
             select jsonb_agg(domain_record.slug order by domain_link.is_primary desc, domain_record.name)
             from public.capability_domains domain_link
             join public.technical_domains domain_record on domain_record.id = domain_link.technical_domain_id
             where domain_link.capability_id = capability_record.id
           ), '[]'::jsonb),
           'clusterSlugs', coalesce((
             select jsonb_agg(cluster_record.slug order by cluster_record.name)
             from public.capability_clusters cluster_link
             join public.ecosystem_clusters cluster_record on cluster_record.id = cluster_link.ecosystem_cluster_id
             where cluster_link.capability_id = capability_record.id
           ), '[]'::jsonb)
         )
    into organization_slug, before_record
  from public.organizations organization_record
  join public.organization_locations location_link
    on location_link.organization_id = organization_record.id
   and location_link.location_id = p_location_id
   and location_link.is_primary
   and location_link.publication_status = 'published'
  join public.locations location_record on location_record.id = location_link.location_id
  join public.capabilities capability_record
    on capability_record.organization_id = organization_record.id
   and capability_record.id = p_capability_id
   and capability_record.publication_status = 'published'
  where organization_record.id = p_organization_id
    and organization_record.publication_status = 'published'
  for update of organization_record, location_record, capability_record;

  if organization_slug is null then
    raise exception 'The selected published organization, location, or capability no longer exists.' using errcode = '22023';
  end if;

  select count(*)::integer,
         count(distinct requested_domain.slug)::integer
    into requested_domain_count, matched_domain_count
  from jsonb_array_elements_text(p_payload#>'{capability,domainSlugs}') as requested_domain(slug);
  if requested_domain_count <> matched_domain_count then
    raise exception 'Technical domains cannot be repeated.' using errcode = '22023';
  end if;

  select count(*)::integer
    into matched_domain_count
  from jsonb_array_elements_text(p_payload#>'{capability,domainSlugs}') as requested_domain(slug)
  join public.technical_domains domain_record
    on domain_record.slug = requested_domain.slug
   and domain_record.publication_status = 'published';
  if matched_domain_count <> requested_domain_count then
    raise exception 'Every technical domain must be a published taxonomy value.' using errcode = '22023';
  end if;

  cluster_slug := nullif(trim(coalesce(p_payload#>>'{capability,clusterSlug}', '')), '');
  if cluster_slug is not null then
    select id into cluster_id
    from public.ecosystem_clusters
    where slug = cluster_slug and publication_status = 'published';
    if cluster_id is null then
      raise exception 'The selected ecosystem cluster is not published.' using errcode = '22023';
    end if;
  end if;

  update public.organizations
  set name = trim(p_payload#>>'{organization,name}'),
      legal_name = nullif(trim(coalesce(p_payload#>>'{organization,legalName}', '')), ''),
      description = trim(p_payload#>>'{organization,description}'),
      website_url = nullif(trim(coalesce(p_payload#>>'{organization,websiteUrl}', '')), ''),
      entity_kind = p_payload#>>'{organization,entityKind}',
      organization_categories = array(
        select trim(category)
        from jsonb_array_elements_text(p_payload#>'{organization,categories}') as category
        where nullif(trim(category), '') is not null
      ),
      founded_year = nullif(p_payload#>>'{organization,foundedYear}', '')::integer,
      employee_range = nullif(trim(coalesce(p_payload#>>'{organization,employeeRange}', '')), ''),
      company_stage = nullif(trim(coalesce(p_payload#>>'{organization,companyStage}', '')), ''),
      ownership = nullif(trim(coalesce(p_payload#>>'{organization,ownership}', '')), ''),
      commercial_status = nullif(trim(coalesce(p_payload#>>'{organization,commercialStatus}', '')), ''),
      disclosed_financing_summary = nullif(trim(coalesce(p_payload#>>'{organization,disclosedFinancingSummary}', '')), ''),
      defence_posture = nullif(trim(coalesce(p_payload#>>'{organization,defencePosture}', '')), ''),
      dual_use_posture = nullif(trim(coalesce(p_payload#>>'{organization,dualUsePosture}', '')), ''),
      source_confidence = p_payload#>>'{organization,sourceConfidence}',
      freshness_status = p_payload#>>'{organization,freshnessStatus}',
      last_reviewed_at = now(),
      updated_at = now()
  where id = p_organization_id;

  update public.locations
  set name = trim(p_payload#>>'{location,city}') || ', ' || trim(p_payload#>>'{location,provinceTerritory}'),
      city = trim(p_payload#>>'{location,city}'),
      province_territory = trim(p_payload#>>'{location,provinceTerritory}'),
      latitude = (p_payload#>>'{location,latitude}')::double precision,
      longitude = (p_payload#>>'{location,longitude}')::double precision,
      geographic_confidence = p_payload#>>'{location,geographicConfidence}',
      updated_at = now()
  where id = p_location_id;

  update public.capabilities
  set name = trim(p_payload#>>'{capability,name}'),
      summary = trim(p_payload#>>'{capability,summary}'),
      capability_type = nullif(trim(coalesce(p_payload#>>'{capability,capabilityType}', '')), ''),
      core_features = array(select trim(value) from jsonb_array_elements_text(coalesce(p_payload#>'{capability,features}', '[]'::jsonb)) as value where nullif(trim(value), '') is not null),
      technology_readiness_level = nullif(p_payload#>>'{capability,technologyReadinessLevel}', '')::smallint,
      maturity = nullif(trim(coalesce(p_payload#>>'{capability,maturity}', '')), ''),
      commercial_availability = nullif(trim(coalesce(p_payload#>>'{capability,commercialAvailability}', '')), ''),
      defence_applications = array(select trim(value) from jsonb_array_elements_text(coalesce(p_payload#>'{capability,applications}', '[]'::jsonb)) as value where nullif(trim(value), '') is not null),
      novelty = array(select trim(value) from jsonb_array_elements_text(coalesce(p_payload#>'{capability,novelty}', '[]'::jsonb)) as value where nullif(trim(value), '') is not null),
      technical_tags = array(select trim(value) from jsonb_array_elements_text(coalesce(p_payload#>'{capability,tags}', '[]'::jsonb)) as value where nullif(trim(value), '') is not null),
      source_confidence = p_payload#>>'{capability,sourceConfidence}',
      last_reviewed_at = now(),
      updated_at = now()
  where id = p_capability_id;

  delete from public.capability_domains where capability_id = p_capability_id;
  insert into public.capability_domains (
    capability_id, technical_domain_id, is_primary, publication_status
  )
  select p_capability_id, domain_record.id, requested_domain.position = 1, 'published'
  from jsonb_array_elements_text(p_payload#>'{capability,domainSlugs}') with ordinality as requested_domain(slug, position)
  join public.technical_domains domain_record on domain_record.slug = requested_domain.slug;

  delete from public.capability_clusters where capability_id = p_capability_id;
  if cluster_id is not null then
    insert into public.capability_clusters (capability_id, ecosystem_cluster_id, publication_status)
    values (p_capability_id, cluster_id, 'published');
  end if;

  insert into public.audit_events (
    actor_id, actor_role, event_type, entity_type, entity_id, summary, metadata
  ) values (
    p_reviewer_id,
    coalesce(auth.jwt()->'app_metadata'->>'role', 'admin'),
    'published_organization_edited',
    'organization',
    p_organization_id,
    'Administrator edited a published organization dossier.',
    jsonb_build_object(
      'rationale', trim(p_rationale),
      'location_id', p_location_id,
      'capability_id', p_capability_id,
      'before', before_record,
      'after', p_payload
    )
  );

  return organization_slug;
end;
$$;

revoke all on function public.update_published_organization_dossier(uuid, uuid, uuid, uuid, jsonb, text)
from public, anon, authenticated;
grant execute on function public.update_published_organization_dossier(uuid, uuid, uuid, uuid, jsonb, text)
to authenticated;

comment on function public.update_published_organization_dossier(uuid, uuid, uuid, uuid, jsonb, text)
is 'Atomically edits an existing published dossier after an explicit action by the sole atlas administrator, preserving stable public URLs and recording before/after audit data.';
