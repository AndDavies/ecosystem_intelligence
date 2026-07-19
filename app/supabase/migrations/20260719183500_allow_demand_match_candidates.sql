-- Permit the private demand-matching workspace to stage its typed candidate.
-- The original candidate-kind constraint predates this review workflow.
alter table public.candidate_changes
  drop constraint if exists candidate_changes_kind_check;

alter table public.candidate_changes
  add constraint candidate_changes_kind_check
  check (candidate_kind = any (array[
    'source_intake'::text,
    'organization_bundle'::text,
    'demand_signal_bundle'::text,
    'program_relationship_bundle'::text,
    'demand_match_bundle'::text
  ]));

alter table public.candidate_changes
  drop constraint if exists candidate_changes_typed_reviewer_rationale_check;

alter table public.candidate_changes
  add constraint candidate_changes_typed_reviewer_rationale_check
  check (
    proposed_record->>'schemaVersion' <> all (array[
      'organization_bundle_v2'::text,
      'demand_signal_bundle_v1'::text,
      'program_relationship_bundle_v1'::text,
      'demand_match_bundle_v1'::text
    ])
    or (
      length(trim(coalesce(reviewer_rationale, ''))) >= 80
      and length(trim(coalesce(reviewer_rationale, ''))) <= 2000
    )
  );

-- A production QA run reached research_runs before the old constraint rejected
-- its candidate rows. Preserve the audit record but mark the run accurately.
update public.research_runs run
set status = 'failed',
    failure_note = 'Candidate staging was rejected before any candidate or public record was created.'
where run.scope->>'workflow' = 'demand_match_suggestions'
  and run.status = 'completed'
  and not exists (
    select 1
    from public.candidate_changes candidate
    where candidate.research_run_id = run.id
  );
