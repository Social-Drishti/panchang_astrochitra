# Panchang Light-Minimalist Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repaint the Panchang PWA from classical parchment to a light modern-minimalist contemporary-Indian look while preserving the time-driven sun/moon hero untouched.

**Architecture:** Remap existing CSS variables to a new saffron/maroon-on-warm-paper palette so inline-styled components follow automatically; self-host two Google fonts (Bricolage Grotesque display, Anek Devanagari body) for offline EN/हि/मर; rewrite the shared `global.css` surfaces (shell, cards, nav, forms); retune hardcoded chart palettes.

**Tech Stack:** React 19 + Vite 6 PWA, framer-motion 11, plain CSS (`src/styles/global.css`), TypeScript.

**Spec:** `docs/superpowers/specs/2026-09-19-panchang-design-redesign.md`

## Global Constraints

- **Preserve the hero exactly:** never modify `SkyScene.tsx`, `dayPhase.ts`, or the `.hero-scene`, `.hero-sky`, `.hero-body`, `.hero-stars`, `.hero-rays*`, `.hero-moon`, `.hero-sun` CSS. Only `.home-hero` frame/type/radius and `.hero-title/subtitle/chips` styling may change.
- **No route/file-structure migration;** state-based nav shell in `App.tsx` stays.
- **i18n strings unchanged** (EN/HI/MR). Fonts must cover Devanagari.
- **One accent family:** deep saffron `#c2410c` + maroon `#8e2a1c`; no hue drift per section.
- **Zero em-dashes (`—`) and en-dashes (`–`)** in any new copy or code strings; use hyphen.
- **Keep light-only** (no dark-mode variant). The hero sky is the single deliberate time-driven dark moment.
- Form/card control: radius scale = cards 20px, pills/buttons 999px, inputs 12px, icon chips 14px.
- Every task ends with a passing `npm run build` and a commit.

## Review Focus

1. **Devanagari after Google Fonts removal** - when `lang` is `hi`/`mr`, every visible string (title, labels, values) must render in Anek Devanagari. Pinned: Task 1 `@font-face` includes the `devanagari` subset with correct unicode-range; Task 6 confirms built `sw.js` precaches the woff2 files.
2. **Hero readability at all times of day** - title/subtitle/chips must stay legible over the day (warm gold-brown), dusk (orange), and night (indigo) skies. Pinned: Task 4 keeps cream text + glass chips on `.home-hero` unchanged in kind; verify `?phase=day|dusk|night` in dev.
3. **Offline font precache** - removing the Google `<link>` must not break offline rendering; woff2 files must be inside the service-worker precache. Pinned: Task 1 (files under `public/fonts/`, `globPatterns` already includes `woff2`) + Task 6 greps `dist/sw.js`.
4. **Long Sanskrit field values** - tithi/nakshatra/yoga names in 2-col grids must not wrap into broken two-line cells. Pinned: Task 3 `.field-value` keeps `min-width: 0` + `text-overflow: ellipsis`; Task 5 grid values use `white-space: nowrap`.
5. **Reduced motion** - users with `prefers-reduced-motion` must get static page transitions and a still hero (sun-spin/star twinkle already gated in CSS). Pinned: Task 2 wraps app in `<MotionConfig reducedMotion="user">`.

---

### Task 1: Self-host fonts + palette tokens + PWA manifest colors

**Files:**
- Create: `public/fonts/*.woff2` (from Google Fonts CSS API)
- Modify: `src/styles/global.css` (`:root` tokens + `@font-face` block)
- Modify: `index.html`
- Modify: `vite.config.ts`

**Interfaces:**
- Produces: `--font-deco: 'Bricolage Grotesque', 'Anek Devanagari', sans-serif`; `--font-body: 'Anek Devanagari', system-ui, sans-serif`; the full token map from the spec §3.2. Later tasks rely on these var names.

- [ ] **Step 1: Download fonts to `public/fonts/`**

Run in PowerShell (creates `public/fonts`, downloads woff2 for Bricolage Grotesque 400/500/600/700 latin + Anek Devanagari variable latin/devnagari):

```powershell
$ua='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
New-Item -ItemType Directory -Force -Path public/fonts | Out-Null
$bric = (Invoke-WebRequest -Uri 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700&display=swap' -UserAgent $ua -UseBasicParsing).Content
$anek = (Invoke-WebRequest -Uri 'https://fonts.googleapis.com/css2?family=Anek+Devanagari:wght@100..800&display=swap' -UserAgent $ua -UseBasicParsing).Content
```

