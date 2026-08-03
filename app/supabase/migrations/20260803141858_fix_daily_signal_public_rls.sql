drop policy if exists "published signal editions are public" on public.signal_editions;
drop policy if exists "published signal items are public" on public.signal_items;
drop policy if exists "published signal sources are public" on public.signal_sources;
drop policy if exists "published signal source links are public" on public.signal_item_sources;
drop policy if exists "published signal record links are public" on public.signal_record_links;

create policy "published signal editions are public" on public.signal_editions
for select to anon, authenticated using (publication_status = 'published');
create policy "atlas staff reads all signal editions" on public.signal_editions
for select to authenticated using ((select private.is_atlas_staff()));

create policy "published signal items are public" on public.signal_items
for select to anon, authenticated using (
  publication_status = 'published' and exists (
    select 1 from public.signal_editions edition
    where edition.id = signal_items.edition_id and edition.publication_status = 'published'
  )
);
create policy "atlas staff reads all signal items" on public.signal_items
for select to authenticated using ((select private.is_atlas_staff()));

create policy "published signal sources are public" on public.signal_sources
for select to anon, authenticated using (exists (
  select 1 from public.signal_item_sources link
  join public.signal_items item on item.id = link.item_id and item.publication_status = 'published'
  join public.signal_editions edition on edition.id = item.edition_id and edition.publication_status = 'published'
  where link.source_id = signal_sources.id
));
create policy "atlas staff reads all signal sources" on public.signal_sources
for select to authenticated using ((select private.is_atlas_staff()));

create policy "published signal source links are public" on public.signal_item_sources
for select to anon, authenticated using (exists (
  select 1 from public.signal_items item
  join public.signal_editions edition on edition.id = item.edition_id
  where item.id = signal_item_sources.item_id
    and item.publication_status = 'published' and edition.publication_status = 'published'
));
create policy "atlas staff reads all signal source links" on public.signal_item_sources
for select to authenticated using ((select private.is_atlas_staff()));

create policy "published signal record links are public" on public.signal_record_links
for select to anon, authenticated using (exists (
  select 1 from public.signal_items item
  join public.signal_editions edition on edition.id = item.edition_id
  where item.id = signal_record_links.item_id
    and item.publication_status = 'published' and edition.publication_status = 'published'
));
create policy "atlas staff reads all signal record links" on public.signal_record_links
for select to authenticated using ((select private.is_atlas_staff()));
