-- Published organizations drive the public map and its synchronized result
-- list. Backfill the five research-pipeline records that were promoted with a
-- city but no coordinates, then make that incomplete state unpublishable.

update public.locations as location_record
set
  latitude = coordinate.latitude,
  longitude = coordinate.longitude,
  geographic_confidence = 'city_centroid'
from public.organization_locations as location_link
join public.organizations as organization_record
  on organization_record.id = location_link.organization_id
join (
  values
    ('mission-control', 45.4215::double precision, -75.6972::double precision),
    ('l-spark', 45.4215::double precision, -75.6972::double precision),
    ('cove', 44.6661::double precision, -63.5728::double precision),
    ('build-ventures', 44.6488::double precision, -63.5752::double precision),
    ('c-core', 47.5615::double precision, -52.7126::double precision)
) as coordinate(organization_slug, latitude, longitude)
  on coordinate.organization_slug = organization_record.slug
where location_record.id = location_link.location_id
  and location_link.is_primary = true
  and location_link.publication_status = 'published'
  and organization_record.publication_status = 'published'
  and (location_record.latitude is null or location_record.longitude is null);

create or replace function public.enforce_published_primary_location_coordinates()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  linked_latitude double precision;
  linked_longitude double precision;
begin
  if new.is_primary and new.publication_status = 'published' then
    select location_record.latitude, location_record.longitude
    into linked_latitude, linked_longitude
    from public.locations as location_record
    where location_record.id = new.location_id;

    if linked_latitude is null or linked_longitude is null then
      raise exception 'Published organizations require a mappable primary location.' using errcode = '22023';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.protect_published_primary_location_coordinates()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.latitude is null or new.longitude is null) and exists (
    select 1
    from public.organization_locations as location_link
    join public.organizations as organization_record
      on organization_record.id = location_link.organization_id
    where location_link.location_id = new.id
      and location_link.is_primary = true
      and location_link.publication_status = 'published'
      and organization_record.publication_status = 'published'
  ) then
    raise exception 'Published organizations require a mappable primary location.' using errcode = '22023';
  end if;

  return new;
end;
$$;

drop trigger if exists organization_locations_require_coordinates on public.organization_locations;
create trigger organization_locations_require_coordinates
before insert or update of location_id, is_primary, publication_status
on public.organization_locations
for each row execute function public.enforce_published_primary_location_coordinates();

drop trigger if exists published_locations_keep_coordinates on public.locations;
create trigger published_locations_keep_coordinates
before update of latitude, longitude
on public.locations
for each row execute function public.protect_published_primary_location_coordinates();

revoke all on function public.enforce_published_primary_location_coordinates() from public, anon, authenticated;
revoke all on function public.protect_published_primary_location_coordinates() from public, anon, authenticated;

comment on function public.enforce_published_primary_location_coordinates()
is 'Rejects publication of a primary organization-location link when the location cannot appear on the public map.';

comment on function public.protect_published_primary_location_coordinates()
is 'Prevents a published primary organization location from losing its map coordinates.';
