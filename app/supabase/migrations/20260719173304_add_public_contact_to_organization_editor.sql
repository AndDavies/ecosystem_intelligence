-- Keep the simple canonical organization row while allowing the sole atlas
-- administrator to maintain official, source-supported public contact paths.
create or replace function public.update_published_organization_public_contact(
  p_organization_id uuid,
  p_reviewer_id uuid,
  p_public_contact jsonb,
  p_rationale text
)
returns text
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $$
declare
  organization_slug text;
  before_contact jsonb;
  clean_contact jsonb;
begin
  if not private.is_atlas_staff() or auth.uid() is distinct from p_reviewer_id then
    raise exception 'Editing requires the authenticated atlas administrator.' using errcode = '42501';
  end if;
  if p_public_contact is null or jsonb_typeof(p_public_contact) <> 'object' then
    raise exception 'Public contact must be an object.' using errcode = '22023';
  end if;
  if length(trim(coalesce(p_rationale, ''))) < 3 then
    raise exception 'Provide an editorial rationale for the public change.' using errcode = '22023';
  end if;

  clean_contact := jsonb_strip_nulls(jsonb_build_object(
    'contactPageUrl', nullif(trim(coalesce(p_public_contact->>'contactPageUrl', '')), ''),
    'publicEmail', nullif(lower(trim(coalesce(p_public_contact->>'publicEmail', ''))), ''),
    'publicPhone', nullif(trim(coalesce(p_public_contact->>'publicPhone', '')), ''),
    'linkedInUrl', nullif(trim(coalesce(p_public_contact->>'linkedInUrl', '')), '')
  ));

  if clean_contact ? 'contactPageUrl' and clean_contact->>'contactPageUrl' !~ '^https://' then
    raise exception 'The official contact page must use HTTPS.' using errcode = '22023';
  end if;
  if clean_contact ? 'linkedInUrl' and clean_contact->>'linkedInUrl' !~ '^https://' then
    raise exception 'The LinkedIn URL must use HTTPS.' using errcode = '22023';
  end if;
  if clean_contact ? 'publicEmail' and clean_contact->>'publicEmail' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'The public email is invalid.' using errcode = '22023';
  end if;
  if clean_contact ? 'publicPhone' and length(clean_contact->>'publicPhone') > 80 then
    raise exception 'The public phone number is too long.' using errcode = '22023';
  end if;

  select slug, coalesce(profile_data->'publicContact', '{}'::jsonb)
    into organization_slug, before_contact
  from public.organizations
  where id = p_organization_id and publication_status = 'published'
  for update;

  if organization_slug is null then
    raise exception 'The selected published organization no longer exists.' using errcode = '22023';
  end if;

  update public.organizations
  set profile_data = case
        when clean_contact = '{}'::jsonb then coalesce(profile_data, '{}'::jsonb) - 'publicContact'
        else jsonb_set(coalesce(profile_data, '{}'::jsonb), '{publicContact}', clean_contact, true)
      end,
      last_reviewed_at = now(),
      updated_at = now()
  where id = p_organization_id;

  insert into public.audit_events (
    actor_id, actor_role, event_type, entity_type, entity_id, summary, metadata
  ) values (
    p_reviewer_id,
    coalesce(auth.jwt()->'app_metadata'->>'role', 'admin'),
    'published_organization_contact_edited',
    'organization',
    p_organization_id,
    'Administrator edited source-supported public contact paths.',
    jsonb_build_object(
      'rationale', trim(p_rationale),
      'before', before_contact,
      'after', clean_contact
    )
  );

  return organization_slug;
end;
$$;

revoke all on function public.update_published_organization_public_contact(uuid, uuid, jsonb, text)
from public, anon, authenticated;
grant execute on function public.update_published_organization_public_contact(uuid, uuid, jsonb, text)
to authenticated;

comment on function public.update_published_organization_public_contact(uuid, uuid, jsonb, text)
is 'Updates official public contact paths inside the canonical organization profile after an explicit administrator action and records before and after audit data.';
