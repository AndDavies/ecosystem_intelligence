# Research Run Brief - tnm-refresh-buy-canadian-2026-08-05

- Trigger: manual
- Mode: refresh_batch
- Selected coverage view: demand
- Selected gap: unmatched-demand:deep-strike
- Reason: The public deep strike demand requirement has no reviewed capability match in the local atlas.
- Maximum qualified leads: 25
- Maximum candidates: 10
- Minimum prospects: 1
- Minimum source lanes: 4
- Minimum completed candidates: 1
- Target candidates: 1
- Collection plan: research/ingestion/collection-plans-v1/tnm-refresh-buy-canadian-2026-08-05.json
- Claim ledger: research/ingestion/claim-ledgers-v1/tnm-refresh-buy-canadian-2026-08-05.json

## Required sequence

1. Complete the generated intelligence-requirement collection plan before broad searching; add named subjects, aliases, identifiers, and target-specific query patterns as they become known.
2. Apply $tnm-signal-refresh and build live published-record and public-demand watchlists before searching.
3. Search at least four source families, inspect no more than 50 source items, extract atomic signals, and disposition every signal.
4. Record atomic claims, canonical URLs, source-independence keys, temporal scope, conflicts, supersession, and candidate targets in the claim ledger while researching.
5. Select the strongest prospects and create typed source leads from durable public sources. Use English and French aliases and queries where relevant.
6. Use evidence recovery across at least three distinct lanes before deferring a plausible prospect for thin evidence.
7. Complete every subject's coverage vector and saturation assessment. Qualified leads continue automatically; do not pause for source-lead approval.
8. Build enriched typed candidates in green or amber review tiers. Amber candidates keep non-blocking gaps and claim conflicts as explicit reviewer warnings.
9. If the batch remains below its minimum, record a specific underTargetReason and exhaustionEvidence before completion.
10. Run `pnpm research:smoke -- --run <run> --collection-plan <collection-plan> --claims <claim-ledger> --prospects <prospects> --leads <leads> --candidates <candidates>`; refresh batches also pass `--signals <signals>`.
11. Confirm candidates appear in Admin Review, then stop. Do not approve or publish.

# Autonomous Research Coverage - 2026-08-05

- Durable Source Book rows: 491
- Operationally ranked Source Book rows: 128 (26%)
- Published organizations in current atlas: 405
- Published capabilities in current atlas: 367
- Published demand requirements: 30

| Organization kind | Published | Active review |
| --- | ---: | ---: |
| company | 311 | 0 |
| accelerator | 17 | 0 |
| incubator | 18 | 0 |
| research_test_centre | 13 | 0 |
| investor_funder | 20 | 0 |
| ecosystem_organization | 12 | 0 |
| government_innovation_office | 14 | 0 |

Missing kinds: none

| Supply mission lane | Published matches | Active-review matches |
| --- | ---: | ---: |
| arctic-domain-awareness | 65 | 0 |
| underwater-isr | 68 | 0 |
| autonomous-patrol-and-monitoring | 183 | 0 |
| edge-data-processing | 60 | 0 |

| Technical domain | Published capabilities | Active-review capabilities |
| --- | ---: | ---: |
| sensing-and-isr | 240 | 0 |
| autonomous-systems | 182 | 0 |
| mission-software-and-data | 211 | 0 |
| space-and-earth-observation | 35 | 0 |
| aerospace-and-mobility | 64 | 0 |
| communications-and-cyber | 72 | 0 |
| test-training-and-sustainment | 82 | 0 |
| advanced-manufacturing-and-integration | 109 | 0 |

| Public-demand issuer type | Published sources | Active-review sources |
| --- | ---: | ---: |
| alliance | 1 | 0 |
| federal_government | 18 | 0 |
| department | 21 | 0 |
| armed_forces | 2 | 0 |
| military_service | 1 | 0 |
| procurement_authority | 8 | 0 |
| research_innovation_agency | 1 | 0 |
| public_program | 11 | 0 |

Unmatched public-demand requirements: deep-strike, classified-network-identity-and-access-management, government-comsec-key-management, secure-classified-collaboration-network-modernization, quantum-resistant-cryptography-readiness, critical-infrastructure-cyber-resilience, supply-chain-cyber-risk-assessment-and-assurance, build-partner-buy-sovereign-procurement, defence-innovation-development-demonstration-and-scale, defence-workforce-clearance-and-secure-facilities, sovereign-sensors-space-and-autonomy, domestic-ammunition-explosives-and-critical-inputs, canadian-ip-itb-and-strategic-partnerships

## Highest-ranked reusable sources

1. [Accelerate Okanagan](https://accelerateokanagan.com/) - score 100, expected yield high
2. [Accelerator Centre](https://www.acceleratorcentre.com/) - score 100, expected yield high
3. [ACET](https://acet.ca/en/) - score 100, expected yield high
4. [Aerial Evolution Association of Canada](https://www.aerialevolution.ca/) - score 100, expected yield high
5. [Aéro Montréal](https://aeromontreal.ca/en/) - score 100, expected yield high
6. [Aerospace Industries Association of Canada](https://aiac.ca/) - score 100, expected yield high
7. [AI ROV ship modelling and detection project](https://oceansupercluster.ca/project/canadas-ocean-supercluster-announces-8m-ai-rov-ship-modeling-and-detection-project/) - score 100, expected yield high
8. [Allen-Vanguard](https://www.allenvanguard.com/) - score 100, expected yield high
9. [ANVIL](https://anvil.ai/) - score 100, expected yield high
10. [Atlantic Canada Aerospace and Defence Association](https://ac-ada.ca/) - score 100, expected yield high
11. [AWZ Ventures](https://www.awzventures.com/) - score 100, expected yield high
12. [Build Ventures About](https://www.buildventures.ca/about) - score 100, expected yield high
