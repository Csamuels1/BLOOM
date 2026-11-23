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

## In-app spot illustrations (issue #51) — APPROVED

> **Status: approved by the owner on 2026-11-23 at the Phase 12 gate (#54).**
> All five (blossom, sprout, leaves, sunrise, moon) were reviewed on a rendered
> preview at preview and in-app sizes, on the app's ivory background. Any change
> to them needs fresh owner approval.

Original botanical spot illustrations replace the remaining text-only
placeholders (onboarding welcome and empty states). They are drawn in code with
`react-native-svg` in `src/components/Illustration.tsx` (no raster files, ~5 KB
of source total) and use only brand tokens from `src/design/tokens.ts`
(terracotta, blush, gold, sage, muted sage, ivory — never amber, never red).

| Name      | Motif                                       | Used on                       |
| --------- | ------------------------------------------- | ----------------------------- |
| `blossom` | Five-petal blossom echoing the mark         | Onboarding welcome; photos    |
| `sprout`  | Small sprout rising from a soft mound       | Weight log and progress empty |
| `leaves`  | Two leaves leaning together (quiet company) | Community empty feed          |
| `sunrise` | Gentle sun over soft hills                  | Today "finish setup" state    |
| `moon`    | Soft crescent with small petals             | Cycle empty history           |

Art rules (checked in review): calm, organic, inclusive, and non-body-focused —
no figures, bodies, scales, numbers, or before/after framing. Every
illustration is decorative (hidden from screen readers; the adjacent text
carries meaning) and its soft entrance is skipped under reduce-motion.

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
