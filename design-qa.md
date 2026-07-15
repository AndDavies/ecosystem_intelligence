# Option 3 Atlas Design QA

## Comparison contract

- Selected reference: `/Users/andrewdavies/.codex/generated_images/019f6668-d1ce-77a1-bea0-1b1d13a998dc/exec-86ced052-69d5-4587-859f-de714e8562cb.png`
- Implementation capture: `app/output/atlas-option3-final.png`
- Side-by-side comparison: `app/output/atlas-option3-comparison.png`
- Desktop viewport: 1488 × 1054
- Compared state: national atlas, map visible, six published records, first result expanded

The implementation keeps the selected direction's calm public-atlas shell, full-width question input, compact filter strip, map/result synchronization, dense evidence table, and expandable decision detail. It uses the project's real reviewed records rather than the illustrative reference content.

## Findings and fixes

| Priority | Finding | Resolution |
| --- | --- | --- |
| P1 | The MapLibre canvas was blank in browsers without WebGL2. | Added a Leaflet/OpenStreetMap fallback while keeping MapLibre as the primary renderer. |
| P1 | The desktop table became a horizontal-scroll task on mobile. | Added a map/list toggle and compact expandable organization cards with the same evidence and dossier actions. |
| P1 | CSV export returned only its header because the export selector collided with the organization `type` filter. | Moved the export selector to `export=atlas-results` and retained backward compatibility for old links. |
| P2 | Nationwide bounds spent too much space on empty geography. | The map now frames the current result set with a conservative zoom cap and falls back to national bounds when no coordinates are available. |
| P2 | Mobile map/list controls could sit below Leaflet's stacking context. | Raised the application controls above the map controls and verified both modes in a 390 × 844 viewport. |
| P2 | PDF evidence sections could orphan onto a nearly empty second page. | Rebalanced page spacing and placed dossier evidence in the available review rail; organization and capability dossiers now render as polished one-page PDFs. |

## Interaction checks

- Natural-language discovery exposes constrained filters and returns only published records.
- Region filters update the URL, visible chips, result count, map points, and accessible results together.
- Empty demand searches show an intentional coverage state rather than invented matches.
- Mobile navigation, map/list toggle, expandable cards, evidence links, and dossier navigation work after hydration.
- The organization dossier distinguishes source-backed profile data, reviewed derived mission fits, demand coverage state, and public citations.
- Filtered CSV contains six stable-ID records in the unfiltered state.
- Organization and capability dossier PDFs and the two-entry Atlantic regional report passed rendered-page inspection.

## Final disposition

Passed. No open P0, P1, or P2 design issues remain in the implemented foundation. P3 polish can continue as the verified dataset expands and a domain-restricted production basemap key is configured.
