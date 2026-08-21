# 78 UI Kit

[![Release](https://img.shields.io/github/v/release/1978io/78UIKit)](https://github.com/1978io/78UIKit/releases)
[![jsDelivr hits](https://img.shields.io/jsdelivr/gh/hm/1978io/78UIKit)](https://www.jsdelivr.com/package/gh/1978io/78UIKit)
[![License: MIT](https://img.shields.io/github/license/1978io/78UIKit)](LICENSE)

**Finally, a theme-forward UI kit.** No framework, no build step — just HTML / CSS / JS you drop in.
Re-theme everything — the components *and* your third-party tables and charts — from one CSS file, or live
in code, in light and dark. MIT.

📖 **Docs, live component gallery, and the theme generator: [78uikit.com](https://78uikit.com)**

---

## Why

Most component libraries make color the hard thing to change — Sass bakes derived values in at build
time, so "just change the accent" turns into a rebuild. 78 UI Kit resolves color at **runtime** with CSS
custom properties: recolor in a stylesheet loaded after the kit — or let the generator write the whole theme — no build, no tooling. It also themes the
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

  <!-- 2. the kit — via CDN (jsDelivr serves it straight from GitHub) -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/1978io/78UIKit@v0.2.0/css/kit.css">
  <script defer src="https://cdn.jsdelivr.net/gh/1978io/78UIKit@v0.2.0/js/_78.js"></script>

  <!-- 3. your own theme overrides go here, AFTER the kit -->
  <style>:root[data-theme="dark"]{--accent:#7c5cff}</style>
</head>
```

That's it. Use the classes, and let the theme generator on [78uikit.com](https://78uikit.com) write your
override block for you.

**CDN or self-host.** `@v0.2.0` pins a release; use `@main` for the latest (moves on every push), or download
the repo and serve the files yourself. jsDelivr also serves minified builds — swap in `kit.min.css` /
`_78.min.js`. The library adapters live on the same CDN under `/css/adapters/` and `/js/adapters/`.

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
`--lh` · `--control-h` / `--control-h-sm` / `--icon-btn-size` / `--ring-w` · `--sidebar-w` / `--rail-w` /
`--header-h` / `--content-max` · `--transition` / `--transition-slow` · a `--space-1`…`--space-6` scale (4·8·12·16·24·32px).

The space tokens are also the intended **escape hatch above the utility scale** — there is deliberately no
margin utility over 16px and there are no padding utilities. Past that, reach for the token directly
(`style="padding: var(--space-5)"`), not for a bigger utility set.

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

- **App shell** — `._78-topbar` + an optional `._78-sidebar` that collapses to an icon rail and turns
  into an off-canvas drawer on mobile, driven by `_78.shell`. See [The app shell](#the-app-shell) below.
- **Buttons** — `._78-btn` (+ `-primary` / `-ghost` / `-danger` / `-sm` / `-full`), `._78-icon-btn`.
- **Cards** — `._78-card`, `._78-stat-card` (a KPI card: `__head` / `__icon` / `__row` / `__spark` +
  `._78-stat-delta` colored by sign, `._78-invert` where up is bad), laid out by `._78-kpi-grid`
  (auto-fit, 2–6 across).
- **Forms** — `._78-field` with a consistent focus ring, plus `._78-switch`: a toggle switch built on a
  real `<input type="checkbox">` (keyboard, `:disabled` and label association come free), with a `-sm` size.
- **Badges / pills** — `._78-badge` variants, `._78-tag`, `._78-eyebrow`, `._78-score-pill`.
- **Segmented control** — `._78-seg`, a joined run of buttons where exactly one is active (a range or
  type toggle). It owns a *value*, not a panel: mounted by `_78.seg` as a `radiogroup` with roving
  tabindex, arrow / Home / End keys that step over disabled options, and a `_78:segchange` event.
- **Disclosure** — `._78-details`, a styled `<details>` / `<summary>` with the native marker replaced by a
  rotating chevron. No JS: the keyboard, screen-reader and find-in-page behavior is the browser's.
- **Figure row** — `._78-figure-row` / `._78-figure`: N related numbers read side by side, each a label, a
  value and a tone shown as a colored left edge (entry / target / stop, plan / actual / variance). One
  fact in parts — where a KPI grid is unrelated metrics.
- **Table** — `._78-table` (+ `-compact` / `-striped` / `-sticky`, `._78-table-wrap` to scroll on narrow
  screens). For a full data grid, use Tabulator + its adapter.
- **Dropdown menu** — `._78-menu-wrap` > trigger + `._78-menu` (`._78-menu-item`, `._78-menu-sep`).
  Auto-wired: click to open, outside-click / Escape / choosing an item to close, arrow-key navigation and
  the full `menu` / `menuitem` ARIA. Built for the account menu; reusable anywhere.
- **Tabs** — `._78-tabs` (+ `._78-tabs-segmented`). `_78.tabs` auto-mounts with roles, `aria-selected`,
  roving tabindex, arrow / Home / End keys, and a `_78:tabchange` event.
- **Data-viz, no library** — `._78-sparkline` · `._78-progress` · `._78-bar-row` · `._78-split-bar` (one
  whole in proportional, named segments) · `._78-donut` / `._78-gauge` · `._78-trend`, driven by `_78.viz`.
  Color flows through two inherited variables (`--viz` / `--viz-lo`, defaulting to the accent), so a tone is
  one class (`._78-tone-success` …) and every shape re-themes with no redraw.

Everything in `_78.viz` auto-mounts from attributes on load, or call it directly:

```html
<div class="_78-stat-card__spark" data-values="18,22,19,27,31" data-tone="auto" data-dot="true"></div>
<div class="_78-progress _78-tone-warn" data-pct="68"></div>
<div class="_78-donut" data-pct="68" data-label="Margin used"></div>
<div class="_78-split-bar">
  <span class="_78-split-seg _78-tone-danger" data-pct="35" data-label="Risk"></span>
  <span class="_78-split-seg _78-tone-success" data-pct="65" data-label="Reward"></span>
</div>
<span class="_78-trend" data-delta="12.4"></span>
```

Each primitive renders its value as text or gets `role="img"` + an `aria-label`, and progress / bar tracks
are real `role="progressbar"`s — **color is never the only signal.**

### The app shell

```html
<header class="_78-topbar">
  <button class="_78-nav-toggle" aria-label="Toggle navigation">☰</button>
  <a class="_78-topbar-brand" href="/">Your app</a>
  <span class="_78-topbar-spacer"></span>
  <div class="_78-topbar-actions"> … </div>
</header>

<aside class="_78-sidebar" aria-label="Primary">
  <nav class="_78-nav">
    <div class="_78-nav-heading">Overview</div>
    <a class="_78-nav-item _78-active" href="/">
      <span class="_78-nav-icon"><svg …></svg></span>
      <span class="_78-nav-label">Dashboard</span>
      <span class="_78-nav-badge">12</span>
    </a>
  </nav>
  <span class="_78-nav-spacer"></span>
  <button class="_78-nav-item _78-nav-collapse" aria-label="Collapse sidebar">…</button>
</aside>

<div class="_78-scrim"></div>
<main class="_78-app-main"><div class="_78-app-body"> … </div></main>
```

The topbar and sidebar are `position: fixed` and `._78-app-main` makes its own room for both, so **page
content never has to be re-wrapped**. One button does two jobs: `._78-nav-toggle` collapses the sidebar to
an icon rail on desktop and opens the drawer below 768px.

**Flat items only** — section headings group them, and there are no nested or expandable sub-menus. If a
section needs sub-pages, they belong in the page rather than in the nav.

State lives on `<html>` exactly like the theme, so it can be restored **before the first paint** —
`data-sidebar="full" | "rail"` (persisted in `localStorage['_78-sidebar']`) and `data-drawer="open"`.
Add the second pre-paint snippet next to the theme one on any page that **has** a sidebar; its presence is
also what reserves the space in the CSS, so a topbar-only page leaves it out.

```html
<script>
(function(){try{var s=localStorage.getItem('_78-sidebar');
document.documentElement.dataset.sidebar=s==='rail'?'rail':'full';}
catch(e){document.documentElement.dataset.sidebar='full';}})();
</script>
```

```js
_78.shell.rail            // true when collapsed   ·   .drawer  — mobile drawer open
_78.shell.toggleRail()    // .setRail(bool) — persists
_78.shell.openDrawer()    // .closeDrawer() · .toggleDrawer()
_78.shell.setActive(x)    // an element, an href ('#reports', '/orders.php'), or a selector
_78.shell.PREPAINT        // the snippet above, as a string
```

Width changes fire **`_78:railchange`** (`e.detail = { rail }`) and the drawer fires
`_78:drawerchange` — the hook for anything that has to re-measure, like a table or a canvas chart.
In the rail, labels are visually hidden rather than removed (they are still each item's accessible name)
and reappear as a hover/focus tooltip; `aria-expanded`, `aria-current="page"` and focus return on close
are handled for you.

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
- **JS** is one global, `_78` (`_78.theme.cycle()`, `_78.shell`, `_78.notify()`, `_78.tabs`, `_78.seg`,
  `_78.viz`).

## The theme generator

The tool that writes the whole theme for you — on [78uikit.com](https://78uikit.com). Pick an accent
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
      components/        shell · buttons · cards · forms · switch · seg · details · badges · viz ·
                         figure · split-bar · table · tabs · modal · toast · …
      adapters/          tabulator.css · fullcalendar.css — opt-in, never in kit.css
js/   _78.js             _78.theme · _78.shell · _78.modal · _78.notify · _78.tabs · _78.seg · _78.viz
      adapters/          chartjs.js — _78.adapters.chartjs
demo/                    living examples, every page in light + dark
```

## Status

Active development (v0.x). Foundation, the three library adapters, notifications / tabs / table, KPI +
data-viz primitives, the theme generator, the app shell, and the v0.2.0 control and figure set (switch,
segmented control, disclosure, figure row, split bar) are built. A few helpers are next.

## License

MIT © 2026 James Robinson. Use it in anything, including commercial work.
