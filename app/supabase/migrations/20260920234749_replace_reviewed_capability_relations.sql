-- A reviewed capability after-snapshot is the complete relation set. Keep
-- omitted relationships as archived history instead of leaving them public.
-- Patch only the v2 update-child branch; retain its locks, evidence and grants.
do $migration$
declare
  definition text := pg_get_functiondef('public.publish_reviewed_organization_refresh_v2_candidates(uuid[],uuid)'::regprocedure);
  relation_anchor text := $anchor$        new_child_id := (operation_record->>'targetId')::uuid;
        for domain_slug$anchor$;
  primary_anchor text := $anchor$          on conflict (capability_id, technical_domain_id) do update
          set publication_status = 'published';$anchor$;
begin
  if strpos(definition, '-- Apply the complete reviewed capability relation set.') > 0 then
    return;
  end if;
  if cardinality(string_to_array(definition, relation_anchor)) <> 2
     or cardinality(string_to_array(definition, primary_anchor)) <> 2 then
    raise exception 'Unexpected organization refresh publisher; review the capability relation patch before applying it.';
  end if;
  definition := replace(definition, relation_anchor, $replacement$        new_child_id := (operation_record->>'targetId')::uuid;
        -- Apply the complete reviewed capability relation set.
        update public.capability_domains domain_link
        set publication_status = 'archived', is_primary = false
        where domain_link.capability_id = new_child_id
          and domain_link.publication_status = 'published'
          and not exists (
            select 1
            from public.technical_domains domain_row
            join jsonb_array_elements_text(coalesce(capability_record->'technicalDomainSlugs', '[]'::jsonb)) reviewed(slug)
              on reviewed.slug = domain_row.slug
            where domain_row.id = domain_link.technical_domain_id
          );
        update public.capability_mission_matches mission_link
        set publication_status = 'archived', updated_at = published_on
        where mission_link.capability_id = new_child_id
          and mission_link.publication_status = 'published'
          and mission_link.review_status = 'approved'
          and not exists (
            select 1
            from public.mission_areas mission_row
            join jsonb_array_elements(coalesce(capability_record->'missionMatches', '[]'::jsonb)) reviewed(value)
              on reviewed.value->>'missionAreaSlug' = mission_row.slug
            where mission_row.id = mission_link.mission_area_id
          );
        for domain_slug$replacement$);
  definition := replace(definition, primary_anchor, $replacement$          on conflict (capability_id, technical_domain_id) do update
          set publication_status = 'published', is_primary = excluded.is_primary;$replacement$);
  execute definition;
end;
$migration$;
