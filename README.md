# 78 UI Kit

**1978's own vanilla UI component kit — one source of truth.** No framework, no build step, just
HTML / CSS / JS you drop in. **Re-theme the whole thing — components *and* your libraries — by editing
~15 lines.** MIT — a 1978.io give-away and the shared component layer for every 1978 product.

> 🌱 **Status: briefs 1–4 built, 2026-08-19** — tokens + theming (`_78.theme`), the four primitives, the
> three library theme adapters (Tabulator, FullCalendar, Chart.js), notifications (modal / toast / inline
> alert) + tabs + table, and the KPI card + no-library data-viz primitives (`_78.viz`) — each proved
> light+dark in `demo/`. The `_78` helpers and the theme generator are next; the app shell/nav needs a
> design session first.
> Decisions live in `JamesHQ\projects\1978-ui-kit\notes.md` (the
> strategy/decision log); this README is the **buildable spec**. Structure reference = the AlchemyQM
> mockup; code is built fresh from James's own projects (Brashli / Lake House). Dogfooded on **78trade** first.

---

## 🔴 IP firewall (non-negotiable)

1. **The kit is James's IP — it NEVER lands in a Savvas repo.** The Quality Portal uses Bootstrap, by rule.
2. **AQM's palette does NOT ship.** The kit ships token *names* + the theming mechanism + components + a
   **neutral default palette**. AQM (and 78trade) keep their own colours as a ~15-line local override.
   *(This is the point, not a compromise: the flagship being "just a theme" of the kit proves the theming.)*
