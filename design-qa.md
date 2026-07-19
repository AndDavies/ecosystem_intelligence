# Field Atlas design QA (historical snapshot)

This file records the 2026-07-17 validation run. Current release instructions live in `AGENTS.md` and use `pnpm release:validate`.

Date: 2026-07-17

## Scope

- National atlas at `/`
- Representative organization dossier at `/organizations/geospectrum-technologies`
- Shared public header, page shell, feedback, update signup, forms, and public supporting routes

## Visual direction

- Warm canvas and white surfaces in place of the former ocean-brand palette
- Spruce for primary actions and verified states
- Coral for selection and active navigation
- Violet for analyst assessment content
- Rounded 24 px application shells, 16 px cards, and 12 px controls
- Map-first discovery with graphite clusters, spruce markers, and coral selection

## Comparison captures

Local captures are stored in:

`/Users/andrewdavies/.codex/visualizations/2026/07/17/ecosystem-intelligence-field-atlas-build`

- `01-baseline-atlas.png`
- `02-baseline-dossier.png`
- `03-after-atlas-iteration1.png`
- `04-after-dossier-iteration1.png`

## Scorecard

| Route | Baseline | Final | Notes |
| --- | ---: | ---: | --- |
| Atlas | 6.9/10 | 8.7/10 | Clearer hierarchy, calmer map, integrated control deck, synchronized table, stronger visual identity |
| Dossier | 7.0/10 | 8.8/10 | Editorial hierarchy, clearer action priority, compact identity rail, assessment/evidence pairing |

## Functional QA

- Filter panel opens and exposes all four filter dimensions.
- Selecting Atlantic Canada synchronizes the map, result count, URL state, table, and export URL.
- Expanding a result opens both the map preview and evidence-backed detail row.
- `Halifax` natural-language discovery resolves to Halifax Regional Municipality and a published organization.
- Dossier Connect, Save, Export, website, correction, capability, mission, and source links are present.
- Reduced-motion handling is included for the public experience.

## Release checks

- `pnpm test`: passed, 23 files and 79 tests.
- `pnpm lint`: passed.
- `pnpm leads:validate`: passed with zero errors and zero warnings.
- `pnpm seed:validate`: passed.
- `pnpm ingest:validate`: passed with zero errors and zero warnings.
- `pnpm build`: passed.
