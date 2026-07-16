# Atlas Persistent Map And Lookbook Peek Design QA

## Comparison contract

- Source visual truth: `/Users/andrewdavies/.codex/visualizations/2026/07/15/019f6668-d1ce-77a1-bea0-1b1d13a998dc/atlas-map-audit/01-map-first.png`
- Source selected-marker state: `/Users/andrewdavies/.codex/visualizations/2026/07/15/019f6668-d1ce-77a1-bea0-1b1d13a998dc/atlas-map-audit/03-marker-selected.png`
- Browser-rendered implementation: `output/playwright/atlas-ux-desktop-final.jpg`
- Selected implementation state: `output/playwright/atlas-ux-selected-final.jpg`
- Full-view comparison: `output/playwright/atlas-ux-comparison.jpg`
- Focused selection comparison: `output/playwright/atlas-ux-selection-comparison.jpg`
- Viewport: 1265 × 1110 desktop capture
- States: national atlas with six records; Ontario-centered selected organization with four records in view

## Findings

- No open P0, P1, or P2 findings remain.
- The implementation preserves the audited atlas typography, compact filter strip, blue interaction colour, quiet borders, and restrained evidence presentation.
- The intentional layout change is visible in the full-view comparison: the desktop evidence table now remains directly below the map instead of replacing it.
- The selected-state comparison shows the intended progression from an orange marker alone to one synchronized Lookbook Peek card and a selected table row.

## Comparison history

| Priority | Earlier finding | Fix | Post-fix evidence |
| --- | --- | --- | --- |
| P1 | Accessible table replaced the map and removed spatial context. | Desktop/tablet now keep the map and viewport-filtered table together; mobile retains the focused map/list switch. | `atlas-ux-desktop-final.jpg` |
| P1 | The first table could publish stale pre-fit bounds and undercount visible organizations. | Initial viewport publishes after stable map idle; later movement is debounced. | Initial browser state reports six markers and six table records. |
| P2 | A marker selection changed colour but offered no useful next action. | Added one evidence-aware Lookbook Peek with dossier, save, evidence, close, confidence, freshness, and capability context. | `atlas-ux-selected-final.jpg` |
| P2 | The preview's primary link inherited dark global link colour over its blue background. | Moved base link styling into the Tailwind base layer so explicit utility colours win. | Computed link colour is `rgb(255, 255, 255)` on `rgb(7, 86, 217)`. |

## Required fidelity surfaces

- Fonts and typography: existing Inter atlas hierarchy and compact table text are preserved; preview labels use the same scale and weights.
- Spacing and layout rhythm: map height increased to 410 px on desktop, followed immediately by a compact results header and bounded scroll region.
- Colors and visual tokens: existing atlas blues, neutral borders, confidence tones, and orange selected-marker state are preserved.
- Image and asset fidelity: no new raster assets were required; approved placeholder-logo behavior uses the existing Lucide building icon.
- Copy and content: preview copy is derived only from the selected published organization, reviewed capability, reviewed alignment, citations, confidence, and freshness.

## Interaction checks

- Stable first load: six visible markers produce six evidence rows and a bounds-aware export URL.
- Zooming once reduces the current extent to two Ontario organizations and the table updates to the same two records.
- Table-row selection highlights the row, recenters the map, changes the marker state, and opens the matching preview.
- The preview exposes Open lookbook, Save, Evidence, and Close actions; Close dismisses it without navigation.
- The separate expand control opens the detailed evidence row without conflating expansion with selection.
- Keyboard Enter or Space selects a focused desktop row; the expand button retains an explicit accessible name and state.
- Mobile keeps the existing breakpoint-based map/list behavior and expandable result cards. The selected in-app browser surface did not expose viewport resizing, so no new mobile screenshot was captured in this pass.
- No runtime error text appeared in the browser-rendered state; the local server returned successful page responses.

## Validation

- `pnpm test`: 52 tests passed across 16 files.
- `pnpm lint`: passed.
- `pnpm leads:validate`: 12 leads, 0 errors, 0 warnings.
- `pnpm seed:validate`: passed.
- `pnpm ingest:validate`: 0 errors, 0 warnings.
- `pnpm build`: passed with production type checking and 29 generated static pages.

## Follow-up polish

- P3: perform an additional physical-device mobile pass when a resizable browser surface is available.
- P3: add a cluster-member chooser only if verified dataset density produces unresolved overlapping points at maximum zoom.

## Final result

final result: passed
