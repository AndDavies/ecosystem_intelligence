create index demand_sources_verified_evidence_idx
  on public.demand_sources (source_evidence_snippet_id)
  where source_evidence_snippet_id is not null;

create index demand_sources_verified_by_idx
  on public.demand_sources (source_verified_by)
  where source_verified_by is not null;
