# 78 UI Kit

**A vanilla UI component kit you can re-theme in ~15 lines.** No framework, no build step — just
HTML / CSS / JS you drop in. Change a handful of CSS variables and the whole thing recolors:
the components *and* your third-party tables and charts. MIT.

📖 **Docs, live component gallery, and the theme generator: [78uikit.com](https://78uikit.com)**

---

## Why

Most component libraries make color the hard thing to change — Sass bakes derived values in at build
time, so "just change the accent" turns into a rebuild. 78 UI Kit resolves color at **runtime** with CSS
custom properties: edit ~15 variables and everything follows, no build, no tooling. It also themes the
libraries you already use — Tabulator, FullCalendar, Chart.js — so your tables and charts match your theme
automatically, *including when the theme switches.*

Three choices it makes deliberately:

- **Structure is separate from color.** A theme is *only* color. Non-color tokens (`--radius`, `--font`,
  layout sizes) live in a plain `:root`; colors live in `:root[data-theme="dark"]` / `["light"]`.
- **`-lo` tint variants** (`--accent-lo`, `--success-lo`, …) so you stop reaching for `opacity` and washing
  out your text.
- **`color-scheme` is set per theme**, so native scrollbars and form controls follow along.

## Quick start

The whole install is one stylesheet, one script, and an optional inline snippet that sets the theme before
first paint (no flash of the wrong theme):

```html
<head>
  <!-- 1. pre-paint theme — FIRST, before any stylesheet -->
  <script>
  (function(){var p=localStorage.getItem('_78-theme')||'system';
  var t=p==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):p;
  var r=document.documentElement;r.dataset.theme=t;r.dataset.themePref=p;})();
  </script>

  <!-- 2. the kit -->
  <link rel="stylesheet" href="/78UIKit/css/kit.css">
  <script defer src="/78UIKit/js/_78.js"></script>

  <!-- 3. your ~15-line re-theme, AFTER the kit -->
  <style>:root[data-theme="dark"]{--accent:#7c5cff}</style>
</head>
```

That's it. Use the classes, and let the theme generator on [78uikit.com](https://78uikit.com) write your
override block for you.

## Theming

### Tokens

Token **names** are the contract; the shipped values are a neutral default palette you're expected to
override.

**Core (light / dark):** `--bg` · `--bg2` · `--bg3` · `--border` · `--text` · `--dim` · `--accent`.

**Derived + shipped:** `--accent-lo` (a low-alpha tint of the accent) · `--accent-lo-hover` ·
`--accent-hover` · `--accent-text` (text on an accent fill) · `--accent-glow` · semantic `--success` /
`--warn` / `--danger` / `--info` — each with a `-lo` tint · `--row-hover` · `--row-border` ·
`--row-selected` · `--ring` (focus) · `--overlay` (modal backdrop) · `--shadow` / `--shadow-lg`.

**Non-color (shared `:root`):** `--radius-sm/-/-lg/-pill` · `--font` / `--font-mono` · `--fs-xs`…`--fs-xl` ·
`--lh` · `--control-h` / `--control-h-sm` / `--icon-btn-size` / `--ring-w` · `--sidebar-w` / `--header-h` /
`--content-max` · `--transition` / `--transition-slow` · a `--space-1`…`--space-6` scale (4·8·12·16·24·32px).

### The mechanism

`:root[data-theme="dark"]` / `["light"]` color blocks (each sets `color-scheme`). The pre-paint snippet reads
`localStorage['_78-theme']` (`dark` / `light` / `system`), resolves `system` via `matchMedia`, and sets
`data-theme` + `data-theme-pref` on `<html>` before any stylesheet loads.

Any element with class `._78-theme-toggle` is wired automatically on load and cycles **Dark → Light →
System** (its icon follows the current preference). API:

```js
_78.theme.pref            // 'dark' | 'light' | 'system'
_78.theme.current         // resolved 'dark' | 'light'
_78.theme.set('dark')     // or 'light' | 'system'
_78.theme.cycle()
_78.theme.mount(el)       // wire your own toggle element
_78.theme.PREPAINT        // the pre-paint snippet, as a string
```

Every change fires a `_78:themechange` event on `document` (`e.detail = { theme, pref }`) — the hook
canvas-based libraries redraw on.

## Library adapters

*Your tables and charts match your theme automatically, including when it switches.* Tables and charts are
most of a dashboard, and almost nothing ships this. Adapters are provided for three widely-used MIT
libraries. **Nothing is vendored — you bring your own copy of the library at your own version.**

| Library | Adapter | Notes |
|---|---|---|
| **Tabulator** | `css/adapters/tabulator.css` | Maps its classes onto kit tokens (header → `--bg2`, hover → `--row-hover`, selection → `--row-selected`, pagination → `--accent`). Re-themes for free. Built against 6.x (verified 6.5.2). |
| **FullCalendar** (core) | `css/adapters/fullcalendar.css` | Remaps FullCalendar's own variables onto kit tokens. Core only, no paid plugins. Primary target **v7**; a legacy block covers v6.x. |
| **Chart.js** | `js/adapters/chartjs.js` | Canvas can't read CSS variables, so it reads the tokens into `Chart.defaults` and calls `chart.update()` on every live chart when the theme switches — the part everyone misses. Built against 4.x (verified 4.5.1). |

Adapters are **opt-in** — deliberately not part of `kit.css`. Include only the ones you use, and always
*after* the library itself:

```html
<link rel="stylesheet" href="…/tabulator.min.css">
<link rel="stylesheet" href="/78UIKit/css/adapters/tabulator.css">

<script src="…/fullcalendar/index.global.min.js"></script>
<link rel="stylesheet" href="/78UIKit/css/adapters/fullcalendar.css">

<script src="…/chart.umd.js"></script>
<script src="/78UIKit/js/adapters/chartjs.js"></script>   <!-- after _78.js -->
```

The Chart.js adapter also exposes `_78.adapters.chartjs.palette(n)` (n series colors from the current
theme — accent first, then the semantic tokens), `.tokens()`, `.alpha(color, a)` and `.apply()`. A dataset
that declares **no** colors is adopted and recolored on every theme switch; a dataset that declares its own
`backgroundColor` / `borderColor` is never touched.

## Components

- **Buttons** — `._78-btn` (+ `-primary` / `-ghost` / `-danger` / `-sm` / `-full`), `._78-icon-btn`.
- **Cards** — `._78-card`, `._78-stat-card` (a KPI card: `__head` / `__icon` / `__row` / `__spark` +
  `._78-stat-delta` colored by sign, `._78-invert` where up is bad), laid out by `._78-kpi-grid`
  (auto-fit, 2–6 across).
- **Forms** — `._78-field` with a consistent focus ring.
- **Badges / pills** — `._78-badge` variants, `._78-tag`, `._78-eyebrow`, `._78-score-pill`.
- **Table** — `._78-table` (+ `-compact` / `-striped` / `-sticky`, `._78-table-wrap` to scroll on narrow
  screens). For a full data grid, use Tabulator + its adapter.
- **Tabs** — `._78-tabs` (+ `._78-tabs-segmented`). `_78.tabs` auto-mounts with roles, `aria-selected`,
  roving tabindex, arrow / Home / End keys, and a `_78:tabchange` event.
- **Data-viz, no library** — `._78-sparkline` · `._78-progress` · `._78-bar-row` · `._78-donut` /
  `._78-gauge` · `._78-trend`, driven by `_78.viz`. Color flows through two inherited variables
  (`--viz` / `--viz-lo`, defaulting to the accent), so a tone is one class (`._78-tone-success` …) and every
  shape re-themes with no redraw.

Everything in `_78.viz` auto-mounts from attributes on load, or call it directly:

```html
<div class="_78-stat-card__spark" data-values="18,22,19,27,31" data-tone="auto"></div>
<div class="_78-progress _78-tone-warn" data-pct="68"></div>
<div class="_78-donut" data-pct="68" data-label="Margin used"></div>
<span class="_78-trend" data-delta="12.4"></span>
```

Each primitive renders its value as text or gets `role="img"` + an `aria-label`, and progress / bar tracks
are real `role="progressbar"`s — **color is never the only signal.**

### Notifications — the rule, not just the widgets

| | Use for | Behavior | API |
|---|---|---|---|
| **Modal** | needs acknowledgement — errors, confirms | blocks; requires a click | `_78.modal.open({title, body, actions})` → `Promise<value\|null>` · `.confirm(msg)` → `Promise<boolean>` · `.alert(msg)` |
| **Toast** | informational — "Saved", "Copied" | auto-dismisses (never blocks) | `_78.notify(msg, {type, duration, title})` · `.success` / `.error` / `.warn` / `.info` |
| **Inline alert** | tied to a region — form errors, empty states | sits in the layout; persists | `._78-alert` (+ `-success` / `-warn` / `-danger` / `-info` / `-accent`), `._78-empty` |

Modals use the native `<dialog>` `showModal()` (top layer, `::backdrop`, focus trap, Escape). Body text goes
in with `textContent`; pass `html: true` when you mean markup.

## Naming

- **CSS classes** use the `_78-` prefix (`._78-btn`, `._78-card`) — digit-safe and matches the JS namespace.
- **JS** is one global, `_78` (`_78.theme.cycle()`, `_78.notify()`, `_78.tabs`, `_78.viz`, `_78.sortAlpha`).

## The theme generator

The tool that writes your ~15-line override for you — on [78uikit.com](https://78uikit.com). Pick an accent
(plus a neutral tint, a radius and a density) and it derives the **whole token set for light and dark**,
previews it live on real components, contrast-checks it, and hands back paste-ready CSS.

- **OKLCH throughout** — perceptually uniform, so ramps don't go muddy the way HSL does. No library, no build.
- **Dark ≠ inverted light** — each theme has its own lightness / chroma targets.
- **WCAG AA, live** — every pair that matters is checked, and lightness is nudged automatically where a pair
  would fail.
- **Semantics stay conventional** — green / amber / red / blue never follow the accent (a "themed red that
  isn't red" is a usability trap).
- **Apply · persist · share** — apply a theme to the page, save it, and share it as a `?theme=…` URL.

## Structure

```
css/  kit.css            the one stylesheet a project links (@imports everything below)
      tokens.css         light + dark color blocks + shared non-color tokens
      reset.css          minimal reset, themed scrollbars, focus ring
      components/        buttons · cards · forms · badges · viz · table · tabs · modal · toast · alert · …
      adapters/          tabulator.css · fullcalendar.css — opt-in, never in kit.css
js/   _78.js             _78.theme · _78.modal · _78.notify · _78.tabs · _78.viz · helpers
      adapters/          chartjs.js — _78.adapters.chartjs
demo/                    living examples, every page in light + dark
```

## Status

Active development (v0.x). Foundation, the three library adapters, notifications / tabs / table, KPI +
data-viz primitives, and the theme generator are built. The app shell / nav and a few helpers are next.

## License

MIT © 2026 James Robinson. Use it in anything, including commercial work.
