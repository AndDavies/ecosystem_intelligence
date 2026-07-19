# Candidate contract

Create `research_candidate_batch_v2` under `research/ingestion/candidate-batches-v2/`. Use `research/ingestion/schema/research-candidate-batch-v2.schema.json` as the portable contract and `app/src/lib/research/pipeline-schema.ts` as the executable contract.

Every candidate needs:

- stable ID and source-lead IDs
- confidence and `candidate_pending` review status
- an 80-2,000 character generated `reviewerRationale` that states the coverage value, evidence strength, and reviewer verification focus
- a duplicate check with all identity methods and `clear` status
- canonical sources with accessed timestamps
- field-level evidence
- a mappable Canadian primary location for every organization: city, province or territory, non-null latitude and longitude, and `exact`, `city_centroid`, or `regional` confidence

Candidates with `possible_match` or `exact_duplicate` do not enter the candidate batch. Put them in `deferred` with the match and required follow-up.

Organization and public-demand candidates use the same queue contract. A completed research cycle cannot stop at candidate JSON: validated bundles must pass through the trusted staging export into pending `candidate_changes` rows.
