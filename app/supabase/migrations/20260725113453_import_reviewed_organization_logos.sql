-- Publish medium-confidence official marks only after the sole administrator
-- has completed the visual review. This is separate from automatic high-
-- confidence import so the recorded confidence is never strengthened merely
-- to make a batch publishable.

create or replace function public.import_reviewed_organization_logo(
  p_organization_id uuid,
  p_reviewer_id uuid,
  p_storage_path text,
  p_source_page_url text,
  p_source_asset_url text,
  p_selection_method text,
  p_confidence text,
  p_checksum text,
  p_attribution_text text,
  p_review_note text,
  p_run_id text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_media_id uuid;
  v_archived_paths text[];
begin
  if current_user <> 'service_role' then
    raise exception 'The reviewed logo importer requires the service role.';
  end if;

  if p_reviewer_id <> 'b443c433-2a78-4ca7-8a19-a8f40b140049'::uuid then
    raise exception 'The reviewed logo importer requires the canonical administrator identity.';
  end if;

  if not exists (
    select 1 from public.organizations
    where id = p_organization_id and publication_status = 'published'
  ) then
    raise exception 'Published organization not found.';
  end if;

  if p_checksum !~ '^[0-9a-f]{64}$'
    or p_storage_path <> format('organizations/%s/logos/%s.webp', p_organization_id, p_checksum) then
    raise exception 'Invalid immutable organization logo path.';
  end if;

  if p_source_page_url !~ '^https://' or p_source_asset_url !~ '^https://' then
    raise exception 'Official logo source URLs must use HTTPS.';
  end if;

  if p_confidence <> 'medium' then
    raise exception 'This path is reserved for human-reviewed medium-confidence marks.';
  end if;

  if length(trim(coalesce(p_review_note, ''))) < 10 then
    raise exception 'A human review note is required.';
  end if;

  select coalesce(array_agg(storage_path) filter (where storage_path is not null), array[]::text[])
  into v_archived_paths
  from public.media_assets
  where organization_id = p_organization_id
    and asset_type = 'logo'
    and publication_status = 'published'
    and storage_path is distinct from p_storage_path;

  update public.media_assets
  set publication_status = 'archived', updated_at = now()
  where organization_id = p_organization_id
    and asset_type = 'logo'
    and publication_status = 'published';

  insert into public.media_assets (
    organization_id,
    asset_type,
    storage_path,
    source_url,
    source_visibility,
    permission_basis,
    attribution_text,
    licence,
    approval_status,
    publication_status
  ) values (
    p_organization_id,
    'logo',
    p_storage_path,
    p_source_asset_url,
    'public',
    format(
      'Official website logo used for organization identification after human visual review. Source page: %s. Selection: %s. Confidence: %s. SHA-256: %s. Review: %s. Import run: %s.',
      p_source_page_url,
      p_selection_method,
      p_confidence,
      p_checksum,
      trim(p_review_note),
      p_run_id
    ),
    nullif(trim(p_attribution_text), ''),
    null,
    'approved',
    'published'
  )
  returning id into v_media_id;

  insert into public.audit_events (
    actor_id,
    actor_role,
    event_type,
    entity_type,
    entity_id,
    summary,
    metadata
  ) values (
    p_reviewer_id,
    'admin',
    'organization_logo_reviewed_imported',
    'organization',
    p_organization_id,
    'Administrator approved and published a medium-confidence official organization logo.',
    jsonb_build_object(
      'media_asset_id', v_media_id,
      'storage_path', p_storage_path,
      'source_page_url', p_source_page_url,
      'source_asset_url', p_source_asset_url,
      'selection_method', p_selection_method,
      'confidence', p_confidence,
      'checksum', p_checksum,
      'review_note', trim(p_review_note),
      'run_id', p_run_id
    )
  );

  return jsonb_build_object('media_asset_id', v_media_id, 'archived_paths', to_jsonb(v_archived_paths));
end;
$$;

revoke all on function public.import_reviewed_organization_logo(uuid, uuid, text, text, text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.import_reviewed_organization_logo(uuid, uuid, text, text, text, text, text, text, text, text, text) to service_role;
