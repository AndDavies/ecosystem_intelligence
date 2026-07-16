insert into public.audit_events (
  actor_role, event_type, entity_type, summary, metadata, created_at
)
values (
  'reviewer',
  'candidate_batch_promoted',
  'research_batch',
  'Promoted 12 reviewed Canadian Underwater ISR organizations and capabilities.',
  jsonb_build_object(
    'batch_id', 'underwater-isr-public-atlas-2026-07-16',
    'reviewed_by', 'Andrew Davies',
    'organization_count', 12,
    'capability_count', 12,
    'source_count', 12,
    'promotion_migration', 'promote_underwater_isr_batch'
  ),
  '2026-07-16T12:00:00Z'::timestamptz
);
