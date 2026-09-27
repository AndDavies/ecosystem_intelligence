-- Additive snapshot support for the pipeline 1.9 release. Preserve historical records.
begin;

create or replace function private.valid_company_snapshot(items jsonb, entity_name text, legal_name text)
returns boolean language plpgsql immutable set search_path = pg_catalog as $$
declare item jsonb; ids text[] := '{}';
begin
  if jsonb_typeof(items) <> 'array' or jsonb_array_length(items) > 12 then return false; end if;
  for item in select value from jsonb_array_elements(items) loop
    if jsonb_typeof(item) <> 'object' or not (item ?& array['id','metric','subjectName','scopeRelation','reportingScope','amount','amountHigh','unit','currency','textValue','basis','period','asOf','qualification','sourceId','sourceUrl','sourceLocator']) then return false; end if;
    if exists (select 1 from jsonb_object_keys(item) k where k <> all(array['id','metric','subjectName','scopeRelation','reportingScope','amount','amountHigh','unit','currency','textValue','basis','period','asOf','qualification','sourceId','sourceUrl','sourceLocator'])) then return false; end if;
    if item->>'id' = any(ids) or coalesce(item->>'id','') !~ '^[a-z0-9-]{1,80}$' then return false; end if;
    ids := array_append(ids,item->>'id');
    if coalesce(item->>'metric','') <> all(array['listing','revenue','cash','debt','backlog','market_cap','employees','access']) then return false; end if;
    if coalesce(item->>'scopeRelation','') <> all(array['organization','parent']) then return false; end if;
    if item->>'scopeRelation' = 'organization' and item->>'subjectName' is distinct from entity_name and item->>'subjectName' is distinct from legal_name then return false; end if;
    if coalesce(item->>'basis','') <> all(array['reported_actual','forecast','conditional','available']) then return false; end if;
    if coalesce(item->>'asOf','') !~ '^\d{4}-\d{2}-\d{2}$' or (item->>'asOf')::date is null then return false; end if;
    if coalesce(item->>'sourceUrl','') !~ '^https://[^/[:space:]]+' then return false; end if;
    if exists (select 1 from unnest(array['subjectName','reportingScope','period','qualification','sourceId','sourceLocator']) k where coalesce(length(trim(item->>k)),0) < 2 or length(item->>k)>1000) then return false; end if;
    if item->>'metric' = any(array['revenue','cash','debt','backlog','market_cap','employees']) then
      if jsonb_typeof(item->'amount') <> 'number' or (item->>'amount')::numeric < 0 or item->'textValue' <> 'null'::jsonb then return false; end if;
      if item->'amountHigh' <> 'null'::jsonb and (jsonb_typeof(item->'amountHigh') <> 'number' or (item->>'amountHigh')::numeric < (item->>'amount')::numeric) then return false; end if;
      if item->>'metric' = 'employees' then
        if item->>'unit' <> 'people' or item->'currency' <> 'null'::jsonb then return false; end if;
      elsif item->>'unit' <> 'currency' or coalesce(item->>'currency','') !~ '^[A-Z]{3}$' then return false;
      end if;
    elsif item->>'unit' <> 'text' or coalesce(length(item->>'textValue'),0) < 1 or item->'amount' <> 'null'::jsonb or item->'amountHigh' <> 'null'::jsonb or item->'currency' <> 'null'::jsonb then return false;
    end if;
    if item->>'metric'='market_cap' and item->>'basis'<>'reported_actual' then return false; end if;
  end loop;
  return true;
exception when others then return false;
end;
$$;
revoke all on function private.valid_company_snapshot(jsonb,text,text) from public, anon;
grant execute on function private.valid_company_snapshot(jsonb,text,text) to authenticated, service_role;

alter table public.organizations add column snapshot_observations jsonb not null default '[]'::jsonb;
alter table public.organizations add constraint organizations_snapshot_observations_valid
  check(private.valid_company_snapshot(snapshot_observations,name,legal_name));
comment on column public.organizations.snapshot_observations is 'Reviewed dated observations with entity/reporting scope and source references. Not live market data. Empty for historical dossiers.';

-- Append to the bounded dossier view without changing its prior column order.
do $$
declare definition text;
begin
  select pg_get_viewdef('public.organization_dossiers'::regclass,true) into definition;
  definition := regexp_replace(definition, ';[[:space:]]*$', '');
  execute 'create or replace view public.organization_dossiers with (security_invoker=true) as select prior.*, organization.snapshot_observations from (' || definition || ') prior join public.organizations organization on organization.id=prior.id';
end;
$$;

-- Existing media approval/reuse columns retain authority. New explanatory metadata is optional.
alter table public.media_assets add column editorial_context jsonb;
alter table public.media_assets add constraint explanatory_media_reuse check (
  editorial_context is null or (
    coalesce(jsonb_typeof(editorial_context)='object'
    and editorial_context ?& array['subject','contextDate','context','caption','reuseBasis','reuseEvidenceUrl']
    and length(trim(editorial_context->>'subject')) between 2 and 240
    and length(trim(editorial_context->>'caption')) between 10 and 1000
    and length(trim(editorial_context->>'context')) between 10 and 800
    and editorial_context->>'reuseBasis' in ('permission','licensed','public_domain','unknown')
    and (publication_status <> 'published' or (
      approval_status='approved' and source_visibility='public'
      and editorial_context->>'reuseBasis' <> 'unknown'
      and editorial_context->>'reuseEvidenceUrl' ~ '^https://'
      and length(trim(permission_basis))>0 and length(trim(attribution_text))>0
    )), false)
  )
);

