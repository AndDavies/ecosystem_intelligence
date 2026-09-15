-- Prepared logos use the existing private intake bucket. Normal Publish uploads
-- the reviewed bytes; this trigger attaches media in the dossier transaction.
create or replace function private.attach_published_candidate_logo()
returns trigger
language plpgsql
security invoker
set search_path = public, private
as $$
declare
  logo jsonb := new.proposed_record->'candidateLogo';
  v_organization_id uuid := new.published_entity_id;
  media_id uuid;
  checksum text := logo->>'normalizedChecksum';
  asset_path text := logo->>'storagePath';
begin
  if new.status <> 'published' or old.status = 'published'
    or new.candidate_kind not in ('organization_bundle', 'organization_refresh_bundle')
    or asset_path is null then
    return new;
  end if;
  if not private.is_atlas_staff() or auth.uid() is null then
    raise exception 'Candidate logo publication requires the dossier reviewer.';
  end if;
  if coalesce(logo->>'status', '') not in ('ready', 'review_required')
    or coalesce(logo->>'confidence', '') not in ('high', 'medium')
    or coalesce(checksum, '') !~ '^[a-f0-9]{64}$'
    or asset_path <> 'candidate-logos/' || checksum || '.webp'
    or coalesce(logo->>'sourceChecksum', '') !~ '^[a-f0-9]{64}$'
    or coalesce(logo->>'sourcePageUrl', '') !~ '^https://'
    or coalesce(logo->>'sourceAssetUrl', '') !~ '^https://'
    or length(trim(coalesce(logo->>'selectionMethod', ''))) < 2 then
    raise exception 'Candidate logo provenance is incomplete.';
  end if;
  perform id from public.organizations
    where id = v_organization_id and publication_status = 'published' for update;
  if not found then raise exception 'Published logo organization is missing.'; end if;
  -- Refresh research fills a missing mark; an existing published logo wins.
  if exists (select 1 from public.media_assets m
    where m.organization_id = v_organization_id and m.asset_type = 'logo'
      and m.approval_status = 'approved' and m.publication_status = 'published') then
    return new;
  end if;
  if not exists (select 1 from storage.objects
    where bucket_id = 'atlas-public-media' and name = asset_path) then
    raise exception 'Reviewed logo bytes must be uploaded before Publish.';
  end if;
  insert into public.media_assets (
    organization_id, asset_type, storage_path, source_url, source_visibility,
    permission_basis, attribution_text, approval_status, publication_status
  ) values (
    v_organization_id, 'logo', asset_path, logo->>'sourceAssetUrl', 'public',
    format('Official organization logo reviewed with its dossier. Source page: %s. Selection: %s. Confidence: %s. SHA-256: %s.',
      logo->>'sourcePageUrl', logo->>'selectionMethod', logo->>'confidence', checksum),
    'Official organization logo', 'approved', 'published'
  ) returning id into media_id;
  insert into public.audit_events (actor_id, actor_role, event_type, entity_type, entity_id, summary, metadata)
  values (auth.uid(), 'reviewer', 'candidate_logo_published', 'organization', v_organization_id,
    'Official logo published with the reviewed dossier.',
    jsonb_build_object('candidate_id', new.id, 'media_asset_id', media_id, 'checksum', checksum));
  return new;
end;
$$;
revoke all on function private.attach_published_candidate_logo() from public, anon, authenticated, service_role;
create trigger attach_published_candidate_logo
  after update of status on public.candidate_changes
  for each row execute function private.attach_published_candidate_logo();
