-- Return only the small aggregate payload rendered by the private Coverage
-- workspace. This avoids transferring and assembling the complete national
-- discovery graph merely to count published relationships.

create or replace function public.get_admin_coverage_breakdown()
returns jsonb
language plpgsql
stable
security invoker
set search_path = pg_catalog, public, private
as $$
declare
  result jsonb;
begin
  if not private.is_atlas_staff() then
    raise exception 'Coverage reporting requires the authenticated atlas owner.' using errcode = '42501';
  end if;

  with
  published_organizations as (
    select id
    from public.organizations
    where publication_status = 'published'
  ),
  primary_locations as (
    select distinct on (link.organization_id)
      link.organization_id,
      location_record.province_territory
    from public.organization_locations link
    join published_organizations organization_record
      on organization_record.id = link.organization_id
    join public.locations location_record
      on location_record.id = link.location_id
    where link.publication_status = 'published'
    order by
      link.organization_id,
      link.is_primary desc,
      case link.location_role
        when 'headquarters' then 0
        when 'facility' then 1
        when 'test_site' then 2
        else 3
      end,
      link.id
  ),
  region_definitions(display_order, label, provinces) as (
    values
      (0, 'Canada'::text, null::text[]),
      (1, 'Atlantic Canada'::text, array['Newfoundland and Labrador', 'Nova Scotia', 'New Brunswick', 'Prince Edward Island']::text[]),
      (2, 'Quebec'::text, array['Quebec']::text[]),
      (3, 'Ontario'::text, array['Ontario']::text[]),
      (4, 'Prairies'::text, array['Manitoba', 'Saskatchewan', 'Alberta']::text[]),
      (5, 'British Columbia'::text, array['British Columbia']::text[]),
      (6, 'Northern Canada'::text, array['Yukon', 'Northwest Territories', 'Nunavut']::text[])
  ),
  region_counts as (
    select
      definition.display_order,
      definition.label,
      case
        when definition.provinces is null then (select count(*)::int from published_organizations)
        else (
          select count(*)::int
          from primary_locations location_record
          where location_record.province_territory = any(definition.provinces)
        )
      end as count
    from region_definitions definition
  ),
  domain_counts as (
    select
      domain_record.name as label,
      count(distinct organization_record.id)::int as count
    from public.technical_domains domain_record
    left join public.capability_domains domain_link
      on domain_link.technical_domain_id = domain_record.id
      and domain_link.publication_status = 'published'
    left join public.capabilities capability_record
      on capability_record.id = domain_link.capability_id
      and capability_record.publication_status = 'published'
    left join public.organizations organization_record
      on organization_record.id = capability_record.organization_id
      and organization_record.publication_status = 'published'
    where domain_record.publication_status = 'published'
    group by domain_record.name
  ),
  mission_counts as (
    select
      mission_record.name as label,
      count(distinct organization_record.id)::int as count
    from public.mission_areas mission_record
    left join public.capability_mission_matches mission_link
      on mission_link.mission_area_id = mission_record.id
      and mission_link.review_status = 'approved'
      and mission_link.publication_status = 'published'
    left join public.capabilities capability_record
      on capability_record.id = mission_link.capability_id
      and capability_record.publication_status = 'published'
    left join public.organizations organization_record
      on organization_record.id = capability_record.organization_id
      and organization_record.publication_status = 'published'
    where mission_record.publication_status = 'published'
    group by mission_record.name
  ),
  demand_counts as (
    select
      demand_record.display_order,
      demand_record.title as label,
      count(distinct match_record.id)::int as count
    from public.demand_requirements demand_record
    join public.demand_sources source_record
      on source_record.id = demand_record.demand_source_id
      and source_record.publication_status = 'published'
      and source_record.source_visibility = 'public'
      and source_record.source_verified_at is not null
      and source_record.source_verified_by is not null
    join public.evidence_snippets evidence_record
      on evidence_record.id = source_record.source_evidence_snippet_id
      and evidence_record.source_id = source_record.source_id
      and evidence_record.visibility = 'public'
      and evidence_record.public_approved
    left join public.capability_demand_matches match_record
      on match_record.demand_requirement_id = demand_record.id
      and match_record.review_status = 'approved'
      and match_record.publication_status = 'published'
    left join public.capabilities capability_record
      on capability_record.id = match_record.capability_id
      and capability_record.publication_status = 'published'
    left join public.organizations organization_record
      on organization_record.id = capability_record.organization_id
      and organization_record.publication_status = 'published'
    where demand_record.publication_status = 'published'
    group by demand_record.id, demand_record.display_order, demand_record.title
  )
  select jsonb_build_object(
    'regions', coalesce((
      select jsonb_agg(jsonb_build_object('label', label, 'count', count) order by display_order)
      from region_counts
    ), '[]'::jsonb),
    'technicalDomains', coalesce((
      select jsonb_agg(jsonb_build_object('label', label, 'count', count) order by label)
      from domain_counts
    ), '[]'::jsonb),
    'missionAreas', coalesce((
      select jsonb_agg(jsonb_build_object('label', label, 'count', count) order by label)
      from mission_counts
    ), '[]'::jsonb),
    'publicNeeds', coalesce((
      select jsonb_agg(jsonb_build_object('label', label, 'count', count) order by display_order, label)
      from demand_counts
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_admin_coverage_breakdown()
from public, anon, authenticated, service_role;
grant execute on function public.get_admin_coverage_breakdown()
to authenticated;

comment on function public.get_admin_coverage_breakdown()
is 'Returns bounded published regional, technical-domain, Mission Area, and Public Need coverage counts to the exact private atlas owner; it exposes no record payloads and performs no writes.';
