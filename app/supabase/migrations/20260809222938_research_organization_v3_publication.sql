-- Extend the private review queue and explicit publication checkpoint for the
-- typed executive-dossier contracts. Historical v1/v2 publishers remain
-- immutable and are routed only their original candidate versions.

alter table public.candidate_changes
  drop constraint if exists candidate_changes_typed_reviewer_rationale_check;
alter table public.candidate_changes
  add constraint candidate_changes_typed_reviewer_rationale_check
  check (
    proposed_record->>'schemaVersion' <> all (array[
      'organization_bundle_v2'::text,
      'organization_bundle_v3'::text,
      'demand_signal_bundle_v1'::text,
      'program_relationship_bundle_v1'::text,
      'demand_match_bundle_v1'::text,
      'organization_refresh_bundle_v1'::text,
      'organization_refresh_bundle_v2'::text,
      'demand_refresh_bundle_v1'::text
    ])
    or length(trim(coalesce(reviewer_rationale, ''))) between 80 and 2000
  );

create or replace function private.sync_typed_candidate_reviewer_rationale()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare generated_rationale text;
begin
  if new.proposed_record->>'schemaVersion' = any (array[
    'organization_bundle_v2', 'organization_bundle_v3', 'demand_signal_bundle_v1',
    'program_relationship_bundle_v1', 'demand_match_bundle_v1',
    'organization_refresh_bundle_v1', 'organization_refresh_bundle_v2',
    'demand_refresh_bundle_v1'
  ]) then
    generated_rationale := nullif(trim(new.proposed_record->>'reviewerRationale'), '');
    if generated_rationale is null or length(generated_rationale) < 80 or length(generated_rationale) > 2000 then
      raise exception 'Typed research candidates require an 80-2000 character reviewer rationale.' using errcode = '22023';
    end if;
    new.reviewer_rationale := generated_rationale;
  end if;
  return new;
end;
$$;

create or replace function private.research_public_field_name(p_field_path text)
returns text
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  segments text[];
  leaf text;
begin
  segments := string_to_array(p_field_path, '.');
  leaf := segments[cardinality(segments)];
  if leaf ~ '^[0-9]+$' and cardinality(segments) > 1 then
    leaf := segments[cardinality(segments) - 1];
  end if;
  return case leaf
    when 'legalName' then 'legal_name'
    when 'websiteUrl' then 'website_url'
    when 'entityKind' then 'entity_kind'
    when 'categories' then 'organization_categories'
    when 'foundedYear' then 'founded_year'
    when 'employeeRange' then 'employee_range'
    when 'companyStage' then 'company_stage'
    when 'commercialStatus' then 'commercial_status'
    when 'disclosedFinancingSummary' then 'disclosed_financing_summary'
    when 'defencePosture' then 'defence_posture'
    when 'dualUsePosture' then 'dual_use_posture'
    when 'currentActivity' then 'current_activity'
    when 'currentActivityAsOf' then 'current_activity_as_of'
    when 'operatingContext' then 'operating_context'
    when 'canadianFootprint' then 'canadian_footprint'
    when 'reviewedQuestions' then 'reviewed_questions'
    when 'capabilityType' then 'capability_type'
    when 'features' then 'core_features'
    when 'technologyReadinessLevel' then 'technology_readiness_level'
    when 'commercialAvailability' then 'commercial_availability'
    when 'applications' then 'defence_applications'
    when 'technicalTags' then 'technical_tags'
    when 'alignmentSummary' then 'alignment_summary'
    when 'programType' then 'program_type'
    when 'operatorName' then 'operator_name'
    when 'participationType' then 'participation_type'
    when 'cohortLabel' then 'cohort_label'
    when 'publicSummary' then 'public_summary'
    when 'lifecycleStage' then 'lifecycle_stage'
    when 'announcedOn' then 'announced_on'
    when 'startedOn' then 'started_on'
    when 'endedOn' then 'ended_on'
    when 'externalIdentifiers' then 'external_identifiers'
    when 'eventType' then 'event_type'
    when 'amountValue' then 'amount_value'
    when 'amountCurrency' then 'amount_currency'
    when 'disclosedSummary' then 'disclosed_summary'
    when 'relatedOrganizationName' then 'related_organization_name'
    when 'relatedOrganizationSlug' then 'related_organization_id'
    when 'relationshipType' then 'relationship_type'
    else lower(leaf)
  end;
end;
$$;

revoke all on function private.research_public_field_name(text) from public, anon, authenticated;
grant execute on function private.research_public_field_name(text) to authenticated, service_role;

create or replace function private.organization_profile_field_is_allowed(
  p_entity_kind text,
  p_field_name text
)
returns boolean
language sql
immutable
set search_path = pg_catalog
as $$
  select case p_entity_kind
    when 'company' then p_field_name = any (array[
      'portfolioScope', 'portfolioSummary', 'manufacturingModel', 'intellectualProperty',
      'operatingModel', 'securityPosture', 'qualityCertification', 'operatingUnits',
      'parentOrganization'
    ])
    when 'accelerator' then p_field_name = any (array['mandate', 'cohortModel', 'sectorFocus', 'parentOrganization'])
    when 'incubator' then p_field_name = any (array['mandate', 'cohortModel', 'sectorFocus', 'parentOrganization'])
    when 'research_test_centre' then p_field_name = any (array[
      'technicalMandate', 'institutionalRelationship', 'parentOrganization', 'priorityAreas',
      'testbedPlatforms', 'operatingEnvironment', 'secureEnvironmentRole', 'strategicSectors'
    ])
    when 'investor_funder' then p_field_name = any (array['mandate', 'investmentFocus', 'portfolioSummary', 'parentOrganization'])
    when 'ecosystem_organization' then p_field_name = any (array['mandate', 'sectorFocus', 'parentOrganization'])
    when 'government_innovation_office' then p_field_name = any (array['mandate', 'parentOrganization', 'classificationNote'])
    else false
  end;
$$;

revoke all on function private.organization_profile_field_is_allowed(text, text) from public, anon, authenticated;
grant execute on function private.organization_profile_field_is_allowed(text, text) to authenticated, service_role;

create or replace function public.publish_reviewed_organization_v3_candidates(
  p_candidate_ids uuid[],
  p_reviewer_id uuid
)
returns table(candidate_id uuid, entity_type text, entity_id uuid, entity_slug text)
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $$
declare
  candidate_row public.candidate_changes%rowtype;
  record jsonb;
  organization_record jsonb;
  capability_record jsonb;
  mission_record jsonb;
  participation_wrapper jsonb;
  program_record jsonb;
  participation_record jsonb;
  funding_record jsonb;
  relationship_record jsonb;
  source_record jsonb;
  evidence_record jsonb;
  question_record jsonb;
  selected_count integer;
  capability_index bigint;
  mission_index bigint;
  participation_index bigint;
  funding_index bigint;
  relationship_index bigint;
  new_organization_id uuid;
  new_location_id uuid;
  new_capability_id uuid;
  new_mission_match_id uuid;
  new_program_id uuid;
  new_participation_id uuid;
  new_funding_id uuid;
  new_relationship_id uuid;
  new_source_id uuid;
  new_evidence_id uuid;
  related_organization_id uuid;
  domain_id uuid;
  domain_slug text;
  source_key text;
  field_path text;
  field_name text;
  entity_index text;
  evidence_entity_type text;
  evidence_entity_id uuid;
  clean_profile_data jsonb;
  clean_public_contact jsonb;
  source_map jsonb;
  capability_map jsonb;
  mission_map jsonb;
  program_map jsonb;
  participation_map jsonb;
  funding_map jsonb;
  relationship_map jsonb;
  published_on timestamptz := now();
