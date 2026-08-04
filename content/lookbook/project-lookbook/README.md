# True North Map Project Lookbook

This folder contains the editable source for **True North Map: The System Behind the Map**.

> **Dated collateral:** this package preserves the 2026-07-28 production snapshot documented in `sources.md`. It is not current launch collateral and its counts, screenshots, commit references and release wording must be refreshed from production before reuse or distribution.

## Files

- `index.html` - print-ready editorial source.
- `styles.css` - North Signal print design system.
- `sources.md` - dated evidence and disclosure manifest.
- `assets/` - approved marks, imagery, diagrams, screenshots and QR artwork.

## Render

From the repository root:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new \
  --disable-gpu \
  --no-pdf-header-footer \
  --print-to-pdf="output/pdf/True_North_Map_The_System_Behind_The_Map_2026-07-28.pdf" \
  "file://$PWD/content/lookbook/project-lookbook/index.html"
```

Render the PDF to PNG before delivery:

```bash
mkdir -p tmp/pdfs/true-north-map-lookbook/rendered
pdftoppm -png -r 120 \
  output/pdf/True_North_Map_The_System_Behind_The_Map_2026-07-28.pdf \
  tmp/pdfs/true-north-map-lookbook/rendered/page
```

## Updating

1. Read production counts from `/api/atlas/summary`.
2. Capture current production screens.
3. Recalculate repository scope from the production-aligned commit.
4. Update `sources.md` with the new commit, dates and evidence.
5. Re-render and inspect every page.

Never add credentials, private evidence, raw research packets, subscriber details, search text, provider exports or internal security configuration to this package.