From `$bric`, split on `};` into `@font-face` chunks; keep chunks containing `/* latin */`; read their `font-weight` and `url(...woff2)`; download each to `public/fonts/BG-<weight>.woff2`. From `$anek`, keep the `/* latin */` and `/* devanagari */` chunks and download to `AnekDevanagari-latin.woff2` and `AnekDevanagari-devanagari.woff2`. Record the exact `unicode-range` values from the response for Step 2.

```powershell
$out=@()
foreach($chunk in ($bric -split '}@font-face')){ if($chunk -match 'latin'){ if($chunk -match 'font-weight:\s*(\d+)'){$w=$Matches[1]}; if($chunk -match "url\((https://fonts\.gstatic\.com/[^)]+\.woff2)\)"){ $out += [pscustomobject]@{File="BG-$w.woff2";Url=$Matches[1]} } } }
foreach($f in $out){ Invoke-WebRequest -Uri $f.Url -OutFile "public/fonts/$($f.File)" -UserAgent $ua -UseBasicParsing }
```

(Repeat the analogous parse for `$anek` latin/devnagari chunks.)

- [ ] **Step 2: Add `@font-face` + token map to `global.css`**

Prepend to `src/styles/global.css`:

```css
/* Self-hosted fonts (offline-safe). Browsed subsets only. */
@font-face { font-family:'Bricolage Grotesque'; font-style:normal; font-weight:400; font-display:swap; src:url('/fonts/BG-400.woff2') format('woff2'); }
@font-face { font-family:'Bricolage Grotesque'; font-style:normal; font-weight:500; font-display:swap; src:url('/fonts/BG-500.woff2') format('woff2'); }
@font-face { font-family:'Bricolage Grotesque'; font-style:normal; font-weight:600; font-display:swap; src:url('/fonts/BG-600.woff2') format('woff2'); }
@font-face { font-family:'Bricolage Grotesque'; font-style:normal; font-weight:700; font-display:swap; src:url('/fonts/BG-700.woff2') format('woff2'); }

@font-face { font-family:'Anek Devanagari'; font-style:normal; font-weight:100 800; font-display:swap; src:url('/fonts/AnekDevanagari-latin.woff2') format('woff2'); unicode-range: <latin-range-from-step-1>; }
@font-face { font-family:'Anek Devanagari'; font-style:normal; font-weight:100 800; font-display:swap; src:url('/fonts/AnekDevanagari-devanagari.woff2') format('woff2'); unicode-range: <devnagari-range-from-step-1>; }
```

Replace the `:root { ... }` block with the token map from spec §3.2 (all values are exact; fonts as `--font-body` / `--font-deco` above).

- [ ] **Step 3: Update `index.html`** - delete the three font `<link>`/preconnect lines (19-21); set `<meta name="theme-color" content="#c2410c" />`.

- [ ] **Step 4: Update `vite.config.ts` manifest** - `background_color: '#f6f2ea'`, `theme_color: '#c2410c'`.

- [ ] **Step 5: Build + commit**

Run: `npm run build` - Expected: PASS, fonts emitted to `dist/fonts/`.
Commit: `git add public/fonts src/styles/global.css index.html vite.config.ts && git commit -m "feat: self-host fonts and repoint palette tokens"`

---

### Task 2: App shell surfaces (splash, header, location bar, drawer, bottom nav)

**Files:**
- Modify: `src/styles/global.css` (rewrite the shell section)
- Modify: `src/App.tsx` (wrap in `MotionConfig`, adjust an icon color)

**Interfaces:**
- Consumes: tokens from Task 1.
- Produces: light paper shell classes. Pages consume `.card`, `.scroll-area`, `.header`, `.drawer*`, `.toggle*`, `.bottom-nav`, `.nav-item`, `.offline-badge`.

- [ ] **Step 1: Rewrite shell CSS in `global.css`**

Replace `.splash-overlay/.splash-logo/.splash-text`, `.header`, `.drawer*`, `.toggle*`, `.offline-badge`, `.bottom-nav`, `.nav-item`, and the `.nav-active-pill`/`.nav-item.active::before` rules with the light design:
- Splash: `background: var(--bg)`; `.splash-text` Bricolage maroon.
- Header: `background: var(--bg-nav)`; bottom hairline `1px solid var(--border)`; `.header-brand` Bricolage `#8e2a1c`, remove heavy shadow. Hamburger icon inherits current color (maroon via `--gold-light` var map already handled by palette).
- Drawer: white body, maroon header bar (`#8e2a1c` bg, cream text), hairlines `var(--border)`, item icons saffron.
- Toggle: track `var(--text-muted)`, active `var(--gold)` (deep saffron).
- Bottom nav: `background:#fff`, top hairline `1px solid var(--border)`, labels muted; active item `color: var(--gold)`; `.nav-active-pill` background `rgba(194,65,12,0.10)` border `rgba(194,65,12,0.16)`; **delete** the `.nav-item.active::before` decorative dot.
- Offline badge: `background:#fde8d0; color:#8e2a1c`.
- Remove `#root` `background-image: url('/bg-body.webp')`; use flat `background-color: var(--bg)` (keep the file in `public/`; harmless).

