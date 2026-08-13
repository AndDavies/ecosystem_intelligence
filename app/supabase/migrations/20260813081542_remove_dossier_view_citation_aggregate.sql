-- Keep the dossier compatibility shape while moving public evidence hydration
-- to the bounded server-side citation graph. Apply only after the compatible
-- application release is ready. After this migration, rollback must remain on
-- an application version with bounded citation hydration or restore the prior
-- aggregate in a forward migration; the old view-dependent app is not safe.

drop view public.organization_dossiers;

create view public.organization_dossiers
with (security_invoker = true)
as
select
  organization_record.*,
  coalesce((
    select jsonb_agg(
      to_jsonb(location_record)
      || jsonb_build_object(
        'link_id', location_link.id,
        'location_role', location_link.location_role,
        'is_primary', location_link.is_primary,
        'publication_status', location_link.publication_status
      )
      order by location_link.is_primary desc, location_record.name
    )
    from public.organization_locations location_link
    join public.locations location_record on location_record.id = location_link.location_id
    where location_link.organization_id = organization_record.id
      and location_link.publication_status = 'published'
  ), '[]'::jsonb) as locations,
  coalesce((
    select jsonb_agg(to_jsonb(capability_record) order by capability_record.name)
    from public.capabilities capability_record
    where capability_record.organization_id = organization_record.id
      and capability_record.publication_status = 'published'
  ), '[]'::jsonb) as capabilities,
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'capability_id', domain_link.capability_id,
        'is_primary', domain_link.is_primary,
        'technical_domain', to_jsonb(domain_record)
      )
      order by domain_record.name
    )
    from public.capability_domains domain_link
    join public.capabilities capability_record
      on capability_record.id = domain_link.capability_id
     and capability_record.publication_status = 'published'
    join public.technical_domains domain_record
      on domain_record.id = domain_link.technical_domain_id
     and domain_record.publication_status = 'published'
    where capability_record.organization_id = organization_record.id
      and domain_link.publication_status = 'published'
  ), '[]'::jsonb) as capability_domains,
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'match', to_jsonb(match_record),
        'mission_area', to_jsonb(mission_record)
      )
      order by mission_record.name
    )
    from public.capability_mission_matches match_record
    join public.capabilities capability_record
      on capability_record.id = match_record.capability_id
     and capability_record.publication_status = 'published'
    join public.mission_areas mission_record
      on mission_record.id = match_record.mission_area_id
     and mission_record.publication_status = 'published'
    where capability_record.organization_id = organization_record.id
      and match_record.review_status = 'approved'
      and match_record.publication_status = 'published'
  ), '[]'::jsonb) as mission_matches,
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'match', to_jsonb(match_record),
        'requirement', to_jsonb(requirement_record),
        'demand_source', to_jsonb(demand_source_record)
      )
      order by requirement_record.display_order, requirement_record.title
    )
    from public.capability_demand_matches match_record
    join public.capabilities capability_record
      on capability_record.id = match_record.capability_id
     and capability_record.publication_status = 'published'
    join public.demand_requirements requirement_record
      on requirement_record.id = match_record.demand_requirement_id
     and requirement_record.publication_status = 'published'
    join public.demand_sources demand_source_record
      on demand_source_record.id = requirement_record.demand_source_id
     and demand_source_record.publication_status = 'published'
    where capability_record.organization_id = organization_record.id
      and match_record.review_status = 'approved'
      and match_record.publication_status = 'published'
  ), '[]'::jsonb) as demand_matches,
  coalesce((
    select jsonb_agg(
      to_jsonb(participation_record)
      || jsonb_build_object('program', to_jsonb(program_record))
      order by participation_record.announced_on desc nulls last, program_record.name
    )
    from public.program_participations participation_record
    join public.programs program_record
      on program_record.id = participation_record.program_id
     and program_record.publication_status = 'published'
    where participation_record.organization_id = organization_record.id
      and participation_record.publication_status = 'published'
  ), '[]'::jsonb) as programs,
  coalesce((
    select jsonb_agg(to_jsonb(funding_record) order by funding_record.announced_on desc nulls last)
    from public.funding_events funding_record
    where funding_record.organization_id = organization_record.id
      and funding_record.publication_status = 'published'
  ), '[]'::jsonb) as funding_events,
  coalesce((
    select jsonb_agg(
      to_jsonb(relationship_record)
      || jsonb_build_object(
        'related_organization', case
          when related_organization.id is null then null
          else jsonb_build_object(
            'id', related_organization.id,
            'slug', related_organization.slug,
            'name', related_organization.name,
            'entity_kind', related_organization.entity_kind
          )
        end
      )
      order by relationship_record.relationship_type, relationship_record.related_organization_name
    )
    from public.organization_relationships relationship_record
    left join public.organizations related_organization
      on related_organization.id = relationship_record.related_organization_id
     and related_organization.publication_status = 'published'
    where relationship_record.organization_id = organization_record.id
      and relationship_record.publication_status = 'published'
  ), '[]'::jsonb) as relationships,
  coalesce((
    select jsonb_agg(to_jsonb(media_record) order by media_record.display_role nulls last, media_record.asset_type, media_record.created_at)
    from public.media_assets media_record
    where media_record.approval_status = 'approved'
      and media_record.publication_status = 'published'
      and (
        media_record.organization_id = organization_record.id
        or media_record.capability_id in (
          select capability_record.id
          from public.capabilities capability_record
          where capability_record.organization_id = organization_record.id
            and capability_record.publication_status = 'published'
        )
      )
  ), '[]'::jsonb) as media_assets,
  '[]'::jsonb as citations
from public.organizations organization_record
where organization_record.publication_status = 'published';

grant select on public.organization_dossiers to anon, authenticated, service_role;

comment on view public.organization_dossiers
is 'Bounded public organization projection. security_invoker preserves source-table RLS and explicit publication and approval filters prevent private child records from entering public dossiers. The citations compatibility column is intentionally empty; the server hydrates approved public evidence only for IDs admitted by this view.';
