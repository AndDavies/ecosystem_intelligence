# Review contract

A successful run has:

- one valid completed run manifest
- one valid typed lead batch
- one valid typed candidate batch
- 8-10 useful, cited, duplicate-cleared private candidates for discovery batches, or the requested 1-5 for deep dossiers
- evidence-bounded enrichment beyond schema-minimum fields whenever useful official detail is available
- a generated reviewer rationale on every candidate and queue row
- a complete mappable Canadian primary location on every organization candidate
- explicit deferred records for ambiguous items
- a reviewer packet
- a database-shaped staging export with `publicationAllowed: false`
- at least one private `candidate_changes` row visible in Admin Review

Discovery completion also requires its prospect inventory, source-lane counters, green and amber counters, and a reconciled backlog. A below-target batch needs `underTargetReason` plus concrete exhaustion evidence. Amber candidates are valid review objects when their core inclusion case is sound and every non-blocking gap is visible as a warning.

The smoke command first checks the deployed `/api/system/research-contract` endpoint, then sends the validated export through a service-role-only, idempotent intake function directly into `candidate_changes`. A kind or schema that lacks deployed Review and Publish support fails before database staging. `research_runs` is hidden audit metadata, not a reviewer queue. Qualified source leads proceed automatically; there is no human lead-approval step. The queue accepts supported organization and public-demand new-record or refresh candidates as first-class review objects. Intake is not approval. Reviewer acceptance is not publication. Publication remains a distinct human-only, atomic, audited action.
