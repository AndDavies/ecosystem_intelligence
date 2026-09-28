-- Optional reviewed presentation copy. No content backfill, version activation or shortened narratives.
begin;
alter table public.organizations add column display_lead text, add column role_descriptor text;
alter table public.capabilities add column display_lead text, add column catalogue_teaser text;
comment on column public.organizations.display_lead is 'Optional reviewed factual header copy; description remains the complete narrative.';
comment on column public.organizations.role_descriptor is 'Optional reviewed organization role, not a TNM assessment.';
comment on column public.capabilities.display_lead is 'Optional reviewed factual header copy; summary remains the complete narrative.';
comment on column public.capabilities.catalogue_teaser is 'Optional reviewed catalogue copy retaining material configuration and availability qualifications.';

-- Appending nullable columns preserves old view consumers. Nested capabilities already use to_jsonb.
do $$ declare definition text; begin
  select regexp_replace(pg_get_viewdef('public.organization_dossiers'::regclass,true), ';[[:space:]]*$', '') into definition;
  execute 'create or replace view public.organization_dossiers with (security_invoker=true) as select prior.*, o.display_lead, o.role_descriptor from (' || definition || ') prior join public.organizations o on o.id=prior.id';
end $$;

create function pg_temp.required_replace(body text, old_text text, new_text text) returns text language plpgsql as $$
begin
  if strpos(body,old_text)=0 then raise exception 'Presentation-copy migration contract drift: %',old_text; end if;
  return replace(body,old_text,new_text);
end $$;

