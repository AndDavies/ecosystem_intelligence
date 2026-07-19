-- Migration version aligned with the production history.
create index if not exists candidate_changes_published_entity_idx
  on public.candidate_changes (published_entity_id)
  where published_entity_id is not null;