3. **Never copy code from the Savvas Quality Portal** (it's in an employer repo now). The same patterns
   exist in **Brashli** and the **Lake House Portal** — James's own. Build from those. *Share ideas, not code.*

## 🔴 Single source of truth (why this repo exists)

1. Canonical here; projects **import**, never fork. 2. New component → added **here first**. 3. Tokens are
the only theming mechanism. 4. The demo page is the living spec (light + dark, or it isn't real yet).

✅ **Canonical repo:** `github.com/1978io/78UIKit` — the earlier `1978-ui-kit` was **renamed** to this, so
it's one repo (old URL redirects). No sprawl.

## ⭐ The theming architecture — the selling point

James's core beef with Bootstrap: **you can't easily change the colours** (Sass bakes derived values in at
build time). The kit resolves colour at **runtime** via CSS custom properties → change ~15 variables and
everything follows, no build. Three things to preserve deliberately:

- **Structure separated from colour** — a theme is *only* colour. Non-colour tokens (`--radius`, `--font`,
  layout sizes) live in a plain `:root`; colours live in `:root[data-theme="dark|light"]`.
- **The `-lo` tint variants** (`--accent-lo`, `--success-lo`, …) — so people stop reaching for `opacity`
  and washing out text.
- **`color-scheme` set** per theme — native scrollbars/form controls follow.

## Tokens

Token **names** are canonical. The **default palette = the Hub's** (James's own dashboard, and deliberately
distinct from AQM so nothing links AQM to 1978). AQM's violet never ships; every project still overrides.

**Default core values (light / dark):** `--bg` `#f0f2f5`/`#0f1117` · `--bg2` `#ffffff`/`#1a1d27` · `--bg3`
`#f7f8fa`/`#22263a` · `--border` `#e2e6ed`/`#2a2f42` · `--text` `#1a1d23`/`#e2e6f0` · `--dim`
`#6b7280`/`#7b849a` · `--accent` `#0073ea`/`#4b9eff`.

**Derived + shipped (light / dark):** `--accent-lo` (alpha .10 light / .16 dark of the accent) ·
`--accent-lo-hover` · `--accent-hover` · `--accent-text` (text on an accent fill) · `--accent-glow` ·
semantic `--success` `#15803d`/`#4ade80` · `--warn` `#b45309`/`#fbbf24` · `--danger` `#dc2626`/`#f87171` ·
✅ `--info` `#0369a1`/`#38bdf8` — each with a `-lo` tint at the same alpha · `--row-hover` ·
`--row-border` · `--row-selected` · `--ring` (focus) · `--overlay` (modal backdrop) · `--shadow`/`--shadow-lg`.

**Non-colour (shared `:root`):** `--radius-sm`(6px) `--radius`(8px) `--radius-lg`(10px) `--radius-pill` ·
`--font`/`--font-mono` · `--fs-xs`…`--fs-xl` · `--lh` · `--control-h`(36px)/`--control-h-sm`(28px)/
`--icon-btn-size`(32px)/`--ring-w`(3px) · `--sidebar-w`(240px)/`--header-h`(56px)/`--content-max` ·
`--transition`/`--transition-slow` · ✅ spacing scale `--space-1`…`--space-6` = 4·8·12·16·24·32px.

## Theming mechanism (from the AQM mockup — adopt as-is, neutralised)

`:root[data-theme="dark"]` / `["light"]` colour blocks (each sets `color-scheme`). A **pre-paint inline
snippet** (no FOUC) reads `localStorage['_78-theme']` (`dark`/`light`/`system`), resolves `system` via
`matchMedia`, sets `data-theme` + `data-theme-pref` on `<html>`. Toggle **cycles Dark → Light → System**,
persists, and live-updates on OS change when pref = `system`. ⚠️ Kit-neutral storage key `_78-theme` (never
`aqm_theme`).

**Drop-in (the whole install):**

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

Any element with `._78-theme-toggle` is wired automatically on load (icon follows `data-theme-pref`).
API: `_78.theme.pref` · `_78.theme.current` · `.set('dark'|'light'|'system')` · `.cycle()` · `.mount(el)` ·
`.KEY` · `.PREPAINT` (the snippet as a string). Every change fires `document`'s **`_78:themechange`**
(`e.detail = {theme, pref}`) — that's the hook canvas libraries (Chart.js) redraw on.

## Naming

- **CSS classes: `_78-` prefix** (e.g. `._78-btn`, `._78-card`) — **confirmed**; matches the `_78` JS
  namespace, digit-safe.
- **JS: one global `_78`** (`_78.theme.cycle()`, `_78.notify()`, `_78.trace()`, `_78.sortAlpha()` …). Reads
  as a kit, one global, quietly carries the brand.

## ⭐⭐ Library theme adapters — the most valuable pieces

*The pitch: your tables and charts match your theme automatically, including when it switches.* Tables +
charts are ~90% of a dashboard and nobody ships this. **Adapters only for libraries James actually uses —
three at v1, not a plugin ecosystem.** Nothing is vendored; consumers bring their own library at their own version.

| Library | Licence | Adapter | Notes |
|---|---|---|---|
| **Tabulator** | MIT | ✅ **CSS** — `css/adapters/tabulator.css` | maps its classes → kit tokens (header→`--bg2`, hover→`--row-hover`, selected→`--row-selected`, pagination→`--accent`, …). Survives theme switch for free. Built against **6.x** (verified 6.5.2). James's favourite. |
| **FullCalendar** (core) | MIT | ✅ **CSS** — `css/adapters/fullcalendar.css` | v6 resolves everything through its own `--fc-*` variables, so the adapter is mostly a remap onto kit tokens. Built against **6.x core** (verified 6.1.21); a second block remaps **v7**'s `classic` palette, since v7 dropped `--fc-*`. ⚠️ Core only, no paid plugins. Boot Ranch runs v5 — different, upgrade is separate. |
| **Chart.js** | MIT | ✅ **JS** — `js/adapters/chartjs.js` | 🔴 canvas can't read CSS vars — `getComputedStyle()`s the tokens into `Chart.defaults`, and **`chart.update()`s every live instance on `_78:themechange`** (the bit everyone misses). Built against **4.x** (verified 4.5.1). |
| ~~ApexCharts~~ | dual-licensed | **DROPPED** | conditional licence — no place in an MIT kit. |
| **ECharts** | Apache 2.0 | 🔜 later | likely replaces Chart.js (huge chart coverage, real theme system); deferred for its learning curve. |

**Adapters are opt-in — deliberately NOT in `kit.css`.** Include only the ones you use, always *after* the
library itself (the adapter overrides it), and bring your own version of the library — nothing is vendored:

```html
<link rel="stylesheet" href="…/tabulator.min.css">
<link rel="stylesheet" href="/78UIKit/css/adapters/tabulator.css">

<script src="…/fullcalendar/index.global.min.js"></script>
<link rel="stylesheet" href="/78UIKit/css/adapters/fullcalendar.css">

<script src="…/chart.umd.js"></script>
<script src="/78UIKit/js/adapters/chartjs.js"></script>   <!-- after _78.js -->
```

The Chart.js adapter also exposes `_78.adapters.chartjs.palette(n)` (n series colours from the current
theme — accent first, then the semantic tokens), `.tokens()`, `.alpha(colour, a)` and `.apply()`. A dataset
that declares **no** colours is adopted and recoloured on every theme switch; a dataset that declares its
own `backgroundColor`/`borderColor` is never touched. **Proof page: `demo/adapters.html`** — table, calendar
and charts, all re-theming live off one toggle.

## Component inventory

Build order: **foundation → adapters → notifications/components → theme generator.** 🟢 foundation ·
🔵 follow-on · 🟣 advanced.

- **Foundation** 🟢 ✅ **built** — tokens+theming+toggle; buttons (`_78-btn` + `-primary/-ghost/-danger/
  -sm/-full`, `_78-icon-btn`); cards (`_78-card`, `_78-stat-card`); form controls (`_78-field` + focus
  ring); badges/pills (`_78-badge` variants, `_78-tag`, `_78-eyebrow`, `_78-score-pill`); utilities.
- **Notifications** 🔵 ✅ **built** — modal / toast / inline alert (see the rule below). Native `<dialog>`
  via `showModal()`, function API (`_78.modal.open/confirm/alert`, `_78.notify…`) — no order-dependent
  globals. `_78.modal.mount()`/`.show()` for a `<dialog>` you wrote yourself.
- **Dashboard/data** 🔵 ✅ **built** — the brief-1 `._78-stat-card` grown into a KPI card:
  `._78-stat-card__head/__icon/__row/__spark` + `._78-stat-delta` (direction arrow, coloured by sign,
  `._78-invert` where up is bad), laid out by `._78-kpi-grid` (auto-fit, 2–6 across). Status pills and the
  table style shipped earlier. 🔜 still to lift from AQM: the `heatmap` primitive.
- **Simple viz — CSS/SVG, no library** 🔵 ✅ **built** — `._78-sparkline` · `._78-progress` · `._78-bar-row`
  · `._78-donut`/`._78-gauge` · `._78-trend`, all in `css/components/viz.css` + `_78.viz`. Colour flows
  through two inherited vars (`--viz`/`--viz-lo`, defaulting to the accent), so a tone is one class —
  `._78-tone-success` and friends — and every shape re-themes with no redraw. Deeper charts stay Chart.js.
- **Shell + states** 🔵 — app shell (sidebar + main), empty state, loading state, filter bar. ⬜ **Nav is
  its own design session** (sidebar vs top-bar, mobile, active/nested/badges).
- **Tabs** 🔵 ✅ **built** — `._78-tabs` (+ `._78-tabs-segmented`), `_78.tabs` auto-mounts: roles,
  `aria-selected`, roving tabindex, ←/→/Home/End, a `_78:tabchange` event. **Toggle switch / checkbox** 🔵
  still pending — neither AQM nor the Hub had a real switch.
- **Table** 🔵 ✅ **built** — `._78-table` (+ `-compact`/`-striped`/`-sticky`, `._78-table-wrap` to scroll
  on narrow screens). The kit's own plain `<table>`; a data grid is still Tabulator + its adapter.

### Data-viz, declaratively

Everything in `_78.viz` auto-mounts from attributes on load (or call it directly — `_78.viz.sparkline(el,
data)`, `.progress(el, pct)`, `.bar(el, pct)`, `.donut(el, pct)`, `.trend(el, delta)`, `.mountAll(scope)`
after you inject markup):

```html
<div class="_78-stat-card__spark" data-values="18,22,19,27,31" data-tone="auto"></div>
<div class="_78-progress _78-tone-warn" data-pct="68">…</div>
<div class="_78-bar-row" data-pct="82">…</div>
<div class="_78-donut" data-pct="68" data-label="Margin used"></div>
<div class="_78-donut _78-gauge" data-pct="41" data-label="Risk score"></div>
<span class="_78-trend" data-delta="12.4"></span>
<span class="_78-trend" data-delta="3.1" data-invert="true"></span>  <!-- up is bad here -->
```

`data-tone="auto"` colours a sparkline by its own direction. Each primitive renders its value as text or
gets `role="img"` + an `aria-label`, and progress/bar tracks are real `role="progressbar"`s — **colour is
never the only signal**.

### ⭐ The notification rule (ship the rule, not just the widgets)

| | Use for | Behaviour | API |
|---|---|---|---|
| **Modal** | needs acknowledgement — errors, confirms | blocks; requires a click | `_78.modal.open({title, body, actions})` → `Promise<value\|null>` · `.confirm(msg)` → `Promise<boolean>` · `.alert(msg)` |
| **Toast** | informational — "Saved", "Copied" | auto-dismisses (4s, errors 6s; `duration: 0` = sticky); never blocks | `_78.notify(msg, {type, duration, title})` · `.success/.error/.warn/.info` |
| **Inline alert** | tied to a region — form errors, empty states | sits in the layout; persists | `._78-alert` (+ `-success/-warn/-danger/-info/-accent`), `._78-empty` |

Modals are always `showModal()`, never `show()` — that is what buys the top layer, the `::backdrop`, the
focus trap and Escape. Body text goes in with `textContent`; pass `html: true` when you mean markup.
**Demo: `demo/components.html`.**

## JS helpers (the `_78` lib)

**Rule: a helper earns a place only if it encodes a DECISION, not just syntax.** Test: (1) modern JS does
it well? don't add. (2) a library we load does it? don't add. (3) hides an easy-to-get-wrong decision? add.
⚠️ Re-audit yearly (12 of 15 old helpers had rotted). First two confirmed, already debugged:
- **`_78.sortAlpha(arr, key)`** — non-mutating (`toSorted`), `localeCompare` accent-aware, `?? ""` null-safe.
- **`_78.duration(seconds)`** — `h:mm:ss`/`mm:ss` **with** hour handling (the original bug).

Harvest more from **Brashli / Lake House** `helpers.js` (never the Savvas portal). Distribution: each little
tool also gets its own public repo (`1978io/trace`, `1978io/scry`) shown on `bits.1978.io`; the standalone
repo is canonical, `_78` includes it.

## Structure

```
css/  kit.css            ✅ the one stylesheet a project links (@imports everything below)
      tokens.css        ✅ light + dark colour blocks + shared non-colour tokens
      reset.css         ✅ minimal reset, themed scrollbars, focus ring
      components/       ✅ buttons · cards (+ KPI) · forms · badges · viz · table · tabs · modal ·
                           toast · alert · theme-toggle · utilities
      adapters/         ✅ tabulator.css · fullcalendar.css — opt-in, never in kit.css
js/   _78.js            ✅ _78.theme · _78.modal · _78.notify · _78.tabs · _78.viz (helpers pending)
      adapters/         ✅ chartjs.js — _78.adapters.chartjs
demo/ index.html        ✅ kitchen-sink (tokens + the four primitives), light+dark
      components.html   ✅ KPIs + data-viz · notifications (modal/toast/alert) · tabs · table
      adapters.html     ✅ live Tabulator + FullCalendar + Chart.js, all re-theming off one toggle
docs/                   🔜 per-component notes as they stabilise
```

## 🔮 Flagship roadmap — the theme generator + self-theming docs

A colour utility on the kit's site: input 1–3 colours → generate the full token set for **light AND dark**,
then **apply it to the docs site itself** so a visitor sees every component *in their own brand* live
(localStorage + pre-paint, shareable `?theme=` URL). The three things that make it good: derive in **OKLCH**
(perceptually uniform), **WCAG-AA contrast-check** every pair live, and **dark ≠ inverted light**. This is
the killer demo — "re-theme by editing fifteen lines" proven by a docs site that re-themes itself. Detail in
the notes.

---

*Source of truth. Deep reasoning + licensing analysis live in `JamesHQ\projects\1978-ui-kit\notes.md`.*
