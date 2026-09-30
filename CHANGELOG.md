# Changelog

All notable changes to 78 UI Kit are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and the project adheres to
[Semantic Versioning](https://semver.org/).

## [0.3.0] — 2026-09-30

The bug-and-tones pass: one tone vocabulary across every component, categorical colors for labels that
are not states, a second chart series color, the two long-promised JS helpers, and a batch of fixes found
in real use. Nothing was removed and no class or option was renamed; every old spelling still works.

### Added

- **One tone vocabulary.** The canonical tone names are the token names — `accent`, `success`, `warn`,
  `danger`, `info`, `dim` — and every component that takes a tone accepts all six: badge, tag, text (long
  `._78-text-*` and short `._78-*`), stat-card number, alert, viz tone, modal `tone` and toast `type`. New
  classes that fill the gaps include `._78-badge-danger` / `-success`, `._78-text-danger` / `-success` /
  `-info`, `._78-tag-*` in every tone, `._78-alert-dim` and the modal title tones. **`green` / `red` /
  `amber` / `yellow` are permanent aliases**, written as selector lists on the same rules.
- **`_78.tone(name)`** returns the canonical name for any tone or alias (`'red'` → `'danger'`), with
  `_78.tone.names`, `.aliases` and `.categories`. **`_78.notify.danger()`** is the tone-named spelling of
  `.error()`.
- **Categorical tones** for labels that are not states: `--cat-1` … `--cat-6` (each with a `-lo` tint,
  light and dark) and `._78-badge-cat-*`, `._78-tag-cat-*`, `._78-text-cat-*` / `._78-cat-*`,
  `._78-tone-cat-*`. Hues sit clear of success / warn / danger; each clears 4.5:1 as badge text on its own
  tint. The theme generator outputs them on fixed hues.
- **`--series-2`** — the second chart series: a true gray that recedes behind the accent in both themes.
  The theme generator outputs it.
- **`_78.util.sortAlpha(a, b)`** (a human-sort comparator: case-insensitive, locale-aware, numeric, blanks
  last; works as a Tabulator `sorter`) and **`_78.util.duration(ms, { long, parts })`** ("2 hrs 5 min",
  never "0 min").
- **`._78-list-plain`** — a list with no markers and no indent.
- **The mobile drawer keeps focus inside it** while open: Tab / Shift+Tab wrap, and the page behind is
  `inert` (the topbar and scrim stay live).
- **Tabulator responsive-collapse mode** is covered by the adapter, with a demo.
- The verified library version (Tabulator 6.5.2, FullCalendar 7.0.2, Chart.js 4.5.1) is stated beside
  every adapter CDN snippet.

### Changed

- **`_78.modal.alert()` resolves `true` when OK was clicked and `false` on any dismissal** (×, Escape,
  backdrop). It used to resolve `undefined` however it closed. *(Behavior change, non-breaking: callers
  that ignore the value are unaffected. Code like `alert(msg).then(reload)` still runs on every close, so
  gate it: `if (await _78.modal.alert(msg)) reload()`.)* `confirm()` was already correct and is unchanged.
- **The Chart.js series ramp is `--accent`, `--series-2`, then `--cat-1` … `--cat-6`.** It was accent,
  success, warn, danger, info, dim. *(Visual change: on an existing chart the second and later adopted
  series change color, and doughnut slices after the first. Pin a dataset's colors to keep the old look.)*
- **Stacked `._78-switch-row`s space themselves** (`--space-4`). Inside a `._78-flex-col` they don't, so
  the old `_78-flex-col _78-gap-16` wrapper looks the same. *(A wrapper of your own that spaces rows with
  `gap` now shows the gap plus 16px; drop one.)*
- **Plain lists inside `._78-alert-body`, `._78-card`, `._78-modal-body` and `._78-details-body` are
  indented** with their markers inside the box. *(Visual change for an unclassed `<ul>` / `<ol>` in a
  card. Lists with a class of their own, and lists anywhere else, are untouched.)*
- **The short tone classes color text anywhere**, including `._78-danger`, which until now only styled a
  `._78-menu-item`. *(An element that carried `._78-danger` as a state hook now turns danger-colored.)*
- **The sparkline end dot is a round-capped stroke**, not a `<circle>`: restyle it with `stroke` /
  `stroke-width`, not `fill`. A `._78-sparkline-dot-ring` draws its `--bg2` halo.

### Fixed

- **`dismissible: false` now holds off Escape**, not just the backdrop, and `confirm()` / `alert()` pass
  `dismissible` through (they ignored it). A hand-written dialog gets the same with
  `data-_78-dismissible="false"`.
- **The sparkline end dot stays round** at any width. It stretched into an ellipse in any container wider
  than 120px (about 33 × 5px at 786px).
- **Chart.js scales follow a live theme switch.** The grid, axis line and tick labels kept the old theme
  until a reload; the adapter now rewrites them on live scales, but only colors that still match the
  previous theme's tokens. The legend has always followed; don't set it per chart.
- **Tabulator's collapse panel** wraps long values instead of running past the table, its +/− toggle is
  visible in light theme (it was white on a pale tint, 1.1:1; now 3.95:1 light, 4.73:1 dark), and its
  font size follows `--fs-base` instead of a fixed 14px.
- **Lists inside alerts** no longer put their bullets outside the alert box.

## [0.2.0] — 2026-08-21

A component pass driven by real use: four pieces that had been hand-written in a consuming app, the
long-wanted toggle switch, and a `[hidden]` bug worth fixing on its own.

### Fixed

- **`[hidden]` is now always honored.** Any component that sets `display` (`._78-alert` and friends) beat
  the `hidden` attribute on source order, so a hidden element still rendered — a hidden alert showed as an
  empty colored bar. `reset.css` now carries `[hidden] { display: none !important }`.

### Added

- **`._78-switch`** — a toggle switch built on a real `<input type="checkbox">`, so the keyboard, focus
  ring, `:disabled` and label association are native. `-sm` size, `._78-switch-row` settings row, sizing
  through three local custom properties, light + dark.
- **`._78-seg`** — a segmented control: a joined run of buttons where exactly one is active. `_78.seg`
  mounts it as a `radiogroup` with roving tabindex, arrow / Home / End keys that step over disabled
  options, and a bubbling `_78:segchange` event. `-sm` / `-full` / `-accent` variants.
- **`._78-figure-row` / `._78-figure`** — a labeled figure trio (entry / target / stop, plan / actual /
  variance): N related numbers, each a label, a value and a tone shown as a colored left edge, using the
  existing `._78-tone-*` classes. `-sm`, `-plain` and `._78-figure-strong` variants.
- **`._78-split-bar`** — one whole divided into named, proportional segments (risk vs reward, spent vs
  remaining, pass / skip / fail), sized by `_78.viz.splitBar()` from `data-pct`. A shortfall stays as
  visible track, raw amounts over 100 are shared out, and the bar gets one `role="img"` naming every
  segment. Optional head and legend.
- **`._78-details`** — a styled disclosure: `<details>` / `<summary>` with the native marker replaced by a
  rotating CSS chevron. No JS. `-plain` / `-fill` / `-sm` variants and a `._78-details-meta` slot.
- **Color modifier aliases** — `._78-accent` / `._78-green` / `._78-warn` / `._78-red` now work anywhere,
  as aliases of the `._78-text-*` spellings.

### Changed

- **The sparkline's end-of-series dot is off by default** and opt-in with `dot: true` / `data-dot="true"`.
  It crowded a small card. *(Behavior change: a sparkline that relied on the default now draws no dot.)*
- **`._78-card-foot` is full-bleed** to the card's padding edges, like the modal foot, so an action row's
  top border reaches both sides instead of floating inset. `._78-card-foot-fill` adds the tinted surface.
- **`._78-nav` fills the sidebar height** (`flex: 1 1 auto`), so a `._78-nav-spacer` inside the optional
  `<nav>` wrapper can still push the collapse control to the bottom.

### Docs

- README, `llms.txt` and `llms-full.txt` cover every new component and option; the demo pages gained
  figure rows, split bars, the segmented control, disclosures and switches, in light and dark.
- Documented the spacing escape hatch: there is no margin utility above 16px and there are no padding
  utilities by design — use the `--space-*` tokens directly.

## [0.1.1] — 2026-08-20

Docs and copy only — no component or API changes.

### Added
- **`llms.txt` and `llms-full.txt`** — an AI-readable reference at the repo root (and on the CDN) so coding
  assistants can use the kit without scraping the docs.
- CDN install instructions and status badges in the README.

### Changed
- **Honest theming copy** — replaced the "re-theme in ~15 lines" claim (the accent tints are explicit tokens,
  so a bare `--accent` override doesn't cascade) with accurate wording across the README, tokens, demos, and
  generator; the kit is now positioned as "theme-forward."

## [0.1.0] — 2026-08-19

First public release. A vanilla, no-build UI kit you re-theme from one CSS file (or live in code) — components *and*
your third-party tables and charts recolor together, including on a live theme switch.

### Added

- **Runtime theming** — light / dark / system with a no-flash pre-paint snippet, driven by `_78.theme`;
  every change fires a `_78:themechange` event. Structure and color are separated: only color lives in the
  theme blocks, plus `-lo` tint variants and a per-theme `color-scheme`.
- **Components** — app shell (`._78-topbar` + collapse-to-rail `._78-sidebar` + mobile drawer, `_78.shell`),
  buttons, cards, KPI / stat cards, forms, badges, table, tabs, dropdown menu, and the notification set
  (modal / toast / inline alert).
- **No-library data-viz** — sparkline, progress, bar row, donut / gauge and trend, driven by `_78.viz`,
  themed through `--viz` / `--viz-lo` with no redraw on switch.
- **Library theme adapters** (opt-in, nothing vendored) — Tabulator, FullCalendar (v7 primary, v6 legacy),
  and Chart.js, each mapping the library onto kit tokens and re-theming live.
- **Theme generator** — OKLCH derivation for light and dark, WCAG AA checks, live preview, and apply / share.
- **Distribution** — MIT license, and CDN delivery via jsDelivr straight from GitHub.

### Notes

- `0.x` — the public API may change before `1.0`.

[0.3.0]: https://github.com/1978io/78UIKit/releases/tag/v0.3.0
[0.2.0]: https://github.com/1978io/78UIKit/releases/tag/v0.2.0
[0.1.1]: https://github.com/1978io/78UIKit/releases/tag/v0.1.1
[0.1.0]: https://github.com/1978io/78UIKit/releases/tag/v0.1.0