- [ ] **Step 2: `App.tsx`** - wrap the returned tree with `<MotionConfig reducedMotion="user">` (import from `framer-motion`), closing before the component return. This gives reduced-motion parity without touching page transitions.

- [ ] **Step 3: Build + commit**

Run: `npm run build` - Expected: PASS.
Commit: `git add src/styles/global.css src/App.tsx && git commit -m "feat: light shell (nav, drawer, header, splash)"`

---

### Task 3: Shared primitives (cards, fields, chips, buttons, inputs, date nav)

**Files:**
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: tokens.
- Produces: `.card/.card-title`, `.field-grid/.field-item/.field-label/.field-value`, `.chip*`, `.btn*`, `input/select/textarea`, `.date-nav*`, `.scroll-area`, `.shimmer`, `.place-search*`. All inner pages + `KundliView`/`BirthDateTimeFields`/`PlaceSearch` rely on these.

- [ ] **Step 1: Rewrite primitives CSS**

- `.card`: `background: var(--bg-card)`; `border: 1px solid var(--border)`; `border-radius: 20px`; `box-shadow: 0 6px 20px rgba(36,29,20,0.06)`; `padding: 18px`; color `var(--card-text)`.
- `.card-title`: Bricolage, 16px, `font-weight:600`, `color: var(--card-gold)`, sentence case (drop uppercase+tracking).
- `.field-grid`: 2 cols, `gap: 14px`.
- `.field-label`: 11px, `color: var(--text-muted)` (sentence case, no uppercase).
- `.field-value`: 17px `font-weight:600`; add `min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap`.
- `.field-item`: keep column layout; add `min-width:0`.
- `.chip`: keep; ensure `.chip-good` `#d7e5d1/#3b5a41`, `.chip-bad` `#eed3ce/#6d3b34`, `.chip-neutral` `#efead9/#6b6253`, `.chip-gold` `background: var(--gold-light); color: var(--olive)`.
- `.btn-primary`: `background: var(--olive)` (flat maroon), `color:#fff`, radius 999px, shadow maroon-tinted.
- `.btn-outline`: maroon border + text, transparent.
- inputs/select/textarea: `background: var(--bg-card)`, `border: 1.5px solid var(--border)`, `border-radius: 12px`, focus ring `rgba(194,65,12,0.12)` + `border-color: var(--gold)`.
- `.date-nav-btn`: white pill, hairline border; hover border saffron; active fill `--gold-light` maroon text.
- `.shimmer`: light-grey gradient over white.
- `.place-search`: inputs on white, dropdown white with `--gold` border; `.ps-coords` `color: var(--text-muted)`.

- [ ] **Step 2: Build + commit**

Run: `npm run build` - Expected: PASS.
Commit: `git add src/styles/global.css && git commit -m "feat: light card, field, chip and form primitives"`

---

### Task 4: Home page (hero frame + Today brief + features)

**Files:**
- Modify: `src/styles/global.css` (home section)
- Modify: `src/pages/HomePage.tsx`

**Interfaces:**
- Consumes: `.card`, `.chip` primitives; `SkyScene` untouched.
- Produces: `.home-page/.home-hero/.hero-*/.today-card/.features/.feature-card/.fc-*` classes used only by HomePage.

- [ ] **Step 1: Home CSS** - change `.home-hero` padding/border-radius (bottom corners 36px) but keep sky layer CSS identical. Keep cream title text (`#ffe9b8`) + `text-shadow`, glass `.hero-menu-btn`/`.hero-chip`, `.hero-subtitle` cream. `.hero-title` inherits Bricolage via `var(--font-deco)` (already in token map).
- `.today-card`: white `var(--bg-card)`, hairline, radius 20px, maroon label row, saffron chevron; `.today-grid` 2x2 with inner hairline dividers; `.t-value` `#241d14`.
- `.features`: heading Bricolage maroon; `.feature-card` white with peach tint `background: linear-gradient(160deg,#fffdf8,#fdf3e8)`, radius 20px, hairline; `.fc-icon` chip `background: rgba(194,65,12,0.10)` saffron icon; headings maroon; `.fc-foot` saffron.
- Keep `.fc-wide` full-width tile.

