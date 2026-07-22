-- Public editorial imagery is served from one CDN-backed bucket. Only the
-- exact True North Map administrator may list or mutate objects; public bucket
-- delivery permits anonymous reads when a page already exposes an asset URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'brief-images',
  'brief-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "atlas administrator lists defence brief images" on storage.objects;
create policy "atlas administrator lists defence brief images"
on storage.objects for select
to authenticated
using (bucket_id = 'brief-images' and private.is_atlas_staff());

drop policy if exists "atlas administrator uploads defence brief images" on storage.objects;
create policy "atlas administrator uploads defence brief images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'brief-images' and private.is_atlas_staff());

drop policy if exists "atlas administrator updates defence brief images" on storage.objects;
create policy "atlas administrator updates defence brief images"
on storage.objects for update
to authenticated
using (bucket_id = 'brief-images' and private.is_atlas_staff())
with check (bucket_id = 'brief-images' and private.is_atlas_staff());

drop policy if exists "atlas administrator deletes defence brief images" on storage.objects;
create policy "atlas administrator deletes defence brief images"
on storage.objects for delete
to authenticated
using (bucket_id = 'brief-images' and private.is_atlas_staff());
