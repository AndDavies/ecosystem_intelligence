-- Keep anonymous policies free of private helper calls. Staff access is already
-- supplied by the separate authenticated ALL policies below each relation.
drop policy if exists "published defence briefs are public" on public.wiki_pages;
create policy "published defence briefs are public"
on public.wiki_pages for select to anon, authenticated
using (publication_status = 'published');

drop policy if exists "published defence brief sources are public" on public.wiki_page_sources;
create policy "published defence brief sources are public"
on public.wiki_page_sources for select to anon, authenticated
using (
  exists (
    select 1 from public.wiki_pages p
    where p.id = wiki_page_sources.page_id and p.publication_status = 'published'
  )
);

drop policy if exists "published defence brief links are public" on public.wiki_page_record_links;
create policy "published defence brief links are public"
on public.wiki_page_record_links for select to anon, authenticated
using (
  exists (
    select 1 from public.wiki_pages p
    where p.id = wiki_page_record_links.page_id and p.publication_status = 'published'
  )
);