- [ ] **Step 2: `HomePage.tsx`** - replace `MdAutoAwesome` in the Today-tab label with `MdWbSunny` (import swap). No other JSX logic changes.

- [ ] **Step 3: Build + eyeball phases**

Run: `npm run build`; then `npm run dev` and open `/?phase=day`, `?phase=dusk`, `?phase=night` to confirm hero readability (Review Focus 2).

- [ ] **Step 4: Commit**

`git add src/styles/global.css src/pages/HomePage.tsx && git commit -m "feat: light minimal home (hero frame, today brief, features)"`

---

### Task 5: Inner pages + charts + install banner

**Files:**
- Modify: `src/styles/global.css` (`k-tabs`, `.dt-*`, `.k-tab*`, `.k-dashboard` leftovers if any)
- Modify: `src/components/KundliChart.tsx` (palette constants)
- Modify: `src/components/RasiChart.tsx` (palette constants)
- Modify: `src/components/PWAInstallBanner.tsx`
- Minor inline-style pass: `src/pages/PanchangPage.tsx`, `src/pages/MuhurtaPage.tsx`, `src/pages/GocharPage.tsx`, `src/pages/KundliPage.tsx`, `src/components/KundliView.tsx`, `src/components/BirthDateTimeFields.tsx`

**Interfaces:**
- Consumes: primitives from Task 3.
- Produces: restyled pages keeping the exact same data shapes (no logic changes).

- [ ] **Step 1: Form/tab CSS** - `.k-tabs`: white surface, hairline border, radius 16px, no heavy shadow; `.k-tab.active`: `background: var(--gold-light)` (peach) + maroon text; `.k-tab-close` hairline. `.dt-row/.dt-num/.dt-sep` unchanged shapes; `.dt-ampm` and `.dt-picker` → `background: #fbf7f0`, border `var(--border)`; their icons saffron.

- [ ] **Step 2: Chart palette (KundliChart.tsx)** - replace constants:
`STROKE='#c2410c'`, `FILL='#ffffff'`, `FILL_LIGHT='#fbf7f0'`, `ACCENT='#8e2a1c'`, `TEXT_MUTED='#6b6253'`, `SEL_FILL='rgba(194,65,12,0.18)'`, `HOVER_FILL='rgba(194,65,12,0.08)'`.

- [ ] **Step 3: Chart palette (RasiChart.tsx)** - read the file's own color constants and set the same values (stroke/fill/muted/selection to the saffron-maroon family). Keep all geometry unchanged.

- [ ] **Step 4: PWAInstallBanner.tsx** - surface `rgba(255,255,255,0.96)` + hairline bottom, text `#241d14`, install button `background: var(--olive)` white text, close icon muted.

- [ ] **Step 5: Inline-style pass** - sweep the 6 files above for hardcoded brown/cream values and `var(--gold)`-as-small-text usages: swap small-text-on-white gold to `var(--olive)` where contrast demands it; keep saffron for icons/fills. Fix any `#ff8a80` delete icon to `var(--danger)`. Verify Review Focus 4 (nowrap on grid values).

- [ ] **Step 6: Build + commit**

Run: `npm run build` - Expected: PASS.
Commit: `git add -A && git commit -m "feat: light inner pages, charts and install banner"`

---

### Task 6: Final verification

- [ ] **Step 1: Build + inspect precache**

Run: `npm run build`; grep `dist/sw.js` for `.woff2` (fonts precached - Review Focus 3). Grep `dist/fonts/` for the 6 font files.

- [ ] **Step 2: Copy audit** - grep `src` for stray em/en dashes in newly added strings; confirm `SkyScene.tsx` and `dayPhase.ts` byte-identical to git HEAD (hero preserved - Global Constraint 1).

- [ ] **Step 3: Dev smoke checklist** - `npm run dev`: splash; home (day/night); drawer (lang hi/mr render, GPS toggle); Panchang date-nav; Muhurta chips; Gochar live chart; Kundli generate + saved flow.

- [ ] **Step 4: Commit** if any stragglers: `git add -A && git commit -m "fix: review nits"`.

---

## Self-Review Notes

- **Spec coverage:** §3.1 fonts → Task 1; §3.2 tokens → Task 1; §3.3 shapes → Tasks 3-5; §4 shell → Task 2; §5 home → Task 4; §6 inner pages → Tasks 3+5; §7 charts → Task 5; §10 build/verification → Task 6. No gaps.
- **Hero constraints:** no task touches `SkyScene.tsx`/`dayPhase.ts` or sky-layer CSS.
- **Palette consistency:** single accent (saffron `#c2410c`, maroon `#8e2a1c`) used through token map; no per-section hue drift.
- **Placeholders:** none; token values are exact from the spec.