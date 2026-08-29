-- Reject malformed dossier child baselines before they enter Admin Review.
-- Publication keeps its fail-closed child checks; this trigger also rechecks
-- shared program identity at the published transition. It performs no canonical
-- data writes.

create or replace function private.enforce_research_candidate_live_child_baselines()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  operation_record jsonb;
  participation_wrapper jsonb;
  program_record jsonb;
  live_child_snapshot jsonb;
  candidate_child_snapshot jsonb;
  publication_transition boolean := false;
begin
  if tg_op = 'UPDATE' then
    if new.status is distinct from old.status
       and new.status <> 'published'
       and new.candidate_kind is not distinct from old.candidate_kind
       and new.target_entity_id is not distinct from old.target_entity_id
       and new.proposed_record is not distinct from old.proposed_record
       and new.before_record is not distinct from old.before_record then
      return new;
    end if;
    publication_transition := new.status = 'published' and new.status is distinct from old.status;
  end if;

  if new.candidate_kind = 'organization_refresh_bundle'
     and new.schema_version = 'organization_refresh_bundle_v2' then
    for operation_record in
      select value
      from jsonb_array_elements(coalesce(new.proposed_record->'operations', '[]'::jsonb))
    loop
      if not publication_transition
         and operation_record->>'operation' = 'update_child'
         and operation_record->>'entityType' = 'capability' then
        select jsonb_build_object(
          'name', capability_row.name,
          'summary', capability_row.summary,
          'capabilityType', capability_row.capability_type,
          'features', to_jsonb(capability_row.core_features),
          'applications', to_jsonb(capability_row.defence_applications),
          'technicalTags', to_jsonb(capability_row.technical_tags),
          'technicalDomainSlugs', coalesce((
            select jsonb_agg(domain_row.slug order by domain_row.slug)
            from public.capability_domains domain_link
            join public.technical_domains domain_row on domain_row.id = domain_link.technical_domain_id
            where domain_link.capability_id = capability_row.id
              and domain_link.publication_status = 'published'
              and domain_row.publication_status = 'published'
          ), '[]'::jsonb),
          'missionMatches', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'missionAreaSlug', mission_area_row.slug,
                'alignmentSummary', mission_match_row.alignment_summary,
                'matchClass', 'derived',
                'confidence', mission_match_row.confidence
              ) order by mission_area_row.slug
            )
            from public.capability_mission_matches mission_match_row
            join public.mission_areas mission_area_row on mission_area_row.id = mission_match_row.mission_area_id
            where mission_match_row.capability_id = capability_row.id
              and mission_match_row.review_status = 'approved'
              and mission_match_row.publication_status = 'published'
              and mission_area_row.publication_status = 'published'
          ), '[]'::jsonb),
          'technologyReadinessLevel', capability_row.technology_readiness_level,
          'maturity', capability_row.maturity,
          'commercialAvailability', capability_row.commercial_availability
        ) into live_child_snapshot
        from public.capabilities capability_row
        where capability_row.id = (operation_record->>'targetId')::uuid
          and capability_row.organization_id = new.target_entity_id
          and capability_row.publication_status = 'published';

        candidate_child_snapshot := jsonb_build_object(
          'name', operation_record#>'{before,name}',
          'summary', operation_record#>'{before,summary}',
          'capabilityType', operation_record#>'{before,capabilityType}',
          'features', operation_record#>'{before,features}',
          'applications', operation_record#>'{before,applications}',
          'technicalTags', operation_record#>'{before,technicalTags}',
          'technicalDomainSlugs', coalesce((
            select jsonb_agg(candidate_domain_slug order by candidate_domain_slug)
            from jsonb_array_elements_text(coalesce(operation_record#>'{before,technicalDomainSlugs}', '[]'::jsonb)) candidate_domain(candidate_domain_slug)
          ), '[]'::jsonb),
          'missionMatches', coalesce((
            select jsonb_agg(candidate_match_value order by candidate_match_value->>'missionAreaSlug')
            from jsonb_array_elements(coalesce(operation_record#>'{before,missionMatches}', '[]'::jsonb)) candidate_match(candidate_match_value)
          ), '[]'::jsonb),
          'technologyReadinessLevel', operation_record#>'{before,technologyReadinessLevel}',
          'maturity', operation_record#>'{before,maturity}',
          'commercialAvailability', operation_record#>'{before,commercialAvailability}'
        );

        if live_child_snapshot is distinct from candidate_child_snapshot then
          raise exception 'Refresh candidate % has a stale child baseline for capability %.', new.id, operation_record->>'targetId'
            using errcode = '22023';
        end if;

      elsif not publication_transition
            and operation_record->>'operation' = 'update_child'
            and operation_record->>'entityType' = 'program_participation' then
        select jsonb_build_object(
          'participationType', participation_row.participation_type,
          'cohortLabel', participation_row.cohort_label,
          'publicSummary', participation_row.public_summary,
          'lifecycleStage', participation_row.lifecycle_stage,
          'announcedOn', participation_row.announced_on,
          'startedOn', participation_row.started_on,
          'endedOn', participation_row.ended_on,
          'externalIdentifiers', participation_row.external_identifiers
        ) into live_child_snapshot
        from public.program_participations participation_row
        where participation_row.id = (operation_record->>'targetId')::uuid
          and participation_row.organization_id = new.target_entity_id
          and participation_row.publication_status = 'published';
        if live_child_snapshot is distinct from operation_record->'before' then
          raise exception 'Refresh candidate % has a stale child baseline for program participation %.', new.id, operation_record->>'targetId'
            using errcode = '22023';
        end if;

      elsif not publication_transition
            and operation_record->>'operation' = 'update_child'
            and operation_record->>'entityType' = 'organization_relationship' then
        select jsonb_build_object(
          'relatedOrganizationName', coalesce(relationship_row.related_organization_name, related_row.name),
          'relationshipType', relationship_row.relationship_type,
          'publicSummary', relationship_row.public_summary,
          'relatedOrganizationSlug', related_row.slug
        ) into live_child_snapshot
        from public.organization_relationships relationship_row
        left join public.organizations related_row on related_row.id = relationship_row.related_organization_id
        where relationship_row.id = (operation_record->>'targetId')::uuid
          and relationship_row.organization_id = new.target_entity_id
          and relationship_row.publication_status = 'published';
        if live_child_snapshot is distinct from operation_record->'before' then
          raise exception 'Refresh candidate % has a stale child baseline for organization relationship %.', new.id, operation_record->>'targetId'
            using errcode = '22023';
        end if;

      elsif not publication_transition
            and operation_record->>'operation' = 'update_child'
            and operation_record->>'entityType' = 'funding_event' then
        select jsonb_build_object(
          'eventType', funding_row.event_type,
          'announcedOn', funding_row.announced_on,
          'amountValue', funding_row.amount_value,
          'amountCurrency', funding_row.amount_currency,
          'disclosedSummary', funding_row.disclosed_summary
        ) into live_child_snapshot
        from public.funding_events funding_row
        where funding_row.id = (operation_record->>'targetId')::uuid
          and funding_row.organization_id = new.target_entity_id
          and funding_row.publication_status = 'published';
        if live_child_snapshot is distinct from operation_record->'before' then
          raise exception 'Refresh candidate % has a stale child baseline for funding event %.', new.id, operation_record->>'targetId'
            using errcode = '22023';
        end if;

      elsif operation_record->>'operation' = 'add_child'
            and operation_record->>'entityType' = 'program_participation' then
        program_record := operation_record#>'{value,program}';
        if exists (select 1 from public.programs where slug = program_record->>'slug')
           and not exists (
             select 1
             from public.programs
             where slug = program_record->>'slug'
               and publication_status = 'published'
               and name = program_record->>'name'
               and program_type = program_record->>'programType'
               and operator_name is not distinct from program_record->>'operatorName'
               and website_url is not distinct from program_record->>'websiteUrl'
               and summary = program_record->>'summary'
           ) then
          raise exception 'Existing program % does not match the reviewed canonical program payload.', program_record->>'slug'
            using errcode = 'P0001';
        end if;
      end if;
    end loop;
  elsif new.candidate_kind = 'organization_bundle'
        and new.schema_version = 'organization_bundle_v3' then
    for participation_wrapper in
      select value
      from jsonb_array_elements(coalesce(new.proposed_record->'programParticipations', '[]'::jsonb))
    loop
      program_record := participation_wrapper->'program';
      if exists (select 1 from public.programs where slug = program_record->>'slug')
         and not exists (
           select 1
           from public.programs
           where slug = program_record->>'slug'
             and publication_status = 'published'
             and name = program_record->>'name'
             and program_type = program_record->>'programType'
             and operator_name is not distinct from program_record->>'operatorName'
             and website_url is not distinct from program_record->>'websiteUrl'
             and summary = program_record->>'summary'
         ) then
        raise exception 'Existing program % does not match the reviewed canonical program payload.', program_record->>'slug'
          using errcode = 'P0001';
      end if;
    end loop;
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_research_candidate_live_child_baselines() from public, anon, authenticated;

drop trigger if exists enforce_research_candidate_live_child_baselines on public.candidate_changes;
create trigger enforce_research_candidate_live_child_baselines
before insert or update of status, candidate_kind, target_entity_id, proposed_record, before_record
on public.candidate_changes
for each row execute function private.enforce_research_candidate_live_child_baselines();

comment on function private.enforce_research_candidate_live_child_baselines()
is 'Fail-closed guard that verifies organization refresh child snapshots and shared canonical program payloads before Admin Review and again at the transactional published transition.';
