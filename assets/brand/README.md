# BLOOM brand assets (issue #6)

Original geometric brand assets for BLOOM. The mark is a warm two-tone blossom
(terracotta front petals over blush, gold center) on Ivory, aligned with
[../../docs/BRAND_AND_COPY.md](../../docs/BRAND_AND_COPY.md) and
`src/design/tokens.ts`. **Owner approval is still required to close #6** (a
`v1.0.0` release gate).

## Delivered assets

Vector sources (`assets/brand/`):

- `mark.svg` — the blossom mark (512 box, transparent).
- `wordmark.svg` / `wordmark.png` — mark + "BLOOM" in Fraunces SemiBold (plum).
- `icon.svg`, `adaptive-icon.svg`, `splash.svg` — composition sources.

Raster outputs (`assets/images/`), wired in `app.json`:

- `icon.png` — 1024×1024 opaque app icon (mark on Ivory).
- `adaptive-icon.png` — 1024×1024 Android foreground (transparent, safe zone).
- `splash.png` — centered mark (transparent; `expo-splash-screen` paints Ivory).
- `favicon.png` — 64×64 web favicon.

Fonts (`assets/fonts/`), loaded via `src/design/fonts.ts`:

- `Fraunces-SemiBold.ttf` (display), `Manrope-Regular/Medium/SemiBold.ttf` (body).
- Licenses: `OFL-Fraunces.txt`, `OFL-Manrope.txt` (SIL Open Font License — these
  files must stay alongside the fonts).

## Regenerate the raster assets

The PNGs and wordmark are derived from the SVG sources. The rasterizer is not a
project dependency; install it one-off and run the generator:

```bash
npm i -D @resvg/resvg-js@2.6.2
node scripts/generate-brand-assets.cjs
npm uninstall @resvg/resvg-js   # optional: keep it out of the lockfile
```

## Verification (issue #6 acceptance)

- Originality: geometric mark + wordmark authored in-repo (no third-party logo).
- Dimensions/transparency: per the lists above; icon is opaque, foreground and
  splash are transparent.
- Contrast: terracotta/plum on Ivory meets legibility; mark reads at 64px.
- Platform preview: Android/web now; iOS at Phase 13 (#58, ADR-0006).
- **Owner approval:** pending — record it on #6 and in BUILD_STATUS.md.