do $$ declare definition text; target regprocedure; begin
  select pg_get_functiondef('private.research_public_field_name(text)'::regprocedure) into definition;
  definition := pg_temp.required_replace(definition, 'when ''legalName''', 'when ''displayLead'' then ''display_lead'' when ''roleDescriptor'' then ''role_descriptor'' when ''catalogueTeaser'' then ''catalogue_teaser'' when ''legalName''');
  execute definition;
  foreach target in array array['public.publish_reviewed_organization_v3_candidates(uuid[],uuid)'::regprocedure, 'public.publish_reviewed_organization_refresh_v2_candidates(uuid[],uuid)'::regprocedure] loop
    select pg_get_functiondef(target) into definition;
    definition := pg_temp.required_replace(definition,'name, summary, capability_type, core_features,','name, summary, display_lead, catalogue_teaser, capability_type, core_features,');
    definition := pg_temp.required_replace(definition,'capability_record->>''summary'', capability_record->>''capabilityType'',','capability_record->>''summary'', capability_record#>>''{presentationCopy,displayLead}'', capability_record#>>''{presentationCopy,catalogueTeaser}'', capability_record->>''capabilityType'',');
    if target='public.publish_reviewed_organization_v3_candidates(uuid[],uuid)'::regprocedure then
      definition := pg_temp.required_replace(definition,'executive_relevance_summary, snapshot_observations,','display_lead, role_descriptor, executive_relevance_summary, snapshot_observations,');
      definition := pg_temp.required_replace(definition,'organization_record->>''executiveRelevanceSummary'',','organization_record#>>''{presentationCopy,displayLead}'', organization_record#>>''{presentationCopy,roleDescriptor}'', organization_record->>''executiveRelevanceSummary'',');
    else
      definition := pg_temp.required_replace(definition,'''snapshot_observations'', ''executive_relevance_summary''','''display_lead'', ''role_descriptor'', ''snapshot_observations'', ''executive_relevance_summary''');
      definition := pg_temp.required_replace(definition,'snapshot_observations = case','display_lead = case when operation_record->>''field'' = ''display_lead'' then operation_record#>>''{after}'' else display_lead end, role_descriptor = case when operation_record->>''field'' = ''role_descriptor'' then operation_record#>>''{after}'' else role_descriptor end, snapshot_observations = case');
      definition := pg_temp.required_replace(definition,'summary = capability_record->>''summary'',','summary = capability_record->>''summary'', display_lead = case when (capability_record->''presentationCopy'') ? ''displayLead'' then capability_record#>>''{presentationCopy,displayLead}'' else display_lead end, catalogue_teaser = case when (capability_record->''presentationCopy'') ? ''catalogueTeaser'' then capability_record#>>''{presentationCopy,catalogueTeaser}'' else catalogue_teaser end,');
      -- Compare only fields supplied in a historical/new baseline. Omission must preserve values.
      definition := pg_temp.required_replace(definition,'if live_child_snapshot is distinct from candidate_child_snapshot then', 'if operation_record#>''{after,presentationCopy}'' is not null and operation_record#>''{before,presentationCopy}'' is null then raise exception ''Presentation-copy change requires its current baseline.''; end if;
      if operation_record#>''{before,presentationCopy}'' is not null then
        select live_child_snapshot || jsonb_build_object(''presentationCopy'', jsonb_build_object(''displayLead'', display_lead, ''catalogueTeaser'', catalogue_teaser)) into live_child_snapshot from public.capabilities where id=(operation_record->>''targetId'')::uuid;
        candidate_child_snapshot := candidate_child_snapshot || jsonb_build_object(''presentationCopy'', jsonb_build_object(''displayLead'', operation_record#>''{before,presentationCopy,displayLead}'', ''catalogueTeaser'', operation_record#>''{before,presentationCopy,catalogueTeaser}''));
      end if;
      if live_child_snapshot is distinct from candidate_child_snapshot then');
    end if;
    execute definition;
  end loop;
end $$;

-- Existing public-leaf/evidence machinery creates citations using the mapping above.
-- Independently reject unsupported new leaves at intake and on every changed packet.
create function private.validate_presentation_copy_candidate() returns trigger language plpgsql security invoker set search_path=pg_catalog,public,private as $$
declare item jsonb; copy jsonb; leaf text; value jsonb; prefix text;
begin
  if new.schema_version='organization_bundle_v3' then
    for copy,prefix in
      select new.proposed_record#>'{organization,presentationCopy}', 'organization.presentationCopy.'
      union all select c.value->'presentationCopy','capabilities.' || (c.ordinality-1) || '.presentationCopy.' from jsonb_array_elements(new.proposed_record->'capabilities') with ordinality c
    loop
      if copy is null then continue; end if;
      if jsonb_typeof(copy)<>'object' then raise exception 'Presentation copy must be an object.'; end if;
      for leaf,value in select * from jsonb_each(copy) loop
        if leaf<>all(case when prefix='organization.presentationCopy.' then array['displayLead','roleDescriptor'] else array['displayLead','catalogueTeaser'] end) or jsonb_typeof(value)<>all(array['string','null']) then raise exception 'Invalid presentation field.'; end if;
        if value<>'null'::jsonb and not exists(select 1 from jsonb_array_elements(new.proposed_record->'fieldEvidence') e join jsonb_array_elements(new.proposed_record->'sources') s on s->>'id'=e->>'sourceId' where e->>'fieldPath'=prefix || leaf and e->>'claimClass'='source_backed' and coalesce(s->>'visibility','public')='public') then raise exception 'Presentation copy requires public factual field evidence.'; end if;
      end loop;
    end loop;
  elsif new.schema_version='organization_refresh_bundle_v2' then
    for item in select * from jsonb_array_elements(new.proposed_record->'operations') loop
      if item->>'field'=any(array['display_lead','role_descriptor']) then
        copy:=jsonb_build_object('value',item->'after'); prefix:='after';
      elsif item->>'entityType'='capability' and item->>'operation'=any(array['add_child','update_child']) then
        prefix:=case when item->>'operation'='add_child' then 'value.presentationCopy' else 'after.presentationCopy' end;
        copy:=case when item->>'operation'='add_child' then item#>'{value,presentationCopy}' else item#>'{after,presentationCopy}' end;
      else continue; end if;
      if copy is null then continue; end if;
      if jsonb_typeof(copy)<>'object' then raise exception 'Presentation copy must be an object.'; end if;
      for leaf,value in select * from jsonb_each(copy) loop
        if leaf<>all(case when prefix='after' then array['value'] else array['displayLead','catalogueTeaser'] end) or jsonb_typeof(value)<>all(array['string','null']) then raise exception 'Invalid presentation field.'; end if;
        if not exists(select 1 from jsonb_array_elements(item->'leafEvidence') b join jsonb_array_elements(new.proposed_record->'fieldEvidence') e on (b->'evidenceIds') ? (e->>'id') join jsonb_array_elements(new.proposed_record->'sources') s on s->>'id'=e->>'sourceId' where b->>'fieldPath'=case when leaf='value' then prefix else prefix || '.' || leaf end and e->>'claimClass'='source_backed' and coalesce(s->>'visibility','public')='public') then raise exception 'Presentation copy requires public factual leaf evidence.'; end if;
      end loop;
    end loop;
  end if;
  return new;
end $$;
revoke all on function private.validate_presentation_copy_candidate() from public,anon;
create trigger validate_presentation_copy_candidate before insert or update of proposed_record,status on public.candidate_changes for each row execute function private.validate_presentation_copy_candidate();
-- Reuse the existing administrator maintenance authority, citation model and audit trail.
create function public.update_published_dossier_presentation_copy(p_organization_id uuid, p_capability_id uuid, p_reviewer_id uuid, p_baseline timestamptz, p_copy jsonb, p_evidence_ids uuid[], p_rationale text)
returns text language plpgsql security invoker set search_path=pg_catalog,public,private as $$
declare org public.organizations%rowtype; cap public.capabilities%rowtype; field text; value jsonb; column_name text; target_id uuid; kind text; evidence_id uuid; before_copy jsonb;
begin
 if not private.is_atlas_staff() or auth.uid() is distinct from p_reviewer_id then raise exception 'Administrator required.' using errcode='42501'; end if;
 if length(trim(coalesce(p_rationale,'')))<3 or length(p_rationale)>2000 or jsonb_typeof(p_copy)<>'object' or p_copy is null then raise exception 'Reviewed copy and rationale required.'; end if;
 select * into org from public.organizations where id=p_organization_id and publication_status='published' for update;
 if org.id is null or org.updated_at is distinct from p_baseline then raise exception 'Stale organization baseline. Reload and review narrative and short copy together.'; end if;
 if p_capability_id is not null then
   select * into cap from public.capabilities where id=p_capability_id and organization_id=org.id and publication_status='published' for update;
   if cap.id is null then raise exception 'Wrong capability owner or unpublished target.'; end if;
   target_id:=cap.id; kind:='capability'; before_copy:=jsonb_build_object('displayLead',cap.display_lead,'catalogueTeaser',cap.catalogue_teaser);
 else target_id:=org.id; kind:='organization'; before_copy:=jsonb_build_object('displayLead',org.display_lead,'roleDescriptor',org.role_descriptor); end if;
 for field,value in select * from jsonb_each(p_copy) loop
   if field <> 'displayLead' and field <> (case when kind='organization' then 'roleDescriptor' else 'catalogueTeaser' end) then raise exception 'Invalid presentation field.'; end if;
   if jsonb_typeof(value)<>all(array['string','null']) then raise exception 'Copy must be text or null.'; end if;
   column_name:=private.research_public_field_name(field);
   if value is not distinct from before_copy->field then continue; end if;
   if value<>'null'::jsonb then
     if coalesce(cardinality(p_evidence_ids),0)=0 then raise exception 'Select supporting public evidence.'; end if;
     foreach evidence_id in array p_evidence_ids loop
       if not exists(select 1 from public.field_citations c join public.evidence_snippets e on e.id=c.evidence_snippet_id join public.sources s on s.id=e.source_id where c.entity_type=kind and c.entity_id=target_id and e.id=evidence_id and e.visibility='public' and e.public_approved and s.visibility='public' and s.public_approved) then raise exception 'Evidence must already belong to this published entity and be public.'; end if;
     end loop;
   end if;
   delete from public.field_citations where entity_type=kind and entity_id=target_id and field_name=column_name;
   if value<>'null'::jsonb then
     insert into public.field_citations(entity_type,entity_id,field_name,evidence_snippet_id) select kind,target_id,column_name,unnest(p_evidence_ids) on conflict do nothing;
   end if;
   execute format('update public.%I set %I=$1, updated_at=clock_timestamp(), last_reviewed_at=clock_timestamp() where id=$2',case when kind='organization' then 'organizations' else 'capabilities' end,column_name) using nullif(trim(value#>>'{}'),''),target_id;
 end loop;
 update public.organizations set updated_at=clock_timestamp() where id=org.id;
 insert into public.audit_events(actor_id,event_type,entity_type,entity_id,summary,metadata) values(p_reviewer_id,'presentation_copy_updated',kind,target_id,p_rationale,jsonb_build_object('before',before_copy,'after',p_copy,'evidence_ids',p_evidence_ids));
 return org.slug;
end $$;
revoke all on function public.update_published_dossier_presentation_copy(uuid,uuid,uuid,timestamptz,jsonb,uuid[],text) from public,anon;
grant execute on function public.update_published_dossier_presentation_copy(uuid,uuid,uuid,timestamptz,jsonb,uuid[],text) to authenticated;

-- A non-sensitive capability probe: old applications ignore it; new intake fails closed until migration.
create function public.dossier_presentation_copy_ready() returns boolean language sql stable set search_path=pg_catalog as $$select true$$;
revoke all on function public.dossier_presentation_copy_ready() from public;
grant execute on function public.dossier_presentation_copy_ready() to anon,authenticated,service_role;
commit;
