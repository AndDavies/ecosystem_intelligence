-- Restrict every existing atlas-staff RLS policy to the single, explicitly
-- approved administrator identity. Public account metadata cannot grant access.
create or replace function private.is_atlas_staff()
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog
as $$
  select (select auth.uid()) = 'b443c433-2a78-4ca7-8a19-a8f40b140049'::uuid
    and lower(coalesce(auth.jwt() ->> 'email', '')) = 'm.andrew.davies@gmail.com'
    and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

comment on function private.is_atlas_staff() is
  'Fail-closed authorization for the sole Ecosystem Intelligence administrator. Requires exact auth user ID, email, and controlled app_metadata role.';
