# Panchang PWA - Light Modern Minimalist Redesign

**Date:** 2026-09-19
**Status:** Approved design, pending spec review
**Product:** Panchang Astrochitra - daily Vedic panchang PWA (React + Vite, mobile-first)

## 1. Goal

Totally revamp the app's visual design and page structure from the current
"classical parchment + olive/gold" theme to a **light modern minimalist**
contemporary-Indian look. One hard constraint: the homepage sun/moon banner
(`SkyScene`) must keep its existing time-of-day behavior unchanged.

## 2. Constraints & preserved behavior

- **SkyScene / dayPhase untouched.** The time-driven sun/moon hero animation,
  sky gradients, star twinkle, and moon phase logic are preserved exactly.
  Only the hero *frame* and *typography around it* are refined.
- All data APIs (`getPanchang`, `generateKundli`, transits, storage, i18n)
  are unchanged.
- Page-switching shell (state-based nav in `App.tsx`) is kept; no router
  migration.
- App remains multilingual (EN / HI / MR). Fonts must cover Devanagari.
- Motion stays light (`MOTION_INTENSITY 5`): existing page transitions, nav
  pill spring, splash fade. Honors `prefers-reduced-motion`.

## 3. Design direction

- **Tone:** light modern minimalist, calm, contemporary-Indian.
- **Dials:** `DESIGN_VARIANCE 5` (clean offset grids, no chaos),
  `MOTION_INTENSITY 5` (fluid CSS + framer, hero already animates),
  `VISUAL_DENSITY 4` (comfortable spacing, airy).

### 3.1 Typography (self-hosted, offline-first)

Google Fonts `<link>` in `index.html` is removed; woff2 files are downloaded
to `public/fonts/` and declared with `@font-face` + `font-display: swap`.
This makes all three languages render offline (PWA + service worker).

- `--font-deco` (display): **Bricolage Grotesque** 500/600/700, fallback
  `Anek Devanagari` (Devanagari glyphs).
- `--font-body`: **Anek Devanagari** 300-700 (Latin + Devanagari + Marathi).

Downloads (Google Fonts CSS API v2, woff2):
- `Bricolage Grotesque` weights 400, 500, 600, 700 (Latin).
- `Anek Devanagari` variable `100..800` (Latin + Devanagari).

### 3.2 Color tokens (remap existing CSS vars)

Existing variable names are kept and re-pointed so inline-styled
components update automatically with no JSX churn where possible.

| Variable | Old | New | Notes |
|---|---|---|---|
| `--bg` | `#f5e6c8` | `#f6f2ea` | warm paper page bg |
| `--bg-card` | `#fcf3e0` | `#ffffff` | card surface |
| `--bg-nav` | `#3d2e0a` | `#ffffff` | nav / header surface |
| `--olive` | `#654e12` | `#8e2a1c` | maroon (primary text accent) |
| `--gold` | `#c9a227` | `#c2410c` | deep saffron (fills, icons, AA on white) |
| `--gold-light` | `#e8d48b` | `#f7c9a0` | peach tint (chips, active fills) |
| `--text` | `#2c1f04` | `#241d14` | warm near-black |
| `--text-secondary` | `#7a6530` | `#6b6253` | secondary text |
| `--text-muted` | `#9e8b5a` | `#a09886` | muted text |
| `--border` | `#d4bf8a` | `#e7e0d3` | hairline borders |
| `--card-grad` | brown gradient | `#ffffff` | cards become flat light |
| `--card-text` | `#fff6e6` | `#241d14` | text on card |
| `--card-text-2` | `rgba(255,246,230,.78)` | `#6b6253` | secondary on card |
| `--card-text-3` | `rgba(255,246,230,.55)` | `#a09886` | muted on card |
| `--card-line` | `rgba(255,246,230,.16)` | `#ede6d8` | in-card hairlines |
| `--card-gold` | `#ffd98a` | `#8e2a1c` | card heading emphasis |
| `--danger` / `--success` | keep | `#b33a3a` / `#3a7b3a` | unchanged |

Font stacks:
- `--font-body: 'Anek Devanagari', system-ui, -apple-system, sans-serif`
- `--font-deco: 'Bricolage Grotesque', 'Anek Devanagari', sans-serif`

Primary CTA: maroon fill (`#8e2a1c`) + white text (AA 7:1). Secondary:
hairline maroon outline.

### 3.3 Shape system

One corner-radius scale per page context: cards 20px, buttons/pills 999px,
inputs 12px, icon chips 14px. Consistent throughout.

