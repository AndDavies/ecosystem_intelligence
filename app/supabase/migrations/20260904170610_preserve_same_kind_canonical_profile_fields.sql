-- Preserve unrelated legacy profile fields during same-kind canonical repair.
--
-- The application contract permits a canonical rename or alias correction to
-- leave unrelated dossier fields unchanged. Full profile allowlist cleanup and
-- required-role enforcement apply only when the repair changes entity kind.

create or replace function private.assert_organization_canonical_repair_candidate(
  p_candidate public.candidate_changes
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  record jsonb := p_candidate.proposed_record;
  before_identity jsonb;
  before_aliases jsonb;
  before_capabilities jsonb;
  live_aliases jsonb;
  live_capabilities jsonb;
  operation_record jsonb;
  source_record jsonb;
  evidence_record jsonb;
  identity_operation jsonb;
  live_organization public.organizations%rowtype;
  live_alias public.organization_aliases%rowtype;
  live_capability public.capabilities%rowtype;
  successor_record public.organizations%rowtype;
  archived_alias_ids uuid[] := '{}';
  proposed_identity_values text[] := '{}';
  final_alias_values text[] := '{}';
  proposed_name text;
  proposed_legal_name text;
  proposed_website text;
  identity_value text;
  operation_id text;
  operation_kind text;
  operation_target_key text;
  evidence_id_value text;
  required_profile_field text;
  resulting_entity_kind text;
  resulting_profile_data jsonb;
  allowed_profile_fields text[];
  archive_organization_count integer := 0;
begin
  if p_candidate.candidate_kind <> 'organization_canonical_repair_bundle'
     or p_candidate.schema_version <> 'organization_canonical_repair_bundle_v1'
     or record->>'candidateKind' is distinct from 'organization_canonical_repair_bundle'
     or record->>'schemaVersion' is distinct from 'organization_canonical_repair_bundle_v1'
     or p_candidate.target_entity_type <> 'organization'
     or p_candidate.target_entity_id is null
     or record#>>'{targetMatch,entityType}' is distinct from 'organization'
     or record#>>'{targetMatch,entityId}' is distinct from p_candidate.target_entity_id::text
     or record#>>'{targetMatch,confidence}' is distinct from 'high'
     or p_candidate.research_run_id is null
     or not exists (
       select 1
       from public.research_runs run_record
       where run_record.id = p_candidate.research_run_id
         and private.research_pipeline_version_at_least(run_record.agent_version, 1, 8, 0)
         and run_record.scope->>'researchMode' = 'canonical_repair'
         and run_record.status = 'completed'
     )
     or p_candidate.client_candidate_id is distinct from record->>'candidateId'
     or p_candidate.confidence is distinct from record->>'confidence'
     or p_candidate.reviewer_rationale is distinct from record->>'reviewerRationale'
     or p_candidate.before_record is distinct from record->'beforeRecord'
     or p_candidate.field_evidence is distinct from record->'fieldEvidence'
     or p_candidate.duplicate_check is distinct from record->'duplicateCheck'
     or to_jsonb(p_candidate.source_lead_ids) is distinct from record->'sourceLeadIds'
     or coalesce(record->>'reviewStatus', '') <> 'candidate_pending'
     or coalesce(record->>'confidence', '') not in ('high', 'moderate', 'needs_review')
     or coalesce(p_candidate.duplicate_check->>'status', '') <> 'clear'
     or coalesce(jsonb_array_length(p_candidate.duplicate_check->'matches'), 0) <> 0
     or jsonb_typeof(record->'duplicateCheck') <> 'object'
     or jsonb_typeof(record->'beforeRecord') <> 'object'
     or jsonb_typeof(record->'targetMatch') <> 'object'
     or jsonb_typeof(record->'operations') <> 'array'
     or jsonb_array_length(record->'operations') < 1
     or jsonb_array_length(record->'operations') > 10
     or jsonb_typeof(record->'sources') <> 'array'
     or jsonb_array_length(record->'sources') < 1
     or jsonb_typeof(record->'fieldEvidence') <> 'array'
     or jsonb_array_length(record->'fieldEvidence') < 1
     or jsonb_typeof(record->'sourceLeadIds') <> 'array'
     or jsonb_array_length(record->'sourceLeadIds') < 1 then
    raise exception 'Canonical repair candidate % does not satisfy its typed intake contract.', p_candidate.id using errcode = '22023';
  end if;

  if jsonb_typeof(record->'candidateId') is distinct from 'string'
     or jsonb_typeof(record->'reviewerRationale') is distinct from 'string'
     or jsonb_typeof(record#>'{targetMatch,entityType}') is distinct from 'string'
     or jsonb_typeof(record#>'{targetMatch,entityId}') is distinct from 'string'
     or jsonb_typeof(record#>'{targetMatch,slug}') is distinct from 'string'
     or jsonb_typeof(record#>'{targetMatch,confidence}') is distinct from 'string'
     or jsonb_typeof(record#>'{targetMatch,baselineUpdatedAt}') is distinct from 'string'
     or jsonb_typeof(record#>'{duplicateCheck,status}') is distinct from 'string'
     or jsonb_typeof(record#>'{duplicateCheck,note}') is distinct from 'string'
     or jsonb_typeof(record#>'{duplicateCheck,checkedAt}') is distinct from 'string'
     or coalesce(record->>'candidateId', '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
     or length(trim(coalesce(record->>'reviewerRationale', ''))) not between 80 and 2000
     or jsonb_array_length(record->'sources') > 50
     or jsonb_array_length(record->'fieldEvidence') > 100
     or jsonb_typeof(record#>'{beforeRecord,activeAliases}') <> 'array'
     or jsonb_array_length(record#>'{beforeRecord,activeAliases}') > 50
     or jsonb_typeof(record#>'{beforeRecord,activeCapabilities}') <> 'array'
     or jsonb_array_length(record#>'{beforeRecord,activeCapabilities}') > 50
     or jsonb_typeof(record#>'{targetMatch,matchMethods}') <> 'array'
     or jsonb_array_length(record#>'{targetMatch,matchMethods}') < 1
     or exists (
       select 1 from jsonb_array_elements(record#>'{targetMatch,matchMethods}') method(value)
       where jsonb_typeof(value) is distinct from 'string'
          or value #>> '{}' not in ('canonical_url', 'website_domain', 'slug', 'legal_name', 'alias', 'name', 'parent_relationship')
     )
     or (select count(*) from jsonb_array_elements_text(record#>'{targetMatch,matchMethods}'))
       <> (select count(distinct value) from jsonb_array_elements_text(record#>'{targetMatch,matchMethods}') method(value))
     or jsonb_typeof(record->'duplicateCheck') <> 'object'
     or record#>>'{duplicateCheck,status}' <> 'clear'
     or jsonb_typeof(record#>'{duplicateCheck,methods}') <> 'array'
     or jsonb_array_length(record#>'{duplicateCheck,methods}') < 3
     or exists (
       select 1 from jsonb_array_elements(record#>'{duplicateCheck,methods}') method(value)
       where jsonb_typeof(value) is distinct from 'string'
          or value #>> '{}' not in ('canonical_url', 'website_domain', 'slug', 'legal_name', 'alias', 'fuzzy_name')
     )
     or (select count(*) from jsonb_array_elements_text(record#>'{duplicateCheck,methods}'))
       <> (select count(distinct value) from jsonb_array_elements_text(record#>'{duplicateCheck,methods}') method(value))
     or jsonb_typeof(record#>'{duplicateCheck,matches}') <> 'array'
     or jsonb_array_length(record#>'{duplicateCheck,matches}') <> 0
     or length(trim(coalesce(record#>>'{duplicateCheck,note}', ''))) not between 10 and 1000
     or nullif(record#>>'{duplicateCheck,checkedAt}', '') is null then
    raise exception 'Canonical repair identity, target-match, duplicate, or bounded-count contract is invalid.' using errcode = '22023';
  end if;

  -- These casts deliberately fail closed on malformed timestamps before a
  -- candidate can be staged or reviewed.
  perform (record#>>'{targetMatch,baselineUpdatedAt}')::timestamptz;
  perform (record#>>'{duplicateCheck,checkedAt}')::timestamptz;
  if exists (
    select 1 from jsonb_array_elements(record->'sourceLeadIds') lead(value)
    where jsonb_typeof(value) is distinct from 'string'
       or value #>> '{}' !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ) or (select count(*) from jsonb_array_elements_text(record->'sourceLeadIds'))
    <> (select count(distinct value) from jsonb_array_elements_text(record->'sourceLeadIds') lead(value)) then
    raise exception 'Canonical repair source-lead IDs must be unique stable identifiers.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(record->'sources') source(value)
    where jsonb_typeof(value) <> 'object'
       or jsonb_typeof(value->'id') is distinct from 'string'
       or jsonb_typeof(value->'url') is distinct from 'string'
       or jsonb_typeof(value->'title') is distinct from 'string'
       or jsonb_typeof(value->'publisher') is distinct from 'string'
       or jsonb_typeof(value->'sourceKind') is distinct from 'string'
       or jsonb_typeof(value->'accessedAt') is distinct from 'string'
       or jsonb_typeof(value->'locator') is distinct from 'string'
       or jsonb_typeof(value->'summary') is distinct from 'string'
       or (value->'publishedAt' is not null and value->'publishedAt' <> 'null'::jsonb
         and jsonb_typeof(value->'publishedAt') is distinct from 'string')
       or coalesce(value->>'id', '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
       or coalesce(value->>'url', '') !~ '^https://[^[:space:]/?#]+([/?#][^[:space:]]*)?$'
       or length(trim(coalesce(value->>'title', ''))) < 8
       or length(value->>'title') > 500
       or length(trim(coalesce(value->>'publisher', ''))) < 2
       or length(value->>'publisher') > 240
       or coalesce(value->>'sourceKind', '') not in (
         'official_company_product', 'official_company_news', 'accelerator_cohort_directory',
         'incubator_program_directory', 'investor_portfolio', 'research_centre_profile',
         'official_organization_profile', 'government_service_page', 'innovation_program',
         'procurement_notice', 'award_or_contract', 'official_policy', 'official_report',
         'association_directory', 'event_directory', 'reputable_industry_publication'
       )
       or nullif(value->>'accessedAt', '') is null
       or length(trim(coalesce(value->>'locator', ''))) < 2
       or length(value->>'locator') > 500
       or length(trim(coalesce(value->>'summary', ''))) < 40
       or length(value->>'summary') > 4000
  ) or exists (
    select 1
    from jsonb_array_elements(record->'sources') source(value)
    group by value->>'id'
    having count(*) <> 1
  ) or exists (
    select 1
    from jsonb_array_elements(record->'sources') source(value)
    group by value->>'url'
    having count(*) <> 1
  ) then
    raise exception 'Canonical repair sources must be complete and have unique stable IDs and canonical URLs.' using errcode = '22023';
  end if;
  for source_record in select value from jsonb_array_elements(record->'sources') source(value)
  loop
    perform (source_record->>'accessedAt')::timestamptz;
    if source_record->'publishedAt' is not null and source_record->'publishedAt' <> 'null'::jsonb then
      perform (source_record->>'publishedAt')::timestamptz;
    end if;
  end loop;

  if exists (
    select 1
    from jsonb_array_elements(record->'fieldEvidence') evidence(value)
    where jsonb_typeof(value) <> 'object'
       or jsonb_typeof(value->'id') is distinct from 'string'
       or jsonb_typeof(value->'sourceId') is distinct from 'string'
       or jsonb_typeof(value->'fieldPath') is distinct from 'string'
       or jsonb_typeof(value->'claimClass') is distinct from 'string'
       or jsonb_typeof(value->'excerpt') is distinct from 'string'
       or jsonb_typeof(value->'confidence') is distinct from 'string'
       or coalesce(value->>'id', '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
       or coalesce(value->>'sourceId', '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
       or length(trim(coalesce(value->>'fieldPath', ''))) < 3
       or length(value->>'fieldPath') > 300
       or coalesce(value->>'claimClass', '') not in ('source_backed', 'derived')
       or length(trim(coalesce(value->>'excerpt', ''))) < 30
       or length(value->>'excerpt') > 1000
       or coalesce(value->>'confidence', '') not in ('high', 'moderate', 'needs_review')
       or not exists (
         select 1 from jsonb_array_elements(record->'sources') source(value_source)
         where value_source->>'id' = value->>'sourceId'
       )
  ) or exists (
    select 1
    from jsonb_array_elements(record->'fieldEvidence') evidence(value)
    group by value->>'id'
    having count(*) <> 1
  ) then
    raise exception 'Canonical repair field evidence must be complete, source-bound, and uniquely identified.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(record->'operations') operation(value)
    where jsonb_typeof(value) <> 'object'
       or jsonb_typeof(value->'operationId') is distinct from 'string'
       or jsonb_typeof(value->'operation') is distinct from 'string'
       or jsonb_typeof(value->'targetId') is distinct from 'string'
       or jsonb_typeof(value->'reviewerExplanation') is distinct from 'string'
       or coalesce(value->>'operationId', '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
       or coalesce(value->>'operation', '') not in (
         'set_organization_identity', 'set_profile_field', 'add_alias',
         'archive_alias', 'archive_capability', 'archive_organization'
       )
       or value->>'targetId' is distinct from p_candidate.target_entity_id::text
       or jsonb_typeof(value->'evidenceIds') <> 'array'
       or exists (
         select 1 from jsonb_array_elements(value->'evidenceIds') evidence_id(value_id)
         where jsonb_typeof(value_id) is distinct from 'string'
       )
       or jsonb_array_length(value->'evidenceIds') < 1
       or jsonb_array_length(value->'evidenceIds') > 50
       or length(trim(coalesce(value->>'reviewerExplanation', ''))) not between 40 and 2000
  ) or exists (
    select 1
    from jsonb_array_elements(record->'operations') operation(value)
    group by value->>'operationId'
    having count(*) <> 1
  ) then
    raise exception 'Canonical repair operations must be complete, unique, and target the reviewed organization.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(record->'operations') operation(value),
         jsonb_array_elements_text(value->'evidenceIds') evidence_id(value_id)
    group by value->>'operationId', value_id
    having count(*) <> 1
  ) then
    raise exception 'Canonical repair operations cannot repeat an evidence ID.' using errcode = '22023';
  end if;

  for evidence_record in select value from jsonb_array_elements(record->'fieldEvidence') evidence(value)
  loop
    select count(*) into archive_organization_count
    from jsonb_array_elements(record->'operations') operation(value),
         jsonb_array_elements_text(value->'evidenceIds') evidence_id(value_id)
    where value_id = evidence_record->>'id'
      and evidence_record->>'fieldPath' like 'operations.' || (value->>'operationId') || '.%';
    if archive_organization_count <> 1 then
      raise exception 'Canonical repair evidence % must be used by exactly one matching operation.', evidence_record->>'id' using errcode = '22023';
    end if;
  end loop;

  if exists (
    select 1
    from jsonb_array_elements(record->'sources') source(value)
    where not exists (
      select 1 from jsonb_array_elements(record->'fieldEvidence') evidence(value_evidence)
      where value_evidence->>'sourceId' = value->>'id'
    )
  ) then
    raise exception 'Every canonical repair source must support at least one evidence leaf.' using errcode = '22023';
  end if;
  archive_organization_count := 0;

  select * into live_organization
  from public.organizations
  where id = p_candidate.target_entity_id;
  if not found or live_organization.publication_status <> 'published' then
    raise exception 'Canonical repair target is missing or no longer published.' using errcode = 'P0001';
  end if;

  before_identity := record#>'{beforeRecord,organization}';
  if before_identity->>'id' is distinct from live_organization.id::text
     or before_identity->>'slug' is distinct from live_organization.slug
     or before_identity->>'name' is distinct from live_organization.name
     or (before_identity->>'legalName') is distinct from live_organization.legal_name
     or (before_identity->>'websiteUrl') is distinct from live_organization.website_url
     or before_identity->>'entityKind' is distinct from live_organization.entity_kind
     or before_identity->'organizationCategories' is distinct from to_jsonb(array(
       select category
       from unnest(live_organization.organization_categories) category
       order by category
     ))
     or before_identity->'profileData' is distinct from live_organization.profile_data
     or before_identity->>'publicationStatus' is distinct from live_organization.publication_status
     or (before_identity->>'updatedAt')::timestamptz is distinct from live_organization.updated_at
     or record#>>'{targetMatch,slug}' is distinct from live_organization.slug
     or (record#>>'{targetMatch,baselineUpdatedAt}')::timestamptz is distinct from live_organization.updated_at then
    raise exception 'Canonical repair target identity changed after research.' using errcode = 'P0001';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', alias_record.id::text,
    'alias', alias_record.alias,
    'aliasType', alias_record.alias_type,
    'publicationStatus', alias_record.publication_status
  ) order by alias_record.id::text), '[]'::jsonb)
  into live_aliases
  from public.organization_aliases alias_record
  where alias_record.organization_id = live_organization.id
    and alias_record.publication_status <> 'archived';
  before_aliases := record#>'{beforeRecord,activeAliases}';
  if before_aliases is distinct from live_aliases then
    raise exception 'Canonical repair alias snapshot changed after research.' using errcode = 'P0001';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', capability_record.id::text,
    'slug', capability_record.slug,
    'name', capability_record.name,
    'publicationStatus', capability_record.publication_status,
    'updatedAt', to_jsonb(capability_record.updated_at)
  ) order by capability_record.id::text), '[]'::jsonb)
  into live_capabilities
  from public.capabilities capability_record
  where capability_record.organization_id = live_organization.id
    and capability_record.publication_status <> 'archived';
  before_capabilities := record#>'{beforeRecord,activeCapabilities}';
  if before_capabilities is distinct from live_capabilities then
    raise exception 'Canonical repair technology snapshot changed after research.' using errcode = 'P0001';
  end if;

  select value into identity_operation
  from jsonb_array_elements(record->'operations') operation(value)
  where value->>'operation' = 'set_organization_identity'
  limit 1;
  if (select count(*) from jsonb_array_elements(record->'operations') operation(value)
      where value->>'operation' = 'set_organization_identity') > 1 then
    raise exception 'A canonical repair may contain only one identity operation.' using errcode = '22023';
  end if;
  select count(*) into archive_organization_count
  from jsonb_array_elements(record->'operations') operation(value)
  where value->>'operation' = 'archive_organization';
  if archive_organization_count > 1
     or (archive_organization_count = 1 and jsonb_array_length(record->'operations') <> 1) then
    raise exception 'Archiving an organization must be the repair candidate''s only operation.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from (
      select case value->>'operation'
        when 'archive_alias' then 'archive_alias:' || coalesce(value->>'aliasId', '')
        when 'archive_capability' then 'archive_capability:' || coalesce(value->>'capabilityId', '')
        when 'set_profile_field' then 'set_profile_field:' || coalesce(value->>'profileField', '')
        else value->>'operation'
      end as target_key
      from jsonb_array_elements(record->'operations') operation(value)
    ) operation_targets
    group by target_key
    having count(*) <> 1
  ) then
    raise exception 'Canonical repair operations cannot repeat the same canonical target.' using errcode = '22023';
  end if;

  resulting_entity_kind := coalesce(identity_operation#>>'{after,entityKind}', live_organization.entity_kind);
  resulting_profile_data := live_organization.profile_data;
  allowed_profile_fields := private.canonical_repair_profile_fields(resulting_entity_kind);
  required_profile_field := private.canonical_repair_required_profile_field(resulting_entity_kind);
  proposed_name := coalesce(identity_operation#>>'{after,name}', live_organization.name);
  proposed_legal_name := case
    when identity_operation is null then live_organization.legal_name
    else identity_operation#>>'{after,legalName}'
  end;
  proposed_website := case
    when identity_operation is null then live_organization.website_url
    else identity_operation#>>'{after,websiteUrl}'
  end;

  for operation_record in select value from jsonb_array_elements(record->'operations') operation(value)
  loop
    operation_id := operation_record->>'operationId';
    operation_kind := operation_record->>'operation';
    if operation_record->>'targetId' <> live_organization.id::text then
      raise exception 'Canonical repair operation targets another organization.' using errcode = '22023';
    end if;
    if exists (
      select 1
      from jsonb_array_elements_text(operation_record->'evidenceIds') evidence_id(value)
      where not exists (
        select 1 from jsonb_array_elements(record->'fieldEvidence') evidence(value_evidence)
        where value_evidence->>'id' = value
          and value_evidence->>'fieldPath' like 'operations.' || operation_id || '.%'
      )
    ) then
      raise exception 'Canonical repair operation % references missing or mismapped evidence.', operation_id using errcode = '22023';
    end if;
    if operation_record->>'operation' = 'set_organization_identity' then
      if operation_record->'before' is distinct from before_identity then
        raise exception 'Canonical identity operation has a stale before snapshot.' using errcode = 'P0001';
      end if;
      if jsonb_typeof(operation_record->'after') <> 'object'
         or jsonb_typeof(operation_record#>'{after,name}') is distinct from 'string'
         or (operation_record#>'{after,legalName}' <> 'null'::jsonb
           and jsonb_typeof(operation_record#>'{after,legalName}') is distinct from 'string')
         or (operation_record#>'{after,websiteUrl}' <> 'null'::jsonb
           and jsonb_typeof(operation_record#>'{after,websiteUrl}') is distinct from 'string')
         or jsonb_typeof(operation_record#>'{after,entityKind}') is distinct from 'string'
         or length(trim(coalesce(operation_record#>>'{after,name}', ''))) < 2
         or length(operation_record#>>'{after,name}') > 240
         or nullif(private.normalize_organization_identity(operation_record#>>'{after,name}'), '') is null
         or not (operation_record->'after' ? 'legalName')
         or not (operation_record->'after' ? 'websiteUrl')
         or (operation_record#>'{after,legalName}' <> 'null'::jsonb and (
           length(operation_record#>>'{after,legalName}') not between 2 and 240
           or nullif(private.normalize_organization_identity(operation_record#>>'{after,legalName}'), '') is null
         ))
         or (operation_record#>'{after,websiteUrl}' <> 'null'::jsonb and (
           length(operation_record#>>'{after,websiteUrl}') > 2000
           or operation_record#>>'{after,websiteUrl}' !~ '^https://[^[:space:]/?#]+([/?#][^[:space:]]*)?$'
         ))
         or coalesce(operation_record#>>'{after,entityKind}', '') not in (
        'company', 'accelerator', 'incubator', 'research_test_centre',
        'investor_funder', 'ecosystem_organization', 'government_innovation_office'
      ) or jsonb_typeof(operation_record#>'{after,organizationCategories}') <> 'array'
         or jsonb_array_length(operation_record#>'{after,organizationCategories}') < 1
         or exists (
           select 1 from jsonb_array_elements(operation_record#>'{after,organizationCategories}') category(value)
           where jsonb_typeof(value) is distinct from 'string'
              or value #>> '{}' not in (
             'commercial_company', 'defence_supplier', 'dual_use', 'venture_capital',
             'corporate_venture', 'public_funder', 'dual_use_accelerator', 'ocean_technology',
             'university_affiliated', 'test_range', 'research_lab', 'cluster_operator',
             'industry_association', 'government_program_operator'
           )
         )
         or (select count(*) from jsonb_array_elements_text(operation_record#>'{after,organizationCategories}'))
           <> (select count(distinct value) from jsonb_array_elements_text(operation_record#>'{after,organizationCategories}') category(value))
         or operation_record#>'{after,organizationCategories}' is distinct from (
           select jsonb_agg(value order by value)
           from jsonb_array_elements_text(operation_record#>'{after,organizationCategories}') category(value)
         ) then
        raise exception 'Canonical identity operation has an invalid resulting classification.' using errcode = '22023';
      end if;
      if (operation_record#>>'{after,name}' = before_identity->>'name'
          and operation_record#>>'{after,legalName}' is not distinct from before_identity->>'legalName'
          and operation_record#>>'{after,websiteUrl}' is not distinct from before_identity->>'websiteUrl'
          and operation_record#>>'{after,entityKind}' = before_identity->>'entityKind'
          and operation_record#>'{after,organizationCategories}' is not distinct from before_identity->'organizationCategories') then
        raise exception 'Canonical identity repair must change at least one reviewed field.' using errcode = '22023';
      end if;
      if operation_record#>>'{after,name}' <> before_identity->>'name'
         and operation_record->>'formerNameAlias' is distinct from before_identity->>'name' then
        raise exception 'A canonical rename must preserve the former canonical name as an alias.' using errcode = '22023';
      end if;
      if operation_record->'formerNameAlias' is distinct from 'null'::jsonb
         and (jsonb_typeof(operation_record->'formerNameAlias') is distinct from 'string'
           or nullif(private.normalize_organization_identity(operation_record->>'formerNameAlias'), '') is null) then
        raise exception 'A former-name alias must contain at least one letter or number.' using errcode = '22023';
      end if;
      if operation_record#>>'{after,name}' = before_identity->>'name'
         and operation_record->'formerNameAlias' is distinct from 'null'::jsonb then
        raise exception 'A non-rename identity repair cannot create a former-name alias.' using errcode = '22023';
      end if;
      if operation_record#>>'{after,name}' <> before_identity->>'name'
         and not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.after.name', 'source_backed') then
        raise exception 'Canonical identity name change lacks source-backed operation evidence.' using errcode = '22023';
      end if;
      if operation_record#>>'{after,legalName}' is distinct from before_identity->>'legalName'
         and not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.after.legalName', 'source_backed') then
        raise exception 'Canonical legal-name change lacks source-backed operation evidence.' using errcode = '22023';
      end if;
      if operation_record#>>'{after,websiteUrl}' is distinct from before_identity->>'websiteUrl'
         and not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.after.websiteUrl', 'source_backed') then
        raise exception 'Canonical website change lacks source-backed operation evidence.' using errcode = '22023';
      end if;
      if operation_record#>>'{after,entityKind}' <> before_identity->>'entityKind'
         and not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.after.entityKind', 'derived') then
        raise exception 'Canonical entity-kind change lacks derived operation evidence.' using errcode = '22023';
      end if;
      if operation_record#>'{after,organizationCategories}' is distinct from before_identity->'organizationCategories'
         and not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.after.organizationCategories', 'derived') then
        raise exception 'Canonical category change lacks derived operation evidence.' using errcode = '22023';
      end if;
      if operation_record->'formerNameAlias' is distinct from 'null'::jsonb
         and not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.formerNameAlias', 'source_backed') then
        raise exception 'Canonical former-name alias lacks source-backed operation evidence.' using errcode = '22023';
      end if;
      if exists (
        select 1 from jsonb_array_elements(record->'fieldEvidence') evidence(value)
        where value->>'id' in (select jsonb_array_elements_text(operation_record->'evidenceIds'))
          and not (
            (value->>'fieldPath' = 'operations.' || operation_id || '.after.name'
              and operation_record#>>'{after,name}' <> before_identity->>'name' and value->>'claimClass' = 'source_backed')
            or (value->>'fieldPath' = 'operations.' || operation_id || '.after.legalName'
              and operation_record#>>'{after,legalName}' is distinct from before_identity->>'legalName' and value->>'claimClass' = 'source_backed')
            or (value->>'fieldPath' = 'operations.' || operation_id || '.after.websiteUrl'
              and operation_record#>>'{after,websiteUrl}' is distinct from before_identity->>'websiteUrl' and value->>'claimClass' = 'source_backed')
            or (value->>'fieldPath' = 'operations.' || operation_id || '.after.entityKind'
              and operation_record#>>'{after,entityKind}' <> before_identity->>'entityKind' and value->>'claimClass' = 'derived')
            or (value->>'fieldPath' = 'operations.' || operation_id || '.after.organizationCategories'
              and operation_record#>'{after,organizationCategories}' is distinct from before_identity->'organizationCategories' and value->>'claimClass' = 'derived')
            or (value->>'fieldPath' = 'operations.' || operation_id || '.formerNameAlias'
              and operation_record->'formerNameAlias' is distinct from 'null'::jsonb and value->>'claimClass' = 'source_backed')
          )
      ) then
        raise exception 'Canonical identity operation has an invalid evidence path or claim class.' using errcode = '22023';
      end if;
    elsif operation_record->>'operation' = 'set_profile_field' then
      if jsonb_typeof(operation_record->'profileField') is distinct from 'string'
         or coalesce(operation_record->>'profileField', '') !~ '^[a-z][A-Za-z0-9]*$'
         or not private.canonical_repair_profile_value_valid(operation_record->'before')
         or not private.canonical_repair_profile_value_valid(operation_record->'after')
         or operation_record->'before' is distinct from coalesce(live_organization.profile_data->(operation_record->>'profileField'), 'null'::jsonb)
         or operation_record->'after' is not distinct from operation_record->'before' then
        raise exception 'Canonical profile-field repair has an invalid field, stale baseline, or unchanged value.' using errcode = '22023';
      end if;
      if identity_operation is null
         or identity_operation#>>'{after,entityKind}' = before_identity->>'entityKind' then
        raise exception 'Canonical profile-field changes require an entity-kind correction.' using errcode = '22023';
      end if;
      if not coalesce((
        (operation_record->'after' = 'null'::jsonb and not (operation_record->>'profileField' = any(allowed_profile_fields)))
        or (required_profile_field is not null and operation_record->>'profileField' = required_profile_field)
      ), false) then
        raise exception 'Canonical profile repair may only remove an invalid field or set the corrected kind''s required mandate.' using errcode = '22023';
      end if;
      if not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.after.value', 'source_backed')
         or exists (
           select 1 from jsonb_array_elements(record->'fieldEvidence') evidence(value)
           where value->>'id' in (select jsonb_array_elements_text(operation_record->'evidenceIds'))
             and (value->>'fieldPath' <> 'operations.' || operation_id || '.after.value' or value->>'claimClass' <> 'source_backed')
         ) then
        raise exception 'Canonical profile repair must bind only one supported after-value evidence path.' using errcode = '22023';
      end if;
      if operation_record->'after' = 'null'::jsonb then
        resulting_profile_data := resulting_profile_data - (operation_record->>'profileField');
      else
        resulting_profile_data := jsonb_set(resulting_profile_data, array[operation_record->>'profileField'], operation_record->'after', true);
      end if;
    elsif operation_record->>'operation' = 'add_alias' then
      if jsonb_typeof(operation_record->'alias') is distinct from 'string'
         or jsonb_typeof(operation_record->'aliasType') is distinct from 'string'
         or length(trim(coalesce(operation_record->>'alias', ''))) < 2
         or length(operation_record->>'alias') > 240
         or nullif(private.normalize_organization_identity(operation_record->>'alias'), '') is null
         or coalesce(operation_record->>'aliasType', '') not in ('legal_name', 'trade_name', 'former_name', 'acronym', 'other')
         or not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.alias', 'source_backed')
         or exists (
           select 1 from jsonb_array_elements(record->'fieldEvidence') evidence(value)
           where value->>'id' in (select jsonb_array_elements_text(operation_record->'evidenceIds'))
             and (value->>'fieldPath' <> 'operations.' || operation_id || '.alias' or value->>'claimClass' <> 'source_backed')
         ) then
        raise exception 'Canonical alias addition lacks a valid alias or source-backed operation evidence.' using errcode = '22023';
      end if;
    elsif operation_record->>'operation' = 'archive_alias' then
      select * into live_alias
      from public.organization_aliases
      where id = (operation_record->>'aliasId')::uuid
        and organization_id = live_organization.id
        and publication_status <> 'archived';
      if not found
         or operation_record#>>'{before,id}' is distinct from live_alias.id::text
         or operation_record#>>'{before,alias}' is distinct from live_alias.alias
         or operation_record#>>'{before,aliasType}' is distinct from live_alias.alias_type
         or operation_record#>>'{before,publicationStatus}' is distinct from live_alias.publication_status then
        raise exception 'Canonical alias archive has a stale or mismatched baseline.' using errcode = 'P0001';
      end if;
      if coalesce(operation_record->>'reason', '') not in ('duplicate_alias', 'incorrect_owner', 'superseded_name')
         or not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.before.alias', 'source_backed')
         or not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.reason', 'derived')
         or exists (
           select 1 from jsonb_array_elements(record->'fieldEvidence') evidence(value)
           where value->>'id' in (select jsonb_array_elements_text(operation_record->'evidenceIds'))
             and not (
               (value->>'fieldPath' = 'operations.' || operation_id || '.before.alias' and value->>'claimClass' = 'source_backed')
               or (value->>'fieldPath' = 'operations.' || operation_id || '.reason' and value->>'claimClass' = 'derived')
             )
         ) then
        raise exception 'Canonical alias archival lacks its bounded reason or evidence contract.' using errcode = '22023';
      end if;
      archived_alias_ids := array_append(archived_alias_ids, live_alias.id);
    elsif operation_record->>'operation' = 'archive_capability' then
      select * into live_capability
      from public.capabilities
      where id = (operation_record->>'capabilityId')::uuid
        and organization_id = live_organization.id
        and publication_status <> 'archived';
      if not found
         or operation_record#>>'{before,id}' is distinct from live_capability.id::text
         or operation_record#>>'{before,slug}' is distinct from live_capability.slug
         or operation_record#>>'{before,name}' is distinct from live_capability.name
         or operation_record#>>'{before,publicationStatus}' is distinct from live_capability.publication_status
         or (operation_record#>>'{before,updatedAt}')::timestamptz is distinct from live_capability.updated_at
         or operation_record->'dependencies' is distinct from private.canonical_capability_dependencies(live_capability.id) then
        raise exception 'Canonical technology archive has a stale record or dependency snapshot.' using errcode = 'P0001';
      end if;
      if coalesce(operation_record->>'reason', '') not in ('unsupported_capability', 'outside_product_scope', 'defunct', 'superseded')
         or not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.before.name', 'source_backed')
         or not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.reason', 'derived')
         or jsonb_array_length(operation_record#>'{dependencies,signalRecordLinkIds}') > 0
         or jsonb_array_length(operation_record#>'{dependencies,wikiPageRecordLinkIds}') > 0
         or exists (
           select 1 from jsonb_array_elements(record->'fieldEvidence') evidence(value)
           where value->>'id' in (select jsonb_array_elements_text(operation_record->'evidenceIds'))
             and not (
               (value->>'fieldPath' = 'operations.' || operation_id || '.before.name' and value->>'claimClass' = 'source_backed')
               or (value->>'fieldPath' = 'operations.' || operation_id || '.reason' and value->>'claimClass' = 'derived')
             )
         ) then
        raise exception 'Canonical technology archival lacks its bounded reason, dependency, or evidence contract.' using errcode = '22023';
      end if;
    elsif operation_record->>'operation' = 'archive_organization' then
      if operation_record->'before' is distinct from before_identity
         or operation_record->'dependencies' is distinct from private.canonical_organization_dependencies(live_organization.id) then
        raise exception 'Canonical organization archive has a stale identity or dependency snapshot.' using errcode = 'P0001';
      end if;
      if operation_record->'successor' is not null and operation_record->'successor' <> 'null'::jsonb then
        select * into successor_record
        from public.organizations
        where id = (operation_record#>>'{successor,id}')::uuid;
        if not found or successor_record.id = live_organization.id
           or successor_record.publication_status is distinct from 'published'
           or successor_record.slug is distinct from operation_record#>>'{successor,slug}'
           or successor_record.name is distinct from operation_record#>>'{successor,name}'
           or successor_record.updated_at is distinct from (operation_record#>>'{successor,baselineUpdatedAt}')::timestamptz
           or exists (select 1 from public.organization_slug_redirects where source_slug = successor_record.slug) then
          raise exception 'Canonical repair successor is stale, unpublished, or not a one-hop destination.' using errcode = 'P0001';
        end if;
      end if;
      if coalesce(operation_record->>'reason', '') not in ('unsupported_identity', 'outside_canadian_scope', 'outside_product_scope', 'defunct', 'superseded')
         or ((operation_record->>'reason' = 'superseded') is distinct from (operation_record->'successor' is not null and operation_record->'successor' <> 'null'::jsonb))
         or not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.before.name', 'source_backed')
         or not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.reason', 'derived')
         or ((operation_record->'successor' is not null and operation_record->'successor' <> 'null'::jsonb)
           and not private.canonical_repair_has_evidence(record, operation_id, 'operations.' || operation_id || '.successor', 'source_backed'))
         or jsonb_array_length(operation_record#>'{dependencies,incomingActiveRelationshipIds}') > 0
         or jsonb_array_length(operation_record#>'{dependencies,signalRecordLinkIds}') > 0
         or jsonb_array_length(operation_record#>'{dependencies,wikiPageRecordLinkIds}') > 0
         or exists (
           select 1 from jsonb_array_elements(record->'fieldEvidence') evidence(value)
           where value->>'id' in (select jsonb_array_elements_text(operation_record->'evidenceIds'))
             and not (
               (value->>'fieldPath' = 'operations.' || operation_id || '.before.name' and value->>'claimClass' = 'source_backed')
               or (value->>'fieldPath' = 'operations.' || operation_id || '.reason' and value->>'claimClass' = 'derived')
               or (value->>'fieldPath' = 'operations.' || operation_id || '.successor' and value->>'claimClass' = 'source_backed'
                 and operation_record->'successor' is not null and operation_record->'successor' <> 'null'::jsonb)
             )
         ) then
        raise exception 'Canonical organization archival lacks its bounded lifecycle, dependency, or evidence contract.' using errcode = '22023';
      end if;
    elsif coalesce(operation_record->>'operation', '') not in ('set_profile_field', 'add_alias') then
      raise exception 'Unsupported canonical repair operation %.', operation_record->>'operation' using errcode = '22023';
    end if;
  end loop;

  if archive_organization_count = 0
     and identity_operation is not null
     and identity_operation#>>'{after,entityKind}' <> before_identity->>'entityKind' then
    if exists (
      select 1 from jsonb_object_keys(resulting_profile_data) field_name
      where not (field_name = any(allowed_profile_fields))
    ) then
      raise exception 'Canonical entity-kind repair leaves a profile field invalid for the resulting kind.' using errcode = '22023';
    end if;
    if required_profile_field is not null
       and (jsonb_typeof(resulting_profile_data->required_profile_field) is distinct from 'string'
         or coalesce(length(trim(resulting_profile_data->>required_profile_field)), 0) < 40) then
      raise exception 'Canonical entity-kind repair lacks the required source-backed mandate field.' using errcode = '22023';
    end if;
  end if;

  select coalesce(array_agg(private.normalize_organization_identity(alias_record.alias)), '{}')
  into final_alias_values
  from public.organization_aliases alias_record
  where alias_record.organization_id = live_organization.id
    and alias_record.publication_status <> 'archived'
    and not (alias_record.id = any(archived_alias_ids));
  final_alias_values := final_alias_values || coalesce(array(
    select private.normalize_organization_identity(value->>'alias')
    from jsonb_array_elements(record->'operations') operation(value)
    where value->>'operation' = 'add_alias'
  ), '{}');
  if identity_operation#>>'{formerNameAlias}' is not null then
    final_alias_values := array_append(final_alias_values, private.normalize_organization_identity(identity_operation#>>'{formerNameAlias}'));
  end if;

  proposed_identity_values := array[
    private.normalize_organization_identity(proposed_name),
    private.normalize_organization_identity(proposed_legal_name)
  ] || final_alias_values;
  if nullif(private.normalize_organization_identity(proposed_name), '') is null
     or (proposed_legal_name is not null and nullif(private.normalize_organization_identity(proposed_legal_name), '') is null)
     or exists (select 1 from unnest(final_alias_values) alias_value(value) where nullif(value, '') is null) then
    raise exception 'Resulting canonical names and aliases must contain at least one letter or number.' using errcode = '22023';
  end if;
  if private.normalize_organization_identity(proposed_name) = any(final_alias_values) then
    raise exception 'Resulting canonical name duplicates an active or proposed alias.' using errcode = '23505';
  end if;
  if nullif(private.normalize_organization_identity(proposed_legal_name), '') is not null
     and private.normalize_organization_identity(proposed_legal_name) = any(final_alias_values) then
    raise exception 'Resulting legal name duplicates an active or proposed alias.' using errcode = '23505';
  end if;
  if cardinality(final_alias_values) <> (
    select count(distinct value)::integer from unnest(final_alias_values) alias_value(value)
  ) then
    raise exception 'Resulting aliases contain a normalized duplicate.' using errcode = '23505';
  end if;
  foreach identity_value in array proposed_identity_values
  loop
    if nullif(identity_value, '') is null then continue; end if;
    if exists (
      select 1 from public.organizations organization_record
      where organization_record.id <> live_organization.id
        and organization_record.publication_status = 'published'
        and identity_value in (
          private.normalize_organization_identity(organization_record.name),
          private.normalize_organization_identity(organization_record.legal_name)
        )
    ) or exists (
      select 1
      from public.organization_aliases alias_record
      join public.organizations organization_record on organization_record.id = alias_record.organization_id
      where organization_record.id <> live_organization.id
        and organization_record.publication_status = 'published'
        and alias_record.publication_status <> 'archived'
        and private.normalize_organization_identity(alias_record.alias) = identity_value
    ) then
      raise exception 'Canonical repair identity collides with another published organization.' using errcode = '23505';
    end if;
  end loop;
  if private.normalize_organization_website_domain(proposed_website) is not null
     and exists (
       select 1
       from public.organizations organization_record
       where organization_record.id <> live_organization.id
         and organization_record.publication_status = 'published'
         and private.normalize_organization_website_domain(organization_record.website_url)
           = private.normalize_organization_website_domain(proposed_website)
     ) then
    raise exception 'Canonical repair website collides with another published organization.' using errcode = '23505';
  end if;
end;
$$;

revoke all on function private.assert_organization_canonical_repair_candidate(public.candidate_changes)
from public, anon, authenticated;
