# Candidate contract

Create `research_candidate_batch_v2` under `research/ingestion/candidate-batches-v2/`. Use `research/ingestion/schema/research-candidate-batch-v2.schema.json` as the portable contract and `app/src/lib/research/pipeline-schema.ts` as the executable contract.

Every candidate needs:

- stable ID and source-lead IDs
- confidence and `candidate_pending` review status
- an 80-2,000 character generated `reviewerRationale` that states the coverage value, evidence strength, and reviewer verification focus
- separate 0-100 inclusion and completeness scores, a green or amber review tier, and explicit warnings for every amber candidate
- a duplicate check with all identity methods and `clear` status
- canonical sources with accessed timestamps
- field-level evidence
- a mappable Canadian primary location for every organization: city, province or territory, non-null latitude and longitude, and `exact`, `city_centroid`, or `regional` confidence

## Enrichment checklist

Include each item when durable public evidence exists and it improves reviewer or map usefulness:

- legal name, stable aliases, canonical website, controlled kind, and categories
- descriptive mandate, operating model, founding or history context, and parent organization where relevant
- concrete capabilities with features, applications, technical tags, domain mappings, and conservative derived mission matches
- programs, cohorts, funding mechanisms, public portfolio or participation relationships, and operator relationships
- Canadian location with confidence plus official public contact page, email, phone, or LinkedIn URL when explicitly published
- current official product, program, contract, award, partnership, or newsroom evidence that clarifies present activity
- multiple complementary sources and field evidence for every material public claim

Do not treat enrichment as a length target. Omit unsupported fields and preserve unknowns as null. Green means the inclusion case and useful enrichment are well supported. Amber means the inclusion case is supportable but non-blocking enrichment is incomplete or needs verification. Legal name, direct contact, exact address, founding date, leadership, and exhaustive relationship coverage are optional unless a specific identity conflict makes one blocking.

Candidates with `possible_match` or `exact_duplicate` do not enter the candidate batch. Put them in `deferred` with the match and required follow-up.

Organization and public-demand candidates use the same queue contract. A completed research cycle cannot stop at candidate JSON: validated bundles must pass through the trusted staging export into pending `candidate_changes` rows. Qualified leads need no intermediate human approval.
