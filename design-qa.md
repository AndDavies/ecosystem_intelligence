# Candidate 5 Design QA

## Build under review

- Branch: `codex/candidate-5-redesign`
- Baseline commit: `a7d19181c572333e038a3420ce9f410ecb901d35`
- Rollback tag: `pre-candidate-5-redesign-2026-07-20`
- Local URL: `http://localhost:3000/`
- Scope: presentation and interaction styling only. No API, analytics, database, publication, authentication, or research-pipeline contract changes.

## Visual source of truth

- Candidate 5 reference: `/Users/andrewdavies/.codex/visualizations/2026/07/19/019f79b8-46cb-7093-b081-69702dfcc6de/candidate-round-4/shortlist/05-signal-yellow-soft-ledger.png`
- Figma draft: `IRbQj1gK1rbKfoXIXChlDO` was checked but did not contain an inspectable design frame. The approved Candidate 5 PNG therefore remained the visual source of truth.

## Comparison evidence

- Desktop implementation: `/Users/andrewdavies/.codex/visualizations/2026/07/20/true-north-map-candidate-5-implementation/12-home-desktop-final.png`
- Desktop reference and implementation side by side: `/Users/andrewdavies/.codex/visualizations/2026/07/20/true-north-map-candidate-5-implementation/13-source-vs-final.png`
- Selected organization state: `/Users/andrewdavies/.codex/visualizations/2026/07/20/true-north-map-candidate-5-implementation/15-home-selected-final.png`
- Mobile implementation: `/Users/andrewdavies/.codex/visualizations/2026/07/20/true-north-map-candidate-5-implementation/14-home-mobile-final.png`
- Organization dossier: `/Users/andrewdavies/.codex/visualizations/2026/07/20/true-north-map-candidate-5-implementation/05-organization-desktop-settled.png`
- Public demand page: `/Users/andrewdavies/.codex/visualizations/2026/07/20/true-north-map-candidate-5-implementation/11-demand-desktop.png`

Desktop comparisons used a 1448 by 1086 target frame. Responsive checks used 768 by 1024 and 390 by 844 viewports.

## Review history

### Pass 1

- The desktop hero was optically too large for the longer live headline and pushed the atlas too far below the initial viewport.
- The mobile search control fell below the first viewport, weakening the primary discovery action.

### Corrections

- Reduced the large-screen display scale while preserving the approved high-contrast hierarchy.
- Compressed the mobile hero, snapshot, and trust-note spacing so the search field and action appear within the initial 844-pixel mobile viewport.
- Kept the live product copy, corpus counts, current public-source caveat, full accessible results table, and Lookbook preview rather than replacing them with the shorter mock content.

## Final QA findings

### Fidelity

- Layout: the black-and-white ledger composition, signal-yellow active states, stacked wordmark, metric card, map/results split, and public-evidence rail match Candidate 5's design language.
- Typography: the display hierarchy, tight tracking, compact labels, and body copy density remain legible across desktop, tablet, and mobile.
- Color: near-black, warm white, signal yellow, and evidence green are consistently tokenized. Yellow is used for selection and navigation emphasis rather than body text.
- Surfaces: rounded corners are preserved, shadows remain restrained, and administrative screens use the quieter white/charcoal variant requested for operational work.
- Icons: visible controls use the existing Lucide icon family; no placeholder artwork, custom SVG, or CSS illustration was introduced.

### Responsiveness and interaction

- Desktop keeps the synchronized map and results rail together and preserves the complete accessible table beneath.
- Mobile retains explicit Map and List modes. At 390 pixels there is no horizontal overflow and the primary search action remains in the first viewport.
- Selecting Kraken Robotics highlights the results rail, updates the map preview, and marks the corresponding table row without changing the underlying selection workflow.
- Search, filters, map/list controls, dossier links, CSV export, feedback, update signup, navigation, and authentication redirects were exercised locally.

### Accessibility

- Public navigation, search, filters, map/list controls, results, table, feedback, and update prompts retain semantic links, buttons, labels, headings, and table structure.
- Keyboard focus uses a high-contrast signal-yellow outline.
- Mobile controls retain practical tap targets; text and controls do not clip or overlap at the tested viewports.
- The accessible table remains the non-map equivalent for all visible organizations.

### Intentional differences from the reference

- Live product copy and verified corpus metrics are longer than the visual mock, so the hero wraps differently.
- The implementation preserves the production Lookbook preview, dynamic clustered map, viewport-synchronized results, full table, and evidence-backed source links.
- These differences preserve True North Map's existing information architecture and functionality while applying the approved visual system.

## Severity summary

- P0 blockers: none.
- P1 major issues: none.
- P2 material fidelity or usability issues: none.
- P3 minor issues: none required before local stakeholder review.

final result: passed
