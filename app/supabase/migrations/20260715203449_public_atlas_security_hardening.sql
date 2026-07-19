-- Migration version aligned with the production history.
-- Public buckets serve approved objects without a broad SELECT policy. Removing
-- this policy prevents anonymous file listing while preserving public object
-- URL access through the bucket's public flag.
drop policy if exists "public atlas media is readable" on storage.objects;

-- The dashboard's automatic-RLS event trigger does not require API roles to
-- execute its trigger function directly. Revoke RPC access when the helper is
-- present while leaving the event trigger itself operational.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated, service_role;
  end if;
end;
$$;
