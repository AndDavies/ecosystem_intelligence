# True North Map dossier-enrichment run brief

- Run: `tnm-dossier-corpus-wave2-20260810`
- Mode: `dossier_enrichment`
- Status: **completed locally; pending private Admin Review intake**
- Scope: seven assigned published organizations across accelerator, ecosystem, investor and defence-technology roles; this wave size is a review boundary, not discovery yield
- Candidates: 7 consolidated `organization_refresh_bundle_v2` proposals
- Selected evidence: 57 non-duplicative durable sources (8-9 per target in this evidence-led result); every source supports a proposed public leaf or the AWZ fund-count warning
- Public effect: none

## Targets and readiness

- **Accelerate Okanagan (`accelerate-okanagan`)**: `ready_for_editorial_v1` with role-specific context, Canadian footprint, structured public contact, a genuine dated development, one record-specific first-conversation question and an explicit activation operation.
- **ACET (`acet`)**: `ready_for_editorial_v1` with role-specific context, Canadian footprint, structured public contact, a genuine dated development, one record-specific first-conversation question and an explicit activation operation.
- **Aerial Evolution Association of Canada (`aerial-evolution-association-of-canada`)**: `ready_for_editorial_v1` with role-specific context, Canadian footprint, structured public contact, a genuine dated development, one record-specific first-conversation question and an explicit activation operation.
- **Aéro Montréal (`aero-montreal`)**: `ready_for_editorial_v1` with role-specific context, Canadian footprint, structured public contact, a genuine dated development, one record-specific first-conversation question and an explicit activation operation.
- **Allen-Vanguard (`allen-vanguard`)**: `ready_for_editorial_v1` with role-specific context, Canadian footprint, structured public contact, a genuine dated development, one record-specific first-conversation question and an explicit activation operation.
- **AWZ Ventures (`awz-ventures`)**: `ready_for_editorial_v1` with role-specific context, Canadian footprint, structured public contact, a genuine dated development, one record-specific first-conversation question and an explicit activation operation.
- **Bubble Technology Industries (`bubble-technology-industries`)**: `ready_for_editorial_v1` with role-specific context, Canadian footprint, structured public contact, a genuine dated development, one record-specific first-conversation question and an explicit activation operation.

## Research boundary

The run preserves every existing capability, program, relationship, Mission Area and Public Need record. It proposes only bounded parent editorial fields plus the version flag for human review. It does not accept, publish, activate, contact, message, alter a Working List or switch the full production corpus. Source counts are outcomes of useful, non-duplicative evidence collection, never a minimum, target or permission to pad.

## Exact operator sequence

Read-only contract gate:

```bash
pnpm research:smoke -- --run research/ingestion/runs/tnm-dossier-corpus-wave2-20260810.json --collection-plan research/ingestion/collection-plans-v1/tnm-dossier-corpus-wave2-20260810.json --claims research/ingestion/claim-ledgers-v1/tnm-dossier-corpus-wave2-20260810.json --prospects research/ingestion/prospect-inventories-v1/tnm-dossier-corpus-wave2-20260810.json --signals research/ingestion/signal-batches-v1/tnm-dossier-corpus-wave2-20260810.json --leads research/ingestion/source-leads-v2/tnm-dossier-corpus-wave2-20260810.json --candidates research/ingestion/candidate-batches-v2/tnm-dossier-corpus-wave2-20260810.json --check-only
```

After that check passes and the live baseline, active-review overlap and deployed contract are re-read, generate the private reviewer packet and staging export with:

```bash
pnpm research:review -- research/ingestion/candidate-batches-v2/tnm-dossier-corpus-wave2-20260810.json
pnpm research:stage -- --run research/ingestion/runs/tnm-dossier-corpus-wave2-20260810.json --candidates research/ingestion/candidate-batches-v2/tnm-dossier-corpus-wave2-20260810.json
pnpm research:import -- --staging research/ingestion/staging/tnm-dossier-corpus-wave2-20260810.json
```

The import command is the only approved database write. It may create private pending candidates only.

## Reviewer gate

Review every mapped source and record-specific warning. The staged candidate rationale is an editable suggested reviewer update, not evidence that a human has already reviewed or accepted the candidate. Accept only a candidate whose exact wording is supported; Publish remains a separate human checkpoint.
