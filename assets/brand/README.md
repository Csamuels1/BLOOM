# BLOOM brand assets (issue #6)

This folder holds the owner-created, owner-approved original brand assets. The
loading **pipeline** is already wired; this manifest lists exactly what to drop
in and how to activate each piece. Nothing here is auto-generated — assets are
original art approved by the owner (a hard `v1.0.0` release gate).

Palette and type references: [../../docs/BRAND_AND_COPY.md](../../docs/BRAND_AND_COPY.md)
and `src/design/tokens.ts`. Background is Ivory `#FDF8F3` (never pure white).

## 1. Fonts → `assets/fonts/`

Supply TTF/OTF files (original license cleared for app embedding):

| File                    | Family / weight        | Used by              |
| ----------------------- | ---------------------- | -------------------- |
| `Fraunces-SemiBold.ttf` | Fraunces 600 (display) | Display, PageTitle   |
| `Manrope-Regular.ttf`   | Manrope 400 (body)     | Body                 |
| `Manrope-Medium.ttf`    | Manrope 500 (caption)  | Caption              |
| `Manrope-SemiBold.ttf`  | Manrope 600 (section)  | SectionTitle, Button |

**Activate:** uncomment the matching entries in `src/design/fonts.ts`, then set
`fontFamily` per variant in `src/components/Typography.tsx` using the
`typography[variant].family` token. `_layout.tsx` already holds the first frame
until fonts load.

## 2. App icon → `assets/images/icon.png`

- 1024×1024 PNG, **opaque** (no alpha), square, no rounded corners (stores round it).
- Original geometric BLOOM mark on an Ivory field.

## 3. Android adaptive icon → `assets/images/adaptive-icon.png`

- 1024×1024 PNG foreground with transparent padding (safe zone ~66% center).
- Background color set to Ivory in config (below).

## 4. Splash → `assets/images/splash.png`

- Centered mark, transparent background, ~1242×2688 or a 1:1 mark that scales.
- Splash background color is Ivory (set in config below).

## 5. Favicon (web) → `assets/images/favicon.png`

- 48×48 (or 64×64) PNG.

## 6. Wordmark & illustrations → `assets/brand/`

- `wordmark.svg` (or PNG @1x/@2x/@3x) — the "BLOOM" wordmark.
- Onboarding/illustration art as added per later phases.

## Activate the image assets in `app.json`

Add under `expo` once the files above exist (kept out of config until then so
`expo export`/`expo-doctor` stay green):

In SDK 57 the splash screen is configured through the `expo-splash-screen`
config plugin (there is no root `splash` key). Install it with
`npx expo install expo-splash-screen`, then:

```jsonc
"icon": "./assets/images/icon.png",
"backgroundColor": "#FDF8F3",
"ios": { "supportsTablet": true },
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/images/adaptive-icon.png",
    "backgroundColor": "#FDF8F3"
  }
},
"web": { "bundler": "metro", "output": "static", "favicon": "./assets/images/favicon.png" },
"plugins": [
  "expo-router",
  "expo-status-bar",
  "expo-font",
  ["expo-splash-screen", { "image": "./assets/images/splash.png", "resizeMode": "contain", "backgroundColor": "#FDF8F3" }]
]
```

## Verification (issue #6 acceptance)

- Dimensions/transparency/format per the tables above.
- Contrast check for the mark on Ivory and on dark surfaces.
- Platform preview (icon, splash, adaptive icon) on Android/web now; iOS at
  Phase 13 (#58, ADR-0006).
- **Owner approval recorded** in the PR and BUILD_STATUS.md.