begin
  if not private.is_atlas_staff() or auth.uid() is distinct from p_reviewer_id then
    raise exception 'Publication requires the authenticated atlas reviewer.' using errcode = '42501';
  end if;
  if p_candidate_ids is null or cardinality(p_candidate_ids) < 1 or cardinality(p_candidate_ids) > 50 then
    raise exception 'Select between one and fifty approved organization v3 candidates.' using errcode = '22023';
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
    and proposed_record->>'schemaVersion' = 'organization_bundle_v3'
    and coalesce(duplicate_check->>'status', '') = 'clear';
  if selected_count <> cardinality(p_candidate_ids) then
    raise exception 'Every organization v3 candidate must be approved, duplicate-cleared, and schema-valid.' using errcode = '22023';
  end if;

  for candidate_row in
    select * from public.candidate_changes
    where id = any(p_candidate_ids)
    order by created_at, id
    for update
  loop
    record := candidate_row.proposed_record;
    organization_record := record->'organization';
    source_map := '{}'::jsonb;
    capability_map := '{}'::jsonb;
    mission_map := '{}'::jsonb;
    program_map := '{}'::jsonb;
    participation_map := '{}'::jsonb;
    funding_map := '{}'::jsonb;
    relationship_map := '{}'::jsonb;

    if nullif(organization_record->>'slug', '') is null
       or nullif(organization_record->>'name', '') is null
       or length(trim(coalesce(organization_record->>'description', ''))) < 40
       or jsonb_typeof(organization_record->'profileData') <> 'object'
       or jsonb_typeof(organization_record->'reviewedQuestions') <> 'array'
       or jsonb_array_length(coalesce(record->'sources', '[]'::jsonb)) < 1
       or jsonb_array_length(coalesce(record->'fieldEvidence', '[]'::jsonb)) < 1 then
      raise exception 'Organization v3 candidate % is incomplete.', candidate_row.id using errcode = '22023';
    end if;
    if exists (select 1 from public.organizations where slug = organization_record->>'slug') then
      raise exception 'Organization slug % already exists.', organization_record->>'slug' using errcode = '23505';
    end if;
    if (organization_record->>'currentActivity' is null) <> (organization_record->>'currentActivityAsOf' is null) then
      raise exception 'Current activity and its as-of date must be published together.' using errcode = '22023';
    end if;

    clean_profile_data := coalesce(organization_record->'profileData', '{}'::jsonb);
    clean_public_contact := jsonb_strip_nulls(coalesce(organization_record->'publicContact', '{}'::jsonb));
    if clean_public_contact <> '{}'::jsonb then
      clean_profile_data := jsonb_set(clean_profile_data, '{publicContact}', clean_public_contact, true);
    end if;

    insert into public.organizations (
      slug, name, legal_name, description, website_url, entity_kind,
      organization_categories, founded_year, employee_range, company_stage,
      ownership, commercial_status, disclosed_financing_summary, defence_posture,
      dual_use_posture, profile_data, editorial_profile_version, current_activity,
      current_activity_as_of, operating_context, canadian_footprint, reviewed_questions,
      publication_status, source_confidence, freshness_status, last_reviewed_at,
      published_at
    ) values (
      organization_record->>'slug', organization_record->>'name', organization_record->>'legalName',
      organization_record->>'description', organization_record->>'websiteUrl', organization_record->>'entityKind',
      array(select jsonb_array_elements_text(coalesce(organization_record->'categories', '[]'::jsonb))),
      nullif(organization_record->>'foundedYear', '')::integer,
      organization_record->>'employeeRange', organization_record->>'companyStage',
      organization_record->>'ownership', organization_record->>'commercialStatus',
      organization_record->>'disclosedFinancingSummary', organization_record->>'defencePosture',
      organization_record->>'dualUsePosture', clean_profile_data,
      organization_record->>'editorialProfileVersion', organization_record->>'currentActivity',
      nullif(organization_record->>'currentActivityAsOf', '')::date,
      organization_record->>'operatingContext', organization_record->>'canadianFootprint',
      coalesce(organization_record->'reviewedQuestions', '[]'::jsonb),
      'published', candidate_row.confidence, 'current', published_on, published_on
    ) returning id into new_organization_id;

    insert into public.locations (
      name, city, province_territory, country_code, latitude, longitude, geographic_confidence
    ) values (
      concat_ws(', ', organization_record#>>'{primaryLocation,city}', organization_record#>>'{primaryLocation,provinceTerritory}'),
      organization_record#>>'{primaryLocation,city}', organization_record#>>'{primaryLocation,provinceTerritory}',
      organization_record#>>'{primaryLocation,countryCode}',
      (organization_record#>>'{primaryLocation,latitude}')::double precision,
      (organization_record#>>'{primaryLocation,longitude}')::double precision,
      organization_record#>>'{primaryLocation,geographicConfidence}'
    ) returning id into new_location_id;

    insert into public.organization_locations (
      organization_id, location_id, location_role, is_primary, publication_status
    ) values (new_organization_id, new_location_id, 'headquarters', true, 'published');

    insert into public.organization_aliases (organization_id, alias, alias_type, publication_status)
    select new_organization_id, alias_value, 'other', 'published'
    from jsonb_array_elements_text(coalesce(organization_record->'aliases', '[]'::jsonb)) alias_value;

    for capability_record, capability_index in
      select value, ordinality - 1
      from jsonb_array_elements(coalesce(record->'capabilities', '[]'::jsonb)) with ordinality
    loop
      if exists (select 1 from public.capabilities where slug = capability_record->>'slug') then
        raise exception 'Capability slug % already exists.', capability_record->>'slug' using errcode = '23505';
      end if;
      insert into public.capabilities (
        organization_id, slug, name, summary, capability_type, core_features,
        technology_readiness_level, maturity, commercial_availability,
        defence_applications, technical_tags, publication_status, source_confidence,
        last_reviewed_at, published_at
      ) values (
        new_organization_id, capability_record->>'slug', capability_record->>'name',
        capability_record->>'summary', capability_record->>'capabilityType',
        array(select jsonb_array_elements_text(coalesce(capability_record->'features', '[]'::jsonb))),
        nullif(capability_record->>'technologyReadinessLevel', '')::smallint,
        capability_record->>'maturity', capability_record->>'commercialAvailability',
        array(select jsonb_array_elements_text(coalesce(capability_record->'applications', '[]'::jsonb))),
        array(select jsonb_array_elements_text(coalesce(capability_record->'technicalTags', '[]'::jsonb))),
        'published', candidate_row.confidence, published_on, published_on
      ) returning id into new_capability_id;
      capability_map := capability_map || jsonb_build_object(capability_index::text, new_capability_id::text);

      for domain_slug in select jsonb_array_elements_text(coalesce(capability_record->'technicalDomainSlugs', '[]'::jsonb))
      loop
        select id into domain_id from public.technical_domains
        where slug = domain_slug and publication_status = 'published';
        if domain_id is null then
          raise exception 'Unknown technical domain %.', domain_slug using errcode = '22023';
        end if;
        insert into public.capability_domains (capability_id, technical_domain_id, is_primary, publication_status)
        values (new_capability_id, domain_id, domain_slug = capability_record#>>'{technicalDomainSlugs,0}', 'published')
        on conflict do nothing;
      end loop;

      for mission_record, mission_index in
        select value, ordinality - 1
        from jsonb_array_elements(coalesce(capability_record->'missionMatches', '[]'::jsonb)) with ordinality
      loop
        select id into domain_id from public.mission_areas
        where slug = mission_record->>'missionAreaSlug' and publication_status = 'published';
        if domain_id is null then
          raise exception 'Unknown mission area %.', mission_record->>'missionAreaSlug' using errcode = '22023';
        end if;
        insert into public.capability_mission_matches (
          capability_id, mission_area_id, alignment_summary, match_type,
          confidence, review_status, publication_status
        ) values (
          new_capability_id, domain_id, mission_record->>'alignmentSummary', 'derived',
          mission_record->>'confidence', 'approved', 'published'
        ) returning id into new_mission_match_id;
        mission_map := mission_map || jsonb_build_object(capability_index::text || ':' || mission_index::text, new_mission_match_id::text);
      end loop;
    end loop;

    for participation_wrapper, participation_index in
      select value, ordinality - 1
      from jsonb_array_elements(coalesce(record->'programParticipations', '[]'::jsonb)) with ordinality
    loop
      program_record := participation_wrapper->'program';
      participation_record := participation_wrapper->'participation';
      new_program_id := null;
      select id into new_program_id from public.programs where slug = program_record->>'slug';
      if new_program_id is null then
        insert into public.programs (
          slug, name, program_type, operator_name, website_url, summary, publication_status
        ) values (
          program_record->>'slug', program_record->>'name', program_record->>'programType',
          program_record->>'operatorName', program_record->>'websiteUrl', program_record->>'summary', 'published'
        ) returning id into new_program_id;
      elsif not exists (
        select 1 from public.programs
        where id = new_program_id
          and publication_status = 'published'
          and name = program_record->>'name'
          and program_type = program_record->>'programType'
          and summary = program_record->>'summary'
      ) then
        raise exception 'Existing program % does not match the reviewed canonical program payload.', program_record->>'slug' using errcode = 'P0001';
      end if;
      program_map := program_map || jsonb_build_object(participation_index::text, new_program_id::text);

      insert into public.program_participations (
        organization_id, program_id, participation_type, cohort_label, public_summary,
        lifecycle_stage, announced_on, started_on, ended_on, external_identifiers,
        publication_status
      ) values (
        new_organization_id, new_program_id, participation_record->>'participationType',
        participation_record->>'cohortLabel', participation_record->>'publicSummary',
        participation_record->>'lifecycleStage', nullif(participation_record->>'announcedOn', '')::date,
        nullif(participation_record->>'startedOn', '')::date, nullif(participation_record->>'endedOn', '')::date,
        coalesce(participation_record->'externalIdentifiers', '[]'::jsonb), 'published'
      ) returning id into new_participation_id;
      participation_map := participation_map || jsonb_build_object(participation_index::text, new_participation_id::text);
    end loop;

    for funding_record, funding_index in
      select value, ordinality - 1
      from jsonb_array_elements(coalesce(record->'fundingEvents', '[]'::jsonb)) with ordinality
    loop
      insert into public.funding_events (
        organization_id, event_type, announced_on, amount_value, amount_currency,
        disclosed_summary, publication_status
      ) values (
        new_organization_id, funding_record->>'eventType', nullif(funding_record->>'announcedOn', '')::date,
        nullif(funding_record->>'amountValue', '')::numeric, funding_record->>'amountCurrency',
        funding_record->>'disclosedSummary', 'published'
      ) returning id into new_funding_id;
      funding_map := funding_map || jsonb_build_object(funding_index::text, new_funding_id::text);
    end loop;

    for relationship_record, relationship_index in
      select value, ordinality - 1
      from jsonb_array_elements(coalesce(record->'relationships', '[]'::jsonb)) with ordinality
    loop
      related_organization_id := null;
      if nullif(relationship_record->>'relatedOrganizationSlug', '') is not null then
        select id into related_organization_id
        from public.organizations
        where slug = relationship_record->>'relatedOrganizationSlug'
          and publication_status = 'published';
        if related_organization_id is null then
          raise exception 'Related organization % is not published.', relationship_record->>'relatedOrganizationSlug' using errcode = '22023';
        end if;
      end if;
      insert into public.organization_relationships (
        organization_id, related_organization_id, related_organization_name,
        relationship_type, public_summary, publication_status
      ) values (
        new_organization_id, related_organization_id, relationship_record->>'relatedOrganizationName',
        relationship_record->>'relationshipType', relationship_record->>'publicSummary', 'published'
      ) returning id into new_relationship_id;
      relationship_map := relationship_map || jsonb_build_object(relationship_index::text, new_relationship_id::text);
    end loop;

    for source_record in select value from jsonb_array_elements(record->'sources')
    loop
      insert into public.sources (
        title, canonical_url, publisher, source_type, visibility, published_at,
        accessed_at, public_approved, notes
      ) values (
        source_record->>'title', source_record->>'url', source_record->>'publisher',
        source_record->>'sourceKind', 'public', nullif(source_record->>'publishedAt', '')::timestamptz,
        (source_record->>'accessedAt')::timestamptz, true, source_record->>'summary'
      )
      on conflict (canonical_url) where canonical_url is not null do update
      set title = excluded.title,
          publisher = excluded.publisher,
          source_type = excluded.source_type,
          visibility = 'public',
          public_approved = true,
          accessed_at = greatest(public.sources.accessed_at, excluded.accessed_at),
          updated_at = now()
      returning id into new_source_id;
      source_map := source_map || jsonb_build_object(source_record->>'id', new_source_id::text);
    end loop;

    for evidence_record in select value from jsonb_array_elements(record->'fieldEvidence')
    loop
      source_key := evidence_record->>'sourceId';
      if nullif(source_map->>source_key, '') is null then
        raise exception 'Evidence references missing source %.', source_key using errcode = '22023';
      end if;
      insert into public.evidence_snippets (
        source_id, excerpt, source_locator, visibility, public_approved, extracted_at
      ) values (
        (source_map->>source_key)::uuid, evidence_record->>'excerpt', evidence_record->>'fieldPath',
        'public', true, published_on
      ) returning id into new_evidence_id;

      field_path := evidence_record->>'fieldPath';
      evidence_entity_type := null;
      evidence_entity_id := null;
      field_name := null;

      if field_path like 'organization.reviewedQuestions.%.%' then
        entity_index := split_part(field_path, '.', 3);
        question_record := organization_record#>(array['reviewedQuestions', entity_index]);
        evidence_entity_type := 'organization';
        evidence_entity_id := new_organization_id;
        field_name := 'reviewed_questions.' || (question_record->>'id') || '.' || lower(split_part(field_path, '.', 4));
      elsif field_path like 'organization.profileData.%' then
        evidence_entity_type := 'organization';
        evidence_entity_id := new_organization_id;
        field_name := 'profileData.' || split_part(field_path, '.', 3);
      elsif field_path like 'organization.publicContact.%' then
        evidence_entity_type := 'organization';
        evidence_entity_id := new_organization_id;
        field_name := 'profileData.publicContact.' || split_part(field_path, '.', 3);
      elsif field_path like 'organization.primaryLocation.%' then
        evidence_entity_type := 'organization';
        evidence_entity_id := new_organization_id;
        field_name := 'primary_location.' || private.research_public_field_name(field_path);
      elsif field_path like 'organization.%' then
        evidence_entity_type := 'organization';
        evidence_entity_id := new_organization_id;
        field_name := private.research_public_field_name(field_path);
      elsif field_path like 'capabilities.%.missionMatches.%.%' then
        entity_index := split_part(field_path, '.', 2) || ':' || split_part(field_path, '.', 4);
        evidence_entity_type := 'capability_mission_match';
        evidence_entity_id := nullif(mission_map->>entity_index, '')::uuid;
        field_name := private.research_public_field_name(field_path);
      elsif field_path like 'capabilities.%' then
        entity_index := split_part(field_path, '.', 2);
        evidence_entity_type := 'capability';
        evidence_entity_id := nullif(capability_map->>entity_index, '')::uuid;
        field_name := private.research_public_field_name(field_path);
      elsif field_path like 'programParticipations.%.program.%' then
        entity_index := split_part(field_path, '.', 2);
        evidence_entity_type := 'program';
        evidence_entity_id := nullif(program_map->>entity_index, '')::uuid;
        field_name := private.research_public_field_name(field_path);
      elsif field_path like 'programParticipations.%.participation.%' then
        entity_index := split_part(field_path, '.', 2);
        evidence_entity_type := 'program_participation';
        evidence_entity_id := nullif(participation_map->>entity_index, '')::uuid;
        field_name := case
          when field_path like '%.externalIdentifiers.%' then 'external_identifiers'
          else private.research_public_field_name(field_path)
        end;
      elsif field_path like 'fundingEvents.%' then
        entity_index := split_part(field_path, '.', 2);
        evidence_entity_type := 'funding_event';
        evidence_entity_id := nullif(funding_map->>entity_index, '')::uuid;
        field_name := private.research_public_field_name(field_path);
      elsif field_path like 'relationships.%' then
        entity_index := split_part(field_path, '.', 2);
        evidence_entity_type := 'organization_relationship';
        evidence_entity_id := nullif(relationship_map->>entity_index, '')::uuid;
        field_name := private.research_public_field_name(field_path);
      end if;

      if evidence_entity_id is not null and field_name is not null then
        insert into public.field_citations (entity_type, entity_id, field_name, evidence_snippet_id)
        values (evidence_entity_type, evidence_entity_id, field_name, new_evidence_id)
        on conflict do nothing;
      end if;
    end loop;

    if not private.has_public_field_citation('organization', new_organization_id, 'description') then
      raise exception 'Organization v3 candidate % lacks cited executive copy.', candidate_row.id using errcode = '22023';
    end if;
    if organization_record->>'currentActivity' is not null
       and (not private.has_public_field_citation('organization', new_organization_id, 'current_activity')
         or not private.has_public_field_citation('organization', new_organization_id, 'current_activity_as_of')) then
      raise exception 'Organization v3 candidate % lacks complete current-activity evidence.', candidate_row.id using errcode = '22023';
    end if;
    if organization_record->>'operatingContext' is not null
       and not private.has_public_field_citation('organization', new_organization_id, 'operating_context') then
      raise exception 'Organization v3 candidate % lacks operating-context evidence.', candidate_row.id using errcode = '22023';
    end if;
    if organization_record->>'canadianFootprint' is not null
       and not private.has_public_field_citation('organization', new_organization_id, 'canadian_footprint') then
      raise exception 'Organization v3 candidate % lacks Canadian-footprint evidence.', candidate_row.id using errcode = '22023';
    end if;
    for question_record in select value from jsonb_array_elements(organization_record->'reviewedQuestions')
    loop
      if not private.has_public_field_citation(
        'organization', new_organization_id, 'reviewed_questions.' || (question_record->>'id') || '.context'
      ) then
        raise exception 'Reviewed question % lacks cited decision context.', question_record->>'id' using errcode = '22023';
      end if;
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
      'Reviewer published an approved organization v3 executive dossier.',
      jsonb_build_object('candidate_id', candidate_row.id, 'schema_version', 'organization_bundle_v3')
    );

    candidate_id := candidate_row.id;
    entity_type := 'organization';
    entity_id := new_organization_id;
    entity_slug := organization_record->>'slug';
    return next;
  end loop;
end;
$$;

revoke all on function public.publish_reviewed_organization_v3_candidates(uuid[], uuid)
from public, anon, authenticated;
grant execute on function public.publish_reviewed_organization_v3_candidates(uuid[], uuid)
to authenticated;

comment on function public.publish_reviewed_organization_v3_candidates(uuid[], uuid)
is 'Publishes only explicitly approved organization_bundle_v3 candidates, preserving canonical program copy and attaching leaf evidence to the normalized dossier records.';

create or replace function public.publish_reviewed_organization_refresh_v2_candidates(
  p_candidate_ids uuid[],
  p_reviewer_id uuid
)
returns table(candidate_id uuid, entity_type text, entity_id uuid, entity_slug text)
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $$
declare
  candidate_row public.candidate_changes%rowtype;
  record jsonb;
  operation_record jsonb;
  source_record jsonb;
  evidence_record jsonb;
  leaf_record jsonb;
  evidence_id_value text;
  capability_record jsonb;
  mission_record jsonb;
  program_record jsonb;
  participation_record jsonb;
  relationship_record jsonb;
  funding_record jsonb;
  question_record jsonb;
  selected_count integer;
  mission_index bigint;
  target_updated_at timestamptz;
  exact_baseline text;
  organization_kind text;
  organization_slug text;
  affected_entity_type text;
  affected_entity_id uuid;
  leaf_entity_type text;
  leaf_entity_id uuid;
  live_child_snapshot jsonb;
  candidate_child_snapshot jsonb;
  new_child_id uuid;
  new_program_id uuid;
  new_participation_id uuid;
  new_mission_match_id uuid;
  resolved_related_organization_id uuid;
  mission_area_id uuid;
  domain_id uuid;
  domain_slug text;
  source_id uuid;
  evidence_id uuid;
  field_name text;
  leaf_path text;
  clean_contact jsonb;
  source_map jsonb;
  evidence_map jsonb;
  mission_map jsonb;
  published_on timestamptz := now();
begin
  if not private.is_atlas_staff() or auth.uid() is distinct from p_reviewer_id then
    raise exception 'Publication requires the authenticated atlas reviewer.' using errcode = '42501';
  end if;
  if p_candidate_ids is null or cardinality(p_candidate_ids) < 1 or cardinality(p_candidate_ids) > 50 then
    raise exception 'Select between one and fifty approved organization refresh v2 candidates.' using errcode = '22023';
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
    and candidate_kind = 'organization_refresh_bundle'
    and proposed_record->>'schemaVersion' = 'organization_refresh_bundle_v2'
    and coalesce(duplicate_check->>'status', '') = 'clear';
  if selected_count <> cardinality(p_candidate_ids) then
    raise exception 'Every organization refresh v2 candidate must be approved, duplicate-cleared, and schema-valid.' using errcode = '22023';
  end if;

  for candidate_row in
    select * from public.candidate_changes
    where id = any(p_candidate_ids)
    order by created_at, id
    for update
  loop
    record := candidate_row.proposed_record;
    exact_baseline := candidate_row.before_record#>>'{organization,updated_at}';
    if exact_baseline is null
       or record#>>'{targetMatch,baselineUpdatedAt}' is distinct from exact_baseline
       or record#>>'{targetMatch,entityId}' is distinct from candidate_row.target_entity_id::text
       or record->'beforeRecord' is distinct from candidate_row.before_record then
      raise exception 'Refresh candidate % has inconsistent target or exact baseline data.', candidate_row.id using errcode = '22023';
    end if;

    select slug, entity_kind, updated_at
      into organization_slug, organization_kind, target_updated_at
    from public.organizations
    where id = candidate_row.target_entity_id
      and publication_status = 'published'
    for update;
    if target_updated_at is null then
      raise exception 'Refresh target for candidate % no longer exists.', candidate_row.id using errcode = 'P0002';
    end if;
    if target_updated_at is distinct from exact_baseline::timestamptz then
      raise exception 'Refresh candidate % (%) has a stale baseline.', candidate_row.id, organization_slug using errcode = 'P0001';
    end if;

    source_map := '{}'::jsonb;
    evidence_map := '{}'::jsonb;
    for source_record in select value from jsonb_array_elements(coalesce(record->'sources', '[]'::jsonb))
    loop
      insert into public.sources (
        title, canonical_url, publisher, source_type, visibility, published_at,
        accessed_at, public_approved, notes
      ) values (
        source_record->>'title', source_record->>'url', source_record->>'publisher',
        source_record->>'sourceKind', 'public', nullif(source_record->>'publishedAt', '')::timestamptz,
        (source_record->>'accessedAt')::timestamptz, true,
        concat('Organization refresh ', candidate_row.id, ': ', source_record->>'summary')
      )
      on conflict (canonical_url) where canonical_url is not null do update
      set title = excluded.title,
          publisher = excluded.publisher,
          source_type = excluded.source_type,
          visibility = 'public',
          public_approved = true,
          accessed_at = greatest(public.sources.accessed_at, excluded.accessed_at),
          updated_at = now()
      returning id into source_id;
      source_map := source_map || jsonb_build_object(source_record->>'id', source_id::text);
    end loop;

    for evidence_record in select value from jsonb_array_elements(coalesce(record->'fieldEvidence', '[]'::jsonb))
    loop
      source_id := nullif(source_map->>coalesce(evidence_record->>'sourceId', ''), '')::uuid;
      if source_id is null then
        raise exception 'Refresh evidence % has no resolvable public source.', evidence_record->>'id' using errcode = '22023';
      end if;
      insert into public.evidence_snippets (
        source_id, excerpt, source_locator, visibility, public_approved, extracted_at
      ) values (
        source_id, evidence_record->>'excerpt', evidence_record->>'fieldPath',
        'public', true, published_on
      ) returning id into evidence_id;
      evidence_map := evidence_map || jsonb_build_object(evidence_record->>'id', evidence_id::text);
    end loop;

    for operation_record in select value from jsonb_array_elements(coalesce(record->'operations', '[]'::jsonb))
    loop
      affected_entity_type := null;
      affected_entity_id := null;
      new_child_id := null;
      new_program_id := null;
      new_participation_id := null;
      mission_map := '{}'::jsonb;

      if operation_record->>'operation' = 'set_field' then
        if operation_record->>'entityType' <> 'organization'
           or operation_record->>'targetId' <> candidate_row.target_entity_id::text
           or operation_record->>'field' not in (
             'name', 'legal_name', 'description', 'website_url', 'organization_categories',
             'founded_year', 'employee_range', 'company_stage', 'ownership', 'commercial_status',
             'disclosed_financing_summary', 'defence_posture', 'dual_use_posture', 'public_contact',
             'current_activity', 'current_activity_as_of', 'operating_context', 'canadian_footprint',
             'reviewed_questions', 'editorial_profile_version'
           ) then
          raise exception 'Unsafe organization field operation in candidate %.', candidate_row.id using errcode = '22023';
        end if;

        clean_contact := case
          when operation_record->>'field' = 'public_contact'
            then jsonb_strip_nulls(coalesce(operation_record->'after', '{}'::jsonb))
          else '{}'::jsonb
        end;
        update public.organizations
        set name = case when operation_record->>'field' = 'name' then operation_record#>>'{after}' else name end,
            legal_name = case when operation_record->>'field' = 'legal_name' then operation_record#>>'{after}' else legal_name end,
            description = case when operation_record->>'field' = 'description' then operation_record#>>'{after}' else description end,
            website_url = case when operation_record->>'field' = 'website_url' then operation_record#>>'{after}' else website_url end,
            organization_categories = case when operation_record->>'field' = 'organization_categories' then array(select jsonb_array_elements_text(operation_record->'after')) else organization_categories end,
            founded_year = case when operation_record->>'field' = 'founded_year' then nullif(operation_record#>>'{after}', '')::integer else founded_year end,
            employee_range = case when operation_record->>'field' = 'employee_range' then operation_record#>>'{after}' else employee_range end,
            company_stage = case when operation_record->>'field' = 'company_stage' then operation_record#>>'{after}' else company_stage end,
            ownership = case when operation_record->>'field' = 'ownership' then operation_record#>>'{after}' else ownership end,
            commercial_status = case when operation_record->>'field' = 'commercial_status' then operation_record#>>'{after}' else commercial_status end,
            disclosed_financing_summary = case when operation_record->>'field' = 'disclosed_financing_summary' then operation_record#>>'{after}' else disclosed_financing_summary end,
            defence_posture = case when operation_record->>'field' = 'defence_posture' then operation_record#>>'{after}' else defence_posture end,
            dual_use_posture = case when operation_record->>'field' = 'dual_use_posture' then operation_record#>>'{after}' else dual_use_posture end,
            profile_data = case when operation_record->>'field' = 'public_contact' then
              case when clean_contact = '{}'::jsonb then profile_data - 'publicContact' else jsonb_set(profile_data, '{publicContact}', clean_contact, true) end
              else profile_data end,
            current_activity = case when operation_record->>'field' = 'current_activity' then operation_record#>>'{after}' else current_activity end,
            current_activity_as_of = case when operation_record->>'field' = 'current_activity_as_of' then nullif(operation_record#>>'{after}', '')::date else current_activity_as_of end,
            operating_context = case when operation_record->>'field' = 'operating_context' then operation_record#>>'{after}' else operating_context end,
            canadian_footprint = case when operation_record->>'field' = 'canadian_footprint' then operation_record#>>'{after}' else canadian_footprint end,
            reviewed_questions = case when operation_record->>'field' = 'reviewed_questions' then operation_record->'after' else reviewed_questions end,
            editorial_profile_version = case when operation_record->>'field' = 'editorial_profile_version' then operation_record#>>'{after}' else editorial_profile_version end,
            source_confidence = candidate_row.confidence,
            freshness_status = 'current',
            last_reviewed_at = published_on,
            updated_at = published_on
        where id = candidate_row.target_entity_id;
        affected_entity_type := 'organization';
        affected_entity_id := candidate_row.target_entity_id;

      elsif operation_record->>'operation' = 'set_profile_field' then
        if operation_record->>'entityType' <> 'organization'
           or operation_record->>'targetId' <> candidate_row.target_entity_id::text
           or not private.organization_profile_field_is_allowed(organization_kind, operation_record->>'profileField') then
          raise exception 'Unsafe type-specific profile operation in candidate %.', candidate_row.id using errcode = '22023';
        end if;
        update public.organizations
        set profile_data = case
              when operation_record->'after' = 'null'::jsonb then profile_data - (operation_record->>'profileField')
              else jsonb_set(profile_data, array[operation_record->>'profileField'], operation_record->'after', true)
            end,
            source_confidence = candidate_row.confidence,
            freshness_status = 'current',
            last_reviewed_at = published_on,
            updated_at = published_on
        where id = candidate_row.target_entity_id;
        affected_entity_type := 'organization';
        affected_entity_id := candidate_row.target_entity_id;

      elsif operation_record->>'operation' = 'add_child' and operation_record->>'entityType' = 'capability' then
        if operation_record->>'parentId' <> candidate_row.target_entity_id::text then
          raise exception 'Capability parent mismatch.' using errcode = '22023';
        end if;
        capability_record := operation_record->'value';
        insert into public.capabilities (
          organization_id, slug, name, summary, capability_type, core_features,
          technology_readiness_level, maturity, commercial_availability,
          defence_applications, technical_tags, publication_status, source_confidence,
          last_reviewed_at, published_at
        ) values (
          candidate_row.target_entity_id, capability_record->>'slug', capability_record->>'name',
          capability_record->>'summary', capability_record->>'capabilityType',
          array(select jsonb_array_elements_text(coalesce(capability_record->'features', '[]'::jsonb))),
          nullif(capability_record->>'technologyReadinessLevel', '')::smallint,
          capability_record->>'maturity', capability_record->>'commercialAvailability',
          array(select jsonb_array_elements_text(coalesce(capability_record->'applications', '[]'::jsonb))),
          array(select jsonb_array_elements_text(coalesce(capability_record->'technicalTags', '[]'::jsonb))),
          'published', candidate_row.confidence, published_on, published_on
        ) returning id into new_child_id;
        for domain_slug in select jsonb_array_elements_text(coalesce(capability_record->'technicalDomainSlugs', '[]'::jsonb))
        loop
          select id into domain_id from public.technical_domains where slug = domain_slug and publication_status = 'published';
          if domain_id is null then raise exception 'Unknown technical domain %.', domain_slug using errcode = '22023'; end if;
          insert into public.capability_domains (capability_id, technical_domain_id, is_primary, publication_status)
          values (new_child_id, domain_id, domain_slug = capability_record#>>'{technicalDomainSlugs,0}', 'published')
          on conflict do nothing;
        end loop;
        for mission_record, mission_index in
          select value, ordinality - 1 from jsonb_array_elements(coalesce(capability_record->'missionMatches', '[]'::jsonb)) with ordinality
        loop
          select id into mission_area_id from public.mission_areas where slug = mission_record->>'missionAreaSlug' and publication_status = 'published';
          if mission_area_id is null then raise exception 'Unknown mission area %.', mission_record->>'missionAreaSlug' using errcode = '22023'; end if;
          insert into public.capability_mission_matches (
            capability_id, mission_area_id, alignment_summary, match_type, confidence,
            review_status, publication_status
          ) values (
            new_child_id, mission_area_id, mission_record->>'alignmentSummary', 'derived',
            mission_record->>'confidence', 'approved', 'published'
          ) returning id into new_mission_match_id;
          mission_map := mission_map || jsonb_build_object(mission_index::text, new_mission_match_id::text);
        end loop;
        affected_entity_type := 'capability';
        affected_entity_id := new_child_id;

      elsif operation_record->>'operation' = 'update_child' and operation_record->>'entityType' = 'capability' then
        capability_record := operation_record->'after';
        perform 1
        from public.capabilities
        where id = (operation_record->>'targetId')::uuid
          and organization_id = candidate_row.target_entity_id
          and publication_status = 'published'
        for update;
        if not found then raise exception 'Capability refresh target mismatch.' using errcode = '22023'; end if;
        select jsonb_build_object(
          'name', capability_row.name,
          'summary', capability_row.summary,
          'capabilityType', capability_row.capability_type,
          'features', to_jsonb(capability_row.core_features),
          'applications', to_jsonb(capability_row.defence_applications),
          'technicalTags', to_jsonb(capability_row.technical_tags),
          'technicalDomainSlugs', coalesce((
            select jsonb_agg(domain_row.slug order by domain_link.is_primary desc, domain_row.slug)
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
        where capability_row.id = (operation_record->>'targetId')::uuid;
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
        live_child_snapshot := jsonb_set(
          live_child_snapshot,
          '{technicalDomainSlugs}',
          coalesce((
            select jsonb_agg(live_domain_slug order by live_domain_slug)
            from jsonb_array_elements_text(live_child_snapshot->'technicalDomainSlugs') live_domain(live_domain_slug)
          ), '[]'::jsonb)
        );
        if live_child_snapshot is distinct from candidate_child_snapshot then
          raise exception 'Refresh candidate % has a stale child baseline for capability %.', candidate_row.id, operation_record->>'targetId' using errcode = '22023';
        end if;
        update public.capabilities
        set name = capability_record->>'name',
            summary = capability_record->>'summary',
            capability_type = capability_record->>'capabilityType',
            core_features = array(select jsonb_array_elements_text(coalesce(capability_record->'features', '[]'::jsonb))),
            technology_readiness_level = nullif(capability_record->>'technologyReadinessLevel', '')::smallint,
            maturity = capability_record->>'maturity',
            commercial_availability = capability_record->>'commercialAvailability',
            defence_applications = array(select jsonb_array_elements_text(coalesce(capability_record->'applications', '[]'::jsonb))),
            technical_tags = array(select jsonb_array_elements_text(coalesce(capability_record->'technicalTags', '[]'::jsonb))),
            source_confidence = candidate_row.confidence,
            last_reviewed_at = published_on,
            updated_at = published_on
        where id = (operation_record->>'targetId')::uuid
          and organization_id = candidate_row.target_entity_id
          and publication_status = 'published';
        if not found then raise exception 'Capability refresh target mismatch.' using errcode = '22023'; end if;
        new_child_id := (operation_record->>'targetId')::uuid;
        for domain_slug in select jsonb_array_elements_text(coalesce(capability_record->'technicalDomainSlugs', '[]'::jsonb))
        loop
          select id into domain_id from public.technical_domains where slug = domain_slug and publication_status = 'published';
          if domain_id is null then raise exception 'Unknown technical domain %.', domain_slug using errcode = '22023'; end if;
          insert into public.capability_domains (capability_id, technical_domain_id, is_primary, publication_status)
          values (new_child_id, domain_id, domain_slug = capability_record#>>'{technicalDomainSlugs,0}', 'published')
          on conflict (capability_id, technical_domain_id) do update
          set publication_status = 'published';
        end loop;
        for mission_record, mission_index in
          select value, ordinality - 1 from jsonb_array_elements(coalesce(capability_record->'missionMatches', '[]'::jsonb)) with ordinality
        loop
          select id into mission_area_id from public.mission_areas where slug = mission_record->>'missionAreaSlug' and publication_status = 'published';
          if mission_area_id is null then raise exception 'Unknown mission area %.', mission_record->>'missionAreaSlug' using errcode = '22023'; end if;
          insert into public.capability_mission_matches (
            capability_id, mission_area_id, alignment_summary, match_type, confidence,
            review_status, publication_status
          ) values (
            new_child_id, mission_area_id, mission_record->>'alignmentSummary', 'derived',
            mission_record->>'confidence', 'approved', 'published'
          )
          on conflict on constraint capability_mission_matches_capability_id_mission_area_id_key do update
          set alignment_summary = excluded.alignment_summary,
              confidence = excluded.confidence,
              review_status = 'approved',
              publication_status = 'published',
              updated_at = now()
          returning id into new_mission_match_id;
          mission_map := mission_map || jsonb_build_object(mission_index::text, new_mission_match_id::text);
        end loop;
        affected_entity_type := 'capability';
        affected_entity_id := new_child_id;

      elsif operation_record->>'operation' = 'add_child' and operation_record->>'entityType' = 'program_participation' then
        program_record := operation_record#>'{value,program}';
        participation_record := operation_record#>'{value,participation}';
        select id into new_program_id from public.programs where slug = program_record->>'slug';
        if new_program_id is null then
          insert into public.programs (slug, name, program_type, operator_name, website_url, summary, publication_status)
          values (program_record->>'slug', program_record->>'name', program_record->>'programType', program_record->>'operatorName', program_record->>'websiteUrl', program_record->>'summary', 'published')
          returning id into new_program_id;
        elsif not exists (
          select 1 from public.programs where id = new_program_id and publication_status = 'published'
            and name = program_record->>'name' and program_type = program_record->>'programType'
            and summary = program_record->>'summary'
        ) then
          raise exception 'Existing program % does not match the reviewed canonical program payload.', program_record->>'slug' using errcode = 'P0001';
        end if;
        insert into public.program_participations (
          organization_id, program_id, participation_type, cohort_label, public_summary,
          lifecycle_stage, announced_on, started_on, ended_on, external_identifiers,
          publication_status
        ) values (
          candidate_row.target_entity_id, new_program_id, participation_record->>'participationType',
          participation_record->>'cohortLabel', participation_record->>'publicSummary',
          participation_record->>'lifecycleStage', nullif(participation_record->>'announcedOn', '')::date,
          nullif(participation_record->>'startedOn', '')::date, nullif(participation_record->>'endedOn', '')::date,
          coalesce(participation_record->'externalIdentifiers', '[]'::jsonb), 'published'
        ) returning id into new_participation_id;
        affected_entity_type := 'program_participation';
        affected_entity_id := new_participation_id;

      elsif operation_record->>'operation' = 'update_child' and operation_record->>'entityType' = 'program_participation' then
        participation_record := operation_record->'after';
        perform 1
        from public.program_participations
        where id = (operation_record->>'targetId')::uuid
          and organization_id = candidate_row.target_entity_id
          and publication_status = 'published'
        for update;
        if not found then raise exception 'Program participation refresh target mismatch.' using errcode = '22023'; end if;
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
        where participation_row.id = (operation_record->>'targetId')::uuid;
        if live_child_snapshot is distinct from operation_record->'before' then
          raise exception 'Refresh candidate % has a stale child baseline for program participation %.', candidate_row.id, operation_record->>'targetId' using errcode = '22023';
        end if;
        update public.program_participations
        set participation_type = participation_record->>'participationType',
            cohort_label = participation_record->>'cohortLabel',
            public_summary = participation_record->>'publicSummary',
            lifecycle_stage = participation_record->>'lifecycleStage',
            announced_on = nullif(participation_record->>'announcedOn', '')::date,
            started_on = nullif(participation_record->>'startedOn', '')::date,
            ended_on = nullif(participation_record->>'endedOn', '')::date,
            external_identifiers = coalesce(participation_record->'externalIdentifiers', '[]'::jsonb),
            updated_at = published_on
        where id = (operation_record->>'targetId')::uuid
          and organization_id = candidate_row.target_entity_id
          and publication_status = 'published';
        if not found then raise exception 'Program participation refresh target mismatch.' using errcode = '22023'; end if;
        affected_entity_type := 'program_participation';
        affected_entity_id := (operation_record->>'targetId')::uuid;

      elsif operation_record->>'operation' in ('add_child', 'update_child') and operation_record->>'entityType' = 'organization_relationship' then
        relationship_record := case when operation_record->>'operation' = 'add_child' then operation_record->'value' else operation_record->'after' end;
        resolved_related_organization_id := null;
        if nullif(relationship_record->>'relatedOrganizationSlug', '') is not null then
          select id into resolved_related_organization_id from public.organizations
          where slug = relationship_record->>'relatedOrganizationSlug' and publication_status = 'published';
          if resolved_related_organization_id is null then raise exception 'Related organization % is not published.', relationship_record->>'relatedOrganizationSlug' using errcode = '22023'; end if;
        end if;
        if operation_record->>'operation' = 'add_child' then
          insert into public.organization_relationships (
            organization_id, related_organization_id, related_organization_name,
            relationship_type, public_summary, publication_status
          ) values (
            candidate_row.target_entity_id, resolved_related_organization_id, relationship_record->>'relatedOrganizationName',
            relationship_record->>'relationshipType', relationship_record->>'publicSummary', 'published'
          ) returning id into new_child_id;
        else
          perform 1
          from public.organization_relationships
          where id = (operation_record->>'targetId')::uuid
            and organization_id = candidate_row.target_entity_id
            and publication_status = 'published'
          for update;
          if not found then raise exception 'Organization relationship refresh target mismatch.' using errcode = '22023'; end if;
          select jsonb_build_object(
            'relatedOrganizationName', coalesce(relationship_row.related_organization_name, related_row.name),
            'relationshipType', relationship_row.relationship_type,
            'publicSummary', relationship_row.public_summary,
            'relatedOrganizationSlug', related_row.slug
          ) into live_child_snapshot
          from public.organization_relationships relationship_row
          left join public.organizations related_row on related_row.id = relationship_row.related_organization_id
          where relationship_row.id = (operation_record->>'targetId')::uuid;
          if live_child_snapshot is distinct from operation_record->'before' then
            raise exception 'Refresh candidate % has a stale child baseline for organization relationship %.', candidate_row.id, operation_record->>'targetId' using errcode = '22023';
          end if;
          update public.organization_relationships
          set related_organization_id = resolved_related_organization_id,
              related_organization_name = relationship_record->>'relatedOrganizationName',
              relationship_type = relationship_record->>'relationshipType',
              public_summary = relationship_record->>'publicSummary',
              updated_at = published_on
          where id = (operation_record->>'targetId')::uuid
            and organization_id = candidate_row.target_entity_id
            and publication_status = 'published'
          returning id into new_child_id;
          if new_child_id is null then raise exception 'Organization relationship refresh target mismatch.' using errcode = '22023'; end if;
        end if;
        affected_entity_type := 'organization_relationship';
        affected_entity_id := new_child_id;

      elsif operation_record->>'operation' in ('add_child', 'update_child') and operation_record->>'entityType' = 'funding_event' then
        funding_record := case when operation_record->>'operation' = 'add_child' then operation_record->'value' else operation_record->'after' end;
        if operation_record->>'operation' = 'add_child' then
          insert into public.funding_events (
            organization_id, event_type, announced_on, amount_value, amount_currency,
            disclosed_summary, publication_status
          ) values (
            candidate_row.target_entity_id, funding_record->>'eventType', nullif(funding_record->>'announcedOn', '')::date,
            nullif(funding_record->>'amountValue', '')::numeric, funding_record->>'amountCurrency',
            funding_record->>'disclosedSummary', 'published'
          ) returning id into new_child_id;
        else
          perform 1
          from public.funding_events
          where id = (operation_record->>'targetId')::uuid
            and organization_id = candidate_row.target_entity_id
            and publication_status = 'published'
          for update;
          if not found then raise exception 'Funding event refresh target mismatch.' using errcode = '22023'; end if;
          select jsonb_build_object(
            'eventType', funding_row.event_type,
            'announcedOn', funding_row.announced_on,
            'amountValue', funding_row.amount_value,
            'amountCurrency', funding_row.amount_currency,
            'disclosedSummary', funding_row.disclosed_summary
          ) into live_child_snapshot
          from public.funding_events funding_row
          where funding_row.id = (operation_record->>'targetId')::uuid;
          if live_child_snapshot is distinct from operation_record->'before' then
            raise exception 'Refresh candidate % has a stale child baseline for funding event %.', candidate_row.id, operation_record->>'targetId' using errcode = '22023';
          end if;
          update public.funding_events
          set event_type = funding_record->>'eventType',
              announced_on = nullif(funding_record->>'announcedOn', '')::date,
              amount_value = nullif(funding_record->>'amountValue', '')::numeric,
              amount_currency = funding_record->>'amountCurrency',
              disclosed_summary = funding_record->>'disclosedSummary',
              updated_at = published_on
          where id = (operation_record->>'targetId')::uuid
            and organization_id = candidate_row.target_entity_id
            and publication_status = 'published'
          returning id into new_child_id;
          if new_child_id is null then raise exception 'Funding event refresh target mismatch.' using errcode = '22023'; end if;
        end if;
        affected_entity_type := 'funding_event';
        affected_entity_id := new_child_id;
      else
        raise exception 'Unsupported organization refresh v2 operation in candidate %.', candidate_row.id using errcode = '22023';
      end if;

      for leaf_record in select value from jsonb_array_elements(coalesce(operation_record->'leafEvidence', '[]'::jsonb))
      loop
        leaf_path := leaf_record->>'fieldPath';
        field_name := null;
        leaf_entity_type := affected_entity_type;
        leaf_entity_id := affected_entity_id;
        if operation_record->>'operation' = 'set_field' then
          field_name := operation_record->>'field';
          if field_name = 'public_contact' then
            field_name := 'profileData.publicContact' || case when leaf_path = 'after' then '' else '.' || split_part(leaf_path, '.', 2) end;
          elsif field_name = 'reviewed_questions' and leaf_path like 'after.%.%' then
            question_record := operation_record#>(array['after', split_part(leaf_path, '.', 2)]);
            field_name := 'reviewed_questions.' || (question_record->>'id') || '.' || lower(split_part(leaf_path, '.', 3));
          end if;
        elsif operation_record->>'operation' = 'set_profile_field' then
          field_name := 'profileData.' || (operation_record->>'profileField');
        elsif operation_record->>'entityType' = 'capability' and leaf_path like '%.missionMatches.%.%' then
          leaf_entity_type := 'capability_mission_match';
          leaf_entity_id := nullif(mission_map->>split_part(leaf_path, '.', 3), '')::uuid;
          field_name := private.research_public_field_name(leaf_path);
        elsif operation_record->>'entityType' = 'program_participation'
              and operation_record->>'operation' = 'add_child'
              and leaf_path like 'value.program.%' then
          leaf_entity_type := 'program';
          leaf_entity_id := new_program_id;
          field_name := private.research_public_field_name(leaf_path);
        elsif operation_record->>'entityType' = 'program_participation'
              and operation_record->>'operation' = 'add_child'
              and leaf_path like 'value.participation.%' then
          leaf_entity_type := 'program_participation';
          leaf_entity_id := new_participation_id;
          field_name := case when leaf_path like '%.externalIdentifiers.%' then 'external_identifiers' else private.research_public_field_name(leaf_path) end;
        else
          field_name := case when leaf_path like '%.externalIdentifiers.%' then 'external_identifiers' else private.research_public_field_name(leaf_path) end;
        end if;

        if leaf_entity_id is null or field_name is null then
          raise exception 'Refresh operation % has an unmappable changed leaf %.', operation_record->>'operationId', leaf_path using errcode = '22023';
        end if;
        for evidence_id_value in select jsonb_array_elements_text(coalesce(leaf_record->'evidenceIds', '[]'::jsonb))
        loop
          evidence_id := nullif(evidence_map->>evidence_id_value, '')::uuid;
          if evidence_id is null then
            raise exception 'Leaf evidence % is missing from the candidate.', evidence_id_value using errcode = '22023';
          end if;
          insert into public.field_citations (entity_type, entity_id, field_name, evidence_snippet_id)
          values (leaf_entity_type, leaf_entity_id, field_name, evidence_id)
          on conflict do nothing;
        end loop;
      end loop;
    end loop;

    update public.organizations
    set freshness_status = 'current', last_reviewed_at = published_on, updated_at = published_on
    where id = candidate_row.target_entity_id;

    if exists (
      select 1 from public.organizations
      where id = candidate_row.target_entity_id
        and ((current_activity is null) <> (current_activity_as_of is null))
    ) then
      raise exception 'Published current activity and its as-of date must remain paired.' using errcode = '22023';
    end if;
    if exists (
      select 1 from public.organizations
      where id = candidate_row.target_entity_id
        and editorial_profile_version = 'organization_editorial_profile_v1'
    ) then
      if not private.has_public_field_citation('organization', candidate_row.target_entity_id, 'description') then
        raise exception 'The executive profile cannot activate without cited organization copy.' using errcode = '22023';
      end if;
      if exists (select 1 from public.organizations where id = candidate_row.target_entity_id and current_activity is not null)
         and (not private.has_public_field_citation('organization', candidate_row.target_entity_id, 'current_activity')
           or not private.has_public_field_citation('organization', candidate_row.target_entity_id, 'current_activity_as_of')) then
        raise exception 'The executive profile has incomplete current-activity evidence.' using errcode = '22023';
      end if;
    end if;

    update public.candidate_changes
    set status = 'published',
        published_entity_id = candidate_row.target_entity_id,
        published_at = published_on,
        updated_at = published_on
    where id = candidate_row.id;

    insert into public.audit_events (
      actor_id, actor_role, event_type, entity_type, entity_id, summary, metadata
    ) values (
      p_reviewer_id, coalesce(auth.jwt()->'app_metadata'->>'role', 'reviewer'),
      'research_refresh_published', 'organization', candidate_row.target_entity_id,
      'Reviewer published an approved organization refresh v2 candidate.',
      jsonb_build_object(
        'candidate_id', candidate_row.id,
        'schema_version', 'organization_refresh_bundle_v2',
        'before', candidate_row.before_record,
        'operations', record->'operations',
        'publication_changed', true
      )
    );

    candidate_id := candidate_row.id;
    entity_type := 'organization';
    entity_id := candidate_row.target_entity_id;
    entity_slug := organization_slug;
    return next;
  end loop;
end;
$$;

revoke all on function public.publish_reviewed_organization_refresh_v2_candidates(uuid[], uuid)
from public, anon, authenticated;
grant execute on function public.publish_reviewed_organization_refresh_v2_candidates(uuid[], uuid)
to authenticated;

comment on function public.publish_reviewed_organization_refresh_v2_candidates(uuid[], uuid)
is 'Publishes approved additive or updating organization_refresh_bundle_v2 operations with exact baseline guards, per-leaf evidence, a type-specific profile allowlist, and no research delete path.';

-- Keep every historical publisher intact and route only the two new immutable
-- schema versions through their corresponding implementations.
create or replace function public.publish_reviewed_research_candidates(
  p_candidate_ids uuid[],
  p_reviewer_id uuid
)
returns table(candidate_id uuid, entity_type text, entity_id uuid, entity_slug text)
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $$
declare
  legacy_new_ids uuid[];
  organization_v3_ids uuid[];
  legacy_refresh_ids uuid[];
  organization_refresh_v2_ids uuid[];
  selected_count integer;
  supported_count integer;
begin
  if p_candidate_ids is null or cardinality(p_candidate_ids) < 1 or cardinality(p_candidate_ids) > 50 then
    raise exception 'Select between one and fifty approved research candidates.' using errcode = '22023';
  end if;

  select
    count(distinct routed.candidate_id),
    count(*) filter (
      where (candidate_kind = 'organization_bundle' and schema_version in ('organization_bundle_v1', 'organization_bundle_v2', 'organization_bundle_v3'))
         or (candidate_kind = 'demand_signal_bundle' and schema_version = 'demand_signal_bundle_v1')
         or (candidate_kind = 'organization_refresh_bundle' and schema_version in ('organization_refresh_bundle_v1', 'organization_refresh_bundle_v2'))
         or (candidate_kind = 'demand_refresh_bundle' and schema_version = 'demand_refresh_bundle_v1')
    ),
    array_agg(routed.candidate_id order by routed.created_at, routed.candidate_id) filter (
      where (candidate_kind = 'organization_bundle' and schema_version in ('organization_bundle_v1', 'organization_bundle_v2'))
         or (candidate_kind = 'demand_signal_bundle' and schema_version = 'demand_signal_bundle_v1')
    ),
    array_agg(routed.candidate_id order by routed.created_at, routed.candidate_id) filter (
      where candidate_kind = 'organization_bundle' and schema_version = 'organization_bundle_v3'
    ),
    array_agg(routed.candidate_id order by routed.created_at, routed.candidate_id) filter (
      where (candidate_kind = 'organization_refresh_bundle' and schema_version = 'organization_refresh_bundle_v1')
         or (candidate_kind = 'demand_refresh_bundle' and schema_version = 'demand_refresh_bundle_v1')
    ),
    array_agg(routed.candidate_id order by routed.created_at, routed.candidate_id) filter (
      where candidate_kind = 'organization_refresh_bundle' and schema_version = 'organization_refresh_bundle_v2'
    )
  into selected_count, supported_count, legacy_new_ids, organization_v3_ids,
       legacy_refresh_ids, organization_refresh_v2_ids
  from (
    select
      selected.candidate_id,
      candidate.candidate_kind,
      candidate.proposed_record->>'schemaVersion' as schema_version,
      candidate.created_at
    from unnest(p_candidate_ids) as selected(candidate_id)
    join public.candidate_changes candidate on candidate.id = selected.candidate_id
  ) routed;

  if selected_count <> cardinality(p_candidate_ids) then
    raise exception 'Candidate selection contains invalid or duplicate identifiers.' using errcode = '22023';
  end if;
  if supported_count <> cardinality(p_candidate_ids) then
    raise exception 'Candidate selection contains an unsupported kind or schema version.' using errcode = '22023';
  end if;

  if coalesce(cardinality(legacy_new_ids), 0) > 0 then
    return query select * from public.publish_reviewed_new_research_candidates(legacy_new_ids, p_reviewer_id);
  end if;
  if coalesce(cardinality(organization_v3_ids), 0) > 0 then
    return query select * from public.publish_reviewed_organization_v3_candidates(organization_v3_ids, p_reviewer_id);
  end if;
  if coalesce(cardinality(legacy_refresh_ids), 0) > 0 then
    return query select * from public.publish_reviewed_refresh_candidates(legacy_refresh_ids, p_reviewer_id);
  end if;
  if coalesce(cardinality(organization_refresh_v2_ids), 0) > 0 then
    return query select * from public.publish_reviewed_organization_refresh_v2_candidates(organization_refresh_v2_ids, p_reviewer_id);
  end if;
end;
$$;

revoke all on function public.publish_reviewed_research_candidates(uuid[], uuid)
from public, anon, authenticated;
grant execute on function public.publish_reviewed_research_candidates(uuid[], uuid)
to authenticated;

comment on function public.publish_reviewed_research_candidates(uuid[], uuid)
is 'Routes approved historical and current research schemas through immutable version-specific publishers; organization_bundle_v3 and organization_refresh_bundle_v2 remain isolated from legacy implementations.';
