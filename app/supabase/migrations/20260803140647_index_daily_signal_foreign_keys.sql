create index signal_editions_reviewed_by_idx on public.signal_editions (reviewed_by) where reviewed_by is not null;
create index signal_item_sources_source_idx on public.signal_item_sources (source_id);
create index signal_runs_edition_idx on public.signal_runs (edition_id) where edition_id is not null;
create index signal_social_drafts_edition_idx on public.signal_social_drafts (edition_id);
create index signal_social_drafts_item_idx on public.signal_social_drafts (item_id) where item_id is not null;
