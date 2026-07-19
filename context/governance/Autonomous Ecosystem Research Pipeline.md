# Autonomous Ecosystem Research Pipeline

Date: 2026-07-18
Status: implemented, live-tested, and review-integrated
Public brand: True North Map
Canonical domain: `https://truenorthmap.ca`

## Outcome

True North Map now has a bounded Codex-native research system that can run manually or on a weekly schedule. It measures coverage, selects one gap, expands durable sources, creates typed source leads, produces role-appropriate private candidates, applies deterministic evidence and duplicate gates, and sends successful candidates directly into the existing private Admin Review workflow.

The system never treats review intake as publication. The public-beta corpus currently contains 35 organizations and 31 technologies or offerings; any expansion requires a human to accept an organization or public-demand candidate in Review and use the explicit Publish checkpoint. `research_runs` is hidden audit metadata, not another queue or approval step. A completed run must place every validated candidate directly into `candidate_changes` with a generated reviewer rationale; file-only artifacts are not a successful terminal state.

## Coordinator flow

```mermaid
flowchart TD
  A["Manual start or weekly schedule"] --> B["Read AGENTS and run data readiness"]
  B --> C["Measure supply, ecosystem-support, and demand coverage"]
  C --> D["Select and record highest-value gap"]
  D --> E["Expand Global Source Book for up to 30 minutes"]
  E --> F["Create up to 25 typed source leads"]
  F --> G{"Lead qualified?"}
  G -- "No" --> H["Defer or reject with reason and follow-up"]
  G -- "Yes" --> I["Create role-specific candidate bundle and reviewer rationale"]
  I --> J["Map field evidence and derived alignment"]
  J --> K["Schema, taxonomy, URL, date, and duplicate gates"]
  K -- "Fail" --> H
  K -- "Pass" --> L["Trusted idempotent candidate intake"]
  L --> M["Admin Review: candidate_changes pending"]
  M --> N{"Human review decision"}
  N -- "Defer or reject" --> M
  N -- "Accept" --> O["Publish checkpoint"]
  O -- "Explicit human action" --> P["Atomic canonical promotion"]
```

## Agent and skill handoff

```mermaid
flowchart LR
  CO["$tnm-autonomous-research\nCoordinator"] --> SD["$tnm-source-discovery\nDurable sources and typed leads"]
  SD --> CB["$tnm-candidate-builder\nRole-specific bundles"]
  CB --> EM["$tnm-evidence-mapper\nField citations and derived matches"]
  EM --> RS["$tnm-review-steward\nValidation and direct review intake"]
  RS --> HR["Admin Review"]
  HR -. "explicitly accepted" .-> PUB["Controlled publication"]
```

## Organization and demand model

Organizations and public demand are independent typed records. This prevents a NATO policy page from being mistaken for an organization or a company press release from being treated as government demand.

```mermaid
classDiagram
  class Organization {
    kind
    categories
    location
    profileData
  }
  class Company
  class Accelerator
  class Incubator
  class ResearchTestCentre
  class InvestorFunder
  class EcosystemOrganization
  class GovernmentInnovationOffice
  class Capability
  class Program
  class Relationship
  class DemandIssuer {
    issuerType
    jurisdiction
    parentIssuer
  }
  class DemandSource {
    sourceKind
    commitmentLevel
    reviewerRationale
  }
  class DemandRequirement

  Organization <|-- Company
  Organization <|-- Accelerator
  Organization <|-- Incubator
  Organization <|-- ResearchTestCentre
  Organization <|-- InvestorFunder
  Organization <|-- EcosystemOrganization
  Organization <|-- GovernmentInnovationOffice
  Company "1" --> "0..*" Capability
  Accelerator "1" --> "1..*" Program
  Incubator "1" --> "1..*" Program
  InvestorFunder "1" --> "1..*" Relationship
  DemandIssuer "1..*" --> "1..*" DemandSource
  DemandSource "1" --> "1..*" DemandRequirement
  Capability "0..*" --> "0..*" DemandRequirement : derived public alignment
```

