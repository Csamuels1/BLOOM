# BLOOM Design System

The design system provides accessible, themed primitives for every later screen.
It implements the approved values in [BRAND_AND_COPY.md](BRAND_AND_COPY.md).
Issue [#5](https://github.com/Csamuels1/BLOOM/issues/5).

## Tokens

`src/design/tokens.ts` is the single source of truth for approved visual values.
`tailwind.config.js` mirrors the same values under the `bloom` color namespace
and custom radius/size scales; `tests/design/tokens.test.ts` guards the two
against drift. **Do not hardcode brand hex values in components — import tokens.**

- `colors` — the approved palette (terracotta, sage, ivory, plum, gold, blush,
  muted sage, amber). Amber is reserved for genuine safety notices; red is never
  used, and pure white is never a default background.
- `semanticColors` — intent aliases (background, textPrimary, primary, positive,
  surface, accent, softEmphasis, caution).
- `spacing` — 4px scale (`xs`…`xxl`).
- `radii` — button 12, card 16, pill full.
- `minTouchTarget` — 48dp, meeting platform accessibility guidance.
- `typography` — display 32, page title 24, section title 18, body 15,
  caption 13, each with line height and weight.
- `fontFamilies` — Fraunces (display) and Manrope (body). The loading pipeline
  is wired (`src/design/fonts.ts` + `_layout.tsx`); the approved font files are
  supplied by the owner in the brand-assets work (#6, see
  [../assets/brand/README.md](../assets/brand/README.md)). Until the files are
  added, the font map is empty, so components render the correct sizes/weights
  with system fonts and nothing breaks.

## Components (`src/components`)

| Component                                                            | Purpose                              | Accessibility                                                                                      |
| -------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `Typography` + `Display`/`PageTitle`/`SectionTitle`/`Body`/`Caption` | Themed text at the type scale        | Titles use the `header` role; dynamic type scales up to `maxFontSizeMultiplier`                    |
| `Button` (`primary`/`secondary`/`ghost`)                             | Primary actions                      | `button` role, `disabled`/`busy` state, 48dp target, press feedback suppressed under reduce-motion |
| `Pill`                                                               | Selectable choice/filter chip        | `button` role with `selected` state, 48dp target                                                   |
| `Card`                                                               | Soft grouping surface                | Decorative container; pass roles/labels as needed                                                  |
| `SafetyNotice`                                                       | Genuine safety messages only (amber) | `alert` role; title + message announced together                                                   |

## Accessibility foundations

- **Dynamic text:** all text scales with the OS setting, bounded by
  `maxFontSizeMultiplier` so layouts stay usable.
- **Screen readers:** headers, buttons, selected state, and alerts expose the
  correct roles and names.
- **Touch targets:** interactive components are at least `minTouchTarget` (48dp)
  with `hitSlop`.
- **Reduced motion:** `useReducedMotion()` drops non-essential motion; components
  must not introduce motion that ignores it.
- **Keyboard:** controls are built on `Pressable`, which is focusable/activatable
  on platforms with a keyboard (web).

## Voice and copy

Components never hardcode user-facing copy; callers pass voice-reviewed strings.
Voice-sensitive strings stay centralized (e.g. `src/content/`) and are covered by
the prohibited-language test (`tests/copy.test.ts`).

## Tests

- `tests/design/tokens.test.ts` — token integrity and Tailwind sync.
- `tests/components/*.test.tsx` — rendering, roles, states, and touch targets via
  `@testing-library/react-native`.

Device visual verification on iOS is deferred to Phase 13 per
[ADR-0006](adr/0006-defer-ios-qualification.md); Android/web rendering and the
all-platform export apply now.
