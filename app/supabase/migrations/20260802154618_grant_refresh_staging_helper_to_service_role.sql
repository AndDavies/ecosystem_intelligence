-- The trusted staging RPC runs as service_role and inserts refresh candidates
-- through the baseline-precision trigger. The trigger calls this private,
-- immutable parser. Grant only that worker role the minimum execute privilege;
-- review, approval, and publication permissions remain unchanged.
revoke all on function private.refresh_candidate_baseline_text(text, jsonb)
from public, anon, authenticated;

grant execute on function private.refresh_candidate_baseline_text(text, jsonb)
to service_role;

comment on function private.refresh_candidate_baseline_text(text, jsonb)
is 'Private immutable refresh-baseline parser. Executable only by the trusted service-role staging path; it does not write or publish records.';