Supported public-demand issuers include NATO, the Government of Canada, DND, CAF, RCN, RCAF, Canadian Army, PSPC, DRDC, and IDEaS. The migration stores the hierarchy separately from individual demand sources, allowing co-issuers, sponsors, and beneficiaries to be represented without duplicating the source.

## Evidence contracts by organization kind

| Kind | Required review evidence |
| --- | --- |
| Company | At least one concrete cited capability |
| Accelerator | At least one cited program, cohort, or challenge |
| Incubator | At least one cited program, cohort, or incubation offering |
| Investor or funder | Sourced mandate and a public portfolio or funding relationship |
| Research or test centre | Sourced technical mandate |
| Ecosystem organization | Sourced mandate plus a program or relationship |
| Government innovation office | Sourced mandate plus a program or relationship |

## Bounded operation

- One coordinator per run.
- 90 minutes maximum, including 30 minutes maximum for recursive Source Book expansion.
- 25 qualified leads maximum and 10 candidates maximum.
- Canada-first geography, all active Mission Areas eligible.
- Canonical durable HTTPS sources first.
- Stop on unresolved duplicates, taxonomy drift, missing evidence, access failures, or rate limits.
- Resume an interrupted manifest instead of creating a second run for the same work.

## Validation and artifacts

The executable contract is `app/src/lib/research/pipeline-schema.ts`. The orchestrator is `app/scripts/autonomous-research.ts`. Portable JSON contracts live under `research/ingestion/schema/`.

```mermaid
flowchart LR
  R["research_run_v1"] --> V["research:smoke"]
  L["source_lead_batch_v2"] --> V
  C["research_candidate_batch_v2"] --> V
  V --> RP["reviews-v2/*.md"]
  V --> SE["staging/*.json"]
  SE --> TI["Service-role-only trusted intake"]
  TI --> CR["candidate_changes: pending + reviewer rationale"]
  CR --> HR["Human Review"]
  HR --> PC["Human Publish checkpoint"]
```

The first test cycle created four review candidates spanning company, accelerator, incubator, and investor contracts. The second selected the uncovered research/test-centre gap and created one additional candidate. A third demand-targeted cycle created the Canadian Army and IDEaS `True North Precision` innovation challenge as a first-class public-demand candidate. All three passed with zero schema, taxonomy, evidence, or duplicate errors. The six candidates were reviewed and explicitly published on July 19: five became public organizations and one became a public demand source with a reviewed requirement.

## Publication visibility contract

Successful publication is a database transaction, not a deployment event. Public organization and demand indexes render dynamically from the invalidatable atlas snapshot so an older full-route render cannot hide newly published records. The publication checkpoint shows separate organization and demand counts before promotion and provides direct public links under `Recent publications` after promotion. A reviewer should never need to redeploy the application to make a successfully published candidate visible.

```mermaid
flowchart LR
  R["Research candidate"] --> Q["Review queue\nOrganization or Demand signal"]
  Q --> A["Human accept"]
  A --> P["Publish checkpoint\nTyped counts"]
  P --> DB["Atomic Supabase promotion"]
  DB --> C["Invalidate atlas data and public routes"]
  C --> L["Recent publications\nDirect live links"]
  L --> O["Public Organizations"]
  L --> D["Public Demand Signals"]
```

## Schedule

The production cadence is one local Codex run every Monday at 06:00 America/Halifax. The scheduled prompt invokes `$tnm-autonomous-research`, selects across supply, ecosystem support, and non-NATO or NATO public-demand gaps, uses the repository skills for each handoff, runs the same deterministic validators as a manual cycle, and stops only after every private candidate and generated reviewer rationale enter Admin Review. Failed runs notify the operator; successful runs leave their run manifest, review packet, and staging export in `research/ingestion/` as reproducible audit artifacts.

Manual execution remains available through `pnpm research:prepare`, `pnpm research:validate`, and `pnpm research:smoke`. Scheduling grants only the private candidate-intake write performed by the trusted function. It does not grant authority to accept, publish, or mutate canonical ecosystem records.
