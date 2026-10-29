-- Worldwide company inclusion; geography remains factual and foreign locations are not mapped.
-- No canonical backfill, publication or change to staff/RLS authority.
begin;

-- Retain the existing publisher and all its evidence/permission/atomic guards.
-- An unknown location creates no record. An operating facility is not a headquarters.
do $$ declare definition text; start_at integer; end_at integer; block text; begin
  select pg_get_functiondef('public.publish_reviewed_organization_v3_candidates(uuid[],uuid)'::regprocedure) into definition;
  start_at := strpos(definition,'    insert into public.locations (');
  end_at := strpos(definition,'    insert into public.organization_aliases (');
  if start_at=0 or end_at<=start_at then raise exception 'Worldwide geography migration stopped: publisher contract drift.'; end if;
  block := substring(definition from start_at for end_at-start_at);
  if strpos(block,'''headquarters'', true, ''published''')=0 then raise exception 'Worldwide location-role contract drift.'; end if;
  block := replace(block,'''headquarters'', true, ''published''', 'coalesce(organization_record#>>''{primaryLocation,locationRole}'', ''headquarters''), true, ''published''');
  definition := substring(definition from 1 for start_at-1)
    || '    if jsonb_typeof(organization_record->''primaryLocation'') = ''object'' then' || chr(10)
    || '      if organization_record#>>''{primaryLocation,countryCode}'' <> ''CA'' and nullif(organization_record#>>''{primaryLocation,locationRole}'', '''') is null then raise exception ''Foreign geography requires an evidenced location role.''; end if;' || chr(10)
    || block || '    end if;' || chr(10) || chr(10) || substring(definition from end_at);
  execute definition;
end $$;

-- Independent count-only public proof for the Canadian map exception.
create function public.atlas_canadian_map_organization_count()
returns bigint language sql stable security invoker set search_path=pg_catalog as $$
  select count(distinct o.id) from public.organizations o
  join public.organization_locations ol on ol.organization_id=o.id
  join public.locations l on l.id=ol.location_id
  where o.publication_status='published' and ol.publication_status='published' and ol.is_primary
    and l.country_code='CA' and l.latitude is not null and l.longitude is not null
$$;
revoke all on function public.atlas_canadian_map_organization_count() from public;
grant execute on function public.atlas_canadian_map_organization_count() to anon,authenticated,service_role;

create function public.research_worldwide_companies_ready()
returns boolean language sql stable set search_path=pg_catalog as $$ select true $$;
revoke all on function public.research_worldwide_companies_ready() from public;
grant execute on function public.research_worldwide_companies_ready() to anon,authenticated,service_role;
commit;
