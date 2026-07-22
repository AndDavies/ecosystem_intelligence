# Design QA: Ask True North long-filter wrapping

Date: 2026-07-22

## Comparison target

- Source visual truth: `/var/folders/zy/qv3qyrkj13n26_6wv7xrdndm0000gn/T/codex-clipboard-35340354-2834-4ac1-9d5b-99b8c67cd16a.png`
- Source size: 1502 x 301 pixels.
- Rendered implementation: `output/design-qa/ask-true-north-filter-wrap-fixed.png`
- Implementation capture: 1448 x 307 pixels at a 1498 x 900 CSS-pixel desktop viewport.
- Combined comparison: `output/design-qa/ask-true-north-filter-wrap-comparison.png`
- State: a long natural-language discovery filter displayed beside the explanatory caveat and above the Filters, Map, and Table controls.
- Density normalization: the implementation capture was resized to the source width only in the combined comparison. The original implementation capture remains available unchanged.

## Findings and comparison history

### Iteration 1

- P1: The fixed 36-pixel filter-chip height allowed a second line of text to escape the chip and overlap the Filters, Map, and Table controls.
- Evidence: the source screenshot shows the second text line outside the chip boundary and directly above the controls.
- Fix: replaced the fixed height with a minimum height, added vertical padding and line height, allowed word wrapping within a bounded width, prevented the close icon from shrinking, and allowed the containing flex row to shrink safely.

### Iteration 2

- Desktop post-fix geometry: filter chip height 66 pixels, bottom edge 657.2; controls top edge 665.2; overlap false.
- Mobile post-fix geometry at 390 x 844 CSS pixels: filter chip height 186 pixels, bottom edge 716.4; controls top edge 724.4; overlap false.
- Browser console: no errors or warnings in the verified state.
- No actionable P0, P1, or P2 issue remains.

## Required fidelity surfaces

- Fonts and typography: Existing family, weight, size, and hierarchy remain unchanged. The filter now uses an explicit readable line height when it wraps.
- Spacing and layout rhythm: The chip expands to contain its text and preserves an eight-pixel gap before the controls on desktop and mobile.
- Colors and visual tokens: Existing surface, border, primary, and signal tokens remain unchanged.
- Image quality and assets: No image or icon assets were changed. The existing icon library remains in use.
- Copy and content: Search interpretation, caveat, control labels, and removal behaviour remain unchanged.

## Full-view and focused comparison evidence

- The combined comparison shows the original broken state above and the repaired state below.
- A focused comparison was required because the defect concerned the chip boundary, text wrapping, and adjacent control spacing.
- The sticky site header appears in the implementation crop because it is part of the live page and was not included in the user-provided crop; it is unrelated to the repaired component.

## Interaction checks

- Long discovery filter remains a removable button.
- Filters, Map, and Table controls remain visible and unobstructed.
- Desktop and mobile wrapping remain within the filter boundary.
- Search behaviour, analytics, data loading, and result selection were not changed.

final result: passed
