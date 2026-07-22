# Design QA: About page national defence-network image

Date: 2026-07-22

## Comparison target

- Source visual truth: `/var/folders/zy/qv3qyrkj13n26_6wv7xrdndm0000gn/T/codex-clipboard-774323a7-9e45-4c5a-8068-8401570f629e.png`
- Optimized source asset: `app/public/imagery/about-canada-defence-network.jpg`
- Source pixels: 1672 x 941.
- Rendered implementation: `output/design-qa/about-page-image-section.png`
- Implementation pixels: 1265 x 712 at the in-app browser's 1265 x 712 CSS-pixel desktop viewport.
- Combined comparison: `output/design-qa/about-page-image-comparison.jpg`
- State: the About page's "Why I built this" story section with the supplied illustration, narrative card, navigation, and persistent feedback control visible.
- Density normalization: the source was scaled to the implementation screenshot height for the side-by-side comparison. The source and implementation files remain available unchanged.

## Findings and comparison history

### Iteration 1

- No actionable P0, P1, or P2 differences remain.
- The full supplied illustration is used as the source asset. Its aircraft, drone formation, Canadian map, network lines, and yellow signal points remain intact and sharp.
- The intentional 16:7 desktop crop preserves the aircraft, exhaust, national network, and enough atmospheric space to keep the section calm rather than poster-like.
- The text panel sits over the image's low-detail left area, so it does not obscure the aircraft's focal point. Its opaque-enough surface and border preserve legibility while still allowing the image to set the tone.

## Required fidelity surfaces

- Fonts and typography: Existing True North Map font family, heavy headline weight, compact tracking, sentence wrapping, and small uppercase labels remain consistent. The narrower panel produces deliberate, readable line lengths.
- Spacing and layout rhythm: The section retains the existing two-rem radius and soft shadow, uses balanced 24-32 pixel insets, and keeps the following story section at the existing vertical interval.
- Colors and visual tokens: The image's grayscale palette and yellow points align with the existing charcoal, warm-white, and signal-yellow tokens. The text panel uses an off-white translucent surface rather than introducing a new color family.
- Image quality and asset fidelity: The supplied 1672 x 941 image was converted to a 314 KB high-quality JPEG without changing composition or colour treatment. Next Image provides responsive optimization and explicit dimensions through `fill` and `sizes`.
- Copy and content: All existing About page narrative, attribution, CTA, and evidence-oriented positioning remain unchanged. The image has accurate descriptive alternative text and does not imply that it depicts a documented operation.

## Full-view and focused comparison evidence

- The combined comparison places the complete source image beside the rendered About section and confirms that the intended aircraft, drones, map, and yellow network accents remain visible.
- A separate focused crop was not required because the image section fills almost the entire implementation screenshot and all typography, borders, image details, and crop boundaries are readable at that scale.

## Interaction and browser checks

- The top "Explore the map" action successfully navigates from `/about` to `/` and browser Back returns to `/about`.
- Navigation, feedback control, and the remainder of the About page remain present in the DOM.
- The browser console contains no application errors or warnings in the verified state; only expected development analytics and React development notices are present.
- The small-screen layout is structurally non-overlaid: below the `sm` breakpoint the image renders first and the narrative panel returns to normal document flow. The current in-app browser does not expose a viewport-resize capability, so a separate mobile screenshot was not captured in this pass.

## Follow-up polish

- P3: If a future homepage experiment is desired, create a separate lower-contrast, ecosystem-balanced crop rather than reusing this aircraft-led composition behind the homepage metrics.

final result: passed