-- Patch the existing guarded publishers in place. Fail if the expected contract has drifted;
-- preserve locks, stale-baseline comparisons, reviewer authorization and atomic audit writes.
do $$
declare definition text; original text;
begin
  select pg_get_functiondef('public.publish_reviewed_organization_v3_candidates(uuid[],uuid)'::regprocedure) into definition;
  original := definition;
  definition := replace(definition, 'executive_relevance_summary, reviewed_questions,', 'executive_relevance_summary, snapshot_observations, reviewed_questions,');
  definition := replace(definition, 'organization_record->>''executiveRelevanceSummary'',', 'organization_record->>''executiveRelevanceSummary'', coalesce(organization_record->''snapshotObservations'', ''[]''::jsonb),');
  if definition = original or position('snapshotObservations' in definition)=0 or position('snapshot_observations, reviewed_questions' in definition)=0 then raise exception 'New-record publisher changed; review snapshot migration before applying.'; end if;
  execute definition;

  select pg_get_functiondef('public.publish_reviewed_organization_refresh_v2_candidates(uuid[],uuid)'::regprocedure) into definition;
  original := definition;
  definition := replace(definition, '''executive_relevance_summary'', ''reviewed_questions''', '''snapshot_observations'', ''executive_relevance_summary'', ''reviewed_questions''');
  definition := replace(definition, 'executive_relevance_summary = case', 'snapshot_observations = case when operation_record->>''field'' = ''snapshot_observations'' then operation_record->''after'' else snapshot_observations end, executive_relevance_summary = case');
  if definition = original or position('snapshot_observations = case' in definition)=0 or position('''snapshot_observations'', ''executive_relevance_summary''' in definition)=0 then raise exception 'Refresh publisher changed; review snapshot migration before applying.'; end if;
  definition := replace(definition, 'elsif field_name = ''reviewed_questions''', 'elsif field_name = ''snapshot_observations'' then field_name := ''snapshot_observations.'' || substring(leaf_path from 7); elsif field_name = ''reviewed_questions''');
  execute definition;
  select pg_get_functiondef('private.research_public_field_name(text)'::regprocedure) into definition;
  definition := replace(definition, 'segments := string_to_array', 'if p_field_path like ''organization.snapshotObservations.%'' then return ''snapshot_observations.'' || substring(p_field_path from 35); end if; segments := string_to_array');
  execute definition;
end;
$$;

-- Publication uses the existing guarded candidate transaction. Ordinary research still has no
-- canonical direct-write authority. Source/leaf checks run again at Publish.
create or replace function private.verify_snapshot_publication()
returns trigger language plpgsql security invoker set search_path=pg_catalog,public,private as $$
declare observations jsonb; observation jsonb; source_record jsonb; observation_index bigint; field_prefix text; operation_index bigint; leaf text;
begin
  if new.status='published' and old.status is distinct from 'published' then
    if new.schema_version='organization_bundle_v3' then
      observations:=coalesce(new.proposed_record#>'{organization,snapshotObservations}','[]'::jsonb);
      field_prefix := 'organization.snapshotObservations.';
    elsif new.schema_version='organization_refresh_bundle_v2' then
      select value->'after', ordinality-1 into observations, operation_index from jsonb_array_elements(new.proposed_record->'operations') with ordinality where value->>'field'='snapshot_observations' and value->>'operation'='set_field';
      field_prefix := 'operations.' || operation_index || '.after.';
    end if;
    if observations is not null then
      for observation, observation_index in select value, ordinality-1 from jsonb_array_elements(observations) with ordinality loop
        select value into source_record from jsonb_array_elements(new.proposed_record->'sources') where value->>'id'=observation->>'sourceId' and value->>'url'=observation->>'sourceUrl';
        if source_record is null or coalesce(source_record->>'visibility','public') <> 'public' then raise exception 'Snapshot source must resolve to public candidate evidence.'; end if;
        for leaf in select key from jsonb_each(observation) where value <> 'null'::jsonb loop
          if not exists(select 1 from jsonb_array_elements(new.proposed_record->'fieldEvidence') e where e->>'sourceId'=observation->>'sourceId' and ((new.schema_version='organization_bundle_v3' and e->>'fieldPath'=field_prefix || observation_index || '.' || leaf) or (new.schema_version='organization_refresh_bundle_v2' and exists(select 1 from jsonb_array_elements(new.proposed_record#>array['operations',operation_index::text,'leafEvidence']) binding where binding->>'fieldPath'='after.' || observation_index || '.' || leaf and (binding->'evidenceIds') ? (e->>'id'))))) then raise exception 'Snapshot requires mapped evidence for each public leaf.'; end if;
        end loop;
      end loop;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.verify_snapshot_publication() from public,anon;
create trigger verify_snapshot_publication before update of status on public.candidate_changes
for each row execute function private.verify_snapshot_publication();
commit;
