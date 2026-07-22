-- Cover the reviewer and source foreign keys used by the Defence Briefs
-- editorial workspace and source-management queries.
create index if not exists wiki_page_sources_source_idx
  on public.wiki_page_sources (source_id);

create index if not exists wiki_pages_reviewed_by_idx
  on public.wiki_pages (reviewed_by);
