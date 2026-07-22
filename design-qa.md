# Defence Briefs design QA

## Comparison target

- Source visual truth paths:
  - `/var/folders/zy/qv3qyrkj13n26_6wv7xrdndm0000gn/T/codex-clipboard-caac04c9-0241-45b1-83b8-ed253012f62a.png`
  - `/var/folders/zy/qv3qyrkj13n26_6wv7xrdndm0000gn/T/codex-clipboard-7c2804ea-071e-4bd3-90ec-5c99ce1d7db9.png`
- Browser-rendered implementation screenshots:
  - `/tmp/tnm-briefs-landing.png`
  - `/tmp/tnm-brief-detail.png`
- Routes: `http://localhost:3000/briefs` and `http://localhost:3000/briefs/modular-containerized-systems-for-naval-operations`
- State: anonymous public visitor, published article data, light theme.

## Viewport and normalization

- Source pixels: `1503 x 810` and `1515 x 826`.
- In-app-browser implementation pixels: `933 x 948`; CSS viewport reported as `948 x 963` because browser chrome consumes part of the capture.
- Density: browser and source captures were treated as 1x UI captures.
- For focused comparison, source images were proportionally normalized to 933 pixels wide. The corresponding implementation page regions were cropped below global navigation to the same 933-pixel width. Normalized landing regions were `933 x 503`; normalized detail regions were `933 x 508`.
- The available in-app-browser viewport is narrower than the supplied desktop screenshots. Comparison therefore focuses on the responsive intent and the reported defects, not false pixel-level desktop parity.

## Full-view comparison evidence

- The supplied landing capture showed the featured image escaping its grid track and covering the headline, description, and call to action.
- The revised landing capture keeps all featured metadata, headline, standfirst, source count, and action in a bounded white panel. At narrower widths, the editorial panel appears before the image; at desktop width the same components use a two-column grid.
- The supplied detail capture showed a large image-first region with the article content effectively below the fold. The revised detail capture uses a bounded headline-and-image hero, with the Bottom line section visibly beginning at the fold.
- Mobile checks at a 390 x 844 requested viewport found no horizontal overflow (`scrollWidth` equals `clientWidth`) and no question-form headings in article content.

## Focused region comparison evidence

- Typography: the existing True North Map Barlow hierarchy is preserved. Headlines retain the established heavy display weight, while metadata, standfirst, and article body use the existing site scale and line-height tokens.
- Spacing and layout: hero imagery is now explicitly bounded by a positioned, full-width container. Tablet and mobile heights are capped; desktop uses paired grid tracks and equal-height imagery.
- Colours and tokens: existing off-white canvas, white editorial surfaces, dark-grey ink, and yellow signal accent are unchanged.
- Image quality: original supplied editorial assets remain in use through `next/image`; no placeholder, SVG substitute, or CSS illustration was introduced.
- Copy and content: question labels were replaced by thesis-led article headings, narrative sections, takeaways, implications, a recommended action, limitations, and public sources.
- Interactions: the featured article action and every article-card link remain navigable. Breadcrumbs and in-page section links are present on article pages.
- Console: no page-specific browser console error was observed during the final public-route checks.

## Findings

- No actionable P0, P1, or P2 findings remain.
- P3 follow-up: longer articles may eventually benefit from editorial preview and section reordering controls in the administrator, but this is not required for the current article workflow.

## Comparison history

1. Earlier P1: absolutely positioned images escaped zero-height containers and covered the landing content. Fix: restored a clean development runtime, made the image wrapper positioned and full width, and bounded responsive heights. Post-fix evidence: `/tmp/tnm-briefs-landing.png` and browser bounding-box checks show the image contained within its card.
2. Earlier P2: at tablet width the landing page placed the large image before the featured title and action. Fix: changed responsive order so editorial copy and the action precede the image below the desktop breakpoint. Post-fix evidence: the action is visible at y=748 in the 948 x 963 CSS viewport and the image begins at y=828.
3. Earlier P2: the detail hero image filled too much vertical space before the article began. Fix: capped the detail image at 260 to 300 pixels below desktop and retained the 420-pixel split hero at desktop. Post-fix evidence: the Bottom line section begins at y=904 in a 963-pixel-high viewport.

## Implementation checklist

- [x] Constrain landing featured image and preserve call-to-action visibility.
- [x] Build compact title-and-image article hero.
- [x] Replace question-led public structure with narrative article structure.
- [x] Replace question-form administration with article editing fields.
- [x] Verify desktop-responsive and mobile layouts.
- [x] Preserve public sources, related records, review status, and publication controls.

final result: passed