## 4. Shell (`App.tsx` + `global.css`)

- **Splash:** paper bg, app icon, Bricolage brand in maroon.
- **Header (non-home pages):** paper bg, hairline bottom, hamburger + brand
  in maroon Bricolage; height stays 56px.
- **LocationBar:** subtle paper row, hairline borders, saffron location icon.
- **Offline badge:** peach tint + dark maroon text.
- **Bottom nav:** paper bg, 1px top hairline, 5 items. Active = deep-saffron
  icon label + soft peach pill (`layoutId` spring kept). Decorative `::before`
  dot on active item removed (AI tell).
- **Drawer:** maroon header bar + cream brand, white body, hairline dividers,
  saffron item icons, peach toggle track.
- **Page transitions:** framer `opacity/y` kept; wrap app in
  `<MotionConfig reducedMotion="user">` for reduced-motion parity.
- **Install banner (`PWAInstallBanner.tsx`):** white/paper surface, maroon
  text + maroon Install button.

## 5. Home page (`HomePage.tsx`)

- **Hero:** keep `SkyScene` and all sky CSS exactly as-is. Container keeps
  time-aware sky; refine to rounded bottom corners (36px), keep glass menu
  button, logo, glass chips (location/date), Bricolage title + body subtitle.
- Drop `MdAutoAwesome` from Today label (AI tell) → `MdWbSunny`/date icon.
- **Today card:** white card, hairline, 2x2 brief (Tithi, Nakshatra,
  Sunrise, Sunset), labels muted / values warm-black, saffron chevron.
  Shimmer skeleton kept (rebuilt for light cards).
- **Features:** 2x2 white tiles + 1 full-width Kundli tile. Saffron icon
  chip on each, maroon headings, muted one-line descriptions. Consistent
  peach-tint backgrounds across all tiles (single accent family).

## 6. Inner pages

All share the light card language: white `.card`, 20px radius, hairline
border, Bricolage maroon card titles (sentence case), label-above-value
fields, `border-bottom` hairlines between rows.

- **Panchang:** date-nav chevrons restyled (white pills, saffron hover).
  Sun events card (2x2: sunrise/sunset/moonrise/moonset), Panchang fields
  grid, Rashi & Lagna group, festival/special-yoga chips.
- **Muhurta:** same card list; rows = name + time + rating chip
  (restyled good/bad/neutral: sage/rose/muted tints).
- **Gochar:** LIVE badge becomes a saffron pill (white text on deep
  saffron). RasiChart palette retuned. Planet rows + transit rows restyle.
- **Kundli:** `k-tabs` → paper surface, hairline, active = peach fill +
  maroon text. Form inputs white/12px radius. `KundliView` cards light.
  Mahadasha/Antardasha grid rows keep hairline separators.

## 7. Chart palette retune

Hardcoded hex in chart components changes so the charts sit on the light
cards (replaces parchment-gold on cream):

- `KundliChart.tsx`: stroke/accents → deep saffron + maroon; fills white /
  warm paper; selected-house fill saffron alpha; muted text warm grey.
- `RasiChart.tsx`: same treatment (verify its own constants during impl).

## 8. Files touched

| File | Change |
|---|---|
| `index.html` | remove Google Fonts links; `theme-color` → `#c2410c` |
| `public/fonts/*.woff2` | new self-hosted fonts |
| `src/styles/global.css` | token map + full style revamp |
| `src/App.tsx` | MotionConfig wrapper + class-driven restyle (minimal JSX) |
| `src/pages/*.tsx` (5) | minor inline-style fixes where new tokens need it |
| `src/components/KundliChart.tsx` | palette constants |
| `src/components/RasiChart.tsx` | palette constants |
| `src/components/PWAInstallBanner.tsx` | surface/text colors |

Also retune `.dt-picker` / `.dt-ampm` / splash / toggle / chips / buttons /
inputs in `global.css` so every inline-styled child resolves against the new
tokens.

## 9. Non-goals

- No data/logic changes; no route migration; no new features.
- No dark-mode variant is introduced (light-only per approved direction;
  the time-aware hero is the deliberate single dark moment).
- i18n strings unchanged.

## 10. Verification

- `npm run build` (runs `tsc -b && vite build`) must pass.
- `npm run dev` spot-check: home hero, drawer, all 4 sub-pages, Kundli
  generate flow, font rendering in EN/HI/MR.
- Confirm service-worker precache includes new fonts (PWA build).