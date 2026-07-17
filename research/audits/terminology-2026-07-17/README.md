# Public Atlas Terminology Audit

Date: 2026-07-17  
Surface: Production public atlas, expanded result, and organization profile  
Goal: Make defence and ecosystem-intelligence language immediately understandable without weakening evidence and editorial safeguards.

## Overall recommendation

Use a two-layer vocabulary throughout the public product:

1. **Verified information** — facts supported by published sources and cleared for publication.
2. **Analyst assessment** — a reviewed judgment about mission or demand relevance based on those facts.

Keep `derived read`, `review posture`, candidate status, and approval language inside the editorial workspace. Public users should see the decision meaning, not the internal production process.

## Highest-impact finding

The atlas currently shows `Reviewed fit` and `Reviewed derived fit` even when the user has not selected a mission or demand signal. The application falls back to the first available alignment, so the word `fit` has no visible reference point. This is both a terminology problem and a product-logic problem.

Recommended behavior:

- General browsing: do not show a fit or match column.
- Mission-selected results: show `Assessment confidence` and name the mission in the expanded rationale.
- Demand-selected results: show `Assessment confidence` and name the demand signal in the expanded rationale.

## Recommended public vocabulary

| Current label | Recommended label | Usage |
| --- | --- | --- |
| Reviewed fit | Remove in general browsing; `Assessment confidence` in mission/demand results | A match is already implied by a filtered result set. |
| Reviewed derived fit | `Analyst assessment` or a confidence value such as `High confidence` | Separate what the content is from how confident the assessment is. |
| Derived read(s) | `Analyst assessment(s)` | Familiar defence/intelligence language without internal data-model jargon. |
| Reviewed alignment | `Mission assessment` or `Demand assessment` | Name the object being assessed. |
| Reviewed mission alignment | `Mission relevance` | Clear profile-section title. |
| Demand alignment | `Demand relevance` | Clear profile-section title; retain the public-source caveat. |
| Why this capability fits the selected context | `Why it matches {mission or demand name}` | Avoid an unnamed “context.” |
| Review posture / Trust posture | `Data quality` | Plain-language umbrella for evidence strength, last check, and location accuracy. |
| Source confidence | `Evidence strength` | Use `Strong`, `Moderate`, or `Limited`; do not mix it with assessment confidence. |
| Confidence | `Assessment confidence` | Use only for the mission/demand assessment. |
| Freshness | `Last verified` | Show the date; add `Review due` only when action is needed. |
| Stale | `Out of date` or `Review overdue` | Clearer and less database-like. |
| Map precision | `Location accuracy` | Plain language. |
| City Centroid | `City-level` | Remove GIS terminology from public profiles. |
| Evidence register | `Sources` | Familiar and compact. |
| Public-source evidence | `Sources` | The source list already establishes provenance. |
| No reviewed mission alignment | `Mission relevance not assessed yet` | Describes a coverage gap without sounding like rejection. |
| No reviewed public-demand match | `Demand relevance not assessed yet` | Describes a coverage gap without implying a negative result. |
| Open lookbook / organization dossier / organization profile | `View profile` / `Organization profile` | Use `lookbook` only for a generated multi-entity report or export. |
| Entity type | `Organization type` | Matches how users describe companies, accelerators, and other participants. |

## Recommended atlas presentation

### General browsing

`Organization | Capability | Region | Sources | Last verified`

Do not show mission or demand assessment language when the user is browsing by geography, organization type, or capability alone.

### Mission or demand search

`Organization | Capability | Region | Assessment confidence | Sources | Last verified`

Expanded result:

- `Why it matches Underwater ISR`
- `Analyst assessment`
- `Assessment confidence: High`
- `Sources`
- `Data quality`
- `Location accuracy: City-level`

Public caveat:

> Analyst assessment based on published sources. It is not endorsement, eligibility, or procurement guidance.

## Screen findings

1. **Atlas results — needs change.** `Reviewed fit` is shown without a selected mission or demand signal. The repeated `Reviewed derived fit` badge communicates editorial process rather than user value.
2. **Expanded result — mixed.** The rationale and source link are valuable, but `selected context`, `review posture`, and unqualified `confidence` make the user translate the data model before understanding the recommendation.
3. **Organization profile — needs simplification.** `Derived reads`, `reviewed mission alignment`, `reviewed derived fit`, `trust posture`, and `evidence register` create five labels for two ideas: verified information and analyst assessment.

## Accessibility considerations

- The current table exposes repeated accessible row text containing `Reviewed derived fit` without naming the relevant mission. Screen-reader users receive even less context than sighted users.
- Qualify every confidence label as either `Evidence strength` or `Assessment confidence`; do not depend on badge colour to explain the distinction.
- Include the mission or demand name in the expanded-section heading so the relationship remains clear out of visual context.
- Screenshot review cannot confirm keyboard behavior, focus order, colour contrast ratios, zoom reflow, or full screen-reader output; those require a separate interaction and accessibility test.

## Implementation priority

1. Remove the assessment column in unfiltered/general browsing and make it conditional on a mission or demand filter.
2. Replace public `derived read` language with `analyst assessment`.
3. Separate `Evidence strength` from `Assessment confidence` everywhere.
4. Standardize `Organization profile` for the web experience and reserve `lookbook` for generated reports.
5. Replace `freshness`, `posture`, `map precision`, and `evidence register` with the plain-language labels above.

This can be implemented as a presentation and conditional-rendering pass. It does not require a database migration.
