# Review contract

A successful run has:

- one valid completed run manifest
- one valid typed lead batch
- one valid typed candidate batch
- at least one useful, cited, duplicate-cleared private candidate
- a generated reviewer rationale on every candidate and queue row
- a complete mappable Canadian primary location on every organization candidate
- explicit deferred records for ambiguous items
- a reviewer packet
- a database-shaped staging export with `publicationAllowed: false`
- at least one private `candidate_changes` row visible in Admin Review

The smoke command sends the validated export through a service-role-only, idempotent intake function directly into `candidate_changes`. `research_runs` is hidden audit metadata, not a reviewer queue. The queue accepts organization and public-demand candidates as first-class review objects. Intake is not approval. Reviewer acceptance is not publication. Publication remains a distinct human-only, atomic, audited action.
